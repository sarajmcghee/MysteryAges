import { afterEach, describe, expect, it, vi } from "vitest";
import type { Agent } from "../../raid/types/raid";

const STORAGE_KEY = "party-leader-agent-chat-threads-v1";

class MemoryStorage implements Storage {
  private readonly store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key) ?? null : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

async function loadStore(storage: Storage) {
  vi.resetModules();
  vi.stubGlobal("localStorage", storage);
  const module = await import("./chatStore");
  return module.useChatStore;
}

function agent(overrides: Partial<Agent> & Pick<Agent, "id">): Agent {
  return {
    id: overrides.id,
    handle: overrides.handle ?? "TRACE",
    role: overrides.role ?? "support",
    personality: overrides.personality ?? "",
    skillTags: overrides.skillTags ?? [],
    state: overrides.state ?? "idle",
    status: overrides.status ?? "online",
    currentTaskId: overrides.currentTaskId,
    needs: overrides.needs ?? []
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("chatStore hardening", () => {
  it("creates one isolated thread per agent with persona seed in each thread", async () => {
    const storage = new MemoryStorage();
    const useChatStore = await loadStore(storage);
    const a1 = agent({ id: "a1", handle: "SENTINEL", role: "support" });
    const a2 = agent({ id: "a2", handle: "RANGER", role: "dps" });

    useChatStore.getState().initializeAgents([a1, a2]);

    const threadA1 = useChatStore.getState().threads["a1"];
    const threadA2 = useChatStore.getState().threads["a2"];

    expect(threadA1?.messages[0]?.role).toBe("system");
    expect(threadA2?.messages[0]?.role).toBe("system");
    expect(threadA1?.messages[0]?.content).toContain("SENTINEL");
    expect(threadA2?.messages[0]?.content).toContain("RANGER");
    expect(threadA1?.messages[0]?.content).not.toEqual(threadA2?.messages[0]?.content);
  });

  it("rejects empty messages", async () => {
    const storage = new MemoryStorage();
    const useChatStore = await loadStore(storage);
    const a1 = agent({ id: "a1" });

    useChatStore.getState().initializeAgents([a1]);
    useChatStore.getState().selectAgent("a1");

    await useChatStore.getState().sendMessage(a1, "   ");

    const state = useChatStore.getState();
    expect(state.errorByAgent["a1"]).toContain("empty");
    expect(state.threads["a1"]?.messages).toHaveLength(1);
  });

  it("requires selected agent match before send", async () => {
    const storage = new MemoryStorage();
    const useChatStore = await loadStore(storage);
    const a1 = agent({ id: "a1" });
    const a2 = agent({ id: "a2" });

    useChatStore.getState().initializeAgents([a1, a2]);
    useChatStore.getState().selectAgent("a1");

    await useChatStore.getState().sendMessage(a2, "hello");

    const state = useChatStore.getState();
    expect(state.errorByAgent["a2"]).toContain("mismatch");
    expect(state.threads["a2"]?.messages).toHaveLength(1);
  });

  it("appends user/assistant messages with valid timestamps", async () => {
    const storage = new MemoryStorage();
    const useChatStore = await loadStore(storage);
    const a1 = agent({ id: "a1" });

    useChatStore.getState().initializeAgents([a1]);
    useChatStore.getState().selectAgent("a1");
    await useChatStore.getState().sendMessage(a1, "timestamp-check");

    const thread = useChatStore.getState().threads["a1"];
    const userMessage = thread?.messages.find((message) => message.role === "user");
    const assistantMessage = [...(thread?.messages ?? [])].reverse().find((message) => message.role === "assistant");

    expect(userMessage?.content).toContain("timestamp-check");
    expect(Number.isNaN(Date.parse(userMessage?.timestamp ?? ""))).toBe(false);
    expect(Number.isNaN(Date.parse(assistantMessage?.timestamp ?? ""))).toBe(false);
  });

  it("regenerate requires last assistant message", async () => {
    const storage = new MemoryStorage();
    const useChatStore = await loadStore(storage);
    const a1 = agent({ id: "a1" });

    useChatStore.getState().initializeAgents([a1]);
    useChatStore.getState().selectAgent("a1");

    await useChatStore.getState().sendMessage(a1, "hello");

    const messages = useChatStore.getState().threads["a1"]?.messages ?? [];
    expect(messages[messages.length - 1]?.role).toBe("assistant");

    await useChatStore.getState().regenerateLast(a1);
    const after = useChatStore.getState().threads["a1"]?.messages ?? [];
    expect(after[after.length - 1]?.role).toBe("assistant");

    useChatStore.setState((state) => ({
      ...state,
      threads: {
        ...state.threads,
        a1: {
          ...(state.threads["a1"] as NonNullable<typeof state.threads["a1"]>),
          messages: [...(state.threads["a1"]?.messages ?? []), { id: "u", role: "user", content: "extra", timestamp: "2026-03-08T00:00:00.000Z" }]
        }
      }
    }));

    await useChatStore.getState().regenerateLast(a1);
    expect(useChatStore.getState().errorByAgent["a1"]).toContain("last assistant");
  });

  it("keeps thread writes isolated by agent id", async () => {
    const storage = new MemoryStorage();
    const useChatStore = await loadStore(storage);
    const a1 = agent({ id: "a1" });
    const a2 = agent({ id: "a2" });

    useChatStore.getState().initializeAgents([a1, a2]);

    const beforeA2 = structuredClone(useChatStore.getState().threads["a2"]);

    useChatStore.getState().selectAgent("a1");
    await useChatStore.getState().sendMessage(a1, "hello-one");

    const state = useChatStore.getState();
    expect(state.threads["a1"]?.messages.some((message) => message.content.includes("hello-one"))).toBe(true);
    expect(state.threads["a2"]).toEqual(beforeA2);
  });

  it("reset only clears the targeted agent thread", async () => {
    const storage = new MemoryStorage();
    const useChatStore = await loadStore(storage);
    const a1 = agent({ id: "a1" });
    const a2 = agent({ id: "a2" });

    useChatStore.getState().initializeAgents([a1, a2]);

    useChatStore.getState().selectAgent("a1");
    await useChatStore.getState().sendMessage(a1, "clear-me");
    useChatStore.getState().selectAgent("a2");
    await useChatStore.getState().sendMessage(a2, "keep-me");

    const beforeA2 = structuredClone(useChatStore.getState().threads["a2"]);
    useChatStore.getState().resetThread(a1);

    const threadA1 = useChatStore.getState().threads["a1"];
    const threadA2 = useChatStore.getState().threads["a2"];

    expect(threadA1?.messages).toHaveLength(1);
    expect(threadA2).toEqual(beforeA2);
  });

  it("regenerate replaces the prior assistant response", async () => {
    const storage = new MemoryStorage();
    const useChatStore = await loadStore(storage);
    const a1 = agent({ id: "a1" });

    useChatStore.getState().initializeAgents([a1]);
    useChatStore.getState().selectAgent("a1");
    await useChatStore.getState().sendMessage(a1, "initial");

    const before = useChatStore
      .getState()
      .threads["a1"]?.messages.filter((message) => message.role === "assistant")
      .map((message) => message.content);
    await useChatStore.getState().regenerateLast(a1);
    const after = useChatStore
      .getState()
      .threads["a1"]?.messages.filter((message) => message.role === "assistant")
      .map((message) => message.content);

    expect(before).toHaveLength(1);
    expect(after).toHaveLength(1);
    expect(after?.[0]).not.toBeUndefined();
  });

  it("ensures system prompt exists and applies safe agent defaults", async () => {
    const storage = new MemoryStorage();
    const useChatStore = await loadStore(storage);
    const brokenAgent = agent({ id: "a1", handle: "", role: "" as Agent["role"] });

    useChatStore.getState().initializeAgents([brokenAgent]);

    const thread = useChatStore.getState().threads["a1"];
    expect(thread?.messages[0]?.role).toBe("system");
    expect(thread?.messages[0]?.content).toContain("AGENT-A1");
    expect(thread?.messages[0]?.content).toContain("support");
  });

  it("falls back cleanly from malformed localStorage payload", async () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, "{bad-json");

    const useChatStore = await loadStore(storage);

    expect(useChatStore.getState().threads).toEqual({});

    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        "a1": {
          agentId: "wrong",
          unread: "nope",
          messages: [{ role: "not-a-role", content: "x" }, { id: "ok", role: "user", content: "hello", timestamp: "2026-03-08T00:00:00.000Z" }]
        }
      })
    );

    const rehydrated = await loadStore(storage);
    expect(rehydrated.getState().threads["a1"]?.agentId).toBe("a1");
    expect(rehydrated.getState().threads["a1"]?.messages).toHaveLength(1);
  });

  it("persists updated threads to localStorage", async () => {
    const storage = new MemoryStorage();
    const useChatStore = await loadStore(storage);
    const a1 = agent({ id: "a1" });

    useChatStore.getState().initializeAgents([a1]);
    useChatStore.getState().selectAgent("a1");
    await useChatStore.getState().sendMessage(a1, "persist-me");

    const raw = storage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string) as Record<string, { messages: Array<{ content: string }> }>;

    expect(parsed["a1"]?.messages.some((message) => message.content.includes("persist-me"))).toBe(true);
  });
});

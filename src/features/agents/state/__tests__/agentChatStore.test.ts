import { afterEach, describe, expect, it, vi } from "vitest";

import { AGENT_CHAT_STORAGE_KEY } from "../agentChatSchema";

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
  const module = await import("../agentChatStore");
  return module.useAgentChatStore;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("agentChatStore", () => {
  it("rejects empty user messages", async () => {
    const storage = new MemoryStorage();
    const useAgentChatStore = await loadStore(storage);

    useAgentChatStore.getState().registerAgents([{ agentId: "agent-1" }]);
    useAgentChatStore.getState().selectAgent("agent-1");

    const result = useAgentChatStore.getState().sendMessage("    ");
    expect(result.ok).toBe(false);
    expect(useAgentChatStore.getState().lastError).toContain("empty");
  });

  it("requires selected existing agent before send", async () => {
    const storage = new MemoryStorage();
    const useAgentChatStore = await loadStore(storage);

    const noSelection = useAgentChatStore.getState().sendMessage("hello");
    expect(noSelection.ok).toBe(false);

    const selectMissing = useAgentChatStore.getState().selectAgent("missing-agent");
    expect(selectMissing.ok).toBe(false);
  });

  it("regenerate only works when the last message is assistant", async () => {
    const storage = new MemoryStorage();
    const useAgentChatStore = await loadStore(storage);

    useAgentChatStore.getState().registerAgents([{ agentId: "agent-1" }]);
    useAgentChatStore.getState().selectAgent("agent-1");
    useAgentChatStore.getState().sendMessage("first prompt");

    const failResult = useAgentChatStore.getState().regenerateLastAssistant();
    expect(failResult.ok).toBe(false);

    useAgentChatStore.getState().receiveAssistantReply("agent-1", "reply one");

    const okResult = useAgentChatStore.getState().regenerateLastAssistant();
    const thread = useAgentChatStore.getState().threadsByAgentId["agent-1"];

    expect(okResult.ok).toBe(true);
    expect(okResult.prompt).toBe("first prompt");
    expect(thread?.messages[thread.messages.length - 1]?.role).toBe("user");
  });

  it("keeps writes isolated by agentId thread", async () => {
    const storage = new MemoryStorage();
    const useAgentChatStore = await loadStore(storage);

    useAgentChatStore.getState().registerAgents([{ agentId: "agent-1" }, { agentId: "agent-2" }]);
    useAgentChatStore.getState().selectAgent("agent-1");
    useAgentChatStore.getState().sendMessage("hello agent-1");

    const beforeAgent2 = structuredClone(useAgentChatStore.getState().threadsByAgentId["agent-2"]);

    useAgentChatStore.getState().receiveAssistantReply("agent-1", "response for one");

    const thread1 = useAgentChatStore.getState().threadsByAgentId["agent-1"];
    const thread2 = useAgentChatStore.getState().threadsByAgentId["agent-2"];

    expect(thread1?.messages.some((message) => message.content === "response for one")).toBe(true);
    expect(thread2).toEqual(beforeAgent2);
  });

  it("ensures system prompt exists and defaults missing profile fields", async () => {
    const storage = new MemoryStorage();
    const useAgentChatStore = await loadStore(storage);

    useAgentChatStore.getState().registerAgents([{ agentId: "agent-1", handle: "", role: "", systemPrompt: "" }]);
    useAgentChatStore.getState().selectAgent("agent-1");

    const profile = useAgentChatStore.getState().registeredAgents["agent-1"];
    const thread = useAgentChatStore.getState().threadsByAgentId["agent-1"];

    expect(profile?.role).toBe("support");
    expect(profile?.systemPrompt).toBeTruthy();
    expect(thread?.messages[0]?.role).toBe("system");
    expect(thread?.messages[0]?.content).toBe(profile?.systemPrompt);
  });

  it("rehydrates from malformed storage without crashing", async () => {
    const storage = new MemoryStorage();
    storage.setItem(
      AGENT_CHAT_STORAGE_KEY,
      JSON.stringify({
        selectedAgentId: "agent-x",
        registeredAgents: {
          "agent-x": { role: "", handle: "", systemPrompt: "" }
        },
        threadsByAgentId: {
          "agent-x": { messages: [{ role: "bogus", content: "x" }], unread: "bad" }
        }
      })
    );

    const useAgentChatStore = await loadStore(storage);

    expect(useAgentChatStore.getState().registeredAgents["agent-x"]?.systemPrompt).toBeTruthy();
    expect(useAgentChatStore.getState().threadsByAgentId["agent-x"]?.messages[0]?.role).toBe("system");
  });
});

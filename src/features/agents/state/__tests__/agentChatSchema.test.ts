import { describe, expect, it } from "vitest";
import {
  defaultAgentChatState,
  loadAgentChatState,
  validateAgentChatState
} from "../agentChatSchema";

class MemoryStorage implements Pick<Storage, "getItem"> {
  constructor(private readonly content: string | null) {}

  getItem(): string | null {
    return this.content;
  }
}

describe("agentChatSchema", () => {
  it("falls back gracefully when localStorage JSON is malformed", () => {
    const result = loadAgentChatState(new MemoryStorage("{invalid-json"));

    expect(result.value).toEqual(defaultAgentChatState());
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues[0]?.reason).toContain("Failed to parse");
  });

  it("sanitizes malformed stored data and applies safe defaults", () => {
    const result = validateAgentChatState({
      selectedAgentId: "agent-1",
      registeredAgents: {
        "agent-1": { handle: "", role: "", systemPrompt: "" }
      },
      threadsByAgentId: {
        "agent-1": {
          agentId: "wrong-agent",
          unread: -10,
          messages: [
            { role: "assistant", content: "" },
            { role: "user", content: "hello" }
          ]
        }
      }
    });

    const state = result.value;
    const profile = state.registeredAgents["agent-1"];
    const thread = state.threadsByAgentId["agent-1"];

    expect(profile).toBeDefined();
    expect(profile?.systemPrompt).toBeTruthy();
    expect(profile?.role).toBe("support");

    expect(thread?.agentId).toBe("agent-1");
    expect(thread?.unread).toBe(0);
    expect(thread?.messages[0]?.role).toBe("system");
    expect(thread?.messages.some((message) => message.role === "user" && message.content === "hello")).toBe(true);
    expect(result.issues.length).toBeGreaterThan(0);
  });
});

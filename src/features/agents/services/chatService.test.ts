import { afterEach, describe, expect, it, vi } from "vitest";

import { sendAgentMessage } from "./chatService";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("sendAgentMessage", () => {
  it("rejects empty message and empty agent id", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");

    await expect(sendAgentMessage("", "hello")).rejects.toThrow("agentId is required");
    await expect(sendAgentMessage("agent-1", "   ")).rejects.toThrow("message is required");
  });

  it("rejects mismatched agent response", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({ agentId: "agent-2", reply: "wrong thread", timestamp: "2026-03-08T00:00:00.000Z" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );

    await expect(sendAgentMessage("agent-1", "ping")).rejects.toThrow("Mismatched agent response");
  });
});

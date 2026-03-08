// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AgentChatPanel } from "../AgentChatPanel";

const sendMock = vi.fn<
  (message: string) => Promise<{ agentId: string; reply: string; timestamp: string }>
>();

vi.mock("../../hooks/useAgentChat", () => ({
  useAgentChat: (agentId: string) => ({
    send: (message: string) => sendMock(message).then((reply) => ({ ...reply, agentId })),
    isSending: false,
    error: null
  })
}));

describe("AgentChatPanel", () => {
  beforeEach(() => {
    cleanup();
    sendMock.mockReset();
  });

  it("seeds persona and appends user/assistant messages", async () => {
    sendMock.mockResolvedValue({
      agentId: "agent-1",
      reply: "Roger that.",
      timestamp: "2026-03-08T01:00:00.000Z"
    });

    render(<AgentChatPanel agentId="agent-1" personaSeed="You are Sentinel." />);

    expect(screen.getByText(/You are Sentinel\./)).toBeTruthy();

    fireEvent.change(screen.getByLabelText("chat-input"), { target: { value: "Scout risks" } });
    fireEvent.submit(screen.getByRole("button", { name: "Send" }).closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(screen.getByText(/Scout risks/)).toBeTruthy();
      expect(screen.getByText(/Roger that\./)).toBeTruthy();
    });
  });

  it("reset only clears that panel thread", async () => {
    sendMock.mockResolvedValue({
      agentId: "agent-1",
      reply: "Ack",
      timestamp: "2026-03-08T01:00:00.000Z"
    });

    render(
      <>
        <AgentChatPanel agentId="agent-1" personaSeed="Persona A" />
        <AgentChatPanel agentId="agent-2" personaSeed="Persona B" />
      </>
    );

    fireEvent.change(screen.getAllByLabelText("chat-input")[0], { target: { value: "a" } });
    fireEvent.submit(screen.getAllByRole("button", { name: "Send" })[0].closest("form") as HTMLFormElement);

    fireEvent.change(screen.getAllByLabelText("chat-input")[1], { target: { value: "b" } });
    fireEvent.submit(screen.getAllByRole("button", { name: "Send" })[1].closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(screen.getByText((_, node) => node?.textContent?.startsWith("user: a") ?? false)).toBeTruthy();
      expect(screen.getByText((_, node) => node?.textContent?.startsWith("user: b") ?? false)).toBeTruthy();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Reset Thread" })[0]);

    await waitFor(() => {
      const logs = screen.getAllByTestId("chat-log");
      expect(logs[0]?.textContent?.includes("user: a")).toBe(false);
      expect(logs[1]?.textContent?.includes("user: b")).toBe(true);
    });
  });

  it("regenerate replaces the last assistant response", async () => {
    sendMock
      .mockResolvedValueOnce({
        agentId: "agent-1",
        reply: "First response",
        timestamp: "2026-03-08T01:00:00.000Z"
      })
      .mockResolvedValueOnce({
        agentId: "agent-1",
        reply: "Regenerated response",
        timestamp: "2026-03-08T01:01:00.000Z"
      });

    render(<AgentChatPanel agentId="agent-1" personaSeed="Persona A" />);

    fireEvent.change(screen.getByLabelText("chat-input"), { target: { value: "Need a plan" } });
    fireEvent.submit(screen.getByRole("button", { name: "Send" }).closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(screen.getByText(/First response/)).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Regenerate Last Response" }));

    await waitFor(() => {
      expect(screen.getByText(/Regenerated response/)).toBeTruthy();
      expect(screen.queryByText(/First response/)).toBeNull();
    });

    expect(screen.getAllByTestId("msg-assistant")).toHaveLength(1);
  });
});

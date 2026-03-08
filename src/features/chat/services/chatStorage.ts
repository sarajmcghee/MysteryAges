import type { ID } from "../../raid/types/raid";
import type { AgentChatThread } from "../types/chat";

const STORAGE_KEY = "party-leader-chat-threads-v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asThread(value: unknown): AgentChatThread | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  if (typeof value.agentId !== "string" || !Array.isArray(value.messages)) {
    return undefined;
  }

  const messages = value.messages.filter((message) => {
    if (!isRecord(message)) {
      return false;
    }

    return (
      typeof message.id === "string" &&
      typeof message.agentId === "string" &&
      (message.role === "system" || message.role === "user" || message.role === "assistant") &&
      typeof message.content === "string" &&
      typeof message.timestamp === "string"
    );
  });

  return {
    agentId: value.agentId,
    messages
  };
}

function parseThreads(raw: string): Record<ID, AgentChatThread> {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) {
      return {};
    }

    const threads: Record<ID, AgentChatThread> = {};
    for (const [key, value] of Object.entries(parsed)) {
      const thread = asThread(value);
      if (thread) {
        threads[key] = thread;
      }
    }

    return threads;
  } catch {
    return {};
  }
}

export const chatStorage = {
  loadThreads(): Record<ID, AgentChatThread> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return {};
      }

      return parseThreads(raw);
    } catch {
      return {};
    }
  },

  saveThreads(threads: Record<ID, AgentChatThread>): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  }
};

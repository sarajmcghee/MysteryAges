import { create } from "zustand";
import { sendAgentMessage } from "../services/chatService";
import type { Agent } from "../../raid/types/raid";
import type { AgentThread, ChatMessage, ChatRole } from "../types/chat";

interface ChatStore {
  selectedAgentId?: string | undefined;
  threads: Record<string, AgentThread>;
  isSendingByAgent: Record<string, boolean>;
  errorByAgent: Record<string, string | undefined>;
  initializeAgents: (agents: Agent[]) => void;
  selectAgent: (agentId: string) => void;
  sendMessage: (agent: Agent, text: string) => Promise<void>;
  resetThread: (agent: Agent) => void;
  regenerateLast: (agent: Agent) => Promise<void>;
}

const STORAGE_KEY = "party-leader-agent-chat-threads-v1";
const nowIso = () => new Date().toISOString();
const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
const CHAT_ROLES: readonly ChatRole[] = ["system", "user", "assistant"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function asRole(value: unknown): ChatRole | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  return CHAT_ROLES.includes(value as ChatRole) ? (value as ChatRole) : undefined;
}

function asNonNegativeInt(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return 0;
  }
  return Math.floor(value);
}

function agentHandle(agent: Agent): string {
  return asNonEmptyString(agent.handle) ?? `AGENT-${agent.id.slice(0, 6).toUpperCase()}`;
}

function agentRole(agent: Agent): string {
  return asNonEmptyString(agent.role) ?? "support";
}

function systemPrompt(agent: Agent): string {
  return `${agentHandle(agent)} (${agentRole(agent)}) is online. Ask for status, blockers, or next action.`;
}

function introMessage(agent: Agent): ChatMessage {
  return {
    id: uid("msg"),
    role: "system",
    content: systemPrompt(agent),
    timestamp: nowIso()
  };
}

function fallbackReply(agent: Agent, text: string): string {
  const prompt = text.trim().toLowerCase();
  if (prompt.includes("block") || prompt.includes("stuck")) {
    return `${agentHandle(agent)}: I can proceed once dependencies clear. Suggestion: reassign a support task while we unblock.`;
  }
  if (prompt.includes("status") || prompt.includes("update")) {
    return `${agentHandle(agent)}: Current state is ${agent.state}. I can take one more task if priority is P1 or P2.`;
  }
  return `${agentHandle(agent)}: Acknowledged. I'll execute this now and post another update when complete.`;
}

function sanitizeMessage(value: unknown): ChatMessage | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const role = asRole(value.role);
  const content = asNonEmptyString(value.content);
  if (!role || !content) {
    return undefined;
  }

  return {
    id: asNonEmptyString(value.id) ?? uid("msg"),
    role,
    content,
    timestamp: asNonEmptyString(value.timestamp) ?? nowIso(),
    pending: typeof value.pending === "boolean" ? value.pending : undefined,
    error: asNonEmptyString(value.error)
  };
}

function sanitizeThread(agentId: string, value: unknown): AgentThread | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const rawMessages = Array.isArray(value.messages) ? value.messages : [];
  const messages = rawMessages.map(sanitizeMessage).filter((message): message is ChatMessage => Boolean(message));

  return {
    agentId,
    unread: asNonNegativeInt(value.unread),
    messages
  };
}

function loadPersistedThreads(): Record<string, AgentThread> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) {
      return {};
    }

    const entries = Object.entries(parsed)
      .map(([agentId, value]) => [agentId, sanitizeThread(agentId, value)] as const)
      .filter((entry): entry is readonly [string, AgentThread] => Boolean(entry[1]));

    return Object.fromEntries(entries);
  } catch {
    return {};
  }
}

function savePersistedThreads(threads: Record<string, AgentThread>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  } catch {
    // Persistence failures are non-fatal.
  }
}

function ensureSystemMessage(thread: AgentThread, agent: Agent): AgentThread {
  const expected = systemPrompt(agent);
  const systemIndex = thread.messages.findIndex((message) => message.role === "system");

  if (systemIndex === -1) {
    return {
      ...thread,
      messages: [introMessage(agent), ...thread.messages]
    };
  }

  const currentSystem = thread.messages[systemIndex];
  if (currentSystem && currentSystem.content === expected) {
    return thread;
  }

  return {
    ...thread,
    messages: thread.messages.map((message, index) =>
      index === systemIndex
        ? {
            ...message,
            content: expected
          }
        : message
    )
  };
}

function ensureAgentThread(threads: Record<string, AgentThread>, agent: Agent): AgentThread {
  const existing = threads[agent.id];
  if (!existing) {
    return {
      agentId: agent.id,
      unread: 0,
      messages: [introMessage(agent)]
    };
  }

  return ensureSystemMessage(
    {
      ...existing,
      agentId: agent.id
    },
    agent
  );
}

function withThreadMessage(
  state: ChatStore,
  agent: Agent,
  nextMessage: ChatMessage,
  unread: number
): Record<string, AgentThread> {
  const thread = ensureAgentThread(state.threads, agent);
  return {
    ...state.threads,
    [agent.id]: {
      ...thread,
      unread,
      messages: [...thread.messages, nextMessage]
    }
  };
}

async function resolveReply(agent: Agent, content: string): Promise<{ replyText: string; replyError?: string | undefined }> {
  try {
    const hasApi = Boolean(import.meta.env.VITE_API_BASE_URL);
    if (!hasApi) {
      await new Promise((resolve) => setTimeout(resolve, 260));
      return { replyText: fallbackReply(agent, content) };
    }

    const response = await sendAgentMessage(agent.id, content);
    return { replyText: response.reply };
  } catch (error) {
    return {
      replyText: fallbackReply(agent, content),
      replyError: error instanceof Error ? error.message : "Failed to reach chat service"
    };
  }
}

const initialThreads = loadPersistedThreads();

export const useChatStore = create<ChatStore>((set, get) => ({
  selectedAgentId: undefined,
  threads: initialThreads,
  isSendingByAgent: {},
  errorByAgent: {},

  initializeAgents: (agents) => {
    set((state) => {
      const nextThreads = { ...state.threads };

      for (const agent of agents) {
        nextThreads[agent.id] = ensureAgentThread(nextThreads, agent);
      }

      const nextSelected = state.selectedAgentId ?? agents[0]?.id;
      if (nextSelected && nextThreads[nextSelected]) {
        nextThreads[nextSelected] = {
          ...nextThreads[nextSelected],
          unread: 0
        };
      }

      return {
        threads: nextThreads,
        selectedAgentId: nextSelected
      };
    });
  },

  selectAgent: (agentId) => {
    set((state) => {
      const thread = state.threads[agentId];
      if (!thread) {
        return {
          ...state,
          errorByAgent: {
            ...state.errorByAgent,
            [agentId]: `Selected agent thread does not exist: ${agentId}`
          }
        };
      }
      return {
        selectedAgentId: agentId,
        threads: {
          ...state.threads,
          [agentId]: {
            ...thread,
            unread: 0
          }
        },
        errorByAgent: {
          ...state.errorByAgent,
          [agentId]: undefined
        }
      };
    });
  },

  sendMessage: async (agent, text) => {
    const content = text.trim();
    if (!content) {
      set((state) => ({
        errorByAgent: {
          ...state.errorByAgent,
          [agent.id]: "Message cannot be empty."
        }
      }));
      return;
    }

    const selected = get().selectedAgentId;
    if (!selected || selected !== agent.id) {
      set((state) => ({
        errorByAgent: {
          ...state.errorByAgent,
          [agent.id]: "Selected agent mismatch."
        }
      }));
      return;
    }

    set((state) => ({
      threads: withThreadMessage(
        state,
        agent,
        {
          id: uid("msg"),
          role: "user",
          content,
          timestamp: nowIso()
        },
        0
      ),
      isSendingByAgent: {
        ...state.isSendingByAgent,
        [agent.id]: true
      },
      errorByAgent: {
        ...state.errorByAgent,
        [agent.id]: undefined
      }
    }));

    const { replyText, replyError } = await resolveReply(agent, content);

    set((state) => {
      const isSelected = state.selectedAgentId === agent.id;
      return {
        threads: withThreadMessage(
          state,
          agent,
          {
            id: uid("msg"),
            role: "assistant",
            content: replyText,
            timestamp: nowIso(),
            error: replyError
          },
          isSelected ? 0 : (state.threads[agent.id]?.unread ?? 0) + 1
        ),
        isSendingByAgent: {
          ...state.isSendingByAgent,
          [agent.id]: false
        },
        errorByAgent: {
          ...state.errorByAgent,
          [agent.id]: replyError
        }
      };
    });
  },

  resetThread: (agent) => {
    set((state) => ({
      threads: {
        ...state.threads,
        [agent.id]: {
          agentId: agent.id,
          unread: 0,
          messages: [introMessage(agent)]
        }
      },
      errorByAgent: {
        ...state.errorByAgent,
        [agent.id]: undefined
      }
    }));
  },

  regenerateLast: async (agent) => {
    const selected = get().selectedAgentId;
    if (!selected || selected !== agent.id) {
      set((state) => ({
        errorByAgent: {
          ...state.errorByAgent,
          [agent.id]: "Selected agent mismatch."
        }
      }));
      return;
    }

    const thread = get().threads[agent.id] ?? ensureAgentThread(get().threads, agent);
    const lastMessage = thread.messages[thread.messages.length - 1];

    if (!lastMessage || lastMessage.role !== "assistant") {
      set((state) => ({
        errorByAgent: {
          ...state.errorByAgent,
          [agent.id]: "Regenerate requires last assistant message."
        }
      }));
      return;
    }

    const priorMessages = thread.messages.slice(0, -1);
    const lastUser = [...priorMessages].reverse().find((message) => message.role === "user");
    if (!lastUser) {
      set((state) => ({
        errorByAgent: {
          ...state.errorByAgent,
          [agent.id]: "No user message available to regenerate."
        }
      }));
      return;
    }

    set((state) => ({
      threads: {
        ...state.threads,
        [agent.id]: {
          ...thread,
          messages: priorMessages,
          unread: 0
        }
      },
      isSendingByAgent: {
        ...state.isSendingByAgent,
        [agent.id]: true
      },
      errorByAgent: {
        ...state.errorByAgent,
        [agent.id]: undefined
      }
    }));

    const { replyText, replyError } = await resolveReply(agent, lastUser.content);

    set((state) => ({
      threads: withThreadMessage(
        state,
        agent,
        {
          id: uid("msg"),
          role: "assistant",
          content: replyText,
          timestamp: nowIso(),
          error: replyError
        },
        0
      ),
      isSendingByAgent: {
        ...state.isSendingByAgent,
        [agent.id]: false
      },
      errorByAgent: {
        ...state.errorByAgent,
        [agent.id]: replyError
      }
    }));
  }
}));

useChatStore.subscribe((state) => {
  savePersistedThreads(state.threads);
});

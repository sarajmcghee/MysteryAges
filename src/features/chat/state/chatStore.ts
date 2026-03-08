import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { ID } from "../../raid/types/raid";
import { MockAgentChatApi } from "../services/chatApi";
import { chatStorage } from "../services/chatStorage";
import type { AgentChatApi, AgentChatThread, ChatAgentUI, ChatMessage } from "../types/chat";
import { buildAgentSystemPrompt } from "../utils/promptBuilder";

interface ChatSlice {
  threads: Record<ID, AgentChatThread>;
  api: AgentChatApi;
}

interface ChatActions {
  setApiClient: (api: AgentChatApi) => void;
  sendMessage: (agent: ChatAgentUI, content: string) => Promise<void>;
  receiveMessage: (agentId: ID, content: string, timestamp?: string) => void;
  resetThread: (agent: ChatAgentUI) => void;
  regenerateLast: (agent: ChatAgentUI) => Promise<void>;
}

export type ChatStore = ChatSlice & ChatActions;

function createMessage(agentId: ID, role: ChatMessage["role"], content: string, timestamp?: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    agentId,
    role,
    content,
    timestamp: timestamp ?? new Date().toISOString()
  };
}

function seedThread(agent: ChatAgentUI): AgentChatThread {
  return {
    agentId: agent.id,
    messages: [createMessage(agent.id, "system", buildAgentSystemPrompt(agent))]
  };
}

function ensureThread(
  existingThreads: Record<ID, AgentChatThread>,
  agent: ChatAgentUI
): { threads: Record<ID, AgentChatThread>; thread: AgentChatThread } {
  const current = existingThreads[agent.id];
  if (current) {
    return { threads: existingThreads, thread: current };
  }

  const seeded = seedThread(agent);
  return {
    threads: {
      ...existingThreads,
      [agent.id]: seeded
    },
    thread: seeded
  };
}

const initialThreads = chatStorage.loadThreads();

export const useChatStore = create<ChatStore>()(
  subscribeWithSelector((set, get) => ({
    threads: initialThreads,
    api: new MockAgentChatApi(),

    setApiClient: (api) => {
      set({ api });
    },

    sendMessage: async (agent, content) => {
      const cleanContent = content.trim();
      if (!cleanContent) {
        return;
      }

      const userMessage = createMessage(agent.id, "user", cleanContent);

      set((state) => {
        const ensured = ensureThread(state.threads, agent);
        return {
          threads: {
            ...ensured.threads,
            [agent.id]: {
              ...ensured.thread,
              messages: [...ensured.thread.messages, userMessage]
            }
          }
        };
      });

      const nextThread = get().threads[agent.id];
      if (!nextThread) {
        return;
      }

      const response = await get().api.sendMessage({
        agent,
        thread: nextThread,
        userMessage
      });

      get().receiveMessage(agent.id, response.content, response.timestamp);
    },

    receiveMessage: (agentId, content, timestamp) => {
      set((state) => {
        const current = state.threads[agentId];
        if (!current) {
          return state;
        }

        return {
          threads: {
            ...state.threads,
            [agentId]: {
              ...current,
              messages: [...current.messages, createMessage(agentId, "assistant", content, timestamp)]
            }
          }
        };
      });
    },

    resetThread: (agent) => {
      set((state) => ({
        threads: {
          ...state.threads,
          [agent.id]: seedThread(agent)
        }
      }));
    },

    regenerateLast: async (agent) => {
      let latestUserMessage: ChatMessage | undefined;

      set((state) => {
        const ensured = ensureThread(state.threads, agent);
        const existingMessages = [...ensured.thread.messages];
        const assistantIndex = [...existingMessages].reverse().findIndex((message) => message.role === "assistant");
        if (assistantIndex !== -1) {
          const absoluteIndex = existingMessages.length - 1 - assistantIndex;
          existingMessages.splice(absoluteIndex, 1);
        }

        latestUserMessage = [...existingMessages].reverse().find((message) => message.role === "user");

        return {
          threads: {
            ...ensured.threads,
            [agent.id]: {
              ...ensured.thread,
              messages: existingMessages
            }
          }
        };
      });

      if (!latestUserMessage) {
        return;
      }

      const regeneratedThread = get().threads[agent.id];
      if (!regeneratedThread) {
        return;
      }

      const response = await get().api.sendMessage({
        agent,
        thread: regeneratedThread,
        userMessage: latestUserMessage
      });

      get().receiveMessage(agent.id, response.content, response.timestamp);
    }
  }))
);

useChatStore.subscribe(
  (state) => state.threads,
  (threads) => {
    chatStorage.saveThreads(threads);
  }
);

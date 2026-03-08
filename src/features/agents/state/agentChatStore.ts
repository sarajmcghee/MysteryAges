import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { ChatMessage } from "../types/chat";
import {
  ensureAgentThread,
  loadAgentChatState,
  saveAgentChatState,
  type AgentChatState,
  type AgentPromptProfile
} from "./agentChatSchema";

interface RegisterAgentInput {
  agentId: string;
  handle?: string | undefined;
  role?: string | undefined;
  systemPrompt?: string | undefined;
}

interface ActionResult {
  ok: boolean;
  error?: string | undefined;
}

interface RegenerateResult extends ActionResult {
  prompt?: string | undefined;
}

interface AgentChatActions {
  registerAgents: (agents: RegisterAgentInput[]) => void;
  selectAgent: (agentId: string) => ActionResult;
  sendMessage: (rawMessage: string) => ActionResult;
  receiveAssistantReply: (agentId: string, rawMessage: string) => ActionResult;
  resetThread: (agentId: string) => ActionResult;
  regenerateLastAssistant: () => RegenerateResult;
  clearError: () => void;
}

export type AgentChatStore = AgentChatState & AgentChatActions;

function nowIso(): string {
  return new Date().toISOString();
}

function messageId(role: "user" | "assistant"): string {
  return `${role}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeUserInput(value: string): string {
  return value.trim();
}

function withError(state: AgentChatState, error: string): AgentChatState {
  return {
    ...state,
    lastError: error
  };
}

const storageRef: Storage | undefined = typeof localStorage === "undefined" ? undefined : localStorage;
const loadResult = loadAgentChatState(
  storageRef ?? {
    getItem: () => null
  }
);
const initialState = loadResult.issues.length
  ? {
      ...loadResult.value,
      lastError: loadResult.issues[0]?.reason
    }
  : loadResult.value;

function hasAgent(state: AgentChatState, agentId: string): boolean {
  return Boolean(state.registeredAgents[agentId]);
}

function appendMessage(state: AgentChatState, agentId: string, message: ChatMessage): AgentChatState {
  const withThread = ensureAgentThread(state, agentId);
  const currentThread = withThread.threadsByAgentId[agentId];
  if (!currentThread) {
    return withError(state, "Agent thread unavailable.");
  }

  return {
    ...withThread,
    threadsByAgentId: {
      ...withThread.threadsByAgentId,
      [agentId]: {
        ...currentThread,
        messages: [...currentThread.messages, message]
      }
    },
    lastError: undefined
  };
}

export const useAgentChatStore = create<AgentChatStore>()(
  subscribeWithSelector((set) => ({
    ...initialState,

    registerAgents: (agents) => {
      set((state) => {
        let nextState: AgentChatState = state;

        for (const item of agents) {
          const agentId = item.agentId.trim();
          if (!agentId) {
            continue;
          }

          const safeProfile: AgentPromptProfile = {
            agentId,
            handle: item.handle?.trim() || `AGENT-${agentId.slice(0, 6).toUpperCase()}`,
            role: item.role?.trim() || "support",
            systemPrompt:
              item.systemPrompt?.trim() ||
              `You are ${item.handle?.trim() || `AGENT-${agentId.slice(0, 6).toUpperCase()}`}, operating as ${item.role?.trim() || "support"}. Keep replies concise, factual, and scoped to this agent thread only.`
          };

          nextState = ensureAgentThread(
            {
              ...nextState,
              registeredAgents: {
                ...nextState.registeredAgents,
                [agentId]: safeProfile
              }
            },
            agentId
          );
        }

        return {
          ...nextState,
          lastError: undefined
        };
      });
    },

    selectAgent: (agentId) => {
      const normalizedId = agentId.trim();
      if (!normalizedId) {
        set((state) => withError(state, "No agent selected."));
        return { ok: false, error: "No agent selected." };
      }

      let success = false;
      set((state) => {
        if (!hasAgent(state, normalizedId)) {
          return withError(state, `Selected agent does not exist: ${normalizedId}`);
        }

        success = true;
        return {
          ...ensureAgentThread(state, normalizedId),
          selectedAgentId: normalizedId,
          lastError: undefined
        };
      });

      return success ? { ok: true } : { ok: false, error: `Selected agent does not exist: ${normalizedId}` };
    },

    sendMessage: (rawMessage) => {
      const message = normalizeUserInput(rawMessage);
      if (!message) {
        set((state) => withError(state, "Message cannot be empty."));
        return { ok: false, error: "Message cannot be empty." };
      }

      let success = false;
      set((state) => {
        const selectedAgentId = state.selectedAgentId;
        if (!selectedAgentId) {
          return withError(state, "No agent selected.");
        }

        if (!hasAgent(state, selectedAgentId)) {
          return withError(state, `Selected agent does not exist: ${selectedAgentId}`);
        }

        success = true;
        return appendMessage(state, selectedAgentId, {
          id: messageId("user"),
          role: "user",
          content: message,
          timestamp: nowIso()
        });
      });

      return success ? { ok: true } : { ok: false, error: "Failed to send message." };
    },

    receiveAssistantReply: (agentId, rawMessage) => {
      const normalizedAgentId = agentId.trim();
      const message = normalizeUserInput(rawMessage);

      if (!normalizedAgentId) {
        set((state) => withError(state, "Reply agent is required."));
        return { ok: false, error: "Reply agent is required." };
      }

      if (!message) {
        set((state) => withError(state, "Reply cannot be empty."));
        return { ok: false, error: "Reply cannot be empty." };
      }

      let success = false;
      set((state) => {
        if (!hasAgent(state, normalizedAgentId)) {
          return withError(state, `Reply agent does not exist: ${normalizedAgentId}`);
        }

        success = true;
        return appendMessage(state, normalizedAgentId, {
          id: messageId("assistant"),
          role: "assistant",
          content: message,
          timestamp: nowIso()
        });
      });

      return success ? { ok: true } : { ok: false, error: "Failed to receive assistant reply." };
    },

    resetThread: (agentId) => {
      const normalizedAgentId = agentId.trim();
      if (!normalizedAgentId) {
        set((state) => withError(state, "Reset agent is required."));
        return { ok: false, error: "Reset agent is required." };
      }

      let success = false;
      set((state) => {
        const profile = state.registeredAgents[normalizedAgentId];
        if (!profile) {
          return withError(state, `Reset agent does not exist: ${normalizedAgentId}`);
        }

        success = true;
        return {
          ...state,
          threadsByAgentId: {
            ...state.threadsByAgentId,
            [normalizedAgentId]: {
              agentId: normalizedAgentId,
              unread: 0,
              messages: [
                {
                  id: `sys-${normalizedAgentId}`,
                  role: "system",
                  content: profile.systemPrompt,
                  timestamp: new Date(0).toISOString()
                }
              ]
            }
          },
          lastError: undefined
        };
      });

      return success ? { ok: true } : { ok: false, error: "Failed to reset thread." };
    },

    regenerateLastAssistant: () => {
      let response: RegenerateResult = { ok: false, error: "No agent selected." };

      set((state) => {
        const selectedAgentId = state.selectedAgentId;
        if (!selectedAgentId) {
          response = { ok: false, error: "No agent selected." };
          return withError(state, "No agent selected.");
        }

        const thread = state.threadsByAgentId[selectedAgentId];
        if (!thread || thread.messages.length === 0) {
          response = { ok: false, error: "No messages available to regenerate." };
          return withError(state, "No messages available to regenerate.");
        }

        const lastMessage = thread.messages[thread.messages.length - 1];
        if (!lastMessage || lastMessage.role !== "assistant") {
          response = { ok: false, error: "Regenerate requires the last message to be assistant." };
          return withError(state, "Regenerate requires the last message to be assistant.");
        }

        const nextMessages = thread.messages.slice(0, -1);
        const lastUser = [...nextMessages].reverse().find((message) => message.role === "user");

        response = {
          ok: true,
          prompt: lastUser?.content
        };

        return {
          ...state,
          threadsByAgentId: {
            ...state.threadsByAgentId,
            [selectedAgentId]: {
              ...thread,
              messages: nextMessages
            }
          },
          lastError: undefined
        };
      });

      return response;
    },

    clearError: () => {
      set((state) => ({
        ...state,
        lastError: undefined
      }));
    }
  }))
);

useAgentChatStore.subscribe(
  (state) => ({
    selectedAgentId: state.selectedAgentId,
    registeredAgents: state.registeredAgents,
    threadsByAgentId: state.threadsByAgentId,
    lastError: state.lastError
  }),
  (chatState) => {
    if (!storageRef) {
      return;
    }
    saveAgentChatState(storageRef, chatState);
  }
);

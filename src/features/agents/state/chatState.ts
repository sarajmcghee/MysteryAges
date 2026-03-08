import type {
  AgentChatMutationContext,
  AgentChatPersistedShape,
  AgentChatState,
  AgentChatThread,
  ChatMessage,
  ChatRole
} from "./chatTypes";

const DEFAULT_PERSONA = "You are a reliable raid agent. Keep responses concise and actionable.";

export const defaultChatContext: AgentChatMutationContext = {
  nowIso: () => new Date().toISOString(),
  messageId: () => `msg-${Math.random().toString(36).slice(2, 10)}`
};

export function createEmptyAgentChatState(): AgentChatState {
  return {
    activeAgentId: undefined,
    threadsByAgentId: {}
  };
}

function makeMessage(
  context: AgentChatMutationContext,
  role: ChatRole,
  content: string
): ChatMessage {
  return {
    id: context.messageId(),
    role,
    content,
    timestamp: context.nowIso()
  };
}

function createPersonaThread(
  agentId: string,
  personaSeed: string,
  context: AgentChatMutationContext
): AgentChatThread {
  const seed = personaSeed.trim() || DEFAULT_PERSONA;
  return {
    agentId,
    personaSeed: seed,
    messages: [makeMessage(context, "system", seed)]
  };
}

function getOrCreateThread(
  state: AgentChatState,
  agentId: string,
  personaSeed: string,
  context: AgentChatMutationContext
): AgentChatThread {
  const existing = state.threadsByAgentId[agentId];
  if (existing) {
    return existing;
  }
  return createPersonaThread(agentId, personaSeed, context);
}

export function openAgentThread(
  state: AgentChatState,
  agentId: string,
  personaSeed: string,
  context: AgentChatMutationContext = defaultChatContext
): AgentChatState {
  const thread = getOrCreateThread(state, agentId, personaSeed, context);
  return {
    activeAgentId: agentId,
    threadsByAgentId: {
      ...state.threadsByAgentId,
      [agentId]: thread
    }
  };
}

export function appendMessage(
  state: AgentChatState,
  agentId: string,
  personaSeed: string,
  role: ChatRole,
  content: string,
  context: AgentChatMutationContext = defaultChatContext
): AgentChatState {
  const trimmed = content.trim();
  if (!trimmed) {
    return openAgentThread(state, agentId, personaSeed, context);
  }

  const thread = getOrCreateThread(state, agentId, personaSeed, context);
  return {
    activeAgentId: agentId,
    threadsByAgentId: {
      ...state.threadsByAgentId,
      [agentId]: {
        ...thread,
        messages: [...thread.messages, makeMessage(context, role, trimmed)]
      }
    }
  };
}

export function resetThread(
  state: AgentChatState,
  agentId: string,
  personaSeed: string,
  context: AgentChatMutationContext = defaultChatContext
): AgentChatState {
  return {
    ...state,
    activeAgentId: state.activeAgentId === agentId ? agentId : state.activeAgentId,
    threadsByAgentId: {
      ...state.threadsByAgentId,
      [agentId]: createPersonaThread(agentId, personaSeed, context)
    }
  };
}

export function getLastUserMessage(thread: AgentChatThread | undefined): ChatMessage | undefined {
  if (!thread) {
    return undefined;
  }
  for (let index = thread.messages.length - 1; index >= 0; index -= 1) {
    const current = thread.messages[index];
    if (current && current.role === "user") {
      return current;
    }
  }
  return undefined;
}

export function regenerateLastAssistant(
  state: AgentChatState,
  agentId: string,
  personaSeed: string,
  content: string,
  context: AgentChatMutationContext = defaultChatContext
): AgentChatState {
  const trimmed = content.trim();
  if (!trimmed) {
    return openAgentThread(state, agentId, personaSeed, context);
  }

  const thread = getOrCreateThread(state, agentId, personaSeed, context);
  const lastAssistantIndex = [...thread.messages]
    .map((message, index) => ({ message, index }))
    .reverse()
    .find((entry) => entry.message.role === "assistant")?.index;

  const nextMessage = makeMessage(context, "assistant", trimmed);

  const nextMessages =
    lastAssistantIndex == null
      ? [...thread.messages, nextMessage]
      : thread.messages.map((message, index) => (index === lastAssistantIndex ? nextMessage : message));

  return {
    activeAgentId: agentId,
    threadsByAgentId: {
      ...state.threadsByAgentId,
      [agentId]: {
        ...thread,
        messages: nextMessages
      }
    }
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function sanitizeMessage(value: unknown): ChatMessage | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const roleRaw = asString(value.role);
  const role: ChatRole | undefined = roleRaw === "system" || roleRaw === "user" || roleRaw === "assistant" ? roleRaw : undefined;
  const id = asString(value.id);
  const content = asString(value.content);
  const timestamp = asString(value.timestamp);

  if (!role || !id || !content || !timestamp) {
    return undefined;
  }

  return { id, role, content, timestamp };
}

function sanitizeThread(agentId: string, value: unknown): AgentChatThread | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const personaSeed = asString(value.personaSeed) ?? DEFAULT_PERSONA;
  const sourceMessages = Array.isArray(value.messages) ? value.messages : [];
  const messages = sourceMessages.map(sanitizeMessage).filter((item): item is ChatMessage => Boolean(item));

  const hasSystemSeed = messages.some((message) => message.role === "system" && message.content === personaSeed);

  return {
    agentId,
    personaSeed,
    messages: hasSystemSeed
      ? messages
      : [
          {
            id: "seed-fallback",
            role: "system",
            content: personaSeed,
            timestamp: new Date(0).toISOString()
          },
          ...messages
        ]
  };
}

export function sanitizePersistedAgentChatState(raw: AgentChatPersistedShape | unknown): AgentChatState {
  if (!isRecord(raw)) {
    return createEmptyAgentChatState();
  }

  const threadRecord = isRecord(raw.threadsByAgentId) ? raw.threadsByAgentId : {};
  const entries = Object.entries(threadRecord)
    .map(([agentId, value]) => [agentId, sanitizeThread(agentId, value)] as const)
    .filter((entry): entry is readonly [string, AgentChatThread] => Boolean(entry[1]));

  const threadsByAgentId = Object.fromEntries(entries);
  const activeAgentId = asString(raw.activeAgentId);

  return {
    activeAgentId: activeAgentId && threadsByAgentId[activeAgentId] ? activeAgentId : undefined,
    threadsByAgentId
  };
}

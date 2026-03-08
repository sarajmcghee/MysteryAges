import type { AgentThread, ChatMessage, ChatRole } from "../types/chat";

export const AGENT_CHAT_STORAGE_KEY = "party-leader-agent-chat-v1";

export interface AgentPromptProfile {
  agentId: string;
  handle: string;
  role: string;
  systemPrompt: string;
}

export interface AgentChatState {
  selectedAgentId?: string | undefined;
  registeredAgents: Record<string, AgentPromptProfile>;
  threadsByAgentId: Record<string, AgentThread>;
  lastError?: string | undefined;
}

export interface ValidationIssue {
  path: string;
  reason: string;
}

export interface ValidationResult<T> {
  value: T;
  issues: ValidationIssue[];
}

const ALLOWED_ROLES: readonly ChatRole[] = ["system", "user", "assistant"];

function nowIso(): string {
  return new Date().toISOString();
}

function messageId(): string {
  return `msg-${Math.random().toString(36).slice(2, 10)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function asNonNegativeInt(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return 0;
  }
  return Math.floor(value);
}

function asRole(value: unknown): ChatRole | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  return ALLOWED_ROLES.includes(value as ChatRole) ? (value as ChatRole) : undefined;
}

function defaultHandle(agentId: string): string {
  return `AGENT-${agentId.slice(0, 6).toUpperCase()}`;
}

function defaultSystemPrompt(handle: string, role: string): string {
  return `You are ${handle}, operating as ${role}. Keep replies concise, factual, and scoped to this agent thread only.`;
}

export function defaultPromptProfile(agentId: string, partial?: Partial<Omit<AgentPromptProfile, "agentId">>): AgentPromptProfile {
  const handle = asString(partial?.handle) ?? defaultHandle(agentId);
  const role = asString(partial?.role) ?? "support";
  const systemPrompt = asString(partial?.systemPrompt) ?? defaultSystemPrompt(handle, role);

  return {
    agentId,
    handle,
    role,
    systemPrompt
  };
}

function defaultSystemMessage(agentId: string, prompt: string): ChatMessage {
  return {
    id: `sys-${agentId}`,
    role: "system",
    content: prompt,
    timestamp: new Date(0).toISOString()
  };
}

function sanitizeMessage(value: unknown, path: string, issues: ValidationIssue[]): ChatMessage | undefined {
  const input = isRecord(value) ? value : {};
  const role = asRole(input.role);
  const content = asString(input.content);
  if (!role || !content) {
    issues.push({ path, reason: "Invalid message role/content" });
    return undefined;
  }

  return {
    id: asString(input.id) ?? messageId(),
    role,
    content,
    timestamp: asString(input.timestamp) ?? nowIso(),
    pending: typeof input.pending === "boolean" ? input.pending : undefined,
    error: asString(input.error)
  };
}

function ensureSystemMessage(agentId: string, thread: AgentThread, prompt: string): AgentThread {
  const existingSystem = thread.messages.find((message) => message.role === "system");
  if (!existingSystem) {
    return {
      ...thread,
      messages: [defaultSystemMessage(agentId, prompt), ...thread.messages]
    };
  }

  if (existingSystem.content === prompt) {
    return thread;
  }

  return {
    ...thread,
    messages: thread.messages.map((message) =>
      message.id === existingSystem.id ? { ...message, content: prompt } : message
    )
  };
}

function sanitizeAgentProfile(
  value: unknown,
  agentId: string,
  issues: ValidationIssue[]
): AgentPromptProfile {
  const input = isRecord(value) ? value : {};
  const partial: Partial<Omit<AgentPromptProfile, "agentId">> = {};
  const handle = asString(input.handle);
  const role = asString(input.role);
  const systemPrompt = asString(input.systemPrompt);

  if (handle) {
    partial.handle = handle;
  }
  if (role) {
    partial.role = role;
  }
  if (systemPrompt) {
    partial.systemPrompt = systemPrompt;
  }

  const profile = defaultPromptProfile(agentId, partial);

  if (!isRecord(value)) {
    issues.push({ path: `registeredAgents.${agentId}`, reason: "Invalid profile, using defaults" });
  }

  return profile;
}

function sanitizeThread(
  value: unknown,
  keyAgentId: string,
  profile: AgentPromptProfile,
  issues: ValidationIssue[]
): AgentThread {
  const input = isRecord(value) ? value : {};
  const messages = Array.isArray(input.messages)
    ? input.messages
        .map((message, index) => sanitizeMessage(message, `threadsByAgentId.${keyAgentId}.messages[${index}]`, issues))
        .filter((message): message is ChatMessage => Boolean(message))
    : [];

  const base: AgentThread = {
    agentId: keyAgentId,
    unread: asNonNegativeInt(input.unread),
    messages
  };

  return ensureSystemMessage(keyAgentId, base, profile.systemPrompt);
}

export function defaultAgentChatState(): AgentChatState {
  return {
    selectedAgentId: undefined,
    registeredAgents: {},
    threadsByAgentId: {},
    lastError: undefined
  };
}

export function validateAgentChatState(value: unknown): ValidationResult<AgentChatState> {
  const issues: ValidationIssue[] = [];
  const input = isRecord(value) ? value : {};

  const rawProfiles = isRecord(input.registeredAgents) ? input.registeredAgents : {};
  const rawThreads = isRecord(input.threadsByAgentId) ? input.threadsByAgentId : {};

  const allAgentIds = new Set<string>([...Object.keys(rawProfiles), ...Object.keys(rawThreads)].filter((id) => id.length > 0));

  const registeredAgents: Record<string, AgentPromptProfile> = {};
  const threadsByAgentId: Record<string, AgentThread> = {};

  for (const agentId of allAgentIds) {
    const profile = sanitizeAgentProfile(rawProfiles[agentId], agentId, issues);
    registeredAgents[agentId] = profile;
    threadsByAgentId[agentId] = sanitizeThread(rawThreads[agentId], agentId, profile, issues);
  }

  const selectedAgentIdRaw = asString(input.selectedAgentId);
  const selectedAgentId = selectedAgentIdRaw && registeredAgents[selectedAgentIdRaw] ? selectedAgentIdRaw : undefined;

  return {
    value: {
      selectedAgentId,
      registeredAgents,
      threadsByAgentId,
      lastError: asString(input.lastError)
    },
    issues
  };
}

export function loadAgentChatState(storage: Pick<Storage, "getItem">): ValidationResult<AgentChatState> {
  try {
    const raw = storage.getItem(AGENT_CHAT_STORAGE_KEY);
    if (!raw) {
      return {
        value: defaultAgentChatState(),
        issues: []
      };
    }

    return validateAgentChatState(JSON.parse(raw));
  } catch {
    return {
      value: defaultAgentChatState(),
      issues: [{ path: "storage", reason: "Failed to parse stored chat state; using defaults" }]
    };
  }
}

export function saveAgentChatState(storage: Pick<Storage, "setItem">, state: AgentChatState): void {
  storage.setItem(AGENT_CHAT_STORAGE_KEY, JSON.stringify(state));
}

export function ensureAgentThread(state: AgentChatState, agentId: string): AgentChatState {
  const profile = state.registeredAgents[agentId] ?? defaultPromptProfile(agentId);
  const registeredAgents = state.registeredAgents[agentId]
    ? state.registeredAgents
    : {
        ...state.registeredAgents,
        [agentId]: profile
      };

  const currentThread = state.threadsByAgentId[agentId] ?? {
    agentId,
    unread: 0,
    messages: []
  };

  const normalizedThread = ensureSystemMessage(agentId, currentThread, profile.systemPrompt);

  return {
    ...state,
    registeredAgents,
    threadsByAgentId: {
      ...state.threadsByAgentId,
      [agentId]: normalizedThread
    }
  };
}

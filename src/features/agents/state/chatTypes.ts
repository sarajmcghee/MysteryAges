export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
}

export interface AgentChatThread {
  agentId: string;
  personaSeed: string;
  messages: ChatMessage[];
}

export interface AgentChatState {
  activeAgentId?: string | undefined;
  threadsByAgentId: Record<string, AgentChatThread>;
}

export interface AgentChatMutationContext {
  nowIso: () => string;
  messageId: () => string;
}

export interface AgentChatPersistedShape {
  activeAgentId?: unknown;
  threadsByAgentId?: unknown;
}

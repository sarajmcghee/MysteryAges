export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
  pending?: boolean | undefined;
  error?: string | undefined;
}

export interface AgentThread {
  agentId: string;
  messages: ChatMessage[];
  unread: number;
}

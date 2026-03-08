import type { AgentRole, ID } from "../../raid/types/raid";

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  id: ID;
  agentId: ID;
  role: ChatRole;
  content: string;
  timestamp: string;
}

export interface AgentChatThread {
  agentId: ID;
  messages: ChatMessage[];
}

// UI-facing agent contract for chat surfaces (roster, inspector, tavern cards).
export interface ChatAgentUI {
  id: ID;
  name: string;
  role: AgentRole;
  personality: string;
  skills: string[];
  responsibilities?: string[];
  outOfScope?: string[];
}

export interface AgentChatApiRequest {
  agent: ChatAgentUI;
  thread: AgentChatThread;
  userMessage: ChatMessage;
}

export interface AgentChatApiResponse {
  content: string;
  timestamp: string;
}

export interface AgentChatApi {
  sendMessage(request: AgentChatApiRequest): Promise<AgentChatApiResponse>;
}

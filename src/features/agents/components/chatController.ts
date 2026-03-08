import type { ChatRole } from "../state/chatTypes";

export interface ChatStorePort {
  append: (agentId: string, personaSeed: string, role: ChatRole, content: string) => void;
  regenerate: (agentId: string, personaSeed: string, content: string) => void;
}

export interface ChatSenderResult {
  reply: string;
}

export type ChatSender = (message: string) => Promise<ChatSenderResult>;

export async function runSendFlow(params: {
  store: ChatStorePort;
  send: ChatSender;
  agentId: string;
  personaSeed: string;
  draft: string;
}): Promise<boolean> {
  const text = params.draft.trim();
  if (!text) {
    return false;
  }

  params.store.append(params.agentId, params.personaSeed, "user", text);

  try {
    const response = await params.send(text);
    params.store.append(params.agentId, params.personaSeed, "assistant", response.reply);
  } catch {
    params.store.append(params.agentId, params.personaSeed, "assistant", "Request failed. Try again.");
  }

  return true;
}

export async function runRegenerateFlow(params: {
  store: ChatStorePort;
  send: ChatSender;
  agentId: string;
  personaSeed: string;
  lastUserPrompt?: string;
}): Promise<boolean> {
  if (!params.lastUserPrompt || !params.lastUserPrompt.trim()) {
    return false;
  }

  try {
    const response = await params.send(params.lastUserPrompt);
    params.store.regenerate(params.agentId, params.personaSeed, response.reply);
  } catch {
    params.store.regenerate(params.agentId, params.personaSeed, "Request failed. Try again.");
  }

  return true;
}

import { isGuestModeEnabled } from "../../auth/state/guestMode";

export interface AgentChatResponse {
  agentId: string;
  reply: string;
  timestamp: string;
}

function getApiBaseUrl(): string {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!apiBaseUrl) {
    throw new Error("Missing VITE_API_BASE_URL");
  }

  return apiBaseUrl;
}

function normalizeRequired(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${label} is required`);
  }
  return normalized;
}

export async function sendAgentMessage(
  agentId: string,
  message: string
): Promise<AgentChatResponse> {
  if (isGuestModeEnabled()) {
    throw new Error("Guest mode enabled: remote AI calls are disabled.");
  }

  const normalizedAgentId = normalizeRequired(agentId, "agentId");
  const normalizedMessage = normalizeRequired(message, "message");

  const res = await fetch(`${getApiBaseUrl()}/api/agents/${normalizedAgentId}/chat`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: normalizedMessage })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Chat request failed: ${res.status} ${text}`);
  }

  const payload = (await res.json()) as AgentChatResponse;
  if (payload.agentId !== normalizedAgentId) {
    throw new Error(`Mismatched agent response: expected ${normalizedAgentId}, got ${payload.agentId}`);
  }

  if (!payload.reply?.trim()) {
    throw new Error("Empty assistant reply");
  }

  return payload;
}

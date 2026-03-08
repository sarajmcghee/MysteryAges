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

export async function sendAgentMessage(
  agentId: string,
  message: string
): Promise<AgentChatResponse> {
  const res = await fetch(`${getApiBaseUrl()}/api/agents/${agentId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Chat request failed: ${res.status} ${text}`);
  }

  const payload = (await res.json()) as AgentChatResponse;
  return payload;
}

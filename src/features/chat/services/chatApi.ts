import type { AgentChatApi, AgentChatApiRequest, AgentChatApiResponse } from "../types/chat";
import { isGuestModeEnabled } from "../../auth/state/guestMode";

function getApiBaseUrl(): string {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!apiBaseUrl) {
    throw new Error("Missing VITE_API_BASE_URL");
  }

  return apiBaseUrl;
}

export class MockAgentChatApi implements AgentChatApi {
  async sendMessage(request: AgentChatApiRequest): Promise<AgentChatApiResponse> {
    const { agent, userMessage } = request;
    const responseText = [
      `${agent.name} (${agent.role}) reporting.`,
      `Directive acknowledged: "${userMessage.content}".`,
      "Next step: executing assigned responsibility and returning status on completion."
    ].join(" ");

    return {
      content: responseText,
      timestamp: new Date().toISOString()
    };
  }
}

export class HttpAgentChatApi implements AgentChatApi {
  constructor(private readonly apiBaseUrl: string = getApiBaseUrl()) {}

  async sendMessage(request: AgentChatApiRequest): Promise<AgentChatApiResponse> {
    if (isGuestModeEnabled()) {
      throw new Error("Guest mode enabled: remote AI calls are disabled.");
    }

    const res = await fetch(`${this.apiBaseUrl}/api/agents/${request.agent.id}/chat`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: request.userMessage.content })
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Chat request failed: ${res.status} ${body}`);
    }

    const payload = (await res.json()) as {
      reply: string;
      timestamp: string;
    };

    return {
      content: payload.reply,
      timestamp: payload.timestamp
    };
  }
}

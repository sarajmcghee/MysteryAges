import { useState } from "react";

import { sendAgentMessage } from "../services/chatService";

export function useAgentChat(agentId: string) {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(message: string) {
    setIsSending(true);
    setError(null);

    try {
      return await sendAgentMessage(agentId, message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    } finally {
      setIsSending(false);
    }
  }

  return { send, isSending, error };
}

import { type FormEvent, useMemo, useState } from "react";
import { useAgentChat } from "../hooks/useAgentChat";
import type { ChatMessage } from "../types/chat";

interface AgentChatPanelProps {
  agentId: string;
  personaSeed: string;
}

function newMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: new Date().toISOString()
  };
}

function systemSeed(personaSeed: string): ChatMessage {
  return newMessage("system", personaSeed.trim() || "You are a reliable raid teammate.");
}

export function AgentChatPanel({ agentId, personaSeed }: AgentChatPanelProps) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([systemSeed(personaSeed)]);
  const { send, isSending, error } = useAgentChat(agentId);

  const lastUserPrompt = useMemo(() => {
    return [...messages].reverse().find((message) => message.role === "user")?.content;
  }, [messages]);

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || isSending) {
      return;
    }

    setMessages((current) => [...current, newMessage("user", text)]);
    setDraft("");

    try {
      const response = await send(text);
      setMessages((current) => [...current, newMessage("assistant", response.reply)]);
    } catch {
      setMessages((current) => [...current, newMessage("assistant", "Request failed. Try again.")]);
    }
  }

  async function handleRegenerate() {
    if (!lastUserPrompt || isSending) {
      return;
    }

    setMessages((current) => {
      const next = [...current];
      const assistantIndex = [...next].reverse().findIndex((message) => message.role === "assistant");
      if (assistantIndex !== -1) {
        next.splice(next.length - 1 - assistantIndex, 1);
      }
      return next;
    });

    try {
      const response = await send(lastUserPrompt);
      setMessages((current) => [...current, newMessage("assistant", response.reply)]);
    } catch {
      setMessages((current) => [...current, newMessage("assistant", "Request failed. Try again.")]);
    }
  }

  function handleReset() {
    setMessages([systemSeed(personaSeed)]);
  }

  return (
    <section>
      <h3>Agent Chat Mode</h3>
      <ul data-testid="chat-log">
        {messages.map((message) => (
          <li key={message.id} data-testid={`msg-${message.role}`}>
            <strong>{message.role}</strong>: {message.content}
            <small> ({message.timestamp})</small>
          </li>
        ))}
      </ul>

      <form onSubmit={handleSend}>
        <input aria-label="chat-input" value={draft} onChange={(event) => setDraft(event.target.value)} />
        <button type="submit" disabled={isSending}>
          Send
        </button>
      </form>

      <button type="button" onClick={handleReset}>
        Reset Thread
      </button>
      <button type="button" onClick={() => void handleRegenerate()} disabled={!lastUserPrompt || isSending}>
        Regenerate Last Response
      </button>

      {error ? <p role="alert">{error}</p> : null}
    </section>
  );
}

import { useEffect, useRef } from "react";
import type { ChatMessage } from "../types/chat";

interface ChatThreadViewProps {
  messages: ChatMessage[];
  agentHandle: string;
}

export function ChatThreadView({ messages, agentHandle }: ChatThreadViewProps) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <section className="chat-thread" aria-label={`Conversation with ${agentHandle}`}>
      {messages.map((message) => (
        <article key={message.id} className={`chat-bubble chat-bubble--${message.role}`}>
          <p>{message.content}</p>
          <footer>
            <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
            {message.pending ? <span>sending…</span> : null}
            {message.error ? <span className="chat-bubble__error">fallback</span> : null}
          </footer>
        </article>
      ))}
      <div ref={endRef} />
    </section>
  );
}

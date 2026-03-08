import { useEffect, useMemo } from "react";
import type { Agent } from "../../raid/types/raid";
import { AgentList } from "./AgentList";
import { ChatThreadView } from "./ChatThreadView";
import { ChatComposer } from "./ChatComposer";
import { ChatControls } from "./ChatControls";
import { useChatStore } from "../state/chatStore";
import "./agent-chat.css";

interface AgentChatShellProps {
  agents: Agent[];
}

export function AgentChatShell({ agents }: AgentChatShellProps) {
  const selectedAgentId = useChatStore((state) => state.selectedAgentId);
  const threads = useChatStore((state) => state.threads);
  const isSendingByAgent = useChatStore((state) => state.isSendingByAgent);
  const errorByAgent = useChatStore((state) => state.errorByAgent);
  const initializeAgents = useChatStore((state) => state.initializeAgents);
  const selectAgent = useChatStore((state) => state.selectAgent);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const resetThread = useChatStore((state) => state.resetThread);
  const regenerateLast = useChatStore((state) => state.regenerateLast);

  useEffect(() => {
    initializeAgents(agents);
  }, [agents, initializeAgents]);

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedAgentId) ?? agents[0],
    [agents, selectedAgentId]
  );

  if (!selectedAgent) {
    return null;
  }

  const selectedThread = threads[selectedAgent.id];
  const unreadByAgent = Object.fromEntries(
    Object.entries(threads).map(([agentId, thread]) => [agentId, thread.unread])
  );

  return (
    <section className="agent-chat-shell" aria-labelledby="agent-chat-title">
      <div className="agent-chat-shell__header">
        <h2 id="agent-chat-title">Agent Chat</h2>
        <p>Direct thread per teammate for fast coordination.</p>
      </div>

      <div className="agent-chat-shell__layout">
        <AgentList
          agents={agents}
          selectedAgentId={selectedAgent.id}
          unreadByAgent={unreadByAgent}
          onSelect={selectAgent}
        />

        <div className="agent-chat-main">
          <header className="agent-chat-main__head">
            <div>
              <h3>{selectedAgent.handle}</h3>
              <p>{selectedAgent.role} · {selectedAgent.state}</p>
            </div>
            <ChatControls
              onReset={() => resetThread(selectedAgent)}
              onRegenerate={() => void regenerateLast(selectedAgent)}
              disabled={isSendingByAgent[selectedAgent.id] ?? false}
            />
          </header>

          <ChatThreadView
            messages={selectedThread?.messages ?? []}
            agentHandle={selectedAgent.handle}
          />

          {errorByAgent[selectedAgent.id] ? (
            <p className="agent-chat-main__error">Service unavailable, using local fallback replies.</p>
          ) : null}

          <ChatComposer
            disabled={isSendingByAgent[selectedAgent.id] ?? false}
            onSend={(text) => {
              void sendMessage(selectedAgent, text);
            }}
          />
        </div>
      </div>
    </section>
  );
}

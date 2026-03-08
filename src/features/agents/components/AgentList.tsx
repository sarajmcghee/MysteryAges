import type { Agent } from "../../raid/types/raid";

interface AgentListProps {
  agents: Agent[];
  selectedAgentId?: string | undefined;
  unreadByAgent: Record<string, number>;
  onSelect: (agentId: string) => void;
}

export function AgentList({ agents, selectedAgentId, unreadByAgent, onSelect }: AgentListProps) {
  return (
    <aside className="agent-chat-list" aria-label="Agent threads">
      <h3 className="agent-chat-list__title">Agents</h3>
      <ul className="agent-chat-list__items">
        {agents.map((agent) => {
          const active = selectedAgentId === agent.id;
          const unread = unreadByAgent[agent.id] ?? 0;
          return (
            <li key={agent.id}>
              <button
                type="button"
                className={`agent-chat-list__item ${active ? "agent-chat-list__item--active" : ""}`}
                onClick={() => onSelect(agent.id)}
                aria-current={active ? "true" : undefined}
              >
                <span>
                  <strong>{agent.handle}</strong>
                  <small>{agent.role} · {agent.state}</small>
                </span>
                {unread > 0 ? <span className="agent-chat-list__badge">{unread}</span> : null}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

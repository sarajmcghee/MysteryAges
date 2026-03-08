import { useMemo } from "react";
import { useRaidStore } from "../state/raidStore";
import { selectAgentLoad, selectAgents, selectTasks } from "../state/selectors";
import { Badge, Button, Card } from "../../../shared/ui/primitives";
import type { AgentState, ID } from "../types/raid";
import { AgentAvatar } from "../../agents/components/AgentAvatar";

const states: AgentState[] = ["idle", "scouting", "working", "blocked", "completed"];

interface AgentRosterProps {
  onOpenAssign: (agentId?: ID) => void;
}

export function AgentRoster({ onOpenAssign }: AgentRosterProps) {
  const agents = useRaidStore(selectAgents);
  const tasks = useRaidStore(selectTasks);
  const agentLoad = useRaidStore(selectAgentLoad);
  const updateAgentState = useRaidStore((state) => state.updateAgentState);

  const taskTitleById = useMemo(() => new Map(tasks.map((task) => [task.id, task.title])), [tasks]);

  return (
    <Card title="Agent Roster">
      <div className="grid gap-sm">
        {agents.map((agent) => (
          <article key={agent.id} className="agent-card">
            <div className="row-between">
              <div className="agent-card__identity">
                <AgentAvatar agentId={agent.id} handle={agent.handle} role={agent.role} size={52} loading="lazy" />
                <h4>{agent.handle}</h4>
              </div>
              <Badge tone={agent.state === "blocked" ? "danger" : "brand"}>{agent.state}</Badge>
            </div>
            <p className="muted">{agent.personality}</p>
            <p>
              <strong>Role:</strong> {agent.role} | <strong>Load:</strong> {agentLoad[agent.id] ?? 0}
            </p>
            <p>
              <strong>Current:</strong> {agent.currentTaskId ? taskTitleById.get(agent.currentTaskId) : "Unassigned"}
            </p>
            <div className="chip-row">
              {agent.skillTags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
            <div className="stack-xs">
              <strong>Needs</strong>
              {agent.needs.length ? (
                <ul className="list-tight">
                  {agent.needs.map((need) => (
                    <li key={need}>{need}</li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No current needs.</p>
              )}
            </div>
            <div className="row-wrap gap-xs">
              <select
                value={agent.state}
                onChange={(event) => updateAgentState(agent.id, event.target.value as AgentState)}
                className="input"
              >
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              <Button variant="secondary" size="sm" onClick={() => onOpenAssign(agent.id)}>
                Assign Task
              </Button>
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}

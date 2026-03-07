import { useMemo } from "react";
import { useRaidStore } from "../state/raidStore";
import { selectAgents, selectEvents, selectTasks } from "../state/selectors";
import { Card } from "../../../shared/ui/primitives";

export function RaidTimeline() {
  const events = useRaidStore(selectEvents);
  const tasks = useRaidStore(selectTasks);
  const agents = useRaidStore(selectAgents);

  const taskMap = useMemo(() => new Map(tasks.map((task) => [task.id, task.title])), [tasks]);
  const agentMap = useMemo(() => new Map(agents.map((agent) => [agent.id, agent.handle])), [agents]);

  return (
    <Card title="Raid Timeline">
      <ul className="timeline">
        {events.map((event) => (
          <li key={event.id} className="timeline-item">
            <div className="row-between">
              <strong>{event.type.replace(/_/g, " ")}</strong>
              <span className="muted">{new Date(event.timestamp).toLocaleTimeString()}</span>
            </div>
            <p className="muted">
              {event.taskId ? `Task: ${taskMap.get(event.taskId) ?? event.taskId}. ` : ""}
              {event.agentId ? `Agent: ${agentMap.get(event.agentId) ?? event.agentId}. ` : ""}
              {event.note ?? ""}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}

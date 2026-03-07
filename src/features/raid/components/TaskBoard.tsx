import { useMemo } from "react";
import { useRaidStore } from "../state/raidStore";
import { selectAgents, selectFilter, selectSelectedTaskId, selectTasks } from "../state/selectors";
import { Badge, Button, Card } from "../../../shared/ui/primitives";
import type { ID, Task, TaskStatus } from "../types/raid";

const columns: Array<{ title: string; status: TaskStatus; tone: "neutral" | "brand" | "warn" | "ok" | "danger" }> = [
  { title: "Todo", status: "todo", tone: "neutral" },
  { title: "In Progress", status: "in_progress", tone: "brand" },
  { title: "Blocked", status: "blocked", tone: "danger" },
  { title: "Done", status: "done", tone: "ok" }
];

interface TaskBoardProps {
  onOpenAssign: (agentId?: ID, taskId?: ID) => void;
}

export function TaskBoard({ onOpenAssign }: TaskBoardProps) {
  const tasks = useRaidStore(selectTasks);
  const agents = useRaidStore(selectAgents);
  const filter = useRaidStore(selectFilter);
  const selectedTaskId = useRaidStore(selectSelectedTaskId);
  const setSelectedTaskId = useRaidStore((state) => state.setSelectedTaskId);
  const setFilter = useRaidStore((state) => state.setFilter);
  const updateTaskStatus = useRaidStore((state) => state.updateTaskStatus);

  const agentName = useMemo(() => {
    return new Map(agents.map((agent) => [agent.id, agent.handle]));
  }, [agents]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filter.agentId && task.assignedAgentId !== filter.agentId) {
        return false;
      }
      if (filter.status && task.status !== filter.status) {
        return false;
      }
      if (filter.showOnlyBlocked && task.status !== "blocked") {
        return false;
      }
      return true;
    });
  }, [tasks, filter]);

  const grouped = useMemo(() => {
    return columns.map((column) => ({
      ...column,
      items: filteredTasks
        .filter((task) => task.status === column.status)
        .sort((a, b) => a.priority - b.priority)
    }));
  }, [filteredTasks]);

  return (
    <Card
      title="Task Board"
      actions={
        <div className="row-wrap gap-xs">
          <label className="inline-label">
            <input
              type="checkbox"
              checked={filter.showOnlyBlocked}
              onChange={(event) => setFilter({ showOnlyBlocked: event.target.checked })}
            />
            blocked only
          </label>
          <Button variant="ghost" size="sm" onClick={() => setFilter({ agentId: undefined, status: undefined, showOnlyBlocked: false })}>
            Reset Filters
          </Button>
        </div>
      }
    >
      <div className="task-columns">
        {grouped.map((column) => (
          <section key={column.status} className="task-column">
            <header className="row-between">
              <h4>{column.title}</h4>
              <Badge tone={column.tone}>{column.items.length}</Badge>
            </header>
            <div className="stack-sm">
              {column.items.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  selected={selectedTaskId === task.id}
                  assignee={task.assignedAgentId ? agentName.get(task.assignedAgentId) : undefined}
                  onSelect={() => setSelectedTaskId(task.id)}
                  onAssign={() => onOpenAssign(undefined, task.id)}
                  onStatusChange={updateTaskStatus}
                />
              ))}
              {column.items.length === 0 ? <p className="muted">No tasks</p> : null}
            </div>
          </section>
        ))}
      </div>
    </Card>
  );
}

function TaskCard({
  task,
  selected,
  assignee,
  onSelect,
  onAssign,
  onStatusChange
}: {
  task: Task;
  selected: boolean;
  assignee?: string | undefined;
  onSelect: () => void;
  onAssign: () => void;
  onStatusChange: (taskId: ID, status: TaskStatus, note?: string) => void;
}) {
  return (
    <article className={`task-card ${selected ? "task-card-selected" : ""}`}>
      <div className="row-between">
        <strong>{task.title}</strong>
        <Badge tone={task.priority === 1 ? "danger" : task.priority === 2 ? "warn" : "neutral"}>P{task.priority}</Badge>
      </div>
      {task.description ? <p className="muted">{task.description}</p> : null}
      <p>
        <strong>Assignee:</strong> {assignee ?? "Unassigned"}
      </p>
      {task.blockerReason ? (
        <p>
          <strong>Blocker:</strong> {task.blockerReason}
        </p>
      ) : null}
      <div className="row-wrap gap-xs">
        <Button variant="ghost" size="sm" onClick={onSelect}>
          Focus
        </Button>
        <Button variant="secondary" size="sm" onClick={onAssign}>
          Assign
        </Button>
        <select
          value={task.status}
          className="input"
          onChange={(event) => onStatusChange(task.id, event.target.value as TaskStatus)}
        >
          <option value="todo">todo</option>
          <option value="in_progress">in_progress</option>
          <option value="blocked">blocked</option>
          <option value="done">done</option>
        </select>
      </div>
    </article>
  );
}

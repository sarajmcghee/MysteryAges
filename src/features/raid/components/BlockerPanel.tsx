import { useState } from "react";
import { useRaidStore } from "../state/raidStore";
import { selectBlockedTasks } from "../state/selectors";
import { Badge, Button, Card } from "../../../shared/ui/primitives";

export function BlockerPanel() {
  const blockedTasks = useRaidStore(selectBlockedTasks);
  const resolveBlocker = useRaidStore((state) => state.resolveBlocker);
  const [notes, setNotes] = useState<Record<string, string>>({});

  return (
    <Card title="Blocker Panel" actions={<Badge tone="danger">{blockedTasks.length} blocked</Badge>}>
      <div className="stack-sm">
        {blockedTasks.map((task) => (
          <article key={task.id} className="blocker-card">
            <h4>{task.title}</h4>
            <p className="muted">{task.blockerReason ?? "No reason provided."}</p>
            <textarea
              className="input"
              rows={2}
              placeholder="Resolution note"
              value={notes[task.id] ?? ""}
              onChange={(event) =>
                setNotes((prev) => ({
                  ...prev,
                  [task.id]: event.target.value
                }))
              }
            />
            <Button
              size="sm"
              onClick={() => resolveBlocker(task.id, notes[task.id] || "Leader resolved blocker and resumed execution.")}
            >
              Resolve Blocker
            </Button>
          </article>
        ))}
        {blockedTasks.length === 0 ? <p className="muted">No active blockers.</p> : null}
      </div>
    </Card>
  );
}

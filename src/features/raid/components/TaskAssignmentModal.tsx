import { useEffect, useState } from "react";
import { useRaidStore } from "../state/raidStore";
import { selectAgents, selectSelectedTask, selectTasks } from "../state/selectors";
import { Button } from "../../../shared/ui/primitives";
import type { ID } from "../types/raid";

interface TaskAssignmentModalProps {
  isOpen: boolean;
  preferredAgentId?: ID | undefined;
  preferredTaskId?: ID | undefined;
  onClose: () => void;
}

export function TaskAssignmentModal({ isOpen, preferredAgentId, preferredTaskId, onClose }: TaskAssignmentModalProps) {
  const agents = useRaidStore(selectAgents);
  const tasks = useRaidStore(selectTasks);
  const selectedTask = useRaidStore(selectSelectedTask);
  const assignTask = useRaidStore((state) => state.assignTask);

  const [taskId, setTaskId] = useState<ID | "">("");
  const [agentId, setAgentId] = useState<ID | "">("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setTaskId(preferredTaskId ?? selectedTask?.id ?? "");
    setAgentId(preferredAgentId ?? "");
  }, [isOpen, preferredTaskId, preferredAgentId, selectedTask]);

  if (!isOpen) {
    return null;
  }

  const submitDisabled = !taskId || !agentId;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Assign Task" onClick={(event) => event.stopPropagation()}>
        <header className="row-between">
          <h3>Assign / Reassign Task</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </header>
        <div className="stack-sm">
          <label className="stack-xs">
            <span>Task</span>
            <select className="input" value={taskId} onChange={(event) => setTaskId(event.target.value)}>
              <option value="">Select task</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title} ({task.status})
                </option>
              ))}
            </select>
          </label>
          <label className="stack-xs">
            <span>Agent</span>
            <select className="input" value={agentId} onChange={(event) => setAgentId(event.target.value)}>
              <option value="">Select agent</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.handle} ({agent.state})
                </option>
              ))}
            </select>
          </label>
          <Button
            onClick={() => {
              if (!submitDisabled) {
                assignTask(taskId, agentId);
                onClose();
              }
            }}
            disabled={submitDisabled}
          >
            Confirm Assignment
          </Button>
        </div>
      </div>
    </div>
  );
}

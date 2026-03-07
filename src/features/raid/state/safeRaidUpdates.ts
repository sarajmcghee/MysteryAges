import { findAutoUnblockCandidates } from "../utils/taskRules";
import type { Agent, AgentState, AgentStatus, ID, RaidEvent, RaidState, Task, TaskStatus } from "../types/raid";

export interface MutationContext {
  nowIso: () => string;
  eventId: () => string;
}

const defaultMutationContext: MutationContext = {
  nowIso: () => new Date().toISOString(),
  eventId: () => `evt-${Math.random().toString(36).slice(2, 10)}`
};

function isTerminalTask(status: TaskStatus): boolean {
  return status === "done";
}

function makeEvent(
  ctx: MutationContext,
  payload: Omit<RaidEvent, "id" | "timestamp">
): RaidEvent {
  return {
    id: ctx.eventId(),
    timestamp: ctx.nowIso(),
    ...payload
  };
}

function pushEvent(state: RaidState, ctx: MutationContext, payload: Omit<RaidEvent, "id" | "timestamp">): RaidEvent[] {
  return [makeEvent(ctx, payload), ...state.events].slice(0, 200);
}

function mapAgentStateForTaskStatus(status: TaskStatus): Pick<Agent, "state" | "status" | "currentTaskId"> {
  if (status === "done") {
    return { state: "completed", status: "online", currentTaskId: undefined };
  }
  if (status === "blocked") {
    return { state: "blocked", status: "busy", currentTaskId: undefined };
  }
  if (status === "in_progress") {
    return { state: "working", status: "busy", currentTaskId: undefined };
  }
  return { state: "idle", status: "online", currentTaskId: undefined };
}

function mapAgentStatusForState(stateValue: AgentState): AgentStatus {
  return stateValue === "idle" || stateValue === "completed" ? "online" : "busy";
}

export function safeAssignTask(
  raid: RaidState,
  taskId: ID,
  agentId: ID,
  context: MutationContext = defaultMutationContext
): RaidState {
  const task = raid.tasks.find((item) => item.id === taskId);
  const agent = raid.agents.find((item) => item.id === agentId);

  if (!task || !agent || agent.status === "offline" || isTerminalTask(task.status)) {
    return raid;
  }

  const previousAssigneeId = task.assignedAgentId;
  const nextTasks: Task[] = raid.tasks.map((item): Task => {
    if (item.id !== taskId) {
      return item;
    }
    return {
      ...item,
      assignedAgentId: agentId,
      status: item.status === "blocked" ? ("blocked" as TaskStatus) : ("in_progress" as TaskStatus),
      updatedAt: context.nowIso()
    };
  });

  const nextAgents: Agent[] = raid.agents.map((item): Agent => {
    if (item.id === agentId) {
      return {
        ...item,
        currentTaskId: taskId,
        state: "working" as const,
        status: "busy" as const
      };
    }

    if (item.currentTaskId === taskId || (previousAssigneeId && item.id === previousAssigneeId)) {
      return {
        ...item,
        currentTaskId: undefined,
        state: "idle" as const,
        status: "online" as const
      };
    }

    return item;
  });

  return {
    ...raid,
    tasks: nextTasks,
    agents: nextAgents,
    events: pushEvent(raid, context, {
      type: "task_assigned",
      taskId,
      agentId,
      note: `Assigned ${task.title} to ${agent.handle}.`
    })
  };
}

export function safeUpdateTaskStatus(
  raid: RaidState,
  taskId: ID,
  status: TaskStatus,
  note: string | undefined,
  context: MutationContext = defaultMutationContext
): RaidState {
  const task = raid.tasks.find((item) => item.id === taskId);
  if (!task) {
    return raid;
  }

  let nextTasks: Task[] = raid.tasks.map((item): Task =>
    item.id === taskId
      ? {
          ...item,
          status,
          blockerReason: status === "blocked" ? item.blockerReason ?? "Blocked without reason." : undefined,
          updatedAt: context.nowIso()
        }
      : item
  );

  const autoUnblocked = status === "done" ? findAutoUnblockCandidates(nextTasks) : [];
  if (autoUnblocked.length > 0) {
    const autoIds = new Set(autoUnblocked.map((item) => item.id));
    nextTasks = nextTasks.map((item): Task =>
      autoIds.has(item.id)
        ? {
            ...item,
            status: "todo",
            blockerReason: undefined,
            updatedAt: context.nowIso()
          }
        : item
    );
  }

  const nextAgents: Agent[] = raid.agents.map((item): Agent => {
    const shouldApply = item.currentTaskId === taskId || (task.assignedAgentId !== undefined && item.id === task.assignedAgentId);
    if (!shouldApply) {
      return item;
    }

    const mapped = mapAgentStateForTaskStatus(status);
    return {
      ...item,
      state: mapped.state,
      status: mapped.status,
      currentTaskId: status === "in_progress" ? taskId : mapped.currentTaskId
    };
  });

  let nextEvents = pushEvent(raid, context, {
    type: "task_status_changed",
    taskId,
    agentId: task.assignedAgentId,
    note: note ?? `Status updated to ${status}.`
  });

  for (const item of autoUnblocked) {
    nextEvents = [
      makeEvent(context, {
        type: "task_status_changed",
        taskId: item.id,
        agentId: item.assignedAgentId,
        note: "Auto-unblocked after dependencies completed."
      }),
      ...nextEvents
    ].slice(0, 200);
  }

  return {
    ...raid,
    tasks: nextTasks,
    agents: nextAgents,
    events: nextEvents
  };
}

export function safeResolveBlocker(
  raid: RaidState,
  taskId: ID,
  resolutionNote: string,
  context: MutationContext = defaultMutationContext
): RaidState {
  const task = raid.tasks.find((item) => item.id === taskId);
  if (!task || task.status !== "blocked") {
    return raid;
  }

  const nextStatus: TaskStatus = task.assignedAgentId ? "in_progress" : "todo";

  const nextTasks: Task[] = raid.tasks.map((item): Task =>
    item.id === taskId
      ? {
          ...item,
          status: nextStatus,
          blockerReason: undefined,
          updatedAt: context.nowIso()
        }
      : item
  );

  const nextAgents: Agent[] = raid.agents.map((item): Agent => {
    if (item.id !== task.assignedAgentId) {
      return item;
    }

    return {
      ...item,
      state: nextStatus === "in_progress" ? ("working" as const) : ("idle" as const),
      status: nextStatus === "in_progress" ? ("busy" as const) : ("online" as const),
      currentTaskId: nextStatus === "in_progress" ? taskId : undefined
    };
  });

  return {
    ...raid,
    tasks: nextTasks,
    agents: nextAgents,
    events: pushEvent(raid, context, {
      type: "blocker_resolved",
      taskId,
      agentId: task.assignedAgentId,
      note: resolutionNote.trim() || "Blocker resolved."
    })
  };
}

export function safeUpdateAgentState(raid: RaidState, agentId: ID, stateValue: AgentState): RaidState {
  const agent = raid.agents.find((item) => item.id === agentId);
  if (!agent) {
    return raid;
  }

  const nextAgents: Agent[] = raid.agents.map((item): Agent => {
    if (item.id !== agentId) {
      return item;
    }

    return {
      ...item,
      state: stateValue,
      status: mapAgentStatusForState(stateValue),
      currentTaskId: stateValue === "idle" || stateValue === "completed" ? undefined : item.currentTaskId
    };
  });

  return {
    ...raid,
    agents: nextAgents
  };
}

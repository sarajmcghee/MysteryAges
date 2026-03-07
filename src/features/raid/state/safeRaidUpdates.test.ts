import { describe, expect, it } from "vitest";
import seededRaidStateJson from "../data/seededRaidState.json";
import { validateRaidState } from "../services/raidSchema";
import { safeAssignTask, safeResolveBlocker, safeUpdateAgentState, safeUpdateTaskStatus } from "./safeRaidUpdates";
import type { RaidState } from "../types/raid";

function buildRaid(): RaidState {
  return validateRaidState(seededRaidStateJson).value;
}

function ctx() {
  return {
    nowIso: () => "2026-03-07T00:00:00.000Z",
    eventId: () => "evt-test"
  };
}

describe("safeAssignTask", () => {
  it("returns original raid when task or agent is missing", () => {
    const raid = buildRaid();
    expect(safeAssignTask(raid, "missing", "agent-1", ctx())).toBe(raid);
    expect(safeAssignTask(raid, "task-1", "missing", ctx())).toBe(raid);
  });

  it("does not assign terminal tasks", () => {
    const raid = buildRaid();
    const doneRaid = safeUpdateTaskStatus(raid, "task-1", "done", undefined, ctx());
    const result = safeAssignTask(doneRaid, "task-1", "agent-4", ctx());
    expect(result).toBe(doneRaid);
  });

  it("reassigns task and clears previous assignee current task", () => {
    const raid = buildRaid();
    const result = safeAssignTask(raid, "task-2", "agent-4", ctx());

    const task = result.tasks.find((item) => item.id === "task-2");
    const previous = result.agents.find((item) => item.id === "agent-1");
    const next = result.agents.find((item) => item.id === "agent-4");

    expect(task?.assignedAgentId).toBe("agent-4");
    expect(previous?.currentTaskId).toBeUndefined();
    expect(next?.currentTaskId).toBe("task-2");
    expect(result.events[0]?.type).toBe("task_assigned");
  });
});

describe("safeUpdateTaskStatus", () => {
  it("returns original raid when task is missing", () => {
    const raid = buildRaid();
    expect(safeUpdateTaskStatus(raid, "missing", "done", undefined, ctx())).toBe(raid);
  });

  it("auto-unblocks blocked tasks when dependencies complete", () => {
    const raid = buildRaid();
    const afterTask1 = safeUpdateTaskStatus(raid, "task-1", "done", undefined, ctx());
    const afterTask2 = safeUpdateTaskStatus(afterTask1, "task-2", "done", undefined, ctx());
    const task4 = afterTask2.tasks.find((item) => item.id === "task-4");

    expect(task4?.status).toBe("todo");
    expect(task4?.blockerReason).toBeUndefined();
    expect(afterTask2.events.some((item) => item.note?.includes("Auto-unblocked"))).toBe(true);
  });
});

describe("safeResolveBlocker", () => {
  it("returns original raid if target task is not blocked", () => {
    const raid = buildRaid();
    expect(safeResolveBlocker(raid, "task-2", "n/a", ctx())).toBe(raid);
  });

  it("moves blocked task to in_progress when assigned", () => {
    const raid = buildRaid();
    const result = safeResolveBlocker(raid, "task-4", "Unblocked", ctx());
    const task = result.tasks.find((item) => item.id === "task-4");
    const agent = result.agents.find((item) => item.id === "agent-3");

    expect(task?.status).toBe("in_progress");
    expect(agent?.state).toBe("working");
    expect(agent?.currentTaskId).toBe("task-4");
  });
});

describe("safeUpdateAgentState", () => {
  it("clears current task when agent moved to idle", () => {
    const raid = buildRaid();
    const result = safeUpdateAgentState(raid, "agent-1", "idle");
    const agent = result.agents.find((item) => item.id === "agent-1");
    expect(agent?.currentTaskId).toBeUndefined();
    expect(agent?.status).toBe("online");
  });
});

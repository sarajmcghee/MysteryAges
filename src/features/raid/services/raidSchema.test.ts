import { describe, expect, it } from "vitest";
import { validateRaidState } from "./raidSchema";

describe("validateRaidState", () => {
  it("sanitizes invalid structures and preserves usable records", () => {
    const result = validateRaidState({
      raidId: "",
      boss: { id: "", name: 123, tier: -3 },
      agents: [
        { id: "agent-1", handle: "A", role: "tank", state: "working", status: "online" },
        { id: "", handle: "drop" }
      ],
      tasks: [
        {
          id: "task-1",
          title: "Task",
          status: "blocked",
          priority: 9,
          assignedAgentId: "missing-agent",
          dependsOnTaskIds: ["missing-task"],
          updatedAt: "not-a-date"
        },
        { id: "", title: "drop" }
      ],
      events: [{ id: "evt-1", timestamp: "bad", type: "bad" }],
      filter: { agentId: "missing", status: "bad", showOnlyBlocked: 1 },
      selectedTaskId: "missing"
    });

    expect(result.value.raidId).toBe("raid-recovered");
    expect(result.value.boss.id).toBe("boss-recovered");
    expect(result.value.agents).toHaveLength(1);
    expect(result.value.tasks).toHaveLength(1);
    expect(result.value.tasks[0]?.assignedAgentId).toBeUndefined();
    expect(result.value.tasks[0]?.dependsOnTaskIds).toEqual([]);
    expect(result.value.filter.agentId).toBeUndefined();
    expect(result.value.filter.status).toBeUndefined();
    expect(result.value.selectedTaskId).toBeUndefined();
    expect(result.issues.length).toBeGreaterThan(0);
  });
});

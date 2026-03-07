import { describe, expect, it } from "vitest";
import { findAutoUnblockCandidates } from "../taskRules";
import type { Task } from "../../types/raid";

function task(partial: Partial<Task> & Pick<Task, "id" | "status">): Task {
  return {
    id: partial.id,
    title: partial.title ?? partial.id,
    bossId: "boss-1",
    status: partial.status,
    priority: partial.priority ?? 2,
    updatedAt: "2026-03-07T00:00:00.000Z",
    dependsOnTaskIds: partial.dependsOnTaskIds,
    assignedAgentId: partial.assignedAgentId,
    blockerReason: partial.blockerReason,
    description: partial.description
  };
}

describe("taskRules", () => {
  it("returns blocked tasks whose dependencies are all done", () => {
    const tasks: Task[] = [
      task({ id: "a", status: "done" }),
      task({ id: "b", status: "done" }),
      task({ id: "c", status: "blocked", dependsOnTaskIds: ["a", "b"] }),
      task({ id: "d", status: "blocked", dependsOnTaskIds: ["a", "z"] })
    ];

    const candidates = findAutoUnblockCandidates(tasks);

    expect(candidates.map((item) => item.id)).toEqual(["c"]);
  });
});

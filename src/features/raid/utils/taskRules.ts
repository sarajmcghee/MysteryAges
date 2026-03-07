import type { Task } from "../types/raid";

export function areDependenciesDone(task: Task, allTasks: Task[]): boolean {
  if (!task.dependsOnTaskIds?.length) {
    return true;
  }
  const doneSet = new Set(allTasks.filter((t) => t.status === "done").map((t) => t.id));
  return task.dependsOnTaskIds.every((dep) => doneSet.has(dep));
}

export function findAutoUnblockCandidates(allTasks: Task[]): Task[] {
  return allTasks.filter((task) => task.status === "blocked" && areDependenciesDone(task, allTasks));
}

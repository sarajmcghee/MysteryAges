import type { RaidStore } from "./raidStore";
import type { Agent, Task, TaskStatus } from "../types/raid";

export const selectBoss = (state: RaidStore) => state.raid.boss;
export const selectAgents = (state: RaidStore) => state.raid.agents;
export const selectTasks = (state: RaidStore) => state.raid.tasks;
export const selectEvents = (state: RaidStore) => state.raid.events;
export const selectFilter = (state: RaidStore) => state.raid.filter;
export const selectSelectedTaskId = (state: RaidStore) => state.raid.selectedTaskId;

export const selectBlockedTasks = (state: RaidStore): Task[] =>
  state.raid.tasks.filter((task) => task.status === "blocked");

export const selectUnassignedTasks = (state: RaidStore): Task[] =>
  state.raid.tasks.filter((task) => !task.assignedAgentId && task.status !== "done");

export const selectAgentLoad = (state: RaidStore): Record<string, number> => {
  return state.raid.tasks.reduce<Record<string, number>>((acc, task) => {
    if (!task.assignedAgentId || task.status === "done") {
      return acc;
    }
    acc[task.assignedAgentId] = (acc[task.assignedAgentId] ?? 0) + 1;
    return acc;
  }, {});
};

export const selectTasksByStatus = (status: TaskStatus) => (state: RaidStore): Task[] =>
  state.raid.tasks.filter((task) => task.status === status);

export const selectSelectedTask = (state: RaidStore): Task | undefined => {
  if (!state.raid.selectedTaskId) {
    return undefined;
  }
  return state.raid.tasks.find((task) => task.id === state.raid.selectedTaskId);
};

export const selectAgentById = (agentId?: string) => (state: RaidStore): Agent | undefined => {
  if (!agentId) {
    return undefined;
  }
  return state.raid.agents.find((agent) => agent.id === agentId);
};

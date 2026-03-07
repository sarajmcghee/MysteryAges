import type { ID, RaidPhase, TaskStatus } from "../types/raid";

export interface RaidActions {
  assignTask: (taskId: ID, agentId: ID) => void;
  updateTaskStatus: (taskId: ID, status: TaskStatus, note?: string) => void;
  resolveBlocker: (taskId: ID, resolutionNote: string) => void;
  updateAgentState: (agentId: ID, state: "idle" | "scouting" | "working" | "blocked" | "completed") => void;
  setBossPhase: (phase: RaidPhase) => void;
  setSelectedTaskId: (taskId?: ID | undefined) => void;
  setFilter: (payload: { agentId?: ID | undefined; status?: TaskStatus | undefined; showOnlyBlocked?: boolean }) => void;
}

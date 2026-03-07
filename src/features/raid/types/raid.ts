export type ID = string;

export type AgentRole = "tank" | "healer" | "dps" | "support";
export type AgentStatus = "online" | "offline" | "busy";
export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";
export type RaidPhase = "prep" | "pull" | "execute" | "cleanup";
export type AgentState = "idle" | "scouting" | "working" | "blocked" | "completed";

export interface Boss {
  id: ID;
  name: string;
  type: string;
  tier: number;
  objective: string;
  victoryCondition: string;
  mechanics: string[];
  currentPhase: RaidPhase;
  enrageTimerSec?: number | undefined;
}

export interface Agent {
  id: ID;
  handle: string;
  role: AgentRole;
  personality: string;
  skillTags: string[];
  state: AgentState;
  status: AgentStatus;
  currentTaskId?: ID | undefined;
  needs: string[];
}

export interface Task {
  id: ID;
  title: string;
  description?: string | undefined;
  bossId: ID;
  assignedAgentId?: ID | undefined;
  status: TaskStatus;
  priority: 1 | 2 | 3;
  blockerReason?: string | undefined;
  dependsOnTaskIds?: ID[] | undefined;
  updatedAt: string;
}

export interface RaidEvent {
  id: ID;
  timestamp: string;
  type: "task_assigned" | "task_status_changed" | "blocker_resolved";
  taskId?: ID | undefined;
  agentId?: ID | undefined;
  note?: string | undefined;
}

export interface RaidState {
  raidId: ID;
  boss: Boss;
  agents: Agent[];
  tasks: Task[];
  events: RaidEvent[];
  selectedTaskId?: ID | undefined;
  filter: {
    agentId?: ID | undefined;
    status?: TaskStatus | undefined;
    showOnlyBlocked: boolean;
  };
}

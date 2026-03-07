import type { Agent, AgentRole, AgentState, AgentStatus, Boss, ID, RaidEvent, RaidPhase, RaidState, Task, TaskStatus } from "../types/raid";

const AGENT_ROLES = ["tank", "healer", "dps", "support"] as const;
const AGENT_STATES = ["idle", "scouting", "working", "blocked", "completed"] as const;
const AGENT_STATUSES = ["online", "offline", "busy"] as const;
const TASK_STATUSES = ["todo", "in_progress", "blocked", "done"] as const;
const RAID_PHASES = ["prep", "pull", "execute", "cleanup"] as const;
const EVENT_TYPES = ["task_assigned", "task_status_changed", "blocker_resolved"] as const;

const DEFAULT_RAID_ID = "raid-recovered";

export interface ValidationIssue {
  path: string;
  reason: string;
}

export interface ValidationResult<T> {
  value: T;
  issues: ValidationIssue[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function asId(value: unknown): ID | undefined {
  return asString(value);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asOptionalPositiveInt(value: unknown): number | undefined {
  if (value == null) {
    return undefined;
  }
  const parsed = asNumber(value);
  if (!parsed || parsed <= 0) {
    return undefined;
  }
  return Math.floor(parsed);
}

function asDateIso(value: unknown, fallback: string): string {
  const input = asString(value);
  if (!input) {
    return fallback;
  }
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function asEnumValue<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  fallback: T[number]
): T[number] {
  if (typeof value === "string" && (allowed as readonly string[]).includes(value)) {
    return value as T[number];
  }
  return fallback;
}

function asOptionalEnumValue<T extends readonly string[]>(value: unknown, allowed: T): T[number] | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  return (allowed as readonly string[]).includes(value) ? (value as T[number]) : undefined;
}

function sanitizeBoss(value: unknown, issues: ValidationIssue[]): Boss {
  const input = isRecord(value) ? value : {};
  const id = asId(input.id) ?? "boss-recovered";
  const name = asString(input.name) ?? "Unknown Boss";
  const type = asString(input.type) ?? "unknown";
  const objective = asString(input.objective) ?? "Stabilize the raid board.";
  const victoryCondition = asString(input.victoryCondition) ?? "All tasks done.";

  if (!asString(input.id)) {
    issues.push({ path: "boss.id", reason: "Missing/invalid boss id" });
  }

  const tierRaw = asNumber(input.tier);
  const tier = tierRaw && tierRaw > 0 ? Math.min(10, Math.floor(tierRaw)) : 1;

  return {
    id,
    name,
    type,
    tier,
    objective,
    victoryCondition,
    mechanics: asArray(input.mechanics).map(asString).filter((v): v is string => Boolean(v)),
    currentPhase: asEnumValue(input.currentPhase, RAID_PHASES, "prep") as RaidPhase,
    enrageTimerSec: asOptionalPositiveInt(input.enrageTimerSec)
  };
}

function sanitizeAgent(value: unknown, index: number, issues: ValidationIssue[]): Agent | undefined {
  const input = isRecord(value) ? value : {};
  const id = asId(input.id);
  if (!id) {
    issues.push({ path: `agents[${index}].id`, reason: "Missing/invalid agent id" });
    return undefined;
  }

  return {
    id,
    handle: asString(input.handle) ?? `AGENT-${index + 1}`,
    role: asEnumValue(input.role, AGENT_ROLES, "support") as AgentRole,
    personality: asString(input.personality) ?? "",
    skillTags: asArray(input.skillTags).map(asString).filter((v): v is string => Boolean(v)),
    state: asEnumValue(input.state, AGENT_STATES, "idle") as AgentState,
    status: asEnumValue(input.status, AGENT_STATUSES, "online") as AgentStatus,
    currentTaskId: asId(input.currentTaskId),
    needs: asArray(input.needs).map(asString).filter((v): v is string => Boolean(v))
  };
}

function sanitizeTask(value: unknown, index: number, bossId: ID, issues: ValidationIssue[]): Task | undefined {
  const input = isRecord(value) ? value : {};
  const id = asId(input.id);
  if (!id) {
    issues.push({ path: `tasks[${index}].id`, reason: "Missing/invalid task id" });
    return undefined;
  }

  const priorityRaw = asNumber(input.priority);
  const normalizedPriority: 1 | 2 | 3 = priorityRaw === 1 || priorityRaw === 2 || priorityRaw === 3 ? priorityRaw : 3;

  return {
    id,
    title: asString(input.title) ?? `Untitled task ${index + 1}`,
    description: asString(input.description),
    bossId: asId(input.bossId) ?? bossId,
    assignedAgentId: asId(input.assignedAgentId),
    status: asEnumValue(input.status, TASK_STATUSES, "todo") as TaskStatus,
    priority: normalizedPriority,
    blockerReason: asString(input.blockerReason),
    dependsOnTaskIds: asArray(input.dependsOnTaskIds).map(asId).filter((v): v is ID => Boolean(v)),
    updatedAt: asDateIso(input.updatedAt, new Date(0).toISOString())
  };
}

function sanitizeEvent(value: unknown, index: number): RaidEvent {
  const input = isRecord(value) ? value : {};
  return {
    id: asId(input.id) ?? `evt-recovered-${index}`,
    timestamp: asDateIso(input.timestamp, new Date(0).toISOString()),
    type: asEnumValue(input.type, EVENT_TYPES, "task_status_changed") as RaidEvent["type"],
    taskId: asId(input.taskId),
    agentId: asId(input.agentId),
    note: asString(input.note)
  };
}

export function validateRaidState(value: unknown): ValidationResult<RaidState> {
  const issues: ValidationIssue[] = [];
  const input = isRecord(value) ? value : {};

  const raidId = asId(input.raidId) ?? DEFAULT_RAID_ID;
  if (!asString(input.raidId)) {
    issues.push({ path: "raidId", reason: "Missing/invalid raid id" });
  }

  const boss = sanitizeBoss(input.boss, issues);

  const agents = asArray(input.agents)
    .map((item, index) => sanitizeAgent(item, index, issues))
    .filter((item): item is Agent => Boolean(item));

  const tasks = asArray(input.tasks)
    .map((item, index) => sanitizeTask(item, index, boss.id, issues))
    .filter((item): item is Task => Boolean(item));

  const agentIds = new Set(agents.map((agent) => agent.id));
  const taskIds = new Set(tasks.map((task) => task.id));

  const normalizedTasks = tasks.map((task) => ({
    ...task,
    assignedAgentId: task.assignedAgentId && agentIds.has(task.assignedAgentId) ? task.assignedAgentId : undefined,
    bossId: task.bossId || boss.id,
    dependsOnTaskIds: (task.dependsOnTaskIds ?? []).filter((depId) => taskIds.has(depId) && depId !== task.id)
  }));

  const normalizedAgents = agents.map((agent) => ({
    ...agent,
    currentTaskId: agent.currentTaskId && taskIds.has(agent.currentTaskId) ? agent.currentTaskId : undefined
  }));

  const events = asArray(input.events).map((item, index) => sanitizeEvent(item, index)).slice(0, 200);

  const filterInput = isRecord(input.filter) ? input.filter : {};
  const filterAgentId = asId(filterInput.agentId);

  const selectedTaskIdRaw = asId(input.selectedTaskId);
  const selectedTaskId = selectedTaskIdRaw && taskIds.has(selectedTaskIdRaw) ? selectedTaskIdRaw : undefined;

  const normalizedState: RaidState = {
    raidId,
    boss,
    agents: normalizedAgents,
    tasks: normalizedTasks,
    events,
    selectedTaskId,
    filter: {
      agentId: filterAgentId && agentIds.has(filterAgentId) ? filterAgentId : undefined,
      status: asOptionalEnumValue(filterInput.status, TASK_STATUSES) as TaskStatus | undefined,
      showOnlyBlocked: Boolean(filterInput.showOnlyBlocked)
    }
  };

  return { value: normalizedState, issues };
}

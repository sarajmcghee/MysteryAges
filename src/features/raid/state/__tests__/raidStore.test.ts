import { afterEach, describe, expect, it, vi } from "vitest";
import { selectAgentLoad } from "../selectors";

const STORAGE_KEY = "party-leader-raid-state-v1";

class MemoryStorage implements Storage {
  private readonly store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key) ?? null : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

async function loadStore(storage: Storage) {
  vi.resetModules();
  vi.stubGlobal("localStorage", storage);
  const module = await import("../raidStore");
  return module.useRaidStore;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("raid store MVP QA coverage", () => {
  it("assigns and reassigns tasks while keeping agent/task state in sync", async () => {
    const storage = new MemoryStorage();
    const useRaidStore = await loadStore(storage);

    useRaidStore.getState().assignTask("task-5", "agent-4");
    useRaidStore.getState().assignTask("task-5", "agent-2");

    const state = useRaidStore.getState().raid;
    const task = state.tasks.find((item) => item.id === "task-5");
    const newAgent = state.agents.find((item) => item.id === "agent-2");
    const oldAgent = state.agents.find((item) => item.id === "agent-4");

    expect(task?.assignedAgentId).toBe("agent-2");
    expect(task?.status).toBe("in_progress");

    expect(newAgent?.currentTaskId).toBe("task-5");
    expect(newAgent?.state).toBe("working");
    expect(newAgent?.status).toBe("busy");

    expect(oldAgent?.currentTaskId).toBeUndefined();
    expect(oldAgent?.state).toBe("idle");
    expect(oldAgent?.status).toBe("online");

    expect(state.events[0]?.type).toBe("task_assigned");
    expect(state.events[0]?.taskId).toBe("task-5");
    expect(state.events[0]?.agentId).toBe("agent-2");
    expect(state.events[1]?.type).toBe("task_assigned");
    expect(state.events[1]?.agentId).toBe("agent-4");
  });

  it("supports task status transitions and updates assigned agent state", async () => {
    const storage = new MemoryStorage();
    const useRaidStore = await loadStore(storage);

    useRaidStore.getState().assignTask("task-5", "agent-4");
    useRaidStore.getState().updateTaskStatus("task-5", "blocked");
    useRaidStore.getState().updateTaskStatus("task-5", "in_progress");
    useRaidStore.getState().updateTaskStatus("task-5", "done");

    const state = useRaidStore.getState().raid;
    const task = state.tasks.find((item) => item.id === "task-5");
    const agent = state.agents.find((item) => item.id === "agent-4");

    expect(task?.status).toBe("done");
    expect(task?.blockerReason).toBeUndefined();
    expect(agent?.currentTaskId).toBeUndefined();
    expect(agent?.state).toBe("completed");
    expect(agent?.status).toBe("online");

    expect(state.events[0]?.type).toBe("task_status_changed");
    expect(state.events[0]?.taskId).toBe("task-5");
    expect(state.events[0]?.note).toContain("done");
  });

  it("resolves blocked assigned tasks back to in_progress and records blocker events", async () => {
    const storage = new MemoryStorage();
    const useRaidStore = await loadStore(storage);

    useRaidStore.getState().resolveBlocker("task-4", "Snapshots are restored.");

    const state = useRaidStore.getState().raid;
    const task = state.tasks.find((item) => item.id === "task-4");

    expect(task?.status).toBe("in_progress");
    expect(task?.blockerReason).toBeUndefined();
    expect(state.events[0]?.type).toBe("blocker_resolved");
    expect(state.events[0]?.taskId).toBe("task-4");
    expect(state.events[0]?.agentId).toBe("agent-3");
    expect(state.events[0]?.note).toBe("Snapshots are restored.");
  });

  it("resolves blocked unassigned tasks back to todo", async () => {
    const storage = new MemoryStorage();
    const useRaidStore = await loadStore(storage);

    useRaidStore.setState((current) => ({
      raid: {
        ...current.raid,
        tasks: current.raid.tasks.map((task) =>
          task.id === "task-3" ? { ...task, status: "blocked", blockerReason: "Awaiting dependency" } : task
        )
      }
    }));

    useRaidStore.getState().resolveBlocker("task-3", "Dependency path corrected.");

    const state = useRaidStore.getState().raid;
    const task = state.tasks.find((item) => item.id === "task-3");

    expect(task?.assignedAgentId).toBeUndefined();
    expect(task?.status).toBe("todo");
    expect(task?.blockerReason).toBeUndefined();
    expect(state.events[0]?.type).toBe("blocker_resolved");
    expect(state.events[0]?.agentId).toBeUndefined();
  });

  it("auto-unblocks dependent tasks only when all dependencies are done", async () => {
    const storage = new MemoryStorage();
    const useRaidStore = await loadStore(storage);

    useRaidStore.setState((current) => ({
      raid: {
        ...current.raid,
        tasks: current.raid.tasks.map((task) => {
          if (task.id === "task-3") {
            return { ...task, status: "blocked", blockerReason: "Waiting on task-1" };
          }
          if (task.id === "task-4") {
            return { ...task, status: "blocked", blockerReason: "Waiting on task-1 and task-2" };
          }
          return task;
        })
      }
    }));

    useRaidStore.getState().updateTaskStatus("task-1", "done", "task-1 complete");

    const state = useRaidStore.getState().raid;
    const task3 = state.tasks.find((item) => item.id === "task-3");
    const task4 = state.tasks.find((item) => item.id === "task-4");

    expect(task3?.status).toBe("todo");
    expect(task3?.blockerReason).toBeUndefined();
    expect(task4?.status).toBe("blocked");

    const autoUnblockEvent = state.events.find(
      (event) => event.taskId === "task-3" && event.note === "Auto-unblocked after dependencies completed."
    );
    expect(autoUnblockEvent?.type).toBe("task_status_changed");
  });

  it("computes per-agent load via selector and excludes done tasks", async () => {
    const storage = new MemoryStorage();
    const useRaidStore = await loadStore(storage);

    useRaidStore.setState((current) => ({
      raid: {
        ...current.raid,
        tasks: current.raid.tasks.map((task) => {
          if (task.id === "task-1") {
            return { ...task, status: "done" };
          }
          if (task.id === "task-5") {
            return { ...task, assignedAgentId: "agent-2", status: "in_progress" };
          }
          return task;
        })
      }
    }));

    const load = selectAgentLoad(useRaidStore.getState());

    expect(load["agent-2"]).toBe(1);
    expect(load["agent-1"]).toBe(1);
    expect(load["agent-3"]).toBe(1);
    expect(load["agent-4"]).toBeUndefined();
  });

  it("persists changes to localStorage after mutations", async () => {
    const storage = new MemoryStorage();
    const useRaidStore = await loadStore(storage);

    useRaidStore.getState().assignTask("task-5", "agent-4");

    const raw = storage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();

    const persisted = JSON.parse(raw as string) as { tasks: Array<{ id: string; assignedAgentId?: string }>; events: Array<{ type: string }> };

    expect(persisted.tasks.find((task) => task.id === "task-5")?.assignedAgentId).toBe("agent-4");
    expect(persisted.events[0]?.type).toBe("task_assigned");
  });

  it("rehydrates state from localStorage on store initialization", async () => {
    const storage = new MemoryStorage();
    let useRaidStore = await loadStore(storage);

    const seeded = structuredClone(useRaidStore.getState().raid);
    seeded.raidId = "raid-rehydrated";
    seeded.filter.showOnlyBlocked = true;
    seeded.selectedTaskId = "task-4";

    storage.setItem(STORAGE_KEY, JSON.stringify(seeded));

    useRaidStore = await loadStore(storage);

    const state = useRaidStore.getState().raid;

    expect(state.raidId).toBe("raid-rehydrated");
    expect(state.filter.showOnlyBlocked).toBe(true);
    expect(state.selectedTaskId).toBe("task-4");
  });
});

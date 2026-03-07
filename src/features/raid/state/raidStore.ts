import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { raidService } from "../services/raidService";
import { safeAssignTask, safeResolveBlocker, safeUpdateAgentState, safeUpdateTaskStatus } from "./safeRaidUpdates";
import type { AgentState, ID, RaidPhase, RaidState, TaskStatus } from "../types/raid";
import type { RaidActions } from "./actions";

interface RaidSlice {
  raid: RaidState;
}

export type RaidStore = RaidSlice & RaidActions;

const initialRaidState = raidService.load();

export const useRaidStore = create<RaidStore>()(
  subscribeWithSelector((set) => ({
    raid: initialRaidState,

    assignTask: (taskId: ID, agentId: ID) => {
      set((state) => ({
        raid: safeAssignTask(state.raid, taskId, agentId)
      }));
    },

    updateTaskStatus: (taskId: ID, status: TaskStatus, note?: string) => {
      set((state) => ({
        raid: safeUpdateTaskStatus(state.raid, taskId, status, note)
      }));
    },

    resolveBlocker: (taskId: ID, resolutionNote: string) => {
      set((state) => ({
        raid: safeResolveBlocker(state.raid, taskId, resolutionNote)
      }));
    },

    updateAgentState: (agentId: ID, stateValue: AgentState) => {
      set((state) => ({
        raid: safeUpdateAgentState(state.raid, agentId, stateValue)
      }));
    },

    setBossPhase: (phase: RaidPhase) => {
      set((state) => ({
        raid: {
          ...state.raid,
          boss: {
            ...state.raid.boss,
            currentPhase: phase
          }
        }
      }));
    },

    setSelectedTaskId: (taskId?: ID) => {
      set((state) => ({
        raid: {
          ...state.raid,
          selectedTaskId: taskId
        }
      }));
    },

    setFilter: (payload) => {
      set((state) => ({
        raid: {
          ...state.raid,
          filter: {
            ...state.raid.filter,
            ...payload
          }
        }
      }));
    }
  }))
);

useRaidStore.subscribe(
  (state) => state.raid,
  (raidState) => {
    raidService.save(raidState);
  }
);

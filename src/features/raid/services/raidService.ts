import seededRaidStateJson from "../data/seededRaidState.json";
import { validateRaidState } from "./raidSchema";
import type { RaidState } from "../types/raid";

const STORAGE_KEY = "party-leader-raid-state-v1";

const seededValidation = validateRaidState(seededRaidStateJson);
const seededState: RaidState = structuredClone(seededValidation.value);

function parseState(raw: string): RaidState | undefined {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return validateRaidState(parsed).value;
  } catch {
    return undefined;
  }
}

export const raidService = {
  load(): RaidState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return structuredClone(seededState);
      }

      const parsed = parseState(raw);
      if (!parsed) {
        return structuredClone(seededState);
      }

      return parsed;
    } catch {
      return structuredClone(seededState);
    }
  },

  save(state: RaidState): void {
    const safe = validateRaidState(state).value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
  }
};

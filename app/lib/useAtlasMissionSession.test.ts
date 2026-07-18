import { describe, expect, it } from "vitest";
import {
  emptyAtlasMissionCapsuleRestoreSummary,
  loadAtlasMissionHubStoredState,
} from "./useAtlasMissionSession";
import { ATLAS_MISSION_HUB_STORAGE_KEY } from "./atlasMissionHub";
import { ATLAS_MISSION_CAPSULE_VERSION } from "./atlasMissionCapsule";

describe("useAtlasMissionSession v175 contract", () => {
  it("preserves the frozen empty restore summary", () => {
    expect(emptyAtlasMissionCapsuleRestoreSummary()).toEqual({
      version: ATLAS_MISSION_CAPSULE_VERSION,
      source: "none",
      active: false,
      createdAt: "",
      restoredCount: 0,
      warningCount: 0,
      warnings: [],
    });
  });

  it("loads the existing storage key and fails closed", () => {
    const reads: string[] = [];
    const state = loadAtlasMissionHubStoredState({
      getItem(key) {
        reads.push(key);
        return JSON.stringify({ recentActions: [], pinnedItems: [] });
      },
    });
    expect(reads).toEqual([ATLAS_MISSION_HUB_STORAGE_KEY]);
    expect(state).toEqual({ recentActions: [], pinnedItems: [] });
    expect(loadAtlasMissionHubStoredState({ getItem: () => { throw new Error("denied"); } }))
      .toEqual({ recentActions: [], pinnedItems: [] });
  });
});

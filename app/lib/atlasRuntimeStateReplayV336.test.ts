import { describe, expect, it } from "vitest";
import { diffAtlasResourceSnapshotsV300, getAtlasResourceSnapshot } from "./atlasResourceLifecycle";
import { atlasRuntimeStore } from "./atlasRuntimeStore";
import { runAtlasRuntimeStateReplayV336 } from "./atlasRuntimeStateReplayV336";

const canvasAudit = {
  canvasCountBefore: 1,
  canvasCountAfter: 1,
  universeCanvasComponentCount: 1,
  sceneHostMountCount: 1,
  sceneHostLimitDeclared: true,
} as const;

describe("v336 visual profile runtime state replay", () => {
  it("replays Legacy to V5 to V6 to Legacy with no state or resource identity drift", () => {
    const stateBefore = atlasRuntimeStore.getSnapshot();
    const resourcesBefore = getAtlasResourceSnapshot();
    const replay = runAtlasRuntimeStateReplayV336(canvasAudit);
    const stateAfter = atlasRuntimeStore.getSnapshot();
    expect(replay).toMatchObject({
      status: "qualified-profile-state-camera-canvas-baseline-return",
      sequence: ["legacy-v9", "science-cinematic-v5-v299", "science-cinematic-v6-v300", "legacy-v9"],
      originalProfileRestored: true,
      allModifiedGlobalStoreFieldsRestored: true,
      sceneRevisionDelta: 0,
      selectionStable: true,
      sceneModeStable: true,
      scaleBandStable: true,
      scaleJourneyStable: true,
      researchStateStable: true,
      focusStateStable: true,
      panelStateStable: true,
      resolverReferencesStable: true,
      profileResourceDriftAbsent: true,
      cameraLeaseIdentityReturnedToBaseline: true,
      singleCanvasStable: true,
      runtimePhysicsContextStable: true,
      scienceCinematicPresentationDidNotMutateSelectionOrPhysics: true,
    });
    expect(replay.transitions).toHaveLength(3);
    expect(replay.transitions.every((entry) => entry.sceneRevisionDelta === 0 && entry.changedKeys.join(",") === "visualProfile")).toBe(true);
    expect(replay.cameraLeaseDuring).toMatchObject({ status: "drift", total: 1, cameraLocks: 1, estimatedBytes: 0, estimatedGpuBytes: 0 });
    expect(replay.afterCameraRelease).toMatchObject({ status: "baseline", total: 0, cameraLocks: 0, identityChanged: false, ownerChanged: false });
    expect(stateAfter).toEqual(stateBefore);
    expect(diffAtlasResourceSnapshotsV300(resourcesBefore, getAtlasResourceSnapshot()).status).toBe("baseline");
  });

  it("restores a non-Legacy original profile after the bounded replay", () => {
    const originalProfile = atlasRuntimeStore.getSnapshot().visualProfile;
    try {
      atlasRuntimeStore.setVisualProfile("science-cinematic-v5-v299");
      const replay = runAtlasRuntimeStateReplayV336(canvasAudit);
      expect(replay.originalProfile).toBe("science-cinematic-v5-v299");
      expect(atlasRuntimeStore.getSnapshot().visualProfile).toBe("science-cinematic-v5-v299");
    } finally {
      atlasRuntimeStore.setVisualProfile(originalProfile);
    }
  });
});

import { describe, expect, it } from "vitest";
import { diffAtlasResourceSnapshotsV300, getAtlasResourceSnapshot } from "./atlasResourceLifecycle";
import { ATLAS_RESOURCE_LIFECYCLE_REPLAY_CASES_V335, runAtlasResourceLifecycleReplayV335 } from "./atlasResourceLifecycleReplayV335";

describe("v335 all-kind lifecycle replay", () => {
  it("covers every registry kind and returns identity, owners and bytes to baseline after duplicate release", () => {
    const baseline = getAtlasResourceSnapshot();
    const replay = runAtlasResourceLifecycleReplayV335();
    expect(new Set(ATLAS_RESOURCE_LIFECYCLE_REPLAY_CASES_V335.map((entry) => entry.kind)).size).toBe(11);
    expect(replay).toMatchObject({ status: "qualified-all-kinds-idempotent-baseline-return", resourceKindCount: 11, acquiredCount: 11, uniqueIdentityCount: 11, allKindsCovered: true, reverseRelease: true, idempotentRelease: true, identityReturnedToBaseline: true, ownerReturnedToBaseline: true });
    expect(replay.during).toMatchObject({ status: "drift", total: 11, workers: 1, gpuRenderTargets: 1, gpuBuffers: 1, gpuComputePipelines: 1, gpuQueries: 1, textures: 1, models: 1, subscriptions: 1, objectUrls: 1, typedArrayCaches: 1, cameraLocks: 1 });
    expect(replay.afterFirstRelease).toMatchObject({ status: "baseline", total: 0, estimatedBytes: 0, estimatedGpuBytes: 0, identityChanged: false, ownerChanged: false });
    expect(replay.afterDuplicateRelease).toEqual(replay.afterFirstRelease);
    expect(diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot()).status).toBe("baseline");
  });
});

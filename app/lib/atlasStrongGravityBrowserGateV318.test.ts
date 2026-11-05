import { describe, expect, it } from "vitest";
import {
  evaluateAtlasStrongGravityBrowserGateV318,
  type AtlasStrongGravityBrowserSnapshotV318,
} from "./atlasStrongGravityBrowserGateV318";

const sha = "a".repeat(64);
const resource = () => ({
  total: 0, workers: 0, renderTargets: 0, gpuBuffers: 0, gpuPipelines: 0, gpuQueries: 0,
  textures: 0, models: 0, subscriptions: 0, objectUrls: 0, typedArrayCaches: 0, cameraLocks: 0,
  estimatedBytes: 0, estimatedGpuBytes: 0, identityDigest: "811c9dc5", ownerCount: 0,
});

function snapshot(overrides: Partial<AtlasStrongGravityBrowserSnapshotV318> = {}): AtlasStrongGravityBrowserSnapshotV318 {
  return {
    canvasCount: 1,
    sceneRevision: 12,
    renderMode: "inactive",
    postFxPolicy: "scene-default",
    scienceAuthorityKind: "unavailable",
    geometryAuthoritySha256: "unavailable",
    polarizationAuthoritySha256: "unavailable",
    rayPlanAuthoritySha256: "unavailable",
    denseAggregateSha256: "unavailable",
    scienceRasterVersion: "unavailable",
    scienceRasterBoundary: "unavailable",
    scienceRasterSampleCount: 0,
    scienceRasterEvpaGlyphCount: 0,
    scienceRasterImageOrderGlyphCount: 0,
    sciencePayloadDigestSha256: "unavailable",
    scienceRasterDigestSha256: "unavailable",
    sciencePayloadUnchanged: null,
    scienceBuffersDisjoint: null,
    scienceDenseBoundary: "unavailable",
    lifecycleBaselineDigest: "unavailable",
    lifecycleReturnDigest: "unavailable",
    lifecycleReturnedToBaseline: null,
    resourceScopeReleaseCount: 0,
    resourceScopeFailureCount: 0,
    resources: resource(),
    ...overrides,
  };
}

function fixture() {
  const baseline = snapshot();
  const science = snapshot({
    renderMode: "science",
    postFxPolicy: "science-bypassed",
    scienceAuthorityKind: "v312-v313-short-gate-sparse",
    geometryAuthoritySha256: "dec9aa5644e602dd41c82d3a21faf9edf9865d4c2a430010ecae890388e5290e",
    polarizationAuthoritySha256: "e4b6044ed828f31b7eb511b4e722bc474414acdcab8cedbdf16484b20216ae6f",
    rayPlanAuthoritySha256: "89ce45769978650c177acb83a0c37ceb1c0a1a6f6db34655448f5c6fcb896c04",
    denseAggregateSha256: "unavailable",
    scienceRasterVersion: "v307-kerr-sparse-science-raster-v1",
    scienceRasterBoundary: "sparse-authority-visualization-not-dense-transfer-map",
    scienceRasterSampleCount: 16,
    scienceRasterEvpaGlyphCount: 4,
    scienceRasterImageOrderGlyphCount: 4,
    sciencePayloadDigestSha256: sha,
    scienceRasterDigestSha256: "b".repeat(64),
    sciencePayloadUnchanged: true,
    scienceBuffersDisjoint: true,
    scienceDenseBoundary: "sparse-authority-dense-incomplete",
  });
  const afterExit = snapshot({
    ...science,
    renderMode: "inactive",
    postFxPolicy: "scene-default",
    resourceScopeReleaseCount: 1,
    lifecycleBaselineDigest: "811c9dc5",
    lifecycleReturnDigest: "811c9dc5",
    lifecycleReturnedToBaseline: true,
  });
  return { baseline, science, afterExit, mobile: false };
}

describe("v318 browser buffer/lifecycle gate", () => {
  it("requires byte digests, disjointness and an exact lifecycle return", () => {
    expect(evaluateAtlasStrongGravityBrowserGateV318(fixture())).toEqual({
      version: "v318-strong-gravity-buffer-lifecycle-browser-gate",
      passed: true,
      failures: [],
      boundary: "local-shadow-browser-buffer-lifecycle-qualification-only-no-product-promotion",
    });
  });

  it("fails closed on mutation, aliasing, digest loss and baseline drift", () => {
    const input = fixture();
    const result = evaluateAtlasStrongGravityBrowserGateV318({
      ...input,
      science: { ...input.science, sciencePayloadUnchanged: false, scienceBuffersDisjoint: false, sciencePayloadDigestSha256: "unavailable" },
      afterExit: { ...input.afterExit, lifecycleReturnDigest: "deadbeef", lifecycleReturnedToBaseline: false },
    });
    expect(result.passed).toBe(false);
    expect(result.failures).toEqual(expect.arrayContaining(["science-buffer-integrity", "science-buffer-telemetry-lost", "lifecycle-baseline-return"]));
  });
});

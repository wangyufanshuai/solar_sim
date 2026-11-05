import { describe, expect, it } from "vitest";
import {
  evaluateAtlasStrongGravityBrowserGateV321,
  type AtlasStrongGravityBrowserSnapshotV321,
} from "./atlasStrongGravityBrowserGateV321";

const sha = "a".repeat(64);
const resource = () => ({
  total: 0, workers: 0, renderTargets: 0, gpuBuffers: 0, gpuPipelines: 0, gpuQueries: 0,
  textures: 0, models: 0, subscriptions: 0, objectUrls: 0, typedArrayCaches: 0, cameraLocks: 0,
  estimatedBytes: 0, estimatedGpuBytes: 0, identityDigest: "811c9dc5", ownerCount: 0,
});

function snapshot(overrides: Partial<AtlasStrongGravityBrowserSnapshotV321> = {}): AtlasStrongGravityBrowserSnapshotV321 {
  return {
    canvasCount: 1, sceneRevision: 12, renderMode: "inactive", postFxPolicy: "scene-default",
    scienceAuthorityKind: "unavailable", geometryAuthoritySha256: "unavailable", polarizationAuthoritySha256: "unavailable",
    rayPlanAuthoritySha256: "unavailable", denseAggregateSha256: "unavailable", scienceRasterVersion: "unavailable",
    scienceRasterBoundary: "unavailable", scienceRasterSampleCount: 0, scienceRasterEvpaGlyphCount: 0,
    scienceRasterImageOrderGlyphCount: 0, sciencePayloadDigestSha256: "unavailable", scienceRasterDigestSha256: "unavailable",
    sciencePayloadUnchanged: null, scienceBuffersDisjoint: null, scienceDenseBoundary: "unavailable",
    scienceBandArtifactSha256: "unavailable", scienceBandViewDigestSha256: "unavailable", scienceBandViewUnchanged: null,
    scienceBandCount: 0, scienceBandSaturationCount: 0, scienceBandNormalization: "unavailable",
    scienceCinematicBufferShared: null, lifecycleBaselineDigest: "unavailable", lifecycleReturnDigest: "unavailable",
    lifecycleReturnedToBaseline: null, resourceScopeReleaseCount: 0, resourceScopeFailureCount: 0, resources: resource(), ...overrides,
  };
}

function fixture() {
  const baseline = snapshot();
  const science = snapshot({
    renderMode: "science", postFxPolicy: "science-bypassed", scienceAuthorityKind: "v312-v313-short-gate-sparse",
    geometryAuthoritySha256: "dec9aa5644e602dd41c82d3a21faf9edf9865d4c2a430010ecae890388e5290e",
    polarizationAuthoritySha256: "e4b6044ed828f31b7eb511b4e722bc474414acdcab8cedbdf16484b20216ae6f",
    rayPlanAuthoritySha256: "89ce45769978650c177acb83a0c37ceb1c0a1a6f6db34655448f5c6fcb896c04",
    denseAggregateSha256: "unavailable", scienceRasterVersion: "v321-kerr-fixed-band-sparse-science-raster-v1",
    scienceRasterBoundary: "sparse-authority-fixed-band-visualization-not-dense-transfer-map", scienceRasterSampleCount: 16,
    scienceRasterEvpaGlyphCount: 4, scienceRasterImageOrderGlyphCount: 4, sciencePayloadDigestSha256: sha,
    scienceRasterDigestSha256: "b".repeat(64), sciencePayloadUnchanged: true, scienceBuffersDisjoint: true,
    scienceDenseBoundary: "sparse-authority-dense-incomplete",
    scienceBandArtifactSha256: "e2bd5957a1dd53a0942d5f7cd519d7b1dd84af1db7f476eb0f9dda0a65c5a460",
    scienceBandViewDigestSha256: "c".repeat(64), scienceBandViewUnchanged: true, scienceBandCount: 3,
    scienceBandSaturationCount: 0, scienceBandNormalization: "fixed-physical-reference-no-data-adaptive-rescale",
    scienceCinematicBufferShared: false,
  });
  const afterExit = snapshot({ ...science, renderMode: "inactive", postFxPolicy: "scene-default", resourceScopeReleaseCount: 1,
    lifecycleBaselineDigest: "811c9dc5", lifecycleReturnDigest: "811c9dc5", lifecycleReturnedToBaseline: true });
  return { baseline, science, afterExit, mobile: false };
}

describe("v321 fixed-band browser gate", () => {
  it("qualifies only the v321 raster with immutable fixed-band telemetry and full lifecycle return", () => {
    expect(evaluateAtlasStrongGravityBrowserGateV321(fixture())).toEqual({
      version: "v321-strong-gravity-fixed-band-browser-gate", passed: true, failures: [],
      boundary: "local-shadow-fixed-band-browser-qualification-only-no-product-promotion",
    });
  });

  it("fails closed on adaptive normalization, band mutation, sharing or stale raster identity", () => {
    const input = fixture();
    const result = evaluateAtlasStrongGravityBrowserGateV321({
      ...input,
      science: { ...input.science, scienceRasterVersion: "v307-kerr-sparse-science-raster-v1", scienceBandViewUnchanged: false,
        scienceBandNormalization: "per-frame-max", scienceCinematicBufferShared: true },
      afterExit: { ...input.afterExit, scienceBandViewDigestSha256: "d".repeat(64) },
    });
    expect(result.passed).toBe(false);
    expect(result.failures).toEqual(expect.arrayContaining([
      "science-raster-boundary", "science-fixed-band-integrity", "science-fixed-band-telemetry-lost",
    ]));
  });
});

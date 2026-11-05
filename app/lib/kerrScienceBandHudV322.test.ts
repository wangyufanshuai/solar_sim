import { describe, expect, it } from "vitest";
import { resolveAtlasVisualProfileV299, ATLAS_VISUAL_PROFILE_CANDIDATE_V299, ATLAS_VISUAL_PROFILE_CANDIDATE_V300 } from "./atlasVisualProfileV299";
import { createKerrScienceBandHudModelV322 } from "./kerrScienceBandHudV322";
import type { AtlasStrongGravityTelemetrySnapshotV309 } from "./atlasStrongGravityTelemetryV309";

const sha = "a".repeat(64);
function telemetry(overrides: Partial<AtlasStrongGravityTelemetrySnapshotV309> = {}): AtlasStrongGravityTelemetrySnapshotV309 {
  return {
    version: "v309-atlas-strong-gravity-telemetry",
    scienceRasterVersion: "v321-kerr-fixed-band-sparse-science-raster-v1",
    scienceRasterBoundary: "sparse-authority-fixed-band-visualization-not-dense-transfer-map",
    scienceRasterSampleCount: 16,
    scienceRasterEvpaGlyphCount: 4,
    scienceRasterImageOrderGlyphCount: 4,
    sciencePayloadDigestSha256: sha,
    scienceRasterDigestSha256: sha,
    sciencePayloadUnchanged: true,
    scienceBuffersDisjoint: true,
    scienceDenseBoundary: "sparse-authority-dense-incomplete",
    scienceBandArtifactSha256: sha,
    scienceBandViewDigestSha256: sha,
    scienceBandViewUnchanged: true,
    scienceBandCount: 3,
    scienceBandSaturationCount: 0,
    scienceBandNormalization: "fixed-physical-reference-no-data-adaptive-rescale",
    scienceCinematicBufferShared: false,
    interactiveAuthoritySha256: null,
    interactiveBuffersDisjoint: null,
    scopeReleaseCount: 1,
    releasedResourceCount: 0,
    scopeFailureCount: 0,
    lastScopeLabel: null,
    lastScopeReason: null,
    lifecycleBaselineDigest: null,
    lifecycleReturnDigest: null,
    lifecycleReturnedToBaseline: null,
    revision: 2,
    ...overrides,
  };
}

describe("v322 fixed-band Science HUD", () => {
  it("consumes the same fixed-band telemetry for V5 and V6 without changing authority", () => {
    for (const profileId of [ATLAS_VISUAL_PROFILE_CANDIDATE_V299, ATLAS_VISUAL_PROFILE_CANDIDATE_V300]) {
      const model = createKerrScienceBandHudModelV322(telemetry(), resolveAtlasVisualProfileV299(profileId), "science");
      expect(model).toMatchObject({
        status: "ready", mode: "science", profileId,
        displayTransform: "linear-no-grade", tokenSource: profileId === ATLAS_VISUAL_PROFILE_CANDIDATE_V300 ? "v6" : "v5",
        diskRayCount: 4, bandCount: 3, saturationCount: 0,
        normalization: "fixed-physical-reference-no-data-adaptive-rescale",
        payloadUnchanged: true, bandViewUnchanged: true, buffersDisjoint: true, cinematicBufferShared: false,
        denseBoundary: "sparse-authority-dense-incomplete",
      });
    }
  });

  it("hides the measurement HUD in Cinematic and fails closed on stale or adaptive telemetry", () => {
    const profile = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V300);
    expect(createKerrScienceBandHudModelV322(telemetry(), profile, "cinematic").status).toBe("hidden-cinematic");
    expect(createKerrScienceBandHudModelV322(telemetry({ scienceBandNormalization: "per-frame-max", scienceBandViewUnchanged: false }), profile, "science").status).toBe("pending-authority");
  });

  it("uses telemetry only and never performs artifact fetches or science mutation", () => {
    const source = JSON.stringify(createKerrScienceBandHudModelV322(telemetry(), resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V299), "science"));
    expect(source).toContain("measurement-hud-read-only-telemetry-no-science-mutation");
  });
});

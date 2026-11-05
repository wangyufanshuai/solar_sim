import { describe, expect, it } from "vitest";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V299, ATLAS_VISUAL_PROFILE_CANDIDATE_V300, resolveAtlasVisualProfileV299 } from "./atlasVisualProfileV299";
import { createKerrScienceBandHudModelV322 } from "./kerrScienceBandHudV322";
import { compareKerrScienceProfilesV324 } from "./kerrScienceProfileABV324";
import type { AtlasStrongGravityTelemetrySnapshotV309 } from "./atlasStrongGravityTelemetryV309";

const sha = "a".repeat(64);
const telemetry = {
  version: "v309-atlas-strong-gravity-telemetry", scienceRasterVersion: "v321-kerr-fixed-band-sparse-science-raster-v1",
  scienceRasterBoundary: "sparse-authority-fixed-band-visualization-not-dense-transfer-map", scienceRasterSampleCount: 16,
  scienceRasterEvpaGlyphCount: 4, scienceRasterImageOrderGlyphCount: 4, sciencePayloadDigestSha256: sha, scienceRasterDigestSha256: sha,
  sciencePayloadUnchanged: true, scienceBuffersDisjoint: true, scienceDenseBoundary: "sparse-authority-dense-incomplete",
  scienceBandArtifactSha256: sha, scienceBandViewDigestSha256: sha, scienceBandViewUnchanged: true, scienceBandCount: 3,
  scienceBandSaturationCount: 0, scienceBandNormalization: "fixed-physical-reference-no-data-adaptive-rescale", scienceCinematicBufferShared: false,
  interactiveAuthoritySha256: null, interactiveBuffersDisjoint: null, scopeReleaseCount: 0, releasedResourceCount: 0, scopeFailureCount: 0,
  lastScopeLabel: null, lastScopeReason: null, lifecycleBaselineDigest: null, lifecycleReturnDigest: null, lifecycleReturnedToBaseline: null, revision: 0,
} satisfies AtlasStrongGravityTelemetrySnapshotV309;

describe("v324 V5/V6 science profile A/B", () => {
  it("proves science fields and authority digests remain equal while cinematic tokens differ", () => {
    const v5 = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V299);
    const v6 = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V300);
    const hud = createKerrScienceBandHudModelV322(telemetry, v6, "science");
    expect(compareKerrScienceProfilesV324(v5, v6, hud)).toMatchObject({
      status: "qualified-science-equivalent", scienceTokenEquivalent: true, scienceTokenMismatches: [],
      cinematicTokensDistinct: true, scienceDigestStable: true,
      exportBoundary: "v323-read-only-provenance-view-stable-before-after-profile-ab",
      defaultBoundary: "manual-local-shadow-ab-only-default-legacy-v9",
    });
  });

  it("fails closed when a Science token or digest is changed", () => {
    const v5 = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V299);
    const v6 = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V300);
    const hud = createKerrScienceBandHudModelV322(telemetry, v6, "science");
    const changed = { ...v6, runtimeTokens: { ...v6.runtimeTokens, strongGravityV6: { ...v6.runtimeTokens.strongGravityV6, scienceNoise: 0.01 as 0 } } } as typeof v6;
    expect(compareKerrScienceProfilesV324(v5, changed, hud).status).toBe("blocked-science-token-drift");
    expect(compareKerrScienceProfilesV324(v5, v6, { ...hud, bandViewUnchanged: false }).status).toBe("blocked-science-token-drift");
  });
});

import { describe, expect, it } from "vitest";
import { resolveAtlasVisualProfileV299, ATLAS_VISUAL_PROFILE_CANDIDATE_V300 } from "./atlasVisualProfileV299";
import { createKerrScienceBandHudModelV322 } from "./kerrScienceBandHudV322";
import {
  createKerrScienceBandProvenanceV323,
  parseKerrScienceBandProvenanceV323,
  serializeKerrScienceBandProvenanceCsvV323,
  serializeKerrScienceBandProvenanceJsonV323,
} from "./kerrScienceBandProvenanceV323";
import type { AtlasStrongGravityTelemetrySnapshotV309 } from "./atlasStrongGravityTelemetryV309";

const sha = "a".repeat(64);
const telemetry = {
  version: "v309-atlas-strong-gravity-telemetry",
  scienceRasterVersion: "v321-kerr-fixed-band-sparse-science-raster-v1",
  scienceRasterBoundary: "sparse-authority-fixed-band-visualization-not-dense-transfer-map",
  scienceRasterSampleCount: 16, scienceRasterEvpaGlyphCount: 4, scienceRasterImageOrderGlyphCount: 4,
  sciencePayloadDigestSha256: sha, scienceRasterDigestSha256: sha, sciencePayloadUnchanged: true, scienceBuffersDisjoint: true,
  scienceDenseBoundary: "sparse-authority-dense-incomplete", scienceBandArtifactSha256: sha, scienceBandViewDigestSha256: sha,
  scienceBandViewUnchanged: true, scienceBandCount: 3, scienceBandSaturationCount: 0,
  scienceBandNormalization: "fixed-physical-reference-no-data-adaptive-rescale", scienceCinematicBufferShared: false,
  interactiveAuthoritySha256: null, interactiveBuffersDisjoint: null, scopeReleaseCount: 0, releasedResourceCount: 0,
  scopeFailureCount: 0, lastScopeLabel: null, lastScopeReason: null, lifecycleBaselineDigest: null, lifecycleReturnDigest: null,
  lifecycleReturnedToBaseline: null, revision: 0,
} satisfies AtlasStrongGravityTelemetrySnapshotV309;

describe("v323 science provenance export", () => {
  it("serializes the same sanitized JSON/CSV view without ray buffers or host fields", async () => {
    const model = createKerrScienceBandHudModelV322(telemetry, resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V300), "science");
    const provenance = await createKerrScienceBandProvenanceV323(model);
    expect(parseKerrScienceBandProvenanceV323(JSON.parse(serializeKerrScienceBandProvenanceJsonV323(provenance)))).toEqual(provenance);
    const csv = serializeKerrScienceBandProvenanceCsvV323(provenance);
    expect(csv).toContain("profileId,\"science-cinematic-v6-v300\"");
    expect(csv).toContain("bandCount,\"3\"");
    expect(csv).toContain("denseBoundary");
    expect(csv).not.toContain("rayBuffer");
    expect(csv).not.toContain("absolutePath");
    expect(csv).not.toContain("pid");
    expect(provenance.boundary).toBe("read-only-provenance-no-ray-buffer-no-screenshot-no-path-or-host");
  });

  it("fails closed on Cinematic or injected forbidden payload fields", async () => {
    const model = createKerrScienceBandHudModelV322(telemetry, resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V300), "cinematic");
    await expect(createKerrScienceBandProvenanceV323(model)).rejects.toThrow("v323-provenance-science-boundary");
    const science = await createKerrScienceBandProvenanceV323(createKerrScienceBandHudModelV322(telemetry, resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V300), "science"));
    expect(() => parseKerrScienceBandProvenanceV323({ ...science, rayBuffer: [] })).toThrow("v323-provenance-identity");
  });
});

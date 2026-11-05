import { describe, expect, it } from "vitest";
import {
  evaluateAtlasStrongGravityBrowserGateV310,
  type AtlasStrongGravityBrowserSnapshotV310,
} from "./atlasStrongGravityBrowserGateV310";
import { KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312 } from "./kerrAuthorityV312";
import { KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313 } from "./kerrAuthorityV313";
import { KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314 } from "./kerrCampaignV314";

const SHA = "a".repeat(64);

function snapshot(overrides: Partial<AtlasStrongGravityBrowserSnapshotV310> = {}): AtlasStrongGravityBrowserSnapshotV310 {
  return {
    canvasCount: 1,
    sceneRevision: 17,
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
    resourceScopeReleaseCount: 0,
    resourceScopeFailureCount: 0,
    resources: {
      total: 3,
      workers: 0,
      renderTargets: 0,
      gpuBuffers: 0,
      gpuPipelines: 0,
      gpuQueries: 0,
      textures: 2,
      models: 0,
      subscriptions: 1,
      objectUrls: 0,
      typedArrayCaches: 0,
      cameraLocks: 0,
      estimatedBytes: 4096,
      estimatedGpuBytes: 0,
      identityDigest: "deadbeef",
      ownerCount: 2,
    },
    ...overrides,
  };
}

function qualifiedFixture() {
  const baseline = snapshot();
  const science = snapshot({
    renderMode: "science",
    postFxPolicy: "science-bypassed",
    scienceAuthorityKind: "v312-v313-short-gate-sparse",
    geometryAuthoritySha256: KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312,
    polarizationAuthoritySha256: KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313,
    rayPlanAuthoritySha256: KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314,
    scienceRasterVersion: "v307-kerr-sparse-science-raster-v1",
    scienceRasterBoundary: "sparse-authority-visualization-not-dense-transfer-map",
    scienceRasterSampleCount: 16,
    scienceRasterEvpaGlyphCount: 4,
    scienceRasterImageOrderGlyphCount: 4,
    resourceScopeReleaseCount: 1,
    resources: {
      ...baseline.resources,
      total: 5,
      textures: 3,
      typedArrayCaches: 1,
      estimatedBytes: 270_336,
      identityDigest: "cafebabe",
      ownerCount: 4,
    },
  });
  const afterExit = snapshot({
    scienceRasterVersion: science.scienceRasterVersion,
    scienceRasterBoundary: science.scienceRasterBoundary,
    scienceRasterSampleCount: 16,
    scienceRasterEvpaGlyphCount: 4,
    scienceRasterImageOrderGlyphCount: 4,
    resourceScopeReleaseCount: 2,
  });
  return { baseline, science, afterExit };
}

describe("v310 strong-gravity browser gate", () => {
  it("qualifies a sparse Science cycle only after full resource return", () => {
    const result = evaluateAtlasStrongGravityBrowserGateV310({ ...qualifiedFixture(), mobile: false });
    expect(result).toEqual({
      version: "v310-strong-gravity-browser-gate",
      passed: true,
      failures: [],
      boundary: "local-shadow-browser-qualification-only-no-product-promotion",
    });
  });

  it("fails closed on authority, raster, scope, GPU, scene or lifecycle drift", () => {
    const fixture = qualifiedFixture();
    const result = evaluateAtlasStrongGravityBrowserGateV310({
      baseline: fixture.baseline,
      science: {
        ...fixture.science,
        sceneRevision: 18,
        denseAggregateSha256: SHA,
        scienceRasterSampleCount: 15,
        resourceScopeFailureCount: 1,
        resources: { ...fixture.science.resources, workers: 1, estimatedGpuBytes: 97 * 2 ** 20 },
      },
      afterExit: {
        ...fixture.afterExit,
        resourceScopeReleaseCount: 1,
        resources: { ...fixture.afterExit.resources, textures: fixture.afterExit.resources.textures + 1 },
      },
      mobile: false,
    });
    expect(result.passed).toBe(false);
    expect(result.failures).toEqual(expect.arrayContaining([
      "science-scope-failure-count",
      "scene-revision-drift",
      "science-authority-boundary",
      "science-raster-boundary",
      "science-gpu-worker-boundary",
      "science-gpu-budget",
      "after-exit-resource-textures-drift",
      "science-scope-release-not-observed",
    ]));
  });

  it("applies the independent 32 MiB mobile Kerr GPU limit", () => {
    const fixture = qualifiedFixture();
    const result = evaluateAtlasStrongGravityBrowserGateV310({
      ...fixture,
      science: { ...fixture.science, resources: { ...fixture.science.resources, estimatedGpuBytes: 33 * 2 ** 20 } },
      mobile: true,
    });
    expect(result).toMatchObject({ passed: false, failures: ["science-gpu-budget"] });
  });

  it("rejects a missing Canvas or malformed resource telemetry", () => {
    const fixture = qualifiedFixture();
    const result = evaluateAtlasStrongGravityBrowserGateV310({
      ...fixture,
      afterExit: {
        ...fixture.afterExit,
        canvasCount: 0,
        resources: { ...fixture.afterExit.resources, identityDigest: "unavailable", estimatedBytes: -1 },
      },
      mobile: false,
    });
    expect(result.failures).toEqual(expect.arrayContaining([
      "after-exit-single-canvas",
      "after-exit-resource-identityDigest",
      "after-exit-resource-estimatedBytes",
      "after-exit-resource-identityDigest-drift",
      "after-exit-resource-estimatedBytes-drift",
    ]));
  });
});

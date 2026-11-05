import { describe, expect, it } from "vitest";
import {
  countAtlasDeepSpaceResourceRequestsV294,
  startAtlasBrowserObservabilityResourceBridgeV300,
  writeAtlasBrowserObservabilityV294,
} from "./atlasBrowserObservabilityV294";
import type { AtlasRuntimeResourceSnapshot } from "./atlasResourceLifecycle";
import type { AtlasStrongGravityTelemetrySnapshotV309 } from "./atlasStrongGravityTelemetryV309";

function resourceSnapshot(overrides: Partial<AtlasRuntimeResourceSnapshot> = {}): AtlasRuntimeResourceSnapshot {
  return {
    total: 0, workers: 0, gpuRenderTargets: 0, gpuBuffers: 0, gpuComputePipelines: 0,
    gpuQueries: 0, textures: 0, models: 0, subscriptions: 0, objectUrls: 0,
    typedArrayCaches: 0, cameraLocks: 0, estimatedBytes: 0, estimatedGpuBytes: 0,
    byOwner: {}, byKind: {} as AtlasRuntimeResourceSnapshot["byKind"], byIdentity: {}, identityDigest: "811c9dc5", revision: 0, ...overrides,
  };
}

function strongGravitySnapshot(overrides: Partial<AtlasStrongGravityTelemetrySnapshotV309> = {}): AtlasStrongGravityTelemetrySnapshotV309 {
  return {
    version: "v309-atlas-strong-gravity-telemetry",
    scienceRasterVersion: null,
    scienceRasterBoundary: null,
    scienceRasterSampleCount: 0,
    scienceRasterEvpaGlyphCount: 0,
    scienceRasterImageOrderGlyphCount: 0,
    sciencePayloadDigestSha256: null,
    scienceRasterDigestSha256: null,
    sciencePayloadUnchanged: null,
    scienceBuffersDisjoint: null,
    scienceDenseBoundary: null,
    scienceBandArtifactSha256: null,
    scienceBandViewDigestSha256: null,
    scienceBandViewUnchanged: null,
    scienceBandCount: 0,
    scienceBandSaturationCount: 0,
    scienceBandNormalization: null,
    scienceCinematicBufferShared: null,
    interactiveAuthoritySha256: null,
    interactiveBuffersDisjoint: null,
    scopeReleaseCount: 0,
    releasedResourceCount: 0,
    scopeFailureCount: 0,
    lastScopeLabel: null,
    lastScopeReason: null,
    lifecycleBaselineDigest: null,
    lifecycleReturnDigest: null,
    lifecycleReturnedToBaseline: null,
    revision: 0,
    ...overrides,
  };
}

describe("v294 browser observability", () => {
  it("counts only deep-space resource requests", () => {
    expect(countAtlasDeepSpaceResourceRequestsV294([
      "http://localhost/api/atlas/catalog/tile",
      "http://localhost/_next/static/chunk.js",
      "http://localhost/cosmic/openngc.bin",
    ])).toBe(2);
  });

  it("writes bounded data attributes without React state", () => {
    const node = { dataset: {} as DOMStringMap };
    writeAtlasBrowserObservabilityV294(node, { visualProfile: "science-cinematic-v6-v300", deepSpaceIntent: false, sceneRevision: 7, strongGravityRenderMode: "science", postFxPolicy: "science-bypassed", scientificPayloadSha256: "a".repeat(64), geometryAuthoritySha256: "b".repeat(64), polarizationAuthoritySha256: "c".repeat(64), rayPlanAuthoritySha256: "d".repeat(64), denseAggregateSha256: null, scienceAuthorityKind: "v312-v313-short-gate-sparse", scienceErrorBudgetVersion: "v315-sparse-release-residual-budget-v1", observerFrameVersion: "finite-distance-zamo-r30-theta70-v299", emitterFrameVersion: "equatorial-circular-geodesic-bl-v297", walkerPenroseModel: "standard-complex-kerr-walker-penrose", parallelTransportModel: "independent-cartesian-kerr-schild-hamiltonian-dop853", applicableDiskRayCount: 4 }, [], resourceSnapshot({ total: 4, workers: 1, textures: 2, typedArrayCaches: 1, estimatedBytes: 8192, estimatedGpuBytes: 4096, revision: 9 }), strongGravitySnapshot({ scienceRasterVersion: "v307-kerr-sparse-science-raster-v1", scienceRasterBoundary: "sparse-authority-visualization-not-dense-transfer-map", scienceRasterSampleCount: 16, scienceRasterEvpaGlyphCount: 4, scienceRasterImageOrderGlyphCount: 4, scopeReleaseCount: 2, releasedResourceCount: 7, scopeFailureCount: 0, lastScopeLabel: "kerr-science-sparse-texture", lastScopeReason: "science-effect-cleanup", revision: 3 }));
    expect(node.dataset).toMatchObject({
      atlasVisualProfileV294: "science-cinematic-v6-v300",
      atlasDeepSpaceIntentV294: "inactive",
      atlasDeepSpaceRequestCountV294: "0",
      atlasSceneRevisionV294: "7",
      atlasStrongGravityRenderModeV294: "science",
      atlasPostFxPolicyV294: "science-bypassed",
      atlasGeometryAuthorityShaV294: "b".repeat(64),
      atlasPolarizationAuthorityShaV294: "c".repeat(64),
      atlasRayPlanAuthorityShaV300: "d".repeat(64),
      atlasDenseAggregateShaV300: "unavailable",
      atlasScienceAuthorityKindV300: "v312-v313-short-gate-sparse",
      atlasScienceErrorBudgetVersionV300: "v315-sparse-release-residual-budget-v1",
      atlasObserverFrameV300: "finite-distance-zamo-r30-theta70-v299",
      atlasEmitterFrameV300: "equatorial-circular-geodesic-bl-v297",
      atlasWalkerPenroseModelV300: "standard-complex-kerr-walker-penrose",
      atlasParallelTransportModelV300: "independent-cartesian-kerr-schild-hamiltonian-dop853",
      atlasApplicableDiskRayCountV300: "4",
      atlasWorkerCountV294: "1",
      atlasTextureCountV294: "2",
      atlasTypedArrayCacheCountV294: "1",
      atlasEstimatedGpuBytesV294: "4096",
      atlasEstimatedResourceBytesV300: "8192",
      atlasResourceIdentityDigestV300: "811c9dc5",
      atlasResourceOwnerCountV300: "0",
      atlasResourceRevisionV300: "9",
      atlasScienceRasterVersionV309: "v307-kerr-sparse-science-raster-v1",
      atlasScienceRasterBoundaryV309: "sparse-authority-visualization-not-dense-transfer-map",
      atlasScienceRasterSampleCountV309: "16",
      atlasScienceRasterEvpaGlyphCountV309: "4",
      atlasScienceRasterImageOrderGlyphCountV309: "4",
      atlasResourceScopeReleaseCountV309: "2",
      atlasResourceScopeReleasedResourceCountV309: "7",
      atlasResourceScopeFailureCountV309: "0",
      atlasResourceScopeLastLabelV309: "kerr-science-sparse-texture",
      atlasResourceScopeLastReasonV309: "science-effect-cleanup",
      atlasStrongGravityTelemetryRevisionV309: "3",
    });
    writeAtlasBrowserObservabilityV294(node, { scientificPayloadSha256: null, geometryAuthoritySha256: null, polarizationAuthoritySha256: null, rayPlanAuthoritySha256: null, denseAggregateSha256: null, scienceAuthorityKind: null, scienceErrorBudgetVersion: null, observerFrameVersion: null, emitterFrameVersion: null, walkerPenroseModel: null, parallelTransportModel: null, applicableDiskRayCount: null });
    expect(node.dataset).toMatchObject({
      atlasScientificPayloadShaV294: "unavailable",
      atlasGeometryAuthorityShaV294: "unavailable",
      atlasPolarizationAuthorityShaV294: "unavailable",
      atlasRayPlanAuthorityShaV300: "unavailable",
      atlasDenseAggregateShaV300: "unavailable",
      atlasScienceAuthorityKindV300: "unavailable",
      atlasScienceErrorBudgetVersionV300: "unavailable",
      atlasObserverFrameV300: "unavailable",
      atlasEmitterFrameV300: "unavailable",
      atlasWalkerPenroseModelV300: "unavailable",
      atlasParallelTransportModelV300: "unavailable",
      atlasApplicableDiskRayCountV300: "unavailable",
    });
  });

  it("tracks acquire-release and resource-request transitions without React state", () => {
    const node = { dataset: {} as DOMStringMap };
    let snapshot = resourceSnapshot({ revision: 1 });
    let resourceListener: () => void = () => undefined;
    let performanceListener: () => void = () => undefined;
    let resourceUnsubscribed = false;
    let observerDisconnected = false;
    let telemetryUnsubscribed = false;
    let telemetryListener: () => void = () => undefined;
    let telemetry = strongGravitySnapshot();
    let names: readonly string[] = [];
    let resourceNameReads = 0;
    const stop = startAtlasBrowserObservabilityResourceBridgeV300(node, {
      getResourceNames: () => {
        resourceNameReads += 1;
        return names;
      },
      getResourceSnapshot: () => snapshot,
      subscribeResources: (listener) => {
        resourceListener = listener;
        return () => { resourceUnsubscribed = true; };
      },
      observePerformanceResources: (listener) => {
        performanceListener = listener;
        return () => { observerDisconnected = true; };
      },
      getStrongGravityTelemetry: () => telemetry,
      subscribeStrongGravityTelemetry: (listener) => {
        telemetryListener = listener;
        return () => { telemetryUnsubscribed = true; };
      },
    });
    expect(resourceNameReads).toBe(1);
    expect(node.dataset.atlasResourceTotalV300).toBe("0");
    expect(node.dataset.atlasScienceRasterVersionV309).toBe("unavailable");
    snapshot = resourceSnapshot({ total: 3, workers: 1, gpuBuffers: 1, textures: 1, estimatedGpuBytes: 4096, revision: 4 });
    resourceListener();
    expect(resourceNameReads).toBe(1);
    expect(node.dataset).toMatchObject({ atlasResourceTotalV300: "3", atlasWorkerCountV294: "1", atlasGpuBufferCountV294: "1", atlasResourceRevisionV300: "4" });
    names = ["http://localhost/api/atlas/catalog/tile"];
    performanceListener();
    expect(resourceNameReads).toBe(2);
    expect(node.dataset.atlasDeepSpaceRequestCountV294).toBe("1");
    snapshot = resourceSnapshot({ revision: 5 });
    resourceListener();
    expect(node.dataset.atlasResourceTotalV300).toBe("0");
    telemetry = strongGravitySnapshot({
      scienceRasterVersion: "v307-kerr-sparse-science-raster-v1",
      scienceRasterSampleCount: 16,
      sciencePayloadDigestSha256: "a".repeat(64),
      scienceRasterDigestSha256: "b".repeat(64),
      sciencePayloadUnchanged: true,
      scienceBuffersDisjoint: true,
      scienceDenseBoundary: "sparse-authority-dense-incomplete",
      scienceBandArtifactSha256: "c".repeat(64),
      scienceBandViewDigestSha256: "d".repeat(64),
      scienceBandViewUnchanged: true,
      scienceBandCount: 3,
      scienceBandSaturationCount: 0,
      scienceBandNormalization: "fixed-physical-reference-no-data-adaptive-rescale",
      scienceCinematicBufferShared: false,
      lifecycleReturnedToBaseline: true,
      scopeFailureCount: 1,
      revision: 2,
    });
    telemetryListener();
    expect(node.dataset).toMatchObject({
      atlasScienceRasterVersionV309: "v307-kerr-sparse-science-raster-v1",
      atlasScienceRasterSampleCountV309: "16",
      atlasSciencePayloadDigestV317: "a".repeat(64),
      atlasScienceRasterDigestV317: "b".repeat(64),
      atlasSciencePayloadUnchangedV317: "true",
      atlasScienceBuffersDisjointV317: "true",
      atlasScienceDenseBoundaryV317: "sparse-authority-dense-incomplete",
      atlasScienceBandArtifactShaV321: "c".repeat(64),
      atlasScienceBandViewDigestV321: "d".repeat(64),
      atlasScienceBandViewUnchangedV321: "true",
      atlasScienceBandCountV321: "3",
      atlasScienceBandSaturationCountV321: "0",
      atlasScienceBandNormalizationV321: "fixed-physical-reference-no-data-adaptive-rescale",
      atlasScienceCinematicBufferSharedV321: "false",
      atlasLifecycleReturnedToBaselineV317: "true",
      atlasResourceScopeFailureCountV309: "1",
      atlasStrongGravityTelemetryRevisionV309: "2",
    });
    stop();
    expect(resourceUnsubscribed).toBe(true);
    expect(telemetryUnsubscribed).toBe(true);
    expect(observerDisconnected).toBe(true);
  });
});

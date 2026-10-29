import {
  getAtlasResourceSnapshot,
  subscribeAtlasResourceSnapshot,
  type AtlasRuntimeResourceSnapshot,
} from "./atlasResourceLifecycle";
import {
  getAtlasStrongGravityTelemetrySnapshotV309,
  subscribeAtlasStrongGravityTelemetryV309,
  type AtlasStrongGravityTelemetrySnapshotV309,
} from "./atlasStrongGravityTelemetryV309";

export type AtlasBrowserObservabilityUpdateV294 = Readonly<{
  visualProfile?: string;
  scientificPayloadSha256?: string | null;
  geometryAuthoritySha256?: string | null;
  polarizationAuthoritySha256?: string | null;
  rayPlanAuthoritySha256?: string | null;
  denseAggregateSha256?: string | null;
  scienceAuthorityKind?: "v296-v297-short-gate-sparse" | "v312-v313-short-gate-sparse" | "v298r1-dense-complete" | "v314-dense-complete" | null;
  scienceErrorBudgetVersion?: "v299-sparse-release-residual-budget-v1" | "v315-sparse-release-residual-budget-v1" | "v298r1-dense-kerr-error-budget-v1" | "v314-dense-kerr-error-budget-v1" | null;
  observerFrameVersion?: "finite-distance-zamo-r30-theta70-v299" | null;
  emitterFrameVersion?: "equatorial-circular-geodesic-bl-v297" | null;
  walkerPenroseModel?: "standard-complex-kerr-walker-penrose" | null;
  parallelTransportModel?: "independent-cartesian-kerr-schild-hamiltonian-dop853" | null;
  applicableDiskRayCount?: number | null;
  deepSpaceIntent?: boolean;
  sceneRevision?: number;
  strongGravityRenderMode?: "inactive" | "science" | "cinematic";
  postFxPolicy?: "scene-default" | "science-bypassed" | "cinematic-enabled";
}>;

type AtlasBrowserResourceSnapshotV294 = Pick<AtlasRuntimeResourceSnapshot,
  | "total"
  | "workers"
  | "gpuRenderTargets"
  | "gpuBuffers"
  | "gpuComputePipelines"
  | "gpuQueries"
  | "textures"
  | "models"
  | "subscriptions"
  | "objectUrls"
  | "typedArrayCaches"
  | "cameraLocks"
  | "estimatedBytes"
  | "estimatedGpuBytes"
  | "byOwner"
  | "identityDigest"
  | "revision"
>;

export type AtlasBrowserObservabilityBridgeOptionsV300 = Readonly<{
  getResourceNames?: () => readonly string[];
  getResourceSnapshot?: () => AtlasBrowserResourceSnapshotV294;
  subscribeResources?: (listener: () => void) => () => void;
  observePerformanceResources?: (listener: () => void) => () => void;
  getStrongGravityTelemetry?: () => AtlasStrongGravityTelemetrySnapshotV309;
  subscribeStrongGravityTelemetry?: (listener: () => void) => () => void;
}>;

const DEEP_SPACE_RESOURCE_PATTERN = /(?:\/api\/atlas\/(?:catalog|cosmic)|\/catalogs\/|\/cosmic\/|\/gaia\/)/i;

export function countAtlasDeepSpaceResourceRequestsV294(names: readonly string[]): number {
  return names.reduce((count, name) => count + (DEEP_SPACE_RESOURCE_PATTERN.test(name) ? 1 : 0), 0);
}

export function writeAtlasBrowserObservabilityV294(
  node: Pick<HTMLElement, "dataset">,
  update: AtlasBrowserObservabilityUpdateV294,
  resourceNames: readonly string[] = [],
  resources?: AtlasBrowserResourceSnapshotV294,
  strongGravityTelemetry?: AtlasStrongGravityTelemetrySnapshotV309,
): void {
  if (update.visualProfile !== undefined) node.dataset.atlasVisualProfileV294 = update.visualProfile;
  if (update.scientificPayloadSha256 !== undefined) node.dataset.atlasScientificPayloadShaV294 = update.scientificPayloadSha256 ?? "unavailable";
  if (update.geometryAuthoritySha256 !== undefined) node.dataset.atlasGeometryAuthorityShaV294 = update.geometryAuthoritySha256 ?? "unavailable";
  if (update.polarizationAuthoritySha256 !== undefined) node.dataset.atlasPolarizationAuthorityShaV294 = update.polarizationAuthoritySha256 ?? "unavailable";
  if (update.rayPlanAuthoritySha256 !== undefined) node.dataset.atlasRayPlanAuthorityShaV300 = update.rayPlanAuthoritySha256 ?? "unavailable";
  if (update.denseAggregateSha256 !== undefined) node.dataset.atlasDenseAggregateShaV300 = update.denseAggregateSha256 ?? "unavailable";
  if (update.scienceAuthorityKind !== undefined) node.dataset.atlasScienceAuthorityKindV300 = update.scienceAuthorityKind ?? "unavailable";
  if (update.scienceErrorBudgetVersion !== undefined) node.dataset.atlasScienceErrorBudgetVersionV300 = update.scienceErrorBudgetVersion ?? "unavailable";
  if (update.observerFrameVersion !== undefined) node.dataset.atlasObserverFrameV300 = update.observerFrameVersion ?? "unavailable";
  if (update.emitterFrameVersion !== undefined) node.dataset.atlasEmitterFrameV300 = update.emitterFrameVersion ?? "unavailable";
  if (update.walkerPenroseModel !== undefined) node.dataset.atlasWalkerPenroseModelV300 = update.walkerPenroseModel ?? "unavailable";
  if (update.parallelTransportModel !== undefined) node.dataset.atlasParallelTransportModelV300 = update.parallelTransportModel ?? "unavailable";
  if (update.applicableDiskRayCount !== undefined) node.dataset.atlasApplicableDiskRayCountV300 = update.applicableDiskRayCount == null ? "unavailable" : String(Math.max(0, Math.floor(update.applicableDiskRayCount)));
  if (update.deepSpaceIntent !== undefined) node.dataset.atlasDeepSpaceIntentV294 = update.deepSpaceIntent ? "active" : "inactive";
  if (update.sceneRevision !== undefined) node.dataset.atlasSceneRevisionV294 = String(update.sceneRevision);
  if (update.strongGravityRenderMode !== undefined) node.dataset.atlasStrongGravityRenderModeV294 = update.strongGravityRenderMode;
  if (update.postFxPolicy !== undefined) node.dataset.atlasPostFxPolicyV294 = update.postFxPolicy;
  node.dataset.atlasDeepSpaceRequestCountV294 = String(countAtlasDeepSpaceResourceRequestsV294(resourceNames));
  if (resources) {
    node.dataset.atlasResourceTotalV300 = String(resources.total);
    node.dataset.atlasWorkerCountV294 = String(resources.workers);
    node.dataset.atlasRenderTargetCountV300 = String(resources.gpuRenderTargets);
    node.dataset.atlasTextureCountV294 = String(resources.textures);
    node.dataset.atlasModelCountV300 = String(resources.models);
    node.dataset.atlasSubscriptionCountV300 = String(resources.subscriptions);
    node.dataset.atlasObjectUrlCountV300 = String(resources.objectUrls);
    node.dataset.atlasCameraLeaseCountV294 = String(resources.cameraLocks);
    node.dataset.atlasTypedArrayCacheCountV294 = String(resources.typedArrayCaches);
    node.dataset.atlasGpuBufferCountV294 = String(resources.gpuBuffers);
    node.dataset.atlasGpuPipelineCountV300 = String(resources.gpuComputePipelines);
    node.dataset.atlasGpuQueryCountV300 = String(resources.gpuQueries);
    node.dataset.atlasEstimatedResourceBytesV300 = String(resources.estimatedBytes);
    node.dataset.atlasEstimatedGpuBytesV294 = String(resources.estimatedGpuBytes);
    node.dataset.atlasResourceIdentityDigestV300 = resources.identityDigest;
    node.dataset.atlasResourceOwnerCountV300 = String(Object.keys(resources.byOwner).length);
    node.dataset.atlasResourceRevisionV300 = String(resources.revision);
  }
  if (strongGravityTelemetry) {
    node.dataset.atlasScienceRasterVersionV309 = strongGravityTelemetry.scienceRasterVersion ?? "unavailable";
    node.dataset.atlasScienceRasterBoundaryV309 = strongGravityTelemetry.scienceRasterBoundary ?? "unavailable";
    node.dataset.atlasScienceRasterSampleCountV309 = String(strongGravityTelemetry.scienceRasterSampleCount);
    node.dataset.atlasScienceRasterEvpaGlyphCountV309 = String(strongGravityTelemetry.scienceRasterEvpaGlyphCount);
    node.dataset.atlasScienceRasterImageOrderGlyphCountV309 = String(strongGravityTelemetry.scienceRasterImageOrderGlyphCount);
    node.dataset.atlasSciencePayloadDigestV317 = strongGravityTelemetry.sciencePayloadDigestSha256 ?? "unavailable";
    node.dataset.atlasScienceRasterDigestV317 = strongGravityTelemetry.scienceRasterDigestSha256 ?? "unavailable";
    node.dataset.atlasSciencePayloadUnchangedV317 = strongGravityTelemetry.sciencePayloadUnchanged == null ? "unavailable" : String(strongGravityTelemetry.sciencePayloadUnchanged);
    node.dataset.atlasScienceBuffersDisjointV317 = strongGravityTelemetry.scienceBuffersDisjoint == null ? "unavailable" : String(strongGravityTelemetry.scienceBuffersDisjoint);
    node.dataset.atlasScienceDenseBoundaryV317 = strongGravityTelemetry.scienceDenseBoundary ?? "unavailable";
    node.dataset.atlasScienceBandArtifactShaV321 = strongGravityTelemetry.scienceBandArtifactSha256 ?? "unavailable";
    node.dataset.atlasScienceBandViewDigestV321 = strongGravityTelemetry.scienceBandViewDigestSha256 ?? "unavailable";
    node.dataset.atlasScienceBandViewUnchangedV321 = strongGravityTelemetry.scienceBandViewUnchanged == null ? "unavailable" : String(strongGravityTelemetry.scienceBandViewUnchanged);
    node.dataset.atlasScienceBandCountV321 = String(strongGravityTelemetry.scienceBandCount);
    node.dataset.atlasScienceBandSaturationCountV321 = String(strongGravityTelemetry.scienceBandSaturationCount);
    node.dataset.atlasScienceBandNormalizationV321 = strongGravityTelemetry.scienceBandNormalization ?? "unavailable";
    node.dataset.atlasScienceCinematicBufferSharedV321 = strongGravityTelemetry.scienceCinematicBufferShared == null ? "unavailable" : String(strongGravityTelemetry.scienceCinematicBufferShared);
    node.dataset.atlasInteractiveAuthorityShaV317 = strongGravityTelemetry.interactiveAuthoritySha256 ?? "unavailable";
    node.dataset.atlasInteractiveBuffersDisjointV317 = strongGravityTelemetry.interactiveBuffersDisjoint == null ? "unavailable" : String(strongGravityTelemetry.interactiveBuffersDisjoint);
    node.dataset.atlasResourceScopeReleaseCountV309 = String(strongGravityTelemetry.scopeReleaseCount);
    node.dataset.atlasResourceScopeReleasedResourceCountV309 = String(strongGravityTelemetry.releasedResourceCount);
    node.dataset.atlasResourceScopeFailureCountV309 = String(strongGravityTelemetry.scopeFailureCount);
    node.dataset.atlasResourceScopeLastLabelV309 = strongGravityTelemetry.lastScopeLabel ?? "none";
    node.dataset.atlasResourceScopeLastReasonV309 = strongGravityTelemetry.lastScopeReason ?? "none";
    node.dataset.atlasLifecycleBaselineDigestV317 = strongGravityTelemetry.lifecycleBaselineDigest ?? "unavailable";
    node.dataset.atlasLifecycleReturnDigestV317 = strongGravityTelemetry.lifecycleReturnDigest ?? "unavailable";
    node.dataset.atlasLifecycleReturnedToBaselineV317 = strongGravityTelemetry.lifecycleReturnedToBaseline == null ? "unavailable" : String(strongGravityTelemetry.lifecycleReturnedToBaseline);
    node.dataset.atlasStrongGravityTelemetryRevisionV309 = String(strongGravityTelemetry.revision);
  }
}

function defaultResourceNamesV300(): readonly string[] {
  return typeof performance === "undefined"
    ? []
    : performance.getEntriesByType("resource").map((entry) => entry.name);
}

function observePerformanceResourcesV300(listener: () => void): () => void {
  if (typeof PerformanceObserver === "undefined") return () => undefined;
  const observer = new PerformanceObserver((entries) => {
    if (entries.getEntriesByType("resource").length > 0) listener();
  });
  observer.observe({ entryTypes: ["resource"] });
  return () => observer.disconnect();
}

/**
 * Mirrors resource-registry and network-resource transitions directly into DOM
 * attributes. The bridge deliberately owns no React state, so Worker/texture
 * acquire-release telemetry cannot trigger an Atlas scene or AppShell render.
 */
export function startAtlasBrowserObservabilityResourceBridgeV300(
  node: Pick<HTMLElement, "dataset">,
  options: AtlasBrowserObservabilityBridgeOptionsV300 = {},
): () => void {
  const getResourceNames = options.getResourceNames ?? defaultResourceNamesV300;
  const getResourceSnapshot = options.getResourceSnapshot ?? getAtlasResourceSnapshot;
  const subscribeResources = options.subscribeResources ?? subscribeAtlasResourceSnapshot;
  const observeResources = options.observePerformanceResources ?? observePerformanceResourcesV300;
  const getStrongGravityTelemetry = options.getStrongGravityTelemetry ?? getAtlasStrongGravityTelemetrySnapshotV309;
  const subscribeStrongGravityTelemetry = options.subscribeStrongGravityTelemetry ?? subscribeAtlasStrongGravityTelemetryV309;
  let stopped = false;
  // Network resource history only changes when PerformanceObserver reports a
  // new entry. Keep it out of the acquire/release hot path: scanning the full
  // performance timeline for every texture or Worker transition is needlessly
  // O(N) and can dominate low-end observability work.
  let resourceNames = getResourceNames();
  const publishResources = () => {
    if (stopped) return;
    writeAtlasBrowserObservabilityV294(node, {}, resourceNames, getResourceSnapshot(), getStrongGravityTelemetry());
  };
  const publishPerformanceResources = () => {
    if (stopped) return;
    resourceNames = getResourceNames();
    publishResources();
  };
  const unsubscribeResources = subscribeResources(publishResources);
  const unsubscribeStrongGravityTelemetry = subscribeStrongGravityTelemetry(publishResources);
  const disconnectPerformanceObserver = observeResources(publishPerformanceResources);
  publishResources();
  return () => {
    if (stopped) return;
    stopped = true;
    unsubscribeResources();
    unsubscribeStrongGravityTelemetry();
    disconnectPerformanceObserver();
  };
}

export function publishAtlasBrowserObservabilityV294(update: AtlasBrowserObservabilityUpdateV294): void {
  if (typeof document === "undefined") return;
  const root = document.querySelector<HTMLElement>("[data-atlas-app-shell]");
  if (!root) return;
  writeAtlasBrowserObservabilityV294(root, update, defaultResourceNamesV300(), getAtlasResourceSnapshot(), getAtlasStrongGravityTelemetrySnapshotV309());
}

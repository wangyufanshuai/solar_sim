import { KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312 } from "./kerrAuthorityV312";
import { KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313 } from "./kerrAuthorityV313";
import { KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314 } from "./kerrCampaignV314";

export const ATLAS_STRONG_GRAVITY_BROWSER_GATE_VERSION_V310 = "v310-strong-gravity-browser-gate" as const;

export type AtlasStrongGravityBrowserResourceSnapshotV310 = Readonly<{
  total: number;
  workers: number;
  renderTargets: number;
  gpuBuffers: number;
  gpuPipelines: number;
  gpuQueries: number;
  textures: number;
  models: number;
  subscriptions: number;
  objectUrls: number;
  typedArrayCaches: number;
  cameraLocks: number;
  estimatedBytes: number;
  estimatedGpuBytes: number;
  identityDigest: string;
  ownerCount: number;
}>;

export type AtlasStrongGravityBrowserSnapshotV310 = Readonly<{
  canvasCount: number;
  sceneRevision: number;
  renderMode: "inactive" | "science" | "cinematic" | "unavailable";
  postFxPolicy: "scene-default" | "science-bypassed" | "cinematic-enabled" | "unavailable";
  scienceAuthorityKind: string;
  geometryAuthoritySha256: string;
  polarizationAuthoritySha256: string;
  rayPlanAuthoritySha256: string;
  denseAggregateSha256: string;
  scienceRasterVersion: string;
  scienceRasterBoundary: string;
  scienceRasterSampleCount: number;
  scienceRasterEvpaGlyphCount: number;
  scienceRasterImageOrderGlyphCount: number;
  resourceScopeReleaseCount: number;
  resourceScopeFailureCount: number;
  resources: AtlasStrongGravityBrowserResourceSnapshotV310;
}>;

export type AtlasStrongGravityBrowserGateResultV310 = Readonly<{
  version: typeof ATLAS_STRONG_GRAVITY_BROWSER_GATE_VERSION_V310;
  passed: boolean;
  failures: readonly string[];
  boundary: "local-shadow-browser-qualification-only-no-product-promotion";
}>;

const RESOURCE_KEYS = [
  "total", "workers", "renderTargets", "gpuBuffers", "gpuPipelines", "gpuQueries",
  "textures", "models", "subscriptions", "objectUrls", "typedArrayCaches", "cameraLocks", "estimatedBytes", "estimatedGpuBytes",
  "identityDigest", "ownerCount",
] as const;

export type AtlasStrongGravityScienceRasterIdentityV310 = Readonly<{
  version: string;
  boundary: string;
}>;

const DEFAULT_SCIENCE_RASTER_IDENTITY_V310: AtlasStrongGravityScienceRasterIdentityV310 = Object.freeze({
  version: "v307-kerr-sparse-science-raster-v1",
  boundary: "sparse-authority-visualization-not-dense-transfer-map",
});

export function evaluateAtlasStrongGravityBrowserGateV310(args: Readonly<{
  baseline: AtlasStrongGravityBrowserSnapshotV310;
  science: AtlasStrongGravityBrowserSnapshotV310;
  afterExit: AtlasStrongGravityBrowserSnapshotV310;
  mobile: boolean;
}>, rasterIdentity: AtlasStrongGravityScienceRasterIdentityV310 = DEFAULT_SCIENCE_RASTER_IDENTITY_V310): AtlasStrongGravityBrowserGateResultV310 {
  const failures: string[] = [];
  for (const [phase, snapshot] of [["baseline", args.baseline], ["science", args.science], ["after-exit", args.afterExit]] as const) {
    if (snapshot.canvasCount !== 1) failures.push(`${phase}-single-canvas`);
    if (!Number.isSafeInteger(snapshot.sceneRevision) || snapshot.sceneRevision < 0) failures.push(`${phase}-scene-revision`);
    if (!Number.isSafeInteger(snapshot.resourceScopeReleaseCount) || snapshot.resourceScopeReleaseCount < 0) failures.push(`${phase}-scope-release-count`);
    if (!Number.isSafeInteger(snapshot.resourceScopeFailureCount) || snapshot.resourceScopeFailureCount !== 0) failures.push(`${phase}-scope-failure-count`);
    for (const key of RESOURCE_KEYS) {
      const value = snapshot.resources[key];
      if (key === "identityDigest") {
        if (typeof value !== "string" || !/^[a-f0-9]{8,64}$/.test(value)) failures.push(`${phase}-resource-${key}`);
      } else if (!Number.isSafeInteger(value) || Number(value) < 0) failures.push(`${phase}-resource-${key}`);
    }
  }
  if (args.baseline.renderMode !== "inactive" || args.baseline.postFxPolicy !== "scene-default") failures.push("baseline-mode-policy");
  if (args.science.renderMode !== "science" || args.science.postFxPolicy !== "science-bypassed") failures.push("science-mode-policy");
  if (args.afterExit.renderMode !== "inactive" || args.afterExit.postFxPolicy !== "scene-default") failures.push("after-exit-mode-policy");
  if (args.science.sceneRevision !== args.baseline.sceneRevision || args.afterExit.sceneRevision !== args.baseline.sceneRevision) failures.push("scene-revision-drift");
  if (args.science.scienceAuthorityKind !== "v312-v313-short-gate-sparse"
    || args.science.geometryAuthoritySha256 !== KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312
    || args.science.polarizationAuthoritySha256 !== KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313
    || args.science.rayPlanAuthoritySha256 !== KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314
    || args.science.denseAggregateSha256 !== "unavailable") failures.push("science-authority-boundary");
  if (args.science.scienceRasterVersion !== rasterIdentity.version
    || args.science.scienceRasterBoundary !== rasterIdentity.boundary
    || args.science.scienceRasterSampleCount !== 16
    || args.science.scienceRasterEvpaGlyphCount !== 4
    || args.science.scienceRasterImageOrderGlyphCount !== 4) failures.push("science-raster-boundary");
  if (args.afterExit.scienceRasterVersion !== args.science.scienceRasterVersion
    || args.afterExit.scienceRasterBoundary !== args.science.scienceRasterBoundary) failures.push("science-raster-telemetry-lost");
  if (args.science.resources.workers !== 0 || args.science.resources.gpuBuffers !== 0
    || args.science.resources.gpuPipelines !== 0 || args.science.resources.gpuQueries !== 0) failures.push("science-gpu-worker-boundary");
  const gpuLimit = (args.mobile ? 32 : 96) * 2 ** 20;
  if (args.science.resources.estimatedGpuBytes > gpuLimit) failures.push("science-gpu-budget");
  for (const key of RESOURCE_KEYS) {
    if (args.afterExit.resources[key] !== args.baseline.resources[key]) failures.push(`after-exit-resource-${key}-drift`);
  }
  if (args.afterExit.resourceScopeReleaseCount <= args.science.resourceScopeReleaseCount) failures.push("science-scope-release-not-observed");
  return Object.freeze({
    version: ATLAS_STRONG_GRAVITY_BROWSER_GATE_VERSION_V310,
    passed: failures.length === 0,
    failures: Object.freeze([...new Set(failures)]),
    boundary: "local-shadow-browser-qualification-only-no-product-promotion",
  });
}

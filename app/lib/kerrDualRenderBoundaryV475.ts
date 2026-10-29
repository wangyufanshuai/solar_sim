export const KERR_DUAL_RENDER_ARTIFACT_VERSION_V475 =
  "v475-kerr-dual-render-boundary-artifact-v1" as const;
export const KERR_DUAL_RENDER_SUMMARY_VERSION_V475 =
  "v475-kerr-dual-render-boundary-summary-v1" as const;
export const KERR_DUAL_RENDER_API_VERSION_V475 =
  "v475-kerr-dual-render-boundary-api-v1" as const;

const SHA256 = /^[a-f0-9]{64}$/;
const TRANSIENT = new Set([
  "generatedAt",
  "artifactSha256",
  "evidenceSha256",
  "pointerSha256",
  "scienceBufferSha256",
]);
const freezeDeep = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) freezeDeep(child);
  }
  return value;
};
const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !TRANSIENT.has(key))
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
};
export const canonicalKerrDualRenderPayloadV475 = (value: unknown): string =>
  JSON.stringify(canonicalize(value));

const SCIENTIFIC_PRESENTATION_FIELDS_V475 = new Set([
  "classification",
  "emissionRadiusM",
  "redshiftFactor",
  "evpaDeg",
  "orientationQHat",
  "orientationUHat",
  "continuousPixelX",
  "continuousPixelY",
  "intensity",
  "stokesI",
  "stokesQ",
  "stokesU",
  "stokesV",
]);

export function countKerrPresentationScientificFieldsV475(value: unknown): number {
  if (Array.isArray(value)) {
    return value.reduce(
      (count, entry) => count + countKerrPresentationScientificFieldsV475(entry),
      0,
    );
  }
  if (!value || typeof value !== "object") return 0;
  return Object.entries(value).reduce(
    (count, [key, entry]) =>
      count +
      (SCIENTIFIC_PRESENTATION_FIELDS_V475.has(key) ? 1 : 0) +
      countKerrPresentationScientificFieldsV475(entry),
    0,
  );
}

type FourNumbers = readonly [number, number, number, number];
type FourNulls = readonly [null, null, null, null];

export type KerrScienceBufferV475 = Readonly<{
  version: "v475-kerr-science-buffer-v1";
  sourcePayloadSha256: string;
  sourceRowSha256: readonly [string, string, string, string];
  rayIds: readonly ["disk-00", "disk-01", "disk-02", "disk-03"];
  classification: readonly ["disk-hit", "disk-hit", "disk-hit", "disk-hit"];
  emissionRadiusM: FourNumbers;
  redshiftFactor: FourNumbers;
  evpaDeg: FourNumbers;
  orientationQHat: FourNumbers;
  orientationUHat: FourNumbers;
  continuousPixelX: FourNumbers;
  continuousPixelY: FourNumbers;
  intensity: FourNulls;
  stokesI: FourNulls;
  stokesQ: FourNulls;
  stokesU: FourNulls;
  stokesV: FourNulls;
  readonly: true;
  scienceBufferSha256: string;
}>;

export type KerrPresentationBufferV475 = Readonly<{
  mode: "science" | "cinematic";
  linearDisplay: boolean;
  exposure: number;
  bloomIntensity: number;
  colorGradeIntensity: number;
  grain: number;
  chromaticAberration: number;
  vignette: number;
  seed: string | null;
  scientificFieldMutation: false;
  scienceWritebackAllowed: false;
}>;

export type KerrDualRenderArtifactV475 = Readonly<{
  version: typeof KERR_DUAL_RENDER_ARTIFACT_VERSION_V475;
  generatedAt: string;
  status: "dual-render-boundary-qualified-browser-pending";
  source: Readonly<Record<string, string>>;
  contract: Readonly<{
    scienceBufferRowCount: 4;
    scienceFieldArrayCount: 13;
    presentationFieldCount: 8;
    modeCount: 2;
    sharedScienceBufferIdentityRequired: true;
    presentationBuffersIndependent: true;
    presentationCannotContainScientificFields: true;
    scienceWritebackForbidden: true;
    stableViewCacheRequired: true;
    boundedSummaryOnly: true;
    maximumResponseBytes: 131072;
    localShadowOnly: true;
    defaultApplied: false;
    formalProductPointer: "v263";
    denseCampaignStatus: "incomplete-0-of-49";
  }>;
  scienceBuffer: KerrScienceBufferV475;
  presentation: Readonly<{
    science: KerrPresentationBufferV475;
    cinematic: KerrPresentationBufferV475;
  }>;
  audit: Readonly<{
    scienceBufferCanonicalIdentityShared: true;
    scienceViewScienceBufferSha256: string;
    cinematicViewScienceBufferSha256: string;
    presentationScientificFieldCount: 0;
    classificationMutationCount: 0;
    redshiftMutationCount: 0;
    evpaMutationCount: 0;
    intensityMutationCount: 0;
    stokesMutationCount: 0;
    presentationWritebackCount: 0;
    scienceEffectsZero: true;
    cinematicSeedDeterministic: true;
  }>;
  lifecycle: Readonly<{
    existingCanvasCount: 1;
    newCanvasCreated: false;
    sceneRevisionDelta: 0;
    workers: 0;
    gpuBuffers: 0;
    pipelines: 0;
    textures: 0;
    renderTargets: 0;
    typedArrayCaches: 0;
    objectUrls: 0;
    cameraLeases: 0;
    subscriptions: 0;
    allResourcesAtBaseline: true;
  }>;
  boundary: Readonly<{
    sparseAuthorityQualified: true;
    denseAuthorityQualified: false;
    productionPayloadQualified: false;
    sciencePixelRows: 0;
    imageProductsGenerated: false;
    runtimeSciencePayloadMutationAllowed: false;
    cinematicScienceWritebackAllowed: false;
    networkAttempted: false;
    automaticRetryApplied: false;
    denseShardRunAllowed: false;
    browserQualification: "not-run";
    visualMatrixQualification: "not-run";
    soakQualification: "not-run";
    rtxWebGpuQualification: "not-run";
  }>;
  formalProductPointer: "v263";
  formalDefaultKernel: "legacy-eih-1pn";
  artifactSha256: string;
}>;

export type KerrDualRenderSummaryV475 = Readonly<{
  version: typeof KERR_DUAL_RENDER_SUMMARY_VERSION_V475;
  status: KerrDualRenderArtifactV475["status"];
  artifactSha256: string;
  contract: KerrDualRenderArtifactV475["contract"];
  scienceBuffer: KerrDualRenderArtifactV475["scienceBuffer"];
  presentation: KerrDualRenderArtifactV475["presentation"];
  audit: KerrDualRenderArtifactV475["audit"];
  lifecycle: KerrDualRenderArtifactV475["lifecycle"];
  boundary: KerrDualRenderArtifactV475["boundary"];
}>;

export type KerrDualRenderViewV475 = Readonly<{
  mode: "science" | "cinematic";
  scienceBuffer: KerrScienceBufferV475;
  presentation: KerrPresentationBufferV475;
  scienceBufferSha256: string;
  scientificFieldMutation: false;
  scienceWritebackAllowed: false;
}>;

export type KerrDualRenderApiV475 = Readonly<{
  version: typeof KERR_DUAL_RENDER_API_VERSION_V475;
  available: boolean;
  reason:
    | "ready"
    | "lite-boundary"
    | "local-shadow-only"
    | "evidence-corrupt"
    | "request-failed";
  summary: KerrDualRenderSummaryV475 | null;
}>;

const viewCache = new WeakMap<
  KerrScienceBufferV475,
  Readonly<Record<"science" | "cinematic", KerrDualRenderViewV475>>
>();

export function resolveKerrDualRenderViewV475(
  summary: KerrDualRenderSummaryV475,
  mode: "science" | "cinematic",
): KerrDualRenderViewV475 {
  let views = viewCache.get(summary.scienceBuffer);
  if (!views) {
    views = Object.freeze({
      science: Object.freeze({
        mode: "science" as const,
        scienceBuffer: summary.scienceBuffer,
        presentation: summary.presentation.science,
        scienceBufferSha256: summary.scienceBuffer.scienceBufferSha256,
        scientificFieldMutation: false as const,
        scienceWritebackAllowed: false as const,
      }),
      cinematic: Object.freeze({
        mode: "cinematic" as const,
        scienceBuffer: summary.scienceBuffer,
        presentation: summary.presentation.cinematic,
        scienceBufferSha256: summary.scienceBuffer.scienceBufferSha256,
        scientificFieldMutation: false as const,
        scienceWritebackAllowed: false as const,
      }),
    });
    viewCache.set(summary.scienceBuffer, views);
  }
  return views[mode];
}

export function parseKerrDualRenderArtifactV475(value: unknown): KerrDualRenderArtifactV475 {
  const artifact =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrDualRenderArtifactV475>)
      : null;
  const buffer = artifact?.scienceBuffer;
  const science = artifact?.presentation?.science;
  const cinematic = artifact?.presentation?.cinematic;

  if (
    !artifact ||
    artifact.version !== KERR_DUAL_RENDER_ARTIFACT_VERSION_V475 ||
    artifact.status !== "dual-render-boundary-qualified-browser-pending" ||
    !artifact.source ||
    Object.values(artifact.source).some((sha) => !SHA256.test(sha)) ||
    artifact.contract?.scienceBufferRowCount !== 4 ||
    artifact.contract.scienceFieldArrayCount !== 13 ||
    artifact.contract.presentationFieldCount !== 8 ||
    artifact.contract.modeCount !== 2 ||
    artifact.contract.sharedScienceBufferIdentityRequired !== true ||
    artifact.contract.presentationBuffersIndependent !== true ||
    artifact.contract.presentationCannotContainScientificFields !== true ||
    artifact.contract.scienceWritebackForbidden !== true ||
    artifact.contract.stableViewCacheRequired !== true ||
    artifact.contract.boundedSummaryOnly !== true ||
    artifact.contract.maximumResponseBytes !== 131072 ||
    artifact.contract.localShadowOnly !== true ||
    artifact.contract.defaultApplied !== false ||
    artifact.contract.formalProductPointer !== "v263" ||
    artifact.contract.denseCampaignStatus !== "incomplete-0-of-49" ||
    !buffer ||
    buffer.version !== "v475-kerr-science-buffer-v1" ||
    !SHA256.test(buffer.sourcePayloadSha256) ||
    buffer.sourceRowSha256.length !== 4 ||
    buffer.sourceRowSha256.some((sha) => !SHA256.test(sha)) ||
    JSON.stringify(buffer.rayIds) !==
      JSON.stringify(["disk-00", "disk-01", "disk-02", "disk-03"]) ||
    buffer.classification.some((classification) => classification !== "disk-hit") ||
    [
      buffer.emissionRadiusM,
      buffer.redshiftFactor,
      buffer.evpaDeg,
      buffer.orientationQHat,
      buffer.orientationUHat,
      buffer.continuousPixelX,
      buffer.continuousPixelY,
    ].some((values) => values.length !== 4 || values.some((entry) => !Number.isFinite(entry))) ||
    [buffer.intensity, buffer.stokesI, buffer.stokesQ, buffer.stokesU, buffer.stokesV].some(
      (values) => values.length !== 4 || values.some((entry) => entry !== null),
    ) ||
    buffer.readonly !== true ||
    !SHA256.test(buffer.scienceBufferSha256) ||
    !science ||
    science.mode !== "science" ||
    science.linearDisplay !== true ||
    science.exposure !== 1 ||
    science.bloomIntensity !== 0 ||
    science.colorGradeIntensity !== 0 ||
    science.grain !== 0 ||
    science.chromaticAberration !== 0 ||
    science.seed !== null ||
    science.scientificFieldMutation !== false ||
    science.scienceWritebackAllowed !== false ||
    !cinematic ||
    cinematic.mode !== "cinematic" ||
    !cinematic.seed ||
    cinematic.scientificFieldMutation !== false ||
    cinematic.scienceWritebackAllowed !== false ||
    countKerrPresentationScientificFieldsV475(artifact.presentation) !== 0 ||
    artifact.audit?.scienceBufferCanonicalIdentityShared !== true ||
    artifact.audit.scienceViewScienceBufferSha256 !== buffer.scienceBufferSha256 ||
    artifact.audit.cinematicViewScienceBufferSha256 !== buffer.scienceBufferSha256 ||
    artifact.audit.presentationScientificFieldCount !== 0 ||
    artifact.audit.classificationMutationCount !== 0 ||
    artifact.audit.redshiftMutationCount !== 0 ||
    artifact.audit.evpaMutationCount !== 0 ||
    artifact.audit.intensityMutationCount !== 0 ||
    artifact.audit.stokesMutationCount !== 0 ||
    artifact.audit.presentationWritebackCount !== 0 ||
    artifact.audit.scienceEffectsZero !== true ||
    artifact.audit.cinematicSeedDeterministic !== true ||
    artifact.lifecycle?.existingCanvasCount !== 1 ||
    artifact.lifecycle.newCanvasCreated !== false ||
    artifact.lifecycle.sceneRevisionDelta !== 0 ||
    artifact.lifecycle.allResourcesAtBaseline !== true ||
    [
      artifact.lifecycle.workers,
      artifact.lifecycle.gpuBuffers,
      artifact.lifecycle.pipelines,
      artifact.lifecycle.textures,
      artifact.lifecycle.renderTargets,
      artifact.lifecycle.typedArrayCaches,
      artifact.lifecycle.objectUrls,
      artifact.lifecycle.cameraLeases,
      artifact.lifecycle.subscriptions,
    ].some((count) => count !== 0) ||
    artifact.boundary?.sparseAuthorityQualified !== true ||
    artifact.boundary.denseAuthorityQualified !== false ||
    artifact.boundary.productionPayloadQualified !== false ||
    artifact.boundary.sciencePixelRows !== 0 ||
    artifact.boundary.imageProductsGenerated !== false ||
    artifact.boundary.runtimeSciencePayloadMutationAllowed !== false ||
    artifact.boundary.cinematicScienceWritebackAllowed !== false ||
    artifact.boundary.networkAttempted !== false ||
    artifact.boundary.automaticRetryApplied !== false ||
    artifact.boundary.denseShardRunAllowed !== false ||
    artifact.boundary.browserQualification !== "not-run" ||
    artifact.boundary.visualMatrixQualification !== "not-run" ||
    artifact.boundary.soakQualification !== "not-run" ||
    artifact.boundary.rtxWebGpuQualification !== "not-run" ||
    artifact.formalProductPointer !== "v263" ||
    artifact.formalDefaultKernel !== "legacy-eih-1pn" ||
    !SHA256.test(artifact.artifactSha256 ?? "")
  ) {
    throw new Error("v475-dual-render-identity");
  }
  return freezeDeep(value as KerrDualRenderArtifactV475);
}

export function createKerrDualRenderSummaryV475(value: unknown): KerrDualRenderSummaryV475 {
  const artifact = parseKerrDualRenderArtifactV475(value);
  return freezeDeep({
    version: KERR_DUAL_RENDER_SUMMARY_VERSION_V475,
    status: artifact.status,
    artifactSha256: artifact.artifactSha256,
    contract: artifact.contract,
    scienceBuffer: artifact.scienceBuffer,
    presentation: artifact.presentation,
    audit: artifact.audit,
    lifecycle: artifact.lifecycle,
    boundary: artifact.boundary,
  });
}

export function parseKerrDualRenderApiV475(value: unknown): KerrDualRenderApiV475 {
  const api =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrDualRenderApiV475>)
      : null;
  if (
    !api ||
    api.version !== KERR_DUAL_RENDER_API_VERSION_V475 ||
    typeof api.available !== "boolean" ||
    !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(
      api.reason ?? "",
    ) ||
    (api.available && (!api.summary || api.reason !== "ready")) ||
    (!api.available && api.summary !== null)
  ) {
    throw new Error("v475-dual-render-api-identity");
  }
  return freezeDeep(value as KerrDualRenderApiV475);
}

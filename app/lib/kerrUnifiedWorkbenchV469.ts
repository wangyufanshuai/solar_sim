export const KERR_UNIFIED_WORKBENCH_ARTIFACT_VERSION_V469 =
  "v469-kerr-unified-workbench-artifact-v1" as const;
export const KERR_UNIFIED_WORKBENCH_SUMMARY_VERSION_V469 =
  "v469-kerr-unified-workbench-summary-v1" as const;
export const KERR_UNIFIED_WORKBENCH_API_VERSION_V469 =
  "v469-kerr-unified-workbench-api-v1" as const;

const SHA256 = /^[a-f0-9]{64}$/;
const TRANSIENT = new Set([
  "generatedAt",
  "artifactSha256",
  "evidenceSha256",
  "pointerSha256",
]);

export const KERR_UNIFIED_WORKBENCH_STAGE_IDS_V469 = Object.freeze([
  "v463-payload-admission",
  "v464-provenance",
  "v465-response",
  "v466-radiative-transfer",
  "v467-thin-disk",
  "v468-coupling",
] as const);

const freezeDeep = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      freezeDeep(child);
    }
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

export const canonicalKerrUnifiedWorkbenchPayloadV469 = (value: unknown): string =>
  JSON.stringify(canonicalize(value));

export type KerrUnifiedWorkbenchStageIdV469 =
  (typeof KERR_UNIFIED_WORKBENCH_STAGE_IDS_V469)[number];

export type KerrUnifiedWorkbenchStageV469 = Readonly<{
  id: KerrUnifiedWorkbenchStageIdV469;
  status: string;
  artifactSha256: string;
  reason: string;
  authorityGranted: false;
  sciencePixelRows: 0;
  browserQualification: "not-run";
}>;

export type KerrUnifiedWorkbenchLifecycleV469 = Readonly<{
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

export type KerrUnifiedWorkbenchArtifactV469 = Readonly<{
  version: typeof KERR_UNIFIED_WORKBENCH_ARTIFACT_VERSION_V469;
  generatedAt: string;
  status: "unified-kerr-workbench-qualified-browser-pending";
  source: Readonly<Record<KerrUnifiedWorkbenchStageIdV469, string>>;
  contract: Readonly<{
    summaryOnly: true;
    maximumResponseBytes: 131072;
    sourceShaRequired: true;
    noLargeArraysInReactState: true;
    noAbsolutePaths: true;
    noHostMetadata: true;
    scienceCinematicSeparated: true;
    formalProductPointer: "v263";
    denseCampaignStatus: "incomplete-0-of-49";
  }>;
  stages: readonly KerrUnifiedWorkbenchStageV469[];
  lifecycle: KerrUnifiedWorkbenchLifecycleV469;
  boundary: Readonly<{
    sciencePayloadMutationAllowed: false;
    cinematicScienceWritebackAllowed: false;
    fitsWriteAllowed: false;
    pngWriteAllowed: false;
    networkAttempted: false;
    automaticRetryApplied: false;
    liteBoundary: "unavailable";
    denseAggregate: "unavailable";
  }>;
  qualification: Readonly<{
    stageSummaryQualified: true;
    lifecycleBaselineQualified: true;
    shaChainQualified: true;
    browserQualification: "not-run";
    visualMatrixQualification: "not-run";
    soakQualification: "not-run";
    rtxWebGpuQualification: "not-run";
  }>;
  formalProductPointer: "v263";
  formalDefaultKernel: "legacy-eih-1pn";
  denseCampaignStatus: "incomplete-0-of-49";
  artifactSha256: string;
}>;

export type KerrUnifiedWorkbenchSummaryV469 = Readonly<{
  version: typeof KERR_UNIFIED_WORKBENCH_SUMMARY_VERSION_V469;
  status: KerrUnifiedWorkbenchArtifactV469["status"];
  artifactSha256: string;
  source: KerrUnifiedWorkbenchArtifactV469["source"];
  contract: KerrUnifiedWorkbenchArtifactV469["contract"];
  stages: KerrUnifiedWorkbenchArtifactV469["stages"];
  lifecycle: KerrUnifiedWorkbenchArtifactV469["lifecycle"];
  boundary: KerrUnifiedWorkbenchArtifactV469["boundary"];
  qualification: KerrUnifiedWorkbenchArtifactV469["qualification"];
}>;

export type KerrUnifiedWorkbenchApiV469 = Readonly<{
  version: typeof KERR_UNIFIED_WORKBENCH_API_VERSION_V469;
  available: boolean;
  reason:
    | "ready"
    | "lite-boundary"
    | "local-shadow-only"
    | "evidence-corrupt"
    | "request-failed";
  summary: KerrUnifiedWorkbenchSummaryV469 | null;
}>;

function hasExactStageIdentityV469(stages: readonly KerrUnifiedWorkbenchStageV469[]): boolean {
  return stages.every((stage, index) => stage.id === KERR_UNIFIED_WORKBENCH_STAGE_IDS_V469[index]);
}

export function parseKerrUnifiedWorkbenchArtifactV469(
  value: unknown,
): KerrUnifiedWorkbenchArtifactV469 {
  const artifact =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrUnifiedWorkbenchArtifactV469>)
      : null;
  const stages = artifact?.stages;
  const lifecycle = artifact?.lifecycle;

  if (
    !artifact ||
    artifact.version !== KERR_UNIFIED_WORKBENCH_ARTIFACT_VERSION_V469 ||
    artifact.status !== "unified-kerr-workbench-qualified-browser-pending" ||
    !artifact.source ||
    Object.keys(artifact.source).length !== KERR_UNIFIED_WORKBENCH_STAGE_IDS_V469.length ||
    KERR_UNIFIED_WORKBENCH_STAGE_IDS_V469.some(
      (stageId) => !SHA256.test(artifact.source?.[stageId] ?? ""),
    ) ||
    artifact.contract?.summaryOnly !== true ||
    artifact.contract.maximumResponseBytes !== 131072 ||
    artifact.contract.sourceShaRequired !== true ||
    artifact.contract.noLargeArraysInReactState !== true ||
    artifact.contract.noAbsolutePaths !== true ||
    artifact.contract.noHostMetadata !== true ||
    artifact.contract.scienceCinematicSeparated !== true ||
    artifact.contract.formalProductPointer !== "v263" ||
    artifact.contract.denseCampaignStatus !== "incomplete-0-of-49" ||
    !stages ||
    stages.length !== KERR_UNIFIED_WORKBENCH_STAGE_IDS_V469.length ||
    !hasExactStageIdentityV469(stages) ||
    stages.some(
      (stage) =>
        !stage ||
        typeof stage.status !== "string" ||
        stage.status.length === 0 ||
        !SHA256.test(stage.artifactSha256) ||
        typeof stage.reason !== "string" ||
        stage.reason.length === 0 ||
        stage.authorityGranted !== false ||
        stage.sciencePixelRows !== 0 ||
        stage.browserQualification !== "not-run",
    ) ||
    !lifecycle ||
    lifecycle.existingCanvasCount !== 1 ||
    lifecycle.newCanvasCreated !== false ||
    lifecycle.sceneRevisionDelta !== 0 ||
    lifecycle.workers !== 0 ||
    lifecycle.gpuBuffers !== 0 ||
    lifecycle.pipelines !== 0 ||
    lifecycle.textures !== 0 ||
    lifecycle.renderTargets !== 0 ||
    lifecycle.typedArrayCaches !== 0 ||
    lifecycle.objectUrls !== 0 ||
    lifecycle.cameraLeases !== 0 ||
    lifecycle.subscriptions !== 0 ||
    lifecycle.allResourcesAtBaseline !== true ||
    artifact.boundary?.sciencePayloadMutationAllowed !== false ||
    artifact.boundary.cinematicScienceWritebackAllowed !== false ||
    artifact.boundary.fitsWriteAllowed !== false ||
    artifact.boundary.pngWriteAllowed !== false ||
    artifact.boundary.networkAttempted !== false ||
    artifact.boundary.automaticRetryApplied !== false ||
    artifact.boundary.liteBoundary !== "unavailable" ||
    artifact.boundary.denseAggregate !== "unavailable" ||
    artifact.qualification?.stageSummaryQualified !== true ||
    artifact.qualification.lifecycleBaselineQualified !== true ||
    artifact.qualification.shaChainQualified !== true ||
    artifact.qualification.browserQualification !== "not-run" ||
    artifact.qualification.visualMatrixQualification !== "not-run" ||
    artifact.qualification.soakQualification !== "not-run" ||
    artifact.qualification.rtxWebGpuQualification !== "not-run" ||
    artifact.formalProductPointer !== "v263" ||
    artifact.formalDefaultKernel !== "legacy-eih-1pn" ||
    artifact.denseCampaignStatus !== "incomplete-0-of-49" ||
    !SHA256.test(artifact.artifactSha256 ?? "")
  ) {
    throw new Error("v469-workbench-artifact-identity");
  }

  return freezeDeep(value as KerrUnifiedWorkbenchArtifactV469);
}

export function createKerrUnifiedWorkbenchSummaryV469(
  value: unknown,
): KerrUnifiedWorkbenchSummaryV469 {
  const artifact = parseKerrUnifiedWorkbenchArtifactV469(value);
  return freezeDeep({
    version: KERR_UNIFIED_WORKBENCH_SUMMARY_VERSION_V469,
    status: artifact.status,
    artifactSha256: artifact.artifactSha256,
    source: artifact.source,
    contract: artifact.contract,
    stages: artifact.stages,
    lifecycle: artifact.lifecycle,
    boundary: artifact.boundary,
    qualification: artifact.qualification,
  });
}

export function parseKerrUnifiedWorkbenchApiV469(value: unknown): KerrUnifiedWorkbenchApiV469 {
  const api =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrUnifiedWorkbenchApiV469>)
      : null;

  if (
    !api ||
    api.version !== KERR_UNIFIED_WORKBENCH_API_VERSION_V469 ||
    typeof api.available !== "boolean" ||
    !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(
      api.reason ?? "",
    ) ||
    (api.available && (!api.summary || api.reason !== "ready")) ||
    (!api.available && api.summary !== null)
  ) {
    throw new Error("v469-workbench-api-identity");
  }

  return freezeDeep(value as KerrUnifiedWorkbenchApiV469);
}

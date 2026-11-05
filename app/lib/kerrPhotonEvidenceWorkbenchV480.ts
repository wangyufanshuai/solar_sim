import type {
  KerrFrequencyPresentationV479,
  KerrFrequencyProvenanceArtifactV479,
} from "./kerrFrequencyProvenanceViewerV479";
import type {
  KerrScienceProductIdV476,
  KerrScienceProductStatusV476,
} from "./kerrScienceProductAdmissionV476";

export const KERR_PHOTON_EVIDENCE_WORKBENCH_ARTIFACT_VERSION_V480 =
  "v480-kerr-photon-evidence-workbench-artifact-v1" as const;
export const KERR_PHOTON_EVIDENCE_WORKBENCH_SUMMARY_VERSION_V480 =
  "v480-kerr-photon-evidence-workbench-summary-v1" as const;
export const KERR_PHOTON_EVIDENCE_WORKBENCH_API_VERSION_V480 =
  "v480-kerr-photon-evidence-workbench-api-v1" as const;

const SHA256 = /^[a-f0-9]{64}$/;
const TRANSIENT = new Set([
  "generatedAt",
  "artifactSha256",
  "evidenceSha256",
  "pointerSha256",
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

export const canonicalKerrPhotonEvidenceWorkbenchV480 = (value: unknown): string =>
  JSON.stringify(canonicalize(value));

export const KERR_PHOTON_EVIDENCE_STAGE_IDS_V480 = Object.freeze([
  "v475-dual-render-boundary",
  "v476-product-admission",
  "v479-frequency-provenance",
] as const);

export type KerrPhotonEvidenceStageIdV480 =
  (typeof KERR_PHOTON_EVIDENCE_STAGE_IDS_V480)[number];

export type KerrPhotonEvidenceStageV480 = Readonly<{
  id: KerrPhotonEvidenceStageIdV480;
  status: string;
  artifactSha256: string;
  fileSha256: string;
  qualification: "qualified-browser-pending";
  scienceWritebackAllowed: false;
}>;

export type KerrPhotonEvidenceProductV480 = Readonly<{
  id: KerrScienceProductIdV476;
  label: string;
  status: KerrScienceProductStatusV476;
  available: boolean;
  recordCount: number;
  blockedBy: readonly string[];
  placeholderAllowed: false;
  presentationFallbackAllowed: false;
}>;

export type KerrPhotonEvidenceProvenanceV480 = Readonly<{
  rayId: "disk-00" | "disk-01" | "disk-02" | "disk-03";
  sourceRowSha256: string;
  sampleCount: 5;
  formulaCount: 4;
  uncertaintyArtifactSha256: string;
  applicability: "normalized-coordinate-only-absolute-bandpass-unavailable";
}>;

export type KerrPhotonEvidenceWorkbenchArtifactV480 = Readonly<{
  version: typeof KERR_PHOTON_EVIDENCE_WORKBENCH_ARTIFACT_VERSION_V480;
  generatedAt: string;
  status: "photon-evidence-workbench-qualified-production-blocked-browser-pending";
  source: Readonly<{
    v475: string;
    v476: string;
    v479: string;
    dense: string;
    formal: string;
  }>;
  contract: Readonly<{
    stageCount: 3;
    productCount: 9;
    allowedProductCount: 2;
    blockedProductCount: 7;
    provenanceRowCount: 4;
    normalizedFrequencySampleCount: 20;
    provenanceSourceChainCount: 5;
    viewerModeCount: 2;
    separateScienceAndFrequencyBufferIdentities: true;
    sharedFrequencyBufferAcrossViews: true;
    noLargeExecutionArraysInReactState: true;
    boundedSummaryOnly: true;
    maximumResponseBytes: 131072;
    localShadowOnly: true;
    formalProductPointer: "v263";
  }>;
  stages: readonly KerrPhotonEvidenceStageV480[];
  buffers: Readonly<{
    sparseScienceBufferSha256: string;
    normalizedFrequencyBufferSha256: string;
    provenanceSha256: string;
    identitiesIntentionallyDistinct: true;
    scienceViewFrequencyBufferSha256: string;
    cinematicViewFrequencyBufferSha256: string;
    scienceViewAndCinematicViewShareFrequencyBuffer: true;
  }>;
  products: readonly KerrPhotonEvidenceProductV480[];
  provenance: readonly KerrPhotonEvidenceProvenanceV480[];
  presentation: Readonly<{
    science: KerrFrequencyPresentationV479;
    cinematic: KerrFrequencyPresentationV479;
  }>;
  audit: Readonly<{
    allowedProducts: 2;
    blockedProducts: 7;
    normalizedFrequencyRows: 4;
    normalizedFrequencySamples: 20;
    absoluteFrequencyRows: 0;
    physicalBandpassRows: 0;
    observedIntensityRows: 0;
    measuredStokesRows: 0;
    sciencePixelRows: 0;
    imageProducts: 0;
    presentationScientificFieldCount: 0;
    scienceBufferMutationCount: 0;
    frequencyBufferMutationCount: 0;
    scienceWritebackCount: 0;
  }>;
  lifecycle: KerrFrequencyProvenanceArtifactV479["lifecycle"];
  boundary: Readonly<{
    sparseAuthorityGranted: true;
    normalizedFrequencyAuthorityGranted: true;
    absoluteFrequencyAuthorityGranted: false;
    physicalBandpassAuthorityGranted: false;
    observedIntensityAuthorityGranted: false;
    measuredStokesAuthorityGranted: false;
    denseAggregateAuthorityGranted: false;
    scienceRasterAuthorityGranted: false;
    fitsWriteAllowed: false;
    pngWriteAllowed: false;
    presentationMayGrantScienceAuthority: false;
    networkAttempted: false;
    automaticRetryApplied: false;
    denseShardRunAllowed: false;
    denseCampaignStatus: "incomplete-0-of-49";
    browserQualification: "not-run";
    visualMatrixQualification: "not-run";
    soakQualification: "not-run";
    rtxWebGpuQualification: "not-run";
  }>;
  formalProductPointer: "v263";
  formalDefaultKernel: "legacy-eih-1pn";
  artifactSha256: string;
}>;

export type KerrPhotonEvidenceWorkbenchSummaryV480 = Readonly<{
  version: typeof KERR_PHOTON_EVIDENCE_WORKBENCH_SUMMARY_VERSION_V480;
  status: KerrPhotonEvidenceWorkbenchArtifactV480["status"];
  artifactSha256: string;
  contract: KerrPhotonEvidenceWorkbenchArtifactV480["contract"];
  stages: KerrPhotonEvidenceWorkbenchArtifactV480["stages"];
  buffers: KerrPhotonEvidenceWorkbenchArtifactV480["buffers"];
  products: KerrPhotonEvidenceWorkbenchArtifactV480["products"];
  provenance: KerrPhotonEvidenceWorkbenchArtifactV480["provenance"];
  presentation: KerrPhotonEvidenceWorkbenchArtifactV480["presentation"];
  audit: KerrPhotonEvidenceWorkbenchArtifactV480["audit"];
  lifecycle: KerrPhotonEvidenceWorkbenchArtifactV480["lifecycle"];
  boundary: KerrPhotonEvidenceWorkbenchArtifactV480["boundary"];
}>;

export type KerrPhotonEvidenceWorkbenchApiV480 = Readonly<{
  version: typeof KERR_PHOTON_EVIDENCE_WORKBENCH_API_VERSION_V480;
  available: boolean;
  reason:
    | "ready"
    | "lite-boundary"
    | "local-shadow-only"
    | "evidence-corrupt"
    | "request-failed";
  summary: KerrPhotonEvidenceWorkbenchSummaryV480 | null;
}>;

function hasExactStages(stages: readonly KerrPhotonEvidenceStageV480[]): boolean {
  return stages.every((stage, index) => stage.id === KERR_PHOTON_EVIDENCE_STAGE_IDS_V480[index]);
}

export function parseKerrPhotonEvidenceWorkbenchArtifactV480(
  value: unknown,
): KerrPhotonEvidenceWorkbenchArtifactV480 {
  const artifact =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrPhotonEvidenceWorkbenchArtifactV480>)
      : null;
  const stages = artifact?.stages ?? [];
  const products = artifact?.products ?? [];
  const provenance = artifact?.provenance ?? [];
  const allowed = products.filter((entry) => entry.available);
  const blocked = products.filter((entry) => !entry.available);
  const lifecycle = artifact?.lifecycle;

  if (
    !artifact ||
    artifact.version !== KERR_PHOTON_EVIDENCE_WORKBENCH_ARTIFACT_VERSION_V480 ||
    artifact.status !== "photon-evidence-workbench-qualified-production-blocked-browser-pending" ||
    !artifact.source ||
    Object.values(artifact.source).some((sha) => !SHA256.test(sha)) ||
    artifact.contract?.stageCount !== 3 ||
    artifact.contract.productCount !== 9 ||
    artifact.contract.allowedProductCount !== 2 ||
    artifact.contract.blockedProductCount !== 7 ||
    artifact.contract.provenanceRowCount !== 4 ||
    artifact.contract.normalizedFrequencySampleCount !== 20 ||
    artifact.contract.provenanceSourceChainCount !== 5 ||
    artifact.contract.viewerModeCount !== 2 ||
    artifact.contract.separateScienceAndFrequencyBufferIdentities !== true ||
    artifact.contract.sharedFrequencyBufferAcrossViews !== true ||
    artifact.contract.noLargeExecutionArraysInReactState !== true ||
    artifact.contract.boundedSummaryOnly !== true ||
    artifact.contract.maximumResponseBytes !== 131072 ||
    artifact.contract.localShadowOnly !== true ||
    artifact.contract.formalProductPointer !== "v263" ||
    stages.length !== 3 ||
    !hasExactStages(stages) ||
    stages.some(
      (stage) =>
        !SHA256.test(stage.artifactSha256) ||
        !SHA256.test(stage.fileSha256) ||
        stage.qualification !== "qualified-browser-pending" ||
        stage.scienceWritebackAllowed !== false,
    ) ||
    !artifact.buffers ||
    !SHA256.test(artifact.buffers.sparseScienceBufferSha256) ||
    !SHA256.test(artifact.buffers.normalizedFrequencyBufferSha256) ||
    !SHA256.test(artifact.buffers.provenanceSha256) ||
    artifact.buffers.sparseScienceBufferSha256 === artifact.buffers.normalizedFrequencyBufferSha256 ||
    artifact.buffers.identitiesIntentionallyDistinct !== true ||
    artifact.buffers.scienceViewFrequencyBufferSha256 !==
      artifact.buffers.normalizedFrequencyBufferSha256 ||
    artifact.buffers.cinematicViewFrequencyBufferSha256 !==
      artifact.buffers.normalizedFrequencyBufferSha256 ||
    artifact.buffers.scienceViewAndCinematicViewShareFrequencyBuffer !== true ||
    products.length !== 9 ||
    allowed.length !== 2 ||
    blocked.length !== 7 ||
    products.some(
      (product) =>
        product.placeholderAllowed !== false ||
        product.presentationFallbackAllowed !== false ||
        (product.available && product.recordCount !== 4) ||
        (!product.available && (product.recordCount !== 0 || product.blockedBy.length === 0)),
    ) ||
    provenance.length !== 4 ||
    provenance.some(
      (row) =>
        !SHA256.test(row.sourceRowSha256) ||
        row.sampleCount !== 5 ||
        row.formulaCount !== 4 ||
        !SHA256.test(row.uncertaintyArtifactSha256) ||
        row.applicability !== "normalized-coordinate-only-absolute-bandpass-unavailable",
    ) ||
    artifact.presentation?.science.mode !== "science" ||
    artifact.presentation.science.linearDisplay !== true ||
    artifact.presentation.science.bloomIntensity !== 0 ||
    artifact.presentation.science.colorGradeIntensity !== 0 ||
    artifact.presentation.science.grain !== 0 ||
    artifact.presentation.science.chromaticAberration !== 0 ||
    artifact.presentation.science.seed !== null ||
    artifact.presentation.science.scientificFieldMutation !== false ||
    artifact.presentation.science.scienceWritebackAllowed !== false ||
    artifact.presentation.cinematic.mode !== "cinematic" ||
    !artifact.presentation.cinematic.seed ||
    artifact.presentation.cinematic.scientificFieldMutation !== false ||
    artifact.presentation.cinematic.scienceWritebackAllowed !== false ||
    artifact.audit?.allowedProducts !== 2 ||
    artifact.audit.blockedProducts !== 7 ||
    artifact.audit.normalizedFrequencyRows !== 4 ||
    artifact.audit.normalizedFrequencySamples !== 20 ||
    artifact.audit.absoluteFrequencyRows !== 0 ||
    artifact.audit.physicalBandpassRows !== 0 ||
    artifact.audit.observedIntensityRows !== 0 ||
    artifact.audit.measuredStokesRows !== 0 ||
    artifact.audit.sciencePixelRows !== 0 ||
    artifact.audit.imageProducts !== 0 ||
    artifact.audit.presentationScientificFieldCount !== 0 ||
    artifact.audit.scienceBufferMutationCount !== 0 ||
    artifact.audit.frequencyBufferMutationCount !== 0 ||
    artifact.audit.scienceWritebackCount !== 0 ||
    !lifecycle ||
    lifecycle.existingCanvasCount !== 1 ||
    lifecycle.newCanvasCreated !== false ||
    lifecycle.sceneRevisionDelta !== 0 ||
    lifecycle.allResourcesAtBaseline !== true ||
    [
      lifecycle.workers,
      lifecycle.gpuBuffers,
      lifecycle.pipelines,
      lifecycle.textures,
      lifecycle.renderTargets,
      lifecycle.typedArrayCaches,
      lifecycle.objectUrls,
      lifecycle.cameraLeases,
      lifecycle.subscriptions,
    ].some((count) => count !== 0) ||
    artifact.boundary?.sparseAuthorityGranted !== true ||
    artifact.boundary.normalizedFrequencyAuthorityGranted !== true ||
    artifact.boundary.absoluteFrequencyAuthorityGranted !== false ||
    artifact.boundary.physicalBandpassAuthorityGranted !== false ||
    artifact.boundary.observedIntensityAuthorityGranted !== false ||
    artifact.boundary.measuredStokesAuthorityGranted !== false ||
    artifact.boundary.denseAggregateAuthorityGranted !== false ||
    artifact.boundary.scienceRasterAuthorityGranted !== false ||
    artifact.boundary.fitsWriteAllowed !== false ||
    artifact.boundary.pngWriteAllowed !== false ||
    artifact.boundary.presentationMayGrantScienceAuthority !== false ||
    artifact.boundary.networkAttempted !== false ||
    artifact.boundary.automaticRetryApplied !== false ||
    artifact.boundary.denseShardRunAllowed !== false ||
    artifact.boundary.denseCampaignStatus !== "incomplete-0-of-49" ||
    artifact.boundary.browserQualification !== "not-run" ||
    artifact.boundary.visualMatrixQualification !== "not-run" ||
    artifact.boundary.soakQualification !== "not-run" ||
    artifact.boundary.rtxWebGpuQualification !== "not-run" ||
    artifact.formalProductPointer !== "v263" ||
    artifact.formalDefaultKernel !== "legacy-eih-1pn" ||
    !SHA256.test(artifact.artifactSha256 ?? "")
  ) {
    throw new Error("v480-photon-evidence-workbench-identity");
  }

  return freezeDeep(value as KerrPhotonEvidenceWorkbenchArtifactV480);
}

export function createKerrPhotonEvidenceWorkbenchSummaryV480(
  value: unknown,
): KerrPhotonEvidenceWorkbenchSummaryV480 {
  const artifact = parseKerrPhotonEvidenceWorkbenchArtifactV480(value);
  return freezeDeep({
    version: KERR_PHOTON_EVIDENCE_WORKBENCH_SUMMARY_VERSION_V480,
    status: artifact.status,
    artifactSha256: artifact.artifactSha256,
    contract: artifact.contract,
    stages: artifact.stages,
    buffers: artifact.buffers,
    products: artifact.products,
    provenance: artifact.provenance,
    presentation: artifact.presentation,
    audit: artifact.audit,
    lifecycle: artifact.lifecycle,
    boundary: artifact.boundary,
  });
}

export function parseKerrPhotonEvidenceWorkbenchApiV480(
  value: unknown,
): KerrPhotonEvidenceWorkbenchApiV480 {
  const api =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrPhotonEvidenceWorkbenchApiV480>)
      : null;
  if (
    !api ||
    api.version !== KERR_PHOTON_EVIDENCE_WORKBENCH_API_VERSION_V480 ||
    typeof api.available !== "boolean" ||
    !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(
      api.reason ?? "",
    ) ||
    (api.available && (!api.summary || api.reason !== "ready")) ||
    (!api.available && api.summary !== null)
  ) {
    throw new Error("v480-photon-evidence-workbench-api-identity");
  }
  return freezeDeep(value as KerrPhotonEvidenceWorkbenchApiV480);
}

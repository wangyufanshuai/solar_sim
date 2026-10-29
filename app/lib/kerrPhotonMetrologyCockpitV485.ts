import type { KerrFrequencyPresentationV479 } from "./kerrFrequencyProvenanceViewerV479";

export const KERR_PHOTON_METROLOGY_COCKPIT_ARTIFACT_VERSION_V485 =
  "v485-kerr-photon-metrology-cockpit-artifact-v1" as const;
export const KERR_PHOTON_METROLOGY_COCKPIT_SUMMARY_VERSION_V485 =
  "v485-kerr-photon-metrology-cockpit-summary-v1" as const;
export const KERR_PHOTON_METROLOGY_COCKPIT_API_VERSION_V485 =
  "v485-kerr-photon-metrology-cockpit-api-v1" as const;

const SHA256 = /^[a-f0-9]{64}$/;
const TRANSIENT = new Set([
  "generatedAt",
  "artifactSha256",
  "stageChainSha256",
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
export const canonicalKerrPhotonMetrologyCockpitV485 = (value: unknown): string =>
  JSON.stringify(canonicalize(value));

export const KERR_PHOTON_METROLOGY_STAGE_IDS_V485 = Object.freeze([
  "v479-frequency-provenance",
  "v480-product-admission",
  "v481-landmark-transport",
  "v482-correlated-uncertainty",
  "v483-sensitivity-modes",
  "v484-identifiability",
] as const);
export type KerrPhotonMetrologyStageIdV485 =
  (typeof KERR_PHOTON_METROLOGY_STAGE_IDS_V485)[number];

export type KerrPhotonMetrologyStageV485 = Readonly<{
  id: KerrPhotonMetrologyStageIdV485;
  ordinal: 1 | 2 | 3 | 4 | 5 | 6;
  label: string;
  status: string;
  artifactSha256: string;
  fileSha256: string;
  authorityClass: "bounded-science" | "admission-ledger" | "algebraic-science";
  primaryMetric: string;
  secondaryMetric: string;
  detailEndpoint: string;
  downloadHref: string;
  browserQualification: "not-run";
  scienceWritebackAllowed: false;
}>;

export type KerrPhotonMetrologyCockpitArtifactV485 = Readonly<{
  version: typeof KERR_PHOTON_METROLOGY_COCKPIT_ARTIFACT_VERSION_V485;
  generatedAt: string;
  status: "photon-metrology-cockpit-qualified-heavy-runtime-pending";
  source: Readonly<{
    v479: string;
    v480: string;
    v481: string;
    v482: string;
    v483: string;
    v484: string;
    dense: string;
    formal: string;
  }>;
  contract: Readonly<{
    stageCount: 6;
    stageMetricCount: 12;
    detailEndpointCount: 6;
    summaryMatrixElementCount: 0;
    summaryProjectionRecordCount: 0;
    summaryExecutionRecordCount: 0;
    noLargeMatricesInReactState: true;
    noFullScientificArraysInReactState: true;
    detailsRemainInWhitelistedArtifacts: true;
    immutableStageShaChainRequired: true;
    boundedSummaryOnly: true;
    maximumResponseBytes: 131072;
    localShadowOnly: true;
    formalProductPointer: "v263";
  }>;
  stages: readonly KerrPhotonMetrologyStageV485[];
  stageChainSha256: string;
  overview: Readonly<{
    provenanceStageCount: 5;
    sourceStageCount: 6;
    sparseScienceRayCount: 4;
    normalizedFrequencySampleCount: 20;
    allowedProductCount: 2;
    blockedProductCount: 7;
    landmarkCount: 20;
    covarianceMatrixCount: 4;
    covarianceRank: 1;
    sensitivityModeCount: 5;
    sensitivityProjectionCount: 20;
    identifiableDimension: 1;
    unidentifiableDimension: 4;
    penroseAuditCount: 16;
    sciencePixelRows: 0;
    imageProducts: 0;
  }>;
  availability: Readonly<{
    normalizedFrequencyCoordinates: "qualified";
    sparseVectorProducts: "qualified-2-products";
    correlatedUncertaintyUpperBound: "qualified-rank-1";
    algebraicIdentifiability: "qualified-1-of-5";
    physicalLineIdentity: "blocked";
    absoluteFrequency: "blocked";
    physicalBandpass: "blocked";
    detectorResponse: "blocked";
    observedIntensity: "blocked";
    statisticalLikelihood: "blocked";
    parameterPosterior: "blocked";
    denseAggregate: "blocked-0-of-49";
    scienceRaster: "blocked";
  }>;
  presentation: Readonly<{
    science: KerrFrequencyPresentationV479;
    cinematic: KerrFrequencyPresentationV479;
    stageMetricsSharedAcrossViews: true;
    stageMetricMutationAllowed: false;
    scienceWritebackAllowed: false;
    cinematicScienceWritebackAllowed: false;
  }>;
  audit: Readonly<{
    stageCount: 6;
    stageShaCount: 6;
    brokenStageLinks: 0;
    summaryMatrixElementCount: 0;
    summaryProjectionRecordCount: 0;
    summaryExecutionRecordCount: 0;
    presentationScientificFieldCount: 0;
    stageMetricMutationCount: 0;
    scienceWritebackCount: 0;
    absoluteFrequencyRows: 0;
    physicalBandpassRows: 0;
    observedIntensityRows: 0;
    sciencePixelRows: 0;
    imageProducts: 0;
    stageChainQualified: true;
    boundedSummaryQualified: true;
    detailArtifactsIsolated: true;
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
    cockpitSummaryAuthorityGranted: true;
    detailedArtifactsAutoLoaded: false;
    physicalDetectorObservableAuthorityGranted: false;
    statisticalLikelihoodAuthorityGranted: false;
    observedSpectrumAuthorityGranted: false;
    scienceRasterAuthorityGranted: false;
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

export type KerrPhotonMetrologyCockpitSummaryV485 = Readonly<{
  version: typeof KERR_PHOTON_METROLOGY_COCKPIT_SUMMARY_VERSION_V485;
  status: KerrPhotonMetrologyCockpitArtifactV485["status"];
  artifactSha256: string;
  stageChainSha256: string;
  contract: KerrPhotonMetrologyCockpitArtifactV485["contract"];
  stages: KerrPhotonMetrologyCockpitArtifactV485["stages"];
  overview: KerrPhotonMetrologyCockpitArtifactV485["overview"];
  availability: KerrPhotonMetrologyCockpitArtifactV485["availability"];
  presentation: KerrPhotonMetrologyCockpitArtifactV485["presentation"];
  audit: KerrPhotonMetrologyCockpitArtifactV485["audit"];
  lifecycle: KerrPhotonMetrologyCockpitArtifactV485["lifecycle"];
  boundary: KerrPhotonMetrologyCockpitArtifactV485["boundary"];
}>;

export type KerrPhotonMetrologyCockpitApiV485 = Readonly<{
  version: typeof KERR_PHOTON_METROLOGY_COCKPIT_API_VERSION_V485;
  available: boolean;
  reason:
    | "ready"
    | "lite-boundary"
    | "local-shadow-only"
    | "evidence-corrupt"
    | "request-failed";
  summary: KerrPhotonMetrologyCockpitSummaryV485 | null;
}>;

export function parseKerrPhotonMetrologyCockpitArtifactV485(
  value: unknown,
): KerrPhotonMetrologyCockpitArtifactV485 {
  const artifact =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrPhotonMetrologyCockpitArtifactV485>)
      : null;
  const stages = artifact?.stages ?? [];
  const lifecycle = artifact?.lifecycle;
  if (
    !artifact ||
    artifact.version !== KERR_PHOTON_METROLOGY_COCKPIT_ARTIFACT_VERSION_V485 ||
    artifact.status !== "photon-metrology-cockpit-qualified-heavy-runtime-pending" ||
    !artifact.source ||
    Object.values(artifact.source).some((sha) => !SHA256.test(sha)) ||
    artifact.contract?.stageCount !== 6 ||
    artifact.contract.stageMetricCount !== 12 ||
    artifact.contract.detailEndpointCount !== 6 ||
    artifact.contract.summaryMatrixElementCount !== 0 ||
    artifact.contract.summaryProjectionRecordCount !== 0 ||
    artifact.contract.summaryExecutionRecordCount !== 0 ||
    artifact.contract.noLargeMatricesInReactState !== true ||
    artifact.contract.noFullScientificArraysInReactState !== true ||
    artifact.contract.detailsRemainInWhitelistedArtifacts !== true ||
    artifact.contract.immutableStageShaChainRequired !== true ||
    artifact.contract.boundedSummaryOnly !== true ||
    artifact.contract.maximumResponseBytes !== 131072 ||
    artifact.contract.localShadowOnly !== true ||
    artifact.contract.formalProductPointer !== "v263" ||
    stages.length !== 6 ||
    JSON.stringify(stages.map((stage) => stage.id)) !==
      JSON.stringify(KERR_PHOTON_METROLOGY_STAGE_IDS_V485) ||
    stages.some(
      (stage, index) =>
        stage.ordinal !== index + 1 ||
        !stage.label ||
        !stage.status ||
        !SHA256.test(stage.artifactSha256) ||
        !SHA256.test(stage.fileSha256) ||
        !stage.primaryMetric ||
        !stage.secondaryMetric ||
        !/^\/api\/atlas\/relativity-evidence\/v\d+\//.test(stage.detailEndpoint) ||
        !stage.downloadHref.startsWith(`${stage.detailEndpoint}?download=`) ||
        stage.browserQualification !== "not-run" ||
        stage.scienceWritebackAllowed !== false,
    ) ||
    !SHA256.test(artifact.stageChainSha256 ?? "") ||
    artifact.overview?.provenanceStageCount !== 5 ||
    artifact.overview.sourceStageCount !== 6 ||
    artifact.overview.sparseScienceRayCount !== 4 ||
    artifact.overview.normalizedFrequencySampleCount !== 20 ||
    artifact.overview.allowedProductCount !== 2 ||
    artifact.overview.blockedProductCount !== 7 ||
    artifact.overview.landmarkCount !== 20 ||
    artifact.overview.covarianceMatrixCount !== 4 ||
    artifact.overview.covarianceRank !== 1 ||
    artifact.overview.sensitivityModeCount !== 5 ||
    artifact.overview.sensitivityProjectionCount !== 20 ||
    artifact.overview.identifiableDimension !== 1 ||
    artifact.overview.unidentifiableDimension !== 4 ||
    artifact.overview.penroseAuditCount !== 16 ||
    artifact.overview.sciencePixelRows !== 0 ||
    artifact.overview.imageProducts !== 0 ||
    artifact.availability?.normalizedFrequencyCoordinates !== "qualified" ||
    artifact.availability.sparseVectorProducts !== "qualified-2-products" ||
    artifact.availability.correlatedUncertaintyUpperBound !== "qualified-rank-1" ||
    artifact.availability.algebraicIdentifiability !== "qualified-1-of-5" ||
    Object.entries(artifact.availability)
      .filter(([key]) =>
        ![
          "normalizedFrequencyCoordinates",
          "sparseVectorProducts",
          "correlatedUncertaintyUpperBound",
          "algebraicIdentifiability",
        ].includes(key),
      )
      .some(([, status]) => typeof status !== "string" || !status.startsWith("blocked")) ||
    artifact.presentation?.science.mode !== "science" ||
    artifact.presentation.science.linearDisplay !== true ||
    artifact.presentation.science.bloomIntensity !== 0 ||
    artifact.presentation.science.colorGradeIntensity !== 0 ||
    artifact.presentation.science.grain !== 0 ||
    artifact.presentation.science.chromaticAberration !== 0 ||
    artifact.presentation.science.seed !== null ||
    artifact.presentation.cinematic.mode !== "cinematic" ||
    !artifact.presentation.cinematic.seed ||
    artifact.presentation.stageMetricsSharedAcrossViews !== true ||
    artifact.presentation.stageMetricMutationAllowed !== false ||
    artifact.presentation.scienceWritebackAllowed !== false ||
    artifact.presentation.cinematicScienceWritebackAllowed !== false ||
    artifact.audit?.stageCount !== 6 ||
    artifact.audit.stageShaCount !== 6 ||
    artifact.audit.brokenStageLinks !== 0 ||
    artifact.audit.summaryMatrixElementCount !== 0 ||
    artifact.audit.summaryProjectionRecordCount !== 0 ||
    artifact.audit.summaryExecutionRecordCount !== 0 ||
    artifact.audit.presentationScientificFieldCount !== 0 ||
    artifact.audit.stageMetricMutationCount !== 0 ||
    artifact.audit.scienceWritebackCount !== 0 ||
    artifact.audit.absoluteFrequencyRows !== 0 ||
    artifact.audit.physicalBandpassRows !== 0 ||
    artifact.audit.observedIntensityRows !== 0 ||
    artifact.audit.sciencePixelRows !== 0 ||
    artifact.audit.imageProducts !== 0 ||
    artifact.audit.stageChainQualified !== true ||
    artifact.audit.boundedSummaryQualified !== true ||
    artifact.audit.detailArtifactsIsolated !== true ||
    !lifecycle ||
    lifecycle.existingCanvasCount !== 1 ||
    lifecycle.newCanvasCreated !== false ||
    lifecycle.sceneRevisionDelta !== 0 ||
    lifecycle.allResourcesAtBaseline !== true ||
    artifact.boundary?.cockpitSummaryAuthorityGranted !== true ||
    artifact.boundary.detailedArtifactsAutoLoaded !== false ||
    artifact.boundary.physicalDetectorObservableAuthorityGranted !== false ||
    artifact.boundary.statisticalLikelihoodAuthorityGranted !== false ||
    artifact.boundary.observedSpectrumAuthorityGranted !== false ||
    artifact.boundary.scienceRasterAuthorityGranted !== false ||
    artifact.boundary.presentationMayGrantScienceAuthority !== false ||
    artifact.boundary.networkAttempted !== false ||
    artifact.boundary.automaticRetryApplied !== false ||
    artifact.boundary.denseShardRunAllowed !== false ||
    artifact.boundary.denseCampaignStatus !== "incomplete-0-of-49" ||
    artifact.boundary.browserQualification !== "not-run" ||
    artifact.formalProductPointer !== "v263" ||
    artifact.formalDefaultKernel !== "legacy-eih-1pn" ||
    !SHA256.test(artifact.artifactSha256 ?? "")
  ) {
    throw new Error("v485-photon-metrology-cockpit-identity");
  }
  return freezeDeep(value as KerrPhotonMetrologyCockpitArtifactV485);
}

export function createKerrPhotonMetrologyCockpitSummaryV485(
  value: unknown,
): KerrPhotonMetrologyCockpitSummaryV485 {
  const artifact = parseKerrPhotonMetrologyCockpitArtifactV485(value);
  return freezeDeep({
    version: KERR_PHOTON_METROLOGY_COCKPIT_SUMMARY_VERSION_V485,
    status: artifact.status,
    artifactSha256: artifact.artifactSha256,
    stageChainSha256: artifact.stageChainSha256,
    contract: artifact.contract,
    stages: artifact.stages,
    overview: artifact.overview,
    availability: artifact.availability,
    presentation: artifact.presentation,
    audit: artifact.audit,
    lifecycle: artifact.lifecycle,
    boundary: artifact.boundary,
  });
}

export function parseKerrPhotonMetrologyCockpitApiV485(
  value: unknown,
): KerrPhotonMetrologyCockpitApiV485 {
  const api =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrPhotonMetrologyCockpitApiV485>)
      : null;
  if (
    !api ||
    api.version !== KERR_PHOTON_METROLOGY_COCKPIT_API_VERSION_V485 ||
    typeof api.available !== "boolean" ||
    !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(
      api.reason ?? "",
    ) ||
    (api.available && (!api.summary || api.reason !== "ready")) ||
    (!api.available && api.summary !== null)
  ) {
    throw new Error("v485-photon-metrology-cockpit-api-identity");
  }
  return freezeDeep(value as KerrPhotonMetrologyCockpitApiV485);
}

import type { KerrFrequencyPresentationV479 } from "./kerrFrequencyProvenanceViewerV479";

export const KERR_SPECTRAL_IDENTIFIABILITY_ARTIFACT_VERSION_V484 =
  "v484-kerr-spectral-identifiability-artifact-v1" as const;
export const KERR_SPECTRAL_IDENTIFIABILITY_SUMMARY_VERSION_V484 =
  "v484-kerr-spectral-identifiability-summary-v1" as const;
export const KERR_SPECTRAL_IDENTIFIABILITY_API_VERSION_V484 =
  "v484-kerr-spectral-identifiability-api-v1" as const;

const SHA256 = /^[a-f0-9]{64}$/;
const TRANSIENT = new Set([
  "generatedAt",
  "artifactSha256",
  "payloadSha256",
  "rowSha256",
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
export const canonicalKerrSpectralIdentifiabilityV484 = (value: unknown): string =>
  JSON.stringify(canonicalize(value));

export type KerrSpectralIdentifiabilityRowV484 = Readonly<{
  rayId: "disk-00" | "disk-01" | "disk-02" | "disk-03";
  sourceCovarianceRowSha256: string;
  sourceSensitivityRowSha256: string;
  principalEigenvalueUpperBound: number;
  pseudoDeterminantUpperBound: number;
  determinant: 0;
  fullConditionNumber: "infinite-singular";
  nonzeroSpectrumConditionNumber: 1;
  identifiableDimension: 1;
  unidentifiableDimension: 4;
  moorePenrosePseudoInverse: readonly (readonly number[])[];
  identifiableProjector: readonly (readonly number[])[];
  unidentifiableProjector: readonly (readonly number[])[];
  audit: Readonly<{
    penroseCondition1RelativeResidual: number;
    penroseCondition2RelativeResidual: number;
    penroseCondition3AbsoluteResidual: number;
    penroseCondition4AbsoluteResidual: number;
    identifiableProjectorIdempotenceRelativeResidual: number;
    unidentifiableProjectorIdempotenceRelativeResidual: number;
    projectorComplementAbsoluteResidual: number;
    projectorOrthogonalityAbsoluteResidual: number;
    identifiableProjectorTraceResidual: number;
    unidentifiableProjectorTraceResidual: number;
    algebraicPseudoInverseOnly: true;
    inverseNoiseCovarianceInterpretationAllowed: false;
  }>;
  unavailable: Readonly<{
    inverseNoiseCovariance: "unavailable";
    fisherInformation: "unavailable";
    statisticalLikelihood: "unavailable";
    detectorResponse: "unavailable";
    parameterPosterior: "unavailable";
  }>;
  rowSha256: string;
}>;

export type KerrSpectralIdentifiabilityArtifactV484 = Readonly<{
  version: typeof KERR_SPECTRAL_IDENTIFIABILITY_ARTIFACT_VERSION_V484;
  generatedAt: string;
  status: "algebraic-identifiability-qualified-fisher-likelihood-blocked-browser-pending";
  source: Readonly<{ v483: string; v482: string; v481: string; dense: string; formal: string }>;
  sourceArtifactSha256: Readonly<{ v483: string; v482: string; v481: string }>;
  contract: Readonly<{
    rayCount: 4;
    coordinateDimension: 5;
    pseudoInverseMatrixCount: 4;
    identifiableProjectorCount: 4;
    unidentifiableProjectorCount: 4;
    matrixElementCount: 300;
    identifiableDimensionPerRay: 1;
    unidentifiableDimensionPerRay: 4;
    penroseConditionCountPerRay: 4;
    penroseConditionAuditCount: 16;
    moorePenroseRequired: true;
    projectorIdempotenceRequired: true;
    projectorComplementRequired: true;
    singularConditionNumberRequired: true;
    algebraicPseudoInverseOnly: true;
    inverseNoiseCovarianceAuthorityGranted: false;
    fisherInformationAuthorityGranted: false;
    likelihoodAuthorityGranted: false;
    unavailableIsNotZero: true;
    boundedSummaryOnly: true;
    maximumResponseBytes: 131072;
    localShadowOnly: true;
    formalProductPointer: "v263";
  }>;
  rows: readonly KerrSpectralIdentifiabilityRowV484[];
  payloadSha256: string;
  presentation: Readonly<{
    science: KerrFrequencyPresentationV479;
    cinematic: KerrFrequencyPresentationV479;
    sharedIdentifiabilityPayloadIdentity: true;
    scienceWritebackAllowed: false;
    cinematicScienceWritebackAllowed: false;
  }>;
  audit: Readonly<{
    rayCount: 4;
    identifiableDimensionCount: 4;
    unidentifiableDimensionCount: 16;
    penroseConditionAuditCount: 16;
    singularMatrixCount: 4;
    maximumPenroseRelativeResidual: number;
    maximumPenroseSymmetryAbsoluteResidual: number;
    maximumProjectorIdempotenceRelativeResidual: number;
    maximumProjectorComplementAbsoluteResidual: number;
    maximumProjectorOrthogonalityAbsoluteResidual: number;
    maximumProjectorTraceResidual: number;
    moorePenroseQualified: true;
    identifiableProjectorQualified: true;
    unidentifiableProjectorQualified: true;
    singularConditionQualified: true;
    fisherInformationQualified: false;
    likelihoodQualified: false;
    detectorObservableRows: 0;
    sciencePixelRows: 0;
    identifiabilityMutationCount: 0;
    scienceWritebackCount: 0;
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
    algebraicIdentifiabilityAuthorityGranted: true;
    algebraicPseudoInverseAuthorityGranted: true;
    inverseNoiseCovarianceAuthorityGranted: false;
    fisherInformationAuthorityGranted: false;
    statisticalLikelihoodAuthorityGranted: false;
    parameterPosteriorAuthorityGranted: false;
    physicalDetectorObservableAuthorityGranted: false;
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

export type KerrSpectralIdentifiabilitySummaryV484 = Readonly<{
  version: typeof KERR_SPECTRAL_IDENTIFIABILITY_SUMMARY_VERSION_V484;
  status: KerrSpectralIdentifiabilityArtifactV484["status"];
  artifactSha256: string;
  payloadSha256: string;
  contract: KerrSpectralIdentifiabilityArtifactV484["contract"];
  rows: KerrSpectralIdentifiabilityArtifactV484["rows"];
  presentation: KerrSpectralIdentifiabilityArtifactV484["presentation"];
  audit: KerrSpectralIdentifiabilityArtifactV484["audit"];
  lifecycle: KerrSpectralIdentifiabilityArtifactV484["lifecycle"];
  boundary: KerrSpectralIdentifiabilityArtifactV484["boundary"];
}>;

export type KerrSpectralIdentifiabilityApiV484 = Readonly<{
  version: typeof KERR_SPECTRAL_IDENTIFIABILITY_API_VERSION_V484;
  available: boolean;
  reason:
    | "ready"
    | "lite-boundary"
    | "local-shadow-only"
    | "evidence-corrupt"
    | "request-failed";
  summary: KerrSpectralIdentifiabilitySummaryV484 | null;
}>;

const finite = (value: number) => Number.isFinite(value);
const finiteNonNegative = (value: number) => finite(value) && value >= 0;
const isMatrix5 = (value: unknown): value is readonly (readonly number[])[] =>
  Array.isArray(value) &&
  value.length === 5 &&
  value.every(
    (row) =>
      Array.isArray(row) &&
      row.length === 5 &&
      row.every((entry) => typeof entry === "number" && finite(entry)),
  );

export function parseKerrSpectralIdentifiabilityArtifactV484(
  value: unknown,
): KerrSpectralIdentifiabilityArtifactV484 {
  const artifact =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrSpectralIdentifiabilityArtifactV484>)
      : null;
  const rows = artifact?.rows ?? [];
  const lifecycle = artifact?.lifecycle;
  if (
    !artifact ||
    artifact.version !== KERR_SPECTRAL_IDENTIFIABILITY_ARTIFACT_VERSION_V484 ||
    artifact.status !== "algebraic-identifiability-qualified-fisher-likelihood-blocked-browser-pending" ||
    !artifact.source ||
    Object.values(artifact.source).some((sha) => !SHA256.test(sha)) ||
    !artifact.sourceArtifactSha256 ||
    Object.values(artifact.sourceArtifactSha256).some((sha) => !SHA256.test(sha)) ||
    artifact.contract?.rayCount !== 4 ||
    artifact.contract.coordinateDimension !== 5 ||
    artifact.contract.pseudoInverseMatrixCount !== 4 ||
    artifact.contract.identifiableProjectorCount !== 4 ||
    artifact.contract.unidentifiableProjectorCount !== 4 ||
    artifact.contract.matrixElementCount !== 300 ||
    artifact.contract.identifiableDimensionPerRay !== 1 ||
    artifact.contract.unidentifiableDimensionPerRay !== 4 ||
    artifact.contract.penroseConditionCountPerRay !== 4 ||
    artifact.contract.penroseConditionAuditCount !== 16 ||
    artifact.contract.moorePenroseRequired !== true ||
    artifact.contract.projectorIdempotenceRequired !== true ||
    artifact.contract.projectorComplementRequired !== true ||
    artifact.contract.singularConditionNumberRequired !== true ||
    artifact.contract.algebraicPseudoInverseOnly !== true ||
    artifact.contract.inverseNoiseCovarianceAuthorityGranted !== false ||
    artifact.contract.fisherInformationAuthorityGranted !== false ||
    artifact.contract.likelihoodAuthorityGranted !== false ||
    artifact.contract.unavailableIsNotZero !== true ||
    artifact.contract.boundedSummaryOnly !== true ||
    artifact.contract.maximumResponseBytes !== 131072 ||
    artifact.contract.localShadowOnly !== true ||
    artifact.contract.formalProductPointer !== "v263" ||
    rows.length !== 4 ||
    rows.some(
      (row) =>
        !SHA256.test(row.sourceCovarianceRowSha256) ||
        !SHA256.test(row.sourceSensitivityRowSha256) ||
        !finiteNonNegative(row.principalEigenvalueUpperBound) ||
        row.pseudoDeterminantUpperBound !== row.principalEigenvalueUpperBound ||
        row.determinant !== 0 ||
        row.fullConditionNumber !== "infinite-singular" ||
        row.nonzeroSpectrumConditionNumber !== 1 ||
        row.identifiableDimension !== 1 ||
        row.unidentifiableDimension !== 4 ||
        !isMatrix5(row.moorePenrosePseudoInverse) ||
        !isMatrix5(row.identifiableProjector) ||
        !isMatrix5(row.unidentifiableProjector) ||
        !finiteNonNegative(row.audit.penroseCondition1RelativeResidual) ||
        !finiteNonNegative(row.audit.penroseCondition2RelativeResidual) ||
        !finiteNonNegative(row.audit.penroseCondition3AbsoluteResidual) ||
        !finiteNonNegative(row.audit.penroseCondition4AbsoluteResidual) ||
        !finiteNonNegative(row.audit.identifiableProjectorIdempotenceRelativeResidual) ||
        !finiteNonNegative(row.audit.unidentifiableProjectorIdempotenceRelativeResidual) ||
        !finiteNonNegative(row.audit.projectorComplementAbsoluteResidual) ||
        !finiteNonNegative(row.audit.projectorOrthogonalityAbsoluteResidual) ||
        !finiteNonNegative(row.audit.identifiableProjectorTraceResidual) ||
        !finiteNonNegative(row.audit.unidentifiableProjectorTraceResidual) ||
        row.audit.algebraicPseudoInverseOnly !== true ||
        row.audit.inverseNoiseCovarianceInterpretationAllowed !== false ||
        row.unavailable.inverseNoiseCovariance !== "unavailable" ||
        row.unavailable.fisherInformation !== "unavailable" ||
        row.unavailable.statisticalLikelihood !== "unavailable" ||
        row.unavailable.detectorResponse !== "unavailable" ||
        row.unavailable.parameterPosterior !== "unavailable" ||
        !SHA256.test(row.rowSha256),
    ) ||
    !SHA256.test(artifact.payloadSha256 ?? "") ||
    artifact.presentation?.science.mode !== "science" ||
    artifact.presentation.science.linearDisplay !== true ||
    artifact.presentation.science.bloomIntensity !== 0 ||
    artifact.presentation.science.colorGradeIntensity !== 0 ||
    artifact.presentation.science.grain !== 0 ||
    artifact.presentation.science.chromaticAberration !== 0 ||
    artifact.presentation.science.seed !== null ||
    artifact.presentation.cinematic.mode !== "cinematic" ||
    !artifact.presentation.cinematic.seed ||
    artifact.presentation.sharedIdentifiabilityPayloadIdentity !== true ||
    artifact.presentation.scienceWritebackAllowed !== false ||
    artifact.presentation.cinematicScienceWritebackAllowed !== false ||
    artifact.audit?.rayCount !== 4 ||
    artifact.audit.identifiableDimensionCount !== 4 ||
    artifact.audit.unidentifiableDimensionCount !== 16 ||
    artifact.audit.penroseConditionAuditCount !== 16 ||
    artifact.audit.singularMatrixCount !== 4 ||
    !finiteNonNegative(artifact.audit.maximumPenroseRelativeResidual) ||
    !finiteNonNegative(artifact.audit.maximumPenroseSymmetryAbsoluteResidual) ||
    !finiteNonNegative(artifact.audit.maximumProjectorIdempotenceRelativeResidual) ||
    !finiteNonNegative(artifact.audit.maximumProjectorComplementAbsoluteResidual) ||
    !finiteNonNegative(artifact.audit.maximumProjectorOrthogonalityAbsoluteResidual) ||
    !finiteNonNegative(artifact.audit.maximumProjectorTraceResidual) ||
    artifact.audit.moorePenroseQualified !== true ||
    artifact.audit.identifiableProjectorQualified !== true ||
    artifact.audit.unidentifiableProjectorQualified !== true ||
    artifact.audit.singularConditionQualified !== true ||
    artifact.audit.fisherInformationQualified !== false ||
    artifact.audit.likelihoodQualified !== false ||
    artifact.audit.detectorObservableRows !== 0 ||
    artifact.audit.sciencePixelRows !== 0 ||
    artifact.audit.identifiabilityMutationCount !== 0 ||
    artifact.audit.scienceWritebackCount !== 0 ||
    !lifecycle ||
    lifecycle.existingCanvasCount !== 1 ||
    lifecycle.newCanvasCreated !== false ||
    lifecycle.sceneRevisionDelta !== 0 ||
    lifecycle.allResourcesAtBaseline !== true ||
    artifact.boundary?.algebraicIdentifiabilityAuthorityGranted !== true ||
    artifact.boundary.algebraicPseudoInverseAuthorityGranted !== true ||
    artifact.boundary.inverseNoiseCovarianceAuthorityGranted !== false ||
    artifact.boundary.fisherInformationAuthorityGranted !== false ||
    artifact.boundary.statisticalLikelihoodAuthorityGranted !== false ||
    artifact.boundary.parameterPosteriorAuthorityGranted !== false ||
    artifact.boundary.physicalDetectorObservableAuthorityGranted !== false ||
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
    throw new Error("v484-spectral-identifiability-identity");
  }
  return freezeDeep(value as KerrSpectralIdentifiabilityArtifactV484);
}

export function createKerrSpectralIdentifiabilitySummaryV484(
  value: unknown,
): KerrSpectralIdentifiabilitySummaryV484 {
  const artifact = parseKerrSpectralIdentifiabilityArtifactV484(value);
  return freezeDeep({
    version: KERR_SPECTRAL_IDENTIFIABILITY_SUMMARY_VERSION_V484,
    status: artifact.status,
    artifactSha256: artifact.artifactSha256,
    payloadSha256: artifact.payloadSha256,
    contract: artifact.contract,
    rows: artifact.rows,
    presentation: artifact.presentation,
    audit: artifact.audit,
    lifecycle: artifact.lifecycle,
    boundary: artifact.boundary,
  });
}

export function parseKerrSpectralIdentifiabilityApiV484(
  value: unknown,
): KerrSpectralIdentifiabilityApiV484 {
  const api =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrSpectralIdentifiabilityApiV484>)
      : null;
  if (
    !api ||
    api.version !== KERR_SPECTRAL_IDENTIFIABILITY_API_VERSION_V484 ||
    typeof api.available !== "boolean" ||
    !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(
      api.reason ?? "",
    ) ||
    (api.available && (!api.summary || api.reason !== "ready")) ||
    (!api.available && api.summary !== null)
  ) {
    throw new Error("v484-spectral-identifiability-api-identity");
  }
  return freezeDeep(value as KerrSpectralIdentifiabilityApiV484);
}

import type { KerrFrequencyPresentationV479 } from "./kerrFrequencyProvenanceViewerV479";

export const KERR_SPECTRAL_LANDMARK_COVARIANCE_ARTIFACT_VERSION_V482 =
  "v482-kerr-spectral-landmark-correlated-uncertainty-artifact-v1" as const;
export const KERR_SPECTRAL_LANDMARK_COVARIANCE_SUMMARY_VERSION_V482 =
  "v482-kerr-spectral-landmark-correlated-uncertainty-summary-v1" as const;
export const KERR_SPECTRAL_LANDMARK_COVARIANCE_API_VERSION_V482 =
  "v482-kerr-spectral-landmark-correlated-uncertainty-api-v1" as const;

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
export const canonicalKerrSpectralLandmarkCovarianceV482 = (value: unknown): string =>
  JSON.stringify(canonicalize(value));

type FiveVector = readonly [number, number, number, number, number];
type FiveByFive = readonly [FiveVector, FiveVector, FiveVector, FiveVector, FiveVector];

export type KerrSpectralLandmarkCovarianceRowV482 = Readonly<{
  rayId: "disk-00" | "disk-01" | "disk-02" | "disk-03";
  sourceLandmarkRowSha256: string;
  emitterCoordinates: FiveVector;
  commonScaleUncertaintyUpperBound: number;
  scaleConsistencyMaxRelativeResidual: number;
  covarianceUpperBound: FiveByFive;
  diagonalProjectionUpperBounds: FiveVector;
  audit: Readonly<{
    symmetric: true;
    positiveSemidefiniteByOuterProduct: true;
    rankUpperBound: 1;
    principalEigenvalueUpperBound: number;
    traceUpperBound: number;
    zeroEigenvalueCount: 4;
    maximumDiagonalProjectionRelativeResidual: number;
    covarianceInterpretation: "deterministic-upper-bound-not-1sigma";
    independentNoiseAssumed: false;
    correlationStructure: "fully-correlated-common-redshift-scale";
  }>;
  unavailable: Readonly<{
    statisticalCovarianceAuthority: "unavailable";
    independentNoiseModel: "unavailable";
    physicalLineIdentity: "unavailable";
    detectorBandpass: "unavailable";
    observedIntensity: "unavailable";
  }>;
  rowSha256: string;
}>;

export type KerrSpectralLandmarkCovarianceArtifactV482 = Readonly<{
  version: typeof KERR_SPECTRAL_LANDMARK_COVARIANCE_ARTIFACT_VERSION_V482;
  generatedAt: string;
  status: "correlated-landmark-uncertainty-qualified-statistical-covariance-blocked-browser-pending";
  source: Readonly<{ v481: string; v480: string; v479: string; dense: string; formal: string }>;
  sourceArtifactSha256: Readonly<{ v481: string; v480: string; v479: string }>;
  contract: Readonly<{
    rayCount: 4;
    landmarkDimension: 5;
    covarianceMatrixCount: 4;
    covarianceElementCount: 100;
    rankUpperBound: 1;
    zeroEigenvalueCountPerMatrix: 4;
    commonScaleParameterCount: 1;
    deterministicUpperBoundOnly: true;
    independentNoiseAssumed: false;
    statisticalOneSigmaAuthorityGranted: false;
    physicalLineIdentityRequiredForLineClaims: true;
    physicalBandpassRequiredForObservedSpectrum: true;
    unavailableIsNotZero: true;
    boundedSummaryOnly: true;
    maximumResponseBytes: 131072;
    localShadowOnly: true;
    formalProductPointer: "v263";
  }>;
  rows: readonly KerrSpectralLandmarkCovarianceRowV482[];
  payloadSha256: string;
  presentation: Readonly<{
    science: KerrFrequencyPresentationV479;
    cinematic: KerrFrequencyPresentationV479;
    sharedCovariancePayloadIdentity: true;
    scienceWritebackAllowed: false;
    cinematicScienceWritebackAllowed: false;
  }>;
  audit: Readonly<{
    rayCount: 4;
    covarianceMatrixCount: 4;
    covarianceElementCount: 100;
    rankOneMatrixCount: 4;
    symmetricMatrixCount: 4;
    positiveSemidefiniteMatrixCount: 4;
    zeroEigenvalueCount: 16;
    maximumScaleConsistencyRelativeResidual: number;
    maximumDiagonalProjectionRelativeResidual: number;
    maximumPrincipalEigenvalueTraceRelativeResidual: number;
    deterministicUpperBoundQualified: true;
    rankOneQualified: true;
    symmetryQualified: true;
    positiveSemidefiniteQualified: true;
    statisticalOneSigmaQualified: false;
    physicalLineRows: 0;
    observedIntensityRows: 0;
    sciencePixelRows: 0;
    covarianceMutationCount: 0;
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
    correlatedUncertaintyUpperBoundAuthorityGranted: true;
    statisticalCovarianceAuthorityGranted: false;
    independentNoiseAuthorityGranted: false;
    physicalLineIdentityAuthorityGranted: false;
    absoluteFrequencyAuthorityGranted: false;
    physicalBandpassAuthorityGranted: false;
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

export type KerrSpectralLandmarkCovarianceSummaryV482 = Readonly<{
  version: typeof KERR_SPECTRAL_LANDMARK_COVARIANCE_SUMMARY_VERSION_V482;
  status: KerrSpectralLandmarkCovarianceArtifactV482["status"];
  artifactSha256: string;
  payloadSha256: string;
  contract: KerrSpectralLandmarkCovarianceArtifactV482["contract"];
  rows: KerrSpectralLandmarkCovarianceArtifactV482["rows"];
  presentation: KerrSpectralLandmarkCovarianceArtifactV482["presentation"];
  audit: KerrSpectralLandmarkCovarianceArtifactV482["audit"];
  lifecycle: KerrSpectralLandmarkCovarianceArtifactV482["lifecycle"];
  boundary: KerrSpectralLandmarkCovarianceArtifactV482["boundary"];
}>;

export type KerrSpectralLandmarkCovarianceApiV482 = Readonly<{
  version: typeof KERR_SPECTRAL_LANDMARK_COVARIANCE_API_VERSION_V482;
  available: boolean;
  reason:
    | "ready"
    | "lite-boundary"
    | "local-shadow-only"
    | "evidence-corrupt"
    | "request-failed";
  summary: KerrSpectralLandmarkCovarianceSummaryV482 | null;
}>;

const finiteNonNegative = (value: number) => Number.isFinite(value) && value >= 0;
const finitePositive = (value: number) => Number.isFinite(value) && value > 0;
const isVector = (value: unknown): value is FiveVector =>
  Array.isArray(value) && value.length === 5 && value.every((entry) => typeof entry === "number" && finiteNonNegative(entry));
const isMatrix = (value: unknown): value is FiveByFive =>
  Array.isArray(value) && value.length === 5 && value.every((row) => isVector(row));

export function parseKerrSpectralLandmarkCovarianceArtifactV482(
  value: unknown,
): KerrSpectralLandmarkCovarianceArtifactV482 {
  const artifact =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrSpectralLandmarkCovarianceArtifactV482>)
      : null;
  const rows = artifact?.rows ?? [];
  const lifecycle = artifact?.lifecycle;
  if (
    !artifact ||
    artifact.version !== KERR_SPECTRAL_LANDMARK_COVARIANCE_ARTIFACT_VERSION_V482 ||
    artifact.status !==
      "correlated-landmark-uncertainty-qualified-statistical-covariance-blocked-browser-pending" ||
    !artifact.source ||
    Object.values(artifact.source).some((sha) => !SHA256.test(sha)) ||
    !artifact.sourceArtifactSha256 ||
    Object.values(artifact.sourceArtifactSha256).some((sha) => !SHA256.test(sha)) ||
    artifact.contract?.rayCount !== 4 ||
    artifact.contract.landmarkDimension !== 5 ||
    artifact.contract.covarianceMatrixCount !== 4 ||
    artifact.contract.covarianceElementCount !== 100 ||
    artifact.contract.rankUpperBound !== 1 ||
    artifact.contract.zeroEigenvalueCountPerMatrix !== 4 ||
    artifact.contract.commonScaleParameterCount !== 1 ||
    artifact.contract.deterministicUpperBoundOnly !== true ||
    artifact.contract.independentNoiseAssumed !== false ||
    artifact.contract.statisticalOneSigmaAuthorityGranted !== false ||
    artifact.contract.physicalLineIdentityRequiredForLineClaims !== true ||
    artifact.contract.physicalBandpassRequiredForObservedSpectrum !== true ||
    artifact.contract.unavailableIsNotZero !== true ||
    artifact.contract.boundedSummaryOnly !== true ||
    artifact.contract.maximumResponseBytes !== 131072 ||
    artifact.contract.localShadowOnly !== true ||
    artifact.contract.formalProductPointer !== "v263" ||
    rows.length !== 4 ||
    rows.some(
      (row) =>
        !SHA256.test(row.sourceLandmarkRowSha256) ||
        !isVector(row.emitterCoordinates) ||
        !finitePositive(row.commonScaleUncertaintyUpperBound) ||
        !finiteNonNegative(row.scaleConsistencyMaxRelativeResidual) ||
        !isMatrix(row.covarianceUpperBound) ||
        !isVector(row.diagonalProjectionUpperBounds) ||
        row.audit.symmetric !== true ||
        row.audit.positiveSemidefiniteByOuterProduct !== true ||
        row.audit.rankUpperBound !== 1 ||
        row.audit.zeroEigenvalueCount !== 4 ||
        row.audit.covarianceInterpretation !== "deterministic-upper-bound-not-1sigma" ||
        row.audit.independentNoiseAssumed !== false ||
        row.audit.correlationStructure !== "fully-correlated-common-redshift-scale" ||
        row.unavailable.statisticalCovarianceAuthority !== "unavailable" ||
        row.unavailable.independentNoiseModel !== "unavailable" ||
        row.unavailable.physicalLineIdentity !== "unavailable" ||
        row.unavailable.detectorBandpass !== "unavailable" ||
        row.unavailable.observedIntensity !== "unavailable" ||
        !SHA256.test(row.rowSha256),
    ) ||
    rows.some((row) => {
      const matrix = row.covarianceUpperBound;
      for (let i = 0; i < 5; i += 1) {
        if (Math.abs(matrix[i][i] - row.diagonalProjectionUpperBounds[i]) > 1e-25) return true;
        for (let j = i + 1; j < 5; j += 1) {
          if (matrix[i][j] !== matrix[j][i]) return true;
        }
      }
      return false;
    }) ||
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
    artifact.presentation.sharedCovariancePayloadIdentity !== true ||
    artifact.presentation.scienceWritebackAllowed !== false ||
    artifact.presentation.cinematicScienceWritebackAllowed !== false ||
    artifact.audit?.rayCount !== 4 ||
    artifact.audit.covarianceMatrixCount !== 4 ||
    artifact.audit.covarianceElementCount !== 100 ||
    artifact.audit.rankOneMatrixCount !== 4 ||
    artifact.audit.symmetricMatrixCount !== 4 ||
    artifact.audit.positiveSemidefiniteMatrixCount !== 4 ||
    artifact.audit.zeroEigenvalueCount !== 16 ||
    !finiteNonNegative(artifact.audit.maximumScaleConsistencyRelativeResidual) ||
    !finiteNonNegative(artifact.audit.maximumDiagonalProjectionRelativeResidual) ||
    !finiteNonNegative(artifact.audit.maximumPrincipalEigenvalueTraceRelativeResidual) ||
    artifact.audit.deterministicUpperBoundQualified !== true ||
    artifact.audit.rankOneQualified !== true ||
    artifact.audit.symmetryQualified !== true ||
    artifact.audit.positiveSemidefiniteQualified !== true ||
    artifact.audit.statisticalOneSigmaQualified !== false ||
    artifact.audit.physicalLineRows !== 0 ||
    artifact.audit.observedIntensityRows !== 0 ||
    artifact.audit.sciencePixelRows !== 0 ||
    artifact.audit.covarianceMutationCount !== 0 ||
    artifact.audit.scienceWritebackCount !== 0 ||
    !lifecycle ||
    lifecycle.existingCanvasCount !== 1 ||
    lifecycle.newCanvasCreated !== false ||
    lifecycle.sceneRevisionDelta !== 0 ||
    lifecycle.allResourcesAtBaseline !== true ||
    artifact.boundary?.correlatedUncertaintyUpperBoundAuthorityGranted !== true ||
    artifact.boundary.statisticalCovarianceAuthorityGranted !== false ||
    artifact.boundary.independentNoiseAuthorityGranted !== false ||
    artifact.boundary.physicalLineIdentityAuthorityGranted !== false ||
    artifact.boundary.absoluteFrequencyAuthorityGranted !== false ||
    artifact.boundary.physicalBandpassAuthorityGranted !== false ||
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
    throw new Error("v482-spectral-landmark-covariance-identity");
  }
  return freezeDeep(value as KerrSpectralLandmarkCovarianceArtifactV482);
}

export function createKerrSpectralLandmarkCovarianceSummaryV482(
  value: unknown,
): KerrSpectralLandmarkCovarianceSummaryV482 {
  const artifact = parseKerrSpectralLandmarkCovarianceArtifactV482(value);
  return freezeDeep({
    version: KERR_SPECTRAL_LANDMARK_COVARIANCE_SUMMARY_VERSION_V482,
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

export function parseKerrSpectralLandmarkCovarianceApiV482(
  value: unknown,
): KerrSpectralLandmarkCovarianceApiV482 {
  const api =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrSpectralLandmarkCovarianceApiV482>)
      : null;
  if (
    !api ||
    api.version !== KERR_SPECTRAL_LANDMARK_COVARIANCE_API_VERSION_V482 ||
    typeof api.available !== "boolean" ||
    !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(
      api.reason ?? "",
    ) ||
    (api.available && (!api.summary || api.reason !== "ready")) ||
    (!api.available && api.summary !== null)
  ) {
    throw new Error("v482-spectral-landmark-covariance-api-identity");
  }
  return freezeDeep(value as KerrSpectralLandmarkCovarianceApiV482);
}

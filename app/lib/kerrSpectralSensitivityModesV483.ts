import type { KerrFrequencyPresentationV479 } from "./kerrFrequencyProvenanceViewerV479";

export const KERR_SPECTRAL_SENSITIVITY_MODES_ARTIFACT_VERSION_V483 =
  "v483-kerr-spectral-sensitivity-modes-artifact-v1" as const;
export const KERR_SPECTRAL_SENSITIVITY_MODES_SUMMARY_VERSION_V483 =
  "v483-kerr-spectral-sensitivity-modes-summary-v1" as const;
export const KERR_SPECTRAL_SENSITIVITY_MODES_API_VERSION_V483 =
  "v483-kerr-spectral-sensitivity-modes-api-v1" as const;

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
export const canonicalKerrSpectralSensitivityModesV483 = (value: unknown): string =>
  JSON.stringify(canonicalize(value));

export const KERR_SPECTRAL_SENSITIVITY_MODE_IDS_V483 = Object.freeze([
  "common-scale",
  "nullspace-0",
  "nullspace-1",
  "nullspace-2",
  "nullspace-3",
] as const);
export type KerrSpectralSensitivityModeIdV483 =
  (typeof KERR_SPECTRAL_SENSITIVITY_MODE_IDS_V483)[number];

export type KerrSpectralSensitivityBasisModeV483 = Readonly<{
  id: KerrSpectralSensitivityModeIdV483;
  kind: "common-scale-sensitive" | "common-scale-nullspace";
  vector: readonly number[];
  sensitivityDotEmitter: number;
  expectedEigenvalueClass: "principal" | "zero-under-common-scale-model";
}>;

export type KerrSpectralSensitivityProjectionV483 = Readonly<{
  modeId: KerrSpectralSensitivityModeIdV483;
  kind: "common-scale-sensitive" | "common-scale-nullspace";
  projectedCoordinate: number;
  analyticProjectedCoordinateOracle: number;
  projectedCoordinateAbsoluteResidual: number;
  varianceUpperBoundDirectRaw: number;
  varianceUpperBoundDirect: number;
  directRoundoffClamped: boolean;
  varianceUpperBoundOuterProductOracle: number;
  varianceOracleRelativeResidual: number;
  standardDeviationUpperBoundDisplayOnly: number;
  applicability:
    | "common-scale-sensitive-coordinate-mode"
    | "nullspace-under-common-scale-only-not-measurement-exact";
}>;

export type KerrSpectralSensitivityRowV483 = Readonly<{
  rayId: "disk-00" | "disk-01" | "disk-02" | "disk-03";
  sourceCovarianceRowSha256: string;
  redshiftFactor: number;
  coordinateVector: readonly number[];
  projections: readonly KerrSpectralSensitivityProjectionV483[];
  audit: Readonly<{
    commonModeCount: 1;
    nullspaceModeCount: 4;
    maximumProjectionAbsoluteResidual: number;
    maximumVarianceOracleRelativeResidual: number;
    maximumNullspaceCoordinateAbsoluteResidual: number;
    maximumNullspaceVarianceUpperBound: number;
    directRoundoffClampCount: number;
    maximumNegativeRoundoffAbsoluteValue: number;
    nullspaceZeroDoesNotMeanMeasurementExact: true;
  }>;
  unavailable: Readonly<{
    detectorWeightVector: "unavailable";
    physicalObservableCalibration: "unavailable";
    independentNoiseModel: "unavailable";
    statisticalLikelihood: "unavailable";
  }>;
  rowSha256: string;
}>;

export type KerrSpectralSensitivityArtifactV483 = Readonly<{
  version: typeof KERR_SPECTRAL_SENSITIVITY_MODES_ARTIFACT_VERSION_V483;
  generatedAt: string;
  status: "spectral-sensitivity-modes-qualified-detector-observables-blocked-browser-pending";
  source: Readonly<{ v482: string; v481: string; v480: string; dense: string; formal: string }>;
  sourceArtifactSha256: Readonly<{ v482: string; v481: string; v480: string }>;
  contract: Readonly<{
    rayCount: 4;
    coordinateDimension: 5;
    basisModeCount: 5;
    commonScaleModeCount: 1;
    nullspaceModeCount: 4;
    projectionCount: 20;
    commonScaleProjectionCount: 4;
    nullspaceProjectionCount: 16;
    orthonormalBasisRequired: true;
    completenessRequired: true;
    directMatrixProjectionRequired: true;
    outerProductOracleRequired: true;
    roundoffClampAbsoluteLimit: 1e-40;
    nullspaceZeroDoesNotMeanMeasurementExact: true;
    deterministicUpperBoundOnly: true;
    detectorWeightsRequiredForPhysicalObservable: true;
    unavailableIsNotZero: true;
    boundedSummaryOnly: true;
    maximumResponseBytes: 131072;
    localShadowOnly: true;
    formalProductPointer: "v263";
  }>;
  basis: Readonly<{
    emitterCoordinates: readonly number[];
    modes: readonly KerrSpectralSensitivityBasisModeV483[];
    audit: Readonly<{
      maximumOrthonormalityAbsoluteResidual: number;
      maximumCompletenessAbsoluteResidual: number;
      maximumNullspaceEmitterDotAbsoluteResidual: number;
      orthonormalityQualified: true;
      completenessQualified: true;
      nullspaceQualified: true;
    }>;
  }>;
  rows: readonly KerrSpectralSensitivityRowV483[];
  payloadSha256: string;
  presentation: Readonly<{
    science: KerrFrequencyPresentationV479;
    cinematic: KerrFrequencyPresentationV479;
    sharedSensitivityPayloadIdentity: true;
    scienceWritebackAllowed: false;
    cinematicScienceWritebackAllowed: false;
  }>;
  audit: Readonly<{
    projectionCount: 20;
    commonScaleProjectionCount: 4;
    nullspaceProjectionCount: 16;
    maximumProjectionAbsoluteResidual: number;
    maximumVarianceOracleRelativeResidual: number;
    maximumNullspaceCoordinateAbsoluteResidual: number;
    maximumNullspaceVarianceUpperBound: number;
    directRoundoffClampCount: number;
    maximumNegativeRoundoffAbsoluteValue: number;
    commonScaleModeQualified: true;
    nullspaceModesQualified: true;
    directOuterProductAgreementQualified: true;
    statisticalLikelihoodQualified: false;
    detectorObservableRows: 0;
    observedIntensityRows: 0;
    sciencePixelRows: 0;
    sensitivityMutationCount: 0;
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
    dimensionlessSensitivityModeAuthorityGranted: true;
    physicalDetectorObservableAuthorityGranted: false;
    statisticalLikelihoodAuthorityGranted: false;
    independentNoiseAuthorityGranted: false;
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

export type KerrSpectralSensitivitySummaryV483 = Readonly<{
  version: typeof KERR_SPECTRAL_SENSITIVITY_MODES_SUMMARY_VERSION_V483;
  status: KerrSpectralSensitivityArtifactV483["status"];
  artifactSha256: string;
  payloadSha256: string;
  contract: KerrSpectralSensitivityArtifactV483["contract"];
  basis: KerrSpectralSensitivityArtifactV483["basis"];
  rows: KerrSpectralSensitivityArtifactV483["rows"];
  presentation: KerrSpectralSensitivityArtifactV483["presentation"];
  audit: KerrSpectralSensitivityArtifactV483["audit"];
  lifecycle: KerrSpectralSensitivityArtifactV483["lifecycle"];
  boundary: KerrSpectralSensitivityArtifactV483["boundary"];
}>;

export type KerrSpectralSensitivityApiV483 = Readonly<{
  version: typeof KERR_SPECTRAL_SENSITIVITY_MODES_API_VERSION_V483;
  available: boolean;
  reason:
    | "ready"
    | "lite-boundary"
    | "local-shadow-only"
    | "evidence-corrupt"
    | "request-failed";
  summary: KerrSpectralSensitivitySummaryV483 | null;
}>;

const finite = (value: number) => Number.isFinite(value);
const finiteNonNegative = (value: number) => finite(value) && value >= 0;
const isVector5 = (value: unknown): value is readonly number[] =>
  Array.isArray(value) && value.length === 5 && value.every((entry) => typeof entry === "number" && finite(entry));

export function parseKerrSpectralSensitivityArtifactV483(
  value: unknown,
): KerrSpectralSensitivityArtifactV483 {
  const artifact =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrSpectralSensitivityArtifactV483>)
      : null;
  const modes = artifact?.basis?.modes ?? [];
  const rows = artifact?.rows ?? [];
  const projections = rows.flatMap((row) => row.projections);
  const lifecycle = artifact?.lifecycle;
  if (
    !artifact ||
    artifact.version !== KERR_SPECTRAL_SENSITIVITY_MODES_ARTIFACT_VERSION_V483 ||
    artifact.status !== "spectral-sensitivity-modes-qualified-detector-observables-blocked-browser-pending" ||
    !artifact.source ||
    Object.values(artifact.source).some((sha) => !SHA256.test(sha)) ||
    !artifact.sourceArtifactSha256 ||
    Object.values(artifact.sourceArtifactSha256).some((sha) => !SHA256.test(sha)) ||
    artifact.contract?.rayCount !== 4 ||
    artifact.contract.coordinateDimension !== 5 ||
    artifact.contract.basisModeCount !== 5 ||
    artifact.contract.commonScaleModeCount !== 1 ||
    artifact.contract.nullspaceModeCount !== 4 ||
    artifact.contract.projectionCount !== 20 ||
    artifact.contract.commonScaleProjectionCount !== 4 ||
    artifact.contract.nullspaceProjectionCount !== 16 ||
    artifact.contract.orthonormalBasisRequired !== true ||
    artifact.contract.completenessRequired !== true ||
    artifact.contract.directMatrixProjectionRequired !== true ||
    artifact.contract.outerProductOracleRequired !== true ||
    artifact.contract.roundoffClampAbsoluteLimit !== 1e-40 ||
    artifact.contract.nullspaceZeroDoesNotMeanMeasurementExact !== true ||
    artifact.contract.deterministicUpperBoundOnly !== true ||
    artifact.contract.detectorWeightsRequiredForPhysicalObservable !== true ||
    artifact.contract.unavailableIsNotZero !== true ||
    artifact.contract.boundedSummaryOnly !== true ||
    artifact.contract.maximumResponseBytes !== 131072 ||
    artifact.contract.localShadowOnly !== true ||
    artifact.contract.formalProductPointer !== "v263" ||
    !artifact.basis ||
    !isVector5(artifact.basis.emitterCoordinates) ||
    modes.length !== 5 ||
    JSON.stringify(modes.map((mode) => mode.id)) !==
      JSON.stringify(KERR_SPECTRAL_SENSITIVITY_MODE_IDS_V483) ||
    modes.some(
      (mode, index) =>
        !isVector5(mode.vector) ||
        !finite(mode.sensitivityDotEmitter) ||
        mode.kind !== (index === 0 ? "common-scale-sensitive" : "common-scale-nullspace") ||
        mode.expectedEigenvalueClass !==
          (index === 0 ? "principal" : "zero-under-common-scale-model"),
    ) ||
    !finiteNonNegative(artifact.basis.audit.maximumOrthonormalityAbsoluteResidual) ||
    !finiteNonNegative(artifact.basis.audit.maximumCompletenessAbsoluteResidual) ||
    !finiteNonNegative(artifact.basis.audit.maximumNullspaceEmitterDotAbsoluteResidual) ||
    artifact.basis.audit.orthonormalityQualified !== true ||
    artifact.basis.audit.completenessQualified !== true ||
    artifact.basis.audit.nullspaceQualified !== true ||
    rows.length !== 4 ||
    rows.some(
      (row) =>
        !SHA256.test(row.sourceCovarianceRowSha256) ||
        !finite(row.redshiftFactor) ||
        !isVector5(row.coordinateVector) ||
        row.projections.length !== 5 ||
        JSON.stringify(row.projections.map((projection) => projection.modeId)) !==
          JSON.stringify(KERR_SPECTRAL_SENSITIVITY_MODE_IDS_V483) ||
        !finiteNonNegative(row.audit.maximumProjectionAbsoluteResidual) ||
        !finiteNonNegative(row.audit.maximumVarianceOracleRelativeResidual) ||
        !finiteNonNegative(row.audit.maximumNullspaceCoordinateAbsoluteResidual) ||
        !finiteNonNegative(row.audit.maximumNullspaceVarianceUpperBound) ||
        !Number.isInteger(row.audit.directRoundoffClampCount) ||
        row.audit.directRoundoffClampCount < 0 ||
        !finiteNonNegative(row.audit.maximumNegativeRoundoffAbsoluteValue) ||
        row.audit.commonModeCount !== 1 ||
        row.audit.nullspaceModeCount !== 4 ||
        row.audit.nullspaceZeroDoesNotMeanMeasurementExact !== true ||
        row.unavailable.detectorWeightVector !== "unavailable" ||
        row.unavailable.physicalObservableCalibration !== "unavailable" ||
        row.unavailable.independentNoiseModel !== "unavailable" ||
        row.unavailable.statisticalLikelihood !== "unavailable" ||
        !SHA256.test(row.rowSha256),
    ) ||
    projections.length !== 20 ||
    projections.some(
      (projection, index) =>
        !finite(projection.projectedCoordinate) ||
        !finite(projection.analyticProjectedCoordinateOracle) ||
        !finiteNonNegative(projection.projectedCoordinateAbsoluteResidual) ||
        !finite(projection.varianceUpperBoundDirectRaw) ||
        !finiteNonNegative(projection.varianceUpperBoundDirect) ||
        typeof projection.directRoundoffClamped !== "boolean" ||
        (projection.directRoundoffClamped &&
          (projection.varianceUpperBoundDirectRaw >= 0 ||
            projection.varianceUpperBoundDirectRaw < -1e-40 ||
            projection.varianceUpperBoundDirect !== 0)) ||
        (!projection.directRoundoffClamped &&
          (projection.varianceUpperBoundDirectRaw < 0 ||
            projection.varianceUpperBoundDirect !== projection.varianceUpperBoundDirectRaw)) ||
        !finiteNonNegative(projection.varianceUpperBoundOuterProductOracle) ||
        !finiteNonNegative(projection.varianceOracleRelativeResidual) ||
        !finiteNonNegative(projection.standardDeviationUpperBoundDisplayOnly) ||
        projection.kind !== (index % 5 === 0 ? "common-scale-sensitive" : "common-scale-nullspace") ||
        projection.applicability !==
          (index % 5 === 0
            ? "common-scale-sensitive-coordinate-mode"
            : "nullspace-under-common-scale-only-not-measurement-exact"),
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
    artifact.presentation.sharedSensitivityPayloadIdentity !== true ||
    artifact.presentation.scienceWritebackAllowed !== false ||
    artifact.presentation.cinematicScienceWritebackAllowed !== false ||
    artifact.audit?.projectionCount !== 20 ||
    artifact.audit.commonScaleProjectionCount !== 4 ||
    artifact.audit.nullspaceProjectionCount !== 16 ||
    !finiteNonNegative(artifact.audit.maximumProjectionAbsoluteResidual) ||
    !finiteNonNegative(artifact.audit.maximumVarianceOracleRelativeResidual) ||
    !finiteNonNegative(artifact.audit.maximumNullspaceCoordinateAbsoluteResidual) ||
    !finiteNonNegative(artifact.audit.maximumNullspaceVarianceUpperBound) ||
    !Number.isInteger(artifact.audit.directRoundoffClampCount) ||
    artifact.audit.directRoundoffClampCount < 0 ||
    !finiteNonNegative(artifact.audit.maximumNegativeRoundoffAbsoluteValue) ||
    artifact.audit.commonScaleModeQualified !== true ||
    artifact.audit.nullspaceModesQualified !== true ||
    artifact.audit.directOuterProductAgreementQualified !== true ||
    artifact.audit.statisticalLikelihoodQualified !== false ||
    artifact.audit.detectorObservableRows !== 0 ||
    artifact.audit.observedIntensityRows !== 0 ||
    artifact.audit.sciencePixelRows !== 0 ||
    artifact.audit.sensitivityMutationCount !== 0 ||
    artifact.audit.scienceWritebackCount !== 0 ||
    !lifecycle ||
    lifecycle.existingCanvasCount !== 1 ||
    lifecycle.newCanvasCreated !== false ||
    lifecycle.sceneRevisionDelta !== 0 ||
    lifecycle.allResourcesAtBaseline !== true ||
    artifact.boundary?.dimensionlessSensitivityModeAuthorityGranted !== true ||
    artifact.boundary.physicalDetectorObservableAuthorityGranted !== false ||
    artifact.boundary.statisticalLikelihoodAuthorityGranted !== false ||
    artifact.boundary.independentNoiseAuthorityGranted !== false ||
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
    throw new Error("v483-spectral-sensitivity-identity");
  }
  return freezeDeep(value as KerrSpectralSensitivityArtifactV483);
}

export function createKerrSpectralSensitivitySummaryV483(
  value: unknown,
): KerrSpectralSensitivitySummaryV483 {
  const artifact = parseKerrSpectralSensitivityArtifactV483(value);
  return freezeDeep({
    version: KERR_SPECTRAL_SENSITIVITY_MODES_SUMMARY_VERSION_V483,
    status: artifact.status,
    artifactSha256: artifact.artifactSha256,
    payloadSha256: artifact.payloadSha256,
    contract: artifact.contract,
    basis: artifact.basis,
    rows: artifact.rows,
    presentation: artifact.presentation,
    audit: artifact.audit,
    lifecycle: artifact.lifecycle,
    boundary: artifact.boundary,
  });
}

export function parseKerrSpectralSensitivityApiV483(value: unknown): KerrSpectralSensitivityApiV483 {
  const api =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrSpectralSensitivityApiV483>)
      : null;
  if (
    !api ||
    api.version !== KERR_SPECTRAL_SENSITIVITY_MODES_API_VERSION_V483 ||
    typeof api.available !== "boolean" ||
    !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(
      api.reason ?? "",
    ) ||
    (api.available && (!api.summary || api.reason !== "ready")) ||
    (!api.available && api.summary !== null)
  ) {
    throw new Error("v483-spectral-sensitivity-api-identity");
  }
  return freezeDeep(value as KerrSpectralSensitivityApiV483);
}

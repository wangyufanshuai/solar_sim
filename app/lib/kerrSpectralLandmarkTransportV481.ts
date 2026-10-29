import type { KerrFrequencyPresentationV479 } from "./kerrFrequencyProvenanceViewerV479";

export const KERR_SPECTRAL_LANDMARK_ARTIFACT_VERSION_V481 =
  "v481-kerr-spectral-landmark-transport-artifact-v1" as const;
export const KERR_SPECTRAL_LANDMARK_SUMMARY_VERSION_V481 =
  "v481-kerr-spectral-landmark-transport-summary-v1" as const;
export const KERR_SPECTRAL_LANDMARK_API_VERSION_V481 =
  "v481-kerr-spectral-landmark-transport-api-v1" as const;

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

export const canonicalKerrSpectralLandmarkTransportV481 = (value: unknown): string =>
  JSON.stringify(canonicalize(value));

export const KERR_SPECTRAL_LANDMARK_IDS_V481 = Object.freeze([
  "landmark-0",
  "landmark-1",
  "landmark-2",
  "landmark-3",
  "landmark-4",
] as const);
export type KerrSpectralLandmarkIdV481 = (typeof KERR_SPECTRAL_LANDMARK_IDS_V481)[number];

export type KerrSpectralLandmarkFeatureV481 = Readonly<{
  id: KerrSpectralLandmarkIdV481;
  anchorIndex: 0 | 1 | 2 | 3 | 4;
  emitterCoordinate: number;
  observerCoordinate: number;
  observerCoordinateLogExpOracle: number;
  directOracleRelativeResidual: number;
  inverseRecoveredEmitterCoordinate: number;
  inverseRoundTripRelativeResidual: number;
  observerCoordinateUncertaintyUpperBound: number;
  observerCoordinateInterval: Readonly<{ lower: number; center: number; upper: number }>;
  relativeCoordinateUncertaintyUpperBound: number;
  applicability: "dimensionless-feature-position-only";
}>;

export type KerrSpectralLandmarkRowV481 = Readonly<{
  rayId: "disk-00" | "disk-01" | "disk-02" | "disk-03";
  redshiftFactor: number;
  shiftClass: "blueshift" | "redshift";
  sourceNormalizedFrequencyRowSha256: string;
  sourceProvenanceRowSha256: string;
  logFrequencyShift: number;
  features: readonly KerrSpectralLandmarkFeatureV481[];
  audit: Readonly<{
    strictlyIncreasing: true;
    intervalContainmentCount: 5;
    pairwiseRatioCount: 10;
    adjacentSpacingCount: 4;
    maximumPairwiseRatioRelativeResidual: number;
    maximumAdjacentSpacingRelativeResidual: number;
  }>;
  unavailable: Readonly<{
    physicalLineIdentity: "unavailable";
    referenceFrequencyHz: null;
    absoluteFrequencyHz: null;
    intrinsicLineWidth: null;
    lineAmplitude: null;
    equivalentWidth: null;
    detectorBandpass: null;
    observedIntensity: null;
  }>;
  rowSha256: string;
}>;

export type KerrSpectralLandmarkArtifactV481 = Readonly<{
  version: typeof KERR_SPECTRAL_LANDMARK_ARTIFACT_VERSION_V481;
  generatedAt: string;
  status: "spectral-landmark-coordinate-transport-qualified-physical-spectrum-blocked-browser-pending";
  source: Readonly<{ v478: string; v479: string; v480: string; dense: string; formal: string }>;
  sourceArtifactSha256: Readonly<{ v478: string; v479: string; v480: string }>;
  contract: Readonly<{
    rayCount: 4;
    landmarkCountPerRay: 5;
    landmarkCount: 20;
    pairwiseRatioAuditCount: 40;
    adjacentSpacingAuditCount: 16;
    intervalContainmentCount: 20;
    coordinateSystem: "dimensionless-frequency-over-unspecified-reference";
    mapping: "x_observer_equals_g_times_x_emitter";
    inverseMapping: "x_emitter_equals_x_observer_divided_by_g";
    independentLogExpOracleRequired: true;
    ratioPreservationRequired: true;
    adjacentSpacingScaleRequired: true;
    uncertaintyIntervalsRequired: true;
    positionOnlyAuthority: true;
    physicalLineIdentityRequiredForLineClaims: true;
    physicalBandpassRequiredForObservedSpectrum: true;
    unavailableIsNotZero: true;
    boundedSummaryOnly: true;
    maximumResponseBytes: 131072;
    localShadowOnly: true;
    formalProductPointer: "v263";
  }>;
  rows: readonly KerrSpectralLandmarkRowV481[];
  payloadSha256: string;
  presentation: Readonly<{
    science: KerrFrequencyPresentationV479;
    cinematic: KerrFrequencyPresentationV479;
    sharedLandmarkPayloadIdentity: true;
    scienceWritebackAllowed: false;
    cinematicScienceWritebackAllowed: false;
  }>;
  audit: Readonly<{
    landmarkCount: 20;
    blueshiftRowCount: 1;
    redshiftRowCount: 3;
    monotonicRowCount: 4;
    intervalContainmentCount: 20;
    pairwiseRatioAuditCount: 40;
    adjacentSpacingAuditCount: 16;
    maximumDirectOracleRelativeResidual: number;
    maximumInverseRoundTripRelativeResidual: number;
    maximumPairwiseRatioRelativeResidual: number;
    maximumAdjacentSpacingRelativeResidual: number;
    maximumRelativeCoordinateUncertaintyUpperBound: number;
    directOracleQualified: true;
    inverseRoundTripQualified: true;
    ratioPreservationQualified: true;
    adjacentSpacingQualified: true;
    uncertaintyIntervalsQualified: true;
    physicalLineRows: 0;
    absoluteFrequencyRows: 0;
    physicalBandpassRows: 0;
    observedIntensityRows: 0;
    sciencePixelRows: 0;
    imageProducts: 0;
    landmarkMutationCount: 0;
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
    dimensionlessLandmarkPositionAuthorityGranted: true;
    physicalLineIdentityAuthorityGranted: false;
    absoluteFrequencyAuthorityGranted: false;
    lineWidthAuthorityGranted: false;
    lineAmplitudeAuthorityGranted: false;
    equivalentWidthAuthorityGranted: false;
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

export type KerrSpectralLandmarkSummaryV481 = Readonly<{
  version: typeof KERR_SPECTRAL_LANDMARK_SUMMARY_VERSION_V481;
  status: KerrSpectralLandmarkArtifactV481["status"];
  artifactSha256: string;
  payloadSha256: string;
  contract: KerrSpectralLandmarkArtifactV481["contract"];
  rows: KerrSpectralLandmarkArtifactV481["rows"];
  presentation: KerrSpectralLandmarkArtifactV481["presentation"];
  audit: KerrSpectralLandmarkArtifactV481["audit"];
  lifecycle: KerrSpectralLandmarkArtifactV481["lifecycle"];
  boundary: KerrSpectralLandmarkArtifactV481["boundary"];
}>;

export type KerrSpectralLandmarkApiV481 = Readonly<{
  version: typeof KERR_SPECTRAL_LANDMARK_API_VERSION_V481;
  available: boolean;
  reason:
    | "ready"
    | "lite-boundary"
    | "local-shadow-only"
    | "evidence-corrupt"
    | "request-failed";
  summary: KerrSpectralLandmarkSummaryV481 | null;
}>;

const finiteNonNegative = (value: number) => Number.isFinite(value) && value >= 0;
const finitePositive = (value: number) => Number.isFinite(value) && value > 0;

export function parseKerrSpectralLandmarkArtifactV481(
  value: unknown,
): KerrSpectralLandmarkArtifactV481 {
  const artifact =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrSpectralLandmarkArtifactV481>)
      : null;
  const rows = artifact?.rows ?? [];
  const features = rows.flatMap((row) => row.features);
  const lifecycle = artifact?.lifecycle;
  if (
    !artifact ||
    artifact.version !== KERR_SPECTRAL_LANDMARK_ARTIFACT_VERSION_V481 ||
    artifact.status !==
      "spectral-landmark-coordinate-transport-qualified-physical-spectrum-blocked-browser-pending" ||
    !artifact.source ||
    Object.values(artifact.source).some((sha) => !SHA256.test(sha)) ||
    !artifact.sourceArtifactSha256 ||
    Object.values(artifact.sourceArtifactSha256).some((sha) => !SHA256.test(sha)) ||
    artifact.contract?.rayCount !== 4 ||
    artifact.contract.landmarkCountPerRay !== 5 ||
    artifact.contract.landmarkCount !== 20 ||
    artifact.contract.pairwiseRatioAuditCount !== 40 ||
    artifact.contract.adjacentSpacingAuditCount !== 16 ||
    artifact.contract.intervalContainmentCount !== 20 ||
    artifact.contract.coordinateSystem !== "dimensionless-frequency-over-unspecified-reference" ||
    artifact.contract.mapping !== "x_observer_equals_g_times_x_emitter" ||
    artifact.contract.inverseMapping !== "x_emitter_equals_x_observer_divided_by_g" ||
    artifact.contract.independentLogExpOracleRequired !== true ||
    artifact.contract.ratioPreservationRequired !== true ||
    artifact.contract.adjacentSpacingScaleRequired !== true ||
    artifact.contract.uncertaintyIntervalsRequired !== true ||
    artifact.contract.positionOnlyAuthority !== true ||
    artifact.contract.physicalLineIdentityRequiredForLineClaims !== true ||
    artifact.contract.physicalBandpassRequiredForObservedSpectrum !== true ||
    artifact.contract.unavailableIsNotZero !== true ||
    artifact.contract.boundedSummaryOnly !== true ||
    artifact.contract.maximumResponseBytes !== 131072 ||
    artifact.contract.localShadowOnly !== true ||
    artifact.contract.formalProductPointer !== "v263" ||
    rows.length !== 4 ||
    JSON.stringify(rows.map((row) => row.rayId)) !==
      JSON.stringify(["disk-00", "disk-01", "disk-02", "disk-03"]) ||
    features.length !== 20 ||
    rows.some(
      (row) =>
        !finitePositive(row.redshiftFactor) ||
        !SHA256.test(row.sourceNormalizedFrequencyRowSha256) ||
        !SHA256.test(row.sourceProvenanceRowSha256) ||
        !Number.isFinite(row.logFrequencyShift) ||
        row.features.length !== 5 ||
        JSON.stringify(row.features.map((feature) => feature.id)) !==
          JSON.stringify(KERR_SPECTRAL_LANDMARK_IDS_V481) ||
        row.audit.strictlyIncreasing !== true ||
        row.audit.intervalContainmentCount !== 5 ||
        row.audit.pairwiseRatioCount !== 10 ||
        row.audit.adjacentSpacingCount !== 4 ||
        !finiteNonNegative(row.audit.maximumPairwiseRatioRelativeResidual) ||
        !finiteNonNegative(row.audit.maximumAdjacentSpacingRelativeResidual) ||
        row.unavailable.physicalLineIdentity !== "unavailable" ||
        Object.entries(row.unavailable)
          .filter(([key]) => key !== "physicalLineIdentity")
          .some(([, unavailable]) => unavailable !== null) ||
        !SHA256.test(row.rowSha256),
    ) ||
    features.some(
      (feature, index) =>
        feature.anchorIndex !== index % 5 ||
        !finitePositive(feature.emitterCoordinate) ||
        !finitePositive(feature.observerCoordinate) ||
        !finitePositive(feature.observerCoordinateLogExpOracle) ||
        !finiteNonNegative(feature.directOracleRelativeResidual) ||
        !finitePositive(feature.inverseRecoveredEmitterCoordinate) ||
        !finiteNonNegative(feature.inverseRoundTripRelativeResidual) ||
        !finiteNonNegative(feature.observerCoordinateUncertaintyUpperBound) ||
        !finiteNonNegative(feature.relativeCoordinateUncertaintyUpperBound) ||
        feature.observerCoordinateInterval.lower > feature.observerCoordinate ||
        feature.observerCoordinateInterval.center !== feature.observerCoordinate ||
        feature.observerCoordinateInterval.upper < feature.observerCoordinate ||
        feature.applicability !== "dimensionless-feature-position-only",
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
    artifact.presentation.sharedLandmarkPayloadIdentity !== true ||
    artifact.presentation.scienceWritebackAllowed !== false ||
    artifact.presentation.cinematicScienceWritebackAllowed !== false ||
    artifact.audit?.landmarkCount !== 20 ||
    artifact.audit.blueshiftRowCount !== 1 ||
    artifact.audit.redshiftRowCount !== 3 ||
    artifact.audit.monotonicRowCount !== 4 ||
    artifact.audit.intervalContainmentCount !== 20 ||
    artifact.audit.pairwiseRatioAuditCount !== 40 ||
    artifact.audit.adjacentSpacingAuditCount !== 16 ||
    !finiteNonNegative(artifact.audit.maximumDirectOracleRelativeResidual) ||
    !finiteNonNegative(artifact.audit.maximumInverseRoundTripRelativeResidual) ||
    !finiteNonNegative(artifact.audit.maximumPairwiseRatioRelativeResidual) ||
    !finiteNonNegative(artifact.audit.maximumAdjacentSpacingRelativeResidual) ||
    !finiteNonNegative(artifact.audit.maximumRelativeCoordinateUncertaintyUpperBound) ||
    artifact.audit.directOracleQualified !== true ||
    artifact.audit.inverseRoundTripQualified !== true ||
    artifact.audit.ratioPreservationQualified !== true ||
    artifact.audit.adjacentSpacingQualified !== true ||
    artifact.audit.uncertaintyIntervalsQualified !== true ||
    artifact.audit.physicalLineRows !== 0 ||
    artifact.audit.absoluteFrequencyRows !== 0 ||
    artifact.audit.physicalBandpassRows !== 0 ||
    artifact.audit.observedIntensityRows !== 0 ||
    artifact.audit.sciencePixelRows !== 0 ||
    artifact.audit.imageProducts !== 0 ||
    artifact.audit.landmarkMutationCount !== 0 ||
    artifact.audit.scienceWritebackCount !== 0 ||
    !lifecycle ||
    lifecycle.existingCanvasCount !== 1 ||
    lifecycle.newCanvasCreated !== false ||
    lifecycle.sceneRevisionDelta !== 0 ||
    lifecycle.allResourcesAtBaseline !== true ||
    artifact.boundary?.dimensionlessLandmarkPositionAuthorityGranted !== true ||
    artifact.boundary.physicalLineIdentityAuthorityGranted !== false ||
    artifact.boundary.absoluteFrequencyAuthorityGranted !== false ||
    artifact.boundary.lineWidthAuthorityGranted !== false ||
    artifact.boundary.lineAmplitudeAuthorityGranted !== false ||
    artifact.boundary.equivalentWidthAuthorityGranted !== false ||
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
    throw new Error("v481-spectral-landmark-identity");
  }
  return freezeDeep(value as KerrSpectralLandmarkArtifactV481);
}

export function createKerrSpectralLandmarkSummaryV481(
  value: unknown,
): KerrSpectralLandmarkSummaryV481 {
  const artifact = parseKerrSpectralLandmarkArtifactV481(value);
  return freezeDeep({
    version: KERR_SPECTRAL_LANDMARK_SUMMARY_VERSION_V481,
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

export function parseKerrSpectralLandmarkApiV481(value: unknown): KerrSpectralLandmarkApiV481 {
  const api =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrSpectralLandmarkApiV481>)
      : null;
  if (
    !api ||
    api.version !== KERR_SPECTRAL_LANDMARK_API_VERSION_V481 ||
    typeof api.available !== "boolean" ||
    !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(
      api.reason ?? "",
    ) ||
    (api.available && (!api.summary || api.reason !== "ready")) ||
    (!api.available && api.summary !== null)
  ) {
    throw new Error("v481-spectral-landmark-api-identity");
  }
  return freezeDeep(value as KerrSpectralLandmarkApiV481);
}

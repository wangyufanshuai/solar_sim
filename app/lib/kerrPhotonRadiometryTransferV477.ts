export const KERR_PHOTON_RADIOMETRY_ARTIFACT_VERSION_V477 =
  "v477-kerr-photon-radiometry-transfer-artifact-v1" as const;
export const KERR_PHOTON_RADIOMETRY_SUMMARY_VERSION_V477 =
  "v477-kerr-photon-radiometry-transfer-summary-v1" as const;
export const KERR_PHOTON_RADIOMETRY_API_VERSION_V477 =
  "v477-kerr-photon-radiometry-transfer-api-v1" as const;

const SHA256 = /^[a-f0-9]{64}$/;
const TRANSIENT = new Set([
  "generatedAt",
  "artifactSha256",
  "evidenceSha256",
  "pointerSha256",
  "payloadSha256",
  "rowSha256",
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
export const canonicalKerrPhotonRadiometryTransferV477 = (value: unknown): string =>
  JSON.stringify(canonicalize(value));

export type KerrPhotonRadiometryTransferRowV477 = Readonly<{
  rayId: "disk-00" | "disk-01" | "disk-02" | "disk-03";
  sourceRowSha256: string;
  classification: "disk-hit";
  applicability: "analytic-transfer-coefficients-only";
  redshiftFactor: number;
  frequencyRatioObservedToEmitter: number;
  spectralRadianceTransferG3: number;
  bolometricRadianceTransferG4: number;
  oracle: Readonly<{
    spectralLogExp: number;
    bolometricLogExp: number;
    spectralRelativeDifference: number;
    bolometricRelativeDifference: number;
    spectralInverseRoundTripResidual: number;
    bolometricInverseRoundTripResidual: number;
  }>;
  uncertainty: Readonly<{
    method: "first-order-analytic-derivative";
    combinationPolicy: "shared-redshift-channel-not-combined";
    redshiftAbsoluteUpperBound: number;
    spectralTransferAbsoluteUpperBound: number;
    bolometricTransferAbsoluteUpperBound: number;
    independenceProven: false;
    productionBudgetClosed: false;
  }>;
  measurements: Readonly<{
    emittedSpectralRadiance: null;
    observedSpectralRadiance: null;
    emittedBolometricRadiance: null;
    observedBolometricRadiance: null;
    detectorProjectedValue: null;
    stokesI: null;
    stokesQ: null;
    stokesU: null;
    stokesV: null;
    unavailableReason: "measured-emission-and-detector-authority-unavailable";
  }>;
  rowSha256: string;
}>;

export type KerrPhotonRadiometryTransferArtifactV477 = Readonly<{
  version: typeof KERR_PHOTON_RADIOMETRY_ARTIFACT_VERSION_V477;
  generatedAt: string;
  status: "photon-radiometry-transfer-qualified-measured-radiance-unavailable-browser-pending";
  source: Readonly<Record<string, string>>;
  contract: Readonly<{
    rowCount: 4;
    frequencyExponent: 1;
    spectralExponent: 3;
    bolometricExponent: 4;
    liouvilleInvariant: "I_nu_over_nu_cubed";
    redshiftAppliedExactlyOnce: true;
    directPowerAndLogExpOracleRequired: true;
    firstOrderAnalyticUncertaintyPropagation: true;
    sharedRedshiftUncertaintyNotIndependent: true;
    noRssAcrossDerivedChannels: true;
    transferCoefficientsAreNotMeasuredRadiance: true;
    unavailableIsNotZero: true;
    boundedSummaryOnly: true;
    maximumResponseBytes: 131072;
    localShadowOnly: true;
    formalProductPointer: "v263";
  }>;
  rows: readonly KerrPhotonRadiometryTransferRowV477[];
  audit: Readonly<{
    applicableRowCount: 4;
    coefficientCount: 12;
    uncertaintyBoundCount: 12;
    maximumPowerOracleRelativeDifference: number;
    maximumInverseRoundTripResidual: number;
    v466MaximumLiouvilleInvariantRelativeError: number;
    v468MaximumSpectralInverseRelativeError: number;
    v468MaximumBolometricInverseRelativeError: number;
    directPowerOracleQualified: true;
    inverseRoundTripQualified: true;
    liouvilleFixtureQualified: true;
    singleRedshiftApplicationQualified: true;
    measuredRadianceRowCount: 0;
    detectorProjectedRowCount: 0;
    stokesMeasurementRowCount: 0;
    sciencePixelRows: 0;
    presentationFieldInputCount: 0;
    scientificFieldMutationCount: 0;
  }>;
  applicability: Readonly<{
    analyticTransferQualified: true;
    productionRadiometryQualified: false;
    measuredEmitterSpectrumAvailable: false;
    measuredAccretionParametersAvailable: false;
    detectorThroughputAvailable: false;
    backgroundReadNoiseAvailable: false;
    modelDiscrepancyClosed: false;
    denseSamplingAvailable: false;
    scienceRasterAllowed: false;
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
    productionAuthorityGranted: false;
    productionPayloadAllowed: false;
    observedIntensityRows: 0;
    stokesMeasurementRows: 0;
    sciencePixelRows: 0;
    fitsImageRows: 0;
    imageProductsGenerated: false;
    sciencePayloadMutationAllowed: false;
    cinematicScienceWritebackAllowed: false;
    networkAttempted: false;
    automaticRetryApplied: false;
    denseShardRunAllowed: false;
    browserQualification: "not-run";
    visualMatrixQualification: "not-run";
    soakQualification: "not-run";
    rtxWebGpuQualification: "not-run";
  }>;
  payloadSha256: string;
  formalProductPointer: "v263";
  formalDefaultKernel: "legacy-eih-1pn";
  artifactSha256: string;
}>;

export type KerrPhotonRadiometryTransferSummaryV477 = Readonly<{
  version: typeof KERR_PHOTON_RADIOMETRY_SUMMARY_VERSION_V477;
  status: KerrPhotonRadiometryTransferArtifactV477["status"];
  artifactSha256: string;
  payloadSha256: string;
  contract: KerrPhotonRadiometryTransferArtifactV477["contract"];
  rows: KerrPhotonRadiometryTransferArtifactV477["rows"];
  audit: KerrPhotonRadiometryTransferArtifactV477["audit"];
  applicability: KerrPhotonRadiometryTransferArtifactV477["applicability"];
  lifecycle: KerrPhotonRadiometryTransferArtifactV477["lifecycle"];
  boundary: KerrPhotonRadiometryTransferArtifactV477["boundary"];
}>;

export type KerrPhotonRadiometryTransferApiV477 = Readonly<{
  version: typeof KERR_PHOTON_RADIOMETRY_API_VERSION_V477;
  available: boolean;
  reason:
    | "ready"
    | "lite-boundary"
    | "local-shadow-only"
    | "evidence-corrupt"
    | "request-failed";
  summary: KerrPhotonRadiometryTransferSummaryV477 | null;
}>;

export function evaluateKerrPhotonTransferCoefficientsV477(redshiftFactor: number): Readonly<{
  frequencyRatio: number;
  spectralG3: number;
  bolometricG4: number;
  spectralLogExp: number;
  bolometricLogExp: number;
}> {
  if (!Number.isFinite(redshiftFactor) || redshiftFactor <= 0) {
    throw new Error("v477-redshift-factor-domain");
  }
  return Object.freeze({
    frequencyRatio: redshiftFactor,
    spectralG3: redshiftFactor ** 3,
    bolometricG4: redshiftFactor ** 4,
    spectralLogExp: Math.exp(3 * Math.log(redshiftFactor)),
    bolometricLogExp: Math.exp(4 * Math.log(redshiftFactor)),
  });
}

export function propagateKerrPhotonTransferUncertaintyV477(
  redshiftFactor: number,
  redshiftAbsoluteUpperBound: number,
): Readonly<{
  redshiftAbsoluteUpperBound: number;
  spectralTransferAbsoluteUpperBound: number;
  bolometricTransferAbsoluteUpperBound: number;
}> {
  if (
    !Number.isFinite(redshiftFactor) ||
    redshiftFactor <= 0 ||
    !Number.isFinite(redshiftAbsoluteUpperBound) ||
    redshiftAbsoluteUpperBound < 0
  ) {
    throw new Error("v477-uncertainty-domain");
  }
  return Object.freeze({
    redshiftAbsoluteUpperBound,
    spectralTransferAbsoluteUpperBound:
      Math.abs(3 * redshiftFactor ** 2) * redshiftAbsoluteUpperBound,
    bolometricTransferAbsoluteUpperBound:
      Math.abs(4 * redshiftFactor ** 3) * redshiftAbsoluteUpperBound,
  });
}

export function parseKerrPhotonRadiometryTransferArtifactV477(
  value: unknown,
): KerrPhotonRadiometryTransferArtifactV477 {
  const artifact =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrPhotonRadiometryTransferArtifactV477>)
      : null;
  const rows = artifact?.rows ?? [];
  if (
    !artifact ||
    artifact.version !== KERR_PHOTON_RADIOMETRY_ARTIFACT_VERSION_V477 ||
    artifact.status !== "photon-radiometry-transfer-qualified-measured-radiance-unavailable-browser-pending" ||
    !artifact.source ||
    Object.values(artifact.source).some((sha) => !SHA256.test(sha)) ||
    artifact.contract?.rowCount !== 4 ||
    artifact.contract.frequencyExponent !== 1 ||
    artifact.contract.spectralExponent !== 3 ||
    artifact.contract.bolometricExponent !== 4 ||
    artifact.contract.liouvilleInvariant !== "I_nu_over_nu_cubed" ||
    artifact.contract.redshiftAppliedExactlyOnce !== true ||
    artifact.contract.directPowerAndLogExpOracleRequired !== true ||
    artifact.contract.firstOrderAnalyticUncertaintyPropagation !== true ||
    artifact.contract.sharedRedshiftUncertaintyNotIndependent !== true ||
    artifact.contract.noRssAcrossDerivedChannels !== true ||
    artifact.contract.transferCoefficientsAreNotMeasuredRadiance !== true ||
    artifact.contract.unavailableIsNotZero !== true ||
    artifact.contract.boundedSummaryOnly !== true ||
    artifact.contract.maximumResponseBytes !== 131072 ||
    artifact.contract.localShadowOnly !== true ||
    artifact.contract.formalProductPointer !== "v263" ||
    rows.length !== 4 ||
    JSON.stringify(rows.map((row) => row.rayId)) !==
      JSON.stringify(["disk-00", "disk-01", "disk-02", "disk-03"]) ||
    rows.some(
      (row) =>
        !SHA256.test(row.sourceRowSha256) ||
        row.classification !== "disk-hit" ||
        row.applicability !== "analytic-transfer-coefficients-only" ||
        ![
          row.redshiftFactor,
          row.frequencyRatioObservedToEmitter,
          row.spectralRadianceTransferG3,
          row.bolometricRadianceTransferG4,
          row.oracle.spectralLogExp,
          row.oracle.bolometricLogExp,
          row.oracle.spectralRelativeDifference,
          row.oracle.bolometricRelativeDifference,
          row.oracle.spectralInverseRoundTripResidual,
          row.oracle.bolometricInverseRoundTripResidual,
          row.uncertainty.redshiftAbsoluteUpperBound,
          row.uncertainty.spectralTransferAbsoluteUpperBound,
          row.uncertainty.bolometricTransferAbsoluteUpperBound,
        ].every(Number.isFinite) ||
        row.redshiftFactor <= 0 ||
        row.frequencyRatioObservedToEmitter !== row.redshiftFactor ||
        row.uncertainty.method !== "first-order-analytic-derivative" ||
        row.uncertainty.combinationPolicy !== "shared-redshift-channel-not-combined" ||
        row.uncertainty.independenceProven !== false ||
        row.uncertainty.productionBudgetClosed !== false ||
        Object.entries(row.measurements).some(
          ([key, entry]) => key !== "unavailableReason" && entry !== null,
        ) ||
        row.measurements.unavailableReason !==
          "measured-emission-and-detector-authority-unavailable" ||
        !SHA256.test(row.rowSha256),
    ) ||
    artifact.audit?.applicableRowCount !== 4 ||
    artifact.audit.coefficientCount !== 12 ||
    artifact.audit.uncertaintyBoundCount !== 12 ||
    !Number.isFinite(artifact.audit.maximumPowerOracleRelativeDifference) ||
    artifact.audit.maximumPowerOracleRelativeDifference >= 1e-12 ||
    !Number.isFinite(artifact.audit.maximumInverseRoundTripResidual) ||
    artifact.audit.maximumInverseRoundTripResidual >= 1e-12 ||
    !Number.isFinite(artifact.audit.v466MaximumLiouvilleInvariantRelativeError) ||
    artifact.audit.v466MaximumLiouvilleInvariantRelativeError >= 1e-12 ||
    !Number.isFinite(artifact.audit.v468MaximumSpectralInverseRelativeError) ||
    artifact.audit.v468MaximumSpectralInverseRelativeError >= 1e-12 ||
    !Number.isFinite(artifact.audit.v468MaximumBolometricInverseRelativeError) ||
    artifact.audit.v468MaximumBolometricInverseRelativeError >= 1e-12 ||
    artifact.audit.directPowerOracleQualified !== true ||
    artifact.audit.inverseRoundTripQualified !== true ||
    artifact.audit.liouvilleFixtureQualified !== true ||
    artifact.audit.singleRedshiftApplicationQualified !== true ||
    artifact.audit.measuredRadianceRowCount !== 0 ||
    artifact.audit.detectorProjectedRowCount !== 0 ||
    artifact.audit.stokesMeasurementRowCount !== 0 ||
    artifact.audit.sciencePixelRows !== 0 ||
    artifact.audit.presentationFieldInputCount !== 0 ||
    artifact.audit.scientificFieldMutationCount !== 0 ||
    artifact.applicability?.analyticTransferQualified !== true ||
    artifact.applicability.productionRadiometryQualified !== false ||
    artifact.applicability.measuredEmitterSpectrumAvailable !== false ||
    artifact.applicability.measuredAccretionParametersAvailable !== false ||
    artifact.applicability.detectorThroughputAvailable !== false ||
    artifact.applicability.backgroundReadNoiseAvailable !== false ||
    artifact.applicability.modelDiscrepancyClosed !== false ||
    artifact.applicability.denseSamplingAvailable !== false ||
    artifact.applicability.scienceRasterAllowed !== false ||
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
    artifact.boundary?.productionAuthorityGranted !== false ||
    artifact.boundary.productionPayloadAllowed !== false ||
    artifact.boundary.observedIntensityRows !== 0 ||
    artifact.boundary.stokesMeasurementRows !== 0 ||
    artifact.boundary.sciencePixelRows !== 0 ||
    artifact.boundary.fitsImageRows !== 0 ||
    artifact.boundary.imageProductsGenerated !== false ||
    artifact.boundary.sciencePayloadMutationAllowed !== false ||
    artifact.boundary.cinematicScienceWritebackAllowed !== false ||
    artifact.boundary.networkAttempted !== false ||
    artifact.boundary.automaticRetryApplied !== false ||
    artifact.boundary.denseShardRunAllowed !== false ||
    artifact.boundary.browserQualification !== "not-run" ||
    artifact.boundary.visualMatrixQualification !== "not-run" ||
    artifact.boundary.soakQualification !== "not-run" ||
    artifact.boundary.rtxWebGpuQualification !== "not-run" ||
    !SHA256.test(artifact.payloadSha256 ?? "") ||
    artifact.formalProductPointer !== "v263" ||
    artifact.formalDefaultKernel !== "legacy-eih-1pn" ||
    !SHA256.test(artifact.artifactSha256 ?? "")
  ) {
    throw new Error("v477-photon-radiometry-identity");
  }
  return freezeDeep(value as KerrPhotonRadiometryTransferArtifactV477);
}

export function createKerrPhotonRadiometryTransferSummaryV477(
  value: unknown,
): KerrPhotonRadiometryTransferSummaryV477 {
  const artifact = parseKerrPhotonRadiometryTransferArtifactV477(value);
  return freezeDeep({
    version: KERR_PHOTON_RADIOMETRY_SUMMARY_VERSION_V477,
    status: artifact.status,
    artifactSha256: artifact.artifactSha256,
    payloadSha256: artifact.payloadSha256,
    contract: artifact.contract,
    rows: artifact.rows,
    audit: artifact.audit,
    applicability: artifact.applicability,
    lifecycle: artifact.lifecycle,
    boundary: artifact.boundary,
  });
}

export function parseKerrPhotonRadiometryTransferApiV477(
  value: unknown,
): KerrPhotonRadiometryTransferApiV477 {
  const api =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrPhotonRadiometryTransferApiV477>)
      : null;
  if (
    !api ||
    api.version !== KERR_PHOTON_RADIOMETRY_API_VERSION_V477 ||
    typeof api.available !== "boolean" ||
    !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(
      api.reason ?? "",
    ) ||
    (api.available && (!api.summary || api.reason !== "ready")) ||
    (!api.available && api.summary !== null)
  ) {
    throw new Error("v477-photon-radiometry-api-identity");
  }
  return freezeDeep(value as KerrPhotonRadiometryTransferApiV477);
}

export const KERR_NORMALIZED_FREQUENCY_ARTIFACT_VERSION_V478 =
  "v478-kerr-normalized-frequency-chart-artifact-v1" as const;
export const KERR_NORMALIZED_FREQUENCY_SUMMARY_VERSION_V478 =
  "v478-kerr-normalized-frequency-chart-summary-v1" as const;
export const KERR_NORMALIZED_FREQUENCY_API_VERSION_V478 =
  "v478-kerr-normalized-frequency-chart-api-v1" as const;
export const KERR_NORMALIZED_FREQUENCY_ANCHORS_V478 = Object.freeze([
  0.5, 0.75, 1, 1.5, 2,
] as const);

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
export const canonicalKerrNormalizedFrequencyChartV478 = (value: unknown): string =>
  JSON.stringify(canonicalize(value));

export type KerrNormalizedFrequencySampleV478 = Readonly<{
  anchorIndex: 0 | 1 | 2 | 3 | 4;
  emitterFrequencyOverReference: number;
  observerFrequencyOverReference: number;
  observerFrequencyLogExpOracle: number;
  directOracleRelativeDifference: number;
  inverseRecoveredEmitterFrequencyOverReference: number;
  inverseRoundTripRelativeResidual: number;
  observerFrequencyAbsoluteUncertaintyUpperBound: number;
}>;

export type KerrNormalizedFrequencyRowV478 = Readonly<{
  rayId: "disk-00" | "disk-01" | "disk-02" | "disk-03";
  sourceRowSha256: string;
  redshiftFactor: number;
  shiftClass: "blueshift" | "redshift";
  coordinateSystem: "dimensionless-frequency-over-unspecified-reference";
  samples: readonly KerrNormalizedFrequencySampleV478[];
  observerEnvelope: Readonly<{
    minimumFrequencyOverReference: number;
    maximumFrequencyOverReference: number;
    strictlyIncreasing: true;
  }>;
  physicalApplicability: Readonly<{
    referenceFrequencyHz: null;
    absoluteEmitterFrequencyHz: null;
    absoluteObserverFrequencyHz: null;
    physicalBandpassId: null;
    detectorThroughput: null;
    bandIntegratedRadiance: null;
    unavailableReason: "reference-frequency-bandpass-and-throughput-unavailable";
  }>;
  rowSha256: string;
}>;

export type KerrNormalizedFrequencyArtifactV478 = Readonly<{
  version: typeof KERR_NORMALIZED_FREQUENCY_ARTIFACT_VERSION_V478;
  generatedAt: string;
  status: "normalized-frequency-chart-qualified-physical-bandpass-unavailable-browser-pending";
  source: Readonly<Record<string, string>>;
  contract: Readonly<{
    rowCount: 4;
    anchorCountPerRow: 5;
    sampleCount: 20;
    normalizedFrequencyAnchors: typeof KERR_NORMALIZED_FREQUENCY_ANCHORS_V478;
    mapping: "nu_observer_over_nu0_equals_g_times_nu_emitter_over_nu0";
    inverseMapping: "nu_emitter_over_nu0_equals_nu_observer_over_nu0_divided_by_g";
    directMultiplyAndLogExpOracleRequired: true;
    monotonicityRequired: true;
    firstOrderUncertaintyPropagation: true;
    normalizedCoordinatesOnly: true;
    physicalBandpassAuthorityRequiredForAbsoluteProducts: true;
    unavailableIsNotZero: true;
    boundedSummaryOnly: true;
    maximumResponseBytes: 131072;
    localShadowOnly: true;
    formalProductPointer: "v263";
  }>;
  rows: readonly KerrNormalizedFrequencyRowV478[];
  audit: Readonly<{
    sampleCount: 20;
    blueshiftRowCount: 1;
    redshiftRowCount: 3;
    monotonicRowCount: 4;
    maximumDirectOracleRelativeDifference: number;
    maximumInverseRoundTripRelativeResidual: number;
    maximumV466FrequencyRoundTripRelativeError: number;
    directOracleQualified: true;
    inverseRoundTripQualified: true;
    monotonicityQualified: true;
    uncertaintyPropagationQualified: true;
    absoluteFrequencyRowCount: 0;
    physicalBandpassRowCount: 0;
    bandIntegratedRadianceRowCount: 0;
    detectorThroughputRowCount: 0;
    sciencePixelRows: 0;
    presentationFieldInputCount: 0;
    scientificFieldMutationCount: 0;
  }>;
  applicability: Readonly<{
    normalizedFrequencyCoordinateQualified: true;
    absoluteFrequencyCoordinateQualified: false;
    physicalBandpassQualified: false;
    bandIntegratedRadianceQualified: false;
    detectorProjectionQualified: false;
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
    absoluteFrequencyRows: 0;
    physicalBandpassRows: 0;
    bandIntegratedRadianceRows: 0;
    detectorProjectedRows: 0;
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

export type KerrNormalizedFrequencySummaryV478 = Readonly<{
  version: typeof KERR_NORMALIZED_FREQUENCY_SUMMARY_VERSION_V478;
  status: KerrNormalizedFrequencyArtifactV478["status"];
  artifactSha256: string;
  payloadSha256: string;
  contract: KerrNormalizedFrequencyArtifactV478["contract"];
  rows: KerrNormalizedFrequencyArtifactV478["rows"];
  audit: KerrNormalizedFrequencyArtifactV478["audit"];
  applicability: KerrNormalizedFrequencyArtifactV478["applicability"];
  lifecycle: KerrNormalizedFrequencyArtifactV478["lifecycle"];
  boundary: KerrNormalizedFrequencyArtifactV478["boundary"];
}>;

export type KerrNormalizedFrequencyApiV478 = Readonly<{
  version: typeof KERR_NORMALIZED_FREQUENCY_API_VERSION_V478;
  available: boolean;
  reason:
    | "ready"
    | "lite-boundary"
    | "local-shadow-only"
    | "evidence-corrupt"
    | "request-failed";
  summary: KerrNormalizedFrequencySummaryV478 | null;
}>;

export function evaluateKerrNormalizedFrequencyCoordinateV478(
  redshiftFactor: number,
  emitterFrequencyOverReference: number,
  redshiftAbsoluteUncertaintyUpperBound: number,
): Omit<KerrNormalizedFrequencySampleV478, "anchorIndex"> {
  if (
    !Number.isFinite(redshiftFactor) ||
    redshiftFactor <= 0 ||
    !Number.isFinite(emitterFrequencyOverReference) ||
    emitterFrequencyOverReference <= 0 ||
    !Number.isFinite(redshiftAbsoluteUncertaintyUpperBound) ||
    redshiftAbsoluteUncertaintyUpperBound < 0
  ) {
    throw new Error("v478-normalized-frequency-domain");
  }
  const observerFrequencyOverReference = redshiftFactor * emitterFrequencyOverReference;
  const oracle = Math.exp(Math.log(redshiftFactor) + Math.log(emitterFrequencyOverReference));
  const denominator = Math.max(
    Math.abs(observerFrequencyOverReference),
    Math.abs(oracle),
    Number.MIN_VALUE,
  );
  const recovered = observerFrequencyOverReference / redshiftFactor;
  return Object.freeze({
    emitterFrequencyOverReference,
    observerFrequencyOverReference,
    observerFrequencyLogExpOracle: oracle,
    directOracleRelativeDifference:
      Math.abs(observerFrequencyOverReference - oracle) / denominator,
    inverseRecoveredEmitterFrequencyOverReference: recovered,
    inverseRoundTripRelativeResidual:
      Math.abs(recovered - emitterFrequencyOverReference) /
      Math.max(Math.abs(emitterFrequencyOverReference), Number.MIN_VALUE),
    observerFrequencyAbsoluteUncertaintyUpperBound:
      emitterFrequencyOverReference * redshiftAbsoluteUncertaintyUpperBound,
  });
}

export function parseKerrNormalizedFrequencyArtifactV478(
  value: unknown,
): KerrNormalizedFrequencyArtifactV478 {
  const artifact =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrNormalizedFrequencyArtifactV478>)
      : null;
  const rows = artifact?.rows ?? [];
  if (
    !artifact ||
    artifact.version !== KERR_NORMALIZED_FREQUENCY_ARTIFACT_VERSION_V478 ||
    artifact.status !== "normalized-frequency-chart-qualified-physical-bandpass-unavailable-browser-pending" ||
    !artifact.source ||
    Object.values(artifact.source).some((sha) => !SHA256.test(sha)) ||
    artifact.contract?.rowCount !== 4 ||
    artifact.contract.anchorCountPerRow !== 5 ||
    artifact.contract.sampleCount !== 20 ||
    JSON.stringify(artifact.contract.normalizedFrequencyAnchors) !==
      JSON.stringify(KERR_NORMALIZED_FREQUENCY_ANCHORS_V478) ||
    artifact.contract.mapping !==
      "nu_observer_over_nu0_equals_g_times_nu_emitter_over_nu0" ||
    artifact.contract.inverseMapping !==
      "nu_emitter_over_nu0_equals_nu_observer_over_nu0_divided_by_g" ||
    artifact.contract.directMultiplyAndLogExpOracleRequired !== true ||
    artifact.contract.monotonicityRequired !== true ||
    artifact.contract.firstOrderUncertaintyPropagation !== true ||
    artifact.contract.normalizedCoordinatesOnly !== true ||
    artifact.contract.physicalBandpassAuthorityRequiredForAbsoluteProducts !== true ||
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
        !Number.isFinite(row.redshiftFactor) ||
        row.redshiftFactor <= 0 ||
        !["blueshift", "redshift"].includes(row.shiftClass) ||
        row.coordinateSystem !== "dimensionless-frequency-over-unspecified-reference" ||
        row.samples.length !== 5 ||
        JSON.stringify(row.samples.map((sample) => sample.emitterFrequencyOverReference)) !==
          JSON.stringify(KERR_NORMALIZED_FREQUENCY_ANCHORS_V478) ||
        row.samples.some(
          (sample, index) =>
            sample.anchorIndex !== index ||
            ![
              sample.emitterFrequencyOverReference,
              sample.observerFrequencyOverReference,
              sample.observerFrequencyLogExpOracle,
              sample.directOracleRelativeDifference,
              sample.inverseRecoveredEmitterFrequencyOverReference,
              sample.inverseRoundTripRelativeResidual,
              sample.observerFrequencyAbsoluteUncertaintyUpperBound,
            ].every(Number.isFinite),
        ) ||
        row.observerEnvelope.strictlyIncreasing !== true ||
        row.observerEnvelope.minimumFrequencyOverReference !==
          row.samples[0]?.observerFrequencyOverReference ||
        row.observerEnvelope.maximumFrequencyOverReference !==
          row.samples[4]?.observerFrequencyOverReference ||
        Object.entries(row.physicalApplicability).some(
          ([key, entry]) => key !== "unavailableReason" && entry !== null,
        ) ||
        row.physicalApplicability.unavailableReason !==
          "reference-frequency-bandpass-and-throughput-unavailable" ||
        !SHA256.test(row.rowSha256),
    ) ||
    artifact.audit?.sampleCount !== 20 ||
    artifact.audit.blueshiftRowCount !== 1 ||
    artifact.audit.redshiftRowCount !== 3 ||
    artifact.audit.monotonicRowCount !== 4 ||
    !Number.isFinite(artifact.audit.maximumDirectOracleRelativeDifference) ||
    artifact.audit.maximumDirectOracleRelativeDifference >= 1e-12 ||
    !Number.isFinite(artifact.audit.maximumInverseRoundTripRelativeResidual) ||
    artifact.audit.maximumInverseRoundTripRelativeResidual >= 1e-12 ||
    !Number.isFinite(artifact.audit.maximumV466FrequencyRoundTripRelativeError) ||
    artifact.audit.maximumV466FrequencyRoundTripRelativeError >= 1e-12 ||
    artifact.audit.directOracleQualified !== true ||
    artifact.audit.inverseRoundTripQualified !== true ||
    artifact.audit.monotonicityQualified !== true ||
    artifact.audit.uncertaintyPropagationQualified !== true ||
    artifact.audit.absoluteFrequencyRowCount !== 0 ||
    artifact.audit.physicalBandpassRowCount !== 0 ||
    artifact.audit.bandIntegratedRadianceRowCount !== 0 ||
    artifact.audit.detectorThroughputRowCount !== 0 ||
    artifact.audit.sciencePixelRows !== 0 ||
    artifact.audit.presentationFieldInputCount !== 0 ||
    artifact.audit.scientificFieldMutationCount !== 0 ||
    artifact.applicability?.normalizedFrequencyCoordinateQualified !== true ||
    artifact.applicability.absoluteFrequencyCoordinateQualified !== false ||
    artifact.applicability.physicalBandpassQualified !== false ||
    artifact.applicability.bandIntegratedRadianceQualified !== false ||
    artifact.applicability.detectorProjectionQualified !== false ||
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
    artifact.boundary.absoluteFrequencyRows !== 0 ||
    artifact.boundary.physicalBandpassRows !== 0 ||
    artifact.boundary.bandIntegratedRadianceRows !== 0 ||
    artifact.boundary.detectorProjectedRows !== 0 ||
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
    throw new Error("v478-normalized-frequency-identity");
  }
  return freezeDeep(value as KerrNormalizedFrequencyArtifactV478);
}

export function createKerrNormalizedFrequencySummaryV478(
  value: unknown,
): KerrNormalizedFrequencySummaryV478 {
  const artifact = parseKerrNormalizedFrequencyArtifactV478(value);
  return freezeDeep({
    version: KERR_NORMALIZED_FREQUENCY_SUMMARY_VERSION_V478,
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

export function parseKerrNormalizedFrequencyApiV478(
  value: unknown,
): KerrNormalizedFrequencyApiV478 {
  const api =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrNormalizedFrequencyApiV478>)
      : null;
  if (
    !api ||
    api.version !== KERR_NORMALIZED_FREQUENCY_API_VERSION_V478 ||
    typeof api.available !== "boolean" ||
    !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(
      api.reason ?? "",
    ) ||
    (api.available && (!api.summary || api.reason !== "ready")) ||
    (!api.available && api.summary !== null)
  ) {
    throw new Error("v478-normalized-frequency-api-identity");
  }
  return freezeDeep(value as KerrNormalizedFrequencyApiV478);
}

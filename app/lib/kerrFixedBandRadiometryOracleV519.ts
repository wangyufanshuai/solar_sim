export const KERR_FIXED_BAND_RADIOMETRY_ORACLE_VERSION_V519 =
  "v519-kerr-fixed-band-radiometry-multiprecision-oracle-v1" as const;
export const KERR_FIXED_BAND_RADIOMETRY_ORACLE_API_VERSION_V519 =
  "v519-kerr-fixed-band-radiometry-multiprecision-oracle-api-v1" as const;

export type KerrFixedBandRadiometryOracleRowV519 = Readonly<{
  rayIndex: number;
  bandId: "visible" | "euv" | "soft-x-ray";
  spinA: string;
  redshiftFactor: string;
  effectiveTemperatureK: string;
  bandLowerFrequencyHz: string;
  bandUpperFrequencyHz: string;
  storedEnergyRadianceWM2Sr: string;
  oracleEnergyRadianceWM2Sr: string;
  energyRadianceRelativeDifference: string;
  storedPhotonRadiancePerSM2Sr: string;
  oraclePhotonRadiancePerSM2Sr: string;
  photonRadianceRelativeDifference: string;
  storedMeanObservedFrequencyHz: string;
  oracleMeanObservedFrequencyHz: string;
  meanFrequencyRelativeDifference: string;
  applicability: "model-predicted-thin-disk-radiometry-only";
}>;

export type KerrFixedBandRadiometryOracleArtifactV519 = Readonly<{
  version: typeof KERR_FIXED_BAND_RADIOMETRY_ORACLE_VERSION_V519;
  generatedAt: string;
  status: "fixed-band-radiometry-multiprecision-oracle-qualified-12-rows";
  source: Readonly<{
    v320ArtifactSha256: string;
    v328ArtifactSha256: string;
    v477ArtifactSha256: string;
    fullShortAuthoritySha256: string;
  }>;
  oracle: Readonly<{
    backend: "mpmath-1.3.0";
    decimalDigits: 80;
    integration: "adaptive-tanh-sinh-log-frequency";
    planckFormula: string;
    redshiftFormula: string;
    photonFormula: string;
    constants: Readonly<{
      planckConstantJS: string;
      speedOfLightMS: string;
      boltzmannConstantJK: string;
      siDefinitionExact: true;
    }>;
  }>;
  counts: Readonly<{
    rayCount: 4;
    bandCount: 3;
    rowCount: 12;
    energyIntegralCount: 12;
    photonIntegralCount: 12;
    meanFrequencyCount: 12;
    transferCoefficientRayCount: 4;
    measuredRadianceRowCount: 0;
    detectorProjectedRowCount: 0;
    sciencePixelRowCount: 0;
  }>;
  maxima: Readonly<{
    energyRadianceRelativeDifference: string;
    photonRadianceRelativeDifference: string;
    meanFrequencyRelativeDifference: string;
    g3TransferRelativeDifference: string;
    g4TransferRelativeDifference: string;
  }>;
  limits: Readonly<{
    energyRadianceRelativeDifference: string;
    photonRadianceRelativeDifference: string;
    meanFrequencyRelativeDifference: string;
    transferCoefficientRelativeDifference: string;
  }>;
  rows: readonly KerrFixedBandRadiometryOracleRowV519[];
  qualification: Readonly<{
    independentAlgorithm: true;
    v320EnergyRadianceQualified: true;
    v328PhotonRadianceQualified: true;
    meanPhotonFrequencyQualified: true;
    v477G3G4TransferQualified: true;
    productionMeasuredRadiometryQualified: false;
  }>;
  boundary: Readonly<{
    modelPredictionOnly: true;
    measuredEmitterSpectrumAvailable: false;
    measuredAccretionParametersAvailable: false;
    detectorThroughputAvailable: false;
    observedDetectorCountsAvailable: false;
    scienceRasterAuthorityAvailable: false;
    cinematicScienceWritebackAllowed: false;
    denseCampaignStatus: "incomplete-0-of-49";
    browserQualification: "not-run";
    formalProductPointer: "v263";
    formalDefaultKernel: "legacy-eih-1pn";
  }>;
  sourceManifest: readonly Readonly<{ path: string; sha256: string }>[];
  sourceSha256: string;
  artifactSha256: string;
}>;

export type KerrFixedBandRadiometryOracleSummaryV519 = Pick<
  KerrFixedBandRadiometryOracleArtifactV519,
  | "version"
  | "status"
  | "source"
  | "oracle"
  | "counts"
  | "maxima"
  | "limits"
  | "qualification"
  | "boundary"
  | "artifactSha256"
>;

export type KerrFixedBandRadiometryOracleApiV519 = Readonly<{
  version: typeof KERR_FIXED_BAND_RADIOMETRY_ORACLE_API_VERSION_V519;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt";
  summary: KerrFixedBandRadiometryOracleSummaryV519 | null;
}>;

const SHA = /^[a-f0-9]{64}$/;
const DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "evidenceSha256",
  "pointerSha256",
]);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !isRecord(value)
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => !transient.has(key))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
export const canonicalKerrFixedBandRadiometryOracleV519 = (value: unknown) =>
  JSON.stringify(canonicalize(value));
const validDecimal = (value: unknown) =>
  typeof value === "string" && DECIMAL.test(value) && Number.isFinite(Number(value));
const below = (value: unknown, limit: unknown) =>
  validDecimal(value) && validDecimal(limit) && Number(value) < Number(limit);

function validateCore(value: Partial<KerrFixedBandRadiometryOracleArtifactV519>) {
  return (
    value.version === KERR_FIXED_BAND_RADIOMETRY_ORACLE_VERSION_V519 &&
    value.status === "fixed-band-radiometry-multiprecision-oracle-qualified-12-rows" &&
    Boolean(value.source) &&
    Object.values(value.source ?? {}).every((entry) => SHA.test(entry)) &&
    value.oracle?.backend === "mpmath-1.3.0" &&
    value.oracle.decimalDigits === 80 &&
    value.oracle.integration === "adaptive-tanh-sinh-log-frequency" &&
    value.oracle.constants.siDefinitionExact === true &&
    value.counts?.rayCount === 4 &&
    value.counts.bandCount === 3 &&
    value.counts.rowCount === 12 &&
    value.counts.energyIntegralCount === 12 &&
    value.counts.photonIntegralCount === 12 &&
    value.counts.meanFrequencyCount === 12 &&
    value.counts.transferCoefficientRayCount === 4 &&
    value.counts.measuredRadianceRowCount === 0 &&
    value.counts.detectorProjectedRowCount === 0 &&
    value.counts.sciencePixelRowCount === 0 &&
    below(
      value.maxima?.energyRadianceRelativeDifference,
      value.limits?.energyRadianceRelativeDifference,
    ) &&
    below(
      value.maxima?.photonRadianceRelativeDifference,
      value.limits?.photonRadianceRelativeDifference,
    ) &&
    below(
      value.maxima?.meanFrequencyRelativeDifference,
      value.limits?.meanFrequencyRelativeDifference,
    ) &&
    below(
      value.maxima?.g3TransferRelativeDifference,
      value.limits?.transferCoefficientRelativeDifference,
    ) &&
    below(
      value.maxima?.g4TransferRelativeDifference,
      value.limits?.transferCoefficientRelativeDifference,
    ) &&
    value.qualification?.independentAlgorithm === true &&
    value.qualification.v320EnergyRadianceQualified === true &&
    value.qualification.v328PhotonRadianceQualified === true &&
    value.qualification.meanPhotonFrequencyQualified === true &&
    value.qualification.v477G3G4TransferQualified === true &&
    value.qualification.productionMeasuredRadiometryQualified === false &&
    value.boundary?.modelPredictionOnly === true &&
    value.boundary.measuredEmitterSpectrumAvailable === false &&
    value.boundary.measuredAccretionParametersAvailable === false &&
    value.boundary.detectorThroughputAvailable === false &&
    value.boundary.observedDetectorCountsAvailable === false &&
    value.boundary.scienceRasterAuthorityAvailable === false &&
    value.boundary.cinematicScienceWritebackAllowed === false &&
    value.boundary.denseCampaignStatus === "incomplete-0-of-49" &&
    value.boundary.browserQualification === "not-run" &&
    value.boundary.formalProductPointer === "v263" &&
    value.boundary.formalDefaultKernel === "legacy-eih-1pn" &&
    SHA.test(value.artifactSha256 ?? "")
  );
}

export function parseKerrFixedBandRadiometryOracleArtifactV519(
  value: unknown,
): KerrFixedBandRadiometryOracleArtifactV519 {
  if (!isRecord(value)) throw new Error("v519-radiometry-shape");
  const artifact = value as Partial<KerrFixedBandRadiometryOracleArtifactV519>;
  const expectedPairs = new Set(
    [12, 13, 14, 15].flatMap((rayIndex) =>
      ["visible", "euv", "soft-x-ray"].map((bandId) => `${rayIndex}:${bandId}`),
    ),
  );
  if (
    !validateCore(artifact) ||
    !Array.isArray(artifact.rows) ||
    artifact.rows.length !== 12 ||
    artifact.rows.some((row) => {
      const key = `${row.rayIndex}:${row.bandId}`;
      const lower = Number(row.bandLowerFrequencyHz);
      const upper = Number(row.bandUpperFrequencyHz);
      const mean = Number(row.oracleMeanObservedFrequencyHz);
      if (!expectedPairs.delete(key)) return true;
      return (
        row.applicability !== "model-predicted-thin-disk-radiometry-only" ||
        [
          row.spinA,
          row.redshiftFactor,
          row.effectiveTemperatureK,
          row.bandLowerFrequencyHz,
          row.bandUpperFrequencyHz,
          row.storedEnergyRadianceWM2Sr,
          row.oracleEnergyRadianceWM2Sr,
          row.energyRadianceRelativeDifference,
          row.storedPhotonRadiancePerSM2Sr,
          row.oraclePhotonRadiancePerSM2Sr,
          row.photonRadianceRelativeDifference,
          row.storedMeanObservedFrequencyHz,
          row.oracleMeanObservedFrequencyHz,
          row.meanFrequencyRelativeDifference,
        ].some((entry) => !validDecimal(entry)) ||
        mean < lower ||
        mean > upper
      );
    }) ||
    expectedPairs.size !== 0 ||
    !Array.isArray(artifact.sourceManifest) ||
    artifact.sourceManifest.some((entry) => !entry.path || !SHA.test(entry.sha256)) ||
    !SHA.test(artifact.sourceSha256 ?? "")
  ) {
    throw new Error("v519-radiometry-boundary");
  }
  return artifact as KerrFixedBandRadiometryOracleArtifactV519;
}

export function createKerrFixedBandRadiometryOracleSummaryV519(
  value: unknown,
): KerrFixedBandRadiometryOracleSummaryV519 {
  const artifact = parseKerrFixedBandRadiometryOracleArtifactV519(value);
  return Object.freeze({
    version: artifact.version,
    status: artifact.status,
    source: artifact.source,
    oracle: artifact.oracle,
    counts: artifact.counts,
    maxima: artifact.maxima,
    limits: artifact.limits,
    qualification: artifact.qualification,
    boundary: artifact.boundary,
    artifactSha256: artifact.artifactSha256,
  });
}

export function parseKerrFixedBandRadiometryOracleApiV519(
  value: unknown,
): KerrFixedBandRadiometryOracleApiV519 {
  if (
    !isRecord(value) ||
    value.version !== KERR_FIXED_BAND_RADIOMETRY_ORACLE_API_VERSION_V519 ||
    typeof value.available !== "boolean" ||
    !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt"].includes(
      String(value.reason),
    )
  ) {
    throw new Error("v519-api-boundary");
  }
  if (value.available) {
    if (!isRecord(value.summary) || !validateCore(value.summary)) {
      throw new Error("v519-api-summary");
    }
  } else if (value.summary !== null) {
    throw new Error("v519-api-unavailable-summary");
  }
  return value as unknown as KerrFixedBandRadiometryOracleApiV519;
}

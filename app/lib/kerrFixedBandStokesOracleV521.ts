export const KERR_FIXED_BAND_STOKES_ORACLE_VERSION_V521 =
  "v521-kerr-fixed-band-stokes-direct-integration-oracle-v1" as const;
export const KERR_FIXED_BAND_STOKES_ORACLE_API_VERSION_V521 =
  "v521-kerr-fixed-band-stokes-direct-integration-oracle-api-v1" as const;

export type KerrFixedBandStokesOracleMethodV521 =
  | "walker-penrose"
  | "independent-ks-parallel-transport";
export type KerrFixedBandStokesOracleBandV521 = "visible" | "euv" | "soft-x-ray";

export type KerrFixedBandStokesOracleRowV521 = Readonly<{
  rayIndex: 12 | 13 | 14 | 15;
  bandId: KerrFixedBandStokesOracleBandV521;
  transportMethod: KerrFixedBandStokesOracleMethodV521;
  evpaDeg: string;
  linearPolarizationFraction: "0.12";
  directEnergyStokes: Readonly<{
    iWM2Sr: string;
    qWM2Sr: string;
    uWM2Sr: string;
    v: "unavailable-not-modeled";
  }>;
  directPhotonStokes: Readonly<{
    iPerSM2Sr: string;
    qPerSM2Sr: string;
    uPerSM2Sr: string;
    v: "unavailable-not-modeled";
  }>;
  v520EnergyStokes: Readonly<{
    iWM2Sr: string;
    qWM2Sr: string;
    uWM2Sr: string;
    v: "unavailable-not-modeled";
  }>;
  v520PhotonStokes: Readonly<{
    iPerSM2Sr: string;
    qPerSM2Sr: string;
    uPerSM2Sr: string;
    v: "unavailable-not-modeled";
  }>;
  relativeDifferences: Readonly<{
    energyI: string;
    energyQ: string;
    energyU: string;
    photonI: string;
    photonQ: string;
    photonU: string;
  }>;
  residuals: Readonly<{
    linearFractionAbsolute: string;
    evpaReconstructionDeg: string;
    physicalConeViolation: string;
  }>;
  uncertaintyEnvelope: Readonly<{
    upstreamEnergyRadiometryRelative: string;
    upstreamPhotonRadiometryRelative: string;
    directIntegrationEnergyRelative: string;
    directIntegrationPhotonRelative: string;
    crossChannelIndependenceProven: false;
    rssApplied: false;
    scalarTotalAvailable: false;
    combination: "componentwise-linear-envelope-no-rss-no-scalar-total";
  }>;
  applicability: "model-predicted-direct-fixed-band-linear-stokes-only";
}>;

export type KerrFixedBandStokesOracleArtifactV521 = Readonly<{
  version: typeof KERR_FIXED_BAND_STOKES_ORACLE_VERSION_V521;
  generatedAt: string;
  status: "direct-fixed-band-stokes-multiprecision-oracle-qualified-24-rows";
  source: Readonly<{
    v320ArtifactSha256: string;
    v406ArtifactSha256: string;
    v519ArtifactSha256: string;
    v520ArtifactSha256: string;
    fullShortAuthoritySha256: string;
  }>;
  model: Readonly<{
    linearPolarizationFraction: "0.12";
    emittedBasis: "projected-disk-normal";
    propagation: string;
    circularPolarization: "unavailable-not-modeled";
    faradayRotation: "unavailable-not-modeled";
    frequencyDependence: string;
  }>;
  oracle: Readonly<{
    backend: "mpmath-1.3.0";
    decimalDigits: 80;
    integration: "six-independent-adaptive-tanh-sinh-log-frequency-integrals-per-row";
    components: readonly string[];
    v520IntegratedValuesConsumedAsInputs: false;
    v520ValuesUsedForComparisonOnly: true;
    transportMethods: readonly KerrFixedBandStokesOracleMethodV521[];
    independentTransportPathsPreserved: true;
    methodValuesAveraged: false;
  }>;
  counts: Readonly<{
    rayCount: 4;
    bandCount: 3;
    transportMethodCount: 2;
    rowCount: 24;
    directAdaptiveIntegralCount: 144;
    energyStokesComponentCount: 72;
    photonStokesComponentCount: 72;
    componentwiseUncertaintyEnvelopeCount: 24;
    measuredStokesRowCount: 0;
    circularStokesRowCount: 0;
    detectorProjectedRowCount: 0;
    sciencePixelRowCount: 0;
  }>;
  maxima: Readonly<{
    directVsV520EnergyIRelative: string;
    directVsV520EnergyQRelative: string;
    directVsV520EnergyURelative: string;
    directVsV520PhotonIRelative: string;
    directVsV520PhotonQRelative: string;
    directVsV520PhotonURelative: string;
    linearFractionResidual: string;
    evpaReconstructionDeg: string;
    sourceFrequencyEvpaVariationDeg: string;
    wpKsEvpaDifferenceDeg: string;
    wpKsNormalizedQDifference: string;
    wpKsNormalizedUDifference: string;
    physicalConeViolation: string;
  }>;
  limits: Readonly<{
    directVsV520ComponentRelative: string;
    linearFractionResidual: string;
    evpaReconstructionDeg: string;
    wpKsEvpaDifferenceDeg: string;
    wpKsNormalizedStokesDifference: string;
    physicalConeViolation: string;
  }>;
  rows: readonly KerrFixedBandStokesOracleRowV521[];
  qualification: Readonly<{
    directFrequencyDomainIntegrationQualified: true;
    energyIquQualified: true;
    photonIquQualified: true;
    componentwiseUncertaintyEnvelopeQualified: true;
    independentTransportPathsQualified: true;
    crossLanguageCanonicalShaQualified: true;
    modelPredictionQualified: true;
    measuredPolarimetryQualified: false;
  }>;
  uncertaintyPolicy: Readonly<{
    componentwiseOnly: true;
    crossChannelIndependenceProven: false;
    rssApplied: false;
    scalarTotalAvailable: false;
    correlationModelAvailable: false;
    combination: "componentwise-linear-envelope-no-rss-no-scalar-total";
  }>;
  boundary: Readonly<{
    modelPredictionOnly: true;
    measuredPolarimeterAvailable: false;
    measuredMuellerCalibrationAvailable: false;
    circularPolarizationAvailable: false;
    faradayRotationAvailable: false;
    detectorThroughputAvailable: false;
    observedCountsAvailable: false;
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

export type KerrFixedBandStokesOracleSummaryV521 = Pick<
  KerrFixedBandStokesOracleArtifactV521,
  | "version"
  | "status"
  | "source"
  | "model"
  | "oracle"
  | "counts"
  | "maxima"
  | "limits"
  | "qualification"
  | "uncertaintyPolicy"
  | "boundary"
  | "artifactSha256"
>;

export type KerrFixedBandStokesOracleApiV521 = Readonly<{
  version: typeof KERR_FIXED_BAND_STOKES_ORACLE_API_VERSION_V521;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt";
  summary: KerrFixedBandStokesOracleSummaryV521 | null;
}>;

const SHA = /^[a-f0-9]{64}$/;
const DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "payloadSha256",
  "evidenceSha256",
  "pointerSha256",
  "stageChainSha256",
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
export const canonicalKerrFixedBandStokesOracleV521 = (value: unknown) =>
  JSON.stringify(canonicalize(value));
const validDecimal = (value: unknown) =>
  typeof value === "string" && DECIMAL.test(value) && Number.isFinite(Number(value));
const below = (value: unknown, limit: unknown) =>
  validDecimal(value) && validDecimal(limit) && Number(value) < Number(limit);

function validateCore(value: Partial<KerrFixedBandStokesOracleArtifactV521>) {
  const directMaxima = [
    value.maxima?.directVsV520EnergyIRelative,
    value.maxima?.directVsV520EnergyQRelative,
    value.maxima?.directVsV520EnergyURelative,
    value.maxima?.directVsV520PhotonIRelative,
    value.maxima?.directVsV520PhotonQRelative,
    value.maxima?.directVsV520PhotonURelative,
  ];
  return (
    value.version === KERR_FIXED_BAND_STOKES_ORACLE_VERSION_V521 &&
    value.status === "direct-fixed-band-stokes-multiprecision-oracle-qualified-24-rows" &&
    Boolean(value.source) &&
    Object.values(value.source ?? {}).every((entry) => SHA.test(entry)) &&
    value.model?.linearPolarizationFraction === "0.12" &&
    value.model.emittedBasis === "projected-disk-normal" &&
    value.model.circularPolarization === "unavailable-not-modeled" &&
    value.model.faradayRotation === "unavailable-not-modeled" &&
    value.oracle?.backend === "mpmath-1.3.0" &&
    value.oracle.decimalDigits === 80 &&
    value.oracle.integration ===
      "six-independent-adaptive-tanh-sinh-log-frequency-integrals-per-row" &&
    value.oracle.components?.length === 6 &&
    value.oracle.v520IntegratedValuesConsumedAsInputs === false &&
    value.oracle.v520ValuesUsedForComparisonOnly === true &&
    value.oracle.independentTransportPathsPreserved === true &&
    value.oracle.methodValuesAveraged === false &&
    value.counts?.rayCount === 4 &&
    value.counts.bandCount === 3 &&
    value.counts.transportMethodCount === 2 &&
    value.counts.rowCount === 24 &&
    value.counts.directAdaptiveIntegralCount === 144 &&
    value.counts.energyStokesComponentCount === 72 &&
    value.counts.photonStokesComponentCount === 72 &&
    value.counts.componentwiseUncertaintyEnvelopeCount === 24 &&
    value.counts.measuredStokesRowCount === 0 &&
    value.counts.circularStokesRowCount === 0 &&
    value.counts.detectorProjectedRowCount === 0 &&
    value.counts.sciencePixelRowCount === 0 &&
    directMaxima.every((entry) =>
      below(entry, value.limits?.directVsV520ComponentRelative),
    ) &&
    below(value.maxima?.linearFractionResidual, value.limits?.linearFractionResidual) &&
    below(value.maxima?.evpaReconstructionDeg, value.limits?.evpaReconstructionDeg) &&
    below(value.maxima?.wpKsEvpaDifferenceDeg, value.limits?.wpKsEvpaDifferenceDeg) &&
    below(
      value.maxima?.wpKsNormalizedQDifference,
      value.limits?.wpKsNormalizedStokesDifference,
    ) &&
    below(
      value.maxima?.wpKsNormalizedUDifference,
      value.limits?.wpKsNormalizedStokesDifference,
    ) &&
    Number(value.maxima?.physicalConeViolation) === 0 &&
    value.qualification?.directFrequencyDomainIntegrationQualified === true &&
    value.qualification.energyIquQualified === true &&
    value.qualification.photonIquQualified === true &&
    value.qualification.componentwiseUncertaintyEnvelopeQualified === true &&
    value.qualification.independentTransportPathsQualified === true &&
    value.qualification.crossLanguageCanonicalShaQualified === true &&
    value.qualification.modelPredictionQualified === true &&
    value.qualification.measuredPolarimetryQualified === false &&
    value.uncertaintyPolicy?.componentwiseOnly === true &&
    value.uncertaintyPolicy.crossChannelIndependenceProven === false &&
    value.uncertaintyPolicy.rssApplied === false &&
    value.uncertaintyPolicy.scalarTotalAvailable === false &&
    value.uncertaintyPolicy.correlationModelAvailable === false &&
    value.boundary?.modelPredictionOnly === true &&
    value.boundary.measuredPolarimeterAvailable === false &&
    value.boundary.measuredMuellerCalibrationAvailable === false &&
    value.boundary.circularPolarizationAvailable === false &&
    value.boundary.faradayRotationAvailable === false &&
    value.boundary.detectorThroughputAvailable === false &&
    value.boundary.observedCountsAvailable === false &&
    value.boundary.scienceRasterAuthorityAvailable === false &&
    value.boundary.cinematicScienceWritebackAllowed === false &&
    value.boundary.denseCampaignStatus === "incomplete-0-of-49" &&
    value.boundary.browserQualification === "not-run" &&
    value.boundary.formalProductPointer === "v263" &&
    value.boundary.formalDefaultKernel === "legacy-eih-1pn" &&
    SHA.test(value.artifactSha256 ?? "")
  );
}

export function parseKerrFixedBandStokesOracleArtifactV521(
  value: unknown,
): KerrFixedBandStokesOracleArtifactV521 {
  if (!isRecord(value)) throw new Error("v521-oracle-shape");
  const artifact = value as Partial<KerrFixedBandStokesOracleArtifactV521>;
  const expected = new Set(
    [12, 13, 14, 15].flatMap((rayIndex) =>
      ["visible", "euv", "soft-x-ray"].flatMap((bandId) =>
        ["walker-penrose", "independent-ks-parallel-transport"].map(
          (method) => `${rayIndex}:${bandId}:${method}`,
        ),
      ),
    ),
  );
  if (
    !validateCore(artifact) ||
    !Array.isArray(artifact.rows) ||
    artifact.rows.length !== 24 ||
    artifact.rows.some((row) => {
      const key = `${row.rayIndex}:${row.bandId}:${row.transportMethod}`;
      if (!expected.delete(key)) return true;
      const decimals = [
        row.evpaDeg,
        row.linearPolarizationFraction,
        ...Object.values(row.directEnergyStokes).filter((entry) => entry !== "unavailable-not-modeled"),
        ...Object.values(row.directPhotonStokes).filter((entry) => entry !== "unavailable-not-modeled"),
        ...Object.values(row.relativeDifferences),
        ...Object.values(row.residuals),
        row.uncertaintyEnvelope.upstreamEnergyRadiometryRelative,
        row.uncertaintyEnvelope.upstreamPhotonRadiometryRelative,
        row.uncertaintyEnvelope.directIntegrationEnergyRelative,
        row.uncertaintyEnvelope.directIntegrationPhotonRelative,
      ];
      return (
        decimals.some((entry) => !validDecimal(entry)) ||
        Number(row.directEnergyStokes.iWM2Sr) <= 0 ||
        Number(row.directPhotonStokes.iPerSM2Sr) <= 0 ||
        row.directEnergyStokes.v !== "unavailable-not-modeled" ||
        row.directPhotonStokes.v !== "unavailable-not-modeled" ||
        row.uncertaintyEnvelope.crossChannelIndependenceProven !== false ||
        row.uncertaintyEnvelope.rssApplied !== false ||
        row.uncertaintyEnvelope.scalarTotalAvailable !== false ||
        row.applicability !== "model-predicted-direct-fixed-band-linear-stokes-only"
      );
    }) ||
    expected.size !== 0 ||
    !Array.isArray(artifact.sourceManifest) ||
    artifact.sourceManifest.some((entry) => !entry.path || !SHA.test(entry.sha256)) ||
    !SHA.test(artifact.sourceSha256 ?? "")
  ) {
    throw new Error("v521-oracle-boundary");
  }
  return artifact as KerrFixedBandStokesOracleArtifactV521;
}

export function createKerrFixedBandStokesOracleSummaryV521(
  value: unknown,
): KerrFixedBandStokesOracleSummaryV521 {
  const artifact = parseKerrFixedBandStokesOracleArtifactV521(value);
  return Object.freeze({
    version: artifact.version,
    status: artifact.status,
    source: artifact.source,
    model: artifact.model,
    oracle: artifact.oracle,
    counts: artifact.counts,
    maxima: artifact.maxima,
    limits: artifact.limits,
    qualification: artifact.qualification,
    uncertaintyPolicy: artifact.uncertaintyPolicy,
    boundary: artifact.boundary,
    artifactSha256: artifact.artifactSha256,
  });
}

export function parseKerrFixedBandStokesOracleApiV521(
  value: unknown,
): KerrFixedBandStokesOracleApiV521 {
  if (
    !isRecord(value) ||
    value.version !== KERR_FIXED_BAND_STOKES_ORACLE_API_VERSION_V521 ||
    typeof value.available !== "boolean" ||
    !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt"].includes(
      String(value.reason),
    )
  ) {
    throw new Error("v521-api-boundary");
  }
  if (value.available) {
    if (!isRecord(value.summary) || !validateCore(value.summary)) {
      throw new Error("v521-api-summary");
    }
  } else if (value.summary !== null) {
    throw new Error("v521-api-unavailable-summary");
  }
  return value as unknown as KerrFixedBandStokesOracleApiV521;
}

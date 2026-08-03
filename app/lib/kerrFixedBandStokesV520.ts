export const KERR_FIXED_BAND_STOKES_VERSION_V520 =
  "v520-kerr-fixed-band-stokes-payload-v1" as const;
export const KERR_FIXED_BAND_STOKES_API_VERSION_V520 =
  "v520-kerr-fixed-band-stokes-api-v1" as const;

export type KerrFixedBandStokesBandV520 = "visible" | "euv" | "soft-x-ray";
export type KerrFixedBandStokesMethodV520 =
  | "walker-penrose"
  | "independent-ks-parallel-transport";

export type KerrFixedBandStokesRowV520 = Readonly<{
  rayIndex: 12 | 13 | 14 | 15;
  bandId: KerrFixedBandStokesBandV520;
  transportMethod: KerrFixedBandStokesMethodV520;
  evpaDeg: string;
  linearPolarizationFraction: string;
  normalizedQ: string;
  normalizedU: string;
  energyStokes: Readonly<{
    iWM2Sr: string;
    qWM2Sr: string;
    uWM2Sr: string;
    v: "unavailable-not-modeled";
  }>;
  photonStokes: Readonly<{
    iPerSM2Sr: string;
    qPerSM2Sr: string;
    uPerSM2Sr: string;
    v: "unavailable-not-modeled";
  }>;
  residuals: Readonly<{
    linearFractionAbsolute: string;
    evpaReconstructionDeg: string;
    physicalConeViolation: string;
  }>;
  uncertainty: Readonly<{
    radiometryEnergyRelativeDifference: string;
    radiometryPhotonRelativeDifference: string;
    crossChannelIndependenceProven: false;
    rssApplied: false;
  }>;
  applicability: "model-predicted-fixed-band-linear-stokes-only";
}>;

export type KerrFixedBandStokesArtifactV520 = Readonly<{
  version: typeof KERR_FIXED_BAND_STOKES_VERSION_V520;
  generatedAt: string;
  status: "fixed-band-dual-transport-stokes-qualified-24-model-rows";
  source: Readonly<{
    v406ArtifactSha256: string;
    v519ArtifactSha256: string;
    fullShortAuthoritySha256: string;
    geometryEvidenceSha256: string;
    polarizationEvidenceSha256: string;
  }>;
  model: Readonly<{
    linearPolarizationFraction: "0.12";
    emittedBasis: "projected-disk-normal";
    propagation: string;
    circularPolarization: "unavailable-not-modeled";
    faradayRotation: "unavailable-not-modeled";
    bandAssumption: string;
  }>;
  oracle: Readonly<{
    backend: "mpmath-1.3.0";
    decimalDigits: 80;
    stokesFormula: string;
    evpaFormula: string;
    transportMethods: readonly KerrFixedBandStokesMethodV520[];
    independentTransportPathsPreserved: true;
    methodValuesAveraged: false;
  }>;
  counts: Readonly<{
    rayCount: 4;
    bandCount: 3;
    transportMethodCount: 2;
    rowCount: 24;
    energyStokesTripletCount: 24;
    photonStokesTripletCount: 24;
    sourceMonochromaticSampleCount: 24;
    measuredStokesRowCount: 0;
    circularStokesRowCount: 0;
    detectorProjectedRowCount: 0;
    sciencePixelRowCount: 0;
  }>;
  maxima: Readonly<{
    sourceFrequencyEvpaVariationDeg: string;
    linearFractionResidual: string;
    evpaReconstructionDeg: string;
    wpKsEvpaDifferenceDeg: string;
    wpKsNormalizedQDifference: string;
    wpKsNormalizedUDifference: string;
    physicalConeViolation: string;
  }>;
  limits: Readonly<{
    linearFractionResidual: string;
    evpaReconstructionDeg: string;
    wpKsEvpaDifferenceDeg: string;
    wpKsNormalizedStokesDifference: string;
    physicalConeViolation: string;
  }>;
  rows: readonly KerrFixedBandStokesRowV520[];
  qualification: Readonly<{
    fixedBandEnergyStokesQualified: true;
    fixedBandPhotonStokesQualified: true;
    walkerPenrosePathQualified: true;
    independentKsParallelTransportPathQualified: true;
    physicalPolarizationConeQualified: true;
    modelPredictionQualified: true;
    measuredPolarimetryQualified: false;
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

export type KerrFixedBandStokesSummaryV520 = Pick<
  KerrFixedBandStokesArtifactV520,
  | "version"
  | "status"
  | "source"
  | "model"
  | "oracle"
  | "counts"
  | "maxima"
  | "limits"
  | "qualification"
  | "boundary"
  | "artifactSha256"
>;

export type KerrFixedBandStokesApiV520 = Readonly<{
  version: typeof KERR_FIXED_BAND_STOKES_API_VERSION_V520;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt";
  summary: KerrFixedBandStokesSummaryV520 | null;
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
export const canonicalKerrFixedBandStokesV520 = (value: unknown) =>
  JSON.stringify(canonicalize(value));
const validDecimal = (value: unknown) =>
  typeof value === "string" && DECIMAL.test(value) && Number.isFinite(Number(value));
const below = (value: unknown, limit: unknown) =>
  validDecimal(value) && validDecimal(limit) && Number(value) < Number(limit);

function validateCore(value: Partial<KerrFixedBandStokesArtifactV520>) {
  return (
    value.version === KERR_FIXED_BAND_STOKES_VERSION_V520 &&
    value.status === "fixed-band-dual-transport-stokes-qualified-24-model-rows" &&
    Boolean(value.source) &&
    Object.values(value.source ?? {}).every((entry) => SHA.test(entry)) &&
    value.model?.linearPolarizationFraction === "0.12" &&
    value.model.emittedBasis === "projected-disk-normal" &&
    value.model.circularPolarization === "unavailable-not-modeled" &&
    value.model.faradayRotation === "unavailable-not-modeled" &&
    value.oracle?.backend === "mpmath-1.3.0" &&
    value.oracle.decimalDigits === 80 &&
    value.oracle.independentTransportPathsPreserved === true &&
    value.oracle.methodValuesAveraged === false &&
    value.oracle.transportMethods?.length === 2 &&
    new Set(value.oracle.transportMethods).size === 2 &&
    value.counts?.rayCount === 4 &&
    value.counts.bandCount === 3 &&
    value.counts.transportMethodCount === 2 &&
    value.counts.rowCount === 24 &&
    value.counts.energyStokesTripletCount === 24 &&
    value.counts.photonStokesTripletCount === 24 &&
    value.counts.sourceMonochromaticSampleCount === 24 &&
    value.counts.measuredStokesRowCount === 0 &&
    value.counts.circularStokesRowCount === 0 &&
    value.counts.detectorProjectedRowCount === 0 &&
    value.counts.sciencePixelRowCount === 0 &&
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
    Number(value.limits?.physicalConeViolation) === 0 &&
    value.qualification?.fixedBandEnergyStokesQualified === true &&
    value.qualification.fixedBandPhotonStokesQualified === true &&
    value.qualification.walkerPenrosePathQualified === true &&
    value.qualification.independentKsParallelTransportPathQualified === true &&
    value.qualification.physicalPolarizationConeQualified === true &&
    value.qualification.modelPredictionQualified === true &&
    value.qualification.measuredPolarimetryQualified === false &&
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

export function parseKerrFixedBandStokesArtifactV520(
  value: unknown,
): KerrFixedBandStokesArtifactV520 {
  if (!isRecord(value)) throw new Error("v520-stokes-shape");
  const artifact = value as Partial<KerrFixedBandStokesArtifactV520>;
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
        row.normalizedQ,
        row.normalizedU,
        row.energyStokes.iWM2Sr,
        row.energyStokes.qWM2Sr,
        row.energyStokes.uWM2Sr,
        row.photonStokes.iPerSM2Sr,
        row.photonStokes.qPerSM2Sr,
        row.photonStokes.uPerSM2Sr,
        row.residuals.linearFractionAbsolute,
        row.residuals.evpaReconstructionDeg,
        row.residuals.physicalConeViolation,
        row.uncertainty.radiometryEnergyRelativeDifference,
        row.uncertainty.radiometryPhotonRelativeDifference,
      ];
      return (
        decimals.some((entry) => !validDecimal(entry)) ||
        Number(row.energyStokes.iWM2Sr) <= 0 ||
        Number(row.photonStokes.iPerSM2Sr) <= 0 ||
        row.linearPolarizationFraction !== "0.12" ||
        row.energyStokes.v !== "unavailable-not-modeled" ||
        row.photonStokes.v !== "unavailable-not-modeled" ||
        row.uncertainty.crossChannelIndependenceProven !== false ||
        row.uncertainty.rssApplied !== false ||
        row.applicability !== "model-predicted-fixed-band-linear-stokes-only"
      );
    }) ||
    expected.size !== 0 ||
    !Array.isArray(artifact.sourceManifest) ||
    artifact.sourceManifest.some((entry) => !entry.path || !SHA.test(entry.sha256)) ||
    !SHA.test(artifact.sourceSha256 ?? "")
  ) {
    throw new Error("v520-stokes-boundary");
  }
  return artifact as KerrFixedBandStokesArtifactV520;
}

export function createKerrFixedBandStokesSummaryV520(
  value: unknown,
): KerrFixedBandStokesSummaryV520 {
  const artifact = parseKerrFixedBandStokesArtifactV520(value);
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
    boundary: artifact.boundary,
    artifactSha256: artifact.artifactSha256,
  });
}

export function parseKerrFixedBandStokesApiV520(
  value: unknown,
): KerrFixedBandStokesApiV520 {
  if (
    !isRecord(value) ||
    value.version !== KERR_FIXED_BAND_STOKES_API_VERSION_V520 ||
    typeof value.available !== "boolean" ||
    !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt"].includes(
      String(value.reason),
    )
  ) {
    throw new Error("v520-api-boundary");
  }
  if (value.available) {
    if (!isRecord(value.summary) || !validateCore(value.summary)) {
      throw new Error("v520-api-summary");
    }
  } else if (value.summary !== null) {
    throw new Error("v520-api-unavailable-summary");
  }
  return value as unknown as KerrFixedBandStokesApiV520;
}

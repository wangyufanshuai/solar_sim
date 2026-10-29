export const KERR_POLARIZATION_FREQUENCY_SENSITIVITY_VERSION_V522 =
  "v522-kerr-polarization-frequency-sensitivity-envelope-v1" as const;
export const KERR_POLARIZATION_FREQUENCY_SENSITIVITY_API_VERSION_V522 =
  "v522-kerr-polarization-frequency-sensitivity-envelope-api-v1" as const;

type MethodV522 = "walker-penrose" | "independent-ks-parallel-transport";
type BandV522 = "visible" | "euv" | "soft-x-ray";

export type KerrPolarizationSensitivityScenarioV522 = Readonly<{
  scenarioId: string;
  fractionSlopePerNormalizedLogFrequency: string;
  evpaTwistDegPerNormalizedLogFrequency: string;
  baseline: boolean;
}>;

export type KerrPolarizationSensitivityRowV522 = Readonly<{
  rayIndex: 12 | 13 | 14 | 15;
  bandId: BandV522;
  transportMethod: MethodV522;
  scenarioId: string;
  fractionSlopePerNormalizedLogFrequency: string;
  evpaTwistDegPerNormalizedLogFrequency: string;
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
  observedEnergy: Readonly<{
    linearFraction: string;
    evpaDeg: string;
    evpaShiftFromBaselineDeg: string;
    normalizedQShiftFromBaseline: string;
    normalizedUShiftFromBaseline: string;
  }>;
  observedPhoton: Readonly<{
    linearFraction: string;
    evpaDeg: string;
    evpaShiftFromBaselineDeg: string;
    normalizedQShiftFromBaseline: string;
    normalizedUShiftFromBaseline: string;
  }>;
  baselineRelativeDifferences: Readonly<Record<string, string>>;
  physicalConeViolation: string;
  applicability: "deterministic-model-sensitivity-stress-test-only";
}>;

export type KerrPolarizationSensitivityEnvelopeRowV522 = Readonly<{
  rayIndex: 12 | 13 | 14 | 15;
  bandId: BandV522;
  transportMethod: MethodV522;
  scenarioCount: 9;
  energyLinearFractionMin: string;
  energyLinearFractionMax: string;
  photonLinearFractionMin: string;
  photonLinearFractionMax: string;
  maximumEnergyEvpaShiftDeg: string;
  maximumPhotonEvpaShiftDeg: string;
  maximumEnergyNormalizedQShift: string;
  maximumEnergyNormalizedUShift: string;
  maximumPhotonNormalizedQShift: string;
  maximumPhotonNormalizedUShift: string;
  combination: "envelope-only-no-probability-no-rss-no-scalar-total";
}>;

export type KerrPolarizationFrequencySensitivityArtifactV522 = Readonly<{
  version: typeof KERR_POLARIZATION_FREQUENCY_SENSITIVITY_VERSION_V522;
  generatedAt: string;
  status: "frequency-dependent-polarization-sensitivity-envelope-qualified-not-physical-prior";
  source: Readonly<{
    v320ArtifactSha256: string;
    v406ArtifactSha256: string;
    v521ArtifactSha256: string;
    fullShortAuthoritySha256: string;
  }>;
  model: Readonly<{
    baselineLinearPolarizationFraction: "0.12";
    frequencyCoordinate: string;
    fractionLaw: string;
    evpaLaw: string;
    fractionSlopeGrid: readonly string[];
    evpaTwistDegGrid: readonly string[];
    perturbationCalibration: "unavailable";
    physicalPrior: "unavailable";
    stressTestOnly: true;
  }>;
  scenarioPlan: readonly KerrPolarizationSensitivityScenarioV522[];
  scenarioPlanSha256: string;
  oracle: Readonly<{
    backend: "mpmath-1.3.0";
    decimalDigits: 80;
    integration: "adaptive-tanh-sinh-log-frequency";
    "intensityIntegralsSharedOnlyWhen-Mathematically-Identical": true;
    transportMethodsKeptSeparate: true;
    randomnessUsed: false;
  }>;
  counts: Readonly<{
    rayCount: 4;
    bandCount: 3;
    transportMethodCount: 2;
    scenarioCount: 9;
    scenarioRowCount: 216;
    envelopeRowCount: 24;
    directAdaptiveIntegralCount: 888;
    measuredStokesRowCount: 0;
    circularStokesRowCount: 0;
    detectorProjectedRowCount: 0;
    sciencePixelRowCount: 0;
  }>;
  maxima: Readonly<{
    baselineVsV521EnergyIRelative: string;
    baselineVsV521EnergyQRelative: string;
    baselineVsV521EnergyURelative: string;
    baselineVsV521PhotonIRelative: string;
    baselineVsV521PhotonQRelative: string;
    baselineVsV521PhotonURelative: string;
    energyLinearFraction: string;
    photonLinearFraction: string;
    energyEvpaShiftDeg: string;
    photonEvpaShiftDeg: string;
    normalizedQShift: string;
    normalizedUShift: string;
    physicalConeViolation: string;
  }>;
  limits: Readonly<{
    baselineVsV521ComponentRelative: string;
    linearFraction: string;
    evpaShiftDeg: string;
    physicalConeViolation: string;
  }>;
  scenarioRows: readonly KerrPolarizationSensitivityRowV522[];
  envelopes: readonly KerrPolarizationSensitivityEnvelopeRowV522[];
  qualification: Readonly<{
    deterministicScenarioGridQualified: true;
    baselineReconstructionQualified: true;
    frequencySensitivityEnvelopeQualified: true;
    physicalPolarizationConeQualified: true;
    crossLanguageCanonicalShaQualified: true;
    physicalPriorQualified: false;
    measuredPolarimetryQualified: false;
    scienceAuthorityPromotionAllowed: false;
  }>;
  uncertaintyPolicy: Readonly<{
    modelSensitivityOnly: true;
    probabilityDistributionAvailable: false;
    crossScenarioIndependenceProven: false;
    rssApplied: false;
    scalarTotalAvailable: false;
    combinationWithNumericalUncertaintyAllowed: false;
    combination: "envelope-only-no-probability-no-rss-no-scalar-total";
  }>;
  boundary: Readonly<{
    modelStressTestOnly: true;
    physicalPriorAvailable: false;
    perturbationCalibrationAvailable: false;
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

export type KerrPolarizationFrequencySensitivitySummaryV522 = Pick<
  KerrPolarizationFrequencySensitivityArtifactV522,
  | "version"
  | "status"
  | "source"
  | "model"
  | "scenarioPlan"
  | "scenarioPlanSha256"
  | "oracle"
  | "counts"
  | "maxima"
  | "limits"
  | "qualification"
  | "uncertaintyPolicy"
  | "boundary"
  | "artifactSha256"
>;

export type KerrPolarizationFrequencySensitivityApiV522 = Readonly<{
  version: typeof KERR_POLARIZATION_FREQUENCY_SENSITIVITY_API_VERSION_V522;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt";
  summary: KerrPolarizationFrequencySensitivitySummaryV522 | null;
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
export const canonicalKerrPolarizationFrequencySensitivityV522 = (value: unknown) =>
  JSON.stringify(canonicalize(value));
const validDecimal = (value: unknown) =>
  typeof value === "string" && DECIMAL.test(value) && Number.isFinite(Number(value));
const below = (value: unknown, limit: unknown) =>
  validDecimal(value) && validDecimal(limit) && Number(value) < Number(limit);
const atMost = (value: unknown, limit: unknown) =>
  validDecimal(value) && validDecimal(limit) && Number(value) <= Number(limit);

function validateCore(value: Partial<KerrPolarizationFrequencySensitivityArtifactV522>) {
  const baselineMaxima = [
    value.maxima?.baselineVsV521EnergyIRelative,
    value.maxima?.baselineVsV521EnergyQRelative,
    value.maxima?.baselineVsV521EnergyURelative,
    value.maxima?.baselineVsV521PhotonIRelative,
    value.maxima?.baselineVsV521PhotonQRelative,
    value.maxima?.baselineVsV521PhotonURelative,
  ];
  return (
    value.version === KERR_POLARIZATION_FREQUENCY_SENSITIVITY_VERSION_V522 &&
    value.status ===
      "frequency-dependent-polarization-sensitivity-envelope-qualified-not-physical-prior" &&
    Boolean(value.source) &&
    Object.values(value.source ?? {}).every((entry) => SHA.test(entry)) &&
    value.model?.baselineLinearPolarizationFraction === "0.12" &&
    value.model.fractionSlopeGrid?.length === 3 &&
    value.model.evpaTwistDegGrid?.length === 3 &&
    value.model.perturbationCalibration === "unavailable" &&
    value.model.physicalPrior === "unavailable" &&
    value.model.stressTestOnly === true &&
    Array.isArray(value.scenarioPlan) &&
    value.scenarioPlan.length === 9 &&
    SHA.test(value.scenarioPlanSha256 ?? "") &&
    value.oracle?.backend === "mpmath-1.3.0" &&
    value.oracle.decimalDigits === 80 &&
    value.oracle.integration === "adaptive-tanh-sinh-log-frequency" &&
    value.oracle["intensityIntegralsSharedOnlyWhen-Mathematically-Identical"] === true &&
    value.oracle.transportMethodsKeptSeparate === true &&
    value.oracle.randomnessUsed === false &&
    value.counts?.rayCount === 4 &&
    value.counts.bandCount === 3 &&
    value.counts.transportMethodCount === 2 &&
    value.counts.scenarioCount === 9 &&
    value.counts.scenarioRowCount === 216 &&
    value.counts.envelopeRowCount === 24 &&
    value.counts.directAdaptiveIntegralCount === 888 &&
    value.counts.measuredStokesRowCount === 0 &&
    value.counts.circularStokesRowCount === 0 &&
    value.counts.detectorProjectedRowCount === 0 &&
    value.counts.sciencePixelRowCount === 0 &&
    baselineMaxima.every((entry) =>
      below(entry, value.limits?.baselineVsV521ComponentRelative),
    ) &&
    atMost(value.maxima?.energyLinearFraction, value.limits?.linearFraction) &&
    atMost(value.maxima?.photonLinearFraction, value.limits?.linearFraction) &&
    atMost(value.maxima?.energyEvpaShiftDeg, value.limits?.evpaShiftDeg) &&
    atMost(value.maxima?.photonEvpaShiftDeg, value.limits?.evpaShiftDeg) &&
    Number(value.maxima?.physicalConeViolation) === 0 &&
    value.qualification?.deterministicScenarioGridQualified === true &&
    value.qualification.baselineReconstructionQualified === true &&
    value.qualification.frequencySensitivityEnvelopeQualified === true &&
    value.qualification.physicalPolarizationConeQualified === true &&
    value.qualification.crossLanguageCanonicalShaQualified === true &&
    value.qualification.physicalPriorQualified === false &&
    value.qualification.measuredPolarimetryQualified === false &&
    value.qualification.scienceAuthorityPromotionAllowed === false &&
    value.uncertaintyPolicy?.modelSensitivityOnly === true &&
    value.uncertaintyPolicy.probabilityDistributionAvailable === false &&
    value.uncertaintyPolicy.crossScenarioIndependenceProven === false &&
    value.uncertaintyPolicy.rssApplied === false &&
    value.uncertaintyPolicy.scalarTotalAvailable === false &&
    value.uncertaintyPolicy.combinationWithNumericalUncertaintyAllowed === false &&
    value.boundary?.modelStressTestOnly === true &&
    value.boundary.physicalPriorAvailable === false &&
    value.boundary.perturbationCalibrationAvailable === false &&
    value.boundary.measuredPolarimeterAvailable === false &&
    value.boundary.measuredMuellerCalibrationAvailable === false &&
    value.boundary.scienceRasterAuthorityAvailable === false &&
    value.boundary.cinematicScienceWritebackAllowed === false &&
    value.boundary.denseCampaignStatus === "incomplete-0-of-49" &&
    value.boundary.browserQualification === "not-run" &&
    value.boundary.formalProductPointer === "v263" &&
    value.boundary.formalDefaultKernel === "legacy-eih-1pn" &&
    SHA.test(value.artifactSha256 ?? "")
  );
}

export function parseKerrPolarizationFrequencySensitivityArtifactV522(
  value: unknown,
): KerrPolarizationFrequencySensitivityArtifactV522 {
  if (!isRecord(value)) throw new Error("v522-sensitivity-shape");
  const artifact = value as Partial<KerrPolarizationFrequencySensitivityArtifactV522>;
  const scenarioIds = new Set<string>();
  const baselineIds = new Set<string>();
  for (const scenario of artifact.scenarioPlan ?? []) {
    if (
      !scenario.scenarioId ||
      scenarioIds.has(scenario.scenarioId) ||
      !validDecimal(scenario.fractionSlopePerNormalizedLogFrequency) ||
      !validDecimal(scenario.evpaTwistDegPerNormalizedLogFrequency)
    ) {
      throw new Error("v522-scenario-plan");
    }
    scenarioIds.add(scenario.scenarioId);
    if (scenario.baseline) baselineIds.add(scenario.scenarioId);
  }
  const expectedRows = new Set(
    [12, 13, 14, 15].flatMap((rayIndex) =>
      ["visible", "euv", "soft-x-ray"].flatMap((bandId) =>
        ["walker-penrose", "independent-ks-parallel-transport"].flatMap((method) =>
          [...scenarioIds].map((scenarioId) => `${rayIndex}:${bandId}:${method}:${scenarioId}`),
        ),
      ),
    ),
  );
  const expectedEnvelopes = new Set(
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
    scenarioIds.size !== 9 ||
    baselineIds.size !== 1 ||
    !Array.isArray(artifact.scenarioRows) ||
    artifact.scenarioRows.length !== 216 ||
    artifact.scenarioRows.some((row) => {
      const key = `${row.rayIndex}:${row.bandId}:${row.transportMethod}:${row.scenarioId}`;
      if (!expectedRows.delete(key)) return true;
      const numericValues = [
        row.fractionSlopePerNormalizedLogFrequency,
        row.evpaTwistDegPerNormalizedLogFrequency,
        row.directEnergyStokes.iWM2Sr,
        row.directEnergyStokes.qWM2Sr,
        row.directEnergyStokes.uWM2Sr,
        row.directPhotonStokes.iPerSM2Sr,
        row.directPhotonStokes.qPerSM2Sr,
        row.directPhotonStokes.uPerSM2Sr,
        ...Object.values(row.observedEnergy),
        ...Object.values(row.observedPhoton),
        row.physicalConeViolation,
      ];
      return (
        numericValues.some((entry) => !validDecimal(entry)) ||
        Number(row.directEnergyStokes.iWM2Sr) <= 0 ||
        Number(row.directPhotonStokes.iPerSM2Sr) <= 0 ||
        row.directEnergyStokes.v !== "unavailable-not-modeled" ||
        row.directPhotonStokes.v !== "unavailable-not-modeled" ||
        row.applicability !== "deterministic-model-sensitivity-stress-test-only"
      );
    }) ||
    expectedRows.size !== 0 ||
    !Array.isArray(artifact.envelopes) ||
    artifact.envelopes.length !== 24 ||
    artifact.envelopes.some((row) => {
      const key = `${row.rayIndex}:${row.bandId}:${row.transportMethod}`;
      if (!expectedEnvelopes.delete(key)) return true;
      return (
        row.scenarioCount !== 9 ||
        row.combination !== "envelope-only-no-probability-no-rss-no-scalar-total" ||
        Object.entries(row).some(
          ([field, entry]) =>
            !["rayIndex", "bandId", "transportMethod", "scenarioCount", "combination"].includes(
              field,
            ) && !validDecimal(entry),
        )
      );
    }) ||
    expectedEnvelopes.size !== 0 ||
    !Array.isArray(artifact.sourceManifest) ||
    artifact.sourceManifest.some((entry) => !entry.path || !SHA.test(entry.sha256)) ||
    !SHA.test(artifact.sourceSha256 ?? "")
  ) {
    throw new Error("v522-sensitivity-boundary");
  }
  return artifact as KerrPolarizationFrequencySensitivityArtifactV522;
}

export function createKerrPolarizationFrequencySensitivitySummaryV522(
  value: unknown,
): KerrPolarizationFrequencySensitivitySummaryV522 {
  const artifact = parseKerrPolarizationFrequencySensitivityArtifactV522(value);
  return Object.freeze({
    version: artifact.version,
    status: artifact.status,
    source: artifact.source,
    model: artifact.model,
    scenarioPlan: artifact.scenarioPlan,
    scenarioPlanSha256: artifact.scenarioPlanSha256,
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

export function parseKerrPolarizationFrequencySensitivityApiV522(
  value: unknown,
): KerrPolarizationFrequencySensitivityApiV522 {
  if (
    !isRecord(value) ||
    value.version !== KERR_POLARIZATION_FREQUENCY_SENSITIVITY_API_VERSION_V522 ||
    typeof value.available !== "boolean" ||
    !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt"].includes(
      String(value.reason),
    )
  ) {
    throw new Error("v522-api-boundary");
  }
  if (value.available) {
    if (!isRecord(value.summary) || !validateCore(value.summary)) {
      throw new Error("v522-api-summary");
    }
  } else if (value.summary !== null) {
    throw new Error("v522-api-unavailable-summary");
  }
  return value as unknown as KerrPolarizationFrequencySensitivityApiV522;
}

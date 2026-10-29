export const KERR_COST_LAW_ROBUSTNESS_VERSION_V529 =
  "v529-kerr-cost-law-robustness-envelope-v1" as const;
export const KERR_COST_LAW_ROBUSTNESS_API_VERSION_V529 =
  "v529-kerr-cost-law-robustness-api-v1" as const;
export const KERR_COST_LAW_HUD_PROFILE_ID_V529 = "science-cinematic-v7r8-v529" as const;

export type KerrCostLawHudModeV529 = "science" | "cinematic";
export type KerrCostLawDisplayRowV529 = Readonly<{
  sourceIndex: number;
  precisionExponent: string;
  calibrationToScienceCostWeight: string;
  systematicFloorFraction: string;
  fixedNormalizedOverhead: string;
  scienceFractionOfRandomBudget: string;
  minimumNormalizedCost: string;
}>;
export type KerrCostLawDisplayGeometryV529 = Readonly<{
  stochasticExponentRatioSurface: readonly KerrCostLawDisplayRowV529[];
  deterministicExponentRatioSurface: readonly KerrCostLawDisplayRowV529[];
  stochasticFloorEnvelope: readonly KerrCostLawDisplayRowV529[];
  deterministicFloorEnvelope: readonly KerrCostLawDisplayRowV529[];
  stochasticOverheadTranslation: readonly KerrCostLawDisplayRowV529[];
  deterministicOverheadTranslation: readonly KerrCostLawDisplayRowV529[];
  scientificGeometryInputCount: 68;
}>;
export type KerrCostLawSampleV529 = Readonly<{
  index: number;
  family: "stochastic-variance" | "deterministic-bound";
  precisionExponent: string;
  calibrationToScienceCostWeight: string;
  systematicVarianceFraction?: string;
  systematicBoundFraction?: string;
  fixedNormalizedOverhead: string;
  scienceFractionOfRandomBudget: string;
  minimumNormalizedCost: string;
  precisionExponentMeasured: false;
  systematicFloorMeasured: false;
  fixedOverheadMeasured: false;
  recommended: false;
}>;
export type KerrCostLawRobustnessArtifactV529 = Readonly<{
  version: typeof KERR_COST_LAW_ROBUSTNESS_VERSION_V529;
  generatedAt: string;
  status: "parametric-cost-law-robustness-qualified-operational-model-unavailable";
  source: Readonly<Record<string, string>>;
  oracle: Readonly<{
    backend: "mpmath-1.3.0";
    decimalDigits: 160;
    analyticConstrainedOptimum: true;
    independentGoldenSectionIterationsPerCell: 512;
    randomnessUsed: false;
  }>;
  parameterGrid: Readonly<{
    precisionExponents: readonly string[];
    calibrationToScienceCostWeights: readonly string[];
    systematicFloorFractions: readonly string[];
    fixedNormalizedOverheads: readonly string[];
    precisionExponentMeasured: false;
    costWeightMeasured: false;
    systematicFloorMeasured: false;
    fixedOverheadMeasured: false;
  }>;
  costLaw: Readonly<{
    stochasticEquation: string;
    deterministicEquation: string;
    fixedOverheadAllocationIndependentByDefinition: true;
    fixedOverheadCanShiftOptimum: false;
    systematicFloorReducesAvailableRandomBudget: true;
    acquisitionOverheadCouplingModeled: false;
    stressModelOnlyNotOperationalCost: true;
  }>;
  stochasticRobustness: Readonly<{
    constraint: string;
    sampleCount: 500;
    samples: readonly KerrCostLawSampleV529[];
    selectedSampleIndex: null;
  }>;
  deterministicRobustness: Readonly<{
    constraint: string;
    sampleCount: 500;
    samples: readonly KerrCostLawSampleV529[];
    selectedSampleIndex: null;
  }>;
  displayGeometry: KerrCostLawDisplayGeometryV529;
  robustnessAudits: Readonly<{
    overheadAllocationInvarianceComparisons: 750;
    overheadCostTranslationComparisons: 750;
    floorMonotonicityComparisons: 800;
    equalWeightStochasticSymmetryChecks: 100;
    overheadAllocationInvariant: true;
    overheadCostTranslationExact: true;
    floorCostStrictlyIncreasing: true;
  }>;
  selectionBoundary: Readonly<{
    physicalTargetAvailable: false;
    measuredPrecisionExponentAvailable: false;
    calibrationToScienceCostRatioAvailable: false;
    measuredSystematicFloorAvailable: false;
    measuredAcquisitionOverheadAvailable: false;
    recommendedModelAvailable: false;
    recommendedAllocationAvailable: false;
    automaticSelectionAllowed: false;
    operationalSchedulingAllowed: false;
  }>;
  acquisitionBoundary: Readonly<{
    requiredMeasuredFileCount: 6;
    readyMeasuredFileCount: 0;
    measuredCalibrationRowCount: 0;
    numericalScienceErrorBarsAvailable: false;
    scienceRecoveryExecutable: false;
  }>;
  counts: Readonly<{
    precisionExponentCount: 5;
    costRatioCount: 5;
    systematicFloorCount: 5;
    fixedOverheadCount: 4;
    stochasticRobustnessCellCount: 500;
    deterministicRobustnessCellCount: 500;
    fullFactorialCellCount: 1000;
    optimizerIterationCount: 512000;
    scientificGeometryInputCount: 68;
    measuredCalibrationFileCount: 0;
    requiredMeasuredCalibrationFileCount: 6;
    expectedElectronCountRowCount: 0;
    observedCountRowCount: 0;
    sciencePixelRowCount: 0;
  }>;
  maxima: Readonly<Record<string, string>>;
  limits: Readonly<{ multiprecisionResidual: string }>;
  qualification: Readonly<{
    analyticRobustnessEnvelopeQualified: true;
    independentOptimizerQualified: true;
    overheadInvarianceQualified: true;
    systematicFloorMonotonicityQualified: true;
    parametricRobustnessQualified: true;
    operationalCostModelQualified: false;
    recommendedAllocationQualified: false;
    measuredInstrumentQualified: false;
    scienceAuthorityPromotionAllowed: false;
  }>;
  boundary: Readonly<{
    normalizedStressModelOnly: true;
    physicalNoiseModelAvailable: false;
    physicalCostModelAvailable: false;
    measuredCalibrationAvailable: false;
    expectedElectronCountsAvailable: false;
    observedCountsAvailable: false;
    scienceRasterAuthorityAvailable: false;
    cinematicScienceWritebackAllowed: false;
    networkAttempted: false;
    automaticRetryApplied: false;
    denseCampaignStatus: "incomplete-0-of-49";
    browserQualification: "not-run";
    formalProductPointer: "v263";
    formalDefaultKernel: "legacy-eih-1pn";
  }>;
  sourceManifest: readonly Readonly<{ path: string; sha256: string }>[];
  sourceSha256: string;
  artifactSha256: string;
}>;
export type KerrCostLawRobustnessSummaryV529 = Omit<
  KerrCostLawRobustnessArtifactV529,
  "generatedAt" | "stochasticRobustness" | "deterministicRobustness" | "sourceManifest" | "sourceSha256"
>;
export type KerrCostLawRobustnessApiV529 = Readonly<{
  version: typeof KERR_COST_LAW_ROBUSTNESS_API_VERSION_V529;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt";
  summary: KerrCostLawRobustnessSummaryV529 | null;
}>;
export type KerrCostLawHudProfileV529 = Readonly<{
  id: typeof KERR_COST_LAW_HUD_PROFILE_ID_V529;
  mode: KerrCostLawHudModeV529;
  localShadowOnly: true;
  defaultApplied: false;
  panel: string;
  panelRaised: string;
  ink: string;
  muted: string;
  grid: string;
  stochastic: string;
  deterministic: string;
  floor: string;
  overhead: string;
  unavailable: string;
  railOpacity: number;
  curveGlowOpacity: number;
  scienceBoundary: Readonly<{
    linearDisplay: boolean;
    bloomIntensity: number;
    colorGradeIntensity: number;
    numericScientificStyleInputCount: 0;
    exponentDrivesStyle: false;
    floorDrivesStyle: false;
    overheadDrivesStyle: false;
    scientificFieldMutation: false;
  }>;
  cinematicSeed: string | null;
}>;

const scienceProfile: KerrCostLawHudProfileV529 = Object.freeze({
  id: KERR_COST_LAW_HUD_PROFILE_ID_V529,
  mode: "science",
  localShadowOnly: true,
  defaultApplied: false,
  panel: "#02070b",
  panelRaised: "#061217",
  ink: "#e6fbff",
  muted: "#76939c",
  grid: "rgba(105,226,239,.07)",
  stochastic: "#79ddff",
  deterministic: "#ffca80",
  floor: "#c2a3ff",
  overhead: "#7ff0c5",
  unavailable: "#ff8eaa",
  railOpacity: 0.62,
  curveGlowOpacity: 0,
  scienceBoundary: Object.freeze({
    linearDisplay: true,
    bloomIntensity: 0,
    colorGradeIntensity: 0,
    numericScientificStyleInputCount: 0,
    exponentDrivesStyle: false,
    floorDrivesStyle: false,
    overheadDrivesStyle: false,
    scientificFieldMutation: false,
  }),
  cinematicSeed: null,
});
const cinematicProfile: KerrCostLawHudProfileV529 = Object.freeze({
  id: KERR_COST_LAW_HUD_PROFILE_ID_V529,
  mode: "cinematic",
  localShadowOnly: true,
  defaultApplied: false,
  panel: "#100908",
  panelRaised: "#1b1210",
  ink: "#fff4dd",
  muted: "#ae927b",
  grid: "rgba(255,195,112,.065)",
  stochastic: "#8ee4ff",
  deterministic: "#ffb96c",
  floor: "#d0b0ff",
  overhead: "#8af0c9",
  unavailable: "#ff8eb2",
  railOpacity: 0.43,
  curveGlowOpacity: 0.2,
  scienceBoundary: Object.freeze({
    linearDisplay: false,
    bloomIntensity: 0.08,
    colorGradeIntensity: 0.055,
    numericScientificStyleInputCount: 0,
    exponentDrivesStyle: false,
    floorDrivesStyle: false,
    overheadDrivesStyle: false,
    scientificFieldMutation: false,
  }),
  cinematicSeed: "orbit-atlas-v529-cost-law-robustness-hud-seed-01",
});
export const resolveKerrCostLawHudProfileV529 = (mode: KerrCostLawHudModeV529) =>
  mode === "science" ? scienceProfile : cinematicProfile;

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
const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !isRecord(value)
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => !transient.has(key))
            .sort(([a], [b]) => compare(a, b))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
export const canonicalKerrCostLawRobustnessV529 = (value: unknown) =>
  JSON.stringify(canonicalize(value));
const validDecimal = (value: unknown) =>
  typeof value === "string" && DECIMAL.test(value) && Number.isFinite(Number(value));
const displayArrays = (value: Partial<KerrCostLawDisplayGeometryV529>) => [
  value.stochasticExponentRatioSurface,
  value.deterministicExponentRatioSurface,
  value.stochasticFloorEnvelope,
  value.deterministicFloorEnvelope,
  value.stochasticOverheadTranslation,
  value.deterministicOverheadTranslation,
];
function validDisplayGeometry(value: unknown): value is KerrCostLawDisplayGeometryV529 {
  if (!isRecord(value) || value.scientificGeometryInputCount !== 68) return false;
  const arrays = displayArrays(value as Partial<KerrCostLawDisplayGeometryV529>);
  return (
    arrays.every(Array.isArray) &&
    arrays.reduce<number>((sum, rows) => sum + (rows?.length ?? 0), 0) === 68 &&
    arrays.every((rows) =>
      rows?.every(
        (row) =>
          Number.isInteger(row.sourceIndex) &&
          validDecimal(row.precisionExponent) &&
          validDecimal(row.calibrationToScienceCostWeight) &&
          validDecimal(row.systematicFloorFraction) &&
          validDecimal(row.fixedNormalizedOverhead) &&
          validDecimal(row.scienceFractionOfRandomBudget) &&
          validDecimal(row.minimumNormalizedCost),
      ),
    )
  );
}
function validateCore(value: Partial<KerrCostLawRobustnessArtifactV529>) {
  return (
    value.version === KERR_COST_LAW_ROBUSTNESS_VERSION_V529 &&
    value.status === "parametric-cost-law-robustness-qualified-operational-model-unavailable" &&
    Object.values(value.source ?? {}).length === 4 &&
    Object.values(value.source ?? {}).every((entry) => SHA.test(entry)) &&
    value.oracle?.decimalDigits === 160 &&
    value.oracle.independentGoldenSectionIterationsPerCell === 512 &&
    value.oracle.randomnessUsed === false &&
    value.parameterGrid?.precisionExponents.length === 5 &&
    value.parameterGrid.calibrationToScienceCostWeights.length === 5 &&
    value.parameterGrid.systematicFloorFractions.length === 5 &&
    value.parameterGrid.fixedNormalizedOverheads.length === 4 &&
    value.parameterGrid.precisionExponentMeasured === false &&
    value.costLaw?.stressModelOnlyNotOperationalCost === true &&
    value.costLaw.fixedOverheadCanShiftOptimum === false &&
    validDisplayGeometry(value.displayGeometry) &&
    value.robustnessAudits?.overheadAllocationInvarianceComparisons === 750 &&
    value.robustnessAudits.floorMonotonicityComparisons === 800 &&
    value.robustnessAudits.overheadAllocationInvariant === true &&
    value.selectionBoundary?.recommendedModelAvailable === false &&
    value.selectionBoundary.recommendedAllocationAvailable === false &&
    value.selectionBoundary.operationalSchedulingAllowed === false &&
    value.acquisitionBoundary?.readyMeasuredFileCount === 0 &&
    value.acquisitionBoundary.numericalScienceErrorBarsAvailable === false &&
    value.counts?.fullFactorialCellCount === 1000 &&
    value.counts.optimizerIterationCount === 512000 &&
    value.counts.scientificGeometryInputCount === 68 &&
    Object.values(value.maxima ?? {}).every(
      (entry) => validDecimal(entry) && Number(entry) < Number(value.limits?.multiprecisionResidual),
    ) &&
    value.qualification?.parametricRobustnessQualified === true &&
    value.qualification.operationalCostModelQualified === false &&
    value.qualification.recommendedAllocationQualified === false &&
    value.boundary?.physicalCostModelAvailable === false &&
    value.boundary.denseCampaignStatus === "incomplete-0-of-49" &&
    value.boundary.browserQualification === "not-run" &&
    value.boundary.formalProductPointer === "v263" &&
    value.boundary.formalDefaultKernel === "legacy-eih-1pn" &&
    SHA.test(value.artifactSha256 ?? "")
  );
}
export function parseKerrCostLawRobustnessArtifactV529(
  value: unknown,
): KerrCostLawRobustnessArtifactV529 {
  if (!isRecord(value)) throw new Error("v529-cost-law-shape");
  const artifact = value as Partial<KerrCostLawRobustnessArtifactV529>;
  const samples = [
    artifact.stochasticRobustness?.samples,
    artifact.deterministicRobustness?.samples,
  ];
  if (
    !validateCore(artifact) ||
    artifact.stochasticRobustness?.sampleCount !== 500 ||
    artifact.deterministicRobustness?.sampleCount !== 500 ||
    artifact.stochasticRobustness.selectedSampleIndex !== null ||
    artifact.deterministicRobustness.selectedSampleIndex !== null ||
    samples.some(
      (rows) =>
        !Array.isArray(rows) ||
        rows.length !== 500 ||
        rows.some(
          (row) =>
            !Number.isInteger(row.index) ||
            !validDecimal(row.precisionExponent) ||
            !validDecimal(row.calibrationToScienceCostWeight) ||
            !validDecimal(row.fixedNormalizedOverhead) ||
            !validDecimal(row.scienceFractionOfRandomBudget) ||
            !validDecimal(row.minimumNormalizedCost) ||
            row.recommended !== false,
        ),
    ) ||
    !Array.isArray(artifact.sourceManifest) ||
    artifact.sourceManifest.some((entry) => !entry.path || !SHA.test(entry.sha256)) ||
    !SHA.test(artifact.sourceSha256 ?? "")
  ) {
    throw new Error("v529-cost-law-boundary");
  }
  return artifact as KerrCostLawRobustnessArtifactV529;
}
const freezeRows = (rows: readonly KerrCostLawDisplayRowV529[]) =>
  Object.freeze(rows.map((row) => Object.freeze({ ...row })));
export function createKerrCostLawRobustnessSummaryV529(
  value: unknown,
): KerrCostLawRobustnessSummaryV529 {
  const artifact = parseKerrCostLawRobustnessArtifactV529(value);
  const displayGeometry = Object.freeze({
    stochasticExponentRatioSurface: freezeRows(
      artifact.displayGeometry.stochasticExponentRatioSurface,
    ),
    deterministicExponentRatioSurface: freezeRows(
      artifact.displayGeometry.deterministicExponentRatioSurface,
    ),
    stochasticFloorEnvelope: freezeRows(artifact.displayGeometry.stochasticFloorEnvelope),
    deterministicFloorEnvelope: freezeRows(artifact.displayGeometry.deterministicFloorEnvelope),
    stochasticOverheadTranslation: freezeRows(
      artifact.displayGeometry.stochasticOverheadTranslation,
    ),
    deterministicOverheadTranslation: freezeRows(
      artifact.displayGeometry.deterministicOverheadTranslation,
    ),
    scientificGeometryInputCount: 68 as const,
  });
  return Object.freeze({
    version: artifact.version,
    status: artifact.status,
    source: artifact.source,
    oracle: artifact.oracle,
    parameterGrid: artifact.parameterGrid,
    costLaw: artifact.costLaw,
    displayGeometry,
    robustnessAudits: artifact.robustnessAudits,
    selectionBoundary: artifact.selectionBoundary,
    acquisitionBoundary: artifact.acquisitionBoundary,
    counts: artifact.counts,
    maxima: artifact.maxima,
    limits: artifact.limits,
    qualification: artifact.qualification,
    boundary: artifact.boundary,
    artifactSha256: artifact.artifactSha256,
  });
}
export function parseKerrCostLawRobustnessApiV529(
  value: unknown,
): KerrCostLawRobustnessApiV529 {
  if (
    !isRecord(value) ||
    value.version !== KERR_COST_LAW_ROBUSTNESS_API_VERSION_V529 ||
    typeof value.available !== "boolean" ||
    !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt"].includes(
      String(value.reason),
    )
  ) {
    throw new Error("v529-api-boundary");
  }
  if (value.available) {
    if (!isRecord(value.summary) || !validateCore(value.summary)) {
      throw new Error("v529-api-summary");
    }
  } else if (value.summary !== null) {
    throw new Error("v529-api-unavailable-summary");
  }
  return value as unknown as KerrCostLawRobustnessApiV529;
}
export function createKerrCostLawHudEncodingV529(
  summary: KerrCostLawRobustnessSummaryV529,
  mode: KerrCostLawHudModeV529,
) {
  if (!SHA.test(summary.artifactSha256)) throw new Error("v529-hud-source");
  return Object.freeze({
    version: "v529-kerr-cost-law-hud-encoding-v1" as const,
    profileId: KERR_COST_LAW_HUD_PROFILE_ID_V529,
    mode,
    scientificPayloadKey: summary.artifactSha256,
    scientificGeometry: summary.displayGeometry,
    scientificGeometryInputCount: 68 as const,
    numericScientificStyleInputCount: 0 as const,
    exponentDrivesStyle: false as const,
    floorDrivesStyle: false as const,
    overheadDrivesStyle: false as const,
    scientificFieldMutation: false as const,
  });
}
export function compareKerrCostLawHudEncodingsV529(
  science: ReturnType<typeof createKerrCostLawHudEncodingV529>,
  cinematic: ReturnType<typeof createKerrCostLawHudEncodingV529>,
) {
  if (
    science.mode !== "science" ||
    cinematic.mode !== "cinematic" ||
    science.scientificPayloadKey !== cinematic.scientificPayloadKey ||
    JSON.stringify(science.scientificGeometry) !== JSON.stringify(cinematic.scientificGeometry) ||
    science.scientificGeometryInputCount !== 68 ||
    cinematic.scientificGeometryInputCount !== 68 ||
    science.numericScientificStyleInputCount !== 0 ||
    cinematic.numericScientificStyleInputCount !== 0
  ) {
    throw new Error("v529-hud-boundary");
  }
  return Object.freeze({
    scientificPayloadStable: true as const,
    scientificGeometryStable: true as const,
    scientificGeometryInputCount: 68 as const,
    numericScientificStyleInputCount: 0 as const,
    scientificFieldMutation: false as const,
  });
}

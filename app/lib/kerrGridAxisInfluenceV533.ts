import type { KerrRegretOmissionRowV532 } from "./kerrRegretJackknifeV532";

export const KERR_GRID_AXIS_INFLUENCE_VERSION_V533 = "v533-kerr-grid-axis-influence-atlas-v1" as const;
export const KERR_GRID_AXIS_INFLUENCE_API_VERSION_V533 = "v533-kerr-grid-axis-influence-api-v1" as const;
export const KERR_GRID_AXIS_INFLUENCE_HUD_PROFILE_ID_V533 = "science-cinematic-v8r2-v533" as const;

export type KerrGridAxisV533 =
  | "precision-exponent"
  | "cost-ratio"
  | "systematic-floor"
  | "fixed-overhead";
export type KerrGridAxisInfluenceFamilyNameV533 = "stochastic-variance" | "deterministic-bound";
export type KerrGridAxisInfluenceHudModeV533 = "science" | "cinematic";

export type KerrGridAxisSummaryV533 = Readonly<{
  axisIndex: number;
  axis: KerrGridAxisV533;
  omittedLevelCount: number;
  omissionIndices: readonly number[];
  minimumParetoJaccard: string;
  medianParetoJaccard: string;
  arithmeticMeanParetoJaccard: string;
  minimumAbsoluteRankSpearman: string;
  arithmeticMeanAbsoluteRankSpearman: string;
  minimumRelativeRankSpearman: string;
  arithmeticMeanRelativeRankSpearman: string;
  absoluteWinnerLossCount: number;
  relativeWinnerLossCount: number;
  maximumAbsoluteRankDisplacement: number;
  maximumRelativeRankDisplacement: number;
  axisStableParetoCandidateIndices: readonly number[];
  axisParetoUnionCandidateIndices: readonly number[];
  worstOmissionIndex: number;
  aggregationIsProbability: false;
  singleScoreComputed: false;
  recommended: false;
}>;

export type KerrGridAxisComparisonV533 = Readonly<{
  leftAxis: KerrGridAxisV533;
  rightAxis: KerrGridAxisV533;
  leftDominatesAsMoreDestabilizing: boolean;
  singleMetricRankingUsed: false;
}>;

export type KerrGridAxisInfluenceFamilyV533 = Readonly<{
  family: KerrGridAxisInfluenceFamilyNameV533;
  axisCount: 4;
  axisSummaries: readonly KerrGridAxisSummaryV533[];
  directedMultiMetricComparisonCount: 12;
  axisComparisons: readonly KerrGridAxisComparisonV533[];
  axisDominanceCounts: Readonly<Record<KerrGridAxisV533, number>>;
  singleDominantAxisAvailable: true;
  singleDominantAxis: "cost-ratio";
  singleDominantAxisPromotedToRecommendation: false;
  selectionBoundary: Readonly<{
    metricUtilityAvailable: false;
    axisPriorAvailable: false;
    singleScoreAvailable: false;
    recommendedAxisAvailable: false;
    automaticSelectionAllowed: false;
  }>;
}>;

export type KerrGridAxisInfluenceArtifactV533 = Readonly<{
  version: typeof KERR_GRID_AXIS_INFLUENCE_VERSION_V533;
  generatedAt: string;
  status: "deterministic-grid-axis-influence-qualified-operational-axis-prior-unavailable";
  source: Readonly<Record<string, string>>;
  oracle: Readonly<Record<string, string | number | boolean>>;
  influenceDefinition: Readonly<Record<string, unknown>>;
  stochasticInfluence: KerrGridAxisInfluenceFamilyV533;
  deterministicInfluence: KerrGridAxisInfluenceFamilyV533;
  displayGeometry: Readonly<{
    stochasticAxisSummaries: readonly KerrGridAxisSummaryV533[];
    deterministicAxisSummaries: readonly KerrGridAxisSummaryV533[];
    stochasticOmissionRows: readonly KerrRegretOmissionRowV532[];
    deterministicOmissionRows: readonly KerrRegretOmissionRowV532[];
    scientificGeometryInputCount: 46;
  }>;
  influenceAudits: Readonly<Record<string, unknown>>;
  selectionBoundary: Readonly<Record<string, boolean>>;
  acquisitionBoundary: Readonly<{
    requiredMeasuredFileCount: 6;
    readyMeasuredFileCount: 0;
    measuredCalibrationRowCount: 0;
    numericalScienceErrorBarsAvailable: false;
    scienceRecoveryExecutable: false;
  }>;
  counts: Readonly<{
    axisCount: 4;
    axisSummaryRowCount: 8;
    omissionRowCount: 38;
    directedAxisComparisonCount: 24;
    scientificGeometryInputCount: 46;
    measuredCalibrationFileCount: 0;
    requiredMeasuredCalibrationFileCount: 6;
    expectedElectronCountRowCount: 0;
    observedCountRowCount: 0;
    sciencePixelRowCount: 0;
  }>;
  maxima: Readonly<Record<string, string>>;
  limits: Readonly<{ multiprecisionResidual: string }>;
  qualification: Readonly<Record<string, boolean>>;
  boundary: Readonly<{
    normalizedStressModelOnly: true;
    physicalNoiseModelAvailable: false;
    physicalCostModelAvailable: false;
    measuredCalibrationAvailable: false;
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

export type KerrGridAxisInfluenceSummaryV533 = Omit<
  KerrGridAxisInfluenceArtifactV533,
  "generatedAt" | "sourceManifest" | "sourceSha256"
>;

export type KerrGridAxisInfluenceApiV533 = Readonly<{
  version: typeof KERR_GRID_AXIS_INFLUENCE_API_VERSION_V533;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt";
  summary: KerrGridAxisInfluenceSummaryV533 | null;
}>;

export type KerrGridAxisInfluenceHudProfileV533 = Readonly<{
  id: typeof KERR_GRID_AXIS_INFLUENCE_HUD_PROFILE_ID_V533;
  mode: KerrGridAxisInfluenceHudModeV533;
  localShadowOnly: true;
  defaultApplied: false;
  panel: string;
  panelRaised: string;
  ink: string;
  muted: string;
  grid: string;
  emphasis: string;
  neutral: string;
  unavailable: string;
  scienceBoundary: Readonly<{
    linearDisplay: boolean;
    bloomIntensity: number;
    colorGradeIntensity: number;
    numericScientificStyleInputCount: 0;
    influenceMetricDrivesStyle: false;
    dominantAxisDrivesStyle: false;
    scientificFieldMutation: false;
  }>;
  cinematicSeed: string | null;
}>;

const scienceProfile: KerrGridAxisInfluenceHudProfileV533 = Object.freeze({
  id: KERR_GRID_AXIS_INFLUENCE_HUD_PROFILE_ID_V533,
  mode: "science",
  localShadowOnly: true,
  defaultApplied: false,
  panel: "#020709",
  panelRaised: "#071116",
  ink: "#edfdff",
  muted: "#79969d",
  grid: "rgba(112, 227, 238, 0.07)",
  emphasis: "#78e3ff",
  neutral: "#98d7c8",
  unavailable: "#ff91ad",
  scienceBoundary: Object.freeze({
    linearDisplay: true,
    bloomIntensity: 0,
    colorGradeIntensity: 0,
    numericScientificStyleInputCount: 0,
    influenceMetricDrivesStyle: false,
    dominantAxisDrivesStyle: false,
    scientificFieldMutation: false,
  }),
  cinematicSeed: null,
});

const cinematicProfile: KerrGridAxisInfluenceHudProfileV533 = Object.freeze({
  ...scienceProfile,
  mode: "cinematic",
  panel: "#0e0807",
  panelRaised: "#17110e",
  ink: "#fff5e8",
  muted: "#b09982",
  grid: "rgba(255, 198, 121, 0.065)",
  emphasis: "#9beaff",
  neutral: "#a2e1ce",
  unavailable: "#ff96b1",
  scienceBoundary: Object.freeze({
    linearDisplay: false,
    bloomIntensity: 0.065,
    colorGradeIntensity: 0.045,
    numericScientificStyleInputCount: 0,
    influenceMetricDrivesStyle: false,
    dominantAxisDrivesStyle: false,
    scientificFieldMutation: false,
  }),
  cinematicSeed: "orbit-atlas-v533-grid-axis-influence-hud-seed-01",
});

export const resolveKerrGridAxisInfluenceHudProfileV533 = (mode: KerrGridAxisInfluenceHudModeV533) =>
  mode === "science" ? scienceProfile : cinematicProfile;

const SHA = /^[a-f0-9]{64}$/;
const DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
const AXES: readonly KerrGridAxisV533[] = [
  "precision-exponent",
  "cost-ratio",
  "systematic-floor",
  "fixed-overhead",
];
const TRANSIENT = new Set([
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
const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !TRANSIENT.has(key))
      .sort(([a], [b]) => compare(a, b))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
};
const validDecimal = (value: unknown) =>
  typeof value === "string" && DECIMAL.test(value) && Number.isFinite(Number(value));

export const canonicalKerrGridAxisInfluenceV533 = (value: unknown) => JSON.stringify(canonicalize(value));

function validAxisSummary(value: unknown, expectedAxis: KerrGridAxisV533, expectedIndex: number): boolean {
  if (!isRecord(value)) return false;
  const omittedLevelCount = expectedAxis === "fixed-overhead" ? 4 : 5;
  return value.axis === expectedAxis
    && value.axisIndex === expectedIndex
    && value.omittedLevelCount === omittedLevelCount
    && Array.isArray(value.omissionIndices)
    && value.omissionIndices.length === omittedLevelCount
    && validDecimal(value.minimumParetoJaccard)
    && validDecimal(value.arithmeticMeanParetoJaccard)
    && validDecimal(value.minimumAbsoluteRankSpearman)
    && validDecimal(value.minimumRelativeRankSpearman)
    && Number.isInteger(value.maximumAbsoluteRankDisplacement)
    && Number.isInteger(value.maximumRelativeRankDisplacement)
    && value.aggregationIsProbability === false
    && value.singleScoreComputed === false
    && value.recommended === false;
}

function validFamily(value: unknown, expectedFamily: KerrGridAxisInfluenceFamilyNameV533): boolean {
  if (!isRecord(value) || value.family !== expectedFamily || value.axisCount !== 4) return false;
  if (!Array.isArray(value.axisSummaries) || value.axisSummaries.length !== 4) return false;
  if (!value.axisSummaries.every((row, index) => validAxisSummary(row, AXES[index], index))) return false;
  if (!Array.isArray(value.axisComparisons) || value.axisComparisons.length !== 12) return false;
  if (value.directedMultiMetricComparisonCount !== 12) return false;
  return value.singleDominantAxisAvailable === true
    && value.singleDominantAxis === "cost-ratio"
    && value.singleDominantAxisPromotedToRecommendation === false
    && isRecord(value.selectionBoundary)
    && value.selectionBoundary.singleScoreAvailable === false
    && value.selectionBoundary.axisPriorAvailable === false
    && value.selectionBoundary.recommendedAxisAvailable === false;
}

function validateCore(value: Partial<KerrGridAxisInfluenceArtifactV533>): boolean {
  return value.version === KERR_GRID_AXIS_INFLUENCE_VERSION_V533
    && value.status === "deterministic-grid-axis-influence-qualified-operational-axis-prior-unavailable"
    && Object.values(value.source ?? {}).length === 4
    && Object.values(value.source ?? {}).every((entry) => SHA.test(entry))
    && value.counts?.axisCount === 4
    && value.counts.axisSummaryRowCount === 8
    && value.counts.omissionRowCount === 38
    && value.counts.directedAxisComparisonCount === 24
    && value.counts.scientificGeometryInputCount === 46
    && Object.values(value.maxima ?? {}).every(
      (entry) => validDecimal(entry) && Number(entry) < Number(value.limits?.multiprecisionResidual),
    )
    && value.acquisitionBoundary?.readyMeasuredFileCount === 0
    && value.qualification?.axisInfluenceAtlasQualified === true
    && value.qualification.operationalAxisImportanceQualified === false
    && value.selectionBoundary?.axisPriorAvailable === false
    && value.selectionBoundary.recommendedAxisAvailable === false
    && value.boundary?.denseCampaignStatus === "incomplete-0-of-49"
    && value.boundary.browserQualification === "not-run"
    && value.boundary.formalProductPointer === "v263"
    && value.boundary.formalDefaultKernel === "legacy-eih-1pn"
    && SHA.test(value.artifactSha256 ?? "");
}

export function parseKerrGridAxisInfluenceArtifactV533(value: unknown): KerrGridAxisInfluenceArtifactV533 {
  if (!isRecord(value)) throw new Error("v533-grid-axis-influence-shape");
  const artifact = value as Partial<KerrGridAxisInfluenceArtifactV533>;
  if (!validateCore(artifact)
    || !validFamily(artifact.stochasticInfluence, "stochastic-variance")
    || !validFamily(artifact.deterministicInfluence, "deterministic-bound")
    || artifact.displayGeometry?.stochasticAxisSummaries.length !== 4
    || artifact.displayGeometry.deterministicAxisSummaries.length !== 4
    || artifact.displayGeometry.stochasticOmissionRows.length !== 19
    || artifact.displayGeometry.deterministicOmissionRows.length !== 19
    || artifact.displayGeometry.scientificGeometryInputCount !== 46
    || !Array.isArray(artifact.sourceManifest)
    || artifact.sourceManifest.some((entry) => !entry.path || !SHA.test(entry.sha256))
    || !SHA.test(artifact.sourceSha256 ?? "")) {
    throw new Error("v533-grid-axis-influence-boundary");
  }
  return artifact as KerrGridAxisInfluenceArtifactV533;
}

export function createKerrGridAxisInfluenceSummaryV533(value: unknown): KerrGridAxisInfluenceSummaryV533 {
  const artifact = parseKerrGridAxisInfluenceArtifactV533(value);
  const summary = { ...artifact } as Record<string, unknown>;
  delete summary.generatedAt;
  delete summary.sourceManifest;
  delete summary.sourceSha256;
  return Object.freeze(summary) as unknown as KerrGridAxisInfluenceSummaryV533;
}

export function parseKerrGridAxisInfluenceApiV533(value: unknown): KerrGridAxisInfluenceApiV533 {
  if (!isRecord(value)
    || value.version !== KERR_GRID_AXIS_INFLUENCE_API_VERSION_V533
    || typeof value.available !== "boolean"
    || !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt"].includes(String(value.reason))) {
    throw new Error("v533-api-boundary");
  }
  if (value.available) {
    if (!isRecord(value.summary) || !validateCore(value.summary)) throw new Error("v533-api-summary");
  } else if (value.summary !== null) {
    throw new Error("v533-api-unavailable-summary");
  }
  return value as unknown as KerrGridAxisInfluenceApiV533;
}

export function createKerrGridAxisInfluenceHudEncodingV533(
  summary: KerrGridAxisInfluenceSummaryV533,
  mode: KerrGridAxisInfluenceHudModeV533,
) {
  if (!SHA.test(summary.artifactSha256)) throw new Error("v533-hud-source");
  return Object.freeze({
    version: "v533-kerr-grid-axis-influence-hud-encoding-v1" as const,
    profileId: KERR_GRID_AXIS_INFLUENCE_HUD_PROFILE_ID_V533,
    mode,
    scientificPayloadKey: summary.artifactSha256,
    scientificGeometry: summary.displayGeometry,
    scientificGeometryInputCount: 46 as const,
    numericScientificStyleInputCount: 0 as const,
    influenceMetricDrivesStyle: false as const,
    dominantAxisDrivesStyle: false as const,
    scientificFieldMutation: false as const,
  });
}

export function compareKerrGridAxisInfluenceHudEncodingsV533(
  science: ReturnType<typeof createKerrGridAxisInfluenceHudEncodingV533>,
  cinematic: ReturnType<typeof createKerrGridAxisInfluenceHudEncodingV533>,
) {
  if (science.mode !== "science"
    || cinematic.mode !== "cinematic"
    || science.scientificPayloadKey !== cinematic.scientificPayloadKey
    || JSON.stringify(science.scientificGeometry) !== JSON.stringify(cinematic.scientificGeometry)
    || science.scientificGeometryInputCount !== 46
    || cinematic.scientificGeometryInputCount !== 46) {
    throw new Error("v533-hud-boundary");
  }
  return Object.freeze({
    scientificPayloadStable: true as const,
    scientificGeometryStable: true as const,
    scientificGeometryInputCount: 46 as const,
    numericScientificStyleInputCount: 0 as const,
    scientificFieldMutation: false as const,
  });
}

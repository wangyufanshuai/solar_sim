export const KERR_REGRET_RANKING_VERSION_V531 =
  "v531-kerr-regret-ranking-stability-atlas-v1" as const;
export const KERR_REGRET_RANKING_API_VERSION_V531 =
  "v531-kerr-regret-ranking-api-v1" as const;
export const KERR_REGRET_RANKING_HUD_PROFILE_ID_V531 = "science-cinematic-v8-v531" as const;

export type KerrRegretRankingHudModeV531 = "science" | "cinematic";
export type KerrRegretCandidateMapRowV531 = Readonly<{
  candidateIndex: number;
  scienceAllocationFraction: string;
  maximumAbsoluteExcessCost: string;
  maximumRelativeRegret: string;
  absoluteRank: number;
  relativeRank: number;
  absoluteRelativeRankDisplacement: number;
  paretoNonDominated: boolean;
  dominatesCandidateCount: number;
  dominatedByCandidateCount: number;
  firstDominatingCandidateIndex: number | null;
  recommended: false;
}>;
export type KerrRegretScalarizationRowV531 = Readonly<{
  weightIndex: number;
  absoluteObjectiveWeight: string;
  relativeObjectiveWeight: string;
  winnerCandidateIndex: number;
  winnerScienceAllocationFraction: string;
  winnerScalarizedScore: string;
  winnerAbsoluteRank: number;
  winnerRelativeRank: number;
  winnerParetoNonDominated: true;
  tieCount: number;
  preferenceWeightMeasured: false;
  recommended: false;
}>;
export type KerrRegretRankingFamilyV531 = Readonly<{
  family: "stochastic-variance" | "deterministic-bound";
  candidateCount: 49;
  candidateMap: readonly KerrRegretCandidateMapRowV531[];
  paretoFront: Readonly<{
    candidateCount: number;
    candidateIndices: readonly number[];
    scienceAllocationFractions: readonly string[];
    operationalRecommendation: false;
  }>;
  rankingAgreement: Readonly<{
    absoluteWinnerCandidateIndex: number;
    relativeWinnerCandidateIndex: number;
    winnerAgreement: false;
    spearmanRankCorrelation: string;
    kendallRankCorrelation: string;
    concordantPairCount: number;
    discordantPairCount: number;
    rankPairCount: 1176;
    rankSquareDisplacementSum: number;
    maximumRankDisplacement: number;
    topSetOverlap: Readonly<Record<string, number>>;
    rankingIsOperationalPreference: false;
  }>;
  scalarizationPath: Readonly<{
    weightCount: 101;
    weightsMeasured: false;
    normalization: string;
    normalizationOperationallyValidated: false;
    rows: readonly KerrRegretScalarizationRowV531[];
    uniqueWinnerCandidateCount: number;
    uniqueWinnerCandidateIndices: readonly number[];
    winnerTransitionCount: number;
    selectedWeightIndex: null;
    operationalSelectionAllowed: false;
  }>;
  audits: Readonly<Record<string, string | number | boolean>>;
  selectionBoundary: Readonly<{
    utilityAvailable: false;
    preferenceWeightAvailable: false;
    normalizationPreferenceAvailable: false;
    recommendedCandidateAvailable: false;
    automaticSelectionAllowed: false;
  }>;
}>;
export type KerrRegretRankingArtifactV531 = Readonly<{
  version: typeof KERR_REGRET_RANKING_VERSION_V531;
  generatedAt: string;
  status: "regret-pareto-and-ranking-stability-qualified-operational-preference-unavailable";
  source: Readonly<Record<string, string>>;
  oracle: Readonly<{
    backend: "mpmath-1.3.0";
    decimalDigits: 160;
    candidateCountPerFamily: 49;
    scalarizationWeightCount: 101;
    scalarizationWeights: readonly string[];
    randomnessUsed: false;
  }>;
  rankingDefinition: Readonly<Record<string, string | boolean | readonly string[]>>;
  stochasticRanking: KerrRegretRankingFamilyV531;
  deterministicRanking: KerrRegretRankingFamilyV531;
  displayGeometry: Readonly<{
    stochasticCandidateMap: readonly KerrRegretCandidateMapRowV531[];
    deterministicCandidateMap: readonly KerrRegretCandidateMapRowV531[];
    stochasticScalarizationPath: readonly KerrRegretScalarizationRowV531[];
    deterministicScalarizationPath: readonly KerrRegretScalarizationRowV531[];
    scientificGeometryInputCount: 300;
  }>;
  rankingAudits: Readonly<Record<string, number | boolean | null>>;
  selectionBoundary: Readonly<{
    physicalTargetAvailable: false;
    modelPriorAvailable: false;
    utilityFunctionAvailable: false;
    preferenceWeightAvailable: false;
    normalizationPreferenceAvailable: false;
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
    candidateCountPerFamily: 49;
    candidateMapRowCount: 98;
    scalarizationWeightCount: 101;
    scalarizationPathRowCount: 202;
    dominanceComparisonCount: 4704;
    rankPairComparisonCount: 2352;
    scalarizationEvaluationCount: 9898;
    scientificGeometryInputCount: 300;
    measuredCalibrationFileCount: 0;
    requiredMeasuredCalibrationFileCount: 6;
    expectedElectronCountRowCount: 0;
    observedCountRowCount: 0;
    sciencePixelRowCount: 0;
  }>;
  maxima: Readonly<Record<string, string>>;
  limits: Readonly<{ multiprecisionResidual: string }>;
  qualification: Readonly<{
    paretoFrontQualified: true;
    rankAgreementQualified: true;
    scalarizationPathQualified: true;
    normalizationFragilityQualified: true;
    operationalPreferenceModelQualified: false;
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
export type KerrRegretCandidateGeometryV531 = Pick<
  KerrRegretCandidateMapRowV531,
  | "candidateIndex"
  | "scienceAllocationFraction"
  | "maximumAbsoluteExcessCost"
  | "maximumRelativeRegret"
  | "absoluteRank"
  | "relativeRank"
  | "absoluteRelativeRankDisplacement"
  | "paretoNonDominated"
>;
export type KerrRegretScalarizationGeometryV531 = Pick<
  KerrRegretScalarizationRowV531,
  | "weightIndex"
  | "absoluteObjectiveWeight"
  | "winnerCandidateIndex"
  | "winnerScienceAllocationFraction"
  | "winnerParetoNonDominated"
  | "tieCount"
>;
export type KerrRegretRankingSummaryV531 = Readonly<{
  version: typeof KERR_REGRET_RANKING_VERSION_V531;
  status: KerrRegretRankingArtifactV531["status"];
  source: KerrRegretRankingArtifactV531["source"];
  oracle: KerrRegretRankingArtifactV531["oracle"];
  rankingDefinition: KerrRegretRankingArtifactV531["rankingDefinition"];
  stochasticDescriptor: Omit<KerrRegretRankingFamilyV531, "candidateMap" | "scalarizationPath"> &
    Readonly<{ scalarizationPath: Omit<KerrRegretRankingFamilyV531["scalarizationPath"], "rows"> }>;
  deterministicDescriptor: Omit<KerrRegretRankingFamilyV531, "candidateMap" | "scalarizationPath"> &
    Readonly<{ scalarizationPath: Omit<KerrRegretRankingFamilyV531["scalarizationPath"], "rows"> }>;
  displayGeometry: Readonly<{
    stochasticCandidateMap: readonly KerrRegretCandidateGeometryV531[];
    deterministicCandidateMap: readonly KerrRegretCandidateGeometryV531[];
    stochasticScalarizationPath: readonly KerrRegretScalarizationGeometryV531[];
    deterministicScalarizationPath: readonly KerrRegretScalarizationGeometryV531[];
    scientificGeometryInputCount: 300;
  }>;
  rankingAudits: KerrRegretRankingArtifactV531["rankingAudits"];
  selectionBoundary: KerrRegretRankingArtifactV531["selectionBoundary"];
  acquisitionBoundary: KerrRegretRankingArtifactV531["acquisitionBoundary"];
  counts: KerrRegretRankingArtifactV531["counts"];
  maxima: KerrRegretRankingArtifactV531["maxima"];
  limits: KerrRegretRankingArtifactV531["limits"];
  qualification: KerrRegretRankingArtifactV531["qualification"];
  boundary: KerrRegretRankingArtifactV531["boundary"];
  artifactSha256: string;
}>;
export type KerrRegretRankingApiV531 = Readonly<{
  version: typeof KERR_REGRET_RANKING_API_VERSION_V531;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt";
  summary: KerrRegretRankingSummaryV531 | null;
}>;

export type KerrRegretRankingHudProfileV531 = Readonly<{
  id: typeof KERR_REGRET_RANKING_HUD_PROFILE_ID_V531;
  mode: KerrRegretRankingHudModeV531;
  localShadowOnly: true;
  defaultApplied: false;
  panel: string;
  panelRaised: string;
  ink: string;
  muted: string;
  grid: string;
  pareto: string;
  dominated: string;
  winner: string;
  displacement: string;
  unavailable: string;
  railOpacity: number;
  curveGlowOpacity: number;
  scienceBoundary: Readonly<{
    linearDisplay: boolean;
    bloomIntensity: number;
    colorGradeIntensity: number;
    numericScientificStyleInputCount: 0;
    rankDrivesStyle: false;
    paretoDrivesStyle: false;
    weightDrivesStyle: false;
    scientificFieldMutation: false;
  }>;
  cinematicSeed: string | null;
}>;
const scienceProfile: KerrRegretRankingHudProfileV531 = Object.freeze({
  id: KERR_REGRET_RANKING_HUD_PROFILE_ID_V531,
  mode: "science",
  localShadowOnly: true,
  defaultApplied: false,
  panel: "#010609",
  panelRaised: "#051116",
  ink: "#e9fcff",
  muted: "#78959d",
  grid: "rgba(103,226,239,.066)",
  pareto: "#81ebc8",
  dominated: "#62747a",
  winner: "#7edfff",
  displacement: "#c9a5ff",
  unavailable: "#ff8ca8",
  railOpacity: 0.6,
  curveGlowOpacity: 0,
  scienceBoundary: Object.freeze({
    linearDisplay: true,
    bloomIntensity: 0,
    colorGradeIntensity: 0,
    numericScientificStyleInputCount: 0,
    rankDrivesStyle: false,
    paretoDrivesStyle: false,
    weightDrivesStyle: false,
    scientificFieldMutation: false,
  }),
  cinematicSeed: null,
});
const cinematicProfile: KerrRegretRankingHudProfileV531 = Object.freeze({
  id: KERR_REGRET_RANKING_HUD_PROFILE_ID_V531,
  mode: "cinematic",
  localShadowOnly: true,
  defaultApplied: false,
  panel: "#100807",
  panelRaised: "#1a110f",
  ink: "#fff4df",
  muted: "#af937c",
  grid: "rgba(255,194,110,.06)",
  pareto: "#8df0ca",
  dominated: "#716d68",
  winner: "#91e8ff",
  displacement: "#d4b3ff",
  unavailable: "#ff8eb1",
  railOpacity: 0.41,
  curveGlowOpacity: 0.2,
  scienceBoundary: Object.freeze({
    linearDisplay: false,
    bloomIntensity: 0.072,
    colorGradeIntensity: 0.05,
    numericScientificStyleInputCount: 0,
    rankDrivesStyle: false,
    paretoDrivesStyle: false,
    weightDrivesStyle: false,
    scientificFieldMutation: false,
  }),
  cinematicSeed: "orbit-atlas-v531-regret-ranking-hud-seed-01",
});
export const resolveKerrRegretRankingHudProfileV531 = (mode: KerrRegretRankingHudModeV531) =>
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
export const canonicalKerrRegretRankingV531 = (value: unknown) =>
  JSON.stringify(canonicalize(value));
const validDecimal = (value: unknown) =>
  typeof value === "string" && DECIMAL.test(value) && Number.isFinite(Number(value));
const validCandidate = (row: KerrRegretCandidateMapRowV531) =>
  Number.isInteger(row.candidateIndex) &&
  validDecimal(row.scienceAllocationFraction) &&
  validDecimal(row.maximumAbsoluteExcessCost) &&
  validDecimal(row.maximumRelativeRegret) &&
  Number.isInteger(row.absoluteRank) &&
  Number.isInteger(row.relativeRank) &&
  row.recommended === false;
const validScalar = (row: KerrRegretScalarizationRowV531) =>
  Number.isInteger(row.weightIndex) &&
  validDecimal(row.absoluteObjectiveWeight) &&
  validDecimal(row.winnerScienceAllocationFraction) &&
  row.winnerParetoNonDominated === true &&
  row.preferenceWeightMeasured === false &&
  row.recommended === false;
const validFamily = (family: KerrRegretRankingFamilyV531) =>
  family.candidateCount === 49 &&
  family.candidateMap.length === 49 &&
  family.candidateMap.every(validCandidate) &&
  family.paretoFront.candidateCount >= 2 &&
  family.paretoFront.operationalRecommendation === false &&
  family.rankingAgreement.winnerAgreement === false &&
  family.rankingAgreement.rankPairCount === 1176 &&
  family.scalarizationPath.weightCount === 101 &&
  family.scalarizationPath.rows.length === 101 &&
  family.scalarizationPath.rows.every(validScalar) &&
  family.scalarizationPath.selectedWeightIndex === null &&
  family.selectionBoundary.recommendedCandidateAvailable === false;
function validateCore(value: Partial<KerrRegretRankingArtifactV531>) {
  return (
    value.version === KERR_REGRET_RANKING_VERSION_V531 &&
    value.status ===
      "regret-pareto-and-ranking-stability-qualified-operational-preference-unavailable" &&
    Object.values(value.source ?? {}).length === 4 &&
    Object.values(value.source ?? {}).every((entry) => SHA.test(entry)) &&
    value.oracle?.decimalDigits === 160 &&
    value.oracle.candidateCountPerFamily === 49 &&
    value.oracle.scalarizationWeightCount === 101 &&
    value.oracle.scalarizationWeights.length === 101 &&
    value.oracle.randomnessUsed === false &&
    value.counts?.dominanceComparisonCount === 4704 &&
    value.counts.rankPairComparisonCount === 2352 &&
    value.counts.scalarizationEvaluationCount === 9898 &&
    value.counts.scientificGeometryInputCount === 300 &&
    Object.values(value.maxima ?? {}).every(
      (entry) => validDecimal(entry) && Number(entry) < Number(value.limits?.multiprecisionResidual),
    ) &&
    value.selectionBoundary?.utilityFunctionAvailable === false &&
    value.selectionBoundary.preferenceWeightAvailable === false &&
    value.selectionBoundary.recommendedAllocationAvailable === false &&
    value.acquisitionBoundary?.readyMeasuredFileCount === 0 &&
    value.qualification?.paretoFrontQualified === true &&
    value.qualification.operationalPreferenceModelQualified === false &&
    value.boundary?.denseCampaignStatus === "incomplete-0-of-49" &&
    value.boundary.browserQualification === "not-run" &&
    value.boundary.formalProductPointer === "v263" &&
    value.boundary.formalDefaultKernel === "legacy-eih-1pn" &&
    SHA.test(value.artifactSha256 ?? "")
  );
}
export function parseKerrRegretRankingArtifactV531(value: unknown): KerrRegretRankingArtifactV531 {
  if (!isRecord(value)) throw new Error("v531-ranking-shape");
  const artifact = value as Partial<KerrRegretRankingArtifactV531>;
  if (
    !validateCore(artifact) ||
    !artifact.stochasticRanking ||
    !artifact.deterministicRanking ||
    !validFamily(artifact.stochasticRanking) ||
    !validFamily(artifact.deterministicRanking) ||
    artifact.displayGeometry?.stochasticCandidateMap.length !== 49 ||
    artifact.displayGeometry.deterministicCandidateMap.length !== 49 ||
    artifact.displayGeometry.stochasticScalarizationPath.length !== 101 ||
    artifact.displayGeometry.deterministicScalarizationPath.length !== 101 ||
    artifact.displayGeometry.scientificGeometryInputCount !== 300 ||
    !Array.isArray(artifact.sourceManifest) ||
    artifact.sourceManifest.some((entry) => !entry.path || !SHA.test(entry.sha256)) ||
    !SHA.test(artifact.sourceSha256 ?? "")
  ) {
    throw new Error("v531-ranking-boundary");
  }
  return artifact as KerrRegretRankingArtifactV531;
}
const candidateGeometry = (row: KerrRegretCandidateMapRowV531) =>
  Object.freeze({
    candidateIndex: row.candidateIndex,
    scienceAllocationFraction: row.scienceAllocationFraction,
    maximumAbsoluteExcessCost: row.maximumAbsoluteExcessCost,
    maximumRelativeRegret: row.maximumRelativeRegret,
    absoluteRank: row.absoluteRank,
    relativeRank: row.relativeRank,
    absoluteRelativeRankDisplacement: row.absoluteRelativeRankDisplacement,
    paretoNonDominated: row.paretoNonDominated,
  });
const scalarGeometry = (row: KerrRegretScalarizationRowV531) =>
  Object.freeze({
    weightIndex: row.weightIndex,
    absoluteObjectiveWeight: row.absoluteObjectiveWeight,
    winnerCandidateIndex: row.winnerCandidateIndex,
    winnerScienceAllocationFraction: row.winnerScienceAllocationFraction,
    winnerParetoNonDominated: row.winnerParetoNonDominated,
    tieCount: row.tieCount,
  });
const familyDescriptor = (family: KerrRegretRankingFamilyV531) =>
  Object.freeze({
    family: family.family,
    candidateCount: family.candidateCount,
    paretoFront: family.paretoFront,
    rankingAgreement: family.rankingAgreement,
    scalarizationPath: Object.freeze({
      weightCount: family.scalarizationPath.weightCount,
      weightsMeasured: family.scalarizationPath.weightsMeasured,
      normalization: family.scalarizationPath.normalization,
      normalizationOperationallyValidated:
        family.scalarizationPath.normalizationOperationallyValidated,
      uniqueWinnerCandidateCount: family.scalarizationPath.uniqueWinnerCandidateCount,
      uniqueWinnerCandidateIndices: family.scalarizationPath.uniqueWinnerCandidateIndices,
      winnerTransitionCount: family.scalarizationPath.winnerTransitionCount,
      selectedWeightIndex: family.scalarizationPath.selectedWeightIndex,
      operationalSelectionAllowed: family.scalarizationPath.operationalSelectionAllowed,
    }),
    audits: family.audits,
    selectionBoundary: family.selectionBoundary,
  });
export function createKerrRegretRankingSummaryV531(value: unknown): KerrRegretRankingSummaryV531 {
  const artifact = parseKerrRegretRankingArtifactV531(value);
  return Object.freeze({
    version: artifact.version,
    status: artifact.status,
    source: artifact.source,
    oracle: artifact.oracle,
    rankingDefinition: artifact.rankingDefinition,
    stochasticDescriptor: familyDescriptor(artifact.stochasticRanking),
    deterministicDescriptor: familyDescriptor(artifact.deterministicRanking),
    displayGeometry: Object.freeze({
      stochasticCandidateMap: Object.freeze(
        artifact.displayGeometry.stochasticCandidateMap.map(candidateGeometry),
      ),
      deterministicCandidateMap: Object.freeze(
        artifact.displayGeometry.deterministicCandidateMap.map(candidateGeometry),
      ),
      stochasticScalarizationPath: Object.freeze(
        artifact.displayGeometry.stochasticScalarizationPath.map(scalarGeometry),
      ),
      deterministicScalarizationPath: Object.freeze(
        artifact.displayGeometry.deterministicScalarizationPath.map(scalarGeometry),
      ),
      scientificGeometryInputCount: 300 as const,
    }),
    rankingAudits: artifact.rankingAudits,
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
export function parseKerrRegretRankingApiV531(value: unknown): KerrRegretRankingApiV531 {
  if (
    !isRecord(value) ||
    value.version !== KERR_REGRET_RANKING_API_VERSION_V531 ||
    typeof value.available !== "boolean" ||
    !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt"].includes(
      String(value.reason),
    )
  ) {
    throw new Error("v531-api-boundary");
  }
  if (value.available) {
    if (!isRecord(value.summary) || !validateCore(value.summary)) throw new Error("v531-api-summary");
  } else if (value.summary !== null) {
    throw new Error("v531-api-unavailable-summary");
  }
  return value as unknown as KerrRegretRankingApiV531;
}
export function createKerrRegretRankingHudEncodingV531(
  summary: KerrRegretRankingSummaryV531,
  mode: KerrRegretRankingHudModeV531,
) {
  if (!SHA.test(summary.artifactSha256)) throw new Error("v531-hud-source");
  return Object.freeze({
    version: "v531-kerr-regret-ranking-hud-encoding-v1" as const,
    profileId: KERR_REGRET_RANKING_HUD_PROFILE_ID_V531,
    mode,
    scientificPayloadKey: summary.artifactSha256,
    scientificGeometry: summary.displayGeometry,
    scientificGeometryInputCount: 300 as const,
    numericScientificStyleInputCount: 0 as const,
    rankDrivesStyle: false as const,
    paretoDrivesStyle: false as const,
    weightDrivesStyle: false as const,
    scientificFieldMutation: false as const,
  });
}
export function compareKerrRegretRankingHudEncodingsV531(
  science: ReturnType<typeof createKerrRegretRankingHudEncodingV531>,
  cinematic: ReturnType<typeof createKerrRegretRankingHudEncodingV531>,
) {
  if (
    science.mode !== "science" ||
    cinematic.mode !== "cinematic" ||
    science.scientificPayloadKey !== cinematic.scientificPayloadKey ||
    JSON.stringify(science.scientificGeometry) !== JSON.stringify(cinematic.scientificGeometry) ||
    science.scientificGeometryInputCount !== 300 ||
    cinematic.scientificGeometryInputCount !== 300 ||
    science.numericScientificStyleInputCount !== 0 ||
    cinematic.numericScientificStyleInputCount !== 0
  ) {
    throw new Error("v531-hud-boundary");
  }
  return Object.freeze({
    scientificPayloadStable: true as const,
    scientificGeometryStable: true as const,
    scientificGeometryInputCount: 300 as const,
    numericScientificStyleInputCount: 0 as const,
    scientificFieldMutation: false as const,
  });
}

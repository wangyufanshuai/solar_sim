export const KERR_ALLOCATION_REGRET_VERSION_V530 =
  "v530-kerr-allocation-regret-fragility-atlas-v1" as const;
export const KERR_ALLOCATION_REGRET_API_VERSION_V530 =
  "v530-kerr-allocation-regret-api-v1" as const;
export const KERR_ALLOCATION_REGRET_HUD_PROFILE_ID_V530 = "science-cinematic-v7r9-v530" as const;

export type KerrAllocationRegretHudModeV530 = "science" | "cinematic";
export type KerrAllocationRegretCandidateV530 = Readonly<{
  candidateIndex: number;
  scienceAllocationFraction: string;
  maximumAbsoluteExcessCost: string;
  maximumRelativeRegret: string;
  minimumAbsoluteExcessCost: string;
  minimumRelativeRegret: string;
  gridCellCountAtOrBelowOnePercentRelativeRegret: number;
  gridCellCountAtOrBelowFivePercentRelativeRegret: number;
  gridCellCountAtOrBelowTenPercentRelativeRegret: number;
  sourceGridCellCount: 500;
  worstAbsoluteCell: Readonly<Record<string, string | number>>;
  worstRelativeCell: Readonly<Record<string, string | number>>;
  coverageIsProbability: false;
  recommended: false;
}>;
export type KerrAllocationOptimalLatticeRowV530 = Readonly<{
  sourceIndex: number;
  precisionExponent: string;
  calibrationToScienceCostWeight: string;
  scienceOptimalFraction: string;
  operationalSelection: false;
}>;
export type KerrAllocationRegretDisplayGeometryV530 = Readonly<{
  stochasticCandidateEnvelope: readonly KerrAllocationRegretCandidateV530[];
  deterministicCandidateEnvelope: readonly KerrAllocationRegretCandidateV530[];
  stochasticOptimalFractionLattice: readonly KerrAllocationOptimalLatticeRowV530[];
  deterministicOptimalFractionLattice: readonly KerrAllocationOptimalLatticeRowV530[];
  scientificGeometryInputCount: 148;
}>;
export type KerrAllocationRegretFamilyV530 = Readonly<{
  family: "stochastic-variance" | "deterministic-bound";
  candidateCount: 49;
  sourceGridCellCount: 500;
  candidateEnvelope: readonly KerrAllocationRegretCandidateV530[];
  descriptiveAbsoluteMinimax: Readonly<{
    candidateIndex: number;
    scienceAllocationFraction: string;
    maximumAbsoluteExcessCost: string;
    recommended: false;
  }>;
  descriptiveRelativeMinimax: Readonly<{
    candidateIndex: number;
    scienceAllocationFraction: string;
    maximumRelativeRegret: string;
    recommended: false;
  }>;
  sourceOptimalFractionRange: Readonly<{
    minimum: string;
    maximum: string;
    span: string;
    operationalRange: false;
  }>;
  selectionBoundary: Readonly<{
    priorAvailable: false;
    gridCoverageIsProbability: false;
    descriptiveMinimaxIsRecommendation: false;
    operationalSelectionAllowed: false;
  }>;
}>;
export type KerrAllocationRegretArtifactV530 = Readonly<{
  version: typeof KERR_ALLOCATION_REGRET_VERSION_V530;
  generatedAt: string;
  status: "allocation-regret-fragility-qualified-operational-decision-unavailable";
  source: Readonly<Record<string, string>>;
  oracle: Readonly<{
    backend: "mpmath-1.3.0";
    decimalDigits: 160;
    sourceCellCount: 1000;
    candidateAllocationCountPerFamily: 49;
    candidateFractions: readonly string[];
    randomnessUsed: false;
  }>;
  regretDefinition: Readonly<{
    absoluteExcessCost: string;
    relativeRegret: string;
    absoluteRegretIndependentOfAdditiveOverhead: true;
    relativeRegretDependsOnAdditiveOverheadNormalization: true;
    gridCoverageIsProbability: false;
    priorUsed: false;
    stressModelOnlyNotOperationalDecision: true;
  }>;
  stochasticRegretAtlas: KerrAllocationRegretFamilyV530;
  deterministicRegretAtlas: KerrAllocationRegretFamilyV530;
  displayGeometry: KerrAllocationRegretDisplayGeometryV530;
  regretAudits: Readonly<{
    overheadAbsoluteRegretInvarianceComparisons: 36750;
    relativeRegretOverheadMonotonicityComparisons: 36750;
    absoluteRegretOverheadInvariant: true;
    relativeRegretNonIncreasingWithOverhead: true;
    descriptiveMinimaxComputed: true;
    descriptiveMinimaxPromotedToRecommendation: false;
  }>;
  selectionBoundary: Readonly<{
    physicalTargetAvailable: false;
    modelPriorAvailable: false;
    measuredCostLawAvailable: false;
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
    candidateAllocationCount: 49;
    sourceGridCellCount: 1000;
    stochasticRegretEvaluationCount: 24500;
    deterministicRegretEvaluationCount: 24500;
    regretEvaluationCount: 49000;
    overheadAbsoluteRegretInvarianceComparisonCount: 36750;
    relativeRegretOverheadMonotonicityComparisonCount: 36750;
    scientificGeometryInputCount: 148;
    measuredCalibrationFileCount: 0;
    requiredMeasuredCalibrationFileCount: 6;
    expectedElectronCountRowCount: 0;
    observedCountRowCount: 0;
    sciencePixelRowCount: 0;
  }>;
  maxima: Readonly<Record<string, string>>;
  limits: Readonly<{ multiprecisionResidual: string }>;
  qualification: Readonly<{
    allocationRegretAtlasQualified: true;
    absoluteOverheadInvarianceQualified: true;
    relativeOverheadNormalizationAuditQualified: true;
    allocationFragilityQualified: true;
    operationalDecisionModelQualified: false;
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
export type KerrAllocationRegretSummaryV530 = Omit<
  KerrAllocationRegretArtifactV530,
  | "generatedAt"
  | "stochasticRegretAtlas"
  | "deterministicRegretAtlas"
  | "sourceManifest"
  | "sourceSha256"
> &
  Readonly<{
    stochasticDescriptor: Omit<KerrAllocationRegretFamilyV530, "candidateEnvelope">;
    deterministicDescriptor: Omit<KerrAllocationRegretFamilyV530, "candidateEnvelope">;
  }>;
export type KerrAllocationRegretApiV530 = Readonly<{
  version: typeof KERR_ALLOCATION_REGRET_API_VERSION_V530;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt";
  summary: KerrAllocationRegretSummaryV530 | null;
}>;
export type KerrAllocationRegretHudProfileV530 = Readonly<{
  id: typeof KERR_ALLOCATION_REGRET_HUD_PROFILE_ID_V530;
  mode: KerrAllocationRegretHudModeV530;
  localShadowOnly: true;
  defaultApplied: false;
  panel: string;
  panelRaised: string;
  ink: string;
  muted: string;
  grid: string;
  relative: string;
  absolute: string;
  lattice: string;
  conflict: string;
  unavailable: string;
  railOpacity: number;
  curveGlowOpacity: number;
  scienceBoundary: Readonly<{
    linearDisplay: boolean;
    bloomIntensity: number;
    colorGradeIntensity: number;
    numericScientificStyleInputCount: 0;
    regretDrivesStyle: false;
    minimaxDrivesStyle: false;
    fragilityDrivesStyle: false;
    scientificFieldMutation: false;
  }>;
  cinematicSeed: string | null;
}>;

const scienceProfile: KerrAllocationRegretHudProfileV530 = Object.freeze({
  id: KERR_ALLOCATION_REGRET_HUD_PROFILE_ID_V530,
  mode: "science",
  localShadowOnly: true,
  defaultApplied: false,
  panel: "#02070a",
  panelRaised: "#061216",
  ink: "#e8fbff",
  muted: "#78949c",
  grid: "rgba(104,226,239,.068)",
  relative: "#7cddff",
  absolute: "#ffc878",
  lattice: "#8df0c7",
  conflict: "#c8a4ff",
  unavailable: "#ff8da9",
  railOpacity: 0.61,
  curveGlowOpacity: 0,
  scienceBoundary: Object.freeze({
    linearDisplay: true,
    bloomIntensity: 0,
    colorGradeIntensity: 0,
    numericScientificStyleInputCount: 0,
    regretDrivesStyle: false,
    minimaxDrivesStyle: false,
    fragilityDrivesStyle: false,
    scientificFieldMutation: false,
  }),
  cinematicSeed: null,
});
const cinematicProfile: KerrAllocationRegretHudProfileV530 = Object.freeze({
  id: KERR_ALLOCATION_REGRET_HUD_PROFILE_ID_V530,
  mode: "cinematic",
  localShadowOnly: true,
  defaultApplied: false,
  panel: "#100908",
  panelRaised: "#1b1210",
  ink: "#fff4df",
  muted: "#af937c",
  grid: "rgba(255,195,112,.062)",
  relative: "#8ce5ff",
  absolute: "#ffb96b",
  lattice: "#93efc9",
  conflict: "#d2b2ff",
  unavailable: "#ff8eb1",
  railOpacity: 0.42,
  curveGlowOpacity: 0.2,
  scienceBoundary: Object.freeze({
    linearDisplay: false,
    bloomIntensity: 0.075,
    colorGradeIntensity: 0.052,
    numericScientificStyleInputCount: 0,
    regretDrivesStyle: false,
    minimaxDrivesStyle: false,
    fragilityDrivesStyle: false,
    scientificFieldMutation: false,
  }),
  cinematicSeed: "orbit-atlas-v530-allocation-regret-hud-seed-01",
});
export const resolveKerrAllocationRegretHudProfileV530 = (
  mode: KerrAllocationRegretHudModeV530,
) => (mode === "science" ? scienceProfile : cinematicProfile);

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
export const canonicalKerrAllocationRegretV530 = (value: unknown) =>
  JSON.stringify(canonicalize(value));
const validDecimal = (value: unknown) =>
  typeof value === "string" && DECIMAL.test(value) && Number.isFinite(Number(value));
const validCandidate = (row: KerrAllocationRegretCandidateV530) =>
  Number.isInteger(row.candidateIndex) &&
  validDecimal(row.scienceAllocationFraction) &&
  validDecimal(row.maximumAbsoluteExcessCost) &&
  validDecimal(row.maximumRelativeRegret) &&
  row.sourceGridCellCount === 500 &&
  row.coverageIsProbability === false &&
  row.recommended === false;
const validLattice = (row: KerrAllocationOptimalLatticeRowV530) =>
  Number.isInteger(row.sourceIndex) &&
  validDecimal(row.precisionExponent) &&
  validDecimal(row.calibrationToScienceCostWeight) &&
  validDecimal(row.scienceOptimalFraction) &&
  row.operationalSelection === false;
function validDisplayGeometry(value: unknown): value is KerrAllocationRegretDisplayGeometryV530 {
  if (!isRecord(value) || value.scientificGeometryInputCount !== 148) return false;
  const geometry = value as Partial<KerrAllocationRegretDisplayGeometryV530>;
  return (
    geometry.stochasticCandidateEnvelope?.length === 49 &&
    geometry.deterministicCandidateEnvelope?.length === 49 &&
    geometry.stochasticOptimalFractionLattice?.length === 25 &&
    geometry.deterministicOptimalFractionLattice?.length === 25 &&
    geometry.stochasticCandidateEnvelope.every(validCandidate) &&
    geometry.deterministicCandidateEnvelope.every(validCandidate) &&
    geometry.stochasticOptimalFractionLattice.every(validLattice) &&
    geometry.deterministicOptimalFractionLattice.every(validLattice)
  );
}
function validateCore(value: Partial<KerrAllocationRegretArtifactV530>) {
  return (
    value.version === KERR_ALLOCATION_REGRET_VERSION_V530 &&
    value.status === "allocation-regret-fragility-qualified-operational-decision-unavailable" &&
    Object.values(value.source ?? {}).length === 4 &&
    Object.values(value.source ?? {}).every((entry) => SHA.test(entry)) &&
    value.oracle?.decimalDigits === 160 &&
    value.oracle.sourceCellCount === 1000 &&
    value.oracle.candidateAllocationCountPerFamily === 49 &&
    value.oracle.candidateFractions.length === 49 &&
    value.oracle.randomnessUsed === false &&
    value.regretDefinition?.absoluteRegretIndependentOfAdditiveOverhead === true &&
    value.regretDefinition.relativeRegretDependsOnAdditiveOverheadNormalization === true &&
    value.regretDefinition.gridCoverageIsProbability === false &&
    value.regretDefinition.priorUsed === false &&
    validDisplayGeometry(value.displayGeometry) &&
    value.regretAudits?.overheadAbsoluteRegretInvarianceComparisons === 36750 &&
    value.regretAudits.relativeRegretOverheadMonotonicityComparisons === 36750 &&
    value.regretAudits.descriptiveMinimaxPromotedToRecommendation === false &&
    value.selectionBoundary?.modelPriorAvailable === false &&
    value.selectionBoundary.recommendedAllocationAvailable === false &&
    value.selectionBoundary.operationalSchedulingAllowed === false &&
    value.acquisitionBoundary?.readyMeasuredFileCount === 0 &&
    value.acquisitionBoundary.numericalScienceErrorBarsAvailable === false &&
    value.counts?.regretEvaluationCount === 49000 &&
    value.counts.scientificGeometryInputCount === 148 &&
    Object.values(value.maxima ?? {}).every(
      (entry) => validDecimal(entry) && Number(entry) < Number(value.limits?.multiprecisionResidual),
    ) &&
    value.qualification?.allocationRegretAtlasQualified === true &&
    value.qualification.operationalDecisionModelQualified === false &&
    value.qualification.recommendedAllocationQualified === false &&
    value.boundary?.denseCampaignStatus === "incomplete-0-of-49" &&
    value.boundary.browserQualification === "not-run" &&
    value.boundary.formalProductPointer === "v263" &&
    value.boundary.formalDefaultKernel === "legacy-eih-1pn" &&
    SHA.test(value.artifactSha256 ?? "")
  );
}
const validFamily = (value: KerrAllocationRegretFamilyV530) =>
  value.candidateCount === 49 &&
  value.sourceGridCellCount === 500 &&
  value.candidateEnvelope.length === 49 &&
  value.candidateEnvelope.every(validCandidate) &&
  value.descriptiveAbsoluteMinimax.recommended === false &&
  value.descriptiveRelativeMinimax.recommended === false &&
  value.selectionBoundary.priorAvailable === false &&
  value.selectionBoundary.gridCoverageIsProbability === false &&
  value.selectionBoundary.operationalSelectionAllowed === false;
export function parseKerrAllocationRegretArtifactV530(
  value: unknown,
): KerrAllocationRegretArtifactV530 {
  if (!isRecord(value)) throw new Error("v530-regret-shape");
  const artifact = value as Partial<KerrAllocationRegretArtifactV530>;
  if (
    !validateCore(artifact) ||
    !artifact.stochasticRegretAtlas ||
    !artifact.deterministicRegretAtlas ||
    !validFamily(artifact.stochasticRegretAtlas) ||
    !validFamily(artifact.deterministicRegretAtlas) ||
    !Array.isArray(artifact.sourceManifest) ||
    artifact.sourceManifest.some((entry) => !entry.path || !SHA.test(entry.sha256)) ||
    !SHA.test(artifact.sourceSha256 ?? "")
  ) {
    throw new Error("v530-regret-boundary");
  }
  return artifact as KerrAllocationRegretArtifactV530;
}
const freezeCandidates = (rows: readonly KerrAllocationRegretCandidateV530[]) =>
  Object.freeze(rows.map((row) => Object.freeze({ ...row })));
const freezeLattice = (rows: readonly KerrAllocationOptimalLatticeRowV530[]) =>
  Object.freeze(rows.map((row) => Object.freeze({ ...row })));
const descriptor = (atlas: KerrAllocationRegretFamilyV530) =>
  Object.freeze({
    family: atlas.family,
    candidateCount: atlas.candidateCount,
    sourceGridCellCount: atlas.sourceGridCellCount,
    descriptiveAbsoluteMinimax: atlas.descriptiveAbsoluteMinimax,
    descriptiveRelativeMinimax: atlas.descriptiveRelativeMinimax,
    sourceOptimalFractionRange: atlas.sourceOptimalFractionRange,
    selectionBoundary: atlas.selectionBoundary,
  });
export function createKerrAllocationRegretSummaryV530(
  value: unknown,
): KerrAllocationRegretSummaryV530 {
  const artifact = parseKerrAllocationRegretArtifactV530(value);
  const displayGeometry = Object.freeze({
    stochasticCandidateEnvelope: freezeCandidates(
      artifact.displayGeometry.stochasticCandidateEnvelope,
    ),
    deterministicCandidateEnvelope: freezeCandidates(
      artifact.displayGeometry.deterministicCandidateEnvelope,
    ),
    stochasticOptimalFractionLattice: freezeLattice(
      artifact.displayGeometry.stochasticOptimalFractionLattice,
    ),
    deterministicOptimalFractionLattice: freezeLattice(
      artifact.displayGeometry.deterministicOptimalFractionLattice,
    ),
    scientificGeometryInputCount: 148 as const,
  });
  return Object.freeze({
    version: artifact.version,
    status: artifact.status,
    source: artifact.source,
    oracle: artifact.oracle,
    regretDefinition: artifact.regretDefinition,
    displayGeometry,
    regretAudits: artifact.regretAudits,
    selectionBoundary: artifact.selectionBoundary,
    acquisitionBoundary: artifact.acquisitionBoundary,
    counts: artifact.counts,
    maxima: artifact.maxima,
    limits: artifact.limits,
    qualification: artifact.qualification,
    boundary: artifact.boundary,
    artifactSha256: artifact.artifactSha256,
    stochasticDescriptor: descriptor(artifact.stochasticRegretAtlas),
    deterministicDescriptor: descriptor(artifact.deterministicRegretAtlas),
  });
}
export function parseKerrAllocationRegretApiV530(value: unknown): KerrAllocationRegretApiV530 {
  if (
    !isRecord(value) ||
    value.version !== KERR_ALLOCATION_REGRET_API_VERSION_V530 ||
    typeof value.available !== "boolean" ||
    !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt"].includes(
      String(value.reason),
    )
  ) {
    throw new Error("v530-api-boundary");
  }
  if (value.available) {
    if (!isRecord(value.summary) || !validateCore(value.summary)) throw new Error("v530-api-summary");
  } else if (value.summary !== null) {
    throw new Error("v530-api-unavailable-summary");
  }
  return value as unknown as KerrAllocationRegretApiV530;
}
export function createKerrAllocationRegretHudEncodingV530(
  summary: KerrAllocationRegretSummaryV530,
  mode: KerrAllocationRegretHudModeV530,
) {
  if (!SHA.test(summary.artifactSha256)) throw new Error("v530-hud-source");
  return Object.freeze({
    version: "v530-kerr-allocation-regret-hud-encoding-v1" as const,
    profileId: KERR_ALLOCATION_REGRET_HUD_PROFILE_ID_V530,
    mode,
    scientificPayloadKey: summary.artifactSha256,
    scientificGeometry: summary.displayGeometry,
    scientificGeometryInputCount: 148 as const,
    numericScientificStyleInputCount: 0 as const,
    regretDrivesStyle: false as const,
    minimaxDrivesStyle: false as const,
    fragilityDrivesStyle: false as const,
    scientificFieldMutation: false as const,
  });
}
export function compareKerrAllocationRegretHudEncodingsV530(
  science: ReturnType<typeof createKerrAllocationRegretHudEncodingV530>,
  cinematic: ReturnType<typeof createKerrAllocationRegretHudEncodingV530>,
) {
  if (
    science.mode !== "science" ||
    cinematic.mode !== "cinematic" ||
    science.scientificPayloadKey !== cinematic.scientificPayloadKey ||
    JSON.stringify(science.scientificGeometry) !== JSON.stringify(cinematic.scientificGeometry) ||
    science.scientificGeometryInputCount !== 148 ||
    cinematic.scientificGeometryInputCount !== 148 ||
    science.numericScientificStyleInputCount !== 0 ||
    cinematic.numericScientificStyleInputCount !== 0
  ) {
    throw new Error("v530-hud-boundary");
  }
  return Object.freeze({
    scientificPayloadStable: true as const,
    scientificGeometryStable: true as const,
    scientificGeometryInputCount: 148 as const,
    numericScientificStyleInputCount: 0 as const,
    scientificFieldMutation: false as const,
  });
}

export const KERR_CALIBRATION_EXCITATION_DESIGN_VERSION_V525 =
  "v525-kerr-calibration-excitation-design-v1" as const;
export const KERR_CALIBRATION_EXCITATION_DESIGN_API_VERSION_V525 =
  "v525-kerr-calibration-excitation-design-api-v1" as const;
export const KERR_CALIBRATION_DESIGN_HUD_PROFILE_ID_V525 =
  "science-cinematic-v7r4-v525" as const;

export type KerrCalibrationDesignHudModeV525 = "science" | "cinematic";
export type KerrCalibrationDesignHudProfileV525 = Readonly<{
  id: typeof KERR_CALIBRATION_DESIGN_HUD_PROFILE_ID_V525;
  mode: KerrCalibrationDesignHudModeV525;
  localShadowOnly: true;
  defaultApplied: false;
  panel: string;
  panelRaised: string;
  ink: string;
  muted: string;
  grid: string;
  base: string;
  constraint: string;
  qualified: string;
  unavailable: string;
  railOpacity: number;
  nodeGlowOpacity: number;
  scienceBoundary: Readonly<{
    linearDisplay: boolean;
    bloomIntensity: number;
    colorGradeIntensity: number;
    numericScientificStyleInputCount: 0;
    rankDrivesStyle: false;
    conditionNumberDrivesStyle: false;
    determinantDrivesStyle: false;
    nullityDrivesStyle: false;
    scientificFieldMutation: false;
  }>;
  cinematicSeed: string | null;
}>;

export type KerrCalibrationConstraintV525 = Readonly<{
  id: string;
  semantics: string;
  values: readonly string[];
  rankWithBase: number;
  nullityWithBase: number;
  nullspaceCouplingRank: number;
  measuredValueAvailable: false;
}>;

export type KerrCalibrationPairV525 = Readonly<{
  constraintIds: readonly [string, string];
  rank: number;
  nullity: number;
  fullRank: boolean;
  gramDeterminant: string;
  conditionNumber: string | null;
  nullspaceCouplingRank: number;
}>;

export type KerrCalibrationExcitationDesignArtifactV525 = Readonly<{
  version: typeof KERR_CALIBRATION_EXCITATION_DESIGN_VERSION_V525;
  generatedAt: string;
  status: "minimal-two-constraint-design-qualified-measured-acquisition-unavailable";
  source: Readonly<{
    v524ArtifactSha256: string;
    v511ArtifactSha256: string;
    v458ArtifactSha256: string;
    v314StateSha256: string;
  }>;
  oracle: Readonly<{
    backend: "mpmath-1.3.0";
    decimalDigits: 80;
    svdAlgorithm: "mpmath-arbitrary-precision-svd";
    exhaustivePairEnumeration: true;
    randomnessUsed: false;
  }>;
  parameterLabels: readonly string[];
  baseDesign: Readonly<{
    rowCount: 4;
    columnCount: 6;
    rank: 4;
    nullity: 2;
    values: readonly (readonly string[])[];
    sourceNullspaceSha256: string;
  }>;
  candidateConstraints: readonly KerrCalibrationConstraintV525[];
  pairEnumeration: readonly KerrCalibrationPairV525[];
  selectedDesign: Readonly<{
    constraintIds: readonly ["delta-q-pair", "delta-u-pair"];
    constraintCount: 2;
    minimumConstraintCount: 2;
    minimumProof: string;
    matrix: readonly (readonly string[])[];
    rank: 6;
    nullity: 0;
    singularValues: readonly string[];
    conditionNumber: string;
    analyticConditionNumber: string;
    gramDeterminant: string;
    nullspaceCouplingRank: 2;
    nullspaceCouplingDeterminant: string;
    uniqueDOptimalWithinCandidateSet: true;
    constraintValuesAvailable: false;
    scienceRecoveryExecutable: false;
  }>;
  acquisitionBoundary: Readonly<{
    algebraicConstraintCount: 2;
    measuredFileContractCount: 6;
    countsAreDistinctContracts: true;
    requiredMeasuredFileIds: readonly string[];
    readyMeasuredFileCount: 0;
    missingMeasuredFileCount: 6;
    measuredCalibrationRows: 0;
    selectedConstraintValuesAvailable: false;
    designReplacesMeasuredAcquisition: false;
  }>;
  counts: Readonly<{
    candidateConstraintCount: 8;
    candidatePairCount: 28;
    fullRankPairCount: 9;
    uniqueDOptimalPairCount: 1;
    selectedConstraintCount: 2;
    measuredCalibrationFileCount: 0;
    requiredMeasuredCalibrationFileCount: 6;
    expectedElectronCountRowCount: 0;
    observedCountRowCount: 0;
    sciencePixelRowCount: 0;
  }>;
  maxima: Readonly<Record<string, string>>;
  limits: Readonly<{ multiprecisionResidual: string }>;
  qualification: Readonly<{
    minimumConstraintLowerBoundQualified: true;
    exhaustiveCandidatePairEnumerationQualified: true;
    selectedDesignFullRankQualified: true;
    selectedDesignUniqueDOptimalWithinCandidateSet: true;
    calibrationDesignQualified: true;
    measuredCalibrationQualified: false;
    measuredInstrumentQualified: false;
    scienceAuthorityPromotionAllowed: false;
  }>;
  boundary: Readonly<{
    reducedLinearizedBiasFixtureOnly: true;
    candidateSetOptimalityOnly: true;
    physicalCalibrationPriorAvailable: false;
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

export type KerrCalibrationExcitationDesignSummaryV525 = Pick<
  KerrCalibrationExcitationDesignArtifactV525,
  | "version"
  | "status"
  | "source"
  | "oracle"
  | "baseDesign"
  | "candidateConstraints"
  | "selectedDesign"
  | "acquisitionBoundary"
  | "counts"
  | "maxima"
  | "limits"
  | "qualification"
  | "boundary"
  | "artifactSha256"
>;

export type KerrCalibrationExcitationDesignApiV525 = Readonly<{
  version: typeof KERR_CALIBRATION_EXCITATION_DESIGN_API_VERSION_V525;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt";
  summary: KerrCalibrationExcitationDesignSummaryV525 | null;
}>;

const scienceProfile: KerrCalibrationDesignHudProfileV525 = Object.freeze({
  id: KERR_CALIBRATION_DESIGN_HUD_PROFILE_ID_V525,
  mode: "science",
  localShadowOnly: true,
  defaultApplied: false,
  panel: "#02080b",
  panelRaised: "#07151a",
  ink: "#e0fcff",
  muted: "#77969d",
  grid: "rgba(107,231,240,.075)",
  base: "#ffcf8b",
  constraint: "#8fdcff",
  qualified: "#92f4d2",
  unavailable: "#ff91a8",
  railOpacity: 0.66,
  nodeGlowOpacity: 0,
  scienceBoundary: Object.freeze({
    linearDisplay: true,
    bloomIntensity: 0,
    colorGradeIntensity: 0,
    numericScientificStyleInputCount: 0,
    rankDrivesStyle: false,
    conditionNumberDrivesStyle: false,
    determinantDrivesStyle: false,
    nullityDrivesStyle: false,
    scientificFieldMutation: false,
  }),
  cinematicSeed: null,
});
const cinematicProfile: KerrCalibrationDesignHudProfileV525 = Object.freeze({
  id: KERR_CALIBRATION_DESIGN_HUD_PROFILE_ID_V525,
  mode: "cinematic",
  localShadowOnly: true,
  defaultApplied: false,
  panel: "#0d0807",
  panelRaised: "#1a110d",
  ink: "#fff2d5",
  muted: "#ac9074",
  grid: "rgba(255,195,108,.07)",
  base: "#ffb875",
  constraint: "#8fdcff",
  qualified: "#b3ffd9",
  unavailable: "#ff91b2",
  railOpacity: 0.48,
  nodeGlowOpacity: 0.22,
  scienceBoundary: Object.freeze({
    linearDisplay: false,
    bloomIntensity: 0.11,
    colorGradeIntensity: 0.075,
    numericScientificStyleInputCount: 0,
    rankDrivesStyle: false,
    conditionNumberDrivesStyle: false,
    determinantDrivesStyle: false,
    nullityDrivesStyle: false,
    scientificFieldMutation: false,
  }),
  cinematicSeed: "orbit-atlas-v525-calibration-design-hud-seed-01",
});
export const resolveKerrCalibrationDesignHudProfileV525 = (
  mode: KerrCalibrationDesignHudModeV525,
) => mode === "science" ? scienceProfile : cinematicProfile;

const SHA = /^[a-f0-9]{64}$/;
const DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
const transient = new Set(["generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256"]);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : !isRecord(value)
    ? value
    : Object.fromEntries(Object.entries(value)
      .filter(([key]) => !transient.has(key))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => [key, canonicalize(entry)]));
export const canonicalKerrCalibrationExcitationDesignV525 = (value: unknown) =>
  JSON.stringify(canonicalize(value));
const validDecimal = (value: unknown) =>
  typeof value === "string" && DECIMAL.test(value) && Number.isFinite(Number(value));

function validateCore(value: Partial<KerrCalibrationExcitationDesignArtifactV525>) {
  return value.version === KERR_CALIBRATION_EXCITATION_DESIGN_VERSION_V525
    && value.status === "minimal-two-constraint-design-qualified-measured-acquisition-unavailable"
    && Object.values(value.source ?? {}).every((entry) => SHA.test(entry))
    && value.oracle?.backend === "mpmath-1.3.0"
    && value.oracle.decimalDigits === 80
    && value.oracle.exhaustivePairEnumeration === true
    && value.oracle.randomnessUsed === false
    && value.baseDesign?.rank === 4
    && value.baseDesign.nullity === 2
    && value.selectedDesign?.constraintIds.join("|") === "delta-q-pair|delta-u-pair"
    && value.selectedDesign.minimumConstraintCount === 2
    && value.selectedDesign.rank === 6
    && value.selectedDesign.nullity === 0
    && value.selectedDesign.nullspaceCouplingRank === 2
    && value.selectedDesign.uniqueDOptimalWithinCandidateSet === true
    && value.selectedDesign.constraintValuesAvailable === false
    && value.selectedDesign.scienceRecoveryExecutable === false
    && value.acquisitionBoundary?.algebraicConstraintCount === 2
    && value.acquisitionBoundary.measuredFileContractCount === 6
    && value.acquisitionBoundary.countsAreDistinctContracts === true
    && value.acquisitionBoundary.readyMeasuredFileCount === 0
    && value.acquisitionBoundary.designReplacesMeasuredAcquisition === false
    && value.counts?.candidateConstraintCount === 8
    && value.counts.candidatePairCount === 28
    && value.counts.fullRankPairCount === 9
    && value.counts.uniqueDOptimalPairCount === 1
    && value.counts.measuredCalibrationFileCount === 0
    && Object.values(value.maxima ?? {}).every((entry) =>
      validDecimal(entry) && Number(entry) < Number(value.limits?.multiprecisionResidual))
    && value.qualification?.calibrationDesignQualified === true
    && value.qualification.measuredCalibrationQualified === false
    && value.qualification.measuredInstrumentQualified === false
    && value.qualification.scienceAuthorityPromotionAllowed === false
    && value.boundary?.measuredCalibrationAvailable === false
    && value.boundary.expectedElectronCountsAvailable === false
    && value.boundary.scienceRasterAuthorityAvailable === false
    && value.boundary.denseCampaignStatus === "incomplete-0-of-49"
    && value.boundary.browserQualification === "not-run"
    && value.boundary.formalProductPointer === "v263"
    && value.boundary.formalDefaultKernel === "legacy-eih-1pn"
    && SHA.test(value.artifactSha256 ?? "");
}

export function parseKerrCalibrationExcitationDesignArtifactV525(
  value: unknown,
): KerrCalibrationExcitationDesignArtifactV525 {
  if (!isRecord(value)) throw new Error("v525-calibration-design-shape");
  const artifact = value as Partial<KerrCalibrationExcitationDesignArtifactV525>;
  if (
    !validateCore(artifact)
    || artifact.candidateConstraints?.length !== 8
    || artifact.pairEnumeration?.length !== 28
    || artifact.pairEnumeration.filter((entry) => entry.fullRank).length !== 9
    || artifact.selectedDesign?.matrix.length !== 6
    || artifact.selectedDesign.matrix.some((row) => row.length !== 6 || row.some((entry) => !validDecimal(entry)))
    || !validDecimal(artifact.selectedDesign.conditionNumber)
    || !validDecimal(artifact.selectedDesign.gramDeterminant)
    || artifact.acquisitionBoundary?.requiredMeasuredFileIds.join("|") !== "identity|plate-scale|distortion|psf|pixel-response|provenance"
    || !Array.isArray(artifact.sourceManifest)
    || artifact.sourceManifest.some((entry) => !entry.path || !SHA.test(entry.sha256))
    || !SHA.test(artifact.sourceSha256 ?? "")
  ) throw new Error("v525-calibration-design-boundary");
  return artifact as KerrCalibrationExcitationDesignArtifactV525;
}

export function createKerrCalibrationExcitationDesignSummaryV525(
  value: unknown,
): KerrCalibrationExcitationDesignSummaryV525 {
  const artifact = parseKerrCalibrationExcitationDesignArtifactV525(value);
  return Object.freeze({
    version: artifact.version,
    status: artifact.status,
    source: artifact.source,
    oracle: artifact.oracle,
    baseDesign: artifact.baseDesign,
    candidateConstraints: artifact.candidateConstraints,
    selectedDesign: artifact.selectedDesign,
    acquisitionBoundary: artifact.acquisitionBoundary,
    counts: artifact.counts,
    maxima: artifact.maxima,
    limits: artifact.limits,
    qualification: artifact.qualification,
    boundary: artifact.boundary,
    artifactSha256: artifact.artifactSha256,
  });
}

export function parseKerrCalibrationExcitationDesignApiV525(
  value: unknown,
): KerrCalibrationExcitationDesignApiV525 {
  if (
    !isRecord(value)
    || value.version !== KERR_CALIBRATION_EXCITATION_DESIGN_API_VERSION_V525
    || typeof value.available !== "boolean"
    || !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt"].includes(String(value.reason))
  ) throw new Error("v525-api-boundary");
  if (value.available) {
    if (!isRecord(value.summary) || !validateCore(value.summary)) {
      throw new Error("v525-api-summary");
    }
  } else if (value.summary !== null) throw new Error("v525-api-unavailable-summary");
  return value as unknown as KerrCalibrationExcitationDesignApiV525;
}

export function createKerrCalibrationDesignHudEncodingV525(
  summary: KerrCalibrationExcitationDesignSummaryV525,
  mode: KerrCalibrationDesignHudModeV525,
) {
  if (!SHA.test(summary.artifactSha256)) throw new Error("v525-hud-source");
  return Object.freeze({
    version: "v525-kerr-calibration-design-hud-encoding-v1" as const,
    profileId: KERR_CALIBRATION_DESIGN_HUD_PROFILE_ID_V525,
    mode,
    scientificPayloadKey: summary.artifactSha256,
    rows: Object.freeze([
      { id: "base", rank: summary.baseDesign.rank, nullity: summary.baseDesign.nullity, measured: false as const },
      { id: summary.selectedDesign.constraintIds[0], rank: 5, nullity: 1, measured: false as const },
      { id: summary.selectedDesign.constraintIds[1], rank: 5, nullity: 1, measured: false as const },
      { id: "combined", rank: summary.selectedDesign.rank, nullity: summary.selectedDesign.nullity, measured: false as const },
    ]),
    numericScientificStyleInputCount: 0 as const,
    rankDrivesStyle: false as const,
    conditionNumberDrivesStyle: false as const,
    determinantDrivesStyle: false as const,
    nullityDrivesStyle: false as const,
    scientificFieldMutation: false as const,
  });
}

export function compareKerrCalibrationDesignHudEncodingsV525(
  science: ReturnType<typeof createKerrCalibrationDesignHudEncodingV525>,
  cinematic: ReturnType<typeof createKerrCalibrationDesignHudEncodingV525>,
) {
  if (
    science.mode !== "science"
    || cinematic.mode !== "cinematic"
    || science.scientificPayloadKey !== cinematic.scientificPayloadKey
    || JSON.stringify(science.rows) !== JSON.stringify(cinematic.rows)
    || science.numericScientificStyleInputCount !== 0
    || cinematic.numericScientificStyleInputCount !== 0
  ) throw new Error("v525-hud-boundary");
  return Object.freeze({
    scientificPayloadStable: true as const,
    scientificRowsStable: true as const,
    numericScientificStyleInputCount: 0 as const,
    scientificFieldMutation: false as const,
  });
}

export const KERR_ANALYZER_IDENTIFIABILITY_VERSION_V524 =
  "v524-kerr-analyzer-identifiability-and-nullspace-v1" as const;
export const KERR_ANALYZER_IDENTIFIABILITY_API_VERSION_V524 =
  "v524-kerr-analyzer-identifiability-and-nullspace-api-v1" as const;
export const KERR_INSTRUMENT_HUD_PROFILE_ID_V524 =
  "science-cinematic-v7r3-v524" as const;

export type KerrInstrumentHudModeV524 = "science" | "cinematic";
export type KerrInstrumentHudProfileV524 = Readonly<{
  id: typeof KERR_INSTRUMENT_HUD_PROFILE_ID_V524;
  mode: KerrInstrumentHudModeV524;
  localShadowOnly: true;
  defaultApplied: false;
  panel: string;
  panelRaised: string;
  ink: string;
  muted: string;
  grid: string;
  identifiable: string;
  nullspace: string;
  blocked: string;
  railOpacity: number;
  nodeGlowOpacity: number;
  scienceBoundary: Readonly<{
    linearDisplay: boolean;
    bloomIntensity: number;
    colorGradeIntensity: number;
    numericScientificStyleInputCount: 0;
    rankDrivesStyle: false;
    conditionNumberDrivesStyle: false;
    nullityDrivesStyle: false;
    scientificFieldMutation: false;
  }>;
  cinematicSeed: string | null;
}>;

export type KerrAnalyzerDiagnosticV524 = Readonly<{
  rank: number;
  columnCount: number;
  nullity: number;
  singularValues: readonly string[];
  conditionNumber?: string;
  conditionNumberOnRowSpace?: string;
  scienceStokesIdentifiable?: boolean;
  normalizedLinearStokesIdentifiable?: boolean;
  jointScienceAndBiasIdentifiable?: boolean;
}>;

export type KerrAnalyzerIdentifiabilityArtifactV524 = Readonly<{
  version: typeof KERR_ANALYZER_IDENTIFIABILITY_VERSION_V524;
  generatedAt: string;
  status: "ideal-operator-ranked-calibration-nullspace-exposed-measured-authority-unavailable";
  source: Readonly<{ v523ArtifactSha256: string; v523AnalyzerPlanSha256: string }>;
  oracle: Readonly<{
    backend: "mpmath-1.3.0";
    decimalDigits: 80;
    svdAlgorithm: "mpmath-arbitrary-precision-svd";
    analyticGramOracle: true;
    randomnessUsed: false;
  }>;
  matrices: Readonly<Record<string, Readonly<{
    rowLabels: readonly string[];
    columnLabels: readonly string[];
    values: readonly (readonly string[])[];
  }>>>;
  diagnostics: Readonly<{
    idealDualBeam8x3: KerrAnalyzerDiagnosticV524;
    normalizedDifference4x2: KerrAnalyzerDiagnosticV524;
    uncalibratedBiasAugmented4x6: KerrAnalyzerDiagnosticV524;
  }>;
  nullspace: Readonly<{
    basisColumnCount: 2;
    parameterLabels: readonly string[];
    basis: readonly (readonly string[])[];
    interpretation: readonly string[];
    measuredCalibrationRequired: true;
  }>;
  counts: Readonly<{
    matrixCount: 3;
    svdCount: 3;
    singularValueCount: 9;
    nullspaceDimension: 2;
    nullspaceBasisVectorCount: 2;
    measuredCalibrationFileCount: 0;
    expectedElectronCountRowCount: 0;
    observedCountRowCount: 0;
    sciencePixelRowCount: 0;
  }>;
  maxima: Readonly<Record<string, string>>;
  limits: Readonly<{ multiprecisionResidual: string }>;
  qualification: Readonly<{
    idealBeamOperatorRankQualified: true;
    normalizedDifferenceOperatorRankQualified: true;
    analyticSvdAgreementQualified: true;
    pseudoinverseQualified: true;
    calibrationNullspaceExposed: true;
    jointScienceCalibrationIdentifiabilityQualified: false;
    measuredInstrumentQualified: false;
    scienceAuthorityPromotionAllowed: false;
  }>;
  boundary: Readonly<{
    reducedLinearizedBiasFixtureOnly: true;
    fullInstrumentMuellerModelAvailable: false;
    physicalCalibrationPriorAvailable: false;
    measuredCalibrationAvailable: false;
    expectedElectronCountsAvailable: false;
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

export type KerrAnalyzerIdentifiabilitySummaryV524 = Pick<
  KerrAnalyzerIdentifiabilityArtifactV524,
  | "version" | "status" | "source" | "oracle" | "diagnostics" | "nullspace"
  | "counts" | "maxima" | "limits" | "qualification" | "boundary" | "artifactSha256"
>;
export type KerrAnalyzerIdentifiabilityApiV524 = Readonly<{
  version: typeof KERR_ANALYZER_IDENTIFIABILITY_API_VERSION_V524;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt";
  summary: KerrAnalyzerIdentifiabilitySummaryV524 | null;
}>;

const scienceProfile: KerrInstrumentHudProfileV524 = Object.freeze({
  id: KERR_INSTRUMENT_HUD_PROFILE_ID_V524, mode: "science", localShadowOnly: true, defaultApplied: false,
  panel: "#02090d", panelRaised: "#06141a", ink: "#ddfbff", muted: "#76959e", grid: "rgba(105,229,240,.08)", identifiable: "#8df5e2", nullspace: "#ffd08a", blocked: "#ff91a4", railOpacity: 0.68, nodeGlowOpacity: 0,
  scienceBoundary: Object.freeze({ linearDisplay: true, bloomIntensity: 0, colorGradeIntensity: 0, numericScientificStyleInputCount: 0, rankDrivesStyle: false, conditionNumberDrivesStyle: false, nullityDrivesStyle: false, scientificFieldMutation: false }), cinematicSeed: null,
});
const cinematicProfile: KerrInstrumentHudProfileV524 = Object.freeze({
  id: KERR_INSTRUMENT_HUD_PROFILE_ID_V524, mode: "cinematic", localShadowOnly: true, defaultApplied: false,
  panel: "#0d0807", panelRaised: "#18100c", ink: "#fff1d1", muted: "#aa8d70", grid: "rgba(255,194,104,.075)", identifiable: "#b8ffe5", nullspace: "#ffc56f", blocked: "#ff91b2", railOpacity: 0.5, nodeGlowOpacity: 0.2,
  scienceBoundary: Object.freeze({ linearDisplay: false, bloomIntensity: 0.12, colorGradeIntensity: 0.08, numericScientificStyleInputCount: 0, rankDrivesStyle: false, conditionNumberDrivesStyle: false, nullityDrivesStyle: false, scientificFieldMutation: false }), cinematicSeed: "orbit-atlas-v524-instrument-hud-seed-01",
});
export const resolveKerrInstrumentHudProfileV524 = (mode: KerrInstrumentHudModeV524) =>
  mode === "science" ? scienceProfile : cinematicProfile;

const SHA = /^[a-f0-9]{64}$/;
const DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
const transient = new Set(["generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256"]);
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !isRecord(value) ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]));
export const canonicalKerrAnalyzerIdentifiabilityV524 = (value: unknown) => JSON.stringify(canonicalize(value));
const validDecimal = (value: unknown) => typeof value === "string" && DECIMAL.test(value) && Number.isFinite(Number(value));

function validateCore(value: Partial<KerrAnalyzerIdentifiabilityArtifactV524>) {
  const diagnostics = value.diagnostics;
  return value.version === KERR_ANALYZER_IDENTIFIABILITY_VERSION_V524 && value.status === "ideal-operator-ranked-calibration-nullspace-exposed-measured-authority-unavailable" && Boolean(value.source) && Object.values(value.source ?? {}).every((entry) => SHA.test(entry)) && value.oracle?.backend === "mpmath-1.3.0" && value.oracle.decimalDigits === 80 && value.oracle.analyticGramOracle === true && value.oracle.randomnessUsed === false && diagnostics?.idealDualBeam8x3.rank === 3 && diagnostics.idealDualBeam8x3.nullity === 0 && diagnostics.idealDualBeam8x3.scienceStokesIdentifiable === true && diagnostics.normalizedDifference4x2.rank === 2 && diagnostics.normalizedDifference4x2.nullity === 0 && diagnostics.normalizedDifference4x2.normalizedLinearStokesIdentifiable === true && diagnostics.uncalibratedBiasAugmented4x6.rank === 4 && diagnostics.uncalibratedBiasAugmented4x6.nullity === 2 && diagnostics.uncalibratedBiasAugmented4x6.jointScienceAndBiasIdentifiable === false && value.nullspace?.basisColumnCount === 2 && value.nullspace.measuredCalibrationRequired === true && value.counts?.matrixCount === 3 && value.counts.svdCount === 3 && value.counts.singularValueCount === 9 && value.counts.nullspaceDimension === 2 && value.counts.measuredCalibrationFileCount === 0 && Object.values(value.maxima ?? {}).every((entry) => validDecimal(entry) && Number(entry) < Number(value.limits?.multiprecisionResidual)) && value.qualification?.calibrationNullspaceExposed === true && value.qualification.jointScienceCalibrationIdentifiabilityQualified === false && value.qualification.measuredInstrumentQualified === false && value.qualification.scienceAuthorityPromotionAllowed === false && value.boundary?.fullInstrumentMuellerModelAvailable === false && value.boundary.measuredCalibrationAvailable === false && value.boundary.expectedElectronCountsAvailable === false && value.boundary.scienceRasterAuthorityAvailable === false && value.boundary.denseCampaignStatus === "incomplete-0-of-49" && value.boundary.browserQualification === "not-run" && value.boundary.formalProductPointer === "v263" && value.boundary.formalDefaultKernel === "legacy-eih-1pn" && SHA.test(value.artifactSha256 ?? "");
}

export function parseKerrAnalyzerIdentifiabilityArtifactV524(value: unknown): KerrAnalyzerIdentifiabilityArtifactV524 {
  if (!isRecord(value)) throw new Error("v524-identifiability-shape");
  const artifact = value as Partial<KerrAnalyzerIdentifiabilityArtifactV524>;
  if (!validateCore(artifact) || !artifact.matrices || Object.keys(artifact.matrices).length !== 3 || Object.values(artifact.matrices).some((matrix: KerrAnalyzerIdentifiabilityArtifactV524["matrices"][string]) => matrix.values.some((row) => row.some((entry) => !validDecimal(entry)))) || !Array.isArray(artifact.nullspace?.basis) || artifact.nullspace.basis.length !== 6 || artifact.nullspace.basis.some((row) => row.length !== 2 || row.some((entry: unknown) => !validDecimal(entry))) || !Array.isArray(artifact.sourceManifest) || artifact.sourceManifest.some((entry) => !entry.path || !SHA.test(entry.sha256)) || !SHA.test(artifact.sourceSha256 ?? "")) throw new Error("v524-identifiability-boundary");
  return artifact as KerrAnalyzerIdentifiabilityArtifactV524;
}
export function createKerrAnalyzerIdentifiabilitySummaryV524(value: unknown): KerrAnalyzerIdentifiabilitySummaryV524 { const artifact = parseKerrAnalyzerIdentifiabilityArtifactV524(value); return Object.freeze({ version: artifact.version, status: artifact.status, source: artifact.source, oracle: artifact.oracle, diagnostics: artifact.diagnostics, nullspace: artifact.nullspace, counts: artifact.counts, maxima: artifact.maxima, limits: artifact.limits, qualification: artifact.qualification, boundary: artifact.boundary, artifactSha256: artifact.artifactSha256 }); }
export function parseKerrAnalyzerIdentifiabilityApiV524(value: unknown): KerrAnalyzerIdentifiabilityApiV524 { if (!isRecord(value) || value.version !== KERR_ANALYZER_IDENTIFIABILITY_API_VERSION_V524 || typeof value.available !== "boolean" || !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt"].includes(String(value.reason))) throw new Error("v524-api-boundary"); if (value.available) { if (!isRecord(value.summary) || !validateCore(value.summary)) throw new Error("v524-api-summary"); } else if (value.summary !== null) throw new Error("v524-api-unavailable-summary"); return value as unknown as KerrAnalyzerIdentifiabilityApiV524; }

export function createKerrInstrumentHudEncodingV524(summary: KerrAnalyzerIdentifiabilitySummaryV524, mode: KerrInstrumentHudModeV524) {
  if (!SHA.test(summary.artifactSha256)) throw new Error("v524-hud-source");
  return Object.freeze({ version: "v524-kerr-instrument-hud-encoding-v1" as const, profileId: KERR_INSTRUMENT_HUD_PROFILE_ID_V524, mode, scientificPayloadKey: summary.artifactSha256, rows: Object.freeze([{ id: "ideal-beam", status: "identifiable" as const, rank: summary.diagnostics.idealDualBeam8x3.rank, nullity: summary.diagnostics.idealDualBeam8x3.nullity }, { id: "normalized-difference", status: "identifiable" as const, rank: summary.diagnostics.normalizedDifference4x2.rank, nullity: summary.diagnostics.normalizedDifference4x2.nullity }, { id: "uncalibrated-augmented", status: "calibration-nullspace" as const, rank: summary.diagnostics.uncalibratedBiasAugmented4x6.rank, nullity: summary.diagnostics.uncalibratedBiasAugmented4x6.nullity }]), numericScientificStyleInputCount: 0 as const, rankDrivesStyle: false as const, conditionNumberDrivesStyle: false as const, nullityDrivesStyle: false as const, scientificFieldMutation: false as const });
}
export function compareKerrInstrumentHudEncodingsV524(science: ReturnType<typeof createKerrInstrumentHudEncodingV524>, cinematic: ReturnType<typeof createKerrInstrumentHudEncodingV524>) { if (science.mode !== "science" || cinematic.mode !== "cinematic" || science.scientificPayloadKey !== cinematic.scientificPayloadKey || JSON.stringify(science.rows) !== JSON.stringify(cinematic.rows) || science.numericScientificStyleInputCount !== 0 || cinematic.numericScientificStyleInputCount !== 0) throw new Error("v524-hud-boundary"); return Object.freeze({ scientificPayloadStable: true as const, scientificRowsStable: true as const, numericScientificStyleInputCount: 0 as const, scientificFieldMutation: false as const }); }

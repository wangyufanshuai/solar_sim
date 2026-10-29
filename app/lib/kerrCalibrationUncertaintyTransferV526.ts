export const KERR_CALIBRATION_UNCERTAINTY_TRANSFER_VERSION_V526 =
  "v526-kerr-calibration-uncertainty-transfer-v1" as const;
export const KERR_CALIBRATION_UNCERTAINTY_TRANSFER_API_VERSION_V526 =
  "v526-kerr-calibration-uncertainty-transfer-api-v1" as const;
export const KERR_CALIBRATION_UNCERTAINTY_HUD_PROFILE_ID_V526 =
  "science-cinematic-v7r5-v526" as const;

export type KerrCalibrationUncertaintyHudModeV526 = "science" | "cinematic";
export type KerrCalibrationUncertaintyHudProfileV526 = Readonly<{
  id: typeof KERR_CALIBRATION_UNCERTAINTY_HUD_PROFILE_ID_V526;
  mode: KerrCalibrationUncertaintyHudModeV526;
  localShadowOnly: true;
  defaultApplied: false;
  panel: string;
  panelRaised: string;
  ink: string;
  muted: string;
  grid: string;
  scienceNoise: string;
  calibrationNoise: string;
  combined: string;
  unavailable: string;
  railOpacity: number;
  nodeGlowOpacity: number;
  scienceBoundary: Readonly<{
    linearDisplay: boolean;
    bloomIntensity: number;
    colorGradeIntensity: number;
    numericScientificStyleInputCount: 0;
    varianceDrivesStyle: false;
    correlationDrivesStyle: false;
    boundDrivesStyle: false;
    scientificFieldMutation: false;
  }>;
  cinematicSeed: string | null;
}>;

export type KerrCalibrationUncertaintyTransferArtifactV526 = Readonly<{
  version: typeof KERR_CALIBRATION_UNCERTAINTY_TRANSFER_VERSION_V526;
  generatedAt: string;
  status: "unit-uncertainty-transfer-qualified-measured-scale-unavailable";
  source: Readonly<{
    v525ArtifactSha256: string;
    v511ArtifactSha256: string;
    v458ArtifactSha256: string;
    v314StateSha256: string;
  }>;
  oracle: Readonly<{
    backend: "mpmath-1.3.0";
    decimalDigits: 80;
    matrixInverseAndCovariance: true;
    independentClosedFormObservableRows: true;
    deterministicUnitBoxVertexEnumeration: true;
    randomnessUsed: false;
  }>;
  inputChannelOrder: readonly string[];
  outputParameterOrder: readonly string[];
  estimatorMatrix: readonly (readonly string[])[];
  sourceQuantizationAudit: Readonly<{
    sourceSerializedDecimalDigits: 25;
    analyticMatrixReconstructed: true;
    maximumSourceDecimalAbsolute: string;
    limit: string;
    includedInMultiprecisionOracleResidual: false;
  }>;
  observableTransfer: Readonly<{
    parameterIds: readonly ["Q-over-I", "U-over-I"];
    coefficientRows: readonly (readonly string[])[];
    closedForm: readonly string[];
    rowL1Norms: readonly [string, string];
    rowL2Norms: readonly ["1.0", "1.0"];
  }>;
  unitVarianceTransfer: Readonly<{
    inputSemantics: string;
    scienceContribution: readonly (readonly string[])[];
    calibrationContribution: readonly (readonly string[])[];
    total: readonly (readonly string[])[];
    varianceRows: readonly Readonly<{
      parameterId: "Q-over-I" | "U-over-I";
      scienceCoefficient: "0.5";
      calibrationCoefficient: "0.5";
      totalCoefficient: "1.0";
      physicalVarianceAvailable: false;
    }>[];
  }>;
  correlatedConstraintStress: Readonly<{
    sampleCount: 5;
    samples: readonly Readonly<{
      constraintCorrelation: string;
      observableCorrelation: string;
      analyticObservableCorrelation: string;
      stressSampleOnlyNotPrior: true;
    }>[];
    closedForm: string;
    physicalCorrelationPriorAvailable: false;
  }>;
  boundedUnitErrorTransfer: Readonly<{
    inputSemantics: string;
    vertexCount: 64;
    maximumQOverIAbsoluteCoefficient: string;
    maximumUOverIAbsoluteCoefficient: string;
    maximumJointL2Coefficient: string;
    analyticScalarCoefficient: string;
    analyticJointL2Coefficient: string;
    maximizingVertexCount: number;
    physicalErrorBoundAvailable: false;
  }>;
  acquisitionBoundary: Readonly<{
    requiredMeasuredFileCount: 6;
    readyMeasuredFileCount: 0;
    measuredCalibrationRowCount: 0;
    scienceNoiseScaleAvailable: false;
    calibrationNoiseScaleAvailable: false;
    calibrationCorrelationPriorAvailable: false;
    numericalScienceCovarianceAvailable: false;
    numericalScienceErrorBarsAvailable: false;
    designTransferReplacesMeasuredUncertainty: false;
  }>;
  counts: Readonly<{
    inputChannelCount: 6;
    outputParameterCount: 6;
    observableParameterCount: 2;
    varianceComponentCount: 4;
    correlationStressSampleCount: 5;
    unitBoxVertexCount: 64;
    measuredCalibrationFileCount: 0;
    requiredMeasuredCalibrationFileCount: 6;
    expectedElectronCountRowCount: 0;
    observedCountRowCount: 0;
    sciencePixelRowCount: 0;
  }>;
  maxima: Readonly<Record<string, string>>;
  limits: Readonly<{
    multiprecisionResidual: string;
    sourceDecimalReconstruction: string;
  }>;
  qualification: Readonly<{
    matrixInverseQualified: true;
    closedFormObservableTransferQualified: true;
    unitVarianceDecompositionQualified: true;
    correlationStressTransferQualified: true;
    boundedUnitErrorTransferQualified: true;
    uncertaintyTransferQualified: true;
    physicalUncertaintyQualified: false;
    measuredInstrumentQualified: false;
    scienceAuthorityPromotionAllowed: false;
  }>;
  boundary: Readonly<{
    normalizedCoefficientAuditOnly: true;
    physicalNoiseModelAvailable: false;
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

export type KerrCalibrationUncertaintyTransferSummaryV526 = Pick<
  KerrCalibrationUncertaintyTransferArtifactV526,
  | "version"
  | "status"
  | "source"
  | "oracle"
  | "sourceQuantizationAudit"
  | "observableTransfer"
  | "unitVarianceTransfer"
  | "correlatedConstraintStress"
  | "boundedUnitErrorTransfer"
  | "acquisitionBoundary"
  | "counts"
  | "maxima"
  | "limits"
  | "qualification"
  | "boundary"
  | "artifactSha256"
>;
export type KerrCalibrationUncertaintyTransferApiV526 = Readonly<{
  version: typeof KERR_CALIBRATION_UNCERTAINTY_TRANSFER_API_VERSION_V526;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt";
  summary: KerrCalibrationUncertaintyTransferSummaryV526 | null;
}>;

const scienceProfile: KerrCalibrationUncertaintyHudProfileV526 = Object.freeze({
  id: KERR_CALIBRATION_UNCERTAINTY_HUD_PROFILE_ID_V526,
  mode: "science",
  localShadowOnly: true,
  defaultApplied: false,
  panel: "#02080c",
  panelRaised: "#06141a",
  ink: "#e2fbff",
  muted: "#78959d",
  grid: "rgba(109,225,240,.075)",
  scienceNoise: "#7ed8ff",
  calibrationNoise: "#ffc982",
  combined: "#92f4d2",
  unavailable: "#ff91aa",
  railOpacity: 0.65,
  nodeGlowOpacity: 0,
  scienceBoundary: Object.freeze({
    linearDisplay: true,
    bloomIntensity: 0,
    colorGradeIntensity: 0,
    numericScientificStyleInputCount: 0,
    varianceDrivesStyle: false,
    correlationDrivesStyle: false,
    boundDrivesStyle: false,
    scientificFieldMutation: false,
  }),
  cinematicSeed: null,
});
const cinematicProfile: KerrCalibrationUncertaintyHudProfileV526 = Object.freeze({
  id: KERR_CALIBRATION_UNCERTAINTY_HUD_PROFILE_ID_V526,
  mode: "cinematic",
  localShadowOnly: true,
  defaultApplied: false,
  panel: "#0e0808",
  panelRaised: "#1a1110",
  ink: "#fff2da",
  muted: "#ad9078",
  grid: "rgba(255,194,112,.07)",
  scienceNoise: "#8fddff",
  calibrationNoise: "#ffbd72",
  combined: "#b5ffdc",
  unavailable: "#ff91b4",
  railOpacity: 0.47,
  nodeGlowOpacity: 0.2,
  scienceBoundary: Object.freeze({
    linearDisplay: false,
    bloomIntensity: 0.1,
    colorGradeIntensity: 0.07,
    numericScientificStyleInputCount: 0,
    varianceDrivesStyle: false,
    correlationDrivesStyle: false,
    boundDrivesStyle: false,
    scientificFieldMutation: false,
  }),
  cinematicSeed: "orbit-atlas-v526-uncertainty-transfer-hud-seed-01",
});
export const resolveKerrCalibrationUncertaintyHudProfileV526 = (
  mode: KerrCalibrationUncertaintyHudModeV526,
) => mode === "science" ? scienceProfile : cinematicProfile;

const SHA = /^[a-f0-9]{64}$/;
const DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
const transient = new Set(["generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256"]);
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : !isRecord(value)
    ? value
    : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]));
export const canonicalKerrCalibrationUncertaintyTransferV526 = (value: unknown) => JSON.stringify(canonicalize(value));
const validDecimal = (value: unknown) => typeof value === "string" && DECIMAL.test(value) && Number.isFinite(Number(value));

function validateCore(value: Partial<KerrCalibrationUncertaintyTransferArtifactV526>) {
  return value.version === KERR_CALIBRATION_UNCERTAINTY_TRANSFER_VERSION_V526
    && value.status === "unit-uncertainty-transfer-qualified-measured-scale-unavailable"
    && Object.values(value.source ?? {}).every((entry) => SHA.test(entry))
    && value.oracle?.backend === "mpmath-1.3.0"
    && value.oracle.decimalDigits === 80
    && value.oracle.independentClosedFormObservableRows === true
    && value.oracle.deterministicUnitBoxVertexEnumeration === true
    && value.oracle.randomnessUsed === false
    && value.sourceQuantizationAudit?.sourceSerializedDecimalDigits === 25
    && value.sourceQuantizationAudit.analyticMatrixReconstructed === true
    && validDecimal(value.sourceQuantizationAudit.maximumSourceDecimalAbsolute)
    && Number(value.sourceQuantizationAudit.maximumSourceDecimalAbsolute) < Number(value.sourceQuantizationAudit.limit)
    && value.observableTransfer?.parameterIds.join("|") === "Q-over-I|U-over-I"
    && value.observableTransfer.coefficientRows.length === 2
    && value.unitVarianceTransfer?.varianceRows.length === 2
    && value.unitVarianceTransfer.varianceRows.every((row) => row.scienceCoefficient === "0.5" && row.calibrationCoefficient === "0.5" && row.totalCoefficient === "1.0" && row.physicalVarianceAvailable === false)
    && value.correlatedConstraintStress?.sampleCount === 5
    && value.correlatedConstraintStress.physicalCorrelationPriorAvailable === false
    && value.boundedUnitErrorTransfer?.vertexCount === 64
    && value.boundedUnitErrorTransfer.physicalErrorBoundAvailable === false
    && value.acquisitionBoundary?.requiredMeasuredFileCount === 6
    && value.acquisitionBoundary.readyMeasuredFileCount === 0
    && value.acquisitionBoundary.numericalScienceCovarianceAvailable === false
    && value.acquisitionBoundary.numericalScienceErrorBarsAvailable === false
    && value.counts?.inputChannelCount === 6
    && value.counts.outputParameterCount === 6
    && value.counts.observableParameterCount === 2
    && value.counts.unitBoxVertexCount === 64
    && Object.values(value.maxima ?? {}).every((entry) => validDecimal(entry) && Number(entry) < Number(value.limits?.multiprecisionResidual))
    && value.qualification?.uncertaintyTransferQualified === true
    && value.qualification.physicalUncertaintyQualified === false
    && value.qualification.measuredInstrumentQualified === false
    && value.qualification.scienceAuthorityPromotionAllowed === false
    && value.boundary?.normalizedCoefficientAuditOnly === true
    && value.boundary.measuredCalibrationAvailable === false
    && value.boundary.scienceRasterAuthorityAvailable === false
    && value.boundary.denseCampaignStatus === "incomplete-0-of-49"
    && value.boundary.browserQualification === "not-run"
    && value.boundary.formalProductPointer === "v263"
    && value.boundary.formalDefaultKernel === "legacy-eih-1pn"
    && SHA.test(value.artifactSha256 ?? "");
}

export function parseKerrCalibrationUncertaintyTransferArtifactV526(
  value: unknown,
): KerrCalibrationUncertaintyTransferArtifactV526 {
  if (!isRecord(value)) throw new Error("v526-uncertainty-transfer-shape");
  const artifact = value as Partial<KerrCalibrationUncertaintyTransferArtifactV526>;
  if (
    !validateCore(artifact)
    || artifact.estimatorMatrix?.length !== 6
    || artifact.estimatorMatrix.some((row) => row.length !== 6 || row.some((entry) => !validDecimal(entry)))
    || artifact.correlatedConstraintStress?.samples.length !== 5
    || !validDecimal(artifact.boundedUnitErrorTransfer?.maximumQOverIAbsoluteCoefficient)
    || !validDecimal(artifact.boundedUnitErrorTransfer?.maximumUOverIAbsoluteCoefficient)
    || !validDecimal(artifact.boundedUnitErrorTransfer?.maximumJointL2Coefficient)
    || !Array.isArray(artifact.sourceManifest)
    || artifact.sourceManifest.some((entry) => !entry.path || !SHA.test(entry.sha256))
    || !SHA.test(artifact.sourceSha256 ?? "")
  ) throw new Error("v526-uncertainty-transfer-boundary");
  return artifact as KerrCalibrationUncertaintyTransferArtifactV526;
}

export function createKerrCalibrationUncertaintyTransferSummaryV526(
  value: unknown,
): KerrCalibrationUncertaintyTransferSummaryV526 {
  const artifact = parseKerrCalibrationUncertaintyTransferArtifactV526(value);
  return Object.freeze({
    version: artifact.version,
    status: artifact.status,
    source: artifact.source,
    oracle: artifact.oracle,
    sourceQuantizationAudit: artifact.sourceQuantizationAudit,
    observableTransfer: artifact.observableTransfer,
    unitVarianceTransfer: artifact.unitVarianceTransfer,
    correlatedConstraintStress: artifact.correlatedConstraintStress,
    boundedUnitErrorTransfer: artifact.boundedUnitErrorTransfer,
    acquisitionBoundary: artifact.acquisitionBoundary,
    counts: artifact.counts,
    maxima: artifact.maxima,
    limits: artifact.limits,
    qualification: artifact.qualification,
    boundary: artifact.boundary,
    artifactSha256: artifact.artifactSha256,
  });
}

export function parseKerrCalibrationUncertaintyTransferApiV526(
  value: unknown,
): KerrCalibrationUncertaintyTransferApiV526 {
  if (!isRecord(value) || value.version !== KERR_CALIBRATION_UNCERTAINTY_TRANSFER_API_VERSION_V526 || typeof value.available !== "boolean" || !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt"].includes(String(value.reason))) throw new Error("v526-api-boundary");
  if (value.available) {
    if (!isRecord(value.summary) || !validateCore(value.summary)) throw new Error("v526-api-summary");
  } else if (value.summary !== null) throw new Error("v526-api-unavailable-summary");
  return value as unknown as KerrCalibrationUncertaintyTransferApiV526;
}

export function createKerrCalibrationUncertaintyHudEncodingV526(
  summary: KerrCalibrationUncertaintyTransferSummaryV526,
  mode: KerrCalibrationUncertaintyHudModeV526,
) {
  if (!SHA.test(summary.artifactSha256)) throw new Error("v526-hud-source");
  return Object.freeze({
    version: "v526-kerr-calibration-uncertainty-hud-encoding-v1" as const,
    profileId: KERR_CALIBRATION_UNCERTAINTY_HUD_PROFILE_ID_V526,
    mode,
    scientificPayloadKey: summary.artifactSha256,
    rows: Object.freeze([
      ...summary.unitVarianceTransfer.varianceRows.map((row) => ({ ...row })),
      { parameterId: "Q-over-I-bound", coefficient: summary.boundedUnitErrorTransfer.maximumQOverIAbsoluteCoefficient, physicalAvailable: false as const },
      { parameterId: "U-over-I-bound", coefficient: summary.boundedUnitErrorTransfer.maximumUOverIAbsoluteCoefficient, physicalAvailable: false as const },
    ]),
    numericScientificStyleInputCount: 0 as const,
    varianceDrivesStyle: false as const,
    correlationDrivesStyle: false as const,
    boundDrivesStyle: false as const,
    scientificFieldMutation: false as const,
  });
}

export function compareKerrCalibrationUncertaintyHudEncodingsV526(
  science: ReturnType<typeof createKerrCalibrationUncertaintyHudEncodingV526>,
  cinematic: ReturnType<typeof createKerrCalibrationUncertaintyHudEncodingV526>,
) {
  if (science.mode !== "science" || cinematic.mode !== "cinematic" || science.scientificPayloadKey !== cinematic.scientificPayloadKey || JSON.stringify(science.rows) !== JSON.stringify(cinematic.rows) || science.numericScientificStyleInputCount !== 0 || cinematic.numericScientificStyleInputCount !== 0) throw new Error("v526-hud-boundary");
  return Object.freeze({ scientificPayloadStable: true as const, scientificRowsStable: true as const, numericScientificStyleInputCount: 0 as const, scientificFieldMutation: false as const });
}

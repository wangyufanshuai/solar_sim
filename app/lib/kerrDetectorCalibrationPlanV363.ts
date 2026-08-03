import { DETECTOR_CALIBRATION_MISSING_REQUIREMENTS_V361, type DetectorCalibrationInspectArtifactV361 } from "./detectorCalibrationAdmissionV361";
import type { KerrDetectorBreakEvenArtifactV360 } from "./kerrDetectorBreakEvenV360";

export const KERR_DETECTOR_CALIBRATION_PLAN_VERSION_V363 = "v363-kerr-detector-calibration-acquisition-plan-v1" as const;

export type KerrCalibrationBandV363 = "visible" | "euv" | "soft-x-ray";
export type KerrCalibrationParameterV363 = "throughput-visible" | "throughput-euv" | "throughput-soft-x-ray" | "read-noise-variance" | "dark-current-rate" | "gain" | "background-rate";

export type KerrCalibrationBandPressureV363 = Readonly<{
  bandId: KerrCalibrationBandV363;
  rowCount: 4;
  log10GeometricMeanSystematicToPoissonRatio: number;
  geometricMeanSystematicToPoissonRatio: number;
  strictestSyntheticParityRmsCounts: number;
  strictestSyntheticParityRateCountsPerSecond: number;
  relativeLogPressure: number;
  priorityRank: 1 | 2 | 3;
  interpretation: "synthetic-planning-pressure-not-measured-detector-performance";
}>;

export type KerrCalibrationAcquisitionTaskV363 = Readonly<{
  id: "traceability-bundle" | "thermal-environment-log" | "gain-linearity" | "throughput-visible-scan" | "throughput-euv-scan" | "throughput-soft-x-ray-scan" | "bias-read-noise-stack" | "dark-current-time-temperature-sweep" | "blank-field-background-series";
  phase: "traceability" | "response-metrology" | "noise-metrology";
  label: string;
  coversRequirements: readonly string[];
  constrainsParameters: readonly KerrCalibrationParameterV363[];
  plannedCount: number;
  plannedCountUnit: "records" | "frames" | "response-points";
  design: string;
  acceptanceEvidence: string;
  executionStatus: "not-run-plan-only";
}>;

export type KerrCalibrationIdentifiabilityRowV363 = Readonly<{
  taskId: KerrCalibrationAcquisitionTaskV363["id"];
  coefficients: readonly number[];
}>;

export type KerrDetectorCalibrationPlanArtifactV363 = Readonly<{
  version: typeof KERR_DETECTOR_CALIBRATION_PLAN_VERSION_V363;
  generatedAt: string;
  status: "qualified-synthetic-calibration-acquisition-design-measured-input-still-blocked";
  source: Readonly<{
    breakEvenPath: "dist/science/kerr-detector-break-even-v360/audit.json";
    breakEvenFileSha256: string;
    breakEvenArtifactSha256: string;
    calibrationInspectPath: "dist/science/detector-calibration-v361/inspect.json";
    calibrationInspectFileSha256: string;
    calibrationInspectArtifactSha256: string;
  }>;
  counts: Readonly<{
    sourceRowCount: 12;
    bandCount: 3;
    missingRequirementCount: 11;
    acquisitionTaskCount: 9;
    quantitativeTaskCount: 7;
    parameterCount: 7;
  }>;
  bandPressure: readonly KerrCalibrationBandPressureV363[];
  acquisitionTasks: readonly KerrCalibrationAcquisitionTaskV363[];
  requirementCoverage: readonly Readonly<{ requirement: string; taskIds: readonly KerrCalibrationAcquisitionTaskV363["id"][]; covered: true }>[];
  identifiability: Readonly<{
    parameters: readonly KerrCalibrationParameterV363[];
    rows: readonly KerrCalibrationIdentifiabilityRowV363[];
    rank: 7;
    fullColumnRank: true;
    authority: "structural-binary-design-only-numerical-conditioning-awaits-measurements";
  }>;
  rankingBasis: "relative-log-ratio-from-synthetic-v360-only";
  sampleSizeAuthority: "planning-floor-only-no-measured-variance-power-analysis";
  measuredCalibrationAuthority: "blocked-input-unavailable-v361";
  measuredPerformanceClaimed: false;
  taskExecutionStatus: "not-run-plan-only";
  attemptConsumed: false;
  networkAttempted: false;
  scienceCinematicBoundary: "calibration-plan-and-priorities-never-cinematic-color-input";
  denseCampaignStatus: "incomplete-0-of-49";
  denseAggregateSha256: null;
  browserQualification: "not-run";
  artifactSha256: string;
}>;

const SHA = /^[a-f0-9]{64}$/;
const BANDS = Object.freeze(["visible", "euv", "soft-x-ray"] as const);
const PARAMETERS = Object.freeze(["throughput-visible", "throughput-euv", "throughput-soft-x-ray", "read-noise-variance", "dark-current-rate", "gain", "background-rate"] as const);

function matrixRank(rows: readonly (readonly number[])[], tolerance = 1e-12): number {
  const matrix = rows.map((row) => [...row]);
  let rank = 0;
  for (let column = 0; column < (matrix[0]?.length ?? 0) && rank < matrix.length; column += 1) {
    let pivot = rank;
    for (let row = rank + 1; row < matrix.length; row += 1) if (Math.abs(matrix[row][column]) > Math.abs(matrix[pivot][column])) pivot = row;
    if (Math.abs(matrix[pivot][column]) <= tolerance) continue;
    [matrix[rank], matrix[pivot]] = [matrix[pivot], matrix[rank]];
    const divisor = matrix[rank][column];
    for (let cursor = column; cursor < matrix[rank].length; cursor += 1) matrix[rank][cursor] /= divisor;
    for (let row = 0; row < matrix.length; row += 1) {
      if (row === rank) continue;
      const factor = matrix[row][column];
      for (let cursor = column; cursor < matrix[row].length; cursor += 1) matrix[row][cursor] -= factor * matrix[rank][cursor];
    }
    rank += 1;
  }
  return rank;
}

function buildBandPressure(breakEven: KerrDetectorBreakEvenArtifactV360): readonly KerrCalibrationBandPressureV363[] {
  const summaries = BANDS.map((bandId) => {
    const rows = breakEven.rows.filter((row) => row.bandId === bandId);
    if (rows.length !== 4) throw new Error("v363-band-row-conservation");
    const logMean = rows.reduce((sum, row) => sum + Math.log10(row.systematicToSourcePoissonVarianceRatio), 0) / rows.length;
    return {
      bandId,
      rowCount: 4 as const,
      log10GeometricMeanSystematicToPoissonRatio: logMean,
      geometricMeanSystematicToPoissonRatio: 10 ** logMean,
      strictestSyntheticParityRmsCounts: Math.min(...rows.map((row) => row.equivalentIndependentRmsAtParityCounts)),
      strictestSyntheticParityRateCountsPerSecond: Math.min(...rows.map((row) => row.equivalentIndependentRateAtParityCountsPerSecond)),
    };
  });
  const minimum = Math.min(...summaries.map((summary) => summary.log10GeometricMeanSystematicToPoissonRatio));
  const maximum = Math.max(...summaries.map((summary) => summary.log10GeometricMeanSystematicToPoissonRatio));
  const ranked = [...summaries].sort((left, right) => right.log10GeometricMeanSystematicToPoissonRatio - left.log10GeometricMeanSystematicToPoissonRatio);
  return Object.freeze(summaries.map((summary) => Object.freeze({
    ...summary,
    relativeLogPressure: (summary.log10GeometricMeanSystematicToPoissonRatio - minimum) / (maximum - minimum),
    priorityRank: (ranked.findIndex((entry) => entry.bandId === summary.bandId) + 1) as 1 | 2 | 3,
    interpretation: "synthetic-planning-pressure-not-measured-detector-performance" as const,
  })));
}

function tasks(): readonly KerrCalibrationAcquisitionTaskV363[] {
  const planned: KerrCalibrationAcquisitionTaskV363[] = [
    { id: "traceability-bundle", phase: "traceability", label: "Instrument identity and immutable provenance", coversRequirements: ["manufacturer", "model", "serial-or-campaign-id", "calibration-time-and-lab", "source-license-and-sha"], constrainsParameters: [], plannedCount: 1, plannedCountUnit: "records", design: "one signed identity/provenance bundle referencing every raw and normalized artifact", acceptanceEvidence: "complete identity, UTC/lab, terms, raw SHA, normalized SHA and processing SHA", executionStatus: "not-run-plan-only" },
    { id: "thermal-environment-log", phase: "traceability", label: "Detector thermal environment", coversRequirements: ["detector-temperature"], constrainsParameters: [], plannedCount: 3, plannedCountUnit: "records", design: "three stabilized temperature setpoints shared by dark-current acquisitions", acceptanceEvidence: "temperature in kelvin with stabilization interval and sensor provenance", executionStatus: "not-run-plan-only" },
    { id: "gain-linearity", phase: "response-metrology", label: "Gain and linearity transfer", coversRequirements: ["gain"], constrainsParameters: ["gain"], plannedCount: 28, plannedCountUnit: "frames", design: "seven illumination levels with four repeats and unsaturated raw frames", acceptanceEvidence: "electron/ADU slope, residuals, saturation mask and uncertainty covariance", executionStatus: "not-run-plan-only" },
    { id: "throughput-visible-scan", phase: "response-metrology", label: "Visible throughput curve", coversRequirements: ["three-band-throughput-curves"], constrainsParameters: ["throughput-visible", "gain"], plannedCount: 27, plannedCountUnit: "response-points", design: "nine wavelength nodes with three repeats against a traceable source", acceptanceEvidence: "strictly increasing wavelength, dimensionless throughput in [0,1], repeat covariance and SHA", executionStatus: "not-run-plan-only" },
    { id: "throughput-euv-scan", phase: "response-metrology", label: "EUV throughput curve", coversRequirements: ["three-band-throughput-curves"], constrainsParameters: ["throughput-euv", "gain"], plannedCount: 27, plannedCountUnit: "response-points", design: "nine wavelength nodes with three repeats against a traceable source", acceptanceEvidence: "strictly increasing wavelength, dimensionless throughput in [0,1], repeat covariance and SHA", executionStatus: "not-run-plan-only" },
    { id: "throughput-soft-x-ray-scan", phase: "response-metrology", label: "Soft X-ray throughput curve", coversRequirements: ["three-band-throughput-curves"], constrainsParameters: ["throughput-soft-x-ray", "gain"], plannedCount: 27, plannedCountUnit: "response-points", design: "nine wavelength nodes with three repeats against a traceable source", acceptanceEvidence: "strictly increasing wavelength, dimensionless throughput in [0,1], repeat covariance and SHA", executionStatus: "not-run-plan-only" },
    { id: "bias-read-noise-stack", phase: "noise-metrology", label: "Bias/read-noise stack", coversRequirements: ["read-noise"], constrainsParameters: ["read-noise-variance"], plannedCount: 32, plannedCountUnit: "frames", design: "thirty-two zero-exposure bias frames at the declared operating temperature", acceptanceEvidence: "per-pixel/read RMS, robust outlier mask, covariance and gain linkage", executionStatus: "not-run-plan-only" },
    { id: "dark-current-time-temperature-sweep", phase: "noise-metrology", label: "Dark-current time/temperature sweep", coversRequirements: ["dark-current", "detector-temperature"], constrainsParameters: ["read-noise-variance", "dark-current-rate"], plannedCount: 48, plannedCountUnit: "frames", design: "four exposure times by three temperatures by four repeats", acceptanceEvidence: "electron/pixel/s slope, intercept separation, temperature model and residual covariance", executionStatus: "not-run-plan-only" },
    { id: "blank-field-background-series", phase: "noise-metrology", label: "Band-resolved blank-field background", coversRequirements: ["background"], constrainsParameters: ["read-noise-variance", "dark-current-rate", "background-rate"], plannedCount: 48, plannedCountUnit: "frames", design: "four exposure times by three bands by four repeats with matched dark subtraction", acceptanceEvidence: "electron/pixel/exposure background, band covariance, dark linkage and raw SHA", executionStatus: "not-run-plan-only" },
  ];
  return Object.freeze(planned.map((task) => Object.freeze({ ...task, coversRequirements: Object.freeze(task.coversRequirements), constrainsParameters: Object.freeze(task.constrainsParameters) })));
}

export function createKerrDetectorCalibrationPlanV363(
  breakEven: KerrDetectorBreakEvenArtifactV360,
  inspect: DetectorCalibrationInspectArtifactV361,
  source: KerrDetectorCalibrationPlanArtifactV363["source"],
  artifactSha256 = "pending",
): KerrDetectorCalibrationPlanArtifactV363 {
  if (breakEven.status !== "qualified-synthetic-detector-break-even-requirement-audit" || breakEven.artifactSha256 !== source.breakEvenArtifactSha256
    || inspect.status !== "blocked-measured-calibration-input-unavailable" || inspect.artifactSha256 !== source.calibrationInspectArtifactSha256
    || inspect.missingRequirements.length !== 11 || inspect.admissionQualified || inspect.attemptConsumed || inspect.networkAttempted) throw new Error("v363-source-boundary");
  const acquisitionTasks = tasks();
  const requirementCoverage = Object.freeze(DETECTOR_CALIBRATION_MISSING_REQUIREMENTS_V361.map((requirement) => {
    const taskIds = acquisitionTasks.filter((task) => task.coversRequirements.includes(requirement)).map((task) => task.id);
    if (taskIds.length === 0) throw new Error(`v363-uncovered-requirement:${requirement}`);
    return Object.freeze({ requirement, taskIds: Object.freeze(taskIds), covered: true as const });
  }));
  const identifiabilityRows = Object.freeze([
    { taskId: "throughput-visible-scan", coefficients: [1, 0, 0, 0, 0, 1, 0] },
    { taskId: "throughput-euv-scan", coefficients: [0, 1, 0, 0, 0, 1, 0] },
    { taskId: "throughput-soft-x-ray-scan", coefficients: [0, 0, 1, 0, 0, 1, 0] },
    { taskId: "gain-linearity", coefficients: [0, 0, 0, 0, 0, 1, 0] },
    { taskId: "bias-read-noise-stack", coefficients: [0, 0, 0, 1, 0, 0, 0] },
    { taskId: "dark-current-time-temperature-sweep", coefficients: [0, 0, 0, 1, 1, 0, 0] },
    { taskId: "blank-field-background-series", coefficients: [0, 0, 0, 1, 1, 0, 1] },
  ] satisfies KerrCalibrationIdentifiabilityRowV363[]);
  const rank = matrixRank(identifiabilityRows.map((row) => row.coefficients));
  if (rank !== PARAMETERS.length) throw new Error("v363-structural-rank");
  return Object.freeze({
    version: KERR_DETECTOR_CALIBRATION_PLAN_VERSION_V363,
    generatedAt: new Date().toISOString(),
    status: "qualified-synthetic-calibration-acquisition-design-measured-input-still-blocked",
    source,
    counts: Object.freeze({ sourceRowCount: 12, bandCount: 3, missingRequirementCount: 11, acquisitionTaskCount: 9, quantitativeTaskCount: 7, parameterCount: 7 } as const),
    bandPressure: buildBandPressure(breakEven),
    acquisitionTasks,
    requirementCoverage,
    identifiability: Object.freeze({ parameters: PARAMETERS, rows: identifiabilityRows, rank: 7 as const, fullColumnRank: true as const, authority: "structural-binary-design-only-numerical-conditioning-awaits-measurements" as const }),
    rankingBasis: "relative-log-ratio-from-synthetic-v360-only",
    sampleSizeAuthority: "planning-floor-only-no-measured-variance-power-analysis",
    measuredCalibrationAuthority: "blocked-input-unavailable-v361",
    measuredPerformanceClaimed: false,
    taskExecutionStatus: "not-run-plan-only",
    attemptConsumed: false,
    networkAttempted: false,
    scienceCinematicBoundary: "calibration-plan-and-priorities-never-cinematic-color-input",
    denseCampaignStatus: "incomplete-0-of-49",
    denseAggregateSha256: null,
    browserQualification: "not-run",
    artifactSha256,
  });
}

export function parseKerrDetectorCalibrationPlanV363(value: unknown): KerrDetectorCalibrationPlanArtifactV363 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrDetectorCalibrationPlanArtifactV363> : null;
  if (!source || source.version !== KERR_DETECTOR_CALIBRATION_PLAN_VERSION_V363
    || source.status !== "qualified-synthetic-calibration-acquisition-design-measured-input-still-blocked"
    || !SHA.test(source.source?.breakEvenFileSha256 ?? "") || !SHA.test(source.source?.breakEvenArtifactSha256 ?? "")
    || !SHA.test(source.source?.calibrationInspectFileSha256 ?? "") || !SHA.test(source.source?.calibrationInspectArtifactSha256 ?? "")
    || source.counts?.sourceRowCount !== 12 || source.counts.bandCount !== 3 || source.counts.missingRequirementCount !== 11
    || source.counts.acquisitionTaskCount !== 9 || source.counts.quantitativeTaskCount !== 7 || source.counts.parameterCount !== 7
    || source.bandPressure?.length !== 3 || source.bandPressure.some((band) => !BANDS.includes(band.bandId) || band.rowCount !== 4 || !Number.isFinite(band.log10GeometricMeanSystematicToPoissonRatio) || !(band.geometricMeanSystematicToPoissonRatio > 0) || !(band.strictestSyntheticParityRmsCounts > 0) || band.relativeLogPressure < 0 || band.relativeLogPressure > 1)
    || new Set(source.bandPressure.map((band) => band.priorityRank)).size !== 3
    || source.acquisitionTasks?.length !== 9 || source.acquisitionTasks.some((task) => !(task.plannedCount > 0) || task.executionStatus !== "not-run-plan-only")
    || source.requirementCoverage?.length !== 11 || source.requirementCoverage.some((entry) => !entry.covered || entry.taskIds.length < 1)
    || source.identifiability?.parameters.length !== 7 || source.identifiability.rows.length !== 7 || source.identifiability.rank !== 7 || source.identifiability.fullColumnRank !== true
    || source.rankingBasis !== "relative-log-ratio-from-synthetic-v360-only" || source.sampleSizeAuthority !== "planning-floor-only-no-measured-variance-power-analysis"
    || source.measuredCalibrationAuthority !== "blocked-input-unavailable-v361" || source.measuredPerformanceClaimed !== false
    || source.taskExecutionStatus !== "not-run-plan-only" || source.attemptConsumed !== false || source.networkAttempted !== false
    || source.scienceCinematicBoundary !== "calibration-plan-and-priorities-never-cinematic-color-input"
    || source.denseCampaignStatus !== "incomplete-0-of-49" || source.denseAggregateSha256 !== null || source.browserQualification !== "not-run"
    || !SHA.test(source.artifactSha256 ?? "")) throw new Error("v363-calibration-plan-identity");
  return value as KerrDetectorCalibrationPlanArtifactV363;
}

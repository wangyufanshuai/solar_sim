import type { KerrDetectorCalibrationPlanArtifactV363, KerrCalibrationBandV363 } from "./kerrDetectorCalibrationPlanV363";

export const KERR_DETECTOR_CALIBRATION_PACK_VERSION_V364 = "v364-kerr-detector-calibration-acquisition-pack-v1" as const;
export const KERR_CALIBRATION_PARAMETER_COUNT_V364 = 7 as const;

export type KerrCalibrationThroughputRowV364 = Readonly<{
  bandId: KerrCalibrationBandV363;
  wavelengthM: number;
  throughput: number;
  repeatIndex: 1 | 2 | 3;
  detectorTemperatureK: number;
  rawArtifactSha256: string;
}>;

export type KerrCalibrationNoiseRowV364 = Readonly<{
  acquisitionId: string;
  kind: "gain" | "bias" | "dark" | "background";
  bandId: KerrCalibrationBandV363 | "all";
  exposureTimeS: number;
  detectorTemperatureK: number;
  meanAdu: number;
  varianceAduSquared: number;
  referenceElectrons: number | null;
  rawArtifactSha256: string;
}>;

export type KerrCalibrationTableValidationV364 = Readonly<{
  passed: boolean;
  failures: readonly string[];
  throughput: Readonly<{ rowCount: number; bandCount: number; wavelengthNodeCount: number; repeatComplete: boolean }>;
  noise: Readonly<{ rowCount: number; gainCount: number; biasCount: number; darkCount: number; backgroundCount: number; acquisitionIdsUnique: boolean }>;
  measuredAuthorityGranted: false;
  boundary: "table-integrity-only-not-measured-calibration-admission";
}>;

export type KerrCalibrationConditionAnalysisV364 = Readonly<{
  sourceKind: "measured" | "test-fixture";
  observationCount: number;
  parameterCount: 7;
  fisherEigenvalues: readonly number[];
  numericalRank: number;
  conditionNumber: number;
  fullRank: boolean;
  qualificationEligible: boolean;
  tolerance: 1e-10;
  boundary: "fisher-conditioning-only-not-calibration-validation";
}>;

export type KerrDetectorCalibrationPackFileV364 = Readonly<{
  id: "manifest-template" | "throughput-template" | "noise-template" | "acquisition-plan" | "readme";
  relativePath: string;
  mediaType: "application/json" | "text/csv" | "text/markdown";
  bytes: number;
  sha256: string;
  dataRowCount: number;
  admissibleAsMeasured: false;
}>;

export type KerrDetectorCalibrationPackArtifactV364 = Readonly<{
  version: typeof KERR_DETECTOR_CALIBRATION_PACK_VERSION_V364;
  generatedAt: string;
  status: "qualified-empty-acquisition-pack-and-validator-measured-data-unavailable";
  source: Readonly<{
    planPath: "dist/science/kerr-detector-calibration-plan-v363/plan.json";
    planCanonicalPayloadSha256: string;
    planArtifactSha256: string;
  }>;
  files: readonly KerrDetectorCalibrationPackFileV364[];
  counts: Readonly<{ fileCount: 5; emptyMeasurementTemplateCount: 3; acquisitionPlanTaskCount: 9; measuredDataRowCount: 0; validatorParameterCount: 7 }>;
  templatePolicy: "empty-placeholders-no-example-measurements-no-default-performance-values";
  validatorPolicy: "units-bands-repeats-finite-values-sha-and-counts-fail-closed";
  conditioningStatus: "unavailable-no-measured-jacobian-or-covariance";
  measuredCalibrationAuthority: "blocked-input-unavailable-v361";
  manifestAdmissionStatus: "not-attempted-empty-template-is-inadmissible";
  measuredPerformanceClaimed: false;
  taskExecutionStatus: "not-run-plan-only";
  attemptConsumed: false;
  networkAttempted: false;
  scienceCinematicBoundary: "calibration-pack-templates-and-validation-never-cinematic-color-input";
  denseCampaignStatus: "incomplete-0-of-49";
  denseAggregateSha256: null;
  browserQualification: "not-run";
  artifactSha256: string;
}>;

const SHA = /^[a-f0-9]{64}$/;
const BANDS = Object.freeze(["visible", "euv", "soft-x-ray"] as const);

export function validateKerrCalibrationTablesV364(
  throughputRows: readonly KerrCalibrationThroughputRowV364[],
  noiseRows: readonly KerrCalibrationNoiseRowV364[],
): KerrCalibrationTableValidationV364 {
  const failures: string[] = [];
  const nodes = new Map<string, Set<number>>();
  for (const row of throughputRows) {
    if (!BANDS.includes(row.bandId) || !(row.wavelengthM > 0) || !Number.isFinite(row.throughput) || row.throughput < 0 || row.throughput > 1 || ![1, 2, 3].includes(row.repeatIndex) || !(row.detectorTemperatureK > 0) || !SHA.test(row.rawArtifactSha256)) failures.push("throughput-row-invalid");
    const key = `${row.bandId}:${row.wavelengthM}`;
    const repeats = nodes.get(key) ?? new Set<number>();
    if (repeats.has(row.repeatIndex)) failures.push("throughput-repeat-duplicate");
    repeats.add(row.repeatIndex);
    nodes.set(key, repeats);
  }
  for (const bandId of BANDS) {
    const bandNodes = [...nodes.keys()].filter((key) => key.startsWith(`${bandId}:`));
    if (bandNodes.length < 9) failures.push(`throughput-${bandId}-node-count`);
    if (bandNodes.some((key) => nodes.get(key)?.size !== 3)) failures.push(`throughput-${bandId}-repeat-coverage`);
    const wavelengths = bandNodes.map((key) => Number(key.slice(key.indexOf(":") + 1))).sort((left, right) => left - right);
    if (wavelengths.some((value, index) => index > 0 && value <= wavelengths[index - 1])) failures.push(`throughput-${bandId}-wavelength-order`);
  }
  const ids = new Set<string>();
  const counts = { gain: 0, bias: 0, dark: 0, background: 0 };
  for (const row of noiseRows) {
    if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,95}$/.test(row.acquisitionId) || ids.has(row.acquisitionId)) failures.push("noise-acquisition-id");
    ids.add(row.acquisitionId);
    if (!Object.hasOwn(counts, row.kind) || (row.bandId !== "all" && !BANDS.includes(row.bandId)) || !Number.isFinite(row.exposureTimeS) || row.exposureTimeS < 0 || !(row.detectorTemperatureK > 0) || !Number.isFinite(row.meanAdu) || !Number.isFinite(row.varianceAduSquared) || row.varianceAduSquared < 0 || !SHA.test(row.rawArtifactSha256)) failures.push("noise-row-invalid");
    if ((row.kind === "gain" && !(Number(row.referenceElectrons) > 0)) || (row.kind !== "gain" && row.referenceElectrons !== null)) failures.push("noise-reference-electrons");
    counts[row.kind] += 1;
  }
  if (counts.gain < 28) failures.push("gain-count");
  if (counts.bias < 32) failures.push("bias-count");
  if (counts.dark < 48) failures.push("dark-count");
  if (counts.background < 48) failures.push("background-count");
  if (noiseRows.some((row) => row.kind === "bias" && row.exposureTimeS !== 0)) failures.push("bias-zero-exposure");
  const uniqueFailures = Object.freeze([...new Set(failures)]);
  return Object.freeze({
    passed: uniqueFailures.length === 0,
    failures: uniqueFailures,
    throughput: Object.freeze({ rowCount: throughputRows.length, bandCount: new Set(throughputRows.map((row) => row.bandId)).size, wavelengthNodeCount: nodes.size, repeatComplete: [...nodes.values()].every((repeats) => repeats.size === 3) }),
    noise: Object.freeze({ rowCount: noiseRows.length, gainCount: counts.gain, biasCount: counts.bias, darkCount: counts.dark, backgroundCount: counts.background, acquisitionIdsUnique: ids.size === noiseRows.length }),
    measuredAuthorityGranted: false,
    boundary: "table-integrity-only-not-measured-calibration-admission",
  });
}

function symmetricEigenvalues(matrix: readonly (readonly number[])[]): number[] {
  const size = matrix.length;
  const values = matrix.map((row) => [...row]);
  for (let iteration = 0; iteration < size * size * 128; iteration += 1) {
    let p = 0; let q = 1; let maximum = 0;
    for (let row = 0; row < size; row += 1) for (let column = row + 1; column < size; column += 1) if (Math.abs(values[row][column]) > maximum) { maximum = Math.abs(values[row][column]); p = row; q = column; }
    if (maximum < 1e-14) break;
    const angle = 0.5 * Math.atan2(2 * values[p][q], values[q][q] - values[p][p]);
    const cosine = Math.cos(angle); const sine = Math.sin(angle);
    const app = values[p][p]; const aqq = values[q][q]; const apq = values[p][q];
    values[p][p] = cosine * cosine * app - 2 * sine * cosine * apq + sine * sine * aqq;
    values[q][q] = sine * sine * app + 2 * sine * cosine * apq + cosine * cosine * aqq;
    values[p][q] = 0; values[q][p] = 0;
    for (let index = 0; index < size; index += 1) {
      if (index === p || index === q) continue;
      const aip = values[index][p]; const aiq = values[index][q];
      values[index][p] = cosine * aip - sine * aiq; values[p][index] = values[index][p];
      values[index][q] = sine * aip + cosine * aiq; values[q][index] = values[index][q];
    }
  }
  return values.map((row, index) => Math.max(0, row[index])).sort((left, right) => right - left);
}

export function analyzeKerrCalibrationConditionV364(args: {
  jacobian: readonly (readonly number[])[];
  observationVariance: readonly number[];
  sourceKind: "measured" | "test-fixture";
}): KerrCalibrationConditionAnalysisV364 {
  if (args.jacobian.length < KERR_CALIBRATION_PARAMETER_COUNT_V364 || args.observationVariance.length !== args.jacobian.length || args.jacobian.some((row) => row.length !== KERR_CALIBRATION_PARAMETER_COUNT_V364 || row.some((value) => !Number.isFinite(value))) || args.observationVariance.some((value) => !(value > 0) || !Number.isFinite(value))) throw new Error("v364-condition-input");
  const fisher = Array.from({ length: KERR_CALIBRATION_PARAMETER_COUNT_V364 }, () => Array.from({ length: KERR_CALIBRATION_PARAMETER_COUNT_V364 }, () => 0));
  for (let observation = 0; observation < args.jacobian.length; observation += 1) {
    const weight = 1 / args.observationVariance[observation];
    for (let row = 0; row < KERR_CALIBRATION_PARAMETER_COUNT_V364; row += 1) for (let column = 0; column < KERR_CALIBRATION_PARAMETER_COUNT_V364; column += 1) fisher[row][column] += args.jacobian[observation][row] * weight * args.jacobian[observation][column];
  }
  const eigenvalues = symmetricEigenvalues(fisher);
  const maximum = eigenvalues[0];
  const threshold = maximum * 1e-10;
  const positive = eigenvalues.filter((value) => value > threshold);
  const numericalRank = positive.length;
  const conditionNumber = numericalRank === KERR_CALIBRATION_PARAMETER_COUNT_V364 ? maximum / positive[positive.length - 1] : Number.POSITIVE_INFINITY;
  const fullRank = numericalRank === KERR_CALIBRATION_PARAMETER_COUNT_V364 && Number.isFinite(conditionNumber);
  return Object.freeze({ sourceKind: args.sourceKind, observationCount: args.jacobian.length, parameterCount: 7, fisherEigenvalues: Object.freeze(eigenvalues), numericalRank, conditionNumber, fullRank, qualificationEligible: args.sourceKind === "measured" && fullRank, tolerance: 1e-10, boundary: "fisher-conditioning-only-not-calibration-validation" });
}

export function parseKerrDetectorCalibrationPackV364(value: unknown): KerrDetectorCalibrationPackArtifactV364 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrDetectorCalibrationPackArtifactV364> : null;
  if (!source || source.version !== KERR_DETECTOR_CALIBRATION_PACK_VERSION_V364
    || source.status !== "qualified-empty-acquisition-pack-and-validator-measured-data-unavailable"
    || !SHA.test(source.source?.planCanonicalPayloadSha256 ?? "") || !SHA.test(source.source?.planArtifactSha256 ?? "") || source.source?.planCanonicalPayloadSha256 !== source.source?.planArtifactSha256
    || source.files?.length !== 5 || source.files.some((file) => !SHA.test(file.sha256) || !(file.bytes > 0) || file.admissibleAsMeasured !== false || file.relativePath.includes(".."))
    || source.files.filter((file) => ["manifest-template", "throughput-template", "noise-template"].includes(file.id)).some((file) => file.dataRowCount !== 0)
    || source.counts?.fileCount !== 5 || source.counts.emptyMeasurementTemplateCount !== 3 || source.counts.acquisitionPlanTaskCount !== 9 || source.counts.measuredDataRowCount !== 0 || source.counts.validatorParameterCount !== 7
    || source.templatePolicy !== "empty-placeholders-no-example-measurements-no-default-performance-values"
    || source.validatorPolicy !== "units-bands-repeats-finite-values-sha-and-counts-fail-closed"
    || source.conditioningStatus !== "unavailable-no-measured-jacobian-or-covariance"
    || source.measuredCalibrationAuthority !== "blocked-input-unavailable-v361" || source.manifestAdmissionStatus !== "not-attempted-empty-template-is-inadmissible"
    || source.measuredPerformanceClaimed !== false || source.taskExecutionStatus !== "not-run-plan-only" || source.attemptConsumed !== false || source.networkAttempted !== false
    || source.scienceCinematicBoundary !== "calibration-pack-templates-and-validation-never-cinematic-color-input"
    || source.denseCampaignStatus !== "incomplete-0-of-49" || source.denseAggregateSha256 !== null || source.browserQualification !== "not-run"
    || !SHA.test(source.artifactSha256 ?? "")) throw new Error("v364-calibration-pack-identity");
  return value as KerrDetectorCalibrationPackArtifactV364;
}

export function validateCalibrationPlanSourceV364(plan: KerrDetectorCalibrationPlanArtifactV363): void {
  if (plan.status !== "qualified-synthetic-calibration-acquisition-design-measured-input-still-blocked" || plan.counts.acquisitionTaskCount !== 9 || plan.identifiability.rank !== 7 || plan.measuredPerformanceClaimed || plan.taskExecutionStatus !== "not-run-plan-only") throw new Error("v364-plan-source-boundary");
}

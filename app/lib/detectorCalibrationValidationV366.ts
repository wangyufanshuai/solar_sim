import type { DetectorCalibrationManifestV361 } from "./detectorCalibrationAdmissionV361";
import { analyzeKerrCalibrationConditionV364, validateKerrCalibrationTablesV364, type KerrCalibrationNoiseRowV364, type KerrCalibrationThroughputRowV364 } from "./kerrDetectorCalibrationPackV364";

export const DETECTOR_CALIBRATION_VALIDATION_VERSION_V366 = "v366-independent-detector-calibration-validation-v1" as const;
export const DETECTOR_CALIBRATION_GATES_V366 = Object.freeze({
  maximumStandardizedResidual: 5,
  maximumThroughputRepeatCoefficientOfVariation: 0.02,
  maximumDerivedReconstructionRelativeDifference: 1e-8,
  minimumCovarianceEigenvalue: -1e-12,
  maximumConditionNumber: 1e8,
} as const);

export type DetectorCalibrationValidationResultV366 = Readonly<{
  version: typeof DETECTOR_CALIBRATION_VALIDATION_VERSION_V366;
  status: "qualified-test-fixture-only" | "measured-validation-qualified" | "validation-failed" | "blocked-conditioning-input-unavailable";
  sourceKind: "test-fixture" | "measured-import";
  passed: boolean;
  gates: typeof DETECTOR_CALIBRATION_GATES_V366;
  metrics: Readonly<{
    gainStandardizedResidualMaximum: number;
    darkStandardizedResidualMaximum: number;
    backgroundCoefficientOfVariation: number;
    throughputRepeatCoefficientOfVariationMaximum: number;
    derivedReconstructionRelativeDifferenceMaximum: number;
    covarianceSymmetryDifference: number;
    covarianceEigenvalues: readonly number[];
    covariancePositiveSemidefinite: boolean;
    conditioningRank: number | null;
    conditionNumber: number | null;
  }>;
  failures: readonly string[];
  measuredValidationQualified: boolean;
  measuredAuthorityGranted: false;
  independentFromCompilerDerivations: true;
  boundary: "validation-result-does-not-mutate-manifest-or-science-cinematic-buffers";
}>;

const BANDS = ["visible", "euv", "soft-x-ray"] as const;
const mean = (values: readonly number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const relativeDifference = (left: number, right: number) => Math.abs(left - right) / Math.max(1e-300, Math.abs(left), Math.abs(right));
function fit(points: readonly Readonly<{ x: number; y: number; sigma: number }>[]) {
  const x = mean(points.map((point) => point.x)); const y = mean(points.map((point) => point.y)); const denominator = points.reduce((sum, point) => sum + (point.x - x) ** 2, 0); if (!(denominator > 0)) throw new Error("v366-fit-degenerate"); const slope = points.reduce((sum, point) => sum + (point.x - x) * (point.y - y), 0) / denominator; const intercept = y - slope * x; const standardizedResidualMaximum = Math.max(...points.map((point) => Math.abs(point.y - (intercept + slope * point.x)) / Math.max(1e-15, point.sigma))); return { slope, intercept, standardizedResidualMaximum };
}

function symmetricEigenvalues(matrix: readonly (readonly number[])[]): number[] {
  const values = matrix.map((row) => [...row]); const size = values.length;
  for (let iteration = 0; iteration < 2048; iteration += 1) {
    let p = 0; let q = 1; let maximum = 0;
    for (let row = 0; row < size; row += 1) for (let column = row + 1; column < size; column += 1) if (Math.abs(values[row][column]) > maximum) { maximum = Math.abs(values[row][column]); p = row; q = column; }
    if (maximum < 1e-16) break;
    const angle = 0.5 * Math.atan2(2 * values[p][q], values[q][q] - values[p][p]), cosine = Math.cos(angle), sine = Math.sin(angle), app = values[p][p], aqq = values[q][q], apq = values[p][q]; values[p][p] = cosine ** 2 * app - 2 * sine * cosine * apq + sine ** 2 * aqq; values[q][q] = sine ** 2 * app + 2 * sine * cosine * apq + cosine ** 2 * aqq; values[p][q] = 0; values[q][p] = 0;
    for (let index = 0; index < size; index += 1) if (index !== p && index !== q) { const aip = values[index][p], aiq = values[index][q]; values[index][p] = cosine * aip - sine * aiq; values[p][index] = values[index][p]; values[index][q] = sine * aip + cosine * aiq; values[q][index] = values[index][q]; }
  }
  return values.map((row, index) => row[index]).sort((left, right) => right - left);
}

export function validateDetectorCalibrationIndependentlyV366(args: {
  manifest: DetectorCalibrationManifestV361;
  throughputRows: readonly KerrCalibrationThroughputRowV364[];
  noiseRows: readonly KerrCalibrationNoiseRowV364[];
  sourceKind: "test-fixture" | "measured-import";
  compilerStatus: "compiled-test-fixture-nonpublishable" | "compiled-measured-manifest-awaiting-independent-validation";
  conditioningInput?: Readonly<{ jacobian: readonly (readonly number[])[]; observationVariance: readonly number[] }>;
}): DetectorCalibrationValidationResultV366 {
  if ((args.sourceKind === "test-fixture" && args.compilerStatus !== "compiled-test-fixture-nonpublishable") || (args.sourceKind === "measured-import" && args.compilerStatus !== "compiled-measured-manifest-awaiting-independent-validation")) throw new Error("v366-compiler-source-kind-boundary");
  const table = validateKerrCalibrationTablesV364(args.throughputRows, args.noiseRows); if (!table.passed) throw new Error(`v366-table:${table.failures.join(",")}`);
  const gainRows = args.noiseRows.filter((row) => row.kind === "gain"); const gainFit = fit(gainRows.map((row) => ({ x: row.meanAdu, y: Number(row.referenceElectrons), sigma: Math.sqrt(row.varianceAduSquared) * args.manifest.noise.gain })));
  const biasRows = args.noiseRows.filter((row) => row.kind === "bias"), biasMean = mean(biasRows.map((row) => row.meanAdu)), independentReadNoise = Math.sqrt(mean(biasRows.map((row) => row.varianceAduSquared))) * gainFit.slope;
  const darkRows = args.noiseRows.filter((row) => row.kind === "dark" && Math.abs(row.detectorTemperatureK - args.manifest.calibration.detectorTemperatureK) <= 0.25); const darkFit = fit(darkRows.map((row) => ({ x: row.exposureTimeS, y: (row.meanAdu - biasMean) * gainFit.slope, sigma: Math.sqrt(row.varianceAduSquared) * gainFit.slope })));
  const backgroundValues = args.noiseRows.filter((row) => row.kind === "background").map((row) => (row.meanAdu - biasMean) * gainFit.slope - darkFit.slope * row.exposureTimeS); const backgroundMean = mean(backgroundValues), backgroundSigma = Math.sqrt(mean(backgroundValues.map((value) => (value - backgroundMean) ** 2))), backgroundCoefficientOfVariation = backgroundSigma / Math.max(1e-15, Math.abs(backgroundMean));
  let throughputCvMaximum = 0; let throughputReconstructionMaximum = 0;
  for (const bandId of BANDS) {
    const manifestBand = args.manifest.response.bands.find((band) => band.bandId === bandId); if (!manifestBand) throw new Error("v366-manifest-band");
    for (const point of manifestBand.points) { const repeats = args.throughputRows.filter((row) => row.bandId === bandId && row.wavelengthM === point.wavelengthM).map((row) => row.throughput); const average = mean(repeats), sigma = Math.sqrt(mean(repeats.map((value) => (value - average) ** 2))); throughputCvMaximum = Math.max(throughputCvMaximum, sigma / Math.max(1e-15, Math.abs(average))); throughputReconstructionMaximum = Math.max(throughputReconstructionMaximum, relativeDifference(average, point.throughput)); }
  }
  const repeatMeans = [1, 2, 3].map((repeatIndex) => BANDS.map((bandId) => mean(args.throughputRows.filter((row) => row.bandId === bandId && row.repeatIndex === repeatIndex).map((row) => row.throughput)))), bandMeans = BANDS.map((_, band) => mean(repeatMeans.map((row) => row[band]))), covariance = BANDS.map((_, left) => BANDS.map((__, right) => repeatMeans.reduce((sum, row) => sum + (row[left] - bandMeans[left]) * (row[right] - bandMeans[right]), 0) / 2)); const covarianceSymmetryDifference = Math.max(...covariance.flatMap((row, left) => row.map((value, right) => Math.abs(value - covariance[right][left])))); const covarianceEigenvalues = symmetricEigenvalues(covariance), covariancePositiveSemidefinite = covarianceEigenvalues[covarianceEigenvalues.length - 1] >= DETECTOR_CALIBRATION_GATES_V366.minimumCovarianceEigenvalue;
  const reconstruction = Math.max(throughputReconstructionMaximum, relativeDifference(gainFit.slope, args.manifest.noise.gain), relativeDifference(independentReadNoise, args.manifest.noise.readNoiseRms), relativeDifference(darkFit.slope, args.manifest.noise.darkCurrent), relativeDifference(backgroundMean, args.manifest.noise.background));
  const conditioning = args.conditioningInput ? analyzeKerrCalibrationConditionV364({ ...args.conditioningInput, sourceKind: args.sourceKind === "measured-import" ? "measured" : "test-fixture" }) : null;
  const failures: string[] = [];
  if (gainFit.standardizedResidualMaximum > DETECTOR_CALIBRATION_GATES_V366.maximumStandardizedResidual) failures.push("gain-residual"); if (darkFit.standardizedResidualMaximum > DETECTOR_CALIBRATION_GATES_V366.maximumStandardizedResidual) failures.push("dark-residual"); if (backgroundCoefficientOfVariation > DETECTOR_CALIBRATION_GATES_V366.maximumThroughputRepeatCoefficientOfVariation) failures.push("background-repeatability"); if (throughputCvMaximum > DETECTOR_CALIBRATION_GATES_V366.maximumThroughputRepeatCoefficientOfVariation) failures.push("throughput-repeatability"); if (reconstruction > DETECTOR_CALIBRATION_GATES_V366.maximumDerivedReconstructionRelativeDifference) failures.push("derived-reconstruction"); if (covarianceSymmetryDifference > 1e-12 || !covariancePositiveSemidefinite) failures.push("covariance-psd"); if (conditioning && (!conditioning.fullRank || conditioning.conditionNumber > DETECTOR_CALIBRATION_GATES_V366.maximumConditionNumber)) failures.push("conditioning");
  const conditioningMissing = !conditioning; const passed = failures.length === 0 && !conditioningMissing; const measuredValidationQualified = passed && args.sourceKind === "measured-import";
  return Object.freeze({ version: DETECTOR_CALIBRATION_VALIDATION_VERSION_V366, status: conditioningMissing ? "blocked-conditioning-input-unavailable" : failures.length > 0 ? "validation-failed" : args.sourceKind === "measured-import" ? "measured-validation-qualified" : "qualified-test-fixture-only", sourceKind: args.sourceKind, passed, gates: DETECTOR_CALIBRATION_GATES_V366, metrics: Object.freeze({ gainStandardizedResidualMaximum: gainFit.standardizedResidualMaximum, darkStandardizedResidualMaximum: darkFit.standardizedResidualMaximum, backgroundCoefficientOfVariation, throughputRepeatCoefficientOfVariationMaximum: throughputCvMaximum, derivedReconstructionRelativeDifferenceMaximum: reconstruction, covarianceSymmetryDifference, covarianceEigenvalues: Object.freeze(covarianceEigenvalues), covariancePositiveSemidefinite, conditioningRank: conditioning?.numericalRank ?? null, conditionNumber: conditioning?.conditionNumber ?? null }), failures: Object.freeze(failures), measuredValidationQualified, measuredAuthorityGranted: false, independentFromCompilerDerivations: true, boundary: "validation-result-does-not-mutate-manifest-or-science-cinematic-buffers" });
}

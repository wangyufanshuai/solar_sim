import { createHash } from "node:crypto";

export const KERR_POLARIMETER_INVERSION_VERSION_V412 = "v412-kerr-generalized-mueller-inversion-v1" as const;
export const KERR_POLARIMETER_INVERSION_ARTIFACT_VERSION_V412 = "v412-kerr-generalized-mueller-inversion-artifact-v1" as const;
export const KERR_POLARIMETER_INVERSION_SUMMARY_VERSION_V412 = "v412-kerr-generalized-mueller-inversion-summary-v1" as const;
export const KERR_POLARIMETER_INVERSION_RESPONSE_VERSION_V412 = "v412-kerr-generalized-mueller-inversion-response-v1" as const;
export const KERR_POLARIMETER_CALIBRATION_INSPECT_SHA256_V411 = "9382399d3184a5480f085ecc4e3679ba593f814db8a73c8abba15eb3eec58ced" as const;

export type MatrixV412 = readonly (readonly number[])[];
export type StokesVectorV412 = readonly [number, number, number, number];

export type KerrPolarimeterInversionInputV412 = Readonly<{
  sourceKind: "test-fixture" | "measured-import";
  responseMatrix: MatrixV412;
  observationVector: StokesVectorV412;
  observationCovariance: MatrixV412;
  responseElementCovariance: MatrixV412;
}>;

export type KerrPolarimeterInversionResultV412 = Readonly<{
  version: typeof KERR_POLARIMETER_INVERSION_VERSION_V412;
  sourceKind: KerrPolarimeterInversionInputV412["sourceKind"];
  status: "qualified-test-fixture-only" | "compiled-measured-result-awaiting-independent-validation";
  reconstructedStokes: StokesVectorV412;
  directInverseStokes: StokesVectorV412;
  measurementCovariance: MatrixV412;
  calibrationCovariance: MatrixV412;
  calibrationJacobian: MatrixV412;
  metrics: Readonly<{
    responseConditionNumber: number;
    fisherConditionNumber: number;
    responseInverseResidualMaximum: number;
    weightedDirectDifferenceMaximum: number;
    observationReconstructionResidualMaximum: number;
    chiSquare: number;
    measurementCovarianceSymmetryMaximum: number;
    calibrationCovarianceSymmetryMaximum: number;
    measurementCovarianceMinimumEigenvalue: number;
    calibrationCovarianceMinimumEigenvalue: number;
    calibrationJacobianFiniteDifferenceMaximum: number;
  }>;
  conditionNumberDefinition: "matrix-one-norm-times-inverse-one-norm";
  uncertaintyCombination: "measurement-and-calibration-covariances-kept-separate-no-independence-claim";
  measuredAuthorityGranted: false;
  publishable: false;
  boundary: "generalized-linear-inversion-and-first-order-covariance-propagation-only-no-measured-authority";
}>;

export type KerrPolarimeterInversionArtifactV412 = Readonly<{
  version: typeof KERR_POLARIMETER_INVERSION_ARTIFACT_VERSION_V412;
  generatedAt: string;
  status: "qualified-generalized-mueller-inversion-fixture-only-measured-input-unavailable";
  source: Readonly<{
    v411CalibrationInspectArtifactSha256: typeof KERR_POLARIMETER_CALIBRATION_INSPECT_SHA256_V411;
    pythonOracleArtifactSha256: string;
  }>;
  fixtureClass: "deterministic-nonpublishable-numerical-validation";
  result: KerrPolarimeterInversionResultV412;
  oracleComparison: Readonly<{
    maximumReconstructedStokesAbsolute: number;
    maximumMeasurementCovarianceAbsolute: number;
    maximumCalibrationCovarianceAbsolute: number;
    maximumConditionNumberRelative: number;
  }>;
  deterministicReplay: true;
  measuredCalibrationPackPresent: false;
  measuredInversionExecuted: false;
  measuredAuthorityGranted: false;
  networkAttempted: false;
  denseShardExecuted: false;
  browserQualification: "not-run";
  boundary: "solver-qualified-by-fixture-and-independent-oracle-measured-polarimeter-remains-unavailable";
  artifactSha256: string;
}>;

export type KerrPolarimeterInversionSummaryV412 = Readonly<{
  version: typeof KERR_POLARIMETER_INVERSION_SUMMARY_VERSION_V412;
  status: KerrPolarimeterInversionArtifactV412["status"];
  artifactSha256: string;
  v411CalibrationInspectArtifactSha256: typeof KERR_POLARIMETER_CALIBRATION_INSPECT_SHA256_V411;
  fixtureQualification: "qualified-test-fixture-only";
  metrics: KerrPolarimeterInversionResultV412["metrics"];
  oracleComparison: KerrPolarimeterInversionArtifactV412["oracleComparison"];
  measuredCalibrationPackPresent: false;
  measuredInversionExecuted: false;
  measuredAuthorityGranted: false;
  uncertaintyCombination: KerrPolarimeterInversionResultV412["uncertaintyCombination"];
  fullArtifactAvailable: true;
  browserQualification: "not-run";
  boundary: "summary-only-no-matrices-or-stokes-vectors-in-react-state";
}>;

export type KerrPolarimeterInversionResponseV412 = Readonly<{
  version: typeof KERR_POLARIMETER_INVERSION_RESPONSE_VERSION_V412;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed";
  summary: KerrPolarimeterInversionSummaryV412 | null;
}>;

const SHA = /^[a-f0-9]{64}$/;
const finiteMatrix = (matrix: MatrixV412, rows: number, columns: number) => Array.isArray(matrix) && matrix.length === rows && matrix.every((row) => Array.isArray(row) && row.length === columns && row.every(Number.isFinite));
const transpose = (matrix: MatrixV412): number[][] => matrix[0].map((_, column) => matrix.map((row) => row[column]));
const multiply = (left: MatrixV412, right: MatrixV412): number[][] => left.map((row) => right[0].map((_, column) => row.reduce((sum, value, index) => sum + value * right[index][column], 0)));
const vectorColumn = (vector: readonly number[]): number[][] => vector.map((value) => [value]);
const flattenColumn = (matrix: MatrixV412): number[] => matrix.map((row) => row[0]);
const maximumAbsolute = (matrix: MatrixV412) => Math.max(...matrix.flat().map(Math.abs));
const subtract = (left: MatrixV412, right: MatrixV412): number[][] => left.map((row, index) => row.map((value, column) => value - right[index][column]));
const identity = (size: number): number[][] => Array.from({ length: size }, (_, row) => Array.from({ length: size }, (_, column) => row === column ? 1 : 0));

function inverse(matrix: MatrixV412): number[][] {
  if (!finiteMatrix(matrix, matrix.length, matrix.length) || matrix.length < 1 || matrix.length > 64) throw new Error("v412-inverse-shape");
  const size = matrix.length; const work = matrix.map((row, index) => [...row, ...identity(size)[index]]);
  for (let column = 0; column < size; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < size; row += 1) if (Math.abs(work[row][column]) > Math.abs(work[pivot][column])) pivot = row;
    const scale = Math.max(...work.slice(column).map((row) => Math.max(...row.slice(0, size).map(Math.abs))));
    if (Math.abs(work[pivot][column]) <= Number.EPSILON * Math.max(1, scale) * size * 16) throw new Error("v412-inverse-singular");
    [work[column], work[pivot]] = [work[pivot], work[column]];
    const divisor = work[column][column]; for (let index = 0; index < size * 2; index += 1) work[column][index] /= divisor;
    for (let row = 0; row < size; row += 1) if (row !== column) { const factor = work[row][column]; for (let index = 0; index < size * 2; index += 1) work[row][index] -= factor * work[column][index]; }
  }
  return work.map((row) => row.slice(size));
}

function symmetricEigenvalues(matrix: MatrixV412): number[] {
  const values = matrix.map((row) => [...row]); const size = values.length;
  for (let iteration = 0; iteration < size * size * 128; iteration += 1) {
    let p = 0; let q = 1; let maximum = 0;
    for (let row = 0; row < size; row += 1) for (let column = row + 1; column < size; column += 1) if (Math.abs(values[row][column]) > maximum) { maximum = Math.abs(values[row][column]); p = row; q = column; }
    if (maximum < 1e-16) break;
    const angle = 0.5 * Math.atan2(2 * values[p][q], values[q][q] - values[p][p]); const cosine = Math.cos(angle); const sine = Math.sin(angle); const app = values[p][p]; const aqq = values[q][q]; const apq = values[p][q];
    values[p][p] = cosine * cosine * app - 2 * sine * cosine * apq + sine * sine * aqq; values[q][q] = sine * sine * app + 2 * sine * cosine * apq + cosine * cosine * aqq; values[p][q] = 0; values[q][p] = 0;
    for (let index = 0; index < size; index += 1) if (index !== p && index !== q) { const aip = values[index][p]; const aiq = values[index][q]; values[index][p] = cosine * aip - sine * aiq; values[p][index] = values[index][p]; values[index][q] = sine * aip + cosine * aiq; values[q][index] = values[index][q]; }
  }
  return values.map((row, index) => row[index]).sort((left, right) => right - left);
}

const symmetryMaximum = (matrix: MatrixV412) => Math.max(...matrix.flatMap((row, left) => row.map((value, right) => Math.abs(value - matrix[right][left]))));
const oneNorm = (matrix: MatrixV412) => Math.max(...matrix[0].map((_, column) => matrix.reduce((sum, row) => sum + Math.abs(row[column]), 0)));
const conditionNumber = (matrix: MatrixV412) => oneNorm(matrix) * oneNorm(inverse(matrix));
const freezeMatrix = (matrix: MatrixV412): MatrixV412 => Object.freeze(matrix.map((row) => Object.freeze([...row])));

export function solveKerrPolarimeterInversionV412(input: KerrPolarimeterInversionInputV412): KerrPolarimeterInversionResultV412 {
  if (!["test-fixture", "measured-import"].includes(input.sourceKind) || !finiteMatrix(input.responseMatrix, 4, 4) || input.observationVector.length !== 4 || !input.observationVector.every(Number.isFinite) || !finiteMatrix(input.observationCovariance, 4, 4) || !finiteMatrix(input.responseElementCovariance, 16, 16)) throw new Error("v412-input-shape");
  const observationEigenvalues = symmetricEigenvalues(input.observationCovariance); const responseCovarianceEigenvalues = symmetricEigenvalues(input.responseElementCovariance);
  if (symmetryMaximum(input.observationCovariance) >= 1e-12 || symmetryMaximum(input.responseElementCovariance) >= 1e-12 || observationEigenvalues[3] <= 0 || responseCovarianceEigenvalues[15] < -1e-12) throw new Error("v412-input-covariance");
  const responseInverse = inverse(input.responseMatrix); const weight = inverse(input.observationCovariance); const responseTranspose = transpose(input.responseMatrix); const fisher = multiply(multiply(responseTranspose, weight), input.responseMatrix); const fisherInverse = inverse(fisher); const weightedOperator = multiply(multiply(fisherInverse, responseTranspose), weight);
  const reconstructed = flattenColumn(multiply(weightedOperator, vectorColumn(input.observationVector))) as [number, number, number, number]; const direct = flattenColumn(multiply(responseInverse, vectorColumn(input.observationVector))) as [number, number, number, number];
  const fitted = flattenColumn(multiply(input.responseMatrix, vectorColumn(reconstructed))); const residual = input.observationVector.map((value, index) => value - fitted[index]); const chiSquare = flattenColumn(multiply(transpose(vectorColumn(residual)), multiply(weight, vectorColumn(residual))))[0];
  const measurementCovariance = multiply(multiply(weightedOperator, input.observationCovariance), transpose(weightedOperator));
  const calibrationJacobian = Array.from({ length: 4 }, (_, output) => Array.from({ length: 16 }, (_, parameter) => -responseInverse[output][Math.floor(parameter / 4)] * reconstructed[parameter % 4]));
  const calibrationCovariance = multiply(multiply(calibrationJacobian, input.responseElementCovariance), transpose(calibrationJacobian));
  const finiteDifferenceStep = 1e-5; let calibrationJacobianFiniteDifferenceMaximum = 0;
  for (let parameter = 0; parameter < 16; parameter += 1) { const row = Math.floor(parameter / 4); const column = parameter % 4; const evaluate = (multiple: number) => { const perturbed = input.responseMatrix.map((entry, index) => entry.map((value, offset) => value + (index === row && offset === column ? multiple * finiteDifferenceStep : 0))); return flattenColumn(multiply(inverse(perturbed), vectorColumn(input.observationVector))); }; const plusTwo = evaluate(2); const plusOne = evaluate(1); const minusOne = evaluate(-1); const minusTwo = evaluate(-2); for (let output = 0; output < 4; output += 1) { const derivative = (-plusTwo[output] + 8 * plusOne[output] - 8 * minusOne[output] + minusTwo[output]) / (12 * finiteDifferenceStep); calibrationJacobianFiniteDifferenceMaximum = Math.max(calibrationJacobianFiniteDifferenceMaximum, Math.abs(derivative - calibrationJacobian[output][parameter])); } }
  const measurementEigenvalues = symmetricEigenvalues(measurementCovariance); const calibrationEigenvalues = symmetricEigenvalues(calibrationCovariance); const responseInverseResidualMaximum = maximumAbsolute(subtract(multiply(input.responseMatrix, responseInverse), identity(4))); const weightedDirectDifferenceMaximum = Math.max(...reconstructed.map((value, index) => Math.abs(value - direct[index]))); const observationReconstructionResidualMaximum = Math.max(...residual.map(Math.abs));
  const metrics = Object.freeze({ responseConditionNumber: conditionNumber(input.responseMatrix), fisherConditionNumber: conditionNumber(fisher), responseInverseResidualMaximum, weightedDirectDifferenceMaximum, observationReconstructionResidualMaximum, chiSquare, measurementCovarianceSymmetryMaximum: symmetryMaximum(measurementCovariance), calibrationCovarianceSymmetryMaximum: symmetryMaximum(calibrationCovariance), measurementCovarianceMinimumEigenvalue: measurementEigenvalues[3], calibrationCovarianceMinimumEigenvalue: calibrationEigenvalues[3], calibrationJacobianFiniteDifferenceMaximum });
  if (metrics.responseConditionNumber >= 1e4 || metrics.fisherConditionNumber >= 1e8 || responseInverseResidualMaximum >= 1e-12 || weightedDirectDifferenceMaximum >= 1e-12 || observationReconstructionResidualMaximum >= 1e-12 || chiSquare >= 1e-20 || metrics.measurementCovarianceSymmetryMaximum >= 1e-12 || metrics.calibrationCovarianceSymmetryMaximum >= 1e-12 || metrics.measurementCovarianceMinimumEigenvalue <= 0 || metrics.calibrationCovarianceMinimumEigenvalue < -1e-12 || calibrationJacobianFiniteDifferenceMaximum >= 1e-8) throw new Error(`v412-numerical-gate:${JSON.stringify(metrics)}`);
  return Object.freeze({ version: KERR_POLARIMETER_INVERSION_VERSION_V412, sourceKind: input.sourceKind, status: input.sourceKind === "test-fixture" ? "qualified-test-fixture-only" : "compiled-measured-result-awaiting-independent-validation", reconstructedStokes: Object.freeze(reconstructed), directInverseStokes: Object.freeze(direct), measurementCovariance: freezeMatrix(measurementCovariance), calibrationCovariance: freezeMatrix(calibrationCovariance), calibrationJacobian: freezeMatrix(calibrationJacobian), metrics, conditionNumberDefinition: "matrix-one-norm-times-inverse-one-norm", uncertaintyCombination: "measurement-and-calibration-covariances-kept-separate-no-independence-claim", measuredAuthorityGranted: false, publishable: false, boundary: "generalized-linear-inversion-and-first-order-covariance-propagation-only-no-measured-authority" });
}

export const KERR_POLARIMETER_INVERSION_FIXTURE_V412: KerrPolarimeterInversionInputV412 = Object.freeze({
  sourceKind: "test-fixture",
  responseMatrix: freezeMatrix([[0.92, 0.18, -0.04, 0.02], [0.88, -0.16, 0.07, -0.01], [0.91, 0.03, 0.19, 0.015], [0.87, -0.02, -0.17, -0.012]]),
  observationVector: Object.freeze([0.9366, 0.8636, 0.90305, 0.87678] as const),
  observationCovariance: freezeMatrix([[4e-6, 1e-7, 0, 0], [1e-7, 5e-6, 8e-8, 0], [0, 8e-8, 4.5e-6, 6e-8], [0, 0, 6e-8, 5.5e-6]]),
  responseElementCovariance: freezeMatrix(Array.from({ length: 16 }, (_, row) => Array.from({ length: 16 }, (_, column) => row === column ? 1e-8 * (1 + row * 0.01) : 0))),
});

const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", "artifactSha256"].includes(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]));
export const canonicalShaV412 = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const crossLanguageCanonicalizeV412 = (value: unknown): unknown => {
  if (typeof value === "number") { if (!Number.isFinite(value)) throw new Error("v412-cross-language-number"); const [coefficient, exponent] = (Object.is(value, -0) ? 0 : value).toExponential(16).split("e"); const normalizedExponent = Number(exponent); return `${coefficient}e${normalizedExponent >= 0 ? "+" : ""}${normalizedExponent}`; }
  if (Array.isArray(value)) return value.map(crossLanguageCanonicalizeV412);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", "artifactSha256", "crossLanguageCanonicalSha256"].includes(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, crossLanguageCanonicalizeV412(entry)]));
};
export const crossLanguageCanonicalShaV412 = (value: unknown) => createHash("sha256").update(JSON.stringify(crossLanguageCanonicalizeV412(value))).digest("hex");

export function parseKerrPolarimeterInversionArtifactV412(value: unknown): KerrPolarimeterInversionArtifactV412 { const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrPolarimeterInversionArtifactV412> : null; if (!source || source.version !== KERR_POLARIMETER_INVERSION_ARTIFACT_VERSION_V412 || source.status !== "qualified-generalized-mueller-inversion-fixture-only-measured-input-unavailable" || source.source?.v411CalibrationInspectArtifactSha256 !== KERR_POLARIMETER_CALIBRATION_INSPECT_SHA256_V411 || !SHA.test(source.source.pythonOracleArtifactSha256) || source.fixtureClass !== "deterministic-nonpublishable-numerical-validation" || source.result?.status !== "qualified-test-fixture-only" || source.result.measuredAuthorityGranted !== false || source.result.publishable !== false || !source.oracleComparison || Math.max(...Object.values(source.oracleComparison)) >= 1e-10 || source.deterministicReplay !== true || source.measuredCalibrationPackPresent !== false || source.measuredInversionExecuted !== false || source.measuredAuthorityGranted !== false || source.networkAttempted !== false || source.denseShardExecuted !== false || source.browserQualification !== "not-run" || source.boundary !== "solver-qualified-by-fixture-and-independent-oracle-measured-polarimeter-remains-unavailable" || !SHA.test(source.artifactSha256 ?? "")) throw new Error("v412-artifact-identity"); return value as KerrPolarimeterInversionArtifactV412; }
export function createKerrPolarimeterInversionSummaryV412(value: unknown): KerrPolarimeterInversionSummaryV412 { const artifact = parseKerrPolarimeterInversionArtifactV412(value); return Object.freeze({ version: KERR_POLARIMETER_INVERSION_SUMMARY_VERSION_V412, status: artifact.status, artifactSha256: artifact.artifactSha256, v411CalibrationInspectArtifactSha256: artifact.source.v411CalibrationInspectArtifactSha256, fixtureQualification: "qualified-test-fixture-only" as const, metrics: artifact.result.metrics, oracleComparison: artifact.oracleComparison, measuredCalibrationPackPresent: false as const, measuredInversionExecuted: false as const, measuredAuthorityGranted: false as const, uncertaintyCombination: artifact.result.uncertaintyCombination, fullArtifactAvailable: true as const, browserQualification: "not-run" as const, boundary: "summary-only-no-matrices-or-stokes-vectors-in-react-state" as const }); }
export function parseKerrPolarimeterInversionSummaryV412(value: unknown): KerrPolarimeterInversionSummaryV412 { const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrPolarimeterInversionSummaryV412> : null; if (!source || source.version !== KERR_POLARIMETER_INVERSION_SUMMARY_VERSION_V412 || source.status !== "qualified-generalized-mueller-inversion-fixture-only-measured-input-unavailable" || !SHA.test(source.artifactSha256 ?? "") || source.v411CalibrationInspectArtifactSha256 !== KERR_POLARIMETER_CALIBRATION_INSPECT_SHA256_V411 || source.fixtureQualification !== "qualified-test-fixture-only" || !source.metrics || !source.oracleComparison || source.measuredCalibrationPackPresent !== false || source.measuredInversionExecuted !== false || source.measuredAuthorityGranted !== false || source.uncertaintyCombination !== "measurement-and-calibration-covariances-kept-separate-no-independence-claim" || source.fullArtifactAvailable !== true || source.browserQualification !== "not-run" || source.boundary !== "summary-only-no-matrices-or-stokes-vectors-in-react-state" || Object.hasOwn(source, "result") || Object.hasOwn(source, "reconstructedStokes")) throw new Error("v412-summary-identity"); return value as KerrPolarimeterInversionSummaryV412; }
export function parseKerrPolarimeterInversionResponseV412(value: unknown): KerrPolarimeterInversionResponseV412 { const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrPolarimeterInversionResponseV412> : null; if (!source || source.version !== KERR_POLARIMETER_INVERSION_RESPONSE_VERSION_V412) throw new Error("v412-response-version"); if (source.available === true && source.reason === "ready" && source.summary) return { version: KERR_POLARIMETER_INVERSION_RESPONSE_VERSION_V412, available: true, reason: "ready", summary: parseKerrPolarimeterInversionSummaryV412(source.summary) }; if (source.available === false && source.summary === null && ["lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(source.reason ?? "")) return source as KerrPolarimeterInversionResponseV412; throw new Error("v412-response-identity"); }

import { createHash } from "node:crypto";

import {
  canonicalShaV414,
  parseKerrPolarimeterDetectorArtifactV414,
  type KerrPolarimeterDetectorArtifactV414,
} from "./kerrPolarimeterDetectorCountsV414";
import { KERR_POLARIMETER_DETECTOR_ARTIFACT_SHA256_V414 } from "./kerrPolarimeterDetectorLikelihoodV415";
import {
  canonicalShaV416,
  parseKerrPolarimeterStokesEnsembleArtifactV416,
  type KerrPolarimeterStokesEnsembleArtifactV416,
} from "./kerrPolarimeterStokesEnsembleV416";

export const KERR_POLARIMETER_NONLINEAR_OBSERVABLES_VERSION_V417 =
  "v417-kerr-polarimeter-nonlinear-observables-v1" as const;
export const KERR_POLARIMETER_NONLINEAR_OBSERVABLES_ARTIFACT_VERSION_V417 =
  "v417-kerr-polarimeter-nonlinear-observables-artifact-v1" as const;
export const KERR_POLARIMETER_NONLINEAR_OBSERVABLES_SUMMARY_VERSION_V417 =
  "v417-kerr-polarimeter-nonlinear-observables-summary-v1" as const;
export const KERR_POLARIMETER_NONLINEAR_OBSERVABLES_RESPONSE_VERSION_V417 =
  "v417-kerr-polarimeter-nonlinear-observables-response-v1" as const;
export const KERR_POLARIMETER_STOKES_ENSEMBLE_ARTIFACT_SHA256_V416 =
  "859f754ace836a18ba5671bee5d53504aa2987ac2d469c6bde8230d640e88e81" as const;
export const KERR_POLARIMETER_NONLINEAR_SEED_NAMESPACE_V417 =
  "orbit-atlas-v417-nonlinear-polarization-20260730" as const;
export const KERR_POLARIMETER_NONLINEAR_TRIAL_COUNT_V417 = 8192 as const;

type Matrix = readonly (readonly number[])[];
type Vector4 = readonly [number, number, number, number];
export type KerrPolarizationObservableIdV417 = "pL" | "pC" | "evpa";
export type KerrPolarizationNoiseFamilyV417 = "counting" | "calibration";

export type KerrPolarizationObservableStatisticsV417 = Readonly<{
  observable: KerrPolarizationObservableIdV417;
  family: KerrPolarizationNoiseFamilyV417;
  count: 8192;
  predictedSigma: number;
  meanResidual: number;
  standardizedBias: number;
  residualStandardDeviation: number;
  standardDeviationRatio: number;
  coverageOneSigma: number;
  coverageTwoSigma: number;
  coverageOneSigmaAbsoluteError: number;
  coverageTwoSigmaAbsoluteError: number;
  axialResultantLength: number | null;
  axialMeanResidualRad: number | null;
}>;

export type KerrPolarimeterNonlinearRayV417 = Readonly<{
  rayIndex: number;
  countingObservableCovariance: Matrix;
  calibrationObservableCovariance: Matrix;
  countingStatistics: readonly KerrPolarizationObservableStatisticsV417[];
  calibrationStatistics: readonly KerrPolarizationObservableStatisticsV417[];
  pLRawBiasSigma: Readonly<{ counting: number; calibration: number }>;
  pLDebiasedBiasSigma: Readonly<{ counting: number; calibration: number }>;
  pLDebiasClampCount: Readonly<{ counting: number; calibration: number }>;
  physicalConeViolationCount: Readonly<{ counting: number; calibration: number }>;
  invalidObservableCount: Readonly<{ counting: number; calibration: number }>;
  firstTrial: Readonly<{
    counting: Readonly<{ pL: number; pC: number; evpaRad: number; evpaResidualRad: number }>;
    calibration: Readonly<{ pL: number; pC: number; evpaRad: number; evpaResidualRad: number }>;
  }>;
  seedPlanSha256: string;
}>;

export type KerrPolarimeterNonlinearObservablesViewV417 = Readonly<{
  version: typeof KERR_POLARIMETER_NONLINEAR_OBSERVABLES_VERSION_V417;
  status: "qualified-nonlinear-polarization-coverage-fixture-only-measured-authority-unavailable";
  source: Readonly<{
    v414DetectorArtifactSha256: typeof KERR_POLARIMETER_DETECTOR_ARTIFACT_SHA256_V414;
    v416StokesEnsembleArtifactSha256: typeof KERR_POLARIMETER_STOKES_ENSEMBLE_ARTIFACT_SHA256_V416;
  }>;
  truth: Readonly<{ stokes: Vector4; pL: number; pC: number; evpaRad: number; evpaDeg: number }>;
  seedNamespace: typeof KERR_POLARIMETER_NONLINEAR_SEED_NAMESPACE_V417;
  trialCountPerRay: typeof KERR_POLARIMETER_NONLINEAR_TRIAL_COUNT_V417;
  totalTrialCount: 32768;
  retainedTrialCount: 4;
  rays: readonly KerrPolarimeterNonlinearRayV417[];
  metrics: Readonly<{
    maximumStandardizedBiasAbsolute: number;
    maximumStandardDeviationRatioError: number;
    maximumCoverageOneSigmaError: number;
    maximumCoverageTwoSigmaError: number;
    maximumEvpaAxialMeanSigmaAbsolute: number;
    minimumEvpaAxialResultantLength: number;
    maximumPLRawBiasSigmaAbsolute: number;
    maximumPLDebiasedBiasSigmaAbsolute: number;
    pLDebiasClampCount: number;
    physicalConeViolationCount: number;
    invalidObservableCount: number;
    maximumObservableCovarianceSymmetryRelative: number;
  }>;
  observableDefinitions: Readonly<{
    pL: "sqrt-q-squared-plus-u-squared-over-i";
    pC: "signed-v-over-i";
    evpa: "half-atan2-u-q-axial-period-pi";
  }>;
  evpaResidual: "axial-wrap-minus-pi-over-two-inclusive-plus-pi-over-two-exclusive";
  uncertaintyMethod: "first-order-delta-method-prediction-validated-by-nonlinear-streaming-ensemble";
  pLDebiasModel: "high-snr-quadrature-subtraction-fixture-not-general-authority";
  ensembleMethod: "streaming-welford-and-axial-resultant-no-trial-array-retention";
  covarianceCombinationPolicy: "counting-and-calibration-observable-ensembles-never-combined";
  observedPolarization: "unavailable-synthetic-nonlinear-ensemble-is-not-observed-polarization";
  measuredDetectorAuthority: "unavailable-v368-authority-artifacts-missing";
  publishableMeasurement: false;
  sciencePayloadMutationAllowed: false;
  cinematicConsumerAllowed: false;
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  boundary: "nonlinear-polarization-coverage-fixture-only-no-measured-observation-or-authority";
}>;

export type KerrPolarimeterNonlinearObservablesArtifactV417 = Readonly<{
  version: typeof KERR_POLARIMETER_NONLINEAR_OBSERVABLES_ARTIFACT_VERSION_V417;
  generatedAt: string;
  status: KerrPolarimeterNonlinearObservablesViewV417["status"];
  source: Readonly<{
    v414DetectorArtifactSha256: typeof KERR_POLARIMETER_DETECTOR_ARTIFACT_SHA256_V414;
    v416StokesEnsembleArtifactSha256: typeof KERR_POLARIMETER_STOKES_ENSEMBLE_ARTIFACT_SHA256_V416;
    pythonOracleArtifactSha256: string;
  }>;
  sourceFiles: Readonly<{
    v414DetectorFileSha256: string;
    v416EnsembleFileSha256: string;
    pythonOracleFileSha256: string;
  }>;
  view: KerrPolarimeterNonlinearObservablesViewV417;
  oracleComparison: Readonly<{
    maximumPredictedSigmaRelative: number;
    maximumMeanResidualAbsolute: number;
    maximumStandardDeviationRelative: number;
    maximumCoverageAbsolute: number;
    maximumAxialResultantAbsolute: number;
    maximumFirstTrialObservableAbsolute: number;
  }>;
  deterministicReplay: true;
  measuredDetectorAuthorityGranted: false;
  observedPolarizationAvailable: false;
  networkAttempted: false;
  denseShardExecuted: false;
  browserQualification: "not-run";
  boundary: "nonlinear-polarization-ensemble-fixture-qualified-not-measured-polarization-or-authority";
  artifactSha256: string;
}>;

export type KerrPolarimeterNonlinearObservablesSummaryV417 = Readonly<{
  version: typeof KERR_POLARIMETER_NONLINEAR_OBSERVABLES_SUMMARY_VERSION_V417;
  status: KerrPolarimeterNonlinearObservablesViewV417["status"];
  artifactSha256: string;
  v416StokesEnsembleArtifactSha256: typeof KERR_POLARIMETER_STOKES_ENSEMBLE_ARTIFACT_SHA256_V416;
  truth: KerrPolarimeterNonlinearObservablesViewV417["truth"];
  rayCount: 4;
  trialCountPerRay: 8192;
  totalTrialCount: 32768;
  retainedTrialCount: 4;
  metrics: KerrPolarimeterNonlinearObservablesViewV417["metrics"];
  oracleComparison: KerrPolarimeterNonlinearObservablesArtifactV417["oracleComparison"];
  observedPolarization: KerrPolarimeterNonlinearObservablesViewV417["observedPolarization"];
  measuredDetectorAuthority: KerrPolarimeterNonlinearObservablesViewV417["measuredDetectorAuthority"];
  fullArtifactAvailable: true;
  browserQualification: "not-run";
  boundary: "summary-only-no-ray-covariances-or-trial-observables-in-react-state";
}>;

export type KerrPolarimeterNonlinearObservablesResponseV417 = Readonly<{
  version: typeof KERR_POLARIMETER_NONLINEAR_OBSERVABLES_RESPONSE_VERSION_V417;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed";
  summary: KerrPolarimeterNonlinearObservablesSummaryV417 | null;
}>;

const SHA = /^[a-f0-9]{64}$/;
const EXPECTED_ONE_SIGMA = 0.6826894921370859;
const EXPECTED_TWO_SIGMA = 0.9544997361036416;
const TWO_POW_53 = 9_007_199_254_740_992;
const relative = (left: number, right: number) =>
  Math.abs(left - right) / Math.max(Number.MIN_VALUE, Math.abs(left), Math.abs(right));
const freezeMatrix = (matrix: Matrix): Matrix => Object.freeze(matrix.map((row) => Object.freeze([...row])));
const transpose = (matrix: Matrix): number[][] => matrix[0].map((_, column) => matrix.map((row) => row[column]));
const multiply = (left: Matrix, right: Matrix): number[][] =>
  left.map((row) =>
    right[0].map((_, column) => row.reduce((sum, value, index) => sum + value * right[index][column], 0)),
  );
const matrixVector = (matrix: Matrix, vector: readonly number[]): number[] =>
  matrix.map((row) => row.reduce((sum, value, index) => sum + value * vector[index], 0));
const covarianceTransform = (operator: Matrix, covariance: Matrix) =>
  multiply(multiply(operator, covariance), transpose(operator));

function uniform53(label: string): number {
  const digest = createHash("sha256").update(label).digest();
  const high32 = digest.readUInt32BE(0);
  const followingHigh21 = Math.floor(digest.readUInt32BE(4) / 2 ** 11);
  return (high32 * 2 ** 21 + followingHigh21 + 0.5) / TWO_POW_53;
}
function standardNormal(label: string): number {
  return Math.sqrt(-2 * Math.log(uniform53(`${label}:u1`))) * Math.cos(2 * Math.PI * uniform53(`${label}:u2`));
}
function smallPoisson(lambda: number, label: string): number {
  const target = uniform53(`${label}:poisson`);
  let probability = Math.exp(-lambda);
  let cumulative = probability;
  let count = 0;
  while (target > cumulative) {
    count += 1;
    probability *= lambda / count;
    cumulative += probability;
    if (count > 128) throw new Error("v417-small-poisson-tail");
  }
  return count;
}
function cholesky(matrix: Matrix): number[][] {
  const size = matrix.length;
  const lower = Array.from({ length: size }, () => Array(size).fill(0));
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column <= row; column += 1) {
      let value = matrix[row][column];
      for (let inner = 0; inner < column; inner += 1) value -= lower[row][inner] * lower[column][inner];
      if (row === column) {
        if (!(value > 0)) throw new Error("v417-cholesky-positive-definite");
        lower[row][column] = Math.sqrt(value);
      } else lower[row][column] = value / lower[column][column];
    }
  }
  return lower;
}
const lowerVector = (lower: Matrix, vector: readonly number[]) =>
  lower.map((row) => row.reduce((sum, value, index) => sum + value * vector[index], 0));

function observables(stokes: readonly number[]) {
  const [i, q, u, v] = stokes;
  if (!(i > 0) || !stokes.every(Number.isFinite)) return null;
  const linear = Math.hypot(q, u);
  if (!(linear > 0)) return null;
  return Object.freeze({ pL: linear / i, pC: v / i, evpaRad: 0.5 * Math.atan2(u, q) });
}
function axialResidual(value: number, truth: number): number {
  let residual = value - truth;
  while (residual < -Math.PI / 2) residual += Math.PI;
  while (residual >= Math.PI / 2) residual -= Math.PI;
  return residual;
}
function observableJacobian(stokes: Vector4): number[][] {
  const [i, q, u, v] = stokes;
  const linear = Math.hypot(q, u);
  const square = q ** 2 + u ** 2;
  return [
    [-linear / i ** 2, q / (i * linear), u / (i * linear), 0],
    [-v / i ** 2, 0, 0, 1 / i],
    [0, -0.5 * u / square, 0.5 * q / square, 0],
  ];
}
function covarianceSymmetryRelative(matrix: Matrix): number {
  let maximum = 0;
  for (let row = 0; row < matrix.length; row += 1) {
    for (let column = 0; column < matrix.length; column += 1) {
      maximum = Math.max(maximum, relative(matrix[row][column], matrix[column][row]));
    }
  }
  return maximum;
}

type Running = {
  count: number;
  mean: number;
  m2: number;
  one: number;
  two: number;
  cosine: number;
  sine: number;
};
const running = (): Running => ({ count: 0, mean: 0, m2: 0, one: 0, two: 0, cosine: 0, sine: 0 });
function updateRunning(state: Running, residual: number, sigma: number, axial: boolean): void {
  const pull = residual / sigma;
  state.count += 1;
  const delta = residual - state.mean;
  state.mean += delta / state.count;
  state.m2 += delta * (residual - state.mean);
  if (Math.abs(pull) <= 1) state.one += 1;
  if (Math.abs(pull) <= 2) state.two += 1;
  if (axial) {
    state.cosine += Math.cos(2 * residual);
    state.sine += Math.sin(2 * residual);
  }
}
function finalizeRunning(
  state: Running,
  observable: KerrPolarizationObservableIdV417,
  family: KerrPolarizationNoiseFamilyV417,
  sigma: number,
): KerrPolarizationObservableStatisticsV417 {
  if (state.count !== KERR_POLARIMETER_NONLINEAR_TRIAL_COUNT_V417) throw new Error("v417-running-count");
  const coverageOneSigma = state.one / state.count;
  const coverageTwoSigma = state.two / state.count;
  const axial = observable === "evpa";
  const meanCosine = state.cosine / state.count;
  const meanSine = state.sine / state.count;
  return Object.freeze({
    observable,
    family,
    count: KERR_POLARIMETER_NONLINEAR_TRIAL_COUNT_V417,
    predictedSigma: sigma,
    meanResidual: state.mean,
    standardizedBias: state.mean / sigma,
    residualStandardDeviation: Math.sqrt(state.m2 / (state.count - 1)),
    standardDeviationRatio: Math.sqrt(state.m2 / (state.count - 1)) / sigma,
    coverageOneSigma,
    coverageTwoSigma,
    coverageOneSigmaAbsoluteError: Math.abs(coverageOneSigma - EXPECTED_ONE_SIGMA),
    coverageTwoSigmaAbsoluteError: Math.abs(coverageTwoSigma - EXPECTED_TWO_SIGMA),
    axialResultantLength: axial ? Math.hypot(meanCosine, meanSine) : null,
    axialMeanResidualRad: axial ? 0.5 * Math.atan2(meanSine, meanCosine) : null,
  });
}

function createRay(
  ensembleRay: KerrPolarimeterStokesEnsembleArtifactV416["view"]["rays"][number],
  detectorRay: KerrPolarimeterDetectorArtifactV414["view"]["rays"][number],
  detector: KerrPolarimeterDetectorArtifactV414,
  truthStokes: Vector4,
  truthObservable: Readonly<{ pL: number; pC: number; evpaRad: number }>,
): KerrPolarimeterNonlinearRayV417 {
  const jacobian = observableJacobian(truthStokes);
  const countingObservableCovariance = covarianceTransform(jacobian, ensembleRay.countingStokesCovariance);
  const calibrationObservableCovariance = covarianceTransform(jacobian, ensembleRay.calibrationStokesCovariance);
  const countingSigma = countingObservableCovariance.map((row, index) => Math.sqrt(row[index]));
  const calibrationSigma = calibrationObservableCovariance.map((row, index) => Math.sqrt(row[index]));
  const calibrationLower = cholesky(detectorRay.calibrationCovarianceElectronSquared);
  const states = {
    counting: [running(), running(), running()],
    calibration: [running(), running(), running()],
  };
  const rawPL = { counting: running(), calibration: running() };
  const debiasedPL = { counting: running(), calibration: running() };
  const clamp = { counting: 0, calibration: 0 };
  const physical = { counting: 0, calibration: 0 };
  const invalid = { counting: 0, calibration: 0 };
  let firstCounting: KerrPolarimeterNonlinearRayV417["firstTrial"]["counting"] | null = null;
  let firstCalibration: KerrPolarimeterNonlinearRayV417["firstTrial"]["calibration"] | null = null;
  for (let trial = 0; trial < KERR_POLARIMETER_NONLINEAR_TRIAL_COUNT_V417; trial += 1) {
    const countingResidual = detectorRay.channels.map((channel) => {
      const prefix = `${KERR_POLARIMETER_NONLINEAR_SEED_NAMESPACE_V417}:ray-${detectorRay.rayIndex}:trial-${trial}:channel-${channel.channelIndex}`;
      const source = Math.sqrt(channel.sourceElectronExpectation) * standardNormal(`${prefix}:source`);
      const dark = smallPoisson(channel.darkElectronExpectation, `${prefix}:dark`) - channel.darkElectronExpectation;
      const background =
        smallPoisson(channel.backgroundElectronExpectation, `${prefix}:background`) -
        channel.backgroundElectronExpectation;
      const read =
        detector.view.fixture.readNoiseRmsElectronPerPixelRead *
        Math.sqrt(detector.view.fixture.readCount) *
        standardNormal(`${prefix}:read`);
      return source + dark + background + read;
    });
    const calibrationZ = detectorRay.channels.map((channel) =>
      standardNormal(
        `${KERR_POLARIMETER_NONLINEAR_SEED_NAMESPACE_V417}:ray-${detectorRay.rayIndex}:trial-${trial}:calibration-${channel.channelIndex}`,
      ),
    );
    const calibrationResidual = lowerVector(calibrationLower, calibrationZ);
    const stokesByFamily = {
      counting: matrixVector(ensembleRay.inverseResponseMatrix, countingResidual).map(
        (value, component) => truthStokes[component] + value,
      ),
      calibration: matrixVector(ensembleRay.inverseResponseMatrix, calibrationResidual).map(
        (value, component) => truthStokes[component] + value,
      ),
    };
    for (const family of ["counting", "calibration"] as const) {
      const stokes = stokesByFamily[family];
      const current = observables(stokes);
      if (!current) {
        invalid[family] += 1;
        continue;
      }
      const totalPolarization = Math.hypot(stokes[1], stokes[2], stokes[3]) / stokes[0];
      if (!(totalPolarization <= 1)) physical[family] += 1;
      const residuals = [
        current.pL - truthObservable.pL,
        current.pC - truthObservable.pC,
        axialResidual(current.evpaRad, truthObservable.evpaRad),
      ];
      const sigma = family === "counting" ? countingSigma : calibrationSigma;
      residuals.forEach((residual, observable) =>
        updateRunning(states[family][observable], residual, sigma[observable], observable === 2),
      );
      updateRunning(rawPL[family], residuals[0], sigma[0], false);
      const debiasSquare = current.pL ** 2 - sigma[0] ** 2;
      if (debiasSquare <= 0) clamp[family] += 1;
      const debiased = Math.sqrt(Math.max(0, debiasSquare));
      updateRunning(debiasedPL[family], debiased - truthObservable.pL, sigma[0], false);
      const diagnostic = Object.freeze({
        pL: current.pL,
        pC: current.pC,
        evpaRad: current.evpaRad,
        evpaResidualRad: residuals[2],
      });
      if (trial === 0 && family === "counting") firstCounting = diagnostic;
      if (trial === 0 && family === "calibration") firstCalibration = diagnostic;
    }
  }
  if (invalid.counting !== 0 || invalid.calibration !== 0 || !firstCounting || !firstCalibration) {
    throw new Error("v417-invalid-observable");
  }
  const ids = ["pL", "pC", "evpa"] as const;
  const countingStatistics = ids.map((id, index) =>
    finalizeRunning(states.counting[index], id, "counting", countingSigma[index]),
  );
  const calibrationStatistics = ids.map((id, index) =>
    finalizeRunning(states.calibration[index], id, "calibration", calibrationSigma[index]),
  );
  const seedPlanSha256 = createHash("sha256")
    .update(
      `${KERR_POLARIMETER_NONLINEAR_SEED_NAMESPACE_V417}|ray=${detectorRay.rayIndex}|trials=${KERR_POLARIMETER_NONLINEAR_TRIAL_COUNT_V417}|observables=pL,pC,evpa|families=counting,calibration`,
    )
    .digest("hex");
  return Object.freeze({
    rayIndex: detectorRay.rayIndex,
    countingObservableCovariance: freezeMatrix(countingObservableCovariance),
    calibrationObservableCovariance: freezeMatrix(calibrationObservableCovariance),
    countingStatistics: Object.freeze(countingStatistics),
    calibrationStatistics: Object.freeze(calibrationStatistics),
    pLRawBiasSigma: Object.freeze({
      counting: rawPL.counting.mean / countingSigma[0],
      calibration: rawPL.calibration.mean / calibrationSigma[0],
    }),
    pLDebiasedBiasSigma: Object.freeze({
      counting: debiasedPL.counting.mean / countingSigma[0],
      calibration: debiasedPL.calibration.mean / calibrationSigma[0],
    }),
    pLDebiasClampCount: Object.freeze(clamp),
    physicalConeViolationCount: Object.freeze(physical),
    invalidObservableCount: Object.freeze(invalid),
    firstTrial: Object.freeze({ counting: firstCounting, calibration: firstCalibration }),
    seedPlanSha256,
  });
}

export function createKerrPolarimeterNonlinearObservablesViewV417(
  detectorArtifactValue: unknown,
  ensembleArtifactValue: unknown,
): KerrPolarimeterNonlinearObservablesViewV417 {
  const detector = parseKerrPolarimeterDetectorArtifactV414(detectorArtifactValue);
  const ensemble = parseKerrPolarimeterStokesEnsembleArtifactV416(ensembleArtifactValue);
  if (
    detector.artifactSha256 !== KERR_POLARIMETER_DETECTOR_ARTIFACT_SHA256_V414 ||
    canonicalShaV414(detector) !== detector.artifactSha256 ||
    ensemble.artifactSha256 !== KERR_POLARIMETER_STOKES_ENSEMBLE_ARTIFACT_SHA256_V416 ||
    canonicalShaV416(ensemble) !== ensemble.artifactSha256 ||
    ensemble.source.v414DetectorArtifactSha256 !== detector.artifactSha256 ||
    detector.measuredDetectorAuthorityGranted !== false ||
    ensemble.measuredDetectorAuthorityGranted !== false
  ) {
    throw new Error("v417-authority-lock");
  }
  const truthStokes = ensemble.view.truthStokes;
  const truthObservable = observables(truthStokes);
  if (!truthObservable) throw new Error("v417-truth-observable");
  const rays = ensemble.view.rays.map((ensembleRay) => {
    const detectorRay = detector.view.rays.find((entry) => entry.rayIndex === ensembleRay.rayIndex);
    if (!detectorRay) throw new Error("v417-detector-ray");
    return createRay(ensembleRay, detectorRay, detector, truthStokes, truthObservable);
  });
  const statistics = rays.flatMap((ray) => [...ray.countingStatistics, ...ray.calibrationStatistics]);
  const evpa = statistics.filter((entry) => entry.observable === "evpa");
  const covariances = rays.flatMap((ray) => [ray.countingObservableCovariance, ray.calibrationObservableCovariance]);
  const metrics = Object.freeze({
    maximumStandardizedBiasAbsolute: Math.max(...statistics.map((entry) => Math.abs(entry.standardizedBias))),
    maximumStandardDeviationRatioError: Math.max(
      ...statistics.map((entry) => Math.abs(entry.standardDeviationRatio - 1)),
    ),
    maximumCoverageOneSigmaError: Math.max(...statistics.map((entry) => entry.coverageOneSigmaAbsoluteError)),
    maximumCoverageTwoSigmaError: Math.max(...statistics.map((entry) => entry.coverageTwoSigmaAbsoluteError)),
    maximumEvpaAxialMeanSigmaAbsolute: Math.max(
      ...evpa.map((entry) => Math.abs(entry.axialMeanResidualRad!) / entry.predictedSigma),
    ),
    minimumEvpaAxialResultantLength: Math.min(...evpa.map((entry) => entry.axialResultantLength!)),
    maximumPLRawBiasSigmaAbsolute: Math.max(
      ...rays.flatMap((ray) => Object.values(ray.pLRawBiasSigma).map(Math.abs)),
    ),
    maximumPLDebiasedBiasSigmaAbsolute: Math.max(
      ...rays.flatMap((ray) => Object.values(ray.pLDebiasedBiasSigma).map(Math.abs)),
    ),
    pLDebiasClampCount: rays.reduce(
      (sum, ray) => sum + ray.pLDebiasClampCount.counting + ray.pLDebiasClampCount.calibration,
      0,
    ),
    physicalConeViolationCount: rays.reduce(
      (sum, ray) => sum + ray.physicalConeViolationCount.counting + ray.physicalConeViolationCount.calibration,
      0,
    ),
    invalidObservableCount: rays.reduce(
      (sum, ray) => sum + ray.invalidObservableCount.counting + ray.invalidObservableCount.calibration,
      0,
    ),
    maximumObservableCovarianceSymmetryRelative: Math.max(...covariances.map(covarianceSymmetryRelative)),
  });
  if (
    rays.length !== 4 ||
    metrics.maximumStandardizedBiasAbsolute >= 0.05 ||
    metrics.maximumStandardDeviationRatioError >= 0.05 ||
    metrics.maximumCoverageOneSigmaError >= 0.02 ||
    metrics.maximumCoverageTwoSigmaError >= 0.01 ||
    metrics.maximumEvpaAxialMeanSigmaAbsolute >= 0.05 ||
    metrics.minimumEvpaAxialResultantLength <= 0.999 ||
    metrics.maximumPLRawBiasSigmaAbsolute >= 0.05 ||
    metrics.maximumPLDebiasedBiasSigmaAbsolute >= 0.05 ||
    metrics.pLDebiasClampCount !== 0 ||
    metrics.physicalConeViolationCount !== 0 ||
    metrics.invalidObservableCount !== 0 ||
    metrics.maximumObservableCovarianceSymmetryRelative >= 1e-12 ||
    !Object.values(metrics).every(Number.isFinite)
  ) {
    throw new Error(`v417-gate:${JSON.stringify(metrics)}`);
  }
  return Object.freeze({
    version: KERR_POLARIMETER_NONLINEAR_OBSERVABLES_VERSION_V417,
    status: "qualified-nonlinear-polarization-coverage-fixture-only-measured-authority-unavailable",
    source: Object.freeze({
      v414DetectorArtifactSha256: KERR_POLARIMETER_DETECTOR_ARTIFACT_SHA256_V414,
      v416StokesEnsembleArtifactSha256: KERR_POLARIMETER_STOKES_ENSEMBLE_ARTIFACT_SHA256_V416,
    }),
    truth: Object.freeze({
      stokes: truthStokes,
      pL: truthObservable.pL,
      pC: truthObservable.pC,
      evpaRad: truthObservable.evpaRad,
      evpaDeg: (truthObservable.evpaRad * 180) / Math.PI,
    }),
    seedNamespace: KERR_POLARIMETER_NONLINEAR_SEED_NAMESPACE_V417,
    trialCountPerRay: KERR_POLARIMETER_NONLINEAR_TRIAL_COUNT_V417,
    totalTrialCount: 32768,
    retainedTrialCount: 4,
    rays: Object.freeze(rays),
    metrics,
    observableDefinitions: Object.freeze({
      pL: "sqrt-q-squared-plus-u-squared-over-i",
      pC: "signed-v-over-i",
      evpa: "half-atan2-u-q-axial-period-pi",
    }),
    evpaResidual: "axial-wrap-minus-pi-over-two-inclusive-plus-pi-over-two-exclusive",
    uncertaintyMethod: "first-order-delta-method-prediction-validated-by-nonlinear-streaming-ensemble",
    pLDebiasModel: "high-snr-quadrature-subtraction-fixture-not-general-authority",
    ensembleMethod: "streaming-welford-and-axial-resultant-no-trial-array-retention",
    covarianceCombinationPolicy: "counting-and-calibration-observable-ensembles-never-combined",
    observedPolarization: "unavailable-synthetic-nonlinear-ensemble-is-not-observed-polarization",
    measuredDetectorAuthority: "unavailable-v368-authority-artifacts-missing",
    publishableMeasurement: false,
    sciencePayloadMutationAllowed: false,
    cinematicConsumerAllowed: false,
    denseCampaignStatus: "incomplete-0-of-49",
    browserQualification: "not-run",
    boundary: "nonlinear-polarization-coverage-fixture-only-no-measured-observation-or-authority",
  });
}

const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value as Record<string, unknown>)
            .filter(([key]) => !["generatedAt", "artifactSha256"].includes(key))
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
export const canonicalShaV417 = (value: unknown): string =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

export function parseKerrPolarimeterNonlinearObservablesArtifactV417(
  value: unknown,
): KerrPolarimeterNonlinearObservablesArtifactV417 {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrPolarimeterNonlinearObservablesArtifactV417>)
      : null;
  if (
    !source ||
    source.version !== KERR_POLARIMETER_NONLINEAR_OBSERVABLES_ARTIFACT_VERSION_V417 ||
    source.status !== "qualified-nonlinear-polarization-coverage-fixture-only-measured-authority-unavailable" ||
    source.source?.v414DetectorArtifactSha256 !== KERR_POLARIMETER_DETECTOR_ARTIFACT_SHA256_V414 ||
    source.source.v416StokesEnsembleArtifactSha256 !== KERR_POLARIMETER_STOKES_ENSEMBLE_ARTIFACT_SHA256_V416 ||
    !SHA.test(source.source.pythonOracleArtifactSha256 ?? "") ||
    !Object.values(source.sourceFiles ?? {}).every((entry) => SHA.test(entry)) ||
    source.view?.trialCountPerRay !== 8192 ||
    source.view.totalTrialCount !== 32768 ||
    source.view.retainedTrialCount !== 4 ||
    source.view.rays?.length !== 4 ||
    source.view.observedPolarization !== "unavailable-synthetic-nonlinear-ensemble-is-not-observed-polarization" ||
    source.view.publishableMeasurement !== false ||
    Math.max(...Object.values(source.oracleComparison ?? {})) >= 1e-10 ||
    source.deterministicReplay !== true ||
    source.measuredDetectorAuthorityGranted !== false ||
    source.observedPolarizationAvailable !== false ||
    source.networkAttempted !== false ||
    source.denseShardExecuted !== false ||
    source.browserQualification !== "not-run" ||
    source.boundary !== "nonlinear-polarization-ensemble-fixture-qualified-not-measured-polarization-or-authority" ||
    !SHA.test(source.artifactSha256 ?? "")
  ) {
    throw new Error("v417-artifact-identity");
  }
  return value as KerrPolarimeterNonlinearObservablesArtifactV417;
}

export function createKerrPolarimeterNonlinearObservablesSummaryV417(
  value: unknown,
): KerrPolarimeterNonlinearObservablesSummaryV417 {
  const artifact = parseKerrPolarimeterNonlinearObservablesArtifactV417(value);
  return Object.freeze({
    version: KERR_POLARIMETER_NONLINEAR_OBSERVABLES_SUMMARY_VERSION_V417,
    status: artifact.status,
    artifactSha256: artifact.artifactSha256,
    v416StokesEnsembleArtifactSha256: artifact.source.v416StokesEnsembleArtifactSha256,
    truth: artifact.view.truth,
    rayCount: 4,
    trialCountPerRay: 8192,
    totalTrialCount: 32768,
    retainedTrialCount: 4,
    metrics: artifact.view.metrics,
    oracleComparison: artifact.oracleComparison,
    observedPolarization: artifact.view.observedPolarization,
    measuredDetectorAuthority: artifact.view.measuredDetectorAuthority,
    fullArtifactAvailable: true,
    browserQualification: "not-run",
    boundary: "summary-only-no-ray-covariances-or-trial-observables-in-react-state",
  });
}

export function parseKerrPolarimeterNonlinearObservablesSummaryV417(
  value: unknown,
): KerrPolarimeterNonlinearObservablesSummaryV417 {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrPolarimeterNonlinearObservablesSummaryV417>)
      : null;
  if (
    !source ||
    source.version !== KERR_POLARIMETER_NONLINEAR_OBSERVABLES_SUMMARY_VERSION_V417 ||
    source.status !== "qualified-nonlinear-polarization-coverage-fixture-only-measured-authority-unavailable" ||
    !SHA.test(source.artifactSha256 ?? "") ||
    source.v416StokesEnsembleArtifactSha256 !== KERR_POLARIMETER_STOKES_ENSEMBLE_ARTIFACT_SHA256_V416 ||
    source.rayCount !== 4 ||
    source.trialCountPerRay !== 8192 ||
    source.totalTrialCount !== 32768 ||
    source.retainedTrialCount !== 4 ||
    !source.truth ||
    !source.metrics ||
    !source.oracleComparison ||
    source.observedPolarization !== "unavailable-synthetic-nonlinear-ensemble-is-not-observed-polarization" ||
    source.measuredDetectorAuthority !== "unavailable-v368-authority-artifacts-missing" ||
    source.fullArtifactAvailable !== true ||
    source.browserQualification !== "not-run" ||
    source.boundary !== "summary-only-no-ray-covariances-or-trial-observables-in-react-state" ||
    Object.hasOwn(source, "rays") ||
    Object.hasOwn(source, "view")
  ) {
    throw new Error("v417-summary-identity");
  }
  return value as KerrPolarimeterNonlinearObservablesSummaryV417;
}

export function parseKerrPolarimeterNonlinearObservablesResponseV417(
  value: unknown,
): KerrPolarimeterNonlinearObservablesResponseV417 {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrPolarimeterNonlinearObservablesResponseV417>)
      : null;
  if (!source || source.version !== KERR_POLARIMETER_NONLINEAR_OBSERVABLES_RESPONSE_VERSION_V417) {
    throw new Error("v417-response-version");
  }
  if (source.available === true && source.reason === "ready" && source.summary) {
    return {
      version: KERR_POLARIMETER_NONLINEAR_OBSERVABLES_RESPONSE_VERSION_V417,
      available: true,
      reason: "ready",
      summary: parseKerrPolarimeterNonlinearObservablesSummaryV417(source.summary),
    };
  }
  if (
    source.available === false &&
    source.summary === null &&
    ["lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(source.reason ?? "")
  ) {
    return source as KerrPolarimeterNonlinearObservablesResponseV417;
  }
  throw new Error("v417-response-identity");
}

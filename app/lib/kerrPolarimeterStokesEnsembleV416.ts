import { createHash } from "node:crypto";

import {
  KERR_PLANCK_CONSTANT_J_S_V328,
  parseKerrSciencePhotonBandViewV328,
  type KerrSciencePhotonBandViewV328,
} from "./kerrSciencePhotonBandsV328";
import {
  KERR_POLARIMETER_DETECTOR_ARTIFACT_SHA256_V414,
  canonicalShaV415,
  parseKerrPolarimeterDetectorLikelihoodArtifactV415,
} from "./kerrPolarimeterDetectorLikelihoodV415";
import {
  canonicalShaV414,
  parseKerrPolarimeterDetectorArtifactV414,
  type KerrPolarimeterDetectorArtifactV414,
} from "./kerrPolarimeterDetectorCountsV414";
import {
  interpolateParsedKerrPolarimeterResponseMatrixV413,
  parseKerrPolarimeterSpectralPackV413,
  type KerrPolarimeterSpectralPackV413,
} from "./kerrPolarimeterSpectralResponseV413";

export const KERR_POLARIMETER_STOKES_ENSEMBLE_VERSION_V416 =
  "v416-kerr-polarimeter-stokes-ensemble-v1" as const;
export const KERR_POLARIMETER_STOKES_ENSEMBLE_ARTIFACT_VERSION_V416 =
  "v416-kerr-polarimeter-stokes-ensemble-artifact-v1" as const;
export const KERR_POLARIMETER_STOKES_ENSEMBLE_SUMMARY_VERSION_V416 =
  "v416-kerr-polarimeter-stokes-ensemble-summary-v1" as const;
export const KERR_POLARIMETER_STOKES_ENSEMBLE_RESPONSE_VERSION_V416 =
  "v416-kerr-polarimeter-stokes-ensemble-response-v1" as const;
export const KERR_POLARIMETER_DETECTOR_LIKELIHOOD_ARTIFACT_SHA256_V415 =
  "026df02475951260080eb33623a2328b6d6ec47a47691ebae4b879a46dd9e676" as const;
export const KERR_POLARIMETER_ENSEMBLE_SEED_NAMESPACE_V416 =
  "orbit-atlas-v416-stokes-ensemble-20260730" as const;
export const KERR_POLARIMETER_ENSEMBLE_TRIAL_COUNT_V416 = 4096 as const;

type Matrix = readonly (readonly number[])[];
type Vector4 = readonly [number, number, number, number];

export type KerrPolarimeterPullStatisticsV416 = Readonly<{
  component: 0 | 1 | 2 | 3;
  count: 4096;
  mean: number;
  standardDeviation: number;
  coverageOneSigma: number;
  coverageTwoSigma: number;
  coverageOneSigmaAbsoluteError: number;
  coverageTwoSigmaAbsoluteError: number;
}>;

export type KerrPolarimeterStokesEnsembleRayV416 = Readonly<{
  rayIndex: number;
  effectiveResponseMatrix: Matrix;
  inverseResponseMatrix: Matrix;
  countingStokesCovariance: Matrix;
  calibrationStokesCovariance: Matrix;
  responseConditionNumber: number;
  sourceExpectationClosureRelative: number;
  noiselessStokesRecoveryAbsolute: number;
  countingPullStatistics: readonly KerrPolarimeterPullStatisticsV416[];
  calibrationPullStatistics: readonly KerrPolarimeterPullStatisticsV416[];
  firstTrial: Readonly<{
    countingPull: Vector4;
    calibrationPull: Vector4;
  }>;
  seedPlanSha256: string;
}>;

export type KerrPolarimeterStokesEnsembleViewV416 = Readonly<{
  version: typeof KERR_POLARIMETER_STOKES_ENSEMBLE_VERSION_V416;
  status: "qualified-streaming-stokes-coverage-fixture-only-measured-authority-unavailable";
  source: Readonly<{
    v414DetectorArtifactSha256: typeof KERR_POLARIMETER_DETECTOR_ARTIFACT_SHA256_V414;
    v415LikelihoodArtifactSha256: typeof KERR_POLARIMETER_DETECTOR_LIKELIHOOD_ARTIFACT_SHA256_V415;
    v413SpectralArtifactSha256: string;
  }>;
  truthStokes: Vector4;
  seedNamespace: typeof KERR_POLARIMETER_ENSEMBLE_SEED_NAMESPACE_V416;
  trialCountPerRay: typeof KERR_POLARIMETER_ENSEMBLE_TRIAL_COUNT_V416;
  totalTrialCount: 16384;
  retainedTrialCount: 4;
  rays: readonly KerrPolarimeterStokesEnsembleRayV416[];
  metrics: Readonly<{
    maximumSourceExpectationClosureRelative: number;
    maximumNoiselessStokesRecoveryAbsolute: number;
    maximumResponseConditionNumber: number;
    maximumCountingPullMeanAbsolute: number;
    maximumCountingPullStandardDeviationError: number;
    maximumCountingCoverageOneSigmaError: number;
    maximumCountingCoverageTwoSigmaError: number;
    maximumCalibrationPullMeanAbsolute: number;
    maximumCalibrationPullStandardDeviationError: number;
    maximumCalibrationCoverageOneSigmaError: number;
    maximumCalibrationCoverageTwoSigmaError: number;
    maximumCovarianceSymmetryRelative: number;
  }>;
  ensembleMethod: "streaming-welford-no-trial-array-retention";
  sourceCountingModel: "poisson-photoelectron-thinning-high-count-normal-approximation-with-small-lambda-poisson-and-read-gaussian";
  calibrationModel: "separate-multivariate-gaussian-response-covariance";
  covarianceCombinationPolicy: "counting-and-calibration-ensembles-independent-and-never-combined";
  recoveryModel: "per-ray-spectrum-weighted-four-by-four-effective-mueller-direct-inversion";
  observedCounts: "unavailable-synthetic-ensemble-is-not-observed-detector-data";
  measuredDetectorAuthority: "unavailable-v368-authority-artifacts-missing";
  syntheticFixtureAvailable: true;
  publishableMeasurement: false;
  sciencePayloadMutationAllowed: false;
  cinematicConsumerAllowed: false;
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  boundary: "coverage-and-stokes-recovery-fixture-only-no-measured-counts-or-detector-authority";
}>;

export type KerrPolarimeterStokesEnsembleArtifactV416 = Readonly<{
  version: typeof KERR_POLARIMETER_STOKES_ENSEMBLE_ARTIFACT_VERSION_V416;
  generatedAt: string;
  status: KerrPolarimeterStokesEnsembleViewV416["status"];
  source: Readonly<{
    v414DetectorArtifactSha256: typeof KERR_POLARIMETER_DETECTOR_ARTIFACT_SHA256_V414;
    v415LikelihoodArtifactSha256: typeof KERR_POLARIMETER_DETECTOR_LIKELIHOOD_ARTIFACT_SHA256_V415;
    pythonOracleArtifactSha256: string;
  }>;
  sourceFiles: Readonly<{
    photonFileSha256: string;
    profileFileSha256: string;
    spectralFileSha256: string;
    v414DetectorFileSha256: string;
    v415LikelihoodFileSha256: string;
    pythonOracleFileSha256: string;
  }>;
  view: KerrPolarimeterStokesEnsembleViewV416;
  oracleComparison: Readonly<{
    maximumEffectiveResponseRelative: number;
    maximumPullMeanAbsolute: number;
    maximumPullStandardDeviationAbsolute: number;
    maximumCoverageAbsolute: number;
    maximumFirstTrialPullAbsolute: number;
  }>;
  deterministicReplay: true;
  measuredDetectorAuthorityGranted: false;
  observedCountsAvailable: false;
  networkAttempted: false;
  denseShardExecuted: false;
  browserQualification: "not-run";
  boundary: "streaming-stokes-ensemble-fixture-qualified-not-measured-observation-or-authority";
  artifactSha256: string;
}>;

export type KerrPolarimeterStokesEnsembleSummaryV416 = Readonly<{
  version: typeof KERR_POLARIMETER_STOKES_ENSEMBLE_SUMMARY_VERSION_V416;
  status: KerrPolarimeterStokesEnsembleViewV416["status"];
  artifactSha256: string;
  v415LikelihoodArtifactSha256: typeof KERR_POLARIMETER_DETECTOR_LIKELIHOOD_ARTIFACT_SHA256_V415;
  rayCount: 4;
  trialCountPerRay: 4096;
  totalTrialCount: 16384;
  retainedTrialCount: 4;
  metrics: KerrPolarimeterStokesEnsembleViewV416["metrics"];
  oracleComparison: KerrPolarimeterStokesEnsembleArtifactV416["oracleComparison"];
  observedCounts: KerrPolarimeterStokesEnsembleViewV416["observedCounts"];
  measuredDetectorAuthority: KerrPolarimeterStokesEnsembleViewV416["measuredDetectorAuthority"];
  fullArtifactAvailable: true;
  browserQualification: "not-run";
  boundary: "summary-only-no-ray-matrices-covariances-or-trial-vectors-in-react-state";
}>;

export type KerrPolarimeterStokesEnsembleResponseV416 = Readonly<{
  version: typeof KERR_POLARIMETER_STOKES_ENSEMBLE_RESPONSE_VERSION_V416;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed";
  summary: KerrPolarimeterStokesEnsembleSummaryV416 | null;
}>;

const SHA = /^[a-f0-9]{64}$/;
const TRUTH: Vector4 = Object.freeze([1, 0.08, -0.05, 0.01]);
const SPEED_OF_LIGHT_M_S = 299_792_458;
const BOLTZMANN_CONSTANT_J_K = 1.380649e-23;
const TWO_POW_53 = 9_007_199_254_740_992;
const EXPECTED_ONE_SIGMA = 0.6826894921370859;
const EXPECTED_TWO_SIGMA = 0.9544997361036416;

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

function inverse(matrix: Matrix): number[][] {
  const size = matrix.length;
  if (size !== 4 || matrix.some((row) => row.length !== size)) throw new Error("v416-inverse-shape");
  const work = matrix.map((row, index) => [
    ...row,
    ...Array.from({ length: size }, (_, column) => (column === index ? 1 : 0)),
  ]);
  for (let column = 0; column < size; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(work[row][column]) > Math.abs(work[pivot][column])) pivot = row;
    }
    if (Math.abs(work[pivot][column]) <= Number.EPSILON) throw new Error("v416-inverse-singular");
    [work[column], work[pivot]] = [work[pivot], work[column]];
    const scale = work[column][column];
    for (let offset = 0; offset < size * 2; offset += 1) work[column][offset] /= scale;
    for (let row = 0; row < size; row += 1) {
      if (row === column) continue;
      const factor = work[row][column];
      for (let offset = 0; offset < size * 2; offset += 1) work[row][offset] -= factor * work[column][offset];
    }
  }
  return work.map((row) => row.slice(size));
}

const oneNorm = (matrix: Matrix) =>
  Math.max(...matrix[0].map((_, column) => matrix.reduce((sum, row) => sum + Math.abs(row[column]), 0)));
const conditionNumber = (matrix: Matrix, matrixInverse: Matrix) => oneNorm(matrix) * oneNorm(matrixInverse);

function covarianceTransform(operator: Matrix, covariance: Matrix): number[][] {
  return multiply(multiply(operator, covariance), transpose(operator));
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

function cholesky(matrix: Matrix): number[][] {
  const size = matrix.length;
  const lower = Array.from({ length: size }, () => Array(size).fill(0));
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column <= row; column += 1) {
      let value = matrix[row][column];
      for (let inner = 0; inner < column; inner += 1) value -= lower[row][inner] * lower[column][inner];
      if (row === column) {
        if (!(value > 0)) throw new Error("v416-cholesky-positive-definite");
        lower[row][column] = Math.sqrt(value);
      } else {
        lower[row][column] = value / lower[column][column];
      }
    }
  }
  return lower;
}

function lowerVector(lower: Matrix, vector: readonly number[]): number[] {
  return lower.map((row) => row.reduce((sum, value, index) => sum + value * vector[index], 0));
}

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
    if (count > 128) throw new Error("v416-small-poisson-tail");
  }
  return count;
}

type ProfilePoint = Readonly<{ wavelengthM: number; throughput: number }>;
function parseProfile(source: string): readonly ProfilePoint[] {
  if (Buffer.byteLength(source, "utf8") <= 0 || Buffer.byteLength(source, "utf8") > 512 * 1024 || source.includes("\0")) {
    throw new Error("v416-profile-size");
  }
  const lines = source.replaceAll("\r\n", "\n").trimEnd().split("\n");
  if (lines[0] !== "wavelength_m,throughput" || lines.length !== 3302) throw new Error("v416-profile-schema");
  const points = lines.slice(1).map((line) => {
    const fields = line.split(",");
    const wavelengthM = Number(fields[0]);
    const throughput = Number(fields[1]);
    if (
      fields.length !== 2 ||
      !Number.isFinite(wavelengthM) ||
      !Number.isFinite(throughput) ||
      wavelengthM <= 0 ||
      throughput < 0 ||
      throughput > 1
    ) {
      throw new Error("v416-profile-row");
    }
    return Object.freeze({ wavelengthM, throughput });
  });
  if (
    Math.abs(points[0].wavelengthM - 4e-7) / 4e-7 >= 1e-15 ||
    Math.abs(points.at(-1)!.wavelengthM - 7e-7) / 7e-7 >= 1e-15 ||
    points.some((point, index) => index > 0 && point.wavelengthM <= points[index - 1].wavelengthM)
  ) {
    throw new Error("v416-profile-domain");
  }
  return Object.freeze(points);
}

function photonSpectralRadiancePerWavelength(wavelengthM: number, temperatureK: number, redshiftFactor: number) {
  const observedFrequencyHz = SPEED_OF_LIGHT_M_S / wavelengthM;
  const emittedFrequencyHz = observedFrequencyHz / redshiftFactor;
  const exponent =
    (KERR_PLANCK_CONSTANT_J_S_V328 * emittedFrequencyHz) / (BOLTZMANN_CONSTANT_J_K * temperatureK);
  const emittedEnergy =
    (2 * KERR_PLANCK_CONSTANT_J_S_V328 * emittedFrequencyHz ** 3) /
    (SPEED_OF_LIGHT_M_S ** 2 * Math.expm1(exponent));
  const observedEnergy = redshiftFactor ** 3 * emittedEnergy;
  return (observedEnergy / (KERR_PLANCK_CONSTANT_J_S_V328 * observedFrequencyHz)) *
    (SPEED_OF_LIGHT_M_S / wavelengthM ** 2);
}

function effectiveResponse(
  pack: KerrPolarimeterSpectralPackV413,
  points: readonly ProfilePoint[],
  ray: KerrSciencePhotonBandViewV328["rays"][number],
  fixture: KerrPolarimeterDetectorArtifactV414["view"]["fixture"],
): number[][] {
  const matrix = Array.from({ length: 4 }, () => Array(4).fill(0));
  for (let index = 1; index < points.length; index += 1) {
    const leftPoint = points[index - 1];
    const rightPoint = points[index];
    const leftResponse = interpolateParsedKerrPolarimeterResponseMatrixV413(pack, leftPoint.wavelengthM).responseMatrix;
    const rightResponse = interpolateParsedKerrPolarimeterResponseMatrixV413(pack, rightPoint.wavelengthM).responseMatrix;
    const leftSpectral =
      photonSpectralRadiancePerWavelength(leftPoint.wavelengthM, ray.effectiveTemperatureK, ray.redshiftFactor) *
      leftPoint.throughput;
    const rightSpectral =
      photonSpectralRadiancePerWavelength(rightPoint.wavelengthM, ray.effectiveTemperatureK, ray.redshiftFactor) *
      rightPoint.throughput;
    const width = rightPoint.wavelengthM - leftPoint.wavelengthM;
    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 4; column += 1) {
        matrix[row][column] +=
          0.5 * width * (leftSpectral * leftResponse[row][column] + rightSpectral * rightResponse[row][column]);
      }
    }
  }
  const factor =
    fixture.collectingAreaM2 * fixture.pixelSolidAngleSr * fixture.exposureTimeS * fixture.quantumEfficiency;
  return matrix.map((row) => row.map((value) => value * factor));
}

type Running = { count: number; mean: number; m2: number; one: number; two: number };
const running = (): Running => ({ count: 0, mean: 0, m2: 0, one: 0, two: 0 });
function updateRunning(state: Running, value: number): void {
  state.count += 1;
  const delta = value - state.mean;
  state.mean += delta / state.count;
  state.m2 += delta * (value - state.mean);
  if (Math.abs(value) <= 1) state.one += 1;
  if (Math.abs(value) <= 2) state.two += 1;
}
function finalizeRunning(state: Running, component: 0 | 1 | 2 | 3): KerrPolarimeterPullStatisticsV416 {
  if (state.count !== KERR_POLARIMETER_ENSEMBLE_TRIAL_COUNT_V416) throw new Error("v416-running-count");
  const coverageOneSigma = state.one / state.count;
  const coverageTwoSigma = state.two / state.count;
  return Object.freeze({
    component,
    count: KERR_POLARIMETER_ENSEMBLE_TRIAL_COUNT_V416,
    mean: state.mean,
    standardDeviation: Math.sqrt(state.m2 / (state.count - 1)),
    coverageOneSigma,
    coverageTwoSigma,
    coverageOneSigmaAbsoluteError: Math.abs(coverageOneSigma - EXPECTED_ONE_SIGMA),
    coverageTwoSigmaAbsoluteError: Math.abs(coverageTwoSigma - EXPECTED_TWO_SIGMA),
  });
}

function createRay(
  photonRay: KerrSciencePhotonBandViewV328["rays"][number],
  detectorRay: KerrPolarimeterDetectorArtifactV414["view"]["rays"][number],
  pack: KerrPolarimeterSpectralPackV413,
  points: readonly ProfilePoint[],
  detector: KerrPolarimeterDetectorArtifactV414,
): KerrPolarimeterStokesEnsembleRayV416 {
  const response = effectiveResponse(pack, points, photonRay, detector.view.fixture);
  const responseInverse = inverse(response);
  const noiseless = matrixVector(response, TRUTH);
  const sourceExpectationClosureRelative = Math.max(
    ...noiseless.map((value, channel) => relative(value, detectorRay.channels[channel].sourceElectronExpectation)),
  );
  const recovered = matrixVector(responseInverse, noiseless);
  const noiselessStokesRecoveryAbsolute = Math.max(...recovered.map((value, component) => Math.abs(value - TRUTH[component])));
  const countingCovariance = detectorRay.channels.map((channel, row) =>
    detectorRay.channels.map((_, column) => (row === column ? channel.countingVarianceElectronSquared : 0)),
  );
  const countingStokesCovariance = covarianceTransform(responseInverse, countingCovariance);
  const calibrationStokesCovariance = covarianceTransform(
    responseInverse,
    detectorRay.calibrationCovarianceElectronSquared,
  );
  const calibrationLower = cholesky(detectorRay.calibrationCovarianceElectronSquared);
  const countingRunning = Array.from({ length: 4 }, running);
  const calibrationRunning = Array.from({ length: 4 }, running);
  let firstCountingPull: number[] | null = null;
  let firstCalibrationPull: number[] | null = null;
  for (let trial = 0; trial < KERR_POLARIMETER_ENSEMBLE_TRIAL_COUNT_V416; trial += 1) {
    const countingResidual = detectorRay.channels.map((channel) => {
      const prefix = `${KERR_POLARIMETER_ENSEMBLE_SEED_NAMESPACE_V416}:ray-${detectorRay.rayIndex}:trial-${trial}:channel-${channel.channelIndex}`;
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
        `${KERR_POLARIMETER_ENSEMBLE_SEED_NAMESPACE_V416}:ray-${detectorRay.rayIndex}:trial-${trial}:calibration-${channel.channelIndex}`,
      ),
    );
    const calibrationResidual = lowerVector(calibrationLower, calibrationZ);
    const countingStokesError = matrixVector(responseInverse, countingResidual);
    const calibrationStokesError = matrixVector(responseInverse, calibrationResidual);
    const countingPull = countingStokesError.map(
      (value, component) => value / Math.sqrt(countingStokesCovariance[component][component]),
    );
    const calibrationPull = calibrationStokesError.map(
      (value, component) => value / Math.sqrt(calibrationStokesCovariance[component][component]),
    );
    if (trial === 0) {
      firstCountingPull = countingPull;
      firstCalibrationPull = calibrationPull;
    }
    countingPull.forEach((value, component) => updateRunning(countingRunning[component], value));
    calibrationPull.forEach((value, component) => updateRunning(calibrationRunning[component], value));
  }
  const countingPullStatistics = countingRunning.map((state, component) =>
    finalizeRunning(state, component as 0 | 1 | 2 | 3),
  );
  const calibrationPullStatistics = calibrationRunning.map((state, component) =>
    finalizeRunning(state, component as 0 | 1 | 2 | 3),
  );
  const seedPlanSha256 = createHash("sha256")
    .update(
      `${KERR_POLARIMETER_ENSEMBLE_SEED_NAMESPACE_V416}|ray=${detectorRay.rayIndex}|trials=${KERR_POLARIMETER_ENSEMBLE_TRIAL_COUNT_V416}|channels=4|families=counting,calibration`,
    )
    .digest("hex");
  return Object.freeze({
    rayIndex: detectorRay.rayIndex,
    effectiveResponseMatrix: freezeMatrix(response),
    inverseResponseMatrix: freezeMatrix(responseInverse),
    countingStokesCovariance: freezeMatrix(countingStokesCovariance),
    calibrationStokesCovariance: freezeMatrix(calibrationStokesCovariance),
    responseConditionNumber: conditionNumber(response, responseInverse),
    sourceExpectationClosureRelative,
    noiselessStokesRecoveryAbsolute,
    countingPullStatistics: Object.freeze(countingPullStatistics),
    calibrationPullStatistics: Object.freeze(calibrationPullStatistics),
    firstTrial: Object.freeze({
      countingPull: Object.freeze(firstCountingPull!) as Vector4,
      calibrationPull: Object.freeze(firstCalibrationPull!) as Vector4,
    }),
    seedPlanSha256,
  });
}

export function createKerrPolarimeterStokesEnsembleViewV416(
  photonValue: unknown,
  profileCsv: string,
  spectralArtifactValue: unknown,
  detectorArtifactValue: unknown,
  likelihoodArtifactValue: unknown,
): KerrPolarimeterStokesEnsembleViewV416 {
  const photon = parseKerrSciencePhotonBandViewV328(photonValue);
  const spectralArtifact = spectralArtifactValue as { artifactSha256?: string; pack?: unknown };
  const pack = parseKerrPolarimeterSpectralPackV413(spectralArtifact.pack);
  const detector = parseKerrPolarimeterDetectorArtifactV414(detectorArtifactValue);
  const likelihood = parseKerrPolarimeterDetectorLikelihoodArtifactV415(likelihoodArtifactValue);
  if (
    detector.artifactSha256 !== KERR_POLARIMETER_DETECTOR_ARTIFACT_SHA256_V414 ||
    canonicalShaV414(detector) !== detector.artifactSha256 ||
    likelihood.artifactSha256 !== KERR_POLARIMETER_DETECTOR_LIKELIHOOD_ARTIFACT_SHA256_V415 ||
    canonicalShaV415(likelihood) !== likelihood.artifactSha256 ||
    likelihood.source.v414DetectorArtifactSha256 !== detector.artifactSha256 ||
    spectralArtifact.artifactSha256 !== detector.source.v413SpectralArtifactSha256 ||
    pack.sourceKind !== "test-fixture" ||
    detector.measuredDetectorAuthorityGranted !== false ||
    likelihood.measuredDetectorAuthorityGranted !== false
  ) {
    throw new Error("v416-authority-lock");
  }
  const points = parseProfile(profileCsv);
  const rays = detector.view.rays.map((detectorRay) => {
    const photonRay = photon.rays.find((entry) => entry.rayIndex === detectorRay.rayIndex);
    if (!photonRay) throw new Error("v416-photon-ray");
    return createRay(photonRay, detectorRay, pack, points, detector);
  });
  const countingStats = rays.flatMap((ray) => ray.countingPullStatistics);
  const calibrationStats = rays.flatMap((ray) => ray.calibrationPullStatistics);
  const covariances = rays.flatMap((ray) => [ray.countingStokesCovariance, ray.calibrationStokesCovariance]);
  const metrics = Object.freeze({
    maximumSourceExpectationClosureRelative: Math.max(...rays.map((ray) => ray.sourceExpectationClosureRelative)),
    maximumNoiselessStokesRecoveryAbsolute: Math.max(...rays.map((ray) => ray.noiselessStokesRecoveryAbsolute)),
    maximumResponseConditionNumber: Math.max(...rays.map((ray) => ray.responseConditionNumber)),
    maximumCountingPullMeanAbsolute: Math.max(...countingStats.map((entry) => Math.abs(entry.mean))),
    maximumCountingPullStandardDeviationError: Math.max(
      ...countingStats.map((entry) => Math.abs(entry.standardDeviation - 1)),
    ),
    maximumCountingCoverageOneSigmaError: Math.max(...countingStats.map((entry) => entry.coverageOneSigmaAbsoluteError)),
    maximumCountingCoverageTwoSigmaError: Math.max(...countingStats.map((entry) => entry.coverageTwoSigmaAbsoluteError)),
    maximumCalibrationPullMeanAbsolute: Math.max(...calibrationStats.map((entry) => Math.abs(entry.mean))),
    maximumCalibrationPullStandardDeviationError: Math.max(
      ...calibrationStats.map((entry) => Math.abs(entry.standardDeviation - 1)),
    ),
    maximumCalibrationCoverageOneSigmaError: Math.max(
      ...calibrationStats.map((entry) => entry.coverageOneSigmaAbsoluteError),
    ),
    maximumCalibrationCoverageTwoSigmaError: Math.max(
      ...calibrationStats.map((entry) => entry.coverageTwoSigmaAbsoluteError),
    ),
    maximumCovarianceSymmetryRelative: Math.max(...covariances.map(covarianceSymmetryRelative)),
  });
  if (
    rays.length !== 4 ||
    metrics.maximumSourceExpectationClosureRelative >= 1e-12 ||
    metrics.maximumNoiselessStokesRecoveryAbsolute >= 1e-12 ||
    metrics.maximumResponseConditionNumber >= 1e4 ||
    metrics.maximumCountingPullMeanAbsolute >= 0.06 ||
    metrics.maximumCountingPullStandardDeviationError >= 0.06 ||
    metrics.maximumCountingCoverageOneSigmaError >= 0.025 ||
    metrics.maximumCountingCoverageTwoSigmaError >= 0.015 ||
    metrics.maximumCalibrationPullMeanAbsolute >= 0.06 ||
    metrics.maximumCalibrationPullStandardDeviationError >= 0.06 ||
    metrics.maximumCalibrationCoverageOneSigmaError >= 0.025 ||
    metrics.maximumCalibrationCoverageTwoSigmaError >= 0.015 ||
    metrics.maximumCovarianceSymmetryRelative >= 1e-12 ||
    !Object.values(metrics).every(Number.isFinite)
  ) {
    throw new Error(`v416-gate:${JSON.stringify(metrics)}`);
  }
  return Object.freeze({
    version: KERR_POLARIMETER_STOKES_ENSEMBLE_VERSION_V416,
    status: "qualified-streaming-stokes-coverage-fixture-only-measured-authority-unavailable",
    source: Object.freeze({
      v414DetectorArtifactSha256: KERR_POLARIMETER_DETECTOR_ARTIFACT_SHA256_V414,
      v415LikelihoodArtifactSha256: KERR_POLARIMETER_DETECTOR_LIKELIHOOD_ARTIFACT_SHA256_V415,
      v413SpectralArtifactSha256: spectralArtifact.artifactSha256,
    }),
    truthStokes: TRUTH,
    seedNamespace: KERR_POLARIMETER_ENSEMBLE_SEED_NAMESPACE_V416,
    trialCountPerRay: KERR_POLARIMETER_ENSEMBLE_TRIAL_COUNT_V416,
    totalTrialCount: 16384,
    retainedTrialCount: 4,
    rays: Object.freeze(rays),
    metrics,
    ensembleMethod: "streaming-welford-no-trial-array-retention",
    sourceCountingModel:
      "poisson-photoelectron-thinning-high-count-normal-approximation-with-small-lambda-poisson-and-read-gaussian",
    calibrationModel: "separate-multivariate-gaussian-response-covariance",
    covarianceCombinationPolicy: "counting-and-calibration-ensembles-independent-and-never-combined",
    recoveryModel: "per-ray-spectrum-weighted-four-by-four-effective-mueller-direct-inversion",
    observedCounts: "unavailable-synthetic-ensemble-is-not-observed-detector-data",
    measuredDetectorAuthority: "unavailable-v368-authority-artifacts-missing",
    syntheticFixtureAvailable: true,
    publishableMeasurement: false,
    sciencePayloadMutationAllowed: false,
    cinematicConsumerAllowed: false,
    denseCampaignStatus: "incomplete-0-of-49",
    browserQualification: "not-run",
    boundary: "coverage-and-stokes-recovery-fixture-only-no-measured-counts-or-detector-authority",
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
export const canonicalShaV416 = (value: unknown): string =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

export function parseKerrPolarimeterStokesEnsembleArtifactV416(
  value: unknown,
): KerrPolarimeterStokesEnsembleArtifactV416 {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrPolarimeterStokesEnsembleArtifactV416>)
      : null;
  if (
    !source ||
    source.version !== KERR_POLARIMETER_STOKES_ENSEMBLE_ARTIFACT_VERSION_V416 ||
    source.status !== "qualified-streaming-stokes-coverage-fixture-only-measured-authority-unavailable" ||
    source.source?.v414DetectorArtifactSha256 !== KERR_POLARIMETER_DETECTOR_ARTIFACT_SHA256_V414 ||
    source.source.v415LikelihoodArtifactSha256 !== KERR_POLARIMETER_DETECTOR_LIKELIHOOD_ARTIFACT_SHA256_V415 ||
    !SHA.test(source.source.pythonOracleArtifactSha256 ?? "") ||
    !Object.values(source.sourceFiles ?? {}).every((entry) => SHA.test(entry)) ||
    source.view?.trialCountPerRay !== 4096 ||
    source.view.totalTrialCount !== 16384 ||
    source.view.retainedTrialCount !== 4 ||
    source.view.rays?.length !== 4 ||
    source.view.observedCounts !== "unavailable-synthetic-ensemble-is-not-observed-detector-data" ||
    source.view.publishableMeasurement !== false ||
    Math.max(...Object.values(source.oracleComparison ?? {})) >= 1e-10 ||
    source.deterministicReplay !== true ||
    source.measuredDetectorAuthorityGranted !== false ||
    source.observedCountsAvailable !== false ||
    source.networkAttempted !== false ||
    source.denseShardExecuted !== false ||
    source.browserQualification !== "not-run" ||
    source.boundary !== "streaming-stokes-ensemble-fixture-qualified-not-measured-observation-or-authority" ||
    !SHA.test(source.artifactSha256 ?? "")
  ) {
    throw new Error("v416-artifact-identity");
  }
  return value as KerrPolarimeterStokesEnsembleArtifactV416;
}

export function createKerrPolarimeterStokesEnsembleSummaryV416(
  value: unknown,
): KerrPolarimeterStokesEnsembleSummaryV416 {
  const artifact = parseKerrPolarimeterStokesEnsembleArtifactV416(value);
  return Object.freeze({
    version: KERR_POLARIMETER_STOKES_ENSEMBLE_SUMMARY_VERSION_V416,
    status: artifact.status,
    artifactSha256: artifact.artifactSha256,
    v415LikelihoodArtifactSha256: artifact.source.v415LikelihoodArtifactSha256,
    rayCount: 4,
    trialCountPerRay: 4096,
    totalTrialCount: 16384,
    retainedTrialCount: 4,
    metrics: artifact.view.metrics,
    oracleComparison: artifact.oracleComparison,
    observedCounts: artifact.view.observedCounts,
    measuredDetectorAuthority: artifact.view.measuredDetectorAuthority,
    fullArtifactAvailable: true,
    browserQualification: "not-run",
    boundary: "summary-only-no-ray-matrices-covariances-or-trial-vectors-in-react-state",
  });
}

export function parseKerrPolarimeterStokesEnsembleSummaryV416(
  value: unknown,
): KerrPolarimeterStokesEnsembleSummaryV416 {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrPolarimeterStokesEnsembleSummaryV416>)
      : null;
  if (
    !source ||
    source.version !== KERR_POLARIMETER_STOKES_ENSEMBLE_SUMMARY_VERSION_V416 ||
    source.status !== "qualified-streaming-stokes-coverage-fixture-only-measured-authority-unavailable" ||
    !SHA.test(source.artifactSha256 ?? "") ||
    source.v415LikelihoodArtifactSha256 !== KERR_POLARIMETER_DETECTOR_LIKELIHOOD_ARTIFACT_SHA256_V415 ||
    source.rayCount !== 4 ||
    source.trialCountPerRay !== 4096 ||
    source.totalTrialCount !== 16384 ||
    source.retainedTrialCount !== 4 ||
    !source.metrics ||
    !source.oracleComparison ||
    source.observedCounts !== "unavailable-synthetic-ensemble-is-not-observed-detector-data" ||
    source.measuredDetectorAuthority !== "unavailable-v368-authority-artifacts-missing" ||
    source.fullArtifactAvailable !== true ||
    source.browserQualification !== "not-run" ||
    source.boundary !== "summary-only-no-ray-matrices-covariances-or-trial-vectors-in-react-state" ||
    Object.hasOwn(source, "rays") ||
    Object.hasOwn(source, "view")
  ) {
    throw new Error("v416-summary-identity");
  }
  return value as KerrPolarimeterStokesEnsembleSummaryV416;
}

export function parseKerrPolarimeterStokesEnsembleResponseV416(
  value: unknown,
): KerrPolarimeterStokesEnsembleResponseV416 {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrPolarimeterStokesEnsembleResponseV416>)
      : null;
  if (!source || source.version !== KERR_POLARIMETER_STOKES_ENSEMBLE_RESPONSE_VERSION_V416) {
    throw new Error("v416-response-version");
  }
  if (source.available === true && source.reason === "ready" && source.summary) {
    return {
      version: KERR_POLARIMETER_STOKES_ENSEMBLE_RESPONSE_VERSION_V416,
      available: true,
      reason: "ready",
      summary: parseKerrPolarimeterStokesEnsembleSummaryV416(source.summary),
    };
  }
  if (
    source.available === false &&
    source.summary === null &&
    ["lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(source.reason ?? "")
  ) {
    return source as KerrPolarimeterStokesEnsembleResponseV416;
  }
  throw new Error("v416-response-identity");
}

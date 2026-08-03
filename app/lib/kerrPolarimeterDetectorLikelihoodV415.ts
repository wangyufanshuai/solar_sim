import { createHash } from "node:crypto";

import {
  canonicalShaV414,
  parseKerrPolarimeterDetectorArtifactV414,
  type KerrPolarimeterDetectorArtifactV414,
} from "./kerrPolarimeterDetectorCountsV414";

export const KERR_POLARIMETER_DETECTOR_LIKELIHOOD_VERSION_V415 =
  "v415-kerr-polarimeter-detector-noise-likelihood-v1" as const;
export const KERR_POLARIMETER_DETECTOR_LIKELIHOOD_ARTIFACT_VERSION_V415 =
  "v415-kerr-polarimeter-detector-noise-likelihood-artifact-v1" as const;
export const KERR_POLARIMETER_DETECTOR_LIKELIHOOD_SUMMARY_VERSION_V415 =
  "v415-kerr-polarimeter-detector-noise-likelihood-summary-v1" as const;
export const KERR_POLARIMETER_DETECTOR_LIKELIHOOD_RESPONSE_VERSION_V415 =
  "v415-kerr-polarimeter-detector-noise-likelihood-response-v1" as const;
export const KERR_POLARIMETER_DETECTOR_ARTIFACT_SHA256_V414 =
  "515bc2bf9e0100b9474edecafbc2676fb8b066bd08fb406e011da87590305ab5" as const;
export const KERR_POLARIMETER_NOISE_SEED_NAMESPACE_V415 =
  "orbit-atlas-v415-detector-noise-fixture-20260730" as const;

type Matrix = readonly (readonly number[])[];

export type KerrPolarimeterCountingLikelihoodRowV415 = Readonly<{
  rayIndex: number;
  channelIndex: 0 | 1 | 2 | 3;
  expectedElectronBase: number;
  sourceElectronExpectation: number;
  sourceNormalZ: number;
  sourcePoissonResidualApproximationElectron: number;
  sourceHighCountApproximationIndicator: number;
  darkPoissonExpectation: number;
  darkPoissonDraw: number;
  darkResidualElectron: number;
  backgroundPoissonExpectation: number;
  backgroundPoissonDraw: number;
  backgroundResidualElectron: number;
  readGaussianZ: number;
  readResidualElectron: number;
  totalCountingResidualElectron: number;
  standardizedCountingResidual: number;
  syntheticElectronDisplayApproximation: number;
  absoluteAdditionLossElectron: number;
  absoluteAdditionLossRelativeToResidual: number;
  sourceGaussianNegativeLogLikelihood: number;
  darkPoissonNegativeLogLikelihood: number;
  backgroundPoissonNegativeLogLikelihood: number;
  readGaussianNegativeLogLikelihood: number;
  countingComponentNegativeLogLikelihood: number;
  observedCountApplicable: false;
  exactSourcePoissonIntegerApplicable: false;
  saturationApplicable: false;
}>;

export type KerrPolarimeterCalibrationLikelihoodV415 = Readonly<{
  gaussianZ: readonly number[];
  residualElectron: readonly number[];
  mahalanobisSquared: number;
  gaussianNegativeLogLikelihood: number;
  choleskyReconstructionRelative: number;
}>;

export type KerrPolarimeterDetectorLikelihoodRayV415 = Readonly<{
  rayIndex: number;
  rows: readonly KerrPolarimeterCountingLikelihoodRowV415[];
  calibration: KerrPolarimeterCalibrationLikelihoodV415;
}>;

export type KerrPolarimeterDetectorLikelihoodViewV415 = Readonly<{
  version: typeof KERR_POLARIMETER_DETECTOR_LIKELIHOOD_VERSION_V415;
  status: "qualified-deterministic-high-count-noise-likelihood-fixture-only-measured-authority-unavailable";
  source: Readonly<{
    v414DetectorArtifactSha256: typeof KERR_POLARIMETER_DETECTOR_ARTIFACT_SHA256_V414;
  }>;
  seedNamespace: typeof KERR_POLARIMETER_NOISE_SEED_NAMESPACE_V415;
  counts: Readonly<{
    rayCount: 4;
    analyzerChannelCount: 4;
    likelihoodRowCount: 16;
    countingStreamsPerRow: 4;
    calibrationStreamsPerRay: 4;
  }>;
  rays: readonly KerrPolarimeterDetectorLikelihoodRayV415[];
  maxima: Readonly<{
    sourceHighCountApproximationIndicator: number;
    countingComponentClosureRelative: number;
    absoluteAdditionLossRelativeToResidual: number;
    calibrationCholeskyReconstructionRelative: number;
    absoluteStandardizedCountingResidual: number;
    absoluteCalibrationResidualElectron: number;
    countingComponentNegativeLogLikelihood: number;
    calibrationGaussianNegativeLogLikelihood: number;
  }>;
  sourceCountingModel: "poisson-photoelectron-thinning-high-count-normal-approximation-explicit-not-exact-integer-draw";
  darkBackgroundModel: "independent-small-lambda-poisson-inverse-cdf";
  readNoiseModel: "independent-zero-mean-gaussian-fixture";
  calibrationModel: "separate-multivariate-gaussian-cholesky-fixture";
  likelihoodCombinationPolicy: "counting-components-combined-within-row-calibration-reported-separately-no-cross-family-independence-claim";
  precisionBoundary: "absolute-expectation-exceeds-js-safe-integer-base-plus-residual-preserved-display-sum-nonauthoritative";
  observedCounts: "unavailable-synthetic-fixture-is-not-observed-detector-data";
  measuredDetectorAuthority: "unavailable-v368-authority-artifacts-missing";
  syntheticFixtureAvailable: true;
  exactSourcePoissonIntegerAvailable: false;
  sciencePayloadMutationAllowed: false;
  cinematicConsumerAllowed: false;
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
}>;

export type KerrPolarimeterDetectorLikelihoodArtifactV415 = Readonly<{
  version: typeof KERR_POLARIMETER_DETECTOR_LIKELIHOOD_ARTIFACT_VERSION_V415;
  generatedAt: string;
  status: KerrPolarimeterDetectorLikelihoodViewV415["status"];
  source: Readonly<{
    v414DetectorArtifactSha256: typeof KERR_POLARIMETER_DETECTOR_ARTIFACT_SHA256_V414;
    pythonOracleArtifactSha256: string;
  }>;
  sourceFiles: Readonly<{
    v414DetectorFileSha256: string;
    pythonOracleFileSha256: string;
  }>;
  view: KerrPolarimeterDetectorLikelihoodViewV415;
  oracleComparison: Readonly<{
    maximumNormalZAbsolute: number;
    maximumCountingResidualRelative: number;
    maximumCountingNegativeLogLikelihoodRelative: number;
    maximumCalibrationResidualRelative: number;
    maximumCalibrationNegativeLogLikelihoodRelative: number;
  }>;
  deterministicReplay: true;
  measuredDetectorAuthorityGranted: false;
  observedCountsAvailable: false;
  exactSourcePoissonIntegerAvailable: false;
  networkAttempted: false;
  denseShardExecuted: false;
  browserQualification: "not-run";
  boundary: "deterministic-noise-likelihood-fixture-qualified-not-measured-counts-or-detector-authority";
  artifactSha256: string;
}>;

export type KerrPolarimeterDetectorLikelihoodSummaryV415 = Readonly<{
  version: typeof KERR_POLARIMETER_DETECTOR_LIKELIHOOD_SUMMARY_VERSION_V415;
  status: KerrPolarimeterDetectorLikelihoodViewV415["status"];
  artifactSha256: string;
  v414DetectorArtifactSha256: typeof KERR_POLARIMETER_DETECTOR_ARTIFACT_SHA256_V414;
  rayCount: 4;
  analyzerChannelCount: 4;
  likelihoodRowCount: 16;
  maxima: KerrPolarimeterDetectorLikelihoodViewV415["maxima"];
  oracleComparison: KerrPolarimeterDetectorLikelihoodArtifactV415["oracleComparison"];
  observedCounts: KerrPolarimeterDetectorLikelihoodViewV415["observedCounts"];
  measuredDetectorAuthority: KerrPolarimeterDetectorLikelihoodViewV415["measuredDetectorAuthority"];
  exactSourcePoissonIntegerAvailable: false;
  fullArtifactAvailable: true;
  browserQualification: "not-run";
  boundary: "summary-only-no-sixteen-likelihood-rows-or-calibration-vectors-in-react-state";
}>;

export type KerrPolarimeterDetectorLikelihoodResponseV415 = Readonly<{
  version: typeof KERR_POLARIMETER_DETECTOR_LIKELIHOOD_RESPONSE_VERSION_V415;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed";
  summary: KerrPolarimeterDetectorLikelihoodSummaryV415 | null;
}>;

const SHA = /^[a-f0-9]{64}$/;
const TWO_POW_53 = 9_007_199_254_740_992;
const TWO_PI = 2 * Math.PI;
const relative = (left: number, right: number) =>
  Math.abs(left - right) / Math.max(Number.MIN_VALUE, Math.abs(left), Math.abs(right));

function uniform53(label: string): number {
  const digest = createHash("sha256").update(label).digest();
  const high32 = digest.readUInt32BE(0);
  const followingHigh21 = Math.floor(digest.readUInt32BE(4) / 2 ** 11);
  const value = high32 * 2 ** 21 + followingHigh21;
  return (value + 0.5) / TWO_POW_53;
}

function standardNormal(label: string): number {
  const first = uniform53(`${label}:u1`);
  const second = uniform53(`${label}:u2`);
  return Math.sqrt(-2 * Math.log(first)) * Math.cos(TWO_PI * second);
}

function smallPoisson(lambda: number, label: string): number {
  if (!(lambda >= 0 && lambda <= 32)) throw new Error("v415-small-poisson-domain");
  const target = uniform53(`${label}:poisson`);
  let probability = Math.exp(-lambda);
  let cumulative = probability;
  let count = 0;
  while (target > cumulative) {
    count += 1;
    probability *= lambda / count;
    cumulative += probability;
    if (count > 128) throw new Error("v415-small-poisson-tail");
  }
  return count;
}

function logFactorial(value: number): number {
  let result = 0;
  for (let index = 2; index <= value; index += 1) result += Math.log(index);
  return result;
}

function poissonNegativeLogLikelihood(value: number, lambda: number): number {
  return lambda - value * Math.log(lambda) + logFactorial(value);
}

function cholesky(matrix: Matrix): number[][] {
  const size = matrix.length;
  if (size === 0 || matrix.some((row) => row.length !== size)) throw new Error("v415-cholesky-shape");
  const lower = Array.from({ length: size }, () => Array(size).fill(0));
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column <= row; column += 1) {
      let value = matrix[row][column];
      for (let inner = 0; inner < column; inner += 1) value -= lower[row][inner] * lower[column][inner];
      if (row === column) {
        if (!(value > 0)) throw new Error("v415-cholesky-positive-definite");
        lower[row][column] = Math.sqrt(value);
      } else {
        lower[row][column] = value / lower[column][column];
      }
    }
  }
  return lower;
}

function choleskyReconstructionRelative(matrix: Matrix, lower: Matrix): number {
  let maximum = 0;
  for (let row = 0; row < matrix.length; row += 1) {
    for (let column = 0; column < matrix.length; column += 1) {
      let reconstructed = 0;
      for (let inner = 0; inner < matrix.length; inner += 1) {
        reconstructed += lower[row][inner] * lower[column][inner];
      }
      maximum = Math.max(maximum, relative(matrix[row][column], reconstructed));
    }
  }
  return maximum;
}

function multiplyLower(lower: Matrix, vector: readonly number[]): number[] {
  return lower.map((row) => row.reduce((sum, value, index) => sum + value * vector[index], 0));
}

function createRay(
  artifact: KerrPolarimeterDetectorArtifactV414,
  ray: KerrPolarimeterDetectorArtifactV414["view"]["rays"][number],
): KerrPolarimeterDetectorLikelihoodRayV415 {
  const fixture = artifact.view.fixture;
  const rows = ray.channels.map((channel): KerrPolarimeterCountingLikelihoodRowV415 => {
    const prefix = `${KERR_POLARIMETER_NOISE_SEED_NAMESPACE_V415}:ray-${ray.rayIndex}:channel-${channel.channelIndex}`;
    const sourceNormalZ = standardNormal(`${prefix}:source`);
    const readGaussianZ = standardNormal(`${prefix}:read`);
    const darkPoissonDraw = smallPoisson(channel.darkElectronExpectation, `${prefix}:dark`);
    const backgroundPoissonDraw = smallPoisson(channel.backgroundElectronExpectation, `${prefix}:background`);
    const sourcePoissonResidualApproximationElectron = Math.sqrt(channel.sourceElectronExpectation) * sourceNormalZ;
    const darkResidualElectron = darkPoissonDraw - channel.darkElectronExpectation;
    const backgroundResidualElectron = backgroundPoissonDraw - channel.backgroundElectronExpectation;
    const readResidualElectron = fixture.readNoiseRmsElectronPerPixelRead * Math.sqrt(fixture.readCount) * readGaussianZ;
    const totalCountingResidualElectron =
      sourcePoissonResidualApproximationElectron + darkResidualElectron + backgroundResidualElectron + readResidualElectron;
    const recomposed = [
      sourcePoissonResidualApproximationElectron,
      darkResidualElectron,
      backgroundResidualElectron,
      readResidualElectron,
    ].reduce((sum, value) => sum + value, 0);
    const countingComponentClosureRelative = relative(totalCountingResidualElectron, recomposed);
    if (countingComponentClosureRelative > 1e-15) throw new Error("v415-counting-component-closure");
    const syntheticElectronDisplayApproximation = channel.totalElectronExpectation + totalCountingResidualElectron;
    const absoluteAdditionLossElectron =
      syntheticElectronDisplayApproximation - channel.totalElectronExpectation - totalCountingResidualElectron;
    const absoluteAdditionLossRelativeToResidual =
      Math.abs(absoluteAdditionLossElectron) / Math.max(1, Math.abs(totalCountingResidualElectron));
    const sourceGaussianNegativeLogLikelihood =
      0.5 * (sourceNormalZ ** 2 + Math.log(TWO_PI * channel.sourceElectronExpectation));
    const darkPoissonNegativeLogLikelihood = poissonNegativeLogLikelihood(
      darkPoissonDraw,
      channel.darkElectronExpectation,
    );
    const backgroundPoissonNegativeLogLikelihood = poissonNegativeLogLikelihood(
      backgroundPoissonDraw,
      channel.backgroundElectronExpectation,
    );
    const readVariance = fixture.readCount * fixture.readNoiseRmsElectronPerPixelRead ** 2;
    const readGaussianNegativeLogLikelihood = 0.5 * (readGaussianZ ** 2 + Math.log(TWO_PI * readVariance));
    const countingComponentNegativeLogLikelihood =
      sourceGaussianNegativeLogLikelihood +
      darkPoissonNegativeLogLikelihood +
      backgroundPoissonNegativeLogLikelihood +
      readGaussianNegativeLogLikelihood;
    const values = [
      sourceNormalZ,
      readGaussianZ,
      sourcePoissonResidualApproximationElectron,
      totalCountingResidualElectron,
      syntheticElectronDisplayApproximation,
      sourceGaussianNegativeLogLikelihood,
      darkPoissonNegativeLogLikelihood,
      backgroundPoissonNegativeLogLikelihood,
      readGaussianNegativeLogLikelihood,
      countingComponentNegativeLogLikelihood,
    ];
    if (!values.every(Number.isFinite) || !Number.isInteger(darkPoissonDraw) || !Number.isInteger(backgroundPoissonDraw)) {
      throw new Error("v415-counting-finite");
    }
    return Object.freeze({
      rayIndex: ray.rayIndex,
      channelIndex: channel.channelIndex,
      expectedElectronBase: channel.totalElectronExpectation,
      sourceElectronExpectation: channel.sourceElectronExpectation,
      sourceNormalZ,
      sourcePoissonResidualApproximationElectron,
      sourceHighCountApproximationIndicator: 1 / Math.sqrt(channel.sourceElectronExpectation),
      darkPoissonExpectation: channel.darkElectronExpectation,
      darkPoissonDraw,
      darkResidualElectron,
      backgroundPoissonExpectation: channel.backgroundElectronExpectation,
      backgroundPoissonDraw,
      backgroundResidualElectron,
      readGaussianZ,
      readResidualElectron,
      totalCountingResidualElectron,
      standardizedCountingResidual: totalCountingResidualElectron / channel.countingSigmaElectron,
      syntheticElectronDisplayApproximation,
      absoluteAdditionLossElectron,
      absoluteAdditionLossRelativeToResidual,
      sourceGaussianNegativeLogLikelihood,
      darkPoissonNegativeLogLikelihood,
      backgroundPoissonNegativeLogLikelihood,
      readGaussianNegativeLogLikelihood,
      countingComponentNegativeLogLikelihood,
      observedCountApplicable: false,
      exactSourcePoissonIntegerApplicable: false,
      saturationApplicable: false,
    });
  });
  const gaussianZ = ray.channels.map((channel) =>
    standardNormal(
      `${KERR_POLARIMETER_NOISE_SEED_NAMESPACE_V415}:ray-${ray.rayIndex}:calibration-${channel.channelIndex}`,
    ),
  );
  const lower = cholesky(ray.calibrationCovarianceElectronSquared);
  const residualElectron = multiplyLower(lower, gaussianZ);
  const mahalanobisSquared = gaussianZ.reduce((sum, value) => sum + value ** 2, 0);
  const logDeterminant = 2 * lower.reduce((sum, row, index) => sum + Math.log(row[index]), 0);
  const gaussianNegativeLogLikelihood = 0.5 * (mahalanobisSquared + 4 * Math.log(TWO_PI) + logDeterminant);
  const calibration = Object.freeze({
    gaussianZ: Object.freeze(gaussianZ),
    residualElectron: Object.freeze(residualElectron),
    mahalanobisSquared,
    gaussianNegativeLogLikelihood,
    choleskyReconstructionRelative: choleskyReconstructionRelative(ray.calibrationCovarianceElectronSquared, lower),
  });
  return Object.freeze({ rayIndex: ray.rayIndex, rows: Object.freeze(rows), calibration });
}

export function createKerrPolarimeterDetectorLikelihoodViewV415(
  artifactValue: unknown,
): KerrPolarimeterDetectorLikelihoodViewV415 {
  const artifact = parseKerrPolarimeterDetectorArtifactV414(artifactValue);
  if (
    artifact.artifactSha256 !== KERR_POLARIMETER_DETECTOR_ARTIFACT_SHA256_V414 ||
    canonicalShaV414(artifact) !== artifact.artifactSha256 ||
    artifact.measuredDetectorAuthorityGranted !== false ||
    artifact.view.observedCounts !== "unavailable-expectation-is-not-observed-detector-counts"
  ) {
    throw new Error("v415-v414-authority-lock");
  }
  const rays = artifact.view.rays.map((ray) => createRay(artifact, ray));
  const rows = rays.flatMap((ray) => ray.rows);
  const maxima = Object.freeze({
    sourceHighCountApproximationIndicator: Math.max(...rows.map((row) => row.sourceHighCountApproximationIndicator)),
    countingComponentClosureRelative: Math.max(
      ...rows.map((row) =>
        relative(
          row.totalCountingResidualElectron,
          row.sourcePoissonResidualApproximationElectron +
            row.darkResidualElectron +
            row.backgroundResidualElectron +
            row.readResidualElectron,
        ),
      ),
    ),
    absoluteAdditionLossRelativeToResidual: Math.max(...rows.map((row) => row.absoluteAdditionLossRelativeToResidual)),
    calibrationCholeskyReconstructionRelative: Math.max(
      ...rays.map((ray) => ray.calibration.choleskyReconstructionRelative),
    ),
    absoluteStandardizedCountingResidual: Math.max(...rows.map((row) => Math.abs(row.standardizedCountingResidual))),
    absoluteCalibrationResidualElectron: Math.max(
      ...rays.flatMap((ray) => ray.calibration.residualElectron.map(Math.abs)),
    ),
    countingComponentNegativeLogLikelihood: Math.max(
      ...rows.map((row) => row.countingComponentNegativeLogLikelihood),
    ),
    calibrationGaussianNegativeLogLikelihood: Math.max(
      ...rays.map((ray) => ray.calibration.gaussianNegativeLogLikelihood),
    ),
  });
  if (
    rays.length !== 4 ||
    rows.length !== 16 ||
    maxima.sourceHighCountApproximationIndicator >= 2e-9 ||
    maxima.countingComponentClosureRelative > 1e-15 ||
    maxima.absoluteAdditionLossRelativeToResidual >= 1e-6 ||
    maxima.calibrationCholeskyReconstructionRelative >= 1e-12 ||
    !Object.values(maxima).every(Number.isFinite)
  ) {
    throw new Error(`v415-gate:${JSON.stringify(maxima)}`);
  }
  return Object.freeze({
    version: KERR_POLARIMETER_DETECTOR_LIKELIHOOD_VERSION_V415,
    status: "qualified-deterministic-high-count-noise-likelihood-fixture-only-measured-authority-unavailable",
    source: Object.freeze({ v414DetectorArtifactSha256: KERR_POLARIMETER_DETECTOR_ARTIFACT_SHA256_V414 }),
    seedNamespace: KERR_POLARIMETER_NOISE_SEED_NAMESPACE_V415,
    counts: Object.freeze({
      rayCount: 4,
      analyzerChannelCount: 4,
      likelihoodRowCount: 16,
      countingStreamsPerRow: 4,
      calibrationStreamsPerRay: 4,
    }),
    rays: Object.freeze(rays),
    maxima,
    sourceCountingModel:
      "poisson-photoelectron-thinning-high-count-normal-approximation-explicit-not-exact-integer-draw",
    darkBackgroundModel: "independent-small-lambda-poisson-inverse-cdf",
    readNoiseModel: "independent-zero-mean-gaussian-fixture",
    calibrationModel: "separate-multivariate-gaussian-cholesky-fixture",
    likelihoodCombinationPolicy:
      "counting-components-combined-within-row-calibration-reported-separately-no-cross-family-independence-claim",
    precisionBoundary:
      "absolute-expectation-exceeds-js-safe-integer-base-plus-residual-preserved-display-sum-nonauthoritative",
    observedCounts: "unavailable-synthetic-fixture-is-not-observed-detector-data",
    measuredDetectorAuthority: "unavailable-v368-authority-artifacts-missing",
    syntheticFixtureAvailable: true,
    exactSourcePoissonIntegerAvailable: false,
    sciencePayloadMutationAllowed: false,
    cinematicConsumerAllowed: false,
    denseCampaignStatus: "incomplete-0-of-49",
    browserQualification: "not-run",
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

export const canonicalShaV415 = (value: unknown): string =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

export function parseKerrPolarimeterDetectorLikelihoodArtifactV415(
  value: unknown,
): KerrPolarimeterDetectorLikelihoodArtifactV415 {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrPolarimeterDetectorLikelihoodArtifactV415>)
      : null;
  if (
    !source ||
    source.version !== KERR_POLARIMETER_DETECTOR_LIKELIHOOD_ARTIFACT_VERSION_V415 ||
    source.status !==
      "qualified-deterministic-high-count-noise-likelihood-fixture-only-measured-authority-unavailable" ||
    source.source?.v414DetectorArtifactSha256 !== KERR_POLARIMETER_DETECTOR_ARTIFACT_SHA256_V414 ||
    !SHA.test(source.source.pythonOracleArtifactSha256 ?? "") ||
    !SHA.test(source.sourceFiles?.v414DetectorFileSha256 ?? "") ||
    !SHA.test(source.sourceFiles?.pythonOracleFileSha256 ?? "") ||
    source.view?.counts.likelihoodRowCount !== 16 ||
    source.view.rays?.length !== 4 ||
    source.view.rays.some((ray) => ray.rows.length !== 4) ||
    source.view.observedCounts !== "unavailable-synthetic-fixture-is-not-observed-detector-data" ||
    source.view.exactSourcePoissonIntegerAvailable !== false ||
    Math.max(...Object.values(source.oracleComparison ?? {})) >= 1e-10 ||
    source.deterministicReplay !== true ||
    source.measuredDetectorAuthorityGranted !== false ||
    source.observedCountsAvailable !== false ||
    source.exactSourcePoissonIntegerAvailable !== false ||
    source.networkAttempted !== false ||
    source.denseShardExecuted !== false ||
    source.browserQualification !== "not-run" ||
    source.boundary !==
      "deterministic-noise-likelihood-fixture-qualified-not-measured-counts-or-detector-authority" ||
    !SHA.test(source.artifactSha256 ?? "")
  ) {
    throw new Error("v415-artifact-identity");
  }
  return value as KerrPolarimeterDetectorLikelihoodArtifactV415;
}

export function createKerrPolarimeterDetectorLikelihoodSummaryV415(
  value: unknown,
): KerrPolarimeterDetectorLikelihoodSummaryV415 {
  const artifact = parseKerrPolarimeterDetectorLikelihoodArtifactV415(value);
  return Object.freeze({
    version: KERR_POLARIMETER_DETECTOR_LIKELIHOOD_SUMMARY_VERSION_V415,
    status: artifact.status,
    artifactSha256: artifact.artifactSha256,
    v414DetectorArtifactSha256: artifact.source.v414DetectorArtifactSha256,
    rayCount: 4,
    analyzerChannelCount: 4,
    likelihoodRowCount: 16,
    maxima: artifact.view.maxima,
    oracleComparison: artifact.oracleComparison,
    observedCounts: artifact.view.observedCounts,
    measuredDetectorAuthority: artifact.view.measuredDetectorAuthority,
    exactSourcePoissonIntegerAvailable: false,
    fullArtifactAvailable: true,
    browserQualification: "not-run",
    boundary: "summary-only-no-sixteen-likelihood-rows-or-calibration-vectors-in-react-state",
  });
}

export function parseKerrPolarimeterDetectorLikelihoodSummaryV415(
  value: unknown,
): KerrPolarimeterDetectorLikelihoodSummaryV415 {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrPolarimeterDetectorLikelihoodSummaryV415>)
      : null;
  if (
    !source ||
    source.version !== KERR_POLARIMETER_DETECTOR_LIKELIHOOD_SUMMARY_VERSION_V415 ||
    source.status !==
      "qualified-deterministic-high-count-noise-likelihood-fixture-only-measured-authority-unavailable" ||
    !SHA.test(source.artifactSha256 ?? "") ||
    source.v414DetectorArtifactSha256 !== KERR_POLARIMETER_DETECTOR_ARTIFACT_SHA256_V414 ||
    source.rayCount !== 4 ||
    source.analyzerChannelCount !== 4 ||
    source.likelihoodRowCount !== 16 ||
    !source.maxima ||
    !source.oracleComparison ||
    source.observedCounts !== "unavailable-synthetic-fixture-is-not-observed-detector-data" ||
    source.measuredDetectorAuthority !== "unavailable-v368-authority-artifacts-missing" ||
    source.exactSourcePoissonIntegerAvailable !== false ||
    source.fullArtifactAvailable !== true ||
    source.browserQualification !== "not-run" ||
    source.boundary !== "summary-only-no-sixteen-likelihood-rows-or-calibration-vectors-in-react-state" ||
    Object.hasOwn(source, "rays") ||
    Object.hasOwn(source, "view")
  ) {
    throw new Error("v415-summary-identity");
  }
  return value as KerrPolarimeterDetectorLikelihoodSummaryV415;
}

export function parseKerrPolarimeterDetectorLikelihoodResponseV415(
  value: unknown,
): KerrPolarimeterDetectorLikelihoodResponseV415 {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrPolarimeterDetectorLikelihoodResponseV415>)
      : null;
  if (!source || source.version !== KERR_POLARIMETER_DETECTOR_LIKELIHOOD_RESPONSE_VERSION_V415) {
    throw new Error("v415-response-version");
  }
  if (source.available === true && source.reason === "ready" && source.summary) {
    return {
      version: KERR_POLARIMETER_DETECTOR_LIKELIHOOD_RESPONSE_VERSION_V415,
      available: true,
      reason: "ready",
      summary: parseKerrPolarimeterDetectorLikelihoodSummaryV415(source.summary),
    };
  }
  if (
    source.available === false &&
    source.summary === null &&
    ["lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(source.reason ?? "")
  ) {
    return source as KerrPolarimeterDetectorLikelihoodResponseV415;
  }
  throw new Error("v415-response-identity");
}

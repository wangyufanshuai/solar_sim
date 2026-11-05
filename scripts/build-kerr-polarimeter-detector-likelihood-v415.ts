import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  canonicalShaV415,
  createKerrPolarimeterDetectorLikelihoodViewV415,
  KERR_POLARIMETER_DETECTOR_ARTIFACT_SHA256_V414,
  KERR_POLARIMETER_DETECTOR_LIKELIHOOD_ARTIFACT_VERSION_V415,
  parseKerrPolarimeterDetectorLikelihoodArtifactV415,
} from "../app/lib/kerrPolarimeterDetectorLikelihoodV415";

const root = process.cwd();
const paths = {
  detector: "dist/science/kerr-polarimeter-detector-count-v414/detector-count.json",
  oracle: "dist/science/kerr-polarimeter-detector-likelihood-v415/python-oracle.json",
  output: "dist/science/kerr-polarimeter-detector-likelihood-v415/noise-likelihood.json",
} as const;
const bytes = (path: string) => readFileSync(resolve(root, path));
const read = (path: string) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
const relative = (left: number, right: number) =>
  Math.abs(left - right) / Math.max(Number.MIN_VALUE, Math.abs(left), Math.abs(right));
type OracleRowV415 = Readonly<{
  channelIndex: number;
  sourceNormalZ: number;
  readGaussianZ: number;
  darkPoissonDraw: number;
  backgroundPoissonDraw: number;
  totalCountingResidualElectron: number;
  countingComponentNegativeLogLikelihood: number;
}>;
type OracleCalibrationV415 = Readonly<{
  gaussianZ: readonly number[];
  residualElectron: readonly number[];
  gaussianNegativeLogLikelihood: number;
}>;
type OracleRayV415 = Readonly<{
  rayIndex: number;
  rows: readonly OracleRowV415[];
  calibration: OracleCalibrationV415;
}>;

const detector = read(paths.detector);
const oracle = read(paths.oracle);
if (
  detector.artifactSha256 !== KERR_POLARIMETER_DETECTOR_ARTIFACT_SHA256_V414 ||
  oracle.version !== "v415-kerr-polarimeter-detector-noise-likelihood-python-oracle-v1" ||
  oracle.status !== "qualified-independent-deterministic-noise-likelihood-fixture-oracle" ||
  oracle.source?.v414DetectorArtifactSha256 !== KERR_POLARIMETER_DETECTOR_ARTIFACT_SHA256_V414 ||
  oracle.rowCount !== 16 ||
  oracle.sourcePoissonIntegerExact !== false ||
  oracle.observedCountsAvailable !== false ||
  oracle.measuredDetectorAuthorityGranted !== false ||
  oracle.networkAttempted !== false
) {
  throw new Error("v415-source-boundary");
}

const first = createKerrPolarimeterDetectorLikelihoodViewV415(detector);
const second = createKerrPolarimeterDetectorLikelihoodViewV415(detector);
if (canonicalShaV415(first) !== canonicalShaV415(second)) throw new Error("v415-ab-determinism");

let maximumNormalZAbsolute = 0;
let maximumCountingResidualRelative = 0;
let maximumCountingNegativeLogLikelihoodRelative = 0;
let maximumCalibrationResidualRelative = 0;
let maximumCalibrationNegativeLogLikelihoodRelative = 0;
for (const oracleRay of oracle.rays as readonly OracleRayV415[]) {
  const ray = first.rays.find((entry) => entry.rayIndex === oracleRay.rayIndex);
  if (!ray) throw new Error("v415-oracle-ray");
  for (const oracleRow of oracleRay.rows) {
    const row = ray.rows.find((entry) => entry.channelIndex === oracleRow.channelIndex);
    if (!row) throw new Error("v415-oracle-row");
    maximumNormalZAbsolute = Math.max(
      maximumNormalZAbsolute,
      Math.abs(row.sourceNormalZ - oracleRow.sourceNormalZ),
      Math.abs(row.readGaussianZ - oracleRow.readGaussianZ),
    );
    maximumCountingResidualRelative = Math.max(
      maximumCountingResidualRelative,
      relative(row.totalCountingResidualElectron, oracleRow.totalCountingResidualElectron),
    );
    maximumCountingNegativeLogLikelihoodRelative = Math.max(
      maximumCountingNegativeLogLikelihoodRelative,
      relative(row.countingComponentNegativeLogLikelihood, oracleRow.countingComponentNegativeLogLikelihood),
    );
    if (
      row.darkPoissonDraw !== oracleRow.darkPoissonDraw ||
      row.backgroundPoissonDraw !== oracleRow.backgroundPoissonDraw
    ) {
      throw new Error("v415-oracle-poisson-draw");
    }
  }
  const oracleCalibration = oracleRay.calibration;
  oracleCalibration.gaussianZ.forEach((value: number, index: number) => {
    maximumNormalZAbsolute = Math.max(maximumNormalZAbsolute, Math.abs(ray.calibration.gaussianZ[index] - value));
  });
  oracleCalibration.residualElectron.forEach((value: number, index: number) => {
    maximumCalibrationResidualRelative = Math.max(
      maximumCalibrationResidualRelative,
      relative(ray.calibration.residualElectron[index], value),
    );
  });
  maximumCalibrationNegativeLogLikelihoodRelative = Math.max(
    maximumCalibrationNegativeLogLikelihoodRelative,
    relative(ray.calibration.gaussianNegativeLogLikelihood, oracleCalibration.gaussianNegativeLogLikelihood),
  );
}
const oracleComparison = Object.freeze({
  maximumNormalZAbsolute,
  maximumCountingResidualRelative,
  maximumCountingNegativeLogLikelihoodRelative,
  maximumCalibrationResidualRelative,
  maximumCalibrationNegativeLogLikelihoodRelative,
});
if (Math.max(...Object.values(oracleComparison)) >= 1e-10) {
  throw new Error(`v415-oracle-comparison:${JSON.stringify(oracleComparison)}`);
}

const unsigned = {
  version: KERR_POLARIMETER_DETECTOR_LIKELIHOOD_ARTIFACT_VERSION_V415,
  generatedAt: detector.generatedAt,
  status: first.status,
  source: Object.freeze({
    v414DetectorArtifactSha256: KERR_POLARIMETER_DETECTOR_ARTIFACT_SHA256_V414,
    pythonOracleArtifactSha256: oracle.artifactSha256,
  }),
  sourceFiles: Object.freeze({
    v414DetectorFileSha256: fileSha(paths.detector),
    pythonOracleFileSha256: fileSha(paths.oracle),
  }),
  view: first,
  oracleComparison,
  deterministicReplay: true as const,
  measuredDetectorAuthorityGranted: false as const,
  observedCountsAvailable: false as const,
  exactSourcePoissonIntegerAvailable: false as const,
  networkAttempted: false as const,
  denseShardExecuted: false as const,
  browserQualification: "not-run" as const,
  boundary: "deterministic-noise-likelihood-fixture-qualified-not-measured-counts-or-detector-authority" as const,
};
const artifact = parseKerrPolarimeterDetectorLikelihoodArtifactV415({
  ...unsigned,
  artifactSha256: canonicalShaV415(unsigned),
});
const target = resolve(root, paths.output);
mkdirSync(dirname(target), { recursive: true });
const temporary = `${target}.${process.pid}.part`;
writeFileSync(temporary, `${JSON.stringify(artifact, null, 2)}\n`);
renameSync(temporary, target);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      rows: artifact.view.counts.likelihoodRowCount,
      maxima: artifact.view.maxima,
      oracleComparison: artifact.oracleComparison,
      observedCountsAvailable: false,
      exactSourcePoissonIntegerAvailable: false,
      output: paths.output,
    },
    null,
    2,
  ),
);

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  canonicalShaV416,
  createKerrPolarimeterStokesEnsembleViewV416,
  KERR_POLARIMETER_DETECTOR_LIKELIHOOD_ARTIFACT_SHA256_V415,
  KERR_POLARIMETER_STOKES_ENSEMBLE_ARTIFACT_VERSION_V416,
  parseKerrPolarimeterStokesEnsembleArtifactV416,
  type KerrPolarimeterPullStatisticsV416,
} from "../app/lib/kerrPolarimeterStokesEnsembleV416";
import { KERR_POLARIMETER_DETECTOR_ARTIFACT_SHA256_V414 } from "../app/lib/kerrPolarimeterDetectorLikelihoodV415";

const root = process.cwd();
const paths = {
  photon: "dist/science/kerr-science-photon-bands-v328/photon-radiance.json",
  profile: "dist/science/measured-visible-throughput-v383/profile.csv",
  spectral: "dist/science/kerr-polarimeter-spectral-response-v413/spectral-response.json",
  detector: "dist/science/kerr-polarimeter-detector-count-v414/detector-count.json",
  likelihood: "dist/science/kerr-polarimeter-detector-likelihood-v415/noise-likelihood.json",
  oracle: "dist/science/kerr-polarimeter-stokes-ensemble-v416/python-oracle.json",
  output: "dist/science/kerr-polarimeter-stokes-ensemble-v416/stokes-ensemble.json",
} as const;
const bytes = (path: string) => readFileSync(resolve(root, path));
const read = (path: string) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
const relative = (left: number, right: number) =>
  Math.abs(left - right) / Math.max(Number.MIN_VALUE, Math.abs(left), Math.abs(right));

type OracleRayV416 = Readonly<{
  rayIndex: number;
  effectiveResponseMatrix: readonly (readonly number[])[];
  countingPullStatistics: readonly KerrPolarimeterPullStatisticsV416[];
  calibrationPullStatistics: readonly KerrPolarimeterPullStatisticsV416[];
  firstTrial: Readonly<{ countingPull: readonly number[]; calibrationPull: readonly number[] }>;
}>;

const photon = read(paths.photon);
const profile = bytes(paths.profile).toString("utf8");
const spectral = read(paths.spectral);
const detector = read(paths.detector);
const likelihood = read(paths.likelihood);
const oracle = read(paths.oracle);
if (
  detector.artifactSha256 !== KERR_POLARIMETER_DETECTOR_ARTIFACT_SHA256_V414 ||
  likelihood.artifactSha256 !== KERR_POLARIMETER_DETECTOR_LIKELIHOOD_ARTIFACT_SHA256_V415 ||
  oracle.version !== "v416-kerr-polarimeter-stokes-ensemble-python-oracle-v1" ||
  oracle.status !== "qualified-independent-streaming-stokes-ensemble-oracle" ||
  oracle.source?.v414DetectorArtifactSha256 !== KERR_POLARIMETER_DETECTOR_ARTIFACT_SHA256_V414 ||
  oracle.source?.v415LikelihoodArtifactSha256 !== KERR_POLARIMETER_DETECTOR_LIKELIHOOD_ARTIFACT_SHA256_V415 ||
  oracle.trialCountPerRay !== 4096 ||
  oracle.totalTrialCount !== 16384 ||
  oracle.observedCountsAvailable !== false ||
  oracle.measuredDetectorAuthorityGranted !== false ||
  oracle.networkAttempted !== false
) {
  throw new Error("v416-source-boundary");
}

const first = createKerrPolarimeterStokesEnsembleViewV416(
  photon.view,
  profile,
  spectral,
  detector,
  likelihood,
);
const second = createKerrPolarimeterStokesEnsembleViewV416(
  photon.view,
  profile,
  spectral,
  detector,
  likelihood,
);
if (canonicalShaV416(first) !== canonicalShaV416(second)) throw new Error("v416-ab-determinism");

let maximumEffectiveResponseRelative = 0;
let maximumPullMeanAbsolute = 0;
let maximumPullStandardDeviationAbsolute = 0;
let maximumCoverageAbsolute = 0;
let maximumFirstTrialPullAbsolute = 0;
for (const oracleRay of oracle.rays as readonly OracleRayV416[]) {
  const ray = first.rays.find((entry) => entry.rayIndex === oracleRay.rayIndex);
  if (!ray) throw new Error("v416-oracle-ray");
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      maximumEffectiveResponseRelative = Math.max(
        maximumEffectiveResponseRelative,
        relative(ray.effectiveResponseMatrix[row][column], oracleRay.effectiveResponseMatrix[row][column]),
      );
    }
  }
  for (const family of ["countingPullStatistics", "calibrationPullStatistics"] as const) {
    ray[family].forEach((entry, component) => {
      const expected = oracleRay[family][component];
      maximumPullMeanAbsolute = Math.max(maximumPullMeanAbsolute, Math.abs(entry.mean - expected.mean));
      maximumPullStandardDeviationAbsolute = Math.max(
        maximumPullStandardDeviationAbsolute,
        Math.abs(entry.standardDeviation - expected.standardDeviation),
      );
      maximumCoverageAbsolute = Math.max(
        maximumCoverageAbsolute,
        Math.abs(entry.coverageOneSigma - expected.coverageOneSigma),
        Math.abs(entry.coverageTwoSigma - expected.coverageTwoSigma),
      );
    });
  }
  for (const family of ["countingPull", "calibrationPull"] as const) {
    ray.firstTrial[family].forEach((entry, component) => {
      maximumFirstTrialPullAbsolute = Math.max(
        maximumFirstTrialPullAbsolute,
        Math.abs(entry - oracleRay.firstTrial[family][component]),
      );
    });
  }
}
const oracleComparison = Object.freeze({
  maximumEffectiveResponseRelative,
  maximumPullMeanAbsolute,
  maximumPullStandardDeviationAbsolute,
  maximumCoverageAbsolute,
  maximumFirstTrialPullAbsolute,
});
if (Math.max(...Object.values(oracleComparison)) >= 1e-10) {
  throw new Error(`v416-oracle-comparison:${JSON.stringify(oracleComparison)}`);
}

const unsigned = {
  version: KERR_POLARIMETER_STOKES_ENSEMBLE_ARTIFACT_VERSION_V416,
  generatedAt: likelihood.generatedAt,
  status: first.status,
  source: Object.freeze({
    v414DetectorArtifactSha256: KERR_POLARIMETER_DETECTOR_ARTIFACT_SHA256_V414,
    v415LikelihoodArtifactSha256: KERR_POLARIMETER_DETECTOR_LIKELIHOOD_ARTIFACT_SHA256_V415,
    pythonOracleArtifactSha256: oracle.artifactSha256,
  }),
  sourceFiles: Object.freeze({
    photonFileSha256: fileSha(paths.photon),
    profileFileSha256: fileSha(paths.profile),
    spectralFileSha256: fileSha(paths.spectral),
    v414DetectorFileSha256: fileSha(paths.detector),
    v415LikelihoodFileSha256: fileSha(paths.likelihood),
    pythonOracleFileSha256: fileSha(paths.oracle),
  }),
  view: first,
  oracleComparison,
  deterministicReplay: true as const,
  measuredDetectorAuthorityGranted: false as const,
  observedCountsAvailable: false as const,
  networkAttempted: false as const,
  denseShardExecuted: false as const,
  browserQualification: "not-run" as const,
  boundary: "streaming-stokes-ensemble-fixture-qualified-not-measured-observation-or-authority" as const,
};
const artifact = parseKerrPolarimeterStokesEnsembleArtifactV416({
  ...unsigned,
  artifactSha256: canonicalShaV416(unsigned),
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
      totalTrialCount: artifact.view.totalTrialCount,
      retainedTrialCount: artifact.view.retainedTrialCount,
      metrics: artifact.view.metrics,
      oracleComparison: artifact.oracleComparison,
      observedCountsAvailable: false,
      output: paths.output,
    },
    null,
    2,
  ),
);

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  canonicalShaV417,
  createKerrPolarimeterNonlinearObservablesViewV417,
  KERR_POLARIMETER_NONLINEAR_OBSERVABLES_ARTIFACT_VERSION_V417,
  KERR_POLARIMETER_STOKES_ENSEMBLE_ARTIFACT_SHA256_V416,
  parseKerrPolarimeterNonlinearObservablesArtifactV417,
  type KerrPolarizationObservableStatisticsV417,
} from "../app/lib/kerrPolarimeterNonlinearObservablesV417";
import { KERR_POLARIMETER_DETECTOR_ARTIFACT_SHA256_V414 } from "../app/lib/kerrPolarimeterDetectorLikelihoodV415";

const root = process.cwd();
const paths = {
  detector: "dist/science/kerr-polarimeter-detector-count-v414/detector-count.json",
  ensemble: "dist/science/kerr-polarimeter-stokes-ensemble-v416/stokes-ensemble.json",
  oracle: "dist/science/kerr-polarimeter-nonlinear-observables-v417/python-oracle.json",
  output: "dist/science/kerr-polarimeter-nonlinear-observables-v417/nonlinear-observables.json",
} as const;
const bytes = (path: string) => readFileSync(resolve(root, path));
const read = (path: string) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
const relative = (left: number, right: number) =>
  Math.abs(left - right) / Math.max(Number.MIN_VALUE, Math.abs(left), Math.abs(right));
type OracleRayV417 = Readonly<{
  rayIndex: number;
  countingObservableCovariance: readonly (readonly number[])[];
  calibrationObservableCovariance: readonly (readonly number[])[];
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
}>;

const detector = read(paths.detector);
const ensemble = read(paths.ensemble);
const oracle = read(paths.oracle);
if (
  detector.artifactSha256 !== KERR_POLARIMETER_DETECTOR_ARTIFACT_SHA256_V414 ||
  ensemble.artifactSha256 !== KERR_POLARIMETER_STOKES_ENSEMBLE_ARTIFACT_SHA256_V416 ||
  oracle.version !== "v417-kerr-polarimeter-nonlinear-observables-python-oracle-v1" ||
  oracle.status !== "qualified-independent-nonlinear-polarization-coverage-oracle" ||
  oracle.source?.v414DetectorArtifactSha256 !== KERR_POLARIMETER_DETECTOR_ARTIFACT_SHA256_V414 ||
  oracle.source?.v416StokesEnsembleArtifactSha256 !== KERR_POLARIMETER_STOKES_ENSEMBLE_ARTIFACT_SHA256_V416 ||
  oracle.trialCountPerRay !== 8192 ||
  oracle.totalTrialCount !== 32768 ||
  oracle.observedPolarizationAvailable !== false ||
  oracle.measuredDetectorAuthorityGranted !== false ||
  oracle.networkAttempted !== false
) {
  throw new Error("v417-source-boundary");
}
const first = createKerrPolarimeterNonlinearObservablesViewV417(detector, ensemble);
const second = createKerrPolarimeterNonlinearObservablesViewV417(detector, ensemble);
if (canonicalShaV417(first) !== canonicalShaV417(second)) throw new Error("v417-ab-determinism");

let maximumPredictedSigmaRelative = 0;
let maximumMeanResidualAbsolute = 0;
let maximumStandardDeviationRelative = 0;
let maximumCoverageAbsolute = 0;
let maximumAxialResultantAbsolute = 0;
let maximumFirstTrialObservableAbsolute = 0;
for (const oracleRay of oracle.rays as readonly OracleRayV417[]) {
  const ray = first.rays.find((entry) => entry.rayIndex === oracleRay.rayIndex);
  if (!ray) throw new Error("v417-oracle-ray");
  for (const family of ["countingStatistics", "calibrationStatistics"] as const) {
    ray[family].forEach((entry, index) => {
      const expected = oracleRay[family][index];
      maximumPredictedSigmaRelative = Math.max(
        maximumPredictedSigmaRelative,
        relative(entry.predictedSigma, expected.predictedSigma),
      );
      maximumMeanResidualAbsolute = Math.max(maximumMeanResidualAbsolute, Math.abs(entry.meanResidual - expected.meanResidual));
      maximumStandardDeviationRelative = Math.max(
        maximumStandardDeviationRelative,
        relative(entry.residualStandardDeviation, expected.residualStandardDeviation),
      );
      maximumCoverageAbsolute = Math.max(
        maximumCoverageAbsolute,
        Math.abs(entry.coverageOneSigma - expected.coverageOneSigma),
        Math.abs(entry.coverageTwoSigma - expected.coverageTwoSigma),
      );
      if (entry.observable === "evpa") {
        maximumAxialResultantAbsolute = Math.max(
          maximumAxialResultantAbsolute,
          Math.abs(entry.axialResultantLength! - expected.axialResultantLength!),
          Math.abs(entry.axialMeanResidualRad! - expected.axialMeanResidualRad!),
        );
      }
    });
  }
  for (const family of ["counting", "calibration"] as const) {
    for (const observable of ["pL", "pC", "evpaRad", "evpaResidualRad"] as const) {
      maximumFirstTrialObservableAbsolute = Math.max(
        maximumFirstTrialObservableAbsolute,
        Math.abs(ray.firstTrial[family][observable] - oracleRay.firstTrial[family][observable]),
      );
    }
    if (
      ray.pLDebiasClampCount[family] !== oracleRay.pLDebiasClampCount[family] ||
      ray.physicalConeViolationCount[family] !== oracleRay.physicalConeViolationCount[family] ||
      ray.invalidObservableCount[family] !== oracleRay.invalidObservableCount[family]
    ) {
      throw new Error("v417-oracle-counts");
    }
  }
}
const oracleComparison = Object.freeze({
  maximumPredictedSigmaRelative,
  maximumMeanResidualAbsolute,
  maximumStandardDeviationRelative,
  maximumCoverageAbsolute,
  maximumAxialResultantAbsolute,
  maximumFirstTrialObservableAbsolute,
});
if (Math.max(...Object.values(oracleComparison)) >= 1e-10) {
  throw new Error(`v417-oracle-comparison:${JSON.stringify(oracleComparison)}`);
}
const unsigned = {
  version: KERR_POLARIMETER_NONLINEAR_OBSERVABLES_ARTIFACT_VERSION_V417,
  generatedAt: ensemble.generatedAt,
  status: first.status,
  source: Object.freeze({
    v414DetectorArtifactSha256: KERR_POLARIMETER_DETECTOR_ARTIFACT_SHA256_V414,
    v416StokesEnsembleArtifactSha256: KERR_POLARIMETER_STOKES_ENSEMBLE_ARTIFACT_SHA256_V416,
    pythonOracleArtifactSha256: oracle.artifactSha256,
  }),
  sourceFiles: Object.freeze({
    v414DetectorFileSha256: fileSha(paths.detector),
    v416EnsembleFileSha256: fileSha(paths.ensemble),
    pythonOracleFileSha256: fileSha(paths.oracle),
  }),
  view: first,
  oracleComparison,
  deterministicReplay: true as const,
  measuredDetectorAuthorityGranted: false as const,
  observedPolarizationAvailable: false as const,
  networkAttempted: false as const,
  denseShardExecuted: false as const,
  browserQualification: "not-run" as const,
  boundary: "nonlinear-polarization-ensemble-fixture-qualified-not-measured-polarization-or-authority" as const,
};
const artifact = parseKerrPolarimeterNonlinearObservablesArtifactV417({
  ...unsigned,
  artifactSha256: canonicalShaV417(unsigned),
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
      truth: artifact.view.truth,
      metrics: artifact.view.metrics,
      oracleComparison: artifact.oracleComparison,
      observedPolarizationAvailable: false,
      output: paths.output,
    },
    null,
    2,
  ),
);

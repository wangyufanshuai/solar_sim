import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
const python = process.platform === "win32" ? "python" : "python3";
const run = (label, command, args) => {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: false,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
};
run("v387-python-oracle", python, [
  "scripts/run-kerr-photon-source-identifiability-oracle-v387.py",
]);
run("v387-identifiability", node, [
  resolve(root, "node_modules/tsx/dist/cli.mjs"),
  "scripts/build-kerr-photon-source-identifiability-v387.ts",
]);
run("v386-evidence-reseal", node, ["scripts/build-shadow-candidate-v386.mjs"]);
run("v387-evidence", node, ["scripts/build-shadow-candidate-v387.mjs"]);
const firstEvidenceSha256 = JSON.parse(
  readFileSync(
    resolve(root, "dist/science/orbit-atlas-shadow-v387-evidence.json"),
    "utf8",
  ),
).evidenceSha256;
run("v387-tests", node, [
  resolve(root, "node_modules/vitest/vitest.mjs"),
  "run",
  "app/lib/kerrPhotonSourceIdentifiabilityV387.test.ts",
  "app/lib/kerrPhotonSourceIdentifiabilityServerV387.test.ts",
  "app/api/atlas/relativity-evidence/v387/photon-identifiability/route.test.ts",
  "app/components/KerrPhotonIdentifiabilitySurfaceV387.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV387.test.ts",
  "app/components/MeasuredVisiblePhotonSensitivitySurfaceV386.test.tsx",
]);
run("v387-types", node, [
  resolve(root, "node_modules/typescript/bin/tsc"),
  "--noEmit",
]);
run("v387-evidence-determinism", node, [
  "scripts/build-shadow-candidate-v387.mjs",
]);

const artifact = JSON.parse(
  readFileSync(
    resolve(
      root,
      "dist/science/kerr-photon-source-identifiability-v387/identifiability.json",
    ),
    "utf8",
  ),
);
const evidence = JSON.parse(
  readFileSync(
    resolve(root, "dist/science/orbit-atlas-shadow-v387-evidence.json"),
    "utf8",
  ),
);
const pointer = JSON.parse(
  readFileSync(
    resolve(
      root,
      "dist/release/orbit-atlas-current-local-shadow-candidate-v387.json",
    ),
    "utf8",
  ),
);
const state = JSON.parse(
  readFileSync(
    resolve(root, "dist/science/kerr-campaign-v314/campaign-state.json"),
    "utf8",
  ),
);
const formal = JSON.parse(
  readFileSync(
    resolve(root, "dist/release/orbit-atlas-current-product-evidence-v263.json"),
    "utf8",
  ),
);
const forbidden = [
  "dist/staging/measured-authority-v382-visible/manifest.json",
  "dist/science/measured-expectation-v375/envelope.json",
  "dist/science/expected-electron-image-v376/image.json",
  "dist/science/expected-electron-image-v376/image.csv",
];
if (
  evidence.evidenceSha256 !== firstEvidenceSha256 ||
  artifact.rows?.length !== 12 ||
  artifact.counts?.bandCount !== 3 ||
  artifact.global?.rank !== 1 ||
  artifact.global?.singularValues?.[1] !== 0 ||
  artifact.maxima?.sourceReconstructionRelativeDifference >= 2e-6 ||
  artifact.maxima?.finiteDifferenceRelativeDifference >= 2e-7 ||
  artifact.maxima?.pythonOracleRelativeDifference >= 2e-7 ||
  artifact.theorem?.identifiableCombination !== "ln-g-plus-ln-T" ||
  artifact.theorem?.additionalContinuumBandsBreakDegeneracy !== false ||
  artifact.covarianceAdmission?.validatorImplemented !== true ||
  artifact.covarianceAdmission?.jointDimension !== 14 ||
  artifact.covarianceAdmission?.covariancePackAvailable !== false ||
  artifact.covarianceAdmission?.admissionStatus !== "not-run-input-unavailable" ||
  artifact.covarianceAdmission?.syntheticFixturePublishable !== false ||
  artifact.covarianceAdmission?.uncertaintyProjectionAvailable !== false ||
  artifact.qualification?.temperatureRedshiftSeparatelyIdentifiable !== false ||
  artifact.qualification?.absoluteScientificUncertaintyQualified !== false ||
  artifact.qualification?.measuredAuthorityGranted !== false ||
  artifact.qualification?.observedCountsAvailable !== false ||
  artifact.qualification?.scienceImageAvailable !== false ||
  evidence.covarianceBoundary?.sciencePayloadMutationAllowed !== false ||
  evidence.covarianceBoundary?.cinematicConsumerAllowed !== false ||
  pointer.capabilities?.v387AbsoluteScientificUncertainty !== "not-qualified" ||
  pointer.localShadowDefaultApplied !== false ||
  forbidden.some((path) => existsSync(resolve(root, path))) ||
  state.status !== "incomplete-0-of-49" ||
  state.completedShardCount !== 0 ||
  state.attemptConsumed !== false ||
  state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  evidence.browserQualification !== "not-run"
) {
  throw new Error("v387 fail-closed validation failed");
}
const transientPattern = /[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/;
if (
  transientPattern.test(JSON.stringify(evidence)) ||
  transientPattern.test(JSON.stringify(pointer))
) {
  throw new Error("v387 transient evidence leak");
}
console.log(
  JSON.stringify(
    {
      status: "passed-v387-low-memory",
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      measurements: artifact.counts.measurementCount,
      bands: artifact.counts.bandCount,
      globalRank: artifact.global.rank,
      maximumSourceReconstructionRelativeDifference:
        artifact.maxima.sourceReconstructionRelativeDifference,
      maximumFiniteDifferenceRelativeDifference:
        artifact.maxima.finiteDifferenceRelativeDifference,
      maximumPythonOracleRelativeDifference:
        artifact.maxima.pythonOracleRelativeDifference,
      additionalContinuumBandsBreakDegeneracy: false,
      covarianceValidatorImplemented: true,
      covariancePackAvailable: false,
      uncertaintyProjectionAvailable: false,
      absoluteScientificUncertaintyQualified: false,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: evidence.browserQualification,
    },
    null,
    2,
  ),
);

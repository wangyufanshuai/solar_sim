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
run("v386-python-oracle", python, [
  "scripts/run-measured-visible-photon-sensitivity-oracle-v386.py",
]);
run("v386-sensitivity", node, [
  resolve(root, "node_modules/tsx/dist/cli.mjs"),
  "scripts/build-measured-visible-photon-sensitivity-v386.ts",
]);
run("v385-evidence-reseal", node, ["scripts/build-shadow-candidate-v385.mjs"]);
run("v386-evidence", node, ["scripts/build-shadow-candidate-v386.mjs"]);
const firstEvidenceSha256 = JSON.parse(
  readFileSync(
    resolve(root, "dist/science/orbit-atlas-shadow-v386-evidence.json"),
    "utf8",
  ),
).evidenceSha256;
run("v386-tests", node, [
  resolve(root, "node_modules/vitest/vitest.mjs"),
  "run",
  "app/lib/measuredVisiblePhotonSensitivityV386.test.ts",
  "app/lib/measuredVisiblePhotonSensitivityServerV386.test.ts",
  "app/api/atlas/relativity-evidence/v386/visible-photon-sensitivity/route.test.ts",
  "app/components/MeasuredVisiblePhotonSensitivitySurfaceV386.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV386.test.ts",
  "app/components/MeasuredVisiblePhotonErrorBudgetSurfaceV385.test.tsx",
]);
run("v386-types", node, [
  resolve(root, "node_modules/typescript/bin/tsc"),
  "--noEmit",
]);
run("v386-evidence-determinism", node, [
  "scripts/build-shadow-candidate-v386.mjs",
]);

const sensitivity = JSON.parse(
  readFileSync(
    resolve(
      root,
      "dist/science/measured-visible-photon-sensitivity-v386/sensitivity.json",
    ),
    "utf8",
  ),
);
const evidence = JSON.parse(
  readFileSync(
    resolve(root, "dist/science/orbit-atlas-shadow-v386-evidence.json"),
    "utf8",
  ),
);
const pointer = JSON.parse(
  readFileSync(
    resolve(
      root,
      "dist/release/orbit-atlas-current-local-shadow-candidate-v386.json",
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
  sensitivity.rows?.length !== 4 ||
  sensitivity.counts?.wavelengthBinCount !== 12 ||
  sensitivity.counts?.responseCoefficientCount !== 56 ||
  sensitivity.maxima?.throughputWeightSumAbsoluteResidual >= 5e-13 ||
  sensitivity.maxima?.finiteDifferenceRelativeDifference >= 1e-7 ||
  sensitivity.maxima?.pythonOracleRelativeDifference >= 2e-7 ||
  sensitivity.model?.sourceJacobianRank !== 1 ||
  sensitivity.model?.sourceIdentifiableCombination !== "ln-g-plus-ln-T" ||
  sensitivity.model?.temperatureRedshiftSeparatelyIdentifiable !== false ||
  sensitivity.calibrationContract?.suppliedCovarianceAvailable !== false ||
  sensitivity.calibrationContract?.numericalPlaceholderUsed !== false ||
  sensitivity.calibrationContract?.rssApplied !== false ||
  sensitivity.calibrationContract?.uncertaintyProjectionAvailable !== false ||
  sensitivity.qualification?.sensitivityKernelQualified !== true ||
  sensitivity.qualification?.absoluteScientificUncertaintyQualified !== false ||
  sensitivity.qualification?.measuredAuthorityGranted !== false ||
  sensitivity.qualification?.observedCountsAvailable !== false ||
  sensitivity.qualification?.scienceImageAvailable !== false ||
  evidence.calibrationBoundary?.uncertaintyProjectionAvailable !== false ||
  evidence.calibrationBoundary?.sciencePayloadMutationAllowed !== false ||
  evidence.calibrationBoundary?.cinematicConsumerAllowed !== false ||
  pointer.capabilities?.v386AbsoluteScientificUncertainty !== "not-qualified" ||
  pointer.localShadowDefaultApplied !== false ||
  forbidden.some((path) => existsSync(resolve(root, path))) ||
  state.status !== "incomplete-0-of-49" ||
  state.completedShardCount !== 0 ||
  state.attemptConsumed !== false ||
  state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  evidence.browserQualification !== "not-run"
) {
  throw new Error("v386 fail-closed validation failed");
}
const transientPattern = /[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/;
if (
  transientPattern.test(JSON.stringify(evidence)) ||
  transientPattern.test(JSON.stringify(pointer))
) {
  throw new Error("v386 transient evidence leak");
}
console.log(
  JSON.stringify(
    {
      status: "passed-v386-low-memory",
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      rays: sensitivity.counts.rayCount,
      binsPerRay: sensitivity.counts.wavelengthBinCount,
      responseCoefficients: sensitivity.counts.responseCoefficientCount,
      maximumWeightResidual:
        sensitivity.maxima.throughputWeightSumAbsoluteResidual,
      maximumFiniteDifferenceRelativeDifference:
        sensitivity.maxima.finiteDifferenceRelativeDifference,
      maximumPythonOracleRelativeDifference:
        sensitivity.maxima.pythonOracleRelativeDifference,
      sourceJacobianRank: sensitivity.model.sourceJacobianRank,
      uncertaintyProjectionAvailable: false,
      absoluteScientificUncertaintyQualified: false,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: evidence.browserQualification,
    },
    null,
    2,
  ),
);

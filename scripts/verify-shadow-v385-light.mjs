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
run("v385-python-oracle", python, [
  "scripts/run-measured-visible-photon-error-budget-oracle-v385.py",
]);
run("v385-budget", node, [
  resolve(root, "node_modules/tsx/dist/cli.mjs"),
  "scripts/build-measured-visible-photon-error-budget-v385.ts",
]);
run("v385-evidence", node, ["scripts/build-shadow-candidate-v385.mjs"]);
const firstEvidenceSha256 = JSON.parse(
  readFileSync(
    resolve(root, "dist/science/orbit-atlas-shadow-v385-evidence.json"),
    "utf8",
  ),
).evidenceSha256;
run("v385-tests", node, [
  resolve(root, "node_modules/vitest/vitest.mjs"),
  "run",
  "app/lib/measuredVisiblePhotonErrorBudgetV385.test.ts",
  "app/lib/measuredVisiblePhotonErrorBudgetServerV385.test.ts",
  "app/api/atlas/relativity-evidence/v385/visible-photon-error-budget/route.test.ts",
  "app/components/MeasuredVisiblePhotonErrorBudgetSurfaceV385.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV385.test.ts",
]);
run("v385-types", node, [
  resolve(root, "node_modules/typescript/bin/tsc"),
  "--noEmit",
]);
run("v385-evidence-determinism", node, [
  "scripts/build-shadow-candidate-v385.mjs",
]);

const budget = JSON.parse(
  readFileSync(
    resolve(
      root,
      "dist/science/measured-visible-photon-error-budget-v385/error-budget.json",
    ),
    "utf8",
  ),
);
const evidence = JSON.parse(
  readFileSync(
    resolve(root, "dist/science/orbit-atlas-shadow-v385-evidence.json"),
    "utf8",
  ),
);
const pointer = JSON.parse(
  readFileSync(
    resolve(
      root,
      "dist/release/orbit-atlas-current-local-shadow-candidate-v385.json",
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
  budget.rows?.length !== 4 ||
  budget.maxima?.knownComputationalUpperBoundRelative >= 2e-7 ||
  budget.maxima?.pythonOracleRelativeDifference >= 1e-15 ||
  budget.combination?.rssApplied !== false ||
  budget.combination?.unknownSystematicsTreatedAsZero !== false ||
  budget.qualification?.computationalBudgetQualified !== true ||
  budget.qualification?.absoluteScientificBudgetQualified !== false ||
  budget.qualification?.throughputCalibrationSystematicAvailable !== false ||
  budget.qualification?.sourceModelSystematicAvailable !== false ||
  evidence.boundary?.observedCountsAvailable !== false ||
  evidence.boundary?.scienceImageAvailable !== false ||
  pointer.capabilities?.v385AbsoluteScientificBudget !== "not-qualified" ||
  pointer.localShadowDefaultApplied !== false ||
  forbidden.some((path) => existsSync(resolve(root, path))) ||
  state.status !== "incomplete-0-of-49" ||
  state.completedShardCount !== 0 ||
  state.attemptConsumed !== false ||
  state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  evidence.browserQualification !== "not-run"
) {
  throw new Error("v385 fail-closed validation failed");
}
console.log(
  JSON.stringify(
    {
      status: "passed-v385-low-memory",
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      rows: budget.rows.length,
      maximumKnownComputationalUpperBoundRelative:
        budget.maxima.knownComputationalUpperBoundRelative,
      maximumPythonOracleRelativeDifference:
        budget.maxima.pythonOracleRelativeDifference,
      combinationRule: budget.combination.rule,
      rssApplied: false,
      unknownSystematicsTreatedAsZero: false,
      absoluteScientificBudgetQualified: false,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: evidence.browserQualification,
    },
    null,
    2,
  ),
);

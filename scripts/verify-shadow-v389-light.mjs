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
  if (result.status !== 0) {
    throw new Error(`${label} failed with ${result.status}`);
  }
};

run("v389-python-oracle", python, [
  "scripts/run-kerr-conditional-temperature-interval-oracle-v389.py",
]);
run("v389-temperature-interval", node, [
  resolve(root, "node_modules/tsx/dist/cli.mjs"),
  "scripts/build-kerr-conditional-temperature-interval-v389.ts",
]);
run("v388-evidence-reseal", node, [
  "scripts/build-shadow-candidate-v388.mjs",
]);
run("v389-evidence", node, ["scripts/build-shadow-candidate-v389.mjs"]);
const firstEvidenceSha256 = JSON.parse(
  readFileSync(
    resolve(root, "dist/science/orbit-atlas-shadow-v389-evidence.json"),
    "utf8",
  ),
).evidenceSha256;
run("v389-tests", node, [
  resolve(root, "node_modules/vitest/vitest.mjs"),
  "run",
  "app/lib/kerrConditionalTemperatureIntervalV389.test.ts",
  "app/lib/kerrConditionalTemperatureIntervalServerV389.test.ts",
  "app/api/atlas/relativity-evidence/v389/temperature-interval/route.test.ts",
  "app/components/KerrConditionalTemperatureIntervalSurfaceV389.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV389.test.ts",
]);
run("v389-types", node, [
  resolve(root, "node_modules/typescript/bin/tsc"),
  "--noEmit",
]);
run("v389-eslint", node, [
  resolve(root, "node_modules/eslint/bin/eslint.js"),
  "app/lib/kerrConditionalTemperatureIntervalV389.ts",
  "app/lib/kerrConditionalTemperatureIntervalV389.test.ts",
  "app/lib/kerrConditionalTemperatureIntervalServerV389.ts",
  "app/lib/kerrConditionalTemperatureIntervalServerV389.test.ts",
  "app/api/atlas/relativity-evidence/v389/temperature-interval/route.ts",
  "app/api/atlas/relativity-evidence/v389/temperature-interval/route.test.ts",
  "app/components/KerrConditionalTemperatureIntervalSurfaceV389.tsx",
  "app/components/KerrConditionalTemperatureIntervalSurfaceV389.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV389.ts",
  "app/lib/atlasShadowCapabilityPointerV389.test.ts",
  "scripts/build-kerr-conditional-temperature-interval-v389.ts",
  "scripts/build-shadow-candidate-v389.mjs",
  "scripts/verify-shadow-v389-light.mjs",
]);
run("v389-evidence-determinism", node, [
  "scripts/build-shadow-candidate-v389.mjs",
]);

const artifact = JSON.parse(
  readFileSync(
    resolve(
      root,
      "dist/science/kerr-conditional-temperature-interval-v389/temperature-interval.json",
    ),
    "utf8",
  ),
);
const evidence = JSON.parse(
  readFileSync(
    resolve(root, "dist/science/orbit-atlas-shadow-v389-evidence.json"),
    "utf8",
  ),
);
const pointer = JSON.parse(
  readFileSync(
    resolve(
      root,
      "dist/release/orbit-atlas-current-local-shadow-candidate-v389.json",
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
const formalEvidence = JSON.parse(
  readFileSync(resolve(root, formal.source), "utf8"),
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
  artifact.counts?.intervalCount !== 12 ||
  artifact.maxima?.conditionedTemperatureNumericalRelativeRadius >= 3e-6 ||
  artifact.maxima?.sourceModelTemperatureRelativeRadius >= 3e-6 ||
  artifact.maxima?.pythonOracleRelativeDifference >= 2e-7 ||
  artifact.rows.some((row) => row.absoluteTemperatureInterval !== null) ||
  artifact.algorithms?.intervalCombination !==
    "worst-case-endpoints-no-independence-proof-no-rss" ||
  artifact.intervalSemantics?.knownNumericalIntervalQualified !== true ||
  artifact.intervalSemantics?.sourceModelNumericalIntervalQualified !== true ||
  artifact.intervalSemantics?.confidenceInterval !== false ||
  artifact.intervalSemantics?.probabilityContentAssigned !== false ||
  artifact.intervalSemantics?.detectorCalibrationCovarianceAvailable !== false ||
  artifact.intervalSemantics?.geometryPhysicalSystematicAvailable !== false ||
  artifact.intervalSemantics?.nonPlanckSpectralSystematicAvailable !== false ||
  artifact.intervalSemantics?.absoluteScientificIntervalQualified !== false ||
  artifact.intervalSemantics?.numericalPlaceholderUsed !== false ||
  artifact.qualification?.absoluteTemperatureAuthorityGranted !== false ||
  artifact.qualification?.measuredAuthorityGranted !== false ||
  artifact.qualification?.observedCountsAvailable !== false ||
  artifact.qualification?.scienceImageAvailable !== false ||
  evidence.intervalBoundary?.sciencePayloadMutationAllowed !== false ||
  evidence.intervalBoundary?.cinematicConsumerAllowed !== false ||
  pointer.capabilities?.v389AbsoluteTemperatureInterval !== "not-qualified" ||
  pointer.capabilities?.v389IntervalSemantics !==
    "deterministic-bounds-no-confidence-no-probability-no-rss" ||
  pointer.localShadowDefaultApplied !== false ||
  forbidden.some((path) => existsSync(resolve(root, path))) ||
  state.status !== "incomplete-0-of-49" ||
  state.completedShardCount !== 0 ||
  state.attemptConsumed !== false ||
  state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" ||
  formalEvidence.contracts?.eihOnePnMutation !== "not-applied" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84 ||
  evidence.browserQualification !== "not-run"
) {
  throw new Error("v389 fail-closed validation failed");
}
const transientPattern =
  /[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/;
if (
  transientPattern.test(JSON.stringify(evidence)) ||
  transientPattern.test(JSON.stringify(pointer))
) {
  throw new Error("v389 transient evidence leak");
}
console.log(
  JSON.stringify(
    {
      status: "passed-v389-low-memory",
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      intervalCount: artifact.counts.intervalCount,
      overlapCount: artifact.counts.overlapCount,
      maximumConditionedTemperatureNumericalRelativeRadius:
        artifact.maxima.conditionedTemperatureNumericalRelativeRadius,
      maximumSourceModelTemperatureRelativeRadius:
        artifact.maxima.sourceModelTemperatureRelativeRadius,
      maximumPythonOracleRelativeDifference:
        artifact.maxima.pythonOracleRelativeDifference,
      confidenceInterval: false,
      probabilityContentAssigned: false,
      absoluteScientificIntervalQualified: false,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: evidence.browserQualification,
    },
    null,
    2,
  ),
);

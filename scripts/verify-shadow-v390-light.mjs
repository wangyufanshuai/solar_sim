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

run("v390-python-oracle", python, [
  "scripts/run-kerr-temperature-systematics-transfer-oracle-v390.py",
]);
run("v390-transfer", node, [
  resolve(root, "node_modules/tsx/dist/cli.mjs"),
  "scripts/build-kerr-temperature-systematics-transfer-v390.ts",
]);
run("v389-evidence-reseal", node, [
  "scripts/build-shadow-candidate-v389.mjs",
]);
run("v390-evidence", node, ["scripts/build-shadow-candidate-v390.mjs"]);
const firstEvidenceSha256 = JSON.parse(
  readFileSync(
    resolve(root, "dist/science/orbit-atlas-shadow-v390-evidence.json"),
    "utf8",
  ),
).evidenceSha256;
run("v390-tests", node, [
  resolve(root, "node_modules/vitest/vitest.mjs"),
  "run",
  "app/lib/kerrTemperatureSystematicsTransferV390.test.ts",
  "app/lib/kerrTemperatureSystematicsTransferServerV390.test.ts",
  "app/api/atlas/relativity-evidence/v390/systematics-transfer/route.test.ts",
  "app/components/KerrTemperatureSystematicsSwitchyardV390.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV390.test.ts",
]);
run("v390-types", node, [
  resolve(root, "node_modules/typescript/bin/tsc"),
  "--noEmit",
]);
run("v390-eslint", node, [
  resolve(root, "node_modules/eslint/bin/eslint.js"),
  "app/lib/kerrTemperatureSystematicsTransferV390.ts",
  "app/lib/kerrTemperatureSystematicsTransferV390.test.ts",
  "app/lib/kerrTemperatureSystematicsTransferServerV390.ts",
  "app/lib/kerrTemperatureSystematicsTransferServerV390.test.ts",
  "app/api/atlas/relativity-evidence/v390/systematics-transfer/route.ts",
  "app/api/atlas/relativity-evidence/v390/systematics-transfer/route.test.ts",
  "app/components/KerrTemperatureSystematicsSwitchyardV390.tsx",
  "app/components/KerrTemperatureSystematicsSwitchyardV390.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV390.ts",
  "app/lib/atlasShadowCapabilityPointerV390.test.ts",
  "scripts/build-kerr-temperature-systematics-transfer-v390.ts",
  "scripts/build-shadow-candidate-v390.mjs",
  "scripts/verify-shadow-v390-light.mjs",
]);
run("v390-evidence-determinism", node, [
  "scripts/build-shadow-candidate-v390.mjs",
]);

const artifact = JSON.parse(
  readFileSync(
    resolve(
      root,
      "dist/science/kerr-temperature-systematics-transfer-v390/transfer-operator.json",
    ),
    "utf8",
  ),
);
const evidence = JSON.parse(
  readFileSync(
    resolve(root, "dist/science/orbit-atlas-shadow-v390-evidence.json"),
    "utf8",
  ),
);
const pointer = JSON.parse(
  readFileSync(
    resolve(
      root,
      "dist/release/orbit-atlas-current-local-shadow-candidate-v390.json",
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
  artifact.counts?.coefficientCount !== 72 ||
  artifact.counts?.rowRank !== 2 ||
  artifact.maxima?.finiteDifferenceRelativeDifference >= 2e-7 ||
  artifact.maxima?.pythonOracleRelativeDifference >= 2e-7 ||
  artifact.maxima?.conditionNumber >= 16 ||
  artifact.rows.some(
    (row) =>
      row.physicalSystematicVectorAdmitted !== false ||
      row.projectedPhysicalCovariance !== null ||
      row.absoluteScientificInterval !== null,
  ) ||
  artifact.admission?.photonDetectorCovarianceAvailable !== false ||
  artifact.admission?.geometryRedshiftPhysicalSystematicAvailable !== false ||
  artifact.admission?.pageThorneFluxPhysicalSystematicAvailable !== false ||
  artifact.admission?.nonPlanckSpectralSystematicAvailable !== false ||
  artifact.admission?.crossCovarianceAvailable !== false ||
  artifact.admission?.physicalSystematicVectorAdmitted !== false ||
  artifact.admission?.covarianceProjectionExecuted !== false ||
  artifact.admission?.unknownSystematicsTreatedAsZero !== false ||
  artifact.admission?.rssApplied !== false ||
  artifact.admission?.confidenceInterval !== false ||
  artifact.admission?.probabilityContentAssigned !== false ||
  artifact.qualification?.absoluteScientificIntervalQualified !== false ||
  artifact.qualification?.absoluteTemperatureAuthorityGranted !== false ||
  artifact.qualification?.measuredAuthorityGranted !== false ||
  evidence.physicalAdmissionBoundary?.sciencePayloadMutationAllowed !== false ||
  evidence.physicalAdmissionBoundary?.cinematicConsumerAllowed !== false ||
  pointer.capabilities?.v390TransferOperator !==
    "qualified-12-rank-2-72-coefficients" ||
  pointer.capabilities?.v390CovarianceProjection !==
    "not-run-input-unavailable" ||
  pointer.capabilities?.v390AbsoluteScientificInterval !== "not-qualified" ||
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
  throw new Error("v390 fail-closed validation failed");
}
const transientPattern =
  /[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/;
if (
  transientPattern.test(JSON.stringify(evidence)) ||
  transientPattern.test(JSON.stringify(pointer))
) {
  throw new Error("v390 transient evidence leak");
}
console.log(
  JSON.stringify(
    {
      status: "passed-v390-low-memory",
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      transfers: artifact.counts.transferCount,
      coefficients: artifact.counts.coefficientCount,
      rank: artifact.counts.rowRank,
      maximumFiniteDifferenceRelativeDifference:
        artifact.maxima.finiteDifferenceRelativeDifference,
      maximumPythonOracleRelativeDifference:
        artifact.maxima.pythonOracleRelativeDifference,
      maximumConditionNumber: artifact.maxima.conditionNumber,
      physicalSystematicVectorAdmitted: false,
      covarianceProjectionExecuted: false,
      absoluteScientificIntervalQualified: false,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: evidence.browserQualification,
    },
    null,
    2,
  ),
);

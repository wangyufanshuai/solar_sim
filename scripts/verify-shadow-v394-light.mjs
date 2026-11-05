import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
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

run("v394-python-oracle", python, [
  "scripts/run-kerr-global-covariance-oracle-v394.py",
]);
run("v394-global-propagation", node, [
  resolve(root, "node_modules/tsx/dist/cli.mjs"),
  "scripts/build-kerr-global-covariance-propagation-v394.ts",
]);
run("v394-evidence-chain-reseal", node, [
  "scripts/reseal-shadow-evidence-chain-v394.mjs",
]);
const firstEvidenceSha256 = JSON.parse(
  readFileSync(
    resolve(root, "dist/science/orbit-atlas-shadow-v394-evidence.json"),
    "utf8",
  ),
).evidenceSha256;
run("v394-tests", node, [
  resolve(root, "node_modules/vitest/vitest.mjs"),
  "run",
  "app/lib/kerrGlobalCovariancePropagationV394.test.ts",
  "app/lib/kerrGlobalCovariancePropagationServerV394.test.ts",
  "app/api/atlas/relativity-evidence/v394/global-covariance/route.test.ts",
  "app/components/KerrCovarianceLatticeV394.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV394.test.ts",
]);
run("v394-types", node, [
  resolve(root, "node_modules/typescript/bin/tsc"),
  "--noEmit",
]);
run("v394-eslint", node, [
  resolve(root, "node_modules/eslint/bin/eslint.js"),
  "app/lib/kerrGlobalCovariancePropagationV394.ts",
  "app/lib/kerrGlobalCovariancePropagationV394.test.ts",
  "app/lib/kerrGlobalCovariancePropagationServerV394.ts",
  "app/lib/kerrGlobalCovariancePropagationServerV394.test.ts",
  "app/api/atlas/relativity-evidence/v394/global-covariance/route.ts",
  "app/api/atlas/relativity-evidence/v394/global-covariance/route.test.ts",
  "app/components/KerrCovarianceLatticeV394.tsx",
  "app/components/KerrCovarianceLatticeV394.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV394.ts",
  "app/lib/atlasShadowCapabilityPointerV394.test.ts",
  "scripts/build-kerr-global-covariance-propagation-v394.ts",
  "scripts/build-shadow-candidate-v394.mjs",
  "scripts/reseal-shadow-evidence-chain-v394.mjs",
  "scripts/verify-shadow-v394-light.mjs",
]);
run("v394-evidence-determinism", node, [
  "scripts/build-shadow-candidate-v394.mjs",
]);

const artifact = JSON.parse(
  readFileSync(
    resolve(
      root,
      "dist/science/kerr-global-covariance-propagation-v394/global-propagation.json",
    ),
    "utf8",
  ),
);
const evidence = JSON.parse(
  readFileSync(
    resolve(root, "dist/science/orbit-atlas-shadow-v394-evidence.json"),
    "utf8",
  ),
);
const pointer = JSON.parse(
  readFileSync(
    resolve(
      root,
      "dist/release/orbit-atlas-current-local-shadow-candidate-v394.json",
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
  artifact.dimensions?.inputDimension !== 36 ||
  artifact.dimensions?.outputDimension !== 24 ||
  artifact.dimensions?.inputCovarianceCoefficientCount !== 1296 ||
  artifact.dimensions?.outputCovarianceCoefficientCount !== 576 ||
  artifact.validator?.qualified !== true ||
  artifact.validator?.rejectedAdversarialFixtureCount !== 9 ||
  artifact.selfTest?.publishable !== false ||
  artifact.selfTest?.nuisanceModeCount !== 3 ||
  artifact.selfTest?.maximumPythonOracleRelativeDifference >= 2e-12 ||
  !(artifact.selfTest?.maximumCrossRowAbsoluteCovariance > 0) ||
  artifact.productionAdmission?.globalCovarianceModelAvailable !== false ||
  artifact.productionAdmission?.crossRowEvidenceAvailable !== false ||
  artifact.productionAdmission?.nuisanceModesAvailable !== 0 ||
  artifact.productionAdmission?.covariancePropagationExecuted !== false ||
  artifact.productionAdmission?.blockIndependenceAssumed !== false ||
  artifact.productionAdmission?.missingCrossRowTermsTreatedAsZero !== false ||
  artifact.productionAdmission?.probabilityContentAssigned !== false ||
  artifact.qualification?.physicalGlobalCovarianceQualified !== false ||
  evidence.authorityBoundary?.sciencePayloadMutationAllowed !== false ||
  evidence.authorityBoundary?.cinematicConsumerAllowed !== false ||
  pointer.capabilities?.v394InputCovariance !==
    "qualified-36x36-1296-coefficients" ||
  pointer.capabilities?.v394OutputCovariance !==
    "qualified-24x24-576-coefficients" ||
  pointer.capabilities?.v394PhysicalGlobalCovariance !== "unavailable" ||
  pointer.capabilities?.v394ProductionPropagation !== "not-run" ||
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
  throw new Error("v394 fail-closed validation failed");
}
const transientPattern =
  /[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/;
if (
  transientPattern.test(JSON.stringify(evidence)) ||
  transientPattern.test(JSON.stringify(pointer))
) {
  throw new Error("v394 transient evidence leak");
}
for (const entry of evidence.sourceManifest ?? []) {
  const actual = createHash("sha256")
    .update(readFileSync(resolve(root, entry.path)))
    .digest("hex");
  if (actual !== entry.sha256) {
    throw new Error(`v394 source manifest mismatch: ${entry.path}`);
  }
}
console.log(
  JSON.stringify(
    {
      status: "passed-v394-low-memory",
      artifactSha256: artifact.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      inputDimension: artifact.dimensions.inputDimension,
      outputDimension: artifact.dimensions.outputDimension,
      nuisanceModeCount: artifact.selfTest.nuisanceModeCount,
      maximumCrossRowAbsoluteCovariance:
        artifact.selfTest.maximumCrossRowAbsoluteCovariance,
      maximumPythonOracleRelativeDifference:
        artifact.selfTest.maximumPythonOracleRelativeDifference,
      physicalGlobalCovarianceAvailable: false,
      productionPropagationExecuted: false,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: evidence.browserQualification,
    },
    null,
    2,
  ),
);

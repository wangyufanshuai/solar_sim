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

run("v392-python-oracle", python, [
  "scripts/run-kerr-physical-covariance-oracle-v392.py",
]);
run("v392-covariance-admission", node, [
  resolve(root, "node_modules/tsx/dist/cli.mjs"),
  "scripts/build-kerr-physical-covariance-admission-v392.ts",
]);
run("v390-evidence-reseal", node, ["scripts/build-shadow-candidate-v390.mjs"]);
run("v391-evidence-reseal", node, ["scripts/build-shadow-candidate-v391.mjs"]);
run("v392-evidence", node, ["scripts/build-shadow-candidate-v392.mjs"]);
const firstEvidenceSha256 = JSON.parse(
  readFileSync(
    resolve(root, "dist/science/orbit-atlas-shadow-v392-evidence.json"),
    "utf8",
  ),
).evidenceSha256;
run("v392-tests", node, [
  resolve(root, "node_modules/vitest/vitest.mjs"),
  "run",
  "app/lib/kerrPhysicalCovarianceAdmissionV392.test.ts",
  "app/lib/kerrPhysicalCovarianceAdmissionServerV392.test.ts",
  "app/api/atlas/relativity-evidence/v392/covariance-admission/route.test.ts",
  "app/components/KerrCovarianceInterlockV392.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV392.test.ts",
]);
run("v392-types", node, [
  resolve(root, "node_modules/typescript/bin/tsc"),
  "--noEmit",
]);
run("v392-eslint", node, [
  resolve(root, "node_modules/eslint/bin/eslint.js"),
  "app/lib/kerrPhysicalCovarianceAdmissionV392.ts",
  "app/lib/kerrPhysicalCovarianceAdmissionV392.test.ts",
  "app/lib/kerrPhysicalCovarianceAdmissionServerV392.ts",
  "app/lib/kerrPhysicalCovarianceAdmissionServerV392.test.ts",
  "app/api/atlas/relativity-evidence/v392/covariance-admission/route.ts",
  "app/api/atlas/relativity-evidence/v392/covariance-admission/route.test.ts",
  "app/components/KerrCovarianceInterlockV392.tsx",
  "app/components/KerrCovarianceInterlockV392.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV392.ts",
  "app/lib/atlasShadowCapabilityPointerV392.test.ts",
  "scripts/build-kerr-physical-covariance-admission-v392.ts",
  "scripts/build-shadow-candidate-v392.mjs",
  "scripts/verify-shadow-v392-light.mjs",
]);
run("v392-evidence-determinism", node, [
  "scripts/build-shadow-candidate-v392.mjs",
]);

const artifact = JSON.parse(
  readFileSync(
    resolve(
      root,
      "dist/science/kerr-physical-covariance-admission-v392/covariance-admission.json",
    ),
    "utf8",
  ),
);
const evidence = JSON.parse(
  readFileSync(
    resolve(root, "dist/science/orbit-atlas-shadow-v392-evidence.json"),
    "utf8",
  ),
);
const pointer = JSON.parse(
  readFileSync(
    resolve(
      root,
      "dist/release/orbit-atlas-current-local-shadow-candidate-v392.json",
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
  artifact.validator?.qualified !== true ||
  artifact.validator?.acceptedControlFixtureCount !== 1 ||
  artifact.validator?.rejectedAdversarialFixtureCount !== 6 ||
  artifact.selfTest?.publishable !== false ||
  artifact.selfTest?.projectedRowCount !== 12 ||
  artifact.selfTest?.maximumPythonOracleRelativeDifference >= 2e-12 ||
  artifact.productionAdmission?.physicalCovariancePackAvailable !== false ||
  artifact.productionAdmission?.physicalCovariancePackAdmitted !== false ||
  artifact.productionAdmission?.covarianceProjectionExecuted !== false ||
  artifact.productionAdmission?.unknownSystematicsTreatedAsZero !== false ||
  artifact.productionAdmission
    ?.missingCrossCovarianceImputedAsIndependent !== false ||
  artifact.productionAdmission?.probabilityContentAssigned !== false ||
  artifact.qualification?.absoluteScientificIntervalQualified !== false ||
  artifact.qualification?.absoluteTemperatureAuthorityGranted !== false ||
  evidence.authorityBoundary?.sciencePayloadMutationAllowed !== false ||
  evidence.authorityBoundary?.cinematicConsumerAllowed !== false ||
  pointer.capabilities?.v392AdmissionValidator !==
    "qualified-6-of-6-adversarial-rejections" ||
  pointer.capabilities?.v392PhysicalCovariance !== "unavailable" ||
  pointer.capabilities?.v392ProductionProjection !== "not-run" ||
  pointer.capabilities?.v392AbsoluteScientificInterval !== "not-qualified" ||
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
  throw new Error("v392 fail-closed validation failed");
}
const transientPattern =
  /[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/;
if (
  transientPattern.test(JSON.stringify(evidence)) ||
  transientPattern.test(JSON.stringify(pointer))
) {
  throw new Error("v392 transient evidence leak");
}
for (const entry of evidence.sourceManifest ?? []) {
  const actual = createHash("sha256")
    .update(readFileSync(resolve(root, entry.path)))
    .digest("hex");
  if (actual !== entry.sha256) {
    throw new Error(`v392 source manifest mismatch: ${entry.path}`);
  }
}
console.log(
  JSON.stringify(
    {
      status: "passed-v392-low-memory",
      artifactSha256: artifact.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      acceptedControlFixtureCount:
        artifact.validator.acceptedControlFixtureCount,
      rejectedAdversarialFixtureCount:
        artifact.validator.rejectedAdversarialFixtureCount,
      maximumPythonOracleRelativeDifference:
        artifact.selfTest.maximumPythonOracleRelativeDifference,
      physicalCovariancePackAvailable: false,
      productionProjectionExecuted: false,
      absoluteScientificIntervalQualified: false,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: evidence.browserQualification,
    },
    null,
    2,
  ),
);

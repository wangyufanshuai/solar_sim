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

run("v393-python-oracle", python, [
  "scripts/run-kerr-covariance-source-oracle-v393.py",
]);
run("v393-source-admission", node, [
  resolve(root, "node_modules/tsx/dist/cli.mjs"),
  "scripts/build-kerr-covariance-source-admission-v393.ts",
]);
run("v393-evidence-chain-reseal", node, [
  "scripts/reseal-shadow-evidence-chain-v393.mjs",
]);
const firstEvidenceSha256 = JSON.parse(
  readFileSync(
    resolve(root, "dist/science/orbit-atlas-shadow-v393-evidence.json"),
    "utf8",
  ),
).evidenceSha256;
run("v393-tests", node, [
  resolve(root, "node_modules/vitest/vitest.mjs"),
  "run",
  "app/lib/kerrCovarianceSourceDossierV393.test.ts",
  "app/lib/kerrCovarianceSourceDossierServerV393.test.ts",
  "app/api/atlas/relativity-evidence/v393/covariance-sources/route.test.ts",
  "app/components/KerrCorrelationPatchbayV393.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV393.test.ts",
]);
run("v393-types", node, [
  resolve(root, "node_modules/typescript/bin/tsc"),
  "--noEmit",
]);
run("v393-eslint", node, [
  resolve(root, "node_modules/eslint/bin/eslint.js"),
  "app/lib/kerrCovarianceSourceDossierV393.ts",
  "app/lib/kerrCovarianceSourceDossierV393.test.ts",
  "app/lib/kerrCovarianceSourceDossierServerV393.ts",
  "app/lib/kerrCovarianceSourceDossierServerV393.test.ts",
  "app/api/atlas/relativity-evidence/v393/covariance-sources/route.ts",
  "app/api/atlas/relativity-evidence/v393/covariance-sources/route.test.ts",
  "app/components/KerrCorrelationPatchbayV393.tsx",
  "app/components/KerrCorrelationPatchbayV393.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV393.ts",
  "app/lib/atlasShadowCapabilityPointerV393.test.ts",
  "scripts/build-kerr-covariance-source-admission-v393.ts",
  "scripts/build-shadow-candidate-v393.mjs",
  "scripts/reseal-shadow-evidence-chain-v393.mjs",
  "scripts/verify-shadow-v393-light.mjs",
]);
run("v393-evidence-determinism", node, [
  "scripts/build-shadow-candidate-v393.mjs",
]);

const artifact = JSON.parse(
  readFileSync(
    resolve(
      root,
      "dist/science/kerr-covariance-source-admission-v393/source-admission.json",
    ),
    "utf8",
  ),
);
const evidence = JSON.parse(
  readFileSync(
    resolve(root, "dist/science/orbit-atlas-shadow-v393-evidence.json"),
    "utf8",
  ),
);
const pointer = JSON.parse(
  readFileSync(
    resolve(
      root,
      "dist/release/orbit-atlas-current-local-shadow-candidate-v393.json",
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
  artifact.validator?.rejectedAdversarialFixtureCount !== 9 ||
  artifact.selfTest?.publishable !== false ||
  artifact.selfTest?.assembledRowCount !== 12 ||
  artifact.selfTest?.maximumPythonOracleRelativeDifference >= 2e-12 ||
  artifact.productionAdmission?.dossierAvailable !== false ||
  artifact.productionAdmission?.componentSourcesAvailable !== 0 ||
  artifact.productionAdmission?.crossSourcesAvailable !== 0 ||
  artifact.productionAdmission?.covariancePackBuilt !== false ||
  artifact.productionAdmission?.covarianceProjectionExecuted !== false ||
  artifact.productionAdmission?.unknownSystematicsTreatedAsZero !== false ||
  artifact.productionAdmission?.missingCorrelationTreatedAsIndependent !== false ||
  artifact.productionAdmission?.probabilityContentAssigned !== false ||
  artifact.qualification?.physicalSourceDossierQualified !== false ||
  artifact.qualification?.physicalCovarianceQualified !== false ||
  artifact.qualification?.absoluteScientificIntervalQualified !== false ||
  evidence.authorityBoundary?.sciencePayloadMutationAllowed !== false ||
  evidence.authorityBoundary?.cinematicConsumerAllowed !== false ||
  pointer.capabilities?.v393DossierValidator !==
    "qualified-9-of-9-adversarial-rejections" ||
  pointer.capabilities?.v393PhysicalSourceDossier !==
    "unavailable-0-of-3-components-0-of-3-cross-sources" ||
  pointer.capabilities?.v393ProductionPack !== "not-built" ||
  pointer.capabilities?.v393ProductionProjection !== "not-run" ||
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
  throw new Error("v393 fail-closed validation failed");
}
const transientPattern =
  /[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/;
if (
  transientPattern.test(JSON.stringify(evidence)) ||
  transientPattern.test(JSON.stringify(pointer))
) {
  throw new Error("v393 transient evidence leak");
}
for (const entry of evidence.sourceManifest ?? []) {
  const actual = createHash("sha256")
    .update(readFileSync(resolve(root, entry.path)))
    .digest("hex");
  if (actual !== entry.sha256) {
    throw new Error(`v393 source manifest mismatch: ${entry.path}`);
  }
}
console.log(
  JSON.stringify(
    {
      status: "passed-v393-low-memory",
      artifactSha256: artifact.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      acceptedControlFixtureCount:
        artifact.validator.acceptedControlFixtureCount,
      rejectedAdversarialFixtureCount:
        artifact.validator.rejectedAdversarialFixtureCount,
      maximumPythonOracleRelativeDifference:
        artifact.selfTest.maximumPythonOracleRelativeDifference,
      physicalDossierAvailable: false,
      componentSources: "0-of-3",
      crossSources: "0-of-3",
      productionPackBuilt: false,
      productionProjectionExecuted: false,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: evidence.browserQualification,
    },
    null,
    2,
  ),
);

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
const run = (label, command, args) => {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: false,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
};
run("v382r1-forensic", node, [
  resolve(root, "node_modules/tsx/dist/cli.mjs"),
  "scripts/build-measured-visible-source-forensic-v382r1.ts",
]);
run("v382r1-evidence", node, ["scripts/build-shadow-candidate-v382r1.mjs"]);
const firstEvidenceSha256 = JSON.parse(
  readFileSync(
    resolve(root, "dist/science/orbit-atlas-shadow-v382r1-evidence.json"),
    "utf8",
  ),
).evidenceSha256;
run("v382r1-tests", node, [
  resolve(root, "node_modules/vitest/vitest.mjs"),
  "run",
  "app/lib/measuredVisibleSourceDossierV382.test.ts",
  "app/lib/measuredVisibleSourceForensicV382R1.test.ts",
  "app/lib/measuredVisibleSourceForensicServerV382R1.test.ts",
  "app/api/atlas/relativity-evidence/v382/visible-source-forensic/route.test.ts",
  "app/components/MeasuredVisibleSourceForensicSurfaceV382R1.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV382R1.test.ts",
]);
run("v382r1-types", node, [
  resolve(root, "node_modules/typescript/bin/tsc"),
  "--noEmit",
]);
run("v382r1-evidence-determinism", node, [
  "scripts/build-shadow-candidate-v382r1.mjs",
]);

const forensic = JSON.parse(
  readFileSync(
    resolve(root, "dist/science/measured-visible-source-v382r1/forensic.json"),
    "utf8",
  ),
);
const evidence = JSON.parse(
  readFileSync(
    resolve(root, "dist/science/orbit-atlas-shadow-v382r1-evidence.json"),
    "utf8",
  ),
);
const pointer = JSON.parse(
  readFileSync(
    resolve(
      root,
      "dist/release/orbit-atlas-current-local-shadow-candidate-v382r1.json",
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
  forensic.progress?.qualifiedSourceCount !== 1 ||
  forensic.progress?.plannedSourceCount !== 7 ||
  forensic.progress?.sourceDossierAvailable !== false ||
  forensic.progress?.resumeRequiresExplicitAuthorization !== true ||
  forensic.attempt1?.historicalNegativeEvidencePreserved !== true ||
  forensic.correction?.networkAttemptedDuringCorrection !== false ||
  forensic.authorityGranted !== false ||
  evidence.boundary?.v375EnvelopeAvailable !== false ||
  evidence.boundary?.v376ScienceImageAvailable !== false ||
  evidence.boundary?.observedCountsAvailable !== false ||
  evidence.boundary?.runtimePackagingAllowed !== false ||
  pointer.capabilities?.v382r1SourceDossier !== "incomplete-1-of-7" ||
  pointer.localShadowDefaultApplied !== false ||
  forbidden.some((path) => existsSync(resolve(root, path))) ||
  state.status !== "incomplete-0-of-49" ||
  state.completedShardCount !== 0 ||
  state.attemptConsumed !== false ||
  state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  evidence.browserQualification !== "not-run"
) {
  throw new Error("v382r1 fail-closed validation failed");
}
console.log(
  JSON.stringify(
    {
      status: "passed-v382r1-low-memory",
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      recoveredSource: "1/7",
      profileRows: forensic.recoveredSource.profile.rowCount,
      visibleCoverage400To700Nm:
        forensic.recoveredSource.profile.visibleCoverage400To700Nm,
      attempt1: forensic.attempt1.status,
      automaticRetryApplied: false,
      measuredAuthority: false,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: evidence.browserQualification,
    },
    null,
    2,
  ),
);

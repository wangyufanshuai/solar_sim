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
run("v381-audit", node, [
  resolve(root, "node_modules/tsx/dist/cli.mjs"),
  "scripts/build-measured-authority-identity-v381.ts",
]);
run("v381-evidence", node, ["scripts/build-shadow-candidate-v381.mjs"]);
const firstEvidenceSha256 = JSON.parse(
  readFileSync(
    resolve(root, "dist/science/orbit-atlas-shadow-v381-evidence.json"),
    "utf8",
  ),
).evidenceSha256;
run("v381-tests", node, [
  resolve(root, "node_modules/vitest/vitest.mjs"),
  "run",
  "app/lib/measuredAuthorityBandIdentityV381.test.ts",
  "app/lib/measuredAuthorityIdentityAuditV381.test.ts",
  "app/lib/measuredAuthorityIdentityServerV381.test.ts",
  "app/api/atlas/relativity-evidence/v381/measured-authority-identity/route.test.ts",
  "app/components/MeasuredAuthorityIdentitySurfaceV381.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV381.test.ts",
]);
run("v381-types", node, [
  resolve(root, "node_modules/typescript/bin/tsc"),
  "--noEmit",
]);
run("v381-evidence-determinism", node, [
  "scripts/build-shadow-candidate-v381.mjs",
]);

const audit = JSON.parse(
  readFileSync(
    resolve(root, "dist/science/measured-authority-identity-v381/audit.json"),
    "utf8",
  ),
);
const evidence = JSON.parse(
  readFileSync(
    resolve(root, "dist/science/orbit-atlas-shadow-v381-evidence.json"),
    "utf8",
  ),
);
const pointer = JSON.parse(
  readFileSync(
    resolve(
      root,
      "dist/release/orbit-atlas-current-local-shadow-candidate-v381.json",
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
  "dist/science/measured-expectation-v375/envelope.json",
  "dist/science/expected-electron-image-v376/image.json",
  "dist/science/expected-electron-image-v376/image.csv",
];
if (
  evidence.evidenceSha256 !== firstEvidenceSha256 ||
  audit.correctedModel?.bandLaneCount !== 3 ||
  audit.correctedModel?.qualifiedBandLaneCount !== 0 ||
  audit.correctedModel?.crossBandInstrumentIdentityRequired !== false ||
  audit.authorityPromotionAllowed !== false ||
  evidence.boundary?.authorityGranted !== false ||
  evidence.boundary?.v375EnvelopeAvailable !== false ||
  evidence.boundary?.v376ScienceImageAvailable !== false ||
  evidence.boundary?.observedCountsAvailable !== false ||
  pointer.capabilities?.v381PerBandIdentityModel !==
    "qualified-three-lanes-independent-instrument-identities" ||
  pointer.localShadowDefaultApplied !== false ||
  forbidden.some((path) => existsSync(resolve(root, path))) ||
  state.status !== "incomplete-0-of-49" ||
  state.completedShardCount !== 0 ||
  state.attemptConsumed !== false ||
  state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  evidence.browserQualification !== "not-run"
) {
  throw new Error("v381 fail-closed validation failed");
}
console.log(
  JSON.stringify(
    {
      status: "passed-v381-low-memory",
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      historicalStructuralReadiness: "7/7",
      legacyScientificFusion:
        pointer.capabilities.v381LegacyScientificFusion,
      correctedBandLanes: "0/3 measured, 3/3 identity contracts",
      measuredPromotion: false,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: evidence.browserQualification,
    },
    null,
    2,
  ),
);

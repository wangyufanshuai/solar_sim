import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
function run(label, command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
}

run("v329-vitest", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run",
  "app/lib/kerrScienceObservatoryStoreV329.test.ts",
  "app/components/KerrScienceBandUncertaintyV325.test.ts",
  "app/components/KerrScienceCinematicABV327.test.ts",
  "app/components/KerrSciencePhotonBandsV328.test.ts",
  "app/lib/atlasShadowCapabilityPointerV329.test.ts",
]);
run("v329-types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v329-eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), "--max-warnings=0",
  "scripts/build-shadow-candidate-v329.mjs",
  "scripts/verify-shadow-v329-light.mjs",
  "scripts/atlas.mjs",
  "app/lib/kerrScienceObservatoryStoreV329.ts",
  "app/lib/kerrScienceObservatoryStoreV329.test.ts",
  "app/components/KerrScienceBandUncertaintyV325.tsx",
  "app/components/KerrScienceBandUncertaintyV325.test.ts",
  "app/components/KerrScienceCinematicABV327.tsx",
  "app/components/KerrScienceCinematicABV327.test.ts",
  "app/components/KerrSciencePhotonBandsV328.tsx",
  "app/components/KerrSciencePhotonBandsV328.test.ts",
  "app/lib/atlasShadowCapabilityPointerV329.ts",
  "app/lib/atlasShadowCapabilityPointerV329.test.ts",
]);

const evidence = JSON.parse(readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v329-evidence.json"), "utf8"));
const pointer = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v329.json"), "utf8"));
const state = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-campaign-v314/campaign-state.json"), "utf8"));
if (evidence.runtime?.consumerCountFixture !== 3 || evidence.runtime?.v321AcquisitionCountFixture !== 1 || evidence.runtime?.derivationCountFixture !== 1
  || evidence.runtime?.directConsumerFetches !== 0 || evidence.runtime?.idempotentRelease !== true || evidence.runtime?.resourceBaselineReturnTested !== true
  || evidence.runtime?.browserQualification !== "not-run"
  || pointer.capabilities?.v329SingleFlight !== "three-consumers-one-v321-acquisition-one-derivation"
  || pointer.formalProductPointer !== "v263" || pointer.localShadowDefaultApplied !== false
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false) throw new Error("v329 fail-closed validation failed");
console.log(JSON.stringify({ status: "passed-v329-low-memory", evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, consumers: evidence.runtime.consumerCountFixture, acquisitions: evidence.runtime.v321AcquisitionCountFixture, derivations: evidence.runtime.derivationCountFixture, dense: pointer.capabilities.v314CorrectedDense }, null, 2));

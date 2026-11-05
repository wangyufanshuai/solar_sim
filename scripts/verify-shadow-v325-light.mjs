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

run("v325-vitest", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run",
  "app/lib/kerrScienceBandUncertaintyV325.test.ts",
  "app/lib/kerrScienceBandUncertaintyV325.generated.test.ts",
  "app/components/KerrScienceBandUncertaintyV325.test.ts",
  "app/components/KerrScienceBandHudV322.test.ts",
  "app/lib/atlasShadowCapabilityPointerV325.test.ts",
]);
run("v325-types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v325-eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), "--max-warnings=0",
  "scripts/build-kerr-science-band-uncertainty-v325.ts",
  "scripts/build-shadow-candidate-v325.mjs",
  "scripts/verify-shadow-v325-light.mjs",
  "scripts/atlas.mjs",
  "app/lib/kerrScienceBandUncertaintyV325.ts",
  "app/lib/kerrScienceBandUncertaintyV325.test.ts",
  "app/lib/kerrScienceBandUncertaintyV325.generated.test.ts",
  "app/components/KerrScienceBandUncertaintyV325.tsx",
  "app/components/KerrScienceBandUncertaintyV325.test.ts",
  "app/components/KerrScienceBandHudV322.tsx",
  "app/components/KerrScienceBandHudV322.test.ts",
  "app/lib/atlasShadowCapabilityPointerV325.ts",
  "app/lib/atlasShadowCapabilityPointerV325.test.ts",
]);

const evidence = JSON.parse(readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v325-evidence.json"), "utf8"));
const pointer = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v325.json"), "utf8"));
const state = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-campaign-v314/campaign-state.json"), "utf8"));
if (evidence.science?.applicableDiskRayCount !== 4 || evidence.science?.bandMeasurementCount !== 12
  || evidence.science?.maxima?.conservativeLinearRelativeEnvelope >= 5e-6
  || evidence.science?.combinationPolicy !== "linear-sum-without-independence-claim-no-rss"
  || evidence.science?.denseAggregateAccepted !== false
  || evidence.runtime?.scienceIntentOnly !== true || evidence.runtime?.cinematicHidden !== true
  || evidence.runtime?.largeRayArraysInReactState !== false || evidence.runtime?.browserQualification !== "not-run"
  || pointer.capabilities?.v325ScienceUncertainty !== "four-rays-twelve-bands-linear-sum-no-rss"
  || pointer.formalProductPointer !== "v263" || pointer.localShadowDefaultApplied !== false
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false) throw new Error("v325 fail-closed validation failed");
console.log(JSON.stringify({ status: "passed-v325-low-memory", evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, bandMeasurementCount: evidence.science.bandMeasurementCount, maximumRelativeEnvelope: evidence.science.maxima.conservativeLinearRelativeEnvelope, dense: pointer.capabilities.v314CorrectedDense }, null, 2));

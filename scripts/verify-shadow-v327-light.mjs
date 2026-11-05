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

run("v327-vitest", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run",
  "app/lib/kerrScienceCinematicABV327.test.ts",
  "app/lib/kerrScienceCinematicABV327.generated.test.ts",
  "app/components/KerrScienceCinematicABV327.test.ts",
  "app/components/KerrScienceBandHudV322.test.ts",
  "app/lib/atlasShadowCapabilityPointerV327.test.ts",
]);
run("v327-types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v327-eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), "--max-warnings=0",
  "scripts/build-kerr-science-cinematic-ab-v327.ts",
  "scripts/build-shadow-candidate-v327.mjs",
  "scripts/verify-shadow-v327-light.mjs",
  "scripts/atlas.mjs",
  "app/lib/kerrScienceCinematicABV327.ts",
  "app/lib/kerrScienceCinematicABV327.test.ts",
  "app/lib/kerrScienceCinematicABV327.generated.test.ts",
  "app/components/KerrScienceCinematicABV327.tsx",
  "app/components/KerrScienceCinematicABV327.test.ts",
  "app/components/KerrScienceBandHudV322.tsx",
  "app/components/KerrScienceBandHudV322.test.ts",
  "app/lib/atlasShadowCapabilityPointerV327.ts",
  "app/lib/atlasShadowCapabilityPointerV327.test.ts",
]);

const evidence = JSON.parse(readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v327-evidence.json"), "utf8"));
const pointer = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v327.json"), "utf8"));
const state = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-campaign-v314/campaign-state.json"), "utf8"));
if (evidence.visual?.swatchCount !== 4 || evidence.visual?.profileOutputsDistinct !== true
  || evidence.science?.valuesUnchanged !== true || evidence.science?.buffersDisjoint !== true || evidence.science?.cinematicBuffersDisjoint !== true
  || evidence.science?.denseAggregateAccepted !== false
  || evidence.runtime?.hudWired !== true || evidence.runtime?.scienceIntentOnly !== true || evidence.runtime?.extraCanvasCreated !== false
  || evidence.runtime?.browserQualification !== "not-run"
  || pointer.capabilities?.v327ScienceCinematicAB !== "four-ray-science-v5-v6-deterministic-swatches"
  || pointer.formalProductPointer !== "v263" || pointer.localShadowDefaultApplied !== false
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false) throw new Error("v327 fail-closed validation failed");
console.log(JSON.stringify({ status: "passed-v327-low-memory", evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, swatches: evidence.visual.swatchCount, profileOutputsDistinct: evidence.visual.profileOutputsDistinct, dense: pointer.capabilities.v314CorrectedDense }, null, 2));

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
const run = (label, command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
};
run("v362-visual-replay", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-visual-runtime-v362.ts"]);
run("v362-evidence", node, ["scripts/build-shadow-candidate-v362.mjs"]);
run("v362-tests", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run",
  "app/lib/atlasVisualProfileV299.test.ts", "app/lib/atlasVisualAssetsV289.test.ts", "app/lib/atlasVisualRuntimeMatrixV362.test.ts",
  "app/lib/kerrScienceCinematicV9V362.test.ts", "app/lib/kerrInstrumentLabV362.test.ts", "app/components/KerrInstrumentLabSurfaceV362.test.tsx",
  "app/api/atlas/relativity-evidence/v362/instrument-lab/route.test.ts", "app/lib/atlasShadowCapabilityPointerV362.test.ts",
]);
run("v362-types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
const evidence = JSON.parse(readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v362-evidence.json"), "utf8"));
const pointer = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v362.json"), "utf8"));
const state = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-campaign-v314/campaign-state.json"), "utf8"));
const formal = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-product-evidence-v263.json"), "utf8"));
if (evidence.visual?.runtimeMatrixRows !== 40 || evidence.visual?.sciencePayloadByteIdentical !== true
  || evidence.instrumentLab?.syntheticQualifiedCount !== 5 || evidence.instrumentLab?.measuredQualifiedCount !== 0
  || evidence.instrumentLab?.scienceBufferMutationAllowed !== false || evidence.instrumentLab?.cinematicColorInputAllowed !== false
  || pointer.capabilities?.v361Calibration !== "blocked-measured-calibration-input-unavailable"
  || pointer.capabilities?.v362VisualProfile !== "science-cinematic-v9-instrument-lab-shadow"
  || pointer.capabilities?.v314CorrectedDense !== "incomplete-0-of-49" || pointer.localShadowDefaultApplied !== false
  || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer") throw new Error("v362 fail-closed validation failed");
console.log(JSON.stringify({ status: "passed-v362-low-memory", evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, matrixRows: evidence.visual.runtimeMatrixRows, profiles: evidence.visual.profiles, instrument: pointer.capabilities.v362InstrumentLab, calibration: pointer.capabilities.v361Calibration, dense: pointer.capabilities.v314CorrectedDense, browser: evidence.browserQualification }, null, 2));

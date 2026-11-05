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
run("v334-vitest", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run", "app/lib/atlasVisualRuntimeMatrixV334.test.ts", "app/lib/atlasShadowCapabilityPointerV334.test.ts"]);
run("v334-types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v334-eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), "--max-warnings=0", "scripts/build-visual-runtime-matrix-v334.mjs", "scripts/build-shadow-candidate-v334.mjs", "scripts/verify-shadow-v334-light.mjs", "scripts/atlas.mjs", "app/lib/atlasVisualRuntimeMatrixV334.ts", "app/lib/atlasVisualRuntimeMatrixV334.test.ts", "app/lib/atlasShadowCapabilityPointerV334.ts", "app/lib/atlasShadowCapabilityPointerV334.test.ts"]);

const read = (relative) => JSON.parse(readFileSync(resolve(root, relative), "utf8"));
const evidence = read("dist/science/orbit-atlas-shadow-v334-evidence.json");
const pointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v334.json");
const audit = read("dist/science/atlas-visual-runtime-matrix-v334/matrix-audit.json");
const state = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
if (audit.rows?.length !== 16 || audit.groups?.length !== 8 || Object.values(audit.checks ?? {}).some((value) => value !== true)
  || evidence.runtimeMatrix?.rowCount !== 16 || evidence.runtimeMatrix?.allGroupsCovered !== true || evidence.runtimeMatrix?.allRuntimeHooksPresent !== true || evidence.runtimeMatrix?.allTokenReadsPresent !== true
  || evidence.runtimeMatrix?.scienceFieldsEquivalent !== true || evidence.runtimeMatrix?.cinematicFieldsDistinct !== true || evidence.runtimeMatrix?.resolverReferenceStable !== true
  || pointer.capabilities?.v334RuntimeMatrix !== "v5-v6-eight-groups-sixteen-consumption-rows" || pointer.capabilities?.v334ScienceEquivalence !== "fields-equivalent-linear-no-grade-no-science-mutation"
  || pointer.formalProductPointer !== "v263" || pointer.localShadowDefaultApplied !== false || formal.version !== "v263-current-product-evidence-pointer"
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false) throw new Error("v334 fail-closed validation failed");
console.log(JSON.stringify({ status: "passed-v334-low-memory", evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, rows: evidence.runtimeMatrix.rowCount, groups: evidence.runtimeMatrix.groups, dense: pointer.capabilities.v314CorrectedDense }, null, 2));

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

run("v326-vitest", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run",
  "app/lib/kerrScienceBandUncertaintyProvenanceV326.test.ts",
  "app/lib/kerrScienceBandUncertaintyProvenanceV326.generated.test.ts",
  "app/components/KerrScienceBandUncertaintyV325.test.ts",
  "app/lib/atlasShadowCapabilityPointerV326.test.ts",
]);
run("v326-types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v326-eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), "--max-warnings=0",
  "scripts/build-kerr-science-uncertainty-provenance-v326.ts",
  "scripts/build-shadow-candidate-v326.mjs",
  "scripts/verify-shadow-v326-light.mjs",
  "scripts/atlas.mjs",
  "app/lib/kerrScienceBandUncertaintyProvenanceV326.ts",
  "app/lib/kerrScienceBandUncertaintyProvenanceV326.test.ts",
  "app/lib/kerrScienceBandUncertaintyProvenanceV326.generated.test.ts",
  "app/components/KerrScienceBandUncertaintyV325.tsx",
  "app/components/KerrScienceBandUncertaintyV325.test.ts",
  "app/lib/atlasShadowCapabilityPointerV326.ts",
  "app/lib/atlasShadowCapabilityPointerV326.test.ts",
]);

const evidence = JSON.parse(readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v326-evidence.json"), "utf8"));
const pointer = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v326.json"), "utf8"));
const state = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-campaign-v314/campaign-state.json"), "utf8"));
if (evidence.provenance?.jsonExport !== true || evidence.provenance?.csvExport !== true
  || evidence.provenance?.rayCount !== 4 || evidence.provenance?.bandMeasurementCount !== 12
  || evidence.provenance?.noRawRayBuffer !== true || evidence.provenance?.noScreenshot !== true
  || evidence.runtime?.objectUrlTracked !== true || evidence.runtime?.idempotentObjectUrlRelease !== true
  || evidence.runtime?.scienceIntentOnly !== true || evidence.runtime?.cinematicHidden !== true
  || evidence.runtime?.browserQualification !== "not-run"
  || pointer.capabilities?.v326UncertaintyProvenance !== "json-csv-sanitized-twelve-derived-rows"
  || pointer.formalProductPointer !== "v263" || pointer.localShadowDefaultApplied !== false
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false) throw new Error("v326 fail-closed validation failed");
console.log(JSON.stringify({ status: "passed-v326-low-memory", evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, rows: evidence.provenance.bandMeasurementCount, provenanceSha256: evidence.dependency.provenanceCanonicalSha256, dense: pointer.capabilities.v314CorrectedDense }, null, 2));

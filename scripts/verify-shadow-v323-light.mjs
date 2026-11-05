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

run("v323-vitest", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run",
  "app/lib/kerrScienceBandProvenanceV323.test.ts",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts",
  "app/components/KerrScienceBandHudV322.test.ts",
  "app/lib/atlasShadowCapabilityPointerV323.test.ts",
]);
run("v323-types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v323-eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), "--max-warnings=0",
  "scripts/build-shadow-candidate-v323.mjs",
  "scripts/verify-shadow-v323-light.mjs",
  "scripts/atlas.mjs",
  "app/lib/kerrScienceBandProvenanceV323.ts",
  "app/lib/kerrScienceBandProvenanceV323.test.ts",
  "app/components/KerrScienceBandHudV322.tsx",
  "app/components/KerrScienceBandHudV322.test.ts",
  "app/components/KerrBlackHolePanel.tsx",
  "app/lib/relativityWorkbenchEvidenceV285.ts",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts",
  "app/lib/atlasShadowCapabilityPointerV323.ts",
  "app/lib/atlasShadowCapabilityPointerV323.test.ts",
]);

const evidence = JSON.parse(readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v323-evidence.json"), "utf8"));
const pointer = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v323.json"), "utf8"));
const state = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-campaign-v314/campaign-state.json"), "utf8"));
if (evidence.runtime?.profileTokenSources?.join(",") !== "v5,v6"
  || evidence.runtime?.jsonExport !== true || evidence.runtime?.csvExport !== true
  || evidence.runtime?.noRayBuffer !== true || evidence.runtime?.noScreenshot !== true
  || evidence.runtime?.objectUrlTracked !== true || evidence.runtime?.idempotentObjectUrlRelease !== true
  || evidence.runtime?.browserQualification !== "not-run"
  || pointer.capabilities?.v323ProvenanceExport !== "json-csv-read-only-no-ray-buffer"
  || pointer.capabilities?.v323ObjectUrlLifecycle !== "tracked-idempotent"
  || pointer.formalProductPointer !== "v263" || pointer.localShadowDefaultApplied !== false
  || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false) throw new Error("v323 fail-closed validation failed");
console.log(JSON.stringify({ status: "passed-v323-low-memory", evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, profileTokenSources: evidence.runtime.profileTokenSources, jsonExport: evidence.runtime.jsonExport, csvExport: evidence.runtime.csvExport, dense: pointer.capabilities.v314CorrectedDense }, null, 2));

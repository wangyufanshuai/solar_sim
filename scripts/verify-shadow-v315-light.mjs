import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const python = process.platform === "win32"
  ? resolve(root, ".venv-science/Scripts/python.exe")
  : resolve(root, ".venv-science/bin/python");
const node = process.execPath;

function run(label, command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
}

run("v315-python-v314-structure", python, ["scripts/test-kerr-dense-campaign-v314.py"]);
run("v315-vitest", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run",
  "app/lib/kerrSciencePayloadV315.test.ts",
  "app/lib/kerrSciencePayloadClientV299.test.ts",
  "app/lib/strongGravityRenderingV299.test.ts",
  "app/lib/kerrScienceRasterV307.test.ts",
  "app/lib/kerrScienceObservablesV306.test.ts",
  "app/lib/atlasBrowserObservabilityV294.test.ts",
  "app/lib/atlasStrongGravityBrowserGateV310.test.ts",
  "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.test.ts",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts",
  "app/components/RelativityResearchWorkbenchV315.test.ts",
  "app/lib/kerrCampaignV314.test.ts",
  "app/lib/atlasShadowCapabilityPointerV315.test.ts",
]);
run("v315-types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v315-eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), "--max-warnings=0",
  "scripts/build-shadow-candidate-v315.mjs",
  "scripts/verify-shadow-v315-light.mjs",
  "app/lib/kerrCampaignV314.ts",
  "app/lib/kerrSciencePayloadV315.ts",
  "app/lib/kerrSciencePayloadV315.test.ts",
  "app/lib/strongGravityRenderingV299.ts",
  "app/lib/kerrSciencePayloadClientV299.ts",
  "app/lib/kerrSciencePayloadClientV299.test.ts",
  "app/lib/kerrScienceRasterV307.ts",
  "app/lib/kerrScienceRasterV307.test.ts",
  "app/lib/kerrScienceObservablesV306.ts",
  "app/lib/kerrScienceObservablesV306.test.ts",
  "app/lib/atlasBrowserObservabilityV294.ts",
  "app/lib/atlasBrowserObservabilityV294.test.ts",
  "app/lib/atlasStrongGravityBrowserGateV310.ts",
  "app/lib/atlasStrongGravityBrowserGateV310.test.ts",
  "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.ts",
  "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.test.ts",
  "app/lib/relativityWorkbenchEvidenceV285.ts",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/components/RelativityResearchWorkbenchV315.test.ts",
  "app/components/KerrScienceObservablesWorkbenchV306.tsx",
  "app/lib/atlasShadowCapabilityPointerV315.ts",
  "app/lib/atlasShadowCapabilityPointerV315.test.ts",
]);

const evidence = JSON.parse(readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v315-evidence.json"), "utf8"));
const pointer = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v315.json"), "utf8"));
const state = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-campaign-v314/campaign-state.json"), "utf8"));
if (evidence.status !== "science-runtime-upgraded-corrected-dense-incomplete-0-of-49"
  || evidence.runtime?.scienceAuthority !== "v312-v313-short-gate-sparse"
  || evidence.runtime?.denseAggregateSha256 !== null || evidence.runtime?.denseAuthorityAccepted !== false
  || pointer.formalProductPointer !== "v263" || pointer.localShadowDefaultApplied !== false
  || pointer.capabilities?.v315ScienceRuntime !== "implemented-v312-v313-sparse-authority"
  || pointer.capabilities?.browserQualification !== "not-run"
  || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false) {
  throw new Error("v315 fail-closed validation failed");
}
console.log(JSON.stringify({ status: "passed-v315-low-memory", evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, scienceAuthority: evidence.runtime.scienceAuthority, correctedDense: pointer.capabilities.v314CorrectedDense }, null, 2));

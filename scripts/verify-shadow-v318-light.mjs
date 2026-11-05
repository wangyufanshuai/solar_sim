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

run("v318-vitest", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run",
  "app/lib/kerrGpuDifferentialV318.test.ts",
  "app/lib/kerrInteractiveAuthorityV317.test.ts",
  "app/lib/atlasStrongGravityBrowserGateV318.test.ts",
  "app/workers/kerrGpuDifferentialProbeV318.worker.ts",
  "app/lib/kerrScienceBufferIntegrityV317.test.ts",
  "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.test.ts",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts",
  "app/lib/atlasShadowCapabilityPointerV318.test.ts",
]);
run("v318-types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v318-eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), "--max-warnings=0",
  "scripts/build-shadow-candidate-v318.mjs",
  "scripts/verify-shadow-v318-light.mjs",
  "app/lib/kerrGpuDifferentialV318.ts",
  "app/lib/kerrGpuDifferentialV318.test.ts",
  "app/lib/atlasStrongGravityBrowserGateV318.ts",
  "app/lib/atlasStrongGravityBrowserGateV318.test.ts",
  "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.ts",
  "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.test.ts",
  "tests/atlas-browser/atlas-v300-resource-lifecycle.spec.ts",
  "app/lib/relativityWorkbenchEvidenceV285.ts",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts",
  "app/lib/atlasShadowCapabilityPointerV318.ts",
  "app/lib/atlasShadowCapabilityPointerV318.test.ts",
]);

const evidence = JSON.parse(readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v318-evidence.json"), "utf8"));
const pointer = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v318.json"), "utf8"));
const state = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-campaign-v314/campaign-state.json"), "utf8"));
if (evidence.differential?.sampleCount !== 16 || evidence.differential?.criticalBracketCount !== 40
  || evidence.differential?.hardwareResult !== "pending"
  || evidence.differential?.gpuScientificAuthority !== false
  || pointer.capabilities?.v318GpuDifferentialHardware !== "pending-webgpu-shadow-disabled"
  || pointer.formalProductPointer !== "v263" || pointer.localShadowDefaultApplied !== false
  || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false) {
  throw new Error("v318 fail-closed validation failed");
}
console.log(JSON.stringify({ status: "passed-v318-low-memory", evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, samples: evidence.differential.sampleCount, brackets: evidence.differential.criticalBracketCount, hardware: evidence.differential.hardwareResult, correctedDense: pointer.capabilities.v314CorrectedDense }, null, 2));

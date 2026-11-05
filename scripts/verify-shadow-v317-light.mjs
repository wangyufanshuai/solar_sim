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

run("v317-vitest", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run",
  "app/lib/kerrScienceBufferIntegrityV317.test.ts",
  "app/lib/kerrInteractiveAuthorityV317.test.ts",
  "app/lib/kerrTextureLifecycleV317.test.ts",
  "app/lib/kerrScienceRasterV307.test.ts",
  "app/lib/kerrSciencePayloadClientV299.test.ts",
  "app/lib/kerrInteractiveComputeV299.test.ts",
  "app/lib/atlasResourceScopeV308.test.ts",
  "app/lib/atlasStrongGravityTelemetryV309.test.ts",
  "app/lib/atlasBrowserObservabilityV294.test.ts",
  "app/lib/kerrStrongGravityVisualV305.test.ts",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts",
  "app/lib/atlasShadowCapabilityPointerV317.test.ts",
]);
run("v317-types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v317-eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), "--max-warnings=0",
  "scripts/build-shadow-candidate-v317.mjs",
  "scripts/verify-shadow-v317-light.mjs",
  "app/lib/kerrScienceBufferIntegrityV317.ts",
  "app/lib/kerrScienceBufferIntegrityV317.test.ts",
  "app/lib/kerrInteractiveAuthorityV317.ts",
  "app/lib/kerrInteractiveAuthorityV317.test.ts",
  "app/lib/kerrTextureLifecycleV317.ts",
  "app/lib/kerrTextureLifecycleV317.test.ts",
  "app/lib/kerrStrongGravityVisualV305.ts",
  "app/workers/kerrInteractiveCompute.worker.ts",
  "app/components/KerrStrongGravityRendererV299.tsx",
  "app/lib/atlasStrongGravityTelemetryV309.ts",
  "app/lib/atlasStrongGravityTelemetryV309.test.ts",
  "app/lib/atlasBrowserObservabilityV294.ts",
  "app/lib/atlasBrowserObservabilityV294.test.ts",
  "app/lib/relativityWorkbenchEvidenceV285.ts",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts",
  "app/lib/atlasShadowCapabilityPointerV317.ts",
  "app/lib/atlasShadowCapabilityPointerV317.test.ts",
]);

const evidence = JSON.parse(readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v317-evidence.json"), "utf8"));
const pointer = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v317.json"), "utf8"));
const state = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-campaign-v314/campaign-state.json"), "utf8"));
if (evidence.integrity?.scientificTypedArrayCount !== 67
  || evidence.integrity?.beforeAfterRasterDigestRequired !== true
  || evidence.interactive?.authoritySha256 !== "99e591c0a8fd1f342ef622239301d04cf9f5cd33cbe1c45f1159e0804f2e81a6"
  || evidence.interactive?.webGpuDifferential !== "pending"
  || pointer.capabilities?.v317ScienceBufferIntegrity !== "qualified-67-of-67-byte-digested-raster-disjoint"
  || pointer.formalProductPointer !== "v263" || pointer.localShadowDefaultApplied !== false
  || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false) {
  throw new Error("v317 fail-closed validation failed");
}
console.log(JSON.stringify({ status: "passed-v317-low-memory", evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, scienceArrays: evidence.integrity.scientificTypedArrayCount, correctedDense: pointer.capabilities.v314CorrectedDense }, null, 2));

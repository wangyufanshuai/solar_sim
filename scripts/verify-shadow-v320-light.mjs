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

run("v320-vitest", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run",
  "app/lib/kerrThinDiskBandImagingV320.test.ts",
  "app/lib/kerrThinDiskBandImagingV320.generated.test.ts",
  "app/components/KerrThinDiskBandWorkbenchV320.test.ts",
  "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.test.ts",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts",
  "app/lib/atlasShadowCapabilityPointerV320.test.ts",
]);
run("v320-types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v320-eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), "--max-warnings=0",
  "scripts/build-kerr-thin-disk-bands-v320.ts",
  "scripts/build-shadow-candidate-v320.mjs",
  "scripts/verify-shadow-v320-light.mjs",
  "app/lib/kerrThinDiskBandImagingV320.ts",
  "app/lib/kerrThinDiskBandImagingV320.test.ts",
  "app/lib/kerrThinDiskBandImagingV320.generated.test.ts",
  "app/components/KerrThinDiskBandWorkbenchV320.tsx",
  "app/components/KerrThinDiskBandWorkbenchV320.test.ts",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.ts",
  "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.test.ts",
  "app/lib/relativityWorkbenchEvidenceV285.ts",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts",
  "app/lib/atlasShadowCapabilityPointerV320.ts",
  "app/lib/atlasShadowCapabilityPointerV320.test.ts",
]);

const evidence = JSON.parse(readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v320-evidence.json"), "utf8"));
const pointer = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v320.json"), "utf8"));
const state = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-campaign-v314/campaign-state.json"), "utf8"));
if (evidence.science?.applicableDiskRayCount !== 4 || evidence.science?.bandCount !== 3
  || evidence.science?.denseAggregateAccepted !== false
  || evidence.science?.maxima?.bandQuadratureRelativeDifference >= 2e-6
  || evidence.science?.maxima?.coveredBolometricFraction > 1.000001
  || evidence.science?.normalizationPolicy !== "fixed-physical-reference-no-data-adaptive-rescale"
  || pointer.capabilities?.v320FixedBandImaging !== "qualified-three-fixed-disjoint-bands-four-rays"
  || pointer.capabilities?.v320FalseColor !== "fixed-reference-linear-nonadaptive"
  || pointer.capabilities?.v318GpuDifferentialHardware !== "pending-webgpu-shadow-disabled"
  || pointer.formalProductPointer !== "v263" || pointer.localShadowDefaultApplied !== false
  || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false) {
  throw new Error("v320 fail-closed validation failed");
}
console.log(JSON.stringify({
  status: "passed-v320-low-memory",
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  bandArtifactSha256: evidence.artifact.canonicalSha256,
  maxima: evidence.science.maxima,
  correctedDense: pointer.capabilities.v314CorrectedDense,
}, null, 2));

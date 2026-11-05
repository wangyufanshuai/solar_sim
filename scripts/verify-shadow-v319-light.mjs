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

run("v319-vitest", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run",
  "app/lib/kerrThinDiskSpectralV319.test.ts",
  "app/lib/kerrThinDiskSpectralV319.generated.test.ts",
  "app/components/KerrThinDiskSpectrumWorkbenchV319.test.ts",
  "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.test.ts",
  "app/lib/kerrScienceBufferIntegrityV317.test.ts",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts",
  "app/lib/atlasShadowCapabilityPointerV319.test.ts",
]);
run("v319-types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v319-eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), "--max-warnings=0",
  "scripts/build-kerr-thin-disk-spectrum-v319.ts",
  "scripts/build-shadow-candidate-v319.mjs",
  "scripts/verify-shadow-v319-light.mjs",
  "app/lib/kerrThinDiskSpectralV319.ts",
  "app/lib/kerrThinDiskSpectralV319.test.ts",
  "app/lib/kerrThinDiskSpectralV319.generated.test.ts",
  "app/components/KerrThinDiskSpectrumWorkbenchV319.tsx",
  "app/components/KerrThinDiskSpectrumWorkbenchV319.test.ts",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.ts",
  "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.test.ts",
  "app/lib/relativityWorkbenchEvidenceV285.ts",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts",
  "app/lib/atlasShadowCapabilityPointerV319.ts",
  "app/lib/atlasShadowCapabilityPointerV319.test.ts",
]);

const evidence = JSON.parse(readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v319-evidence.json"), "utf8"));
const pointer = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v319.json"), "utf8"));
const state = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-campaign-v314/campaign-state.json"), "utf8"));
if (evidence.science?.applicableDiskRayCount !== 4 || evidence.science?.denseAggregateAccepted !== false
  || evidence.science?.maxima?.liouvilleInvariantRelativeResidual >= 1e-12
  || evidence.science?.maxima?.diskQuadratureRelative >= 5e-4
  || evidence.science?.maxima?.formulaSpectralRelative >= 0.02
  || pointer.capabilities?.v319ThinDiskSpectrum !== "qualified-four-authority-disk-rays-si-liouville"
  || pointer.capabilities?.v318GpuDifferentialHardware !== "pending-webgpu-shadow-disabled"
  || pointer.formalProductPointer !== "v263" || pointer.localShadowDefaultApplied !== false
  || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false) {
  throw new Error("v319 fail-closed validation failed");
}
console.log(JSON.stringify({ status: "passed-v319-low-memory", evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, spectrumArtifactSha256: evidence.artifact.canonicalSha256, maxima: evidence.science.maxima, correctedDense: pointer.capabilities.v314CorrectedDense }, null, 2));

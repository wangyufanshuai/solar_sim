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

run("v321-vitest", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run",
  "app/lib/kerrScienceBandRasterV321.test.ts",
  "app/lib/kerrScienceBandRasterV321.generated.test.ts",
  "app/lib/kerrThinDiskBandClientV321.test.ts",
  "app/lib/atlasStrongGravityTelemetryV309.test.ts",
  "app/lib/atlasBrowserObservabilityV294.test.ts",
  "app/lib/atlasStrongGravityBrowserGateV321.test.ts",
  "app/lib/kerrScienceRasterV307.test.ts",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts",
  "app/lib/atlasShadowCapabilityPointerV321.test.ts",
]);
run("v321-types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v321-eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), "--max-warnings=0",
  "scripts/build-kerr-science-band-raster-v321.ts",
  "scripts/build-shadow-candidate-v321.mjs",
  "scripts/verify-shadow-v321-light.mjs",
  "scripts/atlas.mjs",
  "app/lib/kerrScienceBandRasterV321.ts",
  "app/lib/kerrScienceBandRasterV321.test.ts",
  "app/lib/kerrScienceBandRasterV321.generated.test.ts",
  "app/lib/kerrThinDiskBandClientV321.ts",
  "app/lib/kerrThinDiskBandClientV321.test.ts",
  "app/components/KerrStrongGravityRendererV299.tsx",
  "app/lib/atlasStrongGravityTelemetryV309.ts",
  "app/lib/atlasStrongGravityTelemetryV309.test.ts",
  "app/lib/atlasBrowserObservabilityV294.ts",
  "app/lib/atlasBrowserObservabilityV294.test.ts",
  "app/lib/atlasStrongGravityBrowserGateV310.ts",
  "app/lib/atlasStrongGravityBrowserGateV321.ts",
  "app/lib/atlasStrongGravityBrowserGateV321.test.ts",
  "tests/atlas-browser/atlas-v300-resource-lifecycle.spec.ts",
  "app/lib/relativityWorkbenchEvidenceV285.ts",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts",
  "app/lib/atlasShadowCapabilityPointerV321.ts",
  "app/lib/atlasShadowCapabilityPointerV321.test.ts",
]);

const evidence = JSON.parse(readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v321-evidence.json"), "utf8"));
const pointer = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v321.json"), "utf8"));
const state = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-campaign-v314/campaign-state.json"), "utf8"));
if (evidence.runtime?.fixedBandColoredDiskRayCount !== 4 || evidence.runtime?.fixedBandCount !== 3
  || evidence.runtime?.payloadUnchanged !== true || evidence.runtime?.bandViewUnchanged !== true
  || evidence.runtime?.rasterBufferDisjoint !== true || evidence.runtime?.cinematicBufferShared !== false
  || evidence.runtime?.browserGate !== "authored-not-run"
  || pointer.capabilities?.v321ScienceRaster !== "runtime-wired-v320-fixed-band-four-rays"
  || pointer.capabilities?.v321BufferIntegrity !== "payload-band-view-raster-byte-disjoint"
  || pointer.capabilities?.v321BrowserGate !== "authored-not-run"
  || pointer.formalProductPointer !== "v263" || pointer.localShadowDefaultApplied !== false
  || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false) throw new Error("v321 fail-closed validation failed");
console.log(JSON.stringify({ status: "passed-v321-low-memory", evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, rasterArtifactSha256: evidence.artifact.canonicalSha256, rasterFileSha256: evidence.artifact.rasterFileSha256, dense: pointer.capabilities.v314CorrectedDense }, null, 2));

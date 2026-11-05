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

run("v322-vitest", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run",
  "app/lib/kerrScienceBandHudV322.test.ts",
  "app/components/KerrScienceBandHudV322.test.ts",
  "app/components/KerrScienceObservatoryHeaderV333.test.ts",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts",
  "app/lib/atlasShadowCapabilityPointerV322.test.ts",
]);
run("v322-types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v322-eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), "--max-warnings=0",
  "scripts/build-shadow-candidate-v322.mjs",
  "scripts/verify-shadow-v322-light.mjs",
  "scripts/atlas.mjs",
  "app/lib/kerrScienceBandHudV322.ts",
  "app/lib/kerrScienceBandHudV322.test.ts",
  "app/components/KerrScienceBandHudV322.tsx",
  "app/components/KerrScienceBandHudV322.test.ts",
  "app/components/KerrScienceObservatoryHeaderV333.tsx",
  "app/components/KerrScienceObservatoryHeaderV333.test.ts",
  "app/components/KerrBlackHolePanel.tsx",
  "app/lib/atlasVisualProfileV299.ts",
  "app/lib/atlasStrongGravityTelemetryV309.ts",
  "app/lib/relativityWorkbenchEvidenceV285.ts",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts",
  "app/lib/atlasShadowCapabilityPointerV322.ts",
  "app/lib/atlasShadowCapabilityPointerV322.test.ts",
]);

const evidence = JSON.parse(readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v322-evidence.json"), "utf8"));
const pointer = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v322.json"), "utf8"));
const state = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-campaign-v314/campaign-state.json"), "utf8"));
if (evidence.runtime?.profileTokenSources?.join(",") !== "v5,v6"
  || evidence.runtime?.displayTransform !== "linear-no-grade"
  || evidence.runtime?.diskRayCount !== 4 || evidence.runtime?.bandCount !== 3
  || evidence.runtime?.payloadUnchanged !== true || evidence.runtime?.bandViewUnchanged !== true
  || evidence.runtime?.cinematicBufferShared !== false || evidence.runtime?.browserQualification !== "not-run"
  || pointer.capabilities?.v322ScienceHud !== "telemetry-only-fixed-band-hud-wired"
  || pointer.capabilities?.v322ProfileConsumers !== "v5-and-v6-manual-local-shadow-ab"
  || pointer.formalProductPointer !== "v263" || pointer.localShadowDefaultApplied !== false
  || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false) throw new Error("v322 fail-closed validation failed");
console.log(JSON.stringify({ status: "passed-v322-low-memory", evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, profileTokenSources: evidence.runtime.profileTokenSources, dense: pointer.capabilities.v314CorrectedDense }, null, 2));

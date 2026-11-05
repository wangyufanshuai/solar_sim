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

run("v316-vitest", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run",
  "app/lib/atlasVisualTokenFieldAuditV316.test.ts",
  "app/lib/atlasVisualRuntimeConsumptionV300.test.ts",
  "app/lib/atlasVisualRuntimeTokenAuditV285R1.test.ts",
  "app/lib/atlasVisualProfileV299.test.ts",
  "app/lib/kerrStrongGravityVisualV305.test.ts",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts",
  "app/lib/atlasShadowCapabilityPointerV316.test.ts",
]);
run("v316-types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v316-eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), "--max-warnings=0",
  "scripts/build-shadow-candidate-v316.mjs",
  "scripts/verify-shadow-v316-light.mjs",
  "app/lib/atlasVisualTokenFieldAuditV316.ts",
  "app/lib/atlasVisualTokenFieldAuditV316.test.ts",
  "app/lib/atlasVisualRuntimeConsumptionV300.ts",
  "app/lib/atlasVisualRuntimeConsumptionV300.test.ts",
  "app/components/GalaxyEnvironmentSphere.tsx",
  "app/components/GalaxyEnvironmentSupport.ts",
  "app/components/Planet.tsx",
  "app/components/usePlanetPresentationMaterials.ts",
  "app/components/GaiaStarField.tsx",
  "app/components/ScienceCinematicVisualSurfaceV261.tsx",
  "app/lib/relativityWorkbenchEvidenceV285.ts",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts",
  "app/lib/atlasShadowCapabilityPointerV316.ts",
  "app/lib/atlasShadowCapabilityPointerV316.test.ts",
]);

const evidence = JSON.parse(readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v316-evidence.json"), "utf8"));
const pointer = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v316.json"), "utf8"));
const state = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-campaign-v314/campaign-state.json"), "utf8"));
if (evidence.visual?.requiredFieldCount !== 46 || evidence.visual?.declaredFieldCount !== 46
  || evidence.visual?.fieldAudit !== "field-complete-static-consumer-contract"
  || evidence.visual?.browserQualification !== "not-run"
  || pointer.capabilities?.v316VisualTokenFields !== "static-qualified-46-of-46-runtime-signature-wired"
  || pointer.formalProductPointer !== "v263" || pointer.localShadowDefaultApplied !== false
  || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false) {
  throw new Error("v316 fail-closed validation failed");
}
console.log(JSON.stringify({ status: "passed-v316-low-memory", evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, visualFields: pointer.capabilities.v316VisualTokenFields, correctedDense: pointer.capabilities.v314CorrectedDense }, null, 2));

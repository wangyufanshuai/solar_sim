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

run("v324-vitest", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run",
  "app/lib/kerrScienceProfileABV324.test.ts",
  "app/components/KerrScienceBandHudV322.test.ts",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts",
  "app/lib/relativityWorkbenchEvidenceV324.test.ts",
  "app/api/atlas/relativity-evidence/v324/route.test.ts",
  "app/lib/atlasShadowCapabilityPointerV324.test.ts",
]);
run("v324-types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v324-eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), "--max-warnings=0",
  "scripts/build-shadow-candidate-v324.mjs",
  "scripts/verify-shadow-v324-light.mjs",
  "scripts/atlas.mjs",
  "app/lib/kerrScienceProfileABV324.ts",
  "app/lib/kerrScienceProfileABV324.test.ts",
  "app/components/KerrScienceBandHudV322.tsx",
  "app/components/KerrScienceBandHudV322.test.ts",
  "app/lib/relativityWorkbenchEvidenceV285.ts",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts",
  "app/lib/relativityWorkbenchEvidenceV324.ts",
  "app/lib/relativityWorkbenchEvidenceV324.test.ts",
  "app/lib/relativityEvidenceServerV324.ts",
  "app/api/atlas/relativity-evidence/v324/route.ts",
  "app/api/atlas/relativity-evidence/v324/route.test.ts",
  "app/lib/atlasShadowCapabilityPointerV324.ts",
  "app/lib/atlasShadowCapabilityPointerV324.test.ts",
]);

const evidence = JSON.parse(readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v324-evidence.json"), "utf8"));
const pointer = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v324.json"), "utf8"));
const state = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-campaign-v314/campaign-state.json"), "utf8"));
if (evidence.runtime?.scienceTokenEquivalent !== true
  || evidence.runtime?.scienceTokenMismatchCount !== 0
  || evidence.runtime?.cinematicTokensDistinct !== true
  || evidence.runtime?.scienceDigestStable !== true
  || evidence.runtime?.browserQualification !== "not-run"
  || pointer.capabilities?.v324ScienceProfileAB !== "science-equivalent-cinematic-distinct"
  || pointer.capabilities?.v324ScienceDigest !== "stable-v321-authority-digests"
  || pointer.formalProductPointer !== "v263"
  || pointer.localShadowDefaultApplied !== false
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false) throw new Error("v324 fail-closed validation failed");
console.log(JSON.stringify({ status: "passed-v324-low-memory", evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, scienceTokenEquivalent: evidence.runtime.scienceTokenEquivalent, cinematicTokensDistinct: evidence.runtime.cinematicTokensDistinct, dense: pointer.capabilities.v314CorrectedDense }, null, 2));

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const python = process.platform === "win32" ? resolve(root, ".venv-science/Scripts/python.exe") : resolve(root, ".venv-science/bin/python");
const node = process.execPath;
function run(label, command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
}

run("v312-python-authority", python, ["scripts/test-kerr-authority-v312.py"]);
run("v312-focused", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run",
  "app/lib/kerrAuthorityV312.test.ts",
  "app/lib/atlasShadowCapabilityPointerV312.test.ts",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts",
  "app/api/atlas/relativity-evidence/route.test.ts",
  "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.test.ts",
]);
run("v312-typescript", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v312-eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), "--max-warnings=0",
  "scripts/build-shadow-candidate-v312.mjs",
  "scripts/verify-shadow-v312-light.mjs",
  "app/lib/kerrAuthorityV312.ts",
  "app/lib/kerrAuthorityV312.test.ts",
  "app/lib/atlasShadowCapabilityPointerV312.ts",
  "app/lib/atlasShadowCapabilityPointerV312.test.ts",
  "app/lib/relativityWorkbenchEvidenceV285.ts",
  "app/lib/relativityEvidenceServerV285R1.ts",
  "app/components/KerrCorrectedAuthorityWorkbenchV312.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.ts",
  "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.test.ts",
]);

const gate = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json"), "utf8"));
const pointer = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v312.json"), "utf8"));
if (gate.correctedAuthorityQualified !== true || gate.toleranceConvergence?.strictSolverLadderPairCount !== 64
  || gate.toleranceConvergence?.distinctConvergenceObservableCount <= 0 || gate.release?.denseShardExecuted !== false
  || pointer.formalProductPointer !== "v263" || pointer.capabilities?.correctedDenseCampaign !== "not-created") {
  throw new Error("v312 final fail-closed boundary mismatch");
}
console.log(JSON.stringify({ status: "passed-v312-low-memory", authoritySha256: gate.evidenceSha256, pointerSha256: pointer.pointerSha256, denseCampaign: "not-created" }, null, 2));

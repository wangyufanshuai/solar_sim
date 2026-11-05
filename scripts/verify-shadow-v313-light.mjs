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
run("v313-python", python, ["scripts/test-kerr-polarization-v313.py"]);
run("v313-vitest", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run",
  "app/lib/kerrAuthorityV312.test.ts", "app/lib/kerrAuthorityV313.test.ts",
  "app/lib/atlasShadowCapabilityPointerV313.test.ts", "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts", "app/api/atlas/relativity-evidence/route.test.ts",
  "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.test.ts",
]);
run("v313-types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v313-eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), "--max-warnings=0",
  "scripts/build-shadow-candidate-v313.mjs", "scripts/verify-shadow-v313-light.mjs",
  "app/lib/kerrAuthorityV313.ts", "app/lib/kerrAuthorityV313.test.ts",
  "app/lib/atlasShadowCapabilityPointerV313.ts", "app/lib/atlasShadowCapabilityPointerV313.test.ts",
  "app/lib/relativityWorkbenchEvidenceV285.ts", "app/lib/relativityEvidenceServerV285R1.ts",
  "app/components/KerrPolarizationRequalificationWorkbenchV313.tsx", "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.ts", "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.test.ts",
]);
const envelope = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-reference-v313/portable-envelope.json"), "utf8"));
const pointer = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v313.json"), "utf8"));
if (envelope.status !== "full-kerr-short-authority-qualified" || envelope.geometry?.strictSolverLadderPairCount !== 64
  || envelope.polarization?.applicableExecutionCount !== 16 || envelope.release?.denseCampaignCreated !== false
  || pointer.formalProductPointer !== "v263" || pointer.capabilities?.correctedDenseCampaign !== "not-created") throw new Error("v313 fail-closed validation failed");
console.log(JSON.stringify({ status: "passed-v313-low-memory", envelopeSha256: envelope.evidenceSha256, pointerSha256: pointer.pointerSha256, correctedDenseCampaign: "not-created" }, null, 2));

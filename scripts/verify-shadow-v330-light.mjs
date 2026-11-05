import { createHash } from "node:crypto";
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

run("v330-vitest", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run",
  "app/lib/relativityWorkbenchEvidenceV324.test.ts",
  "app/lib/relativityWorkbenchEvidenceV330.test.ts",
  "app/api/atlas/relativity-evidence/v330/route.test.ts",
  "app/lib/kerrScienceObservatoryStoreV329.test.ts",
  "app/lib/atlasShadowCapabilityPointerV330.test.ts",
]);
run("v330-types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v330-eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), "--max-warnings=0",
  "scripts/build-shadow-candidate-v330.mjs",
  "scripts/verify-shadow-v330-light.mjs",
  "scripts/atlas.mjs",
  "app/lib/relativityWorkbenchEvidenceV330.ts",
  "app/lib/relativityWorkbenchEvidenceV330.test.ts",
  "app/lib/relativityEvidenceServerV330.ts",
  "app/api/atlas/relativity-evidence/v330/route.ts",
  "app/api/atlas/relativity-evidence/v330/route.test.ts",
  "app/lib/atlasShadowCapabilityPointerV330.ts",
  "app/lib/atlasShadowCapabilityPointerV330.test.ts",
]);

const read = (relative) => JSON.parse(readFileSync(resolve(root, relative), "utf8"));
const fileSha = (relative) => createHash("sha256").update(readFileSync(resolve(root, relative))).digest("hex");
const evidence = read("dist/science/orbit-atlas-shadow-v330-evidence.json");
const pointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v330.json");
const state = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const historicalLocks = {
  "app/lib/relativityWorkbenchEvidenceV285.ts": "93efae6feead47e33513d0391e72dd87d51ce491f7143201cb418e96f3cd6a80",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts": "aeb02858f2adfc1261cef8352d8ea4003d77f55174d286931e77a3c68f74ca41",
  "app/lib/relativityEvidenceServerV285R1.ts": "96ee9b7f252d4033a75b78086a62a22da549f40945ebca0dd2df7854aa4e0197",
  "app/lib/relativityEvidenceServerV285R1.test.ts": "ae18f82c14c1d7847ab4b029b41a05cae2f59b7944fa67afdfcfb23919f71bb4",
};
if (evidence.workbench?.rowCount !== 5 || evidence.workbench?.separateCapabilityStatuses !== true
  || evidence.api?.parallelIndependentReads !== true || evidence.api?.boundedRootBundleCache !== 4 || evidence.api?.canonicalShaValidated !== true || evidence.api?.dependencyChainValidated !== true
  || evidence.api?.responseMaxBytes !== 128 * 1024 || evidence.api?.cacheControl !== "no-store" || evidence.api?.lite !== "unavailable-lite-boundary"
  || pointer.capabilities?.v330WorkbenchAdapter !== "five-versioned-capability-rows"
  || pointer.capabilities?.v330EvidenceApi !== "parallel-bounded-single-flight-no-store-lite-unavailable-128kib"
  || pointer.formalProductPointer !== "v263" || pointer.localShadowDefaultApplied !== false
  || formal.version !== "v263-current-product-evidence-pointer"
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false
  || Object.entries(historicalLocks).some(([path, expected]) => fileSha(path) !== expected)) throw new Error("v330 fail-closed validation failed");
console.log(JSON.stringify({ status: "passed-v330-low-memory", evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, rows: evidence.workbench.rowIds, dense: pointer.capabilities.v314CorrectedDense }, null, 2));

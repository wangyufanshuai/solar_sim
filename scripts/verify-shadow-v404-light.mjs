import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
const run = (label, command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
};
const read = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const fileSha = (path) => createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value)
      .filter(([key]) => !["generatedAt", "artifactSha256", "summarySha256", "evidenceSha256", "pointerSha256"].includes(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

run("v404 chain reseal", node, ["scripts/reseal-shadow-evidence-chain-v404.mjs"]);
run("v404 tests", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run",
  "app/lib/atlasObservationLifecycleReplaySummaryV404.test.ts",
  "app/lib/relativityLifecycleEvidenceServerV404.test.ts",
  "app/lib/relativityLifecycleEvidenceClientV404.test.ts",
  "app/api/atlas/relativity-evidence/v404/lifecycle-summary/route.test.ts",
  "app/components/KerrLifecycleReplaySummaryV404.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV404.test.ts",
]);
run("v404 types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v404 eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"),
  "app/lib/atlasObservationLifecycleReplaySummaryV404.ts",
  "app/lib/atlasObservationLifecycleReplaySummaryV404.test.ts",
  "app/lib/relativityLifecycleEvidenceServerV404.ts",
  "app/lib/relativityLifecycleEvidenceServerV404.test.ts",
  "app/lib/relativityLifecycleEvidenceClientV404.ts",
  "app/lib/relativityLifecycleEvidenceClientV404.test.ts",
  "app/lib/atlasShadowCapabilityPointerV404.ts",
  "app/lib/atlasShadowCapabilityPointerV404.test.ts",
  "app/api/atlas/relativity-evidence/v404/lifecycle-summary/route.ts",
  "app/api/atlas/relativity-evidence/v404/lifecycle-summary/route.test.ts",
  "app/components/KerrLifecycleReplaySummaryV404.tsx",
  "app/components/KerrLifecycleReplaySummaryV404.test.tsx",
  "app/components/KerrLifecycleAuditRailV403.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "scripts/build-atlas-observation-lifecycle-summary-v404.ts",
  "scripts/build-shadow-candidate-v404.mjs",
  "scripts/reseal-shadow-evidence-chain-v404.mjs",
  "scripts/verify-shadow-v404-light.mjs",
  "scripts/atlas.mjs",
]);
run("v404 final reseal", node, ["scripts/reseal-shadow-evidence-chain-v404.mjs"]);

const summaryPath = "dist/science/atlas-observation-lifecycle-summary-v404/summary.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v404-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v404.json";
const summary = read(summaryPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const previousEvidence = read("dist/science/orbit-atlas-shadow-v403-evidence.json");
const previousPointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v403.json");
const state = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);
if (
  canonicalSha(summary) !== summary.summarySha256
  || canonicalSha(evidence) !== evidence.evidenceSha256
  || canonicalSha(pointer) !== pointer.pointerSha256
  || evidence.dependency?.v403EvidenceSha256 !== previousEvidence.evidenceSha256
  || evidence.dependency?.v403PointerSha256 !== previousPointer.pointerSha256
  || evidence.dependency?.summarySha256 !== summary.summarySha256
  || pointer.evidence?.fileSha256 !== fileSha(evidencePath)
  || pointer.evidence?.canonicalSha256 !== evidence.evidenceSha256
  || "cycles" in summary
  || JSON.stringify(summary).includes('"cycle":')
  || summary.replay?.cycleCount !== 30
  || summary.replay.totalRequestCount !== 114
  || summary.replay.successCount !== 108
  || summary.replay.failureCount !== 4
  || summary.replay.releasedPendingRequestCount !== 2
  || summary.replay.baselineCycleCount !== 30
  || summary.qualification?.browserSoakQualified !== false
  || summary.qualification.productionLifecycleQualified !== false
  || summary.qualification.cycleDetailsExposed !== false
  || pointer.capabilities?.v404BoundedSummary !== "qualified-cycles-omitted-response-under-128-kib"
  || pointer.capabilities?.v404BrowserSoak !== "not-run"
  || pointer.capabilities?.v404VisualMatrix !== "not-run"
  || pointer.capabilities?.v404RtxWebGpu !== "not-run"
  || pointer.localShadowDefaultApplied !== false
  || state.status !== "incomplete-0-of-49"
  || state.completedShardCount !== 0
  || state.attemptConsumed !== false
  || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer"
  || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn"
  || formalEvidence.contracts?.workerPhysicsMutation !== "not-applied"
  || formalEvidence.contracts?.eihOnePnMutation !== "not-applied"
  || formalEvidence.contracts?.singleCanvas !== true
  || formalEvidence.contracts?.legacyRootAttributes !== 603
  || formalEvidence.contracts?.evidenceLedgerClaims !== 84
) throw new Error("v404 fail-closed validation failed");
const transientPattern = /[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/;
if (transientPattern.test(JSON.stringify(summary)) || transientPattern.test(JSON.stringify(evidence)) || transientPattern.test(JSON.stringify(pointer))) {
  throw new Error("v404 transient evidence leak");
}
for (const entry of evidence.sourceManifest ?? []) {
  if (fileSha(entry.path) !== entry.sha256) throw new Error(`v404 source manifest mismatch: ${entry.path}`);
}
console.log(JSON.stringify({
  status: "passed-v404-low-memory",
  summarySha256: summary.summarySha256,
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  cycles: summary.replay.cycleCount,
  requests: summary.replay.totalRequestCount,
  outcomes: `${summary.replay.successCount}/${summary.replay.failureCount}/${summary.replay.releasedPendingRequestCount}`,
  cycleDetailsExposed: summary.qualification.cycleDetailsExposed,
  browserSoak: pointer.capabilities.v404BrowserSoak,
  dense: pointer.capabilities.v314CorrectedDense,
}, null, 2));

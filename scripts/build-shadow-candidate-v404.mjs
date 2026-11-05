import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v403-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v403.json",
  summary: "dist/science/atlas-observation-lifecycle-summary-v404/summary.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v404-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v404.json",
};
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value)
      .filter(([key]) => !["generatedAt", "artifactSha256", "summarySha256", "evidenceSha256", "pointerSha256"].includes(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, target);
};

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const summary = read(paths.summary);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousPointer.evidence?.fileSha256 !== fileSha(paths.previousEvidence)
  || previousPointer.evidence?.canonicalSha256 !== previousEvidence.evidenceSha256
  || previousPointer.capabilities?.v403FixtureReplay !== "qualified-30-cycles-114-requests-30-baselines"
  || summary.version !== "v404-atlas-observation-lifecycle-replay-summary-v1"
  || summary.status !== "fixture-replay-summary-ready-browser-soak-not-run"
  || sha(summary) !== summary.summarySha256
  || summary.source?.v403EvidenceSha256 !== previousEvidence.evidenceSha256
  || summary.source?.v403PointerSha256 !== previousPointer.pointerSha256
  || summary.replay?.cycleCount !== 30
  || summary.replay.totalRequestCount !== 114
  || summary.replay.successCount !== 108
  || summary.replay.failureCount !== 4
  || summary.replay.releasedPendingRequestCount !== 2
  || summary.replay.baselineCycleCount !== 30
  || summary.qualification?.fixtureReplayQualified !== true
  || summary.qualification.browserSoakQualified !== false
  || summary.qualification.productionLifecycleQualified !== false
  || summary.qualification.cycleDetailsExposed !== false
  || "cycles" in summary
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
) throw new Error("v404-boundary");

const sourcePaths = [
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
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v404-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "bounded-lifecycle-summary-qualified-browser-soak-pending-dense-incomplete-0-of-49",
  dependency: {
    v403EvidenceSha256: previousEvidence.evidenceSha256,
    v403PointerSha256: previousPointer.pointerSha256,
    replayArtifactSha256: summary.source.replayArtifactSha256,
    summarySha256: summary.summarySha256,
    summaryFileSha256: fileSha(paths.summary),
  },
  boundedReplaySummary: {
    cycleCount: 30,
    deterministicExecutionCount: 2,
    totalRequestCount: 114,
    successCount: 108,
    failureCount: 4,
    releasedPendingRequestCount: 2,
    baselineCycleCount: 30,
    maximumCacheEntryCount: 4,
    maximumCachedBytes: summary.replay.maximumCachedBytes,
    stageSummary: summary.stages,
    cycleDetailsExposed: false,
    responseMaximumBytes: 131072,
  },
  runtimeIntegration: {
    sharedSingleFlightRequest: true,
    workbenchReadOnlySurface: true,
    v12AuditRailReadOnlySurface: true,
    reactStateContainsSummaryOnly: true,
    reactStateContainsCycleDetails: false,
    liteBoundary: "unavailable",
    scienceBufferMutation: false,
    cinematicBufferMutation: false,
    canvasCreated: false,
  },
  qualification: {
    fixtureReplayQualified: true,
    boundedSummaryQualified: true,
    browserSoakQualified: false,
    productionLifecycleQualified: false,
    visualMatrixQualification: "not-run",
    rtxWebGpuQualification: "not-run",
  },
  correctedCampaign: {
    namespace: "v314",
    status: state.status,
    completedShardCount: state.completedShardCount,
    plannedShardCount: state.plannedShardCount,
    attemptConsumed: state.attemptConsumed,
    aggregateAvailable: state.aggregateAvailable,
    stateSha256: state.stateSha256,
  },
  networkAttempted: false,
  automaticRetryApplied: false,
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: {
    formalProductPointer: "v263",
    formalProductPointerSha256: fileSha(paths.formal),
    formalProductPointerAdvanced: false,
    ordinaryStandaloneProfile: "legacy-v9",
    liteProfile: "legacy-v9",
    localShadowDefaultProfile: "legacy-v9",
    localShadowDefaultApplied: false,
    publicDeploymentBlocked: true,
  },
  releaseBoundary: "v404-bounded-replay-summary-local-shadow-browser-soak-pending-no-default-no-science-or-physics-mutation",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v404",
  generatedAt: new Date().toISOString(),
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v403FixtureReplay: "qualified-30-cycles-114-requests-30-baselines",
    v404BoundedSummary: "qualified-cycles-omitted-response-under-128-kib",
    v404WorkbenchEvidence: "implemented-read-only-single-flight",
    v404V12AuditRail: "implemented-read-only-single-flight",
    v404LiteBoundary: "unavailable",
    v404BrowserSoak: "not-run",
    v404ProductionLifecycle: "not-qualified",
    v404VisualMatrix: "not-run",
    v404RtxWebGpu: "not-run",
    v314CorrectedDense: "incomplete-0-of-49",
    denseAggregate: "unavailable",
  },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({
  status: pointer.status,
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  summarySha256: summary.summarySha256,
  workbench: pointer.capabilities.v404WorkbenchEvidence,
  browserSoak: pointer.capabilities.v404BrowserSoak,
  dense: pointer.capabilities.v314CorrectedDense,
}, null, 2));

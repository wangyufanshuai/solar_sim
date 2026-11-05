import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const statePath = "dist/science/kerr-campaign-v298r1/campaign-state.json";
const planPath = "dist/science/kerr-campaign-v298r1/ray-plan.json";
const aggregatePath = "dist/science/kerr-campaign-v298r1/dense-aggregate.json";
const rssProbePath = "dist/science/kerr-campaign-v298r1/rss-probe-v2.json";
const shardTruthAuditPath = "dist/science/kerr-campaign-v298r1/audits/shard-00.truth-audit-v311.json";
const shardPath = (index) => `dist/science/kerr-campaign-v298r1/shards/shard-${String(index).padStart(2, "0")}.ndjson`;
const shardAuditPath = (index) => `dist/science/kerr-campaign-v298r1/audits/shard-${String(index).padStart(2, "0")}.science-audit.json`;
const envelopePath = "dist/science/kerr-reference-v297/portable-envelope.json";
const stagingPath = "dist/staging/science-cinematic-v5-v299/manifest.json";
const stagingFailurePath = "dist/staging/science-cinematic-v5-v299/attempt-1-negative.json";
const licensedAssetManifestPath = "dist/science-cinematic-v4-v289-assets/manifest.json";
const resourcePreflightPath = "dist/science/resource-preflight-v275r1-evidence.json";
const formalPath = "dist/release/orbit-atlas-current-product-evidence-v263.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v299-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v299.json";

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !["generatedAt", "pid", "host", "absolutePath", "peakRssGiB"].includes(key))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, canonicalize(entry)]));
}
function canonicalizeAll(value) {
  if (Array.isArray(value)) return value.map(canonicalizeAll);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, canonicalizeAll(entry)]));
}
function sha(value) { return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex"); }
function shaAll(value) { return createHash("sha256").update(JSON.stringify(canonicalizeAll(value))).digest("hex"); }
function fileSha(relative) { return createHash("sha256").update(readFileSync(resolve(root, relative))).digest("hex"); }
function readJson(relative) { return JSON.parse(readFileSync(resolve(root, relative), "utf8")); }
function readVerified(relative, field) {
  const document = readJson(relative);
  const expected = document[field];
  const unsigned = { ...document };
  delete unsigned[field];
  if (typeof expected !== "string" || sha(unsigned) !== expected) throw new Error(`${relative} canonical SHA mismatch`);
  return document;
}

const python = process.platform === "win32"
  ? resolve(root, ".venv-science/Scripts/python.exe")
  : resolve(root, ".venv-science/bin/python");
const campaignStatus = spawnSync(python, [resolve(root, "scripts/run-kerr-dense-campaign-v298r1.py"), "--status"], {
  cwd: root,
  encoding: "utf8",
  shell: false,
});
if (campaignStatus.error) throw campaignStatus.error;
if (campaignStatus.status !== 0) {
  throw new Error(`v298r1 Python authority verification failed: ${campaignStatus.stderr || campaignStatus.stdout}`);
}

// Python owns the floating-point canonical encoding for these three documents.
// Its status command validates their embedded canonical hashes before this JS
// builder cross-checks the byte-level identity locks between them.
const state = readJson(statePath);
const plan = readJson(planPath);
const envelope = readJson(envelopePath);
if (envelope.status !== "full-kerr-short-authority-qualified") throw new Error("v297 full short authority is not qualified");
if (state.rayPlanSha256 !== plan.planSha256 || state.rayPlanFileSha256 !== fileSha(planPath)) throw new Error("v298r1 plan lock mismatch");
if (state.authority?.envelopeFileSha256 !== fileSha(envelopePath)
  || state.authority?.envelopeCanonicalSha256 !== envelope.evidenceSha256
  || plan.authority?.envelopeFileSha256 !== state.authority.envelopeFileSha256
  || plan.authority?.envelopeCanonicalSha256 !== state.authority.envelopeCanonicalSha256) {
  throw new Error("v298r1 portable authority envelope lock mismatch");
}
if (envelope.geometry?.fileSha256 !== state.authority?.geometryFileSha256
  || envelope.geometry?.evidenceSha256 !== state.authority?.geometryCanonicalSha256
  || envelope.polarization?.fileSha256 !== state.authority?.polarizationFileSha256
  || envelope.polarization?.evidenceSha256 !== state.authority?.polarizationCanonicalSha256) {
  throw new Error("v298r1 geometry/polarization authority lock mismatch");
}
if (plan.rayCount !== 3097 || plan.shardCount !== 49 || plan.executionsPerRay !== 8) throw new Error("v298r1 plan conservation failed");
if (!Number.isInteger(state.completedShardCount) || state.completedShardCount < 0 || state.completedShardCount > 49) {
  throw new Error("v298r1 completed shard count is invalid");
}
if (!Array.isArray(state.completedShardIndices)
  || state.completedShardIndices.length !== state.completedShardCount
  || new Set(state.completedShardIndices).size !== state.completedShardIndices.length) {
  throw new Error("v298r1 completed shard index conservation failed");
}

let aggregate = null;
if (state.status === "complete") {
  if (!existsSync(resolve(root, aggregatePath))) throw new Error("v298r1 complete state is missing its dense aggregate");
  aggregate = readVerified(aggregatePath, "aggregateSha256");
  const qualification = aggregate.qualification && typeof aggregate.qualification === "object" ? aggregate.qualification : {};
  const qualificationGates = qualification.gates && typeof qualification.gates === "object" ? Object.values(qualification.gates) : [];
  if (aggregate.status !== "complete"
    || aggregate.rayCount !== 3097
    || aggregate.executionCount !== 24_776
    || aggregate.shardCount !== 49
    || aggregate.partialAggregate !== false
    || qualification.qualified !== true
    || qualificationGates.length === 0
    || qualificationGates.some((passed) => passed !== true)
    || aggregate.unavailablePolarizationExecutionCount !== 0
    || aggregate.rayPlanSha256 !== plan.planSha256
    || JSON.stringify(aggregate.authority) !== JSON.stringify(state.authority)) {
    throw new Error("v298r1 dense aggregate authority or conservation mismatch");
  }
}

const shardAudits = [];
for (const index of state.completedShardIndices) {
  const relative = shardAuditPath(index);
  if (!existsSync(resolve(root, relative))) continue;
  // The preceding Python status command owns canonical verification for this
  // floating-point artifact; JS performs only byte/authority cross-checks.
  const audit = readJson(relative);
  const gates = audit.qualification?.gates && typeof audit.qualification.gates === "object"
    ? Object.values(audit.qualification.gates)
    : [];
  if (audit.status !== "shard-structural-qualified"
    || audit.shardIndex !== index
    || audit.fileSha256 !== fileSha(shardPath(index))
    || audit.rayPlanSha256 !== plan.planSha256
    || JSON.stringify(audit.authority) !== JSON.stringify(state.authority)
    || audit.qualification?.qualified !== true
    || audit.qualification?.scope !== "shard"
    || audit.qualification?.statisticalGatesApplied !== false
    || gates.length === 0
    || gates.some((passed) => passed !== true)
    || audit.errorBudget?.combinationPolicy !== "componentwise-reporting-no-rss-no-cross-dimension-sum"
    || audit.aggregateEligible !== false) {
    throw new Error(`v298r1 shard ${index} science audit mismatch`);
  }
  shardAudits.push({
    shardIndex: index,
    path: relative,
    fileSha256: fileSha(relative),
    canonicalSha256: audit.auditSha256,
    errorBudgetVersion: audit.errorBudget.version,
  });
}

const shardTruthAudit = existsSync(resolve(root, shardTruthAuditPath))
  ? readVerified(shardTruthAuditPath, "truthAuditSha256")
  : null;
if (!shardTruthAudit
  || shardTruthAudit.version !== "v311-kerr-dense-shard-truth-audit-v1"
  || shardTruthAudit.status !== "failed-tolerance-ladder-degenerate"
  || shardTruthAudit.shard?.index !== 0
  || shardTruthAudit.shard?.rayCount !== 64
  || shardTruthAudit.shard?.executionCount !== 512
  || shardTruthAudit.shard?.fileSha256 !== fileSha(shardPath(0))
  || shardTruthAudit.campaign?.stateSha256 !== state.stateSha256
  || shardTruthAudit.campaign?.campaignStateMutationApplied !== false
  || shardTruthAudit.campaign?.nextShardAttempted !== false
  || shardTruthAudit.toleranceLadder?.expectedPairCount !== 256
  || shardTruthAudit.toleranceLadder?.strictSolverLadderPairCount !== 0
  || shardTruthAudit.toleranceLadder?.geometryDistinctPairCount !== 0
  || shardTruthAudit.toleranceLadder?.allPairsUseSameSolverTolerance !== true
  || shardTruthAudit.toleranceLadder?.allGeometryPayloadsDuplicateAcrossTolerance !== true
  || shardTruthAudit.toleranceLadder?.passed !== false
  || shardTruthAudit.qualification?.structuralShardStatus !== "qualified"
  || shardTruthAudit.qualification?.denseToleranceConvergenceStatus !== "withdrawn"
  || shardTruthAudit.qualification?.aggregateEligible !== false) {
  throw new Error("v311 dense shard truth audit mismatch or missing");
}
if (aggregate !== null) throw new Error("v311 tolerance-degenerate campaign cannot publish a dense aggregate");

let licensedExistingAssets = null;
if (existsSync(resolve(root, licensedAssetManifestPath))) {
  const manifest = readJson(licensedAssetManifestPath);
  const canonical = {
    version: manifest.version,
    id: manifest.id,
    installedBytes: manifest.installedBytes,
    installedLimitBytes: manifest.installedLimitBytes,
    minimumFreeDiskBytes: manifest.minimumFreeDiskBytes,
    runtimePolicy: manifest.runtimePolicy,
    entries: manifest.entries,
    sourcePolicy: manifest.sourcePolicy,
  };
  if (sha(canonical) !== manifest.canonicalSha256
    || manifest.id !== "science-cinematic-v4-v289-assets"
    || !Array.isArray(manifest.entries)
    || manifest.entries.length !== 2
    || manifest.sourcePolicy !== "existing-cache-only-no-new-visual-network-download") {
    throw new Error("v289 licensed 2K visual asset manifest mismatch");
  }
  const entries = manifest.entries.map((entry) => {
    const publicPath = `public/${entry.outputPath}`;
    if (entry.sourceUrl !== "https://svs.gsfc.nasa.gov/4851/"
      || entry.license?.id !== "NASA-public-domain"
      || entry.license?.status !== "approved-runtime"
      || entry.license?.termsUrl !== "https://www.nasa.gov/nasa-brand-center/images-and-media/"
      || entry.networkDownloadApplied !== false
      || fileSha(publicPath) !== entry.outputSha256) {
      throw new Error(`v289 licensed visual asset mismatch: ${entry.id}`);
    }
    return {
      id: entry.id,
      sourceUrl: entry.sourceUrl,
      termsUrl: entry.license.termsUrl,
      outputPath: entry.outputPath,
      originalSha256: entry.originalSha256,
      outputSha256: entry.outputSha256,
      outputBytes: entry.outputBytes,
    };
  });
  licensedExistingAssets = {
    manifestPath: licensedAssetManifestPath,
    manifestFileSha256: fileSha(licensedAssetManifestPath),
    manifestCanonicalSha256: manifest.canonicalSha256,
    entries,
    runtimeProfiles: ["science-cinematic-v4-v285", "science-cinematic-v5-v299", "science-cinematic-v6-v300"],
    delivery: "local-shadow-deep-space-intent-only",
    ordinaryStandalone: "unavailable",
    lite: "unavailable",
    legacy: "unavailable",
  };
}

let resourcePreflight = null;
if (existsSync(resolve(root, resourcePreflightPath))) {
  resourcePreflight = readJson(resourcePreflightPath);
  const unsigned = { ...resourcePreflight };
  delete unsigned.evidenceSha256;
  if (typeof resourcePreflight.evidenceSha256 !== "string" || shaAll(unsigned) !== resourcePreflight.evidenceSha256) {
    throw new Error("v275r1 resource preflight canonical SHA mismatch");
  }
}
const resourceEvaluation = resourcePreflight?.evaluation && typeof resourcePreflight.evaluation === "object"
  ? resourcePreflight.evaluation
  : {};
const heavyBlockers = [];
if (resourcePreflight?.version !== "v300-heavy-resource-stability-v1") heavyBlockers.push("resource-preflight-version-not-v300");
if (resourceEvaluation.status !== "resource-preflight-passed-heavy-work-authorized") heavyBlockers.push("resource-preflight-not-passed");
if (resourceEvaluation.validSampleCount !== 18) heavyBlockers.push("resource-stability-sample-count");
if (Number(resourceEvaluation.minimumMemoryBytes) < 7 * 1024 ** 3) heavyBlockers.push("minimum-memory-below-7-gib");
if (Number(resourceEvaluation.p10MemoryBytes) < 7 * 1024 ** 3) heavyBlockers.push("p10-memory-below-7-gib");
if (Number(resourceEvaluation.minimumDiskBytes) < 30 * 1024 ** 3) heavyBlockers.push("disk-below-30-gib");
if (Number(resourceEvaluation.protectedTerminationCount) !== 0) heavyBlockers.push("protected-process-termination");
if (Number(resourceEvaluation.residualProjectProcessCount) !== 0) heavyBlockers.push("residual-project-process");
if (resourceEvaluation.requiredPortsClear !== true) heavyBlockers.push("required-port-listener");
if (resourceEvaluation.unknownTargetListenerObserved === true) heavyBlockers.push("unknown-target-listener");
if (state.status !== "complete" || state.completedShardCount !== 49 || state.plannedShardCount !== 49) heavyBlockers.push("dense-campaign-not-49-of-49");
if (aggregate === null) heavyBlockers.push("dense-aggregate-unavailable");
if (aggregate === null) heavyBlockers.push("dense-authority-not-accepted");
if (shardTruthAudit.status !== "qualified-numerically-nondegenerate") heavyBlockers.push("dense-tolerance-ladder-withdrawn-v311");
const heavyQualification = {
  version: "v300-shadow-heavy-qualification-gate-v1",
  status: heavyBlockers.length === 0 ? "heavy-qualification-authorized" : "blocked-heavy-qualification",
  authorized: heavyBlockers.length === 0,
  blockers: heavyBlockers,
  allowedStages: heavyBlockers.length === 0 ? ["builds", "browser", "visual", "soak", "rtx-webgpu"] : [],
  thresholds: { sampleCount: 18, minimumMemoryBytes: 7 * 1024 ** 3, minimumDiskBytes: 30 * 1024 ** 3 },
  observed: {
    resourcePreflightPath,
    resourcePreflightSha256: resourcePreflight?.evidenceSha256 ?? null,
    evidenceVersion: resourcePreflight?.version ?? "unavailable",
    status: resourceEvaluation.status ?? "unavailable",
    validSampleCount: Number(resourceEvaluation.validSampleCount ?? 0),
    minimumMemoryBytes: Number(resourceEvaluation.minimumMemoryBytes ?? 0),
    p10MemoryBytes: Number(resourceEvaluation.p10MemoryBytes ?? 0),
    minimumDiskBytes: Number(resourceEvaluation.minimumDiskBytes ?? 0),
    campaignStatus: state.status,
    completedShardCount: state.completedShardCount,
    aggregateAvailable: aggregate !== null,
    denseToleranceConvergenceStatus: shardTruthAudit.qualification.denseToleranceConvergenceStatus,
  },
  boundary: "local-shadow-only-formal-v263-retained-no-automatic-promotion",
};

const sourcePaths = [
  "scripts/run-kerr-dense-campaign-v298r1.py",
  "scripts/audit-kerr-dense-shard-v311.py",
  "app/lib/kerrCampaignV298R1.ts",
  "app/lib/kerrCriticalCurveV300.ts",
  "app/lib/kerrCriticalCurvePlotV300.ts",
  "app/lib/kerrObserverEmitterReplayV301.ts",
  "app/lib/kerrObserverEmitterReplayServerV301.ts",
  "app/lib/kerrEventTimelineV302.ts",
  "app/lib/kerrErrorBudgetV303.ts",
  "app/lib/kerrErrorBudgetServerV303.ts",
  "app/lib/kerrPolarizationViewV304.ts",
  "app/lib/kerrPolarizationViewServerV304.ts",
  "app/lib/strongGravityRenderingV299.ts",
  "app/lib/kerrStrongGravityVisualV305.ts",
  "app/lib/kerrScienceObservablesV306.ts",
  "app/lib/kerrScienceRasterV307.ts",
  "app/lib/atlasResourceScopeV308.ts",
  "app/lib/atlasStrongGravityTelemetryV309.ts",
  "app/lib/atlasStrongGravityBrowserGateV310.ts",
  "app/lib/kerrDenseShardTruthV311.ts",
  "app/lib/kerrInteractiveComputeV299.ts",
  "app/workers/kerrInteractiveCompute.worker.ts",
  "app/components/KerrStrongGravityRendererV299.tsx",
  "app/components/KerrScienceObservablesWorkbenchV306.tsx",
  "app/components/KerrDenseShardTruthWorkbenchV311.tsx",
  "app/lib/atlasVisualProfileV299.ts",
  "app/lib/atlasVisualRuntimeConsumptionV300.ts",
  "app/lib/atlasVisualAssetsV289.ts",
  "app/lib/atlasShadowHeavyQualificationGateV300.ts",
  "app/lib/atlasResourcePreflightV275R1.ts",
  "scripts/run-resource-preflight-v275r1.mjs",
  "app/lib/atlasVisualShellV285R1.ts",
  "app/components/AtlasVisualABControlV261.tsx",
  "app/components/ScienceCinematicVisualSurfaceV261.tsx",
  "app/components/GalaxyEnvironmentSphere.tsx",
  "app/components/Planet.tsx",
  "app/components/GaiaStarField.tsx",
  "app/components/UniversePmndrsPostProcessing.tsx",
  "app/components/KerrBlackHole.tsx",
  "app/components/PostProcessingGate.tsx",
  "app/components/AtlasAppShell.tsx",
  "app/components/AtlasUniverseSceneRuntime.tsx",
  "app/lib/atlasBrowserObservabilityV294.ts",
  "app/lib/atlasResourceLifecycle.ts",
  "app/lib/atlasPerformanceQualificationV300.ts",
  "app/components/AtlasRuntimePerformanceProbe.tsx",
  "app/components/useLaunchSceneResources.ts",
  "app/components/LaunchSceneView.tsx",
  "app/components/ExoplanetSystemScene.tsx",
  "app/lib/kerrSciencePayloadClientV299.ts",
  "app/lib/relativityEvidenceServerV285R1.ts",
  "app/lib/relativityWorkbenchEvidenceV285.ts",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/components/KerrCriticalCurveWorkbenchV300.tsx",
  "app/components/KerrObserverEmitterWorkbenchV301.tsx",
  "app/components/KerrEventTimelineWorkbenchV302.tsx",
  "app/components/KerrErrorBudgetWorkbenchV303.tsx",
  "app/components/KerrPolarizationWorkbenchV304.tsx",
  "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.ts",
  "tests/atlas-browser/atlas-v300-resource-lifecycle.spec.ts",
  "scripts/stage-cinematic-assets-v299.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const sourceSha256 = sha(sourceManifest);
let staging = null;
let stagingFailure = null;
if (existsSync(resolve(root, stagingPath))) {
  staging = readVerified(stagingPath, "canonicalSha256");
  if (staging.status !== "staging-only-runtime-forbidden" || staging.publicRuntimeMutation !== "not-applied") throw new Error("v299 staging crossed the runtime boundary");
} else if (existsSync(resolve(root, stagingFailurePath))) {
  stagingFailure = readVerified(stagingFailurePath, "canonicalSha256");
  if (stagingFailure.runtimeEligible !== false || stagingFailure.automaticRetryApplied !== false) {
    throw new Error("v299 staging failure boundary mismatch");
  }
}

const campaignState = shardTruthAudit.status === "failed-tolerance-ladder-degenerate"
  ? "quarantined-1-of-49-tolerance-ladder-degenerate"
  : state.status === "failed-no-automatic-retry"
  ? `blocked-shard-${state.failedShardIndex ?? state.nextShardIndex ?? "unknown"}-failed`
  : state.status === "aggregate-failed-no-automatic-retry"
    ? "blocked-aggregate-failed-no-automatic-retry"
  : state.status === "complete"
    ? "qualified-49-of-49"
    : state.status === "complete-awaiting-aggregate"
      ? "complete-49-of-49-awaiting-aggregate"
      : `incomplete-${state.completedShardCount}-of-49`;
const rssMeasured = state.rssTelemetry?.status === "measured"
  && state.rssTelemetry?.probe === "process-peak-working-set-v298r1-r2"
  && Number.isFinite(state.rssTelemetry?.peakRssBytes)
  && state.rssTelemetry.peakRssBytes > 0;
const rssProbe = existsSync(resolve(root, rssProbePath)) ? readVerified(rssProbePath, "evidenceSha256") : null;
if (rssProbe && (rssProbe.status !== "corrected-probe-qualified-shard0-unmeasured"
  || rssProbe.scope !== "instrumentation-only-future-shards-not-retrospective-shard-measurement"
  || rssProbe.historicalShardRssQualified !== false
  || rssProbe.campaignStateMutationApplied !== false
  || rssProbe.campaignStateSha256 !== state.stateSha256)) {
  throw new Error("v298r1 corrected RSS probe evidence boundary mismatch");
}
const capabilities = {
  v296: "geometry-redshift-qualified",
  v296ToleranceConvergence: "withdrawn-same-effective-solver-tolerance",
  v297: "full-kerr-short-authority-qualified",
  v298: "planner-only-preserved",
  v298r1: campaignState,
  denseShardAudits: shardTruthAudit.status === "failed-tolerance-ladder-degenerate"
    ? `structural-qualified-${shardAudits.length}-of-${state.completedShardCount}-truth-audit-failed`
    : shardAudits.length === state.completedShardCount
      ? `qualified-${shardAudits.length}-of-${state.completedShardCount}-published`
    : `incomplete-${shardAudits.length}-of-${state.completedShardCount}-published`,
  denseToleranceConvergenceV311: "withdrawn-0-of-256-strict-solver-ladder-pairs",
  denseRssTelemetry: rssMeasured
    ? "measured-shard-gate-qualified"
    : rssProbe
      ? "corrected-probe-qualified-historical-shard0-unmeasured"
      : "historical-shard0-unmeasured-corrected-probe-not-run",
  criticalCurve: "bounded-40-bracket-sha-locked-browser-view",
  observerEmitterRedshift: "bounded-four-disk-ray-independent-browser-replay",
  eventTimelines: "bounded-16-ray-dual-formula-earliest-valid-event-replay",
  errorBudget: "layered-sparse-qualified-dense-shard-only-no-rss",
  polarizationView: "bounded-four-ray-projected-wp-independent-ks-transport-replay",
  v299: "implemented-awaiting-browser-qualification",
  webGpu: "implemented-shadow-pending-adapter-differential",
  resourceLifecycle: "static-qualified-browser-baseline-pending",
  resourceIdentity: "owner-label-content-manifest-sha-digest-static-qualified-browser-pending",
  performanceQualification: "unified-ten-pair-30-cycle-contract-static-qualified-hardware-samples-not-run",
  scienceDisplay: "static-qualified-linear-no-grade-browser-pending",
  strongGravityVisualV305: "v6-all-token-consumed-science-cinematic-buffer-isolated",
  scienceObservablesV306: "bounded-16-ray-componentwise-null-not-zero-workbench-view",
  scienceRasterV307: "deterministic-classification-redshift-evpa-image-order-sparse-raster",
  resourceScopeV308: "idempotent-reverse-order-failure-rollback-for-strong-gravity-resources",
  strongGravityTelemetryV309: "non-react-science-raster-and-resource-rollback-browser-observability",
  strongGravityBrowserGateV310: "fail-closed-science-authority-raster-lifecycle-spec-authored-not-run",
  gpuSafety: "static-qualified-request-response-validation-browser-pending",
  gpuAuthorityLock: "qualified-v296-v297-portable-envelope",
  browserObservability: "static-qualified-runtime-matrix-pending",
  visualTokenConsumption: "instrumented-eight-group-resolver-locked-browser-matrix-pending",
  visualV5: "manual-local-shadow-only",
  visualV6: "manual-local-shadow-only-not-default",
  visualAssetsExisting2K: licensedExistingAssets
    ? "qualified-manifest-license-output-sha-texture-provenance-local-shadow-intent-only"
    : "unavailable",
  visualAssets: staging
    ? "staging-only-runtime-forbidden"
    : stagingFailure?.status ?? "not-run",
  heavyQualification: heavyQualification.status,
  browserQualification: "not-run",
};
const unsignedEvidence = {
  version: "v299-dense-kerr-science-cinematic-shadow-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: shardTruthAudit.status === "failed-tolerance-ladder-degenerate"
    ? "implemented-dense-campaign-quarantined"
    : state.status === "failed-no-automatic-retry" || state.status === "aggregate-failed-no-automatic-retry"
    ? "implemented-dense-shard-blocked"
    : state.status === "complete"
      ? "dense-authority-qualified-awaiting-browser-qualification"
      : "implemented-dense-campaign-incomplete",
  capabilities,
  authority: {
    portableEnvelope: { path: envelopePath, fileSha256: fileSha(envelopePath), canonicalSha256: envelope.evidenceSha256 },
    campaignState: { path: statePath, fileSha256: fileSha(statePath), canonicalSha256: state.stateSha256 },
    rayPlan: { path: planPath, fileSha256: fileSha(planPath), canonicalSha256: plan.planSha256 },
    correctedRssProbe: rssProbe
      ? { path: rssProbePath, fileSha256: fileSha(rssProbePath), canonicalSha256: rssProbe.evidenceSha256 }
      : null,
    denseAggregate: aggregate
      ? { path: aggregatePath, fileSha256: fileSha(aggregatePath), canonicalSha256: aggregate.aggregateSha256 }
      : null,
    shardAudits,
    shardTruthAudit: {
      path: shardTruthAuditPath,
      fileSha256: fileSha(shardTruthAuditPath),
      canonicalSha256: shardTruthAudit.truthAuditSha256,
      status: shardTruthAudit.status,
    },
    licensedExistingAssets,
    resourcePreflight: resourcePreflight
      ? { path: resourcePreflightPath, fileSha256: fileSha(resourcePreflightPath), canonicalSha256: resourcePreflight.evidenceSha256 }
      : null,
    sourceManifest,
    sourceSha256,
  },
  runtime: {
    scienceAuthority: "v296-v297-short-gate-sparse",
    denseAuthorityAccepted: aggregate !== null,
    partialAggregateAccepted: false,
    gpuBackend: "webgpu-shadow-pending-differential-with-bounded-worker-fallback",
    legacyV3Boundary: "legacy-visual-approximation-not-science-authority",
    visualProfile: "science-cinematic-v5-v299",
    visualProfileCandidates: ["science-cinematic-v5-v299", "science-cinematic-v6-v300"],
    visualProfileDefaultApplied: false,
    v5ManualAbDelivery: "local-shadow-only",
    v6ManualAbDelivery: "local-shadow-only",
    visualTokenConsumptionAudit: "active-session-observed-resolver-exact-eight-group-v300",
    resourceIdentityAudit: "owner-label-content-manifest-sha-stable-digest-v300",
    performanceQualificationContract: "desktop-mobile-five-scene-30-cycle-resource-identity-v300",
    denseErrorBudget: shardTruthAudit.status === "failed-tolerance-ladder-degenerate"
      ? "componentwise-structural-audit-preserved-tolerance-convergence-withdrawn"
      : shardAudits.length > 0
        ? "componentwise-audited-no-rss-no-cross-dimension-sum"
      : "pending-shard-audit",
    visualAssetRuntime: licensedExistingAssets
      ? "licensed-2k-local-shadow-v4-v5-v6-intent-only"
      : "unavailable",
    heavyQualification,
    singleCanvas: true,
    sceneRevisionMutation: "not-applied",
  },
  campaign: {
    completedShardCount: state.completedShardCount,
    auditedShardCount: shardAudits.length,
    plannedShardCount: state.plannedShardCount,
    nextShardIndex: state.nextShardIndex,
    peakRssBytes: rssMeasured ? state.rssTelemetry.peakRssBytes : null,
    peakRssTelemetry: rssMeasured
      ? { status: "measured", probe: state.rssTelemetry.probe, gate: state.rssTelemetry.peakRssBytes < 2 * 1024 ** 3 }
      : rssProbe
        ? { status: "corrected-probe-qualified-shard0-unmeasured", probe: rssProbe.probe, gate: false, probeGate: true, historicalShardRssQualified: false }
        : { status: state.peakRssBytes === 0 ? "unavailable-zero-windows-probe" : "pending-corrected-probe", probe: "process-peak-working-set-v298r1-r2", gate: false },
    attemptConsumed: state.attemptConsumed,
    aggregateAvailable: aggregate !== null,
    automaticRetryApplied: false,
    truthAuditStatus: shardTruthAudit.status,
    toleranceLadderQualified: false,
    strictSolverLadderPairCount: shardTruthAudit.toleranceLadder.strictSolverLadderPairCount,
    expectedSolverLadderPairCount: shardTruthAudit.toleranceLadder.expectedPairCount,
    continuation: shardTruthAudit.qualification.denseCampaignContinuation,
  },
  staging: staging
    ? { path: stagingPath, fileSha256: fileSha(stagingPath), canonicalSha256: staging.canonicalSha256, runtimeEligible: false }
    : stagingFailure
      ? { path: stagingFailurePath, fileSha256: fileSha(stagingFailurePath), canonicalSha256: stagingFailure.canonicalSha256, status: stagingFailure.status, runtimeEligible: false, automaticRetryApplied: false }
      : { status: "not-run", runtimeEligible: false },
  formalProductPointer: { path: formalPath, fileSha256: fileSha(formalPath), version: "v263", advanced: false },
  science: {
    defaultKernel: "legacy-eih-1pn",
    codeSha256: "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8",
    screenSha256: "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037",
    workerPhysicsMutation: "not-applied",
    legacyKerrMutation: "not-applied",
  },
  release: { buildsRun: false, playwrightRun: false, soakRun: false, rtxRun: false, webGpuQualified: false, vercelApplied: false, productionApplied: false },
  boundary: "local-shadow-development-only-no-product-promotion-no-partial-dense-authority",
};
const evidence = { ...unsignedEvidence, evidenceSha256: sha(unsignedEvidence) };
mkdirSync(resolve(root, "dist/science"), { recursive: true });
writeFileSync(resolve(root, evidencePath), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");

const unsignedPointer = {
  version: "orbit-atlas-current-local-shadow-candidate-v299",
  generatedAt: new Date().toISOString(),
  status: evidence.status,
  capabilities,
  evidence: { path: evidencePath, fileSha256: fileSha(evidencePath), canonicalSha256: evidence.evidenceSha256 },
  formalProductPointer: "v263",
  formalProductPointerPath: formalPath,
  formalProductPointerSha256: fileSha(formalPath),
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
};
const pointer = { ...unsignedPointer, pointerSha256: sha(unsignedPointer) };
mkdirSync(resolve(root, "dist/release"), { recursive: true });
writeFileSync(resolve(root, pointerPath), `${JSON.stringify(pointer, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ status: pointer.status, capabilities, evidenceSha256: evidence.evidenceSha256, pointer: pointerPath }, null, 2));

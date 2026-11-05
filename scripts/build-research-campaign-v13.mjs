import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const checkOnly = process.argv.includes("--check");
const generatedModule = "app/lib/atlasResearchCampaignV13.generated.ts";
const releaseArtifact = "dist/release/orbit-atlas-research-campaign-v13.json";

const fromRoot = (value) => path.join(root, value);
const posix = (value) => value.replaceAll("\\", "/");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const readJson = async (file) => JSON.parse(await readFile(fromRoot(file), "utf8"));
const fileSha256 = async (file) => sha256(await readFile(fromRoot(file)));

function invariant(condition, message) {
  if (!condition) throw new Error(`v13 research campaign invariant failed: ${message}`);
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonical(entry)]),
    );
  }
  return value;
}

async function optionalJson(file) {
  try {
    return await readJson(file);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function optionalDirectoryFiles(directory, pattern) {
  try {
    return (await readdir(fromRoot(directory), { withFileTypes: true }))
      .filter((entry) => entry.isFile() && pattern.test(entry.name))
      .map((entry) => posix(path.join(directory, entry.name)))
      .sort();
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

const sourceFiles = {
  jointValidation: "dist/science/relativity-joint-validation-v9.json",
  priorRegressions: "dist/science/relativity-regression-explanation-v196.json",
  denseScreen: "dist/science/kerr-finite-observer-screen-v8.json",
  densePlan: "dist/science/kerr-dense-execution-plan-v8-release.json",
  denseAggregate: "dist/science/kerr-dense-cross-validation-v8.json",
  kerrGateV8: "dist/science/kerr-dense-gate-v8.json",
  kerrCampaignProgressV8: "dist/science/kerr-dense-campaign-progress-v8.json",
  v6ShardQuarantine: "dist/science/quarantine/kerr-shards-v6-pre-v8/quarantine-manifest.json",
  stmSmoke: "dist/science/relativity-variational-stm-v12-smoke-evidence.json",
  bundleStandalone: "dist/science/client-bundle-v253-standalone-full.json",
  bundleLite: "dist/science/client-bundle-v253-vercel-lite.json",
  lifecycle: "dist/science/lifecycle-soak-v236-report.json",
  contentPacks: "dist/science/content-pack-integrity-v232.json",
  catalogExpansion: "dist/science/catalog-expansion-v255.json",
  security: "dist/science/production-security-v232.json",
};
const optionalSources = {
  historicalKerrGateV7: "dist/science/kerr-dense-gate-v7.json",
  historicalKerrGateDiagnosticV7: "dist/science/kerr-dense-gate-v7-diagnostic.json",
  stmGate: "dist/science/relativity-variational-stm-gate-v13.json",
  stmReleaseA: "dist/science/relativity-variational-stm-v13-a.json",
  stmReleaseB: "dist/science/relativity-variational-stm-v13-b.json",
  stmReleaseEvidence: "dist/science/relativity-variational-stm-evidence-v13.json",
};

const entries = await Promise.all(
  Object.entries(sourceFiles).map(async ([id, file]) => [id, file, await readJson(file)]),
);
const reports = Object.fromEntries(entries.map(([id, , document]) => [id, document]));
const optionalEntries = await Promise.all(
  Object.entries(optionalSources).map(async ([id, file]) => [id, file, await optionalJson(file)]),
);
const optionalReports = Object.fromEntries(optionalEntries.map(([id, , document]) => [id, document]));

invariant(reports.jointValidation.version === "v204-relativity-joint-validation-v9", "unexpected joint-validation version");
invariant(reports.jointValidation.coordinateFrame === "ICRF-J2000-barycentric", "joint validation must be barycentric ICRF/J2000");
invariant(reports.jointValidation.timeScale === "TDB", "joint validation must use TDB");
invariant(reports.jointValidation.priorFifteenRegressionClosure?.rowCount === 15, "all 15 historical regressions are required");
invariant(reports.jointValidation.priorFifteenRegressionClosure?.allRowsPresent === true, "historical regression rows are incomplete");
invariant(reports.denseScreen.version === "v248-kerr-finite-observer-screen-manifest-v8", "unexpected V8 finite-observer screen version");
invariant(reports.densePlan.version === "v248-kerr-dense-finite-observer-sharded-v8", "unexpected V8 dense plan version");
invariant(reports.densePlan.profile === "release" && reports.densePlan.shardCount === 49, "dense Kerr release plan must contain 49 shards");
invariant(reports.denseAggregate.version === "v248-kerr-dense-finite-observer-sharded-v8", "unexpected V8 dense aggregate version");
invariant(reports.kerrGateV8.version === "v248-kerr-finite-observer-short-gate-v8", "unexpected V8 short-gate version");
invariant(reports.kerrGateV8.gatePassed === true && reports.kerrGateV8.evaluation?.gatePassed === true, "V8 short gate must pass before it becomes the current campaign");
invariant(reports.kerrGateV8.releaseShardCoverageContribution === 0, "V8 gate must not contribute release shard coverage");
invariant(reports.kerrGateV8.provenance?.finiteObserverScreenManifestSha256 === reports.densePlan.finiteObserverScreenManifestSha256, "V8 gate screen provenance drifted");
invariant(reports.kerrGateV8.provenance?.codeSha256 === reports.densePlan.codeSha256, "V8 gate code provenance drifted");
invariant(reports.kerrGateV8.provenance?.environmentSha256 === reports.densePlan.environmentSha256, "V8 gate environment provenance drifted");
invariant(reports.kerrGateV8.provenance?.planInputSha256 === reports.densePlan.inputSha256, "V8 gate plan provenance drifted");
invariant(reports.denseScreen.manifestSha256 === reports.densePlan.finiteObserverScreenManifestSha256, "V8 screen and plan identities disagree");
invariant(reports.kerrCampaignProgressV8.version === "v248-kerr-dense-campaign-progress-v8", "unexpected V8 campaign-progress version");
invariant(reports.kerrCampaignProgressV8.freezeBranch === "codex/orbit-atlas-v241-science-freeze", "V8 campaign freeze branch drifted");
invariant(/^[a-f0-9]{40}$/.test(reports.kerrCampaignProgressV8.freezeCommitSha), "V8 campaign freeze commit is invalid");
invariant(reports.kerrCampaignProgressV8.shortGatePassed === true, "V8 campaign progress did not retain the passing gate");
invariant(reports.kerrCampaignProgressV8.finiteObserverScreenManifestSha256 === reports.densePlan.finiteObserverScreenManifestSha256, "V8 campaign screen provenance drifted");
invariant(reports.kerrCampaignProgressV8.codeSha256 === reports.densePlan.codeSha256, "V8 campaign code provenance drifted");
invariant(reports.kerrCampaignProgressV8.environmentSha256 === reports.densePlan.environmentSha256, "V8 campaign environment provenance drifted");
invariant(reports.kerrCampaignProgressV8.planInputSha256 === reports.densePlan.inputSha256, "V8 campaign plan provenance drifted");
invariant(reports.kerrCampaignProgressV8.shortGateCanonicalEvidenceSha256 === reports.kerrGateV8.canonicalEvidenceSha256, "V8 campaign gate evidence drifted");
invariant(reports.kerrCampaignProgressV8.v6QuarantineManifestSha256 === reports.v6ShardQuarantine.manifestSha256, "V6 quarantine provenance drifted");
invariant(reports.v6ShardQuarantine.reusableByV8 === false && reports.v6ShardQuarantine.deleted === false, "V6 shards must be quarantined without deletion or V8 reuse");
invariant(await fileSha256("scripts/run-kerr-dense-campaign-v8.py") === reports.kerrCampaignProgressV8.controllerSha256, "V8 campaign controller drifted after preparation");
invariant(optionalReports.historicalKerrGateV7?.evaluation?.gatePassed === false, "V7 negative gate evidence must remain failed");
invariant(optionalReports.historicalKerrGateV7?.evaluation?.criticalTransitionCount === 0, "V7 negative gate evidence must retain 0 transitions");
invariant(optionalReports.historicalKerrGateV7?.evaluation?.criticalTransitionExpected === 40, "V7 negative gate evidence must retain the 40-transition expectation");
invariant(reports.stmSmoke.version === "v229-relativity-variational-stm-evidence-v12", "unexpected STM smoke evidence");
invariant(reports.catalogExpansion.version === "v255-catalog-expansion", "unexpected catalog expansion evidence");
invariant(reports.catalogExpansion.status === "ready", "catalog expansion evidence is not ready");
invariant(reports.catalogExpansion.defaultScientificKernel === "legacy-eih-1pn", "catalog expansion changed the default kernel");
invariant(
  reports.catalogExpansion.livePhysicsMutation === "not-applied" &&
  reports.catalogExpansion.workerPhysicsMutation === "not-applied" &&
  reports.catalogExpansion.eihOnePnMutation === "not-applied",
  "catalog expansion crossed the presentation-only boundary",
);

const shardDirectory = "dist/science/kerr-shards-v8";
const shardFiles = await optionalDirectoryFiles(shardDirectory, /^shard-\d{4}\.json$/);
const shardEntries = await Promise.all(
  shardFiles.map(async (file) => ({ file, document: await readJson(file) })),
);
const completeShards = shardEntries.filter(({ document }) => document.complete === true);
const seenIndices = new Set();
for (const { file, document } of completeShards) {
  invariant(document.profile === "release", `${file} is not a release shard`);
  invariant(document.codeSha256 === reports.densePlan.codeSha256, `${file} code hash drifted`);
  invariant(document.environmentSha256 === reports.densePlan.environmentSha256, `${file} environment hash drifted`);
  invariant(document.version === reports.densePlan.version, `${file} version drifted`);
  invariant(document.finiteObserverScreenManifestSha256 === reports.densePlan.finiteObserverScreenManifestSha256, `${file} screen hash drifted`);
  invariant(!seenIndices.has(document.shardIndex), `${file} duplicates a shard index`);
  invariant(document.rays?.length === document.rayCount, `${file} ray coverage is incomplete`);
  invariant(document.rays.every((ray) => ray.executions?.length === 8), `${file} lacks eight executions per ray`);
  invariant(
    document.rays.every((ray) => ray.executions.every((execution) =>
      execution.status === "captured" || execution.status === "escaped" || execution.status === "disk-hit")),
    `${file} contains a nonphysical execution`,
  );
  seenIndices.add(document.shardIndex);
}

const failedShardIndex = reports.kerrCampaignProgressV8.failedShardIndex;
const failedShardEntry = Number.isInteger(failedShardIndex)
  ? shardEntries.find(({ document }) => document.shardIndex === failedShardIndex) ?? null
  : null;
if (reports.kerrCampaignProgressV8.status === "failed") {
  invariant(reports.kerrCampaignProgressV8.noAutomaticRetry === true, "failed V8 campaign must prohibit automatic retry");
  invariant(failedShardEntry !== null, "failed V8 campaign is missing its negative shard evidence");
  invariant(failedShardEntry.document.complete === false, "failed V8 shard must remain incomplete negative evidence");
  invariant(failedShardEntry.document.profile === "release", "failed V8 shard is not a release shard");
  invariant(failedShardEntry.document.codeSha256 === reports.densePlan.codeSha256, "failed V8 shard code hash drifted");
  invariant(failedShardEntry.document.environmentSha256 === reports.densePlan.environmentSha256, "failed V8 shard environment hash drifted");
  invariant(failedShardEntry.document.version === reports.densePlan.version, "failed V8 shard version drifted");
  invariant(failedShardEntry.document.finiteObserverScreenManifestSha256 === reports.densePlan.finiteObserverScreenManifestSha256, "failed V8 shard screen hash drifted");
  invariant(failedShardEntry.document.rays?.length === failedShardEntry.document.rayCount, "failed V8 shard ray evidence is incomplete");
  invariant(failedShardEntry.document.rays.every((ray) => ray.executions?.length === 8), "failed V8 shard lacks eight attempted executions per ray");
}

const failedExecutions = failedShardEntry === null
  ? []
  : failedShardEntry.document.rays.flatMap((ray) => ray.executions);
const incompleteExecutions = failedExecutions.filter((execution) =>
  execution.status !== "captured" && execution.status !== "escaped" && execution.status !== "disk-hit");
const failedExecutionStatusCounts = Object.fromEntries(
  [...new Set(incompleteExecutions.map((execution) => execution.status))]
    .sort()
    .map((status) => [status, incompleteExecutions.filter((execution) => execution.status === status).length]),
);
const affectedRayIds = failedShardEntry === null
  ? []
  : failedShardEntry.document.rays
      .filter((ray) => ray.executions.some((execution) =>
        execution.status !== "captured" && execution.status !== "escaped" && execution.status !== "disk-hit"))
      .map((ray) => ray.id);
const failedShardFileSha256 = failedShardEntry === null
  ? null
  : await fileSha256(failedShardEntry.file);
const failedShardEvidence = failedShardEntry === null ? null : {
  shardIndex: failedShardEntry.document.shardIndex,
  file: failedShardEntry.file,
  fileSha256: failedShardFileSha256,
  outputSha256: failedShardEntry.document.outputSha256,
  complete: false,
  rayCount: failedShardEntry.document.rayCount,
  executionCount: failedExecutions.length,
  watchdogSeconds: failedShardEntry.document.watchdogSeconds,
  incompleteExecutionCount: incompleteExecutions.length,
  watchdogTimeoutExecutionCount:
    incompleteExecutions.filter((execution) => execution.status === "watchdog-timeout").length,
  incompleteExecutionStatusCounts: failedExecutionStatusCounts,
  affectedRayIds,
  retainedAsImmutableNegativeEvidence: true,
};

const executions = completeShards.flatMap(({ document }) =>
  document.rays.flatMap((ray) => ray.executions),
);
const maxNullConstraint = executions.length
  ? Math.max(...executions.map((execution) => execution.maxNullConstraint ?? 0))
  : null;
const classCounts = completeShards.reduce((total, { document }) => {
  for (const [key, value] of Object.entries(document.rayClassCounts ?? {})) {
    total[key] = (total[key] ?? 0) + value;
  }
  return total;
}, {});

const v9Rows = reports.jointValidation.priorFifteenRegressionClosure.rows;
const attributionRows = v9Rows.map((row) => ({
  checkpoint: row.checkpoint,
  offsetDays: row.offsetDays,
  bodyId: row.bodyId,
  priorV8Classification: row.priorV8Classification,
  jointValidationClassification: row.v9Classification,
  attribution: row.v9Classification === "cross-solver-regression-confirmed"
    ? "cross-solver-regression-confirmed"
    : row.v9Classification === "solver-disagreement"
      ? "solver-disagreement"
      : row.v9Classification === "provenance-mismatch"
        ? "provenance-mismatch"
        : "inconclusive",
  resolved: row.resolved === true,
}));
const attributionCounts = attributionRows.reduce((total, row) => {
  total[row.attribution] = (total[row.attribution] ?? 0) + 1;
  return total;
}, {});

const rawAggregate = reports.jointValidation.rawPropagation.aggregates.dop853;
const denseComplete = completeShards.length === reports.densePlan.shardCount;
invariant(reports.kerrCampaignProgressV8.completedShardCount === completeShards.length, "V8 progress/shard coverage disagrees");
invariant(JSON.stringify(reports.kerrCampaignProgressV8.completedShardIndices) === JSON.stringify([...seenIndices].sort((left, right) => left - right)), "V8 progress/shard indices disagree");
const denseGatePassed = denseComplete && reports.denseAggregate.gatePassed === true;
const stmEvidence = optionalReports.stmReleaseEvidence ?? reports.stmSmoke;
const stmReleaseQualified = optionalReports.stmReleaseEvidence?.releaseQualificationAvailable === true;
const kerrGatePassed =
  reports.kerrGateV8.gatePassed === true &&
  reports.kerrGateV8.evaluation?.gatePassed === true;
const stmGatePassed = optionalReports.stmGate?.gatePassed === true;
const jointEvaluation = reports.jointValidation.promotionEvaluation;
const perBodyNoRegression = jointEvaluation.confirmedRegressionCount === 0 &&
  reports.jointValidation.priorFifteenRegressionClosure.allRowsResolved === true;
const effectIsolationComplete = jointEvaluation.allEffectsResolved === true;
const supportingGatesPassed = denseGatePassed && stmReleaseQualified;

const sourceSha256 = Object.fromEntries(await Promise.all([
  ...Object.entries(sourceFiles),
  ...optionalEntries.filter(([, , document]) => document !== null).map(([id, file]) => [id, file]),
  ...shardFiles.map((file) => [`shard:${path.basename(file)}`, file]),
].map(async ([id, file]) => [id, await fileSha256(file)])));

const generatedAt = [
  ...entries.map(([, , document]) => document.generatedAt),
  ...optionalEntries.map(([, , document]) => document?.generatedAt),
  ...shardEntries.map(({ document }) => document.generatedAt),
].filter(Boolean).sort((left, right) => Date.parse(left) - Date.parse(right)).at(-1);

const core = {
  version: "v241-atlas-research-campaign-manifest-v13",
  generatedAt,
  sourceSha256,
  reference: {
    coordinateFrame: reports.jointValidation.coordinateFrame,
    timeScale: reports.jointValidation.timeScale,
    fixtureSha256: reports.jointValidation.fixtureSha256,
    provenanceReady: reports.jointValidation.provenance.ready === true,
    dop853RerunPassed: reports.jointValidation.deterministicReruns.dop853.passed === true,
    ias15RerunPassed: reports.jointValidation.deterministicReruns.ias15.passed === true,
  },
  promotionInput: {
    legacyPositionRmsKm: rawAggregate.legacyPositionRmsKm,
    legacyVelocityRmsMS: rawAggregate.legacyVelocityRmsMS,
    candidatePositionRmsKm: rawAggregate.candidatePositionRmsKm,
    candidateVelocityRmsMS: rawAggregate.candidateVelocityRmsMS,
    comparativeAggregateImprovementDemonstrated: jointEvaluation.aggregateImprovement === true,
    independentPerBodyComparisonComplete: true,
    perBodyNoRegression,
    effectIsolationComplete,
    supportingGatesPassed,
  },
  weakField: {
    historicalRegressionCount: 15,
    confirmedRegressionCount: jointEvaluation.confirmedRegressionCount,
    allHistoricalRowsResolved: reports.jointValidation.priorFifteenRegressionClosure.allRowsResolved === true,
    attributionCounts,
    attributions: attributionRows,
    mercuryTenYear: reports.jointValidation.mercuryTenYear,
    fittedBlind: {
      complete: reports.jointValidation.fittedBlindPropagation.status === "complete",
      aggregateImprovement: reports.jointValidation.fittedBlindPropagation.aggregateImprovement === true,
      physicalCauseEstablished: reports.jointValidation.fittedBlindPropagation.physicalCauseEstablished === true,
    },
    effectIsolationComplete,
    uncertaintyFormula: "Ujoint=UDOP853+UIAS15+Ureference+Ufit",
  },
  denseKerr: {
    campaignVersion: "finite-observer-v8",
    freezeCommitSha: reports.kerrCampaignProgressV8.freezeCommitSha,
    freezeBranch: reports.kerrCampaignProgressV8.freezeBranch,
    campaignStatus: reports.kerrCampaignProgressV8.status,
    campaignProgressSha256: reports.kerrCampaignProgressV8.progressSha256,
    v6QuarantineManifestSha256: reports.v6ShardQuarantine.manifestSha256,
    failedShardIndex,
    failure: reports.kerrCampaignProgressV8.failure,
    noAutomaticRetry: reports.kerrCampaignProgressV8.noAutomaticRetry === true,
    profile: "release",
    plannedRayCount: 3097,
    plannedShardCount: reports.densePlan.shardCount,
    completedReleaseShardCount: completeShards.length,
    completedRayCount: completeShards.reduce((total, { document }) => total + document.rayCount, 0),
    completedExecutionCount: executions.length,
    completedShardIndices: [...seenIndices].sort((left, right) => left - right),
    attemptedRayCount: completeShards.reduce((total, { document }) => total + document.rayCount, 0) +
      (failedShardEntry?.document.rayCount ?? 0),
    attemptedExecutionCount: executions.length + failedExecutions.length,
    failedShardEvidence,
    rayClassCounts: classCounts,
    codeSha256: reports.densePlan.codeSha256,
    environmentSha256: reports.densePlan.environmentSha256,
    frozenScreenManifestSha256: reports.densePlan.finiteObserverScreenManifestSha256,
    finiteObserverScreenManifestSha256: reports.densePlan.finiteObserverScreenManifestSha256,
    planSha256: reports.densePlan.planSha256,
    maxNullConstraint,
    shortGatePassed: kerrGatePassed,
    shortGateExecuted: true,
    shortGateCanonicalEvidenceSha256:
      reports.kerrGateV8.canonicalEvidenceSha256,
    shortGateFailure: null,
    shortGateEvaluation: {
      invalidCount: reports.kerrGateV8.evaluation.invalidCount,
      nonPhysicalCount: reports.kerrGateV8.evaluation.nonPhysicalCount,
      deterministicFailureCount:
        reports.kerrGateV8.evaluation.deterministicFailureCount,
      criticalTransitionCount:
        reports.kerrGateV8.evaluation.criticalTransitionCount,
      criticalTransitionExpected:
        reports.kerrGateV8.evaluation.criticalTransitionExpected,
      maxNullConstraint: reports.kerrGateV8.evaluation.maxNullConstraint,
    },
    historicalV7: optionalReports.historicalKerrGateV7 === null ? null : {
      gatePassed: optionalReports.historicalKerrGateV7.evaluation?.gatePassed === true,
      criticalTransitionCount:
        optionalReports.historicalKerrGateV7.evaluation?.criticalTransitionCount ?? null,
      criticalTransitionExpected:
        optionalReports.historicalKerrGateV7.evaluation?.criticalTransitionExpected ?? null,
      canonicalEvidenceSha256:
        optionalReports.historicalKerrGateV7.canonicalEvidenceSha256 ?? null,
      retainedAsImmutableNegativeEvidence: true,
    },
    complete: denseComplete,
    gatePassed: denseGatePassed,
    partialResultsAggregated: false,
    blocker: denseGatePassed
      ? null
      : reports.kerrCampaignProgressV8.status === "failed"
        ? "v8-dense-campaign-failed-no-retry-no-partial-aggregation"
        : "v8-dense-release-shards-incomplete-no-partial-aggregation",
  },
  variationalStm: {
    evidenceVersion: stmEvidence.version,
    profile: stmEvidence.profile,
    shortGatePassed: stmGatePassed,
    deterministicRerunPassed: stmEvidence.deterministicRerunPassed === true,
    releaseQualificationAvailable: stmReleaseQualified,
    effectiveRank: stmEvidence.modes?.[0]?.effectiveRank ?? null,
    integratedStateAndPhiDimension: 4824,
    holdoutDays: stmEvidence.modes?.[0]?.holdoutDays ?? [],
    fitIterations: stmEvidence.modes?.[0]?.fitIterations ?? 0,
    gatePassed: stmReleaseQualified,
  },
  product: {
    localGatesPassed:
      reports.bundleStandalone.transferBytes <= 604_160 &&
      reports.bundleLite.transferBytes <= 604_160 &&
      reports.lifecycle.passed === true &&
      reports.contentPacks.passed === true &&
      reports.contentPacks.verifiedFileCount === reports.contentPacks.manifestFileCount &&
      reports.catalogExpansion.status === "ready" &&
      reports.security.status === "passed",
    standaloneTransferBytes: reports.bundleStandalone.transferBytes,
    liteTransferBytes: reports.bundleLite.transferBytes,
    contentPackVerifiedFiles: reports.contentPacks.verifiedFileCount,
    catalogExpansion: {
      version: reports.catalogExpansion.version,
      canonicalSha256: reports.catalogExpansion.canonicalSha256,
      gaiaRowCount: reports.catalogExpansion.gaia.rowCount,
      iauConstellationCount: reports.catalogExpansion.visualCounts.iauConstellations,
      asterismCount: reports.catalogExpansion.visualCounts.asterisms,
      starClusterCount: reports.catalogExpansion.visualCounts.starClusters,
      nebulaCount: reports.catalogExpansion.visualCounts.nebulae,
      activeRenderBudget: reports.catalogExpansion.activeRenderBudget,
    },
  },
  outcome: reports.kerrCampaignProgressV8.status === "failed"
    ? "relativity-v13-product-candidate-science-failed-shadow-retained"
    : supportingGatesPassed && perBodyNoRegression && effectIsolationComplete &&
      jointEvaluation.aggregateImprovement === true
      ? "relativity-v13-promotion-qualified-not-applied"
      : "relativity-v13-research-candidate-shadow-retained",
  defaultKernel: "legacy-eih-1pn",
  runtimePromotionApplied: false,
  boundary: "offline-research-campaign-no-root-contract-or-runtime-physics-mutation",
};
const document = { ...core, manifestSha256: sha256(JSON.stringify(canonical(core))) };
const jsonText = `${JSON.stringify(document, null, 2)}\n`;
const moduleText = `/* Generated by scripts/build-research-campaign-v13.mjs. */\nexport const ATLAS_RESEARCH_CAMPAIGN_INPUT_V13 = ${JSON.stringify(document, null, 2)} as const;\n`;

if (checkOnly) {
  const [existingModule, existingArtifact] = await Promise.all([
    readFile(fromRoot(generatedModule), "utf8"),
    readFile(fromRoot(releaseArtifact), "utf8"),
  ]);
  invariant(existingModule === moduleText, `${generatedModule} is stale`);
  invariant(existingArtifact === jsonText, `${releaseArtifact} is stale`);
} else {
  await mkdir(path.dirname(fromRoot(generatedModule)), { recursive: true });
  await mkdir(path.dirname(fromRoot(releaseArtifact)), { recursive: true });
  await Promise.all([
    writeFile(fromRoot(generatedModule), moduleText),
    writeFile(fromRoot(releaseArtifact), jsonText),
  ]);
}

console.log(JSON.stringify({
  mode: checkOnly ? "check" : "write",
  generatedModule,
  releaseArtifact,
  manifestSha256: document.manifestSha256,
  outcome: document.outcome,
  denseKerr: document.denseKerr,
  variationalStm: document.variationalStm,
}, null, 2));

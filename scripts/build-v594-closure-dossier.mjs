import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  assertV594,
  assertV594Authority,
  atomicWriteJsonV594,
  fileReceiptV594,
  loadCurrentV594Bundle,
  readJsonV594,
  resolveInsideV594Workspace,
  resolveV594OutputRoot,
  sameCanonicalV594,
  sealV594Document,
  validateV594Identity,
  verifyFileReceiptV594,
  verifyV594Seal,
} from "./build-v594-current-source-lifecycle.mjs";
import {
  validateV594LifecycleStage,
  V594_LIFECYCLE_RECEIPT_STATUS,
  V594_LIFECYCLE_RECEIPT_VERSION,
  V594_SCENE_EXIT_RELEASE_CONTRACT_VERSION,
} from "./build-v594-current-source-lifecycle.mjs";
import {
  validateV594SoakSemanticClosureContract,
  validateV594SoakStage,
  V594_SOAK_RECEIPT_STATUS,
  V594_SOAK_RECEIPT_VERSION,
} from "./build-v594-current-source-soak.mjs";
import {
  verifyV594ReleasedHeapSemanticEvidence,
} from "../tmp/v594-released-heap-semantic-contract.mjs";
import {
  createV594HumanChallenge,
  validateV594HumanDecisionRawBinding,
  validateV594HumanSignoff,
} from "./build-v594-human-visual-signoff.mjs";
import { V594_BROWSER_GATE_STATUS, V594_BROWSER_GATE_VERSION } from "./build-v594-final-sealed-browser-gate.mjs";
import {
  validateV594BrowserEvidence,
  V594_BROWSER_FRAME_COUNTS,
  V594_LITE_RECEIPT_STATUS,
  V594_LITE_RECEIPT_VERSION,
} from "./build-v594-current-lite-matrix.mjs";

export const V594_CLOSURE_VERSION = "v594-release-export-and-closure-dossier-v5";
export const V594_CLOSURE_STATUS =
  "passed-current-v594-stellar-relativity-export-matrices-exact-marker-lifecycle-soak-conditional-semantic-heap-and-human-signoff-approved";

const V594_RAW_MAX_FILES = 512;
const V594_RAW_MAX_FILE_BYTES = 32 * 1024 * 1024;
const V594_RAW_MAX_TOTAL_BYTES = 512 * 1024 * 1024;

async function readReceipt(root, path, label) {
  const absolute = resolveInsideV594Workspace(root, path, label);
  return Object.freeze({
    path,
    value: (await readJsonV594(absolute, label)).value,
    record: await fileReceiptV594(root, path, label),
  });
}

function assertReceiptIdentity(receipt, expected, label, tier = "standalone-full") {
  const identity = validateV594Identity(receipt.candidate, expected, { deliveryTier: tier });
  assertV594Authority(receipt.authority, label);
  assertV594(receipt.authority?.scientificPayloadMutationAllowed === false,
    `v594-closure-authority:${label}`);
  assertV594(receipt.authority?.measuredAuthorityGranted === false
    && receipt.authority?.gpuAuthorityGranted === false
    && receipt.authority?.productionReleaseAuthorized === false,
  `v594-closure-authority-fields:${label}`);
  return identity;
}

function assertSyntheticBinding(receipt, syntheticFixture, label) {
  assertV594(receipt.synthetic === (syntheticFixture === true),
    `v594-closure-synthetic-binding:${label}`);
}

function assertEvidencePath(record, explicitPath, label) {
  assertV594(record && typeof record.path === "string", `v594-closure-evidence-record:${label}`);
  if (explicitPath) assertV594(explicitPath === record.path,
    `v594-closure-evidence-path-drift:${label}`);
  return record.path;
}

async function readRecordedJson(root, record, explicitPath, label) {
  const path = assertEvidencePath(record, explicitPath, label);
  assertV594(Number.isSafeInteger(record.bytes) && record.bytes >= 0
    && record.bytes <= V594_RAW_MAX_FILE_BYTES, `v594-closure-raw-size:${label}`);
  await verifyFileReceiptV594(root, record, label);
  return Object.freeze({
    path,
    record: Object.freeze({ path: record.path, bytes: record.bytes, sha256: record.sha256 }),
    value: (await readJsonV594(resolveInsideV594Workspace(root, path, label), label)).value,
  });
}

function addEvidenceRecord(records, record, label) {
  assertV594(record && typeof record.path === "string", `v594-closure-evidence-record:${label}`);
  assertV594(Number.isSafeInteger(record.bytes) && record.bytes >= 0
    && record.bytes <= V594_RAW_MAX_FILE_BYTES, `v594-closure-raw-size:${label}`);
  const normalized = Object.freeze({ path: record.path, bytes: record.bytes, sha256: record.sha256 });
  const previous = records.get(normalized.path);
  assertV594(!previous || sameCanonicalV594(previous, normalized),
    `v594-closure-evidence-alias-drift:${label}`);
  records.set(normalized.path, normalized);
}

function collectBrowserArtifacts(records, batch, suite) {
  for (const result of batch.results ?? []) {
    addEvidenceRecord(records, result.screenshot, `${suite}:png:${result.id}`);
    addEvidenceRecord(records, result.telemetry, `${suite}:telemetry:${result.id}`);
  }
}

export async function verifyV594RawEvidenceRecords(root, inputRecords) {
  const workspace = resolve(root);
  const records = new Map();
  for (const [index, record] of (inputRecords ?? []).entries()) {
    addEvidenceRecord(records, record, `record:${index}`);
  }
  assertV594(records.size <= V594_RAW_MAX_FILES, "v594-closure-raw-file-count");
  const rawBytes = [...records.values()].reduce((total, record) => total + record.bytes, 0);
  assertV594(Number.isSafeInteger(rawBytes) && rawBytes <= V594_RAW_MAX_TOTAL_BYTES,
    "v594-closure-raw-total-size");
  for (const [path, record] of records) {
    await verifyFileReceiptV594(workspace, record, `raw:${path}`);
  }
  return Object.freeze([...records.values()]
    .sort((left, right) => left.path.localeCompare(right.path)));
}

/**
 * Recursively re-opens every raw stage/batch/PNG/telemetry and the independent
 * explicit owner-authorized decision artifact. Aggregate receipts are only
 * locators; they are never trusted
 * as substitutes for the bytes they claim to bind.
 */
export async function validateV594RawEvidenceGraph({
  root = process.cwd(),
  lifecycle,
  soak,
  lite,
  browserGate,
  human,
  expectedFullIdentity,
  expectedLiteIdentity,
  paths = {},
  aggregateRecords = {},
  aggregateCanonicalPaths = {},
  syntheticFixture = false,
} = {}) {
  const workspace = resolve(root);
  for (const [label, path] of Object.entries(aggregateCanonicalPaths)) {
    resolveInsideV594Workspace(workspace, path, `aggregate-canonical:${label}`);
  }
  const records = new Map();
  const lifecycleStage = await readRecordedJson(
    workspace, lifecycle.evidence, paths.lifecycleStage, "raw-lifecycle-stage",
  );
  const soakStage = await readRecordedJson(
    workspace, soak.evidence, paths.soakStage, "raw-soak-stage",
  );
  const semanticQualification = validateV594SoakSemanticClosureContract(soak);
  const semanticRequired = semanticQualification.semanticProofRequired;
  const semanticStage = soak.semanticEvidence
    ? await readRecordedJson(
      workspace, soak.semanticEvidence, paths.semanticStage, "raw-soak-semantic-stage",
    )
    : null;
  assertV594(semanticRequired === (semanticStage !== null),
    semanticRequired
      ? "v594-closure-semantic-stage-required"
      : "v594-closure-semantic-stage-unexpected");
  const liteStage = await readRecordedJson(
    workspace, lite.evidence?.stage, paths.liteStage, "raw-lite-stage",
  );
  const liteBatch = await readRecordedJson(
    workspace, lite.evidence?.batch, paths.liteBatch, "raw-lite-batch",
  );
  const fullStage = await readRecordedJson(
    workspace, browserGate.matrices?.full?.stage, paths.fullStage, "raw-full-stage",
  );
  const fullBatch = await readRecordedJson(
    workspace, browserGate.matrices?.full?.batch, paths.fullBatch, "raw-full-batch",
  );
  const exactStage = await readRecordedJson(
    workspace, browserGate.matrices?.exactAb?.stage, paths.exactStage, "raw-exact-stage",
  );
  const exactBatch = await readRecordedJson(
    workspace, browserGate.matrices?.exactAb?.batch, paths.exactBatch, "raw-exact-batch",
  );
  const userDecision = await readRecordedJson(
    workspace, human.userDecision, paths.userDecision, "raw-user-decision",
  );

  for (const [label, loaded] of Object.entries({ lifecycleStage, soakStage, semanticStage,
    liteStage, liteBatch, fullStage, fullBatch, exactStage, exactBatch, userDecision })) {
    if (!loaded) continue;
    addEvidenceRecord(records, loaded.record, label);
  }
  for (const checkpoint of semanticStage?.value?.checkpoints ?? []) {
    addEvidenceRecord(records, checkpoint.artifact,
      `semantic-snapshot:${checkpoint.label ?? "unknown"}`);
  }
  if (aggregateRecords.lite) {
    await verifyFileReceiptV594(workspace, aggregateRecords.lite, "raw-lite-receipt");
    const expected = browserGate.matrices?.lite?.receipt;
    assertV594(expected?.path === (aggregateCanonicalPaths.lite ?? aggregateRecords.lite.path)
      && expected?.bytes === aggregateRecords.lite.bytes
      && expected?.sha256 === aggregateRecords.lite.sha256,
      "v594-closure-lite-receipt-file-binding");
  }
  if (aggregateRecords.browserGate) {
    await verifyFileReceiptV594(workspace, aggregateRecords.browserGate, "raw-browser-gate-receipt");
    assertV594(human.browserGate?.path
      === (aggregateCanonicalPaths.browserGate ?? aggregateRecords.browserGate.path)
      && human.browserGate?.bytes === aggregateRecords.browserGate.bytes
      && human.browserGate?.sha256 === aggregateRecords.browserGate.sha256,
      "v594-closure-human-browser-file-binding");
  }
  for (const [suite, batch] of [["lite", liteBatch.value], ["full", fullBatch.value],
    ["exact-ab", exactBatch.value]]) collectBrowserArtifacts(records, batch, suite);
  const verifiedEvidence = await verifyV594RawEvidenceRecords(
    workspace, [...records.values()],
  );

  const lifecycleResult = validateV594LifecycleStage(
    lifecycleStage.value, expectedFullIdentity, { syntheticFixture },
  );
  assertV594(lifecycle.stageReceiptSha256 === lifecycleStage.value.receiptSha256
    && lifecycle.phaseCount === lifecycleResult.phaseCount,
  "v594-closure-lifecycle-stage-binding");
  const soakResult = validateV594SoakStage(
    soakStage.value, expectedFullIdentity, {
      syntheticFixture,
      semanticEvidence: semanticStage?.value ?? null,
    },
  );
  assertV594(soak.stageReceiptSha256 === soakStage.value.receiptSha256
    && soak.cycleCount === soakResult.cycleCount && soak.sampleCount === soakResult.sampleCount,
  "v594-closure-soak-stage-binding");
  let semanticVerification = null;
  if (semanticStage) {
    semanticVerification = await verifyV594ReleasedHeapSemanticEvidence({
      root: workspace,
      evidence: semanticStage.value,
      expectedIdentity: expectedFullIdentity,
      expectedSoakStageReceiptSha256: soakStage.value.receiptSha256,
      expectedRawMetricsSha256: soak.rawMetricsSha256,
    });
    assertV594(soak.semanticStageReceiptSha256 === semanticStage.value.receiptSha256
      && soak.semanticVerification?.passed === true
      && soak.semanticVerification?.receiptSha256 === semanticVerification.receiptSha256
      && sameCanonicalV594(
        soak.semanticVerification?.rebuiltCheckpoints,
        semanticVerification.rebuiltCheckpoints,
      ),
    "v594-closure-semantic-verification-binding");
  }
  const liteResult = await validateV594BrowserEvidence({
    root: workspace,
    stage: liteStage.value,
    batch: liteBatch.value,
    stagePath: liteStage.path,
    batchPath: liteBatch.path,
    expectedIdentity: expectedLiteIdentity,
    suite: "lite",
    syntheticFixture,
  });
  assertV594(lite.stageReceiptSha256 === liteResult.stageReceiptSha256
    && lite.batchSha256 === liteResult.batchSha256
    && lite.frameCount === liteResult.frameCount,
  "v594-closure-lite-raw-binding");
  const fullResult = await validateV594BrowserEvidence({
    root: workspace,
    stage: fullStage.value,
    batch: fullBatch.value,
    stagePath: fullStage.path,
    batchPath: fullBatch.path,
    expectedIdentity: expectedFullIdentity,
    suite: "full",
    syntheticFixture,
  });
  const exactResult = await validateV594BrowserEvidence({
    root: workspace,
    stage: exactStage.value,
    batch: exactBatch.value,
    stagePath: exactStage.path,
    batchPath: exactBatch.path,
    expectedIdentity: expectedFullIdentity,
    suite: "exact-ab",
    syntheticFixture,
  });
  assertV594(exactStage.value.gates?.exactRelativityObservationMarker === true
    && browserGate.exactRelativityObservationMarkerVerified === true
    && browserGate.matrices?.exactAb?.relativityObservationMarkerVerified === true,
  "v594-closure-raw-relativity-observation-marker");
  assertV594(browserGate.matrices.full.stageReceiptSha256 === fullResult.stageReceiptSha256
    && browserGate.matrices.full.batchSha256 === fullResult.batchSha256
    && browserGate.matrices.full.frameCount === fullResult.frameCount,
  "v594-closure-full-raw-binding");
  assertV594(browserGate.matrices.exactAb.stageReceiptSha256 === exactResult.stageReceiptSha256
    && browserGate.matrices.exactAb.batchSha256 === exactResult.batchSha256
    && browserGate.matrices.exactAb.frameCount === exactResult.frameCount,
  "v594-closure-exact-raw-binding");
  const challenge = createV594HumanChallenge(browserGate, { syntheticFixture });
  const decisionResult = validateV594HumanDecisionRawBinding({
    human,
    decision: userDecision.value,
    challenge,
    syntheticFixture,
  });
  assertV594(sameCanonicalV594(human.decisionChallenge, challenge)
    && human.decisionChallengeSha256 === decisionResult.challengeSha256
    && human.decisionSha256 === decisionResult.decisionSha256,
  "v594-closure-human-decision-rebuild-binding");
  const evidenceTracked = verifiedEvidence;
  return Object.freeze({
    lifecycleStage: lifecycleStage.value,
    soakStage: soakStage.value,
    semanticStage: semanticStage?.value ?? null,
    semanticVerification,
    liteStage: liteStage.value,
    liteBatch: liteBatch.value,
    fullStage: fullStage.value,
    fullBatch: fullBatch.value,
    exactStage: exactStage.value,
    exactBatch: exactBatch.value,
    userDecision: userDecision.value,
    evidenceTracked,
    decision: decisionResult,
  });
}

export async function validateV594ClosureInputs({
  lifecycle,
  soak,
  lite,
  browserGate,
  human,
  lifecycleStage,
  soakStage,
  semanticStage,
  fullStage,
  fullBatch,
  exactStage,
  exactBatch,
  expectedFullIdentity,
  expectedLiteIdentity,
  syntheticFixture = false,
} = {}) {
  const full = validateV594Identity(expectedFullIdentity, null, { deliveryTier: "standalone-full" });
  const liteIdentity = validateV594Identity(expectedLiteIdentity, null, { deliveryTier: "vercel-lite" });
  verifyV594Seal(lifecycle, "receiptSha256", "closure-lifecycle");
  verifyV594Seal(soak, "receiptSha256", "closure-soak");
  verifyV594Seal(lite, "receiptSha256", "closure-lite");
  const lifecycleIdentity = assertReceiptIdentity(lifecycle, full, "lifecycle");
  const soakIdentity = assertReceiptIdentity(soak, full, "soak");
  const liteReceiptIdentity = assertReceiptIdentity(lite, liteIdentity, "lite", "vercel-lite");
  verifyV594Seal(browserGate, "receiptSha256", "closure-browser-gate");
  assertV594(browserGate.version === V594_BROWSER_GATE_VERSION
    && browserGate.status === V594_BROWSER_GATE_STATUS,
  "v594-closure-browser-gate-contract");
  assertReceiptIdentity(browserGate, full, "browser-gate");
  const humanResult = validateV594HumanSignoff(human, full, { syntheticFixture });
  assertV594(lifecycle.version === V594_LIFECYCLE_RECEIPT_VERSION
    && lifecycle.status === V594_LIFECYCLE_RECEIPT_STATUS,
  "v594-closure-lifecycle-contract");
  assertV594(soak.version === V594_SOAK_RECEIPT_VERSION
    && soak.status === V594_SOAK_RECEIPT_STATUS,
  "v594-closure-soak-contract");
  validateV594SoakSemanticClosureContract(soak);
  assertV594(lite.version === V594_LITE_RECEIPT_VERSION
    && lite.status === V594_LITE_RECEIPT_STATUS,
  "v594-closure-lite-contract");
  assertV594(lifecycle.phaseCount === 9 && lifecycle.sameRealm === true
    && lifecycle.releaseContractVersion === V594_SCENE_EXIT_RELEASE_CONTRACT_VERSION
    && lifecycle.detachedObservedReleaseContract === true
    && lifecycle.exitedObservedReleaseContract === true
    && lifecycle.detachedRendererInfoCountsUnavailableAfterContextLoss === true
    && lifecycle.exitedRendererInfoCountsUnavailableAfterContextLoss === true
    && lifecycle.snapshotReuseWitness === true
    && lifecycle.detachedAndExitedSnapshotCanonicalEqual === true,
  "v594-closure-lifecycle-gates");
  assertV594(soak.cycleCount === 40 && soak.sampleCount === 161
    && soak.sameRealm === true
    && soak.releaseContractVersion === V594_SCENE_EXIT_RELEASE_CONTRACT_VERSION
    && soak.detachedAndExitedObservedReleaseContract === true
    && soak.detachedAndExitedRendererInfoCountsUnavailableAfterContextLoss === true
    && soak.snapshotReuseWitness === true
    && soak.detachedAndExitedSnapshotCanonicalEqual === true
    && soak.releaseCompletionObserved === true
    && soak.releaseCompletionTransition === "next-link-route-exit"
    && soak.releaseCompletionObservedAfterPhase === "exited"
    && soak.releaseCompletionTeardownCanonicalEqualsExit === true
    && soak.detachedPreReleaseObserverReleased === null
    && soak.heapQualification?.rawHardGatesPassed === true
    && typeof soak.heapQualification?.semanticProofRequired === "boolean"
    && soak.heapQualification.semanticProofRequired
      === (soak.semanticEvidence !== null && soak.semanticEvidence !== undefined)
    && (soak.heapQualification.semanticProofRequired
      ? soak.heapQualification.semanticFallbackApplied === true
        && soak.semanticStageReceiptSha256 === soak.semanticVerification?.receiptSha256
        && soak.semanticVerification?.passed === true
      : soak.semanticStageReceiptSha256 === null && soak.semanticVerification === null),
  "v594-closure-soak-gates");
  assertV594(lite.frameCount === V594_BROWSER_FRAME_COUNTS.lite,
    "v594-closure-lite-frame-count");
  assertV594(browserGate.fullLiteIndependentBuilds === true
    && browserGate.exactAbSameStandaloneBuild === true
    && browserGate.exactRelativityObservationMarkerVerified === true
    && browserGate.matrices?.exactAb?.relativityObservationMarkerVerified === true,
  "v594-closure-browser-separation");
  assertV594(liteReceiptIdentity.buildId !== full.buildId,
    "v594-closure-lite-build-alias");
  assertV594(browserGate.matrices?.exactAb?.pairCount === 8
    && browserGate.matrices?.exactAb?.frameCount === V594_BROWSER_FRAME_COUNTS["exact-ab"]
    && browserGate.matrices?.full?.frameCount === V594_BROWSER_FRAME_COUNTS.full
    && browserGate.matrices?.lite?.frameCount === V594_BROWSER_FRAME_COUNTS.lite,
  "v594-closure-exact-envelope");
  assertV594(browserGate.matrices?.lite?.receiptSha256 === lite.receiptSha256,
    "v594-closure-lite-receipt-binding");
  validateV594Identity(browserGate.matrices?.lite?.candidate, liteReceiptIdentity, {
    deliveryTier: "vercel-lite",
  });
  assertV594(human.decisionChallenge?.browserGateReceiptSha256 === browserGate.receiptSha256,
    "v594-closure-human-browser-binding");
  assertV594(human.decisionChallenge?.exactBatchSha256 === browserGate.matrices.exactAb.batchSha256,
    "v594-closure-human-exact-binding");
  for (const [label, receipt] of [["lifecycle", lifecycle], ["soak", soak], ["lite", lite],
    ["browser-gate", browserGate], ["human", human]]) {
    assertSyntheticBinding(receipt, syntheticFixture, label);
  }
  if (lifecycleStage) {
    const stageResult = validateV594LifecycleStage(lifecycleStage, full, { syntheticFixture });
    assertV594(stageResult.phaseCount === lifecycle.phaseCount,
      "v594-closure-lifecycle-stage-receipt-count");
  }
  if (soakStage) {
    const stageResult = validateV594SoakStage(soakStage, full, {
      syntheticFixture,
      semanticEvidence: semanticStage ?? null,
    });
    assertV594(stageResult.sampleCount === soak.sampleCount,
      "v594-closure-soak-stage-receipt-count");
  }
  for (const [label, value] of [["fullStage", fullStage], ["fullBatch", fullBatch],
    ["exactStage", exactStage], ["exactBatch", exactBatch]]) {
    if (value) verifyV594Seal(value, label.endsWith("Batch") ? "batchSha256" : "receiptSha256", label);
  }
  if (exactStage) assertV594(exactStage.gates?.exactRelativityObservationMarker === true,
    "v594-closure-exact-stage-relativity-observation-marker");
  return Object.freeze({ full, lite: liteReceiptIdentity, lifecycle: lifecycleIdentity,
    soak: soakIdentity, human: humanResult, browserGateReceiptSha256: browserGate.receiptSha256 });
}

export async function buildV594ClosureDossier({
  root = process.cwd(),
  outputRoot = root,
  lifecyclePath = "docs/release/v594/resource-lifecycle-v594.json",
  soakPath = "docs/release/v594/soak-v594.json",
  litePath = "docs/release/v594/lite-browser-matrix-v594.json",
  browserGatePath = "docs/release/v594/final-sealed-browser-gate-v594.json",
  humanPath = "docs/release/v594/human-visual-signoff-v594.json",
  lifecycleStagePath,
  soakStagePath,
  semanticStagePath,
  liteStagePath,
  liteBatchPath,
  fullStagePath,
  fullBatchPath,
  exactStagePath,
  exactBatchPath,
  aggregateCanonicalPaths = {},
  outputPath = "docs/release/v594/release-export-v594.json",
  syntheticFixture = false,
} = {}) {
  const bundle = await loadCurrentV594Bundle(root, { requireBuilds: true });
  const paths = { lifecycle: lifecyclePath, soak: soakPath, lite: litePath,
    browserGate: browserGatePath, human: humanPath };
  const loaded = {};
  for (const [label, path] of Object.entries(paths)) loaded[label] = await readReceipt(bundle.workspace, path, label);
  const optional = {};
  for (const [label, path] of [["lifecycleStage", lifecycleStagePath], ["soakStage", soakStagePath],
    ["semanticStage", semanticStagePath],
    ["fullStage", fullStagePath], ["fullBatch", fullBatchPath], ["exactStage", exactStagePath],
    ["exactBatch", exactBatchPath]]) {
    if (path) optional[label] = (await readReceipt(bundle.workspace, path, label)).value;
  }
  const validated = await validateV594ClosureInputs({
    root: bundle.workspace,
    lifecycle: loaded.lifecycle.value,
    soak: loaded.soak.value,
    lite: loaded.lite.value,
    browserGate: loaded.browserGate.value,
    human: loaded.human.value,
    lifecycleStage: optional.lifecycleStage,
    soakStage: optional.soakStage,
    semanticStage: optional.semanticStage,
    fullStage: optional.fullStage,
    fullBatch: optional.fullBatch,
    exactStage: optional.exactStage,
    exactBatch: optional.exactBatch,
    expectedFullIdentity: bundle.identities.standalone,
    expectedLiteIdentity: bundle.identities.lite,
    syntheticFixture,
  });
  const raw = await validateV594RawEvidenceGraph({
    root: bundle.workspace,
    lifecycle: loaded.lifecycle.value,
    soak: loaded.soak.value,
    lite: loaded.lite.value,
    browserGate: loaded.browserGate.value,
    human: loaded.human.value,
    expectedFullIdentity: bundle.identities.standalone,
    expectedLiteIdentity: bundle.identities.lite,
    paths: {
      lifecycleStage: lifecycleStagePath,
      soakStage: soakStagePath,
      semanticStage: semanticStagePath,
      liteStage: liteStagePath,
      liteBatch: liteBatchPath,
      fullStage: fullStagePath,
      fullBatch: fullBatchPath,
      exactStage: exactStagePath,
      exactBatch: exactBatchPath,
    },
    aggregateRecords: {
      lite: loaded.lite.record,
      browserGate: loaded.browserGate.record,
    },
    aggregateCanonicalPaths,
    syntheticFixture,
  });
  const candidate = bundle.candidate;
  assertV594(candidate.stellar?.admission?.rosterCount === 24
    && candidate.stellar?.admission?.presentationAdmittedCount === 24
    && candidate.stellar?.admission?.measurementAdmittedCount === 0,
  "v594-closure-stellar-provenance-boundary");
  assertV594(candidate.relativity?.adaptiveConvergenceQualified === true
    && candidate.relativity?.promotionDecision === false,
  "v594-closure-relativity-boundary");
  const unsigned = {
    version: V594_CLOSURE_VERSION,
    generatedAt: bundle.source.generatedAt,
    status: V594_CLOSURE_STATUS,
    candidate: validated.full,
    parentV593: {
      sourceManifestSha256: candidate.parentV593?.identity?.sourceManifestSha256,
      manifestSha256: candidate.parentV593?.identity?.manifestSha256,
      formalProductPointer: "v263",
    },
    stellar: {
      status: candidate.stellar.status,
      rosterCount: candidate.stellar.admission.rosterCount,
      presentationAdmittedCount: candidate.stellar.admission.presentationAdmittedCount,
      measurementAdmittedCount: candidate.stellar.admission.measurementAdmittedCount,
      scientificAuthorityGranted: false,
    },
    relativity: {
      status: candidate.relativity.status,
      trajectoryStatus: candidate.relativity.trajectoryStatus,
      adaptiveConvergenceQualified: true,
      defaultKernel: "legacy-eih-1pn",
      v2Mode: "shadow-only",
      promotionDecision: false,
    },
    fullBuild: await fileReceiptV594(bundle.workspace, "dist/release/atlas-v594-standalone-build-resource.json", "full-build"),
    liteBuild: await fileReceiptV594(bundle.workspace, "dist/release/atlas-v594-lite-build-resource.json", "lite-build"),
    lifecycle: { receiptSha256: loaded.lifecycle.value.receiptSha256, evidence: loaded.lifecycle.value.evidence },
    soak: {
      receiptSha256: loaded.soak.value.receiptSha256,
      evidence: loaded.soak.value.evidence,
      rawMetricsSha256: loaded.soak.value.rawMetricsSha256,
      heapQualification: loaded.soak.value.heapQualification,
      semanticEvidence: loaded.soak.value.semanticEvidence,
      semanticStageReceiptSha256: loaded.soak.value.semanticStageReceiptSha256,
    },
    liteBrowser: { receiptSha256: loaded.lite.value.receiptSha256, evidence: loaded.lite.value.evidence },
    browserGate: {
      receiptSha256: loaded.browserGate.value.receiptSha256,
      exactRelativityObservationMarkerVerified: true,
    },
    humanReview: { receiptSha256: loaded.human.value.receiptSha256,
      decisionSha256: loaded.human.value.decisionSha256,
      challengeSha256: loaded.human.value.decisionChallengeSha256 },
    qualification: {
      version: "v594-stellar-relativity-qualification-layer-v1",
      status: "qualified-additive-v594-stellar-relativity-candidate",
      sourceIdentityStage: "ready-for-formal-evidence-source-identity",
      candidateIdentityStage: "ready-for-formal-evidence-candidate-identity",
      candidate: validated.full,
      sourceAndCandidateIdentityMutatedByQualification: false,
      productionPromotionAllowed: false,
    },
    evidenceTracked: raw.evidenceTracked,
    gates: {
      fullLiteBrowserMatrices: true,
      exactAbEightPairs: true,
      exactRelativityObservationMarker: true,
      sameRealmLifecycle: true,
      cdpRendererHeapSoak: true,
      releasedHeapRawQualification: true,
      releasedHeapSemanticProofRequired:
        loaded.soak.value.heapQualification.semanticProofRequired,
      releasedHeapSemanticProofSatisfied:
        loaded.soak.value.heapQualification.semanticProofRequired
          ? raw.semanticStage !== null && raw.semanticVerification?.passed === true
          : null,
      stellarProvenancePresentationOnly: true,
      relativityShadowOnly: true,
      humanVisualSignoff: true,
      unknownAndZeroFailClosed: true,
    },
    authority: { ...candidate.authority },
    productionPromotionAllowed: false,
    unresolved: [],
    synthetic: syntheticFixture,
  };
  assertV594Authority(unsigned.authority, "closure");
  const dossier = sealV594Document(unsigned, "dossierSha256");
  if (!syntheticFixture) await atomicWriteJsonV594(
    await resolveV594OutputRoot(bundle.workspace, outputRoot, "closure-output"),
    outputPath,
    dossier,
    "closure-output",
  );
  return dossier;
}

function parseArgs(argv) {
  const values = {};
  const names = ["lifecycle", "soak", "lite", "browser-gate", "human", "output",
    "lifecycle-stage", "soak-stage", "semantic-stage", "lite-stage", "lite-batch", "full-stage",
    "full-batch", "exact-stage", "exact-batch", "validate-fixture"];
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (names.some((name) => `--${name}` === token)) values[token.slice(2)] = argv[++index];
    else throw new Error(`v594-closure-argument:${token}`);
  }
  if (values["validate-fixture"]) {
    const parts = values["validate-fixture"].split(",");
    assertV594(parts.length === 5, "v594-closure-fixture-format");
    [values.lifecycle, values.soak, values.lite, values["browser-gate"], values.human] = parts;
    values.syntheticFixture = true;
  }
  return values;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dossier = await buildV594ClosureDossier({
    lifecyclePath: args.lifecycle,
    soakPath: args.soak,
    litePath: args.lite,
    browserGatePath: args["browser-gate"],
    humanPath: args.human,
    lifecycleStagePath: args["lifecycle-stage"],
    soakStagePath: args["soak-stage"],
    semanticStagePath: args["semantic-stage"],
    liteStagePath: args["lite-stage"],
    liteBatchPath: args["lite-batch"],
    fullStagePath: args["full-stage"],
    fullBatchPath: args["full-batch"],
    exactStagePath: args["exact-stage"],
    exactBatchPath: args["exact-batch"],
    outputPath: args.output,
    syntheticFixture: args.syntheticFixture === true,
  });
  process.stdout.write(`${JSON.stringify({ status: dossier.status,
    dossierSha256: dossier.dossierSha256,
    humanDecisionSha256: dossier.humanReview.decisionSha256,
    synthetic: dossier.synthetic }, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}

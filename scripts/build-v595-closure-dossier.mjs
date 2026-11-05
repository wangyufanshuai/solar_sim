import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  assertV595Authority,
  assertV595Formal,
  atomicWriteJsonV595Formal,
  fileReceiptV595Formal,
  loadCurrentV595Bundle,
  readJsonV595Formal,
  sameCanonicalV595Formal,
  sealV595FormalDocument,
  validateV595Identity,
  verifyFileReceiptV595Formal,
  verifyV595FormalSeal,
  V595_FORMAL_PRODUCT_POINTER,
  V595_PARENT_V594_IDENTITY,
} from "./v595-formal-contract.mjs";
import {
  validateV595LifecycleStage,
  V595_LIFECYCLE_RECEIPT_STATUS,
  V595_LIFECYCLE_SYNTHETIC_RECEIPT_STATUS,
  V595_LIFECYCLE_RECEIPT_VERSION,
  V595_SCENE_EXIT_RELEASE_CONTRACT_VERSION,
} from "./build-v595-current-source-lifecycle.mjs";
import {
  validateV595SoakStage,
  V595_SOAK_RECEIPT_STATUS,
  V595_SOAK_SYNTHETIC_RECEIPT_STATUS,
  V595_SOAK_RECEIPT_VERSION,
} from "./build-v595-current-source-soak.mjs";
import {
  validateV595BrowserEvidence,
  validateV595LiteReceipt,
  V595_LITE_RECEIPT_STATUS,
  V595_LITE_RECEIPT_VERSION,
} from "./build-v595-current-lite-matrix.mjs";
import {
  validateV595ProductSceneFamilyReceipt,
  validateV595RealDesktopReceipt,
  validateV595StellarMatrixReceipt,
  V595_BROWSER_GATE_STATUS,
  V595_BROWSER_GATE_VERSION,
} from "./build-v595-final-sealed-browser-gate.mjs";
import {
  createV595HumanChallenge,
  validateV595HumanDecisionRawBinding,
  validateV595HumanSignoff,
  V595_EXACT_AB_LANES,
  V595_HUMAN_REVIEW_PASSES,
  V595_PRODUCT_SCENE_FAMILIES,
} from "./build-v595-human-visual-signoff.mjs";

export const V595_CLOSURE_VERSION =
  "v595-release-export-and-closure-dossier-v1";
export const V595_CLOSURE_STATUS =
  "passed-current-v595-stellar-relativity-full-lite-exact-24x2-six-family-lifecycle-soak-real-desktop-and-human-signoff-approved";
export const V595_QUALIFICATION_STATUS =
  "qualified-additive-v595-stellar-relativity-candidate";

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const V595_RAW_MAX_FILES = 4096;
const V595_RAW_MAX_FILE_BYTES = 128 * 1024 * 1024;
const V595_RAW_MAX_TOTAL_BYTES = 2 * 1024 * 1024 * 1024;
const V595_RAW_MAX_JSON_DEPTH = 64;

function assertSyntheticBinding(receipt, syntheticFixture, label) {
  assertV595Formal(
    receipt.synthetic === (syntheticFixture === true),
    `v595-closure-synthetic-binding:${label}`,
  );
}

function assertReceiptIdentity(receipt, expected, label, tier = "standalone-full") {
  const identity = validateV595Identity(receipt.candidate, expected, {
    deliveryTier: tier,
  });
  assertV595Authority(receipt.authority, `closure:${label}`);
  return identity;
}

function isFileRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    && typeof value.path === "string"
    && Number.isSafeInteger(value.bytes)
    && value.bytes >= 0
    && SHA256_PATTERN.test(value.sha256 ?? "");
}

function normalizeRecord(record, label) {
  assertV595Formal(isFileRecord(record), `v595-closure-evidence-record:${label}`);
  assertV595Formal(
    record.bytes <= V595_RAW_MAX_FILE_BYTES,
    `v595-closure-raw-size:${label}`,
  );
  return Object.freeze({
    path: record.path,
    bytes: record.bytes,
    sha256: record.sha256,
  });
}

function addEvidenceRecord(records, record, label) {
  const normalized = normalizeRecord(record, label);
  const previous = records.get(normalized.path);
  assertV595Formal(
    !previous || sameCanonicalV595Formal(previous, normalized),
    `v595-closure-evidence-alias-drift:${label}`,
  );
  records.set(normalized.path, normalized);
  assertV595Formal(
    records.size <= V595_RAW_MAX_FILES,
    "v595-closure-raw-file-count",
  );
  return previous === undefined;
}

function discoverFileRecords(value, records, label, depth = 0, seen = new WeakSet()) {
  assertV595Formal(depth <= V595_RAW_MAX_JSON_DEPTH, "v595-closure-raw-json-depth");
  if (!value || typeof value !== "object") return;
  if (seen.has(value)) return;
  seen.add(value);
  if (isFileRecord(value)) addEvidenceRecord(records, value, label);
  if (Array.isArray(value)) {
    for (const [index, row] of value.entries()) {
      discoverFileRecords(row, records, `${label}[${index}]`, depth + 1, seen);
    }
    return;
  }
  for (const [key, row] of Object.entries(value)) {
    discoverFileRecords(row, records, `${label}.${key}`, depth + 1, seen);
  }
}

function assertAggregateContract(receipt, version, status, label) {
  verifyV595FormalSeal(receipt, "receiptSha256", `closure:${label}`);
  assertV595Formal(
    receipt.version === version && receipt.status === status,
    `v595-closure-${label}-contract`,
  );
}

function assertCandidateBoundaries(candidate) {
  assertV595Formal(
    candidate?.governance?.parentV594Immutable === true
      && candidate.governance.priorV594HumanDecisionInherited === false
      && candidate.governance.parentSourceManifestSha256
        === V595_PARENT_V594_IDENTITY.sourceManifestSha256
      && candidate.governance.parentCandidateManifestSha256
        === V595_PARENT_V594_IDENTITY.candidateManifestSha256
      && candidate.governance.parentReleaseDossierSha256
        === V595_PARENT_V594_IDENTITY.releaseDossierSha256
      && candidate.governance.parentResealReceiptSha256
        === V595_PARENT_V594_IDENTITY.resealReceiptSha256,
    "v595-closure-parent-v594-governance",
  );
  assertV595Formal(
    candidate?.parentV594?.sourceManifestSha256
        === V595_PARENT_V594_IDENTITY.sourceManifestSha256
      && candidate.parentV594.candidateManifestSha256
        === V595_PARENT_V594_IDENTITY.candidateManifestSha256
      && candidate.parentV594.releaseDossierSha256
        === V595_PARENT_V594_IDENTITY.releaseDossierSha256
      && candidate.parentV594.resealReceiptSha256
        === V595_PARENT_V594_IDENTITY.resealReceiptSha256
      && candidate.parentV594.formalProductPointer === V595_FORMAL_PRODUCT_POINTER,
    "v595-closure-parent-v594-identity",
  );
  assertV595Formal(
    candidate?.stellar?.rosterCount === 24
      && candidate.stellar.presentationAdmittedCount === 24
      && candidate.stellar.measurementAdmittedCount === 0
      && candidate.stellar.presentationOnly === true
      && candidate.stellar.resolvedSurfaceClaim === false
      && candidate.stellar.observationTextureClaim === false,
    "v595-closure-stellar-authority-boundary",
  );
  assertV595Formal(
    candidate?.productSceneFamilies?.familyCount === 6
      && sameCanonicalV595Formal(
        candidate.productSceneFamilies.orderedFamilyIds,
        V595_PRODUCT_SCENE_FAMILIES,
      )
      && candidate.productSceneFamilies.sharedMainCanvas === true
      && candidate.productSceneFamilies.webglCanvasCount === 1
      && candidate.productSceneFamilies.independentWebglSceneCountClaim === false,
    "v595-closure-product-scene-family-boundary",
  );
  const timelike = candidate?.relativity?.timelikeKerr;
  assertV595Formal(
    candidate?.relativity?.inheritedWeakFieldDefaultKernel === "legacy-eih-1pn"
      && candidate.relativity.inheritedV2Mode === "shadow-only"
      && timelike?.fixtureCount === 4
      && timelike.analyticAnchorCount === 3
      && timelike.referenceCandidateOnly === true
      && timelike.formalEvidence === false
      && timelike.promotion === "none",
    "v595-closure-timelike-reference-boundary",
  );
  for (const field of ["admissionSha256", "receiptSha256", "manifestSha256",
    "summarySha256", "sourceSha256"]) {
    assertV595Formal(
      SHA256_PATTERN.test(timelike[field] ?? ""),
      `v595-closure-timelike-sha:${field}`,
    );
  }
  assertV595Authority(candidate.authority, "closure-candidate");
  return Object.freeze({ timelike });
}

function validateV595BrowserAggregate(
  browserGate,
  candidate,
  expectedFullIdentity,
  expectedLiteIdentity,
) {
  assertAggregateContract(
    browserGate,
    V595_BROWSER_GATE_VERSION,
    V595_BROWSER_GATE_STATUS,
    "browser-gate",
  );
  assertReceiptIdentity(browserGate, expectedFullIdentity, "browser-gate");
  const challenge = createV595HumanChallenge(browserGate, {
    candidateDocument: candidate,
    expectedFullIdentity,
    expectedLiteIdentity,
    syntheticFixture: browserGate.synthetic === true,
  });
  assertV595Formal(
    browserGate.fullLiteIndependentBuilds === true
      && browserGate.exactAbSameStandaloneBuild === true,
    "v595-closure-browser-build-separation",
  );
  assertV595Formal(
    browserGate.matrices?.full?.frameCount === 13
      && browserGate.matrices?.lite?.frameCount === 8
      && browserGate.matrices?.exactAb?.pairCount === 8
      && browserGate.matrices?.exactAb?.frameCount === 16
      && sameCanonicalV595Formal(
        browserGate.matrices.exactAb.passes,
        V595_HUMAN_REVIEW_PASSES,
      )
      && sameCanonicalV595Formal(
        browserGate.matrices.exactAb.lanes,
        V595_EXACT_AB_LANES,
      )
      && browserGate.matrices?.stellarScienceCinematic?.targetCount === 24
      && browserGate.matrices.stellarScienceCinematic.modeCount === 2
      && browserGate.matrices.stellarScienceCinematic.frameCount === 48
      && browserGate.matrices?.productSceneFamilies?.familyCount === 6
      && sameCanonicalV595Formal(
        browserGate.matrices.productSceneFamilies.orderedFamilies,
        V595_PRODUCT_SCENE_FAMILIES,
      ),
    "v595-closure-browser-matrix-envelope",
  );
  assertV595Formal(
    browserGate.priorV594HumanDecisionInherited === false
      || browserGate.governance?.priorV594HumanDecisionInherited === false,
    "v595-closure-browser-prior-human-inheritance",
  );
  return challenge;
}

export function validateV595ClosureInputs({
  lifecycle,
  soak,
  lite,
  browserGate,
  human,
  candidate,
  expectedFullIdentity,
  expectedLiteIdentity,
  syntheticFixture = false,
} = {}) {
  const full = validateV595Identity(expectedFullIdentity, null, {
    deliveryTier: "standalone-full",
  });
  const liteIdentity = validateV595Identity(expectedLiteIdentity, null, {
    deliveryTier: "vercel-lite",
  });
  assertCandidateBoundaries(candidate);

  assertAggregateContract(
    lifecycle,
    V595_LIFECYCLE_RECEIPT_VERSION,
    syntheticFixture
      ? V595_LIFECYCLE_SYNTHETIC_RECEIPT_STATUS
      : V595_LIFECYCLE_RECEIPT_STATUS,
    "lifecycle",
  );
  const lifecycleIdentity = assertReceiptIdentity(lifecycle, full, "lifecycle");
  assertV595Formal(
    lifecycle.phaseCount === 9
      && lifecycle.sameRealm === true
      && lifecycle.releaseContractVersion === V595_SCENE_EXIT_RELEASE_CONTRACT_VERSION
      && lifecycle.observations?.oneCanvasMount === true
      && lifecycle.observations?.oneCanvasReplace === true
      && lifecycle.observations?.detach === true
      && lifecycle.observations?.clientRouteExit === "/downloads"
      && lifecycle.observations?.observedKnownZeroAfterDetach === true
      && lifecycle.observations?.observedKnownZeroAfterExit === true
      && lifecycle.observations?.rendererInfoAfterContextLoss
        === "explicitly-unavailable-not-zero"
      && lifecycle.detachedAndExitedSnapshotCanonicalEqual === true
      && lifecycle.snapshotReuseWitness === true,
    "v595-closure-lifecycle-gates",
  );

  assertAggregateContract(
    soak,
    V595_SOAK_RECEIPT_VERSION,
    syntheticFixture ? V595_SOAK_SYNTHETIC_RECEIPT_STATUS : V595_SOAK_RECEIPT_STATUS,
    "soak",
  );
  const soakIdentity = assertReceiptIdentity(soak, full, "soak");
  assertV595Formal(
    Number.isSafeInteger(soak.shardCount) && soak.shardCount > 0
      && Number.isSafeInteger(soak.cycleCount) && soak.cycleCount > 0
      && Number.isSafeInteger(soak.sampleCount) && soak.sampleCount > soak.cycleCount
      && soak.aggregation?.allShardsComplete === true
      && soak.aggregation?.unknownShardCount === 0
      && soak.aggregation?.failedShardCount === 0
      && soak.heapQualification?.telemetry === "chromium-cdp-runtime-getHeapUsage"
      && soak.heapQualification?.finalHeapWithinAllowance === true
      && soak.heapQualification?.tailOlsWithinLimit === true
      && soak.heapQualification?.sustainedGrowth === false
      && soak.heapQualification?.noSyntheticSubstitution === true
      && soak.sameRealm === true
      && soak.finalClientRouteExit === "/downloads"
      && soak.releaseContractVersion === V595_SCENE_EXIT_RELEASE_CONTRACT_VERSION
      && soak.rendererInfoAfterContextLoss === "explicitly-unavailable-not-zero",
    "v595-closure-soak-gates",
  );

  assertAggregateContract(
    lite,
    V595_LITE_RECEIPT_VERSION,
    V595_LITE_RECEIPT_STATUS,
    "lite",
  );
  const liteReceiptIdentity = assertReceiptIdentity(
    lite,
    liteIdentity,
    "lite",
    "vercel-lite",
  );
  assertV595Formal(lite.frameCount === 8, "v595-closure-lite-frame-count");
  assertV595Formal(
    liteReceiptIdentity.buildId !== full.buildId,
    "v595-closure-lite-build-alias",
  );

  const challenge = validateV595BrowserAggregate(
    browserGate,
    candidate,
    full,
    liteIdentity,
  );
  assertV595Formal(
    browserGate.matrices?.lite?.receiptSha256 === lite.receiptSha256,
    "v595-closure-lite-receipt-binding",
  );
  validateV595Identity(browserGate.matrices?.lite?.candidate, liteReceiptIdentity, {
    deliveryTier: "vercel-lite",
  });

  const humanResult = validateV595HumanSignoff(human, full, { syntheticFixture });
  assertV595Formal(
    sameCanonicalV595Formal(human.decisionChallenge, challenge)
      && human.decisionChallengeSha256 === humanResult.challengeSha256
      && human.decisionChallenge.browserGateReceiptSha256 === browserGate.receiptSha256,
    "v595-closure-human-current-challenge-binding",
  );
  assertV595Formal(
    human.decisionChallenge.priorV594HumanDecisionInherited === false,
    "v595-closure-human-prior-v594-inheritance",
  );

  for (const [label, receipt] of [
    ["lifecycle", lifecycle],
    ["soak", soak],
    ["lite", lite],
    ["browser-gate", browserGate],
    ["human", human],
  ]) assertSyntheticBinding(receipt, syntheticFixture, label);

  return Object.freeze({
    full,
    lite: liteReceiptIdentity,
    lifecycle: lifecycleIdentity,
    soak: soakIdentity,
    human: humanResult,
    challenge,
    browserGateReceiptSha256: browserGate.receiptSha256,
  });
}

export async function verifyV595RawEvidenceRecords(root, inputRecords) {
  const workspace = resolve(root);
  const records = new Map();
  for (const [index, record] of (inputRecords ?? []).entries()) {
    addEvidenceRecord(records, record, `record:${index}`);
  }
  const totalBytes = [...records.values()].reduce(
    (total, record) => total + record.bytes,
    0,
  );
  assertV595Formal(
    Number.isSafeInteger(totalBytes) && totalBytes <= V595_RAW_MAX_TOTAL_BYTES,
    "v595-closure-raw-total-size",
  );
  for (const [path, record] of records) {
    await verifyFileReceiptV595Formal(workspace, record, `raw:${path}`);
  }
  return Object.freeze([...records.values()].sort(
    (left, right) => left.path.localeCompare(right.path),
  ));
}

async function readRecordedJson(workspace, record, label) {
  const normalized = normalizeRecord(record, label);
  await verifyFileReceiptV595Formal(workspace, normalized, label);
  const loaded = await readJsonV595Formal(workspace, normalized.path, label);
  return Object.freeze({ record: normalized, value: loaded.value });
}

function requireMatrixRawRoot(matrix, label) {
  const roots = [];
  for (const field of ["stage", "batch", "receipt", "evidence"]) {
    if (isFileRecord(matrix?.[field])) roots.push(matrix[field]);
  }
  assertV595Formal(roots.length > 0, `v595-closure-raw-browser-root:${label}`);
  return roots;
}

/**
 * Re-opens the aggregate-referenced evidence graph. JSON nodes are traversed
 * recursively so PNG/telemetry and nested receipt records cannot be replaced
 * by a self-consistent aggregate dossier. The two stateful raw stages and the
 * independent decision are also revalidated semantically.
 */
export async function validateV595RawEvidenceGraph({
  root = process.cwd(),
  lifecycle,
  soak,
  lite,
  browserGate,
  human,
  candidate,
  expectedFullIdentity,
  expectedLiteIdentity,
  aggregateRecords = {},
  syntheticFixture = false,
} = {}) {
  const workspace = resolve(root);
  const records = new Map();
  for (const [label, value] of Object.entries({
    lifecycle,
    soak,
    lite,
    browserGate,
    human,
  })) discoverFileRecords(value, records, label);
  for (const [label, record] of Object.entries(aggregateRecords)) {
    if (record) addEvidenceRecord(records, record, `aggregate:${label}`);
  }
  for (const [label, matrix] of [
    ["full", browserGate.matrices?.full],
    ["lite", browserGate.matrices?.lite],
    ["exact-ab", browserGate.matrices?.exactAb],
    ["stellar-24x2", browserGate.matrices?.stellarScienceCinematic],
    ["product-scene-families", browserGate.matrices?.productSceneFamilies],
  ]) {
    for (const record of requireMatrixRawRoot(matrix, label)) {
      addEvidenceRecord(records, record, `matrix:${label}`);
    }
  }
  const desktopRoots = requireMatrixRawRoot(
    browserGate.supplemental?.realDesktopChrome,
    "real-desktop-chrome",
  );
  for (const record of desktopRoots) addEvidenceRecord(records, record, "real-desktop");

  const queue = [...records.values()];
  const queued = new Set(queue.map((record) => record.path));
  const expanded = new Set();
  for (let index = 0; index < queue.length; index += 1) {
    const record = queue[index];
    if (expanded.has(record.path)) continue;
    expanded.add(record.path);
    await verifyFileReceiptV595Formal(workspace, record, `raw:${record.path}`);
    if (!record.path.endsWith(".json")) continue;
    const loaded = await readJsonV595Formal(workspace, record.path, `raw-json:${record.path}`);
    discoverFileRecords(loaded.value, records, `raw-json:${record.path}`);
    for (const [path, discovered] of records) {
      if (!queued.has(path)) {
        queued.add(path);
        queue.push(discovered);
      }
    }
  }
  const evidenceTracked = await verifyV595RawEvidenceRecords(
    workspace,
    [...records.values()],
  );

  const liteStage = await readRecordedJson(
    workspace,
    lite.evidence.stage,
    "raw-lite-stage",
  );
  const liteBatch = await readRecordedJson(
    workspace,
    lite.evidence.batch,
    "raw-lite-batch",
  );
  const fullStage = await readRecordedJson(
    workspace,
    browserGate.matrices.full.stage,
    "raw-full-stage",
  );
  const fullBatch = await readRecordedJson(
    workspace,
    browserGate.matrices.full.batch,
    "raw-full-batch",
  );
  const exactStage = await readRecordedJson(
    workspace,
    browserGate.matrices.exactAb.stage,
    "raw-exact-stage",
  );
  const exactBatch = await readRecordedJson(
    workspace,
    browserGate.matrices.exactAb.batch,
    "raw-exact-batch",
  );
  const stellarReceipt = await readRecordedJson(
    workspace,
    browserGate.matrices.stellarScienceCinematic.receipt,
    "raw-stellar-24x2-receipt",
  );
  const familyReceipt = await readRecordedJson(
    workspace,
    browserGate.matrices.productSceneFamilies.receipt,
    "raw-product-scene-family-receipt",
  );
  const desktopReceipt = await readRecordedJson(
    workspace,
    browserGate.supplemental.realDesktopChrome.receipt,
    "raw-real-desktop-receipt",
  );

  const [liteResult, fullResult, exactResult] = await Promise.all([
    validateV595BrowserEvidence({
      root: workspace,
      stage: liteStage.value,
      batch: liteBatch.value,
      stagePath: liteStage.record.path,
      batchPath: liteBatch.record.path,
      expectedIdentity: expectedLiteIdentity,
      suite: "lite",
      syntheticFixture,
    }),
    validateV595BrowserEvidence({
      root: workspace,
      stage: fullStage.value,
      batch: fullBatch.value,
      stagePath: fullStage.record.path,
      batchPath: fullBatch.record.path,
      expectedIdentity: expectedFullIdentity,
      suite: "full",
      syntheticFixture,
    }),
    validateV595BrowserEvidence({
      root: workspace,
      stage: exactStage.value,
      batch: exactBatch.value,
      stagePath: exactStage.record.path,
      batchPath: exactBatch.record.path,
      expectedIdentity: expectedFullIdentity,
      suite: "exact-ab",
      syntheticFixture,
    }),
  ]);
  validateV595LiteReceipt(lite, expectedLiteIdentity, { syntheticFixture });
  assertV595Formal(
    lite.stageReceiptSha256 === liteResult.stageReceiptSha256
      && lite.batchSha256 === liteResult.batchSha256
      && lite.frameCount === liteResult.frameCount
      && browserGate.matrices.full.stageReceiptSha256 === fullResult.stageReceiptSha256
      && browserGate.matrices.full.batchSha256 === fullResult.batchSha256
      && browserGate.matrices.full.frameCount === fullResult.frameCount
      && browserGate.matrices.exactAb.stageReceiptSha256 === exactResult.stageReceiptSha256
      && browserGate.matrices.exactAb.batchSha256 === exactResult.batchSha256
      && browserGate.matrices.exactAb.frameCount === exactResult.frameCount,
    "v595-closure-browser-raw-binding",
  );
  const stellarResult = validateV595StellarMatrixReceipt(
    stellarReceipt.value,
    expectedFullIdentity,
    { root: workspace, syntheticFixture },
  );
  const familyResult = validateV595ProductSceneFamilyReceipt(
    familyReceipt.value,
    expectedFullIdentity,
    { root: workspace, syntheticFixture },
  );
  const desktopResult = validateV595RealDesktopReceipt(
    desktopReceipt.value,
    expectedFullIdentity,
    { root: workspace, syntheticFixture },
  );
  assertV595Formal(
    browserGate.matrices.stellarScienceCinematic.receiptSha256
        === stellarResult.receiptSha256
      && browserGate.matrices.productSceneFamilies.receiptSha256
        === familyResult.receiptSha256
      && browserGate.supplemental.realDesktopChrome.receiptSha256
        === desktopResult.receiptSha256,
    "v595-closure-supplemental-raw-binding",
  );

  const lifecycleStage = await readRecordedJson(
    workspace,
    lifecycle.evidence,
    "raw-lifecycle-stage",
  );
  const lifecycleResult = validateV595LifecycleStage(
    lifecycleStage.value,
    expectedFullIdentity,
    { syntheticFixture },
  );
  assertV595Formal(
    lifecycle.stageReceiptSha256 === lifecycleStage.value.receiptSha256
      && lifecycle.phaseCount === lifecycleResult.phaseCount,
    "v595-closure-lifecycle-raw-binding",
  );

  const soakStage = await readRecordedJson(workspace, soak.evidence, "raw-soak-stage");
  const soakResult = validateV595SoakStage(soakStage.value, expectedFullIdentity, {
    syntheticFixture,
  });
  assertV595Formal(
    soak.stageReceiptSha256 === soakStage.value.receiptSha256
      && soak.shardCount === soakResult.shardCount
      && soak.cycleCount === soakResult.cycleCount
      && soak.sampleCount === soakResult.sampleCount,
    "v595-closure-soak-raw-binding",
  );

  const rawDecision = await readRecordedJson(
    workspace,
    human.userDecision,
    "raw-human-decision",
  );
  const challenge = createV595HumanChallenge(browserGate, {
    candidateDocument: candidate,
    expectedFullIdentity,
    expectedLiteIdentity,
    syntheticFixture,
  });
  const decision = validateV595HumanDecisionRawBinding({
    human,
    decision: rawDecision.value,
    challenge,
    syntheticFixture,
  });
  assertV595Formal(
    sameCanonicalV595Formal(human.decisionChallenge, challenge),
    "v595-closure-human-raw-challenge-binding",
  );
  if (aggregateRecords.browserGate) {
    assertV595Formal(
      human.browserGate?.path === aggregateRecords.browserGate.path
        && human.browserGate?.bytes === aggregateRecords.browserGate.bytes
        && human.browserGate?.sha256 === aggregateRecords.browserGate.sha256,
      "v595-closure-human-browser-file-binding",
    );
  }
  return Object.freeze({
    lifecycleStage: lifecycleStage.value,
    soakStage: soakStage.value,
    userDecision: rawDecision.value,
    decision,
    evidenceTracked,
    totalBytes: evidenceTracked.reduce((sum, record) => sum + record.bytes, 0),
  });
}

async function readAggregate(workspace, path, label) {
  const loaded = await readJsonV595Formal(workspace, path, label);
  return Object.freeze({
    value: loaded.value,
    record: await fileReceiptV595Formal(workspace, path, label),
  });
}

export async function buildV595ClosureDossier({
  root = process.cwd(),
  outputRoot = root,
  lifecyclePath = "docs/release/v595/resource-lifecycle-v595.json",
  soakPath = "docs/release/v595/soak-v595.json",
  litePath = "docs/release/v595/lite-browser-matrix-v595.json",
  browserGatePath = "docs/release/v595/final-sealed-browser-gate-v595.json",
  humanPath = "docs/release/v595/human-visual-signoff-v595.json",
  outputPath = "docs/release/v595/release-export-v595.json",
  syntheticFixture = false,
} = {}) {
  const bundle = await loadCurrentV595Bundle(root, { requireBuilds: true });
  const loaded = Object.fromEntries(await Promise.all([
    ["lifecycle", lifecyclePath],
    ["soak", soakPath],
    ["lite", litePath],
    ["browserGate", browserGatePath],
    ["human", humanPath],
  ].map(async ([label, path]) => [label, await readAggregate(bundle.workspace, path, label)])));

  const validated = validateV595ClosureInputs({
    lifecycle: loaded.lifecycle.value,
    soak: loaded.soak.value,
    lite: loaded.lite.value,
    browserGate: loaded.browserGate.value,
    human: loaded.human.value,
    candidate: bundle.candidate,
    expectedFullIdentity: bundle.identities.standalone,
    expectedLiteIdentity: bundle.identities.lite,
    syntheticFixture,
  });
  const raw = await validateV595RawEvidenceGraph({
    root: bundle.workspace,
    lifecycle: loaded.lifecycle.value,
    soak: loaded.soak.value,
    lite: loaded.lite.value,
    browserGate: loaded.browserGate.value,
    human: loaded.human.value,
    candidate: bundle.candidate,
    expectedFullIdentity: bundle.identities.standalone,
    expectedLiteIdentity: bundle.identities.lite,
    aggregateRecords: Object.fromEntries(
      Object.entries(loaded).map(([label, value]) => [label, value.record]),
    ),
    syntheticFixture,
  });

  const candidate = bundle.candidate;
  const timelike = candidate.relativity.timelikeKerr;
  const unsigned = {
    version: V595_CLOSURE_VERSION,
    generatedAt: bundle.source.generatedAt,
    status: V595_CLOSURE_STATUS,
    candidate: validated.full,
    parentV594: {
      ...V595_PARENT_V594_IDENTITY,
      immutable: true,
      relationship: "sealed-parent-not-current-build",
    },
    governance: {
      additiveOnly: true,
      parentV594Immutable: true,
      priorV594HumanDecisionInherited: false,
      currentV595HumanDecisionRequiredAndBound: true,
      formalProductPointer: V595_FORMAL_PRODUCT_POINTER,
    },
    stellar: {
      rosterCount: 24,
      presentationAdmittedCount: 24,
      measurementAdmittedCount: 0,
      scienceCinematicTargetCount: 24,
      scienceCinematicModeCount: 2,
      scienceCinematicFrameCount: 48,
      presentationOnly: true,
      scientificAuthorityGranted: false,
    },
    productSceneFamilies: {
      familyCount: 6,
      orderedFamilies: V595_PRODUCT_SCENE_FAMILIES,
      sharedMainCanvas: true,
      webglCanvasCount: 1,
      independentWebglSceneCountClaim: false,
    },
    relativity: {
      defaultKernel: "legacy-eih-1pn",
      v2Mode: "shadow-only",
      timelikeKerr: {
        admissionSha256: timelike.admissionSha256,
        receiptSha256: timelike.receiptSha256,
        fixtureCount: 4,
        analyticAnchorCount: 3,
        referenceCandidateOnly: true,
        formalEvidence: false,
        promotion: "none",
      },
    },
    fullBuild: await fileReceiptV595Formal(
      bundle.workspace,
      bundle.paths.standalone,
      "full-build",
    ),
    liteBuild: await fileReceiptV595Formal(
      bundle.workspace,
      bundle.paths.lite,
      "lite-build",
    ),
    lifecycle: {
      receiptSha256: loaded.lifecycle.value.receiptSha256,
      evidence: loaded.lifecycle.value.evidence,
    },
    soak: {
      receiptSha256: loaded.soak.value.receiptSha256,
      evidence: loaded.soak.value.evidence,
      heapQualification: loaded.soak.value.heapQualification,
    },
    liteBrowser: {
      receiptSha256: loaded.lite.value.receiptSha256,
      evidence: loaded.lite.value.evidence,
    },
    browserGate: {
      receiptSha256: loaded.browserGate.value.receiptSha256,
      exactPairCount: 8,
      stellarFrameCount: 48,
      productSceneFamilyCount: 6,
      realDesktopEligible: true,
      physicalMobileStatus: "not-present-not-faked",
    },
    humanReview: {
      receiptSha256: loaded.human.value.receiptSha256,
      decisionSha256: loaded.human.value.decisionSha256,
      challengeSha256: loaded.human.value.decisionChallengeSha256,
      priorV594HumanDecisionInherited: false,
    },
    qualification: {
      version: "v595-stellar-relativity-qualification-layer-v1",
      status: V595_QUALIFICATION_STATUS,
      candidate: validated.full,
      sourceAndCandidateIdentityMutatedByQualification: false,
      productionPromotionAllowed: false,
    },
    evidenceGraph: {
      recursivelyReopened: true,
      recordCount: raw.evidenceTracked.length,
      totalBytes: raw.totalBytes,
      records: raw.evidenceTracked,
    },
    gates: {
      fullLiteIndependentBuilds: true,
      exactAbEightPairsSixteenFrames: true,
      stellarScienceCinematic24x2: true,
      sixProductSceneFamilyJourneys: true,
      sharedSingleCanvas: true,
      sameRealmLifecycle: true,
      cdpRendererHeapSoak: true,
      realDesktopChromeSupplemental: true,
      physicalMobileNotPresentNotFaked: true,
      timelikeKerrReferenceCandidateOnly: true,
      humanVisualSignoff: true,
      unknownAndZeroFailClosed: true,
    },
    authority: { ...candidate.authority },
    productionPromotionAllowed: false,
    unresolved: ["physical-mobile-real-device-evidence-not-present"],
    synthetic: syntheticFixture,
  };
  assertV595Authority(unsigned.authority, "closure");
  const dossier = sealV595FormalDocument(unsigned, "dossierSha256");
  if (!syntheticFixture) await atomicWriteJsonV595Formal(
    bundle.workspace,
    outputRoot,
    outputPath,
    dossier,
    "closure-output",
  );
  return dossier;
}

export function parseV595ClosureArgs(argv) {
  const values = {};
  const names = new Set([
    "--lifecycle",
    "--soak",
    "--lite",
    "--browser-gate",
    "--human",
    "--output",
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (names.has(token)) values[token.slice(2)] = argv[++index];
    else throw new Error(`v595-closure-argument:${token}`);
  }
  return values;
}

async function main() {
  const args = parseV595ClosureArgs(process.argv.slice(2));
  const dossier = await buildV595ClosureDossier({
    lifecyclePath: args.lifecycle,
    soakPath: args.soak,
    litePath: args.lite,
    browserGatePath: args["browser-gate"],
    humanPath: args.human,
    outputPath: args.output,
  });
  process.stdout.write(`${JSON.stringify({
    status: dossier.status,
    qualificationStatus: dossier.qualification.status,
    dossierSha256: dossier.dossierSha256,
    humanDecisionSha256: dossier.humanReview.decisionSha256,
    unresolved: dossier.unresolved,
  }, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}

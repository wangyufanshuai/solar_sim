import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  assertV596Authority,
  assertV596Formal,
  atomicWriteJsonV596Formal,
  canonicalShaV596Formal,
  fileReceiptV596Formal,
  loadCurrentV596Bundle,
  readJsonV596Formal,
  sameCanonicalV596Formal,
  sealV596FormalDocument,
  validateV596Identity,
  verifyFileReceiptV596Formal,
  verifyV596FormalSeal,
  V596_FORMAL_PRODUCT_POINTER,
  V596_PARENT_V595_IDENTITY,
} from "./v596-formal-contract.mjs";
import {
  validateV596LifecycleStage,
  V596_LIFECYCLE_RECEIPT_STATUS,
  V596_LIFECYCLE_SYNTHETIC_RECEIPT_STATUS,
  V596_LIFECYCLE_RECEIPT_VERSION,
  V596_SCENE_EXIT_RELEASE_CONTRACT_VERSION,
} from "./build-v596-current-source-lifecycle.mjs";
import {
  validateV596SoakStage,
  V596_SOAK_RECEIPT_STATUS,
  V596_SOAK_SYNTHETIC_RECEIPT_STATUS,
  V596_SOAK_RECEIPT_VERSION,
} from "./build-v596-current-source-soak.mjs";
import {
  validateV596BrowserEvidence,
  validateV596LiteReceipt,
  V596_LITE_RECEIPT_STATUS,
  V596_LITE_RECEIPT_VERSION,
} from "./build-v596-current-lite-matrix.mjs";
import {
  validateV596ProductSceneFamilyReceipt,
  validateV596RealDesktopReceipt,
  validateV596StellarMatrixReceipt,
  V596_BROWSER_GATE_STATUS,
  V596_BROWSER_GATE_VERSION,
} from "./build-v596-final-sealed-browser-gate.mjs";
import {
  createV596HumanChallenge,
  validateV596HumanDecisionRawBinding,
  validateV596HumanSignoff,
  V596_EXACT_AB_LANES,
  V596_HUMAN_REVIEW_PASSES,
  V596_PRODUCT_SCENE_FAMILIES,
} from "./build-v596-human-visual-signoff.mjs";

export const V596_CLOSURE_VERSION =
  "v596-release-export-and-closure-dossier-v1";
export const V596_CLOSURE_STATUS =
  "passed-current-v596-stellar-visible-leap-full-lite-exact-24x2-six-family-lifecycle-soak-real-desktop-and-human-signoff-approved";
export const V596_QUALIFICATION_STATUS =
  "qualified-additive-v596-stellar-visible-leap-candidate";

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const V596_RAW_MAX_FILES = 4096;
const V596_RAW_MAX_FILE_BYTES = 128 * 1024 * 1024;
const V596_RAW_MAX_TOTAL_BYTES = 2 * 1024 * 1024 * 1024;
const V596_RAW_MAX_JSON_DEPTH = 64;
export const V596_HISTORICAL_SOURCE_SET_RECEIPT_VERSION =
  "v596-staging-visual-checkpoint-source-set-receipt-v1";

function assertSyntheticBinding(receipt, syntheticFixture, label) {
  assertV596Formal(
    receipt.synthetic === (syntheticFixture === true),
    `v596-closure-synthetic-binding:${label}`,
  );
}

function assertReceiptIdentity(receipt, expected, label, tier = "standalone-full") {
  const identity = validateV596Identity(receipt.candidate, expected, {
    deliveryTier: tier,
  });
  assertV596Authority(receipt.authority, `closure:${label}`);
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
  assertV596Formal(isFileRecord(record), `v596-closure-evidence-record:${label}`);
  assertV596Formal(
    record.bytes <= V596_RAW_MAX_FILE_BYTES,
    `v596-closure-raw-size:${label}`,
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
  assertV596Formal(
    !previous || sameCanonicalV596Formal(previous, normalized),
    `v596-closure-evidence-alias-drift:${label}`,
  );
  records.set(normalized.path, normalized);
  assertV596Formal(
    records.size <= V596_RAW_MAX_FILES,
    "v596-closure-raw-file-count",
  );
  return previous === undefined;
}

function discoverFileRecords(value, records, label, depth = 0, seen = new WeakSet()) {
  assertV596Formal(depth <= V596_RAW_MAX_JSON_DEPTH, "v596-closure-raw-json-depth");
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

/**
 * Phase 3 checkpoint source-set receipts are immutable historical snapshots.
 * Their embedded file rows describe the checkpoint workspace, not the current
 * formal workspace. The receipt byte record, canonical seal, nested source-set
 * seal, identity, and snapshot row shapes are all verified here; the embedded
 * rows must not subsequently be reinterpreted as current-workspace receipts.
 */
export function validateV596HistoricalSourceSetReceipt(document) {
  if (document?.version !== V596_HISTORICAL_SOURCE_SET_RECEIPT_VERSION) return null;
  verifyV596FormalSeal(document, "receiptSha256", "historical-source-set");
  assertV596Formal(
    document.status === "passed-staging-only-bound-to-immutable-v595"
      && document.identityStage === "pre-formal-human-visual-checkpoint"
      && document.timestampPolicy === "none-deterministic-staging-receipt"
      && document.sealAlgorithm === "sha256-canonical-json-object-keys-v1"
      && document.formalProductPointer === V596_FORMAL_PRODUCT_POINTER
      && document.runtimeTier === "staging-standalone",
    "v596-closure-historical-source-set-contract",
  );
  const sourceSet = document.sourceSet;
  assertV596Formal(
    sourceSet?.version === "v596-staging-visual-checkpoint-source-set-v1"
      && sourceSet.pathPolicy
        === "explicit-main-route-renderer-checkpoint-and-verification-sources"
      && Array.isArray(sourceSet.runtimeFiles) && sourceSet.runtimeFiles.length > 0
      && Array.isArray(sourceSet.verificationFiles)
      && sourceSet.verificationFiles.length > 0
      && document.sourceSetSha256 === canonicalShaV596Formal(sourceSet),
    "v596-closure-historical-source-set-seal",
  );
  assertV596Formal(
    sourceSet.parentV595?.sourceManifestSha256
        === V596_PARENT_V595_IDENTITY.sourceManifestSha256
      && sourceSet.parentV595?.candidateManifestSha256
        === V596_PARENT_V595_IDENTITY.candidateManifestSha256
      && sourceSet.parentV595?.deploymentId
        === V596_PARENT_V595_IDENTITY.deploymentId
      && sourceSet.parentV595?.relationship === "immutable-visual-baseline",
    "v596-closure-historical-source-set-parent",
  );
  assertV596Formal(
    SHA256_PATTERN.test(document.buildFingerprint ?? "")
      && document.checkpointId
        === `v596-checkpoint-${document.sourceSetSha256.slice(0, 12)}-${document.buildFingerprint.slice(0, 12)}`
      && document.environment?.NEXT_PUBLIC_ATLAS_V596_CHECKPOINT_SOURCE_SET_SHA256
        === document.sourceSetSha256
      && document.environment?.NEXT_PUBLIC_ATLAS_V596_CHECKPOINT_BUILD_FINGERPRINT
        === document.buildFingerprint
      && document.environment?.NEXT_PUBLIC_ATLAS_V596_CHECKPOINT_ID
        === document.checkpointId
      && document.environment?.NEXT_PUBLIC_ATLAS_V596_CHECKPOINT_RUNTIME_TIER
        === document.runtimeTier,
    "v596-closure-historical-source-set-identity",
  );
  const boundaries = document.boundaries;
  assertV596Formal(
    boundaries?.formalEvidence === false
      && boundaries.promotion === "none"
      && boundaries.supplementalOnly === true
      && boundaries.productionDeployment === false
      && boundaries.scientificAuthority === false
      && boundaries.measuredAuthority === false
      && boundaries.gpuAuthority === false
      && boundaries.resolvedSurfaceAuthority === false
      && boundaries.observationTextureAuthority === false
      && boundaries.radiativeTransferAuthority === false
      && boundaries.grmhdAuthority === false
      && boundaries.scientificPayloadWriteback === false
      && boundaries.defaultKernel === "legacy-eih-1pn"
      && boundaries.singleCanvasPolicy === "shared-main-canvas",
    "v596-closure-historical-source-set-boundaries",
  );

  const snapshotRecords = new Map();
  for (const [group, rows] of [
    ["runtime", sourceSet.runtimeFiles],
    ["verification", sourceSet.verificationFiles],
  ]) {
    for (const [index, row] of rows.entries()) {
      addEvidenceRecord(snapshotRecords, row, `historical:${group}:${index}`);
    }
  }
  const snapshotTotalBytes = [...snapshotRecords.values()].reduce(
    (total, record) => total + record.bytes,
    0,
  );
  assertV596Formal(
    Number.isSafeInteger(snapshotTotalBytes)
      && snapshotTotalBytes <= V596_RAW_MAX_TOTAL_BYTES,
    "v596-closure-historical-source-set-total-size",
  );
  return Object.freeze({
    version: document.version,
    receiptSha256: document.receiptSha256,
    sourceSetVersion: sourceSet.version,
    sourceSetSha256: document.sourceSetSha256,
    checkpointId: document.checkpointId,
    semantics: "sealed-historical-snapshot-not-current-workspace-receipts",
    runtimeFileCount: sourceSet.runtimeFiles.length,
    verificationFileCount: sourceSet.verificationFiles.length,
    snapshotRecordCount: snapshotRecords.size,
    snapshotTotalBytes,
  });
}

function assertAggregateContract(receipt, version, status, label) {
  verifyV596FormalSeal(receipt, "receiptSha256", `closure:${label}`);
  assertV596Formal(
    receipt.version === version && receipt.status === status,
    `v596-closure-${label}-contract`,
  );
}

function assertCandidateBoundaries(candidate) {
  assertV596Formal(
    candidate?.governance?.parentV595Immutable === true
      && candidate.governance.priorV595HumanDecisionInherited === false
      && candidate.governance.parentSourceManifestSha256
        === V596_PARENT_V595_IDENTITY.sourceManifestSha256
      && candidate.governance.parentCandidateManifestSha256
        === V596_PARENT_V595_IDENTITY.candidateManifestSha256
      && candidate.governance.parentReleaseDossierSha256
        === V596_PARENT_V595_IDENTITY.releaseDossierSha256
      && candidate.governance.parentResealReceiptSha256
        === V596_PARENT_V595_IDENTITY.resealReceiptSha256,
    "v596-closure-parent-v595-governance",
  );
  assertV596Formal(
    candidate?.parentV595?.sourceManifestSha256
        === V596_PARENT_V595_IDENTITY.sourceManifestSha256
      && candidate.parentV595.candidateManifestSha256
        === V596_PARENT_V595_IDENTITY.candidateManifestSha256
      && candidate.parentV595.releaseDossierSha256
        === V596_PARENT_V595_IDENTITY.releaseDossierSha256
      && candidate.parentV595.resealReceiptSha256
        === V596_PARENT_V595_IDENTITY.resealReceiptSha256
      && candidate.parentV595.formalProductPointer === V596_FORMAL_PRODUCT_POINTER,
    "v596-closure-parent-v595-identity",
  );
  assertV596Formal(
    candidate?.stellar?.rosterCount === 24
      && candidate.stellar.presentationAdmittedCount === 24
      && candidate.stellar.measurementAdmittedCount === 0
      && candidate.stellar.presentationOnly === true
      && candidate.stellar.resolvedSurfaceClaim === false
      && candidate.stellar.observationTextureClaim === false,
    "v596-closure-stellar-authority-boundary",
  );
  assertV596Formal(
    candidate?.productSceneFamilies?.familyCount === 6
      && sameCanonicalV596Formal(
        candidate.productSceneFamilies.orderedFamilyIds,
        V596_PRODUCT_SCENE_FAMILIES,
      )
      && candidate.productSceneFamilies.sharedMainCanvas === true
      && candidate.productSceneFamilies.webglCanvasCount === 1
      && candidate.productSceneFamilies.independentWebglSceneCountClaim === false,
    "v596-closure-product-scene-family-boundary",
  );
  const timelike = candidate?.relativity?.timelikeKerr;
  assertV596Formal(
    candidate?.relativity?.inheritedWeakFieldDefaultKernel === "legacy-eih-1pn"
      && candidate.relativity.inheritedV2Mode === "shadow-only"
      && timelike?.fixtureCount === 4
      && timelike.analyticAnchorCount === 3
      && timelike.referenceCandidateOnly === true
      && timelike.formalEvidence === false
      && timelike.promotion === "none",
    "v596-closure-timelike-reference-boundary",
  );
  for (const field of ["admissionSha256", "receiptSha256", "manifestSha256",
    "summarySha256", "sourceSha256"]) {
    assertV596Formal(
      SHA256_PATTERN.test(timelike[field] ?? ""),
      `v596-closure-timelike-sha:${field}`,
    );
  }
  assertV596Authority(candidate.authority, "closure-candidate");
  return Object.freeze({ timelike });
}

function validateV596BrowserAggregate(
  browserGate,
  candidate,
  expectedFullIdentity,
  expectedLiteIdentity,
) {
  assertAggregateContract(
    browserGate,
    V596_BROWSER_GATE_VERSION,
    V596_BROWSER_GATE_STATUS,
    "browser-gate",
  );
  assertReceiptIdentity(browserGate, expectedFullIdentity, "browser-gate");
  const challenge = createV596HumanChallenge(browserGate, {
    candidateDocument: candidate,
    expectedFullIdentity,
    expectedLiteIdentity,
    syntheticFixture: browserGate.synthetic === true,
  });
  assertV596Formal(
    browserGate.fullLiteIndependentBuilds === true
      && browserGate.exactAbSameStandaloneBuild === true,
    "v596-closure-browser-build-separation",
  );
  assertV596Formal(
    browserGate.matrices?.full?.frameCount === 13
      && browserGate.matrices?.lite?.frameCount === 8
      && browserGate.matrices?.exactAb?.pairCount === 8
      && browserGate.matrices?.exactAb?.frameCount === 16
      && sameCanonicalV596Formal(
        browserGate.matrices.exactAb.passes,
        V596_HUMAN_REVIEW_PASSES,
      )
      && sameCanonicalV596Formal(
        browserGate.matrices.exactAb.lanes,
        V596_EXACT_AB_LANES,
      )
      && browserGate.matrices.exactAb.visibleLeapBoundaryVerified === true
      && browserGate.exactVisibleLeapBoundaryVerified === true
      && browserGate.matrices?.stellarScienceCinematic?.targetCount === 24
      && browserGate.matrices.stellarScienceCinematic.modeCount === 2
      && browserGate.matrices.stellarScienceCinematic.frameCount === 48
      && browserGate.matrices?.productSceneFamilies?.familyCount === 6
      && sameCanonicalV596Formal(
        browserGate.matrices.productSceneFamilies.orderedFamilies,
        V596_PRODUCT_SCENE_FAMILIES,
      ),
    "v596-closure-browser-matrix-envelope",
  );
  assertV596Formal(
    browserGate.priorV595HumanDecisionInherited === false
      || browserGate.governance?.priorV595HumanDecisionInherited === false,
    "v596-closure-browser-prior-human-inheritance",
  );
  return challenge;
}

export function validateV596ClosureInputs({
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
  const full = validateV596Identity(expectedFullIdentity, null, {
    deliveryTier: "standalone-full",
  });
  const liteIdentity = validateV596Identity(expectedLiteIdentity, null, {
    deliveryTier: "vercel-lite",
  });
  assertCandidateBoundaries(candidate);

  assertAggregateContract(
    lifecycle,
    V596_LIFECYCLE_RECEIPT_VERSION,
    syntheticFixture
      ? V596_LIFECYCLE_SYNTHETIC_RECEIPT_STATUS
      : V596_LIFECYCLE_RECEIPT_STATUS,
    "lifecycle",
  );
  const lifecycleIdentity = assertReceiptIdentity(lifecycle, full, "lifecycle");
  assertV596Formal(
    lifecycle.sampleCount === 17
      && lifecycle.stellarStateCount === 14
      && lifecycle.exoplanetSystemId === "trappist-1"
      && lifecycle.premeasurementWarmupCycleCount === 1
      && lifecycle.premeasurementStateSpaceWarmupCycleCount === 1
      && lifecycle.samePage === true
      && lifecycle.sameRealm === true
      && lifecycle.sameCanvas === true
      && lifecycle.singleCanvas === true
      && lifecycle.exactReturn === true
      && lifecycle.rawPrototypeCensusExactReturn === true
      && lifecycle.heapReturn?.allowanceBytes === 8 * 1024 * 1024
      && lifecycle.heapReturn?.withinAllowance === true,
    "v596-closure-lifecycle-gates",
  );

  assertAggregateContract(
    soak,
    V596_SOAK_RECEIPT_VERSION,
    syntheticFixture ? V596_SOAK_SYNTHETIC_RECEIPT_STATUS : V596_SOAK_RECEIPT_STATUS,
    "soak",
  );
  const soakIdentity = assertReceiptIdentity(soak, full, "soak");
  assertV596Formal(
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
      && soak.releaseContractVersion === V596_SCENE_EXIT_RELEASE_CONTRACT_VERSION
      && soak.rendererInfoAfterContextLoss === "explicitly-unavailable-not-zero",
    "v596-closure-soak-gates",
  );

  assertAggregateContract(
    lite,
    V596_LITE_RECEIPT_VERSION,
    V596_LITE_RECEIPT_STATUS,
    "lite",
  );
  const liteReceiptIdentity = assertReceiptIdentity(
    lite,
    liteIdentity,
    "lite",
    "vercel-lite",
  );
  assertV596Formal(lite.frameCount === 8, "v596-closure-lite-frame-count");
  assertV596Formal(
    liteReceiptIdentity.buildId !== full.buildId,
    "v596-closure-lite-build-alias",
  );

  const challenge = validateV596BrowserAggregate(
    browserGate,
    candidate,
    full,
    liteIdentity,
  );
  assertV596Formal(
    browserGate.matrices?.lite?.receiptSha256 === lite.receiptSha256,
    "v596-closure-lite-receipt-binding",
  );
  validateV596Identity(browserGate.matrices?.lite?.candidate, liteReceiptIdentity, {
    deliveryTier: "vercel-lite",
  });

  const humanResult = validateV596HumanSignoff(human, full, { syntheticFixture });
  assertV596Formal(
    sameCanonicalV596Formal(human.decisionChallenge, challenge)
      && human.decisionChallengeSha256 === humanResult.challengeSha256
      && human.decisionChallenge.browserGateReceiptSha256 === browserGate.receiptSha256,
    "v596-closure-human-current-challenge-binding",
  );
  assertV596Formal(
    human.decisionChallenge.priorV595HumanDecisionInherited === false,
    "v596-closure-human-prior-v595-inheritance",
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

export async function verifyV596RawEvidenceRecords(root, inputRecords) {
  const workspace = resolve(root);
  const records = new Map();
  for (const [index, record] of (inputRecords ?? []).entries()) {
    addEvidenceRecord(records, record, `record:${index}`);
  }
  const totalBytes = [...records.values()].reduce(
    (total, record) => total + record.bytes,
    0,
  );
  assertV596Formal(
    Number.isSafeInteger(totalBytes) && totalBytes <= V596_RAW_MAX_TOTAL_BYTES,
    "v596-closure-raw-total-size",
  );
  for (const [path, record] of records) {
    await verifyFileReceiptV596Formal(workspace, record, `raw:${path}`);
  }
  return Object.freeze([...records.values()].sort(
    (left, right) => left.path.localeCompare(right.path),
  ));
}

export async function expandV596RawEvidenceRecords(root, inputRecords) {
  const workspace = resolve(root);
  const records = new Map();
  for (const [index, record] of (inputRecords ?? []).entries()) {
    addEvidenceRecord(records, record, `root:${index}`);
  }
  const queue = [...records.values()];
  const queued = new Set(queue.map((record) => record.path));
  const expanded = new Set();
  const historicalSnapshotReceipts = [];
  for (let index = 0; index < queue.length; index += 1) {
    const record = queue[index];
    if (expanded.has(record.path)) continue;
    expanded.add(record.path);
    await verifyFileReceiptV596Formal(workspace, record, `raw:${record.path}`);
    if (!record.path.endsWith(".json")) continue;
    const loaded = await readJsonV596Formal(workspace, record.path, `raw-json:${record.path}`);
    const historical = validateV596HistoricalSourceSetReceipt(loaded.value);
    if (historical) {
      historicalSnapshotReceipts.push(Object.freeze({
        receipt: normalizeRecord(record, `historical-receipt:${record.path}`),
        ...historical,
      }));
      const currentEvidenceMetadata = { ...loaded.value };
      delete currentEvidenceMetadata.sourceSet;
      discoverFileRecords(
        currentEvidenceMetadata,
        records,
        `raw-json:${record.path}:current-evidence-metadata`,
      );
    } else {
      discoverFileRecords(loaded.value, records, `raw-json:${record.path}`);
    }
    for (const [path, discovered] of records) {
      if (!queued.has(path)) {
        queued.add(path);
        queue.push(discovered);
      }
    }
  }
  const evidenceTracked = await verifyV596RawEvidenceRecords(
    workspace,
    [...records.values()],
  );
  const totalBytes = evidenceTracked.reduce((sum, record) => sum + record.bytes, 0);
  return Object.freeze({
    evidenceTracked,
    totalBytes,
    historicalSnapshotReceipts: Object.freeze(historicalSnapshotReceipts.sort(
      (left, right) => left.receipt.path.localeCompare(right.receipt.path),
    )),
  });
}

async function readRecordedJson(workspace, record, label) {
  const normalized = normalizeRecord(record, label);
  await verifyFileReceiptV596Formal(workspace, normalized, label);
  const loaded = await readJsonV596Formal(workspace, normalized.path, label);
  return Object.freeze({ record: normalized, value: loaded.value });
}

function requireMatrixRawRoot(matrix, label) {
  const roots = [];
  for (const field of ["stage", "batch", "receipt", "evidence"]) {
    if (isFileRecord(matrix?.[field])) roots.push(matrix[field]);
  }
  assertV596Formal(roots.length > 0, `v596-closure-raw-browser-root:${label}`);
  return roots;
}

/**
 * Re-opens the aggregate-referenced evidence graph. JSON nodes are traversed
 * recursively so PNG/telemetry and nested receipt records cannot be replaced
 * by a self-consistent aggregate dossier. The two stateful raw stages and the
 * independent decision are also revalidated semantically.
 */
export async function validateV596RawEvidenceGraph({
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

  const expandedRaw = await expandV596RawEvidenceRecords(
    workspace,
    [...records.values()],
  );
  const evidenceTracked = expandedRaw.evidenceTracked;

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
    validateV596BrowserEvidence({
      root: workspace,
      stage: liteStage.value,
      batch: liteBatch.value,
      stagePath: liteStage.record.path,
      batchPath: liteBatch.record.path,
      expectedIdentity: expectedLiteIdentity,
      suite: "lite",
      syntheticFixture,
    }),
    validateV596BrowserEvidence({
      root: workspace,
      stage: fullStage.value,
      batch: fullBatch.value,
      stagePath: fullStage.record.path,
      batchPath: fullBatch.record.path,
      expectedIdentity: expectedFullIdentity,
      suite: "full",
      syntheticFixture,
    }),
    validateV596BrowserEvidence({
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
  validateV596LiteReceipt(lite, expectedLiteIdentity, { syntheticFixture });
  assertV596Formal(
    lite.stageReceiptSha256 === liteResult.stageReceiptSha256
      && lite.batchSha256 === liteResult.batchSha256
      && lite.frameCount === liteResult.frameCount
      && browserGate.matrices.full.stageReceiptSha256 === fullResult.stageReceiptSha256
      && browserGate.matrices.full.batchSha256 === fullResult.batchSha256
      && browserGate.matrices.full.frameCount === fullResult.frameCount
      && browserGate.matrices.exactAb.stageReceiptSha256 === exactResult.stageReceiptSha256
      && browserGate.matrices.exactAb.batchSha256 === exactResult.batchSha256
      && browserGate.matrices.exactAb.frameCount === exactResult.frameCount,
    "v596-closure-browser-raw-binding",
  );
  const stellarResult = validateV596StellarMatrixReceipt(
    stellarReceipt.value,
    expectedFullIdentity,
    { root: workspace, syntheticFixture },
  );
  const familyResult = validateV596ProductSceneFamilyReceipt(
    familyReceipt.value,
    expectedFullIdentity,
    { root: workspace, syntheticFixture },
  );
  const desktopResult = validateV596RealDesktopReceipt(
    desktopReceipt.value,
    expectedFullIdentity,
    { root: workspace, syntheticFixture },
  );
  assertV596Formal(
    browserGate.matrices.stellarScienceCinematic.receiptSha256
        === stellarResult.receiptSha256
      && browserGate.matrices.productSceneFamilies.receiptSha256
        === familyResult.receiptSha256
      && browserGate.supplemental.realDesktopChrome.receiptSha256
        === desktopResult.receiptSha256,
    "v596-closure-supplemental-raw-binding",
  );

  const lifecycleStage = await readRecordedJson(
    workspace,
    lifecycle.evidence,
    "raw-lifecycle-stage",
  );
  const lifecycleResult = validateV596LifecycleStage(
    lifecycleStage.value,
    expectedFullIdentity,
    { syntheticFixture },
  );
  assertV596Formal(
    lifecycle.stageReceiptSha256 === lifecycleStage.value.receiptSha256
      && lifecycle.sampleCount === lifecycleResult.sampleCount
      && lifecycle.stellarStateCount === lifecycleResult.stellarStateCount
      && lifecycle.exoplanetSystemId === lifecycleResult.exoplanetSystemId
      && lifecycle.samePage === true
      && lifecycle.sameRealm === lifecycleResult.sameRealm
      && lifecycle.sameCanvas === lifecycleResult.sameCanvas
      && lifecycle.singleCanvas === lifecycleResult.singleCanvas
      && lifecycle.exactReturn === lifecycleResult.exactReturn
      && lifecycle.rawPrototypeCensusExactReturn
        === lifecycleResult.rawPrototypeCensusExactReturn,
    "v596-closure-lifecycle-raw-binding",
  );

  const soakStage = await readRecordedJson(workspace, soak.evidence, "raw-soak-stage");
  const soakResult = validateV596SoakStage(soakStage.value, expectedFullIdentity, {
    syntheticFixture,
  });
  assertV596Formal(
    soak.stageReceiptSha256 === soakStage.value.receiptSha256
      && soak.shardCount === soakResult.shardCount
      && soak.cycleCount === soakResult.cycleCount
      && soak.sampleCount === soakResult.sampleCount,
    "v596-closure-soak-raw-binding",
  );

  const rawDecision = await readRecordedJson(
    workspace,
    human.userDecision,
    "raw-human-decision",
  );
  const challenge = createV596HumanChallenge(browserGate, {
    candidateDocument: candidate,
    expectedFullIdentity,
    expectedLiteIdentity,
    syntheticFixture,
  });
  const decision = validateV596HumanDecisionRawBinding({
    human,
    decision: rawDecision.value,
    challenge,
    syntheticFixture,
  });
  assertV596Formal(
    sameCanonicalV596Formal(human.decisionChallenge, challenge),
    "v596-closure-human-raw-challenge-binding",
  );
  if (aggregateRecords.browserGate) {
    assertV596Formal(
      human.browserGate?.path === aggregateRecords.browserGate.path
        && human.browserGate?.bytes === aggregateRecords.browserGate.bytes
        && human.browserGate?.sha256 === aggregateRecords.browserGate.sha256,
      "v596-closure-human-browser-file-binding",
    );
  }
  return Object.freeze({
    lifecycleStage: lifecycleStage.value,
    soakStage: soakStage.value,
    userDecision: rawDecision.value,
    decision,
    evidenceTracked,
    totalBytes: expandedRaw.totalBytes,
    historicalSnapshotReceipts: expandedRaw.historicalSnapshotReceipts,
  });
}

async function readAggregate(workspace, path, label) {
  const loaded = await readJsonV596Formal(workspace, path, label);
  return Object.freeze({
    value: loaded.value,
    record: await fileReceiptV596Formal(workspace, path, label),
  });
}

export async function buildV596ClosureDossier({
  root = process.cwd(),
  outputRoot = root,
  lifecyclePath = "docs/release/v596/resource-lifecycle-v596.json",
  soakPath = "docs/release/v596/soak-v596.json",
  litePath = "docs/release/v596/lite-browser-matrix-v596.json",
  browserGatePath = "docs/release/v596/final-sealed-browser-gate-v596.json",
  humanPath = "docs/release/v596/human-visual-signoff-v596.json",
  outputPath = "docs/release/v596/release-export-v596.json",
  syntheticFixture = false,
} = {}) {
  const bundle = await loadCurrentV596Bundle(root, { requireBuilds: true });
  const loaded = Object.fromEntries(await Promise.all([
    ["lifecycle", lifecyclePath],
    ["soak", soakPath],
    ["lite", litePath],
    ["browserGate", browserGatePath],
    ["human", humanPath],
  ].map(async ([label, path]) => [label, await readAggregate(bundle.workspace, path, label)])));

  const validated = validateV596ClosureInputs({
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
  const raw = await validateV596RawEvidenceGraph({
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
    version: V596_CLOSURE_VERSION,
    generatedAt: bundle.source.generatedAt,
    status: V596_CLOSURE_STATUS,
    candidate: validated.full,
    parentV595: {
      ...V596_PARENT_V595_IDENTITY,
      immutable: true,
      relationship: "sealed-parent-not-current-build",
    },
    governance: {
      additiveOnly: true,
      parentV595Immutable: true,
      priorV595HumanDecisionInherited: false,
      currentV596HumanDecisionRequiredAndBound: true,
      formalProductPointer: V596_FORMAL_PRODUCT_POINTER,
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
      orderedFamilies: V596_PRODUCT_SCENE_FAMILIES,
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
    fullBuild: await fileReceiptV596Formal(
      bundle.workspace,
      bundle.paths.standalone,
      "full-build",
    ),
    liteBuild: await fileReceiptV596Formal(
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
      priorV595HumanDecisionInherited: false,
    },
    qualification: {
      version: "v596-stellar-visible-leap-qualification-layer-v1",
      status: V596_QUALIFICATION_STATUS,
      candidate: validated.full,
      sourceAndCandidateIdentityMutatedByQualification: false,
      productionPromotionAllowed: false,
    },
    evidenceGraph: {
      recursivelyReopened: true,
      recordCount: raw.evidenceTracked.length,
      totalBytes: raw.totalBytes,
      records: raw.evidenceTracked,
      historicalSnapshotReceipts: raw.historicalSnapshotReceipts,
    },
    gates: {
      fullLiteIndependentBuilds: true,
      exactAbEightPairsSixteenFrames: true,
      exactVisibleLeapBoundaryVerified: true,
      stellarScienceCinematic24x2: true,
      sixProductSceneFamilyJourneys: true,
      sharedSingleCanvas: true,
      sameRealmLifecycle: true,
      stellarExoplanetLifecycleV2ExactReturn: true,
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
  assertV596Authority(unsigned.authority, "closure");
  const dossier = sealV596FormalDocument(unsigned, "dossierSha256");
  if (!syntheticFixture) await atomicWriteJsonV596Formal(
    bundle.workspace,
    outputRoot,
    outputPath,
    dossier,
    "closure-output",
  );
  return dossier;
}

export function parseV596ClosureArgs(argv) {
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
    else throw new Error(`v596-closure-argument:${token}`);
  }
  return values;
}

async function main() {
  const args = parseV596ClosureArgs(process.argv.slice(2));
  const dossier = await buildV596ClosureDossier({
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

import { isAbsolute, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  assertV596Authority,
  assertV596EvidenceEnvelope,
  assertV596Formal,
  atomicWriteJsonV596Formal,
  fileReceiptV596Formal,
  loadCurrentV596Bundle,
  readJsonV596Formal,
  resolveInsideV596Workspace,
  sameCanonicalV596Formal,
  sealV596FormalDocument,
  validateV596Identity,
  verifyFileReceiptV596Formal,
  verifyV596FormalSeal,
} from "./v596-formal-contract.mjs";
import {
  V596_BROWSER_FRAME_COUNTS,
  V596_EXACT_PAIR_DEFINITIONS,
  V596_EXACT_LANES,
  V596_EXACT_PASSES,
  V596_LITE_RECEIPT_STATUS,
  V596_LITE_RECEIPT_VERSION,
  validateV596BrowserEvidence,
  validateV596LiteReceipt,
} from "./build-v596-current-lite-matrix.mjs";

export const V596_BROWSER_GATE_VERSION = "v596-final-sealed-browser-gate-v1";
export const V596_BROWSER_GATE_STATUS =
  "passed-current-v596-full-lite-exact-stellar-24x2-and-six-scene-family-browser-gates-human-signoff-pending";
export const V596_STELLAR_MATRIX_VERSION =
  "v596-stellar-science-cinematic-24x2-receipt-v1";
export const V596_STELLAR_MATRIX_STATUS =
  "passed-current-v596-24-hero-science-cinematic-matrix";
export const V596_PRODUCT_SCENE_FAMILY_VERSION =
  "v596-product-scene-family-browser-journeys-v1";
export const V596_PRODUCT_SCENE_FAMILY_STATUS =
  "passed-supplemental-v596-six-product-scene-family-journeys";
export const V596_REAL_DESKTOP_VERSION = "v596-real-desktop-chrome-evidence-v1";
export const V596_REAL_DESKTOP_STATUS = "passed-supplemental-real-desktop-eligible";
export const V596_PHYSICAL_MOBILE_STATUS = "not-present-not-faked";

export const V596_STELLAR_TARGET_IDS = Object.freeze([
  "sirius-a",
  "canopus",
  "alpha-centauri-a",
  "alpha-centauri-b",
  "arcturus",
  "vega",
  "capella-a",
  "rigel",
  "procyon-a",
  "betelgeuse",
  "aldebaran",
  "antares",
  "achernar",
  "hadar",
  "altair",
  "acrux",
  "spica",
  "pollux",
  "fomalhaut",
  "deneb",
  "regulus",
  "polaris",
  "bellatrix",
  "alnilam",
]);
export const V596_STELLAR_MODES = Object.freeze(["science", "cinematic"]);
export const V596_PRODUCT_SCENE_FAMILIES = Object.freeze([
  "orbit-atlas-overview",
  "object-inspect",
  "stellar-exoplanet-systems",
  "mission-launch",
  "relativity-lab",
  "scene-lab",
]);

const SHA256_PATTERN = /^[0-9a-f]{64}$/;

function assertCurrentV596Path(root, value, label) {
  resolveInsideV596Workspace(root, value, label);
  assertV596Formal(
    !value.split("/").some((segment) => /^v(?:593|594|595)(?:-|$)/.test(segment)),
    `v596-browser-gate-historical-path:${label}`,
  );
}

function assertArtifactRecord(root, record, label) {
  assertV596Formal(
    record && typeof record === "object"
      && typeof record.path === "string"
      && Number.isSafeInteger(record.bytes) && record.bytes > 0
      && SHA256_PATTERN.test(record.sha256 ?? ""),
    `v596-browser-gate-artifact:${label}`,
  );
  assertCurrentV596Path(root, record.path, label);
}

function assertIdentityBindingMarker(identity, label) {
  const markers = [identity?.bindingStatus, identity?.identityBindingStatus]
    .filter((value) => value !== undefined);
  assertV596Formal(
    markers.every((value) => value === "bound"),
    `v596-browser-gate-identity-binding:${label}`,
  );
}

function assertSyntheticMarker(document, syntheticFixture, label) {
  if (syntheticFixture) {
    assertV596Formal(document.fixture?.synthetic === true, `v596-${label}-fixture-marker`);
  } else {
    assertV596Formal(document.fixture?.synthetic !== true, `v596-${label}-synthetic-as-evidence`);
  }
}

export function validateV596StellarMatrixReceipt(
  receipt,
  expectedIdentity,
  { root = process.cwd(), syntheticFixture = false } = {},
) {
  verifyV596FormalSeal(receipt, "receiptSha256", "stellar-24x2");
  assertV596Formal(
    receipt.version === V596_STELLAR_MATRIX_VERSION
      && receipt.status === V596_STELLAR_MATRIX_STATUS,
    "v596-stellar-24x2-contract",
  );
  assertV596EvidenceEnvelope(receipt, { syntheticFixture });
  assertV596Formal(
    receipt.qualificationScope === (syntheticFixture
      ? "synthetic-test-only"
      : "formal-current-v596-stellar-science-cinematic-24x2")
      && receipt.supplementalOnly === false
      && receipt.failureClosed === true,
    "v596-stellar-24x2-evidence-boundary",
  );
  const identity = validateV596Identity(receipt.identity, expectedIdentity, {
    deliveryTier: "standalone-full",
  });
  assertIdentityBindingMarker(receipt.identity, "stellar-24x2");
  assertV596Authority(receipt.authority, "stellar-24x2");
  assertV596Formal(
    receipt.boundaries?.priorV595HumanDecisionInherited === false
      && receipt.boundaries?.scientificPayloadMutationAllowed === false
      && receipt.boundaries?.promotionAllowed === false
      && receipt.boundaries?.singleCanvasPolicy === "shared-main-canvas",
    "v596-stellar-24x2-boundaries",
  );
  assertV596Formal(
    sameCanonicalV596Formal(receipt.matrix?.targetIds, V596_STELLAR_TARGET_IDS)
      && sameCanonicalV596Formal(receipt.matrix?.modes, V596_STELLAR_MODES)
      && receipt.matrix?.targetCount === 24
      && receipt.matrix?.modeCount === 2
      && receipt.matrix?.frameCount === 48
      && receipt.matrix?.requestedFrameCount === 48
      && receipt.matrix?.query === "v596VisualCheckpoint=1"
      && receipt.matrix?.runtimeConsumer === "webgl-main-scene-v1",
    "v596-stellar-24x2-matrix",
  );
  assertV596Formal(
    Array.isArray(receipt.rows) && receipt.rows.length === 48,
    "v596-stellar-24x2-row-count",
  );
  receipt.rows.forEach((row, index) => {
    const targetId = V596_STELLAR_TARGET_IDS[Math.floor(index / 2)];
    const mode = V596_STELLAR_MODES[index % 2];
    assertV596Formal(
      row.index === index
        && row.targetId === targetId
        && row.mode === mode
        && row.status === "passed"
        && Array.isArray(row.errors) && row.errors.length === 0
        && Array.isArray(row.blockers) && row.blockers.length === 0,
      `v596-stellar-24x2-row:${index}`,
    );
    assertV596Formal(
      row.observed?.canvas?.count === 1
        && row.observed?.canvas?.connected === 1
        && row.observed?.checkpoint?.targetId === targetId
        && row.observed?.checkpoint?.mode === mode
        && row.observed?.checkpoint?.bindingStatus === "bound"
        && row.observed?.consumer?.ready === "true"
        && row.observed?.consumer?.singleCanvasPolicy === "shared-main-canvas"
        && row.observed?.consumer?.scientificAuthority === "false"
        && row.observed?.consumer?.measuredAuthority === "false"
        && row.observed?.consumer?.gpuAuthority === "false"
        && row.observed?.consumer?.resolvedSurfaceAuthority === "false"
        && row.observed?.consumer?.observationTextureAuthority === "false"
        && row.observed?.consumer?.radiativeTransferAuthority === "false"
        && row.observed?.consumer?.grmhdAuthority === "false"
        && row.observed?.consumer?.scientificPayloadWriteback === "false",
      `v596-stellar-24x2-runtime:${index}`,
    );
    assertArtifactRecord(root, row.screenshot, `stellar-screenshot:${index}`);
    assertArtifactRecord(root, row.telemetry, `stellar-telemetry:${index}`);
  });
  assertV596Formal(
    Array.isArray(receipt.globalErrors) && receipt.globalErrors.length === 0
      && Array.isArray(receipt.globalBlockers) && receipt.globalBlockers.length === 0,
    "v596-stellar-24x2-global-errors",
  );
  return Object.freeze({ identity, receiptSha256: receipt.receiptSha256, frameCount: 48 });
}

export function validateV596ProductSceneFamilyReceipt(
  receipt,
  expectedIdentity,
  { root = process.cwd(), syntheticFixture = false } = {},
) {
  verifyV596FormalSeal(receipt, "receiptSha256", "product-scene-families");
  assertV596Formal(
    receipt.version === V596_PRODUCT_SCENE_FAMILY_VERSION
      && receipt.status === V596_PRODUCT_SCENE_FAMILY_STATUS,
    "v596-product-scene-family-contract",
  );
  assertSyntheticMarker(receipt, syntheticFixture, "product-scene-family");
  assertV596Formal(
    receipt.supplementalOnly === true
      && receipt.formalEvidence === false
      && receipt.promotion === "none"
      && receipt.failClosed === true,
    "v596-product-scene-family-supplemental-boundary",
  );
  const identity = validateV596Identity(receipt.identity, expectedIdentity, {
    deliveryTier: "standalone-full",
  });
  assertIdentityBindingMarker(receipt.identity, "product-scene-families");
  assertV596Formal(
    sameCanonicalV596Formal(receipt.matrix?.orderedFamilies, V596_PRODUCT_SCENE_FAMILIES)
      && sameCanonicalV596Formal(receipt.matrix?.stages, ["entry", "hero", "exit"])
      && receipt.matrix?.count === 6,
    "v596-product-scene-family-matrix",
  );
  assertV596Formal(
    Array.isArray(receipt.rows) && receipt.rows.length === 6,
    "v596-product-scene-family-row-count",
  );
  receipt.rows.forEach((row, index) => {
    const familyId = V596_PRODUCT_SCENE_FAMILIES[index];
    assertV596Formal(
      row.index === index
        && row.familyId === familyId
        && row.status === "passed"
        && Array.isArray(row.blockers) && row.blockers.length === 0,
      `v596-product-scene-family-row:${index}`,
    );
    assertV596Formal(
      row.transitions?.entry?.collectorStage === "entry"
        && row.transitions?.hero?.collectorStage === "hero"
        && row.transitions?.exit?.collectorStage === "exit"
        && row.transitions?.hero?.productScene?.familyId === familyId
        && row.transitions?.hero?.productScene?.stageMarker === "hero"
        && row.transitions?.hero?.canvas?.connectedMainCount === 1
        && row.transitions?.hero?.canvas?.totalCount === 1
        && row.lifecycle?.returnedToBaseline === true
        && sameCanonicalV596Formal(row.baseline, row.lifecycle?.exitResources),
      `v596-product-scene-family-transitions:${index}`,
    );
    assertArtifactRecord(root, row.screenshot, `journey-screenshot:${index}`);
    assertArtifactRecord(root, row.telemetry, `journey-telemetry:${index}`);
  });
  assertV596Formal(
    receipt.finalExitReentry?.away?.canvasCount === 0
      && receipt.finalExitReentry?.away?.connectedCanvasCount === 0
      && receipt.finalExitReentry?.identityBound === true
      && receipt.finalExitReentry?.resourcesReturned === true,
    "v596-product-scene-family-exit-reentry",
  );
  assertV596Formal(
    Array.isArray(receipt.globalBlockers) && receipt.globalBlockers.length === 0
      && Array.isArray(receipt.events)
      && !receipt.events.some((event) => event.level === "error"),
    "v596-product-scene-family-errors",
  );
  return Object.freeze({ identity, receiptSha256: receipt.receiptSha256, familyCount: 6 });
}

export function validateV596RealDesktopReceipt(
  receipt,
  expectedIdentity,
  { root = process.cwd(), syntheticFixture = false } = {},
) {
  verifyV596FormalSeal(receipt, "receiptSha256", "real-desktop");
  assertV596Formal(
    receipt.version === V596_REAL_DESKTOP_VERSION
      && receipt.status === V596_REAL_DESKTOP_STATUS,
    "v596-real-desktop-contract",
  );
  assertSyntheticMarker(receipt, syntheticFixture, "real-desktop");
  assertV596Formal(
    receipt.supplementalOnly === true
      && receipt.formalEvidence === false
      && receipt.evidenceClaim === false
      && receipt.promotion === "none"
      && receipt.syntheticZeroClaim === false
      && receipt.qualificationScope === (syntheticFixture
        ? "synthetic-test-only"
        : "supplemental-current-v596-real-desktop-chrome"),
    "v596-real-desktop-supplemental-boundary",
  );
  const identity = validateV596Identity(receipt.identity, expectedIdentity, {
    deliveryTier: "standalone-full",
  });
  assertIdentityBindingMarker(receipt.identity, "real-desktop");
  assertV596Authority(receipt.authority, "real-desktop");
  assertV596Formal(
    receipt.execution?.kind === "real-desktop-chrome"
      && receipt.execution?.headless === false
      && receipt.execution?.viewport === null,
    "v596-real-desktop-execution",
  );
  assertV596Formal(
    receipt.eligibility?.interactiveSession === true
      && receipt.eligibility?.physicalDisplayObserved === true
      && receipt.eligibility?.chromeInstalled === true
      && receipt.eligibility?.hostStable === true
      && receipt.eligibility?.pageIdentityExact === true
      && receipt.eligibility?.sceneReady === true
      && receipt.eligibility?.simulationPaused === true
      && receipt.eligibility?.singleConnectedCanvas === true
      && receipt.eligibility?.runtimeErrorsZero === true
      && receipt.eligibility?.contextHealthy === true
      && receipt.eligibility?.nonSoftwareWebgl === true
      && receipt.eligibility?.hostBrowserGpuCrossCheck === true
      && receipt.eligibility?.realDesktopEligible === true
      && receipt.eligibility?.realMobileEligible === false,
    "v596-real-desktop-eligibility",
  );
  assertV596Formal(
    receipt.boundaries?.supplementalOnly === true
      && receipt.boundaries?.failureClosed === true
      && receipt.boundaries?.priorV595HumanDecisionInherited === false
      && receipt.boundaries?.physicalMobileEvidenceClaimed === false
      && receipt.boundaries?.scientificPayloadMutationAllowed === false
      && receipt.boundaries?.promotionAllowed === false,
    "v596-real-desktop-boundaries",
  );
  assertArtifactRecord(root, receipt.screenshot, "real-desktop-screenshot");
  return Object.freeze({ identity, receiptSha256: receipt.receiptSha256 });
}

function validateGateArtifactSummary(record, label) {
  assertV596Formal(
    record && typeof record === "object"
      && typeof record.path === "string"
      && record.path.length > 0
      && !record.path.includes("\\")
      && !isAbsolute(record.path)
      && record.path.split("/").every((segment) => segment && segment !== "." && segment !== "..")
      && !record.path.split("/").some((segment) => /^v(?:593|594|595)(?:-|$)/.test(segment))
      && Number.isSafeInteger(record.bytes) && record.bytes > 0
      && SHA256_PATTERN.test(record.sha256 ?? ""),
    `v596-browser-gate-summary-record:${label}`,
  );
}

export function validateV596BrowserGate(
  gate,
  {
    expectedFullIdentity = null,
    expectedLiteIdentity = null,
    expectedTimelikeKerr = null,
    syntheticFixture = false,
  } = {},
) {
  verifyV596FormalSeal(gate, "receiptSha256", "browser-gate");
  assertV596Formal(
    gate.version === V596_BROWSER_GATE_VERSION && gate.status === V596_BROWSER_GATE_STATUS,
    "v596-browser-gate-contract",
  );
  assertV596Formal(gate.synthetic === syntheticFixture, "v596-browser-gate-fixture-binding");
  const full = validateV596Identity(gate.candidate, expectedFullIdentity, {
    deliveryTier: "standalone-full",
  });
  validateV596Identity(gate.matrices?.full?.candidate, full, {
    deliveryTier: "standalone-full",
  });
  const lite = validateV596Identity(
    gate.matrices?.lite?.candidate,
    expectedLiteIdentity,
    { deliveryTier: "vercel-lite" },
  );
  validateV596Identity(gate.matrices?.exactAb?.candidate, full, {
    deliveryTier: "standalone-full",
  });
  validateV596Identity(gate.matrices?.stellarScienceCinematic?.candidate, full, {
    deliveryTier: "standalone-full",
  });
  validateV596Identity(gate.matrices?.productSceneFamilies?.candidate, full, {
    deliveryTier: "standalone-full",
  });
  validateV596Identity(gate.supplemental?.realDesktopChrome?.candidate, full, {
    deliveryTier: "standalone-full",
  });
  assertV596Formal(full.buildId !== lite.buildId, "v596-browser-gate-full-lite-alias");
  assertV596Formal(
    gate.matrices?.full?.frameCount === V596_BROWSER_FRAME_COUNTS.full
      && gate.matrices?.lite?.frameCount === V596_BROWSER_FRAME_COUNTS.lite
      && gate.matrices?.exactAb?.pairCount === V596_EXACT_PASSES.length
      && gate.matrices?.exactAb?.frameCount === V596_BROWSER_FRAME_COUNTS["exact-ab"]
      && sameCanonicalV596Formal(gate.matrices?.exactAb?.passes, V596_EXACT_PASSES)
      && sameCanonicalV596Formal(gate.matrices?.exactAb?.lanes, V596_EXACT_LANES)
      && sameCanonicalV596Formal(
        gate.matrices?.exactAb?.pairs,
        V596_EXACT_PAIR_DEFINITIONS,
      )
      && SHA256_PATTERN.test(gate.matrices?.full?.stageReceiptSha256 ?? "")
      && SHA256_PATTERN.test(gate.matrices?.full?.batchSha256 ?? "")
      && SHA256_PATTERN.test(gate.matrices?.lite?.receiptSha256 ?? "")
      && SHA256_PATTERN.test(gate.matrices?.exactAb?.stageReceiptSha256 ?? "")
      && SHA256_PATTERN.test(gate.matrices?.exactAb?.batchSha256 ?? ""),
    "v596-browser-gate-core-matrices",
  );
  assertV596Formal(
    gate.matrices?.stellarScienceCinematic?.targetCount === 24
      && gate.matrices?.stellarScienceCinematic?.modeCount === 2
      && gate.matrices?.stellarScienceCinematic?.frameCount === 48
      && sameCanonicalV596Formal(
        gate.matrices?.stellarScienceCinematic?.targetIds,
        V596_STELLAR_TARGET_IDS,
      )
      && sameCanonicalV596Formal(
        gate.matrices?.stellarScienceCinematic?.modes,
        V596_STELLAR_MODES,
      )
      && gate.matrices?.stellarScienceCinematic?.formalEvidence === !syntheticFixture
      && gate.matrices?.stellarScienceCinematic?.promotion === "none"
      && SHA256_PATTERN.test(
        gate.matrices?.stellarScienceCinematic?.receiptSha256 ?? "",
      ),
    "v596-browser-gate-stellar-matrix",
  );
  assertV596Formal(
    gate.matrices?.productSceneFamilies?.familyCount === 6
      && sameCanonicalV596Formal(
        gate.matrices?.productSceneFamilies?.orderedFamilies,
        V596_PRODUCT_SCENE_FAMILIES,
      )
      && gate.matrices?.productSceneFamilies?.singleCanvasPolicy
        === "one-shared-main-canvas"
      && gate.matrices?.productSceneFamilies?.supplementalOnly === true
      && gate.matrices?.productSceneFamilies?.formalEvidence === false
      && gate.matrices?.productSceneFamilies?.promotion === "none"
      && SHA256_PATTERN.test(gate.matrices?.productSceneFamilies?.receiptSha256 ?? ""),
    "v596-browser-gate-scene-families",
  );
  assertV596Formal(
    gate.supplemental?.realDesktopChrome?.status === V596_REAL_DESKTOP_STATUS
      && gate.supplemental?.realDesktopChrome?.supplementalOnly === true
      && gate.supplemental?.realDesktopChrome?.formalEvidence === false
      && gate.supplemental?.realDesktopChrome?.promotion === "none"
      && gate.supplemental?.realDesktopChrome?.realDesktopEligible === true
      && gate.supplemental?.realDesktopChrome?.realMobileEligible === false
      && SHA256_PATTERN.test(
        gate.supplemental?.realDesktopChrome?.receiptSha256 ?? "",
      ),
    "v596-browser-gate-real-desktop",
  );
  assertV596Formal(
    gate.supplemental?.physicalMobile?.status === V596_PHYSICAL_MOBILE_STATUS
      && gate.supplemental?.physicalMobile?.evidence === null
      && gate.supplemental?.physicalMobile?.formalEvidence === false
      && gate.supplemental?.physicalMobile?.promotion === "none"
      && gate.supplemental?.physicalMobile?.emulatedViewportSubstitutionAllowed === false,
    "v596-browser-gate-physical-mobile",
  );
  assertV596Formal(
    gate.fullLiteIndependentBuilds === true
      && gate.exactAbSameStandaloneBuild === true
      && gate.exactVisibleLeapBoundaryVerified === true
      && gate.priorV595HumanDecisionInherited === false
      && gate.humanDecision === "separate-pending-not-generated",
    "v596-browser-gate-separation",
  );
  assertV596Formal(
    gate.boundaries?.formalProductPointer === "v263"
      && gate.boundaries?.priorV595IdentityReused === false
      && gate.boundaries?.priorV595HumanDecisionInherited === false
      && gate.boundaries?.priorV595HumanDecisionReceiptSha256 === null
      && gate.boundaries?.scientificPayloadMutationAllowed === false
      && gate.boundaries?.productionPromotionAllowed === false,
    "v596-browser-gate-boundaries",
  );
  const timelike = gate.boundaries?.timelikeKerr;
  assertV596Formal(
    timelike?.referenceCandidateOnly === true
      && timelike?.formalEvidence === false
      && timelike?.promotion === "none"
      && timelike?.defaultKernel === "legacy-eih-1pn"
      && SHA256_PATTERN.test(timelike?.admissionSha256 ?? "")
      && SHA256_PATTERN.test(timelike?.admissionReceiptSha256 ?? ""),
    "v596-browser-gate-timelike-kerr",
  );
  if (expectedTimelikeKerr) {
    assertV596Formal(
      timelike.admissionSha256 === expectedTimelikeKerr.admissionSha256
        && timelike.admissionReceiptSha256 === expectedTimelikeKerr.receiptSha256,
      "v596-browser-gate-timelike-binding",
    );
  }
  assertV596Authority(gate.authority, "browser-gate");
  for (const [label, record] of [
    ["full-stage", gate.matrices?.full?.stage],
    ["full-batch", gate.matrices?.full?.batch],
    ["lite-receipt", gate.matrices?.lite?.receipt],
    ["exact-stage", gate.matrices?.exactAb?.stage],
    ["exact-batch", gate.matrices?.exactAb?.batch],
    ["stellar-receipt", gate.matrices?.stellarScienceCinematic?.receipt],
    ["journey-receipt", gate.matrices?.productSceneFamilies?.receipt],
    ["real-desktop-receipt", gate.supplemental?.realDesktopChrome?.receipt],
  ]) validateGateArtifactSummary(record, label);
  return Object.freeze({ full, lite, timelike });
}

async function loadEvidence(root, value, label) {
  assertCurrentV596Path(root, value, label);
  return (await readJsonV596Formal(root, value, label)).value;
}

async function verifyRows(root, rows, label) {
  for (const [index, row] of rows.entries()) {
    await verifyFileReceiptV596Formal(root, row.screenshot, `${label}-screenshot:${index}`);
    await verifyFileReceiptV596Formal(root, row.telemetry, `${label}-telemetry:${index}`);
  }
}

export async function buildV596FinalBrowserGate({
  root = process.cwd(),
  outputRoot = root,
  fullStagePath,
  fullBatchPath,
  exactStagePath,
  exactBatchPath,
  stellarReceiptPath,
  sceneJourneyReceiptPath,
  realDesktopReceiptPath,
  liteReceiptPath = "docs/release/v596/lite-browser-matrix-v596.json",
  liteReceiptCanonicalPath = liteReceiptPath,
  outputPath = "docs/release/v596/final-sealed-browser-gate-v596.json",
  syntheticFixture = false,
} = {}) {
  for (const [label, value] of Object.entries({
    fullStagePath,
    fullBatchPath,
    exactStagePath,
    exactBatchPath,
    stellarReceiptPath,
    sceneJourneyReceiptPath,
    realDesktopReceiptPath,
  })) assertV596Formal(value, `v596-browser-gate-required:${label}`);

  const bundle = await loadCurrentV596Bundle(root, { requireBuilds: true });
  assertCurrentV596Path(bundle.workspace, liteReceiptCanonicalPath, "lite-canonical-path");
  const [fullStage, fullBatch, exactStage, exactBatch, lite, stellar, journeys, desktop] =
    await Promise.all([
      loadEvidence(bundle.workspace, fullStagePath, "full-stage"),
      loadEvidence(bundle.workspace, fullBatchPath, "full-batch"),
      loadEvidence(bundle.workspace, exactStagePath, "exact-stage"),
      loadEvidence(bundle.workspace, exactBatchPath, "exact-batch"),
      loadEvidence(bundle.workspace, liteReceiptPath, "lite-receipt"),
      loadEvidence(bundle.workspace, stellarReceiptPath, "stellar-receipt"),
      loadEvidence(bundle.workspace, sceneJourneyReceiptPath, "scene-journey-receipt"),
      loadEvidence(bundle.workspace, realDesktopReceiptPath, "real-desktop-receipt"),
    ]);

  const full = await validateV596BrowserEvidence({
    root: bundle.workspace,
    stage: fullStage,
    batch: fullBatch,
    stagePath: fullStagePath,
    batchPath: fullBatchPath,
    expectedIdentity: bundle.identities.standalone,
    suite: "full",
    syntheticFixture,
  });
  const exact = await validateV596BrowserEvidence({
    root: bundle.workspace,
    stage: exactStage,
    batch: exactBatch,
    stagePath: exactStagePath,
    batchPath: exactBatchPath,
    expectedIdentity: bundle.identities.standalone,
    suite: "exact-ab",
    syntheticFixture,
  });
  const liteValidated = validateV596LiteReceipt(lite, bundle.identities.lite, {
    syntheticFixture,
  });
  const stellarValidated = validateV596StellarMatrixReceipt(
    stellar,
    bundle.identities.standalone,
    { root: bundle.workspace, syntheticFixture },
  );
  const journeysValidated = validateV596ProductSceneFamilyReceipt(
    journeys,
    bundle.identities.standalone,
    { root: bundle.workspace, syntheticFixture },
  );
  const desktopValidated = validateV596RealDesktopReceipt(
    desktop,
    bundle.identities.standalone,
    { root: bundle.workspace, syntheticFixture },
  );
  assertV596Formal(
    exact.identity.buildId === full.identity.buildId
      && exact.identity.buildFingerprint === full.identity.buildFingerprint,
    "v596-browser-gate-exact-full-build-drift",
  );
  assertV596Formal(
    liteValidated.identity.buildId !== full.identity.buildId,
    "v596-browser-gate-full-lite-alias",
  );
  assertV596Formal(
    exactStage.gates?.exactVisibleLeapBoundary === true,
    "v596-browser-gate-visible-leap-boundary",
  );
  assertV596Authority(bundle.candidate.authority, "candidate");

  await Promise.all([
    verifyFileReceiptV596Formal(bundle.workspace, lite.evidence.stage, "lite-stage-record"),
    verifyFileReceiptV596Formal(bundle.workspace, lite.evidence.batch, "lite-batch-record"),
    verifyRows(bundle.workspace, stellar.rows, "stellar"),
    verifyRows(bundle.workspace, journeys.rows, "journey"),
    verifyFileReceiptV596Formal(bundle.workspace, desktop.screenshot, "real-desktop-screenshot"),
  ]);

  const receipt = sealV596FormalDocument({
    version: V596_BROWSER_GATE_VERSION,
    generatedAt: [
      fullStage.auditedAt,
      exactStage.auditedAt,
      lite.generatedAt,
      stellar.generatedAt,
      journeys.generatedAt,
      desktop.generatedAt,
    ].filter((value) => typeof value === "string").sort().at(-1)
      ?? bundle.source.generatedAt,
    status: V596_BROWSER_GATE_STATUS,
    candidate: full.identity,
    matrices: {
      full: {
        candidate: full.identity,
        frameCount: full.frameCount,
        stageReceiptSha256: full.stageReceiptSha256,
        batchSha256: full.batchSha256,
        stage: await fileReceiptV596Formal(bundle.workspace, fullStagePath, "full-stage"),
        batch: await fileReceiptV596Formal(bundle.workspace, fullBatchPath, "full-batch"),
      },
      lite: {
        frameCount: lite.frameCount,
        receiptSha256: lite.receiptSha256,
        receipt: {
          ...await fileReceiptV596Formal(bundle.workspace, liteReceiptPath, "lite-receipt"),
          path: liteReceiptCanonicalPath,
        },
        candidate: liteValidated.identity,
      },
      exactAb: {
        candidate: exact.identity,
        pairCount: V596_EXACT_PASSES.length,
        frameCount: exact.frameCount,
        passes: V596_EXACT_PASSES,
        lanes: V596_EXACT_LANES,
        pairs: V596_EXACT_PAIR_DEFINITIONS,
        visibleLeapBoundaryVerified: true,
        stageReceiptSha256: exact.stageReceiptSha256,
        batchSha256: exact.batchSha256,
        stage: await fileReceiptV596Formal(bundle.workspace, exactStagePath, "exact-stage"),
        batch: await fileReceiptV596Formal(bundle.workspace, exactBatchPath, "exact-batch"),
      },
      stellarScienceCinematic: {
        candidate: stellarValidated.identity,
        targetCount: 24,
        modeCount: 2,
        frameCount: stellarValidated.frameCount,
        targetIds: V596_STELLAR_TARGET_IDS,
        modes: V596_STELLAR_MODES,
        receiptSha256: stellar.receiptSha256,
        formalEvidence: stellar.formalEvidence,
        promotion: "none",
        receipt: await fileReceiptV596Formal(
          bundle.workspace,
          stellarReceiptPath,
          "stellar-receipt",
        ),
      },
      productSceneFamilies: {
        candidate: journeysValidated.identity,
        familyCount: journeysValidated.familyCount,
        orderedFamilies: V596_PRODUCT_SCENE_FAMILIES,
        singleCanvasPolicy: "one-shared-main-canvas",
        receiptSha256: journeys.receiptSha256,
        supplementalOnly: true,
        formalEvidence: false,
        promotion: "none",
        receipt: await fileReceiptV596Formal(
          bundle.workspace,
          sceneJourneyReceiptPath,
          "scene-journey-receipt",
        ),
      },
    },
    supplemental: {
      realDesktopChrome: {
        candidate: desktopValidated.identity,
        status: desktop.status,
        supplementalOnly: true,
        formalEvidence: false,
        promotion: "none",
        realDesktopEligible: desktop.eligibility.realDesktopEligible,
        realMobileEligible: desktop.eligibility.realMobileEligible,
        receiptSha256: desktopValidated.receiptSha256,
        receipt: await fileReceiptV596Formal(
          bundle.workspace,
          realDesktopReceiptPath,
          "real-desktop-receipt",
        ),
      },
      physicalMobile: {
        status: V596_PHYSICAL_MOBILE_STATUS,
        evidence: null,
        formalEvidence: false,
        promotion: "none",
        emulatedViewportSubstitutionAllowed: false,
      },
    },
    fullLiteIndependentBuilds: true,
    exactAbSameStandaloneBuild: true,
    exactVisibleLeapBoundaryVerified: true,
    priorV595HumanDecisionInherited: false,
    humanDecision: "separate-pending-not-generated",
    boundaries: {
      formalProductPointer: "v263",
      priorV595IdentityReused: false,
      priorV595HumanDecisionInherited: false,
      priorV595HumanDecisionReceiptSha256: null,
      scientificPayloadMutationAllowed: false,
      productionPromotionAllowed: false,
      timelikeKerr: {
        referenceCandidateOnly: true,
        admissionSha256: bundle.candidate.relativity.timelikeKerr.admissionSha256,
        admissionReceiptSha256: bundle.candidate.relativity.timelikeKerr.receiptSha256,
        formalEvidence: false,
        promotion: "none",
        defaultKernel: "legacy-eih-1pn",
      },
    },
    authority: { ...bundle.candidate.authority },
    synthetic: syntheticFixture,
  });
  validateV596BrowserGate(receipt, {
    expectedFullIdentity: bundle.identities.standalone,
    expectedLiteIdentity: bundle.identities.lite,
    expectedTimelikeKerr: bundle.candidate.relativity.timelikeKerr,
    syntheticFixture,
  });
  if (!syntheticFixture) {
    await atomicWriteJsonV596Formal(
      bundle.workspace,
      outputRoot,
      outputPath,
      receipt,
      "browser-gate-output",
    );
  }
  return receipt;
}

export function parseV596BrowserGateArgs(argv) {
  const values = {};
  const valueArgs = new Set([
    "--full-stage",
    "--full-batch",
    "--exact-stage",
    "--exact-batch",
    "--lite-receipt",
    "--stellar-receipt",
    "--scene-journey-receipt",
    "--real-desktop-receipt",
    "--output",
    "--validate-fixture",
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (valueArgs.has(token)) values[token.slice(2)] = argv[++index];
    else throw new Error(`v596-browser-gate-argument:${token}`);
  }
  if (values["validate-fixture"]) {
    const parts = values["validate-fixture"].split(",");
    assertV596Formal(parts.length === 8, "v596-browser-gate-fixture-format");
    [
      values["full-stage"],
      values["full-batch"],
      values["exact-stage"],
      values["exact-batch"],
      values["lite-receipt"],
      values["stellar-receipt"],
      values["scene-journey-receipt"],
      values["real-desktop-receipt"],
    ] = parts;
    values.syntheticFixture = true;
  }
  for (const field of [
    "full-stage",
    "full-batch",
    "exact-stage",
    "exact-batch",
    "stellar-receipt",
    "scene-journey-receipt",
    "real-desktop-receipt",
  ]) assertV596Formal(values[field], `v596-browser-gate-required:${field}`);
  for (const [label, value] of Object.entries(values)) {
    if (typeof value === "string" && label !== "validate-fixture") {
      assertCurrentV596Path(process.cwd(), value, `arg:${label}`);
    }
  }
  return values;
}

async function main() {
  const args = parseV596BrowserGateArgs(process.argv.slice(2));
  const receipt = await buildV596FinalBrowserGate({
    fullStagePath: args["full-stage"],
    fullBatchPath: args["full-batch"],
    exactStagePath: args["exact-stage"],
    exactBatchPath: args["exact-batch"],
    liteReceiptPath: args["lite-receipt"],
    stellarReceiptPath: args["stellar-receipt"],
    sceneJourneyReceiptPath: args["scene-journey-receipt"],
    realDesktopReceiptPath: args["real-desktop-receipt"],
    outputPath: args.output,
    syntheticFixture: args.syntheticFixture === true,
  });
  process.stdout.write(`${JSON.stringify({
    status: receipt.status,
    fullFrames: receipt.matrices.full.frameCount,
    liteFrames: receipt.matrices.lite.frameCount,
    exactPairs: receipt.matrices.exactAb.pairCount,
    stellarFrames: receipt.matrices.stellarScienceCinematic.frameCount,
    sceneFamilies: receipt.matrices.productSceneFamilies.familyCount,
    realDesktopEligible: receipt.supplemental.realDesktopChrome.realDesktopEligible,
    physicalMobile: receipt.supplemental.physicalMobile.status,
    receiptSha256: receipt.receiptSha256,
    synthetic: receipt.synthetic,
  }, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}

export {
  V596_LITE_RECEIPT_STATUS,
  V596_LITE_RECEIPT_VERSION,
  validateV596BrowserEvidence,
};

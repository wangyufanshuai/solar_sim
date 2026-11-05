import { isAbsolute, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  assertV595Authority,
  assertV595EvidenceEnvelope,
  assertV595Formal,
  atomicWriteJsonV595Formal,
  fileReceiptV595Formal,
  loadCurrentV595Bundle,
  readJsonV595Formal,
  resolveInsideV595Workspace,
  sameCanonicalV595Formal,
  sealV595FormalDocument,
  validateV595Identity,
  verifyFileReceiptV595Formal,
  verifyV595FormalSeal,
} from "./v595-formal-contract.mjs";
import {
  V595_BROWSER_FRAME_COUNTS,
  V595_EXACT_LANES,
  V595_EXACT_PASSES,
  V595_LITE_RECEIPT_STATUS,
  V595_LITE_RECEIPT_VERSION,
  validateV595BrowserEvidence,
  validateV595LiteReceipt,
} from "./build-v595-current-lite-matrix.mjs";

export const V595_BROWSER_GATE_VERSION = "v595-final-sealed-browser-gate-v1";
export const V595_BROWSER_GATE_STATUS =
  "passed-current-v595-full-lite-exact-stellar-24x2-and-six-scene-family-browser-gates-human-signoff-pending";
export const V595_STELLAR_MATRIX_VERSION =
  "v595-stellar-science-cinematic-24x2-receipt-v1";
export const V595_STELLAR_MATRIX_STATUS =
  "passed-current-v595-24-hero-science-cinematic-matrix";
export const V595_PRODUCT_SCENE_FAMILY_VERSION =
  "v595-product-scene-family-browser-journeys-v1";
export const V595_PRODUCT_SCENE_FAMILY_STATUS =
  "passed-supplemental-v595-six-product-scene-family-journeys";
export const V595_REAL_DESKTOP_VERSION = "v595-real-desktop-chrome-evidence-v1";
export const V595_REAL_DESKTOP_STATUS = "passed-supplemental-real-desktop-eligible";
export const V595_PHYSICAL_MOBILE_STATUS = "not-present-not-faked";

export const V595_STELLAR_TARGET_IDS = Object.freeze([
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
export const V595_STELLAR_MODES = Object.freeze(["science", "cinematic"]);
export const V595_PRODUCT_SCENE_FAMILIES = Object.freeze([
  "orbit-atlas-overview",
  "object-inspect",
  "stellar-exoplanet-systems",
  "mission-launch",
  "relativity-lab",
  "scene-lab",
]);

const SHA256_PATTERN = /^[0-9a-f]{64}$/;

function assertCurrentV595Path(root, value, label) {
  resolveInsideV595Workspace(root, value, label);
  assertV595Formal(
    !value.split("/").some((segment) => /^v(?:593|594)(?:-|$)/.test(segment)),
    `v595-browser-gate-historical-path:${label}`,
  );
}

function assertArtifactRecord(root, record, label) {
  assertV595Formal(
    record && typeof record === "object"
      && typeof record.path === "string"
      && Number.isSafeInteger(record.bytes) && record.bytes > 0
      && SHA256_PATTERN.test(record.sha256 ?? ""),
    `v595-browser-gate-artifact:${label}`,
  );
  assertCurrentV595Path(root, record.path, label);
}

function assertIdentityBindingMarker(identity, label) {
  const markers = [identity?.bindingStatus, identity?.identityBindingStatus]
    .filter((value) => value !== undefined);
  assertV595Formal(
    markers.every((value) => value === "bound"),
    `v595-browser-gate-identity-binding:${label}`,
  );
}

function assertSyntheticMarker(document, syntheticFixture, label) {
  if (syntheticFixture) {
    assertV595Formal(document.fixture?.synthetic === true, `v595-${label}-fixture-marker`);
  } else {
    assertV595Formal(document.fixture?.synthetic !== true, `v595-${label}-synthetic-as-evidence`);
  }
}

export function validateV595StellarMatrixReceipt(
  receipt,
  expectedIdentity,
  { root = process.cwd(), syntheticFixture = false } = {},
) {
  verifyV595FormalSeal(receipt, "receiptSha256", "stellar-24x2");
  assertV595Formal(
    receipt.version === V595_STELLAR_MATRIX_VERSION
      && receipt.status === V595_STELLAR_MATRIX_STATUS,
    "v595-stellar-24x2-contract",
  );
  assertV595EvidenceEnvelope(receipt, { syntheticFixture });
  assertV595Formal(
    receipt.qualificationScope === (syntheticFixture
      ? "synthetic-test-only"
      : "formal-current-v595-stellar-science-cinematic-24x2")
      && receipt.supplementalOnly === false
      && receipt.failureClosed === true,
    "v595-stellar-24x2-evidence-boundary",
  );
  const identity = validateV595Identity(receipt.identity, expectedIdentity, {
    deliveryTier: "standalone-full",
  });
  assertIdentityBindingMarker(receipt.identity, "stellar-24x2");
  assertV595Authority(receipt.authority, "stellar-24x2");
  assertV595Formal(
    receipt.boundaries?.priorV594HumanDecisionInherited === false
      && receipt.boundaries?.scientificPayloadMutationAllowed === false
      && receipt.boundaries?.promotionAllowed === false
      && receipt.boundaries?.singleCanvasPolicy === "shared-main-canvas",
    "v595-stellar-24x2-boundaries",
  );
  assertV595Formal(
    sameCanonicalV595Formal(receipt.matrix?.targetIds, V595_STELLAR_TARGET_IDS)
      && sameCanonicalV595Formal(receipt.matrix?.modes, V595_STELLAR_MODES)
      && receipt.matrix?.targetCount === 24
      && receipt.matrix?.modeCount === 2
      && receipt.matrix?.frameCount === 48
      && receipt.matrix?.requestedFrameCount === 48
      && receipt.matrix?.lane === "candidate-v595"
      && receipt.matrix?.query === "visualDiagnostics=1&v595ExactAb=1",
    "v595-stellar-24x2-matrix",
  );
  assertV595Formal(
    Array.isArray(receipt.rows) && receipt.rows.length === 48,
    "v595-stellar-24x2-row-count",
  );
  receipt.rows.forEach((row, index) => {
    const targetId = V595_STELLAR_TARGET_IDS[Math.floor(index / 2)];
    const mode = V595_STELLAR_MODES[index % 2];
    assertV595Formal(
      row.index === index
        && row.targetId === targetId
        && row.mode === mode
        && row.status === "passed"
        && Array.isArray(row.errors) && row.errors.length === 0
        && Array.isArray(row.blockers) && row.blockers.length === 0,
      `v595-stellar-24x2-row:${index}`,
    );
    assertV595Formal(
      row.observed?.canvasCount === 1
        && row.observed?.exact?.lane === "candidate-v595"
        && row.observed?.exact?.targetId === targetId
        && row.observed?.exact?.mode === mode
        && row.observed?.exact?.ready === true
        && row.observed?.exact?.renderRevision === 595
        && row.observed?.exact?.promotion === "none"
        && row.observed?.exact?.scientificAuthority === false
        && row.observed?.exact?.measuredAuthority === false
        && row.observed?.exact?.gpuAuthority === false,
      `v595-stellar-24x2-runtime:${index}`,
    );
    assertArtifactRecord(root, row.screenshot, `stellar-screenshot:${index}`);
    assertArtifactRecord(root, row.telemetry, `stellar-telemetry:${index}`);
  });
  assertV595Formal(
    receipt.finalExit?.navigationAway === true
      && receipt.finalExit?.canvasCount === 0
      && receipt.finalExit?.reentryObserved === true
      && receipt.finalExit?.identityBound === true,
    "v595-stellar-24x2-final-exit",
  );
  assertV595Formal(
    Array.isArray(receipt.globalErrors) && receipt.globalErrors.length === 0
      && Array.isArray(receipt.globalBlockers) && receipt.globalBlockers.length === 0,
    "v595-stellar-24x2-global-errors",
  );
  return Object.freeze({ identity, receiptSha256: receipt.receiptSha256, frameCount: 48 });
}

export function validateV595ProductSceneFamilyReceipt(
  receipt,
  expectedIdentity,
  { root = process.cwd(), syntheticFixture = false } = {},
) {
  verifyV595FormalSeal(receipt, "receiptSha256", "product-scene-families");
  assertV595Formal(
    receipt.version === V595_PRODUCT_SCENE_FAMILY_VERSION
      && receipt.status === V595_PRODUCT_SCENE_FAMILY_STATUS,
    "v595-product-scene-family-contract",
  );
  assertSyntheticMarker(receipt, syntheticFixture, "product-scene-family");
  assertV595Formal(
    receipt.supplementalOnly === true
      && receipt.formalEvidence === false
      && receipt.promotion === "none"
      && receipt.failClosed === true,
    "v595-product-scene-family-supplemental-boundary",
  );
  const identity = validateV595Identity(receipt.identity, expectedIdentity, {
    deliveryTier: "standalone-full",
  });
  assertIdentityBindingMarker(receipt.identity, "product-scene-families");
  assertV595Formal(
    sameCanonicalV595Formal(receipt.matrix?.orderedFamilies, V595_PRODUCT_SCENE_FAMILIES)
      && sameCanonicalV595Formal(receipt.matrix?.stages, ["entry", "hero", "exit"])
      && receipt.matrix?.count === 6,
    "v595-product-scene-family-matrix",
  );
  assertV595Formal(
    Array.isArray(receipt.rows) && receipt.rows.length === 6,
    "v595-product-scene-family-row-count",
  );
  receipt.rows.forEach((row, index) => {
    const familyId = V595_PRODUCT_SCENE_FAMILIES[index];
    assertV595Formal(
      row.index === index
        && row.familyId === familyId
        && row.status === "passed"
        && Array.isArray(row.blockers) && row.blockers.length === 0,
      `v595-product-scene-family-row:${index}`,
    );
    assertV595Formal(
      row.transitions?.entry?.collectorStage === "entry"
        && row.transitions?.hero?.collectorStage === "hero"
        && row.transitions?.exit?.collectorStage === "exit"
        && row.transitions?.hero?.productScene?.familyId === familyId
        && row.transitions?.hero?.productScene?.stageMarker === "hero"
        && row.transitions?.hero?.canvas?.connectedMainCount === 1
        && row.transitions?.hero?.canvas?.totalCount === 1
        && row.lifecycle?.returnedToBaseline === true
        && sameCanonicalV595Formal(row.baseline, row.lifecycle?.exitResources),
      `v595-product-scene-family-transitions:${index}`,
    );
    assertArtifactRecord(root, row.screenshot, `journey-screenshot:${index}`);
    assertArtifactRecord(root, row.telemetry, `journey-telemetry:${index}`);
  });
  assertV595Formal(
    receipt.finalExitReentry?.away?.canvasCount === 0
      && receipt.finalExitReentry?.away?.connectedCanvasCount === 0
      && receipt.finalExitReentry?.identityBound === true
      && receipt.finalExitReentry?.resourcesReturned === true,
    "v595-product-scene-family-exit-reentry",
  );
  assertV595Formal(
    Array.isArray(receipt.globalBlockers) && receipt.globalBlockers.length === 0
      && Array.isArray(receipt.events)
      && !receipt.events.some((event) => event.level === "error"),
    "v595-product-scene-family-errors",
  );
  return Object.freeze({ identity, receiptSha256: receipt.receiptSha256, familyCount: 6 });
}

export function validateV595RealDesktopReceipt(
  receipt,
  expectedIdentity,
  { root = process.cwd(), syntheticFixture = false } = {},
) {
  verifyV595FormalSeal(receipt, "receiptSha256", "real-desktop");
  assertV595Formal(
    receipt.version === V595_REAL_DESKTOP_VERSION
      && receipt.status === V595_REAL_DESKTOP_STATUS,
    "v595-real-desktop-contract",
  );
  assertSyntheticMarker(receipt, syntheticFixture, "real-desktop");
  assertV595Formal(
    receipt.supplementalOnly === true
      && receipt.formalEvidence === false
      && receipt.evidenceClaim === false
      && receipt.promotion === "none"
      && receipt.syntheticZeroClaim === false
      && receipt.qualificationScope === (syntheticFixture
        ? "synthetic-test-only"
        : "supplemental-current-v595-real-desktop-chrome"),
    "v595-real-desktop-supplemental-boundary",
  );
  const identity = validateV595Identity(receipt.identity, expectedIdentity, {
    deliveryTier: "standalone-full",
  });
  assertIdentityBindingMarker(receipt.identity, "real-desktop");
  assertV595Authority(receipt.authority, "real-desktop");
  assertV595Formal(
    receipt.execution?.kind === "real-desktop-chrome"
      && receipt.execution?.headless === false
      && receipt.execution?.viewport === null,
    "v595-real-desktop-execution",
  );
  assertV595Formal(
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
    "v595-real-desktop-eligibility",
  );
  assertV595Formal(
    receipt.boundaries?.supplementalOnly === true
      && receipt.boundaries?.failureClosed === true
      && receipt.boundaries?.priorV594HumanDecisionInherited === false
      && receipt.boundaries?.physicalMobileEvidenceClaimed === false
      && receipt.boundaries?.scientificPayloadMutationAllowed === false
      && receipt.boundaries?.promotionAllowed === false,
    "v595-real-desktop-boundaries",
  );
  assertArtifactRecord(root, receipt.screenshot, "real-desktop-screenshot");
  return Object.freeze({ identity, receiptSha256: receipt.receiptSha256 });
}

function validateGateArtifactSummary(record, label) {
  assertV595Formal(
    record && typeof record === "object"
      && typeof record.path === "string"
      && record.path.length > 0
      && !record.path.includes("\\")
      && !isAbsolute(record.path)
      && record.path.split("/").every((segment) => segment && segment !== "." && segment !== "..")
      && !record.path.split("/").some((segment) => /^v(?:593|594)(?:-|$)/.test(segment))
      && Number.isSafeInteger(record.bytes) && record.bytes > 0
      && SHA256_PATTERN.test(record.sha256 ?? ""),
    `v595-browser-gate-summary-record:${label}`,
  );
}

export function validateV595BrowserGate(
  gate,
  {
    expectedFullIdentity = null,
    expectedLiteIdentity = null,
    expectedTimelikeKerr = null,
    syntheticFixture = false,
  } = {},
) {
  verifyV595FormalSeal(gate, "receiptSha256", "browser-gate");
  assertV595Formal(
    gate.version === V595_BROWSER_GATE_VERSION && gate.status === V595_BROWSER_GATE_STATUS,
    "v595-browser-gate-contract",
  );
  assertV595Formal(gate.synthetic === syntheticFixture, "v595-browser-gate-fixture-binding");
  const full = validateV595Identity(gate.candidate, expectedFullIdentity, {
    deliveryTier: "standalone-full",
  });
  validateV595Identity(gate.matrices?.full?.candidate, full, {
    deliveryTier: "standalone-full",
  });
  const lite = validateV595Identity(
    gate.matrices?.lite?.candidate,
    expectedLiteIdentity,
    { deliveryTier: "vercel-lite" },
  );
  validateV595Identity(gate.matrices?.exactAb?.candidate, full, {
    deliveryTier: "standalone-full",
  });
  validateV595Identity(gate.matrices?.stellarScienceCinematic?.candidate, full, {
    deliveryTier: "standalone-full",
  });
  validateV595Identity(gate.matrices?.productSceneFamilies?.candidate, full, {
    deliveryTier: "standalone-full",
  });
  validateV595Identity(gate.supplemental?.realDesktopChrome?.candidate, full, {
    deliveryTier: "standalone-full",
  });
  assertV595Formal(full.buildId !== lite.buildId, "v595-browser-gate-full-lite-alias");
  assertV595Formal(
    gate.matrices?.full?.frameCount === V595_BROWSER_FRAME_COUNTS.full
      && gate.matrices?.lite?.frameCount === V595_BROWSER_FRAME_COUNTS.lite
      && gate.matrices?.exactAb?.pairCount === V595_EXACT_PASSES.length
      && gate.matrices?.exactAb?.frameCount === V595_BROWSER_FRAME_COUNTS["exact-ab"]
      && sameCanonicalV595Formal(gate.matrices?.exactAb?.passes, V595_EXACT_PASSES)
      && sameCanonicalV595Formal(gate.matrices?.exactAb?.lanes, V595_EXACT_LANES)
      && gate.matrices?.exactAb?.relativityObservationMarkerVerified === true
      && SHA256_PATTERN.test(gate.matrices?.full?.stageReceiptSha256 ?? "")
      && SHA256_PATTERN.test(gate.matrices?.full?.batchSha256 ?? "")
      && SHA256_PATTERN.test(gate.matrices?.lite?.receiptSha256 ?? "")
      && SHA256_PATTERN.test(gate.matrices?.exactAb?.stageReceiptSha256 ?? "")
      && SHA256_PATTERN.test(gate.matrices?.exactAb?.batchSha256 ?? ""),
    "v595-browser-gate-core-matrices",
  );
  assertV595Formal(
    gate.matrices?.stellarScienceCinematic?.targetCount === 24
      && gate.matrices?.stellarScienceCinematic?.modeCount === 2
      && gate.matrices?.stellarScienceCinematic?.frameCount === 48
      && sameCanonicalV595Formal(
        gate.matrices?.stellarScienceCinematic?.targetIds,
        V595_STELLAR_TARGET_IDS,
      )
      && sameCanonicalV595Formal(
        gate.matrices?.stellarScienceCinematic?.modes,
        V595_STELLAR_MODES,
      )
      && gate.matrices?.stellarScienceCinematic?.formalEvidence === !syntheticFixture
      && gate.matrices?.stellarScienceCinematic?.promotion === "none"
      && SHA256_PATTERN.test(
        gate.matrices?.stellarScienceCinematic?.receiptSha256 ?? "",
      ),
    "v595-browser-gate-stellar-matrix",
  );
  assertV595Formal(
    gate.matrices?.productSceneFamilies?.familyCount === 6
      && sameCanonicalV595Formal(
        gate.matrices?.productSceneFamilies?.orderedFamilies,
        V595_PRODUCT_SCENE_FAMILIES,
      )
      && gate.matrices?.productSceneFamilies?.singleCanvasPolicy
        === "one-shared-main-canvas"
      && gate.matrices?.productSceneFamilies?.supplementalOnly === true
      && gate.matrices?.productSceneFamilies?.formalEvidence === false
      && gate.matrices?.productSceneFamilies?.promotion === "none"
      && SHA256_PATTERN.test(gate.matrices?.productSceneFamilies?.receiptSha256 ?? ""),
    "v595-browser-gate-scene-families",
  );
  assertV595Formal(
    gate.supplemental?.realDesktopChrome?.status === V595_REAL_DESKTOP_STATUS
      && gate.supplemental?.realDesktopChrome?.supplementalOnly === true
      && gate.supplemental?.realDesktopChrome?.formalEvidence === false
      && gate.supplemental?.realDesktopChrome?.promotion === "none"
      && gate.supplemental?.realDesktopChrome?.realDesktopEligible === true
      && gate.supplemental?.realDesktopChrome?.realMobileEligible === false
      && SHA256_PATTERN.test(
        gate.supplemental?.realDesktopChrome?.receiptSha256 ?? "",
      ),
    "v595-browser-gate-real-desktop",
  );
  assertV595Formal(
    gate.supplemental?.physicalMobile?.status === V595_PHYSICAL_MOBILE_STATUS
      && gate.supplemental?.physicalMobile?.evidence === null
      && gate.supplemental?.physicalMobile?.formalEvidence === false
      && gate.supplemental?.physicalMobile?.promotion === "none"
      && gate.supplemental?.physicalMobile?.emulatedViewportSubstitutionAllowed === false,
    "v595-browser-gate-physical-mobile",
  );
  assertV595Formal(
    gate.fullLiteIndependentBuilds === true
      && gate.exactAbSameStandaloneBuild === true
      && gate.exactRelativityObservationMarkerVerified === true
      && gate.priorV594HumanDecisionInherited === false
      && gate.humanDecision === "separate-pending-not-generated",
    "v595-browser-gate-separation",
  );
  assertV595Formal(
    gate.boundaries?.formalProductPointer === "v263"
      && gate.boundaries?.priorV594IdentityReused === false
      && gate.boundaries?.priorV594HumanDecisionInherited === false
      && gate.boundaries?.priorV594HumanDecisionReceiptSha256 === null
      && gate.boundaries?.scientificPayloadMutationAllowed === false
      && gate.boundaries?.productionPromotionAllowed === false,
    "v595-browser-gate-boundaries",
  );
  const timelike = gate.boundaries?.timelikeKerr;
  assertV595Formal(
    timelike?.referenceCandidateOnly === true
      && timelike?.formalEvidence === false
      && timelike?.promotion === "none"
      && timelike?.defaultKernel === "legacy-eih-1pn"
      && SHA256_PATTERN.test(timelike?.admissionSha256 ?? "")
      && SHA256_PATTERN.test(timelike?.admissionReceiptSha256 ?? ""),
    "v595-browser-gate-timelike-kerr",
  );
  if (expectedTimelikeKerr) {
    assertV595Formal(
      timelike.admissionSha256 === expectedTimelikeKerr.admissionSha256
        && timelike.admissionReceiptSha256 === expectedTimelikeKerr.receiptSha256,
      "v595-browser-gate-timelike-binding",
    );
  }
  assertV595Authority(gate.authority, "browser-gate");
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
  assertCurrentV595Path(root, value, label);
  return (await readJsonV595Formal(root, value, label)).value;
}

async function verifyRows(root, rows, label) {
  for (const [index, row] of rows.entries()) {
    await verifyFileReceiptV595Formal(root, row.screenshot, `${label}-screenshot:${index}`);
    await verifyFileReceiptV595Formal(root, row.telemetry, `${label}-telemetry:${index}`);
  }
}

export async function buildV595FinalBrowserGate({
  root = process.cwd(),
  outputRoot = root,
  fullStagePath,
  fullBatchPath,
  exactStagePath,
  exactBatchPath,
  stellarReceiptPath,
  sceneJourneyReceiptPath,
  realDesktopReceiptPath,
  liteReceiptPath = "docs/release/v595/lite-browser-matrix-v595.json",
  liteReceiptCanonicalPath = liteReceiptPath,
  outputPath = "docs/release/v595/final-sealed-browser-gate-v595.json",
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
  })) assertV595Formal(value, `v595-browser-gate-required:${label}`);

  const bundle = await loadCurrentV595Bundle(root, { requireBuilds: true });
  assertCurrentV595Path(bundle.workspace, liteReceiptCanonicalPath, "lite-canonical-path");
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

  const full = await validateV595BrowserEvidence({
    root: bundle.workspace,
    stage: fullStage,
    batch: fullBatch,
    stagePath: fullStagePath,
    batchPath: fullBatchPath,
    expectedIdentity: bundle.identities.standalone,
    suite: "full",
    syntheticFixture,
  });
  const exact = await validateV595BrowserEvidence({
    root: bundle.workspace,
    stage: exactStage,
    batch: exactBatch,
    stagePath: exactStagePath,
    batchPath: exactBatchPath,
    expectedIdentity: bundle.identities.standalone,
    suite: "exact-ab",
    syntheticFixture,
  });
  const liteValidated = validateV595LiteReceipt(lite, bundle.identities.lite, {
    syntheticFixture,
  });
  const stellarValidated = validateV595StellarMatrixReceipt(
    stellar,
    bundle.identities.standalone,
    { root: bundle.workspace, syntheticFixture },
  );
  const journeysValidated = validateV595ProductSceneFamilyReceipt(
    journeys,
    bundle.identities.standalone,
    { root: bundle.workspace, syntheticFixture },
  );
  const desktopValidated = validateV595RealDesktopReceipt(
    desktop,
    bundle.identities.standalone,
    { root: bundle.workspace, syntheticFixture },
  );
  assertV595Formal(
    exact.identity.buildId === full.identity.buildId
      && exact.identity.buildFingerprint === full.identity.buildFingerprint,
    "v595-browser-gate-exact-full-build-drift",
  );
  assertV595Formal(
    liteValidated.identity.buildId !== full.identity.buildId,
    "v595-browser-gate-full-lite-alias",
  );
  assertV595Formal(
    exactStage.gates?.exactRelativityObservationMarker === true,
    "v595-browser-gate-relativity-observation-marker",
  );
  assertV595Authority(bundle.candidate.authority, "candidate");

  await Promise.all([
    verifyFileReceiptV595Formal(bundle.workspace, lite.evidence.stage, "lite-stage-record"),
    verifyFileReceiptV595Formal(bundle.workspace, lite.evidence.batch, "lite-batch-record"),
    verifyRows(bundle.workspace, stellar.rows, "stellar"),
    verifyRows(bundle.workspace, journeys.rows, "journey"),
    verifyFileReceiptV595Formal(bundle.workspace, desktop.screenshot, "real-desktop-screenshot"),
  ]);

  const receipt = sealV595FormalDocument({
    version: V595_BROWSER_GATE_VERSION,
    generatedAt: [
      fullStage.auditedAt,
      exactStage.auditedAt,
      lite.generatedAt,
      stellar.generatedAt,
      journeys.generatedAt,
      desktop.generatedAt,
    ].filter((value) => typeof value === "string").sort().at(-1)
      ?? bundle.source.generatedAt,
    status: V595_BROWSER_GATE_STATUS,
    candidate: full.identity,
    matrices: {
      full: {
        candidate: full.identity,
        frameCount: full.frameCount,
        stageReceiptSha256: full.stageReceiptSha256,
        batchSha256: full.batchSha256,
        stage: await fileReceiptV595Formal(bundle.workspace, fullStagePath, "full-stage"),
        batch: await fileReceiptV595Formal(bundle.workspace, fullBatchPath, "full-batch"),
      },
      lite: {
        frameCount: lite.frameCount,
        receiptSha256: lite.receiptSha256,
        receipt: {
          ...await fileReceiptV595Formal(bundle.workspace, liteReceiptPath, "lite-receipt"),
          path: liteReceiptCanonicalPath,
        },
        candidate: liteValidated.identity,
      },
      exactAb: {
        candidate: exact.identity,
        pairCount: V595_EXACT_PASSES.length,
        frameCount: exact.frameCount,
        passes: V595_EXACT_PASSES,
        lanes: V595_EXACT_LANES,
        relativityObservationMarkerVerified: true,
        stageReceiptSha256: exact.stageReceiptSha256,
        batchSha256: exact.batchSha256,
        stage: await fileReceiptV595Formal(bundle.workspace, exactStagePath, "exact-stage"),
        batch: await fileReceiptV595Formal(bundle.workspace, exactBatchPath, "exact-batch"),
      },
      stellarScienceCinematic: {
        candidate: stellarValidated.identity,
        targetCount: 24,
        modeCount: 2,
        frameCount: stellarValidated.frameCount,
        targetIds: V595_STELLAR_TARGET_IDS,
        modes: V595_STELLAR_MODES,
        receiptSha256: stellar.receiptSha256,
        formalEvidence: stellar.formalEvidence,
        promotion: "none",
        receipt: await fileReceiptV595Formal(
          bundle.workspace,
          stellarReceiptPath,
          "stellar-receipt",
        ),
      },
      productSceneFamilies: {
        candidate: journeysValidated.identity,
        familyCount: journeysValidated.familyCount,
        orderedFamilies: V595_PRODUCT_SCENE_FAMILIES,
        singleCanvasPolicy: "one-shared-main-canvas",
        receiptSha256: journeys.receiptSha256,
        supplementalOnly: true,
        formalEvidence: false,
        promotion: "none",
        receipt: await fileReceiptV595Formal(
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
        receipt: await fileReceiptV595Formal(
          bundle.workspace,
          realDesktopReceiptPath,
          "real-desktop-receipt",
        ),
      },
      physicalMobile: {
        status: V595_PHYSICAL_MOBILE_STATUS,
        evidence: null,
        formalEvidence: false,
        promotion: "none",
        emulatedViewportSubstitutionAllowed: false,
      },
    },
    fullLiteIndependentBuilds: true,
    exactAbSameStandaloneBuild: true,
    exactRelativityObservationMarkerVerified: true,
    priorV594HumanDecisionInherited: false,
    humanDecision: "separate-pending-not-generated",
    boundaries: {
      formalProductPointer: "v263",
      priorV594IdentityReused: false,
      priorV594HumanDecisionInherited: false,
      priorV594HumanDecisionReceiptSha256: null,
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
  validateV595BrowserGate(receipt, {
    expectedFullIdentity: bundle.identities.standalone,
    expectedLiteIdentity: bundle.identities.lite,
    expectedTimelikeKerr: bundle.candidate.relativity.timelikeKerr,
    syntheticFixture,
  });
  if (!syntheticFixture) {
    await atomicWriteJsonV595Formal(
      bundle.workspace,
      outputRoot,
      outputPath,
      receipt,
      "browser-gate-output",
    );
  }
  return receipt;
}

export function parseV595BrowserGateArgs(argv) {
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
    else throw new Error(`v595-browser-gate-argument:${token}`);
  }
  if (values["validate-fixture"]) {
    const parts = values["validate-fixture"].split(",");
    assertV595Formal(parts.length === 8, "v595-browser-gate-fixture-format");
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
  ]) assertV595Formal(values[field], `v595-browser-gate-required:${field}`);
  for (const [label, value] of Object.entries(values)) {
    if (typeof value === "string" && label !== "validate-fixture") {
      assertCurrentV595Path(process.cwd(), value, `arg:${label}`);
    }
  }
  return values;
}

async function main() {
  const args = parseV595BrowserGateArgs(process.argv.slice(2));
  const receipt = await buildV595FinalBrowserGate({
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
  V595_LITE_RECEIPT_STATUS,
  V595_LITE_RECEIPT_VERSION,
  validateV595BrowserEvidence,
};

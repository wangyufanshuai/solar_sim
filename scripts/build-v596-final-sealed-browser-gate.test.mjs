import assert from "node:assert/strict";
import test from "node:test";

import {
  V596_BROWSER_GATE_STATUS,
  V596_BROWSER_GATE_VERSION,
  V596_PHYSICAL_MOBILE_STATUS,
  V596_PRODUCT_SCENE_FAMILIES,
  V596_PRODUCT_SCENE_FAMILY_STATUS,
  V596_PRODUCT_SCENE_FAMILY_VERSION,
  V596_REAL_DESKTOP_STATUS,
  V596_REAL_DESKTOP_VERSION,
  V596_STELLAR_MATRIX_STATUS,
  V596_STELLAR_MATRIX_VERSION,
  V596_STELLAR_MODES,
  V596_STELLAR_TARGET_IDS,
  parseV596BrowserGateArgs,
  validateV596BrowserGate,
  validateV596ProductSceneFamilyReceipt,
  validateV596RealDesktopReceipt,
  validateV596StellarMatrixReceipt,
} from "./build-v596-final-sealed-browser-gate.mjs";
import {
  V596_EXACT_LANES,
  V596_EXACT_PAIR_DEFINITIONS,
  V596_EXACT_PASSES,
} from "./build-v596-current-lite-matrix.mjs";
import { sealV596FormalDocument } from "./v596-formal-contract.mjs";

const SOURCE_SHA = "a".repeat(64);
const CANDIDATE_SHA = "b".repeat(64);
const FULL_FINGERPRINT = "c".repeat(64);
const LITE_FINGERPRINT = "d".repeat(64);
const TIMELIKE_ADMISSION = "1".repeat(64);
const TIMELIKE_RECEIPT = "2".repeat(64);

function identity(tier = "standalone-full") {
  const fingerprint = tier === "vercel-lite" ? LITE_FINGERPRINT : FULL_FINGERPRINT;
  return {
    sourceManifestSha256: SOURCE_SHA,
    candidateManifestSha256: CANDIDATE_SHA,
    buildId: `v596b-${fingerprint}`,
    buildFingerprint: fingerprint,
    deploymentId: `v596-${SOURCE_SHA.slice(0, 12)}-${CANDIDATE_SHA.slice(0, 12)}`,
    formalProductPointer: "v263",
    deliveryTier: tier,
    bindingStatus: "bound",
  };
}

const authority = Object.freeze({
  defaultKernel: "legacy-eih-1pn",
  v2Mode: "shadow-only",
  scientificAuthorityGranted: false,
  scientificPayloadMutationAllowed: false,
  measuredAuthorityGranted: false,
  gpuAuthorityGranted: false,
  resolvedSurfaceAuthorityGranted: false,
  observationTextureAuthorityGranted: false,
  radiativeTransferGranted: false,
  grmhdGranted: false,
  geometryReferenceGranted: false,
  polarizationTransportReferenceGranted: false,
  productionReleaseAuthorized: false,
  productionPromotionAllowed: false,
});

function artifact(path, sha = "e".repeat(64)) {
  return { path, bytes: 100, sha256: sha };
}

function stellarReceipt() {
  const rows = V596_STELLAR_TARGET_IDS.flatMap((targetId) => (
    V596_STELLAR_MODES.map((mode) => ({ targetId, mode }))
  )).map(({ targetId, mode }, index) => ({
    index,
    id: `stellar-${targetId}-${mode}`,
    targetId,
    mode,
    status: "passed",
    errors: [],
    blockers: [],
    observed: {
      canvas: { count: 1, connected: 1 },
      checkpoint: {
        targetId,
        mode,
        bindingStatus: "bound",
      },
      consumer: {
        ready: "true",
        singleCanvasPolicy: "shared-main-canvas",
        scientificAuthority: "false",
        measuredAuthority: "false",
        gpuAuthority: "false",
        resolvedSurfaceAuthority: "false",
        observationTextureAuthority: "false",
        radiativeTransferAuthority: "false",
        grmhdAuthority: "false",
        scientificPayloadWriteback: "false",
      },
    },
    screenshot: artifact(`tmp/v596-stellar-fixture/screenshots/${index}.png`),
    telemetry: artifact(`tmp/v596-stellar-fixture/telemetry/${index}.json`),
  }));
  return sealV596FormalDocument({
    version: V596_STELLAR_MATRIX_VERSION,
    status: V596_STELLAR_MATRIX_STATUS,
    generatedAt: "2026-08-28T00:00:00.000Z",
    fixture: { synthetic: true },
    formalEvidence: false,
    evidenceClaim: false,
    qualificationScope: "synthetic-test-only",
    promotion: "none",
    syntheticZeroClaim: false,
    supplementalOnly: false,
    failureClosed: true,
    identity: identity(),
    authority,
    boundaries: {
      priorV595HumanDecisionInherited: false,
      scientificPayloadMutationAllowed: false,
      promotionAllowed: false,
      singleCanvasPolicy: "shared-main-canvas",
    },
    matrix: {
      targetIds: V596_STELLAR_TARGET_IDS,
      modes: V596_STELLAR_MODES,
      targetCount: 24,
      modeCount: 2,
      frameCount: 48,
      requestedFrameCount: 48,
      query: "v596VisualCheckpoint=1",
      runtimeConsumer: "webgl-main-scene-v1",
    },
    rows,
    globalErrors: [],
    globalBlockers: [],
  });
}

function sceneJourneyReceipt() {
  const rows = V596_PRODUCT_SCENE_FAMILIES.map((familyId, index) => {
    const baseline = { total: 0, workers: 0, identityDigest: "baseline" };
    return {
      index,
      familyId,
      status: "passed",
      blockers: [],
      baseline,
      transitions: {
        entry: { collectorStage: "entry" },
        hero: {
          collectorStage: "hero",
          productScene: { familyId, stageMarker: "hero" },
          canvas: { connectedMainCount: 1, totalCount: 1 },
        },
        exit: { collectorStage: "exit" },
      },
      lifecycle: { returnedToBaseline: true, exitResources: baseline },
      screenshot: artifact(`tmp/v596-journey-fixture/screenshots/${index}.png`),
      telemetry: artifact(`tmp/v596-journey-fixture/telemetry/${index}.json`),
    };
  });
  return sealV596FormalDocument({
    version: V596_PRODUCT_SCENE_FAMILY_VERSION,
    status: V596_PRODUCT_SCENE_FAMILY_STATUS,
    generatedAt: "2026-08-28T00:00:00.000Z",
    fixture: { synthetic: true },
    supplementalOnly: true,
    formalEvidence: false,
    promotion: "none",
    failClosed: true,
    identity: identity(),
    matrix: {
      orderedFamilies: V596_PRODUCT_SCENE_FAMILIES,
      stages: ["entry", "hero", "exit"],
      count: 6,
    },
    rows,
    events: [],
    globalBlockers: [],
    finalExitReentry: {
      away: { canvasCount: 0, connectedCanvasCount: 0 },
      identityBound: true,
      resourcesReturned: true,
    },
  });
}

function realDesktopReceipt() {
  return sealV596FormalDocument({
    version: V596_REAL_DESKTOP_VERSION,
    status: V596_REAL_DESKTOP_STATUS,
    generatedAt: "2026-08-28T00:00:00.000Z",
    fixture: { synthetic: true },
    supplementalOnly: true,
    formalEvidence: false,
    evidenceClaim: false,
    promotion: "none",
    syntheticZeroClaim: false,
    qualificationScope: "synthetic-test-only",
    identity: identity(),
    authority,
    execution: { kind: "real-desktop-chrome", headless: false, viewport: null },
    eligibility: {
      interactiveSession: true,
      physicalDisplayObserved: true,
      chromeInstalled: true,
      hostStable: true,
      pageIdentityExact: true,
      sceneReady: true,
      simulationPaused: true,
      singleConnectedCanvas: true,
      runtimeErrorsZero: true,
      contextHealthy: true,
      nonSoftwareWebgl: true,
      hostBrowserGpuCrossCheck: true,
      realDesktopEligible: true,
      realMobileEligible: false,
    },
    boundaries: {
      supplementalOnly: true,
      failureClosed: true,
      priorV595HumanDecisionInherited: false,
      physicalMobileEvidenceClaimed: false,
      scientificPayloadMutationAllowed: false,
      promotionAllowed: false,
    },
    screenshot: artifact("tmp/v596-real-desktop-fixture/real-desktop.png"),
  });
}

function gateReceipt() {
  const full = identity();
  const lite = identity("vercel-lite");
  return sealV596FormalDocument({
    version: V596_BROWSER_GATE_VERSION,
    status: V596_BROWSER_GATE_STATUS,
    generatedAt: "2026-08-28T00:00:00.000Z",
    candidate: full,
    matrices: {
      full: {
        candidate: full,
        frameCount: 13,
        stageReceiptSha256: "3".repeat(64),
        batchSha256: "4".repeat(64),
        stage: artifact("tmp/v596-gate-fixture/full/stage.json"),
        batch: artifact("tmp/v596-gate-fixture/full/batch.json"),
      },
      lite: {
        frameCount: 8,
        receiptSha256: "5".repeat(64),
        candidate: lite,
        receipt: artifact("docs/release/v596/lite-browser-matrix-v596.json"),
      },
      exactAb: {
        candidate: full,
        pairCount: 8,
        frameCount: 16,
        passes: V596_EXACT_PASSES,
        lanes: V596_EXACT_LANES,
        pairs: V596_EXACT_PAIR_DEFINITIONS,
        visibleLeapBoundaryVerified: true,
        stageReceiptSha256: "6".repeat(64),
        batchSha256: "7".repeat(64),
        stage: artifact("tmp/v596-gate-fixture/exact/stage.json"),
        batch: artifact("tmp/v596-gate-fixture/exact/batch.json"),
      },
      stellarScienceCinematic: {
        candidate: full,
        targetCount: 24,
        modeCount: 2,
        frameCount: 48,
        targetIds: V596_STELLAR_TARGET_IDS,
        modes: V596_STELLAR_MODES,
        formalEvidence: false,
        promotion: "none",
        receiptSha256: "8".repeat(64),
        receipt: artifact("tmp/v596-gate-fixture/stellar/receipt.json"),
      },
      productSceneFamilies: {
        candidate: full,
        familyCount: 6,
        orderedFamilies: V596_PRODUCT_SCENE_FAMILIES,
        singleCanvasPolicy: "one-shared-main-canvas",
        supplementalOnly: true,
        formalEvidence: false,
        promotion: "none",
        receiptSha256: "9".repeat(64),
        receipt: artifact("tmp/v596-gate-fixture/journeys/receipt.json"),
      },
    },
    supplemental: {
      realDesktopChrome: {
        candidate: full,
        status: V596_REAL_DESKTOP_STATUS,
        supplementalOnly: true,
        formalEvidence: false,
        promotion: "none",
        realDesktopEligible: true,
        realMobileEligible: false,
        receiptSha256: "0".repeat(64),
        receipt: artifact("tmp/v596-gate-fixture/desktop/receipt.json"),
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
        admissionSha256: TIMELIKE_ADMISSION,
        admissionReceiptSha256: TIMELIKE_RECEIPT,
        formalEvidence: false,
        promotion: "none",
        defaultKernel: "legacy-eih-1pn",
      },
    },
    authority,
    synthetic: true,
  });
}

function reseal(document, overrides) {
  const unsigned = { ...document, ...overrides };
  delete unsigned.receiptSha256;
  return sealV596FormalDocument(unsigned);
}

test("v596 supplemental receipt validators bind current identity without authority grants", () => {
  const full = identity();
  assert.equal(validateV596StellarMatrixReceipt(stellarReceipt(), full, {
    syntheticFixture: true,
  }).frameCount, 48);
  assert.equal(validateV596ProductSceneFamilyReceipt(sceneJourneyReceipt(), full, {
    syntheticFixture: true,
  }).familyCount, 6);
  assert.equal(validateV596RealDesktopReceipt(realDesktopReceipt(), full, {
    syntheticFixture: true,
  }).identity.buildId, full.buildId);
});

test("v596 browser gate accepts all current matrices and records physical mobile as absent", () => {
  const gate = gateReceipt();
  const result = validateV596BrowserGate(gate, {
    expectedFullIdentity: identity(),
    expectedLiteIdentity: identity("vercel-lite"),
    expectedTimelikeKerr: {
      admissionSha256: TIMELIKE_ADMISSION,
      receiptSha256: TIMELIKE_RECEIPT,
    },
    syntheticFixture: true,
  });
  assert.equal(result.full.buildId, identity().buildId);
  assert.equal(gate.supplemental.physicalMobile.status, "not-present-not-faked");
});

test("v596 browser gate rejects migrated v595 approval and faked physical mobile", () => {
  const gate = gateReceipt();
  const migrated = reseal(gate, { priorV595HumanDecisionInherited: true });
  assert.throws(() => validateV596BrowserGate(migrated, {
    expectedFullIdentity: identity(),
    expectedLiteIdentity: identity("vercel-lite"),
    syntheticFixture: true,
  }), /separation/);

  const supplemental = {
    ...gate.supplemental,
    physicalMobile: {
      ...gate.supplemental.physicalMobile,
      status: "passed-physical-mobile",
      evidence: artifact("tmp/v596-fake-mobile.png"),
    },
  };
  const faked = reseal(gate, { supplemental });
  assert.throws(() => validateV596BrowserGate(faked, {
    expectedFullIdentity: identity(),
    expectedLiteIdentity: identity("vercel-lite"),
    syntheticFixture: true,
  }), /physical-mobile/);
});

test("v596 supplemental validators fail closed on mobile alias, row drift, and traversal", () => {
  const desktop = realDesktopReceipt();
  const badEligibility = { ...desktop.eligibility, realMobileEligible: true };
  assert.throws(
    () => validateV596RealDesktopReceipt(reseal(desktop, { eligibility: badEligibility }), identity(), {
      syntheticFixture: true,
    }),
    /eligibility/,
  );

  const stellar = stellarReceipt();
  const rows = stellar.rows.map((row, index) => index === 0
    ? { ...row, screenshot: { ...row.screenshot, path: "../outside.png" } }
    : row);
  assert.throws(
    () => validateV596StellarMatrixReceipt(reseal(stellar, { rows }), identity(), {
      syntheticFixture: true,
    }),
    /path|boundary/,
  );
});

test("v596 browser gate rejects identity drift and byte-seal tampering", () => {
  const gate = gateReceipt();
  const matrices = {
    ...gate.matrices,
    lite: { ...gate.matrices.lite, candidate: identity() },
  };
  const aliased = reseal(gate, { matrices });
  assert.throws(() => validateV596BrowserGate(aliased, {
    expectedFullIdentity: identity(),
    expectedLiteIdentity: identity("vercel-lite"),
    syntheticFixture: true,
  }), /wrong-tier|drift|alias/);

  assert.throws(() => validateV596BrowserGate({ ...gate, status: "tampered" }, {
    expectedFullIdentity: identity(),
    expectedLiteIdentity: identity("vercel-lite"),
    syntheticFixture: true,
  }), /seal-invalid/);
});

test("v596 browser gate CLI rejects historical and traversal inputs", () => {
  const required = [
    "--full-stage", "tmp/v595-old/stage.json",
    "--full-batch", "tmp/v596/full/batch.json",
    "--exact-stage", "tmp/v596/exact/stage.json",
    "--exact-batch", "tmp/v596/exact/batch.json",
    "--stellar-receipt", "tmp/v596/stellar/receipt.json",
    "--scene-journey-receipt", "tmp/v596/journeys/receipt.json",
    "--real-desktop-receipt", "tmp/v596/desktop/receipt.json",
  ];
  assert.throws(() => parseV596BrowserGateArgs(required), /historical-path/);
  const traversal = required.map((value) => value === "tmp/v595-old/stage.json"
    ? "../stage.json"
    : value);
  assert.throws(() => parseV596BrowserGateArgs(traversal), /path|boundary/);
});

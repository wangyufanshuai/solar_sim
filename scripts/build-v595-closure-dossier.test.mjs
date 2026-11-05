import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";

import {
  parseV595ClosureArgs,
  validateV595ClosureInputs,
  verifyV595RawEvidenceRecords,
  V595_QUALIFICATION_STATUS,
} from "./build-v595-closure-dossier.mjs";
import {
  createV595HumanChallenge,
  V595_EXACT_AB_LANES,
  V595_HUMAN_REVIEW_PASSES,
  V595_HUMAN_SIGNOFF_STATUS,
  V595_HUMAN_SIGNOFF_VERSION,
  V595_PRODUCT_SCENE_FAMILIES,
} from "./build-v595-human-visual-signoff.mjs";
import {
  V595_BROWSER_GATE_STATUS,
  V595_BROWSER_GATE_VERSION,
  V595_STELLAR_MODES,
  V595_STELLAR_TARGET_IDS,
} from "./build-v595-final-sealed-browser-gate.mjs";
import {
  V595_LITE_RECEIPT_STATUS,
  V595_LITE_RECEIPT_VERSION,
} from "./build-v595-current-lite-matrix.mjs";
import {
  V595_LIFECYCLE_SYNTHETIC_RECEIPT_STATUS,
  V595_LIFECYCLE_RECEIPT_VERSION,
  V595_SCENE_EXIT_RELEASE_CONTRACT_VERSION,
} from "./build-v595-current-source-lifecycle.mjs";
import {
  V595_SOAK_SYNTHETIC_RECEIPT_STATUS,
  V595_SOAK_RECEIPT_VERSION,
} from "./build-v595-current-source-soak.mjs";
import {
  canonicalShaV595Formal,
  fileReceiptV595Formal,
  sealV595FormalDocument,
  V595_PARENT_V594_IDENTITY,
} from "./v595-formal-contract.mjs";

const fullIdentity = Object.freeze({
  sourceManifestSha256: "a".repeat(64),
  candidateManifestSha256: "b".repeat(64),
  buildId: `v595b-${"c".repeat(64)}`,
  buildFingerprint: "c".repeat(64),
  deploymentId: `v595-${"a".repeat(12)}-${"b".repeat(12)}`,
  formalProductPointer: "v263",
  deliveryTier: "standalone-full",
});
const liteIdentity = Object.freeze({
  ...fullIdentity,
  buildId: `v595b-${"d".repeat(64)}`,
  buildFingerprint: "d".repeat(64),
  deliveryTier: "vercel-lite",
});
const authority = Object.freeze({
  defaultKernel: "legacy-eih-1pn",
  v2Mode: "shadow-only",
  scientificAuthorityGranted: false,
  scientificPayloadMutationAllowed: false,
  measuredAuthorityGranted: false,
  gpuAuthorityGranted: false,
  radiativeTransferGranted: false,
  grmhdGranted: false,
  geometryReferenceGranted: false,
  polarizationTransportReferenceGranted: false,
  productionReleaseAuthorized: false,
  productionPromotionAllowed: false,
});

function candidate(overrides = {}) {
  return {
    generatedAt: "2026-08-28T00:00:00.000Z",
    governance: {
      parentV594Immutable: true,
      priorV594HumanDecisionInherited: false,
      parentSourceManifestSha256: V595_PARENT_V594_IDENTITY.sourceManifestSha256,
      parentCandidateManifestSha256: V595_PARENT_V594_IDENTITY.candidateManifestSha256,
      parentReleaseDossierSha256: V595_PARENT_V594_IDENTITY.releaseDossierSha256,
      parentResealReceiptSha256: V595_PARENT_V594_IDENTITY.resealReceiptSha256,
    },
    parentV594: { ...V595_PARENT_V594_IDENTITY },
    stellar: {
      rosterCount: 24,
      presentationAdmittedCount: 24,
      measurementAdmittedCount: 0,
      presentationOnly: true,
      resolvedSurfaceClaim: false,
      observationTextureClaim: false,
    },
    productSceneFamilies: {
      familyCount: 6,
      orderedFamilyIds: V595_PRODUCT_SCENE_FAMILIES,
      sharedMainCanvas: true,
      webglCanvasCount: 1,
      independentWebglSceneCountClaim: false,
    },
    relativity: {
      inheritedWeakFieldDefaultKernel: "legacy-eih-1pn",
      inheritedV2Mode: "shadow-only",
      timelikeKerr: {
        admissionSha256: "1".repeat(64),
        receiptSha256: "2".repeat(64),
        manifestSha256: "3".repeat(64),
        summarySha256: "4".repeat(64),
        sourceSha256: "5".repeat(64),
        fixtureCount: 4,
        analyticAnchorCount: 3,
        referenceCandidateOnly: true,
        formalEvidence: false,
        promotion: "none",
      },
    },
    authority,
    ...overrides,
  };
}

function reseal(document, overrides = {}) {
  const unsigned = { ...document, ...overrides };
  delete unsigned.receiptSha256;
  return sealV595FormalDocument(unsigned);
}

function makeBrowserGate(candidateDocument, liteReceiptSha256, overrides = {}) {
  const timelike = candidateDocument.relativity.timelikeKerr;
  return sealV595FormalDocument({
    version: V595_BROWSER_GATE_VERSION,
    status: V595_BROWSER_GATE_STATUS,
    candidate: fullIdentity,
    matrices: {
      full: {
        candidate: fullIdentity,
        frameCount: 13,
        stageReceiptSha256: "6".repeat(64),
        batchSha256: "7".repeat(64),
        stage: { path: "tmp/full-stage.json", bytes: 1, sha256: "6".repeat(64) },
        batch: { path: "tmp/full-batch.json", bytes: 1, sha256: "7".repeat(64) },
      },
      lite: {
        frameCount: 8,
        receiptSha256: liteReceiptSha256,
        candidate: liteIdentity,
        receipt: { path: "tmp/lite.json", bytes: 1, sha256: "7".repeat(64) },
      },
      exactAb: {
        candidate: fullIdentity,
        pairCount: 8,
        frameCount: 16,
        passes: V595_HUMAN_REVIEW_PASSES,
        lanes: V595_EXACT_AB_LANES,
        stageReceiptSha256: "8".repeat(64),
        batchSha256: "9".repeat(64),
        relativityObservationMarkerVerified: true,
        stage: { path: "tmp/exact-stage.json", bytes: 1, sha256: "a".repeat(64) },
        batch: { path: "tmp/exact-batch.json", bytes: 1, sha256: "b".repeat(64) },
      },
      stellarScienceCinematic: {
        candidate: fullIdentity,
        targetCount: 24,
        modeCount: 2,
        frameCount: 48,
        targetIds: V595_STELLAR_TARGET_IDS,
        modes: V595_STELLAR_MODES,
        receiptSha256: "b".repeat(64),
        formalEvidence: false,
        promotion: "none",
        receipt: { path: "tmp/stellar.json", bytes: 1, sha256: "c".repeat(64) },
      },
      productSceneFamilies: {
        candidate: fullIdentity,
        familyCount: 6,
        orderedFamilies: V595_PRODUCT_SCENE_FAMILIES,
        singleCanvasPolicy: "one-shared-main-canvas",
        supplementalOnly: true,
        formalEvidence: false,
        promotion: "none",
        receiptSha256: "d".repeat(64),
        receipt: { path: "tmp/families.json", bytes: 1, sha256: "e".repeat(64) },
      },
    },
    supplemental: {
      realDesktopChrome: {
        candidate: fullIdentity,
        status: "passed-supplemental-real-desktop-eligible",
        supplementalOnly: true,
        formalEvidence: false,
        promotion: "none",
        realDesktopEligible: true,
        realMobileEligible: false,
        receiptSha256: "f".repeat(64),
        receipt: { path: "tmp/desktop.json", bytes: 1, sha256: "1".repeat(64) },
      },
      physicalMobile: {
        status: "not-present-not-faked",
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
    authority,
    boundaries: {
      formalProductPointer: "v263",
      priorV594IdentityReused: false,
      priorV594HumanDecisionInherited: false,
      priorV594HumanDecisionReceiptSha256: null,
      scientificPayloadMutationAllowed: false,
      productionPromotionAllowed: false,
      timelikeKerr: {
        referenceCandidateOnly: true,
        admissionSha256: timelike.admissionSha256,
        admissionReceiptSha256: timelike.receiptSha256,
        formalEvidence: false,
        promotion: "none",
        defaultKernel: "legacy-eih-1pn",
      },
    },
    synthetic: true,
    ...overrides,
  });
}

function fixtures(options = {}) {
  const candidateDocument = options.candidate ?? candidate();
  const lifecycle = sealV595FormalDocument({
    version: V595_LIFECYCLE_RECEIPT_VERSION,
    status: V595_LIFECYCLE_SYNTHETIC_RECEIPT_STATUS,
    candidate: fullIdentity,
    phaseCount: 9,
    sameRealm: true,
    observations: {
      oneCanvasMount: true,
      oneCanvasReplace: true,
      detach: true,
      clientRouteExit: "/downloads",
      observedKnownZeroAfterDetach: true,
      observedKnownZeroAfterExit: true,
      rendererInfoAfterContextLoss: "explicitly-unavailable-not-zero",
    },
    releaseContractVersion: V595_SCENE_EXIT_RELEASE_CONTRACT_VERSION,
    detachedAndExitedSnapshotCanonicalEqual: true,
    snapshotReuseWitness: true,
    authority,
    synthetic: true,
  });
  const soak = sealV595FormalDocument({
    version: V595_SOAK_RECEIPT_VERSION,
    status: V595_SOAK_SYNTHETIC_RECEIPT_STATUS,
    candidate: fullIdentity,
    shardCount: 4,
    cycleCount: 40,
    sampleCount: 161,
    aggregation: {
      allShardsComplete: true,
      unknownShardCount: 0,
      failedShardCount: 0,
    },
    heapQualification: {
      telemetry: "chromium-cdp-runtime-getHeapUsage",
      finalHeapWithinAllowance: true,
      tailOlsWithinLimit: true,
      sustainedGrowth: false,
      noSyntheticSubstitution: true,
    },
    sameRealm: true,
    finalClientRouteExit: "/downloads",
    releaseContractVersion: V595_SCENE_EXIT_RELEASE_CONTRACT_VERSION,
    rendererInfoAfterContextLoss: "explicitly-unavailable-not-zero",
    authority,
    synthetic: true,
  });
  const lite = sealV595FormalDocument({
    version: V595_LITE_RECEIPT_VERSION,
    status: V595_LITE_RECEIPT_STATUS,
    candidate: options.liteIdentity ?? liteIdentity,
    frameCount: 8,
    authority,
    synthetic: true,
  });
  const browserGate = makeBrowserGate(
    candidateDocument,
    lite.receiptSha256,
    options.browserGateOverrides,
  );
  const challenge = createV595HumanChallenge(browserGate, {
    candidateDocument,
    syntheticFixture: true,
  });
  const reviewedAt = "2026-08-28T01:00:00.000Z";
  const human = sealV595FormalDocument({
    version: V595_HUMAN_SIGNOFF_VERSION,
    status: V595_HUMAN_SIGNOFF_STATUS,
    candidate: fullIdentity,
    reviewer: "workspace-owner",
    reviewedAt,
    approved: true,
    signaturePassesApproved: 8,
    passes: Object.fromEntries(V595_HUMAN_REVIEW_PASSES.map((pass) => [pass, {
      humanVisualSignoff: "approved",
    }])),
    decisionProvenance: {
      createdBy: "workspace-owner",
      artifactOrigin: "independent-user-decision-input",
      agentGenerated: false,
      explicitConfirmation: "APPROVE v595 8/8",
    },
    decisionProvenanceMode: "independent-workspace-owner-input",
    decisionChallenge: challenge,
    decisionChallengeSha256: canonicalShaV595Formal(challenge),
    decisionSha256: "2".repeat(64),
    policy: {
      currentIdentityOnly: true,
      sameBuildBeforeAfter: true,
      noHistoricalScreenshotSubstitution: true,
      explicitDecisionArtifactRequired: true,
      priorV594DecisionRejected: true,
      priorV594HumanDecisionInherited: false,
      automaticHumanApproval: false,
      scientificPayloadWriteback: false,
      physicalMobileEvidenceFabricated: false,
    },
    authority,
    synthetic: true,
  });
  return { lifecycle, soak, lite, browserGate, human, candidate: candidateDocument };
}

test("v595 closure accepts a fully bound synthetic aggregate envelope", () => {
  const result = validateV595ClosureInputs({
    ...fixtures(),
    expectedFullIdentity: fullIdentity,
    expectedLiteIdentity: liteIdentity,
    syntheticFixture: true,
  });
  assert.equal(result.full.buildId, fullIdentity.buildId);
  assert.equal(result.lite.buildId, liteIdentity.buildId);
  assert.equal(V595_QUALIFICATION_STATUS, "qualified-additive-v595-stellar-relativity-candidate");
});

test("v595 closure rejects any inherited v594 human decision", () => {
  const base = fixtures();
  const changed = candidate({
    governance: {
      ...base.candidate.governance,
      priorV594HumanDecisionInherited: true,
    },
  });
  assert.throws(() => validateV595ClosureInputs({
    ...base,
    candidate: changed,
    expectedFullIdentity: fullIdentity,
    expectedLiteIdentity: liteIdentity,
    syntheticFixture: true,
  }), /prior-v594|governance/);
});

test("v595 closure rejects partial aggregate evidence before qualification", () => {
  assert.throws(() => validateV595ClosureInputs({
    lifecycle: {},
    soak: {},
    lite: {},
    browserGate: {},
    human: {},
    candidate: candidate(),
    expectedFullIdentity: fullIdentity,
    expectedLiteIdentity: liteIdentity,
    syntheticFixture: true,
  }), /seal|contract|shape/);
});

test("v595 closure rejects physical mobile fabrication", () => {
  const base = fixtures();
  const browserGate = reseal(base.browserGate, {
    supplemental: {
      ...base.browserGate.supplemental,
      physicalMobile: {
        status: "passed-real-mobile",
        evidence: { path: "tmp/fake-mobile.json", bytes: 1, sha256: "1".repeat(64) },
        formalEvidence: true,
        promotion: "formal",
      },
    },
  });
  assert.throws(() => validateV595ClosureInputs({
    ...base,
    browserGate,
    expectedFullIdentity: fullIdentity,
    expectedLiteIdentity: liteIdentity,
    syntheticFixture: true,
  }), /browser-gate-physical-mobile|physical-mobile-not-faked/);
});

test("v595 closure rejects incomplete 24x2 or six-family matrices", () => {
  for (const matrices of [
    { stellarScienceCinematic: { frameCount: 47 } },
    { productSceneFamilies: { familyCount: 5 } },
  ]) {
    const base = fixtures();
    const key = Object.keys(matrices)[0];
    const browserGate = reseal(base.browserGate, {
      matrices: {
        ...base.browserGate.matrices,
        [key]: { ...base.browserGate.matrices[key], ...matrices[key] },
      },
    });
    assert.throws(() => validateV595ClosureInputs({
      ...base,
      browserGate,
      expectedFullIdentity: fullIdentity,
      expectedLiteIdentity: liteIdentity,
      syntheticFixture: true,
    }), /browser-gate-stellar-matrix|browser-gate-scene-families|stellar-24x2|product-scene-family|browser-matrix/);
  }
});

test("v595 closure rejects lite/full build alias and unbound lite receipt", () => {
  const alias = { ...fullIdentity, deliveryTier: "vercel-lite" };
  const aliased = fixtures({ liteIdentity: alias });
  assert.throws(() => validateV595ClosureInputs({
    ...aliased,
    expectedFullIdentity: fullIdentity,
    expectedLiteIdentity: alias,
    syntheticFixture: true,
  }), /lite-build-alias/);

  const base = fixtures();
  const browserGate = reseal(base.browserGate, {
    matrices: {
      ...base.browserGate.matrices,
      lite: { ...base.browserGate.matrices.lite, receiptSha256: "9".repeat(64) },
    },
  });
  assert.throws(() => validateV595ClosureInputs({
    ...base,
    browserGate,
    expectedFullIdentity: fullIdentity,
    expectedLiteIdentity: liteIdentity,
    syntheticFixture: true,
  }), /lite-receipt-binding/);
});

test("v595 closure rejects timelike promotion or authority elevation", () => {
  const base = fixtures();
  const promoted = candidate({
    relativity: {
      ...base.candidate.relativity,
      timelikeKerr: {
        ...base.candidate.relativity.timelikeKerr,
        formalEvidence: true,
        promotion: "scientific",
      },
    },
  });
  assert.throws(() => validateV595ClosureInputs({
    ...base,
    candidate: promoted,
    expectedFullIdentity: fullIdentity,
    expectedLiteIdentity: liteIdentity,
    syntheticFixture: true,
  }), /timelike-reference-boundary/);

  const elevated = candidate({
    authority: { ...authority, gpuAuthorityGranted: true },
  });
  assert.throws(() => validateV595ClosureInputs({
    ...base,
    candidate: elevated,
    expectedFullIdentity: fullIdentity,
    expectedLiteIdentity: liteIdentity,
    syntheticFixture: true,
  }), /authority-elevation/);
});

for (const [label, mutation, expected] of [
  ["lifecycle", ({ lifecycle }) => ({ lifecycle: reseal(lifecycle, { phaseCount: 8 }) }), /lifecycle-gates/],
  ["soak", ({ soak }) => ({ soak: reseal(soak, { sampleCount: 0 }) }), /soak-gates/],
  ["lite", ({ lite }) => ({ lite: reseal(lite, { status: "not-passed" }) }), /lite-contract/],
]) {
  test(`v595 closure rejects independently invalid ${label} receipt`, () => {
    const base = fixtures();
    assert.throws(() => validateV595ClosureInputs({
      ...base,
      ...mutation(base),
      expectedFullIdentity: fullIdentity,
      expectedLiteIdentity: liteIdentity,
      syntheticFixture: true,
    }), expected);
  });
}

test("v595 raw evidence deletion and byte tampering fail closed", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "v595-raw-evidence-"));
  const path = "tmp/evidence/frame.png";
  const absolute = resolve(root, path);
  try {
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, "original", "utf8");
    const record = await fileReceiptV595Formal(root, path, "fixture");
    await writeFile(absolute, "tampered", "utf8");
    await assert.rejects(
      verifyV595RawEvidenceRecords(root, [record]),
      /file-drift/,
    );
    await unlink(absolute);
    await assert.rejects(
      verifyV595RawEvidenceRecords(root, [record]),
      /ENOENT|missing/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("v595 raw evidence rejects traversal and absolute records", async () => {
  const record = { path: "../outside.png", bytes: 1, sha256: "a".repeat(64) };
  await assert.rejects(
    verifyV595RawEvidenceRecords("E:/does-not-matter", [record]),
    /formal-file-record|formal-path|boundary/,
  );
  await assert.rejects(
    verifyV595RawEvidenceRecords("E:/does-not-matter", [{
      ...record,
      path: "E:/absolute.png",
    }]),
    /formal-file-record|formal-path|boundary/,
  );
});

test("v595 closure CLI accepts only explicit aggregate paths", () => {
  assert.deepEqual(parseV595ClosureArgs([
    "--lifecycle", "tmp/lifecycle.json",
    "--human", "tmp/human.json",
  ]), {
    lifecycle: "tmp/lifecycle.json",
    human: "tmp/human.json",
  });
  assert.throws(() => parseV595ClosureArgs(["--deploy-production"]), /argument/);
});

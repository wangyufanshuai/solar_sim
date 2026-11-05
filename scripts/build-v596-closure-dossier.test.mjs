import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";

import {
  expandV596RawEvidenceRecords,
  parseV596ClosureArgs,
  validateV596ClosureInputs,
  verifyV596RawEvidenceRecords,
  V596_QUALIFICATION_STATUS,
} from "./build-v596-closure-dossier.mjs";
import {
  createV596HumanChallenge,
  V596_EXACT_AB_LANES,
  V596_HUMAN_REVIEW_PASSES,
  V596_HUMAN_SIGNOFF_STATUS,
  V596_HUMAN_SIGNOFF_VERSION,
  V596_PRODUCT_SCENE_FAMILIES,
} from "./build-v596-human-visual-signoff.mjs";
import {
  V596_BROWSER_GATE_STATUS,
  V596_BROWSER_GATE_VERSION,
  V596_STELLAR_MODES,
  V596_STELLAR_TARGET_IDS,
} from "./build-v596-final-sealed-browser-gate.mjs";
import {
  V596_LITE_RECEIPT_STATUS,
  V596_LITE_RECEIPT_VERSION,
  V596_EXACT_PAIR_DEFINITIONS,
} from "./build-v596-current-lite-matrix.mjs";
import {
  V596_LIFECYCLE_SYNTHETIC_RECEIPT_STATUS,
  V596_LIFECYCLE_RECEIPT_VERSION,
  V596_SCENE_EXIT_RELEASE_CONTRACT_VERSION,
} from "./build-v596-current-source-lifecycle.mjs";
import {
  V596_SOAK_SYNTHETIC_RECEIPT_STATUS,
  V596_SOAK_RECEIPT_VERSION,
} from "./build-v596-current-source-soak.mjs";
import {
  canonicalShaV596Formal,
  fileReceiptV596Formal,
  sealV596FormalDocument,
  V596_PARENT_V595_IDENTITY,
} from "./v596-formal-contract.mjs";

const fullIdentity = Object.freeze({
  sourceManifestSha256: "a".repeat(64),
  candidateManifestSha256: "b".repeat(64),
  buildId: `v596b-${"c".repeat(64)}`,
  buildFingerprint: "c".repeat(64),
  deploymentId: `v596-${"a".repeat(12)}-${"b".repeat(12)}`,
  formalProductPointer: "v263",
  deliveryTier: "standalone-full",
});
const liteIdentity = Object.freeze({
  ...fullIdentity,
  buildId: `v596b-${"d".repeat(64)}`,
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
  resolvedSurfaceAuthorityGranted: false,
  observationTextureAuthorityGranted: false,
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
      parentV595Immutable: true,
      priorV595HumanDecisionInherited: false,
      parentSourceManifestSha256: V596_PARENT_V595_IDENTITY.sourceManifestSha256,
      parentCandidateManifestSha256: V596_PARENT_V595_IDENTITY.candidateManifestSha256,
      parentReleaseDossierSha256: V596_PARENT_V595_IDENTITY.releaseDossierSha256,
      parentResealReceiptSha256: V596_PARENT_V595_IDENTITY.resealReceiptSha256,
    },
    parentV595: { ...V596_PARENT_V595_IDENTITY },
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
      orderedFamilyIds: V596_PRODUCT_SCENE_FAMILIES,
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
  return sealV596FormalDocument(unsigned);
}

function makeBrowserGate(candidateDocument, liteReceiptSha256, overrides = {}) {
  const timelike = candidateDocument.relativity.timelikeKerr;
  return sealV596FormalDocument({
    version: V596_BROWSER_GATE_VERSION,
    status: V596_BROWSER_GATE_STATUS,
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
        passes: V596_HUMAN_REVIEW_PASSES,
        lanes: V596_EXACT_AB_LANES,
        stageReceiptSha256: "8".repeat(64),
        batchSha256: "9".repeat(64),
        pairs: V596_EXACT_PAIR_DEFINITIONS,
        visibleLeapBoundaryVerified: true,
        stage: { path: "tmp/exact-stage.json", bytes: 1, sha256: "a".repeat(64) },
        batch: { path: "tmp/exact-batch.json", bytes: 1, sha256: "b".repeat(64) },
      },
      stellarScienceCinematic: {
        candidate: fullIdentity,
        targetCount: 24,
        modeCount: 2,
        frameCount: 48,
        targetIds: V596_STELLAR_TARGET_IDS,
        modes: V596_STELLAR_MODES,
        receiptSha256: "b".repeat(64),
        formalEvidence: false,
        promotion: "none",
        receipt: { path: "tmp/stellar.json", bytes: 1, sha256: "c".repeat(64) },
      },
      productSceneFamilies: {
        candidate: fullIdentity,
        familyCount: 6,
        orderedFamilies: V596_PRODUCT_SCENE_FAMILIES,
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
    exactVisibleLeapBoundaryVerified: true,
    priorV595HumanDecisionInherited: false,
    humanDecision: "separate-pending-not-generated",
    authority,
    boundaries: {
      formalProductPointer: "v263",
      priorV595IdentityReused: false,
      priorV595HumanDecisionInherited: false,
      priorV595HumanDecisionReceiptSha256: null,
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
  const lifecycle = sealV596FormalDocument({
    version: V596_LIFECYCLE_RECEIPT_VERSION,
    status: V596_LIFECYCLE_SYNTHETIC_RECEIPT_STATUS,
    candidate: fullIdentity,
    // v596 lifecycle v2 is a same-page, 14-state stellar/exoplanet
    // traversal.  Keep the synthetic aggregate fixture isomorphic to the
    // receipt emitted by build-v596-current-source-lifecycle.mjs so the
    // closure tests exercise the current contract (the old v1 phase-count
    // fields intentionally disappeared from the formal receipt).
    sampleCount: 17,
    stellarStateCount: 14,
    exoplanetSystemId: "trappist-1",
    premeasurementWarmupCycleCount: 1,
    premeasurementStateSpaceWarmupCycleCount: 1,
    samePage: true,
    sameRealm: true,
    sameCanvas: true,
    singleCanvas: true,
    exactReturn: true,
    rawPrototypeCensusExactReturn: true,
    heapReturn: {
      allowanceBytes: 8 * 1024 * 1024,
      deltaBytes: 0,
      withinAllowance: true,
    },
    authority,
    synthetic: true,
  });
  const soak = sealV596FormalDocument({
    version: V596_SOAK_RECEIPT_VERSION,
    status: V596_SOAK_SYNTHETIC_RECEIPT_STATUS,
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
    releaseContractVersion: V596_SCENE_EXIT_RELEASE_CONTRACT_VERSION,
    rendererInfoAfterContextLoss: "explicitly-unavailable-not-zero",
    authority,
    synthetic: true,
  });
  const lite = sealV596FormalDocument({
    version: V596_LITE_RECEIPT_VERSION,
    status: V596_LITE_RECEIPT_STATUS,
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
  const challenge = createV596HumanChallenge(browserGate, {
    candidateDocument,
    syntheticFixture: true,
  });
  const reviewedAt = "2026-08-28T01:00:00.000Z";
  const human = sealV596FormalDocument({
    version: V596_HUMAN_SIGNOFF_VERSION,
    status: V596_HUMAN_SIGNOFF_STATUS,
    candidate: fullIdentity,
    reviewer: "workspace-owner",
    reviewedAt,
    approved: true,
    signaturePassesApproved: 8,
    passes: Object.fromEntries(V596_HUMAN_REVIEW_PASSES.map((pass) => [pass, {
      humanVisualSignoff: "approved",
    }])),
    decisionProvenance: {
      createdBy: "workspace-owner",
      artifactOrigin: "independent-user-decision-input",
      agentGenerated: false,
      explicitConfirmation: "APPROVE v596 8/8",
    },
    decisionProvenanceMode: "independent-workspace-owner-input",
    decisionChallenge: challenge,
    decisionChallengeSha256: canonicalShaV596Formal(challenge),
    decisionSha256: "2".repeat(64),
    policy: {
      currentIdentityOnly: true,
      sameBuildBeforeAfter: true,
      noHistoricalScreenshotSubstitution: true,
      explicitDecisionArtifactRequired: true,
      priorV595DecisionRejected: true,
      priorV595HumanDecisionInherited: false,
      automaticHumanApproval: false,
      scientificPayloadWriteback: false,
      physicalMobileEvidenceFabricated: false,
    },
    authority,
    synthetic: true,
  });
  return { lifecycle, soak, lite, browserGate, human, candidate: candidateDocument };
}

test("v596 closure accepts a fully bound synthetic aggregate envelope", () => {
  const result = validateV596ClosureInputs({
    ...fixtures(),
    expectedFullIdentity: fullIdentity,
    expectedLiteIdentity: liteIdentity,
    syntheticFixture: true,
  });
  assert.equal(result.full.buildId, fullIdentity.buildId);
  assert.equal(result.lite.buildId, liteIdentity.buildId);
  assert.equal(V596_QUALIFICATION_STATUS, "qualified-additive-v596-stellar-visible-leap-candidate");
});

test("v596 closure rejects any inherited v595 human decision", () => {
  const base = fixtures();
  const changed = candidate({
    governance: {
      ...base.candidate.governance,
      priorV595HumanDecisionInherited: true,
    },
  });
  assert.throws(() => validateV596ClosureInputs({
    ...base,
    candidate: changed,
    expectedFullIdentity: fullIdentity,
    expectedLiteIdentity: liteIdentity,
    syntheticFixture: true,
  }), /prior-v595|governance/);
});

test("v596 closure rejects partial aggregate evidence before qualification", () => {
  assert.throws(() => validateV596ClosureInputs({
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

test("v596 closure rejects physical mobile fabrication", () => {
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
  assert.throws(() => validateV596ClosureInputs({
    ...base,
    browserGate,
    expectedFullIdentity: fullIdentity,
    expectedLiteIdentity: liteIdentity,
    syntheticFixture: true,
  }), /browser-gate-physical-mobile|physical-mobile-not-faked/);
});

test("v596 closure rejects incomplete 24x2 or six-family matrices", () => {
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
    assert.throws(() => validateV596ClosureInputs({
      ...base,
      browserGate,
      expectedFullIdentity: fullIdentity,
      expectedLiteIdentity: liteIdentity,
      syntheticFixture: true,
    }), /browser-gate-stellar-matrix|browser-gate-scene-families|stellar-24x2|product-scene-family|browser-matrix/);
  }
});

test("v596 closure rejects lite/full build alias and unbound lite receipt", () => {
  const alias = { ...fullIdentity, deliveryTier: "vercel-lite" };
  const aliased = fixtures({ liteIdentity: alias });
  assert.throws(() => validateV596ClosureInputs({
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
  assert.throws(() => validateV596ClosureInputs({
    ...base,
    browserGate,
    expectedFullIdentity: fullIdentity,
    expectedLiteIdentity: liteIdentity,
    syntheticFixture: true,
  }), /lite-receipt-binding/);
});

test("v596 closure rejects timelike promotion or authority elevation", () => {
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
  assert.throws(() => validateV596ClosureInputs({
    ...base,
    candidate: promoted,
    expectedFullIdentity: fullIdentity,
    expectedLiteIdentity: liteIdentity,
    syntheticFixture: true,
  }), /timelike-reference-boundary/);

  const elevated = candidate({
    authority: { ...authority, gpuAuthorityGranted: true },
  });
  assert.throws(() => validateV596ClosureInputs({
    ...base,
    candidate: elevated,
    expectedFullIdentity: fullIdentity,
    expectedLiteIdentity: liteIdentity,
    syntheticFixture: true,
  }), /authority-elevation/);
});

for (const [label, mutation, expected] of [
  ["lifecycle", ({ lifecycle }) => ({ lifecycle: reseal(lifecycle, { sampleCount: 16 }) }), /lifecycle-gates/],
  ["soak", ({ soak }) => ({ soak: reseal(soak, { sampleCount: 0 }) }), /soak-gates/],
  ["lite", ({ lite }) => ({ lite: reseal(lite, { status: "not-passed" }) }), /lite-contract/],
]) {
  test(`v596 closure rejects independently invalid ${label} receipt`, () => {
    const base = fixtures();
    assert.throws(() => validateV596ClosureInputs({
      ...base,
      ...mutation(base),
      expectedFullIdentity: fullIdentity,
      expectedLiteIdentity: liteIdentity,
      syntheticFixture: true,
    }), expected);
  });
}

test("v596 raw evidence deletion and byte tampering fail closed", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "v596-raw-evidence-"));
  const path = "tmp/evidence/frame.png";
  const absolute = resolve(root, path);
  try {
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, "original", "utf8");
    const record = await fileReceiptV596Formal(root, path, "fixture");
    await writeFile(absolute, "tampered", "utf8");
    await assert.rejects(
      verifyV596RawEvidenceRecords(root, [record]),
      /file-drift/,
    );
    await unlink(absolute);
    await assert.rejects(
      verifyV596RawEvidenceRecords(root, [record]),
      /ENOENT|missing/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("v596 raw graph seals historical source snapshots without treating them as current files", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "v596-raw-history-"));
  const currentPath = "app/current-renderer.ts";
  const verificationPath = "tests/current-renderer.test.ts";
  try {
    await mkdir(dirname(resolve(root, currentPath)), { recursive: true });
    await mkdir(dirname(resolve(root, verificationPath)), { recursive: true });
    await writeFile(resolve(root, currentPath), "current-renderer\n", "utf8");
    await writeFile(resolve(root, verificationPath), "current-test\n", "utf8");
    const historicalRuntime = {
      path: currentPath,
      bytes: 3,
      sha256: "1".repeat(64),
    };
    const historicalVerification = {
      path: verificationPath,
      bytes: 4,
      sha256: "2".repeat(64),
    };
    const sourceSet = {
      version: "v596-staging-visual-checkpoint-source-set-v1",
      pathPolicy: "explicit-main-route-renderer-checkpoint-and-verification-sources",
      runtimeFiles: [historicalRuntime],
      verificationFiles: [historicalVerification],
      parentV595: {
        sourceManifestSha256: V596_PARENT_V595_IDENTITY.sourceManifestSha256,
        candidateManifestSha256: V596_PARENT_V595_IDENTITY.candidateManifestSha256,
        buildId: `v595b-${"3".repeat(64)}`,
        deploymentId: V596_PARENT_V595_IDENTITY.deploymentId,
        finalStatus: "passed-readonly-qualified-additive-v595-stellar-relativity-candidate",
        relationship: "immutable-visual-baseline",
      },
    };
    const sourceSetSha256 = canonicalShaV596Formal(sourceSet);
    const buildFingerprint = "4".repeat(64);
    const checkpointId =
      `v596-checkpoint-${sourceSetSha256.slice(0, 12)}-${buildFingerprint.slice(0, 12)}`;
    const unsigned = {
      version: "v596-staging-visual-checkpoint-source-set-receipt-v1",
      status: "passed-staging-only-bound-to-immutable-v595",
      identityStage: "pre-formal-human-visual-checkpoint",
      timestampPolicy: "none-deterministic-staging-receipt",
      sealAlgorithm: "sha256-canonical-json-object-keys-v1",
      formalProductPointer: "v263",
      parentV595: sourceSet.parentV595,
      sourceSet,
      sourceSetSha256,
      buildFingerprint,
      checkpointId,
      runtimeTier: "staging-standalone",
      environment: {
        NEXT_PUBLIC_ATLAS_V596_CHECKPOINT_SOURCE_SET_SHA256: sourceSetSha256,
        NEXT_PUBLIC_ATLAS_V596_CHECKPOINT_BUILD_FINGERPRINT: buildFingerprint,
        NEXT_PUBLIC_ATLAS_V596_CHECKPOINT_ID: checkpointId,
        NEXT_PUBLIC_ATLAS_V596_CHECKPOINT_RUNTIME_TIER: "staging-standalone",
      },
      boundaries: {
        formalEvidence: false,
        promotion: "none",
        supplementalOnly: true,
        productionDeployment: false,
        scientificAuthority: false,
        measuredAuthority: false,
        gpuAuthority: false,
        resolvedSurfaceAuthority: false,
        observationTextureAuthority: false,
        radiativeTransferAuthority: false,
        grmhdAuthority: false,
        scientificPayloadWriteback: false,
        defaultKernel: "legacy-eih-1pn",
        singleCanvasPolicy: "shared-main-canvas",
      },
    };
    const receiptPath = "tmp/checkpoint-source-set.json";
    await mkdir(dirname(resolve(root, receiptPath)), { recursive: true });
    await writeFile(
      resolve(root, receiptPath),
      `${JSON.stringify(sealV596FormalDocument(unsigned), null, 2)}\n`,
      "utf8",
    );
    const receiptRecord = await fileReceiptV596Formal(root, receiptPath, "history");
    const expanded = await expandV596RawEvidenceRecords(root, [receiptRecord]);
    assert.deepEqual(expanded.evidenceTracked, [receiptRecord]);
    assert.equal(expanded.historicalSnapshotReceipts.length, 1);
    assert.equal(expanded.historicalSnapshotReceipts[0].snapshotRecordCount, 2);
    assert.equal(
      expanded.historicalSnapshotReceipts[0].semantics,
      "sealed-historical-snapshot-not-current-workspace-receipts",
    );

    const genericPath = "tmp/generic-current-receipt.json";
    await writeFile(
      resolve(root, genericPath),
      `${JSON.stringify({ evidence: historicalRuntime }, null, 2)}\n`,
      "utf8",
    );
    const genericRecord = await fileReceiptV596Formal(root, genericPath, "generic");
    await assert.rejects(
      expandV596RawEvidenceRecords(root, [genericRecord]),
      /file-drift/,
    );

    const invalidPath = "tmp/invalid-source-set.json";
    await writeFile(
      resolve(root, invalidPath),
      `${JSON.stringify(sealV596FormalDocument({
        ...unsigned,
        sourceSetSha256: "f".repeat(64),
      }), null, 2)}\n`,
      "utf8",
    );
    const invalidRecord = await fileReceiptV596Formal(root, invalidPath, "invalid-history");
    await assert.rejects(
      expandV596RawEvidenceRecords(root, [invalidRecord]),
      /historical-source-set-seal/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("v596 raw evidence rejects traversal and absolute records", async () => {
  const record = { path: "../outside.png", bytes: 1, sha256: "a".repeat(64) };
  await assert.rejects(
    verifyV596RawEvidenceRecords("E:/does-not-matter", [record]),
    /formal-file-record|formal-path|boundary/,
  );
  await assert.rejects(
    verifyV596RawEvidenceRecords("E:/does-not-matter", [{
      ...record,
      path: "E:/absolute.png",
    }]),
    /formal-file-record|formal-path|boundary/,
  );
});

test("v596 closure CLI accepts only explicit aggregate paths", () => {
  assert.deepEqual(parseV596ClosureArgs([
    "--lifecycle", "tmp/lifecycle.json",
    "--human", "tmp/human.json",
  ]), {
    lifecycle: "tmp/lifecycle.json",
    human: "tmp/human.json",
  });
  assert.throws(() => parseV596ClosureArgs(["--deploy-production"]), /argument/);
});

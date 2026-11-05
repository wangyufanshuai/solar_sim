import test from "node:test";
import assert from "node:assert/strict";

import {
  createV595HumanChallenge,
  createV595HumanReviewStage,
  parseV595HumanArgs,
  validateV595HumanDecision,
  validateV595HumanDecisionRawBinding,
  validateV595HumanSignoff,
  V595_EXACT_AB_LANES,
  V595_HUMAN_DECISION_VALUE,
  V595_HUMAN_DECISION_VERSION,
  V595_HUMAN_DELEGATED_SCOPE,
  V595_HUMAN_DELEGATED_STATEMENT,
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
  canonicalShaV595Formal,
  sealV595FormalDocument,
  V595_PARENT_V594_IDENTITY,
} from "./v595-formal-contract.mjs";

const identity = Object.freeze({
  sourceManifestSha256: "a".repeat(64),
  candidateManifestSha256: "b".repeat(64),
  buildId: `v595b-${"c".repeat(64)}`,
  buildFingerprint: "c".repeat(64),
  deploymentId: `v595-${"a".repeat(12)}-${"b".repeat(12)}`,
  formalProductPointer: "v263",
  deliveryTier: "standalone-full",
});
const liteIdentity = Object.freeze({
  ...identity,
  buildId: `v595b-${"e".repeat(64)}`,
  buildFingerprint: "e".repeat(64),
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

function candidateDocument() {
  return {
    generatedAt: "2026-08-28T00:00:00.000Z",
    governance: { priorV594HumanDecisionInherited: false },
    parentV594: { ...V595_PARENT_V594_IDENTITY },
    relativity: {
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
  };
}

function browserGate(overrides = {}) {
  const document = candidateDocument();
  return sealV595FormalDocument({
    version: V595_BROWSER_GATE_VERSION,
    status: V595_BROWSER_GATE_STATUS,
    candidate: identity,
    matrices: {
      full: {
        candidate: identity,
        frameCount: 13,
        stageReceiptSha256: "a".repeat(64),
        batchSha256: "b".repeat(64),
        stage: { path: "tmp/v595/full-stage.json", bytes: 1, sha256: "a".repeat(64) },
        batch: { path: "tmp/v595/full-batch.json", bytes: 1, sha256: "b".repeat(64) },
      },
      lite: {
        candidate: liteIdentity,
        frameCount: 8,
        receiptSha256: "c".repeat(64),
        receipt: { path: "tmp/v595/lite-receipt.json", bytes: 1, sha256: "c".repeat(64) },
      },
      exactAb: {
        candidate: identity,
        pairCount: 8,
        frameCount: 16,
        passes: V595_HUMAN_REVIEW_PASSES,
        lanes: V595_EXACT_AB_LANES,
        relativityObservationMarkerVerified: true,
        stageReceiptSha256: "6".repeat(64),
        batchSha256: "7".repeat(64),
        stage: { path: "tmp/v595/exact-stage.json", bytes: 1, sha256: "6".repeat(64) },
        batch: { path: "tmp/v595/exact-batch.json", bytes: 1, sha256: "7".repeat(64) },
      },
      stellarScienceCinematic: {
        candidate: identity,
        targetCount: 24,
        modeCount: 2,
        frameCount: 48,
        targetIds: V595_STELLAR_TARGET_IDS,
        modes: V595_STELLAR_MODES,
        receiptSha256: "8".repeat(64),
        formalEvidence: false,
        promotion: "none",
        receipt: { path: "tmp/v595/stellar-receipt.json", bytes: 1, sha256: "8".repeat(64) },
      },
      productSceneFamilies: {
        candidate: identity,
        familyCount: 6,
        orderedFamilies: V595_PRODUCT_SCENE_FAMILIES,
        singleCanvasPolicy: "one-shared-main-canvas",
        supplementalOnly: true,
        formalEvidence: false,
        promotion: "none",
        receiptSha256: "9".repeat(64),
        receipt: { path: "tmp/v595/family-receipt.json", bytes: 1, sha256: "9".repeat(64) },
      },
    },
    supplemental: {
      realDesktopChrome: {
        candidate: identity,
        status: "passed-supplemental-real-desktop-eligible",
        supplementalOnly: true,
        formalEvidence: false,
        promotion: "none",
        realDesktopEligible: true,
        realMobileEligible: false,
        receiptSha256: "d".repeat(64),
        receipt: { path: "tmp/v595/desktop-receipt.json", bytes: 1, sha256: "d".repeat(64) },
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
    boundaries: {
      formalProductPointer: "v263",
      priorV594IdentityReused: false,
      priorV594HumanDecisionInherited: false,
      priorV594HumanDecisionReceiptSha256: null,
      scientificPayloadMutationAllowed: false,
      productionPromotionAllowed: false,
      timelikeKerr: {
        referenceCandidateOnly: true,
        formalEvidence: false,
        promotion: "none",
        admissionSha256: document.relativity.timelikeKerr.admissionSha256,
        admissionReceiptSha256: document.relativity.timelikeKerr.receiptSha256,
        defaultKernel: "legacy-eih-1pn",
      },
    },
    authority,
    synthetic: true,
    ...overrides,
  });
}

function decision(challenge, overrides = {}) {
  const reviewedAt = "2026-08-28T01:00:00.000Z";
  return sealV595FormalDocument({
    version: V595_HUMAN_DECISION_VERSION,
    decision: V595_HUMAN_DECISION_VALUE,
    approved: true,
    reviewer: "workspace-owner",
    provenance: {
      createdBy: "workspace-owner",
      artifactOrigin: "independent-user-decision-input",
      agentGenerated: false,
      explicitConfirmation: "APPROVE v595 8/8",
    },
    reviewedAt,
    challengeSha256: canonicalShaV595Formal(challenge),
    passes: Object.fromEntries(V595_HUMAN_REVIEW_PASSES.map((pass) => [pass, {
      decision: "approved",
      reviewedAt,
    }])),
    priorV594HumanDecisionInherited: false,
    fixture: { synthetic: true },
    ...overrides,
  }, "decisionSha256");
}

function challenge() {
  return createV595HumanChallenge(browserGate(), {
    candidateDocument: candidateDocument(),
    syntheticFixture: true,
  });
}

test("v595 challenge binds all current evidence envelopes and no prior human decision", () => {
  const value = challenge();
  assert.equal(value.exactAb.pairCount, 8);
  assert.equal(value.stellarScienceCinematic.frameCount, 48);
  assert.equal(value.productSceneFamilies.familyCount, 6);
  assert.equal(value.timelikeKerr.fixtureCount, 4);
  assert.equal(value.supplemental.realMobileEligible, false);
  assert.equal(value.priorV594HumanDecisionInherited, false);
});

test("v595 review stage is generated without generating or inferring a decision", () => {
  const stage = createV595HumanReviewStage(browserGate(), {
    candidateDocument: candidateDocument(),
    authority,
    syntheticFixture: true,
  });
  assert.equal(stage.decisionRequired, true);
  assert.equal(stage.decisionGenerated, false);
  assert.equal(stage.challengeSha256, canonicalShaV595Formal(stage.challenge));
});

test("v595 challenge rejects a coherently resealed non-current build identity", () => {
  const different = {
    ...identity,
    buildId: `v595b-${"f".repeat(64)}`,
    buildFingerprint: "f".repeat(64),
  };
  assert.throws(() => createV595HumanChallenge(browserGate(), {
    candidateDocument: candidateDocument(),
    expectedFullIdentity: different,
    expectedLiteIdentity: liteIdentity,
    syntheticFixture: true,
  }), /identity-drift/);
});

test("v595 accepts a fresh sealed workspace-owner eight-of-eight decision", () => {
  const currentChallenge = challenge();
  const result = validateV595HumanDecision(
    decision(currentChallenge),
    currentChallenge,
    { syntheticFixture: true },
  );
  assert.equal(result.reviewer, "workspace-owner");
  assert.equal(result.challengeSha256, canonicalShaV595Formal(currentChallenge));
});

test("v595 rejects v594 decisions and challenge replay", () => {
  const currentChallenge = challenge();
  assert.throws(
    () => validateV595HumanDecision(
      decision(currentChallenge, { version: "v594-human-user-decision-v1" }),
      currentChallenge,
      { syntheticFixture: true },
    ),
    /decision-version|prior-decision/,
  );
  const replay = decision({ ...currentChallenge, browserGateReceiptSha256: "e".repeat(64) });
  assert.throws(
    () => validateV595HumanDecision(replay, currentChallenge, { syntheticFixture: true }),
    /challenge-replay-or-drift/,
  );
});

test("v595 rejects reordered or incomplete passes and non-owner review", () => {
  const currentChallenge = challenge();
  const reversed = [...V595_HUMAN_REVIEW_PASSES].reverse();
  assert.throws(
    () => validateV595HumanDecision(decision(currentChallenge, {
      reviewer: "automation",
      passes: Object.fromEntries(reversed.map((pass) => [pass, {
        decision: "approved",
        reviewedAt: "2026-08-28T01:00:00.000Z",
      }])),
    }), currentChallenge, { syntheticFixture: true }),
    /reviewer|pass-order/,
  );
});

test("v595 rejects an agent-generated decision relabeled as workspace-owner", () => {
  const currentChallenge = challenge();
  assert.throws(
    () => validateV595HumanDecision(decision(currentChallenge, {
      provenance: {
        createdBy: "workspace-owner",
        artifactOrigin: "independent-user-decision-input",
        agentGenerated: true,
        explicitConfirmation: "APPROVE v595 8/8",
      },
    }), currentChallenge, { syntheticFixture: true }),
    /workspace-owner-provenance/,
  );
});

test("v595 accepts only an explicitly authorized current-v595 delegated decision", () => {
  const currentChallenge = challenge();
  const provenance = {
    createdBy: "codex-agent",
    artifactOrigin: "delegated-user-authorized-decision-input",
    agentGenerated: true,
    authorization: {
      principal: "workspace-owner",
      grant: "explicit-conversation-authorization",
      scope: V595_HUMAN_DELEGATED_SCOPE,
      statement: V595_HUMAN_DELEGATED_STATEMENT,
    },
  };
  const result = validateV595HumanDecision(
    decision(currentChallenge, { provenance }),
    currentChallenge,
    { syntheticFixture: true },
  );
  assert.equal(result.provenanceMode, "delegated-codex-generation");
  assert.throws(() => validateV595HumanDecision(
    decision(currentChallenge, {
      provenance: {
        ...provenance,
        authorization: {
          ...provenance.authorization,
          scope: "v594-current-identity-human-decision-and-reseal-verifier",
        },
      },
    }),
    currentChallenge,
    { syntheticFixture: true },
  ), /workspace-owner-provenance/);
});

test("v595 challenge fails closed on 47 stellar frames or faked physical mobile", () => {
  const gate = browserGate();
  const unsigned = {
    ...gate,
    matrices: {
      ...gate.matrices,
      stellarScienceCinematic: {
        ...gate.matrices.stellarScienceCinematic,
        frameCount: 47,
      },
    },
  };
  delete unsigned.receiptSha256;
  assert.throws(
    () => createV595HumanChallenge(sealV595FormalDocument(unsigned), {
      candidateDocument: candidateDocument(),
      syntheticFixture: true,
    }),
    /browser-gate-stellar-matrix|stellar-24x2-envelope/,
  );

  const mobileUnsigned = {
    ...gate,
    supplemental: {
      ...gate.supplemental,
      physicalMobile: {
        ...gate.supplemental.physicalMobile,
        status: "passed-physical-mobile",
        evidence: { path: "fake.json" },
      },
    },
  };
  delete mobileUnsigned.receiptSha256;
  assert.throws(
    () => createV595HumanChallenge(sealV595FormalDocument(mobileUnsigned), {
      candidateDocument: candidateDocument(),
      syntheticFixture: true,
    }),
    /browser-gate-physical-mobile|physical-mobile-not-faked/,
  );
});

test("v595 raw decision binding detects provenance drift", () => {
  const currentChallenge = challenge();
  const raw = decision(currentChallenge);
  assert.throws(() => validateV595HumanDecisionRawBinding({
    human: {
      decisionProvenance: { ...raw.provenance, agentGenerated: true },
      decisionSha256: raw.decisionSha256,
      decisionChallengeSha256: raw.challengeSha256,
    },
    decision: raw,
    challenge: currentChallenge,
    syntheticFixture: true,
  }), /raw-provenance-drift/);
});

test("v595 signoff validator preserves all authority and mobile boundaries", () => {
  const currentChallenge = challenge();
  const raw = decision(currentChallenge);
  const receipt = sealV595FormalDocument({
    version: V595_HUMAN_SIGNOFF_VERSION,
    status: V595_HUMAN_SIGNOFF_STATUS,
    candidate: identity,
    reviewer: "workspace-owner",
    reviewedAt: raw.reviewedAt,
    approved: true,
    signaturePassesApproved: 8,
    passes: Object.fromEntries(V595_HUMAN_REVIEW_PASSES.map((pass) => [pass, {
      humanVisualSignoff: "approved",
    }])),
    decisionProvenance: raw.provenance,
    decisionProvenanceMode: "independent-workspace-owner-input",
    decisionChallengeSha256: raw.challengeSha256,
    decisionSha256: raw.decisionSha256,
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
  assert.equal(
    validateV595HumanSignoff(receipt, identity, { syntheticFixture: true }).decisionSha256,
    raw.decisionSha256,
  );
});

test("v595 CLI supports challenge-only and lets the builder stage before missing-decision failure", () => {
  const args = parseV595HumanArgs([
    "--challenge-only",
    "--browser-gate", "tmp/gate.json",
    "--stage-output", "tmp/stage.json",
    "--challenge-output", "tmp/challenge.json",
  ]);
  assert.equal(args.challengeOnly, true);
  assert.equal(args["decision-file"], undefined);
  const stagedFailure = parseV595HumanArgs([
    "--browser-gate", "tmp/gate.json",
  ]);
  assert.equal(stagedFailure["decision-file"], undefined);
  assert.throws(() => parseV595HumanArgs([
    "--challenge-output", "tmp/challenge.json",
    "--decision-file", "tmp/decision.json",
  ]), /challenge-output-mode/);
});

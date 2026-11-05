import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";

import {
  validateV594ClosureInputs,
  verifyV594RawEvidenceRecords,
} from "./build-v594-closure-dossier.mjs";
import {
  assertKnownFiniteZeroV594,
  assertV594Authority,
  canonicalShaV594Closure,
  fileReceiptV594,
  sealV594Document,
  validateV594Identity,
} from "./build-v594-current-source-lifecycle.mjs";
import {
  validateV594HumanDecisionRawBinding,
  V594_HUMAN_SIGNOFF_VERSION,
} from "./build-v594-human-visual-signoff.mjs";
import {
  V594_BROWSER_GATE_STATUS,
  V594_BROWSER_GATE_VERSION,
} from "./build-v594-final-sealed-browser-gate.mjs";
import { V594_EXACT_PASSES } from "./build-v594-current-lite-matrix.mjs";
import {
  validateV594SoakSemanticClosureContract,
  V594_SOAK_RECEIPT_STATUS,
  V594_SOAK_RECEIPT_VERSION,
} from "./build-v594-current-source-soak.mjs";

const identity = {
  sourceManifestSha256: "a".repeat(64),
  candidateManifestSha256: "b".repeat(64),
  buildId: `v594b-${"c".repeat(64)}`,
  buildFingerprint: "c".repeat(64),
  deploymentId: `v594-${"a".repeat(12)}-${"b".repeat(12)}`,
  formalProductPointer: "v263",
  deliveryTier: "standalone-full",
};
const liteIdentity = { ...identity, buildId: `v594b-${"d".repeat(64)}`, deliveryTier: "vercel-lite" };
const authority = {
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
};

function fixtures(overrides = {}) {
  const lifecycle = sealV594Document({
    version: "v594-resource-lifecycle-v4",
    status: "passed-current-v594-same-realm-mount-replace-detach-and-client-route-exit",
    candidate: identity,
    phaseCount: 9,
    sameRealm: true,
    releaseContractVersion: "v594-observed-scene-exit-release-contract-v4",
    detachedObservedReleaseContract: true,
    exitedObservedReleaseContract: true,
    detachedRendererInfoCountsUnavailableAfterContextLoss: true,
    exitedRendererInfoCountsUnavailableAfterContextLoss: true,
    snapshotReuseWitness: true,
    detachedAndExitedSnapshotCanonicalEqual: true,
    authority,
    synthetic: true,
  });
  const soak = sealV594Document({
    version: V594_SOAK_RECEIPT_VERSION,
    status: V594_SOAK_RECEIPT_STATUS,
    candidate: identity,
    cycleCount: 40,
    sampleCount: 161,
    sameRealm: true,
    releaseContractVersion: "v594-observed-scene-exit-release-contract-v4",
    detachedAndExitedObservedReleaseContract: true,
    detachedAndExitedRendererInfoCountsUnavailableAfterContextLoss: true,
    snapshotReuseWitness: true,
    detachedAndExitedSnapshotCanonicalEqual: true,
    releaseCompletionObserved: true,
    releaseCompletionTransition: "next-link-route-exit",
    releaseCompletionObservedAfterPhase: "exited",
    releaseCompletionTeardownCanonicalEqualsExit: true,
    detachedPreReleaseObserverReleased: null,
    rawMetricsSha256: "1".repeat(64),
    warnings: [],
    heapQualification: {
      rawHardGatesPassed: true,
      rawMonotonicWarning: false,
      semanticProofRequired: false,
      semanticProofProvided: false,
      semanticFallbackApplied: false,
      semanticReceiptSha256: null,
      status: "passed-raw-heap-no-monotonic-warning",
    },
    semanticEvidence: null,
    semanticStageReceiptSha256: null,
    semanticVerification: null,
    authority,
    synthetic: true,
  });
  const lite = sealV594Document({
    version: "v594-lite-browser-matrix-v1",
    status: "passed-current-v594-independent-8-frame-lite-automatic-gates",
    candidate: overrides.liteIdentity ?? liteIdentity,
    frameCount: 8,
    authority,
    synthetic: true,
  });
  const browserGate = sealV594Document({
    version: V594_BROWSER_GATE_VERSION,
    status: V594_BROWSER_GATE_STATUS,
    candidate: identity,
    matrices: {
      full: { frameCount: 13 },
      lite: {
        frameCount: 8,
        receiptSha256: lite.receiptSha256,
        candidate: overrides.liteIdentity ?? liteIdentity,
      },
      exactAb: { pairCount: 8, frameCount: 16,
        passes: V594_EXACT_PASSES, batchSha256: "e".repeat(64),
        relativityObservationMarkerVerified: true },
    },
    fullLiteIndependentBuilds: true,
    exactAbSameStandaloneBuild: true,
    exactRelativityObservationMarkerVerified: true,
    authority,
    synthetic: true,
  });
  const human = sealV594Document({
    version: V594_HUMAN_SIGNOFF_VERSION,
    status: "approved-v594-eight-pair-human-visual-signoff",
    candidate: identity,
    reviewer: "workspace-owner",
    reviewedAt: "2026-08-25T00:00:00.000Z",
    approved: true,
    signaturePassesApproved: 8,
    passes: Object.fromEntries(V594_EXACT_PASSES.map((pass) => [pass, {
      humanVisualSignoff: "approved",
    }])),
    policy: {
      currentIdentityOnly: true,
      sameBuildBeforeAfter: true,
      noHistoricalScreenshotSubstitution: true,
      explicitDecisionArtifactRequired: true,
      oldV593DecisionRejected: true,
      automaticHumanApproval: false,
      scientificPayloadWriteback: false,
      delegatedGenerationAuthorized: false,
    },
    decisionProvenance: {
      createdBy: "workspace-owner",
      artifactOrigin: "independent-user-decision-input",
      agentGenerated: false,
      explicitConfirmation: "APPROVE v594 8/8",
    },
    decisionProvenanceMode: "independent-workspace-owner-input",
    decisionChallenge: {
      browserGateReceiptSha256: browserGate.receiptSha256,
      exactBatchSha256: browserGate.matrices.exactAb.batchSha256,
    },
    decisionChallengeSha256: "f".repeat(64),
    decisionSha256: "1".repeat(64),
    authority,
    synthetic: true,
  });
  return { lifecycle, soak, lite, browserGate, human };
}

function reseal(document, overrides) {
  const unsigned = { ...document, ...overrides };
  delete unsigned.receiptSha256;
  return sealV594Document(unsigned);
}

test("v594 soak semantic closure contract accepts raw-only qualification", () => {
  const { soak } = fixtures();
  const result = validateV594SoakSemanticClosureContract(soak);
  assert.deepEqual(result, {
    semanticProofRequired: false,
    semanticProofPresent: false,
    semanticProofSatisfied: null,
    rawHeapQualificationSatisfied: true,
    mode: "raw-only",
  });
});

test("v594 soak semantic closure contract accepts required verified fallback", () => {
  const semanticReceiptSha256 = "2".repeat(64);
  const { soak } = fixtures();
  const qualified = reseal(soak, {
    warnings: ["heap:monotonic-growth"],
    heapQualification: {
      rawHardGatesPassed: true,
      rawMonotonicWarning: true,
      semanticProofRequired: true,
      semanticProofProvided: true,
      semanticFallbackApplied: true,
      semanticReceiptSha256,
      status: "passed-released-baseline-semantic-fallback-with-raw-monotonic-warning",
    },
    semanticEvidence: {
      path: "tmp/v594-staging/released-heap-semantic/stage.json",
      bytes: 1,
      sha256: "3".repeat(64),
    },
    semanticStageReceiptSha256: semanticReceiptSha256,
    semanticVerification: {
      passed: true,
      receiptSha256: semanticReceiptSha256,
      warnings: [],
      rebuiltCheckpoints: [],
    },
  });
  const result = validateV594SoakSemanticClosureContract(qualified);
  assert.deepEqual(result, {
    semanticProofRequired: true,
    semanticProofPresent: true,
    semanticProofSatisfied: true,
    rawHeapQualificationSatisfied: true,
    mode: "semantic-fallback",
  });
});

test("v594 closure accepts a fully bound synthetic envelope", async () => {
  const result = await validateV594ClosureInputs({
    ...fixtures(),
    expectedFullIdentity: identity,
    expectedLiteIdentity: liteIdentity,
    syntheticFixture: true,
  });
  assert.equal(result.full.buildId, identity.buildId);
  assert.equal(result.lite.buildId, liteIdentity.buildId);
});

test("v594 closure rejects a resealed browser gate without the relativity marker gate", async () => {
  const base = fixtures();
  const browserGate = reseal(base.browserGate, {
    exactRelativityObservationMarkerVerified: false,
  });
  await assert.rejects(
    validateV594ClosureInputs({
      ...base,
      browserGate,
      expectedFullIdentity: identity,
      expectedLiteIdentity: liteIdentity,
      syntheticFixture: true,
    }),
    /browser-separation/,
  );
});

test("v594 closure rejects partial evidence before any aggregation", async () => {
  await assert.rejects(
    validateV594ClosureInputs({
      lifecycle: {}, soak: {}, lite: {}, browserGate: {}, human: {},
      expectedFullIdentity: identity,
      expectedLiteIdentity: liteIdentity,
      syntheticFixture: true,
    }),
    /seal|identity|shape/,
  );
});

test("v594 closure rejects legacy finite-zero receipt fields without the v2 release contract", async () => {
  const base = fixtures();
  const legacy = { ...base.lifecycle };
  delete legacy.receiptSha256;
  delete legacy.releaseContractVersion;
  delete legacy.detachedObservedReleaseContract;
  delete legacy.exitedObservedReleaseContract;
  legacy.detachedObservableFiniteZero = true;
  legacy.exitedObservableFiniteZero = true;
  const lifecycle = sealV594Document(legacy);
  await assert.rejects(validateV594ClosureInputs({
    ...base,
    lifecycle,
    expectedFullIdentity: identity,
    expectedLiteIdentity: liteIdentity,
    syntheticFixture: true,
  }), /lifecycle-gates/);
});

test("v594 closure rejects full/lite identity alias and unknown zero", () => {
  assert.throws(() => validateV594Identity({ ...liteIdentity, buildId: identity.buildId }, liteIdentity, { deliveryTier: "vercel-lite" }), /drift|alias/);
  assert.throws(() => assertKnownFiniteZeroV594(null, "detached.renderer"), /unknown-zero/);
  assert.throws(() => assertKnownFiniteZeroV594(undefined, "detached.registry"), /unknown-zero/);
});

test("v594 closure rejects an otherwise sealed aliased lite build", async () => {
  const alias = { ...identity, deliveryTier: "vercel-lite" };
  await assert.rejects(validateV594ClosureInputs({
    ...fixtures({ liteIdentity: alias }),
    expectedFullIdentity: identity,
    expectedLiteIdentity: alias,
    syntheticFixture: true,
  }), /lite-build-alias/);
});

test("v594 closure rejects authority elevation", () => {
  const elevated = {
    defaultKernel: "legacy-eih-1pn",
    v2Mode: "shadow-only",
    scientificAuthorityGranted: false,
    scientificPayloadMutationAllowed: true,
    measuredAuthorityGranted: false,
    gpuAuthorityGranted: false,
    radiativeTransferGranted: false,
    grmhdGranted: false,
    geometryReferenceGranted: false,
    polarizationTransportReferenceGranted: false,
    productionReleaseAuthorized: false,
    productionPromotionAllowed: false,
  };
  assert.throws(() => assertV594Authority(elevated, "fixture"), /elevation/);
});

for (const [label, mutation, expected] of [
  ["lifecycle", ({ lifecycle }) => ({ lifecycle: reseal(lifecycle, { phaseCount: 8 }) }), /lifecycle-gates/],
  ["soak", ({ soak }) => ({ soak: reseal(soak, { sampleCount: 160 }) }), /soak-gates/],
  ["lite", ({ lite }) => ({ lite: reseal(lite, { status: "not-passed" }) }), /lite-contract/],
]) {
  test(`v594 closure rejects independently invalid ${label} receipt`, async () => {
    const base = fixtures();
    await assert.rejects(validateV594ClosureInputs({
      ...base,
      ...mutation(base),
      expectedFullIdentity: identity,
      expectedLiteIdentity: liteIdentity,
      syntheticFixture: true,
    }), expected);
  });
}

test("v594 closure rejects lite receipt not bound by browser gate", async () => {
  const base = fixtures();
  const browserGate = reseal(base.browserGate, {
    matrices: {
      ...base.browserGate.matrices,
      lite: { ...base.browserGate.matrices.lite, receiptSha256: "9".repeat(64) },
    },
  });
  await assert.rejects(validateV594ClosureInputs({
    ...base,
    browserGate,
    expectedFullIdentity: identity,
    expectedLiteIdentity: liteIdentity,
    syntheticFixture: true,
}), /lite-receipt-binding/);
});

function rawDecision(challenge, provenance) {
  const reviewedAt = "2026-08-25T00:00:00.000Z";
  return sealV594Document({
    version: "v594-human-user-decision-v1",
    decision: "approve-v594-eight-of-eight",
    approved: true,
    reviewer: "workspace-owner",
    provenance,
    reviewedAt,
    challengeSha256: canonicalShaV594Closure(challenge),
    passes: Object.fromEntries(V594_EXACT_PASSES.map((pass) => [pass, {
      decision: "approved",
      reviewedAt,
    }])),
    fixture: { synthetic: true },
  }, "decisionSha256");
}

const rawBindingChallenge = {
  version: "v594-human-visual-signoff-decision-challenge-v1",
  candidate: identity,
  browserGateReceiptSha256: "d".repeat(64),
  exactStageReceiptSha256: "e".repeat(64),
  exactBatchSha256: "f".repeat(64),
  exactFrameCount: 16,
  requiredPasses: V594_EXACT_PASSES,
};
const independentProvenance = {
  createdBy: "workspace-owner",
  artifactOrigin: "independent-user-decision-input",
  agentGenerated: false,
  explicitConfirmation: "APPROVE v594 8/8",
};
const delegatedProvenance = {
  createdBy: "codex-agent",
  artifactOrigin: "delegated-user-authorized-decision-input",
  agentGenerated: true,
  authorization: {
    principal: "workspace-owner",
    grant: "explicit-conversation-authorization",
    scope: "v594-current-identity-human-decision-and-reseal-verifier",
    statement: "workspace-owner-explicitly-authorized-codex-to-generate-v594-human-decision-and-revise-reseal-verifier",
  },
};

test("v594 raw human binding rejects delegated dossier over independent raw decision", () => {
  const decision = rawDecision(rawBindingChallenge, independentProvenance);
  assert.throws(() => validateV594HumanDecisionRawBinding({
    human: {
      decisionProvenance: delegatedProvenance,
      decisionProvenanceMode: "delegated-codex-generation",
      decisionSha256: decision.decisionSha256,
      decisionChallengeSha256: decision.challengeSha256,
    },
    decision,
    challenge: rawBindingChallenge,
    syntheticFixture: true,
  }), /raw-provenance/);
});

test("v594 raw human binding rejects independent dossier over delegated raw decision", () => {
  const decision = rawDecision(rawBindingChallenge, delegatedProvenance);
  assert.throws(() => validateV594HumanDecisionRawBinding({
    human: {
      decisionProvenance: independentProvenance,
      decisionProvenanceMode: "independent-workspace-owner-input",
      decisionSha256: decision.decisionSha256,
      decisionChallengeSha256: decision.challengeSha256,
    },
    decision,
    challenge: rawBindingChallenge,
    syntheticFixture: true,
  }), /raw-provenance/);
});

test("v594 raw evidence deletion and byte tampering fail closed", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "v594-raw-evidence-"));
  const path = "tmp/evidence/frame.png";
  const absolute = resolve(root, path);
  try {
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, "original", "utf8");
    const record = await fileReceiptV594(root, path, "fixture");
    await writeFile(absolute, "tampered", "utf8");
    await assert.rejects(verifyV594RawEvidenceRecords(root, [record]), /file-drift/);
    await unlink(absolute);
    await assert.rejects(verifyV594RawEvidenceRecords(root, [record]), /ENOENT|missing/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("v594 raw evidence rejects absolute and traversal aliases", async () => {
  const record = { path: "../outside.png", bytes: 1, sha256: "a".repeat(64) };
  await assert.rejects(verifyV594RawEvidenceRecords("E:/does-not-matter", [record]),
    /noncanonical-path|boundary/);
  await assert.rejects(verifyV594RawEvidenceRecords("E:/does-not-matter", [{
    ...record,
    path: "E:/absolute.png",
  }]), /noncanonical-path|boundary/);
});

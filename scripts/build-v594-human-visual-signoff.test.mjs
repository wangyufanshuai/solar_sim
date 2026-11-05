import test from "node:test";
import assert from "node:assert/strict";

import {
  buildV594HumanSignoff,
  createV594HumanChallenge,
  parseV594HumanArgs,
  validateV594HumanDecision,
  V594_HUMAN_DELEGATED_SCOPE,
  V594_HUMAN_DELEGATED_STATEMENT,
} from "./build-v594-human-visual-signoff.mjs";
import {
  V594_EXACT_PASSES,
} from "./build-v594-current-lite-matrix.mjs";
import {
  V594_BROWSER_GATE_STATUS,
  V594_BROWSER_GATE_VERSION,
} from "./build-v594-final-sealed-browser-gate.mjs";
import {
  canonicalShaV594Closure,
  sealV594Document,
} from "./build-v594-current-source-lifecycle.mjs";

const identity = {
  sourceManifestSha256: "a".repeat(64),
  candidateManifestSha256: "b".repeat(64),
  buildId: `v594b-${"c".repeat(64)}`,
  buildFingerprint: "c".repeat(64),
  deploymentId: `v594-${"a".repeat(12)}-${"b".repeat(12)}`,
  formalProductPointer: "v263",
  deliveryTier: "standalone-full",
};

function browserGate() {
  return sealV594Document({
    version: V594_BROWSER_GATE_VERSION,
    status: V594_BROWSER_GATE_STATUS,
    candidate: identity,
    matrices: { exactAb: {
      passes: V594_EXACT_PASSES,
      pairCount: 8,
      frameCount: 16,
      stageReceiptSha256: "d".repeat(64),
      batchSha256: "e".repeat(64),
      relativityObservationMarkerVerified: true,
    } },
    exactRelativityObservationMarkerVerified: true,
    synthetic: true,
  });
}

function decision(challenge, overrides = {}) {
  const reviewedAt = "2026-08-25T00:00:00.000Z";
  return sealV594Document({
    version: "v594-human-user-decision-v1",
    decision: "approve-v594-eight-of-eight",
    approved: true,
    reviewer: "workspace-owner",
    provenance: {
      createdBy: "workspace-owner",
      artifactOrigin: "independent-user-decision-input",
      agentGenerated: false,
      explicitConfirmation: "APPROVE v594 8/8",
    },
    reviewedAt,
    challengeSha256: canonicalShaV594Closure(challenge),
    passes: Object.fromEntries(V594_EXACT_PASSES.map((pass) => [pass, {
      decision: "approved",
      reviewedAt,
    }])),
    fixture: { synthetic: true },
    ...overrides,
  }, "decisionSha256");
}

test("v594 human challenge and independent decision happy path", () => {
  const challenge = createV594HumanChallenge(browserGate(), { syntheticFixture: true });
  const result = validateV594HumanDecision(decision(challenge), challenge, { syntheticFixture: true });
  assert.equal(result.reviewer, "workspace-owner");
  assert.equal(result.challengeSha256, canonicalShaV594Closure(challenge));
});

test("v594 human challenge rejects a resealed gate without the relativity marker", () => {
  const gate = browserGate();
  const unsigned = { ...gate, exactRelativityObservationMarkerVerified: false };
  delete unsigned.receiptSha256;
  assert.throws(
    () => createV594HumanChallenge(sealV594Document(unsigned), { syntheticFixture: true }),
    /relativity-observation-marker/,
  );
});

test("v594 rejects old v593 decision and challenge replay", () => {
  const challenge = createV594HumanChallenge(browserGate(), { syntheticFixture: true });
  const old = decision(challenge, { version: "v593-human-user-decision-v1" });
  assert.throws(() => validateV594HumanDecision(old, challenge, { syntheticFixture: true }), /v594-human-decision-version|old-v593/);
  const replay = decision({ ...challenge, exactBatchSha256: "f".repeat(64) });
  assert.throws(() => validateV594HumanDecision(replay, challenge, { syntheticFixture: true }), /challenge/);
});

test("v594 requires every exact pass and workspace-owner", () => {
  const challenge = createV594HumanChallenge(browserGate(), { syntheticFixture: true });
  const bad = decision(challenge, {
    reviewer: "automation",
    passes: Object.fromEntries(V594_EXACT_PASSES.slice(0, -1).map((pass) => [pass, {
      decision: "approved",
      reviewedAt: "2026-08-25T00:00:00.000Z",
    }])),
  });
  assert.throws(() => validateV594HumanDecision(bad, challenge, { syntheticFixture: true }), /reviewer|pass-order/);
});

test("v594 human builder refuses to create or infer a missing decision", async () => {
  await assert.rejects(buildV594HumanSignoff({ decisionPath: null }), /decision-required/);
});

test("v594 rejects an agent-generated artifact that labels itself workspace-owner", () => {
  const challenge = createV594HumanChallenge(browserGate(), { syntheticFixture: true });
  const forged = decision(challenge, {
    provenance: {
      createdBy: "workspace-owner",
      artifactOrigin: "independent-user-decision-input",
      agentGenerated: true,
      explicitConfirmation: "APPROVE v594 8/8",
    },
  });
  assert.throws(() => validateV594HumanDecision(forged, challenge, { syntheticFixture: true }), /workspace-owner-provenance/);
});

test("v594 accepts explicitly delegated Codex generation without relabeling it independent", () => {
  const challenge = createV594HumanChallenge(browserGate(), { syntheticFixture: true });
  const delegated = decision(challenge, {
    provenance: {
      createdBy: "codex-agent",
      artifactOrigin: "delegated-user-authorized-decision-input",
      agentGenerated: true,
      authorization: {
        principal: "workspace-owner",
        grant: "explicit-conversation-authorization",
        scope: V594_HUMAN_DELEGATED_SCOPE,
        statement: V594_HUMAN_DELEGATED_STATEMENT,
      },
    },
  });
  const result = validateV594HumanDecision(delegated, challenge, { syntheticFixture: true });
  assert.equal(result.provenanceMode, "delegated-codex-generation");
});

test("v594 challenge-only CLI never requires or infers a decision", () => {
  const args = parseV594HumanArgs([
    "--challenge-only",
    "--browser-gate", "tmp/gate.json",
    "--challenge-output", "tmp/challenge.json",
  ]);
  assert.equal(args.challengeOnly, true);
  assert.equal(args["decision-file"], undefined);
  assert.throws(() => parseV594HumanArgs([
    "--challenge-output", "tmp/challenge.json",
  ]), /challenge-output-mode/);
});

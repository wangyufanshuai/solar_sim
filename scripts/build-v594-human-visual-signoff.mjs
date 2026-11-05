import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  assertV594,
  assertV594Authority,
  atomicWriteJsonV594,
  canonicalShaV594Closure,
  fileReceiptV594,
  loadCurrentV594Bundle,
  readJsonV594,
  resolveInsideV594Workspace,
  resolveV594OutputRoot,
  sealV594Document,
  sameCanonicalV594,
  validateV594Identity,
  verifyV594Seal,
} from "./build-v594-current-source-lifecycle.mjs";
import {
  V594_BROWSER_GATE_STATUS,
  V594_BROWSER_GATE_VERSION,
} from "./build-v594-final-sealed-browser-gate.mjs";
import { V594_EXACT_PASSES } from "./build-v594-current-lite-matrix.mjs";

export const V594_HUMAN_CHALLENGE_VERSION =
  "v594-human-visual-signoff-decision-challenge-v2";
export const V594_HUMAN_DECISION_VERSION = "v594-human-user-decision-v1";
export const V594_HUMAN_DECISION_VALUE = "approve-v594-eight-of-eight";
export const V594_HUMAN_SIGNOFF_VERSION = "v594-human-visual-signoff-dossier-v2";
export const V594_HUMAN_SIGNOFF_STATUS =
  "approved-v594-eight-pair-human-visual-signoff";
// The workspace owner may either supply the signed decision directly, or
// explicitly delegate construction of the current-identity artifact to Codex.
// Delegation is deliberately represented as a separate, auditable provenance
// mode; it must never be silently relabeled as an independent human input.
export const V594_HUMAN_DELEGATED_SCOPE =
  "v594-current-identity-human-decision-and-reseal-verifier";
export const V594_HUMAN_DELEGATED_STATEMENT =
  "workspace-owner-explicitly-authorized-codex-to-generate-v594-human-decision-and-revise-reseal-verifier";

export function validateV594HumanDecisionProvenance(provenance) {
  const independent = provenance?.createdBy === "workspace-owner"
    && provenance?.artifactOrigin === "independent-user-decision-input"
    && provenance?.agentGenerated === false
    && provenance?.explicitConfirmation === "APPROVE v594 8/8";
  const delegated = provenance?.createdBy === "codex-agent"
    && provenance?.artifactOrigin === "delegated-user-authorized-decision-input"
    && provenance?.agentGenerated === true
    && provenance?.authorization?.principal === "workspace-owner"
    && provenance?.authorization?.grant === "explicit-conversation-authorization"
    && provenance?.authorization?.scope === V594_HUMAN_DELEGATED_SCOPE
    && provenance?.authorization?.statement === V594_HUMAN_DELEGATED_STATEMENT;
  assertV594(independent || delegated, "v594-human-decision-workspace-owner-provenance");
  return independent ? "independent-workspace-owner-input" : "delegated-codex-generation";
}

export function createV594HumanChallenge(browserGate, options = {}) {
  verifyV594Seal(browserGate, "receiptSha256", "human-browser-gate");
  assertV594(browserGate.version === V594_BROWSER_GATE_VERSION,
    "v594-human-browser-gate-version");
  assertV594(browserGate.status === V594_BROWSER_GATE_STATUS,
    "v594-human-browser-gate-status");
  assertV594(
    options.syntheticFixture ? browserGate.synthetic === true : browserGate.synthetic !== true,
    "v594-human-synthetic-gate-as-formal",
  );
  assertV594(sameCanonicalV594(browserGate.matrices?.exactAb?.passes, V594_EXACT_PASSES),
    "v594-human-exact-pass-order");
  assertV594(browserGate.matrices.exactAb.pairCount === V594_EXACT_PASSES.length
    && browserGate.matrices.exactAb.frameCount === V594_EXACT_PASSES.length * 2,
  "v594-human-exact-envelope");
  assertV594(browserGate.exactRelativityObservationMarkerVerified === true
    && browserGate.matrices.exactAb.relativityObservationMarkerVerified === true,
  "v594-human-relativity-observation-marker");
  return Object.freeze({
    version: V594_HUMAN_CHALLENGE_VERSION,
    candidate: {
      ...browserGate.candidate,
      formalProductPointer: "v263",
    },
    browserGateReceiptSha256: browserGate.receiptSha256,
    exactStageReceiptSha256: browserGate.matrices.exactAb.stageReceiptSha256,
    exactBatchSha256: browserGate.matrices.exactAb.batchSha256,
    exactFrameCount: browserGate.matrices.exactAb.frameCount,
    exactRelativityObservationMarkerVerified: true,
    requiredPasses: V594_EXACT_PASSES,
  });
}

export function validateV594HumanDecision(decision, challenge, options = {}) {
  verifyV594Seal(decision, "decisionSha256", "human-decision");
  assertV594(decision.version === V594_HUMAN_DECISION_VERSION,
    "v594-human-decision-version");
  assertV594(decision.version !== "v593-human-user-decision-v1",
    "v594-human-old-v593-decision");
  assertV594(decision.decision === V594_HUMAN_DECISION_VALUE
    && decision.approved === true, "v594-human-decision-explicit");
  assertV594(decision.reviewer === "workspace-owner", "v594-human-decision-reviewer");
  const provenanceMode = validateV594HumanDecisionProvenance(decision.provenance);
  assertV594(typeof decision.reviewedAt === "string"
    && Number.isFinite(Date.parse(decision.reviewedAt)), "v594-human-decision-time");
  assertV594(decision.challengeSha256 === canonicalShaV594Closure(challenge),
    "v594-human-decision-challenge-replay-or-drift");
  assertV594(sameCanonicalV594(Object.keys(decision.passes ?? {}), V594_EXACT_PASSES),
    "v594-human-decision-pass-order");
  for (const pass of V594_EXACT_PASSES) {
    const row = decision.passes[pass];
    assertV594(row?.decision === "approved", `v594-human-decision-pass:${pass}`);
    assertV594(typeof row.reviewedAt === "string"
      && Number.isFinite(Date.parse(row.reviewedAt)), `v594-human-decision-pass-time:${pass}`);
  }
  if (options.syntheticFixture) {
    assertV594(decision.fixture?.synthetic === true, "v594-human-decision-fixture-marker");
  } else {
    assertV594(decision.fixture?.synthetic !== true, "v594-human-synthetic-decision-as-formal");
  }
  return Object.freeze({
    reviewer: decision.reviewer,
    reviewedAt: decision.reviewedAt,
    challengeSha256: decision.challengeSha256,
    decisionSha256: decision.decisionSha256,
    provenanceMode,
  });
}

/**
 * Bind the aggregate human dossier back to the exact raw decision artifact.
 *
 * The decision seal already covers its provenance, but the aggregate receipt
 * also carries a copy for convenient inspection.  Re-opening both values and
 * comparing them here prevents a caller from re-sealing a dossier with a
 * different (independent vs delegated) provenance label after the decision
 * was validated.
 */
export function validateV594HumanDecisionRawBinding({
  human,
  decision,
  challenge,
  syntheticFixture = false,
} = {}) {
  const validatedDecision = validateV594HumanDecision(decision, challenge, {
    syntheticFixture,
  });
  let provenanceMatches = false;
  try {
    provenanceMatches = sameCanonicalV594(human?.decisionProvenance, decision?.provenance);
  } catch {
    provenanceMatches = false;
  }
  assertV594(provenanceMatches, "v594-human-raw-provenance-drift");
  assertV594(human?.decisionProvenanceMode === validatedDecision.provenanceMode,
    "v594-human-raw-provenance-mode-drift");
  assertV594(human?.decisionSha256 === validatedDecision.decisionSha256
    && human?.decisionChallengeSha256 === validatedDecision.challengeSha256,
  "v594-human-raw-decision-seal-drift");
  return validatedDecision;
}

export function validateV594HumanSignoff(receipt, expectedIdentity, options = {}) {
  verifyV594Seal(receipt, "receiptSha256", "human-signoff");
  assertV594(receipt.version === V594_HUMAN_SIGNOFF_VERSION,
    "v594-human-signoff-version");
  assertV594(receipt.status === V594_HUMAN_SIGNOFF_STATUS,
    "v594-human-signoff-status");
  const identity = validateV594Identity(receipt.candidate, expectedIdentity, {
    deliveryTier: "standalone-full",
  });
  assertV594(receipt.approved === true && receipt.signaturePassesApproved === 8,
    "v594-human-signoff-approval");
  assertV594(receipt.reviewer === "workspace-owner", "v594-human-signoff-reviewer");
  const provenanceMode = validateV594HumanDecisionProvenance(receipt.decisionProvenance);
  assertV594(receipt.decisionProvenanceMode === provenanceMode,
    "v594-human-signoff-provenance-mode");
  assertV594(sameCanonicalV594(Object.keys(receipt.passes ?? {}), V594_EXACT_PASSES),
    "v594-human-signoff-pass-order");
  assertV594(receipt.policy?.currentIdentityOnly === true
    && receipt.policy?.sameBuildBeforeAfter === true
    && receipt.policy?.noHistoricalScreenshotSubstitution === true
     && receipt.policy?.explicitDecisionArtifactRequired === true
    && receipt.policy?.oldV593DecisionRejected === true
    && receipt.policy?.automaticHumanApproval === false
    && receipt.policy?.scientificPayloadWriteback === false
    && receipt.policy?.delegatedGenerationAuthorized
      === (provenanceMode === "delegated-codex-generation"),
  "v594-human-signoff-policy");
  assertV594Authority(receipt.authority, "human-signoff");
  assertV594(receipt.synthetic === (options.syntheticFixture === true),
    "v594-human-signoff-fixture-binding");
  return Object.freeze({ identity, receiptSha256: receipt.receiptSha256,
    challengeSha256: receipt.decisionChallengeSha256,
    decisionSha256: receipt.decisionSha256, provenanceMode });
}

export async function buildV594HumanChallengeOnly({
  root = process.cwd(),
  browserGatePath = "docs/release/v594/final-sealed-browser-gate-v594.json",
  browserGateCanonicalPath = browserGatePath,
  outputPath = null,
  syntheticFixture = false,
} = {}) {
  const bundle = await loadCurrentV594Bundle(root, { requireBuilds: true });
  resolveInsideV594Workspace(bundle.workspace, browserGateCanonicalPath,
    "human-challenge-browser-gate-canonical-path");
  const browserGate = (await readJsonV594(
    resolveInsideV594Workspace(bundle.workspace, browserGatePath, "human-challenge-browser-gate"),
    "human-challenge-browser-gate",
  )).value;
  const challenge = createV594HumanChallenge(browserGate, { syntheticFixture });
  validateV594Identity(challenge.candidate, bundle.identities.standalone, {
    deliveryTier: "standalone-full",
  });
  if (outputPath) {
    await atomicWriteJsonV594(bundle.workspace, outputPath, challenge, "human-challenge-output");
  }
  return Object.freeze({
    challenge,
    challengeSha256: canonicalShaV594Closure(challenge),
    outputPath,
    decisionGenerated: false,
  });
}

export async function buildV594HumanSignoff({
  root = process.cwd(),
  outputRoot = root,
  browserGatePath = "docs/release/v594/final-sealed-browser-gate-v594.json",
  browserGateCanonicalPath = browserGatePath,
  decisionPath,
  outputPath = "docs/release/v594/human-visual-signoff-v594.json",
  syntheticFixture = false,
} = {}) {
  assertV594(decisionPath, "v594-human-decision-required");
  const bundle = await loadCurrentV594Bundle(root, { requireBuilds: true });
  resolveInsideV594Workspace(bundle.workspace, browserGateCanonicalPath,
    "human-browser-gate-canonical-path");
  const browserGate = (await readJsonV594(
    resolveInsideV594Workspace(bundle.workspace, browserGatePath, "human-browser-gate"),
    "human-browser-gate",
  )).value;
  const decision = (await readJsonV594(
    resolveInsideV594Workspace(bundle.workspace, decisionPath, "human-decision"),
    "human-decision",
  )).value;
  if (syntheticFixture) {
    assertV594(browserGate.synthetic === true, "v594-human-fixture-gate-marker");
  }
  const challenge = createV594HumanChallenge(browserGate, { syntheticFixture });
  const validatedDecision = validateV594HumanDecision(decision, challenge, {
    syntheticFixture,
  });
  const identity = validateV594Identity(browserGate.candidate, bundle.identities.standalone, {
    deliveryTier: "standalone-full",
  });
  const passes = Object.fromEntries(V594_EXACT_PASSES.map((pass) => [pass, {
    humanVisualSignoff: "approved",
    reviewer: validatedDecision.reviewer,
    reviewedAt: decision.passes[pass].reviewedAt,
  }]));
  const unsigned = {
    version: V594_HUMAN_SIGNOFF_VERSION,
    generatedAt: validatedDecision.reviewedAt,
    reviewedAt: validatedDecision.reviewedAt,
    status: V594_HUMAN_SIGNOFF_STATUS,
    reviewer: validatedDecision.reviewer,
    statement: "The workspace owner approved all eight current-v594 exact A/B pairs. This grants no scientific, measured, GPU, promotion, or production authority.",
    candidate: identity,
    browserGate: {
      ...await fileReceiptV594(bundle.workspace, browserGatePath, "human-browser-gate"),
      path: browserGateCanonicalPath,
    },
    browserGateReceiptSha256: browserGate.receiptSha256,
    userDecision: await fileReceiptV594(bundle.workspace, decisionPath, "human-decision"),
    decisionChallenge: challenge,
    decisionChallengeSha256: validatedDecision.challengeSha256,
    decisionSha256: validatedDecision.decisionSha256,
    decisionProvenance: decision.provenance,
    decisionProvenanceMode: validatedDecision.provenanceMode,
    passes,
    signaturePassesApproved: V594_EXACT_PASSES.length,
    approved: true,
    policy: {
      currentIdentityOnly: true,
      sameBuildBeforeAfter: true,
      noHistoricalScreenshotSubstitution: true,
       explicitDecisionArtifactRequired: true,
      oldV593DecisionRejected: true,
      automaticHumanApproval: false,
      scientificPayloadWriteback: false,
      delegatedGenerationAuthorized: validatedDecision.provenanceMode === "delegated-codex-generation",
    },
    authority: { ...bundle.candidate.authority },
    synthetic: syntheticFixture,
  };
  const receipt = sealV594Document(unsigned);
  if (!syntheticFixture) await atomicWriteJsonV594(
    await resolveV594OutputRoot(bundle.workspace, outputRoot, "human-output"),
    outputPath,
    receipt,
    "human-output",
  );
  return receipt;
}

export function parseV594HumanArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--challenge-only") {
      values.challengeOnly = true;
    } else if (new Set(["--browser-gate", "--decision-file", "--output", "--challenge-output",
      "--validate-fixture"]).has(token)) {
      values[token.slice(2)] = argv[++index];
    } else throw new Error(`v594-human-argument:${token}`);
  }
  if (values["validate-fixture"]) {
    const parts = values["validate-fixture"].split(",");
    assertV594(parts.length === 2, "v594-human-fixture-format");
    [values["browser-gate"], values["decision-file"]] = parts;
    values.syntheticFixture = true;
  }
  assertV594(!values["challenge-output"] || values.challengeOnly === true,
    "v594-human-challenge-output-mode");
  if (!values.challengeOnly) assertV594(values["decision-file"], "v594-human-decision-required");
  return values;
}

async function main() {
  const args = parseV594HumanArgs(process.argv.slice(2));
  if (args.challengeOnly) {
    const result = await buildV594HumanChallengeOnly({
      browserGatePath: args["browser-gate"],
      outputPath: args["challenge-output"],
      syntheticFixture: args.syntheticFixture === true,
    });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  const receipt = await buildV594HumanSignoff({
    browserGatePath: args["browser-gate"],
    decisionPath: args["decision-file"],
    outputPath: args.output,
    syntheticFixture: args.syntheticFixture === true,
  });
  process.stdout.write(`${JSON.stringify({ status: receipt.status,
    reviewer: receipt.reviewer,
    approvedPairs: receipt.signaturePassesApproved,
    challengeSha256: receipt.decisionChallengeSha256,
    receiptSha256: receipt.receiptSha256,
    synthetic: receipt.synthetic }, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}

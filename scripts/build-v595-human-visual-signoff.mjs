import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  assertV595Authority,
  assertV595Formal,
  atomicWriteJsonV595Formal,
  canonicalShaV595Formal,
  fileReceiptV595Formal,
  loadCurrentV595Bundle,
  readJsonV595Formal,
  sameCanonicalV595Formal,
  sealV595FormalDocument,
  validateV595Identity,
  verifyV595FormalSeal,
  V595_FORMAL_PRODUCT_POINTER,
  V595_PARENT_V594_IDENTITY,
} from "./v595-formal-contract.mjs";
import {
  validateV595BrowserGate,
  V595_BROWSER_GATE_STATUS,
  V595_BROWSER_GATE_VERSION,
  V595_PRODUCT_SCENE_FAMILIES as V595_BROWSER_PRODUCT_SCENE_FAMILIES,
} from "./build-v595-final-sealed-browser-gate.mjs";
import {
  V595_EXACT_LANES,
  V595_EXACT_PASSES,
} from "./build-v595-current-lite-matrix.mjs";

export const V595_HUMAN_REVIEW_PASSES = V595_EXACT_PASSES;
export const V595_EXACT_AB_LANES = V595_EXACT_LANES;
export const V595_PRODUCT_SCENE_FAMILIES = V595_BROWSER_PRODUCT_SCENE_FAMILIES;

export const V595_HUMAN_CHALLENGE_VERSION =
  "v595-human-visual-signoff-decision-challenge-v1";
export const V595_HUMAN_REVIEW_STAGE_VERSION =
  "v595-human-visual-signoff-review-stage-v1";
export const V595_HUMAN_REVIEW_STAGE_STATUS =
  "awaiting-workspace-owner-v595-eight-of-eight-decision";
export const V595_HUMAN_DECISION_VERSION = "v595-human-user-decision-v1";
export const V595_HUMAN_DECISION_VALUE = "approve-v595-eight-of-eight";
export const V595_HUMAN_SIGNOFF_VERSION =
  "v595-human-visual-signoff-dossier-v1";
export const V595_HUMAN_SIGNOFF_STATUS =
  "approved-v595-eight-pair-human-visual-signoff";
export const V595_HUMAN_DELEGATED_SCOPE =
  "v595-current-identity-human-decision-only";
export const V595_HUMAN_DELEGATED_STATEMENT =
  "workspace-owner-explicitly-authorized-codex-to-generate-the-current-v595-human-decision-artifact";

const SHA256_PATTERN = /^[0-9a-f]{64}$/;

function assertSha(value, label) {
  assertV595Formal(SHA256_PATTERN.test(value ?? ""), `v595-human-sha256:${label}`);
  return value;
}

function assertIsoTimestamp(value, label) {
  assertV595Formal(
    typeof value === "string" && Number.isFinite(Date.parse(value)),
    `v595-human-timestamp:${label}`,
  );
  return value;
}

function exactMatrix(browserGate) {
  return browserGate?.matrices?.exactAb;
}

function stellarMatrix(browserGate) {
  return browserGate?.matrices?.stellarScienceCinematic;
}

function familyMatrix(browserGate) {
  return browserGate?.matrices?.productSceneFamilies;
}

function requireCurrentEvidenceEnvelope(browserGate) {
  const exact = exactMatrix(browserGate);
  assertV595Formal(
    exact?.pairCount === V595_HUMAN_REVIEW_PASSES.length
      && exact?.frameCount === V595_HUMAN_REVIEW_PASSES.length * 2
      && sameCanonicalV595Formal(exact.passes, V595_HUMAN_REVIEW_PASSES)
      && sameCanonicalV595Formal(exact.lanes, V595_EXACT_AB_LANES),
    "v595-human-exact-ab-envelope",
  );
  assertSha(exact.stageReceiptSha256, "exact-stage");
  assertSha(exact.batchSha256, "exact-batch");

  const stellar = stellarMatrix(browserGate);
  assertV595Formal(
    stellar?.targetCount === 24
      && stellar?.modeCount === 2
      && stellar?.frameCount === 48,
    "v595-human-stellar-24x2-envelope",
  );
  assertSha(stellar.receiptSha256, "stellar-24x2-receipt");

  const families = familyMatrix(browserGate);
  assertV595Formal(
    families?.familyCount === V595_PRODUCT_SCENE_FAMILIES.length
      && sameCanonicalV595Formal(
        families.orderedFamilies,
        V595_PRODUCT_SCENE_FAMILIES,
      ),
    "v595-human-product-scene-family-envelope",
  );
  assertSha(families.receiptSha256, "product-scene-family-receipt");

  const desktop = browserGate?.supplemental?.realDesktopChrome;
  assertV595Formal(
    desktop?.status === "passed-supplemental-real-desktop-eligible"
      && desktop?.supplementalOnly === true
      && desktop?.formalEvidence === false
      && desktop?.promotion === "none"
      && desktop?.realDesktopEligible === true
      && desktop?.realMobileEligible === false,
    "v595-human-real-desktop-supplemental-boundary",
  );
  assertSha(
    desktop.receiptSha256 ?? desktop.receipt?.receiptSha256
      ?? desktop.receipt?.sha256,
    "real-desktop-receipt",
  );

  const mobile = browserGate?.supplemental?.physicalMobile;
  assertV595Formal(
    mobile?.status === "not-present-not-faked"
      && mobile?.evidence === null
      && mobile?.formalEvidence === false
      && mobile?.promotion === "none",
    "v595-human-physical-mobile-not-faked",
  );
  return Object.freeze({ exact, stellar, families, desktop, mobile });
}

function validateTimelikeCandidate(candidateDocument, browserGate) {
  const timelike = candidateDocument?.relativity?.timelikeKerr;
  assertV595Formal(
    timelike?.fixtureCount === 4
      && timelike?.analyticAnchorCount === 3
      && timelike?.referenceCandidateOnly === true
      && timelike?.formalEvidence === false
      && timelike?.promotion === "none",
    "v595-human-timelike-reference-boundary",
  );
  for (const field of [
    "admissionSha256",
    "receiptSha256",
    "manifestSha256",
    "summarySha256",
    "sourceSha256",
  ]) assertSha(timelike[field], `timelike:${field}`);

  const boundary = browserGate?.boundaries?.timelikeKerr;
  if (boundary !== undefined) {
    assertV595Formal(
      boundary.referenceCandidateOnly === true
        && boundary.formalEvidence === false
        && boundary.promotion === "none"
        && boundary.admissionSha256 === timelike.admissionSha256
        && boundary.admissionReceiptSha256 === timelike.receiptSha256,
      "v595-human-browser-timelike-binding",
    );
  } else {
    assertV595Formal(
      browserGate?.boundaries?.timelikeKerrReferenceCandidateOnly === true,
      "v595-human-browser-timelike-boundary",
    );
  }
  return timelike;
}

export function validateV595HumanDecisionProvenance(provenance) {
  const independent = provenance?.createdBy === "workspace-owner"
      && provenance?.artifactOrigin === "independent-user-decision-input"
      && provenance?.agentGenerated === false
      && provenance?.explicitConfirmation === "APPROVE v595 8/8";
  const delegated = provenance?.createdBy === "codex-agent"
      && provenance?.artifactOrigin === "delegated-user-authorized-decision-input"
      && provenance?.agentGenerated === true
      && provenance?.authorization?.principal === "workspace-owner"
      && provenance?.authorization?.grant === "explicit-conversation-authorization"
      && provenance?.authorization?.scope === V595_HUMAN_DELEGATED_SCOPE
      && provenance?.authorization?.statement === V595_HUMAN_DELEGATED_STATEMENT;
  assertV595Formal(
    independent || delegated,
    "v595-human-decision-workspace-owner-provenance",
  );
  return independent
    ? "independent-workspace-owner-input"
    : "delegated-codex-generation";
}

export function createV595HumanChallenge(
  browserGate,
  {
    candidateDocument,
    expectedFullIdentity = null,
    expectedLiteIdentity = null,
    syntheticFixture = false,
  } = {},
) {
  verifyV595FormalSeal(browserGate, "receiptSha256", "human-browser-gate");
  assertV595Formal(
    browserGate.version === V595_BROWSER_GATE_VERSION
      && browserGate.status === V595_BROWSER_GATE_STATUS,
    "v595-human-browser-gate-contract",
  );
  assertV595Formal(
    browserGate.synthetic === (syntheticFixture === true),
    "v595-human-browser-gate-synthetic-binding",
  );
  assertV595Authority(browserGate.authority, "human-browser-gate");
  const validatedGate = validateV595BrowserGate(browserGate, {
    expectedFullIdentity,
    expectedLiteIdentity,
    expectedTimelikeKerr: candidateDocument?.relativity?.timelikeKerr,
    syntheticFixture,
  });
  const candidate = validatedGate.full;
  const evidence = requireCurrentEvidenceEnvelope(browserGate);
  const timelike = validateTimelikeCandidate(candidateDocument, browserGate);
  assertV595Formal(
    candidateDocument?.governance?.priorV594HumanDecisionInherited === false,
    "v595-human-prior-v594-decision-inheritance",
  );
  assertV595Formal(
    candidateDocument?.parentV594?.sourceManifestSha256
        === V595_PARENT_V594_IDENTITY.sourceManifestSha256
      && candidateDocument?.parentV594?.candidateManifestSha256
        === V595_PARENT_V594_IDENTITY.candidateManifestSha256
      && candidateDocument?.parentV594?.releaseDossierSha256
        === V595_PARENT_V594_IDENTITY.releaseDossierSha256
      && candidateDocument?.parentV594?.resealReceiptSha256
        === V595_PARENT_V594_IDENTITY.resealReceiptSha256,
    "v595-human-parent-v594-identity",
  );

  return Object.freeze({
    version: V595_HUMAN_CHALLENGE_VERSION,
    candidate: { ...candidate, formalProductPointer: V595_FORMAL_PRODUCT_POINTER },
    parentV594: { ...V595_PARENT_V594_IDENTITY, immutable: true },
    browserGateReceiptSha256: browserGate.receiptSha256,
    exactAb: {
      stageReceiptSha256: evidence.exact.stageReceiptSha256,
      batchSha256: evidence.exact.batchSha256,
      pairCount: evidence.exact.pairCount,
      frameCount: evidence.exact.frameCount,
      lanes: V595_EXACT_AB_LANES,
      passes: V595_HUMAN_REVIEW_PASSES,
    },
    stellarScienceCinematic: {
      receiptSha256: evidence.stellar.receiptSha256,
      targetCount: 24,
      modeCount: 2,
      frameCount: 48,
    },
    productSceneFamilies: {
      receiptSha256: evidence.families.receiptSha256,
      familyCount: 6,
      orderedFamilies: V595_PRODUCT_SCENE_FAMILIES,
      sharedMainCanvas: true,
    },
    timelikeKerr: {
      admissionSha256: timelike.admissionSha256,
      receiptSha256: timelike.receiptSha256,
      manifestSha256: timelike.manifestSha256,
      summarySha256: timelike.summarySha256,
      sourceSha256: timelike.sourceSha256,
      fixtureCount: 4,
      analyticAnchorCount: 3,
      referenceCandidateOnly: true,
      formalEvidence: false,
      promotion: "none",
    },
    supplemental: {
      realDesktopChromeReceiptSha256:
        evidence.desktop.receiptSha256 ?? evidence.desktop.receipt?.receiptSha256
          ?? evidence.desktop.receipt?.sha256,
      realDesktopEligible: true,
      physicalMobileStatus: "not-present-not-faked",
      realMobileEligible: false,
    },
    requiredPasses: V595_HUMAN_REVIEW_PASSES,
    priorV594HumanDecisionInherited: false,
  });
}

export function validateV595HumanDecision(decision, challenge, options = {}) {
  verifyV595FormalSeal(decision, "decisionSha256", "human-decision");
  assertV595Formal(
    decision.version === V595_HUMAN_DECISION_VERSION,
    "v595-human-decision-version",
  );
  assertV595Formal(
    decision.version !== "v594-human-user-decision-v1"
      && decision.version !== "v593-human-user-decision-v1",
    "v595-human-prior-decision-rejected",
  );
  assertV595Formal(
    decision.decision === V595_HUMAN_DECISION_VALUE
      && decision.approved === true,
    "v595-human-decision-explicit",
  );
  assertV595Formal(decision.reviewer === "workspace-owner", "v595-human-decision-reviewer");
  assertIsoTimestamp(decision.reviewedAt, "decision");
  assertV595Formal(
    decision.challengeSha256 === canonicalShaV595Formal(challenge),
    "v595-human-decision-challenge-replay-or-drift",
  );
  assertV595Formal(
    sameCanonicalV595Formal(Object.keys(decision.passes ?? {}), V595_HUMAN_REVIEW_PASSES),
    "v595-human-decision-pass-order",
  );
  for (const pass of V595_HUMAN_REVIEW_PASSES) {
    assertV595Formal(
      decision.passes[pass]?.decision === "approved",
      `v595-human-decision-pass:${pass}`,
    );
    assertIsoTimestamp(decision.passes[pass]?.reviewedAt, `pass:${pass}`);
  }
  const provenanceMode = validateV595HumanDecisionProvenance(decision.provenance);
  assertV595Formal(
    decision.priorV594HumanDecisionInherited === false,
    "v595-human-decision-prior-v594-inheritance",
  );
  if (options.syntheticFixture) {
    assertV595Formal(decision.fixture?.synthetic === true, "v595-human-decision-fixture-marker");
  } else {
    assertV595Formal(decision.fixture?.synthetic !== true, "v595-human-synthetic-decision-as-formal");
  }
  return Object.freeze({
    reviewer: decision.reviewer,
    reviewedAt: decision.reviewedAt,
    challengeSha256: decision.challengeSha256,
    decisionSha256: decision.decisionSha256,
    provenanceMode,
  });
}

export function createV595HumanReviewStage(
  browserGate,
  {
    candidateDocument,
    expectedFullIdentity = null,
    expectedLiteIdentity = null,
    authority,
    syntheticFixture = false,
  } = {},
) {
  const challenge = createV595HumanChallenge(browserGate, {
    candidateDocument,
    expectedFullIdentity,
    expectedLiteIdentity,
    syntheticFixture,
  });
  const unsigned = {
    version: V595_HUMAN_REVIEW_STAGE_VERSION,
    generatedAt: candidateDocument.generatedAt,
    status: V595_HUMAN_REVIEW_STAGE_STATUS,
    candidate: challenge.candidate,
    challenge,
    challengeSha256: canonicalShaV595Formal(challenge),
    decisionRequired: true,
    decisionGenerated: false,
    priorV594HumanDecisionInherited: false,
    policy: {
      workspaceOwnerDecisionRequired: true,
      exactEightOfEightRequired: true,
      currentIdentityOnly: true,
      automaticHumanApproval: false,
    },
    authority: { ...authority },
    synthetic: syntheticFixture,
  };
  assertV595Authority(unsigned.authority, "human-review-stage");
  return sealV595FormalDocument(unsigned);
}

export function validateV595HumanDecisionRawBinding({
  human,
  decision,
  challenge,
  syntheticFixture = false,
} = {}) {
  const validated = validateV595HumanDecision(decision, challenge, { syntheticFixture });
  assertV595Formal(
    sameCanonicalV595Formal(human?.decisionProvenance, decision.provenance),
    "v595-human-raw-provenance-drift",
  );
  assertV595Formal(
    human?.decisionProvenanceMode === validated.provenanceMode,
    "v595-human-raw-provenance-mode-drift",
  );
  assertV595Formal(
    human?.decisionSha256 === validated.decisionSha256
      && human?.decisionChallengeSha256 === validated.challengeSha256,
    "v595-human-raw-decision-seal-drift",
  );
  return validated;
}

export function validateV595HumanSignoff(receipt, expectedIdentity, options = {}) {
  verifyV595FormalSeal(receipt, "receiptSha256", "human-signoff");
  assertV595Formal(
    receipt.version === V595_HUMAN_SIGNOFF_VERSION
      && receipt.status === V595_HUMAN_SIGNOFF_STATUS,
    "v595-human-signoff-contract",
  );
  const identity = validateV595Identity(receipt.candidate, expectedIdentity, {
    deliveryTier: "standalone-full",
  });
  assertV595Formal(
    receipt.approved === true
      && receipt.signaturePassesApproved === V595_HUMAN_REVIEW_PASSES.length
      && receipt.reviewer === "workspace-owner",
    "v595-human-signoff-approval",
  );
  assertIsoTimestamp(receipt.reviewedAt, "signoff");
  assertV595Formal(
    sameCanonicalV595Formal(Object.keys(receipt.passes ?? {}), V595_HUMAN_REVIEW_PASSES),
    "v595-human-signoff-pass-order",
  );
  assertV595Formal(
    receipt.policy?.currentIdentityOnly === true
      && receipt.policy?.sameBuildBeforeAfter === true
      && receipt.policy?.noHistoricalScreenshotSubstitution === true
      && receipt.policy?.explicitDecisionArtifactRequired === true
      && receipt.policy?.priorV594DecisionRejected === true
      && receipt.policy?.priorV594HumanDecisionInherited === false
      && receipt.policy?.automaticHumanApproval === false
      && receipt.policy?.scientificPayloadWriteback === false
      && receipt.policy?.physicalMobileEvidenceFabricated === false,
    "v595-human-signoff-policy",
  );
  const provenanceMode = validateV595HumanDecisionProvenance(
    receipt.decisionProvenance,
  );
  assertV595Formal(
    receipt.decisionProvenanceMode === provenanceMode,
    "v595-human-signoff-provenance",
  );
  assertV595Authority(receipt.authority, "human-signoff");
  assertV595Formal(
    receipt.synthetic === (options.syntheticFixture === true),
    "v595-human-signoff-synthetic-binding",
  );
  return Object.freeze({
    identity,
    receiptSha256: receipt.receiptSha256,
    challengeSha256: receipt.decisionChallengeSha256,
    decisionSha256: receipt.decisionSha256,
  });
}

async function loadHumanInputs({ root, browserGatePath, syntheticFixture }) {
  const bundle = await loadCurrentV595Bundle(root, { requireBuilds: true });
  const browserGate = (await readJsonV595Formal(
    bundle.workspace,
    browserGatePath,
    "human-browser-gate",
  )).value;
  const stage = createV595HumanReviewStage(browserGate, {
    candidateDocument: bundle.candidate,
    expectedFullIdentity: bundle.identities.standalone,
    expectedLiteIdentity: bundle.identities.lite,
    authority: bundle.candidate.authority,
    syntheticFixture,
  });
  return Object.freeze({ bundle, browserGate, stage, challenge: stage.challenge });
}

export async function buildV595HumanChallengeOnly({
  root = process.cwd(),
  outputRoot = root,
  browserGatePath = "docs/release/v595/final-sealed-browser-gate-v595.json",
  stageOutputPath = "docs/release/v595/human-visual-signoff-stage-v595.json",
  challengeOutputPath = null,
  syntheticFixture = false,
} = {}) {
  const loaded = await loadHumanInputs({ root, browserGatePath, syntheticFixture });
  if (!syntheticFixture) {
    await atomicWriteJsonV595Formal(
      loaded.bundle.workspace,
      outputRoot,
      stageOutputPath,
      loaded.stage,
      "human-review-stage-output",
    );
    if (challengeOutputPath) await atomicWriteJsonV595Formal(
      loaded.bundle.workspace,
      outputRoot,
      challengeOutputPath,
      loaded.challenge,
      "human-challenge-output",
    );
  }
  return Object.freeze({
    stage: loaded.stage,
    challenge: loaded.challenge,
    challengeSha256: loaded.stage.challengeSha256,
    stageOutputPath: syntheticFixture ? null : stageOutputPath,
    challengeOutputPath: syntheticFixture ? null : challengeOutputPath,
    decisionGenerated: false,
  });
}

export async function buildV595HumanSignoff({
  root = process.cwd(),
  outputRoot = root,
  browserGatePath = "docs/release/v595/final-sealed-browser-gate-v595.json",
  decisionPath,
  stageOutputPath = "docs/release/v595/human-visual-signoff-stage-v595.json",
  outputPath = "docs/release/v595/human-visual-signoff-v595.json",
  syntheticFixture = false,
} = {}) {
  const loaded = await loadHumanInputs({ root, browserGatePath, syntheticFixture });
  if (!syntheticFixture) await atomicWriteJsonV595Formal(
    loaded.bundle.workspace,
    outputRoot,
    stageOutputPath,
    loaded.stage,
    "human-review-stage-output",
  );
  assertV595Formal(decisionPath, "v595-human-decision-required-after-stage-created");
  const decision = (await readJsonV595Formal(
    loaded.bundle.workspace,
    decisionPath,
    "human-decision",
  )).value;
  const validated = validateV595HumanDecision(decision, loaded.challenge, {
    syntheticFixture,
  });
  const identity = validateV595Identity(
    loaded.browserGate.candidate,
    loaded.bundle.identities.standalone,
    { deliveryTier: "standalone-full" },
  );
  const passes = Object.fromEntries(V595_HUMAN_REVIEW_PASSES.map((pass) => [pass, {
    humanVisualSignoff: "approved",
    reviewer: validated.reviewer,
    reviewedAt: decision.passes[pass].reviewedAt,
  }]));
  const unsigned = {
    version: V595_HUMAN_SIGNOFF_VERSION,
    generatedAt: validated.reviewedAt,
    reviewedAt: validated.reviewedAt,
    status: V595_HUMAN_SIGNOFF_STATUS,
    reviewer: validated.reviewer,
    statement: "The workspace owner approved all eight exact current-v595 visual pairs. The decision also binds the current 24x2 stellar, six ProductSceneFamily journey, and timelike Kerr reference envelopes. It grants no scientific, measured, GPU, radiative-transfer, GRMHD, promotion, or production authority.",
    candidate: identity,
    parentV594: { ...V595_PARENT_V594_IDENTITY, immutable: true },
    browserGate: await fileReceiptV595Formal(
      loaded.bundle.workspace,
      browserGatePath,
      "human-browser-gate",
    ),
    browserGateReceiptSha256: loaded.browserGate.receiptSha256,
    userDecision: await fileReceiptV595Formal(
      loaded.bundle.workspace,
      decisionPath,
      "human-decision",
    ),
    decisionChallenge: loaded.challenge,
    decisionChallengeSha256: validated.challengeSha256,
    decisionSha256: validated.decisionSha256,
    decisionProvenance: decision.provenance,
    decisionProvenanceMode: validated.provenanceMode,
    passes,
    signaturePassesApproved: V595_HUMAN_REVIEW_PASSES.length,
    approved: true,
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
    authority: { ...loaded.bundle.candidate.authority },
    synthetic: syntheticFixture,
  };
  const receipt = sealV595FormalDocument(unsigned);
  if (!syntheticFixture) await atomicWriteJsonV595Formal(
    loaded.bundle.workspace,
    outputRoot,
    outputPath,
    receipt,
    "human-signoff-output",
  );
  return receipt;
}

export function parseV595HumanArgs(argv) {
  const values = {};
  const valueArgs = new Set([
    "--browser-gate",
    "--decision-file",
    "--output",
    "--stage-output",
    "--challenge-output",
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--challenge-only") values.challengeOnly = true;
    else if (valueArgs.has(token)) values[token.slice(2)] = argv[++index];
    else throw new Error(`v595-human-argument:${token}`);
  }
  assertV595Formal(
    !values["challenge-output"] || values.challengeOnly === true,
    "v595-human-challenge-output-mode",
  );
  return values;
}

async function main() {
  const args = parseV595HumanArgs(process.argv.slice(2));
  if (args.challengeOnly) {
    const result = await buildV595HumanChallengeOnly({
      browserGatePath: args["browser-gate"],
      stageOutputPath: args["stage-output"],
      challengeOutputPath: args["challenge-output"],
    });
    process.stdout.write(`${JSON.stringify({
      status: result.stage.status,
      challengeSha256: result.challengeSha256,
      stageOutputPath: result.stageOutputPath,
      challengeOutputPath: result.challengeOutputPath,
      decisionGenerated: false,
    }, null, 2)}\n`);
    return;
  }
  const receipt = await buildV595HumanSignoff({
    browserGatePath: args["browser-gate"],
    decisionPath: args["decision-file"],
    stageOutputPath: args["stage-output"],
    outputPath: args.output,
  });
  process.stdout.write(`${JSON.stringify({
    status: receipt.status,
    reviewer: receipt.reviewer,
    approvedPairs: receipt.signaturePassesApproved,
    challengeSha256: receipt.decisionChallengeSha256,
    receiptSha256: receipt.receiptSha256,
  }, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}

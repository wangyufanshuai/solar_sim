import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  assertV596Authority,
  assertV596Formal,
  atomicWriteJsonV596Formal,
  canonicalShaV596Formal,
  fileReceiptV596Formal,
  loadCurrentV596Bundle,
  readJsonV596Formal,
  sameCanonicalV596Formal,
  sealV596FormalDocument,
  validateV596Identity,
  verifyV596FormalSeal,
  V596_FORMAL_PRODUCT_POINTER,
  V596_PARENT_V595_IDENTITY,
} from "./v596-formal-contract.mjs";
import {
  validateV596BrowserGate,
  V596_BROWSER_GATE_STATUS,
  V596_BROWSER_GATE_VERSION,
  V596_PRODUCT_SCENE_FAMILIES as V596_BROWSER_PRODUCT_SCENE_FAMILIES,
} from "./build-v596-final-sealed-browser-gate.mjs";
import {
  V596_EXACT_LANES,
  V596_EXACT_PAIR_DEFINITIONS,
  V596_EXACT_PASSES,
} from "./build-v596-current-lite-matrix.mjs";

export const V596_HUMAN_REVIEW_PASSES = V596_EXACT_PASSES;
export const V596_EXACT_AB_LANES = V596_EXACT_LANES;
export { V596_EXACT_PAIR_DEFINITIONS };
export const V596_PRODUCT_SCENE_FAMILIES = V596_BROWSER_PRODUCT_SCENE_FAMILIES;

export const V596_HUMAN_CHALLENGE_VERSION =
  "v596-human-visual-signoff-decision-challenge-v1";
export const V596_HUMAN_REVIEW_STAGE_VERSION =
  "v596-human-visual-signoff-review-stage-v1";
export const V596_HUMAN_REVIEW_STAGE_STATUS =
  "awaiting-workspace-owner-v596-eight-of-eight-decision";
export const V596_HUMAN_DECISION_VERSION = "v596-human-user-decision-v1";
export const V596_HUMAN_DECISION_VALUE = "approve-v596-eight-of-eight";
export const V596_HUMAN_SIGNOFF_VERSION =
  "v596-human-visual-signoff-dossier-v1";
export const V596_HUMAN_SIGNOFF_STATUS =
  "approved-v596-eight-pair-human-visual-signoff";
export const V596_HUMAN_DELEGATED_SCOPE =
  "v596-current-identity-human-decision-only";
export const V596_HUMAN_DELEGATED_STATEMENT =
  "workspace-owner-explicitly-authorized-codex-to-generate-the-current-v596-human-decision-artifact";

const SHA256_PATTERN = /^[0-9a-f]{64}$/;

function assertSha(value, label) {
  assertV596Formal(SHA256_PATTERN.test(value ?? ""), `v596-human-sha256:${label}`);
  return value;
}

function assertIsoTimestamp(value, label) {
  assertV596Formal(
    typeof value === "string" && Number.isFinite(Date.parse(value)),
    `v596-human-timestamp:${label}`,
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
  assertV596Formal(
    exact?.pairCount === V596_HUMAN_REVIEW_PASSES.length
      && exact?.frameCount === V596_HUMAN_REVIEW_PASSES.length * 2
      && sameCanonicalV596Formal(exact.passes, V596_HUMAN_REVIEW_PASSES)
      && sameCanonicalV596Formal(exact.lanes, V596_EXACT_AB_LANES)
      && sameCanonicalV596Formal(exact.pairs, V596_EXACT_PAIR_DEFINITIONS)
      && exact.visibleLeapBoundaryVerified === true,
    "v596-human-exact-ab-envelope",
  );
  assertSha(exact.stageReceiptSha256, "exact-stage");
  assertSha(exact.batchSha256, "exact-batch");

  const stellar = stellarMatrix(browserGate);
  assertV596Formal(
    stellar?.targetCount === 24
      && stellar?.modeCount === 2
      && stellar?.frameCount === 48,
    "v596-human-stellar-24x2-envelope",
  );
  assertSha(stellar.receiptSha256, "stellar-24x2-receipt");

  const families = familyMatrix(browserGate);
  assertV596Formal(
    families?.familyCount === V596_PRODUCT_SCENE_FAMILIES.length
      && sameCanonicalV596Formal(
        families.orderedFamilies,
        V596_PRODUCT_SCENE_FAMILIES,
      ),
    "v596-human-product-scene-family-envelope",
  );
  assertSha(families.receiptSha256, "product-scene-family-receipt");

  const desktop = browserGate?.supplemental?.realDesktopChrome;
  assertV596Formal(
    desktop?.status === "passed-supplemental-real-desktop-eligible"
      && desktop?.supplementalOnly === true
      && desktop?.formalEvidence === false
      && desktop?.promotion === "none"
      && desktop?.realDesktopEligible === true
      && desktop?.realMobileEligible === false,
    "v596-human-real-desktop-supplemental-boundary",
  );
  assertSha(
    desktop.receiptSha256 ?? desktop.receipt?.receiptSha256
      ?? desktop.receipt?.sha256,
    "real-desktop-receipt",
  );

  const mobile = browserGate?.supplemental?.physicalMobile;
  assertV596Formal(
    mobile?.status === "not-present-not-faked"
      && mobile?.evidence === null
      && mobile?.formalEvidence === false
      && mobile?.promotion === "none",
    "v596-human-physical-mobile-not-faked",
  );
  return Object.freeze({ exact, stellar, families, desktop, mobile });
}

function validateTimelikeCandidate(candidateDocument, browserGate) {
  const timelike = candidateDocument?.relativity?.timelikeKerr;
  assertV596Formal(
    timelike?.fixtureCount === 4
      && timelike?.analyticAnchorCount === 3
      && timelike?.referenceCandidateOnly === true
      && timelike?.formalEvidence === false
      && timelike?.promotion === "none",
    "v596-human-timelike-reference-boundary",
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
    assertV596Formal(
      boundary.referenceCandidateOnly === true
        && boundary.formalEvidence === false
        && boundary.promotion === "none"
        && boundary.admissionSha256 === timelike.admissionSha256
        && boundary.admissionReceiptSha256 === timelike.receiptSha256,
      "v596-human-browser-timelike-binding",
    );
  } else {
    assertV596Formal(
      browserGate?.boundaries?.timelikeKerrReferenceCandidateOnly === true,
      "v596-human-browser-timelike-boundary",
    );
  }
  return timelike;
}

export function validateV596HumanDecisionProvenance(provenance) {
  const independent = provenance?.createdBy === "workspace-owner"
      && provenance?.artifactOrigin === "independent-user-decision-input"
      && provenance?.agentGenerated === false
      && provenance?.explicitConfirmation === "APPROVE v596 8/8";
  const delegated = provenance?.createdBy === "codex-agent"
      && provenance?.artifactOrigin === "delegated-user-authorized-decision-input"
      && provenance?.agentGenerated === true
      && provenance?.authorization?.principal === "workspace-owner"
      && provenance?.authorization?.grant === "explicit-conversation-authorization"
      && provenance?.authorization?.scope === V596_HUMAN_DELEGATED_SCOPE
      && provenance?.authorization?.statement === V596_HUMAN_DELEGATED_STATEMENT;
  assertV596Formal(
    independent || delegated,
    "v596-human-decision-workspace-owner-provenance",
  );
  return independent
    ? "independent-workspace-owner-input"
    : "delegated-codex-generation";
}

export function createV596HumanChallenge(
  browserGate,
  {
    candidateDocument,
    expectedFullIdentity = null,
    expectedLiteIdentity = null,
    syntheticFixture = false,
  } = {},
) {
  verifyV596FormalSeal(browserGate, "receiptSha256", "human-browser-gate");
  assertV596Formal(
    browserGate.version === V596_BROWSER_GATE_VERSION
      && browserGate.status === V596_BROWSER_GATE_STATUS,
    "v596-human-browser-gate-contract",
  );
  assertV596Formal(
    browserGate.synthetic === (syntheticFixture === true),
    "v596-human-browser-gate-synthetic-binding",
  );
  assertV596Authority(browserGate.authority, "human-browser-gate");
  const validatedGate = validateV596BrowserGate(browserGate, {
    expectedFullIdentity,
    expectedLiteIdentity,
    expectedTimelikeKerr: candidateDocument?.relativity?.timelikeKerr,
    syntheticFixture,
  });
  const candidate = validatedGate.full;
  const evidence = requireCurrentEvidenceEnvelope(browserGate);
  const timelike = validateTimelikeCandidate(candidateDocument, browserGate);
  assertV596Formal(
    candidateDocument?.governance?.priorV595HumanDecisionInherited === false,
    "v596-human-prior-v595-decision-inheritance",
  );
  assertV596Formal(
    candidateDocument?.parentV595?.sourceManifestSha256
        === V596_PARENT_V595_IDENTITY.sourceManifestSha256
      && candidateDocument?.parentV595?.candidateManifestSha256
        === V596_PARENT_V595_IDENTITY.candidateManifestSha256
      && candidateDocument?.parentV595?.releaseDossierSha256
        === V596_PARENT_V595_IDENTITY.releaseDossierSha256
      && candidateDocument?.parentV595?.resealReceiptSha256
        === V596_PARENT_V595_IDENTITY.resealReceiptSha256,
    "v596-human-parent-v595-identity",
  );

  return Object.freeze({
    version: V596_HUMAN_CHALLENGE_VERSION,
    candidate: { ...candidate, formalProductPointer: V596_FORMAL_PRODUCT_POINTER },
    parentV595: { ...V596_PARENT_V595_IDENTITY, immutable: true },
    browserGateReceiptSha256: browserGate.receiptSha256,
    exactAb: {
      stageReceiptSha256: evidence.exact.stageReceiptSha256,
      batchSha256: evidence.exact.batchSha256,
      pairCount: evidence.exact.pairCount,
      frameCount: evidence.exact.frameCount,
      lanes: V596_EXACT_AB_LANES,
      passes: V596_HUMAN_REVIEW_PASSES,
      pairs: V596_EXACT_PAIR_DEFINITIONS,
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
      orderedFamilies: V596_PRODUCT_SCENE_FAMILIES,
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
    requiredPasses: V596_HUMAN_REVIEW_PASSES,
    priorV595HumanDecisionInherited: false,
  });
}

export function validateV596HumanDecision(decision, challenge, options = {}) {
  verifyV596FormalSeal(decision, "decisionSha256", "human-decision");
  assertV596Formal(
    decision.version === V596_HUMAN_DECISION_VERSION,
    "v596-human-decision-version",
  );
  assertV596Formal(
    decision.version !== "v595-human-user-decision-v1"
      && decision.version !== "v593-human-user-decision-v1",
    "v596-human-prior-decision-rejected",
  );
  assertV596Formal(
    decision.decision === V596_HUMAN_DECISION_VALUE
      && decision.approved === true,
    "v596-human-decision-explicit",
  );
  assertV596Formal(decision.reviewer === "workspace-owner", "v596-human-decision-reviewer");
  assertIsoTimestamp(decision.reviewedAt, "decision");
  assertV596Formal(
    decision.challengeSha256 === canonicalShaV596Formal(challenge),
    "v596-human-decision-challenge-replay-or-drift",
  );
  assertV596Formal(
    sameCanonicalV596Formal(Object.keys(decision.passes ?? {}), V596_HUMAN_REVIEW_PASSES),
    "v596-human-decision-pass-order",
  );
  for (const pass of V596_HUMAN_REVIEW_PASSES) {
    assertV596Formal(
      decision.passes[pass]?.decision === "approved",
      `v596-human-decision-pass:${pass}`,
    );
    assertIsoTimestamp(decision.passes[pass]?.reviewedAt, `pass:${pass}`);
  }
  const provenanceMode = validateV596HumanDecisionProvenance(decision.provenance);
  assertV596Formal(
    decision.priorV595HumanDecisionInherited === false,
    "v596-human-decision-prior-v595-inheritance",
  );
  if (options.syntheticFixture) {
    assertV596Formal(decision.fixture?.synthetic === true, "v596-human-decision-fixture-marker");
  } else {
    assertV596Formal(decision.fixture?.synthetic !== true, "v596-human-synthetic-decision-as-formal");
  }
  return Object.freeze({
    reviewer: decision.reviewer,
    reviewedAt: decision.reviewedAt,
    challengeSha256: decision.challengeSha256,
    decisionSha256: decision.decisionSha256,
    provenanceMode,
  });
}

export function createV596HumanReviewStage(
  browserGate,
  {
    candidateDocument,
    expectedFullIdentity = null,
    expectedLiteIdentity = null,
    authority,
    syntheticFixture = false,
  } = {},
) {
  const challenge = createV596HumanChallenge(browserGate, {
    candidateDocument,
    expectedFullIdentity,
    expectedLiteIdentity,
    syntheticFixture,
  });
  const unsigned = {
    version: V596_HUMAN_REVIEW_STAGE_VERSION,
    generatedAt: candidateDocument.generatedAt,
    status: V596_HUMAN_REVIEW_STAGE_STATUS,
    candidate: challenge.candidate,
    challenge,
    challengeSha256: canonicalShaV596Formal(challenge),
    decisionRequired: true,
    decisionGenerated: false,
    priorV595HumanDecisionInherited: false,
    policy: {
      workspaceOwnerDecisionRequired: true,
      exactEightOfEightRequired: true,
      currentIdentityOnly: true,
      automaticHumanApproval: false,
    },
    authority: { ...authority },
    synthetic: syntheticFixture,
  };
  assertV596Authority(unsigned.authority, "human-review-stage");
  return sealV596FormalDocument(unsigned);
}

export function validateV596HumanDecisionRawBinding({
  human,
  decision,
  challenge,
  syntheticFixture = false,
} = {}) {
  const validated = validateV596HumanDecision(decision, challenge, { syntheticFixture });
  assertV596Formal(
    sameCanonicalV596Formal(human?.decisionProvenance, decision.provenance),
    "v596-human-raw-provenance-drift",
  );
  assertV596Formal(
    human?.decisionProvenanceMode === validated.provenanceMode,
    "v596-human-raw-provenance-mode-drift",
  );
  assertV596Formal(
    human?.decisionSha256 === validated.decisionSha256
      && human?.decisionChallengeSha256 === validated.challengeSha256,
    "v596-human-raw-decision-seal-drift",
  );
  return validated;
}

export function validateV596HumanSignoff(receipt, expectedIdentity, options = {}) {
  verifyV596FormalSeal(receipt, "receiptSha256", "human-signoff");
  assertV596Formal(
    receipt.version === V596_HUMAN_SIGNOFF_VERSION
      && receipt.status === V596_HUMAN_SIGNOFF_STATUS,
    "v596-human-signoff-contract",
  );
  const identity = validateV596Identity(receipt.candidate, expectedIdentity, {
    deliveryTier: "standalone-full",
  });
  assertV596Formal(
    receipt.approved === true
      && receipt.signaturePassesApproved === V596_HUMAN_REVIEW_PASSES.length
      && receipt.reviewer === "workspace-owner",
    "v596-human-signoff-approval",
  );
  assertIsoTimestamp(receipt.reviewedAt, "signoff");
  assertV596Formal(
    sameCanonicalV596Formal(Object.keys(receipt.passes ?? {}), V596_HUMAN_REVIEW_PASSES),
    "v596-human-signoff-pass-order",
  );
  assertV596Formal(
    receipt.policy?.currentIdentityOnly === true
      && receipt.policy?.sameBuildBeforeAfter === true
      && receipt.policy?.noHistoricalScreenshotSubstitution === true
      && receipt.policy?.explicitDecisionArtifactRequired === true
      && receipt.policy?.priorV595DecisionRejected === true
      && receipt.policy?.priorV595HumanDecisionInherited === false
      && receipt.policy?.automaticHumanApproval === false
      && receipt.policy?.scientificPayloadWriteback === false
      && receipt.policy?.physicalMobileEvidenceFabricated === false,
    "v596-human-signoff-policy",
  );
  const provenanceMode = validateV596HumanDecisionProvenance(
    receipt.decisionProvenance,
  );
  assertV596Formal(
    receipt.decisionProvenanceMode === provenanceMode,
    "v596-human-signoff-provenance",
  );
  assertV596Authority(receipt.authority, "human-signoff");
  assertV596Formal(
    receipt.synthetic === (options.syntheticFixture === true),
    "v596-human-signoff-synthetic-binding",
  );
  return Object.freeze({
    identity,
    receiptSha256: receipt.receiptSha256,
    challengeSha256: receipt.decisionChallengeSha256,
    decisionSha256: receipt.decisionSha256,
  });
}

async function loadHumanInputs({ root, browserGatePath, syntheticFixture }) {
  const bundle = await loadCurrentV596Bundle(root, { requireBuilds: true });
  const browserGate = (await readJsonV596Formal(
    bundle.workspace,
    browserGatePath,
    "human-browser-gate",
  )).value;
  const stage = createV596HumanReviewStage(browserGate, {
    candidateDocument: bundle.candidate,
    expectedFullIdentity: bundle.identities.standalone,
    expectedLiteIdentity: bundle.identities.lite,
    authority: bundle.candidate.authority,
    syntheticFixture,
  });
  return Object.freeze({ bundle, browserGate, stage, challenge: stage.challenge });
}

export async function buildV596HumanChallengeOnly({
  root = process.cwd(),
  outputRoot = root,
  browserGatePath = "docs/release/v596/final-sealed-browser-gate-v596.json",
  stageOutputPath = "docs/release/v596/human-visual-signoff-stage-v596.json",
  challengeOutputPath = null,
  syntheticFixture = false,
} = {}) {
  const loaded = await loadHumanInputs({ root, browserGatePath, syntheticFixture });
  if (!syntheticFixture) {
    await atomicWriteJsonV596Formal(
      loaded.bundle.workspace,
      outputRoot,
      stageOutputPath,
      loaded.stage,
      "human-review-stage-output",
    );
    if (challengeOutputPath) await atomicWriteJsonV596Formal(
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

export async function buildV596HumanSignoff({
  root = process.cwd(),
  outputRoot = root,
  browserGatePath = "docs/release/v596/final-sealed-browser-gate-v596.json",
  decisionPath,
  stageOutputPath = "docs/release/v596/human-visual-signoff-stage-v596.json",
  outputPath = "docs/release/v596/human-visual-signoff-v596.json",
  syntheticFixture = false,
} = {}) {
  const loaded = await loadHumanInputs({ root, browserGatePath, syntheticFixture });
  if (!syntheticFixture) await atomicWriteJsonV596Formal(
    loaded.bundle.workspace,
    outputRoot,
    stageOutputPath,
    loaded.stage,
    "human-review-stage-output",
  );
  assertV596Formal(decisionPath, "v596-human-decision-required-after-stage-created");
  const decision = (await readJsonV596Formal(
    loaded.bundle.workspace,
    decisionPath,
    "human-decision",
  )).value;
  const validated = validateV596HumanDecision(decision, loaded.challenge, {
    syntheticFixture,
  });
  const identity = validateV596Identity(
    loaded.browserGate.candidate,
    loaded.bundle.identities.standalone,
    { deliveryTier: "standalone-full" },
  );
  const passes = Object.fromEntries(V596_HUMAN_REVIEW_PASSES.map((pass) => [pass, {
    humanVisualSignoff: "approved",
    reviewer: validated.reviewer,
    reviewedAt: decision.passes[pass].reviewedAt,
  }]));
  const unsigned = {
    version: V596_HUMAN_SIGNOFF_VERSION,
    generatedAt: validated.reviewedAt,
    reviewedAt: validated.reviewedAt,
    status: V596_HUMAN_SIGNOFF_STATUS,
    reviewer: validated.reviewer,
    statement: "The workspace owner approved all eight exact current-v596 visual pairs. The decision also binds the current 24x2 stellar, six ProductSceneFamily journey, and inherited timelike Kerr reference envelopes. It grants no scientific, measured, GPU, resolved-surface, observation-texture, radiative-transfer, GRMHD, promotion, or production authority.",
    candidate: identity,
    parentV595: { ...V596_PARENT_V595_IDENTITY, immutable: true },
    browserGate: await fileReceiptV596Formal(
      loaded.bundle.workspace,
      browserGatePath,
      "human-browser-gate",
    ),
    browserGateReceiptSha256: loaded.browserGate.receiptSha256,
    userDecision: await fileReceiptV596Formal(
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
    signaturePassesApproved: V596_HUMAN_REVIEW_PASSES.length,
    approved: true,
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
    authority: { ...loaded.bundle.candidate.authority },
    synthetic: syntheticFixture,
  };
  const receipt = sealV596FormalDocument(unsigned);
  if (!syntheticFixture) await atomicWriteJsonV596Formal(
    loaded.bundle.workspace,
    outputRoot,
    outputPath,
    receipt,
    "human-signoff-output",
  );
  return receipt;
}

export function parseV596HumanArgs(argv) {
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
    else throw new Error(`v596-human-argument:${token}`);
  }
  assertV596Formal(
    !values["challenge-output"] || values.challengeOnly === true,
    "v596-human-challenge-output-mode",
  );
  return values;
}

async function main() {
  const args = parseV596HumanArgs(process.argv.slice(2));
  if (args.challengeOnly) {
    const result = await buildV596HumanChallengeOnly({
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
  const receipt = await buildV596HumanSignoff({
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

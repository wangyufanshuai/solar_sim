import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  assertKnownFiniteZeroV596,
  assertKnownPositiveV596,
  assertV596Authority,
  assertV596EvidenceEnvelope,
  assertV596Formal,
  atomicWriteJsonV596Formal,
  fileReceiptV596Formal,
  loadCurrentV596Bundle,
  readJsonV596Formal,
  resolveInsideV596Workspace,
  sameCanonicalV596Formal,
  sealV596FormalDocument,
  validateV596Identity,
  verifyFileReceiptV596Formal,
  verifyV596FormalSeal,
} from "./v596-formal-contract.mjs";

export const V596_BROWSER_BATCH_VERSION = "v596-browser-evidence-batch-v1";
export const V596_BROWSER_BATCH_STATUS =
  "capture-complete-offline-audit-required-not-promoted";
export const V596_BROWSER_STAGE_VERSION = "v596-browser-evidence-stage-receipt-v1";
export const V596_BROWSER_STAGE_STATUS =
  "passed-current-v596-complete-dom-identity-deterministic-main-route-browser-evidence-human-review-pending-not-promoted";
export const V596_BROWSER_AUDITOR_VERSION = "v596-browser-evidence-auditor-v1";
export const V596_BROWSER_PNG_AUDITOR_VERSION = "v596-png-structure-auditor-v1";
export const V596_BROWSER_AUDITOR_CONTRACT_CASES = 40;
export const V596_ROOT_SCIENTIFIC_PROMOTION_STATUS =
  "shadow-retained-no-demonstrated-improvement";
export const V596_BROWSER_FRAME_COUNTS = Object.freeze({
  full: 13,
  lite: 8,
  "exact-ab": 16,
});
export const V596_EXACT_PASSES = Object.freeze([
  "hot-radiative",
  "blue-supergiant-wind",
  "solar-like-convective",
  "cool-convective",
  "red-giant-supergiant",
  "warm-radiative-convective",
  "rapid-rotator-gravity-darkened",
  "science-cinematic-boundary",
]);
export const V596_EXACT_LANES = Object.freeze([
  "baseline-v595-cinematic",
  "candidate-v596-cinematic",
  "candidate-v596-science",
]);
const V596_STELLAR_EXACT_PASSES = V596_EXACT_PASSES.slice(0, -1);
export const V596_EXACT_FRAME_DEFINITIONS = Object.freeze([
  ...V596_STELLAR_EXACT_PASSES.flatMap((pass) => [
    Object.freeze({
      id: `${pass}-v595-cinematic`,
      pass,
      lane: "baseline-v595-cinematic",
      mode: "cinematic",
    }),
    Object.freeze({
      id: `${pass}-v596-cinematic`,
      pass,
      lane: "candidate-v596-cinematic",
      mode: "cinematic",
    }),
  ]),
  Object.freeze({
    id: "science-cinematic-boundary-v596-science",
    pass: "science-cinematic-boundary",
    lane: "candidate-v596-science",
    mode: "science",
  }),
  Object.freeze({
    id: "science-cinematic-boundary-v596-cinematic",
    pass: "science-cinematic-boundary",
    lane: "candidate-v596-cinematic",
    mode: "cinematic",
  }),
]);
export const V596_EXACT_PAIR_DEFINITIONS = Object.freeze([
  ...V596_STELLAR_EXACT_PASSES.map((pass) => Object.freeze({
    id: pass,
    leftFrameId: `${pass}-v595-cinematic`,
    rightFrameId: `${pass}-v596-cinematic`,
  })),
  Object.freeze({
    id: "science-cinematic-boundary",
    leftFrameId: "science-cinematic-boundary-v596-science",
    rightFrameId: "science-cinematic-boundary-v596-cinematic",
  }),
]);
export const V596_MATRIX_PASSES = Object.freeze([
  "sun",
  "earth",
  "jupiter",
  "saturn",
  "stellar-archetypes",
  "deep-sky",
]);
export const V596_LITE_RECEIPT_VERSION = "v596-lite-browser-matrix-v1";
export const V596_LITE_RECEIPT_STATUS =
  "passed-current-v596-independent-8-frame-lite-automatic-gates";
export const V596_PARENT_V595_STANDALONE_PAGE_IDENTITY = Object.freeze({
  sourceManifestSha256:
    "e06febbe18cd65ad8d24bb618d09c93032ca7fa02d5d69e2d916ea3b8f802186",
  candidateManifestSha256:
    "332b5ce6a0b5f26a4f9553d44cb9d0eb8d5cc169ae3242b4cd83259b669abae1",
  buildId:
    "v595b-97bcb089ed86374e7c4440f20458652d20ce571479de7e4170e74d38a5193ca4",
  buildFingerprint:
    "97bcb089ed86374e7c4440f20458652d20ce571479de7e4170e74d38a5193ca4",
  deploymentId: "v595-e06febbe18cd-332b5ce6a0b5",
  formalProductPointer: "v263",
  deliveryTier: "standalone-full",
  bindingStatus: "bound",
});

const BROWSER_SUITES = new Set(["full", "lite", "exact-ab"]);
const REQUIRED_STAGE_GATES = Object.freeze([
  "completeDomIdentityAndBuildReceipt",
  "deterministicRuntimeAndCamera",
  "exactRuntimeConsumer",
  "exactVisibleLeapBoundary",
  "pngStructureAndDimensions",
  "networkRecomputed",
  "profileWrapperAndClosureSources",
  "stellarRosterAndArchetypes",
  "relativityModesAndTrajectory",
  "v596CurrentIdentityMarkers",
  "formalV263AndPromotionBlocked",
  "failClosedUnknownZero",
]);

function expectedTier(suite) {
  return suite === "lite" ? "vercel-lite" : "standalone-full";
}

function assertCurrentV596Path(root, value, label) {
  resolveInsideV596Workspace(root, value, label);
  const segments = value.split("/");
  assertV596Formal(
    !segments.some((segment) => /^v(?:593|594|595)(?:-|$)/.test(segment)),
    `v596-browser-historical-path:${label}`,
  );
}

function assertArtifactRecord(root, record, label) {
  assertV596Formal(
    record && typeof record === "object"
      && typeof record.path === "string"
      && Number.isSafeInteger(record.bytes) && record.bytes > 0
      && /^[0-9a-f]{64}$/.test(record.sha256 ?? ""),
    `v596-browser-artifact-record:${label}`,
  );
  assertCurrentV596Path(root, record.path, label);
}

function assertEvidenceEnvelope(document, syntheticFixture, label) {
  assertV596EvidenceEnvelope(document, { syntheticFixture });
  assertV596Formal(
    document.qualificationScope === (syntheticFixture
      ? "synthetic-test-only"
      : `formal-current-v596-browser-${document.suite}`),
    `v596-browser-qualification-scope:${label}`,
  );
}

function stageGatesPassed(stage) {
  const gates = stage.gates;
  return gates
    && REQUIRED_STAGE_GATES.every((field) => gates[field] === true)
    && gates.automaticHumanApproval === false
    && gates.priorV595HumanDecisionInherited === false;
}

function assertNetworkKnown(result) {
  const summary = result.observed?.network?.summary;
  assertKnownPositiveV596(summary?.totalRequests, `browser:${result.id}:network.requests`);
  assertKnownPositiveV596(summary?.totalResponses, `browser:${result.id}:network.responses`);
  assertKnownFiniteZeroV596(
    summary?.failedRequestCount,
    `browser:${result.id}:network.failed`,
  );
  assertKnownFiniteZeroV596(
    summary?.nonSuccessResponseCount,
    `browser:${result.id}:network.non-success`,
  );
  assertKnownFiniteZeroV596(
    summary?.externalRequestCount,
    `browser:${result.id}:network.external`,
  );
  assertV596Formal(
    summary?.overflow === false && summary?.paired === true,
    `v596-browser-network-pairing:${result.id}`,
  );
}

function validateV595BaselinePageIdentity(value, label) {
  const expected = V596_PARENT_V595_STANDALONE_PAGE_IDENTITY;
  assertV596Formal(
    value && typeof value === "object" && !Array.isArray(value),
    `v596-browser-v595-page-identity-shape:${label}`,
  );
  for (const field of [
    "sourceManifestSha256",
    "candidateManifestSha256",
    "buildId",
    "deploymentId",
    "formalProductPointer",
    "deliveryTier",
    "bindingStatus",
  ]) {
    assertV596Formal(
      value[field] === expected[field],
      `v596-browser-v595-page-identity:${label}:${field}`,
    );
  }
  if (value.buildFingerprint !== undefined) {
    assertV596Formal(
      value.buildFingerprint === expected.buildFingerprint,
      `v596-browser-v595-page-identity:${label}:buildFingerprint`,
    );
  }
  return Object.freeze({ ...expected });
}

function validateResultPageIdentity(result, definition, currentIdentity, suite) {
  assertV596Formal(
    definition?.id === result.id,
    `v596-browser-result-definition-order:${result.id}`,
  );
  const domIdentity = result.observed?.domIdentity;
  const pageIdentity = result.observed?.pageIdentity ?? domIdentity;
  if (suite === "exact-ab" && definition.lane === "baseline-v595-cinematic") {
    // The result DOM belongs to the current v596 evidence batch even when the
    // page captured for this lane is the immutable v595 baseline. Keep those
    // identities separate so the baseline cannot masquerade as the current
    // batch and the current batch cannot migrate into the baseline page slot.
    const dom = validateV596Identity(domIdentity, currentIdentity, {
      deliveryTier: expectedTier(suite),
    });
    validateV595BaselinePageIdentity(pageIdentity, `${result.id}:page`);
    assertV596Formal(
      !sameCanonicalV596Formal(domIdentity, pageIdentity),
      `v596-browser-v595-dom-page-identity-alias:${result.id}`,
    );
    return dom;
  }
  const dom = validateV596Identity(domIdentity, currentIdentity, {
    deliveryTier: expectedTier(suite),
  });
  validateV596Identity(pageIdentity, currentIdentity, {
    deliveryTier: expectedTier(suite),
  });
  assertV596Formal(
    sameCanonicalV596Formal(domIdentity, pageIdentity),
    `v596-browser-v596-dom-page-identity-drift:${result.id}`,
  );
  return dom;
}

function validateExactDefinitions(batch, stage) {
  assertV596Formal(
    sameCanonicalV596Formal(batch.exactAbPasses, V596_EXACT_PASSES)
      && sameCanonicalV596Formal(stage.matrix?.exactAbPasses, V596_EXACT_PASSES),
    "v596-browser-exact-pass-order",
  );
  assertV596Formal(
    sameCanonicalV596Formal(batch.exactAbLanes, V596_EXACT_LANES)
      && sameCanonicalV596Formal(stage.matrix?.exactAbLanes, V596_EXACT_LANES),
    "v596-browser-exact-lane-order",
  );
  assertV596Formal(
    sameCanonicalV596Formal(batch.exactAbPairs, V596_EXACT_PAIR_DEFINITIONS)
      && sameCanonicalV596Formal(
        stage.matrix?.exactAbPairs,
        V596_EXACT_PAIR_DEFINITIONS,
      ),
    "v596-browser-exact-pair-definitions",
  );
  assertV596Formal(
    sameCanonicalV596Formal(
      batch.frameDefinitions.map(({ id, pass, lane, mode }) => ({
        id,
        pass,
        lane,
        mode,
      })),
      V596_EXACT_FRAME_DEFINITIONS,
    ),
    "v596-browser-exact-frame-order",
  );
}

async function verifyCaptureArtifacts(root, batch) {
  for (const row of batch.results) {
    await verifyFileReceiptV596Formal(root, row.screenshot, `browser-png:${row.id}`);
    await verifyFileReceiptV596Formal(root, row.telemetry, `browser-telemetry:${row.id}`);
  }
}

export async function validateV596BrowserEvidence({
  root = process.cwd(),
  stage,
  batch,
  stagePath = null,
  batchPath = null,
  expectedIdentity,
  suite,
  syntheticFixture = false,
} = {}) {
  assertV596Formal(BROWSER_SUITES.has(suite), "v596-browser-suite");
  verifyV596FormalSeal(stage, "receiptSha256", `browser-stage:${suite}`);
  verifyV596FormalSeal(batch, "batchSha256", `browser-batch:${suite}`);
  assertV596Formal(
    stage.version === V596_BROWSER_STAGE_VERSION
      && stage.status === V596_BROWSER_STAGE_STATUS,
    "v596-browser-stage-contract",
  );
  assertV596Formal(
    batch.version === V596_BROWSER_BATCH_VERSION
      && batch.status === V596_BROWSER_BATCH_STATUS,
    "v596-browser-batch-contract",
  );
  assertV596Formal(
    stage.suite === suite && batch.suite === suite,
    "v596-browser-suite-binding",
  );
  assertEvidenceEnvelope(stage, syntheticFixture, "stage");
  assertEvidenceEnvelope(batch, syntheticFixture, "batch");

  const identity = validateV596Identity(stage.identity, expectedIdentity, {
    deliveryTier: expectedTier(suite),
  });
  validateV596Identity(batch.identity, identity, { deliveryTier: expectedTier(suite) });
  assertV596Formal(
    [stage.identity?.bindingStatus, stage.identity?.identityBindingStatus]
      .filter((value) => value !== undefined).every((value) => value === "bound")
      && [batch.identity?.bindingStatus, batch.identity?.identityBindingStatus]
        .filter((value) => value !== undefined).every((value) => value === "bound"),
    "v596-browser-identity-binding-status",
  );

  assertV596Formal(
    stage.tooling?.collectorVersion === V596_BROWSER_BATCH_VERSION
      && stage.tooling?.auditorVersion === V596_BROWSER_AUDITOR_VERSION
      && stage.tooling?.pngAuditorVersion === V596_BROWSER_PNG_AUDITOR_VERSION
      && stage.tooling?.auditorContractCaseCount === V596_BROWSER_AUDITOR_CONTRACT_CASES,
    "v596-browser-tooling-contract",
  );
  assertV596Formal(stageGatesPassed(stage), "v596-browser-stage-gates");
  assertV596Formal(
    Array.isArray(stage.errors) && stage.errors.length === 0,
    "v596-browser-stage-errors",
  );

  const frameCount = V596_BROWSER_FRAME_COUNTS[suite];
  assertV596Formal(
    stage.matrix?.expectedFrameCount === frameCount
      && stage.matrix?.auditedFrameCount === frameCount,
    "v596-browser-stage-frame-count",
  );
  assertV596Formal(
    Array.isArray(batch.frameDefinitions) && batch.frameDefinitions.length === frameCount,
    "v596-browser-frame-definitions",
  );
  assertV596Formal(
    Array.isArray(batch.results) && batch.results.length === frameCount,
    "v596-browser-result-count",
  );
  assertV596Formal(
    batch.results.every((row) => row.status === "captured-offline-audit-required"
      && Array.isArray(row.blockers) && row.blockers.length === 0),
    "v596-browser-results-not-clean",
  );
  assertV596Formal(
    Array.isArray(batch.prerequisiteBlockers) && batch.prerequisiteBlockers.length === 0,
    "v596-browser-prerequisite-blockers",
  );
  assertV596Formal(
    batch.boundaries?.formalProductPointer === "v263"
      && batch.boundaries?.priorV595IdentityReused === false
      && batch.boundaries?.priorV595HumanDecisionInherited === false
      && batch.boundaries?.priorChallengeReused === false
      && batch.boundaries?.automaticHumanApproval === false
      && batch.boundaries?.humanDecisionArtifactGenerated === false
      && batch.boundaries?.scientificPayloadMutationAllowed === false
      && batch.boundaries?.promotionAllowed === false
      && batch.boundaries?.unknownOrZeroCountsAsPass === false,
    "v596-browser-boundaries",
  );
  assertV596Formal(
    batch.evidenceIntegrity?.attestationAuthority === "none"
      && batch.evidenceIntegrity?.humanSignoffGate === "separate-not-collected",
    "v596-browser-no-attestation",
  );

  if (suite === "exact-ab") {
    validateExactDefinitions(batch, stage);
  } else {
    const passes = new Set(batch.frameDefinitions.map((row) => row.pass));
    assertV596Formal(
      V596_MATRIX_PASSES.every((pass) => passes.has(pass)),
      "v596-browser-six-pass-coverage",
    );
  }

  const expectedDelivery = suite === "lite"
    ? { profile: "vercel-lite", separated: true, sameBuild: false }
    : suite === "full"
      ? { profile: "standalone-full", separated: true, sameBuild: false }
      : { profile: "standalone-full", separated: false, sameBuild: true };
  assertV596Formal(
    batch.delivery?.expectedProfile === expectedDelivery.profile
      && batch.delivery?.fullLiteSeparated === expectedDelivery.separated
      && batch.delivery?.exactAbSameBuild === expectedDelivery.sameBuild,
    `v596-browser-${suite}-delivery`,
  );

  for (const [index, result] of batch.results.entries()) {
    assertArtifactRecord(root, result.screenshot, `screenshot:${result.id}`);
    assertArtifactRecord(root, result.telemetry, `telemetry:${result.id}`);
    assertNetworkKnown(result);
    assertV596Formal(
      result.screenshot.png?.complete === true
        && result.screenshot.png.width === (suite === "lite" ? 390 : 1440)
        && result.screenshot.png.height === (suite === "lite" ? 844 : 900),
      `v596-browser-png:${result.id}`,
    );
    const domIdentity = validateResultPageIdentity(
      result,
      batch.frameDefinitions[index],
      identity,
      suite,
    );
    assertV596Formal(
      domIdentity.formalProductPointer === "v263"
        && result.observed?.formalDefaultKernel === "legacy-eih-1pn"
        && result.observed?.rootPromotionStatus === V596_ROOT_SCIENTIFIC_PROMOTION_STATUS
        && result.observed?.canvasCount === 1
        && Array.isArray(result.observed?.errors) && result.observed.errors.length === 0,
      `v596-browser-runtime-boundary:${result.id}`,
    );
  }

  if (stagePath && batchPath) {
    assertCurrentV596Path(root, stagePath, `stage:${suite}`);
    assertCurrentV596Path(root, batchPath, `batch:${suite}`);
    const observedBatch = await fileReceiptV596Formal(root, batchPath, `browser-batch:${suite}`);
    assertV596Formal(
      stage.batch?.path === observedBatch.path
        && stage.batch?.fileSha256 === observedBatch.sha256
        && stage.batch?.batchSha256 === batch.batchSha256,
      "v596-browser-stage-batch-byte-binding",
    );
    await verifyCaptureArtifacts(root, batch);
  } else {
    assertV596Formal(!stagePath && !batchPath, "v596-browser-partial-path-binding");
  }

  return Object.freeze({
    identity,
    frameCount,
    stageReceiptSha256: stage.receiptSha256,
    batchSha256: batch.batchSha256,
  });
}

export function validateV596LiteReceipt(
  receipt,
  expectedIdentity = null,
  { syntheticFixture = false } = {},
) {
  verifyV596FormalSeal(receipt, "receiptSha256", "lite-receipt");
  assertV596Formal(
    receipt.version === V596_LITE_RECEIPT_VERSION
      && receipt.status === V596_LITE_RECEIPT_STATUS,
    "v596-lite-receipt-contract",
  );
  assertV596Formal(receipt.synthetic === syntheticFixture, "v596-lite-fixture-binding");
  const identity = validateV596Identity(receipt.candidate, expectedIdentity, {
    deliveryTier: "vercel-lite",
  });
  assertV596Formal(
    receipt.frameCount === V596_BROWSER_FRAME_COUNTS.lite
      && receipt.deliverySeparation === "independent-vercel-lite-build-and-evidence"
      && receipt.priorV595HumanDecisionInherited === false,
    "v596-lite-receipt-gates",
  );
  assertV596Authority(receipt.authority, "lite-receipt");
  return Object.freeze({ identity, receiptSha256: receipt.receiptSha256 });
}

export async function buildV596LiteMatrix({
  root = process.cwd(),
  outputRoot = root,
  stagePath,
  batchPath,
  outputPath = "docs/release/v596/lite-browser-matrix-v596.json",
  syntheticFixture = false,
} = {}) {
  assertV596Formal(stagePath && batchPath, "v596-lite-inputs-required");
  const bundle = await loadCurrentV596Bundle(root, { requireBuilds: true });
  const [stage, batch] = await Promise.all([
    readJsonV596Formal(bundle.workspace, stagePath, "lite-stage"),
    readJsonV596Formal(bundle.workspace, batchPath, "lite-batch"),
  ]);
  const validated = await validateV596BrowserEvidence({
    root: bundle.workspace,
    stage: stage.value,
    batch: batch.value,
    stagePath,
    batchPath,
    expectedIdentity: bundle.identities.lite,
    suite: "lite",
    syntheticFixture,
  });
  assertV596Formal(
    validated.identity.buildId !== bundle.identities.standalone.buildId,
    "v596-lite-full-build-alias",
  );
  assertV596Authority(bundle.candidate.authority, "candidate");
  const receipt = sealV596FormalDocument({
    version: V596_LITE_RECEIPT_VERSION,
    generatedAt: stage.value.auditedAt ?? bundle.source.generatedAt,
    status: V596_LITE_RECEIPT_STATUS,
    candidate: validated.identity,
    evidence: {
      stage: await fileReceiptV596Formal(bundle.workspace, stagePath, "lite-stage"),
      batch: await fileReceiptV596Formal(bundle.workspace, batchPath, "lite-batch"),
    },
    stageReceiptSha256: validated.stageReceiptSha256,
    batchSha256: validated.batchSha256,
    frameCount: validated.frameCount,
    deliverySeparation: "independent-vercel-lite-build-and-evidence",
    priorV595HumanDecisionInherited: false,
    authority: { ...bundle.candidate.authority },
    synthetic: syntheticFixture,
  });
  validateV596LiteReceipt(receipt, bundle.identities.lite, { syntheticFixture });
  if (!syntheticFixture) {
    await atomicWriteJsonV596Formal(
      bundle.workspace,
      outputRoot,
      outputPath,
      receipt,
      "lite-output",
    );
  }
  return receipt;
}

export function parseV596LiteArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (new Set(["--stage", "--batch", "--output", "--validate-fixture"]).has(token)) {
      values[token.slice(2)] = argv[++index];
    } else {
      throw new Error(`v596-lite-argument:${token}`);
    }
  }
  if (values["validate-fixture"]) {
    const parts = values["validate-fixture"].split(",");
    assertV596Formal(
      parts.length === 2 && !values.stage && !values.batch,
      "v596-lite-fixture-format",
    );
    [values.stage, values.batch] = parts;
    values.syntheticFixture = true;
  }
  assertV596Formal(values.stage && values.batch, "v596-lite-inputs-required");
  for (const [label, value] of Object.entries({ stage: values.stage, batch: values.batch })) {
    resolveInsideV596Workspace(process.cwd(), value, `lite-arg:${label}`);
  }
  if (values.output) resolveInsideV596Workspace(process.cwd(), values.output, "lite-arg:output");
  return values;
}

async function main() {
  const args = parseV596LiteArgs(process.argv.slice(2));
  const receipt = await buildV596LiteMatrix({
    stagePath: args.stage,
    batchPath: args.batch,
    outputPath: args.output,
    syntheticFixture: args.syntheticFixture === true,
  });
  process.stdout.write(`${JSON.stringify({
    status: receipt.status,
    frameCount: receipt.frameCount,
    buildId: receipt.candidate.buildId,
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

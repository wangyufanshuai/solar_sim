import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  assertKnownFiniteZeroV595,
  assertKnownPositiveV595,
  assertV595Authority,
  assertV595EvidenceEnvelope,
  assertV595Formal,
  atomicWriteJsonV595Formal,
  fileReceiptV595Formal,
  loadCurrentV595Bundle,
  readJsonV595Formal,
  resolveInsideV595Workspace,
  sameCanonicalV595Formal,
  sealV595FormalDocument,
  validateV595Identity,
  verifyFileReceiptV595Formal,
  verifyV595FormalSeal,
} from "./v595-formal-contract.mjs";

export const V595_BROWSER_BATCH_VERSION = "v595-browser-evidence-batch-v1";
export const V595_BROWSER_BATCH_STATUS =
  "capture-complete-offline-audit-required-not-promoted";
export const V595_BROWSER_STAGE_VERSION = "v595-browser-evidence-stage-receipt-v1";
export const V595_BROWSER_STAGE_STATUS =
  "passed-current-v595-complete-dom-identity-deterministic-main-route-browser-evidence-human-review-pending-not-promoted";
export const V595_BROWSER_AUDITOR_VERSION = "v595-browser-evidence-auditor-v1";
export const V595_BROWSER_PNG_AUDITOR_VERSION = "v595-png-structure-auditor-v1";
export const V595_BROWSER_AUDITOR_CONTRACT_CASES = 40;
export const V595_ROOT_SCIENTIFIC_PROMOTION_STATUS =
  "shadow-retained-no-demonstrated-improvement";
export const V595_BROWSER_FRAME_COUNTS = Object.freeze({
  full: 13,
  lite: 8,
  "exact-ab": 16,
});
export const V595_EXACT_PASSES = Object.freeze([
  "hot-radiative",
  "blue-supergiant-wind",
  "solar-like-convective",
  "cool-convective",
  "red-giant-supergiant",
  "warm-radiative-convective",
  "rapid-rotator-gravity-darkened",
  "relativity-workbench",
]);
export const V595_EXACT_LANES = Object.freeze([
  "baseline-v594",
  "candidate-v595",
]);
export const V595_MATRIX_PASSES = Object.freeze([
  "sun",
  "earth",
  "jupiter",
  "saturn",
  "stellar-archetypes",
  "deep-sky",
]);
export const V595_LITE_RECEIPT_VERSION = "v595-lite-browser-matrix-v1";
export const V595_LITE_RECEIPT_STATUS =
  "passed-current-v595-independent-8-frame-lite-automatic-gates";

const BROWSER_SUITES = new Set(["full", "lite", "exact-ab"]);
const REQUIRED_STAGE_GATES = Object.freeze([
  "completeDomIdentityAndBuildReceipt",
  "deterministicRuntimeAndCamera",
  "exactRuntimeConsumer",
  "exactRelativityObservationMarker",
  "pngStructureAndDimensions",
  "networkRecomputed",
  "profileWrapperAndClosureSources",
  "stellarRosterAndArchetypes",
  "relativityModesAndTrajectory",
  "v595CurrentIdentityMarkers",
  "formalV263AndPromotionBlocked",
  "failClosedUnknownZero",
]);

function expectedTier(suite) {
  return suite === "lite" ? "vercel-lite" : "standalone-full";
}

function assertCurrentV595Path(root, value, label) {
  resolveInsideV595Workspace(root, value, label);
  const segments = value.split("/");
  assertV595Formal(
    !segments.some((segment) => /^v(?:593|594)(?:-|$)/.test(segment)),
    `v595-browser-historical-path:${label}`,
  );
}

function assertArtifactRecord(root, record, label) {
  assertV595Formal(
    record && typeof record === "object"
      && typeof record.path === "string"
      && Number.isSafeInteger(record.bytes) && record.bytes > 0
      && /^[0-9a-f]{64}$/.test(record.sha256 ?? ""),
    `v595-browser-artifact-record:${label}`,
  );
  assertCurrentV595Path(root, record.path, label);
}

function assertEvidenceEnvelope(document, syntheticFixture, label) {
  assertV595EvidenceEnvelope(document, { syntheticFixture });
  assertV595Formal(
    document.qualificationScope === (syntheticFixture
      ? "synthetic-test-only"
      : `formal-current-v595-browser-${document.suite}`),
    `v595-browser-qualification-scope:${label}`,
  );
}

function stageGatesPassed(stage) {
  const gates = stage.gates;
  return gates
    && REQUIRED_STAGE_GATES.every((field) => gates[field] === true)
    && gates.automaticHumanApproval === false
    && gates.priorV594HumanDecisionInherited === false;
}

function assertNetworkKnown(result) {
  const summary = result.observed?.network?.summary;
  assertKnownPositiveV595(summary?.totalRequests, `browser:${result.id}:network.requests`);
  assertKnownPositiveV595(summary?.totalResponses, `browser:${result.id}:network.responses`);
  assertKnownFiniteZeroV595(
    summary?.failedRequestCount,
    `browser:${result.id}:network.failed`,
  );
  assertKnownFiniteZeroV595(
    summary?.nonSuccessResponseCount,
    `browser:${result.id}:network.non-success`,
  );
  assertKnownFiniteZeroV595(
    summary?.externalRequestCount,
    `browser:${result.id}:network.external`,
  );
  assertV595Formal(
    summary?.overflow === false && summary?.paired === true,
    `v595-browser-network-pairing:${result.id}`,
  );
}

function validateExactDefinitions(batch, stage) {
  assertV595Formal(
    sameCanonicalV595Formal(batch.exactAbPasses, V595_EXACT_PASSES)
      && sameCanonicalV595Formal(stage.matrix?.exactAbPasses, V595_EXACT_PASSES),
    "v595-browser-exact-pass-order",
  );
  assertV595Formal(
    sameCanonicalV595Formal(batch.exactAbLanes, V595_EXACT_LANES)
      && sameCanonicalV595Formal(stage.matrix?.exactAbLanes, V595_EXACT_LANES),
    "v595-browser-exact-lane-order",
  );
  const expected = V595_EXACT_PASSES.flatMap((pass) => (
    V595_EXACT_LANES.map((lane) => ({ pass, lane }))
  ));
  assertV595Formal(
    batch.frameDefinitions.every((row, index) => (
      row.pass === expected[index].pass && row.lane === expected[index].lane
    )),
    "v595-browser-exact-frame-order",
  );
}

async function verifyCaptureArtifacts(root, batch) {
  for (const row of batch.results) {
    await verifyFileReceiptV595Formal(root, row.screenshot, `browser-png:${row.id}`);
    await verifyFileReceiptV595Formal(root, row.telemetry, `browser-telemetry:${row.id}`);
  }
}

export async function validateV595BrowserEvidence({
  root = process.cwd(),
  stage,
  batch,
  stagePath = null,
  batchPath = null,
  expectedIdentity,
  suite,
  syntheticFixture = false,
} = {}) {
  assertV595Formal(BROWSER_SUITES.has(suite), "v595-browser-suite");
  verifyV595FormalSeal(stage, "receiptSha256", `browser-stage:${suite}`);
  verifyV595FormalSeal(batch, "batchSha256", `browser-batch:${suite}`);
  assertV595Formal(
    stage.version === V595_BROWSER_STAGE_VERSION
      && stage.status === V595_BROWSER_STAGE_STATUS,
    "v595-browser-stage-contract",
  );
  assertV595Formal(
    batch.version === V595_BROWSER_BATCH_VERSION
      && batch.status === V595_BROWSER_BATCH_STATUS,
    "v595-browser-batch-contract",
  );
  assertV595Formal(
    stage.suite === suite && batch.suite === suite,
    "v595-browser-suite-binding",
  );
  assertEvidenceEnvelope(stage, syntheticFixture, "stage");
  assertEvidenceEnvelope(batch, syntheticFixture, "batch");

  const identity = validateV595Identity(stage.identity, expectedIdentity, {
    deliveryTier: expectedTier(suite),
  });
  validateV595Identity(batch.identity, identity, { deliveryTier: expectedTier(suite) });
  assertV595Formal(
    [stage.identity?.bindingStatus, stage.identity?.identityBindingStatus]
      .filter((value) => value !== undefined).every((value) => value === "bound")
      && [batch.identity?.bindingStatus, batch.identity?.identityBindingStatus]
        .filter((value) => value !== undefined).every((value) => value === "bound"),
    "v595-browser-identity-binding-status",
  );

  assertV595Formal(
    stage.tooling?.collectorVersion === V595_BROWSER_BATCH_VERSION
      && stage.tooling?.auditorVersion === V595_BROWSER_AUDITOR_VERSION
      && stage.tooling?.pngAuditorVersion === V595_BROWSER_PNG_AUDITOR_VERSION
      && stage.tooling?.auditorContractCaseCount === V595_BROWSER_AUDITOR_CONTRACT_CASES,
    "v595-browser-tooling-contract",
  );
  assertV595Formal(stageGatesPassed(stage), "v595-browser-stage-gates");
  assertV595Formal(
    Array.isArray(stage.errors) && stage.errors.length === 0,
    "v595-browser-stage-errors",
  );

  const frameCount = V595_BROWSER_FRAME_COUNTS[suite];
  assertV595Formal(
    stage.matrix?.expectedFrameCount === frameCount
      && stage.matrix?.auditedFrameCount === frameCount,
    "v595-browser-stage-frame-count",
  );
  assertV595Formal(
    Array.isArray(batch.frameDefinitions) && batch.frameDefinitions.length === frameCount,
    "v595-browser-frame-definitions",
  );
  assertV595Formal(
    Array.isArray(batch.results) && batch.results.length === frameCount,
    "v595-browser-result-count",
  );
  assertV595Formal(
    batch.results.every((row) => row.status === "captured-offline-audit-required"
      && Array.isArray(row.blockers) && row.blockers.length === 0),
    "v595-browser-results-not-clean",
  );
  assertV595Formal(
    Array.isArray(batch.prerequisiteBlockers) && batch.prerequisiteBlockers.length === 0,
    "v595-browser-prerequisite-blockers",
  );
  assertV595Formal(
    batch.boundaries?.formalProductPointer === "v263"
      && batch.boundaries?.priorV594IdentityReused === false
      && batch.boundaries?.priorV594HumanDecisionInherited === false
      && batch.boundaries?.priorChallengeReused === false
      && batch.boundaries?.automaticHumanApproval === false
      && batch.boundaries?.humanDecisionArtifactGenerated === false
      && batch.boundaries?.scientificPayloadMutationAllowed === false
      && batch.boundaries?.promotionAllowed === false
      && batch.boundaries?.unknownOrZeroCountsAsPass === false,
    "v595-browser-boundaries",
  );
  assertV595Formal(
    batch.evidenceIntegrity?.attestationAuthority === "none"
      && batch.evidenceIntegrity?.humanSignoffGate === "separate-not-collected",
    "v595-browser-no-attestation",
  );

  if (suite === "exact-ab") {
    validateExactDefinitions(batch, stage);
  } else {
    const passes = new Set(batch.frameDefinitions.map((row) => row.pass));
    assertV595Formal(
      V595_MATRIX_PASSES.every((pass) => passes.has(pass)),
      "v595-browser-six-pass-coverage",
    );
  }

  const expectedDelivery = suite === "lite"
    ? { profile: "vercel-lite", separated: true, sameBuild: false }
    : suite === "full"
      ? { profile: "standalone-full", separated: true, sameBuild: false }
      : { profile: "standalone-full", separated: false, sameBuild: true };
  assertV595Formal(
    batch.delivery?.expectedProfile === expectedDelivery.profile
      && batch.delivery?.fullLiteSeparated === expectedDelivery.separated
      && batch.delivery?.exactAbSameBuild === expectedDelivery.sameBuild,
    `v595-browser-${suite}-delivery`,
  );

  for (const result of batch.results) {
    assertArtifactRecord(root, result.screenshot, `screenshot:${result.id}`);
    assertArtifactRecord(root, result.telemetry, `telemetry:${result.id}`);
    assertNetworkKnown(result);
    assertV595Formal(
      result.screenshot.png?.complete === true
        && result.screenshot.png.width === (suite === "lite" ? 390 : 1440)
        && result.screenshot.png.height === (suite === "lite" ? 844 : 900),
      `v595-browser-png:${result.id}`,
    );
    const domIdentity = validateV595Identity(result.observed?.domIdentity, identity, {
      deliveryTier: expectedTier(suite),
    });
    assertV595Formal(
      domIdentity.formalProductPointer === "v263"
        && result.observed?.formalDefaultKernel === "legacy-eih-1pn"
        && result.observed?.rootPromotionStatus === V595_ROOT_SCIENTIFIC_PROMOTION_STATUS
        && result.observed?.canvasCount === 1
        && Array.isArray(result.observed?.errors) && result.observed.errors.length === 0,
      `v595-browser-runtime-boundary:${result.id}`,
    );
  }

  if (stagePath && batchPath) {
    assertCurrentV595Path(root, stagePath, `stage:${suite}`);
    assertCurrentV595Path(root, batchPath, `batch:${suite}`);
    const observedBatch = await fileReceiptV595Formal(root, batchPath, `browser-batch:${suite}`);
    assertV595Formal(
      stage.batch?.path === observedBatch.path
        && stage.batch?.fileSha256 === observedBatch.sha256
        && stage.batch?.batchSha256 === batch.batchSha256,
      "v595-browser-stage-batch-byte-binding",
    );
    await verifyCaptureArtifacts(root, batch);
  } else {
    assertV595Formal(!stagePath && !batchPath, "v595-browser-partial-path-binding");
  }

  return Object.freeze({
    identity,
    frameCount,
    stageReceiptSha256: stage.receiptSha256,
    batchSha256: batch.batchSha256,
  });
}

export function validateV595LiteReceipt(
  receipt,
  expectedIdentity = null,
  { syntheticFixture = false } = {},
) {
  verifyV595FormalSeal(receipt, "receiptSha256", "lite-receipt");
  assertV595Formal(
    receipt.version === V595_LITE_RECEIPT_VERSION
      && receipt.status === V595_LITE_RECEIPT_STATUS,
    "v595-lite-receipt-contract",
  );
  assertV595Formal(receipt.synthetic === syntheticFixture, "v595-lite-fixture-binding");
  const identity = validateV595Identity(receipt.candidate, expectedIdentity, {
    deliveryTier: "vercel-lite",
  });
  assertV595Formal(
    receipt.frameCount === V595_BROWSER_FRAME_COUNTS.lite
      && receipt.deliverySeparation === "independent-vercel-lite-build-and-evidence"
      && receipt.priorV594HumanDecisionInherited === false,
    "v595-lite-receipt-gates",
  );
  assertV595Authority(receipt.authority, "lite-receipt");
  return Object.freeze({ identity, receiptSha256: receipt.receiptSha256 });
}

export async function buildV595LiteMatrix({
  root = process.cwd(),
  outputRoot = root,
  stagePath,
  batchPath,
  outputPath = "docs/release/v595/lite-browser-matrix-v595.json",
  syntheticFixture = false,
} = {}) {
  assertV595Formal(stagePath && batchPath, "v595-lite-inputs-required");
  const bundle = await loadCurrentV595Bundle(root, { requireBuilds: true });
  const [stage, batch] = await Promise.all([
    readJsonV595Formal(bundle.workspace, stagePath, "lite-stage"),
    readJsonV595Formal(bundle.workspace, batchPath, "lite-batch"),
  ]);
  const validated = await validateV595BrowserEvidence({
    root: bundle.workspace,
    stage: stage.value,
    batch: batch.value,
    stagePath,
    batchPath,
    expectedIdentity: bundle.identities.lite,
    suite: "lite",
    syntheticFixture,
  });
  assertV595Formal(
    validated.identity.buildId !== bundle.identities.standalone.buildId,
    "v595-lite-full-build-alias",
  );
  assertV595Authority(bundle.candidate.authority, "candidate");
  const receipt = sealV595FormalDocument({
    version: V595_LITE_RECEIPT_VERSION,
    generatedAt: stage.value.auditedAt ?? bundle.source.generatedAt,
    status: V595_LITE_RECEIPT_STATUS,
    candidate: validated.identity,
    evidence: {
      stage: await fileReceiptV595Formal(bundle.workspace, stagePath, "lite-stage"),
      batch: await fileReceiptV595Formal(bundle.workspace, batchPath, "lite-batch"),
    },
    stageReceiptSha256: validated.stageReceiptSha256,
    batchSha256: validated.batchSha256,
    frameCount: validated.frameCount,
    deliverySeparation: "independent-vercel-lite-build-and-evidence",
    priorV594HumanDecisionInherited: false,
    authority: { ...bundle.candidate.authority },
    synthetic: syntheticFixture,
  });
  validateV595LiteReceipt(receipt, bundle.identities.lite, { syntheticFixture });
  if (!syntheticFixture) {
    await atomicWriteJsonV595Formal(
      bundle.workspace,
      outputRoot,
      outputPath,
      receipt,
      "lite-output",
    );
  }
  return receipt;
}

export function parseV595LiteArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (new Set(["--stage", "--batch", "--output", "--validate-fixture"]).has(token)) {
      values[token.slice(2)] = argv[++index];
    } else {
      throw new Error(`v595-lite-argument:${token}`);
    }
  }
  if (values["validate-fixture"]) {
    const parts = values["validate-fixture"].split(",");
    assertV595Formal(
      parts.length === 2 && !values.stage && !values.batch,
      "v595-lite-fixture-format",
    );
    [values.stage, values.batch] = parts;
    values.syntheticFixture = true;
  }
  assertV595Formal(values.stage && values.batch, "v595-lite-inputs-required");
  for (const [label, value] of Object.entries({ stage: values.stage, batch: values.batch })) {
    resolveInsideV595Workspace(process.cwd(), value, `lite-arg:${label}`);
  }
  if (values.output) resolveInsideV595Workspace(process.cwd(), values.output, "lite-arg:output");
  return values;
}

async function main() {
  const args = parseV595LiteArgs(process.argv.slice(2));
  const receipt = await buildV595LiteMatrix({
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

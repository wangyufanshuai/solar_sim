import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  assertKnownPositiveV594,
  assertV594,
  atomicWriteJsonV594,
  fileReceiptV594,
  loadCurrentV594Bundle,
  readJsonV594,
  resolveInsideV594Workspace,
  resolveV594OutputRoot,
  sealV594Document,
  sameCanonicalV594,
  sha256V594Closure,
  validateV594Identity,
  verifyFileReceiptV594,
  verifyV594Seal,
} from "./build-v594-current-source-lifecycle.mjs";
import {
  V594_BROWSER_AUDITOR_CONTRACT_CASES,
  V594_BROWSER_AUDITOR_VERSION,
  V594_BROWSER_BATCH_STATUS,
  V594_BROWSER_BATCH_VERSION,
  V594_BROWSER_PNG_AUDITOR_VERSION,
  V594_ROOT_SCIENTIFIC_PROMOTION_STATUS,
  V594_BROWSER_STAGE_STATUS,
  V594_BROWSER_STAGE_VERSION,
} from "../tmp/v594-browser-evidence-contract.mjs";

export {
  V594_BROWSER_AUDITOR_CONTRACT_CASES,
  V594_BROWSER_AUDITOR_VERSION,
  V594_BROWSER_BATCH_STATUS,
  V594_BROWSER_BATCH_VERSION,
  V594_BROWSER_PNG_AUDITOR_VERSION,
  V594_ROOT_SCIENTIFIC_PROMOTION_STATUS,
  V594_BROWSER_STAGE_STATUS,
  V594_BROWSER_STAGE_VERSION,
};
export const V594_BROWSER_FRAME_COUNTS = Object.freeze({ full: 13, lite: 8, "exact-ab": 16 });
export const V594_EXACT_PASSES = Object.freeze([
  "hot-radiative",
  "blue-supergiant-wind",
  "solar-like-convective",
  "cool-convective",
  "red-giant-supergiant",
  "warm-radiative-convective",
  "rapid-rotator-gravity-darkened",
  "relativity-workbench",
]);
export const V594_MATRIX_PASSES = Object.freeze([
  "sun",
  "earth",
  "jupiter",
  "saturn",
  "stellar-archetypes",
  "deep-sky",
]);
export const V594_LITE_RECEIPT_VERSION = "v594-lite-browser-matrix-v1";
export const V594_LITE_RECEIPT_STATUS =
  "passed-current-v594-independent-8-frame-lite-automatic-gates";

function expectedTier(suite) {
  return suite === "lite" ? "vercel-lite" : "standalone-full";
}

function stageGatesPassed(stage) {
  const gates = stage.gates;
  const required = [
    "completeDomIdentityAndBuildReceipt",
    "deterministicRuntimeAndCamera",
    "exactRuntimeConsumer",
    "pngStructureAndDimensions",
    "networkRecomputed",
    "profileWrapperAndClosureSources",
    "stellarRosterAndArchetypes",
    "relativityModesAndTrajectory",
    "formalV263AndPromotionBlocked",
    "failClosedUnknownZero",
  ];
  return gates && required.every((field) => gates[field] === true)
    && gates.automaticHumanApproval === false;
}

async function verifyCaptureArtifacts(root, batch) {
  for (const row of batch.results) {
    await verifyFileReceiptV594(root, row.screenshot, `browser-png:${row.id}`);
    await verifyFileReceiptV594(root, row.telemetry, `browser-telemetry:${row.id}`);
  }
}

function assertNetworkKnown(result) {
  const summary = result.observed?.network?.summary;
  assertKnownPositiveV594(summary?.totalRequests, `browser:${result.id}:network.requests`);
  assertKnownPositiveV594(summary?.totalResponses, `browser:${result.id}:network.responses`);
  assertV594(summary.failedRequestCount === 0 && summary.nonSuccessResponseCount === 0
    && summary.externalRequestCount === 0 && summary.overflow === false,
  `v594-browser-network:${result.id}`);
}

export async function validateV594BrowserEvidence({
  root = process.cwd(),
  stage,
  batch,
  stagePath = null,
  batchPath = null,
  expectedIdentity,
  suite,
  syntheticFixture = false,
} = {}) {
  assertV594(new Set(["full", "lite", "exact-ab"]).has(suite), "v594-browser-suite");
  verifyV594Seal(stage, "receiptSha256", `browser-stage:${suite}`);
  verifyV594Seal(batch, "batchSha256", `browser-batch:${suite}`);
  assertV594(stage.version === V594_BROWSER_STAGE_VERSION, "v594-browser-stage-version");
  assertV594(stage.status === V594_BROWSER_STAGE_STATUS, "v594-browser-stage-status");
  assertV594(batch.version === V594_BROWSER_BATCH_VERSION, "v594-browser-batch-version");
  assertV594(batch.status === V594_BROWSER_BATCH_STATUS, "v594-browser-batch-status");
  assertV594(stage.suite === suite && batch.suite === suite, "v594-browser-suite-binding");
  if (syntheticFixture) {
    assertV594(stage.fixture?.synthetic === true && batch.fixture?.synthetic === true,
      "v594-browser-fixture-marker");
  } else {
    assertV594(stage.fixture?.synthetic !== true && batch.fixture?.synthetic !== true,
      "v594-browser-synthetic-as-formal");
  }
  const identity = validateV594Identity(stage.identity, expectedIdentity, {
    deliveryTier: expectedTier(suite),
  });
  validateV594Identity(batch.identity, identity, { deliveryTier: expectedTier(suite) });
  assertV594(stage.tooling?.collectorVersion === V594_BROWSER_BATCH_VERSION,
    "v594-browser-collector-version");
  assertV594(stage.tooling?.auditorVersion === V594_BROWSER_AUDITOR_VERSION,
    "v594-browser-auditor-version");
  assertV594(stage.tooling?.pngAuditorVersion === V594_BROWSER_PNG_AUDITOR_VERSION,
    "v594-browser-png-auditor-version");
  assertV594(stage.tooling?.auditorContractCaseCount === V594_BROWSER_AUDITOR_CONTRACT_CASES,
    "v594-browser-auditor-case-count");
  assertV594(stageGatesPassed(stage), "v594-browser-stage-gates");
  assertV594(Array.isArray(stage.errors) && stage.errors.length === 0,
    "v594-browser-stage-errors");
  const count = V594_BROWSER_FRAME_COUNTS[suite];
  assertV594(stage.matrix?.expectedFrameCount === count
    && stage.matrix?.auditedFrameCount === count,
  "v594-browser-stage-frame-count");
  assertV594(Array.isArray(batch.frameDefinitions) && batch.frameDefinitions.length === count,
    "v594-browser-frame-definitions");
  assertV594(Array.isArray(batch.results) && batch.results.length === count,
    "v594-browser-result-count");
  assertV594(batch.results.every((row) => row.status === "captured-offline-audit-required"
    && Array.isArray(row.blockers) && row.blockers.length === 0),
  "v594-browser-results-not-clean");
  assertV594(batch.prerequisiteBlockers?.length === 0, "v594-browser-prerequisite-blockers");
  assertV594(batch.boundaries?.formalProductPointer === "v263"
    && batch.boundaries?.priorV593IdentityReused === false
    && batch.boundaries?.priorChallengeReused === false
    && batch.boundaries?.automaticHumanApproval === false
    && batch.boundaries?.humanDecisionArtifactGenerated === false
    && batch.boundaries?.scientificPayloadMutationAllowed === false
    && batch.boundaries?.promotionAllowed === false
    && batch.boundaries?.unknownOrZeroCountsAsPass === false,
  "v594-browser-boundaries");
  assertV594(batch.evidenceIntegrity?.attestationAuthority === "none"
    && batch.evidenceIntegrity?.humanSignoffGate === "separate-not-collected",
  "v594-browser-no-attestation");
  if (suite === "exact-ab") {
    assertV594(sameCanonicalV594(batch.exactAbPasses, V594_EXACT_PASSES),
      "v594-browser-exact-pass-order");
    assertV594(sameCanonicalV594(stage.matrix?.exactAbPasses, V594_EXACT_PASSES),
      "v594-browser-stage-exact-pass-order");
  } else {
    const passes = new Set(batch.frameDefinitions.map((row) => row.pass));
    assertV594(V594_MATRIX_PASSES.every((pass) => passes.has(pass)),
      "v594-browser-six-pass-coverage");
  }
  if (suite === "lite") {
    assertV594(batch.delivery?.expectedProfile === "vercel-lite"
      && batch.delivery?.fullLiteSeparated === true
      && batch.delivery?.exactAbSameBuild === false,
    "v594-browser-lite-separation");
  } else if (suite === "full") {
    assertV594(batch.delivery?.expectedProfile === "standalone-full"
      && batch.delivery?.fullLiteSeparated === true
      && batch.delivery?.exactAbSameBuild === false,
    "v594-browser-full-separation");
  } else {
    assertV594(batch.delivery?.expectedProfile === "standalone-full"
      && batch.delivery?.fullLiteSeparated === false
      && batch.delivery?.exactAbSameBuild === true,
    "v594-browser-exact-same-build");
  }
  if (stagePath && batchPath) {
    const stageBatch = stage.batch;
    const observedBatch = await fileReceiptV594(root, batchPath, `browser-batch:${suite}`);
    assertV594(stageBatch?.path === observedBatch.path
      && stageBatch?.fileSha256 === observedBatch.sha256
      && stageBatch?.batchSha256 === batch.batchSha256,
    "v594-browser-stage-batch-byte-binding");
    const observedStage = await fileReceiptV594(root, stagePath, `browser-stage:${suite}`);
    assertV594(sha256V594Closure((await readJsonV594(
      resolveInsideV594Workspace(root, stagePath, `browser-stage:${suite}`),
      `browser-stage:${suite}`,
    )).bytes) === observedStage.sha256, "v594-browser-stage-byte-binding");
    await verifyCaptureArtifacts(root, batch);
  }
  for (const result of batch.results) {
    assertNetworkKnown(result);
    assertV594(result.screenshot?.png?.complete === true
      && result.screenshot.png.width === (suite === "lite" ? 390 : 1440)
      && result.screenshot.png.height === (suite === "lite" ? 844 : 900),
    `v594-browser-png:${result.id}`);
    assertV594(result.observed?.domIdentity?.formalProductPointer === "v263",
      `v594-browser-dom-pointer:${result.id}`);
    assertV594(result.observed?.formalDefaultKernel === "legacy-eih-1pn",
      `v594-browser-kernel:${result.id}`);
    assertV594(result.observed?.rootPromotionStatus === V594_ROOT_SCIENTIFIC_PROMOTION_STATUS,
      `v594-browser-promotion:${result.id}`);
  }
  return Object.freeze({ identity, frameCount: count, stageReceiptSha256: stage.receiptSha256,
    batchSha256: batch.batchSha256 });
}

export async function buildV594LiteMatrix({
  root = process.cwd(),
  outputRoot = root,
  stagePath,
  batchPath,
  outputPath = "docs/release/v594/lite-browser-matrix-v594.json",
  syntheticFixture = false,
} = {}) {
  assertV594(stagePath && batchPath, "v594-lite-inputs-required");
  const bundle = await loadCurrentV594Bundle(root, { requireBuilds: true });
  const stage = (await readJsonV594(
    resolveInsideV594Workspace(bundle.workspace, stagePath, "lite-stage"), "lite-stage",
  )).value;
  const batch = (await readJsonV594(
    resolveInsideV594Workspace(bundle.workspace, batchPath, "lite-batch"), "lite-batch",
  )).value;
  const validated = await validateV594BrowserEvidence({
    root: bundle.workspace,
    stage,
    batch,
    stagePath,
    batchPath,
    expectedIdentity: bundle.identities.lite,
    suite: "lite",
    syntheticFixture,
  });
  assertV594(validated.identity.buildId !== bundle.identities.standalone.buildId,
    "v594-lite-full-build-alias");
  const unsigned = {
    version: V594_LITE_RECEIPT_VERSION,
    generatedAt: stage.auditedAt ?? bundle.source.generatedAt,
    status: V594_LITE_RECEIPT_STATUS,
    candidate: validated.identity,
    evidence: {
      stage: await fileReceiptV594(bundle.workspace, stagePath, "lite-stage"),
      batch: await fileReceiptV594(bundle.workspace, batchPath, "lite-batch"),
    },
    stageReceiptSha256: validated.stageReceiptSha256,
    batchSha256: validated.batchSha256,
    frameCount: validated.frameCount,
    deliverySeparation: "independent-vercel-lite-build-and-evidence",
    authority: { ...bundle.candidate.authority },
    synthetic: syntheticFixture,
  };
  const receipt = sealV594Document(unsigned);
  if (!syntheticFixture) await atomicWriteJsonV594(
    await resolveV594OutputRoot(bundle.workspace, outputRoot, "lite-output"),
    outputPath,
    receipt,
    "lite-output",
  );
  return receipt;
}

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (new Set(["--stage", "--batch", "--output", "--validate-fixture"]).has(token)) {
      values[token.slice(2)] = argv[++index];
    } else throw new Error(`v594-lite-argument:${token}`);
  }
  if (values["validate-fixture"]) {
    const parts = values["validate-fixture"].split(",");
    assertV594(parts.length === 2 && !values.stage && !values.batch,
      "v594-lite-fixture-format");
    [values.stage, values.batch] = parts;
    values.syntheticFixture = true;
  }
  assertV594(values.stage && values.batch, "v594-lite-inputs-required");
  return values;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const receipt = await buildV594LiteMatrix({
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

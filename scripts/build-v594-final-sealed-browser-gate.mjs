import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  assertV594,
  atomicWriteJsonV594,
  fileReceiptV594,
  loadCurrentV594Bundle,
  readJsonV594,
  resolveInsideV594Workspace,
  resolveV594OutputRoot,
  sealV594Document,
} from "./build-v594-current-source-lifecycle.mjs";
import {
  validateV594BrowserEvidence,
  V594_EXACT_PASSES,
} from "./build-v594-current-lite-matrix.mjs";

export const V594_BROWSER_GATE_VERSION = "v594-final-sealed-browser-gate-v2";
export const V594_BROWSER_GATE_STATUS =
  "passed-current-v594-full-lite-exact-and-relativity-marker-browser-gates-human-signoff-pending";

async function loadEvidence(root, value, label) {
  return (await readJsonV594(resolveInsideV594Workspace(root, value, label), label)).value;
}

export async function buildV594FinalBrowserGate({
  root = process.cwd(),
  outputRoot = root,
  fullStagePath,
  fullBatchPath,
  exactStagePath,
  exactBatchPath,
  liteReceiptPath = "docs/release/v594/lite-browser-matrix-v594.json",
  liteReceiptCanonicalPath = liteReceiptPath,
  outputPath = "docs/release/v594/final-sealed-browser-gate-v594.json",
  syntheticFixture = false,
} = {}) {
  assertV594(fullStagePath && fullBatchPath && exactStagePath && exactBatchPath,
    "v594-browser-gate-inputs-required");
  const bundle = await loadCurrentV594Bundle(root, { requireBuilds: true });
  resolveInsideV594Workspace(bundle.workspace, liteReceiptCanonicalPath,
    "lite-receipt-canonical-path");
  const [fullStage, fullBatch, exactStage, exactBatch, lite] = await Promise.all([
    loadEvidence(bundle.workspace, fullStagePath, "full-stage"),
    loadEvidence(bundle.workspace, fullBatchPath, "full-batch"),
    loadEvidence(bundle.workspace, exactStagePath, "exact-stage"),
    loadEvidence(bundle.workspace, exactBatchPath, "exact-batch"),
    loadEvidence(bundle.workspace, liteReceiptPath, "lite-receipt"),
  ]);
  const full = await validateV594BrowserEvidence({
    root: bundle.workspace,
    stage: fullStage,
    batch: fullBatch,
    stagePath: fullStagePath,
    batchPath: fullBatchPath,
    expectedIdentity: bundle.identities.standalone,
    suite: "full",
    syntheticFixture,
  });
  const exact = await validateV594BrowserEvidence({
    root: bundle.workspace,
    stage: exactStage,
    batch: exactBatch,
    stagePath: exactStagePath,
    batchPath: exactBatchPath,
    expectedIdentity: bundle.identities.standalone,
    suite: "exact-ab",
    syntheticFixture,
  });
  const { verifyV594Seal } = await import("./build-v594-current-source-lifecycle.mjs");
  verifyV594Seal(lite, "receiptSha256", "lite-receipt");
  assertV594(lite.version === "v594-lite-browser-matrix-v1"
    && lite.status === "passed-current-v594-independent-8-frame-lite-automatic-gates",
  "v594-browser-gate-lite-contract");
  assertV594(lite.synthetic === syntheticFixture, "v594-browser-gate-lite-fixture-binding");
  assertV594(lite.candidate?.sourceManifestSha256 === full.identity.sourceManifestSha256
    && lite.candidate?.candidateManifestSha256 === full.identity.candidateManifestSha256
    && lite.candidate?.deploymentId === full.identity.deploymentId
    && lite.candidate?.deliveryTier === "vercel-lite",
  "v594-browser-gate-lite-identity");
  assertV594(lite.candidate.buildId !== full.identity.buildId,
    "v594-browser-gate-full-lite-alias");
  assertV594(exact.identity.buildId === full.identity.buildId
    && exact.identity.buildFingerprint === full.identity.buildFingerprint,
  "v594-browser-gate-exact-full-build-drift");
  assertV594(exactStage.gates?.exactRelativityObservationMarker === true,
    "v594-browser-gate-relativity-observation-marker");
  const unsigned = {
    version: V594_BROWSER_GATE_VERSION,
    generatedAt: [fullStage.auditedAt, exactStage.auditedAt, lite.generatedAt]
      .filter((value) => typeof value === "string").sort().at(-1)
      ?? bundle.source.generatedAt,
    status: V594_BROWSER_GATE_STATUS,
    candidate: full.identity,
    matrices: {
      full: {
        frameCount: full.frameCount,
        stageReceiptSha256: full.stageReceiptSha256,
        batchSha256: full.batchSha256,
        stage: await fileReceiptV594(bundle.workspace, fullStagePath, "full-stage"),
        batch: await fileReceiptV594(bundle.workspace, fullBatchPath, "full-batch"),
      },
      lite: {
        frameCount: lite.frameCount,
        receiptSha256: lite.receiptSha256,
        receipt: {
          ...await fileReceiptV594(bundle.workspace, liteReceiptPath, "lite-receipt"),
          path: liteReceiptCanonicalPath,
        },
        candidate: lite.candidate,
      },
      exactAb: {
        pairCount: V594_EXACT_PASSES.length,
        frameCount: exact.frameCount,
        passes: V594_EXACT_PASSES,
        relativityObservationMarkerVerified: true,
        stageReceiptSha256: exact.stageReceiptSha256,
        batchSha256: exact.batchSha256,
        stage: await fileReceiptV594(bundle.workspace, exactStagePath, "exact-stage"),
        batch: await fileReceiptV594(bundle.workspace, exactBatchPath, "exact-batch"),
      },
    },
    fullLiteIndependentBuilds: true,
    exactAbSameStandaloneBuild: true,
    exactRelativityObservationMarkerVerified: true,
    humanDecision: "separate-pending-not-generated",
    authority: { ...bundle.candidate.authority },
    synthetic: syntheticFixture,
  };
  const receipt = sealV594Document(unsigned);
  if (!syntheticFixture) await atomicWriteJsonV594(
    await resolveV594OutputRoot(bundle.workspace, outputRoot, "browser-gate-output"),
    outputPath,
    receipt,
    "browser-gate-output",
  );
  return receipt;
}

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (new Set([
      "--full-stage", "--full-batch", "--exact-stage", "--exact-batch",
      "--lite-receipt", "--output", "--validate-fixture",
    ]).has(token)) values[token.slice(2)] = argv[++index];
    else throw new Error(`v594-browser-gate-argument:${token}`);
  }
  if (values["validate-fixture"]) {
    const parts = values["validate-fixture"].split(",");
    assertV594(parts.length === 5, "v594-browser-gate-fixture-format");
    [values["full-stage"], values["full-batch"], values["exact-stage"],
      values["exact-batch"], values["lite-receipt"]] = parts;
    values.syntheticFixture = true;
  }
  for (const field of ["full-stage", "full-batch", "exact-stage", "exact-batch"]) {
    assertV594(values[field], `v594-browser-gate-required:${field}`);
  }
  return values;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const receipt = await buildV594FinalBrowserGate({
    fullStagePath: args["full-stage"],
    fullBatchPath: args["full-batch"],
    exactStagePath: args["exact-stage"],
    exactBatchPath: args["exact-batch"],
    liteReceiptPath: args["lite-receipt"],
    outputPath: args.output,
    syntheticFixture: args.syntheticFixture === true,
  });
  process.stdout.write(`${JSON.stringify({ status: receipt.status,
    fullFrames: receipt.matrices.full.frameCount,
    liteFrames: receipt.matrices.lite.frameCount,
    exactPairs: receipt.matrices.exactAb.pairCount,
    receiptSha256: receipt.receiptSha256,
    synthetic: receipt.synthetic }, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}

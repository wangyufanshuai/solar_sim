import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { buildV594StellarRelativityCandidate } from "./build-v594-stellar-relativity-candidate.mjs";
import {
  assertV594,
  assertV594Authority,
  atomicWriteJsonV594,
  fileReceiptV594,
  loadCurrentV594Bundle,
  readJsonV594,
  resolveInsideV594Workspace,
  sameCanonicalV594,
  sealV594Document,
  validateV594Identity,
  verifyV594Seal,
  buildV594LifecycleReceipt,
} from "./build-v594-current-source-lifecycle.mjs";
import {
  buildV594SoakReceipt,
  validateV594SoakSemanticClosureContract,
} from "./build-v594-current-source-soak.mjs";
import { buildV594LiteMatrix } from "./build-v594-current-lite-matrix.mjs";
import { buildV594FinalBrowserGate } from "./build-v594-final-sealed-browser-gate.mjs";
import { buildV594HumanSignoff } from "./build-v594-human-visual-signoff.mjs";
import {
  buildV594ClosureDossier,
  validateV594ClosureInputs,
  validateV594RawEvidenceGraph,
  V594_CLOSURE_STATUS,
  V594_CLOSURE_VERSION,
} from "./build-v594-closure-dossier.mjs";
import {
  createV594BuildReceipt,
  loadV594ProfileIdentity,
} from "./build-atlas-v594-profile.mjs";

export const V594_RESEAL_VERSION = "v594-stellar-relativity-reseal-receipt-v3";
export const V594_RESEAL_STATUS = "passed-double-byte-identical-reseal";
export const V594_RESEAL_OUTPUTS = Object.freeze([
  "docs/release/v594/source-manifest-v594.json",
  "public/data/stellar-relativity-v594/manifest.json",
  "public/data/stellar-relativity-v594/current-state.json",
  "docs/release/v594/capability-pointer-v594.json",
  "dist/release/atlas-v594-standalone-build-resource.json",
  "dist/release/atlas-v594-lite-build-resource.json",
  "docs/release/v594/resource-lifecycle-v594.json",
  "docs/release/v594/soak-v594.json",
  "docs/release/v594/lite-browser-matrix-v594.json",
  "docs/release/v594/final-sealed-browser-gate-v594.json",
  "docs/release/v594/human-visual-signoff-v594.json",
  "docs/release/v594/release-export-v594.json",
]);

export const V594_REBUILT_OUTPUTS = Object.freeze([
  "docs/release/v594/source-manifest-v594.json",
  "public/data/stellar-relativity-v594/manifest.json",
  "public/data/stellar-relativity-v594/current-state.json",
  "docs/release/v594/capability-pointer-v594.json",
]);

function uniquePaths(paths) {
  const unique = [...new Set(paths)];
  assertV594(unique.length === paths.length, "v594-reseal-tracked-path-alias");
  return Object.freeze(unique);
}

async function snapshot(root, paths) {
  const result = {};
  for (const path of paths) {
    const record = await fileReceiptV594(root, path, `reseal:${path}`);
    result[path] = Object.freeze({ bytes: record.bytes, sha256: record.sha256 });
  }
  return Object.freeze(result);
}

function snapshotsEqual(first, second, paths) {
  return paths.every((path) => first[path]?.bytes === second[path]?.bytes
    && first[path]?.sha256 === second[path]?.sha256);
}

async function copyTrackedFile(sourceRoot, outputRoot, path) {
  const source = resolveInsideV594Workspace(sourceRoot, path, `reseal-copy-source:${path}`);
  const output = resolveInsideV594Workspace(outputRoot, path, `reseal-copy-output:${path}`);
  await fileReceiptV594(sourceRoot, path, `reseal-copy-source:${path}`);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, await readFile(source), { flag: "wx" });
}

/**
 * Runs both derivations in independent directories. It never writes under any
 * formal output path; callers may promote a receipt only after this returns.
 */
export async function runV594IsolatedResealPasses({
  root = process.cwd(),
  trackedPaths,
  rebuiltPaths = V594_REBUILT_OUTPUTS,
  buildCandidate = buildV594StellarRelativityCandidate,
} = {}) {
  const workspace = resolve(root);
  const tracked = uniquePaths([...(trackedPaths ?? [])]);
  assertV594(tracked.length > 0, "v594-reseal-tracked-required");
  const rebuilt = new Set(rebuiltPaths);
  assertV594([...rebuilt].every((path) => tracked.includes(path)),
    "v594-reseal-rebuilt-not-tracked");
  const formalBefore = await snapshot(workspace, tracked);
  await mkdir(resolve(workspace, "tmp"), { recursive: true });
  const stagingRoot = await mkdtemp(resolve(workspace, "tmp", "v594-reseal-isolated-"));
  try {
    const passRoots = [resolve(stagingRoot, "pass-1"), resolve(stagingRoot, "pass-2")];
    const passSnapshots = [];
    for (const passRoot of passRoots) {
      await mkdir(passRoot, { recursive: true });
      await buildCandidate({ root: workspace, outputRoot: passRoot });
      for (const path of tracked) {
        if (!rebuilt.has(path)) await copyTrackedFile(workspace, passRoot, path);
      }
      passSnapshots.push(await snapshot(passRoot, tracked));
    }
    const [firstPass, secondPass] = passSnapshots;
    assertV594(snapshotsEqual(firstPass, secondPass, tracked), "v594-reseal-byte-drift");
    assertV594(snapshotsEqual(formalBefore, secondPass, tracked),
      "v594-reseal-formal-derived-output-drift");
    const formalAfter = await snapshot(workspace, tracked);
    assertV594(snapshotsEqual(formalBefore, formalAfter, tracked),
      "v594-reseal-formal-output-mutated-during-validation");
    return Object.freeze({
      trackedPaths: tracked,
      firstPass,
      secondPass,
      outputs: secondPass,
      formalBefore,
    });
  } finally {
    await rm(stagingRoot, { recursive: true, force: true });
  }
}

async function load(root, path, label) {
  return Object.freeze({
    value: (await readJsonV594(resolveInsideV594Workspace(root, path, label), label)).value,
    record: await fileReceiptV594(root, path, label),
  });
}

async function validateFormalContext(workspace) {
  const bundle = await loadCurrentV594Bundle(workspace, { requireBuilds: true });
  assertV594(bundle.source.identityStage === "ready-for-formal-evidence-source-identity",
    "v594-reseal-source-identity-stage");
  assertV594(bundle.candidate.identityStage === "ready-for-formal-evidence-candidate-identity"
    && bundle.candidate.status === "ready-for-v594-formal-evidence-not-promoted",
  "v594-reseal-candidate-identity-stage");
  const paths = {
    lifecycle: "docs/release/v594/resource-lifecycle-v594.json",
    soak: "docs/release/v594/soak-v594.json",
    lite: "docs/release/v594/lite-browser-matrix-v594.json",
    browserGate: "docs/release/v594/final-sealed-browser-gate-v594.json",
    human: "docs/release/v594/human-visual-signoff-v594.json",
    closure: "docs/release/v594/release-export-v594.json",
  };
  const loaded = {};
  for (const [label, path] of Object.entries(paths)) loaded[label] = await load(workspace, path, label);
  await validateV594ClosureInputs({
    lifecycle: loaded.lifecycle.value,
    soak: loaded.soak.value,
    lite: loaded.lite.value,
    browserGate: loaded.browserGate.value,
    human: loaded.human.value,
    expectedFullIdentity: bundle.identities.standalone,
    expectedLiteIdentity: bundle.identities.lite,
    syntheticFixture: false,
  });
  const raw = await validateV594RawEvidenceGraph({
    root: workspace,
    lifecycle: loaded.lifecycle.value,
    soak: loaded.soak.value,
    lite: loaded.lite.value,
    browserGate: loaded.browserGate.value,
    human: loaded.human.value,
    expectedFullIdentity: bundle.identities.standalone,
    expectedLiteIdentity: bundle.identities.lite,
    aggregateRecords: { lite: loaded.lite.record, browserGate: loaded.browserGate.record },
    syntheticFixture: false,
  });
  const closure = loaded.closure.value;
  verifyV594Seal(closure, "dossierSha256", "reseal-closure");
  assertV594(closure.version === V594_CLOSURE_VERSION && closure.status === V594_CLOSURE_STATUS
    && closure.productionPromotionAllowed === false && closure.unresolved?.length === 0,
  "v594-reseal-closure-contract");
  assertV594(closure.qualification?.status
    === "qualified-additive-v594-stellar-relativity-candidate"
    && closure.qualification?.sourceAndCandidateIdentityMutatedByQualification === false,
  "v594-reseal-qualification-layer");
  validateV594Identity(closure.candidate, bundle.identities.standalone, {
    deliveryTier: "standalone-full",
  });
  assertV594Authority(closure.authority, "reseal-closure");
  assertV594(sameCanonicalV594(closure.evidenceTracked, raw.evidenceTracked),
    "v594-reseal-closure-raw-evidence-binding");
  assertV594(closure.lifecycle?.receiptSha256 === loaded.lifecycle.value.receiptSha256
    && closure.soak?.receiptSha256 === loaded.soak.value.receiptSha256
    && closure.liteBrowser?.receiptSha256 === loaded.lite.value.receiptSha256
    && closure.browserGate?.receiptSha256 === loaded.browserGate.value.receiptSha256
    && closure.humanReview?.receiptSha256 === loaded.human.value.receiptSha256,
  "v594-reseal-closure-receipt-binding");
  const semanticQualification = validateV594SoakSemanticClosureContract(loaded.soak.value);
  assertV594(closure.browserGate?.exactRelativityObservationMarkerVerified === true
    && closure.gates?.exactRelativityObservationMarker === true
    && closure.gates?.releasedHeapRawQualification === true
    && closure.gates?.releasedHeapSemanticProofRequired
      === semanticQualification.semanticProofRequired
    && closure.gates?.releasedHeapSemanticProofSatisfied
      === semanticQualification.semanticProofSatisfied,
  "v594-reseal-relativity-observation-marker");
  return Object.freeze({ bundle, loaded, raw });
}

async function deriveV594FormalOutputs({ workspace, outputRoot, context, buildCandidate }) {
  const outputPrefix = relative(workspace, outputRoot).replaceAll("\\", "/");
  assertV594(outputPrefix && !outputPrefix.startsWith(".."),
    "v594-reseal-output-prefix-boundary");
  const staged = (path) => `${outputPrefix}/${path}`;
  await buildCandidate({ root: workspace, outputRoot });
  for (const [requested, path] of [
    ["standalone-full", "dist/release/atlas-v594-standalone-build-resource.json"],
    ["vercel-lite", "dist/release/atlas-v594-lite-build-resource.json"],
  ]) {
    const identity = loadV594ProfileIdentity({ root: workspace, requested, requireReady: true });
    const receipt = createV594BuildReceipt(identity, { root: workspace });
    await atomicWriteJsonV594(outputRoot, path, receipt, `reseal-build:${requested}`);
  }
  const lifecycleStagePath = context.loaded.lifecycle.value.evidence.path;
  const soakStagePath = context.loaded.soak.value.evidence.path;
  const semanticQualification = validateV594SoakSemanticClosureContract(
    context.loaded.soak.value,
  );
  const semanticStagePath = semanticQualification.semanticProofRequired
    ? context.loaded.soak.value.semanticEvidence.path
    : null;
  const liteStagePath = context.loaded.lite.value.evidence.stage.path;
  const liteBatchPath = context.loaded.lite.value.evidence.batch.path;
  const fullStagePath = context.loaded.browserGate.value.matrices.full.stage.path;
  const fullBatchPath = context.loaded.browserGate.value.matrices.full.batch.path;
  const exactStagePath = context.loaded.browserGate.value.matrices.exactAb.stage.path;
  const exactBatchPath = context.loaded.browserGate.value.matrices.exactAb.batch.path;
  const decisionPath = context.loaded.human.value.userDecision.path;
  await buildV594LifecycleReceipt({
    root: workspace,
    outputRoot,
    stagePath: lifecycleStagePath,
  });
  await buildV594SoakReceipt({
    root: workspace,
    outputRoot,
    stagePath: soakStagePath,
    semanticStagePath,
  });
  await buildV594LiteMatrix({
    root: workspace,
    outputRoot,
    stagePath: liteStagePath,
    batchPath: liteBatchPath,
  });
  await buildV594FinalBrowserGate({
    root: workspace,
    outputRoot,
    fullStagePath,
    fullBatchPath,
    exactStagePath,
    exactBatchPath,
    liteReceiptPath: staged("docs/release/v594/lite-browser-matrix-v594.json"),
    liteReceiptCanonicalPath: "docs/release/v594/lite-browser-matrix-v594.json",
  });
  await buildV594HumanSignoff({
    root: workspace,
    outputRoot,
    browserGatePath: staged("docs/release/v594/final-sealed-browser-gate-v594.json"),
    browserGateCanonicalPath: "docs/release/v594/final-sealed-browser-gate-v594.json",
    decisionPath,
  });
  await buildV594ClosureDossier({
    root: workspace,
    outputRoot,
    lifecyclePath: staged("docs/release/v594/resource-lifecycle-v594.json"),
    soakPath: staged("docs/release/v594/soak-v594.json"),
    litePath: staged("docs/release/v594/lite-browser-matrix-v594.json"),
    browserGatePath: staged("docs/release/v594/final-sealed-browser-gate-v594.json"),
    humanPath: staged("docs/release/v594/human-visual-signoff-v594.json"),
    aggregateCanonicalPaths: {
      lite: "docs/release/v594/lite-browser-matrix-v594.json",
      browserGate: "docs/release/v594/final-sealed-browser-gate-v594.json",
    },
    lifecycleStagePath,
    soakStagePath,
    semanticStagePath,
    liteStagePath,
    liteBatchPath,
    fullStagePath,
    fullBatchPath,
    exactStagePath,
    exactBatchPath,
  });
}

export async function doubleResealV594({
  root = process.cwd(),
  buildCandidate = buildV594StellarRelativityCandidate,
  outputPath = "docs/release/v594/reseal-receipt-v594.json",
} = {}) {
  const workspace = resolve(root);
  const context = await validateFormalContext(workspace);
  const evidenceTracked = context.raw.evidenceTracked.filter(
    (record) => !V594_RESEAL_OUTPUTS.includes(record.path),
  );
  const trackedPaths = uniquePaths([
    ...V594_RESEAL_OUTPUTS,
    ...evidenceTracked.map((record) => record.path),
  ]);
  const passes = await runV594IsolatedResealPasses({
    root: workspace,
    trackedPaths,
    rebuiltPaths: V594_RESEAL_OUTPUTS,
    buildCandidate: ({ outputRoot }) => deriveV594FormalOutputs({
      workspace,
      outputRoot,
      context,
      buildCandidate,
    }),
  });
  const unsigned = {
    version: V594_RESEAL_VERSION,
    generatedAt: context.bundle.source.generatedAt,
    timestampPolicy: "source-manifest-generated-at-explicit-no-wall-clock",
    status: V594_RESEAL_STATUS,
    passes: 2,
    outputs: passes.outputs,
    firstPass: passes.firstPass,
    secondPass: passes.secondPass,
    evidenceTracked,
    byteIdentical: true,
    formalProductPointer: "v263",
    authority: { ...context.bundle.candidate.authority },
    scientificPayloadMutationAllowed: false,
    measuredAuthorityGranted: false,
    gpuAuthorityGranted: false,
    productionPromotionAllowed: false,
    synthetic: false,
  };
  const receipt = sealV594Document(unsigned);
  await atomicWriteJsonV594(workspace, outputPath, receipt, "reseal-output");
  return receipt;
}

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--output") values.output = argv[++index];
    else throw new Error(`v594-reseal-argument:${token}`);
  }
  return values;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const receipt = await doubleResealV594({ outputPath: args.output });
  process.stdout.write(`${JSON.stringify({ status: receipt.status,
    byteIdentical: receipt.byteIdentical,
    receiptSha256: receipt.receiptSha256 }, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}

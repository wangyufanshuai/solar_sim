import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  assertV595Authority,
  assertV595Formal,
  atomicWriteJsonV595Formal,
  fileReceiptV595Formal,
  loadCurrentV595Bundle,
  readJsonV595Formal,
  resolveInsideV595Workspace,
  sameCanonicalV595Formal,
  sealV595FormalDocument,
  validateV595Identity,
  verifyV595FormalSeal,
  V595_FORMAL_PRODUCT_POINTER,
  V595_PARENT_V594_IDENTITY,
  V595_READY_STATUS,
} from "./v595-formal-contract.mjs";
import {
  buildV595StellarRelativityCandidate,
} from "./build-v595-stellar-relativity-candidate.mjs";
import {
  createV595BuildReceipt,
  loadV595ProfileIdentity,
} from "./build-atlas-v595-profile.mjs";
import {
  validateV595ClosureInputs,
  validateV595RawEvidenceGraph,
  V595_CLOSURE_STATUS,
  V595_CLOSURE_VERSION,
  V595_QUALIFICATION_STATUS,
} from "./build-v595-closure-dossier.mjs";
import {
  validateV595HumanSignoff,
} from "./build-v595-human-visual-signoff.mjs";

export const V595_RESEAL_VERSION =
  "v595-stellar-relativity-reseal-receipt-v1";
export const V595_RESEAL_STATUS =
  "passed-double-byte-identical-current-v595-reseal";
export const V595_RESEAL_OUTPUT_PATH =
  "docs/release/v595/reseal-receipt-v595.json";

export const V595_RESEAL_OUTPUTS = Object.freeze([
  "docs/release/v595/source-manifest-v595.json",
  "public/data/stellar-relativity-v595/manifest.json",
  "public/data/stellar-relativity-v595/current-state.json",
  "docs/release/v595/capability-pointer-v595.json",
  "dist/release/atlas-v595-standalone-build-resource.json",
  "dist/release/atlas-v595-lite-build-resource.json",
  "docs/release/v595/resource-lifecycle-v595.json",
  "docs/release/v595/soak-v595.json",
  "docs/release/v595/lite-browser-matrix-v595.json",
  "docs/release/v595/final-sealed-browser-gate-v595.json",
  "docs/release/v595/human-visual-signoff-v595.json",
  "docs/release/v595/release-export-v595.json",
]);

// These six artifacts have deterministic builders that can target an isolated
// artifact root without changing their canonical embedded paths. The remaining
// formal receipts are validated semantically, then retained byte-for-byte in
// each isolated pass. This distinction is explicit in the reseal receipt.
export const V595_REBUILT_OUTPUTS = Object.freeze([
  "docs/release/v595/source-manifest-v595.json",
  "public/data/stellar-relativity-v595/manifest.json",
  "public/data/stellar-relativity-v595/current-state.json",
  "docs/release/v595/capability-pointer-v595.json",
  "dist/release/atlas-v595-standalone-build-resource.json",
  "dist/release/atlas-v595-lite-build-resource.json",
]);

export const V595_RETAINED_VALIDATED_OUTPUTS = Object.freeze(
  V595_RESEAL_OUTPUTS.filter((path) => !V595_REBUILT_OUTPUTS.includes(path)),
);

const V595_FORMAL_PATHS = Object.freeze({
  lifecycle: "docs/release/v595/resource-lifecycle-v595.json",
  soak: "docs/release/v595/soak-v595.json",
  lite: "docs/release/v595/lite-browser-matrix-v595.json",
  browserGate: "docs/release/v595/final-sealed-browser-gate-v595.json",
  human: "docs/release/v595/human-visual-signoff-v595.json",
  closure: "docs/release/v595/release-export-v595.json",
});

function uniquePaths(paths) {
  const values = [...paths];
  const unique = [...new Set(values)];
  assertV595Formal(
    unique.length === values.length,
    "v595-reseal-tracked-path-alias",
  );
  return Object.freeze(unique);
}

async function snapshot(root, paths) {
  const result = {};
  for (const path of paths) {
    const record = await fileReceiptV595Formal(root, path, `reseal:${path}`);
    result[path] = Object.freeze({ bytes: record.bytes, sha256: record.sha256 });
  }
  return Object.freeze(result);
}

function snapshotsEqual(first, second, paths) {
  return paths.every((path) => first[path]?.bytes === second[path]?.bytes
    && first[path]?.sha256 === second[path]?.sha256);
}

async function copyTrackedFile(sourceRoot, outputRoot, path) {
  const source = resolveInsideV595Workspace(
    sourceRoot,
    path,
    `reseal-copy-source:${path}`,
  );
  const output = resolveInsideV595Workspace(
    outputRoot,
    path,
    `reseal-copy-output:${path}`,
  );
  await fileReceiptV595Formal(sourceRoot, path, `reseal-copy-source:${path}`);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, await readFile(source), { flag: "wx" });
}

/**
 * Derives two isolated snapshots while preserving every formal workspace byte.
 * `buildCandidate` may only populate each supplied isolated output root. A
 * before/after formal snapshot makes an accidental formal write fail closed.
 */
export async function runV595IsolatedResealPasses({
  root = process.cwd(),
  trackedPaths,
  rebuiltPaths = V595_REBUILT_OUTPUTS,
  buildCandidate = buildV595StellarRelativityCandidate,
} = {}) {
  const workspace = resolve(root);
  const tracked = uniquePaths([...(trackedPaths ?? [])]);
  assertV595Formal(tracked.length > 0, "v595-reseal-tracked-required");
  const rebuiltList = uniquePaths([...(rebuiltPaths ?? [])]);
  const rebuilt = new Set(rebuiltList);
  assertV595Formal(
    rebuiltList.every((path) => tracked.includes(path)),
    "v595-reseal-rebuilt-not-tracked",
  );
  const formalBefore = await snapshot(workspace, tracked);
  await mkdir(resolve(workspace, "tmp"), { recursive: true });
  const stagingRoot = await mkdtemp(resolve(workspace, "tmp", "v595-reseal-isolated-"));
  try {
    const passRoots = [resolve(stagingRoot, "pass-1"), resolve(stagingRoot, "pass-2")];
    const passSnapshots = [];
    for (const passRoot of passRoots) {
      await mkdir(passRoot, { recursive: true });
      await buildCandidate({ outputRoot: passRoot });
      for (const path of tracked) {
        if (!rebuilt.has(path)) {
          await copyTrackedFile(workspace, passRoot, path);
        }
      }
      passSnapshots.push(await snapshot(passRoot, tracked));
    }
    const [firstPass, secondPass] = passSnapshots;
    assertV595Formal(
      snapshotsEqual(firstPass, secondPass, tracked),
      "v595-reseal-byte-drift",
    );
    assertV595Formal(
      snapshotsEqual(formalBefore, secondPass, tracked),
      "v595-reseal-formal-derived-output-drift",
    );
    const formalAfter = await snapshot(workspace, tracked);
    assertV595Formal(
      snapshotsEqual(formalBefore, formalAfter, tracked),
      "v595-reseal-formal-output-mutated-during-validation",
    );
    return Object.freeze({
      trackedPaths: tracked,
      rebuiltPaths: rebuiltList,
      retainedPaths: Object.freeze(tracked.filter((path) => !rebuilt.has(path))),
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
    value: (await readJsonV595Formal(root, path, label)).value,
    record: await fileReceiptV595Formal(root, path, label),
  });
}

export function validateV595QualifiedClosure({ closure, bundle, loaded, raw }) {
  verifyV595FormalSeal(closure, "dossierSha256", "reseal-closure");
  assertV595Formal(
    closure.version === V595_CLOSURE_VERSION
      && closure.status === V595_CLOSURE_STATUS
      && closure.synthetic === false
      && closure.productionPromotionAllowed === false,
    "v595-reseal-closure-contract",
  );
  assertV595Formal(
    closure.qualification?.status === V595_QUALIFICATION_STATUS
      && closure.qualification?.sourceAndCandidateIdentityMutatedByQualification === false
      && closure.qualification?.productionPromotionAllowed === false,
    "v595-reseal-qualification-layer",
  );
  validateV595Identity(closure.candidate, bundle.identities.standalone, {
    deliveryTier: "standalone-full",
  });
  validateV595Identity(closure.qualification.candidate, bundle.identities.standalone, {
    deliveryTier: "standalone-full",
  });
  assertV595Authority(closure.authority, "reseal-closure");
  assertV595Formal(
    closure.governance?.parentV594Immutable === true
      && closure.governance?.priorV594HumanDecisionInherited === false
      && closure.governance?.currentV595HumanDecisionRequiredAndBound === true
      && closure.governance?.formalProductPointer === V595_FORMAL_PRODUCT_POINTER,
    "v595-reseal-closure-governance",
  );
  assertV595Formal(
    closure.parentV594?.sourceManifestSha256
        === V595_PARENT_V594_IDENTITY.sourceManifestSha256
      && closure.parentV594?.candidateManifestSha256
        === V595_PARENT_V594_IDENTITY.candidateManifestSha256
      && closure.parentV594?.releaseDossierSha256
        === V595_PARENT_V594_IDENTITY.releaseDossierSha256
      && closure.parentV594?.resealReceiptSha256
        === V595_PARENT_V594_IDENTITY.resealReceiptSha256
      && closure.parentV594?.immutable === true,
    "v595-reseal-parent-v594-binding",
  );
  assertV595Formal(
    sameCanonicalV595Formal(closure.unresolved, [
      "physical-mobile-real-device-evidence-not-present",
    ])
      && closure.gates?.physicalMobileNotPresentNotFaked === true
      && closure.browserGate?.physicalMobileStatus === "not-present-not-faked",
    "v595-reseal-physical-mobile-boundary",
  );
  assertV595Formal(
    closure.gates?.unknownAndZeroFailClosed === true
      && closure.gates?.fullLiteIndependentBuilds === true
      && closure.gates?.exactAbEightPairsSixteenFrames === true
      && closure.gates?.stellarScienceCinematic24x2 === true
      && closure.gates?.sixProductSceneFamilyJourneys === true
      && closure.gates?.sameRealmLifecycle === true
      && closure.gates?.cdpRendererHeapSoak === true
      && closure.gates?.humanVisualSignoff === true,
    "v595-reseal-closure-gates",
  );
  assertV595Formal(
    closure.lifecycle?.receiptSha256 === loaded.lifecycle.value.receiptSha256
      && closure.soak?.receiptSha256 === loaded.soak.value.receiptSha256
      && closure.liteBrowser?.receiptSha256 === loaded.lite.value.receiptSha256
      && closure.browserGate?.receiptSha256 === loaded.browserGate.value.receiptSha256
      && closure.humanReview?.receiptSha256 === loaded.human.value.receiptSha256
      && closure.humanReview?.decisionSha256 === loaded.human.value.decisionSha256
      && closure.humanReview?.priorV594HumanDecisionInherited === false,
    "v595-reseal-closure-receipt-binding",
  );
  assertV595Formal(
    closure.evidenceGraph?.recursivelyReopened === true
      && closure.evidenceGraph?.recordCount === raw.evidenceTracked.length
      && closure.evidenceGraph?.totalBytes === raw.totalBytes
      && sameCanonicalV595Formal(closure.evidenceGraph.records, raw.evidenceTracked),
    "v595-reseal-closure-raw-evidence-binding",
  );
  return closure;
}

async function validateFormalContext(workspace) {
  const bundle = await loadCurrentV595Bundle(workspace, { requireBuilds: true });
  assertV595Formal(
    bundle.source.identityStage === "ready-for-v595-delta-source-identity"
      && bundle.candidate.identityStage === "ready-for-formal-evidence-candidate-identity"
      && bundle.candidate.status === V595_READY_STATUS,
    "v595-reseal-current-identity-stage",
  );
  assertV595Formal(
    bundle.candidate.governance?.priorV594HumanDecisionInherited === false,
    "v595-reseal-prior-v594-human-decision",
  );
  const loaded = {};
  for (const [label, path] of Object.entries(V595_FORMAL_PATHS)) {
    loaded[label] = await load(workspace, path, label);
  }
  validateV595HumanSignoff(
    loaded.human.value,
    bundle.identities.standalone,
    { syntheticFixture: false },
  );
  validateV595ClosureInputs({
    lifecycle: loaded.lifecycle.value,
    soak: loaded.soak.value,
    lite: loaded.lite.value,
    browserGate: loaded.browserGate.value,
    human: loaded.human.value,
    candidate: bundle.candidate,
    expectedFullIdentity: bundle.identities.standalone,
    expectedLiteIdentity: bundle.identities.lite,
    syntheticFixture: false,
  });
  const raw = await validateV595RawEvidenceGraph({
    root: workspace,
    lifecycle: loaded.lifecycle.value,
    soak: loaded.soak.value,
    lite: loaded.lite.value,
    browserGate: loaded.browserGate.value,
    human: loaded.human.value,
    candidate: bundle.candidate,
    expectedFullIdentity: bundle.identities.standalone,
    expectedLiteIdentity: bundle.identities.lite,
    aggregateRecords: {
      lifecycle: loaded.lifecycle.record,
      soak: loaded.soak.record,
      lite: loaded.lite.record,
      browserGate: loaded.browserGate.record,
      human: loaded.human.record,
    },
    syntheticFixture: false,
  });
  validateV595QualifiedClosure({
    closure: loaded.closure.value,
    bundle,
    loaded,
    raw,
  });
  return Object.freeze({ bundle, loaded, raw });
}

async function deriveV595IdentityOutputs({
  workspace,
  outputRoot,
  generatedAt,
  buildCandidate,
}) {
  await buildCandidate({
    root: workspace,
    outputRoot,
    generatedAt,
  });
  for (const [requested, path] of [
    ["standalone-full", "dist/release/atlas-v595-standalone-build-resource.json"],
    ["vercel-lite", "dist/release/atlas-v595-lite-build-resource.json"],
  ]) {
    const identity = loadV595ProfileIdentity({
      root: workspace,
      artifactRoot: outputRoot,
      requested,
      requireReady: true,
    });
    const receipt = createV595BuildReceipt(identity, { root: workspace });
    await atomicWriteJsonV595Formal(
      workspace,
      outputRoot,
      path,
      receipt,
      `reseal-build:${requested}`,
    );
  }
}

export async function doubleResealV595({
  root = process.cwd(),
  buildCandidate = buildV595StellarRelativityCandidate,
  outputPath = V595_RESEAL_OUTPUT_PATH,
} = {}) {
  const workspace = resolve(root);
  const context = await validateFormalContext(workspace);
  const evidenceTracked = context.raw.evidenceTracked.filter(
    (record) => !V595_RESEAL_OUTPUTS.includes(record.path),
  );
  const trackedPaths = uniquePaths([
    ...V595_RESEAL_OUTPUTS,
    ...evidenceTracked.map((record) => record.path),
  ]);
  const passes = await runV595IsolatedResealPasses({
    root: workspace,
    trackedPaths,
    rebuiltPaths: V595_REBUILT_OUTPUTS,
    buildCandidate: ({ outputRoot }) => deriveV595IdentityOutputs({
      workspace,
      outputRoot,
      generatedAt: context.bundle.source.generatedAt,
      buildCandidate,
    }),
  });
  const unsigned = {
    version: V595_RESEAL_VERSION,
    generatedAt: context.bundle.source.generatedAt,
    timestampPolicy: "source-manifest-generated-at-explicit-no-wall-clock",
    status: V595_RESEAL_STATUS,
    qualificationStatus: V595_QUALIFICATION_STATUS,
    passes: 2,
    outputs: passes.outputs,
    firstPass: passes.firstPass,
    secondPass: passes.secondPass,
    rebuiltOutputs: V595_REBUILT_OUTPUTS,
    retainedValidatedOutputs: V595_RETAINED_VALIDATED_OUTPUTS,
    evidenceTracked,
    byteIdentical: true,
    candidate: context.bundle.identities.standalone,
    liteCandidate: context.bundle.identities.lite,
    closureDossierSha256: context.loaded.closure.value.dossierSha256,
    humanDecisionSha256: context.loaded.human.value.decisionSha256,
    parentV594: {
      ...V595_PARENT_V594_IDENTITY,
      immutable: true,
      relationship: "sealed-parent-not-current-build",
    },
    priorV594HumanDecisionInherited: false,
    formalProductPointer: V595_FORMAL_PRODUCT_POINTER,
    authority: { ...context.bundle.candidate.authority },
    scientificPayloadMutationAllowed: false,
    measuredAuthorityGranted: false,
    gpuAuthorityGranted: false,
    radiativeTransferGranted: false,
    grmhdGranted: false,
    productionPromotionAllowed: false,
    productionReleaseAuthorized: false,
    unresolved: ["physical-mobile-real-device-evidence-not-present"],
    synthetic: false,
  };
  assertV595Authority(unsigned.authority, "reseal");
  const receipt = sealV595FormalDocument(unsigned);
  await atomicWriteJsonV595Formal(
    workspace,
    workspace,
    outputPath,
    receipt,
    "reseal-output",
  );
  return receipt;
}

export function parseV595ResealArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--output") values.output = argv[++index];
    else throw new Error(`v595-reseal-argument:${token}`);
  }
  return values;
}

async function main() {
  const args = parseV595ResealArgs(process.argv.slice(2));
  const receipt = await doubleResealV595({ outputPath: args.output });
  process.stdout.write(`${JSON.stringify({
    status: receipt.status,
    qualificationStatus: receipt.qualificationStatus,
    byteIdentical: receipt.byteIdentical,
    receiptSha256: receipt.receiptSha256,
    productionPromotionAllowed: false,
  }, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}

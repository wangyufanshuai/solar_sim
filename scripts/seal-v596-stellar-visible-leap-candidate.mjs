import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  assertV596Authority,
  assertV596Formal,
  atomicWriteJsonV596Formal,
  fileReceiptV596Formal,
  loadCurrentV596Bundle,
  readJsonV596Formal,
  resolveInsideV596Workspace,
  sameCanonicalV596Formal,
  sealV596FormalDocument,
  validateV596Identity,
  verifyV596FormalSeal,
  V596_FORMAL_PRODUCT_POINTER,
  V596_PARENT_V595_IDENTITY,
  V596_READY_STATUS,
} from "./v596-formal-contract.mjs";
import {
  buildV596StellarVisibleLeapCandidate,
} from "./build-v596-stellar-visible-leap-candidate.mjs";
import {
  createV596BuildReceipt,
  loadV596ProfileIdentity,
} from "./build-atlas-v596-profile.mjs";
import {
  validateV596ClosureInputs,
  validateV596RawEvidenceGraph,
  V596_CLOSURE_STATUS,
  V596_CLOSURE_VERSION,
  V596_QUALIFICATION_STATUS,
} from "./build-v596-closure-dossier.mjs";
import {
  validateV596HumanSignoff,
} from "./build-v596-human-visual-signoff.mjs";

export const V596_RESEAL_VERSION =
  "v596-stellar-visible-leap-reseal-receipt-v1";
export const V596_RESEAL_STATUS =
  "passed-double-byte-identical-current-v596-reseal";
export const V596_RESEAL_OUTPUT_PATH =
  "docs/release/v596/reseal-receipt-v596.json";

export const V596_RESEAL_OUTPUTS = Object.freeze([
  "docs/release/v596/source-manifest-v596.json",
  "public/data/stellar-visible-leap-v596/manifest.json",
  "public/data/stellar-visible-leap-v596/current-state.json",
  "docs/release/v596/capability-pointer-v596.json",
  "dist/release/atlas-v596-standalone-build-resource.json",
  "dist/release/atlas-v596-lite-build-resource.json",
  "docs/release/v596/resource-lifecycle-v596.json",
  "docs/release/v596/soak-v596.json",
  "docs/release/v596/lite-browser-matrix-v596.json",
  "docs/release/v596/final-sealed-browser-gate-v596.json",
  "docs/release/v596/human-visual-signoff-v596.json",
  "docs/release/v596/release-export-v596.json",
]);

// These six artifacts have deterministic builders that can target an isolated
// artifact root without changing their canonical embedded paths. The remaining
// formal receipts are validated semantically, then retained byte-for-byte in
// each isolated pass. This distinction is explicit in the reseal receipt.
export const V596_REBUILT_OUTPUTS = Object.freeze([
  "docs/release/v596/source-manifest-v596.json",
  "public/data/stellar-visible-leap-v596/manifest.json",
  "public/data/stellar-visible-leap-v596/current-state.json",
  "docs/release/v596/capability-pointer-v596.json",
  "dist/release/atlas-v596-standalone-build-resource.json",
  "dist/release/atlas-v596-lite-build-resource.json",
]);

export const V596_RETAINED_VALIDATED_OUTPUTS = Object.freeze(
  V596_RESEAL_OUTPUTS.filter((path) => !V596_REBUILT_OUTPUTS.includes(path)),
);

const V596_FORMAL_PATHS = Object.freeze({
  lifecycle: "docs/release/v596/resource-lifecycle-v596.json",
  soak: "docs/release/v596/soak-v596.json",
  lite: "docs/release/v596/lite-browser-matrix-v596.json",
  browserGate: "docs/release/v596/final-sealed-browser-gate-v596.json",
  human: "docs/release/v596/human-visual-signoff-v596.json",
  closure: "docs/release/v596/release-export-v596.json",
});

function uniquePaths(paths) {
  const values = [...paths];
  const unique = [...new Set(values)];
  assertV596Formal(
    unique.length === values.length,
    "v596-reseal-tracked-path-alias",
  );
  return Object.freeze(unique);
}

async function snapshot(root, paths) {
  const result = {};
  for (const path of paths) {
    const record = await fileReceiptV596Formal(root, path, `reseal:${path}`);
    result[path] = Object.freeze({ bytes: record.bytes, sha256: record.sha256 });
  }
  return Object.freeze(result);
}

function snapshotsEqual(first, second, paths) {
  return paths.every((path) => first[path]?.bytes === second[path]?.bytes
    && first[path]?.sha256 === second[path]?.sha256);
}

async function copyTrackedFile(sourceRoot, outputRoot, path) {
  const source = resolveInsideV596Workspace(
    sourceRoot,
    path,
    `reseal-copy-source:${path}`,
  );
  const output = resolveInsideV596Workspace(
    outputRoot,
    path,
    `reseal-copy-output:${path}`,
  );
  await fileReceiptV596Formal(sourceRoot, path, `reseal-copy-source:${path}`);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, await readFile(source), { flag: "wx" });
}

/**
 * Derives two isolated snapshots while preserving every formal workspace byte.
 * `buildCandidate` may only populate each supplied isolated output root. A
 * before/after formal snapshot makes an accidental formal write fail closed.
 */
export async function runV596IsolatedResealPasses({
  root = process.cwd(),
  trackedPaths,
  rebuiltPaths = V596_REBUILT_OUTPUTS,
  buildCandidate = buildV596StellarVisibleLeapCandidate,
} = {}) {
  const workspace = resolve(root);
  const tracked = uniquePaths([...(trackedPaths ?? [])]);
  assertV596Formal(tracked.length > 0, "v596-reseal-tracked-required");
  const rebuiltList = uniquePaths([...(rebuiltPaths ?? [])]);
  const rebuilt = new Set(rebuiltList);
  assertV596Formal(
    rebuiltList.every((path) => tracked.includes(path)),
    "v596-reseal-rebuilt-not-tracked",
  );
  const formalBefore = await snapshot(workspace, tracked);
  await mkdir(resolve(workspace, "tmp"), { recursive: true });
  const stagingRoot = await mkdtemp(resolve(workspace, "tmp", "v596-reseal-isolated-"));
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
    assertV596Formal(
      snapshotsEqual(firstPass, secondPass, tracked),
      "v596-reseal-byte-drift",
    );
    assertV596Formal(
      snapshotsEqual(formalBefore, secondPass, tracked),
      "v596-reseal-formal-derived-output-drift",
    );
    const formalAfter = await snapshot(workspace, tracked);
    assertV596Formal(
      snapshotsEqual(formalBefore, formalAfter, tracked),
      "v596-reseal-formal-output-mutated-during-validation",
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
    value: (await readJsonV596Formal(root, path, label)).value,
    record: await fileReceiptV596Formal(root, path, label),
  });
}

export function validateV596QualifiedClosure({ closure, bundle, loaded, raw }) {
  verifyV596FormalSeal(closure, "dossierSha256", "reseal-closure");
  assertV596Formal(
    closure.version === V596_CLOSURE_VERSION
      && closure.status === V596_CLOSURE_STATUS
      && closure.synthetic === false
      && closure.productionPromotionAllowed === false,
    "v596-reseal-closure-contract",
  );
  assertV596Formal(
    closure.qualification?.status === V596_QUALIFICATION_STATUS
      && closure.qualification?.sourceAndCandidateIdentityMutatedByQualification === false
      && closure.qualification?.productionPromotionAllowed === false,
    "v596-reseal-qualification-layer",
  );
  validateV596Identity(closure.candidate, bundle.identities.standalone, {
    deliveryTier: "standalone-full",
  });
  validateV596Identity(closure.qualification.candidate, bundle.identities.standalone, {
    deliveryTier: "standalone-full",
  });
  assertV596Authority(closure.authority, "reseal-closure");
  assertV596Formal(
    closure.governance?.parentV595Immutable === true
      && closure.governance?.priorV595HumanDecisionInherited === false
      && closure.governance?.currentV596HumanDecisionRequiredAndBound === true
      && closure.governance?.formalProductPointer === V596_FORMAL_PRODUCT_POINTER,
    "v596-reseal-closure-governance",
  );
  assertV596Formal(
    closure.parentV595?.sourceManifestSha256
        === V596_PARENT_V595_IDENTITY.sourceManifestSha256
      && closure.parentV595?.candidateManifestSha256
        === V596_PARENT_V595_IDENTITY.candidateManifestSha256
      && closure.parentV595?.releaseDossierSha256
        === V596_PARENT_V595_IDENTITY.releaseDossierSha256
      && closure.parentV595?.resealReceiptSha256
        === V596_PARENT_V595_IDENTITY.resealReceiptSha256
      && closure.parentV595?.immutable === true,
    "v596-reseal-parent-v595-binding",
  );
  assertV596Formal(
    sameCanonicalV596Formal(closure.unresolved, [
      "physical-mobile-real-device-evidence-not-present",
    ])
      && closure.gates?.physicalMobileNotPresentNotFaked === true
      && closure.browserGate?.physicalMobileStatus === "not-present-not-faked",
    "v596-reseal-physical-mobile-boundary",
  );
  assertV596Formal(
    closure.gates?.unknownAndZeroFailClosed === true
      && closure.gates?.fullLiteIndependentBuilds === true
      && closure.gates?.exactAbEightPairsSixteenFrames === true
      && closure.gates?.exactVisibleLeapBoundaryVerified === true
      && closure.gates?.stellarScienceCinematic24x2 === true
      && closure.gates?.sixProductSceneFamilyJourneys === true
      && closure.gates?.sameRealmLifecycle === true
      && closure.gates?.stellarExoplanetLifecycleV2ExactReturn === true
      && closure.gates?.cdpRendererHeapSoak === true
      && closure.gates?.humanVisualSignoff === true,
    "v596-reseal-closure-gates",
  );
  assertV596Formal(
    closure.lifecycle?.receiptSha256 === loaded.lifecycle.value.receiptSha256
      && closure.soak?.receiptSha256 === loaded.soak.value.receiptSha256
      && closure.liteBrowser?.receiptSha256 === loaded.lite.value.receiptSha256
      && closure.browserGate?.receiptSha256 === loaded.browserGate.value.receiptSha256
      && closure.humanReview?.receiptSha256 === loaded.human.value.receiptSha256
      && closure.humanReview?.decisionSha256 === loaded.human.value.decisionSha256
      && closure.humanReview?.priorV595HumanDecisionInherited === false,
    "v596-reseal-closure-receipt-binding",
  );
  assertV596Formal(
    closure.evidenceGraph?.recursivelyReopened === true
      && closure.evidenceGraph?.recordCount === raw.evidenceTracked.length
      && closure.evidenceGraph?.totalBytes === raw.totalBytes
      && sameCanonicalV596Formal(closure.evidenceGraph.records, raw.evidenceTracked)
      && sameCanonicalV596Formal(
        closure.evidenceGraph.historicalSnapshotReceipts,
        raw.historicalSnapshotReceipts,
      ),
    "v596-reseal-closure-raw-evidence-binding",
  );
  return closure;
}

async function validateFormalContext(workspace) {
  const bundle = await loadCurrentV596Bundle(workspace, { requireBuilds: true });
  assertV596Formal(
    bundle.source.identityStage === "ready-for-v596-delta-source-identity"
      && bundle.candidate.identityStage === "ready-for-formal-evidence-candidate-identity"
      && bundle.candidate.status === V596_READY_STATUS,
    "v596-reseal-current-identity-stage",
  );
  assertV596Formal(
    bundle.candidate.governance?.priorV595HumanDecisionInherited === false,
    "v596-reseal-prior-v595-human-decision",
  );
  const loaded = {};
  for (const [label, path] of Object.entries(V596_FORMAL_PATHS)) {
    loaded[label] = await load(workspace, path, label);
  }
  validateV596HumanSignoff(
    loaded.human.value,
    bundle.identities.standalone,
    { syntheticFixture: false },
  );
  validateV596ClosureInputs({
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
  const raw = await validateV596RawEvidenceGraph({
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
  validateV596QualifiedClosure({
    closure: loaded.closure.value,
    bundle,
    loaded,
    raw,
  });
  return Object.freeze({ bundle, loaded, raw });
}

async function deriveV596IdentityOutputs({
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
    ["standalone-full", "dist/release/atlas-v596-standalone-build-resource.json"],
    ["vercel-lite", "dist/release/atlas-v596-lite-build-resource.json"],
  ]) {
    const identity = loadV596ProfileIdentity({
      root: workspace,
      artifactRoot: outputRoot,
      requested,
      requireReady: true,
    });
    const receipt = createV596BuildReceipt(identity, { root: workspace });
    await atomicWriteJsonV596Formal(
      workspace,
      outputRoot,
      path,
      receipt,
      `reseal-build:${requested}`,
    );
  }
}

export async function doubleResealV596({
  root = process.cwd(),
  buildCandidate = buildV596StellarVisibleLeapCandidate,
  outputPath = V596_RESEAL_OUTPUT_PATH,
} = {}) {
  const workspace = resolve(root);
  const context = await validateFormalContext(workspace);
  const evidenceTracked = context.raw.evidenceTracked.filter(
    (record) => !V596_RESEAL_OUTPUTS.includes(record.path),
  );
  const trackedPaths = uniquePaths([
    ...V596_RESEAL_OUTPUTS,
    ...evidenceTracked.map((record) => record.path),
  ]);
  const passes = await runV596IsolatedResealPasses({
    root: workspace,
    trackedPaths,
    rebuiltPaths: V596_REBUILT_OUTPUTS,
    buildCandidate: ({ outputRoot }) => deriveV596IdentityOutputs({
      workspace,
      outputRoot,
      generatedAt: context.bundle.source.generatedAt,
      buildCandidate,
    }),
  });
  const unsigned = {
    version: V596_RESEAL_VERSION,
    generatedAt: context.bundle.source.generatedAt,
    timestampPolicy: "source-manifest-generated-at-explicit-no-wall-clock",
    status: V596_RESEAL_STATUS,
    qualificationStatus: V596_QUALIFICATION_STATUS,
    passes: 2,
    outputs: passes.outputs,
    firstPass: passes.firstPass,
    secondPass: passes.secondPass,
    rebuiltOutputs: V596_REBUILT_OUTPUTS,
    retainedValidatedOutputs: V596_RETAINED_VALIDATED_OUTPUTS,
    evidenceTracked,
    byteIdentical: true,
    candidate: context.bundle.identities.standalone,
    liteCandidate: context.bundle.identities.lite,
    closureDossierSha256: context.loaded.closure.value.dossierSha256,
    humanDecisionSha256: context.loaded.human.value.decisionSha256,
    parentV595: {
      ...V596_PARENT_V595_IDENTITY,
      immutable: true,
      relationship: "sealed-parent-not-current-build",
    },
    priorV595HumanDecisionInherited: false,
    formalProductPointer: V596_FORMAL_PRODUCT_POINTER,
    authority: { ...context.bundle.candidate.authority },
    scientificPayloadMutationAllowed: false,
    measuredAuthorityGranted: false,
    gpuAuthorityGranted: false,
    resolvedSurfaceAuthorityGranted: false,
    observationTextureAuthorityGranted: false,
    radiativeTransferGranted: false,
    grmhdGranted: false,
    productionPromotionAllowed: false,
    productionReleaseAuthorized: false,
    unresolved: ["physical-mobile-real-device-evidence-not-present"],
    synthetic: false,
  };
  assertV596Authority(unsigned.authority, "reseal");
  const receipt = sealV596FormalDocument(unsigned);
  await atomicWriteJsonV596Formal(
    workspace,
    workspace,
    outputPath,
    receipt,
    "reseal-output",
  );
  return receipt;
}

export function parseV596ResealArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--output") values.output = argv[++index];
    else throw new Error(`v596-reseal-argument:${token}`);
  }
  return values;
}

async function main() {
  const args = parseV596ResealArgs(process.argv.slice(2));
  const receipt = await doubleResealV596({ outputPath: args.output });
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

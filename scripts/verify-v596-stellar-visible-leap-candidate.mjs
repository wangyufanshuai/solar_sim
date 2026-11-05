import { lstat } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  assertKnownFiniteZeroV596,
  assertV596Authority,
  assertV596Formal,
  fileReceiptV596Formal,
  loadCurrentV596Bundle,
  readJsonV596Formal,
  resolveInsideV596Workspace,
  sameCanonicalV596Formal,
  validateV596Identity,
  verifyFileReceiptV596Formal,
  verifyV596FormalSeal,
  V596_FORMAL_PRODUCT_POINTER,
  V596_PARENT_V595_IDENTITY,
  V596_READY_STATUS,
} from "./v596-formal-contract.mjs";
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
import {
  V596_REBUILT_OUTPUTS,
  V596_RESEAL_OUTPUTS,
  V596_RESEAL_STATUS,
  V596_RESEAL_VERSION,
  V596_RETAINED_VALIDATED_OUTPUTS,
  validateV596QualifiedClosure,
} from "./seal-v596-stellar-visible-leap-candidate.mjs";

export const V596_VERIFIER_STATUS =
  "passed-readonly-qualified-additive-v596-stellar-visible-leap-candidate";

export const V596_VERIFIER_PATHS = Object.freeze({
  lifecycle: "docs/release/v596/resource-lifecycle-v596.json",
  soak: "docs/release/v596/soak-v596.json",
  lite: "docs/release/v596/lite-browser-matrix-v596.json",
  browserGate: "docs/release/v596/final-sealed-browser-gate-v596.json",
  human: "docs/release/v596/human-visual-signoff-v596.json",
  closure: "docs/release/v596/release-export-v596.json",
  reseal: "docs/release/v596/reseal-receipt-v596.json",
});

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const V596_READONLY_MAX_FILES = 8192;
const V596_READONLY_MAX_FILE_BYTES = 128 * 1024 * 1024;
const V596_READONLY_MAX_TOTAL_BYTES = 2 * 1024 * 1024 * 1024;
const V596_DECLARATION_MAX_CONTAINERS = 40000;
const V596_DECLARATION_MAX_JSON_FILES = 4096;

export function createV596ReadonlyResult(fields) {
  return Object.freeze({
    status: V596_VERIFIER_STATUS,
    ...fields,
    writesPerformed: false,
  });
}

function assertReceiptSnapshotRecord(record, label) {
  assertV596Formal(
    record && typeof record === "object" && !Array.isArray(record)
      && sameCanonicalV596Formal(Object.keys(record).sort(), ["bytes", "sha256"])
      && Number.isSafeInteger(record.bytes) && record.bytes >= 0
      && SHA256_PATTERN.test(record.sha256 ?? ""),
    `v596-verify-reseal-output-record:${label}`,
  );
}

export function assertV596ResealKeySet(outputs, expectedPaths) {
  assertV596Formal(
    outputs && typeof outputs === "object" && !Array.isArray(outputs),
    "v596-verify-reseal-output-shape",
  );
  assertV596Formal(Array.isArray(expectedPaths), "v596-verify-reseal-expected-shape");
  const observed = Object.keys(outputs).sort();
  const expected = [...new Set(expectedPaths)].sort();
  assertV596Formal(
    expected.length === expectedPaths.length,
    "v596-verify-reseal-expected-path-alias",
  );
  assertV596Formal(
    sameCanonicalV596Formal(observed, expected),
    "v596-verify-reseal-output-key-set",
  );
  for (const [path, record] of Object.entries(outputs)) {
    assertReceiptSnapshotRecord(record, path);
  }
}

/**
 * Finds file-receipt declarations without treating wide scalar arrays as a
 * recursive-evidence attack. Path safety is enforced when each path is read.
 */
export function declaredV596ReceiptPaths(value, paths = new Set()) {
  const pending = [value];
  const seen = new WeakSet();
  let containers = 0;
  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || typeof current !== "object" || seen.has(current)) continue;
    seen.add(current);
    containers += 1;
    assertV596Formal(
      containers <= V596_DECLARATION_MAX_CONTAINERS,
      "v596-verify-readonly-declaration-cap",
    );
    if (Array.isArray(current)) {
      for (const row of current) {
        if (row && typeof row === "object") pending.push(row);
      }
      continue;
    }
    if (typeof current.path === "string"
      && Number.isSafeInteger(current.bytes)
      && typeof current.sha256 === "string") {
      paths.add(current.path);
    }
    for (const row of Object.values(current)) {
      if (row && typeof row === "object") pending.push(row);
    }
  }
  return paths;
}

async function snapshotReadonlyFiles(root, paths) {
  const unique = [...new Set(paths)].sort();
  assertV596Formal(
    unique.length <= V596_READONLY_MAX_FILES,
    "v596-verify-readonly-file-count",
  );
  const result = {};
  let totalBytes = 0;
  for (const path of unique) {
    const absolute = resolveInsideV596Workspace(root, path, `readonly:${path}`);
    const [metadata, record] = await Promise.all([
      lstat(absolute),
      fileReceiptV596Formal(root, path, `readonly:${path}`),
    ]);
    assertV596Formal(
      record.bytes <= V596_READONLY_MAX_FILE_BYTES,
      `v596-verify-readonly-file-size:${path}`,
    );
    totalBytes += record.bytes;
    assertV596Formal(
      Number.isSafeInteger(totalBytes) && totalBytes <= V596_READONLY_MAX_TOTAL_BYTES,
      "v596-verify-readonly-total-size",
    );
    result[path] = Object.freeze({
      bytes: record.bytes,
      sha256: record.sha256,
      mtimeMs: metadata.mtimeMs,
    });
  }
  return Object.freeze(result);
}

export async function auditV596ReadonlyOperation({ root, paths, operation }) {
  assertV596Formal(typeof operation === "function", "v596-verify-readonly-operation");
  const before = await snapshotReadonlyFiles(root, paths);
  const result = await operation();
  const after = await snapshotReadonlyFiles(root, paths);
  assertV596Formal(
    sameCanonicalV596Formal(before, after),
    "v596-verify-readonly-files-mutated",
  );
  return result;
}

async function expandV596ReadonlyPaths(root, initialPaths, seedDocuments) {
  const paths = new Set(initialPaths);
  for (const document of seedDocuments) declaredV596ReceiptPaths(document, paths);
  const visitedJson = new Set();
  let pending = [...paths].filter((path) => path.endsWith(".json"));
  while (pending.length > 0) {
    const path = pending.pop();
    if (visitedJson.has(path)) continue;
    visitedJson.add(path);
    assertV596Formal(
      visitedJson.size <= V596_DECLARATION_MAX_JSON_FILES,
      "v596-verify-readonly-json-file-cap",
    );
    const record = await fileReceiptV596Formal(root, path, `readonly-discovery:${path}`);
    assertV596Formal(
      record.bytes <= V596_READONLY_MAX_FILE_BYTES,
      `v596-verify-readonly-json-size:${path}`,
    );
    const document = (await readJsonV596Formal(
      root,
      path,
      `readonly-discovery:${path}`,
    )).value;
    const previousSize = paths.size;
    declaredV596ReceiptPaths(document, paths);
    assertV596Formal(
      paths.size <= V596_READONLY_MAX_FILES,
      "v596-verify-readonly-file-count",
    );
    if (paths.size !== previousSize) {
      pending = pending.concat(
        [...paths].filter((candidate) => candidate.endsWith(".json")
          && !visitedJson.has(candidate)),
      );
    }
  }
  return Object.freeze([...paths].sort());
}

async function load(root, path, label) {
  return Object.freeze({
    value: (await readJsonV596Formal(root, path, label)).value,
    record: await fileReceiptV596Formal(root, path, label),
  });
}

function assertParentV595Binding(parent, label, { immutable = false } = {}) {
  assertV596Formal(
    parent?.sourceManifestSha256 === V596_PARENT_V595_IDENTITY.sourceManifestSha256
      && parent?.candidateManifestSha256
        === V596_PARENT_V595_IDENTITY.candidateManifestSha256
      && parent?.releaseDossierSha256 === V596_PARENT_V595_IDENTITY.releaseDossierSha256
      && parent?.resealReceiptSha256 === V596_PARENT_V595_IDENTITY.resealReceiptSha256
      && parent?.deploymentId === V596_PARENT_V595_IDENTITY.deploymentId
      && parent?.formalProductPointer === V596_FORMAL_PRODUCT_POINTER
      && (!immutable || parent?.immutable === true),
    `v596-verify-parent-v595-binding:${label}`,
  );
}

export function assertV596VerifierGovernance({
  candidate,
  browserGate,
  human,
  closure,
  reseal,
}) {
  assertV596Formal(
    candidate?.governance?.additiveOnly === true
      && candidate.governance.parentV595Immutable === true
      && candidate.governance.priorV595HumanDecisionInherited === false
      && candidate.formalProductPointer === V596_FORMAL_PRODUCT_POINTER,
    "v596-verify-governance:candidate",
  );
  assertParentV595Binding(candidate.parentV595, "candidate");
  assertV596Formal(
    browserGate?.priorV595HumanDecisionInherited === false
      && browserGate.boundaries?.priorV595HumanDecisionInherited === false
      && browserGate.boundaries?.priorV595HumanDecisionReceiptSha256 === null
      && browserGate.boundaries?.formalProductPointer === V596_FORMAL_PRODUCT_POINTER
      && browserGate.humanDecision === "separate-pending-not-generated",
    "v596-verify-governance:browser-gate",
  );
  assertV596Formal(
    human?.policy?.priorV595DecisionRejected === true
      && human.policy.priorV595HumanDecisionInherited === false
      && human.decisionChallenge?.priorV595HumanDecisionInherited === false,
    "v596-verify-governance:human",
  );
  assertParentV595Binding(human.parentV595, "human", { immutable: true });
  assertV596Formal(
    closure?.governance?.additiveOnly === true
      && closure.governance.parentV595Immutable === true
      && closure.governance.priorV595HumanDecisionInherited === false
      && closure.governance.currentV596HumanDecisionRequiredAndBound === true
      && closure.governance.formalProductPointer === V596_FORMAL_PRODUCT_POINTER
      && closure.humanReview?.priorV595HumanDecisionInherited === false,
    "v596-verify-governance:closure",
  );
  assertParentV595Binding(closure.parentV595, "closure", { immutable: true });
  assertV596Formal(
    reseal?.priorV595HumanDecisionInherited === false
      && reseal.formalProductPointer === V596_FORMAL_PRODUCT_POINTER,
    "v596-verify-governance:reseal",
  );
  assertParentV595Binding(reseal.parentV595, "reseal", { immutable: true });
  return true;
}

export function assertV596VerifierAuthority(documents) {
  for (const label of [
    "candidate",
    "lifecycle",
    "soak",
    "lite",
    "browserGate",
    "human",
    "closure",
    "reseal",
  ]) {
    assertV596Formal(documents?.[label], `v596-verify-authority-document:${label}`);
    assertV596Authority(documents[label].authority, `verify:${label}`);
  }
  assertV596Formal(
    documents.candidate.relativity?.inheritedWeakFieldDefaultKernel === "legacy-eih-1pn"
      && documents.candidate.relativity?.inheritedV2Mode === "shadow-only"
      && documents.browserGate.boundaries?.scientificPayloadMutationAllowed === false
      && documents.browserGate.boundaries?.productionPromotionAllowed === false
      && documents.human.policy?.scientificPayloadWriteback === false
      && documents.closure.productionPromotionAllowed === false
      && documents.reseal.scientificPayloadMutationAllowed === false
      && documents.reseal.measuredAuthorityGranted === false
      && documents.reseal.gpuAuthorityGranted === false
      && documents.reseal.resolvedSurfaceAuthorityGranted === false
      && documents.reseal.observationTextureAuthorityGranted === false
      && documents.reseal.radiativeTransferGranted === false
      && documents.reseal.grmhdGranted === false
      && documents.reseal.productionPromotionAllowed === false
      && documents.reseal.productionReleaseAuthorized === false,
    "v596-verify-authority-boundaries",
  );
  return true;
}

export function assertV596VerifierKnownZero({
  candidate,
  lifecycle,
  soak,
  browserGate,
  closure,
}) {
  assertKnownFiniteZeroV596(
    candidate?.stellar?.measurementAdmittedCount,
    "verifier:candidate:stellar-measurement-admitted",
  );
  assertKnownFiniteZeroV596(
    closure?.stellar?.measurementAdmittedCount,
    "verifier:closure:stellar-measurement-admitted",
  );
  assertKnownFiniteZeroV596(
    soak?.aggregation?.unknownShardCount,
    "verifier:soak:unknown-shard-count",
  );
  assertKnownFiniteZeroV596(
    soak?.aggregation?.failedShardCount,
    "verifier:soak:failed-shard-count",
  );
  assertV596Formal(
    lifecycle?.sampleCount === 17
      && lifecycle.stellarStateCount === 14
      && lifecycle.exactReturn === true
      && lifecycle.rawPrototypeCensusExactReturn === true
      && lifecycle.sameRealm === true
      && lifecycle.sameCanvas === true
      && lifecycle.singleCanvas === true
      && soak.rendererInfoAfterContextLoss === "explicitly-unavailable-not-zero"
      && closure.gates?.unknownAndZeroFailClosed === true,
    "v596-verify-known-zero-semantics",
  );
  assertV596Formal(
    browserGate?.supplemental?.physicalMobile?.status === "not-present-not-faked"
      && browserGate.supplemental.physicalMobile.evidence === null
      && browserGate.supplemental.physicalMobile.emulatedViewportSubstitutionAllowed === false
      && closure.gates?.physicalMobileNotPresentNotFaked === true
      && sameCanonicalV596Formal(closure.unresolved, [
        "physical-mobile-real-device-evidence-not-present",
      ]),
    "v596-verify-physical-mobile-not-faked",
  );
  return true;
}

export function assertV596VerifierResealBindings({ reseal, bundle, closure, human }) {
  assertV596Formal(
    reseal.generatedAt === bundle.source.generatedAt
      && reseal.qualificationStatus === V596_QUALIFICATION_STATUS
      && reseal.closureDossierSha256 === closure.dossierSha256
      && reseal.humanDecisionSha256 === human.decisionSha256,
    "v596-verify-reseal-current-evidence-binding",
  );
  validateV596Identity(reseal.candidate, bundle.identities.standalone, {
    deliveryTier: "standalone-full",
  });
  validateV596Identity(reseal.liteCandidate, bundle.identities.lite, {
    deliveryTier: "vercel-lite",
  });
  return true;
}

function normalizePathOverrides(paths) {
  assertV596Formal(
    paths && typeof paths === "object" && !Array.isArray(paths),
    "v596-verify-path-overrides-shape",
  );
  const allowed = new Set(Object.keys(V596_VERIFIER_PATHS));
  for (const key of Object.keys(paths)) {
    assertV596Formal(allowed.has(key), `v596-verify-path-override:${key}`);
  }
  return Object.freeze({ ...V596_VERIFIER_PATHS, ...paths });
}

function resealDeclaredKeyPaths(reseal) {
  const paths = [];
  for (const field of ["outputs", "firstPass", "secondPass"]) {
    if (reseal?.[field] && typeof reseal[field] === "object"
      && !Array.isArray(reseal[field])) paths.push(...Object.keys(reseal[field]));
  }
  return paths;
}

export async function verifyV596Readonly({
  root = process.cwd(),
  paths = {},
} = {}) {
  const workspace = resolve(root);
  const bundle = await loadCurrentV596Bundle(workspace, { requireBuilds: true });
  assertV596Formal(
    bundle.source.identityStage === "ready-for-v596-delta-source-identity"
      && bundle.candidate.identityStage === "ready-for-formal-evidence-candidate-identity"
      && bundle.candidate.status === V596_READY_STATUS,
    "v596-verify-current-identity-stage",
  );
  const resolvedPaths = normalizePathOverrides(paths);
  const loaded = {};
  for (const [label, path] of Object.entries(resolvedPaths)) {
    loaded[label] = await load(workspace, path, label);
  }

  const initialReadonlyPaths = [
    ...Object.values(bundle.paths),
    ...Object.values(resolvedPaths),
    ...(bundle.source.files ?? []).map((row) => row.path),
    ...(bundle.source.closureSourcePaths ?? []).map((row) => row.path),
    ...resealDeclaredKeyPaths(loaded.reseal.value),
  ];
  const readonlyPaths = await expandV596ReadonlyPaths(
    workspace,
    initialReadonlyPaths,
    Object.values(loaded).map((receipt) => receipt.value),
  );
  const readonlyPathSet = new Set(readonlyPaths);
  const readonlyBefore = await snapshotReadonlyFiles(workspace, readonlyPaths);

  const lifecycle = loaded.lifecycle.value;
  const soak = loaded.soak.value;
  const lite = loaded.lite.value;
  const browserGate = loaded.browserGate.value;
  const human = loaded.human.value;
  const closure = loaded.closure.value;
  const reseal = loaded.reseal.value;

  const humanResult = validateV596HumanSignoff(
    human,
    bundle.identities.standalone,
    { syntheticFixture: false },
  );
  await validateV596ClosureInputs({
    lifecycle,
    soak,
    lite,
    browserGate,
    human,
    candidate: bundle.candidate,
    expectedFullIdentity: bundle.identities.standalone,
    expectedLiteIdentity: bundle.identities.lite,
    syntheticFixture: false,
  });
  const raw = await validateV596RawEvidenceGraph({
    root: workspace,
    lifecycle,
    soak,
    lite,
    browserGate,
    human,
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
  for (const record of raw.evidenceTracked) {
    assertV596Formal(
      readonlyPathSet.has(record.path),
      `v596-verify-raw-evidence-not-presnapshotted:${record.path}`,
    );
  }

  validateV596QualifiedClosure({ closure, bundle, loaded, raw });
  assertV596Formal(
    closure.version === V596_CLOSURE_VERSION
      && closure.status === V596_CLOSURE_STATUS
      && closure.qualification?.version
        === "v596-stellar-visible-leap-qualification-layer-v1"
      && closure.qualification?.status === V596_QUALIFICATION_STATUS
      && closure.qualification?.sourceAndCandidateIdentityMutatedByQualification === false
      && closure.productionPromotionAllowed === false
      && closure.synthetic === false,
    "v596-verify-qualified-closure",
  );

  verifyV596FormalSeal(reseal, "receiptSha256", "verify-reseal");
  assertV596Formal(
    reseal.version === V596_RESEAL_VERSION
      && reseal.status === V596_RESEAL_STATUS
      && reseal.passes === 2
      && reseal.byteIdentical === true
      && reseal.timestampPolicy === "source-manifest-generated-at-explicit-no-wall-clock"
      && reseal.synthetic === false,
    "v596-verify-reseal-contract",
  );
  assertV596VerifierResealBindings({ reseal, bundle, closure, human });
  assertV596Formal(
    sameCanonicalV596Formal(reseal.rebuiltOutputs, V596_REBUILT_OUTPUTS)
      && sameCanonicalV596Formal(
        reseal.retainedValidatedOutputs,
        V596_RETAINED_VALIDATED_OUTPUTS,
      )
      && reseal.rebuiltOutputs.length + reseal.retainedValidatedOutputs.length
        === V596_RESEAL_OUTPUTS.length
      && sameCanonicalV596Formal(
        [...reseal.rebuiltOutputs, ...reseal.retainedValidatedOutputs].sort(),
        [...V596_RESEAL_OUTPUTS].sort(),
      ),
    "v596-verify-reseal-derivation-partition",
  );
  const expectedEvidence = raw.evidenceTracked.filter(
    (record) => !V596_RESEAL_OUTPUTS.includes(record.path),
  );
  assertV596Formal(
    sameCanonicalV596Formal(reseal.evidenceTracked, expectedEvidence),
    "v596-verify-reseal-evidence-tracked",
  );
  const expectedResealPaths = [
    ...V596_RESEAL_OUTPUTS,
    ...expectedEvidence.map((record) => record.path),
  ];
  assertV596ResealKeySet(reseal.outputs, expectedResealPaths);
  assertV596ResealKeySet(reseal.firstPass, expectedResealPaths);
  assertV596ResealKeySet(reseal.secondPass, expectedResealPaths);
  assertV596Formal(
    sameCanonicalV596Formal(reseal.outputs, reseal.secondPass)
      && sameCanonicalV596Formal(reseal.firstPass, reseal.secondPass),
    "v596-verify-reseal-double-pass",
  );
  for (const record of expectedEvidence) {
    assertV596Formal(
      sameCanonicalV596Formal(reseal.outputs[record.path], {
        bytes: record.bytes,
        sha256: record.sha256,
      }),
      `v596-verify-reseal-evidence-output:${record.path}`,
    );
  }
  for (const [path, record] of Object.entries(reseal.outputs)) {
    assertV596Formal(
      readonlyPathSet.has(path),
      `v596-verify-reseal-output-not-presnapshotted:${path}`,
    );
    await verifyFileReceiptV596Formal(
      workspace,
      { path, ...record },
      `reseal-output:${path}`,
    );
  }

  assertV596VerifierGovernance({
    candidate: bundle.candidate,
    browserGate,
    human,
    closure,
    reseal,
  });
  assertV596VerifierAuthority({
    candidate: bundle.candidate,
    lifecycle,
    soak,
    lite,
    browserGate,
    human,
    closure,
    reseal,
  });
  assertV596VerifierKnownZero({
    candidate: bundle.candidate,
    lifecycle,
    soak,
    browserGate,
    closure,
  });

  for (const row of bundle.source.files ?? []) {
    await verifyFileReceiptV596Formal(workspace, row, `source:${row.path}`);
  }
  for (const row of bundle.source.closureSourcePaths ?? []) {
    await verifyFileReceiptV596Formal(workspace, row, `closure-source:${row.path}`);
  }
  assertV596Formal(
    bundle.source.pendingClosurePaths?.length === 0
      && bundle.candidate.closure?.toolingComplete === true,
    "v596-verify-closure-tooling",
  );

  const readonlyAfter = await snapshotReadonlyFiles(workspace, readonlyPaths);
  assertV596Formal(
    sameCanonicalV596Formal(readonlyBefore, readonlyAfter),
    "v596-verify-readonly-files-mutated",
  );
  return createV596ReadonlyResult({
    sourceManifestSha256: bundle.source.receiptSha256,
    candidateManifestSha256: bundle.candidate.manifestSha256,
    deploymentId: bundle.deploymentId,
    buildId: bundle.identities.standalone.buildId,
    liteBuildId: bundle.identities.lite.buildId,
    closureDossierSha256: closure.dossierSha256,
    resealReceiptSha256: reseal.receiptSha256,
    humanDecisionSha256: humanResult.decisionSha256,
    verifiedRawEvidenceFileCount: raw.evidenceTracked.length,
    readonlySnapshotFileCount: Object.keys(readonlyBefore).length,
    unresolved: [...closure.unresolved],
  });
}

async function main() {
  assertV596Formal(process.argv.length === 2, "v596-verify-no-cli-mutation-arguments");
  const result = await verifyV596Readonly();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}

import { lstat } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  assertKnownFiniteZeroV595,
  assertV595Authority,
  assertV595Formal,
  fileReceiptV595Formal,
  loadCurrentV595Bundle,
  readJsonV595Formal,
  resolveInsideV595Workspace,
  sameCanonicalV595Formal,
  validateV595Identity,
  verifyFileReceiptV595Formal,
  verifyV595FormalSeal,
  V595_FORMAL_PRODUCT_POINTER,
  V595_PARENT_V594_IDENTITY,
  V595_READY_STATUS,
} from "./v595-formal-contract.mjs";
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
import {
  V595_REBUILT_OUTPUTS,
  V595_RESEAL_OUTPUTS,
  V595_RESEAL_STATUS,
  V595_RESEAL_VERSION,
  V595_RETAINED_VALIDATED_OUTPUTS,
  validateV595QualifiedClosure,
} from "./seal-v595-stellar-relativity-candidate.mjs";

export const V595_VERIFIER_STATUS =
  "passed-readonly-qualified-additive-v595-stellar-relativity-candidate";

export const V595_VERIFIER_PATHS = Object.freeze({
  lifecycle: "docs/release/v595/resource-lifecycle-v595.json",
  soak: "docs/release/v595/soak-v595.json",
  lite: "docs/release/v595/lite-browser-matrix-v595.json",
  browserGate: "docs/release/v595/final-sealed-browser-gate-v595.json",
  human: "docs/release/v595/human-visual-signoff-v595.json",
  closure: "docs/release/v595/release-export-v595.json",
  reseal: "docs/release/v595/reseal-receipt-v595.json",
});

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const V595_READONLY_MAX_FILES = 8192;
const V595_READONLY_MAX_FILE_BYTES = 128 * 1024 * 1024;
const V595_READONLY_MAX_TOTAL_BYTES = 2 * 1024 * 1024 * 1024;
const V595_DECLARATION_MAX_CONTAINERS = 40000;
const V595_DECLARATION_MAX_JSON_FILES = 4096;

export function createV595ReadonlyResult(fields) {
  return Object.freeze({
    status: V595_VERIFIER_STATUS,
    ...fields,
    writesPerformed: false,
  });
}

function assertReceiptSnapshotRecord(record, label) {
  assertV595Formal(
    record && typeof record === "object" && !Array.isArray(record)
      && sameCanonicalV595Formal(Object.keys(record).sort(), ["bytes", "sha256"])
      && Number.isSafeInteger(record.bytes) && record.bytes >= 0
      && SHA256_PATTERN.test(record.sha256 ?? ""),
    `v595-verify-reseal-output-record:${label}`,
  );
}

export function assertV595ResealKeySet(outputs, expectedPaths) {
  assertV595Formal(
    outputs && typeof outputs === "object" && !Array.isArray(outputs),
    "v595-verify-reseal-output-shape",
  );
  assertV595Formal(Array.isArray(expectedPaths), "v595-verify-reseal-expected-shape");
  const observed = Object.keys(outputs).sort();
  const expected = [...new Set(expectedPaths)].sort();
  assertV595Formal(
    expected.length === expectedPaths.length,
    "v595-verify-reseal-expected-path-alias",
  );
  assertV595Formal(
    sameCanonicalV595Formal(observed, expected),
    "v595-verify-reseal-output-key-set",
  );
  for (const [path, record] of Object.entries(outputs)) {
    assertReceiptSnapshotRecord(record, path);
  }
}

/**
 * Finds file-receipt declarations without treating wide scalar arrays as a
 * recursive-evidence attack. Path safety is enforced when each path is read.
 */
export function declaredV595ReceiptPaths(value, paths = new Set()) {
  const pending = [value];
  const seen = new WeakSet();
  let containers = 0;
  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || typeof current !== "object" || seen.has(current)) continue;
    seen.add(current);
    containers += 1;
    assertV595Formal(
      containers <= V595_DECLARATION_MAX_CONTAINERS,
      "v595-verify-readonly-declaration-cap",
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
  assertV595Formal(
    unique.length <= V595_READONLY_MAX_FILES,
    "v595-verify-readonly-file-count",
  );
  const result = {};
  let totalBytes = 0;
  for (const path of unique) {
    const absolute = resolveInsideV595Workspace(root, path, `readonly:${path}`);
    const [metadata, record] = await Promise.all([
      lstat(absolute),
      fileReceiptV595Formal(root, path, `readonly:${path}`),
    ]);
    assertV595Formal(
      record.bytes <= V595_READONLY_MAX_FILE_BYTES,
      `v595-verify-readonly-file-size:${path}`,
    );
    totalBytes += record.bytes;
    assertV595Formal(
      Number.isSafeInteger(totalBytes) && totalBytes <= V595_READONLY_MAX_TOTAL_BYTES,
      "v595-verify-readonly-total-size",
    );
    result[path] = Object.freeze({
      bytes: record.bytes,
      sha256: record.sha256,
      mtimeMs: metadata.mtimeMs,
    });
  }
  return Object.freeze(result);
}

export async function auditV595ReadonlyOperation({ root, paths, operation }) {
  assertV595Formal(typeof operation === "function", "v595-verify-readonly-operation");
  const before = await snapshotReadonlyFiles(root, paths);
  const result = await operation();
  const after = await snapshotReadonlyFiles(root, paths);
  assertV595Formal(
    sameCanonicalV595Formal(before, after),
    "v595-verify-readonly-files-mutated",
  );
  return result;
}

async function expandV595ReadonlyPaths(root, initialPaths, seedDocuments) {
  const paths = new Set(initialPaths);
  for (const document of seedDocuments) declaredV595ReceiptPaths(document, paths);
  const visitedJson = new Set();
  let pending = [...paths].filter((path) => path.endsWith(".json"));
  while (pending.length > 0) {
    const path = pending.pop();
    if (visitedJson.has(path)) continue;
    visitedJson.add(path);
    assertV595Formal(
      visitedJson.size <= V595_DECLARATION_MAX_JSON_FILES,
      "v595-verify-readonly-json-file-cap",
    );
    const record = await fileReceiptV595Formal(root, path, `readonly-discovery:${path}`);
    assertV595Formal(
      record.bytes <= V595_READONLY_MAX_FILE_BYTES,
      `v595-verify-readonly-json-size:${path}`,
    );
    const document = (await readJsonV595Formal(
      root,
      path,
      `readonly-discovery:${path}`,
    )).value;
    const previousSize = paths.size;
    declaredV595ReceiptPaths(document, paths);
    assertV595Formal(
      paths.size <= V595_READONLY_MAX_FILES,
      "v595-verify-readonly-file-count",
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
    value: (await readJsonV595Formal(root, path, label)).value,
    record: await fileReceiptV595Formal(root, path, label),
  });
}

function assertParentV594Binding(parent, label, { immutable = false } = {}) {
  assertV595Formal(
    parent?.sourceManifestSha256 === V595_PARENT_V594_IDENTITY.sourceManifestSha256
      && parent?.candidateManifestSha256
        === V595_PARENT_V594_IDENTITY.candidateManifestSha256
      && parent?.releaseDossierSha256 === V595_PARENT_V594_IDENTITY.releaseDossierSha256
      && parent?.resealReceiptSha256 === V595_PARENT_V594_IDENTITY.resealReceiptSha256
      && parent?.deploymentId === V595_PARENT_V594_IDENTITY.deploymentId
      && parent?.formalProductPointer === V595_FORMAL_PRODUCT_POINTER
      && (!immutable || parent?.immutable === true),
    `v595-verify-parent-v594-binding:${label}`,
  );
}

export function assertV595VerifierGovernance({
  candidate,
  browserGate,
  human,
  closure,
  reseal,
}) {
  assertV595Formal(
    candidate?.governance?.additiveOnly === true
      && candidate.governance.parentV594Immutable === true
      && candidate.governance.priorV594HumanDecisionInherited === false
      && candidate.formalProductPointer === V595_FORMAL_PRODUCT_POINTER,
    "v595-verify-governance:candidate",
  );
  assertParentV594Binding(candidate.parentV594, "candidate");
  assertV595Formal(
    browserGate?.priorV594HumanDecisionInherited === false
      && browserGate.boundaries?.priorV594HumanDecisionInherited === false
      && browserGate.boundaries?.priorV594HumanDecisionReceiptSha256 === null
      && browserGate.boundaries?.formalProductPointer === V595_FORMAL_PRODUCT_POINTER
      && browserGate.humanDecision === "separate-pending-not-generated",
    "v595-verify-governance:browser-gate",
  );
  assertV595Formal(
    human?.policy?.priorV594DecisionRejected === true
      && human.policy.priorV594HumanDecisionInherited === false
      && human.decisionChallenge?.priorV594HumanDecisionInherited === false,
    "v595-verify-governance:human",
  );
  assertParentV594Binding(human.parentV594, "human", { immutable: true });
  assertV595Formal(
    closure?.governance?.additiveOnly === true
      && closure.governance.parentV594Immutable === true
      && closure.governance.priorV594HumanDecisionInherited === false
      && closure.governance.currentV595HumanDecisionRequiredAndBound === true
      && closure.governance.formalProductPointer === V595_FORMAL_PRODUCT_POINTER
      && closure.humanReview?.priorV594HumanDecisionInherited === false,
    "v595-verify-governance:closure",
  );
  assertParentV594Binding(closure.parentV594, "closure", { immutable: true });
  assertV595Formal(
    reseal?.priorV594HumanDecisionInherited === false
      && reseal.formalProductPointer === V595_FORMAL_PRODUCT_POINTER,
    "v595-verify-governance:reseal",
  );
  assertParentV594Binding(reseal.parentV594, "reseal", { immutable: true });
  return true;
}

export function assertV595VerifierAuthority(documents) {
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
    assertV595Formal(documents?.[label], `v595-verify-authority-document:${label}`);
    assertV595Authority(documents[label].authority, `verify:${label}`);
  }
  assertV595Formal(
    documents.candidate.relativity?.inheritedWeakFieldDefaultKernel === "legacy-eih-1pn"
      && documents.candidate.relativity?.inheritedV2Mode === "shadow-only"
      && documents.browserGate.boundaries?.scientificPayloadMutationAllowed === false
      && documents.browserGate.boundaries?.productionPromotionAllowed === false
      && documents.human.policy?.scientificPayloadWriteback === false
      && documents.closure.productionPromotionAllowed === false
      && documents.reseal.scientificPayloadMutationAllowed === false
      && documents.reseal.measuredAuthorityGranted === false
      && documents.reseal.gpuAuthorityGranted === false
      && documents.reseal.radiativeTransferGranted === false
      && documents.reseal.grmhdGranted === false
      && documents.reseal.productionPromotionAllowed === false
      && documents.reseal.productionReleaseAuthorized === false,
    "v595-verify-authority-boundaries",
  );
  return true;
}

export function assertV595VerifierKnownZero({
  candidate,
  lifecycle,
  soak,
  browserGate,
  closure,
}) {
  assertKnownFiniteZeroV595(
    candidate?.stellar?.measurementAdmittedCount,
    "verifier:candidate:stellar-measurement-admitted",
  );
  assertKnownFiniteZeroV595(
    closure?.stellar?.measurementAdmittedCount,
    "verifier:closure:stellar-measurement-admitted",
  );
  assertKnownFiniteZeroV595(
    soak?.aggregation?.unknownShardCount,
    "verifier:soak:unknown-shard-count",
  );
  assertKnownFiniteZeroV595(
    soak?.aggregation?.failedShardCount,
    "verifier:soak:failed-shard-count",
  );
  assertV595Formal(
    lifecycle?.observations?.observedKnownZeroAfterDetach === true
      && lifecycle.observations.observedKnownZeroAfterExit === true
      && lifecycle.observations.rendererInfoAfterContextLoss
        === "explicitly-unavailable-not-zero"
      && soak.rendererInfoAfterContextLoss === "explicitly-unavailable-not-zero"
      && closure.gates?.unknownAndZeroFailClosed === true,
    "v595-verify-known-zero-semantics",
  );
  assertV595Formal(
    browserGate?.supplemental?.physicalMobile?.status === "not-present-not-faked"
      && browserGate.supplemental.physicalMobile.evidence === null
      && browserGate.supplemental.physicalMobile.emulatedViewportSubstitutionAllowed === false
      && closure.gates?.physicalMobileNotPresentNotFaked === true
      && sameCanonicalV595Formal(closure.unresolved, [
        "physical-mobile-real-device-evidence-not-present",
      ]),
    "v595-verify-physical-mobile-not-faked",
  );
  return true;
}

export function assertV595VerifierResealBindings({ reseal, bundle, closure, human }) {
  assertV595Formal(
    reseal.generatedAt === bundle.source.generatedAt
      && reseal.qualificationStatus === V595_QUALIFICATION_STATUS
      && reseal.closureDossierSha256 === closure.dossierSha256
      && reseal.humanDecisionSha256 === human.decisionSha256,
    "v595-verify-reseal-current-evidence-binding",
  );
  validateV595Identity(reseal.candidate, bundle.identities.standalone, {
    deliveryTier: "standalone-full",
  });
  validateV595Identity(reseal.liteCandidate, bundle.identities.lite, {
    deliveryTier: "vercel-lite",
  });
  return true;
}

function normalizePathOverrides(paths) {
  assertV595Formal(
    paths && typeof paths === "object" && !Array.isArray(paths),
    "v595-verify-path-overrides-shape",
  );
  const allowed = new Set(Object.keys(V595_VERIFIER_PATHS));
  for (const key of Object.keys(paths)) {
    assertV595Formal(allowed.has(key), `v595-verify-path-override:${key}`);
  }
  return Object.freeze({ ...V595_VERIFIER_PATHS, ...paths });
}

function resealDeclaredKeyPaths(reseal) {
  const paths = [];
  for (const field of ["outputs", "firstPass", "secondPass"]) {
    if (reseal?.[field] && typeof reseal[field] === "object"
      && !Array.isArray(reseal[field])) paths.push(...Object.keys(reseal[field]));
  }
  return paths;
}

export async function verifyV595Readonly({
  root = process.cwd(),
  paths = {},
} = {}) {
  const workspace = resolve(root);
  const bundle = await loadCurrentV595Bundle(workspace, { requireBuilds: true });
  assertV595Formal(
    bundle.source.identityStage === "ready-for-v595-delta-source-identity"
      && bundle.candidate.identityStage === "ready-for-formal-evidence-candidate-identity"
      && bundle.candidate.status === V595_READY_STATUS,
    "v595-verify-current-identity-stage",
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
  const readonlyPaths = await expandV595ReadonlyPaths(
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

  const humanResult = validateV595HumanSignoff(
    human,
    bundle.identities.standalone,
    { syntheticFixture: false },
  );
  await validateV595ClosureInputs({
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
  const raw = await validateV595RawEvidenceGraph({
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
    assertV595Formal(
      readonlyPathSet.has(record.path),
      `v595-verify-raw-evidence-not-presnapshotted:${record.path}`,
    );
  }

  validateV595QualifiedClosure({ closure, bundle, loaded, raw });
  assertV595Formal(
    closure.version === V595_CLOSURE_VERSION
      && closure.status === V595_CLOSURE_STATUS
      && closure.qualification?.version
        === "v595-stellar-relativity-qualification-layer-v1"
      && closure.qualification?.status === V595_QUALIFICATION_STATUS
      && closure.qualification?.sourceAndCandidateIdentityMutatedByQualification === false
      && closure.productionPromotionAllowed === false
      && closure.synthetic === false,
    "v595-verify-qualified-closure",
  );

  verifyV595FormalSeal(reseal, "receiptSha256", "verify-reseal");
  assertV595Formal(
    reseal.version === V595_RESEAL_VERSION
      && reseal.status === V595_RESEAL_STATUS
      && reseal.passes === 2
      && reseal.byteIdentical === true
      && reseal.timestampPolicy === "source-manifest-generated-at-explicit-no-wall-clock"
      && reseal.synthetic === false,
    "v595-verify-reseal-contract",
  );
  assertV595VerifierResealBindings({ reseal, bundle, closure, human });
  assertV595Formal(
    sameCanonicalV595Formal(reseal.rebuiltOutputs, V595_REBUILT_OUTPUTS)
      && sameCanonicalV595Formal(
        reseal.retainedValidatedOutputs,
        V595_RETAINED_VALIDATED_OUTPUTS,
      )
      && reseal.rebuiltOutputs.length + reseal.retainedValidatedOutputs.length
        === V595_RESEAL_OUTPUTS.length
      && sameCanonicalV595Formal(
        [...reseal.rebuiltOutputs, ...reseal.retainedValidatedOutputs].sort(),
        [...V595_RESEAL_OUTPUTS].sort(),
      ),
    "v595-verify-reseal-derivation-partition",
  );
  const expectedEvidence = raw.evidenceTracked.filter(
    (record) => !V595_RESEAL_OUTPUTS.includes(record.path),
  );
  assertV595Formal(
    sameCanonicalV595Formal(reseal.evidenceTracked, expectedEvidence),
    "v595-verify-reseal-evidence-tracked",
  );
  const expectedResealPaths = [
    ...V595_RESEAL_OUTPUTS,
    ...expectedEvidence.map((record) => record.path),
  ];
  assertV595ResealKeySet(reseal.outputs, expectedResealPaths);
  assertV595ResealKeySet(reseal.firstPass, expectedResealPaths);
  assertV595ResealKeySet(reseal.secondPass, expectedResealPaths);
  assertV595Formal(
    sameCanonicalV595Formal(reseal.outputs, reseal.secondPass)
      && sameCanonicalV595Formal(reseal.firstPass, reseal.secondPass),
    "v595-verify-reseal-double-pass",
  );
  for (const record of expectedEvidence) {
    assertV595Formal(
      sameCanonicalV595Formal(reseal.outputs[record.path], {
        bytes: record.bytes,
        sha256: record.sha256,
      }),
      `v595-verify-reseal-evidence-output:${record.path}`,
    );
  }
  for (const [path, record] of Object.entries(reseal.outputs)) {
    assertV595Formal(
      readonlyPathSet.has(path),
      `v595-verify-reseal-output-not-presnapshotted:${path}`,
    );
    await verifyFileReceiptV595Formal(
      workspace,
      { path, ...record },
      `reseal-output:${path}`,
    );
  }

  assertV595VerifierGovernance({
    candidate: bundle.candidate,
    browserGate,
    human,
    closure,
    reseal,
  });
  assertV595VerifierAuthority({
    candidate: bundle.candidate,
    lifecycle,
    soak,
    lite,
    browserGate,
    human,
    closure,
    reseal,
  });
  assertV595VerifierKnownZero({
    candidate: bundle.candidate,
    lifecycle,
    soak,
    browserGate,
    closure,
  });

  for (const row of bundle.source.files ?? []) {
    await verifyFileReceiptV595Formal(workspace, row, `source:${row.path}`);
  }
  for (const row of bundle.source.closureSourcePaths ?? []) {
    await verifyFileReceiptV595Formal(workspace, row, `closure-source:${row.path}`);
  }
  assertV595Formal(
    bundle.source.pendingClosurePaths?.length === 0
      && bundle.candidate.closure?.toolingComplete === true,
    "v595-verify-closure-tooling",
  );

  const readonlyAfter = await snapshotReadonlyFiles(workspace, readonlyPaths);
  assertV595Formal(
    sameCanonicalV595Formal(readonlyBefore, readonlyAfter),
    "v595-verify-readonly-files-mutated",
  );
  return createV595ReadonlyResult({
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
  assertV595Formal(process.argv.length === 2, "v595-verify-no-cli-mutation-arguments");
  const result = await verifyV595Readonly();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}

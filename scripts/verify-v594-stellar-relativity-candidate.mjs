import { lstat } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  assertV594,
  assertV594Authority,
  fileReceiptV594,
  loadCurrentV594Bundle,
  readJsonV594,
  resolveInsideV594Workspace,
  sameCanonicalV594,
  validateV594Identity,
  verifyFileReceiptV594,
  verifyV594Seal,
} from "./build-v594-current-source-lifecycle.mjs";
import {
  validateV594ClosureInputs,
  validateV594RawEvidenceGraph,
  V594_CLOSURE_STATUS,
  V594_CLOSURE_VERSION,
} from "./build-v594-closure-dossier.mjs";
import {
  V594_LIFECYCLE_RECEIPT_STATUS,
  V594_LIFECYCLE_RECEIPT_VERSION,
  V594_SCENE_EXIT_RELEASE_CONTRACT_VERSION,
} from "./build-v594-current-source-lifecycle.mjs";
import {
  validateV594SoakSemanticClosureContract,
  V594_SOAK_RECEIPT_STATUS,
  V594_SOAK_RECEIPT_VERSION,
} from "./build-v594-current-source-soak.mjs";
import {
  V594_BROWSER_GATE_STATUS,
  V594_BROWSER_GATE_VERSION,
} from "./build-v594-final-sealed-browser-gate.mjs";
import { validateV594HumanSignoff } from "./build-v594-human-visual-signoff.mjs";
import {
  V594_RESEAL_OUTPUTS,
  V594_RESEAL_STATUS,
  V594_RESEAL_VERSION,
} from "./seal-v594-stellar-relativity-candidate.mjs";

export const V594_VERIFIER_STATUS =
  "passed-readonly-qualified-additive-v594-stellar-relativity-candidate";

export function createV594ReadonlyResult(fields) {
  return Object.freeze({
    status: V594_VERIFIER_STATUS,
    ...fields,
    writesPerformed: false,
  });
}

export function assertV594ResealKeySet(outputs, expectedPaths) {
  assertV594(outputs && typeof outputs === "object" && !Array.isArray(outputs),
    "v594-verify-reseal-output-shape");
  const observed = Object.keys(outputs).sort();
  const expected = [...new Set(expectedPaths)].sort();
  assertV594(expected.length === expectedPaths.length,
    "v594-verify-reseal-expected-path-alias");
  assertV594(sameCanonicalV594(observed, expected),
    "v594-verify-reseal-output-key-set");
}

async function snapshotReadonlyFiles(root, paths) {
  const result = {};
  for (const path of [...new Set(paths)].sort()) {
    const absolute = resolveInsideV594Workspace(root, path, `readonly:${path}`);
    const [metadata, record] = await Promise.all([
      lstat(absolute),
      fileReceiptV594(root, path, `readonly:${path}`),
    ]);
    result[path] = Object.freeze({
      bytes: record.bytes,
      sha256: record.sha256,
      mtimeMs: metadata.mtimeMs,
    });
  }
  return result;
}

export async function auditV594ReadonlyOperation({ root, paths, operation }) {
  assertV594(typeof operation === "function", "v594-verify-readonly-operation");
  const before = await snapshotReadonlyFiles(root, paths);
  const result = await operation();
  const after = await snapshotReadonlyFiles(root, paths);
  assertV594(sameCanonicalV594(before, after), "v594-verify-readonly-files-mutated");
  return result;
}

export function declaredReceiptPaths(value, paths = new Set()) {
  const pending = [value];
  let containers = 0;
  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || typeof current !== "object") continue;
    containers += 1;
    assertV594(containers <= 20000, "v594-verify-readonly-declaration-cap");
    if (Array.isArray(current)) {
      for (const row of current) {
        if (row && typeof row === "object") pending.push(row);
      }
      continue;
    }
    if (typeof current.path === "string" && Number.isSafeInteger(current.bytes)
      && typeof current.sha256 === "string") paths.add(current.path);
    for (const row of Object.values(current)) {
      if (row && typeof row === "object") pending.push(row);
    }
  }
  return paths;
}

async function load(root, path, label) {
  const absolute = resolveInsideV594Workspace(root, path, label);
  return Object.freeze({
    value: (await readJsonV594(absolute, label)).value,
    record: await fileReceiptV594(root, path, label),
  });
}

function verifyAuthority(authority, label) {
  assertV594Authority(authority, label);
  assertV594(authority.scientificPayloadMutationAllowed === false
    && authority.productionReleaseAuthorized === false,
  `v594-verify-authority:${label}`);
}

export async function verifyV594Readonly({
  root = process.cwd(),
  paths = {},
} = {}) {
  const workspace = resolve(root);
  const bundle = await loadCurrentV594Bundle(workspace, { requireBuilds: true });
  verifyAuthority(bundle.candidate.authority, "candidate");
  assertV594(bundle.source.identityStage === "ready-for-formal-evidence-source-identity",
    "v594-verify-source-identity-stage");
  assertV594(bundle.candidate.identityStage === "ready-for-formal-evidence-candidate-identity"
    && bundle.candidate.status === "ready-for-v594-formal-evidence-not-promoted",
  "v594-verify-candidate-identity-stage");
  const defaults = {
    lifecycle: "docs/release/v594/resource-lifecycle-v594.json",
    soak: "docs/release/v594/soak-v594.json",
    lite: "docs/release/v594/lite-browser-matrix-v594.json",
    browserGate: "docs/release/v594/final-sealed-browser-gate-v594.json",
    human: "docs/release/v594/human-visual-signoff-v594.json",
    closure: "docs/release/v594/release-export-v594.json",
    reseal: "docs/release/v594/reseal-receipt-v594.json",
  };
  const loaded = {};
  for (const [label, path] of Object.entries({ ...defaults, ...paths })) loaded[label] = await load(workspace, path, label);
  const readonlyPaths = [
    ...Object.values({ ...defaults, ...paths }),
    ...(bundle.source.files ?? []).map((row) => row.path),
    ...(bundle.source.closureSourcePaths ?? []).map((row) => row.path),
  ];
  for (const receipt of Object.values(loaded)) {
    readonlyPaths.push(...declaredReceiptPaths(receipt.value));
  }
  const declaredRawJson = [
    loaded.lifecycle.value.evidence,
    loaded.soak.value.evidence,
    ...(loaded.soak.value.semanticEvidence ? [loaded.soak.value.semanticEvidence] : []),
    loaded.lite.value.evidence?.stage,
    loaded.lite.value.evidence?.batch,
    loaded.browserGate.value.matrices?.full?.stage,
    loaded.browserGate.value.matrices?.full?.batch,
    loaded.browserGate.value.matrices?.exactAb?.stage,
    loaded.browserGate.value.matrices?.exactAb?.batch,
    loaded.human.value.userDecision,
  ];
  for (const [index, record] of declaredRawJson.entries()) {
    assertV594(record && typeof record.path === "string",
      `v594-verify-raw-declaration:${index}`);
    const declared = (await readJsonV594(
      resolveInsideV594Workspace(workspace, record.path, `raw-declaration:${index}`),
      `raw-declaration:${index}`,
    )).value;
    readonlyPaths.push(record.path, ...declaredReceiptPaths(declared));
  }
  const readonlyBefore = await snapshotReadonlyFiles(workspace, readonlyPaths);
  const lifecycle = loaded.lifecycle.value;
  verifyV594Seal(lifecycle, "receiptSha256", "verify-lifecycle");
  assertV594(lifecycle.version === V594_LIFECYCLE_RECEIPT_VERSION
    && lifecycle.status === V594_LIFECYCLE_RECEIPT_STATUS
    && lifecycle.phaseCount === 9 && lifecycle.sameRealm === true
    && lifecycle.releaseContractVersion === V594_SCENE_EXIT_RELEASE_CONTRACT_VERSION
    && lifecycle.detachedObservedReleaseContract === true
    && lifecycle.exitedObservedReleaseContract === true
    && lifecycle.detachedRendererInfoCountsUnavailableAfterContextLoss === true
    && lifecycle.exitedRendererInfoCountsUnavailableAfterContextLoss === true
    && lifecycle.snapshotReuseWitness === true
    && lifecycle.detachedAndExitedSnapshotCanonicalEqual === true,
  "v594-verify-lifecycle-contract");
  validateV594Identity(lifecycle.candidate, bundle.identities.standalone, { deliveryTier: "standalone-full" });
  verifyAuthority(lifecycle.authority, "lifecycle");
  const soak = loaded.soak.value;
  verifyV594Seal(soak, "receiptSha256", "verify-soak");
  assertV594(soak.version === V594_SOAK_RECEIPT_VERSION
    && soak.status === V594_SOAK_RECEIPT_STATUS
    && soak.cycleCount === 40 && soak.sampleCount === 161
    && soak.sameRealm === true
    && soak.releaseContractVersion === V594_SCENE_EXIT_RELEASE_CONTRACT_VERSION
    && soak.detachedAndExitedObservedReleaseContract === true
    && soak.detachedAndExitedRendererInfoCountsUnavailableAfterContextLoss === true
    && soak.snapshotReuseWitness === true
    && soak.detachedAndExitedSnapshotCanonicalEqual === true
    && soak.releaseCompletionObserved === true
    && soak.releaseCompletionTransition === "next-link-route-exit"
    && soak.releaseCompletionObservedAfterPhase === "exited"
    && soak.releaseCompletionTeardownCanonicalEqualsExit === true
    && soak.detachedPreReleaseObserverReleased === null,
  "v594-verify-soak-contract");
  const semanticQualification = validateV594SoakSemanticClosureContract(soak);
  validateV594Identity(soak.candidate, bundle.identities.standalone, { deliveryTier: "standalone-full" });
  verifyAuthority(soak.authority, "soak");
  const lite = loaded.lite.value;
  verifyV594Seal(lite, "receiptSha256", "verify-lite");
  assertV594(lite.version === "v594-lite-browser-matrix-v1"
    && lite.status === "passed-current-v594-independent-8-frame-lite-automatic-gates"
    && lite.frameCount === 8,
  "v594-verify-lite-contract");
  validateV594Identity(lite.candidate, bundle.identities.lite, { deliveryTier: "vercel-lite" });
  assertV594(lite.candidate.buildId !== bundle.identities.standalone.buildId,
    "v594-verify-lite-alias");
  verifyAuthority(lite.authority, "lite");
  const browserGate = loaded.browserGate.value;
  verifyV594Seal(browserGate, "receiptSha256", "verify-browser-gate");
  assertV594(browserGate.version === V594_BROWSER_GATE_VERSION
    && browserGate.status === V594_BROWSER_GATE_STATUS
    && browserGate.fullLiteIndependentBuilds === true
    && browserGate.exactAbSameStandaloneBuild === true
    && browserGate.exactRelativityObservationMarkerVerified === true
    && browserGate.matrices?.exactAb?.relativityObservationMarkerVerified === true,
  "v594-verify-browser-gate-contract");
  validateV594Identity(browserGate.candidate, bundle.identities.standalone, { deliveryTier: "standalone-full" });
  verifyAuthority(browserGate.authority, "browser-gate");
  const human = loaded.human.value;
  const humanResult = validateV594HumanSignoff(human, bundle.identities.standalone, { syntheticFixture: false });
  assertV594(humanResult.challengeSha256 === human.decisionChallengeSha256,
    "v594-verify-human-challenge-binding");
  await validateV594ClosureInputs({
    lifecycle,
    soak,
    lite,
    browserGate,
    human,
    expectedFullIdentity: bundle.identities.standalone,
    expectedLiteIdentity: bundle.identities.lite,
    syntheticFixture: false,
  });
  const raw = await validateV594RawEvidenceGraph({
    root: workspace,
    lifecycle,
    soak,
    lite,
    browserGate,
    human,
    expectedFullIdentity: bundle.identities.standalone,
    expectedLiteIdentity: bundle.identities.lite,
    aggregateRecords: {
      lite: loaded.lite.record,
      browserGate: loaded.browserGate.record,
    },
    syntheticFixture: false,
  });
  for (const record of raw.evidenceTracked) readonlyPaths.push(record.path);
  const closure = loaded.closure.value;
  verifyV594Seal(closure, "dossierSha256", "verify-closure");
  assertV594(closure.version === V594_CLOSURE_VERSION && closure.status === V594_CLOSURE_STATUS
    && closure.productionPromotionAllowed === false && closure.unresolved?.length === 0,
  "v594-verify-closure-contract");
  assertV594(closure.qualification?.status
    === "qualified-additive-v594-stellar-relativity-candidate"
    && closure.qualification?.sourceIdentityStage
      === "ready-for-formal-evidence-source-identity"
    && closure.qualification?.candidateIdentityStage
      === "ready-for-formal-evidence-candidate-identity"
    && closure.qualification?.sourceAndCandidateIdentityMutatedByQualification === false,
  "v594-verify-qualification-layer");
  validateV594Identity(closure.qualification.candidate, bundle.identities.standalone, {
    deliveryTier: "standalone-full",
  });
  validateV594Identity(closure.candidate, bundle.identities.standalone, { deliveryTier: "standalone-full" });
  verifyAuthority(closure.authority, "closure");
  assertV594(closure.lifecycle?.receiptSha256 === lifecycle.receiptSha256
    && closure.soak?.receiptSha256 === soak.receiptSha256
    && closure.liteBrowser?.receiptSha256 === lite.receiptSha256
    && closure.browserGate?.receiptSha256 === browserGate.receiptSha256
    && closure.humanReview?.receiptSha256 === human.receiptSha256,
  "v594-verify-closure-receipt-bindings");
  assertV594(closure.browserGate?.exactRelativityObservationMarkerVerified === true
    && closure.gates?.exactRelativityObservationMarker === true
    && closure.gates?.releasedHeapRawQualification === true
    && closure.gates?.releasedHeapSemanticProofRequired
      === semanticQualification.semanticProofRequired
    && closure.gates?.releasedHeapSemanticProofSatisfied
      === semanticQualification.semanticProofSatisfied,
  "v594-verify-relativity-observation-marker");
  assertV594(sameCanonicalV594(closure.evidenceTracked, raw.evidenceTracked),
    "v594-verify-closure-raw-evidence-binding");
  const reseal = loaded.reseal.value;
  verifyV594Seal(reseal, "receiptSha256", "verify-reseal");
  assertV594(reseal.version === V594_RESEAL_VERSION
    && reseal.status === V594_RESEAL_STATUS
    && reseal.passes === 2 && reseal.byteIdentical === true
    && reseal.timestampPolicy === "source-manifest-generated-at-explicit-no-wall-clock",
  "v594-verify-reseal-contract");
  assertV594(reseal.formalProductPointer === "v263"
    && reseal.productionPromotionAllowed === false
    && reseal.scientificPayloadMutationAllowed === false,
  "v594-verify-reseal-authority");
  verifyAuthority(reseal.authority, "reseal");
  const expectedResealPaths = [
    ...V594_RESEAL_OUTPUTS,
    ...raw.evidenceTracked.map((record) => record.path)
      .filter((path) => !V594_RESEAL_OUTPUTS.includes(path)),
  ];
  assertV594ResealKeySet(reseal.outputs, expectedResealPaths);
  assertV594ResealKeySet(reseal.firstPass, expectedResealPaths);
  assertV594ResealKeySet(reseal.secondPass, expectedResealPaths);
  assertV594(sameCanonicalV594(reseal.evidenceTracked,
    raw.evidenceTracked.filter((record) => !V594_RESEAL_OUTPUTS.includes(record.path))),
  "v594-verify-reseal-evidence-tracked");
  for (const record of reseal.evidenceTracked) readonlyPaths.push(record.path);
  for (const [path, record] of Object.entries(reseal.outputs ?? {})) {
    await verifyFileReceiptV594(workspace, { path, ...record }, `reseal-output:${path}`);
  }
  assertV594(sameCanonicalV594(reseal.outputs, reseal.secondPass),
    "v594-verify-reseal-second-pass");
  assertV594(sameCanonicalV594(reseal.firstPass, reseal.secondPass),
    "v594-verify-reseal-double-pass");
  for (const row of bundle.source.files ?? []) await verifyFileReceiptV594(workspace, row, `source:${row.path}`);
  for (const row of bundle.source.closureSourcePaths ?? []) await verifyFileReceiptV594(workspace, row, `closure-source:${row.path}`);
  assertV594(bundle.source.pendingClosurePaths?.length === 0
    && bundle.candidate.closure?.toolingComplete === true,
  "v594-verify-closure-tooling");
  assertV594(bundle.candidate.stellar?.admission?.presentationAdmittedCount === 24
    && bundle.candidate.stellar?.admission?.measurementAdmittedCount === 0,
  "v594-verify-stellar-boundary");
  assertV594(bundle.candidate.relativity?.adaptiveConvergenceQualified === true
    && bundle.candidate.relativity?.promotionDecision === false,
  "v594-verify-relativity-boundary");
  const readonlyAfter = await snapshotReadonlyFiles(workspace, readonlyPaths);
  assertV594(sameCanonicalV594(readonlyBefore, readonlyAfter),
    "v594-verify-readonly-files-mutated");
  return createV594ReadonlyResult({
    sourceManifestSha256: bundle.source.receiptSha256,
    candidateManifestSha256: bundle.candidate.manifestSha256,
    deploymentId: bundle.deploymentId,
    buildId: bundle.identities.standalone.buildId,
    liteBuildId: bundle.identities.lite.buildId,
    closureDossierSha256: closure.dossierSha256,
    resealReceiptSha256: reseal.receiptSha256,
    humanDecisionSha256: human.decisionSha256,
    verifiedRawEvidenceFileCount: raw.evidenceTracked.length,
    readonlySnapshotFileCount: Object.keys(readonlyBefore).length,
  });
}

async function main() {
  const result = await verifyV594Readonly();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}

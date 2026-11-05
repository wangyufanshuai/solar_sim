import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  V596_ARTIFACT_PATHS,
  V596_AUTHORITY_FALSE_FIELDS,
  V596_BUILD_VERSION,
  V596_CANDIDATE_VERSION,
  V596_PARENT_V595_IDENTITY,
  V596_READY_STATUS,
  V596_SOURCE_VERSION,
  assertKnownFiniteZeroV596,
  assertV596Authority,
  assertV596EvidenceEnvelope,
  atomicWriteJsonV596Formal,
  canonicalShaV596Formal,
  fileReceiptV596Formal,
  resolveInsideV596Workspace,
  sealV596FormalDocument,
  validateV596BundleDocuments,
  validateV596Identity,
  verifyV596FormalSeal,
} from "./v596-formal-contract.mjs";
import {
  V596_CLOSURE_SOURCE_PATHS,
  V596_DELTA_SOURCE_PATHS,
  V596_PARENT_RETIRED_SOURCE_PATHS,
} from "./v596-source-paths.mjs";

const HEX_A = "a".repeat(64);
const HEX_B = "b".repeat(64);
const HEX_C = "c".repeat(64);

function identity(overrides = {}) {
  return {
    sourceManifestSha256: HEX_A,
    candidateManifestSha256: HEX_B,
    buildFingerprint: HEX_C,
    buildId: `v596b-${HEX_C}`,
    deploymentId: `v596-${HEX_A.slice(0, 12)}-${HEX_B.slice(0, 12)}`,
    formalProductPointer: "v263",
    deliveryTier: "standalone-full",
    bindingStatus: "bound",
    ...overrides,
  };
}

function authority(overrides = {}) {
  return {
    defaultKernel: "legacy-eih-1pn",
    v2Mode: "shadow-only",
    ...Object.fromEntries(V596_AUTHORITY_FALSE_FIELDS.map((field) => [field, false])),
    ...overrides,
  };
}

function bundleDocuments() {
  const generatedAt = "2026-08-28T00:00:00.000Z";
  const record = (path, state) => ({
    path,
    bytes: 10,
    sha256: canonicalShaV596Formal({ path }),
    ...(state ? { state } : {}),
  });
  const source = sealV596FormalDocument({
    version: V596_SOURCE_VERSION,
    generatedAt,
    identityStage: "ready-for-v596-delta-source-identity",
    status: "complete-explicit-v596-delta-retirement-and-closure-boundary",
    formalProductPointer: "v263",
    parentVersion: "v595",
    baseSourceManifestSha256: V596_PARENT_V595_IDENTITY.sourceManifestSha256,
    baseCandidateManifestSha256: V596_PARENT_V595_IDENTITY.candidateManifestSha256,
    baseReleaseDossierSha256: V596_PARENT_V595_IDENTITY.releaseDossierSha256,
    baseResealReceiptSha256: V596_PARENT_V595_IDENTITY.resealReceiptSha256,
    parentV595: {
      ...V596_PARENT_V595_IDENTITY,
      sourceFiles: 74,
      closureSourcePaths: 8,
    },
    parentRetiredOrReplacedPaths: V596_PARENT_RETIRED_SOURCE_PATHS.map((path) => ({
      path,
      parentBytes: 10,
      parentSha256: canonicalShaV596Formal({ path, parent: true }),
      currentState: "absent",
      disposition: "retired-parent-test-replacement",
      replacements: [],
    })),
    files: V596_DELTA_SOURCE_PATHS.map((path) => record(path)),
    closureSourcePaths: V596_CLOSURE_SOURCE_PATHS.map((path) => record(path, "present")),
    pendingClosurePaths: [],
  });
  const candidateAuthority = authority();
  const candidate = sealV596FormalDocument({
    version: V596_CANDIDATE_VERSION,
    generatedAt,
    identityStage: "ready-for-formal-evidence-candidate-identity",
    status: V596_READY_STATUS,
    route: "/",
    formalProductPointer: "v263",
    governance: {
      additiveOnly: true,
      parentV595Immutable: true,
      sourceManifestSha256: source.receiptSha256,
      parentSourceManifestSha256: V596_PARENT_V595_IDENTITY.sourceManifestSha256,
      parentCandidateManifestSha256: V596_PARENT_V595_IDENTITY.candidateManifestSha256,
      parentReleaseDossierSha256: V596_PARENT_V595_IDENTITY.releaseDossierSha256,
      parentResealReceiptSha256: V596_PARENT_V595_IDENTITY.resealReceiptSha256,
      legacyDefaultKernelFrozen: true,
      v2ShadowOnly: true,
      priorV595HumanDecisionInherited: false,
    },
    closure: {
      toolingComplete: true,
      sourcePaths: source.closureSourcePaths,
    },
    authority: candidateAuthority,
  }, "manifestSha256");
  const deploymentId =
    `v596-${source.receiptSha256.slice(0, 12)}-${candidate.manifestSha256.slice(0, 12)}`;
  const pointer = sealV596FormalDocument({
    version: "v596-stellar-visible-leap-capability-pointer-v1",
    generatedAt,
    identityStage: "ready-for-formal-evidence-capability-pointer-identity",
    status: V596_READY_STATUS,
    route: "/",
    sourceManifestSha256: source.receiptSha256,
    manifestSha256: candidate.manifestSha256,
    deploymentId,
    formalProductPointer: "v263",
    currentStateReceiptSha256: "9".repeat(64),
    productionPromotionAllowed: false,
    authority: candidateAuthority,
  }, "pointerSha256");
  const build = (tier, fingerprint) => sealV596FormalDocument({
    version: V596_BUILD_VERSION,
    status: "passed",
    generatedAt,
    sourceManifestSha256: source.receiptSha256,
    candidateManifestSha256: candidate.manifestSha256,
    buildFingerprint: fingerprint,
    buildId: `v596b-${fingerprint}`,
    deploymentId,
    formalProductPointer: "v263",
    deliveryTier: tier,
    parentV595: {
      sourceManifestSha256: V596_PARENT_V595_IDENTITY.sourceManifestSha256,
      candidateManifestSha256: V596_PARENT_V595_IDENTITY.candidateManifestSha256,
      relationship: "sealed-parent-not-current-build",
    },
    authority: {
      scientificAuthorityGranted: false,
      measuredAuthorityGranted: false,
      gpuAuthorityGranted: false,
      productionPromotionAllowed: false,
    },
  });
  return {
    source,
    candidate,
    pointer,
    standalone: build("standalone-full", "d".repeat(64)),
    lite: build("vercel-lite", "e".repeat(64)),
  };
}

test("canonical seals are deterministic and reject mutation", () => {
  const left = { beta: [3, { y: true, x: null }], alpha: 1 };
  const right = { alpha: 1, beta: [3, { x: null, y: true }] };
  assert.equal(canonicalShaV596Formal(left), canonicalShaV596Formal(right));
  const sealed = sealV596FormalDocument(left);
  assert.equal(verifyV596FormalSeal(sealed), sealed.receiptSha256);
  assert.throws(
    () => verifyV596FormalSeal({ ...sealed, alpha: 2 }),
    /v596-formal-seal-invalid/,
  );
  assert.throws(() => canonicalShaV596Formal({ value: undefined }),
    /v596-formal-canonical-undefined/);
  assert.throws(() => canonicalShaV596Formal({ value: Number.NaN }),
    /v596-formal-canonical-non-finite/);
});

test("identity and authority fail closed on aliasing or elevation", () => {
  assert.deepEqual(validateV596Identity(identity()), {
    sourceManifestSha256: HEX_A,
    candidateManifestSha256: HEX_B,
    buildFingerprint: HEX_C,
    buildId: `v596b-${HEX_C}`,
    deploymentId: `v596-${HEX_A.slice(0, 12)}-${HEX_B.slice(0, 12)}`,
    formalProductPointer: "v263",
    deliveryTier: "standalone-full",
  });
  assert.throws(
    () => validateV596Identity(identity({ buildId: `v595b-${HEX_C}` })),
    /v596-identity-build-id/,
  );
  assert.throws(
    () => validateV596Identity(identity({ bindingStatus: "unbound-production" })),
    /v596-identity-binding-status/,
  );
  assert.throws(
    () => validateV596Identity(identity({ deploymentId: V596_PARENT_V595_IDENTITY.deploymentId })),
    /v596-identity-deployment/,
  );
  assert.equal(assertV596Authority(authority()).defaultKernel, "legacy-eih-1pn");
  assert.throws(
    () => assertV596Authority(authority({ gpuAuthorityGranted: true })),
    /v596-authority-elevation:authority:gpuAuthorityGranted/,
  );
});

test("unknown and zero semantics are intentionally disjoint", () => {
  assert.doesNotThrow(() => assertKnownFiniteZeroV596(0, "observed"));
  for (const value of [null, undefined, "unknown", Number.NaN, -0, 1]) {
    assert.throws(() => assertKnownFiniteZeroV596(value, "observed"),
      /v596-unknown-zero:observed/);
  }
  assert.doesNotThrow(() => assertV596EvidenceEnvelope({
    formalEvidence: false,
    evidenceClaim: false,
    qualificationScope: "synthetic-test-only",
    promotion: "none",
    syntheticZeroClaim: false,
    fixture: { synthetic: true },
  }, { syntheticFixture: true }));
  assert.throws(() => assertV596EvidenceEnvelope({
    formalEvidence: true,
    evidenceClaim: true,
    qualificationScope: "formal-current-v596-test",
    promotion: "none",
    syntheticZeroClaim: false,
    fixture: { synthetic: true },
  }), /v596-synthetic-as-formal/);
});

test("workspace paths reject traversal and symlink escape; atomic writes stay inside", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "v596-formal-workspace-"));
  const outside = await mkdtemp(join(tmpdir(), "v596-formal-outside-"));
  try {
    await mkdir(join(workspace, "tmp"), { recursive: true });
    await writeFile(join(workspace, "tmp", "artifact.json"), "{}\n", "utf8");
    assert.throws(
      () => resolveInsideV596Workspace(workspace, "../outside.json"),
      /v596-formal-path/,
    );
    assert.throws(
      () => resolveInsideV596Workspace(workspace, "tmp\\artifact.json"),
      /v596-formal-path/,
    );
    await symlink(join(outside, "outside.json"), join(workspace, "tmp", "link.json"));
    await writeFile(join(outside, "outside.json"), "{}\n", "utf8");
    await assert.rejects(
      fileReceiptV596Formal(workspace, "tmp/link.json"),
      /v596-formal-file-not-regular|v596-formal-file-realpath-boundary/,
    );
    const path = await atomicWriteJsonV596Formal(
      workspace,
      workspace,
      "tmp/output.json",
      { ok: true },
    );
    assert.equal(JSON.parse(await readFile(path, "utf8")).ok, true);
    await assert.rejects(
      atomicWriteJsonV596Formal(workspace, outside, "escape.json", { no: true }),
      /v596-formal-output-boundary/,
    );
  } finally {
    await rm(workspace, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});

test("artifact paths use only the new v596 identity namespace", () => {
  assert.deepEqual(V596_ARTIFACT_PATHS, {
    source: "docs/release/v596/source-manifest-v596.json",
    candidate: "public/data/stellar-visible-leap-v596/manifest.json",
    pointer: "docs/release/v596/capability-pointer-v596.json",
    standalone: "dist/release/atlas-v596-standalone-build-resource.json",
    lite: "dist/release/atlas-v596-lite-build-resource.json",
  });
  assert.equal(
    Object.values(V596_ARTIFACT_PATHS).some((path) => path.includes("v594")),
    false,
  );
});

test("delta-on-v595 bundle documents bind a new v596 source, candidate, and both builds", () => {
  const documents = bundleDocuments();
  const validated = validateV596BundleDocuments(documents, { requireBuilds: true });
  assert.match(validated.deploymentId, /^v596-[0-9a-f]{12}-[0-9a-f]{12}$/);
  assert.equal(validated.identities.standalone.deliveryTier, "standalone-full");
  assert.equal(validated.identities.lite.deliveryTier, "vercel-lite");

  const parentDrift = structuredClone(documents);
  const unsigned = { ...parentDrift.source };
  delete unsigned.receiptSha256;
  unsigned.baseSourceManifestSha256 = "f".repeat(64);
  parentDrift.source = sealV596FormalDocument(unsigned);
  assert.throws(
    () => validateV596BundleDocuments(parentDrift, { requireBuilds: true }),
    /v596-bundle-source-parent-binding/,
  );
});

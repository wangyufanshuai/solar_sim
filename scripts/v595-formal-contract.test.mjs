import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  V595_ARTIFACT_PATHS,
  V595_AUTHORITY_FALSE_FIELDS,
  V595_BUILD_VERSION,
  V595_CANDIDATE_VERSION,
  V595_PARENT_V594_IDENTITY,
  V595_READY_STATUS,
  V595_SOURCE_VERSION,
  assertKnownFiniteZeroV595,
  assertV595Authority,
  assertV595EvidenceEnvelope,
  atomicWriteJsonV595Formal,
  canonicalShaV595Formal,
  fileReceiptV595Formal,
  resolveInsideV595Workspace,
  sealV595FormalDocument,
  validateV595BundleDocuments,
  validateV595Identity,
  verifyV595FormalSeal,
} from "./v595-formal-contract.mjs";
import {
  V595_CLOSURE_SOURCE_PATHS,
  V595_DELTA_SOURCE_PATHS,
} from "./v595-source-paths.mjs";

const HEX_A = "a".repeat(64);
const HEX_B = "b".repeat(64);
const HEX_C = "c".repeat(64);

function identity(overrides = {}) {
  return {
    sourceManifestSha256: HEX_A,
    candidateManifestSha256: HEX_B,
    buildFingerprint: HEX_C,
    buildId: `v595b-${HEX_C}`,
    deploymentId: `v595-${HEX_A.slice(0, 12)}-${HEX_B.slice(0, 12)}`,
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
    ...Object.fromEntries(V595_AUTHORITY_FALSE_FIELDS.map((field) => [field, false])),
    ...overrides,
  };
}

function bundleDocuments() {
  const generatedAt = "2026-08-28T00:00:00.000Z";
  const record = (path, state) => ({
    path,
    bytes: 10,
    sha256: canonicalShaV595Formal({ path }),
    ...(state ? { state } : {}),
  });
  const source = sealV595FormalDocument({
    version: V595_SOURCE_VERSION,
    generatedAt,
    identityStage: "ready-for-v595-delta-source-identity",
    status: "complete-explicit-v595-delta-and-closure-boundary",
    formalProductPointer: "v263",
    parentVersion: "v594",
    baseSourceManifestSha256: V595_PARENT_V594_IDENTITY.sourceManifestSha256,
    baseCandidateManifestSha256: V595_PARENT_V594_IDENTITY.candidateManifestSha256,
    baseReleaseDossierSha256: V595_PARENT_V594_IDENTITY.releaseDossierSha256,
    baseResealReceiptSha256: V595_PARENT_V594_IDENTITY.resealReceiptSha256,
    parentV594: {
      ...V595_PARENT_V594_IDENTITY,
      sourceFiles: 107,
      closureSourcePaths: 8,
    },
    files: V595_DELTA_SOURCE_PATHS.map((path) => record(path)),
    closureSourcePaths: V595_CLOSURE_SOURCE_PATHS.map((path) => record(path, "present")),
    pendingClosurePaths: [],
  });
  const candidateAuthority = authority();
  const candidate = sealV595FormalDocument({
    version: V595_CANDIDATE_VERSION,
    generatedAt,
    identityStage: "ready-for-formal-evidence-candidate-identity",
    status: V595_READY_STATUS,
    route: "/",
    formalProductPointer: "v263",
    governance: {
      additiveOnly: true,
      parentV594Immutable: true,
      sourceManifestSha256: source.receiptSha256,
      parentSourceManifestSha256: V595_PARENT_V594_IDENTITY.sourceManifestSha256,
      parentCandidateManifestSha256: V595_PARENT_V594_IDENTITY.candidateManifestSha256,
      parentReleaseDossierSha256: V595_PARENT_V594_IDENTITY.releaseDossierSha256,
      parentResealReceiptSha256: V595_PARENT_V594_IDENTITY.resealReceiptSha256,
      legacyDefaultKernelFrozen: true,
      v2ShadowOnly: true,
      priorV594HumanDecisionInherited: false,
    },
    closure: {
      toolingComplete: true,
      sourcePaths: source.closureSourcePaths,
    },
    authority: candidateAuthority,
  }, "manifestSha256");
  const deploymentId =
    `v595-${source.receiptSha256.slice(0, 12)}-${candidate.manifestSha256.slice(0, 12)}`;
  const pointer = sealV595FormalDocument({
    version: "v595-stellar-relativity-capability-pointer-v1",
    generatedAt,
    identityStage: "ready-for-formal-evidence-capability-pointer-identity",
    status: V595_READY_STATUS,
    route: "/",
    sourceManifestSha256: source.receiptSha256,
    manifestSha256: candidate.manifestSha256,
    deploymentId,
    formalProductPointer: "v263",
    currentStateReceiptSha256: "9".repeat(64),
    productionPromotionAllowed: false,
    authority: candidateAuthority,
  }, "pointerSha256");
  const build = (tier, fingerprint) => sealV595FormalDocument({
    version: V595_BUILD_VERSION,
    status: "passed",
    generatedAt,
    sourceManifestSha256: source.receiptSha256,
    candidateManifestSha256: candidate.manifestSha256,
    buildFingerprint: fingerprint,
    buildId: `v595b-${fingerprint}`,
    deploymentId,
    formalProductPointer: "v263",
    deliveryTier: tier,
    parentV594: {
      sourceManifestSha256: V595_PARENT_V594_IDENTITY.sourceManifestSha256,
      candidateManifestSha256: V595_PARENT_V594_IDENTITY.candidateManifestSha256,
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
  assert.equal(canonicalShaV595Formal(left), canonicalShaV595Formal(right));
  const sealed = sealV595FormalDocument(left);
  assert.equal(verifyV595FormalSeal(sealed), sealed.receiptSha256);
  assert.throws(
    () => verifyV595FormalSeal({ ...sealed, alpha: 2 }),
    /v595-formal-seal-invalid/,
  );
  assert.throws(() => canonicalShaV595Formal({ value: undefined }),
    /v595-formal-canonical-undefined/);
  assert.throws(() => canonicalShaV595Formal({ value: Number.NaN }),
    /v595-formal-canonical-non-finite/);
});

test("identity and authority fail closed on aliasing or elevation", () => {
  assert.deepEqual(validateV595Identity(identity()), {
    sourceManifestSha256: HEX_A,
    candidateManifestSha256: HEX_B,
    buildFingerprint: HEX_C,
    buildId: `v595b-${HEX_C}`,
    deploymentId: `v595-${HEX_A.slice(0, 12)}-${HEX_B.slice(0, 12)}`,
    formalProductPointer: "v263",
    deliveryTier: "standalone-full",
  });
  assert.throws(
    () => validateV595Identity(identity({ buildId: `v594b-${HEX_C}` })),
    /v595-identity-build-id/,
  );
  assert.throws(
    () => validateV595Identity(identity({ bindingStatus: "unbound-production" })),
    /v595-identity-binding-status/,
  );
  assert.throws(
    () => validateV595Identity(identity({ deploymentId: V595_PARENT_V594_IDENTITY.deploymentId })),
    /v595-identity-deployment/,
  );
  assert.equal(assertV595Authority(authority()).defaultKernel, "legacy-eih-1pn");
  assert.throws(
    () => assertV595Authority(authority({ gpuAuthorityGranted: true })),
    /v595-authority-elevation:authority:gpuAuthorityGranted/,
  );
});

test("unknown and zero semantics are intentionally disjoint", () => {
  assert.doesNotThrow(() => assertKnownFiniteZeroV595(0, "observed"));
  for (const value of [null, undefined, "unknown", Number.NaN, -0, 1]) {
    assert.throws(() => assertKnownFiniteZeroV595(value, "observed"),
      /v595-unknown-zero:observed/);
  }
  assert.doesNotThrow(() => assertV595EvidenceEnvelope({
    formalEvidence: false,
    evidenceClaim: false,
    qualificationScope: "synthetic-test-only",
    promotion: "none",
    syntheticZeroClaim: false,
    fixture: { synthetic: true },
  }, { syntheticFixture: true }));
  assert.throws(() => assertV595EvidenceEnvelope({
    formalEvidence: true,
    evidenceClaim: true,
    qualificationScope: "formal-current-v595-test",
    promotion: "none",
    syntheticZeroClaim: false,
    fixture: { synthetic: true },
  }), /v595-synthetic-as-formal/);
});

test("workspace paths reject traversal and symlink escape; atomic writes stay inside", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "v595-formal-workspace-"));
  const outside = await mkdtemp(join(tmpdir(), "v595-formal-outside-"));
  try {
    await mkdir(join(workspace, "tmp"), { recursive: true });
    await writeFile(join(workspace, "tmp", "artifact.json"), "{}\n", "utf8");
    assert.throws(
      () => resolveInsideV595Workspace(workspace, "../outside.json"),
      /v595-formal-path/,
    );
    assert.throws(
      () => resolveInsideV595Workspace(workspace, "tmp\\artifact.json"),
      /v595-formal-path/,
    );
    await symlink(join(outside, "outside.json"), join(workspace, "tmp", "link.json"));
    await writeFile(join(outside, "outside.json"), "{}\n", "utf8");
    await assert.rejects(
      fileReceiptV595Formal(workspace, "tmp/link.json"),
      /v595-formal-file-not-regular|v595-formal-file-realpath-boundary/,
    );
    const path = await atomicWriteJsonV595Formal(
      workspace,
      workspace,
      "tmp/output.json",
      { ok: true },
    );
    assert.equal(JSON.parse(await readFile(path, "utf8")).ok, true);
    await assert.rejects(
      atomicWriteJsonV595Formal(workspace, outside, "escape.json", { no: true }),
      /v595-formal-output-boundary/,
    );
  } finally {
    await rm(workspace, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});

test("artifact paths use only the new v595 identity namespace", () => {
  assert.deepEqual(V595_ARTIFACT_PATHS, {
    source: "docs/release/v595/source-manifest-v595.json",
    candidate: "public/data/stellar-relativity-v595/manifest.json",
    pointer: "docs/release/v595/capability-pointer-v595.json",
    standalone: "dist/release/atlas-v595-standalone-build-resource.json",
    lite: "dist/release/atlas-v595-lite-build-resource.json",
  });
  assert.equal(
    Object.values(V595_ARTIFACT_PATHS).some((path) => path.includes("v594")),
    false,
  );
});

test("delta-on-v594 bundle documents bind a new v595 source, candidate, and both builds", () => {
  const documents = bundleDocuments();
  const validated = validateV595BundleDocuments(documents, { requireBuilds: true });
  assert.match(validated.deploymentId, /^v595-[0-9a-f]{12}-[0-9a-f]{12}$/);
  assert.equal(validated.identities.standalone.deliveryTier, "standalone-full");
  assert.equal(validated.identities.lite.deliveryTier, "vercel-lite");

  const parentDrift = structuredClone(documents);
  const unsigned = { ...parentDrift.source };
  delete unsigned.receiptSha256;
  unsigned.baseSourceManifestSha256 = "f".repeat(64);
  parentDrift.source = sealV595FormalDocument(unsigned);
  assert.throws(
    () => validateV595BundleDocuments(parentDrift, { requireBuilds: true }),
    /v595-bundle-source-parent-binding/,
  );
});

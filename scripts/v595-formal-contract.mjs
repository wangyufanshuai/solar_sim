import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, realpath, rename, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

import { buildV595SourceManifest } from "./build-v595-source-manifest.mjs";
import {
  V595_CLOSURE_SOURCE_PATHS,
  V595_DELTA_SOURCE_PATHS,
} from "./v595-source-paths.mjs";

export const V595_FORMAL_PRODUCT_POINTER = "v263";
export const V595_SOURCE_VERSION = "v595-source-manifest-v1";
export const V595_CANDIDATE_VERSION =
  "v595-stellar-relativity-additive-candidate-v1";
export const V595_BUILD_VERSION = "v595-atlas-build-resource-receipt-v1";
export const V595_READY_STATUS = "ready-for-v595-formal-evidence-not-promoted";

export const V595_PARENT_V594_IDENTITY = Object.freeze({
  sourceManifestSha256:
    "6599398a6fab78a1367b234d3a3e9ed428027879a1df4838f76b97ff279b981f",
  candidateManifestSha256:
    "e92484940ba9a812d0936bbd67b29c4cb3c3ac20d9477cd04a949e35efd33bad",
  releaseDossierSha256:
    "a70645f4a124b6fb6d1eb3a061eb15cf66618154c1a2884acc1730cb41bd3865",
  resealReceiptSha256:
    "406bb72a58aade66c877c75f4bea220e8b42181217efee1e4d9a1d20b46e4664",
  deploymentId: "v594-6599398a6fab-e92484940ba9",
  formalProductPointer: V595_FORMAL_PRODUCT_POINTER,
});

export const V595_ARTIFACT_PATHS = Object.freeze({
  source: "docs/release/v595/source-manifest-v595.json",
  candidate: "public/data/stellar-relativity-v595/manifest.json",
  pointer: "docs/release/v595/capability-pointer-v595.json",
  standalone: "dist/release/atlas-v595-standalone-build-resource.json",
  lite: "dist/release/atlas-v595-lite-build-resource.json",
});

export const V595_AUTHORITY_FALSE_FIELDS = Object.freeze([
  "scientificAuthorityGranted",
  "scientificPayloadMutationAllowed",
  "measuredAuthorityGranted",
  "gpuAuthorityGranted",
  "radiativeTransferGranted",
  "grmhdGranted",
  "geometryReferenceGranted",
  "polarizationTransportReferenceGranted",
  "productionReleaseAuthorized",
  "productionPromotionAllowed",
]);

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const BUILD_ID_PATTERN = /^v595b-[0-9a-f]{64}$/;
const DEPLOYMENT_ID_PATTERN = /^v595-[0-9a-f]{12}-[0-9a-f]{12}$/;
const DELIVERY_TIERS = new Set(["standalone-full", "vercel-lite"]);

export function assertV595Formal(condition, code) {
  if (!condition) throw new Error(code);
}

export function canonicalizeV595Formal(value) {
  if (value === undefined) throw new Error("v595-formal-canonical-undefined");
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    assertV595Formal(Number.isFinite(value), "v595-formal-canonical-non-finite");
    return value;
  }
  if (Array.isArray(value)) return value.map(canonicalizeV595Formal);
  assertV595Formal(
    typeof value === "object"
      && (Object.getPrototypeOf(value) === Object.prototype
        || Object.getPrototypeOf(value) === null),
    "v595-formal-canonical-non-json-value",
  );
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, canonicalizeV595Formal(value[key])]),
  );
}

export function sha256V595Formal(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function canonicalShaV595Formal(value) {
  return sha256V595Formal(
    Buffer.from(JSON.stringify(canonicalizeV595Formal(value)), "utf8"),
  );
}

export function sameCanonicalV595Formal(left, right) {
  return canonicalShaV595Formal(left) === canonicalShaV595Formal(right);
}

export function sealV595FormalDocument(unsigned, field = "receiptSha256") {
  assertV595Formal(
    unsigned && typeof unsigned === "object" && !Array.isArray(unsigned),
    "v595-formal-seal-document-shape",
  );
  assertV595Formal(!(field in unsigned), `v595-formal-seal-field-present:${field}`);
  return Object.freeze({ ...unsigned, [field]: canonicalShaV595Formal(unsigned) });
}

export function verifyV595FormalSeal(
  document,
  field = "receiptSha256",
  label = "document",
) {
  assertV595Formal(
    document && typeof document === "object" && !Array.isArray(document),
    `v595-formal-seal-shape:${label}`,
  );
  assertV595Formal(
    SHA256_PATTERN.test(document[field] ?? ""),
    `v595-formal-seal-value:${label}`,
  );
  const unsigned = { ...document };
  delete unsigned[field];
  assertV595Formal(
    canonicalShaV595Formal(unsigned) === document[field],
    `v595-formal-seal-invalid:${label}`,
  );
  return document[field];
}

function isCanonicalRelativePath(value) {
  return typeof value === "string"
    && value.length > 0
    && !value.includes("\\")
    && !isAbsolute(value)
    && value.split("/").every((part) => part.length > 0 && part !== "." && part !== "..");
}

export function resolveInsideV595Workspace(root, value, label = "path") {
  assertV595Formal(isCanonicalRelativePath(value), `v595-formal-path:${label}`);
  const workspace = resolve(root);
  const path = resolve(workspace, value);
  const relation = relative(workspace, path);
  assertV595Formal(
    relation !== "" && relation !== ".." && !relation.startsWith(`..${sep}`)
      && !isAbsolute(relation),
    `v595-formal-boundary:${label}`,
  );
  return path;
}

export async function resolveV595OutputRoot(
  root,
  outputRoot = root,
  label = "output-root",
) {
  const workspace = resolve(root);
  const destination = isAbsolute(outputRoot)
    ? resolve(outputRoot)
    : resolve(workspace, outputRoot);
  const relation = relative(workspace, destination);
  assertV595Formal(
    destination === workspace || (relation !== ".." && !relation.startsWith(`..${sep}`)
      && !isAbsolute(relation)),
    `v595-formal-output-boundary:${label}`,
  );
  await mkdir(destination, { recursive: true });
  const [realWorkspace, realDestination] = await Promise.all([
    realpath(workspace),
    realpath(destination),
  ]);
  const realRelation = relative(realWorkspace, realDestination);
  assertV595Formal(
    realDestination === realWorkspace || (realRelation !== ".."
      && !realRelation.startsWith(`..${sep}`) && !isAbsolute(realRelation)),
    `v595-formal-output-realpath-boundary:${label}`,
  );
  return realDestination;
}

async function assertRegularWorkspaceFile(root, path, label) {
  const metadata = await lstat(path);
  assertV595Formal(
    metadata.isFile() && !metadata.isSymbolicLink(),
    `v595-formal-file-not-regular:${label}`,
  );
  const [realWorkspace, realFile] = await Promise.all([
    realpath(resolve(root)),
    realpath(path),
  ]);
  const relation = relative(realWorkspace, realFile);
  assertV595Formal(
    relation !== "" && relation !== ".." && !relation.startsWith(`..${sep}`)
      && !isAbsolute(relation),
    `v595-formal-file-realpath-boundary:${label}`,
  );
}

export async function readJsonV595Formal(root, value, label = "json") {
  const path = resolveInsideV595Workspace(root, value, label);
  await assertRegularWorkspaceFile(root, path, label);
  const bytes = await readFile(path);
  let document;
  try {
    document = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`v595-formal-json:${label}:${String(error)}`);
  }
  return Object.freeze({ path, bytes, value: document });
}

export async function fileReceiptV595Formal(root, value, label = "artifact") {
  const path = resolveInsideV595Workspace(root, value, label);
  await assertRegularWorkspaceFile(root, path, label);
  const bytes = await readFile(path);
  return Object.freeze({
    path: relative(resolve(root), path).replaceAll("\\", "/"),
    bytes: bytes.byteLength,
    sha256: sha256V595Formal(bytes),
  });
}

export async function verifyFileReceiptV595Formal(root, record, label = "artifact") {
  assertV595Formal(
    record && isCanonicalRelativePath(record.path)
      && Number.isSafeInteger(record.bytes) && record.bytes >= 0
      && SHA256_PATTERN.test(record.sha256 ?? ""),
    `v595-formal-file-record:${label}`,
  );
  const observed = await fileReceiptV595Formal(root, record.path, label);
  assertV595Formal(
    observed.path === record.path && observed.bytes === record.bytes
      && observed.sha256 === record.sha256,
    `v595-formal-file-drift:${label}`,
  );
  return observed;
}

export async function atomicWriteJsonV595Formal(
  root,
  outputRoot,
  value,
  document,
  label = "output",
) {
  const workspace = resolve(root);
  const destination = await resolveV595OutputRoot(workspace, outputRoot, label);
  const path = resolveInsideV595Workspace(destination, value, label);
  const parent = dirname(path);
  await mkdir(parent, { recursive: true });
  const realParent = await realpath(parent);
  const relation = relative(await realpath(workspace), realParent);
  assertV595Formal(
    relation === "" || (relation !== ".." && !relation.startsWith(`..${sep}`)
      && !isAbsolute(relation)),
    `v595-formal-output-parent-boundary:${label}`,
  );
  const partial = `${path}.${process.pid}.part`;
  await rm(partial, { force: true });
  try {
    await writeFile(partial, `${JSON.stringify(document, null, 2)}\n`, {
      encoding: "utf8",
      flag: "wx",
    });
    await rename(partial, path);
  } finally {
    await rm(partial, { force: true });
  }
  return path;
}

export function normalizeV595Identity(identity) {
  return Object.freeze({
    sourceManifestSha256:
      identity?.sourceManifestSha256 ?? identity?.sourceSha256 ?? null,
    candidateManifestSha256:
      identity?.candidateManifestSha256 ?? identity?.candidateSha256
        ?? identity?.manifestSha256 ?? null,
    buildId: identity?.buildId ?? null,
    buildFingerprint: identity?.buildFingerprint ?? null,
    deploymentId: identity?.deploymentId ?? null,
    formalProductPointer: identity?.formalProductPointer ?? null,
    deliveryTier: identity?.deliveryTier ?? null,
  });
}

export function validateV595Identity(identity, expected = null, options = {}) {
  const normalized = normalizeV595Identity(identity);
  assertV595Formal(
    SHA256_PATTERN.test(normalized.sourceManifestSha256 ?? ""),
    "v595-identity-source",
  );
  assertV595Formal(
    SHA256_PATTERN.test(normalized.candidateManifestSha256 ?? ""),
    "v595-identity-candidate",
  );
  assertV595Formal(
    SHA256_PATTERN.test(normalized.buildFingerprint ?? ""),
    "v595-identity-build-fingerprint",
  );
  assertV595Formal(BUILD_ID_PATTERN.test(normalized.buildId ?? ""), "v595-identity-build-id");
  assertV595Formal(
    normalized.buildId === `v595b-${normalized.buildFingerprint}`,
    "v595-identity-build-binding",
  );
  assertV595Formal(
    DEPLOYMENT_ID_PATTERN.test(normalized.deploymentId ?? ""),
    "v595-identity-deployment",
  );
  assertV595Formal(
    normalized.deploymentId
      === `v595-${normalized.sourceManifestSha256.slice(0, 12)}-${normalized.candidateManifestSha256.slice(0, 12)}`,
    "v595-identity-deployment-binding",
  );
  assertV595Formal(
    normalized.formalProductPointer === V595_FORMAL_PRODUCT_POINTER,
    "v595-identity-formal-product-pointer",
  );
  assertV595Formal(
    DELIVERY_TIERS.has(normalized.deliveryTier),
    "v595-identity-delivery-tier",
  );
  if (identity?.bindingStatus !== undefined) {
    assertV595Formal(identity.bindingStatus === "bound", "v595-identity-binding-status");
  }
  if (options.deliveryTier) {
    assertV595Formal(
      normalized.deliveryTier === options.deliveryTier,
      "v595-identity-wrong-tier",
    );
  }
  if (expected) {
    const expectedNormalized = normalizeV595Identity(expected);
    for (const [field, value] of Object.entries(normalized)) {
      assertV595Formal(
        value === expectedNormalized[field],
        `v595-identity-drift:${field}`,
      );
    }
  }
  return normalized;
}

export function assertV595Authority(authority, label = "authority") {
  assertV595Formal(
    authority && typeof authority === "object" && !Array.isArray(authority),
    `v595-authority-shape:${label}`,
  );
  assertV595Formal(
    authority.defaultKernel === "legacy-eih-1pn",
    `v595-authority-kernel:${label}`,
  );
  assertV595Formal(
    authority.v2Mode === "shadow-only",
    `v595-authority-v2-mode:${label}`,
  );
  for (const field of V595_AUTHORITY_FALSE_FIELDS) {
    assertV595Formal(
      authority[field] === false,
      `v595-authority-elevation:${label}:${field}`,
    );
  }
  return authority;
}

export function assertV595BuildAuthority(authority, label = "build-authority") {
  assertV595Formal(
    authority && typeof authority === "object" && !Array.isArray(authority),
    `v595-build-authority-shape:${label}`,
  );
  for (const field of [
    "scientificAuthorityGranted",
    "measuredAuthorityGranted",
    "gpuAuthorityGranted",
    "productionPromotionAllowed",
  ]) {
    assertV595Formal(
      authority[field] === false,
      `v595-build-authority-elevation:${label}:${field}`,
    );
  }
  return authority;
}

export function assertKnownFiniteZeroV595(value, label) {
  assertV595Formal(
    typeof value === "number" && Number.isFinite(value) && Object.is(value, 0),
    `v595-unknown-zero:${label}`,
  );
}

export function assertKnownNonNegativeV595(value, label) {
  assertV595Formal(
    typeof value === "number" && Number.isFinite(value) && value >= 0,
    `v595-unknown-nonnegative:${label}`,
  );
}

export function assertKnownPositiveV595(value, label) {
  assertV595Formal(
    typeof value === "number" && Number.isFinite(value) && value > 0,
    `v595-unknown-positive:${label}`,
  );
}

export function assertV595EvidenceEnvelope(stage, options = {}) {
  const syntheticFixture = options.syntheticFixture === true;
  if (syntheticFixture) {
    assertV595Formal(stage.fixture?.synthetic === true, "v595-synthetic-fixture-marker");
    assertV595Formal(stage.formalEvidence === false, "v595-synthetic-formal-evidence");
    assertV595Formal(stage.evidenceClaim === false, "v595-synthetic-evidence-claim");
    assertV595Formal(
      stage.qualificationScope === "synthetic-test-only",
      "v595-synthetic-qualification-scope",
    );
  } else {
    assertV595Formal(stage.fixture?.synthetic !== true, "v595-synthetic-as-formal");
    assertV595Formal(stage.formalEvidence === true, "v595-formal-evidence-required");
    assertV595Formal(stage.evidenceClaim === true, "v595-formal-evidence-claim");
    assertV595Formal(
      typeof stage.qualificationScope === "string"
        && stage.qualificationScope.startsWith("formal-current-v595-"),
      "v595-formal-qualification-scope",
    );
  }
  assertV595Formal(stage.promotion === "none", "v595-formal-promotion-boundary");
  assertV595Formal(stage.syntheticZeroClaim === false, "v595-formal-synthetic-zero-claim");
  return Object.freeze({ syntheticFixture, formalEvidence: !syntheticFixture });
}

function assertIsoTimestamp(value, label) {
  assertV595Formal(
    typeof value === "string" && Number.isFinite(Date.parse(value)),
    `v595-formal-timestamp:${label}`,
  );
}

function assertFileRows(rows, expectedPaths, label, stateRequired) {
  assertV595Formal(Array.isArray(rows), `v595-bundle-file-rows:${label}`);
  const paths = rows.map((row) => row?.path);
  assertV595Formal(
    sameCanonicalV595Formal([...paths].sort(), [...expectedPaths].sort()),
    `v595-bundle-file-order:${label}`,
  );
  assertV595Formal(
    new Set(paths).size === paths.length,
    `v595-bundle-file-duplicates:${label}`,
  );
  for (const row of rows) {
    assertV595Formal(
      row && isCanonicalRelativePath(row.path)
        && Number.isSafeInteger(row.bytes) && row.bytes > 0
        && SHA256_PATTERN.test(row.sha256 ?? "")
        && (!stateRequired || row.state === "present"),
      `v595-bundle-file-record:${label}:${row?.path ?? "unknown"}`,
    );
  }
}

function validateV595BuildDocument(build, source, candidate, tier) {
  verifyV595FormalSeal(build, "receiptSha256", `build:${tier}`);
  assertV595Formal(
    build.version === V595_BUILD_VERSION && build.status === "passed",
    `v595-bundle-build-contract:${tier}`,
  );
  assertV595Formal(
    build.generatedAt === source.generatedAt
      && build.sourceManifestSha256 === source.receiptSha256
      && build.candidateManifestSha256 === candidate.manifestSha256
      && build.formalProductPointer === V595_FORMAL_PRODUCT_POINTER
      && build.deliveryTier === tier,
    `v595-bundle-build-binding:${tier}`,
  );
  assertV595Formal(
    build.parentV594?.sourceManifestSha256
      === V595_PARENT_V594_IDENTITY.sourceManifestSha256
      && build.parentV594?.candidateManifestSha256
        === V595_PARENT_V594_IDENTITY.candidateManifestSha256
      && build.parentV594?.relationship === "sealed-parent-not-current-build",
    `v595-bundle-build-parent:${tier}`,
  );
  assertV595BuildAuthority(build.authority, tier);
  return validateV595Identity(build, null, { deliveryTier: tier });
}

export function validateV595BundleDocuments(documents, options = {}) {
  const { source, candidate, pointer, standalone = null, lite = null } = documents ?? {};
  verifyV595FormalSeal(source, "receiptSha256", "source");
  verifyV595FormalSeal(candidate, "manifestSha256", "candidate");
  verifyV595FormalSeal(pointer, "pointerSha256", "pointer");
  assertIsoTimestamp(source.generatedAt, "source");
  assertV595Formal(
    source.version === V595_SOURCE_VERSION
      && source.identityStage === "ready-for-v595-delta-source-identity"
      && source.status === "complete-explicit-v595-delta-and-closure-boundary"
      && source.formalProductPointer === V595_FORMAL_PRODUCT_POINTER
      && source.parentVersion === "v594",
    "v595-bundle-source-contract",
  );
  assertV595Formal(
    source.baseSourceManifestSha256 === V595_PARENT_V594_IDENTITY.sourceManifestSha256
      && source.baseCandidateManifestSha256
        === V595_PARENT_V594_IDENTITY.candidateManifestSha256
      && source.baseReleaseDossierSha256
        === V595_PARENT_V594_IDENTITY.releaseDossierSha256
      && source.baseResealReceiptSha256
        === V595_PARENT_V594_IDENTITY.resealReceiptSha256,
    "v595-bundle-source-parent-binding",
  );
  assertV595Formal(
    source.parentV594?.sourceManifestSha256
      === V595_PARENT_V594_IDENTITY.sourceManifestSha256
      && source.parentV594?.candidateManifestSha256
        === V595_PARENT_V594_IDENTITY.candidateManifestSha256
      && source.parentV594?.releaseDossierSha256
        === V595_PARENT_V594_IDENTITY.releaseDossierSha256
      && source.parentV594?.resealReceiptSha256
        === V595_PARENT_V594_IDENTITY.resealReceiptSha256
      && source.parentV594?.sourceFiles === 107
      && source.parentV594?.closureSourcePaths === 8,
    "v595-bundle-source-parent-dossier",
  );
  assertFileRows(source.files, V595_DELTA_SOURCE_PATHS, "delta", false);
  assertFileRows(source.closureSourcePaths, V595_CLOSURE_SOURCE_PATHS, "closure", true);
  assertV595Formal(
    Array.isArray(source.pendingClosurePaths) && source.pendingClosurePaths.length === 0,
    "v595-bundle-source-pending-closure",
  );

  assertV595Formal(
    candidate.version === V595_CANDIDATE_VERSION
      && candidate.generatedAt === source.generatedAt
      && candidate.identityStage === "ready-for-formal-evidence-candidate-identity"
      && candidate.status === V595_READY_STATUS
      && candidate.route === "/"
      && candidate.formalProductPointer === V595_FORMAL_PRODUCT_POINTER,
    "v595-bundle-candidate-contract",
  );
  assertV595Formal(
    candidate.governance?.additiveOnly === true
      && candidate.governance?.parentV594Immutable === true
      && candidate.governance?.sourceManifestSha256 === source.receiptSha256
      && candidate.governance?.parentSourceManifestSha256
        === V595_PARENT_V594_IDENTITY.sourceManifestSha256
      && candidate.governance?.parentCandidateManifestSha256
        === V595_PARENT_V594_IDENTITY.candidateManifestSha256
      && candidate.governance?.parentReleaseDossierSha256
        === V595_PARENT_V594_IDENTITY.releaseDossierSha256
      && candidate.governance?.parentResealReceiptSha256
        === V595_PARENT_V594_IDENTITY.resealReceiptSha256
      && candidate.governance?.legacyDefaultKernelFrozen === true
      && candidate.governance?.v2ShadowOnly === true
      && candidate.governance?.priorV594HumanDecisionInherited === false,
    "v595-bundle-candidate-governance",
  );
  assertV595Formal(
    candidate.closure?.toolingComplete === true
      && sameCanonicalV595Formal(candidate.closure?.sourcePaths, source.closureSourcePaths),
    "v595-bundle-candidate-closure-binding",
  );
  assertV595Authority(candidate.authority, "candidate");

  const deploymentId =
    `v595-${source.receiptSha256.slice(0, 12)}-${candidate.manifestSha256.slice(0, 12)}`;
  assertV595Formal(
    pointer.version === "v595-stellar-relativity-capability-pointer-v1"
      && pointer.generatedAt === source.generatedAt
      && pointer.identityStage
        === "ready-for-formal-evidence-capability-pointer-identity"
      && pointer.status === V595_READY_STATUS
      && pointer.route === "/"
      && pointer.sourceManifestSha256 === source.receiptSha256
      && pointer.manifestSha256 === candidate.manifestSha256
      && pointer.deploymentId === deploymentId
      && pointer.formalProductPointer === V595_FORMAL_PRODUCT_POINTER
      && pointer.productionPromotionAllowed === false
      && SHA256_PATTERN.test(pointer.currentStateReceiptSha256 ?? ""),
    "v595-bundle-pointer-binding",
  );
  assertV595Formal(
    sameCanonicalV595Formal(pointer.authority, candidate.authority),
    "v595-bundle-pointer-authority-drift",
  );

  const identities = {};
  if (standalone) {
    identities.standalone = validateV595BuildDocument(
      standalone,
      source,
      candidate,
      "standalone-full",
    );
    assertV595Formal(
      standalone.deploymentId === deploymentId,
      "v595-bundle-standalone-deployment",
    );
  }
  if (lite) {
    identities.lite = validateV595BuildDocument(
      lite,
      source,
      candidate,
      "vercel-lite",
    );
    assertV595Formal(lite.deploymentId === deploymentId, "v595-bundle-lite-deployment");
  }
  if (options.requireBuilds) {
    assertV595Formal(
      identities.standalone && identities.lite,
      "v595-bundle-builds-required",
    );
    assertV595Formal(
      identities.standalone.buildId !== identities.lite.buildId,
      "v595-bundle-build-tier-alias",
    );
  }
  return Object.freeze({ deploymentId, identities: Object.freeze(identities) });
}

export async function loadCurrentV595Bundle(root = process.cwd(), options = {}) {
  const workspace = resolve(root);
  const loaded = {};
  for (const [label, value] of Object.entries(V595_ARTIFACT_PATHS)) {
    if (!options.requireBuilds && (label === "standalone" || label === "lite")) continue;
    loaded[label] = (await readJsonV595Formal(workspace, value, label)).value;
  }
  const validated = validateV595BundleDocuments(loaded, options);
  const rebuiltSource = buildV595SourceManifest(workspace, {
    generatedAt: loaded.source.generatedAt,
  });
  assertV595Formal(
    rebuiltSource.receiptSha256 === loaded.source.receiptSha256
      && sameCanonicalV595Formal(rebuiltSource, loaded.source),
    "v595-bundle-current-source-byte-drift",
  );
  for (const row of loaded.source.files) {
    await verifyFileReceiptV595Formal(workspace, row, `source:${row.path}`);
  }
  for (const row of loaded.source.closureSourcePaths) {
    await verifyFileReceiptV595Formal(workspace, row, `closure:${row.path}`);
  }
  return Object.freeze({
    workspace,
    paths: V595_ARTIFACT_PATHS,
    ...loaded,
    ...validated,
  });
}

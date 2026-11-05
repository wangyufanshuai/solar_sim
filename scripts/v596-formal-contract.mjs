import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, realpath, rename, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

import { buildV596SourceManifest } from "./build-v596-source-manifest.mjs";
import {
  V596_CLOSURE_SOURCE_PATHS,
  V596_DELTA_SOURCE_PATHS,
  V596_PARENT_RETIRED_SOURCE_PATHS,
} from "./v596-source-paths.mjs";

export const V596_FORMAL_PRODUCT_POINTER = "v263";
export const V596_SOURCE_VERSION = "v596-source-manifest-v1";
export const V596_CANDIDATE_VERSION =
  "v596-stellar-visible-leap-additive-candidate-v1";
export const V596_BUILD_VERSION = "v596-atlas-build-resource-receipt-v1";
export const V596_READY_STATUS = "ready-for-v596-formal-evidence-not-promoted";

export const V596_PARENT_V595_IDENTITY = Object.freeze({
  sourceManifestSha256:
    "e06febbe18cd65ad8d24bb618d09c93032ca7fa02d5d69e2d916ea3b8f802186",
  candidateManifestSha256:
    "332b5ce6a0b5f26a4f9553d44cb9d0eb8d5cc169ae3242b4cd83259b669abae1",
  releaseDossierSha256:
    "ea6a5247cf9708162df26acead217e23159f0d8793466dd98071888831866765",
  resealReceiptSha256:
    "ccf9c5cbfc0418c25295a51fde4efdb1364d9a7206dfa056eb004fb53b5c9a13",
  deploymentId: "v595-e06febbe18cd-332b5ce6a0b5",
  formalProductPointer: V596_FORMAL_PRODUCT_POINTER,
});

export const V596_ARTIFACT_PATHS = Object.freeze({
  source: "docs/release/v596/source-manifest-v596.json",
  candidate: "public/data/stellar-visible-leap-v596/manifest.json",
  pointer: "docs/release/v596/capability-pointer-v596.json",
  standalone: "dist/release/atlas-v596-standalone-build-resource.json",
  lite: "dist/release/atlas-v596-lite-build-resource.json",
});

export const V596_AUTHORITY_FALSE_FIELDS = Object.freeze([
  "scientificAuthorityGranted",
  "scientificPayloadMutationAllowed",
  "measuredAuthorityGranted",
  "gpuAuthorityGranted",
  "resolvedSurfaceAuthorityGranted",
  "observationTextureAuthorityGranted",
  "radiativeTransferGranted",
  "grmhdGranted",
  "geometryReferenceGranted",
  "polarizationTransportReferenceGranted",
  "productionReleaseAuthorized",
  "productionPromotionAllowed",
]);


const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const BUILD_ID_PATTERN = /^v596b-[0-9a-f]{64}$/;
const DEPLOYMENT_ID_PATTERN = /^v596-[0-9a-f]{12}-[0-9a-f]{12}$/;
const DELIVERY_TIERS = new Set(["standalone-full", "vercel-lite"]);

export function assertV596Formal(condition, code) {
  if (!condition) throw new Error(code);
}

export function canonicalizeV596Formal(value) {
  if (value === undefined) throw new Error("v596-formal-canonical-undefined");
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    assertV596Formal(Number.isFinite(value), "v596-formal-canonical-non-finite");
    return value;
  }
  if (Array.isArray(value)) return value.map(canonicalizeV596Formal);
  assertV596Formal(
    typeof value === "object"
      && (Object.getPrototypeOf(value) === Object.prototype
        || Object.getPrototypeOf(value) === null),
    "v596-formal-canonical-non-json-value",
  );
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, canonicalizeV596Formal(value[key])]),
  );
}

export function sha256V596Formal(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function canonicalShaV596Formal(value) {
  return sha256V596Formal(
    Buffer.from(JSON.stringify(canonicalizeV596Formal(value)), "utf8"),
  );
}

export function sameCanonicalV596Formal(left, right) {
  return canonicalShaV596Formal(left) === canonicalShaV596Formal(right);
}

export function sealV596FormalDocument(unsigned, field = "receiptSha256") {
  assertV596Formal(
    unsigned && typeof unsigned === "object" && !Array.isArray(unsigned),
    "v596-formal-seal-document-shape",
  );
  assertV596Formal(!(field in unsigned), `v596-formal-seal-field-present:${field}`);
  return Object.freeze({ ...unsigned, [field]: canonicalShaV596Formal(unsigned) });
}

export function verifyV596FormalSeal(
  document,
  field = "receiptSha256",
  label = "document",
) {
  assertV596Formal(
    document && typeof document === "object" && !Array.isArray(document),
    `v596-formal-seal-shape:${label}`,
  );
  assertV596Formal(
    SHA256_PATTERN.test(document[field] ?? ""),
    `v596-formal-seal-value:${label}`,
  );
  const unsigned = { ...document };
  delete unsigned[field];
  assertV596Formal(
    canonicalShaV596Formal(unsigned) === document[field],
    `v596-formal-seal-invalid:${label}`,
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

export function resolveInsideV596Workspace(root, value, label = "path") {
  assertV596Formal(isCanonicalRelativePath(value), `v596-formal-path:${label}`);
  const workspace = resolve(root);
  const path = resolve(workspace, value);
  const relation = relative(workspace, path);
  assertV596Formal(
    relation !== "" && relation !== ".." && !relation.startsWith(`..${sep}`)
      && !isAbsolute(relation),
    `v596-formal-boundary:${label}`,
  );
  return path;
}

export async function resolveV596OutputRoot(
  root,
  outputRoot = root,
  label = "output-root",
) {
  const workspace = resolve(root);
  const destination = isAbsolute(outputRoot)
    ? resolve(outputRoot)
    : resolve(workspace, outputRoot);
  const relation = relative(workspace, destination);
  assertV596Formal(
    destination === workspace || (relation !== ".." && !relation.startsWith(`..${sep}`)
      && !isAbsolute(relation)),
    `v596-formal-output-boundary:${label}`,
  );
  await mkdir(destination, { recursive: true });
  const [realWorkspace, realDestination] = await Promise.all([
    realpath(workspace),
    realpath(destination),
  ]);
  const realRelation = relative(realWorkspace, realDestination);
  assertV596Formal(
    realDestination === realWorkspace || (realRelation !== ".."
      && !realRelation.startsWith(`..${sep}`) && !isAbsolute(realRelation)),
    `v596-formal-output-realpath-boundary:${label}`,
  );
  return realDestination;
}

async function assertRegularWorkspaceFile(root, path, label) {
  const metadata = await lstat(path);
  assertV596Formal(
    metadata.isFile() && !metadata.isSymbolicLink(),
    `v596-formal-file-not-regular:${label}`,
  );
  const [realWorkspace, realFile] = await Promise.all([
    realpath(resolve(root)),
    realpath(path),
  ]);
  const relation = relative(realWorkspace, realFile);
  assertV596Formal(
    relation !== "" && relation !== ".." && !relation.startsWith(`..${sep}`)
      && !isAbsolute(relation),
    `v596-formal-file-realpath-boundary:${label}`,
  );
}

export async function readJsonV596Formal(root, value, label = "json") {
  const path = resolveInsideV596Workspace(root, value, label);
  await assertRegularWorkspaceFile(root, path, label);
  const bytes = await readFile(path);
  let document;
  try {
    document = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`v596-formal-json:${label}:${String(error)}`);
  }
  return Object.freeze({ path, bytes, value: document });
}

export async function fileReceiptV596Formal(root, value, label = "artifact") {
  const path = resolveInsideV596Workspace(root, value, label);
  await assertRegularWorkspaceFile(root, path, label);
  const bytes = await readFile(path);
  return Object.freeze({
    path: relative(resolve(root), path).replaceAll("\\", "/"),
    bytes: bytes.byteLength,
    sha256: sha256V596Formal(bytes),
  });
}

export async function verifyFileReceiptV596Formal(root, record, label = "artifact") {
  assertV596Formal(
    record && isCanonicalRelativePath(record.path)
      && Number.isSafeInteger(record.bytes) && record.bytes >= 0
      && SHA256_PATTERN.test(record.sha256 ?? ""),
    `v596-formal-file-record:${label}`,
  );
  const observed = await fileReceiptV596Formal(root, record.path, label);
  assertV596Formal(
    observed.path === record.path && observed.bytes === record.bytes
      && observed.sha256 === record.sha256,
    `v596-formal-file-drift:${label}`,
  );
  return observed;
}

export async function atomicWriteJsonV596Formal(
  root,
  outputRoot,
  value,
  document,
  label = "output",
) {
  const workspace = resolve(root);
  const destination = await resolveV596OutputRoot(workspace, outputRoot, label);
  const path = resolveInsideV596Workspace(destination, value, label);
  const parent = dirname(path);
  await mkdir(parent, { recursive: true });
  const realParent = await realpath(parent);
  const relation = relative(await realpath(workspace), realParent);
  assertV596Formal(
    relation === "" || (relation !== ".." && !relation.startsWith(`..${sep}`)
      && !isAbsolute(relation)),
    `v596-formal-output-parent-boundary:${label}`,
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

export function normalizeV596Identity(identity) {
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

export function validateV596Identity(identity, expected = null, options = {}) {
  const normalized = normalizeV596Identity(identity);
  assertV596Formal(
    SHA256_PATTERN.test(normalized.sourceManifestSha256 ?? ""),
    "v596-identity-source",
  );
  assertV596Formal(
    SHA256_PATTERN.test(normalized.candidateManifestSha256 ?? ""),
    "v596-identity-candidate",
  );
  assertV596Formal(
    SHA256_PATTERN.test(normalized.buildFingerprint ?? ""),
    "v596-identity-build-fingerprint",
  );
  assertV596Formal(BUILD_ID_PATTERN.test(normalized.buildId ?? ""), "v596-identity-build-id");
  assertV596Formal(
    normalized.buildId === `v596b-${normalized.buildFingerprint}`,
    "v596-identity-build-binding",
  );
  assertV596Formal(
    DEPLOYMENT_ID_PATTERN.test(normalized.deploymentId ?? ""),
    "v596-identity-deployment",
  );
  assertV596Formal(
    normalized.deploymentId
      === `v596-${normalized.sourceManifestSha256.slice(0, 12)}-${normalized.candidateManifestSha256.slice(0, 12)}`,
    "v596-identity-deployment-binding",
  );
  assertV596Formal(
    normalized.formalProductPointer === V596_FORMAL_PRODUCT_POINTER,
    "v596-identity-formal-product-pointer",
  );
  assertV596Formal(
    DELIVERY_TIERS.has(normalized.deliveryTier),
    "v596-identity-delivery-tier",
  );
  if (identity?.bindingStatus !== undefined) {
    assertV596Formal(identity.bindingStatus === "bound", "v596-identity-binding-status");
  }
  if (options.deliveryTier) {
    assertV596Formal(
      normalized.deliveryTier === options.deliveryTier,
      "v596-identity-wrong-tier",
    );
  }
  if (expected) {
    const expectedNormalized = normalizeV596Identity(expected);
    for (const [field, value] of Object.entries(normalized)) {
      assertV596Formal(
        value === expectedNormalized[field],
        `v596-identity-drift:${field}`,
      );
    }
  }
  return normalized;
}

export function assertV596Authority(authority, label = "authority") {
  assertV596Formal(
    authority && typeof authority === "object" && !Array.isArray(authority),
    `v596-authority-shape:${label}`,
  );
  assertV596Formal(
    authority.defaultKernel === "legacy-eih-1pn",
    `v596-authority-kernel:${label}`,
  );
  assertV596Formal(
    authority.v2Mode === "shadow-only",
    `v596-authority-v2-mode:${label}`,
  );
  for (const field of V596_AUTHORITY_FALSE_FIELDS) {
    assertV596Formal(
      authority[field] === false,
      `v596-authority-elevation:${label}:${field}`,
    );
  }
  return authority;
}

export function assertV596BuildAuthority(authority, label = "build-authority") {
  assertV596Formal(
    authority && typeof authority === "object" && !Array.isArray(authority),
    `v596-build-authority-shape:${label}`,
  );
  for (const field of [
    "scientificAuthorityGranted",
    "measuredAuthorityGranted",
    "gpuAuthorityGranted",
    "productionPromotionAllowed",
  ]) {
    assertV596Formal(
      authority[field] === false,
      `v596-build-authority-elevation:${label}:${field}`,
    );
  }
  return authority;
}

export function assertKnownFiniteZeroV596(value, label) {
  assertV596Formal(
    typeof value === "number" && Number.isFinite(value) && Object.is(value, 0),
    `v596-unknown-zero:${label}`,
  );
}

export function assertKnownNonNegativeV596(value, label) {
  assertV596Formal(
    typeof value === "number" && Number.isFinite(value) && value >= 0,
    `v596-unknown-nonnegative:${label}`,
  );
}

export function assertKnownPositiveV596(value, label) {
  assertV596Formal(
    typeof value === "number" && Number.isFinite(value) && value > 0,
    `v596-unknown-positive:${label}`,
  );
}

export function assertV596EvidenceEnvelope(stage, options = {}) {
  const syntheticFixture = options.syntheticFixture === true;
  if (syntheticFixture) {
    assertV596Formal(stage.fixture?.synthetic === true, "v596-synthetic-fixture-marker");
    assertV596Formal(stage.formalEvidence === false, "v596-synthetic-formal-evidence");
    assertV596Formal(stage.evidenceClaim === false, "v596-synthetic-evidence-claim");
    assertV596Formal(
      stage.qualificationScope === "synthetic-test-only",
      "v596-synthetic-qualification-scope",
    );
  } else {
    assertV596Formal(stage.fixture?.synthetic !== true, "v596-synthetic-as-formal");
    assertV596Formal(stage.formalEvidence === true, "v596-formal-evidence-required");
    assertV596Formal(stage.evidenceClaim === true, "v596-formal-evidence-claim");
    assertV596Formal(
      typeof stage.qualificationScope === "string"
        && stage.qualificationScope.startsWith("formal-current-v596-"),
      "v596-formal-qualification-scope",
    );
  }
  assertV596Formal(stage.promotion === "none", "v596-formal-promotion-boundary");
  assertV596Formal(stage.syntheticZeroClaim === false, "v596-formal-synthetic-zero-claim");
  return Object.freeze({ syntheticFixture, formalEvidence: !syntheticFixture });
}

function assertIsoTimestamp(value, label) {
  assertV596Formal(
    typeof value === "string" && Number.isFinite(Date.parse(value)),
    `v596-formal-timestamp:${label}`,
  );
}

function assertFileRows(rows, expectedPaths, label, stateRequired) {
  assertV596Formal(Array.isArray(rows), `v596-bundle-file-rows:${label}`);
  const paths = rows.map((row) => row?.path);
  assertV596Formal(
    sameCanonicalV596Formal([...paths].sort(), [...expectedPaths].sort()),
    `v596-bundle-file-order:${label}`,
  );
  assertV596Formal(
    new Set(paths).size === paths.length,
    `v596-bundle-file-duplicates:${label}`,
  );
  for (const row of rows) {
    assertV596Formal(
      row && isCanonicalRelativePath(row.path)
        && Number.isSafeInteger(row.bytes) && row.bytes > 0
        && SHA256_PATTERN.test(row.sha256 ?? "")
        && (!stateRequired || row.state === "present"),
      `v596-bundle-file-record:${label}:${row?.path ?? "unknown"}`,
    );
  }
}

function validateV596BuildDocument(build, source, candidate, tier) {
  verifyV596FormalSeal(build, "receiptSha256", `build:${tier}`);
  assertV596Formal(
    build.version === V596_BUILD_VERSION && build.status === "passed",
    `v596-bundle-build-contract:${tier}`,
  );
  assertV596Formal(
    build.generatedAt === source.generatedAt
      && build.sourceManifestSha256 === source.receiptSha256
      && build.candidateManifestSha256 === candidate.manifestSha256
      && build.formalProductPointer === V596_FORMAL_PRODUCT_POINTER
      && build.deliveryTier === tier,
    `v596-bundle-build-binding:${tier}`,
  );
  assertV596Formal(
    build.parentV595?.sourceManifestSha256
      === V596_PARENT_V595_IDENTITY.sourceManifestSha256
      && build.parentV595?.candidateManifestSha256
        === V596_PARENT_V595_IDENTITY.candidateManifestSha256
      && build.parentV595?.relationship === "sealed-parent-not-current-build",
    `v596-bundle-build-parent:${tier}`,
  );
  assertV596BuildAuthority(build.authority, tier);
  return validateV596Identity(build, null, { deliveryTier: tier });
}

export function validateV596BundleDocuments(documents, options = {}) {
  const { source, candidate, pointer, standalone = null, lite = null } = documents ?? {};
  verifyV596FormalSeal(source, "receiptSha256", "source");
  verifyV596FormalSeal(candidate, "manifestSha256", "candidate");
  verifyV596FormalSeal(pointer, "pointerSha256", "pointer");
  assertIsoTimestamp(source.generatedAt, "source");
  assertV596Formal(
    source.version === V596_SOURCE_VERSION
      && source.identityStage === "ready-for-v596-delta-source-identity"
      && source.status === "complete-explicit-v596-delta-retirement-and-closure-boundary"
      && source.formalProductPointer === V596_FORMAL_PRODUCT_POINTER
      && source.parentVersion === "v595",
    "v596-bundle-source-contract",
  );
  assertV596Formal(
    source.baseSourceManifestSha256 === V596_PARENT_V595_IDENTITY.sourceManifestSha256
      && source.baseCandidateManifestSha256
        === V596_PARENT_V595_IDENTITY.candidateManifestSha256
      && source.baseReleaseDossierSha256
        === V596_PARENT_V595_IDENTITY.releaseDossierSha256
      && source.baseResealReceiptSha256
        === V596_PARENT_V595_IDENTITY.resealReceiptSha256,
    "v596-bundle-source-parent-binding",
  );
  assertV596Formal(
    source.parentV595?.sourceManifestSha256
      === V596_PARENT_V595_IDENTITY.sourceManifestSha256
      && source.parentV595?.candidateManifestSha256
        === V596_PARENT_V595_IDENTITY.candidateManifestSha256
      && source.parentV595?.releaseDossierSha256
        === V596_PARENT_V595_IDENTITY.releaseDossierSha256
      && source.parentV595?.resealReceiptSha256
        === V596_PARENT_V595_IDENTITY.resealReceiptSha256
      && source.parentV595?.sourceFiles === 74
      && source.parentV595?.closureSourcePaths === 8,
    "v596-bundle-source-parent-dossier",
  );
  assertFileRows(source.files, V596_DELTA_SOURCE_PATHS, "delta", false);
  assertFileRows(source.closureSourcePaths, V596_CLOSURE_SOURCE_PATHS, "closure", true);
  assertV596Formal(
    Array.isArray(source.pendingClosurePaths) && source.pendingClosurePaths.length === 0,
    "v596-bundle-source-pending-closure",
  );
  assertV596Formal(
    Array.isArray(source.parentRetiredOrReplacedPaths)
      && source.parentRetiredOrReplacedPaths.map((row) => row.path).join("|")
        === V596_PARENT_RETIRED_SOURCE_PATHS.join("|")
      && source.parentRetiredOrReplacedPaths.every((row) =>
        row.currentState === "absent"
          && typeof row.disposition === "string"
          && row.disposition.startsWith("retired-parent-")
          && Number.isSafeInteger(row.parentBytes) && row.parentBytes > 0
          && SHA256_PATTERN.test(row.parentSha256 ?? "")
          && Array.isArray(row.replacements)),
    "v596-bundle-source-retirement-contract",
  );

  assertV596Formal(
    candidate.version === V596_CANDIDATE_VERSION
      && candidate.generatedAt === source.generatedAt
      && candidate.identityStage === "ready-for-formal-evidence-candidate-identity"
      && candidate.status === V596_READY_STATUS
      && candidate.route === "/"
      && candidate.formalProductPointer === V596_FORMAL_PRODUCT_POINTER,
    "v596-bundle-candidate-contract",
  );
  assertV596Formal(
    candidate.governance?.additiveOnly === true
      && candidate.governance?.parentV595Immutable === true
      && candidate.governance?.sourceManifestSha256 === source.receiptSha256
      && candidate.governance?.parentSourceManifestSha256
        === V596_PARENT_V595_IDENTITY.sourceManifestSha256
      && candidate.governance?.parentCandidateManifestSha256
        === V596_PARENT_V595_IDENTITY.candidateManifestSha256
      && candidate.governance?.parentReleaseDossierSha256
        === V596_PARENT_V595_IDENTITY.releaseDossierSha256
      && candidate.governance?.parentResealReceiptSha256
        === V596_PARENT_V595_IDENTITY.resealReceiptSha256
      && candidate.governance?.legacyDefaultKernelFrozen === true
      && candidate.governance?.v2ShadowOnly === true
      && candidate.governance?.priorV595HumanDecisionInherited === false,
    "v596-bundle-candidate-governance",
  );
  assertV596Formal(
    candidate.closure?.toolingComplete === true
      && sameCanonicalV596Formal(candidate.closure?.sourcePaths, source.closureSourcePaths),
    "v596-bundle-candidate-closure-binding",
  );
  assertV596Authority(candidate.authority, "candidate");

  const deploymentId =
    `v596-${source.receiptSha256.slice(0, 12)}-${candidate.manifestSha256.slice(0, 12)}`;
  assertV596Formal(
    pointer.version === "v596-stellar-visible-leap-capability-pointer-v1"
      && pointer.generatedAt === source.generatedAt
      && pointer.identityStage
        === "ready-for-formal-evidence-capability-pointer-identity"
      && pointer.status === V596_READY_STATUS
      && pointer.route === "/"
      && pointer.sourceManifestSha256 === source.receiptSha256
      && pointer.manifestSha256 === candidate.manifestSha256
      && pointer.deploymentId === deploymentId
      && pointer.formalProductPointer === V596_FORMAL_PRODUCT_POINTER
      && pointer.productionPromotionAllowed === false
      && SHA256_PATTERN.test(pointer.currentStateReceiptSha256 ?? ""),
    "v596-bundle-pointer-binding",
  );
  assertV596Formal(
    sameCanonicalV596Formal(pointer.authority, candidate.authority),
    "v596-bundle-pointer-authority-drift",
  );

  const identities = {};
  if (standalone) {
    identities.standalone = validateV596BuildDocument(
      standalone,
      source,
      candidate,
      "standalone-full",
    );
    assertV596Formal(
      standalone.deploymentId === deploymentId,
      "v596-bundle-standalone-deployment",
    );
  }
  if (lite) {
    identities.lite = validateV596BuildDocument(
      lite,
      source,
      candidate,
      "vercel-lite",
    );
    assertV596Formal(lite.deploymentId === deploymentId, "v596-bundle-lite-deployment");
  }
  if (options.requireBuilds) {
    assertV596Formal(
      identities.standalone && identities.lite,
      "v596-bundle-builds-required",
    );
    assertV596Formal(
      identities.standalone.buildId !== identities.lite.buildId,
      "v596-bundle-build-tier-alias",
    );
  }
  return Object.freeze({ deploymentId, identities: Object.freeze(identities) });
}

export async function loadCurrentV596Bundle(root = process.cwd(), options = {}) {
  const workspace = resolve(root);
  const loaded = {};
  for (const [label, value] of Object.entries(V596_ARTIFACT_PATHS)) {
    if (!options.requireBuilds && (label === "standalone" || label === "lite")) continue;
    loaded[label] = (await readJsonV596Formal(workspace, value, label)).value;
  }
  const validated = validateV596BundleDocuments(loaded, options);
  const rebuiltSource = buildV596SourceManifest(workspace, {
    generatedAt: loaded.source.generatedAt,
  });
  assertV596Formal(
    rebuiltSource.receiptSha256 === loaded.source.receiptSha256
      && sameCanonicalV596Formal(rebuiltSource, loaded.source),
    "v596-bundle-current-source-byte-drift",
  );
  for (const row of loaded.source.files) {
    await verifyFileReceiptV596Formal(workspace, row, `source:${row.path}`);
  }
  for (const row of loaded.source.closureSourcePaths) {
    await verifyFileReceiptV596Formal(workspace, row, `closure:${row.path}`);
  }
  return Object.freeze({
    workspace,
    paths: V596_ARTIFACT_PATHS,
    ...loaded,
    ...validated,
  });
}

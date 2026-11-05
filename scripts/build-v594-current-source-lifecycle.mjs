import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, realpath, rename, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

import { V594_CLOSURE_SOURCE_PATHS } from "./v594-source-paths.mjs";

export const V594_FORMAL_PRODUCT_POINTER = "v263";
export const V594_SOURCE_VERSION = "v594-source-manifest-v1";
export const V594_CANDIDATE_VERSION = "v594-stellar-relativity-additive-candidate-v1";
export const V594_BUILD_VERSION = "v594-atlas-build-resource-receipt-v1";
export const V594_LIFECYCLE_STAGE_VERSION = "v594-same-realm-scene-exit-stage-v4";
export const V594_LIFECYCLE_STAGE_STATUS =
  "staging-v594-same-realm-scene-exit-passed-not-promoted";
export const V594_LIFECYCLE_RECEIPT_VERSION = "v594-resource-lifecycle-v4";
export const V594_SCENE_EXIT_RELEASE_CONTRACT_VERSION =
  "v594-observed-scene-exit-release-contract-v4";
export const V594_LIFECYCLE_PHASE_LINK_VERSION =
  "v594-same-realm-scene-exit-phase-link-v4";
export const V594_LIFECYCLE_RECEIPT_STATUS =
  "passed-current-v594-same-realm-mount-replace-detach-and-client-route-exit";
export const V594_LIFECYCLE_PHASES = Object.freeze([
  "baseline",
  "mounting",
  "mounted",
  "replacing",
  "replaced",
  "detaching",
  "detached-stable",
  "exiting",
  "exited",
]);
export const V594_LIFECYCLE_RUNNER_VERSION =
  "v594-same-realm-scene-exit-runner-v4";
export const V594_LIFECYCLE_AUDITOR_VERSION =
  "v594-same-realm-scene-exit-audit-v4";

export const V594_AUTHORITY_FALSE_FIELDS = Object.freeze([
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

const SHA256 = /^[0-9a-f]{64}$/;
const BUILD_ID = /^v594b-[0-9a-f]{64}$/;
const DEPLOYMENT_ID = /^v594-[0-9a-f]{12}-[0-9a-f]{12}$/;

export function assertV594(condition, code) {
  if (!condition) throw new Error(code);
}

export function canonicalizeV594Closure(value) {
  if (value === undefined) throw new Error("v594-closure-canonical-undefined");
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new Error("v594-closure-canonical-non-finite");
  }
  if (Array.isArray(value)) return value.map(canonicalizeV594Closure);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, canonicalizeV594Closure(value[key])]),
  );
}

export function sha256V594Closure(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function canonicalShaV594Closure(value) {
  return sha256V594Closure(
    Buffer.from(JSON.stringify(canonicalizeV594Closure(value)), "utf8"),
  );
}

export function sameCanonicalV594(left, right) {
  return canonicalShaV594Closure(left) === canonicalShaV594Closure(right);
}

export function sealV594Document(unsigned, field = "receiptSha256") {
  assertV594(
    unsigned && typeof unsigned === "object" && !Array.isArray(unsigned),
    "v594-closure-seal-document-shape",
  );
  assertV594(!(field in unsigned), `v594-closure-seal-field-present:${field}`);
  return Object.freeze({ ...unsigned, [field]: canonicalShaV594Closure(unsigned) });
}

export function verifyV594Seal(document, field = "receiptSha256", label = "document") {
  assertV594(
    document && typeof document === "object" && !Array.isArray(document),
    `v594-closure-seal-shape:${label}`,
  );
  assertV594(SHA256.test(document[field] ?? ""), `v594-closure-seal-value:${label}`);
  const unsigned = { ...document };
  delete unsigned[field];
  assertV594(
    canonicalShaV594Closure(unsigned) === document[field],
    `v594-closure-seal-invalid:${label}`,
  );
  return document[field];
}

export function resolveInsideV594Workspace(root, value, label = "path") {
  assertV594(typeof value === "string" && value.length > 0, `v594-closure-path:${label}`);
  const portable = value.replaceAll("\\", "/");
  assertV594(!isAbsolute(value)
    && portable.split("/").every((part) => part.length > 0 && part !== "." && part !== ".."),
  `v594-closure-noncanonical-path:${label}`);
  const workspace = resolve(root);
  const path = resolve(workspace, value);
  const relation = relative(workspace, path);
  assertV594(
    relation !== "" && relation !== ".." && !relation.startsWith(`..${sep}`)
      && !isAbsolute(relation),
    `v594-closure-boundary:${label}`,
  );
  return path;
}

export async function resolveV594OutputRoot(root, outputRoot = root, label = "output-root") {
  const workspace = resolve(root);
  const destination = resolve(outputRoot);
  const relation = relative(workspace, destination);
  assertV594(destination === workspace || (relation !== ".."
    && !relation.startsWith(`..${sep}`) && !isAbsolute(relation)),
  `v594-closure-output-root-boundary:${label}`);
  const [realWorkspace, realDestination] = await Promise.all([
    realpath(workspace),
    realpath(destination),
  ]);
  const realRelation = relative(realWorkspace, realDestination);
  assertV594(realDestination === realWorkspace || (realRelation !== ".."
    && !realRelation.startsWith(`..${sep}`) && !isAbsolute(realRelation)),
  `v594-closure-output-root-realpath-boundary:${label}`);
  return destination;
}

export async function readJsonV594(path, label = "json") {
  const bytes = await readFile(path);
  let value;
  try {
    value = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`v594-closure-json:${label}:${String(error)}`);
  }
  return Object.freeze({ bytes, value });
}

export async function fileReceiptV594(root, value, label = "artifact") {
  const path = resolveInsideV594Workspace(root, value, label);
  const metadata = await lstat(path);
  assertV594(metadata.isFile() && !metadata.isSymbolicLink(),
    `v594-closure-file-not-regular:${label}`);
  const [realWorkspace, realFile] = await Promise.all([realpath(resolve(root)), realpath(path)]);
  const realRelation = relative(realWorkspace, realFile);
  assertV594(realRelation !== "" && realRelation !== ".."
    && !realRelation.startsWith(`..${sep}`) && !isAbsolute(realRelation),
  `v594-closure-realpath-boundary:${label}`);
  const bytes = await readFile(path);
  return Object.freeze({
    path: relative(resolve(root), path).replaceAll("\\", "/"),
    bytes: bytes.byteLength,
    sha256: sha256V594Closure(bytes),
  });
}

export async function verifyFileReceiptV594(root, record, label = "artifact") {
  assertV594(
    record && typeof record.path === "string"
      && Number.isSafeInteger(record.bytes) && record.bytes >= 0
      && SHA256.test(record.sha256 ?? ""),
    `v594-closure-file-record:${label}`,
  );
  const observed = await fileReceiptV594(root, record.path, label);
  assertV594(
    observed.path === record.path
      && observed.bytes === record.bytes && observed.sha256 === record.sha256,
    `v594-closure-file-drift:${label}`,
  );
  return observed;
}

export async function atomicWriteJsonV594(root, value, document, label = "output") {
  const path = resolveInsideV594Workspace(root, value, label);
  const parent = dirname(path);
  await mkdir(parent, { recursive: true });
  const [realWorkspace, realParent] = await Promise.all([
    realpath(resolve(root)),
    realpath(parent),
  ]);
  const parentRelation = relative(realWorkspace, realParent);
  assertV594(parentRelation === "" || (parentRelation !== ".."
    && !parentRelation.startsWith(`..${sep}`) && !isAbsolute(parentRelation)),
  `v594-closure-output-realpath-boundary:${label}`);
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

export function normalizeV594Identity(identity) {
  return Object.freeze({
    sourceManifestSha256: identity?.sourceManifestSha256 ?? identity?.sourceSha256 ?? null,
    candidateManifestSha256:
      identity?.candidateManifestSha256 ?? identity?.candidateSha256 ?? identity?.manifestSha256 ?? null,
    buildId: identity?.buildId ?? null,
    buildFingerprint: identity?.buildFingerprint ?? null,
    deploymentId: identity?.deploymentId ?? null,
    formalProductPointer: identity?.formalProductPointer ?? null,
    deliveryTier: identity?.deliveryTier ?? null,
  });
}

export function validateV594Identity(identity, expected = null, options = {}) {
  const normalized = normalizeV594Identity(identity);
  assertV594(SHA256.test(normalized.sourceManifestSha256 ?? ""), "v594-identity-source");
  assertV594(SHA256.test(normalized.candidateManifestSha256 ?? ""), "v594-identity-candidate");
  assertV594(BUILD_ID.test(normalized.buildId ?? ""), "v594-identity-build-id");
  assertV594(SHA256.test(normalized.buildFingerprint ?? ""), "v594-identity-build-fingerprint");
  assertV594(DEPLOYMENT_ID.test(normalized.deploymentId ?? ""), "v594-identity-deployment");
  assertV594(
    normalized.deploymentId
      === `v594-${normalized.sourceManifestSha256.slice(0, 12)}-${normalized.candidateManifestSha256.slice(0, 12)}`,
    "v594-identity-deployment-binding",
  );
  assertV594(
    normalized.formalProductPointer === V594_FORMAL_PRODUCT_POINTER,
    "v594-identity-formal-product-pointer",
  );
  assertV594(
    new Set(["standalone-full", "vercel-lite"]).has(normalized.deliveryTier),
    "v594-identity-delivery-tier",
  );
  if (options.deliveryTier) {
    assertV594(normalized.deliveryTier === options.deliveryTier, "v594-identity-wrong-tier");
  }
  if (expected) {
    const expectedNormalized = normalizeV594Identity(expected);
    for (const field of Object.keys(normalized)) {
      assertV594(normalized[field] === expectedNormalized[field], `v594-identity-drift:${field}`);
    }
  }
  return normalized;
}

export function assertV594Authority(authority, label = "authority") {
  assertV594(
    authority && typeof authority === "object" && !Array.isArray(authority),
    `v594-authority-shape:${label}`,
  );
  assertV594(authority.defaultKernel === "legacy-eih-1pn", `v594-authority-kernel:${label}`);
  assertV594(
    new Set(["shadow", "shadow-only"]).has(authority.v2Mode),
    `v594-authority-shadow:${label}`,
  );
  for (const field of V594_AUTHORITY_FALSE_FIELDS) {
    assertV594(authority[field] === false, `v594-authority-elevation:${label}:${field}`);
  }
}

export function assertKnownFiniteZeroV594(value, label) {
  assertV594(
    typeof value === "number" && Number.isFinite(value) && value === 0,
    `v594-unknown-zero:${label}`,
  );
}

export function assertKnownPositiveV594(value, label) {
  assertV594(
    typeof value === "number" && Number.isFinite(value) && value > 0,
    `v594-unknown-positive:${label}`,
  );
}

function verifyClosureRows(source, manifest) {
  const sourceRows = source.closureSourcePaths;
  const manifestRows = manifest.closure?.sourcePaths;
  assertV594(Array.isArray(sourceRows), "v594-current-source-closure-rows");
  assertV594(
    sameCanonicalV594(sourceRows.map((row) => row.path), V594_CLOSURE_SOURCE_PATHS),
    "v594-current-source-closure-order",
  );
  assertV594(
    sourceRows.every((row) => row.state === "present"
      && Number.isSafeInteger(row.bytes) && row.bytes > 0 && SHA256.test(row.sha256 ?? "")),
    "v594-current-source-closure-not-present",
  );
  assertV594(Array.isArray(source.pendingClosurePaths) && source.pendingClosurePaths.length === 0,
    "v594-current-source-closure-pending");
  assertV594(manifest.closure?.toolingComplete === true, "v594-current-manifest-tooling");
  assertV594(sameCanonicalV594(sourceRows, manifestRows), "v594-current-closure-row-drift");
}

export async function loadCurrentV594Bundle(root = process.cwd(), options = {}) {
  const workspace = resolve(root);
  const paths = {
    source: "docs/release/v594/source-manifest-v594.json",
    candidate: "public/data/stellar-relativity-v594/manifest.json",
    pointer: "docs/release/v594/capability-pointer-v594.json",
    standalone: "dist/release/atlas-v594-standalone-build-resource.json",
    lite: "dist/release/atlas-v594-lite-build-resource.json",
  };
  const loaded = {};
  for (const [label, value] of Object.entries(paths)) {
    if (!options.requireBuilds && new Set(["standalone", "lite"]).has(label)) continue;
    const path = resolveInsideV594Workspace(workspace, value, label);
    loaded[label] = (await readJsonV594(path, label)).value;
  }
  verifyV594Seal(loaded.source, "receiptSha256", "source");
  verifyV594Seal(loaded.candidate, "manifestSha256", "candidate");
  verifyV594Seal(loaded.pointer, "pointerSha256", "pointer");
  assertV594(loaded.source.version === V594_SOURCE_VERSION, "v594-current-source-version");
  assertV594(
    loaded.source.identityStage === "ready-for-formal-evidence-source-identity",
    "v594-current-source-identity-stage",
  );
  assertV594(
    loaded.source.status === "complete-current-implementation-and-closure-tools",
    "v594-current-source-status",
  );
  assertV594(loaded.source.formalProductPointer === V594_FORMAL_PRODUCT_POINTER,
    "v594-current-source-pointer");
  assertV594(loaded.candidate.version === V594_CANDIDATE_VERSION,
    "v594-current-candidate-version");
  assertV594(
    loaded.candidate.identityStage === "ready-for-formal-evidence-candidate-identity",
    "v594-current-candidate-identity-stage",
  );
  assertV594(loaded.candidate.route === "/", "v594-current-candidate-route");
  assertV594(
    loaded.candidate.status === "ready-for-v594-formal-evidence-not-promoted",
    "v594-current-candidate-status",
  );
  assertV594(
    loaded.candidate.governance?.sourceManifestSha256 === loaded.source.receiptSha256,
    "v594-current-source-candidate-binding",
  );
  assertV594(loaded.candidate.governance?.parentV593Immutable === true,
    "v594-current-parent-immutability");
  assertV594(loaded.candidate.governance?.legacyDefaultKernelFrozen === true,
    "v594-current-kernel-freeze");
  assertV594(loaded.candidate.governance?.v2ShadowOnly === true,
    "v594-current-shadow-boundary");
  assertV594Authority(loaded.candidate.authority, "candidate");
  verifyClosureRows(loaded.source, loaded.candidate);
  assertV594(
    loaded.pointer.sourceManifestSha256 === loaded.source.receiptSha256
      && loaded.pointer.manifestSha256 === loaded.candidate.manifestSha256
      && loaded.pointer.formalProductPointer === V594_FORMAL_PRODUCT_POINTER
      && loaded.pointer.productionPromotionAllowed === false,
    "v594-current-pointer-binding",
  );
  const deploymentId = `v594-${loaded.source.receiptSha256.slice(0, 12)}-${loaded.candidate.manifestSha256.slice(0, 12)}`;
  assertV594(loaded.pointer.deploymentId === deploymentId, "v594-current-deployment-binding");
  for (const row of loaded.source.files ?? []) await verifyFileReceiptV594(workspace, row, `source:${row.path}`);
  for (const row of loaded.source.closureSourcePaths) {
    await verifyFileReceiptV594(workspace, row, `closure:${row.path}`);
  }
  const identities = {};
  for (const [label, tier] of [["standalone", "standalone-full"], ["lite", "vercel-lite"]]) {
    const build = loaded[label];
    if (!build) continue;
    verifyV594Seal(build, "receiptSha256", `build:${tier}`);
    assertV594(build.version === V594_BUILD_VERSION && build.status === "passed",
      `v594-current-build-contract:${tier}`);
    identities[label] = validateV594Identity({
      sourceManifestSha256: build.sourceManifestSha256,
      candidateManifestSha256: build.candidateManifestSha256,
      buildId: build.buildId,
      buildFingerprint: build.buildFingerprint,
      deploymentId: build.deploymentId,
      formalProductPointer: build.formalProductPointer,
      deliveryTier: build.deliveryTier,
    }, null, { deliveryTier: tier });
    assertV594(
      identities[label].sourceManifestSha256 === loaded.source.receiptSha256
        && identities[label].candidateManifestSha256 === loaded.candidate.manifestSha256
        && identities[label].deploymentId === deploymentId,
      `v594-current-build-identity:${tier}`,
    );
  }
  if (options.requireBuilds) {
    assertV594(identities.standalone && identities.lite, "v594-current-builds-required");
    assertV594(identities.standalone.buildId !== identities.lite.buildId,
      "v594-current-build-tier-alias");
  }
  return Object.freeze({ workspace, paths, ...loaded, identities, deploymentId });
}

function assertObservableZeroSnapshot(snapshot, label) {
  assertV594(snapshot && typeof snapshot === "object", `v594-lifecycle-snapshot:${label}`);
  assertV594(snapshot.captureKind === "unmounted-renderer",
    `v594-lifecycle-snapshot-kind:${label}`);
  const rows = [
    [snapshot.canvas?.count, "canvas.count"],
    [snapshot.canvas?.connected, "canvas.connected"],
    [snapshot.renderer?.active, "renderer.active"],
    [snapshot.renderer?.renderTargets, "renderer.renderTargets"],
    [snapshot.registry?.total, "registry.total"],
    [snapshot.registry?.workers, "registry.workers"],
    [snapshot.registry?.renderTargets, "registry.renderTargets"],
    [snapshot.registry?.textures, "registry.textures"],
    [snapshot.registry?.subscriptions, "registry.subscriptions"],
    [snapshot.registry?.typedArrays, "registry.typedArrays"],
    [snapshot.registry?.estimatedBytes, "registry.estimatedBytes"],
    [snapshot.scene?.active, "scene.active"],
    [snapshot.scene?.objects, "scene.objects"],
    [snapshot.scene?.candidateNodes, "scene.candidateNodes"],
  ];
  for (const [value, field] of rows) assertKnownFiniteZeroV594(value, `${label}:${field}`);
  assertV594(snapshot.renderer?.textures === null
    && snapshot.renderer?.geometries === null
    && snapshot.renderer?.programs === null
    && snapshot.renderer?.resourceCountsSource === "unavailable-context-lost-stale-info",
  `v594-lifecycle-renderer-counters-after-context-loss:${label}`);
  assertV594(snapshot.renderer?.renderTargetsSource === "atlas-resource-registry.gpuRenderTargets"
    && snapshot.renderer?.renderTargets === snapshot.registry?.renderTargets,
  `v594-lifecycle-render-target-source:${label}`);
  for (const field of ["stellarHeroIds", "stellarArchetypes", "stellarContractSha256s"]) {
    assertV594(Array.isArray(snapshot.scene?.[field]) && snapshot.scene[field].length === 0,
      `v594-lifecycle-scene-census-empty:${label}:${field}`);
  }
}

const V594_CONTEXT_LOSS_SOURCES = new Set([
  "webglcontextlost-event",
  "isContextLost",
]);

function assertLifecycleTeardownV594(teardown, {
  label,
  routeAfter,
  observerReleased,
}) {
  assertV594(teardown && typeof teardown === "object" && !Array.isArray(teardown),
    `v594-lifecycle-teardown-shape:${label}`);
  assertV594(teardown.renderListsDisposed === true,
    `v594-lifecycle-render-lists:${label}`);
  assertV594(teardown.forceContextLossCalled === true,
    `v594-lifecycle-force-context-loss:${label}`);
  assertV594(teardown.contextLost === true,
    `v594-lifecycle-context-lost:${label}`);
  assertV594(V594_CONTEXT_LOSS_SOURCES.has(teardown.contextLossSource),
    `v594-lifecycle-context-loss-source:${label}`);
  assertV594(teardown.canvasDetached === true,
    `v594-lifecycle-canvas-detached:${label}`);
  assertV594(teardown.resourceReferencesReleased === true,
    `v594-lifecycle-renderer-references-released:${label}`);
  assertV594(teardown.routeAfter === routeAfter,
    `v594-lifecycle-route-after:${label}`);
  assertV594(teardown.observerReleased === observerReleased,
    `v594-lifecycle-observer-release:${label}`);
  return teardown;
}

function assertLifecycleObserverV594(ledger, {
  label,
  activeAssignment,
  observerReleased,
  routeAfter,
}) {
  const observer = ledger?.observer;
  assertV594(observer && typeof observer === "object" && !Array.isArray(observer),
    `v594-lifecycle-observer-shape:${label}`);
  assertV594(observer.nextAssignment === 2,
    `v594-lifecycle-observer-next-assignment:${label}`);
  assertV594(observer.activeAssignment === activeAssignment,
    `v594-lifecycle-observer-active-assignment:${label}`);
  assertV594(Array.isArray(observer.history) && observer.history.length === 1,
    `v594-lifecycle-observer-history-length:${label}`);
  const entry = observer.history[0];
  assertV594(entry?.assignment === 1,
    `v594-lifecycle-observer-history-assignment:${label}`);
  const teardown = assertLifecycleTeardownV594(entry?.teardown, {
    label: `${label}:history:1`,
    routeAfter,
    observerReleased,
  });
  assertV594(sameCanonicalV594(teardown, ledger?.exit),
    `v594-lifecycle-observer-exit-binding:${label}`);
  return Object.freeze({ assignment: entry.assignment, teardown });
}

function assertLifecycleSnapshotReuseWitnessV594(stage) {
  const rows = stage.phaseChain;
  assertV594(Array.isArray(rows) && rows.length === V594_LIFECYCLE_PHASES.length,
    "v594-lifecycle-snapshot-reuse-witness-phase-count");
  for (const [index, row] of rows.entries()) {
    const witness = row?.state?.snapshotReuseWitness;
    assertV594(
      index === V594_LIFECYCLE_PHASES.length - 1
        ? witness === true
        : witness === null || witness === false,
      `v594-lifecycle-snapshot-reuse-witness:${V594_LIFECYCLE_PHASES[index]}`,
    );
  }
}

export function validateV594LifecycleStage(stage, expectedIdentity, options = {}) {
  verifyV594Seal(stage, "receiptSha256", "lifecycle-stage");
  assertV594(stage.version === V594_LIFECYCLE_STAGE_VERSION, "v594-lifecycle-stage-version");
  assertV594(stage.status === V594_LIFECYCLE_STAGE_STATUS, "v594-lifecycle-stage-status");
  assertV594(stage.formalEvidence === true, "v594-lifecycle-formal-evidence");
  assertV594(stage.evidenceClaim === true, "v594-lifecycle-evidence-claim");
  assertV594(stage.syntheticZeroClaim === false, "v594-lifecycle-synthetic-zero");
  assertV594(stage.promotion === "none", "v594-lifecycle-promotion");
  assertV594(stage.tooling?.runnerVersion === V594_LIFECYCLE_RUNNER_VERSION,
    "v594-lifecycle-runner-version");
  assertV594(stage.tooling?.auditorVersion === V594_LIFECYCLE_AUDITOR_VERSION,
    "v594-lifecycle-auditor-version");
  if (options.syntheticFixture) {
    assertV594(stage.fixture?.synthetic === true, "v594-lifecycle-fixture-marker");
  } else {
    assertV594(stage.fixture?.synthetic !== true, "v594-lifecycle-synthetic-as-formal");
  }
  const identity = validateV594Identity(stage.identity, expectedIdentity, {
    deliveryTier: "standalone-full",
  });
  assertV594(Array.isArray(stage.phaseChain)
    && stage.phaseChain.length === V594_LIFECYCLE_PHASES.length,
  "v594-lifecycle-phase-count");
  let realmToken = null;
  let timeOrigin = null;
  let previous = null;
  for (const [index, phase] of V594_LIFECYCLE_PHASES.entries()) {
    const row = stage.phaseChain[index];
    assertV594(row?.index === index && row?.phase === phase,
      `v594-lifecycle-phase-order:${phase}`);
    assertV594(row.previousPhaseSha256 === previous,
      `v594-lifecycle-phase-replay:${phase}`);
    const unsigned = { ...row };
    delete unsigned.phaseSha256;
    assertV594(
      row.phaseSha256 === canonicalShaV594Closure({
        version: V594_LIFECYCLE_PHASE_LINK_VERSION,
        entry: unsigned,
      }),
      `v594-lifecycle-phase-seal:${phase}`,
    );
    previous = row.phaseSha256;
    assertV594(typeof row.realmToken === "string" && row.realmToken.length >= 8,
      `v594-lifecycle-realm:${phase}`);
    assertKnownPositiveV594(row.timeOrigin, `lifecycle:${phase}:timeOrigin`);
    realmToken ??= row.realmToken;
    timeOrigin ??= row.timeOrigin;
    assertV594(row.realmToken === realmToken && row.timeOrigin === timeOrigin,
      `v594-lifecycle-realm-drift:${phase}`);
  }
  const detached = stage.phaseChain[6]?.state?.ledger?.snapshots?.detached;
  const exited = stage.phaseChain[8]?.state?.ledger?.snapshots?.exited;
  assertV594(detached && typeof detached === "object" && !Array.isArray(detached),
    "v594-lifecycle-detached-snapshot-required");
  assertV594(exited && typeof exited === "object" && !Array.isArray(exited),
    "v594-lifecycle-exited-snapshot-required");
  assertObservableZeroSnapshot(detached, "detached");
  assertObservableZeroSnapshot(exited, "exited");
  assertV594(sameCanonicalV594(detached, exited),
    "v594-lifecycle-detached-exited-snapshot-binding");
  assertLifecycleSnapshotReuseWitnessV594(stage);
  const detachedLedger = stage.phaseChain[6]?.state?.ledger;
  const detachedObserver = assertLifecycleObserverV594(detachedLedger, {
    label: "detached-pre-release",
    activeAssignment: 1,
    observerReleased: null,
    routeAfter: "/",
  });
  const exitedLedger = stage.phaseChain[8]?.state?.ledger;
  const exitedObserver = assertLifecycleObserverV594(exitedLedger, {
    label: "exited-release",
    activeAssignment: null,
    observerReleased: true,
    routeAfter: "/downloads",
  });
  assertV594(detachedObserver.assignment === exitedObserver.assignment,
    "v594-lifecycle-detached-exit-assignment-binding");
  assertV594(exitedLedger?.releaseCompletion?.transition === "next-link-route-exit"
    && exitedLedger.releaseCompletion.observedAfterPhase === "exited"
    && sameCanonicalV594(exitedLedger.releaseCompletion.teardown, exitedLedger.exit),
  "v594-lifecycle-release-completion-binding");
  for (const field of [
    "renderListsDisposed",
    "forceContextLossCalled",
    "contextLost",
    "contextLossSource",
    "canvasDetached",
    "resourceReferencesReleased",
  ]) {
    assertV594(detachedObserver.teardown[field] === exitedObserver.teardown[field],
      `v594-lifecycle-detached-exit-teardown-binding:${field}`);
  }
  for (const field of ["consoleErrors", "pageErrors", "unhandledRejections"]) {
    assertV594(Array.isArray(stage.errors?.[field]) && stage.errors[field].length === 0,
      `v594-lifecycle-errors:${field}`);
  }
  return Object.freeze({ identity, phaseCount: stage.phaseChain.length, realmToken, timeOrigin });
}

export async function buildV594LifecycleReceipt({
  root = process.cwd(),
  outputRoot = root,
  stagePath,
  outputPath = "docs/release/v594/resource-lifecycle-v594.json",
  syntheticFixture = false,
} = {}) {
  assertV594(stagePath, "v594-lifecycle-stage-required");
  const bundle = await loadCurrentV594Bundle(root, { requireBuilds: true });
  const absoluteStage = resolveInsideV594Workspace(bundle.workspace, stagePath, "lifecycle-stage");
  const stage = (await readJsonV594(absoluteStage, "lifecycle-stage")).value;
  const validated = validateV594LifecycleStage(
    stage,
    bundle.identities.standalone,
    { syntheticFixture },
  );
  const unsigned = {
    version: V594_LIFECYCLE_RECEIPT_VERSION,
    generatedAt: stage.completedAt ?? stage.generatedAt ?? bundle.source.generatedAt,
    status: V594_LIFECYCLE_RECEIPT_STATUS,
    candidate: validated.identity,
    evidence: await fileReceiptV594(bundle.workspace, stagePath, "lifecycle-stage"),
    stageReceiptSha256: stage.receiptSha256,
    phaseCount: validated.phaseCount,
    sameRealm: true,
    releaseContractVersion: V594_SCENE_EXIT_RELEASE_CONTRACT_VERSION,
    detachedObservedReleaseContract: true,
    exitedObservedReleaseContract: true,
    snapshotReuseWitness: true,
    detachedAndExitedSnapshotCanonicalEqual: true,
    detachedRendererInfoCountsUnavailableAfterContextLoss: true,
    exitedRendererInfoCountsUnavailableAfterContextLoss: true,
    clientRouteExit: "/downloads",
    tooling: { ...stage.tooling },
    authority: { ...bundle.candidate.authority },
    synthetic: syntheticFixture,
  };
  const receipt = sealV594Document(unsigned);
  if (!syntheticFixture) await atomicWriteJsonV594(
    await resolveV594OutputRoot(bundle.workspace, outputRoot, "lifecycle-output"),
    outputPath,
    receipt,
    "lifecycle-output",
  );
  return receipt;
}

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (new Set(["--stage", "--output", "--validate-fixture"]).has(token)) {
      values[token.slice(2)] = argv[++index];
    } else throw new Error(`v594-lifecycle-argument:${token}`);
  }
  if (values["validate-fixture"]) {
    assertV594(!values.stage, "v594-lifecycle-fixture-stage-conflict");
    values.stage = values["validate-fixture"];
    values.syntheticFixture = true;
  }
  assertV594(values.stage, "v594-lifecycle-stage-required");
  return values;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const receipt = await buildV594LifecycleReceipt({
    stagePath: args.stage,
    outputPath: args.output,
    syntheticFixture: args.syntheticFixture === true,
  });
  process.stdout.write(`${JSON.stringify({
    status: receipt.status,
    stageReceiptSha256: receipt.stageReceiptSha256,
    receiptSha256: receipt.receiptSha256,
    synthetic: receipt.synthetic,
  }, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}

import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readdirSync, statSync } from "node:fs";
import { copyFile, link, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";

const root = resolve(process.cwd());
const generatedAt = "2026-08-23T00:00:00.000Z";
const exportRoot = resolve(root, "dist/release-exports/v593");
const sourceManifestPath = resolve(root, "docs/release/v593/source-manifest-v593.json");
const manifestPath = resolve(root, "public/data/final-art-direction-v593/manifest.json");
const standaloneReceiptPath = resolve(root, "dist/release/atlas-v593-standalone-build-resource.json");
const liteReceiptPath = resolve(root, "dist/release/atlas-v593-lite-build-resource.json");
const finalBrowserPath = resolve(root, "docs/release/v593/final-sealed-browser-matrix-v593.json");
const liteRawPath = resolve(root, "docs/release/v593/lite-browser-matrix-v593.json");
const lifecyclePath = resolve(root, "docs/release/v593/resource-lifecycle-v593.json");
const soakPath = resolve(root, "docs/release/v593/soak-v593.json");
const humanVisualSignoffPath = resolve(root, "docs/release/v593/human-visual-signoff-v593.json");
const exportManifestPath = resolve(root, "docs/release/v593/release-export-v593.json");
const SCIENTIFIC_PAYLOAD_SHA256 = "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674";
const LITE_MAX_BYTES = 82 * 1024 * 1024;
const FULL_MAX_BYTES = 750 * 1024 * 1024;
const LITE_REQUIRED_PUBLIC_PATHS = Object.freeze([
  "data/celestial-art-v589/manifest.json",
  "data/celestial-art-v589/constellation-gaia-bindings-v589.json",
  "data/celestial-art-v589/gaia-lite-46000-v589.bin",
  "data/celestial-rendering-v590/manifest.json",
  "data/celestial-convergence-v591/manifest.json",
  "data/celestial-convergence-v591/constellation-gaia-binding-v591.json",
  "data/celestial-convergence-v591/constellation-label-atlas-v591.json",
  "data/living-universe-v592/manifest.json",
  "data/living-universe-v592/deep-space-visual-assets.json",
  "data/living-universe-v592/nebula-visual-assets.json",
  "data/final-art-direction-v593/manifest.json",
  "textures/candidate-v588/sky/milky-way-desktop.jpg",
  "textures/candidate-v588/sky/milky-way-mobile.jpg",
  "textures/candidate-v591/constellations/labels-sdf.png",
  "basis-v590/basis_transcoder.js",
  "basis-v590/basis_transcoder.wasm",
]);
const SAME_REALM_REQUIRED_GATES = Object.freeze([
  "sourceIdentityStable",
  "sharedBuildIdentity",
  "formalProductPointerFrozen",
  "sourceContractVersion",
  "sourceIdentityMatches",
  "pageIdentityMatches",
  "harnessRealmStable",
  "harnessTimeOriginStable",
  "sourceRealmStable",
  "sourceTimeOriginStable",
  "rendererZeroAfterDetach",
  "registryZeroAfterDetach",
  "nativeWebglReturnedToBaseline",
  "sceneWorkerTargetsReleased",
  "workerLedgerReturnedToBaseline",
  "listenerLedgerReturnedToBaseline",
  "exitedThroughSameRealmClientRoute",
  "finalRendererCleanupObserved",
  "noUnexpectedErrors",
]);
const CDP_HEAP_REQUIRED_GATES = Object.freeze([
  "exactSampleCount",
  "minimumSampleSpan",
  "heapTelemetryComplete",
  "finalHeapWithinAllowance",
  "lastTenOlsWithinLimit",
  "rendererResourceExactStable",
  "identityStable",
  "sourceManifestStable",
  "fpsGate",
  "gpuGate",
  "drawCallGate",
  "pageAuditZero",
  "cliConsoleZero",
]);
const HUMAN_VISUAL_SIGNATURE_PASSES = Object.freeze(["sun", "earth", "jupiter", "saturn", "stellar-archetypes", "deep-sky"]);

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
function canonicalSha(value) {
  return sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
}
function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}
function assertSeal(document, field, label) {
  const unsigned = { ...document };
  delete unsigned[field];
  if (document[field] !== canonicalSha(unsigned)) throw new Error(`v593-closure-seal:${label}`);
}
function assertRawReceipt(document, label) {
  const unsigned = { ...document };
  delete unsigned.receiptSha256;
  const insertionOrderSha = sha256(Buffer.from(JSON.stringify(unsigned), "utf8"));
  if (document.receiptSha256 !== insertionOrderSha && document.receiptSha256 !== canonicalSha(unsigned)) {
    throw new Error(`v593-closure-raw-receipt:${label}`);
  }
}
function sameCanonicalValue(left, right) {
  return canonicalSha(left) === canonicalSha(right);
}
function allRequiredGatesPassed(gates, required) {
  return Boolean(
    gates
    && typeof gates === "object"
    && !Array.isArray(gates)
    && required.every((name) => gates[name] === true)
    && Object.values(gates).every((value) => value === true),
  );
}
function trustedListenerAccounting(proof, raw) {
  return ["baseline", "mounted", "detached", "exited"].every((phase) => {
    const live = proof?.listenerBaselineDelta?.[phase];
    const registered = proof?.listenerBaselineDelta?.rawRegistered?.[phase];
    const inactive = proof?.listenerBaselineDelta?.inactiveTargets?.[phase];
    const harness = raw?.phases?.[phase]?.source?.harness;
    const rawLive = harness?.listenerCount;
    const rawRegistered = harness?.rawRegisteredListenerCount;
    const rawInactive = harness?.inactiveTargetListenerCount;
    return [live, registered, inactive, rawLive, rawRegistered, rawInactive]
      .every((value) => Number.isSafeInteger(value) && value >= 0)
      && registered === live + inactive
      && rawRegistered === rawLive + rawInactive
      && live === rawLive
      && registered === rawRegistered
      && inactive === rawInactive;
  });
}
function assertFileBytes(entry, label) {
  if (
    !entry
    || typeof entry.path !== "string"
    || entry.path.length === 0
    || !Number.isSafeInteger(entry.bytes)
    || entry.bytes < 0
    || typeof entry.sha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(entry.sha256)
  ) throw new Error(`v593-closure-evidence-record:${label}`);
  const path = resolve(root, entry.path);
  const workspacePath = relative(root, path);
  if (workspacePath === "" || workspacePath === ".." || workspacePath.startsWith(`..${sep}`)) throw new Error(`v593-closure-evidence-boundary:${label}`);
  if (!existsSync(path) || !statSync(path).isFile()) throw new Error(`v593-closure-evidence-missing:${label}`);
  const bytes = readFileSync(path);
  if (bytes.byteLength !== entry.bytes || sha256(bytes) !== entry.sha256) {
    throw new Error(`v593-closure-evidence-byte-drift:${label}`);
  }
  return bytes;
}
function assertFileRecord(entry, label) {
  return JSON.parse(assertFileBytes(entry, label).toString("utf8"));
}
function assertCurrentCandidate(candidate, expected, label) {
  if (
    candidate?.route !== "/local-shadow-v593"
    || candidate.buildId !== expected.buildId
    || typeof candidate.deploymentId !== "string"
    || candidate.deploymentId.length === 0
    || candidate.sourceManifestSha256 !== expected.sourceManifestSha256
    || candidate.manifestSha256 !== expected.manifestSha256
    || candidate.scientificPayloadSha256 !== SCIENTIFIC_PAYLOAD_SHA256
  ) throw new Error(`v593-closure-current-identity:${label}`);
}
function assertTrustedSameRealmProof(lifecycle, soak, expected) {
  const proof = lifecycle.sameRealmSceneExit;
  if (
    proof?.status !== "passed-same-realm-resource-zero"
    || proof.receiptVerified !== true
    || !["sha256-json-insertion-order", "sha256-canonical-json"].includes(proof.receiptSealAlgorithm)
    || proof.allGatesPassed !== true
    || proof.syntheticZeroClaim !== false
    || !allRequiredGatesPassed(proof.gates, SAME_REALM_REQUIRED_GATES)
    || proof.workerOwnership?.sceneTargetsReleased !== true
    || proof.workerOwnership?.ledgerReturnedToBaseline !== true
    || !Array.isArray(proof.workerOwnership?.sceneCreatedTargetIds)
    || !Array.isArray(proof.workerOwnership?.targets?.baseline)
    || !Array.isArray(proof.workerOwnership?.targets?.mounted)
    || !Array.isArray(proof.workerOwnership?.targets?.detached)
    || !Array.isArray(proof.workerOwnership?.targets?.exited)
    || !Number.isSafeInteger(proof.workerOwnership?.targetCounts?.baseline)
    || !Number.isSafeInteger(proof.workerOwnership?.targetCounts?.mounted)
    || !Number.isSafeInteger(proof.workerOwnership?.targetCounts?.detached)
    || !Number.isSafeInteger(proof.workerOwnership?.targetCounts?.exited)
    || proof.workerOwnership.targetCounts.baseline !== proof.workerOwnership.targets.baseline.length
    || proof.workerOwnership.targetCounts.mounted !== proof.workerOwnership.targets.mounted.length
    || proof.workerOwnership.targetCounts.detached !== proof.workerOwnership.targets.detached.length
    || proof.workerOwnership.targetCounts.exited !== proof.workerOwnership.targets.exited.length
    || proof.listenerBaselineDelta?.returnedToBaseline !== true
    || !Number.isFinite(proof.listenerBaselineDelta?.baseline)
    || !Number.isFinite(proof.listenerBaselineDelta?.mounted)
    || !Number.isFinite(proof.listenerBaselineDelta?.detached)
    || !Number.isFinite(proof.listenerBaselineDelta?.exited)
    || !Number.isFinite(proof.listenerBaselineDelta?.detachedDelta)
    || !Number.isFinite(proof.listenerBaselineDelta?.exitedDelta)
    || proof.listenerBaselineDelta?.detachedDelta > 0
    || proof.listenerBaselineDelta?.exitedDelta > 0
    || proof.listenerBaselineDelta.detachedDelta !== proof.listenerBaselineDelta.detached - proof.listenerBaselineDelta.baseline
    || proof.listenerBaselineDelta.exitedDelta !== proof.listenerBaselineDelta.exited - proof.listenerBaselineDelta.baseline
    || proof.r3fCleanup?.renderListsDisposed !== true
    || proof.r3fCleanup?.contextLost !== true
    || proof.r3fCleanup?.canvasDetached !== true
    || proof.r3fCleanup?.liveContextCountAfterExit !== 0
    || proof.r3fCleanup?.cleanupObserved !== true
    || proof.realm?.stable !== true
    || proof.realm?.routeAfter !== "/downloads"
    || !["textures", "geometries", "programs", "renderTargets"].every((key) => proof.rendererAfterDetach?.[key] === 0)
    || !["total", "workers", "renderTargets", "textures", "subscriptions", "typedArrays", "estimatedBytes"].every((key) => proof.registryAfterDetach?.[key] === 0)
    || !sameCanonicalValue(proof, soak.sameRealmSceneExit)
  ) throw new Error("v593-closure-same-realm-contract");
  const raw = assertFileRecord(proof.evidence, "same-realm");
  assertRawReceipt(raw, "same-realm");
  if (
    proof.receiptSha256 !== raw.receiptSha256
    || raw.version !== "v593-same-realm-scene-exit-stage-v1"
    || raw.status !== "staging-same-realm-scene-exit-passed-not-promoted"
    || raw.qualificationScope !== "v593-current-shared-build-same-realm-scene-exit-staging"
    || raw.protocolPreRegisteredBeforeBrowserRun !== true
    || raw.analysis?.status !== "passed"
    || raw.analysis?.failedGates?.length !== 0
    || raw.syntheticZeroClaim !== false
    || raw.promotion !== "staging-only"
    || !allRequiredGatesPassed(raw.analysis?.gates, SAME_REALM_REQUIRED_GATES)
    || !sameCanonicalValue(proof.gates, raw.analysis.gates)
    || !trustedListenerAccounting(proof, raw)
    || !sameCanonicalValue(proof.workerOwnership?.sceneCreatedTargetIds, raw.analysis?.sceneTargetIds)
    || !sameCanonicalValue(proof.workerOwnership?.targets, raw.analysis?.workerTargets)
    || proof.listenerBaselineDelta.baseline !== raw.phases?.baseline?.source?.harness?.listenerCount
    || proof.listenerBaselineDelta.mounted !== raw.phases?.mounted?.source?.harness?.listenerCount
    || proof.listenerBaselineDelta.detached !== raw.phases?.detached?.source?.harness?.listenerCount
    || proof.listenerBaselineDelta.exited !== raw.phases?.exited?.source?.harness?.listenerCount
    || proof.r3fCleanup.renderListsDisposed !== raw.phases?.exited?.source?.sourceLedger?.exit?.renderListsDisposed
    || proof.r3fCleanup.contextLost !== raw.phases?.exited?.source?.sourceLedger?.exit?.contextLost
    || proof.r3fCleanup.canvasDetached !== raw.phases?.exited?.source?.sourceLedger?.exit?.canvasDetached
    || proof.r3fCleanup.liveContextCountAfterExit !== raw.phases?.exited?.source?.harness?.webgl?.liveContextCount
    || raw.sourceIdentityBefore?.expected?.buildId !== expected.buildId
    || raw.sourceIdentityBefore?.expected?.sourceManifestSha256 !== expected.sourceManifestSha256
    || raw.sourceIdentityBefore?.expected?.candidateManifestSha256 !== expected.manifestSha256
    || raw.sourceIdentityBefore?.expected?.scientificPayloadSha256 !== SCIENTIFIC_PAYLOAD_SHA256
    || !sameCanonicalValue(raw.sourceIdentityBefore?.expected, raw.sourceIdentityAfter?.expected)
    || raw.sourceIdentityBefore?.formalProductPointer !== "v263"
    || raw.sourceIdentityAfter?.formalProductPointer !== "v263"
    || raw.discovery?.buildManifestProbe?.buildId !== expected.buildId
  ) throw new Error("v593-closure-same-realm-receipt");
  return proof;
}
function assertTrustedCdpHeapProof(soak, expected) {
  const proof = soak.cdpHeapSoak;
  if (
    proof?.status !== "passed-current-identity-authoritative-cdp-heap-soak"
    || proof.receiptVerified !== true
    || !["sha256-json-insertion-order", "sha256-canonical-json"].includes(proof.receiptSealAlgorithm)
    || proof.allGatesPassed !== true
    || proof.syntheticHeapPassClaim !== false
    || proof.sampleCount < 181
    || proof.memory?.sampleSpanMilliseconds < 1_800_000
    || proof.durationSeconds < 1800
    || !allRequiredGatesPassed(proof.gates, CDP_HEAP_REQUIRED_GATES)
    || !Number.isFinite(proof.heap?.baselineUsedSizeBytes)
    || !Number.isFinite(proof.heap?.finalUsedSizeBytes)
    || !Number.isFinite(proof.heap?.allowanceBytes)
    || !Number.isFinite(proof.heap?.lastTenOlsBytesPerSample)
    || proof.heap.finalUsedSizeBytes > proof.heap.baselineUsedSizeBytes + proof.heap.allowanceBytes
    || proof.heap.lastTenOlsBytesPerSample > 262_144
    || proof.runtime?.rendererFingerprintCount !== 1
    || proof.renderer?.resourceGrowth !== false
    || proof.renderer?.resourceBaselineStable !== true
    || proof.renderer?.fingerprintCount !== 1
    || proof.memory?.status !== "passed-authoritative-cdp-heap-soak"
    || proof.memory?.measurementAuthority !== "HeapProfiler.collectGarbage-before-Runtime.getHeapUsage"
    || proof.memory?.jsHeapTelemetry !== "available-chromium-cdp-runtime-getHeapUsage"
    || proof.memory?.finalHeapWithinAllowance !== true
    || proof.memory?.lastTenOlsWithinLimit !== true
    || proof.memory?.sustainedJsHeapGrowth !== false
    || proof.memory?.requiredForClosure !== true
    || proof.memory?.noSyntheticSubstitution !== true
    || !sameCanonicalValue(proof.memory, soak.memory)
    || proof.console?.pageAudit?.consoleWarningCount !== 0
    || proof.console?.pageAudit?.consoleErrorCount !== 0
    || proof.console?.pageAudit?.pageErrorCount !== 0
    || proof.console?.pageAudit?.unhandledRejectionCount !== 0
    || proof.console?.pageAudit?.webglEventCount !== 0
  ) throw new Error("v593-closure-cdp-heap-contract");
  const raw = assertFileRecord(proof.evidence, "cdp-heap");
  assertRawReceipt(raw, "cdp-heap");
  if (
    proof.receiptSha256 !== raw.receiptSha256
    || raw.version !== "v593-cdp-heap-soak-stage-v1"
    || raw.status !== "staging-cdp-heap-soak-passed-not-promoted"
    || raw.qualificationScope !== "v593-current-shared-build-cdp-heap-soak"
    || raw.protocolPreRegisteredBeforeSampling !== true
    || raw.effectiveRun?.preflight !== false
    || raw.analysis?.status !== "passed"
    || raw.promotion !== "staging-only"
    || !allRequiredGatesPassed(raw.analysis?.gates, CDP_HEAP_REQUIRED_GATES)
    || !sameCanonicalValue(proof.gates, raw.analysis.gates)
    || !sameCanonicalValue(proof.heap, raw.analysis.heap)
    || !sameCanonicalValue(proof.runtime, raw.analysis.runtime)
    || proof.console?.count !== 0
    || proof.console?.cliRaw !== raw.analysis.console?.cliRaw
    || proof.console?.stderr !== raw.analysis.console?.stderr
    || !sameCanonicalValue(proof.console?.pageAudit, raw.analysis.console?.pageAudit)
    || raw.expectedIdentity?.buildId !== expected.buildId
    || raw.expectedIdentity?.deploymentId !== soak.candidate.deploymentId
    || raw.expectedIdentity?.sourceManifestSha256 !== expected.sourceManifestSha256
    || raw.expectedIdentity?.candidateManifestSha256 !== expected.manifestSha256
    || raw.expectedIdentity?.scientificPayloadSha256 !== SCIENTIFIC_PAYLOAD_SHA256
  ) throw new Error("v593-closure-cdp-heap-receipt");
  return proof;
}
function inspectHumanVisualSignoff(receipt, expected) {
  const base = {
    approved: false,
    status: receipt ? "blocked-human-signoff-contract" : "pending-human-signoff-not-present",
    receiptSha256: typeof receipt?.receiptSha256 === "string" ? receipt.receiptSha256 : null,
    identityMatches: false,
  };
  if (!receipt) return base;

  const passNames = Object.keys(receipt.passes ?? {});
  const identityMatches = receipt.candidate?.route === "/local-shadow-v593"
    && receipt.candidate?.buildId === expected.buildId
    && receipt.candidate?.deploymentId === expected.deploymentId
    && receipt.candidate?.sourceManifestSha256 === expected.sourceManifestSha256
    && receipt.candidate?.manifestSha256 === expected.manifestSha256
    && receipt.candidate?.formalProductPointer === "v263";
  const policyMatches = receipt.policy?.sameBuildBeforeAfter === true
    && receipt.policy?.currentBuildOnly === true
    && receipt.policy?.noHistoricalScreenshotSubstitution === true
    && receipt.policy?.fullFrameAnd100PercentCropRequired === true
    && receipt.policy?.scientificPayloadWriteback === false
    && receipt.policy?.signaturePassesRequired === HUMAN_VISUAL_SIGNATURE_PASSES.length;
  const automaticPasses = sameCanonicalValue(passNames, HUMAN_VISUAL_SIGNATURE_PASSES)
    && HUMAN_VISUAL_SIGNATURE_PASSES.every((name) => {
      const pass = receipt.passes?.[name];
      return pass?.sourceMaterialCorrectness?.startsWith("passed-live-webgl-material")
        && pass.currentBuildBeforeAfter === true
        && pass.runtimeAbGate === true
        && pass.payloadStable === true
        && pass.fpsGpuResourceGate === true;
    });
  const frameEnvelope = Array.isArray(receipt.frames)
    && receipt.frames.length === 15
    && receipt.frames.every((frame) => (
      HUMAN_VISUAL_SIGNATURE_PASSES.includes(frame.pass)
      && frame.signatureBuild?.buildId === expected.buildId
      && frame.signatureBuild?.sourceManifestSha256 === expected.sourceManifestSha256
      && frame.scientificPayloadSha256 === SCIENTIFIC_PAYLOAD_SHA256
      && frame.scientificPayloadWriteback === false
      && (frame.humanReview === "pending" || frame.humanReview === "approved")
    ));
  const automaticReviewReady = receipt.reviewReadiness?.allAutomaticPassPrerequisitesPassed === true
    && receipt.reviewReadiness?.blockedPasses?.length === 0;
  const authorityMatches = receipt.authority?.scientificPayloadSha256 === SCIENTIFIC_PAYLOAD_SHA256
    && receipt.authority?.scientificPayloadWriteback === false
    && receipt.authority?.measuredAuthorityGranted === false
    && receipt.authority?.gpuAuthorityGranted === false
    && receipt.authority?.productionReleaseAuthorized === false;
  const commonValid = identityMatches && policyMatches && automaticPasses && frameEnvelope && automaticReviewReady && authorityMatches;
  if (!commonValid) return { ...base, identityMatches };

  const approved = receipt.status === "approved-v593-six-signature-pass-human-visual-signoff"
    && receipt.signaturePassesApproved === HUMAN_VISUAL_SIGNATURE_PASSES.length
    && receipt.approved === true
    && typeof receipt.reviewer === "string"
    && receipt.reviewer.trim().length > 0
    && Number.isFinite(Date.parse(receipt.reviewedAt ?? receipt.generatedAt))
    && HUMAN_VISUAL_SIGNATURE_PASSES.every((name) => receipt.passes?.[name]?.humanVisualSignoff === "approved")
    && receipt.frames.every((frame) => frame.humanReview === "approved");
  if (approved) return { ...base, approved: true, status: "approved-v593-six-signature-pass-human-visual-signoff", identityMatches: true };

  const pending = receipt.status === "pending-human-visual-signoff"
    && receipt.signaturePassesApproved === 0
    && receipt.approved === false
    && receipt.reviewer == null
    && HUMAN_VISUAL_SIGNATURE_PASSES.every((name) => receipt.passes?.[name]?.humanVisualSignoff === "pending")
    && receipt.frames.every((frame) => frame.humanReview === "pending");
  if (pending) return { ...base, status: "pending-human-visual-signoff", identityMatches: true };
  return { ...base, identityMatches: true };
}
function fileRecord(path, logicalPath) {
  const bytes = readFileSync(path);
  return Object.freeze({ path: logicalPath, bytes: bytes.byteLength, sha256: sha256(bytes) });
}
function safePublicPath(value) {
  if (typeof value !== "string" || !value.startsWith("/")) return null;
  const clean = value.replace(/^\/+/, "");
  if (clean.includes("..") || clean.includes("\\") || clean.includes("\0")) throw new Error(`v593-export-path:${value}`);
  const absolute = resolve(root, "public", clean);
  const publicRoot = resolve(root, "public");
  const rel = relative(publicRoot, absolute);
  if (rel.startsWith("..") || rel.includes(`..${sep}`)) throw new Error(`v593-export-boundary:${value}`);
  return { absolute, relative: rel.replaceAll("\\", "/") };
}
function walkRegular(path, logicalPrefix, out = []) {
  if (!existsSync(path)) return out;
  const info = lstatSync(path);
  if (info.isSymbolicLink()) return out;
  if (info.isFile()) {
    out.push({ absolute: path, relative: `${logicalPrefix}/${path.split(/[\\/]/).pop()}`.replace(/^\//, "") });
    return out;
  }
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const child = resolve(path, entry.name);
    if (entry.isDirectory()) walkRegular(child, `${logicalPrefix}/${entry.name}`, out);
    else if (entry.isFile()) out.push({ absolute: child, relative: `${logicalPrefix}/${entry.name}`.replace(/^\//, "") });
  }
  return out;
}
async function materialize(source, destination) {
  await mkdir(dirname(destination), { recursive: true });
  try { await link(source, destination); } catch (error) {
    if (!new Set(["EXDEV", "EPERM", "EACCES"]).has(error?.code)) throw error;
    await copyFile(source, destination);
  }
}
function collectStringValues(value, values = []) {
  if (typeof value === "string") values.push(value);
  else if (Array.isArray(value)) for (const item of value) collectStringValues(item, values);
  else if (value && typeof value === "object") for (const item of Object.values(value)) collectStringValues(item, values);
  return values;
}
function addReference(references, relativePath) {
  const path = resolve(root, "public", relativePath);
  if (existsSync(path) && statSync(path).isFile()) references.set(relativePath.replaceAll("\\", "/"), path);
}
function addReferenceDirectory(references, relativePath, predicate = () => true) {
  const directory = resolve(root, "public", relativePath);
  if (!existsSync(directory) || !statSync(directory).isDirectory()) return;
  for (const item of walkRegular(directory, relativePath)) {
    const clean = item.relative.replaceAll("\\", "/");
    if (predicate(clean)) references.set(clean, item.absolute);
  }
}
function collectFullPublicReferences() {
  const manifests = [
    "public/data/celestial-convergence-v591/manifest.json",
    "public/data/living-universe-v592/manifest.json",
    "public/data/celestial-art-v589/manifest.json",
    "public/data/celestial-rendering-v590/manifest.json",
    "public/data/visual-restoration-v588/manifest.json",
    "public/data/final-art-direction-v593/manifest.json",
  ];
  const references = new Map();
  for (const relativePath of manifests) {
    const path = resolve(root, relativePath);
    if (!existsSync(path)) continue;
    for (const value of collectStringValues(readJson(path))) {
      const candidate = safePublicPath(value);
      if (candidate && existsSync(candidate.absolute) && statSync(candidate.absolute).isFile()) references.set(candidate.relative, candidate.absolute);
    }
  }
  const baseLiteManifestPath = resolve(root, "public/atlas-lite/manifest.json");
  if (existsSync(baseLiteManifestPath)) {
    const baseLite = readJson(baseLiteManifestPath);
    for (const entry of baseLite.files ?? []) {
      const candidate = safePublicPath(`/${entry.path}`);
      if (candidate && existsSync(candidate.absolute) && statSync(candidate.absolute).isFile()) references.set(candidate.relative, candidate.absolute);
    }
  }
  for (const relativePath of [
    "textures/sky/orbit-atlas-v9-stars-4k.jpg",
    "textures/sky/orbit-atlas-v9-dust-2k.jpg",
    "textures/sky/orbit-atlas-v9-base-8k.jpg",
  ]) {
    const path = resolve(root, "public", relativePath);
    if (existsSync(path) && statSync(path).isFile()) references.set(relativePath, path);
  }
  for (const relativePath of [
    "data/final-art-direction-v593/manifest.json",
    "data/living-universe-v592/manifest.json",
    "data/celestial-convergence-v591/manifest.json",
    "data/celestial-art-v589/manifest.json",
    "data/celestial-rendering-v590/manifest.json",
    "data/visual-restoration-v588/manifest.json",
    "data/kerr-observation-v587/observation-summary.json",
  ]) {
    const path = resolve(root, "public", relativePath);
    if (existsSync(path) && statSync(path).isFile()) references.set(relativePath, path);
  }
  return references;
}
function collectLitePublicReferences() {
  const references = new Map();
  // v593 Lite is a route-scoped Vercel payload. It deliberately does not
  // inherit the entire historical atlas-lite tree: that tree contains legacy
  // catalog shards, spacecraft and duplicate planet assets unrelated to the
  // v593 observatory route. Every retained path is reachable from the v593
  // manifests or the fixed deep-space fallback contract.
  for (const relativePath of [
    "atlas-lite/manifest.json",
    "atlas-lite/data/asterisms-v255.json",
    "atlas-lite/data/nebulae-v255-additions.json",
    "atlas-lite/data/star-clusters-v255-additions.json",
    "atlas-lite/data/gaia-dr3-bright-5000.json",
    "atlas-lite/data/gaia-dr3-kinematics-2000.json",
    "atlas-lite/data/gaia-dr3-nearby-46000-v255.json",
    "atlas-lite/textures/sky/orbit-atlas-v9-base-4k.jpg",
    "atlas-lite/textures/sky/orbit-atlas-v9-stars-4k.jpg",
    "atlas-lite/textures/sky/orbit-atlas-v9-stars-2k.jpg",
    "atlas-lite/textures/sky/orbit-atlas-v9-dust-2k.jpg",
    "textures/candidate-v588/sky/milky-way-desktop.jpg",
    "textures/candidate-v588/sky/milky-way-mobile.jpg",
    "textures/sky/orbit-atlas-v9-stars-4k.jpg",
    "textures/sky/orbit-atlas-v9-stars-2k.jpg",
    "textures/sky/orbit-atlas-v9-dust-2k.jpg",
    "textures/candidate-v591/constellations/labels-sdf.png",
    "basis-v590/basis_transcoder.js",
    "basis-v590/basis_transcoder.wasm",
  ]) addReference(references, relativePath);

  for (const relativePath of [
    "data/celestial-art-v589",
    "data/celestial-rendering-v590",
    "data/celestial-convergence-v591",
    "data/living-universe-v592",
    "data/final-art-direction-v593",
    "data/kerr-observation-v587",
  ]) addReferenceDirectory(references, relativePath);

  addReferenceDirectory(references, "textures/candidate-v589/lite", (path) => !path.includes("/ktx2/"));
  addReferenceDirectory(references, "textures/candidate-v591", (path) => path.includes("/lite/"));
  addReferenceDirectory(references, "textures/candidate-v592", (path) => path.includes("/lite/"));

  addReferenceDirectory(references, "models/candidate-v589/bennu", (path) => /bennu-lod[012]\.glb$/.test(path));
  addReferenceDirectory(references, "models/candidate-v591", (path) => /-lod[012]\.glb$/.test(path));
  return references;
}
function collectPublicReferences(tier) {
  return tier === "vercel-lite" ? collectLitePublicReferences() : collectFullPublicReferences();
}
async function buildExport(tier, receipt) {
  const tierRoot = resolve(exportRoot, tier);
  await rm(tierRoot, { recursive: true, force: true });
  await mkdir(tierRoot, { recursive: true });
  const entries = [];
  const distDir = resolve(root, receipt.distDir);
  let excludedStandaloneBytes = 0;
  let excludedStandaloneFileCount = 0;
  if (tier === "standalone-full") {
    for (const item of walkRegular(resolve(distDir, "standalone"), "runtime/standalone")) {
      await materialize(item.absolute, resolve(tierRoot, item.relative));
      entries.push(fileRecord(item.absolute, item.relative));
    }
  } else {
    // Vercel supplies the Next server runtime. The deployable Lite payload is
    // the route server/static output plus the explicitly admitted public
    // assets; keep the local standalone trace measured and disclosed below,
    // but do not pretend it is part of the Vercel upload.
    const standaloneItems = walkRegular(resolve(distDir, "standalone"), "runtime/standalone");
    excludedStandaloneFileCount = standaloneItems.length;
    excludedStandaloneBytes = standaloneItems.reduce((sum, item) => sum + statSync(item.absolute).size, 0);
    for (const item of walkRegular(resolve(distDir, "server"), "runtime/server")) {
      await materialize(item.absolute, resolve(tierRoot, item.relative));
      entries.push(fileRecord(item.absolute, item.relative));
    }
    for (const name of [
      "BUILD_ID",
      "app-path-routes-manifest.json",
      "build-manifest.json",
      "images-manifest.json",
      "prerender-manifest.json",
      "react-loadable-manifest.json",
      "required-server-files.json",
      "routes-manifest.json",
    ]) {
      const path = resolve(distDir, name);
      if (existsSync(path) && statSync(path).isFile()) {
        const relativePath = `runtime/meta/${name}`;
        await materialize(path, resolve(tierRoot, relativePath));
        entries.push(fileRecord(path, relativePath));
      }
    }
  }
  for (const item of walkRegular(resolve(distDir, "static"), "runtime/static")) {
    await materialize(item.absolute, resolve(tierRoot, item.relative));
    entries.push(fileRecord(item.absolute, item.relative));
  }
  const publicReferences = collectPublicReferences(tier);
  if (tier === "vercel-lite") {
    const missingRequired = LITE_REQUIRED_PUBLIC_PATHS.filter((path) => !publicReferences.has(path));
    if (missingRequired.length > 0) throw new Error(`v593-lite-required-public-missing:${missingRequired.join(",")}`);
    const forbidden = [...publicReferences.keys()].filter((path) => (
      path.includes("/ktx2/")
      || path.includes("/full/")
      || path.includes("/fallback/")
      || path.includes("bennu-lod-source")
      || path.includes("/spacecraft/")
      || path.includes("catalog-lite-v6/")
    ));
    if (forbidden.length > 0) throw new Error(`v593-lite-forbidden-public:${forbidden.join(",")}`);
  }
  for (const [relativePath, absolute] of publicReferences) {
    await materialize(absolute, resolve(tierRoot, `public/${relativePath}`));
    entries.push(fileRecord(absolute, `public/${relativePath}`));
  }
  if (tier === "standalone-full") {
    for (const item of walkRegular(resolve(root, "dist/content-packs/v593/files/v593-deep-field-observations"), "content-packs/v593-deep-field-observations")) {
      await materialize(item.absolute, resolve(tierRoot, item.relative));
      entries.push(fileRecord(item.absolute, item.relative));
    }
  } else {
    for (const item of walkRegular(resolve(root, "dist/content-packs/v593/files/v593-lite-surface-detail"), "content-packs/v593-lite-surface-detail")) {
      await materialize(item.absolute, resolve(tierRoot, item.relative));
      entries.push(fileRecord(item.absolute, item.relative));
    }
  }
  const unique = [...new Map(entries.map((entry) => [entry.path, entry])).values()].sort((a, b) => a.path.localeCompare(b.path));
  const installedBytes = unique.reduce((sum, entry) => sum + entry.bytes, 0);
  const maxBytes = tier === "standalone-full" ? FULL_MAX_BYTES : LITE_MAX_BYTES;
  const budgetPassed = installedBytes <= maxBytes;
  const publicEntries = unique.filter((entry) => entry.path.startsWith("public/"));
  const publicBytes = publicEntries.reduce((sum, entry) => sum + entry.bytes, 0);
  return Object.freeze({
    tier,
    runtimeModel: tier === "vercel-lite" ? "vercel-next-server-static-platform-runtime" : "standalone-node-runtime",
    root: relative(root, tierRoot).replaceAll("\\", "/"),
    fileCount: unique.length,
    installedBytes,
    maximumBytes: maxBytes,
    headroomBytes: maxBytes - installedBytes,
    status: budgetPassed ? "passed" : "blocked-budget",
    budgetPassed,
    publicPayload: {
      fileCount: publicEntries.length,
      bytes: publicBytes,
      pathsSha256: canonicalSha(publicEntries.map((entry) => ({ path: entry.path, bytes: entry.bytes, sha256: entry.sha256 }))),
    },
    excludedStandaloneTrace: tier === "vercel-lite"
      ? { fileCount: excludedStandaloneFileCount, bytes: excludedStandaloneBytes, countedInBudget: false, reason: "Vercel platform runtime; retained as local build evidence" }
      : null,
    files: unique,
  });
}

for (const path of [sourceManifestPath, manifestPath, standaloneReceiptPath, liteReceiptPath, finalBrowserPath, liteRawPath, lifecyclePath, soakPath]) {
  if (!existsSync(path)) throw new Error(`v593-closure-input-missing:${path}`);
}
const source = readJson(sourceManifestPath);
const manifest = readJson(manifestPath);
const expectedDeploymentId = `v593-${source.receiptSha256.slice(0, 12)}-${manifest.manifestSha256.slice(0, 12)}`;
const standaloneReceipt = readJson(standaloneReceiptPath);
const liteReceipt = readJson(liteReceiptPath);
const finalBrowser = readJson(finalBrowserPath);
const liteRaw = readJson(liteRawPath);
const lifecycle = readJson(lifecyclePath);
const soak = readJson(soakPath);
const humanVisualSignoff = existsSync(humanVisualSignoffPath) ? readJson(humanVisualSignoffPath) : null;
assertSeal(source, "receiptSha256", "source-manifest");
assertSeal(manifest, "manifestSha256", "candidate-manifest");
for (const entry of source.files ?? []) assertFileBytes(entry, `source:${entry.path}`);
assertSeal(finalBrowser, "receiptSha256", "final-browser");
assertSeal(liteRaw, "receiptSha256", "lite-browser");
assertSeal(lifecycle, "receiptSha256", "resource-lifecycle");
assertSeal(soak, "receiptSha256", "soak");
if (humanVisualSignoff) assertSeal(humanVisualSignoff, "receiptSha256", "human-visual-signoff");
const finalBrowserStage = assertFileRecord(finalBrowser.evidence, "final-browser-stage-batch");
const liteBrowserStage = assertFileRecord(liteRaw.evidence, "lite-browser-stage-batch");
if (
  finalBrowserStage.version !== "v593-full-matrix-browser-stage-v2"
  || finalBrowserStage.status !== "staging-full-matrix-audit-passed-not-promoted"
  || finalBrowserStage.identity?.buildId !== standaloneReceipt.buildId
  || finalBrowserStage.identity?.deploymentId !== expectedDeploymentId
  || finalBrowserStage.identity?.sourceManifestSha256 !== source.receiptSha256
  || finalBrowserStage.identity?.candidateManifestSha256 !== manifest.manifestSha256
  || finalBrowserStage.identity?.scientificPayloadSha256 !== SCIENTIFIC_PAYLOAD_SHA256
  || finalBrowserStage.frames?.length !== 42
  || finalBrowserStage.failures?.some((failure) => !failure.resolution)
  || finalBrowserStage.console?.count !== 0
  || finalBrowserStage.fullMatrixAudit?.status !== "passed-staging-integrity-not-promoted"
  || finalBrowserStage.fullMatrixAudit?.errors?.length !== 0
  || liteBrowserStage.version !== "v593-lite-browser-stage-v2"
  || liteBrowserStage.status !== "staging-lite-matrix-audit-passed-not-promoted"
  || liteBrowserStage.identity?.buildId !== liteReceipt.buildId
  || liteBrowserStage.identity?.deploymentId !== expectedDeploymentId
  || liteBrowserStage.identity?.sourceManifestSha256 !== source.receiptSha256
  || liteBrowserStage.identity?.candidateManifestSha256 !== manifest.manifestSha256
  || liteBrowserStage.identity?.scientificPayloadSha256 !== SCIENTIFIC_PAYLOAD_SHA256
  || liteBrowserStage.frames?.length !== 8
  || liteBrowserStage.failures?.length !== 0
  || liteBrowserStage.console?.count !== 0
  || liteBrowserStage.liteMatrixAudit?.status !== "passed-staging-integrity-not-promoted"
  || liteBrowserStage.liteMatrixAudit?.errors?.length !== 0
) throw new Error("v593-closure-browser-stage-contract");
const expectedIdentity = Object.freeze({
  buildId: standaloneReceipt.buildId,
  sourceManifestSha256: source.receiptSha256,
  manifestSha256: manifest.manifestSha256,
});
assertCurrentCandidate(lifecycle.candidate, expectedIdentity, "resource-lifecycle");
assertCurrentCandidate(soak.candidate, expectedIdentity, "soak");
if (lifecycle.candidate.deploymentId !== soak.candidate.deploymentId) {
  throw new Error("v593-closure-deployment-identity");
}
if (lifecycle.candidate.deploymentId !== expectedDeploymentId || soak.candidate.deploymentId !== expectedDeploymentId) {
  throw new Error("v593-closure-deterministic-deployment-identity");
}
const sameRealmSceneExit = assertTrustedSameRealmProof(lifecycle, soak, expectedIdentity);
const cdpHeapSoak = assertTrustedCdpHeapProof(soak, expectedIdentity);
const humanVisualState = inspectHumanVisualSignoff(humanVisualSignoff, {
  ...expectedIdentity,
  buildId: standaloneReceipt.buildId,
  deploymentId: expectedDeploymentId,
});
const rendererSoakPassed = Boolean(
  soak.aggregate?.rendererResourceGrowth === false
  && soak.aggregate?.rendererResourceBaselineStable === true
  && cdpHeapSoak.renderer?.fingerprintCount === 1
  && cdpHeapSoak.gates.rendererResourceExactStable === true,
);
const jsHeapTelemetry = soak.memory?.jsHeapTelemetry ?? "unavailable";
const jsHeapGate = soak.memory?.status === "passed-authoritative-cdp-heap-soak"
  && soak.memory?.measurementAuthority === "HeapProfiler.collectGarbage-before-Runtime.getHeapUsage"
  && soak.memory?.jsHeapTelemetry === "available-chromium-cdp-runtime-getHeapUsage"
  && soak.memory?.sampleCount === cdpHeapSoak.sampleCount
  && soak.memory?.sampleSpanMilliseconds === cdpHeapSoak.memory?.sampleSpanMilliseconds
  && soak.memory?.sustainedJsHeapGrowth === false
  && soak.memory?.finalHeapWithinAllowance === true
  && soak.memory?.lastTenOlsWithinLimit === true
  && soak.memory?.requiredForClosure === true
  && soak.memory?.noSyntheticSubstitution === true
  ? "passed"
  : "blocked-unknown";
if (
  source.receiptSha256 !== standaloneReceipt.candidateSourceManifestSha256
  || source.receiptSha256 !== liteReceipt.candidateSourceManifestSha256
  || standaloneReceipt.buildId !== liteReceipt.buildId
  || standaloneReceipt.status !== "passed"
  || liteReceipt.status !== "passed"
  || standaloneReceipt.deliveryTier !== "standalone-full"
  || liteReceipt.deliveryTier !== "vercel-lite"
  || standaloneReceipt.deploymentId !== expectedDeploymentId
  || liteReceipt.deploymentId !== expectedDeploymentId
  || manifest.authority?.scientificPayloadSha256 !== SCIENTIFIC_PAYLOAD_SHA256
  || manifest.authority?.scientificPayloadWriteback !== false
  || finalBrowser.version !== "v593-final-sealed-browser-matrix-receipt-v1"
  || finalBrowser.status !== "passed-sealed-standalone-42-frame-automatic-gates-human-signoff-pending"
  || finalBrowser.frames?.length !== 42
  || finalBrowser.build?.buildId !== standaloneReceipt.buildId
  || finalBrowser.candidate?.sourceManifestSha256 !== source.receiptSha256
  || finalBrowser.candidate?.manifestSha256 !== manifest.manifestSha256
  || finalBrowser.candidate?.deploymentId !== expectedDeploymentId
  || finalBrowser.aggregate?.scientificPayloadUniqueCount !== 1
  || finalBrowser.aggregate?.consolePageWebglErrorWarningCount !== 0
  || finalBrowser.authority?.scientificPayloadSha256 !== SCIENTIFIC_PAYLOAD_SHA256
  || finalBrowser.authority?.scientificPayloadWriteback !== false
  || liteRaw.version !== "v593-lite-browser-matrix-v1"
  || liteRaw.route !== "/local-shadow-v593"
  || liteRaw.frames?.length !== 8
  || liteRaw.build?.buildId !== liteReceipt.buildId
  || liteRaw.build?.sourceManifestSha256 !== source.receiptSha256
  || liteRaw.build?.manifestSha256 !== manifest.manifestSha256
  || liteRaw.build?.deploymentId !== expectedDeploymentId
  || liteRaw.console?.count !== 0
  || liteRaw.authority?.scientificPayloadSha256 !== SCIENTIFIC_PAYLOAD_SHA256
  || liteRaw.authority?.scientificPayloadWriteback !== false
  || lifecycle.version !== "v593-resource-lifecycle-v2"
  || lifecycle.status !== "passed-current-identity-16-hero-mount-cycles-and-same-realm-scene-exit"
  || lifecycle.mountCycles?.status !== "passed-current-identity-16-hero-32-mount-cycles"
  || lifecycle.mountCycles?.heroCount !== 16
  || lifecycle.mountCycles?.admittedCount !== 16
  || lifecycle.mountCycles?.blockedCount !== 0
  || lifecycle.mountCycles?.admittedMountCycleCount !== 32
  || lifecycle.mountCycles?.sustainedGrowth !== false
  || lifecycle.console?.count !== 0
  || lifecycle.authority?.scientificPayloadSha256 !== SCIENTIFIC_PAYLOAD_SHA256
  || lifecycle.authority?.scientificPayloadWriteback !== false
  || lifecycle.authority?.scientificAuthorityChanged !== false
  || lifecycle.authority?.measuredAuthorityGranted !== false
  || lifecycle.authority?.gpuAuthorityGranted !== false
  || lifecycle.authority?.productionReleaseAuthorized !== false
  || soak.version !== "v593-soak-v2"
  || soak.status !== "passed-current-identity-cdp-heap-soak-and-same-realm-scene-exit"
  || cdpHeapSoak.sampleCount < 181
  || cdpHeapSoak.durationSeconds < 1800
  || soak.durationSeconds !== cdpHeapSoak.durationSeconds
  || soak.sampleCount !== cdpHeapSoak.sampleCount
  || soak.aggregate?.canvasCountStable !== true
  || soak.aggregate?.payloadUniqueCount !== 1
  || soak.aggregate?.scientificWritebackCount !== 0
  || !sameCanonicalValue(soak.console, cdpHeapSoak.console)
  || !rendererSoakPassed
  || jsHeapGate !== "passed"
  || soak.authority?.scientificPayloadSha256 !== SCIENTIFIC_PAYLOAD_SHA256
  || soak.authority?.scientificPayloadWriteback !== false
  || soak.authority?.scientificAuthorityChanged !== false
  || soak.authority?.measuredAuthorityGranted !== false
  || soak.authority?.gpuAuthorityGranted !== false
  || soak.authority?.productionReleaseAuthorized !== false
) throw new Error("v593-closure-input-contract");
const liteFrames = liteRaw.frames.map((frame) => {
  if (frame.canvasCount !== 1 || frame.payloadSha256 !== SCIENTIFIC_PAYLOAD_SHA256 || frame.payloadStable !== true || frame.scientificWriteback !== false || frame.fpsMedian < 45 || frame.drawCalls > 90 || frame.gpuBytes > (frame.device === "mobile" ? 192 : 512) * 1024 * 1024 || !["ktx2", "fallback"].includes(frame.resourceSource)) throw new Error(`v593-lite-frame:${frame.id}`);
  return frame;
});
const standaloneExport = await buildExport("standalone-full", standaloneReceipt);
const liteExport = await buildExport("vercel-lite", liteReceipt);
const exportBudgetsPassed = standaloneExport.budgetPassed === true && liteExport.budgetPassed === true;
const allAutomaticClosureGatesPassed = exportBudgetsPassed
  && rendererSoakPassed
  && jsHeapGate === "passed"
  && sameRealmSceneExit.status === "passed-same-realm-resource-zero";
const humanSignoffSuffix = humanVisualState.approved
  ? "approved"
  : humanVisualState.status === "pending-human-visual-signoff"
    ? "pending"
    : "blocked";
const dossier = {
  version: "v593-release-export-and-closure-dossier-v2",
  generatedAt,
  status: allAutomaticClosureGatesPassed
    ? `passed-current-identity-export-matrices-mount-lifecycle-same-realm-and-cdp-heap-human-signoff-${humanSignoffSuffix}`
    : "blocked-release-gates",
  candidate: { route: "/local-shadow-v593", buildId: standaloneReceipt.buildId, deploymentId: expectedDeploymentId, manifestSha256: manifest.manifestSha256, sourceManifestSha256: source.receiptSha256, formalProductPointer: "v263" },
  builds: { standalone: { buildId: standaloneReceipt.buildId, deploymentId: expectedDeploymentId, sourceManifestSha256: standaloneReceipt.candidateSourceManifestSha256 }, lite: { buildId: liteReceipt.buildId, deploymentId: expectedDeploymentId, sourceManifestSha256: liteReceipt.candidateSourceManifestSha256 } },
  exports: { standalone: standaloneExport, lite: liteExport },
  standaloneBrowser: finalBrowser,
  liteBrowser: { ...liteRaw, frames: liteFrames },
  resourceLifecycle: lifecycle,
  soak: {
    ...soak,
    rendererSoakPassed,
    sameRealmSceneExitPassed: sameRealmSceneExit.status === "passed-same-realm-resource-zero",
    sameRealmSceneExitReceiptSha256: sameRealmSceneExit.receiptSha256,
    cdpHeapSoakPassed: cdpHeapSoak.status === "passed-current-identity-authoritative-cdp-heap-soak",
    cdpHeapSoakReceiptSha256: cdpHeapSoak.receiptSha256,
    jsHeapTelemetry,
    jsHeapGate,
  },
  gates: {
    exportBudgetsPassed,
    standaloneExportBudget: standaloneExport.budgetPassed ? "passed" : "blocked-budget",
    liteExportBudget: liteExport.budgetPassed ? "passed" : "blocked-budget",
    rendererSoakPassed,
    sameRealmSceneExitPassed: sameRealmSceneExit.status === "passed-same-realm-resource-zero",
    sameRealmSceneExitReceiptSha256: sameRealmSceneExit.receiptSha256,
    cdpHeapSoakPassed: cdpHeapSoak.status === "passed-current-identity-authoritative-cdp-heap-soak",
    cdpHeapSoakReceiptSha256: cdpHeapSoak.receiptSha256,
    jsHeapTelemetry,
    jsHeapGate,
    humanVisualSignoff: humanVisualState.approved,
    humanVisualSignoffStatus: humanVisualState.status,
    humanVisualSignoffIdentityMatches: humanVisualState.identityMatches,
    humanVisualSignoffReceiptSha256: humanVisualState.receiptSha256,
  },
  authority: { scientificPayloadSha256: SCIENTIFIC_PAYLOAD_SHA256, scientificPayloadWriteback: false, scientificAuthorityChanged: false, radiativeTransferGranted: false, measuredAuthorityGranted: false, gpuAuthorityGranted: false, productionReleaseAuthorized: false },
  humanVisualSignoff: humanVisualState.approved,
  humanReview: {
    status: humanVisualState.status,
    approved: humanVisualState.approved,
    receiptSha256: humanVisualState.receiptSha256,
    identity: {
      buildId: expectedIdentity.buildId,
      deploymentId: expectedDeploymentId,
      sourceManifestSha256: expectedIdentity.sourceManifestSha256,
      candidateManifestSha256: expectedIdentity.manifestSha256,
      formalProductPointer: "v263",
    },
    identityMatches: humanVisualState.identityMatches,
    requiredPasses: HUMAN_VISUAL_SIGNATURE_PASSES,
  },
};
dossier.dossierSha256 = canonicalSha(dossier);
await mkdir(dirname(exportManifestPath), { recursive: true });
await writeFile(exportManifestPath, `${JSON.stringify(dossier, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ status: dossier.status, standaloneBytes: standaloneExport.installedBytes, liteBytes: liteExport.installedBytes, liteFrames: liteFrames.length, rendererSoakPassed, jsHeapGate, humanVisualSignoff: humanVisualState.status, dossierSha256: dossier.dossierSha256 }, null, 2));

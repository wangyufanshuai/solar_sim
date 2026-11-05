import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { V593_SOURCE_PATHS } from "./v593-source-paths.mjs";

const root = resolve(process.cwd());
const generatedAt = "2026-08-22T00:00:00.000Z";
const docsRoot = resolve(root, "docs/release/v593");
const manifestPath = resolve(root, "public/data/final-art-direction-v593/manifest.json");
const sourceManifestPath = resolve(docsRoot, "source-manifest-v593.json");
const freezePath = resolve(docsRoot, "freeze-before-v593.json");
const currentStatePath = resolve(docsRoot, "current-state-receipt-v593.json");
const capabilityPath = resolve(docsRoot, "capability-report-v593.json");
const pointerPath = resolve(root, "dist/release/orbit-atlas-current-product-rc-candidate-v593.json");
const generatedConstantsPath = resolve(root, "app/data/finalArtDirectionManifestV593.generated.ts");
const contentPackIndexPath = resolve(root, "dist/content-packs/v593/index.json");
const p1BrowserCodeGatePath = resolve(docsRoot, "p1-browser-code-gate-v593.json");
const p2SunBrowserCodeGatePath = resolve(docsRoot, "p2-sun-browser-code-gate-v593.json");
const p3EarthBrowserCodeGatePath = resolve(docsRoot, "p3-earth-browser-code-gate-v593.json");
const p4DeepSkyBrowserCodeGatePath = resolve(docsRoot, "p4-deep-sky-browser-code-gate-v593.json");
const p5SaturnCorrectiveBrowserCodeGatePath = resolve(docsRoot, "p5-saturn-corrective-browser-code-gate-v593.json");
const finalBrowserPath = resolve(docsRoot, "final-sealed-browser-matrix-v593.json");
const liteBrowserPath = resolve(docsRoot, "lite-browser-matrix-v593.json");
const resourceLifecyclePath = resolve(docsRoot, "resource-lifecycle-v593.json");
const soakPath = resolve(docsRoot, "soak-v593.json");
const releaseExportPath = resolve(docsRoot, "release-export-v593.json");
const humanVisualSignoffPath = resolve(docsRoot, "human-visual-signoff-v593.json");
const standaloneBuildReceiptPath = resolve(root, "dist/release/atlas-v593-standalone-build-resource.json");
const liteBuildReceiptPath = resolve(root, "dist/release/atlas-v593-lite-build-resource.json");
const V592_MANIFEST_SHA256 = "8e0b9c8db57ed8bcdfce10d7246083cc640a0639c1418e034647b2e5b1b4a6ba";
const SCIENTIFIC_PAYLOAD_SHA256 = "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674";
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
const HUMAN_VISUAL_SIGNATURE_PASSES = Object.freeze([
  "sun",
  "earth",
  "jupiter",
  "saturn",
  "stellar-archetypes",
  "deep-sky",
]);
const EXACT_AB_FRAME_MAP = Object.freeze([
  ["desktop-sun-science", "sun", "sun-science-signature", "science"],
  ["desktop-sun-cinematic", "sun", "sun-cinematic-signature", "cinematic"],
  ["desktop-earth-science-day", "earth", "earth-science-day", "science"],
  ["desktop-earth-cinematic-day", "earth", "earth-cinematic-day", "cinematic"],
  ["desktop-earth-cinematic-night", "earth", "earth-cinematic-night", "cinematic"],
  ["desktop-jupiter-science", "jupiter", "jupiter-cinematic-grs", "science"],
  ["desktop-jupiter-cinematic-grs", "jupiter", "jupiter-cinematic-grs", "cinematic"],
  ["desktop-saturn-science-front", "saturn", "saturn-cinematic-front", "science"],
  ["desktop-saturn-cinematic-backlight", "saturn", "saturn-cinematic-backlight", "cinematic"],
  ["desktop-saturn-cinematic-ring-shadow", "saturn", "saturn-cinematic-ring-shadow", "cinematic"],
  ["desktop-sirius-cinematic", "stellar-archetypes", "sirius-cinematic-signature", "cinematic"],
  ["desktop-betelgeuse-cinematic", "stellar-archetypes", "betelgeuse-cinematic-signature", "cinematic"],
  ["desktop-galactic-core-cinematic", "deep-sky", "galactic-core-cinematic", "cinematic"],
  ["desktop-orion-nebula-cinematic", "deep-sky", "orion-nebula-cinematic", "cinematic"],
  ["desktop-andromeda-cinematic", "deep-sky", "andromeda-cinematic", "cinematic"],
]);

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
  if (document[field] !== canonicalSha(unsigned)) throw new Error(`v593-input-seal:${label}`);
}
function readSealedEvidence(path, field, label) {
  if (!existsSync(path)) return null;
  const document = readJson(path);
  assertSeal(document, field, label);
  return document;
}
function walkFiles(path) {
  if (!existsSync(path)) return [];
  const info = statSync(path);
  if (info.isFile()) return [path];
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => walkFiles(resolve(path, entry.name)));
}
function relativePath(path) {
  return relative(root, path).replaceAll("\\", "/");
}
function fileRecord(path) {
  const bytes = readFileSync(path);
  return Object.freeze({ path: relativePath(path), bytes: bytes.byteLength, sha256: sha256(bytes) });
}
function assertFileRecord(entry, label) {
  const path = resolve(root, entry.path);
  const workspacePath = relative(root, path);
  if (workspacePath === "" || workspacePath === ".." || workspacePath.startsWith(`..${sep}`) || isAbsolute(workspacePath)) throw new Error(`v593-evidence-boundary:${label}:${entry.path}`);
  if (!existsSync(path) || !statSync(path).isFile()) throw new Error(`v593-evidence-missing:${label}:${entry.path}`);
  const actual = fileRecord(path);
  if (actual.bytes !== entry.bytes || actual.sha256 !== entry.sha256) {
    throw new Error(`v593-evidence-byte-drift:${label}:${entry.path}`);
  }
}
function assertHistoricalRecord(entry, label) {
  if (
    !entry
    || typeof entry.path !== "string"
    || entry.path.length === 0
    || !Number.isSafeInteger(entry.bytes)
    || entry.bytes < 0
    || typeof entry.sha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(entry.sha256)
  ) throw new Error(`v593-historical-record:${label}`);
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
function trustedHumanVisualSignoff(receipt, expected) {
  const passNames = Object.keys(receipt?.passes ?? {});
  const reviewedAt = receipt?.reviewedAt ?? receipt?.signedAt;
  const sourceStage = readTrustedEvidence(receipt?.sourceStageDossier);
  const exactAbStage = readTrustedEvidence(receipt?.exactAbStage ?? receipt?.captureCorrection);
  const userDecision = readTrustedEvidence(receipt?.userDecision);
  if (userDecision) {
    try { assertSeal(userDecision, "decisionSha256", "human-user-decision"); } catch { return false; }
  }
  return Boolean(
    receipt?.version === "v593-human-visual-signoff-dossier-v1"
    && receipt.status === "approved-v593-six-signature-pass-human-visual-signoff"
    && receipt.candidate?.route === "/local-shadow-v593"
    && receipt.candidate?.buildId === expected.buildId
    && receipt.candidate?.sourceManifestSha256 === expected.sourceManifestSha256
    && receipt.candidate?.manifestSha256 === expected.manifestSha256
    && receipt.candidate?.formalProductPointer === "v263"
    && receipt.policy?.sameBuildBeforeAfter === true
    && receipt.policy?.currentBuildOnly === true
    && receipt.policy?.noHistoricalScreenshotSubstitution === true
    && receipt.policy?.fullFrameAnd100PercentCropRequired === true
    && receipt.policy?.scientificPayloadWriteback === false
    && receipt.policy?.signaturePassesRequired === HUMAN_VISUAL_SIGNATURE_PASSES.length
    && sameCanonicalValue(passNames, HUMAN_VISUAL_SIGNATURE_PASSES)
    && HUMAN_VISUAL_SIGNATURE_PASSES.every((name) => {
      const pass = receipt.passes[name];
      return pass?.sourceMaterialCorrectness?.startsWith("passed-live-webgl-material")
        && pass.currentBuildBeforeAfter === true
        && pass.runtimeAbGate === true
        && pass.payloadStable === true
        && pass.fpsGpuResourceGate === true
        && pass.humanVisualSignoff === "approved";
    })
    && Array.isArray(receipt.frames)
    && receipt.frames.length === EXACT_AB_FRAME_MAP.length
    && receipt.frames.every((frame, index) => (
      frame.id === EXACT_AB_FRAME_MAP[index][0]
      && frame.pass === EXACT_AB_FRAME_MAP[index][1]
      && frame.requestedPreset === EXACT_AB_FRAME_MAP[index][2]
      && frame.requestedMode === EXACT_AB_FRAME_MAP[index][3]
      && HUMAN_VISUAL_SIGNATURE_PASSES.includes(frame.pass)
      && frame.signatureBuild?.buildId === expected.buildId
      && frame.signatureBuild?.sourceManifestSha256 === expected.sourceManifestSha256
      && frame.scientificPayloadSha256 === SCIENTIFIC_PAYLOAD_SHA256
      && frame.scientificPayloadWriteback === false
      && frame.humanReview === "approved"
    ))
    && Array.isArray(receipt.contactSheets)
    && receipt.contactSheets.length === HUMAN_VISUAL_SIGNATURE_PASSES.length
    && sameCanonicalValue(receipt.contactSheets.map((sheet) => sheet.pass).sort(), [...HUMAN_VISUAL_SIGNATURE_PASSES].sort())
    && receipt.liveBrowserAbTelemetry?.gates?.webglAbCorePassed === true
    && receipt.liveBrowserAbTelemetry?.gates?.payloadImmutable === true
    && receipt.liveBrowserAbTelemetry?.gates?.fpsPassed === true
    && receipt.liveBrowserAbTelemetry?.gates?.gpuPassed === true
    && receipt.reviewReadiness?.allAutomaticPassPrerequisitesPassed === true
    && receipt.reviewReadiness?.blockedPasses?.length === 0
    && receipt.signaturePassesApproved === HUMAN_VISUAL_SIGNATURE_PASSES.length
    && receipt.approved === true
    && typeof receipt.reviewer === "string"
    && receipt.reviewer.trim().length > 0
    && typeof reviewedAt === "string"
    && Number.isFinite(Date.parse(reviewedAt))
    && receipt.authority?.scientificPayloadSha256 === SCIENTIFIC_PAYLOAD_SHA256
    && receipt.authority?.scientificPayloadWriteback === false
    && receipt.authority?.measuredAuthorityGranted === false
    && receipt.authority?.gpuAuthorityGranted === false
    && receipt.authority?.productionReleaseAuthorized === false
    && sourceStage?.version === "v593-human-visual-signoff-stage-dossier-v1"
    && sourceStage.status === "pending-human-visual-signoff-not-promoted"
    && sourceStage.candidate?.buildId === expected.buildId
    && sourceStage.candidate?.sourceManifestSha256 === expected.sourceManifestSha256
    && sourceStage.candidate?.manifestSha256 === expected.manifestSha256
    && sourceStage.signaturePassesApproved === 0
    && sourceStage.approved === false
    && sourceStage.reviewer === null
    && exactAbStage?.version === "v593-unified-live-ab-staging-v5"
    && exactAbStage.status === "staging-exact-ab-audit-passed-human-signoff-pending-not-promoted"
    && exactAbStage.identity?.buildId === expected.buildId
    && exactAbStage.identity?.sourceManifestSha256 === expected.sourceManifestSha256
    && exactAbStage.identity?.candidateManifestSha256 === expected.manifestSha256
    && exactAbStage.identity?.scientificPayloadSha256 === SCIENTIFIC_PAYLOAD_SHA256
    && exactAbStage.aggregate?.status === "passed-staging-integrity-human-signoff-pending-not-promoted"
    && exactAbStage.aggregate?.errors?.length === 0
    && receipt.userDecision?.path
    && userDecision?.version === "v593-human-user-decision-v1"
    && userDecision.decision === "approve-v593-six-of-six"
    && userDecision.approved === true
    && userDecision.reviewer === "workspace-owner"
    && sameCanonicalValue(Object.keys(userDecision.passes ?? {}), HUMAN_VISUAL_SIGNATURE_PASSES)
    && receipt.decisionChallengeSha256 === canonicalSha({
      version: "v593-human-visual-signoff-decision-challenge-v1",
      candidate: {
        buildId: expected.buildId,
        deploymentId: receipt.candidate?.deploymentId,
        sourceManifestSha256: expected.sourceManifestSha256,
        manifestSha256: expected.manifestSha256,
        formalProductPointer: "v263",
      },
      stageReceiptSha256: sourceStage?.receiptSha256,
      exactFrameIds: receipt.frames.map((frame) => frame.id),
      requiredPasses: HUMAN_VISUAL_SIGNATURE_PASSES,
    })
  );
}
function readTrustedRawReceipt(entry) {
  try {
    assertFileRecord(entry, "current-formal-raw-receipt");
    const raw = readJson(resolve(root, entry.path));
    const unsigned = { ...raw };
    delete unsigned.receiptSha256;
    const insertionOrderSha = sha256(Buffer.from(JSON.stringify(unsigned), "utf8"));
    if (raw.receiptSha256 !== insertionOrderSha && raw.receiptSha256 !== canonicalSha(unsigned)) return null;
    return raw;
  } catch {
    return null;
  }
}
function readTrustedEvidence(entry) {
  try {
    assertFileRecord(entry, "current-browser-stage-evidence");
    return readJson(resolve(root, entry.path));
  } catch {
    return null;
  }
}
function trustedBrowserStage(receipt, expected, tier) {
  const stage = readTrustedEvidence(receipt?.evidence);
  if (tier === "standalone-full") {
    return Boolean(
      stage?.version === "v593-full-matrix-browser-stage-v2"
      && stage.status === "staging-full-matrix-audit-passed-not-promoted"
      && stage.identity?.buildId === expected.buildId
      && (expected.deploymentId === undefined || stage.identity?.deploymentId === expected.deploymentId)
      && stage.identity?.sourceManifestSha256 === expected.sourceManifestSha256
      && stage.identity?.candidateManifestSha256 === expected.manifestSha256
      && stage.identity?.scientificPayloadSha256 === SCIENTIFIC_PAYLOAD_SHA256
      && stage.frames?.length === 42
      && !stage.failures?.some((failure) => !failure.resolution)
      && stage.console?.count === 0
      && stage.fullMatrixAudit?.status === "passed-staging-integrity-not-promoted"
      && stage.fullMatrixAudit?.errors?.length === 0
    );
  }
  return Boolean(
    stage?.version === "v593-lite-browser-stage-v2"
    && stage.status === "staging-lite-matrix-audit-passed-not-promoted"
    && stage.identity?.buildId === expected.buildId
    && (expected.deploymentId === undefined || stage.identity?.deploymentId === expected.deploymentId)
    && stage.identity?.sourceManifestSha256 === expected.sourceManifestSha256
    && stage.identity?.candidateManifestSha256 === expected.manifestSha256
    && stage.identity?.scientificPayloadSha256 === SCIENTIFIC_PAYLOAD_SHA256
    && stage.frames?.length === 8
    && stage.failures?.length === 0
    && stage.console?.count === 0
    && stage.liteMatrixAudit?.status === "passed-staging-integrity-not-promoted"
    && stage.liteMatrixAudit?.errors?.length === 0
  );
}
function candidateIdentityMatches(candidate, expected) {
  return Boolean(
    candidate?.route === "/local-shadow-v593"
    && candidate.buildId === expected.buildId
    && typeof candidate.deploymentId === "string"
    && candidate.deploymentId.length > 0
    && (expected.deploymentId === undefined || candidate.deploymentId === expected.deploymentId)
    && candidate.sourceManifestSha256 === expected.sourceManifestSha256
    && candidate.manifestSha256 === expected.manifestSha256
    && candidate.scientificPayloadSha256 === SCIENTIFIC_PAYLOAD_SHA256,
  );
}
function trustedSameRealmProof(lifecycle, soakEvidence, expected) {
  const proof = lifecycle?.sameRealmSceneExit;
  const raw = proof ? readTrustedRawReceipt(proof.evidence) : null;
  return Boolean(
    proof?.status === "passed-same-realm-resource-zero"
    && proof.receiptVerified === true
    && ["sha256-json-insertion-order", "sha256-canonical-json"].includes(proof.receiptSealAlgorithm)
    && proof.allGatesPassed === true
    && proof.syntheticZeroClaim === false
    && allRequiredGatesPassed(proof.gates, SAME_REALM_REQUIRED_GATES)
    && proof.workerOwnership?.sceneTargetsReleased === true
    && proof.workerOwnership?.ledgerReturnedToBaseline === true
    && Array.isArray(proof.workerOwnership?.sceneCreatedTargetIds)
    && Array.isArray(proof.workerOwnership?.targets?.baseline)
    && Array.isArray(proof.workerOwnership?.targets?.mounted)
    && Array.isArray(proof.workerOwnership?.targets?.detached)
    && Array.isArray(proof.workerOwnership?.targets?.exited)
    && proof.workerOwnership?.targetCounts?.baseline === proof.workerOwnership.targets.baseline.length
    && proof.workerOwnership?.targetCounts?.mounted === proof.workerOwnership.targets.mounted.length
    && proof.workerOwnership?.targetCounts?.detached === proof.workerOwnership.targets.detached.length
    && proof.workerOwnership?.targetCounts?.exited === proof.workerOwnership.targets.exited.length
    && proof.listenerBaselineDelta?.returnedToBaseline === true
    && Number.isFinite(proof.listenerBaselineDelta?.baseline)
    && Number.isFinite(proof.listenerBaselineDelta?.mounted)
    && Number.isFinite(proof.listenerBaselineDelta?.detached)
    && Number.isFinite(proof.listenerBaselineDelta?.exited)
    && Number.isFinite(proof.listenerBaselineDelta?.detachedDelta)
    && Number.isFinite(proof.listenerBaselineDelta?.exitedDelta)
    && proof.listenerBaselineDelta.detachedDelta <= 0
    && proof.listenerBaselineDelta.exitedDelta <= 0
    && proof.listenerBaselineDelta.detachedDelta === proof.listenerBaselineDelta.detached - proof.listenerBaselineDelta.baseline
    && proof.listenerBaselineDelta.exitedDelta === proof.listenerBaselineDelta.exited - proof.listenerBaselineDelta.baseline
    && proof.r3fCleanup?.renderListsDisposed === true
    && proof.r3fCleanup?.contextLost === true
    && proof.r3fCleanup?.canvasDetached === true
    && proof.r3fCleanup?.liveContextCountAfterExit === 0
    && proof.r3fCleanup?.cleanupObserved === true
    && proof.realm?.stable === true
    && proof.realm?.routeAfter === "/downloads"
    && ["textures", "geometries", "programs", "renderTargets"].every((key) => proof.rendererAfterDetach?.[key] === 0)
    && ["total", "workers", "renderTargets", "textures", "subscriptions", "typedArrays", "estimatedBytes"].every((key) => proof.registryAfterDetach?.[key] === 0)
    && sameCanonicalValue(proof, soakEvidence?.sameRealmSceneExit)
    && raw?.version === "v593-same-realm-scene-exit-stage-v1"
    && raw.status === "staging-same-realm-scene-exit-passed-not-promoted"
    && raw.qualificationScope === "v593-current-shared-build-same-realm-scene-exit-staging"
    && raw.protocolPreRegisteredBeforeBrowserRun === true
    && raw.analysis?.status === "passed"
    && raw.analysis?.failedGates?.length === 0
    && raw.syntheticZeroClaim === false
    && raw.promotion === "staging-only"
    && raw.receiptSha256 === proof.receiptSha256
    && allRequiredGatesPassed(raw.analysis?.gates, SAME_REALM_REQUIRED_GATES)
    && sameCanonicalValue(proof.gates, raw.analysis.gates)
    && trustedListenerAccounting(proof, raw)
    && sameCanonicalValue(proof.workerOwnership.sceneCreatedTargetIds, raw.analysis?.sceneTargetIds)
    && sameCanonicalValue(proof.workerOwnership.targets, raw.analysis?.workerTargets)
    && proof.listenerBaselineDelta.baseline === raw.phases?.baseline?.source?.harness?.listenerCount
    && proof.listenerBaselineDelta.mounted === raw.phases?.mounted?.source?.harness?.listenerCount
    && proof.listenerBaselineDelta.detached === raw.phases?.detached?.source?.harness?.listenerCount
    && proof.listenerBaselineDelta.exited === raw.phases?.exited?.source?.harness?.listenerCount
    && proof.r3fCleanup.renderListsDisposed === raw.phases?.exited?.source?.sourceLedger?.exit?.renderListsDisposed
    && proof.r3fCleanup.contextLost === raw.phases?.exited?.source?.sourceLedger?.exit?.contextLost
    && proof.r3fCleanup.canvasDetached === raw.phases?.exited?.source?.sourceLedger?.exit?.canvasDetached
    && proof.r3fCleanup.liveContextCountAfterExit === raw.phases?.exited?.source?.harness?.webgl?.liveContextCount
    && raw.sourceIdentityBefore?.expected?.buildId === expected.buildId
    && raw.sourceIdentityBefore?.expected?.sourceManifestSha256 === expected.sourceManifestSha256
    && raw.sourceIdentityBefore?.expected?.candidateManifestSha256 === expected.manifestSha256
    && raw.sourceIdentityBefore?.expected?.scientificPayloadSha256 === SCIENTIFIC_PAYLOAD_SHA256
    && sameCanonicalValue(raw.sourceIdentityBefore?.expected, raw.sourceIdentityAfter?.expected)
    && raw.sourceIdentityBefore?.formalProductPointer === "v263"
    && raw.sourceIdentityAfter?.formalProductPointer === "v263"
  );
}
function trustedCdpHeapProof(soakEvidence, expected) {
  const proof = soakEvidence?.cdpHeapSoak;
  const raw = proof ? readTrustedRawReceipt(proof.evidence) : null;
  return Boolean(
    proof?.status === "passed-current-identity-authoritative-cdp-heap-soak"
    && proof.receiptVerified === true
    && ["sha256-json-insertion-order", "sha256-canonical-json"].includes(proof.receiptSealAlgorithm)
    && proof.allGatesPassed === true
    && proof.syntheticHeapPassClaim === false
    && proof.sampleCount >= 181
    && proof.memory?.sampleSpanMilliseconds >= 1_800_000
    && proof.durationSeconds >= 1800
    && allRequiredGatesPassed(proof.gates, CDP_HEAP_REQUIRED_GATES)
    && Number.isFinite(proof.heap?.baselineUsedSizeBytes)
    && Number.isFinite(proof.heap?.finalUsedSizeBytes)
    && Number.isFinite(proof.heap?.allowanceBytes)
    && Number.isFinite(proof.heap?.lastTenOlsBytesPerSample)
    && proof.heap.finalUsedSizeBytes <= proof.heap.baselineUsedSizeBytes + proof.heap.allowanceBytes
    && proof.heap.lastTenOlsBytesPerSample <= 262_144
    && proof.runtime?.rendererFingerprintCount === 1
    && proof.renderer?.resourceGrowth === false
    && proof.renderer?.resourceBaselineStable === true
    && proof.renderer?.fingerprintCount === 1
    && proof.memory?.status === "passed-authoritative-cdp-heap-soak"
    && proof.memory?.measurementAuthority === "HeapProfiler.collectGarbage-before-Runtime.getHeapUsage"
    && proof.memory?.jsHeapTelemetry === "available-chromium-cdp-runtime-getHeapUsage"
    && proof.memory?.finalHeapWithinAllowance === true
    && proof.memory?.lastTenOlsWithinLimit === true
    && proof.memory?.sustainedJsHeapGrowth === false
    && proof.memory?.requiredForClosure === true
    && proof.memory?.noSyntheticSubstitution === true
    && sameCanonicalValue(proof.memory, soakEvidence?.memory)
    && raw?.version === "v593-cdp-heap-soak-stage-v1"
    && raw.status === "staging-cdp-heap-soak-passed-not-promoted"
    && raw.qualificationScope === "v593-current-shared-build-cdp-heap-soak"
    && raw.protocolPreRegisteredBeforeSampling === true
    && raw.effectiveRun?.preflight === false
    && raw.analysis?.status === "passed"
    && raw.promotion === "staging-only"
    && raw.receiptSha256 === proof.receiptSha256
    && allRequiredGatesPassed(raw.analysis?.gates, CDP_HEAP_REQUIRED_GATES)
    && sameCanonicalValue(proof.gates, raw.analysis.gates)
    && sameCanonicalValue(proof.heap, raw.analysis.heap)
    && sameCanonicalValue(proof.runtime, raw.analysis.runtime)
    && proof.console?.count === 0
    && proof.console?.cliRaw === raw.analysis.console?.cliRaw
    && proof.console?.stderr === raw.analysis.console?.stderr
    && sameCanonicalValue(proof.console?.pageAudit, raw.analysis.console?.pageAudit)
    && raw.expectedIdentity?.buildId === expected.buildId
    && raw.expectedIdentity?.deploymentId === soakEvidence.candidate?.deploymentId
    && raw.expectedIdentity?.sourceManifestSha256 === expected.sourceManifestSha256
    && raw.expectedIdentity?.candidateManifestSha256 === expected.manifestSha256
    && raw.expectedIdentity?.scientificPayloadSha256 === SCIENTIFIC_PAYLOAD_SHA256
  );
}

const v592Manifest = readJson(resolve(root, "public/data/living-universe-v592/manifest.json"));
assertSeal(v592Manifest, "manifestSha256", "v592-manifest");
if (v592Manifest.manifestSha256 !== V592_MANIFEST_SHA256 || v592Manifest.formalProductPointer !== "v263") {
  throw new Error("v593-v592-baseline-identity");
}
const v592SourceManifest = readJson(resolve(root, "docs/release/v592/source-manifest-v592.json"));
assertSeal(v592SourceManifest, "receiptSha256", "v592-source-manifest");
const contentPackIndex = readJson(contentPackIndexPath);
assertSeal(contentPackIndex, "indexSha256", "content-pack-index");
if (
  contentPackIndex.status !== "passed-p0-content-pack-projection-and-materialization"
  || contentPackIndex.baseline.manifestSha256 !== V592_MANIFEST_SHA256
  || contentPackIndex.budget.liteShell.status !== "passed"
  || contentPackIndex.budget.observatoryDefault.status !== "passed"
) throw new Error("v593-content-pack-gate");

const p1BrowserCodeGate = readJson(p1BrowserCodeGatePath);
assertSeal(p1BrowserCodeGate, "receiptSha256", "p1-browser-code-gate");
const p1CaptureIds = p1BrowserCodeGate.captures?.map((capture) => capture.id) ?? [];
if (
  p1BrowserCodeGate.version !== "v593-p1-browser-code-gate-v1"
  || p1BrowserCodeGate.status !== "passed-current-dev-code-gates-sealed-build-and-human-signoff-pending"
  || p1BrowserCodeGate.candidate?.route !== "/local-shadow-v593"
  || p1BrowserCodeGate.candidate?.formalProductPointer !== "v263"
  || p1BrowserCodeGate.candidate?.additiveOnly !== true
  || p1BrowserCodeGate.scope?.signaturePassesCodeImplemented !== 3
  || p1BrowserCodeGate.scope?.signaturePassesComplete !== 0
  || p1BrowserCodeGate.scope?.implemented?.join("|") !== "jupiter|saturn|stellar-archetypes"
  || p1BrowserCodeGate.scope?.pending?.join("|") !== "sun|earth|deep-sky"
  || p1BrowserCodeGate.scope?.finalGoldenFrameMatrixComplete !== false
  || p1BrowserCodeGate.scope?.sealedBuildEvidence !== false
  || p1BrowserCodeGate.scope?.humanVisualSignoff !== false
  || p1CaptureIds.length !== 7
  || new Set(p1CaptureIds).size !== 7
  || p1BrowserCodeGate.sourceMaterialCorrectness?.sourcePath !== "app/components/SignatureArtDirectionBridgeV593.tsx"
  || p1BrowserCodeGate.jupiterSeamAudit?.reductionFraction < 0.75
  || p1BrowserCodeGate.browser?.runner !== "Codex-in-app-browser"
  || p1BrowserCodeGate.browser?.viewport !== "1440x900"
  || p1BrowserCodeGate.browser?.singleCanvas !== true
  || p1BrowserCodeGate.browser?.consolePageWebglErrorCount !== 0
  || p1BrowserCodeGate.browser?.scientificPayloadSha256 !== SCIENTIFIC_PAYLOAD_SHA256
  || p1BrowserCodeGate.browser?.scientificPayloadUniqueCount !== 1
  || p1BrowserCodeGate.browser?.scientificPayloadWriteback !== false
  || p1BrowserCodeGate.browser?.performance?.length !== 6
  || p1BrowserCodeGate.browser.performance.some((entry) => entry.medianFps < 45 || entry.gpuBytes > 512 * 1024 * 1024 || entry.drawCalls > 60)
  || p1BrowserCodeGate.browser?.resourceCycles?.baselineSignatureCycleCount !== 10
  || p1BrowserCodeGate.browser?.resourceCycles?.sustainedGrowth !== false
  || p1BrowserCodeGate.browser?.resourceCycles?.finalBaseline?.patchCount !== 0
  || p1BrowserCodeGate.browser?.resourceCycles?.finalBaseline?.signatureMaterialCount !== 0
  || p1BrowserCodeGate.browser?.rotation?.w0BlockedDisclosed?.join("|") !== "bennu|kleopatra"
  || p1BrowserCodeGate.browser?.rotation?.presentationAccelerationWriteback !== false
  || p1BrowserCodeGate.authority?.scientificPayloadSha256 !== SCIENTIFIC_PAYLOAD_SHA256
  || p1BrowserCodeGate.authority?.scientificPayloadWriteback !== false
  || p1BrowserCodeGate.authority?.scientificAuthorityChanged !== false
  || p1BrowserCodeGate.authority?.measuredAuthorityGranted !== false
  || p1BrowserCodeGate.authority?.gpuAuthorityGranted !== false
  || p1BrowserCodeGate.authority?.productionReleaseAuthorized !== false
) throw new Error("v593-p1-browser-code-gate");
for (const capture of p1BrowserCodeGate.captures) {
  if (
    capture.framePolicy !== "same-current-dev-build-fixed-camera-and-clock"
    || capture.scientificPayloadSha256 !== SCIENTIFIC_PAYLOAD_SHA256
    || capture.scientificPayloadWriteback !== false
    || capture.baselineTelemetry?.materialPatchCount !== 0
    || capture.signatureTelemetry?.webglOutputChanged !== true
    || capture.comparison?.changedChannelFractionGt2 <= 0.001
  ) throw new Error(`v593-p1-capture-contract:${capture.id}`);
  for (const [kind, record] of Object.entries({
    baseline: capture.baseline,
    signature: capture.signature,
    baselineNativeCrop: capture.baselineNativeCrop,
    signatureNativeCrop: capture.signatureNativeCrop,
  })) assertFileRecord(record, `p1-${capture.id}-${kind}`);
}
for (const [index, record] of p1BrowserCodeGate.saturnAuditFrames.entries()) {
  assertFileRecord(record, `p1-saturn-audit-${index}`);
}

// P1 is a sealed development receipt for the pre-Sun bridge. Its recorded
// source SHA deliberately does not match the current bridge after P2/P3. Keep
// it as historical current-dev evidence and bind current source correctness to
// the latest phase receipt.
const p2SunBrowserCodeGate = readJson(p2SunBrowserCodeGatePath);
assertSeal(p2SunBrowserCodeGate, "receiptSha256", "p2-sun-browser-code-gate");
if (
  p2SunBrowserCodeGate.version !== "v593-p2-sun-browser-code-gate-v1"
  || p2SunBrowserCodeGate.status !== "passed-current-dev-sun-code-gate-sealed-build-and-human-signoff-pending"
  || p2SunBrowserCodeGate.candidate?.route !== "/local-shadow-v593"
  || p2SunBrowserCodeGate.candidate?.formalProductPointer !== "v263"
  || p2SunBrowserCodeGate.candidate?.additiveOnly !== true
  || p2SunBrowserCodeGate.scope?.signaturePassesCodeImplemented !== 4
  || p2SunBrowserCodeGate.scope?.signaturePassesComplete !== 0
  || p2SunBrowserCodeGate.scope?.implemented?.join("|") !== "sun|jupiter|saturn|stellar-archetypes"
  || p2SunBrowserCodeGate.scope?.pending?.join("|") !== "earth|deep-sky"
  || p2SunBrowserCodeGate.scope?.finalGoldenFrameMatrixComplete !== false
  || p2SunBrowserCodeGate.scope?.sealedBuildEvidence !== false
  || p2SunBrowserCodeGate.scope?.humanVisualSignoff !== false
  || p2SunBrowserCodeGate.captures?.length !== 2
  || p2SunBrowserCodeGate.detailCrops?.length !== 4
  || p2SunBrowserCodeGate.browser?.runner !== "Codex-in-app-browser"
  || p2SunBrowserCodeGate.browser?.viewport !== "1440x900"
  || p2SunBrowserCodeGate.browser?.singleCanvas !== true
  || p2SunBrowserCodeGate.browser?.consolePageWebglErrorCount !== 0
  || p2SunBrowserCodeGate.browser?.scientificPayloadSha256 !== SCIENTIFIC_PAYLOAD_SHA256
  || p2SunBrowserCodeGate.browser?.scientificPayloadUniqueCount !== 1
  || p2SunBrowserCodeGate.browser?.scientificPayloadWriteback !== false
  || p2SunBrowserCodeGate.browser?.performance?.length !== 2
  || p2SunBrowserCodeGate.browser.performance.some((entry) => entry.medianFps < 45 || entry.gpuBytes > 512 * 1024 * 1024 || entry.drawCalls > 60)
  || p2SunBrowserCodeGate.browser?.resourceCycles?.sustainedGrowth !== false
  || p2SunBrowserCodeGate.browser?.resourceCycles?.finalBaseline?.patchCount !== 0
  || p2SunBrowserCodeGate.browser?.rotation?.body !== "sun"
  || p2SunBrowserCodeGate.browser?.rotation?.differentialRotation !== "active-presentation-physics-model-one-material"
  || p2SunBrowserCodeGate.browser?.rotation?.w0BlockedDisclosed?.join("|") !== "bennu|kleopatra"
  || p2SunBrowserCodeGate.browser?.rotation?.presentationAccelerationWriteback !== false
  || p2SunBrowserCodeGate.authority?.scientificPayloadSha256 !== SCIENTIFIC_PAYLOAD_SHA256
  || p2SunBrowserCodeGate.authority?.scientificPayloadWriteback !== false
  || p2SunBrowserCodeGate.authority?.scientificAuthorityChanged !== false
  || p2SunBrowserCodeGate.authority?.measuredAuthorityGranted !== false
  || p2SunBrowserCodeGate.authority?.gpuAuthorityGranted !== false
  || p2SunBrowserCodeGate.authority?.productionReleaseAuthorized !== false
) throw new Error("v593-p2-sun-browser-code-gate");
// P2 remains immutable pre-Earth evidence. Its source-bound overlay and assets
// must still exist, while current bridge/shell correctness is bound by P3.
for (const record of [
  p2SunBrowserCodeGate.sourceMaterialCorrectness.overlay,
  ...p2SunBrowserCodeGate.sourceMaterialCorrectness.verifiedSourceVariants,
]) assertFileRecord(record, "p2-sun-source");
for (const capture of p2SunBrowserCodeGate.captures) {
  if (
    capture.framePolicy !== "same-current-dev-build-fixed-camera-clock-and-solar-orientation"
    || capture.scientificPayloadSha256 !== SCIENTIFIC_PAYLOAD_SHA256
    || capture.scientificPayloadWriteback !== false
    || capture.baselineTelemetry?.materialPatchCount !== 0
    || capture.signatureTelemetry?.materialPatchCount !== 2
    || capture.signatureTelemetry?.webglOutputChanged !== true
    || capture.comparison?.changedChannelFractionGt2 <= 0.001
    || capture.signatureDiskMetrics?.centerToLimbRatio <= capture.baselineDiskMetrics?.centerToLimbRatio
  ) throw new Error(`v593-p2-sun-capture-contract:${capture.id}`);
  for (const [kind, record] of Object.entries({
    baseline: capture.baseline,
    signature: capture.signature,
    baselineNativeCrop: capture.baselineNativeCrop,
    signatureNativeCrop: capture.signatureNativeCrop,
  })) assertFileRecord(record, `p2-sun-${capture.id}-${kind}`);
}
for (const [index, record] of p2SunBrowserCodeGate.detailCrops.entries()) {
  assertFileRecord(record, `p2-sun-detail-${index}`);
}

const p3EarthBrowserCodeGate = readJson(p3EarthBrowserCodeGatePath);
assertSeal(p3EarthBrowserCodeGate, "receiptSha256", "p3-earth-browser-code-gate");
if (
  p3EarthBrowserCodeGate.version !== "v593-p3-earth-browser-code-gate-v1"
  || p3EarthBrowserCodeGate.status !== "passed-current-dev-earth-code-and-visual-gates-console-replay-blocked-sealed-build-and-human-signoff-pending"
  || p3EarthBrowserCodeGate.candidate?.route !== "/local-shadow-v593"
  || p3EarthBrowserCodeGate.candidate?.formalProductPointer !== "v263"
  || p3EarthBrowserCodeGate.candidate?.additiveOnly !== true
  || p3EarthBrowserCodeGate.scope?.signaturePassesCodeImplemented !== 5
  || p3EarthBrowserCodeGate.scope?.signaturePassesComplete !== 0
  || p3EarthBrowserCodeGate.scope?.implemented?.join("|") !== "sun|earth|jupiter|saturn|stellar-archetypes"
  || p3EarthBrowserCodeGate.scope?.pending?.join("|") !== "deep-sky"
  || p3EarthBrowserCodeGate.scope?.finalGoldenFrameMatrixComplete !== false
  || p3EarthBrowserCodeGate.scope?.sealedBuildEvidence !== false
  || p3EarthBrowserCodeGate.scope?.humanVisualSignoff !== false
  || p3EarthBrowserCodeGate.captures?.length !== 5
  || p3EarthBrowserCodeGate.detailCrops?.length !== 4
  || p3EarthBrowserCodeGate.seamInspection?.seamFacingCamera !== true
  || p3EarthBrowserCodeGate.seamInspection?.seamDistanceDeg > 0.00001
  || p3EarthBrowserCodeGate.seamInspection?.gradientReductionFraction < 0.10
  || p3EarthBrowserCodeGate.browser?.runner !== "Codex-in-app-browser"
  || p3EarthBrowserCodeGate.browser?.viewport !== "1440x900"
  || p3EarthBrowserCodeGate.browser?.singleCanvas !== true
  || p3EarthBrowserCodeGate.browser?.scientificPayloadSha256 !== SCIENTIFIC_PAYLOAD_SHA256
  || p3EarthBrowserCodeGate.browser?.scientificPayloadUniqueCount !== 1
  || p3EarthBrowserCodeGate.browser?.scientificPayloadWriteback !== false
  || p3EarthBrowserCodeGate.browser?.minimumMedianFps < 45
  || p3EarthBrowserCodeGate.browser?.maximumGpuBytes > 512 * 1024 * 1024
  || p3EarthBrowserCodeGate.browser?.maximumDrawCalls > 60
  || p3EarthBrowserCodeGate.browser?.consoleReplay?.status !== "blocked-browser-url-policy"
  || p3EarthBrowserCodeGate.browser?.consoleReplay?.errorWarningCount !== null
  || p3EarthBrowserCodeGate.browser?.consoleReplay?.finalSealedBuildConsoleGatePassed !== false
  || p3EarthBrowserCodeGate.browser?.resourceCycles?.baselineSignatureCycleCount !== 4
  || p3EarthBrowserCodeGate.browser?.resourceCycles?.sustainedGrowth !== false
  || p3EarthBrowserCodeGate.browser?.resourceCycles?.finalBaseline?.patchCount !== 0
  || p3EarthBrowserCodeGate.browser?.resourceCycles?.finalBaseline?.signatureMaterialCount !== 0
  || p3EarthBrowserCodeGate.authority?.scientificPayloadSha256 !== SCIENTIFIC_PAYLOAD_SHA256
  || p3EarthBrowserCodeGate.authority?.scientificPayloadWriteback !== false
  || p3EarthBrowserCodeGate.authority?.scientificAuthorityChanged !== false
  || p3EarthBrowserCodeGate.authority?.measuredAuthorityGranted !== false
  || p3EarthBrowserCodeGate.authority?.gpuAuthorityGranted !== false
  || p3EarthBrowserCodeGate.authority?.radiativeTransferGranted !== false
  || p3EarthBrowserCodeGate.authority?.productionReleaseAuthorized !== false
) throw new Error("v593-p3-earth-browser-code-gate");
// P3 remains immutable historical evidence. Its bridge/shell records describe
// the pre-deep-sky source and therefore must not be compared with current
// source bytes. P4 below owns current-source correctness.
for (const record of [
  p3EarthBrowserCodeGate.sourceMaterialCorrectness.overlay,
  ...p3EarthBrowserCodeGate.sourceMaterialCorrectness.verifiedSourceVariants,
  p3EarthBrowserCodeGate.browser.telemetry,
  p3EarthBrowserCodeGate.browser.consoleReplay.evidence,
  p3EarthBrowserCodeGate.browser.resourceCycles.record,
]) assertFileRecord(record, "p3-earth-source");
for (const capture of p3EarthBrowserCodeGate.captures) {
  if (
    capture.framePolicy !== "same-current-dev-build-fixed-camera-clock-and-earth-orientation"
    || capture.scientificPayloadSha256 !== SCIENTIFIC_PAYLOAD_SHA256
    || capture.scientificPayloadWriteback !== false
    || capture.baselineTelemetry?.patches !== 0
    || capture.signatureTelemetry?.patches !== 4
    || capture.signatureTelemetry?.surfacePatches !== 1
    || capture.signatureTelemetry?.cloudPatches !== 2
    || capture.signatureTelemetry?.atmospherePatches !== 1
    || capture.signatureTelemetry?.webglChanged !== "true"
    || capture.comparison?.changedChannelFractionGt2 <= 0.001
  ) throw new Error(`v593-p3-earth-capture-contract:${capture.id}`);
  for (const [kind, record] of Object.entries({
    baseline: capture.baseline,
    signature: capture.signature,
    baselineNativeCrop: capture.baselineNativeCrop,
    signatureNativeCrop: capture.signatureNativeCrop,
  })) assertFileRecord(record, `p3-earth-${capture.id}-${kind}`);
}
for (const detail of p3EarthBrowserCodeGate.detailCrops) {
  assertFileRecord(detail.baseline.image, `p3-earth-${detail.id}-baseline`);
  assertFileRecord(detail.signature.image, `p3-earth-${detail.id}-signature`);
}

const p4DeepSkyBrowserCodeGate = readJson(p4DeepSkyBrowserCodeGatePath);
assertSeal(p4DeepSkyBrowserCodeGate, "receiptSha256", "p4-deep-sky-browser-code-gate");
if (
  p4DeepSkyBrowserCodeGate.version !== "v593-p4-deep-sky-browser-code-gate-v1"
  || p4DeepSkyBrowserCodeGate.status !== "passed-current-dev-deep-sky-code-and-visual-gates-sealed-build-and-human-signoff-pending"
  || p4DeepSkyBrowserCodeGate.candidate?.route !== "/local-shadow-v593"
  || p4DeepSkyBrowserCodeGate.candidate?.formalProductPointer !== "v263"
  || p4DeepSkyBrowserCodeGate.candidate?.additiveOnly !== true
  || p4DeepSkyBrowserCodeGate.scope?.signaturePassesCodeImplemented !== 6
  || p4DeepSkyBrowserCodeGate.scope?.signaturePassesComplete !== 0
  || p4DeepSkyBrowserCodeGate.scope?.implemented?.join("|") !== "sun|earth|jupiter|saturn|stellar-archetypes|deep-sky"
  || p4DeepSkyBrowserCodeGate.scope?.pending?.length !== 0
  || p4DeepSkyBrowserCodeGate.scope?.finalGoldenFrameMatrixComplete !== false
  || p4DeepSkyBrowserCodeGate.scope?.sealedBuildEvidence !== false
  || p4DeepSkyBrowserCodeGate.scope?.humanVisualSignoff !== false
  || p4DeepSkyBrowserCodeGate.captures?.length !== 6
  || p4DeepSkyBrowserCodeGate.detailCrops?.length !== 5
  || p4DeepSkyBrowserCodeGate.planeEdgeInspection?.reductionFraction < 0.25
  || p4DeepSkyBrowserCodeGate.browser?.runner !== "Codex-in-app-browser"
  || p4DeepSkyBrowserCodeGate.browser?.viewport !== "1440x900"
  || p4DeepSkyBrowserCodeGate.browser?.consoleWarningErrorCount !== 0
  || p4DeepSkyBrowserCodeGate.browser?.singleCanvas !== true
  || p4DeepSkyBrowserCodeGate.browser?.scientificPayloadSha256 !== SCIENTIFIC_PAYLOAD_SHA256
  || p4DeepSkyBrowserCodeGate.browser?.scientificPayloadUniqueCount !== 1
  || p4DeepSkyBrowserCodeGate.browser?.scientificPayloadWriteback !== false
  || p4DeepSkyBrowserCodeGate.browser?.minimumMedianFps < 45
  || p4DeepSkyBrowserCodeGate.browser?.maximumGpuBytes > 512 * 1024 * 1024
  || p4DeepSkyBrowserCodeGate.browser?.maximumDrawCalls > 90
  || p4DeepSkyBrowserCodeGate.authority?.scientificPayloadSha256 !== SCIENTIFIC_PAYLOAD_SHA256
  || p4DeepSkyBrowserCodeGate.authority?.scientificPayloadWriteback !== false
  || p4DeepSkyBrowserCodeGate.authority?.scientificAuthorityChanged !== false
  || p4DeepSkyBrowserCodeGate.authority?.measuredAuthorityGranted !== false
  || p4DeepSkyBrowserCodeGate.authority?.gpuAuthorityGranted !== false
  || p4DeepSkyBrowserCodeGate.authority?.radiativeTransferGranted !== false
  || p4DeepSkyBrowserCodeGate.authority?.productionReleaseAuthorized !== false
) throw new Error("v593-p4-deep-sky-browser-code-gate");
// P4 is now immutable pre-Saturn-corrective evidence. Its bridge and focused
// test records intentionally describe the P4 source owner and must not be
// compared with the current v593 source after a corrective shader/test pass.
// Keep the browser artifacts and historical receipts verifiable; P5 below
// owns current-source correctness.
for (const record of [
  p4DeepSkyBrowserCodeGate.sourceMaterialCorrectness.canvasHost,
  p4DeepSkyBrowserCodeGate.sourceMaterialCorrectness.builder,
  p4DeepSkyBrowserCodeGate.sourceMaterialCorrectness.p3HistoricalPreDeepSkyEvidence,
  p4DeepSkyBrowserCodeGate.browser.telemetry,
]) assertHistoricalRecord(record, "p4-deep-sky-historical-source");
for (const capture of p4DeepSkyBrowserCodeGate.captures) {
  if (
    capture.framePolicy !== "same-current-dev-build-fixed-camera-clock-and-j2000-direction"
    || capture.baselineTelemetry?.patchCount !== 0
    || capture.baselineTelemetry?.webglChanged !== "false"
    || capture.signatureTelemetry?.deepSky !== "implemented-code-gates-pending"
    || capture.signatureTelemetry?.webglChanged !== "true"
    || capture.signatureTelemetry?.payload !== SCIENTIFIC_PAYLOAD_SHA256
    || capture.signatureTelemetry?.payloadStable !== "true"
    || capture.signatureTelemetry?.writeback !== "false"
    || capture.comparison?.changedChannelFractionGt2 <= 0.0001
  ) throw new Error(`v593-p4-deep-sky-capture-contract:${capture.id}`);
  assertFileRecord(capture.baseline, `p4-deep-sky-${capture.id}-baseline`);
  assertFileRecord(capture.signature, `p4-deep-sky-${capture.id}-signature`);
}
for (const detail of p4DeepSkyBrowserCodeGate.detailCrops) {
  assertFileRecord(detail.baseline.image, `p4-deep-sky-${detail.id}-baseline`);
  assertFileRecord(detail.signature.image, `p4-deep-sky-${detail.id}-signature`);
}

const p5SaturnCorrectiveBrowserCodeGate = readJson(p5SaturnCorrectiveBrowserCodeGatePath);
assertSeal(p5SaturnCorrectiveBrowserCodeGate, "receiptSha256", "p5-saturn-corrective-browser-code-gate");
if (
  p5SaturnCorrectiveBrowserCodeGate.version !== "v593-p5-saturn-corrective-browser-code-gate-v1"
  || p5SaturnCorrectiveBrowserCodeGate.status !== "passed-current-dev-saturn-corrective-code-and-visual-gates-sealed-build-and-human-signoff-pending"
  || p5SaturnCorrectiveBrowserCodeGate.candidate?.route !== "/local-shadow-v593"
  || p5SaturnCorrectiveBrowserCodeGate.candidate?.formalProductPointer !== "v263"
  || p5SaturnCorrectiveBrowserCodeGate.candidate?.additiveOnly !== true
  || p5SaturnCorrectiveBrowserCodeGate.scope?.currentSourceOwner !== true
  || p5SaturnCorrectiveBrowserCodeGate.scope?.signaturePassesCodeImplemented !== 6
  || p5SaturnCorrectiveBrowserCodeGate.scope?.signaturePassesComplete !== 0
  || p5SaturnCorrectiveBrowserCodeGate.scope?.finalGoldenFrameMatrixComplete !== false
  || p5SaturnCorrectiveBrowserCodeGate.scope?.sealedBuildEvidence !== false
  || p5SaturnCorrectiveBrowserCodeGate.scope?.humanVisualSignoff !== false
  || p5SaturnCorrectiveBrowserCodeGate.captures?.length !== 3
  || p5SaturnCorrectiveBrowserCodeGate.detailCrops?.length !== 5
  || p5SaturnCorrectiveBrowserCodeGate.hardCutInspection?.desktop?.reductionFraction < 0.20
  || p5SaturnCorrectiveBrowserCodeGate.hardCutInspection?.mobileNativeViewport?.reductionFraction < 0.10
  || p5SaturnCorrectiveBrowserCodeGate.hardCutInspection?.abruptHalfPlanetOrHalfRingCutObservedAfterCorrective !== false
  || p5SaturnCorrectiveBrowserCodeGate.resourceLifecycle?.cycleCount !== 4
  || p5SaturnCorrectiveBrowserCodeGate.resourceLifecycle?.texturesStable !== true
  || p5SaturnCorrectiveBrowserCodeGate.resourceLifecycle?.geometriesStable !== true
  || p5SaturnCorrectiveBrowserCodeGate.resourceLifecycle?.gpuBytesStable !== true
  || p5SaturnCorrectiveBrowserCodeGate.resourceLifecycle?.programDelta !== 2
  || p5SaturnCorrectiveBrowserCodeGate.resourceLifecycle?.programsRestoreToBaseline !== true
  || p5SaturnCorrectiveBrowserCodeGate.rotation?.samples?.length !== 4
  || p5SaturnCorrectiveBrowserCodeGate.rotation?.fixedCamera !== true
  || p5SaturnCorrectiveBrowserCodeGate.rotation?.realRateSeparatedFromTimeLapse !== true
  || p5SaturnCorrectiveBrowserCodeGate.rotation?.presentationAccelerationWriteback !== false
  || p5SaturnCorrectiveBrowserCodeGate.browser?.runner !== "Codex-in-app-browser-screenshots+Playwright-CLI-renderer-telemetry"
  || p5SaturnCorrectiveBrowserCodeGate.browser?.screenshotRunner !== "Codex-in-app-browser"
  || p5SaturnCorrectiveBrowserCodeGate.browser?.rendererTelemetryRunner !== "Playwright CLI"
  || p5SaturnCorrectiveBrowserCodeGate.browser?.currentDevNativeViewport !== "1280x720"
  || p5SaturnCorrectiveBrowserCodeGate.browser?.mobileInnerViewport !== "390x844"
  || p5SaturnCorrectiveBrowserCodeGate.browser?.mobilePhysicalDevice !== false
  || p5SaturnCorrectiveBrowserCodeGate.browser?.consoleWarningErrorCount !== 0
  || p5SaturnCorrectiveBrowserCodeGate.browser?.singleCanvas !== true
  || p5SaturnCorrectiveBrowserCodeGate.browser?.scientificPayloadSha256 !== SCIENTIFIC_PAYLOAD_SHA256
  || p5SaturnCorrectiveBrowserCodeGate.browser?.scientificPayloadUniqueCount !== 1
  || p5SaturnCorrectiveBrowserCodeGate.browser?.scientificPayloadWriteback !== false
  || p5SaturnCorrectiveBrowserCodeGate.browser?.minimumMedianFps < 45
  || p5SaturnCorrectiveBrowserCodeGate.browser?.maximumGpuBytes > 512 * 1024 * 1024
  || p5SaturnCorrectiveBrowserCodeGate.browser?.maximumDrawCalls > 60
  || p5SaturnCorrectiveBrowserCodeGate.authority?.scientificPayloadSha256 !== SCIENTIFIC_PAYLOAD_SHA256
  || p5SaturnCorrectiveBrowserCodeGate.authority?.scientificPayloadWriteback !== false
  || p5SaturnCorrectiveBrowserCodeGate.authority?.scientificAuthorityChanged !== false
  || p5SaturnCorrectiveBrowserCodeGate.authority?.measuredAuthorityGranted !== false
  || p5SaturnCorrectiveBrowserCodeGate.authority?.gpuAuthorityGranted !== false
  || p5SaturnCorrectiveBrowserCodeGate.authority?.radiativeTransferGranted !== false
  || p5SaturnCorrectiveBrowserCodeGate.authority?.productionReleaseAuthorized !== false
) throw new Error("v593-p5-saturn-corrective-browser-code-gate");
// P5 was current when it was issued. Its sealed source records remain historical
// provenance after later shared-bridge changes; current source is bound by the
// v593 source manifest and must be revalidated by a new sealed browser matrix.
for (const record of [
  p5SaturnCorrectiveBrowserCodeGate.sourceMaterialCorrectness.bridge,
  p5SaturnCorrectiveBrowserCodeGate.sourceMaterialCorrectness.shell,
  p5SaturnCorrectiveBrowserCodeGate.sourceMaterialCorrectness.focusedTest,
  p5SaturnCorrectiveBrowserCodeGate.sourceMaterialCorrectness.viewportHarness,
  p5SaturnCorrectiveBrowserCodeGate.sourceMaterialCorrectness.builder,
]) assertHistoricalRecord(record, "p5-saturn-historical-source");
for (const record of [
  p5SaturnCorrectiveBrowserCodeGate.scope.p4HistoricalPreCorrectiveEvidence,
  p5SaturnCorrectiveBrowserCodeGate.browser.telemetry,
  p5SaturnCorrectiveBrowserCodeGate.mobileEvidence.baselineRawCapture,
  p5SaturnCorrectiveBrowserCodeGate.mobileEvidence.signatureRawCapture,
  p5SaturnCorrectiveBrowserCodeGate.mobileEvidence.baselineNormalizedPreview,
  p5SaturnCorrectiveBrowserCodeGate.mobileEvidence.signatureNormalizedPreview,
  p5SaturnCorrectiveBrowserCodeGate.rotation.before,
  p5SaturnCorrectiveBrowserCodeGate.rotation.after,
]) assertHistoricalRecord(record, "p5-saturn-historical-artifact");
for (const capture of p5SaturnCorrectiveBrowserCodeGate.captures) {
  if (
    capture.baselineTelemetry?.patchCount !== 0
    || capture.baselineTelemetry?.webglChanged !== "false"
    || capture.signatureTelemetry?.patchCount !== 2
    || capture.signatureTelemetry?.surfacePatchCount !== 1
    || capture.signatureTelemetry?.ringPatchCount !== 1
    || capture.signatureTelemetry?.webglChanged !== "true"
    || capture.signatureTelemetry?.payload !== SCIENTIFIC_PAYLOAD_SHA256
    || capture.signatureTelemetry?.payloadStable !== "true"
    || capture.signatureTelemetry?.writeback !== "false"
    || capture.comparison?.changedChannelFractionGt2 <= 0.0001
  ) throw new Error(`v593-p5-saturn-capture-contract:${capture.id}`);
  assertFileRecord(capture.baseline, `p5-saturn-${capture.id}-baseline`);
  assertFileRecord(capture.signature, `p5-saturn-${capture.id}-signature`);
}
for (const detail of p5SaturnCorrectiveBrowserCodeGate.detailCrops) {
  assertFileRecord(detail.baseline, `p5-saturn-${detail.id}-baseline`);
  assertFileRecord(detail.signature, `p5-saturn-${detail.id}-signature`);
}

const frozenPaths = new Set(v592SourceManifest.files.map((file) => resolve(root, file.path)));
for (const path of [
  ...walkFiles(resolve(root, "docs/release/v592")),
  ...walkFiles(resolve(root, "public/data/living-universe-v592")),
  ...walkFiles(resolve(root, "app/local-shadow-v592")),
  resolve(root, "app/data/livingUniverseManifestV592.generated.ts"),
  resolve(root, "dist/release/atlas-v592-standalone-build-resource.json"),
  resolve(root, "dist/release/atlas-v592-lite-build-resource.json"),
  resolve(root, "dist/release/orbit-atlas-current-living-universe-candidate-v592.json"),
]) {
  if (existsSync(path) && statSync(path).isFile()) frozenPaths.add(path);
}
const currentFrozenSnapshot = [...frozenPaths].map(fileRecord).sort((left, right) => left.path.localeCompare(right.path));

let freeze;
if (existsSync(freezePath)) {
  freeze = readJson(freezePath);
  assertSeal(freeze, "snapshotSha256", "freeze-before-v593");
  if (freeze.frozenSnapshot.length !== currentFrozenSnapshot.length) throw new Error("v593-frozen-path-count-drift");
  for (let index = 0; index < currentFrozenSnapshot.length; index += 1) {
    const expected = freeze.frozenSnapshot[index];
    const actual = currentFrozenSnapshot[index];
    if (expected.path !== actual.path || expected.bytes !== actual.bytes || expected.sha256 !== actual.sha256) {
      throw new Error(`v593-frozen-byte-drift:${actual.path}`);
    }
  }
} else {
  freeze = {
    version: "v593-freeze-before-v1",
    generatedAt,
    status: "matched",
    baseline: Object.freeze({ candidate: "v592-readonly", manifestSha256: V592_MANIFEST_SHA256 }),
    frozenSnapshot: currentFrozenSnapshot,
  };
  freeze.snapshotSha256 = canonicalSha(freeze);
  await mkdir(dirname(freezePath), { recursive: true });
  await writeFile(freezePath, `${JSON.stringify(freeze, null, 2)}\n`, "utf8");
}

const sourcePaths = V593_SOURCE_PATHS;
for (const path of sourcePaths) {
  if (!existsSync(resolve(root, path))) throw new Error(`v593-source-missing:${path}`);
}
const sourceManifest = {
  version: "v593-source-manifest-v1",
  generatedAt,
  status: "complete",
  baseline: Object.freeze({ candidate: "v592-readonly", manifestSha256: V592_MANIFEST_SHA256 }),
  files: sourcePaths.map((path) => fileRecord(resolve(root, path))).sort((left, right) => left.path.localeCompare(right.path)),
};
sourceManifest.receiptSha256 = canonicalSha(sourceManifest);
await mkdir(dirname(sourceManifestPath), { recursive: true });
await writeFile(sourceManifestPath, `${JSON.stringify(sourceManifest, null, 2)}\n`, "utf8");

const manifest = {
  version: "v593-final-art-direction-product-rc-candidate-v1",
  generatedAt,
  status: "implemented-six-signature-bridges-current-source-revalidation-pending",
  route: "/local-shadow-v593",
  namespace: "final-art-direction-v593",
  formalProductPointer: "v263",
  baseline: Object.freeze({ candidate: "v592-readonly", manifestSha256: V592_MANIFEST_SHA256 }),
  governance: Object.freeze({
    additiveOnly: true,
    catalogExpansionAllowed: false,
    frozenEntryCount: freeze.frozenSnapshot.length,
    frozenDriftCount: 0,
    freezeBeforeSha256: freeze.snapshotSha256,
    sourceManifestSha256: sourceManifest.receiptSha256,
  }),
  contentDelivery: Object.freeze({
    status: contentPackIndex.status,
    indexPath: "dist/content-packs/v593/index.json",
    indexSha256: contentPackIndex.indexSha256,
    budget: contentPackIndex.budget,
    maximumResidentHighResolutionBodyPacks: 1,
  }),
  artDirection: Object.freeze({
    signaturePasses: Object.freeze([
      Object.freeze({ id: "sun", status: "implemented-code-gates-pending" }),
      Object.freeze({ id: "earth", status: "implemented-code-gates-pending" }),
      Object.freeze({ id: "jupiter", status: "implemented-code-gates-pending" }),
      Object.freeze({ id: "saturn", status: "implemented-code-gates-pending" }),
      Object.freeze({ id: "stellar-archetypes", status: "implemented-code-gates-pending" }),
      Object.freeze({ id: "deep-sky", status: "implemented-code-gates-pending" }),
    ]),
    goldenFrameCount: 42,
    humanVisualSignoff: "not-requested",
    inheritedVisualBaselineSigned: false,
    p1BrowserCodeGate: Object.freeze({
      path: relativePath(p1BrowserCodeGatePath),
      receiptSha256: p1BrowserCodeGate.receiptSha256,
      status: p1BrowserCodeGate.status,
      evidenceScope: "historical-pre-sun-current-dev-code-gates-only-not-current-source-not-sealed-build-not-human-signoff",
      signaturePassesCodeImplemented: 3,
      signaturePassesComplete: 0,
    }),
    p2SunBrowserCodeGate: Object.freeze({
      path: relativePath(p2SunBrowserCodeGatePath),
      receiptSha256: p2SunBrowserCodeGate.receiptSha256,
      status: p2SunBrowserCodeGate.status,
      evidenceScope: "current-dev-sun-code-gate-only-not-sealed-build-not-human-signoff",
      signaturePassesCodeImplemented: 4,
      signaturePassesComplete: 0,
    }),
    p3EarthBrowserCodeGate: Object.freeze({
      path: relativePath(p3EarthBrowserCodeGatePath),
      receiptSha256: p3EarthBrowserCodeGate.receiptSha256,
      status: p3EarthBrowserCodeGate.status,
      evidenceScope: "historical-pre-deep-sky-current-dev-earth-code-and-visual-gates-not-current-source-not-sealed-build-not-human-signoff",
      signaturePassesCodeImplemented: 5,
      signaturePassesComplete: 0,
    }),
    p4DeepSkyBrowserCodeGate: Object.freeze({
      path: relativePath(p4DeepSkyBrowserCodeGatePath),
      receiptSha256: p4DeepSkyBrowserCodeGate.receiptSha256,
      status: p4DeepSkyBrowserCodeGate.status,
      evidenceScope: "historical-pre-saturn-corrective-current-dev-deep-sky-code-and-visual-gates-not-current-source-not-sealed-build-not-human-signoff",
      signaturePassesCodeImplemented: 6,
      signaturePassesComplete: 0,
    }),
    p5SaturnCorrectiveBrowserCodeGate: Object.freeze({
      path: relativePath(p5SaturnCorrectiveBrowserCodeGatePath),
      receiptSha256: p5SaturnCorrectiveBrowserCodeGate.receiptSha256,
      status: "historical-receipt-verified-current-source-revalidation-pending",
      historicalReceiptStatus: p5SaturnCorrectiveBrowserCodeGate.status,
      evidenceScope: "historical-pre-shared-bridge-update-saturn-corrective-code-visual-mobile-resource-and-rotation-gates-not-current-source-not-sealed-build-not-human-signoff",
      currentSourceBound: false,
      currentSourceRevalidationEvidence: "docs/release/v593/final-sealed-browser-matrix-v593.json",
      signaturePassesCodeImplemented: 6,
      signaturePassesComplete: 0,
    }),
  }),
  ui: Object.freeze({
    primaryContextSeparation: "implemented-sky-focus-overrides-retained-body-inspector",
    singleCanvas: true,
    cleanViewInherited: true,
    mobileBottomSheetInherited: true,
  }),
  acceptedSourceBoundaries: Object.freeze([
    "bennu-absolute-w0",
    "kleopatra-absolute-w0",
    "triton-global-visual-asset",
    "miranda-global-visual-asset",
    "titania-global-visual-asset",
    "iau-constellation-boundaries",
  ]),
  authority: Object.freeze({
    scientificPayloadSha256: SCIENTIFIC_PAYLOAD_SHA256,
    scientificPayloadWriteback: false,
    scientificAuthorityChanged: false,
    radiativeTransferGranted: false,
    measuredAuthorityGranted: false,
    gpuAuthorityGranted: false,
    productionReleaseAuthorized: false,
    gitMutationAllowed: false,
  }),
};
manifest.manifestSha256 = canonicalSha(manifest);
await mkdir(dirname(manifestPath), { recursive: true });
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

const finalBrowser = readSealedEvidence(finalBrowserPath, "receiptSha256", "final-browser");
const liteBrowser = readSealedEvidence(liteBrowserPath, "receiptSha256", "lite-browser");
const resourceLifecycle = readSealedEvidence(resourceLifecyclePath, "receiptSha256", "resource-lifecycle");
const soak = readSealedEvidence(soakPath, "receiptSha256", "soak");
const releaseExport = readSealedEvidence(releaseExportPath, "dossierSha256", "release-export");
const humanVisualSignoff = readSealedEvidence(humanVisualSignoffPath, "receiptSha256", "human-visual-signoff");
const standaloneBuild = existsSync(standaloneBuildReceiptPath) ? readJson(standaloneBuildReceiptPath) : null;
const liteBuild = existsSync(liteBuildReceiptPath) ? readJson(liteBuildReceiptPath) : null;
const expectedDeploymentId = sourceManifest.receiptSha256 && manifest.manifestSha256
  ? `v593-${sourceManifest.receiptSha256.slice(0, 12)}-${manifest.manifestSha256.slice(0, 12)}`
  : null;
const expectedCurrentIdentity = Object.freeze({
  buildId: standaloneBuild?.buildId ?? null,
  deploymentId: expectedDeploymentId,
  sourceManifestSha256: sourceManifest.receiptSha256,
  manifestSha256: manifest.manifestSha256,
});
const finalBrowserCurrent = Boolean(
  finalBrowser
  && standaloneBuild?.buildId === liteBuild?.buildId
  && standaloneBuild?.status === "passed"
  && liteBuild?.status === "passed"
  && standaloneBuild?.deliveryTier === "standalone-full"
  && liteBuild?.deliveryTier === "vercel-lite"
  && standaloneBuild?.deploymentId === expectedDeploymentId
  && liteBuild?.deploymentId === expectedDeploymentId
  && finalBrowser.candidate?.sourceManifestSha256 === sourceManifest.receiptSha256
  && finalBrowser.candidate?.manifestSha256 === manifest.manifestSha256
  && finalBrowser.candidate?.deploymentId === expectedDeploymentId
  && finalBrowser.build?.buildId === standaloneBuild?.buildId
  && finalBrowser.frames?.length === 42
  && finalBrowser.aggregate?.consolePageWebglErrorWarningCount === 0
  && trustedBrowserStage(finalBrowser, expectedCurrentIdentity, "standalone-full")
);
const liteBrowserCurrent = Boolean(
  liteBrowser
  && standaloneBuild?.buildId === liteBuild?.buildId
  && liteBrowser.build?.sourceManifestSha256 === sourceManifest.receiptSha256
  && liteBrowser.build?.manifestSha256 === manifest.manifestSha256
  && liteBrowser.build?.buildId === liteBuild?.buildId
  && liteBrowser.build?.deploymentId === expectedDeploymentId
  && liteBrowser.frames?.length === 8
  && liteBrowser.console?.count === 0
  && trustedBrowserStage(liteBrowser, {
    ...expectedCurrentIdentity,
    buildId: liteBuild?.buildId ?? null,
  }, "vercel-lite")
);
const resourceLifecycleIdentityCurrent = Boolean(
  resourceLifecycle
  && resourceLifecycle.version === "v593-resource-lifecycle-v2"
  && resourceLifecycle.status === "passed-current-identity-16-hero-mount-cycles-and-same-realm-scene-exit"
  && candidateIdentityMatches(resourceLifecycle.candidate, expectedCurrentIdentity)
  && resourceLifecycle.mountCycles?.status === "passed-current-identity-16-hero-32-mount-cycles"
  && resourceLifecycle.mountCycles?.heroCount === 16
  && resourceLifecycle.mountCycles?.admittedCount === 16
  && resourceLifecycle.mountCycles?.blockedCount === 0
  && resourceLifecycle.mountCycles?.admittedMountCycleCount === 32
  && resourceLifecycle.mountCycles?.sustainedGrowth === false
  && resourceLifecycle.console?.count === 0
  && resourceLifecycle.authority?.scientificPayloadWriteback === false
  && resourceLifecycle.authority?.scientificAuthorityChanged === false
  && resourceLifecycle.authority?.measuredAuthorityGranted === false
  && resourceLifecycle.authority?.gpuAuthorityGranted === false
  && resourceLifecycle.authority?.productionReleaseAuthorized === false
);
const soakIdentityCurrent = Boolean(
  soak
  && soak.version === "v593-soak-v2"
  && soak.status === "passed-current-identity-cdp-heap-soak-and-same-realm-scene-exit"
  && candidateIdentityMatches(soak.candidate, expectedCurrentIdentity)
  && soak.candidate.deploymentId === resourceLifecycle?.candidate?.deploymentId
  && soak.authority?.scientificPayloadWriteback === false
  && soak.authority?.scientificAuthorityChanged === false
  && soak.authority?.measuredAuthorityGranted === false
  && soak.authority?.gpuAuthorityGranted === false
  && soak.authority?.productionReleaseAuthorized === false
);
const sameRealmSceneExitCurrent = Boolean(
  resourceLifecycleIdentityCurrent
  && soakIdentityCurrent
  && trustedSameRealmProof(resourceLifecycle, soak, expectedCurrentIdentity)
);
const resourceLifecycleCurrent = resourceLifecycleIdentityCurrent && sameRealmSceneExitCurrent;
const cdpHeapSoakCurrent = Boolean(
  soakIdentityCurrent
  && trustedCdpHeapProof(soak, expectedCurrentIdentity)
  && soak.memory?.status === "passed-authoritative-cdp-heap-soak"
  && soak.memory?.measurementAuthority === "HeapProfiler.collectGarbage-before-Runtime.getHeapUsage"
  && soak.memory?.jsHeapTelemetry === "available-chromium-cdp-runtime-getHeapUsage"
  && soak.memory?.sampleCount === soak.cdpHeapSoak?.sampleCount
  && soak.memory?.sampleSpanMilliseconds === soak.cdpHeapSoak?.memory?.sampleSpanMilliseconds
  && soak.memory?.sustainedJsHeapGrowth === false
  && soak.memory?.finalHeapWithinAllowance === true
  && soak.memory?.lastTenOlsWithinLimit === true
  && soak.memory?.requiredForClosure === true
  && soak.memory?.noSyntheticSubstitution === true
  && soak.durationSeconds === soak.cdpHeapSoak?.durationSeconds
  && soak.sampleCount === soak.cdpHeapSoak?.sampleCount
  && soak.aggregate?.canvasCountStable === true
  && soak.aggregate?.payloadUniqueCount === 1
  && soak.aggregate?.scientificWritebackCount === 0
  && sameCanonicalValue(soak.console, soak.cdpHeapSoak?.console)
);
const rendererSoakPassed = Boolean(
  cdpHeapSoakCurrent
  && soak.aggregate?.rendererResourceGrowth === false
  && soak.aggregate?.rendererResourceBaselineStable === true
  && soak.cdpHeapSoak?.renderer?.fingerprintCount === 1
);
const humanVisualSignoffCurrent = trustedHumanVisualSignoff(humanVisualSignoff, {
  buildId: standaloneBuild?.buildId,
  sourceManifestSha256: sourceManifest.receiptSha256,
  manifestSha256: manifest.manifestSha256,
});
const humanClosureAligned = Boolean(
  releaseExport
  && releaseExport.humanReview?.identityMatches === true
  && releaseExport.humanReview?.receiptSha256 === humanVisualSignoff?.receiptSha256
  && (
    humanVisualSignoffCurrent
      ? releaseExport.status === "passed-current-identity-export-matrices-mount-lifecycle-same-realm-and-cdp-heap-human-signoff-approved"
        && releaseExport.humanVisualSignoff === true
        && releaseExport.humanReview?.approved === true
      : humanVisualSignoff?.status === "pending-human-visual-signoff"
        && releaseExport.status === "passed-current-identity-export-matrices-mount-lifecycle-same-realm-and-cdp-heap-human-signoff-pending"
        && releaseExport.humanVisualSignoff === false
        && releaseExport.humanReview?.approved === false
  )
);
const releaseExportCurrent = Boolean(
  releaseExport
  && sameRealmSceneExitCurrent
  && cdpHeapSoakCurrent
  && rendererSoakPassed
  && releaseExport.version === "v593-release-export-and-closure-dossier-v2"
  && releaseExport.candidate?.sourceManifestSha256 === sourceManifest.receiptSha256
  && releaseExport.candidate?.manifestSha256 === manifest.manifestSha256
  && releaseExport.builds?.standalone?.buildId === standaloneBuild?.buildId
  && releaseExport.builds?.lite?.buildId === liteBuild?.buildId
  && releaseExport.gates?.exportBudgetsPassed === true
  && releaseExport.gates?.rendererSoakPassed === true
  && releaseExport.gates?.sameRealmSceneExitPassed === true
  && releaseExport.gates?.sameRealmSceneExitReceiptSha256 === resourceLifecycle?.sameRealmSceneExit?.receiptSha256
  && releaseExport.gates?.cdpHeapSoakPassed === true
  && releaseExport.gates?.cdpHeapSoakReceiptSha256 === soak?.cdpHeapSoak?.receiptSha256
  && releaseExport.gates?.jsHeapGate === "passed"
  && releaseExport.resourceLifecycle?.receiptSha256 === resourceLifecycle?.receiptSha256
  && releaseExport.soak?.receiptSha256 === soak?.receiptSha256
  && humanClosureAligned
);
const currentAutomaticEvidence = finalBrowserCurrent
  && liteBrowserCurrent
  && resourceLifecycleCurrent
  && rendererSoakPassed
  && releaseExportCurrent;
const qualifiedCandidate = currentAutomaticEvidence && humanVisualSignoffCurrent;
const jsHeapGate = cdpHeapSoakCurrent ? "passed" : "not-run-or-untrusted";
const signatureBridgeStatus = qualifiedCandidate
  ? "qualified-current-source-human-signed"
  : "implemented-code-gates-pending";

const currentState = {
  version: "v593-current-state-receipt-v1",
  generatedAt,
  status: qualifiedCandidate ? "qualified-additive-v593-visual-candidate" : manifest.status,
  phase: qualifiedCandidate
    ? "qualified-additive-v593-visual-candidate"
    : currentAutomaticEvidence
      ? "current-source-automatic-closure-complete-human-signoff-pending"
      : "six-signature-bridges-current-source-revalidation-pending",
  formalProduct: Object.freeze({ pointer: "v263", changed: false }),
  candidate: Object.freeze({ route: manifest.route, manifestSha256: manifest.manifestSha256, promotion: "additive-only" }),
  progress: Object.freeze({
    namespace: "implemented",
    freezeAudit: `${freeze.frozenSnapshot.length}/0-drift`,
    contentPacks: "materialized-two-focus-demand-packs-budget-projection-passed",
    vitestDiscovery: "root-config-excludes-tmp-playwright-and-build-output",
    uiPrimaryContext: "implemented",
    signatureArtPasses: qualifiedCandidate ? "implemented-code-6/6;complete-6/6-human-signed" : "implemented-code-6/6;complete-0/6",
    sameBuildArtComparison: "implemented-v592-baseline-v593-signature",
    deterministicJupiterGrsFrame: "implemented-fixed-j2000-query-preset",
    p1BrowserCodeGate: "passed-current-dev-only-sealed-build-and-human-signoff-pending",
    p2SunBrowserCodeGate: "passed-current-dev-only-sealed-build-and-human-signoff-pending",
    p3EarthBrowserCodeGate: "passed-current-dev-code-and-visual-only-console-replay-sealed-build-and-human-signoff-pending",
    p4DeepSkyBrowserCodeGate: "passed-current-dev-code-and-visual-zero-console-errors-sealed-build-and-human-signoff-pending",
    p5SaturnCorrectiveBrowserCodeGate: finalBrowserCurrent
      ? qualifiedCandidate
        ? "historical-receipt-preserved-current-source-revalidated-by-sealed-matrix-human-signoff-approved"
        : "historical-receipt-preserved-current-source-revalidated-by-sealed-matrix-human-signoff-pending"
      : "historical-receipt-preserved-current-source-sealed-matrix-revalidation-pending",
    standaloneBuild: standaloneBuild?.candidateSourceManifestSha256 === sourceManifest.receiptSha256 ? "passed-current-source" : "not-current-source",
    liteBuild: liteBuild?.candidateSourceManifestSha256 === sourceManifest.receiptSha256 ? "passed-current-source" : "not-current-source",
    goldenVisualMatrix: finalBrowserCurrent
      ? qualifiedCandidate
        ? "passed-current-source-42/42-human-signoff-approved"
        : "passed-current-source-42/42-human-signoff-pending"
      : "not-current-source-or-not-run",
    liteBrowserMatrix: liteBrowserCurrent ? "passed-current-source-8/8" : "not-current-source-or-not-run",
    resourceLifecycle: resourceLifecycleCurrent
      ? "passed-current-source-16/16-same-realm-scene-exit"
      : resourceLifecycleIdentityCurrent
        ? "blocked-current-source-same-realm-scene-exit-missing-or-untrusted"
        : "not-current-source-or-not-run",
    soak30Minutes: rendererSoakPassed ? `renderer-passed;js-heap-${jsHeapGate}` : "not-current-source-or-not-run",
    releaseDossier: releaseExportCurrent ? `current-source;${releaseExport.status}` : "not-current-source-or-not-run",
    humanVisualSignoff: humanVisualSignoffCurrent ? "approved-6/6" : "pending-0/6",
  }),
  authority: manifest.authority,
};
currentState.receiptSha256 = canonicalSha(currentState);
await writeFile(currentStatePath, `${JSON.stringify(currentState, null, 2)}\n`, "utf8");

const capability = {
  version: "v593-final-art-direction-capability-report-v1",
  generatedAt,
  status: qualifiedCandidate ? "qualified-additive-v593-visual-candidate" : manifest.status,
  candidate: Object.freeze({ route: manifest.route, manifestSha256: manifest.manifestSha256, formalProductPointer: "v263" }),
  capabilities: Object.freeze({
    namespaceIsolated: true,
    v592ReadonlyBaseline: true,
    frozenEntryCount: freeze.frozenSnapshot.length,
    frozenDriftCount: 0,
    singleCanvas: true,
    v593OwnedR3fCanvasHost: true,
    sameBuildBaselineSignatureAb: true,
    jupiterSeamSafeMaterialBridge: signatureBridgeStatus,
    jupiterDeterministicGrsFrame: signatureBridgeStatus,
    stellarArchetypeMaterialBridge: signatureBridgeStatus,
    stellarArchetypeProfileCount: 4,
    saturnOpticalDepthMaterialBridge: signatureBridgeStatus,
    saturnBidirectionalShadowBridge: signatureBridgeStatus,
    saturnDeterministicFrameCount: 3,
    solarPhotosphereMaterialBridge: signatureBridgeStatus,
    solarChromosphereMaterialBridge: signatureBridgeStatus,
    solarDifferentialRotationBridge: signatureBridgeStatus,
    earthSurfaceOceanNightMaterialBridge: signatureBridgeStatus,
    earthDualCloudShadowMaterialBridge: signatureBridgeStatus,
    earthAtmosphericLimbMaterialBridge: signatureBridgeStatus,
    deepSkySphereMaterialBridge: signatureBridgeStatus,
    deepSkyGaiaPsfMaterialBridge: signatureBridgeStatus,
    deepSkyNebulaObservationMaterialBridge: signatureBridgeStatus,
    currentAutomaticEvidence: Object.freeze({
      standaloneBuild: standaloneBuild?.candidateSourceManifestSha256 === sourceManifest.receiptSha256,
      liteBuild: liteBuild?.candidateSourceManifestSha256 === sourceManifest.receiptSha256,
      standaloneBrowserMatrix: finalBrowserCurrent,
      liteBrowserMatrix: liteBrowserCurrent,
      mountLifecycle16Heroes32Cycles: resourceLifecycleIdentityCurrent,
      sameRealmSceneExit: sameRealmSceneExitCurrent,
      resourceLifecycle: resourceLifecycleCurrent,
      cdpHeapSoak: cdpHeapSoakCurrent,
      rendererSoak30Minutes: rendererSoakPassed,
      jsHeapGate,
      releaseDossier: releaseExportCurrent,
      humanVisualSignoff: humanVisualSignoffCurrent,
    }),
    p1BrowserCodeGate: Object.freeze({
      status: p1BrowserCodeGate.status,
      receiptSha256: p1BrowserCodeGate.receiptSha256,
      captureCount: p1BrowserCodeGate.captures.length,
      nativeCropCount: p1BrowserCodeGate.captures.length * 2,
      currentSourceBound: false,
      supersededForCurrentSourceBy: "p2-sun-browser-code-gate-v593",
      sealedBuildEvidence: false,
      humanVisualSignoff: false,
    }),
    p2SunBrowserCodeGate: Object.freeze({
      status: p2SunBrowserCodeGate.status,
      receiptSha256: p2SunBrowserCodeGate.receiptSha256,
      captureCount: p2SunBrowserCodeGate.captures.length,
      detailCropCount: p2SunBrowserCodeGate.detailCrops.length,
      sealedBuildEvidence: false,
      humanVisualSignoff: false,
    }),
    p3EarthBrowserCodeGate: Object.freeze({
      status: p3EarthBrowserCodeGate.status,
      receiptSha256: p3EarthBrowserCodeGate.receiptSha256,
      captureCount: p3EarthBrowserCodeGate.captures.length,
      nativeCropCount: p3EarthBrowserCodeGate.captures.length * 2,
      detailCropCount: p3EarthBrowserCodeGate.detailCrops.length * 2,
      seamGradientReductionFraction: p3EarthBrowserCodeGate.seamInspection.gradientReductionFraction,
      consoleReplayStatus: p3EarthBrowserCodeGate.browser.consoleReplay.status,
      currentSourceBound: false,
      supersededForCurrentSourceBy: "p4-deep-sky-browser-code-gate-v593",
      sealedBuildEvidence: false,
      humanVisualSignoff: false,
    }),
    p4DeepSkyBrowserCodeGate: Object.freeze({
      status: p4DeepSkyBrowserCodeGate.status,
      receiptSha256: p4DeepSkyBrowserCodeGate.receiptSha256,
      captureCount: p4DeepSkyBrowserCodeGate.captures.length,
      detailCropCount: p4DeepSkyBrowserCodeGate.detailCrops.length * 2,
      planeEdgeReductionFraction: p4DeepSkyBrowserCodeGate.planeEdgeInspection.reductionFraction,
      consoleWarningErrorCount: p4DeepSkyBrowserCodeGate.browser.consoleWarningErrorCount,
      minimumMedianFps: p4DeepSkyBrowserCodeGate.browser.minimumMedianFps,
      maximumGpuBytes: p4DeepSkyBrowserCodeGate.browser.maximumGpuBytes,
      maximumDrawCalls: p4DeepSkyBrowserCodeGate.browser.maximumDrawCalls,
      currentSourceBound: false,
      supersededForCurrentSourceBy: "p5-saturn-corrective-browser-code-gate-v593",
      sealedBuildEvidence: false,
      humanVisualSignoff: false,
    }),
    p5SaturnCorrectiveBrowserCodeGate: Object.freeze({
      status: "historical-receipt-verified-current-source-revalidation-pending",
      historicalReceiptStatus: p5SaturnCorrectiveBrowserCodeGate.status,
      receiptSha256: p5SaturnCorrectiveBrowserCodeGate.receiptSha256,
      captureCount: p5SaturnCorrectiveBrowserCodeGate.captures.length,
      detailCropCount: p5SaturnCorrectiveBrowserCodeGate.detailCrops.length * 2,
      desktopHardCutReductionFraction: p5SaturnCorrectiveBrowserCodeGate.hardCutInspection.desktop.reductionFraction,
      mobileHardCutReductionFraction: p5SaturnCorrectiveBrowserCodeGate.hardCutInspection.mobileNativeViewport.reductionFraction,
      resourceCycleCount: p5SaturnCorrectiveBrowserCodeGate.resourceLifecycle.cycleCount,
      rotationSampleCount: p5SaturnCorrectiveBrowserCodeGate.rotation.samples.length,
      consoleWarningErrorCount: p5SaturnCorrectiveBrowserCodeGate.browser.consoleWarningErrorCount,
      minimumMedianFps: p5SaturnCorrectiveBrowserCodeGate.browser.minimumMedianFps,
      maximumGpuBytes: p5SaturnCorrectiveBrowserCodeGate.browser.maximumGpuBytes,
      maximumDrawCalls: p5SaturnCorrectiveBrowserCodeGate.browser.maximumDrawCalls,
      currentSourceBound: false,
      currentSourceRevalidationEvidence: "docs/release/v593/final-sealed-browser-matrix-v593.json",
      currentSourceRevalidation: finalBrowserCurrent ? "passed-current-sealed-build" : "pending-current-sealed-build",
      sealedBuildEvidence: false,
      humanVisualSignoff: false,
    }),
    primaryObservationContextSeparated: true,
    contentPackIndexSha256: contentPackIndex.indexSha256,
    optionalContentPackCount: contentPackIndex.packs.length,
    liteShellBudget: contentPackIndex.budget.liteShell,
    observatoryDefaultBudget: contentPackIndex.budget.observatoryDefault,
    vitestDiscoveryBoundary: true,
    goldenFrameCount: 42,
  }),
  blockedGates: Object.freeze({
    signatureArtPasses: humanVisualSignoffCurrent ? "passed:6/6-human-signed" : "blocked:0/6-final-passes-signed;6/6-real-webgl-code-implemented",
    goldenVisualMatrix: finalBrowserCurrent
      ? qualifiedCandidate
        ? "passed-current-source-42/42-human-signoff-approved"
        : "passed-current-source-42/42-human-signoff-pending"
      : "blocked-not-current-source",
    standaloneBuild: standaloneBuild?.candidateSourceManifestSha256 === sourceManifest.receiptSha256 ? "passed-current-source" : "blocked-not-current-source",
    liteBuild: liteBuild?.candidateSourceManifestSha256 === sourceManifest.receiptSha256 ? "passed-current-source" : "blocked-not-current-source",
    standaloneBrowserMatrix: finalBrowserCurrent ? "passed-current-source-42/42" : "blocked-not-current-source",
    liteBrowserMatrix: liteBrowserCurrent ? "passed-current-source-8/8" : "blocked-not-current-source",
    resourceLifecycle: resourceLifecycleCurrent
      ? "passed-current-source-16/16-same-realm-scene-exit"
      : resourceLifecycleIdentityCurrent
        ? "blocked-same-realm-scene-exit-missing-or-untrusted"
        : "blocked-not-current-source",
    cdpHeapSoak: cdpHeapSoakCurrent ? "passed-current-source-cdp-heap" : "blocked-not-current-source-or-untrusted",
    realDeviceMatrix: "not-run-runner-scope-must-be-disclosed",
    soak30Minutes: rendererSoakPassed ? `renderer-passed;js-heap-${jsHeapGate}` : "blocked-not-current-source",
    releaseDossier: releaseExportCurrent ? releaseExport.status : "blocked-not-current-source",
    productionRelease: "not-authorized",
  }),
  evidence: Object.freeze({
    sourceManifestSha256: sourceManifest.receiptSha256,
    freezeBeforeSha256: freeze.snapshotSha256,
    contentPackIndexSha256: contentPackIndex.indexSha256,
    currentStateReceiptSha256: currentState.receiptSha256,
    p1BrowserCodeGateReceiptSha256: p1BrowserCodeGate.receiptSha256,
    p2SunBrowserCodeGateReceiptSha256: p2SunBrowserCodeGate.receiptSha256,
    p3EarthBrowserCodeGateReceiptSha256: p3EarthBrowserCodeGate.receiptSha256,
    p4DeepSkyBrowserCodeGateReceiptSha256: p4DeepSkyBrowserCodeGate.receiptSha256,
    p5SaturnCorrectiveBrowserCodeGateReceiptSha256: p5SaturnCorrectiveBrowserCodeGate.receiptSha256,
    finalBrowserReceiptSha256: finalBrowser?.receiptSha256 ?? null,
    liteBrowserReceiptSha256: liteBrowser?.receiptSha256 ?? null,
    resourceLifecycleReceiptSha256: resourceLifecycle?.receiptSha256 ?? null,
    sameRealmSceneExitReceiptSha256: resourceLifecycle?.sameRealmSceneExit?.receiptSha256 ?? null,
    soakReceiptSha256: soak?.receiptSha256 ?? null,
    cdpHeapSoakReceiptSha256: soak?.cdpHeapSoak?.receiptSha256 ?? null,
    releaseDossierSha256: releaseExport?.dossierSha256 ?? null,
    humanVisualSignoffReceiptSha256: humanVisualSignoff?.receiptSha256 ?? null,
  }),
  releaseAuthorized: false,
};
capability.reportSha256 = canonicalSha(capability);
await writeFile(capabilityPath, `${JSON.stringify(capability, null, 2)}\n`, "utf8");

const pointer = {
  version: "v593-current-product-rc-candidate-pointer-v1",
  generatedAt,
  status: qualifiedCandidate ? "qualified-additive-v593-visual-candidate" : "candidate-only-not-promoted",
  route: manifest.route,
  manifestSha256: manifest.manifestSha256,
  capabilityReportSha256: capability.reportSha256,
  formalProductPointer: "v263",
  productionPromotionAllowed: false,
};
pointer.pointerSha256 = canonicalSha(pointer);
await mkdir(dirname(pointerPath), { recursive: true });
await writeFile(pointerPath, `${JSON.stringify(pointer, null, 2)}\n`, "utf8");

await mkdir(dirname(generatedConstantsPath), { recursive: true });
await writeFile(generatedConstantsPath, `// Generated by scripts/build-v593-final-art-direction-candidate.mjs. Do not edit.\nexport const FINAL_ART_MANIFEST_SHA256_V593 = "${manifest.manifestSha256}" as const;\nexport const FINAL_ART_SOURCE_MANIFEST_SHA256_V593 = "${sourceManifest.receiptSha256}" as const;\nexport const FINAL_ART_FREEZE_BEFORE_SHA256_V593 = "${freeze.snapshotSha256}" as const;\nexport const FINAL_ART_CONTENT_PACK_INDEX_SHA256_V593 = "${contentPackIndex.indexSha256}" as const;\n`, "utf8");

console.log(JSON.stringify({
  status: qualifiedCandidate ? "qualified-additive-v593-visual-candidate" : manifest.status,
  route: manifest.route,
  manifestSha256: manifest.manifestSha256,
  sourceManifestSha256: sourceManifest.receiptSha256,
  freezeBeforeSha256: freeze.snapshotSha256,
  frozenEntryCount: freeze.frozenSnapshot.length,
  contentPackIndexSha256: contentPackIndex.indexSha256,
  budgets: contentPackIndex.budget,
  formalProductPointer: "v263",
  releaseAuthorized: false,
}, null, 2));

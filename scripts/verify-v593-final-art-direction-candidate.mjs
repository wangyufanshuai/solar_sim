import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const readJson = (path) => JSON.parse(read(path));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
function canonicalSha(value) {
  return sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
}
function verifySeal(document, field, label) {
  const unsigned = { ...document };
  delete unsigned[field];
  if (document[field] !== canonicalSha(unsigned)) throw new Error(`v593-verify-seal:${label}`);
}
function verifyFile(entry, label) {
  const path = resolve(root, entry.path);
  const workspacePath = relative(root, path);
  if (workspacePath === "" || workspacePath === ".." || workspacePath.startsWith(`..${sep}`) || isAbsolute(workspacePath)) throw new Error(`v593-verify-boundary:${label}:${entry?.path}`);
  if (!existsSync(path)) throw new Error(`v593-verify-missing:${label}:${entry.path}`);
  const bytes = readFileSync(path);
  if (bytes.byteLength !== entry.bytes || sha256(bytes) !== entry.sha256) throw new Error(`v593-verify-byte-drift:${label}:${entry.path}`);
}
function verifyHistoricalRecord(entry, label) {
  if (
    !entry
    || typeof entry.path !== "string"
    || entry.path.length === 0
    || !Number.isSafeInteger(entry.bytes)
    || entry.bytes < 0
    || typeof entry.sha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(entry.sha256)
  ) throw new Error(`v593-verify-historical-record:${label}`);
}
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
function verifyHumanVisualSignoff(receipt, expected) {
  const reviewedAt = receipt.reviewedAt ?? receipt.signedAt;
  const passNames = Object.keys(receipt.passes ?? {});
  if (
    receipt.version !== "v593-human-visual-signoff-dossier-v1"
    || receipt.status !== "approved-v593-six-signature-pass-human-visual-signoff"
    || receipt.candidate?.route !== "/local-shadow-v593"
    || receipt.candidate?.buildId !== expected.buildId
    || receipt.candidate?.deploymentId !== expected.deploymentId
    || receipt.candidate?.sourceManifestSha256 !== expected.sourceManifestSha256
    || receipt.candidate?.manifestSha256 !== expected.manifestSha256
    || receipt.candidate?.formalProductPointer !== "v263"
    || receipt.policy?.sameBuildBeforeAfter !== true
    || receipt.policy?.currentBuildOnly !== true
    || receipt.policy?.noHistoricalScreenshotSubstitution !== true
    || receipt.policy?.fullFrameAnd100PercentCropRequired !== true
    || receipt.policy?.scientificPayloadWriteback !== false
    || receipt.policy?.signaturePassesRequired !== HUMAN_VISUAL_SIGNATURE_PASSES.length
    || !sameCanonicalValue(passNames, HUMAN_VISUAL_SIGNATURE_PASSES)
    || receipt.signaturePassesApproved !== HUMAN_VISUAL_SIGNATURE_PASSES.length
    || receipt.approved !== true
    || typeof receipt.reviewer !== "string"
    || receipt.reviewer.trim().length === 0
    || typeof reviewedAt !== "string"
    || !Number.isFinite(Date.parse(reviewedAt))
    || receipt.reviewReadiness?.allAutomaticPassPrerequisitesPassed !== true
    || receipt.reviewReadiness?.blockedPasses?.length !== 0
    || receipt.liveBrowserAbTelemetry?.gates?.webglAbCorePassed !== true
    || receipt.liveBrowserAbTelemetry?.gates?.payloadImmutable !== true
    || receipt.liveBrowserAbTelemetry?.gates?.fpsPassed !== true
    || receipt.liveBrowserAbTelemetry?.gates?.gpuPassed !== true
    || receipt.authority?.scientificPayloadSha256 !== expected.scientificPayloadSha256
    || receipt.authority?.scientificPayloadWriteback !== false
    || receipt.authority?.measuredAuthorityGranted !== false
    || receipt.authority?.gpuAuthorityGranted !== false
    || receipt.authority?.productionReleaseAuthorized !== false
  ) throw new Error("v593-verify-human-signoff-contract");
  verifyFile(receipt.sourceStageDossier, "human-source-stage-dossier");
  verifyFile(receipt.exactAbStage ?? receipt.captureCorrection, "human-exact-ab-stage-batch");
  if (receipt.captureCorrectionLedger) verifyFile(receipt.captureCorrectionLedger, "human-capture-correction-ledger");
  verifyFile(receipt.userDecision, "human-user-decision");
  const sourceStage = readJson(receipt.sourceStageDossier.path);
  const userDecision = readJson(receipt.userDecision.path);
  verifySeal(sourceStage, "receiptSha256", "human-source-stage-dossier");
  if (
    sourceStage.version !== "v593-human-visual-signoff-stage-dossier-v1"
    || sourceStage.status !== "pending-human-visual-signoff-not-promoted"
    || sourceStage.candidate?.buildId !== expected.buildId
    || sourceStage.candidate?.sourceManifestSha256 !== expected.sourceManifestSha256
    || sourceStage.candidate?.manifestSha256 !== expected.manifestSha256
    || sourceStage.signaturePassesApproved !== 0
    || sourceStage.approved !== false
    || sourceStage.reviewer !== null
  ) throw new Error("v593-verify-human-source-stage-contract");
  for (const name of HUMAN_VISUAL_SIGNATURE_PASSES) {
    const pass = receipt.passes[name];
    if (
      !pass?.sourceMaterialCorrectness?.startsWith("passed-live-webgl-material")
      || pass.currentBuildBeforeAfter !== true
      || pass.runtimeAbGate !== true
      || pass.payloadStable !== true
      || pass.fpsGpuResourceGate !== true
      || pass.humanVisualSignoff !== "approved"
    ) throw new Error(`v593-verify-human-signoff-pass:${name}`);
  }
  if (!Array.isArray(receipt.frames) || receipt.frames.length !== 15) {
    throw new Error("v593-verify-human-signoff-frame-count");
  }
  const frameIds = new Set();
  for (const [index, frame] of receipt.frames.entries()) {
    if (
      frameIds.has(frame.id)
      || frame.id !== EXACT_AB_FRAME_MAP[index]?.[0]
      || frame.pass !== EXACT_AB_FRAME_MAP[index]?.[1]
      || frame.requestedPreset !== EXACT_AB_FRAME_MAP[index]?.[2]
      || frame.requestedMode !== EXACT_AB_FRAME_MAP[index]?.[3]
      || !HUMAN_VISUAL_SIGNATURE_PASSES.includes(frame.pass)
      || frame.signatureBuild?.buildId !== expected.buildId
      || frame.signatureBuild?.sourceManifestSha256 !== expected.sourceManifestSha256
      || frame.signatureTelemetry?.manifestSha256 !== expected.manifestSha256
      || frame.signatureTelemetry?.scientificPayloadSha256 !== expected.scientificPayloadSha256
      || frame.scientificPayloadSha256 !== expected.scientificPayloadSha256
      || frame.scientificPayloadWriteback !== false
      || frame.humanReview !== "approved"
    ) throw new Error(`v593-verify-human-signoff-frame:${frame.id ?? "unknown"}`);
    frameIds.add(frame.id);
    verifyFile(frame.baseline, `human-${frame.id}-baseline`);
    verifyFile(frame.signature, `human-${frame.id}-signature`);
    verifyFile(frame.baselineRoi, `human-${frame.id}-baseline-roi`);
    verifyFile(frame.signatureRoi, `human-${frame.id}-signature-roi`);
    verifyFile(frame.signatureBuild.receipt, `human-${frame.id}-build-receipt`);
  }
  if (!Array.isArray(receipt.contactSheets) || receipt.contactSheets.length !== HUMAN_VISUAL_SIGNATURE_PASSES.length) {
    throw new Error("v593-verify-human-signoff-contact-sheets");
  }
  for (const sheet of receipt.contactSheets) {
    if (!HUMAN_VISUAL_SIGNATURE_PASSES.includes(sheet.pass)) {
      throw new Error(`v593-verify-human-signoff-contact-sheet:${sheet.pass ?? "unknown"}`);
    }
    verifyFile(sheet.image, `human-${sheet.pass}-contact-sheet`);
  }
  verifyFile(receipt.liveBrowserAbTelemetry.evidence, "human-live-browser-ab");
  const liveTelemetry = readJson(receipt.liveBrowserAbTelemetry.evidence.path);
  verifySeal(liveTelemetry, "receiptSha256", "human-live-browser-ab");
  if (
    liveTelemetry.candidate?.buildId !== expected.buildId
    || liveTelemetry.candidate?.sourceManifestSha256 !== expected.sourceManifestSha256
    || liveTelemetry.candidate?.manifestSha256 !== expected.manifestSha256
    || liveTelemetry.gates?.webglAbCorePassed !== true
    || liveTelemetry.gates?.payloadImmutable !== true
  ) throw new Error("v593-verify-human-live-browser-ab-contract");
  verifySeal(userDecision, "decisionSha256", "human-user-decision");
  if (
    userDecision.version !== "v593-human-user-decision-v1"
    || userDecision.decision !== "approve-v593-six-of-six"
    || userDecision.approved !== true
    || userDecision.reviewer !== "workspace-owner"
    || sameCanonicalValue(Object.keys(userDecision.passes ?? {}), HUMAN_VISUAL_SIGNATURE_PASSES) !== true
  ) throw new Error("v593-verify-human-user-decision-contract");
  const decisionChallenge = {
    version: "v593-human-visual-signoff-decision-challenge-v1",
    candidate: {
      buildId: expected.buildId,
      deploymentId: expected.deploymentId,
      sourceManifestSha256: expected.sourceManifestSha256,
      manifestSha256: expected.manifestSha256,
      formalProductPointer: "v263",
    },
    stageReceiptSha256: sourceStage.receiptSha256,
    exactFrameIds: EXACT_AB_FRAME_MAP.map(([id]) => id),
    requiredPasses: HUMAN_VISUAL_SIGNATURE_PASSES,
  };
  if (receipt.decisionChallengeSha256 !== canonicalSha(decisionChallenge) || userDecision.challengeSha256 !== receipt.decisionChallengeSha256) throw new Error("v593-verify-human-user-decision-challenge");
}
function readRawReceipt(entry, label) {
  verifyFile(entry, label);
  const raw = readJson(entry.path);
  const unsigned = { ...raw };
  delete unsigned.receiptSha256;
  const insertionOrderSha = sha256(Buffer.from(JSON.stringify(unsigned), "utf8"));
  if (raw.receiptSha256 !== insertionOrderSha && raw.receiptSha256 !== canonicalSha(unsigned)) {
    throw new Error(`v593-verify-raw-receipt:${label}`);
  }
  return raw;
}
function verifyCurrentCandidate(candidate, expected, label) {
  if (
    candidate?.route !== "/local-shadow-v593"
    || candidate.buildId !== expected.buildId
    || typeof candidate.deploymentId !== "string"
    || candidate.deploymentId.length === 0
    || candidate.sourceManifestSha256 !== expected.sourceManifestSha256
    || candidate.manifestSha256 !== expected.manifestSha256
    || candidate.scientificPayloadSha256 !== manifest.authority.scientificPayloadSha256
  ) throw new Error(`v593-verify-current-identity:${label}`);
}
function verifyTrustedSameRealmProof(lifecycle, soakEvidence, expected) {
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
    || proof.workerOwnership?.targetCounts?.baseline !== proof.workerOwnership.targets.baseline.length
    || proof.workerOwnership?.targetCounts?.mounted !== proof.workerOwnership.targets.mounted.length
    || proof.workerOwnership?.targetCounts?.detached !== proof.workerOwnership.targets.detached.length
    || proof.workerOwnership?.targetCounts?.exited !== proof.workerOwnership.targets.exited.length
    || proof.listenerBaselineDelta?.returnedToBaseline !== true
    || !Number.isFinite(proof.listenerBaselineDelta?.baseline)
    || !Number.isFinite(proof.listenerBaselineDelta?.mounted)
    || !Number.isFinite(proof.listenerBaselineDelta?.detached)
    || !Number.isFinite(proof.listenerBaselineDelta?.exited)
    || !Number.isFinite(proof.listenerBaselineDelta?.detachedDelta)
    || !Number.isFinite(proof.listenerBaselineDelta?.exitedDelta)
    || proof.listenerBaselineDelta.detachedDelta > 0
    || proof.listenerBaselineDelta.exitedDelta > 0
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
    || !sameCanonicalValue(proof, soakEvidence.sameRealmSceneExit)
  ) throw new Error("v593-verify-same-realm-contract");
  const raw = readRawReceipt(proof.evidence, "same-realm");
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
    || !sameCanonicalValue(proof.workerOwnership.sceneCreatedTargetIds, raw.analysis?.sceneTargetIds)
    || !sameCanonicalValue(proof.workerOwnership.targets, raw.analysis?.workerTargets)
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
    || raw.sourceIdentityBefore?.expected?.scientificPayloadSha256 !== manifest.authority.scientificPayloadSha256
    || !sameCanonicalValue(raw.sourceIdentityBefore?.expected, raw.sourceIdentityAfter?.expected)
    || raw.sourceIdentityBefore?.formalProductPointer !== "v263"
    || raw.sourceIdentityAfter?.formalProductPointer !== "v263"
  ) throw new Error("v593-verify-same-realm-receipt");
  return proof;
}
function verifyTrustedCdpHeapProof(soakEvidence, expected) {
  const proof = soakEvidence.cdpHeapSoak;
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
    || !sameCanonicalValue(proof.memory, soakEvidence.memory)
  ) throw new Error("v593-verify-cdp-heap-contract");
  const raw = readRawReceipt(proof.evidence, "cdp-heap");
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
    || raw.expectedIdentity?.deploymentId !== soakEvidence.candidate.deploymentId
    || raw.expectedIdentity?.sourceManifestSha256 !== expected.sourceManifestSha256
    || raw.expectedIdentity?.candidateManifestSha256 !== expected.manifestSha256
    || raw.expectedIdentity?.scientificPayloadSha256 !== manifest.authority.scientificPayloadSha256
  ) throw new Error("v593-verify-cdp-heap-receipt");
  return proof;
}
function containsRetiredExitClaim(value) {
  const retiredKey = ["scene", "Exit", "Baseline"].join("");
  const retiredText = ["scene", "exit", "zero"].join("-");
  if (typeof value === "string") return value.includes(retiredText);
  if (Array.isArray(value)) return value.some(containsRetiredExitClaim);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, item]) => key === retiredKey || containsRetiredExitClaim(item));
}

const manifest = readJson("public/data/final-art-direction-v593/manifest.json");
const source = readJson("docs/release/v593/source-manifest-v593.json");
const freeze = readJson("docs/release/v593/freeze-before-v593.json");
const currentState = readJson("docs/release/v593/current-state-receipt-v593.json");
const capability = readJson("docs/release/v593/capability-report-v593.json");
const p1BrowserCodeGate = readJson("docs/release/v593/p1-browser-code-gate-v593.json");
const p2SunBrowserCodeGate = readJson("docs/release/v593/p2-sun-browser-code-gate-v593.json");
const p3EarthBrowserCodeGate = readJson("docs/release/v593/p3-earth-browser-code-gate-v593.json");
const p4DeepSkyBrowserCodeGate = readJson("docs/release/v593/p4-deep-sky-browser-code-gate-v593.json");
const p5SaturnCorrectiveBrowserCodeGate = readJson("docs/release/v593/p5-saturn-corrective-browser-code-gate-v593.json");
const finalBrowser = readJson("docs/release/v593/final-sealed-browser-matrix-v593.json");
const liteBrowser = readJson("docs/release/v593/lite-browser-matrix-v593.json");
const resourceLifecycle = readJson("docs/release/v593/resource-lifecycle-v593.json");
const soak = readJson("docs/release/v593/soak-v593.json");
const humanVisualSignoff = readJson("docs/release/v593/human-visual-signoff-v593.json");
const standaloneBuild = readJson("dist/release/atlas-v593-standalone-build-resource.json");
const liteBuild = readJson("dist/release/atlas-v593-lite-build-resource.json");
const pointer = readJson("dist/release/orbit-atlas-current-product-rc-candidate-v593.json");
const packIndex = readJson("dist/content-packs/v593/index.json");
const closurePath = resolve(root, "docs/release/v593/release-export-v593.json");
const closure = existsSync(closurePath) ? readJson("docs/release/v593/release-export-v593.json") : null;
if (!closure) throw new Error("v593-verify-closure-missing");
const baseline = readJson("public/data/living-universe-v592/manifest.json");
verifySeal(manifest, "manifestSha256", "manifest");
verifySeal(source, "receiptSha256", "source");
verifySeal(freeze, "snapshotSha256", "freeze");
verifySeal(currentState, "receiptSha256", "current-state");
verifySeal(capability, "reportSha256", "capability");
verifySeal(p1BrowserCodeGate, "receiptSha256", "p1-browser-code-gate");
verifySeal(p2SunBrowserCodeGate, "receiptSha256", "p2-sun-browser-code-gate");
verifySeal(p3EarthBrowserCodeGate, "receiptSha256", "p3-earth-browser-code-gate");
verifySeal(p4DeepSkyBrowserCodeGate, "receiptSha256", "p4-deep-sky-browser-code-gate");
verifySeal(p5SaturnCorrectiveBrowserCodeGate, "receiptSha256", "p5-saturn-corrective-browser-code-gate");
verifySeal(finalBrowser, "receiptSha256", "final-browser");
verifySeal(liteBrowser, "receiptSha256", "lite-browser");
verifySeal(resourceLifecycle, "receiptSha256", "resource-lifecycle");
verifySeal(soak, "receiptSha256", "soak");
verifySeal(humanVisualSignoff, "receiptSha256", "human-visual-signoff");
verifySeal(pointer, "pointerSha256", "pointer");
verifySeal(packIndex, "indexSha256", "content-pack-index");
verifySeal(baseline, "manifestSha256", "v592-baseline");
if (
  resourceLifecycle.version !== "v593-resource-lifecycle-v2"
  || soak.version !== "v593-soak-v2"
  || closure.version !== "v593-release-export-and-closure-dossier-v2"
) throw new Error("v593-verify-retired-formal-evidence-schema");
for (const [label, document] of Object.entries({ resourceLifecycle, soak, currentState, capability, closure })) {
  if (containsRetiredExitClaim(document)) throw new Error(`v593-verify-retired-exit-claim:${label}`);
}

for (const entry of source.files) verifyFile(entry, "source");
for (const entry of freeze.frozenSnapshot) verifyFile(entry, "frozen");
for (const capture of p1BrowserCodeGate.captures) {
  verifyFile(capture.baseline, `p1-${capture.id}-baseline`);
  verifyFile(capture.signature, `p1-${capture.id}-signature`);
  verifyFile(capture.baselineNativeCrop, `p1-${capture.id}-baseline-crop`);
  verifyFile(capture.signatureNativeCrop, `p1-${capture.id}-signature-crop`);
}
for (const [index, entry] of p1BrowserCodeGate.saturnAuditFrames.entries()) {
  verifyFile(entry, `p1-saturn-audit-${index}`);
}
for (const entry of [
  p2SunBrowserCodeGate.sourceMaterialCorrectness.overlay,
  ...p2SunBrowserCodeGate.sourceMaterialCorrectness.verifiedSourceVariants,
]) verifyFile(entry, "p2-sun-source");
for (const capture of p2SunBrowserCodeGate.captures) {
  verifyFile(capture.baseline, `p2-sun-${capture.id}-baseline`);
  verifyFile(capture.signature, `p2-sun-${capture.id}-signature`);
  verifyFile(capture.baselineNativeCrop, `p2-sun-${capture.id}-baseline-crop`);
  verifyFile(capture.signatureNativeCrop, `p2-sun-${capture.id}-signature-crop`);
}
for (const [index, entry] of p2SunBrowserCodeGate.detailCrops.entries()) {
  verifyFile(entry, `p2-sun-detail-${index}`);
}
for (const entry of [
  p3EarthBrowserCodeGate.sourceMaterialCorrectness.overlay,
  ...p3EarthBrowserCodeGate.sourceMaterialCorrectness.verifiedSourceVariants,
  p3EarthBrowserCodeGate.browser.telemetry,
  p3EarthBrowserCodeGate.browser.consoleReplay.evidence,
  p3EarthBrowserCodeGate.browser.resourceCycles.record,
]) verifyFile(entry, "p3-earth-source");
for (const capture of p3EarthBrowserCodeGate.captures) {
  verifyFile(capture.baseline, `p3-earth-${capture.id}-baseline`);
  verifyFile(capture.signature, `p3-earth-${capture.id}-signature`);
  verifyFile(capture.baselineNativeCrop, `p3-earth-${capture.id}-baseline-crop`);
  verifyFile(capture.signatureNativeCrop, `p3-earth-${capture.id}-signature-crop`);
}
for (const detail of p3EarthBrowserCodeGate.detailCrops) {
  verifyFile(detail.baseline.image, `p3-earth-${detail.id}-baseline`);
  verifyFile(detail.signature.image, `p3-earth-${detail.id}-signature`);
}
for (const entry of [
  p4DeepSkyBrowserCodeGate.sourceMaterialCorrectness.canvasHost,
  p4DeepSkyBrowserCodeGate.sourceMaterialCorrectness.builder,
  p4DeepSkyBrowserCodeGate.sourceMaterialCorrectness.p3HistoricalPreDeepSkyEvidence,
  p4DeepSkyBrowserCodeGate.browser.telemetry,
]) verifyHistoricalRecord(entry, "p4-deep-sky-historical-source");
for (const capture of p4DeepSkyBrowserCodeGate.captures) {
  verifyFile(capture.baseline, `p4-deep-sky-${capture.id}-baseline`);
  verifyFile(capture.signature, `p4-deep-sky-${capture.id}-signature`);
}
for (const detail of p4DeepSkyBrowserCodeGate.detailCrops) {
  verifyFile(detail.baseline.image, `p4-deep-sky-${detail.id}-baseline`);
  verifyFile(detail.signature.image, `p4-deep-sky-${detail.id}-signature`);
}
for (const entry of [
  p5SaturnCorrectiveBrowserCodeGate.sourceMaterialCorrectness.bridge,
  p5SaturnCorrectiveBrowserCodeGate.sourceMaterialCorrectness.shell,
  p5SaturnCorrectiveBrowserCodeGate.sourceMaterialCorrectness.focusedTest,
  p5SaturnCorrectiveBrowserCodeGate.sourceMaterialCorrectness.viewportHarness,
  p5SaturnCorrectiveBrowserCodeGate.sourceMaterialCorrectness.builder,
]) verifyHistoricalRecord(entry, "p5-saturn-historical-source");
for (const entry of [
  p5SaturnCorrectiveBrowserCodeGate.scope.p4HistoricalPreCorrectiveEvidence,
  p5SaturnCorrectiveBrowserCodeGate.browser.telemetry,
  p5SaturnCorrectiveBrowserCodeGate.mobileEvidence.baselineRawCapture,
  p5SaturnCorrectiveBrowserCodeGate.mobileEvidence.signatureRawCapture,
  p5SaturnCorrectiveBrowserCodeGate.mobileEvidence.baselineNormalizedPreview,
  p5SaturnCorrectiveBrowserCodeGate.mobileEvidence.signatureNormalizedPreview,
  p5SaturnCorrectiveBrowserCodeGate.rotation.before,
  p5SaturnCorrectiveBrowserCodeGate.rotation.after,
]) verifyHistoricalRecord(entry, "p5-saturn-historical-artifact");
for (const capture of p5SaturnCorrectiveBrowserCodeGate.captures) {
  verifyFile(capture.baseline, `p5-saturn-${capture.id}-baseline`);
  verifyFile(capture.signature, `p5-saturn-${capture.id}-signature`);
}
for (const detail of p5SaturnCorrectiveBrowserCodeGate.detailCrops) {
  verifyFile(detail.baseline, `p5-saturn-${detail.id}-baseline`);
  verifyFile(detail.signature, `p5-saturn-${detail.id}-signature`);
}
if (
  finalBrowser.version !== "v593-final-sealed-browser-matrix-receipt-v1"
  || finalBrowser.status !== "passed-sealed-standalone-42-frame-automatic-gates-human-signoff-pending"
  || finalBrowser.frames?.length !== 42
  || finalBrowser.candidate?.sourceManifestSha256 !== source.receiptSha256
  || finalBrowser.candidate?.manifestSha256 !== manifest.manifestSha256
  || finalBrowser.build?.buildId !== standaloneBuild.buildId
  || standaloneBuild.status !== "passed"
  || standaloneBuild.deliveryTier !== "standalone-full"
  || standaloneBuild.deploymentId !== `v593-${source.receiptSha256.slice(0, 12)}-${manifest.manifestSha256.slice(0, 12)}`
  || standaloneBuild.candidateSourceManifestSha256 !== source.receiptSha256
  || finalBrowser.aggregate?.scientificPayloadUniqueCount !== 1
  || finalBrowser.aggregate?.consolePageWebglErrorWarningCount !== 0
  || finalBrowser.aggregate?.singleCanvas !== true
  || finalBrowser.authority?.scientificPayloadWriteback !== false
  || finalBrowser.humanVisualSignoff !== false
) throw new Error("v593-verify-final-browser-contract");
verifyFile(finalBrowser.build.receipt, "final-browser-build-receipt");
verifyFile(finalBrowser.evidence, "final-browser-stage-batch");
for (const frame of finalBrowser.frames) verifyFile(frame.image, `final-browser-${frame.matrixId}`);
if (
  liteBrowser.version !== "v593-lite-browser-matrix-v1"
  || liteBrowser.status !== "passed-8-frame-lite-automatic-gates-human-signoff-pending"
  || liteBrowser.frames?.length !== 8
  || liteBrowser.build?.sourceManifestSha256 !== source.receiptSha256
  || liteBrowser.build?.manifestSha256 !== manifest.manifestSha256
  || liteBrowser.build?.buildId !== liteBuild.buildId
  || liteBuild.status !== "passed"
  || liteBuild.deliveryTier !== "vercel-lite"
  || liteBuild.deploymentId !== `v593-${source.receiptSha256.slice(0, 12)}-${manifest.manifestSha256.slice(0, 12)}`
  || liteBuild.candidateSourceManifestSha256 !== source.receiptSha256
  || liteBrowser.aggregate?.scientificPayloadUniqueCount !== 1
  || liteBrowser.aggregate?.singleCanvas !== true
  || liteBrowser.console?.count !== 0
  || liteBrowser.authority?.scientificPayloadWriteback !== false
) throw new Error("v593-verify-lite-browser-contract");
verifyFile(liteBrowser.evidence, "lite-browser-stage-batch");
for (const frame of liteBrowser.frames) verifyFile(frame.image, `lite-browser-${frame.id}`);
const finalBrowserStage = readJson(finalBrowser.evidence.path);
const liteBrowserStage = readJson(liteBrowser.evidence.path);
if (
  finalBrowserStage.version !== "v593-full-matrix-browser-stage-v2"
  || finalBrowserStage.status !== "staging-full-matrix-audit-passed-not-promoted"
  || finalBrowserStage.identity?.buildId !== standaloneBuild.buildId
  || finalBrowserStage.identity?.deploymentId !== `v593-${source.receiptSha256.slice(0, 12)}-${manifest.manifestSha256.slice(0, 12)}`
  || finalBrowserStage.identity?.sourceManifestSha256 !== source.receiptSha256
  || finalBrowserStage.identity?.candidateManifestSha256 !== manifest.manifestSha256
  || finalBrowserStage.identity?.scientificPayloadSha256 !== manifest.authority.scientificPayloadSha256
  || finalBrowserStage.frames?.length !== 42
  || finalBrowserStage.failures?.some((failure) => !failure.resolution)
  || finalBrowserStage.console?.count !== 0
  || finalBrowserStage.fullMatrixAudit?.status !== "passed-staging-integrity-not-promoted"
  || finalBrowserStage.fullMatrixAudit?.errors?.length !== 0
  || liteBrowserStage.version !== "v593-lite-browser-stage-v2"
  || liteBrowserStage.status !== "staging-lite-matrix-audit-passed-not-promoted"
  || liteBrowserStage.identity?.buildId !== liteBuild.buildId
  || liteBrowserStage.identity?.deploymentId !== `v593-${source.receiptSha256.slice(0, 12)}-${manifest.manifestSha256.slice(0, 12)}`
  || liteBrowserStage.identity?.sourceManifestSha256 !== source.receiptSha256
  || liteBrowserStage.identity?.candidateManifestSha256 !== manifest.manifestSha256
  || liteBrowserStage.identity?.scientificPayloadSha256 !== manifest.authority.scientificPayloadSha256
  || liteBrowserStage.frames?.length !== 8
  || liteBrowserStage.failures?.length !== 0
  || liteBrowserStage.console?.count !== 0
  || liteBrowserStage.liteMatrixAudit?.status !== "passed-staging-integrity-not-promoted"
  || liteBrowserStage.liteMatrixAudit?.errors?.length !== 0
) throw new Error("v593-verify-browser-stage-batches");
const expectedCurrentIdentity = Object.freeze({
  buildId: standaloneBuild.buildId,
  deploymentId: `v593-${source.receiptSha256.slice(0, 12)}-${manifest.manifestSha256.slice(0, 12)}`,
  sourceManifestSha256: source.receiptSha256,
  manifestSha256: manifest.manifestSha256,
});
if (standaloneBuild.buildId !== liteBuild.buildId) throw new Error("v593-verify-shared-build-id");
if (finalBrowser.candidate?.deploymentId !== expectedCurrentIdentity.deploymentId || liteBrowser.build?.deploymentId !== expectedCurrentIdentity.deploymentId) throw new Error("v593-verify-deployment-identity");
verifyHumanVisualSignoff(humanVisualSignoff, {
  ...expectedCurrentIdentity,
  scientificPayloadSha256: manifest.authority.scientificPayloadSha256,
});
verifyCurrentCandidate(resourceLifecycle.candidate, expectedCurrentIdentity, "resource-lifecycle");
verifyCurrentCandidate(soak.candidate, expectedCurrentIdentity, "soak");
if (resourceLifecycle.candidate.deploymentId !== soak.candidate.deploymentId) {
  throw new Error("v593-verify-deployment-identity");
}
const sameRealmSceneExit = verifyTrustedSameRealmProof(resourceLifecycle, soak, expectedCurrentIdentity);
const cdpHeapSoak = verifyTrustedCdpHeapProof(soak, expectedCurrentIdentity);
if (
  resourceLifecycle.version !== "v593-resource-lifecycle-v2"
  || resourceLifecycle.status !== "passed-current-identity-16-hero-mount-cycles-and-same-realm-scene-exit"
  || resourceLifecycle.mountCycles?.status !== "passed-current-identity-16-hero-32-mount-cycles"
  || resourceLifecycle.mountCycles?.heroCount !== 16
  || resourceLifecycle.mountCycles?.admittedCount !== 16
  || resourceLifecycle.mountCycles?.blockedCount !== 0
  || resourceLifecycle.mountCycles?.admittedMountCycleCount !== 32
  || resourceLifecycle.mountCycles?.sustainedGrowth !== false
  || resourceLifecycle.console?.count !== 0
  || resourceLifecycle.authority?.scientificPayloadWriteback !== false
  || resourceLifecycle.authority?.scientificAuthorityChanged !== false
  || resourceLifecycle.authority?.measuredAuthorityGranted !== false
  || resourceLifecycle.authority?.gpuAuthorityGranted !== false
  || resourceLifecycle.authority?.productionReleaseAuthorized !== false
) throw new Error("v593-verify-resource-lifecycle-contract");
verifyFile(resourceLifecycle.mountCycles.evidence, "resource-lifecycle-mount-cycles");
if (
  soak.version !== "v593-soak-v2"
  || soak.status !== "passed-current-identity-cdp-heap-soak-and-same-realm-scene-exit"
  || cdpHeapSoak.durationSeconds < 1800
  || cdpHeapSoak.sampleCount < 181
  || cdpHeapSoak.memory?.sampleSpanMilliseconds < 1_800_000
  || soak.aggregate?.rendererResourceGrowth !== false
  || soak.aggregate?.rendererResourceBaselineStable !== true
  || soak.aggregate?.canvasCountStable !== true
  || soak.aggregate?.payloadUniqueCount !== 1
  || soak.aggregate?.scientificWritebackCount !== 0
  || cdpHeapSoak.renderer?.fingerprintCount !== 1
  || soak.memory?.status !== "passed-authoritative-cdp-heap-soak"
  || soak.memory?.measurementAuthority !== "HeapProfiler.collectGarbage-before-Runtime.getHeapUsage"
  || soak.memory?.jsHeapTelemetry !== "available-chromium-cdp-runtime-getHeapUsage"
  || soak.memory?.sampleCount !== cdpHeapSoak.sampleCount
  || soak.memory?.sampleSpanMilliseconds !== cdpHeapSoak.memory?.sampleSpanMilliseconds
  || soak.memory?.sustainedJsHeapGrowth !== false
  || soak.memory?.finalHeapWithinAllowance !== true
  || soak.memory?.lastTenOlsWithinLimit !== true
  || soak.memory?.requiredForClosure !== true
  || soak.memory?.noSyntheticSubstitution !== true
  || soak.durationSeconds !== cdpHeapSoak.durationSeconds
  || soak.sampleCount !== cdpHeapSoak.sampleCount
  || !sameCanonicalValue(soak.console, cdpHeapSoak.console)
  || soak.authority?.scientificPayloadWriteback !== false
  || soak.authority?.scientificAuthorityChanged !== false
  || soak.authority?.measuredAuthorityGranted !== false
  || soak.authority?.gpuAuthorityGranted !== false
  || soak.authority?.productionReleaseAuthorized !== false
) throw new Error("v593-verify-soak-contract");
for (const packReference of packIndex.packs) {
  const pack = readJson(packReference.path);
  verifySeal(pack, "manifestSha256", pack.id);
  if (pack.manifestSha256 !== packReference.manifestSha256) throw new Error(`v593-verify-pack-reference:${pack.id}`);
  if (pack.installedBytes !== pack.files.reduce((sum, file) => sum + file.bytes, 0)) throw new Error(`v593-verify-pack-size:${pack.id}`);
  for (const entry of pack.files) {
    verifyFile({
      ...entry,
      path: `dist/content-packs/v593/files/${pack.id}/${entry.path}`,
    }, pack.id);
  }
}

if (closure) {
  verifySeal(closure, "dossierSha256", "release-export-closure");
  if (
    closure.version !== "v593-release-export-and-closure-dossier-v2"
    || closure.candidate?.route !== "/local-shadow-v593"
    || closure.candidate?.formalProductPointer !== "v263"
    || closure.candidate?.manifestSha256 !== manifest.manifestSha256
    || closure.candidate?.sourceManifestSha256 !== source.receiptSha256
    || closure.standaloneBrowser?.receiptSha256 !== finalBrowser.receiptSha256
    || closure.liteBrowser?.receiptSha256 !== liteBrowser.receiptSha256
    || closure.resourceLifecycle?.receiptSha256 !== resourceLifecycle.receiptSha256
    || closure.soak?.receiptSha256 !== soak.receiptSha256
    || closure.humanReview?.identityMatches !== true
    || closure.humanReview?.receiptSha256 !== humanVisualSignoff.receiptSha256
    || closure.status !== "passed-current-identity-export-matrices-mount-lifecycle-same-realm-and-cdp-heap-human-signoff-approved"
    || closure.humanVisualSignoff !== true
    || closure.authority?.scientificPayloadWriteback !== false
    || closure.authority?.measuredAuthorityGranted !== false
    || closure.authority?.gpuAuthorityGranted !== false
    || closure.gates?.rendererSoakPassed !== true
    || closure.gates?.sameRealmSceneExitPassed !== true
    || closure.gates?.sameRealmSceneExitReceiptSha256 !== sameRealmSceneExit.receiptSha256
    || closure.gates?.cdpHeapSoakPassed !== true
    || closure.gates?.cdpHeapSoakReceiptSha256 !== cdpHeapSoak.receiptSha256
    || !["passed", "blocked-budget"].includes(closure.gates?.standaloneExportBudget)
    || !["passed", "blocked-budget"].includes(closure.gates?.liteExportBudget)
    || closure.gates?.jsHeapGate !== "passed"
  ) throw new Error("v593-verify-closure-contract");
  for (const exportEntry of [closure.exports?.standalone, closure.exports?.lite]) {
    if (!exportEntry?.root || !Array.isArray(exportEntry.files)) throw new Error("v593-verify-closure-export-shape");
    const actualBytes = exportEntry.files.reduce((sum, file) => sum + file.bytes, 0);
    if (actualBytes !== exportEntry.installedBytes) throw new Error(`v593-verify-closure-bytes:${exportEntry.tier}`);
    for (const file of exportEntry.files) verifyFile({ ...file, path: `${exportEntry.root}/${file.path}` }, `closure-${exportEntry.tier}`);
  }
  if (closure.exports.lite.runtimeModel !== "vercel-next-server-static-platform-runtime"
    || closure.exports.lite.excludedStandaloneTrace?.countedInBudget !== false
    || closure.exports.lite.budgetPassed !== true
    || closure.exports.standalone.budgetPassed !== true) throw new Error("v593-verify-closure-budget");
}
for (const [label, document] of Object.entries({
  resourceLifecycle,
  soak,
  currentState,
  capability,
  closure,
})) {
  if (containsRetiredExitClaim(document)) throw new Error(`v593-verify-retired-exit-claim:${label}`);
}
if (
  currentState.status !== "qualified-additive-v593-visual-candidate"
  || currentState.phase !== "qualified-additive-v593-visual-candidate"
  || currentState.progress?.signatureArtPasses !== "implemented-code-6/6;complete-6/6-human-signed"
  || currentState.progress?.goldenVisualMatrix !== "passed-current-source-42/42-human-signoff-approved"
  || currentState.progress?.humanVisualSignoff !== "approved-6/6"
  || currentState.progress?.resourceLifecycle !== "passed-current-source-16/16-same-realm-scene-exit"
  || currentState.progress?.soak30Minutes !== "renderer-passed;js-heap-passed"
  || !String(currentState.progress?.releaseDossier).startsWith("current-source;passed-current-identity-")
  || capability.status !== "qualified-additive-v593-visual-candidate"
  || capability.capabilities?.currentAutomaticEvidence?.mountLifecycle16Heroes32Cycles !== true
  || capability.capabilities?.currentAutomaticEvidence?.sameRealmSceneExit !== true
  || capability.capabilities?.currentAutomaticEvidence?.resourceLifecycle !== true
  || capability.capabilities?.currentAutomaticEvidence?.cdpHeapSoak !== true
  || capability.capabilities?.currentAutomaticEvidence?.rendererSoak30Minutes !== true
  || capability.capabilities?.currentAutomaticEvidence?.jsHeapGate !== "passed"
  || capability.capabilities?.currentAutomaticEvidence?.releaseDossier !== true
  || capability.capabilities?.currentAutomaticEvidence?.humanVisualSignoff !== true
  || capability.blockedGates?.signatureArtPasses !== "passed:6/6-human-signed"
  || capability.blockedGates?.goldenVisualMatrix !== "passed-current-source-42/42-human-signoff-approved"
  || capability.blockedGates?.resourceLifecycle !== "passed-current-source-16/16-same-realm-scene-exit"
  || capability.blockedGates?.cdpHeapSoak !== "passed-current-source-cdp-heap"
  || capability.evidence?.sameRealmSceneExitReceiptSha256 !== sameRealmSceneExit.receiptSha256
  || capability.evidence?.cdpHeapSoakReceiptSha256 !== cdpHeapSoak.receiptSha256
  || capability.evidence?.humanVisualSignoffReceiptSha256 !== humanVisualSignoff.receiptSha256
) throw new Error("v593-verify-current-formal-evidence-state");
for (const key of [
  "jupiterSeamSafeMaterialBridge",
  "jupiterDeterministicGrsFrame",
  "stellarArchetypeMaterialBridge",
  "saturnOpticalDepthMaterialBridge",
  "saturnBidirectionalShadowBridge",
  "solarPhotosphereMaterialBridge",
  "solarChromosphereMaterialBridge",
  "solarDifferentialRotationBridge",
  "earthSurfaceOceanNightMaterialBridge",
  "earthDualCloudShadowMaterialBridge",
  "earthAtmosphericLimbMaterialBridge",
  "deepSkySphereMaterialBridge",
  "deepSkyGaiaPsfMaterialBridge",
  "deepSkyNebulaObservationMaterialBridge",
]) {
  if (capability.capabilities?.[key] !== "qualified-current-source-human-signed") {
    throw new Error(`v593-verify-qualified-signature-bridge:${key}`);
  }
}

const page = read("app/local-shadow-v593/page.tsx");
const lazy = read("app/components/OrbitAtlasFinalArtDirectionV593Lazy.tsx");
const entry = read("app/components/OrbitAtlasFinalArtDirectionV593.tsx");
const observatory = read("app/components/FinalArtObservatoryShellV593.tsx");
const canvasHost = read("app/components/FinalArtCanvasHostV593.tsx");
const stage = read("app/components/FinalArtStageV593.tsx");
const bridge = read("app/components/SignatureArtDirectionBridgeV593.tsx");
const config = read("vitest.config.mts");
const signatureStatuses = Object.fromEntries(manifest.artDirection.signaturePasses.map((pass) => [pass.id, pass.status]));
if (
  manifest.version !== "v593-final-art-direction-product-rc-candidate-v1"
  || manifest.status !== "implemented-six-signature-bridges-current-source-revalidation-pending"
  || manifest.route !== "/local-shadow-v593"
  || manifest.formalProductPointer !== "v263"
  || manifest.baseline.manifestSha256 !== baseline.manifestSha256
  || manifest.governance.frozenDriftCount !== 0
  || manifest.governance.sourceManifestSha256 !== source.receiptSha256
  || manifest.contentDelivery.indexSha256 !== packIndex.indexSha256
  || manifest.contentDelivery.budget.liteShell.status !== "passed"
  || manifest.contentDelivery.budget.observatoryDefault.status !== "passed"
  || manifest.artDirection.signaturePasses.length !== 6
  || signatureStatuses.sun !== "implemented-code-gates-pending"
  || signatureStatuses.earth !== "implemented-code-gates-pending"
  || signatureStatuses.jupiter !== "implemented-code-gates-pending"
  || signatureStatuses.saturn !== "implemented-code-gates-pending"
  || signatureStatuses["stellar-archetypes"] !== "implemented-code-gates-pending"
  || signatureStatuses["deep-sky"] !== "implemented-code-gates-pending"
  || manifest.artDirection.goldenFrameCount !== 42
  || manifest.artDirection.humanVisualSignoff !== "not-requested"
  || manifest.artDirection.p1BrowserCodeGate?.path !== "docs/release/v593/p1-browser-code-gate-v593.json"
  || manifest.artDirection.p1BrowserCodeGate?.receiptSha256 !== p1BrowserCodeGate.receiptSha256
  || manifest.artDirection.p1BrowserCodeGate?.signaturePassesCodeImplemented !== 3
  || manifest.artDirection.p1BrowserCodeGate?.signaturePassesComplete !== 0
  || manifest.artDirection.p1BrowserCodeGate?.evidenceScope !== "historical-pre-sun-current-dev-code-gates-only-not-current-source-not-sealed-build-not-human-signoff"
  || manifest.artDirection.p2SunBrowserCodeGate?.path !== "docs/release/v593/p2-sun-browser-code-gate-v593.json"
  || manifest.artDirection.p2SunBrowserCodeGate?.receiptSha256 !== p2SunBrowserCodeGate.receiptSha256
  || manifest.artDirection.p2SunBrowserCodeGate?.signaturePassesCodeImplemented !== 4
  || manifest.artDirection.p2SunBrowserCodeGate?.signaturePassesComplete !== 0
  || manifest.artDirection.p3EarthBrowserCodeGate?.path !== "docs/release/v593/p3-earth-browser-code-gate-v593.json"
  || manifest.artDirection.p3EarthBrowserCodeGate?.receiptSha256 !== p3EarthBrowserCodeGate.receiptSha256
  || manifest.artDirection.p3EarthBrowserCodeGate?.signaturePassesCodeImplemented !== 5
  || manifest.artDirection.p3EarthBrowserCodeGate?.signaturePassesComplete !== 0
  || manifest.artDirection.p3EarthBrowserCodeGate?.evidenceScope !== "historical-pre-deep-sky-current-dev-earth-code-and-visual-gates-not-current-source-not-sealed-build-not-human-signoff"
  || manifest.artDirection.p4DeepSkyBrowserCodeGate?.path !== "docs/release/v593/p4-deep-sky-browser-code-gate-v593.json"
  || manifest.artDirection.p4DeepSkyBrowserCodeGate?.receiptSha256 !== p4DeepSkyBrowserCodeGate.receiptSha256
  || manifest.artDirection.p4DeepSkyBrowserCodeGate?.signaturePassesCodeImplemented !== 6
  || manifest.artDirection.p4DeepSkyBrowserCodeGate?.signaturePassesComplete !== 0
  || manifest.artDirection.p4DeepSkyBrowserCodeGate?.evidenceScope !== "historical-pre-saturn-corrective-current-dev-deep-sky-code-and-visual-gates-not-current-source-not-sealed-build-not-human-signoff"
  || manifest.artDirection.p5SaturnCorrectiveBrowserCodeGate?.path !== "docs/release/v593/p5-saturn-corrective-browser-code-gate-v593.json"
  || manifest.artDirection.p5SaturnCorrectiveBrowserCodeGate?.receiptSha256 !== p5SaturnCorrectiveBrowserCodeGate.receiptSha256
  || manifest.artDirection.p5SaturnCorrectiveBrowserCodeGate?.status !== "historical-receipt-verified-current-source-revalidation-pending"
  || manifest.artDirection.p5SaturnCorrectiveBrowserCodeGate?.historicalReceiptStatus !== p5SaturnCorrectiveBrowserCodeGate.status
  || manifest.artDirection.p5SaturnCorrectiveBrowserCodeGate?.signaturePassesCodeImplemented !== 6
  || manifest.artDirection.p5SaturnCorrectiveBrowserCodeGate?.signaturePassesComplete !== 0
  || manifest.artDirection.p5SaturnCorrectiveBrowserCodeGate?.evidenceScope !== "historical-pre-shared-bridge-update-saturn-corrective-code-visual-mobile-resource-and-rotation-gates-not-current-source-not-sealed-build-not-human-signoff"
  || manifest.artDirection.p5SaturnCorrectiveBrowserCodeGate?.currentSourceBound !== false
  || manifest.artDirection.p5SaturnCorrectiveBrowserCodeGate?.currentSourceRevalidationEvidence !== "docs/release/v593/final-sealed-browser-matrix-v593.json"
  || p1BrowserCodeGate.version !== "v593-p1-browser-code-gate-v1"
  || p1BrowserCodeGate.status !== "passed-current-dev-code-gates-sealed-build-and-human-signoff-pending"
  || p1BrowserCodeGate.scope?.signaturePassesCodeImplemented !== 3
  || p1BrowserCodeGate.scope?.signaturePassesComplete !== 0
  || p1BrowserCodeGate.scope?.sealedBuildEvidence !== false
  || p1BrowserCodeGate.scope?.humanVisualSignoff !== false
  || p1BrowserCodeGate.captures?.length !== 7
  || p1BrowserCodeGate.captures.some((capture) => capture.scientificPayloadSha256 !== manifest.authority.scientificPayloadSha256
    || capture.scientificPayloadWriteback !== false
    || capture.signatureTelemetry?.webglOutputChanged !== true
    || capture.comparison?.changedChannelFractionGt2 <= 0.001)
  || p1BrowserCodeGate.saturnAuditFrames?.length !== 2
  || p1BrowserCodeGate.jupiterSeamAudit?.reductionFraction < 0.75
  || p1BrowserCodeGate.browser?.singleCanvas !== true
  || p1BrowserCodeGate.browser?.consolePageWebglErrorCount !== 0
  || p1BrowserCodeGate.browser?.scientificPayloadUniqueCount !== 1
  || p1BrowserCodeGate.browser?.scientificPayloadWriteback !== false
  || p1BrowserCodeGate.browser?.performance?.length !== 6
  || p1BrowserCodeGate.browser.performance.some((item) => item.medianFps < 45 || item.gpuBytes > 512 * 1024 * 1024 || item.drawCalls > 60)
  || p1BrowserCodeGate.browser?.resourceCycles?.sustainedGrowth !== false
  || p1BrowserCodeGate.browser?.resourceCycles?.finalBaseline?.patchCount !== 0
  || p1BrowserCodeGate.browser?.resourceCycles?.finalBaseline?.signatureMaterialCount !== 0
  || p1BrowserCodeGate.browser?.rotation?.w0BlockedDisclosed?.join("|") !== "bennu|kleopatra"
  || p1BrowserCodeGate.browser?.rotation?.presentationAccelerationWriteback !== false
  || p2SunBrowserCodeGate.version !== "v593-p2-sun-browser-code-gate-v1"
  || p2SunBrowserCodeGate.status !== "passed-current-dev-sun-code-gate-sealed-build-and-human-signoff-pending"
  || p2SunBrowserCodeGate.scope?.signaturePassesCodeImplemented !== 4
  || p2SunBrowserCodeGate.scope?.signaturePassesComplete !== 0
  || p2SunBrowserCodeGate.scope?.implemented?.join("|") !== "sun|jupiter|saturn|stellar-archetypes"
  || p2SunBrowserCodeGate.scope?.pending?.join("|") !== "earth|deep-sky"
  || p2SunBrowserCodeGate.scope?.sealedBuildEvidence !== false
  || p2SunBrowserCodeGate.scope?.humanVisualSignoff !== false
  || p2SunBrowserCodeGate.captures?.length !== 2
  || p2SunBrowserCodeGate.captures.some((capture) => capture.scientificPayloadSha256 !== manifest.authority.scientificPayloadSha256
    || capture.scientificPayloadWriteback !== false
    || capture.signatureTelemetry?.materialPatchCount !== 2
    || capture.signatureTelemetry?.webglOutputChanged !== true
    || capture.comparison?.changedChannelFractionGt2 <= 0.001
    || capture.signatureDiskMetrics?.centerToLimbRatio <= capture.baselineDiskMetrics?.centerToLimbRatio)
  || p2SunBrowserCodeGate.detailCrops?.length !== 4
  || p2SunBrowserCodeGate.browser?.singleCanvas !== true
  || p2SunBrowserCodeGate.browser?.consolePageWebglErrorCount !== 0
  || p2SunBrowserCodeGate.browser?.scientificPayloadUniqueCount !== 1
  || p2SunBrowserCodeGate.browser?.scientificPayloadWriteback !== false
  || p2SunBrowserCodeGate.browser?.performance?.length !== 2
  || p2SunBrowserCodeGate.browser.performance.some((item) => item.medianFps < 45 || item.gpuBytes > 512 * 1024 * 1024 || item.drawCalls > 60)
  || p2SunBrowserCodeGate.browser?.resourceCycles?.sustainedGrowth !== false
  || p2SunBrowserCodeGate.browser?.resourceCycles?.finalBaseline?.patchCount !== 0
  || p2SunBrowserCodeGate.browser?.rotation?.body !== "sun"
  || p2SunBrowserCodeGate.browser?.rotation?.differentialRotation !== "active-presentation-physics-model-one-material"
  || p2SunBrowserCodeGate.browser?.rotation?.w0BlockedDisclosed?.join("|") !== "bennu|kleopatra"
  || p2SunBrowserCodeGate.browser?.rotation?.presentationAccelerationWriteback !== false
  || p3EarthBrowserCodeGate.version !== "v593-p3-earth-browser-code-gate-v1"
  || p3EarthBrowserCodeGate.status !== "passed-current-dev-earth-code-and-visual-gates-console-replay-blocked-sealed-build-and-human-signoff-pending"
  || p3EarthBrowserCodeGate.scope?.signaturePassesCodeImplemented !== 5
  || p3EarthBrowserCodeGate.scope?.signaturePassesComplete !== 0
  || p3EarthBrowserCodeGate.scope?.implemented?.join("|") !== "sun|earth|jupiter|saturn|stellar-archetypes"
  || p3EarthBrowserCodeGate.scope?.pending?.join("|") !== "deep-sky"
  || p3EarthBrowserCodeGate.scope?.sealedBuildEvidence !== false
  || p3EarthBrowserCodeGate.scope?.humanVisualSignoff !== false
  || p3EarthBrowserCodeGate.captures?.length !== 5
  || p3EarthBrowserCodeGate.captures.some((capture) => capture.scientificPayloadSha256 !== manifest.authority.scientificPayloadSha256
    || capture.scientificPayloadWriteback !== false
    || capture.baselineTelemetry?.patches !== 0
    || capture.signatureTelemetry?.patches !== 4
    || capture.signatureTelemetry?.surfacePatches !== 1
    || capture.signatureTelemetry?.cloudPatches !== 2
    || capture.signatureTelemetry?.atmospherePatches !== 1
    || capture.signatureTelemetry?.webglChanged !== "true"
    || capture.comparison?.changedChannelFractionGt2 <= 0.001)
  || p3EarthBrowserCodeGate.detailCrops?.length !== 4
  || p3EarthBrowserCodeGate.seamInspection?.seamFacingCamera !== true
  || p3EarthBrowserCodeGate.seamInspection?.gradientReductionFraction < 0.10
  || p3EarthBrowserCodeGate.browser?.singleCanvas !== true
  || p3EarthBrowserCodeGate.browser?.scientificPayloadUniqueCount !== 1
  || p3EarthBrowserCodeGate.browser?.scientificPayloadWriteback !== false
  || p3EarthBrowserCodeGate.browser?.minimumMedianFps < 45
  || p3EarthBrowserCodeGate.browser?.maximumGpuBytes > 512 * 1024 * 1024
  || p3EarthBrowserCodeGate.browser?.maximumDrawCalls > 60
  || p3EarthBrowserCodeGate.browser?.consoleReplay?.status !== "blocked-browser-url-policy"
  || p3EarthBrowserCodeGate.browser?.consoleReplay?.finalSealedBuildConsoleGatePassed !== false
  || p3EarthBrowserCodeGate.browser?.resourceCycles?.sustainedGrowth !== false
  || p3EarthBrowserCodeGate.browser?.resourceCycles?.finalBaseline?.patchCount !== 0
  || p3EarthBrowserCodeGate.browser?.resourceCycles?.finalBaseline?.signatureMaterialCount !== 0
  || p4DeepSkyBrowserCodeGate.version !== "v593-p4-deep-sky-browser-code-gate-v1"
  || p4DeepSkyBrowserCodeGate.status !== "passed-current-dev-deep-sky-code-and-visual-gates-sealed-build-and-human-signoff-pending"
  || p4DeepSkyBrowserCodeGate.scope?.signaturePassesCodeImplemented !== 6
  || p4DeepSkyBrowserCodeGate.scope?.signaturePassesComplete !== 0
  || p4DeepSkyBrowserCodeGate.scope?.implemented?.join("|") !== "sun|earth|jupiter|saturn|stellar-archetypes|deep-sky"
  || p4DeepSkyBrowserCodeGate.scope?.pending?.length !== 0
  || p4DeepSkyBrowserCodeGate.scope?.sealedBuildEvidence !== false
  || p4DeepSkyBrowserCodeGate.scope?.humanVisualSignoff !== false
  || p4DeepSkyBrowserCodeGate.captures?.length !== 6
  || p4DeepSkyBrowserCodeGate.captures.some((capture) => capture.baselineTelemetry?.patchCount !== 0
    || capture.baselineTelemetry?.webglChanged !== "false"
    || capture.signatureTelemetry?.deepSky !== "implemented-code-gates-pending"
    || capture.signatureTelemetry?.webglChanged !== "true"
    || capture.signatureTelemetry?.payload !== manifest.authority.scientificPayloadSha256
    || capture.signatureTelemetry?.payloadStable !== "true"
    || capture.signatureTelemetry?.writeback !== "false"
    || capture.comparison?.changedChannelFractionGt2 <= 0.0001)
  || p4DeepSkyBrowserCodeGate.detailCrops?.length !== 5
  || p4DeepSkyBrowserCodeGate.planeEdgeInspection?.reductionFraction < 0.25
  || p4DeepSkyBrowserCodeGate.browser?.consoleWarningErrorCount !== 0
  || p4DeepSkyBrowserCodeGate.browser?.singleCanvas !== true
  || p4DeepSkyBrowserCodeGate.browser?.scientificPayloadUniqueCount !== 1
  || p4DeepSkyBrowserCodeGate.browser?.scientificPayloadWriteback !== false
  || p4DeepSkyBrowserCodeGate.browser?.minimumMedianFps < 45
  || p4DeepSkyBrowserCodeGate.browser?.maximumGpuBytes > 512 * 1024 * 1024
  || p4DeepSkyBrowserCodeGate.browser?.maximumDrawCalls > 90
  || p5SaturnCorrectiveBrowserCodeGate.version !== "v593-p5-saturn-corrective-browser-code-gate-v1"
  || p5SaturnCorrectiveBrowserCodeGate.status !== "passed-current-dev-saturn-corrective-code-and-visual-gates-sealed-build-and-human-signoff-pending"
  || p5SaturnCorrectiveBrowserCodeGate.scope?.currentSourceOwner !== true
  || p5SaturnCorrectiveBrowserCodeGate.scope?.signaturePassesCodeImplemented !== 6
  || p5SaturnCorrectiveBrowserCodeGate.scope?.signaturePassesComplete !== 0
  || p5SaturnCorrectiveBrowserCodeGate.scope?.sealedBuildEvidence !== false
  || p5SaturnCorrectiveBrowserCodeGate.scope?.humanVisualSignoff !== false
  || p5SaturnCorrectiveBrowserCodeGate.captures?.length !== 3
  || p5SaturnCorrectiveBrowserCodeGate.captures.some((capture) => capture.baselineTelemetry?.patchCount !== 0
    || capture.baselineTelemetry?.webglChanged !== "false"
    || capture.signatureTelemetry?.patchCount !== 2
    || capture.signatureTelemetry?.surfacePatchCount !== 1
    || capture.signatureTelemetry?.ringPatchCount !== 1
    || capture.signatureTelemetry?.webglChanged !== "true"
    || capture.signatureTelemetry?.payload !== manifest.authority.scientificPayloadSha256
    || capture.signatureTelemetry?.payloadStable !== "true"
    || capture.signatureTelemetry?.writeback !== "false"
    || capture.comparison?.changedChannelFractionGt2 <= 0.0001)
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
  || p5SaturnCorrectiveBrowserCodeGate.browser?.scientificPayloadUniqueCount !== 1
  || p5SaturnCorrectiveBrowserCodeGate.browser?.scientificPayloadWriteback !== false
  || p5SaturnCorrectiveBrowserCodeGate.browser?.minimumMedianFps < 45
  || p5SaturnCorrectiveBrowserCodeGate.browser?.maximumGpuBytes > 512 * 1024 * 1024
  || p5SaturnCorrectiveBrowserCodeGate.browser?.maximumDrawCalls > 60
  || capability.capabilities?.p1BrowserCodeGate?.receiptSha256 !== p1BrowserCodeGate.receiptSha256
  || capability.capabilities?.p1BrowserCodeGate?.currentSourceBound !== false
  || capability.capabilities?.p1BrowserCodeGate?.sealedBuildEvidence !== false
  || capability.capabilities?.p1BrowserCodeGate?.humanVisualSignoff !== false
  || capability.evidence?.p1BrowserCodeGateReceiptSha256 !== p1BrowserCodeGate.receiptSha256
  || capability.capabilities?.p2SunBrowserCodeGate?.receiptSha256 !== p2SunBrowserCodeGate.receiptSha256
  || capability.capabilities?.p2SunBrowserCodeGate?.sealedBuildEvidence !== false
  || capability.capabilities?.p2SunBrowserCodeGate?.humanVisualSignoff !== false
  || capability.evidence?.p2SunBrowserCodeGateReceiptSha256 !== p2SunBrowserCodeGate.receiptSha256
  || capability.capabilities?.p3EarthBrowserCodeGate?.receiptSha256 !== p3EarthBrowserCodeGate.receiptSha256
  || capability.capabilities?.p3EarthBrowserCodeGate?.currentSourceBound !== false
  || capability.capabilities?.p3EarthBrowserCodeGate?.supersededForCurrentSourceBy !== "p4-deep-sky-browser-code-gate-v593"
  || capability.capabilities?.p3EarthBrowserCodeGate?.sealedBuildEvidence !== false
  || capability.capabilities?.p3EarthBrowserCodeGate?.humanVisualSignoff !== false
  || capability.capabilities?.p3EarthBrowserCodeGate?.consoleReplayStatus !== "blocked-browser-url-policy"
  || capability.evidence?.p3EarthBrowserCodeGateReceiptSha256 !== p3EarthBrowserCodeGate.receiptSha256
  || capability.capabilities?.p4DeepSkyBrowserCodeGate?.receiptSha256 !== p4DeepSkyBrowserCodeGate.receiptSha256
  || capability.capabilities?.p4DeepSkyBrowserCodeGate?.currentSourceBound !== false
  || capability.capabilities?.p4DeepSkyBrowserCodeGate?.supersededForCurrentSourceBy !== "p5-saturn-corrective-browser-code-gate-v593"
  || capability.capabilities?.p4DeepSkyBrowserCodeGate?.consoleWarningErrorCount !== 0
  || capability.capabilities?.p4DeepSkyBrowserCodeGate?.sealedBuildEvidence !== false
  || capability.capabilities?.p4DeepSkyBrowserCodeGate?.humanVisualSignoff !== false
  || capability.evidence?.p4DeepSkyBrowserCodeGateReceiptSha256 !== p4DeepSkyBrowserCodeGate.receiptSha256
  || capability.capabilities?.p5SaturnCorrectiveBrowserCodeGate?.receiptSha256 !== p5SaturnCorrectiveBrowserCodeGate.receiptSha256
  || capability.capabilities?.p5SaturnCorrectiveBrowserCodeGate?.status !== "historical-receipt-verified-current-source-revalidation-pending"
  || capability.capabilities?.p5SaturnCorrectiveBrowserCodeGate?.historicalReceiptStatus !== p5SaturnCorrectiveBrowserCodeGate.status
  || capability.capabilities?.p5SaturnCorrectiveBrowserCodeGate?.currentSourceBound !== false
  || capability.capabilities?.p5SaturnCorrectiveBrowserCodeGate?.currentSourceRevalidationEvidence !== "docs/release/v593/final-sealed-browser-matrix-v593.json"
  || capability.capabilities?.p5SaturnCorrectiveBrowserCodeGate?.currentSourceRevalidation !== "passed-current-sealed-build"
  || capability.capabilities?.p5SaturnCorrectiveBrowserCodeGate?.consoleWarningErrorCount !== 0
  || capability.capabilities?.p5SaturnCorrectiveBrowserCodeGate?.sealedBuildEvidence !== false
  || capability.capabilities?.p5SaturnCorrectiveBrowserCodeGate?.humanVisualSignoff !== false
  || capability.evidence?.p5SaturnCorrectiveBrowserCodeGateReceiptSha256 !== p5SaturnCorrectiveBrowserCodeGate.receiptSha256
  || manifest.authority.scientificPayloadWriteback !== false
  || manifest.authority.scientificAuthorityChanged !== false
  || manifest.authority.measuredAuthorityGranted !== false
  || manifest.authority.gpuAuthorityGranted !== false
  || manifest.authority.productionReleaseAuthorized !== false
  || pointer.status !== "qualified-additive-v593-visual-candidate"
  || pointer.manifestSha256 !== manifest.manifestSha256
  || pointer.capabilityReportSha256 !== capability.reportSha256
  || pointer.formalProductPointer !== "v263"
  || pointer.productionPromotionAllowed !== false
  || capability.releaseAuthorized !== false
) throw new Error("v593-verify-governance");
if (
  !page.includes("OrbitAtlasFinalArtDirectionV593Lazy")
  || !page.includes('data-atlas-formal-product-pointer="v263"')
  || !lazy.includes("next/dynamic")
  || !lazy.includes("ssr: false")
  || !entry.includes("FinalArtObservatoryShellV593")
  || entry.includes("<Canvas")
  || !observatory.includes("FinalArtCanvasHostV593")
  || observatory.includes("<Canvas")
  || (canvasHost.match(/<Canvas\b/g) ?? []).length !== 1
  || !canvasHost.includes("atlasV593WebglOutputChanged")
  || !stage.includes("LivingUniverseStageV592")
  || !stage.includes("SignatureArtDirectionBridgeV593")
  || !observatory.includes('data-atlas-v593-canvas-count="1"')
  || !observatory.includes('data-atlas-v593-scientific-writeback="false"')
  || !observatory.includes("data-atlas-v593-same-build-art-ab")
  || !observatory.includes('"jupiter-cinematic-grs"')
  || !observatory.includes('"sun-science-signature"')
  || !observatory.includes('"sun-cinematic-signature"')
  || !observatory.includes('"earth-seam-audit"')
  || !observatory.includes('"galactic-core-cinematic"')
  || !observatory.includes('"heart-nebula-cinematic"')
  || !observatory.includes('"andromeda-cinematic"')
  || !observatory.includes('"pleiades-cinematic"')
  || !bridge.includes("SOLAR_PHOTOSPHERE_FRAGMENT_V593")
  || !bridge.includes("SOLAR_CHROMOSPHERE_FRAGMENT_V593")
  || !bridge.includes("sdo-hmi-source-local-contrast-observed-sunspot-limb-darkening")
  || !bridge.includes("sdo-aia-source-bounded-rim-and-spicules")
  || !bridge.includes("v592-physical-days-latitude-law-preserved")
  || !bridge.includes("EARTH_SURFACE_FRAGMENT_V593")
  || !bridge.includes("EARTH_CLOUD_FRAGMENT_V593")
  || !bridge.includes("EARTH_ATMOSPHERE_FRAGMENT_V593")
  || !bridge.includes("blue-marble-gebco-roughness-ggx-ocean-black-marble-terminator")
  || !bridge.includes("dual-layer-source-opacity-self-shadow-silver-lining")
  || !bridge.includes("bounded-rayleigh-mie-optical-path-twilight")
  || !bridge.includes("JUPITER_FRAGMENT_V593")
  || !bridge.includes("STELLAR_SURFACE_FRAGMENT_V593")
  || !bridge.includes("symmetric-clean-inset-reconstruction-6.48deg-repeat-sampling")
  || !bridge.includes("SATURN_SURFACE_FRAGMENT_V593")
  || !bridge.includes("SATURN_RING_FRAGMENT_V593")
  || !bridge.includes("DEEP_SKY_SPHERE_FRAGMENT_V593")
  || !bridge.includes("DEEP_FIELD_VERTEX_V593")
  || !bridge.includes("#include <common>")
  || !bridge.includes("DEEP_FIELD_FRAGMENT_V593")
  || !bridge.includes("uSliceIndexV593")
  || !bridge.includes("DEEP_STAR_POINT_FRAGMENT_V593")
  || !bridge.includes("DEEP_STAR_PSF_FRAGMENT_V593")
  || !bridge.includes("source-bound-seam-safe-alpha-aware-no-coordinate-mutation")
  || !bridge.includes("bounded-henyey-greenstein-forward-backward")
  || !bridge.includes("float travelGate = smoothstep(-0.06, 0.16, intersection);")
  || !bridge.includes("float terminator = smoothstep(-0.46, 0.38, nDotLRaw);")
  || !bridge.includes("float shadowTransmission = mix(1.0, 0.16, planetShadow);")
  || !bridge.includes("analytic-ray-sphere-penumbra")
  || !bridge.includes("deterministic-domain-warped-multiscale-convection-no-hard-voronoi-cells")
  || !bridge.includes("restore-original-on-focus-change-or-unmount")
  || !bridge.includes('atlasV593ScientificWriteback = "false"')
  || !source.files.some((file) => file.path === "scripts/build-v593-p1-browser-code-gate.mjs")
  || !source.files.some((file) => file.path === "scripts/build-v593-p2-sun-browser-code-gate.mjs")
  || !source.files.some((file) => file.path === "scripts/build-v593-p3-earth-browser-code-gate.mjs")
  || !source.files.some((file) => file.path === "scripts/build-v593-p4-deep-sky-browser-code-gate.mjs")
  || !source.files.some((file) => file.path === "scripts/build-v593-p5-saturn-corrective-browser-code-gate.mjs")
  || !source.files.some((file) => file.path === "docs/release/v593/mobile-viewport-harness-v593.html")
  || ![
    "scripts/build-v593-final-sealed-browser-gate.mjs",
    "scripts/build-v593-current-lite-matrix.mjs",
    "scripts/build-v593-current-source-lifecycle.mjs",
    "scripts/build-v593-current-source-soak.mjs",
    "scripts/build-v593-human-visual-signoff.mjs",
    "tmp/v593-full-matrix-browser-collector.mjs",
    "tmp/v593-lite-browser-collector.mjs",
    "tmp/v593-exact-ab-browser-collector.mjs",
    "tmp/v593-lifecycle-browser-collector.mjs",
    "output/playwright/run-v593-same-realm-scene-exit.mjs",
    "output/playwright/run-v593-cdp-heap-soak.mjs",
    "output/playwright/verify-v593-human-review-packet.mjs",
  ].every((path) => source.files.some((file) => file.path === path))
  || !config.includes('"tmp/**"')
  || !config.includes('"tests/**"')
  || !config.includes('"**/playwright*.{ts,tsx}"')
) throw new Error("v593-verify-runtime-contract");

if (!existsSync(resolve(root, "docs/release/v593/reseal-receipt-v593.json"))) {
  throw new Error("v593-verify-reseal-missing");
}
{
  const reseal = readJson("docs/release/v593/reseal-receipt-v593.json");
  verifySeal(reseal, "receiptSha256", "reseal");
  const expectedEvidenceTracked = [...new Set([
    finalBrowser.evidence.path.replaceAll("\\", "/"),
    liteBrowser.evidence.path.replaceAll("\\", "/"),
    resourceLifecycle.mountCycles.evidence.path.replaceAll("\\", "/"),
    sameRealmSceneExit.evidence.path.replaceAll("\\", "/"),
    cdpHeapSoak.evidence.path.replaceAll("\\", "/"),
    humanVisualSignoff.sourceStageDossier.path.replaceAll("\\", "/"),
    (humanVisualSignoff.exactAbStage ?? humanVisualSignoff.captureCorrection).path.replaceAll("\\", "/"),
    humanVisualSignoff.userDecision.path.replaceAll("\\", "/"),
    humanVisualSignoff.liveBrowserAbTelemetry.evidence.path.replaceAll("\\", "/"),
  ])];
  if (
    reseal.version !== "v593-final-art-direction-reseal-receipt-v2"
    || reseal.byteIdentical !== true
    || reseal.passes !== 2
    || !sameCanonicalValue(reseal.evidenceTracked, expectedEvidenceTracked)
  ) throw new Error("v593-verify-reseal");
  const p1ReceiptFileSha256 = sha256(readFileSync(resolve(root, "docs/release/v593/p1-browser-code-gate-v593.json")));
  if (reseal.outputs?.["docs/release/v593/p1-browser-code-gate-v593.json"]?.sha256 !== p1ReceiptFileSha256) {
    throw new Error("v593-verify-reseal-p1-reference");
  }
  const p2ReceiptFileSha256 = sha256(readFileSync(resolve(root, "docs/release/v593/p2-sun-browser-code-gate-v593.json")));
  if (reseal.outputs?.["docs/release/v593/p2-sun-browser-code-gate-v593.json"]?.sha256 !== p2ReceiptFileSha256) {
    throw new Error("v593-verify-reseal-p2-sun-reference");
  }
  const p3ReceiptFileSha256 = sha256(readFileSync(resolve(root, "docs/release/v593/p3-earth-browser-code-gate-v593.json")));
  if (reseal.outputs?.["docs/release/v593/p3-earth-browser-code-gate-v593.json"]?.sha256 !== p3ReceiptFileSha256) {
    throw new Error("v593-verify-reseal-p3-earth-reference");
  }
  const p4ReceiptFileSha256 = sha256(readFileSync(resolve(root, "docs/release/v593/p4-deep-sky-browser-code-gate-v593.json")));
  if (reseal.outputs?.["docs/release/v593/p4-deep-sky-browser-code-gate-v593.json"]?.sha256 !== p4ReceiptFileSha256) {
    throw new Error("v593-verify-reseal-p4-deep-sky-reference");
  }
  const p5ReceiptFileSha256 = sha256(readFileSync(resolve(root, "docs/release/v593/p5-saturn-corrective-browser-code-gate-v593.json")));
  if (reseal.outputs?.["docs/release/v593/p5-saturn-corrective-browser-code-gate-v593.json"]?.sha256 !== p5ReceiptFileSha256) {
    throw new Error("v593-verify-reseal-p5-saturn-corrective-reference");
  }
  for (const path of [
    "docs/release/v593/resource-lifecycle-v593.json",
    "docs/release/v593/soak-v593.json",
    "docs/release/v593/release-export-v593.json",
    "docs/release/v593/human-visual-signoff-v593.json",
    ...expectedEvidenceTracked,
  ]) {
    if (!reseal.outputs?.[path]) throw new Error(`v593-verify-reseal-output-missing:${path}`);
  }
  for (const [path, record] of Object.entries(reseal.outputs ?? {})) {
    verifyFile({ path, ...record }, `reseal-${path}`);
  }
}

console.log(JSON.stringify({
  status: "passed-readonly-qualified-additive-v593-visual-candidate",
  candidateStatus: capability.status,
  manifestSha256: manifest.manifestSha256,
  sourceManifestSha256: source.receiptSha256,
  freezeBeforeSha256: freeze.snapshotSha256,
  frozenEntryCount: freeze.frozenSnapshot.length,
  contentPackIndexSha256: packIndex.indexSha256,
  p1BrowserCodeGateReceiptSha256: p1BrowserCodeGate.receiptSha256,
  p2SunBrowserCodeGateReceiptSha256: p2SunBrowserCodeGate.receiptSha256,
  p3EarthBrowserCodeGateReceiptSha256: p3EarthBrowserCodeGate.receiptSha256,
  p4DeepSkyBrowserCodeGateReceiptSha256: p4DeepSkyBrowserCodeGate.receiptSha256,
  p5SaturnCorrectiveBrowserCodeGateReceiptSha256: p5SaturnCorrectiveBrowserCodeGate.receiptSha256,
  signaturePassesCodeImplemented: p5SaturnCorrectiveBrowserCodeGate.scope.signaturePassesCodeImplemented,
  signaturePassesComplete: humanVisualSignoff.signaturePassesApproved,
  humanVisualSignoffReceiptSha256: humanVisualSignoff.receiptSha256,
  liteShellBudget: packIndex.budget.liteShell,
  observatoryDefaultBudget: packIndex.budget.observatoryDefault,
  formalProductPointer: pointer.formalProductPointer,
  releaseAuthorized: false,
}, null, 2));

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "payloadSha256",
  "stageChainSha256",
  "evidenceSha256",
  "pointerSha256",
]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const text = (path) => bytes(path).toString("utf8");
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => !transient.has(key))
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

const lifecyclePath =
  "dist/science/atlas-calibration-hud-lifecycle-v506/lifecycle-audit.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v506-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v506.json";
const lifecycle = read(lifecyclePath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const previousEvidence = read("dist/science/orbit-atlas-shadow-v505-evidence.json");
const previousPointer = read(
  "dist/release/orbit-atlas-current-local-shadow-candidate-v505.json",
);
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);

if (
  lifecycle.version !== "v506-atlas-calibration-hud-lifecycle-audit-v1" ||
  evidence.version !== "orbit-atlas-shadow-v506-evidence-v1" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v506" ||
  sha(lifecycle) !== lifecycle.artifactSha256 ||
  sha(evidence) !== evidence.evidenceSha256 ||
  sha(pointer) !== pointer.pointerSha256 ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  evidence.dependency.v505EvidenceSha256 !== previousEvidence.evidenceSha256 ||
  evidence.dependency.v505PointerSha256 !== previousPointer.pointerSha256 ||
  evidence.dependency.v506LifecycleArtifactSha256 !== lifecycle.artifactSha256 ||
  pointer.evidence.canonicalSha256 !== evidence.evidenceSha256 ||
  pointer.evidence.fileSha256 !== fileSha(evidencePath)
) {
  throw new Error("v506-canonical-chain");
}

if (
  lifecycle.store.initialMode !== "science" ||
  lifecycle.store.initialHudRevision !== 0 ||
  lifecycle.store.changedMode !== "cinematic" ||
  lifecycle.store.changedHudRevision !== 1 ||
  lifecycle.store.repeatedWriteReturnedSameSnapshot !== true ||
  lifecycle.store.finalResetMode !== "science" ||
  lifecycle.store.finalResetHudRevision !== 0 ||
  lifecycle.store.appShellSubscription !== false ||
  lifecycle.store.activeDetailSubscriptionBudget !== 1 ||
  lifecycle.replay.firstSubscriberNotifications !== 1 ||
  lifecycle.replay.secondSubscriberNotifications !== 1 ||
  lifecycle.replay.duplicateWriteNotifications !== 0 ||
  lifecycle.replay.payloadReferencePreservedAcrossModes !== true ||
  lifecycle.replay.scientificFieldMutationAllowed !== false ||
  lifecycle.replay.sceneRevisionDelta !== 0 ||
  lifecycle.resources.peakDelta.subscriptions !== 2 ||
  lifecycle.resources.finalDiff.status !== "baseline" ||
  lifecycle.resources.finalDiff.subscriptions !== 0 ||
  lifecycle.resources.finalDiff.identityChanged !== false ||
  lifecycle.resources.finalDiff.ownerChanged !== false ||
  lifecycle.resources.returnedToBaseline !== true
) {
  throw new Error("v506-lifecycle-boundary");
}

const store = text("app/lib/atlasCalibrationHudModeStoreV506.ts");
const readiness = text("app/components/KerrMeasuredCalibrationReadinessV503.tsx");
const preflight = text("app/components/KerrMeasuredCalibrationPreflightV504.tsx");
const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV504.tsx");
const appShell = text("app/components/AtlasAppShell.tsx");
if (
  appShell.includes("atlasCalibrationHudModeStoreV506") ||
  !store.includes('acquireAtlasResource(\n    "subscription"') ||
  !readiness.includes("useSyncExternalStore(") ||
  !preflight.includes("useSyncExternalStore(") ||
  !readiness.includes("subscribeAtlasCalibrationHudModeV506") ||
  !preflight.includes("subscribeAtlasCalibrationHudModeV506") ||
  !wrapper.includes('data-atlas-v506-hud-mode-store="external-persistent"') ||
  [store, readiness, preflight, wrapper].some(
    (source) =>
      source.includes("Math.random") ||
      source.includes("<canvas") ||
      source.includes("physicsEngine") ||
      source.includes("setSceneRevision"),
  )
) {
  throw new Error("v506-runtime-boundary");
}

if (
  evidence.runtime.localModeUseStateCount !== 0 ||
  evidence.runtime.externalStoreConsumerCount !== 2 ||
  evidence.runtime.registryTrackedSubscriptionCountAtPeak !== 2 ||
  evidence.scienceBoundary.sharedSciencePayloadReferencePreserved !== true ||
  evidence.scienceBoundary.measuredCalibrationFiles !== "0/6" ||
  evidence.scienceBoundary.detectorAuthority !== false ||
  evidence.scienceBoundary.scienceRaster !== "unavailable" ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  dense.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84 ||
  pointer.formalProductPointer !== "v263" ||
  pointer.localShadowDefaultApplied !== false
) {
  throw new Error("v506-continuity-boundary");
}

for (const entry of lifecycle.sourceManifest) {
  if (fileSha(entry.path) !== entry.sha256) {
    throw new Error(`v506-lifecycle-source-manifest:${entry.path}`);
  }
}
if (sha(lifecycle.sourceManifest) !== lifecycle.sourceSha256) {
  throw new Error("v506-lifecycle-source-manifest-canonical");
}
for (const entry of evidence.sourceManifest) {
  if (fileSha(entry.path) !== entry.sha256) {
    throw new Error(`v506-evidence-source-manifest:${entry.path}`);
  }
}
if (sha(evidence.sourceManifest) !== evidence.sourceSha256) {
  throw new Error("v506-evidence-source-manifest-canonical");
}

console.log(
  JSON.stringify(
    {
      status: "passed-v506-low-memory-shared-hud-mode-lifecycle",
      lifecycleArtifactSha256: lifecycle.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      sharedModeStore: "qualified",
      peakSubscriptions: 2,
      finalResourceStatus: "baseline",
      payloadReferencePreserved: true,
      sceneRevisionDelta: 0,
      appShellSubscription: false,
      browserQualification: "not-run",
      denseCampaign: "0/49",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);

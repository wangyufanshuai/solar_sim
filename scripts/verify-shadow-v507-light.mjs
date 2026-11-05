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

const integrationPath =
  "dist/science/atlas-detector-hud-integration-v507/integration-audit.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v507-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v507.json";
const integration = read(integrationPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const previousEvidence = read("dist/science/orbit-atlas-shadow-v506-evidence.json");
const previousPointer = read(
  "dist/release/orbit-atlas-current-local-shadow-candidate-v506.json",
);
const admission = read(
  "dist/science/kerr-topology-detector-admission-v501/admission-bridge.json",
);
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);

if (
  integration.version !== "v507-atlas-detector-hud-integration-audit-v1" ||
  evidence.version !== "orbit-atlas-shadow-v507-evidence-v1" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v507" ||
  sha(integration) !== integration.artifactSha256 ||
  sha(evidence) !== evidence.evidenceSha256 ||
  sha(pointer) !== pointer.pointerSha256 ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  sha(admission) !== admission.artifactSha256 ||
  evidence.dependency.v506EvidenceSha256 !== previousEvidence.evidenceSha256 ||
  evidence.dependency.v506PointerSha256 !== previousPointer.pointerSha256 ||
  evidence.dependency.v507IntegrationArtifactSha256 !== integration.artifactSha256 ||
  pointer.evidence.canonicalSha256 !== evidence.evidenceSha256 ||
  pointer.evidence.fileSha256 !== fileSha(evidencePath)
) {
  throw new Error("v507-canonical-chain");
}

if (
  integration.integration.consumerSurfaceCount !== 3 ||
  integration.integration.admissionTokenConsumption !== "12-of-12" ||
  integration.integration.mutuallyExclusiveDetailBudget !== 1 ||
  integration.integration.localModeStateCount !== 0 ||
  integration.integration.appShellSubscription !== false ||
  integration.admissionBoundary.artifactSha256 !== admission.artifactSha256 ||
  integration.admissionBoundary.payloadSha256 !== admission.payloadSha256 ||
  integration.admissionBoundary.gatesPassed !== 3 ||
  integration.admissionBoundary.gatesBlocked !== 8 ||
  integration.admissionBoundary.measuredFiles !== "0/6" ||
  integration.admissionBoundary.admitted !== false ||
  integration.admissionBoundary.sciencePayloadReferencePreservedAcrossModes !== true ||
  integration.admissionBoundary.scientificFieldMutationAllowed !== false ||
  integration.lifecycle.auditSubscriberCount !== 3 ||
  integration.lifecycle.notifications.some((count) => count !== 1) ||
  integration.lifecycle.peakSubscriptionDelta !== 3 ||
  integration.lifecycle.activeRuntimeSubscriptionBudget !== 1 ||
  integration.lifecycle.finalDiff.status !== "baseline" ||
  integration.lifecycle.returnedToBaseline !== true ||
  integration.runtime.mojibakeMatches !== 0 ||
  integration.runtime.sceneRevisionDelta !== 0
) {
  throw new Error("v507-integration-boundary");
}

const admissionSource = text("app/components/KerrTopologyDetectorAdmissionV501.tsx");
const readinessSource = text("app/components/KerrMeasuredCalibrationReadinessV503.tsx");
const preflightSource = text("app/components/KerrMeasuredCalibrationPreflightV504.tsx");
const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV504.tsx");
const appShell = text("app/components/AtlasAppShell.tsx");
for (const source of [admissionSource, readinessSource, preflightSource]) {
  if (
    !source.includes("bindAtlasCalibrationHudV505(") ||
    !source.includes("useSyncExternalStore(") ||
    !source.includes("subscribeAtlasCalibrationHudModeV506") ||
    !source.includes("setAtlasCalibrationHudModeV506(entry)")
  ) {
    throw new Error("v507-consumer-runtime");
  }
}
if (
  !admissionSource.includes('data-atlas-v501-admitted="false"') ||
  !admissionSource.includes('data-atlas-v507-scientific-field-mutation="false"') ||
  !wrapper.includes('data-atlas-v507-detector-hud-consumers="3"') ||
  appShell.includes("atlasCalibrationHudModeStoreV506") ||
  [admissionSource, readinessSource, preflightSource, wrapper].some(
    (source) =>
      source.includes("Math.random") ||
      source.includes("<canvas") ||
      source.includes("physicsEngine") ||
      source.includes("setSceneRevision"),
  )
) {
  throw new Error("v507-runtime-boundary");
}

if (
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
  throw new Error("v507-continuity-boundary");
}

for (const entry of integration.sourceManifest) {
  if (fileSha(entry.path) !== entry.sha256) {
    throw new Error(`v507-integration-source-manifest:${entry.path}`);
  }
}
if (sha(integration.sourceManifest) !== integration.sourceSha256) {
  throw new Error("v507-integration-source-manifest-canonical");
}
for (const entry of evidence.sourceManifest) {
  if (fileSha(entry.path) !== entry.sha256) {
    throw new Error(`v507-evidence-source-manifest:${entry.path}`);
  }
}
if (sha(evidence.sourceManifest) !== evidence.sourceSha256) {
  throw new Error("v507-evidence-source-manifest-canonical");
}

console.log(
  JSON.stringify(
    {
      status: "passed-v507-low-memory-three-stage-detector-hud-integration",
      integrationArtifactSha256: integration.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      detectorHudConsumers: 3,
      admissionTokens: "12/12",
      admissionArtifactSha256: admission.artifactSha256,
      admissionPayloadSha256: admission.payloadSha256,
      peakSubscriptions: 3,
      finalResourceStatus: "baseline",
      scientificFieldMutation: false,
      browserQualification: "not-run",
      denseCampaign: "0/49",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);

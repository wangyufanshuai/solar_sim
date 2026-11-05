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

const timelinePath =
  "dist/science/kerr-detector-evidence-timeline-v509/timeline-audit.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v509-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v509.json";
const timeline = read(timelinePath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const previousEvidence = read("dist/science/orbit-atlas-shadow-v508-evidence.json");
const previousPointer = read(
  "dist/release/orbit-atlas-current-local-shadow-candidate-v508.json",
);
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);

if (
  timeline.version !== "v509-kerr-detector-evidence-timeline-audit-v1" ||
  evidence.version !== "orbit-atlas-shadow-v509-evidence-v1" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v509" ||
  sha(timeline) !== timeline.artifactSha256 ||
  sha(evidence) !== evidence.evidenceSha256 ||
  sha(pointer) !== pointer.pointerSha256 ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  evidence.dependency.v508EvidenceSha256 !== previousEvidence.evidenceSha256 ||
  evidence.dependency.v508PointerSha256 !== previousPointer.pointerSha256 ||
  evidence.dependency.v509TimelineArtifactSha256 !== timeline.artifactSha256 ||
  pointer.evidence.canonicalSha256 !== evidence.evidenceSha256 ||
  pointer.evidence.fileSha256 !== fileSha(evidencePath)
) {
  throw new Error("v509-canonical-chain");
}

if (
  timeline.timeline.stageCount !== 3 ||
  timeline.timeline.evidenceSubscriptionCount !== 3 ||
  timeline.timeline.modeSubscriptionCount !== 1 ||
  timeline.timeline.totalSubscriptionCount !== 4 ||
  timeline.timeline.automaticRequestCount !== 0 ||
  timeline.timeline.explicitRequestCount !== 3 ||
  timeline.timeline.requestCounts.admission !== 1 ||
  timeline.timeline.requestCounts.readiness !== 1 ||
  timeline.timeline.requestCounts.preflight !== 1 ||
  timeline.timeline.finalMode !== "cinematic" ||
  timeline.timeline.finalHudRevision !== 1 ||
  timeline.stageSnapshots.admission.admitted !== false ||
  timeline.stageSnapshots.readiness.measuredFiles !== "0/6" ||
  timeline.stageSnapshots.preflight.authorityGranted !== false ||
  timeline.scienceBoundary.detectorAuthority !== false ||
  timeline.scienceBoundary.scienceRaster !== "unavailable" ||
  timeline.scienceBoundary.scientificFieldMutationAllowed !== false ||
  timeline.resources.peakSubscriptionDelta !== 4 ||
  timeline.resources.finalDiff.status !== "baseline" ||
  timeline.resources.finalDiff.subscriptions !== 0 ||
  timeline.resources.finalDiff.identityChanged !== false ||
  timeline.resources.finalDiff.ownerChanged !== false ||
  timeline.resources.returnedToBaseline !== true ||
  timeline.runtime.detailCatalogSize !== 11 ||
  timeline.runtime.concurrentDetailBudget !== 1 ||
  timeline.runtime.appShellSubscription !== false
) {
  throw new Error("v509-timeline-boundary");
}

const timelineSource = text("app/components/KerrDetectorEvidenceTimelineV509.tsx");
const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV509.tsx");
const workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
const admissionClient = text("app/lib/kerrTopologyDetectorAdmissionClientV501.ts");
const appShell = text("app/components/AtlasAppShell.tsx");
if (
  !timelineSource.includes('data-atlas-v509-automatic-request-count="0"') ||
  !timelineSource.includes('data-atlas-v509-subscription-count="4"') ||
  timelineSource.includes("useEffect") ||
  timelineSource.includes("fetch(") ||
  !wrapper.includes('data-atlas-v509-detail-catalog-size') ||
  !wrapper.includes('data-atlas-v509-static-network-budget="0"') ||
  !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV509"') ||
  !admissionClient.includes('acquireAtlasResource(\n    "subscription"') ||
  appShell.includes("KerrDetectorEvidenceTimelineV509") ||
  [timelineSource, wrapper, admissionClient].some(
    (source) =>
      source.includes("Math.random") ||
      source.includes("<canvas") ||
      source.includes("physicsEngine") ||
      source.includes("setSceneRevision"),
  )
) {
  throw new Error("v509-runtime-boundary");
}

if (
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
  throw new Error("v509-continuity-boundary");
}

for (const entry of timeline.sourceManifest) {
  if (fileSha(entry.path) !== entry.sha256) {
    throw new Error(`v509-timeline-source-manifest:${entry.path}`);
  }
}
if (sha(timeline.sourceManifest) !== timeline.sourceSha256) {
  throw new Error("v509-timeline-source-manifest-canonical");
}
for (const entry of evidence.sourceManifest) {
  if (fileSha(entry.path) !== entry.sha256) {
    throw new Error(`v509-evidence-source-manifest:${entry.path}`);
  }
}
if (sha(evidence.sourceManifest) !== evidence.sourceSha256) {
  throw new Error("v509-evidence-source-manifest-canonical");
}

console.log(
  JSON.stringify(
    {
      status: "passed-v509-low-memory-three-stage-detector-evidence-timeline",
      timelineArtifactSha256: timeline.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      stages: 3,
      subscriptions: 4,
      automaticRequests: 0,
      explicitRequests: "1/1/1",
      finalMode: "cinematic",
      finalResourceStatus: "baseline",
      detectorAuthority: false,
      browserQualification: "not-run",
      denseCampaign: "0/49",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);

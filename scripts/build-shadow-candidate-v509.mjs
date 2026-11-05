import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v508-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v508.json",
  timeline: "dist/science/kerr-detector-evidence-timeline-v509/timeline-audit.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v509-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v509.json",
});
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
const atomic = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(part, target);
};

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const timeline = read(paths.timeline);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousEvidence.version !== "orbit-atlas-shadow-v508-evidence-v1" ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v508" ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  timeline.version !== "v509-kerr-detector-evidence-timeline-audit-v1" ||
  sha(timeline) !== timeline.artifactSha256 ||
  timeline.timeline.stageCount !== 3 ||
  timeline.timeline.totalSubscriptionCount !== 4 ||
  timeline.timeline.automaticRequestCount !== 0 ||
  timeline.timeline.explicitRequestCount !== 3 ||
  timeline.scienceBoundary.detectorAuthority !== false ||
  timeline.resources.returnedToBaseline !== true ||
  timeline.resources.finalDiff.status !== "baseline" ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v509-evidence-boundary");
}

const sourcePaths = [
  paths.previousEvidence,
  paths.previousPointer,
  paths.timeline,
  paths.dense,
  paths.formal,
  "app/components/KerrDetectorEvidenceTimelineV509.tsx",
  "app/components/KerrDetectorEvidenceTimelineV509.test.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV509.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV509.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/components/AtlasAppShell.tsx",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV509.ts",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV509.test.ts",
  "app/lib/kerrTopologyDetectorAdmissionClientV501.ts",
  "app/lib/kerrTopologyDetectorAdmissionClientV501.test.ts",
  "app/lib/atlasCalibrationEvidenceClientV508.ts",
  "app/lib/atlasCalibrationEvidenceClientV508.test.ts",
  "app/lib/atlasCalibrationHudModeStoreV506.ts",
  "app/lib/atlasResourceLifecycle.ts",
  "scripts/build-kerr-detector-evidence-timeline-v509.ts",
  "scripts/build-shadow-candidate-v509.mjs",
  "scripts/build-shadow-v509.mjs",
  "scripts/verify-shadow-v509-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status =
  "v509-three-stage-detector-evidence-timeline-qualified-heavy-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v509-evidence-v1",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  dependency: {
    v508EvidenceSha256: previousEvidence.evidenceSha256,
    v508PointerSha256: previousPointer.pointerSha256,
    v509TimelineArtifactSha256: timeline.artifactSha256,
    v314StateSha256: dense.stateSha256,
  },
  timeline: timeline.timeline,
  stageSnapshots: timeline.stageSnapshots,
  scienceBoundary: timeline.scienceBoundary,
  resources: timeline.resources,
  runtime: timeline.runtime,
  qualification: timeline.qualification,
  denseCampaign: {
    namespace: "v314",
    status: dense.status,
    completedShardCount: dense.completedShardCount,
    plannedShardCount: dense.plannedShardCount,
    attemptConsumed: dense.attemptConsumed,
    aggregateAvailable: dense.aggregateAvailable,
  },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: timeline.release,
  boundaryStatement: timeline.boundary,
};
const evidence = { ...unsigned, evidenceSha256: sha(unsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v509",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v508EvidenceSingleFlight: "qualified",
    v509DetectorTimeline: "qualified-3-stages",
    v509ObservatoryDetails: "qualified-11-exclusive",
    v509AutomaticTimelineRequests: "qualified-0",
    v509ExplicitTimelineRequests: "qualified-1-1-1",
    v509DynamicShaVisibility: "qualified",
    v509SubscriptionRegistry: "qualified-4",
    v509LifecycleBaseline: "qualified",
    v509MeasuredCalibrationPack: "blocked-0-of-6",
    v509DetectorAuthority: "blocked",
    v509ScienceRaster: "unavailable",
    v509BrowserQualification: "not-run",
    v509VisualMatrixQualification: "not-run",
    v314DenseCampaign: "incomplete-0-of-49",
  },
  promotion: {
    promotionAllowed: false,
    scienceRasterPayloadAllowed: false,
    fitsWriteAllowed: false,
    pngWriteAllowed: false,
    localShadowDefaultApplied: false,
  },
  evidence: {
    path: paths.evidence,
    fileSha256: fileSha(paths.evidence),
    canonicalSha256: evidence.evidenceSha256,
  },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(
  JSON.stringify(
    {
      status,
      timelineArtifactSha256: timeline.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      stages: 3,
      subscriptions: 4,
      automaticRequests: 0,
      explicitRequests: "1/1/1",
      finalMode: timeline.timeline.finalMode,
      finalResourceStatus: timeline.resources.finalDiff.status,
      detectorAuthority: false,
      browserQualification: "not-run",
      denseCampaign: "0/49",
    },
    null,
    2,
  ),
);

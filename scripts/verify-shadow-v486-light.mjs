import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const transient = new Set([
  "generatedAt",
  "artifactSha256",
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
            .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const canonicalSha = (value) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

const artifactPath = "dist/science/kerr-photon-metrology-runtime-v486/integration.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v486-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v486.json";
const artifact = read(artifactPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const previousEvidence = read("dist/science/orbit-atlas-shadow-v485-evidence.json");
const previousPointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v485.json");
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);

if (
  artifact.version !== "v486-kerr-photon-metrology-runtime-integration-v1" ||
  evidence.version !== "orbit-atlas-shadow-v486-evidence-v1" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v486" ||
  canonicalSha(artifact) !== artifact.artifactSha256 ||
  canonicalSha(evidence) !== evidence.evidenceSha256 ||
  canonicalSha(pointer) !== pointer.pointerSha256 ||
  canonicalSha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  canonicalSha(previousPointer) !== previousPointer.pointerSha256 ||
  evidence.dependency.v485EvidenceSha256 !== previousEvidence.evidenceSha256 ||
  evidence.dependency.v485PointerSha256 !== previousPointer.pointerSha256 ||
  evidence.dependency.v486IntegrationSha256 !== artifact.artifactSha256 ||
  pointer.evidence.canonicalSha256 !== evidence.evidenceSha256 ||
  pointer.evidence.fileSha256 !== fileSha(evidencePath)
) {
  throw new Error("v486-canonical-chain");
}

if (
  artifact.intentChain.lazyBoundaryDepth !== 3 ||
  artifact.intentChain.publicPanelId !== "relativity-observables" ||
  artifact.intentChain.publicPanelIdAddedByV486 !== false ||
  artifact.deliveryProfiles.localShadow.componentImportAuthorizedWhenActive !== true ||
  artifact.deliveryProfiles.standaloneFull.componentImportAuthorizedWhenActive !== false ||
  artifact.deliveryProfiles.vercelLite.componentImportAuthorizedWhenActive !== false ||
  artifact.preloadBoundary.sourceQualifiedSolarFirstScreenCockpitChunkRequests !== 0 ||
  artifact.preloadBoundary.sourceQualifiedSolarFirstScreenCockpitApiRequests !== 0 ||
  artifact.preloadBoundary.browserObservedCockpitChunkRequests !== null ||
  artifact.preloadBoundary.browserObservedCockpitApiRequests !== null ||
  artifact.preloadBoundary.browserQualification !== "not-run" ||
  artifact.lifecycle.canvasCreatedByV486 !== false ||
  artifact.lifecycle.sceneRevisionDelta !== 0 ||
  artifact.lifecycle.physicsMutationAllowed !== false ||
  artifact.scienceBoundary.summaryMatrixElementCount !== 0 ||
  artifact.scienceBoundary.summaryProjectionRecordCount !== 0 ||
  artifact.scienceBoundary.summaryExecutionRecordCount !== 0 ||
  artifact.scienceBoundary.sciencePixelRows !== 0 ||
  artifact.scienceBoundary.denseAggregateAvailable !== false
) {
  throw new Error("v486-runtime-boundary");
}

const wrapper = text("app/components/KerrPhotonMetrologyCockpitIntentV486.tsx");
const workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
const section = text("app/components/RelativityResearchWorkspaceSection.tsx");
const surfaces = text("app/components/AtlasRuntimeWorkbenchLazySurfaces.tsx");
if (
  !wrapper.includes('lazy(\n  () => import("./KerrPhotonMetrologyCockpitV485")') ||
  !wrapper.includes("if (!decision.componentImportAuthorized) return null") ||
  !workbench.includes('<KerrPhotonMetrologyCockpitIntentV486 active={tab === "campaign-evidence"} />') ||
  workbench.includes('from "./KerrPhotonMetrologyCockpitV485"') ||
  workbench.includes("/api/atlas/relativity-evidence/v485/photon-metrology-cockpit") ||
  !section.includes('lazy(() => import("./RelativityResearchWorkbenchV280"))') ||
  !surfaces.includes('lazy(() => import("./RelativityObservableAtlasPanel"))') ||
  [wrapper, text("app/lib/kerrPhotonMetrologyIntentV486.ts")].some((source) =>
    source.includes("Math.random") ||
    source.includes("<canvas") ||
    source.includes("physicsEngine") ||
    source.includes("setSceneRevision")
  )
) {
  throw new Error("v486-source-boundary");
}

if (
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
  throw new Error("v486-continuity-boundary");
}

for (const entry of evidence.sourceManifest) {
  if (fileSha(entry.path) !== entry.sha256) throw new Error(`v486-source-manifest:${entry.path}`);
}
if (canonicalSha(evidence.sourceManifest) !== evidence.sourceSha256) {
  throw new Error("v486-source-manifest-canonical");
}

console.log(JSON.stringify({
  status: "passed-v486-low-memory-local-shadow-intent-integration",
  integrationSha256: artifact.artifactSha256,
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  lazyBoundaryDepth: artifact.intentChain.lazyBoundaryDepth,
  standaloneCockpitImportAuthorized: false,
  liteCockpitImportAuthorized: false,
  solarFirstScreenCockpitRequests: 0,
  browserQualification: "not-run",
  denseCampaign: "0/49",
  formalProductPointer: "v263",
}, null, 2));

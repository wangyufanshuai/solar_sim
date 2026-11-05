import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  cockpit: "dist/science/kerr-photon-metrology-cockpit-v485/cockpit.json",
  previousEvidence: "dist/science/orbit-atlas-shadow-v485-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v485.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  intent: "app/lib/kerrPhotonMetrologyIntentV486.ts",
  wrapper: "app/components/KerrPhotonMetrologyCockpitIntentV486.tsx",
  workbench: "app/components/RelativityResearchWorkbenchV280.tsx",
  workspaceSection: "app/components/RelativityResearchWorkspaceSection.tsx",
  lazySurfaces: "app/components/AtlasRuntimeWorkbenchLazySurfaces.tsx",
  output: "dist/science/kerr-photon-metrology-runtime-v486/integration.json",
});
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
const atomic = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};

const cockpit = read(paths.cockpit);
const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
const intentSource = text(paths.intent);
const wrapperSource = text(paths.wrapper);
const workbenchSource = text(paths.workbench);
const sectionSource = text(paths.workspaceSection);
const lazySurfaceSource = text(paths.lazySurfaces);

if (
  cockpit.version !== "v485-kerr-photon-metrology-cockpit-artifact-v1" ||
  canonicalSha(cockpit) !== cockpit.artifactSha256 ||
  previousEvidence.version !== "orbit-atlas-shadow-v485-evidence-v1" ||
  canonicalSha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v485" ||
  canonicalSha(previousPointer) !== previousPointer.pointerSha256 ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  dense.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v486-upstream-boundary");
}

if (
  !intentSource.includes('deliveryProfile === "local-shadow"') ||
  !intentSource.includes("const authorized = localShadow && campaignEvidenceActive") ||
  !wrapperSource.includes('lazy(\n  () => import("./KerrPhotonMetrologyCockpitV485")') ||
  !wrapperSource.includes("if (!decision.componentImportAuthorized) return null") ||
  !workbenchSource.includes('from "./KerrPhotonMetrologyCockpitIntentV486"') ||
  !workbenchSource.includes('<KerrPhotonMetrologyCockpitIntentV486 active={tab === "campaign-evidence"} />') ||
  workbenchSource.includes('from "./KerrPhotonMetrologyCockpitV485"') ||
  workbenchSource.includes("/api/atlas/relativity-evidence/v485/photon-metrology-cockpit") ||
  !sectionSource.includes('lazy(() => import("./RelativityResearchWorkbenchV280"))') ||
  !lazySurfaceSource.includes('lazy(() => import("./RelativityObservableAtlasPanel"))') ||
  [intentSource, wrapperSource].some((source) =>
    source.includes("Math.random") ||
    source.includes("<canvas") ||
    source.includes("physicsEngine") ||
    source.includes("setSceneRevision")
  )
) {
  throw new Error("v486-intent-lazy-boundary");
}

const sourcePaths = [
  paths.cockpit,
  paths.previousEvidence,
  paths.previousPointer,
  paths.dense,
  paths.formal,
  paths.intent,
  paths.wrapper,
  paths.workbench,
  paths.workspaceSection,
  paths.lazySurfaces,
  "app/lib/atlasDeliveryProfile.ts",
  "app/lib/kerrPhotonMetrologyIntentV486.test.ts",
  "app/components/KerrPhotonMetrologyCockpitIntentV486.test.tsx",
  "scripts/build-kerr-photon-metrology-runtime-v486.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const unsigned = {
  version: "v486-kerr-photon-metrology-runtime-integration-v1",
  generatedAt: "2026-08-01T00:00:00Z",
  status: "implemented-local-shadow-campaign-intent-heavy-browser-pending",
  dependency: {
    v485ArtifactSha256: cockpit.artifactSha256,
    v485EvidenceSha256: previousEvidence.evidenceSha256,
    v485PointerSha256: previousPointer.pointerSha256,
    v314StateSha256: dense.stateSha256,
  },
  intentChain: {
    publicPanelId: "relativity-observables",
    publicPanelIdAddedByV486: false,
    outerPanelImport: "lazy-RelativityObservableAtlasPanel",
    workbenchImport: "lazy-RelativityResearchWorkbenchV280",
    cockpitImport: "lazy-KerrPhotonMetrologyCockpitV485",
    cockpitActivationTab: "campaign-evidence",
    lazyBoundaryDepth: 3,
  },
  deliveryProfiles: {
    localShadow: {
      componentImportAuthorizedWhenActive: true,
      summaryRequestAuthorizedWhenActive: true,
    },
    standaloneFull: {
      componentImportAuthorizedWhenActive: false,
      summaryRequestAuthorizedWhenActive: false,
    },
    vercelLite: {
      componentImportAuthorizedWhenActive: false,
      summaryRequestAuthorizedWhenActive: false,
    },
  },
  preloadBoundary: {
    defaultWorkbenchTab: "weak-field-reference",
    sourceQualifiedSolarFirstScreenCockpitChunkRequests: 0,
    sourceQualifiedSolarFirstScreenCockpitApiRequests: 0,
    browserObservedCockpitChunkRequests: null,
    browserObservedCockpitApiRequests: null,
    browserQualification: "not-run",
  },
  lifecycle: {
    canvasCreatedByV486: false,
    sceneRevisionDelta: 0,
    physicsMutationAllowed: false,
    selectionMutationAllowed: false,
    workerDeltaBeforeCockpitMount: 0,
    textureDeltaBeforeCockpitMount: 0,
    cameraLeaseDeltaBeforeCockpitMount: 0,
  },
  scienceBoundary: {
    v485SummaryOnly: true,
    detailedArtifactsAutoLoaded: false,
    summaryMatrixElementCount: 0,
    summaryProjectionRecordCount: 0,
    summaryExecutionRecordCount: 0,
    sciencePixelRows: 0,
    denseAggregateAvailable: false,
    detectorAuthorityGranted: false,
    likelihoodAuthorityGranted: false,
    scienceRasterAuthorityGranted: false,
  },
  sourceManifest,
  sourceSha256: canonicalSha(sourceManifest),
  qualification: {
    staticIntentBoundary: "qualified",
    localShadowActiveImport: "implemented-awaiting-browser-qualification",
    standaloneZeroLoad: "source-qualified-browser-not-run",
    liteZeroLoad: "source-qualified-browser-not-run",
    solarFirstScreenZeroLoad: "source-qualified-browser-not-run",
    browser: "not-run",
    visualMatrix: "not-run",
    soak: "not-run",
    rtxWebGpu: "not-run",
  },
  release: {
    formalProductPointer: "v263",
    formalProductPointerAdvanced: false,
    ordinaryStandaloneProfile: "legacy-v9",
    liteProfile: "legacy-v9",
    localShadowDefaultProfile: "legacy-v9",
    localShadowDefaultApplied: false,
    publicDeploymentBlocked: true,
  },
  boundary:
    "v486-local-shadow-campaign-evidence-intent-only-three-level-lazy-import-no-standalone-lite-solar-preload-no-science-physics-canvas-or-default-mutation",
};
const artifact = { ...unsigned, artifactSha256: canonicalSha(unsigned) };
atomic(paths.output, artifact);
console.log(JSON.stringify({
  status: artifact.status,
  artifactSha256: artifact.artifactSha256,
  v485ArtifactSha256: cockpit.artifactSha256,
  lazyBoundaryDepth: artifact.intentChain.lazyBoundaryDepth,
  localShadowActive: true,
  standaloneActive: false,
  liteActive: false,
  browserQualification: "not-run",
  denseCampaign: "0/49",
  formalProductPointer: "v263",
}, null, 2));

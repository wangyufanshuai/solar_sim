import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v487-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v487.json",
  cockpit: "dist/science/kerr-photon-metrology-cockpit-v485/cockpit.json",
  atlas: "dist/science/kerr-dimensionless-photon-atlas-v487/atlas.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  intent: "app/lib/kerrPhotonMetrologyObservatoryIntentV488.ts",
  wrapper: "app/components/KerrPhotonMetrologyObservatoryIntentV488.tsx",
  workbench: "app/components/RelativityResearchWorkbenchV280.tsx",
  workspaceSection: "app/components/RelativityResearchWorkspaceSection.tsx",
  lazySurfaces: "app/components/AtlasRuntimeWorkbenchLazySurfaces.tsx",
  atlasClient: "app/lib/kerrDimensionlessPhotonAtlasClientV487.ts",
  atlasComponent: "app/components/KerrDimensionlessPhotonAtlasV487.tsx",
  output: "dist/science/kerr-photon-metrology-observatory-v488/integration.json",
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

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const cockpit = read(paths.cockpit);
const atlas = read(paths.atlas);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousEvidence.version !== "orbit-atlas-shadow-v487-evidence-v1" ||
  canonicalSha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v487" ||
  canonicalSha(previousPointer) !== previousPointer.pointerSha256 ||
  cockpit.version !== "v485-kerr-photon-metrology-cockpit-artifact-v1" ||
  canonicalSha(cockpit) !== cockpit.artifactSha256 ||
  atlas.version !== "v487-kerr-dimensionless-photon-atlas-artifact-v1" ||
  canonicalSha(atlas) !== atlas.artifactSha256 ||
  canonicalSha(atlas.rays) !== atlas.payloadSha256 ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v488-upstream-boundary");
}

const intentSource = text(paths.intent);
const wrapperSource = text(paths.wrapper);
const workbenchSource = text(paths.workbench);
const sectionSource = text(paths.workspaceSection);
const lazySource = text(paths.lazySurfaces);
const atlasClientSource = text(paths.atlasClient);
const atlasComponentSource = text(paths.atlasComponent);
if (
  !intentSource.includes("const authorized = localShadow && campaignEvidenceActive") ||
  !intentSource.includes("coordinateAtlasDataRequestAuthorizedByWrapper: false") ||
  !wrapperSource.includes('() => import("./KerrPhotonMetrologyCockpitV485")') ||
  !wrapperSource.includes('() => import("./KerrDimensionlessPhotonAtlasV487")') ||
  !wrapperSource.includes("if (!decision.observatoryImportAuthorized) return null") ||
  wrapperSource.includes("loadKerrDimensionlessPhotonAtlasSummaryV487") ||
  wrapperSource.includes("/api/atlas/relativity-evidence/v487") ||
  !workbenchSource.includes('from "./KerrPhotonMetrologyObservatoryIntentV488"') ||
  !workbenchSource.includes('<KerrPhotonMetrologyObservatoryIntentV488 active={tab === "campaign-evidence"} />') ||
  workbenchSource.includes('from "./KerrPhotonMetrologyCockpitV485"') ||
  workbenchSource.includes('from "./KerrDimensionlessPhotonAtlasV487"') ||
  !sectionSource.includes('lazy(() => import("./RelativityResearchWorkbenchV280"))') ||
  !lazySource.includes('lazy(() => import("./RelativityObservableAtlasPanel"))') ||
  !atlasClientSource.includes("requestCount: 0") ||
  !atlasClientSource.includes("if (requestPromise) return requestPromise") ||
  !atlasComponentSource.includes("Load bounded coordinate atlas") ||
  atlasComponentSource.includes("useEffect") ||
  [intentSource, wrapperSource].some((source) =>
    source.includes("Math.random") ||
    source.includes("<canvas") ||
    source.includes("physicsEngine") ||
    source.includes("setSceneRevision")
  )
) {
  throw new Error("v488-runtime-boundary");
}

const sourcePaths = [
  paths.previousEvidence,
  paths.previousPointer,
  paths.cockpit,
  paths.atlas,
  paths.dense,
  paths.formal,
  paths.intent,
  paths.wrapper,
  paths.workbench,
  paths.workspaceSection,
  paths.lazySurfaces,
  paths.atlasClient,
  paths.atlasComponent,
  "app/lib/atlasDeliveryProfile.ts",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV488.test.ts",
  "app/components/KerrPhotonMetrologyObservatoryIntentV488.test.tsx",
  "scripts/build-kerr-photon-metrology-observatory-v488.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const unsigned = {
  version: "v488-kerr-photon-metrology-observatory-integration-v1",
  generatedAt: "2026-08-01T00:00:00Z",
  status: "implemented-unified-metrology-observatory-heavy-browser-pending",
  dependency: {
    v487EvidenceSha256: previousEvidence.evidenceSha256,
    v487PointerSha256: previousPointer.pointerSha256,
    v485CockpitArtifactSha256: cockpit.artifactSha256,
    v487AtlasArtifactSha256: atlas.artifactSha256,
    v487AtlasPayloadSha256: atlas.payloadSha256,
    v314StateSha256: dense.stateSha256,
  },
  supersession: {
    previousRuntimeWrapper: "KerrPhotonMetrologyCockpitIntentV486",
    currentRuntimeWrapper: "KerrPhotonMetrologyObservatoryIntentV488",
    v486EvidenceOverwritten: false,
    v487EvidenceOverwritten: false,
    preservedCapabilities: ["v485-bounded-cockpit", "v487-explicit-coordinate-atlas"],
  },
  intentChain: {
    publicPanelId: "relativity-observables",
    publicPanelIdAddedByV488: false,
    outerPanelImport: "lazy-RelativityObservableAtlasPanel",
    workbenchImport: "lazy-RelativityResearchWorkbenchV280",
    observatoryMount: "campaign-evidence-tab-only",
    cockpitImport: "lazy-KerrPhotonMetrologyCockpitV485",
    atlasImport: "lazy-KerrDimensionlessPhotonAtlasV487",
    componentLazyBoundaryDepth: 3,
    atlasDataIntentDepth: 4,
  },
  requestBoundary: {
    sourceQualifiedSolarFirstScreenApiRequests: 0,
    sourceQualifiedInactiveWorkbenchApiRequests: 0,
    sourceQualifiedStandaloneApiRequests: 0,
    sourceQualifiedLiteApiRequests: 0,
    localShadowCampaignCockpitSummaryAuthorized: true,
    localShadowCampaignAtlasDataAuthorizedByWrapper: false,
    localShadowCampaignAtlasDataRequiresExplicitClick: true,
    atlasClientMaximumRequestCount: 1,
    browserObservedRequests: null,
    browserQualification: "not-run",
  },
  scienceBoundary: {
    cockpitSummaryMatrixElementCount: 0,
    cockpitSummaryProjectionRecordCount: 0,
    cockpitSummaryExecutionRecordCount: 0,
    atlasRayCount: 4,
    atlasLandmarkCount: 20,
    atlasMatrixElementCount: 0,
    atlasProjectionRecordCount: 0,
    sciencePixelRows: 0,
    scienceRasterAuthorityGranted: false,
    detectorAuthorityGranted: false,
    likelihoodAuthorityGranted: false,
    coordinateMutationAllowed: false,
    cinematicScienceWritebackAllowed: false,
  },
  lifecycle: {
    existingCanvasCount: 1,
    canvasCreatedByV488: false,
    sceneRevisionDelta: 0,
    physicsMutationAllowed: false,
    workerDeltaBeforeIntent: 0,
    textureDeltaBeforeIntent: 0,
    cameraLeaseDeltaBeforeIntent: 0,
  },
  qualification: {
    unifiedMetrologyObservatory: "implemented-awaiting-browser-qualification",
    localShadowCampaignIntent: "source-qualified",
    atlasExplicitDataIntent: "source-qualified",
    standaloneZeroLoad: "source-qualified-browser-not-run",
    liteZeroLoad: "source-qualified-browser-not-run",
    solarFirstScreenZeroLoad: "source-qualified-browser-not-run",
    browser: "not-run",
    visualMatrix: "not-run",
    soak: "not-run",
    rtxWebGpu: "not-run",
  },
  sourceManifest,
  sourceSha256: canonicalSha(sourceManifest),
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
    "v488-unified-local-shadow-campaign-metrology-observatory-three-component-lazy-boundaries-fourth-level-explicit-atlas-data-intent-no-science-product-or-default-mutation",
};
const artifact = { ...unsigned, artifactSha256: canonicalSha(unsigned) };
atomic(paths.output, artifact);
console.log(JSON.stringify({
  status: artifact.status,
  artifactSha256: artifact.artifactSha256,
  v485CockpitSha256: cockpit.artifactSha256,
  v487AtlasSha256: atlas.artifactSha256,
  componentLazyBoundaryDepth: 3,
  atlasDataIntentDepth: 4,
  browserQualification: "not-run",
  denseCampaign: "0/49",
}, null, 2));

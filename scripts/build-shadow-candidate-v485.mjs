import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v484-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v484.json",
  cockpit: "dist/science/kerr-photon-metrology-cockpit-v485/cockpit.json",
  v479: "dist/science/kerr-frequency-provenance-viewer-v479/provenance-viewer.json",
  v480: "dist/science/kerr-photon-evidence-workbench-v480/workbench.json",
  v481: "dist/science/kerr-spectral-landmark-transport-v481/landmarks.json",
  v482: "dist/science/kerr-spectral-landmark-covariance-v482/covariance.json",
  v483: "dist/science/kerr-spectral-sensitivity-modes-v483/sensitivity-modes.json",
  v484: "dist/science/kerr-spectral-identifiability-v484/identifiability.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v485-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v485.json",
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
const upstream = ["v479", "v480", "v481", "v482", "v483", "v484"].map((id) => ({
  id,
  path: paths[id],
  artifact: read(paths[id]),
}));
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);

if (
  previousEvidence.version !== "orbit-atlas-shadow-v484-evidence-v1" ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v484" ||
  canonicalSha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  canonicalSha(previousPointer) !== previousPointer.pointerSha256 ||
  cockpit.version !== "v485-kerr-photon-metrology-cockpit-artifact-v1" ||
  cockpit.status !== "photon-metrology-cockpit-qualified-heavy-runtime-pending" ||
  canonicalSha(cockpit) !== cockpit.artifactSha256 ||
  canonicalSha(cockpit.stages) !== cockpit.stageChainSha256 ||
  cockpit.stages.length !== 6 ||
  cockpit.stages.some(
    (stage, index) =>
      stage.artifactSha256 !== upstream[index].artifact.artifactSha256 ||
      stage.fileSha256 !== fileSha(upstream[index].path) ||
      stage.browserQualification !== "not-run" ||
      stage.scienceWritebackAllowed !== false,
  ) ||
  cockpit.audit.summaryMatrixElementCount !== 0 ||
  cockpit.audit.summaryProjectionRecordCount !== 0 ||
  cockpit.audit.summaryExecutionRecordCount !== 0 ||
  cockpit.audit.brokenStageLinks !== 0 ||
  cockpit.audit.sciencePixelRows !== 0 ||
  cockpit.audit.imageProducts !== 0 ||
  cockpit.boundary.detailedArtifactsAutoLoaded !== false ||
  cockpit.boundary.physicalDetectorObservableAuthorityGranted !== false ||
  cockpit.boundary.statisticalLikelihoodAuthorityGranted !== false ||
  cockpit.boundary.scienceRasterAuthorityGranted !== false ||
  cockpit.boundary.denseShardRunAllowed !== false ||
  cockpit.lifecycle.allResourcesAtBaseline !== true ||
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
  throw new Error("v485-evidence-boundary");
}

const sourcePaths = [
  paths.cockpit,
  paths.previousEvidence,
  paths.previousPointer,
  ...upstream.map((entry) => entry.path),
  paths.dense,
  "app/lib/kerrPhotonMetrologyCockpitV485.ts",
  "app/lib/kerrPhotonMetrologyCockpitServerV485.ts",
  "app/lib/kerrPhotonMetrologyCockpitClientV485.ts",
  "app/components/KerrPhotonMetrologyCockpitV485.tsx",
  "app/api/atlas/relativity-evidence/v485/photon-metrology-cockpit/route.ts",
  "app/local-shadow-v485/page.tsx",
  "scripts/build-kerr-photon-metrology-cockpit-v485.ts",
  "scripts/build-shadow-candidate-v485.mjs",
  "scripts/verify-shadow-v485-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status = "v485-photon-metrology-cockpit-qualified-heavy-runtime-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v485-evidence-v1",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  dependency: {
    v484EvidenceSha256: previousEvidence.evidenceSha256,
    v484EvidenceFileSha256: fileSha(paths.previousEvidence),
    v484PointerSha256: previousPointer.pointerSha256,
    v484PointerFileSha256: fileSha(paths.previousPointer),
    v485ArtifactSha256: cockpit.artifactSha256,
    v485StageChainSha256: cockpit.stageChainSha256,
    v485ArtifactFileSha256: fileSha(paths.cockpit),
    upstreamArtifactSha256: Object.fromEntries(
      upstream.map((entry) => [entry.id, entry.artifact.artifactSha256]),
    ),
    v314StateSha256: dense.stateSha256,
  },
  cockpitModel: {
    stageCount: 6,
    stageMetricCount: 12,
    detailEndpointCount: 6,
    summaryMatrixElementCount: 0,
    summaryProjectionRecordCount: 0,
    summaryExecutionRecordCount: 0,
    detailedArtifactsAutoLoaded: false,
    whitelistedDetailsOnly: true,
    stageChainSha256: cockpit.stageChainSha256,
  },
  scienceOverview: cockpit.overview,
  availability: cockpit.availability,
  presentationBoundary: {
    stageMetricsSharedAcrossViews: true,
    stageMetricMutationAllowed: false,
    scienceWritebackAllowed: false,
    cinematicScienceWritebackAllowed: false,
    presentationScientificFieldCount: 0,
  },
  audit: cockpit.audit,
  lifecycle: { ...cockpit.lifecycle, canvasCreatedByV485: false, sceneRevisionMutationAllowed: false },
  boundary: cockpit.boundary,
  runtimeIntegration: {
    localShadowEntry: "app/local-shadow-v485/page.tsx",
    component: "KerrPhotonMetrologyCockpitV485",
    endpoint: "/api/atlas/relativity-evidence/v485/photon-metrology-cockpit",
    downloadQuery: "download=cockpit",
    maximumResponseBytes: 128 * 1024,
    serverFingerprint: "path+mtime+size+sha256",
    clientSingleFlight: true,
    clientNoStore: true,
    largeMatrixStateCount: 0,
    projectionRecordStateCount: 0,
    executionRecordStateCount: 0,
    liteOrOrdinaryStandaloneVisible: false,
  },
  qualification: {
    sourceIdentity: "qualified-v479-through-v484",
    stageChain: "qualified-6-stages",
    boundedSummary: "qualified-scalar-status-sha-only",
    detailIsolation: "qualified-no-autoload",
    sparseScience: "qualified",
    algebraicScience: "qualified",
    detectorObservables: "blocked",
    statisticalLikelihood: "blocked",
    scienceRaster: "blocked",
    browser: "not-run",
    visualMatrix: "not-run",
    soak: "not-run",
    rtxWebGpu: "not-run",
  },
  denseCampaign: {
    namespace: "v314",
    status: dense.status,
    completedShardCount: dense.completedShardCount,
    plannedShardCount: dense.plannedShardCount,
    attemptConsumed: dense.attemptConsumed,
    runNextAuthorized: dense.runNextAuthorized,
    aggregateAvailable: dense.aggregateAvailable,
  },
  sourceManifest,
  sourceSha256: canonicalSha(sourceManifest),
  release: {
    formalProductPointer: "v263",
    formalProductPointerSha256: fileSha(paths.formal),
    formalProductPointerAdvanced: false,
    ordinaryStandaloneProfile: "legacy-v9",
    liteProfile: "legacy-v9",
    localShadowDefaultProfile: "legacy-v9",
    localShadowDefaultApplied: false,
    publicDeploymentBlocked: true,
  },
  boundaryStatement:
    "v485-six-stage-photon-metrology-cockpit-scalar-status-sha-summary-only-no-large-matrices-projections-executions-auto-loaded-details-detector-likelihood-spectrum-raster-images-dense-shards-or-heavy-qualification",
};
const evidence = { ...unsigned, evidenceSha256: canonicalSha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v485",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v479ToV484StageChain: "qualified-6-stages",
    v485CockpitSummary: "qualified-heavy-runtime-pending",
    v485ScalarOnlyReactState: "qualified-zero-matrices-projections-executions",
    v485DetailIsolation: "qualified-no-autoload",
    v485SparseScience: "qualified",
    v485AlgebraicScience: "qualified",
    v485DetectorObservables: "blocked",
    v485StatisticalLikelihood: "blocked",
    v485ScienceRaster: "blocked",
    v485SciencePixelRows: 0,
    v485BrowserQualification: "not-run",
    v485VisualMatrixQualification: "not-run",
    v485SoakQualification: "not-run",
    v485RtxWebGpuQualification: "not-run",
    v314DenseCampaign: "incomplete-0-of-49",
  },
  promotion: {
    promotionAllowed: false,
    sciencePayloadAllowed: false,
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
const pointer = { ...pointerUnsigned, pointerSha256: canonicalSha(pointerUnsigned) };
atomic(paths.pointer, pointer);

console.log(
  JSON.stringify(
    {
      status,
      artifactSha256: cockpit.artifactSha256,
      stageChainSha256: cockpit.stageChainSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      stages: 6,
      stageMetrics: 12,
      summaryMatrixElements: 0,
      summaryProjectionRecords: 0,
      summaryExecutionRecords: 0,
      detailEndpoints: 6,
      sciencePixels: 0,
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);

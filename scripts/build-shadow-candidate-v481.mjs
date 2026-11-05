import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v480-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v480.json",
  landmarks: "dist/science/kerr-spectral-landmark-transport-v481/landmarks.json",
  v478: "dist/science/kerr-normalized-frequency-chart-v478/frequency-chart.json",
  v479: "dist/science/kerr-frequency-provenance-viewer-v479/provenance-viewer.json",
  v480: "dist/science/kerr-photon-evidence-workbench-v480/workbench.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v481-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v481.json",
});
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "payloadSha256",
  "rowSha256",
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
const landmarks = read(paths.landmarks);
const v478 = read(paths.v478);
const v479 = read(paths.v479);
const v480 = read(paths.v480);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);

if (
  previousEvidence.version !== "orbit-atlas-shadow-v480-evidence-v1" ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v480" ||
  canonicalSha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  canonicalSha(previousPointer) !== previousPointer.pointerSha256 ||
  landmarks.version !== "v481-kerr-spectral-landmark-transport-artifact-v1" ||
  landmarks.status !==
    "spectral-landmark-coordinate-transport-qualified-physical-spectrum-blocked-browser-pending" ||
  canonicalSha(landmarks) !== landmarks.artifactSha256 ||
  canonicalSha(landmarks.rows) !== landmarks.payloadSha256 ||
  landmarks.rows.length !== 4 ||
  landmarks.rows.flatMap((row) => row.features).length !== 20 ||
  landmarks.rows.some((row) => row.sourceNormalizedFrequencyRowSha256 !== row.sourceProvenanceRowSha256) ||
  landmarks.sourceArtifactSha256.v478 !== v478.artifactSha256 ||
  landmarks.sourceArtifactSha256.v479 !== v479.artifactSha256 ||
  landmarks.sourceArtifactSha256.v480 !== v480.artifactSha256 ||
  landmarks.audit.maximumDirectOracleRelativeResidual > 2e-15 ||
  landmarks.audit.maximumInverseRoundTripRelativeResidual > 2e-15 ||
  landmarks.audit.maximumPairwiseRatioRelativeResidual > 2e-15 ||
  landmarks.audit.maximumAdjacentSpacingRelativeResidual > 2e-15 ||
  landmarks.audit.physicalLineRows !== 0 ||
  landmarks.audit.observedIntensityRows !== 0 ||
  landmarks.audit.sciencePixelRows !== 0 ||
  landmarks.boundary.observedSpectrumAuthorityGranted !== false ||
  landmarks.boundary.denseShardRunAllowed !== false ||
  landmarks.lifecycle.allResourcesAtBaseline !== true ||
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
  throw new Error("v481-evidence-boundary");
}

const sourcePaths = [
  paths.landmarks,
  paths.previousEvidence,
  paths.previousPointer,
  paths.v478,
  paths.v479,
  paths.v480,
  paths.dense,
  "app/lib/kerrSpectralLandmarkTransportV481.ts",
  "app/lib/kerrSpectralLandmarkServerV481.ts",
  "app/lib/kerrSpectralLandmarkClientV481.ts",
  "app/components/KerrSpectralLandmarkViewerV481.tsx",
  "app/api/atlas/relativity-evidence/v481/spectral-landmarks/route.ts",
  "app/local-shadow-v481/page.tsx",
  "scripts/build-kerr-spectral-landmark-transport-v481.ts",
  "scripts/build-shadow-candidate-v481.mjs",
  "scripts/verify-shadow-v481-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status = "v481-spectral-landmark-coordinate-transport-qualified-physical-spectrum-blocked-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v481-evidence-v1",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  dependency: {
    v480EvidenceSha256: previousEvidence.evidenceSha256,
    v480EvidenceFileSha256: fileSha(paths.previousEvidence),
    v480PointerSha256: previousPointer.pointerSha256,
    v480PointerFileSha256: fileSha(paths.previousPointer),
    v481ArtifactSha256: landmarks.artifactSha256,
    v481PayloadSha256: landmarks.payloadSha256,
    v481ArtifactFileSha256: fileSha(paths.landmarks),
    v478ArtifactSha256: v478.artifactSha256,
    v479ArtifactSha256: v479.artifactSha256,
    v480ArtifactSha256: v480.artifactSha256,
    v314StateSha256: dense.stateSha256,
  },
  coordinateAuthority: {
    rayCount: 4,
    landmarkCount: 20,
    mapping: "x_observer_equals_g_times_x_emitter",
    inverseMapping: "x_emitter_equals_x_observer_divided_by_g",
    logExpOracleExecutions: 20,
    inverseExecutions: 20,
    pairwiseRatioAudits: 40,
    adjacentSpacingAudits: 16,
    intervalContainmentAudits: 20,
    maximumDirectOracleRelativeResidual: landmarks.audit.maximumDirectOracleRelativeResidual,
    maximumInverseRoundTripRelativeResidual: landmarks.audit.maximumInverseRoundTripRelativeResidual,
    maximumPairwiseRatioRelativeResidual: landmarks.audit.maximumPairwiseRatioRelativeResidual,
    maximumAdjacentSpacingRelativeResidual: landmarks.audit.maximumAdjacentSpacingRelativeResidual,
    maximumRelativeCoordinateUncertaintyUpperBound:
      landmarks.audit.maximumRelativeCoordinateUncertaintyUpperBound,
  },
  applicability: {
    dimensionlessLandmarkPositionAuthority: "qualified-20-landmarks",
    physicalLineIdentityAuthority: "blocked",
    absoluteFrequencyAuthority: "blocked",
    lineWidthAuthority: "blocked",
    lineAmplitudeAuthority: "blocked",
    equivalentWidthAuthority: "blocked",
    physicalBandpassAuthority: "blocked",
    observedSpectrumAuthority: "blocked",
    scienceRasterAuthority: "blocked",
    sciencePixels: 0,
    images: 0,
    unavailableIsNotZero: true,
  },
  presentationBoundary: {
    sharedLandmarkPayloadIdentity: true,
    scienceWritebackAllowed: false,
    cinematicScienceWritebackAllowed: false,
    landmarkMutationCount: 0,
    scienceWritebackCount: 0,
  },
  audit: landmarks.audit,
  lifecycle: { ...landmarks.lifecycle, canvasCreatedByV481: false, sceneRevisionMutationAllowed: false },
  boundary: landmarks.boundary,
  runtimeIntegration: {
    localShadowEntry: "app/local-shadow-v481/page.tsx",
    component: "KerrSpectralLandmarkViewerV481",
    endpoint: "/api/atlas/relativity-evidence/v481/spectral-landmarks",
    downloadQuery: "download=landmarks",
    maximumResponseBytes: 128 * 1024,
    serverFingerprint: "path+mtime+size+sha256",
    clientSingleFlight: true,
    clientNoStore: true,
    liteOrOrdinaryStandaloneVisible: false,
  },
  qualification: {
    sourceIdentity: "qualified-v478-v479-v480",
    coordinateMapping: "qualified",
    inverseRoundTrip: "qualified",
    pairwiseRatioPreservation: "qualified-40-pairs",
    adjacentSpacingScale: "qualified-16-spacings",
    uncertaintyIntervals: "qualified-20-intervals",
    physicalSpectrum: "blocked",
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
    "v481-dimensionless-spectral-landmark-position-transport-only-no-line-identity-width-amplitude-equivalent-width-bandpass-observed-spectrum-raster-images-dense-shards-or-heavy-qualification",
};
const evidence = { ...unsigned, evidenceSha256: canonicalSha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v481",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v480UnifiedEvidenceModel: "qualified-browser-pending",
    v481DimensionlessLandmarkPositions: "qualified-20-landmarks",
    v481AnalyticOracle: "qualified",
    v481InverseRoundTrip: "qualified",
    v481PairwiseRatioAudit: "qualified-40-pairs",
    v481AdjacentSpacingAudit: "qualified-16-spacings",
    v481UncertaintyIntervals: "qualified-20-intervals",
    v481PhysicalLineIdentity: "blocked",
    v481ObservedSpectrum: "blocked",
    v481SciencePixelRows: 0,
    v481BrowserQualification: "not-run",
    v481VisualMatrixQualification: "not-run",
    v481SoakQualification: "not-run",
    v481RtxWebGpuQualification: "not-run",
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
      artifactSha256: landmarks.artifactSha256,
      payloadSha256: landmarks.payloadSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      rays: 4,
      landmarks: 20,
      pairwiseRatioAudits: 40,
      adjacentSpacingAudits: 16,
      physicalLineRows: 0,
      observedIntensityRows: 0,
      sciencePixels: 0,
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);

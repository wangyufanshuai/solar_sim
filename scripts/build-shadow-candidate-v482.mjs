import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v481-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v481.json",
  covariance: "dist/science/kerr-spectral-landmark-covariance-v482/covariance.json",
  v481: "dist/science/kerr-spectral-landmark-transport-v481/landmarks.json",
  v480: "dist/science/kerr-photon-evidence-workbench-v480/workbench.json",
  v479: "dist/science/kerr-frequency-provenance-viewer-v479/provenance-viewer.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v482-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v482.json",
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
const covariance = read(paths.covariance);
const v481 = read(paths.v481);
const v480 = read(paths.v480);
const v479 = read(paths.v479);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);

if (
  previousEvidence.version !== "orbit-atlas-shadow-v481-evidence-v1" ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v481" ||
  canonicalSha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  canonicalSha(previousPointer) !== previousPointer.pointerSha256 ||
  covariance.version !== "v482-kerr-spectral-landmark-correlated-uncertainty-artifact-v1" ||
  covariance.status !==
    "correlated-landmark-uncertainty-qualified-statistical-covariance-blocked-browser-pending" ||
  canonicalSha(covariance) !== covariance.artifactSha256 ||
  canonicalSha(covariance.rows) !== covariance.payloadSha256 ||
  covariance.rows.length !== 4 ||
  covariance.audit.covarianceElementCount !== 100 ||
  covariance.audit.rankOneMatrixCount !== 4 ||
  covariance.audit.zeroEigenvalueCount !== 16 ||
  covariance.audit.maximumScaleConsistencyRelativeResidual > 2e-15 ||
  covariance.audit.maximumDiagonalProjectionRelativeResidual > 2e-15 ||
  covariance.audit.maximumPrincipalEigenvalueTraceRelativeResidual > 2e-15 ||
  covariance.audit.statisticalOneSigmaQualified !== false ||
  covariance.boundary.statisticalCovarianceAuthorityGranted !== false ||
  covariance.boundary.independentNoiseAuthorityGranted !== false ||
  covariance.boundary.observedSpectrumAuthorityGranted !== false ||
  covariance.boundary.scienceRasterAuthorityGranted !== false ||
  covariance.boundary.denseShardRunAllowed !== false ||
  covariance.lifecycle.allResourcesAtBaseline !== true ||
  covariance.sourceArtifactSha256.v481 !== v481.artifactSha256 ||
  covariance.sourceArtifactSha256.v480 !== v480.artifactSha256 ||
  covariance.sourceArtifactSha256.v479 !== v479.artifactSha256 ||
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
  throw new Error("v482-evidence-boundary");
}

const sourcePaths = [
  paths.covariance,
  paths.previousEvidence,
  paths.previousPointer,
  paths.v481,
  paths.v480,
  paths.v479,
  paths.dense,
  "app/lib/kerrSpectralLandmarkCovarianceV482.ts",
  "app/lib/kerrSpectralLandmarkCovarianceServerV482.ts",
  "app/lib/kerrSpectralLandmarkCovarianceClientV482.ts",
  "app/components/KerrSpectralLandmarkCovarianceViewerV482.tsx",
  "app/api/atlas/relativity-evidence/v482/spectral-landmark-covariance/route.ts",
  "app/local-shadow-v482/page.tsx",
  "scripts/build-kerr-spectral-landmark-covariance-v482.ts",
  "scripts/build-shadow-candidate-v482.mjs",
  "scripts/verify-shadow-v482-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status = "v482-correlated-landmark-uncertainty-qualified-statistical-covariance-blocked-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v482-evidence-v1",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  dependency: {
    v481EvidenceSha256: previousEvidence.evidenceSha256,
    v481EvidenceFileSha256: fileSha(paths.previousEvidence),
    v481PointerSha256: previousPointer.pointerSha256,
    v481PointerFileSha256: fileSha(paths.previousPointer),
    v482ArtifactSha256: covariance.artifactSha256,
    v482PayloadSha256: covariance.payloadSha256,
    v482ArtifactFileSha256: fileSha(paths.covariance),
    v481ArtifactSha256: v481.artifactSha256,
    v480ArtifactSha256: v480.artifactSha256,
    v479ArtifactSha256: v479.artifactSha256,
    v314StateSha256: dense.stateSha256,
  },
  covarianceModel: {
    rayCount: 4,
    matrixDimension: 5,
    matrixCount: 4,
    matrixElements: 100,
    rankUpperBound: 1,
    zeroEigenvalues: 16,
    commonScaleParameterCount: 1,
    correlationStructure: "fully-correlated-common-redshift-scale",
    interpretation: "deterministic-upper-bound-not-1sigma",
    independentNoiseAssumed: false,
    maximumScaleConsistencyRelativeResidual: covariance.audit.maximumScaleConsistencyRelativeResidual,
    maximumDiagonalProjectionRelativeResidual: covariance.audit.maximumDiagonalProjectionRelativeResidual,
    maximumPrincipalEigenvalueTraceRelativeResidual:
      covariance.audit.maximumPrincipalEigenvalueTraceRelativeResidual,
  },
  applicability: {
    correlatedUncertaintyUpperBoundAuthority: "qualified-4-rank-one-matrices",
    statisticalOneSigmaAuthority: "blocked",
    independentNoiseAuthority: "blocked",
    physicalLineIdentityAuthority: "blocked",
    physicalBandpassAuthority: "blocked",
    observedSpectrumAuthority: "blocked",
    scienceRasterAuthority: "blocked",
    sciencePixels: 0,
    images: 0,
    unavailableIsNotZero: true,
  },
  presentationBoundary: {
    sharedCovariancePayloadIdentity: true,
    scienceWritebackAllowed: false,
    cinematicScienceWritebackAllowed: false,
    covarianceMutationCount: 0,
    scienceWritebackCount: 0,
  },
  audit: covariance.audit,
  lifecycle: { ...covariance.lifecycle, canvasCreatedByV482: false, sceneRevisionMutationAllowed: false },
  boundary: covariance.boundary,
  runtimeIntegration: {
    localShadowEntry: "app/local-shadow-v482/page.tsx",
    component: "KerrSpectralLandmarkCovarianceViewerV482",
    endpoint: "/api/atlas/relativity-evidence/v482/spectral-landmark-covariance",
    downloadQuery: "download=covariance",
    maximumResponseBytes: 128 * 1024,
    serverFingerprint: "path+mtime+size+sha256",
    clientSingleFlight: true,
    clientNoStore: true,
    liteOrOrdinaryStandaloneVisible: false,
  },
  qualification: {
    sourceIdentity: "qualified-v481-v480-v479",
    deterministicUpperBound: "qualified-4-matrices",
    rankOne: "qualified-4-of-4",
    symmetry: "qualified-4-of-4",
    positiveSemidefinite: "qualified-4-of-4",
    statisticalOneSigma: "blocked-no-probabilistic-noise-model",
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
    "v482-common-redshift-scale-rank-one-deterministic-uncertainty-upper-bound-not-statistical-one-sigma-no-independent-noise-line-identity-bandpass-observed-spectrum-raster-images-dense-shards-or-heavy-qualification",
};
const evidence = { ...unsigned, evidenceSha256: canonicalSha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v482",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v481DimensionlessLandmarks: "qualified-20-landmarks",
    v482CorrelatedUncertaintyUpperBound: "qualified-4-rank-one-matrices",
    v482RankOne: "qualified",
    v482Symmetry: "qualified",
    v482PositiveSemidefinite: "qualified",
    v482ScaleConsistency: "qualified",
    v482DiagonalProjection: "qualified",
    v482StatisticalOneSigma: "blocked",
    v482IndependentNoise: "blocked",
    v482PhysicalSpectrum: "blocked",
    v482SciencePixelRows: 0,
    v482BrowserQualification: "not-run",
    v482VisualMatrixQualification: "not-run",
    v482SoakQualification: "not-run",
    v482RtxWebGpuQualification: "not-run",
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
      artifactSha256: covariance.artifactSha256,
      payloadSha256: covariance.payloadSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      matrices: 4,
      elements: 100,
      rankOneMatrices: 4,
      zeroEigenvalues: 16,
      statisticalOneSigmaAuthority: false,
      sciencePixels: 0,
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);

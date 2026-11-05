import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v482-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v482.json",
  sensitivity: "dist/science/kerr-spectral-sensitivity-modes-v483/sensitivity-modes.json",
  v482: "dist/science/kerr-spectral-landmark-covariance-v482/covariance.json",
  v481: "dist/science/kerr-spectral-landmark-transport-v481/landmarks.json",
  v480: "dist/science/kerr-photon-evidence-workbench-v480/workbench.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v483-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v483.json",
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
const sensitivity = read(paths.sensitivity);
const v482 = read(paths.v482);
const v481 = read(paths.v481);
const v480 = read(paths.v480);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);

if (
  previousEvidence.version !== "orbit-atlas-shadow-v482-evidence-v1" ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v482" ||
  canonicalSha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  canonicalSha(previousPointer) !== previousPointer.pointerSha256 ||
  sensitivity.version !== "v483-kerr-spectral-sensitivity-modes-artifact-v1" ||
  sensitivity.status !== "spectral-sensitivity-modes-qualified-detector-observables-blocked-browser-pending" ||
  canonicalSha(sensitivity) !== sensitivity.artifactSha256 ||
  canonicalSha({ basis: sensitivity.basis, rows: sensitivity.rows }) !== sensitivity.payloadSha256 ||
  sensitivity.basis.modes.length !== 5 ||
  sensitivity.rows.length !== 4 ||
  sensitivity.rows.flatMap((row) => row.projections).length !== 20 ||
  sensitivity.audit.commonScaleProjectionCount !== 4 ||
  sensitivity.audit.nullspaceProjectionCount !== 16 ||
  sensitivity.basis.audit.maximumOrthonormalityAbsoluteResidual > 1e-14 ||
  sensitivity.basis.audit.maximumCompletenessAbsoluteResidual > 1e-14 ||
  sensitivity.basis.audit.maximumNullspaceEmitterDotAbsoluteResidual > 1e-14 ||
  sensitivity.audit.maximumProjectionAbsoluteResidual > 1e-14 ||
  sensitivity.audit.maximumVarianceOracleRelativeResidual > 1e-14 ||
  sensitivity.audit.maximumNegativeRoundoffAbsoluteValue > 1e-40 ||
  sensitivity.audit.detectorObservableRows !== 0 ||
  sensitivity.audit.sciencePixelRows !== 0 ||
  sensitivity.boundary.physicalDetectorObservableAuthorityGranted !== false ||
  sensitivity.boundary.statisticalLikelihoodAuthorityGranted !== false ||
  sensitivity.boundary.denseShardRunAllowed !== false ||
  sensitivity.lifecycle.allResourcesAtBaseline !== true ||
  sensitivity.sourceArtifactSha256.v482 !== v482.artifactSha256 ||
  sensitivity.sourceArtifactSha256.v481 !== v481.artifactSha256 ||
  sensitivity.sourceArtifactSha256.v480 !== v480.artifactSha256 ||
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
  throw new Error("v483-evidence-boundary");
}

const sourcePaths = [
  paths.sensitivity,
  paths.previousEvidence,
  paths.previousPointer,
  paths.v482,
  paths.v481,
  paths.v480,
  paths.dense,
  "app/lib/kerrSpectralSensitivityModesV483.ts",
  "app/lib/kerrSpectralSensitivityServerV483.ts",
  "app/lib/kerrSpectralSensitivityClientV483.ts",
  "app/components/KerrSpectralSensitivityViewerV483.tsx",
  "app/api/atlas/relativity-evidence/v483/spectral-sensitivity-modes/route.ts",
  "app/local-shadow-v483/page.tsx",
  "scripts/build-kerr-spectral-sensitivity-modes-v483.ts",
  "scripts/build-shadow-candidate-v483.mjs",
  "scripts/verify-shadow-v483-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status = "v483-spectral-sensitivity-modes-qualified-detector-observables-blocked-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v483-evidence-v1",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  dependency: {
    v482EvidenceSha256: previousEvidence.evidenceSha256,
    v482EvidenceFileSha256: fileSha(paths.previousEvidence),
    v482PointerSha256: previousPointer.pointerSha256,
    v482PointerFileSha256: fileSha(paths.previousPointer),
    v483ArtifactSha256: sensitivity.artifactSha256,
    v483PayloadSha256: sensitivity.payloadSha256,
    v483ArtifactFileSha256: fileSha(paths.sensitivity),
    v482ArtifactSha256: v482.artifactSha256,
    v481ArtifactSha256: v481.artifactSha256,
    v480ArtifactSha256: v480.artifactSha256,
    v314StateSha256: dense.stateSha256,
  },
  sensitivityModel: {
    coordinateDimension: 5,
    modeCount: 5,
    commonScaleModeCount: 1,
    nullspaceModeCount: 4,
    projectionCount: 20,
    commonScaleProjectionCount: 4,
    nullspaceProjectionCount: 16,
    maximumOrthonormalityAbsoluteResidual:
      sensitivity.basis.audit.maximumOrthonormalityAbsoluteResidual,
    maximumCompletenessAbsoluteResidual:
      sensitivity.basis.audit.maximumCompletenessAbsoluteResidual,
    maximumNullspaceEmitterDotAbsoluteResidual:
      sensitivity.basis.audit.maximumNullspaceEmitterDotAbsoluteResidual,
    maximumProjectionAbsoluteResidual: sensitivity.audit.maximumProjectionAbsoluteResidual,
    maximumVarianceOracleRelativeResidual: sensitivity.audit.maximumVarianceOracleRelativeResidual,
    directRoundoffClampCount: sensitivity.audit.directRoundoffClampCount,
    maximumNegativeRoundoffAbsoluteValue: sensitivity.audit.maximumNegativeRoundoffAbsoluteValue,
    nullspaceZeroDoesNotMeanMeasurementExact: true,
  },
  applicability: {
    dimensionlessSensitivityModeAuthority: "qualified-20-projections",
    detectorWeightAuthority: "blocked",
    physicalObservableCalibrationAuthority: "blocked",
    statisticalLikelihoodAuthority: "blocked",
    independentNoiseAuthority: "blocked",
    observedSpectrumAuthority: "blocked",
    scienceRasterAuthority: "blocked",
    sciencePixels: 0,
    images: 0,
    unavailableIsNotZero: true,
  },
  presentationBoundary: {
    sharedSensitivityPayloadIdentity: true,
    scienceWritebackAllowed: false,
    cinematicScienceWritebackAllowed: false,
    sensitivityMutationCount: 0,
    scienceWritebackCount: 0,
  },
  audit: sensitivity.audit,
  lifecycle: { ...sensitivity.lifecycle, canvasCreatedByV483: false, sceneRevisionMutationAllowed: false },
  boundary: sensitivity.boundary,
  runtimeIntegration: {
    localShadowEntry: "app/local-shadow-v483/page.tsx",
    component: "KerrSpectralSensitivityViewerV483",
    endpoint: "/api/atlas/relativity-evidence/v483/spectral-sensitivity-modes",
    downloadQuery: "download=sensitivity-modes",
    maximumResponseBytes: 128 * 1024,
    serverFingerprint: "path+mtime+size+sha256",
    clientSingleFlight: true,
    clientNoStore: true,
    liteOrOrdinaryStandaloneVisible: false,
  },
  qualification: {
    sourceIdentity: "qualified-v482-v481-v480",
    orthonormalBasis: "qualified",
    completeness: "qualified",
    commonScaleMode: "qualified-1-mode-4-projections",
    nullspaceModes: "qualified-4-modes-16-projections",
    directOuterProductAgreement: "qualified",
    detectorObservables: "blocked",
    statisticalLikelihood: "blocked",
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
    "v483-one-common-scale-sensitive-mode-four-orthogonal-nullspace-modes-direct-matrix-and-outer-product-oracle-zero-under-model-not-exact-measurement-no-detector-weights-likelihood-spectrum-raster-images-dense-shards-or-heavy-qualification",
};
const evidence = { ...unsigned, evidenceSha256: canonicalSha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v483",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v482CorrelatedUncertaintyUpperBound: "qualified-4-rank-one-matrices",
    v483SensitivityBasis: "qualified-5-orthonormal-modes",
    v483CommonScaleMode: "qualified-4-projections",
    v483NullspaceModes: "qualified-16-projections",
    v483DirectOuterProductAgreement: "qualified",
    v483RoundoffClampCount: sensitivity.audit.directRoundoffClampCount,
    v483DetectorObservables: "blocked",
    v483StatisticalLikelihood: "blocked",
    v483ObservedSpectrum: "blocked",
    v483SciencePixelRows: 0,
    v483BrowserQualification: "not-run",
    v483VisualMatrixQualification: "not-run",
    v483SoakQualification: "not-run",
    v483RtxWebGpuQualification: "not-run",
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
      artifactSha256: sensitivity.artifactSha256,
      payloadSha256: sensitivity.payloadSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      modes: 5,
      projections: 20,
      commonScaleProjections: 4,
      nullspaceProjections: 16,
      directRoundoffClampCount: sensitivity.audit.directRoundoffClampCount,
      detectorObservableRows: 0,
      sciencePixels: 0,
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);

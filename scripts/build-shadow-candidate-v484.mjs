import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v483-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v483.json",
  identifiability: "dist/science/kerr-spectral-identifiability-v484/identifiability.json",
  v483: "dist/science/kerr-spectral-sensitivity-modes-v483/sensitivity-modes.json",
  v482: "dist/science/kerr-spectral-landmark-covariance-v482/covariance.json",
  v481: "dist/science/kerr-spectral-landmark-transport-v481/landmarks.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v484-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v484.json",
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
const identifiability = read(paths.identifiability);
const v483 = read(paths.v483);
const v482 = read(paths.v482);
const v481 = read(paths.v481);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);

if (
  previousEvidence.version !== "orbit-atlas-shadow-v483-evidence-v1" ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v483" ||
  canonicalSha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  canonicalSha(previousPointer) !== previousPointer.pointerSha256 ||
  identifiability.version !== "v484-kerr-spectral-identifiability-artifact-v1" ||
  identifiability.status !== "algebraic-identifiability-qualified-fisher-likelihood-blocked-browser-pending" ||
  canonicalSha(identifiability) !== identifiability.artifactSha256 ||
  canonicalSha(identifiability.rows) !== identifiability.payloadSha256 ||
  identifiability.rows.length !== 4 ||
  identifiability.rows.some(
    (row) =>
      row.identifiableDimension !== 1 ||
      row.unidentifiableDimension !== 4 ||
      row.fullConditionNumber !== "infinite-singular" ||
      row.nonzeroSpectrumConditionNumber !== 1 ||
      row.audit.inverseNoiseCovarianceInterpretationAllowed !== false,
  ) ||
  identifiability.audit.penroseConditionAuditCount !== 16 ||
  identifiability.audit.maximumPenroseRelativeResidual > 1e-12 ||
  identifiability.audit.maximumPenroseSymmetryAbsoluteResidual > 1e-12 ||
  identifiability.audit.maximumProjectorIdempotenceRelativeResidual > 1e-12 ||
  identifiability.audit.maximumProjectorComplementAbsoluteResidual > 1e-12 ||
  identifiability.audit.maximumProjectorOrthogonalityAbsoluteResidual > 1e-12 ||
  identifiability.audit.maximumProjectorTraceResidual > 1e-12 ||
  identifiability.audit.fisherInformationQualified !== false ||
  identifiability.audit.likelihoodQualified !== false ||
  identifiability.boundary.inverseNoiseCovarianceAuthorityGranted !== false ||
  identifiability.boundary.fisherInformationAuthorityGranted !== false ||
  identifiability.boundary.statisticalLikelihoodAuthorityGranted !== false ||
  identifiability.boundary.denseShardRunAllowed !== false ||
  identifiability.lifecycle.allResourcesAtBaseline !== true ||
  identifiability.sourceArtifactSha256.v483 !== v483.artifactSha256 ||
  identifiability.sourceArtifactSha256.v482 !== v482.artifactSha256 ||
  identifiability.sourceArtifactSha256.v481 !== v481.artifactSha256 ||
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
  throw new Error("v484-evidence-boundary");
}

const sourcePaths = [
  paths.identifiability,
  paths.previousEvidence,
  paths.previousPointer,
  paths.v483,
  paths.v482,
  paths.v481,
  paths.dense,
  "app/lib/kerrSpectralIdentifiabilityV484.ts",
  "app/lib/kerrSpectralIdentifiabilityServerV484.ts",
  "app/lib/kerrSpectralIdentifiabilityClientV484.ts",
  "app/components/KerrSpectralIdentifiabilityViewerV484.tsx",
  "app/api/atlas/relativity-evidence/v484/spectral-identifiability/route.ts",
  "app/local-shadow-v484/page.tsx",
  "scripts/build-kerr-spectral-identifiability-v484.ts",
  "scripts/build-shadow-candidate-v484.mjs",
  "scripts/verify-shadow-v484-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status = "v484-algebraic-identifiability-qualified-fisher-likelihood-blocked-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v484-evidence-v1",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  dependency: {
    v483EvidenceSha256: previousEvidence.evidenceSha256,
    v483EvidenceFileSha256: fileSha(paths.previousEvidence),
    v483PointerSha256: previousPointer.pointerSha256,
    v483PointerFileSha256: fileSha(paths.previousPointer),
    v484ArtifactSha256: identifiability.artifactSha256,
    v484PayloadSha256: identifiability.payloadSha256,
    v484ArtifactFileSha256: fileSha(paths.identifiability),
    v483ArtifactSha256: v483.artifactSha256,
    v482ArtifactSha256: v482.artifactSha256,
    v481ArtifactSha256: v481.artifactSha256,
    v314StateSha256: dense.stateSha256,
  },
  identifiabilityModel: {
    coordinateDimension: 5,
    identifiableDimensionPerRay: 1,
    unidentifiableDimensionPerRay: 4,
    identifiableDimensionCount: 4,
    unidentifiableDimensionCount: 16,
    pseudoInverseMatrices: 4,
    projectorPairs: 4,
    matrixElements: 300,
    penroseAudits: 16,
    singularMatrices: 4,
    fullConditionNumber: "infinite-singular",
    nonzeroSpectrumConditionNumber: 1,
    maximumPenroseRelativeResidual: identifiability.audit.maximumPenroseRelativeResidual,
    maximumPenroseSymmetryAbsoluteResidual:
      identifiability.audit.maximumPenroseSymmetryAbsoluteResidual,
    maximumProjectorIdempotenceRelativeResidual:
      identifiability.audit.maximumProjectorIdempotenceRelativeResidual,
    maximumProjectorComplementAbsoluteResidual:
      identifiability.audit.maximumProjectorComplementAbsoluteResidual,
    maximumProjectorOrthogonalityAbsoluteResidual:
      identifiability.audit.maximumProjectorOrthogonalityAbsoluteResidual,
    maximumProjectorTraceResidual: identifiability.audit.maximumProjectorTraceResidual,
  },
  applicability: {
    algebraicIdentifiabilityAuthority: "qualified-1-of-5-per-ray",
    algebraicPseudoInverseAuthority: "qualified-4-matrices",
    inverseNoiseCovarianceAuthority: "blocked",
    fisherInformationAuthority: "blocked",
    statisticalLikelihoodAuthority: "blocked",
    parameterPosteriorAuthority: "blocked",
    detectorObservableAuthority: "blocked",
    observedSpectrumAuthority: "blocked",
    scienceRasterAuthority: "blocked",
    sciencePixels: 0,
    images: 0,
    unavailableIsNotZero: true,
  },
  presentationBoundary: {
    sharedIdentifiabilityPayloadIdentity: true,
    scienceWritebackAllowed: false,
    cinematicScienceWritebackAllowed: false,
    identifiabilityMutationCount: 0,
    scienceWritebackCount: 0,
  },
  audit: identifiability.audit,
  lifecycle: { ...identifiability.lifecycle, canvasCreatedByV484: false, sceneRevisionMutationAllowed: false },
  boundary: identifiability.boundary,
  runtimeIntegration: {
    localShadowEntry: "app/local-shadow-v484/page.tsx",
    component: "KerrSpectralIdentifiabilityViewerV484",
    endpoint: "/api/atlas/relativity-evidence/v484/spectral-identifiability",
    downloadQuery: "download=identifiability",
    maximumResponseBytes: 128 * 1024,
    serverFingerprint: "path+mtime+size+sha256",
    clientSingleFlight: true,
    clientNoStore: true,
    liteOrOrdinaryStandaloneVisible: false,
  },
  qualification: {
    sourceIdentity: "qualified-v483-v482-v481",
    moorePenrose: "qualified-4-matrices-16-conditions",
    identifiableProjector: "qualified-rank-1",
    unidentifiableProjector: "qualified-rank-4",
    singularCondition: "qualified-infinite-full-condition",
    inverseNoiseCovariance: "blocked",
    fisherInformation: "blocked",
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
    "v484-one-of-five-algebraic-identifiability-moore-penrose-four-conditions-complementary-projectors-singular-full-condition-algebraic-pseudoinverse-not-inverse-noise-covariance-no-fisher-likelihood-posterior-detector-spectrum-raster-images-dense-shards-or-heavy-qualification",
};
const evidence = { ...unsigned, evidenceSha256: canonicalSha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v484",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v483SensitivityModes: "qualified-5-modes-20-projections",
    v484AlgebraicIdentifiability: "qualified-1-of-5-per-ray",
    v484MoorePenrose: "qualified-4-matrices-16-conditions",
    v484ProjectorComplement: "qualified",
    v484SingularCondition: "qualified-infinite-full-condition",
    v484InverseNoiseCovariance: "blocked",
    v484FisherInformation: "blocked",
    v484StatisticalLikelihood: "blocked",
    v484ParameterPosterior: "blocked",
    v484SciencePixelRows: 0,
    v484BrowserQualification: "not-run",
    v484VisualMatrixQualification: "not-run",
    v484SoakQualification: "not-run",
    v484RtxWebGpuQualification: "not-run",
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
      artifactSha256: identifiability.artifactSha256,
      payloadSha256: identifiability.payloadSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      pseudoInverseMatrices: 4,
      identifiableDimensions: 4,
      unidentifiableDimensions: 16,
      penroseAudits: 16,
      fisherInformationAuthority: false,
      likelihoodAuthority: false,
      sciencePixels: 0,
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);

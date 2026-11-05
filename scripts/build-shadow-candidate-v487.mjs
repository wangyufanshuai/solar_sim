import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v486-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v486.json",
  artifact: "dist/science/kerr-dimensionless-photon-atlas-v487/atlas.json",
  svg: "dist/science/kerr-dimensionless-photon-atlas-v487/atlas.svg",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v487-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v487.json",
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
const artifact = read(paths.artifact);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousEvidence.version !== "orbit-atlas-shadow-v486-evidence-v1" ||
  canonicalSha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v486" ||
  canonicalSha(previousPointer) !== previousPointer.pointerSha256 ||
  artifact.version !== "v487-kerr-dimensionless-photon-atlas-artifact-v1" ||
  canonicalSha(artifact) !== artifact.artifactSha256 ||
  canonicalSha(artifact.rays) !== artifact.payloadSha256 ||
  fileSha(paths.svg) !== artifact.vectorDiagnostic.fileSha256 ||
  artifact.audit.joinedRayCount !== 4 ||
  artifact.audit.joinedLandmarkCount !== 20 ||
  artifact.audit.sciencePixelRows !== 0 ||
  artifact.boundary.scienceRasterAuthorityGranted !== false ||
  artifact.boundary.physicalBandpassAuthorityGranted !== false ||
  artifact.boundary.statisticalLikelihoodAuthorityGranted !== false ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v487-evidence-boundary");
}

const sourcePaths = [
  paths.previousEvidence,
  paths.previousPointer,
  paths.artifact,
  paths.svg,
  paths.dense,
  paths.formal,
  "app/lib/kerrDimensionlessPhotonAtlasV487.ts",
  "app/lib/kerrDimensionlessPhotonAtlasV487.test.ts",
  "app/lib/kerrDimensionlessPhotonAtlasServerV487.ts",
  "app/lib/kerrDimensionlessPhotonAtlasServerV487.test.ts",
  "app/lib/kerrDimensionlessPhotonAtlasClientV487.ts",
  "app/lib/kerrDimensionlessPhotonAtlasClientV487.test.ts",
  "app/components/KerrDimensionlessPhotonAtlasV487.tsx",
  "app/components/KerrDimensionlessPhotonAtlasV487.test.tsx",
  "app/api/atlas/relativity-evidence/v487/dimensionless-photon-atlas/route.ts",
  "app/api/atlas/relativity-evidence/v487/dimensionless-photon-atlas/route.test.ts",
  "app/local-shadow-v487/page.tsx",
  "scripts/build-kerr-dimensionless-photon-atlas-v487.mjs",
  "scripts/build-shadow-candidate-v487.mjs",
  "scripts/build-shadow-v487.mjs",
  "scripts/verify-shadow-v487-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status = "v487-dimensionless-photon-atlas-qualified-physical-observables-blocked-heavy-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v487-evidence-v1",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  dependency: {
    v486EvidenceSha256: previousEvidence.evidenceSha256,
    v486EvidenceFileSha256: fileSha(paths.previousEvidence),
    v486PointerSha256: previousPointer.pointerSha256,
    v486PointerFileSha256: fileSha(paths.previousPointer),
    v487ArtifactSha256: artifact.artifactSha256,
    v487ArtifactFileSha256: fileSha(paths.artifact),
    v487PayloadSha256: artifact.payloadSha256,
    v487SvgFileSha256: artifact.vectorDiagnostic.fileSha256,
    v314StateSha256: dense.stateSha256,
  },
  atlas: {
    rayCount: 4,
    landmarkCount: 20,
    blueshiftRayCount: artifact.audit.blueshiftRayCount,
    redshiftRayCount: artifact.audit.redshiftRayCount,
    coordinateSystem: artifact.contract.coordinateSystem,
    identifiableDimensionPerRay: 1,
    unidentifiableDimensionPerRay: 4,
    deterministicUpperBoundOnly: true,
    diagnosticVectorPlotOnly: true,
  },
  transportAudit: {
    maximumTransportRelativeResidual: artifact.audit.maximumTransportRelativeResidual,
    monotonicRayCount: artifact.audit.monotonicRayCount,
    payloadSha256: artifact.payloadSha256,
  },
  runtime: {
    localShadowEntry: "app/local-shadow-v487/page.tsx",
    endpoint: "/api/atlas/relativity-evidence/v487/dimensionless-photon-atlas",
    svgQuery: "format=svg",
    explicitIntentRequired: true,
    requestCountBeforeIntent: 0,
    clientSingleFlight: true,
    clientNoStore: true,
    maximumResponseBytes: 128 * 1024,
    localShadowOnly: true,
    standaloneVisible: false,
    liteVisible: false,
  },
  scienceCinematicBoundary: {
    sharedPayloadSha256: artifact.payloadSha256,
    sharedVectorDiagnosticSha256: artifact.vectorDiagnostic.fileSha256,
    scienceLinearDisplay: true,
    scienceBloomIntensity: 0,
    scienceColorGradeIntensity: 0,
    cinematicShellMayChange: true,
    coordinateMutationAllowed: false,
    uncertaintyMutationAllowed: false,
    identifiabilityMutationAllowed: false,
    scientificFieldWritebackAllowed: false,
  },
  audit: artifact.audit,
  lifecycle: artifact.lifecycle,
  boundary: artifact.boundary,
  qualification: {
    dimensionlessCoordinateAtlas: "qualified",
    deterministicVectorDiagnostic: "qualified",
    normalizedFrequencyProvenance: "qualified",
    correlatedUpperBound: "qualified-not-statistical-1sigma",
    algebraicIdentifiability: "qualified-rank-1-of-5",
    absoluteFrequency: "blocked",
    physicalBandpass: "blocked",
    detectorThroughput: "blocked",
    observedIntensity: "blocked",
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
    aggregateAvailable: dense.aggregateAvailable,
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
  boundaryStatement:
    "v487-dimensionless-coordinate-diagnostic-only-no-physical-frequency-line-bandpass-throughput-intensity-likelihood-science-raster-fits-png-dense-shard-or-product-promotion",
};
const evidence = { ...unsigned, evidenceSha256: canonicalSha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v487",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v486IntentIntegration: "implemented-awaiting-browser-qualification",
    v487DimensionlessCoordinateAtlas: "qualified",
    v487DiagnosticSvg: "qualified-deterministic-vector-only",
    v487Landmarks: "qualified-20-of-20",
    v487Identifiability: "qualified-rank-1-of-5",
    v487PhysicalFrequency: "blocked",
    v487PhysicalBandpass: "blocked",
    v487DetectorThroughput: "blocked",
    v487ObservedIntensity: "blocked",
    v487StatisticalLikelihood: "blocked",
    v487ScienceRaster: "blocked",
    v487FitsProducts: 0,
    v487PngProducts: 0,
    v487BrowserQualification: "not-run",
    v487VisualMatrixQualification: "not-run",
    v487SoakQualification: "not-run",
    v487RtxWebGpuQualification: "not-run",
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
const pointer = { ...pointerUnsigned, pointerSha256: canonicalSha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({
  status,
  artifactSha256: artifact.artifactSha256,
  payloadSha256: artifact.payloadSha256,
  svgSha256: artifact.vectorDiagnostic.fileSha256,
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  rays: 4,
  landmarks: 20,
  physicalObservables: "blocked",
  sciencePixels: 0,
  denseCampaign: "0/49",
}, null, 2));

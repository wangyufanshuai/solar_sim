import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v470-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v470.json",
  matrix: "dist/science/kerr-observable-provenance-v471/observable-matrix.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v471-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v471.json",
});
const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
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
  const part = target + "." + process.pid + ".part";
  writeFileSync(part, JSON.stringify(value, null, 2) + "\n", "utf8");
  renameSync(part, target);
};

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const matrix = read(paths.matrix);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);

if (
  previousEvidence.version !== "orbit-atlas-shadow-v470-evidence-v1" ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v470" ||
  canonicalSha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  canonicalSha(previousPointer) !== previousPointer.pointerSha256 ||
  matrix.version !== "v471-kerr-observable-provenance-artifact-v1" ||
  matrix.status !== "observable-provenance-qualified-production-blocked-browser-pending" ||
  canonicalSha(matrix) !== matrix.artifactSha256 ||
  matrix.rows?.length !== 13 ||
  matrix.sources?.length !== 11 ||
  matrix.summary?.availableRowCount !== 9 ||
  matrix.summary?.unavailableRowCount !== 4 ||
  matrix.summary?.productionAuthorityGrantedRowCount !== 0 ||
  matrix.summary?.sciencePixelRows !== 0 ||
  matrix.admission?.scienceRasterAllowed !== false ||
  matrix.admission?.fitsImageAllowed !== false ||
  matrix.lifecycle?.allResourcesAtBaseline !== true ||
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
  throw new Error("v471-evidence-boundary");
}

const sourcePaths = [
  paths.matrix,
  paths.previousEvidence,
  paths.previousPointer,
  paths.dense,
  "app/lib/kerrObservableProvenanceV471.ts",
  "app/lib/kerrObservableProvenanceServerV471.ts",
  "app/lib/kerrObservableProvenanceClientV471.ts",
  "app/components/KerrObservableProvenanceMatrixV471.tsx",
  "app/api/atlas/relativity-evidence/v471/observable-provenance/route.ts",
  "app/local-shadow-v471/page.tsx",
  "scripts/build-kerr-observable-provenance-v471.ts",
  "scripts/build-shadow-candidate-v471.mjs",
  "scripts/verify-shadow-v471-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status = "v471-observable-provenance-qualified-production-blocked-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v471-evidence-v1",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  dependency: {
    v470EvidenceSha256: previousEvidence.evidenceSha256,
    v470EvidenceFileSha256: fileSha(paths.previousEvidence),
    v470PointerSha256: previousPointer.pointerSha256,
    v470PointerFileSha256: fileSha(paths.previousPointer),
    v471MatrixArtifactSha256: matrix.artifactSha256,
    v471MatrixFileSha256: fileSha(paths.matrix),
    v314StateSha256: dense.stateSha256,
  },
  observables: {
    rowCount: matrix.rows.length,
    sourceCount: matrix.sources.length,
    availableRowCount: matrix.summary.availableRowCount,
    unavailableRowCount: matrix.summary.unavailableRowCount,
    shortAuthorityRowCount: matrix.summary.shortAuthorityRowCount,
    coordinateAuthorityRowCount: matrix.summary.coordinateAuthorityRowCount,
    analyticFixtureRowCount: matrix.summary.analyticFixtureRowCount,
    productionAuthorityGrantedRowCount: 0,
    sciencePixelRows: 0,
    stokesMeasurementRows: 0,
    fitsImageRows: 0,
    unavailableIsNotZero: true,
    sparseAuthorityIsNotDenseAuthority: true,
    analyticFixtureIsNotMeasuredAuthority: true,
  },
  admission: matrix.admission,
  lifecycle: {
    ...matrix.lifecycle,
    canvasCreatedByV471: false,
    sceneRevisionMutationAllowed: false,
  },
  boundary: matrix.boundary,
  runtimeIntegration: {
    localShadowEntry: "app/local-shadow-v471/page.tsx",
    component: "KerrObservableProvenanceMatrixV471",
    endpoint: "/api/atlas/relativity-evidence/v471/observable-provenance",
    downloadQuery: "download=observable-matrix",
    maximumResponseBytes: 128 * 1024,
    serverFingerprint: "path+mtime+size+sha256",
    clientSingleFlight: true,
    clientNoStore: true,
    liteOrOrdinaryStandaloneVisible: false,
  },
  qualification: {
    provenanceMatrix: "qualified-13-observables",
    shortAuthoritySeparation: "qualified",
    coordinateVsPixelSeparation: "qualified",
    orientationVsStokesSeparation: "qualified",
    analyticVsMeasuredSeparation: "qualified",
    productionAuthority: "blocked",
    scienceRaster: "blocked",
    fitsImage: "blocked",
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
    "v471-bounded-observable-provenance-only-no-production-authority-pixels-stokes-images-shards-runtime-mutation-or-promotion",
};
const evidence = { ...unsigned, evidenceSha256: canonicalSha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v471",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v470DependencyDag: "qualified",
    v471ObservableMatrix: "qualified-13-rows",
    v471ShortAuthority: "qualified-4-rows",
    v471CoordinateAuthority: "qualified-3-rows",
    v471AnalyticFixture: "qualified-2-rows",
    v471UnavailableProductionObservables: "explicit-4-rows",
    v471ProductionAuthorityGranted: false,
    v471SciencePixelRows: 0,
    v471StokesMeasurementRows: 0,
    v471FitsImageRows: 0,
    v471BrowserQualification: "not-run",
    v471VisualMatrixQualification: "not-run",
    v471SoakQualification: "not-run",
    v471RtxWebGpuQualification: "not-run",
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
      artifactSha256: matrix.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      rowCount: matrix.rows.length,
      available: matrix.summary.availableRowCount,
      unavailable: matrix.summary.unavailableRowCount,
      productionAuthority: 0,
      sciencePixelRows: 0,
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);

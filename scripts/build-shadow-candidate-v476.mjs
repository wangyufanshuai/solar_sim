import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v475-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v475.json",
  admission: "dist/science/kerr-science-product-admission-v476/admission.json",
  v458: "dist/science/kerr-measured-detector-intake-v458/intake-inspect.json",
  v470: "dist/science/kerr-evidence-dependency-v470/dependency-graph.json",
  v471: "dist/science/kerr-observable-provenance-v471/observable-matrix.json",
  v473: "dist/science/kerr-observable-uncertainty-v473/uncertainty-ledger.json",
  v475: "dist/science/kerr-dual-render-boundary-v475/dual-render.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v476-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v476.json",
});
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "evidenceSha256",
  "pointerSha256",
]);
const transientV475 = new Set([...transient, "scienceBufferSha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalizeWith = (value, ignored) =>
  Array.isArray(value)
    ? value.map((entry) => canonicalizeWith(entry, ignored))
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => !ignored.has(key))
            .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
            .map(([key, entry]) => [key, canonicalizeWith(entry, ignored)]),
        );
const canonicalShaWith = (value, ignored) =>
  createHash("sha256").update(JSON.stringify(canonicalizeWith(value, ignored))).digest("hex");
const canonicalSha = (value) => canonicalShaWith(value, transient);
const canonicalShaV475 = (value) => canonicalShaWith(value, transientV475);
const atomic = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = target + "." + process.pid + ".part";
  writeFileSync(part, JSON.stringify(value, null, 2) + "\n", "utf8");
  renameSync(part, target);
};

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const admission = read(paths.admission);
const v475 = read(paths.v475);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
const allowed = admission.products.filter((entry) => entry.available);
const blocked = admission.products.filter((entry) => !entry.available);

if (
  previousEvidence.version !== "orbit-atlas-shadow-v475-evidence-v1" ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v475" ||
  canonicalShaV475(previousEvidence) !== previousEvidence.evidenceSha256 ||
  canonicalShaV475(previousPointer) !== previousPointer.pointerSha256 ||
  admission.version !== "v476-kerr-science-product-admission-artifact-v1" ||
  admission.status !== "science-product-admission-qualified-production-images-blocked-browser-pending" ||
  canonicalSha(admission) !== admission.artifactSha256 ||
  admission.products.length !== 9 ||
  allowed.length !== 2 ||
  blocked.length !== 7 ||
  admission.contract.readyMeasuredFileCount !== 0 ||
  admission.contract.missingMeasuredFileCount !== 6 ||
  admission.contract.completedDenseShardCount !== 0 ||
  admission.contract.plannedDenseShardCount !== 49 ||
  admission.contract.productionBudgetClosedCount !== 0 ||
  admission.audit.detectorProjectionAllowed !== false ||
  admission.audit.observedIntensityAvailable !== false ||
  admission.audit.measuredStokesAvailable !== false ||
  admission.audit.scienceRasterAllowed !== false ||
  admission.audit.fitsWriteAllowed !== false ||
  admission.audit.pngWriteAllowed !== false ||
  admission.audit.presentationToScienceConversionAllowed !== false ||
  admission.audit.placeholderMeasurementAllowed !== false ||
  admission.boundary.productionAuthorityGranted !== false ||
  admission.boundary.sciencePixelRows !== 0 ||
  admission.boundary.stokesMeasurementRows !== 0 ||
  admission.boundary.fitsImageRows !== 0 ||
  admission.lifecycle.allResourcesAtBaseline !== true ||
  v475.scienceBuffer.scienceBufferSha256 !== admission.scienceBufferSha256 ||
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
  throw new Error("v476-evidence-boundary");
}

const sourcePaths = [
  paths.admission,
  paths.previousEvidence,
  paths.previousPointer,
  paths.v458,
  paths.v470,
  paths.v471,
  paths.v473,
  paths.v475,
  paths.dense,
  "app/lib/kerrScienceProductAdmissionV476.ts",
  "app/lib/kerrScienceProductAdmissionServerV476.ts",
  "app/lib/kerrScienceProductAdmissionClientV476.ts",
  "app/components/KerrScienceProductAdmissionV476.tsx",
  "app/api/atlas/relativity-evidence/v476/science-product-admission/route.ts",
  "app/local-shadow-v476/page.tsx",
  "scripts/build-kerr-science-product-admission-v476.ts",
  "scripts/build-shadow-candidate-v476.mjs",
  "scripts/verify-shadow-v476-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status = "v476-science-product-admission-qualified-production-images-blocked-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v476-evidence-v1",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  dependency: {
    v475EvidenceSha256: previousEvidence.evidenceSha256,
    v475EvidenceFileSha256: fileSha(paths.previousEvidence),
    v475PointerSha256: previousPointer.pointerSha256,
    v475PointerFileSha256: fileSha(paths.previousPointer),
    v476ArtifactSha256: admission.artifactSha256,
    v476ArtifactFileSha256: fileSha(paths.admission),
    v476ScienceBufferSha256: admission.scienceBufferSha256,
    v314StateSha256: dense.stateSha256,
  },
  admission: {
    productCount: 9,
    allowedProductCount: 2,
    blockedProductCount: 7,
    allowedProductIds: allowed.map((entry) => entry.id),
    blockedProductIds: blocked.map((entry) => entry.id),
    placeholderAllowedCount: 0,
    presentationFallbackAuthorityCount: 0,
    scienceWritebackAllowedCount: 0,
  },
  rootBlockers: {
    measuredDetector: "missing-6-of-6",
    denseCampaign: "incomplete-0-of-49",
    heavyQualification: "not-run",
    automaticActionAllowedCount: 0,
  },
  measurements: {
    sparseScienceRows: 4,
    productionAuthorityRows: 0,
    detectorProjectedRows: 0,
    observedIntensityRows: 0,
    measuredStokesRows: 0,
    sciencePixelRows: 0,
    fitsImageRows: 0,
    pngImageRows: 0,
    unavailableIsNotZero: true,
  },
  lifecycle: {
    ...admission.lifecycle,
    canvasCreatedByV476: false,
    sceneRevisionMutationAllowed: false,
  },
  boundary: admission.boundary,
  runtimeIntegration: {
    localShadowEntry: "app/local-shadow-v476/page.tsx",
    component: "KerrScienceProductAdmissionV476",
    endpoint: "/api/atlas/relativity-evidence/v476/science-product-admission",
    downloadQuery: "download=admission",
    maximumResponseBytes: 128 * 1024,
    serverFingerprint: "path+mtime+size+sha256",
    clientSingleFlight: true,
    clientNoStore: true,
    resolverFailClosed: true,
    liteOrOrdinaryStandaloneVisible: false,
  },
  qualification: {
    sparseObservableHud: "qualified-4-rays",
    sparseVectorExport: "qualified-4-rays",
    detectorProjection: "blocked-measured-files-0-of-6",
    observedIntensity: "blocked-production-budget-open",
    measuredStokes: "blocked-no-polarimeter-authority",
    denseTransferMap: "blocked-0-of-49",
    scienceRaster: "blocked",
    fitsScienceImage: "blocked",
    pngScienceImage: "blocked",
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
    "v476-two-sparse-products-admitted-seven-production-products-fail-closed-no-placeholder-presentation-authority-detector-projection-intensity-stokes-raster-fits-png-shards-or-heavy-qualification",
};
const evidence = { ...unsigned, evidenceSha256: canonicalSha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v476",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v475DualRenderBoundary: "qualified-browser-pending",
    v476ScienceProductAdmission: "qualified-fail-closed",
    v476SparseProducts: "qualified-2-of-9",
    v476ProductionProducts: "blocked-7-of-9",
    v476MeasuredDetectorFiles: "missing-6-of-6",
    v476ProductionBudgetsClosed: 0,
    v476SciencePixelRows: 0,
    v476StokesMeasurementRows: 0,
    v476FitsImageRows: 0,
    v476PresentationFallbackAuthority: false,
    v476PlaceholderMeasurements: false,
    v476BrowserQualification: "not-run",
    v476VisualMatrixQualification: "not-run",
    v476SoakQualification: "not-run",
    v476RtxWebGpuQualification: "not-run",
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
      artifactSha256: admission.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      products: 9,
      allowed: 2,
      blocked: 7,
      measuredFiles: "0/6",
      denseCampaign: "0/49",
      sciencePixels: 0,
      stokesRows: 0,
      fitsRows: 0,
      placeholderMeasurements: false,
      presentationFallbackAuthority: false,
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);

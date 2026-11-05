import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  canonicalKerrScienceProductAdmissionV476,
  KERR_SCIENCE_PRODUCT_ADMISSION_ARTIFACT_VERSION_V476,
  parseKerrScienceProductAdmissionArtifactV476,
  type KerrScienceProductRowV476,
} from "../app/lib/kerrScienceProductAdmissionV476";
import { canonicalKerrDualRenderPayloadV475 } from "../app/lib/kerrDualRenderBoundaryV475";

type Json = Record<string, unknown>;

const root = process.cwd();
const paths = Object.freeze({
  v458: "dist/science/kerr-measured-detector-intake-v458/intake-inspect.json",
  v470: "dist/science/kerr-evidence-dependency-v470/dependency-graph.json",
  v471: "dist/science/kerr-observable-provenance-v471/observable-matrix.json",
  v473: "dist/science/kerr-observable-uncertainty-v473/uncertainty-ledger.json",
  v475: "dist/science/kerr-dual-render-boundary-v475/dual-render.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-science-product-admission-v476/admission.json",
});
const read = (path: string): Json =>
  JSON.parse(readFileSync(resolve(root, path), "utf8")) as Json;
const fileSha = (path: string) =>
  createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const canonicalSha = (value: unknown) =>
  createHash("sha256").update(canonicalKerrScienceProductAdmissionV476(value)).digest("hex");
const canonicalShaV475 = (value: unknown) =>
  createHash("sha256").update(canonicalKerrDualRenderPayloadV475(value)).digest("hex");
const atomic = (path: string, value: unknown) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = target + "." + process.pid + ".part";
  writeFileSync(part, JSON.stringify(value, null, 2) + "\n", "utf8");
  renameSync(part, target);
};
const nested = (value: Json, key: string) => (value[key] ?? {}) as Json;
const rows = (value: Json, key: string) => (value[key] ?? []) as Json[];

const v458 = read(paths.v458);
const v470 = read(paths.v470);
const v471 = read(paths.v471);
const v473 = read(paths.v473);
const v475 = read(paths.v475);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(String(formal.source));
const intakeInspect = nested(v458, "inspect");
const productionAdmission = nested(v458, "productionAdmission");
const dependencyAnalysis = nested(v470, "analysis");
const provenanceSummary = nested(v471, "summary");
const uncertaintySummary = nested(v473, "summary");
const v475Audit = nested(v475, "audit");
const scienceBuffer = nested(v475, "scienceBuffer");
const rootBlockers = rows(dependencyAnalysis, "rootBlockers");
const expectedMissing = [
  "identity",
  "plate-scale",
  "distortion",
  "psf",
  "pixel-response",
  "provenance",
];

if (
  v458.status !== "intake-protocol-qualified-staging-missing-measured-authority-blocked" ||
  canonicalSha(v458) !== v458.artifactSha256 ||
  intakeInspect.readyFileCount !== 0 ||
  JSON.stringify(intakeInspect.missingFileIds) !== JSON.stringify(expectedMissing) ||
  productionAdmission.measuredDetectorAuthorityGranted !== false ||
  productionAdmission.runtimeProjectionAllowed !== false ||
  v470.status !== "dependency-graph-qualified-authority-blocked-browser-pending" ||
  canonicalSha(v470) !== v470.artifactSha256 ||
  rootBlockers.length !== 3 ||
  !rootBlockers.some((entry) => entry.nodeId === "v458-measured-intake") ||
  !rootBlockers.some((entry) => entry.nodeId === "v314-dense-campaign") ||
  !rootBlockers.some((entry) => entry.nodeId === "heavy-qualification") ||
  v471.status !== "observable-provenance-qualified-production-blocked-browser-pending" ||
  canonicalSha(v471) !== v471.artifactSha256 ||
  provenanceSummary.productionAuthorityGrantedRowCount !== 0 ||
  provenanceSummary.sciencePixelRows !== 0 ||
  provenanceSummary.stokesMeasurementRows !== 0 ||
  v473.status !== "observable-uncertainty-qualified-production-ledger-open-browser-pending" ||
  canonicalSha(v473) !== v473.artifactSha256 ||
  uncertaintySummary.productionBudgetClosedCount !== 0 ||
  nested(v473, "productionLedger").status !== "open" ||
  v475.status !== "dual-render-boundary-qualified-browser-pending" ||
  canonicalShaV475(v475) !== v475.artifactSha256 ||
  scienceBuffer.rayIds === undefined ||
  (scienceBuffer.rayIds as unknown[]).length !== 4 ||
  v475Audit.presentationScientificFieldCount !== 0 ||
  v475Audit.classificationMutationCount !== 0 ||
  v475Audit.redshiftMutationCount !== 0 ||
  v475Audit.evpaMutationCount !== 0 ||
  v475Audit.intensityMutationCount !== 0 ||
  v475Audit.stokesMutationCount !== 0 ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.plannedShardCount !== 49 ||
  dense.attemptConsumed !== false ||
  dense.runNextAuthorized !== false ||
  dense.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  nested(formalEvidence, "science").defaultKernel !== "legacy-eih-1pn" ||
  nested(formalEvidence, "contracts").singleCanvas !== true ||
  nested(formalEvidence, "contracts").legacyRootAttributes !== 603 ||
  nested(formalEvidence, "contracts").evidenceLedgerClaims !== 84
) {
  throw new Error("v476-upstream-boundary");
}

const product = (
  id: KerrScienceProductRowV476["id"],
  label: string,
  status: KerrScienceProductRowV476["status"],
  available: boolean,
  sourceIds: readonly string[],
  blockedBy: readonly string[],
): KerrScienceProductRowV476 =>
  Object.freeze({
    id,
    label,
    status,
    available,
    authorityClass: available ? "sparse-short-authority" : "unavailable-production-authority",
    recordCount: available ? 4 : 0,
    sourceIds,
    blockedBy,
    placeholderAllowed: false,
    presentationFallbackMayGrantScienceAuthority: false,
    scienceWritebackAllowed: false,
  });

const products = Object.freeze([
  product(
    "sparse-observable-hud",
    "Sparse observable HUD",
    "available-sparse-authority",
    true,
    ["v475", "v471", "v473"],
    [],
  ),
  product(
    "sparse-vector-export",
    "Sparse vector export",
    "available-sparse-authority",
    true,
    ["v475"],
    [],
  ),
  product(
    "detector-projection",
    "Detector projection",
    "blocked-measured-detector-authority",
    false,
    ["v458", "v470"],
    ["measured-files-missing-6-of-6", "independent-validation-unavailable"],
  ),
  product(
    "observed-intensity",
    "Observed intensity",
    "blocked-measured-radiometry-authority",
    false,
    ["v466", "v468", "v471", "v473"],
    ["detector-throughput-unavailable", "background-read-noise-unavailable", "model-discrepancy-open"],
  ),
  product(
    "measured-stokes",
    "Measured Stokes I/Q/U/V",
    "blocked-measured-polarimeter-authority",
    false,
    ["v422", "v471", "v473"],
    ["measured-polarimeter-response-unavailable", "polarization-amplitude-unavailable"],
  ),
  product(
    "dense-transfer-map",
    "Dense transfer map",
    "blocked-dense-campaign-0-of-49",
    false,
    ["v314", "v470"],
    ["dense-campaign-incomplete-0-of-49", "aggregate-unavailable"],
  ),
  product(
    "science-raster",
    "Science raster",
    "blocked-production-admission",
    false,
    ["v458", "v463", "v471", "v473", "v314"],
    ["detector-projection-blocked", "dense-transfer-map-blocked", "production-budget-open"],
  ),
  product(
    "fits-science-image",
    "FITS science image",
    "blocked-no-science-raster",
    false,
    ["v471", "v473"],
    ["science-raster-unavailable", "pixel-uncertainty-unavailable"],
  ),
  product(
    "png-science-image",
    "PNG science image",
    "blocked-no-science-raster",
    false,
    ["v471", "v473", "v475"],
    ["science-raster-unavailable", "presentation-is-not-science-authority"],
  ),
]);

const source = {
  v458: fileSha(paths.v458),
  v470: fileSha(paths.v470),
  v471: fileSha(paths.v471),
  v473: fileSha(paths.v473),
  v475: fileSha(paths.v475),
  dense: fileSha(paths.dense),
};
const unsigned = {
  version: KERR_SCIENCE_PRODUCT_ADMISSION_ARTIFACT_VERSION_V476,
  generatedAt: "2026-07-30T00:00:00Z",
  status: "science-product-admission-qualified-production-images-blocked-browser-pending" as const,
  source,
  contract: {
    productCount: 9 as const,
    allowedProductCount: 2 as const,
    blockedProductCount: 7 as const,
    sparseScienceRowCount: 4 as const,
    requiredMeasuredFileCount: 6 as const,
    readyMeasuredFileCount: 0 as const,
    missingMeasuredFileCount: 6 as const,
    completedDenseShardCount: 0 as const,
    plannedDenseShardCount: 49 as const,
    productionBudgetClosedCount: 0 as const,
    boundedSummaryOnly: true as const,
    maximumResponseBytes: 131072 as const,
    localShadowOnly: true as const,
    formalProductPointer: "v263" as const,
  },
  blockers: {
    rootBlockerCount: 3 as const,
    measuredInput: {
      status: "missing-6-of-6" as const,
      missingFileIds: expectedMissing as [
        "identity",
        "plate-scale",
        "distortion",
        "psf",
        "pixel-response",
        "provenance",
      ],
      automaticActionAllowed: false as const,
    },
    denseCampaign: {
      status: "incomplete-0-of-49" as const,
      runNextAuthorized: false as const,
      automaticActionAllowed: false as const,
    },
    heavyQualification: {
      status: "not-run" as const,
      automaticActionAllowed: false as const,
    },
  },
  products,
  audit: {
    sparseObservableHudAllowed: true as const,
    sparseVectorExportAllowed: true as const,
    detectorProjectionAllowed: false as const,
    observedIntensityAvailable: false as const,
    measuredStokesAvailable: false as const,
    denseTransferMapAvailable: false as const,
    scienceRasterAllowed: false as const,
    fitsWriteAllowed: false as const,
    pngWriteAllowed: false as const,
    presentationToScienceConversionAllowed: false as const,
    placeholderMeasurementAllowed: false as const,
    unavailableIsNotZero: true as const,
    v475ScienceBufferMutationCount: 0 as const,
    v475PresentationScientificFieldCount: 0 as const,
  },
  lifecycle: {
    existingCanvasCount: 1 as const,
    newCanvasCreated: false as const,
    sceneRevisionDelta: 0 as const,
    workers: 0 as const,
    gpuBuffers: 0 as const,
    pipelines: 0 as const,
    textures: 0 as const,
    renderTargets: 0 as const,
    typedArrayCaches: 0 as const,
    objectUrls: 0 as const,
    cameraLeases: 0 as const,
    subscriptions: 0 as const,
    allResourcesAtBaseline: true as const,
  },
  boundary: {
    productionAuthorityGranted: false as const,
    productionPayloadAllowed: false as const,
    sciencePixelRows: 0 as const,
    stokesMeasurementRows: 0 as const,
    fitsImageRows: 0 as const,
    imageProductsGenerated: false as const,
    sciencePayloadMutationAllowed: false as const,
    cinematicScienceWritebackAllowed: false as const,
    networkAttempted: false as const,
    automaticRetryApplied: false as const,
    denseShardRunAllowed: false as const,
    browserQualification: "not-run" as const,
    visualMatrixQualification: "not-run" as const,
    soakQualification: "not-run" as const,
    rtxWebGpuQualification: "not-run" as const,
  },
  scienceBufferSha256: String(scienceBuffer.scienceBufferSha256),
  formalProductPointer: "v263" as const,
  formalDefaultKernel: "legacy-eih-1pn" as const,
};
const artifact = parseKerrScienceProductAdmissionArtifactV476({
  ...unsigned,
  artifactSha256: canonicalSha(unsigned),
});
atomic(paths.output, artifact);

console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      scienceBufferSha256: artifact.scienceBufferSha256,
      products: 9,
      allowed: 2,
      blocked: 7,
      measuredFiles: "0/6",
      denseCampaign: "0/49",
      productionBudgetsClosed: 0,
      sciencePixels: 0,
      stokesRows: 0,
      fitsRows: 0,
      presentationFallback: false,
      placeholders: false,
      browserQualification: "not-run",
    },
    null,
    2,
  ),
);

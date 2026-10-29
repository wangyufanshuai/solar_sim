export const KERR_SCIENCE_PRODUCT_ADMISSION_ARTIFACT_VERSION_V476 =
  "v476-kerr-science-product-admission-artifact-v1" as const;
export const KERR_SCIENCE_PRODUCT_ADMISSION_SUMMARY_VERSION_V476 =
  "v476-kerr-science-product-admission-summary-v1" as const;
export const KERR_SCIENCE_PRODUCT_ADMISSION_API_VERSION_V476 =
  "v476-kerr-science-product-admission-api-v1" as const;

const SHA256 = /^[a-f0-9]{64}$/;
const TRANSIENT = new Set([
  "generatedAt",
  "artifactSha256",
  "evidenceSha256",
  "pointerSha256",
]);
const freezeDeep = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) freezeDeep(child);
  }
  return value;
};
const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !TRANSIENT.has(key))
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
};
export const canonicalKerrScienceProductAdmissionV476 = (value: unknown): string =>
  JSON.stringify(canonicalize(value));

export const KERR_SCIENCE_PRODUCT_IDS_V476 = Object.freeze([
  "sparse-observable-hud",
  "sparse-vector-export",
  "detector-projection",
  "observed-intensity",
  "measured-stokes",
  "dense-transfer-map",
  "science-raster",
  "fits-science-image",
  "png-science-image",
] as const);
export type KerrScienceProductIdV476 = (typeof KERR_SCIENCE_PRODUCT_IDS_V476)[number];
export type KerrScienceProductStatusV476 =
  | "available-sparse-authority"
  | "blocked-measured-detector-authority"
  | "blocked-measured-radiometry-authority"
  | "blocked-measured-polarimeter-authority"
  | "blocked-dense-campaign-0-of-49"
  | "blocked-production-admission"
  | "blocked-no-science-raster";

export type KerrScienceProductRowV476 = Readonly<{
  id: KerrScienceProductIdV476;
  label: string;
  status: KerrScienceProductStatusV476;
  available: boolean;
  authorityClass: "sparse-short-authority" | "unavailable-production-authority";
  recordCount: number;
  sourceIds: readonly string[];
  blockedBy: readonly string[];
  placeholderAllowed: false;
  presentationFallbackMayGrantScienceAuthority: false;
  scienceWritebackAllowed: false;
}>;

export type KerrScienceProductAdmissionArtifactV476 = Readonly<{
  version: typeof KERR_SCIENCE_PRODUCT_ADMISSION_ARTIFACT_VERSION_V476;
  generatedAt: string;
  status: "science-product-admission-qualified-production-images-blocked-browser-pending";
  source: Readonly<Record<string, string>>;
  contract: Readonly<{
    productCount: 9;
    allowedProductCount: 2;
    blockedProductCount: 7;
    sparseScienceRowCount: 4;
    requiredMeasuredFileCount: 6;
    readyMeasuredFileCount: 0;
    missingMeasuredFileCount: 6;
    completedDenseShardCount: 0;
    plannedDenseShardCount: 49;
    productionBudgetClosedCount: 0;
    boundedSummaryOnly: true;
    maximumResponseBytes: 131072;
    localShadowOnly: true;
    formalProductPointer: "v263";
  }>;
  blockers: Readonly<{
    rootBlockerCount: 3;
    measuredInput: Readonly<{
      status: "missing-6-of-6";
      missingFileIds: readonly [
        "identity",
        "plate-scale",
        "distortion",
        "psf",
        "pixel-response",
        "provenance",
      ];
      automaticActionAllowed: false;
    }>;
    denseCampaign: Readonly<{
      status: "incomplete-0-of-49";
      runNextAuthorized: false;
      automaticActionAllowed: false;
    }>;
    heavyQualification: Readonly<{
      status: "not-run";
      automaticActionAllowed: false;
    }>;
  }>;
  products: readonly KerrScienceProductRowV476[];
  audit: Readonly<{
    sparseObservableHudAllowed: true;
    sparseVectorExportAllowed: true;
    detectorProjectionAllowed: false;
    observedIntensityAvailable: false;
    measuredStokesAvailable: false;
    denseTransferMapAvailable: false;
    scienceRasterAllowed: false;
    fitsWriteAllowed: false;
    pngWriteAllowed: false;
    presentationToScienceConversionAllowed: false;
    placeholderMeasurementAllowed: false;
    unavailableIsNotZero: true;
    v475ScienceBufferMutationCount: 0;
    v475PresentationScientificFieldCount: 0;
  }>;
  lifecycle: Readonly<{
    existingCanvasCount: 1;
    newCanvasCreated: false;
    sceneRevisionDelta: 0;
    workers: 0;
    gpuBuffers: 0;
    pipelines: 0;
    textures: 0;
    renderTargets: 0;
    typedArrayCaches: 0;
    objectUrls: 0;
    cameraLeases: 0;
    subscriptions: 0;
    allResourcesAtBaseline: true;
  }>;
  boundary: Readonly<{
    productionAuthorityGranted: false;
    productionPayloadAllowed: false;
    sciencePixelRows: 0;
    stokesMeasurementRows: 0;
    fitsImageRows: 0;
    imageProductsGenerated: false;
    sciencePayloadMutationAllowed: false;
    cinematicScienceWritebackAllowed: false;
    networkAttempted: false;
    automaticRetryApplied: false;
    denseShardRunAllowed: false;
    browserQualification: "not-run";
    visualMatrixQualification: "not-run";
    soakQualification: "not-run";
    rtxWebGpuQualification: "not-run";
  }>;
  scienceBufferSha256: string;
  formalProductPointer: "v263";
  formalDefaultKernel: "legacy-eih-1pn";
  artifactSha256: string;
}>;

export type KerrScienceProductAdmissionSummaryV476 = Readonly<{
  version: typeof KERR_SCIENCE_PRODUCT_ADMISSION_SUMMARY_VERSION_V476;
  status: KerrScienceProductAdmissionArtifactV476["status"];
  artifactSha256: string;
  scienceBufferSha256: string;
  contract: KerrScienceProductAdmissionArtifactV476["contract"];
  blockers: KerrScienceProductAdmissionArtifactV476["blockers"];
  products: KerrScienceProductAdmissionArtifactV476["products"];
  audit: KerrScienceProductAdmissionArtifactV476["audit"];
  lifecycle: KerrScienceProductAdmissionArtifactV476["lifecycle"];
  boundary: KerrScienceProductAdmissionArtifactV476["boundary"];
}>;

export type KerrScienceProductAdmissionRequestV476 = Readonly<{
  productId: KerrScienceProductIdV476;
  deliveryProfile: "local-shadow" | "standalone-full" | "vercel-lite";
  renderMode: "science" | "cinematic";
}>;

export type KerrScienceProductAdmissionDecisionV476 = Readonly<{
  productId: KerrScienceProductIdV476;
  allowed: boolean;
  reason: KerrScienceProductStatusV476 | "local-shadow-only" | "lite-boundary";
  scienceBufferSha256: string | null;
  recordCount: number;
  presentationFallbackUsed: false;
  placeholderUsed: false;
  scienceWritebackAllowed: false;
}>;

export type KerrScienceProductAdmissionApiV476 = Readonly<{
  version: typeof KERR_SCIENCE_PRODUCT_ADMISSION_API_VERSION_V476;
  available: boolean;
  reason:
    | "ready"
    | "lite-boundary"
    | "local-shadow-only"
    | "evidence-corrupt"
    | "request-failed";
  summary: KerrScienceProductAdmissionSummaryV476 | null;
}>;

export function resolveKerrScienceProductAdmissionV476(
  summary: KerrScienceProductAdmissionSummaryV476,
  request: KerrScienceProductAdmissionRequestV476,
): KerrScienceProductAdmissionDecisionV476 {
  const product = summary.products.find((entry) => entry.id === request.productId);
  if (!product) throw new Error("v476-product-id-unavailable");
  const profileReason =
    request.deliveryProfile === "vercel-lite"
      ? "lite-boundary"
      : request.deliveryProfile !== "local-shadow"
        ? "local-shadow-only"
        : null;
  if (profileReason) {
    return Object.freeze({
      productId: product.id,
      allowed: false,
      reason: profileReason,
      scienceBufferSha256: null,
      recordCount: 0,
      presentationFallbackUsed: false,
      placeholderUsed: false,
      scienceWritebackAllowed: false,
    });
  }
  return Object.freeze({
    productId: product.id,
    allowed: product.available,
    reason: product.status,
    scienceBufferSha256: product.available ? summary.scienceBufferSha256 : null,
    recordCount: product.available ? product.recordCount : 0,
    presentationFallbackUsed: false,
    placeholderUsed: false,
    scienceWritebackAllowed: false,
  });
}

export function parseKerrScienceProductAdmissionArtifactV476(
  value: unknown,
): KerrScienceProductAdmissionArtifactV476 {
  const artifact =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrScienceProductAdmissionArtifactV476>)
      : null;
  const products = artifact?.products ?? [];
  const allowed = products.filter((entry) => entry.available);
  const blocked = products.filter((entry) => !entry.available);
  if (
    !artifact ||
    artifact.version !== KERR_SCIENCE_PRODUCT_ADMISSION_ARTIFACT_VERSION_V476 ||
    artifact.status !== "science-product-admission-qualified-production-images-blocked-browser-pending" ||
    !artifact.source ||
    Object.values(artifact.source).some((sha) => !SHA256.test(sha)) ||
    artifact.contract?.productCount !== 9 ||
    artifact.contract.allowedProductCount !== 2 ||
    artifact.contract.blockedProductCount !== 7 ||
    artifact.contract.sparseScienceRowCount !== 4 ||
    artifact.contract.requiredMeasuredFileCount !== 6 ||
    artifact.contract.readyMeasuredFileCount !== 0 ||
    artifact.contract.missingMeasuredFileCount !== 6 ||
    artifact.contract.completedDenseShardCount !== 0 ||
    artifact.contract.plannedDenseShardCount !== 49 ||
    artifact.contract.productionBudgetClosedCount !== 0 ||
    artifact.contract.boundedSummaryOnly !== true ||
    artifact.contract.maximumResponseBytes !== 131072 ||
    artifact.contract.localShadowOnly !== true ||
    artifact.contract.formalProductPointer !== "v263" ||
    artifact.blockers?.rootBlockerCount !== 3 ||
    artifact.blockers.measuredInput.status !== "missing-6-of-6" ||
    JSON.stringify(artifact.blockers.measuredInput.missingFileIds) !==
      JSON.stringify(["identity", "plate-scale", "distortion", "psf", "pixel-response", "provenance"]) ||
    artifact.blockers.measuredInput.automaticActionAllowed !== false ||
    artifact.blockers.denseCampaign.status !== "incomplete-0-of-49" ||
    artifact.blockers.denseCampaign.runNextAuthorized !== false ||
    artifact.blockers.denseCampaign.automaticActionAllowed !== false ||
    artifact.blockers.heavyQualification.status !== "not-run" ||
    artifact.blockers.heavyQualification.automaticActionAllowed !== false ||
    products.length !== 9 ||
    JSON.stringify(products.map((entry) => entry.id)) !== JSON.stringify(KERR_SCIENCE_PRODUCT_IDS_V476) ||
    allowed.length !== 2 ||
    JSON.stringify(allowed.map((entry) => entry.id)) !==
      JSON.stringify(["sparse-observable-hud", "sparse-vector-export"]) ||
    blocked.length !== 7 ||
    products.some(
      (entry) =>
        entry.placeholderAllowed !== false ||
        entry.presentationFallbackMayGrantScienceAuthority !== false ||
        entry.scienceWritebackAllowed !== false ||
        (entry.available && (entry.status !== "available-sparse-authority" || entry.recordCount !== 4)) ||
        (!entry.available && (entry.blockedBy.length === 0 || entry.recordCount !== 0)),
    ) ||
    artifact.audit?.sparseObservableHudAllowed !== true ||
    artifact.audit.sparseVectorExportAllowed !== true ||
    artifact.audit.detectorProjectionAllowed !== false ||
    artifact.audit.observedIntensityAvailable !== false ||
    artifact.audit.measuredStokesAvailable !== false ||
    artifact.audit.denseTransferMapAvailable !== false ||
    artifact.audit.scienceRasterAllowed !== false ||
    artifact.audit.fitsWriteAllowed !== false ||
    artifact.audit.pngWriteAllowed !== false ||
    artifact.audit.presentationToScienceConversionAllowed !== false ||
    artifact.audit.placeholderMeasurementAllowed !== false ||
    artifact.audit.unavailableIsNotZero !== true ||
    artifact.audit.v475ScienceBufferMutationCount !== 0 ||
    artifact.audit.v475PresentationScientificFieldCount !== 0 ||
    artifact.lifecycle?.existingCanvasCount !== 1 ||
    artifact.lifecycle.newCanvasCreated !== false ||
    artifact.lifecycle.sceneRevisionDelta !== 0 ||
    artifact.lifecycle.allResourcesAtBaseline !== true ||
    [
      artifact.lifecycle.workers,
      artifact.lifecycle.gpuBuffers,
      artifact.lifecycle.pipelines,
      artifact.lifecycle.textures,
      artifact.lifecycle.renderTargets,
      artifact.lifecycle.typedArrayCaches,
      artifact.lifecycle.objectUrls,
      artifact.lifecycle.cameraLeases,
      artifact.lifecycle.subscriptions,
    ].some((count) => count !== 0) ||
    artifact.boundary?.productionAuthorityGranted !== false ||
    artifact.boundary.productionPayloadAllowed !== false ||
    artifact.boundary.sciencePixelRows !== 0 ||
    artifact.boundary.stokesMeasurementRows !== 0 ||
    artifact.boundary.fitsImageRows !== 0 ||
    artifact.boundary.imageProductsGenerated !== false ||
    artifact.boundary.sciencePayloadMutationAllowed !== false ||
    artifact.boundary.cinematicScienceWritebackAllowed !== false ||
    artifact.boundary.networkAttempted !== false ||
    artifact.boundary.automaticRetryApplied !== false ||
    artifact.boundary.denseShardRunAllowed !== false ||
    artifact.boundary.browserQualification !== "not-run" ||
    artifact.boundary.visualMatrixQualification !== "not-run" ||
    artifact.boundary.soakQualification !== "not-run" ||
    artifact.boundary.rtxWebGpuQualification !== "not-run" ||
    !SHA256.test(artifact.scienceBufferSha256 ?? "") ||
    artifact.formalProductPointer !== "v263" ||
    artifact.formalDefaultKernel !== "legacy-eih-1pn" ||
    !SHA256.test(artifact.artifactSha256 ?? "")
  ) {
    throw new Error("v476-science-product-admission-identity");
  }
  return freezeDeep(value as KerrScienceProductAdmissionArtifactV476);
}

export function createKerrScienceProductAdmissionSummaryV476(
  value: unknown,
): KerrScienceProductAdmissionSummaryV476 {
  const artifact = parseKerrScienceProductAdmissionArtifactV476(value);
  return freezeDeep({
    version: KERR_SCIENCE_PRODUCT_ADMISSION_SUMMARY_VERSION_V476,
    status: artifact.status,
    artifactSha256: artifact.artifactSha256,
    scienceBufferSha256: artifact.scienceBufferSha256,
    contract: artifact.contract,
    blockers: artifact.blockers,
    products: artifact.products,
    audit: artifact.audit,
    lifecycle: artifact.lifecycle,
    boundary: artifact.boundary,
  });
}

export function parseKerrScienceProductAdmissionApiV476(
  value: unknown,
): KerrScienceProductAdmissionApiV476 {
  const api =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrScienceProductAdmissionApiV476>)
      : null;
  if (
    !api ||
    api.version !== KERR_SCIENCE_PRODUCT_ADMISSION_API_VERSION_V476 ||
    typeof api.available !== "boolean" ||
    !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(
      api.reason ?? "",
    ) ||
    (api.available && (!api.summary || api.reason !== "ready")) ||
    (!api.available && api.summary !== null)
  ) {
    throw new Error("v476-science-product-admission-api-identity");
  }
  return freezeDeep(value as KerrScienceProductAdmissionApiV476);
}

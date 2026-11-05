export const KERR_SPARSE_SCIENCE_IMAGE_PRODUCTS_VERSION_V556 = "v556-kerr-sparse-science-image-products-v1" as const;
export const KERR_SPARSE_SCIENCE_IMAGE_PRODUCTS_API_VERSION_V556 = "v556-kerr-sparse-science-image-products-api-v1" as const;

const SHA = /^[0-9a-f]{64}$/;
const TRANSIENT = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256", "resultSha256"]);
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : !isRecord(value)
    ? value
    : Object.fromEntries(Object.entries(value).filter(([key]) => !TRANSIENT.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));

export const canonicalKerrSparseScienceImageProductsV556 = (value: unknown) => JSON.stringify(canonicalize(value));

export type KerrSparseScienceImageProductV556 = Readonly<{
  id: "png" | "fits";
  path: string;
  mimeType: string;
  fileSha256: string;
  bytes: number;
  channelOrder: "RGBA";
  pixelReadbackSha256: string;
  width?: 256;
  height?: 256;
  shape?: readonly [4, 256, 256];
  bitpix?: 8;
}>;

export type KerrSparseScienceImageProductsArtifactV556 = Readonly<{
  version: typeof KERR_SPARSE_SCIENCE_IMAGE_PRODUCTS_VERSION_V556;
  status: "qualified-sparse-authority-png-fits-dense-and-measured-incomplete";
  source: Readonly<{
    v555ArtifactPath: string;
    v555ArtifactFileSha256: string;
    v555ArtifactSha256: string;
    v555EvidenceSha256: string;
    payloadSha256: string;
    rasterSha256: string;
    csvSha256: string;
    validatorFileSha256: string;
    denseStateSha256: string;
  }>;
  contract: Readonly<{
    width: 256;
    height: 256;
    channelCount: 4;
    channelOrder: "RGBA";
    rawByteCount: 262144;
    scienceDisplayLinear: true;
    resizeAllowed: false;
    gradeAllowed: false;
    randomnessAllowed: false;
    exactPixelReadbackRequired: true;
    fitsChecksumRequired: true;
    denseAggregateRequiredForFullImage: true;
    measuredFrameRequiredForObservedImage: true;
  }>;
  products: readonly KerrSparseScienceImageProductV556[];
  validation: Readonly<{
    contractPath: string;
    contractFileSha256: string;
    receiptPath: string;
    receiptFileSha256: string;
    receiptResultSha256: string;
    independentSubprocessAttemptCount: 2;
    qualifiedSubprocessCount: 2;
    abCanonicalIdentical: true;
    rawPngFitsPixelBytesIdentical: true;
    fitsChecksumQualified: true;
  }>;
  mutationAudit: Readonly<{ mutationCount: 8; rejectedMutationCount: 8; mutations: readonly string[] }>;
  counts: Readonly<{
    sourceAuthorityRayCount: 16;
    sparseDisplayPixelCount: number;
    publishedProductCount: 2;
    publishedPixelByteCount: 262144;
    measuredPixelCount: 0;
    observedFrameCount: 0;
  }>;
  qualification: Readonly<{
    sparseAuthorityQualified: true;
    pngExactReadbackQualified: true;
    fitsExactReadbackQualified: true;
    sparsePngFitsQualified: true;
    denseScienceImageQualified: false;
    observedScienceImageQualified: false;
    measuredAuthorityGranted: false;
    productionPromotionQualified: false;
  }>;
  boundary: Readonly<{
    authorityKind: "v312-v313-short-gate-sparse";
    denseCampaignStatus: "incomplete-0-of-49";
    denseAggregateAvailable: false;
    measuredFrameAvailable: false;
    measuredValuesInvented: false;
    browserQualification: "not-run";
    localShadowOnly: true;
    formalProductPointer: "v263";
    formalDefaultKernel: "legacy-eih-1pn";
  }>;
  sourceManifest: readonly Readonly<{ path: string; sha256: string }>[];
  sourceSha256: string;
  artifactSha256: string;
}>;

export function parseKerrSparseScienceImageProductsV556(value: unknown): KerrSparseScienceImageProductsArtifactV556 {
  if (!isRecord(value) || value.version !== KERR_SPARSE_SCIENCE_IMAGE_PRODUCTS_VERSION_V556 || value.status !== "qualified-sparse-authority-png-fits-dense-and-measured-incomplete" || !SHA.test(String(value.artifactSha256)) || !SHA.test(String(value.sourceSha256))) throw new Error("v556-products-artifact-boundary");
  const artifact = value as unknown as KerrSparseScienceImageProductsArtifactV556;
  const png = artifact.products.find((product) => product.id === "png");
  const fits = artifact.products.find((product) => product.id === "fits");
  if (
    artifact.contract.width !== 256 || artifact.contract.height !== 256 || artifact.contract.channelCount !== 4 || artifact.contract.channelOrder !== "RGBA" || artifact.contract.rawByteCount !== 262144
    || artifact.contract.scienceDisplayLinear !== true || artifact.contract.resizeAllowed !== false || artifact.contract.gradeAllowed !== false || artifact.contract.randomnessAllowed !== false || artifact.contract.exactPixelReadbackRequired !== true || artifact.contract.fitsChecksumRequired !== true
    || artifact.products.length !== 2 || !png || !fits || !SHA.test(png.fileSha256) || !SHA.test(fits.fileSha256) || png.pixelReadbackSha256 !== artifact.source.rasterSha256 || fits.pixelReadbackSha256 !== artifact.source.rasterSha256 || png.width !== 256 || png.height !== 256 || JSON.stringify(fits.shape) !== JSON.stringify([4, 256, 256]) || fits.bitpix !== 8
    || artifact.validation.independentSubprocessAttemptCount !== 2 || artifact.validation.qualifiedSubprocessCount !== 2 || artifact.validation.abCanonicalIdentical !== true || artifact.validation.rawPngFitsPixelBytesIdentical !== true || artifact.validation.fitsChecksumQualified !== true
    || artifact.mutationAudit.mutationCount !== 8 || artifact.mutationAudit.rejectedMutationCount !== 8 || artifact.counts.sourceAuthorityRayCount !== 16 || artifact.counts.publishedProductCount !== 2 || artifact.counts.publishedPixelByteCount !== 262144 || artifact.counts.measuredPixelCount !== 0 || artifact.counts.observedFrameCount !== 0
    || artifact.qualification.sparseAuthorityQualified !== true || artifact.qualification.pngExactReadbackQualified !== true || artifact.qualification.fitsExactReadbackQualified !== true || artifact.qualification.sparsePngFitsQualified !== true || artifact.qualification.denseScienceImageQualified !== false || artifact.qualification.observedScienceImageQualified !== false || artifact.qualification.measuredAuthorityGranted !== false || artifact.qualification.productionPromotionQualified !== false
    || artifact.boundary.authorityKind !== "v312-v313-short-gate-sparse" || artifact.boundary.denseCampaignStatus !== "incomplete-0-of-49" || artifact.boundary.denseAggregateAvailable !== false || artifact.boundary.measuredFrameAvailable !== false || artifact.boundary.measuredValuesInvented !== false || artifact.boundary.browserQualification !== "not-run" || artifact.boundary.localShadowOnly !== true || artifact.boundary.formalProductPointer !== "v263" || artifact.boundary.formalDefaultKernel !== "legacy-eih-1pn"
  ) throw new Error("v556-products-qualification-boundary");
  for (const valueSha of [artifact.source.v555ArtifactFileSha256, artifact.source.v555ArtifactSha256, artifact.source.v555EvidenceSha256, artifact.source.payloadSha256, artifact.source.rasterSha256, artifact.source.csvSha256, artifact.source.validatorFileSha256, artifact.source.denseStateSha256, artifact.validation.contractFileSha256, artifact.validation.receiptFileSha256, artifact.validation.receiptResultSha256]) if (!SHA.test(valueSha)) throw new Error("v556-products-sha-boundary");
  return artifact;
}

export type KerrSparseScienceImageProductsApiV556 = Readonly<{
  version: typeof KERR_SPARSE_SCIENCE_IMAGE_PRODUCTS_API_VERSION_V556;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt";
  summary: KerrSparseScienceImageProductsArtifactV556 | null;
}>;

export function parseKerrSparseScienceImageProductsApiV556(value: unknown): KerrSparseScienceImageProductsApiV556 {
  if (!isRecord(value) || value.version !== KERR_SPARSE_SCIENCE_IMAGE_PRODUCTS_API_VERSION_V556 || typeof value.available !== "boolean" || !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt"].includes(String(value.reason))) throw new Error("v556-products-api-boundary");
  if (value.available) parseKerrSparseScienceImageProductsV556(value.summary);
  else if (value.summary !== null) throw new Error("v556-products-api-unavailable-summary");
  return value as unknown as KerrSparseScienceImageProductsApiV556;
}

export type KerrSparseScienceImageProductsHudModeV556 = "science" | "cinematic";
const scienceProfile = Object.freeze({ id: "science-cinematic-v10r4-v556" as const, mode: "science" as const, panel: "#020b12", raised: "#061923", ink: "#effcff", muted: "#7896a7", qualified: "#78eec3", warning: "#f2c371", unavailable: "#ff88a8", scienceBoundary: Object.freeze({ linearDisplay: true as const, bloomIntensity: 0 as const, colorGradeIntensity: 0 as const, scientificFieldMutation: false as const }), cinematicSeed: null });
const cinematicProfile = Object.freeze({ ...scienceProfile, mode: "cinematic" as const, panel: "#170906", raised: "#2b140d", ink: "#fff5e8", muted: "#bf9b80", scienceBoundary: Object.freeze({ linearDisplay: false as const, bloomIntensity: 0.02, colorGradeIntensity: 0.012, scientificFieldMutation: false as const }), cinematicSeed: "orbit-atlas-v556-product-hud-seed-01" });
export const resolveKerrSparseScienceImageProductsHudProfileV556 = (mode: KerrSparseScienceImageProductsHudModeV556) => mode === "science" ? scienceProfile : cinematicProfile;
export function createKerrSparseScienceImageProductsHudEncodingV556(artifact: KerrSparseScienceImageProductsArtifactV556, mode: KerrSparseScienceImageProductsHudModeV556) { return Object.freeze({ version: "v556-sparse-science-image-products-hud-v1" as const, mode, artifactKey: artifact.artifactSha256, payloadKey: artifact.source.payloadSha256, rasterKey: artifact.source.rasterSha256, pngKey: artifact.products.find((product) => product.id === "png")!.fileSha256, fitsKey: artifact.products.find((product) => product.id === "fits")!.fileSha256, productCount: 2 as const, denseQualified: false as const, measuredQualified: false as const, scientificFieldMutation: false as const }); }
export function compareKerrSparseScienceImageProductsHudEncodingsV556(science: ReturnType<typeof createKerrSparseScienceImageProductsHudEncodingV556>, cinematic: ReturnType<typeof createKerrSparseScienceImageProductsHudEncodingV556>) { if (science.mode !== "science" || cinematic.mode !== "cinematic" || science.artifactKey !== cinematic.artifactKey || science.payloadKey !== cinematic.payloadKey || science.rasterKey !== cinematic.rasterKey || science.pngKey !== cinematic.pngKey || science.fitsKey !== cinematic.fitsKey || science.productCount !== cinematic.productCount || science.denseQualified !== cinematic.denseQualified || science.measuredQualified !== cinematic.measuredQualified) throw new Error("v556-products-hud-boundary"); return Object.freeze({ payloadStable: true as const, rasterStable: true as const, productsStable: true as const, scientificFieldMutation: false as const }); }

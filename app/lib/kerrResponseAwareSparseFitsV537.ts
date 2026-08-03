export const KERR_RESPONSE_AWARE_SPARSE_FITS_VERSION_V537 = "v537-kerr-response-aware-sparse-fits-table-v1" as const;
export const KERR_RESPONSE_AWARE_SPARSE_FITS_API_VERSION_V537 = "v537-kerr-response-aware-sparse-fits-api-v1" as const;
export const KERR_RESPONSE_AWARE_SPARSE_FITS_HUD_PROFILE_ID_V537 = "science-cinematic-v8r6-v537" as const;

export type KerrResponseAwareSparseFitsArtifactV537 = Readonly<{
  version: typeof KERR_RESPONSE_AWARE_SPARSE_FITS_VERSION_V537;
  generatedAt: string;
  status: "sparse-fits-binary-table-qualified-image-hdu-unavailable";
  source: Readonly<{ v536ArtifactSha256: string; v536PayloadSha256: string }>;
  fits: Readonly<{
    path: "dist/science/kerr-response-aware-sparse-fits-v537/response-aware-sparse-table.fits";
    fileSha256: string;
    bytes: number;
    hduCount: 2;
    primaryNaxis: 0;
    imageHduCount: 0;
    binaryTableHduCount: 1;
    tableName: "SPARSE_SCIENCE";
    columnCount: 17;
    rowCount: 4;
    checksumCardCount: 4;
    checksumValidationPassed: true;
    abByteIdentical: true;
  }>;
  counts: Readonly<{
    sparseSampleCount: 4;
    pixelSampleCount: 0;
    rasterPixelCount: 0;
    fitsBinaryTableCount: 1;
    fitsImageHduCount: 0;
    pngImageCount: 0;
  }>;
  qualification: Readonly<{
    fitsBinaryTableQualified: true;
    columnUnitsQualified: true;
    rowShaReplayQualified: true;
    checksumQualified: true;
    deterministicReplayQualified: true;
    scienceImageQualified: false;
    productionImageQualified: false;
  }>;
  boundary: Readonly<{
    binaryTableIsNotImage: true;
    physicalUncertaintyAvailable: false;
    measuredCalibrationFiles: 0;
    sciencePayloadMutationAllowed: false;
    cinematicScienceWritebackAllowed: false;
    denseCampaignStatus: "incomplete-0-of-49";
    browserQualification: "not-run";
    formalProductPointer: "v263";
    formalDefaultKernel: "legacy-eih-1pn";
  }>;
  sourceManifest: readonly Readonly<{ path: string; sha256: string }>[];
  sourceSha256: string;
  artifactSha256: string;
}>;

export type KerrResponseAwareSparseFitsSummaryV537 = Omit<KerrResponseAwareSparseFitsArtifactV537, "generatedAt" | "sourceManifest" | "sourceSha256">;
export type KerrResponseAwareSparseFitsApiV537 = Readonly<{
  version: typeof KERR_RESPONSE_AWARE_SPARSE_FITS_API_VERSION_V537;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt";
  summary: KerrResponseAwareSparseFitsSummaryV537 | null;
}>;
export type KerrResponseAwareSparseFitsHudModeV537 = "science" | "cinematic";
export type KerrResponseAwareSparseFitsHudProfileV537 = Readonly<{
  id: typeof KERR_RESPONSE_AWARE_SPARSE_FITS_HUD_PROFILE_ID_V537;
  mode: KerrResponseAwareSparseFitsHudModeV537;
  panel: string;
  panelRaised: string;
  ink: string;
  muted: string;
  qualified: string;
  unavailable: string;
  localShadowOnly: true;
  defaultApplied: false;
  scienceBoundary: Readonly<{
    linearDisplay: boolean;
    bloomIntensity: number;
    colorGradeIntensity: number;
    numericScientificStyleInputCount: 0;
    scientificFieldMutation: false;
  }>;
  cinematicSeed: string | null;
}>;

const SHA = /^[a-f0-9]{64}$/;
const TRANSIENT = new Set(["generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256"]);
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const compare = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;
const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : !isRecord(value)
    ? value
    : Object.fromEntries(Object.entries(value)
      .filter(([key]) => !TRANSIENT.has(key))
      .sort(([left], [right]) => compare(left, right))
      .map(([key, entry]) => [key, canonicalize(entry)]));

export const canonicalKerrResponseAwareSparseFitsV537 = (value: unknown) => JSON.stringify(canonicalize(value));

function validateCore(value: Partial<KerrResponseAwareSparseFitsArtifactV537>): boolean {
  const fits = value.fits;
  const counts = value.counts;
  const qualification = value.qualification;
  const boundary = value.boundary;
  return value.version === KERR_RESPONSE_AWARE_SPARSE_FITS_VERSION_V537
    && value.status === "sparse-fits-binary-table-qualified-image-hdu-unavailable"
    && SHA.test(value.source?.v536ArtifactSha256 ?? "")
    && SHA.test(value.source?.v536PayloadSha256 ?? "")
    && fits?.path === "dist/science/kerr-response-aware-sparse-fits-v537/response-aware-sparse-table.fits"
    && SHA.test(fits.fileSha256)
    && Number.isSafeInteger(fits.bytes) && fits.bytes > 0 && fits.bytes <= 1024 * 1024
    && fits.hduCount === 2 && fits.primaryNaxis === 0 && fits.imageHduCount === 0
    && fits.binaryTableHduCount === 1 && fits.tableName === "SPARSE_SCIENCE"
    && fits.columnCount === 17 && fits.rowCount === 4 && fits.checksumCardCount === 4
    && fits.checksumValidationPassed === true && fits.abByteIdentical === true
    && counts?.sparseSampleCount === 4 && counts.pixelSampleCount === 0
    && counts.rasterPixelCount === 0 && counts.fitsBinaryTableCount === 1
    && counts.fitsImageHduCount === 0 && counts.pngImageCount === 0
    && qualification?.fitsBinaryTableQualified === true && qualification.columnUnitsQualified === true
    && qualification.rowShaReplayQualified === true && qualification.checksumQualified === true
    && qualification.deterministicReplayQualified === true && qualification.scienceImageQualified === false
    && qualification.productionImageQualified === false
    && boundary?.binaryTableIsNotImage === true && boundary.physicalUncertaintyAvailable === false
    && boundary.measuredCalibrationFiles === 0 && boundary.sciencePayloadMutationAllowed === false
    && boundary.cinematicScienceWritebackAllowed === false && boundary.denseCampaignStatus === "incomplete-0-of-49"
    && boundary.browserQualification === "not-run" && boundary.formalProductPointer === "v263"
    && boundary.formalDefaultKernel === "legacy-eih-1pn"
    && SHA.test(value.artifactSha256 ?? "");
}

export function parseKerrResponseAwareSparseFitsArtifactV537(value: unknown): KerrResponseAwareSparseFitsArtifactV537 {
  if (!isRecord(value) || !validateCore(value as Partial<KerrResponseAwareSparseFitsArtifactV537>)) throw new Error("v537-sparse-fits-boundary");
  const artifact = value as unknown as KerrResponseAwareSparseFitsArtifactV537;
  if (!Array.isArray(artifact.sourceManifest) || artifact.sourceManifest.some((entry) => !entry.path || !SHA.test(entry.sha256)) || !SHA.test(artifact.sourceSha256)) throw new Error("v537-sparse-fits-manifest");
  return artifact;
}

export function createKerrResponseAwareSparseFitsSummaryV537(value: unknown): KerrResponseAwareSparseFitsSummaryV537 {
  const artifact = parseKerrResponseAwareSparseFitsArtifactV537(value);
  const summary = { ...artifact } as Record<string, unknown>;
  delete summary.generatedAt;
  delete summary.sourceManifest;
  delete summary.sourceSha256;
  return Object.freeze(summary) as unknown as KerrResponseAwareSparseFitsSummaryV537;
}

export function parseKerrResponseAwareSparseFitsApiV537(value: unknown): KerrResponseAwareSparseFitsApiV537 {
  if (!isRecord(value) || value.version !== KERR_RESPONSE_AWARE_SPARSE_FITS_API_VERSION_V537 || typeof value.available !== "boolean" || !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt"].includes(String(value.reason))) throw new Error("v537-api-boundary");
  if (value.available) {
    if (!isRecord(value.summary) || !validateCore(value.summary as Partial<KerrResponseAwareSparseFitsArtifactV537>)) throw new Error("v537-api-summary");
  } else if (value.summary !== null) throw new Error("v537-api-unavailable-summary");
  return value as unknown as KerrResponseAwareSparseFitsApiV537;
}

const scienceProfile: KerrResponseAwareSparseFitsHudProfileV537 = Object.freeze({
  id: KERR_RESPONSE_AWARE_SPARSE_FITS_HUD_PROFILE_ID_V537,
  mode: "science",
  panel: "#02080a",
  panelRaised: "#07131a",
  ink: "#effdff",
  muted: "#78959c",
  qualified: "#74f4c5",
  unavailable: "#ff91ad",
  localShadowOnly: true,
  defaultApplied: false,
  scienceBoundary: Object.freeze({ linearDisplay: true, bloomIntensity: 0, colorGradeIntensity: 0, numericScientificStyleInputCount: 0, scientificFieldMutation: false }),
  cinematicSeed: null,
});
const cinematicProfile: KerrResponseAwareSparseFitsHudProfileV537 = Object.freeze({
  ...scienceProfile,
  mode: "cinematic",
  panel: "#100907",
  panelRaised: "#1b130f",
  ink: "#fff7ea",
  muted: "#b09a84",
  qualified: "#8ff5ca",
  unavailable: "#ff96b2",
  scienceBoundary: Object.freeze({ linearDisplay: false, bloomIntensity: 0.05, colorGradeIntensity: 0.035, numericScientificStyleInputCount: 0, scientificFieldMutation: false }),
  cinematicSeed: "orbit-atlas-v537-sparse-fits-provenance-seed-01",
});
export const resolveKerrResponseAwareSparseFitsHudProfileV537 = (mode: KerrResponseAwareSparseFitsHudModeV537) => mode === "science" ? scienceProfile : cinematicProfile;

export function createKerrResponseAwareSparseFitsHudEncodingV537(summary: KerrResponseAwareSparseFitsSummaryV537, mode: KerrResponseAwareSparseFitsHudModeV537) {
  if (!SHA.test(summary.artifactSha256) || !SHA.test(summary.fits.fileSha256)) throw new Error("v537-hud-source");
  return Object.freeze({
    version: "v537-response-aware-sparse-fits-hud-v1" as const,
    profileId: KERR_RESPONSE_AWARE_SPARSE_FITS_HUD_PROFILE_ID_V537,
    mode,
    scientificPayloadKey: summary.source.v536PayloadSha256,
    tableArtifactKey: summary.artifactSha256,
    fitsFileKey: summary.fits.fileSha256,
    rowCount: 4 as const,
    columnCount: 17 as const,
    imageHduCount: 0 as const,
    numericScientificStyleInputCount: 0 as const,
    scientificFieldMutation: false as const,
  });
}

export function compareKerrResponseAwareSparseFitsHudEncodingsV537(science: ReturnType<typeof createKerrResponseAwareSparseFitsHudEncodingV537>, cinematic: ReturnType<typeof createKerrResponseAwareSparseFitsHudEncodingV537>) {
  if (science.mode !== "science" || cinematic.mode !== "cinematic" || science.scientificPayloadKey !== cinematic.scientificPayloadKey || science.tableArtifactKey !== cinematic.tableArtifactKey || science.fitsFileKey !== cinematic.fitsFileKey) throw new Error("v537-hud-boundary");
  return Object.freeze({ scientificPayloadStable: true as const, binaryTableStable: true as const, rowCount: 4 as const, columnCount: 17 as const, imageHduCount: 0 as const, numericScientificStyleInputCount: 0 as const, scientificFieldMutation: false as const });
}

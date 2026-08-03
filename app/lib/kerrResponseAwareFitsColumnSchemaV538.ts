export const KERR_RESPONSE_AWARE_FITS_COLUMN_SCHEMA_VERSION_V538 = "v538-kerr-response-aware-fits-column-schema-v1" as const;
export const KERR_RESPONSE_AWARE_FITS_COLUMN_SCHEMA_API_VERSION_V538 = "v538-kerr-response-aware-fits-column-schema-api-v1" as const;
export const KERR_RESPONSE_AWARE_FITS_COLUMN_SCHEMA_HUD_PROFILE_ID_V538 = "science-cinematic-v8r7-v538" as const;
export const KERR_RESPONSE_AWARE_FITS_COLUMN_NAMES_V538 = Object.freeze(["RAY_ID", "RAY_INDEX", "SPIN_A", "X_CONT", "Y_CONT", "ALPHA_M", "BETA_M", "REDSHIFT", "EVPA_DEG", "Q_HAT", "U_HAT", "PHOT_RAD", "RESP_J", "NONLIN", "PHYS_UNC", "PIXEL", "ROW_SHA"] as const);

export type KerrResponseAwareFitsColumnNameV538 = typeof KERR_RESPONSE_AWARE_FITS_COLUMN_NAMES_V538[number];
export type KerrResponseAwareFitsColumnV538 = Readonly<{
  ordinal: number;
  name: KerrResponseAwareFitsColumnNameV538;
  format: string;
  fitsUnit: string | null;
  unitSemantic: string;
  valueKind: "ascii-string" | "signed-int32" | "float64" | "logical";
  semantic: string;
  applicability: string;
  missingness: string;
  domain: string;
  observed: Readonly<{ rowCount: number; finiteCount: number; minimum: number | null; maximum: number | null; uniqueCount: number; trueCount?: number; falseCount?: number }>;
  formatQualified: true;
  unitQualified: true;
  domainQualified: true;
  columnSha256: string;
}>;
export type KerrResponseAwareFitsColumnSchemaArtifactV538 = Readonly<{
  version: typeof KERR_RESPONSE_AWARE_FITS_COLUMN_SCHEMA_VERSION_V538;
  generatedAt: string;
  status: "fits-column-semantics-qualified-physical-uncertainty-unavailable";
  source: Readonly<{ v537ArtifactSha256: string; v537FitsFileSha256: string; v536PayloadSha256: string }>;
  contract: Readonly<{ columnCount: 17; rowCount: 4; columnOrderLocked: true; fitsFormatLocked: true; fitsUnitLocked: true; unitSemanticExplicit: true; applicabilityExplicit: true; missingnessExplicit: true; domainValidationRequired: true; columnShaRequired: true; rowShaReplayRequired: true }>;
  table: Readonly<{ extensionName: "SPARSE_SCIENCE"; naxis1RowBytes: 182; naxis2Rows: 4; pcount: 0; gcount: 1; primaryNaxis: 0; binaryTableHduCount: 1; imageHduCount: 0 }>;
  columns: readonly KerrResponseAwareFitsColumnV538[];
  invariants: Readonly<{ rowIdentityReplayQualified: true; maximumOrientationUnitNormResidual: number; orientationUnitNormLimit: 1e-15; checksumAndDatasumQualified: true; continuousCoordinatesArePixelSamples: false; physicalUncertaintyFalseMeansZeroUncertainty: false; pixelFalseMeansZeroValuedPixel: false }>;
  counts: Readonly<{ qualifiedColumnCount: 17; dimensionlessSemanticColumnCount: 6; explicitPhysicalUnitColumnCount: 6; identifierOrFlagColumnCount: 5; applicabilityStatementCount: 17; missingnessStatementCount: 17; physicalUncertaintyValueCount: 0; pixelSampleCount: 0; rasterPixelCount: 0; fitsImageHduCount: 0; pngImageCount: 0 }>;
  qualification: Readonly<{ columnSchemaQualified: true; fitsFormatQualified: true; fitsUnitQualified: true; domainQualified: true; applicabilityQualified: true; missingnessQualified: true; crossColumnInvariantQualified: true; scienceImageQualified: false; physicalUncertaintyQualified: false }>;
  boundary: Readonly<{ schemaDoesNotCreateNewMeasurement: true; schemaDoesNotCreatePixelSamples: true; physicalUncertaintyAvailable: false; measuredCalibrationFiles: 0; requiredMeasuredCalibrationFiles: 6; sciencePayloadMutationAllowed: false; cinematicScienceWritebackAllowed: false; denseCampaignStatus: "incomplete-0-of-49"; browserQualification: "not-run"; formalProductPointer: "v263"; formalDefaultKernel: "legacy-eih-1pn" }>;
  export: Readonly<{ csvPath: "dist/science/kerr-response-aware-fits-column-schema-v538/column-schema.csv"; csvFileSha256: string; rowCount: 17 }>;
  sourceManifest: readonly Readonly<{ path: string; sha256: string }>[];
  sourceSha256: string;
  artifactSha256: string;
}>;
export type KerrResponseAwareFitsColumnSchemaSummaryV538 = Omit<KerrResponseAwareFitsColumnSchemaArtifactV538, "generatedAt" | "sourceManifest" | "sourceSha256">;
export type KerrResponseAwareFitsColumnSchemaApiV538 = Readonly<{ version: typeof KERR_RESPONSE_AWARE_FITS_COLUMN_SCHEMA_API_VERSION_V538; available: boolean; reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt"; summary: KerrResponseAwareFitsColumnSchemaSummaryV538 | null }>;
export type KerrResponseAwareFitsColumnSchemaHudModeV538 = "science" | "cinematic";

const SHA = /^[a-f0-9]{64}$/;
const TRANSIENT = new Set(["generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256", "columnSha256"]);
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const compare = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !isRecord(value) ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !TRANSIENT.has(key)).sort(([left], [right]) => compare(left, right)).map(([key, entry]) => [key, canonicalize(entry)]));
export const canonicalKerrResponseAwareFitsColumnSchemaV538 = (value: unknown) => JSON.stringify(canonicalize(value));

function validCore(value: Partial<KerrResponseAwareFitsColumnSchemaArtifactV538>): boolean {
  const columns = value.columns;
  return value.version === KERR_RESPONSE_AWARE_FITS_COLUMN_SCHEMA_VERSION_V538
    && value.status === "fits-column-semantics-qualified-physical-uncertainty-unavailable"
    && Object.values(value.source ?? {}).length === 3 && Object.values(value.source ?? {}).every((entry) => SHA.test(entry))
    && value.contract?.columnCount === 17 && value.contract.rowCount === 4 && value.contract.columnOrderLocked === true
    && value.contract.fitsFormatLocked === true && value.contract.fitsUnitLocked === true && value.contract.unitSemanticExplicit === true
    && value.contract.applicabilityExplicit === true && value.contract.missingnessExplicit === true && value.contract.domainValidationRequired === true
    && value.table?.extensionName === "SPARSE_SCIENCE" && value.table.naxis1RowBytes === 182 && value.table.naxis2Rows === 4
    && value.table.pcount === 0 && value.table.gcount === 1 && value.table.primaryNaxis === 0 && value.table.binaryTableHduCount === 1 && value.table.imageHduCount === 0
    && columns?.length === 17 && columns.every((column, index) => column.ordinal === index + 1 && column.name === KERR_RESPONSE_AWARE_FITS_COLUMN_NAMES_V538[index]
      && Boolean(column.format) && Boolean(column.unitSemantic) && Boolean(column.semantic) && Boolean(column.applicability) && Boolean(column.missingness) && Boolean(column.domain)
      && column.observed.rowCount === 4 && column.observed.finiteCount === 4 && column.formatQualified === true && column.unitQualified === true && column.domainQualified === true && SHA.test(column.columnSha256))
    && value.invariants?.rowIdentityReplayQualified === true && Number.isFinite(value.invariants.maximumOrientationUnitNormResidual)
    && value.invariants.maximumOrientationUnitNormResidual < 1e-15 && value.invariants.orientationUnitNormLimit === 1e-15
    && value.invariants.checksumAndDatasumQualified === true && value.invariants.continuousCoordinatesArePixelSamples === false
    && value.invariants.physicalUncertaintyFalseMeansZeroUncertainty === false && value.invariants.pixelFalseMeansZeroValuedPixel === false
    && value.counts?.qualifiedColumnCount === 17 && value.counts.dimensionlessSemanticColumnCount === 6 && value.counts.explicitPhysicalUnitColumnCount === 6
    && value.counts.identifierOrFlagColumnCount === 5 && value.counts.applicabilityStatementCount === 17 && value.counts.missingnessStatementCount === 17
    && value.counts.physicalUncertaintyValueCount === 0 && value.counts.pixelSampleCount === 0 && value.counts.rasterPixelCount === 0 && value.counts.fitsImageHduCount === 0 && value.counts.pngImageCount === 0
    && value.qualification?.columnSchemaQualified === true && value.qualification.fitsFormatQualified === true && value.qualification.fitsUnitQualified === true
    && value.qualification.domainQualified === true && value.qualification.applicabilityQualified === true && value.qualification.missingnessQualified === true
    && value.qualification.crossColumnInvariantQualified === true && value.qualification.scienceImageQualified === false && value.qualification.physicalUncertaintyQualified === false
    && value.boundary?.schemaDoesNotCreateNewMeasurement === true && value.boundary.schemaDoesNotCreatePixelSamples === true
    && value.boundary.physicalUncertaintyAvailable === false && value.boundary.measuredCalibrationFiles === 0 && value.boundary.requiredMeasuredCalibrationFiles === 6
    && value.boundary.sciencePayloadMutationAllowed === false && value.boundary.cinematicScienceWritebackAllowed === false
    && value.boundary.denseCampaignStatus === "incomplete-0-of-49" && value.boundary.browserQualification === "not-run"
    && value.boundary.formalProductPointer === "v263" && value.boundary.formalDefaultKernel === "legacy-eih-1pn"
    && value.export?.csvPath === "dist/science/kerr-response-aware-fits-column-schema-v538/column-schema.csv" && SHA.test(value.export.csvFileSha256) && value.export.rowCount === 17
    && SHA.test(value.artifactSha256 ?? "");
}

export function parseKerrResponseAwareFitsColumnSchemaArtifactV538(value: unknown): KerrResponseAwareFitsColumnSchemaArtifactV538 {
  if (!isRecord(value) || !validCore(value as Partial<KerrResponseAwareFitsColumnSchemaArtifactV538>)) throw new Error("v538-column-schema-boundary");
  const artifact = value as unknown as KerrResponseAwareFitsColumnSchemaArtifactV538;
  if (!Array.isArray(artifact.sourceManifest) || artifact.sourceManifest.some((entry) => !entry.path || !SHA.test(entry.sha256)) || !SHA.test(artifact.sourceSha256)) throw new Error("v538-column-schema-manifest");
  return artifact;
}
export function createKerrResponseAwareFitsColumnSchemaSummaryV538(value: unknown): KerrResponseAwareFitsColumnSchemaSummaryV538 {
  const artifact = parseKerrResponseAwareFitsColumnSchemaArtifactV538(value);
  const summary = { ...artifact } as Record<string, unknown>;
  delete summary.generatedAt;
  delete summary.sourceManifest;
  delete summary.sourceSha256;
  return Object.freeze(summary) as unknown as KerrResponseAwareFitsColumnSchemaSummaryV538;
}
export function parseKerrResponseAwareFitsColumnSchemaApiV538(value: unknown): KerrResponseAwareFitsColumnSchemaApiV538 {
  if (!isRecord(value) || value.version !== KERR_RESPONSE_AWARE_FITS_COLUMN_SCHEMA_API_VERSION_V538 || typeof value.available !== "boolean" || !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt"].includes(String(value.reason))) throw new Error("v538-api-boundary");
  if (value.available) { if (!isRecord(value.summary) || !validCore(value.summary as Partial<KerrResponseAwareFitsColumnSchemaArtifactV538>)) throw new Error("v538-api-summary"); }
  else if (value.summary !== null) throw new Error("v538-api-unavailable-summary");
  return value as unknown as KerrResponseAwareFitsColumnSchemaApiV538;
}

const scienceProfile = Object.freeze({ id: KERR_RESPONSE_AWARE_FITS_COLUMN_SCHEMA_HUD_PROFILE_ID_V538, mode: "science" as const, panel: "#02080a", panelRaised: "#07131a", ink: "#effdff", muted: "#78959c", qualified: "#74f4c5", unavailable: "#ff91ad", localShadowOnly: true as const, defaultApplied: false as const, scienceBoundary: Object.freeze({ linearDisplay: true, bloomIntensity: 0, colorGradeIntensity: 0, numericScientificStyleInputCount: 0 as const, scientificFieldMutation: false as const }), cinematicSeed: null as string | null });
const cinematicProfile = Object.freeze({ ...scienceProfile, mode: "cinematic" as const, panel: "#100907", panelRaised: "#1b130f", ink: "#fff7ea", muted: "#b09a84", qualified: "#8ff5ca", unavailable: "#ff96b2", scienceBoundary: Object.freeze({ linearDisplay: false, bloomIntensity: 0.05, colorGradeIntensity: 0.035, numericScientificStyleInputCount: 0 as const, scientificFieldMutation: false as const }), cinematicSeed: "orbit-atlas-v538-fits-column-semantics-seed-01" });
export const resolveKerrResponseAwareFitsColumnSchemaHudProfileV538 = (mode: KerrResponseAwareFitsColumnSchemaHudModeV538) => mode === "science" ? scienceProfile : cinematicProfile;
export function createKerrResponseAwareFitsColumnSchemaHudEncodingV538(summary: KerrResponseAwareFitsColumnSchemaSummaryV538, mode: KerrResponseAwareFitsColumnSchemaHudModeV538) {
  if (!SHA.test(summary.artifactSha256) || !SHA.test(summary.export.csvFileSha256)) throw new Error("v538-hud-source");
  return Object.freeze({ version: "v538-response-aware-fits-column-schema-hud-v1" as const, profileId: KERR_RESPONSE_AWARE_FITS_COLUMN_SCHEMA_HUD_PROFILE_ID_V538, mode, scientificPayloadKey: summary.source.v536PayloadSha256, fitsFileKey: summary.source.v537FitsFileSha256, schemaArtifactKey: summary.artifactSha256, columns: summary.columns, qualifiedColumnCount: 17 as const, physicalUncertaintyValueCount: 0 as const, pixelSampleCount: 0 as const, imageHduCount: 0 as const, numericScientificStyleInputCount: 0 as const, scientificFieldMutation: false as const });
}
export function compareKerrResponseAwareFitsColumnSchemaHudEncodingsV538(science: ReturnType<typeof createKerrResponseAwareFitsColumnSchemaHudEncodingV538>, cinematic: ReturnType<typeof createKerrResponseAwareFitsColumnSchemaHudEncodingV538>) {
  if (science.mode !== "science" || cinematic.mode !== "cinematic" || science.scientificPayloadKey !== cinematic.scientificPayloadKey || science.fitsFileKey !== cinematic.fitsFileKey || science.schemaArtifactKey !== cinematic.schemaArtifactKey || JSON.stringify(science.columns) !== JSON.stringify(cinematic.columns)) throw new Error("v538-hud-boundary");
  return Object.freeze({ scientificPayloadStable: true as const, fitsFileStable: true as const, columnSchemaStable: true as const, qualifiedColumnCount: 17 as const, physicalUncertaintyValueCount: 0 as const, imageHduCount: 0 as const, scientificFieldMutation: false as const });
}

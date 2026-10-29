export const KERR_INDEPENDENT_FITS_VALIDATION_VERSION_V546 = "v546-kerr-independent-fits-validation-artifact-v1" as const;
export const KERR_INDEPENDENT_FITS_VALIDATION_API_VERSION_V546 = "v546-kerr-independent-fits-validation-api-v1" as const;
export const KERR_INDEPENDENT_FITS_HUD_PROFILE_ID_V546 = "science-cinematic-v9r5-v546" as const;

const SHA = /^[0-9a-f]{64}$/;
const TRANSIENT = new Set([
  "generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256",
  "stageChainSha256", "columnSha256", "receiptSha256", "resultSha256", "environmentSha256",
  "preflightSha256", "matrixSha256", "isolatedReceiptSha256", "executionMatrixSha256", "schemaPackSha256",
]);
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : !isRecord(value)
    ? value
    : Object.fromEntries(Object.entries(value).filter(([key]) => !TRANSIENT.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
export const canonicalKerrIndependentFitsValidationV546 = (value: unknown) => JSON.stringify(canonicalize(value));

export type KerrIndependentFitsValidationReceiptV546 = Readonly<{
  version: "v546-independent-fits-validation-receipt-v1";
  status: "synthetic-fixture-semantically-qualified-nonauthoritative";
  environment: Readonly<{ pythonImplementation: string; pythonVersion: string; numpyVersion: string; astropyVersion: string }>;
  candidate: Readonly<{ contentClass: "synthetic-validation-fixture"; fileCount: 5; totalBytes: number; fileSha256: Readonly<Record<"collectingArea" | "exposureRecord" | "spectralResponse" | "observedFrame", string>> }>;
  checks: Readonly<{ exactWhitelistQualified: true; regularFilesQualified: true; crossFileIdentityQualified: true; spectralResponseRowCount: 81; spectralBandCount: 3; fitsHduCount: 1; fitsImageHduCount: 1; fitsWidthPixels: number; fitsHeightPixels: number; fitsPixelCount: number; fitsBitpix: number; fitsChecksumQualified: true; fitsHeaderLinkageQualified: true; provenanceShaLinkageQualified: true; networkAttemptCount: 0; absolutePathStored: false }>;
  qualification: Readonly<{ independentFitsSemanticValidationQualified: true; candidateReadyForBlindAuthorityReview: false; syntheticAuthorityGranted: false; measuredAuthorityGranted: false; scienceRasterQualified: false; productionPromotionQualified: false }>;
  boundary: Readonly<{ pixelValuesStoredInReceipt: false; fitsFilePublished: false; sciencePayloadMutationAllowed: false; denseCampaignStatus: "incomplete-0-of-49"; formalProductPointer: "v263"; formalDefaultKernel: "legacy-eih-1pn" }>;
  resultSha256: string;
}>;

export type KerrIndependentFitsValidationArtifactV546 = Readonly<{
  version: typeof KERR_INDEPENDENT_FITS_VALIDATION_VERSION_V546;
  status: "independent-fits-semantic-validator-qualified-synthetic-nonauthoritative-measured-inputs-missing";
  source: Readonly<Record<"v545ArtifactSha256" | "v545EvidenceSha256" | "v545PointerSha256" | "v314StateSha256" | "validatorFileSha256", string>>;
  environment: KerrIndependentFitsValidationReceiptV546["environment"];
  validation: Readonly<{ receipt: KerrIndependentFitsValidationReceiptV546; receiptPath: string; receiptFileSha256: string; receiptCanonicalSha256: string; independentSubprocessAttemptCount: 2; qualifiedSubprocessCount: 2; abCanonicalIdentical: true; temporaryDirectoryLeakCount: 0; workspaceImportCount: 0; networkAttemptCount: 0 }>;
  mutationAudit: Readonly<{ mutationCount: 8; rejectedMutationCount: 8; mutations: readonly string[] }>;
  counts: Readonly<{ publishedCandidateFileCount: 0; publishedFitsFileCount: 0; publishedPixelValueCount: 0; measuredCandidateCount: 0; syntheticControlCount: 1; independentValidationReceiptCount: 1 }>;
  qualification: Readonly<{ independentFitsSemanticValidatorQualified: true; syntheticControlQualified: true; syntheticAuthorityGranted: false; measuredCandidateSemanticallyQualified: false; measuredAuthorityGranted: false; scienceRasterQualified: false; productionPromotionQualified: false }>;
  boundary: Readonly<{ syntheticCandidatePersisted: false; pixelValuesStoredInArtifact: false; fitsFilePublished: false; measuredValuesInvented: false; sciencePayloadMutationAllowed: false; cinematicScienceWritebackAllowed: false; denseCampaignStatus: "incomplete-0-of-49"; browserQualification: "not-run"; formalProductPointer: "v263"; formalDefaultKernel: "legacy-eih-1pn" }>;
  sourceManifest: readonly Readonly<{ path: string; sha256: string }>[];
  sourceSha256: string;
  artifactSha256: string;
}>;

export type KerrIndependentFitsValidationApiV546 = Readonly<{
  version: typeof KERR_INDEPENDENT_FITS_VALIDATION_API_VERSION_V546;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt";
  summary: KerrIndependentFitsValidationArtifactV546 | null;
}>;

export function parseKerrIndependentFitsValidationReceiptV546(value: unknown): KerrIndependentFitsValidationReceiptV546 {
  if (!isRecord(value) || value.version !== "v546-independent-fits-validation-receipt-v1" || value.status !== "synthetic-fixture-semantically-qualified-nonauthoritative" || !SHA.test(String(value.resultSha256))) throw new Error("v546-receipt-boundary");
  const receipt = value as unknown as KerrIndependentFitsValidationReceiptV546;
  if (receipt.candidate.contentClass !== "synthetic-validation-fixture" || receipt.candidate.fileCount !== 5 || receipt.checks.spectralResponseRowCount !== 81 || receipt.checks.fitsImageHduCount !== 1 || receipt.checks.fitsPixelCount !== receipt.checks.fitsWidthPixels * receipt.checks.fitsHeightPixels || receipt.checks.networkAttemptCount !== 0 || receipt.checks.absolutePathStored !== false || receipt.qualification.independentFitsSemanticValidationQualified !== true || receipt.qualification.syntheticAuthorityGranted !== false || receipt.qualification.measuredAuthorityGranted !== false || receipt.qualification.scienceRasterQualified !== false || receipt.boundary.pixelValuesStoredInReceipt !== false || receipt.boundary.fitsFilePublished !== false || receipt.boundary.denseCampaignStatus !== "incomplete-0-of-49" || receipt.boundary.formalProductPointer !== "v263" || receipt.boundary.formalDefaultKernel !== "legacy-eih-1pn" || Object.values(receipt.candidate.fileSha256).some((entry) => !SHA.test(entry))) throw new Error("v546-receipt-qualification-boundary");
  return receipt;
}

export function parseKerrIndependentFitsValidationArtifactV546(value: unknown): KerrIndependentFitsValidationArtifactV546 {
  if (!isRecord(value) || value.version !== KERR_INDEPENDENT_FITS_VALIDATION_VERSION_V546 || value.status !== "independent-fits-semantic-validator-qualified-synthetic-nonauthoritative-measured-inputs-missing" || !SHA.test(String(value.artifactSha256)) || !SHA.test(String(value.sourceSha256))) throw new Error("v546-artifact-boundary");
  const artifact = value as unknown as KerrIndependentFitsValidationArtifactV546;
  parseKerrIndependentFitsValidationReceiptV546(artifact.validation.receipt);
  if (artifact.validation.independentSubprocessAttemptCount !== 2 || artifact.validation.qualifiedSubprocessCount !== 2 || artifact.validation.abCanonicalIdentical !== true || artifact.validation.temporaryDirectoryLeakCount !== 0 || artifact.validation.workspaceImportCount !== 0 || artifact.validation.networkAttemptCount !== 0 || artifact.validation.receiptCanonicalSha256 !== artifact.validation.receipt.resultSha256 || artifact.mutationAudit.mutationCount !== 8 || artifact.mutationAudit.rejectedMutationCount !== 8 || new Set(artifact.mutationAudit.mutations).size !== 8 || artifact.counts.publishedCandidateFileCount !== 0 || artifact.counts.publishedFitsFileCount !== 0 || artifact.counts.publishedPixelValueCount !== 0 || artifact.counts.measuredCandidateCount !== 0 || artifact.counts.syntheticControlCount !== 1 || artifact.qualification.independentFitsSemanticValidatorQualified !== true || artifact.qualification.syntheticAuthorityGranted !== false || artifact.qualification.measuredAuthorityGranted !== false || artifact.qualification.scienceRasterQualified !== false || artifact.boundary.syntheticCandidatePersisted !== false || artifact.boundary.pixelValuesStoredInArtifact !== false || artifact.boundary.measuredValuesInvented !== false || artifact.boundary.denseCampaignStatus !== "incomplete-0-of-49" || artifact.boundary.formalProductPointer !== "v263" || artifact.boundary.formalDefaultKernel !== "legacy-eih-1pn") throw new Error("v546-artifact-qualification-boundary");
  return artifact;
}

export function parseKerrIndependentFitsValidationApiV546(value: unknown): KerrIndependentFitsValidationApiV546 {
  if (!isRecord(value) || value.version !== KERR_INDEPENDENT_FITS_VALIDATION_API_VERSION_V546 || typeof value.available !== "boolean" || !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt"].includes(String(value.reason))) throw new Error("v546-api-boundary");
  if (value.available) parseKerrIndependentFitsValidationArtifactV546(value.summary); else if (value.summary !== null) throw new Error("v546-api-unavailable-summary");
  return value as unknown as KerrIndependentFitsValidationApiV546;
}

export type KerrIndependentFitsHudModeV546 = "science" | "cinematic";
const scienceProfile = Object.freeze({ id: KERR_INDEPENDENT_FITS_HUD_PROFILE_ID_V546, mode: "science" as const, panel: "#030c11", panelRaised: "#071923", ink: "#effcff", muted: "#7897a5", qualified: "#78edc0", warning: "#f2c476", unavailable: "#ff8aa8", scienceBoundary: Object.freeze({ linearDisplay: true, bloomIntensity: 0 as const, colorGradeIntensity: 0 as const, numericScientificStyleInputCount: 0 as const, scientificFieldMutation: false as const }), cinematicSeed: null });
const cinematicProfile = Object.freeze({ ...scienceProfile, mode: "cinematic" as const, panel: "#140907", panelRaised: "#25130e", ink: "#fff5e8", muted: "#bc9b80", qualified: "#91ebc4", warning: "#f4c06f", unavailable: "#ff93af", scienceBoundary: Object.freeze({ linearDisplay: false, bloomIntensity: 0.034, colorGradeIntensity: 0.022, numericScientificStyleInputCount: 0 as const, scientificFieldMutation: false as const }), cinematicSeed: "orbit-atlas-v546-independent-fits-seed-01" });
export const resolveKerrIndependentFitsHudProfileV546 = (mode: KerrIndependentFitsHudModeV546) => mode === "science" ? scienceProfile : cinematicProfile;
export function createKerrIndependentFitsHudEncodingV546(artifact: KerrIndependentFitsValidationArtifactV546, mode: KerrIndependentFitsHudModeV546) { return Object.freeze({ version: "v546-independent-fits-hud-v1" as const, profileId: KERR_INDEPENDENT_FITS_HUD_PROFILE_ID_V546, mode, artifactKey: artifact.artifactSha256, receiptKey: artifact.validation.receipt.resultSha256, validatorKey: artifact.source.validatorFileSha256, independentSubprocesses: 2 as const, mutationsRejected: 8 as const, syntheticControlCount: 1 as const, publishedFitsFileCount: 0 as const, publishedPixelValueCount: 0 as const, measuredAuthorityGranted: false as const, scienceRasterQualified: false as const, numericScientificStyleInputCount: 0 as const, scientificFieldMutation: false as const }); }
export function compareKerrIndependentFitsHudEncodingsV546(science: ReturnType<typeof createKerrIndependentFitsHudEncodingV546>, cinematic: ReturnType<typeof createKerrIndependentFitsHudEncodingV546>) { if (science.mode !== "science" || cinematic.mode !== "cinematic" || science.artifactKey !== cinematic.artifactKey || science.receiptKey !== cinematic.receiptKey || science.validatorKey !== cinematic.validatorKey || science.measuredAuthorityGranted !== cinematic.measuredAuthorityGranted || science.scienceRasterQualified !== cinematic.scienceRasterQualified) throw new Error("v546-hud-boundary"); return Object.freeze({ receiptStable: true as const, authorityStable: true as const, rasterQualificationStable: true as const, scientificFieldMutation: false as const }); }

export const IXPE_MEASURED_INTAKE_VERSION_V562 = "v1-orbit-atlas-ixpe-measured-intake-v562" as const;
export const IXPE_MEASURED_INTAKE_API_VERSION_V562 = "v1-orbit-atlas-ixpe-measured-intake-api-v562" as const;
export const IXPE_DEFAULT_TARGET_V562 = "Cyg X-1" as const;
export const IXPE_INSTRUMENT_ID_V562 = "IXPE" as const;
export const IXPE_ARCHIVE_ROOT_V562 = "https://heasarc.gsfc.nasa.gov/FTP/ixpe/" as const;
const SHA = /^[0-9a-f]{64}$/;
const TRANSIENT = new Set(["generatedAt", "artifactSha256", "resultSha256"]);
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : !isRecord(value)
    ? value
    : Object.fromEntries(Object.entries(value).filter(([key]) => !TRANSIENT.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
export const canonicalIxpeMeasuredIntakeV562 = (value: unknown): string => JSON.stringify(canonicalize(value));

export const IXPE_REQUIRED_FILES_V562 = Object.freeze([
  { id: "event-list", fileName: "event-list.fits", format: "fits", role: "science" },
  { id: "attitude", fileName: "attitude.fits", format: "fits", role: "science" },
  { id: "arf", fileName: "arf.fits", format: "fits", role: "calibration" },
  { id: "rmf", fileName: "rmf.fits", format: "fits", role: "calibration" },
  { id: "polarization-response", fileName: "polarization-response.fits", format: "fits", role: "calibration" },
  { id: "background", fileName: "background.fits", format: "fits", role: "science" },
  { id: "observation-metadata", fileName: "observation-metadata.json", format: "json", role: "science" },
  { id: "calibration-manifest", fileName: "calibration-manifest.json", format: "json", role: "calibration" },
  { id: "detector-identity", fileName: "detector-identity.json", format: "json", role: "science" },
  { id: "provenance", fileName: "provenance.json", format: "json", role: "provenance" },
  { id: "independent-holdout", fileName: "independent-holdout.json", format: "holdout", role: "holdout" },
  { id: "reviewer-attestation", fileName: "reviewer-attestation.json", format: "json", role: "review" },
] as const);

export type IxpeObservedFileV562 = Readonly<{
  id: string;
  path: string;
  format: string;
  role: string;
  status: "missing" | "invalid" | "ready";
  bytes: number;
  sha256: string | null;
  reasons: readonly string[];
}>;

export type IxpeMeasuredIntakeV562 = Readonly<{
  version: typeof IXPE_MEASURED_INTAKE_VERSION_V562;
  status: "blocked-public-data-package-missing" | "blocked-negative-evidence" | "candidate-ready-for-independent-validation";
  target: typeof IXPE_DEFAULT_TARGET_V562;
  instrumentId: typeof IXPE_INSTRUMENT_ID_V562;
  archive: Readonly<{ provider: "HEASARC"; root: typeof IXPE_ARCHIVE_ROOT_V562; acquisition: "explicit-command-only" }>;
  source: Readonly<{ revalidationSha256: string; engineImportSha256: string; denseStateSha256: string; formalProductPointer: "v263" }>;
  contract: Readonly<{ requiredFileCount: 12; fixedFileOrder: true; unitsAndTimeSystemRequired: true; detectorGeometryIdentityRequired: true; calibrationScienceSeparationRequired: true; independentHoldoutRequired: true; reviewerAttestationRequired: true; licenseAndProvenanceRequired: true; mutationAuditRequired: true; syntheticValuesForbidden: true; automaticRetry: false; automaticTargetReplacement: false; networkByBuilder: false }>;
  inspect: Readonly<{ stagingRoot: string; stagingRootPresent: false; requiredFileCount: 12; readyFileCount: 0; missingFileIds: readonly string[]; invalidFileIds: readonly string[]; files: readonly IxpeObservedFileV562[]; reasons: readonly string[] }>;
  validation: Readonly<{ schemaQualified: true; mutationAudit: Readonly<{ status: "qualified"; attemptedMutationCount: number; rejectedMutationCount: number; allRejected: true; mutationIds: readonly string[] }>; responseApplicationReplayable: false }>;
  qualification: Readonly<{ measuredAuthorityGranted: false; candidateReadyForIndependentValidation: false; sciencePayloadWritebackAllowed: false; publicDeploymentAllowed: false }>;
  boundary: Readonly<{ syntheticValuesWritten: false; measuredRows: 0; responseApplicationExecuted: false; networkAttempted: false; automaticRetry: false; automaticTargetReplacement: false; denseCampaignStatus: "incomplete-0-of-49"; formalProductPointer: "v263"; defaultKernel: "legacy-eih-1pn" }>;
  sourceManifest: readonly Readonly<{ path: string; sha256: string }>[];
  sourceSha256: string;
  artifactSha256: string;
}>;

export type IxpeMeasuredIntakeApiV562 = Readonly<{ version: typeof IXPE_MEASURED_INTAKE_API_VERSION_V562; available: boolean; reason: "ready" | "local-shadow-only" | "lite-boundary" | "evidence-corrupt"; summary: IxpeMeasuredIntakeV562 | null }>;

function validFile(value: unknown): value is IxpeObservedFileV562 {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.path !== "string" || !["missing", "invalid", "ready"].includes(String(value.status)) || !Number.isInteger(value.bytes) || Number(value.bytes) < 0 || (value.sha256 !== null && !SHA.test(String(value.sha256))) || !Array.isArray(value.reasons)) return false;
  return value.reasons.every((reason) => typeof reason === "string");
}
export function parseIxpeMeasuredIntakeV562(value: unknown): IxpeMeasuredIntakeV562 {
  if (!isRecord(value) || value.version !== IXPE_MEASURED_INTAKE_VERSION_V562 || !["blocked-public-data-package-missing", "blocked-negative-evidence", "candidate-ready-for-independent-validation"].includes(String(value.status)) || value.target !== IXPE_DEFAULT_TARGET_V562 || value.instrumentId !== IXPE_INSTRUMENT_ID_V562 || !isRecord(value.archive) || value.archive.provider !== "HEASARC" || value.archive.root !== IXPE_ARCHIVE_ROOT_V562 || value.archive.acquisition !== "explicit-command-only" || !isRecord(value.source) || value.source.formalProductPointer !== "v263" || !isRecord(value.contract) || value.contract.requiredFileCount !== 12 || value.contract.fixedFileOrder !== true || value.contract.syntheticValuesForbidden !== true || value.contract.automaticRetry !== false || value.contract.automaticTargetReplacement !== false || value.contract.networkByBuilder !== false || !isRecord(value.inspect) || value.inspect.requiredFileCount !== 12 || !Array.isArray(value.inspect.files) || value.inspect.files.length !== 12 || value.inspect.files.some((file) => !validFile(file)) || !isRecord(value.validation) || !isRecord(value.validation.mutationAudit) || value.validation.mutationAudit.status !== "qualified" || value.validation.mutationAudit.allRejected !== true || Number(value.validation.mutationAudit.rejectedMutationCount) !== Number(value.validation.mutationAudit.attemptedMutationCount) || value.validation.responseApplicationReplayable !== false || !isRecord(value.qualification) || value.qualification.measuredAuthorityGranted !== false || value.qualification.sciencePayloadWritebackAllowed !== false || !isRecord(value.boundary) || value.boundary.syntheticValuesWritten !== false || value.boundary.measuredRows !== 0 || value.boundary.networkAttempted !== false || value.boundary.denseCampaignStatus !== "incomplete-0-of-49" || value.boundary.formalProductPointer !== "v263" || value.boundary.defaultKernel !== "legacy-eih-1pn" || !Array.isArray(value.sourceManifest) || !SHA.test(String(value.sourceSha256)) || !SHA.test(String(value.artifactSha256))) throw new Error("v562-ixpe-intake-boundary");
  return value as unknown as IxpeMeasuredIntakeV562;
}

export function parseIxpeMeasuredIntakeApiV562(value: unknown): IxpeMeasuredIntakeApiV562 {
  if (!isRecord(value) || value.version !== IXPE_MEASURED_INTAKE_API_VERSION_V562 || typeof value.available !== "boolean" || !["ready", "local-shadow-only", "lite-boundary", "evidence-corrupt"].includes(String(value.reason)) || (value.available && !value.summary) || (!value.available && value.summary !== null)) throw new Error("v562-ixpe-api-boundary");
  if (value.available) parseIxpeMeasuredIntakeV562(value.summary);
  return value as unknown as IxpeMeasuredIntakeApiV562;
}

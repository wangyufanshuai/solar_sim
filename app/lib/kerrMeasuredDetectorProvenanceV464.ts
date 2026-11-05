import type { KerrMeasuredDetectorFileIdV458 } from "./kerrMeasuredDetectorIntakeEnvelopeV458";

export const KERR_MEASURED_DETECTOR_PROVENANCE_ARTIFACT_VERSION_V464 = "v464-kerr-measured-detector-provenance-observatory-artifact-v1" as const;
export const KERR_MEASURED_DETECTOR_PROVENANCE_SUMMARY_VERSION_V464 = "v464-kerr-measured-detector-provenance-observatory-summary-v1" as const;
export const KERR_MEASURED_DETECTOR_PROVENANCE_API_VERSION_V464 = "v464-kerr-measured-detector-provenance-observatory-api-v1" as const;
export const KERR_MEASURED_DETECTOR_REQUIRED_FILES_V464 = Object.freeze(["identity", "plate-scale", "distortion", "psf", "pixel-response", "provenance"] as const);

const SHA256 = /^[a-f0-9]{64}$/;
const TRANSIENT = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
const freezeDeep = <T>(value: T): T => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value as Record<string, unknown>)) freezeDeep(child); } return value; };
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !TRANSIENT.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
export const canonicalKerrMeasuredDetectorProvenancePayloadV464 = (value: unknown): string => JSON.stringify(canonicalize(value));

export type KerrMeasuredDetectorProvenanceInputV464 = Readonly<{
  v458ArtifactSha256: string;
  v458FileSha256: string;
  v458: Readonly<{ status: string; inspect: Readonly<{ stagingRootPresent: boolean; readyFileCount: number; missingFileIds: readonly string[]; invalidFileIds: readonly string[]; candidateReadyForIndependentValidation: boolean; attemptConsumed: boolean }>; productionAdmission: Readonly<{ measuredDetectorAuthorityGranted: boolean; runtimeProjectionAllowed: boolean; scienceRasterAllowed: boolean }>; qualification: Readonly<{ schemaPackQualified: boolean; boundedValidatorQualified: boolean; syntheticProductionFirewallQualified: boolean }>; boundary: Readonly<{ networkAttempted: boolean; automaticRetryApplied: boolean }> }>;
  v463ArtifactSha256: string;
  v463FileSha256: string;
  v463: Readonly<{ status: string; admission: Readonly<{ sciencePayloadAllowed: boolean; authorityGranted: boolean }>; payload: Readonly<{ rowCount: number }>; boundary: Readonly<{ networkAttempted: boolean; automaticRetryApplied: boolean }> }>;
}>;

export type KerrMeasuredDetectorProvenanceResultV464 = Readonly<{
  status: "qualified" | "blocked";
  reason: "none" | "upstream-sha-mismatch" | "measured-files-missing" | "measured-files-invalid" | "upstream-evidence-unavailable";
  sourceChainQualified: boolean;
  protocolQualified: boolean;
  inventoryQualified: boolean;
  provenanceReady: boolean;
  syntheticFirewallQualified: boolean;
  authorityGranted: false;
  runtimeProjectionAllowed: false;
  sciencePayloadAllowed: false;
}>;

export type KerrMeasuredDetectorProvenanceArtifactV464 = Readonly<{
  version: typeof KERR_MEASURED_DETECTOR_PROVENANCE_ARTIFACT_VERSION_V464;
  generatedAt: string;
  status: "provenance-observatory-qualified-measured-intake-blocked";
  source: Readonly<{ v458ArtifactSha256: string; v458FileSha256: string; v463ArtifactSha256: string; v463FileSha256: string }>;
  contract: Readonly<{ requiredFileCount: 6; sourceChainRequired: true; v458IntakeIsMeasuredDataBoundary: true; v463PayloadAdmissionIsDownstreamOnly: true; noNetworkIntake: true; noSyntheticAuthority: true; explicitLicenseSnapshotRequired: true; explicitAuthorityGrantRequired: true }>;
  inventory: Readonly<{ requiredFileIds: readonly KerrMeasuredDetectorFileIdV458[]; readyFileCount: 0; missingFileIds: readonly KerrMeasuredDetectorFileIdV458[]; invalidFileIds: readonly KerrMeasuredDetectorFileIdV458[]; stagingRootPresent: false; attemptConsumed: false }>;
  provenance: Readonly<{ identityQualified: false; shaLinkageQualified: false; licenseSnapshotQualified: false; independentValidationQualified: false; measuredRows: 0; sourceFilesPackagedAtRuntime: false }>;
  qualification: Readonly<{ observatoryProtocolQualified: true; measuredProvenanceReady: false; measuredDetectorAuthorityGranted: false; browserQualification: "not-run" }>;
  admission: KerrMeasuredDetectorProvenanceResultV464;
  boundary: Readonly<{ networkAttempted: false; automaticRetryApplied: false; stagingWriteAllowed: false; runtimePackagingAllowed: false; sciencePayloadMutationAllowed: false; fitsWriteAllowed: false; pngWriteAllowed: false }>;
  formalProductPointer: "v263";
  formalDefaultKernel: "legacy-eih-1pn";
  denseCampaignStatus: "incomplete-0-of-49";
  artifactSha256: string;
}>;

export type KerrMeasuredDetectorProvenanceSummaryV464 = Readonly<{ version: typeof KERR_MEASURED_DETECTOR_PROVENANCE_SUMMARY_VERSION_V464; status: KerrMeasuredDetectorProvenanceArtifactV464["status"]; artifactSha256: string; source: KerrMeasuredDetectorProvenanceArtifactV464["source"]; contract: KerrMeasuredDetectorProvenanceArtifactV464["contract"]; inventory: KerrMeasuredDetectorProvenanceArtifactV464["inventory"]; provenance: KerrMeasuredDetectorProvenanceArtifactV464["provenance"]; qualification: KerrMeasuredDetectorProvenanceArtifactV464["qualification"]; admission: KerrMeasuredDetectorProvenanceArtifactV464["admission"]; boundary: KerrMeasuredDetectorProvenanceArtifactV464["boundary"] }>;
export type KerrMeasuredDetectorProvenanceApiV464 = Readonly<{ version: typeof KERR_MEASURED_DETECTOR_PROVENANCE_API_VERSION_V464; available: boolean; reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed"; summary: KerrMeasuredDetectorProvenanceSummaryV464 | null }>;

export function evaluateKerrMeasuredDetectorProvenanceV464(input: KerrMeasuredDetectorProvenanceInputV464): KerrMeasuredDetectorProvenanceResultV464 {
  const sourceChainQualified = SHA256.test(input.v458ArtifactSha256) && SHA256.test(input.v458FileSha256) && SHA256.test(input.v463ArtifactSha256) && SHA256.test(input.v463FileSha256);
  const protocolQualified = input.v458.qualification.schemaPackQualified && input.v458.qualification.boundedValidatorQualified && input.v458.qualification.syntheticProductionFirewallQualified;
  const inventoryQualified = input.v458.inspect.readyFileCount === 6 && input.v458.inspect.missingFileIds.length === 0 && input.v458.inspect.invalidFileIds.length === 0 && input.v458.inspect.candidateReadyForIndependentValidation && !input.v458.inspect.attemptConsumed;
  const provenanceReady = inventoryQualified && input.v458.productionAdmission.measuredDetectorAuthorityGranted && input.v458.productionAdmission.runtimeProjectionAllowed && !input.v463.admission.sciencePayloadAllowed;
  const syntheticFirewallQualified = input.v458.qualification.syntheticProductionFirewallQualified;
  const reason = !sourceChainQualified ? "upstream-sha-mismatch" : !protocolQualified ? "upstream-evidence-unavailable" : input.v458.inspect.invalidFileIds.length > 0 ? "measured-files-invalid" : !inventoryQualified ? "measured-files-missing" : "none";
  return freezeDeep({ status: reason === "none" && provenanceReady ? "qualified" : "blocked", reason, sourceChainQualified, protocolQualified, inventoryQualified, provenanceReady, syntheticFirewallQualified, authorityGranted: false as const, runtimeProjectionAllowed: false as const, sciencePayloadAllowed: false as const });
}

export function parseKerrMeasuredDetectorProvenanceArtifactV464(value: unknown): KerrMeasuredDetectorProvenanceArtifactV464 {
  const artifact = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrMeasuredDetectorProvenanceArtifactV464> : null;
  if (!artifact || artifact.version !== KERR_MEASURED_DETECTOR_PROVENANCE_ARTIFACT_VERSION_V464 || artifact.status !== "provenance-observatory-qualified-measured-intake-blocked" || !SHA256.test(artifact.artifactSha256 ?? "") || !artifact.source || Object.values(artifact.source).some((sha) => !SHA256.test(sha)) || artifact.contract?.requiredFileCount !== 6 || artifact.contract.sourceChainRequired !== true || artifact.contract.v458IntakeIsMeasuredDataBoundary !== true || artifact.contract.v463PayloadAdmissionIsDownstreamOnly !== true || artifact.contract.noNetworkIntake !== true || artifact.contract.noSyntheticAuthority !== true || artifact.contract.explicitLicenseSnapshotRequired !== true || artifact.contract.explicitAuthorityGrantRequired !== true || artifact.inventory?.requiredFileIds.length !== 6 || new Set(artifact.inventory.requiredFileIds).size !== 6 || KERR_MEASURED_DETECTOR_REQUIRED_FILES_V464.some((id) => !artifact.inventory?.requiredFileIds.includes(id)) || artifact.inventory.readyFileCount !== 0 || artifact.inventory.missingFileIds.length !== 6 || new Set(artifact.inventory.missingFileIds).size !== 6 || artifact.inventory.invalidFileIds.length !== 0 || artifact.inventory.stagingRootPresent !== false || artifact.inventory.attemptConsumed !== false || artifact.provenance?.identityQualified !== false || artifact.provenance.shaLinkageQualified !== false || artifact.provenance.licenseSnapshotQualified !== false || artifact.provenance.independentValidationQualified !== false || artifact.provenance.measuredRows !== 0 || artifact.provenance.sourceFilesPackagedAtRuntime !== false || artifact.qualification?.observatoryProtocolQualified !== true || artifact.qualification.measuredProvenanceReady !== false || artifact.qualification.measuredDetectorAuthorityGranted !== false || artifact.qualification.browserQualification !== "not-run" || artifact.admission?.status !== "blocked" || artifact.admission.provenanceReady !== false || artifact.admission.authorityGranted !== false || artifact.admission.runtimeProjectionAllowed !== false || artifact.admission.sciencePayloadAllowed !== false || artifact.boundary?.networkAttempted !== false || artifact.boundary.automaticRetryApplied !== false || artifact.boundary.stagingWriteAllowed !== false || artifact.boundary.runtimePackagingAllowed !== false || artifact.boundary.sciencePayloadMutationAllowed !== false || artifact.boundary.fitsWriteAllowed !== false || artifact.boundary.pngWriteAllowed !== false || artifact.formalProductPointer !== "v263" || artifact.formalDefaultKernel !== "legacy-eih-1pn" || artifact.denseCampaignStatus !== "incomplete-0-of-49") throw new Error("v464-provenance-artifact-identity");
  return freezeDeep(value as KerrMeasuredDetectorProvenanceArtifactV464);
}
export function createKerrMeasuredDetectorProvenanceSummaryV464(value: unknown): KerrMeasuredDetectorProvenanceSummaryV464 { const artifact = parseKerrMeasuredDetectorProvenanceArtifactV464(value); return freezeDeep({ version: KERR_MEASURED_DETECTOR_PROVENANCE_SUMMARY_VERSION_V464, status: artifact.status, artifactSha256: artifact.artifactSha256, source: artifact.source, contract: artifact.contract, inventory: artifact.inventory, provenance: artifact.provenance, qualification: artifact.qualification, admission: artifact.admission, boundary: artifact.boundary }); }
export function parseKerrMeasuredDetectorProvenanceApiV464(value: unknown): KerrMeasuredDetectorProvenanceApiV464 { const api = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrMeasuredDetectorProvenanceApiV464> : null; if (!api || api.version !== KERR_MEASURED_DETECTOR_PROVENANCE_API_VERSION_V464 || typeof api.available !== "boolean" || !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(api.reason ?? "") || (api.available && !api.summary) || (!api.available && api.summary !== null)) throw new Error("v464-provenance-api-identity"); return freezeDeep(value as KerrMeasuredDetectorProvenanceApiV464); }

export const KERR_OBSERVATION_PROVENANCE_VERSION_V436 = "v436-kerr-observation-provenance-v1" as const;
export const KERR_OBSERVATION_PROVENANCE_API_VERSION_V436 = "v436-kerr-observation-provenance-api-v1" as const;
export const KERR_OBSERVATION_PROVENANCE_ORACLE_VERSION_V436 = "v436-kerr-observation-provenance-python-oracle-v1" as const;
export const KERR_OBSERVATION_PROVENANCE_CONTRACT_VERSION_V436 = "v436-kerr-observation-provenance-contract-v1" as const;

const SHA = /^[a-f0-9]{64}$/;
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

export type KerrObservationPayloadV436 = Readonly<{
  rayId: string;
  spin: number;
  classification: "disk-hit";
  emissionRadiusM: number;
  redshift: number;
  redshiftApplicability: "applicable";
  walkerPenroseEvpaDeg: number;
  parallelTransportEvpaDeg: number;
  evpaDifferenceDeg: number;
  evpaApplicability: "applicable-disk-hit";
  intensityInvariantResidual: number;
  errorBudget: Readonly<Record<string, number>>;
  sourceExecution: Readonly<Record<string, string>>;
}>;

export type KerrObservationContractV436 = Readonly<{
  version: typeof KERR_OBSERVATION_PROVENANCE_CONTRACT_VERSION_V436;
  status: "immutable-science-payload-and-cinematic-readonly-boundary";
  sourceRequirements: readonly string[];
  scientificFields: readonly string[];
  scienceRenderer: Readonly<{ payloadReadOnly: true; linearDisplayOnly: true; bloom: false; randomNoise: false; scientificFieldMutation: false }>;
  cinematicRenderer: Readonly<{ payloadReadOnly: true; seedRequired: true; allowedPresentationFields: readonly ["exposure", "bloom", "seededDiskDetail", "backgroundMix"]; scientificFieldMutation: false; writebackForbidden: true }>;
  measuredImport: Readonly<{ status: "not-attempted"; measuredPackPresent: false; sourceEvidenceSha256: string }>;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  boundary: string;
}>;

export type KerrObservationOracleV436 = Readonly<{
  version: typeof KERR_OBSERVATION_PROVENANCE_ORACLE_VERSION_V436;
  generatedAt: string;
  status: "qualified-short-authority-observation-provenance-cinematic-readonly-boundary-measured-import-pending";
  sourceV296EvidenceSha256: string;
  sourceV296FileSha256: string;
  sourceV297EvidenceSha256: string;
  sourceV297FileSha256: string;
  sourceV297EnvelopeEvidenceSha256: string;
  sourceV297EnvelopeFileSha256: string;
  sourceV435EvidenceSha256: string;
  sourceV435EvidenceFileSha256: string;
  payloads: readonly KerrObservationPayloadV436[];
  contract: KerrObservationContractV436;
  counts: Readonly<{ sourceGeometryExecutionCount: 128; sourcePolarizationExecutionCount: 128; diskPayloadCount: 4; captureEscapeNotApplicableCount: 96; measuredPackCount: 0; importAttemptCount: 0; sciencePayloadMutationCount: 0; cinematicWritebackMutationCount: 0; scienceApplicationCount: 0 }>;
  qualification: Readonly<{ geometryQualified: true; polarizationQualified: true; observationJoinQualified: true; sciencePayloadImmutable: true; cinematicReadonlyBoundaryQualified: true; measuredImportPending: true; browserQualification: "not-run"; denseAuthority: false }>;
  networkAttempted: false;
  importAttempted: false;
  denseShardExecuted: false;
  scienceApplicationCount: 0;
  boundary: string;
  artifactSha256: string;
}>;

export type KerrObservationSummaryV436 = Readonly<{
  version: typeof KERR_OBSERVATION_PROVENANCE_VERSION_V436;
  status: KerrObservationOracleV436["status"];
  artifactSha256: string;
  source: Readonly<{ v296EvidenceSha256: string; v297EvidenceSha256: string; v435EvidenceSha256: string }>;
  counts: KerrObservationOracleV436["counts"];
  qualification: KerrObservationOracleV436["qualification"];
  payloads: readonly Readonly<{ rayId: string; spin: number; classification: "disk-hit"; emissionRadiusM: number; redshift: number; walkerPenroseEvpaDeg: number; parallelTransportEvpaDeg: number; evpaDifferenceDeg: number; evpaApplicability: "applicable-disk-hit" }>[];
  boundary: Readonly<{ sciencePayloadReadOnly: true; scienceLinearDisplayOnly: true; cinematicSeedRequired: true; cinematicWritebackForbidden: true; denseAuthority: false; measuredImport: "not-attempted" }>;
}>;

export type KerrObservationApiV436 = Readonly<{ version: typeof KERR_OBSERVATION_PROVENANCE_API_VERSION_V436; available: boolean; reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed"; summary: KerrObservationSummaryV436 | null }>;

const freeze = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const entry of Object.values(value as Record<string, unknown>)) freeze(entry);
  }
  return value;
};

function validPayload(value: unknown): value is KerrObservationPayloadV436 {
  const item = value as Partial<KerrObservationPayloadV436> | null;
  return Boolean(item && typeof item.rayId === "string" && finite(item.spin) && item.classification === "disk-hit" && finite(item.emissionRadiusM) && finite(item.redshift) && item.redshiftApplicability === "applicable" && finite(item.walkerPenroseEvpaDeg) && finite(item.parallelTransportEvpaDeg) && finite(item.evpaDifferenceDeg) && item.evpaApplicability === "applicable-disk-hit" && finite(item.intensityInvariantResidual) && item.errorBudget && item.sourceExecution && Object.values(item.errorBudget).every(finite) && Object.values(item.sourceExecution).every((entry) => typeof entry === "string" && SHA.test(entry)));
}

export function parseKerrObservationContractV436(value: unknown): KerrObservationContractV436 {
  const contract = value as Partial<KerrObservationContractV436> | null;
  if (!contract || contract.version !== KERR_OBSERVATION_PROVENANCE_CONTRACT_VERSION_V436 || contract.status !== "immutable-science-payload-and-cinematic-readonly-boundary" || !Array.isArray(contract.scientificFields) || contract.scienceRenderer?.payloadReadOnly !== true || contract.scienceRenderer.linearDisplayOnly !== true || contract.scienceRenderer.bloom !== false || contract.scienceRenderer.randomNoise !== false || contract.scienceRenderer.scientificFieldMutation !== false || contract.cinematicRenderer?.payloadReadOnly !== true || contract.cinematicRenderer.seedRequired !== true || contract.cinematicRenderer.scientificFieldMutation !== false || contract.cinematicRenderer.writebackForbidden !== true || contract.measuredImport?.status !== "not-attempted" || contract.measuredImport.measuredPackPresent !== false || contract.formalProductPointer !== "v263" || contract.denseCampaignStatus !== "incomplete-0-of-49") throw new Error("v436-contract-identity");
  return freeze(value as KerrObservationContractV436);
}

export function parseKerrObservationOracleV436(value: unknown): KerrObservationOracleV436 {
  const oracle = value as Partial<KerrObservationOracleV436> | null;
  if (!oracle || oracle.version !== KERR_OBSERVATION_PROVENANCE_ORACLE_VERSION_V436 || oracle.status !== "qualified-short-authority-observation-provenance-cinematic-readonly-boundary-measured-import-pending" || !SHA.test(oracle.artifactSha256 ?? "") || !SHA.test(oracle.sourceV296EvidenceSha256 ?? "") || !SHA.test(oracle.sourceV297EvidenceSha256 ?? "") || !SHA.test(oracle.sourceV435EvidenceSha256 ?? "") || oracle.payloads?.length !== 4 || oracle.payloads.some((payload) => !validPayload(payload)) || oracle.counts?.sourceGeometryExecutionCount !== 128 || oracle.counts.sourcePolarizationExecutionCount !== 128 || oracle.counts.diskPayloadCount !== 4 || oracle.counts.captureEscapeNotApplicableCount !== 96 || oracle.counts.measuredPackCount !== 0 || oracle.counts.importAttemptCount !== 0 || oracle.counts.sciencePayloadMutationCount !== 0 || oracle.counts.cinematicWritebackMutationCount !== 0 || oracle.counts.scienceApplicationCount !== 0 || oracle.qualification?.geometryQualified !== true || oracle.qualification.polarizationQualified !== true || oracle.qualification.observationJoinQualified !== true || oracle.qualification.sciencePayloadImmutable !== true || oracle.qualification.cinematicReadonlyBoundaryQualified !== true || oracle.qualification.measuredImportPending !== true || oracle.qualification.browserQualification !== "not-run" || oracle.qualification.denseAuthority !== false || oracle.networkAttempted !== false || oracle.importAttempted !== false || oracle.denseShardExecuted !== false || oracle.scienceApplicationCount !== 0) throw new Error("v436-oracle-identity");
  parseKerrObservationContractV436(oracle.contract);
  return freeze(value as KerrObservationOracleV436);
}

export function createKerrObservationSummaryV436(value: unknown): KerrObservationSummaryV436 {
  const oracle = parseKerrObservationOracleV436(value);
  return freeze({ version: KERR_OBSERVATION_PROVENANCE_VERSION_V436, status: oracle.status, artifactSha256: oracle.artifactSha256, source: { v296EvidenceSha256: oracle.sourceV296EvidenceSha256, v297EvidenceSha256: oracle.sourceV297EvidenceSha256, v435EvidenceSha256: oracle.sourceV435EvidenceSha256 }, counts: oracle.counts, qualification: oracle.qualification, payloads: oracle.payloads.map(({ rayId, spin, classification, emissionRadiusM, redshift, walkerPenroseEvpaDeg, parallelTransportEvpaDeg, evpaDifferenceDeg, evpaApplicability }) => ({ rayId, spin, classification, emissionRadiusM, redshift, walkerPenroseEvpaDeg, parallelTransportEvpaDeg, evpaDifferenceDeg, evpaApplicability })), boundary: { sciencePayloadReadOnly: true, scienceLinearDisplayOnly: true, cinematicSeedRequired: true, cinematicWritebackForbidden: true, denseAuthority: false, measuredImport: "not-attempted" } });
}

export function createScienceObservationPayloadV436(payload: KerrObservationPayloadV436): Readonly<KerrObservationPayloadV436> { if (!validPayload(payload)) throw new Error("v436-invalid-science-payload"); return freeze({ ...payload, errorBudget: { ...payload.errorBudget }, sourceExecution: { ...payload.sourceExecution } }); }

export function createCinematicPresentationV436(seed: number): Readonly<{ seed: number; exposure: number; bloom: number; seededDiskDetail: number; backgroundMix: number }> {
  if (!Number.isInteger(seed) || seed < 0) throw new Error("v436-seed");
  const unit = ((seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  return freeze({ seed, exposure: 0.92 + unit * 0.16, bloom: 0.08 + unit * 0.08, seededDiskDetail: 0.35 + unit * 0.3, backgroundMix: 0.18 + unit * 0.18 });
}

export function assertKerrObservationReadonlyBoundaryV436(contract: KerrObservationContractV436): true {
  parseKerrObservationContractV436(contract);
  return true;
}

export function parseKerrObservationApiV436(value: unknown): KerrObservationApiV436 {
  const api = value as Partial<KerrObservationApiV436> | null;
  if (!api || api.version !== KERR_OBSERVATION_PROVENANCE_API_VERSION_V436 || typeof api.available !== "boolean" || !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(api.reason ?? "") || (api.available && !api.summary) || (!api.available && api.summary !== null)) throw new Error("v436-api-identity");
  return api as KerrObservationApiV436;
}

export const KERR_SCIENCE_PAYLOAD_ADMISSION_ARTIFACT_VERSION_V463 = "v463-kerr-science-payload-admission-artifact-v1" as const;
export const KERR_SCIENCE_PAYLOAD_ADMISSION_SUMMARY_VERSION_V463 = "v463-kerr-science-payload-admission-summary-v1" as const;
export const KERR_SCIENCE_PAYLOAD_ADMISSION_API_VERSION_V463 = "v463-kerr-science-payload-admission-api-v1" as const;

const SHA256 = /^[a-f0-9]{64}$/;
const TRANSIENT_KEYS = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
const freezeDeep = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) freezeDeep(child);
  }
  return value;
};
const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value).filter(([key]) => !TRANSIENT_KEYS.has(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]));

export const canonicalKerrSciencePayloadAdmissionPayloadV463 = (value: unknown): string => JSON.stringify(canonicalize(value));

export type KerrSciencePayloadClassificationV463 = "capture" | "escape" | "disk-hit";
export type KerrSciencePayloadApplicabilityV463 = Readonly<{
  applicable: boolean;
  value: number | null;
  unavailableReason: "none" | "not-applicable" | "measurement-unavailable";
}>;
export type KerrSciencePayloadRowV463 = Readonly<{
  rayId: string;
  classification: KerrSciencePayloadClassificationV463;
  detectorPixel: Readonly<{ x: number; y: number; value: number | null; applicable: boolean }>;
  redshift: KerrSciencePayloadApplicabilityV463;
  evpa: KerrSciencePayloadApplicabilityV463;
  intensity: KerrSciencePayloadApplicabilityV463;
  uncertaintyLedgerSha256: string;
  measurementJoinSha256: string;
  provenanceSourceSha256: string;
}>;

export type KerrSciencePayloadAdmissionInputV463 = Readonly<{
  measurementJoinArtifactSha256: string;
  measurementJoinFileSha256: string;
  measurementJoin: Readonly<{
    status: string;
    source: Readonly<{ v458IntakeArtifactSha256: string; v460ResultsArtifactSha256: string; v461LedgerArtifactSha256: string }>;
    join: Readonly<{ status: string; joinAllowed: boolean; sourceChainQualified: boolean; ledgerReady: boolean; authorityGranted: boolean }>;
    inspect: Readonly<{ committed: boolean; joinSha256: string | null; productionPixelRows: number }>;
    qualification: Readonly<{ scienceProductJoinQualified: boolean; detectorAuthorityGranted: boolean }>;
  }>;
}>;

export type KerrSciencePayloadAdmissionResultV463 = Readonly<{
  status: "admitted" | "blocked";
  reason: "none" | "measurement-join-unavailable" | "measurement-join-incomplete" | "detector-authority-unavailable" | "residual-ledger-open" | "source-sha-invalid";
  sourceShaQualified: boolean;
  completeMeasurementJoin: boolean;
  detectorAuthorityReady: boolean;
  residualLedgerClosed: boolean;
  sciencePayloadAllowed: boolean;
  fitsWriteAllowed: boolean;
  pngWriteAllowed: boolean;
  cinematicScienceWritebackAllowed: false;
  authorityGranted: boolean;
}>;

export type KerrSciencePayloadAdmissionArtifactV463 = Readonly<{
  version: typeof KERR_SCIENCE_PAYLOAD_ADMISSION_ARTIFACT_VERSION_V463;
  generatedAt: string;
  status: "payload-admission-protocol-qualified-join-blocked";
  source: Readonly<{ measurementJoinArtifactSha256: string; measurementJoinFileSha256: string; uncertaintyLedgerArtifactSha256: string }>;
  contract: Readonly<{
    v462AtomicJoinIsOnlyUpstream: true;
    completeJoinRequired: true;
    detectorAuthorityRequired: true;
    residualLedgerClosedRequired: true;
    sourceShaRequired: true;
    applicabilityExplicit: true;
    scienceCinematicWritebackForbidden: true;
  }>;
  schema: Readonly<{
    version: "kerr-science-payload-row-v1";
    fields: readonly ["classification", "detectorPixel", "redshift", "evpa", "intensity", "uncertaintyLedgerSha256", "measurementJoinSha256", "provenanceSourceSha256"];
    classifications: readonly ["capture", "escape", "disk-hit"];
    unavailableValuesAreExplicit: true;
    finiteNumericValuesRequired: true;
  }>;
  admission: KerrSciencePayloadAdmissionResultV463;
  inspect: Readonly<{ evaluated: true; committed: false; productionPayloadRows: 0; payloadSha256: null; fitsWriteAllowed: false; pngWriteAllowed: false; authorityGranted: false }>;
  payload: Readonly<{ rows: readonly []; rowCount: 0; payloadSha256: null }>;
  qualification: Readonly<{ protocolQualified: true; sciencePayloadQualified: false; detectorAuthorityGranted: false; browserQualification: "not-run" }>;
  boundary: Readonly<{ partialPayloadPublish: false; sciencePayloadMutationAllowed: false; fitsWriteAllowed: false; pngWriteAllowed: false; cinematicScienceWritebackAllowed: false; networkAttempted: false; automaticRetryApplied: false }>;
  formalProductPointer: "v263";
  formalDefaultKernel: "legacy-eih-1pn";
  denseCampaignStatus: "incomplete-0-of-49";
  artifactSha256: string;
}>;

export type KerrSciencePayloadAdmissionSummaryV463 = Readonly<{
  version: typeof KERR_SCIENCE_PAYLOAD_ADMISSION_SUMMARY_VERSION_V463;
  status: KerrSciencePayloadAdmissionArtifactV463["status"];
  artifactSha256: string;
  source: KerrSciencePayloadAdmissionArtifactV463["source"];
  contract: KerrSciencePayloadAdmissionArtifactV463["contract"];
  schema: KerrSciencePayloadAdmissionArtifactV463["schema"];
  admission: KerrSciencePayloadAdmissionArtifactV463["admission"];
  inspect: KerrSciencePayloadAdmissionArtifactV463["inspect"];
  payload: KerrSciencePayloadAdmissionArtifactV463["payload"];
  qualification: KerrSciencePayloadAdmissionArtifactV463["qualification"];
  boundary: KerrSciencePayloadAdmissionArtifactV463["boundary"];
}>;

export type KerrSciencePayloadAdmissionApiV463 = Readonly<{
  version: typeof KERR_SCIENCE_PAYLOAD_ADMISSION_API_VERSION_V463;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed";
  summary: KerrSciencePayloadAdmissionSummaryV463 | null;
}>;

export function evaluateKerrSciencePayloadAdmissionV463(input: KerrSciencePayloadAdmissionInputV463): KerrSciencePayloadAdmissionResultV463 {
  const sourceShaQualified = SHA256.test(input.measurementJoinArtifactSha256)
    && SHA256.test(input.measurementJoinFileSha256)
    && Object.values(input.measurementJoin.source).every((sha) => SHA256.test(sha));
  const completeMeasurementJoin = input.measurementJoin.status === "join-protocol-qualified-inputs-available"
    && input.measurementJoin.join.status === "qualified"
    && input.measurementJoin.join.joinAllowed
    && input.measurementJoin.inspect.committed
    && input.measurementJoin.inspect.productionPixelRows > 0
    && input.measurementJoin.inspect.joinSha256 === input.measurementJoinArtifactSha256
    && input.measurementJoin.qualification.scienceProductJoinQualified;
  const detectorAuthorityReady = input.measurementJoin.join.authorityGranted && input.measurementJoin.qualification.detectorAuthorityGranted;
  const residualLedgerClosed = input.measurementJoin.join.ledgerReady;
  const reason = !sourceShaQualified ? "source-sha-invalid"
    : !completeMeasurementJoin ? "measurement-join-incomplete"
      : !detectorAuthorityReady ? "detector-authority-unavailable"
        : !residualLedgerClosed ? "residual-ledger-open"
          : "none";
  const sciencePayloadAllowed = reason === "none";
  return freezeDeep({
    status: sciencePayloadAllowed ? "admitted" : "blocked",
    reason,
    sourceShaQualified,
    completeMeasurementJoin,
    detectorAuthorityReady,
    residualLedgerClosed,
    sciencePayloadAllowed,
    fitsWriteAllowed: sciencePayloadAllowed,
    pngWriteAllowed: sciencePayloadAllowed,
    cinematicScienceWritebackAllowed: false as const,
    authorityGranted: sciencePayloadAllowed,
  });
}

export function parseKerrSciencePayloadAdmissionArtifactV463(value: unknown): KerrSciencePayloadAdmissionArtifactV463 {
  const artifact = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrSciencePayloadAdmissionArtifactV463> : null;
  if (!artifact
    || artifact.version !== KERR_SCIENCE_PAYLOAD_ADMISSION_ARTIFACT_VERSION_V463
    || artifact.status !== "payload-admission-protocol-qualified-join-blocked"
    || !SHA256.test(artifact.artifactSha256 ?? "")
    || !artifact.source || Object.values(artifact.source).some((sha) => !SHA256.test(sha))
    || artifact.contract?.v462AtomicJoinIsOnlyUpstream !== true
    || artifact.contract.completeJoinRequired !== true
    || artifact.contract.detectorAuthorityRequired !== true
    || artifact.contract.residualLedgerClosedRequired !== true
    || artifact.contract.sourceShaRequired !== true
    || artifact.contract.applicabilityExplicit !== true
    || artifact.contract.scienceCinematicWritebackForbidden !== true
    || artifact.schema?.version !== "kerr-science-payload-row-v1"
    || artifact.schema.unavailableValuesAreExplicit !== true
    || artifact.schema.finiteNumericValuesRequired !== true
    || artifact.admission?.status !== "blocked"
    || artifact.admission.sciencePayloadAllowed !== false
    || artifact.admission.fitsWriteAllowed !== false
    || artifact.admission.pngWriteAllowed !== false
    || artifact.admission.cinematicScienceWritebackAllowed !== false
    || artifact.admission.authorityGranted !== false
    || artifact.inspect?.evaluated !== true
    || artifact.inspect.committed !== false
    || artifact.inspect.productionPayloadRows !== 0
    || artifact.inspect.payloadSha256 !== null
    || artifact.payload?.rowCount !== 0
    || artifact.payload.rows.length !== 0
    || artifact.payload.payloadSha256 !== null
    || artifact.qualification?.protocolQualified !== true
    || artifact.qualification.sciencePayloadQualified !== false
    || artifact.qualification.detectorAuthorityGranted !== false
    || artifact.qualification.browserQualification !== "not-run"
    || artifact.boundary?.partialPayloadPublish !== false
    || artifact.boundary.sciencePayloadMutationAllowed !== false
    || artifact.boundary.fitsWriteAllowed !== false
    || artifact.boundary.pngWriteAllowed !== false
    || artifact.boundary.cinematicScienceWritebackAllowed !== false
    || artifact.boundary.networkAttempted !== false
    || artifact.boundary.automaticRetryApplied !== false
    || artifact.formalProductPointer !== "v263"
    || artifact.formalDefaultKernel !== "legacy-eih-1pn"
    || artifact.denseCampaignStatus !== "incomplete-0-of-49") {
    throw new Error("v463-science-payload-admission-artifact-identity");
  }
  return freezeDeep(value as KerrSciencePayloadAdmissionArtifactV463);
}

export function createKerrSciencePayloadAdmissionSummaryV463(value: unknown): KerrSciencePayloadAdmissionSummaryV463 {
  const artifact = parseKerrSciencePayloadAdmissionArtifactV463(value);
  return freezeDeep({ version: KERR_SCIENCE_PAYLOAD_ADMISSION_SUMMARY_VERSION_V463, status: artifact.status, artifactSha256: artifact.artifactSha256, source: artifact.source, contract: artifact.contract, schema: artifact.schema, admission: artifact.admission, inspect: artifact.inspect, payload: artifact.payload, qualification: artifact.qualification, boundary: artifact.boundary });
}

export function parseKerrSciencePayloadAdmissionApiV463(value: unknown): KerrSciencePayloadAdmissionApiV463 {
  const api = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrSciencePayloadAdmissionApiV463> : null;
  if (!api || api.version !== KERR_SCIENCE_PAYLOAD_ADMISSION_API_VERSION_V463 || typeof api.available !== "boolean" || !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(api.reason ?? "") || (api.available && !api.summary) || (!api.available && api.summary !== null)) throw new Error("v463-science-payload-admission-api-identity");
  return freezeDeep(value as KerrSciencePayloadAdmissionApiV463);
}

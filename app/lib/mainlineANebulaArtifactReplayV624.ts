import { createHash } from "node:crypto";

export type NebulaV624State = "acquisition-pending" | "captured" | "blocked" | "rights-pending";
export type NebulaV624Rights = "review-pending" | "cleared" | "rejected";
export type NebulaV624Attempt = Readonly<{
  attempt: number;
  startedAt: string;
  endedAt: string | null;
  timeout: boolean;
  retryCount: number;
  httpStatus: number | null;
  contentType: string | null;
  requestUrl: string;
  finalUrl: string | null;
  redirectChain: readonly string[];
  errorClass: string | null;
  requestFingerprint: string;
  responseCaptured: 0 | 1;
  responseBytes: number | null;
  rawArtifactPath: string | null;
  rawPageSha256: string | null;
}>;
export type NebulaV624Payload = Readonly<{
  localPath: string | null;
  bytes: number | null;
  sha256: string | null;
  width: number | null;
  height: number | null;
  format: string | null;
  synthetic: boolean;
  fixture: boolean;
}>;
export type NebulaV624Record = Readonly<{
  candidateId: string;
  rank: number;
  sourceUrl: string;
  previewUrl: string;
  sourceTitle: string;
  sourceCredit: string;
  licenseUrl: string;
  state: NebulaV624State;
  rightsStatus: NebulaV624Rights;
  payload: NebulaV624Payload;
  attempts: readonly NebulaV624Attempt[];
  candidateOnly: true;
  runtimeAdmission: "candidate-only";
  scientificPayloadWriteback: false;
}>;

const SHA256 = /^[a-f0-9]{64}$/i;
const NASA_HOST = "images-assets.nasa.gov";
const NASA_LICENSE = "https://www.nasa.gov/nasa-brand-center/images-and-media/";
const IMAGE_MIME = /^(image\/(?:jpeg|jpg|png|webp|tiff))$/i;
const IDS = Object.freeze(["lagoon-nebula", "trifid-nebula", "carina-nebula", "rosette-nebula", "soul-nebula", "orion-nebula"]);

function sorted(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sorted);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value as Record<string, unknown>).sort().map((key) => [key, sorted((value as Record<string, unknown>)[key])]));
}

export function nebulaV624Fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(sorted(value)), "utf8").digest("hex");
}

export function nebulaV624RequestFingerprint(url: string, userAgent = "SolarSim-MainlineA-R64/1.0"): string {
  return nebulaV624Fingerprint({ method: "GET", url, accept: "image/jpeg,image/png,image/*", userAgent });
}

export function nebulaV624SafeSourceUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && parsed.hostname === NASA_HOST && !parsed.username && !parsed.password && !parsed.port && !parsed.hash;
  } catch {
    return false;
  }
}

export function nebulaV624PathSafe(value: string | null): boolean {
  if (!value || value.startsWith("/") || /^[A-Za-z]:[\\/]/.test(value)) return false;
  const parts = value.split(/[\\/]+/);
  return parts.every((part) => part.length > 0 && part !== "." && part !== "..");
}

export function nebulaV624PathWithin(root: string, relative: string | null): boolean {
  if (!nebulaV624PathSafe(relative)) return false;
  const cleanRoot = root.replace(/[\\/]$/, "");
  return `${cleanRoot}/${relative}`.startsWith(`${cleanRoot}/`);
}

export function nebulaV624SourceIssues(record: NebulaV624Record): readonly string[] {
  const issues: string[] = [];
  if (!nebulaV624SafeSourceUrl(record.sourceUrl)) issues.push("source-url-invalid");
  if (record.previewUrl !== record.sourceUrl) issues.push("preview-source-mismatch");
  if (!record.sourceTitle.trim()) issues.push("source-title-missing");
  if (!record.sourceCredit.trim()) issues.push("source-credit-missing");
  if (record.licenseUrl !== NASA_LICENSE) issues.push("license-url-unresolved");
  return Object.freeze(issues);
}

export function nebulaV624PayloadIssues(record: NebulaV624Record): readonly string[] {
  const payload = record.payload;
  const issues: string[] = [];
  if (payload.localPath !== null && !nebulaV624PathWithin("docs/release/v607/nebula-image-artifacts/r64", payload.localPath)) issues.push("artifact-path-outside-root");
  if (payload.localPath === null) issues.push("payload-missing");
  if (!Number.isInteger(payload.bytes) || (payload.bytes ?? 0) <= 0) issues.push("bytes-invalid");
  if (!SHA256.test(payload.sha256 ?? "")) issues.push("sha256-invalid");
  if (!Number.isInteger(payload.width) || (payload.width ?? 0) < 64) issues.push("width-invalid");
  if (!Number.isInteger(payload.height) || (payload.height ?? 0) < 64) issues.push("height-invalid");
  if (!payload.format || !IMAGE_MIME.test(payload.format.startsWith("image/") ? payload.format : `image/${payload.format}`)) issues.push("format-invalid");
  if (payload.synthetic) issues.push("synthetic-payload-forbidden");
  if (payload.fixture) issues.push("fixture-payload-forbidden");
  return Object.freeze(issues);
}

export function nebulaV624AttemptIssues(record: NebulaV624Record): readonly string[] {
  const issues: string[] = [];
  if (record.attempts.length === 0) issues.push("attempt-ledger-empty");
  record.attempts.forEach((attempt, index) => {
    if (attempt.attempt !== index + 1) issues.push("attempt-sequence-invalid");
    if (attempt.retryCount !== attempt.attempt - 1) issues.push("retry-count-invalid");
    if (!attempt.startedAt || !attempt.endedAt) issues.push("attempt-time-missing");
    if (!Number.isFinite(Date.parse(attempt.startedAt)) || !attempt.endedAt || !Number.isFinite(Date.parse(attempt.endedAt))) issues.push("attempt-time-invalid");
    if (attempt.endedAt && attempt.startedAt && Date.parse(attempt.endedAt) < Date.parse(attempt.startedAt)) issues.push("attempt-time-reversed");
    if (attempt.requestUrl !== record.sourceUrl) issues.push("attempt-url-mismatch");
    if (attempt.requestFingerprint !== nebulaV624RequestFingerprint(record.sourceUrl)) issues.push("request-fingerprint-mismatch");
    if (attempt.responseCaptured === 1 && (!attempt.httpStatus || attempt.httpStatus < 200 || attempt.httpStatus >= 300)) issues.push("captured-status-invalid");
    if (attempt.responseCaptured === 1 && (!attempt.rawPageSha256 || !SHA256.test(attempt.rawPageSha256))) issues.push("captured-hash-missing");
    if (attempt.responseCaptured === 1 && (!attempt.contentType || !IMAGE_MIME.test(attempt.contentType.split(";")[0].trim()))) issues.push("captured-content-type-invalid");
    if (attempt.responseCaptured === 1 && (!attempt.finalUrl || !nebulaV624SafeSourceUrl(attempt.finalUrl))) issues.push("captured-final-url-invalid");
    if (attempt.responseCaptured === 1 && attempt.errorClass !== null) issues.push("captured-error-class-inconsistent");
    if (attempt.redirectChain.some((url) => !nebulaV624SafeSourceUrl(url))) issues.push("unsafe-redirect-chain");
    if (attempt.responseCaptured === 0 && (attempt.rawArtifactPath !== null || attempt.rawPageSha256 !== null || attempt.responseBytes !== null)) issues.push("failed-attempt-artifact-claim");
    if (attempt.timeout && attempt.errorClass !== "timeout") issues.push("timeout-class-mismatch");
  });
  if (record.payload.sha256 !== null) {
    const matchingCapture = record.attempts.some((attempt) => attempt.responseCaptured === 1 && attempt.rawPageSha256 === record.payload.sha256 && attempt.responseBytes === record.payload.bytes && attempt.rawArtifactPath === record.payload.localPath);
    if (!matchingCapture) issues.push("payload-capture-link-missing");
  }
  return Object.freeze([...new Set(issues)]);
}

export function nebulaV624RightsIssues(record: NebulaV624Record): readonly string[] {
  if (record.rightsStatus === "cleared") return Object.freeze([]);
  return Object.freeze([record.rightsStatus === "rejected" ? "rights-rejected" : "rights-review-pending"]);
}

export function nebulaV624Assess(record: NebulaV624Record) {
  const blockers = [...nebulaV624SourceIssues(record), ...nebulaV624PayloadIssues(record), ...nebulaV624AttemptIssues(record), ...nebulaV624RightsIssues(record)];
  if (!record.candidateOnly || record.runtimeAdmission !== "candidate-only" || record.scientificPayloadWriteback !== false) blockers.push("admission-boundary-open");
  if (record.state === "captured" && blockers.length) blockers.push("captured-state-inconsistent");
  return Object.freeze({ candidateId: record.candidateId, rank: record.rank, valid: blockers.length === 0, blockers: Object.freeze([...new Set(blockers)]), sourceClosed: nebulaV624SourceIssues(record).length === 0, payloadVerified: nebulaV624PayloadIssues(record).length === 0, attemptsComplete: nebulaV624AttemptIssues(record).length === 0, rightsCleared: record.rightsStatus === "cleared", fingerprint: nebulaV624Fingerprint(record) });
}

export function nebulaV624VerifyBytes(record: NebulaV624Record, bytes: Uint8Array): readonly string[] {
  const issues: string[] = [];
  if (record.payload.bytes !== bytes.byteLength) issues.push("byte-count-mismatch");
  const digest = createHash("sha256").update(bytes).digest("hex");
  if (digest !== record.payload.sha256) issues.push("sha256-mismatch");
  return Object.freeze(issues);
}

export function nebulaV624Classify(record: NebulaV624Record): "ready" | "acquisition-pending" | "rights-pending" | "blocked" {
  const assessment = nebulaV624Assess(record);
  if (assessment.blockers.includes("admission-boundary-open")) return "blocked";
  if (!assessment.sourceClosed || !assessment.attemptsComplete) return "blocked";
  if (!assessment.payloadVerified) return "acquisition-pending";
  if (!assessment.rightsCleared) return "rights-pending";
  return assessment.valid ? "ready" : "blocked";
}

export function nebulaV624Summary(records: readonly NebulaV624Record[]) {
  const assessments = records.map(nebulaV624Assess);
  return Object.freeze({ total: records.length, ids: Object.freeze(records.map((record) => record.candidateId)), ready: assessments.filter((entry) => entry.valid).length, acquisitionPending: assessments.filter((entry) => nebulaV624Classify(records[assessments.indexOf(entry)]) === "acquisition-pending").length, rightsPending: assessments.filter((entry) => !entry.rightsCleared).length, sourceClosed: assessments.filter((entry) => entry.sourceClosed).length, payloadVerified: assessments.filter((entry) => entry.payloadVerified).length, attemptsComplete: assessments.filter((entry) => entry.attemptsComplete).length, blocked: assessments.filter((entry) => entry.blockers.length > 0).length, runtimeAdmitted: 0, scientificPayloadWriteback: false as const });
}

export function nebulaV624ValidateRoster(records: readonly NebulaV624Record[]): readonly string[] {
  const issues: string[] = [];
  if (records.length !== IDS.length) issues.push("roster-count-invalid");
  IDS.forEach((id, index) => { const record = records[index]; if (!record || record.candidateId !== id) issues.push(`roster-order-${id}`); });
  const seen = new Set<string>();
  records.forEach((record) => { if (seen.has(record.candidateId)) issues.push(`duplicate-${record.candidateId}`); seen.add(record.candidateId); });
  return Object.freeze(issues);
}

export function nebulaV624ManifestDiff(previous: readonly NebulaV624Record[], current: readonly NebulaV624Record[]) {
  const left = new Map(previous.map((record) => [record.candidateId, nebulaV624Fingerprint(record)]));
  const right = new Map(current.map((record) => [record.candidateId, nebulaV624Fingerprint(record)]));
  return Object.freeze({ added: Object.freeze([...right.keys()].filter((id) => !left.has(id)).sort()), removed: Object.freeze([...left.keys()].filter((id) => !right.has(id)).sort()), changed: Object.freeze([...right.keys()].filter((id) => left.has(id) && left.get(id) !== right.get(id)).sort()) });
}

export function nebulaV624Stable(previous: readonly NebulaV624Record[], current: readonly NebulaV624Record[]): boolean { const diff = nebulaV624ManifestDiff(previous, current); return diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0; }
export function nebulaV624NoRuntimeAdmission(records: readonly NebulaV624Record[]): boolean { return records.every((record) => record.candidateOnly && record.runtimeAdmission === "candidate-only" && record.scientificPayloadWriteback === false); }
export function nebulaV624BlockerCounts(records: readonly NebulaV624Record[]): Readonly<Record<string, number>> { const counts: Record<string, number> = {}; records.forEach((record) => nebulaV624Assess(record).blockers.forEach((code) => { counts[code] = (counts[code] ?? 0) + 1; })); return Object.freeze(counts); }
export function nebulaV624Csv(records: readonly NebulaV624Record[]): string { const rows = ["candidateId,rank,state,rightsStatus,bytes,width,height,sha256,sourceUrl,blockers"]; records.forEach((record) => { const assessment = nebulaV624Assess(record); rows.push([record.candidateId, record.rank, record.state, record.rightsStatus, record.payload.bytes ?? "", record.payload.width ?? "", record.payload.height ?? "", record.payload.sha256 ?? "", record.sourceUrl, assessment.blockers.join("|")].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")); }); return `${rows.join("\n")}\n`; }
export function nebulaV624Jsonl(records: readonly NebulaV624Record[]): string { return `${records.map((record) => JSON.stringify({ record, assessment: nebulaV624Assess(record), classification: nebulaV624Classify(record) })).join("\n")}\n`; }
export function nebulaV624Ids(): readonly string[] { return IDS; }

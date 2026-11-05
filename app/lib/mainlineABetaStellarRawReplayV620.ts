import { createHash } from "node:crypto";

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

/**
 * Offline replay and verification helpers for the V620 live SIMBAD collector.
 *
 * This module is deliberately transport agnostic.  It consumes a serialised
 * attempt ledger and returns diagnostics; it never mutates the V616 snapshot,
 * promotes fixture HTML, or writes a scientific payload.  A collector may use
 * the helpers while recording a failed request, and an offline verifier can
 * replay the same ledger without opening a network connection.
 */

export type RawReplayTransportV620 = "https-html" | "astroquery-sim-script" | "fixture-replay";
export type RawReplayErrorClassV620 =
  | "timeout"
  | "network"
  | "http-status"
  | "content-type"
  | "redirect"
  | "integrity"
  | "identity"
  | "unknown";

export type RawReplayRedirectV620 = Readonly<{ status: number; from: string; to: string }>;

export type RawReplayAttemptV620 = Readonly<{
  attempt: number;
  startedAt: string;
  endedAt: string;
  timeoutMs?: number;
  timeout: boolean;
  retryCount: number;
  httpStatus: number | null;
  contentType: string | null;
  requestUrl: string;
  finalUrl: string | null;
  redirectChain: readonly RawReplayRedirectV620[];
  errorClass: RawReplayErrorClassV620 | null;
  errorCategory?: string | null;
  errorMessage?: string | null;
  requestFingerprint: string;
  transport: RawReplayTransportV620;
  responseCaptured: boolean | 0 | 1;
  responseBytes: number | null;
  rawPageSha256: string | null;
  rawArtifactSha256?: string | null;
  rawArtifactPath?: string | null;
  rawResponse?: string | null;
}>;

export type RawReplayRecordV620 = Readonly<{
  id: string;
  planId: string;
  requestUrl: string;
  serviceEndpoint: string;
  expectedSnapshotRecordDigest: string;
  expectedProjectionRecordDigest: string;
  attempts: readonly RawReplayAttemptV620[];
  state: "pending" | "captured" | "raw-only" | "structured" | "blocked";
  responseCaptured: boolean | 0 | 1;
  runtimeAdmission: "candidate-only";
  measurementAdmission: "not-admitted";
  scientificPayloadWriteback: false;
}>;

export type RawReplayIssueV620 = Readonly<{ code: string; detail?: string }>;

export type RawStructuredEvidenceV620 = Readonly<{
  parser: "simbad-html" | "sim-tap" | "fixture-replay";
  parseStatus: "structured";
  sourceUrl: string;
  responseSha256: string;
  snapshotRecordDigest: string;
  projectionRecordDigest: string;
  identity: Readonly<{ id: string; canonicalName: string }>;
  fields: Readonly<Record<string, string | number | null>>;
  sourceRefs: readonly Readonly<{ url: string; label: string }>[];
  scientificPayloadWriteback: false;
}>;

export type RawReplayResultV620 = Readonly<{
  id: string;
  attempts: number;
  retryCount: number;
  responseCaptured: boolean;
  state: RawReplayRecordV620["state"];
  errorClasses: readonly RawReplayErrorClassV620[];
  issues: readonly RawReplayIssueV620[];
}>;

const ALLOWED_IDS = new Set(["acrux", "spica", "regulus", "polaris"]);
const ALLOWED_CONTENT_TYPES = /^(text\/html|text\/plain|text\/tab-separated-values|application\/json)(?:;|$)/i;
const SERVICE_ENDPOINT = "https://simbad.cds.unistra.fr/simbad/sim-tap/sync";
const SHA256 = /^[a-f0-9]{64}$/i;
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

export function rawReplayRequestFingerprintV620(input: Pick<RawReplayAttemptV620, "transport" | "requestUrl"> & { method?: string }): string {
  return `${(input.method ?? "GET").toUpperCase()} ${input.requestUrl} transport=${input.transport}`;
}

export function rawReplayAllowedContentTypeV620(contentType: string | null): boolean {
  return typeof contentType === "string" && ALLOWED_CONTENT_TYPES.test(contentType.trim());
}

export function rawReplaySourceSafeV620(url: string): boolean {
  if (typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === "simbad.cds.unistra.fr";
  } catch {
    return false;
  }
}

function issue(code: string, detail?: string): RawReplayIssueV620 {
  return detail ? { code, detail } : { code };
}

function capturedFlag(value: boolean | 0 | 1): boolean { return value === true || value === 1; }

function validPastIso(value: unknown, now = Date.now()): boolean {
  if (typeof value !== "string" || !ISO_UTC.test(value)) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value && parsed <= now;
}

function validateRedirects(attempt: RawReplayAttemptV620): RawReplayIssueV620[] {
  const issues: RawReplayIssueV620[] = [];
  let previous = attempt.requestUrl;
  for (const redirect of attempt.redirectChain) {
    if (!Number.isInteger(redirect.status) || redirect.status < 300 || redirect.status > 399) issues.push(issue("redirect-status-invalid"));
    if (!rawReplaySourceSafeV620(redirect.from) || !rawReplaySourceSafeV620(redirect.to)) issues.push(issue("redirect-url-unsafe"));
    if (redirect.from !== previous) issues.push(issue("redirect-chain-discontinuous"));
    previous = redirect.to;
  }
  if (attempt.finalUrl && previous !== attempt.finalUrl) issues.push(issue("final-url-not-chain-tail"));
  return issues;
}

export function validateRawReplayAttemptV620(attempt: RawReplayAttemptV620, expectedRequestUrl: string): readonly RawReplayIssueV620[] {
  const issues: RawReplayIssueV620[] = [];
  if (!Number.isInteger(attempt.attempt) || attempt.attempt < 1) issues.push(issue("attempt-number-invalid"));
  if (!Number.isInteger(attempt.retryCount) || attempt.retryCount < 0 || attempt.retryCount > attempt.attempt - 1) issues.push(issue("retry-count-invalid"));
  if (!validPastIso(attempt.startedAt) || !validPastIso(attempt.endedAt) || Date.parse(attempt.endedAt) < Date.parse(attempt.startedAt)) issues.push(issue("timestamp-invalid"));
  if (attempt.requestUrl !== expectedRequestUrl || !rawReplaySourceSafeV620(attempt.requestUrl)) issues.push(issue("request-url-mismatch"));
  if (attempt.finalUrl !== null && !rawReplaySourceSafeV620(attempt.finalUrl)) issues.push(issue("final-url-unsafe"));
  issues.push(...validateRedirects(attempt));
  if (attempt.transport === "fixture-replay" && attempt.responseCaptured) issues.push(issue("fixture-response-not-live"));
  if (capturedFlag(attempt.responseCaptured)) {
    if (attempt.timeout) issues.push(issue("captured-timeout-conflict"));
    if (attempt.httpStatus !== 200) issues.push(issue("captured-http-status-invalid"));
    if (!rawReplayAllowedContentTypeV620(attempt.contentType)) issues.push(issue("captured-content-type-invalid"));
    if (!attempt.finalUrl) issues.push(issue("captured-final-url-missing"));
    if (!Number.isInteger(attempt.responseBytes) || (attempt.responseBytes ?? 0) <= 0) issues.push(issue("captured-byte-count-invalid"));
    if (!SHA256.test(attempt.rawPageSha256 ?? "")) issues.push(issue("captured-hash-invalid"));
    if (typeof attempt.rawResponse === "string") {
      const bytes = new TextEncoder().encode(attempt.rawResponse).byteLength;
      if (bytes !== attempt.responseBytes) issues.push(issue("captured-byte-count-mismatch"));
      if (sha256(attempt.rawResponse) !== attempt.rawPageSha256) issues.push(issue("captured-hash-mismatch"));
    }
    if (attempt.errorClass !== null) issues.push(issue("captured-error-conflict"));
  } else if (attempt.rawResponse || attempt.rawArtifactPath || attempt.rawPageSha256 || attempt.responseBytes !== null) {
    issues.push(issue("uncaptured-artifact-present"));
  }
  if (attempt.errorClass === "timeout" && !attempt.timeout) issues.push(issue("timeout-class-mismatch"));
  if (!SHA256.test(attempt.requestFingerprint)) issues.push(issue("request-fingerprint-invalid"));
  if (attempt.responseCaptured && attempt.rawArtifactSha256 && attempt.rawPageSha256 && attempt.rawArtifactSha256 !== attempt.rawPageSha256) issues.push(issue("artifact-hash-alias-mismatch"));
  return Object.freeze(issues);
}

export function validateStructuredEvidenceV620(record: RawReplayRecordV620, evidence: RawStructuredEvidenceV620): readonly RawReplayIssueV620[] {
  const issues: RawReplayIssueV620[] = [];
  const captured = record.attempts.filter((entry) => capturedFlag(entry.responseCaptured));
  const latest = captured.at(-1);
  if (record.state !== "structured") issues.push(issue("structured-state-required"));
  if (!latest) issues.push(issue("structured-response-missing"));
  if (latest?.transport === "fixture-replay" || evidence.parser === "fixture-replay") issues.push(issue("fixture-structured-boundary"));
  if (evidence.parseStatus !== "structured") issues.push(issue("parse-status-invalid"));
  if (!rawReplaySourceSafeV620(evidence.sourceUrl) || evidence.sourceUrl !== record.requestUrl) issues.push(issue("structured-source-mismatch"));
  const responseHash = latest?.rawPageSha256 ?? latest?.rawArtifactSha256 ?? null;
  if (!SHA256.test(evidence.responseSha256) || responseHash !== evidence.responseSha256) issues.push(issue("structured-response-hash-mismatch"));
  if (evidence.snapshotRecordDigest !== record.expectedSnapshotRecordDigest || evidence.projectionRecordDigest !== record.expectedProjectionRecordDigest) issues.push(issue("structured-v616-digest-mismatch"));
  if (!evidence.identity || evidence.identity.id !== record.id || typeof evidence.identity.canonicalName !== "string" || evidence.identity.canonicalName.trim().length === 0) issues.push(issue("structured-identity-invalid"));
  if (!evidence.fields || typeof evidence.fields !== "object" || Object.keys(evidence.fields).length === 0) issues.push(issue("structured-fields-empty"));
  if (!Array.isArray(evidence.sourceRefs) || evidence.sourceRefs.length === 0) issues.push(issue("structured-source-closure-empty"));
  for (const source of evidence.sourceRefs ?? []) {
    if (!rawReplaySourceSafeV620(source.url) || typeof source.label !== "string" || source.label.trim().length === 0) issues.push(issue("structured-source-ref-invalid"));
  }
  if (evidence.scientificPayloadWriteback !== false || record.scientificPayloadWriteback !== false) issues.push(issue("structured-writeback-opened"));
  return Object.freeze(issues);
}

export function replayStructuredRawCaptureV620(record: RawReplayRecordV620, evidence: RawStructuredEvidenceV620): RawReplayResultV620 & Readonly<{ structured: boolean; sourceClosed: boolean; fieldsConsistent: boolean }> {
  const base = replayRawCaptureRecordV620(record);
  const evidenceIssues = validateStructuredEvidenceV620(record, evidence);
  const issues = Object.freeze([...base.issues, ...evidenceIssues]);
  return Object.freeze({ ...base, structured: evidenceIssues.length === 0 && base.issues.length === 0, sourceClosed: evidenceIssues.filter((entry) => entry.code.startsWith("structured-source")).length === 0, fieldsConsistent: evidenceIssues.filter((entry) => entry.code.startsWith("structured-") && entry.code.includes("field")).length === 0, issues, state: issues.length > 0 ? "blocked" : "structured", responseCaptured: base.responseCaptured });
}

export function replayRawCaptureRecordV620(record: RawReplayRecordV620): RawReplayResultV620 {
  const issues: RawReplayIssueV620[] = [];
  if (!ALLOWED_IDS.has(record.id)) issues.push(issue("id-not-allowlisted"));
  if (!record.planId || !record.requestUrl || !rawReplaySourceSafeV620(record.requestUrl)) issues.push(issue("plan-identity-invalid"));
  if (record.serviceEndpoint !== SERVICE_ENDPOINT) issues.push(issue("service-endpoint-invalid"));
  if (!SHA256.test(record.expectedSnapshotRecordDigest) || !SHA256.test(record.expectedProjectionRecordDigest)) issues.push(issue("v616-digest-invalid"));
  if (record.runtimeAdmission !== "candidate-only" || record.measurementAdmission !== "not-admitted" || record.scientificPayloadWriteback !== false) issues.push(issue("admission-boundary-opened"));
  if (capturedFlag(record.responseCaptured) && record.attempts.every((entry) => !capturedFlag(entry.responseCaptured))) issues.push(issue("record-response-without-attempt"));
  const ordered = [...record.attempts].sort((a, b) => a.attempt - b.attempt);
  if (ordered.some((entry, index) => entry.attempt !== index + 1)) issues.push(issue("attempt-sequence-invalid"));
  for (const attempt of ordered) issues.push(...validateRawReplayAttemptV620(attempt, record.requestUrl));
  const successful = ordered.filter((entry) => capturedFlag(entry.responseCaptured));
  if (successful.length > 1) issues.push(issue("multiple-captured-attempts"));
  if (successful.length === 0 && capturedFlag(record.responseCaptured)) issues.push(issue("response-captured-flag-invalid"));
  if (successful.length === 0 && (record.state === "captured" || record.state === "raw-only" || record.state === "structured")) issues.push(issue("state-without-response"));
  if (record.state === "structured" && successful.some((entry) => entry.transport === "fixture-replay")) issues.push(issue("fixture-structured-boundary"));
  const classes = Object.freeze(ordered.flatMap((entry) => entry.errorClass ? [entry.errorClass] : []));
  return Object.freeze({ id: record.id, attempts: ordered.length, retryCount: ordered.reduce((sum, entry) => sum + entry.retryCount, 0), responseCaptured: successful.length === 1 && issues.length === 0, state: issues.length > 0 ? "blocked" : record.state, errorClasses: classes, issues: Object.freeze(issues) });
}

export function verifyRawReplayLedgerV620(records: readonly RawReplayRecordV620[]): readonly RawReplayResultV620[] {
  const results = records.map((record) => replayRawCaptureRecordV620(record));
  return Object.freeze(results);
}

export function rawReplayLedgerSummaryV620(results: readonly RawReplayResultV620[]) {
  return Object.freeze({ total: results.length, valid: results.filter((result) => result.issues.length === 0).length, blocked: results.filter((result) => result.state === "blocked").length, captured: results.filter((result) => result.responseCaptured).length, failedAttempts: results.reduce((sum, result) => sum + result.errorClasses.length, 0), scientificPayloadWriteback: false as const });
}

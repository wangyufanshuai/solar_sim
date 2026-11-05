import { createHash } from "node:crypto";

export type NebulaAttemptErrorClassV623 =
  | "network-not-run"
  | "timeout"
  | "dns"
  | "tls"
  | "http"
  | "content-type"
  | "payload"
  | "unknown";

export type NebulaAttemptV623 = Readonly<{
  attempt: number;
  startedAt: string;
  endedAt: string;
  timeout: boolean;
  timeoutMs: number;
  retryCount: number;
  httpStatus: number | null;
  contentType: string | null;
  requestUrl: string;
  finalUrl: string | null;
  redirectChain: readonly string[];
  errorClass: NebulaAttemptErrorClassV623 | null;
  errorMessage: string | null;
  requestFingerprint: string;
  responseCaptured: 0 | 1;
  responseBytes: number | null;
  width: number | null;
  height: number | null;
  format: string | null;
  rawArtifactPath: string | null;
  rawPageSha256: string | null;
}>;

export type NebulaLedgerPayloadV623 = Readonly<{
  bytes: number | null;
  sha256: string | null;
  width: number | null;
  height: number | null;
  format: string | null;
}>;

export type NebulaLedgerRecordV623 = Readonly<{
  id: string;
  candidateId: string;
  sourceUrl: string;
  requestFingerprint: string;
  responseCaptured: 0 | 1;
  payload: NebulaLedgerPayloadV623;
  attempts: readonly NebulaAttemptV623[];
  status: string;
  rightsStatus: string;
  runtimeAdmission: "candidate-only";
  measurementAdmission: "not-admitted";
  scientificPayloadWriteback: false;
}>;

export type NebulaLedgerV623 = Readonly<{
  schema: "mainline-a-nebula-image-attempt-ledger-v623";
  generatedAt: string;
  source: Readonly<{ path: string; schema: string }>;
  counts: Readonly<{
    total: number;
    attempted: number;
    responseCaptured: number;
    payloadPresent: number;
    rightsCleared: number;
  }>;
  boundary: Readonly<{
    candidateOnly: true;
    hold: true;
    notAdmitted: true;
    scientificPayloadWriteback: false;
    runtimeWrites: false;
    measurementWrites: false;
  }>;
  records: readonly NebulaLedgerRecordV623[];
}>;

const SHA256 = /^[a-f0-9]{64}$/i;
const ALLOWED_FORMATS = new Set(["png", "jpeg", "jpg", "webp"]);
const ALLOWED_MIMES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
const MAX_ATTEMPTS = 4;

function freeze<T>(value: T): T {
  return Object.freeze(value);
}

function sortedObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortedObject);
  if (!value || typeof value !== "object") return value;
  const object = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(object).sort().map((key) => [key, sortedObject(object[key])]));
}

export function ledgerFingerprintV623(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(sortedObject(value)), "utf8").digest("hex");
}

export function isHttpsImageUrlV623(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && parsed.hostname.length > 0 && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

export function imageUrlHostV623(value: string): string | null {
  try {
    const parsed = new URL(value);
    return parsed.hostname.toLocaleLowerCase();
  } catch {
    return null;
  }
}

export function imageUrlExtensionV623(value: string): string | null {
  try {
    const pathname = new URL(value).pathname.toLocaleLowerCase();
    const match = pathname.match(/\.([a-z0-9]+)$/);
    return match && ALLOWED_FORMATS.has(match[1]) ? match[1] : null;
  } catch {
    return null;
  }
}

export function requestFingerprintV623(url: string, headers: Record<string, string> = {}): string {
  return ledgerFingerprintV623({ url, headers: Object.fromEntries(Object.entries(headers).sort()) });
}

export function durationMsV623(startedAt: string, endedAt: string): number | null {
  const start = Date.parse(startedAt);
  const end = Date.parse(endedAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  return end - start;
}

export function attemptDurationMsV623(attempt: NebulaAttemptV623): number | null {
  return durationMsV623(attempt.startedAt, attempt.endedAt);
}

export function attemptHasResponseV623(attempt: NebulaAttemptV623): boolean {
  return attempt.responseCaptured === 1 && attempt.httpStatus !== null;
}

export function attemptSucceededV623(attempt: NebulaAttemptV623): boolean {
  return attemptHasResponseV623(attempt) && (attempt.httpStatus ?? 0) >= 200 && (attempt.httpStatus ?? 0) < 300 && attempt.errorClass === null;
}

export function attemptRetryableV623(attempt: NebulaAttemptV623): boolean {
  return attempt.errorClass === "timeout" || attempt.errorClass === "dns" || attempt.errorClass === "tls" || attempt.errorClass === "unknown" || (attempt.httpStatus !== null && attempt.httpStatus >= 500);
}

export function classifyFetchFailureV623(input: { error?: unknown; status?: number | null; contentType?: string | null; timedOut?: boolean }): NebulaAttemptErrorClassV623 | null {
  if (input.timedOut) return "timeout";
  if (input.status !== undefined && input.status !== null && (input.status < 200 || input.status >= 300)) return "http";
  if (input.contentType && !ALLOWED_MIMES.has(input.contentType.split(";")[0].trim().toLocaleLowerCase())) return "content-type";
  const message = input.error instanceof Error ? input.error.message.toLocaleLowerCase() : String(input.error ?? "").toLocaleLowerCase();
  if (!message) return null;
  if (message.includes("dns") || message.includes("enotfound")) return "dns";
  if (message.includes("tls") || message.includes("certificate")) return "tls";
  if (message.includes("timeout") || message.includes("aborted")) return "timeout";
  if (message.includes("payload") || message.includes("image")) return "payload";
  return "unknown";
}

export function normalizeContentTypeV623(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.split(";")[0].trim().toLocaleLowerCase();
  return ALLOWED_MIMES.has(normalized) ? normalized : normalized || null;
}

export function normalizeRedirectChainV623(values: readonly string[] | null | undefined): readonly string[] {
  if (!values) return freeze([]);
  return freeze(values.map((value) => value.trim()).filter(Boolean));
}

export function normalizeSha256V623(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLocaleLowerCase() ?? "";
  return SHA256.test(normalized) ? normalized : null;
}

export function normalizeDimensionV623(value: number | null | undefined): number | null {
  return Number.isInteger(value) && (value ?? 0) > 0 ? value ?? null : null;
}

export function normalizeBytesV623(value: number | null | undefined): number | null {
  return Number.isInteger(value) && (value ?? 0) > 0 ? value ?? null : null;
}

export function normalizeAttemptV623(attempt: NebulaAttemptV623): NebulaAttemptV623 {
  return freeze({
    ...attempt,
    contentType: normalizeContentTypeV623(attempt.contentType),
    redirectChain: normalizeRedirectChainV623(attempt.redirectChain),
    requestFingerprint: attempt.requestFingerprint || requestFingerprintV623(attempt.requestUrl),
    rawPageSha256: normalizeSha256V623(attempt.rawPageSha256),
    responseBytes: normalizeBytesV623(attempt.responseBytes),
    width: normalizeDimensionV623(attempt.width),
    height: normalizeDimensionV623(attempt.height),
  });
}

export function normalizePayloadV623(payload: NebulaLedgerPayloadV623): NebulaLedgerPayloadV623 {
  return freeze({
    bytes: normalizeBytesV623(payload.bytes),
    sha256: normalizeSha256V623(payload.sha256),
    width: normalizeDimensionV623(payload.width),
    height: normalizeDimensionV623(payload.height),
    format: payload.format?.trim().toLocaleLowerCase() ?? null,
  });
}

export function normalizeRecordV623(record: NebulaLedgerRecordV623): NebulaLedgerRecordV623 {
  return freeze({
    ...record,
    sourceUrl: record.sourceUrl.trim(),
    requestFingerprint: record.requestFingerprint || requestFingerprintV623(record.sourceUrl),
    payload: normalizePayloadV623(record.payload),
    attempts: freeze(record.attempts.map(normalizeAttemptV623)),
    scientificPayloadWriteback: false,
  });
}

export function normalizeLedgerV623(ledger: NebulaLedgerV623): NebulaLedgerV623 {
  return freeze({ ...ledger, records: freeze(ledger.records.map(normalizeRecordV623)) });
}

export function latestAttemptV623(record: NebulaLedgerRecordV623): NebulaAttemptV623 | null {
  return record.attempts.length ? record.attempts[record.attempts.length - 1] : null;
}

export function firstAttemptV623(record: NebulaLedgerRecordV623): NebulaAttemptV623 | null {
  return record.attempts[0] ?? null;
}

export function retryCountV623(record: NebulaLedgerRecordV623): number {
  return Math.max(0, record.attempts.length - 1);
}

export function attemptCountV623(record: NebulaLedgerRecordV623): number {
  return record.attempts.length;
}

export function responseAttemptCountV623(record: NebulaLedgerRecordV623): number {
  return record.attempts.filter(attemptHasResponseV623).length;
}

export function successfulAttemptCountV623(record: NebulaLedgerRecordV623): number {
  return record.attempts.filter(attemptSucceededV623).length;
}

export function timeoutCountV623(record: NebulaLedgerRecordV623): number {
  return record.attempts.filter((attempt) => attempt.timeout || attempt.errorClass === "timeout").length;
}

export function redirectCountV623(record: NebulaLedgerRecordV623): number {
  return record.attempts.reduce((total, attempt) => total + attempt.redirectChain.length, 0);
}

export function totalDurationMsV623(record: NebulaLedgerRecordV623): number {
  return record.attempts.reduce((total, attempt) => total + (attemptDurationMsV623(attempt) ?? 0), 0);
}

export function latestErrorClassV623(record: NebulaLedgerRecordV623): NebulaAttemptErrorClassV623 | null {
  return latestAttemptV623(record)?.errorClass ?? null;
}

export function latestHttpStatusV623(record: NebulaLedgerRecordV623): number | null {
  return latestAttemptV623(record)?.httpStatus ?? null;
}

export function recordHasPayloadV623(record: NebulaLedgerRecordV623): boolean {
  return record.responseCaptured === 1 && normalizeBytesV623(record.payload.bytes) !== null && normalizeSha256V623(record.payload.sha256) !== null;
}

export function recordDimensionsCompleteV623(record: NebulaLedgerRecordV623): boolean {
  return normalizeDimensionV623(record.payload.width) !== null && normalizeDimensionV623(record.payload.height) !== null;
}

export function recordMimeCompleteV623(record: NebulaLedgerRecordV623): boolean {
  const format = record.payload.format?.toLocaleLowerCase() ?? "";
  return ALLOWED_FORMATS.has(format);
}

export function recordSourceClosedV623(record: NebulaLedgerRecordV623): boolean {
  return isHttpsImageUrlV623(record.sourceUrl) && imageUrlExtensionV623(record.sourceUrl) !== null && record.requestFingerprint.length === 64;
}

export function recordBoundaryClosedV623(record: NebulaLedgerRecordV623): boolean {
  return record.runtimeAdmission === "candidate-only" && record.measurementAdmission === "not-admitted" && record.scientificPayloadWriteback === false;
}

export function recordAttemptLedgerClosedV623(record: NebulaLedgerRecordV623): boolean {
  return record.attempts.length > 0 && record.attempts.every((attempt) => attempt.attempt > 0 && attempt.timeoutMs > 0 && attempt.requestFingerprint.length === 64 && Date.parse(attempt.startedAt) <= Date.parse(attempt.endedAt));
}

export function recordIssuesV623(record: NebulaLedgerRecordV623): readonly string[] {
  const issues: string[] = [];
  if (!recordSourceClosedV623(record)) issues.push("source-open");
  if (!recordAttemptLedgerClosedV623(record)) issues.push("attempt-ledger-open");
  if (record.responseCaptured !== 0 && record.responseCaptured !== 1) issues.push("response-flag-invalid");
  if (recordHasPayloadV623(record) && !recordDimensionsCompleteV623(record)) issues.push("dimensions-missing");
  if (recordHasPayloadV623(record) && !recordMimeCompleteV623(record)) issues.push("format-missing");
  if (!recordBoundaryClosedV623(record)) issues.push("admission-boundary-open");
  const latest = latestAttemptV623(record);
  if (record.responseCaptured === 0 && latest?.responseCaptured === 1) issues.push("response-count-inconsistent");
  if (record.responseCaptured === 1 && !latest?.responseCaptured) issues.push("latest-response-missing");
  return freeze([...new Set(issues)]);
}

export function ledgerIssuesV623(ledger: NebulaLedgerV623): readonly string[] {
  const issues: string[] = [];
  if (ledger.schema !== "mainline-a-nebula-image-attempt-ledger-v623") issues.push("schema-invalid");
  if (!ledger.boundary.candidateOnly || !ledger.boundary.hold || !ledger.boundary.notAdmitted) issues.push("boundary-invalid");
  if (ledger.boundary.scientificPayloadWriteback || ledger.boundary.runtimeWrites || ledger.boundary.measurementWrites) issues.push("writeback-open");
  ledger.records.forEach((record) => recordIssuesV623(record).forEach((issue) => issues.push(`${record.id}:${issue}`)));
  return freeze([...new Set(issues)]);
}

export function ledgerCountsRecomputedV623(ledger: NebulaLedgerV623) {
  const records = ledger.records;
  return freeze({
    total: records.length,
    attempted: records.filter((record) => record.attempts.length > 0).length,
    responseCaptured: records.filter((record) => record.responseCaptured === 1).length,
    payloadPresent: records.filter(recordHasPayloadV623).length,
    rightsCleared: records.filter((record) => record.rightsStatus === "cleared").length,
  });
}

export function ledgerCountsMatchV623(ledger: NebulaLedgerV623): boolean {
  const expected = ledgerCountsRecomputedV623(ledger);
  return Object.keys(expected).every((key) => expected[key as keyof typeof expected] === ledger.counts[key as keyof typeof ledger.counts]);
}

export function ledgerStableV623(ledger: NebulaLedgerV623): boolean {
  return ledgerIssuesV623(ledger).length === 0 && ledgerCountsMatchV623(ledger) && ledger.records.every((record) => recordBoundaryClosedV623(record));
}

export function ledgerStatusV623(ledger: NebulaLedgerV623): "ready" | "pending" | "blocked" | "invalid" {
  const issues = ledgerIssuesV623(ledger);
  if (issues.length) return "invalid";
  if (ledger.records.some((record) => record.status.includes("blocked") || recordIssuesV623(record).length > 0)) return "blocked";
  if (ledger.records.some((record) => !recordHasPayloadV623(record) || record.rightsStatus !== "cleared")) return "pending";
  return "ready";
}

export function classifyRecordV623(record: NebulaLedgerRecordV623): "captured" | "network-pending" | "retryable" | "blocked" | "invalid" {
  const issues = recordIssuesV623(record);
  if (issues.includes("admission-boundary-open") || issues.includes("source-open")) return "invalid";
  if (record.status.includes("blocked")) return "blocked";
  if (recordHasPayloadV623(record)) return "captured";
  if (latestAttemptV623(record) && attemptRetryableV623(latestAttemptV623(record)!)) return "retryable";
  return "network-pending";
}

export function retryPlanV623(record: NebulaLedgerRecordV623, now = new Date()): Readonly<{ id: string; allowed: boolean; nextAttempt: number; reason: string }> {
  const latest = latestAttemptV623(record);
  const count = attemptCountV623(record);
  if (recordHasPayloadV623(record)) return freeze({ id: record.id, allowed: false, nextAttempt: count, reason: "payload-already-captured" });
  if (count >= MAX_ATTEMPTS) return freeze({ id: record.id, allowed: false, nextAttempt: count, reason: "retry-budget-exhausted" });
  if (!latest) return freeze({ id: record.id, allowed: true, nextAttempt: 1, reason: "initial-attempt" });
  if (!attemptRetryableV623(latest)) return freeze({ id: record.id, allowed: false, nextAttempt: count + 1, reason: "latest-attempt-not-retryable" });
  const ended = Date.parse(latest.endedAt);
  if (Number.isFinite(ended) && now.getTime() - ended < 1000) return freeze({ id: record.id, allowed: false, nextAttempt: count + 1, reason: "backoff-window" });
  return freeze({ id: record.id, allowed: true, nextAttempt: count + 1, reason: "retryable-failure" });
}

export function retryPlanForLedgerV623(ledger: NebulaLedgerV623, now = new Date()) {
  return freeze(ledger.records.map((record) => retryPlanV623(record, now)));
}

export function errorClassCountsV623(ledger: NebulaLedgerV623): Readonly<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const record of ledger.records) for (const attempt of record.attempts) {
    const key = attempt.errorClass ?? (attemptSucceededV623(attempt) ? "success" : "unclassified");
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return freeze(counts);
}

export function hostCountsV623(ledger: NebulaLedgerV623): Readonly<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const record of ledger.records) {
    const host = imageUrlHostV623(record.sourceUrl) ?? "invalid";
    counts[host] = (counts[host] ?? 0) + 1;
  }
  return freeze(counts);
}

export function statusCountsV623(ledger: NebulaLedgerV623): Readonly<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const record of ledger.records) {
    const status = classifyRecordV623(record);
    counts[status] = (counts[status] ?? 0) + 1;
  }
  return freeze(counts);
}

export function durationSummaryV623(ledger: NebulaLedgerV623) {
  const durations = ledger.records.flatMap((record) => record.attempts.map(attemptDurationMsV623).filter((value): value is number => value !== null));
  const sorted = [...durations].sort((a, b) => a - b);
  const percentile = (ratio: number) => sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * ratio))] : null;
  return freeze({ count: durations.length, totalMs: durations.reduce((sum, value) => sum + value, 0), minMs: sorted[0] ?? null, maxMs: sorted.at(-1) ?? null, p50Ms: percentile(0.5), p95Ms: percentile(0.95) });
}

export function redirectSummaryV623(ledger: NebulaLedgerV623) {
  const counts = ledger.records.map(redirectCountV623);
  return freeze({ records: counts.length, redirectedRecords: counts.filter((value) => value > 0).length, redirects: counts.reduce((sum, value) => sum + value, 0), maxPerRecord: Math.max(0, ...counts) });
}

export function ledgerReportV623(ledger: NebulaLedgerV623) {
  return freeze({ schema: ledger.schema, fingerprint: ledgerFingerprintV623(ledger), status: ledgerStatusV623(ledger), stable: ledgerStableV623(ledger), counts: ledgerCountsRecomputedV623(ledger), declaredCounts: ledger.counts, issues: ledgerIssuesV623(ledger), statusCounts: statusCountsV623(ledger), errorClasses: errorClassCountsV623(ledger), hosts: hostCountsV623(ledger), duration: durationSummaryV623(ledger), redirects: redirectSummaryV623(ledger), retryPlan: retryPlanForLedgerV623(ledger, new Date(0)), boundary: ledger.boundary });
}

export function ledgerCsvV623(ledger: NebulaLedgerV623): string {
  const rows = ["id,class,status,attempts,retries,response,httpStatus,errorClass,bytes,sha256,width,height,format,sourceUrl,fingerprint,issues"];
  for (const record of ledger.records) {
    const values = [record.id, classifyRecordV623(record), record.status, attemptCountV623(record), retryCountV623(record), record.responseCaptured, latestHttpStatusV623(record) ?? "", latestErrorClassV623(record) ?? "", record.payload.bytes ?? "", record.payload.sha256 ?? "", record.payload.width ?? "", record.payload.height ?? "", record.payload.format ?? "", record.sourceUrl, record.requestFingerprint, recordIssuesV623(record).join("|")];
    rows.push(values.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","));
  }
  return `${rows.join("\n")}\n`;
}

export function ledgerJsonlV623(ledger: NebulaLedgerV623): string {
  return `${ledger.records.map((record) => JSON.stringify({ record, class: classifyRecordV623(record), issues: recordIssuesV623(record), retry: retryPlanV623(record, new Date(0)) })).join("\n")}\n`;
}

export function ledgerMarkdownV623(ledger: NebulaLedgerV623): string {
  const report = ledgerReportV623(ledger);
  const lines = ["# Mainline A Nebula Acquisition Ledger V623", "", `- status: ${report.status}`, `- fingerprint: ${report.fingerprint}`, `- records: ${report.counts.total}`, `- responseCaptured: ${report.counts.responseCaptured}`, `- payloadPresent: ${report.counts.payloadPresent}`, `- rightsCleared: ${report.counts.rightsCleared}`, "", "| id | class | attempts | retries | latest error | blockers |", "| --- | --- | ---: | ---: | --- | --- |"];
  for (const record of ledger.records) lines.push(`| ${record.id} | ${classifyRecordV623(record)} | ${attemptCountV623(record)} | ${retryCountV623(record)} | ${latestErrorClassV623(record) ?? "—"} | ${recordIssuesV623(record).join("; ") || "—"} |`);
  return `${lines.join("\n")}\n`;
}

export function ledgerDiffV623(left: NebulaLedgerV623, right: NebulaLedgerV623) {
  const leftMap = new Map(left.records.map((record) => [record.id, ledgerFingerprintV623(record)]));
  const rightMap = new Map(right.records.map((record) => [record.id, ledgerFingerprintV623(record)]));
  return freeze({ added: freeze([...rightMap.keys()].filter((id) => !leftMap.has(id)).sort()), removed: freeze([...leftMap.keys()].filter((id) => !rightMap.has(id)).sort()), changed: freeze([...rightMap.keys()].filter((id) => leftMap.has(id) && leftMap.get(id) !== rightMap.get(id)).sort()), countsChanged: ledgerCountsRecomputedV623(left).total !== ledgerCountsRecomputedV623(right).total });
}

export function ledgerOnlyCandidateBoundaryV623(ledger: NebulaLedgerV623): boolean {
  return ledger.records.every(recordBoundaryClosedV623) && ledger.boundary.candidateOnly && ledger.boundary.hold && ledger.boundary.notAdmitted && !ledger.boundary.scientificPayloadWriteback;
}

export function ledgerNoSyntheticPayloadV623(ledger: NebulaLedgerV623): boolean {
  return ledger.records.every((record) => !record.sourceUrl.toLocaleLowerCase().includes("fixture") && !record.sourceUrl.toLocaleLowerCase().includes("synthetic") && !record.payload.format?.toLocaleLowerCase().includes("synthetic"));
}

export function ledgerSourceHostsAllowedV623(ledger: NebulaLedgerV623, allowed: readonly string[]): boolean {
  const set = new Set(allowed.map((value) => value.toLocaleLowerCase()));
  return ledger.records.every((record) => set.has(imageUrlHostV623(record.sourceUrl) ?? ""));
}

export function ledgerRecomputedShaV623(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function payloadMatchesBytesV623(payload: NebulaLedgerPayloadV623, bytes: Uint8Array): boolean {
  return payload.bytes === bytes.byteLength && payload.sha256 === ledgerRecomputedShaV623(bytes);
}

export function transitionRecordToAttemptV623(record: NebulaLedgerRecordV623, attempt: NebulaAttemptV623): NebulaLedgerRecordV623 {
  const normalized = normalizeAttemptV623(attempt);
  const attempts = freeze([...record.attempts, normalized]);
  const captured = normalized.responseCaptured === 1 && attemptSucceededV623(normalized);
  return normalizeRecordV623({ ...record, attempts, responseCaptured: captured ? 1 : record.responseCaptured, payload: captured ? { bytes: normalized.responseBytes, sha256: normalized.rawPageSha256, width: normalized.width, height: normalized.height, format: normalized.format } : record.payload, status: captured ? "payload-captured" : `attempt-${normalized.errorClass ?? "pending"}` });
}

export function emptyPayloadV623(): NebulaLedgerPayloadV623 {
  return freeze({ bytes: null, sha256: null, width: null, height: null, format: null });
}

export function makeInitialRecordV623(id: string, sourceUrl: string, now = new Date()): NebulaLedgerRecordV623 {
  const timestamp = now.toISOString();
  const attempt: NebulaAttemptV623 = { attempt: 1, startedAt: timestamp, endedAt: timestamp, timeout: false, timeoutMs: 20_000, retryCount: 0, httpStatus: null, contentType: null, requestUrl: sourceUrl, finalUrl: null, redirectChain: [], errorClass: "network-not-run", errorMessage: "offline ledger seed; live image collector not executed", requestFingerprint: requestFingerprintV623(sourceUrl), responseCaptured: 0, responseBytes: null, width: null, height: null, format: null, rawArtifactPath: null, rawPageSha256: null };
  return freeze({ id, candidateId: id, sourceUrl, requestFingerprint: attempt.requestFingerprint, responseCaptured: 0, payload: emptyPayloadV623(), attempts: freeze([attempt]), status: "acquisition-pending", rightsStatus: "review-pending", runtimeAdmission: "candidate-only", measurementAdmission: "not-admitted", scientificPayloadWriteback: false });
}

export function makeOfflineLedgerV623(ids: readonly string[], source: Readonly<{ path: string; schema: string }>, now = new Date()): NebulaLedgerV623 {
  const records = freeze(ids.map((id) => makeInitialRecordV623(id, "https://images-assets.nasa.gov/image/offline.jpg", now)));
  const ledger: NebulaLedgerV623 = { schema: "mainline-a-nebula-image-attempt-ledger-v623", generatedAt: now.toISOString(), source, counts: { total: records.length, attempted: records.length, responseCaptured: 0, payloadPresent: 0, rightsCleared: 0 }, boundary: { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false, runtimeWrites: false, measurementWrites: false }, records };
  return freeze(ledger);
}

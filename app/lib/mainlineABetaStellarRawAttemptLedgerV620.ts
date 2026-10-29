export type RawAttemptErrorCategoryV620 = "http-4xx" | "http-5xx" | "timeout" | "dns" | "connection" | "invalid-response" | "network" | "network-not-run" | "CONTENT_TYPE" | "UNSAFE_REDIRECT" | "REDIRECT_LIMIT" | null;

export type StellarRawAttemptV620 = Readonly<{
  attempt: number;
  startedAt: string;
  endedAt: string;
  timeoutMs: number;
  retryCount: number;
  httpStatus: number | null;
  contentType: string | null;
  finalUrl: string | null;
  redirectChain: readonly Readonly<{ from: string; to: string; status: number }>[];
  errorCategory: RawAttemptErrorCategoryV620;
  errorMessage: string | null;
  requestFingerprint: string;
  responseCaptured: 0 | 1;
  rawArtifactPath: string | null;
  rawArtifactSha256: string | null;
  responseBytes: number | null;
}>;

export type StellarRawAttemptRecordV620 = Readonly<{
  planId: string;
  id: "acrux" | "spica" | "regulus" | "polaris";
  requestFingerprint: string;
  responseCaptured: 0 | 1;
  attempts: readonly StellarRawAttemptV620[];
}>;

export type StellarRawAttemptLedgerV620 = Readonly<{
  schema: "mainline-a-beta-stellar-raw-attempt-ledger-v620";
  generatedAt: string;
  source: Readonly<{ path: string; schema: string }>;
  counts: Readonly<{ total: number; attempted: number; responseCaptured: number; failed: number; pending: number }>;
  boundary: Readonly<{ candidateOnly: boolean; hold: boolean; notAdmitted: boolean; scientificPayloadWriteback: boolean; runtimeWrites: boolean; measurementWrites: boolean }>;
  records: readonly StellarRawAttemptRecordV620[];
}>;

const IDS = ["acrux", "spica", "regulus", "polaris"] as const;
const HASH = /^[a-f0-9]{64}$/i;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export function rawAttemptErrorLabelV620(category: RawAttemptErrorCategoryV620): string {
  const labels: Record<string, string> = { "http-4xx": "HTTP 4xx", "http-5xx": "HTTP 5xx", timeout: "超时", dns: "DNS", connection: "连接", "invalid-response": "无效响应", network: "网络", "network-not-run": "未执行网络请求", CONTENT_TYPE: "内容类型不允许", UNSAFE_REDIRECT: "重定向越界", REDIRECT_LIMIT: "重定向超限", null: "无错误" };
  return labels[String(category)] ?? "未知错误";
}

export function rawAttemptHasArtifactV620(attempt: StellarRawAttemptV620): boolean {
  return attempt.responseCaptured === 1 && typeof attempt.rawArtifactPath === "string" && HASH.test(attempt.rawArtifactSha256 ?? "") && typeof attempt.responseBytes === "number";
}

export function rawAttemptFailedClosedV620(attempt: StellarRawAttemptV620): boolean {
  return attempt.responseCaptured === 0 && attempt.rawArtifactPath === null && attempt.rawArtifactSha256 === null && attempt.responseBytes === null;
}

export function validateRawAttemptV620(attempt: StellarRawAttemptV620): readonly string[] {
  const errors: string[] = [];
  if (!Number.isInteger(attempt.attempt) || attempt.attempt < 1) errors.push("attempt-invalid");
  if (!ISO.test(attempt.startedAt) || !ISO.test(attempt.endedAt) || Date.parse(attempt.endedAt) < Date.parse(attempt.startedAt)) errors.push("timestamps-invalid");
  if (!Number.isInteger(attempt.timeoutMs) || attempt.timeoutMs < 1) errors.push("timeout-invalid");
  if (attempt.retryCount !== attempt.attempt - 1) errors.push("retry-count-invalid");
  if (attempt.httpStatus !== null && (!Number.isInteger(attempt.httpStatus) || attempt.httpStatus < 100 || attempt.httpStatus > 599)) errors.push("http-status-invalid");
  if (attempt.responseCaptured !== 0 && attempt.responseCaptured !== 1) errors.push("capture-flag-invalid");
  if (attempt.responseCaptured === 1 && !rawAttemptHasArtifactV620(attempt)) errors.push("captured-artifact-missing");
  if (attempt.responseCaptured === 0 && !rawAttemptFailedClosedV620(attempt)) errors.push("failed-artifact-leak");
  if (!HASH.test(attempt.requestFingerprint)) errors.push("request-fingerprint-invalid");
  if (attempt.redirectChain.some((hop) => !hop.from.startsWith("https://simbad.cds.unistra.fr/") || !hop.to.startsWith("https://simbad.cds.unistra.fr/"))) errors.push("redirect-chain-unsafe");
  return Object.freeze(errors);
}

export function validateRawAttemptLedgerV620(ledger: StellarRawAttemptLedgerV620): boolean {
  if (ledger.schema !== "mainline-a-beta-stellar-raw-attempt-ledger-v620" || ledger.records.length !== 4 || ledger.counts.total !== 4) return false;
  if (!ledger.boundary.candidateOnly || !ledger.boundary.hold || !ledger.boundary.notAdmitted || ledger.boundary.scientificPayloadWriteback || ledger.boundary.runtimeWrites || ledger.boundary.measurementWrites) return false;
  if (!ledger.records.every((record, index) => record.id === IDS[index] && HASH.test(record.requestFingerprint) && record.attempts.every((attempt) => validateRawAttemptV620(attempt).length === 0))) return false;
  const captured = ledger.records.reduce((sum, record) => sum + record.responseCaptured, 0);
  return ledger.counts.responseCaptured === captured && ledger.counts.attempted === ledger.records.filter((record) => record.attempts.length > 0).length;
}

export function rawAttemptLedgerSummaryV620(ledger: StellarRawAttemptLedgerV620) {
  return Object.freeze({ ...ledger.counts, errorCount: ledger.records.reduce((sum, record) => sum + record.attempts.filter((attempt) => attempt.errorCategory !== null).length, 0), artifactCount: ledger.records.reduce((sum, record) => sum + record.attempts.filter(rawAttemptHasArtifactV620).length, 0) });
}

export function replayRawAttemptLedgerV620(ledger: StellarRawAttemptLedgerV620, readArtifact: (path: string, expectedSha256: string) => boolean | string | Uint8Array | null) {
  if (!validateRawAttemptLedgerV620(ledger)) return Object.freeze({ status: "invalid" as const, rows: [] as const });
  const rows = ledger.records.map((record) => {
    const hashesVerified = record.attempts.filter(rawAttemptHasArtifactV620).every((attempt) => {
      const value = readArtifact(attempt.rawArtifactPath!, attempt.rawArtifactSha256!);
      if (value === null || attempt.rawArtifactSha256 === null) return false;
      if (typeof value === "boolean") return value;
      return typeof value === "string" ? value.length > 0 : value.byteLength > 0;
    });
    return Object.freeze({ id: record.id, attempts: record.attempts.length, responseCaptured: record.responseCaptured, hashesVerified, errors: record.attempts.map((attempt) => attempt.errorCategory).filter((category): category is Exclude<RawAttemptErrorCategoryV620, null> => category !== null) });
  });
  return Object.freeze({ status: "verified" as const, rows: Object.freeze(rows) });
}

export function rawAttemptTransportLabelV620(record: StellarRawAttemptRecordV620): string {
  const latest = record.attempts.at(-1);
  if (!latest) return "尚未尝试 HTTPS";
  return latest.responseCaptured ? `HTTPS ${latest.httpStatus ?? "?"} · ${latest.contentType ?? "unknown"}` : `HTTPS 失败 · ${rawAttemptErrorLabelV620(latest.errorCategory)}`;
}

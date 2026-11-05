import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createHash } from "node:crypto";

const ROOT = process.cwd();
const LEDGER_PATH = "app/data/mainlineANebulaImageAttemptLedgerV623.generated.json";
const OUTPUT_DIR = "docs/release/v607";
const REPORT_PATH = path.join(OUTPUT_DIR, "mainline-a-r63-nebula-ledger-audit.json");
const JSONL_PATH = path.join(OUTPUT_DIR, "mainline-a-r63-nebula-ledger-audit.jsonl");
const CSV_PATH = path.join(OUTPUT_DIR, "mainline-a-r63-nebula-ledger-audit.csv");
const MARKDOWN_PATH = path.join(OUTPUT_DIR, "mainline-a-r63-nebula-ledger-audit.md");

const IDS = [
  "ring-nebula",
  "dumbbell-nebula",
  "california-nebula",
  "bubble-nebula",
  "cats-eye-nebula",
  "omega-nebula",
];

const SHA256 = /^[a-f0-9]{64}$/i;

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8"));
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
}

function fingerprint(value) {
  return createHash("sha256").update(JSON.stringify(canonical(value)), "utf8").digest("hex");
}

function isHttps(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && parsed.hostname.length > 0 && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

function classifyAttempt(attempt) {
  if (attempt.responseCaptured === 1 && attempt.httpStatus >= 200 && attempt.httpStatus < 300 && !attempt.errorClass) return "success";
  if (attempt.timeout || attempt.errorClass === "timeout") return "timeout";
  if (attempt.errorClass === "dns" || attempt.errorClass === "tls") return "transport";
  if (attempt.errorClass === "http") return "http";
  if (attempt.errorClass === "content-type") return "content-type";
  if (attempt.errorClass === "payload") return "payload";
  return "pending";
}

function duration(attempt) {
  const started = Date.parse(attempt.startedAt);
  const ended = Date.parse(attempt.endedAt);
  return Number.isFinite(started) && Number.isFinite(ended) && ended >= started ? ended - started : null;
}

function recordIssues(record) {
  const issues = [];
  if (!record.id || record.id !== record.candidateId) issues.push("id-mismatch");
  if (!isHttps(record.sourceUrl)) issues.push("source-url-not-https");
  if (!SHA256.test(record.requestFingerprint ?? "")) issues.push("request-fingerprint-invalid");
  if (!Array.isArray(record.attempts) || record.attempts.length === 0) issues.push("attempt-ledger-empty");
  if (record.responseCaptured !== 0 && record.responseCaptured !== 1) issues.push("response-flag-invalid");
  if (record.responseCaptured === 0 && (record.payload.bytes !== null || record.payload.sha256 !== null)) issues.push("payload-present-without-response");
  if (record.runtimeAdmission !== "candidate-only") issues.push("runtime-admission-open");
  if (record.measurementAdmission !== "not-admitted") issues.push("measurement-admission-open");
  if (record.scientificPayloadWriteback !== false) issues.push("science-writeback-open");
  for (const attempt of record.attempts ?? []) {
    if (!Number.isInteger(attempt.attempt) || attempt.attempt < 1) issues.push(`${record.id}:attempt-number-invalid`);
    if (!SHA256.test(attempt.requestFingerprint ?? "")) issues.push(`${record.id}:attempt-fingerprint-invalid`);
    if (duration(attempt) === null) issues.push(`${record.id}:attempt-time-invalid`);
    if (attempt.responseCaptured === 0 && attempt.responseBytes !== null) issues.push(`${record.id}:response-bytes-without-response`);
    if (attempt.redirectChain?.some((url) => !isHttps(url))) issues.push(`${record.id}:redirect-not-https`);
  }
  return [...new Set(issues)];
}

function summarize(ledger) {
  const attempts = ledger.records.flatMap((record) => record.attempts ?? []);
  const durations = attempts.map(duration).filter((value) => value !== null).sort((a, b) => a - b);
  const errors = {};
  const classes = {};
  for (const attempt of attempts) {
    const error = attempt.errorClass ?? "none";
    errors[error] = (errors[error] ?? 0) + 1;
    const category = classifyAttempt(attempt);
    classes[category] = (classes[category] ?? 0) + 1;
  }
  const percentile = (ratio) => durations.length ? durations[Math.min(durations.length - 1, Math.floor((durations.length - 1) * ratio))] : null;
  const issues = ledger.records.flatMap(recordIssues);
  const sourceHosts = {};
  for (const record of ledger.records) {
    try {
      const host = new URL(record.sourceUrl).hostname;
      sourceHosts[host] = (sourceHosts[host] ?? 0) + 1;
    } catch {
      sourceHosts.invalid = (sourceHosts.invalid ?? 0) + 1;
    }
  }
  return {
    schema: ledger.schema,
    fingerprint: fingerprint(ledger),
    generatedAt: ledger.generatedAt,
    ids: ledger.records.map((record) => record.id),
    counts: {
      declared: ledger.counts,
      recomputed: {
        total: ledger.records.length,
        attempted: ledger.records.filter((record) => record.attempts.length > 0).length,
        responseCaptured: ledger.records.filter((record) => record.responseCaptured === 1).length,
        payloadPresent: ledger.records.filter((record) => record.payload.bytes !== null && record.payload.sha256 !== null).length,
        rightsCleared: ledger.records.filter((record) => record.rightsStatus === "cleared").length,
      },
    },
    attempts: {
      total: attempts.length,
      retries: attempts.reduce((sum, attempt) => sum + Math.max(0, (attempt.retryCount ?? 0)), 0),
      responseAttempts: attempts.filter((attempt) => attempt.responseCaptured === 1).length,
      timeoutAttempts: attempts.filter((attempt) => attempt.timeout).length,
      durationsMs: { count: durations.length, min: durations[0] ?? null, p50: percentile(0.5), p95: percentile(0.95), max: durations.at(-1) ?? null },
      errorClasses: errors,
      categories: classes,
    },
    sourceHosts,
    blockers: [...new Set(issues)],
    boundary: ledger.boundary,
    evidenceClass: "external-source-ledger-and-static-audit",
    liveImagePayloadClaim: "none",
    rightsClaim: "not-cleared",
    runtimeAdmission: "candidate-only",
    scientificPayloadWriteback: false,
  };
}

function csv(ledger) {
  const rows = ["id,status,attempts,retries,responseCaptured,httpStatus,errorClass,timeout,bytes,sha256,sourceUrl,requestFingerprint,issues"];
  for (const record of ledger.records) {
    const latest = record.attempts.at(-1);
    const values = [record.id, record.status, record.attempts.length, Math.max(0, record.attempts.length - 1), record.responseCaptured, latest?.httpStatus ?? "", latest?.errorClass ?? "", latest?.timeout ?? false, record.payload.bytes ?? "", record.payload.sha256 ?? "", record.sourceUrl, record.requestFingerprint, recordIssues(record).join("|")];
    rows.push(values.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","));
  }
  return `${rows.join("\n")}\n`;
}

function jsonl(ledger) {
  return `${ledger.records.map((record) => JSON.stringify({ id: record.id, status: record.status, fingerprint: fingerprint(record), issues: recordIssues(record), attempts: record.attempts.map((attempt) => ({ attempt: attempt.attempt, class: classifyAttempt(attempt), durationMs: duration(attempt), httpStatus: attempt.httpStatus, timeout: attempt.timeout, responseCaptured: attempt.responseCaptured })) })).join("\n")}\n`;
}

function markdown(report) {
  const lines = ["# R63 Nebula Image Attempt Ledger Audit", "", `- ledger fingerprint: ${report.fingerprint}`, `- records: ${report.counts.recomputed.total}`, `- attempted: ${report.counts.recomputed.attempted}`, `- responseCaptured: ${report.counts.recomputed.responseCaptured}`, `- payloadPresent: ${report.counts.recomputed.payloadPresent}`, `- rightsCleared: ${report.counts.recomputed.rightsCleared}`, `- evidence: ${report.evidenceClass}`, "", "| id | attempts | response | latest error | blockers |", "| --- | ---: | ---: | --- | --- |"];
  for (const id of report.ids) {
    const record = report._ledger.records.find((entry) => entry.id === id);
    const latest = record.attempts.at(-1);
    lines.push(`| ${id} | ${record.attempts.length} | ${record.responseCaptured} | ${latest?.errorClass ?? "—"} | ${recordIssues(record).join("; ") || "—"} |`);
  }
  return `${lines.join("\n")}\n`;
}

function main() {
  const ledger = readJson(LEDGER_PATH);
  if (ledger.records.length !== IDS.length || ledger.records.some((record, index) => record.id !== IDS[index])) throw new Error("R63 ledger roster mismatch");
  const report = summarize(ledger);
  const reportWithLedger = { ...report, _ledger: ledger };
  fs.mkdirSync(path.join(ROOT, OUTPUT_DIR), { recursive: true });
  fs.writeFileSync(path.join(ROOT, REPORT_PATH), JSON.stringify({ ...report, _ledger: undefined }, null, 2) + "\n");
  fs.writeFileSync(path.join(ROOT, JSONL_PATH), jsonl(ledger));
  fs.writeFileSync(path.join(ROOT, CSV_PATH), csv(ledger));
  fs.writeFileSync(path.join(ROOT, MARKDOWN_PATH), markdown(reportWithLedger));
  const check = report.blockers.length === 0 && report.counts.recomputed.responseCaptured === 0 && report.counts.recomputed.payloadPresent === 0 && report.scientificPayloadWriteback === false;
  console.log(JSON.stringify({ check, report: { fingerprint: report.fingerprint, counts: report.counts, blockers: report.blockers, files: [REPORT_PATH, JSONL_PATH, CSV_PATH, MARKDOWN_PATH] } }, null, 2));
  if (!check) process.exitCode = 1;
}

main();


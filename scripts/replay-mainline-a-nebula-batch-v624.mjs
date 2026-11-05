import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createAttempt, safeSourceUrl as collectorSafeSourceUrl, validateBatch as validateCollectorBatch } from "./collect-mainline-a-nebula-batch-v624.mjs";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BATCH_PATH = "app/data/mainlineANebulaBatchV624.generated.json";
const REPORT_PATH = "docs/release/v607/mainline-a-r64-nebula-replay.json";
const JSONL_PATH = "docs/release/v607/mainline-a-r64-nebula-replay.jsonl";
const CSV_PATH = "docs/release/v607/mainline-a-r64-nebula-replay.csv";
const IDS = ["heart-nebula", "soul-nebula", "witch-head-nebula", "flame-nebula", "pacman-nebula", "running-chicken-nebula"];
const SHA = /^[a-f0-9]{64}$/i;
const BATCH_SCHEMA = "mainline-a-nebula-batch-v624";
const BATCH_ID = "r64-base-six";
const RIGHTS_ONLY = new Set(["rights-pending"]);

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8"));
}

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
}

function digest(value) {
  return sha256(Buffer.from(JSON.stringify(canonical(value)), "utf8"));
}

function safeUrl(value) {
  return collectorSafeSourceUrl(value);
}

function relativeInside(root, relative) {
  if (!relative || relative.includes("..") || relative.startsWith("/") || /^[A-Za-z]:[\\/]/.test(relative)) return false;
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(root, relative);
  return path.relative(resolvedRoot, resolved) !== "" && !path.relative(resolvedRoot, resolved).startsWith(`..${path.sep}`) && !path.isAbsolute(path.relative(resolvedRoot, resolved));
}

function pathInside(root, target) {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  return relative !== "" && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function failClosedIssues(batch) {
  const issues = [];
  if (batch?.schema !== BATCH_SCHEMA) issues.push("schema-invalid");
  if (batch?.batchId !== BATCH_ID) issues.push("batch-id-invalid");
  if (!Array.isArray(batch?.rows)) return [...issues, "rows-invalid"];
  if (batch.rows.length !== IDS.length) issues.push("row-count");
  IDS.forEach((id, index) => { if (batch.rows[index]?.id !== id) issues.push(`roster-${id}`); });
  const boundary = batch?.boundary;
  if (!boundary || boundary.candidateOnly !== true || boundary.hold !== true || boundary.notAdmitted !== true || boundary.scientificPayloadWriteback !== false) issues.push("boundary-invalid");
  if (!batch?.evidence || typeof batch.evidence.externalSourceEvidence !== "boolean") issues.push("external-source-evidence-invalid");
  if (batch.rows.every((row) => row && row.source && row.network && Array.isArray(row.network.attempts) && row.network.attempts.every((attempt) => attempt && typeof attempt === "object"))) {
    const collectorIssues = validateCollectorBatch(batch);
    issues.push(...collectorIssues.filter((issue) => !["schema-invalid", "row-count-invalid"].includes(issue)));
  } else {
    issues.push("row-shape-invalid");
  }
  if (!batch?.counts || typeof batch.counts !== "object") issues.push("counts-missing");
  return [...new Set(issues)];
}

function declaredCountIssues(batch, recomputed) {
  const issues = [];
  const declared = batch.counts ?? {};
  for (const key of ["total", "networkAttempted", "ledgerAttempts", "captured", "historicalVerified", "rightsPending"]) {
    if (declared[key] !== recomputed[key]) issues.push(`declared-count-${key}`);
  }
  return issues;
}

function expectedFingerprint(url) {
  return createAttempt(url, 1, new Date(0).toISOString(), 1).requestFingerprint;
}

function durationMs(attempt) {
  const start = Date.parse(attempt.startedAt);
  const end = Date.parse(attempt.endedAt);
  return Number.isFinite(start) && Number.isFinite(end) && end >= start ? end - start : null;
}

function attemptIssues(row, attempt, index) {
  const issues = [];
  if (!attempt || typeof attempt !== "object") return ["attempt-shape-invalid"];
  const redirects = Array.isArray(attempt.redirectChain) ? attempt.redirectChain : [];
  if (!Array.isArray(attempt.redirectChain)) issues.push("redirect-chain-invalid");
  if (attempt.attempt !== index + 1) issues.push("attempt-sequence");
  const expectedRetryCount = attempt.retryScope === "per-collection" ? Math.max(0, (attempt.runAttempt ?? attempt.attempt) - 1) : index;
  if (attempt.retryCount !== expectedRetryCount) issues.push("retry-count");
  if (typeof attempt.requestExecuted !== "boolean") issues.push("request-executed-invalid");
  if (typeof attempt.timeout !== "boolean") issues.push("timeout-invalid");
  if (!attempt.startedAt || !attempt.endedAt || durationMs(attempt) === null) issues.push("time-invalid");
  if (attempt.timeoutMs !== undefined && (!Number.isInteger(attempt.timeoutMs) || attempt.timeoutMs <= 0)) issues.push("timeout-ms-invalid");
  if (attempt.requestUrl !== row.source.url) issues.push("request-url-mismatch");
  if (!SHA.test(attempt.requestFingerprint ?? "") || attempt.requestFingerprint !== expectedFingerprint(row.source.url)) issues.push("request-fingerprint-invalid");
  if (!attempt.requestExecuted && (attempt.responseCaptured !== 0 || attempt.httpStatus !== null || attempt.contentType !== null || attempt.finalUrl !== null || redirects.length || attempt.rawArtifactPath !== null || attempt.rawPageSha256 !== null || attempt.responseBytes !== null)) issues.push("offline-telemetry-forged");
  if (!attempt.requestExecuted && (attempt.timeout || attempt.errorClass !== "network-not-run")) issues.push("offline-telemetry-forged");
  if (attempt.requestExecuted && attempt.errorClass === "network-not-run") issues.push("executed-not-run-conflict");
  if ("collectionId" in attempt && attempt.collectionId !== null && (typeof attempt.collectionId !== "string" || attempt.collectionId.trim() === "")) issues.push("collection-id-invalid");
  if (attempt.retryScope === "per-collection" && (typeof attempt.collectionId !== "string" || attempt.collectionId.trim() === "")) issues.push("collection-id-invalid");
  if ("retryScope" in attempt && (typeof attempt.retryScope !== "string" || !["per-collection", "legacy-unclassified", "offline-ledger"].includes(attempt.retryScope))) issues.push("retry-scope-invalid");
  if ("runAttempt" in attempt && (!Number.isInteger(attempt.runAttempt) || attempt.runAttempt < 1)) issues.push("run-attempt-invalid");
  if (attempt.retryScope === "per-collection" && (!Number.isInteger(attempt.runAttempt) || attempt.runAttempt < 1)) issues.push("run-attempt-invalid");
  if (attempt.httpStatus !== null && (!Number.isInteger(attempt.httpStatus) || attempt.httpStatus < 100 || attempt.httpStatus > 599)) issues.push("http-status-invalid");
  if (attempt.responseCaptured === 1) {
    if (!attempt.requestExecuted) issues.push("captured-without-request");
    if (attempt.httpStatus !== 200) issues.push("captured-status-invalid");
    if (!/^image\/(jpeg|jpg|png|webp)(;|$)/i.test(attempt.contentType ?? "")) issues.push("captured-content-type-invalid");
    if (!safeUrl(attempt.finalUrl ?? "")) issues.push("captured-final-url-invalid");
    if (!SHA.test(attempt.rawPageSha256 ?? "")) issues.push("captured-sha-missing");
    if (attempt.errorClass !== null) issues.push("captured-error-class");
  } else {
    if (attempt.rawArtifactPath !== null || attempt.rawPageSha256 !== null || attempt.responseBytes !== null) issues.push("uncaptured-artifact-claim");
  }
  if (attempt.responseCaptured !== 0 && attempt.responseCaptured !== 1) issues.push("capture-flag-invalid");
  if (attempt.timeout && attempt.responseCaptured === 1) issues.push("timeout-captured");
  if (attempt.timeout && attempt.errorClass !== "timeout") issues.push("timeout-class");
  if (!attempt.timeout && attempt.errorClass === "timeout") issues.push("timeout-flag-missing");
  if (redirects.some((url) => !safeUrl(url))) issues.push("unsafe-redirect");
  return issues;
}

async function verifyArtifact(row) {
  const artifact = row.network.artifact;
  if (!artifact) return { status: "missing", issues: row.network.responseCaptured ? ["capture-without-artifact"] : [] };
  if (typeof artifact !== "object" || typeof artifact.path !== "string" || !SHA.test(String(artifact.sha256 ?? ""))) return { status: "mismatch", issues: ["artifact-metadata-invalid"] };
  const issues = [];
  if (!relativeInside(ROOT, artifact.path)) issues.push("artifact-path-escape");
  if (!artifact.path.startsWith("docs/release/v607/nebula-image-artifacts/r64/")) issues.push("artifact-root-mismatch");
  const absolute = path.resolve(ROOT, artifact.path);
  const artifactRoot = path.resolve(ROOT, "docs/release/v607/nebula-image-artifacts/r64");
  if (!relativeInside(ROOT, path.relative(ROOT, absolute)) || !relativeInside(artifactRoot, path.relative(artifactRoot, absolute))) return { status: "mismatch", issues: [...issues, "artifact-path-escape"] };
  if (!fs.existsSync(absolute)) return { status: "missing", issues: [...issues, "artifact-file-missing"] };
  const [realWorkspace, realArtifactRoot, realArtifact] = await Promise.all([fsp.realpath(ROOT), fsp.realpath(artifactRoot), fsp.realpath(absolute)]);
  if (!pathInside(realWorkspace, realArtifactRoot) || !pathInside(realArtifactRoot, realArtifact)) return { status: "mismatch", issues: [...issues, "artifact-realpath-escape"] };
  const bytes = await fsp.readFile(absolute);
  if (bytes.byteLength > 60_000_000) return { status: "mismatch", issues: [...issues, "artifact-too-large"] };
  const metadata = await sharp(bytes, { failOn: "error" }).metadata();
  const computed = sha256(bytes);
  if (computed !== artifact.sha256) issues.push("sha256-mismatch");
  if (bytes.byteLength !== artifact.bytes) issues.push("byte-count-mismatch");
  if (metadata.width !== artifact.width || metadata.height !== artifact.height) issues.push("dimensions-mismatch");
  const format = metadata.format === "jpeg" ? "jpg" : metadata.format;
  if (format !== artifact.format) issues.push("format-mismatch");
  const capture = row.network.attempts.find((attempt) => attempt.responseCaptured === 1 && attempt.rawPageSha256 === artifact.sha256 && attempt.rawArtifactPath === artifact.path && attempt.responseBytes === artifact.bytes);
  if (!capture) issues.push("capture-attempt-missing");
  for (const attempt of row.network.attempts.filter((item) => item.responseCaptured === 1)) {
    if (!attempt.rawArtifactPath || !SHA.test(attempt.rawPageSha256 ?? "") || !Number.isInteger(attempt.responseBytes) || attempt.responseBytes <= 0) issues.push("attempt-artifact-link-invalid");
  }
  return { status: issues.length ? "mismatch" : "verified", issues, bytes: bytes.byteLength, sha256: computed, width: metadata.width, height: metadata.height, format };
}

async function verifyHistorical(row) {
  const historical = row.historical;
  if (!historical || historical.status !== "verified" || !historical.path) return { status: "unverified", issues: ["historical-not-verified"] };
  if (!relativeInside(ROOT, historical.path) || !historical.path.startsWith("source-cache/")) return { status: "mismatch", issues: ["historical-path-escape"] };
  const absolute = path.resolve(ROOT, historical.path);
  if (!fs.existsSync(absolute)) return { status: "missing", issues: ["historical-file-missing"] };
  const bytes = await fsp.readFile(absolute);
  const digest = sha256(bytes);
  const metadata = await sharp(bytes, { failOn: "error" }).metadata();
  const issues = [];
  if (digest !== historical.sha256) issues.push("historical-sha-mismatch");
  if (bytes.byteLength !== historical.bytes) issues.push("historical-byte-count-mismatch");
  if (metadata.width !== historical.width || metadata.height !== historical.height) issues.push("historical-dimensions-mismatch");
  return { status: issues.length ? "mismatch" : "verified", issues, bytes: bytes.byteLength, sha256: digest };
}

function rowIssues(row) {
  const issues = [];
  if (!row || typeof row.id !== "string") return ["row-invalid"];
  if (!row.source || !row.network || !row.rights) return ["row-shape-invalid"];
  if (!safeUrl(row.source.url)) issues.push("source-url-invalid");
  if (row.source.url !== row.network.attempts[0]?.requestUrl) issues.push("source-attempt-url-mismatch");
  if (row.source.credit.trim().length < 4) issues.push("credit-missing");
  if (!Array.isArray(row.network.attempts) || row.network.attempts.length === 0) issues.push("attempt-ledger-empty");
  if (row.network.responseCaptured !== (row.network.attempts.some((attempt) => attempt.responseCaptured === 1) ? 1 : 0)) issues.push("capture-summary-mismatch");
  if (row.network.status === "captured" && row.network.responseCaptured !== 1) issues.push("captured-status-mismatch");
  if (row.network.status !== "captured" && row.network.responseCaptured === 1) issues.push("uncaptured-status-mismatch");
  if (row.rights.status === "pending") issues.push("rights-pending");
  else if (row.rights.status !== "cleared") issues.push("rights-blocked");
  if (row.runtimeAdmission !== "candidate-only" || row.measurementAdmission !== "not-admitted" || row.scientificPayloadWriteback !== false) issues.push("admission-boundary-open");
  row.network.attempts.forEach((attempt, index) => issues.push(...attemptIssues(row, attempt, index)));
  const collectionProgress = new Map();
  for (const attempt of row.network.attempts) {
    if (attempt.retryScope !== "per-collection") continue;
    const expected = (collectionProgress.get(attempt.collectionId) ?? 0) + 1;
    if (attempt.runAttempt !== expected) issues.push("collection-attempt-sequence");
    collectionProgress.set(attempt.collectionId, expected);
  }
  return [...new Set(issues)];
}

async function assessRow(row) {
  if (!row?.network || !row?.source || !row?.rights || typeof row.source.credit !== "string" || !Array.isArray(row.network.attempts) || row.network.attempts.some((attempt) => !attempt || typeof attempt !== "object")) return { id: row?.id ?? "unknown", networkStatus: "invalid", attempts: 0, captured: false, artifactStatus: "missing", artifact: { status: "missing", issues: ["row-shape-invalid"] }, historicalStatus: "unverified", historical: { status: "unverified", issues: ["row-shape-invalid"] }, valid: false, blockers: ["row-shape-invalid"], rights: row?.rights?.status ?? "unknown", runtimeAdmission: row?.runtimeAdmission ?? null, scientificPayloadWriteback: row?.scientificPayloadWriteback ?? null };
  const artifact = await verifyArtifact(row);
  const historical = await verifyHistorical(row);
  const issues = [...rowIssues(row), ...artifact.issues, ...historical.issues];
  const captured = row.network.responseCaptured === 1;
  if (captured && artifact.status !== "verified") issues.push("captured-artifact-unverified");
  if (!captured && row.network.artifact !== null) issues.push("artifact-without-response");
  return { id: row.id, networkStatus: row.network.status, attempts: row.network.attempts.length, captured, artifactStatus: artifact.status, artifact, historicalStatus: historical.status, historical, valid: issues.length === 0, blockers: [...new Set(issues)], rights: row.rights.status, runtimeAdmission: row.runtimeAdmission, scientificPayloadWriteback: row.scientificPayloadWriteback };
}

export async function replayBatch(batch = readJson(BATCH_PATH)) {
  const rosterIssues = failClosedIssues(batch);
  const sourceRows = Array.isArray(batch?.rows) ? batch.rows : [];
  IDS.forEach((id, index) => { if (sourceRows[index]?.id !== id) rosterIssues.push(`roster-${id}`); });
  const rows = await Promise.all(sourceRows.map(assessRow));
  const blockers = [...new Set([...rosterIssues, ...rows.flatMap((row) => row.blockers)])];
  const attempts = sourceRows.flatMap((row) => Array.isArray(row?.network?.attempts) ? row.network.attempts : []);
  const recomputed = { total: rows.length, networkAttempted: attempts.filter((attempt) => attempt?.requestExecuted === true).length, ledgerAttempts: attempts.length, captured: rows.filter((row) => row.captured).length, artifactVerified: rows.filter((row) => row.artifactStatus === "verified").length, rightsPending: rows.filter((row) => row.rights !== "cleared").length };
  const historicalVerified = rows.filter((row) => row.historicalStatus === "verified").length;
  recomputed.historicalVerified = historicalVerified;
  blockers.push(...declaredCountIssues(batch, recomputed));
  const nonRightsBlockers = blockers.filter((issue) => !RIGHTS_ONLY.has(issue));
  const status = nonRightsBlockers.length ? "invalid" : recomputed.captured === recomputed.artifactVerified && recomputed.historicalVerified === recomputed.total ? "verified-with-rights-pending" : "artifact-mismatch";
  return { schema: "mainline-a-nebula-replay-v624", batchFingerprint: digest(batch), generatedAt: new Date().toISOString(), counts: { declared: batch.counts, recomputed }, rows, blockers: [...new Set(blockers)], status, boundary: batch.boundary, evidence: { capturedBytes: "raw HTTPS response bytes re-read from local artifact", externalSource: "collector response metadata; no source page interpretation", rights: "not-granted" } };
}

function jsonl(report) {
  return `${report.rows.map((row) => JSON.stringify(row)).join("\n")}\n`;
}

function csv(report) {
  const rows = ["id,networkStatus,attempts,captured,artifactStatus,bytes,sha256,rights,valid,blockers"];
  for (const row of report.rows) rows.push([row.id, row.networkStatus, row.attempts, row.captured, row.artifactStatus, row.artifact.bytes ?? "", row.artifact.sha256 ?? "", row.rights, row.valid, row.blockers.join("|")].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","));
  return `${rows.join("\n")}\n`;
}

function markdown(report) {
  const lines = ["# R64 Nebula Raw Artifact Replay", "", `- batch fingerprint: ${report.batchFingerprint}`, `- status: ${report.status}`, `- captured: ${report.counts.recomputed.captured}`, `- artifact verified: ${report.counts.recomputed.artifactVerified}`, `- rights pending: ${report.counts.recomputed.rightsPending}`, "", "| id | network | artifact | bytes | rights | blockers |", "| --- | --- | --- | ---: | --- | --- |"];
  for (const row of report.rows) lines.push(`| ${row.id} | ${row.networkStatus} | ${row.artifactStatus} | ${row.artifact.bytes ?? "—"} | ${row.rights} | ${row.blockers.join("; ") || "—"} |`);
  return `${lines.join("\n")}\n`;
}

export async function run({ check = false } = {}) {
  const batch = readJson(BATCH_PATH);
  const report = await replayBatch(batch);
  if (report.status === "invalid" || report.status === "artifact-mismatch") throw new Error(`V624 replay failed: ${report.blockers.join(",")}`);
  if (check) {
    const saved = readJson(REPORT_PATH);
    const { generatedAt: savedAt, ...savedStable } = saved;
    const { generatedAt: currentAt, ...currentStable } = report;
    if (!savedAt || !currentAt || digest(savedStable) !== digest(currentStable)) throw new Error("V624 saved replay report is stale; regenerate before claiming current evidence");
  }
  if (!check) {
    await fsp.mkdir(path.join(ROOT, "docs/release/v607"), { recursive: true });
    await fsp.writeFile(path.join(ROOT, REPORT_PATH), `${JSON.stringify(report, null, 2)}\n`);
    await fsp.writeFile(path.join(ROOT, JSONL_PATH), jsonl(report));
    await fsp.writeFile(path.join(ROOT, CSV_PATH), csv(report));
    await fsp.writeFile(path.join(ROOT, "docs/release/v607/mainline-a-r64-nebula-replay.md"), markdown(report));
  }
  return { status: "verified", counts: report.counts, fingerprint: report.batchFingerprint, blockers: report.blockers };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) run({ check: process.argv.includes("--check") }).then((value) => console.log(JSON.stringify(value, null, 2))).catch((error) => { console.error(error.stack ?? error.message); process.exitCode = 1; });

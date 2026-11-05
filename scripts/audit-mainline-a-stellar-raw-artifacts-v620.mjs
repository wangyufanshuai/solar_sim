import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const LEDGER_PATH = "app/data/mainlineABetaStellarRawAttemptLedgerV620.generated.json";
export const ARTIFACT_ROOT = "docs/release/v607/raw-artifacts/r60";
export const RUN_ROOT = `${ARTIFACT_ROOT}/runs`;
export const RECEIPT_SCHEMA = "mainline-a-beta-stellar-raw-artifact-receipt-v620";
const HOST = "simbad.cds.unistra.fr";
const IDS = new Set(["acrux", "spica", "regulus", "polaris"]);
const HASH = /^[a-f0-9]{64}$/i;

export function sha256(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
export function fail(message) { throw new Error(`stellar raw artifact audit v620: ${message}`); }
export function assert(condition, message) { if (!condition) fail(message); }
export function readJson(root, relativePath) { const filename = path.resolve(root, relativePath); assert(fs.existsSync(filename), `missing ${relativePath}`); return JSON.parse(fs.readFileSync(filename, "utf8")); }
export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  return value;
}
export function canonicalSha(value) { return sha256(JSON.stringify(canonicalize(value))); }
export function safeUrl(value) {
  try { const url = new URL(value); return url.protocol === "https:" && url.hostname === HOST && !url.username && !url.password; }
  catch { return false; }
}
export function safeArtifactPath(root, relativePath) {
  assert(typeof relativePath === "string" && relativePath.length > 0, "artifact path missing");
  const rootPath = path.resolve(root, ARTIFACT_ROOT);
  const target = path.resolve(root, relativePath);
  const relative = path.relative(rootPath, target);
  assert(relative && !relative.startsWith("..") && !path.isAbsolute(relative), `artifact escapes R60 root: ${relativePath}`);
  return target;
}
export function readArtifact(root, relativePath) { const filename = safeArtifactPath(root, relativePath); assert(fs.existsSync(filename), `artifact missing: ${relativePath}`); return fs.readFileSync(filename); }
export function verifyArtifact(root, attempt) {
  const errors = [];
  if (attempt.responseCaptured !== 1) {
    if (attempt.rawArtifactPath || attempt.rawArtifactSha256 || attempt.responseBytes !== null) errors.push("failed-artifact-leak");
    return errors;
  }
  if (typeof attempt.rawArtifactPath !== "string") errors.push("captured-artifact-path-missing");
  if (!HASH.test(attempt.rawArtifactSha256 ?? "")) errors.push("captured-artifact-hash-invalid");
  if (!Number.isInteger(attempt.responseBytes) || attempt.responseBytes <= 0) errors.push("captured-artifact-bytes-invalid");
  if (errors.length > 0) return errors;
  try {
    const bytes = readArtifact(root, attempt.rawArtifactPath);
    if (bytes.byteLength !== attempt.responseBytes) errors.push("captured-artifact-byte-mismatch");
    if (sha256(bytes) !== attempt.rawArtifactSha256) errors.push("captured-artifact-hash-mismatch");
  } catch (error) { errors.push(error instanceof Error ? error.message : "captured-artifact-read-failed"); }
  return errors;
}
export function verifyAttemptIdentity(record, attempt) {
  const errors = [];
  if (!IDS.has(record.id)) errors.push("id-not-allowlisted");
  if (!safeUrl(record.requestUrl)) errors.push("request-url-unsafe");
  if (attempt.requestUrl !== record.requestUrl) errors.push("attempt-url-mismatch");
  if (attempt.finalUrl !== null && !safeUrl(attempt.finalUrl)) errors.push("final-url-unsafe");
  let tail = record.requestUrl;
  for (const hop of attempt.redirectChain ?? []) {
    if (!Number.isInteger(hop.status) || hop.status < 300 || hop.status > 399) errors.push("redirect-status-invalid");
    if (!safeUrl(hop.from) || !safeUrl(hop.to)) errors.push("redirect-url-unsafe");
    if (hop.from !== tail) errors.push("redirect-chain-discontinuous");
    tail = hop.to;
  }
  if (attempt.finalUrl !== null && tail !== attempt.finalUrl) errors.push("redirect-tail-mismatch");
  return errors;
}
export function auditLedgerArtifacts(root, ledger) {
  assert(ledger?.schema === "mainline-a-beta-stellar-raw-attempt-ledger-v620", "ledger schema changed");
  assert(ledger.boundary?.candidateOnly === true && ledger.boundary.hold === true && ledger.boundary.notAdmitted === true, "candidate boundary opened");
  assert(ledger.boundary.scientificPayloadWriteback === false && ledger.boundary.runtimeWrites === false && ledger.boundary.measurementWrites === false, "writeback boundary opened");
  const rows = ledger.records.map((record) => {
    const attempts = [...(record.attemptLedger ?? record.attempts ?? [])].sort((a, b) => a.attempt - b.attempt);
    const errors = [];
    attempts.forEach((attempt, index) => { if (attempt.attempt !== index + 1) errors.push("attempt-sequence-invalid"); errors.push(...verifyAttemptIdentity(record, attempt)); errors.push(...verifyArtifact(root, attempt)); });
    const captured = attempts.filter((attempt) => attempt.responseCaptured === 1);
    if (captured.length > 1) errors.push("multiple-captures");
    if ((record.responseCaptured === 1) !== (captured.length === 1)) errors.push("capture-count-mismatch");
    return { id: record.id, attempts: attempts.length, responseCaptured: captured.length, artifactCount: captured.filter((attempt) => verifyArtifact(root, attempt).length === 0).length, errors: [...new Set(errors)] };
  });
  return { schema: RECEIPT_SCHEMA, ledgerSha256: canonicalSha(ledger), rows, summary: { total: rows.length, valid: rows.filter((row) => row.errors.length === 0).length, captured: rows.reduce((sum, row) => sum + row.responseCaptured, 0), artifacts: rows.reduce((sum, row) => sum + row.artifactCount, 0), blocked: rows.filter((row) => row.errors.length > 0).length, scientificPayloadWriteback: false } };
}
export function nextRunId(clock = Date) { return new clock().toISOString().replaceAll(/[-:.TZ]/g, "").slice(0, 14); }
export function writeRunReceipt(root, audit, runId = nextRunId()) {
  assert(audit.summary.valid === audit.summary.total, `cannot seal invalid artifact audit (${audit.summary.blocked} blocked)`);
  const relativePath = `${RUN_ROOT}/${runId}.json`;
  const filename = path.resolve(root, relativePath);
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  const payload = { ...audit, runId, createdAt: new Date().toISOString(), root: ARTIFACT_ROOT, immutable: true };
  const fd = fs.openSync(filename, "wx");
  try { fs.writeFileSync(fd, `${JSON.stringify(payload, null, 2)}\n`, "utf8"); } finally { fs.closeSync(fd); }
  return { path: relativePath, sha256: sha256(fs.readFileSync(filename)), bytes: fs.statSync(filename).size };
}
export function verifyRunReceipt(root, receiptPath) {
  const receipt = readJson(root, receiptPath);
  assert(receipt.schema === RECEIPT_SCHEMA && receipt.immutable === true, "receipt schema or immutability changed");
  assert(receipt.summary?.valid === receipt.summary?.total, "receipt contains blocked rows");
  const ledger = readJson(root, LEDGER_PATH);
  assert(receipt.ledgerSha256 === canonicalSha(ledger), "receipt ledger digest is stale");
  const audit = auditLedgerArtifacts(root, ledger);
  assert(audit.summary.valid === receipt.summary.valid && audit.summary.artifacts === receipt.summary.artifacts, "receipt summary changed");
  return { status: "verified", path: receiptPath, runId: receipt.runId, summary: receipt.summary };
}
export function run({ root = process.cwd(), check = false, receiptPath } = {}) {
  const ledger = readJson(root, LEDGER_PATH);
  const audit = auditLedgerArtifacts(root, ledger);
  if (check) return receiptPath ? verifyRunReceipt(root, receiptPath) : { status: "verified", summary: audit.summary };
  assert(audit.summary.valid === audit.summary.total, `artifact audit failed: ${audit.summary.blocked} blocked`);
  return writeRunReceipt(root, audit);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { const check = process.argv.includes("--check"); const index = process.argv.indexOf("--receipt"); const receiptPath = index >= 0 ? process.argv[index + 1] : undefined; console.log(JSON.stringify(run({ check, receiptPath }), null, 2)); }
  catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }
}

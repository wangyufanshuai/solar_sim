import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SCHEMA = "mainline-a-beta-stellar-raw-attempt-ledger-v620";
export const DEFAULT_INPUT = "app/data/mainlineABetaStellarRawAttemptLedgerV620.generated.json";
const IDS = new Set(["acrux", "spica", "regulus", "polaris"]);
const ENDPOINT = "https://simbad.cds.unistra.fr/simbad/sim-tap/sync";
const SHA256 = /^[a-f0-9]{64}$/i;
const TYPES = /^(text\/html|text\/plain|text\/tab-separated-values|application\/json)(?:;|$)/i;

export function sha256(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
export function assert(condition, message) { if (!condition) throw new Error(`stellar raw replay v620: ${message}`); }
export function readJson(root, relativePath) { const target = path.resolve(root, relativePath); assert(fs.existsSync(target), `missing ${relativePath}`); return JSON.parse(fs.readFileSync(target, "utf8")); }
export function requestFingerprint(attempt) { return `${String(attempt.method ?? "GET").toUpperCase()} ${attempt.requestUrl} transport=${attempt.transport}`; }
export function safeUrl(value) {
  if (typeof value !== "string") return false;
  try { const parsed = new URL(value); return parsed.protocol === "https:" && parsed.hostname === "simbad.cds.unistra.fr"; }
  catch { return false; }
}
export function allowedContentType(value) { return typeof value === "string" && TYPES.test(value.trim()); }
export function capturedFlag(value) { return value === true || value === 1; }
export function validIso(value) { const parsed = Date.parse(value ?? ""); return typeof value === "string" && Number.isFinite(parsed) && new Date(parsed).toISOString() === value && parsed <= Date.now(); }

export function verifyAttempt(attempt, expectedUrl, { root = process.cwd() } = {}) {
  const errors = [];
  if (!Number.isInteger(attempt.attempt) || attempt.attempt < 1) errors.push("attempt-number-invalid");
  if (!Number.isInteger(attempt.retryCount) || attempt.retryCount < 0 || attempt.retryCount > attempt.attempt - 1) errors.push("retry-count-invalid");
  if (!validIso(attempt.startedAt) || !validIso(attempt.endedAt) || Date.parse(attempt.endedAt) < Date.parse(attempt.startedAt)) errors.push("timestamp-invalid");
  if (attempt.requestUrl !== expectedUrl || !safeUrl(attempt.requestUrl)) errors.push("request-url-mismatch");
  if (!safeUrl(attempt.finalUrl ?? expectedUrl)) errors.push("final-url-unsafe");
  let chainTail = expectedUrl;
  for (const redirect of attempt.redirectChain ?? []) {
    if (!Number.isInteger(redirect.status) || redirect.status < 300 || redirect.status > 399) errors.push("redirect-status-invalid");
    if (!safeUrl(redirect.from) || !safeUrl(redirect.to)) errors.push("redirect-url-unsafe");
    if (redirect.from !== chainTail) errors.push("redirect-chain-discontinuous");
    chainTail = redirect.to;
  }
  if (attempt.finalUrl && chainTail !== attempt.finalUrl) errors.push("final-url-not-chain-tail");
  const expectedFingerprint = requestFingerprint(attempt);
  const hashedFingerprint = SHA256.test(attempt.requestFingerprint ?? "");
  if (!hashedFingerprint && attempt.requestFingerprint !== expectedFingerprint) errors.push("request-fingerprint-mismatch");
  if (attempt.transport === "fixture-replay" && capturedFlag(attempt.responseCaptured)) errors.push("fixture-response-not-live");
  let artifactBody = typeof attempt.rawResponse === "string" ? attempt.rawResponse : null;
  if (capturedFlag(attempt.responseCaptured) && artifactBody === null && attempt.rawArtifactPath) {
    const target = path.resolve(root, attempt.rawArtifactPath);
    const relative = path.relative(path.resolve(root), target);
    if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) errors.push("artifact-path-unsafe");
    else if (!fs.existsSync(target)) errors.push("captured-artifact-missing");
    else artifactBody = fs.readFileSync(target, "utf8");
  }
  if (capturedFlag(attempt.responseCaptured)) {
    if (attempt.timeout || attempt.errorClass) errors.push("captured-error-conflict");
    if (attempt.httpStatus !== 200) errors.push("captured-http-status-invalid");
    if (!allowedContentType(attempt.contentType)) errors.push("captured-content-type-invalid");
    if (!Number.isInteger(attempt.responseBytes) || attempt.responseBytes <= 0) errors.push("captured-byte-count-invalid");
    if (!SHA256.test(attempt.rawPageSha256 ?? "")) errors.push("captured-hash-invalid");
    if (artifactBody !== null) {
      if (Buffer.byteLength(artifactBody, "utf8") !== attempt.responseBytes) errors.push("captured-byte-count-mismatch");
      if (attempt.rawPageSha256 !== sha256(artifactBody)) errors.push("captured-hash-mismatch");
    } else if (!attempt.rawArtifactPath) {
      errors.push("captured-artifact-body-unavailable");
    }
  } else if (attempt.rawResponse || attempt.rawArtifactPath || attempt.rawPageSha256 || attempt.responseBytes !== null) {
    errors.push("uncaptured-artifact-present");
  }
  if (attempt.errorClass === "timeout" && !attempt.timeout) errors.push("timeout-class-mismatch");
  return [...new Set(errors)];
}

export function verifyRecord(record, options = {}) {
  const errors = [];
  if (!IDS.has(record.id)) errors.push("id-not-allowlisted");
  if (record.serviceEndpoint !== ENDPOINT) errors.push("service-endpoint-invalid");
  if (!safeUrl(record.requestUrl)) errors.push("request-url-unsafe");
  if (record.runtimeAdmission !== "candidate-only" || record.measurementAdmission !== "not-admitted" || record.scientificPayloadWriteback !== false) errors.push("admission-boundary-opened");
  const attempts = [...(record.attemptLedger ?? record.attempts ?? [])].sort((a, b) => a.attempt - b.attempt);
  if (attempts.some((attempt, index) => attempt.attempt !== index + 1)) errors.push("attempt-sequence-invalid");
  for (const attempt of attempts) errors.push(...verifyAttempt(attempt, record.requestUrl, options));
  const captured = attempts.filter((attempt) => capturedFlag(attempt.responseCaptured));
  if (captured.length > 1) errors.push("multiple-captured-attempts");
  if (capturedFlag(record.responseCaptured) !== (captured.length === 1 && errors.length === 0)) errors.push("record-response-flag-invalid");
  if (captured.length === 0 && ["captured", "raw-only", "structured"].includes(record.state)) errors.push("state-without-response");
  if (record.state === "structured" && captured.some((attempt) => attempt.transport === "fixture-replay")) errors.push("fixture-structured-boundary");
  return { id: record.id, attempts: attempts.length, responseCaptured: captured.length === 1 && errors.length === 0, state: errors.length ? "blocked" : record.state, errors: [...new Set(errors)] };
}

export function verifyLedgerDocument(document, options = {}) {
  assert(document?.schema === SCHEMA, "schema changed");
  assert(document?.boundary?.candidateOnly === true && document?.boundary?.hold === true && document?.boundary?.notAdmitted === true, "candidate boundary opened");
  assert(document?.boundary?.scientificPayloadWriteback === false, "scientific writeback opened");
  assert(document?.boundary?.runtimeWrites === false && document?.boundary?.measurementWrites === false, "runtime boundary opened");
  const results = (document.records ?? []).map((record) => verifyRecord(record, options));
  return { schema: SCHEMA, results, summary: { total: results.length, valid: results.filter((result) => result.errors.length === 0).length, blocked: results.filter((result) => result.state === "blocked").length, captured: results.filter((result) => result.responseCaptured).length, scientificPayloadWriteback: false } };
}

export function run({ root = process.cwd(), input = DEFAULT_INPUT, check = false } = {}) {
  const document = readJson(root, input);
  const result = verifyLedgerDocument(document, { root });
  assert(result.summary.valid === result.summary.total, `ledger has ${result.summary.total - result.summary.valid} invalid records`);
  if (check) return { status: "verified", input, ...result.summary };
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const inputIndex = process.argv.indexOf("--input");
    const input = inputIndex >= 0 ? (process.argv[inputIndex + 1] || DEFAULT_INPUT) : DEFAULT_INPUT;
    console.log(JSON.stringify(run({ input, check: process.argv.includes("--check") }), null, 2));
  }
  catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }
}


import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sha256 } from "./build-mainline-a-beta-stellar-raw-capture-v619.mjs";

export const SCHEMA = "mainline-a-beta-stellar-raw-attempt-ledger-v620";
export const RESPONSE_SCHEMA = "mainline-a-stellar-raw-capture-response-v619";
export const INPUT_PATH = "app/data/mainlineABetaStellarRawCaptureV619.generated.json";
export const OUTPUT_PATH = "app/data/mainlineABetaStellarRawAttemptLedgerV620.generated.json";
export const ARTIFACT_ROOT = "docs/release/v607/raw-artifacts/r60";
export const ALLOWLIST = Object.freeze(["acrux", "spica", "regulus", "polaris"]);
const SIMBAD_HOST = "simbad.cds.unistra.fr";
export const DEFAULT_MAX_RESPONSE_BYTES = 4 * 1024 * 1024;
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export function fail(message) { throw new Error(`mainline-a raw collector v620: ${message}`); }
export function assert(condition, message) { if (!condition) fail(message); }
export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
export function canonicalSha(value) { return sha256(JSON.stringify(canonicalize(value))); }
export function requestFingerprint(plan) {
  return canonicalSha({ method: plan.method, requestUrl: plan.requestUrl, serviceEndpoint: plan.serviceEndpoint, queryIdentifier: plan.queryIdentifier, accept: "text/html, text/plain, text/tab-separated-values, application/json" });
}
export function classifyError(error, response = null) {
  if (error?.code === "UNSAFE_REDIRECT" || error?.code === "REDIRECT_LIMIT") return "redirect";
  if (error?.code === "CONTENT_TYPE") return "content-type";
  if (response && response.status >= 500) return "http-5xx";
  if (response && response.status >= 400) return "http-4xx";
  if (error?.name === "AbortError") return "timeout";
  if (error?.code === "ENOTFOUND" || error?.code === "EAI_AGAIN") return "dns";
  if (error?.code === "ECONNRESET" || error?.code === "ECONNREFUSED") return "connection";
  if (error?.code === "EMPTY_BODY") return "invalid-response";
  if (error?.code === "BODY_TIMEOUT") return "timeout";
  if (error?.code === "RESPONSE_TOO_LARGE") return "invalid-response";
  if (error instanceof SyntaxError) return "invalid-response";
  return "network";
}
export function nowIso(clock = Date) { return new clock().toISOString(); }
export function isSafeSimbadUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && parsed.hostname === SIMBAD_HOST && !parsed.username && !parsed.password && !parsed.port;
  } catch { return false; }
}
export function createAttempt(plan, attempt, startedAt) {
  return { attempt, startedAt, endedAt: null, timeoutMs: plan.timeoutMs, timeout: false, retryCount: Math.max(0, attempt - 1), httpStatus: null, contentType: null, requestUrl: plan.requestUrl, finalUrl: null, redirectChain: [], errorCategory: null, errorClass: null, errorMessage: null, requestFingerprint: requestFingerprint(plan), transport: "https-html", responseCaptured: 0, rawArtifactPath: null, rawArtifactSha256: null, rawPageSha256: null, rawResponse: null, responseBytes: null };
}

async function fetchWithTimeout(url, timeoutMs, fetchImpl, startedAt, maxRedirects = 8) {
  if (!isSafeSimbadUrl(url)) throw Object.assign(new Error("request URL must be HTTPS SIMBAD without credentials"), { code: "UNSAFE_REDIRECT", redirectChain: [] });
  const redirectChain = [];
  const deadline = Date.now() + timeoutMs;
  let currentUrl = url;
  for (let redirect = 0; redirect <= maxRedirects; redirect += 1) {
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) throw Object.assign(new Error("redirect chain timeout"), { name: "AbortError", code: "CHAIN_TIMEOUT", redirectChain, finalUrl: currentUrl });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), remainingMs);
    try {
      const response = await fetchImpl(currentUrl, { method: "GET", redirect: "manual", signal: controller.signal, headers: { accept: "text/html, text/plain, text/tab-separated-values, application/json", "user-agent": "SolarSim-MainlineA-R60/1.0" } });
      const location = response.headers?.get?.("location");
      if (response.status >= 300 && response.status < 400 && location) {
        const nextUrl = new URL(location, currentUrl).toString();
        redirectChain.push({ from: currentUrl, to: nextUrl, status: response.status });
        if (!isSafeSimbadUrl(nextUrl)) throw Object.assign(new Error("redirect leaves exact SIMBAD HTTPS host"), { code: "UNSAFE_REDIRECT", redirectChain, finalUrl: currentUrl, httpStatus: response.status });
        currentUrl = nextUrl;
        continue;
      }
      return { response, finalUrl: currentUrl, redirectChain };
    } finally { clearTimeout(timer); }
  }
  throw Object.assign(new Error("redirect limit exceeded"), { code: "REDIRECT_LIMIT", redirectChain, finalUrl: currentUrl });
}

export async function readResponseBodyWithTimeout(response, timeoutMs, maxResponseBytes) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      try { response.body?.cancel?.(); } catch { /* best effort cancellation */ }
      reject(Object.assign(new Error("response body timeout"), { name: "AbortError", code: "BODY_TIMEOUT" }));
    }, timeoutMs);
  });
  try {
    const body = await Promise.race([response.text(), timeout]);
    const bytes = Buffer.byteLength(body, "utf8");
    if (bytes > maxResponseBytes) throw Object.assign(new Error(`response exceeds ${maxResponseBytes} bytes`), { code: "RESPONSE_TOO_LARGE" });
    return { body, bytes };
  } finally { clearTimeout(timer); }
}

export async function collectPlan(plan, options = {}) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const clock = options.clock ?? Date;
  const sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const maxAttempts = options.maxAttempts ?? plan.maxAttempts;
  const maxResponseBytes = options.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES;
  assert(typeof fetchImpl === "function", "global fetch is unavailable");
  const attempts = [];
  let capture = null;
  for (let attemptNumber = 1; attemptNumber <= maxAttempts; attemptNumber += 1) {
    const startedAt = nowIso(clock);
    const attempt = createAttempt(plan, attemptNumber, startedAt);
    try {
      const { response, finalUrl, redirectChain } = await fetchWithTimeout(plan.requestUrl, plan.timeoutMs, fetchImpl, startedAt, 8);
      attempt.httpStatus = response.status;
      attempt.contentType = response.headers?.get?.("content-type") ?? null;
      attempt.finalUrl = finalUrl;
      attempt.redirectChain = redirectChain;
      if (response.status !== 200) throw Object.assign(new Error(`HTTP ${response.status}`), { response });
      if (!/^text\/(?:html|plain|tab-separated-values)|^application\/json/i.test(attempt.contentType ?? "")) throw Object.assign(new Error(`unsupported content type ${attempt.contentType ?? "(missing)"}`), { code: "CONTENT_TYPE" });
      const elapsedMs = Date.now() - Date.parse(startedAt);
      const remainingBodyTimeoutMs = Number.isFinite(elapsedMs) ? Math.max(1, plan.timeoutMs - Math.max(0, elapsedMs)) : plan.timeoutMs;
      const { body, bytes: responseBytes } = await readResponseBodyWithTimeout(response, remainingBodyTimeoutMs, maxResponseBytes);
      if (body.length === 0) throw Object.assign(new Error("empty response body"), { code: "EMPTY_BODY" });
      const bodyHash = sha256(body);
      attempt.responseCaptured = 1;
      attempt.responseBytes = responseBytes;
      attempt.rawArtifactSha256 = bodyHash;
      attempt.rawPageSha256 = bodyHash;
      capture = { body, hash: bodyHash, finalUrl, contentType: attempt.contentType, status: response.status, bytes: attempt.responseBytes };
    } catch (error) {
      const response = error?.response ?? null;
      if (error?.httpStatus && attempt.httpStatus === null) attempt.httpStatus = error.httpStatus;
      if (error?.finalUrl && attempt.finalUrl === null) attempt.finalUrl = error.finalUrl;
      if (error?.redirectChain) attempt.redirectChain = error.redirectChain;
      attempt.errorCategory = classifyError(error, response);
      attempt.errorClass = ["http-4xx", "http-5xx"].includes(attempt.errorCategory) ? "http-status" : attempt.errorCategory === "CONTENT_TYPE" ? "content-type" : ["UNSAFE_REDIRECT", "REDIRECT_LIMIT"].includes(attempt.errorCategory) ? "redirect" : attempt.errorCategory === "timeout" ? "timeout" : "network";
      attempt.timeout = attempt.errorCategory === "timeout";
      attempt.errorMessage = String(error?.message ?? error);
      if (response && attempt.httpStatus === null) attempt.httpStatus = response.status;
    } finally {
      attempt.endedAt = nowIso(clock);
      attempts.push({ ...attempt });
    }
    if (capture) break;
    if (attemptNumber < maxAttempts) await sleep(plan.retryBackoffMs[attemptNumber - 1] ?? 0);
  }
  return Object.freeze({ plan, planId: plan.planId, id: plan.id, requestFingerprint: requestFingerprint(plan), responseCaptured: capture ? 1 : 0, attempts: Object.freeze(attempts), capture });
}

function safeArtifactName(plan) { return `${plan.id}-${plan.planId.slice(-12)}.raw`; }
export function writeArtifact(root, plan, capture) {
  assert(capture?.body, "cannot write an empty raw artifact");
  const relativePath = path.join(ARTIFACT_ROOT, safeArtifactName(plan)).replaceAll("\\\\", "/");
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, capture.body, "utf8");
  assert(sha256(fs.readFileSync(absolutePath)) === capture.hash, `${plan.id} artifact hash changed while writing`);
  return { path: relativePath, sha256: capture.hash, bytes: capture.bytes };
}

export function buildLedger(records, generatedAt = new Date().toISOString()) {
  const rows = records.map((record) => ({
    ...record,
    requestUrl: record.plan?.requestUrl ?? record.requestUrl ?? null,
    serviceEndpoint: record.plan?.serviceEndpoint ?? record.serviceEndpoint ?? null,
    expectedSnapshotRecordDigest: record.plan?.expectedSnapshotRecordDigest ?? record.expectedSnapshotRecordDigest ?? null,
    expectedProjectionRecordDigest: record.plan?.expectedProjectionRecordDigest ?? record.expectedProjectionRecordDigest ?? null,
    state: record.responseCaptured ? "raw-only" : "blocked",
    runtimeAdmission: "candidate-only",
    measurementAdmission: "not-admitted",
    scientificPayloadWriteback: false,
    attemptLedger: record.attempts.map((attempt) => ({ ...attempt, requestUrl: record.plan?.requestUrl ?? record.requestUrl, transport: "https-html", timeout: attempt.errorCategory === "timeout", errorClass: ["http-4xx", "http-5xx"].includes(attempt.errorCategory) ? "http-status" : attempt.errorCategory === "CONTENT_TYPE" ? "content-type" : ["UNSAFE_REDIRECT", "REDIRECT_LIMIT"].includes(attempt.errorCategory) ? "redirect" : attempt.errorCategory === "network-not-run" ? "network" : attempt.errorCategory, requestFingerprint: `GET ${record.plan?.requestUrl ?? record.requestUrl} transport=https-html` })),
    attempts: record.attempts.map((attempt) => ({ ...attempt })),
    capture: undefined,
  }));
  const counts = { total: rows.length, attempted: rows.filter((row) => row.attempts.length > 0).length, responseCaptured: rows.reduce((sum, row) => sum + row.responseCaptured, 0), failed: rows.filter((row) => row.responseCaptured === 0 && row.attempts.length > 0).length, pending: rows.filter((row) => row.attempts.length === 0).length };
  return { schema: SCHEMA, generatedAt, source: { path: INPUT_PATH, schema: "mainline-a-beta-stellar-raw-capture-v619" }, counts, boundary: { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false, runtimeWrites: false, measurementWrites: false }, records: rows };
}

export function validateAttempt(attempt) {
  const errors = [];
  if (!Number.isInteger(attempt.attempt) || attempt.attempt < 1) errors.push("attempt-invalid");
  if (!ISO_UTC.test(attempt.startedAt) || !ISO_UTC.test(attempt.endedAt)) errors.push("timestamps-invalid");
  if (!Number.isInteger(attempt.timeoutMs) || attempt.timeoutMs <= 0) errors.push("timeout-invalid");
  if (!Number.isInteger(attempt.retryCount) || attempt.retryCount !== attempt.attempt - 1) errors.push("retry-count-invalid");
  if (attempt.httpStatus !== null && (!Number.isInteger(attempt.httpStatus) || attempt.httpStatus < 100)) errors.push("http-status-invalid");
  if (attempt.responseCaptured === 1 && (!attempt.rawArtifactSha256 || !attempt.finalUrl)) errors.push("captured-metadata-missing");
  if (attempt.responseCaptured === 0 && (attempt.rawArtifactPath || attempt.rawArtifactSha256 || attempt.responseBytes !== null)) errors.push("failed-attempt-has-artifact");
  if (!/^[a-f0-9]{64}$/i.test(attempt.requestFingerprint)) errors.push("request-fingerprint-invalid");
  return errors;
}
export function validateLedger(ledger) {
  if (ledger.schema !== SCHEMA || ledger.records?.length !== 4) return false;
  if (!ledger.boundary?.candidateOnly || !ledger.boundary.hold || !ledger.boundary.notAdmitted || ledger.boundary.scientificPayloadWriteback) return false;
  if (!ledger.records.every((row, index) => ALLOWLIST[index] === row.id && row.planId && row.requestFingerprint && row.attempts.every((attempt) => validateAttempt(attempt).length === 0))) return false;
  const attempted = ledger.records.filter((row) => row.attempts.length > 0).length;
  const captured = ledger.records.reduce((sum, row) => sum + row.responseCaptured, 0);
  const failed = ledger.records.filter((row) => row.responseCaptured === 0 && row.attempts.length > 0).length;
  const pending = ledger.records.filter((row) => row.attempts.length === 0).length;
  return ledger.records.every((row) => row.responseCaptured === 0 || row.attempts.some((attempt) => attempt.responseCaptured === 1)) && ledger.counts.attempted === attempted && ledger.counts.responseCaptured === captured && ledger.counts.failed === failed && ledger.counts.pending === pending;
}
export function replayAttemptLedger(ledger, artifactReader = () => null) {
  assert(validateLedger(ledger), "ledger validation failed");
  return ledger.records.map((row) => ({ id: row.id, responseCaptured: row.responseCaptured, attempts: row.attempts.length, hashesVerified: row.attempts.filter((a) => a.responseCaptured === 1).every((a) => { const body = artifactReader(a.rawArtifactPath); return body != null && sha256(body) === a.rawArtifactSha256; }), errorCategories: row.attempts.map((a) => a.errorCategory).filter(Boolean) }));
}

export function readJson(root, relativePath) { const filename = path.join(root, relativePath); assert(fs.existsSync(filename), `missing ${relativePath}`); return JSON.parse(fs.readFileSync(filename, "utf8")); }
export async function run({ root = process.cwd(), check = false, offline = false, timeoutMs } = {}) {
  const source = readJson(root, INPUT_PATH);
  if (check) {
    const existing = readJson(root, OUTPUT_PATH);
    assert(validateLedger(existing), "existing ledger invalid");
    return { status: "verified", output: OUTPUT_PATH, counts: existing.counts };
  }
  const plans = source.records.map((row) => ({ ...row.plan, timeoutMs: timeoutMs ?? row.plan.timeoutMs }));
  const results = [];
  for (const plan of plans) {
    const result = offline ? (() => {
      const startedAt = new Date().toISOString();
      const attempt = createAttempt(plan, 1, startedAt);
      attempt.endedAt = startedAt;
      attempt.errorCategory = "network-not-run";
      attempt.errorMessage = "offline seed; live HTTPS collector not executed";
      return { plan, planId: plan.planId, id: plan.id, requestFingerprint: requestFingerprint(plan), responseCaptured: 0, attempts: [attempt], capture: null };
    })() : await collectPlan(plan);
    if (result.capture) {
      const artifact = writeArtifact(root, plan, result.capture);
      const attempts = result.attempts.map((attempt, index) => index === result.attempts.length - 1 ? { ...attempt, rawArtifactPath: artifact.path, responseBytes: artifact.bytes } : attempt);
      results.push({ ...result, attempts });
    } else results.push(result);
  }
  const ledger = buildLedger(results);
  fs.writeFileSync(path.join(root, OUTPUT_PATH), `${JSON.stringify(ledger, null, 2)}\n`, "utf8");
  return { status: "generated", output: OUTPUT_PATH, counts: ledger.counts };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run({ check: process.argv.includes("--check"), offline: process.argv.includes("--offline") }).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}

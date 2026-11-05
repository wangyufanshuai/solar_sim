import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const INPUT = "app/data/mainlineANebulaRightsPackV613.generated.json";
export const OUTPUT = "app/data/mainlineANebulaBatchV624.generated.json";
export const OFFLINE_OUTPUT = "app/data/mainlineANebulaBatchV624.offline.generated.json";
export const ARTIFACT_ROOT = "docs/release/v607/nebula-image-artifacts/r64";
export const LEDGER_HISTORY_ROOT = "docs/release/v607/nebula-batch-ledger/r64";
export const BATCH_ID = "r64-base-six";
export const IDS = Object.freeze(["heart-nebula", "soul-nebula", "witch-head-nebula", "flame-nebula", "pacman-nebula", "running-chicken-nebula"]);

const ALLOWED_HOST = "images-assets.nasa.gov";
const ACCEPT = "image/jpeg,image/png,image/webp";
const USER_AGENT = "SolarSim-MainlineA-R64/1.0";
const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_RETRIES = 1;
const MAX_BYTES = 60_000_000;
const SHA = /^[a-f0-9]{64}$/i;

export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function readJson(root, relative) {
  return JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
}

export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
}

export function fingerprintRequest(url, headers = {}) {
  const normalizedHeaders = Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]).sort(([a], [b]) => a.localeCompare(b)));
  return sha256(JSON.stringify(canonical({ method: "GET", url, headers: normalizedHeaders })));
}

export function safeSourceUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && parsed.hostname === ALLOWED_HOST && !parsed.username && !parsed.password && !parsed.port && !parsed.hash;
  } catch {
    return false;
  }
}

export function classifyError(error, response = null) {
  if (error?.name === "AbortError") return "timeout";
  if (error?.code === "UNSAFE_URL") return "unsafe-url";
  if (error?.code === "CONTENT_TYPE") return "content-type";
  if (error?.code === "PAYLOAD_TOO_LARGE") return "payload-too-large";
  if (response?.status >= 500) return "http-5xx";
  if (response?.status >= 400) return "http-4xx";
  if (error?.code === "REDIRECT") return "redirect";
  if (error?.code === "ENOTFOUND" || error?.code === "EAI_AGAIN") return "dns";
  if (error?.code === "CERT_HAS_EXPIRED" || error?.code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE") return "tls";
  return error ? "network" : null;
}

export function isRetryable(errorClass, status = null) {
  return errorClass === "timeout" || errorClass === "dns" || errorClass === "tls" || errorClass === "network" || status >= 500;
}

export function backoffMs(retryCount) {
  return Math.min(30_000, 750 * (2 ** Math.max(0, Math.min(5, retryCount))));
}

export function createAttempt(url, number, startedAt, timeoutMs, collectionId = null) {
  return { attempt: number, runAttempt: number, collectionId, startedAt, endedAt: null, requestExecuted: false, timeout: false, timeoutMs, retryCount: number - 1, httpStatus: null, contentType: null, requestUrl: url, finalUrl: null, redirectChain: [], errorClass: null, errorMessage: null, requestFingerprint: fingerprintRequest(url, { accept: ACCEPT, "user-agent": USER_AGENT }), responseCaptured: 0, responseBytes: null, width: null, height: null, format: null, rawArtifactPath: null, rawPageSha256: null };
}

export function artifactRelativePath(id, nasaId, format, digest) {
  const clean = (value) => String(value).replace(/[^a-z0-9_-]/gi, "-").toLowerCase();
  if (!SHA.test(String(digest ?? ""))) throw new Error("artifact digest required for immutable path");
  return `${ARTIFACT_ROOT}/${clean(id)}-${clean(nasaId)}-${String(digest).toLowerCase()}.${format.toLowerCase()}`;
}

async function readResponseBytes(response, maxBytes) {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) throw Object.assign(new Error(`content-length ${declared} exceeds max`), { code: "PAYLOAD_TOO_LARGE" });
  const reader = response.body?.getReader?.();
  if (!reader) {
    const body = Buffer.from(await response.arrayBuffer());
    if (body.byteLength > maxBytes) throw Object.assign(new Error(`body exceeded ${maxBytes} bytes`), { code: "PAYLOAD_TOO_LARGE" });
    return body;
  }
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw Object.assign(new Error(`stream exceeded ${maxBytes} bytes`), { code: "PAYLOAD_TOO_LARGE" });
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks, total);
}

export async function fetchImage(url, options = {}) {
  if (!safeSourceUrl(url)) throw Object.assign(new Error("source URL is outside the allowlist"), { code: "UNSAFE_URL" });
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const redirectChain = [url];
  let currentUrl = url;
  const maxRedirects = options.maxRedirects ?? 5;
  try {
    let response;
    for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
      response = await fetchImpl(currentUrl, { method: "GET", redirect: "manual", signal: controller.signal, headers: { accept: options.accept ?? ACCEPT, "user-agent": options.userAgent ?? USER_AGENT } });
      if (!(response.status >= 300 && response.status < 400)) break;
      const location = response.headers.get("location");
      if (!location) {
        throw Object.assign(new Error(`redirect ${response.status} has no safe terminal URL`), { code: "REDIRECT", response, redirectChain: [...redirectChain], finalUrl: currentUrl });
      }
      const nextUrl = new URL(location, currentUrl).toString();
      if (!safeSourceUrl(nextUrl)) {
        throw Object.assign(new Error("redirect target is outside the allowlist"), { code: "REDIRECT", response, redirectChain: [...redirectChain, nextUrl], finalUrl: nextUrl });
      }
      if (redirectCount === maxRedirects) {
        throw Object.assign(new Error(`redirect limit ${maxRedirects} exceeded`), { code: "REDIRECT", response, redirectChain: [...redirectChain, nextUrl], finalUrl: nextUrl });
      }
      redirectChain.push(nextUrl);
      currentUrl = nextUrl;
    }
    if (response.status !== 200) throw Object.assign(new Error(`HTTP ${response.status}`), { response });
    const contentType = (response.headers.get("content-type") ?? "").split(";", 1)[0].trim().toLowerCase();
    if (!/^image\/(jpeg|jpg|png|webp)$/.test(contentType)) throw Object.assign(new Error(`unsupported content type ${contentType}`), { code: "CONTENT_TYPE", response });
    const body = await readResponseBytes(response, options.maxBytes ?? MAX_BYTES);
    const metadata = await sharp(body, { failOn: "error" }).metadata();
    const format = metadata.format === "jpeg" ? "jpg" : metadata.format;
    if (!format || !["jpg", "png", "webp"].includes(format) || !metadata.width || !metadata.height) throw new Error("image metadata incomplete");
    return { response, body, contentType, format, width: metadata.width, height: metadata.height, sha256: sha256(body), finalUrl: currentUrl, redirectChain };
  } finally {
    clearTimeout(timer);
  }
}

export async function collectCandidate(candidate, options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options.maxRetries ?? DEFAULT_RETRIES;
  const collectionId = options.collectionId ?? crypto.randomUUID();
  const attempts = [];
  let captured = null;
  for (let number = 1; number <= retries + 1; number += 1) {
    const attempt = createAttempt(candidate.sourceUrl, number, new Date().toISOString(), timeoutMs, collectionId);
    try {
      attempt.requestExecuted = true;
      const result = await fetchImage(candidate.sourceUrl, options);
      attempt.httpStatus = result.response.status;
      attempt.contentType = result.contentType;
      attempt.finalUrl = result.finalUrl;
      attempt.redirectChain = result.redirectChain;
      attempt.responseCaptured = 1;
      attempt.responseBytes = result.body.byteLength;
      attempt.width = result.width;
      attempt.height = result.height;
      attempt.format = result.format;
      attempt.rawPageSha256 = result.sha256;
      captured = result;
    } catch (error) {
      const response = error?.response ?? null;
      attempt.httpStatus = response?.status ?? null;
      attempt.contentType = response?.headers?.get?.("content-type") ?? null;
      attempt.finalUrl = error?.finalUrl ?? error?.redirectChain?.at?.(-1) ?? candidate.sourceUrl;
      attempt.redirectChain = error?.redirectChain ?? [candidate.sourceUrl];
      attempt.errorClass = classifyError(error, response);
      attempt.errorMessage = String(error?.message ?? error).slice(0, 500);
      attempt.timeout = attempt.errorClass === "timeout";
    } finally {
      attempt.endedAt = new Date().toISOString();
      attempts.push(attempt);
    }
    if (captured || number > retries || !isRetryable(attempt.errorClass, attempt.httpStatus)) break;
    await new Promise((resolve) => setTimeout(resolve, backoffMs(number - 1)));
  }
  return { candidateId: candidate.candidateId, sourceUrl: candidate.sourceUrl, requestFingerprint: attempts[0].requestFingerprint, responseCaptured: captured ? 1 : 0, attempts, captured };
}

export async function persistCapture(capture, candidate, root) {
  if (!capture.captured) return null;
  const relative = artifactRelativePath(candidate.candidateId, candidate.nasaId, capture.captured.format, capture.captured.sha256);
  const absolute = path.join(root, relative);
  const resolvedRoot = path.resolve(root, ARTIFACT_ROOT);
  if (!path.resolve(absolute).startsWith(`${resolvedRoot}${path.sep}`)) throw new Error("artifact path escaped root");
  await fsp.mkdir(path.dirname(absolute), { recursive: true });
  await fsp.writeFile(absolute, capture.captured.body, { flag: "wx" }).catch(async (error) => { if (error.code !== "EEXIST") throw error; const prior = await fsp.readFile(absolute); if (sha256(prior) !== capture.captured.sha256) throw new Error("existing artifact hash mismatch"); });
  return { path: relative, sha256: capture.captured.sha256, bytes: capture.captured.body.byteLength, width: capture.captured.width, height: capture.captured.height, format: capture.captured.format };
}

/** Verify a previously recorded artifact before it is reused after a failed request. */
export async function verifyPriorArtifact(artifact, root, priorAttempts = []) {
  if (!artifact?.path || !SHA.test(String(artifact.sha256 ?? ""))) return null;
  const linked = priorAttempts.some((attempt) => attempt?.responseCaptured === 1 && attempt.rawArtifactPath === artifact.path && String(attempt.rawPageSha256 ?? "").toLowerCase() === String(artifact.sha256).toLowerCase());
  if (!linked) return null;
  const resolvedRoot = path.resolve(root, ARTIFACT_ROOT);
  const absolute = path.resolve(root, artifact.path);
  if (!absolute.startsWith(`${resolvedRoot}${path.sep}`)) return null;
  try {
    const realRoot = await fsp.realpath(resolvedRoot);
    const realAbsolute = await fsp.realpath(absolute);
    if (!realAbsolute.startsWith(`${realRoot}${path.sep}`)) return null;
    const bytes = await fsp.readFile(realAbsolute);
    const digest = sha256(bytes);
    if (digest !== String(artifact.sha256).toLowerCase()) return null;
    if (artifact.bytes != null && Number(artifact.bytes) !== bytes.byteLength) return null;
    const metadata = await sharp(bytes, { failOn: "error" }).metadata();
    const format = metadata.format === "jpeg" ? "jpg" : metadata.format;
    if (artifact.format && format !== artifact.format) return null;
    if (artifact.width != null && Number(artifact.width) !== metadata.width) return null;
    if (artifact.height != null && Number(artifact.height) !== metadata.height) return null;
    return { ...artifact, path: artifact.path, sha256: digest, bytes: bytes.byteLength, width: metadata.width, height: metadata.height, format };
  } catch {
    return null;
  }
}

export function appendAttemptHistory(previousAttempts = [], currentAttempts = []) {
  const prior = previousAttempts.map((attempt, index) => ({
    ...attempt,
    attempt: index + 1,
    runAttempt: attempt.runAttempt ?? attempt.attempt ?? index + 1,
    retryScope: attempt.retryScope ?? "legacy-unclassified",
    ...(attempt.retryScope ? {} : { legacyRetryCount: attempt.retryCount ?? null }),
  }));
  const offset = prior.length;
  const appended = currentAttempts.map((attempt, index) => ({ ...attempt, attempt: offset + index + 1, runAttempt: attempt.runAttempt ?? attempt.attempt ?? index + 1, retryScope: "per-collection" }));
  return [...prior, ...appended];
}

/** Archive an exact batch snapshot under its content SHA before/after replacement. */
export async function archiveLedgerSnapshot(bytes, root) {
  const digest = sha256(bytes);
  const relative = `${LEDGER_HISTORY_ROOT}/${digest}.json`;
  const absolute = path.resolve(root, relative);
  const base = path.resolve(root, LEDGER_HISTORY_ROOT);
  if (!absolute.startsWith(`${base}${path.sep}`)) throw new Error("ledger archive path escaped root");
  await fsp.mkdir(base, { recursive: true });
  try {
    await fsp.writeFile(absolute, bytes, { flag: "wx" });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const existing = await fsp.readFile(absolute);
    if (sha256(existing) !== digest) throw new Error("existing ledger archive hash mismatch");
  }
  return { path: relative, sha256: digest, bytes: bytes.byteLength };
}

function historicalEvidence(candidate, root) {
  const local = candidate.sourceLocalPath;
  const absolute = local ? path.join(root, local) : null;
  if (!absolute || !fs.existsSync(absolute)) return { status: "missing", path: local ?? null, sha256: null, bytes: null, width: null, height: null, issues: ["historical-file-missing"] };
  const bytes = fs.readFileSync(absolute);
  const digest = sha256(bytes);
  const issues = [];
  if (digest !== candidate.sourceSha256) issues.push("historical-sha-mismatch");
  return { status: issues.length ? "mismatch" : "verified", path: local, sha256: digest, bytes: bytes.byteLength, width: candidate.sourceWidth, height: candidate.sourceHeight, issues };
}

export function buildRow(candidate, historical, network, artifact = null) {
  const blockers = [];
  if (historical.status !== "verified") blockers.push(...historical.issues);
  if (network.responseCaptured !== 1) blockers.push("network-payload-pending");
  if (candidate.evidence.status !== "cleared") blockers.push("rights-signoff-pending");
  blockers.push("visual-signoff-pending", "runtime-candidate-only");
  return { id: candidate.candidateId, title: candidate.candidateId, source: { url: candidate.sourceUrl, credit: candidate.sourceCredit, licenseUrl: candidate.evidence.sourceLicenseUrl, declaredLicense: candidate.sourceLicense }, historical, network: { status: network.responseCaptured ? "captured" : network.attempts.some((attempt) => attempt.errorClass) ? "failed" : "not-run", responseCaptured: network.responseCaptured, attempts: network.attempts, artifact }, rights: { status: candidate.evidence.status === "cleared" ? "cleared" : "pending", blockers: candidate.evidence.status === "cleared" ? [] : ["item-rights-review-pending"] }, blockers: [...new Set(blockers)], runtimeAdmission: "candidate-only", measurementAdmission: "not-admitted", scientificPayloadWriteback: false };
}

export function buildOfflineRow(candidate, root) {
  const now = new Date().toISOString();
  const historical = historicalEvidence(candidate, root);
  const attempt = createAttempt(candidate.sourceUrl, 1, now, DEFAULT_TIMEOUT_MS, "offline-ledger");
  attempt.endedAt = now;
  attempt.errorClass = "network-not-run";
  attempt.errorMessage = "offline ledger mode; no network request executed";
  return buildRow(candidate, historical, { candidateId: candidate.candidateId, sourceUrl: candidate.sourceUrl, requestFingerprint: attempt.requestFingerprint, responseCaptured: 0, attempts: [attempt], captured: null });
}

export function validateBatch(batch) {
  if (batch.schema !== "mainline-a-nebula-batch-v624" || batch.batchId !== BATCH_ID) return ["schema-invalid"];
  const issues = [];
  if (batch.rows.length !== IDS.length) issues.push("row-count-invalid");
  IDS.forEach((id, index) => { if (batch.rows[index]?.id !== id) issues.push(`roster-${id}`); });
  const seen = new Set();
  for (const row of batch.rows) {
    if (seen.has(row.id)) issues.push(`duplicate-${row.id}`);
    seen.add(row.id);
    if (!safeSourceUrl(row.source.url)) issues.push(`${row.id}:source-url-invalid`);
    if (!SHA.test(row.network.attempts[0]?.requestFingerprint ?? "")) issues.push(`${row.id}:fingerprint-invalid`);
    if (row.network.status !== "captured" && row.network.artifact !== null) issues.push(`${row.id}:artifact-without-capture`);
    if (row.runtimeAdmission !== "candidate-only" || row.measurementAdmission !== "not-admitted" || row.scientificPayloadWriteback !== false) issues.push(`${row.id}:boundary-open`);
    row.network.attempts.forEach((attempt, index) => { if (attempt.attempt !== index + 1) issues.push(`${row.id}:attempt-sequence`); if (!attempt.startedAt || !attempt.endedAt) issues.push(`${row.id}:attempt-time`); });
  }
  return [...new Set(issues)];
}

export function assembleBatch(rows, root, source) {
  const counts = { total: rows.length, networkAttempted: rows.reduce((sum, row) => sum + row.network.attempts.filter((attempt) => attempt.requestExecuted).length, 0), ledgerAttempts: rows.reduce((sum, row) => sum + row.network.attempts.length, 0), captured: rows.filter((row) => row.network.status === "captured").length, historicalVerified: rows.filter((row) => row.historical.status === "verified").length, rightsPending: rows.filter((row) => row.rights.status !== "cleared").length };
  return { schema: "mainline-a-nebula-batch-v624", batchId: BATCH_ID, createdAt: new Date().toISOString(), sourceIdentity: { branch: process.env.GIT_BRANCH ?? "codex/solar-sim-mainline-a", head: process.env.GIT_HEAD ?? "unknown", inputs: [{ path: INPUT, sha256: sha256(fs.readFileSync(path.join(root, INPUT))) }] }, rows, counts, boundary: { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false }, evidence: { historical: "source-cache historical hash verification", network: source, externalSourceEvidence: String(source).startsWith("live"), rights: "item-level review remains pending" } };
}

export async function run({ root = ROOT, offline = false, check = false, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const outputPath = offline ? OFFLINE_OUTPUT : OUTPUT;
  if (check) { const current = readJson(root, outputPath); const issues = validateBatch(current); if (issues.length) throw new Error(`V624 batch invalid: ${issues.join(",")}`); return { status: "verified", counts: current.counts, fingerprint: sha256(JSON.stringify(canonical(current))), output: outputPath }; }
  const pack = readJson(root, INPUT);
  const priorPath = path.join(root, OUTPUT);
  const prior = !offline && fs.existsSync(priorPath) ? readJson(root, OUTPUT) : null;
  const candidates = IDS.map((id) => pack.records.find((record) => record.candidateId === id)).filter(Boolean);
  if (candidates.length !== IDS.length) throw new Error("V624 source roster incomplete");
  const rows = [];
  for (const candidate of candidates) {
    if (offline) rows.push(buildOfflineRow(candidate, root));
    else {
      const network = await collectCandidate(candidate, { timeoutMs });
      const artifact = await persistCapture(network, candidate, root);
      if (artifact) {
        const capturedAttempt = network.attempts.find((attempt) => attempt.responseCaptured === 1);
        if (capturedAttempt) {
          capturedAttempt.rawArtifactPath = artifact.path;
          capturedAttempt.rawPageSha256 = artifact.sha256;
          capturedAttempt.responseBytes = artifact.bytes;
        }
      }
      const previous = prior?.rows?.find((row) => row.id === candidate.candidateId);
      const reusableArtifact = await verifyPriorArtifact(previous?.network?.artifact, root, previous?.network?.attempts ?? []);
      const attempts = appendAttemptHistory(previous?.network?.attempts ?? [], network.attempts);
      const selectedArtifact = artifact ?? reusableArtifact;
      const mergedNetwork = { ...network, responseCaptured: selectedArtifact ? 1 : 0, attempts, artifact: selectedArtifact, captured: selectedArtifact ? (network.captured ?? null) : null };
      rows.push(buildRow(candidate, historicalEvidence(candidate, root), mergedNetwork, selectedArtifact));
    }
  }
  const batch = assembleBatch(rows, root, offline ? "offline-no-request" : "live-https-attempt");
  const issues = validateBatch(batch);
  if (issues.length) throw new Error(`V624 batch invalid: ${issues.join(",")}`);
  const outputBytes = Buffer.from(`${JSON.stringify(batch, null, 2)}\n`, "utf8");
  const outputAbsolute = path.join(root, outputPath);
  if (fs.existsSync(outputAbsolute)) await archiveLedgerSnapshot(await fsp.readFile(outputAbsolute), root);
  const archive = await archiveLedgerSnapshot(outputBytes, root);
  fs.writeFileSync(outputAbsolute, outputBytes, "utf8");
  return { status: "generated", counts: batch.counts, fingerprint: sha256(JSON.stringify(canonical(batch))), output: outputPath, archive };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run({ offline: process.argv.includes("--offline"), check: process.argv.includes("--check"), timeoutMs: Number(process.env.MAINLINE_A_R64_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS }).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => { console.error(error.stack ?? error.message); process.exitCode = 1; });
}

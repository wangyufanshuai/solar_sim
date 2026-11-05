import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import {
  backoffMs,
  canonical,
  classifyError,
  fetchImage,
  fingerprintRequest,
  isRetryable,
  sha256,
  safeSourceUrl,
} from "./collect-mainline-a-nebula-batch-v624.mjs";

export { sha256, safeSourceUrl };

const require = createRequire(import.meta.url);
const sharp = require("sharp");

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const INPUT = "app/data/mainlineANebulaRightsPackV613.generated.json";
export const OUTPUT = "app/data/mainlineANebulaBatchV628.generated.json";
export const OFFLINE_OUTPUT = "app/data/mainlineANebulaBatchV628.offline.generated.json";
export const ARTIFACT_ROOT = "docs/release/v607/nebula-image-artifacts/r68";
export const LEDGER_HISTORY_ROOT = "docs/release/v607/nebula-batch-ledger/r68";
export const BATCH_ID = "r66-beta-next-six";
export const IDS = Object.freeze([
  "jellyfish-nebula",
  "cocoon-nebula",
  "rho-ophiuchi-cloud",
  "cepheus-c-nebula",
  "dragon-lair-nebula",
  "monkey-head-nebula",
]);

const ACCEPT = "image/jpeg,image/png,image/webp";
const USER_AGENT = "SolarSim-MainlineA-R66-Nebula/1.0";
const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_RETRIES = 1;
const MAX_BYTES = 60_000_000;
const SHA = /^[a-f0-9]{64}$/i;
const ALLOWED_FORMATS = new Set(["jpg", "png", "webp"]);

export function readJson(root, relative) {
  return JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
}

export function normalizedSource(candidate) {
  return {
    url: candidate.sourceUrl,
    nasaId: candidate.nasaId ?? null,
    credit: candidate.sourceCredit ?? null,
    licenseUrl: candidate.evidence?.sourceLicenseUrl ?? null,
    declaredLicense: candidate.sourceLicense ?? null,
    sourcePageStatus: "pending",
  };
}

export function artifactRelativePath(id, nasaId, format, digest) {
  const clean = (value) => String(value).replace(/[^a-z0-9_-]/gi, "-").toLowerCase();
  if (!SHA.test(String(digest ?? ""))) throw new Error("artifact digest required for immutable path");
  if (!ALLOWED_FORMATS.has(String(format).toLowerCase())) throw new Error("unsupported artifact format");
  return `${ARTIFACT_ROOT}/${clean(id)}-${clean(nasaId)}-${String(digest).toLowerCase()}.${String(format).toLowerCase()}`;
}

function isInside(base, candidate) {
  const resolvedBase = path.resolve(base);
  const resolvedCandidate = path.resolve(candidate);
  return resolvedCandidate.startsWith(`${resolvedBase}${path.sep}`);
}

export function createAttempt(url, number, startedAt, timeoutMs, collectionId = null) {
  return {
    attempt: number,
    runAttempt: number,
    collectionId,
    startedAt,
    endedAt: null,
    requestExecuted: false,
    timeout: false,
    timeoutMs,
    retryCount: number - 1,
    httpStatus: null,
    contentType: null,
    requestUrl: url,
    finalUrl: null,
    redirectChain: [],
    errorClass: null,
    errorMessage: null,
    requestFingerprint: fingerprintRequest(url, { accept: ACCEPT, "user-agent": USER_AGENT }),
    responseCaptured: 0,
    responseBytes: null,
    width: null,
    height: null,
    format: null,
    rawArtifactPath: null,
    rawPageSha256: null,
  };
}

export async function collectCandidate(candidate, options = {}) {
  if (!safeSourceUrl(candidate.sourceUrl)) {
    const error = Object.assign(new Error("source URL is outside the allowlist"), { code: "UNSAFE_URL" });
    const attempt = createAttempt(candidate.sourceUrl, 1, new Date().toISOString(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS, options.collectionId ?? null);
    attempt.requestExecuted = false;
    attempt.errorClass = classifyError(error);
    attempt.errorMessage = error.message;
    attempt.endedAt = new Date().toISOString();
    return { candidateId: candidate.candidateId, sourceUrl: candidate.sourceUrl, requestFingerprint: attempt.requestFingerprint, responseCaptured: 0, attempts: [attempt], captured: null };
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options.maxRetries ?? DEFAULT_RETRIES;
  const collectionId = options.collectionId ?? crypto.randomUUID();
  const attempts = [];
  let captured = null;
  for (let number = 1; number <= retries + 1; number += 1) {
    const attempt = createAttempt(candidate.sourceUrl, number, new Date().toISOString(), timeoutMs, collectionId);
    try {
      attempt.requestExecuted = true;
      const result = await fetchImage(candidate.sourceUrl, {
        ...options,
        timeoutMs,
        accept: ACCEPT,
        userAgent: USER_AGENT,
        fetchImpl: options.fetchImpl,
        maxBytes: options.maxBytes ?? MAX_BYTES,
      });
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
  if (!capture?.captured) return null;
  const relative = artifactRelativePath(candidate.candidateId, candidate.nasaId, capture.captured.format, capture.captured.sha256);
  const base = path.resolve(root, ARTIFACT_ROOT);
  const absolute = path.resolve(root, relative);
  if (!isInside(base, absolute)) throw new Error("artifact path escaped root");
  await fsp.mkdir(path.dirname(absolute), { recursive: true });
  try {
    await fsp.writeFile(absolute, capture.captured.body, { flag: "wx" });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const existing = await fsp.readFile(absolute);
    if (sha256(existing) !== capture.captured.sha256) throw new Error("existing artifact hash mismatch");
  }
  return {
    path: relative,
    sha256: capture.captured.sha256,
    bytes: capture.captured.body.byteLength,
    width: capture.captured.width,
    height: capture.captured.height,
    format: capture.captured.format,
  };
}

export async function verifyPriorArtifact(artifact, root, priorAttempts = []) {
  if (!artifact?.path || !SHA.test(String(artifact.sha256 ?? ""))) return null;
  const linked = priorAttempts.some((attempt) => attempt?.responseCaptured === 1 && attempt.rawArtifactPath === artifact.path && String(attempt.rawPageSha256 ?? "").toLowerCase() === String(artifact.sha256).toLowerCase());
  if (!linked) return null;
  const base = path.resolve(root, ARTIFACT_ROOT);
  const absolute = path.resolve(root, artifact.path);
  if (!isInside(base, absolute)) return null;
  try {
    const realBase = await fsp.realpath(base);
    const realAbsolute = await fsp.realpath(absolute);
    if (!isInside(realBase, realAbsolute)) return null;
    const bytes = await fsp.readFile(realAbsolute);
    const digest = sha256(bytes);
    if (digest !== String(artifact.sha256).toLowerCase()) return null;
    if (artifact.bytes != null && Number(artifact.bytes) !== bytes.byteLength) return null;
    const metadata = await sharp(bytes, { failOn: "error" }).metadata();
    const format = metadata.format === "jpeg" ? "jpg" : metadata.format;
    if (!ALLOWED_FORMATS.has(format) || (artifact.format && format !== artifact.format)) return null;
    if (artifact.width != null && Number(artifact.width) !== metadata.width) return null;
    if (artifact.height != null && Number(artifact.height) !== metadata.height) return null;
    return { ...artifact, sha256: digest, bytes: bytes.byteLength, width: metadata.width, height: metadata.height, format };
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
  }));
  const offset = prior.length;
  const appended = currentAttempts.map((attempt, index) => ({
    ...attempt,
    attempt: offset + index + 1,
    runAttempt: attempt.runAttempt ?? attempt.attempt ?? index + 1,
    retryScope: "per-collection",
  }));
  return [...prior, ...appended];
}

function historicalEvidence(candidate, root) {
  const local = candidate.sourceLocalPath;
  const absolute = local ? path.resolve(root, local) : null;
  if (!absolute || !fs.existsSync(absolute)) return { status: "missing", path: local ?? null, sha256: null, bytes: null, width: null, height: null, issues: ["historical-file-missing"] };
  const bytes = fs.readFileSync(absolute);
  const digest = sha256(bytes);
  const issues = digest === candidate.sourceSha256 ? [] : ["historical-sha-mismatch"];
  return { status: issues.length ? "mismatch" : "verified", path: local, sha256: digest, bytes: bytes.byteLength, width: candidate.sourceWidth ?? null, height: candidate.sourceHeight ?? null, issues };
}

export function buildRow(candidate, historical, network, artifact = null) {
  const blockers = [];
  if (historical.status !== "verified") blockers.push(...historical.issues);
  if (network.responseCaptured !== 1) blockers.push("network-payload-pending");
  blockers.push("source-page-pending", "rights-signoff-pending", "visual-signoff-pending", "runtime-candidate-only");
  const offlineLedger = network.attempts.length > 0 && network.attempts.every((attempt) => attempt.errorClass === "network-not-run");
  return {
    id: candidate.candidateId,
    title: candidate.candidateId,
    source: normalizedSource(candidate),
    historical,
    network: {
      status: network.responseCaptured ? "captured" : offlineLedger ? "not-run" : network.attempts.some((attempt) => attempt.errorClass) ? "failed" : "not-run",
      responseCaptured: network.responseCaptured,
      attempts: network.attempts,
      artifact,
    },
    rights: { status: "pending", sourcePageStatus: "pending", signoffStatus: "pending", blockers: ["official-source-page-pending", "item-rights-review-pending"] },
    blockers: [...new Set(blockers)],
    runtimeAdmission: "candidate-only",
    measurementAdmission: "not-admitted",
    scientificPayloadWriteback: false,
  };
}

export function buildOfflineRow(candidate, root) {
  const now = new Date().toISOString();
  const attempt = createAttempt(candidate.sourceUrl, 1, now, DEFAULT_TIMEOUT_MS, "offline-ledger");
  attempt.endedAt = now;
  attempt.errorClass = "network-not-run";
  attempt.errorMessage = "offline ledger mode; no network request executed";
  return buildRow(candidate, historicalEvidence(candidate, root), { responseCaptured: 0, attempts: [attempt] });
}

export function validateBatch(batch) {
  if (batch?.schema !== "mainline-a-nebula-batch-v628" || batch?.batchId !== BATCH_ID) return ["schema-invalid"];
  const issues = [];
  if (!Array.isArray(batch.rows) || batch.rows.length !== IDS.length) issues.push("row-count-invalid");
  IDS.forEach((id, index) => { if (batch.rows?.[index]?.id !== id) issues.push(`roster-${id}`); });
  const seen = new Set();
  for (const row of batch.rows ?? []) {
    if (seen.has(row.id)) issues.push(`duplicate-${row.id}`);
    seen.add(row.id);
    if (!safeSourceUrl(row.source?.url)) issues.push(`${row.id}:source-url-invalid`);
    if (row.source?.sourcePageStatus !== "pending") issues.push(`${row.id}:source-page-open`);
    if (row.rights?.status !== "pending" || row.rights?.signoffStatus !== "pending") issues.push(`${row.id}:rights-open`);
    if (row.runtimeAdmission !== "candidate-only" || row.measurementAdmission !== "not-admitted" || row.scientificPayloadWriteback !== false) issues.push(`${row.id}:boundary-open`);
    if (!Array.isArray(row.network?.attempts) || row.network.attempts.length < 1) issues.push(`${row.id}:attempts-missing`);
    for (const [index, attempt] of (row.network?.attempts ?? []).entries()) {
      if (attempt.attempt !== index + 1) issues.push(`${row.id}:attempt-sequence`);
      if (!attempt.startedAt || !attempt.endedAt || Date.parse(attempt.endedAt) < Date.parse(attempt.startedAt)) issues.push(`${row.id}:attempt-time`);
      if (!SHA.test(String(attempt.requestFingerprint ?? ""))) issues.push(`${row.id}:fingerprint-invalid`);
      if (attempt.responseCaptured === 1 && (!attempt.httpStatus || !attempt.contentType || !attempt.finalUrl)) issues.push(`${row.id}:capture-telemetry-incomplete`);
    }
    if (row.network.status !== "captured" && row.network.artifact !== null) issues.push(`${row.id}:artifact-without-capture`);
    if (row.network.artifact && (!SHA.test(row.network.artifact.sha256) || !ALLOWED_FORMATS.has(row.network.artifact.format))) issues.push(`${row.id}:artifact-invalid`);
  }
  if (batch.boundary?.candidateOnly !== true || batch.boundary?.hold !== true || batch.boundary?.notAdmitted !== true || batch.boundary?.scientificPayloadWriteback !== false) issues.push("batch-boundary-open");
  return [...new Set(issues)];
}

export function assembleBatch(rows, root, source) {
  return {
    schema: "mainline-a-nebula-batch-v628",
    batchId: BATCH_ID,
    createdAt: new Date().toISOString(),
    sourceIdentity: { branch: process.env.GIT_BRANCH ?? "codex/solar-sim-mainline-a", head: process.env.GIT_HEAD ?? "unknown", inputs: [{ path: INPUT, sha256: sha256(fs.readFileSync(path.join(root, INPUT))) }] },
    rows,
    counts: {
      total: rows.length,
      networkAttempted: rows.reduce((sum, row) => sum + row.network.attempts.filter((attempt) => attempt.requestExecuted).length, 0),
      ledgerAttempts: rows.reduce((sum, row) => sum + row.network.attempts.length, 0),
      captured: rows.filter((row) => row.network.status === "captured").length,
      historicalVerified: rows.filter((row) => row.historical.status === "verified").length,
      sourcePagePending: rows.filter((row) => row.source.sourcePageStatus === "pending").length,
      rightsPending: rows.filter((row) => row.rights.status !== "cleared").length,
    },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false, runtimeWrites: false, measurementWrites: false },
    evidence: { historical: "source-cache historical hash verification", network: source, externalSourceEvidence: String(source).startsWith("live"), sourcePages: "pending", rights: "item-level review remains pending" },
  };
}

export async function archiveLedgerSnapshot(bytes, root) {
  const digest = sha256(bytes);
  const relative = `${LEDGER_HISTORY_ROOT}/${digest}.json`;
  const base = path.resolve(root, LEDGER_HISTORY_ROOT);
  const absolute = path.resolve(root, relative);
  if (!isInside(base, absolute)) throw new Error("ledger archive path escaped root");
  await fsp.mkdir(base, { recursive: true });
  try { await fsp.writeFile(absolute, bytes, { flag: "wx" }); } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const prior = await fsp.readFile(absolute);
    if (sha256(prior) !== digest) throw new Error("existing ledger archive hash mismatch");
  }
  return { path: relative, sha256: digest, bytes: bytes.byteLength };
}

export async function run({ root = ROOT, offline = false, check = false, timeoutMs = DEFAULT_TIMEOUT_MS, maxRetries = DEFAULT_RETRIES, fetchImpl } = {}) {
  const output = offline ? OFFLINE_OUTPUT : OUTPUT;
  if (check) {
    const batch = readJson(root, output);
    const issues = validateBatch(batch);
    if (issues.length) throw new Error(`V628 batch invalid: ${issues.join(",")}`);
    return { status: "verified", counts: batch.counts, fingerprint: sha256(JSON.stringify(canonical(batch))), output };
  }
  const pack = readJson(root, INPUT);
  const candidates = IDS.map((id) => pack.records.find((record) => record.candidateId === id));
  if (candidates.some((candidate) => !candidate)) throw new Error("V628 source roster incomplete");
  const prior = !offline && fs.existsSync(path.join(root, OUTPUT)) ? readJson(root, OUTPUT) : null;
  const rows = [];
  for (const candidate of candidates) {
    if (offline) { rows.push(buildOfflineRow(candidate, root)); continue; }
    const network = await collectCandidate(candidate, { timeoutMs, maxRetries, fetchImpl });
    const freshArtifact = await persistCapture(network, candidate, root);
    if (freshArtifact) {
      const successful = network.attempts.find((attempt) => attempt.responseCaptured === 1);
      if (successful) { successful.rawArtifactPath = freshArtifact.path; successful.rawPageSha256 = freshArtifact.sha256; successful.responseBytes = freshArtifact.bytes; }
    }
    const previous = prior?.rows?.find((row) => row.id === candidate.candidateId);
    const reusable = await verifyPriorArtifact(previous?.network?.artifact, root, previous?.network?.attempts ?? []);
    const attempts = appendAttemptHistory(previous?.network?.attempts ?? [], network.attempts);
    const artifact = freshArtifact ?? reusable;
    rows.push(buildRow(candidate, historicalEvidence(candidate, root), { ...network, responseCaptured: artifact ? 1 : 0, attempts }, artifact));
  }
  const batch = assembleBatch(rows, root, offline ? "offline-no-request" : "live-https-attempt");
  const issues = validateBatch(batch);
  if (issues.length) throw new Error(`V628 batch invalid: ${issues.join(",")}`);
  const bytes = Buffer.from(`${JSON.stringify(batch, null, 2)}\n`, "utf8");
  const outputAbsolute = path.join(root, output);
  if (fs.existsSync(outputAbsolute)) await archiveLedgerSnapshot(await fsp.readFile(outputAbsolute), root);
  const archive = await archiveLedgerSnapshot(bytes, root);
  await fsp.mkdir(path.dirname(outputAbsolute), { recursive: true });
  await fsp.writeFile(outputAbsolute, bytes, "utf8");
  return { status: "generated", counts: batch.counts, fingerprint: sha256(JSON.stringify(canonical(batch))), output, archive };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const timeoutEnv = Number(process.env.MAINLINE_A_R66_NEBULA_TIMEOUT_MS);
  const retriesEnv = Number(process.env.MAINLINE_A_R66_NEBULA_RETRIES);
  run({ offline: process.argv.includes("--offline"), check: process.argv.includes("--check"), timeoutMs: Number.isFinite(timeoutEnv) && timeoutEnv > 0 ? timeoutEnv : DEFAULT_TIMEOUT_MS, maxRetries: Number.isInteger(retriesEnv) && retriesEnv >= 0 ? retriesEnv : DEFAULT_RETRIES }).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => { console.error(error.stack ?? error.message); process.exitCode = 1; });
}

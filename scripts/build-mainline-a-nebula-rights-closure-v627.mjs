import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

/**
 * Build a read-only, fail-closed source/rights closure for the two currently
 * captured nebula batches.  This module intentionally does not admit assets
 * into the runtime.  It is a ledger operation: it describes what is known,
 * what is missing, and what has to be reviewed by a human rights owner.
 */

export const CLOSURE_SCHEMA = "mainline-a-nebula-rights-closure-v627";
export const BATCH_SCHEMA = "mainline-a-nebula-batch-v624";
export const LEDGER_SCHEMA = "mainline-a-nebula-image-attempt-ledger-v623";
export const BATCH_PATH = "app/data/mainlineANebulaBatchV624.generated.json";
export const LEDGER_PATH = "app/data/mainlineANebulaImageAttemptLedgerV623.generated.json";
export const DEFAULT_OUTPUT = "docs/release/v607/mainline-a-r64-nebula-rights-closure-v627-verified-20260921.json";
export const DEFAULT_JSONL = "docs/release/v607/mainline-a-r64-nebula-rights-closure-v627-verified-20260921.jsonl";
export const DEFAULT_CSV = "docs/release/v607/mainline-a-r64-nebula-rights-closure-v627-verified-20260921.csv";
export const DEFAULT_MARKDOWN = "docs/release/v607/mainline-a-r64-nebula-rights-closure-v627-verified-20260921.md";
export const SHA256 = /^[a-f0-9]{64}$/i;
export const HEX_FINGERPRINT = /^[a-f0-9]{64}$/i;
export const ROSTER = Object.freeze([
  "heart-nebula",
  "soul-nebula",
  "witch-head-nebula",
  "flame-nebula",
  "pacman-nebula",
  "running-chicken-nebula",
  "ring-nebula",
  "dumbbell-nebula",
  "california-nebula",
  "bubble-nebula",
  "cats-eye-nebula",
  "omega-nebula",
]);
export const CAPTURED_IDS = Object.freeze(ROSTER.slice(0, 6));
export const LEDGER_IDS = Object.freeze(ROSTER.slice(6));
export const BOUNDARY = Object.freeze({
  candidateOnly: true,
  hold: true,
  notAdmitted: true,
  scientificPayloadWriteback: false,
  runtimeWrites: false,
  measurementWrites: false,
});

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARTIFACT_ROOT = "docs/release/v607/nebula-image-artifacts";
const WRITEABLE_ROOTS = Object.freeze(["docs/release/v607"]);
const BLOCKING_SYNTHETIC_TOKENS = Object.freeze(["synthetic", "fixture", "mock", "fake", "placeholder", "generated-example"]);
const URL_PATTERN = /^https:\/\/[^\s/]+(?:\/[^\s]*)?$/i;
const IMAGE_CONTENT_PATTERN = /^image\/(?:jpeg|jpg|png|webp)$/i;
const PENDING_ISSUES = new Set([
  "source-page-evidence-pending", "license-url-missing", "credit-missing",
  "rights-signoff-pending", "rights-claim-unverified", "network-payload-pending",
]);

export function isIntegrityIssue(code) {
  return !PENDING_ISSUES.has(code);
}

export function readJson(root, relativePath) {
  const absolute = safeWorkspacePath(root, relativePath, { allowMissing: false });
  return JSON.parse(fs.readFileSync(absolute, "utf8"));
}

export async function readJsonAsync(root, relativePath) {
  const absolute = safeWorkspacePath(root, relativePath, { allowMissing: false });
  return JSON.parse(await fsp.readFile(absolute, "utf8"));
}

export function writeJson(root, relativePath, value) {
  const absolute = safeWorkspacePath(root, relativePath, { allowMissing: true });
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  return relativePath;
}

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map((entry) => canonicalize(entry));
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}

export function sha256Bytes(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

export function sha256Json(value) {
  return sha256Bytes(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
}

export function stableJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function isHttpsUrl(value) {
  if (typeof value !== "string" || !URL_PATTERN.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function isNonPlaceholderHttpsUrl(value) {
  if (!isHttpsUrl(value)) return false;
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    const serialized = value.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".invalid") || host.endsWith(".test")) return false;
    return !BLOCKING_SYNTHETIC_TOKENS.some((token) => serialized.includes(token));
  } catch {
    return false;
  }
}

export function safeWorkspacePath(root, relativePath, { allowMissing = true } = {}) {
  if (typeof relativePath !== "string" || !relativePath || relativePath.includes("\\")) {
    throw new Error(`unsafe workspace path: ${String(relativePath)}`);
  }
  if (relativePath.startsWith("/") || /^[A-Za-z]:/.test(relativePath)) throw new Error(`absolute workspace path: ${relativePath}`);
  const normalized = path.posix.normalize(relativePath);
  if (normalized === "." || normalized.startsWith("../") || normalized.includes("/../")) throw new Error(`path escapes workspace: ${relativePath}`);
  const absoluteRoot = path.resolve(root);
  const absolute = path.resolve(absoluteRoot, normalized);
  const relative = path.relative(absoluteRoot, absolute);
  if (relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error(`resolved path escapes workspace: ${relativePath}`);
  if (!allowMissing && !fs.existsSync(absolute)) throw new Error(`missing workspace input: ${relativePath}`);
  return absolute;
}

export function containedPath(root, relativePath, allowedRoots = WRITEABLE_ROOTS) {
  if (typeof relativePath !== "string" || relativePath.includes("\\") || relativePath.includes("\0")) return null;
  if (relativePath.startsWith("/") || /^[A-Za-z]:/.test(relativePath)) return null;
  const target = path.resolve(root, relativePath);
  for (const allowed of allowedRoots) {
    const base = path.resolve(root, allowed);
    const relative = path.relative(base, target);
    if (relative && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)) return target;
  }
  return null;
}

export function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function asString(value) {
  return typeof value === "string" ? value : "";
}

export function intOrNull(value) {
  return Number.isInteger(value) ? value : null;
}

export function isoTime(value) {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

export function durationMs(attempt) {
  const start = Date.parse(asString(attempt?.startedAt));
  const end = Date.parse(asString(attempt?.endedAt));
  return Number.isFinite(start) && Number.isFinite(end) && end >= start ? end - start : null;
}

export function classifyAttempt(attempt) {
  if (!attempt || typeof attempt !== "object") return "malformed";
  if (attempt.responseCaptured === 1 && Number(attempt.httpStatus) >= 200 && Number(attempt.httpStatus) < 300) return "captured";
  if (attempt.timeout === true || attempt.errorClass === "timeout") return "timeout";
  if (String(attempt.errorClass ?? "").startsWith("http")) return "http";
  if (["dns", "tls", "network", "network-not-run", "redirect"].includes(attempt.errorClass)) return "transport";
  if (["content-type", "payload-too-large", "payload"].includes(attempt.errorClass)) return "payload";
  return "pending";
}

export function attemptFingerprint(attempt) {
  return HEX_FINGERPRINT.test(asString(attempt?.requestFingerprint)) ? asString(attempt.requestFingerprint).toLowerCase() : null;
}

export function scanTokens(value, tokens = BLOCKING_SYNTHETIC_TOKENS, pathParts = [], output = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => scanTokens(entry, tokens, [...pathParts, String(index)], output));
    return output;
  }
  if (!value || typeof value !== "object") {
    if (typeof value === "string") {
      const lower = value.toLowerCase();
      for (const token of tokens) if (lower.includes(token)) output.push({ path: pathParts.join("."), token, value });
    }
    return output;
  }
  for (const [key, child] of Object.entries(value)) {
    const lowerKey = key.toLowerCase();
    if (tokens.some((token) => lowerKey.includes(token)) && child === true) output.push({ path: [...pathParts, key].join("."), token: lowerKey, value: child });
    scanTokens(child, tokens, [...pathParts, key], output);
  }
  return output;
}

export function rejectSyntheticEvidence(value, label) {
  const matches = scanTokens(value);
  return matches.map((match) => ({ code: "synthetic-or-fixture-evidence", detail: `${label}.${match.path} contains ${match.token}`, path: match.path }));
}

export function sourceIdentityIssues(row, label) {
  const issues = [];
  const source = row?.source ?? row;
  const sourceUrl = source?.url ?? source?.sourceUrl;
  const licenseUrl = source?.licenseUrl;
  const credit = source?.credit ?? source?.sourceCredit;
  if (!isHttpsUrl(sourceUrl)) issues.push({ code: "source-url-invalid", detail: `${label} source URL is not safe HTTPS` });
  if (!licenseUrl) issues.push({ code: "license-url-missing", detail: `${label} license URL evidence is absent` });
  else if (!isHttpsUrl(licenseUrl)) issues.push({ code: "license-url-invalid", detail: `${label} license URL is not safe HTTPS` });
  if (!asString(credit).trim()) issues.push({ code: "credit-missing", detail: `${label} source credit is absent` });
  issues.push({ code: "source-page-evidence-pending", detail: `${label} source-page capture and item linkage have not been independently verified by this pipeline` });
  return issues;
}

export function requestFingerprintFor(url, scheme) {
  return scheme === "v623" ? sha256Bytes(Buffer.from(`GET ${url} accept=image/jpeg,image/png,image/*`))
    : sha256Json({ method: "GET", url, headers: { accept: "image/jpeg,image/png,image/webp", "user-agent": "SolarSim-MainlineA-R64/1.0" } });
}

export function attemptIssues(attempt, index, label, sourceUrl, scheme = "v624") {
  const issues = [];
  if (!attempt || typeof attempt !== "object") return [{ code: "attempt-shape-invalid", detail: `${label} attempt ${index + 1} is not an object` }];
  if (attempt.attempt !== index + 1) issues.push({ code: "attempt-sequence-invalid", detail: `${label} attempt sequence is not contiguous` });
  if (!isoTime(attempt.startedAt) || !isoTime(attempt.endedAt) || durationMs(attempt) === null) issues.push({ code: "attempt-time-invalid", detail: `${label} attempt timing cannot be replayed` });
  if (!attemptFingerprint(attempt)) issues.push({ code: "request-fingerprint-invalid", detail: `${label} request fingerprint is not SHA-256` });
  if (sourceUrl && (attempt.requestUrl !== sourceUrl || attempt.requestFingerprint !== requestFingerprintFor(sourceUrl, scheme))) issues.push({ code: "request-binding-mismatch", detail: `${label} request URL or recomputed fingerprint differs from source` });
  if (typeof attempt.timeout !== "boolean") issues.push({ code: "timeout-flag-invalid", detail: `${label} timeout flag is not boolean` });
  if (!Number.isInteger(attempt.retryCount) || attempt.retryCount < 0) issues.push({ code: "retry-count-invalid", detail: `${label} retry count is invalid` });
  if (attempt.requestUrl && !isHttpsUrl(attempt.requestUrl)) issues.push({ code: "attempt-url-invalid", detail: `${label} request URL is not HTTPS` });
  if (attempt.finalUrl && !isHttpsUrl(attempt.finalUrl)) issues.push({ code: "final-url-invalid", detail: `${label} final URL is not HTTPS` });
  if (!Array.isArray(attempt.redirectChain)) issues.push({ code: "redirect-chain-invalid", detail: `${label} redirect chain is not an array` });
  for (const redirect of attempt.redirectChain ?? []) if (!isHttpsUrl(redirect)) issues.push({ code: "redirect-url-invalid", detail: `${label} redirect URL is not HTTPS` });
  if (attempt.responseCaptured === 1) {
    if (attempt.timeout || attempt.errorClass !== null || !isHttpsUrl(attempt.finalUrl)) issues.push({ code: "capture-response-contradiction", detail: `${label} capture has an error, timeout, or missing final URL` });
    if (!Number.isInteger(attempt.httpStatus) || attempt.httpStatus < 200 || attempt.httpStatus >= 300) issues.push({ code: "capture-http-status-invalid", detail: `${label} captured response lacks a 2xx status` });
    if (!IMAGE_CONTENT_PATTERN.test(asString(attempt.contentType))) issues.push({ code: "capture-content-type-invalid", detail: `${label} captured content type is not an accepted image` });
    if (!SHA256.test(asString(attempt.rawPageSha256))) issues.push({ code: "capture-sha-invalid", detail: `${label} captured response lacks raw SHA-256` });
  }
  if (attempt.responseCaptured === 0 && (attempt.responseBytes !== null || attempt.rawPageSha256 !== null || attempt.rawArtifactPath !== null)) issues.push({ code: "payload-without-capture", detail: `${label} response metadata is present while responseCaptured=0` });
  if (![0, 1].includes(attempt.responseCaptured)) issues.push({ code: "capture-flag-invalid", detail: `${label} responseCaptured must be 0 or 1` });
  return issues;
}

export function artifactIssues(root, row, label) {
  const issues = [];
  const artifact = row?.network?.artifact;
  const captured = row?.network?.responseCaptured === 1;
  if (!captured && artifact) issues.push({ code: "artifact-without-capture", detail: `${label} artifact is present without captured response` });
  if (!artifact) {
    if (captured) issues.push({ code: "captured-artifact-missing", detail: `${label} captured response has no artifact metadata` });
    return issues;
  }
  const linked = (row.network?.attempts ?? []).some((attempt) => attempt.responseCaptured === 1 && attempt.rawArtifactPath === artifact.path && attempt.rawPageSha256 === artifact.sha256 && attempt.responseBytes === artifact.bytes);
  if (!linked) issues.push({ code: "artifact-attempt-mismatch", detail: `${label} artifact has no matching captured attempt` });
  const artifactPath = containedPath(root, artifact.path, [ARTIFACT_ROOT]);
  if (!artifactPath) {
    issues.push({ code: "artifact-path-outside-root", detail: `${label} artifact path escapes ${ARTIFACT_ROOT}` });
    return issues;
  }
  if (!SHA256.test(asString(artifact.sha256))) issues.push({ code: "artifact-sha-invalid", detail: `${label} artifact SHA-256 is invalid` });
  if (!Number.isInteger(artifact.bytes) || artifact.bytes <= 0) issues.push({ code: "artifact-bytes-invalid", detail: `${label} artifact byte count is invalid` });
  if (!fs.existsSync(artifactPath)) {
    issues.push({ code: "artifact-missing", detail: `${label} artifact file is absent` });
    return issues;
  }
  try {
    const realRoot = fs.realpathSync(path.resolve(root, ARTIFACT_ROOT));
    const realArtifact = fs.realpathSync(artifactPath);
    if (!realArtifact.startsWith(`${realRoot}${path.sep}`)) return [...issues, { code: "artifact-symlink-outside-root", detail: `${label} artifact resolves outside artifact root` }];
    const bytes = fs.readFileSync(realArtifact);
    if (bytes.byteLength !== artifact.bytes) issues.push({ code: "artifact-bytes-mismatch", detail: `${label} artifact byte count differs from receipt` });
    if (SHA256.test(asString(artifact.sha256)) && sha256Bytes(bytes) !== String(artifact.sha256).toLowerCase()) issues.push({ code: "artifact-sha-mismatch", detail: `${label} artifact bytes differ from receipt SHA-256` });
  } catch (error) {
    issues.push({ code: "artifact-read-error", detail: `${label} artifact read failed: ${error.code ?? error.message}` });
  }
  return issues;
}

export function rightsEvidenceAssessment(row, label) {
  const rights = row?.rights ?? row;
  const status = asString(rights?.status || row?.rightsStatus).toLowerCase();
  const blockers = Array.isArray(rights?.blockers) ? rights.blockers : [];
  const signoff = rights?.signoff ?? rights?.approval ?? null;
  const issues = [];
  const claimedCleared = ["cleared", "verified", "approved", "signed-off", "signedoff"].includes(status);
  const claimedSignoff = claimedCleared || signoff !== null;
  if (claimedCleared && blockers.length > 0) issues.push({ code: "rights-claim-contradiction", detail: `${label} claims cleared while blockers remain` });
  if (claimedCleared && (!signoff || typeof signoff !== "object" || !asString(signoff.reviewer) || !isoTime(signoff.signedAt) || !isNonPlaceholderHttpsUrl(signoff.evidenceUrl))) {
    issues.push({ code: "rights-signoff-unverifiable", detail: `${label} rights clearance lacks reviewer, signedAt, and HTTPS evidence URL` });
  }
  if (claimedCleared && signoff && isHttpsUrl(signoff.evidenceUrl) && !isNonPlaceholderHttpsUrl(signoff.evidenceUrl)) issues.push({ code: "rights-signoff-placeholder", detail: `${label} rights signoff evidence URL is a placeholder or synthetic host` });
  if (claimedCleared && signoff && BLOCKING_SYNTHETIC_TOKENS.some((token) => asString(signoff.reviewer).toLowerCase().includes(token))) issues.push({ code: "rights-signoff-placeholder", detail: `${label} rights reviewer identity is a placeholder` });
  issues.push({ code: "rights-signoff-pending", detail: `${label} trusted item-level rights signoff has not been supplied to this pipeline` });
  if (claimedSignoff) issues.push({ code: "rights-claim-unverified", detail: `${label} a declared signoff is retained as an unverified claim requiring independent item-level review` });
  if (status === "pending" && !blockers.includes("item-rights-review-pending")) issues.push({ code: "rights-pending-blocker-missing", detail: `${label} pending rights lacks explicit item-rights-review-pending blocker` });
  if (rights?.copyrightApproval === true) issues.push({ code: "copyright-approval-forbidden", detail: `${label} local receipt cannot self-approve copyright` });
  return { status, claimedCleared, claimedSignoff, rightsCleared: false, issues };
}

export function rowBoundaryIssues(row, label, inherited = BOUNDARY) {
  const issues = [];
  for (const [key, expected] of Object.entries(BOUNDARY)) {
    const layers = [inherited, row, row?.boundary].filter((layer) => layer && typeof layer === "object");
    for (const layer of layers) {
      if (Object.prototype.hasOwnProperty.call(layer, key) && layer[key] !== expected) {
        issues.push({ code: `boundary-${key}-invalid`, detail: `${label} explicit ${key} violates the candidate boundary` });
      }
    }
  }
  for (const [key, expected] of [["runtimeAdmission", "candidate-only"], ["measurementAdmission", "not-admitted"]]) {
    for (const layer of [row, row?.boundary]) {
      if (Object.prototype.hasOwnProperty.call(layer ?? {}, key) && layer[key] !== expected) issues.push({ code: `${key}-open`, detail: `${label} explicit ${key} must remain ${expected}` });
    }
  }
  return issues;
}

export function boundaryIssues(value, label) {
  const boundary = value?.boundary ?? value;
  const issues = [];
  const requiredKeys = ["candidateOnly", "hold", "notAdmitted", "scientificPayloadWriteback"];
  for (const key of requiredKeys) {
    const expected = BOUNDARY[key];
    if (boundary?.[key] !== expected) issues.push({ code: `boundary-${key}-invalid`, detail: `${label} boundary ${key} must equal ${String(expected)}` });
  }
  for (const key of ["runtimeWrites", "measurementWrites"]) {
    if (Object.prototype.hasOwnProperty.call(boundary ?? {}, key) && boundary[key] !== BOUNDARY[key]) {
      issues.push({ code: `boundary-${key}-invalid`, detail: `${label} boundary ${key} must equal ${String(BOUNDARY[key])}` });
    }
  }
  if (Object.prototype.hasOwnProperty.call(value ?? {}, "scientificPayloadWriteback") && value.scientificPayloadWriteback !== false) issues.push({ code: "scientific-writeback-open", detail: `${label} scientificPayloadWriteback must be false` });
  if (Object.prototype.hasOwnProperty.call(value ?? {}, "runtimeAdmission") && value.runtimeAdmission !== "candidate-only") issues.push({ code: "runtime-admission-open", detail: `${label} runtimeAdmission must remain candidate-only` });
  if (Object.prototype.hasOwnProperty.call(value ?? {}, "measurementAdmission") && value.measurementAdmission !== "not-admitted") issues.push({ code: "measurement-admission-open", detail: `${label} measurementAdmission must remain not-admitted` });
  return issues;
}

export function batchRowAssessment(root, row, index, inherited = BOUNDARY) {
  const label = `batch.rows[${index}](${asString(row?.id) || "unknown"})`;
  const issues = [];
  if (!row || typeof row !== "object") return { id: null, source: "batch", status: "blocked", issues: [{ code: "row-shape-invalid", detail: `${label} is not an object` }] };
  if (!asString(row.id)) issues.push({ code: "id-missing", detail: `${label} id missing` });
  issues.push(...sourceIdentityIssues(row, label));
  issues.push(...rowBoundaryIssues(row, label, inherited));
  issues.push(...rejectSyntheticEvidence(row, label));
  const attempts = row.network?.attempts;
  if (!Array.isArray(attempts) || attempts.length === 0) issues.push({ code: "attempt-ledger-empty", detail: `${label} has no attempts` });
  for (let attemptIndex = 0; attemptIndex < (attempts?.length ?? 0); attemptIndex += 1) issues.push(...attemptIssues(attempts[attemptIndex], attemptIndex, label, row.source?.url, "v624"));
  issues.push(...artifactIssues(root, row, label));
  const rights = rightsEvidenceAssessment(row, label);
  issues.push(...rights.issues);
  if (row.network?.responseCaptured === 1 && row.network?.status !== "captured") issues.push({ code: "capture-status-contradiction", detail: `${label} responseCaptured=1 but network status is not captured` });
  if (row.network?.responseCaptured === 0 && row.network?.artifact) issues.push({ code: "artifact-capture-contradiction", detail: `${label} responseCaptured=0 with artifact` });
  const hard = issues.some((issue) => isIntegrityIssue(issue.code));
  return { id: asString(row.id), source: "batch", status: hard ? "blocked" : "pending", responseCaptured: row.network?.responseCaptured === 1, rightsStatus: "pending", declaredRightsStatus: rights.status || "unknown", claimedSignoff: rights.claimedSignoff, rightsCleared: false, sourceClosed: false, artifactVerified: row.network?.responseCaptured === 1 && Boolean(row.network?.artifact) && !issues.some((issue) => issue.code.startsWith("artifact-") || issue.code.startsWith("capture")), issues };
}

export function ledgerRecordAssessment(record, index, inherited = BOUNDARY) {
  const label = `ledger.records[${index}](${asString(record?.id) || "unknown"})`;
  const issues = [];
  if (!record || typeof record !== "object") return { id: null, source: "ledger", status: "blocked", issues: [{ code: "record-shape-invalid", detail: `${label} is not an object` }] };
  if (!asString(record.id) || record.id !== record.candidateId) issues.push({ code: "id-mismatch", detail: `${label} id and candidateId differ` });
  issues.push(...sourceIdentityIssues(record, label));
  issues.push(...rowBoundaryIssues(record, label, inherited));
  issues.push(...rejectSyntheticEvidence(record, label));
  if (!Array.isArray(record.attempts) || record.attempts.length === 0) issues.push({ code: "attempt-ledger-empty", detail: `${label} has no attempts` });
  for (let attemptIndex = 0; attemptIndex < (record.attempts?.length ?? 0); attemptIndex += 1) issues.push(...attemptIssues(record.attempts[attemptIndex], attemptIndex, label, record.sourceUrl, "v623"));
  if (record.responseCaptured !== 0) issues.push({ code: "ledger-response-captured", detail: `${label} ledger responseCaptured must remain 0 in this offline seed` });
  if (record.payload?.bytes !== null || record.payload?.sha256 !== null || record.payload?.width !== null || record.payload?.height !== null) issues.push({ code: "ledger-payload-present", detail: `${label} payload fields must remain null while responseCaptured=0` });
  const rights = rightsEvidenceAssessment(record, label);
  issues.push(...rights.issues);
  const hard = issues.some((issue) => isIntegrityIssue(issue.code));
  return { id: asString(record.id), source: "ledger", status: hard ? "blocked" : "pending", responseCaptured: false, rightsStatus: "pending", declaredRightsStatus: asString(record.rightsStatus) || "review-pending", claimedSignoff: rights.claimedSignoff, rightsCleared: false, sourceClosed: false, artifactVerified: false, issues };
}

export function rosterIssues(batch, ledger) {
  const issues = [];
  if (batch?.schema !== BATCH_SCHEMA) issues.push({ code: "batch-schema-invalid", detail: `expected ${BATCH_SCHEMA}` });
  if (ledger?.schema !== LEDGER_SCHEMA) issues.push({ code: "ledger-schema-invalid", detail: `expected ${LEDGER_SCHEMA}` });
  if (!Array.isArray(batch?.rows)) issues.push({ code: "batch-rows-invalid", detail: "batch rows must be an array" });
  if (!Array.isArray(ledger?.records)) issues.push({ code: "ledger-records-invalid", detail: "ledger records must be an array" });
  const batchIds = batch?.rows?.map((row) => row?.id) ?? [];
  const ledgerIds = ledger?.records?.map((record) => record?.id) ?? [];
  const all = [...batchIds, ...ledgerIds];
  for (const id of ROSTER) if (!all.includes(id)) issues.push({ code: "roster-missing", detail: `${id} is absent from batch and ledger` });
  for (const id of all) if (!ROSTER.includes(id)) issues.push({ code: "roster-unexpected", detail: `${id} is not part of the twelve-item closure roster` });
  if (new Set(batchIds).size !== batchIds.length) issues.push({ code: "batch-duplicate-id", detail: "batch contains duplicate ids" });
  if (new Set(ledgerIds).size !== ledgerIds.length) issues.push({ code: "ledger-duplicate-id", detail: "ledger contains duplicate ids" });
  if (batchIds.some((id) => LEDGER_IDS.includes(id))) issues.push({ code: "batch-ledger-overlap", detail: "batch contains ids reserved for the offline ledger" });
  if (ledgerIds.some((id) => CAPTURED_IDS.includes(id))) issues.push({ code: "ledger-batch-overlap", detail: "ledger contains ids reserved for the captured batch" });
  return issues;
}

export function reconcileIssues(batch, ledger) {
  const issues = [];
  for (const row of batch?.rows ?? []) {
    if (row.network?.responseCaptured === 1 && !row.network?.artifact) issues.push({ code: "captured-without-artifact", detail: `${row.id} captured response lacks artifact` });
    if (row.rights?.status === "cleared" && !(row.rights?.signoff || row.rights?.approval)) issues.push({ code: "rights-cleared-without-signoff", detail: `${row.id} claims clear without signoff object` });
  }
  for (const record of ledger?.records ?? []) {
    if (record.responseCaptured === 0 && record.payload?.bytes !== null) issues.push({ code: "ledger-response-payload-mismatch", detail: `${record.id} has payload bytes while not captured` });
  }
  return issues;
}

export function summarizeAssessments(assessments) {
  const statuses = { ready: 0, pending: 0, blocked: 0 };
  const sources = { batch: 0, ledger: 0 };
  const captured = { yes: 0, no: 0 };
  const rights = { cleared: 0, pending: 0 };
  const artifacts = { verified: 0, missingOrInvalid: 0 };
  for (const assessment of assessments) {
    statuses[assessment.status] = (statuses[assessment.status] ?? 0) + 1;
    sources[assessment.source] = (sources[assessment.source] ?? 0) + 1;
    captured[assessment.responseCaptured ? "yes" : "no"] += 1;
    rights[assessment.rightsCleared ? "cleared" : "pending"] += 1;
    artifacts[assessment.artifactVerified ? "verified" : "missingOrInvalid"] += 1;
  }
  return { total: assessments.length, statuses, sources, captured, rights, artifacts, ready: statuses.ready === assessments.length && assessments.length > 0 };
}

export function issueCounts(issues) {
  const counts = {};
  for (const issue of issues) counts[issue.code] = (counts[issue.code] ?? 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

export function rowDigest(assessment) {
  const { fingerprint: ignored, ...projection } = assessment;
  void ignored;
  return sha256Json(projection);
}

export function makeJsonl(assessments) {
  return `${assessments.map((assessment) => JSON.stringify({ ...assessment, fingerprint: rowDigest(assessment), issueCodes: unique(assessment.issues.map((issue) => issue.code)) })).join("\n")}\n`;
}

export function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export function makeCsv(assessments) {
  const rows = ["id,source,status,responseCaptured,rightsStatus,rightsCleared,sourceClosed,artifactVerified,issues,fingerprint"];
  for (const assessment of assessments) rows.push([assessment.id, assessment.source, assessment.status, assessment.responseCaptured ? 1 : 0, assessment.rightsStatus, assessment.rightsCleared ? 1 : 0, assessment.sourceClosed ? 1 : 0, assessment.artifactVerified ? 1 : 0, assessment.issues.map((issue) => issue.code).join("|"), rowDigest(assessment)].map(csvCell).join(","));
  return `${rows.join("\n")}\n`;
}

export function makeMarkdown(receipt) {
  const lines = [
    "# Mainline A Nebula Rights Closure v627",
    "",
    `- status: ${receipt.status}`,
    `- source closure: ${receipt.gates.sourceClosure.status}`,
    `- rights closure: ${receipt.gates.rightsClosure.status}`,
    `- artifact closure: ${receipt.gates.artifactClosure.status}`,
    `- response captured: ${receipt.counts.responseCaptured}`,
    `- rights cleared: ${receipt.counts.rightsCleared}`,
    `- evidence class: ${receipt.evidenceClass}`,
    "",
    "| id | input | status | captured | rights | blockers |",
    "| --- | --- | --- | ---: | --- | --- |",
  ];
  for (const row of receipt.rows) lines.push(`| ${row.id} | ${row.source} | ${row.status} | ${row.responseCaptured ? 1 : 0} | ${row.rightsStatus} | ${row.issues.map((issue) => issue.code).join("; ") || "—"} |`);
  lines.push("", "This report is a static ledger projection. It does not grant copyright, prove scientific validity, or admit runtime assets.", "");
  return lines.join("\n");
}

export function gate(id, status, required, observed, blockers, evidenceClass = "static") {
  return { id, status, required, observed, blockers: unique(blockers), evidenceClass };
}

export function createReceipt({ root = ROOT, batch, ledger, batchBytes, ledgerBytes, runId = "r64-v627" } = {}) {
  const roster = rosterIssues(batch, ledger);
  const inputBoundaryIssues = [
    ...boundaryIssues(batch, "batch"),
    ...boundaryIssues(ledger, "ledger"),
  ];
  const batchAssessments = (batch?.rows ?? []).map((row, index) => batchRowAssessment(root, row, index, batch.boundary));
  const ledgerAssessments = (ledger?.records ?? []).map((record, index) => ledgerRecordAssessment(record, index, ledger.boundary));
  const reconciliation = reconcileIssues(batch, ledger);
  const rows = [...batchAssessments, ...ledgerAssessments];
  const allIssues = [...roster, ...inputBoundaryIssues, ...reconciliation, ...rows.flatMap((row) => row.issues)];
  const summary = summarizeAssessments(rows);
  const issueMap = issueCounts(allIssues);
  const hardIssues = allIssues.filter((issue) => isIntegrityIssue(issue.code));
  const pendingIssues = allIssues.filter((issue) => !isIntegrityIssue(issue.code));
  const sourceReady = rows.length === ROSTER.length && rows.every((row) => row.sourceClosed);
  const artifactReady = rows.length === ROSTER.length && rows.every((row) => row.artifactVerified);
  const rightsReady = rows.length === ROSTER.length && rows.every((row) => row.rightsCleared);
  const sourceBlockers = allIssues.filter((issue) => ["source-page-evidence-pending", "license-url-missing", "source-url-invalid", "license-url-invalid", "credit-missing", "attempt-time-invalid", "request-fingerprint-invalid", "final-url-invalid", "redirect-url-invalid", "attempt-url-invalid"].includes(issue.code)).map((issue) => issue.code);
  const artifactBlockers = allIssues.filter((issue) => issue.code.startsWith("artifact-") || issue.code === "captured-without-artifact").map((issue) => issue.code);
  const rightsBlockers = allIssues.filter((issue) => issue.code.startsWith("rights-") || issue.code === "copyright-approval-forbidden").map((issue) => issue.code);
  const status = hardIssues.length > 0 ? "blocked" : pendingIssues.length > 0 || !rightsReady ? "pending" : "ready";
  const receipt = {
    schema: CLOSURE_SCHEMA,
    version: 627,
    runId,
    generatedAt: new Date().toISOString(),
    status,
    source: {
      batch: { path: BATCH_PATH, schema: batch?.schema ?? null, sha256: sha256Bytes(batchBytes ?? Buffer.from("")), rows: batch?.rows?.length ?? 0 },
      ledger: { path: LEDGER_PATH, schema: ledger?.schema ?? null, sha256: sha256Bytes(ledgerBytes ?? Buffer.from("")), records: ledger?.records?.length ?? 0 },
    },
    counts: {
      roster: ROSTER.length,
      rows: rows.length,
      batchRows: summary.sources.batch,
      ledgerRecords: summary.sources.ledger,
      responseCaptured: summary.captured.yes,
      responsePending: summary.captured.no,
      rightsCleared: summary.rights.cleared,
      rightsPending: summary.rights.pending,
      artifactsVerified: summary.artifacts.verified,
      artifactsMissingOrInvalid: summary.artifacts.missingOrInvalid,
      issueCount: allIssues.length,
      hardIssueCount: hardIssues.length,
    },
    gates: {
      sourceClosure: gate("source-closure", sourceReady ? "pass" : hardIssues.length ? "blocked" : "pending", ROSTER.length, rows.filter((row) => row.sourceClosed).length, sourceBlockers, "external-source"),
      artifactClosure: gate("artifact-closure", artifactReady ? "pass" : hardIssues.some((issue) => issue.code.startsWith("artifact-")) ? "blocked" : "pending", ROSTER.length, rows.filter((row) => row.artifactVerified).length, artifactBlockers.length ? artifactBlockers : artifactReady ? [] : ["network-payload-pending"], "artifact"),
      rightsClosure: gate("rights-closure", rightsReady ? "pass" : hardIssues.some((issue) => issue.code.startsWith("rights-") || issue.code === "copyright-approval-forbidden") ? "blocked" : "hold", ROSTER.length, summary.rights.cleared, rightsBlockers.length ? rightsBlockers : ["rights-signoff-pending"], "external-source"),
      runtimeAdmission: gate("runtime-admission", "closed", 0, 0, ["candidate-only", "not-admitted"], "static"),
      scientificWriteback: gate("scientific-payload-writeback", "closed", 0, 0, ["scientificPayloadWriteback=false"], "static"),
    },
    issueCounts: issueMap,
    rows: rows.map((row) => ({ ...row, fingerprint: rowDigest(row) })),
    blockers: unique(allIssues.map((issue) => issue.code)),
    boundary: { ...BOUNDARY },
    evidenceClass: "static-external-source-ledger-artifact-rights-projection",
    claims: {
      sourceAuthenticity: "not-established-by-local-ledger-alone",
      copyrightApproval: false,
      scientificValidity: false,
      productionPerformance: false,
      realUserValidation: false,
      runtimePayloadWriteback: false,
    },
    replay: {
      deterministicInputDigest: sha256Json({ batch: batch ?? null, ledger: ledger ?? null }),
      outputDigest: null,
      jsonl: DEFAULT_JSONL,
      csv: DEFAULT_CSV,
      markdown: DEFAULT_MARKDOWN,
    },
  };
  receipt.replay.outputDigest = sha256Json({ ...receipt, replay: { ...receipt.replay, outputDigest: null } });
  return receipt;
}

export function assertReceiptBoundary(receipt) {
  const issues = boundaryIssues(receipt, "receipt");
  if (receipt?.claims?.copyrightApproval !== false) issues.push({ code: "copyright-approval-open", detail: "receipt cannot approve copyright" });
  if (receipt?.claims?.runtimePayloadWriteback !== false) issues.push({ code: "runtime-payload-writeback-open", detail: "receipt cannot write scientific payload" });
  if (receipt?.status === "ready" && receipt?.counts?.rightsCleared !== receipt?.counts?.rows) issues.push({ code: "ready-rights-count-mismatch", detail: "ready receipt must clear every row" });
  if (receipt?.counts?.rightsCleared !== 0 || receipt?.rows?.some((row) => row.rightsCleared !== false)) issues.push({ code: "rights-promotion-forbidden", detail: "this pipeline has no trusted item-level signoff input" });
  return issues;
}

export function closureProjection(receipt) {
  return stableJson({ schema: receipt.schema, version: receipt.version, status: receipt.status, source: receipt.source, counts: receipt.counts, gates: receipt.gates, issueCounts: receipt.issueCounts, blockers: receipt.blockers, rows: receipt.rows, boundary: receipt.boundary, evidenceClass: receipt.evidenceClass, claims: receipt.claims });
}

export function verifyReceiptShape(receipt) {
  const issues = [];
  if (receipt?.schema !== CLOSURE_SCHEMA) issues.push({ code: "receipt-schema-invalid", detail: "closure receipt schema mismatch" });
  if (!Number.isInteger(receipt?.version) || receipt.version !== 627) issues.push({ code: "receipt-version-invalid", detail: "closure receipt version mismatch" });
  if (!["ready", "pending", "blocked"].includes(receipt?.status)) issues.push({ code: "receipt-status-invalid", detail: "closure receipt status invalid" });
  if (!Array.isArray(receipt?.rows)) issues.push({ code: "receipt-rows-invalid", detail: "closure receipt rows missing" });
  if (receipt?.rows?.length !== ROSTER.length) issues.push({ code: "receipt-row-count-invalid", detail: "closure receipt row count mismatch" });
  for (const row of receipt?.rows ?? []) {
    if (!ROSTER.includes(row.id)) issues.push({ code: "receipt-row-id-invalid", detail: `${row.id} not in canonical roster` });
    if (row.source !== "batch" && row.source !== "ledger") issues.push({ code: "receipt-row-source-invalid", detail: `${row.id} has invalid source` });
    if (row.status === "ready" && row.issues?.length) issues.push({ code: "receipt-ready-with-issues", detail: `${row.id} ready row has issues` });
  }
  issues.push(...assertReceiptBoundary(receipt));
  return unique(issues.map((issue) => issue.code)).map((code) => ({ code, detail: "receipt shape or boundary validation failed" }));
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = { root: ROOT, batch: BATCH_PATH, ledger: LEDGER_PATH, output: DEFAULT_OUTPUT, jsonl: DEFAULT_JSONL, csv: DEFAULT_CSV, markdown: DEFAULT_MARKDOWN, check: false, noWrite: false, runId: "r64-v627" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--check") args.check = true;
    else if (arg === "--json") args.json = true;
    else if (arg === "--no-write") args.noWrite = true;
    else if (["--root", "--batch", "--ledger", "--output", "--jsonl", "--csv", "--markdown", "--run-id"].includes(arg)) {
      const value = argv[index + 1];
      if (!value) throw new Error(`${arg} requires a value`);
      index += 1;
      if (arg === "--root") args.root = path.resolve(value);
      else if (arg === "--batch") args.batch = value;
      else if (arg === "--ledger") args.ledger = value;
      else if (arg === "--output") args.output = value;
      else if (arg === "--jsonl") args.jsonl = value;
      else if (arg === "--csv") args.csv = value;
      else if (arg === "--markdown") args.markdown = value;
      else if (arg === "--run-id") args.runId = value;
    } else throw new Error(`unknown argument: ${arg}`);
  }
  if (args.check) args.noWrite = true;
  return args;
}

export async function buildClosure({ root = ROOT, batchPath = BATCH_PATH, ledgerPath = LEDGER_PATH, runId = "r64-v627" } = {}) {
  const batchAbsolute = safeWorkspacePath(root, batchPath, { allowMissing: false });
  const ledgerAbsolute = safeWorkspacePath(root, ledgerPath, { allowMissing: false });
  const [batchBytes, ledgerBytes] = await Promise.all([fsp.readFile(batchAbsolute), fsp.readFile(ledgerAbsolute)]);
  const batch = JSON.parse(batchBytes.toString("utf8"));
  const ledger = JSON.parse(ledgerBytes.toString("utf8"));
  const receipt = createReceipt({ root, batch, ledger, batchBytes, ledgerBytes, runId });
  const shapeIssues = verifyReceiptShape(receipt);
  if (shapeIssues.length) throw new Error(`v627 closure cannot be built: ${shapeIssues.map((issue) => issue.code).join(",")}`);
  return { receipt, batch, ledger, batchBytes, ledgerBytes };
}

export async function writeClosureOutputs({ root = ROOT, output = DEFAULT_OUTPUT, jsonl = DEFAULT_JSONL, csv = DEFAULT_CSV, markdown = DEFAULT_MARKDOWN, receipt, refuseOverwrite = true } = {}) {
  const paths = [output, jsonl, csv, markdown];
  for (const relative of paths) {
    if (!containedPath(root, relative, WRITEABLE_ROOTS)) throw new Error(`output path outside next-web release area: ${relative}`);
    if (refuseOverwrite && fs.existsSync(path.resolve(root, relative))) throw new Error(`refusing to overwrite existing receipt: ${relative}`);
  }
  writeJson(root, output, receipt);
  const rows = receipt.rows;
  fs.writeFileSync(safeWorkspacePath(root, jsonl), makeJsonl(rows), "utf8");
  fs.writeFileSync(safeWorkspacePath(root, csv), makeCsv(rows), "utf8");
  fs.writeFileSync(safeWorkspacePath(root, markdown), makeMarkdown(receipt), "utf8");
  return paths;
}

export async function checkClosure({ root = ROOT, output = DEFAULT_OUTPUT, jsonl = DEFAULT_JSONL, csv = DEFAULT_CSV, markdown = DEFAULT_MARKDOWN } = {}) {
  const receipt = await readJsonAsync(root, output);
  const shapeIssues = verifyReceiptShape(receipt);
  if (shapeIssues.length) throw new Error(`v627 receipt shape invalid: ${shapeIssues.map((issue) => issue.code).join(",")}`);
  const rows = receipt.rows;
  const expectedJsonl = makeJsonl(rows);
  const expectedCsv = makeCsv(rows);
  const expectedMarkdown = makeMarkdown(receipt);
  const checks = [
    [jsonl, expectedJsonl],
    [csv, expectedCsv],
    [markdown, expectedMarkdown],
  ];
  for (const [relative, expected] of checks) {
    const actual = await fsp.readFile(safeWorkspacePath(root, relative), "utf8");
    if (actual !== expected) throw new Error(`v627 sidecar stale: ${relative}`);
  }
  const built = await buildClosure({ root });
  if (built.receipt.source.batch.sha256 !== receipt.source.batch.sha256 || built.receipt.source.ledger.sha256 !== receipt.source.ledger.sha256) throw new Error("v627 source inputs changed since receipt");
  if (receipt.replay?.deterministicInputDigest !== built.receipt.replay?.deterministicInputDigest) throw new Error("v627 deterministic input digest changed");
  if (closureProjection(built.receipt) !== closureProjection(receipt)) throw new Error("v627 recomputed closure projection differs from receipt");
  if (receipt.replay?.outputDigest !== sha256Json({ ...receipt, replay: { ...receipt.replay, outputDigest: null } })) throw new Error("v627 output digest mismatch");
  return { status: receipt.status, output, counts: receipt.counts, blockers: receipt.blockers, inputDigest: receipt.replay.deterministicInputDigest };
}

export async function run(args = parseArgs()) {
  if (args.check) return checkClosure(args);
  const built = await buildClosure({ root: args.root, batchPath: args.batch, ledgerPath: args.ledger, runId: args.runId });
  if (!args.noWrite) await writeClosureOutputs({ root: args.root, output: args.output, jsonl: args.jsonl, csv: args.csv, markdown: args.markdown, receipt: built.receipt, refuseOverwrite: true });
  return { status: built.receipt.status, output: args.output, jsonl: args.jsonl, csv: args.csv, markdown: args.markdown, counts: built.receipt.counts, gates: built.receipt.gates, blockers: built.receipt.blockers, noWrite: args.noWrite };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run()
    .then((result) => { console.log(JSON.stringify(result, null, 2)); if (result.status === "blocked") process.exitCode = 1; })
    .catch((error) => { console.error(error.stack ?? error.message); process.exitCode = 1; });
}

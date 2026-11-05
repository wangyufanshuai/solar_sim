import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const SCHEMA = "mainline-a-source-rights-ledger-v629";
export const STELLAR_PACK = "app/data/mainlineABetaStellarStructuredCandidateV621.generated.json";
export const STELLAR_ATTEMPTS = "app/data/mainlineABetaStellarRawAttemptLedgerV620.generated.json";
export const NEBULA_BATCH = "app/data/mainlineANebulaBatchV628.generated.json";
export const RECEIPT = "docs/release/v607/mainline-a-source-rights-ledger-v629.json";
export const JSONL_RECEIPT = "docs/release/v607/mainline-a-source-rights-ledger-v629.jsonl";

const SHA = /^[a-f0-9]{64}$/i;
const NEBULA_IMAGE_HOST = "images-assets.nasa.gov";
const NASA_PAGE_SUFFIX = ".nasa.gov";
const FAILURE_CLASSES = new Set(["timeout", "dns", "tls", "http", "content-type", "payload", "unknown", "network-not-run"]);
const RIGHTS_STATUSES = new Set(["pending", "verified", "rejected"]);
const SIGNOFF_STATUSES = new Set(["pending", "signed", "rejected"]);
const FORBIDDEN_MARKERS = /(?:fixture|mock|placeholder|synthetic|example)/i;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}

export function digest(value) {
  return sha256(JSON.stringify(canonicalize(value)));
}

export function parseJson(root, relativePath) {
  const absolute = path.resolve(root, relativePath);
  assert(fs.existsSync(absolute), `input-missing:${relativePath}`);
  return JSON.parse(fs.readFileSync(absolute, "utf8"));
}

export function safeRelativePath(value, prefix = "docs/release/") {
  if (!hasText(value)) return false;
  const normalized = value.replaceAll("\\", "/");
  if (!normalized.startsWith(prefix) || normalized.includes(":")) return false;
  if (normalized.split("/").some((part) => !part || part === "." || part === ".." || /[\u0000-\u001f%]/.test(part))) return false;
  return true;
}

export function safeHttps(value, allowedHosts = null) {
  if (!hasText(value)) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.hash) return false;
    if (!allowedHosts) return true;
    const host = url.hostname.toLocaleLowerCase();
    return [...allowedHosts].some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
  } catch {
    return false;
  }
}

export function sourceKind(url) {
  if (!hasText(url)) return "missing";
  try {
    const host = new URL(url).hostname.toLocaleLowerCase();
    if (host === "simbad.cds.unistra.fr") return "simbad";
    if (host === "vizier.cds.unistra.fr" || host === "cds.unistra.fr") return "cds-catalog";
    if (host === NEBULA_IMAGE_HOST) return "nasa-image";
    if (host === "nasa.gov" || host.endsWith(NASA_PAGE_SUFFIX)) return "nasa-policy-or-page";
    return "external";
  } catch {
    return "invalid";
  }
}

export function validDate(value) {
  if (!hasText(value)) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
}

export function validFingerprint(value) {
  return SHA.test(value ?? "");
}

export function validRequestFingerprint(value) {
  if (validFingerprint(value)) return true;
  return typeof value === "string" && /^GET https:\/\/[^\s]+(?:\s+transport=[a-z-]+)?$/i.test(value.trim());
}

export function classifyAttempt(entry, id = "unknown") {
  const issues = [];
  const attempt = Number.isSafeInteger(entry?.attempt) ? entry.attempt : null;
  const retryCount = Number.isSafeInteger(entry?.retryCount) ? entry.retryCount : null;
  const perCollection = entry?.retryScope === "per-collection";
  const runAttempt = Number.isSafeInteger(entry?.runAttempt) ? entry.runAttempt : null;
  const captured = entry?.responseCaptured === 1 || entry?.responseCaptured === true;
  if (attempt === null || attempt < 1) issues.push("attempt-number-invalid");
  if (entry?.retryScope != null && !["per-collection", "legacy-unclassified"].includes(entry.retryScope)) issues.push("retry-scope-invalid");
  if (perCollection) {
    if (!hasText(entry.collectionId) || entry.collectionId.trim() !== entry.collectionId || /[\u0000-\u001f\u007f]/.test(entry.collectionId)) issues.push("collection-id-invalid");
    if (runAttempt === null || runAttempt < 1 || (attempt !== null && runAttempt > attempt)) issues.push("run-attempt-number-invalid");
  }
  const retryAttempt = perCollection ? runAttempt : attempt;
  if (retryCount === null || retryCount < 0 || retryAttempt === null || retryCount !== retryAttempt - 1) issues.push("retry-count-invalid");
  if (!validDate(entry?.startedAt) || !validDate(entry?.endedAt)) issues.push("attempt-time-invalid");
  if (entry?.endedAt && entry?.startedAt && Date.parse(entry.endedAt) < Date.parse(entry.startedAt)) issues.push("attempt-time-order-invalid");
  if (!validRequestFingerprint(entry?.requestFingerprint)) issues.push("request-fingerprint-invalid");
  if (!safeHttps(entry?.requestUrl)) issues.push("request-url-invalid");
  if (!Array.isArray(entry?.redirectChain)) issues.push("redirect-chain-invalid");
  if (Array.isArray(entry?.redirectChain) && entry.redirectChain.some((url) => !safeHttps(url))) issues.push("redirect-url-invalid");
  if (captured) {
    if (entry.timeout === true) issues.push("captured-timeout-conflict");
    if (entry.httpStatus !== 200) issues.push("captured-status-invalid");
    if (!hasText(entry.contentType)) issues.push("captured-content-type-missing");
    if (!Number.isSafeInteger(entry.responseBytes) || entry.responseBytes <= 0) issues.push("captured-byte-count-invalid");
    if (!validFingerprint(entry.rawArtifactSha256 ?? entry.rawPageSha256)) issues.push("captured-artifact-sha-invalid");
    if (!safeRelativePath(entry.rawArtifactPath, "docs/release/")) issues.push("captured-artifact-path-invalid");
    if (entry.errorClass !== null && entry.errorClass !== undefined) issues.push("captured-error-present");
  } else {
    if (entry.rawArtifactPath || entry.rawArtifactSha256 || entry.rawPageSha256) issues.push("failed-attempt-artifact-present");
    if (entry.responseBytes !== null && entry.responseBytes !== undefined) issues.push("failed-attempt-byte-count-present");
    if (entry.errorClass !== null && !FAILURE_CLASSES.has(entry.errorClass)) issues.push("failed-error-class-invalid");
    if (entry.timeout !== true && !hasText(entry.errorClass) && entry.httpStatus === null) issues.push("failed-attempt-reason-missing");
  }
  return Object.freeze({ id, attempt, captured, issues: Object.freeze(issues) });
}

export function auditAttempts(record, id = record?.id ?? "unknown") {
  const attempts = Array.isArray(record?.attemptLedger) ? record.attemptLedger : Array.isArray(record?.attempts) ? record.attempts : [];
  const rows = attempts.map((entry) => classifyAttempt(entry, id));
  const captures = rows.filter((row) => row.captured);
  const issues = rows.flatMap((row) => row.issues);
  const collectionAttempts = new Map();
  for (const [index, entry] of attempts.entries()) {
    if (entry?.attempt !== index + 1) issues.push(`${id}:attempt-sequence-invalid`);
    if (entry?.retryScope !== "per-collection" || !hasText(entry.collectionId)) continue;
    const expected = (collectionAttempts.get(entry.collectionId) ?? 0) + 1;
    if (entry.runAttempt !== expected) issues.push(`${id}:collection-attempt-sequence-invalid`);
    collectionAttempts.set(entry.collectionId, expected);
  }
  if (attempts.length === 0) issues.push(`${id}:attempt-ledger-empty`);
  if (captures.length > 1) issues.push(`${id}:multiple-captured-attempts`);
  if (record?.responseCaptured === 0 && captures.length > 0) issues.push(`${id}:record-capture-flag-conflict`);
  if (record?.responseCaptured === 1 && captures.length === 0) issues.push(`${id}:record-capture-missing`);
  return Object.freeze({ id, attempts: attempts.length, captures: captures.length, retries: attempts.reduce((sum, row) => sum + (Number.isSafeInteger(row.retryCount) ? row.retryCount : 0), 0), timeouts: attempts.filter((entry) => entry.timeout === true || entry.errorClass === "timeout").length, captured: captures.length === 1, issues: Object.freeze(issues), rows: Object.freeze(rows) });
}

function stellarRecordBoundary(record) {
  const issues = [];
  if (record?.decision !== "hold") issues.push("decision-opened");
  if (record?.runtimeAdmission !== "candidate-only") issues.push("runtime-admission-opened");
  if (record?.measurementAdmission !== "not-admitted") issues.push("measurement-admission-opened");
  if (record?.scientificPayloadWriteback !== false) issues.push("scientific-writeback-opened");
  if (record?.componentIdentityStatus === "confirmed") issues.push("component-confirmation-opened");
  if (record?.componentSourceReference !== null) issues.push("component-source-reference-opened");
  return issues;
}

export function auditStellarSourceRecord(record, attemptRecord = null) {
  const id = record?.id ?? "unknown";
  const issues = [...stellarRecordBoundary(record)];
  const sourceUrl = record?.sourceLedger?.sourceUrl;
  if (!safeHttps(sourceUrl, new Set(["simbad.cds.unistra.fr"]))) issues.push("source-url-invalid");
  if (!SHA.test(record?.rawPageSha256 ?? "")) issues.push("raw-hash-invalid");
  if (record?.sourceLedger?.rawPageSha256 !== record?.rawPageSha256) issues.push("source-hash-mismatch");
  if (record?.sourceLedger?.citationStatus !== "pending") issues.push("citation-status-opened");
  if (record?.sourceLedger?.citationStatus === "pending") issues.push("citation-review-pending");
  if (record?.sourceLedger?.rightsStatus !== "odbl-attribution-required") issues.push("rights-status-opened");
  if (!Array.isArray(record?.sourceRefs) || !record.sourceRefs.includes(sourceUrl) || !record.sourceRefs.includes(record.sourceArtifactPath)) issues.push("source-refs-incomplete");
  if (record?.sourceLedger?.capturedAt && !validDate(record.sourceLedger.capturedAt)) issues.push("captured-at-invalid");
  if (record?.componentHints?.some((hint) => hint.evidence !== "identifier-only")) issues.push("component-hint-promotion");
  if (record?.componentHints?.some((hint) => !safeHttps(hint.sourceUrl, new Set(["vizier.cds.unistra.fr", "cds.unistra.fr"])))) issues.push("component-hint-source-invalid");
  const transport = attemptRecord ? auditAttempts(attemptRecord, id) : Object.freeze({ id, attempts: 0, captures: 0, retries: 0, timeouts: 0, captured: false, issues: Object.freeze([`${id}:attempt-record-missing`]), rows: Object.freeze([]) });
  issues.push(...transport.issues);
  return Object.freeze({ id, kind: "stellar", status: issues.length ? "blocked" : "pending-review", sourceKind: sourceKind(sourceUrl), sourceUrl: sourceUrl ?? null, captured: transport.captured, attempts: transport.attempts, componentHints: Array.isArray(record?.componentHints) ? record.componentHints.length : 0, citation: record?.sourceLedger?.citationStatus ?? null, rights: record?.sourceLedger?.rightsStatus ?? null, blockers: Object.freeze([...new Set(issues)]), fingerprint: digest({ id, sourceUrl, rawPageSha256: record?.rawPageSha256 ?? null, sourceRefs: record?.sourceRefs ?? [], componentHints: record?.componentHints ?? [], transport }), boundary: { candidateOnly: record?.runtimeAdmission === "candidate-only", hold: record?.decision === "hold", notAdmitted: record?.measurementAdmission === "not-admitted", scientificPayloadWriteback: record?.scientificPayloadWriteback ?? true } });
}

function nebulaBoundary(record) {
  const issues = [];
  if (record?.candidateOnly !== true && record?.runtimeAdmission !== "candidate-only") issues.push("candidate-boundary-open");
  if (record?.runtimeAdmission !== "candidate-only") issues.push("runtime-admission-opened");
  if (record?.measurementAdmission !== "not-admitted") issues.push("measurement-admission-opened");
  if (record?.scientificPayloadWriteback !== false) issues.push("scientific-writeback-opened");
  if (record?.runtimeWrites === true) issues.push("runtime-write-open");
  if (record?.measurementWrites === true) issues.push("measurement-write-open");
  return issues;
}

function rightsAudit(record) {
  const source = record?.source ?? {};
  const rights = record?.rights ?? {};
  const issues = [];
  const status = rights.status ?? rights.declaredStatus ?? "pending";
  const signoff = rights.signoffStatus ?? rights.declaredSignoff ?? "pending";
  if (!RIGHTS_STATUSES.has(status)) issues.push("rights-status-invalid");
  if (!SIGNOFF_STATUSES.has(signoff)) issues.push("rights-signoff-invalid");
  if (status === "verified" || signoff === "signed") {
    if (!hasText(rights.evidencePath)) issues.push("rights-evidence-missing");
    if (!SHA.test(rights.evidenceSha256 ?? rights.rightsPageHtmlSha256 ?? "")) issues.push("rights-evidence-digest-invalid");
    if (!hasText(rights.reviewer)) issues.push("rights-reviewer-missing");
    if (!validDate(rights.reviewedAt)) issues.push("rights-reviewed-at-invalid");
    if (rights.creditConfirmed !== true) issues.push("rights-credit-unconfirmed");
  }
  if (status === "pending") issues.push("rights-review-pending");
  if (status === "pending" && signoff === "signed") issues.push("rights-signoff-without-rights");
  if (!hasText(source.credit)) issues.push("source-credit-missing");
  if (!safeHttps(source.licenseUrl ?? source.policyUrl, new Set(["nasa.gov"]))) issues.push("license-policy-url-invalid");
  if (FORBIDDEN_MARKERS.test(source.url ?? "") || FORBIDDEN_MARKERS.test(source.sourcePageUrl ?? "")) issues.push("synthetic-marker-present");
  return Object.freeze({ status, signoff, issues: Object.freeze(issues) });
}

export function auditNebulaSourceRecord(record) {
  const id = record?.id ?? "unknown";
  const source = record?.source ?? {};
  const network = record?.network ?? {};
  const artifact = network.artifact ?? record?.artifact ?? null;
  const issues = [...nebulaBoundary(record)];
  if (!safeHttps(source.url, new Set([NEBULA_IMAGE_HOST]))) issues.push("source-url-invalid");
  if (!hasText(source.sourcePageUrl) && source.sourcePageStatus !== "pending") issues.push("source-page-missing");
  const transport = auditAttempts({ id, attemptLedger: network.attempts ?? [], responseCaptured: network.responseCaptured }, id);
  issues.push(...transport.issues);
  const rights = rightsAudit(record);
  issues.push(...rights.issues);
  const captured = transport.captured;
  if (captured) {
    if (!artifact || !safeRelativePath(artifact.path ?? artifact.localPath, "docs/release/v607/nebula-image-artifacts/")) issues.push("artifact-path-invalid");
    if (!SHA.test(artifact?.sha256 ?? "")) issues.push("artifact-sha-invalid");
    if (!Number.isSafeInteger(artifact?.bytes) || artifact.bytes <= 0) issues.push("artifact-size-invalid");
    if (!Number.isSafeInteger(artifact?.width) || artifact.width <= 0 || !Number.isSafeInteger(artifact?.height) || artifact.height <= 0) issues.push("artifact-dimensions-invalid");
    if (artifact?.synthetic === true || artifact?.fixture === true) issues.push("artifact-synthetic-or-fixture");
  } else if (artifact !== null && artifact !== undefined) {
    issues.push("failed-network-artifact-present");
  }
  const sourceStatus = captured && transport.issues.length === 0 && issues.filter((issue) => issue.startsWith("source-") || issue.includes("artifact") || issue.includes("attempt") || issue.includes("network")).length === 0 ? "pending-rights" : "blocked";
  return Object.freeze({ id, kind: "nebula", status: sourceStatus, sourceKind: sourceKind(source.url), sourceUrl: source.url ?? null, captured, attempts: transport.attempts, retries: transport.retries, rightsStatus: rights.status, signoff: rights.signoff, artifact: artifact ? { path: artifact.path ?? artifact.localPath ?? null, sha256: artifact.sha256 ?? null, bytes: artifact.bytes ?? null } : null, blockers: Object.freeze([...new Set(issues)]), fingerprint: digest({ id, source: { url: source.url ?? null, sourcePageUrl: source.sourcePageUrl ?? null, credit: source.credit ?? null, licenseUrl: source.licenseUrl ?? null }, network: network.attempts ?? [], artifact, rights, boundary: { candidateOnly: record?.candidateOnly === true, runtimeAdmission: record?.runtimeAdmission ?? null, measurementAdmission: record?.measurementAdmission ?? null, scientificPayloadWriteback: record?.scientificPayloadWriteback ?? null } }), boundary: { candidateOnly: record?.candidateOnly === true || record?.runtimeAdmission === "candidate-only", hold: true, notAdmitted: record?.measurementAdmission === "not-admitted", scientificPayloadWriteback: record?.scientificPayloadWriteback ?? true } });
}

function readRecords(pack, key = "records") {
  if (Array.isArray(pack)) return pack;
  if (Array.isArray(pack?.[key])) return pack[key];
  for (const fallback of ["rows", "items", "candidates", "objects"]) if (Array.isArray(pack?.[fallback])) return pack[fallback];
  return [];
}

function mapById(records) {
  const map = new Map();
  for (const record of records) {
    const id = record?.id;
    if (hasText(id) && !map.has(id)) map.set(id, record);
  }
  return map;
}

export function buildSourceRightsLedger({ stellarPack, stellarAttempts, nebulaBatch, generatedAt = new Date().toISOString() }) {
  const stellarRecords = readRecords(stellarPack);
  const attemptRecords = readRecords(stellarAttempts, "records");
  const nebulaRecords = readRecords(nebulaBatch);
  const attemptMap = mapById(attemptRecords);
  const rows = [];
  for (const candidate of stellarRecords) rows.push(auditStellarSourceRecord(candidate, attemptMap.get(candidate?.id)));
  for (const record of nebulaRecords) rows.push(auditNebulaSourceRecord(record));
  const ids = rows.map((row) => row.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  const errors = duplicateIds.map((id) => `${id}:duplicate-id`);
  if (stellarRecords.length === 0) errors.push("stellar-records-empty");
  if (nebulaRecords.length === 0) errors.push("nebula-records-empty");
  const boundary = { candidateOnly: rows.every((row) => row.boundary.candidateOnly), hold: rows.every((row) => row.boundary.hold), notAdmitted: rows.every((row) => row.boundary.notAdmitted), scientificPayloadWriteback: rows.every((row) => row.boundary.scientificPayloadWriteback === false) ? false : true, runtimeWrites: false, measurementWrites: false };
  if (!boundary.candidateOnly) errors.push("candidate-boundary-open");
  if (!boundary.notAdmitted) errors.push("measurement-boundary-open");
  if (boundary.scientificPayloadWriteback !== false) errors.push("scientific-writeback-open");
  errors.push(...rows.flatMap((row) => row.blockers.map((blocker) => `${row.id}:${blocker}`)));
  for (const row of rows) {
    if (row.kind === "stellar" && row.citation === "pending") errors.push(`${row.id}:citation-review-pending`);
    if (row.kind === "nebula" && row.rightsStatus === "pending") errors.push(`${row.id}:rights-review-pending`);
  }
  const counts = { total: rows.length, stellar: rows.filter((row) => row.kind === "stellar").length, nebula: rows.filter((row) => row.kind === "nebula").length, captured: rows.filter((row) => row.captured).length, blocked: rows.filter((row) => row.status === "blocked").length, pendingRights: rows.filter((row) => row.rightsStatus === "pending" || row.citation === "pending").length, rightsSigned: rows.filter((row) => row.signoff === "signed").length, withComponentHints: rows.filter((row) => row.kind === "stellar" && row.componentHints > 0).length };
  const normalizedRows = rows.slice().sort((a, b) => `${a.kind}|${a.id}`.localeCompare(`${b.kind}|${b.id}`));
  const closureDigest = digest({ schema: SCHEMA, rows: normalizedRows, counts, boundary, errors: [...new Set(errors)].sort() });
  return Object.freeze({ schema: SCHEMA, generatedAt, inputs: { stellarPack: STELLAR_PACK, stellarAttempts: STELLAR_ATTEMPTS, nebulaBatch: NEBULA_BATCH }, status: errors.length === 0 ? "verified" : "blocked", rows: Object.freeze(normalizedRows), counts: Object.freeze(counts), errors: Object.freeze([...new Set(errors)].sort()), boundary: Object.freeze(boundary), closureDigest });
}

export function toJsonl(receipt) {
  const lines = [
    { section: "meta", schema: receipt.schema, generatedAt: receipt.generatedAt, status: receipt.status, closureDigest: receipt.closureDigest },
    { section: "counts", ...receipt.counts },
    { section: "boundary", ...receipt.boundary },
  ];
  for (const row of receipt.rows) lines.push({ section: "row", ...row });
  for (const error of receipt.errors) lines.push({ section: "error", error });
  return `${lines.map((line) => JSON.stringify(line)).join("\n")}\n`;
}

export function readAndBuild(root = process.cwd()) {
  return buildSourceRightsLedger({ stellarPack: parseJson(root, STELLAR_PACK), stellarAttempts: parseJson(root, STELLAR_ATTEMPTS), nebulaBatch: parseJson(root, NEBULA_BATCH) });
}

function writeImmutable(target, content) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const descriptor = fs.openSync(target, "wx");
  try { fs.writeFileSync(descriptor, content, "utf8"); } finally { fs.closeSync(descriptor); }
}

export function run({ root = process.cwd(), check = false, jsonl = false } = {}) {
  const receipt = readAndBuild(root);
  const target = path.resolve(root, RECEIPT);
  if (!check) {
    if (!fs.existsSync(target)) writeImmutable(target, `${JSON.stringify(receipt, null, 2)}\n`);
    if (jsonl) {
      const jsonlTarget = path.resolve(root, JSONL_RECEIPT);
      if (!fs.existsSync(jsonlTarget)) writeImmutable(jsonlTarget, toJsonl(receipt));
    }
  }
  return { status: receipt.status, output: RECEIPT, counts: receipt.counts, closureDigest: receipt.closureDigest, check, errors: receipt.errors.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = run({ check: process.argv.includes("--check"), jsonl: process.argv.includes("--jsonl") });
    console.log(JSON.stringify(result, null, 2));
    if (result.status !== "verified") process.exitCode = 2;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

export function sourceRightsRowAction(row) {
  if (row.kind === "stellar") {
    if (row.blockers.includes("attempt-record-missing")) return "保留 raw attempt ledger 并重新执行真实 HTTPS 采集";
    if (row.blockers.includes("component-confirmation-opened") || row.componentHints > 0) return "仅复核组件身份候选，不得晋级确认";
    if (row.citation === "pending") return "保持引用待复核";
    return "保持 candidate-only / hold / not-admitted";
  }
  if (!row.captured) return "保留失败 attempt ledger，禁止写入 artifact";
  if (row.rightsStatus === "pending") return "补齐官方来源页与逐项版权审查";
  if (row.signoff !== "signed") return "等待版权签署";
  return "保持 candidate-only，等待发布门禁";
}

export function projectSourceRightsActions(receipt) {
  const rows = Array.isArray(receipt?.rows) ? receipt.rows : [];
  return Object.freeze(rows.map((row) => Object.freeze({ id: row.id, kind: row.kind, status: row.status, action: sourceRightsRowAction(row), blockers: row.blockers }))); 
}

export function summarizeSourceRightsLedger(receipt) {
  const rows = Array.isArray(receipt?.rows) ? receipt.rows : [];
  const allBoundaryClosed = rows.every((row) => row.boundary?.candidateOnly === true && row.boundary?.hold === true && row.boundary?.notAdmitted === true && row.boundary?.scientificPayloadWriteback === false);
  const sourceReady = rows.filter((row) => row.kind === "nebula" && row.captured && !row.blockers.some((blocker) => blocker.startsWith("source-") || blocker.startsWith("artifact-") || blocker.startsWith("attempt-"))).length;
  const structuredReady = rows.filter((row) => row.kind === "stellar" && row.captured && row.blockers.length === 0).length;
  return Object.freeze({ status: receipt?.status ?? "blocked", closureDigest: receipt?.closureDigest ?? null, allBoundaryClosed, sourceReady, structuredReady, pendingRights: Number(receipt?.counts?.pendingRights ?? 0), blocked: Number(receipt?.counts?.blocked ?? 0), nextActions: projectSourceRightsActions(receipt) });
}

export function validateSourceRightsReceipt(receipt) {
  const errors = [];
  if (receipt?.schema !== SCHEMA) errors.push("schema-invalid");
  if (!validDate(receipt?.generatedAt)) errors.push("generated-at-invalid");
  if (!SHA.test(receipt?.closureDigest ?? "")) errors.push("closure-digest-invalid");
  if (!Array.isArray(receipt?.rows)) errors.push("rows-missing");
  if (!receipt?.boundary || receipt.boundary.candidateOnly !== true || receipt.boundary.hold !== true || receipt.boundary.notAdmitted !== true || receipt.boundary.scientificPayloadWriteback !== false) errors.push("boundary-invalid");
  const ids = new Set();
  for (const row of receipt?.rows ?? []) {
    if (!hasText(row.id)) errors.push("row-id-missing");
    if (ids.has(row.id)) errors.push(`duplicate-row:${row.id}`);
    ids.add(row.id);
    if (!Array.isArray(row.blockers)) errors.push(`${row.id}:blockers-missing`);
    if (!SHA.test(row.fingerprint ?? "")) errors.push(`${row.id}:fingerprint-invalid`);
    if (row.boundary?.scientificPayloadWriteback !== false) errors.push(`${row.id}:scientific-writeback-open`);
  }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}

export function replaySourceRightsLedger(receipt) {
  const validation = validateSourceRightsReceipt(receipt);
  const rows = (receipt?.rows ?? []).slice().sort((left, right) => `${left.kind}|${left.id}`.localeCompare(`${right.kind}|${right.id}`));
  const replayDigest = digest({ schema: SCHEMA, rows, counts: receipt?.counts ?? null, boundary: receipt?.boundary ?? null, errors: receipt?.errors ?? [] });
  return Object.freeze({ schema: `${SCHEMA}-replay`, valid: validation.valid && replayDigest === receipt?.closureDigest, replayDigest, closureDigest: receipt?.closureDigest ?? null, validation, rows: Object.freeze(rows.map((row) => Object.freeze({ id: row.id, phase: row.kind === "stellar" ? "structured-source" : "nebula-rights", state: row.status, observed: `${row.captured ? "captured" : "not-captured"};${row.blockers.length ? "blocked" : "clear"}`, blockers: row.blockers, fingerprint: row.fingerprint }))) });
}

export function assertReceiptImmutableBaseline(receipt, baseline) {
  const currentDigest = receipt?.closureDigest;
  const baselineDigest = typeof baseline === "string" ? baseline : baseline?.closureDigest;
  if (!SHA.test(currentDigest ?? "") || !SHA.test(baselineDigest ?? "")) return Object.freeze({ valid: false, reason: "digest-missing" });
  return Object.freeze({ valid: currentDigest === baselineDigest, reason: currentDigest === baselineDigest ? "same-digest" : "digest-changed", currentDigest, baselineDigest });
}

export function inspectArtifactFile(root, row, artifactPath, expectedSha256, expectedBytes) {
  const issues = [];
  if (!safeRelativePath(artifactPath, "docs/release/")) issues.push("artifact-path-invalid");
  if (!SHA.test(expectedSha256 ?? "")) issues.push("artifact-sha-invalid");
  const absolute = path.resolve(root, artifactPath ?? "");
  if (!fs.existsSync(absolute)) return Object.freeze({ present: false, recomputed: false, bytes: null, sha256: null, issues: Object.freeze([...issues, "artifact-file-missing"]) });
  const bytes = fs.readFileSync(absolute);
  const actualSha256 = sha256(bytes);
  if (bytes.length !== expectedBytes) issues.push("artifact-file-bytes-mismatch");
  if (actualSha256 !== expectedSha256) issues.push("artifact-file-sha-mismatch");
  return Object.freeze({ present: true, recomputed: true, bytes: bytes.length, sha256: actualSha256, issues: Object.freeze(issues) });
}

export function auditCapturedArtifactFiles(root, receipt) {
  const rows = [];
  for (const row of receipt?.rows ?? []) {
    if (row.kind !== "nebula" || !row.captured || !row.artifact) continue;
    const file = inspectArtifactFile(root, row, row.artifact.path, row.artifact.sha256, row.artifact.bytes);
    rows.push(Object.freeze({ id: row.id, ...file }));
  }
  return Object.freeze(rows);
}

export function classifyEvidenceClasses(receipt) {
  const rows = receipt?.rows ?? [];
  return Object.freeze({
    static: Object.freeze({ present: true, scope: "ledger-schema-and-boundary" }),
    externalSource: Object.freeze({ present: rows.some((row) => row.sourceKind === "simbad" || row.sourceKind === "nasa-image"), captured: rows.filter((row) => row.captured).length, scope: "source URLs and raw attempt metadata" }),
    rights: Object.freeze({ present: rows.some((row) => row.rightsStatus !== undefined || row.citation !== undefined), signed: rows.filter((row) => row.signoff === "signed").length, pending: rows.filter((row) => row.rightsStatus === "pending" || row.citation === "pending").length, scope: "item-level review only" }),
    visual: Object.freeze({ present: false, scope: "not asserted by source ledger" }),
    browser: Object.freeze({ present: false, scope: "not asserted by source ledger" }),
    performance: Object.freeze({ present: false, scope: "not asserted by source ledger" }),
  });
}

export function makeHumanReviewQueue(receipt) {
  return Object.freeze((receipt?.rows ?? []).flatMap((row) => {
    const actions = [];
    for (const blocker of row.blockers ?? []) actions.push(Object.freeze({ id: row.id, kind: row.kind, blocker, action: sourceRightsRowAction(row), evidenceClass: blocker.includes("rights") || blocker.includes("citation") ? "rights" : blocker.includes("artifact") || blocker.includes("attempt") ? "external-source" : "static" }));
    return actions;
  }));
}

export function receiptStatusLabel(receipt) {
  const summary = summarizeSourceRightsLedger(receipt);
  if (!summary.allBoundaryClosed) return "blocked · admission boundary open";
  if (summary.blocked > 0) return "blocked · source or rights evidence incomplete";
  if (summary.pendingRights > 0) return "pending · rights review";
  return "verified · source ledger closed";
}

export function formatLedgerReport(receipt) {
  const summary = summarizeSourceRightsLedger(receipt);
  const lines = [
    `schema=${receipt?.schema ?? "unknown"}`,
    `status=${receiptStatusLabel(receipt)}`,
    `rows=${receipt?.rows?.length ?? 0}`,
    `captured=${receipt?.counts?.captured ?? 0}`,
    `blocked=${summary.blocked}`,
    `pendingRights=${summary.pendingRights}`,
    `scientificPayloadWriteback=false`,
  ];
  for (const row of receipt?.rows ?? []) lines.push(`${row.kind}:${row.id}:${row.status}:${row.blockers.join("|") || "none"}`);
  return `${lines.join("\n")}\n`;
}

export function toCsv(receipt) {
  const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const header = ["kind", "id", "status", "captured", "attempts", "rightsStatus", "signoff", "blockers", "fingerprint"];
  const lines = [header.map(escape).join(",")];
  for (const row of receipt?.rows ?? []) lines.push([row.kind, row.id, row.status, row.captured, row.attempts, row.rightsStatus ?? row.citation ?? "", row.signoff ?? "", row.blockers.join("|"), row.fingerprint].map(escape).join(","));
  return `${lines.join("\n")}\n`;
}

export function isCandidateOnlyReceipt(receipt) {
  return receipt?.boundary?.candidateOnly === true
    && receipt?.boundary?.hold === true
    && receipt?.boundary?.notAdmitted === true
    && receipt?.boundary?.scientificPayloadWriteback === false
    && receipt?.boundary?.runtimeWrites === false
    && receipt?.boundary?.measurementWrites === false;
}

export function pendingExternalSourceCount(receipt) {
  return (receipt?.rows ?? []).filter((row) => !row.captured || row.blockers.some((blocker) => blocker.includes("source") || blocker.includes("attempt") || blocker.includes("artifact") || blocker.includes("rights") || blocker.includes("citation"))).length;
}

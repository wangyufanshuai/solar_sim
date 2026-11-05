import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const LEDGER_PATH = "app/data/mainlineABetaStellarRawAttemptLedgerV620.generated.json";
export const PACK_PATH = "app/data/mainlineABetaStellarStructuredCandidateV621.generated.json";
export const RECEIPT_PATH = "docs/release/v607/mainline-a-r61-structured-audit.json";
export const JSONL_PATH = "docs/release/v607/mainline-a-r61-structured-audit.jsonl";
const IDS = ["acrux", "spica", "regulus", "polaris"];
const ENDPOINT = "https://simbad.cds.unistra.fr/simbad/sim-tap/sync";
const HASH = /^[a-f0-9]{64}$/i;
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const read = (root, rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
const issue = (code, detail, id = null) => ({ code, detail, id });
export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
export function canonicalDigest(value) { return sha256(JSON.stringify(canonicalize(value))); }
export function sourceLedgerFingerprint(candidate) { return canonicalDigest({ id: candidate.id, planId: candidate.planId, sourceLedger: candidate.sourceLedger, sourceRefs: candidate.sourceRefs }); }
export function classifyFieldQuality(candidate) {
  const quality = {};
  quality.identity = candidate.queryTitle && candidate.objectType ? "present" : "missing";
  quality.coordinates = candidate.raDeg !== null && candidate.decDeg !== null ? "present" : "missing";
  quality.motion = candidate.properMotionRaMasYr !== null && candidate.properMotionDecMasYr !== null ? "present" : "missing";
  quality.spectral = candidate.spectralType ? "present" : "missing";
  quality.component = candidate.componentIdentityStatus === "confirmed" ? "confirmed" : "unresolved";
  quality.citation = candidate.sourceLedger?.citationStatus === "pending" ? "pending-review" : "reviewed";
  return quality;
}
export function classifyBlockers(candidate, issues) {
  const blockers = [];
  if (candidate.componentIdentityStatus !== "confirmed") blockers.push("component-identity");
  if (candidate.sourceLedger?.citationStatus !== "reviewed") blockers.push("citation-review");
  if (candidate.sourceLedger?.rightsStatus !== "reviewed") blockers.push("rights-review");
  for (const entry of issues) if (!blockers.includes(entry.code)) blockers.push(entry.code);
  return Object.freeze(blockers);
}
export function summarizeAttemptTelemetry(ledgerRecord) {
  const attempts = ledgerRecord.attemptLedger ?? ledgerRecord.attempts ?? [];
  return Object.freeze({ attempts: attempts.length, retries: attempts.reduce((sum, item) => sum + (item.retryCount ?? 0), 0), captured: attempts.filter((item) => item.responseCaptured === 1 || item.responseCaptured === true).length, timeouts: attempts.filter((item) => item.timeout || item.errorClass === "timeout").length, statuses: Object.fromEntries([...new Set(attempts.map((item) => item.httpStatus).filter((status) => status !== null))].map((status) => [String(status), attempts.filter((item) => item.httpStatus === status).length])), errorClasses: Object.fromEntries([...new Set(attempts.map((item) => item.errorClass).filter(Boolean))].map((name) => [name, attempts.filter((item) => item.errorClass === name).length])) });
}
export function deterministicReportSections(result) {
  return Object.freeze({ overview: { status: result.status, counts: result.counts, boundary: result.boundary }, artifacts: result.artifactAudit.map((row) => ({ id: row.id, bytes: row.bytes, sha256: row.sha256, recomputed: row.recomputed })), candidates: result.candidateAudit.map((row) => ({ id: row.id, parseStatus: row.parseStatus, componentIdentityStatus: row.componentIdentityStatus, componentHintCount: row.componentHintCount ?? 0, componentHints: row.componentHints ?? [], blockers: row.blockers ?? [], sourceFingerprint: row.sourceFingerprint ?? null })), errors: result.errors });
}
export function toJsonl(result) {
  const lines = [];
  lines.push(JSON.stringify({ section: "meta", schema: result.schema, status: result.status, generatedAt: result.generatedAt }));
  lines.push(JSON.stringify({ section: "counts", ...result.counts }));
  for (const artifact of result.artifactAudit) lines.push(JSON.stringify({ section: "artifact", ...artifact }));
  for (const candidate of result.candidateAudit) lines.push(JSON.stringify({ section: "candidate", ...candidate }));
  for (const entry of result.errors) lines.push(JSON.stringify({ section: "error", ...entry }));
  return `${lines.join("\n")}\n`;
}

export function artifactAudit(root, record) {
  const errors = [];
  const attempt = (record.attemptLedger ?? record.attempts ?? []).find((entry) => entry.responseCaptured === 1 || entry.responseCaptured === true);
  if (!attempt) return { id: record.id, captured: false, bytes: null, sha256: null, recomputed: false, errors: [issue("captured-attempt-missing", "no successful attempt", record.id)] };
  const relative = String(attempt.rawArtifactPath ?? "").replaceAll("\\", path.sep);
  const target = path.resolve(root, relative);
  if (!fs.existsSync(target)) return { id: record.id, captured: true, bytes: null, sha256: null, recomputed: false, errors: [issue("artifact-missing", relative, record.id)] };
  const bytes = fs.statSync(target).size;
  const digest = sha256(fs.readFileSync(target));
  if (bytes !== attempt.responseBytes) errors.push(issue("artifact-byte-mismatch", `${bytes} != ${attempt.responseBytes}`, record.id));
  if (digest !== attempt.rawArtifactSha256 || digest !== attempt.rawPageSha256) errors.push(issue("artifact-sha-mismatch", digest, record.id));
  return { id: record.id, captured: true, bytes, sha256: digest, recomputed: true, errors };
}

export function validateSourceLedger(candidate, ledgerRecord) {
  const errors = [];
  const source = candidate.sourceLedger;
  if (!source || !source.sourceUrl?.startsWith("https://simbad.cds.unistra.fr/")) errors.push(issue("source-url-invalid", "SIMBAD HTTPS source required", candidate.id));
  if (source?.sourceUrl !== ledgerRecord.plan?.sourceUrl) errors.push(issue("source-url-mismatch", "V620 plan/source mismatch", candidate.id));
  if (source?.rawPageSha256 !== candidate.rawPageSha256) errors.push(issue("source-hash-mismatch", "source ledger hash differs", candidate.id));
  if (!source?.capturedAt || Number.isNaN(Date.parse(source.capturedAt))) errors.push(issue("captured-at-invalid", "capturedAt is not ISO", candidate.id));
  if (source?.citationStatus !== "pending") errors.push(issue("citation-review-opened", "citation must remain pending", candidate.id));
  if (source?.rightsStatus !== "odbl-attribution-required") errors.push(issue("rights-review-opened", "rights status must remain pending", candidate.id));
  if (!Array.isArray(candidate.sourceRefs) || !candidate.sourceRefs.includes(candidate.sourceArtifactPath) || !candidate.sourceRefs.includes(source?.sourceUrl)) errors.push(issue("source-refs-incomplete", "artifact and URL refs required", candidate.id));
  return errors;
}

export function validateComponentHints(candidate) {
  const errors = [];
  for (const hint of candidate.componentHints ?? []) {
    if (!(hint.catalog === "WDS" || hint.catalog === "CCDM") || !String(hint.identifier ?? "").startsWith(`${hint.catalog} `)) {
      errors.push(issue("component-hint-invalid", "catalogue identifier shape is invalid", candidate.id));
    }
    try {
      const url = new URL(hint.sourceUrl);
      if (url.protocol !== "https:" || !["vizier.cds.unistra.fr", "cds.unistra.fr"].includes(url.hostname)) {
        errors.push(issue("component-hint-source-invalid", hint.sourceUrl, candidate.id));
      }
    } catch {
      errors.push(issue("component-hint-source-invalid", String(hint.sourceUrl), candidate.id));
    }
    if (hint.evidence !== "identifier-only") errors.push(issue("component-hint-promotion", "only identifier-only hints are allowed", candidate.id));
  }
  if (candidate.componentIdentityStatus === "unresolved" && candidate.componentSourceReference !== null) {
    errors.push(issue("component-source-opened", "unresolved candidate cannot carry a confirmed source", candidate.id));
  }
  return errors;
}

export function validateCandidate(candidate, ledgerRecord) {
  const errors = [];
  if (!IDS.includes(candidate.id)) errors.push(issue("id-not-allowlisted", candidate.id, candidate.id));
  if (candidate.planId !== ledgerRecord.planId) errors.push(issue("plan-id-mismatch", "V620 plan mismatch", candidate.id));
  if (!HASH.test(candidate.rawPageSha256 ?? "")) errors.push(issue("raw-hash-invalid", "sha256 required", candidate.id));
  if (candidate.parseStatus !== "parsed-candidate") errors.push(issue("parse-not-candidate", candidate.parseStatus, candidate.id));
  if (candidate.raDeg === null || candidate.raDeg < 0 || candidate.raDeg >= 360) errors.push(issue("ra-out-of-range", String(candidate.raDeg), candidate.id));
  if (candidate.decDeg === null || candidate.decDeg < -90 || candidate.decDeg > 90) errors.push(issue("dec-out-of-range", String(candidate.decDeg), candidate.id));
  if (!candidate.queryTitle || !candidate.objectType) errors.push(issue("minimum-identity-missing", "title/object type", candidate.id));
  if (candidate.componentIdentityStatus !== "unresolved") errors.push(issue("component-identity-opened", candidate.componentIdentityStatus, candidate.id));
  if (candidate.componentSourceReference !== null) errors.push(issue("component-source-opened", "must remain null", candidate.id));
  if (candidate.decision !== "hold" || candidate.runtimeAdmission !== "candidate-only" || candidate.measurementAdmission !== "not-admitted" || candidate.scientificPayloadWriteback !== false) errors.push(issue("admission-boundary-opened", "candidate-only/hold/not-admitted required", candidate.id));
  errors.push(...validateSourceLedger(candidate, ledgerRecord));
  errors.push(...validateComponentHints(candidate));
  return errors;
}

export function validateDigestBinding(candidate, ledgerRecord) {
  const expectedSnapshot = ledgerRecord.plan?.expectedSnapshotRecordDigest;
  const expectedProjection = ledgerRecord.plan?.expectedProjectionRecordDigest;
  const issues = [];
  if (!HASH.test(expectedSnapshot ?? "")) issues.push(issue("snapshot-digest-missing", "V616 snapshot digest unavailable", candidate.id));
  if (!HASH.test(expectedProjection ?? "")) issues.push(issue("projection-digest-missing", "V616 projection digest unavailable", candidate.id));
  if (candidate.rawPageSha256 === expectedSnapshot || candidate.rawPageSha256 === expectedProjection) issues.push(issue("raw-science-digest-confusion", "raw HTML hash must remain distinct from V616 digests", candidate.id));
  return issues;
}

export function validateAttemptTelemetry(ledgerRecord) {
  const issues = [];
  const attempts = ledgerRecord.attemptLedger ?? ledgerRecord.attempts ?? [];
  if (attempts.length === 0) issues.push(issue("attempt-ledger-empty", "no transport attempt", ledgerRecord.id));
  for (const attempt of attempts) {
    if (!attempt.startedAt || !attempt.endedAt) issues.push(issue("attempt-time-missing", "startedAt/endedAt required", ledgerRecord.id));
    if (attempt.retryCount !== attempt.attempt - 1) issues.push(issue("retry-count-invalid", String(attempt.retryCount), ledgerRecord.id));
    if (attempt.responseCaptured === 1 && attempt.httpStatus !== 200) issues.push(issue("captured-status-invalid", String(attempt.httpStatus), ledgerRecord.id));
    if (attempt.responseCaptured === 1 && !attempt.contentType?.startsWith("text/html")) issues.push(issue("captured-content-type-invalid", attempt.contentType, ledgerRecord.id));
  }
  return issues;
}

export function validateFixtureBoundary(ledgerRecord, candidate) {
  const issues = [];
  const attempts = ledgerRecord.attemptLedger ?? [];
  const fixture = attempts.some((attempt) => attempt.transport === "fixture-replay");
  if (fixture && candidate.parseStatus === "parsed-candidate") issues.push(issue("fixture-structured-promotion", "fixture replay cannot become candidate evidence", candidate.id));
  if (fixture && candidate.componentIdentityStatus === "confirmed") issues.push(issue("fixture-component-confirmation", "fixture cannot confirm component identity", candidate.id));
  return issues;
}

export function summarizeAudit(result) {
  return { status: result.status, total: result.counts.total, artifactsRecomputed: result.counts.artifactsRecomputed, parsedCandidates: result.counts.parsedCandidates, componentConfirmed: result.counts.componentConfirmed, errors: result.errors.length, scientificPayloadWriteback: false, runtimeWrites: false, measurementWrites: false };
}

export function audit(root = process.cwd()) {
  const ledger = read(root, LEDGER_PATH);
  const pack = read(root, PACK_PATH);
  const errors = [];
  if (ledger.schema !== "mainline-a-beta-stellar-raw-attempt-ledger-v620") errors.push(issue("ledger-schema-invalid", ledger.schema));
  if (pack.schema !== "mainline-a-beta-stellar-structured-candidate-pack-v621") errors.push(issue("pack-schema-invalid", pack.schema));
  if (pack.boundary?.candidateOnly !== true || pack.boundary?.hold !== true || pack.boundary?.notAdmitted !== true || pack.boundary?.scientificPayloadWriteback !== false) errors.push(issue("pack-boundary-invalid", "candidate boundary must remain closed"));
  const artifactRows = [];
  const candidateRows = [];
  for (const id of IDS) {
    const ledgerRecord = ledger.records.find((record) => record.id === id);
    const candidate = pack.records.find((record) => record.id === id);
    if (!ledgerRecord || !candidate) { errors.push(issue("record-missing", id, id)); continue; }
    artifactRows.push(artifactAudit(root, ledgerRecord));
    const candidateErrors = validateCandidate(candidate, ledgerRecord);
    candidateRows.push({ id, errors: candidateErrors, componentIdentityStatus: candidate.componentIdentityStatus, componentHintCount: candidate.componentHints?.length ?? 0, componentHints: (candidate.componentHints ?? []).map((hint) => ({ catalog: hint.catalog, identifier: hint.identifier, sourceUrl: hint.sourceUrl, evidence: hint.evidence })), parseStatus: candidate.parseStatus, fieldQuality: classifyFieldQuality(candidate), blockers: classifyBlockers(candidate, candidateErrors), sourceFingerprint: sourceLedgerFingerprint(candidate), telemetry: summarizeAttemptTelemetry(ledgerRecord) });
    errors.push(...artifactRows.at(-1).errors, ...candidateRows.at(-1).errors, ...validateDigestBinding(candidate, ledgerRecord), ...validateAttemptTelemetry(ledgerRecord), ...validateFixtureBoundary(ledgerRecord, candidate));
    const attempt = (ledgerRecord.attemptLedger ?? []).find((entry) => entry.responseCaptured === 1 || entry.responseCaptured === true);
    if (attempt?.transport === "fixture-replay") errors.push(issue("fixture-replay-promotion-blocked", "fixture cannot be structured evidence", id));
    if (ledgerRecord.plan?.serviceEndpoint !== ENDPOINT) errors.push(issue("endpoint-mismatch", ledgerRecord.plan?.serviceEndpoint, id));
  }
  const result = { schema: "mainline-a-r61-structured-audit", generatedAt: new Date().toISOString(), input: { ledger: LEDGER_PATH, pack: PACK_PATH }, counts: { total: IDS.length, artifactsRecomputed: artifactRows.filter((row) => row.recomputed).length, parsedCandidates: candidateRows.filter((row) => row.parseStatus === "parsed-candidate").length, componentConfirmed: candidateRows.filter((row) => row.componentIdentityStatus === "confirmed").length, errors: errors.length }, artifactAudit: artifactRows, candidateAudit: candidateRows, boundary: { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false, runtimeWrites: false, measurementWrites: false, fixtureStructuredPromotion: false }, status: errors.length === 0 ? "verified" : "blocked", errors };
  result.deterministicDigest = canonicalDigest({ counts: result.counts, artifactAudit: result.artifactAudit, candidateAudit: result.candidateAudit, boundary: result.boundary, errors: result.errors });
  result.reportSections = deterministicReportSections(result);
  return result;
}

export function run({ root = process.cwd(), check = false, jsonl = false } = {}) {
  const result = audit(root);
  const target = path.join(root, RECEIPT_PATH);
  if (!check) { fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, `${JSON.stringify(result, null, 2)}\n`, "utf8"); if (jsonl) fs.writeFileSync(path.join(root, JSONL_PATH), toJsonl(result), "utf8"); }
  if (result.status !== "verified") throw new Error(`structured audit blocked with ${result.errors.length} issue(s)`);
  return { status: "verified", output: RECEIPT_PATH, counts: result.counts };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) { try { console.log(JSON.stringify(run({ check: process.argv.includes("--check"), jsonl: process.argv.includes("--jsonl") }), null, 2)); } catch (error) { console.error(error.message); process.exitCode = 1; } }

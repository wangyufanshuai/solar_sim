import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { replayBatch } from "./replay-mainline-a-nebula-batch-v624.mjs";
import {
  B1_BATCH, B1_DISCOVERY, B1_MAX_PAGE_BYTES, B1_PAGE_DIR,
  b1PageArtifactPathV654, bindB1DiscoveryToBatchV654,
  fingerprintB1PageRequestV654, inspectB1OfficialPageV654,
  sha256B1V654,
} from "./mainline-a-nebula-b1-source-v654.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA = "mainline-a-r67-b1-source-page-ledger-v654";
const AUDIT_SCHEMA = "mainline-a-r67-b1-source-page-audit-v654";
const LEDGER_PATTERN = /^docs\/release\/v607\/mainline-a-r67-b1-source-page-ledger-20261012-v654b1page0[1-9]\.json$/;
const RECEIPT_PATTERN = /^docs\/release\/v607\/[a-z0-9-]+\.json$/;
const SHA = /^[a-f0-9]{64}$/;
const HTML_MIME = /^(?:text\/html|application\/xhtml\+xml)(?:\s*;|$)/i;
const ERROR_CLASSES = new Set([
  "timeout", "network-error", "redirect-blocked", "http-status",
  "content-type", "body-too-large", "empty-body",
]);
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);

function issue(issues, valid, code) {
  if (!valid) issues.push(code);
}
function isTimePair(startedAt, endedAt) {
  const start = Date.parse(startedAt);
  const end = Date.parse(endedAt);
  return Number.isFinite(start) && Number.isFinite(end) && end >= start;
}
function within(root, relative, base = root) {
  const absolute = path.resolve(root, relative);
  return absolute.startsWith(`${path.resolve(base)}${path.sep}`);
}
async function boundedRead(root, relative, maximumBytes) {
  if (!within(root, relative)) throw new Error("b1-audit-v654:path-escaped");
  const absolute = path.resolve(root, relative);
  const info = await stat(absolute);
  if (!info.isFile() || info.size < 1 || info.size > maximumBytes) {
    throw new Error("b1-audit-v654:file-size-invalid");
  }
  return readFile(absolute);
}
function pin(relative, bytes) {
  return Object.freeze({ path: relative, bytes: bytes.byteLength,
    sha256: sha256B1V654(bytes) });
}
function samePin(actual, expected) {
  return actual?.path === expected.path && actual.bytes === expected.bytes
    && actual.sha256 === expected.sha256;
}

export function inspectB1PageAttemptV654(attempt, row, index, total) {
  const issues = [];
  const fingerprint = fingerprintB1PageRequestV654({ pageUrl: row.pageUrl });
  issue(issues, attempt?.attempt === index + 1
    && attempt.retryCount === index
    && typeof attempt.collectionId === "string"
    && attempt.collectionId.length >= 8,
  "attempt-sequence-invalid");
  issue(issues, isTimePair(attempt?.startedAt, attempt?.endedAt)
    && attempt.timeoutMs > 0 && attempt.requestExecuted === true,
  "attempt-time-invalid");
  issue(issues, attempt.requestUrl === row.pageUrl
    && attempt.requestFingerprint === fingerprint
    && row.requestFingerprint === fingerprint,
  "request-fingerprint-invalid");
  if (attempt.responseCaptured === 1) {
    issue(issues, index === total - 1 && row.responseCaptured === 1
      && attempt.httpStatus === 200
      && HTML_MIME.test(attempt.contentType ?? "")
      && attempt.finalUrl === row.pageUrl
      && same(attempt.redirectChain, [row.pageUrl])
      && attempt.errorClass === null && attempt.errorMessage === null
      && attempt.timeout === false
      && attempt.responseBytes === row.artifact?.bytes
      && attempt.rawSha256 === row.artifact?.sha256
      && attempt.rawArtifactPath === row.artifact?.path,
    "captured-response-invalid");
  } else {
    issue(issues, attempt.responseCaptured === 0
      && ERROR_CLASSES.has(attempt.errorClass)
      && attempt.timeout === (attempt.errorClass === "timeout")
      && attempt.responseBytes === null
      && attempt.rawSha256 === null
      && attempt.rawArtifactPath === null
      && (attempt.httpStatus === null
        || Number.isInteger(attempt.httpStatus)),
    "failed-response-forged");
  }
  return Object.freeze(issues);
}

export function inspectB1PageLedgerContractV654(ledger, candidates) {
  const issues = [];
  issue(issues, ledger?.schema === SCHEMA
    && /^20261012-v654b1page0[1-9]$/.test(ledger.runId ?? "")
    && ledger.evidenceClass === "external-source"
    && isTimePair(ledger.startedAt, ledger.endedAt),
  "ledger-identity-invalid");
  issue(issues, ledger?.rows?.length === 6 && candidates?.length === 6
    && ledger.counts?.total === 6,
  "six-row-coverage-invalid");
  issue(issues, ledger?.boundary?.candidateOnly === true
    && ledger.boundary.hold === true
    && ledger.boundary.notAdmitted === true
    && ledger.boundary.scientificPayloadWriteback === false
    && ledger.boundary.runtimePromotion === "closed"
    && ledger.claims?.copyrightApproval === false
    && ledger.claims.scientificValidity === false
    && ledger.claims.publicWebReleaseApproved === false
    && ledger.claims.realUserValidation === false
    && ledger.counts?.rightsSigned === 0,
  "release-boundary-promoted");
  const captured = ledger?.rows?.filter((row) => row.responseCaptured === 1).length ?? -1;
  const verified = ledger?.rows?.filter((row) =>
    row.pageStatus === "verified-official-page-candidate").length ?? -1;
  issue(issues, ledger?.counts?.responseCaptured === captured
    && ledger?.counts?.officialPageCandidateVerified === verified,
  "declared-counts-invalid");
  for (const [index, candidate] of (candidates ?? []).entries()) {
    const row = ledger?.rows?.[index];
    if (!row) continue;
    const prefix = `${candidate.id}:`;
    issue(issues, row.id === candidate.id
      && row.nasaId === candidate.nasaId
      && row.pageUrl === candidate.pageUrl
      && row.pageTitle === candidate.pageTitle
      && row.expectedCredit === candidate.expectedCredit
      && same(row.candidateImageArtifact, candidate.candidateImageArtifact),
    `${prefix}candidate-binding-invalid`);
    issue(issues, row.rightsSignoff === "pending"
      && row.runtimeAdmission === "candidate-only"
      && row.scientificPayloadWriteback === false
      && row.persistError === null,
    `${prefix}rights-or-persist-invalid`);
    issue(issues, Array.isArray(row.attempts)
      && row.attempts.length >= 1 && row.attempts.length <= 2
      && row.attempts.every((attempt) => attempt.collectionId
        === row.attempts[0].collectionId),
    `${prefix}attempts-invalid`);
    for (const [attemptIndex, attempt] of (row.attempts ?? []).entries()) {
      issues.push(...inspectB1PageAttemptV654(attempt, row,
        attemptIndex, row.attempts.length).map((code) => `${prefix}${code}`));
    }
    issue(issues, row.attempts?.filter((attempt) =>
      attempt.responseCaptured === 1).length === row.responseCaptured,
    `${prefix}capture-count-invalid`);
    issue(issues, row.pageStatus === "verified-official-page-candidate"
      ? row.inspection?.status === "verified-official-page-candidate"
        && row.artifact?.sha256 && SHA.test(row.artifact.sha256)
      : row.pageStatus === "pending",
    `${prefix}parser-status-invalid`);
  }
  return Object.freeze({ ok: issues.length === 0,
    issues: Object.freeze(issues) });
}

export function inspectB1CapturedPageV654(bytes, row, candidate) {
  const issues = [];
  const digest = sha256B1V654(bytes);
  const html = Buffer.from(bytes).toString("utf8");
  const parsed = inspectB1OfficialPageV654(html, candidate);
  const expectedPath = b1PageArtifactPathV654(candidate, digest);
  issue(issues, row.artifact?.path === expectedPath
    && row.artifact.bytes === bytes.byteLength
    && row.artifact.sha256 === digest
    && row.artifact.finalUrl === candidate.pageUrl
    && HTML_MIME.test(row.artifact.contentType ?? ""),
  "raw-artifact-sha-or-size-invalid");
  issue(issues, parsed.status === "verified-official-page-candidate"
    && same(parsed, row.inspection),
  "raw-official-page-contract-invalid");
  return Object.freeze({ ok: issues.length === 0,
    issues: Object.freeze(issues), parsed,
    pin: pin(row.artifact.path, bytes) });
}

export async function auditB1SourcePagesV654(ledgerRelative, root = ROOT) {
  if (!LEDGER_PATTERN.test(ledgerRelative ?? "")) {
    throw new Error("b1-audit-v654:ledger-path-invalid");
  }
  const [ledgerBytes, batchBytes, discoveryBytes] = await Promise.all([
    boundedRead(root, ledgerRelative, 2_000_000),
    boundedRead(root, B1_BATCH, 3_000_000),
    boundedRead(root, B1_DISCOVERY, 500_000),
  ]);
  const ledger = JSON.parse(ledgerBytes.toString("utf8"));
  const batch = JSON.parse(batchBytes.toString("utf8"));
  const discovery = JSON.parse(discoveryBytes.toString("utf8"));
  const issues = [];
  const replay = await replayBatch(batch);
  issue(issues, replay.status === "verified-with-rights-pending"
    && replay.counts.recomputed.artifactVerified === 6,
  "candidate-image-batch-replay-failed");
  const expectedPins = { batch: pin(B1_BATCH, batchBytes),
    discovery: pin(B1_DISCOVERY, discoveryBytes) };
  issue(issues, samePin(ledger.inputPins?.batch, expectedPins.batch)
    && samePin(ledger.inputPins?.discovery, expectedPins.discovery),
  "input-pins-invalid");
  const bound = bindB1DiscoveryToBatchV654(discovery, batch);
  issues.push(...bound.issues);
  issues.push(...inspectB1PageLedgerContractV654(ledger, bound.candidates).issues);
  const pagePins = [];
  const pageBase = path.resolve(root, B1_PAGE_DIR);
  for (const [index, candidate] of bound.candidates.entries()) {
    const row = ledger.rows?.[index];
    if (!row) continue;
    if (row.responseCaptured !== 1 || !row.artifact?.path) {
      issues.push(`${candidate.id}:page-not-captured`);
      continue;
    }
    if (!within(root, row.artifact.path, pageBase)) {
      issues.push(`${candidate.id}:page-artifact-path-escaped`);
      continue;
    }
    try {
      const bytes = await boundedRead(root, row.artifact.path, B1_MAX_PAGE_BYTES);
      const inspected = inspectB1CapturedPageV654(bytes, row, candidate);
      issues.push(...inspected.issues.map((code) => `${candidate.id}:${code}`));
      pagePins.push({ id: candidate.id, ...inspected.pin,
        pageStatus: inspected.parsed.status,
        officialCredit: inspected.parsed.officialCredit,
        directJpegUrl: inspected.parsed.directJpegUrl });
    } catch (error) {
      issues.push(`${candidate.id}:artifact-read-error:${error?.message ?? error}`);
    }
  }
  const status = issues.length === 0 && pagePins.length === 6
    ? "verified-six-b1-official-pages-candidate" : "blocked";
  return Object.freeze({ schema: AUDIT_SCHEMA, status,
    issues: Object.freeze(issues), runId: ledger.runId,
    ledger: pin(ledgerRelative, ledgerBytes), inputPins: expectedPins,
    artifacts: Object.freeze(pagePins),
    counts: { total: 6, responseCaptured: pagePins.length,
      officialPageCandidateVerified: pagePins.filter((item) =>
        item.pageStatus === "verified-official-page-candidate").length,
      rightsSigned: 0 },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false, runtimePromotion: "closed" },
    claims: { copyrightApproval: false, scientificValidity: false,
      publicWebReleaseApproved: false, realUserValidation: false } });
}

export function replayB1SourceAuditV654(saved, fresh) {
  if (saved?.schema !== AUDIT_SCHEMA
    || saved.status !== "verified-six-b1-official-pages-candidate"
    || fresh.status !== saved.status || fresh.issues?.length !== 0
    || !same(saved.issues, fresh.issues)
    || !same(saved.ledger, fresh.ledger)
    || !same(saved.inputPins, fresh.inputPins)
    || !same(saved.artifacts, fresh.artifacts)
    || !same(saved.counts, fresh.counts)
    || !same(saved.boundary, fresh.boundary)
    || !same(saved.claims, fresh.claims)
    || saved.counts.rightsSigned !== 0
    || saved.claims.copyrightApproval !== false
    || saved.boundary.scientificPayloadWriteback !== false) {
    throw new Error("b1-audit-v654:saved-replay-mismatch");
  }
  return Object.freeze({ status: "replayed-six-b1-official-pages-candidate",
    ledgerSha256: fresh.ledger.sha256,
    pagesCaptured: fresh.counts.responseCaptured,
    rightsSigned: 0, publicWebRelease: "blocked" });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const value = (name) => {
    const index = process.argv.indexOf(name);
    return index < 0 ? null : process.argv[index + 1];
  };
  const ledger = value("--ledger");
  const output = value("--output");
  const replay = value("--replay");
  if (!LEDGER_PATTERN.test(ledger ?? "")
    || (output && !RECEIPT_PATTERN.test(output))
    || (replay && !RECEIPT_PATTERN.test(replay))) {
    throw new Error("b1-audit-v654:usage-invalid");
  }
  const fresh = await auditB1SourcePagesV654(ledger);
  if (output) await writeFile(path.join(ROOT, output),
    `${JSON.stringify(fresh, null, 2)}\n`, { flag: "wx" });
  if (replay) {
    const saved = JSON.parse(await readFile(path.join(ROOT, replay), "utf8"));
    console.log(JSON.stringify(replayB1SourceAuditV654(saved, fresh), null, 2));
  } else console.log(JSON.stringify({ status: fresh.status,
    issues: fresh.issues, counts: fresh.counts,
    ledgerSha256: fresh.ledger.sha256 }, null, 2));
  if (fresh.status === "blocked") process.exitCode = 1;
}

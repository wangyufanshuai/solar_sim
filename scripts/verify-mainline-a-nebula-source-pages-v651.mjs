import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  V651_ARTIFACT_DIR, V651_BATCH_PATH,
  V651_MAX_BYTES, V651_SOURCE_PAGES, artifactPathV651,
  fingerprintSourcePageRequestV651, inspectOfficialSourcePageV651,
  sha256V651, validateBatchRowsV651, validateSourcePageUrlV651,
} from "./mainline-a-nebula-source-page-v651.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEDGER_SCHEMA = "mainline-a-r66-nebula-source-page-ledger-v651";
const AUDIT_SCHEMA = "mainline-a-r66-nebula-source-page-audit-v651";
const SHA = /^[a-f0-9]{64}$/;
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);

function validTimePair(startedAt, endedAt) {
  const start = Date.parse(startedAt);
  const end = Date.parse(endedAt);
  return Number.isFinite(start) && Number.isFinite(end) && end >= start;
}
function appendIssue(issues, ok, code) {
  if (!ok) issues.push(code);
}
function inside(base, candidate) {
  return candidate.startsWith(`${base}${path.sep}`);
}
export function inspectSourcePageLedgerContractV651(ledger, batch) {
  const issues = [];
  const batchCheck = validateBatchRowsV651(batch);
  issues.push(...batchCheck.issues);
  appendIssue(issues, ledger?.schema === LEDGER_SCHEMA
    && ledger.evidenceClass === "external-source"
    && /^20261011-v651page0[1-9]$/.test(ledger.runId ?? "")
    && validTimePair(ledger.startedAt, ledger.endedAt), "ledger-header-invalid");
  appendIssue(issues, ledger?.inputBatch?.path === V651_BATCH_PATH
    && SHA.test(ledger.inputBatch.sha256 ?? "")
    && Number.isInteger(ledger.inputBatch.bytes) && ledger.inputBatch.bytes > 0,
  "input-batch-pin-invalid");
  appendIssue(issues, ledger?.boundary?.candidateOnly === true
    && ledger.boundary.hold === true && ledger.boundary.notAdmitted === true
    && ledger.boundary.scientificPayloadWriteback === false
    && ledger.boundary.runtimePromotion === "closed"
    && ledger?.claims?.copyrightApproval === false
    && ledger.claims.scientificValidity === false
    && ledger.claims.publicWebReleaseApproved === false,
  "release-boundary-promoted");
  const rows = Array.isArray(ledger?.rows) ? ledger.rows : [];
  appendIssue(issues, rows.length === V651_SOURCE_PAGES.length
    && same(rows.map((row) => row.id), V651_SOURCE_PAGES.map((source) => source.id))
    && new Set(rows.map((row) => row.id)).size === V651_SOURCE_PAGES.length,
  "exact-six-source-pages-missing");
  for (const [index, row] of rows.entries()) {
    const source = V651_SOURCE_PAGES[index];
    const batchRow = batch?.rows?.find((entry) => entry.id === source?.id);
    const tag = source?.id ?? index;
    if (!source || !row) continue;
    appendIssue(issues, row.id === source.id && row.nasaId === source.nasaId
      && validateSourcePageUrlV651(row.sourcePageUrl, source)
      && row.expectedCredit === batchRow?.source?.credit
      && row.imageArtifactSha256 === batchRow?.network?.artifact?.sha256
      && SHA.test(row.imageArtifactSha256 ?? "")
      && row.requestFingerprint === fingerprintSourcePageRequestV651(source),
    `${tag}:source-or-image-link-invalid`);
    appendIssue(issues, row.rightsSignoff === "pending"
      && row.runtimeAdmission === "candidate-only"
      && row.scientificPayloadWriteback === false,
    `${tag}:admission-or-rights-promoted`);
    const attempts = Array.isArray(row.attempts) ? row.attempts : [];
    appendIssue(issues, attempts.length >= 1 && attempts.length <= 2
      && new Set(attempts.map((attempt) => attempt.collectionId)).size === 1,
    `${tag}:attempt-count-invalid`);
    let capturedAttempts = 0;
    for (const [attemptIndex, attempt] of attempts.entries()) {
      const label = `${tag}:attempt-${attemptIndex + 1}`;
      appendIssue(issues, attempt.attempt === attemptIndex + 1
        && attempt.retryCount === attemptIndex
        && validTimePair(attempt.startedAt, attempt.endedAt)
        && attempt.timeoutMs >= 1_000 && attempt.timeoutMs <= 60_000
        && attempt.requestExecuted === true
        && attempt.requestUrl === source.url
        && attempt.requestFingerprint === row.requestFingerprint
        && Array.isArray(attempt.redirectChain)
        && attempt.redirectChain[0] === source.url
        && attempt.redirectChain.every((url) => validateSourcePageUrlV651(url, source)),
      `${label}:request-metadata-invalid`);
      const successful = attempt.responseCaptured === 1;
      if (successful) capturedAttempts += 1;
      appendIssue(issues, successful
        ? attempt.httpStatus === 200
          && /^text\/html(?:\s*;|$)/i.test(attempt.contentType ?? "")
          && validateSourcePageUrlV651(attempt.finalUrl, source)
          && attempt.errorClass === null && attempt.timeout === false
          && attempt.responseBytes >= 1_000
          && attempt.responseBytes <= V651_MAX_BYTES
          && SHA.test(attempt.rawPageSha256 ?? "")
          && attempt.rawArtifactPath === artifactPathV651(source, attempt.rawPageSha256)
        : attempt.rawArtifactPath === null
          && attempt.rawPageSha256 === null
          && attempt.responseBytes === null
          && typeof attempt.errorClass === "string"
          && attempt.timeout === (attempt.errorClass === "timeout"),
      `${label}:response-contract-invalid`);
    }
    appendIssue(issues, row.responseCaptured === (capturedAttempts > 0 ? 1 : 0)
      && capturedAttempts <= 1
      && (capturedAttempts === 0 || attempts.at(-1)?.responseCaptured === 1),
    `${tag}:response-count-invalid`);
    if (row.responseCaptured === 1) {
      const successful = attempts.at(-1);
      appendIssue(issues, row.artifact?.path === successful?.rawArtifactPath
        && row.artifact?.sha256 === successful?.rawPageSha256
        && row.artifact?.bytes === successful?.responseBytes
        && row.artifact?.finalUrl === successful?.finalUrl
        && row.persistError === null,
      `${tag}:artifact-not-linked`);
    } else {
      appendIssue(issues, row.artifact === null && row.inspection === null
        && row.sourcePageStatus === "pending",
      `${tag}:network-failure-promoted`);
    }
    appendIssue(issues, row.sourcePageStatus === "pending"
      || row.sourcePageStatus === "verified-official-source-page-candidate",
    `${tag}:source-page-status-invalid`);
  }
  appendIssue(issues, ledger?.counts?.total === rows.length
    && ledger.counts.responseCaptured === rows.filter((row) => row.responseCaptured === 1).length
    && ledger.counts.officialPageCandidateVerified === rows.filter((row) =>
      row.sourcePageStatus === "verified-official-source-page-candidate").length
    && ledger.counts.rightsSigned === 0,
  "counts-invalid");
  return Object.freeze({ ok: issues.length === 0, issues: Object.freeze(issues) });
}

export function inspectCapturedSourcePageV651(bytes, row, source) {
  const issues = [];
  const digest = sha256V651(bytes);
  const expectedPath = artifactPathV651(source, digest);
  appendIssue(issues, bytes.byteLength >= 1_000 && bytes.byteLength <= V651_MAX_BYTES
    && row?.artifact?.sha256 === digest
    && row.artifact.path === expectedPath
    && row.artifact.bytes === bytes.byteLength,
  "raw-artifact-sha-or-size-invalid");
  const inspection = inspectOfficialSourcePageV651(bytes.toString("utf8"), source,
    row?.expectedCredit);
  appendIssue(issues, inspection.status === "verified-official-source-page-candidate"
    && same(row?.inspection, inspection)
    && row?.sourcePageStatus === inspection.status,
  "raw-official-page-contract-invalid");
  return Object.freeze({ ok: issues.length === 0, issues: Object.freeze(issues),
    sha256: digest, bytes: bytes.byteLength, inspection });
}

async function safeRead(relative, root, maximumBytes) {
  const absolute = path.resolve(root, relative);
  if (!inside(path.resolve(root), absolute)) throw new Error("source-page-v651:path-escaped");
  const file = await stat(absolute);
  if (!file.isFile() || file.size < 1 || file.size > maximumBytes) {
    throw new Error("source-page-v651:file-size-invalid");
  }
  return readFile(absolute);
}

export async function auditSourcePageLedgerV651(ledgerRelative, root = ROOT) {
  if (!/^docs\/release\/v607\/mainline-a-r66-nebula-source-page-ledger-20261011-v651page0[1-9]\.json$/.test(
    ledgerRelative ?? "")) throw new Error("source-page-v651:ledger-path-invalid");
  const [ledgerBytes, batchBytes] = await Promise.all([
    safeRead(ledgerRelative, root, 2_000_000),
    safeRead(V651_BATCH_PATH, root, 3_000_000),
  ]);
  const ledger = JSON.parse(ledgerBytes.toString("utf8"));
  const batch = JSON.parse(batchBytes.toString("utf8"));
  const issues = [...inspectSourcePageLedgerContractV651(ledger, batch).issues];
  appendIssue(issues, ledger.inputBatch?.sha256 === sha256V651(batchBytes)
    && ledger.inputBatch?.bytes === batchBytes.byteLength,
  "input-batch-changed");
  const pins = [];
  const artifactBase = path.resolve(root, V651_ARTIFACT_DIR);
  for (const [index, row] of (ledger.rows ?? []).entries()) {
    if (row?.responseCaptured !== 1) continue;
    const source = V651_SOURCE_PAGES[index];
    if (!source || !row.artifact?.path
      || !/^docs\/release\/v607\/nebula-source-pages\/v651\/[a-z0-9-]+-pia\d{5}-[a-f0-9]{64}\.html$/.test(
        row.artifact.path)) {
      issues.push(`${row?.id ?? index}:artifact-path-invalid`);
      continue;
    }
    const absolute = path.resolve(root, row.artifact.path);
    if (!inside(artifactBase, absolute)) {
      issues.push(`${row.id}:artifact-escaped`);
      continue;
    }
    try {
      const bytes = await safeRead(row.artifact.path, root, V651_MAX_BYTES);
      const checked = inspectCapturedSourcePageV651(bytes, row, source);
      issues.push(...checked.issues.map((item) => `${row.id}:${item}`));
      pins.push({ id: row.id, path: row.artifact.path,
        bytes: bytes.byteLength, sha256: checked.sha256,
        sourcePageStatus: checked.inspection.status });
    } catch (error) {
      issues.push(`${row.id}:artifact-read-error:${error?.message ?? error}`);
    }
  }
  const status = issues.length > 0 ? "blocked"
    : ledger.counts.officialPageCandidateVerified === 6
      ? "verified-six-official-pages-candidate" : "attempt-ledger-only";
  return Object.freeze({ schema: AUDIT_SCHEMA,
    status, issues: Object.freeze(issues),
    runId: ledger.runId,
    ledger: { path: ledgerRelative, bytes: ledgerBytes.byteLength,
      sha256: sha256V651(ledgerBytes) },
    inputBatch: { path: V651_BATCH_PATH, bytes: batchBytes.byteLength,
      sha256: sha256V651(batchBytes) },
    artifacts: Object.freeze(pins),
    counts: { total: 6, responseCaptured: ledger.counts.responseCaptured,
      officialPageCandidateVerified: ledger.counts.officialPageCandidateVerified,
      rightsSigned: 0 },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false, runtimePromotion: "closed" },
    claims: { copyrightApproval: false, scientificValidity: false,
      publicWebReleaseApproved: false, realUserValidation: false } });
}

export function replaySourcePageAuditV651(saved, fresh) {
  if (saved?.schema !== AUDIT_SCHEMA
    || saved.status !== "verified-six-official-pages-candidate"
    || fresh.status !== saved.status
    || !same(saved.issues, fresh.issues)
    || !same(saved.ledger, fresh.ledger)
    || !same(saved.inputBatch, fresh.inputBatch)
    || !same(saved.artifacts, fresh.artifacts)
    || !same(saved.counts, fresh.counts)
    || !same(saved.boundary, fresh.boundary)
    || !same(saved.claims, fresh.claims)
    || saved.counts.rightsSigned !== 0
    || saved.claims.copyrightApproval !== false
    || saved.boundary.scientificPayloadWriteback !== false) {
    throw new Error("source-page-v651:saved-audit-replay-mismatch");
  }
  return Object.freeze({ status: "replayed-six-official-pages-candidate",
    ledgerSha256: fresh.ledger.sha256,
    officialPageCandidateVerified: fresh.counts.officialPageCandidateVerified,
    rightsSigned: 0, publicWebRelease: "blocked" });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const value = (name) => {
    const index = process.argv.indexOf(name);
    return index < 0 ? null : process.argv[index + 1];
  };
  const ledgerPath = value("--ledger");
  const output = value("--output");
  const replay = value("--replay");
  if (!ledgerPath || (output && !/^docs\/release\/v607\/[a-z0-9-]+\.json$/.test(output))
    || (replay && !/^docs\/release\/v607\/[a-z0-9-]+\.json$/.test(replay))) {
    throw new Error("source-page-v651:usage-invalid");
  }
  const fresh = await auditSourcePageLedgerV651(ledgerPath);
  if (output) await writeFile(path.join(ROOT, output), `${JSON.stringify(fresh, null, 2)}\n`,
    { flag: "wx" });
  if (replay) {
    const saved = JSON.parse(await readFile(path.join(ROOT, replay), "utf8"));
    console.log(JSON.stringify(replaySourcePageAuditV651(saved, fresh), null, 2));
  } else console.log(JSON.stringify({ status: fresh.status, issues: fresh.issues,
    counts: fresh.counts, ledgerSha256: fresh.ledger.sha256 }, null, 2));
  if (fresh.status === "blocked") process.exitCode = 1;
}

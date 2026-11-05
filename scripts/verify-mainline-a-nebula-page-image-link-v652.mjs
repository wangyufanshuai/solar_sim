import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditSourcePageLedgerV651 } from "./verify-mainline-a-nebula-source-pages-v651.mjs";
import { verifyBatchFile } from "./verify-mainline-a-nebula-batch-v628.mjs";
import {
  V652_ARTIFACT_DIR, V652_IMAGE_BATCH, V652_MAX_BYTES,
  V652_PAGE_AUDIT, V652_PAGE_LEDGER,
  extractOfficialJpegUrlV652, fingerprintOfficialJpegRequestV652,
  inspectJpegBytesV652, officialJpegArtifactPathV652,
  sha256V652, validatePageImageInputsV652,
} from "./mainline-a-nebula-page-image-link-v652.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA = "mainline-a-r66-nebula-page-image-link-ledger-v652";
const AUDIT_SCHEMA = "mainline-a-r66-nebula-page-image-link-audit-v652";
const LEDGER_PATTERN = /^docs\/release\/v607\/mainline-a-r66-nebula-page-image-link-ledger-20261011-v652link0[1-9]\.json$/;
const RECEIPT_PATTERN = /^docs\/release\/v607\/[a-z0-9-]+\.json$/;
const SHA_PATTERN = /^[a-f0-9]{64}$/;
const JPEG_MIME = /^image\/jpeg(?:\s*;|$)/i;
const ERROR_CLASSES = new Set([
  "timeout", "network-error", "http-status", "content-type",
  "body-too-large", "jpeg-invalid", "redirect-blocked",
]);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const samePinMap = (actual, expected) => ["pageLedger", "pageAudit", "imageBatch"]
  .every((role) => actual?.[role]?.path === expected[role].path
    && actual[role].bytes === expected[role].bytes
    && actual[role].sha256 === expected[role].sha256);

function inside(base, target) {
  return target.startsWith(`${base}${path.sep}`);
}
function issueWhen(issues, condition, code) {
  if (!condition) issues.push(code);
}
function validTimePair(startedAt, endedAt) {
  const start = Date.parse(startedAt);
  const end = Date.parse(endedAt);
  return Number.isFinite(start) && Number.isFinite(end) && end >= start;
}
async function boundedRead(root, relative, maximumBytes) {
  const absolute = path.resolve(root, relative);
  if (!inside(path.resolve(root), absolute)) throw new Error("link-v652:path-escaped");
  const info = await stat(absolute);
  if (!info.isFile() || info.size < 1 || info.size > maximumBytes) {
    throw new Error("link-v652:file-size-invalid");
  }
  return readFile(absolute);
}
function pin(relative, bytes) {
  return Object.freeze({ path: relative, bytes: bytes.byteLength,
    sha256: sha256V652(bytes) });
}

export function inspectLinkAttemptV652(attempt, row, index, total) {
  const issues = [];
  const fingerprint = fingerprintOfficialJpegRequestV652(
    row.officialDownloadUrl, row.nasaId);
  issueWhen(issues, attempt?.attempt === index + 1
    && attempt.retryCount === index
    && typeof attempt.collectionId === "string"
    && attempt.collectionId.length > 0,
  "attempt-number-or-collection-invalid");
  issueWhen(issues, validTimePair(attempt?.startedAt, attempt?.endedAt)
    && attempt.timeoutMs > 0 && attempt.requestExecuted === true,
  "attempt-time-or-request-invalid");
  issueWhen(issues, attempt.requestUrl === row.officialDownloadUrl
    && attempt.requestFingerprint === fingerprint
    && row.requestFingerprint === fingerprint,
  "request-fingerprint-invalid");
  if (attempt.responseCaptured === 1) {
    issueWhen(issues, index === total - 1 && row.responseCaptured === 1
      && attempt.httpStatus === 200
      && JPEG_MIME.test(attempt.contentType ?? "")
      && attempt.finalUrl === row.officialDownloadUrl
      && same(attempt.redirectChain, [row.officialDownloadUrl])
      && attempt.errorClass === null
      && attempt.errorMessage === null
      && attempt.timeout === false
      && attempt.responseBytes === row.artifact?.bytes
      && attempt.rawSha256 === row.artifact?.sha256
      && attempt.rawArtifactPath === row.artifact?.path,
    "captured-attempt-invalid");
  } else {
    issueWhen(issues, attempt.responseCaptured === 0
      && ERROR_CLASSES.has(attempt.errorClass)
      && attempt.rawArtifactPath === null
      && attempt.rawSha256 === null
      && attempt.responseBytes === null
      && attempt.timeout === (attempt.errorClass === "timeout")
      && (attempt.httpStatus === null
        || Number.isInteger(attempt.httpStatus))
      && (attempt.errorClass !== "http-status"
        || Number.isInteger(attempt.httpStatus)),
    "failed-attempt-invalid");
  }
  return Object.freeze(issues);
}

export function inspectLinkLedgerContractV652(ledger, candidates, officialUrls) {
  const issues = [];
  issueWhen(issues, ledger?.schema === SCHEMA
    && ledger.evidenceClass === "external-source"
    && /^20261011-v652link0[1-9]$/.test(ledger.runId ?? "")
    && validTimePair(ledger.startedAt, ledger.endedAt),
  "ledger-identity-invalid");
  issueWhen(issues, ledger?.rows?.length === 6 && candidates?.length === 6
    && officialUrls?.length === 6 && ledger.counts?.total === 6,
  "six-row-coverage-invalid");
  issueWhen(issues, ledger?.boundary?.candidateOnly === true
    && ledger.boundary.hold === true
    && ledger.boundary.notAdmitted === true
    && ledger.boundary.scientificPayloadWriteback === false
    && ledger.boundary.runtimePromotion === "closed"
    && ledger.claims?.copyrightApproval === false
    && ledger.claims.scientificValidity === false
    && ledger.claims.publicWebReleaseApproved === false
    && ledger.claims.realUserValidation === false
    && ledger.counts?.rightsSigned === 0,
  "admission-or-rights-forgery");
  const responseCount = ledger?.rows?.filter((row) => row.responseCaptured === 1).length ?? -1;
  const identicalCount = ledger?.rows?.filter((row) => row.byteIdentical === true).length ?? -1;
  issueWhen(issues, ledger?.counts?.responseCaptured === responseCount
    && ledger?.counts?.byteIdentical === identicalCount,
  "declared-counts-invalid");
  for (let index = 0; index < 6; index += 1) {
    const row = ledger?.rows?.[index];
    const candidate = candidates?.[index];
    const officialUrl = officialUrls?.[index];
    if (!row || !candidate || !officialUrl) continue;
    const prefix = `${candidate.id}:`;
    issueWhen(issues, row.id === candidate.id
      && row.nasaId === candidate.nasaId
      && row.sourcePageUrl === candidate.sourcePageUrl
      && row.sourcePageRawSha256 === candidate.pageArtifact.sha256
      && row.officialDownloadUrl === officialUrl
      && same(row.candidateImageArtifact, candidate.imageArtifact),
    `${prefix}cross-source-identity-invalid`);
    issueWhen(issues, row.rightsSignoff === "pending"
      && row.runtimeAdmission === "candidate-only"
      && row.scientificPayloadWriteback === false
      && row.persistError === null,
    `${prefix}rights-or-persist-invalid`);
    issueWhen(issues, row.responseCaptured === 0
      || (SHA_PATTERN.test(row.artifact?.sha256 ?? "")
        && SHA_PATTERN.test(row.candidateImageArtifact?.sha256 ?? "")),
    `${prefix}artifact-digest-invalid`);
    issueWhen(issues, [0, 1].includes(row.responseCaptured)
      && row.attempts?.length >= 1 && row.attempts.length <= 2
      && row.attempts.every((attempt) => attempt.collectionId
        === row.attempts[0].collectionId),
    `${prefix}attempt-sequence-invalid`);
    for (const [attemptIndex, attempt] of (row.attempts ?? []).entries()) {
      issues.push(...inspectLinkAttemptV652(attempt, row, attemptIndex,
        row.attempts.length).map((code) => `${prefix}${code}`));
    }
    const capturedCount = row.attempts?.filter((attempt) =>
      attempt.responseCaptured === 1).length ?? -1;
    issueWhen(issues, capturedCount === row.responseCaptured,
    `${prefix}capture-count-invalid`);
    issueWhen(issues, row.byteIdentical === true
      ? row.sourceLinkStatus === "byte-identical-candidate"
      : row.sourceLinkStatus === "pending",
    `${prefix}link-status-invalid`);
  }
  return Object.freeze({ ok: issues.length === 0,
    issues: Object.freeze(issues) });
}

export function inspectCapturedImageRowV652(row, candidate,
  officialBytes, candidateBytes) {
  const issues = [];
  const official = inspectJpegBytesV652(officialBytes);
  const stored = inspectJpegBytesV652(candidateBytes);
  const expectedPath = officialJpegArtifactPathV652(row.id,
    row.nasaId, official.sha256);
  issueWhen(issues, official.ok && stored.ok,
    "jpeg-bytes-invalid");
  issueWhen(issues, row.artifact?.path === expectedPath
    && row.artifact?.bytes === official.bytes
    && row.artifact?.sha256 === official.sha256
    && row.artifact?.finalUrl === row.officialDownloadUrl
    && JPEG_MIME.test(row.artifact?.contentType ?? ""),
  "official-artifact-mismatch");
  issueWhen(issues, candidate.imageArtifact.sha256 === stored.sha256
    && candidate.imageArtifact.bytes === stored.bytes,
  "candidate-artifact-mismatch");
  const identical = Buffer.from(officialBytes).equals(Buffer.from(candidateBytes));
  issueWhen(issues, row.byteIdentical === identical
    && row.sourceLinkStatus === (identical
      ? "byte-identical-candidate" : "pending"),
  "byte-comparison-forged");
  return Object.freeze({ ok: issues.length === 0,
    issues: Object.freeze(issues),
    evidence: Object.freeze({ id: row.id,
      official: pin(row.artifact.path, officialBytes),
      candidate: pin(candidate.imageArtifact.path, candidateBytes),
      byteIdentical: identical,
      relationship: identical ? "exact-byte-link-candidate" : "variant-pending" }) });
}

export async function auditPageImageLinkLedgerV652(ledgerRelative, root = ROOT) {
  if (!LEDGER_PATTERN.test(ledgerRelative ?? "")) {
    throw new Error("link-v652:ledger-path-invalid");
  }
  const [ledgerBytes, pageLedgerBytes, pageAuditBytes, batchBytes] = await Promise.all([
    boundedRead(root, ledgerRelative, 2_000_000),
    boundedRead(root, V652_PAGE_LEDGER, 2_000_000),
    boundedRead(root, V652_PAGE_AUDIT, 2_000_000),
    boundedRead(root, V652_IMAGE_BATCH, 3_000_000),
  ]);
  const ledger = JSON.parse(ledgerBytes.toString("utf8"));
  const pageLedger = JSON.parse(pageLedgerBytes.toString("utf8"));
  const pageAudit = JSON.parse(pageAuditBytes.toString("utf8"));
  const batch = JSON.parse(batchBytes.toString("utf8"));
  const issues = [];
  const expectedInputPins = { pageLedger: pin(V652_PAGE_LEDGER, pageLedgerBytes),
    pageAudit: pin(V652_PAGE_AUDIT, pageAuditBytes),
    imageBatch: pin(V652_IMAGE_BATCH, batchBytes) };
  issueWhen(issues, samePinMap(ledger.inputPins, expectedInputPins),
  "input-pins-invalid");
  const pageFresh = await auditSourcePageLedgerV651(V652_PAGE_LEDGER, root);
  issueWhen(issues, pageFresh.status === "verified-six-official-pages-candidate"
    && same(pageFresh, pageAudit), "source-page-replay-failed");
  const imageFresh = verifyBatchFile(root);
  issueWhen(issues, imageFresh.status === "passed"
    && imageFresh.fileSha256 === expectedInputPins.imageBatch.sha256
    && imageFresh.recomputed?.captured === 6,
  "candidate-image-replay-failed");
  const inputs = validatePageImageInputsV652(pageLedger, pageAudit, batch);
  issues.push(...inputs.issues);
  const urls = [];
  for (const candidate of inputs.candidates) {
    const bytes = await boundedRead(root, candidate.pageArtifact.path, 3_000_000);
    issueWhen(issues, sha256V652(bytes) === candidate.pageArtifact.sha256,
    `${candidate.id}:source-page-raw-drift`);
    urls.push(extractOfficialJpegUrlV652(bytes.toString("utf8"), candidate.nasaId));
  }
  const contract = inspectLinkLedgerContractV652(ledger, inputs.candidates, urls);
  issues.push(...contract.issues);
  const captured = [];
  const artifactBase = path.resolve(root, V652_ARTIFACT_DIR);
  for (const [index, candidate] of inputs.candidates.entries()) {
    const row = ledger.rows?.[index];
    if (!row) continue;
    if (row.responseCaptured !== 1 || !row.artifact?.path) {
      issues.push(`${candidate.id}:official-image-not-captured`);
      continue;
    }
    const absolute = path.resolve(root, row.artifact.path);
    if (!inside(artifactBase, absolute)) {
      issues.push(`${candidate.id}:official-artifact-path-escaped`);
      continue;
    }
    try {
      const [officialBytes, candidateBytes] = await Promise.all([
        boundedRead(root, row.artifact.path, V652_MAX_BYTES),
        boundedRead(root, candidate.imageArtifact.path, V652_MAX_BYTES),
      ]);
      const checked = inspectCapturedImageRowV652(row, candidate,
        officialBytes, candidateBytes);
      issues.push(...checked.issues.map((code) => `${candidate.id}:${code}`));
      captured.push(checked.evidence);
    } catch (error) {
      issues.push(`${candidate.id}:artifact-read-error:${error?.message ?? error}`);
    }
  }
  const byteIdentical = captured.filter((entry) => entry.byteIdentical).length;
  const status = issues.length === 0 && captured.length === 6
    ? "verified-six-official-jpegs-candidate-with-variant-counts"
    : "blocked";
  return Object.freeze({ schema: AUDIT_SCHEMA, status,
    issues: Object.freeze(issues), runId: ledger.runId,
    ledger: pin(ledgerRelative, ledgerBytes),
    inputPins: expectedInputPins,
    artifacts: Object.freeze(captured),
    counts: { total: 6, responseCaptured: captured.length,
      byteIdentical, variantPending: captured.length - byteIdentical,
      rightsSigned: 0 },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false, runtimePromotion: "closed" },
    claims: { copyrightApproval: false, scientificValidity: false,
      publicWebReleaseApproved: false, realUserValidation: false } });
}

export function replayPageImageLinkAuditV652(saved, fresh) {
  if (saved?.schema !== AUDIT_SCHEMA || saved.status !== fresh.status
    || saved.status !== "verified-six-official-jpegs-candidate-with-variant-counts"
    || fresh.issues?.length !== 0
    || !same(saved.issues, fresh.issues)
    || !same(saved.ledger, fresh.ledger)
    || !same(saved.inputPins, fresh.inputPins)
    || !same(saved.artifacts, fresh.artifacts)
    || !same(saved.counts, fresh.counts)
    || !same(saved.boundary, fresh.boundary)
    || !same(saved.claims, fresh.claims)
    || !Number.isInteger(saved.counts.byteIdentical)
    || saved.counts.byteIdentical < 0
    || saved.counts.byteIdentical > 6
    || saved.counts.variantPending !== 6 - saved.counts.byteIdentical
    || saved.counts.rightsSigned !== 0
    || saved.claims.copyrightApproval !== false
    || saved.boundary.scientificPayloadWriteback !== false) {
    throw new Error("link-v652:saved-audit-replay-mismatch");
  }
  return Object.freeze({ status: "replayed-six-official-jpegs-candidate",
    ledgerSha256: fresh.ledger.sha256,
    byteIdentical: fresh.counts.byteIdentical,
    variantPending: fresh.counts.variantPending,
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
    throw new Error("link-v652:usage-invalid");
  }
  const fresh = await auditPageImageLinkLedgerV652(ledger);
  if (output) await writeFile(path.join(ROOT, output),
    `${JSON.stringify(fresh, null, 2)}\n`, { flag: "wx" });
  if (replay) {
    const saved = JSON.parse(await readFile(path.join(ROOT, replay), "utf8"));
    console.log(JSON.stringify(replayPageImageLinkAuditV652(saved, fresh), null, 2));
  } else console.log(JSON.stringify({ status: fresh.status,
    issues: fresh.issues, counts: fresh.counts,
    ledgerSha256: fresh.ledger.sha256 }, null, 2));
  if (fresh.status === "blocked") process.exitCode = 1;
}

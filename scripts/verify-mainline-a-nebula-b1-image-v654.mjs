import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  fingerprintOfficialJpegRequestV652, inspectJpegBytesV652,
  safeOfficialJpegUrlV652,
} from "./mainline-a-nebula-page-image-link-v652.mjs";
import { replayBatch } from "./replay-mainline-a-nebula-batch-v624.mjs";
import {
  B1_BATCH, B1_IMAGE_DIR, B1_MAX_JPEG_BYTES,
  sha256B1V654,
} from "./mainline-a-nebula-b1-source-v654.mjs";
import {
  B1_PAGE_AUDIT_V654, B1_PAGE_LEDGER_V654,
  b1OfficialImagePathV654, validateB1ImageCandidateV654,
} from "./collect-mainline-a-nebula-b1-image-v654.mjs";
import {
  auditB1SourcePagesV654, replayB1SourceAuditV654,
} from "./verify-mainline-a-nebula-b1-v654.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEDGER = "docs/release/v607/mainline-a-r67-b1-page-image-ledger-20261012-v654b1image01.json";
const SCHEMA = "mainline-a-r67-b1-page-image-audit-v654";
const STATUS = "verified-six-b1-official-jpegs-pixel-equivalent-candidate";
const SHA = /^[a-f0-9]{64}$/;
const OUTPUT = /^docs\/release\/v607\/[a-z0-9-]+\.json$/;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function pin(relative, bytes) {
  return Object.freeze({ path: relative, bytes: bytes.byteLength,
    sha256: sha256B1V654(bytes) });
}
function issue(issues, condition, code) {
  if (!condition) issues.push(code);
}
function within(root, relative, base = root) {
  const absolute = path.resolve(root, relative);
  return absolute.startsWith(`${path.resolve(base)}${path.sep}`);
}
function timePair(start, end) {
  const a = Date.parse(start);
  const b = Date.parse(end);
  return Number.isFinite(a) && Number.isFinite(b) && b >= a;
}
function equalPin(actual, expected) {
  return actual?.path === expected.path && actual?.sha256 === expected.sha256
    && actual?.bytes === expected.bytes;
}
function closedBoundary(value) {
  return value?.candidateOnly === true && value.hold === true
    && value.notAdmitted === true
    && value.scientificPayloadWriteback === false
    && value.runtimePromotion === "closed";
}
function closedClaims(value) {
  return value?.copyrightApproval === false
    && value.scientificValidity === false
    && value.publicWebReleaseApproved === false
    && value.realUserValidation === false;
}

export function inspectB1ImageAttemptV654(attempt, row, index, total) {
  const issues = [];
  let fingerprint = null;
  try { fingerprint = fingerprintOfficialJpegRequestV652(
    row.officialDownloadUrl, row.nasaId); } catch { /* issue below */ }
  issue(issues, attempt?.attempt === index + 1
    && attempt.retryCount === index
    && typeof attempt.collectionId === "string"
    && attempt.collectionId.length >= 8
    && attempt.requestExecuted === true
    && attempt.timeoutMs > 0
    && timePair(attempt.startedAt, attempt.endedAt),
  "attempt-sequence-or-time-invalid");
  issue(issues, fingerprint !== null
    && row.requestFingerprint === fingerprint
    && attempt.requestFingerprint === fingerprint
    && attempt.requestUrl === row.officialDownloadUrl,
  "request-fingerprint-invalid");
  if (attempt.responseCaptured === 1) {
    issue(issues, index === total - 1 && row.responseCaptured === 1
      && attempt.httpStatus === 200
      && /^image\/jpeg(?:\s*;|$)/i.test(attempt.contentType ?? "")
      && attempt.finalUrl === row.officialDownloadUrl
      && same(attempt.redirectChain, [row.officialDownloadUrl])
      && attempt.errorClass === null && attempt.errorMessage === null
      && attempt.timeout === false
      && attempt.responseBytes === row.artifact?.bytes
      && attempt.rawSha256 === row.artifact?.sha256
      && attempt.rawArtifactPath === row.artifact?.path,
    "captured-attempt-invalid");
  } else {
    issue(issues, attempt.responseCaptured === 0
      && ["timeout", "network-error", "redirect-blocked",
        "http-status", "content-type", "body-too-large",
        "jpeg-invalid"].includes(attempt.errorClass)
      && attempt.timeout === (attempt.errorClass === "timeout")
      && attempt.responseBytes === null
      && attempt.rawSha256 === null
      && attempt.rawArtifactPath === null,
    "failed-attempt-forged");
  }
  return Object.freeze(issues);
}

export function inspectB1ImageLedgerContractV654(ledger,
  pageLedger, pageAudit, batch) {
  const issues = [];
  issue(issues, ledger?.schema === "mainline-a-r67-b1-page-image-ledger-v654"
    && /^20261012-v654b1image0[1-9]$/.test(ledger.runId ?? "")
    && ledger.evidenceClass === "external-source"
    && timePair(ledger.startedAt, ledger.endedAt),
  "ledger-identity-invalid");
  issue(issues, ledger?.rows?.length === 6
    && pageLedger?.rows?.length === 6
    && pageAudit?.artifacts?.length === 6
    && batch?.rows?.length === 6,
  "six-candidate-coverage-invalid");
  issue(issues, closedBoundary(ledger?.boundary)
    && closedClaims(ledger?.claims)
    && ledger.counts?.rightsSigned === 0,
  "release-boundary-promoted");
  const captured = ledger?.rows?.filter((item) =>
    item.responseCaptured === 1).length ?? -1;
  const byteIdentical = ledger?.rows?.filter((item) =>
    item.byteIdentical === true).length ?? -1;
  issue(issues, ledger?.counts?.total === 6
    && ledger.counts.responseCaptured === captured
    && ledger.counts.byteIdentical === byteIdentical,
  "declared-counts-invalid");
  for (let index = 0; index < 6; index += 1) {
    const row = ledger?.rows?.[index];
    const page = pageLedger?.rows?.[index];
    const pinFromPage = pageAudit?.artifacts?.[index];
    const image = batch?.rows?.[index];
    if (!row || !page || !pinFromPage || !image) continue;
    const prefix = `${image.id}:`;
    const candidate = { id: image.id, nasaId: page.nasaId,
      pageUrl: page.pageUrl, expectedCredit: image.source?.credit,
      candidateImageArtifact: image.network?.artifact };
    issues.push(...validateB1ImageCandidateV654(candidate,
      pinFromPage, page).issues.map((code) => `${prefix}${code}`));
    issue(issues, row.id === image.id
      && row.nasaId === page.nasaId
      && row.sourcePageUrl === page.pageUrl
      && row.sourcePageRawSha256 === pinFromPage.sha256
      && row.officialDownloadUrl === pinFromPage.directJpegUrl
      && safeOfficialJpegUrlV652(row.officialDownloadUrl, row.nasaId)
      && same(row.candidateImageArtifact, image.network.artifact),
    `${prefix}cross-source-link-invalid`);
    issue(issues, row.rightsSignoff === "pending"
      && row.runtimeAdmission === "candidate-only"
      && row.scientificPayloadWriteback === false
      && row.persistError === null,
    `${prefix}row-admission-invalid`);
    issue(issues, Array.isArray(row.attempts)
      && row.attempts.length >= 1 && row.attempts.length <= 2
      && row.attempts.every((item) => item.collectionId
        === row.attempts[0].collectionId),
    `${prefix}attempts-invalid`);
    for (const [attemptIndex, attempt] of (row.attempts ?? []).entries()) {
      issues.push(...inspectB1ImageAttemptV654(attempt, row,
        attemptIndex, row.attempts.length).map((code) => `${prefix}${code}`));
    }
    issue(issues, row.attempts?.filter((item) =>
      item.responseCaptured === 1).length === row.responseCaptured,
    `${prefix}captured-attempt-count-invalid`);
    issue(issues, row.responseCaptured === 1
      ? row.artifact?.path === b1OfficialImagePathV654(candidate,
        row.artifact?.sha256)
        && row.sourceLinkStatus === (row.byteIdentical
          ? "byte-identical-candidate" : "pending")
      : row.artifact === null && row.byteIdentical === false
        && row.sourceLinkStatus === "pending",
    `${prefix}raw-artifact-status-invalid`);
  }
  return Object.freeze({ ok: issues.length === 0,
    issues: Object.freeze(issues) });
}

export async function decodedB1PixelsV654(relative) {
  if (!within(ROOT, relative)) throw new Error("b1-image-audit:pixel-path-escaped");
  const { data, info } = await sharp(path.resolve(ROOT, relative), {
    failOn: "error", limitInputPixels: 100_000_000,
  }).raw().toBuffer({ resolveWithObject: true });
  if (!(info.width > 0 && info.height > 0
    && info.channels >= 1 && info.channels <= 4
    && data.byteLength === info.width * info.height * info.channels)) {
    throw new Error("b1-image-audit:decoded-pixels-invalid");
  }
  return Object.freeze({ width: info.width, height: info.height,
    channels: info.channels, decodedBytes: data.byteLength,
    pixelSha256: sha256B1V654(data) });
}
export function compareB1PixelsV654(official, candidate, rawByteIdentical) {
  const equal = official?.width === candidate?.width
    && official?.height === candidate?.height
    && official?.channels === candidate?.channels
    && official?.decodedBytes === candidate?.decodedBytes
    && SHA.test(official?.pixelSha256 ?? "")
    && official.pixelSha256 === candidate.pixelSha256;
  const issues = [];
  if (!equal) issues.push("decoded-pixels-differ");
  if (rawByteIdentical === true && !equal) {
    issues.push("raw-identical-pixels-differ");
  }
  return Object.freeze({ pixelIdentical: equal,
    issues: Object.freeze(issues) });
}

export async function auditB1ImageLinksV654(root = ROOT,
  ledgerPath = LEDGER) {
  if (!/^docs\/release\/v607\/mainline-a-r67-b1-page-image-ledger-20261012-v654b1image0[1-9]\.json$/.test(ledgerPath)) {
    throw new Error("b1-image-audit:ledger-path-invalid");
  }
  const read = async (relative, max) => {
    const absolute = path.resolve(root, relative);
    if (!absolute.startsWith(`${path.resolve(root)}${path.sep}`)) {
      throw new Error("b1-image-audit:input-path-escaped");
    }
    const info = await stat(absolute);
    if (!info.isFile() || info.size < 100 || info.size > max) {
      throw new Error("b1-image-audit:input-size-invalid");
    }
    return readFile(absolute);
  };
  const [ledgerBytes, pageLedgerBytes, pageAuditBytes,
    batchBytes] = await Promise.all([
    read(ledgerPath, 2_000_000), read(B1_PAGE_LEDGER_V654, 2_000_000),
    read(B1_PAGE_AUDIT_V654, 2_000_000), read(B1_BATCH, 3_000_000),
  ]);
  const ledger = JSON.parse(ledgerBytes.toString("utf8"));
  const pages = JSON.parse(pageLedgerBytes.toString("utf8"));
  const savedPageAudit = JSON.parse(pageAuditBytes.toString("utf8"));
  const batch = JSON.parse(batchBytes.toString("utf8"));
  const issues = [];
  const freshPages = await auditB1SourcePagesV654(B1_PAGE_LEDGER_V654, root);
  try { replayB1SourceAuditV654(savedPageAudit, freshPages); }
  catch { issues.push("source-page-audit-no-longer-replays"); }
  const imageReplay = await replayBatch(batch);
  issue(issues, imageReplay.status === "verified-with-rights-pending"
    && imageReplay.counts.recomputed.artifactVerified === 6,
  "candidate-image-batch-no-longer-replays");
  const inputPins = { pageLedger: pin(B1_PAGE_LEDGER_V654, pageLedgerBytes),
    pageAudit: pin(B1_PAGE_AUDIT_V654, pageAuditBytes),
    imageBatch: pin(B1_BATCH, batchBytes) };
  issue(issues, equalPin(ledger.inputPins?.pageLedger, inputPins.pageLedger)
    && equalPin(ledger.inputPins?.pageAudit, inputPins.pageAudit)
    && equalPin(ledger.inputPins?.imageBatch, inputPins.imageBatch),
  "input-pins-invalid");
  issues.push(...inspectB1ImageLedgerContractV654(ledger,
    pages, savedPageAudit, batch).issues);
  const rows = [];
  for (let index = 0; index < 6; index += 1) {
    const row = ledger.rows?.[index];
    if (!row) continue;
    if (row.responseCaptured !== 1 || !row.artifact?.path) {
      issues.push(`${row.id}:official-image-not-captured`);
      continue;
    }
    if (!within(root, row.artifact.path,
      path.resolve(root, B1_IMAGE_DIR))
      || !within(root, row.candidateImageArtifact?.path,
        path.resolve(root, "docs/release/v607/nebula-image-artifacts"))) {
      issues.push(`${row.id}:image-path-escaped`);
      continue;
    }
    try {
      const [officialBytes, candidateBytes] = await Promise.all([
        read(row.artifact.path, B1_MAX_JPEG_BYTES),
        read(row.candidateImageArtifact.path, B1_MAX_JPEG_BYTES),
      ]);
      const official = pin(row.artifact.path, officialBytes);
      const candidate = pin(row.candidateImageArtifact.path,
        candidateBytes);
      const officialJpeg = inspectJpegBytesV652(officialBytes);
      const candidateJpeg = inspectJpegBytesV652(candidateBytes);
      issue(issues, officialJpeg.ok && candidateJpeg.ok
        && equalPin(row.artifact, official)
        && equalPin(row.candidateImageArtifact, candidate)
        && row.artifact.finalUrl === row.officialDownloadUrl
        && /^image\/jpeg(?:\s*;|$)/i.test(row.artifact.contentType ?? ""),
      `${row.id}:raw-image-sha-or-jpeg-invalid`);
      const byteIdentical = same({ sha256: official.sha256,
        bytes: official.bytes }, { sha256: candidate.sha256,
        bytes: candidate.bytes });
      issue(issues, row.byteIdentical === byteIdentical,
        `${row.id}:declared-byte-comparison-invalid`);
      const [officialPixels, candidatePixels] = await Promise.all([
        decodedB1PixelsV654(row.artifact.path),
        decodedB1PixelsV654(row.candidateImageArtifact.path),
      ]);
      const compared = compareB1PixelsV654(officialPixels,
        candidatePixels, byteIdentical);
      issues.push(...compared.issues.map((code) => `${row.id}:${code}`));
      rows.push({ id: row.id, nasaId: row.nasaId,
        sourcePageUrl: row.sourcePageUrl,
        officialDownloadUrl: row.officialDownloadUrl,
        officialRaw: official, candidateRaw: candidate,
        officialPixels, candidatePixels,
        rawByteIdentical: byteIdentical,
        decodedPixelIdentical: compared.pixelIdentical,
        sourceLinkStatus: compared.pixelIdentical
          ? "decoded-pixel-equivalent-candidate" : "pending",
        rightsSignoff: "pending", scientificPayloadWriteback: false });
    } catch (error) {
      issues.push(`${row.id}:artifact-audit-failed:${error?.message ?? error}`);
    }
  }
  const pixelIdentical = rows.filter((row) =>
    row.decodedPixelIdentical).length;
  const byteIdentical = rows.filter((row) => row.rawByteIdentical).length;
  return Object.freeze({ schema: SCHEMA,
    status: issues.length === 0 && pixelIdentical === 6 ? STATUS : "blocked",
    issues: Object.freeze(issues),
    decoder: Object.freeze({ library: "sharp",
      sharpVersion: sharp.versions.sharp,
      vipsVersion: sharp.versions.vips,
      nodeVersion: process.version, platform: process.platform,
      architecture: process.arch, colorTransform: "default-sharp-raw" }),
    inputs: Object.freeze({ ledger: pin(ledgerPath, ledgerBytes),
      ...inputPins }), rows: Object.freeze(rows),
    counts: { total: 6, responseCaptured: rows.length,
      rawByteIdentical: byteIdentical,
      decodedPixelIdentical: pixelIdentical,
      rawVariantsWithIdenticalPixels: pixelIdentical - byteIdentical,
      rightsSigned: 0 },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false, runtimePromotion: "closed" },
    claims: { copyrightApproval: false, scientificValidity: false,
      publicWebReleaseApproved: false, realUserValidation: false } });
}

export function replayB1ImageAuditV654(saved, fresh) {
  if (saved?.schema !== SCHEMA || saved.status !== STATUS
    || fresh.status !== STATUS || fresh.issues?.length !== 0
    || !same(saved.decoder, fresh.decoder)
    || !same(saved.inputs, fresh.inputs)
    || !same(saved.rows, fresh.rows)
    || !same(saved.counts, fresh.counts)
    || !same(saved.boundary, fresh.boundary)
    || !same(saved.claims, fresh.claims)
    || saved.counts.decodedPixelIdentical !== 6
    || saved.counts.rightsSigned !== 0
    || saved.claims.copyrightApproval !== false
    || saved.boundary.scientificPayloadWriteback !== false) {
    throw new Error("b1-image-audit:saved-replay-mismatch");
  }
  return Object.freeze({ status: "replayed-six-b1-official-jpegs-candidate",
    decodedPixelIdentical: fresh.counts.decodedPixelIdentical,
    rawByteIdentical: fresh.counts.rawByteIdentical,
    rightsSigned: 0, publicWebRelease: "blocked" });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const value = (name) => {
    const index = process.argv.indexOf(name);
    return index < 0 ? null : process.argv[index + 1];
  };
  const output = value("--output");
  const replay = value("--replay");
  if ((output && !OUTPUT.test(output)) || (replay && !OUTPUT.test(replay))) {
    throw new Error("b1-image-audit:usage-invalid");
  }
  const fresh = await auditB1ImageLinksV654();
  if (output) await writeFile(path.join(ROOT, output),
    `${JSON.stringify(fresh, null, 2)}\n`, { flag: "wx" });
  if (replay) {
    const saved = JSON.parse(await readFile(path.join(ROOT, replay), "utf8"));
    console.log(JSON.stringify(replayB1ImageAuditV654(saved, fresh), null, 2));
  } else console.log(JSON.stringify({ status: fresh.status,
    issues: fresh.issues, counts: fresh.counts,
    ledgerSha256: fresh.inputs.ledger.sha256 }, null, 2));
  if (fresh.status === "blocked") process.exitCode = 1;
}

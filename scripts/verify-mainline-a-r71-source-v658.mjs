import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { decodedPixelDigestV653, compareDecodedPixelLinksV653 } from
  "./verify-mainline-a-nebula-pixel-link-v653.mjs";
import {
  R71_MAX_HTML_BYTES_V658, R71_MAX_JPEG_BYTES_V658,
  R71_RAW_DIR_V658, R71_SCHEMA_V658, R71_TARGETS_V658,
  fingerprintR71V658, inspectJpegR71V658,
  inspectOfficialPageR71V658, safeArtifactPathR71V658,
  safeImageUrlR71V658, safePageUrlR71V658, sha256R71V658,
  validateR71InputsV658,
} from "./mainline-a-r71-source-contract-v658.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REVIEW_PATH = "app/data/mainlineANebulaReviewPackV612.generated.json";
const RIGHTS_PATH = "app/data/mainlineANebulaRightsPackV613.generated.json";
const AUDIT_SCHEMA = "mainline-a-r71-source-audit-v658";
const OVERLAY_SCHEMA = "mainline-a-r71-source-overlay-v658";
const SHA = /^[a-f0-9]{64}$/;
const LEDGER_PATH = /^docs\/release\/v607\/mainline-a-r71-source-ledger-\d{8}v658r71[a-z0-9-]{1,24}\.json$/;
const AUDIT_PATH = /^docs\/release\/v607\/mainline-a-r71-source-audit-[a-z0-9-]+\.json$/;
const OVERLAY_PATH = /^app\/data\/mainlineANebulaR71SourceV658\.generated\.json$/;
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);

function check(value, code) {
  if (!value) throw new Error(`r71-source-audit-v658:${code}`);
}

function absoluteFile(relative) {
  check(typeof relative === "string" && relative.length > 0
    && !relative.includes("\\") && !relative.startsWith("/")
    && !relative.split("/").includes(".."), "path-unsafe");
  const absolute = path.resolve(ROOT, relative);
  check(absolute.startsWith(`${ROOT}${path.sep}`), "path-escaped");
  return absolute;
}

async function boundedBytes(relative, maximum) {
  const absolute = absoluteFile(relative);
  const info = await stat(absolute);
  check(info.isFile() && info.size > 0 && info.size <= maximum,
    `${relative}:size-invalid`);
  return readFile(absolute);
}

function pin(relative, bytes) {
  return Object.freeze({ path: relative, bytes: bytes.length,
    sha256: sha256R71V658(bytes) });
}

function rowIssue(issues, row, code) {
  issues.push(`${row.id}:${code}`);
}

export function validateAttemptLedgerR71V658(stage, row, kind) {
  const issues = [];
  if (!stage || stage.kind !== kind || ![0, 1].includes(stage.responseCaptured)
    || !Array.isArray(stage.attempts) || stage.attempts.length < 1
    || stage.attempts.length > 2) {
    return Object.freeze({ ok: false, issues: Object.freeze(["stage-shape-invalid"]) });
  }
  const requestUrl = kind === "page" ? row.legacyPageUrl
    : row.officialImageUrl;
  const safe = kind === "page" ? safePageUrlR71V658
    : safeImageUrlR71V658;
  if (stage.requestUrl !== requestUrl || !safe(stage.requestUrl, row)
    || stage.requestFingerprint
      !== fingerprintR71V658(stage.requestUrl, kind, row)) {
    issues.push("stage-request-fingerprint-invalid");
  }
  for (const [index, attempt] of stage.attempts.entries()) {
    if (attempt?.kind !== kind || attempt.number !== index + 1
      || attempt.retryCount !== index || attempt.requestUrl !== requestUrl
      || attempt.requestFingerprint !== stage.requestFingerprint
      || attempt.requestExecuted !== true || !attempt.collectionId
      || attempt.timeout !== (attempt.errorClass === "timeout")
      || !(Date.parse(attempt.startedAt) <= Date.parse(attempt.endedAt))
      || !Number.isInteger(attempt.timeoutMs) || attempt.timeoutMs <= 0
      || !Array.isArray(attempt.redirectChain)
      || !Array.isArray(attempt.redirects)
      || attempt.redirectChain[0] !== requestUrl
      || attempt.redirectChain.some((url) => !safe(url, row))
      || ![0, 1].includes(attempt.responseCaptured)) {
      issues.push(`attempt-${index + 1}-invalid`);
      continue;
    }
    if (attempt.redirects.length !== attempt.redirectChain.length - 1
      || attempt.redirects.some((item, offset) =>
        item?.from !== attempt.redirectChain[offset]
        || item?.to !== attempt.redirectChain[offset + 1]
        || ![301, 302, 303, 307, 308].includes(item?.status))) {
      issues.push(`attempt-${index + 1}-redirect-chain-invalid`);
    }
    const last = index === stage.attempts.length - 1;
    if (attempt.responseCaptured === 1) {
      if (!last || attempt.httpStatus !== 200 || attempt.errorClass !== null
        || attempt.errorMessage !== null || attempt.timeout !== false
        || attempt.finalUrl !== (kind === "page" ? row.pageUrl
          : row.officialImageUrl)
        || !SHA.test(attempt.rawSha256 ?? "")
        || attempt.responseBytes < 100
        || !stage.artifact || stage.artifact.path !== attempt.rawArtifactPath
        || stage.artifact.sha256 !== attempt.rawSha256
        || stage.artifact.bytes !== attempt.responseBytes) {
        issues.push(`attempt-${index + 1}-capture-invalid`);
      }
    } else if (attempt.rawArtifactPath !== null
      || attempt.rawSha256 !== null || attempt.responseBytes !== null
      || typeof attempt.errorClass !== "string"
      || attempt.errorClass.length < 1) {
      issues.push(`attempt-${index + 1}-failure-fabricated`);
    }
    if (kind === "page" && attempt.responseCaptured === 1
      && !/^text\/html(?:\s*;|$)/i.test(attempt.contentType ?? "")) {
      issues.push(`attempt-${index + 1}-content-type-invalid`);
    }
    if (kind === "image" && attempt.responseCaptured === 1
      && !/^image\/jpeg(?:\s*;|$)/i.test(attempt.contentType ?? "")) {
      issues.push(`attempt-${index + 1}-content-type-invalid`);
    }
  }
  if (new Set(stage.attempts.map((attempt) => attempt.collectionId)).size !== 1
    || stage.responseCaptured !== stage.attempts.at(-1)?.responseCaptured
    || stage.persistenceError !== null && stage.artifact
    || stage.responseCaptured === 0 && stage.artifact) {
    issues.push("stage-capture-ledger-inconsistent");
  }
  return Object.freeze({ ok: issues.length === 0,
    issues: Object.freeze(issues) });
}

async function replayRaw(row, stage, kind, issues) {
  if (!stage?.artifact) return null;
  const expectedPath = safeArtifactPathR71V658(row.id, kind,
    stage.artifact.sha256);
  if (stage.artifact.path !== expectedPath
    || !stage.artifact.path.startsWith(`${R71_RAW_DIR_V658}/`)
    || stage.artifact.finalUrl !== (kind === "page" ? row.pageUrl
      : row.officialImageUrl)) {
    rowIssue(issues, row, `${kind}-artifact-identity-invalid`);
    return null;
  }
  let bytes = null;
  try {
    bytes = await boundedBytes(stage.artifact.path,
      kind === "page" ? R71_MAX_HTML_BYTES_V658 : R71_MAX_JPEG_BYTES_V658);
  } catch (error) {
    rowIssue(issues, row, `${kind}-artifact-read-failed:${String(error.message)}`);
    return null;
  }
  if (stage.artifact.bytes !== bytes.length
    || stage.artifact.sha256 !== sha256R71V658(bytes)
    || stage.artifact.contentType !== stage.attempts.at(-1)?.contentType) {
    rowIssue(issues, row, `${kind}-artifact-sha-or-bytes-invalid`);
    return null;
  }
  return bytes;
}

export async function auditR71SourceV658(ledgerPath) {
  check(LEDGER_PATH.test(ledgerPath ?? ""), "ledger-path-invalid");
  const [ledgerBytes, reviewBytes, rightsBytes] = await Promise.all([
    boundedBytes(ledgerPath, 3_000_000),
    boundedBytes(REVIEW_PATH, 3_000_000),
    boundedBytes(RIGHTS_PATH, 3_000_000),
  ]);
  const ledger = JSON.parse(ledgerBytes.toString("utf8"));
  const review = JSON.parse(reviewBytes.toString("utf8"));
  const rights = JSON.parse(rightsBytes.toString("utf8"));
  const inputs = validateR71InputsV658(review, rights);
  check(inputs.ok, `current-input-invalid:${inputs.issues.join(",")}`);
  const issues = [];
  if (ledger.schema !== R71_SCHEMA_V658
    || !ledgerPath.endsWith(`${ledger.runId}.json`)
    || !(Date.parse(ledger.startedAt) <= Date.parse(ledger.endedAt))
    || ledger.inputs?.review?.path !== REVIEW_PATH
    || ledger.inputs?.review?.sha256 !== sha256R71V658(reviewBytes)
    || ledger.inputs?.rights?.path !== RIGHTS_PATH
    || ledger.inputs?.rights?.sha256 !== sha256R71V658(rightsBytes)
    || !Array.isArray(ledger.rows) || ledger.rows.length !== 6
    || new Set(ledger.rows.map((row) => row.id)).size !== 6
    || ledger.boundary?.candidateOnly !== true
    || ledger.boundary?.hold !== true
    || ledger.boundary?.notAdmitted !== true
    || ledger.boundary?.scientificPayloadWriteback !== false
    || ledger.boundary?.rightsSignoff !== "pending"
    || ledger.boundary?.publicWebRelease !== "blocked") {
    issues.push("ledger-identity-input-or-boundary-invalid");
  }
  const rows = [];
  for (const source of inputs.rows) {
    const row = ledger.rows?.find((candidate) => candidate?.id === source.id);
    if (!row || row.nasaId !== source.nasaId
      || row.catalog !== source.catalog || row.title !== source.title
      || row.expectedCredit !== source.credit
      || row.sourcePageUrl !== source.pageUrl
      || row.legacyPageUrl !== source.legacyPageUrl
      || row.expectedOfficialImageUrl !== source.officialImageUrl
      || !same(row.historicalLocalCandidate, source.original)
      || row.rightsStatus !== "pending"
      || row.runtimeAdmission !== "candidate-only"
      || row.hold !== true || row.notAdmitted !== true
      || row.scientificPayloadWriteback !== false) {
      issues.push(`${source.id}:row-identity-or-gate-invalid`);
      continue;
    }
    const pageAttempts = validateAttemptLedgerR71V658(row.page, source, "page");
    issues.push(...pageAttempts.issues.map((item) => `${source.id}:page:${item}`));
    const pageBytes = await replayRaw(source, row.page, "page", issues);
    const pageInspection = pageBytes
      ? inspectOfficialPageR71V658(pageBytes, source) : null;
    if (pageInspection && !same(pageInspection, row.page.inspection)) {
      rowIssue(issues, source, "saved-page-inspection-drift");
    }
    if (pageInspection && !pageInspection.ok) {
      rowIssue(issues, source, `page-content-invalid:${pageInspection.issues.join(",")}`);
    }
    if (row.image && (!pageInspection?.ok
      || row.image.requestUrl !== pageInspection.officialImageUrl)) {
      rowIssue(issues, source, "image-without-official-page-link");
    }
    if (row.image) {
      const imageAttempts = validateAttemptLedgerR71V658(
        row.image, source, "image");
      issues.push(...imageAttempts.issues.map((item) =>
        `${source.id}:image:${item}`));
    }
    const imageBytes = row.image
      ? await replayRaw(source, row.image, "image", issues) : null;
    if (imageBytes && !inspectJpegR71V658(imageBytes).ok) {
      rowIssue(issues, source, "official-jpeg-invalid");
    }
    let candidateBytes = null;
    try {
      candidateBytes = await boundedBytes(source.original.path,
        R71_MAX_JPEG_BYTES_V658);
      if (sha256R71V658(candidateBytes) !== source.original.sha256
        || candidateBytes.length !== source.original.bytes) {
        rowIssue(issues, source, "historical-local-raw-pin-drift");
      }
    } catch (error) {
      rowIssue(issues, source,
        `historical-local-read-failed:${String(error.message)}`);
    }
    const rawByteIdentical = Boolean(imageBytes && candidateBytes
      && sha256R71V658(imageBytes) === sha256R71V658(candidateBytes)
      && imageBytes.length === candidateBytes.length);
    let officialPixels = null;
    let candidatePixels = null;
    let decodedPixelIdentical = false;
    if (imageBytes && candidateBytes) {
      try {
        officialPixels = await decodedPixelDigestV653(row.image.artifact.path);
        candidatePixels = await decodedPixelDigestV653(source.original.path);
        const comparison = compareDecodedPixelLinksV653(
          officialPixels, candidatePixels, rawByteIdentical);
        decodedPixelIdentical = comparison.pixelIdentical;
        issues.push(...comparison.issues.map((item) => `${source.id}:${item}`));
        if (candidatePixels.width !== source.original.width
          || candidatePixels.height !== source.original.height) {
          rowIssue(issues, source, "historical-dimensions-drift");
        }
      } catch (error) {
        rowIssue(issues, source,
          `decoded-pixel-failed:${String(error.message)}`);
      }
    }
    const status = pageInspection?.ok && imageBytes && decodedPixelIdentical
      ? "official-page-image-pixels-linked-candidate"
      : pageInspection?.ok && imageBytes
        ? "official-image-variant-review" : pageInspection?.ok
          ? "official-page-only-candidate" : "source-attempt-pending";
    rows.push(Object.freeze({ id: source.id, nasaId: source.nasaId,
      catalog: source.catalog, title: source.title,
      expectedCredit: source.credit, status,
      officialPageUrl: source.pageUrl,
      officialImageUrl: source.officialImageUrl,
      pageRaw: pageBytes ? pin(row.page.artifact.path, pageBytes) : null,
      imageRaw: imageBytes ? pin(row.image.artifact.path, imageBytes) : null,
      historicalLocalRaw: candidateBytes
        ? pin(source.original.path, candidateBytes) : null,
      officialPixels, historicalLocalPixels: candidatePixels,
      rawByteIdentical, decodedPixelIdentical,
      pageResponseCaptured: row.page.responseCaptured,
      imageResponseCaptured: row.image?.responseCaptured ?? 0,
      pageAttemptCount: row.page.attempts.length,
      imageAttemptCount: row.image?.attempts.length ?? 0,
      rightsStatus: "pending", runtimeAdmission: "candidate-only",
      hold: true, notAdmitted: true, scientificPayloadWriteback: false }));
  }
  const counts = { targets: R71_TARGETS_V658.length,
    officialPages: rows.filter((row) => row.pageRaw).length,
    officialImages: rows.filter((row) => row.imageRaw).length,
    pixelMatches: rows.filter((row) => row.decodedPixelIdentical).length,
    rawByteMatches: rows.filter((row) => row.rawByteIdentical).length,
    pageAttemptOnly: rows.filter((row) => !row.pageRaw).length,
    imageAttemptOnly: rows.filter((row) => row.pageRaw && !row.imageRaw).length,
    rightsSigned: 0, runtimeAdmitted: 0 };
  if (ledger.counts?.targets !== 6
    || ledger.counts.pageArtifacts !== counts.officialPages
    || ledger.counts.imageArtifacts !== counts.officialImages
    || ledger.counts.rightsSigned !== 0
    || ledger.counts.runtimeAdmitted !== 0) {
    issues.push("ledger-counts-mismatch");
  }
  return Object.freeze({ schema: AUDIT_SCHEMA,
    status: issues.length === 0 && counts.pixelMatches === 6
      ? "verified-six-official-page-image-pixel-links-candidate"
      : issues.length === 0 ? "partial-current-source-candidate" : "blocked",
    issues: Object.freeze(issues),
    inputPins: Object.freeze({ ledger: pin(ledgerPath, ledgerBytes),
      review: pin(REVIEW_PATH, reviewBytes), rights: pin(RIGHTS_PATH, rightsBytes) }),
    decoder: Object.freeze({ library: "sharp", sharpVersion: sharp.versions.sharp,
      vipsVersion: sharp.versions.vips, nodeVersion: process.version,
      platform: process.platform, architecture: process.arch,
      colorTransform: "default-sharp-raw" }),
    rows: Object.freeze(rows), counts: Object.freeze(counts),
    boundary: Object.freeze({ candidateOnly: true, hold: true,
      notAdmitted: true, scientificPayloadWriteback: false,
      rightsSignoff: "pending", publicWebRelease: "blocked" }),
    claims: Object.freeze({ copyrightApproval: false,
      scientificValidity: false, productionPerformance: false,
      realUserValidation: false, physicalMobile: false,
      publicWebReleaseApproved: false }) });
}

export function buildR71SourceOverlayV658(audit) {
  check(audit?.schema === AUDIT_SCHEMA && audit.status !== "blocked"
    && audit.rows?.length === 6 && audit.issues?.length === 0
    && audit.boundary?.scientificPayloadWriteback === false
    && audit.counts?.rightsSigned === 0, "audit-not-eligible-for-overlay");
  return Object.freeze({ schema: OVERLAY_SCHEMA,
    status: audit.status, sourceAudit: audit.inputPins.ledger,
    rows: audit.rows.map((row) => ({ id: row.id, nasaId: row.nasaId,
      catalog: row.catalog, title: row.title, status: row.status,
      officialPageUrl: row.officialPageUrl,
      officialImageUrl: row.officialImageUrl,
      expectedCredit: row.expectedCredit,
      pageRaw: row.pageRaw, imageRaw: row.imageRaw,
      historicalLocalRaw: row.historicalLocalRaw,
      originalWidth: row.officialPixels?.width ?? null,
      originalHeight: row.officialPixels?.height ?? null,
      rawByteIdentical: row.rawByteIdentical,
      decodedPixelIdentical: row.decodedPixelIdentical,
      pageResponseCaptured: row.pageResponseCaptured,
      imageResponseCaptured: row.imageResponseCaptured,
      pageAttemptCount: row.pageAttemptCount,
      imageAttemptCount: row.imageAttemptCount,
      rightsStatus: "pending", runtimeAdmission: "candidate-only",
      hold: true, notAdmitted: true,
      scientificPayloadWriteback: false })),
    counts: audit.counts,
    boundary: audit.boundary,
    claims: audit.claims });
}

export function replayR71SourceAuditV658(saved, fresh) {
  check(saved?.schema === AUDIT_SCHEMA
    && fresh?.schema === AUDIT_SCHEMA
    && saved.status === fresh.status
    && same(saved.inputPins, fresh.inputPins)
    && same(saved.decoder, fresh.decoder)
    && same(saved.rows, fresh.rows)
    && same(saved.counts, fresh.counts)
    && same(saved.boundary, fresh.boundary)
    && same(saved.claims, fresh.claims)
    && same(saved.issues, fresh.issues)
    && saved.claims.copyrightApproval === false
    && saved.claims.publicWebReleaseApproved === false
    && saved.boundary.scientificPayloadWriteback === false,
  "saved-audit-replay-mismatch");
  return Object.freeze({ status: "replayed-current-source-candidate",
    officialPages: fresh.counts.officialPages,
    officialImages: fresh.counts.officialImages,
    pixelMatches: fresh.counts.pixelMatches,
    copyrightApproval: false, publicWebRelease: "blocked" });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const value = (name) => {
    const position = process.argv.indexOf(name);
    return position < 0 ? null : process.argv[position + 1];
  };
  const ledger = value("--ledger");
  const output = value("--output");
  const overlay = value("--overlay");
  const replay = value("--replay");
  check(LEDGER_PATH.test(ledger ?? "")
    && (!output || AUDIT_PATH.test(output))
    && (!overlay || OVERLAY_PATH.test(overlay))
    && (!replay || AUDIT_PATH.test(replay)), "usage-invalid");
  const fresh = await auditR71SourceV658(ledger);
  if (output) await writeFile(absoluteFile(output),
    `${JSON.stringify(fresh, null, 2)}\n`, { flag: "wx" });
  if (overlay) await writeFile(absoluteFile(overlay),
    `${JSON.stringify(buildR71SourceOverlayV658(fresh), null, 2)}\n`,
    { flag: "wx" });
  const replayResult = replay ? replayR71SourceAuditV658(
    JSON.parse(await readFile(absoluteFile(replay), "utf8")), fresh) : null;
  console.log(JSON.stringify({ status: fresh.status,
    issues: fresh.issues, counts: fresh.counts,
    replay: replayResult }, null, 2));
  if (fresh.status === "blocked") process.exitCode = 1;
}

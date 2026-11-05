import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  auditB1ImageLinksV654, replayB1ImageAuditV654,
} from "./verify-mainline-a-nebula-b1-image-v654.mjs";
import {
  auditNebulaPixelLinksV653, replayNebulaPixelAuditV653,
} from "./verify-mainline-a-nebula-pixel-link-v653.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const V655_OUTPUT = "app/data/mainlineANebulaCandidateReviewV655.generated.json";
export const V655_DERIVED_DIR =
  "docs/release/v607/nebula-review-derivatives/v655";
export const V655_B1_AUDIT =
  "docs/release/v607/mainline-a-r67-b1-page-image-audit-20261012-v654b1image01.json";
export const V655_B2_AUDIT =
  "docs/release/v607/mainline-a-r66-nebula-pixel-link-audit-20261011-v653pixel01.json";
export const V655_B1_BATCH =
  "app/data/mainlineANebulaBatchV624.generated.json";
export const V655_B2_BATCH =
  "app/data/mainlineANebulaBatchV628.generated.json";
export const V655_B1_OVERLAY =
  "app/data/mainlineANebulaB1SourceV654.generated.json";
export const V655_B2_LINK_LEDGER =
  "docs/release/v607/mainline-a-r66-nebula-page-image-link-ledger-20261011-v652link01.json";
export const V655_B2_PAGE_LEDGER =
  "docs/release/v607/mainline-a-r66-nebula-source-page-ledger-20261011-v651page01.json";

const SHA = /^[a-f0-9]{64}$/;
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const fail = (code) => { throw new Error(`nebula-review-v655:${code}`); };
const variants = Object.freeze({
  thumb: Object.freeze({ width: 400, height: 300, quality: 76 }),
  detail: Object.freeze({ width: 1400, height: 1100, quality: 84 }),
});

function pin(relative, bytes) {
  return Object.freeze({ path: relative, bytes: bytes.byteLength,
    sha256: sha(bytes) });
}
function inside(base, absolute) {
  return absolute.startsWith(`${path.resolve(base)}${path.sep}`);
}
function closed(batch, row) {
  return batch?.boundary?.scientificPayloadWriteback === false
    && row?.rights?.status === "pending"
    && row.runtimeAdmission === "candidate-only"
    && row.scientificPayloadWriteback === false
    && row.network?.responseCaptured === 1;
}

export function bindReviewCandidatesV655(b1Audit, b2Audit, b1Batch,
  b2Batch, b1Overlay, b2Ledger, b2Pages) {
  const issues = [];
  if (b1Audit?.status
      !== "verified-six-b1-official-jpegs-pixel-equivalent-candidate"
    || b2Audit?.status !== "verified-six-decoded-pixel-links-candidate"
    || b1Audit.counts?.decodedPixelIdentical !== 6
    || b2Audit.counts?.decodedPixelIdentical !== 6
    || b1Audit.counts?.rightsSigned !== 0
    || b2Audit.counts?.rightsSigned !== 0
    || b1Overlay?.schema !== "mainline-a-nebula-b1-source-v654"
    || b1Overlay.rows?.length !== 6
    || b2Ledger?.schema !== "mainline-a-r66-nebula-page-image-link-ledger-v652"
    || b2Ledger.rows?.length !== 6
    || b2Pages?.schema !== "mainline-a-r66-nebula-source-page-ledger-v651"
    || b2Pages.rows?.length !== 6
    || b1Batch?.rows?.length !== 6
    || b2Batch?.rows?.length !== 6) {
    issues.push("source-audit-or-six-row-input-invalid");
  }
  const candidates = [];
  for (const [batchId, audit, batch] of [
    ["B1", b1Audit, b1Batch], ["B2", b2Audit, b2Batch],
  ]) {
    for (const [index, audited] of (audit?.rows ?? []).entries()) {
      const row = batch?.rows?.[index];
      const b1 = batchId === "B1" ? b1Overlay?.rows?.[index] : null;
      const b2 = batchId === "B2" ? b2Ledger?.rows?.[index] : null;
      const b2Page = batchId === "B2" ? b2Pages?.rows?.[index] : null;
      const sourcePageUrl = b1?.officialPageUrl ?? b2?.sourcePageUrl;
      const officialJpegUrl = b1?.officialJpegUrl ?? b2?.officialDownloadUrl;
      const sourceCredit = b1?.officialCredit ?? b2Page?.expectedCredit;
      const pageSha256 = b1?.pageRawSha256 ?? b2?.sourcePageRawSha256;
      const officialRaw = audited?.officialRaw;
      const candidateRaw = audited?.candidateRaw;
      if (!row || !closed(batch, row)
        || audited.id !== row.id
        || audited.nasaId !== (b1?.nasaId ?? b2?.nasaId)
        || audited.sourceLinkStatus !== "decoded-pixel-equivalent-candidate"
        || audited.decodedPixelIdentical !== true
        || audited.rightsSignoff !== "pending"
        || audited.scientificPayloadWriteback !== false
        || candidateRaw?.path !== row.network.artifact.path
        || candidateRaw?.sha256 !== row.network.artifact.sha256
        || candidateRaw?.bytes !== row.network.artifact.bytes
        || officialRaw?.sha256
          !== (b1?.officialRawSha256 ?? b2?.artifact?.sha256)
        || (batchId === "B2" && (b2Page?.id !== audited.id
          || b2Page?.sourcePageUrl !== sourcePageUrl
          || b2Page?.artifact?.sha256 !== pageSha256
          || b2Page?.inspection?.officialCredit !== sourceCredit
          || b2Page?.sourcePageStatus
            !== "verified-official-source-page-candidate"))
        || sourceCredit !== row.source.credit
        || !/^https:\/\/science\.nasa\.gov\/photojournal\//.test(
          sourcePageUrl ?? "")
        || !/^https:\/\/assets\.science\.nasa\.gov\//.test(
          officialJpegUrl ?? "")
        || !SHA.test(pageSha256 ?? "")
        || audited.officialPixels?.pixelSha256
          !== audited.candidatePixels?.pixelSha256) {
        issues.push(`${batchId}:${audited?.id ?? index}:cross-source-link-invalid`);
        continue;
      }
      candidates.push(Object.freeze({ batchId, id: row.id,
        nasaId: audited.nasaId, title: row.title,
        sourcePageUrl, officialJpegUrl, sourceCredit,
        sourcePageSha256: pageSha256,
        candidateRaw, officialRaw,
        rawByteIdentical: audited.rawByteIdentical,
        decodedPixelIdentical: true,
        pixelSha256: audited.officialPixels.pixelSha256,
        originalWidth: audited.officialPixels.width,
        originalHeight: audited.officialPixels.height,
      }));
    }
  }
  if (candidates.length !== 12
    || new Set(candidates.map((item) => item.id)).size !== 12
    || new Set(candidates.map((item) => item.nasaId)).size !== 12
    || candidates.filter((item) => item.batchId === "B1").length !== 6
    || candidates.filter((item) => item.batchId === "B2").length !== 6) {
    issues.push("twelve-unique-candidates-missing");
  }
  return Object.freeze({ ok: issues.length === 0,
    issues: Object.freeze(issues), candidates: Object.freeze(candidates) });
}

export function reviewDerivativePathV655(id, kind, digest) {
  if (!/^[a-z0-9-]+$/.test(id ?? "")
    || !Object.hasOwn(variants, kind)
    || !SHA.test(digest ?? "")) fail("derived-path-identity-invalid");
  return `${V655_DERIVED_DIR}/${id}-${kind}-${digest}.webp`;
}

export async function renderReviewDerivativeV655(raw, kind) {
  const spec = variants[kind];
  if (!spec || !Buffer.isBuffer(raw) || raw.byteLength < 100) {
    fail("derivative-render-input-invalid");
  }
  const { data, info } = await sharp(raw, {
    failOn: "error", limitInputPixels: 100_000_000,
  }).rotate().resize({ width: spec.width, height: spec.height,
    fit: "inside", withoutEnlargement: true })
    .webp({ quality: spec.quality, effort: 5 })
    .toBuffer({ resolveWithObject: true });
  if (info.format !== "webp" || info.width < 1
    || info.height < 1 || info.width > spec.width
    || info.height > spec.height || data.byteLength < 100) {
    fail("derivative-render-output-invalid");
  }
  return Object.freeze({ bytes: data, width: info.width,
    height: info.height, mimeType: "image/webp",
    sha256: sha(data), sharpVersion: sharp.versions.sharp,
    vipsVersion: sharp.versions.vips });
}

async function readPinnedRaw(root, raw) {
  const base = path.resolve(root, "docs/release/v607/nebula-image-artifacts");
  const absolute = path.resolve(root, raw.path);
  if (!inside(base, absolute)) fail("candidate-raw-path-outside-allowlist");
  const info = await stat(absolute);
  if (!info.isFile() || info.size !== raw.bytes
    || info.size < 100 || info.size > 60_000_000) {
    fail("candidate-raw-size-mismatch");
  }
  const bytes = await readFile(absolute);
  if (sha(bytes) !== raw.sha256) fail("candidate-raw-sha-mismatch");
  return bytes;
}

async function persistDerivative(root, id, kind, rendered, checkOnly) {
  const relative = reviewDerivativePathV655(id, kind, rendered.sha256);
  const base = path.resolve(root, V655_DERIVED_DIR);
  const absolute = path.resolve(root, relative);
  if (!inside(base, absolute)) fail("derived-path-outside-allowlist");
  if (!checkOnly) {
    await mkdir(base, { recursive: true });
    try {
      await writeFile(absolute, rendered.bytes, { flag: "wx" });
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
    }
  }
  const retained = await readFile(absolute);
  if (retained.byteLength !== rendered.bytes.byteLength
    || sha(retained) !== rendered.sha256) fail("derived-retention-mismatch");
  return Object.freeze({ ...pin(relative, retained),
    width: rendered.width, height: rendered.height,
    mimeType: rendered.mimeType });
}

export async function buildNebulaReviewV655({ check = false,
  root = ROOT } = {}) {
  const sources = [V655_B1_AUDIT, V655_B2_AUDIT,
    V655_B1_BATCH, V655_B2_BATCH, V655_B1_OVERLAY,
    V655_B2_LINK_LEDGER, V655_B2_PAGE_LEDGER];
  const sourceBytes = await Promise.all(sources.map((relative) =>
    readFile(path.resolve(root, relative))));
  const parsed = sourceBytes.map((value) => JSON.parse(value.toString("utf8")));
  const [b1Audit, b2Audit] = parsed;
  if (path.resolve(root).toLowerCase() !== ROOT.toLowerCase()) {
    fail("root-must-match-next-web");
  }
  replayB1ImageAuditV654(b1Audit, await auditB1ImageLinksV654());
  replayNebulaPixelAuditV653(b2Audit, await auditNebulaPixelLinksV653());
  const bound = bindReviewCandidatesV655(...parsed);
  if (!bound.ok) fail(`candidate-input-invalid:${bound.issues.join(",")}`);
  const rows = [];
  for (const candidate of bound.candidates) {
    const raw = await readPinnedRaw(root, candidate.candidateRaw);
    const preview = {};
    for (const kind of ["thumb", "detail"]) {
      const rendered = await renderReviewDerivativeV655(raw, kind);
      preview[kind] = await persistDerivative(root, candidate.id,
        kind, rendered, check);
    }
    rows.push({ ...candidate, preview,
      rightsStatus: "pending", runtimeAdmission: "candidate-only",
      hold: true, notAdmitted: true,
      scientificPayloadWriteback: false });
    console.log(JSON.stringify({ stage: "candidate-review-derivative",
      id: candidate.id, thumbSha256: preview.thumb.sha256,
      detailSha256: preview.detail.sha256 }));
  }
  const inputPins = Object.fromEntries(sources.map((relative, index) =>
    [relative, pin(relative, sourceBytes[index])]));
  const manifest = { schema: "mainline-a-nebula-candidate-review-v655",
    evidenceClass: "local-derived-review-only",
    generatedFrom: inputPins,
    derivation: { library: "sharp",
      sharpVersion: sharp.versions.sharp,
      vipsVersion: sharp.versions.vips,
      nodeVersion: process.version,
      transform: "auto-orient-resize-inside-webp",
      variants }, rows,
    counts: { total: rows.length, B1: 6, B2: 6,
      sourcePagesVerified: 12,
      candidateRawVerified: 12,
      previewPairs: 12,
      rawByteIdentical: rows.filter((row) =>
        row.rawByteIdentical).length,
      decodedPixelIdentical: 12, rightsSigned: 0 },
    boundary: { candidateOnly: true, hold: true,
      notAdmitted: true, scientificPayloadWriteback: false,
      runtimePromotion: "closed",
      localReviewOnly: true },
    claims: { copyrightApproval: false,
      scientificValidity: false,
      publicWebReleaseApproved: false,
      realUserValidation: false } };
  const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
  const output = path.resolve(root, V655_OUTPUT);
  if (check) {
    const retained = await readFile(output, "utf8");
    if (retained !== serialized) fail("generated-manifest-stale");
  } else {
    try {
      await writeFile(output, serialized, { flag: "wx" });
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      const retained = await readFile(output, "utf8");
      if (retained !== serialized) fail("existing-manifest-conflict");
    }
  }
  return Object.freeze({ status: check
    ? "replayed-twelve-local-review-derivatives"
    : "built-twelve-local-review-derivatives",
    output: V655_OUTPUT, sha256: sha(serialized),
    counts: manifest.counts });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length > 3
    || (process.argv.length === 3 && process.argv[2] !== "--check")) {
    fail("usage-invalid");
  }
  console.log(JSON.stringify(await buildNebulaReviewV655({
    check: process.argv[2] === "--check",
  }), null, 2));
}

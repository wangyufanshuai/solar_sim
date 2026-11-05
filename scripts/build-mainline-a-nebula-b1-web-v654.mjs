import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditB1SourcePagesV654, replayB1SourceAuditV654 } from "./verify-mainline-a-nebula-b1-v654.mjs";
import { auditB1ImageLinksV654, replayB1ImageAuditV654 } from "./verify-mainline-a-nebula-b1-image-v654.mjs";
import {
  B1_PAGE_AUDIT_V654, B1_PAGE_LEDGER_V654,
} from "./collect-mainline-a-nebula-b1-image-v654.mjs";
import { B1_BATCH, sha256B1V654 } from "./mainline-a-nebula-b1-source-v654.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_AUDIT = B1_PAGE_AUDIT_V654;
const IMAGE_AUDIT =
  "docs/release/v607/mainline-a-r67-b1-page-image-audit-20261012-v654b1image01.json";
const OUTPUT = "app/data/mainlineANebulaB1SourceV654.generated.json";
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const fail = (code) => { throw new Error(`b1-web-v654:${code}`); };

export function createB1WebOverlayV654(batch, sourceAudit,
  imageAudit, sourceAuditBytes, imageAuditBytes) {
  if (sourceAudit.status !== "verified-six-b1-official-pages-candidate"
    || imageAudit.status
      !== "verified-six-b1-official-jpegs-pixel-equivalent-candidate"
    || batch?.rows?.length !== 6
    || sourceAudit.artifacts?.length !== 6
    || imageAudit.rows?.length !== 6
    || sourceAudit.counts.rightsSigned !== 0
    || imageAudit.counts.rightsSigned !== 0
    || imageAudit.boundary?.scientificPayloadWriteback !== false) {
    fail("source-or-image-audit-not-verified");
  }
  const rows = [];
  for (let index = 0; index < 6; index += 1) {
    const candidate = batch.rows[index];
    const page = sourceAudit.artifacts[index];
    const image = imageAudit.rows[index];
    if (!candidate || candidate.id !== page.id || page.id !== image.id
      || candidate.network?.artifact?.sha256
        !== image.candidateRaw.sha256
      || candidate.network?.artifact?.path
        !== image.candidateRaw.path
      || page.directJpegUrl !== image.officialDownloadUrl
      || candidate.source?.credit !== page.officialCredit
      || !image.decodedPixelIdentical
      || image.sourceLinkStatus !== "decoded-pixel-equivalent-candidate"
      || image.rightsSignoff !== "pending"
      || image.scientificPayloadWriteback !== false) {
      fail(`${candidate?.id ?? index}:cross-audit-binding-invalid`);
    }
    rows.push({ id: candidate.id, nasaId: image.nasaId,
      title: candidate.title,
      officialPageUrl: image.sourcePageUrl,
      officialCredit: page.officialCredit,
      pageRawSha256: page.sha256,
      officialJpegUrl: image.officialDownloadUrl,
      officialRawSha256: image.officialRaw.sha256,
      candidateRawSha256: image.candidateRaw.sha256,
      rawByteIdentical: image.rawByteIdentical,
      decodedPixelIdentical: image.decodedPixelIdentical,
      width: image.officialPixels.width,
      height: image.officialPixels.height,
      pixelSha256: image.officialPixels.pixelSha256,
      status: "source-and-pixels-verified-candidate",
      rightsStatus: "pending",
      runtimeAdmission: "candidate-only",
      scientificPayloadWriteback: false });
  }
  if (new Set(rows.map((row) => row.id)).size !== 6
    || rows.filter((row) => row.rawByteIdentical).length
      !== imageAudit.counts.rawByteIdentical) {
    fail("coverage-or-byte-count-invalid");
  }
  return Object.freeze({ schema: "mainline-a-nebula-b1-source-v654",
    evidenceClass: "verified-local-external-source-overlay",
    sourceAuditSha256: sha256B1V654(sourceAuditBytes),
    imageAuditSha256: sha256B1V654(imageAuditBytes),
    rows: Object.freeze(rows),
    counts: { total: 6, officialPagesVerified: 6,
      officialJpegsCaptured: 6,
      rawByteIdentical: imageAudit.counts.rawByteIdentical,
      decodedPixelIdentical: imageAudit.counts.decodedPixelIdentical,
      rightsSigned: 0 },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false, runtimePromotion: "closed" },
    claims: { copyrightApproval: false, scientificValidity: false,
      publicWebReleaseApproved: false, realUserValidation: false } });
}

export async function buildB1WebOverlayV654(options = {}) {
  const [sourceBytes, imageBytes, batchBytes] = await Promise.all([
    readFile(path.join(ROOT, SOURCE_AUDIT)),
    readFile(path.join(ROOT, IMAGE_AUDIT)),
    readFile(path.join(ROOT, B1_BATCH)),
  ]);
  const sourceSaved = JSON.parse(sourceBytes.toString("utf8"));
  const imageSaved = JSON.parse(imageBytes.toString("utf8"));
  const batch = JSON.parse(batchBytes.toString("utf8"));
  const sourceFresh = await auditB1SourcePagesV654(B1_PAGE_LEDGER_V654);
  replayB1SourceAuditV654(sourceSaved, sourceFresh);
  const imageFresh = await auditB1ImageLinksV654();
  replayB1ImageAuditV654(imageSaved, imageFresh);
  const overlay = createB1WebOverlayV654(batch, sourceSaved,
    imageSaved, sourceBytes, imageBytes);
  const output = path.join(ROOT, OUTPUT);
  const serialized = `${JSON.stringify(overlay, null, 2)}\n`;
  if (options.check) {
    const current = await readFile(output, "utf8");
    if (current !== serialized) fail("generated-overlay-stale");
    return { status: "b1-web-overlay-recomputed", rows: overlay.rows.length,
      sha256: sha256B1V654(serialized), output: OUTPUT };
  }
  try {
    await writeFile(output, serialized, { flag: "wx" });
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
    const old = await readFile(output, "utf8");
    if (!same(JSON.parse(old), overlay) || old !== serialized) {
      fail("generated-overlay-exists-with-different-content");
    }
  }
  return { status: "b1-web-overlay-written", rows: overlay.rows.length,
    sha256: sha256B1V654(serialized), output: OUTPUT };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length > 3
    || (process.argv.length === 3 && process.argv[2] !== "--check")) {
    fail("usage-invalid");
  }
  console.log(JSON.stringify(await buildB1WebOverlayV654({
    check: process.argv[2] === "--check",
  }), null, 2));
}

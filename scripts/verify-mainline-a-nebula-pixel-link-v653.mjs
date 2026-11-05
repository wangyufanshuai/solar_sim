import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { auditPageImageLinkLedgerV652 } from "./verify-mainline-a-nebula-page-image-link-v652.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LINK_LEDGER = "docs/release/v607/mainline-a-r66-nebula-page-image-link-ledger-20261011-v652link01.json";
const LINK_AUDIT = "docs/release/v607/mainline-a-r66-nebula-page-image-link-audit-20261011-v652link01-fixed.json";
const SCHEMA = "mainline-a-r66-nebula-pixel-link-audit-v653";
const STATUS = "verified-six-decoded-pixel-links-candidate";
const RECEIPT_PATTERN = /^docs\/release\/v607\/[a-z0-9-]+\.json$/;
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

function assert(condition, code) {
  if (!condition) throw new Error(`pixel-link-v653:${code}`);
}
function pinned(relative, bytes) {
  return Object.freeze({ path: relative, bytes: bytes.byteLength,
    sha256: sha(bytes) });
}
async function boundedRead(relative, maximumBytes) {
  const absolute = path.resolve(ROOT, relative);
  assert(absolute.startsWith(`${ROOT}${path.sep}`), "path-escaped");
  const info = await stat(absolute);
  assert(info.isFile() && info.size > 0 && info.size <= maximumBytes,
    "file-size-invalid");
  return readFile(absolute);
}

export async function decodedPixelDigestV653(relative) {
  const absolute = path.resolve(ROOT, relative);
  assert(absolute.startsWith(`${ROOT}${path.sep}`), "image-path-escaped");
  const { data, info } = await sharp(absolute, {
    failOn: "error", limitInputPixels: 100_000_000,
  }).raw().toBuffer({ resolveWithObject: true });
  assert(info.width > 0 && info.height > 0 && info.channels >= 1
    && info.channels <= 4 && data.byteLength > 0,
  "decoded-raster-invalid");
  return Object.freeze({ width: info.width, height: info.height,
    channels: info.channels, decodedBytes: data.byteLength,
    pixelSha256: sha(data) });
}

export function compareDecodedPixelLinksV653(official, candidate,
  rawByteIdentical) {
  const issues = [];
  if (!(official?.width > 0 && official.height > 0
    && candidate?.width > 0 && candidate.height > 0
    && /^[a-f0-9]{64}$/.test(official.pixelSha256 ?? "")
    && /^[a-f0-9]{64}$/.test(candidate.pixelSha256 ?? ""))) {
    issues.push("pixel-digest-invalid");
  }
  const pixelIdentical = official.width === candidate.width
    && official.height === candidate.height
    && official.channels === candidate.channels
    && official.decodedBytes === candidate.decodedBytes
    && official.pixelSha256 === candidate.pixelSha256;
  if (!pixelIdentical) issues.push("decoded-pixels-differ");
  if (rawByteIdentical === true && !pixelIdentical) {
    issues.push("raw-identical-pixels-differ");
  }
  return Object.freeze({ ok: issues.length === 0,
    issues: Object.freeze(issues), pixelIdentical });
}

export async function auditNebulaPixelLinksV653() {
  const [ledgerBytes, auditBytes] = await Promise.all([
    boundedRead(LINK_LEDGER, 2_000_000),
    boundedRead(LINK_AUDIT, 2_000_000),
  ]);
  const ledger = JSON.parse(ledgerBytes.toString("utf8"));
  const savedAudit = JSON.parse(auditBytes.toString("utf8"));
  const freshAudit = await auditPageImageLinkLedgerV652(LINK_LEDGER);
  assert(savedAudit.status === "verified-six-official-jpegs-candidate-with-variant-counts"
    && same(savedAudit, freshAudit)
    && savedAudit.ledger.sha256 === sha(ledgerBytes),
  "raw-link-audit-not-replayed");
  assert(ledger.rows?.length === 6
    && ledger.counts?.byteIdentical === 1
    && ledger.counts?.rightsSigned === 0
    && ledger.boundary?.scientificPayloadWriteback === false,
  "link-ledger-boundary-invalid");
  const rows = [];
  const issues = [];
  for (const [index, row] of ledger.rows.entries()) {
    const pin = savedAudit.artifacts?.[index];
    assert(pin?.id === row.id && pin.official.sha256 === row.artifact?.sha256
      && pin.candidate.sha256 === row.candidateImageArtifact?.sha256
      && pin.byteIdentical === row.byteIdentical,
    `${row.id}:raw-image-pin-invalid`);
    const official = await decodedPixelDigestV653(pin.official.path);
    const candidate = await decodedPixelDigestV653(pin.candidate.path);
    const comparison = compareDecodedPixelLinksV653(official, candidate,
      pin.byteIdentical);
    issues.push(...comparison.issues.map((code) => `${row.id}:${code}`));
    rows.push(Object.freeze({ id: row.id, nasaId: row.nasaId,
      officialRaw: pin.official, candidateRaw: pin.candidate,
      officialPixels: official, candidatePixels: candidate,
      rawByteIdentical: pin.byteIdentical,
      decodedPixelIdentical: comparison.pixelIdentical,
      sourceLinkStatus: comparison.pixelIdentical
        ? "decoded-pixel-equivalent-candidate" : "pending",
      rightsSignoff: "pending", scientificPayloadWriteback: false }));
  }
  const pixelIdentical = rows.filter((row) => row.decodedPixelIdentical).length;
  const byteIdentical = rows.filter((row) => row.rawByteIdentical).length;
  return Object.freeze({ schema: SCHEMA,
    status: issues.length === 0 && pixelIdentical === 6 ? STATUS : "blocked",
    issues: Object.freeze(issues),
    decoder: Object.freeze({ library: "sharp",
      sharpVersion: sharp.versions.sharp, vipsVersion: sharp.versions.vips,
      nodeVersion: process.version, platform: process.platform,
      architecture: process.arch, colorTransform: "default-sharp-raw" }),
    inputs: Object.freeze({ linkLedger: pinned(LINK_LEDGER, ledgerBytes),
      linkAudit: pinned(LINK_AUDIT, auditBytes) }),
    rows: Object.freeze(rows),
    counts: { total: 6, rawByteIdentical: byteIdentical,
      decodedPixelIdentical: pixelIdentical,
      rawVariantsWithIdenticalPixels: pixelIdentical - byteIdentical,
      rightsSigned: 0 },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false, runtimePromotion: "closed" },
    claims: { copyrightApproval: false, scientificValidity: false,
      publicWebReleaseApproved: false, realUserValidation: false } });
}

export function replayNebulaPixelAuditV653(saved, fresh) {
  assert(saved?.schema === SCHEMA && saved.status === STATUS
    && fresh.status === STATUS && fresh.issues?.length === 0
    && same(saved.decoder, fresh.decoder)
    && same(saved.inputs, fresh.inputs)
    && same(saved.rows, fresh.rows)
    && same(saved.counts, fresh.counts)
    && same(saved.boundary, fresh.boundary)
    && same(saved.claims, fresh.claims)
    && saved.counts.rawByteIdentical === 1
    && saved.counts.decodedPixelIdentical === 6
    && saved.counts.rawVariantsWithIdenticalPixels === 5
    && saved.counts.rightsSigned === 0
    && saved.claims.copyrightApproval === false
    && saved.boundary.scientificPayloadWriteback === false,
  "saved-audit-replay-mismatch");
  return Object.freeze({ status: "replayed-six-decoded-pixel-links-candidate",
    decodedPixelIdentical: 6, rawByteIdentical: 1,
    copyrightApproval: false, publicWebRelease: "blocked" });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const value = (name) => {
    const index = process.argv.indexOf(name);
    return index < 0 ? null : process.argv[index + 1];
  };
  const output = value("--output");
  const replay = value("--replay");
  assert((!output || RECEIPT_PATTERN.test(output))
    && (!replay || RECEIPT_PATTERN.test(replay)), "usage-invalid");
  const fresh = await auditNebulaPixelLinksV653();
  if (output) await writeFile(path.join(ROOT, output),
    `${JSON.stringify(fresh, null, 2)}\n`, { flag: "wx" });
  if (replay) {
    const saved = JSON.parse(await readFile(path.join(ROOT, replay), "utf8"));
    console.log(JSON.stringify(replayNebulaPixelAuditV653(saved, fresh), null, 2));
  } else console.log(JSON.stringify({ status: fresh.status,
    issues: fresh.issues, counts: fresh.counts,
    decoder: fresh.decoder }, null, 2));
  if (fresh.status === "blocked") process.exitCode = 1;
}

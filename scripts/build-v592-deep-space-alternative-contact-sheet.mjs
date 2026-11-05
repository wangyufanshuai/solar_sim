import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const selectionPath = resolve(root, "scripts/v592-deep-space-alternative-visual-source-selections.json");
const selections = JSON.parse(readFileSync(selectionPath, "utf8"));
const outputPath = resolve(root, "tmp/v592-deep-space-alternative-contact-sheet.webp");
const receiptPath = resolve(root, "docs/release/v592/deep-space-alternative-contact-sheet-receipt-v592.json");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function verifySealed(path) {
  const document = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...document };
  delete unsigned.receiptSha256;
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-deep-space-contact-input-seal:${path}`);
  return document;
}
function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.${process.pid}.part`;
  writeFileSync(partial, bytes);
  rmSync(path, { force: true });
  renameSync(partial, path);
}
function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

assert(selections.version === "v592-deep-space-alternative-visual-source-selections-v1", "v592-deep-space-contact-selections");
assert(selections.selections.length === 9, "v592-deep-space-contact-count");
const tileWidth = 640;
const tileHeight = 460;
const imageHeight = 380;
const columns = 2;
const rows = Math.ceil(selections.selections.length / columns);
const composites = [];
const entries = [];
for (const [index, selectionId] of selections.selections.entries()) {
  const receiptPathForAsset = resolve(root, `docs/release/v592/acquisition-receipt-deep-space-alternative-visual-sources/${selectionId}.json`);
  const receipt = verifySealed(receiptPathForAsset);
  const sourcePath = resolve(root, receipt.output.path);
  const bytes = readFileSync(sourcePath);
  assert(bytes.byteLength === receipt.output.bytes && sha256(bytes) === receipt.output.sha256, `v592-deep-space-contact-source-drift:${selectionId}`);
  const preview = await sharp(bytes, { limitInputPixels: false })
    .resize(tileWidth, imageHeight, { fit: "contain", background: "#020407", kernel: sharp.kernel.lanczos3 })
    .jpeg({ quality: 88, chromaSubsampling: "4:4:4" })
    .toBuffer();
  const x = (index % columns) * tileWidth;
  const y = Math.floor(index / columns) * tileHeight;
  composites.push({ input: preview, left: x, top: y });
  const label = `${selectionId} · ${receipt.source.width}×${receipt.source.height} · ${receipt.output.sha256.slice(0, 12)}`;
  const svg = Buffer.from(`<svg width="${tileWidth}" height="${tileHeight - imageHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#050a10"/><text x="18" y="33" font-family="monospace" font-size="16" fill="#d9f2ff">${escapeXml(label)}</text><text x="18" y="59" font-family="monospace" font-size="13" fill="#7f9baa">${escapeXml(receipt.source.title)}</text></svg>`);
  composites.push({ input: svg, left: x, top: y + imageHeight });
  entries.push({
    selectionId,
    target: receipt.target,
    sourcePath: receipt.output.path,
    sourceBytes: receipt.output.bytes,
    sourceSha256: receipt.output.sha256,
    sourceDimensions: [receipt.source.width, receipt.source.height],
    sourceTitle: receipt.source.title,
    sourceCredit: receipt.source.credit,
    acquisitionReceiptSha256: receipt.receiptSha256,
  });
}
const sheet = await sharp({
  create: {
    width: columns * tileWidth,
    height: rows * tileHeight,
    channels: 3,
    background: "#020407",
  },
}).composite(composites).webp({ quality: 90, effort: 6, smartSubsample: true }).toBuffer();
atomicWrite(outputPath, sheet);
const unsigned = {
  version: "v592-deep-space-alternative-contact-sheet-receipt-v1",
  generatedAt: "2026-08-19T00:00:00Z",
  status: "contact-sheet-generated-manual-visual-analysis-required",
  selectionManifestPath: "scripts/v592-deep-space-alternative-visual-source-selections.json",
  selectionManifestSha256: sha256(readFileSync(selectionPath)),
  output: {
    path: "tmp/v592-deep-space-alternative-contact-sheet.webp",
    bytes: sheet.byteLength,
    sha256: sha256(sheet),
    width: columns * tileWidth,
    height: rows * tileHeight,
  },
  entries,
  policy: {
    sourcePixelsModified: false,
    previewResizeOnly: true,
    runtimeAssetAdmissionGranted: false,
    noAnnotationRemoval: true,
    noInpainting: true,
    scientificPayloadWriteback: false,
  },
};
const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
atomicWrite(receiptPath, Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`, "utf8"));
console.log(JSON.stringify({ status: receipt.status, output: receipt.output, entryCount: receipt.entries.length, receiptSha256: receipt.receiptSha256 }, null, 2));

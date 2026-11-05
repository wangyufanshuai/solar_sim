import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Fetches the small ESA/Hubble screen JPEG for each A3 candidate and records a
 * reproducible acquisition receipt. Bytes are held in memory only; this
 * command never promotes an image to a shipped or licensed asset.
 *
 * Usage: node scripts/acquire-mainline-a3-image-receipts.mjs
 */
const root = process.cwd();
const outputPath = path.join(root, "docs/release/v607/mainline-a-stage-a3-image-acquisition.json");
const forceRefresh = process.argv.includes("--refresh");
const candidates = [
  { objectId: "m42", imageId: "opo0205d", sourcePage: "https://esahubble.org/images/opo0205d/", expectedImageUrl: "https://cdn.esahubble.org/archives/images/screen/opo0205d.jpg" },
  { objectId: "m1", imageId: "potw1644a", sourcePage: "https://esahubble.org/images/potw1644a/", expectedImageUrl: "https://cdn.esahubble.org/archives/images/screen/potw1644a.jpg" },
  { objectId: "m8", imageId: "heic1517b", sourcePage: "https://esahubble.org/images/heic1517b/", expectedImageUrl: "https://cdn.esahubble.org/archives/images/screen/heic1517b.jpg" },
  { objectId: "m16", imageId: "heic1501e", sourcePage: "https://esahubble.org/images/heic1501e/", expectedImageUrl: "https://cdn.esahubble.org/archives/images/screen/heic1501e.jpg" },
  { objectId: "m20", imageId: "opo0417c", sourcePage: "https://esahubble.org/images/opo0417c/", expectedImageUrl: "https://cdn.esahubble.org/archives/images/screen/opo0417c.jpg" },
  { objectId: "m57", imageId: "heic1310a", sourcePage: "https://esahubble.org/images/heic1310a/", expectedImageUrl: "https://cdn.esahubble.org/archives/images/screen/heic1310a.jpg" },
];

const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");

if (fs.existsSync(outputPath) && !forceRefresh) {
  const existing = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  if (existing.schema !== "mainline-a3-image-acquisition-receipt-v1" || existing.status !== "acquired-awaiting-rights-review" || existing.rightsPolicy !== "esa-hubble-cc-by-4.0" || existing.rightsPage !== "https://esahubble.org/copyright/" || existing.localPayload?.acquired !== false || existing.localPayload?.licensed !== false || existing.candidates?.length !== candidates.length) {
    throw new Error("existing A3 acquisition receipt is malformed or prematurely promoted");
  }
  for (const candidate of candidates) {
    const row = existing.candidates.find((entry) => entry.objectId === candidate.objectId && entry.imageId === candidate.imageId);
    if (!row || row.imageUrl !== candidate.expectedImageUrl || row.sourcePage !== candidate.sourcePage || row.sourcePageStatus !== 200 || row.parseMethod !== "source-page-html-screen-jpeg-href" || row.httpStatus !== 200 || row.contentType !== "image/jpeg" || row.status !== "awaiting-rights-review" || row.rightsStatus !== "verify-per-image" || !Number.isInteger(row.byteSize) || row.byteSize <= 0 || !/^[a-f0-9]{64}$/.test(row.sha256) || !row.dimensions?.width || !row.dimensions?.height || !row.retrievedAt) {
      throw new Error(`existing A3 acquisition receipt failed validation: ${candidate.imageId}`);
    }
  }
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", candidateCount: existing.candidates.length, generatedAt: existing.generatedAt }, null, 2));
  process.exit(0);
}

function jpegDimensions(bytes) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error("response is not a JPEG");
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    const marker = bytes[offset + 1];
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    const length = bytes.readUInt16BE(offset);
    if (length < 2 || offset + length > bytes.length) break;
    const sof = [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker);
    if (sof) return { width: bytes.readUInt16BE(offset + 5), height: bytes.readUInt16BE(offset + 3) };
    offset += length;
  }
  throw new Error("JPEG dimensions not found");
}

const retrievedAt = new Date().toISOString();
const receipts = [];
for (const candidate of candidates) {
  const sourceResponse = await fetch(candidate.sourcePage, { signal: AbortSignal.timeout(45_000), redirect: "follow" });
  if (!sourceResponse.ok) throw new Error(`${candidate.imageId}: source page HTTP ${sourceResponse.status}`);
  const sourceHtml = await sourceResponse.text();
  const parsedImageUrl = sourceHtml.match(new RegExp(`https://cdn\\.esahubble\\.org/archives/images/screen/${candidate.imageId}\\.jpg`))?.[0];
  if (!parsedImageUrl || parsedImageUrl !== candidate.expectedImageUrl) throw new Error(`${candidate.imageId}: screen JPEG link was not parsed from source page`);
  const response = await fetch(parsedImageUrl, { signal: AbortSignal.timeout(45_000), redirect: "follow" });
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!response.ok) throw new Error(`${candidate.imageId}: HTTP ${response.status}`);
  receipts.push({
    objectId: candidate.objectId,
    imageId: candidate.imageId,
    sourcePage: candidate.sourcePage,
    imageUrl: parsedImageUrl,
    sourcePageStatus: sourceResponse.status,
    parseMethod: "source-page-html-screen-jpeg-href",
    httpStatus: response.status,
    contentType: response.headers.get("content-type"),
    byteSize: bytes.byteLength,
    sha256: sha256(bytes),
    dimensions: jpegDimensions(bytes),
    retrievedAt,
    status: "awaiting-rights-review",
    storage: "ephemeral-memory-only",
    rightsStatus: "verify-per-image",
  });
}

const receipt = {
  schema: "mainline-a3-image-acquisition-receipt-v1",
  generatedAt: retrievedAt,
  status: "acquired-awaiting-rights-review",
  rightsPolicy: "esa-hubble-cc-by-4.0",
  rightsPage: "https://esahubble.org/copyright/",
  localPayload: { acquired: false, licensed: false, storage: "ephemeral-memory-only" },
  candidates: receipts,
};
fs.writeFileSync(outputPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
console.log(JSON.stringify(receipt, null, 2));

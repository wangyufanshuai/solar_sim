import { createHash } from "node:crypto";
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import sharp from "sharp";

// This command is intentionally narrow: the surface URL already has a sealed
// timeout/negative receipt, so it must never be requested again. Only the
// independently unattempted topography URL is eligible for one request.
const root = process.cwd();
const definition = JSON.parse(readFileSync(resolve(root, "scripts/v591-venus-visual-sources.json"), "utf8"));
const asset = definition.assets.find((entry) => entry.id === "venus-magellan-topography-source");
const metadata = JSON.parse(readFileSync(resolve(root, definition.metadataProbe.receiptPath), "utf8"));
const receiptPath = resolve(root, "docs/release/v591/acquisition-asset-venus-topography.json");
const ledgerPath = resolve(root, "docs/release/v591/acquisition-url-ledger-venus.json");
const outputPath = resolve(root, asset.outputPath);
const assetReceiptPath = resolve(root, "docs/release/v591/acquisition-assets-venus/venus-magellan-topography-source.json");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function readSealed(path) {
  const document = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...document }; delete unsigned.receiptSha256;
  assert(document.receiptSha256 === canonicalSha(unsigned), `v591-venus-topography-seal:${path}`);
  return document;
}
function writeSealed(path, unsigned) {
  const sealed = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  mkdirSync(dirname(path), { recursive: true });
  const part = `${path}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(sealed, null, 2)}\n`, { flag: "wx" });
  rmSync(path, { force: true }); renameSync(part, path); return sealed;
}
async function shaFile(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

assert(asset && metadata.status === "metadata-candidates-confirmed-no-payload", "v591-venus-topography-definition");
const candidate = metadata.candidates.find((entry) => entry.key === asset.metadataKey);
assert(candidate?.directUrl === asset.sourceUrl && candidate.bytes === asset.expectedBytes && candidate.etag === asset.expectedEtag, "v591-venus-topography-metadata-identity");
const ledger = readSealed(ledgerPath);
assert(!ledger.entries.some((entry) => entry.url === asset.sourceUrl), "v591-venus-topography-already-attempted");
assert(!existsSync(outputPath) && !existsSync(`${outputPath}.part`) && !existsSync(assetReceiptPath), "v591-venus-topography-existing-state");
const url = new URL(asset.sourceUrl);
assert(url.protocol === "https:" && url.hostname === "asc-pds-services.s3.us-west-2.amazonaws.com" && !url.username && !url.password && !url.port, "v591-venus-topography-url");
let response;
try {
  response = await fetch(url, {
    method: "GET",
    redirect: "manual",
    headers: { "user-agent": "Orbit-Atlas-v591-venus-topography-acquisition/1.0" },
    signal: AbortSignal.timeout(30 * 60 * 1000),
  });
} catch (error) {
  writeSealed(ledgerPath, { version: ledger.version, entries: [...ledger.entries, { assetId: asset.id, url: url.href, requestedAt: new Date().toISOString(), outcome: "network-error-no-retry", error: error instanceof Error ? error.message : String(error) }] });
  throw error;
}
const mediaType = (response.headers.get("content-type") ?? "unreported").split(";")[0].trim().toLowerCase();
const redirect = [301, 302, 303, 307, 308].includes(response.status);
writeSealed(ledgerPath, { version: ledger.version, entries: [...ledger.entries, { assetId: asset.id, url: url.href, requestedAt: new Date().toISOString(), httpStatus: response.status, outcome: redirect ? "blocked-redirect-no-follow" : response.ok ? "response-received" : "http-error-no-retry", mediaType, contentLength: response.headers.get("content-length"), etag: response.headers.get("etag"), redirectTo: redirect ? response.headers.get("location") : null }] });
assert(!redirect, `v591-venus-topography-redirect-blocked:${response.headers.get("location") ?? "missing"}`);
assert(response.ok && response.body, `v591-venus-topography-http:${response.status}`);
assert(mediaType === "unreported" || asset.expectedMediaTypes.includes(mediaType), `v591-venus-topography-media-type:${mediaType}`);
assert(Number(response.headers.get("content-length")) === asset.expectedBytes, "v591-venus-topography-content-length");
assert((response.headers.get("etag") ?? "").replace(/^"|"$/g, "") === asset.expectedEtag, "v591-venus-topography-etag");
const part = `${outputPath}.part`;
mkdirSync(dirname(outputPath), { recursive: true });
try {
  await pipeline(Readable.fromWeb(response.body), createWriteStream(part, { flags: "wx" }));
  const stats = statSync(part);
  assert(stats.size === asset.expectedBytes, `v591-venus-topography-bytes:${stats.size}`);
  const image = await sharp(part, { limitInputPixels: false }).metadata();
  assert(image.format === "tiff" && image.width >= asset.minimumWidth && image.height >= asset.minimumHeight, `v591-venus-topography-dimensions:${image.width}x${image.height}`);
  const record = { ...asset, finalUrl: url.href, httpStatus: response.status, mediaType, etag: asset.expectedEtag, lastModified: response.headers.get("last-modified") ?? null, bytes: stats.size, sha256: await shaFile(part), width: image.width, height: image.height, format: image.format, bitDepth: image.bitsPerSample ?? null, sampleFormat: image.sampleFormat ?? null, metadataReceiptSha256: metadata.receiptSha256 };
  renameSync(part, outputPath);
  writeSealed(assetReceiptPath, { version: "v591-venus-visual-asset-acquisition-receipt-v1", status: "committed-single-request-no-retry", asset: record });
  const receipt = writeSealed(receiptPath, { version: "v591-venus-topography-acquisition-receipt-v1", status: "committed-single-request-no-retry", acquiredAt: new Date().toISOString(), asset: record, automaticRetryPerformed: false, automaticReplacementPerformed: false });
  console.log(JSON.stringify({ status: receipt.status, asset: { bytes: record.bytes, sha256: record.sha256, width: record.width, height: record.height }, receiptSha256: receipt.receiptSha256 }, null, 2));
} catch (error) {
  rmSync(part, { force: true });
  throw error;
}

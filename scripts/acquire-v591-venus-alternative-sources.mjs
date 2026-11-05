import { createHash } from "node:crypto";
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import sharp from "sharp";

import { parseIsisTiledCubeLayout } from "./lib/v591-isis-tile-cube.mjs";

const root = process.cwd();
const requestedId = process.argv[2];
const definition = JSON.parse(readFileSync(resolve(root, "scripts/v591-venus-alternative-visual-sources.json"), "utf8"));
const asset = definition.assets.find((entry) => entry.id === requestedId);
const metadataPath = resolve(root, "docs/release/v591/metadata-probe-venus-usgs.json");
const ledgerPath = resolve(root, "docs/release/v591/acquisition-url-ledger-venus-alternative.json");
const receiptPath = resolve(root, `docs/release/v591/acquisition-assets-venus-alternative/${requestedId}.json`);
const blockedPath = resolve(root, `docs/release/v591/acquisition-blocked-${requestedId}.json`);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function atomicWrite(path, bytes) { mkdirSync(dirname(path), { recursive: true }); const part = `${path}.receipt.part`; rmSync(part, { force: true }); writeFileSync(part, bytes, { flag: "wx" }); rmSync(path, { force: true }); renameSync(part, path); }
function writeSealed(path, unsigned) { const value = { ...unsigned, receiptSha256: canonicalSha(unsigned) }; atomicWrite(path, `${JSON.stringify(value, null, 2)}\n`); return value; }
function readSealed(path) { const value = JSON.parse(readFileSync(path, "utf8")); const unsigned = { ...value }; delete unsigned.receiptSha256; assert(value.receiptSha256 === canonicalSha(unsigned), `v591-venus-alt-seal:${path}`); return value; }
async function shaFile(path) { const hash = createHash("sha256"); for await (const chunk of createReadStream(path)) hash.update(chunk); return hash.digest("hex"); }

assert(definition.version === "v591-venus-alternative-visual-sources-v1" && asset, "v591-venus-alt-definition");
const metadata = readSealed(metadataPath);
assert(metadata.receiptSha256 === definition.metadataReceiptSha256 && metadata.status === "metadata-candidates-confirmed-no-payload", "v591-venus-alt-metadata");
const candidate = metadata.candidates.find((entry) => entry.key === asset.metadataKey);
assert(candidate && candidate.directUrl === asset.sourceUrl && candidate.bytes === asset.expectedBytes && candidate.etag === asset.expectedEtag, "v591-venus-alt-metadata-candidate");
const allowedHosts = new Set(definition.policy.allowedHosts);
const url = new URL(asset.sourceUrl);
assert(url.protocol === "https:" && allowedHosts.has(url.hostname) && !url.username && !url.password && !url.port, "v591-venus-alt-url");
const finalPath = resolve(root, asset.outputPath);
const allowedRoot = resolve(root, "source-cache/celestial-convergence-v591/venus");
assert(finalPath.startsWith(`${allowedRoot}\\`), "v591-venus-alt-output-scope");
const partPath = `${finalPath}.part`;
const ledger = existsSync(ledgerPath) ? readSealed(ledgerPath) : { version: "v591-venus-alternative-url-ledger-v1", entries: [] };
assert(Array.isArray(ledger.entries) && !ledger.entries.some((entry) => entry.url === url.href), "v591-venus-alt-repeat-url");
if (existsSync(receiptPath)) {
  const existing = readSealed(receiptPath);
  assert(existsSync(finalPath) && statSync(finalPath).size === existing.asset.bytes && await shaFile(finalPath) === existing.asset.sha256, "v591-venus-alt-existing");
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", id: requestedId, receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}
assert(!existsSync(blockedPath) && !existsSync(finalPath) && !existsSync(partPath), "v591-venus-alt-terminal-state");

let response = null;
try {
  const maximumSeconds = Number.isSafeInteger(asset.maximumSeconds) ? asset.maximumSeconds : 45 * 60;
  response = await fetch(url, { method: "GET", redirect: "manual", headers: { "user-agent": `Orbit-Atlas-v591-${requestedId}/1.0` }, signal: AbortSignal.timeout(maximumSeconds * 1000) });
  const mediaType = (response.headers.get("content-type") ?? "unreported").split(";")[0].trim().toLowerCase();
  const announcedBytes = Number(response.headers.get("content-length"));
  const etag = (response.headers.get("etag") ?? "").replace(/^"|"$/g, "");
  const location = response.headers.get("location");
  const nextLedger = writeSealed(ledgerPath, { version: "v591-venus-alternative-url-ledger-v1", entries: [...ledger.entries, { id: requestedId, url: url.href, requestedAt: new Date().toISOString(), httpStatus: response.status, finalUrl: response.url, location, contentLength: Number.isFinite(announcedBytes) ? announcedBytes : null, mediaType, etag, outcome: response.ok ? "response-received" : "http-error-no-retry" }] });
  assert(response.status === 200 && response.url === url.href && !location && response.body, `v591-venus-alt-http:${response.status}:${response.url}`);
  assert(asset.expectedMediaTypes.includes(mediaType), `v591-venus-alt-media:${mediaType}`);
  assert(announcedBytes === asset.expectedBytes && announcedBytes <= definition.policy.maximumSourceBytes && etag === asset.expectedEtag, "v591-venus-alt-header-identity");
  mkdirSync(dirname(finalPath), { recursive: true });
  await pipeline(Readable.fromWeb(response.body), createWriteStream(partPath, { flags: "wx" }));
  const bytes = statSync(partPath).size;
  assert(bytes === asset.expectedBytes, `v591-venus-alt-bytes:${bytes}`);
  let payload = { format: "pds-label", width: null, height: null, channels: null, depth: null };
  if (asset.role === "pds-label") {
    const text = readFileSync(partPath, "utf8");
    assert(/VENUS/i.test(text) && /MAGELLAN/i.test(text), "v591-venus-alt-label-identity");
  } else if (asset.role === "isis-cube") {
    const header = readFileSync(partPath).subarray(0, 131072).toString("ascii");
    const layout = parseIsisTiledCubeLayout(header);
    assert(layout.samples >= asset.minimumWidth && layout.lines >= asset.minimumHeight && layout.bands >= 1, `v591-venus-alt-cube-layout:${layout.samples}x${layout.lines}x${layout.bands}`);
    payload = { format: "isis-cube", width: layout.samples, height: layout.lines, channels: layout.bands, depth: layout.type, bitsPerSample: 8, sampleFormat: layout.type };
  } else {
    const image = await sharp(partPath, { limitInputPixels: false, unlimited: true }).metadata();
    assert(image.format === "tiff" && (image.width ?? 0) >= asset.minimumWidth && (image.height ?? 0) >= asset.minimumHeight, `v591-venus-alt-image:${image.format}:${image.width}x${image.height}`);
    payload = { format: image.format, width: image.width, height: image.height, channels: image.channels ?? null, depth: image.depth ?? null, bitsPerSample: image.bitsPerSample ?? null, sampleFormat: image.sampleFormat ?? null };
  }
  const digest = await shaFile(partPath);
  renameSync(partPath, finalPath);
  const receipt = writeSealed(receiptPath, { version: "v591-venus-alternative-acquisition-receipt-v1", status: "committed-single-request-no-retry", acquiredAt: new Date().toISOString(), requestCount: 1, automaticRetryPerformed: false, automaticReplacementPerformed: false, urlLedgerReceiptSha256: nextLedger.receiptSha256, asset: { ...asset, finalUrl: response.url, httpStatus: response.status, mediaType, etag, lastModified: response.headers.get("last-modified"), bytes, sha256: digest, ...payload, metadataReceiptSha256: metadata.receiptSha256 } });
  console.log(JSON.stringify({ status: receipt.status, id: requestedId, bytes, sha256: digest, format: payload.format, width: payload.width, height: payload.height, receiptSha256: receipt.receiptSha256 }, null, 2));
} catch (error) {
  rmSync(partPath, { force: true });
  if (response === null || !existsSync(blockedPath)) {
    const blocked = writeSealed(blockedPath, { version: "v591-venus-alternative-acquisition-blocked-v1", status: "blocked-no-automatic-retry", failedAt: new Date().toISOString(), id: requestedId, target: "venus", url: asset.sourceUrl, requestCount: 1, automaticRetryPerformed: false, automaticReplacementPerformed: false, error: error instanceof Error ? error.message : String(error) });
    console.error(JSON.stringify({ status: blocked.status, id: requestedId, receiptSha256: blocked.receiptSha256 }, null, 2));
  }
  throw error;
}

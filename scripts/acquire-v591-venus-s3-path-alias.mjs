import { createHash } from "node:crypto";
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import { parseIsisTiledCubeLayout } from "./lib/v591-isis-tile-cube.mjs";

const root = process.cwd();
const definition = JSON.parse(readFileSync(resolve(root, "scripts/v591-venus-s3-path-alias-source.json"), "utf8"));
const asset = definition.asset;
const metadataPath = resolve(root, definition.metadataReceiptPath);
const ledgerPath = resolve(root, "docs/release/v591/acquisition-url-ledger-venus-s3-path-alias.json");
const receiptPath = resolve(root, "docs/release/v591/acquisition-assets-venus-alternative/venus-clrtopo-6600m-cube-path-alias-v591.json");
const blockedPath = resolve(root, "docs/release/v591/acquisition-blocked-venus-clrtopo-6600m-cube-path-alias-v591.json");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function atomicWrite(path, bytes) { mkdirSync(dirname(path), { recursive: true }); const part = `${path}.${process.pid}.part`; rmSync(part, { force: true }); writeFileSync(part, bytes, { flag: "wx" }); rmSync(path, { force: true }); renameSync(part, path); }
function writeSealed(path, unsigned) { const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) }; atomicWrite(path, Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`, "utf8")); return receipt; }
function readSealed(path) { const value = JSON.parse(readFileSync(path, "utf8")); const unsigned = { ...value }; delete unsigned.receiptSha256; assert(value.receiptSha256 === canonicalSha(unsigned), `v591-venus-s3-alias-seal:${path}`); return value; }
async function shaFile(path) { const hash = createHash("sha256"); for await (const chunk of createReadStream(path)) hash.update(chunk); return hash.digest("hex"); }

assert(definition.version === "v591-venus-s3-path-alias-source-v1", "v591-venus-s3-alias-definition");
const metadata = readSealed(metadataPath);
assert(metadata.status === "metadata-candidate-confirmed-no-payload" && metadata.target === "venus", "v591-venus-s3-alias-metadata");
assert(metadata.candidate.directUrl === asset.sourceUrl && metadata.candidate.bytes === asset.expectedBytes && metadata.candidate.etag === asset.expectedEtag, "v591-venus-s3-alias-metadata-candidate");
const url = new URL(asset.sourceUrl);
assert(url.protocol === "https:" && url.hostname === definition.policy.allowedHost && url.pathname.startsWith(definition.policy.requiredBucketPathPrefix) && !url.username && !url.password && !url.port, "v591-venus-s3-alias-url");
const finalPath = resolve(root, asset.outputPath);
const allowedRoot = resolve(root, "source-cache/celestial-convergence-v591/venus");
assert(finalPath.startsWith(`${allowedRoot}\\`), "v591-venus-s3-alias-output-scope");
const partPath = `${finalPath}.part`;
assert(!existsSync(finalPath) && !existsSync(partPath) && !existsSync(receiptPath) && !existsSync(blockedPath), "v591-venus-s3-alias-terminal-state");
let response = null;
try {
  response = await fetch(url, { method: "GET", redirect: "manual", headers: { "user-agent": "Orbit-Atlas-v591-Venus-S3-Path-Alias-Acquisition/1.0" }, signal: AbortSignal.timeout(asset.maximumSeconds * 1000) });
  const mediaType = (response.headers.get("content-type") ?? "unreported").split(";")[0].trim().toLowerCase();
  const announcedBytes = Number(response.headers.get("content-length"));
  const etag = (response.headers.get("etag") ?? "").replace(/^"|"$/g, "");
  const location = response.headers.get("location");
  const ledger = writeSealed(ledgerPath, {
    version: "v591-venus-s3-path-alias-url-ledger-v1",
    entries: [{ id: asset.id, url: url.href, requestedAt: new Date().toISOString(), httpStatus: response.status, finalUrl: response.url, location, contentLength: Number.isFinite(announcedBytes) ? announcedBytes : null, mediaType, etag, outcome: response.ok ? "response-received" : "http-error-no-retry" }],
  });
  assert(response.status === 200 && response.url === url.href && !location && response.body, `v591-venus-s3-alias-http:${response.status}:${response.url}`);
  assert(["application/octet-stream", "binary/octet-stream", "unreported"].includes(mediaType), `v591-venus-s3-alias-media:${mediaType}`);
  assert(announcedBytes === asset.expectedBytes && etag === asset.expectedEtag, "v591-venus-s3-alias-header-identity");
  mkdirSync(dirname(finalPath), { recursive: true });
  await pipeline(Readable.fromWeb(response.body), createWriteStream(partPath, { flags: "wx" }));
  const bytes = statSync(partPath).size;
  assert(bytes === asset.expectedBytes, `v591-venus-s3-alias-bytes:${bytes}`);
  const header = readFileSync(partPath).subarray(0, 131072).toString("ascii");
  const layout = parseIsisTiledCubeLayout(header);
  assert(layout.samples >= asset.minimumWidth && layout.lines >= asset.minimumHeight && layout.bands === 3, `v591-venus-s3-alias-layout:${layout.samples}x${layout.lines}x${layout.bands}`);
  const digest = await shaFile(partPath);
  renameSync(partPath, finalPath);
  const receipt = writeSealed(receiptPath, {
    version: "v591-venus-s3-path-alias-acquisition-receipt-v1",
    status: "committed-single-request-no-retry",
    acquiredAt: new Date().toISOString(),
    requestCount: 1,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    metadataReceiptSha256: metadata.receiptSha256,
    urlLedgerReceiptSha256: ledger.receiptSha256,
    originalVirtualHostAttemptReceiptSha256: "b32582e5e6b1adc925f3a33c8b18878a8a291a6216f96d372e6fb3bf6bc8f0ee",
    identityRelation: "same-USGS-bucket-object-key-bytes-etag-new-path-style-url-not-original-url-retry",
    asset: { ...asset, finalUrl: response.url, httpStatus: response.status, mediaType, etag, lastModified: response.headers.get("last-modified"), bytes, sha256: digest, format: "isis-cube", width: layout.samples, height: layout.lines, channels: layout.bands, depth: layout.type, bitsPerSample: 8, sampleFormat: layout.type, metadataReceiptSha256: metadata.receiptSha256 },
  });
  console.log(JSON.stringify({ status: receipt.status, bytes, sha256: digest, width: layout.samples, height: layout.lines, receiptSha256: receipt.receiptSha256 }, null, 2));
} catch (error) {
  rmSync(partPath, { force: true });
  const blocked = writeSealed(blockedPath, { version: "v591-venus-s3-path-alias-acquisition-blocked-v1", status: "blocked-no-automatic-retry", failedAt: new Date().toISOString(), id: asset.id, target: "venus", url: asset.sourceUrl, requestCount: 1, automaticRetryPerformed: false, automaticReplacementPerformed: false, error: error instanceof Error ? error.message : String(error) });
  console.error(JSON.stringify({ status: blocked.status, receiptSha256: blocked.receiptSha256 }, null, 2));
  throw error;
}


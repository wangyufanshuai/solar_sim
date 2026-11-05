import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createReadStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import sharp from "sharp";

const root = process.cwd();
const assetId = "venus-topography-4641m-source-v591";
const definition = JSON.parse(readFileSync(resolve(root, "scripts/v591-venus-alternative-visual-sources.json"), "utf8"));
const asset = definition.assets.find((entry) => entry.id === assetId);
const metadataPath = resolve(root, "docs/release/v591/metadata-probe-venus-usgs.json");
const labelReceiptPath = resolve(root, "docs/release/v591/acquisition-assets-venus-alternative/venus-topography-4641m-label-v591.json");
const ledgerPath = resolve(root, "docs/release/v591/acquisition-url-ledger-venus-alternative.json");
const receiptPath = resolve(root, `docs/release/v591/acquisition-assets-venus-alternative/${assetId}.json`);
const blockedPath = resolve(root, `docs/release/v591/acquisition-blocked-${assetId}.json`);
const finalPath = resolve(root, asset.outputPath);
const partPath = `${finalPath}.part`;
const headerPath = `${finalPath}.headers.part`;
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function atomicWrite(path, bytes) { mkdirSync(dirname(path), { recursive: true }); const partial = `${path}.receipt.part`; rmSync(partial, { force: true }); writeFileSync(partial, bytes, { flag: "wx" }); rmSync(path, { force: true }); renameSync(partial, path); }
function writeSealed(path, unsigned) { const value = { ...unsigned, receiptSha256: canonicalSha(unsigned) }; atomicWrite(path, `${JSON.stringify(value, null, 2)}\n`); return value; }
function readSealed(path) { const value = JSON.parse(readFileSync(path, "utf8")); const unsigned = { ...value }; delete unsigned.receiptSha256; assert(value.receiptSha256 === canonicalSha(unsigned), `v591-venus-topography-curl-seal:${path}`); return value; }
async function shaFile(path) { const hash = createHash("sha256"); for await (const chunk of createReadStream(path)) hash.update(chunk); return hash.digest("hex"); }
function parseHeaders(text) {
  const blocks = text.split(/\r?\n\r?\n/).map((block) => block.trim()).filter(Boolean);
  const block = blocks.at(-1) ?? "";
  const lines = block.split(/\r?\n/);
  const statusMatch = lines.shift()?.match(/^HTTP\/\S+\s+(\d+)/i);
  const headers = new Map();
  for (const line of lines) {
    const colon = line.indexOf(":");
    if (colon <= 0) continue;
    headers.set(line.slice(0, colon).trim().toLowerCase(), line.slice(colon + 1).trim());
  }
  return { status: Number(statusMatch?.[1] ?? 0), headers };
}

assert(definition.version === "v591-venus-alternative-visual-sources-v1" && asset, "v591-venus-topography-curl-definition");
const metadata = readSealed(metadataPath);
const labelReceipt = readSealed(labelReceiptPath);
const candidate = metadata.candidates.find((entry) => entry.key === asset.metadataKey);
assert(metadata.receiptSha256 === definition.metadataReceiptSha256 && candidate?.directUrl === asset.sourceUrl && candidate.bytes === asset.expectedBytes && candidate.etag === asset.expectedEtag, "v591-venus-topography-curl-metadata");
assert(labelReceipt.status === "committed-single-request-no-retry" && labelReceipt.asset.body === "venus" && /Topography_Global_4641m\.lbl$/.test(labelReceipt.asset.outputPath), "v591-venus-topography-curl-label");
const ledger = readSealed(ledgerPath);
assert(Array.isArray(ledger.entries) && !ledger.entries.some((entry) => entry.url === asset.sourceUrl), "v591-venus-topography-curl-repeat-url");
const url = new URL(asset.sourceUrl);
assert(url.protocol === "https:" && url.hostname === "asc-pds-services.s3.us-west-2.amazonaws.com" && !url.username && !url.password && !url.port, "v591-venus-topography-curl-url");
const allowedRoot = resolve(root, "source-cache/celestial-convergence-v591/venus");
assert(finalPath.startsWith(`${allowedRoot}\\`), "v591-venus-topography-curl-output-scope");
if (existsSync(receiptPath)) {
  const existing = readSealed(receiptPath);
  assert(existsSync(finalPath) && statSync(finalPath).size === existing.asset.bytes && await shaFile(finalPath) === existing.asset.sha256, "v591-venus-topography-curl-existing");
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}
assert(!existsSync(blockedPath) && !existsSync(finalPath) && !existsSync(partPath) && !existsSync(headerPath), "v591-venus-topography-curl-terminal-state");
mkdirSync(dirname(finalPath), { recursive: true });

const startedAt = new Date().toISOString();
const result = spawnSync("curl.exe", [
  "--proto", "=https",
  "--tlsv1.2",
  "--retry", "0",
  "--max-redirs", "0",
  "--connect-timeout", "60",
  "--max-time", "2700",
  "--keepalive-time", "30",
  "--silent",
  "--show-error",
  "--dump-header", headerPath,
  "--output", partPath,
  "--user-agent", `Orbit-Atlas-v591-${assetId}/1.0`,
  "--write-out", "%{json}",
  url.href,
], { cwd: root, encoding: "utf8", windowsHide: true, timeout: 2_760_000, maxBuffer: 4 * 1024 * 1024 });

let headerRecord = { status: 0, headers: new Map() };
if (existsSync(headerPath)) headerRecord = parseHeaders(readFileSync(headerPath, "utf8"));
const headerContentLength = Number(headerRecord.headers.get("content-length"));
const headerEtag = (headerRecord.headers.get("etag") ?? "").replace(/^"|"$/g, "");
const headerLocation = headerRecord.headers.get("location") ?? null;
const mediaType = (headerRecord.headers.get("content-type") ?? "unreported").split(";")[0].trim().toLowerCase();
let curlMetrics = null;
try { curlMetrics = result.stdout ? JSON.parse(result.stdout) : null; } catch { /* retain raw stdout only in blocked receipt */ }
const ledgerEntry = {
  id: assetId,
  url: url.href,
  requestedAt: startedAt,
  httpStatus: headerRecord.status || curlMetrics?.http_code || null,
  finalUrl: curlMetrics?.url_effective ?? url.href,
  location: headerLocation,
  contentLength: Number.isFinite(headerContentLength) ? headerContentLength : null,
  mediaType,
  etag: headerEtag || null,
  curlExitCode: result.status,
  curlError: result.stderr?.trim() || null,
  outcome: result.status === 0 ? "response-body-completed" : "curl-failed-no-retry",
};
const nextLedger = writeSealed(ledgerPath, { version: "v591-venus-alternative-url-ledger-v1", entries: [...ledger.entries, ledgerEntry] });

try {
  assert(result.status === 0, `v591-venus-topography-curl-exit:${result.status}:${result.stderr?.trim() ?? "unknown"}`);
  assert(headerRecord.status === 200 && !headerLocation && (curlMetrics?.url_effective ?? url.href) === url.href, `v591-venus-topography-curl-http:${headerRecord.status}:${headerLocation ?? "none"}`);
  assert(asset.expectedMediaTypes.includes(mediaType) && headerContentLength === asset.expectedBytes && headerEtag === asset.expectedEtag, "v591-venus-topography-curl-header-identity");
  assert(existsSync(partPath) && statSync(partPath).size === asset.expectedBytes, `v591-venus-topography-curl-bytes:${existsSync(partPath) ? statSync(partPath).size : 0}`);
  const image = await sharp(partPath, { limitInputPixels: false, unlimited: true }).metadata();
  assert(image.format === "tiff" && image.width === 8193 && image.height === 4097 && image.channels === 1, `v591-venus-topography-curl-image:${image.format}:${image.width}x${image.height}:${image.channels}`);
  const digest = await shaFile(partPath);
  renameSync(partPath, finalPath);
  rmSync(headerPath, { force: true });
  const receipt = writeSealed(receiptPath, {
    version: "v591-venus-alternative-acquisition-receipt-v1",
    status: "committed-single-request-no-retry",
    acquiredAt: new Date().toISOString(),
    requestCount: 1,
    client: { name: "curl", version: String(curlMetrics?.curl_version ?? "8.16.0"), retries: 0, redirectsFollowed: 0, maximumSeconds: 2700 },
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    urlLedgerReceiptSha256: nextLedger.receiptSha256,
    labelReceiptSha256: labelReceipt.receiptSha256,
    asset: { ...asset, finalUrl: url.href, httpStatus: 200, mediaType, etag: headerEtag, lastModified: headerRecord.headers.get("last-modified") ?? candidate.lastModified, bytes: asset.expectedBytes, sha256: digest, format: image.format, width: image.width, height: image.height, channels: image.channels, depth: image.depth ?? null, bitsPerSample: image.bitsPerSample ?? null, sampleFormat: image.sampleFormat ?? null, metadataReceiptSha256: metadata.receiptSha256 },
  });
  console.log(JSON.stringify({ status: receipt.status, bytes: asset.expectedBytes, sha256: digest, width: image.width, height: image.height, receiptSha256: receipt.receiptSha256 }, null, 2));
} catch (error) {
  const partialBytes = existsSync(partPath) ? statSync(partPath).size : 0;
  rmSync(partPath, { force: true });
  rmSync(headerPath, { force: true });
  const blocked = writeSealed(blockedPath, {
    version: "v591-venus-alternative-acquisition-blocked-v1",
    status: "blocked-no-automatic-retry",
    failedAt: new Date().toISOString(),
    id: assetId,
    target: "venus",
    url: asset.sourceUrl,
    requestCount: 1,
    client: { name: "curl", retries: 0, redirectsFollowed: 0, maximumSeconds: 2700 },
    response: ledgerEntry,
    partialBytesRemoved: partialBytes,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    error: error instanceof Error ? error.message : String(error),
  });
  console.error(JSON.stringify({ status: blocked.status, partialBytesRemoved: partialBytes, receiptSha256: blocked.receiptSha256 }, null, 2));
  throw error;
}

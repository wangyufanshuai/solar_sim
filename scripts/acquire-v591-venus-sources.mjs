import { createHash } from "node:crypto";
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import sharp from "sharp";

const root = process.cwd();
const definitionPath = resolve(root, "scripts/v591-venus-visual-sources.json");
const receiptPath = resolve(root, "docs/release/v591/acquisition-receipt-venus.json");
const blockedPath = resolve(root, "docs/release/v591/acquisition-blocked-venus.json");
const ledgerPath = resolve(root, "docs/release/v591/acquisition-url-ledger-venus.json");
const assetReceiptRoot = resolve(root, "docs/release/v591/acquisition-assets-venus");
const definition = JSON.parse(readFileSync(definitionPath, "utf8"));
const metadataPath = resolve(root, definition.metadataProbe.receiptPath);

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
function readSealed(path) {
  const document = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...document };
  delete unsigned.receiptSha256;
  assert(document.receiptSha256 === canonicalSha(unsigned), `v591-venus-seal:${path}`);
  return document;
}
function writeSealed(path, unsigned) {
  const sealed = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  mkdirSync(dirname(path), { recursive: true });
  const part = `${path}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(sealed, null, 2)}\n`, { flag: "wx" });
  rmSync(path, { force: true });
  renameSync(part, path);
  return sealed;
}
async function sha256File(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

assert(definition.version === "v591-venus-visual-sources-v1", "v591-venus-definition-version");
assert(definition.policy.singleRequestPerUrl === true && definition.policy.automaticRetryAllowed === false, "v591-venus-request-policy");
assert(Array.isArray(definition.assets) && definition.assets.length === 2, "v591-venus-definition-assets");
const metadata = readSealed(metadataPath);
assert(metadata.receiptSha256 === definition.metadataProbe.receiptSha256, "v591-venus-metadata-receipt");
assert(metadata.status === "metadata-candidates-confirmed-no-payload", "v591-venus-metadata-status");
const candidateByKey = new Map(metadata.candidates.map((candidate) => [candidate.key, candidate]));
const allowedHosts = new Set(definition.policy.allowedHosts.map((host) => host.toLowerCase()));
let ledger = existsSync(ledgerPath)
  ? readSealed(ledgerPath)
  : { version: "v591-venus-acquisition-url-ledger-v1", entries: [], receiptSha256: null };
assert(ledger.version === "v591-venus-acquisition-url-ledger-v1" && Array.isArray(ledger.entries), "v591-venus-ledger-contract");
const requestedUrls = new Set(ledger.entries.map((entry) => entry.url));
function appendLedger(entry) {
  ledger = writeSealed(ledgerPath, {
    version: "v591-venus-acquisition-url-ledger-v1",
    entries: [...ledger.entries, entry],
  });
}
function safeUrl(raw) {
  const url = new URL(raw);
  assert(url.protocol === "https:" && allowedHosts.has(url.hostname.toLowerCase()), `v591-venus-url-host:${url.hostname}`);
  assert(!url.username && !url.password && !url.port, "v591-venus-url-credentials");
  return url;
}
async function acquire(asset) {
  const candidate = candidateByKey.get(asset.metadataKey);
  assert(candidate?.directUrl === asset.sourceUrl, `v591-venus-metadata-url:${asset.id}`);
  assert(candidate.bytes === asset.expectedBytes && candidate.etag === asset.expectedEtag, `v591-venus-metadata-object:${asset.id}`);
  const finalPath = resolve(root, asset.outputPath);
  const allowedRoot = resolve(root, "source-cache/celestial-convergence-v591/venus");
  assert(finalPath === allowedRoot || finalPath.startsWith(`${allowedRoot}\\`), `v591-venus-output-scope:${asset.id}`);
  const partPath = `${finalPath}.part`;
  const assetReceiptPath = resolve(assetReceiptRoot, `${asset.id}.json`);
  if (existsSync(finalPath) || existsSync(assetReceiptPath)) {
    assert(existsSync(finalPath) && existsSync(assetReceiptPath) && !existsSync(partPath), `v591-venus-existing-state:${asset.id}`);
    const committed = readSealed(assetReceiptPath);
    const stats = statSync(finalPath);
    assert(committed.asset?.sourceUrl === asset.sourceUrl && committed.asset.bytes === stats.size, `v591-venus-existing-identity:${asset.id}`);
    assert(committed.asset.sha256 === await sha256File(finalPath), `v591-venus-existing-sha:${asset.id}`);
    return committed.asset;
  }
  const url = safeUrl(asset.sourceUrl);
  assert(!requestedUrls.has(url.href), `v591-venus-repeat-url:${url.href}`);
  requestedUrls.add(url.href);
  mkdirSync(dirname(finalPath), { recursive: true });
  assert(!existsSync(partPath), `v591-venus-part-exists:${asset.id}`);
  let response;
  try {
    response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: { "user-agent": "Orbit-Atlas-v591-venus-acquisition/1.0" },
      signal: AbortSignal.timeout(30 * 60 * 1000),
    });
  } catch (error) {
    appendLedger({ assetId: asset.id, url: url.href, requestedAt: new Date().toISOString(), outcome: "network-error-no-retry", error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
  const mediaType = (response.headers.get("content-type") ?? "unreported").split(";")[0].trim().toLowerCase();
  const redirect = [301, 302, 303, 307, 308].includes(response.status);
  appendLedger({
    assetId: asset.id,
    url: url.href,
    requestedAt: new Date().toISOString(),
    httpStatus: response.status,
    outcome: redirect ? "blocked-redirect-no-follow" : response.ok ? "response-received" : "http-error-no-retry",
    mediaType,
    contentLength: response.headers.get("content-length"),
    etag: response.headers.get("etag"),
    redirectTo: redirect ? response.headers.get("location") : null,
  });
  assert(!redirect, `v591-venus-redirect-blocked:${response.headers.get("location") ?? "missing"}`);
  assert(response.ok && response.body, `v591-venus-http:${asset.id}:${response.status}`);
  assert(mediaType === "unreported" || asset.expectedMediaTypes.includes(mediaType), `v591-venus-media-type:${asset.id}:${mediaType}`);
  const announcedBytes = Number(response.headers.get("content-length"));
  assert(announcedBytes === asset.expectedBytes && announcedBytes <= definition.policy.maximumSourceBytes, `v591-venus-content-length:${asset.id}:${announcedBytes}`);
  const etag = (response.headers.get("etag") ?? "").replace(/^"|"$/g, "");
  assert(etag === asset.expectedEtag, `v591-venus-etag:${asset.id}:${etag}`);
  try {
    await pipeline(Readable.fromWeb(response.body), createWriteStream(partPath, { flags: "wx" }));
    const stats = statSync(partPath);
    assert(stats.size === asset.expectedBytes, `v591-venus-bytes:${asset.id}:${stats.size}`);
    const image = await sharp(partPath, { limitInputPixels: false }).metadata();
    const ratio = (image.width ?? 0) / Math.max(1, image.height ?? 0);
    assert(image.format === "tiff" && (image.width ?? 0) >= asset.minimumWidth && (image.height ?? 0) >= asset.minimumHeight && ratio >= 1.95 && ratio <= 2.05, `v591-venus-dimensions:${asset.id}:${image.width ?? 0}x${image.height ?? 0}`);
    const record = {
      ...asset,
      finalUrl: url.href,
      httpStatus: response.status,
      mediaType,
      etag,
      lastModified: response.headers.get("last-modified") ?? null,
      bytes: stats.size,
      sha256: await sha256File(partPath),
      width: image.width,
      height: image.height,
      format: image.format,
      bitDepth: image.bitsPerSample ?? null,
      sampleFormat: image.sampleFormat ?? null,
      metadataReceiptSha256: metadata.receiptSha256,
    };
    renameSync(partPath, finalPath);
    writeSealed(assetReceiptPath, {
      version: "v591-venus-visual-asset-acquisition-receipt-v1",
      status: "committed-single-request-no-retry",
      asset: record,
    });
    return record;
  } catch (error) {
    rmSync(partPath, { force: true });
    throw error;
  }
}

const acquired = [];
try {
  if (existsSync(receiptPath)) {
    const existing = readSealed(receiptPath);
    assert(existing.status === "acquired-two-urls-single-request-each-no-retry", "v591-venus-existing-receipt-status");
    console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", receiptSha256: existing.receiptSha256 }, null, 2));
  } else {
    for (const asset of definition.assets) acquired.push(await acquire(asset));
    const finalLedger = readSealed(ledgerPath);
    const receipt = writeSealed(receiptPath, {
      version: "v591-venus-visual-acquisition-receipt-v1",
      acquiredAt: new Date().toISOString(),
      status: "acquired-two-urls-single-request-each-no-retry",
      metadataReceiptSha256: metadata.receiptSha256,
      policy: definition.policy,
      cloudModel: definition.cloudModel,
      requestedUrlCount: finalLedger.entries.length,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      urlLedgerReceiptSha256: finalLedger.receiptSha256,
      assets: acquired,
    });
    console.log(JSON.stringify({ status: receipt.status, assets: acquired.map(({ id, bytes, sha256: digest, width, height }) => ({ id, bytes, sha256: digest, width, height })), receiptSha256: receipt.receiptSha256 }, null, 2));
  }
} catch (error) {
  const blocked = writeSealed(blockedPath, {
    version: "v591-venus-visual-acquisition-blocked-v1",
    status: "blocked-no-automatic-retry",
    failedAt: new Date().toISOString(),
    error: error instanceof Error ? error.message : String(error),
    committedAssetIds: acquired.map((asset) => asset.id),
    requestedUrls: [...requestedUrls],
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
  });
  console.error(JSON.stringify({ status: blocked.status, error: blocked.error, receiptSha256: blocked.receiptSha256 }, null, 2));
  throw error;
}

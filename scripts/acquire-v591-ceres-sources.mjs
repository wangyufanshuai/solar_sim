import { createHash } from "node:crypto";
import {
  closeSync,
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import sharp from "sharp";

const root = process.cwd();
const definitionPath = resolve(root, "scripts/v591-ceres-visual-sources.json");
const metadataPath = resolve(root, "docs/release/v591/metadata-probe-ceres-usgs.json");
const receiptPath = resolve(root, "docs/release/v591/acquisition-receipt-ceres.json");
const blockedPath = resolve(root, "docs/release/v591/acquisition-blocked-ceres.json");
const ledgerPath = resolve(root, "docs/release/v591/acquisition-url-ledger-ceres.json");
const lockPath = resolve(root, "docs/release/v591/acquisition-run-ceres.lock");
const assetReceiptRoot = resolve(root, "docs/release/v591/acquisition-assets-ceres");
const definitions = JSON.parse(readFileSync(definitionPath, "utf8"));

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
  assert(document.receiptSha256 === canonicalSha(unsigned), `v591-ceres-acquisition-seal:${path}`);
  return document;
}
function writeSealed(path, unsigned) {
  const sealed = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  rmSync(partial, { force: true });
  writeFileSync(partial, `${JSON.stringify(sealed, null, 2)}\n`, { flag: "wx" });
  rmSync(path, { force: true });
  renameSync(partial, path);
  return sealed;
}
async function sha256File(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

assert(definitions.version === "v591-ceres-visual-sources-v1", "v591-ceres-acquisition-definition-version");
assert(definitions.policy?.singleRequestPerUrl === true && definitions.policy?.automaticRetryAllowed === false, "v591-ceres-acquisition-policy");
assert(Array.isArray(definitions.assets) && definitions.assets.length === 4, "v591-ceres-acquisition-assets");
const metadata = readSealed(metadataPath);
assert(metadata.status === "metadata-candidates-confirmed-no-payload", "v591-ceres-acquisition-metadata-status");
assert(metadata.receiptSha256 === definitions.metadataReceiptSha256, "v591-ceres-acquisition-metadata-sha");
const metadataByKey = new Map(metadata.candidates.map((candidate) => [candidate.key, candidate]));
const allowedHosts = new Set(definitions.policy.allowedHosts.map((host) => host.toLowerCase()));
const ledger = existsSync(ledgerPath)
  ? readSealed(ledgerPath)
  : { version: "v591-ceres-acquisition-url-ledger-v1", entries: [], receiptSha256: null };
assert(ledger.version === "v591-ceres-acquisition-url-ledger-v1" && Array.isArray(ledger.entries), "v591-ceres-acquisition-ledger");
const requestedUrls = new Set(ledger.entries.map((entry) => entry.url));
let ownedPartialPath = null;
let lockFileDescriptor = null;

function acquireRunLock() {
  mkdirSync(dirname(lockPath), { recursive: true });
  try {
    lockFileDescriptor = openSync(lockPath, "wx");
    writeSync(lockFileDescriptor, `${JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() })}\n`);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`v591-ceres-acquisition-single-owner-lock:${detail}`);
  }
}

function releaseRunLock() {
  if (lockFileDescriptor !== null) {
    closeSync(lockFileDescriptor);
    lockFileDescriptor = null;
    rmSync(lockPath, { force: true });
  }
}
function appendLedger(entry) {
  const next = writeSealed(ledgerPath, { version: "v591-ceres-acquisition-url-ledger-v1", entries: [...ledger.entries, entry] });
  ledger.entries = next.entries;
  ledger.receiptSha256 = next.receiptSha256;
}
function assertAllowedUrl(rawUrl) {
  const url = new URL(rawUrl);
  assert(url.protocol === "https:" && allowedHosts.has(url.hostname.toLowerCase()) && !url.username && !url.password && !url.port, `v591-ceres-acquisition-url:${url.hostname}`);
  return url;
}
function tiffMagic(path) {
  const bytes = readFileSync(path);
  const prefix = bytes.subarray(0, 4).toString("hex");
  return prefix === "49492a00" || prefix === "4d4d002a" || prefix === "49492b00" || prefix === "4d4d002b";
}
async function validatePayload(path, asset) {
  if (asset.role === "pds-label") {
    const text = readFileSync(path, "utf8");
    assert(/CERES/i.test(text) && /DAWN/i.test(text), `v591-ceres-acquisition-label-identity:${asset.id}`);
    return { format: "pds-label", width: null, height: null, channels: null, depth: null };
  }
  assert(tiffMagic(path), `v591-ceres-acquisition-tiff-magic:${asset.id}`);
  const metadataRecord = await sharp(path, { limitInputPixels: false, unlimited: true }).metadata();
  const width = metadataRecord.width ?? 0;
  const height = metadataRecord.height ?? 0;
  assert(metadataRecord.format === "tiff" && width >= asset.minimumWidth && height >= asset.minimumHeight, `v591-ceres-acquisition-dimensions:${asset.id}:${width}x${height}:${metadataRecord.format ?? "unknown"}`);
  assert(width / height >= 1.9 && width / height <= 2.1, `v591-ceres-acquisition-aspect:${asset.id}:${width}x${height}`);
  return { format: metadataRecord.format, width, height, channels: metadataRecord.channels ?? null, depth: metadataRecord.depth ?? null };
}
async function acquire(asset) {
  const candidate = metadataByKey.get(asset.metadataKey);
  assert(candidate, `v591-ceres-acquisition-metadata-key:${asset.id}`);
  assert(candidate.directUrl === asset.sourceUrl && candidate.bytes === asset.expectedBytes && candidate.etag === asset.expectedEtag, `v591-ceres-acquisition-metadata-object:${asset.id}`);
  const sourceUrl = assertAllowedUrl(asset.sourceUrl);
  const finalPath = resolve(root, asset.outputPath);
  const allowedRoot = resolve(root, "source-cache/celestial-convergence-v591/ceres");
  assert(finalPath === allowedRoot || finalPath.startsWith(`${allowedRoot}\\`), `v591-ceres-acquisition-output-scope:${asset.id}`);
  const partialPath = `${finalPath}.part`;
  const assetReceiptPath = resolve(assetReceiptRoot, `${asset.id}.json`);
  if (existsSync(finalPath) || existsSync(assetReceiptPath)) {
    assert(existsSync(finalPath) && existsSync(assetReceiptPath) && !existsSync(partialPath), `v591-ceres-acquisition-existing-state:${asset.id}`);
    const committed = readSealed(assetReceiptPath);
    const stats = statSync(finalPath);
    assert(committed.asset?.sourceUrl === asset.sourceUrl && committed.asset?.bytes === stats.size, `v591-ceres-acquisition-existing-identity:${asset.id}`);
    assert(committed.asset.sha256 === await sha256File(finalPath), `v591-ceres-acquisition-existing-sha:${asset.id}`);
    return committed.asset;
  }
  if (existsSync(partialPath)) {
    throw new Error(`v591-ceres-acquisition-preexisting-partial-terminal-block-no-retry:${asset.id}:${statSync(partialPath).size}`);
  }
  assert(!requestedUrls.has(sourceUrl.href), `v591-ceres-acquisition-repeat-url:${sourceUrl.href}`);
  requestedUrls.add(sourceUrl.href);
  mkdirSync(dirname(finalPath), { recursive: true });
  let response;
  try {
    response = await fetch(sourceUrl, {
      method: "GET",
      redirect: "manual",
      headers: { "user-agent": "Orbit-Atlas-v591-ceres-acquisition/1.0" },
      signal: AbortSignal.timeout(30 * 60 * 1000),
    });
  } catch (error) {
    appendLedger({ assetId: asset.id, url: sourceUrl.href, requestedAt: new Date().toISOString(), outcome: "network-error-no-retry", error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
  const mediaType = (response.headers.get("content-type") ?? "unreported").split(";")[0].trim().toLowerCase();
  appendLedger({
    assetId: asset.id,
    url: sourceUrl.href,
    requestedAt: new Date().toISOString(),
    httpStatus: response.status,
    outcome: response.ok ? "response-received" : "http-error-no-retry",
    redirectTo: response.headers.get("location"),
    mediaType,
    contentLength: response.headers.get("content-length"),
    etag: response.headers.get("etag"),
    lastModified: response.headers.get("last-modified"),
  });
  assert(response.status === 200 && response.url === sourceUrl.href && !response.headers.get("location") && response.body, `v591-ceres-acquisition-http:${asset.id}:${response.status}:${response.url}`);
  assert(asset.expectedMediaTypes.includes(mediaType), `v591-ceres-acquisition-media-type:${asset.id}:${mediaType}`);
  assert(Number(response.headers.get("content-length")) === asset.expectedBytes, `v591-ceres-acquisition-content-length:${asset.id}`);
  assert((response.headers.get("etag") ?? "").replace(/^"|"$/g, "") === asset.expectedEtag, `v591-ceres-acquisition-etag:${asset.id}`);
  const output = createWriteStream(partialPath, { flags: "wx" });
  await new Promise((resolveOpen, rejectOpen) => {
    output.once("open", resolveOpen);
    output.once("error", rejectOpen);
  });
  ownedPartialPath = partialPath;
  await pipeline(Readable.fromWeb(response.body), output);
  const stats = statSync(partialPath);
  assert(stats.size === asset.expectedBytes, `v591-ceres-acquisition-bytes:${asset.id}:${stats.size}`);
  const digest = await sha256File(partialPath);
  const payload = await validatePayload(partialPath, asset);
  renameSync(partialPath, finalPath);
  ownedPartialPath = null;
  const record = {
    id: asset.id,
    body: asset.body,
    role: asset.role,
    sourceUrl: asset.sourceUrl,
    finalUrl: response.url,
    redirectChain: [],
    httpStatus: response.status,
    mediaType,
    etag: asset.expectedEtag,
    lastModified: response.headers.get("last-modified") ?? candidate.lastModified,
    outputPath: asset.outputPath,
    bytes: stats.size,
    sha256: digest,
    ...payload,
    license: asset.license,
    observationIdentity: asset.observationIdentity,
    observationLimit: asset.observationLimit,
    presentationOnly: true,
    metadataReceiptSha256: metadata.receiptSha256,
  };
  writeSealed(assetReceiptPath, {
    version: "v591-ceres-visual-asset-acquisition-receipt-v1",
    status: "committed-single-request-no-retry",
    asset: record,
  });
  return record;
}

if (existsSync(blockedPath)) {
  const existing = readSealed(blockedPath);
  assert(existing.status === "blocked-no-automatic-retry", "v591-ceres-acquisition-terminal-block-status");
  assert(existing.automaticRetryPerformed === false && existing.automaticReplacementPerformed === false, "v591-ceres-acquisition-terminal-block-policy");
  console.log(JSON.stringify({ status: "existing-terminal-block-verified-no-network", receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}

acquireRunLock();
try {
  if (existsSync(receiptPath)) {
    const existing = readSealed(receiptPath);
    assert(existing.status === "acquired-four-urls-single-request-each-no-retry", "v591-ceres-acquisition-existing-status");
    for (const asset of existing.assets) {
      const path = resolve(root, asset.outputPath);
      assert(existsSync(path) && statSync(path).size === asset.bytes && await sha256File(path) === asset.sha256, `v591-ceres-acquisition-existing-source:${asset.id}`);
    }
    console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", receiptSha256: existing.receiptSha256 }, null, 2));
  } else {
    const assets = [];
    for (const asset of definitions.assets) assets.push(await acquire(asset));
    const sourceCacheBytes = assets.reduce((sum, asset) => sum + asset.bytes, 0);
    const receipt = writeSealed(receiptPath, {
      version: "v591-ceres-visual-acquisition-receipt-v1",
      acquiredAt: new Date().toISOString(),
      status: "acquired-four-urls-single-request-each-no-retry",
      metadataReceiptSha256: metadata.receiptSha256,
      policy: definitions.policy,
      requestedUrlCount: 4,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      urlLedgerReceiptSha256: readSealed(ledgerPath).receiptSha256,
      sourceCacheBytes,
      assets,
    });
    console.log(JSON.stringify({
      status: receipt.status,
      sourceCacheBytes,
      assets: assets.map(({ id, bytes, sha256: digest, width, height, format }) => ({ id, bytes, sha256: digest, width, height, format })),
      receiptSha256: receipt.receiptSha256,
    }, null, 2));
  }
} catch (error) {
  if (ownedPartialPath !== null) {
    rmSync(ownedPartialPath, { force: true });
    ownedPartialPath = null;
  }
  const blocked = writeSealed(blockedPath, {
    version: "v591-ceres-visual-acquisition-blocked-v1",
    failedAt: new Date().toISOString(),
    status: "blocked-no-automatic-retry",
    metadataReceiptSha256: metadata.receiptSha256,
    requestedUrls: [...requestedUrls],
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    error: error instanceof Error ? error.message : String(error),
  });
  console.error(JSON.stringify({ status: blocked.status, error: blocked.error, receiptSha256: blocked.receiptSha256 }, null, 2));
  throw error;
} finally {
  releaseRunLock();
}

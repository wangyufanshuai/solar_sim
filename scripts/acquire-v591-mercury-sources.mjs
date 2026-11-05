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
const definitionPath = resolve(root, "scripts/v591-mercury-visual-sources.json");
const receiptPath = resolve(root, "docs/release/v591/acquisition-receipt-mercury.json");
const blockedReceiptPath = resolve(root, "docs/release/v591/acquisition-blocked-mercury.json");
const urlLedgerPath = resolve(root, "docs/release/v591/acquisition-url-ledger-mercury.json");
const assetReceiptDirectory = resolve(root, "docs/release/v591/acquisition-assets-mercury");
const definitions = JSON.parse(readFileSync(definitionPath, "utf8"));
const metadataReceiptPath = resolve(root, "docs/release/v591/metadata-probe-mercury-usgs-dem.json");

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
  const receipt = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...receipt };
  delete unsigned.receiptSha256;
  assert(receipt.receiptSha256 === canonicalSha(unsigned), `v591-mercury-acquisition-seal:${path}`);
  return receipt;
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

assert(definitions.version === "v591-mercury-visual-sources-v1", "v591-mercury-acquisition-definition-version");
assert(Array.isArray(definitions.assets) && definitions.assets.length === 1, "v591-mercury-acquisition-definition-assets");
const metadataReceipt = readSealed(metadataReceiptPath);
assert(metadataReceipt.status === "metadata-identity-confirmed-no-payload", "v591-mercury-acquisition-metadata-status");
const allowedHosts = new Set(definitions.policy.allowedHosts.map((host) => host.toLowerCase()));
const urlLedger = existsSync(urlLedgerPath)
  ? readSealed(urlLedgerPath)
  : { version: "v591-mercury-acquisition-url-ledger-v1", entries: [], receiptSha256: null };
assert(urlLedger.version === "v591-mercury-acquisition-url-ledger-v1" && Array.isArray(urlLedger.entries), "v591-mercury-acquisition-ledger-contract");
const blockedHistory = existsSync(blockedReceiptPath) ? readSealed(blockedReceiptPath) : null;
const requestedUrls = new Set([
  ...urlLedger.entries.map((entry) => entry.url),
  ...(blockedHistory?.attempts ?? []).flatMap((attempt) => attempt.requestedUrls ?? []),
]);
function appendUrlLedger(entry) {
  const next = writeSealed(urlLedgerPath, {
    version: "v591-mercury-acquisition-url-ledger-v1",
    entries: [...urlLedger.entries, entry],
  });
  urlLedger.entries = next.entries;
  urlLedger.receiptSha256 = next.receiptSha256;
}
function assertAllowedUrl(rawUrl) {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:" || !allowedHosts.has(url.hostname.toLowerCase()) || url.username || url.password || url.port) {
    throw new Error(`v591-mercury-acquisition-url:${url.hostname}`);
  }
  return url;
}
async function fetchOnceFollowingAllowedRedirects(asset) {
  let current = assertAllowedUrl(asset.sourceUrl);
  const redirectChain = [];
  for (let hop = 0; hop <= definitions.policy.maximumRedirectHops; hop += 1) {
    if (requestedUrls.has(current.href)) throw new Error(`v591-mercury-acquisition-repeat-url:${current.href}`);
    requestedUrls.add(current.href);
    let response;
    try {
      response = await fetch(current, {
        method: "GET",
        redirect: "manual",
        headers: { "user-agent": "Orbit-Atlas-v591-mercury-acquisition/1.0" },
        signal: AbortSignal.timeout(30 * 60 * 1000),
      });
    } catch (error) {
      appendUrlLedger({
        assetId: asset.id,
        url: current.href,
        requestedAt: new Date().toISOString(),
        outcome: "network-error-no-retry",
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
    const mediaType = (response.headers.get("content-type") ?? "unreported").split(";")[0].trim().toLowerCase();
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error(`v591-mercury-acquisition-redirect-location:${response.status}`);
      const redirectUrl = new URL(location, current).href;
      let next;
      try {
        next = assertAllowedUrl(redirectUrl);
      } catch (error) {
        appendUrlLedger({
          assetId: asset.id,
          url: current.href,
          requestedAt: new Date().toISOString(),
          httpStatus: response.status,
          outcome: "blocked-redirect-host-no-follow",
          redirectTo: redirectUrl,
        });
        throw error;
      }
      redirectChain.push({ status: response.status, from: current.href, to: next.href });
      appendUrlLedger({
        assetId: asset.id,
        url: current.href,
        requestedAt: new Date().toISOString(),
        httpStatus: response.status,
        outcome: "allowed-redirect",
        redirectTo: next.href,
      });
      current = next;
      continue;
    }
    appendUrlLedger({
      assetId: asset.id,
      url: current.href,
      requestedAt: new Date().toISOString(),
      httpStatus: response.status,
      outcome: response.ok ? "response-received" : "http-error-no-retry",
      mediaType,
      contentLength: response.headers.get("content-length"),
      etag: response.headers.get("etag"),
      lastModified: response.headers.get("last-modified"),
    });
    return { response, finalUrl: current.href, redirectChain, mediaType };
  }
  throw new Error("v591-mercury-acquisition-redirect-depth");
}
async function validateAlbedoReference() {
  const reference = definitions.albedoReference;
  const path = resolve(root, reference.path);
  const bytes = readFileSync(path);
  assert(bytes.byteLength === reference.sourceBytes && sha256(bytes) === reference.sourceSha256, "v591-mercury-albedo-reference-bytes");
  const metadata = await sharp(path, { limitInputPixels: false }).metadata();
  assert(metadata.width === reference.width && metadata.height === reference.height && metadata.format === "jpeg", "v591-mercury-albedo-reference-dimensions");
  return {
    ...reference,
    actualBytes: bytes.byteLength,
    actualSha256: sha256(bytes),
    actualWidth: metadata.width,
    actualHeight: metadata.height,
    exactByteReuse: true,
    networkRequestPerformed: false,
  };
}
async function acquire(asset) {
  assert(asset.sourceUrl === metadataReceipt.object?.directUrl, `v591-mercury-acquisition-metadata-url:${asset.id}`);
  assert(asset.expectedBytes === metadataReceipt.object?.bytes && asset.expectedEtag === metadataReceipt.object?.etag, `v591-mercury-acquisition-metadata-object:${asset.id}`);
  assert(asset.metadataReceiptSha256 === metadataReceipt.receiptSha256, `v591-mercury-acquisition-metadata-receipt:${asset.id}`);
  const finalPath = resolve(root, asset.outputPath);
  const allowedRoot = resolve(root, "source-cache/celestial-convergence-v591/mercury");
  assert(finalPath.startsWith(`${allowedRoot}\\`) || finalPath === allowedRoot, `v591-mercury-acquisition-output-scope:${asset.id}`);
  const partialPath = `${finalPath}.part`;
  const assetReceiptPath = resolve(assetReceiptDirectory, `${asset.id}.json`);
  if (existsSync(finalPath) || existsSync(assetReceiptPath)) {
    assert(existsSync(finalPath) && existsSync(assetReceiptPath) && !existsSync(partialPath), `v591-mercury-acquisition-existing-state:${asset.id}`);
    const committed = readSealed(assetReceiptPath);
    const stats = statSync(finalPath);
    assert(committed.asset?.sourceUrl === asset.sourceUrl && committed.asset?.bytes === stats.size, `v591-mercury-acquisition-existing-identity:${asset.id}`);
    assert(committed.asset.sha256 === await sha256File(finalPath), `v591-mercury-acquisition-existing-sha:${asset.id}`);
    return committed.asset;
  }
  assert(!existsSync(partialPath), `v591-mercury-acquisition-part-exists:${asset.id}`);
  mkdirSync(dirname(finalPath), { recursive: true });
  try {
    const responseMeta = await fetchOnceFollowingAllowedRedirects(asset);
    const { response } = responseMeta;
    if (!response.ok || !response.body) throw new Error(`v591-mercury-acquisition-http:${asset.id}:${response.status}`);
    assert(responseMeta.finalUrl === asset.sourceUrl && responseMeta.redirectChain.length === 0, `v591-mercury-acquisition-direct-object:${asset.id}`);
    if (responseMeta.mediaType !== "unreported" && !asset.expectedMediaTypes.includes(responseMeta.mediaType)) {
      throw new Error(`v591-mercury-acquisition-media-type:${asset.id}:${responseMeta.mediaType}`);
    }
    const announcedBytes = Number(response.headers.get("content-length"));
    assert(announcedBytes === asset.expectedBytes && announcedBytes <= asset.maximumBytes, `v591-mercury-acquisition-content-length:${announcedBytes}`);
    const responseEtag = (response.headers.get("etag") ?? "").replace(/^"|"$/g, "");
    assert(responseEtag === asset.expectedEtag, `v591-mercury-acquisition-etag:${responseEtag}`);
    await pipeline(Readable.fromWeb(response.body), createWriteStream(partialPath, { flags: "wx" }));
    const stats = statSync(partialPath);
    assert(stats.size === asset.expectedBytes, `v591-mercury-acquisition-bytes:${stats.size}`);
    const metadata = await sharp(partialPath, { limitInputPixels: false }).metadata();
    const ratio = (metadata.width ?? 0) / Math.max(1, metadata.height ?? 0);
    assert(metadata.format === "tiff" && (metadata.width ?? 0) >= asset.minimumWidth && (metadata.height ?? 0) >= asset.minimumHeight && ratio >= 1.95 && ratio <= 2.05, `v591-mercury-acquisition-dimensions:${metadata.width ?? 0}x${metadata.height ?? 0}:${metadata.format ?? "unknown"}`);
    const record = {
      id: asset.id,
      body: asset.body,
      role: asset.role,
      sourceUrl: asset.sourceUrl,
      finalUrl: responseMeta.finalUrl,
      redirectChain: responseMeta.redirectChain,
      httpStatus: response.status,
      mediaType: responseMeta.mediaType,
      etag: responseEtag,
      lastModified: response.headers.get("last-modified") ?? null,
      outputPath: asset.outputPath,
      bytes: stats.size,
      sha256: await sha256File(partialPath),
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      bitDepth: metadata.bitsPerSample ?? null,
      sampleFormat: metadata.sampleFormat ?? null,
      license: asset.license,
      observationIdentity: asset.observationIdentity,
      observationLimit: asset.observationLimit,
      presentationOnly: true,
      metadataReceiptSha256: metadataReceipt.receiptSha256,
    };
    renameSync(partialPath, finalPath);
    writeSealed(assetReceiptPath, {
      version: "v591-mercury-visual-asset-acquisition-receipt-v1",
      status: "committed-single-request-no-retry",
      asset: record,
    });
    return record;
  } catch (error) {
    rmSync(partialPath, { force: true });
    throw error;
  }
}

const assets = [];
try {
  if (existsSync(receiptPath)) {
    const existing = readSealed(receiptPath);
    assert(existing.status === "acquired-single-request-no-retry", "v591-mercury-acquisition-existing-receipt-status");
    console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", receiptSha256: existing.receiptSha256 }, null, 2));
  } else {
    const albedoReference = await validateAlbedoReference();
    for (const asset of definitions.assets) assets.push(await acquire(asset));
    const unsigned = {
      version: "v591-mercury-visual-acquisition-receipt-v1",
      acquiredAt: new Date().toISOString(),
      status: "acquired-single-request-no-retry",
      metadataProbe: definitions.metadataProbe,
      metadataReceiptSha256: metadataReceipt.receiptSha256,
      policy: definitions.policy,
      requestedUrlCount: requestedUrls.size,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      urlLedgerReceiptSha256: readSealed(urlLedgerPath).receiptSha256,
      albedoReference,
      assets,
    };
    const receipt = writeSealed(receiptPath, unsigned);
    console.log(JSON.stringify({
      status: receipt.status,
      requestedUrlCount: receipt.requestedUrlCount,
      albedo: { bytes: albedoReference.actualBytes, sha256: albedoReference.actualSha256, width: albedoReference.actualWidth, height: albedoReference.actualHeight },
      assets: assets.map(({ id, bytes, sha256: digest, width, height }) => ({ id, bytes, sha256: digest, width, height })),
      receiptSha256: receipt.receiptSha256,
    }, null, 2));
  }
} catch (error) {
  const previous = existsSync(blockedReceiptPath) ? readSealed(blockedReceiptPath) : null;
  writeSealed(blockedReceiptPath, {
    version: "v591-mercury-visual-acquisition-blocked-v1",
    status: "blocked-no-automatic-retry",
    attempts: [
      ...(previous?.attempts ?? []),
      {
        failedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
        committedAssetIds: assets.map((asset) => asset.id),
        requestedUrls: [...requestedUrls],
      },
    ],
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
  });
  throw error;
}

import { createHash } from "node:crypto";
import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import sharp from "sharp";

const root = process.cwd();
const definitionPath = resolve(root, "scripts/v591-mars-visual-sources.json");
const receiptPath = resolve(root, "docs/release/v591/acquisition-receipt-mars.json");
const blockedReceiptPath = resolve(root, "docs/release/v591/acquisition-blocked-mars.json");
const urlLedgerPath = resolve(root, "docs/release/v591/acquisition-url-ledger-mars.json");
const assetReceiptDirectory = resolve(root, "docs/release/v591/acquisition-assets-mars");
const definitions = JSON.parse(readFileSync(definitionPath, "utf8"));
if (existsSync(receiptPath)) throw new Error("v591-mars-acquisition-receipt-exists-no-repeat");
if (!Array.isArray(definitions.assets) || definitions.assets.length !== 3) throw new Error("v591-mars-acquisition-definition");

const allowedHosts = new Set(definitions.policy.allowedHosts.map((host) => host.toLowerCase()));
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
  assert(receipt.receiptSha256 === canonicalSha(unsigned), `v591-mars-acquisition-seal:${path}`);
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
const urlLedger = existsSync(urlLedgerPath)
  ? readSealed(urlLedgerPath)
  : { version: "v591-mars-acquisition-url-ledger-v1", entries: [], receiptSha256: null };
assert(urlLedger.version === "v591-mars-acquisition-url-ledger-v1" && Array.isArray(urlLedger.entries), "v591-mars-acquisition-ledger-contract");
const requestedUrls = new Set(urlLedger.entries.map((entry) => entry.url));
function appendUrlLedger(entry) {
  const next = writeSealed(urlLedgerPath, {
    version: "v591-mars-acquisition-url-ledger-v1",
    entries: [...urlLedger.entries, entry],
  });
  urlLedger.entries = next.entries;
  urlLedger.receiptSha256 = next.receiptSha256;
}
function assertAllowedUrl(rawUrl) {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:" || !allowedHosts.has(url.hostname.toLowerCase()) || url.username || url.password || url.port) {
    throw new Error(`v591-mars-acquisition-url:${url.hostname}`);
  }
  return url;
}
async function fetchOnceFollowingAllowedRedirects(asset) {
  let current = assertAllowedUrl(asset.sourceUrl);
  const redirectChain = [];
  for (let hop = 0; hop < 4; hop += 1) {
    if (requestedUrls.has(current.href)) throw new Error(`v591-mars-acquisition-repeat-url:${current.href}`);
    requestedUrls.add(current.href);
    let response;
    try {
      response = await fetch(current, {
        method: "GET",
        redirect: "manual",
        headers: { "user-agent": "Orbit-Atlas-v591-mars-acquisition/1.0" },
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
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error(`v591-mars-acquisition-redirect-location:${response.status}`);
      const next = assertAllowedUrl(new URL(location, current).href);
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
      mediaType: (response.headers.get("content-type") ?? "unreported").split(";")[0].trim().toLowerCase(),
    });
    return { response, finalUrl: current.href, redirectChain };
  }
  throw new Error("v591-mars-acquisition-redirect-depth");
}
function validateMolaLabel(text) {
  const normalized = text.replaceAll("\r", "");
  const required = [
    /LINE_SAMPLES\s*=\s*5760/i,
    /LINES\s*=\s*2880/i,
    /SAMPLE_BITS\s*=\s*16/i,
    /SAMPLE_TYPE\s*=\s*MSB_INTEGER/i,
  ];
  if (!required.every((pattern) => pattern.test(normalized))) throw new Error("v591-mars-mola-label-contract");
  return {
    lineSamples: 5760,
    lines: 2880,
    sampleBits: 16,
    sampleType: "MSB_INTEGER",
    missingConstant: /MISSING_CONSTANT\s*=\s*(-?\d+)/i.exec(normalized)?.[1] ?? null,
    scalingFactor: /SCALING_FACTOR\s*=\s*([\d.+-Ee]+)/i.exec(normalized)?.[1] ?? "1",
    offset: /OFFSET\s*=\s*([\d.+-Ee]+)/i.exec(normalized)?.[1] ?? "0",
  };
}
async function validatePart(asset, partPath, responseMeta) {
  const bytes = readFileSync(partPath);
  const common = {
    id: asset.id,
    body: asset.body,
    role: asset.role,
    sourceUrl: asset.sourceUrl,
    finalUrl: responseMeta.finalUrl,
    redirectChain: responseMeta.redirectChain,
    httpStatus: responseMeta.response.status,
    mediaType: responseMeta.mediaType,
    outputPath: asset.outputPath,
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
    license: asset.license,
    observationIdentity: asset.observationIdentity,
    observationLimit: asset.observationLimit,
    presentationOnly: true,
  };
  if (asset.role === "albedo-source") {
    const metadata = await sharp(bytes, { limitInputPixels: false }).metadata();
    const ratio = (metadata.width ?? 0) / Math.max(1, metadata.height ?? 0);
    if ((metadata.width ?? 0) < asset.minimumWidth || (metadata.height ?? 0) < asset.minimumHeight || ratio < 1.95 || ratio > 2.05) {
      throw new Error(`v591-mars-albedo-dimensions:${metadata.width ?? 0}x${metadata.height ?? 0}`);
    }
    return { ...common, width: metadata.width, height: metadata.height, format: metadata.format, bitDepth: metadata.bitsPerSample ?? null };
  }
  if (asset.role === "height-metadata") {
    const labelContract = validateMolaLabel(bytes.toString("ascii"));
    return { ...common, labelContract };
  }
  if (bytes.byteLength !== asset.expectedBytes) throw new Error(`v591-mars-mola-bytes:${bytes.byteLength}`);
  return {
    ...common,
    width: asset.expectedWidth,
    height: asset.expectedHeight,
    format: "pds3-img",
    bitDepth: 16,
    sampleType: "MSB_INTEGER",
  };
}
async function stageAsset(asset) {
  const finalPath = resolve(root, asset.outputPath);
  const allowedRoot = resolve(root, "source-cache/celestial-convergence-v591/mars");
  if (!finalPath.startsWith(`${allowedRoot}\\`) && finalPath !== allowedRoot) throw new Error(`v591-mars-acquisition-output-scope:${asset.id}`);
  const partPath = `${finalPath}.part`;
  const assetReceiptPath = resolve(assetReceiptDirectory, `${asset.id}.json`);
  if (existsSync(finalPath) || existsSync(assetReceiptPath)) {
    if (!existsSync(finalPath) || !existsSync(assetReceiptPath) || existsSync(partPath)) {
      throw new Error(`v591-mars-acquisition-existing-state-mismatch:${asset.id}`);
    }
    const committed = readSealed(assetReceiptPath);
    const bytes = readFileSync(finalPath);
    assert(committed.version === "v591-mars-visual-asset-acquisition-receipt-v1", `v591-mars-acquisition-asset-receipt-version:${asset.id}`);
    assert(committed.asset?.id === asset.id && committed.asset?.sourceUrl === asset.sourceUrl, `v591-mars-acquisition-asset-receipt-identity:${asset.id}`);
    assert(committed.asset.bytes === bytes.byteLength && committed.asset.sha256 === sha256(bytes), `v591-mars-acquisition-existing-sha:${asset.id}`);
    return committed.asset;
  }
  if (existsSync(partPath)) throw new Error(`v591-mars-acquisition-part-exists:${asset.id}`);
  mkdirSync(dirname(finalPath), { recursive: true });
  try {
    const responseMeta = await fetchOnceFollowingAllowedRedirects(asset);
    const { response } = responseMeta;
    if (!response.ok || !response.body) throw new Error(`v591-mars-acquisition-http:${asset.id}:${response.status}`);
    const mediaType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (mediaType && !asset.expectedMediaTypes.includes(mediaType)) throw new Error(`v591-mars-acquisition-media-type:${asset.id}:${mediaType}`);
    await pipeline(Readable.fromWeb(response.body), createWriteStream(partPath, { flags: "wx" }));
    const record = await validatePart(asset, partPath, { ...responseMeta, mediaType: mediaType || "unreported" });
    renameSync(partPath, finalPath);
    writeSealed(assetReceiptPath, {
      version: "v591-mars-visual-asset-acquisition-receipt-v1",
      status: "committed-single-request-no-retry",
      asset: record,
    });
    return record;
  } catch (error) {
    rmSync(partPath, { force: true });
    throw error;
  }
}

const assets = [];
try {
  for (const asset of definitions.assets) assets.push(await stageAsset(asset));
  const label = assets.find((asset) => asset.role === "height-metadata");
  const height = assets.find((asset) => asset.role === "height-source");
  if (!label || !height || label.labelContract.lineSamples !== height.width || label.labelContract.lines !== height.height) {
    throw new Error("v591-mars-mola-label-image-identity");
  }
  const unsigned = {
    version: "v591-mars-visual-acquisition-receipt-v1",
    acquiredAt: new Date().toISOString(),
    status: "acquired-single-request-no-retry",
    metadataProbe: definitions.metadataProbe,
    policy: definitions.policy,
    requestedUrlCount: requestedUrls.size,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    urlLedgerReceiptSha256: readSealed(urlLedgerPath).receiptSha256,
    assetReceiptSha256: Object.fromEntries(definitions.assets.map((asset) => {
      const assetReceipt = readSealed(resolve(assetReceiptDirectory, `${asset.id}.json`));
      return [asset.id, assetReceipt.receiptSha256];
    })),
    assets,
  };
  const receipt = writeSealed(receiptPath, unsigned);
  console.log(JSON.stringify({
    status: receipt.status,
    requestedUrlCount: receipt.requestedUrlCount,
    assets: assets.map(({ id, bytes, sha256: digest, width, height: rows, labelContract }) => ({ id, bytes, sha256: digest, width: width ?? null, height: rows ?? null, labelContract: labelContract ?? null })),
    receiptSha256: receipt.receiptSha256,
  }, null, 2));
} catch (error) {
  const previous = existsSync(blockedReceiptPath) ? readSealed(blockedReceiptPath) : null;
  writeSealed(blockedReceiptPath, {
    version: "v591-mars-visual-acquisition-blocked-v1",
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

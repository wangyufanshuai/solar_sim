import { createHash } from "node:crypto";
import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import sharp from "sharp";

const root = process.cwd();
const definitionPath = resolve(root, "scripts/v591-moon-visual-sources.json");
const receiptPath = resolve(root, "docs/release/v591/acquisition-receipt-moon.json");
const definitions = JSON.parse(readFileSync(definitionPath, "utf8"));
if (existsSync(receiptPath)) throw new Error("v591-moon-acquisition-receipt-exists-no-repeat");
if (!Array.isArray(definitions.assets) || definitions.assets.length !== 2) throw new Error("v591-moon-acquisition-definition");

const allowedHosts = new Set(definitions.policy.allowedHosts.map((host) => host.toLowerCase()));
const requestedUrls = new Set();
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assertAllowedUrl(rawUrl) {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:" || !allowedHosts.has(url.hostname.toLowerCase()) || url.username || url.password || url.port) {
    throw new Error(`v591-moon-acquisition-url:${url.hostname}`);
  }
  return url;
}
async function fetchOnceFollowingAllowedRedirects(sourceUrl) {
  let current = assertAllowedUrl(sourceUrl);
  const redirectChain = [];
  for (let hop = 0; hop < 4; hop += 1) {
    if (requestedUrls.has(current.href)) throw new Error(`v591-moon-acquisition-repeat-url:${current.href}`);
    requestedUrls.add(current.href);
    const response = await fetch(current, {
      method: "GET",
      redirect: "manual",
      headers: { "user-agent": "Orbit-Atlas-v591-moon-acquisition/1.0" },
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error(`v591-moon-acquisition-redirect-location:${response.status}`);
      const next = assertAllowedUrl(new URL(location, current).href);
      redirectChain.push({ status: response.status, from: current.href, to: next.href });
      current = next;
      continue;
    }
    return { response, finalUrl: current.href, redirectChain };
  }
  throw new Error("v591-moon-acquisition-redirect-depth");
}
async function acquire(asset) {
  const finalPath = resolve(root, asset.outputPath);
  const partialPath = `${finalPath}.part`;
  const allowedRoot = resolve(root, "source-cache/celestial-convergence-v591/moon");
  if (!finalPath.startsWith(`${allowedRoot}\\`) && finalPath !== allowedRoot) throw new Error(`v591-moon-acquisition-output-scope:${asset.id}`);
  if (existsSync(finalPath) || existsSync(partialPath)) throw new Error(`v591-moon-acquisition-output-exists:${asset.id}`);
  mkdirSync(dirname(finalPath), { recursive: true });
  const { response, finalUrl, redirectChain } = await fetchOnceFollowingAllowedRedirects(asset.sourceUrl);
  if (!response.ok || !response.body) throw new Error(`v591-moon-acquisition-http:${asset.id}:${response.status}`);
  const mediaType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (!asset.expectedMediaTypes.includes(mediaType)) throw new Error(`v591-moon-acquisition-media-type:${asset.id}:${mediaType}`);
  try {
    await pipeline(Readable.fromWeb(response.body), createWriteStream(partialPath, { flags: "wx" }));
    const bytes = readFileSync(partialPath);
    const metadata = await sharp(bytes, { limitInputPixels: false }).metadata();
    if (metadata.width !== asset.expectedWidth || metadata.height !== asset.expectedHeight || metadata.format !== "tiff") {
      throw new Error(`v591-moon-acquisition-dimensions:${asset.id}:${metadata.width ?? 0}x${metadata.height ?? 0}:${metadata.format ?? "unknown"}`);
    }
    renameSync(partialPath, finalPath);
    return {
      id: asset.id,
      body: asset.body,
      role: asset.role,
      sourceUrl: asset.sourceUrl,
      finalUrl,
      redirectChain,
      httpStatus: response.status,
      mediaType,
      outputPath: asset.outputPath,
      bytes: bytes.byteLength,
      sha256: sha256(bytes),
      width: metadata.width,
      height: metadata.height,
      bitDepth: metadata.bitsPerSample ?? null,
      license: asset.license,
      observationIdentity: asset.observationIdentity,
      observationLimit: asset.observationLimit,
      presentationOnly: true,
    };
  } catch (error) {
    rmSync(partialPath, { force: true });
    throw error;
  }
}

const assets = [];
for (const asset of definitions.assets) assets.push(await acquire(asset));
const unsigned = {
  version: "v591-moon-visual-acquisition-receipt-v1",
  acquiredAt: new Date().toISOString(),
  status: "acquired-single-request-no-retry",
  metadataProbe: definitions.metadataProbe,
  policy: definitions.policy,
  requestedUrlCount: requestedUrls.size,
  automaticRetryPerformed: false,
  automaticReplacementPerformed: false,
  assets,
};
const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
mkdirSync(dirname(receiptPath), { recursive: true });
const partialReceipt = `${receiptPath}.part`;
writeFileSync(partialReceipt, `${JSON.stringify(receipt, null, 2)}\n`, { flag: "wx" });
renameSync(partialReceipt, receiptPath);
console.log(JSON.stringify({
  status: receipt.status,
  requestedUrlCount: receipt.requestedUrlCount,
  assets: assets.map(({ id, bytes, sha256: digest, width, height }) => ({ id, bytes, sha256: digest, width, height })),
  receiptSha256: receipt.receiptSha256,
}, null, 2));

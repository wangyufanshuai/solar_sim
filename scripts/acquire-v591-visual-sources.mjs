import { createHash } from "node:crypto";
import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import sharp from "sharp";

const root = process.cwd();
const definitionPath = resolve(root, "scripts/v591-visual-sources.json");
const receiptPath = resolve(root, "docs/release/v591/acquisition-receipt-sun.json");
const definitions = JSON.parse(readFileSync(definitionPath, "utf8"));
const requested = new Set(process.argv.slice(2).filter((value) => value.startsWith("--asset=")).map((value) => value.slice(8)));
const assets = requested.size > 0
  ? definitions.assets.filter((asset) => requested.has(asset.id))
  : definitions.assets;

if (assets.length === 0 || assets.length !== (requested.size || definitions.assets.length)) {
  throw new Error("v591-acquisition-asset-selection");
}
if (existsSync(receiptPath)) throw new Error("v591-acquisition-receipt-exists-no-repeat");

const allowedHosts = new Set(definitions.policy.allowedHosts.map((host) => host.toLowerCase()));
const requestedUrls = new Set();
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
};
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));

function assertAllowedUrl(rawUrl) {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:" || !allowedHosts.has(url.hostname.toLowerCase())) {
    throw new Error(`v591-acquisition-host:${url.hostname}`);
  }
  if (url.username || url.password || url.port) throw new Error("v591-acquisition-url-authority");
  return url;
}

async function fetchOnceFollowingAllowedRedirects(sourceUrl) {
  let current = assertAllowedUrl(sourceUrl);
  const redirectChain = [];
  for (let hop = 0; hop < 4; hop += 1) {
    const key = current.href;
    if (requestedUrls.has(key)) throw new Error(`v591-acquisition-repeat-url:${key}`);
    requestedUrls.add(key);
    const response = await fetch(current, {
      method: "GET",
      redirect: "manual",
      headers: { "user-agent": "Orbit-Atlas-v591-visual-acquisition/1.0" },
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error(`v591-acquisition-redirect-location:${response.status}`);
      const next = assertAllowedUrl(new URL(location, current).href);
      redirectChain.push({ status: response.status, from: current.href, to: next.href });
      current = next;
      continue;
    }
    return { response, finalUrl: current.href, redirectChain };
  }
  throw new Error("v591-acquisition-redirect-depth");
}

async function acquire(asset) {
  const finalPath = resolve(root, asset.outputPath);
  const partialPath = `${finalPath}.part`;
  if (!finalPath.startsWith(resolve(root, "source-cache/celestial-convergence-v591"))) {
    throw new Error(`v591-acquisition-output-scope:${asset.id}`);
  }
  if (existsSync(finalPath) || existsSync(partialPath)) throw new Error(`v591-acquisition-output-exists:${asset.id}`);
  mkdirSync(dirname(finalPath), { recursive: true });
  const { response, finalUrl, redirectChain } = await fetchOnceFollowingAllowedRedirects(asset.sourceUrl);
  if (!response.ok || !response.body) throw new Error(`v591-acquisition-http:${asset.id}:${response.status}`);
  const mediaType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (mediaType !== asset.expectedMediaType) throw new Error(`v591-acquisition-media-type:${asset.id}:${mediaType}`);
  try {
    await pipeline(Readable.fromWeb(response.body), createWriteStream(partialPath, { flags: "wx" }));
    const bytes = readFileSync(partialPath);
    if (bytes.byteLength < 1024 * 1024) throw new Error(`v591-acquisition-bytes:${asset.id}:${bytes.byteLength}`);
    const metadata = await sharp(bytes, { limitInputPixels: false }).metadata();
    if (!metadata.width || !metadata.height || metadata.width < 4096 || metadata.height < 4096) {
      throw new Error(`v591-acquisition-dimensions:${asset.id}:${metadata.width ?? 0}x${metadata.height ?? 0}`);
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
      license: asset.license,
      observationIdentity: asset.observationIdentity,
      presentationOnly: true,
    };
  } catch (error) {
    rmSync(partialPath, { force: true });
    throw error;
  }
}

const acquired = [];
for (const asset of assets) acquired.push(await acquire(asset));
const acquiredAt = new Date().toISOString();
const unsigned = {
  version: "v591-visual-acquisition-receipt-v1",
  acquiredAt,
  status: "acquired-single-request-no-retry",
  policy: definitions.policy,
  requestedUrlCount: requestedUrls.size,
  automaticRetryPerformed: false,
  automaticReplacementPerformed: false,
  assets: acquired,
};
const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
mkdirSync(dirname(receiptPath), { recursive: true });
const receiptPartial = `${receiptPath}.part`;
writeFileSync(receiptPartial, `${JSON.stringify(receipt, null, 2)}\n`, { flag: "wx" });
renameSync(receiptPartial, receiptPath);

console.log(JSON.stringify({
  status: receipt.status,
  assets: acquired.map(({ id, bytes, sha256: digest, width, height }) => ({ id, bytes, sha256: digest, width, height })),
  requestedUrlCount: requestedUrls.size,
  receiptSha256: receipt.receiptSha256,
}, null, 2));

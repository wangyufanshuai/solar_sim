import { createHash } from "node:crypto";
import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import sharp from "sharp";

const root = process.cwd();
const definition = JSON.parse(readFileSync(resolve(root, "scripts/v591-mars-usgs-full-source.json"), "utf8"));
const asset = definition.asset;
const receiptPath = resolve(root, "docs/release/v591/acquisition-receipt-mars-usgs-full.json");
const blockedPath = resolve(root, "docs/release/v591/acquisition-blocked-mars-usgs-full.json");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function writeSealed(path, unsigned) {
  const sealed = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  writeFileSync(partial, `${JSON.stringify(sealed, null, 2)}\n`, { flag: "wx" });
  renameSync(partial, path);
  return sealed;
}
if (existsSync(receiptPath) || existsSync(blockedPath)) throw new Error("v591-mars-usgs-full-terminal-receipt-exists");
const url = new URL(asset.sourceUrl);
if (url.protocol !== "https:" || !asset.allowedHosts.includes(url.hostname) || url.pathname !== "/mosaic/Mars_Viking_ClrMosaic_global_925m.tif") {
  throw new Error("v591-mars-usgs-full-url-contract");
}
const finalPath = resolve(root, asset.outputPath);
const allowedRoot = resolve(root, "source-cache/celestial-convergence-v591/mars");
if (!finalPath.startsWith(`${allowedRoot}\\`)) throw new Error("v591-mars-usgs-full-output-scope");
const partPath = `${finalPath}.part`;
if (existsSync(finalPath) || existsSync(partPath)) throw new Error("v591-mars-usgs-full-output-exists");
mkdirSync(dirname(finalPath), { recursive: true });
try {
  const response = await fetch(url, {
    method: "GET",
    redirect: "manual",
    headers: { "user-agent": "Orbit-Atlas-v591-mars-usgs-full-acquisition/1.0" },
  });
  if ([301, 302, 303, 307, 308].includes(response.status)) throw new Error("v591-mars-usgs-full-unexpected-redirect");
  if (!response.ok || !response.body) throw new Error(`v591-mars-usgs-full-http:${response.status}`);
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength !== asset.expectedBytes) throw new Error(`v591-mars-usgs-full-content-length:${contentLength}`);
  const mediaType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (mediaType && !asset.expectedMediaTypes.includes(mediaType)) throw new Error(`v591-mars-usgs-full-media-type:${mediaType}`);
  await pipeline(Readable.fromWeb(response.body), createWriteStream(partPath, { flags: "wx" }));
  const bytes = readFileSync(partPath);
  if (bytes.byteLength !== asset.expectedBytes) throw new Error(`v591-mars-usgs-full-bytes:${bytes.byteLength}`);
  const metadata = await sharp(bytes, { limitInputPixels: false }).metadata();
  if (metadata.width !== asset.expectedWidth || metadata.height !== asset.expectedHeight) {
    throw new Error(`v591-mars-usgs-full-dimensions:${metadata.width ?? 0}x${metadata.height ?? 0}`);
  }
  renameSync(partPath, finalPath);
  const receipt = writeSealed(receiptPath, {
    version: "v591-mars-usgs-full-acquisition-receipt-v1",
    acquiredAt: new Date().toISOString(),
    status: "acquired-single-request-no-retry",
    policy: definition.policy,
    sourcePage: definition.sourcePage,
    redirectProvenance: definition.redirectProvenance,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    asset: {
      ...asset,
      finalUrl: url.href,
      httpStatus: response.status,
      mediaType: mediaType || "unreported",
      bytes: bytes.byteLength,
      sha256: sha256(bytes),
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      bitDepth: metadata.bitsPerSample ?? null,
    },
  });
  console.log(JSON.stringify({ status: receipt.status, bytes: receipt.asset.bytes, width: receipt.asset.width, height: receipt.asset.height, sha256: receipt.asset.sha256, receiptSha256: receipt.receiptSha256 }, null, 2));
} catch (error) {
  rmSync(partPath, { force: true });
  const blocked = writeSealed(blockedPath, {
    version: "v591-mars-usgs-full-acquisition-blocked-v1",
    status: "blocked-no-automatic-retry",
    failedAt: new Date().toISOString(),
    sourceUrl: asset.sourceUrl,
    redirectProvenance: definition.redirectProvenance,
    payloadWritten: false,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    error: error instanceof Error ? error.message : String(error),
  });
  console.error(JSON.stringify({ status: blocked.status, error: blocked.error, receiptSha256: blocked.receiptSha256 }, null, 2));
  throw error;
}

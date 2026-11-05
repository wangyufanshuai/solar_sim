import { createHash } from "node:crypto";
import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import sharp from "sharp";

const root = process.cwd();
const definition = JSON.parse(readFileSync(resolve(root, "scripts/v591-jupiter-visual-sources.json"), "utf8"));
const asset = definition.asset;
const receiptPath = resolve(root, "docs/release/v591/acquisition-receipt-jupiter.json");
const blockedPath = resolve(root, "docs/release/v591/acquisition-blocked-jupiter.json");
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
if (existsSync(receiptPath) || existsSync(blockedPath)) throw new Error("v591-jupiter-acquisition-terminal-receipt-exists");
const url = new URL(asset.sourceUrl);
if (url.protocol !== "https:" || !asset.allowedHosts.includes(url.hostname) || url.username || url.password || url.port) throw new Error("v591-jupiter-source-url");
const finalPath = resolve(root, asset.outputPath);
const allowedRoot = resolve(root, "source-cache/celestial-convergence-v591/jupiter");
if (!finalPath.startsWith(`${allowedRoot}\\`)) throw new Error("v591-jupiter-output-scope");
const partPath = `${finalPath}.part`;
if (existsSync(finalPath) || existsSync(partPath)) throw new Error("v591-jupiter-output-exists");
mkdirSync(dirname(finalPath), { recursive: true });
try {
  const response = await fetch(url, { method: "GET", redirect: "manual", headers: { "user-agent": "Orbit-Atlas-v591-jupiter-acquisition/1.0" } });
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    const location = response.headers.get("location");
    throw new Error(`v591-jupiter-redirect-blocked:${location ? new URL(location, url).hostname : "missing"}`);
  }
  if (!response.ok || !response.body) throw new Error(`v591-jupiter-http:${response.status}`);
  const mediaType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (mediaType && !asset.expectedMediaTypes.includes(mediaType)) throw new Error(`v591-jupiter-media-type:${mediaType}`);
  await pipeline(Readable.fromWeb(response.body), createWriteStream(partPath, { flags: "wx" }));
  const bytes = readFileSync(partPath);
  const metadata = await sharp(bytes, { limitInputPixels: false }).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  const ratio = width / Math.max(1, height);
  if (width < asset.minimumWidth || height < asset.minimumHeight || ratio < 1.95 || ratio > 2.05) throw new Error(`v591-jupiter-dimensions:${width}x${height}`);
  renameSync(partPath, finalPath);
  const receipt = writeSealed(receiptPath, {
    version: "v591-jupiter-visual-acquisition-receipt-v1",
    acquiredAt: new Date().toISOString(),
    status: "acquired-single-request-no-retry",
    metadataProbe: definition.metadataProbe,
    policy: definition.policy,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    asset: {
      ...asset,
      finalUrl: url.href,
      httpStatus: response.status,
      mediaType: mediaType || "unreported",
      bytes: bytes.byteLength,
      sha256: sha256(bytes),
      width,
      height,
      format: metadata.format,
      bitDepth: metadata.bitsPerSample ?? null,
    },
  });
  console.log(JSON.stringify({ status: receipt.status, asset: { bytes: receipt.asset.bytes, sha256: receipt.asset.sha256, width, height }, receiptSha256: receipt.receiptSha256 }, null, 2));
} catch (error) {
  rmSync(partPath, { force: true });
  const blocked = writeSealed(blockedPath, {
    version: "v591-jupiter-visual-acquisition-blocked-v1",
    status: "blocked-no-automatic-retry",
    failedAt: new Date().toISOString(),
    sourceUrl: asset.sourceUrl,
    payloadWritten: false,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    error: error instanceof Error ? error.message : String(error),
  });
  console.error(JSON.stringify({ status: blocked.status, error: blocked.error, receiptSha256: blocked.receiptSha256 }, null, 2));
  throw error;
}

import { createHash } from "node:crypto";
import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import sharp from "sharp";

const root = process.cwd();
const definitionPath = resolve(root, "scripts/v591-mars-nasa3d-source.json");
const receiptPath = resolve(root, "docs/release/v591/acquisition-receipt-mars-nasa3d.json");
const blockedPath = resolve(root, "docs/release/v591/acquisition-blocked-mars-nasa3d.json");
const definition = JSON.parse(readFileSync(definitionPath, "utf8"));
const asset = definition.asset;
if (existsSync(receiptPath) || existsSync(blockedPath)) throw new Error("v591-mars-nasa3d-acquisition-terminal-receipt-exists");
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
  const part = `${path}.part`;
  writeFileSync(part, `${JSON.stringify(sealed, null, 2)}\n`, { flag: "wx" });
  renameSync(part, path);
  return sealed;
}
const sourceUrl = new URL(asset.sourceUrl);
if (sourceUrl.protocol !== "https:" || !asset.allowedHosts.includes(sourceUrl.hostname) || sourceUrl.username || sourceUrl.password || sourceUrl.port) {
  throw new Error(`v591-mars-nasa3d-source-url:${sourceUrl.hostname}`);
}
const finalPath = resolve(root, asset.outputPath);
const allowedRoot = resolve(root, "source-cache/celestial-convergence-v591/mars");
if (!finalPath.startsWith(`${allowedRoot}\\`)) throw new Error("v591-mars-nasa3d-output-scope");
const partPath = `${finalPath}.part`;
if (existsSync(finalPath) || existsSync(partPath)) throw new Error("v591-mars-nasa3d-output-exists");
mkdirSync(dirname(finalPath), { recursive: true });
let requestStarted = false;
try {
  requestStarted = true;
  const response = await fetch(sourceUrl, {
    method: "GET",
    redirect: "manual",
    headers: { "user-agent": "Orbit-Atlas-v591-mars-nasa3d-acquisition/1.0" },
  });
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    const location = response.headers.get("location");
    throw new Error(`v591-mars-nasa3d-redirect-blocked:${location ? new URL(location, sourceUrl).hostname : "missing"}`);
  }
  if (!response.ok || !response.body) throw new Error(`v591-mars-nasa3d-http:${response.status}`);
  const mediaType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (mediaType && !asset.expectedMediaTypes.includes(mediaType)) throw new Error(`v591-mars-nasa3d-media-type:${mediaType}`);
  await pipeline(Readable.fromWeb(response.body), createWriteStream(partPath, { flags: "wx" }));
  const bytes = readFileSync(partPath);
  const metadata = await sharp(bytes, { limitInputPixels: false }).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  const ratio = width / Math.max(1, height);
  if (width < asset.minimumWidth || height < asset.minimumHeight || ratio < 1.95 || ratio > 2.05) {
    throw new Error(`v591-mars-nasa3d-dimensions:${width}x${height}`);
  }
  renameSync(partPath, finalPath);
  const unsigned = {
    version: "v591-mars-nasa3d-acquisition-receipt-v1",
    acquiredAt: new Date().toISOString(),
    status: "acquired-single-request-no-retry",
    policy: definition.policy,
    sourcePage: definition.sourcePage,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    asset: {
      ...asset,
      finalUrl: sourceUrl.href,
      httpStatus: response.status,
      mediaType: mediaType || "unreported",
      bytes: bytes.byteLength,
      sha256: sha256(bytes),
      width,
      height,
      format: metadata.format,
      bitDepth: metadata.bitsPerSample ?? null
    }
  };
  const receipt = writeSealed(receiptPath, unsigned);
  console.log(JSON.stringify({ status: receipt.status, asset: receipt.asset, receiptSha256: receipt.receiptSha256 }, null, 2));
} catch (error) {
  rmSync(partPath, { force: true });
  const receipt = writeSealed(blockedPath, {
    version: "v591-mars-nasa3d-acquisition-blocked-v1",
    status: "blocked-no-automatic-retry",
    failedAt: new Date().toISOString(),
    sourceUrl: asset.sourceUrl,
    requestStarted,
    payloadWritten: false,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    error: error instanceof Error ? error.message : String(error)
  });
  console.error(JSON.stringify({ status: receipt.status, error: receipt.error, receiptSha256: receipt.receiptSha256 }, null, 2));
  throw error;
}

import { createHash } from "node:crypto";
import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import sharp from "sharp";

const root = process.cwd();
const definition = JSON.parse(readFileSync(resolve(root, "scripts/v591-saturn-visual-sources.json"), "utf8"));
const receiptPath = resolve(root, "docs/release/v591/acquisition-receipt-saturn.json");
const blockedPath = resolve(root, "docs/release/v591/acquisition-blocked-saturn.json");
const allowedRoot = resolve(root, "source-cache/celestial-convergence-v591/saturn");
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
  const partial = `${path}.${process.pid}.part`;
  writeFileSync(partial, `${JSON.stringify(sealed, null, 2)}\n`, { flag: "wx" });
  renameSync(partial, path);
  return sealed;
}

if (existsSync(receiptPath) || existsSync(blockedPath)) throw new Error("v591-saturn-acquisition-terminal-receipt-exists");
if (!Array.isArray(definition.assets) || definition.assets.length !== 2) throw new Error("v591-saturn-source-definition-assets");

const acquired = [];
let activeAsset = null;
let activePartPath = null;

try {
  for (const asset of definition.assets) {
    activeAsset = asset;
    const url = new URL(asset.sourceUrl);
    if (url.protocol !== "https:" || !asset.allowedHosts.includes(url.hostname) || url.username || url.password || url.port) {
      throw new Error(`v591-saturn-source-url:${asset.id}`);
    }
    const finalPath = resolve(root, asset.outputPath);
    if (finalPath !== allowedRoot && !finalPath.startsWith(`${allowedRoot}\\`)) throw new Error(`v591-saturn-output-scope:${asset.id}`);
    const partPath = `${finalPath}.part`;
    activePartPath = partPath;
    if (existsSync(finalPath) || existsSync(partPath)) throw new Error(`v591-saturn-output-exists:${asset.id}`);
    mkdirSync(dirname(finalPath), { recursive: true });

    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: { "user-agent": "Orbit-Atlas-v591-saturn-acquisition/1.0" },
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      const redirectHost = location ? new URL(location, url).hostname : "missing";
      throw new Error(`v591-saturn-redirect-blocked:${asset.id}:${redirectHost}`);
    }
    if (!response.ok || !response.body) throw new Error(`v591-saturn-http:${asset.id}:${response.status}`);
    const mediaType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (mediaType && !asset.expectedMediaTypes.includes(mediaType)) throw new Error(`v591-saturn-media-type:${asset.id}:${mediaType}`);
    await pipeline(Readable.fromWeb(response.body), createWriteStream(partPath, { flags: "wx" }));
    const bytes = readFileSync(partPath);
    const metadata = await sharp(bytes, { limitInputPixels: false }).metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;
    if (width < asset.minimumWidth || height < asset.minimumHeight) {
      throw new Error(`v591-saturn-dimensions:${asset.id}:${width}x${height}`);
    }
    renameSync(partPath, finalPath);
    activePartPath = null;
    acquired.push({
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
    });
  }

  const receipt = writeSealed(receiptPath, {
    version: "v591-saturn-visual-acquisition-receipt-v1",
    acquiredAt: new Date().toISOString(),
    status: "acquired-two-urls-single-request-each-no-retry",
    metadataProbe: definition.metadataProbe,
    policy: definition.policy,
    requestedUrlCount: definition.assets.length,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    assets: acquired,
  });
  console.log(JSON.stringify({
    status: receipt.status,
    assets: receipt.assets.map(({ id, bytes, sha256: digest, width, height }) => ({ id, bytes, sha256: digest, width, height })),
    receiptSha256: receipt.receiptSha256,
  }, null, 2));
} catch (error) {
  if (activePartPath) rmSync(activePartPath, { force: true });
  const blocked = writeSealed(blockedPath, {
    version: "v591-saturn-visual-acquisition-blocked-v1",
    status: "blocked-no-automatic-retry",
    failedAt: new Date().toISOString(),
    failedAssetId: activeAsset?.id ?? "preflight",
    acquiredBeforeFailure: acquired.map(({ id, outputPath, bytes, sha256: digest }) => ({ id, outputPath, bytes, sha256: digest })),
    payloadWritten: acquired.length > 0,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    error: error instanceof Error ? error.message : String(error),
  });
  console.error(JSON.stringify({ status: blocked.status, error: blocked.error, receiptSha256: blocked.receiptSha256 }, null, 2));
  throw error;
}

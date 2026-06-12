import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const deepSkyDir = path.join(root, "public", "textures", "deep-sky");
const sourceManifestPath = path.join(deepSkyDir, "pack-v2-manifest.json");
const outDir = path.join(deepSkyDir, "pack-v3");
const outManifestPath = path.join(deepSkyDir, "pack-v3-manifest.json");
const MAX_COMMITTED_BYTES = 1024 * 1024 * 1024;

async function checksum(file) {
  const buf = await readFile(file);
  return createHash("sha256").update(buf).digest("hex");
}

function localPublicPath(publicUrl) {
  return path.join(root, "public", publicUrl.replace(/^\//, ""));
}

async function copyPublicAsset(publicUrl) {
  const src = localPublicPath(publicUrl);
  const file = path.basename(publicUrl);
  const dest = path.join(outDir, file);
  await copyFile(src, dest);
  return `/textures/deep-sky/pack-v3/${file}`;
}

const source = JSON.parse((await readFile(sourceManifestPath, "utf8")).replace(/^\uFEFF/, ""));
await mkdir(outDir, { recursive: true });

const deepSky = [];
for (const item of source.deepSky ?? []) {
  const previewUrl = await copyPublicAsset(item.previewUrl);
  const qualityUrl = await copyPublicAsset(item.qualityUrl);
  const previewPath = localPublicPath(previewUrl);
  const qualityPath = localPublicPath(qualityUrl);
  const previewBytes = (await stat(previewPath)).size;
  const qualityBytes = (await stat(qualityPath)).size;
  deepSky.push({
    ...item,
    previewUrl,
    qualityUrl,
    credit: item.credit ?? "NASA Image and Video Library",
    sourceCredit: item.credit ?? "NASA/JWST/Hubble public observation asset",
    bytes: {
      preview: previewBytes,
      quality: qualityBytes,
    },
    checksum: {
      preview: await checksum(previewPath),
      quality: await checksum(qualityPath),
    },
    visual: {
      ...item.visual,
      opacity: Number((item.visual.opacity * 0.92).toFixed(3)),
      dustPreserve: item.renderTier === "core" ? 0.74 : 0.66,
      saturation: item.renderTier === "highQuality" ? 0.94 : 0.88,
      shellOpacity: item.renderTier === "core" ? 0.72 : 0.62,
    },
    renderProfile: "deep-universe-v4-observational",
    packVersion: "pack-v3",
  });
}

const totalBytes = deepSky.reduce((sum, item) => sum + item.bytes.preview + item.bytes.quality, 0);
if (totalBytes > MAX_COMMITTED_BYTES) {
  throw new Error(`pack-v3 exceeds 1GB resource budget: ${totalBytes} bytes`);
}

await writeFile(outManifestPath, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  packVersion: "pack-v3",
  source: "NASA Image and Video Library / JWST / Hubble public observation assets",
  license: "NASA media usage guidelines; committed compressed derivatives for Solar Sim WebGL preview/quality tiers",
  performancePolicy: "preview default, quality lazy only under Showcase / Atlas immersive / Deep Universe preset; no runtime external API",
  totalBytes,
  maxCommittedBytes: MAX_COMMITTED_BYTES,
  deepSky,
}, null, 2)}\n`, "utf8");

console.log(`Wrote ${path.relative(root, outManifestPath)} (${deepSky.length} items, ${totalBytes} bytes)`);

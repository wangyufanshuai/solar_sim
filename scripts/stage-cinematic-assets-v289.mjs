#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createReadStream, existsSync, statfsSync } from "node:fs";
import { copyFile, link, mkdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(".");
const OUTPUT_ROOT = resolve("dist/science-cinematic-v4-v289-assets");
const MINIMUM_FREE_DISK = 30 * 1024 ** 3;
const INSTALLED_LIMIT = 64 * 1024 ** 2;
const NASA_TERMS = "https://www.nasa.gov/nasa-brand-center/images-and-media/";
const entries = [
  {
    id: "nasa-svs-milky-way-mobile-2k",
    sourceUrl: "https://svs.gsfc.nasa.gov/4851/",
    originalPath: ".cache/sky-sources/milkyway_2020_16k.exr",
    outputPath: "public/textures/sky/orbit-atlas-v68-reference-backdrop-base-2k.jpg",
    processing: { projection: "equirectangular", width: 2048, height: 1024, recipe: "v68-reference-backdrop-existing-derived" },
  },
  {
    id: "nasa-svs-bright-stars-mobile-2k",
    sourceUrl: "https://svs.gsfc.nasa.gov/4851/",
    originalPath: ".cache/sky-sources/hiptyc_2020_16k.exr",
    outputPath: "public/textures/sky/orbit-atlas-v68-reference-primary-stars-2k.jpg",
    processing: { projection: "equirectangular", width: 2048, height: 1024, recipe: "v68-primary-stars-existing-derived" },
  },
];

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
}
const canonicalSha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
async function sha256File(path) {
  const digest = createHash("sha256");
  for await (const chunk of createReadStream(path, { highWaterMark: 1024 * 1024 })) digest.update(chunk);
  return digest.digest("hex");
}
async function hardlinkOrCopy(source, destination) {
  await mkdir(dirname(destination), { recursive: true });
  try { await link(source, destination); }
  catch (error) { if (error?.code !== "EXDEV") throw error; await copyFile(source, destination); }
}

const disk = statfsSync("E:\\");
const freeDiskBytes = Number(disk.bavail) * Number(disk.bsize);
if (freeDiskBytes < MINIMUM_FREE_DISK) throw new Error("v289 asset staging requires at least 30 GiB free on E:");
const resolvedEntries = [];
for (const entry of entries) {
  const original = resolve(ROOT, entry.originalPath);
  const output = resolve(ROOT, entry.outputPath);
  if (!existsSync(original) || !existsSync(output)) throw new Error(`missing existing NASA SVS source/derivative: ${entry.id}`);
  const [originalInfo, outputInfo, originalSha256, outputSha256] = await Promise.all([stat(original), stat(output), sha256File(original), sha256File(output)]);
  resolvedEntries.push({
    ...entry,
    originalPath: entry.originalPath.replaceAll("\\", "/"),
    outputPath: entry.outputPath.replace(/^public[\\/]/, "").replaceAll("\\", "/"),
    originalBytes: originalInfo.size,
    outputBytes: outputInfo.size,
    originalSha256,
    outputSha256,
    license: { id: "NASA-public-domain", status: "approved-runtime", termsUrl: NASA_TERMS, attributionRequired: false },
    networkDownloadApplied: false,
  });
}
const installedBytes = resolvedEntries.reduce((sum, entry) => sum + entry.outputBytes, 0);
if (installedBytes > INSTALLED_LIMIT) throw new Error(`v289 2K staging exceeds ${INSTALLED_LIMIT} bytes`);
const canonical = {
  version: "science-cinematic-v4-v289-assets-v1",
  id: "science-cinematic-v4-v289-assets",
  installedBytes,
  installedLimitBytes: INSTALLED_LIMIT,
  minimumFreeDiskBytes: MINIMUM_FREE_DISK,
  runtimePolicy: "local-shadow-v4-intent-only",
  entries: resolvedEntries,
  sourcePolicy: "existing-cache-only-no-new-visual-network-download",
};
const canonicalSha256 = canonicalSha(canonical);
const manifest = { ...canonical, generatedAt: new Date().toISOString(), canonicalSha256 };
const contentRoot = join(OUTPUT_ROOT, canonicalSha256);
const staging = `${contentRoot}.part`;
if (!existsSync(contentRoot)) {
  await rm(staging, { recursive: true, force: true });
  await mkdir(staging, { recursive: true });
  for (const entry of resolvedEntries) await hardlinkOrCopy(resolve(ROOT, "public", entry.outputPath), join(staging, "files", entry.outputPath));
  await writeFile(join(staging, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await rename(staging, contentRoot);
}
await mkdir(OUTPUT_ROOT, { recursive: true });
const pointerTemporary = join(OUTPUT_ROOT, "manifest.json.tmp");
await writeFile(pointerTemporary, `${JSON.stringify({ ...manifest, contentRoot: canonicalSha256 }, null, 2)}\n`);
await rename(pointerTemporary, join(OUTPUT_ROOT, "manifest.json"));
console.log(JSON.stringify({ id: manifest.id, entries: manifest.entries.length, installedBytes, canonicalSha256, networkDownloadApplied: false }, null, 2));

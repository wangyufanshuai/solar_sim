#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createReadStream, existsSync, statfsSync } from "node:fs";
import { copyFile, link, mkdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const VERSION = "science-cinematic-v3-v274-assets-v1";
const ID = "science-cinematic-v3-v274-assets";
const INSTALLED_LIMIT = 2 * 1024 ** 3;
const WORKING_SET_LIMIT = 8 * 1024 ** 3;
const MINIMUM_FREE_DISK = 30 * 1024 ** 3;
const ROOT = resolve(".");
const OUTPUT_ROOT = resolve("dist/science-cinematic-v3-v274-assets");
const NASA_TERMS = "https://www.nasa.gov/nasa-brand-center/images-and-media/";

const definitions = [
  {
    id: "nasa-svs-milky-way-desktop-4k", group: "sky/backdrop",
    sourceUrl: "https://svs.gsfc.nasa.gov/4851/", originalPath: ".cache/sky-sources/milkyway_2020_16k.exr",
    outputPath: "public/textures/sky/orbit-atlas-v68-reference-backdrop-base-4k.jpg", tier: "desktop-4k", format: "jpg",
    derivedParameters: { projection: "equirectangular", width: 4096, height: 2048, recipe: "v68-reference-backdrop" },
    license: { id: "NASA-public-domain", status: "approved-runtime", termsUrl: NASA_TERMS, attributionRequired: false },
  },
  {
    id: "nasa-svs-milky-way-mobile-2k", group: "sky/backdrop",
    sourceUrl: "https://svs.gsfc.nasa.gov/4851/", originalPath: ".cache/sky-sources/milkyway_2020_16k.exr",
    outputPath: "public/textures/sky/orbit-atlas-v68-reference-backdrop-base-2k.jpg", tier: "mobile-2k", format: "jpg",
    derivedParameters: { projection: "equirectangular", width: 2048, height: 1024, recipe: "v68-reference-backdrop" },
    license: { id: "NASA-public-domain", status: "approved-runtime", termsUrl: NASA_TERMS, attributionRequired: false },
  },
  {
    id: "nasa-svs-bright-stars-desktop-4k", group: "sky/backdrop",
    sourceUrl: "https://svs.gsfc.nasa.gov/4851/", originalPath: ".cache/sky-sources/hiptyc_2020_16k.exr",
    outputPath: "public/textures/sky/orbit-atlas-v68-reference-primary-stars-4k.jpg", tier: "desktop-4k", format: "jpg",
    derivedParameters: { projection: "equirectangular", width: 4096, height: 2048, recipe: "v68-primary-stars" },
    license: { id: "NASA-public-domain", status: "approved-runtime", termsUrl: NASA_TERMS, attributionRequired: false },
  },
  {
    id: "nasa-svs-bright-stars-mobile-2k", group: "sky/backdrop",
    sourceUrl: "https://svs.gsfc.nasa.gov/4851/", originalPath: ".cache/sky-sources/hiptyc_2020_16k.exr",
    outputPath: "public/textures/sky/orbit-atlas-v68-reference-primary-stars-2k.jpg", tier: "mobile-2k", format: "jpg",
    derivedParameters: { projection: "equirectangular", width: 2048, height: 1024, recipe: "v68-primary-stars" },
    license: { id: "NASA-public-domain", status: "approved-runtime", termsUrl: NASA_TERMS, attributionRequired: false },
  },
];

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]));
  return value;
}

function canonicalSha(value) {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

async function sha256File(path) {
  const digest = createHash("sha256");
  for await (const chunk of createReadStream(path, { highWaterMark: 1024 * 1024 })) digest.update(chunk);
  return digest.digest("hex");
}

async function hardlinkOrCopy(source, destination) {
  await mkdir(dirname(destination), { recursive: true });
  try {
    await link(source, destination);
  } catch (error) {
    if (error?.code !== "EXDEV") throw error;
    await copyFile(source, destination);
  }
}

const disk = statfsSync("E:\\");
const freeDiskBytes = Number(disk.bavail) * Number(disk.bsize);
if (freeDiskBytes < MINIMUM_FREE_DISK) throw new Error(`v274 asset disk preflight failed: ${freeDiskBytes}<${MINIMUM_FREE_DISK}`);

const sourceCache = new Map();
const entries = [];
for (const definition of definitions) {
  if (definition.license.status !== "approved-runtime") throw new Error(`Unapproved v274 asset license: ${definition.id}`);
  const original = resolve(ROOT, definition.originalPath);
  const output = resolve(ROOT, definition.outputPath);
  if (!existsSync(original) || !existsSync(output)) throw new Error(`Missing v274 source/output: ${definition.id}`);
  let source = sourceCache.get(original);
  if (!source) {
    const info = await stat(original);
    source = { bytes: info.size, sha256: await sha256File(original), downloadedAt: info.mtime.toISOString() };
    sourceCache.set(original, source);
  }
  const outputInfo = await stat(output);
  entries.push({
    ...definition,
    downloadedAt: source.downloadedAt,
    originalBytes: source.bytes,
    originalSha256: source.sha256,
    outputBytes: outputInfo.size,
    outputSha256: await sha256File(output),
    originalPath: definition.originalPath.replaceAll("\\", "/"),
    outputPath: definition.outputPath.replace(/^public[\\/]/, "").replaceAll("\\", "/"),
  });
}

const installedBytes = entries.reduce((sum, entry) => sum + entry.outputBytes, 0);
const uniqueSourceBytes = [...sourceCache.values()].reduce((sum, source) => sum + source.bytes, 0);
if (installedBytes > INSTALLED_LIMIT) throw new Error(`v274 visual pack exceeds 2 GiB: ${installedBytes}`);
if (uniqueSourceBytes + installedBytes > WORKING_SET_LIMIT) throw new Error("v274 visual asset working set exceeds 8 GiB");

const canonical = {
  version: VERSION,
  id: ID,
  installedBytes,
  installedLimitBytes: INSTALLED_LIMIT,
  temporaryWorkingSetLimitBytes: WORKING_SET_LIMIT,
  minimumFreeDiskBytes: MINIMUM_FREE_DISK,
  runtimePolicy: "local-shadow-intent-only-no-formal-or-lite-default",
  entries,
  stagedExcluded: [],
};
const canonicalSha256 = canonicalSha(canonical);
const generatedAt = new Date().toISOString();
const manifest = { ...canonical, generatedAt, canonicalSha256 };
const contentRoot = join(OUTPUT_ROOT, canonicalSha256);
const staging = `${contentRoot}.part`;
if (!existsSync(contentRoot)) {
  await rm(staging, { recursive: true, force: true });
  await mkdir(staging, { recursive: true });
  for (const entry of entries) {
    await hardlinkOrCopy(resolve(ROOT, "public", entry.outputPath), join(staging, "files", entry.outputPath));
  }
  await writeFile(join(staging, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await rename(staging, contentRoot);
}
await mkdir(OUTPUT_ROOT, { recursive: true });
const pointerTemporary = join(OUTPUT_ROOT, "manifest.json.tmp");
await writeFile(pointerTemporary, `${JSON.stringify({ ...manifest, contentRoot: canonicalSha256 }, null, 2)}\n`);
await rename(pointerTemporary, join(OUTPUT_ROOT, "manifest.json"));
console.log(JSON.stringify({ id: ID, canonicalSha256, entries: entries.length, installedBytes }, null, 2));

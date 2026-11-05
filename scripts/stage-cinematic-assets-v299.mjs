import { createHash } from "node:crypto";
import { createReadStream, createWriteStream, existsSync, statfsSync } from "node:fs";
import { mkdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { resolve } from "node:path";

const ROOT = process.cwd();
const OUT = resolve(ROOT, "dist/staging/science-cinematic-v5-v299");
const RAW = resolve(OUT, "raw/starmap_random_2020_8k_gal.exr");
const PART = `${RAW}.part`;
const SIDECAR = resolve(OUT, "starmap-random-8k.sidecar.json");
const MANIFEST = resolve(OUT, "manifest.json");
const SOURCE_URL = "https://svs.gsfc.nasa.gov/vis/a000000/a004800/a004856/starmap_random_2020_8k_gal.exr";
const SOURCE_PAGE = "https://svs.gsfc.nasa.gov/4856/";
const TERMS_URL = "https://www.nasa.gov/nasa-brand-center/images-and-media/";
const MAX_BYTES = 512 * 1024 * 1024;
const MINIMUM_FREE_DISK_BYTES = 30 * 2 ** 30;

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !["generatedAt", "pid", "host", "absolutePath"].includes(key))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, canonicalize(entry)]));
}

function canonicalSha(value) {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

async function fileSha(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path, { highWaterMark: 1024 * 1024 })) hash.update(chunk);
  return hash.digest("hex");
}

async function freeDiskBytes() {
  const { free, bsize } = statfsSync(OUT);
  return Number(free) * Number(bsize);
}

async function atomicJson(path, value) {
  const temporary = `${path}.${process.pid}.part`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporary, path);
}

await mkdir(resolve(OUT, "raw"), { recursive: true });
const diskBefore = await freeDiskBytes();
if (diskBefore < MINIMUM_FREE_DISK_BYTES) throw new Error("v299 staging disk preflight failed before request");

let networkRequestApplied = false;
if (!existsSync(RAW)) {
  networkRequestApplied = true;
  const response = await fetch(SOURCE_URL, { redirect: "follow", signal: AbortSignal.timeout(120_000) });
  if (!response.ok || !response.body) throw new Error(`v299 staging request failed: ${response.status}`);
  const declared = Number(response.headers.get("content-length") ?? 0);
  if (declared > MAX_BYTES) throw new Error(`v299 staging source exceeds cap: ${declared}`);
  let bytes = 0;
  const bounded = new TransformStream({
    transform(chunk, controller) {
      bytes += chunk.byteLength;
      if (bytes > MAX_BYTES) throw new Error(`v299 staging stream exceeds cap: ${bytes}`);
      controller.enqueue(chunk);
    },
  });
  try {
    await pipeline(Readable.fromWeb(response.body.pipeThrough(bounded)), createWriteStream(PART, { flags: "wx" }));
    const info = await stat(PART);
    if (!info.isFile() || info.size <= 0 || info.size > MAX_BYTES) throw new Error("v299 staging downloaded file boundary failed");
    await rename(PART, RAW);
  } catch (error) {
    await unlink(PART).catch(() => {});
    const failureUnsigned = {
      version: "v299-visual-asset-staging-attempt-negative-v1",
      generatedAt: new Date().toISOString(),
      status: "blocked-network-or-integrity-no-automatic-retry",
      sourceUrl: SOURCE_URL,
      sourcePage: SOURCE_PAGE,
      termsUrl: TERMS_URL,
      requestCount: 1,
      networkRequestApplied: true,
      timeoutMilliseconds: 120_000,
      bytesPublished: 0,
      partialPreserved: false,
      runtimeEligible: false,
      publicRuntimeMutation: "not-applied",
      contentPackMutation: "not-applied",
      automaticRetryApplied: false,
      failure: error instanceof Error ? error.name : "unknown-network-or-integrity-failure",
    };
    const failure = { ...failureUnsigned, canonicalSha256: canonicalSha(failureUnsigned) };
    await atomicJson(resolve(OUT, `attempt-${Date.now()}-negative.json`), failure);
    throw error;
  }
}

const info = await stat(RAW);
const sha256 = await fileSha(RAW);
const sidecarUnsigned = {
  version: "v299-visual-asset-staging-sidecar-v1",
  generatedAt: new Date().toISOString(),
  id: "nasa-svs-random-starfield-8k",
  sourceUrl: SOURCE_URL,
  sourcePage: SOURCE_PAGE,
  termsUrl: TERMS_URL,
  path: "raw/starmap_random_2020_8k_gal.exr",
  bytes: info.size,
  sha256,
  networkRequestApplied,
  requestCount: networkRequestApplied ? 1 : 0,
  runtimeEligible: false,
  licenseStatus: "staging-awaiting-final-runtime-review",
  publicRuntimePathWritten: false,
};
const sidecar = { ...sidecarUnsigned, sidecarSha256: canonicalSha(sidecarUnsigned) };
await atomicJson(SIDECAR, sidecar);

const manifestUnsigned = {
  version: "science-cinematic-v5-v299-staging-manifest-v1",
  generatedAt: new Date().toISOString(),
  status: "staging-only-runtime-forbidden",
  installedBytes: info.size,
  maximumSourceBytes: MAX_BYTES,
  minimumFreeDiskBytes: MINIMUM_FREE_DISK_BYTES,
  diskFreeBytesBefore: diskBefore,
  entries: [{
    id: sidecar.id,
    sourceUrl: SOURCE_URL,
    sourcePage: SOURCE_PAGE,
    termsUrl: TERMS_URL,
    rawPath: sidecar.path,
    bytes: sidecar.bytes,
    sha256: sidecar.sha256,
    sidecarSha256: sidecar.sidecarSha256,
    runtimeEligible: false,
  }],
  esaDownloadApplied: false,
  publicRuntimeMutation: "not-applied",
  contentPackMutation: "not-applied",
  boundary: "downloaded-staging-only-license-and-runtime-selector-review-required",
};
const manifest = { ...manifestUnsigned, canonicalSha256: canonicalSha(manifestUnsigned) };
await atomicJson(MANIFEST, manifest);
console.log(JSON.stringify({ status: manifest.status, bytes: info.size, sha256, networkRequestApplied, manifest: "dist/staging/science-cinematic-v5-v299/manifest.json" }, null, 2));

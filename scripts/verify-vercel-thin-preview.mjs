import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const liteRoot = path.join(root, "public", "atlas-lite");
const manifest = JSON.parse(await readFile(path.join(liteRoot, "manifest.json"), "utf8"));
if (manifest.deliveryProfile !== "vercel-lite" || manifest.version !== "v171-vercel-lite-1.0.0") {
  throw new Error("Unexpected Vercel Lite manifest identity");
}
if (manifest.installedBytes > 82 * 1024 * 1024 || manifest.installedBytes > manifest.maxBytes) {
  throw new Error(`Vercel Lite payload exceeds budget: ${manifest.installedBytes}`);
}
for (const capability of ["overview", "objectInspect", "liteSearch", "launchDemo"]) {
  if (manifest.capabilities?.[capability] !== true) throw new Error(`Vercel Lite capability missing: ${capability}`);
}
for (const capability of ["millionStarCatalog", "fullObservationFixtures", "loopbackFallback"]) {
  if (manifest.capabilities?.[capability] !== false) throw new Error(`Vercel Lite forbidden capability enabled: ${capability}`);
}

let bytes = 0;
for (const entry of manifest.files) {
  const absolute = path.resolve(liteRoot, ...entry.path.split("/"));
  if (!absolute.startsWith(`${path.resolve(liteRoot)}${path.sep}`)) throw new Error(`Unsafe Lite path: ${entry.path}`);
  const fileStat = await stat(absolute);
  if (fileStat.size !== entry.bytes) throw new Error(`Lite size mismatch: ${entry.path}`);
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(absolute)) hash.update(chunk);
  if (hash.digest("hex") !== entry.sha256) throw new Error(`Lite checksum mismatch: ${entry.path}`);
  bytes += fileStat.size;
}
if (bytes !== manifest.installedBytes || manifest.files.length !== manifest.fileCount) {
  throw new Error("Vercel Lite manifest totals are inconsistent");
}

async function listFiles(directory, prefix = "") {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await listFiles(path.join(directory, entry.name), relative));
    else files.push(relative);
  }
  return files;
}
const expectedFiles = new Set(["manifest.json", ...manifest.files.map((entry) => entry.path)]);
const stagedFiles = await listFiles(liteRoot);
const unexpectedFiles = stagedFiles.filter((file) => !expectedFiles.has(file));
if (unexpectedFiles.length > 0 || stagedFiles.length !== expectedFiles.size) {
  throw new Error(`Vercel Lite contains files outside its manifest: ${unexpectedFiles.slice(0, 5).join(", ")}`);
}

const resolver = await readFile(path.join(root, "app", "lib", "atlasAssetResolver.ts"), "utf8");
if (!resolver.includes('deliveryProfile === "vercel-lite"') || !resolver.includes("candidates = deliveryProfile")) {
  throw new Error("Vercel Lite asset resolver must bypass content-pack and loopback candidates");
}
const nextConfig = await readFile(path.join(root, "next.config.mjs"), "utf8");
if (!nextConfig.includes('process.env.NODE_ENV === "development"') || !nextConfig.includes("ATLAS_TEXTURE_PROXY")) {
  throw new Error("Texture loopback proxy must remain explicitly development-gated");
}
console.log(`Vercel Lite verified: ${manifest.fileCount} files, ${(bytes / 1048576).toFixed(1)} MiB, no loopback fallback.`);

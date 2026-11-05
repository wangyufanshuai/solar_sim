import { copyFile, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("dist/content-packs");
const required = [
  "textures/sky/orbit-atlas-v9-base-4k.jpg",
  "textures/sky/orbit-atlas-v9-stars-2k.jpg",
];

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function writeJsonAtomic(file, value) {
  const temporary = `${file}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await rename(temporary, file);
}

const coreManifestPath = path.join(root, "core.manifest.json");
const deepManifestPath = path.join(root, "deep-sky.manifest.json");
const indexPath = path.join(root, "index.json");
const core = await readJson(coreManifestPath);
const deep = await readJson(deepManifestPath);

for (const logicalPath of required) {
  const existing = core.files.find((entry) => entry.path === logicalPath);
  if (existing) continue;
  const sourceEntry = deep.files.find((entry) => entry.path === logicalPath);
  if (!sourceEntry) throw new Error(`Required V9 source is not present in deep-sky: ${logicalPath}`);
  const source = path.join(root, "files", "deep-sky", ...logicalPath.split("/"));
  const destination = path.join(root, "files", "core", ...logicalPath.split("/"));
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(source, destination);
  core.files.push({ ...sourceEntry, source: `promoted-from-deep-sky:${sourceEntry.source}` });
}

core.files.sort((a, b) => a.path.localeCompare(b.path));
core.installedBytes = core.files.reduce((total, entry) => total + entry.bytes, 0);
await writeJsonAtomic(coreManifestPath, core);

deep.files = deep.files.filter((entry) => !required.includes(entry.path));
deep.installedBytes = deep.files.reduce((total, entry) => total + entry.bytes, 0);
await writeJsonAtomic(deepManifestPath, deep);
for (const logicalPath of required) {
  await rm(path.join(root, "files", "deep-sky", ...logicalPath.split("/")), { force: true });
}

const index = await readJson(indexPath);
for (const pack of index.packs) {
  const manifest = pack.id === "core" ? core : pack.id === "deep-sky" ? deep : null;
  if (!manifest) continue;
  pack.installedBytes = manifest.installedBytes;
  pack.fileCount = manifest.files.length;
}
await writeJsonAtomic(indexPath, index);

console.log(`V9 core assets ready: ${required.length}; core ${(core.installedBytes / 1048576).toFixed(1)} MiB`);

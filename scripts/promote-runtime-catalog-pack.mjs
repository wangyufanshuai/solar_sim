import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const project = path.resolve(".");
const packRoot = path.join(project, "dist", "content-packs");
const sourceRoot = path.join(project, "src-tauri", "server", "public", "data", "catalog-lite-v6");
const destinationPrefix = "data/catalog-lite-v6";
const destinationRoot = path.join(packRoot, "files", "core", ...destinationPrefix.split("/"));
const manifestPath = path.join(packRoot, "core.manifest.json");
const indexPath = path.join(packRoot, "index.json");

async function walk(root) {
  const files = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else files.push(fullPath);
  }
  return files;
}

async function sha256(filePath) {
  const hash = createHash("sha256");
  hash.update(await readFile(filePath));
  return hash.digest("hex");
}

const sourceManifest = JSON.parse(await readFile(path.join(sourceRoot, "manifest.json"), "utf8"));
if (sourceManifest.rowCount !== 224_361) {
  throw new Error(`Unexpected catalog-lite-v6 row count: ${sourceManifest.rowCount}`);
}

const coreManifest = JSON.parse(await readFile(manifestPath, "utf8"));
const sourceFiles = await walk(sourceRoot);
const promotedFiles = [];
for (const sourceFile of sourceFiles) {
  const relativePath = path.relative(sourceRoot, sourceFile).replaceAll("\\", "/");
  const destinationPath = path.join(destinationRoot, ...relativePath.split("/"));
  await mkdir(path.dirname(destinationPath), { recursive: true });
  await copyFile(sourceFile, destinationPath);
  const info = await stat(sourceFile);
  promotedFiles.push({
    path: `${destinationPrefix}/${relativePath}`,
    bytes: info.size,
    sha256: await sha256(sourceFile),
    source: "src-tauri/server/public/data/catalog-lite-v6",
    license: "mixed-provenance-see-catalog-manifest",
  });
}

coreManifest.files = [
  ...coreManifest.files.filter((entry) => !entry.path.startsWith(`${destinationPrefix}/`)),
  ...promotedFiles,
].sort((left, right) => left.path.localeCompare(right.path));
coreManifest.installedBytes = coreManifest.files.reduce((sum, entry) => sum + entry.bytes, 0);
if (coreManifest.installedBytes > 300 * 1024 * 1024) {
  throw new Error(`Core content pack exceeds 300 MiB: ${coreManifest.installedBytes}`);
}
await writeFile(manifestPath, JSON.stringify(coreManifest, null, 2));

const index = JSON.parse(await readFile(indexPath, "utf8"));
const coreIndex = index.packs.find((entry) => entry.id === "core");
if (!coreIndex) throw new Error("Core content pack is absent from index.json");
coreIndex.installedBytes = coreManifest.installedBytes;
coreIndex.fileCount = coreManifest.files.length;
await writeFile(indexPath, JSON.stringify(index, null, 2));

console.log(JSON.stringify({
  version: "v160-runtime-catalog-pack",
  rows: sourceManifest.rowCount,
  files: promotedFiles.length,
  installedMiB: Number((coreManifest.installedBytes / 1048576).toFixed(1)),
}, null, 2));

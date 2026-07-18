import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.env.ATLAS_LOCAL_ASSET_PACK_ROOT || "dist/content-packs");
const names = (await readdir(root)).filter((name) => name.endsWith(".manifest.json")).sort();
if (!names.length) throw new Error("no content-pack manifests found");
let fileCount = 0;
let totalBytes = 0;

async function sha256(file) {
  return await new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    createReadStream(file).on("data", (chunk) => hash.update(chunk)).on("error", reject).on("end", () => resolve(hash.digest("hex")));
  });
}

for (const name of names) {
  const manifest = JSON.parse(await readFile(path.join(root, name), "utf8"));
  if (manifest.id !== name.slice(0, -".manifest.json".length)) throw new Error(`pack id mismatch: ${name}`);
  let packBytes = 0;
  for (const entry of manifest.files) {
    if (!entry.path || entry.path.includes("..") || path.isAbsolute(entry.path)) throw new Error(`unsafe path: ${entry.path}`);
    const file = path.resolve(root, "files", manifest.id, ...entry.path.split("/"));
    const expectedRoot = path.resolve(root, "files", manifest.id);
    if (!file.startsWith(`${expectedRoot}${path.sep}`)) throw new Error(`escaped path: ${entry.path}`);
    const info = await stat(file);
    if (!info.isFile() || info.size !== entry.bytes) throw new Error(`size mismatch: ${manifest.id}/${entry.path}`);
    if (await sha256(file) !== entry.sha256) throw new Error(`checksum mismatch: ${manifest.id}/${entry.path}`);
    packBytes += entry.bytes;
    fileCount += 1;
  }
  if (packBytes !== manifest.installedBytes) throw new Error(`installed bytes mismatch: ${manifest.id}`);
  totalBytes += packBytes;
}
console.log(`asset-delivery-v3: ${names.length} packs, ${fileCount} files, ${(totalBytes / 1048576).toFixed(1)} MiB verified`);

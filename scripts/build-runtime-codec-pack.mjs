import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("dist/content-packs");
const packId = "runtime-codecs";
const output = path.join(root, "files", packId, "basis");
const source = path.resolve("node_modules/three/examples/jsm/libs/basis");
const names = ["basis_transcoder.js", "basis_transcoder.wasm"];

await rm(path.join(root, "files", packId), { recursive: true, force: true });
await mkdir(output, { recursive: true });

const files = [];
for (const name of names) {
  const sourcePath = path.join(source, name);
  const destinationPath = path.join(output, name);
  await copyFile(sourcePath, destinationPath);
  const body = await readFile(destinationPath);
  const info = await stat(destinationPath);
  files.push({
    path: `basis/${name}`,
    bytes: info.size,
    sha256: createHash("sha256").update(body).digest("hex"),
    source: `three@0.170.0/examples/jsm/libs/basis/${name}`,
    license: "MIT-Three.js-and-Apache-2.0-Basis-Universal",
  });
}

const installedBytes = files.reduce((sum, file) => sum + file.bytes, 0);
const manifest = {
  schemaVersion: 1,
  id: packId,
  version: "v160-three-r170-basis",
  appCompatibility: { minimum: "1.0.0", maximumExclusive: "2.0.0" },
  qualityTier: "required",
  compressedBytes: 0,
  installedBytes,
  baseUrl: "",
  files,
};
await writeFile(path.join(root, `${packId}.manifest.json`), JSON.stringify(manifest, null, 2));
const indexPath = path.join(root, "index.json");
const index = JSON.parse(await readFile(indexPath, "utf8"));
index.packs = [
  ...index.packs.filter((pack) => pack.id !== packId),
  {
    id: packId,
    path: `${packId}.manifest.json`,
    installedBytes,
    fileCount: files.length,
  },
];
await writeFile(indexPath, JSON.stringify(index, null, 2));
console.log(`${packId}: ${files.length} files ${(installedBytes / 1048576).toFixed(2)} MiB`);

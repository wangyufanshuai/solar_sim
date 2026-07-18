import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("dist/content-packs");
const output = path.resolve("dist/visual-hd-v3");
const packIds = ["planet-hd", "spacecraft", "deep-sky", "runtime-codecs"];
const packs = [];
const files = [];

for (const packId of packIds) {
  const manifest = JSON.parse(await readFile(path.join(root, `${packId}.manifest.json`), "utf8"));
  packs.push({
    id: packId,
    version: manifest.version,
    installedBytes: manifest.installedBytes,
    fileCount: manifest.files.length,
    manifest: `../content-packs/${packId}.manifest.json`,
  });
  for (const file of manifest.files) {
    files.push({ packId, ...file });
  }
}

const installedBytes = packs.reduce((sum, pack) => sum + pack.installedBytes, 0);
if (installedBytes > 3 * 1024 ** 3) throw new Error(`visual-hd-v3 exceeds 3 GiB: ${installedBytes}`);
const keys = new Set(files.map((file) => `${file.packId}:${file.path}`));
if (keys.size !== files.length) throw new Error("visual-hd-v3 contains duplicate pack paths");

const manifest = {
  version: "v162-visual-hd-v3",
  generatedAt: new Date().toISOString(),
  installedBytes,
  installedLimitBytes: 3 * 1024 ** 3,
  inspectTextureResidencyLimitBytes: 1.25 * 1024 ** 3,
  totalGpuResidencyLimitBytes: 2.2 * 1024 ** 3,
  runtimePolicy: "content-pack-streaming-scene-lru-ktx2-webgl2",
  skyPolicy: "v9-frozen-deep-sky-pack-not-enabled-as-default-replacement",
  sourcePolicy: "nasa-esa-jpl-cc0-cc-by-khronos-with-per-file-provenance",
  packs,
  files,
};
await mkdir(output, { recursive: true });
await writeFile(path.join(output, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`visual-hd-v3: ${files.length} files ${(installedBytes / 1048576).toFixed(1)} MiB`);

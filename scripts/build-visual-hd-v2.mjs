import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const roots = [
  { root: "public/textures/ktx2", role: "planet-ktx2", source: "NASA/ESA converted project assets", license: "source-manifest-specific" },
  { root: "public/textures/planets/hd", role: "planet-hd-fallback", source: "NASA/ESA project assets", license: "source-manifest-specific" },
  { root: "public/models/spacecraft", role: "spacecraft-glb", source: "project spacecraft manifest", license: "source-manifest-specific" },
];
async function walk(root) {
  const result = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) result.push(...await walk(full)); else result.push(full);
  }
  return result;
}
async function sha256(file) { const hash = createHash("sha256"); for await (const chunk of createReadStream(file)) hash.update(chunk); return hash.digest("hex"); }
const files = [];
for (const descriptor of roots) {
  const absoluteRoot = path.resolve(descriptor.root);
  try {
    for (const file of await walk(absoluteRoot)) {
      const info = await stat(file);
      files.push({ path: path.relative(path.resolve("public"), file).replaceAll("\\", "/"), bytes: info.size, sha256: await sha256(file), role: descriptor.role, source: descriptor.source, license: descriptor.license });
    }
  } catch (error) { if (error?.code !== "ENOENT") throw error; }
}
files.sort((left, right) => left.path.localeCompare(right.path));
const manifest = { version: "v143-visual-hd-v2", installedBytes: files.reduce((sum, file) => sum + file.bytes, 0), gpuResidencyLimitBytes: 2.5 * 1024 ** 3, inspectTextureResidencyLimitBytes: 1.25 * 1024 ** 3, files, runtimePolicy: "scene-lru-on-demand-release-on-exit" };
if (manifest.installedBytes > 1.5 * 1024 ** 3) throw new Error("visual-hd-v2 exceeds 1.5 GiB");
await mkdir(path.resolve("dist/visual-hd-v2"), { recursive: true });
await writeFile(path.resolve("dist/visual-hd-v2/manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`visual-hd-v2: ${files.length} files, ${(manifest.installedBytes / 1048576).toFixed(1)} MiB`);

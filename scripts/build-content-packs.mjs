import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { cp, link, mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const PROJECT = path.resolve(".");
const OUT = path.resolve("dist/content-packs");
const VERSION = "1.0.0";
const planetFallbacks = ["earth.jpg", "jupiter.jpg", "mars.jpg", "mercury.jpg", "moon.jpg", "neptune.jpg", "saturn.jpg", "uranus.jpg", "venus.jpg"];
const coreSkyFiles = [
  "orbit-atlas-v9-base-8k.jpg",
  "orbit-atlas-v9-base-4k.jpg",
  "orbit-atlas-v9-stars-4k.jpg",
  "orbit-atlas-v9-stars-2k.jpg",
  "orbit-atlas-v9-dust-2k.jpg",
];
const coreDataFiles = [
  "gaia-dr3-bright-5000.json",
  "gaia-dr3-nearby-46000-v255.json",
  "asterisms-v255.json",
  "nebulae-v255-additions.json",
  "star-clusters-v255-additions.json",
  "gaia-dr3-kinematics-2000.json",
  "planet-textures-v2.json",
  "release-program-v140.json",
  "scientific-evidence-v4.json",
  "scientific-evidence-v5.json",
];
const PACKS = {
  core: [
    { source: "src-tauri/server/public/data/catalog-lite-v6", destination: "data/catalog-lite-v6" },
    { source: "public/data/exoplanets-v2", destination: "data/exoplanets-v2" },
    { source: "public/data/exoplanet-observations-v2", destination: "data/exoplanet-observations-v2" },
    { source: "public/data/catalog-lite-v7", destination: "data/catalog-lite-v7" },
    { source: "public/data/catalog-healpix-v8", destination: "data/catalog-healpix-v8" },
    { source: "public/data/catalog-healpix-v9", destination: "data/catalog-healpix-v9" },
    { source: "public/data/catalog-healpix-v10", destination: "data/catalog-healpix-v10" },
    { source: "public/data/openngc-v260", destination: "data/openngc-v260" },
    { source: "public/data/openrocket", destination: "data/openrocket" },
    { source: "public/favicon.ico", destination: "favicon.ico" },
    ...coreDataFiles.map((name) => ({ source: `public/data/${name}`, destination: `data/${name}` })),
    ...coreSkyFiles.map((name) => ({ source: `public/textures/sky/${name}`, destination: `textures/sky/${name}` })),
    ...planetFallbacks.map((name) => ({ source: `public/textures/planets/${name}`, destination: `textures/planets/${name}` })),
  ],
  "planet-hd": [
    { source: "public/textures/ktx2", destination: "textures/ktx2" },
    { source: "public/textures/planets/hd", destination: "textures/planets/hd" },
    { source: "public/textures/planets/v49", destination: "textures/planets/v49" },
  ],
  "deep-sky": [{ source: "public/textures/sky", destination: "textures/sky" }],
  spacecraft: [{ source: "public/models/spacecraft", destination: "models/spacecraft" }],
  "science-fixtures": [
    "kerr-v2-reference-fixtures.json",
    "kerr-independent-fixtures-v5.json",
    "observation-fixtures-v2.json",
    "horizons-validation-j2000.json",
    "horizons-validation-j2000-barycenter-candidate.json",
    "horizons-validation-j2000-outer-system-barycenter-v84.json",
    "horizons_reference.json",
  ].map((name) => ({ source: `public/data/${name}`, destination: `data/${name}` })),
  "gaia-presentation": [
    {
      source: "public/data/gaia-dr3-presentation-10000000-v9",
      destination: "data/gaia-dr3-presentation-10000000-v9",
    },
  ],
};
const LICENSES = {
  core: "mixed-provenance-see-project-manifests",
  "planet-hd": "NASA-public-domain-and-source-manifests",
  "deep-sky": "NASA-ESA-source-manifests",
  spacecraft: "source-manifest-specific",
  "science-fixtures": "project-generated-research-fixtures",
  "gaia-presentation": "ESA-Gaia-DR3-presentation-sample-see-manifest",
};

async function walk(root) {
  const result = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) result.push(...await walk(full)); else result.push(full);
  }
  return result;
}
async function collect(root) { const info = await stat(root); return info.isDirectory() ? walk(root) : [root]; }
async function sha256(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file, { highWaterMark: 1024 * 1024 })) {
    hash.update(chunk);
  }
  return hash.digest("hex");
}
async function materialize(source, destination) {
  await mkdir(path.dirname(destination), { recursive: true });
  await rm(destination, { force: true });
  try { await link(source, destination); } catch { await cp(source, destination); }
}

async function assertSourceTreeIsStaged() {
  const requiredRoots = ["public/data", "public/textures", "public/models"];
  const missing = [];
  for (const relativeRoot of requiredRoots) {
    try {
      if ((await walk(path.resolve(PROJECT, relativeRoot))).length === 0) missing.push(relativeRoot);
    } catch (error) {
      if (error?.code === "ENOENT") missing.push(relativeRoot);
      else throw error;
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Refusing to replace existing content packs because source staging is empty: ${missing.join(", ")}`,
    );
  }
}

await assertSourceTreeIsStaged();
await mkdir(OUT, { recursive: true });
const index = [];
for (const [id, roots] of Object.entries(PACKS)) {
  const files = [];
  const fileRoot = path.join(OUT, "files", id);
  await rm(fileRoot, { recursive: true, force: true });
  for (const entry of roots) {
    const sourceRoot = path.resolve(PROJECT, entry.source);
    try {
      for (const file of await collect(sourceRoot)) {
        if (id === "deep-sky" && coreSkyFiles.includes(path.basename(file))) continue;
        const suffix = (await stat(sourceRoot)).isDirectory() ? path.relative(sourceRoot, file) : "";
        const destinationPath = path.posix.join(entry.destination.replaceAll("\\", "/"), suffix.replaceAll("\\", "/"));
        const info = await stat(file);
        await materialize(file, path.join(fileRoot, destinationPath));
        files.push({ path: destinationPath, bytes: info.size, sha256: await sha256(file), source: entry.source, license: LICENSES[id] });
      }
    } catch (error) { if (error?.code !== "ENOENT") throw error; }
  }
  files.sort((a, b) => a.path.localeCompare(b.path));
  if (id === "gaia-presentation" && files.length === 0) {
    await rm(fileRoot, { recursive: true, force: true });
    continue;
  }
  const installedBytes = files.reduce((total, file) => total + file.bytes, 0);
  const manifest = { schemaVersion: 1, id, version: VERSION, appCompatibility: { minimum: "1.0.0", maximumExclusive: "2.0.0" }, qualityTier: id === "core" ? "required" : id === "science-fixtures" ? "scientific" : id === "planet-hd" ? "hd" : "standard", compressedBytes: 0, installedBytes, baseUrl: "", files };
  if (id === "core" && installedBytes > 300 * 1024 * 1024) throw new Error(`core content pack exceeds 300 MiB: ${installedBytes}`);
  await writeFile(path.join(OUT, `${id}.manifest.json`), JSON.stringify(manifest, null, 2));
  index.push({ id, path: `${id}.manifest.json`, installedBytes, fileCount: files.length });
  console.log(`${id}: ${files.length} files ${(installedBytes / 1048576).toFixed(1)} MiB`);
}
await writeFile(path.join(OUT, "index.json"), JSON.stringify({ version: VERSION, packs: index }, null, 2));

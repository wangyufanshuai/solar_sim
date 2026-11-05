import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { copyFile, link, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const contentRoot = path.join(root, "dist", "content-packs");
const outputRoot = path.join(root, "public", "atlas-lite");
const maxBytes = 82 * 1024 * 1024;

const exactCoreFiles = new Set([
  "data/catalog-lite-v7/astrophysical-parameters.json.gz",
  "data/catalog-lite-v7/hr-statistics.json",
  "data/gaia-dr3-bright-5000.json",
  "data/gaia-dr3-nearby-46000-v255.json",
  "data/asterisms-v255.json",
  "data/nebulae-v255-additions.json",
  "data/star-clusters-v255-additions.json",
  "data/gaia-dr3-kinematics-2000.json",
  "data/openrocket/leo-satellite-demo.json",
  "data/planet-textures-v2.json",
]);
const corePrefixes = [
  "data/catalog-lite-v6/",
  "data/exoplanets-v2/",
  "textures/planets/",
  "textures/sky/orbit-atlas-v9-",
];
const spacecraftFiles = new Set([
  "models/spacecraft/manifest.json",
  "models/spacecraft/cubesat-1ru.glb",
  "models/spacecraft/orion-capsule.glb",
  "models/spacecraft/sls-block-1.glb",
]);
const scienceFixtureFiles = new Set([
  "data/horizons-validation-j2000.json",
]);
const rewrittenManifests = new Set([
  "data/catalog-lite-v6/manifest.json",
  "data/exoplanets-v2/manifest.json",
]);

async function sha256(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

function rewriteLitePaths(value) {
  if (Array.isArray(value)) return value.map(rewriteLitePaths);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, rewriteLitePaths(item)]));
  }
  if (typeof value === "string" && value.startsWith("/data/")) {
    return `/atlas-lite${value}`;
  }
  return value;
}

async function materialize(source, destination, rewriteJson, expectedSha256) {
  await mkdir(path.dirname(destination), { recursive: true });
  if (rewriteJson) {
    const document = JSON.parse(await readFile(source, "utf8"));
    await writeFile(destination, `${JSON.stringify(rewriteLitePaths(document), null, 2)}\n`, "utf8");
    return;
  }
  try {
    const [sourceStat, destinationStat] = await Promise.all([stat(source), stat(destination)]);
    if (
      sourceStat.size === destinationStat.size
      && expectedSha256
      && await sha256(destination) === expectedSha256
    ) return;
  } catch {}
  try {
    await link(source, destination);
  } catch {
    await copyFile(source, destination);
  }
}

const selections = [];
for (const packId of ["core", "spacecraft", "science-fixtures"]) {
  const manifest = JSON.parse(await readFile(path.join(contentRoot, `${packId}.manifest.json`), "utf8"));
  for (const entry of manifest.files) {
    const selected = packId === "core"
      ? exactCoreFiles.has(entry.path) || corePrefixes.some((prefix) => entry.path.startsWith(prefix))
      : packId === "spacecraft"
        ? spacecraftFiles.has(entry.path)
        : scienceFixtureFiles.has(entry.path);
    if (selected) selections.push({ packId, entry });
  }
}

const files = [];
for (const { packId, entry } of selections) {
  const source = path.join(contentRoot, "files", packId, ...entry.path.split("/"));
  const destination = path.join(outputRoot, ...entry.path.split("/"));
  await materialize(
    source,
    destination,
    rewrittenManifests.has(entry.path),
    entry.sha256,
  );
  const destinationStat = await stat(destination);
  files.push({
    path: entry.path,
    bytes: destinationStat.size,
    sha256: await sha256(destination),
    sourcePack: packId,
    license: entry.license ?? "see-source-pack-manifest",
  });
}

files.sort((left, right) => left.path.localeCompare(right.path));
const installedBytes = files.reduce((total, entry) => total + entry.bytes, 0);
if (installedBytes > maxBytes) {
  throw new Error(`Vercel Lite payload exceeds 82 MiB: ${installedBytes}`);
}

const manifest = {
  schemaVersion: 1,
  version: "v171-vercel-lite-1.0.0",
  deliveryProfile: "vercel-lite",
  maxBytes,
  installedBytes,
  fileCount: files.length,
  sourcePacks: ["core@1.0.0", "spacecraft@1.0.0", "science-fixtures@1.0.0"],
  capabilities: {
    overview: true,
    objectInspect: true,
    liteSearch: true,
    launchDemo: true,
    millionStarCatalog: false,
    fullObservationFixtures: false,
    loopbackFallback: false,
  },
  files,
};
await mkdir(outputRoot, { recursive: true });
await writeFile(path.join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Vercel Lite staged: ${files.length} files, ${(installedBytes / 1048576).toFixed(1)} MiB.`);

import { cp, lstat, mkdir, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(".");
const stageRoot = path.resolve(root, "dist", "desktop-stage");
const argumentValue = (name) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};
const stageProfile = argumentValue("--profile") ?? argumentValue("--version") ?? "release";
if (!/^[a-z0-9][a-z0-9-]{0,31}$/.test(stageProfile)) {
  throw new Error(`Invalid desktop stage profile: ${stageProfile}`);
}
const releaseVersion = process.env.ATLAS_RELEASE_VERSION?.trim() || "1.0.0-beta.1";
const requestedNextRoot = argumentValue("--next-root");
const target = path.resolve(stageRoot, stageProfile);
const temporary = path.resolve(stageRoot, `.${stageProfile}-staging`);
const previous = path.resolve(stageRoot, `.${stageProfile}-previous`);
const MAX_STAGE_BYTES = 260 * 1024 * 1024;
const PACK_IDS = ["core", "planet-hd", "deep-sky", "spacecraft", "science-fixtures", "runtime-codecs"];

function assertGeneratedPath(candidate) {
  const relative = path.relative(stageRoot, candidate);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing desktop stage path outside ${stageRoot}: ${candidate}`);
  }
}

async function exists(candidate) {
  try { await lstat(candidate); return true; } catch { return false; }
}

async function firstExisting(candidates) {
  for (const candidate of candidates) if (await exists(candidate)) return candidate;
  throw new Error(`Missing desktop build input. Checked: ${candidates.join(", ")}`);
}

async function walkBytes(directory) {
  let bytes = 0;
  let files = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      const nested = await walkBytes(candidate);
      bytes += nested.bytes;
      files += nested.files;
    } else if (entry.isFile()) {
      bytes += (await stat(candidate)).size;
      files += 1;
    }
  }
  return { bytes, files };
}

for (const generated of [temporary, previous, target]) assertGeneratedPath(generated);
await mkdir(stageRoot, { recursive: true });
await rm(temporary, { recursive: true, force: true });
await rm(previous, { recursive: true, force: true });

const nextRoot = requestedNextRoot
  ? await firstExisting([path.resolve(root, requestedNextRoot)])
  : await firstExisting([
      path.resolve(root, ".next-atlas-standalone-current"),
      path.resolve(root, ".next-v186"),
      path.resolve(root, ".next-v180"),
      path.resolve(root, ".next"),
    ]);
const standalone = path.join(nextRoot, "standalone");
const buildId = (await readFile(path.join(nextRoot, "BUILD_ID"), "utf8")).trim();
if (!buildId) throw new Error(`Invalid BUILD_ID in ${nextRoot}`);

const serverTarget = path.join(temporary, "server");
await mkdir(serverTarget, { recursive: true });
for (const entry of ["server.js", "package.json", "node_modules"]) {
  await cp(path.join(standalone, entry), path.join(serverTarget, entry), { recursive: true });
}
await cp(
  path.resolve(root, "scripts", "atlas-server-bootstrap.mjs"),
  path.join(serverTarget, "atlas-server-bootstrap.mjs"),
);
const standaloneNext = path.join(standalone, path.basename(nextRoot));
const standaloneStaticJunction = path.join(standaloneNext, "static");
await cp(standaloneNext, path.join(serverTarget, ".next"), {
  recursive: true,
  filter: (source) => path.resolve(source) !== path.resolve(standaloneStaticJunction),
});
await cp(path.join(nextRoot, "static"), path.join(serverTarget, ".next", "static"), { recursive: true });

// Compact desktop starts with the exact Lite/core data surface. Optional HD,
// deep-sky, spacecraft, fixtures and codecs remain versioned installable packs.
const publicTarget = path.join(serverTarget, "public");
await mkdir(publicTarget, { recursive: true });
await cp(path.resolve(root, "dist", "content-packs", "files", "core"), publicTarget, { recursive: true });
const manifestTarget = path.join(temporary, "content-pack-manifests");
await mkdir(manifestTarget, { recursive: true });
for (const id of PACK_IDS) {
  const source = path.resolve(root, "dist", "content-packs", `${id}.manifest.json`);
  if (!await exists(source)) throw new Error(`Missing desktop content pack manifest: ${id}`);
  await cp(source, path.join(manifestTarget, `${id}.manifest.json`));
}

const nodeExecutable = process.execPath;
await mkdir(path.join(temporary, "runtime"), { recursive: true });
await cp(nodeExecutable, path.join(temporary, "runtime", "node.exe"));

const inventory = await walkBytes(temporary);
if (inventory.bytes > MAX_STAGE_BYTES) {
  throw new Error(`Desktop compact stage exceeds 260 MiB: ${(inventory.bytes / 1048576).toFixed(1)} MiB`);
}
await writeFile(path.join(temporary, "desktop-stage.json"), JSON.stringify({
  version: "desktop-compact-stage-v1",
  releaseVersion,
  profile: stageProfile,
  nextBuildId: buildId,
  nextBuildRoot: path.relative(root, nextRoot).replaceAll("\\", "/"),
  deliveryProfile: "desktop-compact",
  initialCatalogBackend: "web-worker-shards",
  initialCatalogRows: 224_361,
  contentPackIds: PACK_IDS,
  excluded: ["catalog-v5.sqlite", "full-content-pack-payloads"],
  bytes: inventory.bytes,
  files: inventory.files,
}, null, 2));

if (await exists(target)) await rename(target, previous);
await rename(temporary, target);
await rm(previous, { recursive: true, force: true });
console.log(JSON.stringify({ target, ...inventory, mib: Number((inventory.bytes / 1048576).toFixed(1)) }, null, 2));

import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MAX_FILE_BYTES = 95 * 1024 * 1024;

const manifests = [
  path.join(root, "public", "textures", "deep-sky", "combined-resource-manifest.json"),
  path.join(root, "public", "textures", "deep-sky", "pack-v2-manifest.json"),
  path.join(root, "public", "models", "spacecraft", "nasa-v2", "manifest.json"),
];

function fail(message) {
  console.error(`FAIL ${message}`);
  process.exitCode = 1;
}

async function sha256(file) {
  const buf = await readFile(file);
  return createHash("sha256").update(buf).digest("hex");
}

async function checkFile(publicUrl, checksum) {
  if (!publicUrl) {
    fail("missing public URL");
    return 0;
  }
  const file = path.join(root, "public", publicUrl.replace(/^\//, ""));
  let st;
  try {
    st = await stat(file);
  } catch {
    fail(`missing file ${publicUrl}`);
    return 0;
  }
  if (st.size <= 0) fail(`empty file ${publicUrl}`);
  if (st.size > MAX_FILE_BYTES) fail(`file exceeds 95MB ${publicUrl}: ${st.size}`);
  if (checksum && checksum !== "legacy") {
    const actual = await sha256(file);
    if (actual !== checksum) fail(`checksum mismatch ${publicUrl}`);
  }
  return st.size;
}

let deepSkyCount = 0;
let spacecraftCount = 0;
for (const manifestPath of manifests) {
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch {
    fail(`missing manifest ${path.relative(root, manifestPath)}`);
    continue;
  }
  for (const item of manifest.deepSky ?? []) {
    deepSkyCount++;
    if (!item.id || !item.name || !item.credit) fail(`deep-sky metadata incomplete: ${item.id}`);
    if (!item.galactic || !Number.isFinite(item.galactic.lonDeg) || !Number.isFinite(item.galactic.latDeg)) {
      fail(`deep-sky coordinates invalid: ${item.id}`);
    }
    await checkFile(item.previewUrl, item.checksum?.preview);
    await checkFile(item.qualityUrl, item.checksum?.quality);
  }
  for (const item of manifest.spacecraft ?? []) {
    spacecraftCount++;
    if (!item.id || !item.title || !item.originUrl || !item.sourcePage || !item.credit) {
      fail(`spacecraft metadata incomplete: ${item.id}`);
    }
    await checkFile(item.localPath, item.checksum);
  }
}

if (deepSkyCount < 70) fail(`expected at least 70 deep-sky resources, got ${deepSkyCount}`);
if (spacecraftCount < 8) fail(`expected at least 8 spacecraft models, got ${spacecraftCount}`);
if (!process.exitCode) {
  console.log(`PASS resources: ${deepSkyCount} deep-sky entries, ${spacecraftCount} spacecraft entries`);
}

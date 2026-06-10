import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");
const manifestPath = path.join(publicDir, "models", "spacecraft", "nasa-v2", "manifest.json");
const decoderFiles = ["draco_decoder.js", "draco_decoder.wasm", "draco_wasm_wrapper.js"];
const MAX_FILE_BYTES = 95 * 1024 * 1024;
let failed = false;

function fail(message) {
  failed = true;
  console.error(`FAIL ${message}`);
}

function glbJson(buffer) {
  if (buffer.readUInt32LE(0) !== 0x46546c67) throw new Error("invalid GLB magic");
  const jsonLength = buffer.readUInt32LE(12);
  const jsonType = buffer.readUInt32LE(16);
  if (jsonType !== 0x4e4f534a) throw new Error("missing GLB JSON chunk");
  return JSON.parse(buffer.subarray(20, 20 + jsonLength).toString("utf8").replace(/\0+$/, ""));
}

for (const file of decoderFiles) {
  try {
    const info = await stat(path.join(publicDir, "draco", file));
    if (info.size <= 0) fail(`empty Draco decoder ${file}`);
  } catch {
    fail(`missing local Draco decoder ${file}`);
  }
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const items = manifest.spacecraft ?? [];
if (items.length < 10) fail(`expected 10 gallery models, got ${items.length}`);

let compressed = 0;
for (const item of items) {
  const filePath = path.join(publicDir, item.localPath.replace(/^\//, ""));
  try {
    const buffer = await readFile(filePath);
    if (buffer.length > MAX_FILE_BYTES) fail(`${item.id} exceeds 95MB`);
    const checksum = createHash("sha256").update(buffer).digest("hex");
    if (checksum !== item.checksum) fail(`${item.id} checksum mismatch`);
    const json = glbJson(buffer);
    const usesDraco = (json.extensionsUsed ?? []).includes("KHR_draco_mesh_compression");
    if (usesDraco) compressed += 1;
    const primitiveUsesDraco = (json.meshes ?? []).some((mesh) =>
      (mesh.primitives ?? []).some((primitive) => primitive.extensions?.KHR_draco_mesh_compression),
    );
    if (usesDraco !== primitiveUsesDraco) {
      fail(`${item.id} Draco extension declaration is inconsistent`);
    }
  } catch (error) {
    fail(`${item.id}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (compressed === 0) fail("gallery audit found no Draco-compressed models");
if (failed) process.exit(1);
console.log(`PASS gallery models: ${items.length} GLB files, ${compressed} Draco-compressed, local decoder ready`);

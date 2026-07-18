import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const CHUNK_BYTES = 16 * 1024 * 1024;
const source = path.resolve("dist/catalog-v5/catalog-v5.sqlite");
const sourceManifestPath = path.resolve("dist/catalog-v5/catalog-v5.manifest.json");
const outputRoot = path.resolve("dist/catalog-million-v6");
await mkdir(outputRoot, { recursive: true });
const sourceManifest = JSON.parse(await readFile(sourceManifestPath, "utf8"));
const sourceInfo = await stat(source);
if (sourceManifest.rowCount < 1_000_000) throw new Error("catalog-v5 source is below one million rows");
if (sourceInfo.size > 360 * 1024 * 1024) throw new Error("catalog-million-v6 exceeds 360 MiB");

const chunks = [];
let index = 0;
let offset = 0;
for await (const buffer of createReadStream(source, { highWaterMark: CHUNK_BYTES })) {
  const filename = `catalog-million-v6.part-${String(index).padStart(3, "0")}`;
  const destination = path.join(outputRoot, filename);
  await new Promise((resolve, reject) => {
    const writer = createWriteStream(destination);
    writer.on("error", reject);
    writer.on("finish", resolve);
    writer.end(buffer);
  });
  chunks.push({ index, path: filename, offset, bytes: buffer.byteLength, sha256: createHash("sha256").update(buffer).digest("hex") });
  offset += buffer.byteLength;
  index += 1;
}
const manifest = {
  schemaVersion: 2,
  version: "v142-catalog-million-v6",
  sqliteSchemaVersion: 1,
  rowCount: sourceManifest.rowCount,
  parameterRichCount: sourceManifest.tierCounts?.["parameter-rich"] ?? 0,
  installedBytes: sourceInfo.size,
  sha256: sourceManifest.sha256,
  chunkBytes: CHUNK_BYTES,
  chunks,
  baseUrl: "",
  runtimePolicy: "opfs-sqlite-wasm-dedicated-worker-direct-oo1",
  sourceManifest: "dist/catalog-v5/catalog-v5.manifest.json",
  provenance: sourceManifest.provenance ?? [],
};
await writeFile(path.join(outputRoot, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`catalog-million-v6: ${chunks.length} chunks, ${(sourceInfo.size / 1048576).toFixed(1)} MiB`);

import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const CHUNK_BYTES = 16 * 1024 * 1024;
const MAX_BYTES = 360 * 1024 * 1024;
const source = path.resolve("dist/catalog-v7/catalog-v7.sqlite");
const reportPath = path.resolve("dist/catalog-v7/catalog-v7.report.json");
const outputRoot = path.resolve("dist/catalog-million-v7");
await mkdir(outputRoot, { recursive: true });
const report = JSON.parse(await readFile(reportPath, "utf8"));
const sourceInfo = await stat(source);
if (report.passed !== true) throw new Error("catalog V7 data gates have not passed");
if (report.rowCount < 1_224_219 || report.parameterRichCount < 180_000 || report.priorityParameterRichCount < 15_000) throw new Error("catalog V7 counts are below release gates");
if (sourceInfo.size > MAX_BYTES) throw new Error(`catalog-million-v7 exceeds 360 MiB: ${sourceInfo.size}`);

const chunks = [];
let index = 0;
let offset = 0;
for await (const buffer of createReadStream(source, { highWaterMark: CHUNK_BYTES })) {
  const filename = `catalog-million-v7.part-${String(index).padStart(3, "0")}`;
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
  schemaVersion: 3,
  version: "v148-catalog-million-v7",
  sqliteSchemaVersion: 2,
  rowCount: report.rowCount,
  parameterRichCount: report.parameterRichCount,
  priorityParameterRichCount: report.priorityParameterRichCount,
  installedBytes: sourceInfo.size,
  sha256: createHash("sha256").update(await readFile(source)).digest("hex"),
  chunkBytes: CHUNK_BYTES,
  chunks,
  baseUrl: "",
  runtimePolicy: "opfs-sqlite-wasm-dedicated-worker-direct-oo1-runtime-offline",
  sourceManifest: "dist/catalog-v7/catalog-v7.report.json",
  provenance: ["Gaia DR3 astrophysical_parameters", "Gaia DR3 Hipparcos2 best-neighbour", "HYG v4.1", "IAU aliases", "NASA Exoplanet Archive"],
  snapshotId: report.snapshotId,
};
await writeFile(path.join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`${manifest.version}: ${chunks.length} chunks, ${(sourceInfo.size / 1048576).toFixed(1)} MiB, ${manifest.parameterRichCount} rich`);


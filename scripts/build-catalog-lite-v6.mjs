import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { createGzip } from "node:zlib";

const sourceRoot = path.resolve("public/data/stellar-search-v4");
const outputRoot = path.resolve("public/data/catalog-lite-v6");
const sourceManifest = JSON.parse(await readFile(path.join(sourceRoot, "manifest.json"), "utf8"));
await mkdir(outputRoot, { recursive: true });

async function sha256(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

async function compress(entry) {
  const source = path.join(sourceRoot, path.basename(entry.path));
  const filename = `${path.basename(entry.path)}.gz`;
  const destination = path.join(outputRoot, filename);
  await pipeline(createReadStream(source), createGzip({ level: 9 }), createWriteStream(destination));
  const info = await stat(destination);
  return { ...entry, path: `/data/catalog-lite-v6/${filename}`, sha256: await sha256(destination), compressedBytes: info.size };
}

const documents = [];
for (const entry of sourceManifest.documents) documents.push(await compress(entry));
const postings = [];
for (const entry of sourceManifest.postings) postings.push(await compress(entry));
const compressedBytes = [...documents, ...postings].reduce((sum, entry) => sum + entry.compressedBytes, 0);
if (compressedBytes > 45 * 1024 * 1024) throw new Error(`catalog-lite-v6 exceeds 45 MiB: ${compressedBytes}`);
const manifest = {
  ...sourceManifest,
  version: "v142-catalog-lite-v6",
  sourceVersion: sourceManifest.version,
  runtimePolicy: "gzip-json-alias-posting-document-shards",
  compression: "gzip-json",
  compressedBytes,
  documents,
  postings,
};
await writeFile(path.join(outputRoot, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`catalog-lite-v6: ${manifest.rowCount} rows, ${(compressedBytes / 1048576).toFixed(1)} MiB`);

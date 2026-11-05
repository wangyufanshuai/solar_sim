import { createHash } from "node:crypto";
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V592_GENERATED_AT ?? "2026-08-15T00:00:00Z";
const sourceManifestPath = "public/data/gaia-dr3-presentation-10000000-v9/manifest.json";
const sourceCatalogPath = "public/data/gaia-dr3-presentation-10000000-v9/catalog-v9.bin";
const liteCatalogPath = "public/data/celestial-art-v589/gaia-lite-46000-v589.bin";
const outputPath = "public/data/living-universe-v592/gaia-stratified-supplement-14000.bin";
const receiptPath = "docs/release/v592/gaia-stratified-supplement-receipt-v592.json";
const generatedModulePath = "app/data/livingStarfieldV592.generated.ts";
const recordBytes = 24;
const sourceRows = 10_000_000;
const supplementRows = 14_000;
const raBins = 48;
const sinDecBins = 16;
const binCount = raBins * sinDecBins;
const basePerBin = Math.floor(supplementRows / binCount);
const remainderBins = supplementRows % binCount;
const UINT32_SCALE = 0x1_0000_0000;
const UINT32_MAX = 0xffff_ffff;

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function atomicWrite(path, bytes) {
  const absolute = resolve(root, path);
  mkdirSync(dirname(absolute), { recursive: true });
  const temporary = `${absolute}.part`;
  writeFileSync(temporary, bytes);
  rmSync(absolute, { force: true });
  renameSync(temporary, absolute);
}
function targetForBin(index) {
  return basePerBin + (index < remainderBins ? 1 : 0);
}
function stableUnit(sourceId) {
  let value = BigInt.asUintN(64, sourceId ^ (sourceId >> 31n) ^ 0x9e3779b97f4a7c15n);
  value = BigInt.asUintN(64, value * 0xbf58476d1ce4e5b9n);
  value ^= value >> 27n;
  return Number(value & 0xffff_ffffn) / 0xffff_ffff;
}
function binFor(record) {
  const raDeg = record.readUInt32LE(8) / UINT32_SCALE * 360;
  const decDeg = record.readUInt32LE(12) / UINT32_MAX * 180 - 90;
  const raIndex = Math.min(raBins - 1, Math.floor(raDeg / 360 * raBins));
  const sinDec = Math.sin(decDeg * Math.PI / 180);
  const decIndex = Math.min(sinDecBins - 1, Math.max(0, Math.floor((sinDec + 1) * 0.5 * sinDecBins)));
  return decIndex * raBins + raIndex;
}
function scoreFor(record, sourceId) {
  const magnitude = record.readUInt16LE(16) / 1_000 - 5;
  return magnitude + stableUnit(sourceId) * 0.18;
}

const sourceManifestBytes = readFileSync(resolve(root, sourceManifestPath));
const sourceManifest = JSON.parse(sourceManifestBytes.toString("utf8"));
if (
  sourceManifest.archive?.byteLength !== sourceRows * recordBytes
  || !/^[a-f0-9]{64}$/.test(String(sourceManifest.archive?.sha256))
  || sourceManifest.counts?.presentation !== sourceRows
) throw new Error("v592-gaia-supplement-source-manifest");

const liteBytes = readFileSync(resolve(root, liteCatalogPath));
if (liteBytes.byteLength !== 46_000 * recordBytes) throw new Error("v592-gaia-supplement-lite-bytes");
const liteIds = new Set();
for (let offset = 0; offset < liteBytes.byteLength; offset += recordBytes) {
  liteIds.add(liteBytes.readBigUInt64LE(offset));
}

const sourceAbsolutePath = resolve(root, sourceCatalogPath);
if (!existsSync(sourceAbsolutePath) || statSync(sourceAbsolutePath).size !== sourceRows * recordBytes) {
  throw new Error("v592-gaia-supplement-source-bytes");
}
const bins = Array.from({ length: binCount }, () => []);
const sourceHash = createHash("sha256");
const descriptor = openSync(sourceAbsolutePath, "r");
const chunk = Buffer.allocUnsafe(recordBytes * 100_000);
let carried = Buffer.alloc(0);
let totalRead = 0;
try {
  while (true) {
    const bytesRead = readSync(descriptor, chunk, 0, chunk.byteLength, null);
    if (bytesRead === 0) break;
    totalRead += bytesRead;
    sourceHash.update(chunk.subarray(0, bytesRead));
    const payload = carried.byteLength > 0
      ? Buffer.concat([carried, chunk.subarray(0, bytesRead)])
      : chunk.subarray(0, bytesRead);
    const completeBytes = payload.byteLength - payload.byteLength % recordBytes;
    for (let offset = 0; offset < completeBytes; offset += recordBytes) {
      const record = payload.subarray(offset, offset + recordBytes);
      const sourceId = record.readBigUInt64LE(0);
      if (liteIds.has(sourceId)) continue;
      const bin = binFor(record);
      const entries = bins[bin];
      const target = targetForBin(bin);
      const score = scoreFor(record, sourceId);
      const candidate = { sourceId, score, bytes: Buffer.from(record) };
      if (entries.length < target) {
        entries.push(candidate);
        continue;
      }
      let worstIndex = 0;
      for (let index = 1; index < entries.length; index += 1) {
        const current = entries[index];
        const worst = entries[worstIndex];
        if (current.score > worst.score || (current.score === worst.score && current.sourceId > worst.sourceId)) worstIndex = index;
      }
      const worst = entries[worstIndex];
      if (score < worst.score || (score === worst.score && sourceId < worst.sourceId)) entries[worstIndex] = candidate;
    }
    carried = Buffer.from(payload.subarray(completeBytes));
  }
} finally {
  closeSync(descriptor);
}
if (carried.byteLength !== 0 || totalRead !== sourceRows * recordBytes) throw new Error("v592-gaia-supplement-record-alignment");
const observedSourceSha256 = sourceHash.digest("hex");
if (observedSourceSha256 !== sourceManifest.archive.sha256) throw new Error("v592-gaia-supplement-source-sha");
if (bins.some((entries, index) => entries.length !== targetForBin(index))) throw new Error("v592-gaia-supplement-bin-underflow");

const selected = bins.flat().sort((left, right) => left.sourceId < right.sourceId ? -1 : left.sourceId > right.sourceId ? 1 : 0);
if (selected.length !== supplementRows || new Set(selected.map((entry) => entry.sourceId)).size !== supplementRows) {
  throw new Error("v592-gaia-supplement-selection-count");
}
if (selected.some((entry) => liteIds.has(entry.sourceId))) throw new Error("v592-gaia-supplement-lite-overlap");
const output = Buffer.concat(selected.map((entry) => entry.bytes));
atomicWrite(outputPath, output);
const outputSha256 = sha256(output);

const unsignedReceipt = {
  version: "v592-gaia-stratified-supplement-receipt-v1",
  generatedAt,
  status: "generated-14000-stratified-no-lite-overlap",
  source: {
    manifestPath: sourceManifestPath,
    manifestBytes: sourceManifestBytes.byteLength,
    manifestFileSha256: sha256(sourceManifestBytes),
    manifestCanonicalSha256: sourceManifest.manifestSha256,
    catalogPath: sourceCatalogPath,
    catalogBytes: totalRead,
    catalogSha256: observedSourceSha256,
    gaiaIdentity: sourceManifest.source?.archive,
  },
  exclusion: {
    liteCatalogPath,
    liteCatalogBytes: liteBytes.byteLength,
    liteCatalogSha256: sha256(liteBytes),
    liteRecordCount: liteIds.size,
    overlapCount: 0,
  },
  selection: {
    algorithm: "48-ra-by-16-equal-sin-dec-bins-brightness-plus-source-id-jitter-v1",
    raBins,
    sinDecBins,
    binCount,
    basePerBin,
    remainderBins,
    selectedCount: selected.length,
    uniqueSourceIdCount: new Set(selected.map((entry) => entry.sourceId)).size,
    randomSampling: false,
    sourceIdOnlyTieBreak: true,
  },
  output: {
    path: outputPath,
    bytes: output.byteLength,
    sha256: outputSha256,
    recordBytes,
    recordCount: selected.length,
    format: "gaia-packed-24-byte-record-v9-compatible",
  },
  authority: {
    presentationOnly: true,
    measuredAuthorityGranted: false,
    scientificPayloadWriteback: false,
    sourceDownloadPerformed: false,
    denseOrGpuScientificComputePerformed: false,
  },
};
const receipt = { ...unsignedReceipt, receiptSha256: canonicalSha(unsignedReceipt) };
atomicWrite(receiptPath, Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`, "utf8"));
const generatedModule = `// Generated by scripts/build-v592-gaia-stratified-supplement.mjs. Do not edit.\n` +
  `export const GAIA_STRATIFIED_SUPPLEMENT_URL_V592 = "/data/living-universe-v592/gaia-stratified-supplement-14000.bin" as const;\n` +
  `export const GAIA_STRATIFIED_SUPPLEMENT_BYTES_V592 = ${output.byteLength} as const;\n` +
  `export const GAIA_STRATIFIED_SUPPLEMENT_RECORDS_V592 = ${selected.length} as const;\n` +
  `export const GAIA_STRATIFIED_SUPPLEMENT_SHA256_V592 = ${JSON.stringify(outputSha256)} as const;\n` +
  `export const GAIA_STRATIFIED_SUPPLEMENT_RECEIPT_SHA256_V592 = ${JSON.stringify(receipt.receiptSha256)} as const;\n`;
atomicWrite(generatedModulePath, Buffer.from(generatedModule, "utf8"));

console.log(JSON.stringify({
  status: receipt.status,
  sourceSha256: observedSourceSha256,
  outputSha256,
  outputBytes: output.byteLength,
  outputRecords: selected.length,
  binCount,
  liteOverlapCount: 0,
  receiptSha256: receipt.receiptSha256,
}, null, 2));

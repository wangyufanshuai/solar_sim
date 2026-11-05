import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CATALOG_SOURCE_INDEX_ENTRY_BYTES_V1,
  crc32CatalogPayloadV9,
  parseCatalogSourceDirectoryV1,
  parseCatalogTileIndexV9,
  parseCatalogTileManifestV9,
} from "./catalogTileV9";

const sha256 = (value: Buffer | string) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]))
    : value;

describe("generated v264 HEALPix catalog v9 wrapper", () => {
  const root = resolve(process.cwd(), "public/data/catalog-healpix-v9");
  const rawManifest = JSON.parse(readFileSync(resolve(root, "manifest.json"), "utf8")) as Record<string, unknown>;
  const manifest = parseCatalogTileManifestV9(rawManifest);

  it("matches every generated file SHA and canonical manifest SHA", () => {
    for (const asset of [manifest.index, manifest.sourceIndex.data, manifest.sourceIndex.directory]) {
      const path = resolve(process.cwd(), "public", asset.url);
      expect(statSync(path).size).toBe(asset.byteLength);
      expect(sha256(readFileSync(path))).toBe(asset.sha256);
    }
    const unsigned = { ...rawManifest };
    delete unsigned.manifestSha256;
    expect(sha256(JSON.stringify(canonicalize(unsigned)))).toBe(manifest.manifestSha256);
  });

  it("reconstructs all rows and verifies every non-empty tile CRC", () => {
    const archiveBytes = readFileSync(resolve(process.cwd(), "public", manifest.archive.url));
    const indexBytes = readFileSync(resolve(process.cwd(), "public", manifest.index.url));
    const archive = archiveBytes.buffer.slice(archiveBytes.byteOffset, archiveBytes.byteOffset + archiveBytes.byteLength);
    const index = indexBytes.buffer.slice(indexBytes.byteOffset, indexBytes.byteOffset + indexBytes.byteLength);
    const entries = parseCatalogTileIndexV9(index);
    expect(entries).toHaveLength(49_152);
    expect(entries.reduce((sum, entry) => sum + entry.rowCount, 0)).toBe(1_221_242);
    const checksumFailures: number[] = [];
    for (const entry of entries) {
      if (entry.byteLength === 0) {
        if (entry.crc32 !== 0) checksumFailures.push(entry.cell);
      } else {
        if (crc32CatalogPayloadV9(archive.slice(entry.archiveOffset, entry.archiveOffset + entry.byteLength)) !== entry.crc32) checksumFailures.push(entry.cell);
      }
    }
    expect(checksumFailures).toEqual([]);
  });

  it("keeps the source index globally sorted and page-directory bounded", () => {
    const dataBytes = readFileSync(resolve(process.cwd(), "public", manifest.sourceIndex.data.url));
    const directoryBytes = readFileSync(resolve(process.cwd(), "public", manifest.sourceIndex.directory.url));
    const data = new DataView(dataBytes.buffer, dataBytes.byteOffset, dataBytes.byteLength);
    const directory = parseCatalogSourceDirectoryV1(directoryBytes.buffer.slice(directoryBytes.byteOffset, directoryBytes.byteOffset + directoryBytes.byteLength));
    expect(dataBytes.byteLength / CATALOG_SOURCE_INDEX_ENTRY_BYTES_V1).toBe(manifest.sourceIndex.entryCount);
    expect(directory).toHaveLength(manifest.sourceIndex.directory.pageCount);
    let previous = BigInt(0);
    let sorted = true;
    let invalidCells = 0;
    for (let offset = 0; offset < data.byteLength; offset += CATALOG_SOURCE_INDEX_ENTRY_BYTES_V1) {
      const sourceId = data.getBigUint64(offset, true);
      if (offset > 0 && sourceId <= previous) sorted = false;
      previous = sourceId;
      if (data.getUint32(offset + 8, true) >= 49_152) invalidCells += 1;
    }
    expect(sorted).toBe(true);
    expect(invalidCells).toBe(0);
    expect(directory[0]?.firstSourceId).toBe(data.getBigUint64(0, true));
    expect(directory.at(-1)?.lastSourceId).toBe(data.getBigUint64(data.byteLength - CATALOG_SOURCE_INDEX_ENTRY_BYTES_V1, true));
  });
});

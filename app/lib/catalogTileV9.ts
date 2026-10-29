import { atlasPublicAssetUrl } from "./atlasDeliveryProfile";
import type { CatalogByteRangeV8, CatalogTileIndexEntryV8 } from "./catalogTileV8";

export const CATALOG_TILE_MANIFEST_V9_VERSION = "v264-healpix-stream-catalog-v9" as const;
export const CATALOG_TILE_MANIFEST_URL_V9 = atlasPublicAssetUrl("data/catalog-healpix-v9/manifest.json");
export const CATALOG_TILE_INDEX_ENTRY_BYTES_V9 = 32;
export const CATALOG_SOURCE_INDEX_ENTRY_BYTES_V1 = 16;
export const CATALOG_SOURCE_DIRECTORY_ENTRY_BYTES_V1 = 24;

export type CatalogTileIndexEntryV9 = CatalogTileIndexEntryV8 & { crc32: number };

export type CatalogSourceIndexV1 = {
  version: "catalog-source-index-v1";
  entryBytes: typeof CATALOG_SOURCE_INDEX_ENTRY_BYTES_V1;
  entryCount: number;
  pageEntries: number;
  data: { url: string; sha256: string; byteLength: number };
  directory: {
    url: string;
    sha256: string;
    byteLength: number;
    entryBytes: typeof CATALOG_SOURCE_DIRECTORY_ENTRY_BYTES_V1;
    pageCount: number;
  };
};

export type CatalogTileManifestV9 = {
  version: typeof CATALOG_TILE_MANIFEST_V9_VERSION;
  scheme: "NESTED";
  orders: readonly [3, 5, 6];
  generatedAt: string;
  sourceV8ManifestSha256: string;
  counts: { searchable: 1_224_219; renderable: 1_221_242; spatial3d: 758_955 };
  archive: {
    url: string;
    sha256: string;
    byteLength: number;
    headerBytes: number;
    recordBytes: 32;
    recordsOffset: number;
  };
  index: {
    url: string;
    sha256: string;
    byteLength: number;
    entryBytes: typeof CATALOG_TILE_INDEX_ENTRY_BYTES_V9;
    cellCount: 49_152;
    checksum: "crc32-per-tile";
  };
  sourceIndex: CatalogSourceIndexV1;
  cache: { memoryBytes: 67_108_864; persistentBytes: 134_217_728; maxConcurrentRanges: 4 };
  fallbacks: readonly [
    "data/catalog-healpix-v8/manifest.json",
    "data/gaia-dr3-nearby-46000-v255.json",
    "data/gaia-dr3-bright-5000.json",
  ];
  canonical: true;
  livePhysicsMutation: "not-applied";
  workerPhysicsMutation: "not-applied";
  manifestSha256: string;
};

export type CatalogSourceDirectoryEntryV1 = {
  firstSourceId: bigint;
  lastSourceId: bigint;
  byteOffset: number;
  entryCount: number;
};

export type CatalogSourceLocationV1 = {
  sourceId: string;
  cell: number;
  ordinal: number;
};

function objectValue(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
  return value as Record<string, unknown>;
}

function shaValue(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

export function parseCatalogTileManifestV9(value: unknown): CatalogTileManifestV9 {
  const root = objectValue(value, "Catalog v9 manifest");
  const counts = objectValue(root.counts, "Catalog v9 counts");
  const archive = objectValue(root.archive, "Catalog v9 archive");
  const index = objectValue(root.index, "Catalog v9 index");
  const sourceIndex = objectValue(root.sourceIndex, "Catalog v9 source index");
  const sourceData = objectValue(sourceIndex.data, "Catalog v9 source data");
  const sourceDirectory = objectValue(sourceIndex.directory, "Catalog v9 source directory");
  const cache = objectValue(root.cache, "Catalog v9 cache");
  if (
    root.version !== CATALOG_TILE_MANIFEST_V9_VERSION || root.scheme !== "NESTED" ||
    JSON.stringify(root.orders) !== JSON.stringify([3, 5, 6]) ||
    counts.searchable !== 1_224_219 || counts.renderable !== 1_221_242 || counts.spatial3d !== 758_955 ||
    archive.recordBytes !== 32 || index.entryBytes !== CATALOG_TILE_INDEX_ENTRY_BYTES_V9 ||
    index.cellCount !== 49_152 || index.checksum !== "crc32-per-tile" ||
    sourceIndex.version !== "catalog-source-index-v1" || sourceIndex.entryBytes !== CATALOG_SOURCE_INDEX_ENTRY_BYTES_V1 ||
    sourceDirectory.entryBytes !== CATALOG_SOURCE_DIRECTORY_ENTRY_BYTES_V1 ||
    cache.memoryBytes !== 67_108_864 || cache.persistentBytes !== 134_217_728 || cache.maxConcurrentRanges !== 4 ||
    root.canonical !== true || root.livePhysicsMutation !== "not-applied" || root.workerPhysicsMutation !== "not-applied"
  ) throw new Error("Catalog v9 manifest violates the streaming contract");
  for (const candidate of [root.sourceV8ManifestSha256, root.manifestSha256, archive.sha256, index.sha256, sourceData.sha256, sourceDirectory.sha256]) {
    if (!shaValue(candidate)) throw new Error("Catalog v9 manifest SHA provenance is incomplete");
  }
  for (const candidate of [archive.url, index.url, sourceData.url, sourceDirectory.url, root.generatedAt]) {
    if (typeof candidate !== "string" || candidate.length === 0) throw new Error("Catalog v9 manifest path provenance is incomplete");
  }
  return value as CatalogTileManifestV9;
}

export function parseCatalogTileIndexV9(buffer: ArrayBuffer): CatalogTileIndexEntryV9[] {
  if (buffer.byteLength % CATALOG_TILE_INDEX_ENTRY_BYTES_V9 !== 0) throw new Error("Catalog v9 tile index has a truncated entry");
  const view = new DataView(buffer);
  const entries: CatalogTileIndexEntryV9[] = [];
  for (let offset = 0; offset < buffer.byteLength; offset += CATALOG_TILE_INDEX_ENTRY_BYTES_V9) {
    entries.push({
      cell: view.getUint32(offset, true),
      archiveOffset: view.getUint32(offset + 4, true),
      byteLength: view.getUint32(offset + 8, true),
      rowCount: view.getUint32(offset + 12, true),
      parentOrder5Cell: view.getUint32(offset + 16, true),
      centerRaDeg: view.getFloat32(offset + 20, true),
      centerDecDeg: view.getFloat32(offset + 24, true),
      crc32: view.getUint32(offset + 28, true),
    });
  }
  return entries;
}

const CRC32_TABLE = new Uint32Array(256);
for (let index = 0; index < 256; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = (value & 1) !== 0 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  CRC32_TABLE[index] = value >>> 0;
}

export function crc32CatalogPayloadV9(buffer: ArrayBuffer): number {
  const bytes = new Uint8Array(buffer);
  let crc = 0xffff_ffff;
  for (const byte of bytes) crc = CRC32_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xffff_ffff) >>> 0;
}

export function verifyCatalogRangeV9(
  range: CatalogByteRangeV8,
  payload: ArrayBuffer,
  entries: ReadonlyMap<number, CatalogTileIndexEntryV9>,
): void {
  for (const cell of range.cells) {
    const entry = entries.get(cell);
    if (!entry) throw new Error(`Catalog v9 range references unknown cell ${cell}`);
    const relativeStart = entry.archiveOffset - range.start;
    const relativeEnd = relativeStart + entry.byteLength;
    if (relativeStart < 0 || relativeEnd > payload.byteLength) throw new Error(`Catalog v9 tile ${cell} lies outside its fetched range`);
    const actual = entry.byteLength === 0 ? 0 : crc32CatalogPayloadV9(payload.slice(relativeStart, relativeEnd));
    if (actual !== entry.crc32) throw new Error(`Catalog v9 tile checksum mismatch for cell ${cell}`);
  }
}

export function parseCatalogSourceDirectoryV1(buffer: ArrayBuffer): CatalogSourceDirectoryEntryV1[] {
  if (buffer.byteLength % CATALOG_SOURCE_DIRECTORY_ENTRY_BYTES_V1 !== 0) throw new Error("Catalog source directory is truncated");
  const view = new DataView(buffer);
  const entries: CatalogSourceDirectoryEntryV1[] = [];
  for (let offset = 0; offset < buffer.byteLength; offset += CATALOG_SOURCE_DIRECTORY_ENTRY_BYTES_V1) {
    entries.push({
      firstSourceId: view.getBigUint64(offset, true),
      lastSourceId: view.getBigUint64(offset + 8, true),
      byteOffset: view.getUint32(offset + 16, true),
      entryCount: view.getUint32(offset + 20, true),
    });
  }
  return entries;
}

export function selectCatalogSourcePageV1(
  directory: readonly CatalogSourceDirectoryEntryV1[],
  sourceId: string,
): CatalogSourceDirectoryEntryV1 | null {
  const target = BigInt(sourceId);
  let low = 0;
  let high = directory.length - 1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    const page = directory[middle]!;
    if (target < page.firstSourceId) high = middle - 1;
    else if (target > page.lastSourceId) low = middle + 1;
    else return page;
  }
  return null;
}

export function findCatalogSourceLocationV1(buffer: ArrayBuffer, sourceId: string): CatalogSourceLocationV1 | null {
  if (buffer.byteLength % CATALOG_SOURCE_INDEX_ENTRY_BYTES_V1 !== 0) throw new Error("Catalog source index page is truncated");
  const target = BigInt(sourceId);
  const view = new DataView(buffer);
  let low = 0;
  let high = buffer.byteLength / CATALOG_SOURCE_INDEX_ENTRY_BYTES_V1 - 1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    const offset = middle * CATALOG_SOURCE_INDEX_ENTRY_BYTES_V1;
    const candidate = view.getBigUint64(offset, true);
    if (target < candidate) high = middle - 1;
    else if (target > candidate) low = middle + 1;
    else return { sourceId, cell: view.getUint32(offset + 8, true), ordinal: view.getUint32(offset + 12, true) };
  }
  return null;
}

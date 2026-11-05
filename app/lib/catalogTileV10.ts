import { atlasPublicAssetUrl } from "./atlasDeliveryProfile";
import {
  CATALOG_TILE_RECORD_BYTES_V8,
  decodeCatalogTileRecordsV8,
  mergeCatalogTileRangesV8,
  type CatalogByteRangeV8,
  type CatalogStreamRecordV8,
  type CatalogTileIndexEntryV8,
} from "./catalogTileV8";
import type { CatalogSourceIndexV1, CatalogTileIndexEntryV9 } from "./catalogTileV9";

export const CATALOG_TILE_MANIFEST_V10_VERSION = "v264r2-healpix-stream-catalog-v10" as const;
export const CATALOG_TILE_MANIFEST_URL_V10 = atlasPublicAssetUrl("data/catalog-healpix-v10/manifest.json");
export const CATALOG_TILE_INDEX_ENTRY_BYTES_V10 = 20;
export const CATALOG_TILE_BALANCED_ARCHIVE_BUDGET_BYTES_V10 = 1_600_000;
export const CATALOG_TILE_COLD_TRANSFER_LIMIT_BYTES_V10 = 2.5 * 1024 * 1024;

export type CatalogTileIndexEntryV10 = CatalogTileIndexEntryV9;

export type CatalogRangeMergeBudgetV264R2 = {
  balancedArchiveBudgetBytes: typeof CATALOG_TILE_BALANCED_ARCHIVE_BUDGET_BYTES_V10;
  coldTransferLimitBytes: typeof CATALOG_TILE_COLD_TRANSFER_LIMIT_BYTES_V10;
  coldUpperBoundBytes: number;
};

export type CatalogMergedRangeTelemetryV264R2 = {
  selectedTileCount: number;
  originalRangeCount: number;
  mergedRangeCount: number;
  selectedBytes: number;
  gapBytes: number;
  transferredBytes: number;
  archiveBudgetBytes: number;
};

export type CatalogTileManifestV10 = {
  version: typeof CATALOG_TILE_MANIFEST_V10_VERSION;
  scheme: "NESTED";
  orders: readonly [3, 5, 6];
  generatedAt: string;
  sourceV8ManifestSha256: string;
  sourceV9ManifestSha256: string;
  sourceV9CanonicalSha256: string;
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
    byteLength: 983_040;
    entryBytes: typeof CATALOG_TILE_INDEX_ENTRY_BYTES_V10;
    cellCount: 49_152;
    checksum: "crc32-per-tile";
    encoding: "implicit-cell-parent-rowcount-v1";
  };
  sourceIndex: CatalogSourceIndexV1;
  cache: { memoryBytes: 67_108_864; persistentBytes: 134_217_728; maxConcurrentRanges: 4 };
  transfer: CatalogRangeMergeBudgetV264R2;
  fallbacks: readonly [
    "data/catalog-healpix-v9/manifest.json",
    "data/catalog-healpix-v8/manifest.json",
    "data/gaia-dr3-nearby-46000-v255.json",
    "data/gaia-dr3-bright-5000.json",
  ];
  canonical: true;
  livePhysicsMutation: "not-applied";
  workerPhysicsMutation: "not-applied";
  manifestSha256: string;
};

function objectValue(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
  return value as Record<string, unknown>;
}

function shaValue(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

export function parseCatalogTileManifestV10(value: unknown): CatalogTileManifestV10 {
  const root = objectValue(value, "Catalog v10 manifest");
  const counts = objectValue(root.counts, "Catalog v10 counts");
  const archive = objectValue(root.archive, "Catalog v10 archive");
  const index = objectValue(root.index, "Catalog v10 index");
  const sourceIndex = objectValue(root.sourceIndex, "Catalog v10 source index");
  const sourceData = objectValue(sourceIndex.data, "Catalog v10 source data");
  const sourceDirectory = objectValue(sourceIndex.directory, "Catalog v10 source directory");
  const cache = objectValue(root.cache, "Catalog v10 cache");
  const transfer = objectValue(root.transfer, "Catalog v10 transfer budget");
  if (
    root.version !== CATALOG_TILE_MANIFEST_V10_VERSION || root.scheme !== "NESTED" ||
    JSON.stringify(root.orders) !== JSON.stringify([3, 5, 6]) ||
    counts.searchable !== 1_224_219 || counts.renderable !== 1_221_242 || counts.spatial3d !== 758_955 ||
    archive.recordBytes !== CATALOG_TILE_RECORD_BYTES_V8 ||
    index.entryBytes !== CATALOG_TILE_INDEX_ENTRY_BYTES_V10 || index.byteLength !== 983_040 ||
    index.cellCount !== 49_152 || index.checksum !== "crc32-per-tile" ||
    index.encoding !== "implicit-cell-parent-rowcount-v1" ||
    sourceIndex.version !== "catalog-source-index-v1" || sourceIndex.entryBytes !== 16 ||
    sourceDirectory.entryBytes !== 24 ||
    cache.memoryBytes !== 67_108_864 || cache.persistentBytes !== 134_217_728 || cache.maxConcurrentRanges !== 4 ||
    transfer.balancedArchiveBudgetBytes !== CATALOG_TILE_BALANCED_ARCHIVE_BUDGET_BYTES_V10 ||
    transfer.coldTransferLimitBytes !== CATALOG_TILE_COLD_TRANSFER_LIMIT_BYTES_V10 ||
    !Number.isSafeInteger(transfer.coldUpperBoundBytes) || Number(transfer.coldUpperBoundBytes) > CATALOG_TILE_COLD_TRANSFER_LIMIT_BYTES_V10 ||
    root.canonical !== true || root.livePhysicsMutation !== "not-applied" || root.workerPhysicsMutation !== "not-applied"
  ) throw new Error("Catalog v10 manifest violates the compact streaming contract");
  for (const candidate of [
    root.sourceV8ManifestSha256,
    root.sourceV9ManifestSha256,
    root.sourceV9CanonicalSha256,
    root.manifestSha256,
    archive.sha256,
    index.sha256,
    sourceData.sha256,
    sourceDirectory.sha256,
  ]) {
    if (!shaValue(candidate)) throw new Error("Catalog v10 manifest SHA provenance is incomplete");
  }
  for (const candidate of [archive.url, index.url, sourceData.url, sourceDirectory.url, root.generatedAt]) {
    if (typeof candidate !== "string" || candidate.length === 0) throw new Error("Catalog v10 manifest path provenance is incomplete");
  }
  return value as CatalogTileManifestV10;
}

export function parseCatalogTileIndexV10(buffer: ArrayBuffer): CatalogTileIndexEntryV10[] {
  if (buffer.byteLength !== 49_152 * CATALOG_TILE_INDEX_ENTRY_BYTES_V10) {
    throw new Error("Catalog v10 tile index has an invalid compact length");
  }
  const view = new DataView(buffer);
  const entries: CatalogTileIndexEntryV10[] = [];
  for (let cell = 0, offset = 0; offset < buffer.byteLength; cell += 1, offset += CATALOG_TILE_INDEX_ENTRY_BYTES_V10) {
    const byteLength = view.getUint32(offset + 4, true);
    if (byteLength % CATALOG_TILE_RECORD_BYTES_V8 !== 0) throw new Error(`Catalog v10 tile ${cell} byte length is not record aligned`);
    const centerRaDeg = view.getFloat32(offset + 8, true);
    const centerDecDeg = view.getFloat32(offset + 12, true);
    if (!Number.isFinite(centerRaDeg) || !Number.isFinite(centerDecDeg)) throw new Error(`Catalog v10 tile ${cell} center is invalid`);
    entries.push({
      cell,
      archiveOffset: view.getUint32(offset, true),
      byteLength,
      rowCount: byteLength / CATALOG_TILE_RECORD_BYTES_V8,
      parentOrder5Cell: cell >>> 2,
      centerRaDeg,
      centerDecDeg,
      crc32: view.getUint32(offset + 16, true),
    });
  }
  return entries;
}

export function mergeCatalogTileRangesWithinBudgetV10(
  entries: readonly CatalogTileIndexEntryV8[],
  archiveBudgetBytes = CATALOG_TILE_BALANCED_ARCHIVE_BUDGET_BYTES_V10,
): { ranges: CatalogByteRangeV8[]; telemetry: CatalogMergedRangeTelemetryV264R2 } {
  if (!(Number.isSafeInteger(archiveBudgetBytes) && archiveBudgetBytes > 0)) throw new RangeError("Catalog v10 archive budget must be positive");
  const cells = new Set<number>();
  for (const entry of entries) {
    if (cells.has(entry.cell)) throw new Error(`Catalog v10 merge received duplicate cell ${entry.cell}`);
    cells.add(entry.cell);
  }
  const orderedEntries = entries.filter((entry) => entry.byteLength > 0)
    .slice()
    .sort((left, right) => left.archiveOffset - right.archiveOffset || left.cell - right.cell);
  for (let index = 1; index < orderedEntries.length; index += 1) {
    const previous = orderedEntries[index - 1]!;
    const current = orderedEntries[index]!;
    if (current.archiveOffset <= previous.archiveOffset + previous.byteLength - 1) {
      throw new Error(`Catalog v10 merge received overlapping cells ${previous.cell} and ${current.cell}`);
    }
  }
  const original = mergeCatalogTileRangesV8(entries, 0);
  const selectedBytes = original.reduce((sum, range) => sum + range.end - range.start + 1, 0);
  const effectiveBudget = Math.max(selectedBytes, archiveBudgetBytes);
  if (original.length < 2 || selectedBytes >= effectiveBudget) {
    return {
      ranges: original,
      telemetry: {
        selectedTileCount: entries.length,
        originalRangeCount: original.length,
        mergedRangeCount: original.length,
        selectedBytes,
        gapBytes: 0,
        transferredBytes: selectedBytes,
        archiveBudgetBytes: effectiveBudget,
      },
    };
  }

  const gaps = original.slice(1).map((range, index) => ({
    rightIndex: index + 1,
    bytes: range.start - original[index]!.end - 1,
    leftOffset: original[index]!.start,
    firstCell: range.cells[0] ?? Number.MAX_SAFE_INTEGER,
  })).sort((left, right) =>
    left.bytes - right.bytes || left.leftOffset - right.leftOffset || left.firstCell - right.firstCell,
  );
  const selectedGaps = new Set<number>();
  let transferredBytes = selectedBytes;
  for (const gap of gaps) {
    if (gap.bytes < 0) throw new Error("Catalog v10 ranges overlap before budget merging");
    if (transferredBytes + gap.bytes > effectiveBudget) continue;
    selectedGaps.add(gap.rightIndex);
    transferredBytes += gap.bytes;
  }

  const ranges: CatalogByteRangeV8[] = [];
  for (let index = 0; index < original.length; index += 1) {
    const range = original[index]!;
    const previous = ranges.at(-1);
    if (previous && selectedGaps.has(index)) {
      ranges[ranges.length - 1] = {
        start: previous.start,
        end: range.end,
        cells: [...previous.cells, ...range.cells],
      };
    } else {
      ranges.push({ start: range.start, end: range.end, cells: [...range.cells] });
    }
  }
  const actualBytes = ranges.reduce((sum, range) => sum + range.end - range.start + 1, 0);
  if (actualBytes !== transferredBytes || actualBytes > effectiveBudget) throw new Error("Catalog v10 range budget accounting drifted");
  return {
    ranges,
    telemetry: {
      selectedTileCount: entries.length,
      originalRangeCount: original.length,
      mergedRangeCount: ranges.length,
      selectedBytes,
      gapBytes: actualBytes - selectedBytes,
      transferredBytes: actualBytes,
      archiveBudgetBytes: effectiveBudget,
    },
  };
}

export function decodeCatalogSelectedRangesV10(
  ranges: readonly CatalogByteRangeV8[],
  buffers: readonly ArrayBuffer[],
  entriesByCell: ReadonlyMap<number, CatalogTileIndexEntryV10>,
): CatalogStreamRecordV8[] {
  if (ranges.length !== buffers.length) throw new Error("Catalog v10 range and payload counts differ");
  const records: CatalogStreamRecordV8[] = [];
  for (let rangeIndex = 0; rangeIndex < ranges.length; rangeIndex += 1) {
    const range = ranges[rangeIndex]!;
    const payload = buffers[rangeIndex]!;
    if (payload.byteLength !== range.end - range.start + 1) throw new Error("Catalog v10 merged payload length mismatch");
    for (const cell of range.cells) {
      const entry = entriesByCell.get(cell);
      if (!entry) throw new Error(`Catalog v10 merged range references unknown cell ${cell}`);
      const relativeStart = entry.archiveOffset - range.start;
      const relativeEnd = relativeStart + entry.byteLength;
      if (relativeStart < 0 || relativeEnd > payload.byteLength) throw new Error(`Catalog v10 tile ${cell} lies outside its merged payload`);
      records.push(...decodeCatalogTileRecordsV8(payload.slice(relativeStart, relativeEnd)));
    }
  }
  return records;
}

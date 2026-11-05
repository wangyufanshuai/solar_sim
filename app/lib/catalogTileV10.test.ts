import { describe, expect, it } from "vitest";
import {
  CATALOG_TILE_INDEX_ENTRY_BYTES_V10,
  decodeCatalogSelectedRangesV10,
  mergeCatalogTileRangesWithinBudgetV10,
  parseCatalogTileIndexV10,
  type CatalogTileIndexEntryV10,
} from "./catalogTileV10";

function entry(cell: number, archiveOffset: number, byteLength = 32): CatalogTileIndexEntryV10 {
  return {
    cell,
    archiveOffset,
    byteLength,
    rowCount: byteLength / 32,
    parentOrder5Cell: cell >>> 2,
    centerRaDeg: cell,
    centerDecDeg: 0,
    crc32: 0,
  };
}

describe("v264.2 compact catalog streaming", () => {
  it("reconstructs implicit cell, parent and row count from the 20-byte index", () => {
    const buffer = new ArrayBuffer(49_152 * CATALOG_TILE_INDEX_ENTRY_BYTES_V10);
    const view = new DataView(buffer);
    const offset = 7 * CATALOG_TILE_INDEX_ENTRY_BYTES_V10;
    view.setUint32(offset, 4_096, true);
    view.setUint32(offset + 4, 64, true);
    view.setFloat32(offset + 8, 12.5, true);
    view.setFloat32(offset + 12, -6.25, true);
    view.setUint32(offset + 16, 123, true);
    expect(parseCatalogTileIndexV10(buffer)[7]).toEqual({
      cell: 7,
      archiveOffset: 4_096,
      byteLength: 64,
      rowCount: 2,
      parentOrder5Cell: 1,
      centerRaDeg: 12.5,
      centerDecDeg: -6.25,
      crc32: 123,
    });
  });

  it("merges the smallest deterministic gaps without exceeding the archive budget", () => {
    const result = mergeCatalogTileRangesWithinBudgetV10([
      entry(0, 0),
      entry(1, 64),
      entry(2, 1_000),
    ], 128);
    expect(result.ranges).toEqual([
      { start: 0, end: 95, cells: [0, 1] },
      { start: 1_000, end: 1_031, cells: [2] },
    ]);
    expect(result.telemetry).toMatchObject({
      originalRangeCount: 3,
      mergedRangeCount: 2,
      selectedBytes: 96,
      gapBytes: 32,
      transferredBytes: 128,
      archiveBudgetBytes: 128,
    });
    const dense = mergeCatalogTileRangesWithinBudgetV10([entry(0, 0), entry(2, 64)], 32);
    expect(dense.telemetry).toMatchObject({ selectedBytes: 64, gapBytes: 0, archiveBudgetBytes: 64 });
    expect(mergeCatalogTileRangesWithinBudgetV10([entry(2, 1_000), entry(0, 0), entry(1, 64)], 128)).toEqual(result);
    expect(() => mergeCatalogTileRangesWithinBudgetV10([entry(0, 0), entry(0, 64)], 128)).toThrow(/duplicate cell/);
    expect(() => mergeCatalogTileRangesWithinBudgetV10([entry(0, 0, 64), entry(1, 32, 32)], 128)).toThrow(/overlapping cells/);
  });

  it("decodes selected tile segments while ignoring unselected gap records", () => {
    const buffer = new ArrayBuffer(96);
    const view = new DataView(buffer);
    for (let index = 0; index < 3; index += 1) {
      const offset = index * 32;
      view.setUint32(offset, index + 10, true);
      view.setBigUint64(offset + 4, BigInt(index + 100), true);
      view.setUint32(offset + 12, index, true);
      view.setUint32(offset + 16, index, true);
      view.setUint16(offset + 20, 5_000, true);
      view.setInt16(offset + 22, 500, true);
      view.setFloat32(offset + 24, 1, true);
    }
    const entries = new Map<number, CatalogTileIndexEntryV10>([
      [0, entry(0, 0)],
      [1, entry(1, 32)],
      [2, entry(2, 64)],
    ]);
    const records = decodeCatalogSelectedRangesV10(
      [{ start: 0, end: 95, cells: [0, 2] }],
      [buffer],
      entries,
    );
    expect(records.map((record) => record.sourceId)).toEqual(["100", "102"]);
    view.setBigUint64(32 + 4, BigInt(999), true);
    expect(decodeCatalogSelectedRangesV10(
      [{ start: 0, end: 95, cells: [0, 2] }],
      [buffer],
      entries,
    ).map((record) => record.sourceId)).toEqual(["100", "102"]);
  });
});

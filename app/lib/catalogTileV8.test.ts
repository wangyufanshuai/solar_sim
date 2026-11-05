import { describe, expect, it } from "vitest";
import {
  CATALOG_TILE_INDEX_ENTRY_BYTES_V8,
  CatalogTileLruCacheV8,
  decodeCatalogTileRecordsV8,
  healpixNestedCellFromRaDec,
  mergeCatalogTileRangesV8,
  parseCatalogTileIndexV8,
  selectCatalogTilesForConeV8,
  type CatalogTileIndexEntryV8,
} from "./catalogTileV8";

function tile(cell: number, archiveOffset: number, rowCount: number, ra = 0, dec = 0): CatalogTileIndexEntryV8 {
  return {
    cell,
    archiveOffset,
    byteLength: rowCount * 32,
    rowCount,
    parentOrder5Cell: Math.floor(cell / 4),
    centerRaDeg: ra,
    centerDecDeg: dec,
  };
}

describe("v257 HEALPix streaming catalog contract", () => {
  it("maps coordinates into deterministic NESTED cells", () => {
    expect(healpixNestedCellFromRaDec(0, 0, 0)).toBe(4);
    expect(healpixNestedCellFromRaDec(3, 12.34, 0)).toBe(281);
    expect(healpixNestedCellFromRaDec(6, 123.4, -45.6)).toBe(39_219);
    expect(healpixNestedCellFromRaDec(6, 483.4, -45.6)).toBe(39_219);
    expect(() => healpixNestedCellFromRaDec(14, 0, 0)).toThrow(RangeError);
  });

  it("decodes fixed index and record layouts without losing a 64-bit source id", () => {
    const indexBuffer = new ArrayBuffer(CATALOG_TILE_INDEX_ENTRY_BYTES_V8);
    const indexView = new DataView(indexBuffer);
    indexView.setUint32(0, 7, true);
    indexView.setUint32(4, 1024, true);
    indexView.setUint32(8, 32, true);
    indexView.setUint32(12, 1, true);
    indexView.setUint32(16, 1, true);
    indexView.setFloat32(20, 12.5, true);
    indexView.setFloat32(24, -6.25, true);
    expect(parseCatalogTileIndexV8(indexBuffer)).toEqual([
      tile(7, 1024, 1, 12.5, -6.25),
    ]);

    const recordBuffer = new ArrayBuffer(32);
    const recordView = new DataView(recordBuffer);
    recordView.setUint32(0, 42, true);
    recordView.setBigUint64(4, BigInt("6014985460004291456"), true);
    recordView.setUint32(12, 0x8000_0000, true);
    recordView.setUint32(16, 0x8000_0000, true);
    recordView.setUint16(20, 9_250, true);
    recordView.setInt16(22, 1_420, true);
    recordView.setFloat32(24, 7.8, true);
    recordView.setUint16(28, 3, true);
    expect(decodeCatalogTileRecordsV8(recordBuffer)[0]).toMatchObject({
      rowId: 42,
      sourceId: "6014985460004291456",
      raDeg: 180,
      magG: 4.25,
      colorBpRp: 1.42,
      flags: 3,
    });
  });

  it("selects cone tiles by angular distance and merges adjacent ranges", () => {
    const entries = [tile(0, 100, 2, 0, 0), tile(1, 164, 2, 1, 0), tile(2, 400, 2, 180, 0)];
    expect(selectCatalogTilesForConeV8(entries, 0, 0, 4, 3).map(({ cell }) => cell)).toEqual([0, 1]);
    expect(mergeCatalogTileRangesV8(entries.slice(0, 2))).toEqual([
      { start: 100, end: 227, cells: [0, 1] },
    ]);
  });

  it("evicts least-recently-used payloads under the byte cap", () => {
    const cache = new CatalogTileLruCacheV8<ArrayBuffer>(8);
    cache.set("a", new ArrayBuffer(4));
    cache.set("b", new ArrayBuffer(4));
    expect(cache.get("a")?.byteLength).toBe(4);
    cache.set("c", new ArrayBuffer(4));
    expect(cache.get("b")).toBeUndefined();
    expect(cache.bytes).toBe(8);
  });
});

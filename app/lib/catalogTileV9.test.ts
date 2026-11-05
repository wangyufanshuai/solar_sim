import { describe, expect, it } from "vitest";
import {
  CATALOG_SOURCE_DIRECTORY_ENTRY_BYTES_V1,
  CATALOG_SOURCE_INDEX_ENTRY_BYTES_V1,
  CATALOG_TILE_INDEX_ENTRY_BYTES_V9,
  crc32CatalogPayloadV9,
  findCatalogSourceLocationV1,
  parseCatalogSourceDirectoryV1,
  parseCatalogTileIndexV9,
  selectCatalogSourcePageV1,
  verifyCatalogRangeV9,
} from "./catalogTileV9";

describe("v264 HEALPix v9 streaming primitives", () => {
  it("parses the checksummed tile index and rejects corrupt range payloads", () => {
    const payload = new Uint8Array([1, 2, 3, 4]).buffer;
    const index = new ArrayBuffer(CATALOG_TILE_INDEX_ENTRY_BYTES_V9);
    const view = new DataView(index);
    view.setUint32(0, 7, true);
    view.setUint32(4, 100, true);
    view.setUint32(8, 4, true);
    view.setUint32(12, 1, true);
    view.setUint32(16, 1, true);
    view.setFloat32(20, 12.5, true);
    view.setFloat32(24, -6.25, true);
    view.setUint32(28, crc32CatalogPayloadV9(payload), true);
    const entry = parseCatalogTileIndexV9(index)[0]!;
    const entries = new Map([[entry.cell, entry]]);
    expect(() => verifyCatalogRangeV9({ start: 100, end: 103, cells: [7] }, payload, entries)).not.toThrow();
    expect(() => verifyCatalogRangeV9({ start: 100, end: 103, cells: [7] }, new Uint8Array([1, 2, 3, 5]).buffer, entries)).toThrow(/checksum mismatch/);
  });

  it("selects one source-index page and resolves a 64-bit source id", () => {
    const directory = new ArrayBuffer(CATALOG_SOURCE_DIRECTORY_ENTRY_BYTES_V1);
    const directoryView = new DataView(directory);
    directoryView.setBigUint64(0, BigInt(100), true);
    directoryView.setBigUint64(8, BigInt(200), true);
    directoryView.setUint32(16, 4096, true);
    directoryView.setUint32(20, 2, true);
    const page = parseCatalogSourceDirectoryV1(directory);
    expect(selectCatalogSourcePageV1(page, "150")).toMatchObject({ byteOffset: 4096, entryCount: 2 });
    expect(selectCatalogSourcePageV1(page, "99")).toBeNull();

    const sourceIndex = new ArrayBuffer(CATALOG_SOURCE_INDEX_ENTRY_BYTES_V1 * 2);
    const sourceView = new DataView(sourceIndex);
    sourceView.setBigUint64(0, BigInt(120), true);
    sourceView.setUint32(8, 9, true);
    sourceView.setUint32(12, 2, true);
    sourceView.setBigUint64(16, BigInt(180), true);
    sourceView.setUint32(24, 11, true);
    sourceView.setUint32(28, 7, true);
    expect(findCatalogSourceLocationV1(sourceIndex, "180")).toEqual({ sourceId: "180", cell: 11, ordinal: 7 });
    expect(findCatalogSourceLocationV1(sourceIndex, "181")).toBeNull();
  });
});

import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  parseCatalogTileIndexV8,
  parseCatalogTileManifestV8,
} from "./catalogTileV8";

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

describe("generated v257 HEALPix catalog", () => {
  const root = resolve(process.cwd(), "public/data/catalog-healpix-v8");
  const manifest = parseCatalogTileManifestV8(
    JSON.parse(readFileSync(resolve(root, "manifest.json"), "utf8")),
  );

  it("matches the frozen source/count/provenance contract", () => {
    expect(manifest.source).toEqual({
      path: "dist/catalog-v7/catalog-v7.sqlite",
      sha256: "cf121d7ae5179996fb080d54f18e087f798e9e196c472238d23d1d3469f3ab17",
      rowCount: 1_224_219,
    });
    expect(manifest.counts).toEqual({
      searchable: 1_224_219,
      renderable: 1_221_242,
      spatial3d: 758_955,
    });
  });

  it("reconstructs every renderable row from the fixed tile index", () => {
    const indexPath = resolve(root, "catalog-v8.index.bin");
    const archivePath = resolve(root, "catalog-v8.bin");
    const indexBuffer = readFileSync(indexPath);
    const entries = parseCatalogTileIndexV8(
      indexBuffer.buffer.slice(indexBuffer.byteOffset, indexBuffer.byteOffset + indexBuffer.byteLength),
    );
    expect(entries).toHaveLength(49_152);
    expect(entries.reduce((sum, entry) => sum + entry.rowCount, 0)).toBe(1_221_242);
    expect(entries.every((entry, cell) => entry.cell === cell && entry.parentOrder5Cell === (cell >> 2))).toBe(true);
    expect(statSync(indexPath).size).toBe(manifest.index.byteLength);
    expect(statSync(archivePath).size).toBe(manifest.archive.byteLength);
    expect(sha256(indexPath)).toBe(manifest.index.sha256);
    expect(sha256(archivePath)).toBe(manifest.archive.sha256);
  });
});

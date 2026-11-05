import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseCatalogTileIndexV9 } from "./catalogTileV9";
import {
  CATALOG_TILE_COLD_TRANSFER_LIMIT_BYTES_V10,
  parseCatalogTileIndexV10,
  parseCatalogTileManifestV10,
} from "./catalogTileV10";

const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]))
    : value;
const sha256 = (value: Buffer | string) => createHash("sha256").update(value).digest("hex");

describe("v264.2 generated compact catalog", () => {
  it("reconstructs every historical v9 tile field exactly and locks canonical provenance", async () => {
    const root = resolve(process.cwd(), "public/data");
    const [manifestText, compactBuffer, v9Buffer] = await Promise.all([
      readFile(resolve(root, "catalog-healpix-v10/manifest.json"), "utf8"),
      readFile(resolve(root, "catalog-healpix-v10/catalog-v10.index.bin")),
      readFile(resolve(root, "catalog-healpix-v9/catalog-v9.index.bin")),
    ]);
    const raw = JSON.parse(manifestText) as Record<string, unknown>;
    const manifestSha256 = String(raw.manifestSha256);
    delete raw.manifestSha256;
    const canonicalSha256 = createHash("sha256").update(JSON.stringify(canonicalize(raw))).digest("hex");
    expect(canonicalSha256).toBe(manifestSha256);
    const manifest = parseCatalogTileManifestV10(JSON.parse(manifestText));
    expect(manifest.sourceV9CanonicalSha256).toBe("68ea2f7972213bd420ffe9b85f6b02a3be977c58e3f3094d57d3796fbd45f421");
    expect(manifest.transfer.coldUpperBoundBytes).toBeLessThanOrEqual(CATALOG_TILE_COLD_TRANSFER_LIMIT_BYTES_V10);
    expect(manifest.transfer.coldUpperBoundBytes).toBe(
      Buffer.byteLength(manifestText) +
      manifest.index.byteLength +
      manifest.sourceIndex.directory.byteLength +
      manifest.transfer.balancedArchiveBudgetBytes,
    );
    const compact = parseCatalogTileIndexV10(compactBuffer.buffer.slice(compactBuffer.byteOffset, compactBuffer.byteOffset + compactBuffer.byteLength));
    const historical = parseCatalogTileIndexV9(v9Buffer.buffer.slice(v9Buffer.byteOffset, v9Buffer.byteOffset + v9Buffer.byteLength));
    expect(compact).toEqual(historical);
    expect(sha256(compactBuffer)).toBe(manifest.index.sha256);
  });

  it("locks every reused source-index row to the immutable archive record", async () => {
    const root = resolve(process.cwd(), "public/data");
    const [manifestText, compactBuffer, sourceIndex, sourceDirectory, archive, v9ManifestText] = await Promise.all([
      readFile(resolve(root, "catalog-healpix-v10/manifest.json"), "utf8"),
      readFile(resolve(root, "catalog-healpix-v10/catalog-v10.index.bin")),
      readFile(resolve(root, "catalog-healpix-v9/catalog-v9.source-index.bin")),
      readFile(resolve(root, "catalog-healpix-v9/catalog-v9.source-directory.bin")),
      readFile(resolve(root, "catalog-healpix-v8/catalog-v8.bin")),
      readFile(resolve(root, "catalog-healpix-v9/manifest.json"), "utf8"),
    ]);
    const manifest = parseCatalogTileManifestV10(JSON.parse(manifestText));
    expect(sha256(v9ManifestText)).toBe(manifest.sourceV9ManifestSha256);
    expect(sha256(archive)).toBe(manifest.archive.sha256);
    expect(sha256(sourceIndex)).toBe(manifest.sourceIndex.data.sha256);
    expect(sha256(sourceDirectory)).toBe(manifest.sourceIndex.directory.sha256);
    const compact = parseCatalogTileIndexV10(compactBuffer.buffer.slice(compactBuffer.byteOffset, compactBuffer.byteOffset + compactBuffer.byteLength));
    const sourceView = new DataView(sourceIndex.buffer, sourceIndex.byteOffset, sourceIndex.byteLength);
    const archiveView = new DataView(archive.buffer, archive.byteOffset, archive.byteLength);
    expect(sourceIndex.byteLength / 16).toBe(manifest.sourceIndex.entryCount);
    for (let offset = 0; offset < sourceIndex.byteLength; offset += 16) {
      const sourceId = sourceView.getBigUint64(offset, true);
      const cell = sourceView.getUint32(offset + 8, true);
      const ordinal = sourceView.getUint32(offset + 12, true);
      const tile = compact[cell];
      if (!tile) throw new Error(`source index cell ${cell} is outside v10`);
      if (ordinal >= tile.rowCount) throw new Error(`source index ordinal ${ordinal} is outside cell ${cell}`);
      if (archiveView.getBigUint64(tile.archiveOffset + ordinal * 32 + 4, true) !== sourceId) {
        throw new Error(`source index ID drifted at byte ${offset}`);
      }
    }
  });
});

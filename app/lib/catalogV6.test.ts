import { describe, expect, it } from "vitest";
import { CATALOG_MILLION_V6_VERSION, validateWebCatalogPackManifest, type WebCatalogPackManifestV2 } from "./catalogV6";

describe("v142 optional million-star web pack", () => {
  it("accepts contiguous 16 MiB chunks and rejects oversized chunks", () => {
    const manifest: WebCatalogPackManifestV2 = {
      schemaVersion: 2,
      version: CATALOG_MILLION_V6_VERSION,
      sqliteSchemaVersion: 1,
      rowCount: 1_224_219,
      parameterRichCount: 180_000,
      installedBytes: 24,
      sha256: "a".repeat(64),
      chunkBytes: 16,
      chunks: [
        { index: 0, path: "part-0", offset: 0, bytes: 16, sha256: "b".repeat(64) },
        { index: 1, path: "part-1", offset: 16, bytes: 8, sha256: "c".repeat(64) },
      ],
      baseUrl: "https://example.invalid/catalog/",
      runtimePolicy: "opfs-sqlite-wasm-dedicated-worker-direct-oo1",
      sourceManifest: "catalog-v5.manifest.json",
      provenance: ["Gaia DR3"],
    };
    expect(validateWebCatalogPackManifest(manifest)).toEqual([]);
    expect(validateWebCatalogPackManifest({ ...manifest, chunkBytes: 17 * 1024 * 1024 })).toContain("chunk-over-16-mib");
  });
});

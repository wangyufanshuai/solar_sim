import { describe, expect, it } from "vitest";
import {
  decodeGaiaPresentationRecordsV9,
  parseGaiaPresentationDirectoryV9,
  parseGaiaPresentationLeafPageV9,
  parseGaiaPresentationTileManifestV9,
} from "./gaiaPresentationCatalogV9";

const sha = "a".repeat(64);
const artifact = (url: string, byteLength: number) => ({ url, byteLength, sha256: sha });

describe("v265 Gaia 10m presentation contract", () => {
  it("parses the exact standalone-only manifest", () => {
    expect(parseGaiaPresentationTileManifestV9({
      version: "v265-gaia-dr3-presentation-10000000-v9",
      id: "gaia-dr3-presentation-10000000-v9",
      scheme: "NESTED",
      orders: [3, 6, 8],
      generatedAt: "2026-07-20T00:00:00Z",
      source: {
        archive: "Gaia DR3 gaiadr3.gaia_source",
        endpoint: "https://gea.esac.esa.int/tap-server/tap/sync",
        randomIndexStart: 0,
        randomIndexMaximumExclusive: 10_200_000,
        shardMaximumRows: 100_000,
        shardCount: 101,
        provenanceSha256: sha,
      },
      counts: { presentation: 10_000_000, excludedBright: 42, rejectedInvalid: 3, duplicateSourceIds: 0 },
      archive: { ...artifact("data/gaia-dr3-presentation-10000000-v9/catalog-v9.bin", 240_000_000), recordBytes: 24, sort: "healpix-order8,g-quantized,source-id" },
      aggregateOrder3: { ...artifact("data/gaia-dr3-presentation-10000000-v9/order3.bin", 18_432), entryBytes: 24, cellCount: 768 },
      directoryOrder6: { ...artifact("data/gaia-dr3-presentation-10000000-v9/order6.directory.bin", 1_376_256), entryBytes: 28, cellCount: 49_152 },
      leafIndexOrder8: { ...artifact("data/gaia-dr3-presentation-10000000-v9/order8.index.bin", 12_582_912), entryBytes: 16, cellCount: 786_432, pageBytes: 256 },
      sourceIndex: {
        data: { ...artifact("data/gaia-dr3-presentation-10000000-v9/source.index.bin", 160_000_000), entryBytes: 16, entryCount: 10_000_000 },
        directory: { ...artifact("data/gaia-dr3-presentation-10000000-v9/source.directory.bin", 58_608), entryBytes: 24, pageEntries: 4096 },
      },
      runtime: { standaloneIntentRequired: true, liteIncluded: false, maxConcurrentRanges: 4, fallback: ["catalog-v10-1221242", "gaia-v255-46000", "gaia-legacy-5000"] },
      canonical: true,
      presentationOnly: true,
      surveyCompletenessClaim: "not-applied",
      livePhysicsMutation: "not-applied",
      workerPhysicsMutation: "not-applied",
      manifestSha256: sha,
    }).counts.presentation).toBe(10_000_000);
  });

  it("decodes the frozen 24-byte record", () => {
    const buffer = new ArrayBuffer(24);
    const view = new DataView(buffer);
    view.setBigUint64(0, BigInt(42), true);
    view.setUint32(8, 0x8000_0000, true);
    view.setUint32(12, 0x8000_0000, true);
    view.setUint16(16, 10_000, true);
    view.setInt16(18, -0x8000, true);
    view.setFloat32(20, Number.NaN, true);
    expect(decodeGaiaPresentationRecordsV9(buffer)[0]).toMatchObject({
      sourceId: "42",
      raDeg: 180,
      magG: 5,
      colorBpRp: null,
      parallaxMas: null,
    });
  });

  it("parses deterministic order-6 and order-8 pages", () => {
    const directory = new ArrayBuffer(49_152 * 28);
    const directoryView = new DataView(directory);
    directoryView.setUint32(0, 256, true);
    directoryView.setUint32(4, 256, true);
    directoryView.setFloat32(16, 12.5, true);
    directoryView.setFloat32(20, -30.25, true);
    directoryView.setUint16(24, 1, true);
    expect(parseGaiaPresentationDirectoryV9(directory)[0]).toMatchObject({
      leafPageOffset: 256,
      centerRaDeg: 12.5,
      centerDecDeg: -30.25,
      nonEmptyChildMask: 1,
    });
    const leaf = new ArrayBuffer(256);
    const leafView = new DataView(leaf);
    leafView.setUint32(0, 48, true);
    leafView.setUint32(4, 72, true);
    leafView.setUint32(8, 123, true);
    leafView.setUint32(12, 3, true);
    expect(parseGaiaPresentationLeafPageV9(2, leaf)[0]).toEqual({
      cell: 32,
      archiveOffset: 48,
      byteLength: 72,
      crc32: 123,
      rowCount: 3,
    });
  });
});

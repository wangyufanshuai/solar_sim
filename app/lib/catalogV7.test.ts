import { describe, expect, it } from "vitest";
import { inferCatalogV7Tier, validateStellarParameterInterval, validateWebCatalogPackManifestV3, type StellarAstrophysicalParametersV2, type WebCatalogPackManifestV3 } from "./catalogV7";

const interval = (value: number | null, lower: number | null = null, upper: number | null = null) => ({ value, lower, upper, unit: "test" });
const rich: StellarAstrophysicalParametersV2 = {
  sourceId: "1",
  teffK: interval(5772, 5700, 5850),
  loggDex: interval(4.44, 4.3, 4.6),
  metallicityDex: interval(0),
  distancePc: interval(10),
  extinctionMag: interval(0.01),
  radiusSolar: interval(1, 0.9, 1.1),
  luminositySolar: interval(1),
  massSolar: interval(1),
  ageGyr: interval(4.6),
  flagsFlame: "00",
  snapshotId: "gaia-dr3-ap-v2",
  provenance: "Gaia DR3 astrophysical_parameters",
};

describe("v148 Gaia astrophysical catalog V7", () => {
  it("requires Teff, logg and radius for parameter-rich", () => {
    expect(inferCatalogV7Tier(rich)).toBe("parameter-rich");
    expect(inferCatalogV7Tier({ ...rich, radiusSolar: interval(null) })).toBe("photometric-derived");
  });

  it("rejects non-finite and inverted uncertainty intervals", () => {
    expect(validateStellarParameterInterval(interval(10, 9, 11))).toBe(true);
    expect(validateStellarParameterInterval(interval(10, 11, 12))).toBe(false);
    expect(validateStellarParameterInterval(interval(Number.NaN))).toBe(false);
  });

  it("keeps the optional V7 pack bounded and contiguous", () => {
    const manifest: WebCatalogPackManifestV3 = {
      schemaVersion: 3, version: "v148-catalog-million-v7", sqliteSchemaVersion: 2,
      rowCount: 1_224_219, parameterRichCount: 218_617, priorityParameterRichCount: 63_091,
      installedBytes: 10, sha256: "a".repeat(64), chunkBytes: 16 * 1024 * 1024,
      chunks: [{ index: 0, path: "part-000", offset: 0, bytes: 10, sha256: "b".repeat(64) }],
      baseUrl: "", runtimePolicy: "opfs-sqlite-wasm-dedicated-worker-direct-oo1-runtime-offline",
      sourceManifest: "dist/catalog-v7/catalog-v7.report.json", provenance: ["Gaia DR3"], snapshotId: "gaia-ap-v2",
    };
    expect(validateWebCatalogPackManifestV3(manifest)).toEqual([]);
  });
});

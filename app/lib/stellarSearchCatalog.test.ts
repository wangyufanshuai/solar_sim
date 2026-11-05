import { describe, expect, it } from "vitest";
import {
  STELLAR_SEARCH_CATALOG_VERSION,
  normalizeStellarSearchQuery,
  searchStellarDocuments,
  selectStellarSearchShard,
  stellarDocumentToGaiaIndex,
  type StellarSearchDocument,
  type StellarSearchManifest,
} from "./stellarSearchCatalog";

const hd209458: StellarSearchDocument = {
  sourceId: "1779546757669063552",
  designation: "Gaia DR3 1779546757669063552",
  displayName: "HD 209458",
  aliases: ["HIP 108859", "V376 Peg", "TYC 1688-1821-1"],
  raDeg: 330.794886,
  decDeg: 18.884319,
  parallaxMas: 20.67,
  magG: 7.51,
  bpRp: 0.58,
  ruwe: 1.0,
  teffK: 6070,
  logg: 4.38,
  radiusSolar: 1.2,
  variable: true,
  source: "simbad-alias",
};

describe("v116 offline stellar search catalog", () => {
  it("normalizes Gaia designations and resolves aliases", () => {
    expect(normalizeStellarSearchQuery(" Gaia DR3 1779546757669063552 ")).toBe(
      "1779546757669063552",
    );
    expect(searchStellarDocuments([hd209458], "HD 209458")[0]?.matchKind).toBe("alias");
    expect(searchStellarDocuments([hd209458], "HIP 108859")[0]?.document.sourceId).toBe(
      hd209458.sourceId,
    );
    expect(searchStellarDocuments([hd209458], hd209458.sourceId)[0]?.matchKind).toBe(
      "exact-id",
    );
  });

  it("selects a source-id range shard and converts a result for close-up", () => {
    const manifest: StellarSearchManifest = {
      version: STELLAR_SEARCH_CATALOG_VERSION,
      source: "ESA Gaia DR3 archive",
      sourceTable: "gaiadr3.gaia_source",
      generatedAt: "2026-07-12T00:00:00.000Z",
      rowCount: 100000,
      renderCatalogRowCount: 5000,
      runtimePolicy: "offline-sharded-no-runtime-network",
      aliasPath: "/data/stellar-search/aliases.json",
      shards: [
        { id: "00", path: "/00.json", rowCount: 6250, sourceIdMin: "0", sourceIdMaxExclusive: "2305843009213693952" },
        { id: "01", path: "/01.json", rowCount: 6250, sourceIdMin: "2305843009213693952", sourceIdMaxExclusive: "4611686018427387904" },
      ],
    };
    expect(selectStellarSearchShard(manifest, hd209458.sourceId)?.id).toBe("00");
    const indexed = stellarDocumentToGaiaIndex(hd209458);
    expect(indexed.sourceId).toBe(hd209458.sourceId);
    expect(indexed.displayName).toBe("HD 209458");
    expect(indexed.star.magG).toBe(hd209458.magG);
    expect(indexed.stellarParameters?.teffK).toBe(hd209458.teffK);
  });
});

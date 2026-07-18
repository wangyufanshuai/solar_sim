import { describe, expect, it } from "vitest";
import type { GaiaStarRecord } from "../data/gaiaStarCatalog";
import { selectedSkyTargetDescriptor } from "./selectedSkyTarget";

describe("selected sky target descriptor", () => {
  it("creates catalog and Gaia descriptors without inserting physics bodies", () => {
    const catalog = selectedSkyTargetDescriptor("nearby-star:vega", []);
    expect(catalog).toMatchObject({
      id: "nearby-star:vega",
      kind: "catalog",
    });
    expect(catalog?.direction.every(Number.isFinite)).toBe(true);

    const sourceId = "4049506483413484672";
    const gaia = selectedSkyTargetDescriptor(`gaia-dr3:${sourceId}`, [
      {
        id: `gaia-dr3:${sourceId}`,
        sourceId,
        star: {
          sourceId,
          raDeg: 279.234,
          decDeg: 38.783,
          parallaxMas: 130.23,
          magG: 0.05,
          colorBpRp: 0,
        } satisfies GaiaStarRecord,
        displayName: "Vega",
        shortLabel: "Vega",
        aliases: [sourceId],
        searchText: sourceId,
        namedCatalogId: "nearby-star:vega",
      },
    ]);
    expect(gaia).toMatchObject({
      id: `gaia-dr3:${sourceId}`,
      kind: "gaia",
      source: "Gaia DR3",
    });
    expect(gaia?.direction.every(Number.isFinite)).toBe(true);
  });
});

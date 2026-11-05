import { describe, expect, it } from "vitest";
import type { GaiaStarRecord } from "../data/gaiaStarCatalog";
import { selectedSkyTargetDescriptor } from "./selectedSkyTarget";

describe("selected sky target descriptor", () => {
  it("creates catalog and Gaia descriptors without inserting physics bodies", () => {
    const catalog = selectedSkyTargetDescriptor("nearby-star:vega", []);
    expect(catalog).toMatchObject({
      id: "nearby-star:vega",
      kind: "catalog",
      targetType: "catalog-stellar",
      catalogObjectKind: "nearby-star",
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
      targetType: "gaia-stellar",
      source: "Gaia DR3",
    });
    expect(gaia?.direction.every(Number.isFinite)).toBe(true);
  });

  it("resolves the post-v593 named-star roster as presentation-only targets", () => {
    const hero = selectedSkyTargetDescriptor("stellar-hero:alnilam", []);
    expect(hero).toMatchObject({
      id: "stellar-hero:alnilam",
      label: "Alnilam",
      kind: "catalog",
      targetType: "stellar-hero",
      heroId: "alnilam",
      source: "v592 named-star presentation catalog",
      dataTier: "catalog-basic",
      variability: {
        knownState: "unknown",
        value: null,
        // The field remains non-measurement-admitted/unknown at the UI value
        // boundary, while its provenance source is an identity-bound SIMBAD
        // classification record.  Keep those two semantics separate.
        authority: "meta-resolver-basic-data",
      },
    });
    expect(hero?.direction.every(Number.isFinite)).toBe(true);
    expect(selectedSkyTargetDescriptor("alnilam", [])?.id).toBe("stellar-hero:alnilam");
  });

  it("keeps deep-sky catalog objects out of the stellar portrait union", () => {
    const galaxy = selectedSkyTargetDescriptor("galaxy:m31", []);
    expect(galaxy).toMatchObject({
      id: "galaxy:m31",
      targetType: "non-stellar-catalog",
      catalogObjectKind: "galaxy",
    });
    expect(galaxy).not.toHaveProperty("variability");
  });
});

import { describe, expect, it } from "vitest";
import type { GaiaStarRecord } from "../data/gaiaStarCatalog";
import {
  GAIA_LABEL_BUDGETS,
  buildGaiaStarIndex,
  searchGaiaStarIndex,
  selectGaiaLabelStars,
} from "./gaiaCatalogIndex";

describe("v107 Gaia catalog index", () => {
  it("crossmatches a known star and supports Chinese, English and source id search", () => {
    const index = buildGaiaStarIndex([
      star("2098202128093842432", 279.2347, 38.7837, 0.03),
    ]);

    expect(searchGaiaStarIndex(index, "\u7ec7\u5973\u661f")).toHaveLength(1);
    expect(searchGaiaStarIndex(index, "Vega")).toHaveLength(1);
    expect(searchGaiaStarIndex(index, "2098202128093842432")).toHaveLength(1);
    expect(searchGaiaStarIndex(index, "2")).toEqual([]);
  });

  it("locks desktop/mobile label budgets and always retains selection", () => {
    const index = buildGaiaStarIndex(
      Array.from({ length: 40 }, (_, i) =>
        star(String(10_000 + i), i * 8.7, -70 + i * 3.4, 2 + i * 0.08),
      ),
    );
    expect(selectGaiaLabelStars(index, false)).toHaveLength(
      GAIA_LABEL_BUDGETS.desktop,
    );
    expect(selectGaiaLabelStars(index, true)).toHaveLength(
      GAIA_LABEL_BUDGETS.mobile,
    );
    expect(
      selectGaiaLabelStars(index, true, index[39]!.sourceId).some(
        (entry) => entry.sourceId === index[39]!.sourceId,
      ),
    ).toBe(true);
  });
});

function star(
  sourceId: string,
  raDeg: number,
  decDeg: number,
  magG: number,
): GaiaStarRecord {
  return {
    sourceId,
    raDeg,
    decDeg,
    parallaxMas: 20,
    magG,
    colorBpRp: 0.7,
  };
}

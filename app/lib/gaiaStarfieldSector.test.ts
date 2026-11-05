import { describe, expect, it } from "vitest";
import { generatePlaceholderCatalog } from "../data/gaiaStarCatalog";
import { buildGaiaStarfieldSectorIndex, selectGaiaStarfieldSectorIndices } from "./gaiaStarfieldSector";

describe("v255 Gaia sector selector", () => {
  it("builds the fixed 48x24 index and selects deterministically within budget", () => {
    const catalog = generatePlaceholderCatalog(256);
    const index = buildGaiaStarfieldSectorIndex(catalog.stars);
    const first = selectGaiaStarfieldSectorIndices(index, [0, 0, 1], 48);
    const second = selectGaiaStarfieldSectorIndices(index, [0, 0, 1], 48);
    expect(index.bins).toHaveLength(48 * 24);
    expect(first).toEqual(second);
    expect(first).toHaveLength(48);
    expect(new Set(first).size).toBe(48);
  });

  it("retains a selected source even when it is outside the first sector", () => {
    const catalog = generatePlaceholderCatalog(64);
    const index = buildGaiaStarfieldSectorIndex(catalog.stars);
    const selected = catalog.stars.at(-1)!;
    const result = selectGaiaStarfieldSectorIndices(index, [1, 0, 0], 8, selected.sourceId);
    expect(result).toContain(index.sourceIdToIndex.get(selected.sourceId));
    expect(result).toHaveLength(8);
  });
});

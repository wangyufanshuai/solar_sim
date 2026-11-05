import { describe, expect, it } from "vitest";
import { atlasSubsetInclusionV267, gaiaResearchBinRangeV267, parseGaiaResearchQueryV267 } from "./gaiaResearchWorkbenchV267";

describe("v267 Gaia Research Workbench contract", () => {
  it("accepts only versioned query kinds and canonical filters", () => {
    expect(parseGaiaResearchQueryV267({ kind: "healpix-density", order: 5, filters: { qualityTiers: ["gold"], gMin: 6, gMax: 17, ruweMax: 1.4 } })).toMatchObject({
      kind: "healpix-density", order: 5, filters: { qualityTiers: ["gold"], gMin: 6, gMax: 17, ruweMax: 1.4 },
    });
    expect(() => parseGaiaResearchQueryV267({ kind: "raw-sql", sql: "SELECT *" })).toThrow();
    expect(() => parseGaiaResearchQueryV267({ kind: "overview", filters: { arbitrary: true } })).toThrow();
    expect(() => parseGaiaResearchQueryV267({ kind: "hr-density", bins: 4096 })).toThrow();
  });

  it("maps exact bin ranges and never invents completeness", () => {
    expect(gaiaResearchBinRangeV267(6, 17, [-5, 6, 9, 12, 15, 17, 19, 22])).toEqual([1, 4]);
    expect(atlasSubsetInclusionV267(25, 100)).toBe(0.25);
    expect(atlasSubsetInclusionV267(0, 0)).toBeNull();
  });
});

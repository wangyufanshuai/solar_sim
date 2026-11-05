import { describe, expect, it } from "vitest";
import { loadKerrHighEnergyJointNuisanceV433, resetKerrHighEnergyJointNuisanceServerCacheForTestsV433 } from "./kerrHighEnergyJointNuisanceServerV433";

describe("v433 joint nuisance server", () => {
  it("single-flights seven bounded SHA-verified products", async () => {
    resetKerrHighEnergyJointNuisanceServerCacheForTestsV433();
    const first = await loadKerrHighEnergyJointNuisanceV433();
    expect(await loadKerrHighEnergyJointNuisanceV433()).toBe(first);
    expect(first.manifest).toMatchObject({ familyCount: 2, covarianceDimension: 24, covarianceElementCount: 11520, groupUncertaintyCount: 20, monteCarloDrawCount: 16384, scienceBoundaryStatus: "implemented-not-admitted", measuredResponseAuthority: "unavailable", measuredLikelihoodAuthority: "unavailable", scienceResponseApplicationCount: 0, denseShardExecuted: false });
    expect(Object.keys(first.exports).sort()).toEqual(["boundary", "contract", "csv", "fits", "json", "oracle", "png"]);
  });
});

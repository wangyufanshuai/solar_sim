import { describe, expect, it } from "vitest";
import { loadKerrHighEnergyCountLikelihoodV430, resetKerrHighEnergyCountLikelihoodServerCacheForTestsV430 } from "./kerrHighEnergyCountLikelihoodServerV430";

describe("v430 count-likelihood server", () => {
  it("single-flights six bounded SHA-verified products", async () => {
    resetKerrHighEnergyCountLikelihoodServerCacheForTestsV430();
    const first = await loadKerrHighEnergyCountLikelihoodV430();
    expect(await loadKerrHighEnergyCountLikelihoodV430()).toBe(first);
    expect(first.manifest).toMatchObject({ predictedCountCount: 24, simulatedCountCount: 24, measuredObservedCountCount: 0, measuredHoldoutDatasetCount: 0, measuredResidualMetricCount: 0, measuredValidationRunCount: 0, measuredResponseAuthority: "unavailable", scienceResponseApplicationCount: 0, denseShardExecuted: false });
    expect(Object.keys(first.exports).sort()).toEqual(["contract", "csv", "fits", "json", "oracle", "png"]);
  });
});

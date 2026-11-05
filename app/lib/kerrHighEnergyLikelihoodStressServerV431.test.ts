import { describe, expect, it } from "vitest";
import { loadKerrHighEnergyLikelihoodStressV431, resetKerrHighEnergyLikelihoodStressServerCacheForTestsV431 } from "./kerrHighEnergyLikelihoodStressServerV431";

describe("v431 likelihood stress server", () => {
  it("single-flights six bounded SHA-verified products", async () => {
    resetKerrHighEnergyLikelihoodStressServerCacheForTestsV431();
    const first = await loadKerrHighEnergyLikelihoodStressV431();
    expect(await loadKerrHighEnergyLikelihoodStressV431()).toBe(first);
    expect(first.manifest).toMatchObject({ scenarioCount: 6, syntheticCountCellCount: 73728, measuredObservedCountCount: 0, measuredValidationRunCount: 0, alternativeLikelihoodImplementationQualifiedCount: 0, measuredResponseAuthority: "unavailable", scienceResponseApplicationCount: 0, denseShardExecuted: false });
    expect(Object.keys(first.exports).sort()).toEqual(["contract", "csv", "fits", "json", "oracle", "png"]);
  });
});

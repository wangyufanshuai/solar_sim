import { describe, expect, it } from "vitest";
import { loadKerrHighEnergyResponseAcquisitionPackV427, resetKerrHighEnergyResponseAcquisitionServerCacheForTestsV427 } from "./kerrHighEnergyResponseAcquisitionPackServerV427";

describe("v427 high-energy response acquisition server", () => {
  it("single-flights four bounded SHA-verified hand-off products", async () => {
    resetKerrHighEnergyResponseAcquisitionServerCacheForTestsV427();
    const first = await loadKerrHighEnergyResponseAcquisitionPackV427();
    expect(await loadKerrHighEnergyResponseAcquisitionPackV427()).toBe(first);
    expect(first.manifest).toMatchObject({ zipEntryCount: 9, measurementTemplateCount: 7, measurementTemplateDataRowCount: 0, validatorFixtureIncludedInZip: false, measuredResponseAuthority: "unavailable", scienceResponseApplicationCount: 0 });
    expect(Object.keys(first.exports).sort()).toEqual(["fits", "json", "png", "zip"]);
  });
});

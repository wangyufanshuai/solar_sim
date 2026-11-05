import { describe, expect, it } from "vitest";
import { loadKerrHighEnergyResponseIntakeV428, resetKerrHighEnergyResponseIntakeServerCacheForTestsV428 } from "./kerrHighEnergyResponseIntakeServerV428";

describe("v428 high-energy response intake server", () => {
  it("single-flights five bounded SHA-verified intake products", async () => {
    resetKerrHighEnergyResponseIntakeServerCacheForTestsV428();
    const first = await loadKerrHighEnergyResponseIntakeV428();
    expect(await loadKerrHighEnergyResponseIntakeV428()).toBe(first);
    expect(first.manifest).toMatchObject({ expectedArchiveFileCount: 7, measurementCsvCount: 6, fixtureMutationCount: 12, fixtureRejectedMutationCount: 12, measuredSubmissionCount: 0, measuredImportAttemptCount: 0, measuredResponseAuthority: "unavailable", scienceResponseApplicationCount: 0 });
    expect(Object.keys(first.exports).sort()).toEqual(["fixture", "json", "png", "report", "schema"]);
  });
});

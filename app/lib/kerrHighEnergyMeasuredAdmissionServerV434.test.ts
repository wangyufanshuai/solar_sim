import { describe, expect, it } from "vitest";
import { loadKerrMeasuredAdmissionV434, resetKerrMeasuredAdmissionServerCacheForTestsV434 } from "./kerrHighEnergyMeasuredAdmissionServerV434";

describe("v434 measured admission server", () => {
  it("single-flights seven bounded SHA-verified products", async () => {
    resetKerrMeasuredAdmissionServerCacheForTestsV434();
    const first = await loadKerrMeasuredAdmissionV434();
    expect(await loadKerrMeasuredAdmissionV434()).toBe(first);
    expect(first.manifest).toMatchObject({ requiredGateCount: 9, passedFixtureGateCount: 8, mutationCount: 12, rejectedMutationCount: 12, measuredPackCount: 0, measuredResponseAuthority: "unavailable", measuredLikelihoodAuthority: "unavailable", independentMeasuredHoldout: "unavailable", independentReview: "not-run", scienceAdmission: "blocked-no-measured-authority-pack", scienceResponseApplicationCount: 0, denseShardExecuted: false });
    expect(Object.keys(first.exports).sort()).toEqual(["contract", "csv", "fits", "fixture", "json", "oracle", "png"]);
  });
});

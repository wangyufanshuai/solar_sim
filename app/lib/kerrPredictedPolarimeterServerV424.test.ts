import { describe, expect, it } from "vitest";
import { loadKerrPredictedPolarimeterV424, resetKerrPredictedPolarimeterServerV424CacheForTests } from "./kerrPredictedPolarimeterServerV424";

describe("v424 predicted polarimeter server", () => {
  it("single-flights SHA-verified products without measurement or detector authority", async () => {
    resetKerrPredictedPolarimeterServerV424CacheForTests();
    const first = await loadKerrPredictedPolarimeterV424();
    expect(await loadKerrPredictedPolarimeterV424()).toBe(first);
    expect(first.summary.referenceModulationRows).toHaveLength(16);
    expect(first.manifest.modelPrediction).toBe("qualified");
    expect(first.manifest.measurementAuthority).toBe("unavailable");
    expect(first.manifest.photonOrElectronCounts).toBe("unavailable");
  });
});

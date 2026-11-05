import { describe, expect, it } from "vitest";
import { loadKerrSpectralConfidenceScaleV357, resetKerrSpectralConfidenceScaleServerV357CacheForTests } from "./kerrSpectralConfidenceScaleServerV357";

describe("v357 scale server", () => {
  it("serves bounded 1/2/3 sigma convention", async () => {
    resetKerrSpectralConfidenceScaleServerV357CacheForTests();
    expect(await loadKerrSpectralConfidenceScaleV357()).toMatchObject({ status: "qualified-synthetic-multiscale-envelope-audit", scaleConvention: { levels: [1, 2, 3] }, measuredConfidenceAuthority: "unavailable-synthetic-scale-not-measured-probability-coverage" });
  });
});

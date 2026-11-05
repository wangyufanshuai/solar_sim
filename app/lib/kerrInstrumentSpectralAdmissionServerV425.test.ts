import { describe, expect, it } from "vitest";
import { loadKerrInstrumentSpectralAdmissionV425, resetKerrInstrumentSpectralAdmissionServerV425CacheForTests } from "./kerrInstrumentSpectralAdmissionServerV425";

describe("v425 spectral admission server", () => {
  it("single-flights SHA-verified fail-closed products", async () => {
    resetKerrInstrumentSpectralAdmissionServerV425CacheForTests();
    const first = await loadKerrInstrumentSpectralAdmissionV425();
    expect(await loadKerrInstrumentSpectralAdmissionV425()).toBe(first);
    expect(first.summary.bandSummaries).toHaveLength(3);
    expect(first.manifest.responseEligibleSourceCount).toBe(0);
    expect(first.manifest.responseMatrixApplicationCount).toBe(0);
    expect(first.manifest.extrapolation).toBe("forbidden");
  });
});

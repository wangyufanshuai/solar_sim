import { describe, expect, it } from "vitest";
import {
  loadKerrPolarizationFrequencySensitivityV522,
  resetKerrPolarizationFrequencySensitivityServerCacheForTestsV522,
} from "./kerrPolarizationFrequencySensitivityServerV522";

describe("v522 polarization sensitivity server", () => {
  it("loads the bounded full artifact and reuses one fingerprint cache", async () => {
    resetKerrPolarizationFrequencySensitivityServerCacheForTestsV522();
    const first = await loadKerrPolarizationFrequencySensitivityV522();
    const second = await loadKerrPolarizationFrequencySensitivityV522();
    expect(first).toBe(second);
    expect(first.summary.counts).toMatchObject({
      scenarioCount: 9,
      scenarioRowCount: 216,
      envelopeRowCount: 24,
      directAdaptiveIntegralCount: 888,
      measuredStokesRowCount: 0,
    });
    expect(first.export.bytes.byteLength).toBeGreaterThan(0);
    expect(first.export.bytes.byteLength).toBeLessThanOrEqual(512 * 1024);
  });
});

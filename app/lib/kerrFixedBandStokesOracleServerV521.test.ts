import { describe, expect, it } from "vitest";
import {
  loadKerrFixedBandStokesOracleV521,
  resetKerrFixedBandStokesOracleServerCacheForTestsV521,
} from "./kerrFixedBandStokesOracleServerV521";

describe("v521 direct Stokes oracle server", () => {
  it("loads a bounded canonical artifact through one fingerprint cache", async () => {
    resetKerrFixedBandStokesOracleServerCacheForTestsV521();
    const first = await loadKerrFixedBandStokesOracleV521();
    const second = await loadKerrFixedBandStokesOracleV521();
    expect(first).toBe(second);
    expect(first.summary.counts).toMatchObject({
      rowCount: 24,
      directAdaptiveIntegralCount: 144,
      componentwiseUncertaintyEnvelopeCount: 24,
      measuredStokesRowCount: 0,
    });
    expect(first.export.bytes.byteLength).toBeGreaterThan(0);
    expect(first.export.bytes.byteLength).toBeLessThanOrEqual(192 * 1024);
  });
});

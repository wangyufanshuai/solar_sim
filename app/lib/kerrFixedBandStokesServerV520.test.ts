import { describe, expect, it } from "vitest";
import {
  loadKerrFixedBandStokesV520,
  resetKerrFixedBandStokesServerCacheForTestsV520,
} from "./kerrFixedBandStokesServerV520";

describe("v520 fixed-band Stokes server", () => {
  it("loads a bounded canonical artifact through a fingerprint cache", async () => {
    resetKerrFixedBandStokesServerCacheForTestsV520();
    const first = await loadKerrFixedBandStokesV520();
    const second = await loadKerrFixedBandStokesV520();
    expect(first).toBe(second);
    expect(first.summary.counts).toMatchObject({
      rayCount: 4,
      bandCount: 3,
      transportMethodCount: 2,
      rowCount: 24,
      measuredStokesRowCount: 0,
    });
    expect(first.export.bytes.byteLength).toBeGreaterThan(0);
    expect(first.export.bytes.byteLength).toBeLessThanOrEqual(128 * 1024);
  });
});

import { describe, expect, it } from "vitest";
import {
  loadKerrScienceProductEligibilityGraphV512,
  resetKerrScienceProductEligibilityGraphServerCacheForTestsV512,
} from "./kerrScienceProductEligibilityGraphServerV512";

describe("v512 science product graph server", () => {
  it("loads a bounded canonical graph and reuses its fingerprint cache", async () => {
    resetKerrScienceProductEligibilityGraphServerCacheForTestsV512();
    const first = await loadKerrScienceProductEligibilityGraphV512();
    const second = await loadKerrScienceProductEligibilityGraphV512();
    expect(first).toBe(second);
    expect(first.summary.counts).toMatchObject({
      nodeCount: 10,
      edgeCount: 12,
      wcsCoordinateRows: 4,
      sparsePhotonRows: 4,
      scienceRasterRows: 0,
      fitsHduCount: 0,
      pngCount: 0,
    });
    expect(first.export.bytes.byteLength).toBeGreaterThan(0);
    expect(first.export.bytes.byteLength).toBeLessThanOrEqual(128 * 1024);
  });
});

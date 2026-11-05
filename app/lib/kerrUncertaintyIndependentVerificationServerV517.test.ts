import { describe, expect, it } from "vitest";
import {
  loadKerrUncertaintyIndependentVerificationV517,
  resetKerrUncertaintyIndependentVerificationServerCacheForTestsV517,
} from "./kerrUncertaintyIndependentVerificationServerV517";

describe("v517 independent verification server", () => {
  it("loads a bounded receipt and reuses its fingerprint cache", async () => {
    resetKerrUncertaintyIndependentVerificationServerCacheForTestsV517();
    const first = await loadKerrUncertaintyIndependentVerificationV517();
    const second = await loadKerrUncertaintyIndependentVerificationV517();
    expect(first).toBe(second);
    expect(first.summary.verification).toMatchObject({
      independentImplementation: true,
      recomputedWitnessCount: 512,
      matchedCheckpointCount: 8,
      witnessMismatchCount: 0,
      boundaryViolationCount: 0,
    });
    expect(first.export.bytes.byteLength).toBeGreaterThan(0);
    expect(first.export.bytes.byteLength).toBeLessThanOrEqual(128 * 1024);
  });
});

import { describe, expect, it } from "vitest";
import {
  loadKerrUncertaintyReplayWitnessV516,
  resetKerrUncertaintyReplayWitnessServerCacheForTestsV516,
} from "./kerrUncertaintyReplayWitnessServerV516";

describe("v516 uncertainty witness server", () => {
  it("loads a bounded witness ledger and reuses its fingerprint cache", async () => {
    resetKerrUncertaintyReplayWitnessServerCacheForTestsV516();
    const first = await loadKerrUncertaintyReplayWitnessV516();
    const second = await loadKerrUncertaintyReplayWitnessV516();
    expect(first).toBe(second);
    expect(first.summary.chain).toMatchObject({
      transitionCount: 512,
      witnessCount: 512,
      checkpointCount: 8,
      passCount: 2,
      mismatchCount: 0,
    });
    expect(first.export.fileSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(first.export.bytes.byteLength).toBeGreaterThan(0);
    expect(first.export.bytes.byteLength).toBeLessThanOrEqual(128 * 1024);
  });
});

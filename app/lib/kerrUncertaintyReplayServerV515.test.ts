import { describe, expect, it } from "vitest";
import {
  loadKerrUncertaintyReplayV515,
  resetKerrUncertaintyReplayServerCacheForTestsV515,
} from "./kerrUncertaintyReplayServerV515";

describe("v515 uncertainty replay server", () => {
  it("loads a bounded canonical replay and reuses its content fingerprint", async () => {
    resetKerrUncertaintyReplayServerCacheForTestsV515();

    const first = await loadKerrUncertaintyReplayV515();
    const second = await loadKerrUncertaintyReplayV515();

    expect(first).toBe(second);
    expect(first.summary.replay).toMatchObject({
      transitionCount: 512,
      encodingBuildCount: 1024,
      explicitRequestCount: 1,
      automaticRequestCount: 0,
      scientificPayloadMismatchCount: 0,
      scientificRowMismatchCount: 0,
      visualSignatureMismatchCount: 0,
      numericStyleViolationCount: 0,
      scientificMutationCount: 0,
    });
    expect(first.summary.lifecycle.finalResourceStatus).toBe("baseline");
    expect(first.export.name).toBe("orbit-atlas-kerr-uncertainty-replay-v515.json");
    expect(first.export.fileSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(first.export.bytes.byteLength).toBeGreaterThan(0);
    expect(first.export.bytes.byteLength).toBeLessThanOrEqual(128 * 1024);
  });
});

import { describe, expect, it } from "vitest";
import {
  KERR_COST_LAW_ROBUSTNESS_ARTIFACT_MAX_BYTES_V529,
  loadKerrCostLawRobustnessV529,
  resetKerrCostLawRobustnessServerCacheForTestsV529,
} from "./kerrCostLawRobustnessServerV529";

describe("v529 cost-law robustness server", () => {
  it("loads one bounded artifact through the mtime-size-sha cache", async () => {
    resetKerrCostLawRobustnessServerCacheForTestsV529();
    const first = await loadKerrCostLawRobustnessV529();
    const second = await loadKerrCostLawRobustnessV529();
    expect(first).toBe(second);
    expect(first.summary.displayGeometry.scientificGeometryInputCount).toBe(68);
    expect(first.export.bytes.byteLength).toBeLessThanOrEqual(
      KERR_COST_LAW_ROBUSTNESS_ARTIFACT_MAX_BYTES_V529,
    );
  });
});

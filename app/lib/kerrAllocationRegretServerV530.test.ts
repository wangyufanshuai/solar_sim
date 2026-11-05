import { describe, expect, it } from "vitest";
import {
  KERR_ALLOCATION_REGRET_ARTIFACT_MAX_BYTES_V530,
  loadKerrAllocationRegretV530,
  resetKerrAllocationRegretServerCacheForTestsV530,
} from "./kerrAllocationRegretServerV530";

describe("v530 allocation regret server", () => {
  it("loads one bounded artifact through the mtime-size-sha cache", async () => {
    resetKerrAllocationRegretServerCacheForTestsV530();
    const first = await loadKerrAllocationRegretV530();
    const second = await loadKerrAllocationRegretV530();
    expect(first).toBe(second);
    expect(first.summary.displayGeometry.scientificGeometryInputCount).toBe(148);
    expect(first.export.bytes.byteLength).toBeLessThanOrEqual(
      KERR_ALLOCATION_REGRET_ARTIFACT_MAX_BYTES_V530,
    );
  });
});

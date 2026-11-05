import { afterEach, describe, expect, it } from "vitest";
import {
  loadMeasuredVisibleThroughputV383,
  resetMeasuredVisibleThroughputServerV383CacheForTests,
} from "./measuredVisibleThroughputServerV383";

afterEach(() => resetMeasuredVisibleThroughputServerV383CacheForTests());

describe("v383 visible throughput server", () => {
  it("loads the bounded dual-implementation candidate without authority", async () => {
    const first = await loadMeasuredVisibleThroughputV383();
    const second = await loadMeasuredVisibleThroughputV383();
    expect(second).toBe(first);
    expect(first.normalizedProfile.metrics.rowCount).toBe(3301);
    expect(first.dualImplementation.qualified).toBe(true);
    expect(first.authorityBoundary.visibleMeasuredAuthorityGranted).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { loadMeasuredPhotonExpectationV369, resetMeasuredPhotonExpectationServerV369CacheForTests } from "./measuredPhotonExpectationServerV369";

describe("v369 measured expectation server", () => {
  it("serves a cached unavailable result when authority and observation geometry are absent", async () => {
    resetMeasuredPhotonExpectationServerV369CacheForTests(); const first = await loadMeasuredPhotonExpectationV369(); const second = await loadMeasuredPhotonExpectationV369();
    expect(first).toBe(second);
    expect(first).toMatchObject({ status: "unavailable-authority-or-observation-geometry", authorityGranted: false, observationGeometryQualified: false, measuredExpectationAvailable: false, unavailableReasons: ["v367-v368-authority-chain-unavailable", "measured-observation-geometry-unavailable"], rows: [], syntheticFallbackUsed: false, observedCounts: "unavailable-expectation-is-not-observed-detector-counts" });
  });
});

import { afterEach, describe, expect, it } from "vitest";
import {
  loadMeasuredVisiblePhotonObservableV384,
  resetMeasuredVisiblePhotonObservableServerV384CacheForTests,
} from "./measuredVisiblePhotonObservableServerV384";

afterEach(() =>
  resetMeasuredVisiblePhotonObservableServerV384CacheForTests(),
);

describe("v384 visible photon observable server", () => {
  it("loads four bounded rows while electron expectation stays unavailable", async () => {
    const first = await loadMeasuredVisiblePhotonObservableV384();
    const second = await loadMeasuredVisiblePhotonObservableV384();
    expect(second).toBe(first);
    expect(first.rows).toHaveLength(4);
    expect(first.authorityBoundary.photonObservableQualified).toBe(true);
    expect(first.authorityBoundary.detectorElectronExpectationAvailable).toBe(
      false,
    );
  });
});

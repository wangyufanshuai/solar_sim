import { describe, expect, it } from "vitest";
import {
  GAIA_PRESENTATION_FETCH_BATCH_ROWS_V272,
  createGaiaPresentationLowMemoryPolicyV272,
} from "./gaiaPresentationLowMemoryV272";

describe("Gaia presentation low-memory fetch policy v272", () => {
  it("keeps 6 GiB as the default", () => {
    expect(createGaiaPresentationLowMemoryPolicyV272()).toEqual(expect.objectContaining({
      requestedMinimumFreeMemoryGiB: 6,
      overrideApplied: false,
      authorization: "default-policy",
      buildThresholdUnchangedGiB: 6,
    }));
  });

  it("allows the explicitly authorized 3 GiB fetch without lowering the build threshold", () => {
    expect(createGaiaPresentationLowMemoryPolicyV272(3)).toEqual(expect.objectContaining({
      requestedMinimumFreeMemoryGiB: 3,
      overrideApplied: true,
      authorization: "user-authorized-3-gib-fetch-only",
      buildThresholdUnchangedGiB: 6,
    }));
    expect(GAIA_PRESENTATION_FETCH_BATCH_ROWS_V272).toBe(5_000);
  });

  it("fails closed below 3 GiB", () => {
    expect(() => createGaiaPresentationLowMemoryPolicyV272(2.99)).toThrow(/at least 3 GiB/);
  });
});

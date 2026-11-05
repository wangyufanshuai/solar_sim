import { beforeEach, describe, expect, it } from "vitest";
import { resetMeasuredVisiblePhotonSensitivityServerV386CacheForTests } from "../../../../../lib/measuredVisiblePhotonSensitivityServerV386";
import { GET } from "./route";

describe("v386 visible photon sensitivity route", () => {
  beforeEach(() => {
    resetMeasuredVisiblePhotonSensitivityServerV386CacheForTests();
  });

  it("keeps Lite unavailable", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    const response = await GET(new Request("http://localhost/v386-lite"));
    expect(await response.json()).toMatchObject({
      available: false,
      reason: "lite-boundary",
    });
  });

  it("serves a bounded no-store local-shadow artifact", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(
      new Request("http://localhost/v386", {
        headers: { "x-forwarded-for": "127.0.0.1" },
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-atlas-visible-photon-sensitivity")).toBe(
      "v386",
    );
    const body = await response.json();
    expect(body.available).toBe(true);
    expect(body.artifact.counts.wavelengthBinCount).toBe(12);
    expect(body.artifact.calibrationContract.suppliedCovarianceAvailable).toBe(
      false,
    );
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const original = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => {
  if (original === undefined) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
  else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = original;
});

describe("v503 measured calibration readiness route", () => {
  it("stays unavailable outside local-shadow", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    const response = await GET(
      new Request(
        "http://localhost/api/atlas/relativity-evidence/v503/detector-calibration-readiness",
      ),
    );
    expect(await response.json()).toMatchObject({
      available: false,
      reason: "lite-boundary",
      summary: null,
    });
  });

  it("serves a bounded fail-closed readiness summary", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(
      new Request(
        "http://localhost/api/atlas/relativity-evidence/v503/detector-calibration-readiness",
        { headers: { "x-forwarded-for": "127.0.0.151" } },
      ),
    );
    const body = await response.text();
    expect(new TextEncoder().encode(body).byteLength).toBeLessThanOrEqual(128 * 1024);
    expect(JSON.parse(body)).toMatchObject({
      available: true,
      reason: "ready",
      summary: {
        decision: { admitted: false, readyFileCount: 0, missingFileCount: 6 },
        outputs: { detectorResponse: "unavailable", scienceRaster: "unavailable" },
      },
    });
  });
});

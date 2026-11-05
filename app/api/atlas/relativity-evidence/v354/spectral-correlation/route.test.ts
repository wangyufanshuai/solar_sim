import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const originalProfile = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;

afterEach(() => {
  if (originalProfile == null) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
  else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = originalProfile;
});

describe("v354 spectral-correlation route", () => {
  it("keeps Lite isolated and returns a bounded synthetic covariance artifact", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(await (await GET(new Request("http://localhost/api/atlas/relativity-evidence/v354/spectral-correlation"))).json()).toMatchObject({
      available: false,
      reason: "lite-boundary",
    });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    const response = await GET(new Request(
      "http://localhost/api/atlas/relativity-evidence/v354/spectral-correlation",
      { headers: { "x-forwarded-for": "127.0.0.450" } },
    ));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-atlas-spectral-correlation")).toBe("v354");
    expect(await response.json()).toMatchObject({
      available: true,
      artifact: {
        counts: { coefficientCount: 9, perturbationExecutions: 72 },
        fullMeasuredResponseEnvelope: "unavailable-synthetic-correlation-model-not-measured-spectral-covariance",
      },
    });
  });
});

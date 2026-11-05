import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const originalProfile = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;

afterEach(() => {
  if (originalProfile == null) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
  else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = originalProfile;
});

describe("v355 spectral eigenmode route", () => {
  it("keeps Lite isolated and exposes a bounded synthetic decomposition", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(await (await GET(new Request("http://localhost/api/atlas/relativity-evidence/v355/spectral-eigenmodes"))).json()).toMatchObject({
      available: false,
      reason: "lite-boundary",
    });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    const response = await GET(new Request(
      "http://localhost/api/atlas/relativity-evidence/v355/spectral-eigenmodes",
      { headers: { "x-forwarded-for": "127.0.0.460" } },
    ));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-atlas-spectral-eigenmodes")).toBe("v355");
    expect(await response.json()).toMatchObject({
      available: true,
      artifact: {
        counts: { eigenmodeCount: 12, ellipseCount: 12 },
        fullMeasuredEigenmodeAuthority: "unavailable-input-covariance-is-synthetic-not-measured",
      },
    });
  });
});

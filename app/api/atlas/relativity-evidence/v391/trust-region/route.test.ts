import { beforeEach, describe, expect, it } from "vitest";
import { resetKerrTemperatureTrustRegionServerV391CacheForTests } from "../../../../../lib/kerrTemperatureTrustRegionServerV391";
import { GET } from "./route";

describe("v391 trust region route", () => {
  beforeEach(() => {
    resetKerrTemperatureTrustRegionServerV391CacheForTests();
  });

  it("keeps Lite unavailable", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    const response = await GET(new Request("http://localhost/v391-lite"));
    expect(await response.json()).toMatchObject({
      available: false,
      reason: "lite-boundary",
      artifact: null,
    });
  });

  it("serves only the local-shadow trust artifact with no-store", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(
      new Request("http://localhost/v391", {
        headers: { "x-forwarded-for": "127.0.0.1" },
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-atlas-temperature-trust-region")).toBe(
      "v391",
    );
    const text = await response.text();
    expect(Buffer.byteLength(text, "utf8")).toBeLessThan(128 * 1024);
    const body = JSON.parse(text);
    expect(body.artifact.minima).toMatchObject({
      linearTrustRadius: 0.003,
      quadraticTrustRadius: 0.01,
    });
    expect(body.artifact.method.stressGridIsPhysicalUncertainty).toBe(false);
  });
});

import { beforeEach, describe, expect, it } from "vitest";
import { resetKerrGeometryConditionedTemperatureServerV388CacheForTests } from "../../../../../lib/kerrGeometryConditionedTemperatureServerV388";
import { GET } from "./route";

describe("v388 conditioned temperature route", () => {
  beforeEach(() => {
    resetKerrGeometryConditionedTemperatureServerV388CacheForTests();
  });

  it("keeps Lite unavailable", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    const response = await GET(new Request("http://localhost/v388-lite"));
    expect(await response.json()).toMatchObject({
      available: false,
      reason: "lite-boundary",
    });
  });

  it("serves the local-shadow replay with no-store", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(
      new Request("http://localhost/v388", {
        headers: { "x-forwarded-for": "127.0.0.1" },
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-atlas-conditioned-temperature")).toBe(
      "v388",
    );
    const body = await response.json();
    expect(body.artifact.identifiability.geometryConditionedRank).toBe(2);
    expect(body.artifact.qualification.absoluteTemperatureAuthorityGranted).toBe(
      false,
    );
  });
});

import { beforeEach, describe, expect, it } from "vitest";
import { resetKerrPhotonSourceIdentifiabilityServerV387CacheForTests } from "../../../../../lib/kerrPhotonSourceIdentifiabilityServerV387";
import { GET } from "./route";

describe("v387 photon identifiability route", () => {
  beforeEach(() => {
    resetKerrPhotonSourceIdentifiabilityServerV387CacheForTests();
  });

  it("keeps Lite unavailable", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    const response = await GET(new Request("http://localhost/v387-lite"));
    expect(await response.json()).toMatchObject({
      available: false,
      reason: "lite-boundary",
    });
  });

  it("serves the local-shadow rank audit with no-store", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(
      new Request("http://localhost/v387", {
        headers: { "x-forwarded-for": "127.0.0.1" },
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-atlas-photon-identifiability")).toBe(
      "v387",
    );
    const body = await response.json();
    expect(body.artifact.global.rank).toBe(1);
    expect(body.artifact.covarianceAdmission.covariancePackAvailable).toBe(
      false,
    );
  });
});

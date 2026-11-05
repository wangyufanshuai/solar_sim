import { beforeEach, describe, expect, it } from "vitest";
import { resetKerrPhysicalObservationAdmissionServerV397CacheForTests } from "../../../../../lib/kerrPhysicalObservationAdmissionServerV397";
import { GET } from "./route";

describe("v397 observation admission route", () => {
  beforeEach(() => resetKerrPhysicalObservationAdmissionServerV397CacheForTests());

  it("keeps Lite unavailable", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    const response = await GET(new Request("http://localhost/v397-lite"));
    expect(await response.json()).toMatchObject({ available: false, reason: "lite-boundary", artifact: null });
  });

  it("serves only the bounded local-shadow artifact", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/v397", { headers: { "x-forwarded-for": "127.0.0.1" } }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-atlas-observation-admission")).toBe("v397");
    const text = await response.text();
    expect(Buffer.byteLength(text, "utf8")).toBeLessThan(128 * 1024);
    expect(JSON.parse(text).artifact.productionAdmission).toMatchObject({ physicalObservationPackAvailable: false, availableSources: 0, availableCrossLinks: 0 });
  });
});

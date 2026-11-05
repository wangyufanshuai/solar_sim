import { beforeEach, describe, expect, it } from "vitest";
import { resetKerrPhysicalObservationIntakeServerV398CacheForTests } from "../../../../../lib/kerrPhysicalObservationIntakeServerV398";
import { GET } from "./route";

describe("v398 intake route", () => {
  beforeEach(() => resetKerrPhysicalObservationIntakeServerV398CacheForTests());
  it("keeps Lite unavailable", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    const response = await GET(new Request("http://localhost/v398-lite"));
    expect(await response.json()).toMatchObject({ available: false, reason: "lite-boundary", artifact: null });
  });
  it("serves the local-shadow inspect artifact with no-store", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/v398", { headers: { "x-forwarded-for": "127.0.0.1" } }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-atlas-observation-intake")).toBe("v398");
    const text = await response.text();
    expect(Buffer.byteLength(text, "utf8")).toBeLessThan(128 * 1024);
    expect(JSON.parse(text).artifact.inspect).toMatchObject({ stagingManifestPresent: false, compileExecuted: false, candidatePublished: false });
  });
});

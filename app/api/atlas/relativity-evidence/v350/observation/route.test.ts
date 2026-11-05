import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const originalProfile = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => { if (originalProfile == null) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = originalProfile; });

describe("v350 observation route", () => {
  it("keeps Lite isolated and returns explicit applicability", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(await (await GET(new Request("http://localhost/api/atlas/relativity-evidence/v350/observation"))).json()).toMatchObject({ available: false, reason: "lite-boundary" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v350/observation", { headers: { "x-forwarded-for": "127.0.0.380" } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ available: true, artifact: { counts: { rowCount: 12 }, availability: { measuredDetectorCounts: "unavailable-synthetic-model-only", celestialWcs: "unavailable-sparse-index-grid" } } });
  });
});

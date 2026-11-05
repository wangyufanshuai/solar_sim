import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const originalProfile = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => { if (originalProfile == null) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = originalProfile; });

describe("v350 evidence route", () => {
  it("keeps Lite unavailable and exposes bounded summary", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(await (await GET(new Request("http://localhost/api/atlas/relativity-evidence/v350"))).json()).toMatchObject({ available: false, reason: "lite-boundary" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v350", { headers: { "x-forwarded-for": "127.0.0.390" } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ available: true, snapshot: { current: { v350: { rowCount: 12, measuredDetectorCounts: "unavailable-synthetic-model-only", denseStatus: "incomplete-0-of-49" } } } });
  });
});

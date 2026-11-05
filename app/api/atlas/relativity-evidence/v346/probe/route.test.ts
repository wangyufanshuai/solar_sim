import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";
const originalProfile = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => { if (originalProfile == null) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = originalProfile; });
describe("v346 science image probe route", () => {
  it("is Lite-isolated and serves a bounded exact-SHA artifact", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    const lite = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v346/probe", { headers: { "x-forwarded-for": "127.0.0.352" } })); expect(lite.status).toBe(404); expect(await lite.json()).toMatchObject({ reason: "lite-boundary" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v346/probe", { headers: { "x-forwarded-for": "127.0.0.353" } })); const document = await response.json();
    expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toContain("no-store"); expect(response.headers.get("x-atlas-science-probe")).toBe("v346");
    expect(document).toMatchObject({ status: "qualified-index-coordinate-probe", indexCoordinates: { celestialWcsAvailable: false }, denseCampaignStatus: "incomplete-0-of-49" }); expect(document.cells).toHaveLength(12);
  });
});

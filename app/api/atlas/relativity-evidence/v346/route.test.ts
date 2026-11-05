import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";
const originalProfile = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => { if (originalProfile == null) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = originalProfile; });
describe("v346 probe evidence route", () => {
  it("keeps Lite unavailable and returns a bounded probe summary", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite"; const lite = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v346", { headers: { "x-forwarded-for": "127.0.0.354" } })); expect(await lite.json()).toMatchObject({ available: false, reason: "lite-boundary" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full"; const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v346", { headers: { "x-forwarded-for": "127.0.0.355" } })); expect(response.status).toBe(200); expect(await response.json()).toMatchObject({ available: true, snapshot: { current: { v346: { hitCount: 12, releaseBaseline: true, celestialWcs: "unavailable", denseStatus: "incomplete-0-of-49" } } } });
  });
});

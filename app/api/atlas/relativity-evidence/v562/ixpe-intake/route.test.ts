import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const original = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => {
  if (original === undefined) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
  else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = original;
});
describe("IXPE intake v562 route", () => {
  it("is unavailable outside local-shadow", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v562/ixpe-intake"));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ available: false, reason: "local-shadow-only", summary: null });
  });
  it("serves the blocked negative evidence in local-shadow", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v562/ixpe-intake", { headers: { "x-forwarded-for": "127.0.0.55" } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ available: true, reason: "ready", summary: { target: "Cyg X-1", qualification: { measuredAuthorityGranted: false } } });
  });
});

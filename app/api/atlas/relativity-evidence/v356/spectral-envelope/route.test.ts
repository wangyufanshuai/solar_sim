import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const originalProfile = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => { if (originalProfile == null) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = originalProfile; });

describe("v356 envelope route", () => {
  it("keeps Lite isolated and serves bounded envelope metadata", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(await (await GET(new Request("http://localhost/api/atlas/relativity-evidence/v356/spectral-envelope"))).json()).toMatchObject({ available: false, reason: "lite-boundary" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v356/spectral-envelope", { headers: { "x-forwarded-for": "127.0.0.470" } }));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-atlas-spectral-envelope")).toBe("v356");
    expect(await response.json()).toMatchObject({ available: true, artifact: { counts: { envelope2DCount: 12, envelope3DPointCount: 168 }, fullMeasuredEnvelopeAuthority: "unavailable-input-covariance-is-synthetic-not-measured" } });
  });
});

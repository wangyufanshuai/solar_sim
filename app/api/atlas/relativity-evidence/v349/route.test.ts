import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const originalProfile = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => { if (originalProfile == null) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = originalProfile; });

describe("v349 visual evidence route", () => {
  it("keeps V8 Lite-hidden and returns bounded runtime truth", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    const lite = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v349", { headers: { "x-forwarded-for": "127.0.0.370" } }));
    expect(await lite.json()).toMatchObject({ available: false, reason: "lite-boundary" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v349", { headers: { "x-forwarded-for": "127.0.0.371" } }));
    expect(response.status).toBe(200);
    expect(Number(response.headers.get("content-length") ?? "0")).toBeLessThanOrEqual(128 * 1024);
    expect(await response.json()).toMatchObject({ available: true, snapshot: { current: { v349: { runtimeMatrixRows: 32, runtimeGroupCount: 8, presentationConsumer: "spectral-ribbon-reticle-channel-separation-seeded-overlay", scienceBufferMutationAllowed: false, denseStatus: "incomplete-0-of-49" } } } });
  });
});

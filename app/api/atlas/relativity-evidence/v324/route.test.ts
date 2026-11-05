import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const originalProfile = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => {
  if (originalProfile == null) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
  else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = originalProfile;
});

describe("v324 versioned relativity evidence route", () => {
  it("keeps the versioned snapshot unavailable in Lite", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v324"));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ version: "v324-relativity-evidence-response", available: false, reason: "lite-boundary", snapshot: null });
  });

  it("returns the bounded Science A/B row without host paths", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v324"));
    const text = await response.text();
    expect(response.status).toBe(200);
    expect(new TextEncoder().encode(text).byteLength).toBeLessThanOrEqual(128 * 1024);
    expect(text).not.toContain(process.cwd());
    expect(JSON.parse(text)).toMatchObject({ available: true, reason: "ready", snapshot: { current: { v324: { status: "science-profile-equivalent-browser-pending", scienceTokenEquivalent: true, cinematicTokensDistinct: true, scienceDigestStable: true } } } });
  });
});

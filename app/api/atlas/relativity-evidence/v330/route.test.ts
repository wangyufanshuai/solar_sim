import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const originalProfile = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => {
  if (originalProfile == null) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
  else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = originalProfile;
});

describe("v330 versioned relativity evidence route", () => {
  it("keeps the five-row observatory snapshot unavailable in Lite", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v330", { headers: { "x-forwarded-for": "127.0.0.330" } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ version: "v330-relativity-evidence-response", available: false, reason: "lite-boundary", snapshot: null });
  });

  it("returns bounded sanitized v325-v329 evidence without host paths", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v330", { headers: { "x-forwarded-for": "127.0.0.331" } }));
    const text = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-atlas-relativity-evidence")).toBe("v330");
    expect(new TextEncoder().encode(text).byteLength).toBeLessThanOrEqual(128 * 1024);
    expect(text).not.toContain(process.cwd());
    expect(text).not.toMatch(/"(?:host|pid|absolutePath)"/);
    expect(JSON.parse(text)).toMatchObject({
      available: true,
      reason: "ready",
      snapshot: { current: {
        v325: { status: "componentwise-uncertainty-qualified-browser-pending", bandMeasurementCount: 12 },
        v326: { status: "sanitized-provenance-qualified-browser-pending", noHostPathPid: true },
        v327: { status: "science-cinematic-ab-qualified-browser-pending", buffersDisjoint: true },
        v328: { status: "photon-observables-qualified-browser-pending", detectorIndependent: true },
        v329: { status: "single-flight-lifecycle-qualified-browser-pending", acquisitionCountFixture: 1 },
      } },
    });
  });
});

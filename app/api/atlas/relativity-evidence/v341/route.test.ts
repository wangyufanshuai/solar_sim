import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const originalProfile = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => { if (originalProfile == null) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = originalProfile; });

describe("v341 bounded observation evidence route", () => {
  it("keeps the product unavailable in Lite", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v341", { headers: { "x-forwarded-for": "127.0.0.341" } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ version: "v341-relativity-evidence-response", available: false, reason: "lite-boundary", snapshot: null });
  });

  it("returns bounded science/cinematic summaries and preserves dense incomplete", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v341", { headers: { "x-forwarded-for": "127.0.0.342" } }));
    const text = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-atlas-relativity-evidence")).toBe("v341");
    expect(new TextEncoder().encode(text).byteLength).toBeLessThanOrEqual(128 * 1024);
    expect(text).not.toContain(process.cwd());
    expect(text).not.toMatch(/"(?:host|pid|absolutePath)"/);
    expect(JSON.parse(text)).toMatchObject({ available: true, reason: "ready", snapshot: { version: "v341-relativity-evidence-snapshot", current: { v340: { runtimeMatrixRows: 24 }, v341: { bandMeasurementCount: 12, scienceProfileInvariant: true, cinematicPairwiseDistinct: true, denseStatus: "incomplete-0-of-49" } } } });
  });
});

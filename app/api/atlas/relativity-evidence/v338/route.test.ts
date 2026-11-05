import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const originalProfile = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => { if (originalProfile == null) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = originalProfile; });

describe("v338 bounded evidence route", () => {
  it("keeps v336/v337 evidence unavailable in Lite", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v338", { headers: { "x-forwarded-for": "127.0.0.338" } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ version: "v338-relativity-evidence-response", available: false, reason: "lite-boundary", snapshot: null });
  });

  it("returns sanitized v336/v337 summaries with dense incomplete boundary", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v338", { headers: { "x-forwarded-for": "127.0.0.339" } }));
    const text = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-atlas-relativity-evidence")).toBe("v338");
    expect(new TextEncoder().encode(text).byteLength).toBeLessThanOrEqual(128 * 1024);
    expect(text).not.toContain(process.cwd());
    expect(text).not.toMatch(/"(?:host|pid|absolutePath)"/);
    expect(JSON.parse(text)).toMatchObject({ available: true, reason: "ready", snapshot: { version: "v338-relativity-evidence-snapshot", current: { v336: { transitionCount: 3, sceneRevisionDelta: 0, cameraLeaseBaseline: true, singleCanvasStable: true }, v337: { sampleCount: 16, scientificBufferFieldCount: 67, allScientificBuffersByteIdentical: true, scienceOutputProfileInvariant: true, cinematicProfileOutputsDistinct: true } } } });
  });
});

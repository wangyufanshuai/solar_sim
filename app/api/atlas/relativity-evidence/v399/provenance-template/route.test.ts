import { beforeEach, describe, expect, it } from "vitest";
import { resetKerrPhysicalObservationTemplateServerV399CacheForTests } from "../../../../../lib/kerrPhysicalObservationTemplateServerV399";
import { GET } from "./route";

describe("v399 provenance template route", () => {
  beforeEach(() => resetKerrPhysicalObservationTemplateServerV399CacheForTests());
  it("keeps Lite unavailable", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    const response = await GET(new Request("http://localhost/v399-lite"));
    expect(await response.json()).toMatchObject({ available: false, reason: "lite-boundary", artifact: null });
  });
  it("serves the bounded local-shadow topology", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/v399", { headers: { "x-forwarded-for": "127.0.0.1" } }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-atlas-provenance-template")).toBe("v399");
    const text = await response.text();
    expect(Buffer.byteLength(text, "utf8")).toBeLessThan(128 * 1024);
    expect(JSON.parse(text).artifact).toMatchObject({ diagnostic: { missingFileCount: 13, readyForCompile: false }, topology: { nodeCount: 16, edgeCount: 15, actualSourceCount: 0 } });
  });
});

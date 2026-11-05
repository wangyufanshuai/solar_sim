import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetKerrScatteringOracleServerV408CacheForTests } from "../../../../../lib/kerrScatteringOracleServerV408";
import { GET } from "./route";

const previousDelivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
beforeEach(() => resetKerrScatteringOracleServerV408CacheForTests());
afterEach(() => { if (previousDelivery === undefined) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = previousDelivery; });

describe("v408 scattering oracle route", () => {
  it("keeps Lite and ordinary standalone unavailable", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(await (await GET(new Request("http://localhost/v408-lite"))).json()).toMatchObject({ available: false, reason: "lite-boundary", summary: null });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    expect(await (await GET(new Request("http://localhost/v408-standalone"))).json()).toMatchObject({ available: false, reason: "local-shadow-only", summary: null });
  });

  it("serves a bounded summary and separates the complete portable envelope", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const summaryResponse = await GET(new Request("http://localhost/v408", { headers: { "x-forwarded-for": "127.0.0.41" } }));
    const summaryText = await summaryResponse.text();
    expect(summaryResponse.headers.get("x-atlas-kerr-scattering-oracle")).toBe("v408-summary");
    expect(Buffer.byteLength(summaryText, "utf8")).toBeLessThan(128 * 1024);
    const payload = JSON.parse(summaryText);
    expect(payload.summary.rayComparisons).toHaveLength(4);
    expect(payload.summary.curveEnvelope).not.toHaveProperty("samples");
    const download = await GET(new Request("http://localhost/v408?download=1", { headers: { "x-forwarded-for": "127.0.0.42" } }));
    expect(download.headers.get("x-atlas-kerr-scattering-oracle")).toBe("v408-full-artifact");
    expect(download.headers.get("content-disposition")).toContain("orbit-atlas-v408-scattering-oracle-portable-envelope.json");
    const artifact = await download.json();
    expect(artifact.view.curveEnvelope.samples).toHaveLength(181);
  });
});

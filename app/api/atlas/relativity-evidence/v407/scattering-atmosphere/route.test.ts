import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetKerrScatteringAtmosphereServerV407CacheForTests } from "../../../../../lib/kerrScatteringAtmosphereServerV407";
import { GET } from "./route";

const previousDelivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
beforeEach(() => resetKerrScatteringAtmosphereServerV407CacheForTests());
afterEach(() => { if (previousDelivery === undefined) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = previousDelivery; });

describe("v407 scattering atmosphere route", () => {
  it("keeps Lite and ordinary standalone unavailable", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(await (await GET(new Request("http://localhost/v407-lite"))).json()).toMatchObject({ available: false, reason: "lite-boundary", summary: null });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    expect(await (await GET(new Request("http://localhost/v407-standalone"))).json()).toMatchObject({ available: false, reason: "local-shadow-only", summary: null });
  });

  it("serves a bounded summary and separates the complete angle/sample artifact", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const summaryResponse = await GET(new Request("http://localhost/v407", { headers: { "x-forwarded-for": "127.0.0.31" } }));
    const summaryText = await summaryResponse.text();
    expect(summaryResponse.headers.get("x-atlas-kerr-scattering")).toBe("v407-summary");
    expect(Buffer.byteLength(summaryText, "utf8")).toBeLessThan(128 * 1024);
    const payload = JSON.parse(summaryText);
    expect(payload.summary).not.toHaveProperty("samples");
    expect(payload.summary.angleAudit).not.toHaveProperty("records");
    expect(payload.summary.referenceRays).toHaveLength(4);
    const download = await GET(new Request("http://localhost/v407?download=1", { headers: { "x-forwarded-for": "127.0.0.32" } }));
    expect(download.headers.get("x-atlas-kerr-scattering")).toBe("v407-full-artifact");
    expect(download.headers.get("content-disposition")).toContain("orbit-atlas-v407-scattering-atmosphere-short-gate.json");
    const artifact = await download.json();
    expect(artifact.view.angleAudit.records).toHaveLength(4);
    expect(artifact.view.samples).toHaveLength(24);
  });
});

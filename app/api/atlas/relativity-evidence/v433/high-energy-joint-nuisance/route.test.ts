import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetKerrHighEnergyJointNuisanceServerCacheForTestsV433 } from "../../../../../lib/kerrHighEnergyJointNuisanceServerV433";
import { GET } from "./route";

const previous = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
beforeEach(() => resetKerrHighEnergyJointNuisanceServerCacheForTestsV433());
afterEach(() => { if (previous === undefined) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = previous; });

describe("v433 joint nuisance route", () => {
  it("keeps Lite and ordinary standalone unavailable", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(await (await GET(new Request("http://localhost/v433-lite"))).json()).toMatchObject({ available: false, reason: "lite-boundary" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    expect(await (await GET(new Request("http://localhost/v433-full"))).json()).toMatchObject({ available: false, reason: "local-shadow-only" });
  });

  it("serves a bounded summary and seven whitelisted exports", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/v433", { headers: { "x-forwarded-for": "127.0.0.11" } }));
    const body = await response.text();
    expect(response.headers.get("x-atlas-kerr-joint-nuisance")).toBe("v433-summary");
    expect(Buffer.byteLength(body, "utf8")).toBeLessThan(128 * 1024);
    expect(JSON.parse(body).summary).toMatchObject({ model: { covarianceDimension: 24, familyCount: 2, measuredCrossBlockIndependenceAvailable: false }, scienceBoundary: { status: "implemented-not-admitted", admitted: false }, counts: { monteCarloDrawCount: 16384, scienceResponseApplicationCount: 0 } });
    for (const [format, ip] of [["json", 12], ["oracle", 13], ["contract", 14], ["boundary", 15], ["csv", 16], ["fits", 17], ["png", 18]] as const) expect((await GET(new Request(`http://localhost/v433?download=${format}`, { headers: { "x-forwarded-for": `127.0.0.${ip}` } }))).status).toBe(200);
    expect((await GET(new Request("http://localhost/v433?download=../secret", { headers: { "x-forwarded-for": "127.0.0.19" } }))).status).toBe(400);
  });
});

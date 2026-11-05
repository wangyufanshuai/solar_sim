import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetKerrHighEnergyLikelihoodStressServerCacheForTestsV431 } from "../../../../../lib/kerrHighEnergyLikelihoodStressServerV431";
import { GET } from "./route";

const previous = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
beforeEach(() => resetKerrHighEnergyLikelihoodStressServerCacheForTestsV431());
afterEach(() => { if (previous === undefined) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = previous; });

describe("v431 likelihood stress route", () => {
  it("keeps Lite and ordinary standalone unavailable", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(await (await GET(new Request("http://localhost/v431-lite"))).json()).toMatchObject({ available: false, reason: "lite-boundary" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    expect(await (await GET(new Request("http://localhost/v431-full"))).json()).toMatchObject({ available: false, reason: "local-shadow-only" });
  });
  it("serves a bounded summary and six whitelisted exports", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/v431", { headers: { "x-forwarded-for": "127.0.0.244" } }));
    const body = await response.text();
    expect(response.headers.get("x-atlas-kerr-likelihood-stress")).toBe("v431-summary");
    expect(Buffer.byteLength(body, "utf8")).toBeLessThan(128 * 1024);
    expect(JSON.parse(body).summary).toMatchObject({ campaign: { scenarioCount: 6, syntheticCountCellCount: 73728 }, counts: { measuredObservedCountCount: 0, measuredValidationRunCount: 0, alternativeLikelihoodImplementationQualifiedCount: 0 } });
    for (const [format, ip] of [["json", 245], ["oracle", 246], ["contract", 247], ["csv", 248], ["fits", 249], ["png", 250]] as const) expect((await GET(new Request(`http://localhost/v431?download=${format}`, { headers: { "x-forwarded-for": `127.0.0.${ip}` } }))).status).toBe(200);
    expect((await GET(new Request("http://localhost/v431?download=../secret", { headers: { "x-forwarded-for": "127.0.0.251" } }))).status).toBe(400);
  });
});

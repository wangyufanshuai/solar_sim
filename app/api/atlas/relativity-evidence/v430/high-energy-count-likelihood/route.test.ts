import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetKerrHighEnergyCountLikelihoodServerCacheForTestsV430 } from "../../../../../lib/kerrHighEnergyCountLikelihoodServerV430";
import { GET } from "./route";

const previous = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
beforeEach(() => resetKerrHighEnergyCountLikelihoodServerCacheForTestsV430());
afterEach(() => { if (previous === undefined) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = previous; });

describe("v430 count-likelihood route", () => {
  it("keeps Lite and ordinary standalone unavailable", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(await (await GET(new Request("http://localhost/v430-lite"))).json()).toMatchObject({ available: false, reason: "lite-boundary" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    expect(await (await GET(new Request("http://localhost/v430-full"))).json()).toMatchObject({ available: false, reason: "local-shadow-only" });
  });

  it("serves a bounded summary and six whitelisted exports", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/v430", { headers: { "x-forwarded-for": "127.0.0.236" } }));
    const body = await response.text();
    expect(response.headers.get("x-atlas-kerr-count-likelihood")).toBe("v430-summary");
    expect(Buffer.byteLength(body, "utf8")).toBeLessThan(128 * 1024);
    expect(JSON.parse(body).summary.counts).toMatchObject({ measuredObservedCountCount: 0, measuredResidualMetricCount: 0, measuredValidationRunCount: 0, scienceResponseApplicationCount: 0 });
    for (const [format, ip] of [["json", 237], ["oracle", 238], ["contract", 239], ["csv", 240], ["fits", 241], ["png", 242]] as const) {
      expect((await GET(new Request(`http://localhost/v430?download=${format}`, { headers: { "x-forwarded-for": `127.0.0.${ip}` } }))).status).toBe(200);
    }
    expect((await GET(new Request("http://localhost/v430?download=../secret", { headers: { "x-forwarded-for": "127.0.0.243" } }))).status).toBe(400);
  });
});

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetKerrHighEnergyResponseAcquisitionServerCacheForTestsV427 } from "../../../../../lib/kerrHighEnergyResponseAcquisitionPackServerV427";
import { GET } from "./route";

const previous = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
beforeEach(() => resetKerrHighEnergyResponseAcquisitionServerCacheForTestsV427());
afterEach(() => { if (previous === undefined) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = previous; });
describe("v427 high-energy response acquisition route", () => {
  it("keeps Lite and ordinary standalone unavailable", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(await (await GET(new Request("http://localhost/v427-lite"))).json()).toMatchObject({ available: false, reason: "lite-boundary" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    expect(await (await GET(new Request("http://localhost/v427-full"))).json()).toMatchObject({ available: false, reason: "local-shadow-only" });
  });
  it("serves a bounded summary and four whitelisted exports", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/v427", { headers: { "x-forwarded-for": "127.0.0.215" } }));
    const body = await response.text();
    expect(response.headers.get("x-atlas-kerr-response-acquisition")).toBe("v427-summary");
    expect(Buffer.byteLength(body, "utf8")).toBeLessThan(128 * 1024);
    expect(JSON.parse(body).summary.counts).toMatchObject({ measurementTemplateDataRowCount: 0, measuredDataRowCount: 0, scienceResponseApplicationCount: 0 });
    for (const [format, ip] of [["json", 216], ["zip", 217], ["fits", 218], ["png", 219]] as const) expect((await GET(new Request(`http://localhost/v427?download=${format}`, { headers: { "x-forwarded-for": `127.0.0.${ip}` } }))).status).toBe(200);
    expect((await GET(new Request("http://localhost/v427?download=../secret", { headers: { "x-forwarded-for": "127.0.0.220" } }))).status).toBe(400);
  });
});

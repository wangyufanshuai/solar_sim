import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetKerrHighEnergyResponseIntakeServerCacheForTestsV428 } from "../../../../../lib/kerrHighEnergyResponseIntakeServerV428";
import { GET } from "./route";

const previous = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
beforeEach(() => resetKerrHighEnergyResponseIntakeServerCacheForTestsV428());
afterEach(() => { if (previous === undefined) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = previous; });
describe("v428 high-energy response intake route", () => {
  it("keeps Lite and ordinary standalone unavailable", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(await (await GET(new Request("http://localhost/v428-lite"))).json()).toMatchObject({ available: false, reason: "lite-boundary" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    expect(await (await GET(new Request("http://localhost/v428-full"))).json()).toMatchObject({ available: false, reason: "local-shadow-only" });
  });
  it("serves a bounded summary and five whitelisted exports", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/v428", { headers: { "x-forwarded-for": "127.0.0.221" } }));
    const body = await response.text();
    expect(response.headers.get("x-atlas-kerr-response-intake")).toBe("v428-summary");
    expect(Buffer.byteLength(body, "utf8")).toBeLessThan(128 * 1024);
    expect(JSON.parse(body).summary.counts).toMatchObject({ measuredSubmissionCount: 0, measuredImportAttemptCount: 0, scienceResponseApplicationCount: 0 });
    for (const [format, ip] of [["json", 222], ["schema", 223], ["report", 224], ["fixture", 225], ["png", 226]] as const) expect((await GET(new Request(`http://localhost/v428?download=${format}`, { headers: { "x-forwarded-for": `127.0.0.${ip}` } }))).status).toBe(200);
    expect((await GET(new Request("http://localhost/v428?download=../secret", { headers: { "x-forwarded-for": "127.0.0.227" } }))).status).toBe(400);
  });
});

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetKerrInstrumentSpectralAdmissionServerV425CacheForTests } from "../../../../../lib/kerrInstrumentSpectralAdmissionServerV425";
import { GET } from "./route";

const previous = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
beforeEach(() => resetKerrInstrumentSpectralAdmissionServerV425CacheForTests());
afterEach(() => { if (previous === undefined) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = previous; });
describe("v425 spectral admission route", () => {
  it("keeps Lite and ordinary standalone unavailable", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(await (await GET(new Request("http://localhost/v425-lite"))).json()).toMatchObject({ available: false, reason: "lite-boundary" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    expect(await (await GET(new Request("http://localhost/v425-full"))).json()).toMatchObject({ available: false, reason: "local-shadow-only" });
  });
  it("serves bounded summary and four whitelisted products", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/v425", { headers: { "x-forwarded-for": "127.0.0.203" } })), body = await response.text();
    expect(response.headers.get("x-atlas-kerr-spectral-admission")).toBe("v425-summary");
    expect(Buffer.byteLength(body, "utf8")).toBeLessThan(128 * 1024);
    expect(JSON.parse(body).summary.counts.responseEligibleSourceCount).toBe(0);
    for (const [format, ip] of [["json", 204], ["csv", 205], ["fits", 206], ["png", 207]] as const) expect((await GET(new Request(`http://localhost/v425?download=${format}`, { headers: { "x-forwarded-for": `127.0.0.${ip}` } }))).status).toBe(200);
    expect((await GET(new Request("http://localhost/v425?download=../secret", { headers: { "x-forwarded-for": "127.0.0.208" } }))).status).toBe(400);
  });
});

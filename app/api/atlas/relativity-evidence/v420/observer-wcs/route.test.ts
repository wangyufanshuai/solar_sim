import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resetKerrObserverPlaneWcsServerV420CacheForTests } from "../../../../../lib/kerrObserverPlaneWcsServerV420";
import { GET } from "./route";

const previous = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
beforeEach(() => resetKerrObserverPlaneWcsServerV420CacheForTests());
afterEach(() => { if (previous === undefined) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = previous; });
describe("v420 observer WCS route", () => {
  it("keeps Lite and ordinary standalone unavailable", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(await (await GET(new Request("http://localhost/v420-lite"))).json()).toMatchObject({ available: false, reason: "lite-boundary" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    expect(await (await GET(new Request("http://localhost/v420-full"))).json()).toMatchObject({ available: false, reason: "local-shadow-only" });
  });
  it("serves bounded summary and four whitelisted products", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/v420", { headers: { "x-forwarded-for": "127.0.0.161" } }));
    const body = await response.text();
    expect(response.headers.get("x-atlas-kerr-observer-wcs")).toBe("v420-summary");
    expect(Buffer.byteLength(body, "utf8")).toBeLessThan(128 * 1024);
    expect(JSON.parse(body).summary.rows).toHaveLength(4);
    for (const [format, ip] of [["json", 162], ["csv", 163], ["fits", 164], ["png", 165]] as const) expect((await GET(new Request(`http://localhost/v420?download=${format}`, { headers: { "x-forwarded-for": `127.0.0.${ip}` } }))).status).toBe(200);
    expect((await GET(new Request("http://localhost/v420?download=../secret", { headers: { "x-forwarded-for": "127.0.0.166" } }))).status).toBe(400);
  });
});

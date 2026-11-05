import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resetKerrAxialPolarizationVectorServerV421CacheForTests } from "../../../../../lib/kerrAxialPolarizationVectorServerV421";
import { GET } from "./route";

const previous = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
beforeEach(() => resetKerrAxialPolarizationVectorServerV421CacheForTests());
afterEach(() => { if (previous === undefined) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = previous; });
describe("v421 axial-vector route", () => {
  it("keeps Lite and ordinary standalone unavailable", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(await (await GET(new Request("http://localhost/v421-lite"))).json()).toMatchObject({ available: false, reason: "lite-boundary" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    expect(await (await GET(new Request("http://localhost/v421-full"))).json()).toMatchObject({ available: false, reason: "local-shadow-only" });
  });
  it("serves a bounded summary and four whitelisted products", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/v421", { headers: { "x-forwarded-for": "127.0.0.171" } }));
    const body = await response.text();
    expect(response.headers.get("x-atlas-kerr-axial-vectors")).toBe("v421-summary");
    expect(Buffer.byteLength(body, "utf8")).toBeLessThan(128 * 1024);
    expect(JSON.parse(body).summary.rows).toHaveLength(4);
    for (const [format, ip] of [["json", 172], ["csv", 173], ["fits", 174], ["png", 175]] as const) expect((await GET(new Request(`http://localhost/v421?download=${format}`, { headers: { "x-forwarded-for": `127.0.0.${ip}` } }))).status).toBe(200);
    expect((await GET(new Request("http://localhost/v421?download=../secret", { headers: { "x-forwarded-for": "127.0.0.176" } }))).status).toBe(400);
  });
});

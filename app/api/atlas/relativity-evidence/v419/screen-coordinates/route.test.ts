import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resetKerrScreenCoordinateServerV419CacheForTests } from "../../../../../lib/kerrScreenCoordinateProvenanceServerV419";
import { GET } from "./route";

const previous = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
beforeEach(() => resetKerrScreenCoordinateServerV419CacheForTests());
afterEach(() => { if (previous === undefined) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = previous; });
describe("v419 screen-coordinate route", () => {
  it("keeps Lite and ordinary standalone unavailable", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(await (await GET(new Request("http://localhost/v419-lite"))).json()).toMatchObject({ available: false, reason: "lite-boundary" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    expect(await (await GET(new Request("http://localhost/v419-full"))).json()).toMatchObject({ available: false, reason: "local-shadow-only" });
  });
  it("serves a bounded summary and four whitelisted formats", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/v419", { headers: { "x-forwarded-for": "127.0.0.151" } }));
    const body = await response.text();
    expect(response.headers.get("x-atlas-kerr-screen-coordinates")).toBe("v419-summary");
    expect(Buffer.byteLength(body, "utf8")).toBeLessThan(128 * 1024);
    expect(JSON.parse(body).summary.rows).toHaveLength(4);
    for (const [format, ip] of [["json", 152], ["csv", 153], ["fits", 154], ["png", 155]] as const) {
      const download = await GET(new Request(`http://localhost/v419?download=${format}`, { headers: { "x-forwarded-for": `127.0.0.${ip}` } }));
      expect(download.status).toBe(200);
      expect(download.headers.get("x-atlas-kerr-screen-coordinates")).toContain(`v419-${format}-`);
    }
    expect((await GET(new Request("http://localhost/v419?download=../secret", { headers: { "x-forwarded-for": "127.0.0.156" } }))).status).toBe(400);
  });
});

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetKerrPredictedPolarimeterServerV424CacheForTests } from "../../../../../lib/kerrPredictedPolarimeterServerV424";
import { GET } from "./route";

const previous = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
beforeEach(() => resetKerrPredictedPolarimeterServerV424CacheForTests());
afterEach(() => {
  if (previous === undefined) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
  else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = previous;
});

describe("v424 predicted polarimeter route", () => {
  it("keeps Lite and ordinary standalone unavailable", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(await (await GET(new Request("http://localhost/v424-lite"))).json()).toMatchObject({ available: false, reason: "lite-boundary" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    expect(await (await GET(new Request("http://localhost/v424-full"))).json()).toMatchObject({ available: false, reason: "local-shadow-only" });
  });
  it("serves a bounded summary and four whitelisted products", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/v424", { headers: { "x-forwarded-for": "127.0.0.197" } }));
    const body = await response.text();
    expect(response.headers.get("x-atlas-kerr-predicted-polarimeter")).toBe("v424-summary");
    expect(Buffer.byteLength(body, "utf8")).toBeLessThan(128 * 1024);
    expect(JSON.parse(body).summary.counts.measuredRowCount).toBe(0);
    for (const [format, ip] of [["json", 198], ["csv", 199], ["fits", 200], ["png", 201]] as const) {
      expect((await GET(new Request(`http://localhost/v424?download=${format}`, { headers: { "x-forwarded-for": `127.0.0.${ip}` } }))).status).toBe(200);
    }
    expect((await GET(new Request("http://localhost/v424?download=../secret", { headers: { "x-forwarded-for": "127.0.0.202" } }))).status).toBe(400);
  });
});

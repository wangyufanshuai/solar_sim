import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";
import { resetKerrDetectorProjectionAdmissionServerCacheForTestsV442 } from "../../../../../lib/kerrDetectorProjectionAdmissionServerV442";
const previous = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => { resetKerrDetectorProjectionAdmissionServerCacheForTestsV442(); if (previous === undefined) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = previous; });
describe("v442 admission route", () => {
  it("keeps Lite and ordinary standalone unavailable", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(await (await GET(new Request("http://localhost/v442-lite"))).json()).toMatchObject({ available: false, reason: "lite-boundary" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    expect(await (await GET(new Request("http://localhost/v442-full"))).json()).toMatchObject({ available: false, reason: "local-shadow-only" });
  });
  it("serves a bounded fail-closed summary and rejects arbitrary export", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/v442", { headers: { "x-forwarded-for": "127.0.0.442" } }));
    const body = await response.text();
    expect(response.headers.get("x-atlas-kerr-detector-projection")).toBe("v442-summary");
    expect(Buffer.byteLength(body, "utf8")).toBeLessThan(128 * 1024);
    expect(JSON.parse(body).summary).toMatchObject({ counts: { qualified: 1, partial: 1, missing: 6, blocked: 3 }, projection: { detectorProjectionAvailable: false } });
    expect((await GET(new Request("http://localhost/v442?download=png", { headers: { "x-forwarded-for": "127.0.0.443" } }))).status).toBe(400);
  });
});

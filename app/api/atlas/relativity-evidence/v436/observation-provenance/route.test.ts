import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";
import { resetKerrObservationProvenanceServerCacheForTestsV436 } from "../../../../../lib/kerrObservationProvenanceServerV436";

const previous = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => { resetKerrObservationProvenanceServerCacheForTestsV436(); if (previous === undefined) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = previous; });
describe("v436 observation provenance route", () => {
  it("enforces Lite and ordinary standalone boundaries", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(await (await GET(new Request("http://localhost/v436-lite"))).json()).toMatchObject({ available: false, reason: "lite-boundary" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    expect(await (await GET(new Request("http://localhost/v436-full"))).json()).toMatchObject({ available: false, reason: "local-shadow-only" });
  });
  it("returns a bounded summary and only two artifact exports", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/v436", { headers: { "x-forwarded-for": "127.0.0.61" } }));
    const body = await response.text();
    expect(response.headers.get("x-atlas-kerr-observation-provenance")).toBe("v436-summary");
    expect(Buffer.byteLength(body, "utf8")).toBeLessThan(128 * 1024);
    expect(JSON.parse(body).summary).toMatchObject({ counts: { diskPayloadCount: 4, captureEscapeNotApplicableCount: 96 }, boundary: { denseAuthority: false } });
    expect((await GET(new Request("http://localhost/v436?download=oracle", { headers: { "x-forwarded-for": "127.0.0.62" } }))).status).toBe(200);
    expect((await GET(new Request("http://localhost/v436?download=png", { headers: { "x-forwarded-for": "127.0.0.63" } }))).status).toBe(400);
  });
});

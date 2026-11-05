import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const previous = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => { if (previous === undefined) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = previous; });
describe("v542 replay compatibility route", () => {
  it("serves a bounded summary and standalone preflight only in local-shadow", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const summary = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v542/replay-compatibility", { headers: { "x-forwarded-for": "127.0.0.547" } }));
    expect(summary.status).toBe(200);
    const payload = await summary.json();
    expect(payload.summary.counts.compatibilityCellCount).toBe(4);
    expect(payload.summary.qualification.crossEnvironmentQualified).toBe(false);
    const validator = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v542/replay-compatibility?download=validator", { headers: { "x-forwarded-for": "127.0.0.548" } }));
    expect(validator.status).toBe(200);
    expect(validator.headers.get("content-type")).toContain("text/x-python");
    expect(validator.headers.get("x-atlas-kerr-product")).toContain("not-production");
    expect(await validator.text()).toContain("importlib.metadata");
  });
  it("fails closed for ordinary standalone and Lite", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    expect((await (await GET(new Request("http://localhost/api/atlas/relativity-evidence/v542/replay-compatibility"))).json()).reason).toBe("local-shadow-only");
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect((await (await GET(new Request("http://localhost/api/atlas/relativity-evidence/v542/replay-compatibility"))).json()).reason).toBe("lite-boundary");
  });
});

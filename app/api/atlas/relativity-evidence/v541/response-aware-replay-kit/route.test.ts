import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const previous = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => { if (previous === undefined) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = previous; });
describe("v541 replay-kit route", () => {
  it("serves summary and exact kit only in local-shadow", async () => { process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow"; const summary = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v541/response-aware-replay-kit", { headers: { "x-forwarded-for": "127.0.0.545" } })); expect(summary.status).toBe(200); expect((await summary.json()).summary.counts.kitMemberCount).toBe(7); const kit = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v541/response-aware-replay-kit?download=kit", { headers: { "x-forwarded-for": "127.0.0.546" } })); expect(kit.status).toBe(200); expect(kit.headers.get("content-type")).toBe("application/zip"); expect(kit.headers.get("x-atlas-kerr-product")).toContain("not-production"); expect(Array.from(new Uint8Array((await kit.arrayBuffer()).slice(0, 4)))).toEqual([0x50, 0x4b, 0x03, 0x04]); });
  it("fails closed for ordinary standalone and Lite", async () => { process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full"; expect((await (await GET(new Request("http://localhost/api/atlas/relativity-evidence/v541/response-aware-replay-kit"))).json()).reason).toBe("local-shadow-only"); process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite"; expect((await (await GET(new Request("http://localhost/api/atlas/relativity-evidence/v541/response-aware-replay-kit"))).json()).reason).toBe("lite-boundary"); });
});

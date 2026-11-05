import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";
const original = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => { if (original === undefined) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = original; });
describe("v495 double-edge route", () => {
  it("is unavailable outside local-shadow", async () => { process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full"; const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v495/redshift-double-edge-identifiability")); expect(await response.json()).toMatchObject({ available: false, reason: "local-shadow-only", summary: null }); });
  it("serves a bounded summary and sandboxed SVG", async () => { process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow"; const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v495/redshift-double-edge-identifiability", { headers: { "x-forwarded-for": "127.0.0.81" } })), body = await response.json(); expect(body.summary.deletionCases).toHaveLength(15); expect(JSON.stringify(body)).not.toContain("pseudoinverse"); const svg = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v495/redshift-double-edge-identifiability?format=svg", { headers: { "x-forwarded-for": "127.0.0.82" } })); expect(svg.headers.get("Content-Security-Policy")).toContain("sandbox"); expect(await svg.text()).toContain("Fifteen deletions below the cut"); });
});

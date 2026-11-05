import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";
const original = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => { if (original == null) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = original; });
describe("v380 measured authority adversarial route", () => {
  it("is local-shadow only and returns a bounded nonpublishable campaign", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite"; expect(await (await GET(new Request("http://localhost/v380-lite"))).json()).toMatchObject({ available: false, reason: "lite-boundary" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow"; const response = await GET(new Request("http://localhost/v380", { headers: { "x-forwarded-for": "127.0.0.380" } })); expect(response.headers.get("cache-control")).toBe("no-store"); expect(response.headers.get("x-atlas-measured-authority-adversarial")).toBe("v380"); const body = await response.text(); expect(Buffer.byteLength(body, "utf8")).toBeLessThan(128 * 1024); expect(JSON.parse(body)).toMatchObject({ available: true, artifact: { caseCount: 12, passedCaseCount: 12, rejectedCaseCount: 10, unavailableCaseCount: 2, deterministicReplay: true, fixtureOnly: true, publishableAsMeasuredAuthority: false } });
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";
const original = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => { if (original == null) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = original; });
describe("v364 calibration pack route", () => {
  it("is local-shadow only and returns five whitelisted downloads", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite"; expect(await (await GET(new Request("http://localhost/v364"))).json()).toMatchObject({ available: false, reason: "lite-boundary" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow"; const response = await GET(new Request("http://localhost/v364", { headers: { "x-forwarded-for": "127.0.0.364" } })); const body = await response.json();
    expect(response.status).toBe(200); expect(response.headers.get("x-atlas-calibration-pack")).toBe("v364"); expect(body).toMatchObject({ available: true, artifact: { counts: { fileCount: 5, measuredDataRowCount: 0 }, measuredPerformanceClaimed: false } }); expect(body.downloads).toHaveLength(5); expect(body.downloads.every((entry: { admissibleAsMeasured: boolean }) => entry.admissibleAsMeasured === false)).toBe(true);
  });
});

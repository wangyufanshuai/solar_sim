import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const original = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => { if (original == null) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = original; });

describe("v363 calibration plan route", () => {
  it("is local-shadow only and exposes a bounded plan without measurement claims", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(await (await GET(new Request("http://localhost/api/atlas/relativity-evidence/v363/calibration-plan"))).json()).toMatchObject({ available: false, reason: "lite-boundary" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    expect(await (await GET(new Request("http://localhost/api/atlas/relativity-evidence/v363/calibration-plan"))).json()).toMatchObject({ available: false, reason: "local-shadow-only" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v363/calibration-plan", { headers: { "x-forwarded-for": "127.0.0.363" } }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get("x-atlas-calibration-plan")).toBe("v363");
    expect(body).toMatchObject({ available: true, artifact: { counts: { acquisitionTaskCount: 9, missingRequirementCount: 11 }, identifiability: { rank: 7, fullColumnRank: true }, measuredPerformanceClaimed: false, taskExecutionStatus: "not-run-plan-only" } });
    expect(JSON.stringify(body).length).toBeLessThan(128 * 1024);
  });
});

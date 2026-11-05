import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const original = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => { if (original == null) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = original; });

describe("v367 calibration authority route", () => {
  it("is local-shadow only and returns the bounded fail-closed inspect artifact", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(await (await GET(new Request("http://localhost/v367"))).json()).toMatchObject({ available: false, reason: "lite-boundary" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/v367", { headers: { "x-forwarded-for": "127.0.0.367" } }));
    expect(response.headers.get("x-atlas-calibration-authority")).toBe("v367");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(Buffer.byteLength(await response.clone().text(), "utf8")).toBeLessThanOrEqual(128 * 1024);
    expect(await response.json()).toMatchObject({ available: true, artifact: { status: "blocked-admission-inputs-unavailable", presentInputCount: 0, admissionExecuted: false, measuredAuthorityGranted: false, automaticPromotionAllowed: false } });
  });
});

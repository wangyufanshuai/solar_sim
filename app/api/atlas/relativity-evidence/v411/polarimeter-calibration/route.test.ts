import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetPolarimeterCalibrationServerV411CacheForTests } from "../../../../../lib/kerrPolarimeterCalibrationServerV411";
import { GET } from "./route";

const previous = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
beforeEach(() => resetPolarimeterCalibrationServerV411CacheForTests());
afterEach(() => { if (previous === undefined) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = previous; });
describe("v411 polarimeter calibration route", () => {
  it("keeps Lite and ordinary standalone unavailable", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(await (await GET(new Request("http://localhost/v411-lite"))).json()).toMatchObject({ available: false, reason: "lite-boundary" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    expect(await (await GET(new Request("http://localhost/v411-full"))).json()).toMatchObject({ available: false, reason: "local-shadow-only" });
  });
  it("serves a bounded summary and separates the full inspect", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/v411", { headers: { "x-forwarded-for": "127.0.0.71" } }));
    const text = await response.text();
    expect(response.headers.get("x-atlas-kerr-calibration")).toBe("v411-summary");
    expect(Buffer.byteLength(text, "utf8")).toBeLessThan(128 * 1024);
    const payload = JSON.parse(text);
    expect(payload.summary).toMatchObject({ schema: { ready: true, requiredInputCount: 11 }, measuredPack: { present: false }, admission: { authorityGranted: false } });
    expect(payload.summary).not.toHaveProperty("requiredInputs");
    const download = await GET(new Request("http://localhost/v411?download=1", { headers: { "x-forwarded-for": "127.0.0.72" } }));
    expect(download.headers.get("x-atlas-kerr-calibration")).toBe("v411-full-inspect");
    expect((await download.json()).requiredInputs).toHaveLength(11);
  });
});

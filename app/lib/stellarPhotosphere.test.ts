import { describe, expect, it } from "vitest";
import { limbDarkeningQuadratic, limbIntensity, photosphereLinearColor } from "./stellarPhotosphere";

describe("stellar photosphere inputs", () => {
  it("orders blackbody colour from red to blue with T_eff and normalises luminance", () => {
    const luminance = ([r, g, b]: readonly number[]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const cool = photosphereLinearColor(3_500);
    const sun = photosphereLinearColor(5_772);
    const hot = photosphereLinearColor(9_940);
    expect(cool[0] / cool[2]).toBeGreaterThan(sun[0] / sun[2]);
    expect(sun[0] / sun[2]).toBeGreaterThan(hot[0] / hot[2]);
    expect(hot[2]).toBeGreaterThan(hot[0]);
    for (const c of [cool, sun, hot]) expect(luminance(c)).toBeCloseTo(1, 1);
  });

  it("is close to white near the D65 temperature", () => {
    const [r, g, b] = photosphereLinearColor(6_504);
    expect(Math.max(r, g, b) / Math.min(r, g, b)).toBeLessThan(1.1);
  });

  it("darkens cool limbs more than hot limbs and keeps the law in [0, 1]", () => {
    const cool = limbDarkeningQuadratic(3_500);
    const hot = limbDarkeningQuadratic(9_940);
    expect(limbIntensity(1, cool)).toBe(1);
    expect(limbIntensity(0, cool)).toBeLessThan(limbIntensity(0, hot));
    for (const t of [2_000, 3_500, 5_800, 9_940, 30_000, 60_000]) {
      const u = limbDarkeningQuadratic(t);
      for (const mu of [0, 0.25, 0.5, 0.75, 1]) {
        const i = limbIntensity(mu, u);
        expect(i).toBeGreaterThanOrEqual(0);
        expect(i).toBeLessThanOrEqual(1);
      }
    }
  });
});

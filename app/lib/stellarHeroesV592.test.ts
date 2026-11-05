import { describe, expect, it } from "vitest";
import { JULIAN_DATE_J2000_V592 } from "./celestialClockV592";
import {
  STELLAR_HEROES_V592,
} from "../data/stellarHeroesV592.generated";
import {
  STELLAR_HERO_BY_ID_V592,
  STELLAR_HERO_IDS_V592,
  resolveStellarRotationPhaseV592,
  stellarInspectionScaleV592,
  stellarTemperatureSrgbV592,
  validateStellarHeroesV592,
} from "./stellarHeroesV592";

describe("stellar heroes v592", () => {
  it("defines all twenty-four requested stars with unique Gaia anchors", () => {
    expect(() => validateStellarHeroesV592()).not.toThrow();
    expect(STELLAR_HERO_IDS_V592).toHaveLength(24);
    expect(new Set(STELLAR_HEROES_V592.map((hero) => hero.gaiaSourceId)).size).toBe(24);
    expect(Math.max(...STELLAR_HEROES_V592.map((hero) => hero.gaiaAnchorAngularDistanceDeg))).toBeLessThanOrEqual(1.5);
  });

  it("keeps render-only Gaia anchors distinct from identity claims", () => {
    expect(STELLAR_HEROES_V592.filter((hero) => hero.gaiaCrossmatchStatus === "gaia-render-anchor-only-not-identity-claim").length).toBeGreaterThan(0);
    expect(STELLAR_HEROES_V592.every((hero) => hero.authority.gaiaAnchor === "catalog")).toBe(true);
  });

  it("models rapid rotators as oblate and slow supergiants as large physical stars", () => {
    expect(STELLAR_HERO_BY_ID_V592.achernar.equatorialPolarRadiusRatio).toBeGreaterThan(1.3);
    expect(STELLAR_HERO_BY_ID_V592.regulus.equatorialPolarRadiusRatio).toBeGreaterThan(1.3);
    expect(stellarInspectionScaleV592("altair")[0]).toBeGreaterThan(stellarInspectionScaleV592("altair")[1]);
    expect(STELLAR_HERO_BY_ID_V592.betelgeuse.radiusSolar).toBeGreaterThan(500);
  });

  it("replays stellar rotation from absolute time in both directions", () => {
    const period = STELLAR_HERO_BY_ID_V592.vega.rotationPeriodDays;
    const start = resolveStellarRotationPhaseV592("vega", JULIAN_DATE_J2000_V592);
    const forward = resolveStellarRotationPhaseV592("vega", JULIAN_DATE_J2000_V592 + period * 0.25);
    const reverse = resolveStellarRotationPhaseV592("vega", JULIAN_DATE_J2000_V592 - period * 0.25);
    expect(start).toBe(0);
    expect(forward).toBeCloseTo(Math.PI / 2, 8);
    expect(reverse).toBeCloseTo(Math.PI * 1.5, 8);
  });

  it("maps temperature to bounded, ordered presentation color", () => {
    const cool = stellarTemperatureSrgbV592(3_500);
    const hot = stellarTemperatureSrgbV592(25_000);
    expect(cool.every((value) => value >= 0 && value <= 1)).toBe(true);
    expect(hot.every((value) => value >= 0 && value <= 1)).toBe(true);
    expect(cool[0]).toBeGreaterThan(cool[2]);
    expect(hot[2]).toBeGreaterThan(hot[0]);
  });
});

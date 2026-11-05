import { describe, expect, it } from "vitest";
import {
  CELESTIAL_ART_FORMAL_PRODUCT_POINTER_V589,
  CELESTIAL_ART_ROUTE_V589,
  CELESTIAL_ORBITS_V589,
  HERO_BODY_SPECS_V589,
  angularDistanceDegV589,
  bpRpToLinearRgbV589,
  celestialOrbitPathV589,
  classifyStarPsfV589,
  deterministicSourceUnitV589,
  heroLodV589,
  resolveExposureV589,
  starSizeV589,
  validateHeroBodySpecsV589,
  visualMagnitudeFluxV589,
} from "./celestialArtV589";

describe("v589 celestial art contract", () => {
  it("isolates the additive candidate from the formal product", () => {
    expect(CELESTIAL_ART_ROUTE_V589).toBe("/local-shadow-v589");
    expect(CELESTIAL_ART_FORMAL_PRODUCT_POINTER_V589).toBe("v263");
  });

  it("locks all sixteen Hero bodies and only permits explicit ice-giant procedural primaries", () => {
    expect(() => validateHeroBodySpecsV589()).not.toThrow();
    expect(HERO_BODY_SPECS_V589).toHaveLength(16);
    expect(new Set(HERO_BODY_SPECS_V589.map((body) => body.id)).size).toBe(16);
    expect(HERO_BODY_SPECS_V589.filter((body) => body.proceduralPrimaryAllowed).map((body) => body.id)).toEqual(["uranus", "neptune"]);
    expect(HERO_BODY_SPECS_V589.every((body) => body.presentationOnly)).toBe(true);
  });

  it("maps magnitude, color, size and PSF deterministically", () => {
    expect(visualMagnitudeFluxV589(1) / visualMagnitudeFluxV589(2)).toBeCloseTo(2.5118864315, 9);
    expect(visualMagnitudeFluxV589(Number.NaN)).toBe(0);
    expect(deterministicSourceUnitV589("123456789")).toBe(deterministicSourceUnitV589(BigInt("123456789")));
    expect(classifyStarPsfV589(2.1, "123")).toBe(2);
    expect(classifyStarPsfV589(6.1, "123")).toBe(1);
    expect(classifyStarPsfV589(12.1, "123")).toBe(0);
    expect(starSizeV589(1, "123")).toBeGreaterThan(starSizeV589(9, "123"));
    expect(bpRpToLinearRgbV589(-0.2)[2]).toBeGreaterThan(bpRpToLinearRgbV589(2.8)[2]);
  });

  it("keeps orbit geometry deterministic and shared between modes", () => {
    expect(CELESTIAL_ORBITS_V589).toHaveLength(16);
    const earth = CELESTIAL_ORBITS_V589.find((orbit) => orbit.bodyId === "earth")!;
    const path = celestialOrbitPathV589(earth, 64);
    expect(path).toHaveLength(65 * 3);
    expect(path.slice(0, 3)).toEqual(path.slice(-3));
    expect(angularDistanceDegV589(10, 20, 10, 20)).toBeCloseTo(0, 8);
  });

  it("locks screen-space LOD and Science exposure", () => {
    expect(heroLodV589(500, "desktop")).toBe(0);
    expect(heroLodV589(120, "desktop")).toBe(1);
    expect(heroLodV589(20, "desktop")).toBe(2);
    expect(resolveExposureV589({ mode: "science", deliveryTier: "vercel-lite", deviceTier: "mobile", selectedBody: "earth", exposurePreset: "extreme-bright" })).toBe(1);
    expect(resolveExposureV589({ mode: "cinematic", deliveryTier: "standalone-full", deviceTier: "desktop", selectedBody: "earth", exposurePreset: "extreme-dark" })).toBe(0.35);
  });
});


import { describe, expect, it } from "vitest";
import {
  FEATURED_CONSTELLATION_CODES_V588,
  HERO_ORBITS_V588,
  V588_FORMAL_PRODUCT_POINTER,
  V588_SCIENTIFIC_PAYLOAD_REFERENCE_SHA256,
  VISUAL_RESTORATION_MANIFEST_SHA256_V588,
  heroAssetLoadPolicyV588,
  orbitLandmarksV588,
  orbitPathV588,
  predictedOrbitV588,
} from "./visualRestorationV588";

describe("v588 visual restoration orbit contract", () => {
  it("keeps four admitted hero planets and the frozen authority boundary", () => {
    expect(HERO_ORBITS_V588.map((orbit) => orbit.id)).toEqual(["earth", "mars", "jupiter", "saturn"]);
    expect(new Set(HERO_ORBITS_V588.flatMap((orbit) => orbit.assetIds)).size).toBe(16);
    expect(HERO_ORBITS_V588.every((orbit) => orbit.assetIds.length > 0)).toBe(true);
    expect(V588_FORMAL_PRODUCT_POINTER).toBe("v263");
    expect(V588_SCIENTIFIC_PAYLOAD_REFERENCE_SHA256).toMatch(/^[a-f0-9]{64}$/);
    expect(VISUAL_RESTORATION_MANIFEST_SHA256_V588).toMatch(/^[a-f0-9]{64}$/);
  });

  it("builds deterministic closed reference orbits and all four landmarks", () => {
    for (const orbit of HERO_ORBITS_V588) {
      const path = orbitPathV588(orbit, 128);
      expect(path).toHaveLength(129);
      expect(path[0]![0]).toBeCloseTo(path.at(-1)![0], 11);
      expect(path[0]![1]).toBeCloseTo(path.at(-1)![1], 11);
      expect(path[0]![2]).toBeCloseTo(path.at(-1)![2], 11);
      const landmarks = orbitLandmarksV588(orbit);
      expect(Object.keys(landmarks).sort()).toEqual(["apoapsis", "ascendingNode", "descendingNode", "periapsis"]);
      expect(Math.hypot(...landmarks.periapsis)).toBeLessThan(Math.hypot(...landmarks.apoapsis));
    }
  });

  it("keeps the velocity forecast deterministic, bounded and presentation-only", () => {
    const earth = HERO_ORBITS_V588[0]!;
    const nominal = predictedOrbitV588(earth, 1, 192);
    const repeated = predictedOrbitV588(earth, 1, 192);
    const raised = predictedOrbitV588(earth, 1.18, 192);
    expect(repeated).toEqual(nominal);
    expect(nominal.bound).toBe(true);
    expect(nominal.points.length).toBeGreaterThan(128);
    expect(nominal.eccentricity).toBeCloseTo(earth.eccentricity, 3);
    expect(raised.eccentricity).toBeGreaterThan(nominal.eccentricity);
    expect(predictedOrbitV588(earth, 10, 32).velocityScale).toBe(1.5);
    expect(predictedOrbitV588(earth, 0, 32).velocityScale).toBe(0.65);
  });

  it("uses KTX2 only for a desktop selected hero and keeps 12 readable default constellations", () => {
    expect(heroAssetLoadPolicyV588("desktop", true)).toBe("ktx2-first");
    expect(heroAssetLoadPolicyV588("desktop", false)).toBe("verified-fallback-only");
    expect(heroAssetLoadPolicyV588("mobile", true)).toBe("verified-fallback-only");
    expect(FEATURED_CONSTELLATION_CODES_V588).toHaveLength(12);
    expect(new Set(FEATURED_CONSTELLATION_CODES_V588).size).toBe(12);
  });
});

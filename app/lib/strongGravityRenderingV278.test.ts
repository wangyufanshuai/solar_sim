import { describe, expect, it } from "vitest";
import {
  STRONG_GRAVITY_RENDER_BOUNDARY_V278,
  kerrIscoRadiusV278,
  liouvilleIntensityInvariantV278,
  novikovThorneFluxV278,
  planckRadianceV278,
} from "./strongGravityRenderingV278";

describe("v278 strong-gravity rendering boundary", () => {
  it("keeps signed-spin ISCO values finite and ordered", () => {
    expect(kerrIscoRadiusV278(0)).toBeCloseTo(6, 12);
    expect(kerrIscoRadiusV278(0.998)).toBeLessThan(3);
    expect(kerrIscoRadiusV278(-0.998)).toBeGreaterThan(6);
  });

  it("produces finite non-negative thin-disk flux outside ISCO", () => {
    const inner = kerrIscoRadiusV278(0.9);
    expect(novikovThorneFluxV278({ spinA: 0.9, radiusM: inner })).toBe(0);
    expect(novikovThorneFluxV278({ spinA: 0.9, radiusM: inner + 3 })).toBeGreaterThanOrEqual(0);
    expect(planckRadianceV278(1e7, 5e14)).toBeGreaterThan(0);
  });

  it("keeps science display constraints explicit", () => {
    expect(STRONG_GRAVITY_RENDER_BOUNDARY_V278.scienceMode.randomNoise).toBe(false);
    expect(STRONG_GRAVITY_RENDER_BOUNDARY_V278.scienceMode.bloom).toBe(false);
    expect(liouvilleIntensityInvariantV278(8, 2)).toBe(1);
    expect(STRONG_GRAVITY_RENDER_BOUNDARY_V278.cinematicMode.mayChangeScientificClassification).toBe(false);
  });
});

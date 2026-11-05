import { describe, expect, it } from "vitest";
import {
  bindAtlasCalibrationHudV505,
  resolveAtlasCalibrationHudProfileV505,
} from "./atlasCalibrationHudProfileV505";

describe("v505 calibration HUD profile", () => {
  it("returns stable frozen references for both presentation modes", () => {
    for (const mode of ["science", "cinematic"] as const) {
      const first = resolveAtlasCalibrationHudProfileV505(mode);
      const second = resolveAtlasCalibrationHudProfileV505(mode);
      expect(first).toBe(second);
      expect(Object.isFrozen(first)).toBe(true);
      expect(Object.isFrozen(first.tokens)).toBe(true);
      expect(Object.isFrozen(first.scienceBoundary)).toBe(true);
    }
  });

  it("keeps strict linear science presentation while allowing seeded-free HUD styling", () => {
    const science = resolveAtlasCalibrationHudProfileV505("science");
    const cinematic = resolveAtlasCalibrationHudProfileV505("cinematic");
    expect(science.tokens.glowOpacity).toBe(0);
    expect(science.tokens.transitionMs).toBe(0);
    expect(cinematic.tokens.glowOpacity).toBeGreaterThan(0);
    expect(cinematic.scienceBoundary).toBe(science.scienceBoundary);
    expect(science.scienceBoundary).toEqual({
      linearScientificReadout: true,
      scientificFieldMutationAllowed: false,
      classificationMutationAllowed: false,
      redshiftMutationAllowed: false,
      evpaMutationAllowed: false,
      intensityMutationAllowed: false,
      randomDrawCount: 0,
    });
  });

  it("preserves the exact science payload reference across mode changes", () => {
    const payload = Object.freeze({
      classification: "disk-hit",
      redshift: 0.82,
      evpaDegrees: 41.5,
      intensity: 1.25,
      artifactSha256: "a".repeat(64),
    });
    const science = bindAtlasCalibrationHudV505("science", payload);
    const cinematic = bindAtlasCalibrationHudV505("cinematic", payload);
    expect(science.sciencePayload).toBe(payload);
    expect(cinematic.sciencePayload).toBe(payload);
    expect(science.sciencePayload).toBe(cinematic.sciencePayload);
    expect(science.scientificFieldMutationAllowed).toBe(false);
    expect(cinematic.scientificFieldMutationAllowed).toBe(false);
  });
});

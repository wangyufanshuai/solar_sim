import { describe, expect, it } from "vitest";
import { V591_ALL_HERO_IDS } from "./celestialConvergenceV591";
import { JULIAN_DATE_J2000_V592 } from "./celestialClockV592";
import {
  CELESTIAL_ROTATION_ADMITTED_BODIES_V592,
  CELESTIAL_ROTATION_INCOMPLETE_BODIES_V592,
  CELESTIAL_ROTATION_KINEMATIC_BODIES_V592,
  resolveBodyOrientationV592,
  serializeOrientationReplayV592,
  solarDifferentialRotationDegPerDayV592,
} from "./celestialRotationV592";

describe("celestial rotation v592", () => {
  it("admits fourteen absolute PCK orientations and all sixteen physical spin kinematics", () => {
    expect(CELESTIAL_ROTATION_ADMITTED_BODIES_V592).toHaveLength(14);
    expect(CELESTIAL_ROTATION_KINEMATIC_BODIES_V592).toHaveLength(16);
    expect(CELESTIAL_ROTATION_INCOMPLETE_BODIES_V592).toEqual(["bennu", "kleopatra"]);
    const bennu = resolveBodyOrientationV592("bennu", JULIAN_DATE_J2000_V592);
    expect(bennu.quaternionScene).not.toBeNull();
    expect(bennu.authority).toBe("rotation-authority-incomplete");
    expect(bennu.kinematicAuthority).toBe("rotation-kinematics-admitted-catalog-pole-native-model-meridian");
    expect(bennu.absolutePrimeMeridian).toBe(false);
  });

  it("preserves prograde and retrograde prime-meridian signs", () => {
    expect(resolveBodyOrientationV592("earth", JULIAN_DATE_J2000_V592).signedRotationDegPerDay).toBeGreaterThan(0);
    expect(resolveBodyOrientationV592("venus", JULIAN_DATE_J2000_V592).signedRotationDegPerDay).toBeLessThan(0);
    expect(resolveBodyOrientationV592("uranus", JULIAN_DATE_J2000_V592).signedRotationDegPerDay).toBeLessThan(0);
  });

  it("keeps the Moon's IAU spin period synchronous with its sidereal orbital period", () => {
    const moon = resolveBodyOrientationV592("moon", JULIAN_DATE_J2000_V592);
    const periodDays = 360 / Math.abs(moon.signedRotationDegPerDay ?? Number.NaN);
    expect(periodDays).toBeCloseTo(27.321661, 5);
  });

  it("returns normalized finite scene quaternions", () => {
    for (const bodyId of CELESTIAL_ROTATION_KINEMATIC_BODIES_V592) {
      const quaternion = resolveBodyOrientationV592(bodyId, JULIAN_DATE_J2000_V592 + 9_123.25).quaternionScene;
      expect(quaternion).not.toBeNull();
      expect(Math.hypot(...(quaternion ?? [0, 0, 0, 0]))).toBeCloseTo(1, 12);
    }
  });

  it("replays the complete orientation packet byte-for-byte", () => {
    const first = serializeOrientationReplayV592(V591_ALL_HERO_IDS, JULIAN_DATE_J2000_V592 + 10_000.125);
    const second = serializeOrientationReplayV592(V591_ALL_HERO_IDS, JULIAN_DATE_J2000_V592 + 10_000.125);
    expect(second).toBe(first);
  });

  it("uses a slower polar photosphere than the solar equator", () => {
    expect(solarDifferentialRotationDegPerDayV592(0)).toBeCloseTo(14.713, 12);
    expect(solarDifferentialRotationDegPerDayV592(Math.PI / 2)).toBeLessThan(solarDifferentialRotationDegPerDayV592(0));
  });
});

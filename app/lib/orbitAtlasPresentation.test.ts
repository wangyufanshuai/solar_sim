import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  ORBIT_ATLAS_V6_SKY,
  ORBIT_ATLAS_LABELS,
  mapOrbitAtlasPositionAu,
  mapOrbitAtlasVector,
  orbitAtlasBodyVisualProfile,
  orbitAtlasDisplayRadius,
} from "./orbitAtlasPresentation";

describe("Orbit Atlas presentation transform", () => {
  it("is monotonic for radial distances", () => {
    expect(orbitAtlasDisplayRadius(0.1)).toBeGreaterThan(0);
    expect(orbitAtlasDisplayRadius(1)).toBeGreaterThan(orbitAtlasDisplayRadius(0.1));
    expect(orbitAtlasDisplayRadius(30)).toBeGreaterThan(orbitAtlasDisplayRadius(1));
  });

  it("keeps direction while compressing radius", () => {
    const mapped = mapOrbitAtlasPositionAu(3, -4, 12, "compressed");
    const originalDirection = new THREE.Vector3(3, -4, 12).normalize();
    expect(mapped.clone().normalize().distanceTo(originalDirection)).toBeLessThan(1e-10);
    expect(mapped.length()).toBeLessThan(new THREE.Vector3(3, -4, 12).length() * 52);
  });

  it("returns physical scene coordinates exactly in physical mode", () => {
    expect(mapOrbitAtlasPositionAu(1.25, -2, 0.5, "physical").toArray()).toEqual([
      65,
      -104,
      26,
    ]);
  });

  it("does not mutate source vectors shared by bodies, routes, or orbit points", () => {
    const point = new THREE.Vector3(1.2, -0.4, 3.1);
    const before = point.clone();
    const mapped = mapOrbitAtlasVector(point, "compressed");
    expect(point.toArray()).toEqual(before.toArray());
    expect(mapped).not.toBe(point);
  });

  it("keeps the v6 sky calibration and Chinese label contract stable", () => {
    expect(ORBIT_ATLAS_V6_SKY.rotation).toEqual([-0.3, 1.42, -0.58]);
    expect(ORBIT_ATLAS_V6_SKY.dustLaneStrength).toBe(0.28);
    expect(ORBIT_ATLAS_LABELS.earth).toBe("地球");
    expect(ORBIT_ATLAS_LABELS.saturn).toBe("土星");
  });

  it("classifies high-value Atlas bodies into material profiles", () => {
    expect(orbitAtlasBodyVisualProfile("sun")).toBe("sun");
    expect(orbitAtlasBodyVisualProfile("earth")).toBe("terrestrial");
    expect(orbitAtlasBodyVisualProfile("jupiter")).toBe("gas-giant");
    expect(orbitAtlasBodyVisualProfile("saturn")).toBe("ringed");
  });
});

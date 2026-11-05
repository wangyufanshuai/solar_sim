import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import {
  applyCameraFrameProjection,
  applyTargetAnchorDelta,
  focusSubjectRadius,
  idealFocusCameraDistance,
  minFocusDistance,
  solveBodyCameraFrame,
} from "./atlasSceneFocusCameraRuntime";

describe("v195 focus camera runtime", () => {
  it("preserves the compressed Atlas framing hierarchy", () => {
    const earth = SOLAR_SYSTEM_BODIES.find(({ id }) => id === "earth")!;
    const saturn = SOLAR_SYSTEM_BODIES.find(({ id }) => id === "saturn")!;
    expect(idealFocusCameraDistance(earth, "inspect", "orbit-atlas", "compressed"))
      .toBeLessThan(idealFocusCameraDistance(saturn, "inspect", "orbit-atlas", "compressed"));
    expect(focusSubjectRadius(saturn, "inspect", "orbit-atlas", "compressed"))
      .toBeGreaterThan(focusSubjectRadius(earth, "inspect", "orbit-atlas", "compressed"));
    expect(minFocusDistance(saturn)).toBeGreaterThan(0);
  });

  it("moves camera and target by the same anchor delta", () => {
    const camera = new THREE.Vector3(10, 20, 30);
    const target = new THREE.Vector3(1, 2, 3);
    applyTargetAnchorDelta(camera, target, new THREE.Vector3(4, 8, 12), new THREE.Vector3());
    expect(camera.toArray()).toEqual([13, 26, 39]);
    expect(target.toArray()).toEqual([4, 8, 12]);
  });

  it("moves a subject left when the safe viewport is left of centre", () => {
    const camera = new THREE.PerspectiveCamera(38, 1440 / 900, 0.01, 10000);
    const previousKey = { current: "" };
    applyCameraFrameProjection(camera, {
      version: "v157-camera-frame-solver-v5",
      distance: 10,
      desiredCoverage: 0.49,
      projectedDiameterPx: 360,
      safeWidthPx: 1080,
      safeHeightPx: 822,
      targetNdcX: -0.25,
      targetNdcY: 0,
      clipped: false,
      framingRadiusScene: 1,
    }, 1440, 900, previousKey);
    expect(camera.view?.offsetX).toBe(180);
  });

  it("composes Saturn around its body disc while retaining a bounded ring silhouette", () => {
    const saturn = SOLAR_SYSTEM_BODIES.find(({ id }) => id === "saturn")!;
    const camera = new THREE.PerspectiveCamera(38, 1440 / 900, 0.01, 10000);
    const frame = solveBodyCameraFrame(
      saturn,
      "inspect",
      "orbit-atlas",
      "compressed",
      camera,
      1440,
      900,
    );
    expect(frame.desiredCoverage).toBeGreaterThanOrEqual(0.38);
    expect(frame.desiredCoverage).toBeLessThanOrEqual(0.48);
    expect(frame.framingRadiusScene).toBeLessThan(focusSubjectRadius(saturn, "inspect", "orbit-atlas", "compressed"));
  });
});

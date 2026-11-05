import { describe, expect, it } from "vitest";
import {
  SKY_TARGET_CAMERA_DISTANCE_SCENE,
  SKY_TARGET_DISTANCE_SCENE,
  SKY_TARGET_ZOOM_MAX_DISTANCE_SCENE,
  SKY_TARGET_ZOOM_MIN_DISTANCE_SCENE,
  clampSkyTargetZoomDistance,
  normalizeSkyTargetDirection,
  skyTargetPosition,
} from "./skyTargetFocus";

describe("sky target focus helpers", () => {
  it("creates a finite visual proxy position from a direction", () => {
    expect(skyTargetPosition([2, 0, 0])).toEqual([
      SKY_TARGET_DISTANCE_SCENE,
      0,
      0,
    ]);
    const pos = skyTargetPosition([1, 2, 3]);
    expect(pos).not.toBeNull();
    expect(pos!.every(Number.isFinite)).toBe(true);
    expect(Math.hypot(...pos!)).toBeCloseTo(SKY_TARGET_DISTANCE_SCENE, 8);
  });

  it("rejects invalid directions and clamps zoom distances", () => {
    expect(normalizeSkyTargetDirection([0, 0, 0])).toBeNull();
    expect(skyTargetPosition([Number.NaN, 0, 0])).toBeNull();
    expect(clampSkyTargetZoomDistance(1)).toBe(SKY_TARGET_ZOOM_MIN_DISTANCE_SCENE);
    expect(clampSkyTargetZoomDistance(99_999)).toBe(SKY_TARGET_ZOOM_MAX_DISTANCE_SCENE);
    expect(clampSkyTargetZoomDistance(Number.NaN)).toBe(
      SKY_TARGET_CAMERA_DISTANCE_SCENE,
    );
  });
});

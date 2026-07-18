import { describe, expect, it } from "vitest";
import {
  CAMERA_FOCUS_DURATION_MAX_MS,
  CAMERA_FOCUS_DURATION_MIN_MS,
  CAMERA_FOCUS_DEFAULT_MS,
  CAMERA_FOCUS_REDUCED_MOTION_MS,
  adaptiveCameraFocusDurationMs,
  cameraFocusCommandKey,
  resolvedCameraFocusDurationMs,
  smootherstep01,
} from "./cameraFocusCommand";

describe("camera focus command", () => {
  it("uses a bounded adaptive duration", () => {
    expect(adaptiveCameraFocusDurationMs(0, 1)).toBe(CAMERA_FOCUS_DEFAULT_MS);
    expect(adaptiveCameraFocusDurationMs(0, 1, "desktop")).toBe(CAMERA_FOCUS_DURATION_MIN_MS);
    expect(adaptiveCameraFocusDurationMs(Math.PI, 256, "mobile")).toBe(
      CAMERA_FOCUS_DURATION_MAX_MS,
    );
    expect(adaptiveCameraFocusDurationMs(Math.PI / 2, 8, "desktop")).toBeGreaterThan(
      CAMERA_FOCUS_DURATION_MIN_MS,
    );
    expect(adaptiveCameraFocusDurationMs(Math.PI, 256, "desktop")).toBeLessThanOrEqual(1000);
  });

  it("uses a continuous smootherstep curve", () => {
    expect(smootherstep01(-1)).toBe(0);
    expect(smootherstep01(0)).toBe(0);
    expect(smootherstep01(0.5)).toBeCloseTo(0.5, 8);
    expect(smootherstep01(1)).toBe(1);
    expect(smootherstep01(2)).toBe(1);
  });

  it("resolves reduced motion without a long cinematic transition", () => {
    expect(resolvedCameraFocusDurationMs(Math.PI, 256, "mobile", true)).toBe(
      CAMERA_FOCUS_REDUCED_MOTION_MS,
    );
    expect(resolvedCameraFocusDurationMs(Math.PI, 256, "mobile", false)).toBe(
      CAMERA_FOCUS_DURATION_MAX_MS,
    );
  });

  it("deduplicates commands by stable command identity", () => {
    expect(
      cameraFocusCommandKey({
        kind: "body",
        bodyIndex: 3,
        mode: "inspect",
        nonce: 9,
      }),
    ).toBe("body:3:inspect:9");
    expect(
      cameraFocusCommandKey({
        kind: "direction",
        direction: [1, 0, 0],
        targetId: "gaia-dr3:123",
        nonce: 10,
      }),
    ).toBe("direction:gaia-dr3:123:10");
  });
});

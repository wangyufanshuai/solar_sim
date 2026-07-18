import { describe, expect, it } from "vitest";
import {
  atlasSafeRectFromOccluder,
  solveAtlasCameraFrameV4,
} from "./atlasCameraFrameSolverV4";

describe("v141 camera frame solver", () => {
  it("moves a desktop subject left of the Passport and keeps 35-55 percent coverage", () => {
    const safeRect = atlasSafeRectFromOccluder({
      viewportWidth: 1280,
      viewportHeight: 720,
      dockHeight: 78,
      occluder: { left: 880, top: 64, right: 1264, bottom: 396, width: 384, height: 332 },
    });
    const frame = solveAtlasCameraFrameV4({
      subjectRadiusScene: 2.6,
      verticalFovDeg: 52,
      viewportWidth: 1280,
      viewportHeight: 720,
      safeRect,
    });
    expect(frame.targetNdcX).toBeLessThan(0);
    expect(frame.projectedDiameterPx / Math.min(frame.safeWidthPx, frame.safeHeightPx)).toBeCloseTo(0.46, 4);
    expect(frame.clipped).toBe(false);
  });

  it("places a mobile subject above the bottom Passport", () => {
    const safeRect = atlasSafeRectFromOccluder({
      viewportWidth: 390,
      viewportHeight: 844,
      dockHeight: 78,
      occluder: { left: 8, top: 430, right: 382, bottom: 750, width: 374, height: 320 },
    });
    const frame = solveAtlasCameraFrameV4({
      subjectRadiusScene: 1,
      verticalFovDeg: 52,
      viewportWidth: 390,
      viewportHeight: 844,
      safeRect,
    });
    expect(frame.targetNdcY).toBeGreaterThan(0);
    expect(frame.safeHeightPx).toBeLessThan(430);
  });

  it("supports compensated framing when the safe viewport is narrower than the screen", () => {
    const frame = solveAtlasCameraFrameV4({
      subjectRadiusScene: 1,
      verticalFovDeg: 52,
      viewportWidth: 1440,
      viewportHeight: 900,
      safeRect: { left: 0, top: 0, right: 980, bottom: 720, viewportWidth: 1440, viewportHeight: 900 },
      desiredCoverage: 0.575,
    });
    expect(frame.desiredCoverage).toBe(0.575);
    expect(frame.projectedDiameterPx / 900).toBeGreaterThanOrEqual(0.4);
  });
});

export type MajorMoonInspectionDeviceTierV592 = "desktop" | "mobile";

export type MajorMoonInspectionCameraSpecV592 = Readonly<{
  position: readonly [number, number, number];
  fovDeg: number;
  maximumViewportWidthFraction: number;
  maximumViewportHeightFraction: number;
}>;

const CAMERA_SPECS_V592: Readonly<Record<MajorMoonInspectionDeviceTierV592, MajorMoonInspectionCameraSpecV592>> = Object.freeze({
  desktop: Object.freeze({
    position: [0.22, 0.10, 3.35] as const,
    fovDeg: 45,
    maximumViewportWidthFraction: 0.92,
    maximumViewportHeightFraction: 0.82,
  }),
  mobile: Object.freeze({
    // Portrait inspection is constrained by width. This distance also leaves
    // room for Titan's 1.035-radius presentation-only haze shell.
    position: [0.06, 0.05, 5.75] as const,
    fovDeg: 49,
    maximumViewportWidthFraction: 0.92,
    maximumViewportHeightFraction: 0.82,
  }),
});

export function resolveMajorMoonInspectionCameraV592(
  deviceTier: MajorMoonInspectionDeviceTierV592,
): MajorMoonInspectionCameraSpecV592 {
  return CAMERA_SPECS_V592[deviceTier];
}

export function estimateMajorMoonScreenDiameterPxV592(
  radius: number,
  distance: number,
  verticalFovDeg: number,
  viewportHeight: number,
): number {
  if (![radius, distance, verticalFovDeg, viewportHeight].every(Number.isFinite)) return Number.NaN;
  if (radius <= 0 || distance <= 0 || verticalFovDeg <= 0 || verticalFovDeg >= 180 || viewportHeight <= 0) return Number.NaN;
  const angularDiameter = 2 * Math.atan2(radius, Math.max(radius, distance));
  return angularDiameter / (verticalFovDeg * Math.PI / 180) * viewportHeight;
}

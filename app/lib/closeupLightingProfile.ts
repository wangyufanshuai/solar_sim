import { VISUAL_CALIBRATION } from "./visualCalibration";

export type BodyCloseupCalibration = {
  roughness: number;
  normalScale: number;
  envMapIntensity: number;
  fillIntensity: number;
  rimIntensity: number;
};

export type CloseupLightingProfile = {
  bodyId: string;
  exposure: number;
  roughness: number;
  normalScale: number;
  envMapIntensity: number;
  fillIntensity: number;
  rimIntensity: number;
  ringLitOpacity?: number;
  ringDarkOpacity?: number;
};

const DEFAULT_CALIBRATION: BodyCloseupCalibration = {
  roughness: 0.82,
  normalScale: 1.0,
  envMapIntensity: 0.16,
  fillIntensity: 0.08,
  rimIntensity: VISUAL_CALIBRATION.planets.rimIntensity,
};

export function bodyCloseupCalibration(bodyId: string): BodyCloseupCalibration {
  const closeups = VISUAL_CALIBRATION.closeups;
  if (bodyId === "earth") return closeups.earth;
  if (bodyId === "moon") return closeups.moon;
  if (bodyId === "jupiter") return closeups.jupiter;
  if (bodyId === "saturn") return closeups.saturn;
  return DEFAULT_CALIBRATION;
}

export function closeupLightingProfile(bodyId: string, active: boolean): CloseupLightingProfile {
  const calibration = bodyCloseupCalibration(bodyId);
  const activeScale = active ? 1 : 0.72;
  return {
    bodyId,
    exposure: bodyId === "sun" ? VISUAL_CALIBRATION.closeups.sun.exposure : 1,
    roughness: calibration.roughness,
    normalScale: calibration.normalScale,
    envMapIntensity: calibration.envMapIntensity * activeScale,
    fillIntensity: calibration.fillIntensity * activeScale,
    rimIntensity: calibration.rimIntensity * activeScale,
    ringLitOpacity: bodyId === "saturn" ? VISUAL_CALIBRATION.closeups.saturn.ringLitOpacity : undefined,
    ringDarkOpacity: bodyId === "saturn" ? VISUAL_CALIBRATION.closeups.saturn.ringDarkOpacity : undefined,
  };
}

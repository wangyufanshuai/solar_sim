import { VISUAL_CALIBRATION } from "./visualCalibration";
import { closeupRenderProfile, type CloseupRenderProfile } from "./closeupRenderProfile";

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
  bandContrast?: number;
  stormContrast?: number;
  ringPhaseContrast?: number;
  cloudSilverLining?: number;
  nightTerminatorCutoff?: number;
  renderProfile: CloseupRenderProfile;
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
  const renderProfile = closeupRenderProfile(bodyId);
  const calibration = bodyId === "default" ? bodyCloseupCalibration(bodyId) : renderProfile;
  const activeScale = active ? 1 : 0.72;
  return {
    bodyId,
    exposure: renderProfile.exposure,
    roughness: calibration.roughness,
    normalScale: calibration.normalScale,
    envMapIntensity: ("envMapIntensity" in calibration ? calibration.envMapIntensity : DEFAULT_CALIBRATION.envMapIntensity) * activeScale,
    fillIntensity: calibration.fillIntensity * activeScale,
    rimIntensity: calibration.rimIntensity * activeScale,
    ringLitOpacity: renderProfile.ringLitOpacity,
    ringDarkOpacity: renderProfile.ringDarkOpacity,
    bandContrast: renderProfile.bandContrast,
    stormContrast: renderProfile.stormContrast,
    ringPhaseContrast: renderProfile.ringPhaseContrast,
    cloudSilverLining: renderProfile.cloudSilverLining,
    nightTerminatorCutoff: renderProfile.nightTerminatorCutoff,
    renderProfile,
  };
}

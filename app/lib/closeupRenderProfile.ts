import { VISUAL_CALIBRATION } from "./visualCalibration";

export type CloseupRenderProfile = {
  bodyId: "sun" | "earth" | "moon" | "jupiter" | "saturn" | "default";
  exposure: number;
  rimIntensity: number;
  fillIntensity: number;
  shadowSoftness: number;
  normalScale: number;
  roughness: number;
  atmosphereIntensity?: number;
  cloudDayOpacity?: number;
  cloudNightOpacity?: number;
  terminatorFeather?: number;
  ringLitOpacity?: number;
  ringDarkOpacity?: number;
  limbDarkening?: number;
  bandContrast?: number;
  stormContrast?: number;
  ringPhaseContrast?: number;
  cloudSilverLining?: number;
  nightTerminatorCutoff?: number;
  coronaAlpha?: number;
  flareOpacity?: number;
};

export type SpacecraftGalleryLightingProfile = {
  keyIntensity: number;
  fillIntensity: number;
  rimIntensity: number;
  contactShadowOpacity: number;
  turntableSpeed: number;
  scaleReferenceOpacity: number;
  autoFramePadding: number;
  coverShotProfile: "gallery-v3-studio";
};

export const SPACECRAFT_GALLERY_LIGHTING_PROFILE: SpacecraftGalleryLightingProfile = {
  keyIntensity: 3.1,
  fillIntensity: 0.55,
  rimIntensity: 1.25,
  contactShadowOpacity: 0.38,
  turntableSpeed: 0.18,
  scaleReferenceOpacity: 0.5,
  autoFramePadding: 1.72,
  coverShotProfile: "gallery-v3-studio",
};

export function closeupRenderProfile(bodyId: string): CloseupRenderProfile {
  const closeups = VISUAL_CALIBRATION.closeups;
  if (bodyId === "sun") {
    return {
      bodyId: "sun",
      exposure: closeups.sun.exposure,
      rimIntensity: 1,
      fillIntensity: 0,
      shadowSoftness: closeups.sun.shadowSoftness,
      normalScale: 0,
      roughness: 0,
      limbDarkening: closeups.sun.limbDarkening,
      coronaAlpha: closeups.sun.coronaLayerAlpha,
      flareOpacity: closeups.sun.flareOpacity,
    };
  }
  if (bodyId === "earth") {
    return {
      bodyId: "earth",
      exposure: 1,
      rimIntensity: closeups.earth.rimIntensity,
      fillIntensity: closeups.earth.fillIntensity,
      shadowSoftness: closeups.earth.shadowSoftness,
      normalScale: closeups.earth.normalScale,
      roughness: closeups.earth.roughness,
      atmosphereIntensity: closeups.earth.atmosphereIntensity,
      cloudDayOpacity: closeups.earth.cloudDayOpacity,
      cloudNightOpacity: closeups.earth.cloudNightOpacity,
      terminatorFeather: closeups.earth.terminatorFeather,
      cloudSilverLining: closeups.earth.cloudSilverLining,
      nightTerminatorCutoff: closeups.earth.nightTerminatorCutoff,
    };
  }
  if (bodyId === "moon") {
    return { bodyId: "moon", exposure: 1, ...closeups.moon };
  }
  if (bodyId === "jupiter") {
    return {
      bodyId: "jupiter",
      exposure: 1,
      ...closeups.jupiter,
      bandContrast: closeups.jupiter.bandContrast,
      stormContrast: closeups.jupiter.stormContrast,
    };
  }
  if (bodyId === "saturn") {
    return {
      bodyId: "saturn",
      exposure: 1,
      rimIntensity: closeups.saturn.rimIntensity,
      fillIntensity: closeups.saturn.fillIntensity,
      shadowSoftness: closeups.saturn.shadowSoftness,
      normalScale: closeups.saturn.normalScale,
      roughness: closeups.saturn.roughness,
      ringLitOpacity: closeups.saturn.ringLitOpacity,
      ringDarkOpacity: closeups.saturn.ringDarkOpacity,
      ringPhaseContrast: closeups.saturn.ringPhaseContrast,
    };
  }
  return {
    bodyId: "default",
    exposure: 1,
    rimIntensity: VISUAL_CALIBRATION.planets.rimIntensity,
    fillIntensity: 0.08,
    shadowSoftness: 0.45,
    normalScale: 1,
    roughness: 0.82,
  };
}

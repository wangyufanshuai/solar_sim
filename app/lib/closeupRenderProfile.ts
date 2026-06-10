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
};

export const SPACECRAFT_GALLERY_LIGHTING_PROFILE: SpacecraftGalleryLightingProfile = {
  keyIntensity: 3.1,
  fillIntensity: 0.55,
  rimIntensity: 1.25,
  contactShadowOpacity: 0.38,
  turntableSpeed: 0.22,
  scaleReferenceOpacity: 0.42,
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
    };
  }
  if (bodyId === "moon") {
    return { bodyId: "moon", exposure: 1, ...closeups.moon };
  }
  if (bodyId === "jupiter") {
    return { bodyId: "jupiter", exposure: 1, ...closeups.jupiter };
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

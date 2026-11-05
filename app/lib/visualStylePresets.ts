export type OrbitVisualStylePreset = "classicCinematic" | "naturalMulticolor";

export type OrbitLineStyleParams = {
  linewidth: number;
  materialOpacity: number;
  brightnessGain: number;
  openFadeStart: number;
  openFadeEnd: number;
  openFadePower: number;
  closedFadeMin: number;
  closedFadeMax: number;
  opacityFloor: number;
  opacityCeil: number;
  brightnessBoost: number;
};

export type SkyStyleParams = {
  targetIntensity: number;
  contrast: number;
  blackCutoff: number;
  gamma: number;
};

export function orbitLineStyleParams(
  preset: OrbitVisualStylePreset,
): OrbitLineStyleParams {
  if (preset === "naturalMulticolor") {
    return {
      linewidth: 1.15,
      materialOpacity: 0.68,
      brightnessGain: 1.3,
      openFadeStart: 0.004,
      openFadeEnd: 1.46,
      openFadePower: 1.82,
      closedFadeMin: 0.32,
      closedFadeMax: 1.26,
      opacityFloor: 0.03,
      opacityCeil: 0.78,
      brightnessBoost: 1.3,
    };
  }
  return {
    linewidth: 1.15,
    materialOpacity: 0.68,
    brightnessGain: 1.3,
    openFadeStart: 0.004,
    openFadeEnd: 1.42,
    openFadePower: 1.86,
    closedFadeMin: 0.3,
    closedFadeMax: 1.24,
    opacityFloor: 0.03,
    opacityCeil: 0.76,
    brightnessBoost: 1.28,
  };
}

export function skyStyleParams(preset: OrbitVisualStylePreset): SkyStyleParams {
  if (preset === "naturalMulticolor") {
    return {
      targetIntensity: 0.148,
      contrast: 1.16,
      blackCutoff: 0.052,
      gamma: 1.03,
    };
  }
  return {
    targetIntensity: 0.148,
    contrast: 1.17,
    blackCutoff: 0.054,
    gamma: 1.035,
  };
}

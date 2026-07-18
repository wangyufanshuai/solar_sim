export type LegacyV9SkyProfileInput = {
  selectedBodyCinematic: boolean;
  solarCloseup: boolean;
  gasGiantCloseup: boolean;
  dimCloseupSky: boolean;
  referenceDepth: number;
  negativeSpace: number;
};

export type LegacyV9BaseUniformProfile = {
  uOrbitAtlas: number;
  uCinematicBackdrop: number;
  uParallaxStrength: number;
  uExposureRolloff: number;
  uVignetteStrength: number;
  uDarkfieldStrength: number;
  uPeripheralGuard: number;
  uCleanCloseup: number;
  uNoiseSuppression: number;
  uMilkyWayRestraint: number;
  uReferenceDepth: number;
  uNegativeSpace: number;
  uExposure: number;
  uContrast: number;
  uSaturation: number;
};

export type LegacyV9StarUniformProfile = {
  uOpacity: number;
  uThreshold: number;
  uFaintScale: number;
  uColorRestraint: number;
  uTwinkleStrength: number;
};

export type LegacyV9SkyUniformProfile = {
  base: LegacyV9BaseUniformProfile;
  stars: LegacyV9StarUniformProfile;
};

export function createLegacyV9SkyUniformProfile({
  selectedBodyCinematic,
  solarCloseup,
  gasGiantCloseup,
  dimCloseupSky,
  referenceDepth,
  negativeSpace,
}: LegacyV9SkyProfileInput): LegacyV9SkyUniformProfile {
  return {
    base: {
      uOrbitAtlas: 1,
      uCinematicBackdrop: 0.08,
      uParallaxStrength: selectedBodyCinematic ? 0.03 : 0.12,
      uExposureRolloff: selectedBodyCinematic ? 0.18 : 0.06,
      uVignetteStrength: selectedBodyCinematic ? 0.16 : 0.045,
      uDarkfieldStrength: selectedBodyCinematic ? 0.22 : 0.08,
      uPeripheralGuard: 1,
      uCleanCloseup: selectedBodyCinematic ? (solarCloseup ? 0.62 : 0.18) : 0,
      uNoiseSuppression: selectedBodyCinematic ? 0.92 : 0.1,
      uMilkyWayRestraint: selectedBodyCinematic ? 0.9 : 0.12,
      uReferenceDepth: selectedBodyCinematic ? Math.max(referenceDepth, 0.9) : 0.24,
      uNegativeSpace: selectedBodyCinematic ? Math.max(negativeSpace, 0.86) : 0.08,
      uExposure: dimCloseupSky ? (solarCloseup ? 0.12 : gasGiantCloseup ? 0.56 : 0.62) : 0.92,
      uContrast: dimCloseupSky ? 1.52 : 1.3,
      uSaturation: dimCloseupSky ? 0.18 : 0.38,
    },
    stars: {
      uOpacity: selectedBodyCinematic ? (solarCloseup ? 0.012 : 0.022) : dimCloseupSky ? 0.018 : 0.082,
      uThreshold: selectedBodyCinematic ? 0.74 : 0.5,
      uFaintScale: selectedBodyCinematic ? 0.004 : 0.05,
      uColorRestraint: selectedBodyCinematic ? 0.18 : 0.36,
      uTwinkleStrength: selectedBodyCinematic ? 0.015 : 0.035,
    },
  };
}

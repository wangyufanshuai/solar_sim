export const VISUAL_CALIBRATION = {
  sky: {
    exposure: 0.92,
    contrast: 0.88,
    tinyStarIntensity: 0.0028,
    fastExposure: 0.68,
    fastContrast: 0.82,
    fastTinyStarIntensity: 0.0007,
    previewExposure: 0.74,
    previewContrast: 0.78,
    previewTinyStarIntensity: 0.0012,
    milkyWayContrast: 0.9,
  },
  stars: {
    brightHaloScale: 0.86,
  },
  nebulae: {
    galaxyDustOpacity: 0.034,
    deepSkyCoreOpacityScale: 0.58,
    deepSkyDeferredOpacityScale: 0.46,
    deepSkySolarLodOpacity: 0.78,
    deepSkyMidLodOpacity: 0.62,
    deepSkyFarLodOpacity: 0.48,
  },
  sun: {
    haloScale: 3.86,
    coronaAlpha: 0.155,
  },
  planets: {
    rimIntensity: 0.82,
    cloudIntensity: 0.88,
    nightLightIntensity: 0.78,
  },
  rings: {
    saturnOpacity: 0.66,
    cassiniDivisionOpacity: 0.18,
  },
  orbits: {
    referenceOpacity: 0.46,
    trailOpacity: 0.82,
    glowScale: 0.34,
  },
} as const;

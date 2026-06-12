import type {
  DeepUniverseRenderProfile,
  StarfieldRenderProfile,
} from "./deepUniverseTypes";

export const DEEP_UNIVERSE_RENDER_PROFILE: DeepUniverseRenderProfile = {
  id: "deep-universe-v4-observational",
  label: "Deep Universe v4 observational",
  galaxyExposure: 0.58,
  galaxyContrast: 0.72,
  dustLaneContrast: 1.35,
  coreCompression: 0.44,
  decalShellOpacity: 0.68,
  previewFirst: true,
  qualityLazy: true,
};

export const STARFIELD_RENDER_PROFILES: Record<string, StarfieldRenderProfile> = {
  "solar-local": {
    id: "solar-local",
    maxStars: 620,
    opacityByLod: { solar: 0.026, mid: 0.042, far: 0.068 },
    haloScale: 0.72,
    colorIndexStrength: 0.62,
  },
  "milky-way": {
    id: "milky-way",
    maxStars: 1150,
    opacityByLod: { solar: 0.032, mid: 0.058, far: 0.1 },
    haloScale: 0.86,
    colorIndexStrength: 0.74,
  },
  "atlas-deep-universe": {
    id: "atlas-deep-universe",
    maxStars: 1800,
    opacityByLod: { solar: 0.038, mid: 0.07, far: 0.118 },
    haloScale: 0.94,
    colorIndexStrength: 0.82,
  },
};

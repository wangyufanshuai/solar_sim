import type { AtlasSceneMode } from "./atlasRuntimeSceneFocusPerformance";
import {
  ATLAS_VISUAL_PROFILE_CANDIDATE_V261,
  ATLAS_VISUAL_PROFILE_LEGACY_V261,
  type AtlasVisualProfileV261,
} from "./atlasVisualProfileV261";

export const ATLAS_VISUAL_PROFILE_CANDIDATE_V269 = "science-cinematic-v2-v269" as const;
export type AtlasVisualProfileV269 = AtlasVisualProfileV261 | typeof ATLAS_VISUAL_PROFILE_CANDIDATE_V269;

export type AtlasVisualRendererProfileV269 = {
  id: AtlasVisualProfileV269;
  exposureMultiplier: Readonly<Record<AtlasSceneMode, number>>;
  catalogOpacityMultiplier: number;
  planetRoughnessMultiplier: number;
  planetRoughnessMinimum: number;
  planetEnvironmentOffset: number;
  planetEnvironmentMaximum: number;
  kerrOpacity: number;
  kerrFlowSpeed: number;
  kerrFlowStrength: number;
  launchCoreOpacity: number;
  launchHaloOpacity: number;
  launchShockOpacity: number;
  exoplanetTemperatureColorMix: number;
  exoplanetOrbitOpacity: number;
  interfaceDensity: "legacy" | "instrument" | "cinematic-instrument";
  defaultApplied: boolean;
  boundary: "visual-only-no-physics-or-science-mutation";
};

const EXPOSURE_ONE: Readonly<Record<AtlasSceneMode, number>> = { atlas: 1, inspect: 1, launch: 1, kerr: 1, "exoplanet-system": 1 };

export const ATLAS_VISUAL_RENDERER_PROFILES_V269: Readonly<Record<AtlasVisualProfileV269, AtlasVisualRendererProfileV269>> = {
  [ATLAS_VISUAL_PROFILE_LEGACY_V261]: {
    id: ATLAS_VISUAL_PROFILE_LEGACY_V261, exposureMultiplier: EXPOSURE_ONE,
    catalogOpacityMultiplier: 1, planetRoughnessMultiplier: 1, planetRoughnessMinimum: 0,
    planetEnvironmentOffset: 0, planetEnvironmentMaximum: 1, kerrOpacity: 0.48,
    kerrFlowSpeed: 0.85, kerrFlowStrength: 1, launchCoreOpacity: 0.2,
    launchHaloOpacity: 0.055, launchShockOpacity: 0.045,
    exoplanetTemperatureColorMix: 0, exoplanetOrbitOpacity: 1, interfaceDensity: "legacy",
    defaultApplied: true, boundary: "visual-only-no-physics-or-science-mutation",
  },
  [ATLAS_VISUAL_PROFILE_CANDIDATE_V261]: {
    id: ATLAS_VISUAL_PROFILE_CANDIDATE_V261,
    exposureMultiplier: { atlas: 0.97, inspect: 0.96, launch: 0.94, kerr: 0.96, "exoplanet-system": 0.97 },
    catalogOpacityMultiplier: 0.84, planetRoughnessMultiplier: 0.94, planetRoughnessMinimum: 0.42,
    planetEnvironmentOffset: 0.045, planetEnvironmentMaximum: 0.34, kerrOpacity: 0.58,
    kerrFlowSpeed: 0.66, kerrFlowStrength: 0.82, launchCoreOpacity: 0.235,
    launchHaloOpacity: 0.072, launchShockOpacity: 0.062,
    exoplanetTemperatureColorMix: 0.34, exoplanetOrbitOpacity: 0.9, interfaceDensity: "instrument",
    defaultApplied: false, boundary: "visual-only-no-physics-or-science-mutation",
  },
  [ATLAS_VISUAL_PROFILE_CANDIDATE_V269]: {
    id: ATLAS_VISUAL_PROFILE_CANDIDATE_V269,
    exposureMultiplier: { atlas: 0.92, inspect: 0.9, launch: 0.88, kerr: 0.91, "exoplanet-system": 0.93 },
    catalogOpacityMultiplier: 0.76, planetRoughnessMultiplier: 0.9, planetRoughnessMinimum: 0.38,
    planetEnvironmentOffset: 0.065, planetEnvironmentMaximum: 0.38, kerrOpacity: 0.62,
    kerrFlowSpeed: 0.58, kerrFlowStrength: 0.76, launchCoreOpacity: 0.255,
    launchHaloOpacity: 0.078, launchShockOpacity: 0.068,
    exoplanetTemperatureColorMix: 0.52, exoplanetOrbitOpacity: 0.82, interfaceDensity: "cinematic-instrument",
    defaultApplied: false, boundary: "visual-only-no-physics-or-science-mutation",
  },
};

export function resolveAtlasVisualProfileV269(profile: AtlasVisualProfileV269): AtlasVisualRendererProfileV269 {
  return ATLAS_VISUAL_RENDERER_PROFILES_V269[profile] ?? ATLAS_VISUAL_RENDERER_PROFILES_V269[ATLAS_VISUAL_PROFILE_LEGACY_V261];
}

export function isAtlasScienceCinematicProfileV269(profile: AtlasVisualProfileV269): boolean {
  return profile !== ATLAS_VISUAL_PROFILE_LEGACY_V261;
}

export function createAtlasVisualCandidateSummaryV269(active: AtlasVisualProfileV269 = ATLAS_VISUAL_PROFILE_LEGACY_V261) {
  return {
    version: "v269-science-cinematic-v2-shadow-v1" as const,
    profiles: [ATLAS_VISUAL_PROFILE_LEGACY_V261, ATLAS_VISUAL_PROFILE_CANDIDATE_V261, ATLAS_VISUAL_PROFILE_CANDIDATE_V269] as const,
    active,
    defaultProfile: ATLAS_VISUAL_PROFILE_LEGACY_V261,
    candidateAppliedAsDefault: false as const,
    physicsMutation: "not-applied" as const,
    kerrScienceMutation: "not-applied" as const,
    launchDynamicsMutation: "not-applied" as const,
    boundary: "three-way-local-shadow-ab-no-default-promotion" as const,
  };
}

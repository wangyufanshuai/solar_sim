import type { AtlasSceneMode } from "./atlasRuntimeSceneFocusPerformance";
import {
  ATLAS_VISUAL_PROFILE_CANDIDATE_V269,
  resolveAtlasVisualProfileV269,
  type AtlasVisualProfileV269,
  type AtlasVisualRendererProfileV269,
} from "./atlasVisualProfileV269";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V261, ATLAS_VISUAL_PROFILE_LEGACY_V261 } from "./atlasVisualProfileV261";

export const ATLAS_VISUAL_PROFILE_CANDIDATE_V274 = "science-cinematic-v3-v274" as const;
export const ATLAS_VISUAL_PROFILE_CANDIDATE_V285 = "science-cinematic-v4-v285" as const;
export type AtlasVisualProfileV274 = AtlasVisualProfileV269 | typeof ATLAS_VISUAL_PROFILE_CANDIDATE_V274 | typeof ATLAS_VISUAL_PROFILE_CANDIDATE_V285;

export type AtlasVisualPresentationGroupsV274 = {
  sky: {
    backgroundExposure: number;
    blackLevel: number;
    highlightShoulder: number;
    starLuminance: number;
    milkyWayOpacity: number;
    nebulaOpacity: number;
  };
  solar: {
    sunSurfaceLuminance: number;
    terminatorSoftness: number;
    cloudOpacity: number;
    nightSideExposure: number;
    ringOpticalDepth: number;
    ringShadowStrength: number;
  };
  catalog: {
    brightStarOpacity: number;
    faintStarOpacity: number;
    deepSkyMarkerOpacity: number;
    cosmicPointOpacity: number;
    distanceLuminanceFalloff: number;
  };
  postFx: {
    bloomStrength: number;
    bloomThreshold: number;
    vignetteStrength: number;
    saturation: number;
  };
  hud: {
    density: "legacy" | "instrument" | "cinematic-instrument";
    measurementColor: string;
    riskColor: string;
    borderOpacity: number;
    backdropOpacity: number;
  };
};

export type AtlasVisualRendererProfileV274 = Omit<AtlasVisualRendererProfileV269, "id"> & {
  id: AtlasVisualProfileV274;
  groups: AtlasVisualPresentationGroupsV274;
  localShadowDefaultEligible: boolean;
};

const NEUTRAL_GROUPS: AtlasVisualPresentationGroupsV274 = {
  sky: { backgroundExposure: 1, blackLevel: 0, highlightShoulder: 1, starLuminance: 1, milkyWayOpacity: 1, nebulaOpacity: 1 },
  solar: { sunSurfaceLuminance: 1, terminatorSoftness: 1, cloudOpacity: 1, nightSideExposure: 1, ringOpticalDepth: 1, ringShadowStrength: 1 },
  catalog: { brightStarOpacity: 1, faintStarOpacity: 1, deepSkyMarkerOpacity: 1, cosmicPointOpacity: 1, distanceLuminanceFalloff: 1 },
  postFx: { bloomStrength: 1, bloomThreshold: 1, vignetteStrength: 1, saturation: 1 },
  hud: { density: "legacy", measurementColor: "#72c4d4", riskColor: "#d8ad62", borderOpacity: 1, backdropOpacity: 1 },
};

function groups(scale: number, density: AtlasVisualPresentationGroupsV274["hud"]["density"]): AtlasVisualPresentationGroupsV274 {
  return {
    sky: { backgroundExposure: 1 - scale * 0.12, blackLevel: scale * 0.035, highlightShoulder: 1 - scale * 0.12, starLuminance: 1 - scale * 0.14, milkyWayOpacity: 1 - scale * 0.12, nebulaOpacity: 1 - scale * 0.18 },
    solar: { sunSurfaceLuminance: 1 - scale * 0.08, terminatorSoftness: 1 + scale * 0.22, cloudOpacity: 1 - scale * 0.06, nightSideExposure: 1 - scale * 0.12, ringOpticalDepth: 1 + scale * 0.18, ringShadowStrength: 1 + scale * 0.28 },
    catalog: { brightStarOpacity: 1 - scale * 0.08, faintStarOpacity: 1 - scale * 0.18, deepSkyMarkerOpacity: 1 - scale * 0.16, cosmicPointOpacity: 1 - scale * 0.12, distanceLuminanceFalloff: 1 + scale * 0.18 },
    postFx: { bloomStrength: 1 - scale * 0.12, bloomThreshold: 1 + scale * 0.12, vignetteStrength: 1 + scale * 0.16, saturation: 1 - scale * 0.06 },
    hud: { density, measurementColor: "#72c4d4", riskColor: "#d8ad62", borderOpacity: 1 - scale * 0.16, backdropOpacity: 1 - scale * 0.1 },
  };
}

function extend(profile: AtlasVisualProfileV269, group: AtlasVisualPresentationGroupsV274): AtlasVisualRendererProfileV274 {
  return { ...resolveAtlasVisualProfileV269(profile), id: profile, groups: group, localShadowDefaultEligible: false };
}

export const ATLAS_VISUAL_RENDERER_PROFILES_V274: Readonly<Record<AtlasVisualProfileV274, AtlasVisualRendererProfileV274>> = {
  [ATLAS_VISUAL_PROFILE_LEGACY_V261]: extend(ATLAS_VISUAL_PROFILE_LEGACY_V261, NEUTRAL_GROUPS),
  [ATLAS_VISUAL_PROFILE_CANDIDATE_V261]: extend(ATLAS_VISUAL_PROFILE_CANDIDATE_V261, groups(0.45, "instrument")),
  [ATLAS_VISUAL_PROFILE_CANDIDATE_V269]: extend(ATLAS_VISUAL_PROFILE_CANDIDATE_V269, groups(0.72, "cinematic-instrument")),
  [ATLAS_VISUAL_PROFILE_CANDIDATE_V274]: {
    ...resolveAtlasVisualProfileV269(ATLAS_VISUAL_PROFILE_CANDIDATE_V269),
    id: ATLAS_VISUAL_PROFILE_CANDIDATE_V274,
    exposureMultiplier: { atlas: 0.9, inspect: 0.88, launch: 0.86, kerr: 0.89, "exoplanet-system": 0.91 } satisfies Readonly<Record<AtlasSceneMode, number>>,
    catalogOpacityMultiplier: 0.72,
    planetRoughnessMultiplier: 0.88,
    planetRoughnessMinimum: 0.4,
    planetEnvironmentOffset: 0.07,
    planetEnvironmentMaximum: 0.36,
    kerrOpacity: 0.64,
    kerrFlowSpeed: 0.54,
    kerrFlowStrength: 0.72,
    launchCoreOpacity: 0.26,
    launchHaloOpacity: 0.08,
    launchShockOpacity: 0.07,
    exoplanetTemperatureColorMix: 0.58,
    exoplanetOrbitOpacity: 0.78,
    interfaceDensity: "cinematic-instrument",
    defaultApplied: false,
    groups: groups(1, "cinematic-instrument"),
    localShadowDefaultEligible: true,
    boundary: "visual-only-no-physics-or-science-mutation",
  },
  [ATLAS_VISUAL_PROFILE_CANDIDATE_V285]: {
    ...resolveAtlasVisualProfileV269(ATLAS_VISUAL_PROFILE_CANDIDATE_V269),
    id: ATLAS_VISUAL_PROFILE_CANDIDATE_V285,
    exposureMultiplier: { atlas: 0.9, inspect: 0.88, launch: 0.86, kerr: 0.89, "exoplanet-system": 0.91 } satisfies Readonly<Record<AtlasSceneMode, number>>,
    catalogOpacityMultiplier: 0.72,
    planetRoughnessMultiplier: 0.88,
    planetRoughnessMinimum: 0.4,
    planetEnvironmentOffset: 0.07,
    planetEnvironmentMaximum: 0.36,
    kerrOpacity: 0.64,
    kerrFlowSpeed: 0.54,
    kerrFlowStrength: 0.72,
    launchCoreOpacity: 0.26,
    launchHaloOpacity: 0.08,
    launchShockOpacity: 0.07,
    exoplanetTemperatureColorMix: 0.58,
    exoplanetOrbitOpacity: 0.78,
    interfaceDensity: "cinematic-instrument",
    defaultApplied: false,
    groups: groups(1, "cinematic-instrument"),
    localShadowDefaultEligible: true,
    boundary: "visual-only-no-physics-or-science-mutation",
  },
};

export function resolveAtlasVisualProfileV274(profile: AtlasVisualProfileV274): AtlasVisualRendererProfileV274 {
  return ATLAS_VISUAL_RENDERER_PROFILES_V274[profile] ?? ATLAS_VISUAL_RENDERER_PROFILES_V274[ATLAS_VISUAL_PROFILE_LEGACY_V261];
}

export function isAtlasScienceCinematicProfileV274(profile: AtlasVisualProfileV274): boolean {
  return profile !== ATLAS_VISUAL_PROFILE_LEGACY_V261;
}

export function createAtlasVisualCandidateSummaryV274(active: AtlasVisualProfileV274 = ATLAS_VISUAL_PROFILE_LEGACY_V261) {
  return {
    version: "v274-science-cinematic-v3-shadow-v1" as const,
    profiles: [ATLAS_VISUAL_PROFILE_LEGACY_V261, ATLAS_VISUAL_PROFILE_CANDIDATE_V261, ATLAS_VISUAL_PROFILE_CANDIDATE_V269, ATLAS_VISUAL_PROFILE_CANDIDATE_V274, ATLAS_VISUAL_PROFILE_CANDIDATE_V285] as const,
    active,
    formalDefault: ATLAS_VISUAL_PROFILE_LEGACY_V261,
    localShadowDefaultCandidate: ATLAS_VISUAL_PROFILE_CANDIDATE_V285,
    localShadowDefaultApplied: false as const,
    qualificationRequired: ["v273-scale", "v274-visual", "v275-bundle-browser-soak-rtx"] as const,
    physicsMutation: "not-applied" as const,
    kerrScienceMutation: "not-applied" as const,
    launchDynamicsMutation: "not-applied" as const,
    boundary: "four-way-local-shadow-ab-formal-legacy-retained" as const,
  };
}

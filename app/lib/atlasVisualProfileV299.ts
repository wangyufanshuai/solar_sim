import type { AtlasSceneMode } from "./atlasRuntimeSceneFocusPerformance";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V285, type AtlasVisualProfileV274 } from "./atlasVisualProfileV274";
import { resolveAtlasVisualProfileV285, type AtlasVisualRendererProfileV285 } from "./atlasVisualProfileV285";

export const ATLAS_VISUAL_PROFILE_CANDIDATE_V299 = "science-cinematic-v5-v299" as const;
export const ATLAS_VISUAL_PROFILE_CANDIDATE_V300 = "science-cinematic-v6-v300" as const;
export const ATLAS_VISUAL_PROFILE_CANDIDATE_V340 = "science-cinematic-v7-v340" as const;
export const ATLAS_VISUAL_PROFILE_CANDIDATE_V349 = "science-cinematic-v8-v349" as const;
export const ATLAS_VISUAL_PROFILE_CANDIDATE_V362 = "science-cinematic-v9-v362" as const;
export const ATLAS_VISUAL_PROFILE_CANDIDATE_V370 = "science-cinematic-v10-v370" as const;
export const ATLAS_VISUAL_PROFILE_CANDIDATE_V377 = "science-cinematic-v11-v377" as const;
export const ATLAS_VISUAL_PROFILE_CANDIDATE_V400 = "science-cinematic-v12-v400" as const;
export const ATLAS_VISUAL_PROFILE_CANDIDATE_V405 = "science-cinematic-v13-v405" as const;
export type AtlasVisualProfileV299 = AtlasVisualProfileV274 | typeof ATLAS_VISUAL_PROFILE_CANDIDATE_V299 | typeof ATLAS_VISUAL_PROFILE_CANDIDATE_V300 | typeof ATLAS_VISUAL_PROFILE_CANDIDATE_V340 | typeof ATLAS_VISUAL_PROFILE_CANDIDATE_V349 | typeof ATLAS_VISUAL_PROFILE_CANDIDATE_V362 | typeof ATLAS_VISUAL_PROFILE_CANDIDATE_V370 | typeof ATLAS_VISUAL_PROFILE_CANDIDATE_V377 | typeof ATLAS_VISUAL_PROFILE_CANDIDATE_V400 | typeof ATLAS_VISUAL_PROFILE_CANDIDATE_V405;
export type StrongGravityDisplayModeV299 = "science" | "cinematic";

export function sampleAtlasCinematicDetailV299(seed: number, sequence: number, channel: number): number {
  let value = (
    Math.trunc(seed)
    ^ Math.imul(Math.trunc(sequence) + 1, 0x9e3779b1)
    ^ Math.imul(Math.trunc(channel) + 1, 0x85ebca6b)
  ) >>> 0;
  value = (value ^ (value >>> 16)) >>> 0;
  value = Math.imul(value, 0x7feb352d) >>> 0;
  value = (value ^ (value >>> 15)) >>> 0;
  value = Math.imul(value, 0x846ca68b) >>> 0;
  value = (value ^ (value >>> 16)) >>> 0;
  return value / 0x1_0000_0000;
}

export type AtlasVisualRendererProfileV299 = Omit<AtlasVisualRendererProfileV285, "id" | "runtimeTokens"> & {
  readonly id: AtlasVisualProfileV299;
  readonly v5TokensApplied: boolean;
  readonly v6TokensApplied?: boolean;
  readonly v7TokensApplied?: boolean;
  readonly v8TokensApplied?: boolean;
  readonly v9TokensApplied?: boolean;
  readonly v10TokensApplied?: boolean;
  readonly v11TokensApplied?: boolean;
  readonly v12TokensApplied?: boolean;
  readonly v13TokensApplied?: boolean;
  readonly runtimeTokens: Omit<AtlasVisualRendererProfileV285["runtimeTokens"], "hud"> & {
    readonly hud: AtlasVisualRendererProfileV285["runtimeTokens"]["hud"] & {
      readonly instrumentLabV9?: {
        readonly panelOpacity: 0.86;
        readonly uncertaintyGridOpacity: 0.18;
        readonly eigenmodeAccent: 0.74;
        readonly calibrationAlertOpacity: 0.88;
        readonly provenanceStripeOpacity: 0.42;
        readonly detailSeed: 362;
      };
      readonly observatoryHudV10?: {
        readonly panelOpacity: 0.9;
        readonly geometryGridOpacity: 0.22;
        readonly apertureArcOpacity: 0.68;
        readonly photonTraceOpacity: 0.58;
        readonly provenanceStripeOpacity: 0.48;
        readonly unavailablePulseOpacity: 0.72;
        readonly detailSeed: 370;
      };
      readonly measurementLabV11?: {
        readonly panelOpacity: 0.94;
        readonly metrologyGridOpacity: 0.26;
        readonly electronColumnOpacity: 0.7;
        readonly uncertaintyHaloOpacity: 0.38;
        readonly shaRailOpacity: 0.56;
        readonly authorityGateLuminance: 0.92;
        readonly unavailableScanOpacity: 0.64;
        readonly detailSeed: 377;
      };
      readonly observationHubV12?: {
        readonly panelOpacity: 0.96;
        readonly topologyTraceOpacity: 0.68;
        readonly sourceBayOpacity: 0.74;
        readonly boundaryLuminance: 0.95;
        readonly missingPulseOpacity: 0.46;
        readonly dockingGridOpacity: 0.3;
        readonly stageRailOpacity: 0.72;
        readonly detailSeed: 400;
      };
      readonly evidenceObservatoryV13?: {
        readonly panelOpacity: 0.97;
        readonly lineageTraceOpacity: 0.72;
        readonly nodeLuminance: 0.84;
        readonly checksumRailOpacity: 0.64;
        readonly failClosedAmberOpacity: 0.58;
        readonly baselineArcOpacity: 0.76;
        readonly evidenceGrainOpacity: 0.18;
        readonly detailSeed: 405;
      };
    };
    readonly strongGravityV5?: {
      readonly scienceExposure: 1;
      readonly scienceBloom: 0;
      readonly scienceNoise: 0;
      readonly cinematicExposure: number;
      readonly cinematicBloom: number;
      readonly diskDetailSeed: number;
      readonly redshiftColorStrength: number;
      readonly dopplerColorStrength: number;
    };
    readonly strongGravityV6?: {
      readonly scienceExposure: 1;
      readonly scienceBloom: 0;
      readonly scienceNoise: 0;
      readonly cinematicExposure: number;
      readonly cinematicBloom: number;
      readonly diskDetailSeed: 300;
      readonly redshiftColorStrength: number;
      readonly dopplerColorStrength: number;
    };
    readonly strongGravityV7?: {
      readonly scienceExposure: 1;
      readonly scienceBloom: 0;
      readonly scienceNoise: 0;
      readonly cinematicExposure: number;
      readonly cinematicBloom: number;
      readonly diskDetailSeed: 340;
      readonly redshiftColorStrength: number;
      readonly dopplerColorStrength: number;
    };
    readonly strongGravityV8?: {
      readonly scienceExposure: 1;
      readonly scienceBloom: 0;
      readonly scienceNoise: 0;
      readonly cinematicExposure: 0.71;
      readonly cinematicBloom: 0.32;
      readonly diskDetailSeed: 349;
      readonly redshiftColorStrength: 0.55;
      readonly dopplerColorStrength: 0.61;
      readonly spectralRibbonOpacity: 0.72;
      readonly reticleLuminance: 0.82;
      readonly channelSeparation: 0.64;
    };
    readonly strongGravityV9?: {
      readonly scienceExposure: 1;
      readonly scienceBloom: 0;
      readonly scienceNoise: 0;
      readonly cinematicExposure: 0.69;
      readonly cinematicBloom: 0.28;
      readonly diskDetailSeed: 362;
      readonly redshiftColorStrength: 0.52;
      readonly dopplerColorStrength: 0.58;
      readonly spectralRibbonOpacity: 0.66;
      readonly reticleLuminance: 0.86;
      readonly channelSeparation: 0.6;
      readonly uncertaintyContourOpacity: 0.48;
      readonly detectorGridOpacity: 0.34;
      readonly calibrationAlertLuminance: 0.9;
    };
    readonly strongGravityV10?: {
      readonly scienceExposure: 1;
      readonly scienceBloom: 0;
      readonly scienceNoise: 0;
      readonly cinematicExposure: 0.67;
      readonly cinematicBloom: 0.25;
      readonly diskDetailSeed: 370;
      readonly redshiftColorStrength: 0.5;
      readonly dopplerColorStrength: 0.56;
      readonly spectralRibbonOpacity: 0.62;
      readonly reticleLuminance: 0.9;
      readonly channelSeparation: 0.58;
      readonly uncertaintyContourOpacity: 0.52;
      readonly detectorGridOpacity: 0.39;
      readonly calibrationAlertLuminance: 0.92;
      readonly apertureTraceOpacity: 0.46;
      readonly electronBudgetOpacity: 0.64;
    };
    readonly strongGravityV11?: {
      readonly scienceExposure: 1;
      readonly scienceBloom: 0;
      readonly scienceNoise: 0;
      readonly cinematicExposure: 0.65;
      readonly cinematicBloom: 0.22;
      readonly diskDetailSeed: 377;
      readonly redshiftColorStrength: 0.48;
      readonly dopplerColorStrength: 0.54;
      readonly spectralRibbonOpacity: 0.58;
      readonly reticleLuminance: 0.94;
      readonly channelSeparation: 0.55;
      readonly uncertaintyContourOpacity: 0.56;
      readonly detectorGridOpacity: 0.44;
      readonly calibrationAlertLuminance: 0.94;
      readonly apertureTraceOpacity: 0.5;
      readonly electronBudgetOpacity: 0.72;
      readonly varianceLayerOpacity: 0.62;
    };
    readonly strongGravityV12?: {
      readonly scienceExposure: 1;
      readonly scienceBloom: 0;
      readonly scienceNoise: 0;
      readonly cinematicExposure: 0.63;
      readonly cinematicBloom: 0.2;
      readonly diskDetailSeed: 400;
      readonly redshiftColorStrength: 0.46;
      readonly dopplerColorStrength: 0.52;
      readonly spectralRibbonOpacity: 0.56;
      readonly reticleLuminance: 0.96;
      readonly channelSeparation: 0.53;
      readonly uncertaintyContourOpacity: 0.58;
      readonly detectorGridOpacity: 0.46;
      readonly calibrationAlertLuminance: 0.95;
      readonly apertureTraceOpacity: 0.52;
      readonly electronBudgetOpacity: 0.74;
      readonly varianceLayerOpacity: 0.64;
      readonly provenanceRailOpacity: 0.68;
    };
  };
};

const V4 = resolveAtlasVisualProfileV285(ATLAS_VISUAL_PROFILE_CANDIDATE_V285);
const V5_EXPOSURE: Readonly<Record<AtlasSceneMode, number>> = Object.freeze({
  atlas: 0.88,
  inspect: 0.86,
  launch: 0.84,
  kerr: 0.82,
  "exoplanet-system": 0.88,
});

const V5: AtlasVisualRendererProfileV299 = Object.freeze({
  ...V4,
  id: ATLAS_VISUAL_PROFILE_CANDIDATE_V299,
  exposureMultiplier: V5_EXPOSURE,
  catalogOpacityMultiplier: 0.68,
  planetRoughnessMultiplier: 0.9,
  planetRoughnessMinimum: 0.42,
  planetEnvironmentOffset: 0.06,
  planetEnvironmentMaximum: 0.34,
  kerrOpacity: 0.72,
  kerrFlowSpeed: 0.42,
  kerrFlowStrength: 0.58,
  launchCoreOpacity: 0.24,
  launchHaloOpacity: 0.07,
  launchShockOpacity: 0.06,
  exoplanetTemperatureColorMix: 0.64,
  exoplanetOrbitOpacity: 0.72,
  groups: Object.freeze({
    sky: Object.freeze({ ...V4.groups.sky, backgroundExposure: 0.86, blackLevel: 0.045, highlightShoulder: 0.84, starLuminance: 0.82, milkyWayOpacity: 0.84, nebulaOpacity: 0.76 }),
    solar: Object.freeze({ ...V4.groups.solar, sunSurfaceLuminance: 0.9, terminatorSoftness: 1.28, cloudOpacity: 0.91, nightSideExposure: 0.84, ringOpticalDepth: 1.22, ringShadowStrength: 1.34 }),
    catalog: Object.freeze({ ...V4.groups.catalog, brightStarOpacity: 0.88, faintStarOpacity: 0.76, deepSkyMarkerOpacity: 0.78, cosmicPointOpacity: 0.82, distanceLuminanceFalloff: 1.24 }),
    postFx: Object.freeze({ ...V4.groups.postFx, bloomStrength: 0.78, bloomThreshold: 1.18, vignetteStrength: 1.12, saturation: 0.92 }),
    hud: Object.freeze({ ...V4.groups.hud, density: "cinematic-instrument", measurementColor: "#8bd8e6", riskColor: "#e3b66a", borderOpacity: 0.78, backdropOpacity: 0.84 }),
  }),
  v4TokensApplied: false,
  v5TokensApplied: true,
  scienceBufferIsolation: "immutable-ray-payload",
  cinematicDecoration: "seeded-only",
  runtimeTokens: Object.freeze({
    strongGravity: Object.freeze({ opacity: 0.72, flowSpeed: 0.42, flowStrength: 0.58, scienceDisplayTransform: "linear-no-grade" as const }),
    launch: Object.freeze({ coreOpacity: 0.24, haloOpacity: 0.07, shockOpacity: 0.06, detailSeed: 285 as const }),
    exoplanet: Object.freeze({ temperatureColorMix: 0.64, orbitOpacity: 0.72 }),
    hud: Object.freeze({ ...V4.runtimeTokens.hud, borderOpacity: 0.78, backdropOpacity: 0.84, measurementColor: "#8bd8e6", riskColor: "#e3b66a", scienceMeasurementColor: "#8bd8e6", riskBoundaryColor: "#e3b66a" }),
    strongGravityV5: Object.freeze({ scienceExposure: 1 as const, scienceBloom: 0 as const, scienceNoise: 0 as const, cinematicExposure: 0.82, cinematicBloom: 0.54, diskDetailSeed: 299 as const, redshiftColorStrength: 0.68, dopplerColorStrength: 0.72 }),
  }),
  localShadowDefaultEligible: false,
  defaultApplied: false,
  boundary: "visual-only-no-physics-or-science-mutation",
});

const V6: AtlasVisualRendererProfileV299 = Object.freeze({
  ...V5,
  id: ATLAS_VISUAL_PROFILE_CANDIDATE_V300,
  exposureMultiplier: Object.freeze({ atlas: 0.84, inspect: 0.82, launch: 0.8, kerr: 0.78, "exoplanet-system": 0.84 }),
  catalogOpacityMultiplier: 0.64,
  planetRoughnessMultiplier: 0.88,
  planetRoughnessMinimum: 0.44,
  kerrOpacity: 0.7,
  kerrFlowSpeed: 0.38,
  kerrFlowStrength: 0.54,
  launchCoreOpacity: 0.22,
  launchHaloOpacity: 0.055,
  launchShockOpacity: 0.045,
  exoplanetTemperatureColorMix: 0.58,
  exoplanetOrbitOpacity: 0.68,
  groups: Object.freeze({
    ...V5.groups,
    sky: Object.freeze({ ...V5.groups.sky, backgroundExposure: 0.82, blackLevel: 0.04, highlightShoulder: 0.8, starLuminance: 0.78, milkyWayOpacity: 0.8, nebulaOpacity: 0.72 }),
    solar: Object.freeze({ ...V5.groups.solar, sunSurfaceLuminance: 0.86, cloudOpacity: 0.9, nightSideExposure: 0.8, ringOpticalDepth: 1.18, ringShadowStrength: 1.28 }),
    catalog: Object.freeze({ ...V5.groups.catalog, brightStarOpacity: 0.84, faintStarOpacity: 0.72, deepSkyMarkerOpacity: 0.74, cosmicPointOpacity: 0.78, distanceLuminanceFalloff: 1.2 }),
    postFx: Object.freeze({ ...V5.groups.postFx, bloomStrength: 0.7, bloomThreshold: 1.22, vignetteStrength: 1.08, saturation: 0.9 }),
    hud: Object.freeze({ ...V5.groups.hud, borderOpacity: 0.74, backdropOpacity: 0.8, measurementColor: "#9be2ec", riskColor: "#e8bf78" }),
  }),
  v5TokensApplied: false,
  v6TokensApplied: true,
  runtimeTokens: Object.freeze({
    ...V5.runtimeTokens,
    strongGravity: Object.freeze({ opacity: 0.7, flowSpeed: 0.38, flowStrength: 0.54, scienceDisplayTransform: "linear-no-grade" as const }),
    launch: Object.freeze({ coreOpacity: 0.22, haloOpacity: 0.055, shockOpacity: 0.045, detailSeed: 300 }),
    exoplanet: Object.freeze({ temperatureColorMix: 0.58, orbitOpacity: 0.68 }),
    hud: Object.freeze({ ...V5.runtimeTokens.hud, measurementColor: "#9be2ec", riskColor: "#e8bf78", scienceMeasurementColor: "#9be2ec", riskBoundaryColor: "#e8bf78" }),
    strongGravityV6: Object.freeze({ scienceExposure: 1 as const, scienceBloom: 0 as const, scienceNoise: 0 as const, cinematicExposure: 0.78, cinematicBloom: 0.46, diskDetailSeed: 300 as const, redshiftColorStrength: 0.62, dopplerColorStrength: 0.68 }),
  }),
});

/** Restrained deep-space precision-instrument presentation; Science stays linear / 1 / 0 / 0. */
const V7: AtlasVisualRendererProfileV299 = Object.freeze({
  ...V6,
  id: ATLAS_VISUAL_PROFILE_CANDIDATE_V340,
  exposureMultiplier: Object.freeze({ atlas: 0.81, inspect: 0.79, launch: 0.76, kerr: 0.74, "exoplanet-system": 0.81 }),
  catalogOpacityMultiplier: 0.61,
  planetRoughnessMultiplier: 0.86,
  planetRoughnessMinimum: 0.46,
  planetEnvironmentOffset: 0.045,
  planetEnvironmentMaximum: 0.29,
  kerrOpacity: 0.68,
  kerrFlowSpeed: 0.35,
  kerrFlowStrength: 0.51,
  launchCoreOpacity: 0.2,
  launchHaloOpacity: 0.045,
  launchShockOpacity: 0.035,
  exoplanetTemperatureColorMix: 0.54,
  exoplanetOrbitOpacity: 0.64,
  groups: Object.freeze({
    sky: Object.freeze({ ...V6.groups.sky, backgroundExposure: 0.79, blackLevel: 0.032, highlightShoulder: 0.76, starLuminance: 0.74, milkyWayOpacity: 0.77, nebulaOpacity: 0.67 }),
    solar: Object.freeze({ ...V6.groups.solar, sunSurfaceLuminance: 0.82, terminatorSoftness: 1.34, cloudOpacity: 0.88, nightSideExposure: 0.76, ringOpticalDepth: 1.16, ringShadowStrength: 1.22 }),
    catalog: Object.freeze({ ...V6.groups.catalog, brightStarOpacity: 0.81, faintStarOpacity: 0.68, deepSkyMarkerOpacity: 0.71, cosmicPointOpacity: 0.74, distanceLuminanceFalloff: 1.17 }),
    postFx: Object.freeze({ ...V6.groups.postFx, bloomStrength: 0.62, bloomThreshold: 1.27, vignetteStrength: 1.04, saturation: 0.87 }),
    hud: Object.freeze({ ...V6.groups.hud, borderOpacity: 0.72, backdropOpacity: 0.78, measurementColor: "#a7edf2", riskColor: "#efc989" }),
  }),
  v5TokensApplied: false,
  v6TokensApplied: false,
  v7TokensApplied: true,
  runtimeTokens: Object.freeze({
    ...V6.runtimeTokens,
    strongGravity: Object.freeze({ opacity: 0.68, flowSpeed: 0.35, flowStrength: 0.51, scienceDisplayTransform: "linear-no-grade" as const }),
    launch: Object.freeze({ coreOpacity: 0.2, haloOpacity: 0.045, shockOpacity: 0.035, detailSeed: 340 }),
    exoplanet: Object.freeze({ temperatureColorMix: 0.54, orbitOpacity: 0.64 }),
    hud: Object.freeze({ ...V6.runtimeTokens.hud, measurementColor: "#a7edf2", riskColor: "#efc989", scienceMeasurementColor: "#a7edf2", riskBoundaryColor: "#efc989" }),
    strongGravityV7: Object.freeze({ scienceExposure: 1 as const, scienceBloom: 0 as const, scienceNoise: 0 as const, cinematicExposure: 0.74, cinematicBloom: 0.38, diskDetailSeed: 340 as const, redshiftColorStrength: 0.58, dopplerColorStrength: 0.64 }),
  }),
});

/** Relativistic spectral-observatory presentation; Science stays linear / 1 / 0 / 0. */
const V8: AtlasVisualRendererProfileV299 = Object.freeze({
  ...V7,
  id: ATLAS_VISUAL_PROFILE_CANDIDATE_V349,
  exposureMultiplier: Object.freeze({ atlas: 0.79, inspect: 0.77, launch: 0.74, kerr: 0.71, "exoplanet-system": 0.79 }),
  catalogOpacityMultiplier: 0.59,
  planetRoughnessMultiplier: 0.85,
  planetRoughnessMinimum: 0.47,
  planetEnvironmentOffset: 0.04,
  planetEnvironmentMaximum: 0.27,
  kerrOpacity: 0.66,
  kerrFlowSpeed: 0.33,
  kerrFlowStrength: 0.49,
  launchCoreOpacity: 0.19,
  launchHaloOpacity: 0.04,
  launchShockOpacity: 0.03,
  exoplanetTemperatureColorMix: 0.51,
  exoplanetOrbitOpacity: 0.62,
  groups: Object.freeze({
    sky: Object.freeze({ ...V7.groups.sky, backgroundExposure: 0.77, blackLevel: 0.028, highlightShoulder: 0.73, starLuminance: 0.72, milkyWayOpacity: 0.75, nebulaOpacity: 0.64 }),
    solar: Object.freeze({ ...V7.groups.solar, sunSurfaceLuminance: 0.8, terminatorSoftness: 1.37, cloudOpacity: 0.87, nightSideExposure: 0.74, ringOpticalDepth: 1.14, ringShadowStrength: 1.19 }),
    catalog: Object.freeze({ ...V7.groups.catalog, brightStarOpacity: 0.79, faintStarOpacity: 0.66, deepSkyMarkerOpacity: 0.69, cosmicPointOpacity: 0.72, distanceLuminanceFalloff: 1.15 }),
    postFx: Object.freeze({ ...V7.groups.postFx, bloomStrength: 0.56, bloomThreshold: 1.31, vignetteStrength: 1.02, saturation: 0.85 }),
    hud: Object.freeze({ ...V7.groups.hud, borderOpacity: 0.74, backdropOpacity: 0.8, measurementColor: "#b8f4ff", riskColor: "#f4d59d" }),
  }),
  v5TokensApplied: false,
  v6TokensApplied: false,
  v7TokensApplied: false,
  v8TokensApplied: true,
  runtimeTokens: Object.freeze({
    ...V7.runtimeTokens,
    strongGravity: Object.freeze({ opacity: 0.66, flowSpeed: 0.33, flowStrength: 0.49, scienceDisplayTransform: "linear-no-grade" as const }),
    launch: Object.freeze({ coreOpacity: 0.19, haloOpacity: 0.04, shockOpacity: 0.03, detailSeed: 349 }),
    exoplanet: Object.freeze({ temperatureColorMix: 0.51, orbitOpacity: 0.62 }),
    hud: Object.freeze({ ...V7.runtimeTokens.hud, measurementColor: "#b8f4ff", riskColor: "#f4d59d", scienceMeasurementColor: "#b8f4ff", riskBoundaryColor: "#f4d59d" }),
    strongGravityV8: Object.freeze({ scienceExposure: 1 as const, scienceBloom: 0 as const, scienceNoise: 0 as const, cinematicExposure: 0.71 as const, cinematicBloom: 0.32 as const, diskDetailSeed: 349 as const, redshiftColorStrength: 0.55 as const, dopplerColorStrength: 0.61 as const, spectralRibbonOpacity: 0.72 as const, reticleLuminance: 0.82 as const, channelSeparation: 0.64 as const }),
  }),
});

/**
 * Instrument-lab presentation for local-shadow manual A/B only. The name is
 * deliberately qualified by `science-cinematic` and `v362`; it is unrelated
 * to the formal product's immutable Legacy V9 default.
 */
const V9_INSTRUMENT_LAB: AtlasVisualRendererProfileV299 = Object.freeze({
  ...V8,
  id: ATLAS_VISUAL_PROFILE_CANDIDATE_V362,
  exposureMultiplier: Object.freeze({ atlas: 0.78, inspect: 0.76, launch: 0.72, kerr: 0.69, "exoplanet-system": 0.78 }),
  catalogOpacityMultiplier: 0.58,
  planetRoughnessMultiplier: 0.84,
  planetRoughnessMinimum: 0.48,
  planetEnvironmentOffset: 0.038,
  planetEnvironmentMaximum: 0.26,
  kerrOpacity: 0.65,
  kerrFlowSpeed: 0.31,
  kerrFlowStrength: 0.47,
  launchCoreOpacity: 0.18,
  launchHaloOpacity: 0.036,
  launchShockOpacity: 0.027,
  exoplanetTemperatureColorMix: 0.49,
  exoplanetOrbitOpacity: 0.6,
  groups: Object.freeze({
    sky: Object.freeze({ ...V8.groups.sky, backgroundExposure: 0.76, blackLevel: 0.025, highlightShoulder: 0.71, starLuminance: 0.7, milkyWayOpacity: 0.73, nebulaOpacity: 0.62 }),
    solar: Object.freeze({ ...V8.groups.solar, sunSurfaceLuminance: 0.79, terminatorSoftness: 1.39, cloudOpacity: 0.86, nightSideExposure: 0.72, ringOpticalDepth: 1.12, ringShadowStrength: 1.17 }),
    catalog: Object.freeze({ ...V8.groups.catalog, brightStarOpacity: 0.77, faintStarOpacity: 0.64, deepSkyMarkerOpacity: 0.67, cosmicPointOpacity: 0.7, distanceLuminanceFalloff: 1.13 }),
    postFx: Object.freeze({ ...V8.groups.postFx, bloomStrength: 0.51, bloomThreshold: 1.34, vignetteStrength: 1, saturation: 0.83 }),
    hud: Object.freeze({ ...V8.groups.hud, borderOpacity: 0.78, backdropOpacity: 0.86, measurementColor: "#c5f7ff", riskColor: "#ffd5a3" }),
  }),
  v5TokensApplied: false,
  v6TokensApplied: false,
  v7TokensApplied: false,
  v8TokensApplied: false,
  v9TokensApplied: true,
  runtimeTokens: Object.freeze({
    ...V8.runtimeTokens,
    strongGravity: Object.freeze({ opacity: 0.65, flowSpeed: 0.31, flowStrength: 0.47, scienceDisplayTransform: "linear-no-grade" as const }),
    launch: Object.freeze({ coreOpacity: 0.18, haloOpacity: 0.036, shockOpacity: 0.027, detailSeed: 362 }),
    exoplanet: Object.freeze({ temperatureColorMix: 0.49, orbitOpacity: 0.6 }),
    hud: Object.freeze({
      ...V8.runtimeTokens.hud,
      borderOpacity: 0.78,
      backdropOpacity: 0.86,
      measurementColor: "#c5f7ff",
      riskColor: "#ffd5a3",
      scienceMeasurementColor: "#c5f7ff",
      riskBoundaryColor: "#ffd5a3",
      instrumentLabV9: Object.freeze({
        panelOpacity: 0.86 as const,
        uncertaintyGridOpacity: 0.18 as const,
        eigenmodeAccent: 0.74 as const,
        calibrationAlertOpacity: 0.88 as const,
        provenanceStripeOpacity: 0.42 as const,
        detailSeed: 362 as const,
      }),
    }),
    strongGravityV9: Object.freeze({
      scienceExposure: 1 as const,
      scienceBloom: 0 as const,
      scienceNoise: 0 as const,
      cinematicExposure: 0.69 as const,
      cinematicBloom: 0.28 as const,
      diskDetailSeed: 362 as const,
      redshiftColorStrength: 0.52 as const,
      dopplerColorStrength: 0.58 as const,
      spectralRibbonOpacity: 0.66 as const,
      reticleLuminance: 0.86 as const,
      channelSeparation: 0.6 as const,
      uncertaintyContourOpacity: 0.48 as const,
      detectorGridOpacity: 0.34 as const,
      calibrationAlertLuminance: 0.9 as const,
    }),
  }),
});

/** Observatory geometry and measured-expectation presentation; local-shadow manual A/B only. */
const V10_OBSERVATORY: AtlasVisualRendererProfileV299 = Object.freeze({
  ...V9_INSTRUMENT_LAB,
  id: ATLAS_VISUAL_PROFILE_CANDIDATE_V370,
  exposureMultiplier: Object.freeze({ atlas: 0.77, inspect: 0.75, launch: 0.71, kerr: 0.67, "exoplanet-system": 0.77 }),
  catalogOpacityMultiplier: 0.57,
  planetRoughnessMultiplier: 0.83,
  planetRoughnessMinimum: 0.49,
  planetEnvironmentOffset: 0.036,
  planetEnvironmentMaximum: 0.25,
  kerrOpacity: 0.64,
  kerrFlowSpeed: 0.3,
  kerrFlowStrength: 0.45,
  launchCoreOpacity: 0.17,
  launchHaloOpacity: 0.033,
  launchShockOpacity: 0.024,
  exoplanetTemperatureColorMix: 0.47,
  exoplanetOrbitOpacity: 0.58,
  groups: Object.freeze({
    sky: Object.freeze({ ...V9_INSTRUMENT_LAB.groups.sky, backgroundExposure: 0.75, blackLevel: 0.023, highlightShoulder: 0.69, starLuminance: 0.69, milkyWayOpacity: 0.71, nebulaOpacity: 0.6 }),
    solar: Object.freeze({ ...V9_INSTRUMENT_LAB.groups.solar, sunSurfaceLuminance: 0.78, terminatorSoftness: 1.41, cloudOpacity: 0.85, nightSideExposure: 0.71, ringOpticalDepth: 1.1, ringShadowStrength: 1.15 }),
    catalog: Object.freeze({ ...V9_INSTRUMENT_LAB.groups.catalog, brightStarOpacity: 0.75, faintStarOpacity: 0.62, deepSkyMarkerOpacity: 0.65, cosmicPointOpacity: 0.68, distanceLuminanceFalloff: 1.11 }),
    postFx: Object.freeze({ ...V9_INSTRUMENT_LAB.groups.postFx, bloomStrength: 0.47, bloomThreshold: 1.37, vignetteStrength: 0.98, saturation: 0.82 }),
    hud: Object.freeze({ ...V9_INSTRUMENT_LAB.groups.hud, borderOpacity: 0.82, backdropOpacity: 0.89, measurementColor: "#d2fbff", riskColor: "#ffcf9b" }),
  }),
  v5TokensApplied: false,
  v6TokensApplied: false,
  v7TokensApplied: false,
  v8TokensApplied: false,
  v9TokensApplied: false,
  v10TokensApplied: true,
  runtimeTokens: Object.freeze({
    ...V9_INSTRUMENT_LAB.runtimeTokens,
    strongGravity: Object.freeze({ opacity: 0.64, flowSpeed: 0.3, flowStrength: 0.45, scienceDisplayTransform: "linear-no-grade" as const }),
    launch: Object.freeze({ coreOpacity: 0.17, haloOpacity: 0.033, shockOpacity: 0.024, detailSeed: 370 }),
    exoplanet: Object.freeze({ temperatureColorMix: 0.47, orbitOpacity: 0.58 }),
    hud: Object.freeze({ ...V9_INSTRUMENT_LAB.runtimeTokens.hud, borderOpacity: 0.82, backdropOpacity: 0.89, measurementColor: "#d2fbff", riskColor: "#ffcf9b", scienceMeasurementColor: "#d2fbff", riskBoundaryColor: "#ffcf9b", observatoryHudV10: Object.freeze({ panelOpacity: 0.9 as const, geometryGridOpacity: 0.22 as const, apertureArcOpacity: 0.68 as const, photonTraceOpacity: 0.58 as const, provenanceStripeOpacity: 0.48 as const, unavailablePulseOpacity: 0.72 as const, detailSeed: 370 as const }) }),
    strongGravityV10: Object.freeze({ scienceExposure: 1 as const, scienceBloom: 0 as const, scienceNoise: 0 as const, cinematicExposure: 0.67 as const, cinematicBloom: 0.25 as const, diskDetailSeed: 370 as const, redshiftColorStrength: 0.5 as const, dopplerColorStrength: 0.56 as const, spectralRibbonOpacity: 0.62 as const, reticleLuminance: 0.9 as const, channelSeparation: 0.58 as const, uncertaintyContourOpacity: 0.52 as const, detectorGridOpacity: 0.39 as const, calibrationAlertLuminance: 0.92 as const, apertureTraceOpacity: 0.46 as const, electronBudgetOpacity: 0.64 as const }),
  }),
  localShadowDefaultEligible: false,
  defaultApplied: false,
  boundary: "visual-only-no-physics-or-science-mutation",
});

/** Cryogenic measurement chamber: authority rails, electron columns and uncertainty halos. */
const V11_MEASUREMENT_LAB: AtlasVisualRendererProfileV299 = Object.freeze({
  ...V10_OBSERVATORY,
  id: ATLAS_VISUAL_PROFILE_CANDIDATE_V377,
  exposureMultiplier: Object.freeze({ atlas: 0.75, inspect: 0.73, launch: 0.69, kerr: 0.65, "exoplanet-system": 0.75 }),
  catalogOpacityMultiplier: 0.55,
  planetRoughnessMultiplier: 0.82,
  planetRoughnessMinimum: 0.5,
  planetEnvironmentOffset: 0.034,
  planetEnvironmentMaximum: 0.24,
  kerrOpacity: 0.62,
  kerrFlowSpeed: 0.28,
  kerrFlowStrength: 0.43,
  launchCoreOpacity: 0.16,
  launchHaloOpacity: 0.03,
  launchShockOpacity: 0.022,
  exoplanetTemperatureColorMix: 0.45,
  exoplanetOrbitOpacity: 0.56,
  groups: Object.freeze({
    sky: Object.freeze({ ...V10_OBSERVATORY.groups.sky, backgroundExposure: 0.73, blackLevel: 0.024, highlightShoulder: 0.67, starLuminance: 0.67, milkyWayOpacity: 0.69, nebulaOpacity: 0.58 }),
    solar: Object.freeze({ ...V10_OBSERVATORY.groups.solar, sunSurfaceLuminance: 0.76, terminatorSoftness: 1.43, cloudOpacity: 0.84, nightSideExposure: 0.69, ringOpticalDepth: 1.11, ringShadowStrength: 1.16 }),
    catalog: Object.freeze({ ...V10_OBSERVATORY.groups.catalog, brightStarOpacity: 0.73, faintStarOpacity: 0.6, deepSkyMarkerOpacity: 0.63, cosmicPointOpacity: 0.66, distanceLuminanceFalloff: 1.12 }),
    postFx: Object.freeze({ ...V10_OBSERVATORY.groups.postFx, bloomStrength: 0.43, bloomThreshold: 1.42, vignetteStrength: 1.02, saturation: 0.79 }),
    hud: Object.freeze({ ...V10_OBSERVATORY.groups.hud, borderOpacity: 0.86, backdropOpacity: 0.92, measurementColor: "#d8fcff", riskColor: "#ffd18c" }),
  }),
  v5TokensApplied: false,
  v6TokensApplied: false,
  v7TokensApplied: false,
  v8TokensApplied: false,
  v9TokensApplied: false,
  v10TokensApplied: false,
  v11TokensApplied: true,
  runtimeTokens: Object.freeze({
    ...V10_OBSERVATORY.runtimeTokens,
    strongGravity: Object.freeze({ opacity: 0.62, flowSpeed: 0.28, flowStrength: 0.43, scienceDisplayTransform: "linear-no-grade" as const }),
    launch: Object.freeze({ coreOpacity: 0.16, haloOpacity: 0.03, shockOpacity: 0.022, detailSeed: 377 }),
    exoplanet: Object.freeze({ temperatureColorMix: 0.45, orbitOpacity: 0.56 }),
    hud: Object.freeze({ ...V10_OBSERVATORY.runtimeTokens.hud, borderOpacity: 0.86, backdropOpacity: 0.92, measurementColor: "#d8fcff", riskColor: "#ffd18c", scienceMeasurementColor: "#d8fcff", riskBoundaryColor: "#ffd18c", measurementLabV11: Object.freeze({ panelOpacity: 0.94 as const, metrologyGridOpacity: 0.26 as const, electronColumnOpacity: 0.7 as const, uncertaintyHaloOpacity: 0.38 as const, shaRailOpacity: 0.56 as const, authorityGateLuminance: 0.92 as const, unavailableScanOpacity: 0.64 as const, detailSeed: 377 as const }) }),
    strongGravityV11: Object.freeze({ scienceExposure: 1 as const, scienceBloom: 0 as const, scienceNoise: 0 as const, cinematicExposure: 0.65 as const, cinematicBloom: 0.22 as const, diskDetailSeed: 377 as const, redshiftColorStrength: 0.48 as const, dopplerColorStrength: 0.54 as const, spectralRibbonOpacity: 0.58 as const, reticleLuminance: 0.94 as const, channelSeparation: 0.55 as const, uncertaintyContourOpacity: 0.56 as const, detectorGridOpacity: 0.44 as const, calibrationAlertLuminance: 0.94 as const, apertureTraceOpacity: 0.5 as const, electronBudgetOpacity: 0.72 as const, varianceLayerOpacity: 0.62 as const }),
  }),
  localShadowDefaultEligible: false,
  defaultApplied: false,
  boundary: "visual-only-no-physics-or-science-mutation",
});

/** Provenance-aware observation hub; V11 and all Science payload semantics remain frozen. */
const V12_OBSERVATION_HUB: AtlasVisualRendererProfileV299 = Object.freeze({
  ...V11_MEASUREMENT_LAB,
  id: ATLAS_VISUAL_PROFILE_CANDIDATE_V400,
  exposureMultiplier: Object.freeze({ atlas: 0.74, inspect: 0.72, launch: 0.68, kerr: 0.63, "exoplanet-system": 0.74 }),
  catalogOpacityMultiplier: 0.54,
  planetRoughnessMultiplier: 0.81,
  planetRoughnessMinimum: 0.51,
  planetEnvironmentOffset: 0.032,
  planetEnvironmentMaximum: 0.23,
  kerrOpacity: 0.61,
  kerrFlowSpeed: 0.27,
  kerrFlowStrength: 0.42,
  launchCoreOpacity: 0.155,
  launchHaloOpacity: 0.028,
  launchShockOpacity: 0.02,
  exoplanetTemperatureColorMix: 0.44,
  exoplanetOrbitOpacity: 0.55,
  groups: Object.freeze({
    sky: Object.freeze({ ...V11_MEASUREMENT_LAB.groups.sky, backgroundExposure: 0.72, blackLevel: 0.023, highlightShoulder: 0.65, starLuminance: 0.66, milkyWayOpacity: 0.68, nebulaOpacity: 0.56 }),
    solar: Object.freeze({ ...V11_MEASUREMENT_LAB.groups.solar, sunSurfaceLuminance: 0.75, terminatorSoftness: 1.44, cloudOpacity: 0.83, nightSideExposure: 0.68, ringOpticalDepth: 1.1, ringShadowStrength: 1.15 }),
    catalog: Object.freeze({ ...V11_MEASUREMENT_LAB.groups.catalog, brightStarOpacity: 0.72, faintStarOpacity: 0.59, deepSkyMarkerOpacity: 0.62, cosmicPointOpacity: 0.65, distanceLuminanceFalloff: 1.11 }),
    postFx: Object.freeze({ ...V11_MEASUREMENT_LAB.groups.postFx, bloomStrength: 0.4, bloomThreshold: 1.45, vignetteStrength: 1, saturation: 0.78 }),
    hud: Object.freeze({ ...V11_MEASUREMENT_LAB.groups.hud, borderOpacity: 0.88, backdropOpacity: 0.94, measurementColor: "#dcfff7", riskColor: "#ffd09a" }),
  }),
  v5TokensApplied: false,
  v6TokensApplied: false,
  v7TokensApplied: false,
  v8TokensApplied: false,
  v9TokensApplied: false,
  v10TokensApplied: false,
  v11TokensApplied: false,
  v12TokensApplied: true,
  runtimeTokens: Object.freeze({
    ...V11_MEASUREMENT_LAB.runtimeTokens,
    strongGravity: Object.freeze({ opacity: 0.61, flowSpeed: 0.27, flowStrength: 0.42, scienceDisplayTransform: "linear-no-grade" as const }),
    launch: Object.freeze({ coreOpacity: 0.155, haloOpacity: 0.028, shockOpacity: 0.02, detailSeed: 400 }),
    exoplanet: Object.freeze({ temperatureColorMix: 0.44, orbitOpacity: 0.55 }),
    hud: Object.freeze({
      ...V11_MEASUREMENT_LAB.runtimeTokens.hud,
      borderOpacity: 0.88,
      backdropOpacity: 0.94,
      measurementColor: "#dcfff7",
      riskColor: "#ffd09a",
      scienceMeasurementColor: "#dcfff7",
      riskBoundaryColor: "#ffd09a",
      observationHubV12: Object.freeze({ panelOpacity: 0.96 as const, topologyTraceOpacity: 0.68 as const, sourceBayOpacity: 0.74 as const, boundaryLuminance: 0.95 as const, missingPulseOpacity: 0.46 as const, dockingGridOpacity: 0.3 as const, stageRailOpacity: 0.72 as const, detailSeed: 400 as const }),
    }),
    strongGravityV12: Object.freeze({ scienceExposure: 1 as const, scienceBloom: 0 as const, scienceNoise: 0 as const, cinematicExposure: 0.63 as const, cinematicBloom: 0.2 as const, diskDetailSeed: 400 as const, redshiftColorStrength: 0.46 as const, dopplerColorStrength: 0.52 as const, spectralRibbonOpacity: 0.56 as const, reticleLuminance: 0.96 as const, channelSeparation: 0.53 as const, uncertaintyContourOpacity: 0.58 as const, detectorGridOpacity: 0.46 as const, calibrationAlertLuminance: 0.95 as const, apertureTraceOpacity: 0.52 as const, electronBudgetOpacity: 0.74 as const, varianceLayerOpacity: 0.64 as const, provenanceRailOpacity: 0.68 as const }),
  }),
  localShadowDefaultEligible: false,
  defaultApplied: false,
  boundary: "visual-only-no-physics-or-science-mutation",
});

/** Orbital evidence vault: bounded lineage, checksum rails and fail-closed qualification. */
const V13_EVIDENCE_OBSERVATORY: AtlasVisualRendererProfileV299 = Object.freeze({
  ...V12_OBSERVATION_HUB,
  id: ATLAS_VISUAL_PROFILE_CANDIDATE_V405,
  exposureMultiplier: Object.freeze({ atlas: 0.73, inspect: 0.71, launch: 0.67, kerr: 0.62, "exoplanet-system": 0.73 }),
  catalogOpacityMultiplier: 0.53,
  planetRoughnessMultiplier: 0.8,
  planetRoughnessMinimum: 0.52,
  planetEnvironmentOffset: 0.03,
  planetEnvironmentMaximum: 0.22,
  kerrOpacity: 0.6,
  kerrFlowSpeed: 0.26,
  kerrFlowStrength: 0.41,
  launchCoreOpacity: 0.15,
  launchHaloOpacity: 0.026,
  launchShockOpacity: 0.019,
  exoplanetTemperatureColorMix: 0.43,
  exoplanetOrbitOpacity: 0.54,
  groups: Object.freeze({
    sky: Object.freeze({ ...V12_OBSERVATION_HUB.groups.sky, backgroundExposure: 0.71, blackLevel: 0.022, highlightShoulder: 0.64, starLuminance: 0.65, milkyWayOpacity: 0.67, nebulaOpacity: 0.55 }),
    solar: Object.freeze({ ...V12_OBSERVATION_HUB.groups.solar, sunSurfaceLuminance: 0.74, terminatorSoftness: 1.45, cloudOpacity: 0.82, nightSideExposure: 0.67, ringOpticalDepth: 1.09, ringShadowStrength: 1.14 }),
    catalog: Object.freeze({ ...V12_OBSERVATION_HUB.groups.catalog, brightStarOpacity: 0.71, faintStarOpacity: 0.58, deepSkyMarkerOpacity: 0.61, cosmicPointOpacity: 0.64, distanceLuminanceFalloff: 1.1 }),
    postFx: Object.freeze({ ...V12_OBSERVATION_HUB.groups.postFx, bloomStrength: 0.38, bloomThreshold: 1.48, vignetteStrength: 0.99, saturation: 0.77 }),
    hud: Object.freeze({ ...V12_OBSERVATION_HUB.groups.hud, borderOpacity: 0.9, backdropOpacity: 0.95, measurementColor: "#ddfff9", riskColor: "#ffd19f" }),
  }),
  v5TokensApplied: false,
  v6TokensApplied: false,
  v7TokensApplied: false,
  v8TokensApplied: false,
  v9TokensApplied: false,
  v10TokensApplied: false,
  v11TokensApplied: false,
  v12TokensApplied: false,
  v13TokensApplied: true,
  runtimeTokens: Object.freeze({
    ...V12_OBSERVATION_HUB.runtimeTokens,
    strongGravity: Object.freeze({ opacity: 0.6, flowSpeed: 0.26, flowStrength: 0.41, scienceDisplayTransform: "linear-no-grade" as const }),
    launch: Object.freeze({ coreOpacity: 0.15, haloOpacity: 0.026, shockOpacity: 0.019, detailSeed: 405 }),
    exoplanet: Object.freeze({ temperatureColorMix: 0.43, orbitOpacity: 0.54 }),
    hud: Object.freeze({
      ...V12_OBSERVATION_HUB.runtimeTokens.hud,
      borderOpacity: 0.9,
      backdropOpacity: 0.95,
      measurementColor: "#ddfff9",
      riskColor: "#ffd19f",
      scienceMeasurementColor: "#ddfff9",
      riskBoundaryColor: "#ffd19f",
      evidenceObservatoryV13: Object.freeze({ panelOpacity: 0.97 as const, lineageTraceOpacity: 0.72 as const, nodeLuminance: 0.84 as const, checksumRailOpacity: 0.64 as const, failClosedAmberOpacity: 0.58 as const, baselineArcOpacity: 0.76 as const, evidenceGrainOpacity: 0.18 as const, detailSeed: 405 as const }),
    }),
  }),
  localShadowDefaultEligible: false,
  defaultApplied: false,
  boundary: "visual-only-no-physics-or-science-mutation",
});

const LEGACY_CACHE = new Map<AtlasVisualProfileV274, AtlasVisualRendererProfileV299>();

export function resolveAtlasVisualProfileV299(profile: AtlasVisualProfileV299): AtlasVisualRendererProfileV299 {
  if (profile === ATLAS_VISUAL_PROFILE_CANDIDATE_V405) return V13_EVIDENCE_OBSERVATORY;
  if (profile === ATLAS_VISUAL_PROFILE_CANDIDATE_V400) return V12_OBSERVATION_HUB;
  if (profile === ATLAS_VISUAL_PROFILE_CANDIDATE_V377) return V11_MEASUREMENT_LAB;
  if (profile === ATLAS_VISUAL_PROFILE_CANDIDATE_V370) return V10_OBSERVATORY;
  if (profile === ATLAS_VISUAL_PROFILE_CANDIDATE_V362) return V9_INSTRUMENT_LAB;
  if (profile === ATLAS_VISUAL_PROFILE_CANDIDATE_V349) return V8;
  if (profile === ATLAS_VISUAL_PROFILE_CANDIDATE_V340) return V7;
  if (profile === ATLAS_VISUAL_PROFILE_CANDIDATE_V300) return V6;
  if (profile === ATLAS_VISUAL_PROFILE_CANDIDATE_V299) return V5;
  const existing = LEGACY_CACHE.get(profile);
  if (existing) return existing;
  const previous = resolveAtlasVisualProfileV285(profile);
  const compatible = Object.freeze({
    ...previous,
    v5TokensApplied: false,
  }) as AtlasVisualRendererProfileV299;
  LEGACY_CACHE.set(profile, compatible);
  return compatible;
}

export function resolveAtlasInitialVisualProfileV299(args: {
  build: "formal" | "standalone-full" | "vercel-lite" | "local-shadow";
}): { profile: "legacy-v9"; v5ManualAbAvailable: boolean; v6ManualAbAvailable: boolean; v7ManualAbAvailable: boolean; v8ManualAbAvailable: boolean; v9InstrumentLabManualAbAvailable: boolean; v10ObservatoryManualAbAvailable: boolean; v11MeasurementLabManualAbAvailable: boolean; v12ObservationHubManualAbAvailable: boolean; v13EvidenceObservatoryManualAbAvailable: boolean; localShadowDefaultApplied: false } {
  return {
    profile: "legacy-v9",
    v5ManualAbAvailable: args.build === "local-shadow",
    v6ManualAbAvailable: args.build === "local-shadow",
    v7ManualAbAvailable: args.build === "local-shadow",
    v8ManualAbAvailable: args.build === "local-shadow",
    v9InstrumentLabManualAbAvailable: args.build === "local-shadow",
    v10ObservatoryManualAbAvailable: args.build === "local-shadow",
    v11MeasurementLabManualAbAvailable: args.build === "local-shadow",
    v12ObservationHubManualAbAvailable: args.build === "local-shadow",
    v13EvidenceObservatoryManualAbAvailable: args.build === "local-shadow",
    localShadowDefaultApplied: false,
  };
}

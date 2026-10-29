import {
  ATLAS_VISUAL_PROFILE_CANDIDATE_V285,
  ATLAS_VISUAL_RENDERER_PROFILES_V274,
  resolveAtlasVisualProfileV274,
  type AtlasVisualProfileV274,
  type AtlasVisualRendererProfileV274,
} from "./atlasVisualProfileV274";

export type AtlasVisualRendererProfileV285 = AtlasVisualRendererProfileV274 & {
  v4TokensApplied: boolean;
  scienceBufferIsolation: "immutable-ray-payload";
  cinematicDecoration: "seeded-only";
  runtimeTokens: AtlasVisualRuntimeTokensV285;
};

export type AtlasVisualRuntimeTokensV285 = {
  strongGravity: {
    opacity: number;
    flowSpeed: number;
    flowStrength: number;
    scienceDisplayTransform: "linear-no-grade";
  };
  launch: {
    coreOpacity: number;
    haloOpacity: number;
    shockOpacity: number;
    detailSeed: number;
  };
  exoplanet: {
    temperatureColorMix: number;
    orbitOpacity: number;
  };
  hud: AtlasVisualRendererProfileV274["groups"]["hud"] & {
    scienceMeasurementColor: string;
    riskBoundaryColor: string;
  };
};

export type AtlasVisualRuntimeTokenAuditV285R1 = {
  version: "v285r1-visual-runtime-token-audit";
  profile: AtlasVisualProfileV274;
  groups: Readonly<Record<"sky" | "solar" | "catalog" | "postFx" | "strongGravity" | "launch" | "exoplanet" | "hud", "runtime-consumer-required">>;
  legacyProfilesPreserved: true;
  singleCanvas: true;
  sceneRevisionMutation: "not-applied";
};

export type AtlasStableVisualProfileCacheV286 = Readonly<
  Record<AtlasVisualProfileV274, AtlasVisualRendererProfileV285>
>;

export function resolveAtlasInitialVisualProfileV285(args: {
  build: "formal" | "standalone-full" | "vercel-lite" | "local-shadow";
  qualified: boolean;
}): { profile: AtlasVisualProfileV274; formalDefault: "legacy-v9"; localShadowDefaultApplied: boolean; publicDeploymentBlocked: true } {
  const enabled = args.build === "local-shadow" && args.qualified;
  return {
    profile: enabled ? ATLAS_VISUAL_PROFILE_CANDIDATE_V285 : "legacy-v9",
    formalDefault: "legacy-v9",
    localShadowDefaultApplied: enabled,
    publicDeploymentBlocked: true,
  };
}

function buildAtlasVisualProfileV285(profile: AtlasVisualProfileV274): AtlasVisualRendererProfileV285 {
  const resolved = resolveAtlasVisualProfileV274(profile);
  return Object.freeze({
    ...resolved,
    exposureMultiplier: Object.freeze({ ...resolved.exposureMultiplier }),
    groups: Object.freeze({
      sky: Object.freeze({ ...resolved.groups.sky }),
      solar: Object.freeze({ ...resolved.groups.solar }),
      catalog: Object.freeze({ ...resolved.groups.catalog }),
      postFx: Object.freeze({ ...resolved.groups.postFx }),
      hud: Object.freeze({ ...resolved.groups.hud }),
    }),
    v4TokensApplied: profile === ATLAS_VISUAL_PROFILE_CANDIDATE_V285,
    scienceBufferIsolation: "immutable-ray-payload",
    cinematicDecoration: "seeded-only",
    runtimeTokens: Object.freeze({
      strongGravity: Object.freeze({
        opacity: resolved.kerrOpacity,
        flowSpeed: resolved.kerrFlowSpeed,
        flowStrength: resolved.kerrFlowStrength,
        scienceDisplayTransform: "linear-no-grade",
      }),
      launch: Object.freeze({
        coreOpacity: resolved.launchCoreOpacity,
        haloOpacity: resolved.launchHaloOpacity,
        shockOpacity: resolved.launchShockOpacity,
        detailSeed: 285,
      }),
      exoplanet: Object.freeze({
        temperatureColorMix: resolved.exoplanetTemperatureColorMix,
        orbitOpacity: resolved.exoplanetOrbitOpacity,
      }),
      hud: Object.freeze({
        ...resolved.groups.hud,
        scienceMeasurementColor: resolved.groups.hud.measurementColor,
        riskBoundaryColor: resolved.groups.hud.riskColor,
      }),
    }),
  });
}

export const ATLAS_STABLE_VISUAL_PROFILE_CACHE_V286: AtlasStableVisualProfileCacheV286 =
  Object.freeze(Object.fromEntries(
    (Object.keys(ATLAS_VISUAL_RENDERER_PROFILES_V274) as AtlasVisualProfileV274[])
      .map((profile) => [profile, buildAtlasVisualProfileV285(profile)]),
  ) as Record<AtlasVisualProfileV274, AtlasVisualRendererProfileV285>);

export function resolveAtlasVisualProfileV285(profile: AtlasVisualProfileV274): AtlasVisualRendererProfileV285 {
  return ATLAS_STABLE_VISUAL_PROFILE_CACHE_V286[profile]
    ?? ATLAS_STABLE_VISUAL_PROFILE_CACHE_V286["legacy-v9"];
}

export function createAtlasVisualRuntimeTokenAuditV285R1(profile: AtlasVisualProfileV274): AtlasVisualRuntimeTokenAuditV285R1 {
  return {
    version: "v285r1-visual-runtime-token-audit",
    profile,
    groups: {
      sky: "runtime-consumer-required",
      solar: "runtime-consumer-required",
      catalog: "runtime-consumer-required",
      postFx: "runtime-consumer-required",
      strongGravity: "runtime-consumer-required",
      launch: "runtime-consumer-required",
      exoplanet: "runtime-consumer-required",
      hud: "runtime-consumer-required",
    },
    legacyProfilesPreserved: true,
    singleCanvas: true,
    sceneRevisionMutation: "not-applied",
  };
}

export const ATLAS_VISUAL_TOKEN_FIELD_AUDIT_VERSION_V316 = "v316-visual-token-field-audit-v1" as const;

export const ATLAS_VISUAL_TOKEN_FIELDS_V316 = Object.freeze({
  sky: Object.freeze(["backgroundExposure", "blackLevel", "highlightShoulder", "starLuminance", "milkyWayOpacity", "nebulaOpacity"]),
  solar: Object.freeze(["sunSurfaceLuminance", "terminatorSoftness", "cloudOpacity", "nightSideExposure", "ringOpticalDepth", "ringShadowStrength"]),
  catalog: Object.freeze(["brightStarOpacity", "faintStarOpacity", "deepSkyMarkerOpacity", "cosmicPointOpacity", "distanceLuminanceFalloff"]),
  postFx: Object.freeze(["bloomStrength", "bloomThreshold", "vignetteStrength", "saturation"]),
  strongGravity: Object.freeze(["opacity", "flowSpeed", "flowStrength", "scienceDisplayTransform", "scienceExposure", "scienceBloom", "scienceNoise", "cinematicExposure", "cinematicBloom", "diskDetailSeed", "redshiftColorStrength", "dopplerColorStrength"]),
  launch: Object.freeze(["coreOpacity", "haloOpacity", "shockOpacity", "detailSeed"]),
  exoplanet: Object.freeze(["temperatureColorMix", "orbitOpacity"]),
  hud: Object.freeze(["density", "measurementColor", "riskColor", "borderOpacity", "backdropOpacity", "scienceMeasurementColor", "riskBoundaryColor"]),
} as const);

export type AtlasVisualTokenFieldGroupV316 = keyof typeof ATLAS_VISUAL_TOKEN_FIELDS_V316;

export type AtlasVisualTokenConsumerFieldV316 = Readonly<{
  token: string;
  expression: string;
}>;

export type AtlasVisualTokenFieldConsumerV316 = Readonly<{
  source: string;
  group: AtlasVisualTokenFieldGroupV316;
  fields: readonly AtlasVisualTokenConsumerFieldV316[];
}>;

export const ATLAS_VISUAL_TOKEN_FIELD_CONSUMERS_V316: readonly AtlasVisualTokenFieldConsumerV316[] = Object.freeze([
  {
    source: "app/components/GalaxyEnvironmentSupport.ts",
    group: "sky",
    fields: [
      { token: "backgroundExposure", expression: "sky.backgroundExposure" },
      { token: "blackLevel", expression: "sky.blackLevel" },
      { token: "highlightShoulder", expression: "sky.highlightShoulder" },
    ],
  },
  {
    source: "app/components/GalaxyEnvironmentSphere.tsx",
    group: "sky",
    fields: [
      { token: "starLuminance", expression: "visualSky.starLuminance" },
      { token: "milkyWayOpacity", expression: "visualSky.milkyWayOpacity" },
      { token: "nebulaOpacity", expression: "visualSky.nebulaOpacity" },
    ],
  },
  {
    source: "app/components/Planet.tsx",
    group: "solar",
    fields: [
      { token: "terminatorSoftness", expression: "groups.solar.terminatorSoftness" },
      { token: "cloudOpacity", expression: "groups.solar.cloudOpacity" },
      { token: "nightSideExposure", expression: "groups.solar.nightSideExposure" },
    ],
  },
  {
    source: "app/components/SunBody.tsx",
    group: "solar",
    fields: [{ token: "sunSurfaceLuminance", expression: "groups.solar.sunSurfaceLuminance" }],
  },
  {
    source: "app/components/SaturnRingLayers.tsx",
    group: "solar",
    fields: [
      { token: "ringOpticalDepth", expression: "groups.solar.ringOpticalDepth" },
      { token: "ringShadowStrength", expression: "groups.solar.ringShadowStrength" },
    ],
  },
  {
    source: "app/components/GaiaStarField.tsx",
    group: "catalog",
    fields: [
      { token: "brightStarOpacity", expression: "groups.catalog.brightStarOpacity" },
      { token: "distanceLuminanceFalloff", expression: "groups.catalog.distanceLuminanceFalloff" },
    ],
  },
  {
    source: "app/components/CatalogFaintStarFieldV272.tsx",
    group: "catalog",
    fields: [{ token: "faintStarOpacity", expression: "groups.catalog.faintStarOpacity" }],
  },
  {
    source: "app/components/StarClusterMarkers.tsx",
    group: "catalog",
    fields: [{ token: "deepSkyMarkerOpacity", expression: "groups.catalog.deepSkyMarkerOpacity" }],
  },
  {
    source: "app/components/CosmicScaleDataLayerV260.tsx",
    group: "catalog",
    fields: [{ token: "cosmicPointOpacity", expression: "groups.catalog.cosmicPointOpacity" }],
  },
  {
    source: "app/components/UniversePmndrsPostProcessing.tsx",
    group: "postFx",
    fields: [
      { token: "bloomStrength", expression: "groups.postFx.bloomStrength" },
      { token: "bloomThreshold", expression: "groups.postFx.bloomThreshold" },
      { token: "vignetteStrength", expression: "groups.postFx.vignetteStrength" },
    ],
  },
  {
    source: "app/components/GalaxyEnvironmentSphere.tsx",
    group: "postFx",
    fields: [{ token: "saturation", expression: "groups.postFx.saturation" }],
  },
  {
    source: "app/components/KerrBlackHole.tsx",
    group: "strongGravity",
    fields: [
      { token: "opacity", expression: "runtimeTokens.strongGravity.opacity" },
      { token: "flowSpeed", expression: "runtimeTokens.strongGravity.flowSpeed" },
      { token: "flowStrength", expression: "runtimeTokens.strongGravity.flowStrength" },
    ],
  },
  {
    source: "app/lib/kerrStrongGravityVisualV305.ts",
    group: "strongGravity",
    fields: [
      { token: "scienceDisplayTransform", expression: "strongGravity.scienceDisplayTransform" },
      { token: "scienceExposure", expression: "cinematic?.scienceExposure" },
      { token: "scienceBloom", expression: "cinematic?.scienceBloom" },
      { token: "scienceNoise", expression: "cinematic?.scienceNoise" },
      { token: "cinematicExposure", expression: "cinematic?.cinematicExposure" },
      { token: "cinematicBloom", expression: "cinematic?.cinematicBloom" },
      { token: "diskDetailSeed", expression: "cinematic?.diskDetailSeed" },
      { token: "redshiftColorStrength", expression: "cinematic?.redshiftColorStrength" },
      { token: "dopplerColorStrength", expression: "cinematic?.dopplerColorStrength" },
    ],
  },
  {
    source: "app/components/LaunchSceneView.tsx",
    group: "launch",
    fields: [
      { token: "coreOpacity", expression: "runtimeTokens.launch.coreOpacity" },
      { token: "haloOpacity", expression: "runtimeTokens.launch.haloOpacity" },
      { token: "shockOpacity", expression: "runtimeTokens.launch.shockOpacity" },
    ],
  },
  {
    source: "app/components/useLaunchSceneResources.ts",
    group: "launch",
    fields: [{ token: "detailSeed", expression: "runtimeTokens.launch.detailSeed" }],
  },
  {
    source: "app/components/ExoplanetSystemScene.tsx",
    group: "exoplanet",
    fields: [
      { token: "temperatureColorMix", expression: "runtimeTokens.exoplanet.temperatureColorMix" },
      { token: "orbitOpacity", expression: "runtimeTokens.exoplanet.orbitOpacity" },
    ],
  },
  {
    source: "app/components/ScienceCinematicVisualSurfaceV261.tsx",
    group: "hud",
    fields: [
      { token: "density", expression: "runtimeTokens.hud.density" },
      { token: "measurementColor", expression: "runtimeTokens.hud.measurementColor" },
      { token: "riskColor", expression: "runtimeTokens.hud.riskColor" },
      { token: "borderOpacity", expression: "runtimeTokens.hud.borderOpacity" },
      { token: "backdropOpacity", expression: "runtimeTokens.hud.backdropOpacity" },
      { token: "scienceMeasurementColor", expression: "runtimeTokens.hud.scienceMeasurementColor" },
      { token: "riskBoundaryColor", expression: "runtimeTokens.hud.riskBoundaryColor" },
    ],
  },
]);

export type AtlasVisualTokenFieldAuditV316 = Readonly<{
  version: typeof ATLAS_VISUAL_TOKEN_FIELD_AUDIT_VERSION_V316;
  status: "field-complete-static-consumer-contract" | "field-incomplete";
  requiredFieldCount: number;
  declaredFieldCount: number;
  consumerCount: number;
  missingByGroup: Readonly<Record<AtlasVisualTokenFieldGroupV316, readonly string[]>>;
  boundary: "source-contract-plus-runtime-group-signature-browser-matrix-pending";
}>;

export function createAtlasVisualTokenFieldAuditV316(): AtlasVisualTokenFieldAuditV316 {
  const declared = new Map<AtlasVisualTokenFieldGroupV316, Set<string>>();
  for (const consumer of ATLAS_VISUAL_TOKEN_FIELD_CONSUMERS_V316) {
    const group = declared.get(consumer.group) ?? new Set<string>();
    for (const field of consumer.fields) group.add(field.token);
    declared.set(consumer.group, group);
  }
  const missingByGroup = Object.fromEntries(
    (Object.keys(ATLAS_VISUAL_TOKEN_FIELDS_V316) as AtlasVisualTokenFieldGroupV316[])
      .map((group) => [group, ATLAS_VISUAL_TOKEN_FIELDS_V316[group].filter((field) => !declared.get(group)?.has(field))]),
  ) as Record<AtlasVisualTokenFieldGroupV316, string[]>;
  const requiredFieldCount = Object.values(ATLAS_VISUAL_TOKEN_FIELDS_V316).reduce((total, fields) => total + fields.length, 0);
  const declaredFieldCount = [...declared.values()].reduce((total, fields) => total + fields.size, 0);
  const complete = Object.values(missingByGroup).every((fields) => fields.length === 0) && declaredFieldCount === requiredFieldCount;
  return Object.freeze({
    version: ATLAS_VISUAL_TOKEN_FIELD_AUDIT_VERSION_V316,
    status: complete ? "field-complete-static-consumer-contract" : "field-incomplete",
    requiredFieldCount,
    declaredFieldCount,
    consumerCount: ATLAS_VISUAL_TOKEN_FIELD_CONSUMERS_V316.length,
    missingByGroup: Object.freeze(Object.fromEntries(Object.entries(missingByGroup).map(([group, fields]) => [group, Object.freeze(fields)]))) as AtlasVisualTokenFieldAuditV316["missingByGroup"],
    boundary: "source-contract-plus-runtime-group-signature-browser-matrix-pending",
  });
}

export const ATLAS_SCIENCE_CINEMATIC_V8_ID_V472 =
  "science-cinematic-v8-v472" as const;

export type AtlasScienceCinematicV8ModeV472 = "science" | "cinematic";

export type AtlasScienceCinematicV8TokensV472 = Readonly<{
  id: typeof ATLAS_SCIENCE_CINEMATIC_V8_ID_V472;
  mode: AtlasScienceCinematicV8ModeV472;
  localShadowOnly: true;
  defaultApplied: false;
  scientificFieldMutation: false;
  sky: Readonly<{
    zenith: string;
    horizon: string;
    starOpacity: number;
    milkyWayOpacity: number;
  }>;
  solar: Readonly<{
    sunCore: string;
    planetRim: string;
    ringOpacity: number;
  }>;
  catalog: Readonly<{
    pointColor: string;
    densityOpacity: number;
    selectionHalo: string;
  }>;
  strongGravity: Readonly<{
    linearDisplay: boolean;
    exposure: number;
    bloomIntensity: number;
    colorGradeIntensity: number;
    diskHot: string;
    diskCool: string;
    seed: string | null;
  }>;
  launch: Readonly<{
    plume: string;
    telemetry: string;
  }>;
  exoplanet: Readonly<{
    limb: string;
    atmosphere: string;
  }>;
  postFx: Readonly<{
    vignette: number;
    grain: number;
    chromaticAberration: number;
  }>;
  researchHud: Readonly<{
    ink: string;
    panel: string;
    grid: string;
    shortAuthority: string;
    coordinateAuthority: string;
    analyticFixture: string;
    unavailable: string;
    titleTrackingEm: number;
    statusPulse: boolean;
  }>;
}>;

export type AtlasVisualTokenConsumerBindingV472 = Readonly<{
  tokenPath: string;
  consumerId:
    | "sky-backdrop"
    | "sky-primer"
    | "solar-medallion"
    | "planet-ring"
    | "catalog-field"
    | "catalog-selection"
    | "strong-gravity-stage"
    | "accretion-disk-stage"
    | "launch-marker"
    | "exoplanet-marker"
    | "decorative-post-fx"
    | "observable-hud"
    | "error-rail";
  presentationOnly: true;
  scienceWritebackAllowed: false;
}>;

export const ATLAS_V8_TOKEN_PATHS_V472 = Object.freeze([
  "sky.zenith",
  "sky.horizon",
  "sky.starOpacity",
  "sky.milkyWayOpacity",
  "solar.sunCore",
  "solar.planetRim",
  "solar.ringOpacity",
  "catalog.pointColor",
  "catalog.densityOpacity",
  "catalog.selectionHalo",
  "strongGravity.linearDisplay",
  "strongGravity.exposure",
  "strongGravity.bloomIntensity",
  "strongGravity.colorGradeIntensity",
  "strongGravity.diskHot",
  "strongGravity.diskCool",
  "strongGravity.seed",
  "launch.plume",
  "launch.telemetry",
  "exoplanet.limb",
  "exoplanet.atmosphere",
  "postFx.vignette",
  "postFx.grain",
  "postFx.chromaticAberration",
  "researchHud.ink",
  "researchHud.panel",
  "researchHud.grid",
  "researchHud.shortAuthority",
  "researchHud.coordinateAuthority",
  "researchHud.analyticFixture",
  "researchHud.unavailable",
  "researchHud.titleTrackingEm",
  "researchHud.statusPulse",
] as const);

const bind = (
  tokenPath: string,
  consumerId: AtlasVisualTokenConsumerBindingV472["consumerId"],
): AtlasVisualTokenConsumerBindingV472 =>
  Object.freeze({
    tokenPath,
    consumerId,
    presentationOnly: true as const,
    scienceWritebackAllowed: false as const,
  });

export const ATLAS_V8_TOKEN_CONSUMER_BINDINGS_V472 = Object.freeze([
  bind("sky.zenith", "sky-backdrop"),
  bind("sky.horizon", "sky-backdrop"),
  bind("sky.starOpacity", "sky-primer"),
  bind("sky.milkyWayOpacity", "sky-primer"),
  bind("solar.sunCore", "solar-medallion"),
  bind("solar.planetRim", "solar-medallion"),
  bind("solar.ringOpacity", "planet-ring"),
  bind("catalog.pointColor", "catalog-field"),
  bind("catalog.densityOpacity", "catalog-field"),
  bind("catalog.selectionHalo", "catalog-selection"),
  bind("strongGravity.linearDisplay", "strong-gravity-stage"),
  bind("strongGravity.exposure", "strong-gravity-stage"),
  bind("strongGravity.bloomIntensity", "strong-gravity-stage"),
  bind("strongGravity.colorGradeIntensity", "strong-gravity-stage"),
  bind("strongGravity.diskHot", "accretion-disk-stage"),
  bind("strongGravity.diskCool", "accretion-disk-stage"),
  bind("strongGravity.seed", "accretion-disk-stage"),
  bind("launch.plume", "launch-marker"),
  bind("launch.telemetry", "launch-marker"),
  bind("exoplanet.limb", "exoplanet-marker"),
  bind("exoplanet.atmosphere", "exoplanet-marker"),
  bind("postFx.vignette", "decorative-post-fx"),
  bind("postFx.grain", "decorative-post-fx"),
  bind("postFx.chromaticAberration", "decorative-post-fx"),
  bind("researchHud.ink", "observable-hud"),
  bind("researchHud.panel", "observable-hud"),
  bind("researchHud.grid", "observable-hud"),
  bind("researchHud.shortAuthority", "observable-hud"),
  bind("researchHud.coordinateAuthority", "observable-hud"),
  bind("researchHud.analyticFixture", "observable-hud"),
  bind("researchHud.unavailable", "observable-hud"),
  bind("researchHud.titleTrackingEm", "observable-hud"),
  bind("researchHud.statusPulse", "error-rail"),
]);

const science: AtlasScienceCinematicV8TokensV472 = Object.freeze({
  id: ATLAS_SCIENCE_CINEMATIC_V8_ID_V472,
  mode: "science",
  localShadowOnly: true,
  defaultApplied: false,
  scientificFieldMutation: false,
  sky: Object.freeze({
    zenith: "#02080d",
    horizon: "#0b1d25",
    starOpacity: 0.72,
    milkyWayOpacity: 0.16,
  }),
  solar: Object.freeze({
    sunCore: "#fff4ca",
    planetRim: "#8fe7ff",
    ringOpacity: 0.42,
  }),
  catalog: Object.freeze({
    pointColor: "#baf5ff",
    densityOpacity: 0.48,
    selectionHalo: "#67e8f9",
  }),
  strongGravity: Object.freeze({
    linearDisplay: true,
    exposure: 1,
    bloomIntensity: 0,
    colorGradeIntensity: 0,
    diskHot: "#fff0c2",
    diskCool: "#8fd7ff",
    seed: null,
  }),
  launch: Object.freeze({
    plume: "#c9f6ff",
    telemetry: "#9de7f5",
  }),
  exoplanet: Object.freeze({
    limb: "#94e8ff",
    atmosphere: "#5b9fb7",
  }),
  postFx: Object.freeze({
    vignette: 0.08,
    grain: 0,
    chromaticAberration: 0,
  }),
  researchHud: Object.freeze({
    ink: "#dcfbff",
    panel: "#041014",
    grid: "rgba(103,232,249,.10)",
    shortAuthority: "#67e8f9",
    coordinateAuthority: "#a5f3fc",
    analyticFixture: "#c4b5fd",
    unavailable: "#fbbf24",
    titleTrackingEm: 0.075,
    statusPulse: false,
  }),
});

const cinematic: AtlasScienceCinematicV8TokensV472 = Object.freeze({
  id: ATLAS_SCIENCE_CINEMATIC_V8_ID_V472,
  mode: "cinematic",
  localShadowOnly: true,
  defaultApplied: false,
  scientificFieldMutation: false,
  sky: Object.freeze({
    zenith: "#05030c",
    horizon: "#23111c",
    starOpacity: 0.9,
    milkyWayOpacity: 0.28,
  }),
  solar: Object.freeze({
    sunCore: "#fff0b0",
    planetRim: "#f8b47a",
    ringOpacity: 0.62,
  }),
  catalog: Object.freeze({
    pointColor: "#ffe5c0",
    densityOpacity: 0.62,
    selectionHalo: "#fb923c",
  }),
  strongGravity: Object.freeze({
    linearDisplay: false,
    exposure: 1.08,
    bloomIntensity: 0.18,
    colorGradeIntensity: 0.12,
    diskHot: "#fff0b8",
    diskCool: "#f97360",
    seed: "orbit-atlas-v472-cinematic-seed-01",
  }),
  launch: Object.freeze({
    plume: "#ffd6a5",
    telemetry: "#fdba74",
  }),
  exoplanet: Object.freeze({
    limb: "#f5b58c",
    atmosphere: "#a75b63",
  }),
  postFx: Object.freeze({
    vignette: 0.2,
    grain: 0.035,
    chromaticAberration: 0.015,
  }),
  researchHud: Object.freeze({
    ink: "#fff2dc",
    panel: "#160a08",
    grid: "rgba(251,146,60,.10)",
    shortAuthority: "#fdba74",
    coordinateAuthority: "#fed7aa",
    analyticFixture: "#f0abfc",
    unavailable: "#fb7185",
    titleTrackingEm: 0.095,
    statusPulse: true,
  }),
});

export function resolveAtlasScienceCinematicV8V472(
  mode: AtlasScienceCinematicV8ModeV472,
): AtlasScienceCinematicV8TokensV472 {
  return mode === "science" ? science : cinematic;
}

export function auditAtlasScienceCinematicV8V472(): Readonly<{
  profileId: typeof ATLAS_SCIENCE_CINEMATIC_V8_ID_V472;
  tokenCount: 33;
  bindingCount: 33;
  consumerCount: number;
  unconsumedTokenPaths: readonly string[];
  duplicateTokenPaths: readonly string[];
  scienceLinearDisplay: true;
  scienceBloomDisabled: true;
  scienceGradeDisabled: true;
  scienceGrainDisabled: true;
  scienceChromaticAberrationDisabled: true;
  cinematicSeed: string;
  scientificFieldMutation: false;
  localShadowOnly: true;
  defaultApplied: false;
}> {
  const scienceProfile = resolveAtlasScienceCinematicV8V472("science");
  const cinematicProfile = resolveAtlasScienceCinematicV8V472("cinematic");
  const boundPaths = ATLAS_V8_TOKEN_CONSUMER_BINDINGS_V472.map((entry) => entry.tokenPath);
  const boundSet = new Set(boundPaths);
  const unconsumedTokenPaths = ATLAS_V8_TOKEN_PATHS_V472.filter((path) => !boundSet.has(path));
  const duplicateTokenPaths = boundPaths.filter(
    (path, index) => boundPaths.indexOf(path) !== index,
  );
  if (
    unconsumedTokenPaths.length > 0 ||
    duplicateTokenPaths.length > 0 ||
    ATLAS_V8_TOKEN_PATHS_V472.length !== ATLAS_V8_TOKEN_CONSUMER_BINDINGS_V472.length ||
    !scienceProfile.strongGravity.linearDisplay ||
    scienceProfile.strongGravity.bloomIntensity !== 0 ||
    scienceProfile.strongGravity.colorGradeIntensity !== 0 ||
    scienceProfile.strongGravity.seed !== null ||
    scienceProfile.postFx.grain !== 0 ||
    scienceProfile.postFx.chromaticAberration !== 0 ||
    !cinematicProfile.strongGravity.seed ||
    scienceProfile.scientificFieldMutation ||
    cinematicProfile.scientificFieldMutation ||
    ATLAS_V8_TOKEN_CONSUMER_BINDINGS_V472.some(
      (entry) => !entry.presentationOnly || entry.scienceWritebackAllowed,
    )
  ) {
    throw new Error("v472-science-cinematic-token-boundary");
  }

  return Object.freeze({
    profileId: ATLAS_SCIENCE_CINEMATIC_V8_ID_V472,
    tokenCount: 33 as const,
    bindingCount: 33 as const,
    consumerCount: new Set(
      ATLAS_V8_TOKEN_CONSUMER_BINDINGS_V472.map((entry) => entry.consumerId),
    ).size,
    unconsumedTokenPaths,
    duplicateTokenPaths,
    scienceLinearDisplay: true as const,
    scienceBloomDisabled: true as const,
    scienceGradeDisabled: true as const,
    scienceGrainDisabled: true as const,
    scienceChromaticAberrationDisabled: true as const,
    cinematicSeed: cinematicProfile.strongGravity.seed,
    scientificFieldMutation: false as const,
    localShadowOnly: true as const,
    defaultApplied: false as const,
  });
}

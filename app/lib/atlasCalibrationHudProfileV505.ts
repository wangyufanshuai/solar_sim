export type AtlasCalibrationHudModeV505 = "science" | "cinematic";

export type AtlasCalibrationHudProfileV505 = Readonly<{
  version: "v505-atlas-calibration-hud-profile-v1";
  mode: AtlasCalibrationHudModeV505;
  tokens: Readonly<{
    panel: string;
    panelRaised: string;
    ink: string;
    mutedInk: string;
    accent: string;
    accentWash: string;
    warning: string;
    blocked: string;
    grid: string;
    gridOpacity: number;
    glowOpacity: number;
    transitionMs: number;
  }>;
  scienceBoundary: Readonly<{
    linearScientificReadout: true;
    scientificFieldMutationAllowed: false;
    classificationMutationAllowed: false;
    redshiftMutationAllowed: false;
    evpaMutationAllowed: false;
    intensityMutationAllowed: false;
    randomDrawCount: 0;
  }>;
}>;

const SCIENCE: AtlasCalibrationHudProfileV505 = Object.freeze({
  version: "v505-atlas-calibration-hud-profile-v1",
  mode: "science",
  tokens: Object.freeze({
    panel: "#020708",
    panelRaised: "#061013",
    ink: "rgba(232,252,255,.92)",
    mutedInk: "rgba(220,246,250,.42)",
    accent: "#7fe8f4",
    accentWash: "rgba(78,218,235,.065)",
    warning: "#ffd078",
    blocked: "#ff8279",
    grid: "rgba(127,232,244,.055)",
    gridOpacity: 0.44,
    glowOpacity: 0,
    transitionMs: 0,
  }),
  scienceBoundary: Object.freeze({
    linearScientificReadout: true,
    scientificFieldMutationAllowed: false,
    classificationMutationAllowed: false,
    redshiftMutationAllowed: false,
    evpaMutationAllowed: false,
    intensityMutationAllowed: false,
    randomDrawCount: 0,
  }),
});

const CINEMATIC: AtlasCalibrationHudProfileV505 = Object.freeze({
  version: "v505-atlas-calibration-hud-profile-v1",
  mode: "cinematic",
  tokens: Object.freeze({
    panel: "#050706",
    panelRaised: "#11100b",
    ink: "rgba(255,248,226,.93)",
    mutedInk: "rgba(255,237,200,.43)",
    accent: "#ffbd72",
    accentWash: "rgba(255,146,64,.085)",
    warning: "#ffd36f",
    blocked: "#ff7d73",
    grid: "rgba(255,189,114,.05)",
    gridOpacity: 0.34,
    glowOpacity: 0.18,
    transitionMs: 180,
  }),
  scienceBoundary: SCIENCE.scienceBoundary,
});

export function resolveAtlasCalibrationHudProfileV505(
  mode: AtlasCalibrationHudModeV505,
): AtlasCalibrationHudProfileV505 {
  return mode === "science" ? SCIENCE : CINEMATIC;
}

export type AtlasCalibrationHudBindingV505<T> = Readonly<{
  profile: AtlasCalibrationHudProfileV505;
  sciencePayload: T;
  sciencePayloadReferencePreserved: true;
  scientificFieldMutationAllowed: false;
}>;

export function bindAtlasCalibrationHudV505<T>(
  mode: AtlasCalibrationHudModeV505,
  sciencePayload: T,
): AtlasCalibrationHudBindingV505<T> {
  return Object.freeze({
    profile: resolveAtlasCalibrationHudProfileV505(mode),
    sciencePayload,
    sciencePayloadReferencePreserved: true,
    scientificFieldMutationAllowed: false,
  });
}

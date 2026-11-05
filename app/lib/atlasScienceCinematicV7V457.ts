export const ATLAS_SCIENCE_CINEMATIC_V7_ID_V457 =
  "science-cinematic-v7-v457" as const;

export type AtlasScienceCinematicV7ModeV457 = "science" | "cinematic";

export type AtlasScienceCinematicV7TokensV457 = Readonly<{
  id: typeof ATLAS_SCIENCE_CINEMATIC_V7_ID_V457;
  mode: AtlasScienceCinematicV7ModeV457;
  localShadowOnly: true;
  defaultApplied: false;
  scientificFieldMutation: false;
  productGate: Readonly<{
    ink: string;
    panel: string;
    grid: string;
    qualified: string;
    blocked: string;
    railOpacity: number;
    blockerGlow: number;
  }>;
  strongGravity: Readonly<{
    linearDisplay: boolean;
    bloomIntensity: number;
    colorGradeIntensity: number;
    seed: string | null;
  }>;
  hud: Readonly<{
    titleTrackingEm: number;
    authorityFirewallVisible: true;
    promotionStateVisible: true;
    statusPulse: boolean;
  }>;
}>;

const science: AtlasScienceCinematicV7TokensV457 = Object.freeze({
  id: ATLAS_SCIENCE_CINEMATIC_V7_ID_V457,
  mode: "science",
  localShadowOnly: true,
  defaultApplied: false,
  scientificFieldMutation: false,
  productGate: Object.freeze({
    ink: "#d8fbff",
    panel: "#041014",
    grid: "rgba(103,232,249,.10)",
    qualified: "#67e8f9",
    blocked: "#fbbf24",
    railOpacity: 0.78,
    blockerGlow: 0.18,
  }),
  strongGravity: Object.freeze({
    linearDisplay: true,
    bloomIntensity: 0,
    colorGradeIntensity: 0,
    seed: null,
  }),
  hud: Object.freeze({
    titleTrackingEm: 0.09,
    authorityFirewallVisible: true,
    promotionStateVisible: true,
    statusPulse: false,
  }),
});

const cinematic: AtlasScienceCinematicV7TokensV457 = Object.freeze({
  id: ATLAS_SCIENCE_CINEMATIC_V7_ID_V457,
  mode: "cinematic",
  localShadowOnly: true,
  defaultApplied: false,
  scientificFieldMutation: false,
  productGate: Object.freeze({
    ink: "#fff2d5",
    panel: "#130b06",
    grid: "rgba(251,191,36,.09)",
    qualified: "#fdba74",
    blocked: "#fb7185",
    railOpacity: 0.62,
    blockerGlow: 0.32,
  }),
  strongGravity: Object.freeze({
    linearDisplay: false,
    bloomIntensity: 0.2,
    colorGradeIntensity: 0.14,
    seed: "orbit-atlas-v457-cinematic-seed-01",
  }),
  hud: Object.freeze({
    titleTrackingEm: 0.12,
    authorityFirewallVisible: true,
    promotionStateVisible: true,
    statusPulse: true,
  }),
});

export function resolveAtlasScienceCinematicV7V457(
  mode: AtlasScienceCinematicV7ModeV457,
): AtlasScienceCinematicV7TokensV457 {
  return mode === "science" ? science : cinematic;
}

export function auditAtlasScienceCinematicV7BoundaryV457(): Readonly<{
  profileId: typeof ATLAS_SCIENCE_CINEMATIC_V7_ID_V457;
  scienceLinearDisplay: true;
  scienceBloomDisabled: true;
  scienceGradeDisabled: true;
  cinematicSeed: string;
  scientificFieldMutation: false;
  localShadowOnly: true;
  defaultApplied: false;
}> {
  const scienceProfile = resolveAtlasScienceCinematicV7V457("science");
  const cinematicProfile = resolveAtlasScienceCinematicV7V457("cinematic");
  if (
    !scienceProfile.strongGravity.linearDisplay ||
    scienceProfile.strongGravity.bloomIntensity !== 0 ||
    scienceProfile.strongGravity.colorGradeIntensity !== 0 ||
    scienceProfile.strongGravity.seed !== null ||
    !cinematicProfile.strongGravity.seed ||
    scienceProfile.scientificFieldMutation ||
    cinematicProfile.scientificFieldMutation
  ) {
    throw new Error("v457-science-cinematic-boundary");
  }
  return Object.freeze({
    profileId: ATLAS_SCIENCE_CINEMATIC_V7_ID_V457,
    scienceLinearDisplay: true,
    scienceBloomDisabled: true,
    scienceGradeDisabled: true,
    cinematicSeed: cinematicProfile.strongGravity.seed,
    scientificFieldMutation: false,
    localShadowOnly: true,
    defaultApplied: false,
  });
}

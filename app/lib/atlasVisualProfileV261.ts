export const ATLAS_VISUAL_PROFILE_LEGACY_V261 = "legacy-v9" as const;
export const ATLAS_VISUAL_PROFILE_CANDIDATE_V261 = "science-cinematic-v256" as const;
export type AtlasVisualProfileV261 = typeof ATLAS_VISUAL_PROFILE_LEGACY_V261 | typeof ATLAS_VISUAL_PROFILE_CANDIDATE_V261;

export const ATLAS_SCIENCE_CINEMATIC_TOKENS_V261 = {
  void: "#010304",
  coal: "#0a0f12",
  measurementCyan: "#72c4d4",
  timeAmber: "#d8ad62",
  physicalWhite: "#e6edf0",
  risk: "#d88970",
  typography: "IBM Plex Sans / Condensed / Mono with CJK fallback",
} as const;

export type AtlasVisualCandidateSummaryV261 = {
  version: "v261-science-cinematic-ab-v1";
  legacy: typeof ATLAS_VISUAL_PROFILE_LEGACY_V261;
  candidate: typeof ATLAS_VISUAL_PROFILE_CANDIDATE_V261;
  active: AtlasVisualProfileV261;
  candidateAppliedAsDefault: false;
  physicsMutation: "not-applied";
  kerrScienceMutation: "not-applied";
  launchDynamicsMutation: "not-applied";
  boundary: "visual-only-local-ab-candidate-not-promoted";
};

export function createAtlasVisualCandidateSummaryV261(
  active: AtlasVisualProfileV261 = ATLAS_VISUAL_PROFILE_LEGACY_V261,
): AtlasVisualCandidateSummaryV261 {
  return {
    version: "v261-science-cinematic-ab-v1",
    legacy: ATLAS_VISUAL_PROFILE_LEGACY_V261,
    candidate: ATLAS_VISUAL_PROFILE_CANDIDATE_V261,
    active,
    candidateAppliedAsDefault: false,
    physicsMutation: "not-applied",
    kerrScienceMutation: "not-applied",
    launchDynamicsMutation: "not-applied",
    boundary: "visual-only-local-ab-candidate-not-promoted",
  };
}

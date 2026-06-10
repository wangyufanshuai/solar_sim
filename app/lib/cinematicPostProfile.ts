export type CinematicPostProfileId =
  | "balanced-fixed"
  | "closeup-quality"
  | "tour-cover"
  | "gallery-studio"
  | "atlas-flight";

export type CinematicPostProfile = {
  id: CinematicPostProfileId;
  label: string;
  bloomStrength: number;
  bloomRadius: number;
  bloomThreshold: number;
  vignetteDarkness: number;
  vignetteOffset: number;
  contrast: number;
  exposure: number;
  dofEnabled: boolean;
};

export const CINEMATIC_POST_PROFILES: CinematicPostProfile[] = [
  {
    id: "balanced-fixed",
    label: "Balanced fixed",
    bloomStrength: 0.14,
    bloomRadius: 0.16,
    bloomThreshold: 0.96,
    vignetteDarkness: 0.58,
    vignetteOffset: 1.08,
    contrast: 0,
    exposure: 1,
    dofEnabled: false,
  },
  {
    id: "closeup-quality",
    label: "Closeup quality",
    bloomStrength: 0.24,
    bloomRadius: 0.24,
    bloomThreshold: 0.93,
    vignetteDarkness: 0.5,
    vignetteOffset: 0.98,
    contrast: 0.18,
    exposure: 0.96,
    dofEnabled: false,
  },
  {
    id: "tour-cover",
    label: "Tour cover",
    bloomStrength: 0.28,
    bloomRadius: 0.28,
    bloomThreshold: 0.92,
    vignetteDarkness: 0.46,
    vignetteOffset: 0.92,
    contrast: 0.22,
    exposure: 0.94,
    dofEnabled: false,
  },
  {
    id: "gallery-studio",
    label: "Gallery studio",
    bloomStrength: 0.2,
    bloomRadius: 0.18,
    bloomThreshold: 0.94,
    vignetteDarkness: 0.42,
    vignetteOffset: 0.96,
    contrast: 0.16,
    exposure: 1,
    dofEnabled: false,
  },
  {
    id: "atlas-flight",
    label: "Atlas flight",
    bloomStrength: 0.22,
    bloomRadius: 0.2,
    bloomThreshold: 0.93,
    vignetteDarkness: 0.36,
    vignetteOffset: 1,
    contrast: 0.2,
    exposure: 0.97,
    dofEnabled: false,
  },
];

export function cinematicPostProfile(id: CinematicPostProfileId): CinematicPostProfile {
  return CINEMATIC_POST_PROFILES.find((profile) => profile.id === id) ?? CINEMATIC_POST_PROFILES[0]!;
}

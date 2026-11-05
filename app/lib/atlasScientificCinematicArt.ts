export const ATLAS_SCIENTIFIC_CINEMATIC_ART_VERSION =
  "v117-scientific-cinematic-art-lock" as const;
export const ATLAS_SCIENTIFIC_CINEMATIC_ART_PROFILE =
  "v117-derived-photosphere-shader-passport-lod" as const;
export const ATLAS_SCIENTIFIC_CINEMATIC_ART_BOUNDARY =
  "v117 changes derived portrait shaders, passport presentation and offline asset provenance only. It does not claim resolved ordinary-star surfaces or modify V9 sky, v97/v99 budgets, scientific gates, fixtures, integrators, live/worker physics or Kerr.";

export function createAtlasScientificCinematicArtSummary() {
  return {
    version: ATLAS_SCIENTIFIC_CINEMATIC_ART_VERSION,
    profile: ATLAS_SCIENTIFIC_CINEMATIC_ART_PROFILE,
    status: "ready-scientific-cinematic-art" as const,
    portraitMaterial: "shared-programmatic-photosphere-shader" as const,
    portraitViews: "portrait-spectrum-data" as const,
    derivation: "gaia-derived-presentation-not-resolved-surface" as const,
    materialBudgetMb: 8,
    assetPolicy: "offline-provenance-checksum-license-manifest" as const,
    focusedCommand: "npm run test:atlas:scientific-cinematic-art" as const,
    trustedBoundary: ATLAS_SCIENTIFIC_CINEMATIC_ART_BOUNDARY,
  };
}

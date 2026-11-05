import type {
  AtlasCinematicLightingCompositionSummary,
  AtlasCinematicLightingCompositionVersion,
  AtlasSelectedBodyLightingProfile,
} from "./simulationDiagnosticsTypes";

export const ATLAS_CINEMATIC_LIGHTING_COMPOSITION_VERSION: AtlasCinematicLightingCompositionVersion =
  "v44-cinematic-lighting-composition";

export const ATLAS_CINEMATIC_LIGHTING_COMPOSITION_BOUNDARY =
  "Local visual presentation metadata only; cinematic lighting and post-FX profiles use developer-prepared local assets at runtime, preserve the v41 AA workbench boundary, v42 cinematic visual boundary, and v43 planetary visual fidelity boundary, and do not claim runtime certification, AAA certification, WCAG certification, scientific certification, online validation, online asset completeness, or physics mutation.";

export const ATLAS_CINEMATIC_LIGHTING_PROFILES: readonly AtlasSelectedBodyLightingProfile[] = [
  "overview",
  "earth-night-closeup",
  "terrestrial-closeup",
  "lunar-mars-closeup",
  "gas-giant-closeup",
  "solar-closeup",
];

export function createAtlasCinematicLightingCompositionSummary(): AtlasCinematicLightingCompositionSummary {
  return {
    version: ATLAS_CINEMATIC_LIGHTING_COMPOSITION_VERSION,
    status: "informational",
    visualTarget: "closeup-cinematic-lighting-composition",
    lightingProfile: "filmic-closeup-balanced",
    postFxProfile: "aces-vignette-restrained-bloom",
    assetPolicy: "dev-prepared-local-runtime",
    runtimeAssetSource: "local-public-textures-only",
    supportedLightingProfiles: ATLAS_CINEMATIC_LIGHTING_PROFILES,
    skyCloseupProfile: "deep-space-filmic-dim",
    aaBoundaryPreserved: "v41-aa-boundary-preserved",
    cinematicBoundaryPreserved: "v42-cinematic-boundary-preserved",
    planetaryBoundaryPreserved: "v43-planetary-visual-fidelity-preserved",
    physicsMutation: "not-applied",
    runtimeCertificationStatus: "not-claimed-in-app",
    artisticCertificationStatus: "not-claimed",
    scientificCertificationStatus: "not-claimed",
    onlineValidationStatus: "not-claimed",
    trustedBoundary: ATLAS_CINEMATIC_LIGHTING_COMPOSITION_BOUNDARY,
  };
}

import type {
  AtlasPlanetaryVisualFidelitySummary,
  AtlasPlanetaryVisualFidelityVersion,
} from "./simulationDiagnosticsTypes";

export const ATLAS_PLANETARY_VISUAL_FIDELITY_VERSION: AtlasPlanetaryVisualFidelityVersion =
  "v43-planetary-visual-fidelity-pass";

export const ATLAS_PLANETARY_VISUAL_FIDELITY_BOUNDARY =
  "Local visual presentation metadata only; selected-body close-up and deep-space background fidelity use network-prepared local textures at runtime, preserve the v41 AA workbench boundary and v42 cinematic boundary, and do not claim runtime certification, scientific certification, AAA certification, WCAG certification, online validation, online asset completeness, or physics mutation.";

export function createAtlasPlanetaryVisualFidelitySummary(): AtlasPlanetaryVisualFidelitySummary {
  return {
    version: ATLAS_PLANETARY_VISUAL_FIDELITY_VERSION,
    status: "informational",
    visualTarget: "selected-body-closeup-realism",
    styleTarget: "restrained-scientific-instrument",
    assetPolicy: "network-prepared-local-runtime",
    runtimeAssetSource: "local-public-textures-only",
    closeupPriority: "major-selected-bodies",
    skyCloseupProfile: "closeup-deep-space-dimmed",
    aaBoundaryPreserved: "v41-aa-boundary-preserved",
    cinematicBoundaryPreserved: "v42-cinematic-boundary-preserved",
    physicsMutation: "not-applied",
    runtimeCertificationStatus: "not-claimed-in-app",
    scientificCertificationStatus: "not-claimed",
    onlineValidationStatus: "not-claimed",
    trustedBoundary: ATLAS_PLANETARY_VISUAL_FIDELITY_BOUNDARY,
  };
}

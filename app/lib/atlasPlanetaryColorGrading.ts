import type {
  AtlasPlanetaryColorGradingSummary,
  AtlasPlanetaryColorGradingVersion,
  AtlasSelectedBodyColorGradeProfile,
} from "./simulationDiagnosticsTypes";

export const ATLAS_PLANETARY_COLOR_GRADING_VERSION: AtlasPlanetaryColorGradingVersion =
  "v53-planetary-color-grading";

export const ATLAS_PLANETARY_COLOR_GRADING_BOUNDARY =
  "Local planetary color-grading and layer-depth metadata only; v53 reads existing selected-body, local material, v49 material composition, v50 close-up composition, v51 key-light and v52 depth-lighting profiles to improve close-up color separation, gas-layer microcontrast, Earth cloud/ocean tone and Saturn ring/body occlusion color cues, preserves v41 accessibility through v52 planetary depth-lighting boundaries, and does not claim AAA certification, WCAG certification, scientific certification, Universe Sandbox clone status, latest runtime command result, online validation, online catalog completeness, online asset completeness, or physics mutation.";

export const ATLAS_SELECTED_BODY_COLOR_GRADE_PROFILES: readonly AtlasSelectedBodyColorGradeProfile[] = [
  "overview-neutral-color",
  "earth-ocean-cloud-color-depth",
  "solar-photosphere-color-depth",
  "gas-giant-layer-color-grade",
  "saturn-ring-occlusion-color-grade",
  "airless-regolith-color-depth",
];

export function createAtlasPlanetaryColorGradingSummary(): AtlasPlanetaryColorGradingSummary {
  return {
    version: ATLAS_PLANETARY_COLOR_GRADING_VERSION,
    status: "informational",
    colorTarget: "closeup-planet-color-layer-depth",
    qualityBudget: "stable-high-fidelity",
    assetPolicy: "local-runtime-assets",
    runtimeAssetSource: "prepared-local-planet-textures-and-rendering-profiles-only",
    supportedColorGradeProfiles: ATLAS_SELECTED_BODY_COLOR_GRADE_PROFILES,
    defaultColorGradeProfile: "overview-neutral-color",
    earthColorGradeProfile: "earth-ocean-cloud-color-depth",
    solarColorGradeProfile: "solar-photosphere-color-depth",
    gasGiantColorGradeProfile: "gas-giant-layer-color-grade",
    saturnColorGradeProfile: "saturn-ring-occlusion-color-grade",
    lunarMarsColorGradeProfile: "airless-regolith-color-depth",
    colorSeparationCue: "filmic-warm-highlight-cool-shadow",
    gasLayerCue: "gas-layer-microcontrast",
    saturnOcclusionCue: "saturn-ring-body-occlusion-tone",
    aaBoundaryPreserved: "v41-aa-boundary-preserved",
    cinematicBoundaryPreserved: "v42-cinematic-boundary-preserved",
    planetaryBoundaryPreserved: "v43-planetary-visual-fidelity-preserved",
    lightingBoundaryPreserved: "v44-cinematic-lighting-preserved",
    chineseBoundaryPreserved: "v45-chinese-deep-space-fidelity-preserved",
    deepSpaceCameraBoundaryPreserved: "v46-cinematic-deep-space-camera-preserved",
    universeSandboxReferenceBoundaryPreserved: "v47-universe-sandbox-reference-backdrop-preserved",
    referenceGradeBoundaryPreserved: "v48-reference-grade-space-art-preserved",
    planetaryMaterialBoundaryPreserved: "v49-planetary-material-composition-preserved",
    closeupDirectorBoundaryPreserved: "v50-cinematic-closeup-director-preserved",
    keyLightBoundaryPreserved: "v51-cinematic-key-light-director-preserved",
    depthLightingBoundaryPreserved: "v52-planetary-depth-lighting-preserved",
    physicsMutation: "not-applied",
    runtimeCertificationStatus: "not-claimed-in-app",
    artisticCertificationStatus: "not-claimed",
    scientificCertificationStatus: "not-claimed",
    wcagCertificationStatus: "not-claimed",
    onlineValidationStatus: "not-claimed",
    universeSandboxCloneStatus: "not-claimed",
    trustedBoundary: ATLAS_PLANETARY_COLOR_GRADING_BOUNDARY,
  };
}

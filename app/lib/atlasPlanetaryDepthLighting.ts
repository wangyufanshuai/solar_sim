import type {
  AtlasPlanetaryDepthLightingSummary,
  AtlasPlanetaryDepthLightingVersion,
  AtlasSelectedBodyDepthLightingProfile,
} from "./simulationDiagnosticsTypes";

export const ATLAS_PLANETARY_DEPTH_LIGHTING_VERSION: AtlasPlanetaryDepthLightingVersion =
  "v52-planetary-depth-lighting";

export const ATLAS_PLANETARY_DEPTH_LIGHTING_BOUNDARY =
  "Local planetary depth-lighting metadata only; v52 reads existing selected-body, local material, v49 material composition, v50 close-up composition and v51 key-light profiles to improve close-up atmospheric rim, terminator depth, gas-band depth and Saturn ring-shadow cues, preserves v41 accessibility through v51 key-light boundaries, and does not claim AAA certification, WCAG certification, scientific certification, Universe Sandbox clone status, latest runtime command result, online validation, online catalog completeness, online asset completeness, or physics mutation.";

export const ATLAS_SELECTED_BODY_DEPTH_LIGHTING_PROFILES: readonly AtlasSelectedBodyDepthLightingProfile[] = [
  "overview-no-depth-lighting",
  "earth-atmospheric-terminator-depth",
  "solar-granulation-limb-depth",
  "gas-giant-banded-phase-depth",
  "saturn-ring-shadow-depth",
  "airless-relief-terminator-depth",
];

export function createAtlasPlanetaryDepthLightingSummary(): AtlasPlanetaryDepthLightingSummary {
  return {
    version: ATLAS_PLANETARY_DEPTH_LIGHTING_VERSION,
    status: "informational",
    lightingTarget: "closeup-atmospheric-terminator-ring-depth",
    qualityBudget: "stable-high-fidelity",
    assetPolicy: "local-runtime-assets",
    runtimeAssetSource: "prepared-local-planet-textures-and-rendering-profiles-only",
    supportedDepthLightingProfiles: ATLAS_SELECTED_BODY_DEPTH_LIGHTING_PROFILES,
    defaultDepthLightingProfile: "overview-no-depth-lighting",
    earthDepthLightingProfile: "earth-atmospheric-terminator-depth",
    solarDepthLightingProfile: "solar-granulation-limb-depth",
    gasGiantDepthLightingProfile: "gas-giant-banded-phase-depth",
    saturnDepthLightingProfile: "saturn-ring-shadow-depth",
    lunarMarsDepthLightingProfile: "airless-relief-terminator-depth",
    atmosphereRimCue: "thin-limb-nonemissive-rim",
    terminatorCue: "directional-shadow-rolloff",
    gasBandCue: "nonuniform-band-depth-contrast",
    ringShadowCue: "saturn-equatorial-ring-shadow-matte",
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
    physicsMutation: "not-applied",
    runtimeCertificationStatus: "not-claimed-in-app",
    artisticCertificationStatus: "not-claimed",
    scientificCertificationStatus: "not-claimed",
    wcagCertificationStatus: "not-claimed",
    onlineValidationStatus: "not-claimed",
    universeSandboxCloneStatus: "not-claimed",
    trustedBoundary: ATLAS_PLANETARY_DEPTH_LIGHTING_BOUNDARY,
  };
}

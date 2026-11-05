import type {
  AtlasCinematicKeyLightDirectorSummary,
  AtlasCinematicKeyLightDirectorVersion,
  AtlasSelectedBodyKeyLightProfile,
} from "./simulationDiagnosticsTypes";

export const ATLAS_CINEMATIC_KEY_LIGHT_DIRECTOR_VERSION: AtlasCinematicKeyLightDirectorVersion =
  "v51-cinematic-key-light-director";

export const ATLAS_CINEMATIC_KEY_LIGHT_DIRECTOR_BOUNDARY =
  "Local cinematic key-light and phase metadata only; v51 reads existing selected-body, local material and rendering presentation state to improve close-up readability for gas giants and Saturn rings, preserves v41 accessibility, v42 cinematic workbench, v43 planetary fidelity, v44 lighting, v45 Chinese interface, v46 deep-space camera, v47 reference backdrop, v48 reference-grade space art, v49 planetary material and v50 close-up director boundaries, and does not claim AAA certification, WCAG certification, scientific certification, Universe Sandbox clone status, latest runtime command result, online validation, online catalog completeness, online asset completeness, or physics mutation.";

export const ATLAS_SELECTED_BODY_KEY_LIGHT_PROFILES: readonly AtlasSelectedBodyKeyLightProfile[] = [
  "overview-natural-phase",
  "earth-cloud-night-key-balance",
  "solar-surface-edge-key",
  "gas-giant-readable-key-fill",
  "saturn-ring-key-fill",
  "lunar-mars-relief-key",
];

export function createAtlasCinematicKeyLightDirectorSummary(): AtlasCinematicKeyLightDirectorSummary {
  return {
    version: ATLAS_CINEMATIC_KEY_LIGHT_DIRECTOR_VERSION,
    status: "informational",
    lightingTarget: "selected-body-readable-key-light-phase",
    qualityBudget: "stable-high-fidelity",
    assetPolicy: "local-runtime-assets",
    runtimeAssetSource: "prepared-local-planet-textures-and-rendering-profiles-only",
    supportedKeyLightProfiles: ATLAS_SELECTED_BODY_KEY_LIGHT_PROFILES,
    defaultKeyLightProfile: "overview-natural-phase",
    earthKeyLightProfile: "earth-cloud-night-key-balance",
    solarKeyLightProfile: "solar-surface-edge-key",
    gasGiantKeyLightProfile: "gas-giant-readable-key-fill",
    saturnKeyLightProfile: "saturn-ring-key-fill",
    lunarMarsKeyLightProfile: "lunar-mars-relief-key",
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
    physicsMutation: "not-applied",
    runtimeCertificationStatus: "not-claimed-in-app",
    artisticCertificationStatus: "not-claimed",
    scientificCertificationStatus: "not-claimed",
    wcagCertificationStatus: "not-claimed",
    onlineValidationStatus: "not-claimed",
    universeSandboxCloneStatus: "not-claimed",
    trustedBoundary: ATLAS_CINEMATIC_KEY_LIGHT_DIRECTOR_BOUNDARY,
  };
}

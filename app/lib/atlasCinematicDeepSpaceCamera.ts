import type {
  AtlasCinematicBackgroundNoiseProfile,
  AtlasCinematicCameraProfile,
  AtlasCinematicDeepSpaceCameraSummary,
  AtlasCinematicDeepSpaceCameraVersion,
  AtlasCinematicSkyCompositionProfile,
  AtlasCinematicTargetSeparationProfile,
} from "./simulationDiagnosticsTypes";

export const ATLAS_CINEMATIC_DEEP_SPACE_CAMERA_VERSION: AtlasCinematicDeepSpaceCameraVersion =
  "v46-cinematic-deep-space-camera";

export const ATLAS_CINEMATIC_DEEP_SPACE_CAMERA_BOUNDARY =
  "Local visual composition metadata only; cinematic camera and deep-space background profiles use local public textures and curated local catalogs at runtime, preserve v41 accessibility, v42 cinematic workbench, v43 planetary visual fidelity, v44 lighting, and v45 Chinese interface boundaries, and do not claim runtime certification, AAA certification, WCAG certification, scientific certification, online validation, online catalog completeness, online asset completeness, or physics mutation.";

export const ATLAS_CINEMATIC_CAMERA_PROFILES: readonly AtlasCinematicCameraProfile[] = [
  "overview-atlas",
  "selected-body-cinematic",
  "showcase-deep-space",
];

export const ATLAS_CINEMATIC_SKY_COMPOSITION_PROFILES: readonly AtlasCinematicSkyCompositionProfile[] = [
  "layered-atlas-overview",
  "subject-separated-deep-space",
  "layered-milky-way-showcase",
];

export const ATLAS_CINEMATIC_BACKGROUND_NOISE_PROFILES: readonly AtlasCinematicBackgroundNoiseProfile[] = [
  "atlas-balanced-low-noise",
  "closeup-low-noise",
  "showcase-structured-low-noise",
];

export const ATLAS_CINEMATIC_TARGET_SEPARATION_PROFILES: readonly AtlasCinematicTargetSeparationProfile[] = [
  "overview-orbit-depth",
  "selected-body-limb-and-negative-space",
  "showcase-deep-space-band",
];

export function createAtlasCinematicDeepSpaceCameraSummary(): AtlasCinematicDeepSpaceCameraSummary {
  return {
    version: ATLAS_CINEMATIC_DEEP_SPACE_CAMERA_VERSION,
    status: "informational",
    visualTarget: "cinematic-deep-space-camera-composition",
    defaultCameraProfile: "overview-atlas",
    closeupCameraProfile: "selected-body-cinematic",
    showcaseCameraProfile: "showcase-deep-space",
    qualityBudget: "stable-high-fidelity",
    runtimeAssetSource: "local-public-textures-and-local-catalogs",
    supportedCameraProfiles: ATLAS_CINEMATIC_CAMERA_PROFILES,
    supportedSkyCompositionProfiles: ATLAS_CINEMATIC_SKY_COMPOSITION_PROFILES,
    supportedBackgroundNoiseProfiles: ATLAS_CINEMATIC_BACKGROUND_NOISE_PROFILES,
    supportedTargetSeparationProfiles: ATLAS_CINEMATIC_TARGET_SEPARATION_PROFILES,
    aaBoundaryPreserved: "v41-aa-boundary-preserved",
    cinematicBoundaryPreserved: "v42-cinematic-boundary-preserved",
    planetaryBoundaryPreserved: "v43-planetary-visual-fidelity-preserved",
    lightingBoundaryPreserved: "v44-cinematic-lighting-preserved",
    chineseBoundaryPreserved: "v45-chinese-deep-space-fidelity-preserved",
    physicsMutation: "not-applied",
    runtimeCertificationStatus: "not-claimed-in-app",
    artisticCertificationStatus: "not-claimed",
    scientificCertificationStatus: "not-claimed",
    wcagCertificationStatus: "not-claimed",
    onlineValidationStatus: "not-claimed",
    trustedBoundary: ATLAS_CINEMATIC_DEEP_SPACE_CAMERA_BOUNDARY,
  };
}

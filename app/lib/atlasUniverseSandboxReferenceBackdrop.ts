import type {
  AtlasBackgroundDepthProfile,
  AtlasBackgroundSubjectVisibilityProfile,
  AtlasUniverseSandboxReferenceBackdropSummary,
  AtlasUniverseSandboxReferenceBackdropVersion,
} from "./simulationDiagnosticsTypes";

export const ATLAS_UNIVERSE_SANDBOX_REFERENCE_BACKDROP_VERSION: AtlasUniverseSandboxReferenceBackdropVersion =
  "v47-universe-sandbox-reference-backdrop";

export const ATLAS_UNIVERSE_SANDBOX_REFERENCE_BACKDROP_BOUNDARY =
  "Local visual reference and composition metadata only; the Universe Sandbox comparison is inspiration for sparse stars, layered Milky Way contrast, subject visibility and local image review using local public textures and curated local catalogs at runtime, preserves v41 accessibility, v42 cinematic workbench, v43 planetary fidelity, v44 lighting, v45 Chinese interface and v46 deep-space camera boundaries, and does not claim a Universe Sandbox clone, AAA certification, WCAG certification, scientific certification, latest runtime command result, online validation, online catalog completeness, online asset completeness, or physics mutation.";

export const ATLAS_BACKGROUND_DEPTH_PROFILES: readonly AtlasBackgroundDepthProfile[] = [
  "overview-sparse-layered-milky-way",
  "closeup-subject-negative-space",
  "showcase-reference-depth",
];

export const ATLAS_BACKGROUND_SUBJECT_VISIBILITY_PROFILES: readonly AtlasBackgroundSubjectVisibilityProfile[] = [
  "overview-orbit-readable",
  "selected-body-in-frame",
  "showcase-subject-separated",
];

export function createAtlasUniverseSandboxReferenceBackdropSummary(): AtlasUniverseSandboxReferenceBackdropSummary {
  return {
    version: ATLAS_UNIVERSE_SANDBOX_REFERENCE_BACKDROP_VERSION,
    status: "informational",
    referenceMode: "inspired-reference-comparison",
    backgroundArtDirection: "sparse-stars-layered-milky-way",
    defaultDepthProfile: "overview-sparse-layered-milky-way",
    closeupDepthProfile: "closeup-subject-negative-space",
    showcaseDepthProfile: "showcase-reference-depth",
    subjectVisibilityProfile: "selected-body-in-frame",
    screenshotReview: "local-only",
    runtimeAssetSource: "local-public-textures-and-local-catalogs",
    supportedDepthProfiles: ATLAS_BACKGROUND_DEPTH_PROFILES,
    supportedSubjectVisibilityProfiles: ATLAS_BACKGROUND_SUBJECT_VISIBILITY_PROFILES,
    aaBoundaryPreserved: "v41-aa-boundary-preserved",
    cinematicBoundaryPreserved: "v42-cinematic-boundary-preserved",
    planetaryBoundaryPreserved: "v43-planetary-visual-fidelity-preserved",
    lightingBoundaryPreserved: "v44-cinematic-lighting-preserved",
    chineseBoundaryPreserved: "v45-chinese-deep-space-fidelity-preserved",
    deepSpaceCameraBoundaryPreserved: "v46-cinematic-deep-space-camera-preserved",
    physicsMutation: "not-applied",
    runtimeCertificationStatus: "not-claimed-in-app",
    artisticCertificationStatus: "not-claimed",
    scientificCertificationStatus: "not-claimed",
    wcagCertificationStatus: "not-claimed",
    universeSandboxCloneStatus: "not-claimed",
    onlineValidationStatus: "not-claimed",
    trustedBoundary: ATLAS_UNIVERSE_SANDBOX_REFERENCE_BACKDROP_BOUNDARY,
  };
}

import type {
  AtlasReferenceGradeCompositeProfile,
  AtlasReferenceGradePlanetMaterialProfile,
  AtlasReferenceGradeSkyLayerProfile,
  AtlasReferenceGradeSpaceArtSummary,
  AtlasReferenceGradeSpaceArtVersion,
  AtlasReferenceGradeStarfieldProfile,
  AtlasReferenceGradeSubjectMatteProfile,
} from "./simulationDiagnosticsTypes";

export const ATLAS_REFERENCE_GRADE_SPACE_ART_VERSION: AtlasReferenceGradeSpaceArtVersion =
  "v48-reference-grade-space-art";

export const ATLAS_REFERENCE_GRADE_SPACE_ART_BOUNDARY =
  "Local visual composition metadata only; reference-grade space art uses generated local public sky assets, existing local planet textures, shader composition, subject matte cues and local image review as an art-direction target, preserves v41 accessibility, v42 cinematic workbench, v43 planetary fidelity, v44 lighting, v45 Chinese interface, v46 deep-space camera and v47 Universe Sandbox reference boundaries, and does not claim a Universe Sandbox clone, AAA certification, WCAG certification, scientific certification, latest runtime command result, online validation, online catalog completeness, online asset completeness, or physics mutation.";

export const ATLAS_REFERENCE_GRADE_COMPOSITE_PROFILES: readonly AtlasReferenceGradeCompositeProfile[] = [
  "overview-layered-reference-grade",
  "selected-body-subject-matte",
  "showcase-cinematic-deep-space",
];

export const ATLAS_REFERENCE_GRADE_SKY_LAYER_PROFILES: readonly AtlasReferenceGradeSkyLayerProfile[] = [
  "v48-local-generated-layered-sky",
  "v48-local-closeup-negative-space",
  "v48-local-showcase-milky-way",
];

export const ATLAS_REFERENCE_GRADE_STARFIELD_PROFILES: readonly AtlasReferenceGradeStarfieldProfile[] = [
  "sparse-primary-stars",
  "closeup-star-noise-suppressed",
  "showcase-structured-starfield",
];

export const ATLAS_REFERENCE_GRADE_SUBJECT_MATTE_PROFILES: readonly AtlasReferenceGradeSubjectMatteProfile[] = [
  "overview-no-subject-matte",
  "selected-body-background-matte",
  "showcase-center-negative-space",
];

export const ATLAS_REFERENCE_GRADE_PLANET_MATERIAL_PROFILES: readonly AtlasReferenceGradePlanetMaterialProfile[] = [
  "overview-local-hd",
  "closeup-microcontrast-fill",
  "gas-giant-ring-readability",
  "solar-edge-controlled",
];

export function createAtlasReferenceGradeSpaceArtSummary(): AtlasReferenceGradeSpaceArtSummary {
  return {
    version: ATLAS_REFERENCE_GRADE_SPACE_ART_VERSION,
    status: "informational",
    artDirection: "cinematic-scientific-space-simulation",
    assetPolicy: "generated-local-runtime-assets",
    reviewMode: "local-reference-screenshot-rubric",
    defaultCompositeProfile: "overview-layered-reference-grade",
    closeupCompositeProfile: "selected-body-subject-matte",
    showcaseCompositeProfile: "showcase-cinematic-deep-space",
    defaultSkyLayerProfile: "v48-local-generated-layered-sky",
    closeupSkyLayerProfile: "v48-local-closeup-negative-space",
    showcaseSkyLayerProfile: "v48-local-showcase-milky-way",
    defaultStarfieldProfile: "sparse-primary-stars",
    closeupStarfieldProfile: "closeup-star-noise-suppressed",
    showcaseStarfieldProfile: "showcase-structured-starfield",
    defaultSubjectMatteProfile: "overview-no-subject-matte",
    closeupSubjectMatteProfile: "selected-body-background-matte",
    showcaseSubjectMatteProfile: "showcase-center-negative-space",
    defaultPlanetMaterialProfile: "overview-local-hd",
    closeupPlanetMaterialProfile: "closeup-microcontrast-fill",
    gasGiantPlanetMaterialProfile: "gas-giant-ring-readability",
    solarPlanetMaterialProfile: "solar-edge-controlled",
    supportedCompositeProfiles: ATLAS_REFERENCE_GRADE_COMPOSITE_PROFILES,
    supportedSkyLayerProfiles: ATLAS_REFERENCE_GRADE_SKY_LAYER_PROFILES,
    supportedStarfieldProfiles: ATLAS_REFERENCE_GRADE_STARFIELD_PROFILES,
    supportedSubjectMatteProfiles: ATLAS_REFERENCE_GRADE_SUBJECT_MATTE_PROFILES,
    supportedPlanetMaterialProfiles: ATLAS_REFERENCE_GRADE_PLANET_MATERIAL_PROFILES,
    runtimeAssetSource: "generated-local-public-textures-and-local-catalogs",
    aaBoundaryPreserved: "v41-aa-boundary-preserved",
    cinematicBoundaryPreserved: "v42-cinematic-boundary-preserved",
    planetaryBoundaryPreserved: "v43-planetary-visual-fidelity-preserved",
    lightingBoundaryPreserved: "v44-cinematic-lighting-preserved",
    chineseBoundaryPreserved: "v45-chinese-deep-space-fidelity-preserved",
    deepSpaceCameraBoundaryPreserved: "v46-cinematic-deep-space-camera-preserved",
    universeSandboxReferenceBoundaryPreserved: "v47-universe-sandbox-reference-backdrop-preserved",
    physicsMutation: "not-applied",
    runtimeCertificationStatus: "not-claimed-in-app",
    artisticCertificationStatus: "not-claimed",
    scientificCertificationStatus: "not-claimed",
    wcagCertificationStatus: "not-claimed",
    universeSandboxCloneStatus: "not-claimed",
    onlineValidationStatus: "not-claimed",
    trustedBoundary: ATLAS_REFERENCE_GRADE_SPACE_ART_BOUNDARY,
  };
}

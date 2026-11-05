/* v250 domain types: visual. Public names remain re-exported by simulationDiagnosticsTypes.ts. */
import type { AtlasGaiaStarfieldEnhancementBudget, AtlasGaiaStarfieldEnhancementVersion } from "./catalog";
import type { AtlasMaintenanceEvidenceIndexVersion } from "./evidence";
import type { AtlasBackgroundDepthProfile, AtlasBackgroundSubjectVisibilityProfile, AtlasOrbitOcclusionProfile, AtlasReferenceGradeCompositeProfile, AtlasReferenceGradeSubjectMatteProfile, AtlasScientificModelUpgradeContractVersion, AtlasSelectedBodyAtmosphereDepthProfile, AtlasSelectedBodyEarthCloudNightProfile, AtlasSelectedBodyKeyLightProfile, AtlasSelectedBodyRingProfile, AtlasSelectedBodySolarSurfaceProfile, AtlasSelectedBodyTerminatorProfile, AtlasVelocityTrailProfile } from "./physics";
import type { AtlasCriticalUiRelativityVisibilityVersion, AtlasRelativitySimulationOptimizationVersion } from "./relativity";
import type { AtlasInteractionRepairLaunchUxVersion, AtlasOrbitPerformanceProfile, AtlasRuntimeQualityTier } from "./release";

export type AtlasRenderStabilityStatus = "ready" | "warming" | "fallback" | "constrained";


export type AtlasPlanetaryVisualFidelityVersion = "v43-planetary-visual-fidelity-pass";

export type AtlasPlanetaryVisualFidelitySummary = {
  version: AtlasPlanetaryVisualFidelityVersion;
  status: "informational";
  visualTarget: "selected-body-closeup-realism";
  styleTarget: "restrained-scientific-instrument";
  assetPolicy: "network-prepared-local-runtime";
  runtimeAssetSource: "local-public-textures-only";
  closeupPriority: "major-selected-bodies";
  skyCloseupProfile: "closeup-deep-space-dimmed";
  aaBoundaryPreserved: "v41-aa-boundary-preserved";
  cinematicBoundaryPreserved: "v42-cinematic-boundary-preserved";
  physicsMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  scientificCertificationStatus: "not-claimed";
  onlineValidationStatus: "not-claimed";
  trustedBoundary: string;
};


export type AtlasCinematicLightingCompositionVersion = "v44-cinematic-lighting-composition";

export type AtlasSelectedBodyLightingProfile =
  | "overview"
  | "earth-night-closeup"
  | "terrestrial-closeup"
  | "lunar-mars-closeup"
  | "gas-giant-closeup"
  | "solar-closeup";

export type AtlasCinematicLightingCompositionSummary = {
  version: AtlasCinematicLightingCompositionVersion;
  status: "informational";
  visualTarget: "closeup-cinematic-lighting-composition";
  lightingProfile: "filmic-closeup-balanced";
  postFxProfile: "aces-vignette-restrained-bloom";
  assetPolicy: "dev-prepared-local-runtime";
  runtimeAssetSource: "local-public-textures-only";
  supportedLightingProfiles: readonly AtlasSelectedBodyLightingProfile[];
  skyCloseupProfile: "deep-space-filmic-dim";
  aaBoundaryPreserved: "v41-aa-boundary-preserved";
  cinematicBoundaryPreserved: "v42-cinematic-boundary-preserved";
  planetaryBoundaryPreserved: "v43-planetary-visual-fidelity-preserved";
  physicsMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  artisticCertificationStatus: "not-claimed";
  scientificCertificationStatus: "not-claimed";
  onlineValidationStatus: "not-claimed";
  trustedBoundary: string;
};


export type AtlasCinematicDeepSpaceCameraVersion = "v46-cinematic-deep-space-camera";

export type AtlasCinematicCameraProfile =
  | "overview-atlas"
  | "selected-body-cinematic"
  | "showcase-deep-space";

export type AtlasCinematicSkyCompositionProfile =
  | "layered-atlas-overview"
  | "subject-separated-deep-space"
  | "layered-milky-way-showcase";

export type AtlasCinematicBackgroundNoiseProfile =
  | "atlas-balanced-low-noise"
  | "closeup-low-noise"
  | "showcase-structured-low-noise";

export type AtlasCinematicTargetSeparationProfile =
  | "overview-orbit-depth"
  | "selected-body-limb-and-negative-space"
  | "showcase-deep-space-band";

export type AtlasCinematicDeepSpaceCameraSummary = {
  version: AtlasCinematicDeepSpaceCameraVersion;
  status: "informational";
  visualTarget: "cinematic-deep-space-camera-composition";
  defaultCameraProfile: "overview-atlas";
  closeupCameraProfile: "selected-body-cinematic";
  showcaseCameraProfile: "showcase-deep-space";
  qualityBudget: "stable-high-fidelity";
  runtimeAssetSource: "local-public-textures-and-local-catalogs";
  supportedCameraProfiles: readonly AtlasCinematicCameraProfile[];
  supportedSkyCompositionProfiles: readonly AtlasCinematicSkyCompositionProfile[];
  supportedBackgroundNoiseProfiles: readonly AtlasCinematicBackgroundNoiseProfile[];
  supportedTargetSeparationProfiles: readonly AtlasCinematicTargetSeparationProfile[];
  aaBoundaryPreserved: "v41-aa-boundary-preserved";
  cinematicBoundaryPreserved: "v42-cinematic-boundary-preserved";
  planetaryBoundaryPreserved: "v43-planetary-visual-fidelity-preserved";
  lightingBoundaryPreserved: "v44-cinematic-lighting-preserved";
  chineseBoundaryPreserved: "v45-chinese-deep-space-fidelity-preserved";
  physicsMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  artisticCertificationStatus: "not-claimed";
  scientificCertificationStatus: "not-claimed";
  wcagCertificationStatus: "not-claimed";
  onlineValidationStatus: "not-claimed";
  trustedBoundary: string;
};


export type AtlasUniverseSandboxReferenceBackdropVersion = "v47-universe-sandbox-reference-backdrop";

export type AtlasUniverseSandboxReferenceBackdropSummary = {
  version: AtlasUniverseSandboxReferenceBackdropVersion;
  status: "informational";
  referenceMode: "inspired-reference-comparison";
  backgroundArtDirection: "sparse-stars-layered-milky-way";
  defaultDepthProfile: "overview-sparse-layered-milky-way";
  closeupDepthProfile: "closeup-subject-negative-space";
  showcaseDepthProfile: "showcase-reference-depth";
  subjectVisibilityProfile: "selected-body-in-frame";
  screenshotReview: "local-only";
  runtimeAssetSource: "local-public-textures-and-local-catalogs";
  supportedDepthProfiles: readonly AtlasBackgroundDepthProfile[];
  supportedSubjectVisibilityProfiles: readonly AtlasBackgroundSubjectVisibilityProfile[];
  aaBoundaryPreserved: "v41-aa-boundary-preserved";
  cinematicBoundaryPreserved: "v42-cinematic-boundary-preserved";
  planetaryBoundaryPreserved: "v43-planetary-visual-fidelity-preserved";
  lightingBoundaryPreserved: "v44-cinematic-lighting-preserved";
  chineseBoundaryPreserved: "v45-chinese-deep-space-fidelity-preserved";
  deepSpaceCameraBoundaryPreserved: "v46-cinematic-deep-space-camera-preserved";
  physicsMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  artisticCertificationStatus: "not-claimed";
  scientificCertificationStatus: "not-claimed";
  wcagCertificationStatus: "not-claimed";
  universeSandboxCloneStatus: "not-claimed";
  onlineValidationStatus: "not-claimed";
  trustedBoundary: string;
};


export type AtlasReferenceGradeSpaceArtVersion = "v48-reference-grade-space-art";

export type AtlasReferenceGradeSkyLayerProfile =
  | "v48-local-generated-layered-sky"
  | "v48-local-closeup-negative-space"
  | "v48-local-showcase-milky-way";

export type AtlasReferenceGradeStarfieldProfile =
  | "sparse-primary-stars"
  | "closeup-star-noise-suppressed"
  | "showcase-structured-starfield";

export type AtlasReferenceGradePlanetMaterialProfile =
  | "overview-local-hd"
  | "closeup-microcontrast-fill"
  | "gas-giant-ring-readability"
  | "solar-edge-controlled";

export type AtlasReferenceGradeSpaceArtSummary = {
  version: AtlasReferenceGradeSpaceArtVersion;
  status: "informational";
  artDirection: "cinematic-scientific-space-simulation";
  assetPolicy: "generated-local-runtime-assets";
  reviewMode: "local-reference-screenshot-rubric";
  defaultCompositeProfile: "overview-layered-reference-grade";
  closeupCompositeProfile: "selected-body-subject-matte";
  showcaseCompositeProfile: "showcase-cinematic-deep-space";
  defaultSkyLayerProfile: "v48-local-generated-layered-sky";
  closeupSkyLayerProfile: "v48-local-closeup-negative-space";
  showcaseSkyLayerProfile: "v48-local-showcase-milky-way";
  defaultStarfieldProfile: "sparse-primary-stars";
  closeupStarfieldProfile: "closeup-star-noise-suppressed";
  showcaseStarfieldProfile: "showcase-structured-starfield";
  defaultSubjectMatteProfile: "overview-no-subject-matte";
  closeupSubjectMatteProfile: "selected-body-background-matte";
  showcaseSubjectMatteProfile: "showcase-center-negative-space";
  defaultPlanetMaterialProfile: "overview-local-hd";
  closeupPlanetMaterialProfile: "closeup-microcontrast-fill";
  gasGiantPlanetMaterialProfile: "gas-giant-ring-readability";
  solarPlanetMaterialProfile: "solar-edge-controlled";
  supportedCompositeProfiles: readonly AtlasReferenceGradeCompositeProfile[];
  supportedSkyLayerProfiles: readonly AtlasReferenceGradeSkyLayerProfile[];
  supportedStarfieldProfiles: readonly AtlasReferenceGradeStarfieldProfile[];
  supportedSubjectMatteProfiles: readonly AtlasReferenceGradeSubjectMatteProfile[];
  supportedPlanetMaterialProfiles: readonly AtlasReferenceGradePlanetMaterialProfile[];
  runtimeAssetSource: "generated-local-public-textures-and-local-catalogs";
  aaBoundaryPreserved: "v41-aa-boundary-preserved";
  cinematicBoundaryPreserved: "v42-cinematic-boundary-preserved";
  planetaryBoundaryPreserved: "v43-planetary-visual-fidelity-preserved";
  lightingBoundaryPreserved: "v44-cinematic-lighting-preserved";
  chineseBoundaryPreserved: "v45-chinese-deep-space-fidelity-preserved";
  deepSpaceCameraBoundaryPreserved: "v46-cinematic-deep-space-camera-preserved";
  universeSandboxReferenceBoundaryPreserved: "v47-universe-sandbox-reference-backdrop-preserved";
  physicsMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  artisticCertificationStatus: "not-claimed";
  scientificCertificationStatus: "not-claimed";
  wcagCertificationStatus: "not-claimed";
  universeSandboxCloneStatus: "not-claimed";
  onlineValidationStatus: "not-claimed";
  trustedBoundary: string;
};


export type AtlasPlanetaryMaterialCompositionVersion = "v49-planetary-material-composition";

export type AtlasSelectedBodyMaterialProfile =
  | "overview-local-material"
  | "earth-cloud-night-depth"
  | "gas-giant-band-depth"
  | "saturn-ring-material-depth"
  | "solar-granulation-depth"
  | "lunar-mars-relief-depth"
  | "terrestrial-terminator-depth";

export type AtlasPlanetaryMaterialCompositionSummary = {
  version: AtlasPlanetaryMaterialCompositionVersion;
  status: "informational";
  materialTarget: "closeup-body-material-depth";
  assetPolicy: "dev-refresh-prepared-local-runtime";
  runtimeAssetSource: "prepared-local-planet-textures-only";
  supportedMaterialProfiles: readonly AtlasSelectedBodyMaterialProfile[];
  supportedAtmosphereDepthProfiles: readonly AtlasSelectedBodyAtmosphereDepthProfile[];
  supportedTerminatorProfiles: readonly AtlasSelectedBodyTerminatorProfile[];
  supportedRingProfiles: readonly AtlasSelectedBodyRingProfile[];
  earthMaterialProfile: "earth-cloud-night-depth";
  gasGiantMaterialProfile: "gas-giant-band-depth";
  saturnMaterialProfile: "saturn-ring-material-depth";
  solarMaterialProfile: "solar-granulation-depth";
  lunarMarsMaterialProfile: "lunar-mars-relief-depth";
  terrestrialMaterialProfile: "terrestrial-terminator-depth";
  defaultMaterialProfile: "overview-local-material";
  earthAtmosphereProfile: "thin-earth-limb-depth";
  gasGiantAtmosphereProfile: "gas-giant-soft-limb-depth";
  solarAtmosphereProfile: "solar-edge-controlled-depth";
  airlessAtmosphereProfile: "airless-relief-limb";
  defaultAtmosphereProfile: "overview-atmosphere";
  earthTerminatorProfile: "earth-night-cloud-terminator";
  gasGiantTerminatorProfile: "gas-band-low-fill-terminator";
  solarTerminatorProfile: "solar-limb-darkening";
  airlessTerminatorProfile: "airless-relief-terminator";
  defaultTerminatorProfile: "overview-terminator";
  saturnRingProfile: "saturn-cassini-layered-ring";
  defaultRingProfile: "no-ring-profile";
  aaBoundaryPreserved: "v41-aa-boundary-preserved";
  cinematicBoundaryPreserved: "v42-cinematic-boundary-preserved";
  planetaryBoundaryPreserved: "v43-planetary-visual-fidelity-preserved";
  lightingBoundaryPreserved: "v44-cinematic-lighting-preserved";
  chineseBoundaryPreserved: "v45-chinese-deep-space-fidelity-preserved";
  deepSpaceCameraBoundaryPreserved: "v46-cinematic-deep-space-camera-preserved";
  universeSandboxReferenceBoundaryPreserved: "v47-universe-sandbox-reference-backdrop-preserved";
  referenceGradeBoundaryPreserved: "v48-reference-grade-space-art-preserved";
  physicsMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  artisticCertificationStatus: "not-claimed";
  scientificCertificationStatus: "not-claimed";
  wcagCertificationStatus: "not-claimed";
  assetCompletenessCertificationStatus: "not-claimed";
  onlineValidationStatus: "not-claimed";
  trustedBoundary: string;
};


export type AtlasCinematicCloseupDirectorVersion = "v50-cinematic-closeup-director";

export type AtlasCloseupCompositionProfile =
  | "overview-no-closeup-director"
  | "earth-limb-portrait"
  | "solar-surface-portrait"
  | "gas-giant-band-portrait"
  | "saturn-ring-showcase"
  | "lunar-mars-relief-portrait";

export type AtlasCloseupPanelAvoidanceProfile =
  | "overview-no-panel-avoidance"
  | "right-workbench-safe-subject-left"
  | "centered-mobile-safe-subject";

export type AtlasCloseupRingShowcaseProfile =
  | "no-ring-showcase"
  | "saturn-wide-tilted-ring-showcase";

export type AtlasCinematicCloseupDirectorSummary = {
  version: AtlasCinematicCloseupDirectorVersion;
  status: "informational";
  compositionTarget: "aaa-inspired-closeup-subject-composition";
  qualityBudget: "stable-high-fidelity";
  assetPolicy: "local-runtime-assets";
  runtimeAssetSource: "prepared-local-planet-and-sky-textures-only";
  supportedCompositionProfiles: readonly AtlasCloseupCompositionProfile[];
  supportedPanelAvoidanceProfiles: readonly AtlasCloseupPanelAvoidanceProfile[];
  supportedRingShowcaseProfiles: readonly AtlasCloseupRingShowcaseProfile[];
  defaultCompositionProfile: "overview-no-closeup-director";
  earthCompositionProfile: "earth-limb-portrait";
  solarCompositionProfile: "solar-surface-portrait";
  gasGiantCompositionProfile: "gas-giant-band-portrait";
  saturnCompositionProfile: "saturn-ring-showcase";
  lunarMarsCompositionProfile: "lunar-mars-relief-portrait";
  defaultPanelAvoidanceProfile: "overview-no-panel-avoidance";
  desktopPanelAvoidanceProfile: "right-workbench-safe-subject-left";
  mobilePanelAvoidanceProfile: "centered-mobile-safe-subject";
  defaultRingShowcaseProfile: "no-ring-showcase";
  saturnRingShowcaseProfile: "saturn-wide-tilted-ring-showcase";
  aaBoundaryPreserved: "v41-aa-boundary-preserved";
  cinematicBoundaryPreserved: "v42-cinematic-boundary-preserved";
  planetaryBoundaryPreserved: "v43-planetary-visual-fidelity-preserved";
  lightingBoundaryPreserved: "v44-cinematic-lighting-preserved";
  chineseBoundaryPreserved: "v45-chinese-deep-space-fidelity-preserved";
  deepSpaceCameraBoundaryPreserved: "v46-cinematic-deep-space-camera-preserved";
  universeSandboxReferenceBoundaryPreserved: "v47-universe-sandbox-reference-backdrop-preserved";
  referenceGradeBoundaryPreserved: "v48-reference-grade-space-art-preserved";
  planetaryMaterialBoundaryPreserved: "v49-planetary-material-composition-preserved";
  physicsMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  artisticCertificationStatus: "not-claimed";
  scientificCertificationStatus: "not-claimed";
  wcagCertificationStatus: "not-claimed";
  onlineValidationStatus: "not-claimed";
  universeSandboxCloneStatus: "not-claimed";
  trustedBoundary: string;
};


export type AtlasCinematicKeyLightDirectorVersion = "v51-cinematic-key-light-director";

export type AtlasCinematicKeyLightDirectorSummary = {
  version: AtlasCinematicKeyLightDirectorVersion;
  status: "informational";
  lightingTarget: "selected-body-readable-key-light-phase";
  qualityBudget: "stable-high-fidelity";
  assetPolicy: "local-runtime-assets";
  runtimeAssetSource: "prepared-local-planet-textures-and-rendering-profiles-only";
  supportedKeyLightProfiles: readonly AtlasSelectedBodyKeyLightProfile[];
  defaultKeyLightProfile: "overview-natural-phase";
  earthKeyLightProfile: "earth-cloud-night-key-balance";
  solarKeyLightProfile: "solar-surface-edge-key";
  gasGiantKeyLightProfile: "gas-giant-readable-key-fill";
  saturnKeyLightProfile: "saturn-ring-key-fill";
  lunarMarsKeyLightProfile: "lunar-mars-relief-key";
  aaBoundaryPreserved: "v41-aa-boundary-preserved";
  cinematicBoundaryPreserved: "v42-cinematic-boundary-preserved";
  planetaryBoundaryPreserved: "v43-planetary-visual-fidelity-preserved";
  lightingBoundaryPreserved: "v44-cinematic-lighting-preserved";
  chineseBoundaryPreserved: "v45-chinese-deep-space-fidelity-preserved";
  deepSpaceCameraBoundaryPreserved: "v46-cinematic-deep-space-camera-preserved";
  universeSandboxReferenceBoundaryPreserved: "v47-universe-sandbox-reference-backdrop-preserved";
  referenceGradeBoundaryPreserved: "v48-reference-grade-space-art-preserved";
  planetaryMaterialBoundaryPreserved: "v49-planetary-material-composition-preserved";
  closeupDirectorBoundaryPreserved: "v50-cinematic-closeup-director-preserved";
  physicsMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  artisticCertificationStatus: "not-claimed";
  scientificCertificationStatus: "not-claimed";
  wcagCertificationStatus: "not-claimed";
  onlineValidationStatus: "not-claimed";
  universeSandboxCloneStatus: "not-claimed";
  trustedBoundary: string;
};


export type AtlasPlanetaryDepthLightingVersion = "v52-planetary-depth-lighting";

export type AtlasSelectedBodyDepthLightingProfile =
  | "overview-no-depth-lighting"
  | "earth-atmospheric-terminator-depth"
  | "solar-granulation-limb-depth"
  | "gas-giant-banded-phase-depth"
  | "saturn-ring-shadow-depth"
  | "airless-relief-terminator-depth";

export type AtlasPlanetaryDepthLightingSummary = {
  version: AtlasPlanetaryDepthLightingVersion;
  status: "informational";
  lightingTarget: "closeup-atmospheric-terminator-ring-depth";
  qualityBudget: "stable-high-fidelity";
  assetPolicy: "local-runtime-assets";
  runtimeAssetSource: "prepared-local-planet-textures-and-rendering-profiles-only";
  supportedDepthLightingProfiles: readonly AtlasSelectedBodyDepthLightingProfile[];
  defaultDepthLightingProfile: "overview-no-depth-lighting";
  earthDepthLightingProfile: "earth-atmospheric-terminator-depth";
  solarDepthLightingProfile: "solar-granulation-limb-depth";
  gasGiantDepthLightingProfile: "gas-giant-banded-phase-depth";
  saturnDepthLightingProfile: "saturn-ring-shadow-depth";
  lunarMarsDepthLightingProfile: "airless-relief-terminator-depth";
  atmosphereRimCue: "thin-limb-nonemissive-rim";
  terminatorCue: "directional-shadow-rolloff";
  gasBandCue: "nonuniform-band-depth-contrast";
  ringShadowCue: "saturn-equatorial-ring-shadow-matte";
  aaBoundaryPreserved: "v41-aa-boundary-preserved";
  cinematicBoundaryPreserved: "v42-cinematic-boundary-preserved";
  planetaryBoundaryPreserved: "v43-planetary-visual-fidelity-preserved";
  lightingBoundaryPreserved: "v44-cinematic-lighting-preserved";
  chineseBoundaryPreserved: "v45-chinese-deep-space-fidelity-preserved";
  deepSpaceCameraBoundaryPreserved: "v46-cinematic-deep-space-camera-preserved";
  universeSandboxReferenceBoundaryPreserved: "v47-universe-sandbox-reference-backdrop-preserved";
  referenceGradeBoundaryPreserved: "v48-reference-grade-space-art-preserved";
  planetaryMaterialBoundaryPreserved: "v49-planetary-material-composition-preserved";
  closeupDirectorBoundaryPreserved: "v50-cinematic-closeup-director-preserved";
  keyLightBoundaryPreserved: "v51-cinematic-key-light-director-preserved";
  physicsMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  artisticCertificationStatus: "not-claimed";
  scientificCertificationStatus: "not-claimed";
  wcagCertificationStatus: "not-claimed";
  onlineValidationStatus: "not-claimed";
  universeSandboxCloneStatus: "not-claimed";
  trustedBoundary: string;
};


export type AtlasPlanetaryColorGradingVersion = "v53-planetary-color-grading";

export type AtlasSelectedBodyColorGradeProfile =
  | "overview-neutral-color"
  | "earth-ocean-cloud-color-depth"
  | "solar-photosphere-color-depth"
  | "gas-giant-layer-color-grade"
  | "saturn-ring-occlusion-color-grade"
  | "airless-regolith-color-depth";

export type AtlasPlanetaryColorGradingSummary = {
  version: AtlasPlanetaryColorGradingVersion;
  status: "informational";
  colorTarget: "closeup-planet-color-layer-depth";
  qualityBudget: "stable-high-fidelity";
  assetPolicy: "local-runtime-assets";
  runtimeAssetSource: "prepared-local-planet-textures-and-rendering-profiles-only";
  supportedColorGradeProfiles: readonly AtlasSelectedBodyColorGradeProfile[];
  defaultColorGradeProfile: "overview-neutral-color";
  earthColorGradeProfile: "earth-ocean-cloud-color-depth";
  solarColorGradeProfile: "solar-photosphere-color-depth";
  gasGiantColorGradeProfile: "gas-giant-layer-color-grade";
  saturnColorGradeProfile: "saturn-ring-occlusion-color-grade";
  lunarMarsColorGradeProfile: "airless-regolith-color-depth";
  colorSeparationCue: "filmic-warm-highlight-cool-shadow";
  gasLayerCue: "gas-layer-microcontrast";
  saturnOcclusionCue: "saturn-ring-body-occlusion-tone";
  aaBoundaryPreserved: "v41-aa-boundary-preserved";
  cinematicBoundaryPreserved: "v42-cinematic-boundary-preserved";
  planetaryBoundaryPreserved: "v43-planetary-visual-fidelity-preserved";
  lightingBoundaryPreserved: "v44-cinematic-lighting-preserved";
  chineseBoundaryPreserved: "v45-chinese-deep-space-fidelity-preserved";
  deepSpaceCameraBoundaryPreserved: "v46-cinematic-deep-space-camera-preserved";
  universeSandboxReferenceBoundaryPreserved: "v47-universe-sandbox-reference-backdrop-preserved";
  referenceGradeBoundaryPreserved: "v48-reference-grade-space-art-preserved";
  planetaryMaterialBoundaryPreserved: "v49-planetary-material-composition-preserved";
  closeupDirectorBoundaryPreserved: "v50-cinematic-closeup-director-preserved";
  keyLightBoundaryPreserved: "v51-cinematic-key-light-director-preserved";
  depthLightingBoundaryPreserved: "v52-planetary-depth-lighting-preserved";
  physicsMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  artisticCertificationStatus: "not-claimed";
  scientificCertificationStatus: "not-claimed";
  wcagCertificationStatus: "not-claimed";
  onlineValidationStatus: "not-claimed";
  universeSandboxCloneStatus: "not-claimed";
  trustedBoundary: string;
};


export type AtlasCinematicPlanetaryArtDirectionVersion = "v55-cinematic-planetary-art-direction";

export type AtlasSelectedBodyGasGiantArtProfile =
  | "overview-no-gas-giant-art"
  | "gas-giant-band-depth-cinematic"
  | "saturn-muted-bands-ring-aware";

export type AtlasSelectedBodySaturnRingArtProfile =
  | "no-ring-art-profile"
  | "saturn-cassini-backlit-ring-art";

export type AtlasGlobalColorGradeProfile =
  | "overview-neutral-grade"
  | "filmic-cool-space-warm-planet-protection";

export type AtlasBackgroundArtGradeProfile =
  | "overview-balanced-starfield"
  | "sparse-negative-space-milky-way-depth"
  | "closeup-subject-star-noise-matte";

export type AtlasCinematicPlanetaryArtDirectionSummary = {
  version: AtlasCinematicPlanetaryArtDirectionVersion;
  status: "informational";
  referenceMode: "universe-sandbox-inspired-local-comparison";
  qualityTarget: "aaa-inspired-scientific-space-simulation";
  assetPolicy: "dev-refresh-prepared-local-runtime";
  runtimeAssetSource: "prepared-local-v55-art-direction-assets-only";
  supportedGasGiantArtProfiles: readonly AtlasSelectedBodyGasGiantArtProfile[];
  supportedSaturnRingArtProfiles: readonly AtlasSelectedBodySaturnRingArtProfile[];
  supportedEarthCloudNightProfiles: readonly AtlasSelectedBodyEarthCloudNightProfile[];
  supportedSolarSurfaceProfiles: readonly AtlasSelectedBodySolarSurfaceProfile[];
  defaultGasGiantArtProfile: "overview-no-gas-giant-art";
  gasGiantArtProfile: "gas-giant-band-depth-cinematic";
  saturnGasGiantArtProfile: "saturn-muted-bands-ring-aware";
  defaultSaturnRingArtProfile: "no-ring-art-profile";
  saturnRingArtProfile: "saturn-cassini-backlit-ring-art";
  defaultEarthCloudNightProfile: "overview-no-earth-cloud-night-art";
  earthCloudNightProfile: "earth-clean-cloud-night-shadow-art";
  defaultSolarSurfaceProfile: "overview-no-solar-surface-art";
  solarSurfaceProfile: "solar-granulation-controlled-corona-art";
  globalColorGradeProfile: "filmic-cool-space-warm-planet-protection";
  defaultBackgroundArtGradeProfile: "sparse-negative-space-milky-way-depth";
  closeupBackgroundArtGradeProfile: "closeup-subject-star-noise-matte";
  backgroundReferenceCue: "sparse-stars-layered-milky-way-negative-space";
  earthNightCue: "dark-side-only-city-light-mask";
  gasBandCue: "nonemissive-banded-microcontrast";
  saturnRingCue: "cassini-gap-backlit-layering";
  solarSurfaceCue: "granulation-controlled-corona";
  aaBoundaryPreserved: "v41-aa-boundary-preserved";
  referenceGradeBoundaryPreserved: "v48-reference-grade-space-art-preserved";
  materialBoundaryPreserved: "v49-planetary-material-composition-preserved";
  colorBoundaryPreserved: "v53-planetary-color-grading-preserved";
  numericalIntegrityBoundaryPreserved: "v54-numerical-integrity-gate-preserved";
  physicsMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  artisticCertificationStatus: "not-claimed";
  scientificCertificationStatus: "not-claimed";
  wcagCertificationStatus: "not-claimed";
  ciCertificationStatus: "not-claimed";
  onlineValidationStatus: "not-claimed";
  onlineAssetCompletenessStatus: "not-claimed";
  universeSandboxCloneStatus: "not-claimed";
  trustedBoundary: string;
};


export type AtlasCinematicDeepSpaceBackdropVersion = "v56-cinematic-deep-space-backdrop";

export type AtlasCinematicBackdropStarfieldProfile =
  | "sparse-primary-stars-faint-distant-field"
  | "closeup-subject-star-noise-suppressed";

export type AtlasCinematicBackdropNebulaProfile =
  | "soft-local-nebula-haze-layer"
  | "closeup-nebula-haze-restrained";

export type AtlasCinematicBackdropNegativeSpaceProfile =
  | "layered-milky-way-negative-space"
  | "selected-body-clean-dark-backdrop";

export type AtlasCinematicDeepSpaceBackdropSummary = {
  version: AtlasCinematicDeepSpaceBackdropVersion;
  status: "informational";
  referenceMode: "universe-sandbox-inspired-local-comparison";
  sourcePolicy: "nasa-svs-prepared-local-runtime";
  skyManifest: "orbit-atlas-v56";
  runtimeAssetSource: "prepared-local-v56-sky-assets-only";
  sourceInputs: readonly [
    "nasa-svs-deep-star-maps-2020",
    "nasa-svs-elsewhere-starfield-2020",
    "local-v48-v9-fallbacks",
  ];
  starfieldProfile: "sparse-primary-stars-faint-distant-field";
  closeupStarfieldProfile: "closeup-subject-star-noise-suppressed";
  nebulaProfile: "soft-local-nebula-haze-layer";
  closeupNebulaProfile: "closeup-nebula-haze-restrained";
  negativeSpaceProfile: "layered-milky-way-negative-space";
  closeupNegativeSpaceProfile: "selected-body-clean-dark-backdrop";
  backgroundHighlightPolicy: "bright-wall-suppressed";
  milkyWayDarkLanePolicy: "cold-gray-blue-dark-lane-preserved";
  aaBoundaryPreserved: "v41-aa-boundary-preserved";
  referenceGradeBoundaryPreserved: "v48-reference-grade-space-art-preserved";
  planetaryArtBoundaryPreserved: "v55-cinematic-planetary-art-direction-preserved";
  numericalIntegrityBoundaryPreserved: "v54-numerical-integrity-gate-preserved";
  physicsMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  artisticCertificationStatus: "not-claimed";
  scientificCertificationStatus: "not-claimed";
  wcagCertificationStatus: "not-claimed";
  ciCertificationStatus: "not-claimed";
  onlineValidationStatus: "not-claimed";
  onlineAssetCompletenessStatus: "not-claimed";
  universeSandboxCloneStatus: "not-claimed";
  trustedBoundary: string;
};


export type AtlasSparseDeepSpaceDirectorVersion = "v57-sparse-deep-space-director";

export type AtlasSparseDeepSpaceStarfieldProfile =
  | "sparse-primary-stars-ultrafaint-distant-field"
  | "closeup-primary-stars-subject-matte";

export type AtlasSparseDeepSpaceMilkyWayProfile =
  | "deep-cold-gray-blue-dark-lanes"
  | "closeup-dark-lane-negative-space";

export type AtlasSparseDeepSpaceNebulaProfile =
  | "barely-visible-local-haze"
  | "closeup-haze-nearly-suppressed";

export type AtlasSparseDeepSpaceNegativeSpaceProfile =
  | "overview-wide-negative-space"
  | "selected-body-clean-negative-space";

export type AtlasSparseDeepSpaceDirectorSummary = {
  version: AtlasSparseDeepSpaceDirectorVersion;
  status: "informational";
  referenceMode: "universe-sandbox-inspired-sparse-deep-space";
  sourcePolicy: "nasa-svs-16k-prepared-local-runtime";
  skyManifest: "orbit-atlas-v57";
  runtimeAssetSource: "prepared-local-v57-sky-assets-only";
  sourceInputs: readonly [
    "nasa-svs-deep-star-maps-2020-16k",
    "nasa-svs-elsewhere-starfield-2020-16k",
    "local-v56-v48-v9-fallbacks",
  ];
  starfieldProfile: "sparse-primary-stars-ultrafaint-distant-field";
  closeupStarfieldProfile: "closeup-primary-stars-subject-matte";
  milkyWayProfile: "deep-cold-gray-blue-dark-lanes";
  closeupMilkyWayProfile: "closeup-dark-lane-negative-space";
  nebulaProfile: "barely-visible-local-haze";
  closeupNebulaProfile: "closeup-haze-nearly-suppressed";
  negativeSpaceProfile: "overview-wide-negative-space";
  closeupNegativeSpaceProfile: "selected-body-clean-negative-space";
  backgroundPixelBudget: "overview-tightened-closeup-tightened";
  aaBoundaryPreserved: "v41-aa-boundary-preserved";
  cinematicBackdropBoundaryPreserved: "v56-cinematic-deep-space-backdrop-preserved";
  planetaryArtBoundaryPreserved: "v55-cinematic-planetary-art-direction-preserved";
  numericalIntegrityBoundaryPreserved: "v54-numerical-integrity-gate-preserved";
  physicsMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  artisticCertificationStatus: "not-claimed";
  scientificCertificationStatus: "not-claimed";
  wcagCertificationStatus: "not-claimed";
  ciCertificationStatus: "not-claimed";
  onlineValidationStatus: "not-claimed";
  onlineAssetCompletenessStatus: "not-claimed";
  universeSandboxCloneStatus: "not-claimed";
  trustedBoundary: string;
};


export type AtlasCloseupPresentationTruthVersion = "v58-closeup-presentation-truth";

export type AtlasBackgroundOrbitArtVersion =
  | "v59-background-orbit-art"
  | "v60-background-performance-recovery"
  | "v61-visual-reset-space-art"
  | "v62-cinematic-space-depth"
  | "v63-final-visual-lock-background-bodies"
  | "v64-aaa-cinematic-background-depth"
  | "v65-cinematic-background-lock"
  | "v66-cinematic-milky-way-depth"
  | "v67-cinematic-sky-orbit-lock"
  | "v68-reference-backdrop-lock"
  | "v69-legacy-8k-sky-restore";

export type AtlasBackgroundArtProfile =
  | "v59-restrained-peripheral-milky-way"
  | "v60-visible-low-noise-deep-space"
  | "v61-readable-deep-space-visual-reset"
  | "v62-layered-parallax-darkfield"
  | "v63-final-cinematic-darkfield"
  | "v64-sparse-parallax-dust-darkfield"
  | "v65-sparse-anchor-stars-darkfield"
  | "v66-low-frequency-milky-way-dark-lanes"
  | "v67-galactic-dust-starfield-depth"
  | "v68-centered-galactic-dust-starfield"
  | "v69-legacy-blue-dust-starfield";

export type AtlasOrbitHierarchyProfile = "major-identity-minor-restrained";

export type AtlasOrbitMaterialProfile =
  | "cinematic-depth-aware-hairlines"
  | "v67-layered-depth-orbit-ribbons";

export type AtlasSolarCloseupProfile = "solar-limb-controlled-corona";

export type AtlasBodyPreviewRenderProfile =
  | "solar-procedural-preview"
  | "earth-cloud-night-preview"
  | "gas-giant-band-preview"
  | "saturn-ringed-band-preview"
  | "terrestrial-texture-preview"
  | "lunar-mars-relief-preview"
  | "fallback-procedural-preview";

export type AtlasBodyPreviewTexturePolicy =
  | "hd-or-v49-local-texture"
  | "local-texture"
  | "procedural-fallback";

export type AtlasBodyPreviewRingState = "ringed" | "no-ring";

export type AtlasCloseupPreviewSyncStatus = "selected-body-synced" | "no-selected-body";

export type AtlasCloseupSolarBackdropProfile =
  | "overview-sparse-sky"
  | "solar-clean-negative-space";

export type AtlasCloseupPlanetReadabilityProfile =
  | "overview-readable"
  | "body-specific-closeup-readable";

export type AtlasVisualStabilityVersion = "v70-visual-stability-material-pass";

export type AtlasSkyArtLockProfile = "v69-legacy-blue-dust-starfield-locked";

export type AtlasMaterialStabilityProfile =
  | "v70-earth-saturn-sun-material-coherence"
  | "v70-overview-material-baseline";

export type AtlasVisualStabilitySummary = {
  version: AtlasVisualStabilityVersion;
  status: "informational";
  skyArtLockProfile: AtlasSkyArtLockProfile;
  materialStabilityProfile: AtlasMaterialStabilityProfile;
  backgroundOrbitArtVersion: "v69-legacy-8k-sky-restore";
  backgroundArtProfile: "v69-legacy-blue-dust-starfield";
  lockedSkyManifest: "orbit-atlas-v9";
  selectedBodyMaterialTarget: "earth-saturn-sun-closeup-coherence";
  physicsMutation: "not-applied";
  skyAssetMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  artisticCertificationStatus: "not-claimed";
  scientificCertificationStatus: "not-claimed";
  onlineAssetCompletenessStatus: "not-claimed";
  kerrKernelMutation: "not-applied";
  trustedBoundary: string;
};

export type AtlasSkyRegressionBudgetProfile = "v71-v69-legacy-blue-dust-budget";

export type AtlasMaterialProfileVersion = "v72-material-profile-contract";

export type AtlasCloseupMaterialBudgetProfile = "v72-earth-saturn-sun-closeup-material-budget";

export type AtlasMaterialProfileSummary = {
  version: AtlasMaterialProfileVersion;
  status: "informational";
  closeupMaterialBudgetProfile: AtlasCloseupMaterialBudgetProfile;
  backgroundOrbitArtVersion: "v69-legacy-8k-sky-restore";
  backgroundGuardVersion: "v71-background-regression-guard";
  visualStabilityVersion: "v70-visual-stability-material-pass";
  earthProfileId: "earth-v72-cloud-night-terminator";
  saturnProfileId: "saturn-v72-ring-shadow-cassini";
  sunProfileId: "sun-v72-granulation-limb-bloom-restraint";
  gasGiantProfileId: "gas-giant-v72-band-microcontrast";
  assetPolicy: "existing-local-textures-and-shader-profiles-only";
  earthBudgetCue: "cloud-night-terminator-thin-atmosphere";
  saturnBudgetCue: "cassini-ring-shadow-occlusion";
  sunBudgetCue: "granulation-limb-darkening-bloom-restraint";
  gasGiantBudgetCue: "banded-microcontrast-baseline";
  physicsMutation: "not-applied";
  skyAssetMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  artisticCertificationStatus: "not-claimed";
  scientificCertificationStatus: "not-claimed";
  wcagCertificationStatus: "not-claimed";
  onlineAssetCompletenessStatus: "not-claimed";
  kerrKernelMutation: "not-applied";
  trustedBoundary: string;
};

export type AtlasCloseupVisualFidelityVersion = "v76-closeup-visual-fidelity-pass";

export type AtlasCloseupAssetPolicy = "v76-local-hd-planets-existing-source-audited";

export type AtlasCloseupVisualFidelitySummary = {
  version: AtlasCloseupVisualFidelityVersion;
  status: "informational";
  assetPolicy: AtlasCloseupAssetPolicy;
  backgroundOrbitArtVersion: "v69-legacy-8k-sky-restore";
  backgroundGuardVersion: "v71-background-regression-guard";
  materialProfileVersion: "v72-material-profile-contract";
  physicsBenchmarkGateVersion: "v75-physics-benchmark-release-gate";
  visualTarget: "earth-saturn-sun-jupiter-closeup-fidelity";
  textureSourcePolicy: "local-hd-v49-v55-solarsystemscope-cc-by-4";
  runtimeAssetPolicy: "local-public-textures-only";
  earthProfileId: "earth-v76-hd-cloud-night-terminator";
  saturnProfileId: "saturn-v76-cassini-ring-occlusion";
  sunProfileId: "sun-v76-limb-granulation-bloom-restraint";
  jupiterProfileId: "jupiter-v76-band-microcontrast";
  protectedSkyManifest: "orbit-atlas-v9";
  skyAssetMutation: "not-applied";
  physicsMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  artisticCertificationStatus: "not-claimed";
  scientificCertificationStatus: "not-claimed";
  wcagCertificationStatus: "not-claimed";
  onlineAssetCompletenessStatus: "not-claimed";
  fullReleaseGateStatus: "product-ready-scientific-horizons-blocked";
  auditedTextureFamilies: readonly string[];
  trustedBoundary: string;
};

export type AtlasBodyPreviewProfile = {
  bodyId: string;
  renderProfile: AtlasBodyPreviewRenderProfile;
  texturePolicy: AtlasBodyPreviewTexturePolicy;
  ringState: AtlasBodyPreviewRingState;
  cloudNightCue: "earth-cloud-night-cue" | "no-cloud-night-cue";
  solarCue: "solar-granulation-preview" | "no-solar-cue";
};

export type AtlasCloseupPresentationTruthSummary = {
  version: AtlasCloseupPresentationTruthVersion;
  backgroundOrbitArtVersion: AtlasBackgroundOrbitArtVersion;
  status: "informational";
  previewSyncTarget: "selected-body-sidebar-preview";
  defaultPreviewSyncStatus: AtlasCloseupPreviewSyncStatus;
  defaultReviewMode: "standard";
  sceneReviewMode: "scene-review";
  solarBackdropProfile: "solar-clean-negative-space";
  planetReadabilityProfile: "body-specific-closeup-readable";
  backgroundArtProfile: AtlasBackgroundArtProfile;
  orbitHierarchyProfile: AtlasOrbitHierarchyProfile;
  orbitPerformanceProfile: AtlasOrbitPerformanceProfile;
  orbitMaterialProfile: AtlasOrbitMaterialProfile;
  solarCloseupProfile: AtlasSolarCloseupProfile;
  velocityTrailProfile: AtlasVelocityTrailProfile;
  orbitOcclusionProfile: AtlasOrbitOcclusionProfile;
  supportedPreviewProfiles: readonly AtlasBodyPreviewRenderProfile[];
  supportedTexturePolicies: readonly AtlasBodyPreviewTexturePolicy[];
  supportedRingStates: readonly AtlasBodyPreviewRingState[];
  aaBoundaryPreserved: "v41-aa-boundary-preserved";
  sparseDeepSpaceBoundaryPreserved: "v57-sparse-deep-space-director-preserved";
  planetaryArtBoundaryPreserved: "v55-cinematic-planetary-art-direction-preserved";
  physicsMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  artisticCertificationStatus: "not-claimed";
  scientificCertificationStatus: "not-claimed";
  wcagCertificationStatus: "not-claimed";
  ciCertificationStatus: "not-claimed";
  onlineValidationStatus: "not-claimed";
  onlineAssetCompletenessStatus: "not-claimed";
  universeSandboxCloneStatus: "not-claimed";
  trustedBoundary: string;
};


export type AtlasReleaseArtifactManifestLockVersion =
  "v95-release-artifact-manifest-lock";

export type AtlasReleaseArtifactManifestLockProfile =
  "v95-offline-release-artifact-manifest";

export type AtlasReleaseArtifactManifestLockStatus =
  | "pending-runtime-run"
  | "ready-artifact-manifest-locked"
  | "ready-artifact-manifest-blocked"
  | "ready-release-bundle-indexed";

export type AtlasReleaseArtifactManifestLockClassification =
  | "release-artifact-manifest-pass"
  | "command-matrix-regression"
  | "fixture-artifact-regression"
  | "browser-artifact-regression"
  | "docs-artifact-regression"
  | "rollback-boundary-regression"
  | "protected-mutation-regression"
  | "mixed";

export type AtlasReleaseArtifactManifestLockRowId =
  "v95-lock-release-artifact-manifest";

export type AtlasReleaseArtifactManifestLockAuditId =
  | "v93-release-evidence-lock"
  | "v94-browser-ci-stability-lock"
  | "command-matrix-artifact-lock"
  | "fixture-artifact-lock"
  | "browser-artifact-lock"
  | "docs-artifact-lock"
  | "rollback-boundary-lock"
  | "protected-mutation-lock";

export type AtlasReleaseArtifactManifestLockAuditStatus =
  | "ready"
  | "blocked"
  | "regressed";

export type AtlasReleaseArtifactManifestLockAudit = {
  id: AtlasReleaseArtifactManifestLockAuditId;
  label: string;
  status: AtlasReleaseArtifactManifestLockAuditStatus;
  measured: string;
  expected: string;
  trustedBoundary: string;
};

export type AtlasReleaseArtifactManifestLockRow = {
  id: AtlasReleaseArtifactManifestLockRowId;
  label: string;
  productFullCommand: "npm run verify:atlas:full";
  scientificVerifyCommand: "npm run verify:atlas:scientific";
  releaseEvidenceCommand: "npm run test:atlas:scientific-gate-release-evidence";
  browserCiStabilityCommand: "npm run test:atlas:browser-ci-stability";
  migratedStrictGateCommand: "npm run test:atlas:horizons-scientific-gate";
  legacyV75AuditCommand: "npm run test:atlas:horizons-scientific-gate:legacy-v75";
  maintenanceRunbookCommand: "npm run test:atlas:scientific-gate-runbook";
  provenanceFreezeCommand: "npm run test:atlas:horizons-provenance-freeze";
  offlineRuntimeBoundaryCommand: "npm run test:atlas:offline-runtime-boundary";
  browserFreshCommand: "npm run test:atlas:browser:fresh";
  freshBrowserPort: 3015;
  v93ScreenshotGlob: "test-results/v93-scientific-gate-release-evidence-lock/**/*.png";
  v94ScreenshotGlob: "test-results/v94-browser-ci-stability-lock/**/*.png";
  migratedFixturePath: "public/data/horizons-validation-j2000-outer-system-barycenter-v84.json";
  migratedFixtureSha256: "0610A69D32B0BEAB829C70AEC7034CA0E45ADF420631A5FC13B9E0E2EE58D62D";
  migratedFixtureSizeBytes: 21863;
  migratedFixtureVariant: "v84-outer-system-barycenter-reference";
  migratedTargetProvenanceRows: 12;
  legacyFixturePath: "public/data/horizons-validation-j2000.json";
  legacyFixtureSha256: "7ACFF5ED1BEB284CF40DFE905B60ACFDE009E5EE5CE1787085353BD03DA5FD1B";
  legacyFixtureSizeBytes: 14678;
  rollbackInterpretation: "legacy-v75-rollback-blocker-evidence-only";
  status: "not-run" | "complete" | "blocked";
  releaseEvidenceStatus: "not-run" | "pass" | "fail";
  browserCiStabilityStatus: "not-run" | "pass" | "fail";
  commandMatrixStatus: "not-run" | "pass" | "fail";
  fixtureArtifactStatus: "not-run" | "pass" | "fail";
  browserArtifactStatus: "not-run" | "pass" | "fail";
  docsArtifactStatus: "not-run" | "pass" | "fail";
  rollbackBoundaryStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
  releaseArtifactManifestLock: "applied-contract-only";
};

export type AtlasReleaseArtifactManifestLockSummary = {
  version: AtlasReleaseArtifactManifestLockVersion;
  artifactManifestProfile: AtlasReleaseArtifactManifestLockProfile;
  status: AtlasReleaseArtifactManifestLockStatus;
  classification: AtlasReleaseArtifactManifestLockClassification;
  manifestRowCount: number;
  completedManifestRowCount: number;
  audits: readonly AtlasReleaseArtifactManifestLockAudit[];
  manifestRows: readonly AtlasReleaseArtifactManifestLockRow[];
  readyManifestRowId: AtlasReleaseArtifactManifestLockRowId | "";
  productFullCommand: "npm run verify:atlas:full";
  scientificVerifyCommand: "npm run verify:atlas:scientific";
  releaseEvidenceCommand: "npm run test:atlas:scientific-gate-release-evidence";
  browserCiStabilityCommand: "npm run test:atlas:browser-ci-stability";
  browserFreshCommand: "npm run test:atlas:browser:fresh";
  freshBrowserPort: 3015;
  v93ScreenshotGlob: "test-results/v93-scientific-gate-release-evidence-lock/**/*.png";
  v94ScreenshotGlob: "test-results/v94-browser-ci-stability-lock/**/*.png";
  migratedDefaultFixturePath: "public/data/horizons-validation-j2000-outer-system-barycenter-v84.json";
  legacyV75FixturePath: "public/data/horizons-validation-j2000.json";
  migratedFixtureSha256: "0610A69D32B0BEAB829C70AEC7034CA0E45ADF420631A5FC13B9E0E2EE58D62D";
  legacyFixtureSha256: "7ACFF5ED1BEB284CF40DFE905B60ACFDE009E5EE5CE1787085353BD03DA5FD1B";
  rollbackInterpretation: "legacy-v75-rollback-blocker-evidence-only";
  releaseArtifactManifestLock: "applied-contract-only";
  livePhysicsMutation: "not-applied";
  workerPhysicsMutation: "not-applied";
  rk4DefaultMutation: "not-applied";
  eihOnePnMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  skyAssetMutation: "not-applied";
  backgroundMutation: "not-applied";
  materialMutation: "not-applied";
  fixtureDataMutation: "not-applied";
  budgetMutation: "not-applied";
  defaultGateConfigMutation: "not-applied";
  releasePackagingMutation: "not-applied";
  certificationClaimMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  scientificCertificationStatus: "release-artifact-manifest-lock-not-nasa-jpl-certified";
  trustedBoundary: string;
};


export type AtlasArtPolishVersion = "v99-art-polish";

export type AtlasArtPolishProfile = "v99-gaia-overlay-closeup-presentation-polish";

export type AtlasArtPolishStatus =
  | "pending-runtime-run"
  | "ready-art-polish-locked"
  | "ready-art-polish-blocked"
  | "ready-presentation-layer-budgeted";

export type AtlasArtPolishClassification =
  | "art-polish-pass"
  | "gaia-layer-regression"
  | "constellation-layer-regression"
  | "nebula-layer-regression"
  | "closeup-readability-regression"
  | "mobile-budget-regression"
  | "v9-sky-boundary-regression"
  | "protected-mutation-regression"
  | "docs-surface-regression"
  | "mixed";

export type AtlasArtPolishRowId = "v99-lock-art-polish";

export type AtlasArtPolishAuditId =
  | "gaia-layer-lock"
  | "constellation-layer-lock"
  | "nebula-layer-lock"
  | "closeup-readability-lock"
  | "mobile-budget-lock"
  | "v9-sky-boundary-lock"
  | "docs-surface-lock"
  | "protected-mutation-lock";

export type AtlasArtPolishAuditStatus = "ready" | "blocked" | "regressed";

export type AtlasArtPolishAudit = {
  id: AtlasArtPolishAuditId;
  label: string;
  status: AtlasArtPolishAuditStatus;
  measured: string;
  expected: string;
  trustedBoundary: string;
};

export type AtlasArtPolishOpacityCaps = {
  mobile: 0.62;
  balanced: 1.05;
  dense: 1.2;
  closeup: 0.18;
};

export type AtlasArtPolishRow = {
  id: AtlasArtPolishRowId;
  label: string;
  status: "not-run" | "complete" | "blocked";
  gaiaLayerStatus: "not-run" | "pass" | "fail";
  constellationLayerStatus: "not-run" | "pass" | "fail";
  nebulaLayerStatus: "not-run" | "pass" | "fail";
  closeupReadabilityStatus: "not-run" | "pass" | "fail";
  mobileBudgetStatus: "not-run" | "pass" | "fail";
  v9SkyBoundaryStatus: "not-run" | "pass" | "fail";
  docsSurfaceStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
  artPolish: "applied-presentation-layer-only";
};

export type AtlasArtPolishSummary = {
  version: AtlasArtPolishVersion;
  artPolishProfile: AtlasArtPolishProfile;
  status: AtlasArtPolishStatus;
  classification: AtlasArtPolishClassification;
  opacityCaps: AtlasArtPolishOpacityCaps;
  gaiaRenderBudget: AtlasGaiaStarfieldEnhancementBudget;
  gaiaEnhancementVersion: AtlasGaiaStarfieldEnhancementVersion;
  relativityOptimizationVersion: AtlasRelativitySimulationOptimizationVersion;
  rowCount: number;
  completedRowCount: number;
  audits: readonly AtlasArtPolishAudit[];
  rows: readonly AtlasArtPolishRow[];
  readyRowId: AtlasArtPolishRowId | "";
  constellationLinePolicy: "lighter-overview-closeup-mobile-density";
  nebulaMarkerPolicy: "overview-enhanced-closeup-mobile-restrained";
  closeupReadabilityPolicy: "selected-body-background-deemphasized";
  mobileDensityPolicy: "mobile-label-line-nebula-density-restrained";
  officialCertificationPolicy: "not-nasa-jpl-gaia-universe-sandbox-certified";
  artPolish: "applied-presentation-layer-only";
  livePhysicsMutation: "not-applied";
  workerPhysicsMutation: "not-applied";
  rk4DefaultMutation: "not-applied";
  eihOnePnMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  skyAssetMutation: "not-applied";
  backgroundMutation: "not-applied";
  v9SkyDirectionMutation: "not-applied";
  materialMutation: "not-applied";
  fixtureDataMutation: "not-applied";
  budgetMutation: "not-applied";
  defaultGateConfigMutation: "not-applied";
  releasePackagingMutation: "not-applied";
  certificationClaimMutation: "not-applied";
  trustedBoundary: string;
};


export type AtlasPresentationRuntimePerformanceVersion =
  "v103-presentation-runtime-performance-lock";

export type AtlasPresentationRuntimePerformanceProfile =
  "v103-gaia-constellation-label-runtime-cost";

export type AtlasPresentationRuntimePerformanceStatus =
  | "pending-runtime-run"
  | "ready-presentation-runtime-performance-locked"
  | "ready-presentation-runtime-performance-blocked"
  | "ready-presentation-runtime-optimized";

export type AtlasPresentationRuntimePerformanceClassification =
  | "presentation-runtime-performance-pass"
  | "v102-regression"
  | "gaia-runtime-regression"
  | "constellation-runtime-regression"
  | "label-runtime-regression"
  | "budget-threshold-regression"
  | "docs-surface-regression"
  | "protected-mutation-regression"
  | "mixed";

export type AtlasPresentationRuntimePerformanceRowId =
  "v103-lock-presentation-runtime-performance";

export type AtlasPresentationRuntimePerformanceAuditId =
  | "v102-maintenance-evidence-index"
  | "gaia-runtime-lock"
  | "constellation-runtime-lock"
  | "label-runtime-lock"
  | "budget-threshold-lock"
  | "docs-surface-lock"
  | "protected-mutation-lock";

export type AtlasPresentationRuntimePerformanceAuditStatus =
  | "ready"
  | "blocked"
  | "regressed";

export type AtlasPresentationRuntimePerformanceAudit = {
  id: AtlasPresentationRuntimePerformanceAuditId;
  label: string;
  status: AtlasPresentationRuntimePerformanceAuditStatus;
  measured: string;
  expected: string;
  trustedBoundary: string;
};

export type AtlasPresentationRuntimePerformanceRow = {
  id: AtlasPresentationRuntimePerformanceRowId;
  label: string;
  status: "not-run" | "complete" | "blocked";
  v102Status: "not-run" | "pass" | "fail";
  gaiaRuntimeStatus: "not-run" | "pass" | "fail";
  constellationRuntimeStatus: "not-run" | "pass" | "fail";
  labelRuntimeStatus: "not-run" | "pass" | "fail";
  budgetThresholdStatus: "not-run" | "pass" | "fail";
  docsSurfaceStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
  presentationRuntimePerformance: "applied-presentation-runtime-cost-only";
};

export type AtlasPresentationRuntimePerformanceSummary = {
  version: AtlasPresentationRuntimePerformanceVersion;
  presentationRuntimePerformanceProfile: AtlasPresentationRuntimePerformanceProfile;
  status: AtlasPresentationRuntimePerformanceStatus;
  classification: AtlasPresentationRuntimePerformanceClassification;
  maintenanceEvidenceIndexVersion: AtlasMaintenanceEvidenceIndexVersion;
  rowCount: number;
  completedRowCount: number;
  audits: readonly AtlasPresentationRuntimePerformanceAudit[];
  rows: readonly AtlasPresentationRuntimePerformanceRow[];
  readyRowId: AtlasPresentationRuntimePerformanceRowId | "";
  focusedCommand: "npm run test:atlas:presentation-runtime-performance";
  presentationRuntimeVerifyCommand: "npm run verify:atlas:presentation-runtime";
  maintenanceEvidenceVerifyCommand: "npm run verify:atlas:maintenance-evidence";
  gaiaRuntimePolicy: "gaia-uniform-write-dedupe-static-instance-attributes";
  constellationRuntimePolicy: "constellation-frame-signature-material-write-dedupe";
  labelRuntimePolicy: "label-dom-visible-style-write-dedupe";
  budgetThresholdPolicy: "v97-v99-v75-browser-thresholds-preserved";
  presentationRuntimePerformance: "applied-presentation-runtime-cost-only";
  browserAcceptanceCostMutation: "not-applied";
  runtimePerformanceMutation: "not-applied";
  livePhysicsMutation: "not-applied";
  workerPhysicsMutation: "not-applied";
  rk4DefaultMutation: "not-applied";
  eihOnePnMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  skyAssetMutation: "not-applied";
  backgroundMutation: "not-applied";
  v9SkyDirectionMutation: "not-applied";
  materialMutation: "not-applied";
  fixtureDataMutation: "not-applied";
  budgetMutation: "not-applied";
  defaultGateConfigMutation: "not-applied";
  releasePackagingMutation: "not-applied";
  certificationClaimMutation: "not-applied";
  trustedBoundary: string;
};


export type AtlasInteractionVisualQualityVersion =
  "v109-interaction-visual-quality-lock";

export type AtlasInteractionVisualQualityProfile =
  "v109-launch-camera-gaia-material-quality";

export type AtlasInteractionVisualQualityStatus =
  | "pending-runtime-run"
  | "ready-interaction-visual-quality-locked"
  | "ready-interaction-visual-quality-blocked"
  | "ready-launch-camera-gaia-material-upgraded";

export type AtlasInteractionVisualQualityClassification =
  | "interaction-visual-quality-pass"
  | "v108-regression"
  | "camera-freedom-regression"
  | "launch-camera-regression"
  | "launch-visual-regression"
  | "stellar-material-regression"
  | "docs-surface-regression"
  | "protected-mutation-regression"
  | "mixed";

export type AtlasInteractionVisualQualityAuditId =
  | "v108-interaction-repair-launch-ux"
  | "camera-freedom-lock"
  | "launch-camera-lock"
  | "launch-visual-lock"
  | "stellar-material-lock"
  | "docs-surface-lock"
  | "protected-mutation-lock";

export type AtlasInteractionVisualQualityAudit = {
  id: AtlasInteractionVisualQualityAuditId;
  label: string;
  status: "ready" | "blocked" | "regressed";
  measured: string;
  expected: string;
  trustedBoundary: string;
};

export type AtlasInteractionVisualQualityRow = {
  id: "v109-lock-interaction-visual-quality";
  label: string;
  status: "not-run" | "complete" | "blocked";
  v108Status: "not-run" | "pass" | "fail";
  cameraFreedomStatus: "not-run" | "pass" | "fail";
  launchCameraStatus: "not-run" | "pass" | "fail";
  launchVisualStatus: "not-run" | "pass" | "fail";
  stellarMaterialStatus: "not-run" | "pass" | "fail";
  docsSurfaceStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
};

export type AtlasInteractionVisualQualitySummary = {
  version: AtlasInteractionVisualQualityVersion;
  profile: AtlasInteractionVisualQualityProfile;
  status: AtlasInteractionVisualQualityStatus;
  classification: AtlasInteractionVisualQualityClassification;
  interactionRepairLaunchUxVersion: AtlasInteractionRepairLaunchUxVersion;
  cameraFreedomPolicy: "target-follow-user-orbit-override";
  launchCameraPolicy: "auto-follow-manual-orbit-restore-follow";
  launchVisualPolicy: "procedural-budget-rocket-satellite-no-physics-mutation";
  stellarMaterialPolicy: "gaia-bp-rp-gmag-parallax-presentation-material";
  gaiaBudgetPolicy: "v97-1000-1800-3000-preserved";
  focusedCommand: "npm run test:atlas:interaction-visual-quality";
  verifyCommand: "npm run verify:atlas:interaction-visual-quality";
  screenshotArtifactDirectory: "test-results/v109-interaction-visual-quality-lock/";
  audits: readonly AtlasInteractionVisualQualityAudit[];
  rows: readonly AtlasInteractionVisualQualityRow[];
  readyRowId: "v109-lock-interaction-visual-quality" | "";
  livePhysicsMutation: "not-applied";
  workerPhysicsMutation: "not-applied";
  rk4DefaultMutation: "not-applied";
  eihOnePnMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  fixtureDataMutation: "not-applied";
  skyAssetMutation: "not-applied";
  v9SkyDirectionMutation: "not-applied";
  gaiaRenderBudgetMutation: "not-applied";
  gaiaOpacityCapMutation: "not-applied";
  releasePackagingMutation: "not-applied";
  stagingMutation: "not-applied";
  commitMutation: "not-applied";
  trustedBoundary: string;
};


export type AtlasCameraStellarCloseupVersion =
  "v111-camera-stellar-closeup-lock";

export type AtlasCameraStellarCloseupProfile =
  "v111-camera-rig-stellar-portrait-closeup";

export type AtlasCameraStellarCloseupStatus =
  | "pending-runtime-run"
  | "ready-camera-stellar-closeup-locked"
  | "ready-camera-stellar-closeup-blocked";

export type AtlasCameraStellarCloseupClassification =
  | "camera-stellar-closeup-pass"
  | "v110-regression"
  | "camera-rig-regression"
  | "stellar-portrait-regression"
  | "closeup-performance-regression"
  | "protected-mutation-regression"
  | "mixed";

export type AtlasCameraStellarCloseupAuditId =
  | "v110-critical-ui-relativity-visibility"
  | "camera-rig-lock"
  | "stellar-portrait-lock"
  | "closeup-performance-lock"
  | "protected-mutation-lock";

export type AtlasCameraStellarCloseupAudit = {
  id: AtlasCameraStellarCloseupAuditId;
  label: string;
  status: "ready" | "blocked" | "regressed";
  measured: string;
  expected: string;
  trustedBoundary: string;
};

export type AtlasCameraStellarCloseupRow = {
  id: "v111-lock-camera-stellar-closeup";
  label: string;
  status: "not-run" | "complete" | "blocked";
  v110Status: "not-run" | "pass" | "fail";
  cameraRigStatus: "not-run" | "pass" | "fail";
  stellarPortraitStatus: "not-run" | "pass" | "fail";
  closeupPerformanceStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
};

export type AtlasCameraStellarCloseupSummary = {
  version: AtlasCameraStellarCloseupVersion;
  profile: AtlasCameraStellarCloseupProfile;
  status: AtlasCameraStellarCloseupStatus;
  classification: AtlasCameraStellarCloseupClassification;
  criticalUiRelativityVisibilityVersion: AtlasCriticalUiRelativityVisibilityVersion;
  cameraRigPolicy: "target-anchor-user-orbit-distance-state";
  focusExitPolicy: "body-gaia-local-star-escape-passport-reset-clear";
  stellarPortraitPolicy: "gaia-derived-offline-curated-presentation-portrait";
  closeupPerformancePolicy: "selected-closeup-nonessential-layer-suppression";
  gaiaBudgetPolicy: "v97-1000-1800-3000-preserved";
  focusedCommand: "npm run test:atlas:camera-stellar-closeup";
  verifyCommand: "npm run verify:atlas:camera-stellar-closeup";
  screenshotArtifactDirectory: "test-results/v111-camera-stellar-closeup-lock/";
  audits: readonly AtlasCameraStellarCloseupAudit[];
  rows: readonly AtlasCameraStellarCloseupRow[];
  readyRowId: "v111-lock-camera-stellar-closeup" | "";
  livePhysicsMutation: "not-applied";
  workerPhysicsMutation: "not-applied";
  rk4DefaultMutation: "not-applied";
  eihOnePnMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  fixtureDataMutation: "not-applied";
  skyAssetMutation: "not-applied";
  v9SkyDirectionMutation: "not-applied";
  gaiaRenderBudgetMutation: "not-applied";
  gaiaOpacityCapMutation: "not-applied";
  stagingMutation: "not-applied";
  commitMutation: "not-applied";
  trustedBoundary: string;
};

export type AtlasVisualLaunchPerformanceVersion =
  "v114-visual-launch-performance-lock";

export type AtlasVisualLaunchPerformanceProfile =
  "v114-scene-director-runtime-quality";

export type AtlasVisualLaunchPerformanceStatus =
  | "pending-runtime-run"
  | "ready-visual-launch-performance-locked"
  | "ready-visual-launch-performance-blocked";

export type AtlasVisualLaunchPerformanceClassification =
  | "visual-launch-performance-pass"
  | "v113-regression"
  | "visible-copy-regression"
  | "launch-director-regression"
  | "runtime-quality-regression"
  | "openrocket-boundary-regression"
  | "browser-qa-regression"
  | "protected-mutation-regression"
  | "mixed";

export type AtlasVisualLaunchPerformanceAuditId =
  | "v113-scientific-model-upgrade-contract"
  | "visible-copy-lock"
  | "launch-sequence-director-lock"
  | "runtime-quality-governor-lock"
  | "openrocket-offline-bridge-lock"
  | "browser-qa-marker-lock"
  | "protected-mutation-lock";

export type AtlasVisualLaunchPerformanceAudit = {
  id: AtlasVisualLaunchPerformanceAuditId;
  label: string;
  status: "ready" | "blocked" | "regressed";
  measured: string;
  expected: string;
  trustedBoundary: string;
};

export type AtlasVisualLaunchPerformanceRow = {
  id: "v114-lock-visual-launch-performance";
  label: string;
  status: "not-run" | "complete" | "blocked";
  v113Status: "not-run" | "pass" | "fail";
  visibleCopyStatus: "not-run" | "pass" | "fail";
  launchDirectorStatus: "not-run" | "pass" | "fail";
  runtimeQualityStatus: "not-run" | "pass" | "fail";
  openRocketStatus: "not-run" | "pass" | "fail";
  browserQaStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
};

export type AtlasVisualLaunchPerformanceSummary = {
  version: AtlasVisualLaunchPerformanceVersion;
  profile: AtlasVisualLaunchPerformanceProfile;
  status: AtlasVisualLaunchPerformanceStatus;
  classification: AtlasVisualLaunchPerformanceClassification;
  scientificModelUpgradeContractVersion: AtlasScientificModelUpgradeContractVersion;
  qualityTier: AtlasRuntimeQualityTier;
  launchDirectorPolicy: "prelaunch-liftoff-maxq-staging-coast-deploy";
  runtimeQualityPolicy: "presentation-only-quality-tier-scheduling";
  launchScenePerformancePolicy: "no-per-frame-dom-query-reuse-three-temporaries";
  openRocketBridgePolicy: "offline-import-no-browser-exe-launch";
  telemetryProviderPolicy: "local-default-websocket-optional";
  stellarCloseupPolicy: "gaia-derived-portrait-preserved-no-surface-resolution-claim";
  budgetPolicy: "v75-v97-v99-budgets-preserved";
  focusedCommand: "npm run test:atlas:visual-launch-performance";
  verifyCommand: "npm run verify:atlas:visual-launch-performance";
  screenshotArtifactDirectory: "test-results/v114-visual-launch-performance-lock/";
  audits: readonly AtlasVisualLaunchPerformanceAudit[];
  rows: readonly AtlasVisualLaunchPerformanceRow[];
  readyRowId: "v114-lock-visual-launch-performance" | "";
  livePhysicsMutation: "not-applied";
  workerPhysicsMutation: "not-applied";
  rk4DefaultMutation: "not-applied";
  eihOnePnMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  fixtureDataMutation: "not-applied";
  skyAssetMutation: "not-applied";
  v9SkyDirectionMutation: "not-applied";
  gaiaRenderBudgetMutation: "not-applied";
  gaiaOpacityCapMutation: "not-applied";
  browserExeLaunch: "not-applied";
  guiAutomationMutation: "not-applied";
  stagingMutation: "not-applied";
  commitMutation: "not-applied";
  trustedBoundary: string;
};

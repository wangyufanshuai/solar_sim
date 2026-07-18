import type { GaiaCatalogSource } from "../data/gaiaStarCatalog";

export type ResearchConfidence = "visual" | "diagnostic" | "validated";
export type GaiaKinematicsCatalogSource = "gaia-dr3-kinematics" | "unavailable";
export type GalacticValidationStatus = "pending" | "ready" | "failed";
export type CosmologyModelPresetId = "planck2018-flat-lcdm";
export type CosmologyModelSource = "planck-2018";
export type CosmologyValidationStatus = "ready" | "failed";
export type CosmologyConfidence = "formula-checked";
export type StrongFieldValidationStatus = "ready" | "failed";
export type RelativityKernelId = "eih-1pn+kerr-geodesic-v17";
export type MetricFamily = "schwarzschild" | "kerr";
export type GeodesicKind = "timelike" | "null";
export type KerrGeodesicRenderMode = "geodesic-tracks" | "teaching-particles" | "both";
export type KerrRelativityStudioVersion = "v35-kerr-relativity-studio";
export type KerrRelativityStudioMode = "overview" | "probe" | "isco" | "error" | "boundary";
export type KerrOrbitPresetId =
  | "photon-ring-demo"
  | "isco-comparison"
  | "capture-cone"
  | "wide-deflection"
  | "frame-drag-split";
export type GeodesicTrackKind =
  | "photon-sphere"
  | "isco"
  | "capture"
  | "escape"
  | "kerr-prograde"
  | "kerr-retrograde"
  | "probe-null";
export type KerrGeodesicTrackKind = GeodesicTrackKind;
export type GeodesicClassification =
  | "bounded"
  | "captured"
  | "escaped"
  | "turning-point"
  | "max-steps"
  | "failed";
export type KerrProbeStatus = "capture" | "scatter" | "escape" | "failed";
export type RelativityConfidence =
  | "visual"
  | "formula-checked"
  | "horizons-checked"
  | "validated";

export type EvidenceLedgerVersion = "v20-evidence-ledger" | "v21-claim-passports";
export type EvidenceClaimStatus = "ready" | "pending" | "failed" | "informational";
export type EvidenceClaimConfidence =
  | "visual"
  | "formula-checked"
  | "catalog-backed"
  | "horizons-checked"
  | "validated";
export type EvidenceClaimGroup =
  | "orbit-visual-layer"
  | "mission-capsule-reproducibility"
  | "scientific-report-dossier"
  | "validation-console-readiness"
  | "observatory-deck-workbench"
  | "performance-budget-readiness"
  | "release-candidate-gate"
  | "relativity-observable-atlas"
  | "relativity-observable-explainer"
  | "relativity-guided-tour"
  | "relativity-verification-readability"
  | "relativity-verification-charts"
  | "physics-benchmark-release-gate"
  | "horizons-gate-closure-audit"
  | "physics-gate-split"
  | "release-readiness-documentation"
  | "scientific-gate-preflight"
  | "horizons-residual-decomposition"
  | "horizons-candidate-lab"
  | "pluto-residual-isolation"
  | "outer-system-force-model-preflight"
  | "outer-system-reference-adoption"
  | "horizons-candidate-scientific-gate"
  | "strict-horizons-migration-dry-run"
  | "strict-horizons-shadow-migration-gate"
  | "default-strict-horizons-migration"
  | "horizons-provenance-freeze"
  | "offline-runtime-boundary-audit"
  | "scientific-gate-maintenance-runbook"
  | "scientific-gate-release-evidence"
  | "browser-ci-stability-lock"
  | "release-artifact-manifest-lock"
  | "final-maintenance-baseline"
  | "gaia-starfield-enhancement"
  | "relativity-simulation-optimization"
  | "art-polish"
  | "post-enhancement-maintenance-baseline"
  | "browser-resource-performance-lock"
  | "maintenance-evidence-index"
  | "presentation-runtime-performance-lock"
  | "browser-acceptance-runtime-cost-lock"
  | "final-gaia-art-enhancement-lock"
  | "release-candidate-evidence-closure-lock"
  | "interaction-catalog-completion-lock"
  | "interaction-repair-launch-ux-lock"
  | "interaction-visual-quality-lock"
  | "critical-ui-relativity-visibility-lock"
  | "camera-stellar-closeup-lock"
  | "launch-gameplay-openrocket-bridge-lock"
  | "scientific-model-upgrade-contract"
  | "visual-launch-performance-lock"
  | "browser-acceptance-harness"
  | "accessibility-workbench"
  | "cinematic-visual-system"
  | "planetary-visual-fidelity"
  | "cinematic-lighting"
  | "chinese-deep-space-fidelity"
  | "cinematic-deep-space-camera"
  | "universe-sandbox-reference-backdrop"
  | "reference-grade-space-art"
  | "planetary-material-composition"
  | "cinematic-closeup-director"
  | "cinematic-key-light-director"
  | "planetary-depth-lighting"
  | "planetary-color-grading"
  | "numerical-integrity-gate"
  | "cinematic-planetary-art-direction"
  | "cinematic-deep-space-backdrop"
  | "sparse-deep-space-director"
  | "closeup-presentation-truth"
  | "closeup-visual-fidelity"
  | "solar-eih-1pn"
  | "gr-weak-field"
  | "gaia-catalog"
  | "celestial-catalog-atlas"
  | "galactic-dynamics"
  | "frw-cosmology"
  | "kerr-strong-field";

export type CelestialCatalogVersion = "v22-celestial-catalog-atlas";
export type CelestialObjectPassportVersion = "v23-object-passports";
export type CelestialDeepSkyNavigationVersion = "v33-deep-sky-navigation";
export type CelestialObjectKind =
  | "nearby-star"
  | "bright-star"
  | "nebula"
  | "star-cluster"
  | "galaxy"
  | "pulsar"
  | "constellation";
export type CelestialCatalogSource =
  | "curated-local-v22"
  | "gaia-dr3"
  | "iau-constellation-lines"
  | "messier-ngc-curated";

export type CelestialCatalogEntry = {
  id: string;
  sourceId: string;
  kind: CelestialObjectKind;
  source: CelestialCatalogSource;
  primaryName: string;
  catalogName: string;
  subtitle: string;
  color: string;
  raHours: number | null;
  decDeg: number | null;
  galLonDeg: number | null;
  galLatDeg: number | null;
  distancePc: number | null;
  magV: number | null;
  angularSizeArcmin: number | null;
  metadata: string;
  searchText: string;
  labelPriority: number | null;
  boundary: string;
};

export type CelestialCatalogSummary = {
  version: CelestialCatalogVersion;
  entryCount: number;
  entries: readonly CelestialCatalogEntry[];
  kindBreakdown: Record<CelestialObjectKind, number>;
  sourceBreakdown: Record<CelestialCatalogSource, number>;
  coordinateFrames: readonly string[];
  qualityChecks: {
    uniqueIds: boolean;
    finiteCoordinates: boolean;
    constellationCount: number;
  };
  trustedBoundary: string;
};

export type CelestialVisualLayerSummary = {
  version: CelestialDeepSkyNavigationVersion;
  selectedId: string;
  selectedKind: CelestialObjectKind | "";
  selectedTitle: string;
  catalogCount: number;
  labelCount: number;
  maxLabelCount: number;
  deepSkyCount: number;
  kindBreakdown: Record<CelestialObjectKind, number>;
  layerState: string;
  showConstellations: boolean;
  showDeepSkyObjects: boolean;
  showCatalogLabels: boolean;
  orbitAtlas: boolean;
  mobile: boolean;
  labelBudgetSource: string;
  trustedBoundary: string;
};

export type AtlasPerformanceBudgetVersion = "v34-performance-budget";
export type AtlasPerformanceTier = "mobile-safe" | "balanced" | "dense" | "diagnostic";
export type AtlasRenderStabilityStatus = "ready" | "warming" | "fallback" | "constrained";

export type AtlasPerformanceRecommendation = {
  id: string;
  severity: "info" | "warning";
  title: string;
  detail: string;
};

export type AtlasPerformanceBudgetSummary = {
  version: AtlasPerformanceBudgetVersion;
  tier: AtlasPerformanceTier;
  renderStability: AtlasRenderStabilityStatus;
  presentationMode: string;
  scaleMode: string;
  renderBudget: string;
  recommendedRenderBudget: string;
  viewportWidth: number;
  devicePixelRatio: number;
  mobile: boolean;
  deepSkyEnabled: boolean;
  catalogLabelsEnabled: boolean;
  catalogLabelCount: number;
  deepSkyLabelBudget: number;
  kerrVisible: boolean;
  workbenchOpen: boolean;
  readinessFallback: boolean;
  visualEnhance: boolean;
  recommendationCount: number;
  recommendations: readonly AtlasPerformanceRecommendation[];
  primaryMetric: string;
  trustedBoundary: string;
};

export type AtlasReleaseGateVersion = "v36-release-candidate-gate";

export type AtlasBrowserAcceptanceVersion = "v38-browser-acceptance-harness";

export type AtlasWorkbenchAccessibilityVersion = "v41-atlas-workbench-accessibility";

export type AtlasCinematicWorkbenchVersion = "v42-cinematic-science-workbench";
export type AtlasCinematicWorkbenchSummary = {
  version: AtlasCinematicWorkbenchVersion;
  status: "informational";
  visualTarget: "scientific-instrument-cinematic";
  qualityTarget: "aaa-inspired-local-art-direction";
  aaBoundaryPreserved: "v41-aa-boundary-preserved";
  scope: "presentation-rendering-and-workbench-skin";
  scenePolicy: "existing-assets-only";
  physicsMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  trustedBoundary: string;
};

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

export type AtlasChineseDeepSpaceFidelityVersion = "v45-chinese-deep-space-fidelity";
export type AtlasChineseDeepSpaceFidelitySummary = {
  version: AtlasChineseDeepSpaceFidelityVersion;
  status: "informational";
  uiLanguage: "zh-CN";
  localizationMode: "zh-cn-primary-scientific-ids-preserved";
  visualProfile: "milky-way-constellation-nebula-balanced";
  assetPolicy: "local-runtime-assets";
  runtimeAssetSource: "public-textures-and-curated-local-catalogs";
  featuredLayerCount: 4;
  featuredLayers: readonly ["milky-way", "constellations", "nebulae", "planetary-closeups"];
  aaBoundaryPreserved: "v41-aa-boundary-preserved";
  cinematicBoundaryPreserved: "v42-cinematic-boundary-preserved";
  planetaryBoundaryPreserved: "v43-planetary-visual-fidelity-preserved";
  lightingBoundaryPreserved: "v44-cinematic-lighting-preserved";
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
export type AtlasBackgroundDepthProfile =
  | "overview-sparse-layered-milky-way"
  | "closeup-subject-negative-space"
  | "showcase-reference-depth";
export type AtlasBackgroundSubjectVisibilityProfile =
  | "overview-orbit-readable"
  | "selected-body-in-frame"
  | "showcase-subject-separated";
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
export type AtlasReferenceGradeCompositeProfile =
  | "overview-layered-reference-grade"
  | "selected-body-subject-matte"
  | "showcase-cinematic-deep-space";
export type AtlasReferenceGradeSkyLayerProfile =
  | "v48-local-generated-layered-sky"
  | "v48-local-closeup-negative-space"
  | "v48-local-showcase-milky-way";
export type AtlasReferenceGradeStarfieldProfile =
  | "sparse-primary-stars"
  | "closeup-star-noise-suppressed"
  | "showcase-structured-starfield";
export type AtlasReferenceGradeSubjectMatteProfile =
  | "overview-no-subject-matte"
  | "selected-body-background-matte"
  | "showcase-center-negative-space";
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
export type AtlasSelectedBodyAtmosphereDepthProfile =
  | "overview-atmosphere"
  | "thin-earth-limb-depth"
  | "gas-giant-soft-limb-depth"
  | "solar-edge-controlled-depth"
  | "airless-relief-limb";
export type AtlasSelectedBodyTerminatorProfile =
  | "overview-terminator"
  | "earth-night-cloud-terminator"
  | "gas-band-low-fill-terminator"
  | "solar-limb-darkening"
  | "airless-relief-terminator";
export type AtlasSelectedBodyRingProfile =
  | "no-ring-profile"
  | "saturn-cassini-layered-ring";
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
export type AtlasSelectedBodyKeyLightProfile =
  | "overview-natural-phase"
  | "earth-cloud-night-key-balance"
  | "solar-surface-edge-key"
  | "gas-giant-readable-key-fill"
  | "saturn-ring-key-fill"
  | "lunar-mars-relief-key";
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

export type AtlasNumericalIntegrityVersion = "v54-numerical-integrity-gate";
export type AtlasNumericalIntegrityTrend = "stable" | "watch" | "warning" | "insufficient-data";
export type AtlasNumericalIntegrityStatus = "ready" | "watch" | "warning" | "informational";
export type AtlasNumericalIntegrityCoverage = "covered-by-local-tests-not-runtime-claimed";
export type AtlasNumericalIntegrityBenchmarkId =
  | "mercury-weak-field-drift"
  | "earth-moon-scale-conservation"
  | "two-body-time-reversal"
  | "kerr-numerical-health-boundary";
export type AtlasNumericalIntegrityBenchmarkDescriptor = {
  id: AtlasNumericalIntegrityBenchmarkId;
  title: string;
  model: string;
  source: string;
  expectedSignal: string;
  boundary: string;
};
export type AtlasNumericalIntegritySummary = {
  version: AtlasNumericalIntegrityVersion;
  status: EvidenceClaimStatus;
  integrityStatus: AtlasNumericalIntegrityStatus;
  currentEnergyDrift: number | null;
  currentAngularMomentumDrift: number | null;
  maxEnergyDrift: number | null;
  maxAngularMomentumDrift: number | null;
  energyDriftTrend: AtlasNumericalIntegrityTrend;
  angularMomentumDriftTrend: AtlasNumericalIntegrityTrend;
  energyDriftSlope: number | null;
  angularMomentumDriftSlope: number | null;
  timestepSensitivityCoverage: AtlasNumericalIntegrityCoverage;
  timeReversalCoverage: AtlasNumericalIntegrityCoverage;
  unitAuditCoverage: AtlasNumericalIntegrityCoverage;
  benchmarkDescriptors: readonly AtlasNumericalIntegrityBenchmarkDescriptor[];
  benchmarkCount: number;
  runtimeBenchmarkExecution: "not-run-in-runtime-ui";
  runtimeCertificationStatus: "not-claimed-in-app";
  ciCertificationStatus: "not-claimed";
  scientificCertificationStatus: "not-claimed";
  onlineValidationStatus: "not-claimed";
  physicsMutation: "not-applied";
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
export type AtlasSelectedBodyEarthCloudNightProfile =
  | "overview-no-earth-cloud-night-art"
  | "earth-clean-cloud-night-shadow-art";
export type AtlasSelectedBodySolarSurfaceProfile =
  | "overview-no-solar-surface-art"
  | "solar-granulation-controlled-corona-art";
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
export type AtlasOrbitPerformanceProfile = "closeup-selected-orbit-budget";
export type AtlasOrbitMaterialProfile =
  | "cinematic-depth-aware-hairlines"
  | "v67-layered-depth-orbit-ribbons";
export type AtlasSolarCloseupProfile = "solar-limb-controlled-corona";
export type AtlasVelocityTrailProfile = "selected-log-velocity-three-stop";
export type AtlasOrbitOcclusionProfile = "depth-tested-closeup-fade";
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
export type AtlasBackgroundGuardVersion = "v71-background-regression-guard";
export type AtlasSkyRegressionBudgetProfile = "v71-v69-legacy-blue-dust-budget";
export type AtlasBackgroundGuardSummary = {
  version: AtlasBackgroundGuardVersion;
  status: "informational";
  skyRegressionBudgetProfile: AtlasSkyRegressionBudgetProfile;
  backgroundOrbitArtVersion: "v69-legacy-8k-sky-restore";
  backgroundArtProfile: "v69-legacy-blue-dust-starfield";
  visualStabilityVersion: "v70-visual-stability-material-pass";
  lockedSkyManifest: "orbit-atlas-v9";
  protectedSkyDirection: "legacy-blue-gray-milky-way-dust-lanes-bright-stars";
  regressionGuardTarget: "overview-and-selected-body-background-budget";
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

export type AtlasWorkbenchAccessibilitySurfaceId =
  | "navigator"
  | "atlas-workflows"
  | "relativity-observables"
  | "kerr-relativity-studio"
  | "evidence-ledger"
  | "validation-console"
  | "report-studio"
  | "mission-hub"
  | "observatory-deck";

export type AtlasWorkbenchAccessibilitySummary = {
  version: AtlasWorkbenchAccessibilityVersion;
  status: "informational";
  scope: "atlas-workbench-and-entry-controls";
  standardTarget: "wcag-2.2-aa-target";
  surfaceCount: number;
  surfaces: readonly AtlasWorkbenchAccessibilitySurfaceId[];
  minimumTargetSizePx: 24;
  focusPolicy: "navigator-modal-focus-trap;workbench-nonmodal-focus-entry";
  motionPolicy: "prefers-reduced-motion";
  runtimeAuditStatus: "not-claimed-in-app";
  trustedBoundary: string;
};

export type AtlasBrowserAcceptanceViewport = {
  id: "desktop-chrome-1440x900" | "mobile-chrome-390x844";
  label: string;
  width: number;
  height: number;
};

export type AtlasBrowserAcceptanceSummary = {
  version: AtlasBrowserAcceptanceVersion;
  status: EvidenceClaimStatus;
  command: "npm run test:atlas:browser";
  fullGateCommand: "npm run verify:atlas:full";
  runtimeCommandStatus: "not-claimed-in-app";
  browser: "system-chrome";
  viewportCount: number;
  viewports: readonly AtlasBrowserAcceptanceViewport[];
  checkedContracts: readonly string[];
  primaryMetric: string;
  trustedBoundary: string;
};

export type AtlasReleaseGateSummary = {
  version: AtlasReleaseGateVersion;
  status: AtlasValidationDomainStatus;
  blockerCount: number;
  warningCount: number;
  readyDomainCount: number;
  pendingDomainCount: number;
  failedDomainCount: number;
  informationalDomainCount: number;
  checkedDomainCount: number;
  sourceDomainIds: readonly AtlasValidationDomainId[];
  primaryMetric: string;
  trustedBoundary: string;
};

export type CelestialObjectPassportMetric = {
  id: string;
  label: string;
  value: string;
  status: EvidenceClaimStatus;
};

export type CelestialObjectPassportSection = {
  id:
    | "identity"
    | "source-chain"
    | "coordinates"
    | "observables"
    | "provenance"
    | "trusted-boundary"
    | "related-evidence";
  title: string;
  body: string;
};

export type CelestialObjectPassport = {
  version: CelestialObjectPassportVersion;
  objectId: string;
  title: string;
  kind: CelestialObjectKind;
  source: CelestialCatalogSource;
  catalogName: string;
  subtitle: string;
  color: string;
  sourceChain: readonly string[];
  coordinateFrame: string;
  metrics: readonly CelestialObjectPassportMetric[];
  confidenceRationale: string;
  assumptions: readonly string[];
  limitations: readonly string[];
  relatedEvidenceClaimId: "celestial-catalog-atlas";
  sections: readonly CelestialObjectPassportSection[];
};

export type EvidenceRelatedView =
  | "orbit-analysis"
  | "telemetry"
  | "body-sidebar"
  | "kerr-lab"
  | "atlas-workflows"
  | "relativity-observables"
  | "evidence-ledger";

export type EvidencePassportMetric = {
  id: string;
  label: string;
  value: string;
  target?: string;
  tolerance?: string;
  status: EvidenceClaimStatus;
};

export type EvidencePassportFormula = {
  id: string;
  label: string;
  expression: string;
  variables: string;
  applicability: string;
};

export type EvidencePassportSection = {
  id:
    | "source-chain"
    | "method"
    | "metrics"
    | "confidence"
    | "assumptions"
    | "limitations"
    | "related-views";
  title: string;
  body: string;
};

export type EvidenceClaimPassport = {
  claimId: string;
  sourceChain: readonly string[];
  method: string;
  formulas: readonly EvidencePassportFormula[];
  metrics: readonly EvidencePassportMetric[];
  confidenceRationale: string;
  assumptions: readonly string[];
  limitations: readonly string[];
  relatedViews: readonly EvidenceRelatedView[];
  sections: readonly EvidencePassportSection[];
};

export type EvidenceClaim = {
  id: string;
  group: EvidenceClaimGroup;
  title: string;
  status: EvidenceClaimStatus;
  confidence: EvidenceClaimConfidence;
  source: string;
  model: string;
  metric: string;
  error: string;
  boundary: string;
  passport: EvidenceClaimPassport;
};

export type EvidenceLedgerSummary = {
  version: EvidenceLedgerVersion;
  status: EvidenceClaimStatus;
  claimCount: number;
  readyCount: number;
  failedCount: number;
  groups: readonly EvidenceClaimGroup[];
  claims: readonly EvidenceClaim[];
};

export type AtlasNavigatorVersion = "v24-unified-atlas-navigator";
export type AtlasNavigatorItemKind =
  | "solar-body"
  | "celestial-object"
  | "gaia-star"
  | "evidence-claim"
  | "panel-action";
export type AtlasNavigatorAction =
  | "focus-body"
  | "focus-catalog-object"
  | "focus-gaia-star"
  | "open-object-passport"
  | "open-evidence-claim"
  | "open-panel"
  | "open-exoplanet-system";
export type AtlasNavigatorPanelId =
  | "mission-hub"
  | "observatory-deck"
  | "scientific-report"
  | "validation-console"
  | "atlas-workflows"
  | "evidence-ledger"
  | "kerr-lab"
  | "relativity-observables"
  | "observational-astrophysics"
  | "orbit-analysis"
  | "object-browser"
  | "view-panel"
  | "tools-panel";

export type AtlasNavigatorItem = {
  id: string;
  kind: AtlasNavigatorItemKind;
  action: AtlasNavigatorAction;
  title: string;
  subtitle: string;
  source: string;
  primaryMetric: string;
  actionLabel: string;
  keywords: readonly string[];
  priority: number;
  bodyId?: string;
  bodyIndex?: number;
  catalogObjectId?: string;
  gaiaSourceId?: string;
  exoplanetSystemId?: string;
  evidenceClaimId?: string;
  panelId?: AtlasNavigatorPanelId;
  disabled?: boolean;
  disabledReason?: string;
};

export type AtlasNavigatorSummary = {
  version: AtlasNavigatorVersion;
  query: string;
  itemCount: number;
  resultCount: number;
  selectedDefaultId: string;
  items: readonly AtlasNavigatorItem[];
  results: readonly AtlasNavigatorItem[];
};

export type AtlasWorkflowVersion = "v25-atlas-workflows";
export type AtlasWorkflowId =
  | "solar-validation"
  | "relativity-lab"
  | "relativity-guided-tour"
  | "deep-sky-provenance"
  | "cosmology-validation"
  | "gaia-galactic-context";
export type AtlasWorkflowStepStatus = "ready" | "blocked" | "informational";
export type AtlasWorkflowStepSurface =
  | "body-focus"
  | "orbit-analysis"
  | "evidence-passport"
  | "object-passport"
  | "kerr-lab"
  | "panel";

export type AtlasWorkflowStep = {
  id: string;
  title: string;
  status: AtlasWorkflowStepStatus;
  target: string;
  source: string;
  model: string;
  expectedSurface: AtlasWorkflowStepSurface;
  boundary: string;
  actionLabel: string;
  navigatorItemId?: string;
  navigatorItem?: AtlasNavigatorItem;
  evidenceClaimId?: string;
  catalogObjectId?: string;
  bodyId?: string;
  relativityGuidedTourStepId?: RelativityGuidedTourStep["id"];
  relativityObservableId?: RelativityObservableRow["id"];
  blockedReason?: string;
};

export type AtlasWorkflow = {
  id: AtlasWorkflowId;
  title: string;
  subtitle: string;
  objective: string;
  source: string;
  model: string;
  boundary: string;
  stepCount: number;
  readyStepCount: number;
  blockedStepCount: number;
  steps: readonly AtlasWorkflowStep[];
};

export type AtlasWorkflowSummary = {
  version: AtlasWorkflowVersion;
  workflowCount: number;
  readyStepCount: number;
  blockedStepCount: number;
  selectedDefaultId: AtlasWorkflowId;
  workflows: readonly AtlasWorkflow[];
};

export type AtlasMissionHubVersion = "v26-atlas-mission-hub";
export type AtlasMissionHubItemKind =
  | "solar-body"
  | "celestial-object"
  | "gaia-star"
  | "evidence-claim"
  | "workflow"
  | "workflow-step"
  | "panel-action";

export type AtlasMissionHubStoredItem = {
  id: string;
  kind: AtlasMissionHubItemKind;
  timestamp: number;
};

export type AtlasMissionHubStoredState = {
  recentActions: readonly AtlasMissionHubStoredItem[];
  pinnedItems: readonly AtlasMissionHubStoredItem[];
};

export type AtlasMissionHubContext = {
  currentKind: AtlasMissionHubItemKind | "";
  currentId: string;
  title: string;
  subtitle: string;
  source: string;
  model: string;
  primaryMetric: string;
  boundary: string;
};

export type AtlasMissionHubItem = {
  id: string;
  kind: AtlasMissionHubItemKind;
  title: string;
  subtitle: string;
  source: string;
  model: string;
  primaryMetric: string;
  boundary: string;
  actionLabel: string;
  timestamp?: number;
  pinned: boolean;
  stale: boolean;
  navigatorItemId?: string;
  navigatorItem?: AtlasNavigatorItem;
  workflowId?: AtlasWorkflowId;
  workflowStepId?: string;
};

export type AtlasMissionHubSummary = {
  version: AtlasMissionHubVersion;
  current: AtlasMissionHubContext;
  recentCount: number;
  pinnedCount: number;
  recentItems: readonly AtlasMissionHubItem[];
  pinnedItems: readonly AtlasMissionHubItem[];
  recommendedItems: readonly AtlasMissionHubItem[];
  capsuleRestoreSummary?: AtlasMissionCapsuleRestoreSummary;
};

export type AtlasMissionCapsuleVersion = "v27-mission-capsules";
export type AtlasMissionCapsuleWarningCode =
  | "invalid-json"
  | "invalid-base64"
  | "unsupported-version"
  | "invalid-shape"
  | "stale-id"
  | "invalid-field";

export type AtlasMissionCapsuleWarning = {
  code: AtlasMissionCapsuleWarningCode;
  message: string;
  field?: string;
};

export type AtlasMissionCapsule = {
  version: AtlasMissionCapsuleVersion;
  createdAt: string;
  source: "mission-hub";
  presentation: {
    mode: string;
    scaleMode: string;
    renderBudget: string;
  };
  viewSettings: Record<string, boolean>;
  selected: {
    bodyId?: string;
    catalogObjectId?: string;
    evidenceClaimId?: string;
    workflowId?: AtlasWorkflowId;
    workflowStepId?: string;
  };
  missionHub: AtlasMissionHubStoredState;
  kerrLab: {
    showKerrBlackHole: boolean;
    spinA: number;
    impactParameterM: number;
    orbitPresetId: KerrOrbitPresetId;
    renderMode: KerrGeodesicRenderMode;
    studioMode?: KerrRelativityStudioMode;
  };
};

export type AtlasMissionCapsuleRestoreSummary = {
  version: AtlasMissionCapsuleVersion;
  source: "url-hash" | "json-import" | "copy-link" | "export-json" | "none";
  active: boolean;
  createdAt: string;
  restoredCount: number;
  warningCount: number;
  warnings: readonly AtlasMissionCapsuleWarning[];
};

export type AtlasScientificReportVersion = "v28-scientific-report";
export type AtlasScientificReportFormat = "markdown" | "json";
export type AtlasReportStudioVersion = "v29-report-studio";
export type AtlasReportTemplateId =
  | "mission-dossier"
  | "evidence-audit"
  | "object-brief"
  | "relativity-lab-brief"
  | "catalog-provenance";
export type AtlasReportExportFormat = "markdown" | "json" | "html";
export type AtlasScientificReportSectionId =
  | "session-overview"
  | "mission-capsule"
  | "evidence-claims"
  | "selected-target"
  | "workflow-context"
  | "kerr-lab"
  | "relativity-observables"
  | "trusted-boundaries";
export type AtlasReportSectionId = AtlasScientificReportSectionId | "excluded-state";

export type AtlasScientificReportSection = {
  id: AtlasScientificReportSectionId;
  title: string;
  body: string;
  metrics: readonly EvidencePassportMetric[];
};

export type AtlasScientificReportSummary = {
  version: AtlasScientificReportVersion;
  createdAt: string;
  title: string;
  subtitle: string;
  formatDefault: AtlasScientificReportFormat;
  sectionCount: number;
  evidenceClaimCount: number;
  readyEvidenceCount: number;
  failedEvidenceCount: number;
  selectedEvidenceClaimId: string;
  selectedObjectId: string;
  selectedWorkflowId: string;
  activeWorkflowStepId: string;
  missionCapsuleVersion: AtlasMissionCapsuleVersion;
  missionCapsuleActive: boolean;
  missionCapsuleWarningCount: number;
  kerrLab: {
    showKerrBlackHole: boolean;
    spinA: number;
    impactParameterM: number;
    orbitPresetId: KerrOrbitPresetId;
    renderMode: KerrGeodesicRenderMode;
    studioMode?: KerrRelativityStudioMode;
  };
  relativityObservableAtlas?: {
    version: RelativityObservableAtlasVersion;
    status: EvidenceClaimStatus;
    observableCount: number;
    readyCount: number;
    boundary: string;
  };
  relativityObservableExplainer?: {
    version: RelativityObservableExplainerVersion;
    status: EvidenceClaimStatus;
    cardCount: number;
    totalStepCount: number;
    boundary: string;
  };
  relativityGuidedTour?: {
    version: RelativityGuidedTourVersion;
    status: EvidenceClaimStatus;
    workflowId: AtlasWorkflowId;
    stepCount: number;
    readyCount: number;
    boundary: string;
  };
  planetaryVisualFidelity?: {
    version: AtlasPlanetaryVisualFidelityVersion;
    status: EvidenceClaimStatus;
    visualTarget: string;
    styleTarget: string;
    assetPolicy: string;
    boundary: string;
  };
  cinematicLighting?: {
    version: AtlasCinematicLightingCompositionVersion;
    status: EvidenceClaimStatus;
    visualTarget: string;
    lightingProfile: string;
    postFxProfile: string;
    assetPolicy: string;
    boundary: string;
  };
  chineseDeepSpaceFidelity?: {
    version: AtlasChineseDeepSpaceFidelityVersion;
    status: EvidenceClaimStatus;
    uiLanguage: string;
    localizationMode: string;
    visualProfile: string;
    assetPolicy: string;
    boundary: string;
  };
  cinematicDeepSpaceCamera?: {
    version: AtlasCinematicDeepSpaceCameraVersion;
    status: EvidenceClaimStatus;
    cameraProfile: string;
    skyCompositionProfile: string;
    backgroundNoiseProfile: string;
    qualityBudget: string;
    boundary: string;
  };
  universeSandboxReferenceBackdrop?: {
    version: AtlasUniverseSandboxReferenceBackdropVersion;
    status: EvidenceClaimStatus;
    referenceMode: string;
    backgroundArtDirection: string;
    depthProfile: string;
    subjectVisibilityProfile: string;
    screenshotReview: string;
    boundary: string;
  };
  referenceGradeSpaceArt?: {
    version: AtlasReferenceGradeSpaceArtVersion;
    status: EvidenceClaimStatus;
    artDirection: string;
    compositeProfile: string;
    skyLayerProfile: string;
    starfieldProfile: string;
    subjectMatteProfile: string;
    planetMaterialProfile: string;
    assetPolicy: string;
    reviewMode: string;
    boundary: string;
  };
  planetaryMaterialComposition?: {
    version: AtlasPlanetaryMaterialCompositionVersion;
    status: EvidenceClaimStatus;
    materialTarget: string;
    materialProfile: string;
    atmosphereDepthProfile: string;
    terminatorProfile: string;
    ringProfile: string;
    assetPolicy: string;
    boundary: string;
  };
  cinematicCloseupDirector?: {
    version: AtlasCinematicCloseupDirectorVersion;
    status: EvidenceClaimStatus;
    compositionTarget: string;
    compositionProfile: string;
    panelAvoidanceProfile: string;
    ringShowcaseProfile: string;
    qualityBudget: string;
    assetPolicy: string;
    boundary: string;
  };
  cinematicKeyLightDirector?: {
    version: AtlasCinematicKeyLightDirectorVersion;
    status: EvidenceClaimStatus;
    lightingTarget: string;
    keyLightProfiles: string;
    gasGiantKeyLightProfile: string;
    saturnKeyLightProfile: string;
    qualityBudget: string;
    assetPolicy: string;
    boundary: string;
  };
  planetaryDepthLighting?: {
    version: AtlasPlanetaryDepthLightingVersion;
    status: EvidenceClaimStatus;
    lightingTarget: string;
    depthLightingProfiles: string;
    gasGiantDepthLightingProfile: string;
    saturnDepthLightingProfile: string;
    ringShadowCue: string;
    qualityBudget: string;
    assetPolicy: string;
    boundary: string;
  };
  planetaryColorGrading?: {
    version: AtlasPlanetaryColorGradingVersion;
    status: EvidenceClaimStatus;
    colorTarget: string;
    colorGradeProfiles: string;
    gasGiantColorGradeProfile: string;
    saturnColorGradeProfile: string;
    saturnOcclusionCue: string;
    qualityBudget: string;
    assetPolicy: string;
    boundary: string;
  };
  numericalIntegrity?: {
    version: AtlasNumericalIntegrityVersion;
    status: EvidenceClaimStatus;
    integrityStatus: AtlasNumericalIntegrityStatus;
    energyDriftTrend: AtlasNumericalIntegrityTrend;
    angularMomentumDriftTrend: AtlasNumericalIntegrityTrend;
    timestepSensitivityCoverage: AtlasNumericalIntegrityCoverage;
    timeReversalCoverage: AtlasNumericalIntegrityCoverage;
    unitAuditCoverage: AtlasNumericalIntegrityCoverage;
    benchmarkCount: number;
    boundary: string;
  };
  cinematicPlanetaryArtDirection?: {
    version: AtlasCinematicPlanetaryArtDirectionVersion;
    status: EvidenceClaimStatus;
    referenceMode: string;
    qualityTarget: string;
    assetPolicy: string;
    gasGiantArtProfile: string;
    saturnRingArtProfile: string;
    earthCloudNightProfile: string;
    solarSurfaceProfile: string;
    globalColorGradeProfile: string;
    backgroundArtGradeProfile: string;
    boundary: string;
  };
  cinematicDeepSpaceBackdrop?: {
    version: AtlasCinematicDeepSpaceBackdropVersion;
    status: EvidenceClaimStatus;
    referenceMode: string;
    sourcePolicy: string;
    skyManifest: string;
    starfieldProfile: string;
    nebulaProfile: string;
    negativeSpaceProfile: string;
    boundary: string;
  };
  sparseDeepSpaceDirector?: {
    version: AtlasSparseDeepSpaceDirectorVersion;
    status: EvidenceClaimStatus;
    referenceMode: string;
    sourcePolicy: string;
    skyManifest: string;
    starfieldProfile: string;
    milkyWayProfile: string;
    nebulaProfile: string;
    negativeSpaceProfile: string;
    boundary: string;
  };
  closeupPresentationTruth?: {
    version: AtlasCloseupPresentationTruthVersion;
    backgroundOrbitArtVersion: AtlasBackgroundOrbitArtVersion;
    status: EvidenceClaimStatus;
    previewSyncStatus: AtlasCloseupPreviewSyncStatus;
    previewBodyId: string;
    previewRenderProfile: AtlasBodyPreviewRenderProfile | "";
    solarBackdropProfile: AtlasCloseupSolarBackdropProfile;
    planetReadabilityProfile: AtlasCloseupPlanetReadabilityProfile;
    backgroundArtProfile: AtlasBackgroundArtProfile;
    orbitHierarchyProfile: AtlasOrbitHierarchyProfile;
    orbitPerformanceProfile: AtlasOrbitPerformanceProfile;
    orbitMaterialProfile: AtlasOrbitMaterialProfile;
    solarCloseupProfile: AtlasSolarCloseupProfile;
    velocityTrailProfile: AtlasVelocityTrailProfile;
    orbitOcclusionProfile: AtlasOrbitOcclusionProfile;
    reviewMode: string;
    boundary: string;
  };
  closeupVisualFidelity?: {
    version: AtlasCloseupVisualFidelityVersion;
    status: EvidenceClaimStatus;
    visualTarget: string;
    assetPolicy: AtlasCloseupAssetPolicy;
    textureSourcePolicy: string;
    runtimeAssetPolicy: string;
    protectedSkyManifest: string;
    fullReleaseGateStatus: string;
    boundary: string;
  };
  excludedState: readonly string[];
  sections: readonly AtlasScientificReportSection[];
  reportStudioVersion?: AtlasReportStudioVersion;
  templateId?: AtlasReportTemplateId;
  includedSectionIds?: readonly AtlasReportSectionId[];
};

export type AtlasReportStudioSettings = {
  templateId: AtlasReportTemplateId;
  includedSectionIds: readonly AtlasReportSectionId[];
  exportFormat: AtlasReportExportFormat;
};

export type AtlasReportTemplate = {
  id: AtlasReportTemplateId;
  title: string;
  subtitle: string;
  includedSectionIds: readonly AtlasReportSectionId[];
};

export type AtlasReportSectionToggle = {
  id: AtlasReportSectionId;
  label: string;
  enabled: boolean;
  required: boolean;
};

export type AtlasReportStudioSummary = {
  version: AtlasReportStudioVersion;
  reportVersion: AtlasScientificReportVersion;
  settings: AtlasReportStudioSettings;
  templates: readonly AtlasReportTemplate[];
  selectedTemplate: AtlasReportTemplate;
  availableSectionIds: readonly AtlasReportSectionId[];
  includedSectionIds: readonly AtlasReportSectionId[];
  includedSectionCount: number;
  totalSectionCount: number;
  includedSections: readonly AtlasScientificReportSection[];
  excludedStateIncluded: boolean;
  sectionToggles: readonly AtlasReportSectionToggle[];
};

export type AtlasValidationConsoleVersion = "v30-validation-console";
export type AtlasValidationDomainStatus =
  | "ready"
  | "pending"
  | "failed"
  | "informational";
export type AtlasValidationIssueSeverity = "blocker" | "warning" | "info";
export type AtlasValidationDomainId =
  | "evidence-ledger"
  | "visual-system"
  | "planetary-visual-fidelity"
  | "cinematic-lighting"
  | "chinese-deep-space-fidelity"
  | "cinematic-deep-space-camera"
  | "universe-sandbox-reference-backdrop"
  | "reference-grade-space-art"
  | "planetary-material-composition"
  | "cinematic-closeup-director"
  | "cinematic-key-light-director"
  | "planetary-depth-lighting"
  | "planetary-color-grading"
  | "numerical-integrity"
  | "cinematic-planetary-art-direction"
  | "cinematic-deep-space-backdrop"
  | "sparse-deep-space-director"
  | "closeup-presentation-truth"
  | "closeup-visual-fidelity"
  | "accessibility-workbench"
  | "release-gate"
  | "browser-acceptance"
  | "relativity-observables"
  | "relativity-explainer"
  | "relativity-tour"
  | "relativity-verification"
  | "relativity-charts"
  | "physics-benchmark-gate"
  | "horizons-gate-audit"
  | "physics-gate-split"
  | "release-readiness"
  | "scientific-gate-preflight"
  | "horizons-residual-decomposition"
  | "horizons-candidate-lab"
  | "pluto-residual-isolation"
  | "outer-system-force-model-preflight"
  | "outer-system-reference-adoption"
  | "horizons-candidate-scientific-gate"
  | "strict-horizons-migration-dry-run"
  | "strict-horizons-shadow-migration-gate"
  | "default-strict-horizons-migration"
  | "horizons-provenance-freeze"
  | "offline-runtime-boundary-audit"
  | "scientific-gate-maintenance-runbook"
  | "scientific-gate-release-evidence"
  | "browser-ci-stability-lock"
  | "release-artifact-manifest-lock"
  | "final-maintenance-baseline"
  | "gaia-starfield-enhancement"
  | "relativity-simulation-optimization"
  | "art-polish"
  | "post-enhancement-maintenance-baseline"
  | "browser-resource-performance-lock"
  | "maintenance-evidence-index"
  | "presentation-runtime-performance-lock"
  | "browser-acceptance-runtime-cost-lock"
  | "final-gaia-art-enhancement-lock"
  | "release-candidate-evidence-closure-lock"
  | "interaction-catalog-completion-lock"
  | "interaction-repair-launch-ux-lock"
  | "interaction-visual-quality-lock"
  | "critical-ui-relativity-visibility-lock"
  | "camera-stellar-closeup-lock"
  | "launch-gameplay-openrocket-bridge-lock"
  | "scientific-model-upgrade-contract"
  | "visual-launch-performance-lock"
  | "solar-eih-1pn"
  | "gr-weak-field"
  | "gaia-catalog"
  | "celestial-catalog"
  | "galactic-dynamics"
  | "frw-cosmology"
  | "kerr-lab"
  | "mission-capsule"
  | "mission-hub"
  | "navigator-workflows"
  | "report-studio"
  | "performance-budget";

export type AtlasValidationDomain = {
  id: AtlasValidationDomainId;
  title: string;
  status: AtlasValidationDomainStatus;
  source: string;
  model: string;
  primaryMetric: string;
  boundary: string;
  actionLabel: string;
  relatedNavigatorItemId?: string;
  relatedPanelId?: AtlasNavigatorPanelId;
  relatedEvidenceClaimId?: string;
};

export type AtlasValidationIssue = {
  id: string;
  severity: AtlasValidationIssueSeverity;
  domainId: AtlasValidationDomainId;
  title: string;
  message: string;
  source: string;
  actionLabel: string;
  relatedNavigatorItemId?: string;
  relatedPanelId?: AtlasNavigatorPanelId;
  relatedEvidenceClaimId?: string;
};

export type AtlasValidationConsoleSummary = {
  version: AtlasValidationConsoleVersion;
  releaseGate: AtlasReleaseGateSummary;
  status: AtlasValidationDomainStatus;
  readyCount: number;
  pendingCount: number;
  failedCount: number;
  informationalCount: number;
  blockerCount: number;
  warningCount: number;
  infoCount: number;
  selectedDefaultDomainId: AtlasValidationDomainId;
  domains: readonly AtlasValidationDomain[];
  issues: readonly AtlasValidationIssue[];
  context: {
    selectedBodyId: string;
    selectedCatalogObjectId: string;
    selectedEvidenceClaimId: string;
    selectedWorkflowId: string;
    activeWorkflowStepId: string;
    missionHubCurrentId: string;
    reportTemplateId: AtlasReportTemplateId;
    reportIncludedSectionCount: number;
  };
};

export type AtlasObservatoryDeckVersion = "v31-observatory-deck";
export type AtlasObservatoryZoneId =
  | "current-target"
  | "trust-matrix"
  | "mission-path"
  | "report-export";
export type AtlasObservatoryDeckActionKind =
  | "navigator-item"
  | "workflow-step"
  | "panel-action";

export type AtlasObservatoryDeckAction = {
  id: string;
  kind: AtlasObservatoryDeckActionKind;
  label: string;
  source: string;
  model: string;
  primaryMetric: string;
  boundary: string;
  navigatorItemId?: string;
  navigatorItem?: AtlasNavigatorItem;
  workflowId?: AtlasWorkflowId;
  workflowStepId?: string;
  workflowStep?: AtlasWorkflowStep;
};

export type AtlasObservatoryDeckZone = {
  id: AtlasObservatoryZoneId;
  title: string;
  subtitle: string;
  status: AtlasValidationDomainStatus;
  source: string;
  model: string;
  primaryMetric: string;
  boundary: string;
  metrics: readonly EvidencePassportMetric[];
  actions: readonly AtlasObservatoryDeckAction[];
};

export type AtlasObservatoryDeckSummary = {
  version: AtlasObservatoryDeckVersion;
  readinessStatus: AtlasValidationDomainStatus;
  zoneCount: number;
  currentKind: AtlasMissionHubItemKind | "";
  currentId: string;
  currentTitle: string;
  currentSubtitle: string;
  trustIssueCount: number;
  missionReadyStepCount: number;
  reportTemplateId: AtlasReportTemplateId;
  reportIncludedSectionCount: number;
  zones: readonly AtlasObservatoryDeckZone[];
};

export type AtlasInstrumentUiVersion = "v32-instrument-polish";
export type AtlasInstrumentPanelKind =
  | "mission-hub"
  | "observatory-deck"
  | "validation-console"
  | "report-studio"
  | "relativity-observables";

export type RelativityObservableAtlasVersion = "v37-relativity-observable-atlas";
export type RelativityObservableExplainerVersion = "v39-relativity-observable-explainer";
export type RelativityObservableKind =
  | "weak-field"
  | "strong-field"
  | "numerical-health";
export type RelativityObservableScaleBand =
  | "weak-field-precision"
  | "strong-field-geometry"
  | "numerical-health-boundary";

export type RelativityObservableRow = {
  id:
    | "mercury-perihelion-advance"
    | "solar-limb-light-deflection"
    | "shapiro-radar-delay"
    | "gravitational-kinematic-time-dilation"
    | "kerr-null-probe-4m-over-b"
    | "kerr-isco-split"
    | "kerr-hamiltonian-drift";
  kind: RelativityObservableKind;
  title: string;
  formula: string;
  measuredValue: string;
  referenceValue: string;
  source: string;
  confidence: EvidenceClaimConfidence;
  status: EvidenceClaimStatus;
  scaleBand: RelativityObservableScaleBand;
  scaleNote: string;
  boundary: string;
};

export type RelativityObservableAtlasSummary = {
  version: RelativityObservableAtlasVersion;
  status: EvidenceClaimStatus;
  observableCount: number;
  readyCount: number;
  weakFieldCount: number;
  strongFieldCount: number;
  numericalHealthCount: number;
  boundary: string;
  rows: readonly RelativityObservableRow[];
};

export type RelativityObservableExplainerVariable = {
  symbol: string;
  label: string;
  unit: string;
  meaning: string;
  source: string;
};

export type RelativityObservableExplainerStep = {
  id: string;
  title: string;
  body: string;
};

export type RelativityObservableExplainerCard = {
  id: RelativityObservableRow["id"];
  observableId: RelativityObservableRow["id"];
  kind: RelativityObservableKind;
  title: string;
  formulaTitle: string;
  formulaExpression: string;
  variables: readonly RelativityObservableExplainerVariable[];
  derivationSteps: readonly RelativityObservableExplainerStep[];
  scaleInterpretation: string;
  applicability: string;
  trustedBoundary: string;
  source: string;
  status: EvidenceClaimStatus;
  confidence: EvidenceClaimConfidence;
};

export type RelativityObservableExplainerSummary = {
  version: RelativityObservableExplainerVersion;
  status: EvidenceClaimStatus;
  cardCount: number;
  totalStepCount: number;
  totalVariableCount: number;
  boundary: string;
  cards: readonly RelativityObservableExplainerCard[];
};

export type RelativityGuidedTourVersion = "v40-relativity-guided-tour";
export type RelativityGuidedTourStepId =
  | "tour-mercury-precession"
  | "tour-light-deflection"
  | "tour-shapiro-delay"
  | "tour-time-dilation"
  | "tour-kerr-null-probe"
  | "tour-kerr-isco"
  | "tour-kerr-numerical-health";

export type RelativityGuidedTourStep = {
  id: RelativityGuidedTourStepId;
  observableId: RelativityObservableRow["id"];
  kind: RelativityObservableKind;
  title: string;
  source: string;
  model: string;
  observableStatus: EvidenceClaimStatus;
  status: EvidenceClaimStatus;
  navigatorItemId: "panel:relativity-observables" | "panel:kerr-relativity-lab";
  panelId: AtlasNavigatorPanelId;
  validationDomainId: AtlasValidationDomainId;
  evidenceClaimId: "relativity-observable-explainer" | "kerr-geodesic-lab";
  actionLabel: string;
  expectedDomMarker: string;
  trustedBoundary: string;
};

export type RelativityGuidedTourSummary = {
  version: RelativityGuidedTourVersion;
  status: EvidenceClaimStatus;
  workflowId: AtlasWorkflowId;
  stepCount: number;
  readyCount: number;
  weakFieldStepCount: number;
  strongFieldStepCount: number;
  numericalHealthStepCount: number;
  source: string;
  boundary: string;
  steps: readonly RelativityGuidedTourStep[];
};

export type AtlasRelativityVerificationVersion =
  "v73-relativity-verification-readability";
export type AtlasRelativityBenchmarkProfile =
  "v73-weak-field-kerr-benchmark-readout";
export type AtlasRelativityVerificationClassification =
  | "weak-field-observable"
  | "kerr-test-particle-reference"
  | "numerical-health-only";

export type AtlasRelativityVerificationReadout = {
  id: RelativityObservableRow["id"];
  kind: RelativityObservableKind;
  classification: AtlasRelativityVerificationClassification;
  title: string;
  status: EvidenceClaimStatus;
  source: string;
  route:
    | "observable-atlas"
    | "observable-atlas-and-guided-tour"
    | "kerr-studio-and-guided-tour";
  boundary: string;
};

export type AtlasRelativityVerificationSummary = {
  version: AtlasRelativityVerificationVersion;
  status: EvidenceClaimStatus;
  benchmarkProfile: AtlasRelativityBenchmarkProfile;
  observableAtlasVersion: RelativityObservableAtlasVersion;
  explainerVersion: RelativityObservableExplainerVersion;
  guidedTourVersion: RelativityGuidedTourVersion;
  kerrStudioVersion: KerrRelativityStudioVersion;
  kerrKernelId: RelativityKernelId;
  weakFieldObservableCount: number;
  strongFieldObservableCount: number;
  numericalHealthMetricCount: number;
  readyReadoutCount: number;
  readoutCount: number;
  physicsMutation: "not-applied";
  skyAssetMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  trustedBoundary: string;
  readouts: readonly AtlasRelativityVerificationReadout[];
};

export type AtlasRelativityChartVersion =
  "v74-relativity-verification-charts";
export type AtlasRelativityChartProfile =
  "v74-newtonian-eih-kerr-readout-curves";

export type AtlasRelativityMercuryCurvePoint = {
  fractionOfCentury: number;
  label: string;
  newtonianArcsec: number;
  eihOnePnArcsec: number;
  targetArcsec: number;
};

export type AtlasRelativityIscoBar = {
  id: "prograde" | "retrograde" | "split";
  label: string;
  radiusM: number;
};

export type AtlasRelativityHamiltonianDriftGauge = {
  value: number;
  formatted: string;
  classification: "numerical-health-only";
  boundary: string;
};

export type AtlasRelativityChartSummary = {
  version: AtlasRelativityChartVersion;
  status: EvidenceClaimStatus;
  chartProfile: AtlasRelativityChartProfile;
  verificationVersion: AtlasRelativityVerificationVersion;
  benchmarkProfile: AtlasRelativityBenchmarkProfile;
  kerrKernelId: RelativityKernelId;
  mercuryCurve: readonly AtlasRelativityMercuryCurvePoint[];
  mercuryTargetArcsecPerCentury: number;
  mercuryEihOnePnArcsecPerCentury: number;
  mercuryNewtonianArcsecPerCentury: number;
  weakFieldReadyCount: number;
  weakFieldObservableCount: number;
  kerrIscoBars: readonly AtlasRelativityIscoBar[];
  hamiltonianDrift: AtlasRelativityHamiltonianDriftGauge;
  physicsMutation: "not-applied";
  skyAssetMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  trustedBoundary: string;
};

export type AtlasPhysicsBenchmarkGateVersion =
  "v75-physics-benchmark-release-gate";
export type AtlasPhysicsBenchmarkBudgetProfile =
  "v75-weak-field-horizons-kerr-error-budget";
export type AtlasPhysicsBenchmarkDomain =
  | "weak-field"
  | "numerical"
  | "ephemeris"
  | "kerr";
export type AtlasPhysicsBenchmarkClassification =
  | "analytic-anchor"
  | "formula-regression"
  | "numerical-health"
  | "ephemeris-comparison";
export type AtlasPhysicsBenchmarkStatus = "pass" | "pending" | "fail";
export type AtlasPhysicsBenchmarkId =
  | "mercury-perihelion-anchor"
  | "solar-limb-deflection-anchor"
  | "shapiro-fixed-state-regression"
  | "weak-field-clock-rate"
  | "rk4-timestep-convergence"
  | "rk4-time-reversal"
  | "schwarzschild-kerr-analytic-anchors"
  | "kerr-hamiltonian-drift"
  | "horizons-ten-year-eih-1pn";

export type AtlasPhysicsBenchmarkResult = {
  id: AtlasPhysicsBenchmarkId;
  domain: AtlasPhysicsBenchmarkDomain;
  classification: AtlasPhysicsBenchmarkClassification;
  status: AtlasPhysicsBenchmarkStatus;
  measured: string;
  threshold: string;
  blocking: true;
  boundary: string;
};

export type AtlasPhysicsBenchmarkGateSummary = {
  version: AtlasPhysicsBenchmarkGateVersion;
  budgetProfile: AtlasPhysicsBenchmarkBudgetProfile;
  runtimeStatus: AtlasPhysicsBenchmarkStatus;
  resultCount: number;
  passCount: number;
  pendingCount: number;
  failCount: number;
  blockingCount: number;
  ciCertificationStatus: "not-claimed-in-app";
  physicsMutation: "not-applied";
  skyAssetMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  trustedBoundary: string;
  results: readonly AtlasPhysicsBenchmarkResult[];
};

export type AtlasHorizonsGateAuditVersion = "v77-horizons-gate-closure-audit";
export type AtlasHorizonsGateAuditProfile = "v77-j2000-frame-unit-integrator-audit";
export type AtlasHorizonsGateAuditStatus =
  | "pending-runtime-run"
  | "blocked-model-limit"
  | "blocked-reference-frame-mismatch"
  | "blocked-runner-bug-unresolved"
  | "pass";
export type AtlasHorizonsGateAuditFailureClassification =
  | "pending"
  | "model-limit"
  | "reference-frame-mismatch"
  | "runner-bug-unresolved"
  | "none";
export type AtlasHorizonsGateAuditRow = {
  mode: "newton" | "1pn";
  checkpointLabel: "+30d" | "+365d" | "+10y";
  offsetDays: number;
  rmsPositionKm: number | null;
  rmsVelocityMs: number | null;
  mercuryDeltaRKm: number | null;
  mercuryDeltaVMs: number | null;
  maxErrorBodyId: string;
  maxErrorDeltaRKm: number | null;
  maxErrorDeltaVMs: number | null;
};
export type AtlasHorizonsGateAuditSummary = {
  version: AtlasHorizonsGateAuditVersion;
  status: AtlasHorizonsGateAuditStatus;
  auditProfile: AtlasHorizonsGateAuditProfile;
  physicsBenchmarkGateVersion: AtlasPhysicsBenchmarkGateVersion;
  physicsBenchmarkBudgetProfile: AtlasPhysicsBenchmarkBudgetProfile;
  failureClassification: AtlasHorizonsGateAuditFailureClassification;
  currentFailureMeasured: string;
  currentThreshold: string;
  modeCount: number;
  checkpointCount: number;
  auditRows: readonly AtlasHorizonsGateAuditRow[];
  dataLineageChecks: readonly string[];
  runnerLineageChecks: readonly string[];
  budgetMutation: "not-applied";
  physicsMutation: "not-applied";
  skyAssetMutation: "not-applied";
  materialMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  scientificCertificationStatus: "not-claimed";
  fullReleaseGateStatus: "blocked-by-v75-horizons-until-fixed";
  trustedBoundary: string;
};

export type AtlasPhysicsGateSplitVersion = "v78-product-scientific-physics-gate-split";
export type AtlasPhysicsGateSplitProfile = "v78-local-product-ready-strict-horizons-blocked";
export type AtlasProductReleaseGateStatus = "pass";
export type AtlasScientificHorizonsGateStatus = "blocked-model-limit" | "pending-runtime-run" | "pass";
export type AtlasPhysicsGateSplitSummary = {
  version: AtlasPhysicsGateSplitVersion;
  gateSplitProfile: AtlasPhysicsGateSplitProfile;
  productReleaseGateStatus: AtlasProductReleaseGateStatus;
  scientificHorizonsGateStatus: AtlasScientificHorizonsGateStatus;
  scientificFailureClassification: AtlasHorizonsGateAuditFailureClassification;
  strictHorizonsFailureMeasured: string;
  strictHorizonsThreshold: string;
  strictHorizonsCommand: "npm run test:atlas:horizons-scientific-gate";
  productFullCommand: "npm run verify:atlas:full";
  scientificFullCommand: "npm run verify:atlas:scientific";
  releaseSemantics: "product-full-excludes-strict-horizons-scientific-gate";
  budgetMutation: "not-applied";
  physicsMutation: "not-applied";
  skyAssetMutation: "not-applied";
  materialMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  scientificCertificationStatus: "blocked-by-strict-horizons-gate";
  trustedBoundary: string;
};

export type AtlasReleaseReadinessVersion = "v79-release-readiness-gate-semantics";
export type AtlasReleaseReadinessProfile = "v79-product-ready-scientific-blocker-disclosed";
export type AtlasReleaseReadinessSummary = {
  version: AtlasReleaseReadinessVersion;
  readinessProfile: AtlasReleaseReadinessProfile;
  productReleaseGateStatus: AtlasProductReleaseGateStatus;
  scientificHorizonsGateStatus: AtlasScientificHorizonsGateStatus;
  productFullCommand: "npm run verify:atlas:full";
  scientificFullCommand: "npm run verify:atlas:scientific";
  strictHorizonsCommand: "npm run test:atlas:horizons-scientific-gate";
  knownScientificBlocker: string;
  releaseSemantics: "product-ready-scientific-horizons-blocked";
  documentationScope: "readme-technical-overview-evidence-validation-dom";
  budgetMutation: "not-applied";
  physicsMutation: "not-applied";
  skyAssetMutation: "not-applied";
  materialMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  scientificCertificationStatus: "blocked-by-strict-horizons-gate";
  trustedBoundary: string;
};

export type AtlasScientificGatePreflightVersion = "v80-scientific-horizons-closure-preflight";
export type AtlasScientificGatePreflightProfile = "v80-horizons-model-limit-upgrade-roadmap";
export type AtlasScientificGatePreflightStatus =
  "product-ready-strict-scientific-blocked-preflight-ready";
export type AtlasScientificGatePreflightCandidateId =
  | "ephemeris-initial-state-upgrade"
  | "solar-system-force-model-upgrade"
  | "high-order-integrator-upgrade";
export type AtlasScientificGatePreflightCandidate = {
  id: AtlasScientificGatePreflightCandidateId;
  status: "not-applied";
  target: string;
  rationale: string;
  expectedEvidence: string;
  physicsMutation: "not-applied";
  budgetMutation: "not-applied";
};
export type AtlasScientificGatePreflightSummary = {
  version: AtlasScientificGatePreflightVersion;
  preflightProfile: AtlasScientificGatePreflightProfile;
  status: AtlasScientificGatePreflightStatus;
  productReleaseGateStatus: AtlasProductReleaseGateStatus;
  scientificHorizonsGateStatus: AtlasScientificHorizonsGateStatus;
  knownScientificBlocker: string;
  candidatePathCount: number;
  candidatePaths: readonly AtlasScientificGatePreflightCandidate[];
  strictHorizonsCommand: "npm run test:atlas:horizons-scientific-gate";
  productFullCommand: "npm run verify:atlas:full";
  scientificFullCommand: "npm run verify:atlas:scientific";
  budgetMutation: "not-applied";
  physicsMutation: "not-applied";
  skyAssetMutation: "not-applied";
  materialMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  scientificCertificationStatus: "blocked-by-strict-horizons-gate";
  trustedBoundary: string;
};

export type AtlasHorizonsResidualDecompositionVersion =
  "v81-horizons-residual-decomposition";
export type AtlasHorizonsResidualDecompositionProfile =
  "v81-rtn-body-checkpoint-error-attribution";
export type AtlasHorizonsResidualDecompositionStatus =
  | "pending-runtime-run"
  | "ready-blocked-model-limit"
  | "ready-pass";
export type AtlasHorizonsResidualComponent =
  | "radial"
  | "transverse"
  | "normal"
  | "unavailable";
export type AtlasHorizonsResidualRow = {
  mode: "newton" | "1pn";
  checkpointLabel: "+30d" | "+365d" | "+10y";
  bodyId: string;
  positionNormKm: number;
  velocityNormMs: number;
  radialPositionKm: number;
  transversePositionKm: number;
  normalPositionKm: number;
  radialVelocityMs: number;
  transverseVelocityMs: number;
  normalVelocityMs: number;
  dominantPositionComponent: AtlasHorizonsResidualComponent;
  dominantVelocityComponent: AtlasHorizonsResidualComponent;
  positionContributionFraction: number;
  velocityContributionFraction: number;
};
export type AtlasHorizonsResidualCheckpointSummary = {
  mode: "newton" | "1pn";
  checkpointLabel: "+30d" | "+365d" | "+10y";
  bodyCount: number;
  positionContributionTotal: number;
  velocityContributionTotal: number;
  dominantPositionBodyId: string;
  dominantPositionComponent: AtlasHorizonsResidualComponent;
  dominantPositionContributionFraction: number;
  dominantVelocityBodyId: string;
  dominantVelocityComponent: AtlasHorizonsResidualComponent;
  dominantVelocityContributionFraction: number;
  rows: readonly AtlasHorizonsResidualRow[];
};
export type AtlasHorizonsTenYearBodyComparison = {
  bodyId: string;
  newtonPositionKm: number | null;
  onePnPositionKm: number | null;
  onePnToNewtonPositionRatio: number | null;
  classification: "improved" | "worsened" | "unchanged" | "unavailable";
};
export type AtlasHorizonsResidualDecompositionSummary = {
  version: AtlasHorizonsResidualDecompositionVersion;
  decompositionProfile: AtlasHorizonsResidualDecompositionProfile;
  status: AtlasHorizonsResidualDecompositionStatus;
  sourceAuditStatus: AtlasHorizonsGateAuditStatus;
  referenceFrame: "sun-centered-reference-rtn";
  contributionScope: "finite-non-sun-rtn-bodies-per-mode-checkpoint";
  modeCount: number;
  checkpointCount: number;
  decomposableBodyCount: number;
  residualRowCount: number;
  dominantBodyId: string;
  checkpointSummaries: readonly AtlasHorizonsResidualCheckpointSummary[];
  tenYearBodyComparisons: readonly AtlasHorizonsTenYearBodyComparison[];
  knownScientificBlocker: string;
  budgetMutation: "not-applied";
  physicsMutation: "not-applied";
  skyAssetMutation: "not-applied";
  materialMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  scientificCertificationStatus: "blocked-by-strict-horizons-gate" | "not-claimed";
  trustedBoundary: string;
};

export type AtlasHorizonsCandidateLabVersion =
  "v82-horizons-dynamical-parameter-candidate-lab";
export type AtlasHorizonsCandidateLabProfile =
  "v82-de440-gm-softening-step-hierarchy-matrix";
export type AtlasHorizonsCandidateLabStatus =
  | "pending-offline-run"
  | "candidate-partial-unapplied"
  | "candidate-pass-unapplied";
export type AtlasHorizonsCandidateProfileId =
  | "baseline-v75-strict"
  | "de440-solar-gm"
  | "de440-solar-gm-zero-softening"
  | "de440-solar-gm-zero-softening-half-step"
  | "de440-system-gm-zero-softening-half-step-hierarchy";
export type AtlasHorizonsCandidateDatasetRole =
  | "v75-center-reference"
  | "v82-hierarchy-reference";
export type AtlasHorizonsCandidateMassProfile =
  | "current-nasa-mass-kg"
  | "de440-solar-gm-only"
  | "de440-system-gm";
export type AtlasHorizonsCandidateRow = {
  id: AtlasHorizonsCandidateProfileId;
  label: string;
  datasetRole: AtlasHorizonsCandidateDatasetRole;
  massProfile: AtlasHorizonsCandidateMassProfile;
  dtDays: number;
  softeningAu: number;
  status: "not-run" | "complete";
  onePnRmsPositionKm: number | null;
  onePnRmsVelocityMs: number | null;
  mercuryPositionKm: number | null;
  mercuryVelocityMs: number | null;
  plutoPositionKm: number | null;
  plutoVelocityMs: number | null;
  mercuryVelocityImprovementVsBaseline: number | null;
  plutoPositionImprovementVsBaseline: number | null;
  scientificGateCandidateStatus: "not-run" | "partial" | "pass";
  mutationStatus: "not-applied";
};
export type AtlasHorizonsCandidateLabSummary = {
  version: AtlasHorizonsCandidateLabVersion;
  candidateProfile: AtlasHorizonsCandidateLabProfile;
  status: AtlasHorizonsCandidateLabStatus;
  strictGateBaselineMeasured: string;
  candidateCount: number;
  completedCandidateCount: number;
  bestPositionCandidateId: AtlasHorizonsCandidateProfileId | "";
  bestVelocityCandidateId: AtlasHorizonsCandidateProfileId | "";
  de440Source: "JPL SSD Astrodynamic Parameters DE440";
  hierarchySource: "JPL Horizons system barycenter candidate fixture";
  candidateRows: readonly AtlasHorizonsCandidateRow[];
  strictGateDefaultMutation: "not-applied";
  candidateMutation: "not-applied";
  budgetMutation: "not-applied";
  physicsMutation: "not-applied";
  skyAssetMutation: "not-applied";
  materialMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  scientificCertificationStatus: "blocked-by-strict-horizons-gate" | "candidate-unapplied";
  trustedBoundary: string;
};

export type AtlasPlutoResidualIsolationVersion =
  "v83-pluto-residual-cause-isolation";
export type AtlasPlutoResidualIsolationProfile =
  "v83-outer-system-phase-force-model-matrix";
export type AtlasPlutoResidualIsolationStatus =
  | "pending-runtime-run"
  | "ready-candidate-limited"
  | "ready-candidate-actionable";
export type AtlasPlutoResidualIsolationClassification =
  | "not-isolated"
  | "likely-force-model-limit"
  | "likely-reference-model-limit"
  | "likely-integrator-limit"
  | "mixed";
export type AtlasPlutoResidualIsolationCandidateId =
  | "v82-solar-gm-zero-softening-half-step"
  | "v83-solar-gm-zero-softening-quarter-step"
  | "v83-system-gm-zero-softening-half-step-center"
  | "v83-system-gm-zero-softening-quarter-step-center"
  | "v83-system-gm-zero-softening-half-step-hierarchy"
  | "v83-system-gm-zero-softening-quarter-step-hierarchy";
export type AtlasPlutoResidualIsolationDatasetRole =
  | "v75-center-reference"
  | "v82-hierarchy-reference";
export type AtlasPlutoResidualIsolationMassProfile =
  | "de440-solar-gm-only"
  | "de440-system-gm";
export type AtlasPlutoResidualIsolationMetric = {
  candidateId: AtlasPlutoResidualIsolationCandidateId | "";
  positionKm: number | null;
  velocityMs: number | null;
  onePnRmsPositionKm: number | null;
  onePnRmsVelocityMs: number | null;
  improvementVsBaseline: number | null;
};
export type AtlasPlutoResidualIsolationAggregate = {
  candidateId: AtlasPlutoResidualIsolationCandidateId | "";
  excludedBodyId: "pluto";
  bodyCount: number;
  onePnRmsPositionKm: number | null;
  onePnRmsVelocityMs: number | null;
};
export type AtlasPlutoResidualIsolationRtn = {
  candidateId: AtlasPlutoResidualIsolationCandidateId | "";
  basisStatus: HorizonsOrbitalResidual["basisStatus"] | "unavailable";
  radialPositionKm: number | null;
  transversePositionKm: number | null;
  normalPositionKm: number | null;
  radialVelocityMs: number | null;
  transverseVelocityMs: number | null;
  normalVelocityMs: number | null;
  positionNormKm: number | null;
  velocityNormMs: number | null;
  dominantPositionComponent: AtlasHorizonsResidualComponent;
  dominantVelocityComponent: AtlasHorizonsResidualComponent;
};
export type AtlasPlutoResidualIsolationRow = {
  id: AtlasPlutoResidualIsolationCandidateId;
  label: string;
  datasetRole: AtlasPlutoResidualIsolationDatasetRole;
  massProfile: AtlasPlutoResidualIsolationMassProfile;
  dtDays: number;
  softeningAu: number;
  status: "not-run" | "complete";
  onePnRmsPositionKm: number | null;
  onePnRmsVelocityMs: number | null;
  plutoPositionKm: number | null;
  plutoVelocityMs: number | null;
  plutoPositionImprovementVsBaseline: number | null;
  plutoExcludedAggregate: AtlasPlutoResidualIsolationAggregate;
  plutoRtn: AtlasPlutoResidualIsolationRtn;
  mutationStatus: "not-applied";
};
export type AtlasPlutoResidualIsolationSummary = {
  version: AtlasPlutoResidualIsolationVersion;
  isolationProfile: AtlasPlutoResidualIsolationProfile;
  status: AtlasPlutoResidualIsolationStatus;
  classification: AtlasPlutoResidualIsolationClassification;
  strictBlocker: string;
  candidateCount: number;
  completedCandidateCount: number;
  baselinePlutoPlus10y: AtlasPlutoResidualIsolationMetric;
  bestCandidatePlutoPlus10y: AtlasPlutoResidualIsolationMetric;
  plutoExcludedAggregate: AtlasPlutoResidualIsolationAggregate;
  dominantRtnComponent: AtlasHorizonsResidualComponent;
  candidateRows: readonly AtlasPlutoResidualIsolationRow[];
  budgetMutation: "not-applied";
  physicsMutation: "not-applied";
  skyAssetMutation: "not-applied";
  materialMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  scientificCertificationStatus: "blocked-by-strict-horizons-gate";
  trustedBoundary: string;
};

export type AtlasOuterSystemForceModelPreflightVersion =
  "v84-outer-system-force-model-preflight";
export type AtlasOuterSystemForceModelPreflightProfile =
  "v84-pluto-barycenter-tno-force-model-upgrade-path";
export type AtlasOuterSystemForceModelPreflightStatus =
  | "pending-runtime-run"
  | "ready-fixture-provenance-blocked"
  | "ready-upgrade-path-limited"
  | "ready-upgrade-path-actionable";
export type AtlasOuterSystemForceModelPreflightClassification =
  | "fixture-provenance-limit"
  | "barycenter-reference-limit"
  | "missing-perturber-limit"
  | "gm-parity-limit"
  | "mixed"
  | "not-enough-evidence";
export type AtlasOuterSystemForceModelPreflightCandidateId =
  | "v83-best-baseline"
  | "v84-pluto-system-barycenter"
  | "v84-outer-system-barycenter"
  | "v84-de440-system-gm-parity"
  | "v84-tno-kuiper-metadata-only";
export type AtlasOuterSystemForceModelPreflightFixtureAuditId =
  | "v82-hierarchy-candidate"
  | "v84-outer-system-barycenter";
export type AtlasOuterSystemForceModelPreflightFixtureStatus =
  | "missing"
  | "provenance-insufficient"
  | "ready";
export type AtlasOuterSystemForceModelPreflightTargetRole =
  | "center-reference"
  | "system-barycenter-reference"
  | "metadata-only";
export type AtlasOuterSystemForceModelPreflightFixtureAudit = {
  id: AtlasOuterSystemForceModelPreflightFixtureAuditId;
  label: string;
  status: AtlasOuterSystemForceModelPreflightFixtureStatus;
  variant: string | null;
  expectedVariant: string;
  outerSystemJ2000DeltaAu: number | null;
  targetProvenanceBodyCount: number;
  barycenterTargetCount: number;
  trustedBoundary: string;
};
export type AtlasOuterSystemForceModelPreflightRow = {
  id: AtlasOuterSystemForceModelPreflightCandidateId;
  label: string;
  targetRole: AtlasOuterSystemForceModelPreflightTargetRole;
  datasetVariant: string;
  massProfile: AtlasPlutoResidualIsolationMassProfile | "metadata-only";
  dtDays: number | null;
  softeningAu: number | null;
  status: "not-run" | "complete" | "metadata-only" | "blocked";
  onePnRmsPositionKm: number | null;
  onePnRmsVelocityMs: number | null;
  plutoPositionKm: number | null;
  plutoVelocityMs: number | null;
  plutoPositionImprovementVsBaseline: number | null;
  plutoExcludedAggregate: AtlasPlutoResidualIsolationAggregate;
  fixtureAuditId: AtlasOuterSystemForceModelPreflightFixtureAuditId | "";
  mutationStatus: "not-applied";
};
export type AtlasOuterSystemForceModelPreflightSummary = {
  version: AtlasOuterSystemForceModelPreflightVersion;
  preflightProfile: AtlasOuterSystemForceModelPreflightProfile;
  status: AtlasOuterSystemForceModelPreflightStatus;
  classification: AtlasOuterSystemForceModelPreflightClassification;
  strictBlocker: string;
  candidateCount: number;
  completedCandidateCount: number;
  fixtureAudits: readonly AtlasOuterSystemForceModelPreflightFixtureAudit[];
  candidateRows: readonly AtlasOuterSystemForceModelPreflightRow[];
  bestCandidateId: AtlasOuterSystemForceModelPreflightCandidateId | "";
  fixtureProvenanceMutation: "not-applied";
  budgetMutation: "not-applied";
  physicsMutation: "not-applied";
  skyAssetMutation: "not-applied";
  materialMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  scientificCertificationStatus: "blocked-by-strict-horizons-gate";
  trustedBoundary: string;
};

export type AtlasOuterSystemReferenceAdoptionVersion =
  "v85-outer-system-reference-adoption-preflight";
export type AtlasOuterSystemReferenceAdoptionProfile =
  "v85-barycentric-fixture-adoption-readiness";
export type AtlasOuterSystemReferenceAdoptionStatus =
  | "pending-runtime-run"
  | "ready-adoption-candidate"
  | "ready-adoption-blocked"
  | "ready-default-gate-blocked";
export type AtlasOuterSystemReferenceAdoptionClassification =
  | "reference-fixture-ready"
  | "default-gate-not-migrated"
  | "provenance-regression"
  | "budget-regression"
  | "candidate-regression"
  | "mixed";
export type AtlasOuterSystemReferenceAdoptionCandidateId =
  "v85-outer-system-barycenter-system-gm-adoption";
export type AtlasOuterSystemReferenceAdoptionLockAuditId =
  | "v75-strict-fixture-lock"
  | "v84-reference-fixture-provenance"
  | "v82-legacy-candidate-provenance";
export type AtlasOuterSystemReferenceAdoptionLockStatus =
  | "ready"
  | "blocked"
  | "regressed";
export type AtlasOuterSystemReferenceAdoptionLockAudit = {
  id: AtlasOuterSystemReferenceAdoptionLockAuditId;
  label: string;
  status: AtlasOuterSystemReferenceAdoptionLockStatus;
  measured: string;
  expected: string;
  trustedBoundary: string;
};
export type AtlasOuterSystemReferenceAdoptionRow = {
  id: AtlasOuterSystemReferenceAdoptionCandidateId;
  label: string;
  datasetVariant: "v84-outer-system-barycenter-reference";
  massProfile: "de440-system-gm";
  dtDays: 0.125;
  softeningAu: 0;
  status: "not-run" | "complete" | "blocked";
  onePnRmsPositionKm: number | null;
  onePnRmsVelocityMs: number | null;
  mercuryOnePnToNewtonRatio: number | null;
  plutoPositionKm: number | null;
  plutoVelocityMs: number | null;
  candidateBudgetStatus: "not-run" | "pass" | "fail";
  mutationStatus: "not-applied";
};
export type AtlasOuterSystemReferenceAdoptionSummary = {
  version: AtlasOuterSystemReferenceAdoptionVersion;
  adoptionProfile: AtlasOuterSystemReferenceAdoptionProfile;
  status: AtlasOuterSystemReferenceAdoptionStatus;
  classification: AtlasOuterSystemReferenceAdoptionClassification;
  strictBlocker: string;
  candidateCount: number;
  completedCandidateCount: number;
  lockAudits: readonly AtlasOuterSystemReferenceAdoptionLockAudit[];
  candidateRows: readonly AtlasOuterSystemReferenceAdoptionRow[];
  bestCandidateId: AtlasOuterSystemReferenceAdoptionCandidateId | "";
  strictBudgetPositionRmsKm: number;
  strictBudgetVelocityRmsMs: number;
  strictBudgetMercuryRatio: number;
  defaultStrictFixtureMutation: "not-applied";
  defaultScientificGateMutation: "not-applied";
  referenceFixtureAdoptionMutation: "not-applied";
  budgetMutation: "not-applied";
  physicsMutation: "not-applied";
  skyAssetMutation: "not-applied";
  materialMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  scientificCertificationStatus: "candidate-only-default-gate-blocked";
  trustedBoundary: string;
};

export type AtlasHorizonsCandidateScientificGateVersion =
  "v86-horizons-candidate-scientific-gate";
export type AtlasHorizonsCandidateScientificGateProfile =
  "v86-barycentric-reference-candidate-gate";
export type AtlasHorizonsCandidateScientificGateStatus =
  | "pending-runtime-run"
  | "candidate-gate-pass-unapplied"
  | "candidate-gate-fail"
  | "candidate-gate-blocked";
export type AtlasHorizonsCandidateScientificGateClassification =
  | "candidate-budget-pass"
  | "default-strict-gate-still-blocked"
  | "fixture-provenance-regression"
  | "budget-regression"
  | "candidate-numerical-regression"
  | "mixed";
export type AtlasHorizonsCandidateScientificGateCandidateId =
  "v86-barycentric-reference-candidate-scientific-gate";
export type AtlasHorizonsCandidateScientificGateLockAuditId =
  | "v75-strict-fixture-lock"
  | "v84-reference-fixture-provenance"
  | "v85-adoption-candidate-budget"
  | "default-strict-scientific-gate-lock";
export type AtlasHorizonsCandidateScientificGateLockStatus =
  | "ready"
  | "blocked"
  | "regressed";
export type AtlasHorizonsCandidateScientificGateLockAudit = {
  id: AtlasHorizonsCandidateScientificGateLockAuditId;
  label: string;
  status: AtlasHorizonsCandidateScientificGateLockStatus;
  measured: string;
  expected: string;
  trustedBoundary: string;
};
export type AtlasHorizonsCandidateScientificGateRow = {
  id: AtlasHorizonsCandidateScientificGateCandidateId;
  label: string;
  sourceAdoptionCandidateId: AtlasOuterSystemReferenceAdoptionCandidateId;
  datasetVariant: "v84-outer-system-barycenter-reference";
  massProfile: "de440-system-gm";
  dtDays: 0.125;
  softeningAu: 0;
  status: "not-run" | "complete" | "blocked";
  onePnRmsPositionKm: number | null;
  onePnRmsVelocityMs: number | null;
  mercuryOnePnToNewtonRatio: number | null;
  plutoPositionKm: number | null;
  plutoVelocityMs: number | null;
  candidateBudgetStatus: "not-run" | "pass" | "fail";
  defaultScientificGateStatus: "expected-fail-unchanged";
  mutationStatus: "not-applied";
};
export type AtlasHorizonsCandidateScientificGateSummary = {
  version: AtlasHorizonsCandidateScientificGateVersion;
  candidateGateProfile: AtlasHorizonsCandidateScientificGateProfile;
  status: AtlasHorizonsCandidateScientificGateStatus;
  classification: AtlasHorizonsCandidateScientificGateClassification;
  strictBlocker: string;
  candidateCount: number;
  completedCandidateCount: number;
  lockAudits: readonly AtlasHorizonsCandidateScientificGateLockAudit[];
  candidateRows: readonly AtlasHorizonsCandidateScientificGateRow[];
  bestCandidateId: AtlasHorizonsCandidateScientificGateCandidateId | "";
  strictBudgetPositionRmsKm: number;
  strictBudgetVelocityRmsMs: number;
  strictBudgetMercuryRatio: number;
  defaultStrictFixtureMutation: "not-applied";
  defaultScientificGateMutation: "not-applied";
  referenceFixtureAdoptionMutation: "not-applied";
  budgetMutation: "not-applied";
  physicsMutation: "not-applied";
  workerPhysicsMutation: "not-applied";
  rk4DefaultMutation: "not-applied";
  eihOnePnMutation: "not-applied";
  skyAssetMutation: "not-applied";
  materialMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  scientificCertificationStatus: "candidate-only-default-gate-blocked";
  trustedBoundary: string;
};

export type AtlasStrictHorizonsMigrationDryRunVersion =
  "v87-strict-horizons-migration-dry-run";
export type AtlasStrictHorizonsMigrationDryRunProfile =
  "v87-default-gate-migration-diff-audit";
export type AtlasStrictHorizonsMigrationDryRunStatus =
  | "pending-runtime-run"
  | "ready-migration-diff-complete"
  | "ready-migration-blocked"
  | "ready-default-gate-still-blocked";
export type AtlasStrictHorizonsMigrationDryRunClassification =
  | "candidate-ready-default-not-migrated"
  | "default-gate-diff-ready"
  | "fixture-regression"
  | "budget-regression"
  | "candidate-regression"
  | "migration-contract-incomplete"
  | "mixed";
export type AtlasStrictHorizonsMigrationDryRunRowId =
  "v87-v86-candidate-default-gate-migration-diff";
export type AtlasStrictHorizonsMigrationDryRunLockAuditId =
  | "v75-strict-fixture-lock"
  | "v84-reference-fixture-provenance"
  | "v86-candidate-gate-lock"
  | "v75-budget-lock"
  | "default-strict-command-lock"
  | "migration-contract-lock";
export type AtlasStrictHorizonsMigrationDryRunLockStatus =
  | "ready"
  | "blocked"
  | "regressed";
export type AtlasStrictHorizonsMigrationDryRunLockAudit = {
  id: AtlasStrictHorizonsMigrationDryRunLockAuditId;
  label: string;
  status: AtlasStrictHorizonsMigrationDryRunLockStatus;
  measured: string;
  expected: string;
  trustedBoundary: string;
};
export type AtlasStrictHorizonsMigrationDryRunRow = {
  id: AtlasStrictHorizonsMigrationDryRunRowId;
  label: string;
  sourceCandidateGateId: AtlasHorizonsCandidateScientificGateCandidateId;
  currentDefaultFixturePath: "public/data/horizons-validation-j2000.json";
  candidateFixturePath: "public/data/horizons-validation-j2000-outer-system-barycenter-v84.json";
  candidateDatasetVariant: "v84-outer-system-barycenter-reference";
  candidateMassProfile: "de440-system-gm";
  candidateDtDays: 0.125;
  candidateSofteningAu: 0;
  currentStrictCommand: "npm run test:atlas:horizons-scientific-gate";
  futureMigrationCommandTarget: "npm run test:atlas:horizons-scientific-gate";
  rollbackCriteria: string;
  status: "not-run" | "complete" | "blocked";
  onePnRmsPositionKm: number | null;
  onePnRmsVelocityMs: number | null;
  mercuryOnePnToNewtonRatio: number | null;
  diffStatus: "not-run" | "complete" | "incomplete";
  candidateBudgetStatus: "not-run" | "pass" | "fail";
  defaultStrictGateStatus: "expected-fail-unchanged";
  migrationMutationStatus: "not-applied";
};
export type AtlasStrictHorizonsMigrationDryRunSummary = {
  version: AtlasStrictHorizonsMigrationDryRunVersion;
  migrationProfile: AtlasStrictHorizonsMigrationDryRunProfile;
  status: AtlasStrictHorizonsMigrationDryRunStatus;
  classification: AtlasStrictHorizonsMigrationDryRunClassification;
  strictBlocker: string;
  migrationDiffCount: number;
  completedMigrationDiffCount: number;
  lockAudits: readonly AtlasStrictHorizonsMigrationDryRunLockAudit[];
  migrationDiffRows: readonly AtlasStrictHorizonsMigrationDryRunRow[];
  readyMigrationDiffId: AtlasStrictHorizonsMigrationDryRunRowId | "";
  strictBudgetPositionRmsKm: number;
  strictBudgetVelocityRmsMs: number;
  strictBudgetMercuryRatio: number;
  defaultStrictFixtureMutation: "not-applied";
  defaultStrictCommandMutation: "not-applied";
  defaultScientificGateMutation: "not-applied";
  referenceFixtureAdoptionMutation: "not-applied";
  migrationDocsMutation: "not-applied";
  migrationScreenshotsMutation: "not-applied";
  budgetMutation: "not-applied";
  physicsMutation: "not-applied";
  workerPhysicsMutation: "not-applied";
  rk4DefaultMutation: "not-applied";
  eihOnePnMutation: "not-applied";
  skyAssetMutation: "not-applied";
  materialMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  scientificCertificationStatus: "dry-run-only-default-gate-blocked";
  trustedBoundary: string;
};

export type AtlasStrictHorizonsShadowMigrationGateVersion =
  "v88-strict-horizons-shadow-migration-gate";
export type AtlasStrictHorizonsShadowMigrationGateProfile =
  "v88-parallel-default-gate-rehearsal";
export type AtlasStrictHorizonsShadowMigrationGateStatus =
  | "pending-runtime-run"
  | "ready-shadow-gate-pass"
  | "ready-shadow-gate-blocked"
  | "ready-default-gate-still-blocked";
export type AtlasStrictHorizonsShadowMigrationGateClassification =
  | "shadow-gate-pass-default-not-migrated"
  | "migration-diff-regression"
  | "shadow-budget-regression"
  | "strict-command-regression"
  | "fixture-regression"
  | "mixed";
export type AtlasStrictHorizonsShadowMigrationGateRowId =
  "v88-parallel-strict-horizons-shadow-gate";
export type AtlasStrictHorizonsShadowMigrationGateLockAuditId =
  | "v75-strict-fixture-lock"
  | "v84-reference-fixture-provenance"
  | "v75-budget-lock"
  | "v87-migration-diff-lock"
  | "default-strict-command-lock"
  | "shadow-gate-contract-lock";
export type AtlasStrictHorizonsShadowMigrationGateLockStatus =
  | "ready"
  | "blocked"
  | "regressed";
export type AtlasStrictHorizonsShadowMigrationGateLockAudit = {
  id: AtlasStrictHorizonsShadowMigrationGateLockAuditId;
  label: string;
  status: AtlasStrictHorizonsShadowMigrationGateLockStatus;
  measured: string;
  expected: string;
  trustedBoundary: string;
};
export type AtlasStrictHorizonsShadowMigrationGateRow = {
  id: AtlasStrictHorizonsShadowMigrationGateRowId;
  label: string;
  sourceDryRunVersion: AtlasStrictHorizonsMigrationDryRunVersion;
  sourceDryRunProfile: AtlasStrictHorizonsMigrationDryRunProfile;
  sourceMigrationDiffId: AtlasStrictHorizonsMigrationDryRunRowId;
  currentDefaultCommand: "npm run test:atlas:horizons-scientific-gate";
  shadowCommand: "npm run test:atlas:horizons-shadow-migration-gate";
  currentDefaultFixturePath: "public/data/horizons-validation-j2000.json";
  shadowFixturePath: "public/data/horizons-validation-j2000-outer-system-barycenter-v84.json";
  shadowDatasetVariant: "v84-outer-system-barycenter-reference";
  shadowMassProfile: "de440-system-gm";
  shadowDtDays: 0.125;
  shadowSofteningAu: 0;
  status: "not-run" | "complete" | "blocked";
  onePnRmsPositionKm: number | null;
  onePnRmsVelocityMs: number | null;
  mercuryOnePnToNewtonRatio: number | null;
  shadowBudgetStatus: "not-run" | "pass" | "fail";
  defaultStrictGateStatus: "expected-fail-unchanged";
  shadowGateMutationStatus: "not-applied";
};
export type AtlasStrictHorizonsShadowMigrationGateSummary = {
  version: AtlasStrictHorizonsShadowMigrationGateVersion;
  shadowGateProfile: AtlasStrictHorizonsShadowMigrationGateProfile;
  status: AtlasStrictHorizonsShadowMigrationGateStatus;
  classification: AtlasStrictHorizonsShadowMigrationGateClassification;
  strictBlocker: string;
  shadowGateCount: number;
  completedShadowGateCount: number;
  lockAudits: readonly AtlasStrictHorizonsShadowMigrationGateLockAudit[];
  shadowGateRows: readonly AtlasStrictHorizonsShadowMigrationGateRow[];
  readyShadowGateId: AtlasStrictHorizonsShadowMigrationGateRowId | "";
  strictBudgetPositionRmsKm: number;
  strictBudgetVelocityRmsMs: number;
  strictBudgetMercuryRatio: number;
  defaultStrictFixtureMutation: "not-applied";
  defaultStrictCommandMutation: "not-applied";
  shadowGateCommandMutation: "not-applied";
  defaultScientificGateMutation: "not-applied";
  referenceFixtureAdoptionMutation: "not-applied";
  budgetMutation: "not-applied";
  physicsMutation: "not-applied";
  workerPhysicsMutation: "not-applied";
  rk4DefaultMutation: "not-applied";
  eihOnePnMutation: "not-applied";
  skyAssetMutation: "not-applied";
  materialMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  scientificCertificationStatus: "shadow-only-default-gate-blocked";
  trustedBoundary: string;
};

export type AtlasDefaultStrictHorizonsMigrationVersion =
  "v89-default-strict-horizons-scientific-gate-migration";
export type AtlasDefaultStrictHorizonsMigrationProfile =
  "v89-apply-barycentric-reference-default-gate";
export type AtlasDefaultStrictHorizonsMigrationStatus =
  | "pending-runtime-run"
  | "ready-default-gate-migrated"
  | "ready-migration-blocked"
  | "ready-legacy-v75-blocker-preserved";
export type AtlasDefaultStrictHorizonsMigrationClassification =
  | "default-gate-migrated-shadow-provenance"
  | "shadow-gate-regression"
  | "default-command-not-migrated"
  | "legacy-audit-regression"
  | "budget-regression"
  | "fixture-regression"
  | "mixed";
export type AtlasDefaultStrictHorizonsMigrationRowId =
  "v89-apply-v88-shadow-to-default-strict-gate";
export type AtlasDefaultStrictHorizonsMigrationLockAuditId =
  | "v88-shadow-gate-lock"
  | "default-scientific-command-lock"
  | "legacy-v75-command-lock"
  | "v75-budget-lock"
  | "v84-reference-fixture-provenance"
  | "legacy-v75-blocker-lock";
export type AtlasDefaultStrictHorizonsMigrationLockStatus =
  | "ready"
  | "blocked"
  | "regressed";
export type AtlasDefaultStrictHorizonsMigrationLockAudit = {
  id: AtlasDefaultStrictHorizonsMigrationLockAuditId;
  label: string;
  status: AtlasDefaultStrictHorizonsMigrationLockStatus;
  measured: string;
  expected: string;
  trustedBoundary: string;
};
export type AtlasDefaultStrictHorizonsMigrationRow = {
  id: AtlasDefaultStrictHorizonsMigrationRowId;
  label: string;
  sourceShadowGateId: AtlasStrictHorizonsShadowMigrationGateRowId;
  defaultScientificCommand: "npm run test:atlas:horizons-scientific-gate";
  legacyV75Command: "npm run test:atlas:horizons-scientific-gate:legacy-v75";
  previousDefaultFixturePath: "public/data/horizons-validation-j2000.json";
  migratedDefaultFixturePath: "public/data/horizons-validation-j2000-outer-system-barycenter-v84.json";
  migratedMassProfile: "de440-system-gm";
  migratedDtDays: 0.125;
  migratedSofteningAu: 0;
  status: "not-run" | "complete" | "blocked";
  migratedOnePnRmsPositionKm: number | null;
  migratedOnePnRmsVelocityMs: number | null;
  migratedMercuryOnePnToNewtonRatio: number | null;
  migratedBudgetStatus: "not-run" | "pass" | "fail";
  legacyV75Status: "expected-blocker-preserved" | "not-run" | "regressed";
  defaultScientificGateMigration: "applied-offline-gate-only";
};
export type AtlasDefaultStrictHorizonsMigrationSummary = {
  version: AtlasDefaultStrictHorizonsMigrationVersion;
  migrationProfile: AtlasDefaultStrictHorizonsMigrationProfile;
  status: AtlasDefaultStrictHorizonsMigrationStatus;
  classification: AtlasDefaultStrictHorizonsMigrationClassification;
  legacyStrictBlocker: string;
  migrationRowCount: number;
  completedMigrationRowCount: number;
  lockAudits: readonly AtlasDefaultStrictHorizonsMigrationLockAudit[];
  migrationRows: readonly AtlasDefaultStrictHorizonsMigrationRow[];
  readyMigrationRowId: AtlasDefaultStrictHorizonsMigrationRowId | "";
  strictBudgetPositionRmsKm: number;
  strictBudgetVelocityRmsMs: number;
  strictBudgetMercuryRatio: number;
  defaultScientificGateMigration: "applied-offline-gate-only";
  legacyV75AuditMutation: "not-applied";
  budgetMutation: "not-applied";
  physicsMutation: "not-applied";
  workerPhysicsMutation: "not-applied";
  rk4DefaultMutation: "not-applied";
  eihOnePnMutation: "not-applied";
  skyAssetMutation: "not-applied";
  backgroundMutation: "not-applied";
  materialMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  scientificCertificationStatus: "offline-gate-migrated-not-nasa-jpl-certified";
  trustedBoundary: string;
};

export type AtlasHorizonsProvenanceFreezeVersion =
  "v90-horizons-provenance-freeze";
export type AtlasHorizonsProvenanceFreezeProfile =
  "v90-default-gate-command-fixture-hash-lock";
export type AtlasHorizonsProvenanceFreezeStatus =
  | "pending-runtime-run"
  | "ready-freeze-locked"
  | "ready-freeze-blocked"
  | "ready-legacy-audit-preserved";
export type AtlasHorizonsProvenanceFreezeClassification =
  | "freeze-lock-pass"
  | "command-ownership-regression"
  | "fixture-hash-regression"
  | "fixture-provenance-regression"
  | "budget-regression"
  | "legacy-audit-regression"
  | "docs-boundary-regression"
  | "mixed";
export type AtlasHorizonsProvenanceFreezeRowId =
  "v90-freeze-v89-default-strict-gate-contract";
export type AtlasHorizonsProvenanceFreezeLockAuditId =
  | "default-scientific-command-lock"
  | "legacy-v75-command-lock"
  | "verify-scientific-command-lock"
  | "migrated-fixture-hash-lock"
  | "legacy-fixture-hash-lock"
  | "migrated-fixture-provenance-lock"
  | "v75-budget-lock"
  | "v89-default-migration-lock"
  | "legacy-v75-blocker-lock"
  | "docs-boundary-lock";
export type AtlasHorizonsProvenanceFreezeLockStatus =
  | "ready"
  | "blocked"
  | "regressed";
export type AtlasHorizonsProvenanceFreezeLockAudit = {
  id: AtlasHorizonsProvenanceFreezeLockAuditId;
  label: string;
  status: AtlasHorizonsProvenanceFreezeLockStatus;
  measured: string;
  expected: string;
  trustedBoundary: string;
};
export type AtlasHorizonsProvenanceFreezeRow = {
  id: AtlasHorizonsProvenanceFreezeRowId;
  label: string;
  defaultScientificCommand: "npm run test:atlas:horizons-scientific-gate";
  legacyV75Command: "npm run test:atlas:horizons-scientific-gate:legacy-v75";
  verifyScientificCommand: "npm run verify:atlas && npm run test:atlas:horizons-scientific-gate && npm run test:atlas:browser:fresh";
  migratedFixturePath: "public/data/horizons-validation-j2000-outer-system-barycenter-v84.json";
  migratedFixtureSha256: string;
  migratedFixtureSizeBytes: 21863;
  migratedFixtureVariant: "v84-outer-system-barycenter-reference";
  migratedTargetProvenanceRows: 12;
  legacyFixturePath: "public/data/horizons-validation-j2000.json";
  legacyFixtureSha256: string;
  legacyFixtureSizeBytes: 14678;
  status: "not-run" | "complete" | "blocked";
  fixtureHashStatus: "not-run" | "pass" | "fail";
  commandOwnershipStatus: "not-run" | "pass" | "fail";
  budgetLockStatus: "not-run" | "pass" | "fail";
  legacyAuditStatus: "not-run" | "expected-blocker-preserved" | "regressed";
  docsBoundaryStatus: "not-run" | "pass" | "fail";
  provenanceFreeze: "applied-offline-contract-only";
};
export type AtlasHorizonsProvenanceFreezeSummary = {
  version: AtlasHorizonsProvenanceFreezeVersion;
  freezeProfile: AtlasHorizonsProvenanceFreezeProfile;
  status: AtlasHorizonsProvenanceFreezeStatus;
  classification: AtlasHorizonsProvenanceFreezeClassification;
  freezeRowCount: number;
  completedFreezeRowCount: number;
  lockAudits: readonly AtlasHorizonsProvenanceFreezeLockAudit[];
  freezeRows: readonly AtlasHorizonsProvenanceFreezeRow[];
  readyFreezeRowId: AtlasHorizonsProvenanceFreezeRowId | "";
  strictBudgetPositionRmsKm: number;
  strictBudgetVelocityRmsMs: number;
  strictBudgetMercuryRatio: number;
  provenanceFreeze: "applied-offline-contract-only";
  defaultGateConfigMutation: "not-applied";
  legacyAuditMutation: "not-applied";
  budgetMutation: "not-applied";
  physicsMutation: "not-applied";
  workerPhysicsMutation: "not-applied";
  rk4DefaultMutation: "not-applied";
  eihOnePnMutation: "not-applied";
  skyAssetMutation: "not-applied";
  backgroundMutation: "not-applied";
  materialMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  scientificCertificationStatus: "offline-gate-frozen-not-nasa-jpl-certified";
  trustedBoundary: string;
};

export type AtlasOfflineRuntimeBoundaryAuditVersion =
  "v91-offline-runtime-boundary-audit";
export type AtlasOfflineRuntimeBoundaryAuditProfile =
  "v91-scientific-gate-runtime-boundary-lock";
export type AtlasOfflineRuntimeBoundaryAuditStatus =
  | "pending-runtime-run"
  | "ready-boundary-locked"
  | "ready-boundary-blocked"
  | "ready-runtime-claims-clean";
export type AtlasOfflineRuntimeBoundaryAuditClassification =
  | "offline-runtime-boundary-pass"
  | "runtime-claim-regression"
  | "live-physics-mutation-regression"
  | "scientific-certification-claim-regression"
  | "browser-surface-regression"
  | "docs-boundary-regression"
  | "mixed";
export type AtlasOfflineRuntimeBoundaryAuditRowId =
  "v91-lock-offline-scientific-gate-runtime-boundary";
export type AtlasOfflineRuntimeBoundaryAuditLockAuditId =
  | "v90-provenance-freeze-lock"
  | "command-ownership-lock"
  | "docs-boundary-lock"
  | "browser-surface-lock"
  | "runtime-claim-lock"
  | "scientific-certification-claim-lock"
  | "protected-mutation-lock";
export type AtlasOfflineRuntimeBoundaryAuditLockStatus =
  | "ready"
  | "blocked"
  | "regressed";
export type AtlasOfflineRuntimeBoundaryAuditLockAudit = {
  id: AtlasOfflineRuntimeBoundaryAuditLockAuditId;
  label: string;
  status: AtlasOfflineRuntimeBoundaryAuditLockStatus;
  measured: string;
  expected: string;
  trustedBoundary: string;
};
export type AtlasOfflineRuntimeBoundaryAuditRow = {
  id: AtlasOfflineRuntimeBoundaryAuditRowId;
  label: string;
  defaultScientificCommand: "npm run test:atlas:horizons-scientific-gate";
  legacyV75Command: "npm run test:atlas:horizons-scientific-gate:legacy-v75";
  provenanceFreezeCommand: "npm run test:atlas:horizons-provenance-freeze";
  verifyScientificCommand: "npm run verify:atlas && npm run test:atlas:horizons-scientific-gate && npm run test:atlas:browser:fresh";
  status: "not-run" | "complete" | "blocked";
  commandBoundaryStatus: "not-run" | "pass" | "fail";
  docsBoundaryStatus: "not-run" | "pass" | "fail";
  browserSurfaceStatus: "not-run" | "pass" | "fail";
  runtimeClaimStatus: "not-run" | "pass" | "fail";
  scientificCertificationClaimStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
  offlineRuntimeBoundaryAudit: "applied-contract-only";
};
export type AtlasOfflineRuntimeBoundaryAuditSummary = {
  version: AtlasOfflineRuntimeBoundaryAuditVersion;
  boundaryProfile: AtlasOfflineRuntimeBoundaryAuditProfile;
  status: AtlasOfflineRuntimeBoundaryAuditStatus;
  classification: AtlasOfflineRuntimeBoundaryAuditClassification;
  boundaryRowCount: number;
  completedBoundaryRowCount: number;
  lockAudits: readonly AtlasOfflineRuntimeBoundaryAuditLockAudit[];
  boundaryRows: readonly AtlasOfflineRuntimeBoundaryAuditRow[];
  readyBoundaryRowId: AtlasOfflineRuntimeBoundaryAuditRowId | "";
  strictBudgetPositionRmsKm: number;
  strictBudgetVelocityRmsMs: number;
  strictBudgetMercuryRatio: number;
  offlineRuntimeBoundaryAudit: "applied-contract-only";
  defaultGateConfigMutation: "not-applied";
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
  certificationClaimMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  scientificCertificationStatus: "offline-gate-frozen-not-nasa-jpl-certified";
  trustedBoundary: string;
};

export type AtlasScientificGateMaintenanceRunbookVersion =
  "v92-scientific-gate-maintenance-runbook-lock";
export type AtlasScientificGateMaintenanceRunbookProfile =
  "v92-offline-gate-release-rollback-command-runbook";
export type AtlasScientificGateMaintenanceRunbookStatus =
  | "pending-runtime-run"
  | "ready-runbook-locked"
  | "ready-runbook-blocked"
  | "ready-rollback-audit-preserved";
export type AtlasScientificGateMaintenanceRunbookClassification =
  | "maintenance-runbook-pass"
  | "command-ownership-regression"
  | "provenance-freeze-regression"
  | "offline-runtime-boundary-regression"
  | "rollback-contract-regression"
  | "docs-runbook-regression"
  | "browser-surface-regression"
  | "mixed";
export type AtlasScientificGateMaintenanceRunbookRowId =
  "v92-lock-offline-scientific-gate-maintenance-runbook";
export type AtlasScientificGateMaintenanceRunbookAuditId =
  | "v91-offline-runtime-boundary-lock"
  | "v90-provenance-freeze-lock"
  | "command-ownership-lock"
  | "rollback-contract-lock"
  | "docs-runbook-lock"
  | "browser-surface-lock"
  | "protected-mutation-lock";
export type AtlasScientificGateMaintenanceRunbookAuditStatus =
  | "ready"
  | "blocked"
  | "regressed";
export type AtlasScientificGateMaintenanceRunbookAudit = {
  id: AtlasScientificGateMaintenanceRunbookAuditId;
  label: string;
  status: AtlasScientificGateMaintenanceRunbookAuditStatus;
  measured: string;
  expected: string;
  trustedBoundary: string;
};
export type AtlasScientificGateMaintenanceRunbookRow = {
  id: AtlasScientificGateMaintenanceRunbookRowId;
  label: string;
  productFullCommand: "npm run verify:atlas:full";
  currentScientificCommand: "npm run verify:atlas:scientific";
  migratedStrictGateCommand: "npm run test:atlas:horizons-scientific-gate";
  legacyV75AuditCommand: "npm run test:atlas:horizons-scientific-gate:legacy-v75";
  provenanceFreezeCommand: "npm run test:atlas:horizons-provenance-freeze";
  offlineRuntimeBoundaryCommand: "npm run test:atlas:offline-runtime-boundary";
  expectedInterpretation: "migrated-scientific-gate-passes-legacy-v75-is-rollback-audit-only";
  status: "not-run" | "complete" | "blocked";
  commandOwnershipStatus: "not-run" | "pass" | "fail";
  provenanceFreezeStatus: "not-run" | "pass" | "fail";
  offlineRuntimeBoundaryStatus: "not-run" | "pass" | "fail";
  rollbackContractStatus: "not-run" | "pass" | "fail";
  docsRunbookStatus: "not-run" | "pass" | "fail";
  browserSurfaceStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
  scientificGateMaintenanceRunbook: "applied-contract-only";
};
export type AtlasScientificGateMaintenanceRunbookSummary = {
  version: AtlasScientificGateMaintenanceRunbookVersion;
  runbookProfile: AtlasScientificGateMaintenanceRunbookProfile;
  status: AtlasScientificGateMaintenanceRunbookStatus;
  classification: AtlasScientificGateMaintenanceRunbookClassification;
  runbookRowCount: number;
  completedRunbookRowCount: number;
  audits: readonly AtlasScientificGateMaintenanceRunbookAudit[];
  runbookRows: readonly AtlasScientificGateMaintenanceRunbookRow[];
  readyRunbookRowId: AtlasScientificGateMaintenanceRunbookRowId | "";
  strictBudgetPositionRmsKm: number;
  strictBudgetVelocityRmsMs: number;
  strictBudgetMercuryRatio: number;
  migratedDefaultFixturePath: "public/data/horizons-validation-j2000-outer-system-barycenter-v84.json";
  legacyV75FixturePath: "public/data/horizons-validation-j2000.json";
  scientificGateMaintenanceRunbook: "applied-contract-only";
  defaultGateConfigMutation: "not-applied";
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
  certificationClaimMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  scientificCertificationStatus: "offline-gate-maintenance-runbook-not-nasa-jpl-certified";
  trustedBoundary: string;
};

export type AtlasScientificGateReleaseEvidenceVersion =
  "v93-scientific-gate-release-evidence-lock";
export type AtlasScientificGateReleaseEvidenceProfile =
  "v93-offline-gate-release-evidence-bundle";
export type AtlasScientificGateReleaseEvidenceStatus =
  | "pending-runtime-run"
  | "ready-release-evidence-locked"
  | "ready-release-evidence-blocked"
  | "ready-release-verification-matrix-locked";
export type AtlasScientificGateReleaseEvidenceClassification =
  | "release-evidence-pass"
  | "runbook-regression"
  | "provenance-freeze-regression"
  | "offline-runtime-boundary-regression"
  | "command-ownership-regression"
  | "browser-evidence-regression"
  | "docs-evidence-regression"
  | "mixed";
export type AtlasScientificGateReleaseEvidenceRowId =
  "v93-lock-offline-scientific-gate-release-evidence";
export type AtlasScientificGateReleaseEvidenceAuditId =
  | "v92-runbook-lock"
  | "v91-offline-runtime-boundary-lock"
  | "v90-provenance-freeze-lock"
  | "command-evidence-matrix-lock"
  | "fixture-evidence-lock"
  | "docs-evidence-lock"
  | "browser-evidence-lock"
  | "protected-mutation-lock";
export type AtlasScientificGateReleaseEvidenceAuditStatus =
  | "ready"
  | "blocked"
  | "regressed";
export type AtlasScientificGateReleaseEvidenceAudit = {
  id: AtlasScientificGateReleaseEvidenceAuditId;
  label: string;
  status: AtlasScientificGateReleaseEvidenceAuditStatus;
  measured: string;
  expected: string;
  trustedBoundary: string;
};
export type AtlasScientificGateReleaseEvidenceRow = {
  id: AtlasScientificGateReleaseEvidenceRowId;
  label: string;
  productFullCommand: "npm run verify:atlas:full";
  scientificVerifyCommand: "npm run verify:atlas:scientific";
  maintenanceRunbookCommand: "npm run test:atlas:scientific-gate-runbook";
  provenanceFreezeCommand: "npm run test:atlas:horizons-provenance-freeze";
  offlineRuntimeBoundaryCommand: "npm run test:atlas:offline-runtime-boundary";
  migratedStrictGateCommand: "npm run test:atlas:horizons-scientific-gate";
  legacyV75AuditCommand: "npm run test:atlas:horizons-scientific-gate:legacy-v75";
  expectedInterpretation: "migrated-scientific-gate-passes-legacy-v75-is-rollback-audit-only";
  migratedFixturePath: "public/data/horizons-validation-j2000-outer-system-barycenter-v84.json";
  migratedFixtureSha256: "0610A69D32B0BEAB829C70AEC7034CA0E45ADF420631A5FC13B9E0E2EE58D62D";
  migratedFixtureSizeBytes: 21863;
  migratedFixtureVariant: "v84-outer-system-barycenter-reference";
  migratedTargetProvenanceRows: 12;
  legacyFixturePath: "public/data/horizons-validation-j2000.json";
  legacyFixtureSha256: "7ACFF5ED1BEB284CF40DFE905B60ACFDE009E5EE5CE1787085353BD03DA5FD1B";
  legacyFixtureSizeBytes: 14678;
  status: "not-run" | "complete" | "blocked";
  runbookStatus: "not-run" | "pass" | "fail";
  provenanceFreezeStatus: "not-run" | "pass" | "fail";
  offlineRuntimeBoundaryStatus: "not-run" | "pass" | "fail";
  commandMatrixStatus: "not-run" | "pass" | "fail";
  fixtureEvidenceStatus: "not-run" | "pass" | "fail";
  docsEvidenceStatus: "not-run" | "pass" | "fail";
  browserEvidenceStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
  scientificGateReleaseEvidence: "applied-contract-only";
};
export type AtlasScientificGateReleaseEvidenceSummary = {
  version: AtlasScientificGateReleaseEvidenceVersion;
  releaseEvidenceProfile: AtlasScientificGateReleaseEvidenceProfile;
  status: AtlasScientificGateReleaseEvidenceStatus;
  classification: AtlasScientificGateReleaseEvidenceClassification;
  releaseEvidenceRowCount: number;
  completedReleaseEvidenceRowCount: number;
  audits: readonly AtlasScientificGateReleaseEvidenceAudit[];
  releaseEvidenceRows: readonly AtlasScientificGateReleaseEvidenceRow[];
  readyReleaseEvidenceRowId: AtlasScientificGateReleaseEvidenceRowId | "";
  strictBudgetPositionRmsKm: number;
  strictBudgetVelocityRmsMs: number;
  strictBudgetMercuryRatio: number;
  migratedDefaultFixturePath: "public/data/horizons-validation-j2000-outer-system-barycenter-v84.json";
  legacyV75FixturePath: "public/data/horizons-validation-j2000.json";
  migratedFixtureSha256: "0610A69D32B0BEAB829C70AEC7034CA0E45ADF420631A5FC13B9E0E2EE58D62D";
  legacyFixtureSha256: "7ACFF5ED1BEB284CF40DFE905B60ACFDE009E5EE5CE1787085353BD03DA5FD1B";
  scientificGateReleaseEvidence: "applied-contract-only";
  defaultGateConfigMutation: "not-applied";
  legacyAuditConfigMutation: "not-applied";
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
  certificationClaimMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  scientificCertificationStatus: "offline-gate-release-evidence-not-nasa-jpl-certified";
  trustedBoundary: string;
};

export type AtlasBrowserCiStabilityLockVersion = "v94-browser-ci-stability-lock";
export type AtlasBrowserCiStabilityLockProfile = "v94-fresh-browser-ci-runtime-stability";
export type AtlasBrowserCiStabilityLockStatus =
  | "pending-runtime-run"
  | "ready-browser-ci-locked"
  | "ready-browser-ci-blocked"
  | "ready-fresh-teardown-preserved";
export type AtlasBrowserCiStabilityLockClassification =
  | "browser-ci-stability-pass"
  | "screenshot-retry-regression"
  | "pixel-settle-regression"
  | "fresh-server-regression"
  | "command-ownership-regression"
  | "docs-boundary-regression"
  | "mixed";
export type AtlasBrowserCiStabilityLockRowId = "v94-lock-fresh-browser-ci-stability";
export type AtlasBrowserCiStabilityLockAuditId =
  | "v93-release-evidence-lock"
  | "screenshot-retry-lock"
  | "pixel-settle-lock"
  | "fresh-server-lock"
  | "command-ownership-lock"
  | "docs-boundary-lock"
  | "surface-contract-lock"
  | "protected-mutation-lock";
export type AtlasBrowserCiStabilityLockAuditStatus =
  | "ready"
  | "blocked"
  | "regressed";
export type AtlasBrowserCiStabilityLockAudit = {
  id: AtlasBrowserCiStabilityLockAuditId;
  label: string;
  status: AtlasBrowserCiStabilityLockAuditStatus;
  measured: string;
  expected: string;
  trustedBoundary: string;
};
export type AtlasBrowserCiStabilityLockRow = {
  id: AtlasBrowserCiStabilityLockRowId;
  label: string;
  browserFreshCommand: "npm run test:atlas:browser:fresh";
  browserCiStabilityCommand: "npm run test:atlas:browser-ci-stability";
  productFullCommand: "npm run verify:atlas:full";
  scientificVerifyCommand: "npm run verify:atlas:scientific";
  freshBrowserPort: 3015;
  screenshotRetryAttempts: 3;
  pixelSettleAttempts: 4;
  watchpackWarningPolicy: "known-windows-noise-non-failing";
  status: "not-run" | "complete" | "blocked";
  releaseEvidenceStatus: "not-run" | "pass" | "fail";
  screenshotRetryStatus: "not-run" | "pass" | "fail";
  pixelSettleStatus: "not-run" | "pass" | "fail";
  freshServerStatus: "not-run" | "pass" | "fail";
  commandOwnershipStatus: "not-run" | "pass" | "fail";
  docsBoundaryStatus: "not-run" | "pass" | "fail";
  surfaceContractStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
  browserCiStabilityLock: "applied-contract-only";
};
export type AtlasBrowserCiStabilityLockSummary = {
  version: AtlasBrowserCiStabilityLockVersion;
  stabilityProfile: AtlasBrowserCiStabilityLockProfile;
  status: AtlasBrowserCiStabilityLockStatus;
  classification: AtlasBrowserCiStabilityLockClassification;
  stabilityRowCount: number;
  completedStabilityRowCount: number;
  audits: readonly AtlasBrowserCiStabilityLockAudit[];
  stabilityRows: readonly AtlasBrowserCiStabilityLockRow[];
  readyStabilityRowId: AtlasBrowserCiStabilityLockRowId | "";
  browserFreshCommand: "npm run test:atlas:browser:fresh";
  browserCiStabilityCommand: "npm run test:atlas:browser-ci-stability";
  freshBrowserPort: 3015;
  screenshotRetryAttempts: 3;
  pixelSettleAttempts: 4;
  watchpackWarningPolicy: "known-windows-noise-non-failing";
  browserCiStabilityLock: "applied-contract-only";
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
  certificationClaimMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  scientificCertificationStatus: "browser-ci-stability-lock-not-nasa-jpl-certified";
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

export type AtlasFinalMaintenanceBaselineVersion = "v96-final-maintenance-baseline";
export type AtlasFinalMaintenanceBaselineProfile =
  "v96-final-offline-maintenance-baseline";
export type AtlasFinalMaintenanceBaselineStatus =
  | "pending-runtime-run"
  | "ready-maintenance-baseline-locked"
  | "ready-maintenance-baseline-blocked"
  | "ready-post-baseline-boundary-locked";
export type AtlasFinalMaintenanceBaselineClassification =
  | "final-maintenance-baseline-pass"
  | "full-verify-regression"
  | "scientific-verify-regression"
  | "artifact-manifest-regression"
  | "browser-ci-regression"
  | "scientific-gate-regression"
  | "docs-baseline-regression"
  | "protected-mutation-regression"
  | "mixed";
export type AtlasFinalMaintenanceBaselineRowId =
  "v96-lock-final-maintenance-baseline";
export type AtlasFinalMaintenanceBaselineAuditId =
  | "v95-release-artifact-manifest-lock"
  | "product-full-verify-entrypoint-lock"
  | "scientific-verify-entrypoint-lock"
  | "scientific-gate-chain-lock"
  | "post-baseline-policy-lock"
  | "docs-baseline-lock"
  | "browser-surface-lock"
  | "protected-mutation-lock";
export type AtlasFinalMaintenanceBaselineAuditStatus =
  | "ready"
  | "blocked"
  | "regressed";
export type AtlasFinalMaintenanceBaselineAudit = {
  id: AtlasFinalMaintenanceBaselineAuditId;
  label: string;
  status: AtlasFinalMaintenanceBaselineAuditStatus;
  measured: string;
  expected: string;
  trustedBoundary: string;
};
export type AtlasFinalMaintenanceBaselineRow = {
  id: AtlasFinalMaintenanceBaselineRowId;
  label: string;
  productFullCommand: "npm run verify:atlas:full";
  scientificVerifyCommand: "npm run verify:atlas:scientific";
  releaseArtifactManifestCommand: "npm run test:atlas:release-artifact-manifest";
  browserCiStabilityCommand: "npm run test:atlas:browser-ci-stability";
  releaseEvidenceCommand: "npm run test:atlas:scientific-gate-release-evidence";
  maintenanceRunbookCommand: "npm run test:atlas:scientific-gate-runbook";
  provenanceFreezeCommand: "npm run test:atlas:horizons-provenance-freeze";
  offlineRuntimeBoundaryCommand: "npm run test:atlas:offline-runtime-boundary";
  migratedStrictGateCommand: "npm run test:atlas:horizons-scientific-gate";
  legacyV75AuditCommand: "npm run test:atlas:horizons-scientific-gate:legacy-v75";
  browserFreshCommand: "npm run test:atlas:browser:fresh";
  finalBaselinePolicy: "post-v96-scientific-mainline-requires-intentional-upgrade";
  status: "not-run" | "complete" | "blocked";
  artifactManifestStatus: "not-run" | "pass" | "fail";
  productFullEntrypointStatus: "not-run" | "pass" | "fail";
  scientificVerifyEntrypointStatus: "not-run" | "pass" | "fail";
  scientificGateChainStatus: "not-run" | "pass" | "fail";
  postBaselinePolicyStatus: "not-run" | "pass" | "fail";
  docsBaselineStatus: "not-run" | "pass" | "fail";
  browserSurfaceStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
  finalMaintenanceBaseline: "applied-contract-only";
};
export type AtlasFinalMaintenanceBaselineSummary = {
  version: AtlasFinalMaintenanceBaselineVersion;
  maintenanceBaselineProfile: AtlasFinalMaintenanceBaselineProfile;
  status: AtlasFinalMaintenanceBaselineStatus;
  classification: AtlasFinalMaintenanceBaselineClassification;
  baselineRowCount: number;
  completedBaselineRowCount: number;
  audits: readonly AtlasFinalMaintenanceBaselineAudit[];
  baselineRows: readonly AtlasFinalMaintenanceBaselineRow[];
  readyBaselineRowId: AtlasFinalMaintenanceBaselineRowId | "";
  productFullCommand: "npm run verify:atlas:full";
  scientificVerifyCommand: "npm run verify:atlas:scientific";
  releaseArtifactManifestCommand: "npm run test:atlas:release-artifact-manifest";
  browserCiStabilityCommand: "npm run test:atlas:browser-ci-stability";
  releaseEvidenceCommand: "npm run test:atlas:scientific-gate-release-evidence";
  maintenanceRunbookCommand: "npm run test:atlas:scientific-gate-runbook";
  provenanceFreezeCommand: "npm run test:atlas:horizons-provenance-freeze";
  offlineRuntimeBoundaryCommand: "npm run test:atlas:offline-runtime-boundary";
  migratedStrictGateCommand: "npm run test:atlas:horizons-scientific-gate";
  legacyV75AuditCommand: "npm run test:atlas:horizons-scientific-gate:legacy-v75";
  browserFreshCommand: "npm run test:atlas:browser:fresh";
  finalBaselinePolicy: "post-v96-scientific-mainline-requires-intentional-upgrade";
  finalMaintenanceBaseline: "applied-contract-only";
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
  scientificCertificationStatus: "final-maintenance-baseline-not-nasa-jpl-certified";
  trustedBoundary: string;
};

export type AtlasGaiaStarfieldEnhancementVersion = "v97-gaia-starfield-enhancement";
export type AtlasGaiaStarfieldEnhancementProfile =
  "v97-gaia-constellation-nebula-overlay";
export type AtlasGaiaStarfieldEnhancementStatus =
  | "pending-runtime-run"
  | "ready-gaia-overlay-locked"
  | "ready-gaia-overlay-blocked"
  | "ready-visual-overlay-budgeted";
export type AtlasGaiaStarfieldEnhancementClassification =
  | "gaia-overlay-pass"
  | "gaia-catalog-regression"
  | "constellation-catalog-regression"
  | "nebula-catalog-regression"
  | "overlay-budget-regression"
  | "v9-sky-boundary-regression"
  | "protected-mutation-regression"
  | "mixed";
export type AtlasGaiaStarfieldEnhancementQualityTier = "mobile" | "balanced" | "dense";
export type AtlasGaiaStarfieldEnhancementRowId =
  "v97-lock-gaia-starfield-enhancement";
export type AtlasGaiaStarfieldEnhancementAuditId =
  | "gaia-catalog-lock"
  | "constellation-catalog-lock"
  | "nebula-catalog-lock"
  | "overlay-budget-lock"
  | "v9-sky-boundary-lock"
  | "docs-overlay-lock"
  | "browser-surface-lock"
  | "protected-mutation-lock";
export type AtlasGaiaStarfieldEnhancementAuditStatus =
  | "ready"
  | "blocked"
  | "regressed";
export type AtlasGaiaStarfieldEnhancementAudit = {
  id: AtlasGaiaStarfieldEnhancementAuditId;
  label: string;
  status: AtlasGaiaStarfieldEnhancementAuditStatus;
  measured: string;
  expected: string;
  trustedBoundary: string;
};
export type AtlasGaiaStarfieldEnhancementBudget = {
  mobile: 1000;
  balanced: 1800;
  dense: 3000;
};
export type AtlasGaiaStarfieldEnhancementRow = {
  id: AtlasGaiaStarfieldEnhancementRowId;
  label: string;
  gaiaCatalogUrl: "/data/gaia-dr3-bright-5000.json";
  gaiaKinematicsUrl: "/data/gaia-dr3-kinematics-2000.json";
  constellationContract: "iau-88-normalized-render-groups";
  nebulaContract: "curated-local-nebula-presentation-markers";
  status: "not-run" | "complete" | "blocked";
  gaiaCatalogStatus: "not-run" | "pass" | "fail";
  constellationCatalogStatus: "not-run" | "pass" | "fail";
  nebulaCatalogStatus: "not-run" | "pass" | "fail";
  overlayBudgetStatus: "not-run" | "pass" | "fail";
  v9SkyBoundaryStatus: "not-run" | "pass" | "fail";
  docsOverlayStatus: "not-run" | "pass" | "fail";
  browserSurfaceStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
  gaiaStarfieldEnhancement: "applied-overlay-only";
};
export type AtlasGaiaStarfieldEnhancementSummary = {
  version: AtlasGaiaStarfieldEnhancementVersion;
  overlayProfile: AtlasGaiaStarfieldEnhancementProfile;
  status: AtlasGaiaStarfieldEnhancementStatus;
  classification: AtlasGaiaStarfieldEnhancementClassification;
  qualityTier: AtlasGaiaStarfieldEnhancementQualityTier;
  renderBudget: AtlasGaiaStarfieldEnhancementBudget;
  activeGaiaRenderBudget: number;
  packagedGaiaBrightRowCount: 5000;
  packagedGaiaKinematicsRowCount: 2000;
  normalizedIauConstellationCount: 88;
  constellationRenderGroupCount: number;
  nebulaMarkerCount: number;
  overlayRowCount: number;
  completedOverlayRowCount: number;
  audits: readonly AtlasGaiaStarfieldEnhancementAudit[];
  overlayRows: readonly AtlasGaiaStarfieldEnhancementRow[];
  readyOverlayRowId: AtlasGaiaStarfieldEnhancementRowId | "";
  defaultActivationPolicy: "sandbox-deep-space-and-orbit-atlas-dense";
  mobileDowngradePolicy: "mobile-uses-1000-star-budget";
  closeupSuppressionPolicy: "selected-body-closeup-opacity-suppressed";
  fullGaiaArchivePolicy: "not-full-gaia-archive";
  officialCertificationPolicy: "not-gaia-nasa-jpl-certified";
  gaiaStarfieldEnhancement: "applied-overlay-only";
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

export type AtlasRelativitySimulationOptimizationVersion =
  "v98-relativity-simulation-optimization";
export type AtlasRelativitySimulationOptimizationProfile =
  "v98-relativity-observability-teaching-layer";
export type AtlasRelativitySimulationOptimizationStatus =
  | "pending-runtime-run"
  | "ready-relativity-optimization-locked"
  | "ready-relativity-optimization-blocked"
  | "ready-teaching-overlay-budgeted";
export type AtlasRelativitySimulationOptimizationClassification =
  | "relativity-optimization-pass"
  | "observable-atlas-regression"
  | "kerr-studio-regression"
  | "weak-field-readout-regression"
  | "performance-hud-regression"
  | "protected-physics-regression"
  | "docs-surface-regression"
  | "mixed";
export type AtlasRelativitySimulationOptimizationRowId =
  "v98-lock-relativity-simulation-optimization";
export type AtlasRelativitySimulationOptimizationAuditId =
  | "observable-atlas-lock"
  | "kerr-studio-lock"
  | "weak-field-readout-lock"
  | "performance-hud-lock"
  | "docs-surface-lock"
  | "protected-physics-lock";
export type AtlasRelativitySimulationOptimizationAuditStatus =
  | "ready"
  | "blocked"
  | "regressed";
export type AtlasRelativitySimulationOptimizationAudit = {
  id: AtlasRelativitySimulationOptimizationAuditId;
  label: string;
  status: AtlasRelativitySimulationOptimizationAuditStatus;
  measured: string;
  expected: string;
  trustedBoundary: string;
};
export type AtlasRelativitySimulationOptimizationRow = {
  id: AtlasRelativitySimulationOptimizationRowId;
  label: string;
  status: "not-run" | "complete" | "blocked";
  observableAtlasStatus: "not-run" | "pass" | "fail";
  kerrStudioStatus: "not-run" | "pass" | "fail";
  weakFieldReadoutStatus: "not-run" | "pass" | "fail";
  performanceHudStatus: "not-run" | "pass" | "fail";
  docsSurfaceStatus: "not-run" | "pass" | "fail";
  protectedPhysicsStatus: "not-run" | "pass" | "fail";
  relativitySimulationOptimization: "applied-teaching-observability-only";
};
export type AtlasRelativitySimulationOptimizationSummary = {
  version: AtlasRelativitySimulationOptimizationVersion;
  optimizationProfile: AtlasRelativitySimulationOptimizationProfile;
  status: AtlasRelativitySimulationOptimizationStatus;
  classification: AtlasRelativitySimulationOptimizationClassification;
  observableAtlasVersion: RelativityObservableAtlasVersion;
  explainerVersion: RelativityObservableExplainerVersion;
  guidedTourVersion: RelativityGuidedTourVersion;
  verificationVersion: AtlasRelativityVerificationVersion;
  chartVersion: AtlasRelativityChartVersion;
  kerrStudioVersion: KerrRelativityStudioVersion;
  kerrKernelId: RelativityKernelId;
  weakFieldObservableCount: number;
  strongFieldReadoutCount: number;
  numericalHealthMetricCount: number;
  readyReadoutCount: number;
  readoutCount: number;
  rowCount: number;
  completedRowCount: number;
  audits: readonly AtlasRelativitySimulationOptimizationAudit[];
  rows: readonly AtlasRelativitySimulationOptimizationRow[];
  readyRowId: AtlasRelativitySimulationOptimizationRowId | "";
  teachingOverlayPolicy: "observable-atlas-and-kerr-studio-default";
  performanceHudPolicy: "optional-collapsed-read-only-main-canvas";
  scientificModelUpgradePolicy: "not-scientific-model-upgrade";
  relativitySimulationOptimization: "applied-teaching-observability-only";
  livePhysicsMutation: "not-applied";
  workerPhysicsMutation: "not-applied";
  rk4DefaultMutation: "not-applied";
  eihOnePnMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  skyAssetMutation: "not-applied";
  backgroundMutation: "not-applied";
  fixtureDataMutation: "not-applied";
  budgetMutation: "not-applied";
  defaultGateConfigMutation: "not-applied";
  certificationClaimMutation: "not-applied";
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

export type AtlasPostEnhancementMaintenanceBaselineVersion =
  "v100-post-enhancement-maintenance-baseline";
export type AtlasPostEnhancementMaintenanceBaselineProfile =
  "v100-v97-v99-visual-teaching-maintenance-lock";
export type AtlasPostEnhancementMaintenanceBaselineStatus =
  | "pending-runtime-run"
  | "ready-post-enhancement-baseline-locked"
  | "ready-post-enhancement-baseline-blocked"
  | "ready-post-enhancement-evidence-indexed";
export type AtlasPostEnhancementMaintenanceBaselineClassification =
  | "post-enhancement-baseline-pass"
  | "v96-baseline-regression"
  | "gaia-overlay-regression"
  | "relativity-observability-regression"
  | "art-polish-regression"
  | "browser-resource-regression"
  | "verification-entrypoint-regression"
  | "docs-surface-regression"
  | "protected-mutation-regression"
  | "mixed";
export type AtlasPostEnhancementMaintenanceBaselineRowId =
  "v100-lock-post-enhancement-maintenance-baseline";
export type AtlasPostEnhancementMaintenanceBaselineAuditId =
  | "v96-baseline-lock"
  | "v97-gaia-overlay-lock"
  | "v98-relativity-observability-lock"
  | "v99-art-polish-lock"
  | "browser-resource-lifecycle-lock"
  | "verification-entrypoint-lock"
  | "docs-surface-lock"
  | "protected-mutation-lock";
export type AtlasPostEnhancementMaintenanceBaselineAuditStatus =
  | "ready"
  | "blocked"
  | "regressed";
export type AtlasPostEnhancementMaintenanceBaselineAudit = {
  id: AtlasPostEnhancementMaintenanceBaselineAuditId;
  label: string;
  status: AtlasPostEnhancementMaintenanceBaselineAuditStatus;
  measured: string;
  expected: string;
  trustedBoundary: string;
};
export type AtlasPostEnhancementMaintenanceBaselineRow = {
  id: AtlasPostEnhancementMaintenanceBaselineRowId;
  label: string;
  status: "not-run" | "complete" | "blocked";
  finalBaselineStatus: "not-run" | "pass" | "fail";
  gaiaOverlayStatus: "not-run" | "pass" | "fail";
  relativityObservabilityStatus: "not-run" | "pass" | "fail";
  artPolishStatus: "not-run" | "pass" | "fail";
  browserResourceStatus: "not-run" | "pass" | "fail";
  verificationEntrypointStatus: "not-run" | "pass" | "fail";
  docsSurfaceStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
  postEnhancementBaseline: "applied-maintenance-lock-only";
};
export type AtlasPostEnhancementMaintenanceBaselineSummary = {
  version: AtlasPostEnhancementMaintenanceBaselineVersion;
  postEnhancementBaselineProfile: AtlasPostEnhancementMaintenanceBaselineProfile;
  status: AtlasPostEnhancementMaintenanceBaselineStatus;
  classification: AtlasPostEnhancementMaintenanceBaselineClassification;
  finalMaintenanceBaselineVersion: AtlasFinalMaintenanceBaselineVersion;
  gaiaEnhancementVersion: AtlasGaiaStarfieldEnhancementVersion;
  relativityOptimizationVersion: AtlasRelativitySimulationOptimizationVersion;
  artPolishVersion: AtlasArtPolishVersion;
  gaiaRenderBudget: AtlasGaiaStarfieldEnhancementBudget;
  artOpacityCaps: AtlasArtPolishOpacityCaps;
  rowCount: number;
  completedRowCount: number;
  audits: readonly AtlasPostEnhancementMaintenanceBaselineAudit[];
  rows: readonly AtlasPostEnhancementMaintenanceBaselineRow[];
  readyRowId: AtlasPostEnhancementMaintenanceBaselineRowId | "";
  focusedCommand: "npm run test:atlas:post-enhancement-baseline";
  postEnhancementVerifyCommand: "npm run verify:atlas:post-enhancement";
  scientificVerifyCommand: "npm run verify:atlas:scientific";
  browserFreshCommand: "npm run test:atlas:browser:fresh";
  finalMaintenanceBaselineCommand: "npm run test:atlas:final-maintenance-baseline";
  gaiaStarfieldEnhancementCommand: "npm run test:atlas:gaia-starfield-enhancement";
  relativitySimulationOptimizationCommand: "npm run test:atlas:relativity-simulation-optimization";
  artPolishCommand: "npm run test:atlas:art-polish";
  constellationCatalogPolicy: "normalized-88-iau-presentation-contract";
  nebulaMarkerPolicy: "curated-local-presentation-marker-only";
  relativityTeachingPolicy: "v98-teaching-observability-not-scientific-upgrade";
  browserResourcePolicy: "about-blank-unload-imagebitmap-close-screenshot-retry-3015-teardown-watchpack-noise";
  postEnhancementBaseline: "applied-maintenance-lock-only";
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
  performanceOptimizationMutation: "not-applied";
  certificationClaimMutation: "not-applied";
  trustedBoundary: string;
};

export type AtlasBrowserResourcePerformanceVersion =
  "v101-browser-resource-performance-lock";
export type AtlasBrowserResourcePerformanceProfile =
  "v101-fresh-browser-resource-performance";
export type AtlasBrowserResourcePerformanceStatus =
  | "pending-runtime-run"
  | "ready-browser-resource-performance-locked"
  | "ready-browser-resource-performance-blocked"
  | "ready-browser-resource-optimized";
export type AtlasBrowserResourcePerformanceClassification =
  | "browser-resource-performance-pass"
  | "v100-baseline-regression"
  | "screenshot-resource-regression"
  | "pixel-sampler-regression"
  | "fresh-teardown-regression"
  | "console-error-regression"
  | "docs-surface-regression"
  | "protected-mutation-regression"
  | "mixed";
export type AtlasBrowserResourcePerformanceRowId =
  "v101-lock-browser-resource-performance";
export type AtlasBrowserResourcePerformanceAuditId =
  | "v100-post-enhancement-baseline-lock"
  | "screenshot-resource-helper-lock"
  | "pixel-sampler-helper-lock"
  | "fresh-teardown-lock"
  | "console-error-observability-lock"
  | "docs-surface-lock"
  | "protected-mutation-lock";
export type AtlasBrowserResourcePerformanceAuditStatus =
  | "ready"
  | "blocked"
  | "regressed";
export type AtlasBrowserResourcePerformanceAudit = {
  id: AtlasBrowserResourcePerformanceAuditId;
  label: string;
  status: AtlasBrowserResourcePerformanceAuditStatus;
  measured: string;
  expected: string;
  trustedBoundary: string;
};
export type AtlasBrowserResourcePerformanceRow = {
  id: AtlasBrowserResourcePerformanceRowId;
  label: string;
  status: "not-run" | "complete" | "blocked";
  v100BaselineStatus: "not-run" | "pass" | "fail";
  screenshotResourceStatus: "not-run" | "pass" | "fail";
  pixelSamplerStatus: "not-run" | "pass" | "fail";
  freshTeardownStatus: "not-run" | "pass" | "fail";
  consoleErrorStatus: "not-run" | "pass" | "fail";
  docsSurfaceStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
  browserResourcePerformance: "applied-browser-acceptance-helper-resource-optimization";
};
export type AtlasBrowserResourcePerformanceSummary = {
  version: AtlasBrowserResourcePerformanceVersion;
  browserResourcePerformanceProfile: AtlasBrowserResourcePerformanceProfile;
  status: AtlasBrowserResourcePerformanceStatus;
  classification: AtlasBrowserResourcePerformanceClassification;
  postEnhancementBaselineVersion: AtlasPostEnhancementMaintenanceBaselineVersion;
  rowCount: number;
  completedRowCount: number;
  audits: readonly AtlasBrowserResourcePerformanceAudit[];
  rows: readonly AtlasBrowserResourcePerformanceRow[];
  readyRowId: AtlasBrowserResourcePerformanceRowId | "";
  focusedCommand: "npm run test:atlas:browser-resource-performance";
  browserResourceVerifyCommand: "npm run verify:atlas:browser-resource";
  browserFreshCommand: "npm run test:atlas:browser:fresh";
  postEnhancementBaselineCommand: "npm run test:atlas:post-enhancement-baseline";
  scientificVerifyCommand: "npm run verify:atlas:scientific";
  screenshotRetryPolicy: "three-attempt-page-screenshot-retry-preserved";
  pixelSamplerPolicy: "shared-imagebitmap-canvas-sampler-explicit-close-and-zero";
  pixelSettlePolicy: "four-attempt-pixel-settle-thresholds-preserved";
  freshTeardownPolicy: "fresh-3015-global-teardown-no-reuse-existing-server";
  consoleErrorPolicy: "console-and-page-errors-observed-as-empty-arrays";
  browserResourcePerformance: "applied-browser-acceptance-helper-resource-optimization";
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

export type AtlasMaintenanceEvidenceIndexVersion =
  "v102-maintenance-evidence-index";
export type AtlasMaintenanceEvidenceIndexProfile =
  "v102-v93-v101-maintenance-evidence-index";
export type AtlasMaintenanceEvidenceIndexStatus =
  | "pending-runtime-run"
  | "ready-maintenance-evidence-indexed"
  | "ready-maintenance-evidence-blocked"
  | "ready-repo-hygiene-policy-locked";
export type AtlasMaintenanceEvidenceIndexClassification =
  | "maintenance-evidence-index-pass"
  | "v101-regression"
  | "command-index-regression"
  | "dirty-worktree-policy-regression"
  | "watchpack-noise-policy-regression"
  | "browser-qa-index-regression"
  | "docs-surface-regression"
  | "protected-mutation-regression"
  | "mixed";
export type AtlasMaintenanceEvidenceIndexRowId =
  "v102-lock-maintenance-evidence-index";
export type AtlasMaintenanceEvidenceIndexAuditId =
  | "v101-browser-resource-performance-lock"
  | "command-index-lock"
  | "screenshot-artifact-index-lock"
  | "dirty-worktree-policy-lock"
  | "watchpack-noise-policy-lock"
  | "browser-qa-index-lock"
  | "docs-surface-lock"
  | "protected-mutation-lock";
export type AtlasMaintenanceEvidenceIndexAuditStatus =
  | "ready"
  | "blocked"
  | "regressed";
export type AtlasMaintenanceEvidenceIndexAudit = {
  id: AtlasMaintenanceEvidenceIndexAuditId;
  label: string;
  status: AtlasMaintenanceEvidenceIndexAuditStatus;
  measured: string;
  expected: string;
  trustedBoundary: string;
};
export type AtlasMaintenanceEvidenceIndexRow = {
  id: AtlasMaintenanceEvidenceIndexRowId;
  label: string;
  status: "not-run" | "complete" | "blocked";
  v101Status: "not-run" | "pass" | "fail";
  commandIndexStatus: "not-run" | "pass" | "fail";
  screenshotArtifactStatus: "not-run" | "pass" | "fail";
  dirtyWorktreePolicyStatus: "not-run" | "pass" | "fail";
  watchpackNoisePolicyStatus: "not-run" | "pass" | "fail";
  browserQaIndexStatus: "not-run" | "pass" | "fail";
  docsSurfaceStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
  maintenanceEvidenceIndex: "applied-maintenance-index-only";
};
export type AtlasMaintenanceEvidenceIndexSummary = {
  version: AtlasMaintenanceEvidenceIndexVersion;
  maintenanceEvidenceIndexProfile: AtlasMaintenanceEvidenceIndexProfile;
  status: AtlasMaintenanceEvidenceIndexStatus;
  classification: AtlasMaintenanceEvidenceIndexClassification;
  browserResourcePerformanceVersion: AtlasBrowserResourcePerformanceVersion;
  rowCount: number;
  completedRowCount: number;
  audits: readonly AtlasMaintenanceEvidenceIndexAudit[];
  rows: readonly AtlasMaintenanceEvidenceIndexRow[];
  readyRowId: AtlasMaintenanceEvidenceIndexRowId | "";
  focusedCommand: "npm run test:atlas:maintenance-evidence-index";
  maintenanceEvidenceVerifyCommand: "npm run verify:atlas:maintenance-evidence";
  browserResourceVerifyCommand: "npm run verify:atlas:browser-resource";
  postEnhancementVerifyCommand: "npm run verify:atlas:post-enhancement";
  scientificVerifyCommand: "npm run verify:atlas:scientific";
  commandIndexPolicy: "v93-v101-focused-and-verify-commands-indexed";
  screenshotArtifactPolicy: "v93-v95-v97-v101-browser-screenshot-directories-indexed";
  dirtyWorktreePolicy: "no-reset-no-revert-no-clean-no-stage-no-commit";
  watchpackNoisePolicy: "dumpstack-pagefile-known-non-failure-noise";
  browserQaPolicy: "root-observable-evidence-validation-console-errors-zero-teardown-clear";
  maintenanceEvidenceIndex: "applied-maintenance-index-only";
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

export type AtlasBrowserAcceptanceRuntimeCostVersion =
  "v104-browser-acceptance-runtime-cost-lock";
export type AtlasBrowserAcceptanceRuntimeCostProfile =
  "v104-fresh-browser-acceptance-cost-review";
export type AtlasBrowserAcceptanceRuntimeCostStatus =
  | "pending-runtime-run"
  | "ready-browser-acceptance-runtime-cost-locked"
  | "ready-browser-acceptance-runtime-cost-blocked"
  | "ready-browser-acceptance-runtime-cost-reduced";
export type AtlasBrowserAcceptanceRuntimeCostClassification =
  | "browser-acceptance-runtime-cost-pass"
  | "v103-regression"
  | "screenshot-workload-regression"
  | "marker-coverage-regression"
  | "fresh-teardown-regression"
  | "console-error-regression"
  | "budget-threshold-regression"
  | "docs-surface-regression"
  | "protected-mutation-regression"
  | "mixed";
export type AtlasBrowserAcceptanceRuntimeCostRowId =
  "v104-lock-browser-acceptance-runtime-cost";
export type AtlasBrowserAcceptanceRuntimeCostAuditId =
  | "v103-presentation-runtime-performance"
  | "screenshot-workload-lock"
  | "marker-coverage-lock"
  | "fresh-teardown-lock"
  | "console-error-lock"
  | "budget-threshold-lock"
  | "docs-surface-lock"
  | "protected-mutation-lock";
export type AtlasBrowserAcceptanceRuntimeCostAuditStatus =
  | "ready"
  | "blocked"
  | "regressed";
export type AtlasBrowserAcceptanceRuntimeCostAudit = {
  id: AtlasBrowserAcceptanceRuntimeCostAuditId;
  label: string;
  status: AtlasBrowserAcceptanceRuntimeCostAuditStatus;
  measured: string;
  expected: string;
  trustedBoundary: string;
};
export type AtlasBrowserAcceptanceRuntimeCostRow = {
  id: AtlasBrowserAcceptanceRuntimeCostRowId;
  label: string;
  status: "not-run" | "complete" | "blocked";
  v103Status: "not-run" | "pass" | "fail";
  screenshotWorkloadStatus: "not-run" | "pass" | "fail";
  markerCoverageStatus: "not-run" | "pass" | "fail";
  freshTeardownStatus: "not-run" | "pass" | "fail";
  consoleErrorStatus: "not-run" | "pass" | "fail";
  budgetThresholdStatus: "not-run" | "pass" | "fail";
  docsSurfaceStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
  browserAcceptanceRuntimeCost: "applied-browser-screenshot-manifest-split";
};
export type AtlasBrowserAcceptanceRuntimeCostSummary = {
  version: AtlasBrowserAcceptanceRuntimeCostVersion;
  browserAcceptanceRuntimeCostProfile: AtlasBrowserAcceptanceRuntimeCostProfile;
  status: AtlasBrowserAcceptanceRuntimeCostStatus;
  classification: AtlasBrowserAcceptanceRuntimeCostClassification;
  presentationRuntimePerformanceVersion: AtlasPresentationRuntimePerformanceVersion;
  rowCount: number;
  completedRowCount: number;
  audits: readonly AtlasBrowserAcceptanceRuntimeCostAudit[];
  rows: readonly AtlasBrowserAcceptanceRuntimeCostRow[];
  readyRowId: AtlasBrowserAcceptanceRuntimeCostRowId | "";
  focusedCommand: "npm run test:atlas:browser-acceptance-runtime-cost";
  browserAcceptanceRuntimeVerifyCommand: "npm run verify:atlas:browser-acceptance-runtime";
  defaultFreshCommand: "npm run test:atlas:browser:fresh";
  fullReviewCommand: "npm run test:atlas:browser:fresh:review";
  screenshotManifestPolicy: "default-current-plus-core-full-review-history";
  markerCoveragePolicy: "root-observable-evidence-validation-preserved";
  consoleErrorPolicy: "console-page-error-zero-preserved";
  freshTeardownPolicy: "fresh-3015-teardown-preserved";
  budgetThresholdPolicy: "browser-pixel-thresholds-retry-settle-preserved";
  watchpackNoisePolicy: "DumpStack.log.tmp-pagefile.sys-known-non-failure-noise";
  browserAcceptanceRuntimeCost: "applied-browser-screenshot-manifest-split";
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

export type AtlasFinalGaiaArtEnhancementVersion =
  "v105-final-gaia-art-enhancement-lock";
export type AtlasFinalGaiaArtEnhancementProfile =
  "v105-budget-preserved-gaia-art-polish";
export type AtlasFinalGaiaArtEnhancementStatus =
  | "pending-runtime-run"
  | "ready-final-gaia-art-locked"
  | "ready-final-gaia-art-blocked"
  | "ready-budget-preserved-gaia-enhanced";
export type AtlasFinalGaiaArtEnhancementClassification =
  | "final-gaia-art-pass"
  | "v104-regression"
  | "gaia-selection-regression"
  | "gaia-visual-mapping-regression"
  | "constellation-nebula-readability-regression"
  | "browser-qa-regression"
  | "budget-boundary-regression"
  | "docs-surface-regression"
  | "protected-mutation-regression"
  | "mixed";
export type AtlasFinalGaiaArtEnhancementRowId =
  "v105-lock-final-gaia-art-enhancement";
export type AtlasFinalGaiaArtEnhancementAuditId =
  | "v104-browser-acceptance-runtime-cost"
  | "gaia-selection-lock"
  | "gaia-visual-mapping-lock"
  | "constellation-nebula-readability-lock"
  | "browser-qa-lock"
  | "budget-boundary-lock"
  | "docs-surface-lock"
  | "protected-mutation-lock";
export type AtlasFinalGaiaArtEnhancementAuditStatus =
  | "ready"
  | "blocked"
  | "regressed";
export type AtlasFinalGaiaArtEnhancementAudit = {
  id: AtlasFinalGaiaArtEnhancementAuditId;
  label: string;
  status: AtlasFinalGaiaArtEnhancementAuditStatus;
  measured: string;
  expected: string;
  trustedBoundary: string;
};
export type AtlasFinalGaiaArtEnhancementRow = {
  id: AtlasFinalGaiaArtEnhancementRowId;
  label: string;
  status: "not-run" | "complete" | "blocked";
  v104Status: "not-run" | "pass" | "fail";
  gaiaSelectionStatus: "not-run" | "pass" | "fail";
  gaiaVisualMappingStatus: "not-run" | "pass" | "fail";
  constellationNebulaReadabilityStatus: "not-run" | "pass" | "fail";
  browserQaStatus: "not-run" | "pass" | "fail";
  budgetBoundaryStatus: "not-run" | "pass" | "fail";
  docsSurfaceStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
  finalGaiaArtEnhancement: "applied-budget-preserved-presentation-data-polish";
};
export type AtlasFinalGaiaArtEnhancementSummary = {
  version: AtlasFinalGaiaArtEnhancementVersion;
  finalGaiaArtEnhancementProfile: AtlasFinalGaiaArtEnhancementProfile;
  status: AtlasFinalGaiaArtEnhancementStatus;
  classification: AtlasFinalGaiaArtEnhancementClassification;
  browserAcceptanceRuntimeCostVersion: AtlasBrowserAcceptanceRuntimeCostVersion;
  gaiaEnhancementVersion: AtlasGaiaStarfieldEnhancementVersion;
  artPolishVersion: AtlasArtPolishVersion;
  gaiaRenderBudget: AtlasGaiaStarfieldEnhancementBudget;
  opacityCaps: AtlasArtPolishOpacityCaps;
  gaiaSelectionPolicy: "deterministic-bright-near-color-spread-sky-binned";
  gaiaVisualMappingPolicy: "budget-preserved-brightness-color-temperature-layering";
  constellationNebulaReadabilityPolicy: "presentation-only-overview-readable-closeup-mobile-restrained";
  browserQaPolicy: "root-observable-evidence-validation-v105-markers";
  focusedCommand: "npm run test:atlas:final-gaia-art-enhancement";
  finalGaiaArtVerifyCommand: "npm run verify:atlas:final-gaia-art";
  defaultFreshCommand: "npm run test:atlas:browser:fresh";
  screenshotArtifactDirectory: "test-results/v105-final-gaia-art-enhancement-lock/";
  rowCount: number;
  completedRowCount: number;
  audits: readonly AtlasFinalGaiaArtEnhancementAudit[];
  rows: readonly AtlasFinalGaiaArtEnhancementRow[];
  readyRowId: AtlasFinalGaiaArtEnhancementRowId | "";
  finalGaiaArtEnhancement: "applied-budget-preserved-presentation-data-polish";
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

export type AtlasRcEvidenceClosureVersion =
  "v106-release-candidate-evidence-closure-lock";
export type AtlasRcEvidenceClosureProfile =
  "v106-v93-v105-final-rc-evidence-closure";
export type AtlasRcEvidenceClosureStatus =
  | "pending-runtime-run"
  | "ready-rc-evidence-closed"
  | "ready-rc-evidence-blocked"
  | "ready-rc-handoff-indexed";
export type AtlasRcEvidenceClosureClassification =
  | "rc-evidence-closure-pass"
  | "v105-regression"
  | "command-matrix-regression"
  | "browser-qa-regression"
  | "artifact-index-regression"
  | "dirty-worktree-policy-regression"
  | "docs-surface-regression"
  | "protected-mutation-regression"
  | "mixed";
export type AtlasRcEvidenceClosureRowId =
  "v106-lock-release-candidate-evidence-closure";
export type AtlasRcEvidenceClosureAuditId =
  | "v105-final-gaia-art-enhancement"
  | "command-matrix-lock"
  | "browser-qa-lock"
  | "artifact-index-lock"
  | "dirty-worktree-policy-lock"
  | "watchpack-noise-policy-lock"
  | "docs-surface-lock"
  | "protected-mutation-lock";
export type AtlasRcEvidenceClosureAuditStatus =
  | "ready"
  | "blocked"
  | "regressed";
export type AtlasRcEvidenceClosureAudit = {
  id: AtlasRcEvidenceClosureAuditId;
  label: string;
  status: AtlasRcEvidenceClosureAuditStatus;
  measured: string;
  expected: string;
  trustedBoundary: string;
};
export type AtlasRcEvidenceClosureRow = {
  id: AtlasRcEvidenceClosureRowId;
  label: string;
  status: "not-run" | "complete" | "blocked";
  v105Status: "not-run" | "pass" | "fail";
  commandMatrixStatus: "not-run" | "pass" | "fail";
  browserQaStatus: "not-run" | "pass" | "fail";
  artifactIndexStatus: "not-run" | "pass" | "fail";
  dirtyWorktreePolicyStatus: "not-run" | "pass" | "fail";
  watchpackNoisePolicyStatus: "not-run" | "pass" | "fail";
  docsSurfaceStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
  rcEvidenceClosure: "applied-rc-evidence-closure-only";
};
export type AtlasRcEvidenceClosureSummary = {
  version: AtlasRcEvidenceClosureVersion;
  rcEvidenceClosureProfile: AtlasRcEvidenceClosureProfile;
  status: AtlasRcEvidenceClosureStatus;
  classification: AtlasRcEvidenceClosureClassification;
  finalGaiaArtEnhancementVersion: AtlasFinalGaiaArtEnhancementVersion;
  commandMatrixPolicy: "v93-v105-focused-and-verify-commands-indexed";
  browserQaPolicy: "root-observable-evidence-validation-v106-markers-console-zero-fresh-teardown";
  artifactIndexPolicy: "v93-v105-browser-screenshot-directories-indexed";
  dirtyWorktreePolicy: "no-reset-no-revert-no-clean-no-stage-no-commit";
  watchpackNoisePolicy: "DumpStack.log.tmp-pagefile.sys-known-non-failure-noise";
  focusedCommand: "npm run test:atlas:rc-evidence-closure";
  rcEvidenceVerifyCommand: "npm run verify:atlas:rc-evidence";
  finalGaiaArtVerifyCommand: "npm run verify:atlas:final-gaia-art";
  scientificVerifyCommand: "npm run verify:atlas:scientific";
  screenshotArtifactDirectory: "test-results/v106-release-candidate-evidence-closure-lock/";
  indexedScreenshotArtifactDirectories: readonly string[];
  rowCount: number;
  completedRowCount: number;
  audits: readonly AtlasRcEvidenceClosureAudit[];
  rows: readonly AtlasRcEvidenceClosureRow[];
  readyRowId: AtlasRcEvidenceClosureRowId | "";
  rcEvidenceClosure: "applied-rc-evidence-closure-only";
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
  releaseArchiveMutation: "not-applied";
  releasePackagingMutation: "not-applied";
  stagingMutation: "not-applied";
  commitMutation: "not-applied";
  certificationClaimMutation: "not-applied";
  trustedBoundary: string;
};

export type AtlasInteractionCatalogCompletionVersion =
  "v107-interaction-catalog-completion-lock";
export type AtlasInteractionCatalogCompletionProfile =
  "v107-camera-launch-gaia-navigation-catalog-completion";
export type AtlasInteractionCatalogCompletionStatus =
  | "pending-runtime-run"
  | "ready-interaction-catalog-locked"
  | "ready-interaction-catalog-blocked"
  | "ready-visual-navigation-complete";
export type AtlasInteractionCatalogCompletionClassification =
  | "interaction-catalog-completion-pass"
  | "v106-regression"
  | "camera-transition-regression"
  | "launch-entry-regression"
  | "gaia-navigation-regression"
  | "label-budget-regression"
  | "constellation-nebula-regression"
  | "docs-surface-regression"
  | "protected-mutation-regression"
  | "mixed";
export type AtlasInteractionCatalogCompletionAuditId =
  | "v106-rc-evidence-closure"
  | "camera-transition-lock"
  | "launch-entry-lock"
  | "gaia-navigation-lock"
  | "label-budget-lock"
  | "constellation-nebula-lock"
  | "docs-surface-lock"
  | "protected-mutation-lock";
export type AtlasInteractionCatalogCompletionAudit = {
  id: AtlasInteractionCatalogCompletionAuditId;
  label: string;
  status: "ready" | "blocked" | "regressed";
  measured: string;
  expected: string;
  trustedBoundary: string;
};
export type AtlasInteractionCatalogCompletionRow = {
  id: "v107-lock-interaction-catalog-completion";
  label: string;
  status: "not-run" | "complete" | "blocked";
  cameraStatus: "not-run" | "pass" | "fail";
  launchStatus: "not-run" | "pass" | "fail";
  gaiaNavigationStatus: "not-run" | "pass" | "fail";
  labelBudgetStatus: "not-run" | "pass" | "fail";
  constellationNebulaStatus: "not-run" | "pass" | "fail";
  docsSurfaceStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
};
export type AtlasInteractionCatalogCompletionSummary = {
  version: AtlasInteractionCatalogCompletionVersion;
  profile: AtlasInteractionCatalogCompletionProfile;
  status: AtlasInteractionCatalogCompletionStatus;
  classification: AtlasInteractionCatalogCompletionClassification;
  rcEvidenceClosureVersion: AtlasRcEvidenceClosureVersion;
  cameraPolicy: "single-cancellable-command-adaptive-smootherstep-1200-1800ms";
  starFocusPolicy: "celestial-direction-center-not-physical-flyby";
  focusExitPolicy: "passport-reset-escape";
  launchPolicy: "orbit-atlas-entry-sandbox-single-leo-satellite-existing-spacecraft-handoff";
  gaiaSearchPolicy: "packaged-5000-query-min-2-max-12";
  gaiaLabelPolicy: "desktop-24-mobile-8-selected-always";
  constellationCount: 88;
  nebulaCount: 80;
  focusedCommand: "npm run test:atlas:interaction-catalog-completion";
  verifyCommand: "npm run verify:atlas:interaction-catalog";
  screenshotArtifactDirectory: "test-results/v107-interaction-catalog-completion-lock/";
  audits: readonly AtlasInteractionCatalogCompletionAudit[];
  rows: readonly AtlasInteractionCatalogCompletionRow[];
  readyRowId: "v107-lock-interaction-catalog-completion" | "";
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

export type AtlasInteractionRepairLaunchUxVersion =
  "v108-interaction-repair-launch-ux-lock";
export type AtlasInteractionRepairLaunchUxProfile =
  "v108-sky-target-zoom-launch-ux-repair";
export type AtlasInteractionRepairLaunchUxStatus =
  | "pending-runtime-run"
  | "ready-interaction-repair-launch-ux-locked"
  | "ready-interaction-repair-launch-ux-blocked"
  | "ready-sky-target-launch-ux-repaired";
export type AtlasInteractionRepairLaunchUxClassification =
  | "interaction-repair-launch-ux-pass"
  | "v107-regression"
  | "sky-target-proxy-regression"
  | "sky-target-zoom-regression"
  | "body-zoom-regression"
  | "launch-ux-regression"
  | "docs-surface-regression"
  | "protected-mutation-regression"
  | "mixed";
export type AtlasInteractionRepairLaunchUxAuditId =
  | "v107-interaction-catalog-completion"
  | "sky-target-proxy-lock"
  | "sky-target-zoom-lock"
  | "body-zoom-lock"
  | "launch-ux-lock"
  | "docs-surface-lock"
  | "protected-mutation-lock";
export type AtlasInteractionRepairLaunchUxAudit = {
  id: AtlasInteractionRepairLaunchUxAuditId;
  label: string;
  status: "ready" | "blocked" | "regressed";
  measured: string;
  expected: string;
  trustedBoundary: string;
};
export type AtlasInteractionRepairLaunchUxRow = {
  id: "v108-lock-interaction-repair-launch-ux";
  label: string;
  status: "not-run" | "complete" | "blocked";
  skyTargetProxyStatus: "not-run" | "pass" | "fail";
  skyTargetZoomStatus: "not-run" | "pass" | "fail";
  bodyZoomStatus: "not-run" | "pass" | "fail";
  launchUxStatus: "not-run" | "pass" | "fail";
  docsSurfaceStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
};
export type AtlasInteractionRepairLaunchUxSummary = {
  version: AtlasInteractionRepairLaunchUxVersion;
  profile: AtlasInteractionRepairLaunchUxProfile;
  status: AtlasInteractionRepairLaunchUxStatus;
  classification: AtlasInteractionRepairLaunchUxClassification;
  interactionCatalogCompletionVersion: AtlasInteractionCatalogCompletionVersion;
  skyTargetPolicy: "zoomable-visual-proxy-no-physics-body";
  skyTargetZoomPolicy: "camera-target-distance-only-clamped";
  bodyZoomPolicy: "native-wheel-distance-preserved-during-body-lock";
  focusExitPolicy: "passport-reset-escape-clears-body-and-sky-target";
  launchUxPolicy: "leo-satellite-default-cards-countdown-timeline-local-physics";
  focusedCommand: "npm run test:atlas:interaction-repair-launch-ux";
  verifyCommand: "npm run verify:atlas:interaction-repair-launch-ux";
  screenshotArtifactDirectory: "test-results/v108-interaction-repair-launch-ux-lock/";
  audits: readonly AtlasInteractionRepairLaunchUxAudit[];
  rows: readonly AtlasInteractionRepairLaunchUxRow[];
  readyRowId: "v108-lock-interaction-repair-launch-ux" | "";
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

export type AtlasCriticalUiRelativityVisibilityVersion =
  "v110-critical-ui-relativity-visibility-lock";
export type AtlasCriticalUiRelativityVisibilityProfile =
  "v110-visible-chinese-copy-relativity-core-entry";
export type AtlasCriticalUiRelativityVisibilityStatus =
  | "pending-runtime-run"
  | "ready-critical-ui-relativity-visibility-locked"
  | "ready-critical-ui-relativity-visibility-blocked";
export type AtlasCriticalUiRelativityVisibilityClassification =
  | "critical-ui-relativity-visibility-pass"
  | "v109-regression"
  | "visible-copy-regression"
  | "relativity-core-entry-regression"
  | "core-readout-regression"
  | "docs-surface-regression"
  | "protected-mutation-regression"
  | "mixed";
export type AtlasCriticalUiRelativityVisibilityAuditId =
  | "v109-interaction-visual-quality"
  | "visible-chinese-copy-lock"
  | "relativity-core-entry-lock"
  | "relativity-core-readout-lock"
  | "docs-surface-lock"
  | "protected-mutation-lock";
export type AtlasCriticalUiRelativityVisibilityAudit = {
  id: AtlasCriticalUiRelativityVisibilityAuditId;
  label: string;
  status: "ready" | "blocked" | "regressed";
  measured: string;
  expected: string;
  trustedBoundary: string;
};
export type AtlasCriticalUiRelativityVisibilityRow = {
  id: "v110-lock-critical-ui-relativity-visibility";
  label: string;
  status: "not-run" | "complete" | "blocked";
  v109Status: "not-run" | "pass" | "fail";
  visibleCopyStatus: "not-run" | "pass" | "fail";
  coreEntryStatus: "not-run" | "pass" | "fail";
  coreReadoutStatus: "not-run" | "pass" | "fail";
  docsSurfaceStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
};
export type AtlasCriticalUiRelativityVisibilitySummary = {
  version: AtlasCriticalUiRelativityVisibilityVersion;
  profile: AtlasCriticalUiRelativityVisibilityProfile;
  status: AtlasCriticalUiRelativityVisibilityStatus;
  classification: AtlasCriticalUiRelativityVisibilityClassification;
  interactionVisualQualityVersion: AtlasInteractionVisualQualityVersion;
  uiCopyPolicy: "visible-chinese-copy-no-mojibake";
  relativityCoreEntryPolicy: "bottom-tools-search-observable-atlas-entry";
  relativityReadoutPolicy: "eih-dp-rk-mercury-shapiro-kerr-boundary-visible";
  focusedCommand: "npm run test:atlas:critical-ui-relativity-visibility";
  verifyCommand: "npm run verify:atlas:critical-ui-relativity-visibility";
  screenshotArtifactDirectory: "test-results/v110-critical-ui-relativity-visibility-lock/";
  audits: readonly AtlasCriticalUiRelativityVisibilityAudit[];
  rows: readonly AtlasCriticalUiRelativityVisibilityRow[];
  readyRowId: "v110-lock-critical-ui-relativity-visibility" | "";
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

export type AtlasLaunchGameplayOpenRocketBridgeVersion =
  "v112-launch-gameplay-openrocket-bridge-lock";
export type AtlasLaunchGameplayOpenRocketBridgeProfile =
  "v112-mission-scene-openrocket-import-bridge";
export type AtlasLaunchGameplayOpenRocketBridgeStatus =
  | "pending-runtime-run"
  | "ready-launch-gameplay-openrocket-bridge-locked"
  | "ready-launch-gameplay-openrocket-bridge-blocked";
export type AtlasLaunchGameplayOpenRocketBridgeClassification =
  | "launch-gameplay-openrocket-bridge-pass"
  | "v111-regression"
  | "launch-mission-scene-regression"
  | "launch-visual-profile-regression"
  | "openrocket-import-bridge-regression"
  | "protected-mutation-regression"
  | "mixed";
export type AtlasLaunchGameplayOpenRocketBridgeAuditId =
  | "v111-camera-stellar-closeup"
  | "launch-mission-scene-lock"
  | "launch-visual-profile-lock"
  | "openrocket-import-bridge-lock"
  | "protected-mutation-lock";
export type AtlasLaunchGameplayOpenRocketBridgeAudit = {
  id: AtlasLaunchGameplayOpenRocketBridgeAuditId;
  label: string;
  status: "ready" | "blocked" | "regressed";
  measured: string;
  expected: string;
  trustedBoundary: string;
};
export type AtlasLaunchGameplayOpenRocketBridgeRow = {
  id: "v112-lock-launch-gameplay-openrocket-bridge";
  label: string;
  status: "not-run" | "complete" | "blocked";
  v111Status: "not-run" | "pass" | "fail";
  launchMissionSceneStatus: "not-run" | "pass" | "fail";
  launchVisualProfileStatus: "not-run" | "pass" | "fail";
  openRocketBridgeStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
};
export type AtlasLaunchGameplayOpenRocketBridgeSummary = {
  version: AtlasLaunchGameplayOpenRocketBridgeVersion;
  profile: AtlasLaunchGameplayOpenRocketBridgeProfile;
  status: AtlasLaunchGameplayOpenRocketBridgeStatus;
  classification: AtlasLaunchGameplayOpenRocketBridgeClassification;
  cameraStellarCloseupVersion: AtlasCameraStellarCloseupVersion;
  launchScenePolicy: "mission-scene-pad-tower-countdown-staging-hud-deploy";
  launchVisualProfilePolicy: "deterministic-profile-manifest-leo-sls-mars";
  openRocketBridgePolicy: "offline-import-no-browser-exe-launch";
  telemetryProviderPolicy: "local-default-websocket-optional";
  focusedCommand: "npm run test:atlas:launch-gameplay-openrocket-bridge";
  verifyCommand: "npm run verify:atlas:launch-gameplay-openrocket-bridge";
  screenshotArtifactDirectory: "test-results/v112-launch-gameplay-openrocket-bridge-lock/";
  audits: readonly AtlasLaunchGameplayOpenRocketBridgeAudit[];
  rows: readonly AtlasLaunchGameplayOpenRocketBridgeRow[];
  readyRowId: "v112-lock-launch-gameplay-openrocket-bridge" | "";
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
  stagingMutation: "not-applied";
  commitMutation: "not-applied";
  trustedBoundary: string;
};

export type AtlasScientificModelUpgradeContractVersion =
  "v113-scientific-model-upgrade-contract";
export type AtlasScientificModelUpgradeContractProfile =
  "v113-fixture-budget-comparison-rollback-plan";
export type AtlasScientificModelUpgradeContractStatus =
  | "pending-runtime-run"
  | "ready-scientific-model-upgrade-contract-locked"
  | "ready-scientific-model-upgrade-contract-blocked";
export type AtlasScientificModelUpgradeContractSummary = {
  version: AtlasScientificModelUpgradeContractVersion;
  profile: AtlasScientificModelUpgradeContractProfile;
  status: AtlasScientificModelUpgradeContractStatus;
  launchGameplayOpenRocketBridgeVersion: AtlasLaunchGameplayOpenRocketBridgeVersion;
  scientificUpgradePolicy: "contract-only-no-core-mutation";
  fixturePolicy: "new-fixtures-before-core-change";
  errorBudgetPolicy: "explicit-budget-matrix-before-core-change";
  comparisonMatrixPolicy: "baseline-shadow-candidate-reference-required";
  rollbackPolicy: "single-switch-core-upgrade-revert-condition";
  focusedCommand: "npm run test:atlas";
  verifyCommand: "npm run verify:atlas";
  livePhysicsMutation: "not-applied";
  workerPhysicsMutation: "not-applied";
  rk4DefaultMutation: "not-applied";
  eihOnePnMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  fixtureDataMutation: "not-applied";
  trustedBoundary: string;
};

export type AtlasRuntimeQualityTier =
  | "balanced"
  | "mobile-safe"
  | "launch-cinematic"
  | "closeup-inspect";
export type AtlasLaunchSequenceDirectorPhase =
  | "prelaunch"
  | "liftoff"
  | "max-q"
  | "stage-separation"
  | "coast-insertion"
  | "payload-deploy";
export type AtlasLaunchSequenceDirectorPhaseV118 =
  | "prelaunch"
  | "ignition"
  | "tower-clear"
  | "max-q"
  | "meco-separation"
  | "coast"
  | "insertion"
  | "payload-deploy";
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

export type FrwCosmologyParams = {
  presetId: CosmologyModelPresetId;
  source: CosmologyModelSource;
  h0KmSmpc: number;
  omegaMatter: number;
  omegaLambda: number;
  omegaCurvature: number;
  reference: "Planck 2018 TT,TE,EE+lowE+lensing base-LambdaCDM";
};

export type FrwDistanceAnchor = {
  redshift: number;
  scaleFactor: number;
  hubbleKmSmpc: number;
  lookbackTimeGyr: number;
  ageAtRedshiftGyr: number;
  comovingDistanceMpc: number;
  luminosityDistanceMpc: number;
  angularDiameterDistanceMpc: number;
  distanceModulusMag: number;
};

export type FrwCosmologyValidationSummary = {
  status: CosmologyValidationStatus;
  modelId: CosmologyModelPresetId;
  source: CosmologyModelSource;
  confidence: CosmologyConfidence;
  params: FrwCosmologyParams;
  hubbleTimeGyr: number | null;
  ageNowGyr: number | null;
  anchors: readonly FrwDistanceAnchor[];
  semantics: {
    cosmology: "analytic-frw-validation-layer";
    structureFormation: "not-nbody-cosmological-structure-formation";
    cmb: "not-boltzmann-solver";
    orbitAtlas: "presentation-layer";
  };
  error?: string;
};

export type KerrMetricParams = {
  family: MetricFamily;
  /** Dimensionless Boyer-Lindquist spin a/M. Schwarzschild forces this to 0. */
  spinA: number;
};

export type GeodesicInitialState = {
  metric: MetricFamily;
  kind: GeodesicKind;
  spinA?: number;
  r0: number;
  theta0?: number;
  phi0?: number;
  t0?: number;
  radialDirection?: -1 | 0 | 1;
  energy: number;
  angularMomentum: number;
  carterConstant?: number;
  label?: string;
};

export type GeodesicSample = {
  lambda: number;
  t: number;
  r: number;
  theta: number;
  phi: number;
  hamiltonian: number;
  energy: number;
  angularMomentum: number;
  carterLikeInvariant: number;
};

export type GeodesicIntegrationResult = {
  status: GeodesicClassification;
  initialState: GeodesicInitialState;
  params: KerrMetricParams;
  samples: readonly GeodesicSample[];
  stepsAccepted: number;
  stepsRejected: number;
  hamiltonianTarget: number;
  maxHamiltonianConstraintAbs: number;
  energyDrift: number;
  angularMomentumDrift: number;
  carterLikeInvariantDrift: number;
  radialRange: {
    min: number;
    max: number;
  };
};

export type KerrGeodesicTrackSample = {
  lambda: number;
  r: number;
  phi: number;
  x: number;
  y: number;
  z: number;
  hamiltonian: number;
};

export type KerrGeodesicTrack = {
  id: string;
  kind: GeodesicTrackKind;
  metric: MetricFamily;
  geodesicKind: GeodesicKind;
  status: GeodesicClassification;
  color: string;
  haloColor: string;
  width: number;
  opacity: number;
  maxHamiltonianConstraintAbs: number;
  radialDrift: number;
  samples: readonly KerrGeodesicTrackSample[];
};

export type KerrGeodesicTrackSet = {
  visualization: "kerr-geodesic-tracks-v18";
  labVersion: "v19-interactive-kerr-lab";
  spinA: number;
  orbitPresetId: KerrOrbitPresetId;
  impactParameterM: number;
  renderModeDefault: KerrGeodesicRenderMode;
  trackCount: number;
  maxHamiltonianConstraintAbs: number;
  probe: KerrProbeGeodesicSummary;
  tracks: readonly KerrGeodesicTrack[];
};

export type KerrProbeGeodesicSummary = {
  presetId: KerrOrbitPresetId;
  impactParameterM: number;
  weakFieldDeflectionRad: number;
  weakFieldDeflectionArcsec: number;
  geodesicStatus: GeodesicClassification;
  probeStatus: KerrProbeStatus;
  maxHamiltonianConstraintAbs: number;
  radialRangeMinM: number;
  radialRangeMaxM: number;
  sampleCount: number;
};

export type KerrRelativityStudioMetric = {
  id: string;
  label: string;
  value: string;
  status: EvidenceClaimStatus;
};

export type KerrRelativityStudioSection = {
  id: KerrRelativityStudioMode;
  title: string;
  body: string;
  metrics: readonly KerrRelativityStudioMetric[];
};

export type KerrRelativityStudioSummary = {
  version: KerrRelativityStudioVersion;
  mode: KerrRelativityStudioMode;
  presetId: KerrOrbitPresetId;
  spinA: number;
  impactParameterM: number;
  renderMode: KerrGeodesicRenderMode;
  probeStatus: KerrProbeStatus;
  weakFieldReference: string;
  weakFieldDeflectionRad: number;
  weakFieldDeflectionArcsec: number;
  progradeIscoRadiusM: number;
  retrogradeIscoRadiusM: number;
  iscoSplitM: number;
  maxHamiltonianDrift: number;
  probeHamiltonianDrift: number;
  radialRangeMinM: number;
  radialRangeMaxM: number;
  trackCount: number;
  sampleCount: number;
  boundary: "test-particle-null-geodesic-lab";
  trustedBoundary: string;
  sections: readonly KerrRelativityStudioSection[];
};

export type StrongFieldRelativityValidationSummary = {
  status: StrongFieldValidationStatus;
  kernel: "kerr-geodesic-v17";
  relativityKernel: RelativityKernelId;
  labVersion: "v19-interactive-kerr-lab";
  orbitPresetId: KerrOrbitPresetId;
  metricFamilies: readonly MetricFamily[];
  geodesicKinds: readonly GeodesicKind[];
  schwarzschild: {
    horizonRadiusM: number;
    photonSphereRadiusM: number;
    iscoRadiusM: number;
    weakFieldDeflectionApprox: "4M/b";
  };
  kerr: {
    spinA: number;
    outerHorizonRadiusM: number;
    progradeIscoRadiusM: number;
    retrogradeIscoRadiusM: number;
    equatorialStaticLimitRadiusM: number;
  };
  weakFieldLightDeflection: {
    impactParameterM: number;
    formulaRad: number;
    formulaArcsec: number;
    targetApproxRad: number;
    errorPercent: number;
  };
  integration: {
    nullHamiltonianDrift: number;
    timelikeHamiltonianDrift: number;
    probeHamiltonianDrift: number;
    photonSphereRadialDrift: number;
    iscoRadialDrift: number;
    captureStatus: GeodesicClassification;
    escapeStatus: GeodesicClassification;
    probeStatus: KerrProbeStatus;
  };
  probe: KerrProbeGeodesicSummary;
  semantics: {
    strongField: "geodesic-backed-validation-lab";
    solarDynamics: "not-replaced-eih-1pn";
    numericalRelativity: "not-einstein-field-equation-solver";
    orbitAtlas: "presentation-layer";
  };
  error?: string;
};

export type GaiaDr3KinematicsRow = {
  source_id: string;
  ra: number;
  dec: number;
  parallax: number;
  pmra: number;
  pmdec: number;
  radial_velocity: number;
  phot_g_mean_mag: number;
  bp_rp: number;
  parallax_over_error: number;
  ruwe: number;
  radial_velocity_error: number;
};

export type GalacticVelocitySample = {
  sourceId: string;
  distancePc: number;
  uKmS: number;
  vKmS: number;
  wKmS: number;
  tangentialKmS: number;
  speedKmS: number;
};

export type GalacticRotationCurvePoint = {
  radiusKpc: number;
  circularVelocityKmS: number;
};

export type GalacticDynamicsValidationSummary = {
  status: GalacticValidationStatus;
  source: GaiaKinematicsCatalogSource;
  sampleCount: number;
  r0Kpc: number;
  localCircularVelocityTargetKmS: readonly [number, number];
  localEscapeVelocityTargetKmS: readonly [number, number];
  rotationCurve: readonly GalacticRotationCurvePoint[];
  circularVelocityAtR0KmS: number | null;
  escapeSpeedAtR0KmS: number | null;
  medianTangentialVelocityKmS: number | null;
  medianSpeedKmS: number | null;
  medianAbsUkmS: number | null;
  medianAbsVkmS: number | null;
  medianAbsWkmS: number | null;
  verticalOscillationScale: string;
  weakFieldPhiOverC2: number | null;
  weakFieldClockOffsetUsPerDay: number | null;
  weakFieldDiagnostic: "teaching";
  semantics: {
    solarDynamics: "live-nbody-eih-1pn";
    galacticDynamics: "analytic-potential-validation";
    orbitAtlas: "presentation-layer";
    cosmology: "not-full-gr-or-cosmological-expansion";
  };
  error?: string;
};

export type MercuryPrecessionBenchmark = {
  initialState: "shared-newton-1pn";
  measuredArcsecPerCentury: number | null;
  targetArcsecPerCentury: number;
  errorPercent: number | null;
  status: string;
};

export type HorizonsComparisonBody = {
  bodyId: string;
  deltaRKm: number;
  deltaVMs: number;
  orbitalResidual?: HorizonsOrbitalResidual;
};

export type HorizonsOrbitalResidual = {
  frame: "sun-centered-reference-rtn";
  basisStatus: "ready" | "degenerate";
  radialPositionKm: number | null;
  transversePositionKm: number | null;
  normalPositionKm: number | null;
  radialVelocityMs: number | null;
  transverseVelocityMs: number | null;
  normalVelocityMs: number | null;
  positionNormKm: number;
  velocityNormMs: number;
};

export type HorizonsComparisonCheckpoint = {
  label: "+30d" | "+365d" | "+10y";
  offsetDays: number;
  referenceSource: "JPL Horizons";
  available: boolean;
  deltaRKm: number | null;
  deltaVMs: number | null;
  rmsPositionKm: number | null;
  rmsVelocityMs: number | null;
  bodyComparisons: readonly HorizonsComparisonBody[];
  note?: string;
};

export type ResearchValidationSummary = {
  mercuryPrecession: MercuryPrecessionBenchmark;
  horizonsCheckpoints: readonly HorizonsComparisonCheckpoint[];
  conservation: {
    relEnergyDrift: number;
    relAngMomDrift: number;
    pnAccelFraction: number | null;
  };
  sourceSemantics: {
    atlasOrbits: "presentation-layer";
    referenceOrbit: "static-j2000-visual-guide";
    liveValues: "n-body-state-diagnostics";
  };
};

export type MercuryPrecessionValidation = {
  sameInitialState: boolean;
  method: "analytic-1pn-from-osculating-state";
  newtonArcsecPerCentury: number;
  onePnArcsecPerCentury: number | null;
  targetArcsecPerCentury: number;
  errorPercent: number | null;
  sampledOrbits: number;
  status: "ready" | "unavailable";
};

export type LightDeflectionValidation = {
  impactParameterSolarRadii: number;
  formulaArcsec: number;
  targetArcsec: number;
  errorPercent: number;
  status: "ready";
};

export type ShapiroDelayValidation = {
  bodyId: "mercury" | "mars";
  microseconds: number | null;
  formulaMicroseconds: number | null;
  errorPercent: number | null;
  status: "ready" | "unavailable";
};

export type TimeDilationValidation = {
  bodyId: string | null;
  ratio: number | null;
  slowdownFraction: number | null;
  gravitationalPlusKinematicUsPerDay: number | null;
  surfaceRedshift: number | null;
  status: "ready" | "unavailable";
};

export type HorizonsValidationBodyVector = {
  id: string;
  targetCommandId?: string;
  targetRole?: AtlasOuterSystemForceModelPreflightTargetRole;
  x_au: number;
  y_au: number;
  z_au: number;
  vx_au_d: number;
  vy_au_d: number;
  vz_au_d: number;
};

export type HorizonsValidationCheckpoint = {
  label: "J2000" | "+30d" | "+365d" | "+10y";
  offsetDays: number;
  epochJdTdb: number;
  bodies: readonly HorizonsValidationBodyVector[];
};

export type HorizonsValidationDataset = {
  source: "JPL Horizons API" | string;
  origin: "sun";
  refplane: "ecliptic";
  aberrations: "geometric";
  baseEpochJdTdb: number;
  variant?: string;
  targetProvenance?: readonly {
    bodyId: string;
    expectedTargetCommandId: string;
    role: AtlasOuterSystemForceModelPreflightTargetRole;
    origin: "sun";
    refplane: "ecliptic";
    aberrations: "geometric";
    baseEpochJdTdb: number;
  }[];
  checkpoints: readonly HorizonsValidationCheckpoint[];
};

export type HorizonsValidationModeResult = {
  mode: "newton" | "1pn";
  checkpoints: readonly HorizonsComparisonCheckpoint[];
  rmsPositionKm: number | null;
  rmsVelocityMs: number | null;
};

export type HorizonsValidationRun = {
  status: "pending" | "running" | "complete" | "failed";
  progress: number;
  source: string;
  modes: readonly HorizonsValidationModeResult[];
  error?: string;
};

export type RelativityValidationSummary = {
  mercuryPrecession: MercuryPrecessionValidation;
  lightDeflection: LightDeflectionValidation;
  shapiroDelay: ShapiroDelayValidation;
  timeDilation: TimeDilationValidation;
  horizons: HorizonsValidationRun;
  semantics: {
    presentation: "orbit-atlas-visual-guide";
    dynamics: "live-nbody-eih-1pn-state";
    validation: "offline-gr-targets-and-jpl-horizons";
    kerr: "independent-strong-field-geodesic-lab";
  };
};

/** Snapshot written each frame by `DiagnosticsMonitorBridge` for sidebar polling. */
export type SimulationDiagnostics = {
  /** `simDaysRef` at sample time (simulation calendar days). */
  simDays: number;
  energyJ: number;
  angMomNormKgM2S: number;
  /** |E - E0| / max(|E0|, ε) */
  relEnergyDrift: number;
  /** |L - L0| / max(|L0|, ε) */
  relAngMomDrift: number;
  /** Ring buffer: relative energy drift samples (same units as relEnergyDrift). */
  energyHistory: readonly number[];
  /** Ring buffer: relative angular-momentum drift. */
  angMomHistory: readonly number[];
  /** EMA of estimated Mercury perihelion precession (arcsec / century). */
  mercuryPrecessionArcsecPerCentury: number | null;
  mercuryPrecessionErrorPercent: number | null;
  /** User-facing status line. */
  mercuryPrecessionStatus: string;
  horizonsRmsPositionKm: number | null;
  horizonsRmsVelocityMs: number | null;
  horizonsInitialEpochRmsPositionKm?: number | null;
  horizonsInitialEpochRmsVelocityMs?: number | null;
  horizonsLongTermOnePnRmsPositionKm?: number | null;
  horizonsLongTermOnePnRmsVelocityMs?: number | null;
  gaiaCatalogSource: GaiaCatalogSource;
  researchConfidence: ResearchConfidence;
  researchValidation: ResearchValidationSummary;
  relativityValidation: RelativityValidationSummary;
  lightDeflectionErrorPercent: number;
  shapiroDelayErrorPercent: number | null;
  timeDilationUsPerDay: number | null;
  horizonsValidationStatus: "pending" | "running" | "complete" | "failed";
  relativityConfidence: RelativityConfidence;
  galacticValidation: GalacticDynamicsValidationSummary;
  galacticValidationStatus: GalacticValidationStatus;
  galacticValidationSource: GaiaKinematicsCatalogSource;
  cosmologyValidation: FrwCosmologyValidationSummary;
  cosmologyValidationStatus: CosmologyValidationStatus;
  cosmologyModelSource: CosmologyModelSource;
  cosmologyConfidence: CosmologyConfidence;
  strongFieldValidation: StrongFieldRelativityValidationSummary;
  strongFieldValidationStatus: StrongFieldValidationStatus;
  relativityKernel: RelativityKernelId;
  /** Schwarzschild surface emission z for selected body; null if N/A. */
  gravitationalRedshiftZ: number | null;
  /** True when drift exceeds soft threshold (suggest smaller timestep). */
  conservationWarn: boolean;
};

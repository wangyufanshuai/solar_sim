/* v250 domain types: catalog. Public names remain re-exported by simulationDiagnosticsTypes.ts. */
import type { AtlasBrowserAcceptanceRuntimeCostVersion } from "./release";
import type { AtlasArtPolishOpacityCaps, AtlasArtPolishVersion } from "./visual";

export type GaiaKinematicsCatalogSource = "gaia-dr3-kinematics" | "unavailable";

export type GalacticValidationStatus = "pending" | "ready" | "failed";

export type CosmologyModelPresetId = "planck2018-flat-lcdm";

export type CosmologyModelSource = "planck-2018";

export type CosmologyValidationStatus = "ready" | "failed";

export type CosmologyConfidence = "formula-checked";


export type CelestialCatalogVersion = "v22-celestial-catalog-atlas";

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

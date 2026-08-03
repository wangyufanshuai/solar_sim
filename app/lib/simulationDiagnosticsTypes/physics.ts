/* v250 domain types: physics. Public names remain re-exported by simulationDiagnosticsTypes.ts. */
import type { GaiaCatalogSource } from "../../data/gaiaStarCatalog";
import type { CosmologyConfidence, CosmologyModelSource, CosmologyValidationStatus, FrwCosmologyValidationSummary, GaiaKinematicsCatalogSource, GalacticDynamicsValidationSummary, GalacticValidationStatus } from "./catalog";
import type { EvidenceClaimStatus, ResearchConfidence } from "./evidence";
import type { AtlasPlutoResidualIsolationMetric, RelativityConfidence, RelativityKernelId, RelativityValidationSummary, StrongFieldRelativityValidationSummary, StrongFieldValidationStatus } from "./relativity";
import type { AtlasLaunchGameplayOpenRocketBridgeVersion, AtlasProductReleaseGateStatus } from "./release";
import type { AtlasSkyRegressionBudgetProfile } from "./visual";
import type { AtlasNavigatorPanelId } from "./workbench";

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

export type AtlasBackgroundDepthProfile =
  | "overview-sparse-layered-milky-way"
  | "closeup-subject-negative-space"
  | "showcase-reference-depth";

export type AtlasBackgroundSubjectVisibilityProfile =
  | "overview-orbit-readable"
  | "selected-body-in-frame"
  | "showcase-subject-separated";

export type AtlasReferenceGradeCompositeProfile =
  | "overview-layered-reference-grade"
  | "selected-body-subject-matte"
  | "showcase-cinematic-deep-space";

export type AtlasReferenceGradeSubjectMatteProfile =
  | "overview-no-subject-matte"
  | "selected-body-background-matte"
  | "showcase-center-negative-space";

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

export type AtlasSelectedBodyKeyLightProfile =
  | "overview-natural-phase"
  | "earth-cloud-night-key-balance"
  | "solar-surface-edge-key"
  | "gas-giant-readable-key-fill"
  | "saturn-ring-key-fill"
  | "lunar-mars-relief-key";


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

export type AtlasSelectedBodyEarthCloudNightProfile =
  | "overview-no-earth-cloud-night-art"
  | "earth-clean-cloud-night-shadow-art";

export type AtlasSelectedBodySolarSurfaceProfile =
  | "overview-no-solar-surface-art"
  | "solar-granulation-controlled-corona-art";

export type AtlasVelocityTrailProfile = "selected-log-velocity-three-stop";

export type AtlasOrbitOcclusionProfile = "depth-tested-closeup-fade";

export type AtlasBackgroundGuardVersion = "v71-background-regression-guard";

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

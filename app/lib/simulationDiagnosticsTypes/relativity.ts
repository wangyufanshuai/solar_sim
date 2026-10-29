/* v250 domain types: relativity. Public names remain re-exported by simulationDiagnosticsTypes.ts. */
import type { EvidenceClaimConfidence, EvidenceClaimStatus } from "./evidence";
import type { AtlasPlutoResidualIsolationCandidateId, AtlasValidationDomainId, HorizonsValidationRun, LightDeflectionValidation, MercuryPrecessionValidation, ShapiroDelayValidation, TimeDilationValidation } from "./physics";
import type { AtlasInteractionVisualQualityVersion } from "./visual";
import type { AtlasNavigatorPanelId, AtlasWorkflowId } from "./workbench";

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

export type AtlasPlutoResidualIsolationMetric = {
  candidateId: AtlasPlutoResidualIsolationCandidateId | "";
  positionKm: number | null;
  velocityMs: number | null;
  onePnRmsPositionKm: number | null;
  onePnRmsVelocityMs: number | null;
  improvementVsBaseline: number | null;
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

/* v250 domain types: workbench. Public names remain re-exported by simulationDiagnosticsTypes.ts. */
import type { EvidenceClaimStatus, EvidencePassportMetric } from "./evidence";
import type { AtlasChineseDeepSpaceFidelityVersion, AtlasNumericalIntegrityCoverage, AtlasNumericalIntegrityStatus, AtlasNumericalIntegrityTrend, AtlasNumericalIntegrityVersion, AtlasOrbitOcclusionProfile, AtlasValidationDomain, AtlasValidationDomainId, AtlasValidationDomainStatus, AtlasValidationIssue, AtlasVelocityTrailProfile } from "./physics";
import type { KerrGeodesicRenderMode, KerrOrbitPresetId, KerrRelativityStudioMode, RelativityGuidedTourStep, RelativityGuidedTourVersion, RelativityObservableAtlasVersion, RelativityObservableExplainerVersion, RelativityObservableRow } from "./relativity";
import type { AtlasOrbitPerformanceProfile, AtlasReleaseGateSummary } from "./release";
import type { AtlasBackgroundArtProfile, AtlasBackgroundOrbitArtVersion, AtlasBodyPreviewRenderProfile, AtlasCinematicCloseupDirectorVersion, AtlasCinematicDeepSpaceBackdropVersion, AtlasCinematicDeepSpaceCameraVersion, AtlasCinematicKeyLightDirectorVersion, AtlasCinematicLightingCompositionVersion, AtlasCinematicPlanetaryArtDirectionVersion, AtlasCloseupAssetPolicy, AtlasCloseupPlanetReadabilityProfile, AtlasCloseupPresentationTruthVersion, AtlasCloseupPreviewSyncStatus, AtlasCloseupSolarBackdropProfile, AtlasCloseupVisualFidelityVersion, AtlasOrbitHierarchyProfile, AtlasOrbitMaterialProfile, AtlasPlanetaryColorGradingVersion, AtlasPlanetaryDepthLightingVersion, AtlasPlanetaryMaterialCompositionVersion, AtlasPlanetaryVisualFidelityVersion, AtlasReferenceGradeSpaceArtVersion, AtlasSolarCloseupProfile, AtlasSparseDeepSpaceDirectorVersion, AtlasUniverseSandboxReferenceBackdropVersion } from "./visual";

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

"use client";
import AtlasAppShell from "./AtlasAppShell";
import { MainlineAObservationJourneyProviderM4 } from "./MainlineAObservationJourneyM4";
import Link from "next/link";
import { SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import { KerrBlackHolePanel, ScienceTelemetryPanel } from "./AtlasRuntimeWorkbenchLazySurfaces";
import UniverseSandboxHud from "./UniverseSandboxHud";
import PhysicsPerformanceHud from "./PhysicsPerformanceHud";
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import type { AtlasSceneMode } from "../lib/atlasRuntimeSceneFocusPerformance";
import type { OrbitAtlasRenderBudget, OrbitAtlasScaleMode, SolarPresentationMode } from "../lib/orbitAtlasPresentation";
import type { SetStateAction, ChangeEvent } from "react";
import type { BottomControlBarSection } from "./BottomControlBar";
import type { SimulationViewSettings } from "../lib/simulationViewSettings";
import type { PhysicsPrecisionTier } from "../lib/physicsPrecision";
import type { KerrBlackHoleUiState } from "./KerrBlackHolePanel";
import type { TelemetrySeriesState } from "../lib/telemetryTypes";
import type { SimulationDiagnostics, AtlasWorkflowStep, AtlasMissionHubItem, AtlasReportExportFormat, AtlasReportTemplateId, AtlasReportSectionId, AtlasValidationDomainId, AtlasValidationDomain, AtlasValidationIssue, AtlasObservatoryZoneId, AtlasObservatoryDeckAction, EvidenceLedgerSummary, AtlasNavigatorItem } from "../lib/simulationDiagnosticsTypes";
import type { BodyLiveMetrics } from "../lib/bodyLiveMetrics";
import type { PhysicsHistoryStack } from "../lib/physicsHistoryStack";
import { atlasRuntimeStore, useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import { useCelestialObjectPassportSessionV638 } from "../lib/useCelestialObjectPassportSessionV638";
import AtlasRuntimeSceneLayer from "./AtlasRuntimeSceneLayer";
import MainlineAWorkspaceNavigationV637 from "./MainlineAWorkspaceNavigationV637";
import MainlineAPerformanceSurfaceV637 from "./MainlineAPerformanceSurfaceV637";
import MainlineABetaIntakePanelV607 from "./MainlineABetaIntakePanelV607";
import PostV593RelativityWorkbenchPanel, { type PostV593RelativityModeV1 } from "./PostV593RelativityWorkbenchPanel";
import AtlasRuntimePanelLayer from "./AtlasRuntimePanelLayer";
import AtlasRuntimeDockLayer from "./AtlasRuntimeDockLayer";
import type { AtlasRuntimeWorkbenchDomains } from "./atlasRuntimeWorkbenchDomains";
import AtlasRuntimeEvidenceSurfaceV256 from "./AtlasRuntimeEvidenceSurfaceV256";
import ObservingPlannerBoundaryV258 from "./ObservingPlannerBoundaryV258";
import GaiaScienceAnalysisBoundaryV259 from "./GaiaScienceAnalysisBoundaryV259";
import AtlasVisualABControlV261 from "./AtlasVisualABControlV261";
import ScienceCinematicVisualSurfaceV261 from "./ScienceCinematicVisualSurfaceV261";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V269 } from "../lib/atlasVisualProfileV269";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V274, ATLAS_VISUAL_PROFILE_CANDIDATE_V285 } from "../lib/atlasVisualProfileV274";
import { resolveAtlasVisualShellPropsV285R1 } from "../lib/atlasVisualShellV285R1";
import type { AtlasLegacyRootAttributesV256 } from "../lib/atlasLegacyRootCompatibilityV256";
import { useAtlasRuntimeEvidenceSurfaceStateV256 } from "../lib/useAtlasRuntimeEvidenceSurfaceStateV256";
import {
  POST_V594_BUILD_IDENTITY,
  POST_V594_LIFECYCLE_SAMPLE_INTERVAL_MILLISECONDS,
  POST_V594_LIFECYCLE_STABLE_MILLISECONDS,
  POST_V594_SAME_REALM_LIFECYCLE_QUERY,
  POST_V594_SAME_REALM_LIFECYCLE_VERSION,
  beginPostV594SameRealmLifecycleLedger,
  createPostV594NoCanvasSnapshot,
  getPostV594SameRealmLifecycleLedger,
  postV594BaselineSnapshotIsObserved,
  postV594LifecycleSnapshotStabilityKey,
  postV594MountedSnapshotIsActive,
  postV594SnapshotSatisfiesReleaseContract,
  recordPostV594LifecycleExitObservation,
  recordPostV594LifecyclePhase,
  recordPostV594LifecycleSnapshot,
  resolvePostV594SameRealmLifecycleAudit,
  type PostV594LifecycleExitObservation,
  type PostV594LifecycleSnapshot,
  type PostV594SameRealmLifecyclePhase,
} from "../lib/postV594SameRealmLifecycle";
import {
  STELLAR_HERO_BY_ID_V592,
  type StellarHeroIdV592,
} from "../lib/stellarHeroesV592";
import { ATLAS_V595_BUILD_IDENTITY } from "../lib/atlasV595BuildIdentity";
import {
  V595_EXACT_AB_LANES,
  createV595ExactAbRuntimeRequest,
  createV595StellarRenderProfile,
  resolveV595ExactAbRequestEligibility,
  resolveV595ExactAbSearch,
  type V595ExactAbConsumerReceipt,
  type V595ExactAbLane,
} from "../lib/v595ExactAbContract";
import {
  resolveV595ExactAbSelection,
  shouldOpenV595ValidationConsole,
} from "../lib/v595ExactAbSelection";
import V595ExactAbDomSurface from "./V595ExactAbDomSurface";
import { ATLAS_V596_VISUAL_CHECKPOINT_IDENTITY } from "../lib/atlasV596VisualCheckpointIdentity";
import {
  createV596StellarRenderProfile,
  createV596VisualCheckpointRuntimeRequest,
  resolveV596VisualCheckpointEligibility,
  resolveV596VisualCheckpointSearch,
  type V596VisualCheckpointConsumerReceipt,
} from "../lib/v596VisualCheckpointContract";
import { resolveV596VisualCheckpointSelection } from "../lib/v596VisualCheckpointSelection";
import V596VisualCheckpointDomSurface from "./V596VisualCheckpointDomSurface";
import V596FormalEvidenceDomSurface from "./V596FormalEvidenceDomSurface";
import V594CdpSoakSurface from "./V594CdpSoakSurface";
import { resolvePostV594CdpSoakAudit } from "../lib/v594CdpSoakSurface";
const AtlasVisualDiagnosticsSurface = lazy(
  () => import("./AtlasVisualDiagnosticsSurface"),
);

// v594 lifecycle DOM attributes/actions remain inherited observability
// instrumentation.  Only the candidate marker is bound to the current v595
// identity, so a replacement cannot accidentally observe a stale candidate.
const V595_LIFECYCLE_CURRENT_CANDIDATE = "v595" as const;
const v595LifecycleReplacementSelector = (heroId: string) =>
  `[data-atlas-candidate="${V595_LIFECYCLE_CURRENT_CANDIDATE}"][data-stellar-hero-id="${heroId}"]`;

export type AtlasRuntimeWorkbenchSurfaceScope = {
  atlasShellSceneMode: AtlasSceneMode | "scene-lab";
  atlasRuntimeQualityTier: import("../lib/simulationDiagnosticsTypes").AtlasRuntimeQualityTier;
  selectedExoplanetSystemId: string;
  selectedCelestialCatalogId: string;
  selectedBodyIndex: number | null;
  rootAttributes: AtlasLegacyRootAttributesV256;
  atlasSceneMode: AtlasSceneMode;
  orbitAtlas: boolean;
  onAtlasBodyCanvasPick: (bodyIndex: number) => void;
  onBodyCanvasPick: (bodyIndex: number) => void;
  onBrightStarFocus: (star: import("../data/brightStarCatalog").BrightStarDef) => void;
  requestGaiaStarFocus: (indexed: import("../lib/gaiaCatalogIndex").GaiaIndexedStar, source?: import("../lib/atlasFocusV2").AtlasFocusSource) => void;
  requestCatalogObjectFocus: (catalogId: string, source?: import("../lib/atlasFocusV2").AtlasFocusSource) => void;
  atlasPerformanceBudgetSummary: import("../lib/simulationDiagnosticsTypes").AtlasPerformanceBudgetSummary;
  presentation: { presentationMode: SolarPresentationMode; scaleMode: OrbitAtlasScaleMode; renderBudget: OrbitAtlasRenderBudget; setPresentationMode: (next: SolarPresentationMode) => void; setScaleMode: (next: OrbitAtlasScaleMode) => void; setRenderBudget: (next: OrbitAtlasRenderBudget) => void; };
  atlasSkyCloseupProfile: string;
  atlasCinematicCameraProfile: "selected-body-cinematic" | "showcase-deep-space" | "overview-atlas";
  atlasCinematicSkyCompositionProfile: import("../lib/simulationDiagnosticsTypes").AtlasCinematicSkyCompositionProfile;
  atlasCinematicBackgroundNoiseProfile: import("../lib/simulationDiagnosticsTypes").AtlasCinematicBackgroundNoiseProfile;
  atlasCinematicTargetSeparationProfile: import("../lib/simulationDiagnosticsTypes").AtlasCinematicTargetSeparationProfile;
  atlasBackgroundDepthProfile: "closeup-subject-negative-space" | "showcase-reference-depth" | "overview-sparse-layered-milky-way";
  atlasBackgroundSubjectVisibilityProfile: import("../lib/simulationDiagnosticsTypes").AtlasBackgroundSubjectVisibilityProfile;
  atlasReferenceGradeCompositeProfile: "selected-body-subject-matte" | "showcase-cinematic-deep-space" | "overview-layered-reference-grade";
  atlasReferenceGradeSkyLayerProfile: "v48-local-closeup-negative-space" | "v48-local-showcase-milky-way" | "v48-local-generated-layered-sky";
  atlasReferenceGradeStarfieldProfile: "closeup-star-noise-suppressed" | "showcase-structured-starfield" | "sparse-primary-stars";
  atlasReferenceGradeSubjectMatteProfile: "selected-body-background-matte" | "showcase-center-negative-space" | "overview-no-subject-matte";
  atlasReferenceGradePlanetMaterialProfile: "solar-edge-controlled" | "gas-giant-ring-readability" | "closeup-microcontrast-fill" | "overview-local-hd";
  atlasSelectedBodyMaterialProfile: "solar-granulation-depth" | "earth-cloud-night-depth" | "saturn-ring-material-depth" | "gas-giant-band-depth" | "lunar-mars-relief-depth" | "terrestrial-terminator-depth" | "overview-local-material";
  atlasSelectedBodyAtmosphereDepthProfile: "solar-edge-controlled-depth" | "thin-earth-limb-depth" | "gas-giant-soft-limb-depth" | "airless-relief-limb" | "overview-atmosphere";
  atlasSelectedBodyTerminatorProfile: "solar-limb-darkening" | "earth-night-cloud-terminator" | "gas-band-low-fill-terminator" | "airless-relief-terminator" | "overview-terminator";
  atlasSelectedBodyRingProfile: "saturn-cassini-layered-ring" | "no-ring-profile";
  atlasSelectedBodyKeyLightProfile: "solar-surface-edge-key" | "earth-cloud-night-key-balance" | "saturn-ring-key-fill" | "gas-giant-readable-key-fill" | "lunar-mars-relief-key" | "overview-natural-phase";
  atlasSelectedBodyDepthLightingProfile: "solar-granulation-limb-depth" | "earth-atmospheric-terminator-depth" | "saturn-ring-shadow-depth" | "gas-giant-banded-phase-depth" | "airless-relief-terminator-depth" | "overview-no-depth-lighting";
  atlasSelectedBodyColorGradeProfile: "solar-photosphere-color-depth" | "earth-ocean-cloud-color-depth" | "saturn-ring-occlusion-color-grade" | "gas-giant-layer-color-grade" | "airless-regolith-color-depth" | "overview-neutral-color";
  atlasSelectedBodyGasGiantArtProfile: "saturn-muted-bands-ring-aware" | "gas-giant-band-depth-cinematic" | "overview-no-gas-giant-art";
  atlasSelectedBodySaturnRingArtProfile: "saturn-cassini-backlit-ring-art" | "no-ring-art-profile";
  atlasSelectedBodyEarthCloudNightProfile: "earth-clean-cloud-night-shadow-art" | "overview-no-earth-cloud-night-art";
  atlasSelectedBodySolarSurfaceProfile: "solar-granulation-controlled-corona-art" | "overview-no-solar-surface-art";
  atlasGlobalColorGradeProfile: "filmic-cool-space-warm-planet-protection";
  atlasBackgroundArtGradeProfile: "closeup-subject-star-noise-matte" | "sparse-negative-space-milky-way-depth";
  atlasCinematicBackdropStarfieldProfile: "closeup-subject-star-noise-suppressed" | "sparse-primary-stars-faint-distant-field";
  atlasCinematicBackdropNebulaProfile: "closeup-nebula-haze-restrained" | "soft-local-nebula-haze-layer";
  atlasCinematicBackdropNegativeSpaceProfile: "selected-body-clean-dark-backdrop" | "layered-milky-way-negative-space";
  atlasSparseDeepSpaceStarfieldProfile: "closeup-primary-stars-subject-matte" | "sparse-primary-stars-ultrafaint-distant-field";
  atlasSparseDeepSpaceMilkyWayProfile: "closeup-dark-lane-negative-space" | "deep-cold-gray-blue-dark-lanes";
  atlasSparseDeepSpaceNebulaProfile: "closeup-haze-nearly-suppressed" | "barely-visible-local-haze";
  atlasSparseDeepSpaceNegativeSpaceProfile: "selected-body-clean-negative-space" | "overview-wide-negative-space";
  atlasCloseupCompositionProfile: "solar-surface-portrait" | "earth-limb-portrait" | "saturn-ring-showcase" | "gas-giant-band-portrait" | "lunar-mars-relief-portrait" | "overview-no-closeup-director";
  atlasCloseupPanelAvoidanceProfile: "centered-mobile-safe-subject" | "right-workbench-safe-subject-left" | "overview-no-panel-avoidance";
  atlasCloseupRingShowcaseProfile: "saturn-wide-tilted-ring-showcase" | "no-ring-showcase";
  atlasCinematicLightingSummary: import("../lib/simulationDiagnosticsTypes").AtlasCinematicLightingCompositionSummary;
  handleCanvasReady: () => void;
  setSkyReady: import("react").Dispatch<SetStateAction<boolean>>;
  handleCoreBodiesReady: () => void;
  clearFocusLock: () => void;
  handleLocalLaunchHandoff: (heliocentric: import("../lib/useAtlasLaunchController").AtlasLaunchHandoffState) => void;
  handleLaunchAbort: () => void;
  launchRuntimeActive: boolean;
  atlasToolsOpen: boolean;
  activeSection: BottomControlBarSection;
  searchFocusNonce: number;
  onBodyFocusFromList: (bodyIndex: number) => void;
  onSelectBody: (bodyIndex: number) => void;
  onNearbyStarFocus: (direction: [number, number, number], catalogId?: string) => void;
  viewSettings: SimulationViewSettings;
  setViewSettings: import("react").Dispatch<SetStateAction<SimulationViewSettings>>;
  openKerrLab: () => void;
  visualEnhance: boolean;
  setVisualEnhance: import("react").Dispatch<SetStateAction<boolean>>;
  leftPanelCollapsed: boolean;
  handleLeftPanelCollapsedChange: (collapsed: boolean) => void;
  lagrangeSpawnNonceRef: import("react").RefObject<number>;
  openAtlasMissionHub: () => void;
  openAtlasObservatoryDeck: () => void;
  openAtlasWorkflows: () => void;
  openAtlasScientificReport: () => void;
  openAtlasValidationConsole: () => void;
  setEvidenceInitialClaimId: (entryId: string) => void;
  setEvidenceLedgerOpen: import("../lib/atlasRuntimeStore").AtlasPanelBooleanSetter;
  handleExportSystemState: () => void;
  importStateInputRef: import("react").RefObject<HTMLInputElement | null>;
  physicsRef: import("react").MutableRefObject<import("../lib/useSolarSystem").SolarSystemPhysicsRef | null>;
  precisionTierRef: import("react").RefObject<PhysicsPrecisionTier>;
  physicsUsesSharedBuffer: boolean;
  kerrBlackHole: KerrBlackHoleUiState;
  setKerrBlackHole: import("react").Dispatch<SetStateAction<KerrBlackHoleUiState>>;
  telemetrySeriesRef: import("react").RefObject<TelemetrySeriesState | null>;
  simulationDiagnosticsRef: import("react").RefObject<SimulationDiagnostics | null>;
  relativityEnabled: boolean;
  relativityEnabledRef: import("react").MutableRefObject<boolean>;
  floatingOriginRef: import("react").MutableRefObject<import("../lib/floatingOrigin").FloatingOriginState>;
  cameraBodyFocusRequest: import("./UniverseScene").CameraBodyFocusRequest | null;
  cameraOriginResetNonce: number;
  earthMoonView: boolean;
  selectedStellarSearchDocument: import("../lib/stellarSearchCatalog").StellarSearchDocument | null;
  selectedBodyCloseupActive: boolean;
  selectedBodyLightingProfile: import("../lib/simulationDiagnosticsTypes").AtlasSelectedBodyLightingProfile;
  integrationSuspendedRef: import("react").MutableRefObject<boolean>;
  launchMode: boolean;
  localLaunchActiveRef: import("react").MutableRefObject<boolean>;
  launchConfigRef: import("react").MutableRefObject<import("../lib/launchTelemetryTypes").LaunchConfig | null>;
  panelSurfaceActivated: boolean;
  isMobileViewport: boolean;
  ATLAS_RUNTIME_MODAL_PANEL_IDS: readonly ["navigator"];
  evidenceInitialClaimId: string;
  gaiaCatalogSource: import("../data/gaiaStarCatalog").GaiaCatalogSource;
  atlasReady: boolean;
  atlasWorkflowSummary: import("../lib/simulationDiagnosticsTypes").AtlasWorkflowSummary;
  atlasWorkflowSelectedId: string;
  atlasWorkflowActiveStepId: string;
  setAtlasWorkflowSelectedId: (workflowId: string) => void;
  setAtlasWorkflowActiveStepId: (stepId: string) => void;
  handleAtlasWorkflowRunStep: (step: AtlasWorkflowStep) => void;
  setAtlasWorkflowOpen: import("../lib/atlasRuntimeStore").AtlasPanelBooleanSetter;
  atlasMissionHubSummary: import("../lib/simulationDiagnosticsTypes").AtlasMissionHubSummary;
  handleMissionHubExecuteItem: (item: AtlasMissionHubItem) => void;
  handleMissionHubTogglePinned: (item: AtlasMissionHubItem) => void;
  handleCopyMissionCapsuleLink: () => void;
  handleExportMissionCapsule: () => void;
  missionCapsuleImportInputRef: import("react").RefObject<HTMLInputElement | null>;
  handleClearMissionCapsuleHash: () => void;
  setAtlasMissionHubOpen: import("../lib/atlasRuntimeStore").AtlasPanelBooleanSetter;
  deferredEvidenceModules: import("../lib/useAtlasDeferredEvidenceModules").AtlasDeferredEvidenceModuleSetV195;
  atlasScientificReportSummary: import("../lib/simulationDiagnosticsTypes").AtlasScientificReportSummary;
  atlasReportStudioSummary: import("../lib/simulationDiagnosticsTypes").AtlasReportStudioSummary;
  atlasScientificReportExportFormat: AtlasReportExportFormat;
  handleAtlasReportTemplateChange: (templateId: AtlasReportTemplateId) => void;
  handleAtlasReportSectionToggle: (sectionId: AtlasReportSectionId, enabled: boolean) => void;
  handleExportScientificReportMarkdown: () => Promise<void>;
  handleExportScientificReportJson: () => Promise<void>;
  handleExportScientificReportHtml: () => Promise<void>;
  handleCopyScientificReportSummary: () => Promise<void>;
  setAtlasScientificReportOpen: import("../lib/atlasRuntimeStore").AtlasPanelBooleanSetter;
  atlasValidationConsoleSummary: import("../lib/simulationDiagnosticsTypes").AtlasValidationConsoleSummary;
  atlasValidationSelectedDomainId: AtlasValidationDomainId;
  setAtlasValidationSelectedDomainId: (domainId: AtlasValidationDomainId) => void;
  handleValidationDomainAction: (domain: AtlasValidationDomain) => void;
  handleValidationIssueAction: (issue: AtlasValidationIssue) => void;
  setAtlasValidationConsoleOpen: import("../lib/atlasRuntimeStore").AtlasPanelBooleanSetter;
  atlasObservatoryDeckSummary: import("../lib/simulationDiagnosticsTypes").AtlasObservatoryDeckSummary;
  atlasObservatoryActiveZoneId: AtlasObservatoryZoneId;
  setAtlasObservatoryActiveZoneId: (zoneId: AtlasObservatoryZoneId) => void;
  handleObservatoryDeckAction: (action: AtlasObservatoryDeckAction) => void;
  setAtlasObservatoryDeckOpen: import("../lib/atlasRuntimeStore").AtlasPanelBooleanSetter;
  legacyRelativityPanelProps: ReturnType<typeof import("../lib/atlasLegacyRelativityPanelAdapterV190").createAtlasLegacyRelativityPanelProps>;
  relativityObservableAtlasSummary: import("../lib/simulationDiagnosticsTypes").RelativityObservableAtlasSummary;
  relativityObservableExplainerSummary: import("../lib/simulationDiagnosticsTypes").RelativityObservableExplainerSummary;
  atlasRelativityVerificationSummary: import("../lib/simulationDiagnosticsTypes").AtlasRelativityVerificationSummary;
  atlasRelativityChartSummary: import("../lib/simulationDiagnosticsTypes").AtlasRelativityChartSummary;
  atlasPhysicsBenchmarkGateSummary: import("../lib/simulationDiagnosticsTypes").AtlasPhysicsBenchmarkGateSummary;
  atlasHorizonsGateAuditSummary: import("../lib/simulationDiagnosticsTypes").AtlasHorizonsGateAuditSummary;
  atlasPhysicsGateSplitSummary: import("../lib/simulationDiagnosticsTypes").AtlasPhysicsGateSplitSummary;
  atlasScientificGatePreflightSummary: import("../lib/simulationDiagnosticsTypes").AtlasScientificGatePreflightSummary;
  atlasHorizonsResidualDecompositionSummary: import("../lib/simulationDiagnosticsTypes").AtlasHorizonsResidualDecompositionSummary;
  atlasGaiaStarfieldEnhancementSummary: import("../lib/simulationDiagnosticsTypes").AtlasGaiaStarfieldEnhancementSummary;
  atlasRelativitySimulationOptimizationSummary: import("../lib/simulationDiagnosticsTypes").AtlasRelativitySimulationOptimizationSummary;
  setRelativityObservableAtlasOpen: import("../lib/atlasRuntimeStore").AtlasPanelBooleanSetter;
  setObservationalAstrophysicsOpen: import("../lib/atlasRuntimeStore").AtlasPanelBooleanSetter;
  navigatorEvidenceSummary: EvidenceLedgerSummary;
  gaiaIndex: readonly import("../lib/gaiaCatalogIndex").GaiaIndexedStar[];
  setAtlasNavigatorOpen: import("../lib/atlasRuntimeStore").AtlasPanelBooleanSetter;
  handleAtlasNavigatorExecute: (item: AtlasNavigatorItem) => void;
  setOrbitAnalysisOpen: import("../lib/atlasRuntimeStore").AtlasPanelBooleanSetter;
  simDaysRef: import("react").RefObject<number>;
  celestialObjectPassport: import("../lib/simulationDiagnosticsTypes").CelestialObjectPassport | null;
  setSelectedCelestialCatalogId: import("react").Dispatch<SetStateAction<string>>;
  bodyMetricsRef: import("react").RefObject<BodyLiveMetrics | null>;
  daysPerSecond: number;
  handleImportStateFile: (ev: ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleImportMissionCapsuleFile: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  localLaunchActive: boolean;
  launchState: import("../lib/launchTelemetryTypes").LaunchSimState;
  localTelemetryRef: import("react").RefObject<import("../lib/localLaunchPhysics").LocalTelemetry | null>;
  isPlaying: boolean;
  setIsPlaying: import("react").Dispatch<SetStateAction<boolean>>;
  handleSearch: () => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  setActiveSection: import("react").Dispatch<SetStateAction<BottomControlBarSection>>;
  setLaunchMode: import("react").Dispatch<SetStateAction<boolean>>;
  orbitAnalysisOpen: boolean;
  atlasWorkflowOpen: boolean;
  atlasMissionHubOpen: boolean;
  atlasObservatoryDeckOpen: boolean;
  atlasScientificReportOpen: boolean;
  atlasValidationConsoleOpen: boolean;
  evidenceLedgerOpen: boolean;
  handleFocus: () => void;
  handleEarthMoon: () => void;
  simSlower: () => void;
  simFaster: () => void;
  simRewind: () => void;
  simFastForward: () => void;
  toggleRelativity: () => void;
  timeTravelScrubURef: import("react").RefObject<number>;
  timeTravelScrubbingRef: import("react").RefObject<boolean>;
  physicsHistoryRef: import("react").RefObject<PhysicsHistoryStack>;
  timeTravelScrubUi: number;
  setTimeTravelScrubUi: import("react").Dispatch<SetStateAction<number>>;
  syncTimeTravelSuspension: () => void;
  handleLaunchStart: (config: import("../lib/launchTelemetryTypes").LaunchConfig) => void;
};

function AtlasRuntimeWorkbenchSurfaceNormal({
  domains,
}: {
  domains: AtlasRuntimeWorkbenchDomains;
}) {
  const [visualDiagnosticsEnabled, setVisualDiagnosticsEnabled] = useState(false);
  const [mainlinePerformanceOpen, setMainlinePerformanceOpen] = useState(false);
  const experienceMode = useAtlasRuntimeStore((snapshot) => snapshot.experienceMode);
  const scaleBand = useAtlasRuntimeStore((snapshot) => snapshot.scaleBand);
  const visualProfile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  const researchMode = experienceMode === "research";
  const [postV593RelativityMode, setPostV593RelativityMode] = useState<PostV593RelativityModeV1>(
    experienceMode === "research" ? "science" : "cinematic",
  );
  const [exactAbActive, setExactAbActive] = useState(false);
  const [exactAbLane, setExactAbLane] = useState<V595ExactAbLane>(V595_EXACT_AB_LANES[0]);
  const [exactAbControlsExpanded, setExactAbControlsExpanded] = useState(true);
  const [exactAbReceipt, setExactAbReceipt] = useState<V595ExactAbConsumerReceipt | null>(null);
  const [visualCheckpointActive, setVisualCheckpointActive] = useState(false);
  const [visualCheckpointReceipt, setVisualCheckpointReceipt] =
    useState<V596VisualCheckpointConsumerReceipt | null>(null);
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("visualDiagnostics") === "1";
    setVisualDiagnosticsEnabled(process.env.NODE_ENV !== "production" || requested);
    if (requested) atlasRuntimeStore.setExperienceMode("research");
  }, []);
  const { atlasRuntimeQualityTier, orbitAtlas, atlasPerformanceBudgetSummary, lagrangeSpawnNonceRef, kerrBlackHole } = domains.scene;
  const {
    atlasShellSceneMode, rootAttributes, atlasToolsOpen, activeSection, viewSettings,
    setViewSettings, visualEnhance, setVisualEnhance, leftPanelCollapsed,
    handleLeftPanelCollapsedChange,
  } = domains.shellHud;
  const { setKerrBlackHole, isMobileViewport } = domains.panels;
  const {
    selectedExoplanetSystemId, selectedCelestialCatalogId, selectedBodyIndex,
    searchFocusNonce, onBodyFocusFromList, onSelectBody, onNearbyStarFocus, celestialObjectPassport,
    requestCatalogObjectFocus, clearFocusLock, openKerrLab,
  } = domains.navigationFocus;
  const {
    openAtlasMissionHub, openAtlasObservatoryDeck, openAtlasWorkflows,
    openAtlasScientificReport, openAtlasValidationConsole, setEvidenceInitialClaimId,
    setEvidenceLedgerOpen,
  } = domains.evidenceMission;
  const { launchRuntimeActive } = domains.launch;
  const objectBrowserMounted = !launchRuntimeActive && (
    !orbitAtlas || atlasToolsOpen || exactAbActive || searchFocusNonce > 0
  );
  const objectBrowserOpen = objectBrowserMounted && !leftPanelCollapsed;
  const {
    handleExportSystemState, importStateInputRef, physicsRef, precisionTierRef,
    physicsUsesSharedBuffer, telemetrySeriesRef, simulationDiagnosticsRef,
    relativityEnabled,
  } = domains.timelinePhysics;
  const { isPlaying, setIsPlaying, simDaysRef } = domains.timelinePhysics;
  const selectedObjectId =
    selectedExoplanetSystemId ||
    selectedCelestialCatalogId ||
    (selectedBodyIndex !== null ? SOLAR_SYSTEM_BODIES[selectedBodyIndex]?.id ?? "" : "");
  const passportSession = useCelestialObjectPassportSessionV638(selectedCelestialCatalogId, celestialObjectPassport);
  const mobilePassportOpen = isMobileViewport && passportSession.isOpen;
  useEffect(() => {
    const exactResolution = resolveV595ExactAbSearch(window.location.search);
    const checkpointResolution = resolveV596VisualCheckpointSearch(window.location.search);
    const nextExactActive = exactResolution.status === "active";
    const nextCheckpointActive = checkpointResolution.status === "active";
    setExactAbActive(nextExactActive);
    setVisualCheckpointActive(nextCheckpointActive);
    if (!nextExactActive && !nextCheckpointActive) return;
    setIsPlaying(false);
    simDaysRef.current = 0;
  }, [setIsPlaying, simDaysRef]);
  const captureQueryConflict = exactAbActive && visualCheckpointActive;
  const exactAbSelection = useMemo(() => exactAbActive && !captureQueryConflict
    ? resolveV595ExactAbSelection(selectedObjectId, postV593RelativityMode)
    : null, [captureQueryConflict, exactAbActive, postV593RelativityMode, selectedObjectId]);
  const exactAbEligibility = resolveV595ExactAbRequestEligibility({
    active: exactAbActive && !captureQueryConflict,
    identityBound: ATLAS_V595_BUILD_IDENTITY.bindingStatus === "bound",
    paused: !isPlaying,
    simDays: simDaysRef.current,
    assetReady: domains.scene.atlasReady,
    selectedTargetReady: exactAbSelection !== null,
    controlsCollapsed: !exactAbControlsExpanded,
  });
  const exactAbBlockedReason = exactAbEligibility.eligible ? "" : exactAbEligibility.reason;
  const visualCheckpointSelection = useMemo(() => visualCheckpointActive
    && postV593RelativityMode !== "validation"
    ? resolveV596VisualCheckpointSelection(selectedObjectId, postV593RelativityMode)
    : null, [postV593RelativityMode, selectedObjectId, visualCheckpointActive]);
  const visualCheckpointEligibility = resolveV596VisualCheckpointEligibility({
    active: visualCheckpointActive,
    identityBound: ATLAS_V596_VISUAL_CHECKPOINT_IDENTITY.bindingStatus === "bound",
    conflictFree: !captureQueryConflict,
    paused: !isPlaying,
    simDays: simDaysRef.current,
    assetReady: domains.scene.atlasReady,
    selectedTargetReady: visualCheckpointSelection !== null,
  });
  const visualCheckpointBlockedReason = visualCheckpointEligibility.eligible
    ? ""
    : visualCheckpointEligibility.reason;
  const exactAbRequest = useMemo(() => {
    if (!exactAbEligibility.eligible || !exactAbSelection) return null;
    return createV595ExactAbRuntimeRequest({
      lane: exactAbLane,
      targetId: exactAbSelection.targetId,
      archetype: exactAbSelection.archetype,
      mode: exactAbSelection.mode,
      identity: ATLAS_V595_BUILD_IDENTITY,
    });
  }, [exactAbEligibility.eligible, exactAbLane, exactAbSelection]);
  const visualCheckpointRequest = useMemo(() => {
    if (!visualCheckpointEligibility.eligible || !visualCheckpointSelection) return null;
    return createV596VisualCheckpointRuntimeRequest({
      targetId: visualCheckpointSelection.targetId,
      archetype: visualCheckpointSelection.archetype,
      mode: visualCheckpointSelection.mode,
      identity: ATLAS_V596_VISUAL_CHECKPOINT_IDENTITY,
    });
  }, [visualCheckpointEligibility.eligible, visualCheckpointSelection]);
  const stellarRenderProfile = useMemo(() => visualCheckpointRequest
    ? createV596StellarRenderProfile(visualCheckpointRequest)
    : exactAbRequest
      ? createV595StellarRenderProfile(exactAbRequest) ?? undefined
      : undefined, [exactAbRequest, visualCheckpointRequest]);
  useEffect(() => {
    setExactAbReceipt(null);
  }, [exactAbRequest?.captureRequestId]);
  const handleExactAbReceipt = useCallback((receipt: V595ExactAbConsumerReceipt) => {
    if (receipt.captureRequestId !== exactAbRequest?.captureRequestId) return;
    setExactAbReceipt(receipt);
  }, [exactAbRequest?.captureRequestId]);
  useEffect(() => {
    setVisualCheckpointReceipt(null);
  }, [visualCheckpointRequest?.captureRequestId]);
  const handleVisualCheckpointReceipt = useCallback(
    (receipt: V596VisualCheckpointConsumerReceipt) => {
      if (receipt.captureRequestId !== visualCheckpointRequest?.captureRequestId) return;
      setVisualCheckpointReceipt(receipt);
    },
    [visualCheckpointRequest?.captureRequestId],
  );
  const runtimeStateV256 = useAtlasRuntimeEvidenceSurfaceStateV256({
    domains, experienceMode, scaleBand, visualProfile, selectedObjectId,
  });
  const v4ShellProps = resolveAtlasVisualShellPropsV285R1(visualProfile);
  return (
    <MainlineAObservationJourneyProviderM4 onFocus={(catalogId) => requestCatalogObjectFocus(catalogId, "object-browser")}
      blocked={launchRuntimeActive || researchMode || viewSettings.showKerrBlackHole || exactAbActive || visualCheckpointActive}>
    <AtlasAppShell
      {...v4ShellProps}
      className={`relative h-[100dvh] w-screen overflow-hidden bg-[#030303] ${visualProfile !== "legacy-v9" ? "atlas-science-cinematic" : ""} ${visualProfile === ATLAS_VISUAL_PROFILE_CANDIDATE_V269 ? "atlas-science-cinematic-v2" : ""} ${visualProfile === ATLAS_VISUAL_PROFILE_CANDIDATE_V274 ? "atlas-science-cinematic-v3" : ""} ${visualProfile === ATLAS_VISUAL_PROFILE_CANDIDATE_V285 ? "atlas-science-cinematic-v4" : ""}`}
      sceneMode={atlasShellSceneMode}
      qualityTier={atlasRuntimeQualityTier}
      selectedObjectId={selectedObjectId} data-atlas-visual-profile-v294={visualProfile}
      {...rootAttributes}
    >
      <AtlasRuntimeEvidenceSurfaceV256 state={runtimeStateV256} />
      <MainlineAWorkspaceNavigationV637
        toolsVisible={!launchRuntimeActive && !mobilePassportOpen}
        selectedCatalogId={selectedCelestialCatalogId}
        onFocus={onNearbyStarFocus}
        onOpenPerformance={() => setMainlinePerformanceOpen(true)}
        onOpenKerrStudio={openKerrLab}
      />
      <AtlasVisualABControlV261 />
      <ScienceCinematicVisualSurfaceV261 />
      {researchMode ? (
        <ObservingPlannerBoundaryV258
          selectedObjectId={selectedObjectId}
          gaiaIndex={domains.navigationFocus.gaiaIndex}
        />
      ) : null}
      {researchMode ? <GaiaScienceAnalysisBoundaryV259 /> : null}
      {visualDiagnosticsEnabled && researchMode ? (
        <Suspense fallback={null}>
          <AtlasVisualDiagnosticsSurface />
        </Suspense>
      ) : null}
      <AtlasRuntimeSceneLayer
        scene={domains.scene}
        shellHud={domains.shellHud}
        navigationFocus={domains.navigationFocus}
        launch={domains.launch}
        timelinePhysics={domains.timelinePhysics}
        exactAbRequest={exactAbRequest ?? undefined}
        visualCheckpointRequest={visualCheckpointRequest ?? undefined}
        stellarRenderProfile={stellarRenderProfile}
        onExactAbReceipt={exactAbRequest ? handleExactAbReceipt : undefined}
        onVisualCheckpointReceipt={
          visualCheckpointRequest ? handleVisualCheckpointReceipt : undefined
        }
      />
      {exactAbActive ? (
        <V595ExactAbDomSurface
          lane={exactAbLane}
          request={exactAbRequest}
          receipt={exactAbReceipt}
          controlsExpanded={exactAbControlsExpanded}
          blockedReason={exactAbBlockedReason}
          onLaneChange={(lane) => {
            setExactAbLane(lane);
            setExactAbReceipt(null);
          }}
          onCollapseControls={() => {
            setIsPlaying(false);
            simDaysRef.current = 0;
            setExactAbControlsExpanded(false);
          }}
        />
      ) : null}
      {visualCheckpointActive ? (
        <>
          <V596VisualCheckpointDomSurface
            request={visualCheckpointRequest}
            receipt={visualCheckpointReceipt}
            blockedReason={visualCheckpointBlockedReason}
          />
          <V596FormalEvidenceDomSurface receipt={visualCheckpointReceipt} />
        </>
      ) : null}
      {mainlinePerformanceOpen ? <MainlineAPerformanceSurfaceV637 onClose={() => setMainlinePerformanceOpen(false)} selectedCatalogId={selectedCelestialCatalogId} onFocusCatalogObject={(catalogId) => requestCatalogObjectFocus(catalogId, "object-browser")} onClearFocus={clearFocusLock} /> : null}
      {!launchRuntimeActive && !mobilePassportOpen && atlasToolsOpen ? <MainlineABetaIntakePanelV607 /> : null}
      {!launchRuntimeActive && !mobilePassportOpen ? (
        <PostV593RelativityWorkbenchPanel
          mode={postV593RelativityMode}
          objectBrowserOpen={objectBrowserOpen}
          onRequestOpen={() => handleLeftPanelCollapsedChange(true)}
          onModeChange={(nextMode) => {
            setPostV593RelativityMode(nextMode);
            if (nextMode === "cinematic") atlasRuntimeStore.setExperienceMode("explore");
            else atlasRuntimeStore.setExperienceMode("research");
          }}
          onOpenValidation={() => {
            if (shouldOpenV595ValidationConsole(exactAbActive)) openAtlasValidationConsole();
          }}
        />
      ) : null}
      {objectBrowserMounted ? (
        <div className="contents" data-universe-sandbox-hud="true">
          <UniverseSandboxHud
            activeSection={activeSection}
            searchFocusNonce={searchFocusNonce}
            selectedBodyIndex={selectedBodyIndex}
            selectedCatalogId={selectedCelestialCatalogId}
            onBodyFocus={onBodyFocusFromList}
            onBodyInspect={onSelectBody}
            onNearbyStarFocus={onNearbyStarFocus}
            onConstellationFocus={onNearbyStarFocus}
            viewSettings={viewSettings}
            onViewSettingsChange={setViewSettings}
            visualEnhance={visualEnhance}
            onVisualEnhanceChange={setVisualEnhance}
            leftPanelCollapsed={leftPanelCollapsed}
            onLeftPanelCollapsedChange={handleLeftPanelCollapsedChange}
            lagrangeSpawnNonceRef={lagrangeSpawnNonceRef}
            onAtlasMissionHubOpen={openAtlasMissionHub}
            onAtlasObservatoryDeckOpen={openAtlasObservatoryDeck}
            onAtlasWorkflowsOpen={openAtlasWorkflows}
            onAtlasScientificReportOpen={openAtlasScientificReport}
            onAtlasValidationConsoleOpen={openAtlasValidationConsole}
            onEvidenceLedgerOpen={() => {
              setEvidenceInitialClaimId("");
              setEvidenceLedgerOpen(true);
            }}
            onExportSystemState={handleExportSystemState}
            onImportSystemState={() => importStateInputRef.current?.click()}
          />
        </div>
      ) : null}
      {!launchRuntimeActive && !orbitAtlas && researchMode ? (
        <div className="contents" data-physics-performance-hud="true">
          <PhysicsPerformanceHud
            physicsRef={physicsRef}
            precisionTierRef={precisionTierRef}
            physicsUsesSharedBuffer={physicsUsesSharedBuffer}
            performanceBudgetSummary={atlasPerformanceBudgetSummary}
          />
        </div>
      ) : null}
      {!launchRuntimeActive && viewSettings.showKerrBlackHole ? (
        <Suspense fallback={null}>
          <KerrBlackHolePanel value={kerrBlackHole} onChange={setKerrBlackHole} />
        </Suspense>
      ) : null}
      {!launchRuntimeActive && !orbitAtlas && activeSection === "tools" && researchMode ? (
        <Suspense fallback={null}>
          <div className="contents" data-science-telemetry-panel="true">
            <ScienceTelemetryPanel
              telemetrySeriesRef={telemetrySeriesRef}
              simulationDiagnosticsRef={simulationDiagnosticsRef}
              selectedBodyIndex={selectedBodyIndex}
              relativityEnabled={relativityEnabled}
              mainSidebarOffsetPx={leftPanelCollapsed ? 0 : 288}
            />
          </div>
        </Suspense>
      ) : null}
      <AtlasRuntimePanelLayer
        passportSession={passportSession}
        scene={domains.scene}
        shellHud={domains.shellHud}
        panels={domains.panels}
        navigationFocus={domains.navigationFocus}
        evidenceMission={domains.evidenceMission}
        launch={domains.launch}
        timelinePhysics={domains.timelinePhysics}
      />
      <AtlasRuntimeDockLayer
        objectBrowserOpen={objectBrowserOpen}
        scene={domains.scene}
        shellHud={domains.shellHud}
        panels={domains.panels}
        navigationFocus={domains.navigationFocus}
        evidenceMission={domains.evidenceMission}
        launch={domains.launch}
        timelinePhysics={domains.timelinePhysics}
      />
    </AtlasAppShell>
    </MainlineAObservationJourneyProviderM4>
  );
}

function PostV594SameRealmLifecycleSurface({
  domains,
}: Readonly<{
  domains: AtlasRuntimeWorkbenchDomains;
}>) {
  const mountHeroId = "sirius-a" satisfies StellarHeroIdV592;
  const replacementHeroId = "betelgeuse" satisfies StellarHeroIdV592;
  const [phase, setPhase] = useState<PostV594SameRealmLifecyclePhase>("baseline-pending");
  const [sceneMounted, setSceneMounted] = useState(false);
  const [auditTargetHeroId, setAuditTargetHeroId] = useState<StellarHeroIdV592 | null>(null);
  const [replacementObservation, setReplacementObservation] = useState<Readonly<{
    heroId: typeof replacementHeroId;
    archetype: string;
    contractSha256: string;
  }> | null>(null);
  const { atlasShellSceneMode } = domains.shellHud;
  const { atlasRuntimeQualityTier } = domains.scene;
  const { onNearbyStarFocus, selectedCelestialCatalogId } = domains.navigationFocus;

  const focusStellarHero = useCallback((heroId: StellarHeroIdV592) => {
    const hero = STELLAR_HERO_BY_ID_V592[heroId];
    const ra = hero.raDeg * Math.PI / 180;
    const dec = hero.decDeg * Math.PI / 180;
    onNearbyStarFocus(
      [Math.cos(dec) * Math.cos(ra), Math.sin(dec), Math.cos(dec) * Math.sin(ra)],
      `stellar-hero:${heroId}`,
    );
  }, [onNearbyStarFocus]);

  useEffect(() => {
    beginPostV594SameRealmLifecycleLedger();
    let stableKey: string | null = null;
    let stableSince = 0;
    let published = false;
    const sampleBaseline = () => {
      if (published) return;
      const root = document.querySelector<HTMLElement>("[data-atlas-v594-lifecycle-root]");
      const canvases = root ? Array.from(root.querySelectorAll("canvas")) : null;
      const snapshot = createPostV594NoCanvasSnapshot({
        canvasCount: canvases?.length ?? null,
        connectedCanvasCount: canvases?.filter((canvas) => canvas.isConnected).length ?? null,
      });
      if (!postV594BaselineSnapshotIsObserved(snapshot)) {
        stableKey = null;
        stableSince = 0;
        return;
      }
      const nextKey = postV594LifecycleSnapshotStabilityKey(snapshot);
      const now = performance.now();
      if (stableKey !== nextKey) {
        stableKey = nextKey;
        stableSince = now;
        return;
      }
      if (now - stableSince < POST_V594_LIFECYCLE_STABLE_MILLISECONDS) return;
      published = true;
      recordPostV594LifecycleSnapshot("baseline", snapshot);
      setPhase("baseline");
      window.clearInterval(timer);
    };
    const timer = window.setInterval(
      sampleBaseline,
      POST_V594_LIFECYCLE_SAMPLE_INTERVAL_MILLISECONDS,
    );
    sampleBaseline();
    return () => window.clearInterval(timer);
  }, []);

  const recordRendererSnapshot = useCallback((
    nextPhase: "mounted" | "detached-stable" | "exited",
    snapshot: PostV594LifecycleSnapshot,
  ) => {
    const currentPhase = getPostV594SameRealmLifecycleLedger()?.phase;
    if (nextPhase === "exited") {
      if (
        currentPhase === "exiting"
        && postV594SnapshotSatisfiesReleaseContract(snapshot)
      ) {
        recordPostV594LifecycleSnapshot("exited", snapshot);
      }
      return;
    }
    if (
      (nextPhase === "mounted" && (
        currentPhase !== "mounting"
        || !postV594MountedSnapshotIsActive(snapshot)
        || snapshot.scene.stellarHeroIds?.length !== 1
        || snapshot.scene.stellarHeroIds[0] !== mountHeroId
      ))
      || (nextPhase === "detached-stable" && (
        currentPhase !== "detaching"
        || !postV594SnapshotSatisfiesReleaseContract(snapshot)
      ))
    ) return;
    recordPostV594LifecycleSnapshot(nextPhase, snapshot);
    setPhase(nextPhase);
  }, [mountHeroId]);

  const recordExitObservation = useCallback((
    observation: PostV594LifecycleExitObservation,
  ) => {
    recordPostV594LifecycleExitObservation(observation);
  }, []);

  const mountScene = useCallback(() => {
    const ledger = getPostV594SameRealmLifecycleLedger();
    const baseline = ledger?.snapshots.baseline;
    if (
      phase !== "baseline"
      || ledger?.phase !== "baseline"
      || !baseline
      || !postV594BaselineSnapshotIsObserved(baseline)
    ) return;
    setAuditTargetHeroId(mountHeroId);
    setReplacementObservation(null);
    focusStellarHero(mountHeroId);
    recordPostV594LifecyclePhase("mounting");
    setPhase("mounting");
    setSceneMounted(true);
  }, [focusStellarHero, mountHeroId, phase]);

  const replaceScene = useCallback(() => {
    const ledger = getPostV594SameRealmLifecycleLedger();
    const mounted = ledger?.snapshots.mounted;
    if (
      phase !== "mounted"
      || ledger?.phase !== "mounted"
      || !mounted
      || !postV594MountedSnapshotIsActive(mounted)
      || mounted.scene.stellarHeroIds?.length !== 1
      || mounted.scene.stellarHeroIds[0] !== mountHeroId
    ) return;
    setReplacementObservation(null);
    setAuditTargetHeroId(replacementHeroId);
    recordPostV594LifecyclePhase("replacing");
    setPhase("replacing");
    focusStellarHero(replacementHeroId);
  }, [focusStellarHero, mountHeroId, phase, replacementHeroId]);

  useEffect(() => {
    if (phase !== "replacing") return;
    let stableKey: string | null = null;
    let stableSince = 0;
    let published = false;
    const sampleReplacement = () => {
      if (published) return;
      const candidates = Array.from(document.querySelectorAll<HTMLElement>(
        v595LifecycleReplacementSelector(replacementHeroId),
      ));
      const candidate = candidates.length === 1 ? candidates[0] : null;
      const archetype = candidate?.dataset.stellarArchetype?.trim() ?? "";
      const contractSha256 = candidate?.dataset.stellarRenderContractSha256?.trim() ?? "";
      const targetId = candidate?.dataset.stellarTargetId?.trim() ?? "";
      const qualifies = targetId === `stellar-hero:${replacementHeroId}`
        && archetype.length > 0
        && /^[0-9a-f]{64}$/.test(contractSha256)
        && getPostV594SameRealmLifecycleLedger()?.phase === "replacing";
      if (!qualifies) {
        stableKey = null;
        stableSince = 0;
        return;
      }
      const nextKey = `${replacementHeroId}:${archetype}:${contractSha256}`;
      const now = performance.now();
      if (stableKey !== nextKey) {
        stableKey = nextKey;
        stableSince = now;
        return;
      }
      if (now - stableSince < POST_V594_LIFECYCLE_STABLE_MILLISECONDS) return;
      published = true;
      setReplacementObservation(Object.freeze({
        heroId: replacementHeroId,
        archetype,
        contractSha256,
      }));
      recordPostV594LifecyclePhase("replaced");
      setPhase("replaced");
      window.clearInterval(timer);
    };
    const timer = window.setInterval(
      sampleReplacement,
      POST_V594_LIFECYCLE_SAMPLE_INTERVAL_MILLISECONDS,
    );
    sampleReplacement();
    return () => window.clearInterval(timer);
  }, [phase, replacementHeroId]);

  const detachScene = useCallback(() => {
    const ledger = getPostV594SameRealmLifecycleLedger();
    const mounted = ledger?.snapshots.mounted;
    if (
      phase !== "replaced"
      || ledger?.phase !== "replaced"
      || !mounted
      || !postV594MountedSnapshotIsActive(mounted)
      || replacementObservation?.heroId !== replacementHeroId
      || !replacementObservation.archetype
      || !/^[0-9a-f]{64}$/.test(replacementObservation.contractSha256)
    ) return;
    recordPostV594LifecyclePhase("detaching");
    setPhase("detaching");
    setSceneMounted(false);
  }, [phase, replacementHeroId, replacementObservation]);

  return (
    <AtlasAppShell
      className="relative h-[100dvh] w-screen overflow-hidden bg-[#030303] text-white"
      sceneMode={atlasShellSceneMode}
      qualityTier={atlasRuntimeQualityTier}
      data-atlas-v594-lifecycle-root
      data-atlas-v594-lifecycle-audit={POST_V594_SAME_REALM_LIFECYCLE_QUERY}
      data-atlas-v594-lifecycle-version={POST_V594_SAME_REALM_LIFECYCLE_VERSION}
      data-atlas-v594-lifecycle-phase={phase}
      data-atlas-v594-lifecycle-canvas-mounted={sceneMounted ? "true" : "false"}
      data-atlas-v594-lifecycle-target-hero-id={auditTargetHeroId ?? "none"}
      data-atlas-v594-lifecycle-selected-catalog-id={selectedCelestialCatalogId || "none"}
      data-atlas-v594-lifecycle-mount-hero-id={mountHeroId}
      data-atlas-v594-lifecycle-replacement-expected-hero-id={replacementHeroId}
      data-atlas-v594-lifecycle-replacement-status={replacementObservation ? "observed-stable" : phase === "replacing" ? "observing" : "not-observed"}
      data-atlas-v594-lifecycle-replacement-hero-id={replacementObservation?.heroId ?? "none"}
      data-atlas-v594-lifecycle-replacement-archetype={replacementObservation?.archetype ?? "none"}
      data-atlas-v594-lifecycle-replacement-contract-sha256={replacementObservation?.contractSha256 ?? "none"}
      data-atlas-v594-single-canvas-limit="1"
      data-atlas-v594-formal-product-pointer={POST_V594_BUILD_IDENTITY.formalProductPointer}
    >
      {sceneMounted ? (
        <AtlasRuntimeSceneLayer
          scene={domains.scene}
          shellHud={domains.shellHud}
          navigationFocus={domains.navigationFocus}
          launch={domains.launch}
          timelinePhysics={domains.timelinePhysics}
          lifecycleAuditV594={{
            lifecycleAudit: POST_V594_SAME_REALM_LIFECYCLE_QUERY,
            onLifecycleSnapshot: recordRendererSnapshot,
            onLifecycleExitObservation: recordExitObservation,
          }}
        />
      ) : null}

      <div
        className="pointer-events-auto absolute left-3 top-3 z-[90] flex flex-wrap gap-1 border border-white/15 bg-black/85 p-1 font-mono text-[8px] uppercase tracking-[.12em] text-white/75"
        data-atlas-v594-lifecycle-controls
      >
        <button
          type="button"
          data-atlas-v594-lifecycle-action="mount"
          disabled={phase !== "baseline"}
          onClick={mountScene}
          className="min-h-11 border border-white/20 px-3 disabled:opacity-30"
        >
          Mount scene
        </button>
        <button
          type="button"
          data-atlas-v594-lifecycle-action="replace"
          disabled={phase !== "mounted"}
          onClick={replaceScene}
          className="min-h-11 border border-white/20 px-3 disabled:opacity-30"
        >
          Replace with Betelgeuse
        </button>
        <button
          type="button"
          data-atlas-v594-lifecycle-action="detach"
          disabled={phase !== "replaced"}
          onClick={detachScene}
          className="min-h-11 border border-white/20 px-3 disabled:opacity-30"
        >
          Detach scene
        </button>
        <Link
          href="/downloads"
          prefetch={false}
          aria-disabled={phase !== "detached-stable"}
          onNavigate={(event) => {
            if (
              phase !== "detached-stable"
              || getPostV594SameRealmLifecycleLedger()?.phase !== "detached-stable"
            ) {
              event.preventDefault();
              return;
            }
            recordPostV594LifecyclePhase("exiting");
            setPhase("exiting");
          }}
          data-atlas-v594-lifecycle-action="exit"
          className={`flex min-h-11 items-center border border-white/20 px-3 ${phase === "detached-stable" ? "" : "pointer-events-none opacity-30"}`}
        >
          Exit to downloads
        </Link>
      </div>
    </AtlasAppShell>
  );
}

export default function AtlasRuntimeWorkbenchSurface({
  domains,
}: {
  domains: AtlasRuntimeWorkbenchDomains;
}) {
  const [cdpSoakAudit] = useState(resolvePostV594CdpSoakAudit);
  const [sameRealmLifecycleAudit] = useState(resolvePostV594SameRealmLifecycleAudit);
  return cdpSoakAudit
    ? (
      <>
        <V596FormalEvidenceDomSurface receipt={null} />
        <V594CdpSoakSurface domains={domains} />
      </>
    )
    : sameRealmLifecycleAudit
    ? <PostV594SameRealmLifecycleSurface domains={domains} />
    : <AtlasRuntimeWorkbenchSurfaceNormal domains={domains} />;
}

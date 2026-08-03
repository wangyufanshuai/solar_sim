"use client";
import AtlasAppShell from "./AtlasAppShell";
import { SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import { KerrBlackHolePanel, ScienceTelemetryPanel } from "./AtlasRuntimeWorkbenchLazySurfaces";
import UniverseSandboxHud from "./UniverseSandboxHud";
import PhysicsPerformanceHud from "./PhysicsPerformanceHud";
import { lazy, Suspense, useEffect, useState } from "react";
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
import AtlasRuntimeSceneLayer from "./AtlasRuntimeSceneLayer";
import AtlasRuntimePanelLayer from "./AtlasRuntimePanelLayer";
import AtlasRuntimeDockLayer from "./AtlasRuntimeDockLayer";
import type { AtlasRuntimeWorkbenchDomains } from "./atlasRuntimeWorkbenchDomains";
import AtlasRuntimeEvidenceSurfaceV256 from "./AtlasRuntimeEvidenceSurfaceV256";
import ObservingPlannerBoundaryV258 from "./ObservingPlannerBoundaryV258";
import GaiaScienceAnalysisBoundaryV259 from "./GaiaScienceAnalysisBoundaryV259";
import AtlasScaleNavigatorV260 from "./AtlasScaleNavigatorV260";
import AtlasVisualABControlV261 from "./AtlasVisualABControlV261";
import ScienceCinematicVisualSurfaceV261 from "./ScienceCinematicVisualSurfaceV261";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V269 } from "../lib/atlasVisualProfileV269";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V274, ATLAS_VISUAL_PROFILE_CANDIDATE_V285 } from "../lib/atlasVisualProfileV274";
import { resolveAtlasVisualShellPropsV285R1 } from "../lib/atlasVisualShellV285R1";
import type { AtlasLegacyRootAttributesV256 } from "../lib/atlasLegacyRootCompatibilityV256";
import { useAtlasRuntimeEvidenceSurfaceStateV256 } from "../lib/useAtlasRuntimeEvidenceSurfaceStateV256";
const AtlasVisualDiagnosticsSurface = lazy(
  () => import("./AtlasVisualDiagnosticsSurface"),
);
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

export default function AtlasRuntimeWorkbenchSurface({
  domains,
}: {
  domains: AtlasRuntimeWorkbenchDomains;
}) {
  const [visualDiagnosticsEnabled, setVisualDiagnosticsEnabled] = useState(false);
  const experienceMode = useAtlasRuntimeStore((snapshot) => snapshot.experienceMode);
  const scaleBand = useAtlasRuntimeStore((snapshot) => snapshot.scaleBand);
  const visualProfile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  const researchMode = experienceMode === "research";
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
  const { setKerrBlackHole } = domains.panels;
  const {
    selectedExoplanetSystemId, selectedCelestialCatalogId, selectedBodyIndex,
    searchFocusNonce, onBodyFocusFromList, onSelectBody, onNearbyStarFocus,
  } = domains.navigationFocus;
  const {
    openAtlasMissionHub, openAtlasObservatoryDeck, openAtlasWorkflows,
    openAtlasScientificReport, openAtlasValidationConsole, setEvidenceInitialClaimId,
    setEvidenceLedgerOpen,
  } = domains.evidenceMission;
  const { launchRuntimeActive } = domains.launch;
  const {
    handleExportSystemState, importStateInputRef, physicsRef, precisionTierRef,
    physicsUsesSharedBuffer, telemetrySeriesRef, simulationDiagnosticsRef,
    relativityEnabled,
  } = domains.timelinePhysics;
  const selectedObjectId =
    selectedExoplanetSystemId ||
    selectedCelestialCatalogId ||
    (selectedBodyIndex !== null ? SOLAR_SYSTEM_BODIES[selectedBodyIndex]?.id ?? "" : "");
  const runtimeStateV256 = useAtlasRuntimeEvidenceSurfaceStateV256({
    domains, experienceMode, scaleBand, visualProfile, selectedObjectId,
  });
  const v4ShellProps = resolveAtlasVisualShellPropsV285R1(visualProfile);
  return (
    <AtlasAppShell
      {...v4ShellProps}
      className={`relative h-[100dvh] w-screen overflow-hidden bg-[#030303] ${visualProfile !== "legacy-v9" ? "atlas-science-cinematic" : ""} ${visualProfile === ATLAS_VISUAL_PROFILE_CANDIDATE_V269 ? "atlas-science-cinematic-v2" : ""} ${visualProfile === ATLAS_VISUAL_PROFILE_CANDIDATE_V274 ? "atlas-science-cinematic-v3" : ""} ${visualProfile === ATLAS_VISUAL_PROFILE_CANDIDATE_V285 ? "atlas-science-cinematic-v4" : ""}`}
      sceneMode={atlasShellSceneMode}
      qualityTier={atlasRuntimeQualityTier}
      selectedObjectId={selectedObjectId} data-atlas-visual-profile-v294={visualProfile}
      {...rootAttributes}
    >
      <AtlasRuntimeEvidenceSurfaceV256 state={runtimeStateV256} />
      <AtlasScaleNavigatorV260 />
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
      />
      {!launchRuntimeActive && (!orbitAtlas || atlasToolsOpen) ? (
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
        scene={domains.scene}
        shellHud={domains.shellHud}
        panels={domains.panels}
        navigationFocus={domains.navigationFocus}
        evidenceMission={domains.evidenceMission}
        launch={domains.launch}
        timelinePhysics={domains.timelinePhysics}
      />
      <AtlasRuntimeDockLayer
        scene={domains.scene}
        shellHud={domains.shellHud}
        panels={domains.panels}
        navigationFocus={domains.navigationFocus}
        evidenceMission={domains.evidenceMission}
        launch={domains.launch}
        timelinePhysics={domains.timelinePhysics}
      />
    </AtlasAppShell>
  );
}

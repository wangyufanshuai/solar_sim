"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { BottomControlBarSection } from "./components/BottomControlBar";

import { DEFAULT_SIM_DAYS_PER_WORLD_SECOND, SOLAR_SYSTEM_BODIES } from "./data/planetsJ2000";
import type { BodyLiveMetrics } from "./lib/bodyLiveMetrics";
import type {
  AtlasNavigatorItem,
  AtlasMissionHubStoredState,
  AtlasReportExportFormat,
  AtlasReportSectionId,
  AtlasReportTemplateId,
  AtlasObservatoryZoneId,
  AtlasValidationDomainId,
  SimulationDiagnostics,
} from "./lib/simulationDiagnosticsTypes";
import type { TelemetrySeriesState } from "./lib/telemetryTypes";
import { useSolarSystemPhysics } from "./lib/useSolarSystem";
import type { PhysicsPrecisionTier } from "./lib/physicsPrecision";

import type { KerrBlackHoleUiState } from "./components/KerrBlackHolePanel";
import type { CameraBodyFocusRequest } from "./components/UniverseScene";

import { DEFAULT_SIMULATION_VIEW_SETTINGS, type SimulationViewSettings } from "./lib/simulationViewSettings";
import { createFloatingOrigin, type FloatingOriginState } from "./lib/floatingOrigin";
import { useSolarPresentation } from "./lib/useSolarPresentation";
import type { SolarPresentationMode } from "./lib/orbitAtlasPresentation";
import { DEFAULT_KERR_GEODESIC_RENDER_MODE, DEFAULT_KERR_IMPACT_PARAMETER_M, DEFAULT_KERR_ORBIT_PRESET_ID } from "./lib/kerrGeodesicVisualization";

import { useGaiaCatalogSource } from "./lib/gaiaCatalogSourceState";
import { ensureGaiaCatalogLoaded, useGaiaCatalogSnapshot } from "./lib/gaiaCatalogStore";
import { gaiaIndexedStarToCatalogEntry, getGaiaStarIndex } from "./lib/gaiaCatalogIndex";

import { createAtlasRuntimeEvidenceRootAttributesV190 } from "./lib/atlasRuntimeEvidenceCompositionV190";
import AtlasRuntimeWorkbenchSurface from "./components/AtlasRuntimeWorkbenchSurface";
import { useAtlasLaunchController } from "./lib/useAtlasLaunchController";
import { stellarDocumentToGaiaIndex, type StellarSearchDocument } from "./lib/stellarSearchCatalog";
import { createAtlasOfflineStellarSearchCatalogV2Summary } from "./lib/atlasOfflineStellarSearchCatalogV2";
import { createAtlasScientificCinematicArtSummary } from "./lib/atlasScientificCinematicArt";
import { createAtlasLaunchSceneOpenRocketReplaySummary } from "./lib/atlasLaunchSceneOpenRocketReplay";
import { createAtlasVisualIntegrationReleaseSummary } from "./lib/atlasVisualIntegrationRelease";

import { createAtlasVisualIntegrationV2Summary } from "./lib/atlasVisualIntegrationV2";
import { createAtlasScientificPromotionV2Summary } from "./lib/atlasScientificPromotionV2";
import {
  createCelestialObjectPassport,
  createCelestialCatalogSummary,
  createCelestialVisualLayerSummary,
} from "./lib/celestialCatalog";
import {
  navigatorItemToMissionHubStoredItem,
  recordAtlasMissionHubRecent,
} from "./lib/atlasMissionHub";

import { atlasRuntimeStore, useAtlasPanelSession, useAtlasRuntimeStore } from "./lib/atlasRuntimeStore";

import { createAtlasPerformanceBudgetSummary } from "./lib/atlasPerformanceBudget";

import { createAtlasVisualLaunchPerformanceSummary } from "./lib/atlasVisualLaunchPerformanceLock";
import { selectAtlasRuntimeQualityTier } from "./lib/launchSequenceDirector";
import { createAtlasRuntimeSceneFocusSummary, selectAtlasSceneMode, type AtlasSceneMode } from "./lib/atlasRuntimeSceneFocusPerformance";

import { useAtlasRuntimeScienceModel } from "./lib/useAtlasRuntimeScienceModel";
import { useAtlasViewportProfile } from "./lib/useAtlasViewportProfile";
import { createAtlasRuntimeVisualModel } from "./lib/createAtlasRuntimeVisualModel";
import { useAtlasDeferredEvidenceModules, useAtlasLegacyEvidenceDetails } from "./lib/useAtlasDeferredEvidenceModules";
import { createAtlasLegacyRelativityPanelProps } from "./lib/atlasLegacyRelativityPanelAdapterV190";
import { useAtlasScientificReportActions } from "./lib/useAtlasScientificReportActions";
import { useAtlasSimulationSession } from "./lib/useAtlasSimulationSession";
import { useAtlasWorkbenchScientificPanels } from "./lib/useAtlasWorkbenchScientificPanels";
import { useAtlasWorkbenchWorkflowActions } from "./lib/useAtlasWorkbenchWorkflowActions";
import { useAtlasWorkbenchNavigationActions } from "./lib/useAtlasWorkbenchNavigationActions";
import { useAtlasRuntimeVisualSummariesV198 } from "./lib/useAtlasRuntimeVisualSummariesV198";
import { useAtlasWorkbenchEvidenceMissionDomain } from "./lib/useAtlasWorkbenchEvidenceMissionDomain";
import { useAtlasWorkbenchFocusDomain } from "./lib/useAtlasWorkbenchFocusDomain";
import { useAtlasLaunchSelectionActions } from "./lib/useAtlasLaunchSelectionActions";

const CINEMATIC_GAS_GIANT_IDS = new Set(["jupiter", "saturn", "uranus", "neptune"]);
const ATLAS_RUNTIME_MODAL_PANEL_IDS = ["navigator"] as const;
const ATLAS_DETAILED_SCIENCE_PANEL_IDS = new Set([
  "evidence-ledger",
  "kerr-lab",
  "observational-astrophysics",
  "observatory-deck",
  "relativity-observables",
  "scientific-report",
  "validation-console",
]);
const CINEMATIC_LUNAR_MARS_IDS = new Set(["moon", "mars"]);

export default function AtlasRuntimeWorkbench() {
  const presentation = useSolarPresentation();
  const orbitAtlas = presentation.presentationMode === "orbit-atlas";
  const gaiaCatalogSource = useGaiaCatalogSource();
  const gaiaCatalogSnapshot = useGaiaCatalogSnapshot();
  const gaiaIndex = useMemo(
    () =>
      gaiaCatalogSnapshot.catalog
        ? getGaiaStarIndex(gaiaCatalogSnapshot.catalog.stars)
        : [],
    [gaiaCatalogSnapshot.catalog],
  );
  const gaiaIndexBySourceId = useMemo(
    () => new Map(gaiaIndex.map((entry) => [entry.sourceId, entry])),
    [gaiaIndex],
  );
  const gaiaIndexById = useMemo(
    () => new Map(gaiaIndex.map((entry) => [entry.id, entry])),
    [gaiaIndex],
  );
  useEffect(() => {
    void ensureGaiaCatalogLoaded();
  }, []);
  const { physicsRef, physicsReady, physicsUsesSharedBuffer } =
    useSolarSystemPhysics();
  const precisionTierRef = useRef<PhysicsPrecisionTier>("full");
  const floatingOriginRef = useRef<FloatingOriginState>(createFloatingOrigin());
  const simDaysRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [daysPerSecond, setDaysPerSecond] = useState(
    DEFAULT_SIM_DAYS_PER_WORLD_SECOND
  );
  const [activeSection, setActiveSection] =
    useState<BottomControlBarSection>("simulation");
  const [relativityEnabled, setRelativityEnabled] = useState(true);
  const relativityEnabledRef = useRef(true);
  relativityEnabledRef.current = relativityEnabled;
  /** UI selection and camera lock target (body index; `null` = free view / origin). */
  const [selectedBodyIndex, setSelectedBodyIndex] = useState<number | null>(
    null
  );
  const [selectedCelestialCatalogId, setSelectedCelestialCatalogId] = useState("");
  const [selectedStellarSearchDocument, setSelectedStellarSearchDocument] =
    useState<StellarSearchDocument | null>(null);
  const [selectedExoplanetSystemId, setSelectedExoplanetSystemId] = useState("");
  const viewportProfile = useAtlasViewportProfile();
  const viewportWidth = viewportProfile.width;
  const devicePixelRatio = viewportProfile.devicePixelRatio;
  const isMobileViewport = viewportProfile.mobile;
  const [cameraBodyFocusRequest, setCameraBodyFocusRequest] =
    useState<CameraBodyFocusRequest | null>(null);
  const [cameraOriginResetNonce, setCameraOriginResetNonce] = useState(0);
  const [earthMoonView, setEarthMoonView] = useState(false);
  const bodyMetricsRef = useRef<BodyLiveMetrics | null>(null);
  const simulationDiagnosticsRef = useRef<SimulationDiagnostics | null>(null);
  const telemetrySeriesRef = useRef<TelemetrySeriesState | null>(null);
  const [kerrBlackHole, setKerrBlackHole] = useState<KerrBlackHoleUiState>({
    massSolar: 12,
    aOverM: 0.88,
    impactParameterM: DEFAULT_KERR_IMPACT_PARAMETER_M,
    orbitPresetId: DEFAULT_KERR_ORBIT_PRESET_ID,
    showFormulaPanel: true,
    highlightTrackKind: "probe-null",
    frameDragTeachingScale: 1.2e12,
    renderMode: DEFAULT_KERR_GEODESIC_RENDER_MODE,
    studioMode: "overview",
  });
  const [visualEnhance, setVisualEnhance] = useState(false);
  const [viewSettings, setViewSettings] = useState<SimulationViewSettings>(() => ({
    ...DEFAULT_SIMULATION_VIEW_SETTINGS,
    showOrbitTrails: false,
    showOsculatingOrbits: false,
    showRelativisticOptics: false,
  }));
  const detailedSciencePanelOpen = useAtlasRuntimeStore((snapshot) =>
    snapshot.panels.openPanelIds.some((panelId) => ATLAS_DETAILED_SCIENCE_PANEL_IDS.has(panelId)),
  );
  const atlasRuntimeScienceModel = useAtlasRuntimeScienceModel({
    kerrBlackHole,
    diagnosticsRef: simulationDiagnosticsRef,
    mobile: isMobileViewport,
    renderBudget: presentation.renderBudget,
    detailedEvidenceRequested: detailedSciencePanelOpen || viewSettings.showKerrBlackHole,
  });
  const {
    kerrTrackSet,
    kerrStudioSummary,
    relativityObservableAtlasSummary,
    relativityObservableExplainerSummary,
    relativityGuidedTourSummary,
    atlasRelativityVerificationSummary,
    atlasRelativityChartSummary,
    atlasPhysicsBenchmarkGateSummary,
    atlasHorizonsGateAuditSummary,
    atlasPhysicsGateSplitSummary,
    atlasReleaseReadinessSummary,
    atlasScientificGatePreflightSummary,
    atlasHorizonsResidualDecompositionSummary,
    atlasHorizonsCandidateLabSummary,
    atlasPlutoResidualIsolationSummary,
    atlasOuterSystemForceModelPreflightSummary,
    atlasOuterSystemReferenceAdoptionSummary,
    atlasHorizonsCandidateScientificGateSummary,
    atlasStrictHorizonsMigrationDryRunSummary,
    atlasStrictHorizonsShadowMigrationGateSummary,
    atlasDefaultStrictHorizonsMigrationSummary,
    atlasHorizonsProvenanceFreezeSummary,
    atlasOfflineRuntimeBoundaryAuditSummary,
    atlasScientificGateMaintenanceRunbookSummary,
    atlasScientificGateReleaseEvidenceSummary,
    atlasBrowserCiStabilityLockSummary,
    atlasReleaseArtifactManifestLockSummary,
    atlasFinalMaintenanceBaselineSummary,
    atlasArtPolishSummary,
    atlasPostEnhancementMaintenanceBaselineSummary,
    atlasBrowserResourcePerformanceSummary,
    atlasMaintenanceEvidenceIndexSummary,
    atlasPresentationRuntimePerformanceSummary,
    atlasBrowserAcceptanceRuntimeCostSummary,
    atlasFinalGaiaArtEnhancementSummary,
    atlasRcEvidenceClosureSummary,
    atlasInteractionCatalogCompletionSummary,
    atlasInteractionRepairLaunchUxSummary,
    atlasInteractionVisualQualitySummary,
    atlasCriticalUiRelativityVisibilitySummary,
    atlasCameraStellarCloseupSummary,
    atlasLaunchGameplayOpenRocketBridgeSummary,
    atlasScientificModelUpgradeContractSummary,
    atlasGaiaStarfieldEnhancementSummary,
    atlasRelativitySimulationOptimizationSummary,
  } = atlasRuntimeScienceModel;
  const celestialCatalogSummary = useMemo(() => createCelestialCatalogSummary(), []);
  const celestialObjectPassport = useMemo(
    () => {
      const selectedSearchIndex = selectedStellarSearchDocument
        ? stellarDocumentToGaiaIndex(selectedStellarSearchDocument)
        : null;
      const sourceId = selectedCelestialCatalogId.startsWith("gaia-dr3:")
        ? selectedCelestialCatalogId.slice("gaia-dr3:".length)
        : null;
      const effectiveIndexed = gaiaIndexById.get(selectedCelestialCatalogId) ??
        (sourceId ? gaiaIndexBySourceId.get(sourceId) : null) ??
        (selectedSearchIndex?.id === selectedCelestialCatalogId ? selectedSearchIndex : null);
      if (effectiveIndexed) {
        return effectiveIndexed
          ? createCelestialObjectPassport(gaiaIndexedStarToCatalogEntry(effectiveIndexed))
          : null;
      }
      return createCelestialObjectPassport(selectedCelestialCatalogId);
    },
    [gaiaIndexById, gaiaIndexBySourceId, selectedCelestialCatalogId, selectedStellarSearchDocument],
  );
  const celestialCatalogLayerState = useMemo(
    () =>
      [
        `constellations:${viewSettings.showConstellationLines ? "on" : "off"}`,
        `deep-sky:${viewSettings.showDeepSkyObjects ? "on" : "off"}`,
        `labels:${viewSettings.showCatalogLabels ? "on" : "off"}`,
      ].join(";"),
    [
      viewSettings.showConstellationLines,
      viewSettings.showDeepSkyObjects,
      viewSettings.showCatalogLabels,
    ],
  );
  const lagrangeSpawnNonceRef = useRef(0);
  const missionCapsuleImportInputRef = useRef<HTMLInputElement>(null);
  const simulationSession = useAtlasSimulationSession({ physicsRef, simDaysRef });
  const {
    physicsHistoryRef,
    integrationSuspendedRef,
    timeTravelScrubURef,
    timeTravelScrubbingRef,
    importStateInputRef,
    timeTravelScrubUi,
    setTimeTravelScrubUi,
    syncTimeTravelSuspension,
    handleExportSystemState,
    handleImportStateFile,
  } = simulationSession;
  const [searchFocusNonce, setSearchFocusNonce] = useState(0);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(true);
  const { isOpen: atlasToolsOpen, setOpen: setAtlasToolsOpen } = useAtlasPanelSession("atlas-tools");
  const { isOpen: orbitAnalysisOpen, setOpen: setOrbitAnalysisOpen } = useAtlasPanelSession("orbit-analysis");
  const evidencePanel = useAtlasPanelSession("evidence-ledger");
  const evidenceLedgerOpen = evidencePanel.isOpen;
  const setEvidenceLedgerOpen = evidencePanel.setOpen;
  const evidenceInitialClaimId = evidencePanel.payload.entryId ?? "";
  const setEvidenceInitialClaimId = useCallback(
    (entryId: string) => evidencePanel.patch({ entryId }),
    [evidencePanel],
  );
  const { isOpen: atlasNavigatorOpen, setOpen: setAtlasNavigatorOpen } = useAtlasPanelSession("navigator");
  const atlasOfflineStellarSearchCatalogV2Summary = useMemo(
    () => createAtlasOfflineStellarSearchCatalogV2Summary(),
    [],
  );
  const atlasScientificCinematicArtSummary = useMemo(
    () => createAtlasScientificCinematicArtSummary(),
    [],
  );
  const atlasLaunchSceneOpenRocketReplaySummary = useMemo(
    () => createAtlasLaunchSceneOpenRocketReplaySummary(),
    [],
  );
  const atlasVisualIntegrationReleaseSummary = useMemo(
    () => createAtlasVisualIntegrationReleaseSummary(),
    [],
  );
  const workflowPanel = useAtlasPanelSession("workflow");
  const atlasWorkflowOpen = workflowPanel.isOpen;
  const setAtlasWorkflowOpen = workflowPanel.setOpen;
  const atlasWorkflowSelectedId = workflowPanel.payload.workflowId ?? "solar-validation";
  const atlasWorkflowActiveStepId = workflowPanel.payload.stepId ?? "";
  const setAtlasWorkflowSelectedId = useCallback((workflowId: string) => workflowPanel.patch({ workflowId }), [workflowPanel]);
  const setAtlasWorkflowActiveStepId = useCallback((stepId: string) => workflowPanel.patch({ stepId }), [workflowPanel]);
  const { isOpen: atlasMissionHubOpen, setOpen: setAtlasMissionHubOpen } = useAtlasPanelSession("mission-hub");
  const reportPanel = useAtlasPanelSession("scientific-report");
  const atlasScientificReportOpen = reportPanel.isOpen;
  const setAtlasScientificReportOpen = reportPanel.setOpen;
  const validationPanel = useAtlasPanelSession("validation-console");
  const atlasValidationConsoleOpen = validationPanel.isOpen;
  const setAtlasValidationConsoleOpen = validationPanel.setOpen;
  const observatoryPanel = useAtlasPanelSession("observatory-deck");
  const atlasObservatoryDeckOpen = observatoryPanel.isOpen;
  const setAtlasObservatoryDeckOpen = observatoryPanel.setOpen;
  const deferredEvidenceModules = useAtlasDeferredEvidenceModules({
    report: atlasScientificReportOpen || atlasValidationConsoleOpen || atlasObservatoryDeckOpen,
    validation: atlasValidationConsoleOpen || atlasObservatoryDeckOpen,
    observatory: atlasObservatoryDeckOpen,
  });
  const { isOpen: relativityObservableAtlasOpen, setOpen: setRelativityObservableAtlasOpen } = useAtlasPanelSession("relativity-observables");
  const legacyEvidenceDetails = useAtlasLegacyEvidenceDetails(relativityObservableAtlasOpen);
  const { isOpen: observationalAstrophysicsOpen, setOpen: setObservationalAstrophysicsOpen } = useAtlasPanelSession("observational-astrophysics");
  const atlasObservatoryActiveZoneId = (observatoryPanel.payload.zoneId ?? "current-target") as AtlasObservatoryZoneId;
  const setAtlasObservatoryActiveZoneId = useCallback((zoneId: AtlasObservatoryZoneId) => observatoryPanel.patch({ zoneId }), [observatoryPanel]);
  const atlasValidationSelectedDomainId = (validationPanel.payload.domainId ?? "evidence-ledger") as AtlasValidationDomainId;
  const setAtlasValidationSelectedDomainId = useCallback((domainId: AtlasValidationDomainId) => validationPanel.patch({ domainId }), [validationPanel]);
  const [atlasScientificReportExportFormat, setAtlasScientificReportExportFormat] =
    useState<AtlasReportExportFormat>("markdown");
  const atlasReportTemplateId = (reportPanel.payload.templateId ?? "mission-dossier") as AtlasReportTemplateId;
  const setAtlasReportTemplateId = useCallback((templateId: AtlasReportTemplateId) => reportPanel.patch({ templateId }), [reportPanel]);
  const [atlasReportIncludedSectionIds, setAtlasReportIncludedSectionIds] =
    useState<readonly AtlasReportSectionId[] | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const [skyReady, setSkyReady] = useState(false);
  const [coreBodiesReady, setCoreBodiesReady] = useState(false);
  const [atlasReadinessFallback, setAtlasReadinessFallback] = useState(false);
  const [panelSurfaceActivated, setPanelSurfaceActivated] = useState(false);
  const atlasReady = orbitAtlas
    ? canvasReady && (atlasReadinessFallback || (skyReady && coreBodiesReady))
    : canvasReady && skyReady && coreBodiesReady;
  const atlasWorkbenchOpen =
    atlasMissionHubOpen ||
    atlasScientificReportOpen ||
    atlasValidationConsoleOpen ||
    atlasObservatoryDeckOpen ||
    relativityObservableAtlasOpen ||
    observationalAstrophysicsOpen ||
    evidenceLedgerOpen ||
    atlasWorkflowOpen ||
    atlasNavigatorOpen ||
    orbitAnalysisOpen ||
    atlasToolsOpen ||
    !leftPanelCollapsed;
  const managedPanelOpen =
    atlasMissionHubOpen ||
    atlasScientificReportOpen ||
    atlasValidationConsoleOpen ||
    atlasObservatoryDeckOpen ||
    relativityObservableAtlasOpen ||
    observationalAstrophysicsOpen ||
    evidenceLedgerOpen ||
    atlasWorkflowOpen ||
    atlasNavigatorOpen ||
    orbitAnalysisOpen;
  useEffect(() => {
    if (managedPanelOpen) setPanelSurfaceActivated(true);
  }, [managedPanelOpen]);
  const prePerformanceCelestialVisualLayerSummary = useMemo(
    () =>
      createCelestialVisualLayerSummary({
        selectedCatalogId: selectedCelestialCatalogId,
        showConstellations: viewSettings.showConstellationLines,
        showDeepSkyObjects: viewSettings.showDeepSkyObjects,
        showCatalogLabels: viewSettings.showCatalogLabels,
        orbitAtlas,
        mobile: isMobileViewport,
      }),
    [
      isMobileViewport,
      orbitAtlas,
      selectedCelestialCatalogId,
      viewSettings.showCatalogLabels,
      viewSettings.showConstellationLines,
      viewSettings.showDeepSkyObjects,
    ],
  );
  const atlasPerformanceBudgetSummary = useMemo(
    () =>
      createAtlasPerformanceBudgetSummary({
        presentationMode: presentation.presentationMode,
        scaleMode: presentation.scaleMode,
        renderBudget: presentation.renderBudget,
        viewportWidth,
        devicePixelRatio,
        showDeepSkyObjects: viewSettings.showDeepSkyObjects,
        showCatalogLabels: viewSettings.showCatalogLabels,
        catalogLabelCount: prePerformanceCelestialVisualLayerSummary.labelCount,
        showKerrBlackHole: viewSettings.showKerrBlackHole,
        workbenchOpen: atlasWorkbenchOpen,
        canvasReady,
        skyReady,
        coreBodiesReady,
        readinessFallback: atlasReadinessFallback,
        visualEnhance,
      }),
    [
      atlasReadinessFallback,
      atlasWorkbenchOpen,
      canvasReady,
      coreBodiesReady,
      devicePixelRatio,
      prePerformanceCelestialVisualLayerSummary.labelCount,
      presentation.presentationMode,
      presentation.renderBudget,
      presentation.scaleMode,
      skyReady,
      viewSettings.showCatalogLabels,
      viewSettings.showDeepSkyObjects,
      viewSettings.showKerrBlackHole,
      viewportWidth,
      visualEnhance,
    ],
  );
  const celestialVisualLayerSummary = useMemo(
    () =>
      createCelestialVisualLayerSummary({
        selectedCatalogId: selectedCelestialCatalogId,
        showConstellations: viewSettings.showConstellationLines,
        showDeepSkyObjects: viewSettings.showDeepSkyObjects,
        showCatalogLabels: viewSettings.showCatalogLabels,
        orbitAtlas,
        mobile: isMobileViewport,
        labelBudget: atlasPerformanceBudgetSummary.deepSkyLabelBudget,
      }),
    [
      atlasPerformanceBudgetSummary.deepSkyLabelBudget,
      isMobileViewport,
      orbitAtlas,
      selectedCelestialCatalogId,
      viewSettings.showCatalogLabels,
      viewSettings.showConstellationLines,
      viewSettings.showDeepSkyObjects,
    ],
  );
  const atlasRuntimeVisualStaticSummaries = useAtlasRuntimeVisualSummariesV198(
    detailedSciencePanelOpen,
  );
  const atlasRuntimeVisualModel = createAtlasRuntimeVisualModel({
    selectedBodyIndex,
    mobile: isMobileViewport,
    visualEnhance,
    diagnosticsRef: simulationDiagnosticsRef,
    staticSummaries: atlasRuntimeVisualStaticSummaries,
  });
  const {
    atlasBrowserAcceptanceSummary,
    atlasWorkbenchAccessibilitySummary,
    atlasCinematicWorkbenchSummary,
    atlasPlanetaryVisualFidelitySummary,
    atlasCinematicLightingSummary,
    atlasChineseDeepSpaceFidelitySummary,
    atlasCinematicDeepSpaceCameraSummary,
    atlasUniverseSandboxReferenceBackdropSummary,
    atlasReferenceGradeSpaceArtSummary,
    atlasPlanetaryMaterialCompositionSummary,
    atlasCinematicCloseupDirectorSummary,
    atlasCinematicKeyLightDirectorSummary,
    atlasPlanetaryDepthLightingSummary,
    atlasPlanetaryColorGradingSummary,
    atlasNumericalIntegritySummary,
    atlasCinematicPlanetaryArtDirectionSummary,
    atlasCinematicDeepSpaceBackdropSummary,
    atlasSparseDeepSpaceDirectorSummary,
    atlasCloseupPresentationTruthSummary,
    atlasVisualStabilitySummary,
    atlasBackgroundGuardSummary,
    atlasMaterialProfileSummary,
    atlasCloseupVisualFidelitySummary,
    selectedBodyDef,
    selectedBodyVisualId,
    selectedBodyVisualTier,
    selectedBodyAtmosphereProfile,
    selectedBodyCloseupActive,
    selectedBodyLightingProfile,
    atlasSkyCloseupProfile,
    atlasCinematicCameraProfile,
    atlasCinematicSkyCompositionProfile,
    atlasCinematicBackgroundNoiseProfile,
    atlasCinematicTargetSeparationProfile,
    atlasBackgroundDepthProfile,
    atlasBackgroundSubjectVisibilityProfile,
    atlasReferenceGradeCompositeProfile,
    atlasReferenceGradeSkyLayerProfile,
    atlasReferenceGradeStarfieldProfile,
    atlasReferenceGradeSubjectMatteProfile,
    atlasReferenceGradePlanetMaterialProfile,
    atlasSelectedBodyMaterialProfile,
    atlasSelectedBodyAtmosphereDepthProfile,
    atlasSelectedBodyTerminatorProfile,
    atlasSelectedBodyRingProfile,
    atlasCloseupCompositionProfile,
    atlasCloseupPanelAvoidanceProfile,
    atlasCloseupRingShowcaseProfile,
    atlasSelectedBodyKeyLightProfile,
    atlasSelectedBodyDepthLightingProfile,
    atlasSelectedBodyColorGradeProfile,
    atlasSelectedBodyGasGiantArtProfile,
    atlasSelectedBodySaturnRingArtProfile,
    atlasSelectedBodyEarthCloudNightProfile,
    atlasSelectedBodySolarSurfaceProfile,
    atlasGlobalColorGradeProfile,
    atlasBackgroundArtGradeProfile,
    atlasCinematicBackdropStarfieldProfile,
    atlasCinematicBackdropNebulaProfile,
    atlasCinematicBackdropNegativeSpaceProfile,
    atlasSparseDeepSpaceStarfieldProfile,
    atlasSparseDeepSpaceMilkyWayProfile,
    atlasSparseDeepSpaceNebulaProfile,
    atlasSparseDeepSpaceNegativeSpaceProfile,
    atlasBodyPreviewProfile,
    atlasCloseupPreviewSyncStatus,
    atlasCloseupSolarBackdropProfile,
    atlasCloseupPlanetReadabilityProfile,
    atlasCloseupReviewMode,
  } = atlasRuntimeVisualModel;
  const {
    navigatorEvidenceSummary,
    atlasNavigatorSummary,
    atlasWorkflowSummary,
    atlasMissionHubSummary,
    atlasMissionCapsuleRestoreSummary,
    createCurrentMissionCapsule,
    handleCopyMissionCapsuleLink,
    handleExportMissionCapsule,
    handleImportMissionCapsuleFile,
    handleClearMissionCapsuleHash,
    setAtlasMissionHubStoredState,
  } = useAtlasWorkbenchEvidenceMissionDomain({
    simulationDiagnosticsRef, gaiaCatalogSource, atlasReady, atlasPerformanceBudgetSummary,
    presentation, orbitAtlas, selectedBodyIndex, selectedCelestialCatalogId, gaiaIndex,
    viewSettings, kerrBlackHole, evidenceInitialClaimId, atlasWorkflowSelectedId,
    atlasWorkflowActiveStepId, evidenceLedgerOpen, atlasNavigatorOpen, atlasWorkflowOpen,
    atlasMissionHubOpen, atlasScientificReportOpen, atlasValidationConsoleOpen,
    atlasObservatoryDeckOpen, setViewSettings, setKerrBlackHole, setEarthMoonView,
    setSelectedBodyIndex, setSelectedCelestialCatalogId, setCameraBodyFocusRequest,
    setEvidenceInitialClaimId, setEvidenceLedgerOpen, setAtlasWorkflowSelectedId,
    setAtlasWorkflowActiveStepId, setAtlasWorkflowOpen, setAtlasMissionHubOpen,
  });
  const handleCanvasReady = useCallback(() => setCanvasReady(true), []);
  const handleCoreBodiesReady = useCallback(() => setCoreBodiesReady(true), []);

  useEffect(() => {
    if (!orbitAtlas) {
      setAtlasReadinessFallback(false);
      return;
    }
    setAtlasReadinessFallback(false);
    const timeoutId = window.setTimeout(() => setAtlasReadinessFallback(true), 6000);
    return () => window.clearTimeout(timeoutId);
  }, [orbitAtlas, presentation.presentationMode, presentation.scaleMode, presentation.renderBudget]);

  // ── Launch mode state ──
  const launchSelectionActions = useAtlasLaunchSelectionActions({
    setEarthMoonView, setSelectedBodyIndex, setSelectedCelestialCatalogId,
    setSelectedStellarSearchDocument, setSelectedExoplanetSystemId,
    setCameraBodyFocusRequest, setActiveSection, setCameraOriginResetNonce,
  });
  const launchController = useAtlasLaunchController({
    physicsRef,
    selection: launchSelectionActions,
  });
  const {
    launchMode,
    setLaunchMode,
    localLaunchActive,
    localLaunchActiveRef,
    localTelemetryRef,
    launchConfigRef,
    launchState,
    handleLaunchStart,
    handleLaunchAbort,
    handleLocalLaunchHandoff,
  } = launchController;
  const atlasRuntimeQualityTier = selectAtlasRuntimeQualityTier({
    mobile: isMobileViewport,
    launchActive: localLaunchActive,
    closeupActive: selectedBodyCloseupActive || selectedCelestialCatalogId !== "",
  });
  const atlasSceneMode: AtlasSceneMode = selectAtlasSceneMode({
    launchActive: localLaunchActive,
    kerrActive: viewSettings.showKerrBlackHole,
    inspectActive:
      selectedBodyCloseupActive || selectedCelestialCatalogId !== "",
    exoplanetSystemActive: selectedExoplanetSystemId !== "",
  });
  const atlasShellSceneMode = activeSection === "lab" && atlasSceneMode === "atlas"
    ? "scene-lab"
    : atlasSceneMode;
  const launchRuntimeActive = atlasSceneMode === "launch";
  const atlasVisualLaunchPerformanceSummary = useMemo(
    () =>
      createAtlasVisualLaunchPerformanceSummary({
        qualityTier: atlasRuntimeQualityTier,
      }),
    [atlasRuntimeQualityTier],
  );
  const atlasRuntimeSceneFocusSummary = useMemo(
    () => createAtlasRuntimeSceneFocusSummary({ sceneMode: atlasSceneMode }),
    [atlasSceneMode],
  );
  const atlasVisualIntegrationV2Summary = useMemo(() => createAtlasVisualIntegrationV2Summary(), []);
  const atlasScientificPromotionV2Summary = useMemo(
    () =>
      createAtlasScientificPromotionV2Summary({
        catalogDocumentCount: 224_361,
        exoplanetSystemCount: 4_735,
        ktx2AssetCount: 35,
      }),
    [],
  );

  const selectedBody = selectedBodyIndex !== null ? SOLAR_SYSTEM_BODIES[selectedBodyIndex] : null;
  const kerrLab = {
    showKerrBlackHole: viewSettings.showKerrBlackHole,
    spinA: kerrBlackHole.aOverM,
    impactParameterM: kerrBlackHole.impactParameterM,
    orbitPresetId: kerrBlackHole.orbitPresetId,
    renderMode: kerrBlackHole.renderMode,
    studioMode: kerrBlackHole.studioMode ?? "overview",
  };
  const scientificPanels = useAtlasWorkbenchScientificPanels({
    modules: deferredEvidenceModules,
    createMissionCapsule: createCurrentMissionCapsule,
    scienceModel: atlasRuntimeScienceModel,
    visualModel: atlasRuntimeVisualModel,
    context: {
      missionHubSummary: atlasMissionHubSummary,
      navigatorSummary: atlasNavigatorSummary,
      evidenceLedgerSummary: navigatorEvidenceSummary,
      performanceBudgetSummary: atlasPerformanceBudgetSummary,
      selectedObjectPassport: celestialObjectPassport,
      workflowSummary: atlasWorkflowSummary,
      selectedBodyId: selectedBody?.id ?? "",
      selectedBodyLabel: selectedBody?.name ?? "",
      selectedCatalogObjectId: selectedCelestialCatalogId,
      selectedEvidenceClaimId: evidenceInitialClaimId,
      selectedWorkflowId: atlasWorkflowSelectedId,
      activeWorkflowStepId: atlasWorkflowActiveStepId,
      kerrLab,
    },
    studioSettings: {
      templateId: atlasReportTemplateId,
      includedSectionIds: atlasReportIncludedSectionIds ?? undefined,
      exportFormat: atlasScientificReportExportFormat,
    },
    selectedValidationDomainId: atlasValidationSelectedDomainId,
    setSelectedValidationDomainId: setAtlasValidationSelectedDomainId,
    activeObservatoryZoneId: atlasObservatoryActiveZoneId,
    setActiveObservatoryZoneId: setAtlasObservatoryActiveZoneId,
  });
  const {
    atlasScientificReportSummary,
    atlasReportStudioSummary,
    atlasValidationConsoleSummary,
    atlasObservatoryDeckSummary,
  } = scientificPanels;

  const reportActions = useAtlasScientificReportActions({
    reportSummary: atlasScientificReportSummary,
    studioSummary: atlasReportStudioSummary,
    setTemplateId: setAtlasReportTemplateId,
    setIncludedSectionIds: setAtlasReportIncludedSectionIds,
    setExportFormat: setAtlasScientificReportExportFormat,
  });

  const updateMissionHubStoredState = useCallback(
    (updater: (state: AtlasMissionHubStoredState) => AtlasMissionHubStoredState) => {
      setAtlasMissionHubStoredState((state) => updater(state));
    },
    [setAtlasMissionHubStoredState],
  );

  const recordMissionHubNavigatorItem = useCallback(
    (item: AtlasNavigatorItem) => {
      updateMissionHubStoredState((state) =>
        recordAtlasMissionHubRecent(state, navigatorItemToMissionHubStoredItem(item)),
      );
    },
    [updateMissionHubStoredState],
  );

  const prepareKerrScene = useCallback(() => {
    atlasRuntimeStore.resetFocus();
    setEarthMoonView(false);
    setSelectedBodyIndex(null);
    setSelectedCelestialCatalogId("");
    setSelectedStellarSearchDocument(null);
    setSelectedExoplanetSystemId("");
    setCameraBodyFocusRequest(null);
  }, []);

  const navigationActions = useAtlasWorkbenchNavigationActions({
    orbitAtlas,
    workflowSelectedId: atlasWorkflowSelectedId,
    workflowDefaultId: atlasWorkflowSummary.selectedDefaultId,
    setDaysPerSecond,
    setLeftPanelCollapsed,
    setSearchFocusNonce,
    setActiveSection,
    setViewSettings,
    prepareKerrScene,
    setWorkflowSelectedId: setAtlasWorkflowSelectedId,
    recordNavigatorItem: recordMissionHubNavigatorItem,
    setAtlasToolsOpen,
    setNavigatorOpen: setAtlasNavigatorOpen,
    setWorkflowOpen: setAtlasWorkflowOpen,
    setMissionHubOpen: setAtlasMissionHubOpen,
    setObservatoryDeckOpen: setAtlasObservatoryDeckOpen,
    setScientificReportOpen: setAtlasScientificReportOpen,
    setValidationConsoleOpen: setAtlasValidationConsoleOpen,
    setEvidenceLedgerOpen,
    setEvidenceInitialClaimId,
    setRelativityObservableAtlasOpen,
    setObservationalAstrophysicsOpen,
    setOrbitAnalysisOpen,
  });
  const {
    handleSearch,
    atlasFocusNavigation,
  } = navigationActions;
  const closeOrbitAnalysisForFocus = useCallback(
    () => setOrbitAnalysisOpen(false),
    [setOrbitAnalysisOpen],
  );
  const focusController = useAtlasWorkbenchFocusDomain({
    selectedBodyIndex, selectedCelestialCatalogId, selectedStellarSearchDocument,
    selectedExoplanetSystemId, cameraBodyFocusRequest, gaiaIndexBySourceId, orbitAtlas,
    atlasWorkbenchOpen, panelSurfaceActivated, setSelectedBodyIndex,
    setSelectedCelestialCatalogId, setSelectedStellarSearchDocument,
    setSelectedExoplanetSystemId, setCameraBodyFocusRequest, setEarthMoonView,
    closeOrbitAnalysis: closeOrbitAnalysisForFocus, openSearch: handleSearch,
    navigation: atlasFocusNavigation,
  });
  const {
    focusSelected: handleFocus,
    focusEarthMoon: handleEarthMoon,
    executeNavigatorItem: handleAtlasNavigatorExecute,
  } = focusController;

  const toggleRelativity = useCallback(() => setRelativityEnabled((value) => !value), []);
  const workflowActions = useAtlasWorkbenchWorkflowActions({
    navigatorSummary: atlasNavigatorSummary,
    workflowSummary: atlasWorkflowSummary,
    executeNavigatorItem: handleAtlasNavigatorExecute,
    updateMissionHubStoredState,
    setWorkflowSelectedId: setAtlasWorkflowSelectedId,
    setWorkflowActiveStepId: setAtlasWorkflowActiveStepId,
    setWorkflowOpen: setAtlasWorkflowOpen,
    setMissionHubOpen: setAtlasMissionHubOpen,
    setObservatoryDeckOpen: setAtlasObservatoryDeckOpen,
    setValidationConsoleOpen: setAtlasValidationConsoleOpen,
  });

  const legacyRelativityPanelProps = createAtlasLegacyRelativityPanelProps(legacyEvidenceDetails);

  if (!physicsReady) {
    return (
      <div
        className="flex h-[100dvh] w-screen flex-col items-center justify-center gap-2 bg-[#030303] text-slate-300"
        style={{ backgroundColor: "#030303" }}
      >
        <div className="text-sm">Initializing physics engine…</div>
        <div className="max-w-sm px-4 text-center text-xs text-slate-500">
          SharedArrayBuffer fallback is active when cross-origin isolation is unavailable.
        </div>
      </div>
    );
  }

  const rootAttributes = createAtlasRuntimeEvidenceRootAttributesV190({
    ...atlasRuntimeScienceModel,
    ...atlasRuntimeVisualModel,
    selectedBodyIndex, kerrBlackHole, presentation, orbitAtlas,
    atlasReady, canvasReady, skyReady, coreBodiesReady, atlasReadinessFallback,
    gaiaCatalogSource, celestialCatalogSummary, selectedCelestialCatalogId,
    celestialCatalogLayerState, celestialVisualLayerSummary,
    atlasPerformanceBudgetSummary, celestialObjectPassport, atlasNavigatorOpen,
    atlasWorkflowOpen, atlasWorkflowSelectedId, atlasWorkflowActiveStepId,
    atlasMissionHubOpen, atlasMissionHubSummary, atlasMissionCapsuleRestoreSummary,
    atlasScientificReportOpen, atlasScientificReportSummary,
    atlasScientificReportExportFormat, atlasReportStudioSummary,
    atlasValidationConsoleOpen, atlasValidationConsoleSummary,
    atlasValidationSelectedDomainId, atlasVisualLaunchPerformanceSummary,
    atlasRuntimeSceneFocusSummary, atlasSceneMode, atlasVisualIntegrationV2Summary,
    atlasScientificPromotionV2Summary, atlasOfflineStellarSearchCatalogV2Summary,
    atlasScientificCinematicArtSummary, atlasLaunchSceneOpenRocketReplaySummary,
    atlasVisualIntegrationReleaseSummary, localLaunchActive, atlasObservatoryDeckOpen,
    atlasObservatoryDeckSummary, atlasObservatoryActiveZoneId, viewSettings,
  });

  return (
    <AtlasRuntimeWorkbenchSurface
      scope={{
        ...atlasRuntimeScienceModel,
        ...atlasRuntimeVisualModel,
        ...simulationSession,
        ...launchController,
        ...scientificPanels,
        ...reportActions,
        ...navigationActions,
        ...focusController,
        ...workflowActions,
        atlasShellSceneMode, atlasRuntimeQualityTier, selectedExoplanetSystemId,
        selectedCelestialCatalogId, selectedBodyIndex, rootAttributes, atlasSceneMode,
        orbitAtlas, atlasPerformanceBudgetSummary, presentation, handleCanvasReady,
        setSkyReady, handleCoreBodiesReady, launchRuntimeActive, atlasToolsOpen,
        activeSection, searchFocusNonce, handleAtlasNavigatorExecute, handleFocus,
        handleEarthMoon, viewSettings, setViewSettings, visualEnhance, setVisualEnhance,
        leftPanelCollapsed, lagrangeSpawnNonceRef, setEvidenceInitialClaimId,
        setEvidenceLedgerOpen, physicsRef, precisionTierRef, physicsUsesSharedBuffer,
        kerrBlackHole, setKerrBlackHole, telemetrySeriesRef, simulationDiagnosticsRef,
        relativityEnabled, relativityEnabledRef, floatingOriginRef, cameraBodyFocusRequest,
        cameraOriginResetNonce, earthMoonView, selectedStellarSearchDocument,
        panelSurfaceActivated, isMobileViewport, ATLAS_RUNTIME_MODAL_PANEL_IDS,
        evidenceInitialClaimId, gaiaCatalogSource, atlasReady, atlasWorkflowSummary,
        atlasWorkflowSelectedId, atlasWorkflowActiveStepId, setAtlasWorkflowSelectedId,
        setAtlasWorkflowActiveStepId, setAtlasWorkflowOpen, atlasMissionHubSummary,
        handleCopyMissionCapsuleLink, handleExportMissionCapsule,
        missionCapsuleImportInputRef, handleClearMissionCapsuleHash,
        setAtlasMissionHubOpen, deferredEvidenceModules, atlasScientificReportExportFormat,
        setAtlasScientificReportOpen, atlasValidationSelectedDomainId,
        setAtlasValidationSelectedDomainId, setAtlasValidationConsoleOpen,
        atlasObservatoryActiveZoneId, setAtlasObservatoryActiveZoneId,
        setAtlasObservatoryDeckOpen, legacyRelativityPanelProps,
        setRelativityObservableAtlasOpen, setObservationalAstrophysicsOpen,
        navigatorEvidenceSummary, gaiaIndex, setAtlasNavigatorOpen, setOrbitAnalysisOpen,
        simDaysRef, celestialObjectPassport, setSelectedCelestialCatalogId,
        bodyMetricsRef, daysPerSecond, handleImportMissionCapsuleFile,
        isPlaying, setIsPlaying, setActiveSection, orbitAnalysisOpen, atlasWorkflowOpen,
        atlasMissionHubOpen, atlasObservatoryDeckOpen, atlasScientificReportOpen,
        atlasValidationConsoleOpen, evidenceLedgerOpen, toggleRelativity,
      }}
    />
  );
}

"use client";

import {
  useCallback,
  useMemo,
} from "react";

import { SOLAR_SYSTEM_BODIES } from "./data/planetsJ2000";
import type {
  AtlasNavigatorItem,
  AtlasMissionHubStoredState,
} from "./lib/simulationDiagnosticsTypes";
import { useSolarSystemPhysics } from "./lib/useSolarSystem";
import { useSolarPresentation } from "./lib/useSolarPresentation";

import AtlasRuntimeWorkbenchSurface from "./components/AtlasRuntimeWorkbenchSurface";
import { useAtlasLaunchController } from "./lib/useAtlasLaunchController";
import {
  navigatorItemToMissionHubStoredItem,
  recordAtlasMissionHubRecent,
} from "./lib/atlasMissionHub";

import { atlasRuntimeStore, useAtlasRuntimeStore } from "./lib/atlasRuntimeStore";

import { selectAtlasRuntimeQualityTier } from "./lib/launchSequenceDirector";
import { selectAtlasSceneMode, type AtlasSceneMode } from "./lib/atlasRuntimeSceneFocusPerformance";

import { useAtlasRuntimeScienceModel } from "./lib/useAtlasRuntimeScienceModel";
import { useAtlasViewportProfile } from "./lib/useAtlasViewportProfile";
import { createAtlasRuntimeVisualModel } from "./lib/createAtlasRuntimeVisualModel";
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
import { useAtlasWorkbenchCatalogDomain } from "./lib/useAtlasWorkbenchCatalogDomain";
import { useAtlasWorkbenchPanelSessions } from "./lib/useAtlasWorkbenchPanelSessions";
import { useAtlasWorkbenchReadinessDomain } from "./lib/useAtlasWorkbenchReadinessDomain";
import { createAtlasRuntimeDomainGroups } from "./components/atlasRuntimeWorkbenchDomains";
import { useAtlasWorkbenchLocalState } from "./lib/useAtlasWorkbenchLocalState";
import { useAtlasLegacyRootAttributesV256 } from "./lib/useAtlasLegacyRootAttributesV256";
import {
  selectAtlasWorkbenchOpenState,
  useAtlasWorkbenchSceneSummaries,
  useAtlasWorkbenchStaticSummaries,
} from "./lib/useAtlasWorkbenchDerivedSummaries";

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
export default function AtlasRuntimeWorkbench() {
  const presentation = useSolarPresentation();
  const orbitAtlas = presentation.presentationMode === "orbit-atlas";
  const { physicsRef, physicsReady, physicsUsesSharedBuffer } =
    useSolarSystemPhysics();
  const localState = useAtlasWorkbenchLocalState();
  const {
    precisionTierRef, floatingOriginRef, simDaysRef, previousDomainsRef,
    isPlaying, setIsPlaying, daysPerSecond, setDaysPerSecond,
    activeSection, setActiveSection, relativityEnabled, setRelativityEnabled,
    relativityEnabledRef, selectedBodyIndex, setSelectedBodyIndex,
    selectedCelestialCatalogId, setSelectedCelestialCatalogId,
    selectedStellarSearchDocument, setSelectedStellarSearchDocument,
    selectedExoplanetSystemId, setSelectedExoplanetSystemId,
    cameraBodyFocusRequest, setCameraBodyFocusRequest,
    cameraOriginResetNonce, setCameraOriginResetNonce,
    earthMoonView, setEarthMoonView, bodyMetricsRef, simulationDiagnosticsRef,
    telemetrySeriesRef, kerrBlackHole, setKerrBlackHole,
    visualEnhance, setVisualEnhance, viewSettings, setViewSettings,
    lagrangeSpawnNonceRef, missionCapsuleImportInputRef,
    searchFocusNonce, setSearchFocusNonce, leftPanelCollapsed, setLeftPanelCollapsed,
  } = localState;
  const viewportProfile = useAtlasViewportProfile();
  const viewportWidth = viewportProfile.width;
  const devicePixelRatio = viewportProfile.devicePixelRatio;
  const isMobileViewport = viewportProfile.mobile;
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
  const simulationSession = useAtlasSimulationSession({ physicsRef, simDaysRef });
  const panelSessions = useAtlasWorkbenchPanelSessions();
  const {
    atlasToolsOpen, setAtlasToolsOpen, orbitAnalysisOpen, setOrbitAnalysisOpen,
    evidenceLedgerOpen, setEvidenceLedgerOpen, evidenceInitialClaimId,
    setEvidenceInitialClaimId, atlasNavigatorOpen, setAtlasNavigatorOpen,
    atlasWorkflowOpen, setAtlasWorkflowOpen, atlasWorkflowSelectedId,
    atlasWorkflowActiveStepId, setAtlasWorkflowSelectedId, setAtlasWorkflowActiveStepId,
    atlasMissionHubOpen, setAtlasMissionHubOpen, atlasScientificReportOpen,
    setAtlasScientificReportOpen, atlasValidationConsoleOpen, setAtlasValidationConsoleOpen,
    atlasObservatoryDeckOpen, setAtlasObservatoryDeckOpen, relativityObservableAtlasOpen,
    setRelativityObservableAtlasOpen, observationalAstrophysicsOpen,
    setObservationalAstrophysicsOpen, atlasObservatoryActiveZoneId,
    setAtlasObservatoryActiveZoneId, atlasValidationSelectedDomainId,
    setAtlasValidationSelectedDomainId, atlasScientificReportExportFormat,
    setAtlasScientificReportExportFormat, atlasReportTemplateId, setAtlasReportTemplateId,
    atlasReportIncludedSectionIds, setAtlasReportIncludedSectionIds,
    deferredEvidenceModules, legacyEvidenceDetails,
  } = panelSessions;
  const {
    atlasOfflineStellarSearchCatalogV2Summary, atlasScientificCinematicArtSummary,
    atlasLaunchSceneOpenRocketReplaySummary, atlasVisualIntegrationReleaseSummary,
  } = useAtlasWorkbenchStaticSummaries();
  const { atlasWorkbenchOpen, managedPanelOpen } = selectAtlasWorkbenchOpenState({
    leftPanelCollapsed, atlasToolsOpen,
    managedPanels: [
      atlasMissionHubOpen, atlasScientificReportOpen, atlasValidationConsoleOpen,
      atlasObservatoryDeckOpen, relativityObservableAtlasOpen, observationalAstrophysicsOpen,
      evidenceLedgerOpen, atlasWorkflowOpen, atlasNavigatorOpen, orbitAnalysisOpen,
    ],
  });
  const readiness = useAtlasWorkbenchReadinessDomain({
    orbitAtlas,
    presentationMode: presentation.presentationMode,
    scaleMode: presentation.scaleMode,
    renderBudget: presentation.renderBudget,
    managedPanelOpen,
  });
  const {
    atlasReady, canvasReady, skyReady, coreBodiesReady, atlasReadinessFallback,
    panelSurfaceActivated, handleCanvasReady, setSkyReady, handleCoreBodiesReady,
  } = readiness;
  const catalogDomain = useAtlasWorkbenchCatalogDomain({
    selectedCelestialCatalogId,
    selectedStellarSearchDocument,
    viewSettings,
    orbitAtlas,
    mobile: isMobileViewport,
    viewportWidth,
    devicePixelRatio,
    presentationMode: presentation.presentationMode,
    scaleMode: presentation.scaleMode,
    renderBudget: presentation.renderBudget,
    workbenchOpen: atlasWorkbenchOpen,
    canvasReady,
    skyReady,
    coreBodiesReady,
    readinessFallback: atlasReadinessFallback,
    visualEnhance,
  });
  const {
    gaiaCatalogSource, gaiaIndex, gaiaIndexBySourceId, celestialCatalogSummary,
    celestialObjectPassport, celestialCatalogLayerState, celestialVisualLayerSummary,
    atlasPerformanceBudgetSummary,
  } = catalogDomain;
  const atlasRuntimeVisualStaticSummaries = useAtlasRuntimeVisualSummariesV198(
    detailedSciencePanelOpen,
  );
  const atlasRuntimeVisualModel = useMemo(
    () => createAtlasRuntimeVisualModel({
      selectedBodyIndex,
      mobile: isMobileViewport,
      visualEnhance,
      diagnosticsRef: simulationDiagnosticsRef,
      staticSummaries: atlasRuntimeVisualStaticSummaries,
    }),
    [
      atlasRuntimeVisualStaticSummaries,
      isMobileViewport,
      selectedBodyIndex,
      simulationDiagnosticsRef,
      visualEnhance,
    ],
  );
  const { selectedBodyCloseupActive } = atlasRuntimeVisualModel;
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
  const { localLaunchActive } = launchController;
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
  const {
    atlasVisualLaunchPerformanceSummary, atlasRuntimeSceneFocusSummary,
    atlasVisualIntegrationV2Summary, atlasScientificPromotionV2Summary,
  } = useAtlasWorkbenchSceneSummaries(atlasRuntimeQualityTier, atlasSceneMode);

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
  }, [
    setCameraBodyFocusRequest,
    setEarthMoonView,
    setSelectedBodyIndex,
    setSelectedCelestialCatalogId,
    setSelectedExoplanetSystemId,
    setSelectedStellarSearchDocument,
  ]);

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

  const toggleRelativity = useCallback(
    () => setRelativityEnabled((value) => !value),
    [setRelativityEnabled],
  );
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

  const legacyRelativityPanelProps = useMemo(
    () => createAtlasLegacyRelativityPanelProps(legacyEvidenceDetails),
    [legacyEvidenceDetails],
  );

  const rootAttributes = useAtlasLegacyRootAttributesV256({
    ...atlasRuntimeScienceModel, ...atlasRuntimeVisualModel,
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

  const domains = createAtlasRuntimeDomainGroups({
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
  }, previousDomainsRef.current);
  previousDomainsRef.current = domains;

  return <AtlasRuntimeWorkbenchSurface domains={domains} />;
}

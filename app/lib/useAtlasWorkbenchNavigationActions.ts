"use client";

import { useCallback, useMemo, type Dispatch, type SetStateAction } from "react";
import type { BottomControlBarSection } from "../components/BottomControlBar";
import { preloadAtlasSceneModule } from "../components/AtlasSceneLazyModules";
import { dispatchCameraFocusOrigin, dispatchCameraZoom } from "./camera-bridge";
import type { AtlasFocusNavigationActions } from "./useAtlasFocusController";
import { atlasRuntimeStore, type AtlasPanelBooleanSetter } from "./atlasRuntimeStore";
import type { SimulationViewSettings } from "./simulationViewSettings";

type Options = {
  orbitAtlas: boolean;
  workflowSelectedId: string;
  workflowDefaultId: string;
  setDaysPerSecond: Dispatch<SetStateAction<number>>;
  setLeftPanelCollapsed: Dispatch<SetStateAction<boolean>>;
  setSearchFocusNonce: Dispatch<SetStateAction<number>>;
  setActiveSection: Dispatch<SetStateAction<BottomControlBarSection>>;
  setViewSettings: Dispatch<SetStateAction<SimulationViewSettings>>;
  prepareKerrScene: () => void;
  setWorkflowSelectedId: (id: string) => void;
  recordNavigatorItem: AtlasFocusNavigationActions["recordNavigatorItem"];
  setAtlasToolsOpen: AtlasPanelBooleanSetter;
  setNavigatorOpen: AtlasPanelBooleanSetter;
  setWorkflowOpen: AtlasPanelBooleanSetter;
  setMissionHubOpen: AtlasPanelBooleanSetter;
  setObservatoryDeckOpen: AtlasPanelBooleanSetter;
  setScientificReportOpen: AtlasPanelBooleanSetter;
  setValidationConsoleOpen: AtlasPanelBooleanSetter;
  setEvidenceLedgerOpen: AtlasPanelBooleanSetter;
  setEvidenceInitialClaimId: (claimId: string) => void;
  setRelativityObservableAtlasOpen: AtlasPanelBooleanSetter;
  setObservationalAstrophysicsOpen: AtlasPanelBooleanSetter;
  setOrbitAnalysisOpen: AtlasPanelBooleanSetter;
};

export function useAtlasWorkbenchNavigationActions({
  orbitAtlas,
  workflowSelectedId,
  workflowDefaultId,
  setDaysPerSecond,
  setLeftPanelCollapsed,
  setSearchFocusNonce,
  setActiveSection,
  setViewSettings,
  prepareKerrScene,
  setWorkflowSelectedId,
  recordNavigatorItem,
  setAtlasToolsOpen,
  setNavigatorOpen,
  setWorkflowOpen,
  setMissionHubOpen,
  setObservatoryDeckOpen,
  setScientificReportOpen,
  setValidationConsoleOpen,
  setEvidenceLedgerOpen,
  setEvidenceInitialClaimId,
  setRelativityObservableAtlasOpen,
  setObservationalAstrophysicsOpen,
  setOrbitAnalysisOpen,
}: Options) {
  const handleZoomIn = useCallback(() => dispatchCameraZoom(1), []);
  const handleZoomOut = useCallback(() => dispatchCameraZoom(-1), []);
  const handleLeftPanelCollapsedChange = useCallback((collapsed: boolean) => {
    setLeftPanelCollapsed(collapsed);
    if (orbitAtlas && collapsed) setAtlasToolsOpen(false);
  }, [orbitAtlas, setAtlasToolsOpen, setLeftPanelCollapsed]);
  const simSlower = useCallback(() => setDaysPerSecond((days) =>
    Math.max(0.05, Math.round((days / 1.25) * 1000) / 1000)), [setDaysPerSecond]);
  const simFaster = useCallback(() => setDaysPerSecond((days) =>
    Math.min(200, Math.round(days * 1.25 * 1000) / 1000)), [setDaysPerSecond]);
  const simRewind = useCallback(() => setDaysPerSecond((days) =>
    Math.max(0.05, Math.round((days / 1.65) * 1000) / 1000)), [setDaysPerSecond]);
  const simFastForward = useCallback(() => setDaysPerSecond((days) =>
    Math.min(200, Math.round(days * 1.65 * 1000) / 1000)), [setDaysPerSecond]);
  const handleSearch = useCallback(() => setNavigatorOpen(true), [setNavigatorOpen]);
  const openAtlasWorkflows = useCallback(() => {
    setNavigatorOpen(false);
    if (!workflowSelectedId) setWorkflowSelectedId(workflowDefaultId);
    setWorkflowOpen(true);
  }, [setNavigatorOpen, setWorkflowOpen, setWorkflowSelectedId, workflowDefaultId, workflowSelectedId]);
  const openAtlasMissionHub = useCallback(() => {
    setNavigatorOpen(false);
    setMissionHubOpen(true);
  }, [setMissionHubOpen, setNavigatorOpen]);
  const openAtlasObservatoryDeck = useCallback(() => {
    setNavigatorOpen(false);
    setObservatoryDeckOpen(true);
  }, [setNavigatorOpen, setObservatoryDeckOpen]);
  const openAtlasScientificReport = useCallback(() => {
    setNavigatorOpen(false);
    setScientificReportOpen(true);
  }, [setNavigatorOpen, setScientificReportOpen]);
  const openAtlasValidationConsole = useCallback(() => {
    setNavigatorOpen(false);
    setValidationConsoleOpen(true);
  }, [setNavigatorOpen, setValidationConsoleOpen]);
  const openKerrLab = useCallback(() => {
    prepareKerrScene();
    dispatchCameraFocusOrigin();
    atlasRuntimeStore.setExperienceMode("research");
    void preloadAtlasSceneModule("kerr");
    setViewSettings((settings) => ({ ...settings, showKerrBlackHole: true }));
  }, [prepareKerrScene, setViewSettings]);

  const atlasFocusNavigation = useMemo<AtlasFocusNavigationActions>(() => ({
    closeNavigator: () => setNavigatorOpen(false),
    recordNavigatorItem,
    openEvidenceClaim: (claimId) => {
      setEvidenceInitialClaimId(claimId);
      setEvidenceLedgerOpen(true);
    },
    openMissionHub: () => setMissionHubOpen(true),
    openObservatoryDeck: () => setObservatoryDeckOpen(true),
    openScientificReport: () => setScientificReportOpen(true),
    openValidationConsole: () => setValidationConsoleOpen(true),
    openRelativityObservables: () => setRelativityObservableAtlasOpen(true),
    openObservationalAstrophysics: () => setObservationalAstrophysicsOpen(true),
    openWorkflow: openAtlasWorkflows,
    openKerrLab,
    openOrbitAnalysis: () => setOrbitAnalysisOpen(true),
    openObjectBrowser: () => {
      setAtlasToolsOpen(true);
      setLeftPanelCollapsed(false);
      setSearchFocusNonce((nonce) => nonce + 1);
    },
    openViewPanel: () => {
      setAtlasToolsOpen(true);
      setLeftPanelCollapsed(false);
      setActiveSection("view");
    },
    openToolsPanel: () => {
      setAtlasToolsOpen(true);
      setLeftPanelCollapsed(false);
      setActiveSection("tools");
    },
  }), [
    openAtlasWorkflows,
    openKerrLab,
    recordNavigatorItem,
    setActiveSection,
    setAtlasToolsOpen,
    setEvidenceInitialClaimId,
    setEvidenceLedgerOpen,
    setLeftPanelCollapsed,
    setMissionHubOpen,
    setNavigatorOpen,
    setObservationalAstrophysicsOpen,
    setObservatoryDeckOpen,
    setOrbitAnalysisOpen,
    setRelativityObservableAtlasOpen,
    setScientificReportOpen,
    setSearchFocusNonce,
    setValidationConsoleOpen,
  ]);

  return {
    handleZoomIn,
    handleZoomOut,
    handleLeftPanelCollapsedChange,
    simSlower,
    simFaster,
    simRewind,
    simFastForward,
    handleSearch,
    openAtlasWorkflows,
    openAtlasMissionHub,
    openAtlasObservatoryDeck,
    openAtlasScientificReport,
    openAtlasValidationConsole,
    openKerrLab,
    atlasFocusNavigation,
  };
}

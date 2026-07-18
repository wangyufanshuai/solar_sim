"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import type { KerrBlackHoleUiState } from "../components/KerrBlackHolePanel";
import type { CameraBodyFocusRequest } from "../components/UniverseScene";
import type { GaiaCatalogSource } from "../data/gaiaStarCatalog";
import { SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import { dispatchCameraFocusDirection } from "./camera-bridge";
import {
  createAtlasMissionHubSummary,
} from "./atlasMissionHub";
import {
  ORBIT_ATLAS_ORBIT_RENDERER,
  ORBIT_ATLAS_VISUAL_PROFILE,
  type OrbitAtlasRenderBudget,
  type OrbitAtlasScaleMode,
  type SolarPresentationMode,
} from "./orbitAtlasPresentation";
import {
  celestialEntryToDirection,
  selectCelestialCatalogEntry,
} from "./celestialCatalog";
import type { GaiaIndexedStar } from "./gaiaCatalogIndex";
import type {
  AtlasMissionCapsule,
  AtlasMissionHubStoredState,
  AtlasMissionHubSummary,
  AtlasNavigatorSummary,
  AtlasPerformanceBudgetSummary,
  AtlasWorkflowSummary,
  EvidenceLedgerSummary,
  SimulationDiagnostics,
} from "./simulationDiagnosticsTypes";
import type { SimulationViewSettings } from "./simulationViewSettings";
import type { useSolarPresentation } from "./useSolarPresentation";
import {
  useAtlasMissionSession,
  type AtlasMissionSessionResult,
} from "./useAtlasMissionSession";
import { useAtlasRuntimeJourneySummariesV198 } from "./useAtlasRuntimeJourneySummariesV198";

const COMPACT_EVIDENCE_SUMMARY: EvidenceLedgerSummary = {
  version: "v21-claim-passports",
  status: "informational",
  claimCount: 0,
  readyCount: 0,
  failedCount: 0,
  groups: [],
  claims: [],
};

type PresentationController = ReturnType<typeof useSolarPresentation>;

function isPresentationMode(value: string): value is SolarPresentationMode {
  return value === "sandbox" || value === "orbit-atlas";
}

function isScaleMode(value: string): value is OrbitAtlasScaleMode {
  return value === "compressed" || value === "physical";
}

function isRenderBudget(value: string): value is OrbitAtlasRenderBudget {
  return value === "balanced" || value === "dense";
}

export type AtlasWorkbenchEvidenceMissionDomainOptions = {
  simulationDiagnosticsRef: MutableRefObject<SimulationDiagnostics | null>;
  gaiaCatalogSource: GaiaCatalogSource;
  atlasReady: boolean;
  atlasPerformanceBudgetSummary: AtlasPerformanceBudgetSummary;
  presentation: PresentationController;
  orbitAtlas: boolean;
  selectedBodyIndex: number | null;
  selectedCelestialCatalogId: string;
  gaiaIndex: readonly GaiaIndexedStar[];
  viewSettings: SimulationViewSettings;
  kerrBlackHole: KerrBlackHoleUiState;
  evidenceInitialClaimId: string;
  atlasWorkflowSelectedId: string;
  atlasWorkflowActiveStepId: string;
  evidenceLedgerOpen: boolean;
  atlasNavigatorOpen: boolean;
  atlasWorkflowOpen: boolean;
  atlasMissionHubOpen: boolean;
  atlasScientificReportOpen: boolean;
  atlasValidationConsoleOpen: boolean;
  atlasObservatoryDeckOpen: boolean;
  setViewSettings: Dispatch<SetStateAction<SimulationViewSettings>>;
  setKerrBlackHole: Dispatch<SetStateAction<KerrBlackHoleUiState>>;
  setEarthMoonView: Dispatch<SetStateAction<boolean>>;
  setSelectedBodyIndex: Dispatch<SetStateAction<number | null>>;
  setSelectedCelestialCatalogId: Dispatch<SetStateAction<string>>;
  setCameraBodyFocusRequest: Dispatch<SetStateAction<CameraBodyFocusRequest | null>>;
  setEvidenceInitialClaimId: (entryId: string) => void;
  setEvidenceLedgerOpen: (open: boolean) => void;
  setAtlasWorkflowSelectedId: (workflowId: string) => void;
  setAtlasWorkflowActiveStepId: (stepId: string) => void;
  setAtlasWorkflowOpen: (open: boolean) => void;
  setAtlasMissionHubOpen: (open: boolean) => void;
};

export type AtlasWorkbenchEvidenceMissionDomain = {
  navigatorEvidenceSummary: EvidenceLedgerSummary;
  atlasNavigatorSummary: AtlasNavigatorSummary;
  atlasWorkflowSummary: AtlasWorkflowSummary;
  atlasMissionHubSummary: AtlasMissionHubSummary;
  atlasMissionCapsuleRestoreSummary: AtlasMissionSessionResult["restoreSummary"];
  createCurrentMissionCapsule: AtlasMissionSessionResult["createCurrentCapsule"];
  handleCopyMissionCapsuleLink: AtlasMissionSessionResult["copyCapsuleLink"];
  handleExportMissionCapsule: AtlasMissionSessionResult["exportCapsule"];
  handleImportMissionCapsuleFile: AtlasMissionSessionResult["importCapsuleFile"];
  handleClearMissionCapsuleHash: AtlasMissionSessionResult["clearCapsuleHash"];
  setAtlasMissionHubStoredState: AtlasMissionSessionResult["setStoredState"];
};

export function useAtlasWorkbenchEvidenceMissionDomain({
  simulationDiagnosticsRef,
  gaiaCatalogSource,
  atlasReady,
  atlasPerformanceBudgetSummary,
  presentation,
  orbitAtlas,
  selectedBodyIndex,
  selectedCelestialCatalogId,
  gaiaIndex,
  viewSettings,
  kerrBlackHole,
  evidenceInitialClaimId,
  atlasWorkflowSelectedId,
  atlasWorkflowActiveStepId,
  evidenceLedgerOpen,
  atlasNavigatorOpen,
  atlasWorkflowOpen,
  atlasMissionHubOpen,
  atlasScientificReportOpen,
  atlasValidationConsoleOpen,
  atlasObservatoryDeckOpen,
  setViewSettings,
  setKerrBlackHole,
  setEarthMoonView,
  setSelectedBodyIndex,
  setSelectedCelestialCatalogId,
  setCameraBodyFocusRequest,
  setEvidenceInitialClaimId,
  setEvidenceLedgerOpen,
  setAtlasWorkflowSelectedId,
  setAtlasWorkflowActiveStepId,
  setAtlasWorkflowOpen,
  setAtlasMissionHubOpen,
}: AtlasWorkbenchEvidenceMissionDomainOptions): AtlasWorkbenchEvidenceMissionDomain {
  const [navigatorEvidenceSummary, setNavigatorEvidenceSummary] = useState<EvidenceLedgerSummary>(
    COMPACT_EVIDENCE_SUMMARY,
  );
  const [evidenceDetailsLoaded, setEvidenceDetailsLoaded] = useState(false);
  const loadDetailedEvidence = useCallback(async () => {
    const { createEvidenceLedgerSummary } = await import("./evidenceLedger");
    setNavigatorEvidenceSummary(createEvidenceLedgerSummary({
      diagnostics: simulationDiagnosticsRef.current,
      orbitAtlasProfile: ORBIT_ATLAS_VISUAL_PROFILE,
      orbitAtlasRenderer: ORBIT_ATLAS_ORBIT_RENDERER,
      gaiaCatalogSource,
      orbitAtlasReady: atlasReady,
      presentationMode: presentation.presentationMode,
      performanceBudgetSummary: atlasPerformanceBudgetSummary,
    }));
    setEvidenceDetailsLoaded(true);
  }, [
    atlasPerformanceBudgetSummary,
    atlasReady,
    gaiaCatalogSource,
    presentation.presentationMode,
    simulationDiagnosticsRef,
  ]);

  useEffect(() => {
    const requested = evidenceLedgerOpen || atlasNavigatorOpen || atlasScientificReportOpen ||
      atlasValidationConsoleOpen || atlasObservatoryDeckOpen;
    if (!evidenceDetailsLoaded && requested) void loadDetailedEvidence();
  }, [
    atlasNavigatorOpen,
    atlasObservatoryDeckOpen,
    atlasScientificReportOpen,
    atlasValidationConsoleOpen,
    evidenceDetailsLoaded,
    evidenceLedgerOpen,
    loadDetailedEvidence,
  ]);

  const { atlasNavigatorSummary, atlasWorkflowSummary } = useAtlasRuntimeJourneySummariesV198({
    requested: atlasNavigatorOpen || atlasWorkflowOpen || atlasMissionHubOpen ||
      atlasScientificReportOpen || atlasValidationConsoleOpen || atlasObservatoryDeckOpen,
    evidenceLedgerSummary: navigatorEvidenceSummary,
    orbitAnalysisAvailable: orbitAtlas && selectedBodyIndex !== null && selectedBodyIndex > 0,
    gaiaIndex,
  });

  const applyMissionCapsuleState = useCallback((
    capsule: AtlasMissionCapsule,
    restoreStoredState: (state: AtlasMissionHubStoredState) => void,
  ) => {
    if (isPresentationMode(capsule.presentation.mode)) {
      presentation.setPresentationMode(capsule.presentation.mode);
    }
    if (isScaleMode(capsule.presentation.scaleMode)) {
      presentation.setScaleMode(capsule.presentation.scaleMode);
    }
    if (isRenderBudget(capsule.presentation.renderBudget)) {
      presentation.setRenderBudget(capsule.presentation.renderBudget);
    }
    setViewSettings((settings) => ({
      ...settings,
      ...capsule.viewSettings,
      showKerrBlackHole: capsule.kerrLab.showKerrBlackHole,
    }));
    setKerrBlackHole((state) => ({
      ...state,
      aOverM: capsule.kerrLab.spinA,
      impactParameterM: capsule.kerrLab.impactParameterM,
      orbitPresetId: capsule.kerrLab.orbitPresetId,
      renderMode: capsule.kerrLab.renderMode,
      studioMode: capsule.kerrLab.studioMode ?? "overview",
    }));
    restoreStoredState(capsule.missionHub);

    const bodyIndex = capsule.selected.bodyId
      ? SOLAR_SYSTEM_BODIES.findIndex((body) => body.id === capsule.selected.bodyId)
      : -1;
    if (bodyIndex >= 0) {
      setEarthMoonView(false);
      setSelectedCelestialCatalogId("");
      setSelectedBodyIndex(bodyIndex);
      setCameraBodyFocusRequest((previous) => ({
        bodyIndex,
        mode: "inspect",
        nonce: (previous?.nonce ?? 0) + 1,
      }));
    }
    if (capsule.selected.catalogObjectId) {
      const entry = selectCelestialCatalogEntry(capsule.selected.catalogObjectId);
      const direction = entry ? celestialEntryToDirection(entry) : null;
      if (entry && direction) {
        setEarthMoonView(false);
        setSelectedBodyIndex(null);
        setSelectedCelestialCatalogId(entry.id);
        dispatchCameraFocusDirection(direction);
      }
    }
    if (capsule.selected.evidenceClaimId) {
      setEvidenceInitialClaimId(capsule.selected.evidenceClaimId);
      setEvidenceLedgerOpen(true);
    }
    if (capsule.selected.workflowId) {
      setAtlasWorkflowSelectedId(capsule.selected.workflowId);
      setAtlasWorkflowOpen(true);
    }
    if (capsule.selected.workflowStepId) {
      setAtlasWorkflowActiveStepId(capsule.selected.workflowStepId);
    }
  }, [
    presentation,
    setAtlasWorkflowActiveStepId,
    setAtlasWorkflowOpen,
    setAtlasWorkflowSelectedId,
    setCameraBodyFocusRequest,
    setEarthMoonView,
    setEvidenceInitialClaimId,
    setEvidenceLedgerOpen,
    setKerrBlackHole,
    setSelectedBodyIndex,
    setSelectedCelestialCatalogId,
    setViewSettings,
  ]);

  const createMissionCapsuleArgs = useCallback(
    (storedState: AtlasMissionHubStoredState) => ({
      presentationMode: presentation.presentationMode,
      scaleMode: presentation.scaleMode,
      renderBudget: presentation.renderBudget,
      viewSettings,
      selectedBodyId: selectedBodyIndex === null ? "" : SOLAR_SYSTEM_BODIES[selectedBodyIndex]?.id ?? "",
      selectedCatalogObjectId: selectedCelestialCatalogId,
      selectedEvidenceClaimId: evidenceInitialClaimId,
      selectedWorkflowId: atlasWorkflowSelectedId,
      activeWorkflowStepId: atlasWorkflowActiveStepId,
      missionHubStoredState: storedState,
      kerrLab: {
        showKerrBlackHole: viewSettings.showKerrBlackHole,
        spinA: kerrBlackHole.aOverM,
        impactParameterM: kerrBlackHole.impactParameterM,
        orbitPresetId: kerrBlackHole.orbitPresetId,
        renderMode: kerrBlackHole.renderMode,
        studioMode: kerrBlackHole.studioMode ?? "overview",
      },
    }),
    [
      atlasWorkflowActiveStepId,
      atlasWorkflowSelectedId,
      evidenceInitialClaimId,
      kerrBlackHole,
      presentation.presentationMode,
      presentation.renderBudget,
      presentation.scaleMode,
      selectedBodyIndex,
      selectedCelestialCatalogId,
      viewSettings,
    ],
  );

  const missionSession = useAtlasMissionSession({
    navigatorSummary: atlasNavigatorSummary,
    workflowSummary: atlasWorkflowSummary,
    createCapsuleArgs: createMissionCapsuleArgs,
    applyCapsule: applyMissionCapsuleState,
    openMissionHub: useCallback(() => setAtlasMissionHubOpen(true), [setAtlasMissionHubOpen]),
  });
  const atlasMissionHubSummary = useMemo(() => createAtlasMissionHubSummary({
    navigatorSummary: atlasNavigatorSummary,
    workflowSummary: atlasWorkflowSummary,
    storedState: missionSession.storedState,
    capsuleRestoreSummary: missionSession.restoreSummary,
    selectedBodyId: selectedBodyIndex === null ? "" : SOLAR_SYSTEM_BODIES[selectedBodyIndex]?.id ?? "",
    selectedCatalogObjectId: selectedCelestialCatalogId,
    selectedEvidenceClaimId: evidenceLedgerOpen ? evidenceInitialClaimId : "",
    selectedWorkflowId: atlasWorkflowOpen ? atlasWorkflowSelectedId : "",
    activeWorkflowStepId: atlasWorkflowOpen ? atlasWorkflowActiveStepId : "",
  }), [
    atlasNavigatorSummary,
    atlasWorkflowActiveStepId,
    atlasWorkflowOpen,
    atlasWorkflowSelectedId,
    atlasWorkflowSummary,
    evidenceInitialClaimId,
    evidenceLedgerOpen,
    missionSession.restoreSummary,
    missionSession.storedState,
    selectedBodyIndex,
    selectedCelestialCatalogId,
  ]);

  return {
    navigatorEvidenceSummary,
    atlasNavigatorSummary,
    atlasWorkflowSummary,
    atlasMissionHubSummary,
    atlasMissionCapsuleRestoreSummary: missionSession.restoreSummary,
    createCurrentMissionCapsule: missionSession.createCurrentCapsule,
    handleCopyMissionCapsuleLink: missionSession.copyCapsuleLink,
    handleExportMissionCapsule: missionSession.exportCapsule,
    handleImportMissionCapsuleFile: missionSession.importCapsuleFile,
    handleClearMissionCapsuleHash: missionSession.clearCapsuleHash,
    setAtlasMissionHubStoredState: missionSession.setStoredState,
  };
}

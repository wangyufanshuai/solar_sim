"use client";

import type { createAtlasRuntimeVisualModel } from "./createAtlasRuntimeVisualModel";
import type { useAtlasRuntimeScienceModel } from "./useAtlasRuntimeScienceModel";
import { useAtlasScientificPanelSummaries } from "./useAtlasScientificPanelSummaries";

type PanelOptions = Parameters<typeof useAtlasScientificPanelSummaries>[0];
type ReportArgs = PanelOptions["reportArgs"];
type ValidationArgs = PanelOptions["validationArgs"];
type ObservatoryArgs = PanelOptions["observatoryArgs"];

type WorkbenchScientificContext = {
  missionHubSummary: ReportArgs["missionHubSummary"];
  navigatorSummary: ValidationArgs["navigatorSummary"];
  workflowSummary: ReportArgs["workflowSummary"];
  evidenceLedgerSummary: ReportArgs["evidenceLedgerSummary"];
  performanceBudgetSummary: ObservatoryArgs["performanceBudgetSummary"];
  selectedObjectPassport: ReportArgs["selectedObjectPassport"];
  selectedBodyId: string;
  selectedBodyLabel: string;
  selectedCatalogObjectId: string;
  selectedEvidenceClaimId: string;
  selectedWorkflowId: string;
  activeWorkflowStepId: string;
  kerrLab: ReportArgs["kerrLab"];
};

export type AtlasWorkbenchScientificPanelsOptions = Pick<
  PanelOptions,
  | "modules"
  | "createMissionCapsule"
  | "studioSettings"
  | "selectedValidationDomainId"
  | "setSelectedValidationDomainId"
  | "activeObservatoryZoneId"
  | "setActiveObservatoryZoneId"
> & {
  scienceModel: ReturnType<typeof useAtlasRuntimeScienceModel>;
  visualModel: ReturnType<typeof createAtlasRuntimeVisualModel>;
  context: WorkbenchScientificContext;
};

/** Composes the report/validation/observatory view-models at their deferred boundary. */
export function useAtlasWorkbenchScientificPanels({
  modules,
  createMissionCapsule,
  scienceModel,
  visualModel,
  context,
  studioSettings,
  selectedValidationDomainId,
  setSelectedValidationDomainId,
  activeObservatoryZoneId,
  setActiveObservatoryZoneId,
}: AtlasWorkbenchScientificPanelsOptions) {
  const relativityEvidence = {
    relativityObservableAtlasSummary: scienceModel.relativityObservableAtlasSummary,
    relativityObservableExplainerSummary: scienceModel.relativityObservableExplainerSummary,
    relativityGuidedTourSummary: scienceModel.relativityGuidedTourSummary,
  };
  const visualEvidence = {
    planetaryVisualFidelitySummary: visualModel.atlasPlanetaryVisualFidelitySummary,
    cinematicLightingSummary: visualModel.atlasCinematicLightingSummary,
    chineseDeepSpaceFidelitySummary: visualModel.atlasChineseDeepSpaceFidelitySummary,
    cinematicDeepSpaceCameraSummary: visualModel.atlasCinematicDeepSpaceCameraSummary,
    universeSandboxReferenceBackdropSummary: visualModel.atlasUniverseSandboxReferenceBackdropSummary,
    referenceGradeSpaceArtSummary: visualModel.atlasReferenceGradeSpaceArtSummary,
    planetaryMaterialCompositionSummary: visualModel.atlasPlanetaryMaterialCompositionSummary,
    cinematicCloseupDirectorSummary: visualModel.atlasCinematicCloseupDirectorSummary,
    cinematicKeyLightDirectorSummary: visualModel.atlasCinematicKeyLightDirectorSummary,
    planetaryDepthLightingSummary: visualModel.atlasPlanetaryDepthLightingSummary,
    planetaryColorGradingSummary: visualModel.atlasPlanetaryColorGradingSummary,
    numericalIntegritySummary: visualModel.atlasNumericalIntegritySummary,
    cinematicPlanetaryArtDirectionSummary: visualModel.atlasCinematicPlanetaryArtDirectionSummary,
    cinematicDeepSpaceBackdropSummary: visualModel.atlasCinematicDeepSpaceBackdropSummary,
    sparseDeepSpaceDirectorSummary: visualModel.atlasSparseDeepSpaceDirectorSummary,
    closeupPresentationTruthSummary: visualModel.atlasCloseupPresentationTruthSummary,
  };

  return useAtlasScientificPanelSummaries({
    modules,
    createMissionCapsule,
    reportArgs: {
      missionHubSummary: context.missionHubSummary,
      evidenceLedgerSummary: context.evidenceLedgerSummary,
      selectedObjectPassport: context.selectedObjectPassport,
      workflowSummary: context.workflowSummary,
      selectedBodyId: context.selectedBodyId,
      selectedBodyLabel: context.selectedBodyLabel,
      selectedEvidenceClaimId: context.selectedEvidenceClaimId,
      selectedWorkflowId: context.selectedWorkflowId,
      activeWorkflowStepId: context.activeWorkflowStepId,
      kerrLab: context.kerrLab,
      ...relativityEvidence,
      ...visualEvidence,
      closeupVisualFidelitySummary: visualModel.atlasCloseupVisualFidelitySummary,
    },
    studioSettings,
    validationArgs: {
      evidenceLedgerSummary: context.evidenceLedgerSummary,
      missionHubSummary: context.missionHubSummary,
      navigatorSummary: context.navigatorSummary,
      workflowSummary: context.workflowSummary,
      selectedBodyId: context.selectedBodyId,
      selectedCatalogObjectId: context.selectedCatalogObjectId,
      selectedEvidenceClaimId: context.selectedEvidenceClaimId,
      selectedWorkflowId: context.selectedWorkflowId,
      activeWorkflowStepId: context.activeWorkflowStepId,
    },
    observatoryArgs: {
      missionHubSummary: context.missionHubSummary,
      navigatorSummary: context.navigatorSummary,
      workflowSummary: context.workflowSummary,
      evidenceLedgerSummary: context.evidenceLedgerSummary,
      performanceBudgetSummary: context.performanceBudgetSummary,
      ...relativityEvidence,
      ...visualEvidence,
      selectedBodyId: context.selectedBodyId,
      selectedCatalogObjectId: context.selectedCatalogObjectId,
      selectedEvidenceClaimId: context.selectedEvidenceClaimId,
      selectedWorkflowId: context.selectedWorkflowId,
      activeWorkflowStepId: context.activeWorkflowStepId,
      kerrLab: context.kerrLab,
    },
    selectedValidationDomainId,
    setSelectedValidationDomainId,
    activeObservatoryZoneId,
    setActiveObservatoryZoneId,
  });
}

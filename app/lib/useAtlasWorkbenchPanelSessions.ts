"use client";

import { useCallback, useState } from "react";

import type {
  AtlasObservatoryZoneId,
  AtlasReportExportFormat,
  AtlasReportSectionId,
  AtlasReportTemplateId,
  AtlasValidationDomainId,
} from "./simulationDiagnosticsTypes";
import { useAtlasDeferredEvidenceModules, useAtlasLegacyEvidenceDetails } from "./useAtlasDeferredEvidenceModules";
import { useAtlasPanelSession } from "./atlasRuntimeStore";

export function useAtlasWorkbenchPanelSessions() {
  const { isOpen: atlasToolsOpen, setOpen: setAtlasToolsOpen } = useAtlasPanelSession("atlas-tools");
  const { isOpen: orbitAnalysisOpen, setOpen: setOrbitAnalysisOpen } = useAtlasPanelSession("orbit-analysis");
  const evidencePanel = useAtlasPanelSession("evidence-ledger");
  const { isOpen: atlasNavigatorOpen, setOpen: setAtlasNavigatorOpen } = useAtlasPanelSession("navigator");
  const workflowPanel = useAtlasPanelSession("workflow");
  const { isOpen: atlasMissionHubOpen, setOpen: setAtlasMissionHubOpen } = useAtlasPanelSession("mission-hub");
  const reportPanel = useAtlasPanelSession("scientific-report");
  const validationPanel = useAtlasPanelSession("validation-console");
  const observatoryPanel = useAtlasPanelSession("observatory-deck");
  const { isOpen: relativityObservableAtlasOpen, setOpen: setRelativityObservableAtlasOpen } = useAtlasPanelSession("relativity-observables");
  const { isOpen: observationalAstrophysicsOpen, setOpen: setObservationalAstrophysicsOpen } = useAtlasPanelSession("observational-astrophysics");

  const setEvidenceInitialClaimId = useCallback(
    (entryId: string) => evidencePanel.patch({ entryId }),
    [evidencePanel],
  );
  const setAtlasWorkflowSelectedId = useCallback(
    (workflowId: string) => workflowPanel.patch({ workflowId }),
    [workflowPanel],
  );
  const setAtlasWorkflowActiveStepId = useCallback(
    (stepId: string) => workflowPanel.patch({ stepId }),
    [workflowPanel],
  );
  const setAtlasObservatoryActiveZoneId = useCallback(
    (zoneId: AtlasObservatoryZoneId) => observatoryPanel.patch({ zoneId }),
    [observatoryPanel],
  );
  const setAtlasValidationSelectedDomainId = useCallback(
    (domainId: AtlasValidationDomainId) => validationPanel.patch({ domainId }),
    [validationPanel],
  );
  const setAtlasReportTemplateId = useCallback(
    (templateId: AtlasReportTemplateId) => reportPanel.patch({ templateId }),
    [reportPanel],
  );

  const [atlasScientificReportExportFormat, setAtlasScientificReportExportFormat] =
    useState<AtlasReportExportFormat>("markdown");
  const [atlasReportIncludedSectionIds, setAtlasReportIncludedSectionIds] =
    useState<readonly AtlasReportSectionId[] | null>(null);

  const deferredEvidenceModules = useAtlasDeferredEvidenceModules({
    report: reportPanel.isOpen || validationPanel.isOpen || observatoryPanel.isOpen,
    validation: validationPanel.isOpen || observatoryPanel.isOpen,
    observatory: observatoryPanel.isOpen,
  });
  const legacyEvidenceDetails = useAtlasLegacyEvidenceDetails(relativityObservableAtlasOpen);

  return {
    atlasToolsOpen,
    setAtlasToolsOpen,
    orbitAnalysisOpen,
    setOrbitAnalysisOpen,
    evidenceLedgerOpen: evidencePanel.isOpen,
    setEvidenceLedgerOpen: evidencePanel.setOpen,
    evidenceInitialClaimId: evidencePanel.payload.entryId ?? "",
    setEvidenceInitialClaimId,
    atlasNavigatorOpen,
    setAtlasNavigatorOpen,
    atlasWorkflowOpen: workflowPanel.isOpen,
    setAtlasWorkflowOpen: workflowPanel.setOpen,
    atlasWorkflowSelectedId: workflowPanel.payload.workflowId ?? "solar-validation",
    atlasWorkflowActiveStepId: workflowPanel.payload.stepId ?? "",
    setAtlasWorkflowSelectedId,
    setAtlasWorkflowActiveStepId,
    atlasMissionHubOpen,
    setAtlasMissionHubOpen,
    atlasScientificReportOpen: reportPanel.isOpen,
    setAtlasScientificReportOpen: reportPanel.setOpen,
    atlasValidationConsoleOpen: validationPanel.isOpen,
    setAtlasValidationConsoleOpen: validationPanel.setOpen,
    atlasObservatoryDeckOpen: observatoryPanel.isOpen,
    setAtlasObservatoryDeckOpen: observatoryPanel.setOpen,
    relativityObservableAtlasOpen,
    setRelativityObservableAtlasOpen,
    observationalAstrophysicsOpen,
    setObservationalAstrophysicsOpen,
    atlasObservatoryActiveZoneId: (observatoryPanel.payload.zoneId ?? "current-target") as AtlasObservatoryZoneId,
    setAtlasObservatoryActiveZoneId,
    atlasValidationSelectedDomainId: (validationPanel.payload.domainId ?? "evidence-ledger") as AtlasValidationDomainId,
    setAtlasValidationSelectedDomainId,
    atlasScientificReportExportFormat,
    setAtlasScientificReportExportFormat,
    atlasReportTemplateId: (reportPanel.payload.templateId ?? "mission-dossier") as AtlasReportTemplateId,
    setAtlasReportTemplateId,
    atlasReportIncludedSectionIds,
    setAtlasReportIncludedSectionIds,
    deferredEvidenceModules,
    legacyEvidenceDetails,
  };
}

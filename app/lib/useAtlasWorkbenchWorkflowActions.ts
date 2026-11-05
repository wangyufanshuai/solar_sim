"use client";

import { useCallback } from "react";
import {
  recordAtlasMissionHubRecent,
  toggleAtlasMissionHubPinned,
  workflowStepToMissionHubStoredItem,
} from "./atlasMissionHub";
import type { AtlasPanelBooleanSetter } from "./atlasRuntimeStore";
import type {
  AtlasMissionHubItem,
  AtlasMissionHubStoredState,
  AtlasNavigatorItem,
  AtlasNavigatorSummary,
  AtlasObservatoryDeckAction,
  AtlasValidationDomain,
  AtlasValidationIssue,
  AtlasWorkflowStep,
  AtlasWorkflowSummary,
} from "./simulationDiagnosticsTypes";

type Options = {
  navigatorSummary: AtlasNavigatorSummary;
  workflowSummary: AtlasWorkflowSummary;
  executeNavigatorItem: (item: AtlasNavigatorItem) => void;
  updateMissionHubStoredState: (
    updater: (state: AtlasMissionHubStoredState) => AtlasMissionHubStoredState,
  ) => void;
  setWorkflowSelectedId: (id: string) => void;
  setWorkflowActiveStepId: (id: string) => void;
  setWorkflowOpen: AtlasPanelBooleanSetter;
  setMissionHubOpen: AtlasPanelBooleanSetter;
  setObservatoryDeckOpen: AtlasPanelBooleanSetter;
  setValidationConsoleOpen: AtlasPanelBooleanSetter;
};

/** Cross-panel workflow actions share one navigation and mission-history policy. */
export function useAtlasWorkbenchWorkflowActions({
  navigatorSummary,
  workflowSummary,
  executeNavigatorItem,
  updateMissionHubStoredState,
  setWorkflowSelectedId,
  setWorkflowActiveStepId,
  setWorkflowOpen,
  setMissionHubOpen,
  setObservatoryDeckOpen,
  setValidationConsoleOpen,
}: Options) {
  const runWorkflowStep = useCallback(
    (step: AtlasWorkflowStep) => {
      if (step.status === "blocked" || !step.navigatorItem) return;
      const workflow = workflowSummary.workflows.find((candidate) =>
        candidate.steps.some((candidateStep) => candidateStep.id === step.id),
      );
      if (workflow) {
        updateMissionHubStoredState((state) =>
          recordAtlasMissionHubRecent(
            state,
            workflowStepToMissionHubStoredItem(workflow.id, step.id),
          ),
        );
      }
      setWorkflowActiveStepId(step.id);
      executeNavigatorItem(step.navigatorItem);
    },
    [
      executeNavigatorItem,
      setWorkflowActiveStepId,
      updateMissionHubStoredState,
      workflowSummary.workflows,
    ],
  );

  const runObservatoryDeckAction = useCallback(
    (action: AtlasObservatoryDeckAction) => {
      if (action.workflowId && action.workflowStepId) {
        const workflow = workflowSummary.workflows.find(
          (candidate) => candidate.id === action.workflowId,
        );
        const step =
          workflow?.steps.find((candidate) => candidate.id === action.workflowStepId) ??
          action.workflowStep;
        if (workflow && step) {
          setObservatoryDeckOpen(false);
          setWorkflowSelectedId(workflow.id);
          setWorkflowOpen(true);
          runWorkflowStep(step);
          return;
        }
      }
      const item = action.navigatorItemId
        ? navigatorSummary.items.find((candidate) => candidate.id === action.navigatorItemId)
        : action.navigatorItem;
      if (item) {
        setObservatoryDeckOpen(false);
        executeNavigatorItem(item);
      }
    },
    [
      executeNavigatorItem,
      navigatorSummary.items,
      runWorkflowStep,
      setObservatoryDeckOpen,
      setWorkflowOpen,
      setWorkflowSelectedId,
      workflowSummary.workflows,
    ],
  );

  const toggleMissionHubPinned = useCallback(
    (item: AtlasMissionHubItem) => {
      updateMissionHubStoredState((state) =>
        toggleAtlasMissionHubPinned(state, { id: item.id, kind: item.kind }),
      );
    },
    [updateMissionHubStoredState],
  );

  const executeMissionHubItem = useCallback(
    (item: AtlasMissionHubItem) => {
      if (item.stale) return;
      setMissionHubOpen(false);
      if (item.kind === "workflow" && item.workflowId) {
        updateMissionHubStoredState((state) =>
          recordAtlasMissionHubRecent(state, { id: item.id, kind: item.kind }),
        );
        setWorkflowSelectedId(item.workflowId);
        setWorkflowOpen(true);
        return;
      }
      if (item.kind === "workflow-step" && item.workflowId && item.workflowStepId) {
        const workflow = workflowSummary.workflows.find(
          (candidate) => candidate.id === item.workflowId,
        );
        const step = workflow?.steps.find(
          (candidate) => candidate.id === item.workflowStepId,
        );
        if (step) {
          setWorkflowSelectedId(item.workflowId);
          setWorkflowOpen(true);
          runWorkflowStep(step);
        }
        return;
      }
      if (item.navigatorItem) executeNavigatorItem(item.navigatorItem);
    },
    [
      executeNavigatorItem,
      runWorkflowStep,
      setMissionHubOpen,
      setWorkflowOpen,
      setWorkflowSelectedId,
      updateMissionHubStoredState,
      workflowSummary.workflows,
    ],
  );

  const runValidationDomainAction = useCallback(
    (domain: AtlasValidationDomain) => {
      const item = domain.relatedNavigatorItemId
        ? navigatorSummary.items.find(
            (candidate) => candidate.id === domain.relatedNavigatorItemId,
          )
        : null;
      if (item) {
        setValidationConsoleOpen(false);
        executeNavigatorItem(item);
      }
    },
    [executeNavigatorItem, navigatorSummary.items, setValidationConsoleOpen],
  );

  const runValidationIssueAction = useCallback(
    (issue: AtlasValidationIssue) => {
      const item = issue.relatedNavigatorItemId
        ? navigatorSummary.items.find(
            (candidate) => candidate.id === issue.relatedNavigatorItemId,
          )
        : null;
      if (item) {
        setValidationConsoleOpen(false);
        executeNavigatorItem(item);
      }
    },
    [executeNavigatorItem, navigatorSummary.items, setValidationConsoleOpen],
  );

  return {
    handleAtlasWorkflowRunStep: runWorkflowStep,
    handleObservatoryDeckAction: runObservatoryDeckAction,
    handleMissionHubTogglePinned: toggleMissionHubPinned,
    handleMissionHubExecuteItem: executeMissionHubItem,
    handleValidationDomainAction: runValidationDomainAction,
    handleValidationIssueAction: runValidationIssueAction,
  };
}

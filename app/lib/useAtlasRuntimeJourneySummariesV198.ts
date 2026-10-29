import { useEffect, useMemo, useState } from "react";
import type { GaiaIndexedStar } from "./gaiaCatalogIndex";
import type {
  AtlasNavigatorSummary,
  AtlasWorkflowSummary,
  EvidenceLedgerSummary,
} from "./simulationDiagnosticsTypes";

const NAVIGATOR_FALLBACK: AtlasNavigatorSummary = {
  version: "v24-unified-atlas-navigator",
  query: "",
  itemCount: 0,
  resultCount: 0,
  selectedDefaultId: "",
  items: [],
  results: [],
};

const WORKFLOW_FALLBACK: AtlasWorkflowSummary = {
  version: "v25-atlas-workflows",
  workflowCount: 0,
  readyStepCount: 0,
  blockedStepCount: 0,
  selectedDefaultId: "solar-validation",
  workflows: [],
};

type NavigatorFactory = typeof import("./atlasNavigator")["createAtlasNavigatorSummary"];
type WorkflowFactory = typeof import("./atlasWorkflows")["createAtlasWorkflowSummary"];

type JourneyFactories = {
  navigator: NavigatorFactory;
  workflow: WorkflowFactory;
};

export type AtlasRuntimeJourneySummariesV198Options = {
  requested: boolean;
  evidenceLedgerSummary: EvidenceLedgerSummary;
  orbitAnalysisAvailable: boolean;
  gaiaIndex: readonly GaiaIndexedStar[];
};

/** Defers the duplicate workbench indexes until a journey surface needs them. */
export function useAtlasRuntimeJourneySummariesV198({
  requested,
  evidenceLedgerSummary,
  orbitAnalysisAvailable,
  gaiaIndex,
}: AtlasRuntimeJourneySummariesV198Options) {
  const [factories, setFactories] = useState<JourneyFactories | null>(null);

  useEffect(() => {
    if (!requested || factories) return;
    let active = true;
    void Promise.all([
      import("./atlasNavigator"),
      import("./atlasWorkflows"),
    ]).then(([navigatorModule, workflowModule]) => {
      if (!active) return;
      setFactories({
        navigator: navigatorModule.createAtlasNavigatorSummary,
        workflow: workflowModule.createAtlasWorkflowSummary,
      });
    });
    return () => {
      active = false;
    };
  }, [factories, requested]);

  const atlasNavigatorSummary = useMemo(
    () => factories
      ? factories.navigator({
        query: "",
        evidenceLedgerSummary,
        orbitAnalysisAvailable,
        gaiaIndex,
      })
      : NAVIGATOR_FALLBACK,
    [evidenceLedgerSummary, factories, gaiaIndex, orbitAnalysisAvailable],
  );
  const atlasWorkflowSummary = useMemo(
    () => factories
      ? factories.workflow({ navigatorSummary: atlasNavigatorSummary })
      : WORKFLOW_FALLBACK,
    [atlasNavigatorSummary, factories],
  );
  return {
    atlasNavigatorSummary,
    atlasWorkflowSummary,
    detailedJourneyIndexReady: Boolean(factories),
  };
}

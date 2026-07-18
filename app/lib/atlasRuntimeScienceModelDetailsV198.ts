import type {
  KerrRelativityStudioSummary,
  SimulationDiagnostics,
} from "./simulationDiagnosticsTypes";
import { createAtlasHorizonsGateAuditSummary } from "./atlasHorizonsGateAudit";
import { createAtlasHorizonsResidualDecompositionSummary } from "./atlasHorizonsResidualDecomposition";
import { createAtlasPhysicsBenchmarkGateSummary } from "./atlasPhysicsBenchmarkGate";
import { createAtlasPhysicsGateSplitSummary } from "./atlasPhysicsGateSplit";
import { createAtlasRelativityChartSummary } from "./atlasRelativityCharts";
import { createAtlasRelativitySimulationOptimizationSummary } from "./atlasRelativitySimulationOptimization";
import { createAtlasRelativityVerificationSummary } from "./atlasRelativityVerification";
import { createAtlasReleaseReadinessSummary } from "./atlasReleaseReadiness";
import { createAtlasScientificGatePreflightSummary } from "./atlasScientificGatePreflight";
import {
  createRelativityObservableAtlasSummary,
  createRelativityObservableExplainerSummary,
} from "./relativityObservableAtlas";
import { createRelativityGuidedTourSummary } from "./relativityGuidedTour";

export type AtlasRuntimeScienceModelDetailsV198Options = {
  diagnostics: SimulationDiagnostics | null;
  kerrStudioSummary: KerrRelativityStudioSummary;
};

/** Full report-grade science summaries, loaded only after a science intent. */
export function createAtlasRuntimeScienceModelDetailsV198({
  diagnostics,
  kerrStudioSummary,
}: AtlasRuntimeScienceModelDetailsV198Options) {
  const relativityObservableAtlasSummary = createRelativityObservableAtlasSummary({
    diagnostics,
    kerrStudioSummary,
  });
  const relativityObservableExplainerSummary = createRelativityObservableExplainerSummary({
    observableAtlasSummary: relativityObservableAtlasSummary,
  });
  const relativityGuidedTourSummary = createRelativityGuidedTourSummary({
    observableAtlasSummary: relativityObservableAtlasSummary,
    explainerSummary: relativityObservableExplainerSummary,
  });
  const atlasRelativityVerificationSummary = createAtlasRelativityVerificationSummary({
    kerrStudioSummary,
    observableAtlasSummary: relativityObservableAtlasSummary,
    explainerSummary: relativityObservableExplainerSummary,
    guidedTourSummary: relativityGuidedTourSummary,
  });
  const atlasRelativityChartSummary = createAtlasRelativityChartSummary({
    diagnostics,
    kerrStudioSummary,
    verificationSummary: atlasRelativityVerificationSummary,
  });
  const horizons = diagnostics?.relativityValidation.horizons ?? null;
  const atlasPhysicsBenchmarkGateSummary = createAtlasPhysicsBenchmarkGateSummary(horizons);
  const atlasHorizonsGateAuditSummary = createAtlasHorizonsGateAuditSummary(horizons);
  const atlasPhysicsGateSplitSummary = createAtlasPhysicsGateSplitSummary(horizons);
  const atlasReleaseReadinessSummary = createAtlasReleaseReadinessSummary(horizons);
  const atlasScientificGatePreflightSummary = createAtlasScientificGatePreflightSummary(horizons);
  const atlasHorizonsResidualDecompositionSummary = createAtlasHorizonsResidualDecompositionSummary(horizons);
  const atlasRelativitySimulationOptimizationSummary =
    createAtlasRelativitySimulationOptimizationSummary({
      kerrStudioSummary,
      observableAtlasSummary: relativityObservableAtlasSummary,
      explainerSummary: relativityObservableExplainerSummary,
      guidedTourSummary: relativityGuidedTourSummary,
      relativityVerificationSummary: atlasRelativityVerificationSummary,
      relativityChartSummary: atlasRelativityChartSummary,
    });

  return {
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
    atlasRelativitySimulationOptimizationSummary,
  };
}

export type AtlasRuntimeScienceModelDetailsV198 = ReturnType<
  typeof createAtlasRuntimeScienceModelDetailsV198
>;

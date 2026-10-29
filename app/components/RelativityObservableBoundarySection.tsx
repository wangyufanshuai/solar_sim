import type { RelativityObservableAtlasPanelProps } from "./RelativityObservableAtlasPanel";

export type RelativityObservableBoundarySectionProps = Pick<
  RelativityObservableAtlasPanelProps,
  | "physicsBenchmarkGateSummary"
  | "horizonsGateAuditSummary"
  | "physicsGateSplitSummary"
  | "scientificGatePreflightSummary"
  | "horizonsResidualDecompositionSummary"
  | "horizonsCandidateLabSummary"
  | "plutoResidualIsolationSummary"
  | "outerSystemForceModelPreflightSummary"
  | "outerSystemReferenceAdoptionSummary"
  | "horizonsCandidateScientificGateSummary"
  | "strictHorizonsMigrationDryRunSummary"
  | "strictHorizonsShadowMigrationGateSummary"
  | "defaultStrictHorizonsMigrationSummary"
  | "horizonsProvenanceFreezeSummary"
  | "offlineRuntimeBoundaryAuditSummary"
  | "scientificGateMaintenanceRunbookSummary"
  | "scientificGateReleaseEvidenceSummary"
  | "browserCiStabilityLockSummary"
  | "releaseArtifactManifestLockSummary"
  | "finalMaintenanceBaselineSummary"
  | "gaiaStarfieldEnhancementSummary"
  | "relativitySimulationOptimizationSummary"
  | "artPolishSummary"
  | "postEnhancementMaintenanceBaselineSummary"
  | "browserResourcePerformanceSummary"
  | "maintenanceEvidenceIndexSummary"
  | "presentationRuntimePerformanceSummary"
  | "browserAcceptanceRuntimeCostSummary"
  | "finalGaiaArtEnhancementSummary"
  | "rcEvidenceClosureSummary"
  | "interactionCatalogCompletionSummary"
  | "interactionRepairLaunchUxSummary"
  | "interactionVisualQualitySummary"
>;

export function selectRelativityObservableBoundarySectionProps(
  props: RelativityObservableAtlasPanelProps,
): RelativityObservableBoundarySectionProps {
  return {
    physicsBenchmarkGateSummary: props.physicsBenchmarkGateSummary,
    horizonsGateAuditSummary: props.horizonsGateAuditSummary,
    physicsGateSplitSummary: props.physicsGateSplitSummary,
    scientificGatePreflightSummary: props.scientificGatePreflightSummary,
    horizonsResidualDecompositionSummary: props.horizonsResidualDecompositionSummary,
    horizonsCandidateLabSummary: props.horizonsCandidateLabSummary,
    plutoResidualIsolationSummary: props.plutoResidualIsolationSummary,
    outerSystemForceModelPreflightSummary: props.outerSystemForceModelPreflightSummary,
    outerSystemReferenceAdoptionSummary: props.outerSystemReferenceAdoptionSummary,
    horizonsCandidateScientificGateSummary: props.horizonsCandidateScientificGateSummary,
    strictHorizonsMigrationDryRunSummary: props.strictHorizonsMigrationDryRunSummary,
    strictHorizonsShadowMigrationGateSummary: props.strictHorizonsShadowMigrationGateSummary,
    defaultStrictHorizonsMigrationSummary: props.defaultStrictHorizonsMigrationSummary,
    horizonsProvenanceFreezeSummary: props.horizonsProvenanceFreezeSummary,
    offlineRuntimeBoundaryAuditSummary: props.offlineRuntimeBoundaryAuditSummary,
    scientificGateMaintenanceRunbookSummary: props.scientificGateMaintenanceRunbookSummary,
    scientificGateReleaseEvidenceSummary: props.scientificGateReleaseEvidenceSummary,
    browserCiStabilityLockSummary: props.browserCiStabilityLockSummary,
    releaseArtifactManifestLockSummary: props.releaseArtifactManifestLockSummary,
    finalMaintenanceBaselineSummary: props.finalMaintenanceBaselineSummary,
    gaiaStarfieldEnhancementSummary: props.gaiaStarfieldEnhancementSummary,
    relativitySimulationOptimizationSummary: props.relativitySimulationOptimizationSummary,
    artPolishSummary: props.artPolishSummary,
    postEnhancementMaintenanceBaselineSummary: props.postEnhancementMaintenanceBaselineSummary,
    browserResourcePerformanceSummary: props.browserResourcePerformanceSummary,
    maintenanceEvidenceIndexSummary: props.maintenanceEvidenceIndexSummary,
    presentationRuntimePerformanceSummary: props.presentationRuntimePerformanceSummary,
    browserAcceptanceRuntimeCostSummary: props.browserAcceptanceRuntimeCostSummary,
    finalGaiaArtEnhancementSummary: props.finalGaiaArtEnhancementSummary,
    rcEvidenceClosureSummary: props.rcEvidenceClosureSummary,
    interactionCatalogCompletionSummary: props.interactionCatalogCompletionSummary,
    interactionRepairLaunchUxSummary: props.interactionRepairLaunchUxSummary,
    interactionVisualQualitySummary: props.interactionVisualQualitySummary,
  };
}


import RelativityObservableBoundaryStatusSection from "./RelativityObservableBoundaryStatusSection";
import RelativityObservableProductBoundaryTables from "./RelativityObservableProductBoundaryTables";
import RelativityObservableScienceBoundaryTables from "./RelativityObservableScienceBoundaryTables";

export default function RelativityObservableBoundarySection(
  props: RelativityObservableBoundarySectionProps,
) {
  return (
    <>
      <RelativityObservableBoundaryStatusSection {...props} />
      <RelativityObservableProductBoundaryTables {...props} />
      <RelativityObservableScienceBoundaryTables {...props} />
    </>
  );
}

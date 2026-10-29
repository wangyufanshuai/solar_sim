"use client";

import { Activity } from "lucide-react";
import {
  AtlasInstrumentHeader,
  AtlasInstrumentInfoBlock,
  AtlasInstrumentPanelShell,
  AtlasInstrumentStat,
  AtlasInstrumentStatStrip,
  useAtlasWorkbenchSurfaceAccessibility,
} from "./AtlasInstrumentUi";
import RelativityObservableBoundarySection, { selectRelativityObservableBoundarySectionProps } from "./RelativityObservableBoundarySection";
import RelativityObservableChartSection from "./RelativityObservableChartSection";
import RelativityObservableOverviewSection, { selectRelativityObservableOverviewSectionProps } from "./RelativityObservableOverviewSection";
import RelativityObservableReadoutSection, { selectRelativityObservableReadoutSectionProps } from "./RelativityObservableReadoutSection";
import RelativityResearchWorkspaceSection from "./RelativityResearchWorkspaceSection";
import { RELATIVITY_OBSERVABLE_ATLAS_VERSION } from "../lib/relativityObservableAtlas";
import type {
  AtlasRelativityChartSummary,
  AtlasRelativityVerificationSummary,
  AtlasHorizonsGateAuditSummary,
  AtlasHorizonsCandidateLabSummary,
  AtlasHorizonsCandidateScientificGateSummary,
  AtlasHorizonsResidualDecompositionSummary,
  AtlasPhysicsBenchmarkGateSummary,
  AtlasPhysicsGateSplitSummary,
  AtlasPlutoResidualIsolationSummary,
  AtlasDefaultStrictHorizonsMigrationSummary,
  AtlasHorizonsProvenanceFreezeSummary,
  AtlasOfflineRuntimeBoundaryAuditSummary,
  AtlasScientificGateMaintenanceRunbookSummary,
  AtlasScientificGateReleaseEvidenceSummary,
  AtlasBrowserCiStabilityLockSummary,
  AtlasReleaseArtifactManifestLockSummary,
  AtlasFinalMaintenanceBaselineSummary,
  AtlasGaiaStarfieldEnhancementSummary,
  AtlasRelativitySimulationOptimizationSummary,
  AtlasArtPolishSummary,
  AtlasPostEnhancementMaintenanceBaselineSummary,
  AtlasBrowserResourcePerformanceSummary,
  AtlasMaintenanceEvidenceIndexSummary,
  AtlasPresentationRuntimePerformanceSummary,
  AtlasBrowserAcceptanceRuntimeCostSummary,
  AtlasFinalGaiaArtEnhancementSummary,
  AtlasRcEvidenceClosureSummary,
  AtlasInteractionCatalogCompletionSummary,
  AtlasInteractionRepairLaunchUxSummary,
  AtlasInteractionVisualQualitySummary,
  AtlasCriticalUiRelativityVisibilitySummary,
  AtlasCameraStellarCloseupSummary,
  AtlasLaunchGameplayOpenRocketBridgeSummary,
  AtlasScientificModelUpgradeContractSummary,
  AtlasOuterSystemForceModelPreflightSummary,
  AtlasOuterSystemReferenceAdoptionSummary,
  AtlasScientificGatePreflightSummary,
  AtlasStrictHorizonsMigrationDryRunSummary,
  AtlasStrictHorizonsShadowMigrationGateSummary,
  RelativityObservableAtlasSummary,
  RelativityObservableExplainerSummary,
} from "../lib/simulationDiagnosticsTypes";

export type RelativityObservableAtlasPanelProps = {
  open: boolean;
  summary: RelativityObservableAtlasSummary;
  explainerSummary: RelativityObservableExplainerSummary;
  relativityVerificationSummary: AtlasRelativityVerificationSummary;
  relativityChartSummary: AtlasRelativityChartSummary;
  physicsBenchmarkGateSummary: AtlasPhysicsBenchmarkGateSummary;
  horizonsGateAuditSummary: AtlasHorizonsGateAuditSummary;
  physicsGateSplitSummary: AtlasPhysicsGateSplitSummary;
  scientificGatePreflightSummary: AtlasScientificGatePreflightSummary;
  horizonsResidualDecompositionSummary: AtlasHorizonsResidualDecompositionSummary;
  horizonsCandidateLabSummary: AtlasHorizonsCandidateLabSummary;
  plutoResidualIsolationSummary: AtlasPlutoResidualIsolationSummary;
  outerSystemForceModelPreflightSummary: AtlasOuterSystemForceModelPreflightSummary;
  outerSystemReferenceAdoptionSummary: AtlasOuterSystemReferenceAdoptionSummary;
  horizonsCandidateScientificGateSummary: AtlasHorizonsCandidateScientificGateSummary;
  strictHorizonsMigrationDryRunSummary: AtlasStrictHorizonsMigrationDryRunSummary;
  strictHorizonsShadowMigrationGateSummary: AtlasStrictHorizonsShadowMigrationGateSummary;
  defaultStrictHorizonsMigrationSummary: AtlasDefaultStrictHorizonsMigrationSummary;
  horizonsProvenanceFreezeSummary: AtlasHorizonsProvenanceFreezeSummary;
  offlineRuntimeBoundaryAuditSummary: AtlasOfflineRuntimeBoundaryAuditSummary;
  scientificGateMaintenanceRunbookSummary: AtlasScientificGateMaintenanceRunbookSummary;
  scientificGateReleaseEvidenceSummary: AtlasScientificGateReleaseEvidenceSummary;
  browserCiStabilityLockSummary: AtlasBrowserCiStabilityLockSummary;
  releaseArtifactManifestLockSummary: AtlasReleaseArtifactManifestLockSummary;
  finalMaintenanceBaselineSummary: AtlasFinalMaintenanceBaselineSummary;
  gaiaStarfieldEnhancementSummary: AtlasGaiaStarfieldEnhancementSummary;
  relativitySimulationOptimizationSummary: AtlasRelativitySimulationOptimizationSummary;
  artPolishSummary: AtlasArtPolishSummary;
  postEnhancementMaintenanceBaselineSummary: AtlasPostEnhancementMaintenanceBaselineSummary;
  browserResourcePerformanceSummary: AtlasBrowserResourcePerformanceSummary;
  maintenanceEvidenceIndexSummary: AtlasMaintenanceEvidenceIndexSummary;
  presentationRuntimePerformanceSummary: AtlasPresentationRuntimePerformanceSummary;
  browserAcceptanceRuntimeCostSummary: AtlasBrowserAcceptanceRuntimeCostSummary;
  finalGaiaArtEnhancementSummary: AtlasFinalGaiaArtEnhancementSummary;
  rcEvidenceClosureSummary: AtlasRcEvidenceClosureSummary;
  interactionCatalogCompletionSummary: AtlasInteractionCatalogCompletionSummary;
  interactionRepairLaunchUxSummary: AtlasInteractionRepairLaunchUxSummary;
  interactionVisualQualitySummary: AtlasInteractionVisualQualitySummary;
  criticalUiRelativityVisibilitySummary: AtlasCriticalUiRelativityVisibilitySummary;
  cameraStellarCloseupSummary: AtlasCameraStellarCloseupSummary;
  launchGameplayOpenRocketBridgeSummary: AtlasLaunchGameplayOpenRocketBridgeSummary;
  scientificModelUpgradeContractSummary: AtlasScientificModelUpgradeContractSummary;
  onOpenEvidenceLedger: () => void;
  onOpenKerrStudio: () => void;
  onClose: () => void;
};

export default function RelativityObservableAtlasPanel(panelProps: RelativityObservableAtlasPanelProps) {
  const {
  open,
  summary,
  explainerSummary,
  relativityVerificationSummary,
  relativityChartSummary,
  physicsBenchmarkGateSummary,
  horizonsGateAuditSummary,
  physicsGateSplitSummary,
  scientificGatePreflightSummary,
  horizonsResidualDecompositionSummary,
  horizonsCandidateLabSummary,
  plutoResidualIsolationSummary,
  outerSystemForceModelPreflightSummary,
  outerSystemReferenceAdoptionSummary,
  horizonsCandidateScientificGateSummary,
  strictHorizonsMigrationDryRunSummary,
  strictHorizonsShadowMigrationGateSummary,
  defaultStrictHorizonsMigrationSummary,
  horizonsProvenanceFreezeSummary,
  offlineRuntimeBoundaryAuditSummary,
  scientificGateMaintenanceRunbookSummary,
  scientificGateReleaseEvidenceSummary,
  browserCiStabilityLockSummary,
  releaseArtifactManifestLockSummary,
  finalMaintenanceBaselineSummary,
  gaiaStarfieldEnhancementSummary,
  relativitySimulationOptimizationSummary,
  artPolishSummary,
  postEnhancementMaintenanceBaselineSummary,
  browserResourcePerformanceSummary,
  maintenanceEvidenceIndexSummary,
  presentationRuntimePerformanceSummary,
  browserAcceptanceRuntimeCostSummary,
  finalGaiaArtEnhancementSummary,
  rcEvidenceClosureSummary,
  interactionCatalogCompletionSummary,
  interactionRepairLaunchUxSummary,
  interactionVisualQualitySummary,
  criticalUiRelativityVisibilitySummary,
  cameraStellarCloseupSummary,
  launchGameplayOpenRocketBridgeSummary,
  scientificModelUpgradeContractSummary,
  onClose,
} = panelProps;
  const { closeWithFocusReturn, onSurfaceKeyDown } = useAtlasWorkbenchSurfaceAccessibility({
    open,
    surfaceId: "relativity-observables",
    onClose,
  });
  if (!open) return null;
  return (
    <AtlasInstrumentPanelShell
      kind="relativity-observables"
      accessibilitySurfaceId="relativity-observables"
      className="z-[110] overflow-hidden sm:inset-x-auto sm:bottom-auto sm:left-4 sm:top-14 sm:w-[min(60rem,calc(100vw-2rem))]"
      data-relativity-observable-panel-version={RELATIVITY_OBSERVABLE_ATLAS_VERSION}
      data-relativity-observable-count={summary.observableCount}
      data-relativity-observable-ready-count={summary.readyCount}
      data-relativity-observable-boundary={summary.boundary}
      data-relativity-explainer-version={explainerSummary.version}
      data-relativity-explainer-card-count={explainerSummary.cardCount}
      data-relativity-explainer-step-count={explainerSummary.totalStepCount}
      data-relativity-explainer-boundary={explainerSummary.boundary}
      data-atlas-relativity-verification-version={relativityVerificationSummary.version}
      data-atlas-relativity-benchmark-profile={relativityVerificationSummary.benchmarkProfile}
      data-atlas-relativity-weak-field-count={relativityVerificationSummary.weakFieldObservableCount}
      data-atlas-relativity-strong-field-count={relativityVerificationSummary.strongFieldObservableCount}
      data-atlas-relativity-numerical-health-count={relativityVerificationSummary.numericalHealthMetricCount}
      data-atlas-relativity-kerr-kernel={relativityVerificationSummary.kerrKernelId}
      data-atlas-relativity-verification-boundary={relativityVerificationSummary.trustedBoundary}
      data-atlas-relativity-chart-version={relativityChartSummary.version}
      data-atlas-relativity-chart-profile={relativityChartSummary.chartProfile}
      data-atlas-relativity-chart-mercury-points={relativityChartSummary.mercuryCurve.length}
      data-atlas-relativity-chart-isco-bars={relativityChartSummary.kerrIscoBars.length}
      data-atlas-relativity-chart-hamiltonian-classification={relativityChartSummary.hamiltonianDrift.classification}
      data-atlas-relativity-chart-boundary={relativityChartSummary.trustedBoundary}
      data-atlas-physics-benchmark-gate-version={physicsBenchmarkGateSummary.version}
      data-atlas-physics-benchmark-budget-profile={physicsBenchmarkGateSummary.budgetProfile}
      data-atlas-physics-benchmark-runtime-status={physicsBenchmarkGateSummary.runtimeStatus}
      data-atlas-physics-benchmark-blocking-count={physicsBenchmarkGateSummary.blockingCount}
      data-atlas-physics-benchmark-ci-certification={physicsBenchmarkGateSummary.ciCertificationStatus}
      data-atlas-physics-benchmark-boundary={physicsBenchmarkGateSummary.trustedBoundary}
      data-atlas-horizons-gate-audit-version={horizonsGateAuditSummary.version}
      data-atlas-horizons-gate-audit-profile={horizonsGateAuditSummary.auditProfile}
      data-atlas-horizons-gate-audit-status={horizonsGateAuditSummary.status}
      data-atlas-horizons-gate-audit-classification={horizonsGateAuditSummary.failureClassification}
      data-atlas-horizons-gate-audit-boundary={horizonsGateAuditSummary.trustedBoundary}
      data-atlas-physics-gate-split-version={physicsGateSplitSummary.version}
      data-atlas-physics-gate-split-profile={physicsGateSplitSummary.gateSplitProfile}
      data-atlas-product-release-gate-status={physicsGateSplitSummary.productReleaseGateStatus}
      data-atlas-scientific-horizons-gate-status={physicsGateSplitSummary.scientificHorizonsGateStatus}
      data-atlas-physics-gate-split-boundary={physicsGateSplitSummary.trustedBoundary}
      data-atlas-scientific-gate-preflight-version={scientificGatePreflightSummary.version}
      data-atlas-scientific-gate-preflight-profile={scientificGatePreflightSummary.preflightProfile}
      data-atlas-scientific-gate-preflight-status={scientificGatePreflightSummary.status}
      data-atlas-scientific-gate-preflight-boundary={scientificGatePreflightSummary.trustedBoundary}
      data-atlas-horizons-residual-decomposition-version={horizonsResidualDecompositionSummary.version}
      data-atlas-horizons-residual-decomposition-profile={horizonsResidualDecompositionSummary.decompositionProfile}
      data-atlas-horizons-residual-decomposition-status={horizonsResidualDecompositionSummary.status}
      data-atlas-horizons-residual-dominant-body={horizonsResidualDecompositionSummary.dominantBodyId}
      data-atlas-horizons-residual-decomposition-boundary={horizonsResidualDecompositionSummary.trustedBoundary}
      data-atlas-horizons-candidate-lab-version={horizonsCandidateLabSummary.version}
      data-atlas-horizons-candidate-lab-profile={horizonsCandidateLabSummary.candidateProfile}
      data-atlas-horizons-candidate-lab-status={horizonsCandidateLabSummary.status}
      data-atlas-horizons-candidate-count={horizonsCandidateLabSummary.candidateCount}
      data-atlas-horizons-candidate-lab-boundary={horizonsCandidateLabSummary.trustedBoundary}
      data-atlas-pluto-residual-isolation-version={plutoResidualIsolationSummary.version}
      data-atlas-pluto-residual-isolation-profile={plutoResidualIsolationSummary.isolationProfile}
      data-atlas-pluto-residual-isolation-status={plutoResidualIsolationSummary.status}
      data-atlas-pluto-residual-isolation-classification={plutoResidualIsolationSummary.classification}
      data-atlas-pluto-residual-isolation-boundary={plutoResidualIsolationSummary.trustedBoundary}
      data-atlas-outer-system-force-model-preflight-version={outerSystemForceModelPreflightSummary.version}
      data-atlas-outer-system-force-model-preflight-profile={outerSystemForceModelPreflightSummary.preflightProfile}
      data-atlas-outer-system-force-model-preflight-status={outerSystemForceModelPreflightSummary.status}
      data-atlas-outer-system-force-model-preflight-classification={outerSystemForceModelPreflightSummary.classification}
      data-atlas-outer-system-force-model-preflight-boundary={outerSystemForceModelPreflightSummary.trustedBoundary}
      data-atlas-outer-system-reference-adoption-version={outerSystemReferenceAdoptionSummary.version}
      data-atlas-outer-system-reference-adoption-profile={outerSystemReferenceAdoptionSummary.adoptionProfile}
      data-atlas-outer-system-reference-adoption-status={outerSystemReferenceAdoptionSummary.status}
      data-atlas-outer-system-reference-adoption-classification={outerSystemReferenceAdoptionSummary.classification}
      data-atlas-outer-system-reference-adoption-boundary={outerSystemReferenceAdoptionSummary.trustedBoundary}
      data-atlas-horizons-candidate-scientific-gate-version={horizonsCandidateScientificGateSummary.version}
      data-atlas-horizons-candidate-scientific-gate-profile={horizonsCandidateScientificGateSummary.candidateGateProfile}
      data-atlas-horizons-candidate-scientific-gate-status={horizonsCandidateScientificGateSummary.status}
      data-atlas-horizons-candidate-scientific-gate-classification={horizonsCandidateScientificGateSummary.classification}
      data-atlas-horizons-candidate-scientific-gate-boundary={horizonsCandidateScientificGateSummary.trustedBoundary}
      data-atlas-strict-horizons-migration-dry-run-version={strictHorizonsMigrationDryRunSummary.version}
      data-atlas-strict-horizons-migration-dry-run-profile={strictHorizonsMigrationDryRunSummary.migrationProfile}
      data-atlas-strict-horizons-migration-dry-run-status={strictHorizonsMigrationDryRunSummary.status}
      data-atlas-strict-horizons-migration-dry-run-classification={strictHorizonsMigrationDryRunSummary.classification}
      data-atlas-strict-horizons-migration-dry-run-boundary={strictHorizonsMigrationDryRunSummary.trustedBoundary}
      data-atlas-strict-horizons-shadow-migration-gate-version={strictHorizonsShadowMigrationGateSummary.version}
      data-atlas-strict-horizons-shadow-migration-gate-profile={strictHorizonsShadowMigrationGateSummary.shadowGateProfile}
      data-atlas-strict-horizons-shadow-migration-gate-status={strictHorizonsShadowMigrationGateSummary.status}
      data-atlas-strict-horizons-shadow-migration-gate-classification={strictHorizonsShadowMigrationGateSummary.classification}
      data-atlas-strict-horizons-shadow-migration-gate-boundary={strictHorizonsShadowMigrationGateSummary.trustedBoundary}
      data-atlas-default-strict-horizons-migration-version={defaultStrictHorizonsMigrationSummary.version}
      data-atlas-default-strict-horizons-migration-profile={defaultStrictHorizonsMigrationSummary.migrationProfile}
      data-atlas-default-strict-horizons-migration-status={defaultStrictHorizonsMigrationSummary.status}
      data-atlas-default-strict-horizons-migration-classification={defaultStrictHorizonsMigrationSummary.classification}
      data-atlas-default-strict-horizons-migration-boundary={defaultStrictHorizonsMigrationSummary.trustedBoundary}
      data-atlas-horizons-provenance-freeze-version={horizonsProvenanceFreezeSummary.version}
      data-atlas-horizons-provenance-freeze-profile={horizonsProvenanceFreezeSummary.freezeProfile}
      data-atlas-horizons-provenance-freeze-status={horizonsProvenanceFreezeSummary.status}
      data-atlas-horizons-provenance-freeze-classification={horizonsProvenanceFreezeSummary.classification}
      data-atlas-horizons-provenance-freeze-boundary={horizonsProvenanceFreezeSummary.trustedBoundary}
      data-atlas-offline-runtime-boundary-audit-version={offlineRuntimeBoundaryAuditSummary.version}
      data-atlas-offline-runtime-boundary-audit-profile={offlineRuntimeBoundaryAuditSummary.boundaryProfile}
      data-atlas-offline-runtime-boundary-audit-status={offlineRuntimeBoundaryAuditSummary.status}
      data-atlas-offline-runtime-boundary-audit-classification={offlineRuntimeBoundaryAuditSummary.classification}
      data-atlas-offline-runtime-boundary-audit-boundary={offlineRuntimeBoundaryAuditSummary.trustedBoundary}
      data-atlas-scientific-gate-maintenance-runbook-version={scientificGateMaintenanceRunbookSummary.version}
      data-atlas-scientific-gate-maintenance-runbook-profile={scientificGateMaintenanceRunbookSummary.runbookProfile}
      data-atlas-scientific-gate-maintenance-runbook-status={scientificGateMaintenanceRunbookSummary.status}
      data-atlas-scientific-gate-maintenance-runbook-classification={scientificGateMaintenanceRunbookSummary.classification}
      data-atlas-scientific-gate-maintenance-runbook-boundary={scientificGateMaintenanceRunbookSummary.trustedBoundary}
      data-atlas-scientific-gate-release-evidence-version={scientificGateReleaseEvidenceSummary.version}
      data-atlas-scientific-gate-release-evidence-profile={scientificGateReleaseEvidenceSummary.releaseEvidenceProfile}
      data-atlas-scientific-gate-release-evidence-status={scientificGateReleaseEvidenceSummary.status}
      data-atlas-scientific-gate-release-evidence-classification={scientificGateReleaseEvidenceSummary.classification}
      data-atlas-scientific-gate-release-evidence-boundary={scientificGateReleaseEvidenceSummary.trustedBoundary}
      data-atlas-browser-ci-stability-lock-version={browserCiStabilityLockSummary.version}
      data-atlas-browser-ci-stability-lock-profile={browserCiStabilityLockSummary.stabilityProfile}
      data-atlas-browser-ci-stability-lock-status={browserCiStabilityLockSummary.status}
      data-atlas-browser-ci-stability-lock-classification={browserCiStabilityLockSummary.classification}
      data-atlas-browser-ci-stability-lock-boundary={browserCiStabilityLockSummary.trustedBoundary}
      data-atlas-release-artifact-manifest-lock-version={releaseArtifactManifestLockSummary.version}
      data-atlas-release-artifact-manifest-lock-profile={releaseArtifactManifestLockSummary.artifactManifestProfile}
      data-atlas-release-artifact-manifest-lock-status={releaseArtifactManifestLockSummary.status}
      data-atlas-release-artifact-manifest-lock-classification={releaseArtifactManifestLockSummary.classification}
      data-atlas-release-artifact-manifest-lock-boundary={releaseArtifactManifestLockSummary.trustedBoundary}
      data-atlas-final-maintenance-baseline-version={finalMaintenanceBaselineSummary.version}
      data-atlas-final-maintenance-baseline-profile={finalMaintenanceBaselineSummary.maintenanceBaselineProfile}
      data-atlas-final-maintenance-baseline-status={finalMaintenanceBaselineSummary.status}
      data-atlas-final-maintenance-baseline-classification={finalMaintenanceBaselineSummary.classification}
      data-atlas-final-maintenance-baseline-boundary={finalMaintenanceBaselineSummary.trustedBoundary}
      data-atlas-gaia-starfield-enhancement-version={gaiaStarfieldEnhancementSummary.version}
      data-atlas-gaia-starfield-enhancement-profile={gaiaStarfieldEnhancementSummary.overlayProfile}
      data-atlas-gaia-starfield-enhancement-status={gaiaStarfieldEnhancementSummary.status}
      data-atlas-gaia-starfield-enhancement-classification={gaiaStarfieldEnhancementSummary.classification}
      data-atlas-gaia-starfield-enhancement-boundary={gaiaStarfieldEnhancementSummary.trustedBoundary}
      data-atlas-relativity-simulation-optimization-version={relativitySimulationOptimizationSummary.version}
      data-atlas-relativity-simulation-optimization-profile={relativitySimulationOptimizationSummary.optimizationProfile}
      data-atlas-relativity-simulation-optimization-status={relativitySimulationOptimizationSummary.status}
      data-atlas-relativity-simulation-optimization-classification={relativitySimulationOptimizationSummary.classification}
      data-atlas-relativity-simulation-optimization-kerr-kernel={relativitySimulationOptimizationSummary.kerrKernelId}
      data-atlas-relativity-simulation-optimization-performance-hud-policy={relativitySimulationOptimizationSummary.performanceHudPolicy}
      data-atlas-relativity-simulation-optimization-boundary={relativitySimulationOptimizationSummary.trustedBoundary}
      data-atlas-art-polish-version={artPolishSummary.version}
      data-atlas-art-polish-profile={artPolishSummary.artPolishProfile}
      data-atlas-art-polish-status={artPolishSummary.status}
      data-atlas-art-polish-classification={artPolishSummary.classification}
      data-atlas-art-polish-boundary={artPolishSummary.trustedBoundary}
      data-atlas-post-enhancement-baseline-version={postEnhancementMaintenanceBaselineSummary.version}
      data-atlas-post-enhancement-baseline-profile={postEnhancementMaintenanceBaselineSummary.postEnhancementBaselineProfile}
      data-atlas-post-enhancement-baseline-status={postEnhancementMaintenanceBaselineSummary.status}
      data-atlas-post-enhancement-baseline-classification={postEnhancementMaintenanceBaselineSummary.classification}
      data-atlas-post-enhancement-baseline-boundary={postEnhancementMaintenanceBaselineSummary.trustedBoundary}
      data-atlas-browser-resource-performance-version={browserResourcePerformanceSummary.version}
      data-atlas-browser-resource-performance-profile={browserResourcePerformanceSummary.browserResourcePerformanceProfile}
      data-atlas-browser-resource-performance-status={browserResourcePerformanceSummary.status}
      data-atlas-browser-resource-performance-classification={browserResourcePerformanceSummary.classification}
      data-atlas-browser-resource-performance-boundary={browserResourcePerformanceSummary.trustedBoundary}
      data-atlas-maintenance-evidence-index-version={maintenanceEvidenceIndexSummary.version}
      data-atlas-maintenance-evidence-index-profile={maintenanceEvidenceIndexSummary.maintenanceEvidenceIndexProfile}
      data-atlas-maintenance-evidence-index-status={maintenanceEvidenceIndexSummary.status}
      data-atlas-maintenance-evidence-index-classification={maintenanceEvidenceIndexSummary.classification}
      data-atlas-maintenance-evidence-index-boundary={maintenanceEvidenceIndexSummary.trustedBoundary}
      data-atlas-presentation-runtime-performance-version={presentationRuntimePerformanceSummary.version}
      data-atlas-presentation-runtime-performance-profile={presentationRuntimePerformanceSummary.presentationRuntimePerformanceProfile}
      data-atlas-presentation-runtime-performance-status={presentationRuntimePerformanceSummary.status}
      data-atlas-presentation-runtime-performance-classification={presentationRuntimePerformanceSummary.classification}
      data-atlas-presentation-runtime-performance-boundary={presentationRuntimePerformanceSummary.trustedBoundary}
      data-atlas-browser-acceptance-runtime-cost-version={browserAcceptanceRuntimeCostSummary.version}
      data-atlas-browser-acceptance-runtime-cost-profile={browserAcceptanceRuntimeCostSummary.browserAcceptanceRuntimeCostProfile}
      data-atlas-browser-acceptance-runtime-cost-status={browserAcceptanceRuntimeCostSummary.status}
      data-atlas-browser-acceptance-runtime-cost-classification={browserAcceptanceRuntimeCostSummary.classification}
      data-atlas-browser-acceptance-runtime-cost-boundary={browserAcceptanceRuntimeCostSummary.trustedBoundary}
      data-atlas-final-gaia-art-enhancement-version={finalGaiaArtEnhancementSummary.version}
      data-atlas-final-gaia-art-enhancement-profile={finalGaiaArtEnhancementSummary.finalGaiaArtEnhancementProfile}
      data-atlas-final-gaia-art-enhancement-status={finalGaiaArtEnhancementSummary.status}
      data-atlas-final-gaia-art-enhancement-classification={finalGaiaArtEnhancementSummary.classification}
      data-atlas-final-gaia-art-enhancement-boundary={finalGaiaArtEnhancementSummary.trustedBoundary}
      data-atlas-rc-evidence-closure-version={rcEvidenceClosureSummary.version}
      data-atlas-rc-evidence-closure-profile={rcEvidenceClosureSummary.rcEvidenceClosureProfile}
      data-atlas-rc-evidence-closure-status={rcEvidenceClosureSummary.status}
      data-atlas-rc-evidence-closure-classification={rcEvidenceClosureSummary.classification}
      data-atlas-rc-evidence-closure-boundary={rcEvidenceClosureSummary.trustedBoundary}
      data-atlas-interaction-catalog-completion-version={interactionCatalogCompletionSummary.version}
      data-atlas-interaction-catalog-completion-profile={interactionCatalogCompletionSummary.profile}
      data-atlas-interaction-catalog-completion-status={interactionCatalogCompletionSummary.status}
      data-atlas-interaction-catalog-completion-classification={interactionCatalogCompletionSummary.classification}
      data-atlas-interaction-catalog-completion-boundary={interactionCatalogCompletionSummary.trustedBoundary}
      data-atlas-interaction-repair-launch-ux-version={interactionRepairLaunchUxSummary.version}
      data-atlas-interaction-repair-launch-ux-profile={interactionRepairLaunchUxSummary.profile}
      data-atlas-interaction-repair-launch-ux-status={interactionRepairLaunchUxSummary.status}
      data-atlas-interaction-repair-launch-ux-classification={interactionRepairLaunchUxSummary.classification}
      data-atlas-interaction-repair-launch-ux-boundary={interactionRepairLaunchUxSummary.trustedBoundary}
      data-atlas-interaction-visual-quality-version={interactionVisualQualitySummary.version}
      data-atlas-interaction-visual-quality-profile={interactionVisualQualitySummary.profile}
      data-atlas-interaction-visual-quality-status={interactionVisualQualitySummary.status}
      data-atlas-interaction-visual-quality-classification={interactionVisualQualitySummary.classification}
      data-atlas-interaction-visual-quality-boundary={interactionVisualQualitySummary.trustedBoundary}
      data-atlas-critical-ui-relativity-visibility-version={criticalUiRelativityVisibilitySummary.version}
      data-atlas-critical-ui-relativity-visibility-profile={criticalUiRelativityVisibilitySummary.profile}
      data-atlas-critical-ui-relativity-visibility-status={criticalUiRelativityVisibilitySummary.status}
      data-atlas-critical-ui-relativity-visibility-classification={criticalUiRelativityVisibilitySummary.classification}
      data-atlas-critical-ui-relativity-visibility-boundary={criticalUiRelativityVisibilitySummary.trustedBoundary}
      data-atlas-camera-stellar-closeup-version={cameraStellarCloseupSummary.version}
      data-atlas-camera-stellar-closeup-profile={cameraStellarCloseupSummary.profile}
      data-atlas-camera-stellar-closeup-status={cameraStellarCloseupSummary.status}
      data-atlas-camera-stellar-closeup-classification={cameraStellarCloseupSummary.classification}
      data-atlas-camera-stellar-closeup-boundary={cameraStellarCloseupSummary.trustedBoundary}
      data-atlas-launch-gameplay-openrocket-bridge-version={launchGameplayOpenRocketBridgeSummary.version}
      data-atlas-launch-gameplay-openrocket-bridge-profile={launchGameplayOpenRocketBridgeSummary.profile}
      data-atlas-launch-gameplay-openrocket-bridge-status={launchGameplayOpenRocketBridgeSummary.status}
      data-atlas-launch-gameplay-openrocket-bridge-classification={launchGameplayOpenRocketBridgeSummary.classification}
      data-atlas-launch-gameplay-openrocket-bridge-boundary={launchGameplayOpenRocketBridgeSummary.trustedBoundary}
      data-atlas-scientific-model-upgrade-contract-version={scientificModelUpgradeContractSummary.version}
      data-atlas-scientific-model-upgrade-contract-profile={scientificModelUpgradeContractSummary.profile}
      data-atlas-scientific-model-upgrade-contract-status={scientificModelUpgradeContractSummary.status}
      data-atlas-scientific-model-upgrade-contract-boundary={scientificModelUpgradeContractSummary.trustedBoundary}
      aria-label="相对论可观测图谱"
      data-no-escape-clear
      onKeyDown={onSurfaceKeyDown}
    >
      <AtlasInstrumentHeader
        icon={<Activity className="h-3.5 w-3.5" />}
        title="相对论可观测图谱"
        subtitle="基于现有本地诊断的弱场与 Kerr 公式化可观测量"
        closeLabel="关闭相对论可观测图谱"
        onClose={closeWithFocusReturn}
      />

      <AtlasInstrumentStatStrip className="grid-cols-2 sm:grid-cols-5">
        <AtlasInstrumentStat label="状态" value={summary.status} tone={summary.status} />
        <AtlasInstrumentStat label="就绪" value={`${summary.readyCount}/${summary.observableCount}`} tone={summary.status} />
        <AtlasInstrumentStat label="弱场" value={String(summary.weakFieldCount)} tone="cyan" />
        <AtlasInstrumentStat label="Kerr" value={String(summary.strongFieldCount)} tone="informational" />
        <AtlasInstrumentStat label="卡片" value={String(explainerSummary.cardCount)} tone="informational" />
      </AtlasInstrumentStatStrip>

      <RelativityObservableOverviewSection {...selectRelativityObservableOverviewSectionProps(panelProps)} />

      <RelativityResearchWorkspaceSection />

      <div className="border-b border-cyan-100/10 px-3 py-2">
        <div className="grid gap-2 text-[11px] leading-4 text-white/56 sm:grid-cols-3">
          <AtlasInstrumentInfoBlock
            label="v73 benchmark"
            value={relativityVerificationSummary.benchmarkProfile}
          />
          <AtlasInstrumentInfoBlock
            label="readout split"
            value={`weak ${relativityVerificationSummary.weakFieldObservableCount}; Kerr ${relativityVerificationSummary.strongFieldObservableCount}; numerical ${relativityVerificationSummary.numericalHealthMetricCount}`}
          />
          <AtlasInstrumentInfoBlock
            label="kernel boundary"
            value={`${relativityVerificationSummary.kerrKernelId}; no physics mutation`}
          />
        </div>
      </div>

      <RelativityObservableBoundarySection {...selectRelativityObservableBoundarySectionProps(panelProps)} />

      <RelativityObservableChartSection summary={relativityChartSummary} />

      <RelativityObservableReadoutSection {...selectRelativityObservableReadoutSectionProps(panelProps)} />
    </AtlasInstrumentPanelShell>
  );
}

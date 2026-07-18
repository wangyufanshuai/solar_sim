"use client";

import { lazy, Suspense } from "react";
import { Activity, BookOpen, Gauge, ListChecks, ShieldCheck } from "lucide-react";
import {
  AtlasInstrumentActionButton,
  AtlasInstrumentHeader,
  AtlasInstrumentInfoBlock,
  AtlasInstrumentPanelShell,
  AtlasInstrumentSection,
  AtlasInstrumentStat,
  AtlasInstrumentStatStrip,
  AtlasInstrumentStatusBadge,
  useAtlasWorkbenchSurfaceAccessibility,
} from "./AtlasInstrumentUi";
import { RELATIVITY_OBSERVABLE_ATLAS_VERSION } from "../lib/relativityObservableAtlas";
import type {
  AtlasRelativityChartSummary,
  AtlasRelativityMercuryCurvePoint,
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
  RelativityObservableExplainerCard,
  RelativityObservableExplainerSummary,
  RelativityObservableRow,
} from "../lib/simulationDiagnosticsTypes";

const RelativityResearchWorkspaceV9 = lazy(
  () => import("./RelativityResearchWorkspaceV9"),
);

type RelativityObservableAtlasPanelProps = {
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

const KIND_LABELS: Record<RelativityObservableRow["kind"], string> = {
  "weak-field": "弱场 GR",
  "strong-field": "Kerr 工作室",
  "numerical-health": "数值健康",
};

const SCALE_BAND_LABELS: Record<RelativityObservableRow["scaleBand"], string> = {
  "weak-field-precision": "Weak-field precision",
  "strong-field-geometry": "Strong-field geometry",
  "numerical-health-boundary": "Numerical boundary",
};

const V73_CLASSIFICATION_LABELS: Record<RelativityObservableRow["kind"], string> = {
  "weak-field": "Weak-field observable: Newtonian baseline vs EIH 1PN correction",
  "strong-field": "Kerr test-particle reference: independent geodesic teaching lab",
  "numerical-health": "Numerical-health only: solver stability, not an astrophysical observable",
};

function RelativityMercuryCurve({
  points,
}: {
  points: readonly AtlasRelativityMercuryCurvePoint[];
}) {
  const maxY = Math.max(1, ...points.map((point) => point.targetArcsec));
  const eihPolyline = chartPolyline(points.map((point) => point.eihOnePnArcsec), maxY);
  const targetPolyline = chartPolyline(points.map((point) => point.targetArcsec), maxY);
  const newtonPolyline = chartPolyline(points.map((point) => point.newtonianArcsec), maxY);

  return (
    <div className="mt-2 h-28 min-w-0 rounded border border-cyan-100/10 bg-black/18 p-2">
      <svg
        viewBox="0 0 100 64"
        className="h-full w-full overflow-visible"
        aria-label="Mercury Newtonian versus EIH 1PN precession curve"
      >
        <polyline points="0,60 100,60" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />
        <polyline points="0,6 100,6" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.6" />
        <polyline points={targetPolyline} fill="none" stroke="rgba(255,255,255,0.36)" strokeWidth="1" strokeDasharray="3 3" />
        <polyline points={eihPolyline} fill="none" stroke="rgba(125,211,252,0.9)" strokeWidth="1.8" />
        <polyline points={newtonPolyline} fill="none" stroke="rgba(248,113,113,0.7)" strokeWidth="1.2" />
        {points.map((point, index) => (
          <circle
            key={`${point.label}:${index}`}
            cx={chartX(index, points.length)}
            cy={chartY(point.eihOnePnArcsec, maxY)}
            r="1.8"
            fill="rgba(125,211,252,0.92)"
          />
        ))}
      </svg>
    </div>
  );
}

function KerrIscoBars({ summary }: { summary: AtlasRelativityChartSummary }) {
  const maxRadius = Math.max(1, ...summary.kerrIscoBars.map((bar) => bar.radiusM));
  return (
    <div className="grid gap-1.5">
      {summary.kerrIscoBars.map((bar) => (
        <div
          key={bar.id}
          className="min-w-0"
          data-atlas-relativity-isco-bar-id={bar.id}
          data-atlas-relativity-isco-bar-radius-m={bar.radiusM.toFixed(3)}
        >
          <div className="mb-1 flex items-center justify-between gap-2 text-[10px] text-white/48">
            <span>{bar.label}</span>
            <span className="font-mono text-cyan-50/72">{bar.radiusM.toFixed(3)}M</span>
          </div>
          <div className="h-2 overflow-hidden rounded bg-white/[0.06]">
            <div
              className="h-full rounded bg-cyan-200/70"
              style={{ width: `${Math.max(4, (bar.radiusM / maxRadius) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function chartPolyline(values: readonly number[], maxY: number): string {
  return values.map((value, index) => `${chartX(index, values.length)},${chartY(value, maxY)}`).join(" ");
}

function chartX(index: number, length: number): number {
  return length <= 1 ? 0 : (index / (length - 1)) * 100;
}

function chartY(value: number, maxY: number): number {
  return 60 - Math.max(0, Math.min(1, value / maxY)) * 54;
}

export default function RelativityObservableAtlasPanel({
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
  onOpenEvidenceLedger,
  onOpenKerrStudio,
  onClose,
}: RelativityObservableAtlasPanelProps) {
  const { closeWithFocusReturn, onSurfaceKeyDown } = useAtlasWorkbenchSurfaceAccessibility({
    open,
    surfaceId: "relativity-observables",
    onClose,
  });
  if (!open) return null;
  const explainerCardsById = new Map(
    explainerSummary.cards.map((card) => [card.observableId, card]),
  );

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

      <div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-relativity-core-panel="true"
        data-atlas-relativity-core-entry-policy={criticalUiRelativityVisibilitySummary.relativityCoreEntryPolicy}
      >
        <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-cyan-100/50">
          <Gauge className="h-3.5 w-3.5" />
          <span>相对论核心</span>
        </div>
        <div className="grid gap-2 text-[11px] leading-4 text-white/58 sm:grid-cols-2 lg:grid-cols-4">
          <AtlasInstrumentInfoBlock
            label="EIH 1PN"
            value={`弱场太阳系修正；${relativityVerificationSummary.weakFieldObservableCount} 个可观测读数`}
          />
          <AtlasInstrumentInfoBlock
            label="DP5(4) / RK4"
            value="现有积分器可视化读数；默认模式未在 v110-v113 修改"
          />
          <AtlasInstrumentInfoBlock
            label="Mercury / Shapiro / 光偏折"
            value={`水星进动 ${relativityChartSummary.mercuryEihOnePnArcsecPerCentury.toFixed(2)} arcsec/century；Shapiro 与光偏折在 Observable Atlas 中保留`}
          />
          <AtlasInstrumentInfoBlock
            label="Kerr ISCO / Hamiltonian drift"
            value={`Kerr ISCO 条形图 + Hamiltonian drift ${relativityChartSummary.hamiltonianDrift.formatted}`}
          />
          <AtlasInstrumentInfoBlock
            label="科学边界"
            value="可见性与读数汇总层；不修改 EIH 1PN、RK4/DP、Kerr、fixtures 或 worker physics"
          />
          <AtlasInstrumentInfoBlock
            label="v110"
            value={`${criticalUiRelativityVisibilitySummary.status}; ${criticalUiRelativityVisibilitySummary.uiCopyPolicy}`}
          />
          <AtlasInstrumentInfoBlock
            label="v111"
            value={`${cameraStellarCloseupSummary.status}; ${cameraStellarCloseupSummary.cameraRigPolicy}`}
          />
          <AtlasInstrumentInfoBlock
            label="v112 / v113"
            value={`${launchGameplayOpenRocketBridgeSummary.openRocketBridgePolicy}; ${scientificModelUpgradeContractSummary.scientificUpgradePolicy}`}
          />
        </div>
      </div>

      <div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-relativity-force-model-v2-shadow="true"
        data-relativity-force-model-v2-default="legacy-eih-1pn"
        data-relativity-force-model-v2-promotion="blocked-shadow-retained"
      >
        <div className="grid gap-2 text-[11px] leading-4 text-white/58 sm:grid-cols-3">
          <AtlasInstrumentInfoBlock
            label="V2 Shadow"
            value="EIH 1PN + 太阳 2PN 单极项 + Lense-Thirring；只读 Worker 对照"
          />
          <AtlasInstrumentInfoBlock
            label="晋级门禁"
            value="十年 RMS < 10,000 km / 1 m/s，另需 Kerr、性能与全回归通过"
          />
          <AtlasInstrumentInfoBlock
            label="当前默认"
            value="legacy-eih-1pn；V2 未写入实时状态或现有 worker physics"
          />
        </div>
      </div>

      <Suspense
        fallback={
          <div className="border-b border-cyan-100/10 px-3 py-3 text-[10px] text-white/40">
            Loading research evidence workspace…
          </div>
        }
      >
        <RelativityResearchWorkspaceV9 />
      </Suspense>

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

      <div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-physics-benchmark-gate-strip
        data-atlas-horizons-gate-audit-strip
        data-atlas-physics-gate-split-strip
        data-atlas-scientific-gate-preflight-strip
        data-atlas-horizons-residual-decomposition-strip
        data-atlas-horizons-candidate-lab-strip
        data-atlas-pluto-residual-isolation-strip
        data-atlas-outer-system-force-model-preflight-strip
        data-atlas-outer-system-reference-adoption-strip
        data-atlas-horizons-candidate-scientific-gate-strip
        data-atlas-strict-horizons-migration-dry-run-strip
        data-atlas-strict-horizons-shadow-migration-gate-strip
        data-atlas-default-strict-horizons-migration-strip
        data-atlas-horizons-provenance-freeze-strip
        data-atlas-offline-runtime-boundary-audit-strip
        data-atlas-scientific-gate-maintenance-runbook-strip
        data-atlas-scientific-gate-release-evidence-strip
        data-atlas-browser-ci-stability-lock-strip
        data-atlas-release-artifact-manifest-lock-strip
        data-atlas-final-maintenance-baseline-strip
        data-atlas-gaia-starfield-enhancement-strip
        data-atlas-relativity-simulation-optimization-strip
        data-atlas-art-polish-strip
        data-atlas-post-enhancement-baseline-strip
        data-atlas-browser-resource-performance-strip
        data-atlas-maintenance-evidence-index-strip
        data-atlas-presentation-runtime-performance-strip
        data-atlas-browser-acceptance-runtime-cost-strip
        data-atlas-final-gaia-art-enhancement-strip
        data-atlas-rc-evidence-closure-strip
      >
        <div className="grid gap-2 text-[11px] leading-4 text-white/56 sm:grid-cols-3 lg:grid-cols-6">
          <AtlasInstrumentInfoBlock
            label="v75 release gate"
            value={physicsBenchmarkGateSummary.runtimeStatus}
          />
          <AtlasInstrumentInfoBlock
            label="local results"
            value={`${physicsBenchmarkGateSummary.passCount}/${physicsBenchmarkGateSummary.resultCount} pass`}
          />
          <AtlasInstrumentInfoBlock
            label="blocking"
            value={String(physicsBenchmarkGateSummary.blockingCount)}
          />
          <AtlasInstrumentInfoBlock
            label="CI status"
            value={physicsBenchmarkGateSummary.ciCertificationStatus}
          />
          <AtlasInstrumentInfoBlock
            label="v77 audit"
            value={`${horizonsGateAuditSummary.status}; ${horizonsGateAuditSummary.failureClassification}`}
          />
          <AtlasInstrumentInfoBlock
            label="product release"
            value={physicsGateSplitSummary.productReleaseGateStatus}
          />
          <AtlasInstrumentInfoBlock
            label="strict Horizons"
            value={physicsGateSplitSummary.scientificHorizonsGateStatus}
          />
          <AtlasInstrumentInfoBlock
            label="v80 preflight"
            value={scientificGatePreflightSummary.status}
          />
          <AtlasInstrumentInfoBlock
            label="candidate paths"
            value={String(scientificGatePreflightSummary.candidatePathCount)}
          />
          <AtlasInstrumentInfoBlock
            label="v81 RTN residuals"
            value={horizonsResidualDecompositionSummary.status}
          />
          <AtlasInstrumentInfoBlock
            label="residual rows"
            value={String(horizonsResidualDecompositionSummary.residualRowCount)}
          />
          <AtlasInstrumentInfoBlock
            label="1PN +10y dominant"
            value={horizonsResidualDecompositionSummary.dominantBodyId || "pending"}
          />
          <AtlasInstrumentInfoBlock
            label="v82 candidates"
            value={horizonsCandidateLabSummary.status}
          />
          <AtlasInstrumentInfoBlock
            label="candidate rows"
            value={`${horizonsCandidateLabSummary.completedCandidateCount}/${horizonsCandidateLabSummary.candidateCount}`}
          />
          <AtlasInstrumentInfoBlock
            label="best candidate"
            value={horizonsCandidateLabSummary.bestPositionCandidateId || "pending"}
          />
          <AtlasInstrumentInfoBlock
            label="v83 Pluto isolation"
            value={plutoResidualIsolationSummary.status}
          />
          <AtlasInstrumentInfoBlock
            label="classification"
            value={plutoResidualIsolationSummary.classification}
          />
          <AtlasInstrumentInfoBlock
            label="Pluto best"
            value={
              plutoResidualIsolationSummary.bestCandidatePlutoPlus10y.positionKm == null
                ? "pending"
                : `${plutoResidualIsolationSummary.bestCandidatePlutoPlus10y.positionKm.toExponential(2)} km`
            }
          />
          <AtlasInstrumentInfoBlock
            label="v84 outer-system"
            value={outerSystemForceModelPreflightSummary.status}
          />
          <AtlasInstrumentInfoBlock
            label="fixture class"
            value={outerSystemForceModelPreflightSummary.classification}
          />
          <AtlasInstrumentInfoBlock
            label="v84 rows"
            value={`${outerSystemForceModelPreflightSummary.completedCandidateCount}/${outerSystemForceModelPreflightSummary.candidateCount}`}
          />
          <AtlasInstrumentInfoBlock
            label="v85 adoption"
            value={outerSystemReferenceAdoptionSummary.status}
          />
          <AtlasInstrumentInfoBlock
            label="adoption class"
            value={outerSystemReferenceAdoptionSummary.classification}
          />
          <AtlasInstrumentInfoBlock
            label="v85 rows"
            value={`${outerSystemReferenceAdoptionSummary.completedCandidateCount}/${outerSystemReferenceAdoptionSummary.candidateCount}`}
          />
          <AtlasInstrumentInfoBlock
            label="v86 candidate gate"
            value={horizonsCandidateScientificGateSummary.status}
          />
          <AtlasInstrumentInfoBlock
            label="candidate gate class"
            value={horizonsCandidateScientificGateSummary.classification}
          />
          <AtlasInstrumentInfoBlock
            label="v86 rows"
            value={`${horizonsCandidateScientificGateSummary.completedCandidateCount}/${horizonsCandidateScientificGateSummary.candidateCount}`}
          />
          <AtlasInstrumentInfoBlock
            label="v87 migration dry-run"
            value={strictHorizonsMigrationDryRunSummary.status}
          />
          <AtlasInstrumentInfoBlock
            label="migration class"
            value={strictHorizonsMigrationDryRunSummary.classification}
          />
          <AtlasInstrumentInfoBlock
            label="v87 diffs"
            value={`${strictHorizonsMigrationDryRunSummary.completedMigrationDiffCount}/${strictHorizonsMigrationDryRunSummary.migrationDiffCount}`}
          />
          <AtlasInstrumentInfoBlock
            label="v88 shadow gate"
            value={strictHorizonsShadowMigrationGateSummary.status}
          />
          <AtlasInstrumentInfoBlock
            label="shadow class"
            value={strictHorizonsShadowMigrationGateSummary.classification}
          />
          <AtlasInstrumentInfoBlock
            label="v88 rows"
            value={`${strictHorizonsShadowMigrationGateSummary.completedShadowGateCount}/${strictHorizonsShadowMigrationGateSummary.shadowGateCount}`}
          />
          <AtlasInstrumentInfoBlock
            label="v89 default migration"
            value={defaultStrictHorizonsMigrationSummary.status}
          />
          <AtlasInstrumentInfoBlock
            label="migration class"
            value={defaultStrictHorizonsMigrationSummary.classification}
          />
          <AtlasInstrumentInfoBlock
            label="v89 rows"
            value={`${defaultStrictHorizonsMigrationSummary.completedMigrationRowCount}/${defaultStrictHorizonsMigrationSummary.migrationRowCount}`}
          />
          <AtlasInstrumentInfoBlock
            label="v90 freeze"
            value={horizonsProvenanceFreezeSummary.status}
          />
          <AtlasInstrumentInfoBlock
            label="freeze class"
            value={horizonsProvenanceFreezeSummary.classification}
          />
          <AtlasInstrumentInfoBlock
            label="v90 rows"
            value={`${horizonsProvenanceFreezeSummary.completedFreezeRowCount}/${horizonsProvenanceFreezeSummary.freezeRowCount}`}
          />
          <AtlasInstrumentInfoBlock
            label="v91 boundary"
            value={offlineRuntimeBoundaryAuditSummary.status}
          />
          <AtlasInstrumentInfoBlock
            label="boundary class"
            value={offlineRuntimeBoundaryAuditSummary.classification}
          />
          <AtlasInstrumentInfoBlock
            label="v91 rows"
            value={`${offlineRuntimeBoundaryAuditSummary.completedBoundaryRowCount}/${offlineRuntimeBoundaryAuditSummary.boundaryRowCount}`}
          />
          <AtlasInstrumentInfoBlock
            label="v92 runbook"
            value={scientificGateMaintenanceRunbookSummary.status}
          />
          <AtlasInstrumentInfoBlock
            label="runbook class"
            value={scientificGateMaintenanceRunbookSummary.classification}
          />
          <AtlasInstrumentInfoBlock
            label="v92 rows"
            value={`${scientificGateMaintenanceRunbookSummary.completedRunbookRowCount}/${scientificGateMaintenanceRunbookSummary.runbookRowCount}`}
          />
          <AtlasInstrumentInfoBlock
            label="v93 release evidence"
            value={scientificGateReleaseEvidenceSummary.status}
          />
          <AtlasInstrumentInfoBlock
            label="release class"
            value={scientificGateReleaseEvidenceSummary.classification}
          />
          <AtlasInstrumentInfoBlock
            label="v93 rows"
            value={`${scientificGateReleaseEvidenceSummary.completedReleaseEvidenceRowCount}/${scientificGateReleaseEvidenceSummary.releaseEvidenceRowCount}`}
          />
          <AtlasInstrumentInfoBlock
            label="v94 browser CI"
            value={browserCiStabilityLockSummary.status}
          />
          <AtlasInstrumentInfoBlock
            label="browser CI class"
            value={browserCiStabilityLockSummary.classification}
          />
          <AtlasInstrumentInfoBlock
            label="v94 rows"
            value={`${browserCiStabilityLockSummary.completedStabilityRowCount}/${browserCiStabilityLockSummary.stabilityRowCount}`}
          />
          <AtlasInstrumentInfoBlock
            label="v95 artifact manifest"
            value={releaseArtifactManifestLockSummary.status}
          />
          <AtlasInstrumentInfoBlock
            label="artifact class"
            value={releaseArtifactManifestLockSummary.classification}
          />
          <AtlasInstrumentInfoBlock
            label="v95 rows"
            value={`${releaseArtifactManifestLockSummary.completedManifestRowCount}/${releaseArtifactManifestLockSummary.manifestRowCount}`}
          />
          <AtlasInstrumentInfoBlock
            label="v96 final baseline"
            value={finalMaintenanceBaselineSummary.status}
          />
          <AtlasInstrumentInfoBlock
            label="baseline class"
            value={finalMaintenanceBaselineSummary.classification}
          />
          <AtlasInstrumentInfoBlock
            label="v96 rows"
            value={`${finalMaintenanceBaselineSummary.completedBaselineRowCount}/${finalMaintenanceBaselineSummary.baselineRowCount}`}
          />
          <AtlasInstrumentInfoBlock
            label="v97 Gaia overlay"
            value={gaiaStarfieldEnhancementSummary.status}
          />
          <AtlasInstrumentInfoBlock
            label="Gaia budget"
            value={`${gaiaStarfieldEnhancementSummary.qualityTier}; ${gaiaStarfieldEnhancementSummary.activeGaiaRenderBudget}`}
          />
          <AtlasInstrumentInfoBlock
            label="catalog overlay"
            value={`stars ${gaiaStarfieldEnhancementSummary.packagedGaiaBrightRowCount}; nebula ${gaiaStarfieldEnhancementSummary.nebulaMarkerCount}`}
          />
          <AtlasInstrumentInfoBlock
            label="v98 relativity optimization"
            value={relativitySimulationOptimizationSummary.status}
          />
          <AtlasInstrumentInfoBlock
            label="relativity readouts"
            value={`weak ${relativitySimulationOptimizationSummary.weakFieldObservableCount}; Kerr ${relativitySimulationOptimizationSummary.strongFieldReadoutCount}; health ${relativitySimulationOptimizationSummary.numericalHealthMetricCount}`}
          />
          <AtlasInstrumentInfoBlock
            label="HUD policy"
            value={relativitySimulationOptimizationSummary.performanceHudPolicy}
          />
          <AtlasInstrumentInfoBlock
            label="v99 art polish"
            value={artPolishSummary.status}
          />
          <AtlasInstrumentInfoBlock
            label="opacity caps"
            value={`mobile ${artPolishSummary.opacityCaps.mobile}; dense ${artPolishSummary.opacityCaps.dense}; closeup ${artPolishSummary.opacityCaps.closeup}`}
          />
          <AtlasInstrumentInfoBlock
            label="art policy"
            value={artPolishSummary.mobileDensityPolicy}
          />
          <AtlasInstrumentInfoBlock
            label="v100 post-enhancement"
            value={postEnhancementMaintenanceBaselineSummary.status}
          />
          <AtlasInstrumentInfoBlock
            label="v100 budgets"
            value={`Gaia ${postEnhancementMaintenanceBaselineSummary.gaiaRenderBudget.mobile}/${postEnhancementMaintenanceBaselineSummary.gaiaRenderBudget.balanced}/${postEnhancementMaintenanceBaselineSummary.gaiaRenderBudget.dense}; closeup ${postEnhancementMaintenanceBaselineSummary.artOpacityCaps.closeup}`}
          />
          <AtlasInstrumentInfoBlock
            label="v100 policy"
            value={postEnhancementMaintenanceBaselineSummary.relativityTeachingPolicy}
          />
          <AtlasInstrumentInfoBlock
            label="v101 browser resource"
            value={browserResourcePerformanceSummary.status}
          />
          <AtlasInstrumentInfoBlock
            label="v101 sampler"
            value={browserResourcePerformanceSummary.pixelSamplerPolicy}
          />
          <AtlasInstrumentInfoBlock
            label="v101 teardown"
            value={browserResourcePerformanceSummary.freshTeardownPolicy}
          />
          <AtlasInstrumentInfoBlock
            label="v102 maintenance evidence"
            value={maintenanceEvidenceIndexSummary.status}
          />
          <AtlasInstrumentInfoBlock
            label="v102 dirty policy"
            value={maintenanceEvidenceIndexSummary.dirtyWorktreePolicy}
          />
          <AtlasInstrumentInfoBlock
            label="v102 Watchpack"
            value={maintenanceEvidenceIndexSummary.watchpackNoisePolicy}
          />
          <AtlasInstrumentInfoBlock
            label="v103 runtime"
            value={presentationRuntimePerformanceSummary.status}
          />
          <AtlasInstrumentInfoBlock
            label="v103 Gaia"
            value={presentationRuntimePerformanceSummary.gaiaRuntimePolicy}
          />
          <AtlasInstrumentInfoBlock
            label="v103 labels"
            value={presentationRuntimePerformanceSummary.labelRuntimePolicy}
          />
          <AtlasInstrumentInfoBlock
            label="v104 browser QA"
            value={browserAcceptanceRuntimeCostSummary.status}
          />
          <AtlasInstrumentInfoBlock
            label="v104 screenshots"
            value={browserAcceptanceRuntimeCostSummary.screenshotManifestPolicy}
          />
          <AtlasInstrumentInfoBlock
            label="v104 markers"
            value={browserAcceptanceRuntimeCostSummary.markerCoveragePolicy}
          />
          <AtlasInstrumentInfoBlock
            label="v105 Gaia art"
            value={finalGaiaArtEnhancementSummary.status}
          />
          <AtlasInstrumentInfoBlock
            label="v105 selection"
            value={finalGaiaArtEnhancementSummary.gaiaSelectionPolicy}
          />
          <AtlasInstrumentInfoBlock
            label="v105 budget"
            value={`Gaia ${finalGaiaArtEnhancementSummary.gaiaRenderBudget.mobile}/${finalGaiaArtEnhancementSummary.gaiaRenderBudget.balanced}/${finalGaiaArtEnhancementSummary.gaiaRenderBudget.dense}; closeup ${finalGaiaArtEnhancementSummary.opacityCaps.closeup}`}
          />
          <AtlasInstrumentInfoBlock
            label="v106 RC evidence"
            value={rcEvidenceClosureSummary.status}
          />
          <AtlasInstrumentInfoBlock
            label="v106 artifacts"
            value={rcEvidenceClosureSummary.artifactIndexPolicy}
          />
          <AtlasInstrumentInfoBlock
            label="v106 dirty policy"
            value={rcEvidenceClosureSummary.dirtyWorktreePolicy}
          />
          <AtlasInstrumentInfoBlock
            label="v107 interaction"
            value={interactionCatalogCompletionSummary.status}
          />
          <AtlasInstrumentInfoBlock
            label="v107 camera"
            value={interactionCatalogCompletionSummary.cameraPolicy}
          />
          <AtlasInstrumentInfoBlock
            label="v107 catalog"
            value={`Gaia labels 24/8; constellations ${interactionCatalogCompletionSummary.constellationCount}; nebulae ${interactionCatalogCompletionSummary.nebulaCount}`}
          />
          <AtlasInstrumentInfoBlock
            label="v108 interaction"
            value={interactionRepairLaunchUxSummary.status}
          />
          <AtlasInstrumentInfoBlock
            label="v108 sky target"
            value={interactionRepairLaunchUxSummary.skyTargetPolicy}
          />
          <AtlasInstrumentInfoBlock
            label="v108 launch"
            value={interactionRepairLaunchUxSummary.launchUxPolicy}
          />
          <AtlasInstrumentInfoBlock
            label="v109 visual quality"
            value={interactionVisualQualitySummary.status}
          />
          <AtlasInstrumentInfoBlock
            label="v109 camera"
            value={interactionVisualQualitySummary.cameraFreedomPolicy}
          />
          <AtlasInstrumentInfoBlock
            label="v109 stellar"
            value={interactionVisualQualitySummary.stellarMaterialPolicy}
          />
        </div>
      </div>

      <div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-interaction-repair-launch-ux-strip
        data-atlas-interaction-repair-launch-ux-table
        data-atlas-interaction-repair-launch-ux-row-count={interactionRepairLaunchUxSummary.rows.length}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v108 Interaction Repair &amp; Launch UX Upgrade Lock
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Interaction repair and launch UX lock">
            {interactionRepairLaunchUxSummary.rows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]"
                role="row"
                data-atlas-interaction-repair-launch-ux-row-id={row.id}
                data-atlas-interaction-repair-launch-ux-row-status={row.status}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {row.id}
                </span>
                <span role="cell">{row.skyTargetProxyStatus}</span>
                <span role="cell">{row.launchUxStatus}</span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

      <div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-interaction-visual-quality-strip
        data-atlas-interaction-visual-quality-table
        data-atlas-interaction-visual-quality-row-count={interactionVisualQualitySummary.rows.length}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v109 Interaction Freedom / Launch Visual / Gaia Material Lock
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Interaction visual quality lock">
            {interactionVisualQualitySummary.rows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_8rem_8rem_8rem]"
                role="row"
                data-atlas-interaction-visual-quality-row-id={row.id}
                data-atlas-interaction-visual-quality-row-status={row.status}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {row.id}
                </span>
                <span role="cell">{row.cameraFreedomStatus}</span>
                <span role="cell">{row.launchVisualStatus}</span>
                <span role="cell">{row.stellarMaterialStatus}</span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

      <div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-interaction-catalog-completion-strip
        data-atlas-interaction-catalog-completion-table
        data-atlas-interaction-catalog-completion-row-count={interactionCatalogCompletionSummary.rows.length}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v107 Interaction &amp; Catalog Completion Lock
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Interaction catalog completion lock">
            {interactionCatalogCompletionSummary.rows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]"
                role="row"
                data-atlas-interaction-catalog-completion-row-id={row.id}
                data-atlas-interaction-catalog-completion-row-status={row.status}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {row.id}
                </span>
                <span role="cell">{row.cameraStatus}</span>
                <span role="cell">{row.gaiaNavigationStatus}</span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

      <div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-rc-evidence-closure-table
        data-atlas-rc-evidence-closure-row-count={rcEvidenceClosureSummary.rowCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v106 Release candidate evidence closure lock
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Release candidate evidence closure lock">
            {rcEvidenceClosureSummary.rows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]"
                role="row"
                data-atlas-rc-evidence-closure-row-id={row.id}
                data-atlas-rc-evidence-closure-row-status={row.status}
                data-atlas-rc-evidence-closure-command-status={row.commandMatrixStatus}
                data-atlas-rc-evidence-closure-artifact-status={row.artifactIndexStatus}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {row.id}
                </span>
                <span role="cell">{row.commandMatrixStatus}</span>
                <span role="cell">{row.rcEvidenceClosure}</span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

      <div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-final-gaia-art-enhancement-table
        data-atlas-final-gaia-art-enhancement-row-count={finalGaiaArtEnhancementSummary.rowCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v105 Final Gaia art enhancement lock
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Final Gaia art enhancement lock">
            {finalGaiaArtEnhancementSummary.rows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]"
                role="row"
                data-atlas-final-gaia-art-enhancement-row-id={row.id}
                data-atlas-final-gaia-art-enhancement-row-status={row.status}
                data-atlas-final-gaia-art-enhancement-selection-status={row.gaiaSelectionStatus}
                data-atlas-final-gaia-art-enhancement-budget-status={row.budgetBoundaryStatus}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {row.id}
                </span>
                <span role="cell">{row.gaiaSelectionStatus}</span>
                <span role="cell">{row.finalGaiaArtEnhancement}</span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

      <div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-browser-acceptance-runtime-cost-table
        data-atlas-browser-acceptance-runtime-cost-row-count={browserAcceptanceRuntimeCostSummary.rowCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v104 Browser acceptance runtime cost lock
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Browser acceptance runtime cost lock">
            {browserAcceptanceRuntimeCostSummary.rows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]"
                role="row"
                data-atlas-browser-acceptance-runtime-cost-row-id={row.id}
                data-atlas-browser-acceptance-runtime-cost-row-status={row.status}
                data-atlas-browser-acceptance-runtime-cost-screenshot-status={row.screenshotWorkloadStatus}
                data-atlas-browser-acceptance-runtime-cost-marker-status={row.markerCoverageStatus}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {row.id}
                </span>
                <span role="cell">{row.screenshotWorkloadStatus}</span>
                <span role="cell">{row.browserAcceptanceRuntimeCost}</span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

      <div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-presentation-runtime-performance-table
        data-atlas-presentation-runtime-performance-row-count={presentationRuntimePerformanceSummary.rowCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v103 Presentation runtime performance lock
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Presentation runtime performance lock">
            {presentationRuntimePerformanceSummary.rows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]"
                role="row"
                data-atlas-presentation-runtime-performance-row-id={row.id}
                data-atlas-presentation-runtime-performance-row-status={row.status}
                data-atlas-presentation-runtime-performance-gaia-status={row.gaiaRuntimeStatus}
                data-atlas-presentation-runtime-performance-budget-status={row.budgetThresholdStatus}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {row.id}
                </span>
                <span role="cell">{row.gaiaRuntimeStatus}</span>
                <span role="cell">{row.presentationRuntimePerformance}</span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

      <div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-maintenance-evidence-index-table
        data-atlas-maintenance-evidence-index-row-count={maintenanceEvidenceIndexSummary.rowCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v102 Maintenance evidence index
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Maintenance evidence index">
            {maintenanceEvidenceIndexSummary.rows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]"
                role="row"
                data-atlas-maintenance-evidence-index-row-id={row.id}
                data-atlas-maintenance-evidence-index-row-status={row.status}
                data-atlas-maintenance-evidence-index-dirty-status={row.dirtyWorktreePolicyStatus}
                data-atlas-maintenance-evidence-index-watchpack-status={row.watchpackNoisePolicyStatus}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {row.id}
                </span>
                <span role="cell">{row.browserQaIndexStatus}</span>
                <span role="cell">{row.maintenanceEvidenceIndex}</span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

      <div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-browser-resource-performance-table
        data-atlas-browser-resource-performance-row-count={browserResourcePerformanceSummary.rowCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v101 Browser resource performance lock
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Browser resource performance lock">
            {browserResourcePerformanceSummary.rows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]"
                role="row"
                data-atlas-browser-resource-performance-row-id={row.id}
                data-atlas-browser-resource-performance-row-status={row.status}
                data-atlas-browser-resource-performance-sampler-status={row.pixelSamplerStatus}
                data-atlas-browser-resource-performance-teardown-status={row.freshTeardownStatus}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {row.id}
                </span>
                <span role="cell">{row.pixelSamplerStatus}</span>
                <span role="cell">{row.browserResourcePerformance}</span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

      <div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-post-enhancement-baseline-table
        data-atlas-post-enhancement-baseline-row-count={postEnhancementMaintenanceBaselineSummary.rowCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v100 Post-enhancement maintenance baseline
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Post-enhancement maintenance baseline">
            {postEnhancementMaintenanceBaselineSummary.rows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]"
                role="row"
                data-atlas-post-enhancement-baseline-row-id={row.id}
                data-atlas-post-enhancement-baseline-row-status={row.status}
                data-atlas-post-enhancement-baseline-gaia-status={row.gaiaOverlayStatus}
                data-atlas-post-enhancement-baseline-art-status={row.artPolishStatus}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {row.id}
                </span>
                <span role="cell">{row.gaiaOverlayStatus}</span>
                <span role="cell">{row.postEnhancementBaseline}</span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

      <div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-art-polish-table
        data-atlas-art-polish-row-count={artPolishSummary.rowCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v99 Art polish
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Art polish">
            {artPolishSummary.rows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]"
                role="row"
                data-atlas-art-polish-row-id={row.id}
                data-atlas-art-polish-row-status={row.status}
                data-atlas-art-polish-gaia-status={row.gaiaLayerStatus}
                data-atlas-art-polish-mobile-status={row.mobileBudgetStatus}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {row.id}
                </span>
                <span role="cell">{row.mobileBudgetStatus}</span>
                <span role="cell">{row.artPolish}</span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

      <div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-relativity-simulation-optimization-table
        data-atlas-relativity-simulation-optimization-row-count={relativitySimulationOptimizationSummary.rowCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v98 Relativity simulation optimization
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Relativity simulation optimization">
            {relativitySimulationOptimizationSummary.rows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]"
                role="row"
                data-atlas-relativity-simulation-optimization-row-id={row.id}
                data-atlas-relativity-simulation-optimization-row-status={row.status}
                data-atlas-relativity-simulation-optimization-kerr-status={row.kerrStudioStatus}
                data-atlas-relativity-simulation-optimization-weak-field-status={row.weakFieldReadoutStatus}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {row.id}
                </span>
                <span role="cell">{row.weakFieldReadoutStatus}</span>
                <span role="cell">{row.relativitySimulationOptimization}</span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

      <div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-gaia-starfield-enhancement-table
        data-atlas-gaia-starfield-enhancement-row-count={gaiaStarfieldEnhancementSummary.overlayRowCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v97 Gaia starfield enhancement
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Gaia starfield enhancement">
            {gaiaStarfieldEnhancementSummary.overlayRows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]"
                role="row"
                data-atlas-gaia-starfield-enhancement-row-id={row.id}
                data-atlas-gaia-starfield-enhancement-row-status={row.status}
                data-atlas-gaia-starfield-enhancement-budget-status={row.overlayBudgetStatus}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {row.id}
                </span>
                <span role="cell">{row.overlayBudgetStatus}</span>
                <span role="cell">{row.gaiaStarfieldEnhancement}</span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

      <div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-final-maintenance-baseline-table
        data-atlas-final-maintenance-baseline-row-count={finalMaintenanceBaselineSummary.baselineRowCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v96 Final maintenance baseline
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Final maintenance baseline">
            {finalMaintenanceBaselineSummary.baselineRows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]"
                role="row"
                data-atlas-final-maintenance-baseline-row-id={row.id}
                data-atlas-final-maintenance-baseline-row-status={row.status}
                data-atlas-final-maintenance-baseline-policy-status={row.postBaselinePolicyStatus}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {row.id}
                </span>
                <span role="cell">{row.postBaselinePolicyStatus}</span>
                <span role="cell">{row.finalMaintenanceBaseline}</span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

      <div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-release-artifact-manifest-lock-table
        data-atlas-release-artifact-manifest-lock-row-count={releaseArtifactManifestLockSummary.manifestRowCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v95 Release artifact manifest lock
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Release artifact manifest lock">
            {releaseArtifactManifestLockSummary.manifestRows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]"
                role="row"
                data-atlas-release-artifact-manifest-lock-row-id={row.id}
                data-atlas-release-artifact-manifest-lock-row-status={row.status}
                data-atlas-release-artifact-manifest-lock-fixture-status={row.fixtureArtifactStatus}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {row.id}
                </span>
                <span role="cell">{row.fixtureArtifactStatus}</span>
                <span role="cell">{row.releaseArtifactManifestLock}</span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

      <div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-browser-ci-stability-lock-table
        data-atlas-browser-ci-stability-lock-row-count={browserCiStabilityLockSummary.stabilityRowCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v94 Browser CI stability lock
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Browser CI stability lock">
            {browserCiStabilityLockSummary.stabilityRows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]"
                role="row"
                data-atlas-browser-ci-stability-lock-row-id={row.id}
                data-atlas-browser-ci-stability-lock-row-status={row.status}
                data-atlas-browser-ci-stability-lock-fresh-server-status={row.freshServerStatus}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {row.id}
                </span>
                <span role="cell">{row.freshServerStatus}</span>
                <span role="cell">{row.browserCiStabilityLock}</span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

      <div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-scientific-gate-release-evidence-table
        data-atlas-scientific-gate-release-evidence-row-count={scientificGateReleaseEvidenceSummary.releaseEvidenceRowCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v93 Scientific gate release evidence
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Scientific gate release evidence">
            {scientificGateReleaseEvidenceSummary.releaseEvidenceRows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]"
                role="row"
                data-atlas-scientific-gate-release-evidence-row-id={row.id}
                data-atlas-scientific-gate-release-evidence-row-status={row.status}
                data-atlas-scientific-gate-release-evidence-fixture-status={row.fixtureEvidenceStatus}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {row.id}
                </span>
                <span role="cell">{row.fixtureEvidenceStatus}</span>
                <span role="cell">{row.scientificGateReleaseEvidence}</span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

      <div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-scientific-gate-maintenance-runbook-table
        data-atlas-scientific-gate-maintenance-runbook-row-count={scientificGateMaintenanceRunbookSummary.runbookRowCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v92 Scientific gate maintenance runbook
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Scientific gate maintenance runbook">
            {scientificGateMaintenanceRunbookSummary.runbookRows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]"
                role="row"
                data-atlas-scientific-gate-maintenance-runbook-row-id={row.id}
                data-atlas-scientific-gate-maintenance-runbook-row-status={row.status}
                data-atlas-scientific-gate-maintenance-runbook-rollback-status={row.rollbackContractStatus}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {row.id}
                </span>
                <span role="cell">{row.rollbackContractStatus}</span>
                <span role="cell">{row.scientificGateMaintenanceRunbook}</span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

      <div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-offline-runtime-boundary-audit-table
        data-atlas-offline-runtime-boundary-audit-row-count={offlineRuntimeBoundaryAuditSummary.boundaryRowCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v91 Offline/runtime boundary audit
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Offline runtime boundary audit">
            {offlineRuntimeBoundaryAuditSummary.boundaryRows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]"
                role="row"
                data-atlas-offline-runtime-boundary-audit-row-id={row.id}
                data-atlas-offline-runtime-boundary-audit-row-status={row.status}
                data-atlas-offline-runtime-boundary-audit-runtime-status={row.runtimeClaimStatus}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {row.id}
                </span>
                <span role="cell">{row.runtimeClaimStatus}</span>
                <span role="cell">{row.offlineRuntimeBoundaryAudit}</span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

      <div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-horizons-provenance-freeze-table
        data-atlas-horizons-provenance-freeze-row-count={horizonsProvenanceFreezeSummary.freezeRowCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v90 Horizons provenance freeze
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Horizons provenance freeze">
            {horizonsProvenanceFreezeSummary.freezeRows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]"
                role="row"
                data-atlas-horizons-provenance-freeze-row-id={row.id}
                data-atlas-horizons-provenance-freeze-row-status={row.status}
                data-atlas-horizons-provenance-freeze-hash-status={row.fixtureHashStatus}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {row.id}
                </span>
                <span role="cell">{row.fixtureHashStatus}</span>
                <span role="cell">{row.provenanceFreeze}</span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

      <div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-default-strict-horizons-migration-table
        data-atlas-default-strict-horizons-migration-row-count={defaultStrictHorizonsMigrationSummary.migrationRowCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v89 Default strict Horizons migration
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Default strict Horizons migration">
            {defaultStrictHorizonsMigrationSummary.migrationRows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]"
                role="row"
                data-atlas-default-strict-horizons-migration-row-id={row.id}
                data-atlas-default-strict-horizons-migration-row-status={row.status}
                data-atlas-default-strict-horizons-migration-budget-status={row.migratedBudgetStatus}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {row.id}
                </span>
                <span role="cell">{row.migratedBudgetStatus}</span>
                <span role="cell">{row.defaultScientificGateMigration}</span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

      <div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-strict-horizons-shadow-migration-gate-table
        data-atlas-strict-horizons-shadow-migration-gate-row-count={strictHorizonsShadowMigrationGateSummary.shadowGateCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v88 Strict Horizons shadow migration gate
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Strict Horizons shadow migration gate">
            {strictHorizonsShadowMigrationGateSummary.shadowGateRows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_7rem_8rem]"
                role="row"
                data-atlas-strict-horizons-shadow-migration-gate-row-id={row.id}
                data-atlas-strict-horizons-shadow-migration-gate-row-status={row.status}
                data-atlas-strict-horizons-shadow-migration-gate-budget-status={row.shadowBudgetStatus}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {row.id}
                </span>
                <span role="cell">{row.shadowBudgetStatus}</span>
                <span role="cell">
                  {row.onePnRmsPositionKm == null
                    ? row.status
                    : `${row.onePnRmsPositionKm.toExponential(2)} km`}
                </span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

      <div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-strict-horizons-migration-dry-run-table
        data-atlas-strict-horizons-migration-dry-run-row-count={strictHorizonsMigrationDryRunSummary.migrationDiffCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v87 Strict Horizons migration dry-run
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Strict Horizons migration dry-run">
            {strictHorizonsMigrationDryRunSummary.migrationDiffRows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_7rem_8rem]"
                role="row"
                data-atlas-strict-horizons-migration-dry-run-row-id={row.id}
                data-atlas-strict-horizons-migration-dry-run-row-status={row.status}
                data-atlas-strict-horizons-migration-dry-run-diff-status={row.diffStatus}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {row.id}
                </span>
                <span role="cell">{row.diffStatus}</span>
                <span role="cell">{row.candidateBudgetStatus}</span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

      <div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-horizons-candidate-scientific-gate-table
        data-atlas-horizons-candidate-scientific-gate-row-count={horizonsCandidateScientificGateSummary.candidateCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v86 Horizons candidate scientific gate
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Horizons candidate scientific gate">
            {horizonsCandidateScientificGateSummary.candidateRows.map((candidate) => (
              <div
                key={candidate.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_7rem_8rem]"
                role="row"
                data-atlas-horizons-candidate-scientific-gate-candidate-id={candidate.id}
                data-atlas-horizons-candidate-scientific-gate-candidate-status={candidate.status}
                data-atlas-horizons-candidate-scientific-gate-budget-status={candidate.candidateBudgetStatus}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {candidate.id}
                </span>
                <span role="cell">{candidate.candidateBudgetStatus}</span>
                <span role="cell">
                  {candidate.onePnRmsPositionKm == null
                    ? candidate.status
                    : `${candidate.onePnRmsPositionKm.toExponential(2)} km`}
                </span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

      <div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-outer-system-force-model-preflight-table
        data-atlas-outer-system-force-model-preflight-row-count={outerSystemForceModelPreflightSummary.candidateCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v84 Outer-system force-model preflight
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Outer-system force-model preflight">
            {outerSystemForceModelPreflightSummary.candidateRows.map((candidate) => (
              <div
                key={candidate.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_7rem_8rem]"
                role="row"
                data-atlas-outer-system-force-model-preflight-candidate-id={candidate.id}
                data-atlas-outer-system-force-model-preflight-candidate-status={candidate.status}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {candidate.id}
                </span>
                <span role="cell">{candidate.targetRole}</span>
                <span role="cell">
                  {candidate.plutoPositionKm == null
                    ? candidate.status
                    : `${candidate.plutoPositionKm.toExponential(2)} km`}
                </span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

      <div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-outer-system-reference-adoption-table
        data-atlas-outer-system-reference-adoption-row-count={outerSystemReferenceAdoptionSummary.candidateCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v85 Outer-system reference adoption
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Outer-system reference adoption">
            {outerSystemReferenceAdoptionSummary.candidateRows.map((candidate) => (
              <div
                key={candidate.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_7rem_8rem]"
                role="row"
                data-atlas-outer-system-reference-adoption-candidate-id={candidate.id}
                data-atlas-outer-system-reference-adoption-candidate-status={candidate.status}
                data-atlas-outer-system-reference-adoption-budget-status={candidate.candidateBudgetStatus}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {candidate.id}
                </span>
                <span role="cell">{candidate.candidateBudgetStatus}</span>
                <span role="cell">
                  {candidate.onePnRmsPositionKm == null
                    ? candidate.status
                    : `${candidate.onePnRmsPositionKm.toExponential(2)} km`}
                </span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

      <div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-pluto-residual-isolation-table
        data-atlas-pluto-residual-isolation-row-count={plutoResidualIsolationSummary.candidateCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v83 Pluto residual isolation
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Pluto residual isolation">
            {plutoResidualIsolationSummary.candidateRows.map((candidate) => (
              <div
                key={candidate.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_6rem_7rem]"
                role="row"
                data-atlas-pluto-residual-isolation-candidate-id={candidate.id}
                data-atlas-pluto-residual-isolation-candidate-status={candidate.status}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {candidate.id}
                </span>
                <span role="cell">dt {candidate.dtDays}</span>
                <span role="cell">
                  {candidate.plutoPositionKm == null
                    ? "pending"
                    : `${candidate.plutoPositionKm.toExponential(2)} km`}
                </span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

      <div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-horizons-candidate-table
        data-atlas-horizons-candidate-row-count={horizonsCandidateLabSummary.candidateCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v82 Horizons candidate lab
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Horizons candidate lab">
            {horizonsCandidateLabSummary.candidateRows.map((candidate) => (
              <div
                key={candidate.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_6rem_6rem]"
                role="row"
                data-atlas-horizons-candidate-id={candidate.id}
                data-atlas-horizons-candidate-status={candidate.status}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {candidate.id}
                </span>
                <span role="cell">dt {candidate.dtDays}</span>
                <span role="cell">eps {candidate.softeningAu}</span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

      <div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-horizons-residual-table
        data-atlas-horizons-residual-row-count={horizonsResidualDecompositionSummary.residualRowCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v81 Horizons residual attribution
          </div>
          {horizonsResidualDecompositionSummary.checkpointSummaries.length > 0 ? (
            <div className="mt-2 grid gap-1" role="table" aria-label="Horizons RTN residual attribution">
              {horizonsResidualDecompositionSummary.checkpointSummaries.map((checkpoint) => (
                <div
                  key={`${checkpoint.mode}:${checkpoint.checkpointLabel}`}
                  className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[7rem_minmax(0,1fr)_minmax(0,1fr)]"
                  role="row"
                  data-atlas-horizons-residual-checkpoint={`${checkpoint.mode}:${checkpoint.checkpointLabel}`}
                >
                  <span className="font-mono text-cyan-50/80" role="cell">
                    {checkpoint.mode} {checkpoint.checkpointLabel}
                  </span>
                  <span className="min-w-0" role="cell">
                    position {checkpoint.dominantPositionBodyId} / {checkpoint.dominantPositionComponent} /{" "}
                    {(checkpoint.dominantPositionContributionFraction * 100).toFixed(1)}%
                  </span>
                  <span className="min-w-0" role="cell">
                    velocity {checkpoint.dominantVelocityBodyId} / {checkpoint.dominantVelocityComponent} /{" "}
                    {(checkpoint.dominantVelocityContributionFraction * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-base leading-6 text-white/56">
              Runtime Horizons residuals pending. No CI or scientific certification is claimed in-app.
            </div>
          )}
        </AtlasInstrumentSection>
      </div>

      <div className="border-b border-cyan-100/10 px-3 py-2">
        <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.86fr)]">
          <AtlasInstrumentSection
            className="min-w-0"
            data-atlas-relativity-chart-id="mercury-newtonian-eih-1pn"
          >
            <div className="text-[10px] uppercase tracking-[0.14em] text-cyan-100/46">
              v74 Mercury precession curve
            </div>
            <RelativityMercuryCurve points={relativityChartSummary.mercuryCurve} />
            <div className="mt-2 grid gap-1 text-[10px] leading-4 text-white/46 sm:grid-cols-3">
              <span>Newtonian {relativityChartSummary.mercuryNewtonianArcsecPerCentury.toFixed(2)} arcsec/century</span>
              <span>EIH 1PN {relativityChartSummary.mercuryEihOnePnArcsecPerCentury.toFixed(2)}</span>
              <span>Target {relativityChartSummary.mercuryTargetArcsecPerCentury.toFixed(2)}</span>
            </div>
          </AtlasInstrumentSection>

          <AtlasInstrumentSection
            className="min-w-0"
            data-atlas-relativity-chart-id="kerr-isco-hamiltonian"
          >
            <div className="text-[10px] uppercase tracking-[0.14em] text-cyan-100/46">
              v74 Kerr readout
            </div>
            <div className="mt-2 grid gap-2">
              <KerrIscoBars summary={relativityChartSummary} />
              <AtlasInstrumentInfoBlock
                label="Hamiltonian drift"
                value={`${relativityChartSummary.hamiltonianDrift.formatted}; ${relativityChartSummary.hamiltonianDrift.classification}`}
              />
            </div>
          </AtlasInstrumentSection>
        </div>
      </div>

      <div className="border-b border-white/10 px-3 py-2">
        <div className="grid gap-2 sm:grid-cols-2">
          <AtlasInstrumentActionButton
            onClick={onOpenEvidenceLedger}
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
          >
            证据账本
          </AtlasInstrumentActionButton>
          <AtlasInstrumentActionButton
            onClick={onOpenKerrStudio}
            icon={<Gauge className="h-3.5 w-3.5" />}
          >
            Kerr 工作室
          </AtlasInstrumentActionButton>
        </div>
      </div>

      <div
        className="max-h-[calc(100dvh-var(--ui-dock-height)-160px-env(safe-area-inset-bottom))] overflow-y-auto overflow-x-hidden p-3 sm:max-h-[calc(100dvh-12.5rem)]"
        role="region"
        aria-label="相对论可观测量与推导卡片"
        tabIndex={0}
      >
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="grid min-w-0 gap-2">
            {summary.rows.map((row) => (
              <ObservableRowCard
                key={row.id}
                row={row}
                explainerCard={explainerCardsById.get(row.id) ?? null}
              />
            ))}
          </div>

          <AtlasInstrumentSection className="min-w-0 self-start">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-white/36">
              <ListChecks className="h-3.5 w-3.5" />
              <span>Boundary</span>
            </div>
            <div className="mt-3 grid gap-2">
              <AtlasInstrumentInfoBlock label="version" value={summary.version} />
              <AtlasInstrumentInfoBlock
                label="v73"
                value={`${relativityVerificationSummary.version}; ${relativityVerificationSummary.readyReadoutCount}/${relativityVerificationSummary.readoutCount} readouts ready`}
              />
              <AtlasInstrumentInfoBlock
                label="v74 charts"
                value={`${relativityChartSummary.version}; ${relativityChartSummary.chartProfile}`}
              />
              <AtlasInstrumentInfoBlock
                label="v75 gate"
                value={`${physicsBenchmarkGateSummary.version}; ${physicsBenchmarkGateSummary.budgetProfile}`}
              />
              <AtlasInstrumentInfoBlock label="boundary" value={summary.boundary} />
              <AtlasInstrumentInfoBlock
                label="v73 boundary"
                value={relativityVerificationSummary.trustedBoundary}
              />
              <AtlasInstrumentInfoBlock
                label="v74 boundary"
                value={relativityChartSummary.trustedBoundary}
              />
              <AtlasInstrumentInfoBlock
                label="v75 boundary"
                value={physicsBenchmarkGateSummary.trustedBoundary}
              />
              <AtlasInstrumentInfoBlock
                label="Hamiltonian drift"
                value="Numerical stability only; not an astrophysical observable."
              />
              <AtlasInstrumentInfoBlock
                label="explainer"
                value={`${explainerSummary.cardCount} cards; ${explainerSummary.totalStepCount} derivation steps; ${explainerSummary.totalVariableCount} variables`}
              />
              <AtlasInstrumentInfoBlock label="explainer boundary" value={explainerSummary.boundary} />
              <AtlasInstrumentInfoBlock
                label="Physics contract"
                value="Does not modify SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr kernel."
              />
            </div>
          </AtlasInstrumentSection>
        </div>
      </div>
    </AtlasInstrumentPanelShell>
  );
}

function ObservableRowCard({
  row,
  explainerCard,
}: {
  row: RelativityObservableRow;
  explainerCard: RelativityObservableExplainerCard | null;
}) {
  return (
    <AtlasInstrumentSection
      className="min-w-0"
      data-relativity-observable-row-id={row.id}
      data-relativity-observable-kind={row.kind}
      data-relativity-observable-status={row.status}
      data-relativity-observable-scale-band={row.scaleBand}
      data-atlas-relativity-classification={V73_CLASSIFICATION_LABELS[row.kind]}
    >
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="min-w-0 break-words text-[14px] font-semibold leading-5 text-white/90">
              {row.title}
            </h2>
            <AtlasInstrumentStatusBadge status={row.status} />
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-cyan-100/42">
            {KIND_LABELS[row.kind]}
          </div>
          <div className="mt-1 text-[10px] leading-4 text-white/42">
            {V73_CLASSIFICATION_LABELS[row.kind]}
          </div>
        </div>
        <div className="shrink-0 rounded border border-cyan-100/12 bg-cyan-100/[0.045] px-2 py-1 text-[10px] text-cyan-50/72">
          {row.confidence}
        </div>
      </div>

      <div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-2">
        <AtlasInstrumentInfoBlock
          label="formula"
          value={row.formula}
          className="[&_div:last-child]:break-all"
        />
        <AtlasInstrumentInfoBlock label="measured" value={row.measuredValue} />
        <AtlasInstrumentInfoBlock label="reference" value={row.referenceValue} />
        <AtlasInstrumentInfoBlock label="source" value={row.source} />
        <AtlasInstrumentInfoBlock label="scale band" value={SCALE_BAND_LABELS[row.scaleBand]} />
        <AtlasInstrumentInfoBlock label="scale note" value={row.scaleNote} />
      </div>
      <div className="mt-2">
        <AtlasInstrumentInfoBlock label="trusted boundary" value={row.boundary} />
      </div>
      {explainerCard ? <ExplainerCard card={explainerCard} /> : null}
    </AtlasInstrumentSection>
  );
}

function ExplainerCard({ card }: { card: RelativityObservableExplainerCard }) {
  return (
    <div
      className="mt-3 border-t border-cyan-100/10 pt-3"
      data-relativity-explainer-card-id={card.id}
      data-relativity-explainer-observable-id={card.observableId}
      data-relativity-explainer-variable-count={card.variables.length}
      data-relativity-explainer-step-count={card.derivationSteps.length}
    >
      <div className="flex min-w-0 items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-cyan-100/50">
        <BookOpen className="h-3.5 w-3.5 shrink-0" />
        <span>Derivation card</span>
      </div>
      <div className="mt-2 grid min-w-0 gap-2 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="min-w-0">
          <AtlasInstrumentInfoBlock
            label={card.formulaTitle}
            value={card.formulaExpression}
            className="[&_div:last-child]:break-all"
          />
          <div className="mt-2 grid gap-1">
            {card.variables.map((variable) => (
              <div
                key={`${card.id}:${variable.symbol}`}
                className="min-w-0 rounded border border-white/8 bg-white/[0.025] px-2 py-1.5"
              >
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="font-mono text-[11px] text-cyan-50/85">{variable.symbol}</span>
                  <span className="text-[11px] font-semibold text-white/78">{variable.label}</span>
                  <span className="text-[10px] text-white/36">{variable.unit}</span>
                </div>
                <div className="mt-1 text-[11px] leading-4 text-white/58">{variable.meaning}</div>
                <div className="mt-1 text-[10px] leading-4 text-white/34">{variable.source}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="min-w-0">
          <ol className="grid gap-1.5">
            {card.derivationSteps.map((step, index) => (
              <li
                key={`${card.id}:${step.id}`}
                className="min-w-0 rounded border border-cyan-100/10 bg-cyan-100/[0.035] px-2 py-1.5"
              >
                <div className="flex min-w-0 gap-2">
                  <span className="font-mono text-[10px] text-cyan-100/48">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-white/82">{step.title}</div>
                    <div className="mt-1 text-[11px] leading-4 text-white/58">{step.body}</div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <AtlasInstrumentInfoBlock label="scale" value={card.scaleInterpretation} />
            <AtlasInstrumentInfoBlock label="applicability" value={card.applicability} />
          </div>
          <div className="mt-2">
            <AtlasInstrumentInfoBlock label="explainer boundary" value={card.trustedBoundary} />
          </div>
        </div>
      </div>
    </div>
  );
}

import { AtlasInstrumentInfoBlock } from "./AtlasInstrumentUi";
import type { RelativityObservableBoundarySectionProps } from "./RelativityObservableBoundarySection";

export default function RelativityObservableBoundaryStatusSection({
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
}: RelativityObservableBoundarySectionProps) {
  return (
    <>
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

    </>
  );
}

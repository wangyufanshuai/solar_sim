import type { AtlasLegacyEvidenceDetailsV190 } from "./useAtlasDeferredEvidenceModules";

export function createAtlasLegacyRelativityPanelProps(
  details: AtlasLegacyEvidenceDetailsV190 | null,
) {
  if (!details) return null;
  return {
    horizonsCandidateLabSummary: details.atlasHorizonsCandidateLabSummary,
    plutoResidualIsolationSummary: details.atlasPlutoResidualIsolationSummary,
    outerSystemForceModelPreflightSummary: details.atlasOuterSystemForceModelPreflightSummary,
    outerSystemReferenceAdoptionSummary: details.atlasOuterSystemReferenceAdoptionSummary,
    horizonsCandidateScientificGateSummary: details.atlasHorizonsCandidateScientificGateSummary,
    strictHorizonsMigrationDryRunSummary: details.atlasStrictHorizonsMigrationDryRunSummary,
    strictHorizonsShadowMigrationGateSummary: details.atlasStrictHorizonsShadowMigrationGateSummary,
    defaultStrictHorizonsMigrationSummary: details.atlasDefaultStrictHorizonsMigrationSummary,
    horizonsProvenanceFreezeSummary: details.atlasHorizonsProvenanceFreezeSummary,
    offlineRuntimeBoundaryAuditSummary: details.atlasOfflineRuntimeBoundaryAuditSummary,
    scientificGateMaintenanceRunbookSummary: details.atlasScientificGateMaintenanceRunbookSummary,
    scientificGateReleaseEvidenceSummary: details.atlasScientificGateReleaseEvidenceSummary,
    browserCiStabilityLockSummary: details.atlasBrowserCiStabilityLockSummary,
    releaseArtifactManifestLockSummary: details.atlasReleaseArtifactManifestLockSummary,
    finalMaintenanceBaselineSummary: details.atlasFinalMaintenanceBaselineSummary,
    artPolishSummary: details.atlasArtPolishSummary,
    postEnhancementMaintenanceBaselineSummary: details.atlasPostEnhancementMaintenanceBaselineSummary,
    browserResourcePerformanceSummary: details.atlasBrowserResourcePerformanceSummary,
    maintenanceEvidenceIndexSummary: details.atlasMaintenanceEvidenceIndexSummary,
    presentationRuntimePerformanceSummary: details.atlasPresentationRuntimePerformanceSummary,
    browserAcceptanceRuntimeCostSummary: details.atlasBrowserAcceptanceRuntimeCostSummary,
    finalGaiaArtEnhancementSummary: details.atlasFinalGaiaArtEnhancementSummary,
    rcEvidenceClosureSummary: details.atlasRcEvidenceClosureSummary,
    interactionCatalogCompletionSummary: details.atlasInteractionCatalogCompletionSummary,
    interactionRepairLaunchUxSummary: details.atlasInteractionRepairLaunchUxSummary,
    interactionVisualQualitySummary: details.atlasInteractionVisualQualitySummary,
    criticalUiRelativityVisibilitySummary: details.atlasCriticalUiRelativityVisibilitySummary,
    cameraStellarCloseupSummary: details.atlasCameraStellarCloseupSummary,
    launchGameplayOpenRocketBridgeSummary: details.atlasLaunchGameplayOpenRocketBridgeSummary,
    scientificModelUpgradeContractSummary: details.atlasScientificModelUpgradeContractSummary,
  };
}

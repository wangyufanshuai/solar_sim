/* v250 Evidence Ledger domain: core. */
import type { GaiaCatalogSource } from "../../data/gaiaStarCatalog";
import type { AtlasPerformanceBudgetSummary, EvidenceClaim, EvidenceClaimGroup, EvidenceLedgerSummary, EvidenceLedgerVersion, SimulationDiagnostics } from "../simulationDiagnosticsTypes";
import { celestialCatalogClaim, gaiaCatalogClaim, galacticDynamicsClaim } from "./catalogClaims";
import { kerrStrongFieldClaim, numericalIntegrityGateClaim, relativityGuidedTourClaim, relativityObservableAtlasClaim, relativityObservableExplainerClaim, relativityVerificationChartsClaim, relativityVerificationReadabilityClaim } from "./kerrClaims";
import { accessibilityWorkbenchClaim, browserAcceptanceHarnessClaim, browserAcceptanceRuntimeCostLockClaim, browserCiStabilityLockClaim, browserResourcePerformanceLockClaim, criticalUiRelativityVisibilityLockClaim, finalMaintenanceBaselineClaim, finalProductProgramClaim, interactionCatalogCompletionLockClaim, interactionRepairLaunchUxLockClaim, launchGameplayOpenRocketBridgeLockClaim, launchSceneOpenRocketReplayLockClaim, maintenanceEvidenceIndexClaim, offlineStellarSearchCatalogV2LockClaim, performanceBudgetClaim, postEnhancementMaintenanceBaselineClaim, presentationRuntimePerformanceLockClaim, rcEvidenceClosureLockClaim, relativitySimulationOptimizationClaim, releaseArtifactManifestLockClaim, releaseCandidateGateClaim, runtimeSceneFocusPerformanceLockClaim, scientificPromotionV2Claim, visualIntegrationReleaseGateClaim } from "./productClaims";
import { ledgerStatus } from "./shared";
import { artPolishClaim, cameraStellarCloseupLockClaim, chineseDeepSpaceFidelityClaim, cinematicCloseupDirectorClaim, cinematicDeepSpaceBackdropClaim, cinematicDeepSpaceCameraClaim, cinematicKeyLightDirectorClaim, cinematicLightingClaim, cinematicPlanetaryArtDirectionClaim, cinematicVisualSystemClaim, closeupPresentationTruthClaim, closeupVisualFidelityClaim, finalGaiaArtEnhancementLockClaim, gaiaStarfieldEnhancementClaim, interactionVisualQualityLockClaim, planetaryColorGradingClaim, planetaryDepthLightingClaim, planetaryMaterialCompositionClaim, planetaryVisualFidelityClaim, referenceGradeSpaceArtClaim, sparseDeepSpaceDirectorClaim, universeSandboxReferenceBackdropClaim, visualLaunchPerformanceLockClaim } from "./visualClaims";
import { defaultStrictHorizonsMigrationClaim, frwCosmologyClaim, horizonsCandidateLabClaim, horizonsCandidateScientificGateClaim, horizonsGateClosureAuditClaim, horizonsProvenanceFreezeClaim, horizonsResidualDecompositionClaim, offlineRuntimeBoundaryAuditClaim, outerSystemForceModelPreflightClaim, outerSystemReferenceAdoptionClaim, physicsBenchmarkReleaseGateClaim, physicsGateSplitClaim, plutoResidualIsolationClaim, releaseReadinessDocumentationClaim, scientificGateMaintenanceRunbookClaim, scientificGatePreflightClaim, scientificGateReleaseEvidenceClaim, scientificModelUpgradeContractClaim, solarEihClaim, strictHorizonsMigrationDryRunClaim, strictHorizonsShadowMigrationGateClaim, weakFieldClaim } from "./weakFieldClaims";
import { missionCapsuleClaim, observatoryDeckClaim, orbitVisualClaim, scientificReportClaim, validationConsoleClaim } from "./workbenchClaims";

export const EVIDENCE_LEDGER_VERSION: EvidenceLedgerVersion = "v21-claim-passports";


export type CreateEvidenceLedgerSummaryArgs = {
  diagnostics: SimulationDiagnostics | null;
  orbitAtlasProfile: string;
  orbitAtlasRenderer: string;
  gaiaCatalogSource: GaiaCatalogSource;
  orbitAtlasReady?: boolean;
  presentationMode?: string;
  performanceBudgetSummary?: AtlasPerformanceBudgetSummary | null;
};


export const REQUIRED_GROUPS: readonly EvidenceClaimGroup[] = [
  "orbit-visual-layer",
  "mission-capsule-reproducibility",
  "scientific-report-dossier",
  "validation-console-readiness",
  "observatory-deck-workbench",
  "performance-budget-readiness",
  "release-candidate-gate",
  "relativity-observable-atlas",
  "relativity-observable-explainer",
  "relativity-guided-tour",
  "relativity-verification-readability",
  "relativity-verification-charts",
  "physics-benchmark-release-gate",
  "horizons-gate-closure-audit",
  "physics-gate-split",
  "release-readiness-documentation",
  "scientific-gate-preflight",
  "horizons-residual-decomposition",
  "horizons-candidate-lab",
  "pluto-residual-isolation",
  "outer-system-force-model-preflight",
  "outer-system-reference-adoption",
  "horizons-candidate-scientific-gate",
  "strict-horizons-migration-dry-run",
  "strict-horizons-shadow-migration-gate",
  "default-strict-horizons-migration",
  "horizons-provenance-freeze",
  "offline-runtime-boundary-audit",
  "scientific-gate-maintenance-runbook",
  "scientific-gate-release-evidence",
  "browser-ci-stability-lock",
  "release-artifact-manifest-lock",
  "final-maintenance-baseline",
  "gaia-starfield-enhancement",
  "relativity-simulation-optimization",
  "art-polish",
  "post-enhancement-maintenance-baseline",
  "browser-resource-performance-lock",
  "maintenance-evidence-index",
  "presentation-runtime-performance-lock",
  "browser-acceptance-runtime-cost-lock",
  "final-gaia-art-enhancement-lock",
  "release-candidate-evidence-closure-lock",
  "interaction-catalog-completion-lock",
  "interaction-repair-launch-ux-lock",
  "interaction-visual-quality-lock",
  "critical-ui-relativity-visibility-lock",
  "camera-stellar-closeup-lock",
  "launch-gameplay-openrocket-bridge-lock",
  "scientific-model-upgrade-contract",
  "visual-launch-performance-lock",
  "browser-acceptance-harness",
  "accessibility-workbench",
  "cinematic-visual-system",
  "planetary-visual-fidelity",
  "cinematic-lighting",
  "chinese-deep-space-fidelity",
  "cinematic-deep-space-camera",
  "universe-sandbox-reference-backdrop",
  "reference-grade-space-art",
  "planetary-material-composition",
  "cinematic-closeup-director",
  "cinematic-key-light-director",
  "planetary-depth-lighting",
  "planetary-color-grading",
  "numerical-integrity-gate",
  "cinematic-planetary-art-direction",
  "cinematic-deep-space-backdrop",
  "sparse-deep-space-director",
  "closeup-presentation-truth",
  "closeup-visual-fidelity",
  "solar-eih-1pn",
  "gr-weak-field",
  "gaia-catalog",
  "celestial-catalog-atlas",
  "galactic-dynamics",
  "frw-cosmology",
  "kerr-strong-field",
];


export function createEvidenceLedgerSummary({
  diagnostics,
  orbitAtlasProfile,
  orbitAtlasRenderer,
  gaiaCatalogSource,
  orbitAtlasReady = false,
  presentationMode = "sandbox",
  performanceBudgetSummary = null,
}: CreateEvidenceLedgerSummaryArgs): EvidenceLedgerSummary {
  const activeGaiaSource = diagnostics?.gaiaCatalogSource ?? gaiaCatalogSource;
  const claims: EvidenceClaim[] = [
    orbitVisualClaim({
      orbitAtlasProfile,
      orbitAtlasRenderer,
      orbitAtlasReady,
      presentationMode,
    }),
    missionCapsuleClaim(),
    scientificReportClaim(),
    validationConsoleClaim(),
    observatoryDeckClaim(),
    performanceBudgetClaim(performanceBudgetSummary),
    releaseCandidateGateClaim(),
    relativityObservableAtlasClaim(diagnostics),
    relativityObservableExplainerClaim(diagnostics),
    relativityGuidedTourClaim(diagnostics),
    relativityVerificationReadabilityClaim(diagnostics),
    relativityVerificationChartsClaim(diagnostics),
    physicsBenchmarkReleaseGateClaim(diagnostics),
    horizonsGateClosureAuditClaim(diagnostics),
    physicsGateSplitClaim(diagnostics),
    releaseReadinessDocumentationClaim(diagnostics),
    scientificGatePreflightClaim(diagnostics),
    horizonsResidualDecompositionClaim(diagnostics),
    horizonsCandidateLabClaim(),
    plutoResidualIsolationClaim(),
    outerSystemForceModelPreflightClaim(),
    outerSystemReferenceAdoptionClaim(),
    horizonsCandidateScientificGateClaim(),
    strictHorizonsMigrationDryRunClaim(),
    strictHorizonsShadowMigrationGateClaim(),
    defaultStrictHorizonsMigrationClaim(),
    horizonsProvenanceFreezeClaim(),
    offlineRuntimeBoundaryAuditClaim(),
    scientificGateMaintenanceRunbookClaim(),
    scientificGateReleaseEvidenceClaim(),
    browserCiStabilityLockClaim(),
    releaseArtifactManifestLockClaim(),
    finalMaintenanceBaselineClaim(),
    gaiaStarfieldEnhancementClaim(),
    relativitySimulationOptimizationClaim(),
    artPolishClaim(),
    postEnhancementMaintenanceBaselineClaim(),
    browserResourcePerformanceLockClaim(),
    maintenanceEvidenceIndexClaim(),
    presentationRuntimePerformanceLockClaim(),
    browserAcceptanceRuntimeCostLockClaim(),
    finalGaiaArtEnhancementLockClaim(),
    rcEvidenceClosureLockClaim(),
    interactionCatalogCompletionLockClaim(),
    interactionRepairLaunchUxLockClaim(),
    interactionVisualQualityLockClaim(),
    criticalUiRelativityVisibilityLockClaim(),
    cameraStellarCloseupLockClaim(),
    launchGameplayOpenRocketBridgeLockClaim(),
    scientificModelUpgradeContractClaim(),
    visualLaunchPerformanceLockClaim(),
    runtimeSceneFocusPerformanceLockClaim(),
    offlineStellarSearchCatalogV2LockClaim(),
    launchSceneOpenRocketReplayLockClaim(),
    visualIntegrationReleaseGateClaim(),
    scientificPromotionV2Claim(),
    finalProductProgramClaim(),
    browserAcceptanceHarnessClaim(),
    accessibilityWorkbenchClaim(),
    cinematicVisualSystemClaim(),
    planetaryVisualFidelityClaim(),
    cinematicLightingClaim(),
    chineseDeepSpaceFidelityClaim(),
    cinematicDeepSpaceCameraClaim(),
    universeSandboxReferenceBackdropClaim(),
    referenceGradeSpaceArtClaim(),
    planetaryMaterialCompositionClaim(),
    cinematicCloseupDirectorClaim(),
    cinematicKeyLightDirectorClaim(),
    planetaryDepthLightingClaim(),
    planetaryColorGradingClaim(),
    numericalIntegrityGateClaim(diagnostics),
    cinematicPlanetaryArtDirectionClaim(),
    cinematicDeepSpaceBackdropClaim(),
    sparseDeepSpaceDirectorClaim(),
    closeupPresentationTruthClaim(),
    closeupVisualFidelityClaim(),
    solarEihClaim(diagnostics),
    weakFieldClaim(diagnostics),
    gaiaCatalogClaim(activeGaiaSource),
    celestialCatalogClaim(),
    galacticDynamicsClaim(diagnostics),
    frwCosmologyClaim(diagnostics),
    kerrStrongFieldClaim(diagnostics),
  ];
  const failedCount = claims.filter((claim) => claim.status === "failed").length;
  const readyCount = claims.filter((claim) => claim.status === "ready").length;
  return {
    version: EVIDENCE_LEDGER_VERSION,
    status: ledgerStatus(claims),
    claimCount: claims.length,
    readyCount,
    failedCount,
    groups: REQUIRED_GROUPS,
    claims,
  };
}


export function selectEvidenceClaim(
  summary: EvidenceLedgerSummary,
  claimId: string | null | undefined,
): EvidenceClaim | null {
  return summary.claims.find((claim) => claim.id === claimId) ?? summary.claims[0] ?? null;
}

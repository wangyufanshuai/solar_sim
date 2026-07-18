import type { GaiaCatalogSource } from "../data/gaiaStarCatalog";
import {
  CELESTIAL_DEEP_SKY_NAVIGATION_VERSION,
  CELESTIAL_OBJECT_PASSPORT_VERSION,
  createCelestialCatalogSummary,
} from "./celestialCatalog";
import { ATLAS_PERFORMANCE_BUDGET_VERSION } from "./atlasPerformanceBudget";
import {
  ATLAS_BROWSER_ACCEPTANCE_VERSION,
  createAtlasBrowserAcceptanceSummary,
} from "./atlasBrowserAcceptance";
import {
  ATLAS_WORKBENCH_ACCESSIBILITY_VERSION,
  createAtlasWorkbenchAccessibilitySummary,
} from "./atlasWorkbenchAccessibility";
import {
  ATLAS_CINEMATIC_WORKBENCH_VERSION,
  createAtlasCinematicWorkbenchSummary,
} from "./atlasCinematicWorkbench";
import {
  ATLAS_PLANETARY_VISUAL_FIDELITY_VERSION,
  createAtlasPlanetaryVisualFidelitySummary,
} from "./atlasPlanetaryVisualFidelity";
import {
  ATLAS_CINEMATIC_LIGHTING_COMPOSITION_VERSION,
  createAtlasCinematicLightingCompositionSummary,
} from "./atlasCinematicLightingComposition";
import {
  ATLAS_CHINESE_DEEP_SPACE_FIDELITY_VERSION,
  createAtlasChineseDeepSpaceFidelitySummary,
} from "./atlasChineseDeepSpaceFidelity";
import {
  ATLAS_CINEMATIC_DEEP_SPACE_CAMERA_VERSION,
  createAtlasCinematicDeepSpaceCameraSummary,
} from "./atlasCinematicDeepSpaceCamera";
import {
  ATLAS_UNIVERSE_SANDBOX_REFERENCE_BACKDROP_VERSION,
  createAtlasUniverseSandboxReferenceBackdropSummary,
} from "./atlasUniverseSandboxReferenceBackdrop";
import {
  ATLAS_REFERENCE_GRADE_SPACE_ART_VERSION,
  createAtlasReferenceGradeSpaceArtSummary,
} from "./atlasReferenceGradeSpaceArt";
import {
  ATLAS_PLANETARY_MATERIAL_COMPOSITION_VERSION,
  createAtlasPlanetaryMaterialCompositionSummary,
} from "./atlasPlanetaryMaterialComposition";
import {
  ATLAS_CINEMATIC_CLOSEUP_DIRECTOR_VERSION,
  createAtlasCinematicCloseupDirectorSummary,
} from "./atlasCinematicCloseupDirector";
import {
  ATLAS_CINEMATIC_KEY_LIGHT_DIRECTOR_VERSION,
  createAtlasCinematicKeyLightDirectorSummary,
} from "./atlasCinematicKeyLightDirector";
import {
  ATLAS_PLANETARY_DEPTH_LIGHTING_VERSION,
  createAtlasPlanetaryDepthLightingSummary,
} from "./atlasPlanetaryDepthLighting";
import {
  ATLAS_PLANETARY_COLOR_GRADING_VERSION,
  createAtlasPlanetaryColorGradingSummary,
} from "./atlasPlanetaryColorGrading";
import {
  ATLAS_NUMERICAL_INTEGRITY_VERSION,
  createAtlasNumericalIntegritySummary,
} from "./atlasNumericalIntegrity";
import {
  ATLAS_CINEMATIC_PLANETARY_ART_DIRECTION_VERSION,
  createAtlasCinematicPlanetaryArtDirectionSummary,
} from "./atlasCinematicPlanetaryArtDirection";
import {
  ATLAS_CINEMATIC_DEEP_SPACE_BACKDROP_VERSION,
  createAtlasCinematicDeepSpaceBackdropSummary,
} from "./atlasCinematicDeepSpaceBackdrop";
import {
  ATLAS_SPARSE_DEEP_SPACE_DIRECTOR_VERSION,
  createAtlasSparseDeepSpaceDirectorSummary,
} from "./atlasSparseDeepSpaceDirector";
import {
  ATLAS_CLOSEUP_PRESENTATION_TRUTH_VERSION,
  createAtlasCloseupPresentationTruthSummary,
} from "./atlasCloseupPresentationTruth";
import {
  ATLAS_CLOSEUP_VISUAL_FIDELITY_VERSION,
  createAtlasCloseupVisualFidelitySummary,
} from "./atlasCloseupVisualFidelity";
import { ATLAS_RELEASE_GATE_VERSION } from "./atlasReleaseGate";
import {
  RELATIVITY_OBSERVABLE_ATLAS_VERSION,
  RELATIVITY_OBSERVABLE_EXPLAINER_VERSION,
  createRelativityObservableAtlasSummary,
  createRelativityObservableExplainerSummary,
} from "./relativityObservableAtlas";
import {
  RELATIVITY_GUIDED_TOUR_VERSION,
  createRelativityGuidedTourSummary,
} from "./relativityGuidedTour";
import {
  KERR_RELATIVITY_STUDIO_VERSION,
  createKerrRelativityStudioSummary,
} from "./kerrRelativityStudio";
import {
  ATLAS_RELATIVITY_VERIFICATION_VERSION,
  createAtlasRelativityVerificationSummary,
} from "./atlasRelativityVerification";
import {
  ATLAS_RELATIVITY_CHART_VERSION,
  createAtlasRelativityChartSummary,
} from "./atlasRelativityCharts";
import {
  ATLAS_PHYSICS_BENCHMARK_GATE_VERSION,
  createAtlasPhysicsBenchmarkGateSummary,
} from "./atlasPhysicsBenchmarkGate";
import {
  ATLAS_HORIZONS_GATE_AUDIT_VERSION,
  createAtlasHorizonsGateAuditSummary,
} from "./atlasHorizonsGateAudit";
import {
  ATLAS_PHYSICS_GATE_SPLIT_VERSION,
  createAtlasPhysicsGateSplitSummary,
} from "./atlasPhysicsGateSplit";
import {
  ATLAS_RELEASE_READINESS_VERSION,
  createAtlasReleaseReadinessSummary,
} from "./atlasReleaseReadiness";
import {
  ATLAS_SCIENTIFIC_GATE_PREFLIGHT_VERSION,
  createAtlasScientificGatePreflightSummary,
} from "./atlasScientificGatePreflight";
import {
  ATLAS_HORIZONS_RESIDUAL_DECOMPOSITION_VERSION,
  createAtlasHorizonsResidualDecompositionSummary,
} from "./atlasHorizonsResidualDecomposition";
import {
  ATLAS_HORIZONS_CANDIDATE_LAB_VERSION,
  createAtlasHorizonsCandidateLabSummary,
} from "./atlasHorizonsCandidateLab";
import {
  ATLAS_PLUTO_RESIDUAL_ISOLATION_VERSION,
  createAtlasPlutoResidualIsolationSummary,
} from "./atlasPlutoResidualIsolation";
import {
  ATLAS_OUTER_SYSTEM_FORCE_MODEL_PREFLIGHT_VERSION,
  createAtlasOuterSystemForceModelPreflightSummary,
} from "./atlasOuterSystemForceModelPreflight";
import {
  ATLAS_OUTER_SYSTEM_REFERENCE_ADOPTION_VERSION,
  createAtlasOuterSystemReferenceAdoptionSummary,
} from "./atlasOuterSystemReferenceAdoption";
import {
  ATLAS_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_VERSION,
  createAtlasHorizonsCandidateScientificGateSummary,
} from "./atlasHorizonsCandidateScientificGate";
import {
  ATLAS_STRICT_HORIZONS_MIGRATION_DRY_RUN_VERSION,
  createAtlasStrictHorizonsMigrationDryRunSummary,
} from "./atlasStrictHorizonsMigrationDryRun";
import {
  ATLAS_STRICT_HORIZONS_SHADOW_MIGRATION_VERSION,
  createAtlasStrictHorizonsShadowMigrationGateSummary,
} from "./atlasStrictHorizonsShadowMigrationGate";
import {
  ATLAS_DEFAULT_STRICT_HORIZONS_MIGRATION_VERSION,
  createAtlasDefaultStrictHorizonsMigrationSummary,
} from "./atlasDefaultStrictHorizonsMigration";
import {
  ATLAS_HORIZONS_PROVENANCE_FREEZE_VERSION,
  createAtlasHorizonsProvenanceFreezeSummary,
} from "./atlasHorizonsProvenanceFreeze";
import {
  ATLAS_OFFLINE_RUNTIME_BOUNDARY_AUDIT_VERSION,
  createAtlasOfflineRuntimeBoundaryAuditSummary,
} from "./atlasOfflineRuntimeBoundaryAudit";
import {
  ATLAS_SCIENTIFIC_GATE_MAINTENANCE_RUNBOOK_VERSION,
  createAtlasScientificGateMaintenanceRunbookSummary,
} from "./atlasScientificGateMaintenanceRunbook";
import {
  ATLAS_SCIENTIFIC_GATE_RELEASE_EVIDENCE_VERSION,
  createAtlasScientificGateReleaseEvidenceSummary,
} from "./atlasScientificGateReleaseEvidence";
import {
  ATLAS_BROWSER_CI_STABILITY_LOCK_VERSION,
  createAtlasBrowserCiStabilityLockSummary,
} from "./atlasBrowserCiStabilityLock";
import {
  ATLAS_RELEASE_ARTIFACT_MANIFEST_LOCK_VERSION,
  createAtlasReleaseArtifactManifestLockSummary,
} from "./atlasReleaseArtifactManifestLock";
import {
  ATLAS_FINAL_MAINTENANCE_BASELINE_VERSION,
  createAtlasFinalMaintenanceBaselineSummary,
} from "./atlasFinalMaintenanceBaseline";
import {
  ATLAS_GAIA_STARFIELD_ENHANCEMENT_VERSION,
  createAtlasGaiaStarfieldEnhancementSummary,
} from "./atlasGaiaStarfieldEnhancement";
import {
  ATLAS_RELATIVITY_SIMULATION_OPTIMIZATION_VERSION,
  createAtlasRelativitySimulationOptimizationSummary,
} from "./atlasRelativitySimulationOptimization";
import {
  ATLAS_ART_POLISH_VERSION,
  createAtlasArtPolishSummary,
} from "./atlasArtPolish";
import {
  ATLAS_POST_ENHANCEMENT_BASELINE_VERSION,
  createAtlasPostEnhancementMaintenanceBaselineSummary,
} from "./atlasPostEnhancementMaintenanceBaseline";
import {
  ATLAS_BROWSER_RESOURCE_PERFORMANCE_VERSION,
  createAtlasBrowserResourcePerformanceSummary,
} from "./atlasBrowserResourcePerformanceLock";
import {
  ATLAS_MAINTENANCE_EVIDENCE_INDEX_VERSION,
  createAtlasMaintenanceEvidenceIndexSummary,
} from "./atlasMaintenanceEvidenceIndex";
import {
  ATLAS_PRESENTATION_RUNTIME_PERFORMANCE_VERSION,
  createAtlasPresentationRuntimePerformanceSummary,
} from "./atlasPresentationRuntimePerformanceLock";
import {
  ATLAS_BROWSER_ACCEPTANCE_RUNTIME_COST_VERSION,
  createAtlasBrowserAcceptanceRuntimeCostSummary,
} from "./atlasBrowserAcceptanceRuntimeCostLock";
import {
  ATLAS_FINAL_GAIA_ART_ENHANCEMENT_VERSION,
  createAtlasFinalGaiaArtEnhancementSummary,
} from "./atlasFinalGaiaArtEnhancementLock";
import {
  ATLAS_RC_EVIDENCE_CLOSURE_VERSION,
  createAtlasRcEvidenceClosureSummary,
} from "./atlasRcEvidenceClosureLock";
import {
  ATLAS_INTERACTION_CATALOG_COMPLETION_VERSION,
  createAtlasInteractionCatalogCompletionSummary,
} from "./atlasInteractionCatalogCompletionLock";
import {
  ATLAS_INTERACTION_REPAIR_LAUNCH_UX_VERSION,
  createAtlasInteractionRepairLaunchUxSummary,
} from "./atlasInteractionRepairLaunchUxLock";
import {
  ATLAS_INTERACTION_VISUAL_QUALITY_VERSION,
  createAtlasInteractionVisualQualitySummary,
} from "./atlasInteractionVisualQualityLock";
import {
  ATLAS_CRITICAL_UI_RELATIVITY_VISIBILITY_VERSION,
  createAtlasCriticalUiRelativityVisibilitySummary,
} from "./atlasCriticalUiRelativityVisibilityLock";
import {
  ATLAS_CAMERA_STELLAR_CLOSEUP_VERSION,
  createAtlasCameraStellarCloseupSummary,
} from "./atlasCameraStellarCloseupLock";
import {
  ATLAS_LAUNCH_GAMEPLAY_OPENROCKET_BRIDGE_VERSION,
  createAtlasLaunchGameplayOpenRocketBridgeSummary,
} from "./atlasLaunchGameplayOpenRocketBridgeLock";
import {
  ATLAS_SCIENTIFIC_MODEL_UPGRADE_CONTRACT_VERSION,
  createAtlasScientificModelUpgradeContractSummary,
} from "./atlasScientificModelUpgradeContract";
import {
  ATLAS_VISUAL_LAUNCH_PERFORMANCE_VERSION,
  createAtlasVisualLaunchPerformanceSummary,
} from "./atlasVisualLaunchPerformanceLock";
import {
  ATLAS_RUNTIME_SCENE_FOCUS_PERFORMANCE_VERSION,
  createAtlasRuntimeSceneFocusSummary,
} from "./atlasRuntimeSceneFocusPerformance";
import {
  ATLAS_OFFLINE_STELLAR_SEARCH_CATALOG_V2_VERSION,
  createAtlasOfflineStellarSearchCatalogV2Summary,
} from "./atlasOfflineStellarSearchCatalogV2";
import {
  ATLAS_LAUNCH_SCENE_OPENROCKET_REPLAY_VERSION,
  createAtlasLaunchSceneOpenRocketReplaySummary,
} from "./atlasLaunchSceneOpenRocketReplay";
import {
  ATLAS_VISUAL_INTEGRATION_RELEASE_VERSION,
  createAtlasVisualIntegrationReleaseSummary,
} from "./atlasVisualIntegrationRelease";
import {
  ATLAS_SCIENTIFIC_PROMOTION_V2_VERSION,
  createAtlasScientificPromotionV2Summary,
} from "./atlasScientificPromotionV2";
import {
  ATLAS_ONE_RELEASE_VERSION,
  createAtlasFinalReleaseSummary,
  createScientificPromotionEvidenceV3,
} from "./atlasReleaseProgram";
import type {
  AtlasPerformanceBudgetSummary,
  EvidenceClaim,
  EvidenceClaimConfidence,
  EvidenceClaimGroup,
  EvidenceClaimPassport,
  EvidenceClaimStatus,
  EvidenceLedgerSummary,
  EvidenceLedgerVersion,
  EvidencePassportFormula,
  EvidencePassportMetric,
  EvidenceRelatedView,
  RelativityConfidence,
  ResearchConfidence,
  SimulationDiagnostics,
} from "./simulationDiagnosticsTypes";

export const EVIDENCE_LEDGER_VERSION: EvidenceLedgerVersion = "v21-claim-passports";

type EvidenceClaimWithoutPassport = Omit<EvidenceClaim, "passport">;

export type CreateEvidenceLedgerSummaryArgs = {
  diagnostics: SimulationDiagnostics | null;
  orbitAtlasProfile: string;
  orbitAtlasRenderer: string;
  gaiaCatalogSource: GaiaCatalogSource;
  orbitAtlasReady?: boolean;
  presentationMode?: string;
  performanceBudgetSummary?: AtlasPerformanceBudgetSummary | null;
};

const REQUIRED_GROUPS: readonly EvidenceClaimGroup[] = [
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

function orbitVisualClaim(args: {
  orbitAtlasProfile: string;
  orbitAtlasRenderer: string;
  orbitAtlasReady: boolean;
  presentationMode: string;
}): EvidenceClaim {
  const claim: EvidenceClaimWithoutPassport = {
    id: "orbit-visual-profile",
    group: "orbit-visual-layer",
    title: "Orbit Atlas visual layer",
    status: "informational",
    confidence: "visual",
    source: "Orbit Atlas presentation constants",
    model: `${args.orbitAtlasProfile} / ${args.orbitAtlasRenderer}`,
    metric: `${args.presentationMode}; atlas readiness ${args.orbitAtlasReady ? "ready" : "loading/fallback"}`,
    error: "No scientific error budget; this is the cold-body presentation renderer.",
    boundary: "Visual guide only. Live dynamics, validation diagnostics, and Kerr geodesics stay separate.",
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "Orbit Atlas presentation constants",
        `profile=${args.orbitAtlasProfile}`,
        `renderer=${args.orbitAtlasRenderer}`,
      ],
      method: "Cold-body Universe Sandbox style renderer; it presents orbits and layers without becoming the dynamics source.",
      metrics: [
        metric("presentation-mode", "Presentation mode", args.presentationMode, claim.status),
        metric("profile", "Profile / renderer", `${args.orbitAtlasProfile} / ${args.orbitAtlasRenderer}`, claim.status),
        metric("readiness", "Atlas readiness", args.orbitAtlasReady ? "ready" : "loading/fallback", claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: this layer is deterministic UI presentation, while scientific validation is reported by separate diagnostics.",
      assumptions: [
        "Orbit Atlas v12 remains the presentation profile.",
        "The cold-body renderer is allowed to simplify appearance for legibility.",
      ],
      limitations: [
        "No physical error budget is assigned to the visual renderer.",
        "It is not a replacement for live N-body state, Horizons validation, Gaia catalog rows, or Kerr geodesic tracks.",
      ],
      relatedViews: ["evidence-ledger", "orbit-analysis", "telemetry"],
    }),
  );
}

function missionCapsuleClaim(): EvidenceClaim {
  const claim: EvidenceClaimWithoutPassport = {
    id: "mission-capsule-reproducibility",
    group: "mission-capsule-reproducibility",
    title: "Mission Capsule reproducibility",
    status: "informational",
    confidence: "formula-checked",
    source: "Atlas Mission Capsule v27 local URL hash / JSON export",
    model: "Deterministic UI/session provenance capsule",
    metric: "Stores presentation, layer toggles, selections, pins/recents, workflow context, and Kerr Lab UI parameters.",
    error: "No physical error budget; capsule restore is UI/session state reproducibility only.",
    boundary: "Not a simulation data archive, not a Horizons refresh, not telemetry storage, and not a scientific publication archive.",
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "Mission Hub v26 local session state",
        "Mission Capsule v27 deterministic serializer/parser",
        "URL hash payload or exported JSON file",
        "Evidence Ledger provenance statement",
      ],
      method:
        "Serialize only compact, reproducible Atlas UI state into a local JSON capsule and restore it against the current Navigator, Evidence, Workflow, Catalog, and Kerr Lab indexes.",
      formulas: [
        formula(
          "capsule-round-trip",
          "Deterministic capsule round trip",
          "restore(parse(serialize(capsule))) -> UI/session state",
          "stable ids, layer toggles, selected panels, Mission Hub pins/recents, Kerr Lab controls",
          "Local browser reproducibility for Atlas navigation and provenance, not physics replay.",
        ),
      ],
      metrics: [
        metric("capsule-version", "Capsule version", "v27-mission-capsules", "informational"),
        metric("saved-state", "Saved state categories", "presentation, view settings, selections, pins, recents, workflow, Kerr Lab UI", "informational"),
        metric("excluded-state", "Excluded state", "physics buffers, ephemeris arrays, telemetry samples, screenshots, large catalogs", "informational"),
        metric("restore-boundary", "Restore boundary", "readable warnings for invalid or stale ids", "informational"),
      ],
      confidenceRationale:
        "Formula-checked at the product layer: capsule round trips are deterministic and restore is validated against local stable indexes before applying UI state.",
      assumptions: [
        "Capsule ids refer to the same local Atlas build or a compatible future build.",
        "URL hash payloads remain browser-local and are never uploaded by the app.",
        "JSON export is the fallback when a URL hash would be impractically large.",
      ],
      limitations: [
        "Does not store live N-body buffers, ephemeris arrays, telemetry series, or screenshots.",
        "Does not refresh external validation data.",
        "Does not guarantee scientific archival completeness.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}

function scientificReportClaim(): EvidenceClaim {
  const claim: EvidenceClaimWithoutPassport = {
    id: "scientific-report-dossier",
    group: "scientific-report-dossier",
    title: "Report Studio evidence dossier",
    status: "informational",
    confidence: "formula-checked",
    source: "Atlas Report Studio v29 / Scientific Report v28 exporter",
    model: "Template-controlled deterministic evidence dossier over Mission Capsule, Mission Hub and Evidence Ledger",
    metric:
      "Exports selected sections as Markdown, JSON or self-contained printable HTML.",
    error: "No physical error budget; report is provenance/session documentation only.",
    boundary:
      "Not a scientific publication archive, not telemetry export, not ephemeris storage, not PDF generation, and not an external publishing pipeline.",
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "Evidence Ledger v21 claim passports",
        "Object Passport v23 selected catalog target",
        "Mission Hub v26 session context",
        "Mission Capsule v27 reproducible UI state",
        "Scientific Report v28 summary serializer",
        "Report Studio v29 template and section controls",
      ],
      method:
        "Create a deterministic report summary from local Atlas provenance surfaces, apply a fixed template/section selection, then serialize it as readable Markdown, machine-readable JSON or self-contained printable HTML.",
      formulas: [
        formula(
          "report-serialization",
          "Deterministic report export",
          "report = serialize(template, sections, createReport(capsule, missionHub, evidence, object, workflow, kerr))",
          "Template id, included section ids, Mission Capsule, Mission Hub summary, Evidence Ledger summary, selected Object Passport, Workflow context, Kerr Lab parameters",
          "UI/session and evidence provenance only; no physics replay or data archival claim.",
        ),
      ],
      metrics: [
        metric("report-version", "Report version", "v28-scientific-report", "informational"),
        metric("studio-version", "Studio version", "v29-report-studio", "informational"),
        metric("export-formats", "Export formats", "Markdown, JSON and self-contained printable HTML", "informational"),
        metric(
          "templates",
          "Templates",
          "mission-dossier, evidence-audit, object-brief, relativity-lab-brief, catalog-provenance",
          "informational",
        ),
        metric(
          "included-surfaces",
          "Included surfaces",
          "Mission Capsule, Mission Hub, Evidence Ledger, Object Passport, Workflows, Kerr Lab",
          "informational",
        ),
        metric(
          "excluded-state",
          "Excluded state",
          "physics buffers, telemetry samples, ephemeris arrays, screenshots, large catalog rows",
          "informational",
        ),
      ],
      confidenceRationale:
        "Formula-checked at the product layer: the report is generated by pure deterministic helpers from existing local provenance summaries.",
      assumptions: [
        "The current Atlas build exposes stable local ids for claims, objects, workflows and panels.",
        "Markdown, JSON and printable HTML exports are intended for review and reproducible provenance, not publication-grade archives.",
      ],
      limitations: [
        "Does not store live N-body buffers, ephemeris arrays, telemetry series, screenshots or full catalog rows.",
        "Does not refresh JPL Horizons, Gaia, Planck, SIMBAD or VizieR data.",
        "Does not produce PDF in v29.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}

function validationConsoleClaim(): EvidenceClaim {
  const claim: EvidenceClaimWithoutPassport = {
    id: "validation-console-readiness",
    group: "validation-console-readiness",
    title: "Validation Console trust matrix",
    status: "informational",
    confidence: "formula-checked",
    source: "Atlas Validation Console v30 local status matrix",
    model: "Read-only aggregation of Evidence Ledger, Mission Hub, Mission Capsule, Report Studio, Navigator and Workflows",
    metric:
      "Displays ready, pending, failed and informational domains with blocker/warning/info issue counts.",
    error: "No physical error budget; the console summarizes current local provenance state only.",
    boundary:
      "Not a scientific accuracy score, not a certification system, not an online validation service, and not a new physics model.",
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "Evidence Ledger v21 claim passports",
        "Mission Hub v26 current context",
        "Mission Capsule v27 restore summary",
        "Report Studio v29 template state",
        "Navigator v24 and Workflows v25 local indexes",
        "Validation Console v30 status matrix",
      ],
      method:
        "Aggregate existing local provenance summaries into a conservative status matrix and issue list without assigning a numerical trust score.",
      formulas: [
        formula(
          "status-matrix",
          "Conservative readiness matrix",
          "status = failed if any domain failed; else pending if any domain pending; else ready/informational",
          "Evidence claims, capsule warnings, report section state, navigator/workflow availability and current UI context",
          "Product readiness/provenance review only; not scientific accuracy scoring.",
        ),
      ],
      metrics: [
        metric("console-version", "Console version", "v30-validation-console", "informational"),
        metric("status-model", "Status model", "ready / pending / failed / informational", "informational"),
        metric("issue-model", "Issue model", "blocker / warning / info", "informational"),
        metric("trust-score", "Trust score", "not generated", "informational"),
      ],
      confidenceRationale:
        "Formula-checked at the product layer: the console derives counts and issues from deterministic local summaries and intentionally avoids a single trust score.",
      assumptions: [
        "The console reads the current local Atlas session state.",
        "Evidence Ledger claim ids, Navigator item ids and Workflow ids are stable within the build.",
      ],
      limitations: [
        "Does not rerun JPL Horizons, Gaia, Planck, FRW or Kerr validation.",
        "Does not fetch online data or certify scientific publication readiness.",
        "Does not change solar-system dynamics or Kerr geodesic integration.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}

function observatoryDeckClaim(): EvidenceClaim {
  const claim: EvidenceClaimWithoutPassport = {
    id: "observatory-deck-workbench",
    group: "observatory-deck-workbench",
    title: "Atlas Observatory Deck workbench",
    status: "informational",
    confidence: "formula-checked",
    source: "Atlas Observatory Deck v31 local control workbench",
    model:
      "Four-zone UI orchestration over Mission Hub, Validation Console, Workflows, Report Studio and Evidence Ledger",
    metric:
      "Displays Current target, Trust matrix, Mission path and Report/export zones with existing Navigator actions.",
    error:
      "No physical error budget; Observatory Deck summarizes local UI/provenance state only.",
    boundary:
      "Not a new validation run, not online search, not a physics model, not an N-body body creator, and not a replacement for the underlying panels.",
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "Navigator v24 action index",
        "Workflows v25 guided mission paths",
        "Mission Hub v26 session memory",
        "Mission Capsule v27 restore state",
        "Report Studio v29 export state",
        "Validation Console v30 status matrix",
        "Observatory Deck v31 four-zone control workbench",
      ],
      method:
        "Aggregate existing local Atlas summaries into four deterministic workbench zones and route every button through existing Navigator, Workflow or panel action handlers.",
      formulas: [
        formula(
          "deck-zones",
          "Deterministic four-zone deck",
          "deck = zones(currentTarget, trustMatrix, missionPath, reportExport)",
          "Mission Hub summary, Validation Console summary, Report Studio summary, Navigator index, Workflow summary, Evidence Ledger summary, selected ids, Kerr Lab UI parameters",
          "UI orchestration and provenance review only; no new physics, data download or validation refresh.",
        ),
      ],
      metrics: [
        metric("deck-version", "Deck version", "v31-observatory-deck", "informational"),
        metric("zone-count", "Workbench zones", "4: target / trust / mission / report", "informational"),
        metric("action-routing", "Action routing", "Navigator and Workflow executors reused", "informational"),
        metric(
          "included-surfaces",
          "Included surfaces",
          "Mission Hub, Validation Console, Report Studio, Workflows, Evidence Ledger, Kerr Lab UI parameters",
          "informational",
        ),
        metric(
          "excluded-behavior",
          "Excluded behavior",
          "no physics mutation, online validation, catalog download, body creation, trust score or default screen takeover",
          "informational",
        ),
      ],
      confidenceRationale:
        "Formula-checked at the product layer: the deck is generated by pure deterministic aggregation and intentionally reuses existing action routers.",
      assumptions: [
        "Navigator item ids, workflow ids and evidence claim ids stay stable within the current build.",
        "The deck is opened explicitly and does not replace the Sandbox or Orbit Atlas first screen.",
      ],
      limitations: [
        "Does not rerun JPL Horizons, Gaia, FRW, Kerr or catalog validation.",
        "Does not create physical bodies or change EIH 1PN solar-system dynamics.",
        "Does not replace the detailed Evidence Ledger, Mission Hub, Validation Console or Report Studio panels.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}

function performanceBudgetClaim(
  summary: AtlasPerformanceBudgetSummary | null,
): EvidenceClaim {
  const claim: EvidenceClaimWithoutPassport = {
    id: "performance-budget-readiness",
    group: "performance-budget-readiness",
    title: "Performance Budget render stability",
    status: "informational",
    confidence: "formula-checked",
    source: "Atlas Performance Budget v34 local render stability gate",
    model:
      "Read-only render budget summary over presentation mode, viewport, DPR, deep-sky labels, Kerr visibility and workbench state",
    metric: summary
      ? `${summary.tier}; ${summary.renderStability}; label budget ${summary.deepSkyLabelBudget}; recommendations ${summary.recommendationCount}`
      : "Performance summary not provided to this Evidence Ledger instance.",
    error:
      "No scientific error budget; performance readiness describes local rendering constraints only.",
    boundary:
      "Not a scientific accuracy score, not an automatic layer downgrade, not online profiling, and not a change to solar-system or Kerr dynamics.",
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "Orbit Atlas / Sandbox presentation mode",
        "Viewport width and device pixel ratio",
        "Deep-sky layer and catalog label state",
        "Kerr Lab visibility and workbench open state",
        "Atlas Performance Budget v34 local summary",
      ],
      method:
        "Classify the current local render context into a conservative tier and stability state, then expose label budget and recommendations without mutating user-enabled scientific layers.",
      formulas: [
        formula(
          "render-budget-tier",
          "Conservative render tier",
          "tier = f(viewport, DPR, renderBudget, deepSkyLabels, KerrVisible, workbenchOpen)",
          "viewport width, device pixel ratio, Orbit Atlas render budget, deep-sky toggles, catalog label count, Kerr Lab visibility and open workbench panels",
          "Render stability guidance only; it never changes physics state or validation conclusions.",
        ),
      ],
      metrics: [
        metric("performance-version", "Performance version", ATLAS_PERFORMANCE_BUDGET_VERSION, "informational"),
        metric("tier", "Performance tier", summary?.tier ?? "not provided", "informational"),
        metric("stability", "Render stability", summary?.renderStability ?? "not provided", "informational"),
        metric(
          "deep-sky-label-budget",
          "Deep-sky label budget",
          summary ? String(summary.deepSkyLabelBudget) : "not provided",
          "informational",
        ),
        metric(
          "recommendations",
          "Recommendation count",
          summary ? String(summary.recommendationCount) : "not provided",
          "informational",
        ),
        metric(
          "workbench",
          "Workbench open",
          summary ? String(summary.workbenchOpen) : "not provided",
          "informational",
        ),
        metric("auto-degrade", "Automatic layer downgrade", "not applied", "informational"),
      ],
      confidenceRationale:
        "Formula-checked at the product layer: performance status is derived from deterministic local UI/render inputs and intentionally does not produce a science trust score.",
      assumptions: [
        "Viewport and DPR describe the current browser render context.",
        "Deep-sky and Kerr visibility are UI/render costs, not new physics models.",
      ],
      limitations: [
        "Does not benchmark GPU drivers or perform online profiling.",
        "Does not silently disable user-enabled science or catalog layers.",
        "Does not change SolarSystemIntegrator, EIH 1PN dynamics or Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}

function releaseCandidateGateClaim(): EvidenceClaim {
  const claim: EvidenceClaimWithoutPassport = {
    id: "release-candidate-gate",
    group: "release-candidate-gate",
    title: "Release Candidate Gate hardening layer",
    status: "informational",
    confidence: "formula-checked",
    source: "Atlas Release Candidate Gate v36 local readiness rollup",
    model:
      "Read-only product hardening summary derived from existing local Validation Console domains",
    metric:
      "Displays blocker and warning counts derived from existing local readiness domains.",
    error:
      "No physical error budget and no command-execution claim; verification commands are run outside the runtime UI.",
    boundary:
      "Not scientific certification, not CI status, not online validation, not full numerical relativity, and not a physics-model change.",
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "Evidence Ledger v21 claim passports",
        "Validation Console v30 readiness domains",
        "Performance Budget v34 render stability guidance",
        "Kerr Relativity Studio v35 strong-field presentation boundary",
        "Release Candidate Gate v36 local rollup",
      ],
      method:
        "Derive a release-candidate status from existing local readiness domains: failed domains become blockers, pending domains become warnings, and informational domains remain boundary notes.",
      formulas: [
        formula(
          "release-gate-status",
          "Conservative local release gate",
          "gate = failed if blockers > 0; else pending if warnings > 0; else ready",
          "Existing Validation Console domains and their ready / pending / failed / informational status",
          "Product hardening review only; command checks are verified by development tooling, not claimed by the runtime UI.",
        ),
      ],
      metrics: [
        metric("release-gate-version", "Release gate version", ATLAS_RELEASE_GATE_VERSION, "informational"),
        metric("blocker-source", "Blocker source", "failed Validation Console domains", "informational"),
        metric("warning-source", "Warning source", "pending Validation Console domains", "informational"),
        metric("runtime-command-status", "Runtime command status", "not claimed in app", "informational"),
        metric("physics-mutation", "Physics mutation", "not applied", "informational"),
      ],
      confidenceRationale:
        "Formula-checked at the product layer: the gate is a deterministic local rollup and intentionally avoids claiming CI, online validation or scientific certification.",
      assumptions: [
        "Validation Console domains are already generated from the current local Atlas session.",
        "Command verification happens in developer tooling and is reported outside the runtime UI.",
      ],
      limitations: [
        "Does not run lint, TypeScript, tests, builds or browser checks from inside the app.",
        "Does not refresh JPL Horizons, Gaia, Planck, SIMBAD, VizieR or Kerr validation data.",
        "Does not change SolarSystemIntegrator, EIH 1PN dynamics, physicsEngine or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}

function relativityObservableAtlasClaim(diagnostics: SimulationDiagnostics | null): EvidenceClaim {
  const summary = createRelativityObservableAtlasSummary({ diagnostics });
  const claim: EvidenceClaimWithoutPassport = {
    id: "relativity-observable-atlas",
    group: "relativity-observable-atlas",
    title: "Relativity Observable Atlas",
    status: "informational",
    confidence: "formula-checked",
    source: `Relativity Observable Atlas ${RELATIVITY_OBSERVABLE_ATLAS_VERSION}`,
    model:
      "Read-only science depth layer over existing weak-field diagnostics and Kerr Studio summaries",
    metric: `${summary.readyCount}/${summary.observableCount} ready formula-backed rows; weak-field ${summary.weakFieldCount}; Kerr ${summary.strongFieldCount}; numerical health ${summary.numericalHealthCount}`,
    error:
      "No new physical error budget. Rows reuse existing diagnostics and label Kerr Hamiltonian drift as numerical health only.",
    boundary: summary.boundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "Relativity Validation weak-field diagnostics",
        "Kerr Relativity Studio v35 summary",
        "Evidence Ledger v21 claim passports",
        RELATIVITY_OBSERVABLE_ATLAS_VERSION,
      ],
      method:
        "Build deterministic observable rows from already-computed weak-field GR diagnostics and the existing Kerr Studio summary without running tests, fetching data, mutating state or changing the physics kernels.",
      formulas: [
        formula(
          "mercury-perihelion",
          "Mercury perihelion advance",
          "Delta omega = 6*pi*GM/(a(1-e^2)c^2)",
          "Solar GM, Mercury semimajor axis a, eccentricity e and c",
          "Weak-field 1PN explanation row only.",
        ),
        formula(
          "solar-limb-deflection",
          "Solar-limb light deflection",
          "alpha = 4GM/(c^2 b)",
          "Solar GM, impact parameter b and c",
          "Weak-field closed-form reference, not full ray-traced numerical relativity.",
        ),
        formula(
          "shapiro-delay",
          "Shapiro radar delay",
          "Delta t = 2GM/c^3 ln((rE+rT+R)/(rE+rT-R))",
          "Solar GM, Earth range rE, target range rT, baseline R and c",
          "Local diagnostic explanation only; no online ephemeris refresh.",
        ),
        formula(
          "kerr-4m-over-b",
          "Kerr null-probe weak-field reference",
          "alpha_weak ~= 4M/b",
          "Kerr mass unit M and probe impact parameter b",
          "Kerr Studio v35 test-particle/null-geodesic lab boundary.",
        ),
      ],
      metrics: [
        metric("atlas-version", "Atlas version", summary.version, "informational"),
        metric("observable-count", "Observable rows", String(summary.observableCount), "informational"),
        metric("ready-count", "Ready rows", String(summary.readyCount), summary.status),
        metric("weak-field-count", "Weak-field rows", String(summary.weakFieldCount), "informational"),
        metric("kerr-count", "Kerr rows", String(summary.strongFieldCount), "informational"),
        metric(
          "numerical-health",
          "Hamiltonian drift",
          "numerical health only; not an astrophysical observable",
          "informational",
        ),
        metric("online-source-claim", "Online source claim", "not claimed", "informational"),
        metric("physics-mutation", "Physics mutation", "not applied", "informational"),
      ],
      confidenceRationale:
        "Formula-checked at the explanation layer: observable rows are deterministic projections of existing local diagnostics and Kerr Studio summaries, not a new integrator or validation run.",
      assumptions: [
        "Weak-field rows depend on the current local diagnostics snapshot when available.",
        "Kerr rows use the existing v35 test-particle/null-geodesic studio summary.",
      ],
      limitations: [
        "Does not solve Einstein field equations or provide full numerical relativity.",
        "Does not run lint, tests, builds, online catalog checks or Horizons refreshes.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["relativity-observables", "kerr-lab", "evidence-ledger"],
    }),
  );
}

function relativityObservableExplainerClaim(diagnostics: SimulationDiagnostics | null): EvidenceClaim {
  const summary = createRelativityObservableExplainerSummary({ diagnostics });
  const claim: EvidenceClaimWithoutPassport = {
    id: "relativity-observable-explainer",
    group: "relativity-observable-explainer",
    title: "Relativity Observable Explainer",
    status: "informational",
    confidence: "formula-checked",
    source: `Relativity Observable Explainer ${RELATIVITY_OBSERVABLE_EXPLAINER_VERSION}`,
    model:
      "Read-only derivation cards keyed to existing Relativity Observable Atlas rows",
    metric: `${summary.cardCount} derivation cards; ${summary.totalStepCount} steps; ${summary.totalVariableCount} variables`,
    error:
      "No new scientific error budget. Cards explain existing rows and keep Kerr Hamiltonian drift as numerical health only.",
    boundary: summary.boundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "Relativity Observable Atlas v37 rows",
        "Relativity Validation weak-field diagnostics",
        "Kerr Relativity Studio v35 summary",
        "Evidence Ledger v21 claim passports",
        RELATIVITY_OBSERVABLE_EXPLAINER_VERSION,
      ],
      method:
        "Map each existing v37 observable row to a deterministic local derivation card with variables, explanation steps, scale interpretation, applicability and trusted boundary. The helper does not run tests, fetch data, mutate state or change physics kernels.",
      formulas: [
        formula(
          "explainer-card-contract",
          "Explainer card mapping",
          "card.observableId in v37 observable row ids",
          "Existing observable row ids, formulas and source labels",
          "Explanation metadata only; not a new observable or certification system.",
        ),
        formula(
          "step-count",
          "Deterministic step count",
          "totalStepCount = sum(card.derivationSteps.length)",
          "Local explainer card array",
          "Product explanation metric only.",
        ),
      ],
      metrics: [
        metric("explainer-version", "Explainer version", summary.version, "informational"),
        metric("card-count", "Explainer cards", String(summary.cardCount), "informational"),
        metric("step-count", "Derivation steps", String(summary.totalStepCount), "informational"),
        metric("variable-count", "Variables", String(summary.totalVariableCount), "informational"),
        metric("observable-row-contract", "Observable row contract", "7 existing v37 rows", "informational"),
        metric("scientific-certification", "Scientific certification", "not claimed", "informational"),
        metric("online-source-claim", "Online source claim", "not claimed", "informational"),
        metric("physics-mutation", "Physics mutation", "not applied", "informational"),
      ],
      confidenceRationale:
        "Formula-checked at the explanation layer: derivation cards are deterministic local descriptions of existing rows and do not introduce new diagnostics, sources or solver behavior.",
      assumptions: [
        "The v37 observable row ids remain stable.",
        "Weak-field and Kerr explanatory text remains tied to existing local diagnostics and Studio summaries.",
      ],
      limitations: [
        "Does not solve Einstein field equations or provide full numerical relativity.",
        "Does not run online validation, catalog lookups, Horizons refreshes, tests, lint or builds from inside the app.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["relativity-observables", "kerr-lab", "evidence-ledger"],
    }),
  );
}

function relativityGuidedTourClaim(diagnostics: SimulationDiagnostics | null): EvidenceClaim {
  const summary = createRelativityGuidedTourSummary({ diagnostics });
  const claim: EvidenceClaimWithoutPassport = {
    id: "relativity-guided-tour",
    group: "relativity-guided-tour",
    title: "Relativity Guided Tour",
    status: "informational",
    confidence: "formula-checked",
    source: `Relativity Guided Tour ${RELATIVITY_GUIDED_TOUR_VERSION}`,
    model:
      "Read-only science story workflow over existing Relativity Observable Atlas rows and derivation cards",
    metric: `${summary.readyCount}/${summary.stepCount} guided steps ready; workflow ${summary.workflowId}`,
    error:
      "No new scientific error budget. The tour routes to existing panels and preserves observable, explainer and Kerr boundaries.",
    boundary: summary.boundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "Relativity Observable Atlas v37 rows",
        "Relativity Observable Explainer v39 cards",
        "Atlas Workflows v25 guided actions",
        "Kerr Relativity Studio v35 boundary",
        RELATIVITY_GUIDED_TOUR_VERSION,
      ],
      method:
        "Map the seven existing v37 observable row ids to deterministic workflow steps that open existing Atlas or Kerr surfaces. The helper does not add observables, run commands, fetch data, mutate state or alter physics kernels.",
      formulas: [
        formula(
          "tour-step-contract",
          "Guided tour step mapping",
          "step.observableId in v37 observable row ids",
          "Existing observable row ids, v39 explainer cards and stable Navigator panel actions",
          "Navigation metadata only; not a new science solver or certification layer.",
        ),
        formula(
          "tour-ready-count",
          "Guided tour readiness",
          "readyCount = count(steps where v39 card mapping exists)",
          "Local guided-tour step array",
          "Product workflow cue only; not command/runtime pass status.",
        ),
      ],
      metrics: [
        metric("tour-version", "Tour version", summary.version, "informational"),
        metric("workflow-id", "Workflow id", summary.workflowId, "informational"),
        metric("step-count", "Guided steps", String(summary.stepCount), "informational"),
        metric("ready-count", "Ready guided steps", String(summary.readyCount), summary.status),
        metric("weak-field-steps", "Weak-field steps", String(summary.weakFieldStepCount), "informational"),
        metric("kerr-steps", "Kerr steps", String(summary.strongFieldStepCount), "informational"),
        metric(
          "numerical-health-step",
          "Numerical health step",
          "Hamiltonian drift remains numerical health only",
          "informational",
        ),
        metric("scientific-certification", "Scientific certification", "not claimed", "informational"),
        metric("runtime-command-status", "Runtime command status", "not claimed in app", "informational"),
        metric("online-validation", "Online validation", "not claimed", "informational"),
        metric("physics-mutation", "Physics mutation", "not applied", "informational"),
      ],
      confidenceRationale:
        "Formula-checked at the workflow layer: the tour is deterministic local navigation metadata over existing rows, cards and panels.",
      assumptions: [
        "The v37 observable row ids and v39 derivation card ids remain stable.",
        "Navigator keeps stable panel actions for Atlas Workflows, Observable Atlas and Kerr Studio.",
      ],
      limitations: [
        "Does not add observables, formulas, datasets, online validation or command execution.",
        "Does not solve Einstein field equations, provide full numerical relativity or add cosmological N-body.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["atlas-workflows", "relativity-observables", "kerr-lab", "evidence-ledger"],
    }),
  );
}

function relativityVerificationReadabilityClaim(
  diagnostics: SimulationDiagnostics | null,
): EvidenceClaim {
  const summary = createAtlasRelativityVerificationSummary({ diagnostics });
  const claim: EvidenceClaimWithoutPassport = {
    id: "relativity-verification-readability",
    group: "relativity-verification-readability",
    title: "Relativity Verification Readability",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Relativity Verification ${ATLAS_RELATIVITY_VERIFICATION_VERSION}`,
    model:
      "Read-only v73 benchmark readout over existing weak-field diagnostics, Observable Atlas, Guided Tour and Kerr Studio",
    metric: `weak-field ${summary.weakFieldObservableCount}; Kerr ${summary.strongFieldObservableCount}; numerical health ${summary.numericalHealthMetricCount}; kernel ${summary.kerrKernelId}`,
    error:
      "No new physical error budget. v73 clarifies observable classifications and trusted boundaries only.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "Relativity Observable Atlas v37 rows",
        "Relativity Observable Explainer v39 cards",
        "Relativity Guided Tour v40 steps",
        "Kerr Relativity Studio v35 summary",
        ATLAS_RELATIVITY_VERIFICATION_VERSION,
      ],
      method:
        "Classify the seven existing relativity rows into four weak-field observables, two Kerr test-particle references and one numerical-health metric. The helper does not run commands, fetch online data, mutate state, alter sky assets or change physics kernels.",
      formulas: [
        formula(
          "v73-readout-partition",
          "Relativity readout partition",
          "4 weak-field + 2 Kerr references + 1 numerical-health metric",
          "Existing v37 observable row ids and v40 guided-tour step ids",
          "Readability contract only; not a new solver, dataset or validation run.",
        ),
        formula(
          "kernel-lock",
          "Kerr kernel lock",
          "kerrKernelId = eih-1pn+kerr-geodesic-v17",
          "Existing local Kerr geodesic kernel id",
          "Identifier lock only; not a Kerr kernel upgrade.",
        ),
      ],
      metrics: [
        metric("verification-version", "Verification version", summary.version, "informational"),
        metric("benchmark-profile", "Benchmark profile", summary.benchmarkProfile, "informational"),
        metric("weak-field-count", "Weak-field observables", String(summary.weakFieldObservableCount), "informational"),
        metric("kerr-count", "Kerr references", String(summary.strongFieldObservableCount), "informational"),
        metric(
          "numerical-health-count",
          "Numerical health metrics",
          String(summary.numericalHealthMetricCount),
          "informational",
        ),
        metric("kerr-kernel", "Kerr kernel", summary.kerrKernelId, "informational"),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, "informational"),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, "informational"),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, "informational"),
      ],
      confidenceRationale:
        "Formula-checked at the readout layer: v73 is a deterministic classification of existing local rows, cards, guided steps and Kerr summaries.",
      assumptions: [
        "The v37 observable row ids remain stable.",
        "The Kerr kernel id remains eih-1pn+kerr-geodesic-v17.",
      ],
      limitations: [
        "Does not replace NASA/JPL precision ephemerides or fetch online validation data.",
        "Does not solve Einstein field equations or provide numerical relativity.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics, sky assets or the Kerr geodesic kernel.",
      ],
      relatedViews: ["relativity-observables", "kerr-lab", "atlas-workflows", "evidence-ledger"],
    }),
  );
}

function relativityVerificationChartsClaim(
  diagnostics: SimulationDiagnostics | null,
): EvidenceClaim {
  const summary = createAtlasRelativityChartSummary({ diagnostics });
  const claim: EvidenceClaimWithoutPassport = {
    id: "relativity-verification-charts",
    group: "relativity-verification-charts",
    title: "Relativity Verification Charts",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Relativity Charts ${ATLAS_RELATIVITY_CHART_VERSION}`,
    model:
      "Read-only v74 chart presentation over existing v73 verification readouts, weak-field diagnostics and Kerr Studio metrics",
    metric: `Mercury curve ${summary.mercuryCurve.length} points; ISCO bars ${summary.kerrIscoBars.length}; Hamiltonian drift ${summary.hamiltonianDrift.formatted}`,
    error:
      "No new physical error budget. v74 charts visualize existing local readouts only.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "Relativity Verification v73 readouts",
        "Relativity Validation weak-field diagnostics",
        "Kerr Relativity Studio v35 summary",
        ATLAS_RELATIVITY_CHART_VERSION,
      ],
      method:
        "Render deterministic local chart data for Mercury Newtonian vs EIH 1PN precession, Kerr ISCO prograde/retrograde/split and Hamiltonian drift numerical health. The helper does not run commands, fetch online data, mutate state, alter sky assets or change physics kernels.",
      formulas: [
        formula(
          "mercury-curve",
          "Mercury precession curve",
          "arcsec(f) = arcsec_per_century * f",
          "Century fraction f, Newtonian baseline, EIH 1PN readout and GR target",
          "Chart presentation only; not a new orbit integration.",
        ),
        formula(
          "kerr-isco-bars",
          "Kerr ISCO bar readout",
          "bars = [r_prograde, r_retrograde, r_retrograde - r_prograde]",
          "Existing Kerr Studio v35 summary",
          "Test-particle geodesic lab visualization only.",
        ),
      ],
      metrics: [
        metric("chart-version", "Chart version", summary.version, "informational"),
        metric("chart-profile", "Chart profile", summary.chartProfile, "informational"),
        metric("mercury-points", "Mercury curve points", String(summary.mercuryCurve.length), "informational"),
        metric("isco-bars", "ISCO bars", String(summary.kerrIscoBars.length), "informational"),
        metric("hamiltonian-drift", "Hamiltonian drift", summary.hamiltonianDrift.formatted, "informational"),
        metric("kerr-kernel", "Kerr kernel", summary.kerrKernelId, "informational"),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, "informational"),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, "informational"),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, "informational"),
      ],
      confidenceRationale:
        "Formula-checked at the chart layer: v74 is a deterministic chart projection of existing local diagnostics and summaries.",
      assumptions: [
        "The v73 readout partition remains stable.",
        "Mercury chart values are explanatory arcsec-per-century readouts, not a new integration.",
      ],
      limitations: [
        "Does not replace NASA/JPL precision ephemerides or fetch online validation data.",
        "Does not solve Einstein field equations or provide numerical relativity.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics, sky assets or the Kerr geodesic kernel.",
      ],
      relatedViews: ["relativity-observables", "kerr-lab", "evidence-ledger"],
    }),
  );
}

function physicsBenchmarkReleaseGateClaim(
  diagnostics: SimulationDiagnostics | null,
): EvidenceClaim {
  const summary = createAtlasPhysicsBenchmarkGateSummary(
    diagnostics?.relativityValidation.horizons ?? null,
  );
  const status: EvidenceClaimStatus =
    summary.runtimeStatus === "pass"
      ? "ready"
      : summary.runtimeStatus === "fail"
        ? "failed"
        : "pending";
  const claim: EvidenceClaimWithoutPassport = {
    id: "physics-benchmark-release-gate",
    group: "physics-benchmark-release-gate",
    title: "Physics Benchmark Release Gate",
    status,
    confidence: "formula-checked",
    source: `Atlas Physics Benchmark Gate ${ATLAS_PHYSICS_BENCHMARK_GATE_VERSION}`,
    model:
      "Blocking weak-field, deterministic RK4, offline Horizons and equatorial Kerr benchmark budget",
    metric: `${summary.passCount}/${summary.resultCount} pass; ${summary.pendingCount} pending; ${summary.blockingCount} blocking`,
    error:
      summary.blockingCount > 0
        ? summary.results
            .filter((result) => result.status === "fail")
            .map((result) => `${result.id}: ${result.measured}`)
            .join("; ")
        : "No local runtime blocker; latest CI certification is not claimed in the app.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "Relativity Validation weak-field diagnostics",
        "Atlas Numerical Integrity deterministic fixtures",
        "offline JPL Horizons checkpoints",
        "Kerr geodesic kernel v17",
        ATLAS_PHYSICS_BENCHMARK_GATE_VERSION,
      ],
      method:
        "Evaluate nine fixed local benchmark rows against strict upper bounds. Runtime status remains distinct from CI execution and does not mutate the live simulation.",
      formulas: [
        formula(
          "v75-strict-upper-bound",
          "Blocking upper-bound comparison",
          "status = pass iff measured < threshold",
          "deterministic local benchmark value and checked-in threshold",
          "Release regression gate only; not scientific certification.",
        ),
      ],
      metrics: [
        metric("gate-version", "Gate version", summary.version, status),
        metric("budget-profile", "Budget profile", summary.budgetProfile, status),
        metric("runtime-status", "Runtime status", summary.runtimeStatus, status),
        metric("pass-count", "Pass count", String(summary.passCount), status),
        metric("pending-count", "Pending count", String(summary.pendingCount), status),
        metric("blocking-count", "Blocking count", String(summary.blockingCount), status),
        metric("ci-certification", "CI certification", summary.ciCertificationStatus, "informational"),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, "informational"),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, "informational"),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, "informational"),
      ],
      confidenceRationale:
        "Formula-checked locally; the runtime claim does not assert that the latest full verification command passed.",
      assumptions: [
        "The checked-in Horizons dataset remains the offline ephemeris reference.",
        "Carter-constant coverage is deferred until a non-equatorial Kerr kernel exists.",
      ],
      limitations: [
        "Does not certify NASA/JPL precision equivalence, full numerical relativity, online validation or latest CI state.",
        "Does not modify SolarSystemIntegrator, physicsEngine, worker physics, sky assets or the Kerr kernel.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function horizonsGateClosureAuditClaim(
  diagnostics: SimulationDiagnostics | null,
): EvidenceClaim {
  const summary = createAtlasHorizonsGateAuditSummary(
    diagnostics?.relativityValidation.horizons ?? null,
  );
  const claim: EvidenceClaimWithoutPassport = {
    id: "horizons-gate-closure-audit",
    group: "horizons-gate-closure-audit",
    title: "Horizons Gate Closure Audit",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Horizons Gate Audit ${ATLAS_HORIZONS_GATE_AUDIT_VERSION}`,
    model:
      "Read-only v77 audit of J2000 frame metadata, units, body order, mass mapping and shared Horizons RK4/1PN runner",
    metric: `${summary.failureClassification}; ${summary.currentFailureMeasured}`,
    error:
      "Audit records the v75 blocker and does not relax thresholds, bypass full release, certify NASA/JPL precision, mutate physics, mutate sky, or alter v76 visual readiness.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "public/data/horizons-validation-j2000.json",
        "runHorizonsValidationDataset",
        "createAtlasPhysicsBenchmarkGateSummary",
        ATLAS_HORIZONS_GATE_AUDIT_VERSION,
      ],
      method:
        "Summarize the current Horizons release-gate failure with fixed data-lineage checks, runner-lineage checks and row-level checkpoint diagnostics for Newtonian and 1PN modes.",
      metrics: [
        metric("audit-version", "Audit version", summary.version, claim.status),
        metric("audit-profile", "Audit profile", summary.auditProfile, claim.status),
        metric("audit-status", "Audit status", summary.status, claim.status),
        metric("failure-classification", "Failure classification", summary.failureClassification, claim.status),
        metric("current-failure", "Current failure", summary.currentFailureMeasured, claim.status),
        metric("threshold", "Threshold", summary.currentThreshold, claim.status),
        metric("mode-count", "Mode count", String(summary.modeCount), claim.status),
        metric("checkpoint-count", "Checkpoint count", String(summary.checkpointCount), claim.status),
        metric("data-lineage", "Data lineage", summary.dataLineageChecks.join(", "), claim.status),
        metric("runner-lineage", "Runner lineage", summary.runnerLineageChecks.join(", "), claim.status),
        metric("full-release-gate", "Full release gate", summary.fullReleaseGateStatus, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
      ],
      confidenceRationale:
        "Formula-checked audit metadata only: it explains the current v75 blocker and row coverage, while the blocking gate remains owned by v75.",
      assumptions: [
        "The checked-in Horizons dataset remains the local reference for this audit.",
        "Current aggregate failure is treated as a model-limit unless the lineage shape is malformed.",
      ],
      limitations: [
        "Does not claim NASA/JPL precision ephemeris equivalence, latest CI status, online validation, or full release readiness.",
        "Does not relax v75 budgets or make Horizons non-blocking.",
        "Does not modify SolarSystemIntegrator, physicsEngine, worker physics, sky assets, v76 materials or the Kerr kernel.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function physicsGateSplitClaim(
  diagnostics: SimulationDiagnostics | null,
): EvidenceClaim {
  const summary = createAtlasPhysicsGateSplitSummary(
    diagnostics?.relativityValidation.horizons ?? null,
  );
  const claim: EvidenceClaimWithoutPassport = {
    id: "physics-gate-split",
    group: "physics-gate-split",
    title: "Product / Scientific Physics Gate Split",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Physics Gate Split ${ATLAS_PHYSICS_GATE_SPLIT_VERSION}`,
    model:
      "Read-only v78 release-semantics split between local product verification and strict Horizons scientific certification",
    metric: `product ${summary.productReleaseGateStatus}; strict Horizons ${summary.scientificHorizonsGateStatus}`,
    error:
      `Strict Horizons scientific certification remains ${summary.scientificHorizonsGateStatus}: ${summary.strictHorizonsFailureMeasured}`,
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "createAtlasPhysicsGateSplitSummary",
        "createAtlasHorizonsGateAuditSummary",
        "package.json verify:atlas:full",
        "package.json verify:atlas:scientific",
        ATLAS_PHYSICS_GATE_SPLIT_VERSION,
      ],
      method:
        "Expose product verification and strict Horizons scientific certification as separate local gates while preserving the v75 strict budgets.",
      metrics: [
        metric("split-version", "Split version", summary.version, claim.status),
        metric("split-profile", "Split profile", summary.gateSplitProfile, claim.status),
        metric("product-release-gate", "Product release gate", summary.productReleaseGateStatus, "ready"),
        metric("scientific-horizons-gate", "Scientific Horizons gate", summary.scientificHorizonsGateStatus, claim.status),
        metric("scientific-classification", "Scientific classification", summary.scientificFailureClassification, claim.status),
        metric("strict-horizons-failure", "Strict Horizons failure", summary.strictHorizonsFailureMeasured, claim.status),
        metric("strict-horizons-threshold", "Strict Horizons threshold", summary.strictHorizonsThreshold, claim.status),
        metric("product-full-command", "Product full command", summary.productFullCommand, claim.status),
        metric("scientific-full-command", "Scientific full command", summary.scientificFullCommand, claim.status),
        metric("strict-horizons-command", "Strict Horizons command", summary.strictHorizonsCommand, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
      ],
      confidenceRationale:
        "The split is deterministic release metadata only; strict Horizons remains a separate failing scientific gate.",
      assumptions: [
        "Product verification means local build, fast atlas tests and browser acceptance pass.",
        "Strict Horizons scientific certification remains blocked until the ephemeris model is upgraded.",
      ],
      limitations: [
        "Does not claim NASA/JPL precision, relax Horizons budgets, mutate physics, mutate sky or change v76 visual readiness.",
        "Does not make the strict Horizons scientific gate pass.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function releaseReadinessDocumentationClaim(
  diagnostics: SimulationDiagnostics | null,
): EvidenceClaim {
  const summary = createAtlasReleaseReadinessSummary(
    diagnostics?.relativityValidation.horizons ?? null,
  );
  const claim: EvidenceClaimWithoutPassport = {
    id: "release-readiness-documentation",
    group: "release-readiness-documentation",
    title: "Release Readiness Documentation",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Release Readiness ${ATLAS_RELEASE_READINESS_VERSION}`,
    model:
      "Read-only v79 documentation and DOM contract for product-ready versus strict scientific certification gate semantics",
    metric: `${summary.releaseSemantics}; product ${summary.productReleaseGateStatus}; strict Horizons ${summary.scientificHorizonsGateStatus}`,
    error:
      `Strict Horizons remains a scientific certification blocker only: ${summary.knownScientificBlocker}`,
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "createAtlasReleaseReadinessSummary",
        "createAtlasPhysicsGateSplitSummary",
        "README.md release gate commands",
        "docs/TECHNICAL_OVERVIEW.md gate semantics",
        ATLAS_RELEASE_READINESS_VERSION,
      ],
      method:
        "Document and expose the v78 gate split as a v79 readiness contract so product full verification, strict Horizons scientific certification and known blocker wording remain synchronized.",
      metrics: [
        metric("readiness-version", "Readiness version", summary.version, claim.status),
        metric("readiness-profile", "Readiness profile", summary.readinessProfile, claim.status),
        metric("release-semantics", "Release semantics", summary.releaseSemantics, claim.status),
        metric("product-release-gate", "Product release gate", summary.productReleaseGateStatus, "ready"),
        metric("scientific-horizons-gate", "Scientific Horizons gate", summary.scientificHorizonsGateStatus, claim.status),
        metric("product-full-command", "Product full command", summary.productFullCommand, claim.status),
        metric("scientific-full-command", "Scientific full command", summary.scientificFullCommand, claim.status),
        metric("strict-horizons-command", "Strict Horizons command", summary.strictHorizonsCommand, claim.status),
        metric("known-scientific-blocker", "Known scientific blocker", summary.knownScientificBlocker, claim.status),
        metric("documentation-scope", "Documentation scope", summary.documentationScope, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
      ],
      confidenceRationale:
        "The claim is deterministic release metadata and documentation alignment; it does not run or certify latest commands inside the app.",
      assumptions: [
        "Product-ready means the local product verification command set passes outside the runtime UI.",
        "Strict Horizons scientific certification remains blocked until a future physics-model upgrade resolves the v75 budget failure.",
      ],
      limitations: [
        "Does not claim NASA/JPL precision, latest CI status, scientific certification, threshold relaxation, online validation or full numerical relativity.",
        "Does not mutate physics, sky assets, background direction, materials, v75 budgets or the Kerr kernel.",
      ],
      relatedViews: ["evidence-ledger", "relativity-observables"],
    }),
  );
}

function scientificGatePreflightClaim(
  diagnostics: SimulationDiagnostics | null,
): EvidenceClaim {
  const summary = createAtlasScientificGatePreflightSummary(
    diagnostics?.relativityValidation.horizons ?? null,
  );
  const claim: EvidenceClaimWithoutPassport = {
    id: "scientific-gate-preflight",
    group: "scientific-gate-preflight",
    title: "Scientific Horizons Closure Preflight",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Scientific Gate Preflight ${ATLAS_SCIENTIFIC_GATE_PREFLIGHT_VERSION}`,
    model:
      "Read-only v80 roadmap contract for closing the strict Horizons scientific certification blocker without relaxing budgets",
    metric: `${summary.status}; ${summary.candidatePathCount} candidate paths`,
    error:
      `Strict Horizons remains blocked before a future model upgrade: ${summary.knownScientificBlocker}`,
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "createAtlasScientificGatePreflightSummary",
        "createAtlasReleaseReadinessSummary",
        "createAtlasPhysicsGateSplitSummary",
        "createAtlasHorizonsGateAuditSummary",
        ATLAS_SCIENTIFIC_GATE_PREFLIGHT_VERSION,
      ],
      method:
        "Expose the current strict Horizons blocker and three non-applied upgrade paths as a deterministic preflight contract for future physics work.",
      metrics: [
        metric("preflight-version", "Preflight version", summary.version, claim.status),
        metric("preflight-profile", "Preflight profile", summary.preflightProfile, claim.status),
        metric("preflight-status", "Preflight status", summary.status, claim.status),
        metric("product-release-gate", "Product release gate", summary.productReleaseGateStatus, "ready"),
        metric("scientific-horizons-gate", "Scientific Horizons gate", summary.scientificHorizonsGateStatus, claim.status),
        metric("known-scientific-blocker", "Known scientific blocker", summary.knownScientificBlocker, claim.status),
        metric("candidate-path-count", "Candidate path count", String(summary.candidatePathCount), claim.status),
        metric("candidate-paths", "Candidate paths", summary.candidatePaths.map((path) => path.id).join(", "), claim.status),
        metric("strict-horizons-command", "Strict Horizons command", summary.strictHorizonsCommand, claim.status),
        metric("product-full-command", "Product full command", summary.productFullCommand, claim.status),
        metric("scientific-full-command", "Scientific full command", summary.scientificFullCommand, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
      ],
      confidenceRationale:
        "The preflight is deterministic roadmap metadata only; every candidate path remains explicitly not applied.",
      assumptions: [
        "Future strict gate closure should start from initial-state, force-model or integrator upgrades rather than threshold changes.",
        "Product release semantics remain owned by v78/v79 and are not changed by this preflight.",
      ],
      limitations: [
        "Does not claim NASA/JPL precision, close the strict Horizons gate, relax v75 budgets, mutate physics, mutate sky or mutate materials.",
        "Does not choose which candidate path a future implementation must execute first.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function horizonsResidualDecompositionClaim(
  diagnostics: SimulationDiagnostics | null,
): EvidenceClaim {
  const summary = createAtlasHorizonsResidualDecompositionSummary(
    diagnostics?.relativityValidation.horizons ?? null,
  );
  const claim: EvidenceClaimWithoutPassport = {
    id: "horizons-residual-decomposition",
    group: "horizons-residual-decomposition",
    title: "Horizons RTN Residual Decomposition",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Horizons Residual Decomposition ${ATLAS_HORIZONS_RESIDUAL_DECOMPOSITION_VERSION}`,
    model:
      "Read-only per-body radial, transverse and normal attribution over the existing offline Horizons comparison run",
    metric: `${summary.status}; ${summary.residualRowCount} RTN rows; dominant ${summary.dominantBodyId || "pending"}`,
    error: summary.knownScientificBlocker,
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runHorizonsValidationDataset",
        "compareStateToHorizonsCheckpoint",
        "createHorizonsOrbitalResidual",
        "createAtlasHorizonsResidualDecompositionSummary",
        ATLAS_HORIZONS_RESIDUAL_DECOMPOSITION_VERSION,
      ],
      method:
        "Project each finite non-Sun position and velocity residual onto the reference Horizons RTN basis, then attribute squared-error contribution per mode and checkpoint without rerunning or changing the integrator.",
      metrics: [
        metric("decomposition-version", "Decomposition version", summary.version, claim.status),
        metric("decomposition-profile", "Decomposition profile", summary.decompositionProfile, claim.status),
        metric("decomposition-status", "Decomposition status", summary.status, claim.status),
        metric("source-audit-status", "Source audit status", summary.sourceAuditStatus, claim.status),
        metric("reference-frame", "Reference frame", summary.referenceFrame, claim.status),
        metric("contribution-scope", "Contribution scope", summary.contributionScope, claim.status),
        metric("mode-count", "Mode count", String(summary.modeCount), claim.status),
        metric("checkpoint-count", "Checkpoint count", String(summary.checkpointCount), claim.status),
        metric("body-count", "Decomposable body count", String(summary.decomposableBodyCount), claim.status),
        metric("residual-row-count", "Residual row count", String(summary.residualRowCount), claim.status),
        metric("dominant-body", "1PN +10y dominant position body", summary.dominantBodyId || "pending", claim.status),
        metric("known-scientific-blocker", "Known scientific blocker", summary.knownScientificBlocker, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
      ],
      confidenceRationale:
        "RTN components reconstruct the existing scalar residual norms and contribution fractions are normalized within each finite non-Sun checkpoint group.",
      assumptions: [
        "The reference RTN basis is defined by the Sun-centered Horizons position and velocity at each checkpoint.",
        "A dominant component is an attribution signal, not proof of a force-model, epoch or integration root cause.",
      ],
      limitations: [
        "Does not relax v75 budgets, close the strict scientific gate, mutate physics, change product gate semantics or claim NASA/JPL certification.",
        "Sun is excluded because a Sun-centered RTN basis is degenerate at the origin.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function horizonsCandidateLabClaim(): EvidenceClaim {
  const summary = createAtlasHorizonsCandidateLabSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "horizons-candidate-lab",
    group: "horizons-candidate-lab",
    title: "Horizons Dynamical Parameter Candidate Lab",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Horizons Candidate Lab ${ATLAS_HORIZONS_CANDIDATE_LAB_VERSION}`,
    model:
      "Non-applied v82 candidate matrix for DE440 GM, softening, timestep and hierarchy-aligned Horizons references",
    metric: `${summary.status}; ${summary.completedCandidateCount}/${summary.candidateCount} candidate rows complete`,
    error: summary.strictGateBaselineMeasured,
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasHorizonsCandidateMatrix",
        "runHorizonsValidationDataset",
        "JPL SSD Astrodynamic Parameters DE440",
        "JPL Horizons system barycenter candidate fixture",
        ATLAS_HORIZONS_CANDIDATE_LAB_VERSION,
      ],
      method:
        "Define five offline candidate rows for solar GM, softening, half-step integration and system-barycenter hierarchy references, while keeping every candidate explicitly not applied to the strict gate or runtime physics.",
      metrics: [
        metric("candidate-lab-version", "Candidate lab version", summary.version, claim.status),
        metric("candidate-profile", "Candidate profile", summary.candidateProfile, claim.status),
        metric("candidate-status", "Candidate status", summary.status, claim.status),
        metric("candidate-count", "Candidate count", String(summary.candidateCount), claim.status),
        metric("completed-candidate-count", "Completed candidate count", String(summary.completedCandidateCount), claim.status),
        metric("best-position-candidate", "Best position candidate", summary.bestPositionCandidateId || "pending", claim.status),
        metric("best-velocity-candidate", "Best velocity candidate", summary.bestVelocityCandidateId || "pending", claim.status),
        metric("strict-baseline", "Strict baseline", summary.strictGateBaselineMeasured, claim.status),
        metric("strict-default-mutation", "Strict default mutation", summary.strictGateDefaultMutation, claim.status),
        metric("candidate-mutation", "Candidate mutation", summary.candidateMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
      ],
      confidenceRationale:
        "The lab is deterministic candidate metadata until the separate candidate command is run; no row is treated as applied or certified by the runtime UI.",
      assumptions: [
        "Strict v75 Horizons remains the scientific gate until a future version intentionally applies a proven candidate.",
        "Barycenter candidate data is stored separately from the v75 center-reference fixture.",
      ],
      limitations: [
        "Does not relax v75 budgets, close scientific certification, claim NASA/JPL precision or mutate runtime physics.",
        "Does not modify backgrounds, V9 sky assets, materials, Kerr, worker physics or the product/scientific gate split.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function plutoResidualIsolationClaim(): EvidenceClaim {
  const summary = createAtlasPlutoResidualIsolationSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "pluto-residual-isolation",
    group: "pluto-residual-isolation",
    title: "Pluto Residual Cause Isolation",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Pluto Residual Isolation ${ATLAS_PLUTO_RESIDUAL_ISOLATION_VERSION}`,
    model:
      "Non-applied v83 outer-system candidate matrix for Pluto-dominated Horizons residual attribution",
    metric: `${summary.status}; ${summary.classification}; ${summary.completedCandidateCount}/${summary.candidateCount} rows complete`,
    error: summary.strictBlocker,
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasPlutoResidualIsolationMatrix",
        "runHorizonsValidationDataset",
        "v82 candidate lab rows",
        "v81 RTN residual frame",
        ATLAS_PLUTO_RESIDUAL_ISOLATION_VERSION,
      ],
      method:
        "Run targeted offline half-step, quarter-step, center-reference and hierarchy-reference candidates, then isolate Pluto +10y RTN residuals and the aggregate RMS after excluding Pluto without applying any candidate to runtime physics.",
      metrics: [
        metric("pluto-isolation-version", "Pluto isolation version", summary.version, claim.status),
        metric("pluto-isolation-profile", "Pluto isolation profile", summary.isolationProfile, claim.status),
        metric("pluto-isolation-status", "Pluto isolation status", summary.status, claim.status),
        metric("pluto-isolation-classification", "Classification", summary.classification, claim.status),
        metric("candidate-count", "Candidate count", String(summary.candidateCount), claim.status),
        metric("completed-candidate-count", "Completed candidate count", String(summary.completedCandidateCount), claim.status),
        metric("baseline-pluto-candidate", "Baseline Pluto candidate", summary.baselinePlutoPlus10y.candidateId || "pending", claim.status),
        metric("best-pluto-candidate", "Best Pluto candidate", summary.bestCandidatePlutoPlus10y.candidateId || "pending", claim.status),
        metric("dominant-rtn-component", "Dominant RTN component", summary.dominantRtnComponent, claim.status),
        metric("strict-blocker", "Strict blocker", summary.strictBlocker, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
      ],
      confidenceRationale:
        "The runtime ledger reports deterministic pending metadata; measured rows are produced by the separate heavy v83 command and remain non-applied.",
      assumptions: [
        "The v82 velocity improvement does not imply the strict position RMS gate is closed.",
        "Pluto RTN component dominance is attribution only, not a proven root cause.",
      ],
      limitations: [
        "Does not relax v75 budgets, close scientific certification, claim NASA/JPL precision or mutate runtime physics.",
        "Does not modify backgrounds, V9 sky assets, materials, Kerr, worker physics or product/scientific gate semantics.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function outerSystemForceModelPreflightClaim(): EvidenceClaim {
  const summary = createAtlasOuterSystemForceModelPreflightSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "outer-system-force-model-preflight",
    group: "outer-system-force-model-preflight",
    title: "Outer-System Force Model Preflight",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Outer-System Force Model Preflight ${ATLAS_OUTER_SYSTEM_FORCE_MODEL_PREFLIGHT_VERSION}`,
    model:
      "Non-applied v84 fixture provenance and Pluto / outer-system force-model upgrade-path preflight",
    metric: `${summary.status}; ${summary.classification}; ${summary.completedCandidateCount}/${summary.candidateCount} rows complete`,
    error: summary.strictBlocker,
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "auditOuterSystemFixtureProvenance",
        "runAtlasOuterSystemForceModelPreflightMatrix",
        "v84 outer-system barycenter Horizons fixture",
        "v83 Pluto residual isolation",
        ATLAS_OUTER_SYSTEM_FORCE_MODEL_PREFLIGHT_VERSION,
      ],
      method:
        "Audit whether a candidate fixture has explicit target provenance and nonzero outer-system deltas before interpreting Pluto barycenter, outer-planet system GM or missing-perturber candidate rows.",
      metrics: [
        metric("outer-system-preflight-version", "Preflight version", summary.version, claim.status),
        metric("outer-system-preflight-profile", "Preflight profile", summary.preflightProfile, claim.status),
        metric("outer-system-preflight-status", "Preflight status", summary.status, claim.status),
        metric("outer-system-classification", "Classification", summary.classification, claim.status),
        metric("candidate-count", "Candidate count", String(summary.candidateCount), claim.status),
        metric("completed-candidate-count", "Completed candidate count", String(summary.completedCandidateCount), claim.status),
        metric("best-candidate", "Best candidate", summary.bestCandidateId || "pending", claim.status),
        metric("strict-blocker", "Strict blocker", summary.strictBlocker, claim.status),
        metric("fixture-provenance-mutation", "Fixture provenance mutation", summary.fixtureProvenanceMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
      ],
      confidenceRationale:
        "The runtime ledger reports deterministic pending metadata; measured fixture audits and candidate rows are produced by the separate heavy v84 command and remain non-applied.",
      assumptions: [
        "Corrected barycenter fixture provenance must be established before force-model conclusions are trusted.",
        "The strict v75 scientific gate remains blocked until a future applied model actually meets the v75 budgets.",
      ],
      limitations: [
        "Does not relax v75 budgets, close scientific certification, claim NASA/JPL precision or mutate runtime physics.",
        "Does not modify backgrounds, V9 sky assets, materials, Kerr, worker physics or product/scientific gate semantics.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function outerSystemReferenceAdoptionClaim(): EvidenceClaim {
  const summary = createAtlasOuterSystemReferenceAdoptionSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "outer-system-reference-adoption",
    group: "outer-system-reference-adoption",
    title: "Outer-System Reference Adoption Preflight",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Outer-System Reference Adoption ${ATLAS_OUTER_SYSTEM_REFERENCE_ADOPTION_VERSION}`,
    model:
      "Non-applied v85 adoption-readiness preflight for the v84 outer-system barycenter fixture plus DE440 system GM candidate path",
    metric: `${summary.status}; ${summary.classification}; ${summary.completedCandidateCount}/${summary.candidateCount} rows complete`,
    error: summary.strictBlocker,
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasOuterSystemReferenceAdoptionPreflight",
        "v84 outer-system barycenter Horizons fixture",
        "DE440 system GM candidate path",
        "v75 strict fixture lock audit",
        ATLAS_OUTER_SYSTEM_REFERENCE_ADOPTION_VERSION,
      ],
      method:
        "Audit whether the existing v84 reference fixture plus DE440 system GM can satisfy the v75 numerical budgets as a candidate-only adoption path while keeping the default strict gate unmigrated.",
      metrics: [
        metric("outer-system-reference-adoption-version", "Adoption version", summary.version, claim.status),
        metric("outer-system-reference-adoption-profile", "Adoption profile", summary.adoptionProfile, claim.status),
        metric("outer-system-reference-adoption-status", "Adoption status", summary.status, claim.status),
        metric("outer-system-reference-adoption-classification", "Classification", summary.classification, claim.status),
        metric("candidate-count", "Candidate count", String(summary.candidateCount), claim.status),
        metric("completed-candidate-count", "Completed candidate count", String(summary.completedCandidateCount), claim.status),
        metric("best-candidate", "Best candidate", summary.bestCandidateId || "pending", claim.status),
        metric("strict-position-budget", "Strict position budget", `${summary.strictBudgetPositionRmsKm} km`, claim.status),
        metric("strict-velocity-budget", "Strict velocity budget", `${summary.strictBudgetVelocityRmsMs} m/s`, claim.status),
        metric("strict-mercury-ratio-budget", "Strict Mercury ratio budget", String(summary.strictBudgetMercuryRatio), claim.status),
        metric("default-strict-fixture-mutation", "Default strict fixture mutation", summary.defaultStrictFixtureMutation, claim.status),
        metric("default-scientific-gate-mutation", "Default scientific gate mutation", summary.defaultScientificGateMutation, claim.status),
        metric("reference-fixture-adoption-mutation", "Reference fixture adoption mutation", summary.referenceFixtureAdoptionMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
      ],
      confidenceRationale:
        "The runtime ledger reports deterministic pending metadata; measured lock audits and candidate rows are produced by the separate heavy v85 command and remain non-applied.",
      assumptions: [
        "The v84 fixture is reused as-is; v85 does not regenerate or overwrite Horizons validation data.",
        "A passing candidate row is migration evidence only and does not change the default strict scientific gate.",
      ],
      limitations: [
        "Does not relax v75 budgets, replace the v75 strict fixture, close scientific certification or claim NASA/JPL precision.",
        "Does not modify live physics, worker physics, RK4 defaults, EIH 1PN, Kerr, materials, backgrounds, V9 sky assets or product/scientific gate semantics.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function horizonsCandidateScientificGateClaim(): EvidenceClaim {
  const summary = createAtlasHorizonsCandidateScientificGateSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "horizons-candidate-scientific-gate",
    group: "horizons-candidate-scientific-gate",
    title: "Horizons Candidate Scientific Gate",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Horizons Candidate Scientific Gate ${ATLAS_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_VERSION}`,
    model:
      "Non-applied v86 candidate scientific gate for the v85 barycentric reference adoption path",
    metric: `${summary.status}; ${summary.classification}; ${summary.completedCandidateCount}/${summary.candidateCount} rows complete`,
    error: summary.strictBlocker,
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasHorizonsCandidateScientificGatePreflight",
        "runAtlasOuterSystemReferenceAdoptionPreflight",
        "v84 outer-system barycenter Horizons fixture",
        "DE440 system GM candidate path",
        "v75 strict scientific gate lock audit",
        ATLAS_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_VERSION,
      ],
      method:
        "Promote the v85 adoption evidence into a separate candidate scientific gate proof while keeping the default strict Horizons gate unmigrated and expected-failing.",
      metrics: [
        metric("horizons-candidate-scientific-gate-version", "Candidate gate version", summary.version, claim.status),
        metric("horizons-candidate-scientific-gate-profile", "Candidate gate profile", summary.candidateGateProfile, claim.status),
        metric("horizons-candidate-scientific-gate-status", "Candidate gate status", summary.status, claim.status),
        metric("horizons-candidate-scientific-gate-classification", "Classification", summary.classification, claim.status),
        metric("candidate-count", "Candidate count", String(summary.candidateCount), claim.status),
        metric("completed-candidate-count", "Completed candidate count", String(summary.completedCandidateCount), claim.status),
        metric("best-candidate", "Best candidate", summary.bestCandidateId || "pending", claim.status),
        metric("strict-position-budget", "Strict position budget", `${summary.strictBudgetPositionRmsKm} km`, claim.status),
        metric("strict-velocity-budget", "Strict velocity budget", `${summary.strictBudgetVelocityRmsMs} m/s`, claim.status),
        metric("strict-mercury-ratio-budget", "Strict Mercury ratio budget", String(summary.strictBudgetMercuryRatio), claim.status),
        metric("default-strict-fixture-mutation", "Default strict fixture mutation", summary.defaultStrictFixtureMutation, claim.status),
        metric("default-scientific-gate-mutation", "Default scientific gate mutation", summary.defaultScientificGateMutation, claim.status),
        metric("reference-fixture-adoption-mutation", "Reference fixture adoption mutation", summary.referenceFixtureAdoptionMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
      ],
      confidenceRationale:
        "The runtime ledger reports deterministic pending metadata; measured candidate gate rows are produced by the separate heavy v86 command and remain non-applied.",
      assumptions: [
        "The v85 adoption runner remains the single source for candidate numerical evidence.",
        "The default strict scientific gate remains blocked until a later explicit migration changes the default reference path.",
      ],
      limitations: [
        "Does not relax v75 budgets, replace the v75 strict fixture, close scientific certification or claim NASA/JPL precision.",
        "Does not modify live physics, worker physics, RK4 defaults, EIH 1PN, Kerr, materials, backgrounds, V9 sky assets or product/scientific gate semantics.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function strictHorizonsMigrationDryRunClaim(): EvidenceClaim {
  const summary = createAtlasStrictHorizonsMigrationDryRunSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "strict-horizons-migration-dry-run",
    group: "strict-horizons-migration-dry-run",
    title: "Strict Horizons Migration Dry-Run Audit",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Strict Horizons Migration Dry-Run ${ATLAS_STRICT_HORIZONS_MIGRATION_DRY_RUN_VERSION}`,
    model:
      "Non-applied v87 default-gate migration diff audit for the v86 passing candidate path",
    metric: `${summary.status}; ${summary.classification}; ${summary.completedMigrationDiffCount}/${summary.migrationDiffCount} diffs complete`,
    error: summary.strictBlocker,
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasStrictHorizonsMigrationDryRunAudit",
        "runAtlasHorizonsCandidateScientificGatePreflight",
        "v86 passing candidate gate",
        "v75 strict fixture and command lock",
        "v84 outer-system barycenter candidate fixture",
        ATLAS_STRICT_HORIZONS_MIGRATION_DRY_RUN_VERSION,
      ],
      method:
        "Create a dry-run migration manifest that records the exact future strict-gate fixture/model/command diff while keeping the default strict gate unmigrated and expected-failing.",
      metrics: [
        metric("strict-horizons-migration-dry-run-version", "Dry-run version", summary.version, claim.status),
        metric("strict-horizons-migration-dry-run-profile", "Dry-run profile", summary.migrationProfile, claim.status),
        metric("strict-horizons-migration-dry-run-status", "Dry-run status", summary.status, claim.status),
        metric("strict-horizons-migration-dry-run-classification", "Classification", summary.classification, claim.status),
        metric("migration-diff-count", "Migration diff count", String(summary.migrationDiffCount), claim.status),
        metric("completed-migration-diff-count", "Completed migration diff count", String(summary.completedMigrationDiffCount), claim.status),
        metric("ready-migration-diff", "Ready migration diff", summary.readyMigrationDiffId || "pending", claim.status),
        metric("strict-position-budget", "Strict position budget", `${summary.strictBudgetPositionRmsKm} km`, claim.status),
        metric("strict-velocity-budget", "Strict velocity budget", `${summary.strictBudgetVelocityRmsMs} m/s`, claim.status),
        metric("strict-mercury-ratio-budget", "Strict Mercury ratio budget", String(summary.strictBudgetMercuryRatio), claim.status),
        metric("default-strict-fixture-mutation", "Default strict fixture mutation", summary.defaultStrictFixtureMutation, claim.status),
        metric("default-strict-command-mutation", "Default strict command mutation", summary.defaultStrictCommandMutation, claim.status),
        metric("default-scientific-gate-mutation", "Default scientific gate mutation", summary.defaultScientificGateMutation, claim.status),
        metric("reference-fixture-adoption-mutation", "Reference fixture adoption mutation", summary.referenceFixtureAdoptionMutation, claim.status),
        metric("migration-docs-mutation", "Migration docs mutation", summary.migrationDocsMutation, claim.status),
        metric("migration-screenshots-mutation", "Migration screenshots mutation", summary.migrationScreenshotsMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
      ],
      confidenceRationale:
        "The runtime ledger reports deterministic pending metadata; measured dry-run migration diffs are produced by the separate heavy v87 command and remain non-applied.",
      assumptions: [
        "The v86 candidate gate remains the source of candidate readiness evidence.",
        "The default strict scientific gate remains blocked until a later version intentionally edits the default command/config.",
      ],
      limitations: [
        "Does not relax v75 budgets, replace the v75 strict fixture, close scientific certification or claim NASA/JPL precision.",
        "Does not modify live physics, worker physics, RK4 defaults, EIH 1PN, Kerr, materials, backgrounds, V9 sky assets, screenshots or product/scientific gate semantics.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function strictHorizonsShadowMigrationGateClaim(): EvidenceClaim {
  const summary = createAtlasStrictHorizonsShadowMigrationGateSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "strict-horizons-shadow-migration-gate",
    group: "strict-horizons-shadow-migration-gate",
    title: "Strict Horizons Shadow Migration Gate",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Strict Horizons Shadow Migration Gate ${ATLAS_STRICT_HORIZONS_SHADOW_MIGRATION_VERSION}`,
    model:
      "Non-applied v88 parallel strict-gate rehearsal over the v87 migration dry-run manifest",
    metric: `${summary.status}; ${summary.classification}; ${summary.completedShadowGateCount}/${summary.shadowGateCount} shadow rows complete`,
    error: summary.strictBlocker,
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasStrictHorizonsShadowMigrationGateAudit",
        "runAtlasStrictHorizonsMigrationDryRunAudit",
        "v87 complete migration diff",
        "v84 outer-system barycenter candidate fixture",
        "DE440 system GM candidate path",
        "separate shadow Horizons command",
        ATLAS_STRICT_HORIZONS_SHADOW_MIGRATION_VERSION,
      ],
      method:
        "Run the future strict-gate fixture/model contract as a separate shadow gate while keeping the default strict Horizons command unmigrated and expected-failing.",
      metrics: [
        metric("strict-horizons-shadow-migration-gate-version", "Shadow gate version", summary.version, claim.status),
        metric("strict-horizons-shadow-migration-gate-profile", "Shadow gate profile", summary.shadowGateProfile, claim.status),
        metric("strict-horizons-shadow-migration-gate-status", "Shadow gate status", summary.status, claim.status),
        metric("strict-horizons-shadow-migration-gate-classification", "Classification", summary.classification, claim.status),
        metric("shadow-gate-count", "Shadow gate count", String(summary.shadowGateCount), claim.status),
        metric("completed-shadow-gate-count", "Completed shadow gate count", String(summary.completedShadowGateCount), claim.status),
        metric("ready-shadow-gate", "Ready shadow gate", summary.readyShadowGateId || "pending", claim.status),
        metric("strict-position-budget", "Strict position budget", `${summary.strictBudgetPositionRmsKm} km`, claim.status),
        metric("strict-velocity-budget", "Strict velocity budget", `${summary.strictBudgetVelocityRmsMs} m/s`, claim.status),
        metric("strict-mercury-ratio-budget", "Strict Mercury ratio budget", String(summary.strictBudgetMercuryRatio), claim.status),
        metric("default-strict-fixture-mutation", "Default strict fixture mutation", summary.defaultStrictFixtureMutation, claim.status),
        metric("default-strict-command-mutation", "Default strict command mutation", summary.defaultStrictCommandMutation, claim.status),
        metric("shadow-gate-command-mutation", "Shadow gate command mutation", summary.shadowGateCommandMutation, claim.status),
        metric("default-scientific-gate-mutation", "Default scientific gate mutation", summary.defaultScientificGateMutation, claim.status),
        metric("reference-fixture-adoption-mutation", "Reference fixture adoption mutation", summary.referenceFixtureAdoptionMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
      ],
      confidenceRationale:
        "The runtime ledger reports deterministic pending metadata; measured shadow gate rows are produced by the separate heavy v88 command and remain non-applied.",
      assumptions: [
        "The v87 migration dry-run remains the source of the candidate fixture/model/command diff.",
        "The default strict scientific gate remains blocked until a later version intentionally edits the default command/config.",
      ],
      limitations: [
        "Does not relax v75 budgets, replace the v75 strict fixture, close scientific certification or claim NASA/JPL precision.",
        "Does not modify live physics, worker physics, RK4 defaults, EIH 1PN, Kerr, materials, backgrounds, V9 sky assets or product/scientific gate semantics.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function defaultStrictHorizonsMigrationClaim(): EvidenceClaim {
  const summary = createAtlasDefaultStrictHorizonsMigrationSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "default-strict-horizons-migration",
    group: "default-strict-horizons-migration",
    title: "Default Strict Horizons Scientific Gate Migration",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Default Strict Horizons Migration ${ATLAS_DEFAULT_STRICT_HORIZONS_MIGRATION_VERSION}`,
    model:
      "Applied v89 offline scientific-gate migration from the v88 shadow path to the default strict Horizons command",
    metric: `${summary.status}; ${summary.classification}; ${summary.completedMigrationRowCount}/${summary.migrationRowCount} migration rows complete`,
    error: summary.legacyStrictBlocker,
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasDefaultStrictHorizonsMigrationAudit",
        "runAtlasStrictHorizonsShadowMigrationGateAudit",
        "v88 passing shadow gate",
        "v84 outer-system barycenter candidate fixture",
        "legacy v75 blocker audit command",
        ATLAS_DEFAULT_STRICT_HORIZONS_MIGRATION_VERSION,
      ],
      method:
        "Apply the shadow-proven barycentric fixture/model path to the default offline strict scientific gate while retaining a legacy v75 blocker audit command.",
      metrics: [
        metric("default-strict-horizons-migration-version", "Migration version", summary.version, claim.status),
        metric("default-strict-horizons-migration-profile", "Migration profile", summary.migrationProfile, claim.status),
        metric("default-strict-horizons-migration-status", "Migration status", summary.status, claim.status),
        metric("default-strict-horizons-migration-classification", "Classification", summary.classification, claim.status),
        metric("migration-row-count", "Migration row count", String(summary.migrationRowCount), claim.status),
        metric("completed-migration-row-count", "Completed migration row count", String(summary.completedMigrationRowCount), claim.status),
        metric("ready-migration-row", "Ready migration row", summary.readyMigrationRowId || "pending", claim.status),
        metric("default-scientific-gate-migration", "Default scientific gate migration", summary.defaultScientificGateMigration, claim.status),
        metric("legacy-v75-audit-mutation", "Legacy v75 audit mutation", summary.legacyV75AuditMutation, claim.status),
        metric("strict-position-budget", "Strict position budget", `${summary.strictBudgetPositionRmsKm} km`, claim.status),
        metric("strict-velocity-budget", "Strict velocity budget", `${summary.strictBudgetVelocityRmsMs} m/s`, claim.status),
        metric("strict-mercury-ratio-budget", "Strict Mercury ratio budget", String(summary.strictBudgetMercuryRatio), claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 runtime default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("background-mutation", "Background mutation", summary.backgroundMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
      ],
      confidenceRationale:
        "The runtime ledger reports deterministic pending metadata; measured migration rows are produced by the separate heavy v89 command.",
      assumptions: [
        "The default scientific gate command is intentionally migrated in v89.",
        "The legacy v75 command remains available as rollback and blocker-preservation evidence.",
      ],
      limitations: [
        "Does not relax v75 budgets, mutate live runtime physics, or claim NASA/JPL precision certification.",
        "Does not modify worker physics, RK4 runtime defaults, EIH 1PN, Kerr, materials, backgrounds, V9 sky assets or product gate semantics.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function horizonsProvenanceFreezeClaim(): EvidenceClaim {
  const summary = createAtlasHorizonsProvenanceFreezeSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "horizons-provenance-freeze",
    group: "horizons-provenance-freeze",
    title: "Horizons Provenance Freeze",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Horizons Provenance Freeze ${ATLAS_HORIZONS_PROVENANCE_FREEZE_VERSION}`,
    model:
      "Freeze v90 command ownership, fixture hashes, v75 budgets, legacy blocker evidence and offline-only migration boundary",
    metric: `${summary.status}; ${summary.classification}; ${summary.completedFreezeRowCount}/${summary.freezeRowCount} freeze rows complete`,
    error:
      "No runtime pass/fail is claimed by the app; measured hash and command locks are produced by the separate heavy v90 command.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasHorizonsProvenanceFreezeAudit",
        "runAtlasDefaultStrictHorizonsMigrationAudit",
        "v89 migrated default strict gate",
        "v84 outer-system barycenter fixture hash",
        "legacy v75 blocker fixture hash",
        ATLAS_HORIZONS_PROVENANCE_FREEZE_VERSION,
      ],
      method:
        "Lock the migrated offline strict Horizons gate contract by auditing scripts, fixture hashes, fixture provenance, v75 budgets, legacy blocker preservation and documentation boundary text.",
      metrics: [
        metric("horizons-provenance-freeze-version", "Freeze version", summary.version, claim.status),
        metric("horizons-provenance-freeze-profile", "Freeze profile", summary.freezeProfile, claim.status),
        metric("horizons-provenance-freeze-status", "Freeze status", summary.status, claim.status),
        metric("horizons-provenance-freeze-classification", "Classification", summary.classification, claim.status),
        metric("freeze-row-count", "Freeze row count", String(summary.freezeRowCount), claim.status),
        metric("completed-freeze-row-count", "Completed freeze row count", String(summary.completedFreezeRowCount), claim.status),
        metric("ready-freeze-row", "Ready freeze row", summary.readyFreezeRowId || "pending", claim.status),
        metric("provenance-freeze", "Provenance freeze", summary.provenanceFreeze, claim.status),
        metric("strict-position-budget", "Strict position budget", `${summary.strictBudgetPositionRmsKm} km`, claim.status),
        metric("strict-velocity-budget", "Strict velocity budget", `${summary.strictBudgetVelocityRmsMs} m/s`, claim.status),
        metric("strict-mercury-ratio-budget", "Strict Mercury ratio budget", String(summary.strictBudgetMercuryRatio), claim.status),
        metric("default-gate-config-mutation", "Default gate config mutation", summary.defaultGateConfigMutation, claim.status),
        metric("legacy-audit-mutation", "Legacy audit mutation", summary.legacyAuditMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 runtime default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("background-mutation", "Background mutation", summary.backgroundMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
      ],
      confidenceRationale:
        "The runtime ledger reports deterministic pending metadata; measured hash, script and docs locks are produced by the separate heavy v90 command.",
      assumptions: [
        "v89 is the intentional migration point for the default offline scientific gate.",
        "The v84 and legacy v75 fixture files are immutable unless a later version updates the frozen hash contract.",
      ],
      limitations: [
        "Does not regenerate Horizons fixture data, relax v75 budgets, mutate live runtime physics, or claim NASA/JPL precision certification.",
        "Does not modify worker physics, RK4 runtime defaults, EIH 1PN, Kerr, materials, backgrounds, V9 sky assets or product gate semantics.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function offlineRuntimeBoundaryAuditClaim(): EvidenceClaim {
  const summary = createAtlasOfflineRuntimeBoundaryAuditSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "offline-runtime-boundary-audit",
    group: "offline-runtime-boundary-audit",
    title: "Offline vs Runtime Boundary Audit",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Offline Runtime Boundary Audit ${ATLAS_OFFLINE_RUNTIME_BOUNDARY_AUDIT_VERSION}`,
    model:
      "Lock the migrated offline strict Horizons gate boundary away from live runtime physics, worker physics, RK4/EIH/Kerr and NASA/JPL certification claims",
    metric: `${summary.status}; ${summary.classification}; ${summary.completedBoundaryRowCount}/${summary.boundaryRowCount} boundary rows complete`,
    error:
      "No runtime command status is claimed by the app; measured surface and docs locks are produced by the separate heavy v91 command.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasOfflineRuntimeBoundaryAudit",
        "runAtlasHorizonsProvenanceFreezeAudit",
        "v90 provenance freeze",
        "v89 migrated default strict gate",
        "Evidence Ledger and Validation Console boundary surfaces",
        ATLAS_OFFLINE_RUNTIME_BOUNDARY_AUDIT_VERSION,
      ],
      method:
        "Audit package commands, docs, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text, protected mutation flags and certification boundary language.",
      metrics: [
        metric("offline-runtime-boundary-audit-version", "Boundary audit version", summary.version, claim.status),
        metric("offline-runtime-boundary-audit-profile", "Boundary audit profile", summary.boundaryProfile, claim.status),
        metric("offline-runtime-boundary-audit-status", "Boundary audit status", summary.status, claim.status),
        metric("offline-runtime-boundary-audit-classification", "Classification", summary.classification, claim.status),
        metric("boundary-row-count", "Boundary row count", String(summary.boundaryRowCount), claim.status),
        metric("completed-boundary-row-count", "Completed boundary row count", String(summary.completedBoundaryRowCount), claim.status),
        metric("ready-boundary-row", "Ready boundary row", summary.readyBoundaryRowId || "pending", claim.status),
        metric("offline-runtime-boundary-audit", "Offline/runtime boundary audit", summary.offlineRuntimeBoundaryAudit, claim.status),
        metric("strict-position-budget", "Strict position budget", `${summary.strictBudgetPositionRmsKm} km`, claim.status),
        metric("strict-velocity-budget", "Strict velocity budget", `${summary.strictBudgetVelocityRmsMs} m/s`, claim.status),
        metric("strict-mercury-ratio-budget", "Strict Mercury ratio budget", String(summary.strictBudgetMercuryRatio), claim.status),
        metric("default-gate-config-mutation", "Default gate config mutation", summary.defaultGateConfigMutation, claim.status),
        metric("live-physics-mutation", "Live physics mutation", summary.livePhysicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 runtime default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("background-mutation", "Background mutation", summary.backgroundMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("fixture-data-mutation", "Fixture data mutation", summary.fixtureDataMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("certification-claim-mutation", "Certification claim mutation", summary.certificationClaimMutation, claim.status),
      ],
      confidenceRationale:
        "The runtime ledger reports deterministic pending metadata; measured command, docs and surface locks are produced by the separate heavy v91 command.",
      assumptions: [
        "v89/v90 define the default offline strict scientific gate state.",
        "Runtime physics remains unchanged unless a later version explicitly migrates live physics with separate tests.",
      ],
      limitations: [
        "Does not mutate live runtime physics, worker physics, RK4, EIH 1PN, Kerr, sky, backgrounds, materials, fixtures or budgets.",
        "Does not claim NASA/JPL certification, online validation, or latest command pass/fail from inside the runtime app.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function scientificGateMaintenanceRunbookClaim(): EvidenceClaim {
  const summary = createAtlasScientificGateMaintenanceRunbookSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "scientific-gate-maintenance-runbook",
    group: "scientific-gate-maintenance-runbook",
    title: "Scientific Gate Maintenance Runbook",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Scientific Gate Maintenance Runbook ${ATLAS_SCIENTIFIC_GATE_MAINTENANCE_RUNBOOK_VERSION}`,
    model:
      "Lock the migrated offline strict Horizons gate maintenance commands, release verification, rollback audit and failure-handling boundaries",
    metric: `${summary.status}; ${summary.classification}; ${summary.completedRunbookRowCount}/${summary.runbookRowCount} runbook rows complete`,
    error:
      "No runtime command result is claimed by the app; measured command, docs, rollback and surface locks are produced by the separate heavy v92 command.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasScientificGateMaintenanceRunbookAudit",
        "runAtlasOfflineRuntimeBoundaryAudit",
        "runAtlasHorizonsProvenanceFreezeAudit",
        "v89 migrated default strict gate",
        "legacy v75 rollback/blocker audit command",
        ATLAS_SCIENTIFIC_GATE_MAINTENANCE_RUNBOOK_VERSION,
      ],
      method:
        "Audit package commands, docs, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text, rollback-contract language and protected mutation flags.",
      metrics: [
        metric("scientific-gate-runbook-version", "Runbook version", summary.version, claim.status),
        metric("scientific-gate-runbook-profile", "Runbook profile", summary.runbookProfile, claim.status),
        metric("scientific-gate-runbook-status", "Runbook status", summary.status, claim.status),
        metric("scientific-gate-runbook-classification", "Classification", summary.classification, claim.status),
        metric("runbook-row-count", "Runbook row count", String(summary.runbookRowCount), claim.status),
        metric("completed-runbook-row-count", "Completed runbook row count", String(summary.completedRunbookRowCount), claim.status),
        metric("ready-runbook-row", "Ready runbook row", summary.readyRunbookRowId || "pending", claim.status),
        metric("scientific-gate-maintenance-runbook", "Scientific gate maintenance runbook", summary.scientificGateMaintenanceRunbook, claim.status),
        metric("migrated-default-fixture", "Migrated default fixture", summary.migratedDefaultFixturePath, claim.status),
        metric("legacy-v75-fixture", "Legacy v75 fixture", summary.legacyV75FixturePath, claim.status),
        metric("strict-position-budget", "Strict position budget", `${summary.strictBudgetPositionRmsKm} km`, claim.status),
        metric("strict-velocity-budget", "Strict velocity budget", `${summary.strictBudgetVelocityRmsMs} m/s`, claim.status),
        metric("strict-mercury-ratio-budget", "Strict Mercury ratio budget", String(summary.strictBudgetMercuryRatio), claim.status),
        metric("default-gate-config-mutation", "Default gate config mutation", summary.defaultGateConfigMutation, claim.status),
        metric("live-physics-mutation", "Live physics mutation", summary.livePhysicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 runtime default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("background-mutation", "Background mutation", summary.backgroundMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("fixture-data-mutation", "Fixture data mutation", summary.fixtureDataMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("certification-claim-mutation", "Certification claim mutation", summary.certificationClaimMutation, claim.status),
      ],
      confidenceRationale:
        "The runtime ledger reports deterministic pending metadata; measured command, rollback and docs locks are produced by the separate heavy v92 command.",
      assumptions: [
        "v89 is the intentional migration point for the default offline scientific gate.",
        "The legacy v75 command remains rollback/blocker evidence only.",
      ],
      limitations: [
        "Does not introduce a new scientific model, reconfigure the default gate, mutate live runtime physics, or regenerate fixtures.",
        "Does not claim NASA/JPL certification, online validation, or latest command pass/fail from inside the runtime app.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function scientificGateReleaseEvidenceClaim(): EvidenceClaim {
  const summary = createAtlasScientificGateReleaseEvidenceSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "scientific-gate-release-evidence",
    group: "scientific-gate-release-evidence",
    title: "Scientific Gate Release Evidence",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Scientific Gate Release Evidence ${ATLAS_SCIENTIFIC_GATE_RELEASE_EVIDENCE_VERSION}`,
    model:
      "Lock the release evidence bundle for the migrated offline strict Horizons gate, fixture freeze, runtime boundary and maintenance runbook",
    metric: `${summary.status}; ${summary.classification}; ${summary.completedReleaseEvidenceRowCount}/${summary.releaseEvidenceRowCount} release evidence rows complete`,
    error:
      "No runtime command result is claimed by the app; measured release evidence, command matrix, fixture, docs and surface locks are produced by the separate heavy v93 command.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasScientificGateReleaseEvidenceAudit",
        "runAtlasScientificGateMaintenanceRunbookAudit",
        "runAtlasOfflineRuntimeBoundaryAudit",
        "runAtlasHorizonsProvenanceFreezeAudit",
        "v89 migrated default strict gate",
        "legacy v75 rollback/blocker audit command",
        ATLAS_SCIENTIFIC_GATE_RELEASE_EVIDENCE_VERSION,
      ],
      method:
        "Audit package commands, docs, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text, fixture evidence, release screenshot contract and protected mutation flags.",
      metrics: [
        metric("scientific-gate-release-evidence-version", "Release evidence version", summary.version, claim.status),
        metric("scientific-gate-release-evidence-profile", "Release evidence profile", summary.releaseEvidenceProfile, claim.status),
        metric("scientific-gate-release-evidence-status", "Release evidence status", summary.status, claim.status),
        metric("scientific-gate-release-evidence-classification", "Classification", summary.classification, claim.status),
        metric("release-evidence-row-count", "Release evidence row count", String(summary.releaseEvidenceRowCount), claim.status),
        metric("completed-release-evidence-row-count", "Completed release evidence row count", String(summary.completedReleaseEvidenceRowCount), claim.status),
        metric("ready-release-evidence-row", "Ready release evidence row", summary.readyReleaseEvidenceRowId || "pending", claim.status),
        metric("scientific-gate-release-evidence", "Scientific gate release evidence", summary.scientificGateReleaseEvidence, claim.status),
        metric("migrated-default-fixture", "Migrated default fixture", summary.migratedDefaultFixturePath, claim.status),
        metric("legacy-v75-fixture", "Legacy v75 fixture", summary.legacyV75FixturePath, claim.status),
        metric("migrated-fixture-sha256", "Migrated fixture SHA256", summary.migratedFixtureSha256, claim.status),
        metric("legacy-fixture-sha256", "Legacy fixture SHA256", summary.legacyFixtureSha256, claim.status),
        metric("strict-position-budget", "Strict position budget", `${summary.strictBudgetPositionRmsKm} km`, claim.status),
        metric("strict-velocity-budget", "Strict velocity budget", `${summary.strictBudgetVelocityRmsMs} m/s`, claim.status),
        metric("strict-mercury-ratio-budget", "Strict Mercury ratio budget", String(summary.strictBudgetMercuryRatio), claim.status),
        metric("default-gate-config-mutation", "Default gate config mutation", summary.defaultGateConfigMutation, claim.status),
        metric("legacy-audit-config-mutation", "Legacy audit config mutation", summary.legacyAuditConfigMutation, claim.status),
        metric("live-physics-mutation", "Live physics mutation", summary.livePhysicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 runtime default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("background-mutation", "Background mutation", summary.backgroundMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("fixture-data-mutation", "Fixture data mutation", summary.fixtureDataMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("certification-claim-mutation", "Certification claim mutation", summary.certificationClaimMutation, claim.status),
      ],
      confidenceRationale:
        "The runtime ledger reports deterministic pending metadata; measured release evidence, command, fixture, docs and surface locks are produced by the separate heavy v93 command.",
      assumptions: [
        "v89 is the intentional migration point for the default offline scientific gate.",
        "v90 freezes fixture and command provenance; v91 locks offline/runtime wording; v92 locks the maintenance runbook.",
        "The legacy v75 command remains rollback/blocker evidence only.",
      ],
      limitations: [
        "Does not introduce a new scientific model, reconfigure the default gate, mutate live runtime physics, or regenerate fixtures.",
        "Does not claim NASA/JPL certification, online validation, or latest command pass/fail from inside the runtime app.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function browserCiStabilityLockClaim(): EvidenceClaim {
  const summary = createAtlasBrowserCiStabilityLockSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "browser-ci-stability-lock",
    group: "browser-ci-stability-lock",
    title: "Browser CI Stability Lock",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Browser CI Stability Lock ${ATLAS_BROWSER_CI_STABILITY_LOCK_VERSION}`,
    model:
      "Lock fresh browser acceptance stability, screenshot retry, pixel settle sampling, fresh server teardown, command ownership and known Windows Watchpack noise",
    metric: `${summary.status}; ${summary.classification}; ${summary.completedStabilityRowCount}/${summary.stabilityRowCount} stability rows complete`,
    error:
      "No runtime command result is claimed by the app; measured screenshot, pixel settle, fresh server, command, docs and surface locks are produced by the separate heavy v94 command.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasBrowserCiStabilityLockAudit",
        "runAtlasScientificGateReleaseEvidenceAudit",
        "playwright.atlas.fresh.config.ts",
        "tests/atlas-browser/atlas-browser-acceptance.spec.ts",
        ATLAS_BROWSER_CI_STABILITY_LOCK_VERSION,
      ],
      method:
        "Audit package commands, fresh Playwright config, screenshot retry helper, pixel settle helpers, docs, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text and protected mutation flags.",
      metrics: [
        metric("browser-ci-stability-lock-version", "Browser CI lock version", summary.version, claim.status),
        metric("browser-ci-stability-lock-profile", "Browser CI profile", summary.stabilityProfile, claim.status),
        metric("browser-ci-stability-lock-status", "Browser CI status", summary.status, claim.status),
        metric("browser-ci-stability-lock-classification", "Classification", summary.classification, claim.status),
        metric("browser-ci-stability-row-count", "Stability row count", String(summary.stabilityRowCount), claim.status),
        metric("completed-browser-ci-stability-row-count", "Completed stability row count", String(summary.completedStabilityRowCount), claim.status),
        metric("ready-browser-ci-stability-row", "Ready stability row", summary.readyStabilityRowId || "pending", claim.status),
        metric("browser-fresh-command", "Fresh browser command", summary.browserFreshCommand, claim.status),
        metric("browser-ci-stability-command", "Browser CI stability command", summary.browserCiStabilityCommand, claim.status),
        metric("fresh-browser-port", "Fresh browser port", String(summary.freshBrowserPort), claim.status),
        metric("screenshot-retry-attempts", "Screenshot retry attempts", String(summary.screenshotRetryAttempts), claim.status),
        metric("pixel-settle-attempts", "Pixel settle attempts", String(summary.pixelSettleAttempts), claim.status),
        metric("watchpack-warning-policy", "Watchpack warning policy", summary.watchpackWarningPolicy, claim.status),
        metric("browser-ci-stability-lock", "Browser CI stability lock", summary.browserCiStabilityLock, claim.status),
        metric("live-physics-mutation", "Live physics mutation", summary.livePhysicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 runtime default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("background-mutation", "Background mutation", summary.backgroundMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("fixture-data-mutation", "Fixture data mutation", summary.fixtureDataMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("default-gate-config-mutation", "Default gate config mutation", summary.defaultGateConfigMutation, claim.status),
        metric("certification-claim-mutation", "Certification claim mutation", summary.certificationClaimMutation, claim.status),
      ],
      confidenceRationale:
        "The runtime ledger reports deterministic pending metadata; measured browser CI locks are produced by the separate heavy v94 command.",
      assumptions: [
        "v94 is a browser and CI stability lock, not a scientific model, visual model or live runtime migration.",
        "Fresh Playwright acceptance remains the official browser evidence path.",
        "Known Windows Watchpack warnings are documented environment noise, not pass/fail criteria.",
      ],
      limitations: [
        "Does not change browser visual thresholds, scientific gate configuration, fixtures, live physics, sky/background assets, or v75 budgets.",
        "Does not claim NASA/JPL certification, online validation, or latest browser command pass/fail from inside the runtime app.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function releaseArtifactManifestLockClaim(): EvidenceClaim {
  const summary = createAtlasReleaseArtifactManifestLockSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "release-artifact-manifest-lock",
    group: "release-artifact-manifest-lock",
    title: "Release Artifact Manifest Lock",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Release Artifact Manifest Lock ${ATLAS_RELEASE_ARTIFACT_MANIFEST_LOCK_VERSION}`,
    model:
      "Lock deterministic release artifact manifest metadata over v93 release evidence and v94 browser CI stability evidence",
    metric: `${summary.status}; ${summary.classification}; ${summary.completedManifestRowCount}/${summary.manifestRowCount} manifest rows complete`,
    error:
      "No runtime command result or release package is claimed by the app; measured command, fixture, browser artifact, docs, rollback and mutation locks are produced by the separate heavy v95 command.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasReleaseArtifactManifestLockAudit",
        "runAtlasBrowserCiStabilityLockAudit",
        "runAtlasScientificGateReleaseEvidenceAudit",
        "package.json",
        "tests/atlas-browser/atlas-browser-acceptance.spec.ts",
        ATLAS_RELEASE_ARTIFACT_MANIFEST_LOCK_VERSION,
      ],
      method:
        "Audit package commands, v93/v94 readiness, fixture hashes and provenance, browser screenshot path contracts, fresh teardown policy, docs, rollback boundary text, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text and protected mutation flags.",
      metrics: [
        metric("release-artifact-manifest-lock-version", "Artifact manifest version", summary.version, claim.status),
        metric("release-artifact-manifest-lock-profile", "Artifact manifest profile", summary.artifactManifestProfile, claim.status),
        metric("release-artifact-manifest-lock-status", "Artifact manifest status", summary.status, claim.status),
        metric("release-artifact-manifest-lock-classification", "Classification", summary.classification, claim.status),
        metric("release-artifact-manifest-row-count", "Manifest row count", String(summary.manifestRowCount), claim.status),
        metric("completed-release-artifact-manifest-row-count", "Completed manifest row count", String(summary.completedManifestRowCount), claim.status),
        metric("ready-release-artifact-manifest-row", "Ready manifest row", summary.readyManifestRowId || "pending", claim.status),
        metric("product-full-command", "Product full command", summary.productFullCommand, claim.status),
        metric("scientific-verify-command", "Scientific verify command", summary.scientificVerifyCommand, claim.status),
        metric("release-evidence-command", "Release evidence command", summary.releaseEvidenceCommand, claim.status),
        metric("browser-ci-stability-command", "Browser CI stability command", summary.browserCiStabilityCommand, claim.status),
        metric("browser-fresh-command", "Fresh browser command", summary.browserFreshCommand, claim.status),
        metric("fresh-browser-port", "Fresh browser port", String(summary.freshBrowserPort), claim.status),
        metric("v93-screenshot-glob", "v93 screenshot glob", summary.v93ScreenshotGlob, claim.status),
        metric("v94-screenshot-glob", "v94 screenshot glob", summary.v94ScreenshotGlob, claim.status),
        metric("migrated-default-fixture", "Migrated default fixture", summary.migratedDefaultFixturePath, claim.status),
        metric("legacy-v75-fixture", "Legacy v75 fixture", summary.legacyV75FixturePath, claim.status),
        metric("migrated-fixture-sha256", "Migrated fixture SHA256", summary.migratedFixtureSha256, claim.status),
        metric("legacy-fixture-sha256", "Legacy fixture SHA256", summary.legacyFixtureSha256, claim.status),
        metric("rollback-interpretation", "Rollback interpretation", summary.rollbackInterpretation, claim.status),
        metric("release-artifact-manifest-lock", "Release artifact manifest lock", summary.releaseArtifactManifestLock, claim.status),
        metric("live-physics-mutation", "Live physics mutation", summary.livePhysicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 runtime default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("background-mutation", "Background mutation", summary.backgroundMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("fixture-data-mutation", "Fixture data mutation", summary.fixtureDataMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("default-gate-config-mutation", "Default gate config mutation", summary.defaultGateConfigMutation, claim.status),
        metric("release-packaging-mutation", "Release packaging mutation", summary.releasePackagingMutation, claim.status),
        metric("certification-claim-mutation", "Certification claim mutation", summary.certificationClaimMutation, claim.status),
      ],
      confidenceRationale:
        "The runtime ledger reports deterministic pending metadata; measured artifact manifest locks are produced by the separate heavy v95 command.",
      assumptions: [
        "v95 is an artifact manifest lock, not a release archive, scientific model, browser stability rewrite or visual upgrade.",
        "v93 release evidence and v94 browser CI stability remain the source evidence layers.",
        "The legacy v75 command remains rollback/blocker evidence only.",
      ],
      limitations: [
        "Does not create a release zip or tarball, regenerate fixtures, change scientific gate configuration, mutate live physics, alter sky/background assets, or relax v75 budgets.",
        "Does not claim NASA/JPL certification, online validation, or latest command pass/fail from inside the runtime app.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function finalMaintenanceBaselineClaim(): EvidenceClaim {
  const summary = createAtlasFinalMaintenanceBaselineSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "final-maintenance-baseline",
    group: "final-maintenance-baseline",
    title: "Final Maintenance Baseline",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Final Maintenance Baseline ${ATLAS_FINAL_MAINTENANCE_BASELINE_VERSION}`,
    model:
      "Lock final offline maintenance entrypoints, v90-v95 evidence chain and post-v96 scientific mainline policy",
    metric: `${summary.status}; ${summary.classification}; ${summary.completedBaselineRowCount}/${summary.baselineRowCount} baseline rows complete`,
    error:
      "No runtime command result, release package or scientific upgrade is claimed by the app; measured final maintenance locks are produced by the separate heavy v96 command.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasFinalMaintenanceBaselineAudit",
        "runAtlasReleaseArtifactManifestLockAudit",
        "runAtlasBrowserCiStabilityLockAudit",
        "runAtlasScientificGateReleaseEvidenceAudit",
        "package.json",
        ATLAS_FINAL_MAINTENANCE_BASELINE_VERSION,
      ],
      method:
        "Audit final product/scientific entrypoints, v90-v95 evidence chain, docs, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text, browser acceptance markers, post-baseline policy and protected mutation flags.",
      metrics: [
        metric("final-maintenance-baseline-version", "Final baseline version", summary.version, claim.status),
        metric("final-maintenance-baseline-profile", "Final baseline profile", summary.maintenanceBaselineProfile, claim.status),
        metric("final-maintenance-baseline-status", "Final baseline status", summary.status, claim.status),
        metric("final-maintenance-baseline-classification", "Classification", summary.classification, claim.status),
        metric("final-maintenance-baseline-row-count", "Baseline row count", String(summary.baselineRowCount), claim.status),
        metric("completed-final-maintenance-baseline-row-count", "Completed baseline row count", String(summary.completedBaselineRowCount), claim.status),
        metric("ready-final-maintenance-baseline-row", "Ready baseline row", summary.readyBaselineRowId || "pending", claim.status),
        metric("product-full-command", "Product full command", summary.productFullCommand, claim.status),
        metric("scientific-verify-command", "Scientific verify command", summary.scientificVerifyCommand, claim.status),
        metric("release-artifact-manifest-command", "Release artifact manifest command", summary.releaseArtifactManifestCommand, claim.status),
        metric("browser-ci-stability-command", "Browser CI stability command", summary.browserCiStabilityCommand, claim.status),
        metric("release-evidence-command", "Release evidence command", summary.releaseEvidenceCommand, claim.status),
        metric("maintenance-runbook-command", "Maintenance runbook command", summary.maintenanceRunbookCommand, claim.status),
        metric("provenance-freeze-command", "Provenance freeze command", summary.provenanceFreezeCommand, claim.status),
        metric("offline-runtime-boundary-command", "Offline/runtime boundary command", summary.offlineRuntimeBoundaryCommand, claim.status),
        metric("migrated-strict-gate-command", "Migrated strict gate command", summary.migratedStrictGateCommand, claim.status),
        metric("legacy-v75-audit-command", "Legacy v75 audit command", summary.legacyV75AuditCommand, claim.status),
        metric("browser-fresh-command", "Fresh browser command", summary.browserFreshCommand, claim.status),
        metric("final-baseline-policy", "Final baseline policy", summary.finalBaselinePolicy, claim.status),
        metric("final-maintenance-baseline", "Final maintenance baseline", summary.finalMaintenanceBaseline, claim.status),
        metric("live-physics-mutation", "Live physics mutation", summary.livePhysicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 runtime default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("background-mutation", "Background mutation", summary.backgroundMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("fixture-data-mutation", "Fixture data mutation", summary.fixtureDataMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("default-gate-config-mutation", "Default gate config mutation", summary.defaultGateConfigMutation, claim.status),
        metric("release-packaging-mutation", "Release packaging mutation", summary.releasePackagingMutation, claim.status),
        metric("certification-claim-mutation", "Certification claim mutation", summary.certificationClaimMutation, claim.status),
      ],
      confidenceRationale:
        "The runtime ledger reports deterministic pending metadata; measured final maintenance locks are produced by the separate heavy v96 command.",
      assumptions: [
        "v96 is the final maintenance baseline, not a release archive, scientific model, browser stability rewrite or visual upgrade.",
        "v90-v95 remain the maintained evidence chain for provenance, boundary, runbook, release evidence, browser CI and artifact manifest locks.",
        "Gaia/constellation/art/relativity optimization remains post-baseline and outside the scientific gate closeout.",
      ],
      limitations: [
        "Does not create a release package, regenerate fixtures, change scientific gate configuration, mutate live physics, alter sky/background assets, or relax v75 budgets.",
        "Does not claim NASA/JPL certification, online validation, or latest command pass/fail from inside the runtime app.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function gaiaStarfieldEnhancementClaim(): EvidenceClaim {
  const summary = createAtlasGaiaStarfieldEnhancementSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "gaia-starfield-enhancement",
    group: "gaia-starfield-enhancement",
    title: "Gaia Starfield / Constellation Enhancement",
    status: "informational",
    confidence: "catalog-backed",
    source: `Atlas Gaia Starfield Enhancement ${ATLAS_GAIA_STARFIELD_ENHANCEMENT_VERSION}`,
    model:
      "Budgeted Gaia bright-star, IAU constellation and curated nebula presentation overlay over the v96 baseline",
    metric: `${summary.status}; ${summary.classification}; budget ${summary.activeGaiaRenderBudget}; constellations ${summary.normalizedIauConstellationCount}/88; nebulae ${summary.nebulaMarkerCount}`,
    error:
      "No runtime command result or official catalog certification is claimed by the app; measured overlay locks are produced by the separate heavy v97 command.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasGaiaStarfieldEnhancementAudit",
        "public/data/gaia-dr3-bright-5000.json",
        "public/data/gaia-dr3-kinematics-2000.json",
        "app/data/constellationCatalog.ts",
        "app/data/nebulaCatalog.ts",
        "GaiaStarOverlay",
        ATLAS_GAIA_STARFIELD_ENHANCEMENT_VERSION,
      ],
      method:
        "Audit packaged Gaia row counts, 88-constellation normalized presentation contract, curated nebula marker count, fixed mobile/balanced/dense star budgets, V9 sky identity, docs, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text, browser acceptance markers and protected mutation flags.",
      metrics: [
        metric("gaia-starfield-enhancement-version", "Gaia overlay version", summary.version, claim.status),
        metric("gaia-starfield-enhancement-profile", "Gaia overlay profile", summary.overlayProfile, claim.status),
        metric("gaia-starfield-enhancement-status", "Gaia overlay status", summary.status, claim.status),
        metric("gaia-starfield-enhancement-classification", "Classification", summary.classification, claim.status),
        metric("gaia-overlay-quality-tier", "Quality tier", summary.qualityTier, claim.status),
        metric("gaia-overlay-active-budget", "Active Gaia render budget", String(summary.activeGaiaRenderBudget), claim.status),
        metric("gaia-overlay-mobile-budget", "Mobile Gaia render budget", String(summary.renderBudget.mobile), claim.status),
        metric("gaia-overlay-balanced-budget", "Balanced Gaia render budget", String(summary.renderBudget.balanced), claim.status),
        metric("gaia-overlay-dense-budget", "Dense Gaia render budget", String(summary.renderBudget.dense), claim.status),
        metric("gaia-bright-row-count", "Packaged Gaia bright rows", String(summary.packagedGaiaBrightRowCount), claim.status),
        metric("gaia-kinematics-row-count", "Packaged Gaia kinematics rows", String(summary.packagedGaiaKinematicsRowCount), claim.status),
        metric("normalized-iau-constellation-count", "Normalized IAU constellation count", String(summary.normalizedIauConstellationCount), claim.status),
        metric("constellation-render-group-count", "Constellation render groups", String(summary.constellationRenderGroupCount), claim.status),
        metric("nebula-marker-count", "Curated nebula markers", String(summary.nebulaMarkerCount), claim.status),
        metric("default-activation-policy", "Default activation policy", summary.defaultActivationPolicy, claim.status),
        metric("mobile-downgrade-policy", "Mobile downgrade policy", summary.mobileDowngradePolicy, claim.status),
        metric("closeup-suppression-policy", "Closeup suppression policy", summary.closeupSuppressionPolicy, claim.status),
        metric("full-gaia-archive-policy", "Full Gaia archive policy", summary.fullGaiaArchivePolicy, claim.status),
        metric("official-certification-policy", "Official certification policy", summary.officialCertificationPolicy, claim.status),
        metric("gaia-starfield-enhancement", "Gaia starfield enhancement", summary.gaiaStarfieldEnhancement, claim.status),
        metric("live-physics-mutation", "Live physics mutation", summary.livePhysicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 runtime default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("background-mutation", "Background mutation", summary.backgroundMutation, claim.status),
        metric("v9-sky-direction-mutation", "V9 sky direction mutation", summary.v9SkyDirectionMutation, claim.status),
        metric("fixture-data-mutation", "Fixture data mutation", summary.fixtureDataMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("certification-claim-mutation", "Certification claim mutation", summary.certificationClaimMutation, claim.status),
      ],
      confidenceRationale:
        "Catalog-backed for the packaged Gaia subset and local curated catalogs; the runtime claim remains informational until the separate v97 heavy audit is run.",
      assumptions: [
        "v97 is a presentation overlay after the v96 maintenance baseline, not a scientific gate or model migration.",
        "Gaia bright 5000 and Gaia kinematics 2000 are packaged subsets, not the full Gaia archive.",
        "ORBIT_ATLAS_SKY === ORBIT_ATLAS_V9_SKY and GalaxyEnvironmentSphere legacy V9 background direction remain protected.",
      ],
      limitations: [
        "Does not claim Gaia official certification, NASA/JPL certification, full-archive completeness, online validation, or latest command pass/fail from inside the runtime app.",
        "Does not regenerate fixtures, mutate live physics, alter RK4/EIH/Kerr, replace sky/background assets, or relax v75 budgets.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function relativitySimulationOptimizationClaim(): EvidenceClaim {
  const summary = createAtlasRelativitySimulationOptimizationSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "relativity-simulation-optimization",
    group: "relativity-simulation-optimization",
    title: "Relativity Simulation Optimization",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Relativity Simulation Optimization ${ATLAS_RELATIVITY_SIMULATION_OPTIMIZATION_VERSION}`,
    model:
      "Teaching observability layer over Observable Atlas, Kerr Studio, weak-field readouts and optional read-only performance HUD",
    metric: `${summary.status}; ${summary.classification}; readouts ${summary.readyReadoutCount}/${summary.readoutCount}; kernel ${summary.kerrKernelId}`,
    error:
      "No runtime command result or scientific model upgrade is claimed by the app; measured relativity optimization locks are produced by the separate heavy v98 command.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasRelativitySimulationOptimizationAudit",
        "createRelativityObservableAtlasSummary",
        "createKerrRelativityStudioSummary",
        "createAtlasRelativityVerificationSummary",
        "createAtlasRelativityChartSummary",
        ATLAS_RELATIVITY_SIMULATION_OPTIMIZATION_VERSION,
      ],
      method:
        "Audit package scripts, Observable Atlas markers, Kerr Studio markers, weak-field/Kerr/numerical-health readout split, optional read-only HUD policy, docs, root DOM markers, Evidence claim text, Validation domain text, browser acceptance markers and protected physics mutation flags.",
      metrics: [
        metric("relativity-simulation-optimization-version", "Relativity optimization version", summary.version, claim.status),
        metric("relativity-simulation-optimization-profile", "Relativity optimization profile", summary.optimizationProfile, claim.status),
        metric("relativity-simulation-optimization-status", "Relativity optimization status", summary.status, claim.status),
        metric("relativity-simulation-optimization-classification", "Classification", summary.classification, claim.status),
        metric("observable-atlas-version", "Observable Atlas version", summary.observableAtlasVersion, claim.status),
        metric("explainer-version", "Explainer version", summary.explainerVersion, claim.status),
        metric("guided-tour-version", "Guided tour version", summary.guidedTourVersion, claim.status),
        metric("verification-version", "Verification version", summary.verificationVersion, claim.status),
        metric("chart-version", "Chart version", summary.chartVersion, claim.status),
        metric("kerr-studio-version", "Kerr Studio version", summary.kerrStudioVersion, claim.status),
        metric("kerr-kernel-id", "Kerr kernel id", summary.kerrKernelId, claim.status),
        metric("weak-field-observable-count", "Weak-field observable count", String(summary.weakFieldObservableCount), claim.status),
        metric("strong-field-readout-count", "Strong-field readout count", String(summary.strongFieldReadoutCount), claim.status),
        metric("numerical-health-metric-count", "Numerical health metric count", String(summary.numericalHealthMetricCount), claim.status),
        metric("performance-hud-policy", "Performance HUD policy", summary.performanceHudPolicy, claim.status),
        metric("scientific-model-upgrade-policy", "Scientific model upgrade policy", summary.scientificModelUpgradePolicy, claim.status),
        metric("relativity-simulation-optimization", "Relativity simulation optimization", summary.relativitySimulationOptimization, claim.status),
        metric("live-physics-mutation", "Live physics mutation", summary.livePhysicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 runtime default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
        metric("fixture-data-mutation", "Fixture data mutation", summary.fixtureDataMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("certification-claim-mutation", "Certification claim mutation", summary.certificationClaimMutation, claim.status),
      ],
      confidenceRationale:
        "Formula-checked because v98 summarizes existing formula-backed weak-field and Kerr teaching summaries; the runtime claim remains informational until the separate v98 heavy audit is run.",
      assumptions: [
        "v98 is a teaching observability layer, not a scientific model upgrade.",
        "Observable Atlas v37, explainer v39, guided tour v40, verification v73, charts v74 and Kerr Studio v35 remain the source layers.",
        "The main canvas performance HUD policy remains optional, collapsed and read-only.",
      ],
      limitations: [
        "Does not mutate live physics, worker physics, RK4/DP integration, EIH 1PN, Kerr kernel id, Horizons fixtures, v75 budgets, V9 sky/background assets or v97 Gaia overlay.",
        "Does not claim full numerical relativity, Einstein field-equation solving, online validation, scientific certification, or latest command pass/fail from inside the runtime app.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function artPolishClaim(): EvidenceClaim {
  const summary = createAtlasArtPolishSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "art-polish",
    group: "art-polish",
    title: "Art Polish",
    status: "informational",
    confidence: "visual",
    source: `Atlas Art Polish ${ATLAS_ART_POLISH_VERSION}`,
    model:
      "Presentation-only Gaia overlay, constellation, nebula, selected-body closeup and mobile density polish",
    metric: `${summary.status}; ${summary.classification}; opacity mobile ${summary.opacityCaps.mobile}; dense ${summary.opacityCaps.dense}; closeup ${summary.opacityCaps.closeup}`,
    error:
      "No runtime command result, scientific model upgrade or official visual certification is claimed by the app; measured art polish locks are produced by the separate heavy v99 command.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasArtPolishAudit",
        "GaiaStarOverlay",
        "ConstellationLines",
        "NebulaMarkers",
        "UniverseScene",
        ATLAS_ART_POLISH_VERSION,
      ],
      method:
        "Audit Gaia opacity caps, v97 Gaia render budgets, constellation line restraint, nebula marker polish, selected-body closeup deemphasis, mobile label/line/nebula density restraint, V9 sky identity, docs, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text, browser acceptance markers and protected mutation flags.",
      metrics: [
        metric("art-polish-version", "Art polish version", summary.version, claim.status),
        metric("art-polish-profile", "Art polish profile", summary.artPolishProfile, claim.status),
        metric("art-polish-status", "Art polish status", summary.status, claim.status),
        metric("art-polish-classification", "Classification", summary.classification, claim.status),
        metric("gaia-mobile-budget", "Gaia mobile render budget", String(summary.gaiaRenderBudget.mobile), claim.status),
        metric("gaia-balanced-budget", "Gaia balanced render budget", String(summary.gaiaRenderBudget.balanced), claim.status),
        metric("gaia-dense-budget", "Gaia dense render budget", String(summary.gaiaRenderBudget.dense), claim.status),
        metric("mobile-opacity-cap", "Mobile opacity cap", String(summary.opacityCaps.mobile), claim.status),
        metric("balanced-opacity-cap", "Balanced opacity cap", String(summary.opacityCaps.balanced), claim.status),
        metric("dense-opacity-cap", "Dense opacity cap", String(summary.opacityCaps.dense), claim.status),
        metric("closeup-opacity-cap", "Closeup opacity cap", String(summary.opacityCaps.closeup), claim.status),
        metric("constellation-line-policy", "Constellation line policy", summary.constellationLinePolicy, claim.status),
        metric("nebula-marker-policy", "Nebula marker policy", summary.nebulaMarkerPolicy, claim.status),
        metric("closeup-readability-policy", "Closeup readability policy", summary.closeupReadabilityPolicy, claim.status),
        metric("mobile-density-policy", "Mobile density policy", summary.mobileDensityPolicy, claim.status),
        metric("official-certification-policy", "Official certification policy", summary.officialCertificationPolicy, claim.status),
        metric("art-polish", "Art polish", summary.artPolish, claim.status),
        metric("live-physics-mutation", "Live physics mutation", summary.livePhysicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 runtime default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("background-mutation", "Background mutation", summary.backgroundMutation, claim.status),
        metric("v9-sky-direction-mutation", "V9 sky direction mutation", summary.v9SkyDirectionMutation, claim.status),
        metric("fixture-data-mutation", "Fixture data mutation", summary.fixtureDataMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("certification-claim-mutation", "Certification claim mutation", summary.certificationClaimMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: v99 adjusts local presentation-layer opacity and density policies while leaving scientific and asset certification outside the runtime claim.",
      assumptions: [
        "v99 is presentation-only art polish, not a scientific gate, physics model, fixture, release artifact or sky replacement version.",
        "v97 Gaia render budgets remain mobile 1000, balanced 1800 and dense 3000.",
        "ORBIT_ATLAS_SKY === ORBIT_ATLAS_V9_SKY and GalaxyEnvironmentSphere legacy V9 background direction remain protected.",
      ],
      limitations: [
        "Does not mutate live physics, worker physics, RK4/DP, EIH 1PN, Kerr kernel id, Horizons fixtures, v75 budgets, V9 sky/background direction or release packaging.",
        "Does not claim NASA/JPL/Gaia/Universe Sandbox certification, AAA certification, online validation, or latest command pass/fail from inside the runtime app.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function postEnhancementMaintenanceBaselineClaim(): EvidenceClaim {
  const summary = createAtlasPostEnhancementMaintenanceBaselineSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "post-enhancement-maintenance-baseline",
    group: "post-enhancement-maintenance-baseline",
    title: "Post-Enhancement Maintenance Baseline",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Post-Enhancement Maintenance Baseline ${ATLAS_POST_ENHANCEMENT_BASELINE_VERSION}`,
    model:
      "Pure maintenance lock over v96 final baseline, v97 Gaia overlay, v98 teaching observability and v99 art polish",
    metric: `${summary.status}; ${summary.classification}; Gaia ${summary.gaiaRenderBudget.mobile}/${summary.gaiaRenderBudget.balanced}/${summary.gaiaRenderBudget.dense}; closeup opacity ${summary.artOpacityCaps.closeup}`,
    error:
      "No runtime command result, performance optimization, release archive, scientific model upgrade or official certification is claimed by the app; measured locks are produced by the separate heavy v100 command.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasPostEnhancementMaintenanceBaselineAudit",
        "runAtlasFinalMaintenanceBaselineAudit",
        "runAtlasGaiaStarfieldEnhancementAudit",
        "runAtlasRelativitySimulationOptimizationAudit",
        "runAtlasArtPolishAudit",
        ATLAS_POST_ENHANCEMENT_BASELINE_VERSION,
      ],
      method:
        "Reuse v96, v97, v98 and v99 heavy audits, then statically audit browser resource lifecycle policy, post-enhancement verification entrypoints, docs, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text, browser acceptance markers and protected mutation flags.",
      metrics: [
        metric("post-enhancement-baseline-version", "Post-enhancement baseline version", summary.version, claim.status),
        metric("post-enhancement-baseline-profile", "Post-enhancement baseline profile", summary.postEnhancementBaselineProfile, claim.status),
        metric("post-enhancement-baseline-status", "Post-enhancement baseline status", summary.status, claim.status),
        metric("post-enhancement-baseline-classification", "Classification", summary.classification, claim.status),
        metric("final-maintenance-baseline-version", "v96 final baseline version", summary.finalMaintenanceBaselineVersion, claim.status),
        metric("gaia-enhancement-version", "v97 Gaia overlay version", summary.gaiaEnhancementVersion, claim.status),
        metric("relativity-optimization-version", "v98 relativity optimization version", summary.relativityOptimizationVersion, claim.status),
        metric("art-polish-version", "v99 art polish version", summary.artPolishVersion, claim.status),
        metric("gaia-mobile-budget", "Gaia mobile render budget", String(summary.gaiaRenderBudget.mobile), claim.status),
        metric("gaia-balanced-budget", "Gaia balanced render budget", String(summary.gaiaRenderBudget.balanced), claim.status),
        metric("gaia-dense-budget", "Gaia dense render budget", String(summary.gaiaRenderBudget.dense), claim.status),
        metric("mobile-opacity-cap", "Mobile opacity cap", String(summary.artOpacityCaps.mobile), claim.status),
        metric("balanced-opacity-cap", "Balanced opacity cap", String(summary.artOpacityCaps.balanced), claim.status),
        metric("dense-opacity-cap", "Dense opacity cap", String(summary.artOpacityCaps.dense), claim.status),
        metric("closeup-opacity-cap", "Closeup opacity cap", String(summary.artOpacityCaps.closeup), claim.status),
        metric("post-enhancement-command", "Post-enhancement verify command", summary.postEnhancementVerifyCommand, claim.status),
        metric("browser-resource-policy", "Browser resource policy", summary.browserResourcePolicy, claim.status),
        metric("relativity-teaching-policy", "Relativity teaching policy", summary.relativityTeachingPolicy, claim.status),
        metric("post-enhancement-baseline", "Post-enhancement baseline", summary.postEnhancementBaseline, claim.status),
        metric("live-physics-mutation", "Live physics mutation", summary.livePhysicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 runtime default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("background-mutation", "Background mutation", summary.backgroundMutation, claim.status),
        metric("v9-sky-direction-mutation", "V9 sky direction mutation", summary.v9SkyDirectionMutation, claim.status),
        metric("fixture-data-mutation", "Fixture data mutation", summary.fixtureDataMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("performance-optimization-mutation", "Performance optimization mutation", summary.performanceOptimizationMutation, claim.status),
        metric("certification-claim-mutation", "Certification claim mutation", summary.certificationClaimMutation, claim.status),
      ],
      confidenceRationale:
        "Formula-checked because v100 aggregates deterministic prior audit summaries and static resource/entrypoint contracts; runtime remains informational until the separate v100 heavy audit is run.",
      assumptions: [
        "v100 is a pure maintenance lock, not a performance optimization, scientific model upgrade, release archive or visual parameter change.",
        "v95/v96 historical contracts remain immutable and are referenced rather than rewritten.",
        "v97 Gaia budgets and v99 opacity caps remain fixed.",
      ],
      limitations: [
        "Does not mutate live physics, worker physics, RK4/DP, EIH 1PN, Kerr kernel id, Horizons fixtures, v75 budgets, V9 sky/background direction, v97 Gaia budgets or v99 opacity caps.",
        "Does not claim NASA/JPL/Gaia/Universe Sandbox certification, online validation, latest command pass/fail from inside the runtime app, or a release archive.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function browserResourcePerformanceLockClaim(): EvidenceClaim {
  const summary = createAtlasBrowserResourcePerformanceSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "browser-resource-performance-lock",
    group: "browser-resource-performance-lock",
    title: "Browser Resource Performance Lock",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Browser Resource Performance Lock ${ATLAS_BROWSER_RESOURCE_PERFORMANCE_VERSION}`,
    model:
      "Browser acceptance helper resource optimization over v100 with shared screenshot pixel sampling and fresh teardown policy",
    metric: `${summary.status}; ${summary.classification}; ${summary.pixelSamplerPolicy}; ${summary.freshTeardownPolicy}`,
    error:
      "No runtime command result, scientific gate change, fixture update, runtime performance optimization, visual parameter change or official certification is claimed by the app; measured locks are produced by the separate heavy v101 command.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasBrowserResourcePerformanceAudit",
        "runAtlasPostEnhancementMaintenanceBaselineAudit",
        ATLAS_BROWSER_RESOURCE_PERFORMANCE_VERSION,
      ],
      method:
        "Reuse v100 heavy audit, then statically audit package scripts, browser acceptance screenshot retry, shared ImageBitmap/canvas pixel sampler, explicit bitmap close, canvas zeroing, fresh 3015 teardown, console/page-error observability, docs, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text and protected mutation flags.",
      metrics: [
        metric("browser-resource-performance-version", "Browser resource version", summary.version, claim.status),
        metric("browser-resource-performance-profile", "Browser resource profile", summary.browserResourcePerformanceProfile, claim.status),
        metric("browser-resource-performance-status", "Browser resource status", summary.status, claim.status),
        metric("browser-resource-performance-classification", "Classification", summary.classification, claim.status),
        metric("post-enhancement-baseline-version", "v100 baseline version", summary.postEnhancementBaselineVersion, claim.status),
        metric("browser-resource-command", "Browser resource verify command", summary.browserResourceVerifyCommand, claim.status),
        metric("browser-fresh-command", "Browser fresh command", summary.browserFreshCommand, claim.status),
        metric("screenshot-retry-policy", "Screenshot retry policy", summary.screenshotRetryPolicy, claim.status),
        metric("pixel-sampler-policy", "Pixel sampler policy", summary.pixelSamplerPolicy, claim.status),
        metric("pixel-settle-policy", "Pixel settle policy", summary.pixelSettlePolicy, claim.status),
        metric("fresh-teardown-policy", "Fresh teardown policy", summary.freshTeardownPolicy, claim.status),
        metric("console-error-policy", "Console/page-error policy", summary.consoleErrorPolicy, claim.status),
        metric("browser-resource-performance", "Allowed browser helper optimization", summary.browserResourcePerformance, claim.status),
        metric("runtime-performance-mutation", "Runtime performance mutation", summary.runtimePerformanceMutation, claim.status),
        metric("live-physics-mutation", "Live physics mutation", summary.livePhysicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 runtime default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("background-mutation", "Background mutation", summary.backgroundMutation, claim.status),
        metric("v9-sky-direction-mutation", "V9 sky direction mutation", summary.v9SkyDirectionMutation, claim.status),
        metric("fixture-data-mutation", "Fixture data mutation", summary.fixtureDataMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("release-packaging-mutation", "Release packaging mutation", summary.releasePackagingMutation, claim.status),
        metric("certification-claim-mutation", "Certification claim mutation", summary.certificationClaimMutation, claim.status),
      ],
      confidenceRationale:
        "Formula-checked because v101 aggregates the deterministic v100 audit summary and static browser resource contracts; runtime remains informational until the separate v101 heavy audit is run.",
      assumptions: [
        "v101 is a browser acceptance helper resource stability lock, not a scientific model, fixture, release artifact or sky replacement version.",
        "Screenshot thresholds, screenshot retry count, pixel settle attempts, v97 Gaia budgets and v99 opacity caps remain unchanged.",
        "Fresh browser server semantics remain fixed on 3015 with teardown.",
      ],
      limitations: [
        "Does not mutate live physics, worker physics, RK4/DP, EIH 1PN, Kerr kernel id, Horizons fixtures, v75 budgets, V9 sky/background direction, v97 Gaia budgets or v99 opacity caps.",
        "Does not claim NASA/JPL/Gaia/Universe Sandbox certification, online validation, latest command pass/fail from inside the runtime app, or a release archive.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function maintenanceEvidenceIndexClaim(): EvidenceClaim {
  const summary = createAtlasMaintenanceEvidenceIndexSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "maintenance-evidence-index",
    group: "maintenance-evidence-index",
    title: "Maintenance Evidence Index",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Maintenance Evidence Index ${ATLAS_MAINTENANCE_EVIDENCE_INDEX_VERSION}`,
    model:
      "Deterministic v93-v101 maintenance evidence, Browser QA and repo hygiene policy index over the v101 browser resource lock",
    metric: `${summary.status}; ${summary.classification}; ${summary.commandIndexPolicy}; ${summary.dirtyWorktreePolicy}`,
    error:
      "No runtime command result, worktree cleanup, staging, commit, scientific gate change, fixture update, runtime physics change, visual parameter change or official certification is claimed by the app; measured locks are produced by the separate heavy v102 command.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasMaintenanceEvidenceIndexAudit",
        "runAtlasBrowserResourcePerformanceAudit",
        ATLAS_MAINTENANCE_EVIDENCE_INDEX_VERSION,
      ],
      method:
        "Reuse the v101 heavy audit, then statically audit v93-v101 focused commands, maintenance verification entrypoints, browser screenshot artifact directories, dirty worktree policy, Windows Watchpack known non-failure noise, Browser QA evidence, docs, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text and protected mutation flags.",
      metrics: [
        metric("maintenance-evidence-index-version", "Maintenance evidence version", summary.version, claim.status),
        metric("maintenance-evidence-index-profile", "Maintenance evidence profile", summary.maintenanceEvidenceIndexProfile, claim.status),
        metric("maintenance-evidence-index-status", "Maintenance evidence status", summary.status, claim.status),
        metric("maintenance-evidence-index-classification", "Classification", summary.classification, claim.status),
        metric("browser-resource-performance-version", "v101 browser resource version", summary.browserResourcePerformanceVersion, claim.status),
        metric("maintenance-evidence-focused-command", "Focused audit command", summary.focusedCommand, claim.status),
        metric("maintenance-evidence-verify-command", "Maintenance evidence verify command", summary.maintenanceEvidenceVerifyCommand, claim.status),
        metric("browser-resource-verify-command", "Browser resource verify command", summary.browserResourceVerifyCommand, claim.status),
        metric("post-enhancement-verify-command", "Post-enhancement verify command", summary.postEnhancementVerifyCommand, claim.status),
        metric("scientific-verify-command", "Scientific verify command", summary.scientificVerifyCommand, claim.status),
        metric("command-index-policy", "Command index policy", summary.commandIndexPolicy, claim.status),
        metric("screenshot-artifact-policy", "Screenshot artifact policy", summary.screenshotArtifactPolicy, claim.status),
        metric("dirty-worktree-policy", "Dirty worktree policy", summary.dirtyWorktreePolicy, claim.status),
        metric("watchpack-noise-policy", "Watchpack noise policy", summary.watchpackNoisePolicy, claim.status),
        metric("browser-qa-policy", "Browser QA policy", summary.browserQaPolicy, claim.status),
        metric("maintenance-evidence-index", "Allowed maintenance evidence change", summary.maintenanceEvidenceIndex, claim.status),
        metric("runtime-performance-mutation", "Runtime performance mutation", summary.runtimePerformanceMutation, claim.status),
        metric("live-physics-mutation", "Live physics mutation", summary.livePhysicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 runtime default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("background-mutation", "Background mutation", summary.backgroundMutation, claim.status),
        metric("v9-sky-direction-mutation", "V9 sky direction mutation", summary.v9SkyDirectionMutation, claim.status),
        metric("fixture-data-mutation", "Fixture data mutation", summary.fixtureDataMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("release-packaging-mutation", "Release packaging mutation", summary.releasePackagingMutation, claim.status),
        metric("certification-claim-mutation", "Certification claim mutation", summary.certificationClaimMutation, claim.status),
      ],
      confidenceRationale:
        "Formula-checked because v102 aggregates the deterministic v101 audit summary and static maintenance evidence contracts; runtime remains informational until the separate v102 heavy audit is run.",
      assumptions: [
        "v102 is a maintenance evidence index and repo hygiene policy lock, not a scientific model, fixture, release artifact, performance optimization or sky replacement version.",
        "The dirty worktree remains unchanged unless the user later explicitly requests scoped staging.",
        "DumpStack.log.tmp and pagefile.sys remain classified as Windows Watchpack known non-failure noise.",
      ],
      limitations: [
        "Does not reset, revert, clean, stage or commit the dirty worktree.",
        "Does not mutate live physics, worker physics, RK4/DP, EIH 1PN, Kerr kernel id, Horizons fixtures, v75 budgets, V9 sky/background direction, v97 Gaia budgets or v99 opacity caps.",
        "Does not claim NASA/JPL/Gaia/Universe Sandbox certification, online validation, latest command pass/fail from inside the runtime app, or a release archive.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function presentationRuntimePerformanceLockClaim(): EvidenceClaim {
  const summary = createAtlasPresentationRuntimePerformanceSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "presentation-runtime-performance-lock",
    group: "presentation-runtime-performance-lock",
    title: "Presentation Runtime Performance Lock",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Presentation Runtime Performance Lock ${ATLAS_PRESENTATION_RUNTIME_PERFORMANCE_VERSION}`,
    model:
      "Deterministic presentation-layer runtime cost lock for Gaia uniform writes, constellation material writes and label DOM/visibility writes over v102",
    metric: `${summary.status}; ${summary.classification}; ${summary.gaiaRuntimePolicy}; ${summary.budgetThresholdPolicy}`,
    error:
      "No runtime command result, browser QA cost reduction, scientific gate change, fixture update, runtime physics change, visual budget change, sky replacement or official certification is claimed by the app; measured locks are produced by the separate heavy v103 command.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasPresentationRuntimePerformanceAudit",
        "runAtlasMaintenanceEvidenceIndexAudit",
        ATLAS_PRESENTATION_RUNTIME_PERFORMANCE_VERSION,
      ],
      method:
        "Reuse the v102 heavy audit, then statically audit Gaia runtime write dedupe, constellation material write dedupe, label DOM and visibility write dedupe, frozen v97/v99/v75/browser thresholds, docs, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text and protected mutation flags.",
      metrics: [
        metric("presentation-runtime-performance-version", "Presentation runtime version", summary.version, claim.status),
        metric("presentation-runtime-performance-profile", "Presentation runtime profile", summary.presentationRuntimePerformanceProfile, claim.status),
        metric("presentation-runtime-performance-status", "Presentation runtime status", summary.status, claim.status),
        metric("presentation-runtime-performance-classification", "Classification", summary.classification, claim.status),
        metric("maintenance-evidence-index-version", "v102 maintenance evidence version", summary.maintenanceEvidenceIndexVersion, claim.status),
        metric("presentation-runtime-focused-command", "Focused audit command", summary.focusedCommand, claim.status),
        metric("presentation-runtime-verify-command", "Presentation runtime verify command", summary.presentationRuntimeVerifyCommand, claim.status),
        metric("maintenance-evidence-verify-command", "Maintenance evidence verify command", summary.maintenanceEvidenceVerifyCommand, claim.status),
        metric("gaia-runtime-policy", "Gaia runtime policy", summary.gaiaRuntimePolicy, claim.status),
        metric("constellation-runtime-policy", "Constellation runtime policy", summary.constellationRuntimePolicy, claim.status),
        metric("label-runtime-policy", "Label runtime policy", summary.labelRuntimePolicy, claim.status),
        metric("budget-threshold-policy", "Budget and threshold policy", summary.budgetThresholdPolicy, claim.status),
        metric("presentation-runtime-performance", "Allowed presentation runtime change", summary.presentationRuntimePerformance, claim.status),
        metric("browser-acceptance-cost-mutation", "Browser acceptance cost mutation", summary.browserAcceptanceCostMutation, claim.status),
        metric("runtime-performance-mutation", "Runtime performance mutation", summary.runtimePerformanceMutation, claim.status),
        metric("live-physics-mutation", "Live physics mutation", summary.livePhysicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 runtime default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("background-mutation", "Background mutation", summary.backgroundMutation, claim.status),
        metric("v9-sky-direction-mutation", "V9 sky direction mutation", summary.v9SkyDirectionMutation, claim.status),
        metric("fixture-data-mutation", "Fixture data mutation", summary.fixtureDataMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("release-packaging-mutation", "Release packaging mutation", summary.releasePackagingMutation, claim.status),
        metric("certification-claim-mutation", "Certification claim mutation", summary.certificationClaimMutation, claim.status),
      ],
      confidenceRationale:
        "Formula-checked because v103 aggregates the deterministic v102 audit summary and static presentation runtime contracts; runtime remains informational until the separate v103 heavy audit is run.",
      assumptions: [
        "v103 is a presentation runtime write-cost optimization lock, not a browser QA cost rewrite, scientific model, fixture, release artifact or sky replacement version.",
        "v97 Gaia budgets, v99 opacity caps, v75 budgets, browser screenshot thresholds and pixel settle/retry policy remain unchanged.",
        "Only Gaia, constellation and label presentation-layer write pressure may be reduced.",
      ],
      limitations: [
        "Does not reduce browser acceptance screenshot count or redefine browser QA cost.",
        "Does not mutate live physics, worker physics, RK4/DP, EIH 1PN, Kerr kernel id, Horizons fixtures, v75 budgets, V9 sky/background direction, v97 Gaia budgets or v99 opacity caps.",
        "Does not claim NASA/JPL/Gaia/Universe Sandbox certification, online validation, latest command pass/fail from inside the runtime app, or a release archive.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function browserAcceptanceRuntimeCostLockClaim(): EvidenceClaim {
  const summary = createAtlasBrowserAcceptanceRuntimeCostSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "browser-acceptance-runtime-cost-lock",
    group: "browser-acceptance-runtime-cost-lock",
    title: "Browser Acceptance Runtime Cost Lock",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Browser Acceptance Runtime Cost Lock ${ATLAS_BROWSER_ACCEPTANCE_RUNTIME_COST_VERSION}`,
    model:
      "Deterministic browser acceptance screenshot workload split over v103 with default current/core screenshots and opt-in full historical review",
    metric: `${summary.status}; ${summary.classification}; ${summary.screenshotManifestPolicy}; ${summary.markerCoveragePolicy}`,
    error:
      "No runtime command result, browser pass/fail, scientific gate change, fixture update, runtime physics change, visual budget change, sky replacement or official certification is claimed by the app; measured locks are produced by the separate heavy v104 command.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasBrowserAcceptanceRuntimeCostAudit",
        "runAtlasPresentationRuntimePerformanceAudit",
        ATLAS_BROWSER_ACCEPTANCE_RUNTIME_COST_VERSION,
      ],
      method:
        "Reuse the v103 heavy audit, then statically audit browser acceptance screenshot default/full-review manifests, package scripts, marker coverage, console/page-error checks, fresh teardown, docs, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text and protected mutation flags.",
      metrics: [
        metric("browser-acceptance-runtime-cost-version", "Browser acceptance runtime cost version", summary.version, claim.status),
        metric("browser-acceptance-runtime-cost-profile", "Browser acceptance runtime cost profile", summary.browserAcceptanceRuntimeCostProfile, claim.status),
        metric("browser-acceptance-runtime-cost-status", "Browser acceptance runtime cost status", summary.status, claim.status),
        metric("browser-acceptance-runtime-cost-classification", "Classification", summary.classification, claim.status),
        metric("presentation-runtime-performance-version", "v103 presentation runtime version", summary.presentationRuntimePerformanceVersion, claim.status),
        metric("browser-acceptance-runtime-cost-focused-command", "Focused audit command", summary.focusedCommand, claim.status),
        metric("browser-acceptance-runtime-cost-verify-command", "Browser acceptance runtime verify command", summary.browserAcceptanceRuntimeVerifyCommand, claim.status),
        metric("default-fresh-command", "Default fresh command", summary.defaultFreshCommand, claim.status),
        metric("full-review-command", "Full review command", summary.fullReviewCommand, claim.status),
        metric("screenshot-manifest-policy", "Screenshot manifest policy", summary.screenshotManifestPolicy, claim.status),
        metric("marker-coverage-policy", "Marker coverage policy", summary.markerCoveragePolicy, claim.status),
        metric("console-error-policy", "Console error policy", summary.consoleErrorPolicy, claim.status),
        metric("fresh-teardown-policy", "Fresh teardown policy", summary.freshTeardownPolicy, claim.status),
        metric("budget-threshold-policy", "Budget and threshold policy", summary.budgetThresholdPolicy, claim.status),
        metric("watchpack-noise-policy", "Watchpack noise policy", summary.watchpackNoisePolicy, claim.status),
        metric("browser-acceptance-runtime-cost", "Allowed browser acceptance change", summary.browserAcceptanceRuntimeCost, claim.status),
        metric("runtime-performance-mutation", "Runtime performance mutation", summary.runtimePerformanceMutation, claim.status),
        metric("live-physics-mutation", "Live physics mutation", summary.livePhysicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 runtime default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("background-mutation", "Background mutation", summary.backgroundMutation, claim.status),
        metric("v9-sky-direction-mutation", "V9 sky direction mutation", summary.v9SkyDirectionMutation, claim.status),
        metric("fixture-data-mutation", "Fixture data mutation", summary.fixtureDataMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("release-packaging-mutation", "Release packaging mutation", summary.releasePackagingMutation, claim.status),
        metric("certification-claim-mutation", "Certification claim mutation", summary.certificationClaimMutation, claim.status),
      ],
      confidenceRationale:
        "Formula-checked because v104 aggregates the deterministic v103 audit summary and static browser acceptance screenshot manifest contracts; runtime remains informational until the separate v104 heavy audit is run.",
      assumptions: [
        "v104 is a browser acceptance runtime cost lock, not a scientific model, fixture, release artifact, sky replacement or visual budget version.",
        "Default fresh browser may reduce historical screenshot artifacts while marker coverage, console checks, teardown and pixel sampling requirements remain preserved.",
        "The full review command keeps v93-v104 historical screenshot evidence available for release review.",
      ],
      limitations: [
        "Does not mutate live physics, worker physics, RK4/DP, EIH 1PN, Kerr kernel id, Horizons fixtures, v75 budgets, V9 sky/background direction, v97 Gaia budgets or v99 opacity caps.",
        "Does not loosen browser pixel thresholds, screenshot retry count, pixel settle policy, root/Observable/Evidence/Validation marker coverage, console/page-error checks or fresh 3015 teardown.",
        "Does not claim NASA/JPL/Gaia/Universe Sandbox certification, online validation, latest command pass/fail from inside the runtime app, or a release archive.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function finalGaiaArtEnhancementLockClaim(): EvidenceClaim {
  const summary = createAtlasFinalGaiaArtEnhancementSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "final-gaia-art-enhancement-lock",
    group: "final-gaia-art-enhancement-lock",
    title: "Final Gaia Art Enhancement Lock",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Final Gaia Art Enhancement Lock ${ATLAS_FINAL_GAIA_ART_ENHANCEMENT_VERSION}`,
    model:
      "Budget-preserved Gaia star selection and presentation art polish over v104 with frozen Gaia budgets and opacity caps",
    metric: `${summary.status}; ${summary.classification}; ${summary.gaiaSelectionPolicy}; ${summary.gaiaVisualMappingPolicy}`,
    error:
      "No runtime command result, browser pass/fail, scientific gate change, fixture update, runtime physics change, Gaia budget increase, sky replacement or official certification is claimed by the app; measured locks are produced by the separate heavy v105 command.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasFinalGaiaArtEnhancementAudit",
        "runAtlasBrowserAcceptanceRuntimeCostAudit",
        ATLAS_FINAL_GAIA_ART_ENHANCEMENT_VERSION,
      ],
      method:
        "Reuse the v104 heavy audit, then statically audit deterministic Gaia ranking, Gaia brightness/color mapping, constellation/nebula readability markers, browser QA markers, frozen v97/v99 budget boundaries, docs, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text and protected mutation flags.",
      metrics: [
        metric("final-gaia-art-enhancement-version", "Final Gaia art enhancement version", summary.version, claim.status),
        metric("final-gaia-art-enhancement-profile", "Final Gaia art enhancement profile", summary.finalGaiaArtEnhancementProfile, claim.status),
        metric("final-gaia-art-enhancement-status", "Final Gaia art enhancement status", summary.status, claim.status),
        metric("final-gaia-art-enhancement-classification", "Classification", summary.classification, claim.status),
        metric("browser-acceptance-runtime-cost-version", "v104 browser acceptance runtime cost version", summary.browserAcceptanceRuntimeCostVersion, claim.status),
        metric("gaia-enhancement-version", "v97 Gaia enhancement version", summary.gaiaEnhancementVersion, claim.status),
        metric("art-polish-version", "v99 art polish version", summary.artPolishVersion, claim.status),
        metric("gaia-render-budget", "Gaia render budget", `${summary.gaiaRenderBudget.mobile}/${summary.gaiaRenderBudget.balanced}/${summary.gaiaRenderBudget.dense}`, claim.status),
        metric("opacity-caps", "Opacity caps", `${summary.opacityCaps.mobile}/${summary.opacityCaps.balanced}/${summary.opacityCaps.dense}/${summary.opacityCaps.closeup}`, claim.status),
        metric("gaia-selection-policy", "Gaia selection policy", summary.gaiaSelectionPolicy, claim.status),
        metric("gaia-visual-mapping-policy", "Gaia visual mapping policy", summary.gaiaVisualMappingPolicy, claim.status),
        metric("browser-qa-policy", "Browser QA policy", summary.browserQaPolicy, claim.status),
        metric("focused-command", "Focused audit command", summary.focusedCommand, claim.status),
        metric("verify-command", "Final Gaia art verify command", summary.finalGaiaArtVerifyCommand, claim.status),
        metric("screenshot-artifact-directory", "Screenshot artifact directory", summary.screenshotArtifactDirectory, claim.status),
        metric("final-gaia-art-enhancement", "Allowed v105 change", summary.finalGaiaArtEnhancement, claim.status),
        metric("live-physics-mutation", "Live physics mutation", summary.livePhysicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 runtime default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("background-mutation", "Background mutation", summary.backgroundMutation, claim.status),
        metric("v9-sky-direction-mutation", "V9 sky direction mutation", summary.v9SkyDirectionMutation, claim.status),
        metric("fixture-data-mutation", "Fixture data mutation", summary.fixtureDataMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("release-packaging-mutation", "Release packaging mutation", summary.releasePackagingMutation, claim.status),
        metric("certification-claim-mutation", "Certification claim mutation", summary.certificationClaimMutation, claim.status),
      ],
      confidenceRationale:
        "Formula-checked because v105 exposes deterministic metadata and its focused command statically audits local source, docs and browser marker contracts; runtime remains informational until the separate v105 heavy audit is run.",
      assumptions: [
        "v105 is a final presentation/data polish lock, not a scientific gate, fixture, physics model, release artifact, sky replacement or Gaia budget increase.",
        "Gaia star rendering keeps the v97 base budgets of 1000/1800/3000 and the v99 opacity caps of 0.62/1.05/1.20/0.18.",
        "The packaged Gaia files are local curated data, not the full Gaia archive and not an official Gaia/NASA/JPL certification.",
      ],
      limitations: [
        "Does not mutate live physics, worker physics, RK4/DP, EIH 1PN, Kerr kernel id, Horizons fixtures, v75 budgets, V9 sky/background direction, v97 Gaia budgets or v99 opacity caps.",
        "Does not loosen browser pixel thresholds, screenshot retry count, pixel settle policy, root/Observable/Evidence/Validation marker coverage, console/page-error checks or fresh 3015 teardown.",
        "Does not claim NASA/JPL/Gaia/Universe Sandbox certification, online validation, latest command pass/fail from inside the runtime app, or a release archive.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function rcEvidenceClosureLockClaim(): EvidenceClaim {
  const summary = createAtlasRcEvidenceClosureSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "release-candidate-evidence-closure-lock",
    group: "release-candidate-evidence-closure-lock",
    title: "Release Candidate Evidence Closure Lock",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas RC Evidence Closure ${ATLAS_RC_EVIDENCE_CLOSURE_VERSION}`,
    model:
      "Deterministic release-candidate evidence closure over v105 with command, Browser QA artifact, dirty worktree and Watchpack noise policy indexes",
    metric: `${summary.status}; ${summary.classification}; ${summary.commandMatrixPolicy}; ${summary.artifactIndexPolicy}`,
    error:
      "No runtime command result, browser pass/fail, release archive, staging, commit, scientific gate change, fixture update, runtime physics change, Gaia budget increase, sky replacement or official certification is claimed by the app; measured locks are produced by the separate heavy v106 command.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasRcEvidenceClosureAudit",
        "runAtlasFinalGaiaArtEnhancementAudit",
        ATLAS_RC_EVIDENCE_CLOSURE_VERSION,
      ],
      method:
        "Reuse the v105 heavy audit, then statically audit v93-v105 focused commands, verification entrypoints, Browser QA marker coverage, screenshot artifact directories, dirty worktree policy, Windows Watchpack known non-failure noise, docs, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text and protected mutation flags.",
      metrics: [
        metric("rc-evidence-closure-version", "RC evidence closure version", summary.version, claim.status),
        metric("rc-evidence-closure-profile", "RC evidence closure profile", summary.rcEvidenceClosureProfile, claim.status),
        metric("rc-evidence-closure-status", "RC evidence closure status", summary.status, claim.status),
        metric("rc-evidence-closure-classification", "Classification", summary.classification, claim.status),
        metric("final-gaia-art-enhancement-version", "v105 final Gaia art version", summary.finalGaiaArtEnhancementVersion, claim.status),
        metric("command-matrix-policy", "Command matrix policy", summary.commandMatrixPolicy, claim.status),
        metric("browser-qa-policy", "Browser QA policy", summary.browserQaPolicy, claim.status),
        metric("artifact-index-policy", "Artifact index policy", summary.artifactIndexPolicy, claim.status),
        metric("dirty-worktree-policy", "Dirty worktree policy", summary.dirtyWorktreePolicy, claim.status),
        metric("watchpack-noise-policy", "Watchpack noise policy", summary.watchpackNoisePolicy, claim.status),
        metric("focused-command", "Focused audit command", summary.focusedCommand, claim.status),
        metric("verify-command", "RC evidence verify command", summary.rcEvidenceVerifyCommand, claim.status),
        metric("final-gaia-art-verify-command", "Final Gaia art verify command", summary.finalGaiaArtVerifyCommand, claim.status),
        metric("scientific-verify-command", "Scientific verify command", summary.scientificVerifyCommand, claim.status),
        metric("screenshot-artifact-directory", "Screenshot artifact directory", summary.screenshotArtifactDirectory, claim.status),
        metric("indexed-screenshot-artifact-directories", "Indexed screenshot artifact directories", String(summary.indexedScreenshotArtifactDirectories.length), claim.status),
        metric("rc-evidence-closure", "Allowed v106 change", summary.rcEvidenceClosure, claim.status),
        metric("live-physics-mutation", "Live physics mutation", summary.livePhysicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 runtime default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("background-mutation", "Background mutation", summary.backgroundMutation, claim.status),
        metric("v9-sky-direction-mutation", "V9 sky direction mutation", summary.v9SkyDirectionMutation, claim.status),
        metric("fixture-data-mutation", "Fixture data mutation", summary.fixtureDataMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("release-archive-mutation", "Release archive mutation", summary.releaseArchiveMutation, claim.status),
        metric("release-packaging-mutation", "Release packaging mutation", summary.releasePackagingMutation, claim.status),
        metric("staging-mutation", "Staging mutation", summary.stagingMutation, claim.status),
        metric("commit-mutation", "Commit mutation", summary.commitMutation, claim.status),
        metric("certification-claim-mutation", "Certification claim mutation", summary.certificationClaimMutation, claim.status),
      ],
      confidenceRationale:
        "Formula-checked because v106 exposes deterministic metadata and its focused command statically audits local source, docs, command and browser marker contracts; runtime remains informational until the separate v106 heavy audit is run.",
      assumptions: [
        "v106 is an RC evidence closure lock, not a release archive, staging/commit operation, scientific model upgrade, fixture update, sky replacement or Gaia budget increase.",
        "Dirty worktree policy remains no reset, no revert, no clean, no stage and no commit.",
        "Windows Watchpack DumpStack.log.tmp and pagefile.sys messages remain known non-failure dev-server noise when fresh browser acceptance exits 0.",
      ],
      limitations: [
        "Does not mutate live physics, worker physics, RK4/DP, EIH 1PN, Kerr kernel id, Horizons fixtures, v75 budgets, V9 sky/background direction, v97 Gaia budgets or v99 opacity caps.",
        "Does not create a release archive, stage files, commit files, loosen browser pixel thresholds, change screenshot retry count, change pixel settle policy or alter fresh 3015 teardown.",
        "Does not claim NASA/JPL/Gaia/Universe Sandbox certification, online validation, latest command pass/fail from inside the runtime app, or a release artifact.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function interactionCatalogCompletionLockClaim(): EvidenceClaim {
  const summary = createAtlasInteractionCatalogCompletionSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "interaction-catalog-completion-lock",
    group: "interaction-catalog-completion-lock",
    title: "Interaction & Catalog Completion Lock",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Interaction Catalog Completion ${ATLAS_INTERACTION_CATALOG_COMPLETION_VERSION}`,
    model:
      "Single cancellable camera focus coordinator, visible launch entry, bounded packaged Gaia navigation and curated visual catalog completion",
    metric: `${summary.status}; ${summary.cameraPolicy}; ${summary.gaiaLabelPolicy}; 88 constellations; 80 nebulae`,
    error:
      "Runtime command and browser results remain external; Gaia rows, constellation names and nebula markers are presentation data, not simulated stellar bodies.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasInteractionCatalogCompletionAudit",
        "runAtlasRcEvidenceClosureAudit",
        ATLAS_INTERACTION_CATALOG_COMPLETION_VERSION,
      ],
      method:
        "Reuse the v106 heavy audit, then statically audit the unified focus coordinator, launch entry, single LEO satellite profile, packaged Gaia search/index, 24/8 label budgets, complete 88 IAU constellation catalog, 80 curated nebula markers and protected mutation flags.",
      metrics: [
        metric("interaction-catalog-version", "Version", summary.version, claim.status),
        metric("camera-policy", "Camera policy", summary.cameraPolicy, claim.status),
        metric("focus-exit-policy", "Focus exit policy", summary.focusExitPolicy, claim.status),
        metric("launch-policy", "Launch policy", summary.launchPolicy, claim.status),
        metric("gaia-search-policy", "Gaia search policy", summary.gaiaSearchPolicy, claim.status),
        metric("gaia-label-policy", "Gaia label policy", summary.gaiaLabelPolicy, claim.status),
        metric("constellation-count", "IAU constellations", String(summary.constellationCount), claim.status),
        metric("nebula-count", "Curated nebulae", String(summary.nebulaCount), claim.status),
      ],
      confidenceRationale:
        "Formula-checked for deterministic local interaction and catalog contracts; the runtime app exposes pending metadata until the separate v107 heavy command runs.",
      assumptions: [
        "Gaia search uses the packaged bright-5000 catalog only.",
        "The single satellite mission reuses the existing spacecraft handoff.",
      ],
      limitations: [
        "No live physics, worker physics, scientific gate, fixture, Kerr, sky, Gaia point budget or opacity-cap mutation.",
        "Not a full Gaia archive, SIMBAD/VizieR service, physical stellar flyby or official certification.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function interactionRepairLaunchUxLockClaim(): EvidenceClaim {
  const summary = createAtlasInteractionRepairLaunchUxSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "interaction-repair-launch-ux-lock",
    group: "interaction-repair-launch-ux-lock",
    title: "Interaction Repair & Launch UX Upgrade Lock",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Interaction Repair Launch UX ${ATLAS_INTERACTION_REPAIR_LAUNCH_UX_VERSION}`,
    model:
      "Zoomable catalog/Gaia visual proxy, body-lock wheel preservation and local LEO launch mission workflow",
    metric: `${summary.status}; ${summary.skyTargetPolicy}; ${summary.launchUxPolicy}`,
    error:
      "Runtime browser results remain external; sky proxies are presentation targets and do not add physics bodies.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasInteractionRepairLaunchUxAudit",
        "runAtlasInteractionCatalogCompletionAudit",
        ATLAS_INTERACTION_REPAIR_LAUNCH_UX_VERSION,
      ],
      method:
        "Reuse the v107 audit, then statically verify selected sky-target proxies, clamped camera-distance zoom, native body-lock wheel preservation, LEO-default launch cards/timeline and protected mutation flags.",
      metrics: [
        metric("interaction-repair-version", "Version", summary.version, claim.status),
        metric("sky-target-policy", "Sky target policy", summary.skyTargetPolicy, claim.status),
        metric("sky-target-zoom-policy", "Sky target zoom", summary.skyTargetZoomPolicy, claim.status),
        metric("body-zoom-policy", "Body zoom", summary.bodyZoomPolicy, claim.status),
        metric("focus-exit-policy", "Focus exit", summary.focusExitPolicy, claim.status),
        metric("launch-ux-policy", "Launch UX", summary.launchUxPolicy, claim.status),
      ],
      confidenceRationale:
        "Formula-checked for deterministic local interaction contracts; runtime exposes pending metadata until the separate v108 heavy command runs.",
      assumptions: [
        "Catalog and Gaia focus targets remain visual proxies rather than simulated stellar bodies.",
        "Launch UX continues to reuse the existing local launch physics and spacecraft handoff.",
      ],
      limitations: [
        "No scientific gate, fixture, live/worker physics, RK4/DP, EIH 1PN, Kerr, sky, Gaia budget or opacity-cap mutation.",
        "No runtime network catalog, release packaging, staging or commit operation.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function interactionVisualQualityLockClaim(): EvidenceClaim {
  const summary = createAtlasInteractionVisualQualitySummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "interaction-visual-quality-lock",
    group: "interaction-visual-quality-lock",
    title: "Interaction Freedom / Launch Visual / Gaia Material Lock",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Interaction Visual Quality ${ATLAS_INTERACTION_VISUAL_QUALITY_VERSION}`,
    model:
      "User-overridable focus locks, launch auto/manual camera, procedural launch visuals and Gaia/local stellar material profiles",
    metric: `${summary.status}; ${summary.cameraFreedomPolicy}; ${summary.launchVisualPolicy}; ${summary.stellarMaterialPolicy}`,
    error:
      "Runtime browser results remain external; all upgraded visuals are presentation/local UX and do not mutate physics, fixtures, sky or Gaia budgets.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasInteractionVisualQualityAudit",
        "runAtlasInteractionRepairLaunchUxAudit",
        ATLAS_INTERACTION_VISUAL_QUALITY_VERSION,
      ],
      method:
        "Reuse the v108 audit, then statically verify user-overridable body/sky locks, launch auto-follow/manual-orbit controls, procedural rocket/satellite markers, stellar material profiles, docs/surface markers and protected mutation flags.",
      metrics: [
        metric("interaction-visual-quality-version", "Version", summary.version, claim.status),
        metric("camera-freedom-policy", "Camera freedom", summary.cameraFreedomPolicy, claim.status),
        metric("launch-camera-policy", "Launch camera", summary.launchCameraPolicy, claim.status),
        metric("launch-visual-policy", "Launch visual", summary.launchVisualPolicy, claim.status),
        metric("stellar-material-policy", "Stellar material", summary.stellarMaterialPolicy, claim.status),
        metric("gaia-budget-policy", "Gaia budget", summary.gaiaBudgetPolicy, claim.status),
      ],
      confidenceRationale:
        "Formula-checked for deterministic local presentation contracts; runtime pass/fail is produced by the separate v109 heavy command and browser QA.",
      assumptions: [
        "Gaia and local stellar visual material is a presentation shader/profile, not a physical stellar model.",
        "Launch visuals continue to reuse existing local launch physics and spacecraft handoff.",
      ],
      limitations: [
        "No scientific gate, fixture, live/worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background, Gaia point budget or v99 opacity cap mutation.",
        "No external GLB download, runtime network catalog, release packaging, staging or commit operation.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function criticalUiRelativityVisibilityLockClaim(): EvidenceClaim {
  const summary = createAtlasCriticalUiRelativityVisibilitySummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "critical-ui-relativity-visibility-lock",
    group: "critical-ui-relativity-visibility-lock",
    title: "Critical UI / Relativity Core Visibility Lock",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Critical UI Relativity Visibility ${ATLAS_CRITICAL_UI_RELATIVITY_VISIBILITY_VERSION}`,
    model:
      "Visible Chinese copy cleanup, direct Relativity Core entry points and consolidated readouts for existing EIH 1PN, DP/RK, Mercury/Shapiro/light-deflection and Kerr surfaces",
    metric: `${summary.status}; ${summary.uiCopyPolicy}; ${summary.relativityCoreEntryPolicy}; ${summary.relativityReadoutPolicy}`,
    error:
      "Runtime browser results remain external; v110 is UI observability only and does not change physics or scientific fixtures.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasCriticalUiRelativityVisibilityAudit",
        ATLAS_CRITICAL_UI_RELATIVITY_VISIBILITY_VERSION,
      ],
      method:
        "Statically verify visible priority UI copy, Relativity Core entry markers, consolidated core readout text, docs/surface markers and protected mutation flags.",
      metrics: [
        metric("critical-ui-relativity-version", "Version", summary.version, claim.status),
        metric("ui-copy-policy", "Visible copy", summary.uiCopyPolicy, claim.status),
        metric("core-entry-policy", "Core entry", summary.relativityCoreEntryPolicy, claim.status),
        metric("core-readout-policy", "Core readout", summary.relativityReadoutPolicy, claim.status),
      ],
      confidenceRationale:
        "Formula-checked for deterministic UI observability contracts; runtime pass/fail is produced by the separate v110 heavy command and browser QA.",
      assumptions: [
        "Search and bottom toolbar entries route to the existing Relativity Observable Atlas surface.",
      ],
      limitations: [
        "No scientific gate, fixture, live/worker physics, RK4/DP, EIH 1PN, Kerr, sky, Gaia budget or opacity-cap mutation.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function cameraStellarCloseupLockClaim(): EvidenceClaim {
  const summary = createAtlasCameraStellarCloseupSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "camera-stellar-closeup-lock",
    group: "camera-stellar-closeup-lock",
    title: "Camera Close-up / Stellar Portrait Lock",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Camera Stellar Closeup ${ATLAS_CAMERA_STELLAR_CLOSEUP_VERSION}`,
    model:
      "Target-anchor camera rig plus Gaia/local stellar close-up portraits from catalog-derived visual material",
    metric: `${summary.status}; ${summary.cameraRigPolicy}; ${summary.stellarPortraitPolicy}; ${summary.closeupPerformancePolicy}`,
    error:
      "Runtime browser results remain external; stellar portraits are display material and do not claim resolved stellar surfaces.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasCameraStellarCloseupAudit",
        ATLAS_CAMERA_STELLAR_CLOSEUP_VERSION,
      ],
      method:
        "Statically verify target-anchor camera policy, selected stellar portrait markers, close-up label suppression markers and protected mutation flags.",
      metrics: [
        metric("camera-stellar-version", "Version", summary.version, claim.status),
        metric("camera-rig-policy", "Camera rig", summary.cameraRigPolicy, claim.status),
        metric("stellar-portrait-policy", "Stellar portrait", summary.stellarPortraitPolicy, claim.status),
        metric("closeup-performance-policy", "Close-up performance", summary.closeupPerformancePolicy, claim.status),
        metric("gaia-budget-policy", "Gaia budget", summary.gaiaBudgetPolicy, claim.status),
      ],
      confidenceRationale:
        "Formula-checked for deterministic camera and presentation contracts; runtime pass/fail is produced by the separate v111 heavy command and browser QA.",
      assumptions: [
        "Gaia BP-RP/G magnitude/parallax feed presentation colors and labels, not a physical stellar surface model.",
      ],
      limitations: [
        "No scientific gate, fixture, live/worker physics, RK4/DP, EIH 1PN, Kerr, sky, Gaia budget or opacity-cap mutation.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function launchGameplayOpenRocketBridgeLockClaim(): EvidenceClaim {
  const summary = createAtlasLaunchGameplayOpenRocketBridgeSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "launch-gameplay-openrocket-bridge-lock",
    group: "launch-gameplay-openrocket-bridge-lock",
    title: "Launch Gameplay / OpenRocket Import Bridge Lock",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Launch Gameplay OpenRocket Bridge ${ATLAS_LAUNCH_GAMEPLAY_OPENROCKET_BRIDGE_VERSION}`,
    model:
      "Mission-scene launch visuals, deterministic launch profile manifest and offline OpenRocket import bridge",
    metric: `${summary.status}; ${summary.launchScenePolicy}; ${summary.openRocketBridgePolicy}; browser exe ${summary.browserExeLaunch}`,
    error:
      "Runtime browser results remain external; OpenRocket is imported from user-provided/exported files and the browser never starts the desktop executable.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasLaunchGameplayOpenRocketBridgeAudit",
        ATLAS_LAUNCH_GAMEPLAY_OPENROCKET_BRIDGE_VERSION,
      ],
      method:
        "Statically verify launch mission-scene markers, visual profile manifest, offline OpenRocket import bridge policy, optional websocket telemetry and protected mutation flags.",
      metrics: [
        metric("launch-openrocket-version", "Version", summary.version, claim.status),
        metric("launch-scene-policy", "Launch scene", summary.launchScenePolicy, claim.status),
        metric("launch-profile-policy", "Launch visual profile", summary.launchVisualProfilePolicy, claim.status),
        metric("openrocket-policy", "OpenRocket policy", summary.openRocketBridgePolicy, claim.status),
        metric("telemetry-provider", "Telemetry provider", summary.telemetryProviderPolicy, claim.status),
      ],
      confidenceRationale:
        "Formula-checked for deterministic launch presentation and offline import contracts; runtime pass/fail is produced by the separate v112 heavy command and browser QA.",
      assumptions: [
        "OpenRocket data enters through local files or exported CSV/JSON, not through browser-controlled GUI automation.",
      ],
      limitations: [
        "No scientific gate, fixture, live/worker physics, RK4/DP, EIH 1PN, Kerr, sky, Gaia budget or opacity-cap mutation.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function scientificModelUpgradeContractClaim(): EvidenceClaim {
  const summary = createAtlasScientificModelUpgradeContractSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "scientific-model-upgrade-contract",
    group: "scientific-model-upgrade-contract",
    title: "Scientific Model Upgrade Contract",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Scientific Model Upgrade Contract ${ATLAS_SCIENTIFIC_MODEL_UPGRADE_CONTRACT_VERSION}`,
    model:
      "Fixture, error-budget, comparison-matrix and rollback contract required before future core physics upgrades",
    metric: `${summary.status}; ${summary.scientificUpgradePolicy}; ${summary.fixturePolicy}; ${summary.rollbackPolicy}`,
    error:
      "This is contract-only planning; no core physics change is claimed or applied.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "createAtlasScientificModelUpgradeContractSummary",
        ATLAS_SCIENTIFIC_MODEL_UPGRADE_CONTRACT_VERSION,
      ],
      method:
        "Define mandatory fixtures, error budgets, comparison matrix and rollback conditions before any future scientific core mutation.",
      metrics: [
        metric("scientific-upgrade-contract-version", "Version", summary.version, claim.status),
        metric("scientific-upgrade-policy", "Upgrade policy", summary.scientificUpgradePolicy, claim.status),
        metric("fixture-policy", "Fixtures", summary.fixturePolicy, claim.status),
        metric("error-budget-policy", "Error budgets", summary.errorBudgetPolicy, claim.status),
        metric("rollback-policy", "Rollback", summary.rollbackPolicy, claim.status),
      ],
      confidenceRationale:
        "Formula-checked for deterministic contract metadata; it deliberately leaves runtime physics unchanged.",
      assumptions: [
        "Future scientific work must pass this contract before core model changes are attempted.",
      ],
      limitations: [
        "No scientific gate, fixture, live/worker physics, RK4/DP, EIH 1PN or Kerr mutation in v113.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function visualLaunchPerformanceLockClaim(): EvidenceClaim {
  const summary = createAtlasVisualLaunchPerformanceSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "visual-launch-performance-lock",
    group: "visual-launch-performance-lock",
    title: "Visual Launch Performance Lock",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Visual Launch Performance ${ATLAS_VISUAL_LAUNCH_PERFORMANCE_VERSION}`,
    model:
      "Presentation-layer quality governor, LaunchSequenceDirector staging HUD and offline OpenRocket import boundary",
    metric: `${summary.status}; ${summary.qualityTier}; ${summary.launchDirectorPolicy}; ${summary.runtimeQualityPolicy}; ${summary.openRocketBridgePolicy}`,
    error:
      "Runtime browser results remain external; v114 changes only UI, rendering schedule, camera presentation and launch visuals.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasVisualLaunchPerformanceAudit",
        ATLAS_VISUAL_LAUNCH_PERFORMANCE_VERSION,
        summary.profile,
      ],
      method:
        "Statically verify readable launch copy, root/runtime markers, staged launch director, presentation quality tiers, OpenRocket offline import policy and protected mutation flags.",
      metrics: [
        metric("visual-launch-performance-version", "Version", summary.version, claim.status),
        metric("visual-launch-performance-profile", "Profile", summary.profile, claim.status),
        metric("visual-launch-performance-status", "Status", summary.status, claim.status),
        metric("visual-launch-performance-classification", "Classification", summary.classification, claim.status),
        metric("visual-launch-performance-quality-tier", "Quality tier", summary.qualityTier, claim.status),
        metric("launch-director-policy", "Launch director", summary.launchDirectorPolicy, claim.status),
        metric("runtime-quality-policy", "Runtime quality", summary.runtimeQualityPolicy, claim.status),
        metric("launch-scene-performance-policy", "Launch scene performance", summary.launchScenePerformancePolicy, claim.status),
        metric("openrocket-policy", "OpenRocket policy", summary.openRocketBridgePolicy, claim.status),
        metric("telemetry-provider-policy", "Telemetry provider", summary.telemetryProviderPolicy, claim.status),
        metric("stellar-closeup-policy", "Stellar close-up", summary.stellarCloseupPolicy, claim.status),
        metric("budget-policy", "Budget policy", summary.budgetPolicy, claim.status),
        metric("browser-exe-launch", "Browser exe launch", summary.browserExeLaunch, claim.status),
        metric("gui-automation-mutation", "GUI automation mutation", summary.guiAutomationMutation, claim.status),
        metric("live-physics-mutation", "Live physics mutation", summary.livePhysicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr mutation", summary.kerrKernelMutation, claim.status),
        metric("fixture-data-mutation", "Fixture data mutation", summary.fixtureDataMutation, claim.status),
        metric("v9-sky-direction-mutation", "V9 sky direction mutation", summary.v9SkyDirectionMutation, claim.status),
        metric("gaia-render-budget-mutation", "Gaia budget mutation", summary.gaiaRenderBudgetMutation, claim.status),
        metric("gaia-opacity-cap-mutation", "Gaia opacity cap mutation", summary.gaiaOpacityCapMutation, claim.status),
        metric("staging-mutation", "Staging mutation", summary.stagingMutation, claim.status),
        metric("commit-mutation", "Commit mutation", summary.commitMutation, claim.status),
      ],
      confidenceRationale:
        "Formula-checked for deterministic presentation contracts; runtime pass/fail is produced by the separate v114 heavy command and browser QA.",
      assumptions: [
        "Quality tiers affect only labels, particles, HUD cadence and nonessential presentation layers.",
        "OpenRocket data is imported from local/exported files; the browser does not launch the desktop executable.",
      ],
      limitations: [
        "No scientific gate, fixture, live/worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background, v75/v97/v99 budget, release packaging, staging or commit mutation.",
      ],
      relatedViews: ["telemetry", "evidence-ledger"],
    }),
  );
}

function runtimeSceneFocusPerformanceLockClaim(): EvidenceClaim {
  const summary = createAtlasRuntimeSceneFocusSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "runtime-scene-focus-performance-lock",
    group: "visual-launch-performance-lock",
    title: "Runtime Scene Isolation & Focus Latency",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Runtime Scene Focus ${ATLAS_RUNTIME_SCENE_FOCUS_PERFORMANCE_VERSION}`,
    model:
      "Exclusive launch scene mounting, ref-based telemetry subscriber, bounded focus latency and throttled camera markers",
    metric: `${summary.status}; ${summary.sceneIsolationPolicy}; ${summary.telemetryPolicy}; ${summary.cameraFocusPolicy}`,
    error:
      "Runtime timing remains browser-observed evidence; v115 does not claim or change scientific model accuracy.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasRuntimeSceneFocusAudit",
        ATLAS_RUNTIME_SCENE_FOCUS_PERFORMANCE_VERSION,
        summary.profile,
      ],
      method:
        "Verify exclusive scene modes, quality-cadenced telemetry, hidden DOM unmounting, stable R3F props and bounded camera focus timing.",
      metrics: [
        metric("runtime-scene-focus-version", "Version", summary.version, claim.status),
        metric("scene-isolation-policy", "Scene isolation", summary.sceneIsolationPolicy, claim.status),
        metric("telemetry-policy", "Telemetry", summary.telemetryPolicy, claim.status),
        metric("camera-focus-policy", "Camera focus", summary.cameraFocusPolicy, claim.status),
        metric("marker-policy", "Runtime markers", summary.markerPolicy, claim.status),
        metric("hidden-dom-policy", "Hidden DOM", summary.hiddenDomPolicy, claim.status),
        metric("r3f-props-policy", "R3F props", summary.r3fPropsPolicy, claim.status),
      ],
      confidenceRationale:
        "Formula-checked by focused unit and static integration tests; browser latency evidence remains external.",
      assumptions: [
        "Launch telemetry is published through the existing mutable local telemetry ref.",
      ],
      limitations: [
        "No scientific gate, fixture, physics, Kerr, sky or protected budget mutation.",
      ],
      relatedViews: ["telemetry", "evidence-ledger"],
    }),
  );
}

function offlineStellarSearchCatalogV2LockClaim(): EvidenceClaim {
  const summary = createAtlasOfflineStellarSearchCatalogV2Summary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "offline-stellar-search-catalog-v2-lock",
    group: "visual-launch-performance-lock",
    title: "Offline Stellar Search Catalog V2",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Stellar Search ${ATLAS_OFFLINE_STELLAR_SEARCH_CATALOG_V2_VERSION}`,
    model: "Offline Gaia DR3 search shards plus curated cross-identification aliases in a Web Worker",
    metric: `${summary.searchRowCount} search rows; ${summary.renderRowCount} render rows; ${summary.shardCount} shards`,
    error: "Search coverage is separate from visible Gaia rendering and does not imply resolved stellar surfaces.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "ESA Gaia DR3 archive",
        "build-stellar-search-index",
        summary.version,
      ],
      method:
        "Generate deterministic offline source-ID shards and query them through a stale-result-safe Web Worker.",
      metrics: [
        metric("stellar-search-version", "Version", summary.version, claim.status),
        metric("stellar-search-rows", "Search rows", String(summary.searchRowCount), claim.status),
        metric("stellar-render-rows", "Render rows", String(summary.renderRowCount), claim.status),
        metric("stellar-search-shards", "Shards", String(summary.shardCount), claim.status),
        metric("stellar-runtime-policy", "Runtime", summary.runtimePolicy, claim.status),
        metric("stellar-fallback-policy", "Fallback", summary.fallbackPolicy, claim.status),
      ],
      confidenceRationale:
        "Catalog shape, shard selection and integration are covered by focused tests; source measurements retain Gaia provenance.",
      assumptions: [
        "Aliases are curated offline and are not fetched from SIMBAD at runtime.",
      ],
      limitations: [
        "The searchable catalog does not increase v97 rendering budgets or alter any scientific model.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}

function launchSceneOpenRocketReplayLockClaim(): EvidenceClaim {
  const summary = createAtlasLaunchSceneOpenRocketReplaySummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "launch-scene-openrocket-replay-lock",
    group: "visual-launch-performance-lock",
    title: "Launch Scene & OpenRocket Replay",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Launch Replay ${ATLAS_LAUNCH_SCENE_OPENROCKET_REPLAY_VERSION}`,
    model: "Fixed screen director, local NASA assets and structured offline OpenRocket replay manifest",
    metric: `${summary.hudPolicy}; ${summary.assetPolicy}; ${summary.replayPolicy}`,
    error: "Imported replay is presentation telemetry and does not replace the live scientific integrator.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(claim, createPassport({
    claim,
    sourceChain: ["NASA 3D Resources", "OpenRocket offline export", summary.version],
    method: "Validate local checksums, initial transfer budget, fixed HUD markers and no-executable import policy.",
    metrics: [
      metric("launch-replay-version", "Version", summary.version, claim.status),
      metric("launch-hud-policy", "HUD", summary.hudPolicy, claim.status),
      metric("launch-asset-policy", "Assets", summary.assetPolicy, claim.status),
      metric("launch-replay-policy", "Replay", summary.replayPolicy, claim.status),
    ],
    confidenceRationale: "Static integration and parser tests cover the local presentation and import boundary.",
    assumptions: ["OpenRocket files are supplied explicitly by the user or generated offline."],
    limitations: ["Browser executable launch and GUI automation are not implemented."],
    relatedViews: ["telemetry", "evidence-ledger"],
  }));
}

function visualIntegrationReleaseGateClaim(): EvidenceClaim {
  const summary = createAtlasVisualIntegrationReleaseSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "visual-integration-release-gate",
    group: "visual-launch-performance-lock",
    title: "Visual Integration & Release Gate",
    status: "informational",
    confidence: "visual",
    source: `Atlas Visual Release ${ATLAS_VISUAL_INTEGRATION_RELEASE_VERSION}`,
    model: "Eight-scene visual review with passive animation-frame and Long Tasks observation",
    metric: `${summary.reviewScenes.length} scenes; desktop ${summary.desktopOverviewMedianFpsMin} FPS; mobile ${summary.mobileMedianFpsMin} FPS`,
    error: "Absolute FPS varies by browser, GPU and power state and is gated only on the named hardware baseline.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(claim, createPassport({
    claim,
    sourceChain: ["requestAnimationFrame", "PerformanceObserver longtask", summary.version],
    method: "Sample runtime frame deltas and long tasks, publish root markers, and review eight fixed scenes.",
    metrics: [
      metric("visual-release-version", "Version", summary.version, claim.status),
      metric("visual-review-scenes", "Scenes", summary.reviewScenes.join(", "), claim.status),
      metric("visual-performance-policy", "Performance", summary.performancePolicy, claim.status),
    ],
    confidenceRationale: "Runtime-observed browser markers are collected without changing simulation or rendering state.",
    assumptions: ["Absolute performance certification runs on the designated hardware-accelerated baseline."],
    limitations: ["Software-rendered CI results are diagnostic rather than an absolute FPS release failure."],
    relatedViews: ["telemetry", "evidence-ledger"],
  }));
}

function scientificPromotionV2Claim(): EvidenceClaim {
  const summary = createAtlasScientificPromotionV2Summary({
    catalogDocumentCount: 224_361,
    exoplanetSystemCount: 4_735,
    ktx2AssetCount: 35,
  });
  const claim: EvidenceClaimWithoutPassport = {
    id: "scientific-promotion-v2",
    group: "scientific-model-upgrade-contract",
    title: "v125-v130 Catalog, Art and Scientific Promotion",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Scientific Promotion ${ATLAS_SCIENTIFIC_PROMOTION_V2_VERSION}`,
    model:
      "Sharded universal catalog, offline KTX2 assets, complete exoplanet atlas, shadow 2PN/LT force model and non-equatorial Kerr test particles",
    metric: `${summary.promotionDecision}; default ${summary.defaultRelativityKernel}; shadow ${summary.shadowKernel}`,
    error:
      "The ten-year V2 ephemeris promotion evidence is not yet present, so legacy EIH 1PN remains the runtime default.",
    boundary: summary.runtimeBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "HYG v4.1 / Gaia DR3 explicit HIP crossmatch",
        "NASA Exoplanet Archive local shards",
        "Khronos KTX-Software 4.4.2",
        summary.version,
      ],
      method:
        "Verify offline shard counts and checksums, shadow-only relativistic corrections, Kerr invariants and an explicit all-gates promotion decision.",
      metrics: [
        metric("v125-catalog", "Catalog", summary.catalogVersion, claim.status),
        metric("v126-stellar-art", "Stellar art", summary.stellarArtVersion, claim.status),
        metric("v127-exoplanets", "Exoplanets", summary.exoplanetVersion, claim.status),
        metric("v128-relativity", "Relativity shadow", summary.relativityVersion, claim.status),
        metric("v129-kerr", "Kerr 3D", summary.kerrVersion, claim.status),
        metric("v130-decision", "Promotion", summary.promotionDecision, claim.status),
        metric("v130-default", "Default kernel", summary.defaultRelativityKernel, claim.status),
      ],
      confidenceRationale:
        "Catalog, material, shadow-force and Kerr invariant behavior are locally tested; default promotion remains blocked until independent ephemeris and runtime gates pass.",
      assumptions: [
        "Runtime catalog access is offline and browser code never launches OpenRocket or KTX desktop executables.",
      ],
      limitations: summary.blockers,
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}

function finalProductProgramClaim(): EvidenceClaim {
  const summary = createAtlasFinalReleaseSummary();
  const promotion = createScientificPromotionEvidenceV3({
    positionRmsKm: 20.64520763976463,
    velocityRmsMS: 0.05001448075551245,
    kerrInvariantPassed: true,
  });
  const claim: EvidenceClaimWithoutPassport = {
    id: "windows-scientific-cinematic-atlas-1-0",
    group: "scientific-model-upgrade-contract",
    title: "v131-v140 Windows Scientific-Cinematic Atlas",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Final Product Program ${ATLAS_ONE_RELEASE_VERSION}`,
    model: "Tauri/WebView2 desktop shell, versioned content packs, SQLite FTS5 catalog, isolated scene modules and fail-closed scientific promotion",
    metric: `${summary.catalogTarget.toLocaleString()} catalog target; ${summary.sceneCount} scenes; ${promotion.decision}`,
    error: "The million-row catalog and ten-year V2 ephemeris evidence are present. Hardware performance, full regression, Rust desktop build and installer signing remain release gates.",
    boundary: summary.boundary,
  };
  return withPassport(claim, createPassport({
    claim,
    sourceChain: ["Gaia DR3 / HYG / NASA local provenance", "Tauri desktop capability boundary", summary.version],
    method: "Build and checksum content packs serially, query the desktop catalog through SQLite FTS5, audit runtime resources on scene transitions and promote relativity V2 only when every independent gate passes.",
    metrics: [
      metric("final-product-version", "Version", summary.version, claim.status),
      metric("final-product-scenes", "Scenes", String(summary.sceneCount), claim.status),
      metric("final-catalog-target", "Catalog target", String(summary.catalogTarget), claim.status),
      metric("final-default-kernel", "Default kernel", promotion.defaultKernel, claim.status),
      metric("final-v2-ephemeris", "V2 ten-year RMS", `${promotion.positionRmsKm?.toFixed(3)} km / ${promotion.velocityRmsMS?.toFixed(6)} m/s`, claim.status),
      metric("final-memory-policy", "Memory policy", summary.memoryPolicy, claim.status),
    ],
    confidenceRationale: "The architecture and fail-closed contracts are locally testable; incomplete release artifacts are reported as blockers rather than inferred as passes.",
    assumptions: ["Windows desktop is canonical; browser mode remains a reduced offline-compatible preview."],
    limitations: ["No signing credential is stored in the repository.", ...promotion.blockers],
    relatedViews: ["relativity-observables", "evidence-ledger"],
  }));
}

function browserAcceptanceHarnessClaim(): EvidenceClaim {
  const summary = createAtlasBrowserAcceptanceSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "browser-acceptance-harness",
    group: "browser-acceptance-harness",
    title: "Browser Acceptance Harness",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Browser Acceptance Harness ${ATLAS_BROWSER_ACCEPTANCE_VERSION}`,
    model:
      "Local Playwright system-Chrome smoke test harness over existing Atlas DOM contracts",
    metric: `${summary.viewportCount} system-Chrome viewports; command ${summary.command}; runtime result ${summary.runtimeCommandStatus}`,
    error:
      "No runtime pass/fail or CI status is claimed by the app; command output remains external developer tooling evidence.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "Playwright local browser acceptance spec",
        "system Chrome installation",
        "v35 Kerr Studio DOM contracts",
        "v36 Release Candidate Gate DOM contracts",
        "v37 Relativity Observable Atlas DOM contracts",
        ATLAS_BROWSER_ACCEPTANCE_VERSION,
      ],
      method:
        "Run local browser smoke tests outside the runtime UI against desktop and mobile-sized Chrome viewports, checking DOM markers, target panel workflows, console/page errors and horizontal overflow.",
      formulas: [
        formula(
          "overflow-check",
          "Horizontal overflow check",
          "documentElement.scrollWidth <= innerWidth && body.scrollWidth <= innerWidth",
          "Viewport width, documentElement scrollWidth and body scrollWidth",
          "Local browser acceptance only; not a rendering certification system.",
        ),
      ],
      metrics: [
        metric("harness-version", "Harness version", summary.version, "informational"),
        metric("test-command", "Test command", summary.command, "informational"),
        metric("full-gate-command", "Full gate command", summary.fullGateCommand, "informational"),
        metric("runtime-command-status", "Runtime command status", "not claimed in app", "informational"),
        metric("browser", "Browser", summary.browser, "informational"),
        metric("viewport-count", "Viewport count", String(summary.viewportCount), "informational"),
        metric("ci-certification", "CI certification", "not claimed", "informational"),
        metric("online-validation", "Online validation", "not claimed", "informational"),
        metric("physics-mutation", "Physics mutation", "not applied", "informational"),
      ],
      confidenceRationale:
        "Formula-checked at the product layer: the passport documents local browser acceptance coverage and deliberately avoids storing pass/fail, CI or online validation status in runtime state.",
      assumptions: [
        "System Chrome is installed on the developer machine running the browser acceptance command.",
        "The Next dev server is launched by the Playwright webServer configuration.",
      ],
      limitations: [
        "Does not claim that the latest browser command passed from inside the app.",
        "Does not certify CI, scientific correctness, online validation, browser matrix completeness or GPU driver behavior.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}

function accessibilityWorkbenchClaim(): EvidenceClaim {
  const summary = createAtlasWorkbenchAccessibilitySummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "accessibility-workbench",
    group: "accessibility-workbench",
    title: "Accessible Atlas Workbench",
    status: "informational",
    confidence: "visual",
    source: `Atlas Workbench Accessibility ${ATLAS_WORKBENCH_ACCESSIBILITY_VERSION}`,
    model: "Local WCAG 2.2 AA-target workbench interaction and presentation metadata",
    metric: `${summary.surfaceCount} scoped surfaces; ${summary.minimumTargetSizePx}px minimum target; ${summary.motionPolicy}`,
    error: "Runtime UI does not execute an accessibility scan or certify conformance.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Workbench Accessibility ${summary.version}`,
        "Shared workbench focus and panel semantics",
        "Local browser acceptance harness",
      ],
      method:
        "Describe the local workbench accessibility target, scoped surfaces, focus behavior, target sizing, and reduced-motion policy without running a scan from the runtime UI.",
      metrics: [
        metric("standard-target", "Accessibility target", summary.standardTarget, claim.status),
        metric("surface-count", "Scoped workbench surfaces", String(summary.surfaceCount), claim.status),
        metric("minimum-target", "Minimum target size", `${summary.minimumTargetSizePx}px`, claim.status),
        metric("focus-policy", "Focus policy", summary.focusPolicy, claim.status),
        metric("motion-policy", "Motion policy", summary.motionPolicy, claim.status),
      ],
      confidenceRationale:
        "Informational UI metadata only. Browser tooling verifies local implementation outside the runtime surface.",
      assumptions: [
        "The scoped workbench panels are rendered locally in the current Atlas build.",
        "The 3D Canvas and scene labels remain outside this workbench accessibility scope.",
      ],
      limitations: [
        "Does not report the latest scan result, CI status, or external conformance certification.",
        "Does not change SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics, or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger"],
    }),
  );
}

function cinematicVisualSystemClaim(): EvidenceClaim {
  const summary = createAtlasCinematicWorkbenchSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "cinematic-visual-system",
    group: "cinematic-visual-system",
    title: "Cinematic Scientific Workbench",
    status: "informational",
    confidence: "visual",
    source: `Atlas Cinematic Scientific Workbench ${ATLAS_CINEMATIC_WORKBENCH_VERSION}`,
    model: "Local scientific-instrument cinematic visual system over existing presentation layers",
    metric: `${summary.visualTarget}; ${summary.qualityTarget}; ${summary.aaBoundaryPreserved}`,
    error: "No scientific error budget; this is art direction and presentation metadata only.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Cinematic Scientific Workbench ${summary.version}`,
        "Orbit Atlas v12 presentation renderer",
        "v41 accessible workbench surface scope",
        "Existing sky, orbit, label, HUD and workbench presentation layers",
      ],
      method:
        "Apply a local visual-system reset to presentation rendering and workbench skinning while preserving existing action ids, accessibility semantics, evidence boundaries and physics kernels.",
      metrics: [
        metric("visual-version", "Visual system version", summary.version, claim.status),
        metric("visual-target", "Visual target", summary.visualTarget, claim.status),
        metric("quality-target", "Quality target", summary.qualityTarget, claim.status),
        metric("aa-boundary", "AA boundary", summary.aaBoundaryPreserved, claim.status),
        metric("scene-policy", "Scene policy", summary.scenePolicy, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: the layer is deterministic local presentation metadata and deliberately avoids certification, command-result, online-validation and science claims.",
      assumptions: [
        "Existing local textures and shader paths are sufficient for the v42 art direction pass.",
        "v41 opaque accessible workbench surfaces remain the contrast boundary for data panels.",
      ],
      limitations: [
        "Does not create a new physics model, numerical solver, sky catalog, or online validation source.",
        "Does not claim AAA production certification, WCAG certification, scientific certification, CI status, or latest runtime command status.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}

function planetaryVisualFidelityClaim(): EvidenceClaim {
  const summary = createAtlasPlanetaryVisualFidelitySummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "planetary-visual-fidelity",
    group: "planetary-visual-fidelity",
    title: "Planetary close-up visual fidelity",
    status: "informational",
    confidence: "visual",
    source: `Atlas Planetary Visual Fidelity ${ATLAS_PLANETARY_VISUAL_FIDELITY_VERSION}`,
    model: "Selected-body close-up and deep-space background presentation profile over existing local render layers",
    metric: `${summary.visualTarget}; ${summary.styleTarget}; ${summary.assetPolicy}`,
    error: "No scientific error budget; this is local visual fidelity metadata and presentation tuning only.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Planetary Visual Fidelity ${summary.version}`,
        "Selected-body HD texture manifest and local public texture assets",
        "Planet, SunBody, GalaxyEnvironmentSphere and ScienceBackdrop presentation layers",
        "v41 accessible workbench and v42 cinematic visual system boundaries",
      ],
      method:
        "Describe the local selected-body close-up visual profile, restrained scientific-instrument style, runtime local texture policy, and close-up sky dimming without claiming online validation or mutating physics.",
      metrics: [
        metric("visual-fidelity-version", "Visual fidelity version", summary.version, claim.status),
        metric("visual-target", "Visual target", summary.visualTarget, claim.status),
        metric("style-target", "Style target", summary.styleTarget, claim.status),
        metric("asset-policy", "Asset policy", summary.assetPolicy, claim.status),
        metric("runtime-assets", "Runtime assets", summary.runtimeAssetSource, claim.status),
        metric("closeup-priority", "Close-up priority", summary.closeupPriority, claim.status),
        metric("sky-closeup-profile", "Sky close-up profile", summary.skyCloseupProfile, claim.status),
        metric("aa-boundary", "AA boundary", summary.aaBoundaryPreserved, claim.status),
        metric("cinematic-boundary", "Cinematic boundary", summary.cinematicBoundaryPreserved, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("online-validation", "Online validation", summary.onlineValidationStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: the layer is deterministic local presentation metadata and browser tooling verifies rendered states outside the runtime UI.",
      assumptions: [
        "Developer tooling may refresh or supplement local texture assets before release verification.",
        "The runtime application reads local public textures and shaders without fetching online validation or asset state.",
      ],
      limitations: [
        "Does not claim AAA production certification, scientific certification, WCAG certification, online validation, online asset completeness, CI status, or latest runtime command status.",
        "Does not add full numerical relativity, cosmological N-body, online astronomy catalog coverage, or a new scientific observable.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}

function cinematicLightingClaim(): EvidenceClaim {
  const summary = createAtlasCinematicLightingCompositionSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "cinematic-lighting",
    group: "cinematic-lighting",
    title: "Cinematic lighting and post-FX composition",
    status: "informational",
    confidence: "visual",
    source: `Atlas Cinematic Lighting Composition ${ATLAS_CINEMATIC_LIGHTING_COMPOSITION_VERSION}`,
    model: "Body-aware local lighting and post-FX presentation profiles over existing HD texture assets",
    metric: `${summary.visualTarget}; ${summary.lightingProfile}; ${summary.postFxProfile}`,
    error: "No scientific error budget; this is local lighting, color grading and composition metadata only.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Cinematic Lighting Composition ${summary.version}`,
        "Existing local HD planet texture manifest and public texture runtime assets",
        "Planet, SunBody, GalaxyEnvironmentSphere, ScienceBackdrop and post-processing presentation layers",
        "v41 accessible workbench, v42 cinematic system and v43 planetary fidelity boundaries",
      ],
      method:
        "Describe deterministic body-aware cinematic lighting, restrained bloom, ACES/vignette post-FX, deep-space dimming and local runtime asset policy without claiming online validation or mutating physics.",
      metrics: [
        metric("lighting-version", "Lighting version", summary.version, claim.status),
        metric("visual-target", "Visual target", summary.visualTarget, claim.status),
        metric("lighting-profile", "Lighting profile", summary.lightingProfile, claim.status),
        metric("postfx-profile", "Post-FX profile", summary.postFxProfile, claim.status),
        metric("asset-policy", "Asset policy", summary.assetPolicy, claim.status),
        metric("runtime-assets", "Runtime assets", summary.runtimeAssetSource, claim.status),
        metric("supported-profiles", "Supported body profiles", summary.supportedLightingProfiles.join(", "), claim.status),
        metric("sky-profile", "Sky close-up profile", summary.skyCloseupProfile, claim.status),
        metric("aa-boundary", "AA boundary", summary.aaBoundaryPreserved, claim.status),
        metric("cinematic-boundary", "Cinematic boundary", summary.cinematicBoundaryPreserved, claim.status),
        metric("planetary-boundary", "Planetary boundary", summary.planetaryBoundaryPreserved, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("artistic-certification", "Artistic certification", summary.artisticCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("online-validation", "Online validation", summary.onlineValidationStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: the layer is deterministic local presentation metadata and browser tooling verifies rendered states outside the runtime UI.",
      assumptions: [
        "Existing local HD textures cover the primary close-up bodies for this v44 pass.",
        "Developer tooling may refresh or supplement local assets before verification, but runtime rendering reads local public textures only.",
      ],
      limitations: [
        "Does not claim AAA production certification, WCAG certification, scientific certification, online validation, online asset completeness, CI status, or latest runtime command status.",
        "Does not add a scientific observable, full numerical relativity, cosmological N-body, or online astronomy catalog coverage.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}

function chineseDeepSpaceFidelityClaim(): EvidenceClaim {
  const summary = createAtlasChineseDeepSpaceFidelitySummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "chinese-deep-space-fidelity",
    group: "chinese-deep-space-fidelity",
    title: "Chinese scientific interface and deep-space fidelity",
    status: "informational",
    confidence: "visual",
    source: `Atlas Chinese Deep-Space Fidelity ${ATLAS_CHINESE_DEEP_SPACE_FIDELITY_VERSION}`,
    model: "zh-CN primary interface and balanced Milky Way, constellation, nebula, and planetary close-up presentation profile",
    metric: `${summary.uiLanguage}; ${summary.visualProfile}; ${summary.assetPolicy}`,
    error: "No scientific error budget; this is local interface language and deep-space visual presentation metadata only.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Chinese Deep-Space Fidelity ${summary.version}`,
        "zh-CN primary workbench and HUD labels",
        "Curated local celestial catalog display names",
        "Existing public sky textures, constellation overlays, nebula markers and HD planetary textures",
        "v41 accessibility, v42 cinematic, v43 planetary and v44 lighting boundaries",
      ],
      method:
        "Describe deterministic Simplified Chinese-first UI chrome and local deep-space presentation tuning while preserving stable scientific ids, formulas, action ids, version markers, local catalogs and physics kernels.",
      metrics: [
        metric("chinese-interface-version", "Chinese interface version", summary.version, claim.status),
        metric("ui-language", "UI language", summary.uiLanguage, claim.status),
        metric("localization-mode", "Localization mode", summary.localizationMode, claim.status),
        metric("visual-profile", "Deep-space visual profile", summary.visualProfile, claim.status),
        metric("asset-policy", "Asset policy", summary.assetPolicy, claim.status),
        metric("runtime-assets", "Runtime assets", summary.runtimeAssetSource, claim.status),
        metric("featured-layers", "Featured layers", summary.featuredLayers.join(", "), claim.status),
        metric("aa-boundary", "AA boundary", summary.aaBoundaryPreserved, claim.status),
        metric("cinematic-boundary", "Cinematic boundary", summary.cinematicBoundaryPreserved, claim.status),
        metric("planetary-boundary", "Planetary boundary", summary.planetaryBoundaryPreserved, claim.status),
        metric("lighting-boundary", "Lighting boundary", summary.lightingBoundaryPreserved, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("artistic-certification", "Artistic certification", summary.artisticCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("online-validation", "Online validation", summary.onlineValidationStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: this layer is deterministic local presentation metadata and browser tooling verifies rendered UI states outside the runtime UI.",
      assumptions: [
        "Simplified Chinese is the primary visible UI language while scientific ids, formulas, version strings and kernel ids remain stable.",
        "Runtime rendering reads local public textures and curated catalog rows only.",
      ],
      limitations: [
        "Does not claim AAA production certification, WCAG certification, scientific certification, online validation, online catalog completeness, CI status, or latest runtime command status.",
        "Does not add a new panel id, scientific observable, online astronomy database, full numerical relativity, cosmological N-body, or complete deep-sky catalog.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}

function cinematicDeepSpaceCameraClaim(): EvidenceClaim {
  const summary = createAtlasCinematicDeepSpaceCameraSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "cinematic-deep-space-camera",
    group: "cinematic-deep-space-camera",
    title: "Cinematic deep-space camera composition",
    status: "informational",
    confidence: "visual",
    source: `Atlas Cinematic Deep-Space Camera ${ATLAS_CINEMATIC_DEEP_SPACE_CAMERA_VERSION}`,
    model: "Stable high-fidelity camera, sky composition, background noise and target separation profiles over local render layers",
    metric: `${summary.defaultCameraProfile}; ${summary.closeupCameraProfile}; ${summary.qualityBudget}`,
    error: "No scientific error budget; this is local camera composition and deep-space visual presentation metadata only.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Cinematic Deep-Space Camera ${summary.version}`,
        "GalaxyEnvironmentSphere, ScienceBackdrop and deep-sky marker presentation layers",
        "Selected-body visual and lighting profile markers",
        "Existing local public sky textures and curated local catalogs",
        "v41 accessibility, v42 cinematic, v43 planetary, v44 lighting and v45 Chinese boundaries",
      ],
      method:
        "Describe deterministic cinematic camera composition profiles for overview, selected-body close-up and showcase deep-space states while preserving stable UI ids, scientific ids, local assets and physics kernels.",
      metrics: [
        metric("camera-version", "Camera version", summary.version, claim.status),
        metric("visual-target", "Visual target", summary.visualTarget, claim.status),
        metric("default-camera-profile", "Default camera profile", summary.defaultCameraProfile, claim.status),
        metric("closeup-camera-profile", "Close-up camera profile", summary.closeupCameraProfile, claim.status),
        metric("showcase-camera-profile", "Showcase camera profile", summary.showcaseCameraProfile, claim.status),
        metric("quality-budget", "Quality budget", summary.qualityBudget, claim.status),
        metric("runtime-assets", "Runtime assets", summary.runtimeAssetSource, claim.status),
        metric("sky-composition-profiles", "Sky composition profiles", summary.supportedSkyCompositionProfiles.join(", "), claim.status),
        metric("background-noise-profiles", "Background noise profiles", summary.supportedBackgroundNoiseProfiles.join(", "), claim.status),
        metric("target-separation-profiles", "Target separation profiles", summary.supportedTargetSeparationProfiles.join(", "), claim.status),
        metric("aa-boundary", "AA boundary", summary.aaBoundaryPreserved, claim.status),
        metric("cinematic-boundary", "Cinematic boundary", summary.cinematicBoundaryPreserved, claim.status),
        metric("planetary-boundary", "Planetary boundary", summary.planetaryBoundaryPreserved, claim.status),
        metric("lighting-boundary", "Lighting boundary", summary.lightingBoundaryPreserved, claim.status),
        metric("chinese-boundary", "Chinese interface boundary", summary.chineseBoundaryPreserved, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("artistic-certification", "Artistic certification", summary.artisticCertificationStatus, claim.status),
        metric("wcag-certification", "WCAG certification", summary.wcagCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("online-validation", "Online validation", summary.onlineValidationStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: the helper is deterministic metadata and browser tooling verifies rendered profile markers outside the runtime UI.",
      assumptions: [
        "Overview, selected-body close-up and showcase states can be represented by local rendering profiles without altering physics state.",
        "Runtime rendering reads local public textures and curated catalog rows only.",
      ],
      limitations: [
        "Does not claim AAA production certification, WCAG certification, scientific certification, online validation, online catalog completeness, CI status, or latest runtime command status.",
        "Does not add a new panel id, scientific observable, online astronomy database, full numerical relativity, cosmological N-body, or complete deep-sky catalog.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}

function universeSandboxReferenceBackdropClaim(): EvidenceClaim {
  const summary = createAtlasUniverseSandboxReferenceBackdropSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "universe-sandbox-reference-backdrop",
    group: "universe-sandbox-reference-backdrop",
    title: "Universe Sandbox reference backdrop",
    status: "informational",
    confidence: "visual",
    source: `Atlas Universe Sandbox Reference Backdrop ${ATLAS_UNIVERSE_SANDBOX_REFERENCE_BACKDROP_VERSION}`,
    model: "Local reference-inspired sparse star, layered Milky Way and selected-body visibility profiles over existing render layers",
    metric: `${summary.referenceMode}; ${summary.backgroundArtDirection}; ${summary.subjectVisibilityProfile}`,
    error: "No scientific or artistic certification budget; this is local visual reference metadata only.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Universe Sandbox Reference Backdrop ${summary.version}`,
        "User-provided Universe Sandbox reference screenshots and official public screenshot pages as visual inspiration only",
        "Local v46 Playwright screenshot review output",
        "GalaxyEnvironmentSphere, ScienceBackdrop, deep-sky marker and selected-body framing presentation layers",
        "Existing local public sky textures and curated local catalogs",
        "v41 accessibility, v42 cinematic, v43 planetary, v44 lighting, v45 Chinese and v46 deep-space camera boundaries",
      ],
      method:
        "Describe deterministic reference-inspired backdrop and subject visibility profiles for sparse stars, layered Milky Way contrast, negative space, local screenshot review and in-frame selected-body checks while preserving stable ids and physics kernels.",
      metrics: [
        metric("reference-version", "Reference version", summary.version, claim.status),
        metric("reference-mode", "Reference mode", summary.referenceMode, claim.status),
        metric("background-art-direction", "Background art direction", summary.backgroundArtDirection, claim.status),
        metric("default-depth-profile", "Default depth profile", summary.defaultDepthProfile, claim.status),
        metric("closeup-depth-profile", "Close-up depth profile", summary.closeupDepthProfile, claim.status),
        metric("showcase-depth-profile", "Showcase depth profile", summary.showcaseDepthProfile, claim.status),
        metric("subject-visibility", "Subject visibility", summary.subjectVisibilityProfile, claim.status),
        metric("screenshot-review", "Screenshot review", summary.screenshotReview, claim.status),
        metric("runtime-assets", "Runtime assets", summary.runtimeAssetSource, claim.status),
        metric("depth-profiles", "Depth profiles", summary.supportedDepthProfiles.join(", "), claim.status),
        metric("visibility-profiles", "Visibility profiles", summary.supportedSubjectVisibilityProfiles.join(", "), claim.status),
        metric("aa-boundary", "AA boundary", summary.aaBoundaryPreserved, claim.status),
        metric("cinematic-boundary", "Cinematic boundary", summary.cinematicBoundaryPreserved, claim.status),
        metric("planetary-boundary", "Planetary boundary", summary.planetaryBoundaryPreserved, claim.status),
        metric("lighting-boundary", "Lighting boundary", summary.lightingBoundaryPreserved, claim.status),
        metric("chinese-boundary", "Chinese interface boundary", summary.chineseBoundaryPreserved, claim.status),
        metric("camera-boundary", "Deep-space camera boundary", summary.deepSpaceCameraBoundaryPreserved, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("universe-sandbox-clone", "Universe Sandbox clone", summary.universeSandboxCloneStatus, claim.status),
        metric("artistic-certification", "Artistic certification", summary.artisticCertificationStatus, claim.status),
        metric("wcag-certification", "WCAG certification", summary.wcagCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("online-validation", "Online validation", summary.onlineValidationStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: the helper is deterministic local metadata and browser tooling verifies DOM markers, in-frame subject checks and non-brittle screenshot review outside the runtime UI.",
      assumptions: [
        "Universe Sandbox is used as visual reference direction only; no external assets are copied into the app.",
        "Runtime rendering reads local public textures and curated catalog rows only.",
      ],
      limitations: [
        "Does not claim Universe Sandbox clone status, AAA production certification, WCAG certification, scientific certification, online validation, online catalog completeness, CI status, or latest runtime command status.",
        "Does not add a new panel id, scientific observable, online astronomy database, full numerical relativity, cosmological N-body, or complete deep-sky catalog.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}

function referenceGradeSpaceArtClaim(): EvidenceClaim {
  const summary = createAtlasReferenceGradeSpaceArtSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "reference-grade-space-art",
    group: "reference-grade-space-art",
    title: "Reference-grade space art",
    status: "informational",
    confidence: "visual",
    source: `Atlas Reference-Grade Space Art ${ATLAS_REFERENCE_GRADE_SPACE_ART_VERSION}`,
    model: "Local generated sky assets, subject matte, starfield remap, planet material and post-FX composition profiles over existing render layers",
    metric: `${summary.artDirection}; ${summary.closeupCompositeProfile}; ${summary.closeupSubjectMatteProfile}`,
    error: "No scientific, AAA, WCAG, CI or clone certification budget; this is local visual composition metadata only.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Reference-Grade Space Art ${summary.version}`,
        "User-provided Universe Sandbox reference screenshots and official public screenshot pages as visual inspiration only",
        "Local v47 Playwright screenshot review output",
        "Generated local public sky assets, existing local planet textures and curated local catalogs",
        "GalaxyEnvironmentSphere, ScienceBackdrop, Planet, SunBody, Saturn ring, post-FX and selected-body framing presentation layers",
        "v41 accessibility, v42 cinematic, v43 planetary, v44 lighting, v45 Chinese, v46 camera and v47 reference backdrop boundaries",
      ],
      method:
        "Describe deterministic reference-grade composition profiles for layered sky assets, sparse starfield, subject matte, close-up planet material readability, local screenshot review and non-brittle browser pixel checks while preserving stable ids and physics kernels.",
      metrics: [
        metric("space-art-version", "Space art version", summary.version, claim.status),
        metric("art-direction", "Art direction", summary.artDirection, claim.status),
        metric("asset-policy", "Asset policy", summary.assetPolicy, claim.status),
        metric("review-mode", "Review mode", summary.reviewMode, claim.status),
        metric("default-composite", "Default composite", summary.defaultCompositeProfile, claim.status),
        metric("closeup-composite", "Close-up composite", summary.closeupCompositeProfile, claim.status),
        metric("showcase-composite", "Showcase composite", summary.showcaseCompositeProfile, claim.status),
        metric("default-sky-layer", "Default sky layer", summary.defaultSkyLayerProfile, claim.status),
        metric("closeup-sky-layer", "Close-up sky layer", summary.closeupSkyLayerProfile, claim.status),
        metric("starfield-profile", "Starfield profile", summary.closeupStarfieldProfile, claim.status),
        metric("subject-matte", "Subject matte", summary.closeupSubjectMatteProfile, claim.status),
        metric("planet-material", "Planet material", summary.closeupPlanetMaterialProfile, claim.status),
        metric("gas-giant-material", "Gas giant material", summary.gasGiantPlanetMaterialProfile, claim.status),
        metric("solar-material", "Solar material", summary.solarPlanetMaterialProfile, claim.status),
        metric("runtime-assets", "Runtime assets", summary.runtimeAssetSource, claim.status),
        metric("aa-boundary", "AA boundary", summary.aaBoundaryPreserved, claim.status),
        metric("cinematic-boundary", "Cinematic boundary", summary.cinematicBoundaryPreserved, claim.status),
        metric("planetary-boundary", "Planetary boundary", summary.planetaryBoundaryPreserved, claim.status),
        metric("lighting-boundary", "Lighting boundary", summary.lightingBoundaryPreserved, claim.status),
        metric("chinese-boundary", "Chinese interface boundary", summary.chineseBoundaryPreserved, claim.status),
        metric("camera-boundary", "Deep-space camera boundary", summary.deepSpaceCameraBoundaryPreserved, claim.status),
        metric("reference-boundary", "Reference backdrop boundary", summary.universeSandboxReferenceBoundaryPreserved, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("universe-sandbox-clone", "Universe Sandbox clone", summary.universeSandboxCloneStatus, claim.status),
        metric("artistic-certification", "Artistic certification", summary.artisticCertificationStatus, claim.status),
        metric("wcag-certification", "WCAG certification", summary.wcagCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("online-validation", "Online validation", summary.onlineValidationStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: the helper is deterministic local metadata and browser tooling verifies DOM markers, screenshot pixel budgets and selected-subject markers outside the runtime UI.",
      assumptions: [
        "Reference-grade means a local art-direction target, not an external AAA or Universe Sandbox certification.",
        "Runtime rendering reads generated local public textures, existing planet textures and curated catalog rows only.",
      ],
      limitations: [
        "Does not claim Universe Sandbox clone status, AAA production certification, WCAG certification, scientific certification, online validation, online catalog completeness, CI status, or latest runtime command status.",
        "Does not add a new panel id, scientific observable, online astronomy database, full numerical relativity, cosmological N-body, or complete deep-sky catalog.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}

function planetaryMaterialCompositionClaim(): EvidenceClaim {
  const summary = createAtlasPlanetaryMaterialCompositionSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "planetary-material-composition",
    group: "planetary-material-composition",
    title: "Planetary material composition",
    status: "informational",
    confidence: "visual",
    source: `Atlas Planetary Material Composition ${ATLAS_PLANETARY_MATERIAL_COMPOSITION_VERSION}`,
    model: "Local v49 planet material maps, cloud/night masks, gas-band contrast cues, Saturn ring opacity cues and solar shader depth over existing rendering layers",
    metric: `${summary.materialTarget}; ${summary.earthMaterialProfile}; ${summary.saturnRingProfile}`,
    error: "No AAA, WCAG, scientific, CI, online validation, asset completeness or physics certification budget; this is local material-composition metadata only.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Planetary Material Composition ${summary.version}`,
        "Developer-refreshed or generated local planet texture maps under public/textures/planets",
        "Existing local HD planet texture manifest with 2K overview fallback",
        "Planet, SunBody and Saturn ring rendering layers only",
        "v41 accessibility, v42 cinematic workbench, v43 planetary fidelity, v44 lighting, v45 Chinese interface, v46 camera, v47 reference backdrop and v48 reference-grade space art boundaries",
      ],
      method:
        "Describe deterministic local material composition profiles for selected-body close-up rendering, including Earth cloud/night composition, gas-giant band readability, Saturn ring layering, solar granulation, and lunar/Mars relief cues without changing physics state.",
      metrics: [
        metric("planetary-material-version", "Planetary material version", summary.version, claim.status),
        metric("material-target", "Material target", summary.materialTarget, claim.status),
        metric("asset-policy", "Asset policy", summary.assetPolicy, claim.status),
        metric("runtime-assets", "Runtime assets", summary.runtimeAssetSource, claim.status),
        metric("default-material", "Default material", summary.defaultMaterialProfile, claim.status),
        metric("earth-material", "Earth material", summary.earthMaterialProfile, claim.status),
        metric("earth-atmosphere", "Earth atmosphere", summary.earthAtmosphereProfile, claim.status),
        metric("earth-terminator", "Earth terminator", summary.earthTerminatorProfile, claim.status),
        metric("gas-giant-material", "Gas giant material", summary.gasGiantMaterialProfile, claim.status),
        metric("gas-giant-atmosphere", "Gas giant atmosphere", summary.gasGiantAtmosphereProfile, claim.status),
        metric("saturn-material", "Saturn material", summary.saturnMaterialProfile, claim.status),
        metric("saturn-ring", "Saturn ring", summary.saturnRingProfile, claim.status),
        metric("solar-material", "Solar material", summary.solarMaterialProfile, claim.status),
        metric("solar-atmosphere", "Solar atmosphere", summary.solarAtmosphereProfile, claim.status),
        metric("lunar-mars-material", "Lunar/Mars material", summary.lunarMarsMaterialProfile, claim.status),
        metric("lunar-mars-terminator", "Lunar/Mars terminator", summary.airlessTerminatorProfile, claim.status),
        metric("aa-boundary", "AA boundary", summary.aaBoundaryPreserved, claim.status),
        metric("reference-grade-boundary", "Reference-grade boundary", summary.referenceGradeBoundaryPreserved, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("artistic-certification", "Artistic certification", summary.artisticCertificationStatus, claim.status),
        metric("wcag-certification", "WCAG certification", summary.wcagCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("asset-completeness-certification", "Asset completeness certification", summary.assetCompletenessCertificationStatus, claim.status),
        metric("online-validation", "Online validation", summary.onlineValidationStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: the helper is deterministic local metadata and browser tooling verifies DOM markers, selected-body profiles and local review images outside the runtime UI.",
      assumptions: [
        "v49 close-up material composition is a local presentation target, not an external AAA or scientific certification.",
        "Runtime rendering reads local public textures only; development may prepare local assets ahead of runtime.",
      ],
      limitations: [
        "Does not claim AAA production certification, WCAG certification, scientific certification, online validation, online asset completeness, asset completeness certification, CI status, or latest runtime command status.",
        "Does not add a new panel id, scientific observable, online astronomy database, full numerical relativity, cosmological N-body, or complete deep-sky catalog.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}

function cinematicCloseupDirectorClaim(): EvidenceClaim {
  const summary = createAtlasCinematicCloseupDirectorSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "cinematic-closeup-director",
    group: "cinematic-closeup-director",
    title: "Cinematic close-up director",
    status: "informational",
    confidence: "visual",
    source: `Atlas Cinematic Close-up Director ${ATLAS_CINEMATIC_CLOSEUP_DIRECTOR_VERSION}`,
    model: "Local v50 selected-body composition profiles, panel-safe subject placement cues, subject-in-frame markers and Saturn ring showcase rendering over existing camera and material layers",
    metric: `${summary.compositionTarget}; ${summary.saturnCompositionProfile}; ${summary.saturnRingShowcaseProfile}`,
    error: "No AAA, WCAG, scientific, CI, online validation, asset completeness, Universe Sandbox clone or physics certification budget; this is local close-up composition metadata only.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Cinematic Close-up Director ${summary.version}`,
        "Existing selected-body state, browser subject-in-frame markers and local planet material profiles",
        "Planet, Sun, Saturn ring, camera distance and deep-space subject matte presentation layers only",
        "v41 accessibility through v49 planetary material composition boundaries",
      ],
      method:
        "Describe deterministic close-up composition profiles for selected Earth, Sun, gas giants, Saturn rings and lunar/Mars bodies, then expose stable DOM markers and rendering profiles without changing body state, mass, velocity, ephemerides, integrators or worker physics.",
      metrics: [
        metric("closeup-director-version", "Close-up director version", summary.version, claim.status),
        metric("composition-target", "Composition target", summary.compositionTarget, claim.status),
        metric("quality-budget", "Quality budget", summary.qualityBudget, claim.status),
        metric("asset-policy", "Asset policy", summary.assetPolicy, claim.status),
        metric("runtime-assets", "Runtime assets", summary.runtimeAssetSource, claim.status),
        metric("default-composition", "Default composition", summary.defaultCompositionProfile, claim.status),
        metric("earth-composition", "Earth composition", summary.earthCompositionProfile, claim.status),
        metric("solar-composition", "Solar composition", summary.solarCompositionProfile, claim.status),
        metric("gas-giant-composition", "Gas giant composition", summary.gasGiantCompositionProfile, claim.status),
        metric("saturn-composition", "Saturn composition", summary.saturnCompositionProfile, claim.status),
        metric("saturn-ring-showcase", "Saturn ring showcase", summary.saturnRingShowcaseProfile, claim.status),
        metric("desktop-panel-avoidance", "Desktop panel avoidance", summary.desktopPanelAvoidanceProfile, claim.status),
        metric("mobile-panel-avoidance", "Mobile panel avoidance", summary.mobilePanelAvoidanceProfile, claim.status),
        metric("planetary-material-boundary", "Planetary material boundary", summary.planetaryMaterialBoundaryPreserved, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("artistic-certification", "Artistic certification", summary.artisticCertificationStatus, claim.status),
        metric("wcag-certification", "WCAG certification", summary.wcagCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("universe-sandbox-clone", "Universe Sandbox clone", summary.universeSandboxCloneStatus, claim.status),
        metric("online-validation", "Online validation", summary.onlineValidationStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: the helper is deterministic local metadata and browser tooling verifies DOM markers, selected-body profiles, subject-in-frame markers and local review screenshots outside the runtime UI.",
      assumptions: [
        "v50 close-up director is a local art-direction target inspired by high-end scientific simulation composition, not an external AAA certification.",
        "Runtime rendering reads local public textures and live selected-body state only; it does not fetch assets or validate online completeness.",
      ],
      limitations: [
        "Does not claim Universe Sandbox clone status, AAA production certification, WCAG certification, scientific certification, online validation, online asset completeness, CI status, or latest runtime command status.",
        "Does not add a new panel id, scientific observable, online astronomy database, full numerical relativity, cosmological N-body, or complete deep-sky catalog.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}

function cinematicKeyLightDirectorClaim(): EvidenceClaim {
  const summary = createAtlasCinematicKeyLightDirectorSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "cinematic-key-light-director",
    group: "cinematic-key-light-director",
    title: "Cinematic key-light director",
    status: "informational",
    confidence: "visual",
    source: `Atlas Cinematic Key-Light Director ${ATLAS_CINEMATIC_KEY_LIGHT_DIRECTOR_VERSION}`,
    model: "Local v51 selected-body key-light and phase readability profiles over existing planet material, Saturn ring and close-up composition layers",
    metric: `${summary.lightingTarget}; ${summary.gasGiantKeyLightProfile}; ${summary.saturnKeyLightProfile}`,
    error: "No AAA, WCAG, scientific, CI, online validation, asset completeness, Universe Sandbox clone or physics certification budget; this is local key-light composition metadata only.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Cinematic Key-Light Director ${summary.version}`,
        "Existing selected-body state, local v49 material profiles and v50 close-up composition profiles",
        "Planet, Saturn ring and presentation-lighting rendering layers only",
        "v41 accessibility through v50 close-up director boundaries",
      ],
      method:
        "Describe deterministic key-light profiles for selected Earth, Sun, gas giants, Saturn rings and lunar/Mars bodies, then expose stable DOM markers and rendering cues without changing body state, mass, velocity, ephemerides, integrators or worker physics.",
      metrics: [
        metric("key-light-director-version", "Key-light director version", summary.version, claim.status),
        metric("lighting-target", "Lighting target", summary.lightingTarget, claim.status),
        metric("quality-budget", "Quality budget", summary.qualityBudget, claim.status),
        metric("asset-policy", "Asset policy", summary.assetPolicy, claim.status),
        metric("runtime-assets", "Runtime assets", summary.runtimeAssetSource, claim.status),
        metric("default-key-light", "Default key light", summary.defaultKeyLightProfile, claim.status),
        metric("earth-key-light", "Earth key light", summary.earthKeyLightProfile, claim.status),
        metric("solar-key-light", "Solar key light", summary.solarKeyLightProfile, claim.status),
        metric("gas-giant-key-light", "Gas giant key light", summary.gasGiantKeyLightProfile, claim.status),
        metric("saturn-key-light", "Saturn key light", summary.saturnKeyLightProfile, claim.status),
        metric("lunar-mars-key-light", "Lunar/Mars key light", summary.lunarMarsKeyLightProfile, claim.status),
        metric("planetary-material-boundary", "Planetary material boundary", summary.planetaryMaterialBoundaryPreserved, claim.status),
        metric("closeup-director-boundary", "Close-up director boundary", summary.closeupDirectorBoundaryPreserved, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("artistic-certification", "Artistic certification", summary.artisticCertificationStatus, claim.status),
        metric("wcag-certification", "WCAG certification", summary.wcagCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("universe-sandbox-clone", "Universe Sandbox clone", summary.universeSandboxCloneStatus, claim.status),
        metric("online-validation", "Online validation", summary.onlineValidationStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: the helper is deterministic local metadata and browser tooling verifies DOM markers, selected-body key-light profiles and local review screenshots outside the runtime UI.",
      assumptions: [
        "v51 key-light director is a local art-direction target for close-up readability, not an external AAA or Universe Sandbox certification.",
        "Runtime rendering reads local public textures and live selected-body state only; it does not fetch assets or validate online completeness.",
      ],
      limitations: [
        "Does not claim Universe Sandbox clone status, AAA production certification, WCAG certification, scientific certification, online validation, online asset completeness, CI status, or latest runtime command status.",
        "Does not add a new panel id, scientific observable, online astronomy database, full numerical relativity, cosmological N-body, or complete deep-sky catalog.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}

function planetaryDepthLightingClaim(): EvidenceClaim {
  const summary = createAtlasPlanetaryDepthLightingSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "planetary-depth-lighting",
    group: "planetary-depth-lighting",
    title: "Planetary depth lighting",
    status: "informational",
    confidence: "visual",
    source: `Atlas Planetary Depth Lighting ${ATLAS_PLANETARY_DEPTH_LIGHTING_VERSION}`,
    model: "Local v52 close-up atmospheric rim, terminator, gas-band and Saturn ring-shadow profiles over existing v49-v51 rendering layers",
    metric: `${summary.lightingTarget}; ${summary.gasGiantDepthLightingProfile}; ${summary.saturnDepthLightingProfile}`,
    error: "No AAA, WCAG, scientific, CI, online validation, asset completeness, Universe Sandbox clone or physics certification budget; this is local depth-lighting composition metadata only.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Planetary Depth Lighting ${summary.version}`,
        "Existing selected-body state, local v49 material profiles, v50 close-up director and v51 key-light director",
        "Planet, Sun, Saturn ring and presentation-lighting rendering layers only",
        "v41 accessibility through v51 key-light director boundaries",
      ],
      method:
        "Describe deterministic depth-lighting profiles for selected Earth, Sun, gas giants, Saturn rings and lunar/Mars bodies, then expose stable DOM markers and rendering cues without changing body state, mass, velocity, ephemerides, integrators or worker physics.",
      metrics: [
        metric("planetary-depth-lighting-version", "Planetary depth-lighting version", summary.version, claim.status),
        metric("lighting-target", "Lighting target", summary.lightingTarget, claim.status),
        metric("quality-budget", "Quality budget", summary.qualityBudget, claim.status),
        metric("asset-policy", "Asset policy", summary.assetPolicy, claim.status),
        metric("runtime-assets", "Runtime assets", summary.runtimeAssetSource, claim.status),
        metric("default-depth-lighting", "Default depth lighting", summary.defaultDepthLightingProfile, claim.status),
        metric("earth-depth-lighting", "Earth depth lighting", summary.earthDepthLightingProfile, claim.status),
        metric("solar-depth-lighting", "Solar depth lighting", summary.solarDepthLightingProfile, claim.status),
        metric("gas-giant-depth-lighting", "Gas giant depth lighting", summary.gasGiantDepthLightingProfile, claim.status),
        metric("saturn-depth-lighting", "Saturn depth lighting", summary.saturnDepthLightingProfile, claim.status),
        metric("lunar-mars-depth-lighting", "Lunar/Mars depth lighting", summary.lunarMarsDepthLightingProfile, claim.status),
        metric("atmosphere-rim-cue", "Atmosphere rim cue", summary.atmosphereRimCue, claim.status),
        metric("terminator-cue", "Terminator cue", summary.terminatorCue, claim.status),
        metric("gas-band-cue", "Gas band cue", summary.gasBandCue, claim.status),
        metric("ring-shadow-cue", "Ring shadow cue", summary.ringShadowCue, claim.status),
        metric("key-light-boundary", "Key-light boundary", summary.keyLightBoundaryPreserved, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("artistic-certification", "Artistic certification", summary.artisticCertificationStatus, claim.status),
        metric("wcag-certification", "WCAG certification", summary.wcagCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("universe-sandbox-clone", "Universe Sandbox clone", summary.universeSandboxCloneStatus, claim.status),
        metric("online-validation", "Online validation", summary.onlineValidationStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: the helper is deterministic local metadata and browser tooling verifies DOM markers, selected-body depth-lighting profiles and local review screenshots outside the runtime UI.",
      assumptions: [
        "v52 planetary depth lighting is a local art-direction target for close-up material depth, not an external AAA or Universe Sandbox certification.",
        "Runtime rendering reads local public textures and live selected-body state only; it does not fetch assets or validate online completeness.",
      ],
      limitations: [
        "Does not claim Universe Sandbox clone status, AAA production certification, WCAG certification, scientific certification, online validation, online asset completeness, CI status, or latest runtime command status.",
        "Does not add a new panel id, scientific observable, online astronomy database, full numerical relativity, cosmological N-body, or complete deep-sky catalog.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}

function planetaryColorGradingClaim(): EvidenceClaim {
  const summary = createAtlasPlanetaryColorGradingSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "planetary-color-grading",
    group: "planetary-color-grading",
    title: "Planetary color grading",
    status: "informational",
    confidence: "visual",
    source: `Atlas Planetary Color Grading ${ATLAS_PLANETARY_COLOR_GRADING_VERSION}`,
    model: "Local v53 close-up color separation and gas-layer microcontrast profiles over existing v49-v52 rendering layers",
    metric: `${summary.colorTarget}; ${summary.gasGiantColorGradeProfile}; ${summary.saturnColorGradeProfile}`,
    error: "No AAA, WCAG, scientific, CI, online validation, asset completeness, Universe Sandbox clone or physics certification budget; this is local color-grading composition metadata only.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Planetary Color Grading ${summary.version}`,
        "Existing selected-body state, local v49 material profiles, v50 close-up director, v51 key-light director and v52 depth-lighting profiles",
        "Planet, Sun, Saturn ring and presentation color-grading rendering layers only",
        "v41 accessibility through v52 planetary depth-lighting boundaries",
      ],
      method:
        "Describe deterministic color-grade profiles for selected Earth, Sun, gas giants, Saturn rings and lunar/Mars bodies, then expose stable DOM markers and rendering cues without changing body state, mass, velocity, ephemerides, integrators or worker physics.",
      metrics: [
        metric("planetary-color-grading-version", "Planetary color-grading version", summary.version, claim.status),
        metric("color-target", "Color target", summary.colorTarget, claim.status),
        metric("quality-budget", "Quality budget", summary.qualityBudget, claim.status),
        metric("asset-policy", "Asset policy", summary.assetPolicy, claim.status),
        metric("runtime-assets", "Runtime assets", summary.runtimeAssetSource, claim.status),
        metric("default-color-grade", "Default color grade", summary.defaultColorGradeProfile, claim.status),
        metric("earth-color-grade", "Earth color grade", summary.earthColorGradeProfile, claim.status),
        metric("solar-color-grade", "Solar color grade", summary.solarColorGradeProfile, claim.status),
        metric("gas-giant-color-grade", "Gas giant color grade", summary.gasGiantColorGradeProfile, claim.status),
        metric("saturn-color-grade", "Saturn color grade", summary.saturnColorGradeProfile, claim.status),
        metric("lunar-mars-color-grade", "Lunar/Mars color grade", summary.lunarMarsColorGradeProfile, claim.status),
        metric("color-separation-cue", "Color separation cue", summary.colorSeparationCue, claim.status),
        metric("gas-layer-cue", "Gas layer cue", summary.gasLayerCue, claim.status),
        metric("saturn-occlusion-cue", "Saturn occlusion cue", summary.saturnOcclusionCue, claim.status),
        metric("depth-lighting-boundary", "Depth-lighting boundary", summary.depthLightingBoundaryPreserved, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("artistic-certification", "Artistic certification", summary.artisticCertificationStatus, claim.status),
        metric("wcag-certification", "WCAG certification", summary.wcagCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("universe-sandbox-clone", "Universe Sandbox clone", summary.universeSandboxCloneStatus, claim.status),
        metric("online-validation", "Online validation", summary.onlineValidationStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: the helper is deterministic local metadata and browser tooling verifies DOM markers, selected-body color-grade profiles and local review screenshots outside the runtime UI.",
      assumptions: [
        "v53 planetary color grading is a local art-direction target for close-up color and gas-layer depth, not an external AAA or Universe Sandbox certification.",
        "Runtime rendering reads local public textures and live selected-body state only; it does not fetch assets or validate online completeness.",
      ],
      limitations: [
        "Does not claim Universe Sandbox clone status, AAA production certification, WCAG certification, scientific certification, online validation, online asset completeness, CI status, or latest runtime command status.",
        "Does not add a new panel id, scientific observable, online astronomy database, full numerical relativity, cosmological N-body, or complete deep-sky catalog.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}

function numericalIntegrityGateClaim(diagnostics: SimulationDiagnostics | null): EvidenceClaim {
  const summary = createAtlasNumericalIntegritySummary(diagnostics);
  const claim: EvidenceClaimWithoutPassport = {
    id: "numerical-integrity-gate",
    group: "numerical-integrity-gate",
    title: "Numerical integrity gate",
    status: summary.status,
    confidence: "formula-checked",
    source: `Atlas Numerical Integrity ${ATLAS_NUMERICAL_INTEGRITY_VERSION}`,
    model:
      "Read-only local audit over existing conservation drift diagnostics plus deterministic local timestep, time-reversal and unit-audit test coverage",
    metric: `${summary.integrityStatus}; energy ${summary.energyDriftTrend}; angular momentum ${summary.angularMomentumDriftTrend}`,
    error:
      "No runtime benchmark execution, CI status, scientific certification, online validation, new physics model, integrator mutation, or Kerr kernel replacement is claimed.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Numerical Integrity ${summary.version}`,
        "Existing SimulationDiagnostics energyHistory, angMomHistory, relEnergyDrift and relAngMomDrift",
        "Local deterministic unit tests for timestep sensitivity, time reversal and unit audit",
        "v35 Kerr numerical-health boundary and EIH 1PN solar-system dynamics boundary",
      ],
      method:
        "Classify current conservation drift trends from local diagnostics and document deterministic local benchmark coverage without running heavy benchmarks in the runtime UI or mutating physics state.",
      metrics: [
        metric("numerical-integrity-version", "Numerical integrity version", summary.version, claim.status),
        metric("integrity-status", "Integrity status", summary.integrityStatus, claim.status),
        metric("energy-drift-trend", "Energy drift trend", summary.energyDriftTrend, claim.status),
        metric(
          "angular-momentum-drift-trend",
          "Angular momentum drift trend",
          summary.angularMomentumDriftTrend,
          claim.status,
        ),
        metric("current-energy-drift", "Current energy drift", formatNumber(summary.currentEnergyDrift, 6), claim.status),
        metric(
          "current-angular-momentum-drift",
          "Current angular momentum drift",
          formatNumber(summary.currentAngularMomentumDrift, 6),
          claim.status,
        ),
        metric("max-energy-drift", "Max energy drift", formatNumber(summary.maxEnergyDrift, 6), claim.status),
        metric(
          "max-angular-momentum-drift",
          "Max angular momentum drift",
          formatNumber(summary.maxAngularMomentumDrift, 6),
          claim.status,
        ),
        metric("energy-drift-slope", "Energy drift slope", formatNumber(summary.energyDriftSlope, 6), claim.status),
        metric(
          "angular-momentum-drift-slope",
          "Angular momentum drift slope",
          formatNumber(summary.angularMomentumDriftSlope, 6),
          claim.status,
        ),
        metric(
          "timestep-sensitivity-coverage",
          "Timestep sensitivity coverage",
          summary.timestepSensitivityCoverage,
          claim.status,
        ),
        metric("time-reversal-coverage", "Time reversal coverage", summary.timeReversalCoverage, claim.status),
        metric("unit-audit-coverage", "Unit audit coverage", summary.unitAuditCoverage, claim.status),
        metric("benchmark-count", "Benchmark count", `${summary.benchmarkCount}`, claim.status),
        metric(
          "runtime-benchmark-execution",
          "Runtime benchmark execution",
          summary.runtimeBenchmarkExecution,
          claim.status,
        ),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("ci-certification", "CI certification", summary.ciCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("online-validation", "Online validation", summary.onlineValidationStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Formula-check confidence: runtime summary is derived from existing drift diagnostics, while timestep, time-reversal and unit-audit coverage is asserted by local deterministic tests rather than by the runtime UI.",
      assumptions: [
        "The numerical-integrity gate is a local audit layer over existing diagnostics and local tests.",
        "Benchmark coverage describes local test coverage only; it is not the latest command result or CI certification.",
      ],
      limitations: [
        "Does not claim latest runtime command pass/fail, CI certification, scientific certification, online validation, online completeness, or asset completeness.",
        "Does not add J2, radiation pressure, tides, new relativity terms, full numerical relativity, cosmological N-body, or a new astronomical database.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics, or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}

function cinematicPlanetaryArtDirectionClaim(): EvidenceClaim {
  const summary = createAtlasCinematicPlanetaryArtDirectionSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "cinematic-planetary-art-direction",
    group: "cinematic-planetary-art-direction",
    title: "Cinematic planetary art direction",
    status: "informational",
    confidence: "visual",
    source: `Atlas Cinematic Planetary Art Direction ${ATLAS_CINEMATIC_PLANETARY_ART_DIRECTION_VERSION}`,
    model:
      "Local v55 balanced background and selected-body art-direction profiles over existing v48-v54 visual and audit layers",
    metric: `${summary.qualityTarget}; ${summary.globalColorGradeProfile}; ${summary.closeupBackgroundArtGradeProfile}`,
    error:
      "No Universe Sandbox clone, AAA/WCAG/science/CI certification, online validation, runtime asset completeness claim, or physics mutation is claimed.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Cinematic Planetary Art Direction ${summary.version}`,
        "User reference direction, local Playwright review screenshots, and Universe Sandbox public pages as visual inspiration only",
        "Existing v48 background composition, v49 material assets, v52 depth lighting, v53 color grading and v54 numerical boundary",
        "Planet, Sun, Saturn ring, background shader, post-FX and local v55 prepared assets only",
      ],
      method:
        "Describe deterministic selected-body art profiles for gas giants, Saturn rings, Earth cloud/night, solar surface, global color grade and background negative-space treatment, then expose DOM markers and rendering cues without changing body state, ephemerides, integrators or worker physics.",
      metrics: [
        metric("cinematic-planetary-art-version", "Cinematic planetary art version", summary.version, claim.status),
        metric("reference-mode", "Reference mode", summary.referenceMode, claim.status),
        metric("quality-target", "Quality target", summary.qualityTarget, claim.status),
        metric("asset-policy", "Asset policy", summary.assetPolicy, claim.status),
        metric("runtime-assets", "Runtime assets", summary.runtimeAssetSource, claim.status),
        metric("gas-giant-art-profile", "Gas giant art profile", summary.gasGiantArtProfile, claim.status),
        metric("saturn-gas-art-profile", "Saturn gas art profile", summary.saturnGasGiantArtProfile, claim.status),
        metric("saturn-ring-art-profile", "Saturn ring art profile", summary.saturnRingArtProfile, claim.status),
        metric("earth-cloud-night-profile", "Earth cloud/night profile", summary.earthCloudNightProfile, claim.status),
        metric("solar-surface-profile", "Solar surface profile", summary.solarSurfaceProfile, claim.status),
        metric("global-color-grade-profile", "Global color grade profile", summary.globalColorGradeProfile, claim.status),
        metric("background-art-grade-profile", "Background art grade profile", summary.defaultBackgroundArtGradeProfile, claim.status),
        metric("closeup-background-art-grade-profile", "Close-up background art grade", summary.closeupBackgroundArtGradeProfile, claim.status),
        metric("background-reference-cue", "Background reference cue", summary.backgroundReferenceCue, claim.status),
        metric("earth-night-cue", "Earth night cue", summary.earthNightCue, claim.status),
        metric("gas-band-cue", "Gas band cue", summary.gasBandCue, claim.status),
        metric("saturn-ring-cue", "Saturn ring cue", summary.saturnRingCue, claim.status),
        metric("solar-surface-cue", "Solar surface cue", summary.solarSurfaceCue, claim.status),
        metric("v54-boundary", "v54 numerical boundary", summary.numericalIntegrityBoundaryPreserved, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("artistic-certification", "Artistic certification", summary.artisticCertificationStatus, claim.status),
        metric("wcag-certification", "WCAG certification", summary.wcagCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("ci-certification", "CI certification", summary.ciCertificationStatus, claim.status),
        metric("universe-sandbox-clone", "Universe Sandbox clone", summary.universeSandboxCloneStatus, claim.status),
        metric("online-validation", "Online validation", summary.onlineValidationStatus, claim.status),
        metric("online-asset-completeness", "Online asset completeness", summary.onlineAssetCompletenessStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: the helper is deterministic local metadata and browser tooling verifies DOM markers, selected-body art profiles, pixel budgets and local review screenshots outside the runtime UI.",
      assumptions: [
        "Universe Sandbox is used as a visual reference direction, not as an asset or certification source.",
        "Development may refresh or generate local helper assets, but runtime rendering reads prepared local public textures only.",
      ],
      limitations: [
        "Does not claim Universe Sandbox clone status, AAA production certification, WCAG certification, scientific certification, online validation, online asset completeness, CI status, or latest runtime command status.",
        "Does not add a new panel id, scientific observable, online astronomy database, full numerical relativity, cosmological N-body, or complete deep-sky catalog.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}

function cinematicDeepSpaceBackdropClaim(): EvidenceClaim {
  const summary = createAtlasCinematicDeepSpaceBackdropSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "cinematic-deep-space-backdrop",
    group: "cinematic-deep-space-backdrop",
    title: "Cinematic deep-space backdrop",
    status: "informational",
    confidence: "visual",
    source: `Atlas Cinematic Deep-Space Backdrop ${ATLAS_CINEMATIC_DEEP_SPACE_BACKDROP_VERSION}`,
    model:
      "Local v56 NASA SVS prepared sky manifest, sparse starfield, nebula haze and selected-body negative-space profiles over existing v48-v55 render layers",
    metric: `${summary.skyManifest}; ${summary.starfieldProfile}; ${summary.negativeSpaceProfile}`,
    error:
      "No Universe Sandbox clone, AAA/WCAG/science/CI certification, online validation, runtime asset completeness claim, or physics mutation is claimed.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Cinematic Deep-Space Backdrop ${summary.version}`,
        "Universe Sandbox public screenshots as composition reference only",
        "NASA SVS Deep Star Maps 2020 and Elsewhere Starfield 2020 cached during development",
        "Local v56 sky manifest, GalaxyEnvironmentSphere shader layers, ScienceBackdrop and browser acceptance screenshots",
      ],
      method:
        "Describe deterministic local sky manifest, sparse primary-star layer, faint distant-star layer, Milky Way dark-lane mask, soft nebula haze and selected-body negative-space profile without fetching data at runtime or changing body state, ephemerides, integrators or worker physics.",
      metrics: [
        metric("cinematic-backdrop-version", "Cinematic backdrop version", summary.version, claim.status),
        metric("reference-mode", "Reference mode", summary.referenceMode, claim.status),
        metric("source-policy", "Source policy", summary.sourcePolicy, claim.status),
        metric("sky-manifest", "Sky manifest", summary.skyManifest, claim.status),
        metric("runtime-assets", "Runtime assets", summary.runtimeAssetSource, claim.status),
        metric("source-inputs", "Source inputs", summary.sourceInputs.join(", "), claim.status),
        metric("starfield-profile", "Starfield profile", summary.starfieldProfile, claim.status),
        metric("closeup-starfield-profile", "Close-up starfield profile", summary.closeupStarfieldProfile, claim.status),
        metric("nebula-profile", "Nebula profile", summary.nebulaProfile, claim.status),
        metric("closeup-nebula-profile", "Close-up nebula profile", summary.closeupNebulaProfile, claim.status),
        metric("negative-space-profile", "Negative-space profile", summary.negativeSpaceProfile, claim.status),
        metric("closeup-negative-space-profile", "Close-up negative-space profile", summary.closeupNegativeSpaceProfile, claim.status),
        metric("highlight-policy", "Highlight policy", summary.backgroundHighlightPolicy, claim.status),
        metric("dark-lane-policy", "Dark-lane policy", summary.milkyWayDarkLanePolicy, claim.status),
        metric("v55-boundary", "v55 planetary art boundary", summary.planetaryArtBoundaryPreserved, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("artistic-certification", "Artistic certification", summary.artisticCertificationStatus, claim.status),
        metric("wcag-certification", "WCAG certification", summary.wcagCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("ci-certification", "CI certification", summary.ciCertificationStatus, claim.status),
        metric("universe-sandbox-clone", "Universe Sandbox clone", summary.universeSandboxCloneStatus, claim.status),
        metric("online-validation", "Online validation", summary.onlineValidationStatus, claim.status),
        metric("online-asset-completeness", "Online asset completeness", summary.onlineAssetCompletenessStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: the helper is deterministic local metadata and browser tooling verifies DOM markers, selected-body backdrop profiles, pixel budgets and local review screenshots outside the runtime UI.",
      assumptions: [
        "Universe Sandbox is used as a visual reference direction, not as an asset or certification source.",
        "NASA SVS inputs may be downloaded during development and converted into local runtime sky assets.",
        "Runtime rendering reads prepared local public textures only.",
      ],
      limitations: [
        "Does not claim Universe Sandbox clone status, AAA production certification, WCAG certification, scientific certification, online validation, online asset completeness, CI status, or latest runtime command status.",
        "Does not add a new panel id, scientific observable, online astronomy database, full numerical relativity, cosmological N-body, or complete deep-sky catalog.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}

function sparseDeepSpaceDirectorClaim(): EvidenceClaim {
  const summary = createAtlasSparseDeepSpaceDirectorSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "sparse-deep-space-director",
    group: "sparse-deep-space-director",
    title: "Sparse deep-space director",
    status: "informational",
    confidence: "visual",
    source: `Atlas Sparse Deep-Space Director ${ATLAS_SPARSE_DEEP_SPACE_DIRECTOR_VERSION}`,
    model:
      "Local v57 NASA SVS 16K prepared sky manifest with sparse primary stars, ultra-faint distant stars, deep Milky Way dark lanes, soft haze and selected-body negative-space profiles",
    metric: `${summary.skyManifest}; ${summary.starfieldProfile}; ${summary.negativeSpaceProfile}`,
    error:
      "No Universe Sandbox clone, AAA/WCAG/science/CI certification, online validation, runtime asset completeness claim, or physics mutation is claimed.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Sparse Deep-Space Director ${summary.version}`,
        "Universe Sandbox public screenshots as sparse composition reference only",
        "NASA SVS Deep Star Maps 2020 16K and Elsewhere Starfield 2020 16K cached during development",
        "Local v57 sky manifest, dual star layers, GalaxyEnvironmentSphere shader uniforms, ScienceBackdrop and browser acceptance screenshots",
      ],
      method:
        "Describe deterministic local v57 sky manifest, sparse primary-star layer, ultra-faint distant-star layer, deep Milky Way dark-lane treatment, barely visible nebula haze and selected-body negative-space profiles without fetching data at runtime or changing body state, ephemerides, integrators or worker physics.",
      metrics: [
        metric("sparse-deep-space-version", "Sparse deep-space version", summary.version, claim.status),
        metric("reference-mode", "Reference mode", summary.referenceMode, claim.status),
        metric("source-policy", "Source policy", summary.sourcePolicy, claim.status),
        metric("sky-manifest", "Sky manifest", summary.skyManifest, claim.status),
        metric("runtime-assets", "Runtime assets", summary.runtimeAssetSource, claim.status),
        metric("source-inputs", "Source inputs", summary.sourceInputs.join(", "), claim.status),
        metric("starfield-profile", "Starfield profile", summary.starfieldProfile, claim.status),
        metric("closeup-starfield-profile", "Close-up starfield profile", summary.closeupStarfieldProfile, claim.status),
        metric("milky-way-profile", "Milky Way profile", summary.milkyWayProfile, claim.status),
        metric("closeup-milky-way-profile", "Close-up Milky Way profile", summary.closeupMilkyWayProfile, claim.status),
        metric("nebula-profile", "Nebula profile", summary.nebulaProfile, claim.status),
        metric("closeup-nebula-profile", "Close-up nebula profile", summary.closeupNebulaProfile, claim.status),
        metric("negative-space-profile", "Negative-space profile", summary.negativeSpaceProfile, claim.status),
        metric("closeup-negative-space-profile", "Close-up negative-space profile", summary.closeupNegativeSpaceProfile, claim.status),
        metric("background-pixel-budget", "Background pixel budget", summary.backgroundPixelBudget, claim.status),
        metric("v41-boundary", "v41 accessibility boundary", summary.aaBoundaryPreserved, claim.status),
        metric("v56-boundary", "v56 backdrop boundary", summary.cinematicBackdropBoundaryPreserved, claim.status),
        metric("v55-boundary", "v55 planetary art boundary", summary.planetaryArtBoundaryPreserved, claim.status),
        metric("v54-boundary", "v54 numerical boundary", summary.numericalIntegrityBoundaryPreserved, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("artistic-certification", "Artistic certification", summary.artisticCertificationStatus, claim.status),
        metric("wcag-certification", "WCAG certification", summary.wcagCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("ci-certification", "CI certification", summary.ciCertificationStatus, claim.status),
        metric("universe-sandbox-clone", "Universe Sandbox clone", summary.universeSandboxCloneStatus, claim.status),
        metric("online-validation", "Online validation", summary.onlineValidationStatus, claim.status),
        metric("online-asset-completeness", "Online asset completeness", summary.onlineAssetCompletenessStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: the helper is deterministic local metadata and browser tooling verifies DOM markers, selected-body sparse-backdrop profiles, non-brittle pixel budgets and local review screenshots outside the runtime UI.",
      assumptions: [
        "Universe Sandbox is used as a sparse deep-space visual reference direction, not as an asset or certification source.",
        "NASA SVS 16K inputs may be downloaded during development and converted into local runtime sky assets.",
        "Runtime rendering reads prepared local public textures only.",
      ],
      limitations: [
        "Does not claim Universe Sandbox clone status, AAA production certification, WCAG certification, scientific certification, online validation, online asset completeness, CI status, or latest runtime command status.",
        "Does not add a new panel id, scientific observable, online astronomy database, full numerical relativity, cosmological N-body, or complete deep-sky catalog.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}

function closeupPresentationTruthClaim(): EvidenceClaim {
  const summary = createAtlasCloseupPresentationTruthSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "closeup-presentation-truth",
    group: "closeup-presentation-truth",
    title: "Close-up presentation truth",
    status: "informational",
    confidence: "visual",
    source: `Atlas Close-Up Presentation Truth ${ATLAS_CLOSEUP_PRESENTATION_TRUTH_VERSION}`,
    model:
      "Local v58 selected-body preview sync plus v62 layered parallax darkfield, depth-aware orbit hairlines, solar limb control, close-up orbit budget, depth occlusion and read-only velocity-color presentation cues",
    metric: `${summary.backgroundArtProfile}; ${summary.orbitHierarchyProfile}; ${summary.orbitPerformanceProfile}; ${summary.orbitMaterialProfile}; ${summary.solarCloseupProfile}; ${summary.velocityTrailProfile}`,
    error:
      "No physics mutation, Universe Sandbox clone, AAA/WCAG/science/CI certification, online validation, runtime command result or online asset completeness claim is made.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Close-Up Presentation Truth ${summary.version}`,
        "Existing selected-body state, local planet texture manifests and v57 sparse deep-space profiles",
        "BodyDetailSidebar preview markers, GalaxyEnvironmentSphere close-up backdrop cues and browser acceptance screenshots",
      ],
      method:
        "Describe deterministic local selected-body preview synchronization, solar clean-backdrop treatment and body-specific close-up readability profiles without fetching runtime assets or changing body state, ephemerides, integrators, worker physics or Kerr behavior.",
      metrics: [
        metric("closeup-presentation-version", "Close-up presentation version", summary.version, claim.status),
        metric("background-orbit-art-version", "Background and orbit art version", summary.backgroundOrbitArtVersion, claim.status),
        metric("preview-sync-target", "Preview sync target", summary.previewSyncTarget, claim.status),
        metric("default-preview-sync", "Default preview sync", summary.defaultPreviewSyncStatus, claim.status),
        metric("default-review-mode", "Default review mode", summary.defaultReviewMode, claim.status),
        metric("scene-review-mode", "Scene review mode", summary.sceneReviewMode, claim.status),
        metric("solar-backdrop-profile", "Solar backdrop profile", summary.solarBackdropProfile, claim.status),
        metric("planet-readability-profile", "Planet readability profile", summary.planetReadabilityProfile, claim.status),
        metric("background-art-profile", "Background art profile", summary.backgroundArtProfile, claim.status),
        metric("orbit-hierarchy-profile", "Orbit hierarchy profile", summary.orbitHierarchyProfile, claim.status),
        metric("orbit-performance-profile", "Orbit performance profile", summary.orbitPerformanceProfile, claim.status),
        metric("orbit-material-profile", "Orbit material profile", summary.orbitMaterialProfile, claim.status),
        metric("solar-closeup-profile", "Solar close-up profile", summary.solarCloseupProfile, claim.status),
        metric("velocity-trail-profile", "Velocity trail profile", summary.velocityTrailProfile, claim.status),
        metric("orbit-occlusion-profile", "Orbit occlusion profile", summary.orbitOcclusionProfile, claim.status),
        metric("preview-profiles", "Preview profiles", summary.supportedPreviewProfiles.join(", "), claim.status),
        metric("texture-policies", "Texture policies", summary.supportedTexturePolicies.join(", "), claim.status),
        metric("ring-states", "Ring states", summary.supportedRingStates.join(", "), claim.status),
        metric("v41-boundary", "v41 accessibility boundary", summary.aaBoundaryPreserved, claim.status),
        metric("v57-boundary", "v57 sparse deep-space boundary", summary.sparseDeepSpaceBoundaryPreserved, claim.status),
        metric("v55-boundary", "v55 planetary art boundary", summary.planetaryArtBoundaryPreserved, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("artistic-certification", "Artistic certification", summary.artisticCertificationStatus, claim.status),
        metric("wcag-certification", "WCAG certification", summary.wcagCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("ci-certification", "CI certification", summary.ciCertificationStatus, claim.status),
        metric("universe-sandbox-clone", "Universe Sandbox clone", summary.universeSandboxCloneStatus, claim.status),
        metric("online-validation", "Online validation", summary.onlineValidationStatus, claim.status),
        metric("online-asset-completeness", "Online asset completeness", summary.onlineAssetCompletenessStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: deterministic metadata and browser tooling verify selected-body preview markers, profile sync and local review screenshots outside the runtime UI.",
      assumptions: [
        "The sidebar preview is a local presentation cue bound to the selected body, not a separate scientific renderer.",
        "Universe Sandbox is used as a composition reference direction only.",
        "Runtime rendering reads prepared local public textures and live selected-body state only.",
      ],
      limitations: [
        "Does not claim Universe Sandbox clone status, AAA production certification, WCAG certification, scientific certification, online validation, online asset completeness, CI status, or latest runtime command status.",
        "Does not add a new panel id, scientific observable, online astronomy database, full numerical relativity, cosmological N-body, or complete deep-sky catalog.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}

function closeupVisualFidelityClaim(): EvidenceClaim {
  const summary = createAtlasCloseupVisualFidelitySummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "closeup-visual-fidelity",
    group: "closeup-visual-fidelity",
    title: "Close-up visual fidelity",
    status: "informational",
    confidence: "visual",
    source: `Atlas Close-Up Visual Fidelity ${ATLAS_CLOSEUP_VISUAL_FIDELITY_VERSION}`,
    model:
      "Local v76 Earth, Saturn, Sun and Jupiter close-up material/exposure pass over audited HD/v49/v55 planet textures while preserving the v69/v71 orbit-atlas-v9 sky lock",
    metric: `${summary.visualTarget}; ${summary.assetPolicy}; full release ${summary.fullReleaseGateStatus}`,
    error:
      "No AAA, science, WCAG, online asset integrity, full release approval, physics, sky or Kerr kernel mutation is claimed.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Close-Up Visual Fidelity ${summary.version}`,
        "Existing local HD, v49 and v55 planet texture manifests",
        "Solar System Scope CC BY 4.0 source routed through existing fetch-planet-textures-8k.mjs only when development asset repair is needed",
        "v69 background art, v71 background regression guard, v72 material contract and v75 physics benchmark gate metadata",
      ],
      method:
        "Centralize and expose deterministic close-up fidelity budgets for Earth clouds/night/terminator, Saturn rings/occlusion, Sun granulation/bloom restraint and Jupiter band microcontrast while forbidding sky asset changes and leaving v75 physics thresholds untouched.",
      metrics: [
        metric("closeup-visual-version", "Close-up visual version", summary.version, claim.status),
        metric("visual-target", "Visual target", summary.visualTarget, claim.status),
        metric("asset-policy", "Asset policy", summary.assetPolicy, claim.status),
        metric("texture-source-policy", "Texture source policy", summary.textureSourcePolicy, claim.status),
        metric("runtime-asset-policy", "Runtime asset policy", summary.runtimeAssetPolicy, claim.status),
        metric("earth-profile", "Earth profile", summary.earthProfileId, claim.status),
        metric("saturn-profile", "Saturn profile", summary.saturnProfileId, claim.status),
        metric("sun-profile", "Sun profile", summary.sunProfileId, claim.status),
        metric("jupiter-profile", "Jupiter profile", summary.jupiterProfileId, claim.status),
        metric("protected-sky", "Protected sky manifest", summary.protectedSkyManifest, claim.status),
        metric("background-version", "Background version", summary.backgroundOrbitArtVersion, claim.status),
        metric("background-guard", "Background guard", summary.backgroundGuardVersion, claim.status),
        metric("material-profile", "Material profile", summary.materialProfileVersion, claim.status),
        metric("physics-gate", "Physics benchmark gate", summary.physicsBenchmarkGateVersion, claim.status),
        metric("full-release-gate", "Full release gate", summary.fullReleaseGateStatus, claim.status),
        metric("audited-texture-families", "Audited texture families", summary.auditedTextureFamilies.join(", "), claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("artistic-certification", "Artistic certification", summary.artisticCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("wcag-certification", "WCAG certification", summary.wcagCertificationStatus, claim.status),
        metric("online-asset-completeness", "Online asset completeness", summary.onlineAssetCompletenessStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: deterministic metadata, local manifest tests and browser screenshots verify the close-up pass and protected sky lock, while strict Horizons remains a separate scientific certification blocker under the v78/v79 gate split.",
      assumptions: [
        "The v69/v71 blue-gray dense Milky Way background direction is intentionally preserved.",
        "Development may repair missing planet textures through the existing Solar System Scope script, but runtime rendering must use local public texture URLs only.",
        "v75 Horizons budget failures remain blocking for scientific certification, not for the product full verification command.",
      ],
      limitations: [
        "Does not certify AAA quality, scientific correctness, WCAG compliance, online asset completeness, CI status or full release readiness.",
        "Does not modify sky manifests, sky images, GalaxyEnvironmentSphere legacy v9 profiles or sky generation scripts.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics, v75 thresholds or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}

function solarEihClaim(diagnostics: SimulationDiagnostics | null): EvidenceClaim {
  const status = mapHorizonsStatus(diagnostics?.horizonsValidationStatus);
  const initialEpochRmsPosition =
    diagnostics?.horizonsInitialEpochRmsPositionKm ?? diagnostics?.horizonsRmsPositionKm;
  const initialEpochRmsVelocity =
    diagnostics?.horizonsInitialEpochRmsVelocityMs ?? diagnostics?.horizonsRmsVelocityMs;
  const onePnMode = diagnostics?.relativityValidation.horizons.modes.find(
    (mode) => mode.mode === "1pn",
  );
  const rmsPosition =
    diagnostics?.horizonsLongTermOnePnRmsPositionKm ?? onePnMode?.rmsPositionKm;
  const rmsVelocity =
    diagnostics?.horizonsLongTermOnePnRmsVelocityMs ?? onePnMode?.rmsVelocityMs;
  const progress = diagnostics?.relativityValidation.horizons.progress;
  const claim: EvidenceClaimWithoutPassport = {
    id: "solar-eih-1pn-horizons",
    group: "solar-eih-1pn",
    title: "Solar EIH 1PN / JPL Horizons",
    status,
    confidence: mapRelativityConfidence(diagnostics?.relativityConfidence),
    source: diagnostics?.relativityValidation.horizons.source ?? "JPL Horizons offline reference",
    model: "Solar N-body live state with EIH 1PN weak-field correction",
    metric:
      rmsPosition != null || rmsVelocity != null
        ? `10-year 1PN Horizons RMS ${formatNumber(rmsPosition, 3, " km")} / ${formatNumber(rmsVelocity, 3, " m/s")}`
        : `Horizons validation ${diagnostics?.horizonsValidationStatus ?? "pending"}${
            progress != null ? ` (${Math.round(progress * 100)}%)` : ""
          }`,
    error:
      rmsPosition != null || rmsVelocity != null
        ? `Position ${formatNumber(rmsPosition, 3, " km")}; velocity ${formatNumber(rmsVelocity, 3, " m/s")}.`
        : diagnostics?.relativityValidation.horizons.error ??
          "Pending until the offline Horizons comparison is available.",
    boundary: "Solar-system weak-field dynamics only. It does not use or replace the Kerr strong-field lab.",
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        diagnostics?.relativityValidation.horizons.source ?? "JPL Horizons offline reference",
        "live solar-system N-body state",
        "EIH 1PN weak-field correction diagnostics",
      ],
      method:
        "Compare the live solar-system state using EIH 1PN weak-field dynamics against offline JPL Horizons checkpoints.",
      formulas: [
        formula(
          "eih-1pn",
          "EIH 1PN weak-field correction",
          "a = a_Newton + a_1PN/c^2",
          "body masses, barycentric positions, velocities, G, c",
          "Solar-system weak-field, slow-motion regime.",
        ),
      ],
      metrics: [
        metric("horizons-status", "Horizons status", diagnostics?.horizonsValidationStatus ?? "pending", status),
        metric("horizons-progress", "Comparison progress", progress != null ? `${Math.round(progress * 100)}%` : "unavailable", status),
        metric("rms-position", "10-year 1PN RMS position", formatNumber(rmsPosition, 3, " km"), status, undefined, "reported across +30d, +365d and +10y offline checkpoints"),
        metric("rms-velocity", "10-year 1PN RMS velocity", formatNumber(rmsVelocity, 3, " m/s"), status, undefined, "reported across +30d, +365d and +10y offline checkpoints"),
        metric("initial-epoch-rms-position", "Initial J2000 epoch RMS position", formatNumber(initialEpochRmsPosition, 3, " km"), "informational"),
        metric("initial-epoch-rms-velocity", "Initial J2000 epoch RMS velocity", formatNumber(initialEpochRmsVelocity, 3, " m/s"), "informational"),
        metric("relative-energy-drift", "Relative energy drift", formatNumber(diagnostics?.relEnergyDrift, 3), status),
      ],
      confidenceRationale:
        status === "ready"
          ? "Validated or Horizons-checked when the offline comparison is complete and the live diagnostics report RMS deltas."
          : "Pending or failed until the offline Horizons comparison finishes without error.",
      assumptions: [
        "Horizons checkpoints are treated as the external ephemeris reference.",
        "The main SolarSystemIntegrator remains the EIH 1PN solar-system dynamics path.",
      ],
      limitations: [
        "Applies to solar-system weak-field motion only.",
        "Does not model strong-field Kerr trajectories, spacecraft navigation products, or full ephemeris uncertainty.",
      ],
      relatedViews: ["telemetry", "orbit-analysis", "body-sidebar", "evidence-ledger"],
    }),
  );
}

function weakFieldClaim(diagnostics: SimulationDiagnostics | null): EvidenceClaim {
  const validation = diagnostics?.relativityValidation;
  const status: EvidenceClaimStatus = validation ? "ready" : "pending";
  const claim: EvidenceClaimWithoutPassport = {
    id: "gr-weak-field-tests",
    group: "gr-weak-field",
    title: "GR weak-field analytic tests",
    status,
    confidence: validation ? "formula-checked" : "visual",
    source: "Analytic GR weak-field targets",
    model: "Mercury 1PN precession, solar-limb light deflection, Shapiro delay, time dilation",
    metric: validation
      ? [
          `Mercury ${formatNumber(validation.mercuryPrecession.onePnArcsecPerCentury, 3, " arcsec/century")}`,
          `light ${formatNumber(validation.lightDeflection.formulaArcsec, 4, " arcsec")}`,
          `Shapiro ${formatNumber(validation.shapiroDelay.microseconds, 3, " us")}`,
        ].join("; ")
      : "Weak-field diagnostics pending",
    error: validation
      ? [
          `Mercury ${formatNumber(validation.mercuryPrecession.errorPercent, 3, "%")}`,
          `light ${formatNumber(validation.lightDeflection.errorPercent, 3, "%")}`,
          `Shapiro ${formatNumber(validation.shapiroDelay.errorPercent, 3, "%")}`,
        ].join("; ")
      : "Pending until live diagnostics have sampled the current physics state.",
    boundary: "Analytic weak-field checks. Not full spacetime evolution or numerical relativity.",
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "Analytic GR weak-field targets",
        "current relativity validation snapshot",
        "Orbit Analysis / Telemetry readouts",
      ],
      method:
        "Evaluate closed-form weak-field GR references against the current diagnostics without changing the solar-system integrator.",
      formulas: [
        formula(
          "mercury-1pn",
          "Mercury perihelion precession",
          "Delta omega = 6*pi*GM/(a*(1-e^2)*c^2)",
          "central mass M, semi-major axis a, eccentricity e, c",
          "Bound weak-field orbit around the Sun.",
        ),
        formula(
          "light-deflection",
          "Solar-limb light deflection",
          "alpha = 4GM/(c^2 b)",
          "solar mass M, impact parameter b, c",
          "Weak-field grazing-light approximation.",
        ),
        formula(
          "shapiro-delay",
          "Shapiro delay",
          "Delta t = 2GM/c^3 * ln((r1+r2+R)/(r1+r2-R))",
          "solar mass M, endpoint radii r1/r2, range R, c",
          "Weak-field radar/light-time path near the Sun.",
        ),
        formula(
          "time-dilation",
          "Weak-field clock rate",
          "d tau/dt ~= 1 + Phi/c^2 - v^2/(2c^2)",
          "Newtonian potential Phi, speed v, c",
          "Weak gravitational potential and slow motion.",
        ),
      ],
      metrics: [
        metric(
          "mercury-precession",
          "Mercury 1PN",
          formatNumber(validation?.mercuryPrecession.onePnArcsecPerCentury, 3, " arcsec/century"),
          status,
          formatNumber(validation?.mercuryPrecession.targetArcsecPerCentury, 3, " arcsec/century"),
          formatNumber(validation?.mercuryPrecession.errorPercent, 3, "%"),
        ),
        metric(
          "light-deflection",
          "Light deflection",
          formatNumber(validation?.lightDeflection.formulaArcsec, 4, " arcsec"),
          status,
          formatNumber(validation?.lightDeflection.targetArcsec, 4, " arcsec"),
          formatNumber(validation?.lightDeflection.errorPercent, 3, "%"),
        ),
        metric(
          "shapiro-delay",
          "Shapiro delay",
          formatNumber(validation?.shapiroDelay.microseconds, 3, " us"),
          validation?.shapiroDelay.status === "unavailable" ? "pending" : status,
          formatNumber(validation?.shapiroDelay.formulaMicroseconds, 3, " us"),
          formatNumber(validation?.shapiroDelay.errorPercent, 3, "%"),
        ),
        metric(
          "time-dilation",
          "Time dilation",
          formatNumber(validation?.timeDilation.gravitationalPlusKinematicUsPerDay, 3, " us/day"),
          validation?.timeDilation.status === "unavailable" ? "pending" : status,
        ),
      ],
      confidenceRationale:
        validation != null
          ? "Formula-checked: each value is generated from analytic weak-field expressions and current diagnostic state."
          : "Pending until the relativity validation summary is available.",
      assumptions: [
        "Weak-field approximations are valid for the displayed solar-system checks.",
        "The reported values are diagnostics, not a replacement for the EIH 1PN integration path.",
      ],
      limitations: [
        "No full spacetime evolution is attempted.",
        "These checks do not cover strong-field Kerr ray tracing or numerical relativity.",
      ],
      relatedViews: ["telemetry", "orbit-analysis", "body-sidebar", "evidence-ledger"],
    }),
  );
}

function gaiaCatalogClaim(gaiaCatalogSource: GaiaCatalogSource): EvidenceClaim {
  const backedByGaia = gaiaCatalogSource === "gaia-dr3";
  const status: EvidenceClaimStatus = backedByGaia ? "ready" : "informational";
  const claim: EvidenceClaimWithoutPassport = {
    id: "gaia-dr3-catalog",
    group: "gaia-catalog",
    title: "Gaia DR3 bright-star catalog",
    status,
    confidence: backedByGaia ? "catalog-backed" : "visual",
    source: backedByGaia ? "Gaia DR3 bright 5000 local-star catalog" : "Placeholder procedural star fallback",
    model: "RA/Dec/parallax to galactic 3D starfield with BP-RP color mapping",
    metric: backedByGaia ? "Bright 5000 Gaia DR3 source rows loaded" : "Placeholder stars active",
    error: backedByGaia
      ? "Catalog filtering uses finite parallax and RUWE quality gates."
      : "No catalog error claim in placeholder mode.",
    boundary: "Bright local starfield and source HUD. Not the full Gaia archive or a stellar population solver.",
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        backedByGaia ? "Gaia DR3 source table" : "procedural fallback star table",
        "bright 5000 starfield loader",
        "Gaia source HUD / body sidebar",
      ],
      method:
        "Map catalog RA/Dec/parallax into a local 3D starfield and use BP-RP color as the visible stellar color cue.",
      formulas: [
        formula(
          "parallax-distance",
          "Parallax distance estimate",
          "distance_pc = 1000 / parallax_mas",
          "positive finite parallax in milliarcseconds",
          "Local bright-star visualization after quality filtering.",
        ),
      ],
      metrics: [
        metric("catalog-source", "Catalog source", gaiaCatalogSource, status),
        metric("row-count", "Loaded rows", backedByGaia ? "bright 5000" : "placeholder fallback", status),
        metric("quality-gates", "Quality gates", backedByGaia ? "finite parallax + RUWE gates" : "not claimed", status),
      ],
      confidenceRationale: backedByGaia
        ? "Catalog-backed: visible star sources come from the packaged Gaia DR3 bright-star subset."
        : "Visual only: fallback stars carry no Gaia catalog-backed evidence claim.",
      assumptions: [
        "The packaged subset is intentionally bright and local for browser rendering.",
        "BP-RP color mapping is a presentation approximation.",
      ],
      limitations: [
        "Not the full Gaia archive.",
        "Not a stellar-evolution or survey-selection-function solver.",
      ],
      relatedViews: ["body-sidebar", "evidence-ledger"],
    }),
  );
}

function celestialCatalogClaim(): EvidenceClaim {
  const summary = createCelestialCatalogSummary();
  const status: EvidenceClaimStatus =
    summary.qualityChecks.uniqueIds &&
    summary.qualityChecks.finiteCoordinates &&
    summary.qualityChecks.constellationCount === 88
      ? "ready"
      : "failed";
  const deepSkyCount =
    summary.kindBreakdown.nebula +
    summary.kindBreakdown["star-cluster"] +
    summary.kindBreakdown.galaxy +
    summary.kindBreakdown.pulsar;
  const sourceBreakdown = Object.entries(summary.sourceBreakdown)
    .map(([source, count]) => `${source} ${count}`)
    .join("; ");
  const kindBreakdown = Object.entries(summary.kindBreakdown)
    .map(([kind, count]) => `${kind} ${count}`)
    .join("; ");
  const qualityText = [
    `unique ids ${summary.qualityChecks.uniqueIds ? "pass" : "fail"}`,
    `finite coordinates ${summary.qualityChecks.finiteCoordinates ? "pass" : "fail"}`,
    `constellations ${summary.qualityChecks.constellationCount}/88`,
  ].join("; ");

  const claim: EvidenceClaimWithoutPassport = {
    id: "celestial-catalog-atlas",
    group: "celestial-catalog-atlas",
    title: "Celestial Catalog Atlas",
    status,
    confidence: "catalog-backed",
    source: "Curated Local v22, IAU constellation lines, Messier/NGC curated entries",
    model: "Presentation/navigation catalog in RA/Dec and Galactic coordinates",
    metric: `${summary.entryCount} entries; ${summary.qualityChecks.constellationCount} constellations; ${deepSkyCount} deep-sky objects`,
    error: `Quality checks: ${qualityText}. Entry values are static curated approximations.`,
    boundary: summary.trustedBoundary,
  };

  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "curated-local-v22 notable stars, galaxies, pulsars, nebulae and clusters",
        "IAU 88 constellation line metadata",
        "Messier/NGC curated deep-sky presentation entries",
        "Celestial Catalog Atlas browser and layer toggles",
        `${CELESTIAL_OBJECT_PASSPORT_VERSION} object drilldown`,
        `${CELESTIAL_DEEP_SKY_NAVIGATION_VERSION} selected-object focus and label-density layer`,
      ],
      method:
        "Aggregate curated local catalog rows into searchable navigation entries, deterministic object passports, and a v33 visual navigation layer with selected-object focus markers and bounded label density.",
      formulas: [
        formula(
          "equatorial-direction",
          "RA/Dec display direction",
          "unit = (cos(dec)*cos(ra), sin(dec), cos(dec)*sin(ra))",
          "right ascension ra and declination dec in J2000-style equatorial coordinates",
          "Camera focus and marker placement for catalog navigation.",
        ),
        formula(
          "galactic-conversion",
          "Galactic to equatorial conversion",
          "catalog l,b -> RA,Dec via fixed Galactic pole / node transform",
          "Galactic longitude l and latitude b",
          "Deep-sky presentation entries that are authored in Galactic coordinates.",
        ),
      ],
      metrics: [
        metric("entry-count", "Catalog entries", formatNumber(summary.entryCount, 0), status),
        metric("constellation-count", "IAU constellations", `${summary.qualityChecks.constellationCount}/88`, status),
        metric("deep-sky-count", "Deep-sky entries", formatNumber(deepSkyCount, 0), status),
        metric("kind-breakdown", "Kind breakdown", kindBreakdown, status),
        metric("source-breakdown", "Source breakdown", sourceBreakdown, status),
        metric("coordinate-frames", "Coordinate frames", summary.coordinateFrames.join(", "), status),
        metric("quality-checks", "Quality checks", qualityText, status),
        metric("object-passport-version", "Object passport drilldown", CELESTIAL_OBJECT_PASSPORT_VERSION, status),
        metric("deep-sky-navigation-version", "Deep-sky navigation layer", CELESTIAL_DEEP_SKY_NAVIGATION_VERSION, status),
        metric("catalog-expansion-v33", "v33 curated additions", "13 local deep-sky entries", status),
      ],
      confidenceRationale:
        "Catalog-backed for the local curated source chain and formula-checked for finite coordinate conversion; object passports inherit this claim but remain intentionally limited to a small presentation/navigation catalog.",
      assumptions: [
        "Curated local values are approximate static references for orientation and search.",
        "Constellation lines are used as navigation overlays, not as physical structures.",
        "Deep-sky objects are markers and labels only; they are not inserted into the SolarSystemIntegrator.",
        "Selected deep-sky focus rings and labels are presentation overlays only.",
      ],
      limitations: [
        "Not a complete SIMBAD or VizieR database.",
        "Not the full Gaia archive.",
        "Not a stellar, nebular, galactic, or cosmological evolution model.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}

function galacticDynamicsClaim(diagnostics: SimulationDiagnostics | null): EvidenceClaim {
  const validation = diagnostics?.galacticValidation;
  const status = mapReadyFailedStatus(validation?.status);
  const circularTarget = validation
    ? `${validation.localCircularVelocityTargetKmS[0]}-${validation.localCircularVelocityTargetKmS[1]} km/s`
    : "unavailable";
  const escapeTarget = validation
    ? `${validation.localEscapeVelocityTargetKmS[0]}-${validation.localEscapeVelocityTargetKmS[1]} km/s`
    : "unavailable";
  const claim: EvidenceClaimWithoutPassport = {
    id: "galactic-dynamics-validation",
    group: "galactic-dynamics",
    title: "Gaia DR3 galactic dynamics check",
    status,
    confidence: validation?.source === "gaia-dr3-kinematics" ? "catalog-backed" : "formula-checked",
    source: validation?.source === "gaia-dr3-kinematics" ? "Gaia DR3 kinematics 2000" : "Gaia kinematics validation pending",
    model: "Analytic Galactic potential with local velocity and rotation-curve diagnostics",
    metric: validation
      ? [
          `${validation.sampleCount} samples`,
          `v_c(R0) ${formatNumber(validation.circularVelocityAtR0KmS, 3, " km/s")}`,
          `v_esc(R0) ${formatNumber(validation.escapeSpeedAtR0KmS, 3, " km/s")}`,
        ].join("; ")
      : "Galactic diagnostics pending",
    error: validation
      ? validation.error ??
        `Targets v_c ${validation.localCircularVelocityTargetKmS[0]}-${validation.localCircularVelocityTargetKmS[1]} km/s; v_esc ${validation.localEscapeVelocityTargetKmS[0]}-${validation.localEscapeVelocityTargetKmS[1]} km/s.`
      : "Pending until the validation layer loads.",
    boundary: "Analytic potential validation and teaching diagnostics. Not a full galactic N-body simulation.",
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        validation?.source === "gaia-dr3-kinematics" ? "Gaia DR3 kinematics 2000" : "Gaia kinematics pending",
        "analytic Galactic potential validation",
        "Telemetry galactic diagnostics",
      ],
      method:
        "Use Gaia DR3 kinematic samples with an analytic Galactic potential to check local circular velocity, escape speed, and weak-field teaching values.",
      formulas: [
        formula(
          "circular-velocity",
          "Circular velocity",
          "v_c(R) = sqrt(R * dPhi/dR)",
          "Galactocentric radius R and analytic potential Phi",
          "Axisymmetric analytic-potential diagnostic near target radii.",
        ),
        formula(
          "escape-speed",
          "Escape speed",
          "v_esc(R) = sqrt(-2 * Phi(R))",
          "Analytic potential Phi with zero at infinity",
          "Teaching diagnostic, not a Milky Way mass-model fit.",
        ),
      ],
      metrics: [
        metric("sample-count", "Kinematic samples", formatNumber(validation?.sampleCount, 0), status),
        metric("vc-r0", "v_c(R0)", formatNumber(validation?.circularVelocityAtR0KmS, 3, " km/s"), status, circularTarget),
        metric("vesc-r0", "v_esc(R0)", formatNumber(validation?.escapeSpeedAtR0KmS, 3, " km/s"), status, escapeTarget),
        metric("median-speed", "Median speed", formatNumber(validation?.medianSpeedKmS, 3, " km/s"), status),
        metric("weak-field-clock", "Weak-field clock offset", formatNumber(validation?.weakFieldClockOffsetUsPerDay, 3, " us/day"), status),
      ],
      confidenceRationale:
        validation?.source === "gaia-dr3-kinematics"
          ? "Catalog-backed for sample input and formula-checked for the analytic-potential diagnostics."
          : "Formula-checked or pending until Gaia kinematics are available.",
      assumptions: [
        "The local sample is used as a validation and teaching set, not a full survey analysis.",
        "The analytic potential is fixed and deterministic.",
      ],
      limitations: [
        "Not a full galactic N-body simulation.",
        "Not a self-consistent Milky Way inference or cosmological structure-formation model.",
      ],
      relatedViews: ["telemetry", "evidence-ledger"],
    }),
  );
}

function frwCosmologyClaim(diagnostics: SimulationDiagnostics | null): EvidenceClaim {
  const validation = diagnostics?.cosmologyValidation;
  const status = mapReadyFailedStatus(validation?.status);
  const claim: EvidenceClaimWithoutPassport = {
    id: "frw-planck2018-lcdm",
    group: "frw-cosmology",
    title: "FRW Planck 2018 flat LCDM layer",
    status,
    confidence: "formula-checked",
    source: validation?.source === "planck-2018" ? "Planck 2018 TT,TE,EE+lowE+lensing base-LambdaCDM" : "Planck 2018 preset",
    model: "Analytic flat LCDM FRW distances and ages",
    metric: validation
      ? `H0 ${formatNumber(validation.params.h0KmSmpc, 3, " km/s/Mpc")}; age ${formatNumber(validation.ageNowGyr, 3, " Gyr")}; anchors ${validation.anchors.length}`
      : "FRW diagnostics pending",
    error: validation?.error ?? "Formula checks include monotonic distances and Etherington reciprocity anchors.",
    boundary: "Background cosmology validation layer. Not CMB Boltzmann physics or cosmological N-body structure formation.",
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        validation?.source === "planck-2018" ? "Planck 2018 base-LambdaCDM preset" : "Planck 2018 preset pending",
        "analytic flat LCDM FRW integrals",
        "cosmology validation telemetry",
      ],
      method:
        "Compute background FRW distances, ages, H(z), and reciprocity checks from a fixed Planck 2018 flat LCDM preset.",
      formulas: [
        formula(
          "hubble-redshift",
          "Flat LCDM H(z)",
          "H(z) = H0 * sqrt(Omega_m*(1+z)^3 + Omega_Lambda)",
          "H0, Omega_m, Omega_Lambda, redshift z",
          "Flat background cosmology validation.",
        ),
        formula(
          "luminosity-distance",
          "Luminosity distance",
          "D_L = (1+z) * D_C",
          "redshift z and comoving distance D_C",
          "Background FRW distance ladder check.",
        ),
        formula(
          "etherington",
          "Etherington reciprocity",
          "D_L = (1+z)^2 * D_A",
          "luminosity distance D_L, angular-diameter distance D_A",
          "Metric theory distance consistency check.",
        ),
      ],
      metrics: [
        metric("h0", "H0", formatNumber(validation?.params.h0KmSmpc, 3, " km/s/Mpc"), status),
        metric("age-now", "Age now", formatNumber(validation?.ageNowGyr, 3, " Gyr"), status),
        metric("anchor-count", "Distance anchors", formatNumber(validation?.anchors.length, 0), status),
        metric("omega-m", "Omega matter", formatNumber(validation?.params.omegaMatter, 4), status),
        metric("omega-lambda", "Omega Lambda", formatNumber(validation?.params.omegaLambda, 4), status),
      ],
      confidenceRationale:
        validation?.status === "ready"
          ? "Formula-checked against deterministic distance, age, monotonicity, and reciprocity diagnostics."
          : "Pending or failed until the FRW validation summary is available.",
      assumptions: [
        "Planck 2018 flat LambdaCDM parameters are used as a fixed preset.",
        "Only homogeneous background expansion is represented.",
      ],
      limitations: [
        "Not a CMB Boltzmann solver.",
        "Not a cosmological N-body or structure-formation simulation.",
      ],
      relatedViews: ["telemetry", "evidence-ledger"],
    }),
  );
}

function kerrStrongFieldClaim(diagnostics: SimulationDiagnostics | null): EvidenceClaim {
  const validation = diagnostics?.strongFieldValidation;
  const status = mapReadyFailedStatus(validation?.status);
  const studio = validation
    ? createKerrRelativityStudioSummary({
        spinA: validation.kerr.spinA,
        impactParameterM: validation.probe.impactParameterM,
        presetId: validation.orbitPresetId,
        validationSummary: validation,
      })
    : null;
  const radialRange =
    validation != null
      ? `${validation.probe.radialRangeMinM.toFixed(2)}-${validation.probe.radialRangeMaxM.toFixed(2)}M`
      : "unavailable";
  const claim: EvidenceClaimWithoutPassport = {
    id: "kerr-geodesic-lab",
    group: "kerr-strong-field",
    title: "Kerr Relativity Studio strong-field lab",
    status,
    confidence: validation ? "formula-checked" : "visual",
    source: "Schwarzschild/Kerr analytic geodesic kernel",
    model: validation
      ? `${validation.relativityKernel} / ${validation.labVersion} / ${KERR_RELATIVITY_STUDIO_VERSION}`
      : `eih-1pn+kerr-geodesic-v17 / v19-interactive-kerr-lab / ${KERR_RELATIVITY_STUDIO_VERSION}`,
    metric: validation
      ? `preset ${validation.orbitPresetId}; b=${validation.probe.impactParameterM.toFixed(2)}M; probe ${validation.probe.probeStatus}; ISCO split ${studio?.iscoSplitM.toFixed(3) ?? "n/a"}M; spin a/M=${validation.kerr.spinA.toFixed(2)}`
      : "Kerr lab diagnostics pending",
    error: validation
      ? validation.error ??
        `max H drift ${formatNumber(studio?.maxHamiltonianDrift ?? validation.integration.probeHamiltonianDrift, 3)}; radial range ${validation.probe.radialRangeMinM.toFixed(2)}-${validation.probe.radialRangeMaxM.toFixed(2)}M`
      : "Pending until the geodesic validation summary is available.",
    boundary: "Independent test-particle/null geodesic lab. Not an Einstein field equation solver or full numerical relativity.",
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "Schwarzschild/Kerr analytic geodesic kernel",
        validation?.relativityKernel ?? "eih-1pn+kerr-geodesic-v17",
        validation?.labVersion ?? "v19-interactive-kerr-lab",
        KERR_RELATIVITY_STUDIO_VERSION,
        "Evidence Ledger passport view",
      ],
      method:
        "Integrate independent test-particle/null geodesic probes for the Kerr Studio and compare the interactive null probe with a weak-field 4M/b reference, ISCO split, radial range and Hamiltonian drift readout.",
      formulas: [
        formula(
          "weak-field-kerr-reference",
          "Weak-field deflection reference",
          "alpha = 4M/b",
          "geometric mass M and impact parameter b",
          "Only a weak-field reference for the interactive null probe.",
        ),
        formula(
          "outer-horizon",
          "Kerr outer horizon",
          "r_+ = M + sqrt(M^2 - a^2)",
          "geometric mass M and spin parameter a",
          "Kerr metric diagnostic for |a/M| < 1.",
        ),
      ],
      metrics: [
        metric("preset", "v19 preset", validation?.orbitPresetId ?? "pending", status),
        metric("studio-version", "v35 studio version", studio?.version ?? KERR_RELATIVITY_STUDIO_VERSION, status),
        metric("impact-parameter", "Impact parameter b/M", formatNumber(validation?.probe.impactParameterM, 2, "M"), status),
        metric("probe-status", "Probe status", validation?.probe.probeStatus ?? "pending", status),
        metric("spin", "Spin a/M", formatNumber(validation?.kerr.spinA, 2), status),
        metric("weak-field-4m-b", "4M/b reference", formatNumber(validation?.probe.weakFieldDeflectionRad, 4, " rad"), status),
        metric("isco-split", "ISCO split", formatNumber(studio?.iscoSplitM, 3, "M"), status),
        metric("studio-hamiltonian-drift", "Studio max Hamiltonian drift", formatNumber(studio?.maxHamiltonianDrift, 3), status),
        metric("probe-hamiltonian-drift", "Probe Hamiltonian drift", formatNumber(validation?.integration.probeHamiltonianDrift, 3), status),
        metric("radial-range", "Radial range", radialRange, status),
        metric("studio-boundary", "Studio boundary", studio?.boundary ?? "test-particle-null-geodesic-lab", "informational"),
      ],
      confidenceRationale:
        validation?.status === "ready"
          ? "Formula-checked: status and error metrics come from the v19 Kerr geodesic validation summary plus the v35 Kerr Relativity Studio readout for the current preset and impact parameter."
          : "Pending or failed until the Kerr lab produces a validation summary.",
      assumptions: [
        "The Kerr lab is independent of the solar-system EIH 1PN integrator.",
        "The probe is a test-particle/null geodesic visualization, not a live ray tracer.",
      ],
      limitations: [
        "Not an Einstein field equation solver.",
        "Not full numerical relativity and not a complete real-time Kerr ray tracer.",
      ],
      relatedViews: ["kerr-lab", "telemetry", "evidence-ledger"],
    }),
  );
}

function withPassport(
  claim: EvidenceClaimWithoutPassport,
  passport: EvidenceClaimPassport,
): EvidenceClaim {
  return { ...claim, passport };
}

function createPassport(args: {
  claim: EvidenceClaimWithoutPassport;
  sourceChain: readonly string[];
  method: string;
  formulas?: readonly EvidencePassportFormula[];
  metrics: readonly EvidencePassportMetric[];
  confidenceRationale: string;
  assumptions: readonly string[];
  limitations: readonly string[];
  relatedViews: readonly EvidenceRelatedView[];
}): EvidenceClaimPassport {
  const formulas = args.formulas ?? [];
  const metricSummary = args.metrics
    .map((item) => {
      const target = item.target ? ` target ${item.target}` : "";
      const tolerance = item.tolerance ? ` tolerance/error ${item.tolerance}` : "";
      return `${item.label}: ${item.value}${target}${tolerance}`;
    })
    .join("; ");
  const formulaSummary =
    formulas.length > 0
      ? ` Formula references: ${formulas.map((item) => `${item.label} (${item.expression})`).join("; ")}`
      : "";

  return {
    claimId: args.claim.id,
    sourceChain: args.sourceChain,
    method: args.method,
    formulas,
    metrics: args.metrics,
    confidenceRationale: args.confidenceRationale,
    assumptions: args.assumptions,
    limitations: args.limitations,
    relatedViews: args.relatedViews,
    sections: [
      {
        id: "source-chain",
        title: "Source chain",
        body: `${args.sourceChain.join(" -> ")}. Source: ${args.claim.source}. Model: ${args.claim.model}.`,
      },
      {
        id: "method",
        title: "Formula / method",
        body: `${args.method}${formulaSummary}`,
      },
      {
        id: "metrics",
        title: "Metric / error",
        body: metricSummary || `${args.claim.metric}; ${args.claim.error}`,
      },
      {
        id: "confidence",
        title: "Confidence rationale",
        body: args.confidenceRationale,
      },
      {
        id: "assumptions",
        title: "Assumptions",
        body: args.assumptions.join("; "),
      },
      {
        id: "limitations",
        title: "Trusted boundary",
        body: `${args.claim.boundary} ${args.limitations.join(" ")}`,
      },
      {
        id: "related-views",
        title: "Related UI panels",
        body: args.relatedViews.join(", "),
      },
    ],
  };
}

function metric(
  id: string,
  label: string,
  value: string,
  status: EvidenceClaimStatus,
  target?: string,
  tolerance?: string,
): EvidencePassportMetric {
  return {
    id,
    label,
    value,
    target,
    tolerance,
    status,
  };
}

function formula(
  id: string,
  label: string,
  expression: string,
  variables: string,
  applicability: string,
): EvidencePassportFormula {
  return {
    id,
    label,
    expression,
    variables,
    applicability,
  };
}

function ledgerStatus(claims: readonly EvidenceClaim[]): EvidenceClaimStatus {
  if (claims.some((claim) => claim.status === "failed")) return "failed";
  if (claims.some((claim) => claim.status === "pending")) return "pending";
  return "ready";
}

function mapHorizonsStatus(status: SimulationDiagnostics["horizonsValidationStatus"] | undefined): EvidenceClaimStatus {
  if (status === "complete") return "ready";
  if (status === "failed") return "failed";
  return "pending";
}

function mapReadyFailedStatus(status: "pending" | "ready" | "failed" | undefined): EvidenceClaimStatus {
  if (status === "ready") return "ready";
  if (status === "failed") return "failed";
  return "pending";
}

function mapRelativityConfidence(
  confidence: RelativityConfidence | ResearchConfidence | undefined,
): EvidenceClaimConfidence {
  if (confidence === "validated") return "validated";
  if (confidence === "horizons-checked") return "horizons-checked";
  if (confidence === "formula-checked" || confidence === "diagnostic") return "formula-checked";
  return "visual";
}

function formatNumber(value: number | null | undefined, digits = 3, suffix = ""): string {
  if (value == null || !Number.isFinite(value)) return `unavailable${suffix}`;
  const abs = Math.abs(value);
  const text =
    abs !== 0 && (abs >= 10_000 || abs < 0.001)
      ? value.toExponential(2)
      : value.toLocaleString("en-US", { maximumFractionDigits: digits });
  return `${text}${suffix}`;
}

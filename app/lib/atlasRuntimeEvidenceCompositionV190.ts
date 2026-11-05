import { createAtlasRuntimeEvidenceViewModelV177 } from "./atlasRuntimeEvidenceViewModelV177";
import { ORBIT_ATLAS_VISUAL_PROFILE, ORBIT_ATLAS_BALANCED_VISIBLE_ORBIT_COUNT, ORBIT_ATLAS_DENSE_VISIBLE_ORBIT_COUNT, ORBIT_ATLAS_ORBIT_RENDERER } from "./orbitAtlasPresentation";
import {
  ATLAS_ART_POLISH_VERSION,
  ATLAS_BACKGROUND_GUARD_VERSION,
  ATLAS_BROWSER_ACCEPTANCE_RUNTIME_COST_VERSION,
  ATLAS_BROWSER_ACCEPTANCE_VERSION,
  ATLAS_BROWSER_CI_STABILITY_LOCK_VERSION,
  ATLAS_BROWSER_RESOURCE_PERFORMANCE_VERSION,
  ATLAS_CAMERA_STELLAR_CLOSEUP_VERSION,
  ATLAS_CHINESE_DEEP_SPACE_FIDELITY_VERSION,
  ATLAS_CINEMATIC_CLOSEUP_DIRECTOR_VERSION,
  ATLAS_CINEMATIC_DEEP_SPACE_BACKDROP_VERSION,
  ATLAS_CINEMATIC_DEEP_SPACE_CAMERA_VERSION,
  ATLAS_CINEMATIC_KEY_LIGHT_DIRECTOR_VERSION,
  ATLAS_CINEMATIC_LIGHTING_COMPOSITION_VERSION,
  ATLAS_CINEMATIC_PLANETARY_ART_DIRECTION_VERSION,
  ATLAS_CINEMATIC_WORKBENCH_VERSION,
  ATLAS_CLOSEUP_PRESENTATION_TRUTH_VERSION,
  ATLAS_CLOSEUP_VISUAL_FIDELITY_VERSION,
  ATLAS_CRITICAL_UI_RELATIVITY_VISIBILITY_VERSION,
  ATLAS_DEFAULT_STRICT_HORIZONS_MIGRATION_VERSION,
  ATLAS_FINAL_GAIA_ART_ENHANCEMENT_VERSION,
  ATLAS_FINAL_MAINTENANCE_BASELINE_VERSION,
  ATLAS_GAIA_STARFIELD_ENHANCEMENT_VERSION,
  ATLAS_HORIZONS_CANDIDATE_LAB_VERSION,
  ATLAS_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_VERSION,
  ATLAS_HORIZONS_GATE_AUDIT_VERSION,
  ATLAS_HORIZONS_PROVENANCE_FREEZE_VERSION,
  ATLAS_HORIZONS_RESIDUAL_DECOMPOSITION_VERSION,
  ATLAS_INSTRUMENT_UI_VERSION,
  ATLAS_INTERACTION_CATALOG_COMPLETION_VERSION,
  ATLAS_INTERACTION_REPAIR_LAUNCH_UX_VERSION,
  ATLAS_INTERACTION_VISUAL_QUALITY_VERSION,
  ATLAS_LAUNCH_GAMEPLAY_OPENROCKET_BRIDGE_VERSION,
  ATLAS_LAUNCH_SCENE_OPENROCKET_REPLAY_VERSION,
  ATLAS_MAINTENANCE_EVIDENCE_INDEX_VERSION,
  ATLAS_MATERIAL_PROFILE_VERSION,
  ATLAS_MISSION_CAPSULE_VERSION,
  ATLAS_MISSION_HUB_VERSION,
  ATLAS_NAVIGATOR_VERSION,
  ATLAS_NUMERICAL_INTEGRITY_VERSION,
  ATLAS_OBSERVATORY_DECK_VERSION,
  ATLAS_OFFLINE_RUNTIME_BOUNDARY_AUDIT_VERSION,
  ATLAS_OFFLINE_STELLAR_SEARCH_CATALOG_V2_VERSION,
  ATLAS_OUTER_SYSTEM_FORCE_MODEL_PREFLIGHT_VERSION,
  ATLAS_OUTER_SYSTEM_REFERENCE_ADOPTION_VERSION,
  ATLAS_PERFORMANCE_BUDGET_VERSION,
  ATLAS_PHYSICS_BENCHMARK_GATE_VERSION,
  ATLAS_PHYSICS_GATE_SPLIT_VERSION,
  ATLAS_PLANETARY_COLOR_GRADING_VERSION,
  ATLAS_PLANETARY_DEPTH_LIGHTING_VERSION,
  ATLAS_PLANETARY_MATERIAL_COMPOSITION_VERSION,
  ATLAS_PLANETARY_VISUAL_FIDELITY_VERSION,
  ATLAS_PLUTO_RESIDUAL_ISOLATION_VERSION,
  ATLAS_POST_ENHANCEMENT_BASELINE_VERSION,
  ATLAS_PRESENTATION_RUNTIME_PERFORMANCE_VERSION,
  ATLAS_RC_EVIDENCE_CLOSURE_VERSION,
  ATLAS_REFERENCE_GRADE_SPACE_ART_VERSION,
  ATLAS_RELATIVITY_CHART_VERSION,
  ATLAS_RELATIVITY_SIMULATION_OPTIMIZATION_VERSION,
  ATLAS_RELATIVITY_VERIFICATION_VERSION,
  ATLAS_RELEASE_ARTIFACT_MANIFEST_LOCK_VERSION,
  ATLAS_RELEASE_READINESS_VERSION,
  ATLAS_REPORT_STUDIO_VERSION,
  ATLAS_RUNTIME_SCENE_FOCUS_PERFORMANCE_VERSION,
  ATLAS_SCIENTIFIC_CINEMATIC_ART_VERSION,
  ATLAS_SCIENTIFIC_GATE_MAINTENANCE_RUNBOOK_VERSION,
  ATLAS_SCIENTIFIC_GATE_PREFLIGHT_VERSION,
  ATLAS_SCIENTIFIC_GATE_RELEASE_EVIDENCE_VERSION,
  ATLAS_SCIENTIFIC_MODEL_UPGRADE_CONTRACT_VERSION,
  ATLAS_SCIENTIFIC_REPORT_VERSION,
  ATLAS_SPARSE_DEEP_SPACE_DIRECTOR_VERSION,
  ATLAS_STRICT_HORIZONS_MIGRATION_DRY_RUN_VERSION,
  ATLAS_STRICT_HORIZONS_SHADOW_MIGRATION_VERSION,
  ATLAS_UNIVERSE_SANDBOX_REFERENCE_BACKDROP_VERSION,
  ATLAS_VALIDATION_CONSOLE_VERSION,
  ATLAS_VISUAL_INTEGRATION_RELEASE_VERSION,
  ATLAS_VISUAL_LAUNCH_PERFORMANCE_VERSION,
  ATLAS_VISUAL_STABILITY_VERSION,
  ATLAS_WORKBENCH_ACCESSIBILITY_VERSION,
  ATLAS_WORKFLOW_VERSION,
  CELESTIAL_CATALOG_VERSION,
  CELESTIAL_DEEP_SKY_NAVIGATION_VERSION,
  CELESTIAL_OBJECT_PASSPORT_VERSION,
  KERR_GEODESIC_VISUALIZATION_ID,
  KERR_RELATIVITY_LAB_VERSION,
  KERR_RELATIVITY_STUDIO_VERSION,
  RELATIVITY_GUIDED_TOUR_VERSION,
  RELATIVITY_OBSERVABLE_ATLAS_VERSION,
  RELATIVITY_OBSERVABLE_EXPLAINER_VERSION,
} from "./atlasRuntimeEvidenceCompatibilityManifestV198";
import type { OrbitAtlasRenderBudget, OrbitAtlasScaleMode, SolarPresentationMode } from "./orbitAtlasPresentation";
import type { AtlasReportExportFormat, AtlasValidationDomainId, AtlasObservatoryZoneId } from "./simulationDiagnosticsTypes";
import type { AtlasSceneMode } from "./atlasRuntimeSceneFocusPerformance";
import type { SimulationViewSettings } from "./simulationViewSettings";
import type { KerrBlackHoleUiState } from "../components/KerrBlackHolePanel";

export type AtlasRuntimeEvidenceCompositionScopeV190 = {
  presentation: { presentationMode: SolarPresentationMode; scaleMode: OrbitAtlasScaleMode; renderBudget: OrbitAtlasRenderBudget; setPresentationMode: (next: SolarPresentationMode) => void; setScaleMode: (next: OrbitAtlasScaleMode) => void; setRenderBudget: (next: OrbitAtlasRenderBudget) => void; };
  orbitAtlas: boolean;
  atlasReady: boolean;
  selectedBodyVisualTier: string;
  atlasPlanetaryVisualFidelitySummary: import("./simulationDiagnosticsTypes").AtlasPlanetaryVisualFidelitySummary;
  selectedBodyVisualId: string;
  selectedBodyCloseupActive: boolean;
  selectedBodyAtmosphereProfile: string;
  atlasSkyCloseupProfile: string;
  atlasCinematicLightingSummary: import("./simulationDiagnosticsTypes").AtlasCinematicLightingCompositionSummary;
  selectedBodyLightingProfile: import("./simulationDiagnosticsTypes").AtlasSelectedBodyLightingProfile;
  atlasChineseDeepSpaceFidelitySummary: import("./simulationDiagnosticsTypes").AtlasChineseDeepSpaceFidelitySummary;
  atlasCinematicCameraProfile: "selected-body-cinematic" | "showcase-deep-space" | "overview-atlas";
  atlasCinematicSkyCompositionProfile: import("./simulationDiagnosticsTypes").AtlasCinematicSkyCompositionProfile;
  atlasCinematicBackgroundNoiseProfile: import("./simulationDiagnosticsTypes").AtlasCinematicBackgroundNoiseProfile;
  atlasCinematicTargetSeparationProfile: import("./simulationDiagnosticsTypes").AtlasCinematicTargetSeparationProfile;
  atlasCinematicDeepSpaceCameraSummary: import("./simulationDiagnosticsTypes").AtlasCinematicDeepSpaceCameraSummary;
  atlasUniverseSandboxReferenceBackdropSummary: import("./simulationDiagnosticsTypes").AtlasUniverseSandboxReferenceBackdropSummary;
  atlasBackgroundDepthProfile: "closeup-subject-negative-space" | "showcase-reference-depth" | "overview-sparse-layered-milky-way";
  atlasBackgroundSubjectVisibilityProfile: import("./simulationDiagnosticsTypes").AtlasBackgroundSubjectVisibilityProfile;
  atlasReferenceGradeSpaceArtSummary: import("./simulationDiagnosticsTypes").AtlasReferenceGradeSpaceArtSummary;
  atlasReferenceGradeCompositeProfile: "selected-body-subject-matte" | "showcase-cinematic-deep-space" | "overview-layered-reference-grade";
  atlasReferenceGradeSkyLayerProfile: "v48-local-closeup-negative-space" | "v48-local-showcase-milky-way" | "v48-local-generated-layered-sky";
  atlasReferenceGradeStarfieldProfile: "closeup-star-noise-suppressed" | "showcase-structured-starfield" | "sparse-primary-stars";
  atlasReferenceGradeSubjectMatteProfile: "selected-body-background-matte" | "showcase-center-negative-space" | "overview-no-subject-matte";
  atlasReferenceGradePlanetMaterialProfile: "solar-edge-controlled" | "gas-giant-ring-readability" | "closeup-microcontrast-fill" | "overview-local-hd";
  atlasPlanetaryMaterialCompositionSummary: import("./simulationDiagnosticsTypes").AtlasPlanetaryMaterialCompositionSummary;
  atlasSelectedBodyMaterialProfile: "solar-granulation-depth" | "earth-cloud-night-depth" | "saturn-ring-material-depth" | "gas-giant-band-depth" | "lunar-mars-relief-depth" | "terrestrial-terminator-depth" | "overview-local-material";
  atlasSelectedBodyAtmosphereDepthProfile: "solar-edge-controlled-depth" | "thin-earth-limb-depth" | "gas-giant-soft-limb-depth" | "airless-relief-limb" | "overview-atmosphere";
  atlasSelectedBodyTerminatorProfile: "solar-limb-darkening" | "earth-night-cloud-terminator" | "gas-band-low-fill-terminator" | "airless-relief-terminator" | "overview-terminator";
  atlasSelectedBodyRingProfile: "saturn-cassini-layered-ring" | "no-ring-profile";
  atlasCinematicCloseupDirectorSummary: import("./simulationDiagnosticsTypes").AtlasCinematicCloseupDirectorSummary;
  atlasCloseupCompositionProfile: "solar-surface-portrait" | "earth-limb-portrait" | "saturn-ring-showcase" | "gas-giant-band-portrait" | "lunar-mars-relief-portrait" | "overview-no-closeup-director";
  atlasCloseupPanelAvoidanceProfile: "centered-mobile-safe-subject" | "right-workbench-safe-subject-left" | "overview-no-panel-avoidance";
  atlasCloseupRingShowcaseProfile: "saturn-wide-tilted-ring-showcase" | "no-ring-showcase";
  atlasCinematicKeyLightDirectorSummary: import("./simulationDiagnosticsTypes").AtlasCinematicKeyLightDirectorSummary;
  atlasSelectedBodyKeyLightProfile: "solar-surface-edge-key" | "earth-cloud-night-key-balance" | "saturn-ring-key-fill" | "gas-giant-readable-key-fill" | "lunar-mars-relief-key" | "overview-natural-phase";
  atlasPlanetaryDepthLightingSummary: import("./simulationDiagnosticsTypes").AtlasPlanetaryDepthLightingSummary;
  atlasSelectedBodyDepthLightingProfile: "solar-granulation-limb-depth" | "earth-atmospheric-terminator-depth" | "saturn-ring-shadow-depth" | "gas-giant-banded-phase-depth" | "airless-relief-terminator-depth" | "overview-no-depth-lighting";
  atlasPlanetaryColorGradingSummary: import("./simulationDiagnosticsTypes").AtlasPlanetaryColorGradingSummary;
  atlasSelectedBodyColorGradeProfile: "solar-photosphere-color-depth" | "earth-ocean-cloud-color-depth" | "saturn-ring-occlusion-color-grade" | "gas-giant-layer-color-grade" | "airless-regolith-color-depth" | "overview-neutral-color";
  atlasNumericalIntegritySummary: import("./simulationDiagnosticsTypes").AtlasNumericalIntegritySummary;
  atlasCinematicPlanetaryArtDirectionSummary: import("./simulationDiagnosticsTypes").AtlasCinematicPlanetaryArtDirectionSummary;
  atlasSelectedBodyGasGiantArtProfile: "saturn-muted-bands-ring-aware" | "gas-giant-band-depth-cinematic" | "overview-no-gas-giant-art";
  atlasSelectedBodySaturnRingArtProfile: "saturn-cassini-backlit-ring-art" | "no-ring-art-profile";
  atlasSelectedBodyEarthCloudNightProfile: "earth-clean-cloud-night-shadow-art" | "overview-no-earth-cloud-night-art";
  atlasSelectedBodySolarSurfaceProfile: "solar-granulation-controlled-corona-art" | "overview-no-solar-surface-art";
  atlasGlobalColorGradeProfile: "filmic-cool-space-warm-planet-protection";
  atlasBackgroundArtGradeProfile: "closeup-subject-star-noise-matte" | "sparse-negative-space-milky-way-depth";
  atlasCinematicDeepSpaceBackdropSummary: import("./simulationDiagnosticsTypes").AtlasCinematicDeepSpaceBackdropSummary;
  atlasCinematicBackdropStarfieldProfile: "closeup-subject-star-noise-suppressed" | "sparse-primary-stars-faint-distant-field";
  atlasCinematicBackdropNebulaProfile: "closeup-nebula-haze-restrained" | "soft-local-nebula-haze-layer";
  atlasCinematicBackdropNegativeSpaceProfile: "selected-body-clean-dark-backdrop" | "layered-milky-way-negative-space";
  atlasSparseDeepSpaceDirectorSummary: import("./simulationDiagnosticsTypes").AtlasSparseDeepSpaceDirectorSummary;
  atlasSparseDeepSpaceStarfieldProfile: "closeup-primary-stars-subject-matte" | "sparse-primary-stars-ultrafaint-distant-field";
  atlasSparseDeepSpaceMilkyWayProfile: "closeup-dark-lane-negative-space" | "deep-cold-gray-blue-dark-lanes";
  atlasSparseDeepSpaceNebulaProfile: "closeup-haze-nearly-suppressed" | "barely-visible-local-haze";
  atlasSparseDeepSpaceNegativeSpaceProfile: "selected-body-clean-negative-space" | "overview-wide-negative-space";
  atlasCloseupPresentationTruthSummary: import("./simulationDiagnosticsTypes").AtlasCloseupPresentationTruthSummary;
  atlasVisualStabilitySummary: import("./simulationDiagnosticsTypes").AtlasVisualStabilitySummary;
  atlasBackgroundGuardSummary: import("./simulationDiagnosticsTypes").AtlasBackgroundGuardSummary;
  atlasMaterialProfileSummary: import("./simulationDiagnosticsTypes").AtlasMaterialProfileSummary;
  atlasCloseupVisualFidelitySummary: import("./simulationDiagnosticsTypes").AtlasCloseupVisualFidelitySummary;
  atlasCloseupPreviewSyncStatus: string;
  atlasBodyPreviewProfile: import("./simulationDiagnosticsTypes").AtlasBodyPreviewProfile | null;
  atlasCloseupSolarBackdropProfile: string;
  atlasCloseupPlanetReadabilityProfile: string;
  atlasCloseupReviewMode: "scene-review" | "standard";
  canvasReady: boolean;
  skyReady: boolean;
  coreBodiesReady: boolean;
  atlasReadinessFallback: boolean;
  gaiaCatalogSource: import("../data/gaiaStarCatalog").GaiaCatalogSource;
  celestialCatalogSummary: import("./simulationDiagnosticsTypes").CelestialCatalogSummary;
  selectedCelestialCatalogId: string;
  celestialCatalogLayerState: string;
  celestialVisualLayerSummary: import("./simulationDiagnosticsTypes").CelestialVisualLayerSummary;
  atlasPerformanceBudgetSummary: import("./simulationDiagnosticsTypes").AtlasPerformanceBudgetSummary;
  celestialObjectPassport: import("./simulationDiagnosticsTypes").CelestialObjectPassport | null;
  atlasNavigatorOpen: boolean;
  atlasWorkflowOpen: boolean;
  atlasWorkflowSelectedId: string;
  atlasWorkflowActiveStepId: string;
  atlasMissionHubOpen: boolean;
  atlasMissionHubSummary: import("./simulationDiagnosticsTypes").AtlasMissionHubSummary;
  atlasMissionCapsuleRestoreSummary: import("./simulationDiagnosticsTypes").AtlasMissionCapsuleRestoreSummary;
  atlasScientificReportOpen: boolean;
  atlasScientificReportSummary: import("./simulationDiagnosticsTypes").AtlasScientificReportSummary;
  atlasScientificReportExportFormat: AtlasReportExportFormat;
  atlasReportStudioSummary: import("./simulationDiagnosticsTypes").AtlasReportStudioSummary;
  atlasValidationConsoleOpen: boolean;
  atlasValidationConsoleSummary: import("./simulationDiagnosticsTypes").AtlasValidationConsoleSummary;
  atlasValidationSelectedDomainId: AtlasValidationDomainId;
  atlasBrowserAcceptanceSummary: import("./simulationDiagnosticsTypes").AtlasBrowserAcceptanceSummary;
  atlasWorkbenchAccessibilitySummary: import("./simulationDiagnosticsTypes").AtlasWorkbenchAccessibilitySummary;
  atlasCinematicWorkbenchSummary: import("./simulationDiagnosticsTypes").AtlasCinematicWorkbenchSummary;
  relativityObservableAtlasSummary: import("./simulationDiagnosticsTypes").RelativityObservableAtlasSummary;
  relativityObservableExplainerSummary: import("./simulationDiagnosticsTypes").RelativityObservableExplainerSummary;
  relativityGuidedTourSummary: import("./simulationDiagnosticsTypes").RelativityGuidedTourSummary;
  atlasRelativityVerificationSummary: import("./simulationDiagnosticsTypes").AtlasRelativityVerificationSummary;
  atlasRelativityChartSummary: import("./simulationDiagnosticsTypes").AtlasRelativityChartSummary;
  atlasPhysicsBenchmarkGateSummary: import("./simulationDiagnosticsTypes").AtlasPhysicsBenchmarkGateSummary;
  atlasHorizonsGateAuditSummary: import("./simulationDiagnosticsTypes").AtlasHorizonsGateAuditSummary;
  atlasPhysicsGateSplitSummary: import("./simulationDiagnosticsTypes").AtlasPhysicsGateSplitSummary;
  atlasReleaseReadinessSummary: import("./simulationDiagnosticsTypes").AtlasReleaseReadinessSummary;
  atlasScientificGatePreflightSummary: import("./simulationDiagnosticsTypes").AtlasScientificGatePreflightSummary;
  atlasHorizonsResidualDecompositionSummary: import("./simulationDiagnosticsTypes").AtlasHorizonsResidualDecompositionSummary;
  atlasHorizonsCandidateLabSummary: { readonly candidateProfile: "v82-de440-gm-softening-step-hierarchy-matrix"; readonly status: "pending-offline-run"; readonly candidateCount: 5; readonly trustedBoundary: "Local v82 candidate lab over offline Horizons fixtures, DE440 gravitational parameters, softening and fixed-step variants. Candidate rows are diagnostics only: they do not relax v75 budgets, do not close the strict scientific gate, do not mutate SolarSystemIntegrator, physicsEngine defaults, worker physics, RK4, EIH 1PN, Kerr, materials, backgrounds, sky assets or runtime product/scientific gate semantics."; };
  atlasPlutoResidualIsolationSummary: { readonly isolationProfile: "v83-outer-system-phase-force-model-matrix"; readonly status: "pending-runtime-run"; readonly classification: "not-isolated"; readonly trustedBoundary: "Local v83 Pluto and outer-solar-system residual isolation over offline Horizons candidate runs. This is diagnostic attribution only: it does not relax v75 budgets, claim NASA/JPL scientific certification, close the strict Horizons gate, mutate SolarSystemIntegrator, physicsEngine defaults, worker physics, RK4, EIH 1PN, Kerr, materials, backgrounds, sky assets or product/scientific gate semantics."; };
  atlasOuterSystemForceModelPreflightSummary: { readonly preflightProfile: "v84-pluto-barycenter-tno-force-model-upgrade-path"; readonly status: "pending-runtime-run"; readonly classification: "not-enough-evidence"; readonly trustedBoundary: "Local v84 outer-system force-model preflight over offline Horizons fixtures and non-applied candidate rows. This audits fixture provenance before interpreting Pluto or outer-solar-system residuals. It does not relax v75 budgets, claim NASA/JPL scientific certification, close the strict Horizons gate, mutate SolarSystemIntegrator, physicsEngine defaults, worker physics, RK4, EIH 1PN, Kerr, materials, backgrounds, sky assets or product/scientific gate semantics."; };
  atlasOuterSystemReferenceAdoptionSummary: { readonly adoptionProfile: "v85-barycentric-fixture-adoption-readiness"; readonly status: "pending-runtime-run"; readonly classification: "mixed"; readonly trustedBoundary: "Local v85 reference-adoption preflight over the existing v84 outer-system barycenter fixture and DE440 system GM candidate path. This proves migration readiness only: it does not replace the v75 strict fixture, relax budgets, close the strict Horizons scientific gate, claim NASA/JPL certification, mutate SolarSystemIntegrator, physicsEngine defaults, worker physics, RK4, EIH 1PN, Kerr, materials, backgrounds, sky assets or product/scientific gate semantics."; };
  atlasHorizonsCandidateScientificGateSummary: { readonly candidateGateProfile: "v86-barycentric-reference-candidate-gate"; readonly status: "pending-runtime-run"; readonly classification: "mixed"; readonly trustedBoundary: "Local v86 candidate scientific gate over the v85 adoption path. This proves only that the v84 outer-system barycenter fixture plus DE440 system GM candidate can satisfy the v75 numerical budget as an unapplied candidate; it does not migrate the default strict Horizons gate, replace the v75 fixture, relax budgets, claim NASA/JPL certification, mutate SolarSystemIntegrator, physicsEngine defaults, worker physics, RK4, EIH 1PN, Kerr, materials, backgrounds, sky assets or product/scientific gate semantics."; };
  atlasStrictHorizonsMigrationDryRunSummary: { readonly migrationProfile: "v87-default-gate-migration-diff-audit"; readonly status: "pending-runtime-run"; readonly classification: "mixed"; readonly trustedBoundary: "Local v87 dry-run audit for a future strict Horizons migration. It records the exact non-applied diff from the current v75 strict fixture and command to the v86 passing candidate path, but it does not migrate the default strict gate, replace fixtures, relax budgets, claim NASA/JPL certification, mutate SolarSystemIntegrator, physicsEngine defaults, worker physics, RK4, EIH 1PN, Kerr, materials, backgrounds, sky assets, screenshots or product/scientific gate semantics."; };
  atlasStrictHorizonsShadowMigrationGateSummary: { readonly shadowGateProfile: "v88-parallel-default-gate-rehearsal"; readonly status: "pending-runtime-run"; readonly classification: "mixed"; readonly trustedBoundary: "Local v88 shadow strict Horizons gate rehearsal. It runs the future migrated strict-gate configuration as a separate non-applied command over the v87 migration dry-run manifest, but it does not replace the default strict scientific gate, relax v75 budgets, claim NASA/JPL certification, mutate SolarSystemIntegrator, physicsEngine defaults, worker physics, RK4, EIH 1PN, Kerr, materials, backgrounds, sky assets or product/scientific gate semantics."; };
  atlasDefaultStrictHorizonsMigrationSummary: { readonly migrationProfile: "v89-apply-barycentric-reference-default-gate"; readonly status: "pending-runtime-run"; readonly classification: "mixed"; readonly trustedBoundary: "Local v89 migration of the offline strict Horizons scientific gate from the legacy v75 center-reference fixture to the v88 shadow-proven barycentric reference fixture. This applies only to the default offline scientific gate command; it does not mutate live runtime physics, SolarSystemIntegrator, physicsEngine defaults, worker physics, RK4 runtime defaults, EIH 1PN, Kerr, materials, backgrounds, sky assets, v75 budgets, or claim NASA/JPL certification."; };
  atlasHorizonsProvenanceFreezeSummary: { readonly freezeProfile: "v90-default-gate-command-fixture-hash-lock"; readonly status: "pending-runtime-run"; readonly classification: "mixed"; readonly trustedBoundary: "Local v90 freeze of the v89 offline strict Horizons scientific gate contract. It locks command ownership, v84/v75 fixture hashes, v75 budgets, legacy blocker evidence and offline-only scope; it does not mutate live runtime physics, worker physics, RK4 runtime defaults, EIH 1PN, Kerr, materials, backgrounds, sky assets, or claim NASA/JPL certification."; };
  atlasOfflineRuntimeBoundaryAuditSummary: { readonly boundaryProfile: "v91-scientific-gate-runtime-boundary-lock"; readonly status: "pending-runtime-run"; readonly classification: "mixed"; readonly trustedBoundary: "Local v91 audit that keeps the v89/v90 migrated and frozen offline strict Horizons scientific gate separate from live runtime physics. It does not mutate SolarSystemIntegrator, physicsEngine defaults, worker physics, RK4 runtime defaults, EIH 1PN, Kerr, materials, backgrounds, sky assets, fixture data, v75 budgets, or claim NASA/JPL certification."; };
  atlasScientificGateMaintenanceRunbookSummary: { readonly runbookProfile: "v92-offline-gate-release-rollback-command-runbook"; readonly status: "pending-runtime-run"; readonly classification: "mixed"; readonly trustedBoundary: "Local v92 maintenance runbook lock for the migrated and frozen offline strict Horizons scientific gate. It locks product verification, scientific verification, migrated strict gate, legacy v75 rollback audit, provenance freeze and offline/runtime boundary commands; it does not mutate live runtime physics, worker physics, RK4 runtime defaults, EIH 1PN, Kerr, materials, backgrounds, sky assets, fixture data, v75 budgets, or claim NASA/JPL certification."; };
  atlasScientificGateReleaseEvidenceSummary: { readonly releaseEvidenceProfile: "v93-offline-gate-release-evidence-bundle"; readonly status: "pending-runtime-run"; readonly classification: "mixed"; readonly trustedBoundary: "Local v93 release evidence bundle lock for the migrated, frozen and maintained offline strict Horizons scientific gate. It locks release verification, scientific verification, runbook, provenance freeze, offline/runtime boundary, migrated strict gate and legacy v75 audit evidence; it does not mutate live runtime physics, worker physics, RK4 runtime defaults, EIH 1PN, Kerr, materials, backgrounds, sky assets, fixture data, v75 budgets, or claim NASA/JPL certification."; };
  atlasBrowserCiStabilityLockSummary: { readonly stabilityProfile: "v94-fresh-browser-ci-runtime-stability"; readonly status: "pending-runtime-run"; readonly classification: "mixed"; readonly trustedBoundary: "Local v94 browser and CI stability lock for fresh Playwright acceptance, screenshot retry, pixel settle sampling, fresh server teardown, command ownership and known Windows Watchpack noise. It does not mutate live runtime physics, worker physics, RK4 runtime defaults, EIH 1PN, Kerr, materials, backgrounds, sky assets, fixture data, v75 budgets, default scientific gate configuration, or claim NASA/JPL certification."; };
  atlasReleaseArtifactManifestLockSummary: { readonly artifactManifestProfile: "v95-offline-release-artifact-manifest"; readonly status: "pending-runtime-run"; readonly classification: "mixed"; readonly trustedBoundary: "Local v95 release artifact manifest lock over the v93 scientific release evidence and v94 browser CI stability evidence. It indexes command matrix, fixture hashes, browser artifact paths, documentation boundaries, rollback interpretation and protected mutation flags; it does not create release archives, mutate live runtime physics, worker physics, RK4 runtime defaults, EIH 1PN, Kerr, materials, backgrounds, sky assets, fixture data, v75 budgets, default scientific gate configuration, or claim NASA/JPL certification."; };
  atlasFinalMaintenanceBaselineSummary: { readonly maintenanceBaselineProfile: "v96-final-offline-maintenance-baseline"; readonly status: "pending-runtime-run"; readonly classification: "mixed"; readonly trustedBoundary: "Local v96 final maintenance baseline lock for the offline Orbit Atlas verification and scientific gate evidence chain. It locks verify:atlas:full, verify:atlas:scientific, v90-v95 maintenance evidence, legacy v75 rollback evidence and the post-v96 rule that scientific mainline changes require an intentional fixture/model upgrade or true live physics migration; it does not mutate live runtime physics, worker physics, RK4 runtime defaults, EIH 1PN, Kerr, materials, backgrounds, sky assets, fixture data, v75 budgets, default scientific gate configuration, release packaging, or claim NASA/JPL certification."; };
  atlasGaiaStarfieldEnhancementSummary: import("./simulationDiagnosticsTypes").AtlasGaiaStarfieldEnhancementSummary;
  atlasRelativitySimulationOptimizationSummary: import("./simulationDiagnosticsTypes").AtlasRelativitySimulationOptimizationSummary;
  atlasArtPolishSummary: { readonly artPolishProfile: "v99-gaia-overlay-closeup-presentation-polish"; readonly status: "pending-runtime-run"; readonly classification: "mixed"; readonly opacityCaps: { readonly mobile: 0.62; readonly balanced: 1.05; readonly dense: 1.2; readonly closeup: 0.18; }; readonly trustedBoundary: "Local v99 presentation-only art polish over the v97 Gaia overlay and v98 relativity observability baseline. It improves visible Gaia star layering, constellation line restraint, nebula marker readability, selected-body closeup readability and mobile density while preserving the v97 Gaia render budgets, ORBIT_ATLAS_SKY === ORBIT_ATLAS_V9_SKY, GalaxyEnvironmentSphere legacy V9 background direction, live runtime physics, worker physics, RK4/DP, EIH 1PN, Kerr kernel id, Horizons fixtures, v75 budgets, materials, release packaging and certification boundaries."; };
  atlasPostEnhancementMaintenanceBaselineSummary: { readonly postEnhancementBaselineProfile: "v100-v97-v99-visual-teaching-maintenance-lock"; readonly status: "pending-runtime-run"; readonly classification: "mixed"; readonly gaiaRenderBudget: { readonly mobile: 1000; readonly balanced: 1800; readonly dense: 3000; }; readonly artOpacityCaps: { readonly mobile: 0.62; readonly balanced: 1.05; readonly dense: 1.2; readonly closeup: 0.18; }; readonly trustedBoundary: "Local v100 post-enhancement maintenance baseline over the immutable v96 final baseline, v97 Gaia overlay, v98 teaching observability layer and v99 presentation-only art polish. It freezes evidence, entrypoints, browser resource policies, Gaia budgets, v99 opacity caps, 88 IAU constellation scope, curated nebula marker boundaries and protected mutation flags without performance optimization, release archive creation, fixture generation, scientific model upgrade, live physics mutation, worker physics mutation, RK4/DP mutation, EIH 1PN mutation, Kerr kernel mutation, Horizons fixture mutation, v75 budget mutation, V9 sky/background mutation or historical v95/v96 contract rewrite."; };
  atlasBrowserResourcePerformanceSummary: { readonly browserResourcePerformanceProfile: "v101-fresh-browser-resource-performance"; readonly status: "pending-runtime-run"; readonly classification: "mixed"; readonly pixelSamplerPolicy: "shared-imagebitmap-canvas-sampler-explicit-close-and-zero"; readonly freshTeardownPolicy: "fresh-3015-global-teardown-no-reuse-existing-server"; readonly trustedBoundary: "Local v101 browser resource performance stability lock over v100. It applies only a browser acceptance helper resource optimization for shared ImageBitmap/canvas screenshot pixel sampling, explicit bitmap close, canvas zeroing, fresh 3015 teardown and console/page-error observability. It does not change scientific gates, fixtures, live runtime physics, worker physics, RK4/DP, EIH 1PN, Kerr kernel id, V9 sky/background, v97 Gaia budgets, v99 opacity caps, screenshot thresholds, screenshot retry count, pixel settle attempts, release packaging or official certification claims."; };
  atlasMaintenanceEvidenceIndexSummary: { readonly maintenanceEvidenceIndexProfile: "v102-v93-v101-maintenance-evidence-index"; readonly status: "pending-runtime-run"; readonly classification: "mixed"; readonly dirtyWorktreePolicy: "no-reset-no-revert-no-clean-no-stage-no-commit"; readonly watchpackNoisePolicy: "dumpstack-pagefile-known-non-failure-noise"; readonly browserQaPolicy: "root-observable-evidence-validation-console-errors-zero-teardown-clear"; readonly trustedBoundary: "Local v102 maintenance evidence index over v93-v101. It indexes command evidence, browser screenshot artifact directories, Browser QA result policy, dirty worktree hygiene and Windows Watchpack DumpStack.log.tmp/pagefile.sys known non-failure noise without cleaning, resetting, reverting, staging, committing, release packaging, scientific gate mutation, fixture mutation, runtime physics mutation, worker physics mutation, RK4/DP mutation, EIH 1PN mutation, Kerr mutation, V9 sky/background mutation, v97 Gaia budget mutation or v99 opacity cap mutation."; };
  atlasPresentationRuntimePerformanceSummary: { readonly presentationRuntimePerformanceProfile: "v103-gaia-constellation-label-runtime-cost"; readonly status: "pending-runtime-run"; readonly classification: "mixed"; readonly gaiaRuntimePolicy: "gaia-uniform-write-dedupe-static-instance-attributes"; readonly constellationRuntimePolicy: "constellation-frame-signature-material-write-dedupe"; readonly labelRuntimePolicy: "label-dom-visible-style-write-dedupe"; readonly budgetThresholdPolicy: "v97-v99-v75-browser-thresholds-preserved"; readonly trustedBoundary: "Local v103 presentation runtime performance lock over v102. It only reduces per-frame presentation-layer write pressure for Gaia, constellation and label surfaces while preserving v97 Gaia render budgets, v99 opacity caps, v75 budgets, browser screenshot thresholds, pixel settle/retry policy, scientific gates, fixtures, live runtime physics, worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background direction, browser QA cost policy, release packaging and certification boundaries."; };
  atlasBrowserAcceptanceRuntimeCostSummary: { readonly browserAcceptanceRuntimeCostProfile: "v104-fresh-browser-acceptance-cost-review"; readonly status: "pending-runtime-run"; readonly classification: "mixed"; readonly screenshotManifestPolicy: "default-current-plus-core-full-review-history"; readonly markerCoveragePolicy: "root-observable-evidence-validation-preserved"; readonly consoleErrorPolicy: "console-page-error-zero-preserved"; readonly trustedBoundary: "Local v104 browser acceptance runtime cost lock over v103. It only splits browser acceptance screenshot capture into a default current/core manifest and an opt-in full historical review manifest while preserving desktop/mobile fresh acceptance, root/Observable/Evidence/Validation marker coverage, console/page-error checks, 3015 teardown, screenshot retry, pixel settle, browser pixel thresholds, scientific gates, fixtures, live runtime physics, worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background direction, v97 Gaia budgets, v99 opacity caps, release packaging and certification boundaries."; };
  atlasFinalGaiaArtEnhancementSummary: { readonly finalGaiaArtEnhancementProfile: "v105-budget-preserved-gaia-art-polish"; readonly status: "pending-runtime-run"; readonly classification: "mixed"; readonly gaiaSelectionPolicy: "deterministic-bright-near-color-spread-sky-binned"; readonly gaiaVisualMappingPolicy: "budget-preserved-brightness-color-temperature-layering"; readonly browserQaPolicy: "root-observable-evidence-validation-v105-markers"; readonly trustedBoundary: "Local v105 budget-preserved Gaia art enhancement over v104. It improves deterministic Gaia star selection, Gaia brightness/color layering, constellation readability and nebula presentation while preserving v97 Gaia render budgets, v99 opacity caps, browser pixel thresholds, scientific gates, fixtures, live runtime physics, worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background direction, release packaging and official certification boundaries."; };
  atlasRcEvidenceClosureSummary: { readonly rcEvidenceClosureProfile: "v106-v93-v105-final-rc-evidence-closure"; readonly status: "pending-runtime-run"; readonly classification: "mixed"; readonly commandMatrixPolicy: "v93-v105-focused-and-verify-commands-indexed"; readonly artifactIndexPolicy: "v93-v105-browser-screenshot-directories-indexed"; readonly dirtyWorktreePolicy: "no-reset-no-revert-no-clean-no-stage-no-commit"; readonly watchpackNoisePolicy: "DumpStack.log.tmp-pagefile.sys-known-non-failure-noise"; readonly trustedBoundary: "Local v106 release-candidate evidence closure lock over v105. It indexes v93-v105 evidence, commands, Browser QA screenshot artifact directories, dirty worktree policy and Windows Watchpack known non-failure noise while preserving scientific gates, fixtures, live runtime physics, worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background direction, v97 Gaia budgets, v99 opacity caps, release archive, staging, commit and official certification boundaries."; };
  atlasInteractionCatalogCompletionSummary: { readonly profile: "v107-camera-launch-gaia-navigation-catalog-completion"; readonly status: "pending-runtime-run"; readonly classification: "mixed"; readonly cameraPolicy: "single-cancellable-command-adaptive-smootherstep-1200-1800ms"; readonly gaiaLabelPolicy: "desktop-24-mobile-8-selected-always"; readonly trustedBoundary: "v107 changes presentation interaction, local Gaia navigation, labels, curated nebula markers and launch entry only. It does not change scientific gates, fixtures, live or worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background, Gaia render budgets or v99 opacity caps."; };
  atlasInteractionRepairLaunchUxSummary: { readonly profile: "v108-sky-target-zoom-launch-ux-repair"; readonly status: "pending-runtime-run"; readonly classification: "mixed"; readonly skyTargetPolicy: "zoomable-visual-proxy-no-physics-body"; readonly launchUxPolicy: "leo-satellite-default-cards-countdown-timeline-local-physics"; readonly trustedBoundary: "v108 repairs presentation interaction and local launch UX only. It adds a zoomable visual proxy for selected catalog/Gaia sky targets, preserves body zoom during camera locks, and improves the local launch panel while preserving scientific gates, fixtures, live and worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background, Gaia render budgets, v99 opacity caps, release packaging, staging and commit boundaries."; };
  atlasInteractionVisualQualitySummary: { readonly profile: "v109-launch-camera-gaia-material-quality"; readonly status: "pending-runtime-run"; readonly classification: "mixed"; readonly cameraFreedomPolicy: "target-follow-user-orbit-override"; readonly launchVisualPolicy: "procedural-budget-rocket-satellite-no-physics-mutation"; readonly stellarMaterialPolicy: "gaia-bp-rp-gmag-parallax-presentation-material"; readonly trustedBoundary: "v109 upgrades presentation interaction and visual quality only. It makes body and sky-target focus locks user-orbit friendly, upgrades local launch camera/rocket/satellite presentation, and maps Gaia/local stellar catalog data into visual materials while preserving scientific gates, fixtures, live and worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background, v75 budgets, v97 Gaia render budgets, v99 opacity caps, release packaging, staging and commit boundaries."; };
  atlasCriticalUiRelativityVisibilitySummary: { readonly profile: "v110-visible-chinese-copy-relativity-core-entry"; readonly status: "pending-runtime-run"; readonly classification: "mixed"; readonly uiCopyPolicy: "visible-chinese-copy-no-mojibake"; readonly relativityCoreEntryPolicy: "bottom-tools-search-observable-atlas-entry"; readonly relativityReadoutPolicy: "eih-dp-rk-mercury-shapiro-kerr-boundary-visible"; readonly trustedBoundary: "v110 is a visible UI and observability pass only. It cleans visible Chinese copy, adds direct Relativity Core entry points and summarizes existing EIH 1PN, DP/RK, Mercury, Shapiro, light-deflection and Kerr readouts without changing scientific gates, fixtures, live or worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background, v75/v97/v99 budgets, staging or commits."; };
  atlasCameraStellarCloseupSummary: { readonly profile: "v111-camera-rig-stellar-portrait-closeup"; readonly status: "pending-runtime-run"; readonly classification: "mixed"; readonly cameraRigPolicy: "target-anchor-user-orbit-distance-state"; readonly stellarPortraitPolicy: "gaia-derived-offline-curated-presentation-portrait"; readonly closeupPerformancePolicy: "selected-closeup-nonessential-layer-suppression"; readonly trustedBoundary: "v111 is a presentation and camera-control pass only. It preserves user orbit/zoom state while target anchors move, adds Gaia/local stellar portrait rendering from catalog-derived visual material, and suppresses nonessential close-up layers without changing scientific gates, fixtures, live or worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background, v75/v97/v99 budgets, staging or commits."; };
  atlasLaunchGameplayOpenRocketBridgeSummary: { readonly profile: "v112-mission-scene-openrocket-import-bridge"; readonly status: "pending-runtime-run"; readonly classification: "mixed"; readonly launchScenePolicy: "mission-scene-pad-tower-countdown-staging-hud-deploy"; readonly openRocketBridgePolicy: "offline-import-no-browser-exe-launch"; readonly browserExeLaunch: "not-applied"; readonly trustedBoundary: "v112 upgrades launch presentation and offline import tooling only. It keeps the reliable local launch path as default, treats useLaunchWebSocket/launch_server.py as optional telemetry, imports OpenRocket files or exports as local JSON data, and never starts D:\\86137\\OpenRocket\\OpenRocket.exe from the browser. It does not change scientific gates, fixtures, live or worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background, v75/v97/v99 budgets, staging or commits."; };
  atlasScientificModelUpgradeContractSummary: { readonly profile: "v113-fixture-budget-comparison-rollback-plan"; readonly status: "pending-runtime-run"; readonly scientificUpgradePolicy: "contract-only-no-core-mutation"; readonly fixturePolicy: "new-fixtures-before-core-change"; readonly rollbackPolicy: "single-switch-core-upgrade-revert-condition"; readonly trustedBoundary: "v113 is a contract-only scientific upgrade plan. It defines the fixtures, error budgets, comparison matrix and rollback conditions required before any future core physics upgrade, and does not modify scientific gates, fixtures, live or worker physics, RK4/DP, EIH 1PN, Kerr or runtime sky/budget caps."; };
  atlasVisualLaunchPerformanceSummary: import("./simulationDiagnosticsTypes").AtlasVisualLaunchPerformanceSummary;
  atlasRuntimeSceneFocusSummary: import("./atlasRuntimeSceneFocusPerformance").AtlasRuntimeSceneFocusSummary;
  atlasSceneMode: AtlasSceneMode;
  atlasVisualIntegrationV2Summary: { version: "v124-visual-integration-performance-gate-v2"; profile: "v124-planet-star-exoplanet-launch-review"; status: "ready-browser-runtime-observation"; reviewScenes: readonly ["earth", "moon", "jupiter", "saturn", "sirius", "betelgeuse", "hd-209458", "barnards-star", "stellar-o-b", "stellar-a-f", "stellar-g", "stellar-k-m", "stellar-giant-variable", "trappist-1", "kepler-90", "hd-209458-b", "leo-liftoff", "max-q", "payload-deploy"]; search: { hotShardMaxMs: number; coldShardMaxMs: number; latestRequestWins: boolean; }; camera: { commandToMotionMaxMs: number; desktopTransitionMs: readonly [700, 1000]; mobileTransitionMaxMs: number; }; desktop: { overviewMedianFpsMin: number; sceneMedianFpsMin: number; }; mobile: { medianFpsMin: number; frameP95MaxMs: number; }; stellarCloseupDrawCallsMax: number; boundary: string; };
  atlasScientificPromotionV2Summary: import("./atlasScientificPromotionV2").AtlasScientificPromotionV2Summary;
  atlasOfflineStellarSearchCatalogV2Summary: import("./atlasOfflineStellarSearchCatalogV2").AtlasOfflineStellarSearchCatalogV2Summary;
  atlasScientificCinematicArtSummary: { version: "v117-scientific-cinematic-art-lock"; profile: "v117-derived-photosphere-shader-passport-lod"; status: "ready-scientific-cinematic-art"; portraitMaterial: "shared-programmatic-photosphere-shader"; portraitViews: "portrait-spectrum-data"; derivation: "gaia-derived-presentation-not-resolved-surface"; materialBudgetMb: number; assetPolicy: "offline-provenance-checksum-license-manifest"; focusedCommand: "npm run test:atlas:scientific-cinematic-art"; trustedBoundary: string; };
  atlasLaunchSceneOpenRocketReplaySummary: { version: "v118-launch-scene-openrocket-replay-lock"; profile: "v118-screen-overlay-nasa-assets-offline-replay"; status: "ready-launch-scene-offline-replay"; hudPolicy: "fixed-screen-space-overlay"; phasePolicy: "prelaunch-ignition-tower-clear-maxq-meco-coast-insertion-deploy"; assetPolicy: "local-nasa-provenance-lazy-deferred"; initialAssetLimitBytes: number; replayPolicy: "structured-ork-csv-json-offline-manifest"; browserExeLaunch: "not-applied"; focusedCommand: "npm run test:atlas:launch-scene-openrocket-replay"; trustedBoundary: string; };
  atlasVisualIntegrationReleaseSummary: { version: "v119-visual-integration-release-gate"; profile: "v119-eight-scenes-runtime-observation-release"; status: "ready-browser-runtime-observation"; reviewScenes: readonly import("./atlasVisualIntegrationRelease").AtlasVisualReviewScene[]; desktopOverviewMedianFpsMin: number; desktopCloseupLaunchMedianFpsMin: number; mobileMedianFpsMin: number; mobileFrameTimeP95MaxMs: number; selectionLongTaskMaxMs: number; mainTasksUnder50MsRatioMin: number; performancePolicy: "hardware-baseline-gate-ci-observation-only"; focusedCommand: "npm run test:atlas:visual-integration-release"; trustedBoundary: string; };
  localLaunchActive: boolean;
  selectedBodyIndex: number | null;
  atlasObservatoryDeckOpen: boolean;
  atlasObservatoryDeckSummary: import("./simulationDiagnosticsTypes").AtlasObservatoryDeckSummary;
  atlasObservatoryActiveZoneId: AtlasObservatoryZoneId;
  viewSettings: SimulationViewSettings;
  kerrTrackSet: import("./simulationDiagnosticsTypes").KerrGeodesicTrackSet;
  kerrBlackHole: KerrBlackHoleUiState;
  kerrStudioSummary: import("./simulationDiagnosticsTypes").KerrRelativityStudioSummary;
};

export function createAtlasRuntimeEvidenceRootAttributesV190(
  scope: AtlasRuntimeEvidenceCompositionScopeV190,
) {
  const {
    presentation,
    orbitAtlas,
    atlasReady,
    selectedBodyVisualTier,
    atlasPlanetaryVisualFidelitySummary,
    selectedBodyVisualId,
    selectedBodyCloseupActive,
    selectedBodyAtmosphereProfile,
    atlasSkyCloseupProfile,
    atlasCinematicLightingSummary,
    selectedBodyLightingProfile,
    atlasChineseDeepSpaceFidelitySummary,
    atlasCinematicCameraProfile,
    atlasCinematicSkyCompositionProfile,
    atlasCinematicBackgroundNoiseProfile,
    atlasCinematicTargetSeparationProfile,
    atlasCinematicDeepSpaceCameraSummary,
    atlasUniverseSandboxReferenceBackdropSummary,
    atlasBackgroundDepthProfile,
    atlasBackgroundSubjectVisibilityProfile,
    atlasReferenceGradeSpaceArtSummary,
    atlasReferenceGradeCompositeProfile,
    atlasReferenceGradeSkyLayerProfile,
    atlasReferenceGradeStarfieldProfile,
    atlasReferenceGradeSubjectMatteProfile,
    atlasReferenceGradePlanetMaterialProfile,
    atlasPlanetaryMaterialCompositionSummary,
    atlasSelectedBodyMaterialProfile,
    atlasSelectedBodyAtmosphereDepthProfile,
    atlasSelectedBodyTerminatorProfile,
    atlasSelectedBodyRingProfile,
    atlasCinematicCloseupDirectorSummary,
    atlasCloseupCompositionProfile,
    atlasCloseupPanelAvoidanceProfile,
    atlasCloseupRingShowcaseProfile,
    atlasCinematicKeyLightDirectorSummary,
    atlasSelectedBodyKeyLightProfile,
    atlasPlanetaryDepthLightingSummary,
    atlasSelectedBodyDepthLightingProfile,
    atlasPlanetaryColorGradingSummary,
    atlasSelectedBodyColorGradeProfile,
    atlasNumericalIntegritySummary,
    atlasCinematicPlanetaryArtDirectionSummary,
    atlasSelectedBodyGasGiantArtProfile,
    atlasSelectedBodySaturnRingArtProfile,
    atlasSelectedBodyEarthCloudNightProfile,
    atlasSelectedBodySolarSurfaceProfile,
    atlasGlobalColorGradeProfile,
    atlasBackgroundArtGradeProfile,
    atlasCinematicDeepSpaceBackdropSummary,
    atlasCinematicBackdropStarfieldProfile,
    atlasCinematicBackdropNebulaProfile,
    atlasCinematicBackdropNegativeSpaceProfile,
    atlasSparseDeepSpaceDirectorSummary,
    atlasSparseDeepSpaceStarfieldProfile,
    atlasSparseDeepSpaceMilkyWayProfile,
    atlasSparseDeepSpaceNebulaProfile,
    atlasSparseDeepSpaceNegativeSpaceProfile,
    atlasCloseupPresentationTruthSummary,
    atlasVisualStabilitySummary,
    atlasBackgroundGuardSummary,
    atlasMaterialProfileSummary,
    atlasCloseupVisualFidelitySummary,
    atlasCloseupPreviewSyncStatus,
    atlasBodyPreviewProfile,
    atlasCloseupSolarBackdropProfile,
    atlasCloseupPlanetReadabilityProfile,
    atlasCloseupReviewMode,
    canvasReady,
    skyReady,
    coreBodiesReady,
    atlasReadinessFallback,
    gaiaCatalogSource,
    celestialCatalogSummary,
    selectedCelestialCatalogId,
    celestialCatalogLayerState,
    celestialVisualLayerSummary,
    atlasPerformanceBudgetSummary,
    celestialObjectPassport,
    atlasNavigatorOpen,
    atlasWorkflowOpen,
    atlasWorkflowSelectedId,
    atlasWorkflowActiveStepId,
    atlasMissionHubOpen,
    atlasMissionHubSummary,
    atlasMissionCapsuleRestoreSummary,
    atlasScientificReportOpen,
    atlasScientificReportSummary,
    atlasScientificReportExportFormat,
    atlasReportStudioSummary,
    atlasValidationConsoleOpen,
    atlasValidationConsoleSummary,
    atlasValidationSelectedDomainId,
    atlasBrowserAcceptanceSummary,
    atlasWorkbenchAccessibilitySummary,
    atlasCinematicWorkbenchSummary,
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
    atlasHorizonsCandidateLabSummary,
    atlasPlutoResidualIsolationSummary,
    atlasOuterSystemForceModelPreflightSummary,
    atlasOuterSystemReferenceAdoptionSummary,
    atlasHorizonsCandidateScientificGateSummary,
    atlasStrictHorizonsMigrationDryRunSummary,
    atlasStrictHorizonsShadowMigrationGateSummary,
    atlasDefaultStrictHorizonsMigrationSummary,
    atlasHorizonsProvenanceFreezeSummary,
    atlasOfflineRuntimeBoundaryAuditSummary,
    atlasScientificGateMaintenanceRunbookSummary,
    atlasScientificGateReleaseEvidenceSummary,
    atlasBrowserCiStabilityLockSummary,
    atlasReleaseArtifactManifestLockSummary,
    atlasFinalMaintenanceBaselineSummary,
    atlasGaiaStarfieldEnhancementSummary,
    atlasRelativitySimulationOptimizationSummary,
    atlasArtPolishSummary,
    atlasPostEnhancementMaintenanceBaselineSummary,
    atlasBrowserResourcePerformanceSummary,
    atlasMaintenanceEvidenceIndexSummary,
    atlasPresentationRuntimePerformanceSummary,
    atlasBrowserAcceptanceRuntimeCostSummary,
    atlasFinalGaiaArtEnhancementSummary,
    atlasRcEvidenceClosureSummary,
    atlasInteractionCatalogCompletionSummary,
    atlasInteractionRepairLaunchUxSummary,
    atlasInteractionVisualQualitySummary,
    atlasCriticalUiRelativityVisibilitySummary,
    atlasCameraStellarCloseupSummary,
    atlasLaunchGameplayOpenRocketBridgeSummary,
    atlasScientificModelUpgradeContractSummary,
    atlasVisualLaunchPerformanceSummary,
    atlasRuntimeSceneFocusSummary,
    atlasSceneMode,
    atlasVisualIntegrationV2Summary,
    atlasScientificPromotionV2Summary,
    atlasOfflineStellarSearchCatalogV2Summary,
    atlasScientificCinematicArtSummary,
    atlasLaunchSceneOpenRocketReplaySummary,
    atlasVisualIntegrationReleaseSummary,
    localLaunchActive,
    selectedBodyIndex,
    atlasObservatoryDeckOpen,
    atlasObservatoryDeckSummary,
    atlasObservatoryActiveZoneId,
    viewSettings,
    kerrTrackSet,
    kerrBlackHole,
    kerrStudioSummary,
  } = scope;
  const evidenceViewModel = createAtlasRuntimeEvidenceViewModelV177({
    visual: [
      presentation.presentationMode, presentation.scaleMode, presentation.renderBudget, orbitAtlas ? ORBIT_ATLAS_VISUAL_PROFILE : undefined,
      orbitAtlas ? String(atlasReady) : undefined, orbitAtlas ? "layered-nasa-8k" : undefined, orbitAtlas ? selectedBodyVisualTier : undefined,
      ATLAS_PLANETARY_VISUAL_FIDELITY_VERSION, atlasPlanetaryVisualFidelitySummary.visualTarget, atlasPlanetaryVisualFidelitySummary.styleTarget,
      atlasPlanetaryVisualFidelitySummary.assetPolicy, atlasPlanetaryVisualFidelitySummary.trustedBoundary, selectedBodyVisualId,
      selectedBodyVisualTier, selectedBodyCloseupActive ? "true" : "false", selectedBodyAtmosphereProfile, atlasSkyCloseupProfile,
      ATLAS_CINEMATIC_LIGHTING_COMPOSITION_VERSION, atlasCinematicLightingSummary.visualTarget, atlasCinematicLightingSummary.lightingProfile,
      atlasCinematicLightingSummary.postFxProfile, atlasCinematicLightingSummary.assetPolicy, selectedBodyLightingProfile,
      atlasCinematicLightingSummary.trustedBoundary, ATLAS_CHINESE_DEEP_SPACE_FIDELITY_VERSION, atlasChineseDeepSpaceFidelitySummary.uiLanguage,
      atlasChineseDeepSpaceFidelitySummary.localizationMode, atlasChineseDeepSpaceFidelitySummary.version,
      atlasChineseDeepSpaceFidelitySummary.visualProfile, atlasChineseDeepSpaceFidelitySummary.assetPolicy,
      atlasChineseDeepSpaceFidelitySummary.trustedBoundary, ATLAS_CINEMATIC_DEEP_SPACE_CAMERA_VERSION, atlasCinematicCameraProfile,
      atlasCinematicSkyCompositionProfile, atlasCinematicBackgroundNoiseProfile, atlasCinematicTargetSeparationProfile,
      atlasCinematicDeepSpaceCameraSummary.qualityBudget, atlasCinematicDeepSpaceCameraSummary.trustedBoundary,
      ATLAS_UNIVERSE_SANDBOX_REFERENCE_BACKDROP_VERSION, atlasUniverseSandboxReferenceBackdropSummary.referenceMode,
      atlasUniverseSandboxReferenceBackdropSummary.backgroundArtDirection, atlasBackgroundDepthProfile, atlasBackgroundSubjectVisibilityProfile,
      atlasUniverseSandboxReferenceBackdropSummary.screenshotReview, atlasUniverseSandboxReferenceBackdropSummary.trustedBoundary,
      ATLAS_REFERENCE_GRADE_SPACE_ART_VERSION, atlasReferenceGradeSpaceArtSummary.artDirection, atlasReferenceGradeCompositeProfile,
      atlasReferenceGradeSkyLayerProfile, atlasReferenceGradeStarfieldProfile, atlasReferenceGradeSubjectMatteProfile,
      atlasReferenceGradePlanetMaterialProfile, atlasReferenceGradeSpaceArtSummary.assetPolicy, atlasReferenceGradeSpaceArtSummary.reviewMode,
      atlasReferenceGradeSpaceArtSummary.trustedBoundary, ATLAS_PLANETARY_MATERIAL_COMPOSITION_VERSION,
      atlasPlanetaryMaterialCompositionSummary.materialTarget, atlasPlanetaryMaterialCompositionSummary.assetPolicy,
      atlasSelectedBodyMaterialProfile, atlasSelectedBodyAtmosphereDepthProfile, atlasSelectedBodyTerminatorProfile, atlasSelectedBodyRingProfile,
      atlasPlanetaryMaterialCompositionSummary.trustedBoundary, ATLAS_CINEMATIC_CLOSEUP_DIRECTOR_VERSION,
      atlasCinematicCloseupDirectorSummary.compositionTarget, atlasCloseupCompositionProfile, atlasCloseupPanelAvoidanceProfile,
      atlasCloseupRingShowcaseProfile, atlasCinematicCloseupDirectorSummary.qualityBudget, atlasCinematicCloseupDirectorSummary.assetPolicy,
      atlasCinematicCloseupDirectorSummary.trustedBoundary, ATLAS_CINEMATIC_KEY_LIGHT_DIRECTOR_VERSION,
      atlasCinematicKeyLightDirectorSummary.lightingTarget, atlasSelectedBodyKeyLightProfile, atlasCinematicKeyLightDirectorSummary.qualityBudget,
      atlasCinematicKeyLightDirectorSummary.assetPolicy, atlasCinematicKeyLightDirectorSummary.trustedBoundary,
      ATLAS_PLANETARY_DEPTH_LIGHTING_VERSION, atlasPlanetaryDepthLightingSummary.lightingTarget, atlasSelectedBodyDepthLightingProfile,
      atlasPlanetaryDepthLightingSummary.qualityBudget, atlasPlanetaryDepthLightingSummary.assetPolicy,
      atlasPlanetaryDepthLightingSummary.ringShadowCue, atlasPlanetaryDepthLightingSummary.trustedBoundary, ATLAS_PLANETARY_COLOR_GRADING_VERSION,
      atlasPlanetaryColorGradingSummary.colorTarget, atlasSelectedBodyColorGradeProfile, atlasPlanetaryColorGradingSummary.qualityBudget,
      atlasPlanetaryColorGradingSummary.assetPolicy, atlasPlanetaryColorGradingSummary.gasLayerCue,
      atlasPlanetaryColorGradingSummary.trustedBoundary, ATLAS_NUMERICAL_INTEGRITY_VERSION, atlasNumericalIntegritySummary.integrityStatus,
      atlasNumericalIntegritySummary.energyDriftTrend, atlasNumericalIntegritySummary.angularMomentumDriftTrend,
      atlasNumericalIntegritySummary.timestepSensitivityCoverage, atlasNumericalIntegritySummary.timeReversalCoverage,
      atlasNumericalIntegritySummary.unitAuditCoverage, atlasNumericalIntegritySummary.trustedBoundary,
      ATLAS_CINEMATIC_PLANETARY_ART_DIRECTION_VERSION, atlasCinematicPlanetaryArtDirectionSummary.referenceMode,
      atlasCinematicPlanetaryArtDirectionSummary.qualityTarget, atlasCinematicPlanetaryArtDirectionSummary.assetPolicy,
      atlasSelectedBodyGasGiantArtProfile, atlasSelectedBodySaturnRingArtProfile, atlasSelectedBodyEarthCloudNightProfile,
      atlasSelectedBodySolarSurfaceProfile, atlasGlobalColorGradeProfile, atlasBackgroundArtGradeProfile,
      atlasCinematicPlanetaryArtDirectionSummary.trustedBoundary, ATLAS_CINEMATIC_DEEP_SPACE_BACKDROP_VERSION,
      atlasCinematicDeepSpaceBackdropSummary.referenceMode, atlasCinematicDeepSpaceBackdropSummary.sourcePolicy,
      atlasCinematicDeepSpaceBackdropSummary.skyManifest, atlasCinematicBackdropStarfieldProfile, atlasCinematicBackdropNebulaProfile,
      atlasCinematicBackdropNegativeSpaceProfile, atlasCinematicDeepSpaceBackdropSummary.trustedBoundary, ATLAS_SPARSE_DEEP_SPACE_DIRECTOR_VERSION,
      atlasSparseDeepSpaceDirectorSummary.referenceMode, atlasSparseDeepSpaceDirectorSummary.sourcePolicy,
      atlasSparseDeepSpaceDirectorSummary.skyManifest, atlasSparseDeepSpaceStarfieldProfile, atlasSparseDeepSpaceMilkyWayProfile,
      atlasSparseDeepSpaceNebulaProfile, atlasSparseDeepSpaceNegativeSpaceProfile, atlasSparseDeepSpaceDirectorSummary.trustedBoundary,
      ATLAS_CLOSEUP_PRESENTATION_TRUTH_VERSION, atlasCloseupPresentationTruthSummary.backgroundOrbitArtVersion,
      atlasCloseupPresentationTruthSummary.backgroundArtProfile, ATLAS_VISUAL_STABILITY_VERSION, atlasVisualStabilitySummary.skyArtLockProfile,
      atlasVisualStabilitySummary.materialStabilityProfile, atlasVisualStabilitySummary.trustedBoundary, ATLAS_BACKGROUND_GUARD_VERSION,
      atlasBackgroundGuardSummary.skyRegressionBudgetProfile, atlasBackgroundGuardSummary.trustedBoundary, ATLAS_MATERIAL_PROFILE_VERSION,
      atlasMaterialProfileSummary.closeupMaterialBudgetProfile, atlasMaterialProfileSummary.trustedBoundary, ATLAS_CLOSEUP_VISUAL_FIDELITY_VERSION,
      atlasCloseupVisualFidelitySummary.assetPolicy, atlasCloseupVisualFidelitySummary.visualTarget,
      atlasCloseupVisualFidelitySummary.protectedSkyManifest, atlasCloseupVisualFidelitySummary.fullReleaseGateStatus,
      atlasCloseupVisualFidelitySummary.trustedBoundary, atlasCloseupPresentationTruthSummary.orbitHierarchyProfile,
      atlasCloseupPresentationTruthSummary.orbitPerformanceProfile, atlasCloseupPresentationTruthSummary.orbitMaterialProfile,
      atlasCloseupPresentationTruthSummary.solarCloseupProfile, atlasCloseupPresentationTruthSummary.velocityTrailProfile,
      atlasCloseupPresentationTruthSummary.orbitOcclusionProfile, atlasCloseupPreviewSyncStatus, atlasBodyPreviewProfile?.bodyId ?? "",
      atlasBodyPreviewProfile?.renderProfile ?? "", atlasCloseupSolarBackdropProfile, atlasCloseupPlanetReadabilityProfile, atlasCloseupReviewMode,
      atlasCloseupPresentationTruthSummary.trustedBoundary, selectedBodyCloseupActive ? "pending" : "false",
    ],
    experience: [
      "", "", "", orbitAtlas ? "orbit-atlas-v11-sandbox-oblique" : undefined,
      orbitAtlas ? presentation.renderBudget === "balanced" ? ORBIT_ATLAS_BALANCED_VISIBLE_ORBIT_COUNT : ORBIT_ATLAS_DENSE_VISIBLE_ORBIT_COUNT : undefined,
      orbitAtlas ? String(canvasReady) : undefined, orbitAtlas ? String(skyReady) : undefined, orbitAtlas ? String(coreBodiesReady) : undefined,
      orbitAtlas ? String(atlasReadinessFallback) : undefined, orbitAtlas ? ORBIT_ATLAS_ORBIT_RENDERER : undefined,
      orbitAtlas ? gaiaCatalogSource : undefined, CELESTIAL_CATALOG_VERSION, celestialCatalogSummary.entryCount, selectedCelestialCatalogId,
      celestialCatalogLayerState, CELESTIAL_DEEP_SKY_NAVIGATION_VERSION, celestialVisualLayerSummary.selectedId,
      celestialVisualLayerSummary.selectedKind, celestialVisualLayerSummary.labelCount, celestialVisualLayerSummary.catalogCount,
      celestialVisualLayerSummary.layerState, ATLAS_PERFORMANCE_BUDGET_VERSION, atlasPerformanceBudgetSummary.tier,
      atlasPerformanceBudgetSummary.renderStability, atlasPerformanceBudgetSummary.recommendationCount,
      atlasPerformanceBudgetSummary.deepSkyLabelBudget, atlasPerformanceBudgetSummary.workbenchOpen ? "true" : "false",
      CELESTIAL_OBJECT_PASSPORT_VERSION, celestialObjectPassport ? "true" : "false", celestialObjectPassport?.kind ?? "",
      celestialObjectPassport?.source ?? "", ATLAS_NAVIGATOR_VERSION, atlasNavigatorOpen ? "true" : "false", "isolated-worker-panel", "", "0", "",
      ATLAS_WORKFLOW_VERSION, atlasWorkflowOpen ? "true" : "false", atlasWorkflowSelectedId, atlasWorkflowActiveStepId, ATLAS_MISSION_HUB_VERSION,
      atlasMissionHubOpen ? "true" : "false", atlasMissionHubSummary.current.currentKind, atlasMissionHubSummary.current.currentId,
      atlasMissionHubSummary.recentCount, atlasMissionHubSummary.pinnedCount, ATLAS_MISSION_CAPSULE_VERSION,
      atlasMissionCapsuleRestoreSummary.active ? "true" : "false", atlasMissionCapsuleRestoreSummary.restoredCount,
      atlasMissionCapsuleRestoreSummary.warningCount, ATLAS_SCIENTIFIC_REPORT_VERSION, atlasScientificReportOpen ? "true" : "false",
      atlasScientificReportSummary.sectionCount, atlasScientificReportExportFormat, ATLAS_REPORT_STUDIO_VERSION,
      atlasReportStudioSummary.settings.templateId, atlasReportStudioSummary.includedSectionCount, atlasScientificReportExportFormat,
      ATLAS_VALIDATION_CONSOLE_VERSION, atlasValidationConsoleOpen ? "true" : "false", atlasValidationConsoleSummary.status,
      atlasValidationConsoleSummary.readyCount, atlasValidationConsoleSummary.pendingCount, atlasValidationConsoleSummary.failedCount,
      atlasValidationConsoleSummary.blockerCount, atlasValidationSelectedDomainId, atlasValidationConsoleSummary.releaseGate.version,
      atlasValidationConsoleSummary.releaseGate.status, atlasValidationConsoleSummary.releaseGate.blockerCount,
      atlasValidationConsoleSummary.releaseGate.warningCount, ATLAS_BROWSER_ACCEPTANCE_VERSION, atlasBrowserAcceptanceSummary.command,
      atlasBrowserAcceptanceSummary.runtimeCommandStatus, atlasBrowserAcceptanceSummary.viewportCount, atlasBrowserAcceptanceSummary.trustedBoundary,
      ATLAS_WORKBENCH_ACCESSIBILITY_VERSION, atlasWorkbenchAccessibilitySummary.scope, atlasWorkbenchAccessibilitySummary.standardTarget,
      atlasWorkbenchAccessibilitySummary.surfaceCount,
    ],
    scienceGate: [
      atlasWorkbenchAccessibilitySummary.minimumTargetSizePx, atlasWorkbenchAccessibilitySummary.focusPolicy,
      atlasWorkbenchAccessibilitySummary.motionPolicy, atlasWorkbenchAccessibilitySummary.runtimeAuditStatus,
      atlasWorkbenchAccessibilitySummary.trustedBoundary, ATLAS_CINEMATIC_WORKBENCH_VERSION, atlasCinematicWorkbenchSummary.visualTarget,
      atlasCinematicWorkbenchSummary.qualityTarget, atlasCinematicWorkbenchSummary.aaBoundaryPreserved, atlasCinematicWorkbenchSummary.scenePolicy,
      atlasCinematicWorkbenchSummary.physicsMutation, atlasCinematicWorkbenchSummary.runtimeCertificationStatus,
      atlasCinematicWorkbenchSummary.trustedBoundary, RELATIVITY_OBSERVABLE_ATLAS_VERSION, relativityObservableAtlasSummary.observableCount,
      relativityObservableAtlasSummary.readyCount, relativityObservableAtlasSummary.boundary, RELATIVITY_OBSERVABLE_EXPLAINER_VERSION,
      relativityObservableExplainerSummary.cardCount, relativityObservableExplainerSummary.totalStepCount,
      relativityObservableExplainerSummary.boundary, RELATIVITY_GUIDED_TOUR_VERSION, relativityGuidedTourSummary.workflowId,
      relativityGuidedTourSummary.stepCount, relativityGuidedTourSummary.readyCount, relativityGuidedTourSummary.boundary,
      ATLAS_RELATIVITY_VERIFICATION_VERSION, atlasRelativityVerificationSummary.benchmarkProfile, atlasRelativityVerificationSummary.trustedBoundary,
      atlasRelativityVerificationSummary.weakFieldObservableCount, atlasRelativityVerificationSummary.strongFieldObservableCount,
      atlasRelativityVerificationSummary.numericalHealthMetricCount, atlasRelativityVerificationSummary.kerrKernelId, ATLAS_RELATIVITY_CHART_VERSION,
      atlasRelativityChartSummary.chartProfile, atlasRelativityChartSummary.trustedBoundary, atlasRelativityChartSummary.mercuryCurve.length,
      atlasRelativityChartSummary.kerrIscoBars.length, atlasRelativityChartSummary.hamiltonianDrift.classification,
      ATLAS_PHYSICS_BENCHMARK_GATE_VERSION, atlasPhysicsBenchmarkGateSummary.budgetProfile, atlasPhysicsBenchmarkGateSummary.runtimeStatus,
      atlasPhysicsBenchmarkGateSummary.blockingCount, atlasPhysicsBenchmarkGateSummary.ciCertificationStatus,
      atlasPhysicsBenchmarkGateSummary.trustedBoundary, ATLAS_HORIZONS_GATE_AUDIT_VERSION, atlasHorizonsGateAuditSummary.auditProfile,
      atlasHorizonsGateAuditSummary.status, atlasHorizonsGateAuditSummary.failureClassification, atlasHorizonsGateAuditSummary.trustedBoundary,
      ATLAS_PHYSICS_GATE_SPLIT_VERSION, atlasPhysicsGateSplitSummary.gateSplitProfile, atlasPhysicsGateSplitSummary.productReleaseGateStatus,
      atlasPhysicsGateSplitSummary.scientificHorizonsGateStatus, atlasPhysicsGateSplitSummary.trustedBoundary, ATLAS_RELEASE_READINESS_VERSION,
      atlasReleaseReadinessSummary.readinessProfile, atlasReleaseReadinessSummary.releaseSemantics, atlasReleaseReadinessSummary.trustedBoundary,
      ATLAS_SCIENTIFIC_GATE_PREFLIGHT_VERSION, atlasScientificGatePreflightSummary.preflightProfile, atlasScientificGatePreflightSummary.status,
      atlasScientificGatePreflightSummary.trustedBoundary, ATLAS_HORIZONS_RESIDUAL_DECOMPOSITION_VERSION,
      atlasHorizonsResidualDecompositionSummary.decompositionProfile, atlasHorizonsResidualDecompositionSummary.status,
      atlasHorizonsResidualDecompositionSummary.dominantBodyId, atlasHorizonsResidualDecompositionSummary.trustedBoundary,
      ATLAS_HORIZONS_CANDIDATE_LAB_VERSION, atlasHorizonsCandidateLabSummary.candidateProfile, atlasHorizonsCandidateLabSummary.status,
      atlasHorizonsCandidateLabSummary.candidateCount, atlasHorizonsCandidateLabSummary.trustedBoundary, ATLAS_PLUTO_RESIDUAL_ISOLATION_VERSION,
      atlasPlutoResidualIsolationSummary.isolationProfile, atlasPlutoResidualIsolationSummary.status,
      atlasPlutoResidualIsolationSummary.classification, atlasPlutoResidualIsolationSummary.trustedBoundary,
      ATLAS_OUTER_SYSTEM_FORCE_MODEL_PREFLIGHT_VERSION, atlasOuterSystemForceModelPreflightSummary.preflightProfile,
    ],
    releaseOperations: [
      atlasOuterSystemForceModelPreflightSummary.status, atlasOuterSystemForceModelPreflightSummary.classification,
      atlasOuterSystemForceModelPreflightSummary.trustedBoundary, ATLAS_OUTER_SYSTEM_REFERENCE_ADOPTION_VERSION,
      atlasOuterSystemReferenceAdoptionSummary.adoptionProfile, atlasOuterSystemReferenceAdoptionSummary.status,
      atlasOuterSystemReferenceAdoptionSummary.classification, atlasOuterSystemReferenceAdoptionSummary.trustedBoundary,
      ATLAS_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_VERSION, atlasHorizonsCandidateScientificGateSummary.candidateGateProfile,
      atlasHorizonsCandidateScientificGateSummary.status, atlasHorizonsCandidateScientificGateSummary.classification,
      atlasHorizonsCandidateScientificGateSummary.trustedBoundary, ATLAS_STRICT_HORIZONS_MIGRATION_DRY_RUN_VERSION,
      atlasStrictHorizonsMigrationDryRunSummary.migrationProfile, atlasStrictHorizonsMigrationDryRunSummary.status,
      atlasStrictHorizonsMigrationDryRunSummary.classification, atlasStrictHorizonsMigrationDryRunSummary.trustedBoundary,
      ATLAS_STRICT_HORIZONS_SHADOW_MIGRATION_VERSION, atlasStrictHorizonsShadowMigrationGateSummary.shadowGateProfile,
      atlasStrictHorizonsShadowMigrationGateSummary.status, atlasStrictHorizonsShadowMigrationGateSummary.classification,
      atlasStrictHorizonsShadowMigrationGateSummary.trustedBoundary, ATLAS_DEFAULT_STRICT_HORIZONS_MIGRATION_VERSION,
      atlasDefaultStrictHorizonsMigrationSummary.migrationProfile, atlasDefaultStrictHorizonsMigrationSummary.status,
      atlasDefaultStrictHorizonsMigrationSummary.classification, atlasDefaultStrictHorizonsMigrationSummary.trustedBoundary,
      ATLAS_HORIZONS_PROVENANCE_FREEZE_VERSION, atlasHorizonsProvenanceFreezeSummary.freezeProfile, atlasHorizonsProvenanceFreezeSummary.status,
      atlasHorizonsProvenanceFreezeSummary.classification, atlasHorizonsProvenanceFreezeSummary.trustedBoundary,
      ATLAS_OFFLINE_RUNTIME_BOUNDARY_AUDIT_VERSION, atlasOfflineRuntimeBoundaryAuditSummary.boundaryProfile,
      atlasOfflineRuntimeBoundaryAuditSummary.status, atlasOfflineRuntimeBoundaryAuditSummary.classification,
      atlasOfflineRuntimeBoundaryAuditSummary.trustedBoundary, ATLAS_SCIENTIFIC_GATE_MAINTENANCE_RUNBOOK_VERSION,
      atlasScientificGateMaintenanceRunbookSummary.runbookProfile, atlasScientificGateMaintenanceRunbookSummary.status,
      atlasScientificGateMaintenanceRunbookSummary.classification, atlasScientificGateMaintenanceRunbookSummary.trustedBoundary,
      ATLAS_SCIENTIFIC_GATE_RELEASE_EVIDENCE_VERSION, atlasScientificGateReleaseEvidenceSummary.releaseEvidenceProfile,
      atlasScientificGateReleaseEvidenceSummary.status, atlasScientificGateReleaseEvidenceSummary.classification,
      atlasScientificGateReleaseEvidenceSummary.trustedBoundary, ATLAS_BROWSER_CI_STABILITY_LOCK_VERSION,
      atlasBrowserCiStabilityLockSummary.stabilityProfile, atlasBrowserCiStabilityLockSummary.status,
      atlasBrowserCiStabilityLockSummary.classification, atlasBrowserCiStabilityLockSummary.trustedBoundary,
      ATLAS_RELEASE_ARTIFACT_MANIFEST_LOCK_VERSION, atlasReleaseArtifactManifestLockSummary.artifactManifestProfile,
      atlasReleaseArtifactManifestLockSummary.status, atlasReleaseArtifactManifestLockSummary.classification,
      atlasReleaseArtifactManifestLockSummary.trustedBoundary, ATLAS_FINAL_MAINTENANCE_BASELINE_VERSION,
      atlasFinalMaintenanceBaselineSummary.maintenanceBaselineProfile, atlasFinalMaintenanceBaselineSummary.status,
      atlasFinalMaintenanceBaselineSummary.classification, atlasFinalMaintenanceBaselineSummary.trustedBoundary,
      ATLAS_GAIA_STARFIELD_ENHANCEMENT_VERSION, atlasGaiaStarfieldEnhancementSummary.overlayProfile, atlasGaiaStarfieldEnhancementSummary.status,
      atlasGaiaStarfieldEnhancementSummary.classification, atlasGaiaStarfieldEnhancementSummary.qualityTier,
      atlasGaiaStarfieldEnhancementSummary.activeGaiaRenderBudget, atlasGaiaStarfieldEnhancementSummary.trustedBoundary,
      ATLAS_RELATIVITY_SIMULATION_OPTIMIZATION_VERSION, atlasRelativitySimulationOptimizationSummary.optimizationProfile,
      atlasRelativitySimulationOptimizationSummary.status, atlasRelativitySimulationOptimizationSummary.classification,
      atlasRelativitySimulationOptimizationSummary.kerrKernelId, atlasRelativitySimulationOptimizationSummary.performanceHudPolicy,
      atlasRelativitySimulationOptimizationSummary.trustedBoundary, ATLAS_ART_POLISH_VERSION, atlasArtPolishSummary.artPolishProfile,
      atlasArtPolishSummary.status,
    ],
    browserOperations: [
      atlasArtPolishSummary.classification, atlasArtPolishSummary.opacityCaps.mobile, atlasArtPolishSummary.opacityCaps.dense,
      atlasArtPolishSummary.opacityCaps.closeup, atlasArtPolishSummary.trustedBoundary, ATLAS_POST_ENHANCEMENT_BASELINE_VERSION,
      atlasPostEnhancementMaintenanceBaselineSummary.postEnhancementBaselineProfile, atlasPostEnhancementMaintenanceBaselineSummary.status,
      atlasPostEnhancementMaintenanceBaselineSummary.classification, atlasPostEnhancementMaintenanceBaselineSummary.gaiaRenderBudget.mobile,
      atlasPostEnhancementMaintenanceBaselineSummary.artOpacityCaps.closeup, atlasPostEnhancementMaintenanceBaselineSummary.trustedBoundary,
      ATLAS_BROWSER_RESOURCE_PERFORMANCE_VERSION, atlasBrowserResourcePerformanceSummary.browserResourcePerformanceProfile,
      atlasBrowserResourcePerformanceSummary.status, atlasBrowserResourcePerformanceSummary.classification,
      atlasBrowserResourcePerformanceSummary.pixelSamplerPolicy, atlasBrowserResourcePerformanceSummary.freshTeardownPolicy,
      atlasBrowserResourcePerformanceSummary.trustedBoundary, ATLAS_MAINTENANCE_EVIDENCE_INDEX_VERSION,
      atlasMaintenanceEvidenceIndexSummary.maintenanceEvidenceIndexProfile, atlasMaintenanceEvidenceIndexSummary.status,
      atlasMaintenanceEvidenceIndexSummary.classification, atlasMaintenanceEvidenceIndexSummary.dirtyWorktreePolicy,
      atlasMaintenanceEvidenceIndexSummary.watchpackNoisePolicy, atlasMaintenanceEvidenceIndexSummary.browserQaPolicy,
      atlasMaintenanceEvidenceIndexSummary.trustedBoundary, ATLAS_PRESENTATION_RUNTIME_PERFORMANCE_VERSION,
      atlasPresentationRuntimePerformanceSummary.presentationRuntimePerformanceProfile, atlasPresentationRuntimePerformanceSummary.status,
      atlasPresentationRuntimePerformanceSummary.classification, atlasPresentationRuntimePerformanceSummary.gaiaRuntimePolicy,
      atlasPresentationRuntimePerformanceSummary.constellationRuntimePolicy, atlasPresentationRuntimePerformanceSummary.labelRuntimePolicy,
      atlasPresentationRuntimePerformanceSummary.budgetThresholdPolicy, atlasPresentationRuntimePerformanceSummary.trustedBoundary,
      ATLAS_BROWSER_ACCEPTANCE_RUNTIME_COST_VERSION, atlasBrowserAcceptanceRuntimeCostSummary.browserAcceptanceRuntimeCostProfile,
      atlasBrowserAcceptanceRuntimeCostSummary.status, atlasBrowserAcceptanceRuntimeCostSummary.classification,
      atlasBrowserAcceptanceRuntimeCostSummary.screenshotManifestPolicy, atlasBrowserAcceptanceRuntimeCostSummary.markerCoveragePolicy,
      atlasBrowserAcceptanceRuntimeCostSummary.consoleErrorPolicy, atlasBrowserAcceptanceRuntimeCostSummary.trustedBoundary,
      ATLAS_FINAL_GAIA_ART_ENHANCEMENT_VERSION, atlasFinalGaiaArtEnhancementSummary.finalGaiaArtEnhancementProfile,
      atlasFinalGaiaArtEnhancementSummary.status, atlasFinalGaiaArtEnhancementSummary.classification,
      atlasFinalGaiaArtEnhancementSummary.gaiaSelectionPolicy, atlasFinalGaiaArtEnhancementSummary.gaiaVisualMappingPolicy,
      atlasFinalGaiaArtEnhancementSummary.browserQaPolicy, atlasFinalGaiaArtEnhancementSummary.trustedBoundary, ATLAS_RC_EVIDENCE_CLOSURE_VERSION,
      atlasRcEvidenceClosureSummary.rcEvidenceClosureProfile, atlasRcEvidenceClosureSummary.status, atlasRcEvidenceClosureSummary.classification,
      atlasRcEvidenceClosureSummary.commandMatrixPolicy, atlasRcEvidenceClosureSummary.artifactIndexPolicy,
      atlasRcEvidenceClosureSummary.dirtyWorktreePolicy, atlasRcEvidenceClosureSummary.watchpackNoisePolicy,
      atlasRcEvidenceClosureSummary.trustedBoundary, ATLAS_INTERACTION_CATALOG_COMPLETION_VERSION, atlasInteractionCatalogCompletionSummary.profile,
      atlasInteractionCatalogCompletionSummary.status, atlasInteractionCatalogCompletionSummary.classification,
      atlasInteractionCatalogCompletionSummary.cameraPolicy, atlasInteractionCatalogCompletionSummary.gaiaLabelPolicy,
      atlasInteractionCatalogCompletionSummary.trustedBoundary, ATLAS_INTERACTION_REPAIR_LAUNCH_UX_VERSION,
      atlasInteractionRepairLaunchUxSummary.profile, atlasInteractionRepairLaunchUxSummary.status,
      atlasInteractionRepairLaunchUxSummary.classification, atlasInteractionRepairLaunchUxSummary.skyTargetPolicy,
      atlasInteractionRepairLaunchUxSummary.launchUxPolicy, atlasInteractionRepairLaunchUxSummary.trustedBoundary,
      ATLAS_INTERACTION_VISUAL_QUALITY_VERSION, atlasInteractionVisualQualitySummary.profile, atlasInteractionVisualQualitySummary.status,
      atlasInteractionVisualQualitySummary.classification, atlasInteractionVisualQualitySummary.cameraFreedomPolicy,
    ],
    interactionRuntime: [
      atlasInteractionVisualQualitySummary.launchVisualPolicy, atlasInteractionVisualQualitySummary.stellarMaterialPolicy,
      atlasInteractionVisualQualitySummary.trustedBoundary, ATLAS_CRITICAL_UI_RELATIVITY_VISIBILITY_VERSION,
      atlasCriticalUiRelativityVisibilitySummary.profile, atlasCriticalUiRelativityVisibilitySummary.status,
      atlasCriticalUiRelativityVisibilitySummary.classification, atlasCriticalUiRelativityVisibilitySummary.uiCopyPolicy,
      atlasCriticalUiRelativityVisibilitySummary.relativityCoreEntryPolicy, atlasCriticalUiRelativityVisibilitySummary.relativityReadoutPolicy,
      atlasCriticalUiRelativityVisibilitySummary.trustedBoundary, ATLAS_CAMERA_STELLAR_CLOSEUP_VERSION, atlasCameraStellarCloseupSummary.profile,
      atlasCameraStellarCloseupSummary.status, atlasCameraStellarCloseupSummary.classification, atlasCameraStellarCloseupSummary.cameraRigPolicy,
      atlasCameraStellarCloseupSummary.stellarPortraitPolicy, atlasCameraStellarCloseupSummary.closeupPerformancePolicy,
      atlasCameraStellarCloseupSummary.trustedBoundary, ATLAS_LAUNCH_GAMEPLAY_OPENROCKET_BRIDGE_VERSION,
      atlasLaunchGameplayOpenRocketBridgeSummary.profile, atlasLaunchGameplayOpenRocketBridgeSummary.status,
      atlasLaunchGameplayOpenRocketBridgeSummary.classification, atlasLaunchGameplayOpenRocketBridgeSummary.launchScenePolicy,
      atlasLaunchGameplayOpenRocketBridgeSummary.openRocketBridgePolicy, atlasLaunchGameplayOpenRocketBridgeSummary.browserExeLaunch,
      atlasLaunchGameplayOpenRocketBridgeSummary.trustedBoundary, ATLAS_SCIENTIFIC_MODEL_UPGRADE_CONTRACT_VERSION,
      atlasScientificModelUpgradeContractSummary.profile, atlasScientificModelUpgradeContractSummary.status,
      atlasScientificModelUpgradeContractSummary.scientificUpgradePolicy, atlasScientificModelUpgradeContractSummary.fixturePolicy,
      atlasScientificModelUpgradeContractSummary.rollbackPolicy, atlasScientificModelUpgradeContractSummary.trustedBoundary,
      ATLAS_VISUAL_LAUNCH_PERFORMANCE_VERSION, atlasVisualLaunchPerformanceSummary.profile, atlasVisualLaunchPerformanceSummary.status,
      atlasVisualLaunchPerformanceSummary.classification, atlasVisualLaunchPerformanceSummary.qualityTier,
      atlasVisualLaunchPerformanceSummary.launchDirectorPolicy, atlasVisualLaunchPerformanceSummary.runtimeQualityPolicy,
      atlasVisualLaunchPerformanceSummary.openRocketBridgePolicy, atlasVisualLaunchPerformanceSummary.browserExeLaunch,
      atlasVisualLaunchPerformanceSummary.trustedBoundary, ATLAS_RUNTIME_SCENE_FOCUS_PERFORMANCE_VERSION, atlasRuntimeSceneFocusSummary.profile,
      atlasRuntimeSceneFocusSummary.status, atlasSceneMode, "v120-rendering-foundation-exposure-control", "v121-named-stellar-catalog-v3",
      "v122-stellar-planetary-material-renaissance", "v123-exoplanet-systems-orbit-director", atlasVisualIntegrationV2Summary.version,
      atlasVisualIntegrationV2Summary.profile, atlasVisualIntegrationV2Summary.reviewScenes.length, atlasVisualIntegrationV2Summary.boundary,
      atlasScientificPromotionV2Summary.catalogVersion, atlasScientificPromotionV2Summary.stellarArtVersion,
      atlasScientificPromotionV2Summary.exoplanetVersion, atlasScientificPromotionV2Summary.relativityVersion,
      atlasScientificPromotionV2Summary.kerrVersion, atlasScientificPromotionV2Summary.version, atlasScientificPromotionV2Summary.promotionDecision,
      atlasScientificPromotionV2Summary.defaultRelativityKernel, atlasScientificPromotionV2Summary.shadowKernel,
      atlasScientificPromotionV2Summary.runtimeBoundary, atlasRuntimeSceneFocusSummary.sceneIsolationPolicy,
      atlasRuntimeSceneFocusSummary.telemetryPolicy, atlasRuntimeSceneFocusSummary.cameraFocusPolicy, atlasRuntimeSceneFocusSummary.markerPolicy,
      atlasRuntimeSceneFocusSummary.hiddenDomPolicy, atlasRuntimeSceneFocusSummary.r3fPropsPolicy, atlasRuntimeSceneFocusSummary.trustedBoundary,
      ATLAS_OFFLINE_STELLAR_SEARCH_CATALOG_V2_VERSION, atlasOfflineStellarSearchCatalogV2Summary.profile, "isolated-panel-runtime",
      atlasOfflineStellarSearchCatalogV2Summary.searchRowCount, atlasOfflineStellarSearchCatalogV2Summary.renderRowCount,
      atlasOfflineStellarSearchCatalogV2Summary.shardCount, atlasOfflineStellarSearchCatalogV2Summary.runtimePolicy,
    ],
    modernRuntime: [
      atlasOfflineStellarSearchCatalogV2Summary.trustedBoundary, ATLAS_SCIENTIFIC_CINEMATIC_ART_VERSION, atlasScientificCinematicArtSummary.profile,
      atlasScientificCinematicArtSummary.portraitMaterial, atlasScientificCinematicArtSummary.derivation,
      atlasScientificCinematicArtSummary.trustedBoundary, ATLAS_LAUNCH_SCENE_OPENROCKET_REPLAY_VERSION,
      atlasLaunchSceneOpenRocketReplaySummary.profile, atlasLaunchSceneOpenRocketReplaySummary.hudPolicy,
      atlasLaunchSceneOpenRocketReplaySummary.assetPolicy, atlasLaunchSceneOpenRocketReplaySummary.browserExeLaunch,
      atlasLaunchSceneOpenRocketReplaySummary.trustedBoundary, ATLAS_VISUAL_INTEGRATION_RELEASE_VERSION,
      atlasVisualIntegrationReleaseSummary.profile, atlasVisualIntegrationReleaseSummary.status,
      atlasVisualIntegrationReleaseSummary.reviewScenes.join(","),
      localLaunchActive ? "leo-liftoff" : selectedCelestialCatalogId.includes("sirius") ? "sirius" : selectedCelestialCatalogId.includes("betelgeuse") ? "betelgeuse" : selectedCelestialCatalogId.startsWith("gaia-dr3:") ? "gaia-id" : selectedBodyIndex === 5 ? "jupiter" : selectedBodyIndex === 6 ? "saturn" : "earth",
      "fixed-overlay-safe-area-no-panel-overlap", "closeup-35-55-percent", atlasVisualIntegrationReleaseSummary.trustedBoundary,
      ATLAS_OBSERVATORY_DECK_VERSION, atlasObservatoryDeckOpen ? "true" : "false", atlasObservatoryDeckSummary.zoneCount,
      atlasObservatoryActiveZoneId, atlasObservatoryDeckSummary.currentKind, atlasObservatoryDeckSummary.currentId,
      atlasObservatoryDeckSummary.readinessStatus, ATLAS_INSTRUMENT_UI_VERSION,
      viewSettings.showKerrBlackHole ? KERR_GEODESIC_VISUALIZATION_ID : undefined,
      viewSettings.showKerrBlackHole ? KERR_RELATIVITY_LAB_VERSION : undefined, viewSettings.showKerrBlackHole ? kerrTrackSet.trackCount : undefined,
      viewSettings.showKerrBlackHole ? kerrBlackHole.renderMode : undefined,
      viewSettings.showKerrBlackHole ? kerrBlackHole.orbitPresetId : undefined,
      viewSettings.showKerrBlackHole ? kerrBlackHole.impactParameterM.toFixed(2) : undefined,
      viewSettings.showKerrBlackHole ? kerrTrackSet.probe.probeStatus : undefined,
      viewSettings.showKerrBlackHole ? KERR_RELATIVITY_STUDIO_VERSION : undefined,
      viewSettings.showKerrBlackHole ? kerrStudioSummary.mode : undefined, viewSettings.showKerrBlackHole ? kerrStudioSummary.presetId : undefined,
      viewSettings.showKerrBlackHole ? kerrStudioSummary.probeStatus : undefined,
      viewSettings.showKerrBlackHole ? kerrStudioSummary.iscoSplitM.toFixed(3) : undefined,
      viewSettings.showKerrBlackHole ? kerrStudioSummary.maxHamiltonianDrift.toExponential(1) : undefined,
      viewSettings.showKerrBlackHole ? kerrStudioSummary.boundary : undefined,
      orbitAtlas && presentation.scaleMode === "compressed" ? "logarithmic-radial" : "physical",
    ],
  });
  return evidenceViewModel.rootAttributes;
}

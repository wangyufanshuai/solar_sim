/**
 * Generated root-contract compatibility snapshot for historical release evidence.
 * Full panel details live in atlasLegacyEvidenceDetailsV190 and load on intent.
 * Rebuild with: npx tsx scripts/split-atlas-legacy-evidence-v190.ts
 */

export const ATLAS_ART_POLISH_VERSION = "v99-art-polish" as const;
export const ATLAS_BROWSER_ACCEPTANCE_RUNTIME_COST_VERSION = "v104-browser-acceptance-runtime-cost-lock" as const;
export const ATLAS_BROWSER_CI_STABILITY_LOCK_VERSION = "v94-browser-ci-stability-lock" as const;
export const ATLAS_BROWSER_RESOURCE_PERFORMANCE_VERSION = "v101-browser-resource-performance-lock" as const;
export const ATLAS_CAMERA_STELLAR_CLOSEUP_VERSION = "v111-camera-stellar-closeup-lock" as const;
export const ATLAS_CRITICAL_UI_RELATIVITY_VISIBILITY_VERSION = "v110-critical-ui-relativity-visibility-lock" as const;
export const ATLAS_DEFAULT_STRICT_HORIZONS_MIGRATION_VERSION = "v89-default-strict-horizons-scientific-gate-migration" as const;
export const ATLAS_FINAL_GAIA_ART_ENHANCEMENT_VERSION = "v105-final-gaia-art-enhancement-lock" as const;
export const ATLAS_FINAL_MAINTENANCE_BASELINE_VERSION = "v96-final-maintenance-baseline" as const;
export const ATLAS_HORIZONS_CANDIDATE_LAB_VERSION = "v82-horizons-dynamical-parameter-candidate-lab" as const;
export const ATLAS_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_VERSION = "v86-horizons-candidate-scientific-gate" as const;
export const ATLAS_HORIZONS_PROVENANCE_FREEZE_VERSION = "v90-horizons-provenance-freeze" as const;
export const ATLAS_INTERACTION_CATALOG_COMPLETION_VERSION = "v107-interaction-catalog-completion-lock" as const;
export const ATLAS_INTERACTION_REPAIR_LAUNCH_UX_VERSION = "v108-interaction-repair-launch-ux-lock" as const;
export const ATLAS_INTERACTION_VISUAL_QUALITY_VERSION = "v109-interaction-visual-quality-lock" as const;
export const ATLAS_LAUNCH_GAMEPLAY_OPENROCKET_BRIDGE_VERSION = "v112-launch-gameplay-openrocket-bridge-lock" as const;
export const ATLAS_MAINTENANCE_EVIDENCE_INDEX_VERSION = "v102-maintenance-evidence-index" as const;
export const ATLAS_OFFLINE_RUNTIME_BOUNDARY_AUDIT_VERSION = "v91-offline-runtime-boundary-audit" as const;
export const ATLAS_OUTER_SYSTEM_FORCE_MODEL_PREFLIGHT_VERSION = "v84-outer-system-force-model-preflight" as const;
export const ATLAS_OUTER_SYSTEM_REFERENCE_ADOPTION_VERSION = "v85-outer-system-reference-adoption-preflight" as const;
export const ATLAS_PLUTO_RESIDUAL_ISOLATION_VERSION = "v83-pluto-residual-cause-isolation" as const;
export const ATLAS_POST_ENHANCEMENT_BASELINE_VERSION = "v100-post-enhancement-maintenance-baseline" as const;
export const ATLAS_PRESENTATION_RUNTIME_PERFORMANCE_VERSION = "v103-presentation-runtime-performance-lock" as const;
export const ATLAS_RC_EVIDENCE_CLOSURE_VERSION = "v106-release-candidate-evidence-closure-lock" as const;
export const ATLAS_RELEASE_ARTIFACT_MANIFEST_LOCK_VERSION = "v95-release-artifact-manifest-lock" as const;
export const ATLAS_SCIENTIFIC_GATE_MAINTENANCE_RUNBOOK_VERSION = "v92-scientific-gate-maintenance-runbook-lock" as const;
export const ATLAS_SCIENTIFIC_GATE_RELEASE_EVIDENCE_VERSION = "v93-scientific-gate-release-evidence-lock" as const;
export const ATLAS_SCIENTIFIC_MODEL_UPGRADE_CONTRACT_VERSION = "v113-scientific-model-upgrade-contract" as const;
export const ATLAS_STRICT_HORIZONS_MIGRATION_DRY_RUN_VERSION = "v87-strict-horizons-migration-dry-run" as const;
export const ATLAS_STRICT_HORIZONS_SHADOW_MIGRATION_VERSION = "v88-strict-horizons-shadow-migration-gate" as const;

export const STATIC_LEGACY_RELEASE_SUMMARIES_V177 = {
  "atlasHorizonsCandidateLabSummary": {
    "candidateProfile": "v82-de440-gm-softening-step-hierarchy-matrix",
    "status": "pending-offline-run",
    "candidateCount": 5,
    "trustedBoundary": "Local v82 candidate lab over offline Horizons fixtures, DE440 gravitational parameters, softening and fixed-step variants. Candidate rows are diagnostics only: they do not relax v75 budgets, do not close the strict scientific gate, do not mutate SolarSystemIntegrator, physicsEngine defaults, worker physics, RK4, EIH 1PN, Kerr, materials, backgrounds, sky assets or runtime product/scientific gate semantics."
  },
  "atlasPlutoResidualIsolationSummary": {
    "isolationProfile": "v83-outer-system-phase-force-model-matrix",
    "status": "pending-runtime-run",
    "classification": "not-isolated",
    "trustedBoundary": "Local v83 Pluto and outer-solar-system residual isolation over offline Horizons candidate runs. This is diagnostic attribution only: it does not relax v75 budgets, claim NASA/JPL scientific certification, close the strict Horizons gate, mutate SolarSystemIntegrator, physicsEngine defaults, worker physics, RK4, EIH 1PN, Kerr, materials, backgrounds, sky assets or product/scientific gate semantics."
  },
  "atlasOuterSystemForceModelPreflightSummary": {
    "preflightProfile": "v84-pluto-barycenter-tno-force-model-upgrade-path",
    "status": "pending-runtime-run",
    "classification": "not-enough-evidence",
    "trustedBoundary": "Local v84 outer-system force-model preflight over offline Horizons fixtures and non-applied candidate rows. This audits fixture provenance before interpreting Pluto or outer-solar-system residuals. It does not relax v75 budgets, claim NASA/JPL scientific certification, close the strict Horizons gate, mutate SolarSystemIntegrator, physicsEngine defaults, worker physics, RK4, EIH 1PN, Kerr, materials, backgrounds, sky assets or product/scientific gate semantics."
  },
  "atlasOuterSystemReferenceAdoptionSummary": {
    "adoptionProfile": "v85-barycentric-fixture-adoption-readiness",
    "status": "pending-runtime-run",
    "classification": "mixed",
    "trustedBoundary": "Local v85 reference-adoption preflight over the existing v84 outer-system barycenter fixture and DE440 system GM candidate path. This proves migration readiness only: it does not replace the v75 strict fixture, relax budgets, close the strict Horizons scientific gate, claim NASA/JPL certification, mutate SolarSystemIntegrator, physicsEngine defaults, worker physics, RK4, EIH 1PN, Kerr, materials, backgrounds, sky assets or product/scientific gate semantics."
  },
  "atlasHorizonsCandidateScientificGateSummary": {
    "candidateGateProfile": "v86-barycentric-reference-candidate-gate",
    "status": "pending-runtime-run",
    "classification": "mixed",
    "trustedBoundary": "Local v86 candidate scientific gate over the v85 adoption path. This proves only that the v84 outer-system barycenter fixture plus DE440 system GM candidate can satisfy the v75 numerical budget as an unapplied candidate; it does not migrate the default strict Horizons gate, replace the v75 fixture, relax budgets, claim NASA/JPL certification, mutate SolarSystemIntegrator, physicsEngine defaults, worker physics, RK4, EIH 1PN, Kerr, materials, backgrounds, sky assets or product/scientific gate semantics."
  },
  "atlasStrictHorizonsMigrationDryRunSummary": {
    "migrationProfile": "v87-default-gate-migration-diff-audit",
    "status": "pending-runtime-run",
    "classification": "mixed",
    "trustedBoundary": "Local v87 dry-run audit for a future strict Horizons migration. It records the exact non-applied diff from the current v75 strict fixture and command to the v86 passing candidate path, but it does not migrate the default strict gate, replace fixtures, relax budgets, claim NASA/JPL certification, mutate SolarSystemIntegrator, physicsEngine defaults, worker physics, RK4, EIH 1PN, Kerr, materials, backgrounds, sky assets, screenshots or product/scientific gate semantics."
  },
  "atlasStrictHorizonsShadowMigrationGateSummary": {
    "shadowGateProfile": "v88-parallel-default-gate-rehearsal",
    "status": "pending-runtime-run",
    "classification": "mixed",
    "trustedBoundary": "Local v88 shadow strict Horizons gate rehearsal. It runs the future migrated strict-gate configuration as a separate non-applied command over the v87 migration dry-run manifest, but it does not replace the default strict scientific gate, relax v75 budgets, claim NASA/JPL certification, mutate SolarSystemIntegrator, physicsEngine defaults, worker physics, RK4, EIH 1PN, Kerr, materials, backgrounds, sky assets or product/scientific gate semantics."
  },
  "atlasDefaultStrictHorizonsMigrationSummary": {
    "migrationProfile": "v89-apply-barycentric-reference-default-gate",
    "status": "pending-runtime-run",
    "classification": "mixed",
    "trustedBoundary": "Local v89 migration of the offline strict Horizons scientific gate from the legacy v75 center-reference fixture to the v88 shadow-proven barycentric reference fixture. This applies only to the default offline scientific gate command; it does not mutate live runtime physics, SolarSystemIntegrator, physicsEngine defaults, worker physics, RK4 runtime defaults, EIH 1PN, Kerr, materials, backgrounds, sky assets, v75 budgets, or claim NASA/JPL certification."
  },
  "atlasHorizonsProvenanceFreezeSummary": {
    "freezeProfile": "v90-default-gate-command-fixture-hash-lock",
    "status": "pending-runtime-run",
    "classification": "mixed",
    "trustedBoundary": "Local v90 freeze of the v89 offline strict Horizons scientific gate contract. It locks command ownership, v84/v75 fixture hashes, v75 budgets, legacy blocker evidence and offline-only scope; it does not mutate live runtime physics, worker physics, RK4 runtime defaults, EIH 1PN, Kerr, materials, backgrounds, sky assets, or claim NASA/JPL certification."
  },
  "atlasOfflineRuntimeBoundaryAuditSummary": {
    "boundaryProfile": "v91-scientific-gate-runtime-boundary-lock",
    "status": "pending-runtime-run",
    "classification": "mixed",
    "trustedBoundary": "Local v91 audit that keeps the v89/v90 migrated and frozen offline strict Horizons scientific gate separate from live runtime physics. It does not mutate SolarSystemIntegrator, physicsEngine defaults, worker physics, RK4 runtime defaults, EIH 1PN, Kerr, materials, backgrounds, sky assets, fixture data, v75 budgets, or claim NASA/JPL certification."
  },
  "atlasScientificGateMaintenanceRunbookSummary": {
    "runbookProfile": "v92-offline-gate-release-rollback-command-runbook",
    "status": "pending-runtime-run",
    "classification": "mixed",
    "trustedBoundary": "Local v92 maintenance runbook lock for the migrated and frozen offline strict Horizons scientific gate. It locks product verification, scientific verification, migrated strict gate, legacy v75 rollback audit, provenance freeze and offline/runtime boundary commands; it does not mutate live runtime physics, worker physics, RK4 runtime defaults, EIH 1PN, Kerr, materials, backgrounds, sky assets, fixture data, v75 budgets, or claim NASA/JPL certification."
  },
  "atlasScientificGateReleaseEvidenceSummary": {
    "releaseEvidenceProfile": "v93-offline-gate-release-evidence-bundle",
    "status": "pending-runtime-run",
    "classification": "mixed",
    "trustedBoundary": "Local v93 release evidence bundle lock for the migrated, frozen and maintained offline strict Horizons scientific gate. It locks release verification, scientific verification, runbook, provenance freeze, offline/runtime boundary, migrated strict gate and legacy v75 audit evidence; it does not mutate live runtime physics, worker physics, RK4 runtime defaults, EIH 1PN, Kerr, materials, backgrounds, sky assets, fixture data, v75 budgets, or claim NASA/JPL certification."
  },
  "atlasBrowserCiStabilityLockSummary": {
    "stabilityProfile": "v94-fresh-browser-ci-runtime-stability",
    "status": "pending-runtime-run",
    "classification": "mixed",
    "trustedBoundary": "Local v94 browser and CI stability lock for fresh Playwright acceptance, screenshot retry, pixel settle sampling, fresh server teardown, command ownership and known Windows Watchpack noise. It does not mutate live runtime physics, worker physics, RK4 runtime defaults, EIH 1PN, Kerr, materials, backgrounds, sky assets, fixture data, v75 budgets, default scientific gate configuration, or claim NASA/JPL certification."
  },
  "atlasReleaseArtifactManifestLockSummary": {
    "artifactManifestProfile": "v95-offline-release-artifact-manifest",
    "status": "pending-runtime-run",
    "classification": "mixed",
    "trustedBoundary": "Local v95 release artifact manifest lock over the v93 scientific release evidence and v94 browser CI stability evidence. It indexes command matrix, fixture hashes, browser artifact paths, documentation boundaries, rollback interpretation and protected mutation flags; it does not create release archives, mutate live runtime physics, worker physics, RK4 runtime defaults, EIH 1PN, Kerr, materials, backgrounds, sky assets, fixture data, v75 budgets, default scientific gate configuration, or claim NASA/JPL certification."
  },
  "atlasFinalMaintenanceBaselineSummary": {
    "maintenanceBaselineProfile": "v96-final-offline-maintenance-baseline",
    "status": "pending-runtime-run",
    "classification": "mixed",
    "trustedBoundary": "Local v96 final maintenance baseline lock for the offline Orbit Atlas verification and scientific gate evidence chain. It locks verify:atlas:full, verify:atlas:scientific, v90-v95 maintenance evidence, legacy v75 rollback evidence and the post-v96 rule that scientific mainline changes require an intentional fixture/model upgrade or true live physics migration; it does not mutate live runtime physics, worker physics, RK4 runtime defaults, EIH 1PN, Kerr, materials, backgrounds, sky assets, fixture data, v75 budgets, default scientific gate configuration, release packaging, or claim NASA/JPL certification."
  },
  "atlasArtPolishSummary": {
    "artPolishProfile": "v99-gaia-overlay-closeup-presentation-polish",
    "status": "pending-runtime-run",
    "classification": "mixed",
    "opacityCaps": {
      "mobile": 0.62,
      "balanced": 1.05,
      "dense": 1.2,
      "closeup": 0.18
    },
    "trustedBoundary": "Local v99 presentation-only art polish over the v97 Gaia overlay and v98 relativity observability baseline. It improves visible Gaia star layering, constellation line restraint, nebula marker readability, selected-body closeup readability and mobile density while preserving the v97 Gaia render budgets, ORBIT_ATLAS_SKY === ORBIT_ATLAS_V9_SKY, GalaxyEnvironmentSphere legacy V9 background direction, live runtime physics, worker physics, RK4/DP, EIH 1PN, Kerr kernel id, Horizons fixtures, v75 budgets, materials, release packaging and certification boundaries."
  },
  "atlasPostEnhancementMaintenanceBaselineSummary": {
    "postEnhancementBaselineProfile": "v100-v97-v99-visual-teaching-maintenance-lock",
    "status": "pending-runtime-run",
    "classification": "mixed",
    "gaiaRenderBudget": {
      "mobile": 1000,
      "balanced": 1800,
      "dense": 3000
    },
    "artOpacityCaps": {
      "mobile": 0.62,
      "balanced": 1.05,
      "dense": 1.2,
      "closeup": 0.18
    },
    "trustedBoundary": "Local v100 post-enhancement maintenance baseline over the immutable v96 final baseline, v97 Gaia overlay, v98 teaching observability layer and v99 presentation-only art polish. It freezes evidence, entrypoints, browser resource policies, Gaia budgets, v99 opacity caps, 88 IAU constellation scope, curated nebula marker boundaries and protected mutation flags without performance optimization, release archive creation, fixture generation, scientific model upgrade, live physics mutation, worker physics mutation, RK4/DP mutation, EIH 1PN mutation, Kerr kernel mutation, Horizons fixture mutation, v75 budget mutation, V9 sky/background mutation or historical v95/v96 contract rewrite."
  },
  "atlasBrowserResourcePerformanceSummary": {
    "browserResourcePerformanceProfile": "v101-fresh-browser-resource-performance",
    "status": "pending-runtime-run",
    "classification": "mixed",
    "pixelSamplerPolicy": "shared-imagebitmap-canvas-sampler-explicit-close-and-zero",
    "freshTeardownPolicy": "fresh-3015-global-teardown-no-reuse-existing-server",
    "trustedBoundary": "Local v101 browser resource performance stability lock over v100. It applies only a browser acceptance helper resource optimization for shared ImageBitmap/canvas screenshot pixel sampling, explicit bitmap close, canvas zeroing, fresh 3015 teardown and console/page-error observability. It does not change scientific gates, fixtures, live runtime physics, worker physics, RK4/DP, EIH 1PN, Kerr kernel id, V9 sky/background, v97 Gaia budgets, v99 opacity caps, screenshot thresholds, screenshot retry count, pixel settle attempts, release packaging or official certification claims."
  },
  "atlasMaintenanceEvidenceIndexSummary": {
    "maintenanceEvidenceIndexProfile": "v102-v93-v101-maintenance-evidence-index",
    "status": "pending-runtime-run",
    "classification": "mixed",
    "dirtyWorktreePolicy": "no-reset-no-revert-no-clean-no-stage-no-commit",
    "watchpackNoisePolicy": "dumpstack-pagefile-known-non-failure-noise",
    "browserQaPolicy": "root-observable-evidence-validation-console-errors-zero-teardown-clear",
    "trustedBoundary": "Local v102 maintenance evidence index over v93-v101. It indexes command evidence, browser screenshot artifact directories, Browser QA result policy, dirty worktree hygiene and Windows Watchpack DumpStack.log.tmp/pagefile.sys known non-failure noise without cleaning, resetting, reverting, staging, committing, release packaging, scientific gate mutation, fixture mutation, runtime physics mutation, worker physics mutation, RK4/DP mutation, EIH 1PN mutation, Kerr mutation, V9 sky/background mutation, v97 Gaia budget mutation or v99 opacity cap mutation."
  },
  "atlasPresentationRuntimePerformanceSummary": {
    "presentationRuntimePerformanceProfile": "v103-gaia-constellation-label-runtime-cost",
    "status": "pending-runtime-run",
    "classification": "mixed",
    "gaiaRuntimePolicy": "gaia-uniform-write-dedupe-static-instance-attributes",
    "constellationRuntimePolicy": "constellation-frame-signature-material-write-dedupe",
    "labelRuntimePolicy": "label-dom-visible-style-write-dedupe",
    "budgetThresholdPolicy": "v97-v99-v75-browser-thresholds-preserved",
    "trustedBoundary": "Local v103 presentation runtime performance lock over v102. It only reduces per-frame presentation-layer write pressure for Gaia, constellation and label surfaces while preserving v97 Gaia render budgets, v99 opacity caps, v75 budgets, browser screenshot thresholds, pixel settle/retry policy, scientific gates, fixtures, live runtime physics, worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background direction, browser QA cost policy, release packaging and certification boundaries."
  },
  "atlasBrowserAcceptanceRuntimeCostSummary": {
    "browserAcceptanceRuntimeCostProfile": "v104-fresh-browser-acceptance-cost-review",
    "status": "pending-runtime-run",
    "classification": "mixed",
    "screenshotManifestPolicy": "default-current-plus-core-full-review-history",
    "markerCoveragePolicy": "root-observable-evidence-validation-preserved",
    "consoleErrorPolicy": "console-page-error-zero-preserved",
    "trustedBoundary": "Local v104 browser acceptance runtime cost lock over v103. It only splits browser acceptance screenshot capture into a default current/core manifest and an opt-in full historical review manifest while preserving desktop/mobile fresh acceptance, root/Observable/Evidence/Validation marker coverage, console/page-error checks, 3015 teardown, screenshot retry, pixel settle, browser pixel thresholds, scientific gates, fixtures, live runtime physics, worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background direction, v97 Gaia budgets, v99 opacity caps, release packaging and certification boundaries."
  },
  "atlasFinalGaiaArtEnhancementSummary": {
    "finalGaiaArtEnhancementProfile": "v105-budget-preserved-gaia-art-polish",
    "status": "pending-runtime-run",
    "classification": "mixed",
    "gaiaSelectionPolicy": "deterministic-bright-near-color-spread-sky-binned",
    "gaiaVisualMappingPolicy": "budget-preserved-brightness-color-temperature-layering",
    "browserQaPolicy": "root-observable-evidence-validation-v105-markers",
    "trustedBoundary": "Local v105 budget-preserved Gaia art enhancement over v104. It improves deterministic Gaia star selection, Gaia brightness/color layering, constellation readability and nebula presentation while preserving v97 Gaia render budgets, v99 opacity caps, browser pixel thresholds, scientific gates, fixtures, live runtime physics, worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background direction, release packaging and official certification boundaries."
  },
  "atlasRcEvidenceClosureSummary": {
    "rcEvidenceClosureProfile": "v106-v93-v105-final-rc-evidence-closure",
    "status": "pending-runtime-run",
    "classification": "mixed",
    "commandMatrixPolicy": "v93-v105-focused-and-verify-commands-indexed",
    "artifactIndexPolicy": "v93-v105-browser-screenshot-directories-indexed",
    "dirtyWorktreePolicy": "no-reset-no-revert-no-clean-no-stage-no-commit",
    "watchpackNoisePolicy": "DumpStack.log.tmp-pagefile.sys-known-non-failure-noise",
    "trustedBoundary": "Local v106 release-candidate evidence closure lock over v105. It indexes v93-v105 evidence, commands, Browser QA screenshot artifact directories, dirty worktree policy and Windows Watchpack known non-failure noise while preserving scientific gates, fixtures, live runtime physics, worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background direction, v97 Gaia budgets, v99 opacity caps, release archive, staging, commit and official certification boundaries."
  },
  "atlasInteractionCatalogCompletionSummary": {
    "profile": "v107-camera-launch-gaia-navigation-catalog-completion",
    "status": "pending-runtime-run",
    "classification": "mixed",
    "cameraPolicy": "single-cancellable-command-adaptive-smootherstep-1200-1800ms",
    "gaiaLabelPolicy": "desktop-24-mobile-8-selected-always",
    "trustedBoundary": "v107 changes presentation interaction, local Gaia navigation, labels, curated nebula markers and launch entry only. It does not change scientific gates, fixtures, live or worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background, Gaia render budgets or v99 opacity caps."
  },
  "atlasInteractionRepairLaunchUxSummary": {
    "profile": "v108-sky-target-zoom-launch-ux-repair",
    "status": "pending-runtime-run",
    "classification": "mixed",
    "skyTargetPolicy": "zoomable-visual-proxy-no-physics-body",
    "launchUxPolicy": "leo-satellite-default-cards-countdown-timeline-local-physics",
    "trustedBoundary": "v108 repairs presentation interaction and local launch UX only. It adds a zoomable visual proxy for selected catalog/Gaia sky targets, preserves body zoom during camera locks, and improves the local launch panel while preserving scientific gates, fixtures, live and worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background, Gaia render budgets, v99 opacity caps, release packaging, staging and commit boundaries."
  },
  "atlasInteractionVisualQualitySummary": {
    "profile": "v109-launch-camera-gaia-material-quality",
    "status": "pending-runtime-run",
    "classification": "mixed",
    "cameraFreedomPolicy": "target-follow-user-orbit-override",
    "launchVisualPolicy": "procedural-budget-rocket-satellite-no-physics-mutation",
    "stellarMaterialPolicy": "gaia-bp-rp-gmag-parallax-presentation-material",
    "trustedBoundary": "v109 upgrades presentation interaction and visual quality only. It makes body and sky-target focus locks user-orbit friendly, upgrades local launch camera/rocket/satellite presentation, and maps Gaia/local stellar catalog data into visual materials while preserving scientific gates, fixtures, live and worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background, v75 budgets, v97 Gaia render budgets, v99 opacity caps, release packaging, staging and commit boundaries."
  },
  "atlasCriticalUiRelativityVisibilitySummary": {
    "profile": "v110-visible-chinese-copy-relativity-core-entry",
    "status": "pending-runtime-run",
    "classification": "mixed",
    "uiCopyPolicy": "visible-chinese-copy-no-mojibake",
    "relativityCoreEntryPolicy": "bottom-tools-search-observable-atlas-entry",
    "relativityReadoutPolicy": "eih-dp-rk-mercury-shapiro-kerr-boundary-visible",
    "trustedBoundary": "v110 is a visible UI and observability pass only. It cleans visible Chinese copy, adds direct Relativity Core entry points and summarizes existing EIH 1PN, DP/RK, Mercury, Shapiro, light-deflection and Kerr readouts without changing scientific gates, fixtures, live or worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background, v75/v97/v99 budgets, staging or commits."
  },
  "atlasCameraStellarCloseupSummary": {
    "profile": "v111-camera-rig-stellar-portrait-closeup",
    "status": "pending-runtime-run",
    "classification": "mixed",
    "cameraRigPolicy": "target-anchor-user-orbit-distance-state",
    "stellarPortraitPolicy": "gaia-derived-offline-curated-presentation-portrait",
    "closeupPerformancePolicy": "selected-closeup-nonessential-layer-suppression",
    "trustedBoundary": "v111 is a presentation and camera-control pass only. It preserves user orbit/zoom state while target anchors move, adds Gaia/local stellar portrait rendering from catalog-derived visual material, and suppresses nonessential close-up layers without changing scientific gates, fixtures, live or worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background, v75/v97/v99 budgets, staging or commits."
  },
  "atlasLaunchGameplayOpenRocketBridgeSummary": {
    "profile": "v112-mission-scene-openrocket-import-bridge",
    "status": "pending-runtime-run",
    "classification": "mixed",
    "launchScenePolicy": "mission-scene-pad-tower-countdown-staging-hud-deploy",
    "openRocketBridgePolicy": "offline-import-no-browser-exe-launch",
    "browserExeLaunch": "not-applied",
    "trustedBoundary": "v112 upgrades launch presentation and offline import tooling only. It keeps the reliable local launch path as default, treats useLaunchWebSocket/launch_server.py as optional telemetry, imports OpenRocket files or exports as local JSON data, and never starts D:\\86137\\OpenRocket\\OpenRocket.exe from the browser. It does not change scientific gates, fixtures, live or worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background, v75/v97/v99 budgets, staging or commits."
  },
  "atlasScientificModelUpgradeContractSummary": {
    "profile": "v113-fixture-budget-comparison-rollback-plan",
    "status": "pending-runtime-run",
    "scientificUpgradePolicy": "contract-only-no-core-mutation",
    "fixturePolicy": "new-fixtures-before-core-change",
    "rollbackPolicy": "single-switch-core-upgrade-revert-condition",
    "trustedBoundary": "v113 is a contract-only scientific upgrade plan. It defines the fixtures, error budgets, comparison matrix and rollback conditions required before any future core physics upgrade, and does not modify scientific gates, fixtures, live or worker physics, RK4/DP, EIH 1PN, Kerr or runtime sky/budget caps."
  }
} as const;

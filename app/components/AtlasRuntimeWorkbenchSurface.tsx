"use client";

import AtlasAppShell from "./AtlasAppShell";
import { SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import { KerrBlackHolePanel, ScienceTelemetryPanel } from "./AtlasRuntimeWorkbenchLazySurfaces";
import UniverseSandboxHud from "./UniverseSandboxHud";
import PhysicsPerformanceHud from "./PhysicsPerformanceHud";
import { lazy, Suspense, useEffect, useState } from "react";
import type { AtlasSceneMode } from "../lib/atlasRuntimeSceneFocusPerformance";
import type { OrbitAtlasRenderBudget, OrbitAtlasScaleMode, SolarPresentationMode } from "../lib/orbitAtlasPresentation";
import type { SetStateAction, ChangeEvent } from "react";
import type { BottomControlBarSection } from "./BottomControlBar";
import type { SimulationViewSettings } from "../lib/simulationViewSettings";
import type { PhysicsPrecisionTier } from "../lib/physicsPrecision";
import type { KerrBlackHoleUiState } from "./KerrBlackHolePanel";
import type { TelemetrySeriesState } from "../lib/telemetryTypes";
import type { SimulationDiagnostics, AtlasWorkflowStep, AtlasMissionHubItem, AtlasReportExportFormat, AtlasReportTemplateId, AtlasReportSectionId, AtlasValidationDomainId, AtlasValidationDomain, AtlasValidationIssue, AtlasObservatoryZoneId, AtlasObservatoryDeckAction, EvidenceLedgerSummary, AtlasNavigatorItem } from "../lib/simulationDiagnosticsTypes";
import type { useAtlasDeferredEvidenceModules } from "../lib/useAtlasDeferredEvidenceModules";
import type { BodyLiveMetrics } from "../lib/bodyLiveMetrics";
import type { PhysicsHistoryStack } from "../lib/physicsHistoryStack";
import { atlasRuntimeStore, useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import AtlasRuntimeSceneLayer from "./AtlasRuntimeSceneLayer";
import AtlasRuntimePanelLayer from "./AtlasRuntimePanelLayer";
import AtlasRuntimeDockLayer from "./AtlasRuntimeDockLayer";

const AtlasVisualDiagnosticsSurface = lazy(
  () => import("./AtlasVisualDiagnosticsSurface"),
);

export type AtlasRuntimeWorkbenchSurfaceScope = {
  atlasShellSceneMode: AtlasSceneMode | "scene-lab";
  atlasRuntimeQualityTier: import("../lib/simulationDiagnosticsTypes").AtlasRuntimeQualityTier;
  selectedExoplanetSystemId: string;
  selectedCelestialCatalogId: string;
  selectedBodyIndex: number | null;
  rootAttributes: Readonly<Record<"data-presentation" | "data-atlas-scale" | "data-atlas-budget" | "data-orbit-atlas-profile" | "data-orbit-atlas-ready" | "data-atlas-sky-profile" | "data-atlas-texture-profile" | "data-atlas-planetary-visual-fidelity-version" | "data-atlas-planetary-visual-target" | "data-atlas-planetary-visual-style" | "data-atlas-planetary-visual-asset-policy" | "data-atlas-planetary-visual-boundary" | "data-atlas-selected-body-visual-id" | "data-atlas-selected-body-visual-tier" | "data-atlas-selected-body-closeup-active" | "data-atlas-selected-body-atmosphere-profile" | "data-atlas-sky-closeup-profile" | "data-atlas-cinematic-lighting-version" | "data-atlas-cinematic-lighting-target" | "data-atlas-cinematic-lighting-profile" | "data-atlas-cinematic-postfx-profile" | "data-atlas-cinematic-asset-policy" | "data-atlas-selected-body-lighting-profile" | "data-atlas-cinematic-lighting-boundary" | "data-atlas-chinese-interface-version" | "data-atlas-ui-language" | "data-atlas-localization-mode" | "data-atlas-deep-space-fidelity-version" | "data-atlas-deep-space-visual-profile" | "data-atlas-deep-space-asset-policy" | "data-atlas-deep-space-boundary" | "data-atlas-cinematic-deep-space-camera-version" | "data-atlas-cinematic-camera-profile" | "data-atlas-cinematic-sky-composition-profile" | "data-atlas-cinematic-background-noise-profile" | "data-atlas-cinematic-target-separation-profile" | "data-atlas-cinematic-quality-budget" | "data-atlas-cinematic-deep-space-boundary" | "data-atlas-universe-sandbox-reference-version" | "data-atlas-universe-sandbox-reference-mode" | "data-atlas-background-art-direction" | "data-atlas-background-depth-profile" | "data-atlas-background-subject-visibility-profile" | "data-atlas-reference-screenshot-review" | "data-atlas-background-reference-boundary" | "data-atlas-reference-grade-space-art-version" | "data-atlas-reference-grade-art-direction" | "data-atlas-reference-grade-composite-profile" | "data-atlas-reference-grade-sky-layer-profile" | "data-atlas-reference-grade-starfield-profile" | "data-atlas-reference-grade-subject-matte-profile" | "data-atlas-reference-grade-planet-material-profile" | "data-atlas-reference-grade-asset-policy" | "data-atlas-reference-grade-review-mode" | "data-atlas-reference-grade-boundary" | "data-atlas-planetary-material-composition-version" | "data-atlas-planetary-material-target" | "data-atlas-planetary-material-asset-policy" | "data-atlas-selected-body-material-profile" | "data-atlas-selected-body-atmosphere-depth-profile" | "data-atlas-selected-body-terminator-profile" | "data-atlas-selected-body-ring-profile" | "data-atlas-planetary-material-boundary" | "data-atlas-cinematic-closeup-director-version" | "data-atlas-closeup-composition-target" | "data-atlas-closeup-composition-profile" | "data-atlas-closeup-panel-avoidance-profile" | "data-atlas-closeup-ring-showcase-profile" | "data-atlas-closeup-quality-budget" | "data-atlas-closeup-director-asset-policy" | "data-atlas-cinematic-closeup-director-boundary" | "data-atlas-cinematic-key-light-director-version" | "data-atlas-key-light-target" | "data-atlas-selected-body-key-light-profile" | "data-atlas-key-light-quality-budget" | "data-atlas-key-light-asset-policy" | "data-atlas-cinematic-key-light-boundary" | "data-atlas-planetary-depth-lighting-version" | "data-atlas-depth-lighting-target" | "data-atlas-selected-body-depth-lighting-profile" | "data-atlas-depth-lighting-quality-budget" | "data-atlas-depth-lighting-asset-policy" | "data-atlas-depth-lighting-ring-shadow-cue" | "data-atlas-planetary-depth-lighting-boundary" | "data-atlas-planetary-color-grading-version" | "data-atlas-color-grading-target" | "data-atlas-selected-body-color-grade-profile" | "data-atlas-color-grading-quality-budget" | "data-atlas-color-grading-asset-policy" | "data-atlas-color-grading-gas-layer-cue" | "data-atlas-planetary-color-grading-boundary" | "data-atlas-numerical-integrity-version" | "data-atlas-numerical-integrity-status" | "data-atlas-energy-drift-trend" | "data-atlas-angular-momentum-drift-trend" | "data-atlas-timestep-sensitivity-coverage" | "data-atlas-time-reversal-coverage" | "data-atlas-unit-audit-coverage" | "data-atlas-numerical-integrity-boundary" | "data-atlas-cinematic-planetary-art-version" | "data-atlas-cinematic-art-reference-mode" | "data-atlas-cinematic-art-quality-target" | "data-atlas-cinematic-art-asset-policy" | "data-atlas-selected-body-gas-giant-art-profile" | "data-atlas-selected-body-saturn-ring-art-profile" | "data-atlas-selected-body-earth-cloud-night-profile" | "data-atlas-selected-body-solar-surface-profile" | "data-atlas-global-color-grade-profile" | "data-atlas-background-art-grade-profile" | "data-atlas-cinematic-planetary-art-boundary" | "data-atlas-cinematic-deep-space-backdrop-version" | "data-atlas-cinematic-backdrop-reference-mode" | "data-atlas-cinematic-backdrop-source-policy" | "data-atlas-cinematic-backdrop-sky-manifest" | "data-atlas-cinematic-backdrop-starfield-profile" | "data-atlas-cinematic-backdrop-nebula-profile" | "data-atlas-cinematic-backdrop-negative-space-profile" | "data-atlas-cinematic-backdrop-boundary" | "data-atlas-sparse-deep-space-version" | "data-atlas-sparse-deep-space-reference-mode" | "data-atlas-sparse-deep-space-source-policy" | "data-atlas-sparse-deep-space-sky-manifest" | "data-atlas-sparse-deep-space-starfield-profile" | "data-atlas-sparse-deep-space-milky-way-profile" | "data-atlas-sparse-deep-space-nebula-profile" | "data-atlas-sparse-deep-space-negative-space-profile" | "data-atlas-sparse-deep-space-boundary" | "data-atlas-closeup-presentation-truth-version" | "data-atlas-background-orbit-art-version" | "data-atlas-background-art-profile" | "data-atlas-visual-stability-version" | "data-atlas-sky-art-lock-profile" | "data-atlas-material-stability-profile" | "data-atlas-visual-stability-boundary" | "data-atlas-background-guard-version" | "data-atlas-sky-regression-budget-profile" | "data-atlas-background-guard-boundary" | "data-atlas-material-profile-version" | "data-atlas-closeup-material-budget-profile" | "data-atlas-material-profile-boundary" | "data-atlas-closeup-visual-fidelity-version" | "data-atlas-closeup-asset-policy" | "data-atlas-closeup-visual-target" | "data-atlas-closeup-protected-sky-manifest" | "data-atlas-closeup-full-release-gate-status" | "data-atlas-closeup-visual-boundary" | "data-atlas-orbit-hierarchy-profile" | "data-atlas-orbit-performance-profile" | "data-atlas-orbit-material-profile" | "data-atlas-solar-closeup-profile" | "data-atlas-velocity-trail-profile" | "data-atlas-orbit-occlusion-profile" | "data-atlas-closeup-preview-sync-status" | "data-atlas-closeup-preview-body-id" | "data-atlas-closeup-preview-render-profile" | "data-atlas-closeup-solar-backdrop-profile" | "data-atlas-closeup-planet-readability-profile" | "data-atlas-closeup-review-mode" | "data-atlas-closeup-presentation-truth-boundary" | "data-atlas-cinematic-subject-in-frame" | "data-atlas-cinematic-subject-screen-x" | "data-atlas-cinematic-subject-screen-y" | "data-atlas-cinematic-subject-radius-px" | "data-atlas-camera-preset" | "data-atlas-visible-orbit-count" | "data-atlas-canvas-ready" | "data-atlas-sky-ready" | "data-atlas-core-bodies-ready" | "data-atlas-readiness-fallback" | "data-atlas-orbit-renderer" | "data-gaia-catalog-source" | "data-celestial-catalog-version" | "data-celestial-catalog-count" | "data-celestial-catalog-selected-id" | "data-celestial-catalog-layer-state" | "data-deep-sky-navigation-version" | "data-deep-sky-selected-id" | "data-deep-sky-selected-kind" | "data-deep-sky-label-count" | "data-deep-sky-catalog-count" | "data-deep-sky-layer-state" | "data-atlas-performance-version" | "data-atlas-performance-tier" | "data-atlas-performance-render-stability" | "data-atlas-performance-recommendation-count" | "data-atlas-performance-deep-sky-label-budget" | "data-atlas-performance-workbench-open" | "data-celestial-object-passport-version" | "data-celestial-object-passport-open" | "data-celestial-object-passport-kind" | "data-celestial-object-passport-source" | "data-atlas-navigator-version" | "data-atlas-navigator-open" | "data-atlas-navigator-runtime" | "data-atlas-navigator-query" | "data-atlas-navigator-result-count" | "data-atlas-navigator-selected-id" | "data-atlas-workflow-version" | "data-atlas-workflow-open" | "data-atlas-workflow-selected-id" | "data-atlas-workflow-active-step-id" | "data-atlas-mission-hub-version" | "data-atlas-mission-hub-open" | "data-atlas-mission-hub-current-kind" | "data-atlas-mission-hub-current-id" | "data-atlas-mission-hub-recent-count" | "data-atlas-mission-hub-pinned-count" | "data-atlas-mission-capsule-version" | "data-atlas-mission-capsule-active" | "data-atlas-mission-capsule-restored-count" | "data-atlas-mission-capsule-warning-count" | "data-atlas-scientific-report-version" | "data-atlas-scientific-report-open" | "data-atlas-scientific-report-section-count" | "data-atlas-scientific-report-export-format" | "data-atlas-report-studio-version" | "data-atlas-report-template-id" | "data-atlas-report-included-section-count" | "data-atlas-report-export-format" | "data-atlas-validation-console-version" | "data-atlas-validation-console-open" | "data-atlas-validation-console-status" | "data-atlas-validation-ready-count" | "data-atlas-validation-pending-count" | "data-atlas-validation-failed-count" | "data-atlas-validation-blocker-count" | "data-atlas-validation-selected-domain-id" | "data-atlas-release-gate-version" | "data-atlas-release-gate-status" | "data-atlas-release-gate-blocker-count" | "data-atlas-release-gate-warning-count" | "data-atlas-browser-acceptance-version" | "data-atlas-browser-acceptance-command" | "data-atlas-browser-acceptance-runtime-status" | "data-atlas-browser-acceptance-viewport-count" | "data-atlas-browser-acceptance-boundary" | "data-atlas-workbench-accessibility-version" | "data-atlas-workbench-accessibility-scope" | "data-atlas-workbench-accessibility-standard" | "data-atlas-workbench-accessibility-surface-count" | "data-atlas-workbench-accessibility-min-target-px" | "data-atlas-workbench-accessibility-focus-policy" | "data-atlas-workbench-accessibility-motion-policy" | "data-atlas-workbench-accessibility-runtime-status" | "data-atlas-workbench-accessibility-boundary" | "data-atlas-cinematic-workbench-version" | "data-atlas-cinematic-workbench-visual-target" | "data-atlas-cinematic-workbench-quality-target" | "data-atlas-cinematic-workbench-aa-boundary" | "data-atlas-cinematic-workbench-scene-policy" | "data-atlas-cinematic-workbench-physics-mutation" | "data-atlas-cinematic-workbench-runtime-certification" | "data-atlas-cinematic-workbench-boundary" | "data-relativity-observable-atlas-version" | "data-relativity-observable-count" | "data-relativity-observable-ready-count" | "data-relativity-observable-boundary" | "data-relativity-explainer-version" | "data-relativity-explainer-card-count" | "data-relativity-explainer-step-count" | "data-relativity-explainer-boundary" | "data-relativity-guided-tour-version" | "data-relativity-guided-tour-workflow-id" | "data-relativity-guided-tour-step-count" | "data-relativity-guided-tour-ready-count" | "data-relativity-guided-tour-boundary" | "data-atlas-relativity-verification-version" | "data-atlas-relativity-benchmark-profile" | "data-atlas-relativity-verification-boundary" | "data-atlas-relativity-weak-field-count" | "data-atlas-relativity-strong-field-count" | "data-atlas-relativity-numerical-health-count" | "data-atlas-relativity-kerr-kernel" | "data-atlas-relativity-chart-version" | "data-atlas-relativity-chart-profile" | "data-atlas-relativity-chart-boundary" | "data-atlas-relativity-chart-mercury-points" | "data-atlas-relativity-chart-isco-bars" | "data-atlas-relativity-chart-hamiltonian-classification" | "data-atlas-physics-benchmark-gate-version" | "data-atlas-physics-benchmark-budget-profile" | "data-atlas-physics-benchmark-runtime-status" | "data-atlas-physics-benchmark-blocking-count" | "data-atlas-physics-benchmark-ci-certification" | "data-atlas-physics-benchmark-boundary" | "data-atlas-horizons-gate-audit-version" | "data-atlas-horizons-gate-audit-profile" | "data-atlas-horizons-gate-audit-status" | "data-atlas-horizons-gate-audit-classification" | "data-atlas-horizons-gate-audit-boundary" | "data-atlas-physics-gate-split-version" | "data-atlas-physics-gate-split-profile" | "data-atlas-product-release-gate-status" | "data-atlas-scientific-horizons-gate-status" | "data-atlas-physics-gate-split-boundary" | "data-atlas-release-readiness-version" | "data-atlas-release-readiness-profile" | "data-atlas-release-readiness-status" | "data-atlas-release-readiness-boundary" | "data-atlas-scientific-gate-preflight-version" | "data-atlas-scientific-gate-preflight-profile" | "data-atlas-scientific-gate-preflight-status" | "data-atlas-scientific-gate-preflight-boundary" | "data-atlas-horizons-residual-decomposition-version" | "data-atlas-horizons-residual-decomposition-profile" | "data-atlas-horizons-residual-decomposition-status" | "data-atlas-horizons-residual-dominant-body" | "data-atlas-horizons-residual-decomposition-boundary" | "data-atlas-horizons-candidate-lab-version" | "data-atlas-horizons-candidate-lab-profile" | "data-atlas-horizons-candidate-lab-status" | "data-atlas-horizons-candidate-count" | "data-atlas-horizons-candidate-lab-boundary" | "data-atlas-pluto-residual-isolation-version" | "data-atlas-pluto-residual-isolation-profile" | "data-atlas-pluto-residual-isolation-status" | "data-atlas-pluto-residual-isolation-classification" | "data-atlas-pluto-residual-isolation-boundary" | "data-atlas-outer-system-force-model-preflight-version" | "data-atlas-outer-system-force-model-preflight-profile" | "data-atlas-outer-system-force-model-preflight-status" | "data-atlas-outer-system-force-model-preflight-classification" | "data-atlas-outer-system-force-model-preflight-boundary" | "data-atlas-outer-system-reference-adoption-version" | "data-atlas-outer-system-reference-adoption-profile" | "data-atlas-outer-system-reference-adoption-status" | "data-atlas-outer-system-reference-adoption-classification" | "data-atlas-outer-system-reference-adoption-boundary" | "data-atlas-horizons-candidate-scientific-gate-version" | "data-atlas-horizons-candidate-scientific-gate-profile" | "data-atlas-horizons-candidate-scientific-gate-status" | "data-atlas-horizons-candidate-scientific-gate-classification" | "data-atlas-horizons-candidate-scientific-gate-boundary" | "data-atlas-strict-horizons-migration-dry-run-version" | "data-atlas-strict-horizons-migration-dry-run-profile" | "data-atlas-strict-horizons-migration-dry-run-status" | "data-atlas-strict-horizons-migration-dry-run-classification" | "data-atlas-strict-horizons-migration-dry-run-boundary" | "data-atlas-strict-horizons-shadow-migration-gate-version" | "data-atlas-strict-horizons-shadow-migration-gate-profile" | "data-atlas-strict-horizons-shadow-migration-gate-status" | "data-atlas-strict-horizons-shadow-migration-gate-classification" | "data-atlas-strict-horizons-shadow-migration-gate-boundary" | "data-atlas-default-strict-horizons-migration-version" | "data-atlas-default-strict-horizons-migration-profile" | "data-atlas-default-strict-horizons-migration-status" | "data-atlas-default-strict-horizons-migration-classification" | "data-atlas-default-strict-horizons-migration-boundary" | "data-atlas-horizons-provenance-freeze-version" | "data-atlas-horizons-provenance-freeze-profile" | "data-atlas-horizons-provenance-freeze-status" | "data-atlas-horizons-provenance-freeze-classification" | "data-atlas-horizons-provenance-freeze-boundary" | "data-atlas-offline-runtime-boundary-audit-version" | "data-atlas-offline-runtime-boundary-audit-profile" | "data-atlas-offline-runtime-boundary-audit-status" | "data-atlas-offline-runtime-boundary-audit-classification" | "data-atlas-offline-runtime-boundary-audit-boundary" | "data-atlas-scientific-gate-maintenance-runbook-version" | "data-atlas-scientific-gate-maintenance-runbook-profile" | "data-atlas-scientific-gate-maintenance-runbook-status" | "data-atlas-scientific-gate-maintenance-runbook-classification" | "data-atlas-scientific-gate-maintenance-runbook-boundary" | "data-atlas-scientific-gate-release-evidence-version" | "data-atlas-scientific-gate-release-evidence-profile" | "data-atlas-scientific-gate-release-evidence-status" | "data-atlas-scientific-gate-release-evidence-classification" | "data-atlas-scientific-gate-release-evidence-boundary" | "data-atlas-browser-ci-stability-lock-version" | "data-atlas-browser-ci-stability-lock-profile" | "data-atlas-browser-ci-stability-lock-status" | "data-atlas-browser-ci-stability-lock-classification" | "data-atlas-browser-ci-stability-lock-boundary" | "data-atlas-release-artifact-manifest-lock-version" | "data-atlas-release-artifact-manifest-lock-profile" | "data-atlas-release-artifact-manifest-lock-status" | "data-atlas-release-artifact-manifest-lock-classification" | "data-atlas-release-artifact-manifest-lock-boundary" | "data-atlas-final-maintenance-baseline-version" | "data-atlas-final-maintenance-baseline-profile" | "data-atlas-final-maintenance-baseline-status" | "data-atlas-final-maintenance-baseline-classification" | "data-atlas-final-maintenance-baseline-boundary" | "data-atlas-gaia-starfield-enhancement-version" | "data-atlas-gaia-starfield-enhancement-profile" | "data-atlas-gaia-starfield-enhancement-status" | "data-atlas-gaia-starfield-enhancement-classification" | "data-atlas-gaia-starfield-enhancement-quality-tier" | "data-atlas-gaia-starfield-enhancement-active-budget" | "data-atlas-gaia-starfield-enhancement-boundary" | "data-atlas-relativity-simulation-optimization-version" | "data-atlas-relativity-simulation-optimization-profile" | "data-atlas-relativity-simulation-optimization-status" | "data-atlas-relativity-simulation-optimization-classification" | "data-atlas-relativity-simulation-optimization-kerr-kernel" | "data-atlas-relativity-simulation-optimization-performance-hud-policy" | "data-atlas-relativity-simulation-optimization-boundary" | "data-atlas-art-polish-version" | "data-atlas-art-polish-profile" | "data-atlas-art-polish-status" | "data-atlas-art-polish-classification" | "data-atlas-art-polish-mobile-opacity-cap" | "data-atlas-art-polish-dense-opacity-cap" | "data-atlas-art-polish-closeup-opacity-cap" | "data-atlas-art-polish-boundary" | "data-atlas-post-enhancement-baseline-version" | "data-atlas-post-enhancement-baseline-profile" | "data-atlas-post-enhancement-baseline-status" | "data-atlas-post-enhancement-baseline-classification" | "data-atlas-post-enhancement-baseline-gaia-mobile-budget" | "data-atlas-post-enhancement-baseline-closeup-opacity-cap" | "data-atlas-post-enhancement-baseline-boundary" | "data-atlas-browser-resource-performance-version" | "data-atlas-browser-resource-performance-profile" | "data-atlas-browser-resource-performance-status" | "data-atlas-browser-resource-performance-classification" | "data-atlas-browser-resource-performance-sampler-policy" | "data-atlas-browser-resource-performance-fresh-policy" | "data-atlas-browser-resource-performance-boundary" | "data-atlas-maintenance-evidence-index-version" | "data-atlas-maintenance-evidence-index-profile" | "data-atlas-maintenance-evidence-index-status" | "data-atlas-maintenance-evidence-index-classification" | "data-atlas-maintenance-evidence-index-dirty-policy" | "data-atlas-maintenance-evidence-index-watchpack-policy" | "data-atlas-maintenance-evidence-index-browser-qa-policy" | "data-atlas-maintenance-evidence-index-boundary" | "data-atlas-presentation-runtime-performance-version" | "data-atlas-presentation-runtime-performance-profile" | "data-atlas-presentation-runtime-performance-status" | "data-atlas-presentation-runtime-performance-classification" | "data-atlas-presentation-runtime-performance-gaia-policy" | "data-atlas-presentation-runtime-performance-constellation-policy" | "data-atlas-presentation-runtime-performance-label-policy" | "data-atlas-presentation-runtime-performance-budget-policy" | "data-atlas-presentation-runtime-performance-boundary" | "data-atlas-browser-acceptance-runtime-cost-version" | "data-atlas-browser-acceptance-runtime-cost-profile" | "data-atlas-browser-acceptance-runtime-cost-status" | "data-atlas-browser-acceptance-runtime-cost-classification" | "data-atlas-browser-acceptance-runtime-cost-screenshot-policy" | "data-atlas-browser-acceptance-runtime-cost-marker-policy" | "data-atlas-browser-acceptance-runtime-cost-console-policy" | "data-atlas-browser-acceptance-runtime-cost-boundary" | "data-atlas-final-gaia-art-enhancement-version" | "data-atlas-final-gaia-art-enhancement-profile" | "data-atlas-final-gaia-art-enhancement-status" | "data-atlas-final-gaia-art-enhancement-classification" | "data-atlas-final-gaia-art-enhancement-selection-policy" | "data-atlas-final-gaia-art-enhancement-visual-policy" | "data-atlas-final-gaia-art-enhancement-browser-policy" | "data-atlas-final-gaia-art-enhancement-boundary" | "data-atlas-rc-evidence-closure-version" | "data-atlas-rc-evidence-closure-profile" | "data-atlas-rc-evidence-closure-status" | "data-atlas-rc-evidence-closure-classification" | "data-atlas-rc-evidence-closure-command-policy" | "data-atlas-rc-evidence-closure-artifact-policy" | "data-atlas-rc-evidence-closure-dirty-policy" | "data-atlas-rc-evidence-closure-watchpack-policy" | "data-atlas-rc-evidence-closure-boundary" | "data-atlas-interaction-catalog-completion-version" | "data-atlas-interaction-catalog-completion-profile" | "data-atlas-interaction-catalog-completion-status" | "data-atlas-interaction-catalog-completion-classification" | "data-atlas-interaction-catalog-completion-camera-policy" | "data-atlas-interaction-catalog-completion-gaia-label-policy" | "data-atlas-interaction-catalog-completion-boundary" | "data-atlas-interaction-repair-launch-ux-version" | "data-atlas-interaction-repair-launch-ux-profile" | "data-atlas-interaction-repair-launch-ux-status" | "data-atlas-interaction-repair-launch-ux-classification" | "data-atlas-interaction-repair-launch-ux-sky-target-policy" | "data-atlas-interaction-repair-launch-ux-launch-policy" | "data-atlas-interaction-repair-launch-ux-boundary" | "data-atlas-interaction-visual-quality-version" | "data-atlas-interaction-visual-quality-profile" | "data-atlas-interaction-visual-quality-status" | "data-atlas-interaction-visual-quality-classification" | "data-atlas-interaction-visual-quality-camera-policy" | "data-atlas-interaction-visual-quality-launch-policy" | "data-atlas-interaction-visual-quality-stellar-policy" | "data-atlas-interaction-visual-quality-boundary" | "data-atlas-critical-ui-relativity-visibility-version" | "data-atlas-critical-ui-relativity-visibility-profile" | "data-atlas-critical-ui-relativity-visibility-status" | "data-atlas-critical-ui-relativity-visibility-classification" | "data-atlas-critical-ui-relativity-visibility-copy-policy" | "data-atlas-critical-ui-relativity-visibility-core-entry-policy" | "data-atlas-critical-ui-relativity-visibility-readout-policy" | "data-atlas-critical-ui-relativity-visibility-boundary" | "data-atlas-camera-stellar-closeup-version" | "data-atlas-camera-stellar-closeup-profile" | "data-atlas-camera-stellar-closeup-status" | "data-atlas-camera-stellar-closeup-classification" | "data-atlas-camera-stellar-closeup-camera-policy" | "data-atlas-camera-stellar-closeup-portrait-policy" | "data-atlas-camera-stellar-closeup-performance-policy" | "data-atlas-camera-stellar-closeup-boundary" | "data-atlas-launch-gameplay-openrocket-bridge-version" | "data-atlas-launch-gameplay-openrocket-bridge-profile" | "data-atlas-launch-gameplay-openrocket-bridge-status" | "data-atlas-launch-gameplay-openrocket-bridge-classification" | "data-atlas-launch-gameplay-openrocket-bridge-scene-policy" | "data-atlas-launch-gameplay-openrocket-bridge-import-policy" | "data-atlas-launch-gameplay-openrocket-bridge-browser-exe" | "data-atlas-launch-gameplay-openrocket-bridge-boundary" | "data-atlas-scientific-model-upgrade-contract-version" | "data-atlas-scientific-model-upgrade-contract-profile" | "data-atlas-scientific-model-upgrade-contract-status" | "data-atlas-scientific-model-upgrade-contract-policy" | "data-atlas-scientific-model-upgrade-contract-fixture-policy" | "data-atlas-scientific-model-upgrade-contract-rollback-policy" | "data-atlas-scientific-model-upgrade-contract-boundary" | "data-atlas-visual-launch-performance-version" | "data-atlas-visual-launch-performance-profile" | "data-atlas-visual-launch-performance-status" | "data-atlas-visual-launch-performance-classification" | "data-atlas-visual-launch-performance-quality-tier" | "data-atlas-visual-launch-performance-launch-director" | "data-atlas-visual-launch-performance-runtime-policy" | "data-atlas-visual-launch-performance-openrocket-policy" | "data-atlas-visual-launch-performance-browser-exe" | "data-atlas-visual-launch-performance-boundary" | "data-atlas-runtime-scene-focus-performance-version" | "data-atlas-runtime-scene-focus-performance-profile" | "data-atlas-runtime-scene-focus-performance-status" | "data-atlas-runtime-scene-focus-performance-scene-mode" | "data-atlas-render-foundation-v2-version" | "data-atlas-stellar-catalog-v3-version" | "data-atlas-stellar-material-v2-version" | "data-atlas-exoplanet-orbit-atlas-version" | "data-atlas-visual-integration-v2-version" | "data-atlas-visual-integration-v2-profile" | "data-atlas-visual-integration-v2-scene-count" | "data-atlas-v120-v124-boundary" | "data-atlas-catalog-architecture-version" | "data-atlas-stellar-art-v3-version" | "data-atlas-exoplanet-complete-version" | "data-atlas-relativity-force-model-v2-version" | "data-atlas-kerr-3d-renderer-version" | "data-atlas-scientific-promotion-v2-version" | "data-atlas-scientific-promotion-v2-decision" | "data-atlas-relativity-default-kernel" | "data-atlas-relativity-shadow-kernel" | "data-atlas-v125-v130-boundary" | "data-atlas-runtime-scene-focus-performance-scene-policy" | "data-atlas-runtime-scene-focus-performance-telemetry-policy" | "data-atlas-runtime-scene-focus-performance-camera-policy" | "data-atlas-runtime-scene-focus-performance-marker-policy" | "data-atlas-runtime-scene-focus-performance-dom-policy" | "data-atlas-runtime-scene-focus-performance-r3f-policy" | "data-atlas-runtime-scene-focus-performance-boundary" | "data-atlas-stellar-search-catalog-version" | "data-atlas-stellar-search-catalog-profile" | "data-atlas-stellar-search-catalog-status" | "data-atlas-stellar-search-catalog-row-count" | "data-atlas-stellar-search-render-row-count" | "data-atlas-stellar-search-shard-count" | "data-atlas-stellar-search-runtime-policy" | "data-atlas-stellar-search-boundary" | "data-atlas-scientific-cinematic-art-version" | "data-atlas-scientific-cinematic-art-profile" | "data-atlas-scientific-cinematic-art-material" | "data-atlas-scientific-cinematic-art-derivation" | "data-atlas-scientific-cinematic-art-boundary" | "data-atlas-launch-scene-openrocket-replay-version" | "data-atlas-launch-scene-openrocket-replay-profile" | "data-atlas-launch-scene-openrocket-replay-hud-policy" | "data-atlas-launch-scene-openrocket-replay-asset-policy" | "data-atlas-launch-scene-openrocket-replay-browser-exe" | "data-atlas-launch-scene-openrocket-replay-boundary" | "data-atlas-visual-integration-release-version" | "data-atlas-visual-integration-release-profile" | "data-atlas-visual-integration-release-status" | "data-atlas-visual-review-scenes" | "data-atlas-visual-review-scene" | "data-atlas-hud-boundary-policy" | "data-atlas-subject-screen-coverage-policy" | "data-atlas-visual-integration-release-boundary" | "data-atlas-observatory-deck-version" | "data-atlas-observatory-deck-open" | "data-atlas-observatory-zone-count" | "data-atlas-observatory-active-zone" | "data-atlas-observatory-current-kind" | "data-atlas-observatory-current-id" | "data-atlas-observatory-readiness-status" | "data-atlas-instrument-ui-version" | "data-relativity-visualization" | "data-relativity-lab-version" | "data-kerr-geodesic-track-count" | "data-kerr-geodesic-render-mode" | "data-kerr-orbit-preset" | "data-kerr-impact-parameter-m" | "data-kerr-probe-status" | "data-kerr-relativity-studio-version" | "data-kerr-studio-mode" | "data-kerr-studio-preset" | "data-kerr-studio-probe-status" | "data-kerr-studio-isco-split-m" | "data-kerr-studio-hamiltonian-drift" | "data-kerr-studio-boundary" | "data-atlas-presentation-transform", import("../lib/atlasRuntimeEvidenceFacadeV168").AtlasRuntimeEvidenceAttributeValue>>;
  atlasSceneMode: AtlasSceneMode;
  orbitAtlas: boolean;
  onAtlasBodyCanvasPick: (bodyIndex: number) => void;
  onBodyCanvasPick: (bodyIndex: number) => void;
  onBrightStarFocus: (star: import("../data/brightStarCatalog").BrightStarDef) => void;
  requestGaiaStarFocus: (indexed: import("../lib/gaiaCatalogIndex").GaiaIndexedStar, source?: import("../lib/atlasFocusV2").AtlasFocusSource) => void;
  requestCatalogObjectFocus: (catalogId: string, source?: import("../lib/atlasFocusV2").AtlasFocusSource) => void;
  atlasPerformanceBudgetSummary: import("../lib/simulationDiagnosticsTypes").AtlasPerformanceBudgetSummary;
  presentation: { presentationMode: SolarPresentationMode; scaleMode: OrbitAtlasScaleMode; renderBudget: OrbitAtlasRenderBudget; setPresentationMode: (next: SolarPresentationMode) => void; setScaleMode: (next: OrbitAtlasScaleMode) => void; setRenderBudget: (next: OrbitAtlasRenderBudget) => void; };
  atlasSkyCloseupProfile: string;
  atlasCinematicCameraProfile: "selected-body-cinematic" | "showcase-deep-space" | "overview-atlas";
  atlasCinematicSkyCompositionProfile: import("../lib/simulationDiagnosticsTypes").AtlasCinematicSkyCompositionProfile;
  atlasCinematicBackgroundNoiseProfile: import("../lib/simulationDiagnosticsTypes").AtlasCinematicBackgroundNoiseProfile;
  atlasCinematicTargetSeparationProfile: import("../lib/simulationDiagnosticsTypes").AtlasCinematicTargetSeparationProfile;
  atlasBackgroundDepthProfile: "closeup-subject-negative-space" | "showcase-reference-depth" | "overview-sparse-layered-milky-way";
  atlasBackgroundSubjectVisibilityProfile: import("../lib/simulationDiagnosticsTypes").AtlasBackgroundSubjectVisibilityProfile;
  atlasReferenceGradeCompositeProfile: "selected-body-subject-matte" | "showcase-cinematic-deep-space" | "overview-layered-reference-grade";
  atlasReferenceGradeSkyLayerProfile: "v48-local-closeup-negative-space" | "v48-local-showcase-milky-way" | "v48-local-generated-layered-sky";
  atlasReferenceGradeStarfieldProfile: "closeup-star-noise-suppressed" | "showcase-structured-starfield" | "sparse-primary-stars";
  atlasReferenceGradeSubjectMatteProfile: "selected-body-background-matte" | "showcase-center-negative-space" | "overview-no-subject-matte";
  atlasReferenceGradePlanetMaterialProfile: "solar-edge-controlled" | "gas-giant-ring-readability" | "closeup-microcontrast-fill" | "overview-local-hd";
  atlasSelectedBodyMaterialProfile: "solar-granulation-depth" | "earth-cloud-night-depth" | "saturn-ring-material-depth" | "gas-giant-band-depth" | "lunar-mars-relief-depth" | "terrestrial-terminator-depth" | "overview-local-material";
  atlasSelectedBodyAtmosphereDepthProfile: "solar-edge-controlled-depth" | "thin-earth-limb-depth" | "gas-giant-soft-limb-depth" | "airless-relief-limb" | "overview-atmosphere";
  atlasSelectedBodyTerminatorProfile: "solar-limb-darkening" | "earth-night-cloud-terminator" | "gas-band-low-fill-terminator" | "airless-relief-terminator" | "overview-terminator";
  atlasSelectedBodyRingProfile: "saturn-cassini-layered-ring" | "no-ring-profile";
  atlasSelectedBodyKeyLightProfile: "solar-surface-edge-key" | "earth-cloud-night-key-balance" | "saturn-ring-key-fill" | "gas-giant-readable-key-fill" | "lunar-mars-relief-key" | "overview-natural-phase";
  atlasSelectedBodyDepthLightingProfile: "solar-granulation-limb-depth" | "earth-atmospheric-terminator-depth" | "saturn-ring-shadow-depth" | "gas-giant-banded-phase-depth" | "airless-relief-terminator-depth" | "overview-no-depth-lighting";
  atlasSelectedBodyColorGradeProfile: "solar-photosphere-color-depth" | "earth-ocean-cloud-color-depth" | "saturn-ring-occlusion-color-grade" | "gas-giant-layer-color-grade" | "airless-regolith-color-depth" | "overview-neutral-color";
  atlasSelectedBodyGasGiantArtProfile: "saturn-muted-bands-ring-aware" | "gas-giant-band-depth-cinematic" | "overview-no-gas-giant-art";
  atlasSelectedBodySaturnRingArtProfile: "saturn-cassini-backlit-ring-art" | "no-ring-art-profile";
  atlasSelectedBodyEarthCloudNightProfile: "earth-clean-cloud-night-shadow-art" | "overview-no-earth-cloud-night-art";
  atlasSelectedBodySolarSurfaceProfile: "solar-granulation-controlled-corona-art" | "overview-no-solar-surface-art";
  atlasGlobalColorGradeProfile: "filmic-cool-space-warm-planet-protection";
  atlasBackgroundArtGradeProfile: "closeup-subject-star-noise-matte" | "sparse-negative-space-milky-way-depth";
  atlasCinematicBackdropStarfieldProfile: "closeup-subject-star-noise-suppressed" | "sparse-primary-stars-faint-distant-field";
  atlasCinematicBackdropNebulaProfile: "closeup-nebula-haze-restrained" | "soft-local-nebula-haze-layer";
  atlasCinematicBackdropNegativeSpaceProfile: "selected-body-clean-dark-backdrop" | "layered-milky-way-negative-space";
  atlasSparseDeepSpaceStarfieldProfile: "closeup-primary-stars-subject-matte" | "sparse-primary-stars-ultrafaint-distant-field";
  atlasSparseDeepSpaceMilkyWayProfile: "closeup-dark-lane-negative-space" | "deep-cold-gray-blue-dark-lanes";
  atlasSparseDeepSpaceNebulaProfile: "closeup-haze-nearly-suppressed" | "barely-visible-local-haze";
  atlasSparseDeepSpaceNegativeSpaceProfile: "selected-body-clean-negative-space" | "overview-wide-negative-space";
  atlasCloseupCompositionProfile: "solar-surface-portrait" | "earth-limb-portrait" | "saturn-ring-showcase" | "gas-giant-band-portrait" | "lunar-mars-relief-portrait" | "overview-no-closeup-director";
  atlasCloseupPanelAvoidanceProfile: "centered-mobile-safe-subject" | "right-workbench-safe-subject-left" | "overview-no-panel-avoidance";
  atlasCloseupRingShowcaseProfile: "saturn-wide-tilted-ring-showcase" | "no-ring-showcase";
  atlasCinematicLightingSummary: import("../lib/simulationDiagnosticsTypes").AtlasCinematicLightingCompositionSummary;
  handleCanvasReady: () => void;
  setSkyReady: import("react").Dispatch<SetStateAction<boolean>>;
  handleCoreBodiesReady: () => void;
  clearFocusLock: () => void;
  handleLocalLaunchHandoff: (heliocentric: import("../lib/useAtlasLaunchController").AtlasLaunchHandoffState) => void;
  handleLaunchAbort: () => void;
  launchRuntimeActive: boolean;
  atlasToolsOpen: boolean;
  activeSection: BottomControlBarSection;
  searchFocusNonce: number;
  onBodyFocusFromList: (bodyIndex: number) => void;
  onSelectBody: (bodyIndex: number) => void;
  onNearbyStarFocus: (direction: [number, number, number], catalogId?: string) => void;
  viewSettings: SimulationViewSettings;
  setViewSettings: import("react").Dispatch<SetStateAction<SimulationViewSettings>>;
  openKerrLab: () => void;
  visualEnhance: boolean;
  setVisualEnhance: import("react").Dispatch<SetStateAction<boolean>>;
  leftPanelCollapsed: boolean;
  handleLeftPanelCollapsedChange: (collapsed: boolean) => void;
  lagrangeSpawnNonceRef: import("react").RefObject<number>;
  openAtlasMissionHub: () => void;
  openAtlasObservatoryDeck: () => void;
  openAtlasWorkflows: () => void;
  openAtlasScientificReport: () => void;
  openAtlasValidationConsole: () => void;
  setEvidenceInitialClaimId: (entryId: string) => void;
  setEvidenceLedgerOpen: import("../lib/atlasRuntimeStore").AtlasPanelBooleanSetter;
  handleExportSystemState: () => void;
  importStateInputRef: import("react").RefObject<HTMLInputElement | null>;
  physicsRef: import("react").MutableRefObject<import("../lib/useSolarSystem").SolarSystemPhysicsRef | null>;
  precisionTierRef: import("react").RefObject<PhysicsPrecisionTier>;
  physicsUsesSharedBuffer: boolean;
  kerrBlackHole: KerrBlackHoleUiState;
  setKerrBlackHole: import("react").Dispatch<SetStateAction<KerrBlackHoleUiState>>;
  telemetrySeriesRef: import("react").RefObject<TelemetrySeriesState | null>;
  simulationDiagnosticsRef: import("react").RefObject<SimulationDiagnostics | null>;
  relativityEnabled: boolean;
  relativityEnabledRef: import("react").MutableRefObject<boolean>;
  floatingOriginRef: import("react").MutableRefObject<import("../lib/floatingOrigin").FloatingOriginState>;
  cameraBodyFocusRequest: import("./UniverseScene").CameraBodyFocusRequest | null;
  cameraOriginResetNonce: number;
  earthMoonView: boolean;
  selectedStellarSearchDocument: import("../lib/stellarSearchCatalog").StellarSearchDocument | null;
  selectedBodyCloseupActive: boolean;
  selectedBodyLightingProfile: import("../lib/simulationDiagnosticsTypes").AtlasSelectedBodyLightingProfile;
  integrationSuspendedRef: import("react").MutableRefObject<boolean>;
  launchMode: boolean;
  localLaunchActiveRef: import("react").MutableRefObject<boolean>;
  launchConfigRef: import("react").MutableRefObject<import("../lib/launchTelemetryTypes").LaunchConfig | null>;
  panelSurfaceActivated: boolean;
  isMobileViewport: boolean;
  ATLAS_RUNTIME_MODAL_PANEL_IDS: readonly ["navigator"];
  evidenceInitialClaimId: string;
  gaiaCatalogSource: import("../data/gaiaStarCatalog").GaiaCatalogSource;
  atlasReady: boolean;
  atlasWorkflowSummary: import("../lib/simulationDiagnosticsTypes").AtlasWorkflowSummary;
  atlasWorkflowSelectedId: string;
  atlasWorkflowActiveStepId: string;
  setAtlasWorkflowSelectedId: (workflowId: string) => void;
  setAtlasWorkflowActiveStepId: (stepId: string) => void;
  handleAtlasWorkflowRunStep: (step: AtlasWorkflowStep) => void;
  setAtlasWorkflowOpen: import("../lib/atlasRuntimeStore").AtlasPanelBooleanSetter;
  atlasMissionHubSummary: import("../lib/simulationDiagnosticsTypes").AtlasMissionHubSummary;
  handleMissionHubExecuteItem: (item: AtlasMissionHubItem) => void;
  handleMissionHubTogglePinned: (item: AtlasMissionHubItem) => void;
  handleCopyMissionCapsuleLink: () => void;
  handleExportMissionCapsule: () => void;
  missionCapsuleImportInputRef: import("react").RefObject<HTMLInputElement | null>;
  handleClearMissionCapsuleHash: () => void;
  setAtlasMissionHubOpen: import("../lib/atlasRuntimeStore").AtlasPanelBooleanSetter;
  deferredEvidenceModules: import("../lib/useAtlasDeferredEvidenceModules").AtlasDeferredEvidenceModuleSetV195;
  atlasScientificReportSummary: import("../lib/simulationDiagnosticsTypes").AtlasScientificReportSummary;
  atlasReportStudioSummary: import("../lib/simulationDiagnosticsTypes").AtlasReportStudioSummary;
  atlasScientificReportExportFormat: AtlasReportExportFormat;
  handleAtlasReportTemplateChange: (templateId: AtlasReportTemplateId) => void;
  handleAtlasReportSectionToggle: (sectionId: AtlasReportSectionId, enabled: boolean) => void;
  handleExportScientificReportMarkdown: () => Promise<void>;
  handleExportScientificReportJson: () => Promise<void>;
  handleExportScientificReportHtml: () => Promise<void>;
  handleCopyScientificReportSummary: () => Promise<void>;
  setAtlasScientificReportOpen: import("../lib/atlasRuntimeStore").AtlasPanelBooleanSetter;
  atlasValidationConsoleSummary: import("../lib/simulationDiagnosticsTypes").AtlasValidationConsoleSummary;
  atlasValidationSelectedDomainId: AtlasValidationDomainId;
  setAtlasValidationSelectedDomainId: (domainId: AtlasValidationDomainId) => void;
  handleValidationDomainAction: (domain: AtlasValidationDomain) => void;
  handleValidationIssueAction: (issue: AtlasValidationIssue) => void;
  setAtlasValidationConsoleOpen: import("../lib/atlasRuntimeStore").AtlasPanelBooleanSetter;
  atlasObservatoryDeckSummary: import("../lib/simulationDiagnosticsTypes").AtlasObservatoryDeckSummary;
  atlasObservatoryActiveZoneId: AtlasObservatoryZoneId;
  setAtlasObservatoryActiveZoneId: (zoneId: AtlasObservatoryZoneId) => void;
  handleObservatoryDeckAction: (action: AtlasObservatoryDeckAction) => void;
  setAtlasObservatoryDeckOpen: import("../lib/atlasRuntimeStore").AtlasPanelBooleanSetter;
  legacyRelativityPanelProps: ReturnType<typeof import("../lib/atlasLegacyRelativityPanelAdapterV190").createAtlasLegacyRelativityPanelProps>;
  relativityObservableAtlasSummary: import("../lib/simulationDiagnosticsTypes").RelativityObservableAtlasSummary;
  relativityObservableExplainerSummary: import("../lib/simulationDiagnosticsTypes").RelativityObservableExplainerSummary;
  atlasRelativityVerificationSummary: import("../lib/simulationDiagnosticsTypes").AtlasRelativityVerificationSummary;
  atlasRelativityChartSummary: import("../lib/simulationDiagnosticsTypes").AtlasRelativityChartSummary;
  atlasPhysicsBenchmarkGateSummary: import("../lib/simulationDiagnosticsTypes").AtlasPhysicsBenchmarkGateSummary;
  atlasHorizonsGateAuditSummary: import("../lib/simulationDiagnosticsTypes").AtlasHorizonsGateAuditSummary;
  atlasPhysicsGateSplitSummary: import("../lib/simulationDiagnosticsTypes").AtlasPhysicsGateSplitSummary;
  atlasScientificGatePreflightSummary: import("../lib/simulationDiagnosticsTypes").AtlasScientificGatePreflightSummary;
  atlasHorizonsResidualDecompositionSummary: import("../lib/simulationDiagnosticsTypes").AtlasHorizonsResidualDecompositionSummary;
  atlasGaiaStarfieldEnhancementSummary: import("../lib/simulationDiagnosticsTypes").AtlasGaiaStarfieldEnhancementSummary;
  atlasRelativitySimulationOptimizationSummary: import("../lib/simulationDiagnosticsTypes").AtlasRelativitySimulationOptimizationSummary;
  setRelativityObservableAtlasOpen: import("../lib/atlasRuntimeStore").AtlasPanelBooleanSetter;
  setObservationalAstrophysicsOpen: import("../lib/atlasRuntimeStore").AtlasPanelBooleanSetter;
  navigatorEvidenceSummary: EvidenceLedgerSummary;
  gaiaIndex: readonly import("../lib/gaiaCatalogIndex").GaiaIndexedStar[];
  setAtlasNavigatorOpen: import("../lib/atlasRuntimeStore").AtlasPanelBooleanSetter;
  handleAtlasNavigatorExecute: (item: AtlasNavigatorItem) => void;
  setOrbitAnalysisOpen: import("../lib/atlasRuntimeStore").AtlasPanelBooleanSetter;
  simDaysRef: import("react").RefObject<number>;
  celestialObjectPassport: import("../lib/simulationDiagnosticsTypes").CelestialObjectPassport | null;
  setSelectedCelestialCatalogId: import("react").Dispatch<SetStateAction<string>>;
  bodyMetricsRef: import("react").RefObject<BodyLiveMetrics | null>;
  daysPerSecond: number;
  handleImportStateFile: (ev: ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleImportMissionCapsuleFile: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  localLaunchActive: boolean;
  launchState: import("../lib/launchTelemetryTypes").LaunchSimState;
  localTelemetryRef: import("react").RefObject<import("../lib/localLaunchPhysics").LocalTelemetry | null>;
  isPlaying: boolean;
  setIsPlaying: import("react").Dispatch<SetStateAction<boolean>>;
  handleSearch: () => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  setActiveSection: import("react").Dispatch<SetStateAction<BottomControlBarSection>>;
  setLaunchMode: import("react").Dispatch<SetStateAction<boolean>>;
  orbitAnalysisOpen: boolean;
  atlasWorkflowOpen: boolean;
  atlasMissionHubOpen: boolean;
  atlasObservatoryDeckOpen: boolean;
  atlasScientificReportOpen: boolean;
  atlasValidationConsoleOpen: boolean;
  evidenceLedgerOpen: boolean;
  handleFocus: () => void;
  handleEarthMoon: () => void;
  simSlower: () => void;
  simFaster: () => void;
  simRewind: () => void;
  simFastForward: () => void;
  toggleRelativity: () => void;
  timeTravelScrubURef: import("react").RefObject<number>;
  timeTravelScrubbingRef: import("react").RefObject<boolean>;
  physicsHistoryRef: import("react").RefObject<PhysicsHistoryStack>;
  timeTravelScrubUi: number;
  setTimeTravelScrubUi: import("react").Dispatch<SetStateAction<number>>;
  syncTimeTravelSuspension: () => void;
  handleLaunchStart: (config: import("../lib/launchTelemetryTypes").LaunchConfig) => void;
};

export type AtlasRuntimeDomainGroups = {
  sceneOverlay: AtlasRuntimeWorkbenchSurfaceScope;
  panelSlots: AtlasRuntimeWorkbenchSurfaceScope;
  dock: AtlasRuntimeWorkbenchSurfaceScope;
};

function createAtlasRuntimeDomainGroups(
  scope: AtlasRuntimeWorkbenchSurfaceScope,
): AtlasRuntimeDomainGroups {
  return { sceneOverlay: scope, panelSlots: scope, dock: scope };
}

export default function AtlasRuntimeWorkbenchSurface({
  scope,
}: {
  scope: AtlasRuntimeWorkbenchSurfaceScope;
}) {
  const [visualDiagnosticsEnabled, setVisualDiagnosticsEnabled] = useState(false);
  const domains = createAtlasRuntimeDomainGroups(scope);
  const experienceMode = useAtlasRuntimeStore((snapshot) => snapshot.experienceMode);
  const researchMode = experienceMode === "research";
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("visualDiagnostics") === "1";
    setVisualDiagnosticsEnabled(process.env.NODE_ENV !== "production" || requested);
    if (requested) atlasRuntimeStore.setExperienceMode("research");
  }, []);
  const {
    atlasShellSceneMode,
    atlasRuntimeQualityTier,
    selectedExoplanetSystemId,
    selectedCelestialCatalogId,
    selectedBodyIndex,
    rootAttributes,
    atlasSceneMode,
    orbitAtlas,
    onAtlasBodyCanvasPick,
    onBodyCanvasPick,
    onBrightStarFocus,
    requestGaiaStarFocus,
    requestCatalogObjectFocus,
    atlasPerformanceBudgetSummary,
    presentation,
    atlasSkyCloseupProfile,
    atlasCinematicCameraProfile,
    atlasCinematicSkyCompositionProfile,
    atlasCinematicBackgroundNoiseProfile,
    atlasCinematicTargetSeparationProfile,
    atlasBackgroundDepthProfile,
    atlasBackgroundSubjectVisibilityProfile,
    atlasReferenceGradeCompositeProfile,
    atlasReferenceGradeSkyLayerProfile,
    atlasReferenceGradeStarfieldProfile,
    atlasReferenceGradeSubjectMatteProfile,
    atlasReferenceGradePlanetMaterialProfile,
    atlasSelectedBodyMaterialProfile,
    atlasSelectedBodyAtmosphereDepthProfile,
    atlasSelectedBodyTerminatorProfile,
    atlasSelectedBodyRingProfile,
    atlasSelectedBodyKeyLightProfile,
    atlasSelectedBodyDepthLightingProfile,
    atlasSelectedBodyColorGradeProfile,
    atlasSelectedBodyGasGiantArtProfile,
    atlasSelectedBodySaturnRingArtProfile,
    atlasSelectedBodyEarthCloudNightProfile,
    atlasSelectedBodySolarSurfaceProfile,
    atlasGlobalColorGradeProfile,
    atlasBackgroundArtGradeProfile,
    atlasCinematicBackdropStarfieldProfile,
    atlasCinematicBackdropNebulaProfile,
    atlasCinematicBackdropNegativeSpaceProfile,
    atlasSparseDeepSpaceStarfieldProfile,
    atlasSparseDeepSpaceMilkyWayProfile,
    atlasSparseDeepSpaceNebulaProfile,
    atlasSparseDeepSpaceNegativeSpaceProfile,
    atlasCloseupCompositionProfile,
    atlasCloseupPanelAvoidanceProfile,
    atlasCloseupRingShowcaseProfile,
    atlasCinematicLightingSummary,
    handleCanvasReady,
    setSkyReady,
    handleCoreBodiesReady,
    clearFocusLock,
    handleLocalLaunchHandoff,
    handleLaunchAbort,
    launchRuntimeActive,
    atlasToolsOpen,
    activeSection,
    searchFocusNonce,
    onBodyFocusFromList,
    onSelectBody,
    onNearbyStarFocus,
    viewSettings,
    setViewSettings,
    visualEnhance,
    setVisualEnhance,
    leftPanelCollapsed,
    handleLeftPanelCollapsedChange,
    lagrangeSpawnNonceRef,
    openAtlasMissionHub,
    openAtlasObservatoryDeck,
    openAtlasWorkflows,
    openAtlasScientificReport,
    openAtlasValidationConsole,
    setEvidenceInitialClaimId,
    setEvidenceLedgerOpen,
    handleExportSystemState,
    importStateInputRef,
    physicsRef,
    precisionTierRef,
    physicsUsesSharedBuffer,
    kerrBlackHole,
    setKerrBlackHole,
    telemetrySeriesRef,
    simulationDiagnosticsRef,
    relativityEnabled,
    relativityEnabledRef,
    floatingOriginRef,
    cameraBodyFocusRequest,
    cameraOriginResetNonce,
    earthMoonView,
    selectedStellarSearchDocument,
    selectedBodyCloseupActive,
    selectedBodyLightingProfile,
    integrationSuspendedRef,
    launchMode,
    localLaunchActiveRef,
    launchConfigRef,
    panelSurfaceActivated,
    isMobileViewport,
    ATLAS_RUNTIME_MODAL_PANEL_IDS,
    evidenceInitialClaimId,
    gaiaCatalogSource,
    atlasReady,
    atlasWorkflowSummary,
    atlasWorkflowSelectedId,
    atlasWorkflowActiveStepId,
    setAtlasWorkflowSelectedId,
    setAtlasWorkflowActiveStepId,
    handleAtlasWorkflowRunStep,
    setAtlasWorkflowOpen,
    atlasMissionHubSummary,
    handleMissionHubExecuteItem,
    handleMissionHubTogglePinned,
    handleCopyMissionCapsuleLink,
    handleExportMissionCapsule,
    missionCapsuleImportInputRef,
    handleClearMissionCapsuleHash,
    setAtlasMissionHubOpen,
    deferredEvidenceModules,
    atlasScientificReportSummary,
    atlasReportStudioSummary,
    atlasScientificReportExportFormat,
    handleAtlasReportTemplateChange,
    handleAtlasReportSectionToggle,
    handleExportScientificReportMarkdown,
    handleExportScientificReportJson,
    handleExportScientificReportHtml,
    handleCopyScientificReportSummary,
    setAtlasScientificReportOpen,
    atlasValidationConsoleSummary,
    atlasValidationSelectedDomainId,
    setAtlasValidationSelectedDomainId,
    handleValidationDomainAction,
    handleValidationIssueAction,
    setAtlasValidationConsoleOpen,
    atlasObservatoryDeckSummary,
    atlasObservatoryActiveZoneId,
    setAtlasObservatoryActiveZoneId,
    handleObservatoryDeckAction,
    setAtlasObservatoryDeckOpen,
    legacyRelativityPanelProps,
    relativityObservableAtlasSummary,
    relativityObservableExplainerSummary,
    atlasRelativityVerificationSummary,
    atlasRelativityChartSummary,
    atlasPhysicsBenchmarkGateSummary,
    atlasHorizonsGateAuditSummary,
    atlasPhysicsGateSplitSummary,
    atlasScientificGatePreflightSummary,
    atlasHorizonsResidualDecompositionSummary,
    atlasGaiaStarfieldEnhancementSummary,
    atlasRelativitySimulationOptimizationSummary,
    setRelativityObservableAtlasOpen,
    setObservationalAstrophysicsOpen,
    navigatorEvidenceSummary,
    gaiaIndex,
    setAtlasNavigatorOpen,
    handleAtlasNavigatorExecute,
    setOrbitAnalysisOpen,
    simDaysRef,
    celestialObjectPassport,
    setSelectedCelestialCatalogId,
    bodyMetricsRef,
    daysPerSecond,
    handleImportStateFile,
    handleImportMissionCapsuleFile,
    localLaunchActive,
    launchState,
    localTelemetryRef,
    isPlaying,
    setIsPlaying,
    handleSearch,
    handleZoomIn,
    handleZoomOut,
    setActiveSection,
    setLaunchMode,
    orbitAnalysisOpen,
    atlasWorkflowOpen,
    atlasMissionHubOpen,
    atlasObservatoryDeckOpen,
    atlasScientificReportOpen,
    atlasValidationConsoleOpen,
    evidenceLedgerOpen,
    handleFocus,
    handleEarthMoon,
    simSlower,
    simFaster,
    simRewind,
    simFastForward,
    toggleRelativity,
    timeTravelScrubURef,
    timeTravelScrubbingRef,
    physicsHistoryRef,
    timeTravelScrubUi,
    setTimeTravelScrubUi,
    syncTimeTravelSuspension,
    handleLaunchStart,
  } = scope;
  return (
    <AtlasAppShell
      className="relative h-[100dvh] w-screen overflow-hidden bg-[#030303]"
      sceneMode={atlasShellSceneMode}
      qualityTier={atlasRuntimeQualityTier}
      selectedObjectId={
        selectedExoplanetSystemId ||
        selectedCelestialCatalogId ||
        (selectedBodyIndex !== null ? SOLAR_SYSTEM_BODIES[selectedBodyIndex]?.id ?? "" : "")
      }
      {...rootAttributes}
    >
      {visualDiagnosticsEnabled && researchMode ? (
        <Suspense fallback={null}>
          <AtlasVisualDiagnosticsSurface />
        </Suspense>
      ) : null}
      <AtlasRuntimeSceneLayer scope={domains.sceneOverlay} />
      {!launchRuntimeActive && (!orbitAtlas || atlasToolsOpen) ? (
        <div className="contents" data-universe-sandbox-hud="true">
          <UniverseSandboxHud
            activeSection={activeSection}
            searchFocusNonce={searchFocusNonce}
            selectedBodyIndex={selectedBodyIndex}
            selectedCatalogId={selectedCelestialCatalogId}
            onBodyFocus={onBodyFocusFromList}
            onBodyInspect={onSelectBody}
            onNearbyStarFocus={onNearbyStarFocus}
            onConstellationFocus={onNearbyStarFocus}
            viewSettings={viewSettings}
            onViewSettingsChange={setViewSettings}
            visualEnhance={visualEnhance}
            onVisualEnhanceChange={setVisualEnhance}
            leftPanelCollapsed={leftPanelCollapsed}
            onLeftPanelCollapsedChange={handleLeftPanelCollapsedChange}
            lagrangeSpawnNonceRef={lagrangeSpawnNonceRef}
            onAtlasMissionHubOpen={openAtlasMissionHub}
            onAtlasObservatoryDeckOpen={openAtlasObservatoryDeck}
            onAtlasWorkflowsOpen={openAtlasWorkflows}
            onAtlasScientificReportOpen={openAtlasScientificReport}
            onAtlasValidationConsoleOpen={openAtlasValidationConsole}
            onEvidenceLedgerOpen={() => {
              setEvidenceInitialClaimId("");
              setEvidenceLedgerOpen(true);
            }}
            onExportSystemState={handleExportSystemState}
            onImportSystemState={() => importStateInputRef.current?.click()}
          />
        </div>
      ) : null}
      {!launchRuntimeActive && !orbitAtlas && researchMode ? (
        <div className="contents" data-physics-performance-hud="true">
          <PhysicsPerformanceHud
            physicsRef={physicsRef}
            precisionTierRef={precisionTierRef}
            physicsUsesSharedBuffer={physicsUsesSharedBuffer}
            performanceBudgetSummary={atlasPerformanceBudgetSummary}
          />
        </div>
      ) : null}
      {!launchRuntimeActive && viewSettings.showKerrBlackHole ? (
        <Suspense fallback={null}>
          <KerrBlackHolePanel value={kerrBlackHole} onChange={setKerrBlackHole} />
        </Suspense>
      ) : null}
      {!launchRuntimeActive && !orbitAtlas && activeSection === "tools" && researchMode ? (
        <Suspense fallback={null}>
          <div className="contents" data-science-telemetry-panel="true">
            <ScienceTelemetryPanel
              telemetrySeriesRef={telemetrySeriesRef}
              simulationDiagnosticsRef={simulationDiagnosticsRef}
              selectedBodyIndex={selectedBodyIndex}
              relativityEnabled={relativityEnabled}
              mainSidebarOffsetPx={leftPanelCollapsed ? 0 : 288}
            />
          </div>
        </Suspense>
      ) : null}
      <AtlasRuntimePanelLayer scope={domains.panelSlots} />
      <AtlasRuntimeDockLayer scope={domains.dock} />
    </AtlasAppShell>
  );
}

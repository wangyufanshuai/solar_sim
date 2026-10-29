/* v250 Evidence Ledger domain: product. */
import { ATLAS_BROWSER_ACCEPTANCE_VERSION, createAtlasBrowserAcceptanceSummary } from "../atlasBrowserAcceptance";
import { ATLAS_BROWSER_ACCEPTANCE_RUNTIME_COST_VERSION, createAtlasBrowserAcceptanceRuntimeCostSummary } from "../atlasBrowserAcceptanceRuntimeCostLock";
import { ATLAS_BROWSER_CI_STABILITY_LOCK_VERSION, createAtlasBrowserCiStabilityLockSummary } from "../atlasBrowserCiStabilityLock";
import { ATLAS_BROWSER_RESOURCE_PERFORMANCE_VERSION, createAtlasBrowserResourcePerformanceSummary } from "../atlasBrowserResourcePerformanceLock";
import { ATLAS_CRITICAL_UI_RELATIVITY_VISIBILITY_VERSION, createAtlasCriticalUiRelativityVisibilitySummary } from "../atlasCriticalUiRelativityVisibilityLock";
import { ATLAS_FINAL_MAINTENANCE_BASELINE_VERSION, createAtlasFinalMaintenanceBaselineSummary } from "../atlasFinalMaintenanceBaseline";
import { ATLAS_INTERACTION_CATALOG_COMPLETION_VERSION, createAtlasInteractionCatalogCompletionSummary } from "../atlasInteractionCatalogCompletionLock";
import { ATLAS_INTERACTION_REPAIR_LAUNCH_UX_VERSION, createAtlasInteractionRepairLaunchUxSummary } from "../atlasInteractionRepairLaunchUxLock";
import { ATLAS_LAUNCH_GAMEPLAY_OPENROCKET_BRIDGE_VERSION, createAtlasLaunchGameplayOpenRocketBridgeSummary } from "../atlasLaunchGameplayOpenRocketBridgeLock";
import { ATLAS_LAUNCH_SCENE_OPENROCKET_REPLAY_VERSION, createAtlasLaunchSceneOpenRocketReplaySummary } from "../atlasLaunchSceneOpenRocketReplay";
import { ATLAS_MAINTENANCE_EVIDENCE_INDEX_VERSION, createAtlasMaintenanceEvidenceIndexSummary } from "../atlasMaintenanceEvidenceIndex";
import { ATLAS_OFFLINE_STELLAR_SEARCH_CATALOG_V2_VERSION, createAtlasOfflineStellarSearchCatalogV2Summary } from "../atlasOfflineStellarSearchCatalogV2";
import { ATLAS_PERFORMANCE_BUDGET_VERSION } from "../atlasPerformanceBudget";
import { ATLAS_POST_ENHANCEMENT_BASELINE_VERSION, createAtlasPostEnhancementMaintenanceBaselineSummary } from "../atlasPostEnhancementMaintenanceBaseline";
import { ATLAS_PRESENTATION_RUNTIME_PERFORMANCE_VERSION, createAtlasPresentationRuntimePerformanceSummary } from "../atlasPresentationRuntimePerformanceLock";
import { ATLAS_RC_EVIDENCE_CLOSURE_VERSION, createAtlasRcEvidenceClosureSummary } from "../atlasRcEvidenceClosureLock";
import { ATLAS_RELATIVITY_SIMULATION_OPTIMIZATION_VERSION, createAtlasRelativitySimulationOptimizationSummary } from "../atlasRelativitySimulationOptimization";
import { ATLAS_RELEASE_ARTIFACT_MANIFEST_LOCK_VERSION, createAtlasReleaseArtifactManifestLockSummary } from "../atlasReleaseArtifactManifestLock";
import { ATLAS_RELEASE_GATE_VERSION } from "../atlasReleaseGate";
import { ATLAS_ONE_RELEASE_VERSION, createAtlasFinalReleaseSummary, createScientificPromotionEvidenceV3 } from "../atlasReleaseProgram";
import { ATLAS_RUNTIME_SCENE_FOCUS_PERFORMANCE_VERSION, createAtlasRuntimeSceneFocusSummary } from "../atlasRuntimeSceneFocusPerformance";
import { ATLAS_SCIENTIFIC_PROMOTION_V2_VERSION, createAtlasScientificPromotionV2Summary } from "../atlasScientificPromotionV2";
import { ATLAS_VISUAL_INTEGRATION_RELEASE_VERSION, createAtlasVisualIntegrationReleaseSummary } from "../atlasVisualIntegrationRelease";
import { ATLAS_WORKBENCH_ACCESSIBILITY_VERSION, createAtlasWorkbenchAccessibilitySummary } from "../atlasWorkbenchAccessibility";
import type { AtlasPerformanceBudgetSummary, EvidenceClaim } from "../simulationDiagnosticsTypes";
import { createPassport, formula, metric, withPassport } from "./shared";
import type { EvidenceClaimWithoutPassport } from "./shared";

export function performanceBudgetClaim(
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


export function releaseCandidateGateClaim(): EvidenceClaim {
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


export function browserCiStabilityLockClaim(): EvidenceClaim {
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


export function releaseArtifactManifestLockClaim(): EvidenceClaim {
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


export function finalMaintenanceBaselineClaim(): EvidenceClaim {
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


export function relativitySimulationOptimizationClaim(): EvidenceClaim {
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


export function postEnhancementMaintenanceBaselineClaim(): EvidenceClaim {
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


export function browserResourcePerformanceLockClaim(): EvidenceClaim {
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


export function maintenanceEvidenceIndexClaim(): EvidenceClaim {
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


export function presentationRuntimePerformanceLockClaim(): EvidenceClaim {
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


export function browserAcceptanceRuntimeCostLockClaim(): EvidenceClaim {
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


export function rcEvidenceClosureLockClaim(): EvidenceClaim {
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


export function interactionCatalogCompletionLockClaim(): EvidenceClaim {
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


export function interactionRepairLaunchUxLockClaim(): EvidenceClaim {
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


export function criticalUiRelativityVisibilityLockClaim(): EvidenceClaim {
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


export function launchGameplayOpenRocketBridgeLockClaim(): EvidenceClaim {
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


export function runtimeSceneFocusPerformanceLockClaim(): EvidenceClaim {
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


export function offlineStellarSearchCatalogV2LockClaim(): EvidenceClaim {
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


export function launchSceneOpenRocketReplayLockClaim(): EvidenceClaim {
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


export function visualIntegrationReleaseGateClaim(): EvidenceClaim {
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


export function scientificPromotionV2Claim(): EvidenceClaim {
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


export function finalProductProgramClaim(): EvidenceClaim {
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


export function browserAcceptanceHarnessClaim(): EvidenceClaim {
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


export function accessibilityWorkbenchClaim(): EvidenceClaim {
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

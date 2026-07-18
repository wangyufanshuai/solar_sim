import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const ROOT_SELECTOR = '[data-atlas-browser-acceptance-version="v38-browser-acceptance-harness"]';
const V104_BROWSER_ACCEPTANCE_REVIEW_SCREENSHOTS =
  process.env.ATLAS_BROWSER_REVIEW_SCREENSHOTS === "1";
const V104_BROWSER_ACCEPTANCE_DEFAULT_SCREENSHOT_IDS = new Set([
  "v59-overview",
  "v59-earth",
  "v59-sun",
  "v59-jupiter",
  "v59-saturn",
  "v76-closeup-visual-fidelity",
  "v102-maintenance-evidence-index",
  "v103-presentation-runtime-performance-lock",
  "v104-browser-acceptance-runtime-cost-lock",
  "v105-final-gaia-art-enhancement-lock",
  "v106-release-candidate-evidence-closure-lock",
  "v107-interaction-catalog-completion-lock",
  "v108-interaction-repair-launch-ux-lock",
  "v109-interaction-visual-quality-lock",
  "v110-critical-ui-relativity-visibility-lock",
  "v111-camera-stellar-closeup-lock",
  "v112-launch-gameplay-openrocket-bridge-lock",
  "v114-visual-launch-performance-lock",
  "v115-runtime-scene-focus-performance-lock",
  "v116-offline-stellar-search-catalog-v2",
  "v117-scientific-cinematic-art-lock",
  "v118-launch-scene-openrocket-replay-lock",
  "v119-visual-integration-release-gate",
]);
const V104_BROWSER_ACCEPTANCE_MOBILE_DEFAULT_SCREENSHOT_IDS = new Set([
  "v76-closeup-visual-fidelity",
]);
const V104_BROWSER_ACCEPTANCE_FULL_REVIEW_SCREENSHOT_IDS = new Set([
  "v73-relativity-verification-readability",
  "v74-relativity-verification-charts",
  "v75-physics-benchmark-release-gate",
  "v78-product-scientific-physics-gate-split",
  "v81-horizons-residual-decomposition",
  "v82-horizons-dynamical-parameter-candidate-lab",
  "v83-pluto-residual-cause-isolation",
  "v84-outer-system-force-model-preflight",
  "v85-outer-system-reference-adoption-preflight",
  "v86-horizons-candidate-scientific-gate",
  "v87-strict-horizons-migration-dry-run",
  "v88-strict-horizons-shadow-migration-gate",
  "v89-default-strict-horizons-scientific-gate-migration",
  "v90-horizons-provenance-freeze",
  "v91-offline-runtime-boundary-audit",
  "v92-scientific-gate-maintenance-runbook-lock",
  "v93-scientific-gate-release-evidence-lock",
  "v94-browser-ci-stability-lock",
  "v95-release-artifact-manifest-lock",
  "v96-final-maintenance-baseline",
  "v97-gaia-starfield-enhancement",
  "v98-relativity-simulation-optimization",
  "v99-art-polish",
  "v100-post-enhancement-maintenance-baseline",
  "v101-browser-resource-performance-lock",
  "v102-maintenance-evidence-index",
  "v103-presentation-runtime-performance-lock",
  "v104-browser-acceptance-runtime-cost-lock",
  "v105-final-gaia-art-enhancement-lock",
  "v106-release-candidate-evidence-closure-lock",
  "v107-interaction-catalog-completion-lock",
  "v108-interaction-repair-launch-ux-lock",
  "v109-interaction-visual-quality-lock",
  "v110-critical-ui-relativity-visibility-lock",
  "v111-camera-stellar-closeup-lock",
  "v112-launch-gameplay-openrocket-bridge-lock",
  "v114-visual-launch-performance-lock",
  "v115-runtime-scene-focus-performance-lock",
]);

test("Orbit Atlas browser acceptance contracts", async ({ page }, testInfo) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(ROOT_SELECTOR)).toHaveCount(1);
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-app-shell",
    "v131-runtime-simplification-resource-lifecycle",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-million-star-version",
    "v135-million-star-sqlite-atlas",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-final-release-version",
    "v140-windows-scientific-cinematic-atlas-1.0",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-resource-workers",
    /\d+/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-catalog-architecture-version",
    "v125-catalog-architecture-universal-search",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-scientific-promotion-v2-decision",
    "blocked-shadow-retained",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-relativity-default-kernel",
    "legacy-eih-1pn",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-kerr-3d-renderer-version",
    "v129-kerr-3d-geodesics-black-hole-renderer",
  );
  const atlasLaunchEntry = page.locator('[data-atlas-launch-entry="orbit-atlas"]');
  await expect(atlasLaunchEntry).toHaveCount(1);
  await atlasLaunchEntry.click();
  const launchProfile = page.locator('select').filter({ has: page.locator('option[value="leo_satellite"]') });
  await expect(launchProfile).toHaveCount(1);
  await expect(launchProfile).toHaveValue("leo_satellite");
  await expect(page.locator('[data-launch-control-panel="true"]')).toHaveAttribute(
    "data-launch-default-profile",
    "leo_satellite",
  );
  await expect(page.locator('[data-launch-profile-card-active="true"]')).toContainText(
    /LEO|卫星|Satellite/i,
  );
  await expect(page.locator('[data-launch-mission-timeline="leo_satellite"]')).toHaveCount(1);
  await expect(page.locator('[data-launch-camera-controls="auto-manual-follow"]')).toHaveCount(1);
  await expect(page.locator('[data-launch-camera-follow="restore"]')).toHaveCount(1);
  await expect(page.locator('[data-launch-clear-instructions="true"]')).toContainText(/Manual Orbit|Restore follow|手动环绕|恢复跟随/);
  await page.getByRole("button", { exact: true, name: "点火发射" }).click();
  const launchRuntime = page.locator("[data-launch-runtime-quality]");
  await expect(launchRuntime).toHaveAttribute("data-launch-runtime-quality", /launch-cinematic|mobile-safe/, {
    timeout: 12_000,
  });
  await expect(launchRuntime).toHaveAttribute(
    "data-launch-director-phase",
    /prelaunch|ignition|tower-clear|max-q|meco-separation|coast|insertion|payload-deploy|liftoff|stage-separation|coast-insertion/,
  );
  await expect(launchRuntime).toHaveAttribute("data-launch-plume-budget", /\d+/);
  await expect(launchRuntime).toHaveAttribute("data-launch-telemetry-source", "local-default");
  await expect(launchRuntime).toHaveAttribute("data-launch-openrocket-import-status", "offline-import-ready");
  await expect(page.locator('[data-launch-telemetry-dock="true"]')).toHaveCount(1);
  await expect(page.locator('[data-bottom-control-bar="true"]')).toHaveCount(0);
  await expect(page.locator('[data-universe-sandbox-hud="true"]')).toHaveCount(0);
  await expect(page.locator('#universe-object-browser')).toHaveCount(0);
  await expect(page.locator('[data-physics-performance-hud="true"]')).toHaveCount(0);
  await expect(page.locator('[data-science-telemetry-panel="true"]')).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(launchRuntime).toHaveCount(0);
  await expect(page.locator('[data-launch-telemetry-dock="true"]')).toHaveCount(0);
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-runtime-scene-focus-performance-scene-mode",
    /atlas|inspect|kerr/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-camera-rig-policy",
    "target-anchor-user-orbit-distance-state",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-camera-origin-reset-nonce",
    "1",
  );

  await page.goto("/?presentation=sandbox", { waitUntil: "domcontentloaded" });
  await expect(page.locator(ROOT_SELECTOR)).toHaveCount(1);
  await expect(
    page.locator('[data-atlas-workbench-accessibility-version="v41-atlas-workbench-accessibility"]'),
  ).toHaveCount(1, { timeout: 30_000 });
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-workbench-accessibility-standard",
    "wcag-2.2-aa-target",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-workbench-accessibility-surface-count",
    "9",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-workbench-accessibility-runtime-status",
    "not-claimed-in-app",
  );
  await expect(page.locator('[data-relativity-guided-tour-version="v40-relativity-guided-tour"]')).toHaveCount(1);
  await expect(page.locator('[data-relativity-explainer-version="v39-relativity-observable-explainer"]')).toHaveCount(1);
  await expect(page.locator('[data-relativity-observable-atlas-version="v37-relativity-observable-atlas"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-relativity-verification-version="v73-relativity-verification-readability"]')).toHaveCount(1);
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-relativity-benchmark-profile",
    "v73-weak-field-kerr-benchmark-readout",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-relativity-kerr-kernel",
    "eih-1pn+kerr-geodesic-v17",
  );
  await expect(page.locator('[data-atlas-relativity-chart-version="v74-relativity-verification-charts"]')).toHaveCount(1);
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-relativity-chart-profile",
    "v74-newtonian-eih-kerr-readout-curves",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-relativity-chart-hamiltonian-classification",
    "numerical-health-only",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-physics-benchmark-gate-version",
    "v75-physics-benchmark-release-gate",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-physics-benchmark-budget-profile",
    "v75-weak-field-horizons-kerr-error-budget",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-physics-benchmark-runtime-status",
    /pass|pending|fail/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-physics-benchmark-ci-certification",
    "not-claimed-in-app",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-horizons-gate-audit-version",
    "v77-horizons-gate-closure-audit",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-horizons-gate-audit-profile",
    "v77-j2000-frame-unit-integrator-audit",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-horizons-gate-audit-status",
    /pending-runtime-run|blocked-model-limit|blocked-reference-frame-mismatch|blocked-runner-bug-unresolved|pass/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-physics-gate-split-version",
    "v78-product-scientific-physics-gate-split",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-physics-gate-split-profile",
    "v78-local-product-ready-strict-horizons-blocked",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-product-release-gate-status",
    "pass",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-scientific-horizons-gate-status",
    /pending-runtime-run|blocked-model-limit|pass/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-release-readiness-version",
    "v79-release-readiness-gate-semantics",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-release-readiness-profile",
    "v79-product-ready-scientific-blocker-disclosed",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-release-readiness-status",
    "product-ready-scientific-horizons-blocked",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-scientific-gate-preflight-version",
    "v80-scientific-horizons-closure-preflight",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-scientific-gate-preflight-profile",
    "v80-horizons-model-limit-upgrade-roadmap",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-scientific-gate-preflight-status",
    "product-ready-strict-scientific-blocked-preflight-ready",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-horizons-residual-decomposition-version",
    "v81-horizons-residual-decomposition",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-horizons-residual-decomposition-profile",
    "v81-rtn-body-checkpoint-error-attribution",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-horizons-residual-decomposition-status",
    /pending-runtime-run|ready-blocked-model-limit|ready-pass/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-horizons-residual-dominant-body",
    /^$|pluto/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-horizons-candidate-lab-version",
    "v82-horizons-dynamical-parameter-candidate-lab",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-horizons-candidate-lab-profile",
    "v82-de440-gm-softening-step-hierarchy-matrix",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-horizons-candidate-lab-status",
    /pending-offline-run|candidate-partial-unapplied|candidate-pass-unapplied/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-horizons-candidate-count",
    "5",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-pluto-residual-isolation-version",
    "v83-pluto-residual-cause-isolation",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-pluto-residual-isolation-profile",
    "v83-outer-system-phase-force-model-matrix",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-pluto-residual-isolation-status",
    /pending-runtime-run|ready-candidate-limited|ready-candidate-actionable/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-pluto-residual-isolation-classification",
    /not-isolated|likely-force-model-limit|likely-reference-model-limit|likely-integrator-limit|mixed/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-outer-system-force-model-preflight-version",
    "v84-outer-system-force-model-preflight",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-outer-system-force-model-preflight-profile",
    "v84-pluto-barycenter-tno-force-model-upgrade-path",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-outer-system-force-model-preflight-status",
    /pending-runtime-run|ready-fixture-provenance-blocked|ready-upgrade-path-limited|ready-upgrade-path-actionable/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-outer-system-force-model-preflight-classification",
    /^$|fixture-provenance-limit|barycenter-reference-limit|missing-perturber-limit|gm-parity-limit|mixed|not-enough-evidence/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-outer-system-reference-adoption-version",
    "v85-outer-system-reference-adoption-preflight",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-outer-system-reference-adoption-profile",
    "v85-barycentric-fixture-adoption-readiness",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-outer-system-reference-adoption-status",
    /pending-runtime-run|ready-adoption-candidate|ready-adoption-blocked|ready-default-gate-blocked/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-outer-system-reference-adoption-classification",
    /reference-fixture-ready|default-gate-not-migrated|provenance-regression|budget-regression|candidate-regression|mixed/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-horizons-candidate-scientific-gate-version",
    "v86-horizons-candidate-scientific-gate",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-horizons-candidate-scientific-gate-profile",
    "v86-barycentric-reference-candidate-gate",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-horizons-candidate-scientific-gate-status",
    /pending-runtime-run|candidate-gate-pass-unapplied|candidate-gate-fail|candidate-gate-blocked/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-horizons-candidate-scientific-gate-classification",
    /candidate-budget-pass|default-strict-gate-still-blocked|fixture-provenance-regression|budget-regression|candidate-numerical-regression|mixed/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-strict-horizons-migration-dry-run-version",
    "v87-strict-horizons-migration-dry-run",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-strict-horizons-migration-dry-run-profile",
    "v87-default-gate-migration-diff-audit",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-strict-horizons-migration-dry-run-status",
    /pending-runtime-run|ready-migration-diff-complete|ready-migration-blocked|ready-default-gate-still-blocked/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-strict-horizons-migration-dry-run-classification",
    /candidate-ready-default-not-migrated|default-gate-diff-ready|fixture-regression|budget-regression|candidate-regression|migration-contract-incomplete|mixed/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-strict-horizons-shadow-migration-gate-version",
    "v88-strict-horizons-shadow-migration-gate",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-strict-horizons-shadow-migration-gate-profile",
    "v88-parallel-default-gate-rehearsal",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-strict-horizons-shadow-migration-gate-status",
    /pending-runtime-run|ready-shadow-gate-pass|ready-shadow-gate-blocked|ready-default-gate-still-blocked/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-strict-horizons-shadow-migration-gate-classification",
    /shadow-gate-pass-default-not-migrated|migration-diff-regression|shadow-budget-regression|strict-command-regression|fixture-regression|mixed/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-default-strict-horizons-migration-version",
    "v89-default-strict-horizons-scientific-gate-migration",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-default-strict-horizons-migration-profile",
    "v89-apply-barycentric-reference-default-gate",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-default-strict-horizons-migration-status",
    /pending-runtime-run|ready-default-gate-migrated|ready-migration-blocked|ready-legacy-v75-blocker-preserved/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-default-strict-horizons-migration-classification",
    /default-gate-migrated-shadow-provenance|shadow-gate-regression|default-command-not-migrated|legacy-audit-regression|budget-regression|fixture-regression|mixed/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-horizons-provenance-freeze-version",
    "v90-horizons-provenance-freeze",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-horizons-provenance-freeze-profile",
    "v90-default-gate-command-fixture-hash-lock",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-horizons-provenance-freeze-status",
    /pending-runtime-run|ready-freeze-locked|ready-freeze-blocked|ready-legacy-audit-preserved/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-horizons-provenance-freeze-classification",
    /freeze-lock-pass|command-ownership-regression|fixture-hash-regression|fixture-provenance-regression|budget-regression|legacy-audit-regression|docs-boundary-regression|mixed/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-offline-runtime-boundary-audit-version",
    "v91-offline-runtime-boundary-audit",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-offline-runtime-boundary-audit-profile",
    "v91-scientific-gate-runtime-boundary-lock",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-offline-runtime-boundary-audit-status",
    /pending-runtime-run|ready-boundary-locked|ready-boundary-blocked|ready-runtime-claims-clean/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-offline-runtime-boundary-audit-classification",
    /offline-runtime-boundary-pass|runtime-claim-regression|live-physics-mutation-regression|scientific-certification-claim-regression|browser-surface-regression|docs-boundary-regression|mixed/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-scientific-gate-maintenance-runbook-version",
    "v92-scientific-gate-maintenance-runbook-lock",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-scientific-gate-maintenance-runbook-profile",
    "v92-offline-gate-release-rollback-command-runbook",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-scientific-gate-maintenance-runbook-status",
    /pending-runtime-run|ready-runbook-locked|ready-runbook-blocked|ready-rollback-audit-preserved/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-scientific-gate-maintenance-runbook-classification",
    /maintenance-runbook-pass|command-ownership-regression|provenance-freeze-regression|offline-runtime-boundary-regression|rollback-contract-regression|docs-runbook-regression|browser-surface-regression|mixed/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-scientific-gate-release-evidence-version",
    "v93-scientific-gate-release-evidence-lock",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-scientific-gate-release-evidence-profile",
    "v93-offline-gate-release-evidence-bundle",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-scientific-gate-release-evidence-status",
    /pending-runtime-run|ready-release-evidence-locked|ready-release-evidence-blocked|ready-release-verification-matrix-locked/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-scientific-gate-release-evidence-classification",
    /release-evidence-pass|runbook-regression|provenance-freeze-regression|offline-runtime-boundary-regression|command-ownership-regression|browser-evidence-regression|docs-evidence-regression|mixed/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-browser-ci-stability-lock-version",
    "v94-browser-ci-stability-lock",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-browser-ci-stability-lock-profile",
    "v94-fresh-browser-ci-runtime-stability",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-browser-ci-stability-lock-status",
    /pending-runtime-run|ready-browser-ci-locked|ready-browser-ci-blocked|ready-fresh-teardown-preserved/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-browser-ci-stability-lock-classification",
    /browser-ci-stability-pass|screenshot-retry-regression|pixel-settle-regression|fresh-server-regression|command-ownership-regression|docs-boundary-regression|mixed/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-release-artifact-manifest-lock-version",
    "v95-release-artifact-manifest-lock",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-release-artifact-manifest-lock-profile",
    "v95-offline-release-artifact-manifest",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-release-artifact-manifest-lock-status",
    /pending-runtime-run|ready-artifact-manifest-locked|ready-artifact-manifest-blocked|ready-release-bundle-indexed/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-release-artifact-manifest-lock-classification",
    /release-artifact-manifest-pass|command-matrix-regression|fixture-artifact-regression|browser-artifact-regression|docs-artifact-regression|rollback-boundary-regression|protected-mutation-regression|mixed/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-final-maintenance-baseline-version",
    "v96-final-maintenance-baseline",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-final-maintenance-baseline-profile",
    "v96-final-offline-maintenance-baseline",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-final-maintenance-baseline-status",
    /pending-runtime-run|ready-maintenance-baseline-locked|ready-maintenance-baseline-blocked|ready-post-baseline-boundary-locked/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-final-maintenance-baseline-classification",
    /final-maintenance-baseline-pass|full-verify-regression|scientific-verify-regression|artifact-manifest-regression|browser-ci-regression|scientific-gate-regression|docs-baseline-regression|protected-mutation-regression|mixed/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-gaia-starfield-enhancement-version",
    "v97-gaia-starfield-enhancement",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-gaia-starfield-enhancement-profile",
    "v97-gaia-constellation-nebula-overlay",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-gaia-starfield-enhancement-status",
    /pending-runtime-run|ready-gaia-overlay-locked|ready-gaia-overlay-blocked|ready-visual-overlay-budgeted/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-gaia-starfield-enhancement-classification",
    /gaia-overlay-pass|gaia-catalog-regression|constellation-catalog-regression|nebula-catalog-regression|overlay-budget-regression|v9-sky-boundary-regression|protected-mutation-regression|mixed/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-relativity-simulation-optimization-version",
    "v98-relativity-simulation-optimization",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-relativity-simulation-optimization-profile",
    "v98-relativity-observability-teaching-layer",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-relativity-simulation-optimization-status",
    /pending-runtime-run|ready-relativity-optimization-locked|ready-relativity-optimization-blocked|ready-teaching-overlay-budgeted/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-relativity-simulation-optimization-classification",
    /relativity-optimization-pass|observable-atlas-regression|kerr-studio-regression|weak-field-readout-regression|performance-hud-regression|protected-physics-regression|docs-surface-regression|mixed/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-art-polish-version",
    "v99-art-polish",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-art-polish-profile",
    "v99-gaia-overlay-closeup-presentation-polish",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-art-polish-status",
    /pending-runtime-run|ready-art-polish-locked|ready-art-polish-blocked|ready-presentation-layer-budgeted/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-art-polish-classification",
    /art-polish-pass|gaia-layer-regression|constellation-layer-regression|nebula-layer-regression|closeup-readability-regression|mobile-budget-regression|v9-sky-boundary-regression|protected-mutation-regression|docs-surface-regression|mixed/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-post-enhancement-baseline-version",
    "v100-post-enhancement-maintenance-baseline",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-post-enhancement-baseline-profile",
    "v100-v97-v99-visual-teaching-maintenance-lock",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-post-enhancement-baseline-status",
    /pending-runtime-run|ready-post-enhancement-baseline-locked|ready-post-enhancement-baseline-blocked|ready-post-enhancement-evidence-indexed/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-post-enhancement-baseline-classification",
    /post-enhancement-baseline-pass|v96-baseline-regression|gaia-overlay-regression|relativity-observability-regression|art-polish-regression|browser-resource-regression|verification-entrypoint-regression|docs-surface-regression|protected-mutation-regression|mixed/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-browser-resource-performance-version",
    "v101-browser-resource-performance-lock",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-browser-resource-performance-profile",
    "v101-fresh-browser-resource-performance",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-browser-resource-performance-status",
    /pending-runtime-run|ready-browser-resource-performance-locked|ready-browser-resource-performance-blocked|ready-browser-resource-optimized/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-browser-resource-performance-classification",
    /browser-resource-performance-pass|v100-baseline-regression|screenshot-resource-regression|pixel-sampler-regression|fresh-teardown-regression|console-error-regression|docs-surface-regression|protected-mutation-regression|mixed/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-maintenance-evidence-index-version",
    "v102-maintenance-evidence-index",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-maintenance-evidence-index-profile",
    "v102-v93-v101-maintenance-evidence-index",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-maintenance-evidence-index-status",
    /pending-runtime-run|ready-maintenance-evidence-indexed|ready-maintenance-evidence-blocked|ready-repo-hygiene-policy-locked/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-maintenance-evidence-index-classification",
    /maintenance-evidence-index-pass|v101-regression|command-index-regression|dirty-worktree-policy-regression|watchpack-noise-policy-regression|browser-qa-index-regression|docs-surface-regression|protected-mutation-regression|mixed/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-presentation-runtime-performance-version",
    "v103-presentation-runtime-performance-lock",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-presentation-runtime-performance-profile",
    "v103-gaia-constellation-label-runtime-cost",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-presentation-runtime-performance-status",
    /pending-runtime-run|ready-presentation-runtime-performance-locked|ready-presentation-runtime-performance-blocked|ready-presentation-runtime-optimized/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-presentation-runtime-performance-classification",
    /presentation-runtime-performance-pass|v102-regression|gaia-runtime-regression|constellation-runtime-regression|label-runtime-regression|budget-threshold-regression|docs-surface-regression|protected-mutation-regression|mixed/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-browser-acceptance-runtime-cost-version",
    "v104-browser-acceptance-runtime-cost-lock",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-browser-acceptance-runtime-cost-profile",
    "v104-fresh-browser-acceptance-cost-review",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-browser-acceptance-runtime-cost-status",
    /pending-runtime-run|ready-browser-acceptance-runtime-cost-locked|ready-browser-acceptance-runtime-cost-blocked|ready-browser-acceptance-runtime-cost-reduced/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-browser-acceptance-runtime-cost-classification",
    /browser-acceptance-runtime-cost-pass|v103-regression|screenshot-workload-regression|marker-coverage-regression|fresh-teardown-regression|console-error-regression|budget-threshold-regression|docs-surface-regression|protected-mutation-regression|mixed/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-browser-acceptance-runtime-cost-screenshot-policy",
    "default-current-plus-core-full-review-history",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-final-gaia-art-enhancement-version",
    "v105-final-gaia-art-enhancement-lock",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-final-gaia-art-enhancement-profile",
    "v105-budget-preserved-gaia-art-polish",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-final-gaia-art-enhancement-status",
    /pending-runtime-run|ready-final-gaia-art-locked|ready-final-gaia-art-blocked|ready-budget-preserved-gaia-enhanced/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-final-gaia-art-enhancement-classification",
    /final-gaia-art-pass|v104-regression|gaia-selection-regression|gaia-visual-mapping-regression|constellation-nebula-readability-regression|browser-qa-regression|budget-boundary-regression|docs-surface-regression|protected-mutation-regression|mixed/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-final-gaia-art-enhancement-selection-policy",
    "deterministic-bright-near-color-spread-sky-binned",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-rc-evidence-closure-version",
    "v106-release-candidate-evidence-closure-lock",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-rc-evidence-closure-profile",
    "v106-v93-v105-final-rc-evidence-closure",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-rc-evidence-closure-status",
    /pending-runtime-run|ready-rc-evidence-closed|ready-rc-evidence-blocked|ready-rc-handoff-indexed/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-rc-evidence-closure-classification",
    /rc-evidence-closure-pass|v105-regression|command-matrix-regression|browser-qa-regression|artifact-index-regression|dirty-worktree-policy-regression|docs-surface-regression|protected-mutation-regression|mixed/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-rc-evidence-closure-dirty-policy",
    "no-reset-no-revert-no-clean-no-stage-no-commit",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-interaction-catalog-completion-version",
    "v107-interaction-catalog-completion-lock",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-interaction-catalog-completion-profile",
    "v107-camera-launch-gaia-navigation-catalog-completion",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-interaction-catalog-completion-status",
    /pending-runtime-run|ready-interaction-catalog-locked|ready-interaction-catalog-blocked|ready-visual-navigation-complete/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-interaction-repair-launch-ux-version",
    "v108-interaction-repair-launch-ux-lock",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-interaction-repair-launch-ux-profile",
    "v108-sky-target-zoom-launch-ux-repair",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-interaction-repair-launch-ux-status",
    /pending-runtime-run|ready-interaction-repair-launch-ux-locked|ready-interaction-repair-launch-ux-blocked|ready-sky-target-launch-ux-repaired/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-interaction-visual-quality-version",
    "v109-interaction-visual-quality-lock",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-interaction-visual-quality-profile",
    "v109-launch-camera-gaia-material-quality",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-interaction-visual-quality-status",
    /pending-runtime-run|ready-interaction-visual-quality-locked|ready-interaction-visual-quality-blocked|ready-launch-camera-gaia-material-upgraded/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-critical-ui-relativity-visibility-version",
    "v110-critical-ui-relativity-visibility-lock",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-critical-ui-relativity-visibility-profile",
    "v110-visible-chinese-copy-relativity-core-entry",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-camera-stellar-closeup-version",
    "v111-camera-stellar-closeup-lock",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-camera-stellar-closeup-profile",
    "v111-camera-rig-stellar-portrait-closeup",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-launch-gameplay-openrocket-bridge-version",
    "v112-launch-gameplay-openrocket-bridge-lock",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-launch-gameplay-openrocket-bridge-import-policy",
    "offline-import-no-browser-exe-launch",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-scientific-model-upgrade-contract-version",
    "v113-scientific-model-upgrade-contract",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-scientific-model-upgrade-contract-policy",
    "contract-only-no-core-mutation",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-visual-launch-performance-version",
    "v114-visual-launch-performance-lock",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-visual-launch-performance-profile",
    "v114-scene-director-runtime-quality",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-visual-launch-performance-quality-tier",
    /balanced|mobile-safe|launch-cinematic|closeup-inspect/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-visual-launch-performance-launch-director",
    "prelaunch-liftoff-maxq-staging-coast-deploy",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-visual-launch-performance-runtime-policy",
    "presentation-only-quality-tier-scheduling",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-visual-launch-performance-openrocket-policy",
    "offline-import-no-browser-exe-launch",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-runtime-scene-focus-performance-version",
    "v115-runtime-scene-focus-performance-lock",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-runtime-scene-focus-performance-profile",
    "v115-scene-isolation-telemetry-focus-latency",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-runtime-scene-focus-performance-scene-mode",
    /atlas|inspect|launch|kerr/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-runtime-scene-focus-performance-scene-policy",
    "launch-exclusive-r3f-and-dom-layers",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-closeup-visual-fidelity-version",
    "v76-closeup-visual-fidelity-pass",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-closeup-asset-policy",
    "v76-local-hd-planets-existing-source-audited",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-closeup-protected-sky-manifest",
    "orbit-atlas-v9",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-closeup-full-release-gate-status",
    "product-ready-scientific-horizons-blocked",
  );
  await expect(page.locator('[data-atlas-release-gate-version="v36-release-candidate-gate"]')).toHaveCount(1);
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-browser-acceptance-runtime-status",
    "not-claimed-in-app",
  );
  await expect(
    page.locator('[data-atlas-cinematic-workbench-version="v42-cinematic-science-workbench"]'),
  ).toHaveCount(1);
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-cinematic-workbench-visual-target",
    "scientific-instrument-cinematic",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-cinematic-workbench-quality-target",
    "aaa-inspired-local-art-direction",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-cinematic-workbench-aa-boundary",
    "v41-aa-boundary-preserved",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-cinematic-workbench-physics-mutation",
    "not-applied",
  );
  await expect(
    page.locator('[data-atlas-planetary-visual-fidelity-version="v43-planetary-visual-fidelity-pass"]'),
  ).toHaveCount(1);
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-planetary-visual-target",
    "selected-body-closeup-realism",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-planetary-visual-style",
    "restrained-scientific-instrument",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-planetary-visual-asset-policy",
    "network-prepared-local-runtime",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-selected-body-closeup-active",
    "false",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-selected-body-visual-tier",
    "overview",
  );
  await expect(
    page.locator('[data-atlas-cinematic-lighting-version="v44-cinematic-lighting-composition"]'),
  ).toHaveCount(1);
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-cinematic-lighting-target",
    "closeup-cinematic-lighting-composition",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-cinematic-lighting-profile",
    "filmic-closeup-balanced",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-cinematic-postfx-profile",
    "aces-vignette-restrained-bloom",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-cinematic-asset-policy",
    "dev-prepared-local-runtime",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-selected-body-lighting-profile",
    "overview",
  );
  await expect(
    page.locator('[data-atlas-chinese-interface-version="v45-chinese-deep-space-fidelity"]'),
  ).toHaveCount(1);
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute("data-atlas-ui-language", "zh-CN");
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-localization-mode",
    "zh-cn-primary-scientific-ids-preserved",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-deep-space-visual-profile",
    "milky-way-constellation-nebula-balanced",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-deep-space-asset-policy",
    "local-runtime-assets",
  );
  await expect(
    page.locator('[data-atlas-cinematic-deep-space-camera-version="v46-cinematic-deep-space-camera"]'),
  ).toHaveCount(1);
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-cinematic-camera-profile",
    "overview-atlas",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-cinematic-sky-composition-profile",
    "layered-atlas-overview",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-cinematic-background-noise-profile",
    "atlas-balanced-low-noise",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-cinematic-target-separation-profile",
    "overview-orbit-depth",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-cinematic-quality-budget",
    "stable-high-fidelity",
  );
  await expect(
    page.locator('[data-atlas-universe-sandbox-reference-version="v47-universe-sandbox-reference-backdrop"]'),
  ).toHaveCount(1);
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-universe-sandbox-reference-mode",
    "inspired-reference-comparison",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-background-art-direction",
    "sparse-stars-layered-milky-way",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-background-depth-profile",
    "overview-sparse-layered-milky-way",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-background-subject-visibility-profile",
    "overview-orbit-readable",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-reference-screenshot-review",
    "local-only",
  );
  await expect(
    page.locator('[data-atlas-reference-grade-space-art-version="v48-reference-grade-space-art"]'),
  ).toHaveCount(1);
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-reference-grade-art-direction",
    "cinematic-scientific-space-simulation",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-reference-grade-composite-profile",
    "overview-layered-reference-grade",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-reference-grade-sky-layer-profile",
    "v48-local-generated-layered-sky",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-reference-grade-starfield-profile",
    "sparse-primary-stars",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-reference-grade-subject-matte-profile",
    "overview-no-subject-matte",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-reference-grade-planet-material-profile",
    "overview-local-hd",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-reference-grade-asset-policy",
    "generated-local-runtime-assets",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-reference-grade-review-mode",
    "local-reference-screenshot-rubric",
  );
  await expect(
    page.locator('[data-atlas-planetary-material-composition-version="v49-planetary-material-composition"]'),
  ).toHaveCount(1);
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-planetary-material-target",
    "closeup-body-material-depth",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-planetary-material-asset-policy",
    "dev-refresh-prepared-local-runtime",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-selected-body-material-profile",
    "overview-local-material",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-selected-body-atmosphere-depth-profile",
    "overview-atmosphere",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-selected-body-terminator-profile",
    "overview-terminator",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-selected-body-ring-profile",
    "no-ring-profile",
  );
  await expect(
    page.locator('[data-atlas-cinematic-closeup-director-version="v50-cinematic-closeup-director"]'),
  ).toHaveCount(1);
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-closeup-composition-target",
    "aaa-inspired-closeup-subject-composition",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-closeup-composition-profile",
    "overview-no-closeup-director",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-closeup-panel-avoidance-profile",
    "overview-no-panel-avoidance",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-closeup-ring-showcase-profile",
    "no-ring-showcase",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-closeup-quality-budget",
    "stable-high-fidelity",
  );
  await expect(
    page.locator('[data-atlas-cinematic-key-light-director-version="v51-cinematic-key-light-director"]'),
  ).toHaveCount(1);
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-key-light-target",
    "selected-body-readable-key-light-phase",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-selected-body-key-light-profile",
    "overview-natural-phase",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-key-light-quality-budget",
    "stable-high-fidelity",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-key-light-asset-policy",
    "local-runtime-assets",
  );
  await expect(
    page.locator('[data-atlas-planetary-depth-lighting-version="v52-planetary-depth-lighting"]'),
  ).toHaveCount(1);
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-depth-lighting-target",
    "closeup-atmospheric-terminator-ring-depth",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-selected-body-depth-lighting-profile",
    "overview-no-depth-lighting",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-depth-lighting-ring-shadow-cue",
    "saturn-equatorial-ring-shadow-matte",
  );
  await expect(
    page.locator('[data-atlas-planetary-color-grading-version="v53-planetary-color-grading"]'),
  ).toHaveCount(1);
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-color-grading-target",
    "closeup-planet-color-layer-depth",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-selected-body-color-grade-profile",
    "overview-neutral-color",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-color-grading-gas-layer-cue",
    "gas-layer-microcontrast",
  );
  await expect(
    page.locator('[data-atlas-numerical-integrity-version="v54-numerical-integrity-gate"]'),
  ).toHaveCount(1);
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-timestep-sensitivity-coverage",
    "covered-by-local-tests-not-runtime-claimed",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-time-reversal-coverage",
    "covered-by-local-tests-not-runtime-claimed",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-unit-audit-coverage",
    "covered-by-local-tests-not-runtime-claimed",
  );
  await expect(
    page.locator('[data-atlas-cinematic-planetary-art-version="v55-cinematic-planetary-art-direction"]'),
  ).toHaveCount(1);
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-cinematic-art-reference-mode",
    "universe-sandbox-inspired-local-comparison",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-cinematic-art-quality-target",
    "aaa-inspired-scientific-space-simulation",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-cinematic-art-asset-policy",
    "dev-refresh-prepared-local-runtime",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-global-color-grade-profile",
    "filmic-cool-space-warm-planet-protection",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-background-art-grade-profile",
    "sparse-negative-space-milky-way-depth",
  );
  await expect(
    page.locator('[data-atlas-cinematic-deep-space-backdrop-version="v56-cinematic-deep-space-backdrop"]'),
  ).toHaveCount(1);
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-cinematic-backdrop-reference-mode",
    "universe-sandbox-inspired-local-comparison",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-cinematic-backdrop-source-policy",
    "nasa-svs-prepared-local-runtime",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-cinematic-backdrop-sky-manifest",
    "orbit-atlas-v56",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-cinematic-backdrop-starfield-profile",
    "sparse-primary-stars-faint-distant-field",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-cinematic-backdrop-nebula-profile",
    "soft-local-nebula-haze-layer",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-cinematic-backdrop-negative-space-profile",
    "layered-milky-way-negative-space",
  );
  await expect(
    page.locator('[data-atlas-sparse-deep-space-version="v57-sparse-deep-space-director"]'),
  ).toHaveCount(1);
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-sparse-deep-space-reference-mode",
    "universe-sandbox-inspired-sparse-deep-space",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-sparse-deep-space-source-policy",
    "nasa-svs-16k-prepared-local-runtime",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-sparse-deep-space-sky-manifest",
    "orbit-atlas-v57",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-sparse-deep-space-starfield-profile",
    "sparse-primary-stars-ultrafaint-distant-field",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-sparse-deep-space-milky-way-profile",
    "deep-cold-gray-blue-dark-lanes",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-sparse-deep-space-nebula-profile",
    "barely-visible-local-haze",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-sparse-deep-space-negative-space-profile",
    "overview-wide-negative-space",
  );
  await expect(
    page.locator('[data-atlas-closeup-presentation-truth-version="v58-closeup-presentation-truth"]'),
  ).toHaveCount(1);
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-closeup-preview-sync-status",
    "no-selected-body",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-closeup-solar-backdrop-profile",
    "overview-sparse-sky",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-closeup-planet-readability-profile",
    "overview-readable",
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-closeup-review-mode",
    /standard|scene-review/,
  );
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-atlas-closeup-visual-target",
    "earth-saturn-sun-jupiter-closeup-fidelity",
  );
  if (testInfo.project.name.includes("mobile")) {
    await expect(page.getByRole("button", { name: /播放|暂停/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "搜索" })).toBeVisible();
    await expect(page.getByRole("button", { name: "更多" })).toBeVisible();
  } else {
    await expect(page.getByText("模拟", { exact: true })).toBeVisible();
    await expect(page.getByText("视图", { exact: true })).toBeVisible();
    await expect(page.getByText("工具", { exact: true })).toBeVisible();
  }
  await assertCanvasBackdropPixelBudget(page, "overview");
  await captureV50ReviewScreenshot(page, testInfo.outputPath(`v59-overview-${testInfo.project.name}.png`));
  await captureV104ManifestScreenshot(
    page,
    "v73-relativity-verification-readability",
    testInfo.outputPath(
      "v73-relativity-verification-readability",
      `overview-${testInfo.project.name}.png`,
    ),
  );
  await captureV104ManifestScreenshot(
    page,
    "v76-closeup-visual-fidelity",
    testInfo.outputPath(
      "v76-closeup-visual-fidelity",
      `${testInfo.project.name.includes("mobile") ? "mobile" : "desktop"}-overview-${testInfo.project.name}.png`,
    ),
  );
  await captureV104ManifestScreenshot(
    page,
    "v81-horizons-residual-decomposition",
    testInfo.outputPath(
      "v81-horizons-residual-decomposition",
      `${testInfo.project.name.includes("mobile") ? "mobile" : "desktop"}-overview-${testInfo.project.name}.png`,
    ),
  );

  await assertReducedMotionPolicy(page);
  await assertCinematicVisualContracts(page);
  await assertNavigatorKeyboardContract(page);

  await openNavigatorResult(page, "visual polish", "panel:validation-console");
  const validationConsole = page.locator('[data-atlas-validation-console-open="true"]').first();
  await expect(validationConsole).toBeVisible();
  await expect(validationConsole).toHaveAttribute("data-atlas-validation-console-open", "true");
  await expect(validationConsole.locator('[data-atlas-validation-domain-id="visual-system"]')).toHaveCount(1);
  await expect(
    validationConsole.locator('[data-atlas-validation-domain-id="relativity-verification"]'),
  ).toHaveCount(1);
  await captureV104ManifestScreenshot(
    page,
    "v73-relativity-verification-readability",
    testInfo.outputPath(
      "v73-relativity-verification-readability",
      `validation-console-${testInfo.project.name}.png`,
    ),
  );
  await expectAccessibleSurface(page, "validation-console");
  await page.keyboard.press("Escape");
  await expect(validationConsole).toBeHidden();

  await openNavigatorResult(page, "closeup director", "panel:validation-console");
  await expect(validationConsole).toBeVisible();
  await expect(validationConsole).toHaveAttribute("data-atlas-validation-console-open", "true");
  await expect(validationConsole.locator('[data-atlas-validation-domain-id="cinematic-closeup-director"]')).toHaveCount(1);
  await expect(validationConsole.locator('[data-atlas-validation-domain-id="closeup-visual-fidelity"]')).toHaveCount(1);
  await expectAccessibleSurface(page, "validation-console");
  await page.keyboard.press("Escape");
  await expect(validationConsole).toBeHidden();

  await openNavigatorResult(page, "key light", "panel:validation-console");
  await expect(validationConsole).toBeVisible();
  await expect(validationConsole).toHaveAttribute("data-atlas-validation-console-open", "true");
  await expect(validationConsole.locator('[data-atlas-validation-domain-id="cinematic-key-light-director"]')).toHaveCount(1);
  await expectAccessibleSurface(page, "validation-console");
  await page.keyboard.press("Escape");
  await expect(validationConsole).toBeHidden();

  await openNavigatorResult(page, "planet depth lighting", "panel:validation-console");
  await expect(validationConsole).toBeVisible();
  await expect(validationConsole).toHaveAttribute("data-atlas-validation-console-open", "true");
  await expect(validationConsole.locator('[data-atlas-validation-domain-id="planetary-depth-lighting"]')).toHaveCount(1);
  await expectAccessibleSurface(page, "validation-console");
  await page.keyboard.press("Escape");
  await expect(validationConsole).toBeHidden();

  await openNavigatorResult(page, "planet color grade", "panel:validation-console");
  await expect(validationConsole).toBeVisible();
  await expect(validationConsole).toHaveAttribute("data-atlas-validation-console-open", "true");
  await expect(validationConsole.locator('[data-atlas-validation-domain-id="planetary-color-grading"]')).toHaveCount(1);
  await expectAccessibleSurface(page, "validation-console");
  await page.keyboard.press("Escape");
  await expect(validationConsole).toBeHidden();

  for (const numericalQuery of ["numerical integrity", "时间反演"]) {
    await openNavigatorResult(page, numericalQuery, "panel:validation-console");
    await expect(validationConsole).toBeVisible();
    await expect(validationConsole).toHaveAttribute("data-atlas-validation-console-open", "true");
    await expect(validationConsole.locator('[data-atlas-validation-domain-id="numerical-integrity"]')).toHaveCount(1);
    await expectAccessibleSurface(page, "validation-console");
    await page.keyboard.press("Escape");
    await expect(validationConsole).toBeHidden();
  }

  await openNavigatorResult(page, "cinematic lighting", "panel:validation-console");
  await expect(validationConsole).toBeVisible();
  await expect(validationConsole).toHaveAttribute("data-atlas-validation-console-open", "true");
  await expect(validationConsole.locator('[data-atlas-validation-domain-id="cinematic-lighting"]')).toHaveCount(1);
  await expectAccessibleSurface(page, "validation-console");
  await page.keyboard.press("Escape");
  await expect(validationConsole).toBeHidden();

  await openNavigatorResult(page, "中文界面", "panel:validation-console");
  await expect(validationConsole).toBeVisible();
  await expect(validationConsole).toHaveAttribute("data-atlas-validation-console-open", "true");
  await expect(validationConsole.locator('[data-atlas-validation-domain-id="chinese-deep-space-fidelity"]')).toHaveCount(1);
  await expectAccessibleSurface(page, "validation-console");
  await page.keyboard.press("Escape");
  await expect(validationConsole).toBeHidden();

  await openNavigatorResult(page, "深空镜头", "panel:validation-console");
  await expect(validationConsole).toBeVisible();
  await expect(validationConsole).toHaveAttribute("data-atlas-validation-console-open", "true");
  await expect(validationConsole.locator('[data-atlas-validation-domain-id="cinematic-deep-space-camera"]')).toHaveCount(1);
  await expectAccessibleSurface(page, "validation-console");
  await page.keyboard.press("Escape");
  await expect(validationConsole).toBeHidden();

  for (const cameraQuery of ["3A画质", "宇宙沙盒质感"]) {
    await openNavigatorResult(page, cameraQuery, "panel:validation-console");
    await expect(validationConsole).toBeVisible();
    await expect(validationConsole).toHaveAttribute("data-atlas-validation-console-open", "true");
    await expect(validationConsole.locator('[data-atlas-validation-domain-id="cinematic-deep-space-camera"]')).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(validationConsole).toBeHidden();
  }

  for (const referenceQuery of ["宇宙沙盒背景", "3A背景", "sky benchmark"]) {
    await openNavigatorResult(page, referenceQuery, "panel:validation-console");
    await expect(validationConsole).toBeVisible();
    await expect(validationConsole).toHaveAttribute("data-atlas-validation-console-open", "true");
    await expect(validationConsole.locator('[data-atlas-validation-domain-id="universe-sandbox-reference-backdrop"]')).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(validationConsole).toBeHidden();
  }

  for (const referenceGradeQuery of ["3A美术", "银河暗带", "reference grade"]) {
    await openNavigatorResult(page, referenceGradeQuery, "panel:validation-console");
    await expect(validationConsole).toBeVisible();
    await expect(validationConsole).toHaveAttribute("data-atlas-validation-console-open", "true");
    await expect(validationConsole.locator('[data-atlas-validation-domain-id="reference-grade-space-art"]')).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(validationConsole).toBeHidden();
  }

  for (const materialQuery of ["star material", "saturn ring", "planet material"]) {
    await openNavigatorResult(page, materialQuery, "panel:validation-console");
    await expect(validationConsole).toBeVisible();
    await expect(validationConsole).toHaveAttribute("data-atlas-validation-console-open", "true");
    await expect(validationConsole.locator('[data-atlas-validation-domain-id="planetary-material-composition"]')).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(validationConsole).toBeHidden();
  }

  for (const artQuery of ["宇宙沙盒对比", "气态巨行星", "planetary art direction"]) {
    await openNavigatorResult(page, artQuery, "panel:validation-console");
    await expect(validationConsole).toBeVisible();
    await expect(validationConsole).toHaveAttribute("data-atlas-validation-console-open", "true");
    await expect(validationConsole.locator('[data-atlas-validation-domain-id="cinematic-planetary-art-direction"]')).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(validationConsole).toBeHidden();
  }

  for (const backdropQuery of ["3A宇宙背景", "银河暗带", "deep-space backdrop"]) {
    await openNavigatorResult(page, backdropQuery, "panel:validation-console");
    await expect(validationConsole).toBeVisible();
    await expect(validationConsole).toHaveAttribute("data-atlas-validation-console-open", "true");
    await expect(validationConsole.locator('[data-atlas-validation-domain-id="cinematic-deep-space-backdrop"]')).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(validationConsole).toBeHidden();
  }

  for (const sparseBackdropQuery of ["3A深空", "NASA 16K星图", "sparse deep space"]) {
    await openNavigatorResult(page, sparseBackdropQuery, "panel:validation-console");
    await expect(validationConsole).toBeVisible();
    await expect(validationConsole).toHaveAttribute("data-atlas-validation-console-open", "true");
    await expect(validationConsole.locator('[data-atlas-validation-domain-id="sparse-deep-space-director"]')).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(validationConsole).toBeHidden();
  }

  for (const closeupTruthQuery of ["closeup preview", "solar backdrop fix", "planet readability"]) {
    await openNavigatorResult(page, closeupTruthQuery, "panel:validation-console");
    await expect(validationConsole).toBeVisible();
    await expect(validationConsole).toHaveAttribute("data-atlas-validation-console-open", "true");
    await expect(validationConsole.locator('[data-atlas-validation-domain-id="closeup-presentation-truth"]')).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(validationConsole).toBeHidden();
  }

  await openNavigatorResult(page, "planet realism", "panel:validation-console");
  await expect(validationConsole).toBeVisible();
  await expect(validationConsole).toHaveAttribute("data-atlas-validation-console-open", "true");
  await expect(validationConsole.locator('[data-atlas-validation-domain-id="planetary-visual-fidelity"]')).toHaveCount(1);
  await expectAccessibleSurface(page, "validation-console");
  await page.keyboard.press("Escape");
  await expect(validationConsole).toBeHidden();

  await openNavigatorResult(page, "rc gate", "panel:validation-console");
  await expect(validationConsole).toBeVisible();
  await expect(validationConsole).toHaveAttribute("data-atlas-validation-console-open", "true");
  await expectDataAttributeValues(
    validationConsole,
    "data-atlas-validation-domain-id",
    [
      "release-gate",
      "browser-acceptance",
      "horizons-gate-audit",
      "physics-gate-split",
      "release-readiness",
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
      "relativity-explainer",
      "relativity-tour",
      "visual-system",
      "chinese-deep-space-fidelity",
      "cinematic-deep-space-camera",
      "universe-sandbox-reference-backdrop",
      "reference-grade-space-art",
      "planetary-material-composition",
      "cinematic-closeup-director",
      "cinematic-key-light-director",
      "numerical-integrity",
      "cinematic-planetary-art-direction",
      "cinematic-deep-space-backdrop",
      "sparse-deep-space-director",
      "closeup-presentation-truth",
    ],
    "Validation Console domains",
  );
  await expect(validationConsole.locator('[data-atlas-validation-domain-id="maintenance-evidence-index"]')).toHaveCount(1);
  await expect(validationConsole.locator('[data-atlas-validation-domain-id="browser-acceptance-runtime-cost-lock"]')).toHaveCount(1);
  await expect(validationConsole.locator('[data-atlas-validation-domain-id="final-gaia-art-enhancement-lock"]')).toHaveCount(1);
  await expect(validationConsole.locator('[data-atlas-validation-domain-id="release-candidate-evidence-closure-lock"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-release-gate-version="v36-release-candidate-gate"]')).toHaveCount(1);
  await expectAccessibleSurface(page, "validation-console");
  await page.keyboard.press("Escape");
  await expect(validationConsole).toBeHidden();

  await openNavigatorResult(page, "relativity tour", "panel:atlas-workflows");
  const workflowPanel = page.getByRole("complementary", {
    exact: true,
    name: "图谱流程",
  });
  await expect(workflowPanel).toBeVisible();
  await expect(workflowPanel).toHaveAttribute(
    "data-relativity-guided-tour-workflow-id",
    "relativity-guided-tour",
  );
  await expect(page.locator('[data-atlas-workflow-id="relativity-guided-tour"]')).toHaveAttribute(
    "data-relativity-guided-tour-step-count",
    "7",
  );
  await expectAccessibleSurface(page, "atlas-workflows");
  await page.locator('[data-atlas-workflow-id="relativity-guided-tour"]').click();
  await expect(page.locator('[data-relativity-guided-tour-step-id]')).toHaveCount(7);
  await page.locator('[data-relativity-guided-tour-step-id="tour-mercury-precession"] button').click();
  await expect(page.locator('[data-relativity-observable-panel-version="v37-relativity-observable-atlas"]')).toHaveCount(1);
  await expect(page.locator("[data-relativity-explainer-card-id]")).toHaveCount(7);
  await expectAccessibleSurface(page, "relativity-observables");
  await captureV104ManifestScreenshot(
    page,
    "v73-relativity-verification-readability",
    testInfo.outputPath(
      "v73-relativity-verification-readability",
      `observable-atlas-${testInfo.project.name}.png`,
    ),
  );
  await closePanel(page, "关闭相对论可观测图谱");
  await closePanel(page, "关闭图谱流程");

  await openNavigatorResult(page, "formula steps", "panel:relativity-observables");
  const observablePanel = page.locator('[data-relativity-observable-panel-version="v37-relativity-observable-atlas"]');
  await expect(observablePanel).toHaveCount(1);
  await expect(observablePanel).toHaveAttribute("data-relativity-observable-count", "7");
  await expect(observablePanel).toHaveAttribute(
    "data-relativity-explainer-version",
    "v39-relativity-observable-explainer",
  );
  await expect(observablePanel).toHaveAttribute("data-relativity-explainer-card-count", "7");
  await expect(observablePanel).toHaveAttribute("data-relativity-explainer-step-count", "28");
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-relativity-verification-version",
    "v73-relativity-verification-readability",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-relativity-benchmark-profile",
    "v73-weak-field-kerr-benchmark-readout",
  );
  await expect(observablePanel).toHaveAttribute("data-atlas-relativity-weak-field-count", "4");
  await expect(observablePanel).toHaveAttribute("data-atlas-relativity-strong-field-count", "2");
  await expect(observablePanel).toHaveAttribute("data-atlas-relativity-numerical-health-count", "1");
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-relativity-kerr-kernel",
    "eih-1pn+kerr-geodesic-v17",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-relativity-chart-version",
    "v74-relativity-verification-charts",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-relativity-chart-profile",
    "v74-newtonian-eih-kerr-readout-curves",
  );
  await expect(observablePanel).toHaveAttribute("data-atlas-relativity-chart-mercury-points", "5");
  await expect(observablePanel).toHaveAttribute("data-atlas-relativity-chart-isco-bars", "3");
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-relativity-chart-hamiltonian-classification",
    "numerical-health-only",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-physics-benchmark-gate-version",
    "v75-physics-benchmark-release-gate",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-physics-benchmark-budget-profile",
    "v75-weak-field-horizons-kerr-error-budget",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-physics-benchmark-runtime-status",
    /pass|pending|fail/,
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-physics-benchmark-ci-certification",
    "not-claimed-in-app",
  );
  await expect(page.locator("[data-atlas-physics-benchmark-gate-strip]")).toHaveCount(1);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-horizons-gate-audit-version",
    "v77-horizons-gate-closure-audit",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-horizons-gate-audit-profile",
    "v77-j2000-frame-unit-integrator-audit",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-horizons-gate-audit-status",
    /pending-runtime-run|blocked-model-limit|blocked-reference-frame-mismatch|blocked-runner-bug-unresolved|pass/,
  );
  await expect(page.locator("[data-atlas-horizons-gate-audit-strip]")).toHaveCount(1);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-physics-gate-split-version",
    "v78-product-scientific-physics-gate-split",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-product-release-gate-status",
    "pass",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-scientific-horizons-gate-status",
    /pending-runtime-run|blocked-model-limit|pass/,
  );
  await expect(page.locator("[data-atlas-physics-gate-split-strip]")).toHaveCount(1);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-scientific-gate-preflight-version",
    "v80-scientific-horizons-closure-preflight",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-scientific-gate-preflight-profile",
    "v80-horizons-model-limit-upgrade-roadmap",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-scientific-gate-preflight-status",
    "product-ready-strict-scientific-blocked-preflight-ready",
  );
  await expect(page.locator("[data-atlas-scientific-gate-preflight-strip]")).toHaveCount(1);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-horizons-residual-decomposition-version",
    "v81-horizons-residual-decomposition",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-horizons-residual-decomposition-profile",
    "v81-rtn-body-checkpoint-error-attribution",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-horizons-residual-decomposition-status",
    /pending-runtime-run|ready-blocked-model-limit|ready-pass/,
  );
  await expect(page.locator("[data-atlas-horizons-residual-decomposition-strip]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-horizons-residual-table]")).toHaveCount(1);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-horizons-candidate-lab-version",
    "v82-horizons-dynamical-parameter-candidate-lab",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-horizons-candidate-lab-profile",
    "v82-de440-gm-softening-step-hierarchy-matrix",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-horizons-candidate-lab-status",
    /pending-offline-run|candidate-partial-unapplied|candidate-pass-unapplied/,
  );
  await expect(page.locator("[data-atlas-horizons-candidate-lab-strip]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-horizons-candidate-table]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-horizons-candidate-id]")).toHaveCount(5);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-pluto-residual-isolation-version",
    "v83-pluto-residual-cause-isolation",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-pluto-residual-isolation-profile",
    "v83-outer-system-phase-force-model-matrix",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-pluto-residual-isolation-status",
    /pending-runtime-run|ready-candidate-limited|ready-candidate-actionable/,
  );
  await expect(page.locator("[data-atlas-pluto-residual-isolation-strip]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-pluto-residual-isolation-table]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-pluto-residual-isolation-candidate-id]")).toHaveCount(6);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-outer-system-force-model-preflight-version",
    "v84-outer-system-force-model-preflight",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-outer-system-force-model-preflight-profile",
    "v84-pluto-barycenter-tno-force-model-upgrade-path",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-outer-system-force-model-preflight-status",
    /pending-runtime-run|ready-fixture-provenance-blocked|ready-upgrade-path-limited|ready-upgrade-path-actionable/,
  );
  await expect(page.locator("[data-atlas-outer-system-force-model-preflight-strip]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-outer-system-force-model-preflight-table]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-outer-system-force-model-preflight-candidate-id]")).toHaveCount(5);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-outer-system-reference-adoption-version",
    "v85-outer-system-reference-adoption-preflight",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-outer-system-reference-adoption-profile",
    "v85-barycentric-fixture-adoption-readiness",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-outer-system-reference-adoption-status",
    /pending-runtime-run|ready-adoption-candidate|ready-adoption-blocked|ready-default-gate-blocked/,
  );
  await expect(page.locator("[data-atlas-outer-system-reference-adoption-strip]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-outer-system-reference-adoption-table]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-outer-system-reference-adoption-candidate-id]")).toHaveCount(1);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-horizons-candidate-scientific-gate-version",
    "v86-horizons-candidate-scientific-gate",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-horizons-candidate-scientific-gate-profile",
    "v86-barycentric-reference-candidate-gate",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-horizons-candidate-scientific-gate-status",
    /pending-runtime-run|candidate-gate-pass-unapplied|candidate-gate-fail|candidate-gate-blocked/,
  );
  await expect(page.locator("[data-atlas-horizons-candidate-scientific-gate-strip]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-horizons-candidate-scientific-gate-table]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-horizons-candidate-scientific-gate-candidate-id]")).toHaveCount(1);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-strict-horizons-migration-dry-run-version",
    "v87-strict-horizons-migration-dry-run",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-strict-horizons-migration-dry-run-profile",
    "v87-default-gate-migration-diff-audit",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-strict-horizons-migration-dry-run-status",
    /pending-runtime-run|ready-migration-diff-complete|ready-migration-blocked|ready-default-gate-still-blocked/,
  );
  await expect(page.locator("[data-atlas-strict-horizons-migration-dry-run-strip]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-strict-horizons-migration-dry-run-table]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-strict-horizons-migration-dry-run-row-id]")).toHaveCount(1);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-strict-horizons-shadow-migration-gate-version",
    "v88-strict-horizons-shadow-migration-gate",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-strict-horizons-shadow-migration-gate-profile",
    "v88-parallel-default-gate-rehearsal",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-strict-horizons-shadow-migration-gate-status",
    /pending-runtime-run|ready-shadow-gate-pass|ready-shadow-gate-blocked|ready-default-gate-still-blocked/,
  );
  await expect(page.locator("[data-atlas-strict-horizons-shadow-migration-gate-strip]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-strict-horizons-shadow-migration-gate-table]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-strict-horizons-shadow-migration-gate-row-id]")).toHaveCount(1);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-default-strict-horizons-migration-version",
    "v89-default-strict-horizons-scientific-gate-migration",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-default-strict-horizons-migration-profile",
    "v89-apply-barycentric-reference-default-gate",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-default-strict-horizons-migration-status",
    /pending-runtime-run|ready-default-gate-migrated|ready-migration-blocked|ready-legacy-v75-blocker-preserved/,
  );
  await expect(page.locator("[data-atlas-default-strict-horizons-migration-strip]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-default-strict-horizons-migration-table]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-default-strict-horizons-migration-row-id]")).toHaveCount(1);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-horizons-provenance-freeze-version",
    "v90-horizons-provenance-freeze",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-horizons-provenance-freeze-profile",
    "v90-default-gate-command-fixture-hash-lock",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-horizons-provenance-freeze-status",
    /pending-runtime-run|ready-freeze-locked|ready-freeze-blocked|ready-legacy-audit-preserved/,
  );
  await expect(page.locator("[data-atlas-horizons-provenance-freeze-strip]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-horizons-provenance-freeze-table]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-horizons-provenance-freeze-row-id]")).toHaveCount(1);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-offline-runtime-boundary-audit-version",
    "v91-offline-runtime-boundary-audit",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-offline-runtime-boundary-audit-profile",
    "v91-scientific-gate-runtime-boundary-lock",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-offline-runtime-boundary-audit-status",
    /pending-runtime-run|ready-boundary-locked|ready-boundary-blocked|ready-runtime-claims-clean/,
  );
  await expect(page.locator("[data-atlas-offline-runtime-boundary-audit-strip]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-offline-runtime-boundary-audit-table]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-offline-runtime-boundary-audit-row-id]")).toHaveCount(1);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-scientific-gate-maintenance-runbook-version",
    "v92-scientific-gate-maintenance-runbook-lock",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-scientific-gate-maintenance-runbook-profile",
    "v92-offline-gate-release-rollback-command-runbook",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-scientific-gate-maintenance-runbook-status",
    /pending-runtime-run|ready-runbook-locked|ready-runbook-blocked|ready-rollback-audit-preserved/,
  );
  await expect(page.locator("[data-atlas-scientific-gate-maintenance-runbook-strip]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-scientific-gate-maintenance-runbook-table]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-scientific-gate-maintenance-runbook-row-id]")).toHaveCount(1);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-scientific-gate-release-evidence-version",
    "v93-scientific-gate-release-evidence-lock",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-scientific-gate-release-evidence-profile",
    "v93-offline-gate-release-evidence-bundle",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-scientific-gate-release-evidence-status",
    /pending-runtime-run|ready-release-evidence-locked|ready-release-evidence-blocked|ready-release-verification-matrix-locked/,
  );
  await expect(page.locator("[data-atlas-scientific-gate-release-evidence-strip]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-scientific-gate-release-evidence-table]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-scientific-gate-release-evidence-row-id]")).toHaveCount(1);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-browser-ci-stability-lock-version",
    "v94-browser-ci-stability-lock",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-browser-ci-stability-lock-profile",
    "v94-fresh-browser-ci-runtime-stability",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-browser-ci-stability-lock-status",
    /pending-runtime-run|ready-browser-ci-locked|ready-browser-ci-blocked|ready-fresh-teardown-preserved/,
  );
  await expect(page.locator("[data-atlas-browser-ci-stability-lock-strip]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-browser-ci-stability-lock-table]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-browser-ci-stability-lock-row-id]")).toHaveCount(1);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-release-artifact-manifest-lock-version",
    "v95-release-artifact-manifest-lock",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-release-artifact-manifest-lock-profile",
    "v95-offline-release-artifact-manifest",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-release-artifact-manifest-lock-status",
    /pending-runtime-run|ready-artifact-manifest-locked|ready-artifact-manifest-blocked|ready-release-bundle-indexed/,
  );
  await expect(page.locator("[data-atlas-release-artifact-manifest-lock-strip]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-release-artifact-manifest-lock-table]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-release-artifact-manifest-lock-row-id]")).toHaveCount(1);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-final-maintenance-baseline-version",
    "v96-final-maintenance-baseline",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-final-maintenance-baseline-profile",
    "v96-final-offline-maintenance-baseline",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-final-maintenance-baseline-status",
    /pending-runtime-run|ready-maintenance-baseline-locked|ready-maintenance-baseline-blocked|ready-post-baseline-boundary-locked/,
  );
  await expect(page.locator("[data-atlas-final-maintenance-baseline-strip]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-final-maintenance-baseline-table]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-final-maintenance-baseline-row-id]")).toHaveCount(1);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-gaia-starfield-enhancement-version",
    "v97-gaia-starfield-enhancement",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-gaia-starfield-enhancement-profile",
    "v97-gaia-constellation-nebula-overlay",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-gaia-starfield-enhancement-status",
    /pending-runtime-run|ready-gaia-overlay-locked|ready-gaia-overlay-blocked|ready-visual-overlay-budgeted/,
  );
  await expect(page.locator("[data-atlas-gaia-starfield-enhancement-strip]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-gaia-starfield-enhancement-table]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-gaia-starfield-enhancement-row-id]")).toHaveCount(1);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-relativity-simulation-optimization-version",
    "v98-relativity-simulation-optimization",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-relativity-simulation-optimization-profile",
    "v98-relativity-observability-teaching-layer",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-relativity-simulation-optimization-status",
    /pending-runtime-run|ready-relativity-optimization-locked|ready-relativity-optimization-blocked|ready-teaching-overlay-budgeted/,
  );
  await expect(page.locator("[data-atlas-relativity-simulation-optimization-strip]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-relativity-simulation-optimization-table]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-relativity-simulation-optimization-row-id]")).toHaveCount(1);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-art-polish-version",
    "v99-art-polish",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-art-polish-profile",
    "v99-gaia-overlay-closeup-presentation-polish",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-art-polish-status",
    /pending-runtime-run|ready-art-polish-locked|ready-art-polish-blocked|ready-presentation-layer-budgeted/,
  );
  await expect(page.locator("[data-atlas-art-polish-strip]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-art-polish-table]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-art-polish-row-id]")).toHaveCount(1);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-post-enhancement-baseline-version",
    "v100-post-enhancement-maintenance-baseline",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-post-enhancement-baseline-profile",
    "v100-v97-v99-visual-teaching-maintenance-lock",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-post-enhancement-baseline-status",
    /pending-runtime-run|ready-post-enhancement-baseline-locked|ready-post-enhancement-baseline-blocked|ready-post-enhancement-evidence-indexed/,
  );
  await expect(page.locator("[data-atlas-post-enhancement-baseline-strip]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-post-enhancement-baseline-table]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-post-enhancement-baseline-row-id]")).toHaveCount(1);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-browser-resource-performance-version",
    "v101-browser-resource-performance-lock",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-browser-resource-performance-profile",
    "v101-fresh-browser-resource-performance",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-browser-resource-performance-status",
    /pending-runtime-run|ready-browser-resource-performance-locked|ready-browser-resource-performance-blocked|ready-browser-resource-optimized/,
  );
  await expect(page.locator("[data-atlas-browser-resource-performance-strip]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-browser-resource-performance-table]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-browser-resource-performance-row-id]")).toHaveCount(1);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-maintenance-evidence-index-version",
    "v102-maintenance-evidence-index",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-maintenance-evidence-index-profile",
    "v102-v93-v101-maintenance-evidence-index",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-maintenance-evidence-index-status",
    /pending-runtime-run|ready-maintenance-evidence-indexed|ready-maintenance-evidence-blocked|ready-repo-hygiene-policy-locked/,
  );
  await expect(page.locator("[data-atlas-maintenance-evidence-index-strip]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-maintenance-evidence-index-table]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-maintenance-evidence-index-row-id]")).toHaveCount(1);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-presentation-runtime-performance-version",
    "v103-presentation-runtime-performance-lock",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-presentation-runtime-performance-profile",
    "v103-gaia-constellation-label-runtime-cost",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-presentation-runtime-performance-status",
    /pending-runtime-run|ready-presentation-runtime-performance-locked|ready-presentation-runtime-performance-blocked|ready-presentation-runtime-optimized/,
  );
  await expect(page.locator("[data-atlas-presentation-runtime-performance-strip]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-presentation-runtime-performance-table]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-presentation-runtime-performance-row-id]")).toHaveCount(1);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-browser-acceptance-runtime-cost-version",
    "v104-browser-acceptance-runtime-cost-lock",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-browser-acceptance-runtime-cost-profile",
    "v104-fresh-browser-acceptance-cost-review",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-browser-acceptance-runtime-cost-status",
    /pending-runtime-run|ready-browser-acceptance-runtime-cost-locked|ready-browser-acceptance-runtime-cost-blocked|ready-browser-acceptance-runtime-cost-reduced/,
  );
  await expect(page.locator("[data-atlas-browser-acceptance-runtime-cost-strip]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-browser-acceptance-runtime-cost-table]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-browser-acceptance-runtime-cost-row-id]")).toHaveCount(1);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-final-gaia-art-enhancement-version",
    "v105-final-gaia-art-enhancement-lock",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-final-gaia-art-enhancement-profile",
    "v105-budget-preserved-gaia-art-polish",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-final-gaia-art-enhancement-status",
    /pending-runtime-run|ready-final-gaia-art-locked|ready-final-gaia-art-blocked|ready-budget-preserved-gaia-enhanced/,
  );
  await expect(page.locator("[data-atlas-final-gaia-art-enhancement-strip]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-final-gaia-art-enhancement-table]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-final-gaia-art-enhancement-row-id]")).toHaveCount(1);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-rc-evidence-closure-version",
    "v106-release-candidate-evidence-closure-lock",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-rc-evidence-closure-profile",
    "v106-v93-v105-final-rc-evidence-closure",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-rc-evidence-closure-status",
    /pending-runtime-run|ready-rc-evidence-closed|ready-rc-evidence-blocked|ready-rc-handoff-indexed/,
  );
  await expect(page.locator("[data-atlas-rc-evidence-closure-strip]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-rc-evidence-closure-table]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-rc-evidence-closure-row-id]")).toHaveCount(1);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-interaction-catalog-completion-version",
    "v107-interaction-catalog-completion-lock",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-interaction-catalog-completion-profile",
    "v107-camera-launch-gaia-navigation-catalog-completion",
  );
  await expect(page.locator("[data-atlas-interaction-catalog-completion-strip]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-interaction-catalog-completion-table]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-interaction-catalog-completion-row-id]")).toHaveCount(1);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-interaction-repair-launch-ux-version",
    "v108-interaction-repair-launch-ux-lock",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-interaction-repair-launch-ux-profile",
    "v108-sky-target-zoom-launch-ux-repair",
  );
  await expect(page.locator("[data-atlas-interaction-repair-launch-ux-strip]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-interaction-repair-launch-ux-table]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-interaction-repair-launch-ux-row-id]")).toHaveCount(1);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-interaction-visual-quality-version",
    "v109-interaction-visual-quality-lock",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-interaction-visual-quality-profile",
    "v109-launch-camera-gaia-material-quality",
  );
  await expect(page.locator("[data-atlas-interaction-visual-quality-strip]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-interaction-visual-quality-table]")).toHaveCount(1);
  await expect(page.locator("[data-atlas-interaction-visual-quality-row-id]")).toHaveCount(1);
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-critical-ui-relativity-visibility-version",
    "v110-critical-ui-relativity-visibility-lock",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-camera-stellar-closeup-version",
    "v111-camera-stellar-closeup-lock",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-launch-gameplay-openrocket-bridge-version",
    "v112-launch-gameplay-openrocket-bridge-lock",
  );
  await expect(observablePanel).toHaveAttribute(
    "data-atlas-scientific-model-upgrade-contract-version",
    "v113-scientific-model-upgrade-contract",
  );
  await expect(page.locator('[data-atlas-relativity-core-panel="true"]')).toHaveCount(1);
  await expect(page.locator("[data-relativity-observable-row-id]")).toHaveCount(7);
  await expect(page.locator('[data-relativity-observable-kind="weak-field"]')).toHaveCount(4);
  await expect(page.locator('[data-relativity-observable-kind="strong-field"]')).toHaveCount(2);
  await expect(page.locator('[data-relativity-observable-kind="numerical-health"]')).toHaveCount(1);
  await expect(
    page.locator('[data-atlas-relativity-classification^="Weak-field observable"]'),
  ).toHaveCount(4);
  await expect(
    page.locator('[data-atlas-relativity-classification^="Kerr test-particle reference"]'),
  ).toHaveCount(2);
  await expect(
    page.locator('[data-atlas-relativity-classification^="Numerical-health only"]'),
  ).toHaveCount(1);
  await expect(page.locator('[data-atlas-relativity-chart-id="mercury-newtonian-eih-1pn"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-relativity-chart-id="kerr-isco-hamiltonian"]')).toHaveCount(1);
  await expect(page.locator("[data-atlas-relativity-isco-bar-id]")).toHaveCount(3);
  await expect(page.locator('[data-relativity-observable-scale-band="weak-field-precision"]')).toHaveCount(4);
  await expect(page.locator('[data-relativity-observable-scale-band="strong-field-geometry"]')).toHaveCount(2);
  await expect(page.locator('[data-relativity-observable-scale-band="numerical-health-boundary"]')).toHaveCount(1);
  await expect(page.locator("[data-relativity-explainer-card-id]")).toHaveCount(7);
  await expect(page.locator('[data-relativity-explainer-card-id][data-relativity-explainer-step-count="4"]')).toHaveCount(7);
  const explainerVariableCounts = await page.evaluate(() =>
    Array.from(document.querySelectorAll("[data-relativity-explainer-card-id]")).map((card) =>
      Number(card.getAttribute("data-relativity-explainer-variable-count") ?? "0"),
    ),
  );
  expect(explainerVariableCounts.every((count) => count >= 4)).toBe(true);
  await expectAccessibleSurface(page, "relativity-observables");
  await captureV104ManifestScreenshot(
    page,
    "v73-relativity-verification-readability",
    testInfo.outputPath(
      "v73-relativity-verification-readability",
      `verification-readout-${testInfo.project.name}.png`,
    ),
  );
  await scrollEvidenceIntoView(page, "[data-atlas-interaction-catalog-completion-table]");
  await captureV104ManifestScreenshot(
    page,
    "v107-interaction-catalog-completion-lock",
    testInfo.outputPath(
      "v107-interaction-catalog-completion-lock",
      `interaction-catalog-completion-lock-${testInfo.project.name}.png`,
    ),
  );
  await scrollEvidenceIntoView(page, "[data-atlas-interaction-repair-launch-ux-table]");
  await captureV104ManifestScreenshot(
    page,
    "v108-interaction-repair-launch-ux-lock",
    testInfo.outputPath(
      "v108-interaction-repair-launch-ux-lock",
      `interaction-repair-launch-ux-lock-${testInfo.project.name}.png`,
    ),
  );
  await scrollEvidenceIntoView(page, "[data-atlas-interaction-visual-quality-table]");
  await captureV104ManifestScreenshot(
    page,
    "v109-interaction-visual-quality-lock",
    testInfo.outputPath(
      "v109-interaction-visual-quality-lock",
      `interaction-visual-quality-lock-${testInfo.project.name}.png`,
    ),
  );
  await captureV104ManifestScreenshot(
    page,
    "v74-relativity-verification-charts",
    testInfo.outputPath(
      "v74-relativity-verification-charts",
      `relativity-charts-${testInfo.project.name}.png`,
    ),
  );
  await captureV104ManifestScreenshot(
    page,
    "v75-physics-benchmark-release-gate",
    testInfo.outputPath(
      "v75-physics-benchmark-release-gate",
      `physics-benchmark-gate-${testInfo.project.name}.png`,
    ),
  );
  await captureV104ManifestScreenshot(
    page,
    "v78-product-scientific-physics-gate-split",
    testInfo.outputPath(
      "v78-product-scientific-physics-gate-split",
      `physics-gate-split-${testInfo.project.name}.png`,
    ),
  );
  await scrollEvidenceIntoView(page, "[data-atlas-horizons-residual-table]");
  await captureV104ManifestScreenshot(
    page,
    "v81-horizons-residual-decomposition",
    testInfo.outputPath(
      "v81-horizons-residual-decomposition",
      `rtn-residual-attribution-${testInfo.project.name}.png`,
    ),
  );
  await scrollEvidenceIntoView(page, "[data-atlas-horizons-candidate-table]");
  await captureV104ManifestScreenshot(
    page,
    "v82-horizons-dynamical-parameter-candidate-lab",
    testInfo.outputPath(
      "v82-horizons-dynamical-parameter-candidate-lab",
      `candidate-lab-${testInfo.project.name}.png`,
    ),
  );
  await scrollEvidenceIntoView(page, "[data-atlas-pluto-residual-isolation-table]");
  await captureV104ManifestScreenshot(
    page,
    "v83-pluto-residual-cause-isolation",
    testInfo.outputPath(
      "v83-pluto-residual-cause-isolation",
      `pluto-isolation-${testInfo.project.name}.png`,
    ),
  );

  await page.getByRole("button", { exact: true, name: "Kerr 工作室" }).click();
  await scrollEvidenceIntoView(page, "[data-atlas-outer-system-force-model-preflight-table]");
  await captureV104ManifestScreenshot(
    page,
    "v84-outer-system-force-model-preflight",
    testInfo.outputPath(
      "v84-outer-system-force-model-preflight",
      `outer-system-preflight-${testInfo.project.name}.png`,
    ),
  );
  await scrollEvidenceIntoView(page, "[data-atlas-outer-system-reference-adoption-table]");
  await captureV104ManifestScreenshot(
    page,
    "v85-outer-system-reference-adoption-preflight",
    testInfo.outputPath(
      "v85-outer-system-reference-adoption-preflight",
      `outer-system-reference-adoption-${testInfo.project.name}.png`,
    ),
  );
  await scrollEvidenceIntoView(page, "[data-atlas-horizons-candidate-scientific-gate-table]");
  await captureV104ManifestScreenshot(
    page,
    "v86-horizons-candidate-scientific-gate",
    testInfo.outputPath(
      "v86-horizons-candidate-scientific-gate",
      `horizons-candidate-scientific-gate-${testInfo.project.name}.png`,
    ),
  );
  await scrollEvidenceIntoView(page, "[data-atlas-strict-horizons-migration-dry-run-table]");
  await captureV104ManifestScreenshot(
    page,
    "v87-strict-horizons-migration-dry-run",
    testInfo.outputPath(
      "v87-strict-horizons-migration-dry-run",
      `strict-horizons-migration-dry-run-${testInfo.project.name}.png`,
    ),
  );
  await scrollEvidenceIntoView(page, "[data-atlas-strict-horizons-shadow-migration-gate-table]");
  await captureV104ManifestScreenshot(
    page,
    "v88-strict-horizons-shadow-migration-gate",
    testInfo.outputPath(
      "v88-strict-horizons-shadow-migration-gate",
      `strict-horizons-shadow-migration-gate-${testInfo.project.name}.png`,
    ),
  );
  await scrollEvidenceIntoView(page, "[data-atlas-default-strict-horizons-migration-table]");
  await captureV104ManifestScreenshot(
    page,
    "v89-default-strict-horizons-scientific-gate-migration",
    testInfo.outputPath(
      "v89-default-strict-horizons-scientific-gate-migration",
      `default-strict-horizons-migration-${testInfo.project.name}.png`,
    ),
  );
  await scrollEvidenceIntoView(page, "[data-atlas-horizons-provenance-freeze-table]");
  await captureV104ManifestScreenshot(
    page,
    "v90-horizons-provenance-freeze",
    testInfo.outputPath(
      "v90-horizons-provenance-freeze",
      `horizons-provenance-freeze-${testInfo.project.name}.png`,
    ),
  );
  await scrollEvidenceIntoView(page, "[data-atlas-offline-runtime-boundary-audit-table]");
  await captureV104ManifestScreenshot(
    page,
    "v91-offline-runtime-boundary-audit",
    testInfo.outputPath(
      "v91-offline-runtime-boundary-audit",
      `offline-runtime-boundary-audit-${testInfo.project.name}.png`,
    ),
  );
  await scrollEvidenceIntoView(page, "[data-atlas-scientific-gate-maintenance-runbook-table]");
  await captureV104ManifestScreenshot(
    page,
    "v92-scientific-gate-maintenance-runbook-lock",
    testInfo.outputPath(
      "v92-scientific-gate-maintenance-runbook-lock",
      `scientific-gate-maintenance-runbook-${testInfo.project.name}.png`,
    ),
  );
  await scrollEvidenceIntoView(page, "[data-atlas-scientific-gate-release-evidence-table]");
  await captureV104ManifestScreenshot(
    page,
    "v93-scientific-gate-release-evidence-lock",
    testInfo.outputPath(
      "v93-scientific-gate-release-evidence-lock",
      `scientific-gate-release-evidence-${testInfo.project.name}.png`,
    ),
  );
  await scrollEvidenceIntoView(page, "[data-atlas-browser-ci-stability-lock-table]");
  await captureV104ManifestScreenshot(
    page,
    "v94-browser-ci-stability-lock",
    testInfo.outputPath(
      "v94-browser-ci-stability-lock",
      `browser-ci-stability-lock-${testInfo.project.name}.png`,
    ),
  );
  await scrollEvidenceIntoView(page, "[data-atlas-release-artifact-manifest-lock-table]");
  await captureV104ManifestScreenshot(
    page,
    "v95-release-artifact-manifest-lock",
    testInfo.outputPath(
      "v95-release-artifact-manifest-lock",
      `release-artifact-manifest-lock-${testInfo.project.name}.png`,
    ),
  );
  await scrollEvidenceIntoView(page, "[data-atlas-final-maintenance-baseline-table]");
  await captureV104ManifestScreenshot(
    page,
    "v96-final-maintenance-baseline",
    testInfo.outputPath(
      "v96-final-maintenance-baseline",
      `final-maintenance-baseline-${testInfo.project.name}.png`,
    ),
  );
  await scrollEvidenceIntoView(page, "[data-atlas-gaia-starfield-enhancement-table]");
  await captureV104ManifestScreenshot(
    page,
    "v97-gaia-starfield-enhancement",
    testInfo.outputPath(
      "v97-gaia-starfield-enhancement",
      `gaia-starfield-enhancement-${testInfo.project.name}.png`,
    ),
  );
  await scrollEvidenceIntoView(page, "[data-atlas-relativity-simulation-optimization-table]");
  await captureV104ManifestScreenshot(
    page,
    "v98-relativity-simulation-optimization",
    testInfo.outputPath(
      "v98-relativity-simulation-optimization",
      `relativity-simulation-optimization-${testInfo.project.name}.png`,
    ),
  );
  await scrollEvidenceIntoView(page, "[data-atlas-art-polish-table]");
  await captureV104ManifestScreenshot(
    page,
    "v99-art-polish",
    testInfo.outputPath(
      "v99-art-polish",
      `art-polish-${testInfo.project.name}.png`,
    ),
  );
  await scrollEvidenceIntoView(page, "[data-atlas-post-enhancement-baseline-table]");
  await captureV104ManifestScreenshot(
    page,
    "v100-post-enhancement-maintenance-baseline",
    testInfo.outputPath(
      "v100-post-enhancement-maintenance-baseline",
      `post-enhancement-maintenance-baseline-${testInfo.project.name}.png`,
    ),
  );
  await scrollEvidenceIntoView(page, "[data-atlas-browser-resource-performance-table]");
  await captureV104ManifestScreenshot(
    page,
    "v101-browser-resource-performance-lock",
    testInfo.outputPath(
      "v101-browser-resource-performance-lock",
      `browser-resource-performance-lock-${testInfo.project.name}.png`,
    ),
  );
  await scrollEvidenceIntoView(page, "[data-atlas-maintenance-evidence-index-table]");
  await captureV104ManifestScreenshot(
    page,
    "v102-maintenance-evidence-index",
    testInfo.outputPath(
      "v102-maintenance-evidence-index",
      `maintenance-evidence-index-${testInfo.project.name}.png`,
    ),
  );
  await scrollEvidenceIntoView(page, "[data-atlas-presentation-runtime-performance-table]");
  await captureV104ManifestScreenshot(
    page,
    "v103-presentation-runtime-performance-lock",
    testInfo.outputPath(
      "v103-presentation-runtime-performance-lock",
      `presentation-runtime-performance-lock-${testInfo.project.name}.png`,
    ),
  );
  await scrollEvidenceIntoView(page, "[data-atlas-browser-acceptance-runtime-cost-table]");
  await captureV104ManifestScreenshot(
    page,
    "v104-browser-acceptance-runtime-cost-lock",
    testInfo.outputPath(
      "v104-browser-acceptance-runtime-cost-lock",
      `browser-acceptance-runtime-cost-lock-${testInfo.project.name}.png`,
    ),
  );
  await scrollEvidenceIntoView(page, "[data-atlas-final-gaia-art-enhancement-table]");
  await captureV104ManifestScreenshot(
    page,
    "v105-final-gaia-art-enhancement-lock",
    testInfo.outputPath(
      "v105-final-gaia-art-enhancement-lock",
      `final-gaia-art-enhancement-lock-${testInfo.project.name}.png`,
    ),
  );
  await scrollEvidenceIntoView(page, "[data-atlas-rc-evidence-closure-table]");
  await captureV104ManifestScreenshot(
    page,
    "v106-release-candidate-evidence-closure-lock",
    testInfo.outputPath(
      "v106-release-candidate-evidence-closure-lock",
      `release-candidate-evidence-closure-lock-${testInfo.project.name}.png`,
    ),
  );

  await expect(page.locator('[data-kerr-relativity-studio-version="v35-kerr-relativity-studio"]').first()).toBeVisible();
  expect(await page.locator('[data-kerr-relativity-studio-version="v35-kerr-relativity-studio"]').count()).toBeGreaterThan(0);
  expect(await page.locator('[data-kerr-studio-boundary="test-particle-null-geodesic-lab"]').count()).toBeGreaterThan(0);
  await expect(page.locator("body")).toHaveAttribute(
    "data-relativity-kernel",
    "eih-1pn+kerr-geodesic-v17",
  );
  const kerrStudio = page.locator('[data-atlas-accessibility-surface-id="kerr-relativity-studio"]');
  await expect(kerrStudio).toBeFocused();
  const kerrToggle = kerrStudio.getByRole("button", { exact: true, name: "Kerr Relativity Studio" });
  await kerrToggle.click();
  await expect(kerrToggle).toHaveAttribute("aria-expanded", "true");
  await captureV104ManifestScreenshot(
    page,
    "v73-relativity-verification-readability",
    testInfo.outputPath(
      "v73-relativity-verification-readability",
      `kerr-studio-${testInfo.project.name}.png`,
    ),
  );
  await expectAccessibleSurface(page, "kerr-relativity-studio", false);
  await kerrToggle.press("Escape");
  await expect(kerrToggle).toHaveAttribute("aria-expanded", "false");
  await closePanel(page, "关闭相对论可观测图谱");

  await openNavigatorResult(page, "relativity tour", "panel:atlas-workflows");
  await page.locator('[data-atlas-workflow-id="relativity-guided-tour"]').click();
  await page.locator('[data-relativity-guided-tour-step-id="tour-kerr-null-probe"] button').click();
  expect(await page.locator('[data-kerr-relativity-studio-version="v35-kerr-relativity-studio"]').count()).toBeGreaterThan(0);
  expect(await page.locator('[data-kerr-studio-boundary="test-particle-null-geodesic-lab"]').count()).toBeGreaterThan(0);
  await expect(page.locator("body")).toHaveAttribute(
    "data-relativity-kernel",
    "eih-1pn+kerr-geodesic-v17",
  );
  await closePanel(page, "关闭图谱流程");

  await openNavigatorResult(page, "evidence ledger", "panel:evidence-ledger");
  await expectAccessibleSurface(page, "evidence-ledger");
  await expectDataAttributeValues(
    page,
    "data-evidence-claim-id",
    [
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
    ],
    "Evidence Ledger claims",
  );
  await expect(page.locator('[data-evidence-claim-id="maintenance-evidence-index"]')).toHaveCount(1);
  await expect(page.locator('[data-evidence-claim-id="browser-acceptance-runtime-cost-lock"]')).toHaveCount(1);
  await expect(page.locator('[data-evidence-claim-id="final-gaia-art-enhancement-lock"]')).toHaveCount(1);
  await expect(page.locator('[data-evidence-claim-id="release-candidate-evidence-closure-lock"]')).toHaveCount(1);
  await closePanel(page, "关闭证据账本");

  await openNavigatorResult(page, "mission hub", "panel:mission-hub");
  await expectAccessibleSurface(page, "mission-hub");
  await closePanel(page, "关闭任务中心");

  await openNavigatorResult(page, "report studio", "panel:scientific-report");
  await expectAccessibleSurface(page, "report-studio");
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-atlas-accessibility-surface-id="report-studio"]')).toBeHidden();

  await openNavigatorResult(page, "observatory deck", "panel:observatory-deck");
  await expectAccessibleSurface(page, "observatory-deck");
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-atlas-accessibility-surface-id="observatory-deck"]')).toBeHidden();

  await openNavigatorResult(page, "织女星", "celestial-object:nearby-star:vega");
  await expect(page.locator('[data-celestial-object-passport-id="nearby-star:vega"]')).toHaveCount(1);
  await expect(page.locator('[data-sky-target-proxy-id="nearby-star:vega"]')).toHaveCount(1);
  await expect(page.locator('[data-sky-target-proxy-id="nearby-star:vega"]')).toHaveAttribute(
    "data-sky-target-proxy-spectral-label",
    /[OBAFGKM]/,
  );
  await page.locator('[data-atlas-camera-zoom="in"]').click();
  let zoomedInDistance = 0;
  await expect
    .poll(async () => {
      zoomedInDistance = Number(
        await page.locator(ROOT_SELECTOR).getAttribute("data-atlas-camera-target-distance"),
      );
      return zoomedInDistance;
    })
    .toBeGreaterThan(0);
  await page.locator('[data-atlas-camera-zoom="out"]').click();
  await expect
    .poll(async () =>
      Number(
        await page.locator(ROOT_SELECTOR).getAttribute("data-atlas-camera-target-distance"),
      ),
    )
    .toBeGreaterThan(zoomedInDistance);
  await page.getByRole("button", { exact: true, name: "退出聚焦" }).click();
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute("data-celestial-catalog-selected-id", "");

  const gaiaSourceId = "4049506483413484672";
  await openNavigatorResult(page, gaiaSourceId, `gaia-star:${gaiaSourceId}`);
  await expect(page.locator(`[data-celestial-object-passport-id="gaia-dr3:${gaiaSourceId}"]`)).toHaveCount(1);
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute(
    "data-celestial-catalog-selected-id",
    `gaia-dr3:${gaiaSourceId}`,
  );
  await expect(page.locator(`[data-sky-target-proxy-id="gaia-dr3:${gaiaSourceId}"]`)).toHaveCount(1);
  await expect(page.locator(`[data-sky-target-proxy-id="gaia-dr3:${gaiaSourceId}"]`)).toHaveAttribute(
    "data-sky-target-proxy-spectral-label",
    /[OBAFGKM]/,
  );
  await page.getByRole("button", { exact: true, name: "退出聚焦" }).click();
  await expect(page.locator(ROOT_SELECTOR)).toHaveAttribute("data-celestial-catalog-selected-id", "");

  await resetBrowserForVisualSampling(page);
  await assertPlanetaryCloseupState(page, "Earth", "solar-body:earth", {
    selectedBodyId: "earth",
    visualTier: "selected-hd-local",
    atmosphereProfile: "earth-cloud-night-atmosphere",
    lightingProfile: "earth-night-closeup",
    keyLightProfile: "earth-cloud-night-key-balance",
    depthLightingProfile: "earth-atmospheric-terminator-depth",
    colorGradeProfile: "earth-ocean-cloud-color-depth",
    referenceGradePlanetMaterialProfile: "closeup-microcontrast-fill",
    materialProfile: "earth-cloud-night-depth",
    atmosphereDepthProfile: "thin-earth-limb-depth",
    terminatorProfile: "earth-night-cloud-terminator",
    ringProfile: "no-ring-profile",
    gasGiantArtProfile: "overview-no-gas-giant-art",
    saturnRingArtProfile: "no-ring-art-profile",
    earthCloudNightProfile: "earth-clean-cloud-night-shadow-art",
    solarSurfaceProfile: "overview-no-solar-surface-art",
    globalColorGradeProfile: "filmic-cool-space-warm-planet-protection",
    backgroundArtGradeProfile: "closeup-subject-star-noise-matte",
    cinematicBackdropStarfieldProfile: "closeup-subject-star-noise-suppressed",
    cinematicBackdropNebulaProfile: "closeup-nebula-haze-restrained",
    cinematicBackdropNegativeSpaceProfile: "selected-body-clean-dark-backdrop",
    sparseDeepSpaceStarfieldProfile: "closeup-primary-stars-subject-matte",
    sparseDeepSpaceMilkyWayProfile: "closeup-dark-lane-negative-space",
    sparseDeepSpaceNebulaProfile: "closeup-haze-nearly-suppressed",
    sparseDeepSpaceNegativeSpaceProfile: "selected-body-clean-negative-space",
    closeupCompositionProfile: "earth-limb-portrait",
    closeupRingShowcaseProfile: "no-ring-showcase",
    previewRenderProfile: "earth-cloud-night-preview",
    previewRingState: "no-ring",
    previewTexturePolicy: "hd-or-v49-local-texture",
    solarBackdropProfile: "overview-sparse-sky",
    planetReadabilityProfile: "body-specific-closeup-readable",
  });
  await assertCanvasBackdropPixelBudget(page, "closeup");
  await assertCloseupMaterialPixelBudget(page, "earth");
  await captureV50ReviewScreenshot(page, testInfo.outputPath(`v59-earth-${testInfo.project.name}.png`));
  await captureV50ReviewScreenshot(
    page,
    testInfo.outputPath("v76-closeup-visual-fidelity", `earth-closeup-${testInfo.project.name}.png`),
  );
  await resetBrowserForVisualSampling(page);
  await assertPlanetaryCloseupState(page, "Sun", "solar-body:sun", {
    selectedBodyId: "sun",
    visualTier: "selected-hd-local",
    atmosphereProfile: "solar-corona",
    lightingProfile: "solar-closeup",
    keyLightProfile: "solar-surface-edge-key",
    depthLightingProfile: "solar-granulation-limb-depth",
    colorGradeProfile: "solar-photosphere-color-depth",
    referenceGradePlanetMaterialProfile: "solar-edge-controlled",
    materialProfile: "solar-granulation-depth",
    atmosphereDepthProfile: "solar-edge-controlled-depth",
    terminatorProfile: "solar-limb-darkening",
    ringProfile: "no-ring-profile",
    gasGiantArtProfile: "overview-no-gas-giant-art",
    saturnRingArtProfile: "no-ring-art-profile",
    earthCloudNightProfile: "overview-no-earth-cloud-night-art",
    solarSurfaceProfile: "solar-granulation-controlled-corona-art",
    globalColorGradeProfile: "filmic-cool-space-warm-planet-protection",
    backgroundArtGradeProfile: "closeup-subject-star-noise-matte",
    cinematicBackdropStarfieldProfile: "closeup-subject-star-noise-suppressed",
    cinematicBackdropNebulaProfile: "closeup-nebula-haze-restrained",
    cinematicBackdropNegativeSpaceProfile: "selected-body-clean-dark-backdrop",
    sparseDeepSpaceStarfieldProfile: "closeup-primary-stars-subject-matte",
    sparseDeepSpaceMilkyWayProfile: "closeup-dark-lane-negative-space",
    sparseDeepSpaceNebulaProfile: "closeup-haze-nearly-suppressed",
    sparseDeepSpaceNegativeSpaceProfile: "selected-body-clean-negative-space",
    closeupCompositionProfile: "solar-surface-portrait",
    closeupRingShowcaseProfile: "no-ring-showcase",
    previewRenderProfile: "solar-procedural-preview",
    previewRingState: "no-ring",
    previewTexturePolicy: "hd-or-v49-local-texture",
    solarBackdropProfile: "solar-clean-negative-space",
    planetReadabilityProfile: "body-specific-closeup-readable",
  });
  await assertCloseupMaterialPixelBudget(page, "sun");
  await captureV50ReviewScreenshot(page, testInfo.outputPath(`v59-sun-${testInfo.project.name}.png`));
  await captureV50ReviewScreenshot(
    page,
    testInfo.outputPath("v76-closeup-visual-fidelity", `sun-closeup-${testInfo.project.name}.png`),
  );
  await resetBrowserForVisualSampling(page);
  await assertPlanetaryCloseupState(page, "Jupiter", "solar-body:jupiter", {
    selectedBodyId: "jupiter",
    visualTier: "selected-hd-local",
    atmosphereProfile: "body-atmosphere-rim",
    lightingProfile: "gas-giant-closeup",
    keyLightProfile: "gas-giant-readable-key-fill",
    depthLightingProfile: "gas-giant-banded-phase-depth",
    colorGradeProfile: "gas-giant-layer-color-grade",
    referenceGradePlanetMaterialProfile: "gas-giant-ring-readability",
    materialProfile: "gas-giant-band-depth",
    atmosphereDepthProfile: "gas-giant-soft-limb-depth",
    terminatorProfile: "gas-band-low-fill-terminator",
    ringProfile: "no-ring-profile",
    gasGiantArtProfile: "gas-giant-band-depth-cinematic",
    saturnRingArtProfile: "no-ring-art-profile",
    earthCloudNightProfile: "overview-no-earth-cloud-night-art",
    solarSurfaceProfile: "overview-no-solar-surface-art",
    globalColorGradeProfile: "filmic-cool-space-warm-planet-protection",
    backgroundArtGradeProfile: "closeup-subject-star-noise-matte",
    cinematicBackdropStarfieldProfile: "closeup-subject-star-noise-suppressed",
    cinematicBackdropNebulaProfile: "closeup-nebula-haze-restrained",
    cinematicBackdropNegativeSpaceProfile: "selected-body-clean-dark-backdrop",
    sparseDeepSpaceStarfieldProfile: "closeup-primary-stars-subject-matte",
    sparseDeepSpaceMilkyWayProfile: "closeup-dark-lane-negative-space",
    sparseDeepSpaceNebulaProfile: "closeup-haze-nearly-suppressed",
    sparseDeepSpaceNegativeSpaceProfile: "selected-body-clean-negative-space",
    closeupCompositionProfile: "gas-giant-band-portrait",
    closeupRingShowcaseProfile: "no-ring-showcase",
    previewRenderProfile: "gas-giant-band-preview",
    previewRingState: "no-ring",
    previewTexturePolicy: "hd-or-v49-local-texture",
    solarBackdropProfile: "overview-sparse-sky",
    planetReadabilityProfile: "body-specific-closeup-readable",
  });
  await assertCloseupMaterialPixelBudget(page, "gas");
  await captureV50ReviewScreenshot(page, testInfo.outputPath(`v59-jupiter-${testInfo.project.name}.png`));
  await captureV50ReviewScreenshot(
    page,
    testInfo.outputPath("v76-closeup-visual-fidelity", `jupiter-closeup-${testInfo.project.name}.png`),
  );
  await resetBrowserForVisualSampling(page);
  await assertPlanetaryCloseupState(page, "Saturn", "solar-body:saturn", {
    selectedBodyId: "saturn",
    visualTier: "selected-hd-local",
    atmosphereProfile: "body-atmosphere-rim",
    lightingProfile: "gas-giant-closeup",
    keyLightProfile: "saturn-ring-key-fill",
    depthLightingProfile: "saturn-ring-shadow-depth",
    colorGradeProfile: "saturn-ring-occlusion-color-grade",
    referenceGradePlanetMaterialProfile: "gas-giant-ring-readability",
    materialProfile: "saturn-ring-material-depth",
    atmosphereDepthProfile: "gas-giant-soft-limb-depth",
    terminatorProfile: "gas-band-low-fill-terminator",
    ringProfile: "saturn-cassini-layered-ring",
    gasGiantArtProfile: "saturn-muted-bands-ring-aware",
    saturnRingArtProfile: "saturn-cassini-backlit-ring-art",
    earthCloudNightProfile: "overview-no-earth-cloud-night-art",
    solarSurfaceProfile: "overview-no-solar-surface-art",
    globalColorGradeProfile: "filmic-cool-space-warm-planet-protection",
    backgroundArtGradeProfile: "closeup-subject-star-noise-matte",
    cinematicBackdropStarfieldProfile: "closeup-subject-star-noise-suppressed",
    cinematicBackdropNebulaProfile: "closeup-nebula-haze-restrained",
    cinematicBackdropNegativeSpaceProfile: "selected-body-clean-dark-backdrop",
    sparseDeepSpaceStarfieldProfile: "closeup-primary-stars-subject-matte",
    sparseDeepSpaceMilkyWayProfile: "closeup-dark-lane-negative-space",
    sparseDeepSpaceNebulaProfile: "closeup-haze-nearly-suppressed",
    sparseDeepSpaceNegativeSpaceProfile: "selected-body-clean-negative-space",
    closeupCompositionProfile: "saturn-ring-showcase",
    closeupRingShowcaseProfile: "saturn-wide-tilted-ring-showcase",
    previewRenderProfile: "saturn-ringed-band-preview",
    previewRingState: "ringed",
    previewTexturePolicy: "hd-or-v49-local-texture",
    solarBackdropProfile: "overview-sparse-sky",
    planetReadabilityProfile: "body-specific-closeup-readable",
  });
  await assertCloseupMaterialPixelBudget(page, "saturn");
  await captureV50ReviewScreenshot(page, testInfo.outputPath(`v59-saturn-${testInfo.project.name}.png`));
  await captureV50ReviewScreenshot(
    page,
    testInfo.outputPath("v76-closeup-visual-fidelity", `saturn-closeup-${testInfo.project.name}.png`),
  );

  await expectNoHorizontalOverflow(page);
  expect(consoleErrors, "console errors").toEqual([]);
  expect(pageErrors, "page errors").toEqual([]);
});

async function assertCinematicVisualContracts(page: Page): Promise<void> {
  const dock = page.locator('[data-atlas-cinematic-hud="bottom-dock"]').first();
  await expect(dock).toBeVisible();

  const visualMetrics = await page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const dockElement = document.querySelector<HTMLElement>('[data-atlas-cinematic-hud="bottom-dock"]');
    const dockRect = dockElement?.getBoundingClientRect();
    const clusters = Array.from(
      document.querySelectorAll<HTMLElement>("[data-atlas-cinematic-control-cluster]"),
    )
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          id: element.dataset.atlasCinematicControlCluster ?? "",
          display: style.display,
          visibility: style.visibility,
          width: rect.width,
          height: rect.height,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
        };
      })
      .filter((rect) => rect.display !== "none" && rect.visibility !== "hidden" && rect.width > 0 && rect.height > 0);
    const overlaps: string[] = [];
    for (let i = 0; i < clusters.length; i += 1) {
      for (let j = i + 1; j < clusters.length; j += 1) {
        const a = clusters[i]!;
        const b = clusters[j]!;
        const overlap =
          Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
          Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        if (overlap > 1) overlaps.push(`${a.id}:${b.id}`);
      }
    }
    return {
      viewportWidth,
      dockHeight: dockRect?.height ?? 0,
      dockLeft: dockRect?.left ?? 0,
      dockRight: dockRect?.right ?? 0,
      clusterCount: clusters.length,
      overlaps,
    };
  });

  expect(visualMetrics.dockHeight, "bottom dock height").toBeGreaterThanOrEqual(48);
  expect(visualMetrics.dockHeight, "bottom dock height").toBeLessThanOrEqual(72);
  expect(visualMetrics.dockLeft, "dock left bound").toBeGreaterThanOrEqual(0);
  expect(visualMetrics.dockRight, "dock right bound").toBeLessThanOrEqual(visualMetrics.viewportWidth + 0.5);
  expect(visualMetrics.clusterCount, "visible cinematic control clusters").toBeGreaterThanOrEqual(2);
  expect(visualMetrics.overlaps, "primary HUD clusters should not overlap").toEqual([]);
}

async function captureV50ReviewScreenshot(page: Page, path: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.screenshot({ path, fullPage: false });
      return;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(250);
      await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
    }
  }
  throw lastError;
}

async function captureV104ManifestScreenshot(
  page: Page,
  id: string,
  path: string,
): Promise<void> {
  if (!shouldCaptureV104ManifestScreenshot(page, id)) return;
  await captureV50ReviewScreenshot(page, path);
}

function isV104MobileBrowserReview(page: Page): boolean {
  const viewport = page.viewportSize();
  return viewport != null && viewport.width <= 600;
}

function shouldCaptureV104ManifestScreenshot(page: Page, id: string): boolean {
  if (V104_BROWSER_ACCEPTANCE_REVIEW_SCREENSHOTS) {
    return V104_BROWSER_ACCEPTANCE_FULL_REVIEW_SCREENSHOT_IDS.has(id);
  }
  return isV104MobileBrowserReview(page)
    ? V104_BROWSER_ACCEPTANCE_MOBILE_DEFAULT_SCREENSHOT_IDS.has(id)
    : V104_BROWSER_ACCEPTANCE_DEFAULT_SCREENSHOT_IDS.has(id);
}

async function scrollEvidenceIntoView(page: Page, selector: string): Promise<void> {
  if (!V104_BROWSER_ACCEPTANCE_REVIEW_SCREENSHOTS && isV104MobileBrowserReview(page)) return;

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      await expect(page.locator(selector)).toHaveCount(1);
      await page.locator(selector).evaluate((element) => {
        element.scrollIntoView({ block: "center", inline: "nearest" });
      });
      await page.waitForTimeout(80);
      return;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(150);
    }
  }
  throw lastError;
}

async function resetBrowserForVisualSampling(page: Page): Promise<void> {
  await page.goto("about:blank", { waitUntil: "commit" });
  await page.waitForTimeout(120);
  await page.goto("/?presentation=sandbox", { waitUntil: "domcontentloaded" });
  await expect(page.locator(ROOT_SELECTOR)).toHaveCount(1);
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  await page.waitForTimeout(450);
}

async function sampleScreenshotPixelMetrics(
  page: Page,
  screenshot: Buffer,
  kind: "backdrop",
): Promise<BackdropPixelMetrics | null>;
async function sampleScreenshotPixelMetrics(
  page: Page,
  screenshot: Buffer,
  kind: "closeup-material",
): Promise<CloseupMaterialMetrics | null>;
async function sampleScreenshotPixelMetrics(
  page: Page,
  screenshot: Buffer,
  kind: "backdrop" | "closeup-material",
): Promise<BackdropPixelMetrics | CloseupMaterialMetrics | null> {
  const dataUrl = `data:image/png;base64,${screenshot.toString("base64")}`;
  return page.evaluate(async ({ url, metricKind }) => {
    const blob = await (await fetch(url)).blob();
    let image: ImageBitmap | null = null;
    const canvas = document.createElement("canvas");
    try {
      image = await createImageBitmap(blob);
      const width = image.width;
      const height = image.height;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;
      ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, width, height).data;

      if (metricKind === "backdrop") {
        const stepX = Math.max(1, Math.floor(width / 180));
        const stepY = Math.max(1, Math.floor(height / 108));
        let samples = 0;
        let bright = 0;
        let starNoise = 0;
        let lumTotal = 0;
        let blueDust = 0;
        let darkStructure = 0;
        let localContrast = 0;
        let brightStarFloor = 0;
        let texturedLegacyField = 0;
        let centerSamples = 0;
        let centerLumTotal = 0;
        for (let y = 0; y < height; y += stepY) {
          for (let x = 0; x < width; x += stepX) {
            if (y > height * 0.86) continue;
            if (x > width * 0.78) continue;
            const index = (y * width + x) * 4;
            const r = pixels[index]!;
            const g = pixels[index + 1]!;
            const b = pixels[index + 2]!;
            const lum = r * 0.2126 + g * 0.7152 + b * 0.0722;
            const rightX = Math.min(width - 1, x + stepX);
            const downY = Math.min(height - 1, y + stepY);
            const rightIndex = (y * width + rightX) * 4;
            const downIndex = (downY * width + x) * 4;
            const rightLum =
              pixels[rightIndex]! * 0.2126 + pixels[rightIndex + 1]! * 0.7152 + pixels[rightIndex + 2]! * 0.0722;
            const downLum =
              pixels[downIndex]! * 0.2126 + pixels[downIndex + 1]! * 0.7152 + pixels[downIndex + 2]! * 0.0722;
            samples += 1;
            lumTotal += lum;
            localContrast += Math.abs(lum - rightLum) + Math.abs(lum - downLum);
            if (lum > 142) bright += 1;
            if (lum > 72) starNoise += 1;
            if (lum > 18 && lum < 132 && b > r * 0.9 && b > g * 0.72) blueDust += 1;
            if (lum < 14) darkStructure += 1;
            if (lum > 155 && Math.max(r, g, b) - Math.min(r, g, b) < 96) brightStarFloor += 1;
            if (Math.abs(lum - rightLum) + Math.abs(lum - downLum) > 4.5) texturedLegacyField += 1;
            if (x > width * 0.3 && x < width * 0.68 && y > height * 0.22 && y < height * 0.66) {
              centerSamples += 1;
              centerLumTotal += lum;
            }
          }
        }
        return {
          meanLum: samples > 0 ? lumTotal / samples : 0,
          highBrightRatio: samples > 0 ? bright / samples : 1,
          starNoiseRatio: samples > 0 ? starNoise / samples : 1,
          blueDustRatio: samples > 0 ? blueDust / samples : 0,
          darkStructureRatio: samples > 0 ? darkStructure / samples : 0,
          brightStarFloorRatio: samples > 0 ? brightStarFloor / samples : 0,
          texturedLegacyFieldRatio: samples > 0 ? texturedLegacyField / samples : 0,
          localContrast: samples > 0 ? localContrast / samples : 0,
          centerMeanLum: centerSamples > 0 ? centerLumTotal / centerSamples : 255,
        };
      }

      const stepX = Math.max(1, Math.floor(width / 160));
      const stepY = Math.max(1, Math.floor(height / 96));
      let samples = 0;
      let high = 0;
      let bodySamples = 0;
      let bodyLum = 0;
      let contrastTotal = 0;
      let coolBackdrop = 0;
      let backgroundSamples = 0;
      let backgroundHighNoise = 0;
      let backgroundCoolNoise = 0;
      let strongLocalTexture = 0;
      let darkMaterialStructure = 0;
      for (let y = Math.floor(height * 0.1); y < Math.floor(height * 0.82); y += stepY) {
        for (let x = Math.floor(width * 0.08); x < Math.floor(width * 0.84); x += stepX) {
          const index = (y * width + x) * 4;
          const r = pixels[index]!;
          const g = pixels[index + 1]!;
          const b = pixels[index + 2]!;
          const lum = r * 0.2126 + g * 0.7152 + b * 0.0722;
          const right = Math.min(width - 1, x + stepX);
          const down = Math.min(height - 1, y + stepY);
          const rightIndex = (y * width + right) * 4;
          const downIndex = (down * width + x) * 4;
          const rightLum =
            pixels[rightIndex]! * 0.2126 + pixels[rightIndex + 1]! * 0.7152 + pixels[rightIndex + 2]! * 0.0722;
          const downLum =
            pixels[downIndex]! * 0.2126 + pixels[downIndex + 1]! * 0.7152 + pixels[downIndex + 2]! * 0.0722;
          samples += 1;
          if (lum > 226) high += 1;
          if (lum > 18 && b > r * 1.08 && b > g * 0.82) coolBackdrop += 1;
          if (x < width * 0.22 || y < height * 0.18) {
            backgroundSamples += 1;
            if (lum > 88) backgroundHighNoise += 1;
            if (lum > 24 && b > r * 1.05 && b > g * 0.78) backgroundCoolNoise += 1;
          }
          if (lum > 16) {
            bodySamples += 1;
            bodyLum += lum;
            contrastTotal += Math.abs(lum - rightLum) + Math.abs(lum - downLum);
            if (Math.abs(lum - rightLum) + Math.abs(lum - downLum) > 7.5) strongLocalTexture += 1;
            if (lum < 34) darkMaterialStructure += 1;
          }
        }
      }
      return {
        highRatio: samples > 0 ? high / samples : 1,
        bodyRatio: samples > 0 ? bodySamples / samples : 0,
        meanBodyLum: bodySamples > 0 ? bodyLum / bodySamples : 0,
        localContrast: bodySamples > 0 ? contrastTotal / bodySamples : 0,
        coolBackdropRatio: samples > 0 ? coolBackdrop / samples : 1,
        backgroundHighNoiseRatio: backgroundSamples > 0 ? backgroundHighNoise / backgroundSamples : 1,
        backgroundCoolNoiseRatio: backgroundSamples > 0 ? backgroundCoolNoise / backgroundSamples : 1,
        strongLocalTextureRatio: bodySamples > 0 ? strongLocalTexture / bodySamples : 0,
        darkMaterialStructureRatio: bodySamples > 0 ? darkMaterialStructure / bodySamples : 0,
      };
    } finally {
      if (image) {
        image.close();
      }
      canvas.width = 0;
      canvas.height = 0;
    }
  }, { url: dataUrl, metricKind: kind });
}

async function assertCanvasBackdropPixelBudget(page: Page, mode: "overview" | "closeup"): Promise<void> {
  let metrics: BackdropPixelMetrics | null = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await closeObjectBrowserForBackdropSampling(page);
    await page.waitForTimeout(attempt === 0 ? 220 : 450);
    const screenshot = await page.screenshot({ fullPage: false });
    metrics = await sampleScreenshotPixelMetrics(page, screenshot, "backdrop");
    if (metrics != null && backdropPixelMetricsPass(metrics, mode)) break;
  }

  expect(metrics, "WebGL canvas backdrop metrics").not.toBeNull();
  expect(metrics!.meanLum, "canvas should not be blank").toBeGreaterThan(mode === "closeup" ? 1.0 : 0.2);
  expect(metrics!.highBrightRatio, `${mode} high-bright background ratio`).toBeLessThan(mode === "closeup" ? 0.12 : 0.2);
  expect(metrics!.starNoiseRatio, `${mode} star-noise density`).toBeLessThan(mode === "closeup" ? 0.28 : 0.42);
  if (mode === "overview") {
    expect(metrics!.blueDustRatio, "v71 overview blue-gray Milky Way/dust structure").toBeGreaterThan(0.025);
    expect(metrics!.darkStructureRatio, "v71 overview dark-lane/space structure").toBeGreaterThan(0.12);
    expect(metrics!.brightStarFloorRatio, "v71 overview discrete bright-star floor").toBeGreaterThan(0.0004);
    expect(metrics!.texturedLegacyFieldRatio, "v71 overview should not regress to sparse reference wall").toBeGreaterThan(0.04);
    expect(metrics!.localContrast, "v71 overview legacy starfield texture contrast").toBeGreaterThan(1.1);
  }
  expect(metrics!.centerMeanLum, `${mode} center should retain visible low-luma background`).toBeGreaterThan(
    mode === "closeup" ? 0.8 : 0.2,
  );
  expect(metrics!.centerMeanLum, `${mode} center negative-space luminance`).toBeLessThan(mode === "closeup" ? 54 : 86);
}

async function closeObjectBrowserForBackdropSampling(page: Page): Promise<void> {
  const state = await page.evaluate(() => {
    const panel = document.getElementById("universe-object-browser");
    if (!panel) return "missing";
    const rect = panel.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.right > 8;
    if (!isVisible) return "already-closed";
    const closeButton = panel.querySelector("button");
    if (!(closeButton instanceof HTMLButtonElement)) return "missing-button";
    closeButton.click();
    return "clicked";
  });
  if (state === "clicked") {
    await expect(page.locator("#universe-object-browser")).toHaveClass(/-translate-x-full/);
  }
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

type BackdropPixelMetrics = {
  meanLum: number;
  highBrightRatio: number;
  starNoiseRatio: number;
  blueDustRatio: number;
  darkStructureRatio: number;
  brightStarFloorRatio: number;
  texturedLegacyFieldRatio: number;
  localContrast: number;
  centerMeanLum: number;
};

function backdropPixelMetricsPass(
  metrics: BackdropPixelMetrics,
  mode: "overview" | "closeup",
): boolean {
  if (metrics.meanLum <= (mode === "closeup" ? 1.0 : 0.2)) return false;
  if (metrics.highBrightRatio >= (mode === "closeup" ? 0.12 : 0.2)) return false;
  if (metrics.starNoiseRatio >= (mode === "closeup" ? 0.28 : 0.42)) return false;
  if (mode === "overview" && metrics.blueDustRatio <= 0.025) return false;
  if (mode === "overview" && metrics.darkStructureRatio <= 0.12) return false;
  if (mode === "overview" && metrics.brightStarFloorRatio <= 0.0004) return false;
  if (mode === "overview" && metrics.texturedLegacyFieldRatio <= 0.04) return false;
  if (mode === "overview" && metrics.localContrast <= 1.1) return false;
  if (metrics.centerMeanLum <= (mode === "closeup" ? 0.8 : 0.2)) return false;
  return metrics.centerMeanLum < (mode === "closeup" ? 54 : 86);
}

async function assertCloseupMaterialPixelBudget(
  page: Page,
  target: "earth" | "sun" | "gas" | "saturn",
): Promise<void> {
  let metrics: CloseupMaterialMetrics | null = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await page.waitForTimeout(attempt === 0 ? 220 : 450);
    const screenshot = await page.screenshot({ fullPage: false });
    metrics = await sampleScreenshotPixelMetrics(page, screenshot, "closeup-material");
    if (metrics != null && closeupMaterialMetricsPass(metrics, target)) break;
  }

  expect(metrics, `${target} material pixel metrics`).not.toBeNull();
  expect(metrics!.bodyRatio, `${target} selected body should occupy visible pixels`).toBeGreaterThan(0.006);
  expect(metrics!.meanBodyLum, `${target} selected body should not be blank`).toBeGreaterThan(4);
  expect(metrics!.localContrast, `${target} local material contrast`).toBeGreaterThan(target === "sun" ? 1.6 : 0.9);
  expect(metrics!.highRatio, `${target} overexposed highlight ratio`).toBeLessThan(target === "sun" ? 0.24 : 0.08);
  expect(metrics!.backgroundHighNoiseRatio, `v71 ${target} close-up background high-noise guard`).toBeLessThan(0.28);
  expect(metrics!.backgroundCoolNoiseRatio, `v71 ${target} close-up blue-dust interference guard`).toBeLessThan(0.55);
  if (target === "earth") {
    expect(metrics!.darkMaterialStructureRatio, "v72 earth terminator/night-side structure").toBeGreaterThan(0.02);
    expect(metrics!.highRatio, "v72 earth night/cloud overbright guard").toBeLessThan(0.08);
  }
  if (target === "saturn") {
    expect(metrics!.strongLocalTextureRatio, "v72 saturn ring/Cassini local contrast").toBeGreaterThan(0.018);
    expect(metrics!.darkMaterialStructureRatio, "v72 saturn ring shadow/Cassini dark structure").toBeGreaterThan(0.025);
  }
  if (target === "sun") {
    expect(metrics!.coolBackdropRatio, "sun close-up cool/purple backdrop leak").toBeLessThan(0.12);
    expect(metrics!.strongLocalTextureRatio, "v72 sun granulation local contrast").toBeGreaterThan(0.028);
    expect(metrics!.highRatio, "v72 sun over-bloom restraint").toBeLessThan(0.24);
  }
}

type CloseupMaterialMetrics = {
  highRatio: number;
  bodyRatio: number;
  meanBodyLum: number;
  localContrast: number;
  coolBackdropRatio: number;
  backgroundHighNoiseRatio: number;
  backgroundCoolNoiseRatio: number;
  strongLocalTextureRatio: number;
  darkMaterialStructureRatio: number;
};

function closeupMaterialMetricsPass(
  metrics: CloseupMaterialMetrics,
  target: "earth" | "sun" | "gas" | "saturn",
): boolean {
  if (metrics.bodyRatio <= 0.006) return false;
  if (metrics.meanBodyLum <= 4) return false;
  if (metrics.localContrast <= (target === "sun" ? 1.6 : 0.9)) return false;
  if (metrics.highRatio >= (target === "sun" ? 0.24 : 0.08)) return false;
  if (metrics.backgroundHighNoiseRatio >= 0.28) return false;
  if (metrics.backgroundCoolNoiseRatio >= 0.55) return false;
  if (target === "earth" && metrics.darkMaterialStructureRatio <= 0.02) return false;
  if (target === "saturn" && metrics.strongLocalTextureRatio <= 0.018) return false;
  if (target === "saturn" && metrics.darkMaterialStructureRatio <= 0.025) return false;
  if (target === "sun" && metrics.coolBackdropRatio >= 0.12) return false;
  if (target === "sun" && metrics.strongLocalTextureRatio <= 0.028) return false;
  return true;
}

async function assertPlanetaryCloseupState(
  page: Page,
  query: string,
  itemId: string,
  expected: {
    selectedBodyId: string;
    visualTier: string;
    atmosphereProfile: string;
    lightingProfile: string;
    keyLightProfile: string;
    depthLightingProfile: string;
    colorGradeProfile: string;
    referenceGradePlanetMaterialProfile: string;
    materialProfile: string;
    atmosphereDepthProfile: string;
    terminatorProfile: string;
    ringProfile: string;
    gasGiantArtProfile: string;
    saturnRingArtProfile: string;
    earthCloudNightProfile: string;
    solarSurfaceProfile: string;
    globalColorGradeProfile: string;
    backgroundArtGradeProfile: string;
    cinematicBackdropStarfieldProfile: string;
    cinematicBackdropNebulaProfile: string;
    cinematicBackdropNegativeSpaceProfile: string;
    sparseDeepSpaceStarfieldProfile: string;
    sparseDeepSpaceMilkyWayProfile: string;
    sparseDeepSpaceNebulaProfile: string;
    sparseDeepSpaceNegativeSpaceProfile: string;
    closeupCompositionProfile: string;
    closeupRingShowcaseProfile: string;
    previewRenderProfile: string;
    previewRingState: string;
    previewTexturePolicy: string;
    solarBackdropProfile: string;
    planetReadabilityProfile: string;
  },
): Promise<void> {
  await openNavigatorResult(page, query, itemId);
  const root = page.locator(ROOT_SELECTOR);
  await expect(root).toHaveAttribute("data-atlas-selected-body-closeup-active", "true");
  await expect(root).toHaveAttribute("data-atlas-selected-body-visual-id", expected.selectedBodyId);
  await expect(root).toHaveAttribute("data-atlas-selected-body-visual-tier", expected.visualTier);
  await expect(root).toHaveAttribute(
    "data-atlas-selected-body-atmosphere-profile",
    expected.atmosphereProfile,
  );
  await expect(root).toHaveAttribute("data-atlas-sky-closeup-profile", "deep-space-filmic-dim");
  await expect(root).toHaveAttribute("data-atlas-selected-body-lighting-profile", expected.lightingProfile);
  await expect(root).toHaveAttribute("data-atlas-selected-body-key-light-profile", expected.keyLightProfile);
  await expect(root).toHaveAttribute("data-atlas-selected-body-depth-lighting-profile", expected.depthLightingProfile);
  await expect(root).toHaveAttribute("data-atlas-selected-body-color-grade-profile", expected.colorGradeProfile);
  await expect(root).toHaveAttribute("data-atlas-cinematic-camera-profile", "selected-body-cinematic");
  await expect(root).toHaveAttribute(
    "data-atlas-cinematic-sky-composition-profile",
    "subject-separated-deep-space",
  );
  await expect(root).toHaveAttribute("data-atlas-cinematic-background-noise-profile", "closeup-low-noise");
  await expect(root).toHaveAttribute(
    "data-atlas-cinematic-target-separation-profile",
    "selected-body-limb-and-negative-space",
  );
  await expect(root).toHaveAttribute("data-atlas-background-depth-profile", "closeup-subject-negative-space");
  await expect(root).toHaveAttribute("data-atlas-background-subject-visibility-profile", "selected-body-in-frame");
  await expect(root).toHaveAttribute("data-atlas-reference-grade-composite-profile", "selected-body-subject-matte");
  await expect(root).toHaveAttribute("data-atlas-reference-grade-sky-layer-profile", "v48-local-closeup-negative-space");
  await expect(root).toHaveAttribute("data-atlas-reference-grade-starfield-profile", "closeup-star-noise-suppressed");
  await expect(root).toHaveAttribute("data-atlas-reference-grade-subject-matte-profile", "selected-body-background-matte");
  await expect(root).toHaveAttribute(
    "data-atlas-reference-grade-planet-material-profile",
    expected.referenceGradePlanetMaterialProfile,
  );
  await expect(root).toHaveAttribute("data-atlas-selected-body-material-profile", expected.materialProfile);
  await expect(root).toHaveAttribute(
    "data-atlas-selected-body-atmosphere-depth-profile",
    expected.atmosphereDepthProfile,
  );
  await expect(root).toHaveAttribute(
    "data-atlas-selected-body-terminator-profile",
    expected.terminatorProfile,
  );
  await expect(root).toHaveAttribute("data-atlas-selected-body-ring-profile", expected.ringProfile);
  await expect(root).toHaveAttribute("data-atlas-selected-body-gas-giant-art-profile", expected.gasGiantArtProfile);
  await expect(root).toHaveAttribute("data-atlas-selected-body-saturn-ring-art-profile", expected.saturnRingArtProfile);
  await expect(root).toHaveAttribute("data-atlas-selected-body-earth-cloud-night-profile", expected.earthCloudNightProfile);
  await expect(root).toHaveAttribute("data-atlas-selected-body-solar-surface-profile", expected.solarSurfaceProfile);
  await expect(root).toHaveAttribute("data-atlas-global-color-grade-profile", expected.globalColorGradeProfile);
  await expect(root).toHaveAttribute("data-atlas-background-art-grade-profile", expected.backgroundArtGradeProfile);
  await expect(root).toHaveAttribute(
    "data-atlas-cinematic-backdrop-starfield-profile",
    expected.cinematicBackdropStarfieldProfile,
  );
  await expect(root).toHaveAttribute(
    "data-atlas-cinematic-backdrop-nebula-profile",
    expected.cinematicBackdropNebulaProfile,
  );
  await expect(root).toHaveAttribute(
    "data-atlas-cinematic-backdrop-negative-space-profile",
    expected.cinematicBackdropNegativeSpaceProfile,
  );
  await expect(root).toHaveAttribute(
    "data-atlas-sparse-deep-space-starfield-profile",
    expected.sparseDeepSpaceStarfieldProfile,
  );
  await expect(root).toHaveAttribute(
    "data-atlas-sparse-deep-space-milky-way-profile",
    expected.sparseDeepSpaceMilkyWayProfile,
  );
  await expect(root).toHaveAttribute(
    "data-atlas-sparse-deep-space-nebula-profile",
    expected.sparseDeepSpaceNebulaProfile,
  );
  await expect(root).toHaveAttribute(
    "data-atlas-sparse-deep-space-negative-space-profile",
    expected.sparseDeepSpaceNegativeSpaceProfile,
  );
  await expect(root).toHaveAttribute("data-atlas-closeup-composition-profile", expected.closeupCompositionProfile);
  await expect(root).toHaveAttribute(
    "data-atlas-closeup-panel-avoidance-profile",
    /right-workbench-safe-subject-left|centered-mobile-safe-subject/,
  );
  await expect(root).toHaveAttribute("data-atlas-closeup-ring-showcase-profile", expected.closeupRingShowcaseProfile);
  await expect(root).toHaveAttribute(
    "data-atlas-closeup-presentation-truth-version",
    "v58-closeup-presentation-truth",
  );
  await expect(root).toHaveAttribute("data-atlas-background-orbit-art-version", "v69-legacy-8k-sky-restore");
  await expect(root).toHaveAttribute(
    "data-atlas-background-art-profile",
    "v69-legacy-blue-dust-starfield",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-visual-stability-version",
    "v70-visual-stability-material-pass",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-sky-art-lock-profile",
    "v69-legacy-blue-dust-starfield-locked",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-material-stability-profile",
    "v70-earth-saturn-sun-material-coherence",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-background-guard-version",
    "v71-background-regression-guard",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-sky-regression-budget-profile",
    "v71-v69-legacy-blue-dust-budget",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-material-profile-version",
    "v72-material-profile-contract",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-closeup-material-budget-profile",
    "v72-earth-saturn-sun-closeup-material-budget",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-closeup-visual-fidelity-version",
    "v76-closeup-visual-fidelity-pass",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-closeup-asset-policy",
    "v76-local-hd-planets-existing-source-audited",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-closeup-protected-sky-manifest",
    "orbit-atlas-v9",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-closeup-full-release-gate-status",
    "product-ready-scientific-horizons-blocked",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-relativity-verification-version",
    "v73-relativity-verification-readability",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-relativity-benchmark-profile",
    "v73-weak-field-kerr-benchmark-readout",
  );
  await expect(root).toHaveAttribute("data-atlas-relativity-weak-field-count", "4");
  await expect(root).toHaveAttribute("data-atlas-relativity-strong-field-count", "2");
  await expect(root).toHaveAttribute("data-atlas-relativity-numerical-health-count", "1");
  await expect(root).toHaveAttribute(
    "data-atlas-relativity-kerr-kernel",
    "eih-1pn+kerr-geodesic-v17",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-relativity-chart-version",
    "v74-relativity-verification-charts",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-relativity-chart-profile",
    "v74-newtonian-eih-kerr-readout-curves",
  );
  await expect(root).toHaveAttribute("data-atlas-relativity-chart-mercury-points", "5");
  await expect(root).toHaveAttribute("data-atlas-relativity-chart-isco-bars", "3");
  await expect(root).toHaveAttribute(
    "data-atlas-relativity-chart-hamiltonian-classification",
    "numerical-health-only",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-horizons-gate-audit-version",
    "v77-horizons-gate-closure-audit",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-horizons-gate-audit-profile",
    "v77-j2000-frame-unit-integrator-audit",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-horizons-gate-audit-status",
    /pending-runtime-run|blocked-model-limit|blocked-reference-frame-mismatch|blocked-runner-bug-unresolved|pass/,
  );
  await expect(root).toHaveAttribute(
    "data-atlas-physics-gate-split-version",
    "v78-product-scientific-physics-gate-split",
  );
  await expect(root).toHaveAttribute("data-atlas-product-release-gate-status", "pass");
  await expect(root).toHaveAttribute(
    "data-atlas-scientific-horizons-gate-status",
    /pending-runtime-run|blocked-model-limit|pass/,
  );
  await expect(root).toHaveAttribute(
    "data-atlas-release-readiness-version",
    "v79-release-readiness-gate-semantics",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-release-readiness-profile",
    "v79-product-ready-scientific-blocker-disclosed",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-release-readiness-status",
    "product-ready-scientific-horizons-blocked",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-scientific-gate-preflight-version",
    "v80-scientific-horizons-closure-preflight",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-scientific-gate-preflight-status",
    "product-ready-strict-scientific-blocked-preflight-ready",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-horizons-residual-decomposition-version",
    "v81-horizons-residual-decomposition",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-horizons-residual-decomposition-status",
    /pending-runtime-run|ready-blocked-model-limit|ready-pass/,
  );
  await expect(root).toHaveAttribute(
    "data-atlas-horizons-candidate-lab-version",
    "v82-horizons-dynamical-parameter-candidate-lab",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-horizons-candidate-lab-status",
    /pending-offline-run|candidate-partial-unapplied|candidate-pass-unapplied/,
  );
  await expect(root).toHaveAttribute(
    "data-atlas-pluto-residual-isolation-version",
    "v83-pluto-residual-cause-isolation",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-pluto-residual-isolation-status",
    /pending-runtime-run|ready-candidate-limited|ready-candidate-actionable/,
  );
  await expect(root).toHaveAttribute(
    "data-atlas-outer-system-force-model-preflight-version",
    "v84-outer-system-force-model-preflight",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-outer-system-force-model-preflight-status",
    /pending-runtime-run|ready-fixture-provenance-blocked|ready-upgrade-path-limited|ready-upgrade-path-actionable/,
  );
  await expect(root).toHaveAttribute(
    "data-atlas-outer-system-reference-adoption-version",
    "v85-outer-system-reference-adoption-preflight",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-outer-system-reference-adoption-status",
    /pending-runtime-run|ready-adoption-candidate|ready-adoption-blocked|ready-default-gate-blocked/,
  );
  await expect(root).toHaveAttribute(
    "data-atlas-horizons-candidate-scientific-gate-version",
    "v86-horizons-candidate-scientific-gate",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-horizons-candidate-scientific-gate-status",
    /pending-runtime-run|candidate-gate-pass-unapplied|candidate-gate-fail|candidate-gate-blocked/,
  );
  await expect(root).toHaveAttribute(
    "data-atlas-strict-horizons-migration-dry-run-version",
    "v87-strict-horizons-migration-dry-run",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-strict-horizons-migration-dry-run-status",
    /pending-runtime-run|ready-migration-diff-complete|ready-migration-blocked|ready-default-gate-still-blocked/,
  );
  await expect(root).toHaveAttribute(
    "data-atlas-strict-horizons-shadow-migration-gate-version",
    "v88-strict-horizons-shadow-migration-gate",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-strict-horizons-shadow-migration-gate-status",
    /pending-runtime-run|ready-shadow-gate-pass|ready-shadow-gate-blocked|ready-default-gate-still-blocked/,
  );
  await expect(root).toHaveAttribute(
    "data-atlas-default-strict-horizons-migration-version",
    "v89-default-strict-horizons-scientific-gate-migration",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-default-strict-horizons-migration-status",
    /pending-runtime-run|ready-default-gate-migrated|ready-migration-blocked|ready-legacy-v75-blocker-preserved/,
  );
  await expect(root).toHaveAttribute(
    "data-atlas-horizons-provenance-freeze-version",
    "v90-horizons-provenance-freeze",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-horizons-provenance-freeze-status",
    /pending-runtime-run|ready-freeze-locked|ready-freeze-blocked|ready-legacy-audit-preserved/,
  );
  await expect(root).toHaveAttribute(
    "data-atlas-offline-runtime-boundary-audit-version",
    "v91-offline-runtime-boundary-audit",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-offline-runtime-boundary-audit-status",
    /pending-runtime-run|ready-boundary-locked|ready-boundary-blocked|ready-runtime-claims-clean/,
  );
  await expect(root).toHaveAttribute(
    "data-atlas-scientific-gate-maintenance-runbook-version",
    "v92-scientific-gate-maintenance-runbook-lock",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-scientific-gate-maintenance-runbook-status",
    /pending-runtime-run|ready-runbook-locked|ready-runbook-blocked|ready-rollback-audit-preserved/,
  );
  await expect(root).toHaveAttribute(
    "data-atlas-scientific-gate-release-evidence-version",
    "v93-scientific-gate-release-evidence-lock",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-scientific-gate-release-evidence-status",
    /pending-runtime-run|ready-release-evidence-locked|ready-release-evidence-blocked|ready-release-verification-matrix-locked/,
  );
  await expect(root).toHaveAttribute(
    "data-atlas-browser-ci-stability-lock-version",
    "v94-browser-ci-stability-lock",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-browser-ci-stability-lock-status",
    /pending-runtime-run|ready-browser-ci-locked|ready-browser-ci-blocked|ready-fresh-teardown-preserved/,
  );
  await expect(root).toHaveAttribute(
    "data-atlas-release-artifact-manifest-lock-version",
    "v95-release-artifact-manifest-lock",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-release-artifact-manifest-lock-status",
    /pending-runtime-run|ready-artifact-manifest-locked|ready-artifact-manifest-blocked|ready-release-bundle-indexed/,
  );
  await expect(root).toHaveAttribute(
    "data-atlas-final-maintenance-baseline-version",
    "v96-final-maintenance-baseline",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-final-maintenance-baseline-status",
    /pending-runtime-run|ready-maintenance-baseline-locked|ready-maintenance-baseline-blocked|ready-post-baseline-boundary-locked/,
  );
  await expect(root).toHaveAttribute(
    "data-atlas-gaia-starfield-enhancement-version",
    "v97-gaia-starfield-enhancement",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-gaia-starfield-enhancement-status",
    /pending-runtime-run|ready-gaia-overlay-locked|ready-gaia-overlay-blocked|ready-visual-overlay-budgeted/,
  );
  await expect(root).toHaveAttribute(
    "data-atlas-orbit-hierarchy-profile",
    "major-identity-minor-restrained",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-orbit-performance-profile",
    "closeup-selected-orbit-budget",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-orbit-material-profile",
    "v67-layered-depth-orbit-ribbons",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-solar-closeup-profile",
    "solar-limb-controlled-corona",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-velocity-trail-profile",
    "selected-log-velocity-three-stop",
  );
  await expect(root).toHaveAttribute(
    "data-atlas-orbit-occlusion-profile",
    "depth-tested-closeup-fade",
  );
  await expect(root).toHaveAttribute("data-atlas-closeup-preview-sync-status", "selected-body-synced");
  await expect(root).toHaveAttribute("data-atlas-closeup-preview-body-id", expected.selectedBodyId);
  await expect(root).toHaveAttribute("data-atlas-closeup-preview-render-profile", expected.previewRenderProfile);
  await expect(root).toHaveAttribute("data-atlas-closeup-solar-backdrop-profile", expected.solarBackdropProfile);
  await expect(root).toHaveAttribute(
    "data-atlas-closeup-planet-readability-profile",
    expected.planetReadabilityProfile,
  );
  await expect(root).toHaveAttribute("data-atlas-closeup-review-mode", /standard|scene-review/);
  const preview = page.locator(`[data-atlas-body-preview-id="${expected.selectedBodyId}"]`).first();
  await expect(preview).toHaveAttribute("data-atlas-body-preview-profile", expected.previewRenderProfile);
  await expect(preview).toHaveAttribute("data-atlas-body-preview-texture-policy", expected.previewTexturePolicy);
  await expect(preview).toHaveAttribute("data-atlas-body-preview-ring-state", expected.previewRingState);
  await expect(root).toHaveAttribute("data-atlas-cinematic-subject-in-frame", "true", { timeout: 8000 });
  const framing = await root.evaluate((element) => ({
    x: Number(element.getAttribute("data-atlas-cinematic-subject-screen-x") ?? "NaN"),
    y: Number(element.getAttribute("data-atlas-cinematic-subject-screen-y") ?? "NaN"),
    radius: Number(element.getAttribute("data-atlas-cinematic-subject-radius-px") ?? "NaN"),
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  expect(framing.x, "selected subject x").toBeGreaterThanOrEqual(0);
  expect(framing.x, "selected subject x").toBeLessThanOrEqual(framing.width);
  expect(framing.y, "selected subject y").toBeGreaterThanOrEqual(0);
  expect(framing.y, "selected subject y").toBeLessThanOrEqual(framing.height);
  expect(framing.radius, "selected subject radius").toBeGreaterThan(expected.selectedBodyId === "sun" ? 18 : 10);
  await expect(page.locator('[data-atlas-camera-safe-occluder="body-detail"]')).toHaveCount(1);
  await expect
    .poll(
      async () => root.evaluate((element) => {
        const subjectX = Number(element.getAttribute("data-atlas-cinematic-subject-screen-x") ?? "NaN");
        const subjectY = Number(element.getAttribute("data-atlas-cinematic-subject-screen-y") ?? "NaN");
        const subjectRadius = Number(element.getAttribute("data-atlas-cinematic-subject-radius-px") ?? "NaN");
        const panel = document.querySelector<HTMLElement>('[data-atlas-camera-safe-occluder="body-detail"]');
        if (!panel || !Number.isFinite(subjectX) || !Number.isFinite(subjectY) || !Number.isFinite(subjectRadius)) return Number.POSITIVE_INFINITY;
        const panelRect = panel.getBoundingClientRect();
        const overlapWidth = Math.max(0, Math.min(subjectX + subjectRadius, panelRect.right) - Math.max(subjectX - subjectRadius, panelRect.left));
        const overlapHeight = Math.max(0, Math.min(subjectY + subjectRadius, panelRect.bottom) - Math.max(subjectY - subjectRadius, panelRect.top));
        return overlapWidth * overlapHeight;
      }),
      {
        message: `${expected.selectedBodyId} close-up subject should not overlap the body detail safe area`,
        timeout: 8_000,
        intervals: [120, 180, 240, 320],
      },
    )
    .toBe(0);
  const maximumSettledRadius = Math.max(framing.width, framing.height) * 0.72;
  await expect
    .poll(
      async () =>
        Number(
          (await root.getAttribute("data-atlas-cinematic-subject-radius-px")) ?? "Infinity",
        ),
      {
        message: `${expected.selectedBodyId} close-up camera should settle outside the subject`,
        timeout: 8_000,
        intervals: [120, 180, 240, 320],
      },
    )
    .toBeLessThan(maximumSettledRadius);
  await page.waitForTimeout(320);
  await expect(page.locator('[data-atlas-planetary-visual-fidelity-version="v43-planetary-visual-fidelity-pass"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-cinematic-lighting-version="v44-cinematic-lighting-composition"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-cinematic-deep-space-camera-version="v46-cinematic-deep-space-camera"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-universe-sandbox-reference-version="v47-universe-sandbox-reference-backdrop"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-reference-grade-space-art-version="v48-reference-grade-space-art"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-planetary-material-composition-version="v49-planetary-material-composition"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-cinematic-closeup-director-version="v50-cinematic-closeup-director"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-cinematic-key-light-director-version="v51-cinematic-key-light-director"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-planetary-depth-lighting-version="v52-planetary-depth-lighting"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-planetary-color-grading-version="v53-planetary-color-grading"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-numerical-integrity-version="v54-numerical-integrity-gate"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-cinematic-planetary-art-version="v55-cinematic-planetary-art-direction"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-cinematic-deep-space-backdrop-version="v56-cinematic-deep-space-backdrop"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-sparse-deep-space-version="v57-sparse-deep-space-director"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-closeup-presentation-truth-version="v58-closeup-presentation-truth"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-background-orbit-art-version="v69-legacy-8k-sky-restore"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-visual-stability-version="v70-visual-stability-material-pass"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-sky-art-lock-profile="v69-legacy-blue-dust-starfield-locked"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-material-stability-profile="v70-earth-saturn-sun-material-coherence"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-background-guard-version="v71-background-regression-guard"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-sky-regression-budget-profile="v71-v69-legacy-blue-dust-budget"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-material-profile-version="v72-material-profile-contract"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-closeup-material-budget-profile="v72-earth-saturn-sun-closeup-material-budget"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-closeup-visual-fidelity-version="v76-closeup-visual-fidelity-pass"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-closeup-asset-policy="v76-local-hd-planets-existing-source-audited"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-closeup-protected-sky-manifest="orbit-atlas-v9"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-closeup-full-release-gate-status="product-ready-scientific-horizons-blocked"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-relativity-verification-version="v73-relativity-verification-readability"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-relativity-benchmark-profile="v73-weak-field-kerr-benchmark-readout"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-relativity-kerr-kernel="eih-1pn+kerr-geodesic-v17"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-relativity-chart-version="v74-relativity-verification-charts"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-relativity-chart-profile="v74-newtonian-eih-kerr-readout-curves"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-relativity-chart-hamiltonian-classification="numerical-health-only"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-physics-benchmark-gate-version="v75-physics-benchmark-release-gate"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-physics-benchmark-budget-profile="v75-weak-field-horizons-kerr-error-budget"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-physics-benchmark-ci-certification="not-claimed-in-app"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-horizons-gate-audit-version="v77-horizons-gate-closure-audit"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-horizons-gate-audit-profile="v77-j2000-frame-unit-integrator-audit"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-physics-gate-split-version="v78-product-scientific-physics-gate-split"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-product-release-gate-status="pass"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-release-readiness-version="v79-release-readiness-gate-semantics"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-release-readiness-status="product-ready-scientific-horizons-blocked"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-scientific-gate-preflight-version="v80-scientific-horizons-closure-preflight"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-scientific-gate-preflight-status="product-ready-strict-scientific-blocked-preflight-ready"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-horizons-residual-decomposition-version="v81-horizons-residual-decomposition"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-horizons-residual-decomposition-profile="v81-rtn-body-checkpoint-error-attribution"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-horizons-candidate-lab-version="v82-horizons-dynamical-parameter-candidate-lab"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-horizons-candidate-lab-profile="v82-de440-gm-softening-step-hierarchy-matrix"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-pluto-residual-isolation-version="v83-pluto-residual-cause-isolation"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-pluto-residual-isolation-profile="v83-outer-system-phase-force-model-matrix"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-outer-system-force-model-preflight-version="v84-outer-system-force-model-preflight"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-outer-system-force-model-preflight-profile="v84-pluto-barycenter-tno-force-model-upgrade-path"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-outer-system-reference-adoption-version="v85-outer-system-reference-adoption-preflight"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-outer-system-reference-adoption-profile="v85-barycentric-fixture-adoption-readiness"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-horizons-candidate-scientific-gate-version="v86-horizons-candidate-scientific-gate"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-horizons-candidate-scientific-gate-profile="v86-barycentric-reference-candidate-gate"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-strict-horizons-migration-dry-run-version="v87-strict-horizons-migration-dry-run"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-strict-horizons-migration-dry-run-profile="v87-default-gate-migration-diff-audit"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-strict-horizons-shadow-migration-gate-version="v88-strict-horizons-shadow-migration-gate"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-strict-horizons-shadow-migration-gate-profile="v88-parallel-default-gate-rehearsal"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-default-strict-horizons-migration-version="v89-default-strict-horizons-scientific-gate-migration"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-default-strict-horizons-migration-profile="v89-apply-barycentric-reference-default-gate"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-horizons-provenance-freeze-version="v90-horizons-provenance-freeze"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-horizons-provenance-freeze-profile="v90-default-gate-command-fixture-hash-lock"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-offline-runtime-boundary-audit-version="v91-offline-runtime-boundary-audit"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-offline-runtime-boundary-audit-profile="v91-scientific-gate-runtime-boundary-lock"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-scientific-gate-maintenance-runbook-version="v92-scientific-gate-maintenance-runbook-lock"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-scientific-gate-maintenance-runbook-profile="v92-offline-gate-release-rollback-command-runbook"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-scientific-gate-release-evidence-version="v93-scientific-gate-release-evidence-lock"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-scientific-gate-release-evidence-profile="v93-offline-gate-release-evidence-bundle"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-browser-ci-stability-lock-version="v94-browser-ci-stability-lock"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-browser-ci-stability-lock-profile="v94-fresh-browser-ci-runtime-stability"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-release-artifact-manifest-lock-version="v95-release-artifact-manifest-lock"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-release-artifact-manifest-lock-profile="v95-offline-release-artifact-manifest"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-final-maintenance-baseline-version="v96-final-maintenance-baseline"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-final-maintenance-baseline-profile="v96-final-offline-maintenance-baseline"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-gaia-starfield-enhancement-version="v97-gaia-starfield-enhancement"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-gaia-starfield-enhancement-profile="v97-gaia-constellation-nebula-overlay"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-relativity-simulation-optimization-version="v98-relativity-simulation-optimization"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-relativity-simulation-optimization-profile="v98-relativity-observability-teaching-layer"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-art-polish-version="v99-art-polish"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-art-polish-profile="v99-gaia-overlay-closeup-presentation-polish"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-post-enhancement-baseline-version="v100-post-enhancement-maintenance-baseline"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-post-enhancement-baseline-profile="v100-v97-v99-visual-teaching-maintenance-lock"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-browser-resource-performance-version="v101-browser-resource-performance-lock"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-browser-resource-performance-profile="v101-fresh-browser-resource-performance"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-maintenance-evidence-index-version="v102-maintenance-evidence-index"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-maintenance-evidence-index-profile="v102-v93-v101-maintenance-evidence-index"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-presentation-runtime-performance-version="v103-presentation-runtime-performance-lock"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-presentation-runtime-performance-profile="v103-gaia-constellation-label-runtime-cost"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-browser-acceptance-runtime-cost-version="v104-browser-acceptance-runtime-cost-lock"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-browser-acceptance-runtime-cost-profile="v104-fresh-browser-acceptance-cost-review"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-final-gaia-art-enhancement-version="v105-final-gaia-art-enhancement-lock"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-final-gaia-art-enhancement-profile="v105-budget-preserved-gaia-art-polish"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-rc-evidence-closure-version="v106-release-candidate-evidence-closure-lock"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-rc-evidence-closure-profile="v106-v93-v105-final-rc-evidence-closure"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-interaction-catalog-completion-version="v107-interaction-catalog-completion-lock"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-interaction-catalog-completion-profile="v107-camera-launch-gaia-navigation-catalog-completion"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-interaction-repair-launch-ux-version="v108-interaction-repair-launch-ux-lock"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-interaction-repair-launch-ux-profile="v108-sky-target-zoom-launch-ux-repair"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-interaction-visual-quality-version="v109-interaction-visual-quality-lock"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-interaction-visual-quality-profile="v109-launch-camera-gaia-material-quality"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-critical-ui-relativity-visibility-version="v110-critical-ui-relativity-visibility-lock"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-critical-ui-relativity-visibility-profile="v110-visible-chinese-copy-relativity-core-entry"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-camera-stellar-closeup-version="v111-camera-stellar-closeup-lock"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-camera-stellar-closeup-profile="v111-camera-rig-stellar-portrait-closeup"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-launch-gameplay-openrocket-bridge-version="v112-launch-gameplay-openrocket-bridge-lock"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-launch-gameplay-openrocket-bridge-import-policy="offline-import-no-browser-exe-launch"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-scientific-model-upgrade-contract-version="v113-scientific-model-upgrade-contract"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-scientific-model-upgrade-contract-policy="contract-only-no-core-mutation"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-visual-launch-performance-version="v114-visual-launch-performance-lock"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-visual-launch-performance-profile="v114-scene-director-runtime-quality"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-visual-launch-performance-runtime-policy="presentation-only-quality-tier-scheduling"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-visual-launch-performance-openrocket-policy="offline-import-no-browser-exe-launch"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-runtime-scene-focus-performance-version="v115-runtime-scene-focus-performance-lock"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-runtime-scene-focus-performance-profile="v115-scene-isolation-telemetry-focus-latency"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-runtime-scene-focus-performance-scene-policy="launch-exclusive-r3f-and-dom-layers"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-orbit-performance-profile="closeup-selected-orbit-budget"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-orbit-material-profile="v67-layered-depth-orbit-ribbons"]')).toHaveCount(1);
  await expect(page.locator('[data-atlas-solar-closeup-profile="solar-limb-controlled-corona"]')).toHaveCount(1);
}

async function expectDataAttributeValues(
  owner: Page | Locator,
  attribute: string,
  expectedValues: readonly string[],
  label: string,
): Promise<void> {
  const values = await owner.locator(`[${attribute}]`).evaluateAll((elements, rawAttribute) =>
    elements
      .map((element) => element.getAttribute(String(rawAttribute)))
      .filter((value): value is string => typeof value === "string"),
    attribute,
  );
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  const failures = expectedValues.flatMap((value) => {
    const count = counts.get(value) ?? 0;
    return count === 1 ? [] : [{ value, count }];
  });
  expect(failures, `${label} must contain each expected ${attribute} exactly once`).toEqual([]);
}

async function openNavigatorResult(
  page: Page,
  query: string,
  itemId: string,
): Promise<void> {
  const searchButton = page.getByRole("button", { exact: true, name: "搜索" });
  await expect(searchButton).toHaveCount(1);
  await searchButton.click();

  const navigator = page.getByRole("dialog", { exact: true, name: "图谱导航" });
  await expect(navigator).toBeVisible();
  await page.getByLabel("搜索图谱导航", { exact: true }).fill(query);

  const result = page.locator(`[data-atlas-navigator-item-id="${itemId}"]`);
  await expect(result).toHaveCount(1);
  await result.click();
  await expect(navigator).toBeHidden();
}

async function assertNavigatorKeyboardContract(page: Page): Promise<void> {
  const searchButton = page.getByRole("button", { exact: true, name: "搜索" });
  await searchButton.focus();
  await page.keyboard.press("Enter");

  const navigator = page.getByRole("dialog", { exact: true, name: "图谱导航" });
  const input = page.getByLabel("搜索图谱导航", { exact: true });
  await expect(navigator).toBeVisible();
  await expect(input).toBeFocused();
  await expectAccessibleSurface(page, "navigator");

  await page.keyboard.press("Shift+Tab");
  for (let index = 0; index < 8; index += 1) {
    expect(
      await page.locator(":focus").evaluate((element) =>
        Boolean(element.closest('[role="dialog"][aria-label="图谱导航"]')),
      ),
    ).toBe(true);
    await page.keyboard.press("Tab");
  }

  await page.keyboard.press("Escape");
  await expect(navigator).toBeHidden();
  await expect(searchButton).toBeFocused();
}

async function assertReducedMotionPolicy(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const motion = await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.className = "ui-ring-spin";
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe);
    const result = {
      duration: computed.animationDuration,
      iterationCount: computed.animationIterationCount,
      transitionDuration: computed.transitionDuration,
    };
    probe.remove();
    return result;
  });
  expect(Number.parseFloat(motion.duration)).toBeLessThanOrEqual(0.01);
  expect(motion.iterationCount).toBe("1");
  expect(Number.parseFloat(motion.transitionDuration)).toBeLessThanOrEqual(0.01);
  await page.emulateMedia({ reducedMotion: "no-preference" });
}

async function expectAccessibleSurface(
  page: Page,
  surfaceId: string,
  requireFocus = true,
): Promise<void> {
  const selector = `[data-atlas-accessibility-surface-id="${surfaceId}"]`;
  const surface = page.locator(selector);
  await expect(surface).toHaveCount(1);
  await expect(surface).toBeVisible();
  await expect(surface).toHaveAttribute("data-atlas-accessibility-focus-target", "true");

  if (requireFocus && surfaceId !== "navigator") {
    await expect(surface).toBeFocused();
  }

  const targetFailures = await surface.locator("button, input, select, textarea").evaluateAll((elements) =>
    elements.flatMap((element) => {
      const control = element as HTMLElement;
      const rect = control.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return [];
      if (rect.width >= 24 && rect.height >= 24) return [];
      return [{ tag: control.tagName, width: rect.width, height: rect.height, text: control.textContent?.trim() }];
    }),
  );
  expect(targetFailures, `${surfaceId} controls must be at least 24px`).toEqual([]);

  const results = await new AxeBuilder({ page })
    .include(selector)
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    results.violations,
    `${surfaceId} accessibility violations: ${results.violations
      .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`)
      .join("; ")}`,
  ).toEqual([]);

  const backgroundAlpha = await surface.evaluate((element) => {
    const paintedSurface = element.matches(".atlas-accessible-surface")
      ? element
      : element.querySelector(".atlas-accessible-surface");
    const color = getComputedStyle(paintedSurface ?? element).backgroundColor;
    const channels = color
      .match(/rgba?\(([^)]+)\)/)?.[1]
      ?.split(",")
      .map((part) => Number.parseFloat(part.trim()));
    return channels?.length === 4 ? channels[3] : 1;
  });
  expect(backgroundAlpha, `${surfaceId} surface must stay opaque for AA contrast`).toBe(1);
}

async function closePanel(page: Page, closeButtonName: string): Promise<void> {
  const closeButton = page.getByRole("button", { exact: true, name: closeButtonName });
  await expect(closeButton).toHaveCount(1);
  await closeButton.click();
  await expect(closeButton).toBeHidden();
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => ({
    bodyOverflow: document.body.scrollWidth - window.innerWidth,
    documentOverflow: document.documentElement.scrollWidth - window.innerWidth,
    width: window.innerWidth,
  }));
  expect(overflow.documentOverflow, `document overflow at ${overflow.width}px`).toBeLessThanOrEqual(0);
  expect(overflow.bodyOverflow, `body overflow at ${overflow.width}px`).toBeLessThanOrEqual(0);
}

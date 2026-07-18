import { createAtlasPresentationRuntimePerformanceSummary } from "./atlasPresentationRuntimePerformanceLock";
import { runAtlasPresentationRuntimePerformanceAudit } from "./atlasPresentationRuntimePerformanceLockRunner";
import {
  ATLAS_BROWSER_ACCEPTANCE_RUNTIME_COST_BOUNDARY,
  V104_BROWSER_ACCEPTANCE_RUNTIME_COST_ROW,
} from "./atlasBrowserAcceptanceRuntimeCostLock";
import type {
  AtlasBrowserAcceptanceRuntimeCostAudit,
  AtlasBrowserAcceptanceRuntimeCostRow,
  HorizonsValidationDataset,
} from "./simulationDiagnosticsTypes";

type FixtureEvidenceAudit = {
  path: string;
  sha256: string;
  sizeBytes: number;
};

export async function runAtlasBrowserAcceptanceRuntimeCostAudit(args: {
  baselineDataset: HorizonsValidationDataset;
  v82HierarchyDataset?: HorizonsValidationDataset | null;
  v84OuterSystemDataset?: HorizonsValidationDataset | null;
  packageScripts?: Readonly<Record<string, string>>;
  migratedFixtureAudit?: FixtureEvidenceAudit;
  legacyFixtureAudit?: FixtureEvidenceAudit;
  docsText?: string;
  surfaceText?: string;
  browserSpecText?: string;
  freshConfigText?: string;
  freshTeardownText?: string;
  gaiaBrightRowCount?: number;
  gaiaKinematicsRowCount?: number;
  constellationRenderGroupCount?: number;
  normalizedIauConstellationCount?: number;
  nebulaMarkerCount?: number;
  gaiaStarFieldText?: string;
  constellationLinesText?: string;
  bodyLabelText?: string;
  celestialCatalogLabelsText?: string;
}): Promise<{
  audits: readonly AtlasBrowserAcceptanceRuntimeCostAudit[];
  rows: readonly AtlasBrowserAcceptanceRuntimeCostRow[];
}> {
  const docsText = args.docsText ?? "";
  const surfaceText = args.surfaceText ?? "";
  const browserSpecText = args.browserSpecText ?? "";
  const combinedSurface = `${surfaceText}\n${browserSpecText}`;
  const v103Audit = await runAtlasPresentationRuntimePerformanceAudit({
    baselineDataset: args.baselineDataset,
    v82HierarchyDataset: args.v82HierarchyDataset,
    v84OuterSystemDataset: args.v84OuterSystemDataset,
    packageScripts: args.packageScripts,
    migratedFixtureAudit: args.migratedFixtureAudit,
    legacyFixtureAudit: args.legacyFixtureAudit,
    docsText,
    surfaceText,
    browserSpecText,
    freshConfigText: args.freshConfigText,
    freshTeardownText: args.freshTeardownText,
    gaiaBrightRowCount: args.gaiaBrightRowCount,
    gaiaKinematicsRowCount: args.gaiaKinematicsRowCount,
    constellationRenderGroupCount: args.constellationRenderGroupCount,
    normalizedIauConstellationCount: args.normalizedIauConstellationCount,
    nebulaMarkerCount: args.nebulaMarkerCount,
    gaiaStarFieldText: args.gaiaStarFieldText,
    constellationLinesText: args.constellationLinesText,
    bodyLabelText: args.bodyLabelText,
    celestialCatalogLabelsText: args.celestialCatalogLabelsText,
  });
  const v103Summary = createAtlasPresentationRuntimePerformanceSummary(v103Audit);

  const audits = [
    priorV103Lock(v103Summary.status, v103Summary.classification),
    screenshotWorkloadLock(browserSpecText, args.packageScripts ?? {}),
    markerCoverageLock(browserSpecText, combinedSurface),
    freshTeardownLock(args.freshConfigText ?? "", args.freshTeardownText ?? "", args.packageScripts ?? {}),
    consoleErrorLock(browserSpecText),
    budgetThresholdLock(browserSpecText, `${docsText}\n${combinedSurface}`),
    docsSurfaceLock(docsText, combinedSurface, args.packageScripts ?? {}),
    protectedMutationLock(surfaceText),
  ] as const satisfies readonly AtlasBrowserAcceptanceRuntimeCostAudit[];

  return {
    audits,
    rows: [browserAcceptanceRuntimeCostRow(audits)],
  };
}

function priorV103Lock(
  status: string,
  classification: string,
): AtlasBrowserAcceptanceRuntimeCostAudit {
  const ready =
    status === "ready-presentation-runtime-performance-locked" &&
    classification === "presentation-runtime-performance-pass";
  return audit(
    "v103-presentation-runtime-performance",
    "v103 presentation runtime performance",
    ready,
    `${status}; ${classification}`,
    "ready-presentation-runtime-performance-locked; presentation-runtime-performance-pass",
    "v104 reuses v103 heavy audit output instead of copying its internal judgment logic.",
  );
}

function screenshotWorkloadLock(
  browserSpecText: string,
  scripts: Readonly<Record<string, string>>,
): AtlasBrowserAcceptanceRuntimeCostAudit {
  const ready =
    scripts["test:atlas:browser:fresh:review"] ===
      "node tests/atlas-browser/run-fresh-review.mjs" &&
    browserSpecText.includes("ATLAS_BROWSER_REVIEW_SCREENSHOTS") &&
    browserSpecText.includes("V104_BROWSER_ACCEPTANCE_DEFAULT_SCREENSHOT_IDS") &&
    browserSpecText.includes("V104_BROWSER_ACCEPTANCE_FULL_REVIEW_SCREENSHOT_IDS") &&
    browserSpecText.includes("captureV104ManifestScreenshot") &&
    browserSpecText.includes("v104-browser-acceptance-runtime-cost-lock") &&
    browserSpecText.includes("default-current-plus-core-full-review-history");
  return audit(
    "screenshot-workload-lock",
    "Browser screenshot workload manifest split",
    ready,
    ready
      ? "default/current screenshot manifest split with opt-in full historical review"
      : "v104 screenshot workload split marker missing",
    "default/current screenshot manifest split with opt-in full historical review",
    "v104 may reduce default browser screenshot artifact cost while preserving full review capability.",
  );
}

function markerCoverageLock(
  browserSpecText: string,
  surfaceText: string,
): AtlasBrowserAcceptanceRuntimeCostAudit {
  const required = [
    "data-atlas-browser-acceptance-runtime-cost-version",
    "data-atlas-browser-acceptance-runtime-cost-profile",
    "data-atlas-browser-acceptance-runtime-cost-status",
    "data-atlas-browser-acceptance-runtime-cost-strip",
    "data-atlas-browser-acceptance-runtime-cost-table",
    "data-evidence-claim-id=\"browser-acceptance-runtime-cost-lock\"",
    "data-atlas-validation-domain-id=\"browser-acceptance-runtime-cost-lock\"",
  ];
  const ready =
    required.every((token) => surfaceText.includes(token) || browserSpecText.includes(token));
  return audit(
    "marker-coverage-lock",
    "Root, Observable, Evidence and Validation marker coverage",
    ready,
    ready ? "v104 marker coverage preserved" : "v104 marker coverage missing",
    "v104 marker coverage preserved",
    "v104 must not reduce root, Observable Atlas, Evidence Ledger or Validation Console marker coverage.",
  );
}

function freshTeardownLock(
  freshConfigText: string,
  freshTeardownText: string,
  scripts: Readonly<Record<string, string>>,
): AtlasBrowserAcceptanceRuntimeCostAudit {
  const ready =
    scripts["test:atlas:browser:fresh"] === "playwright test -c playwright.atlas.fresh.config.ts" &&
    freshConfigText.includes("3015") &&
    freshTeardownText.includes("3015") &&
    freshTeardownText.includes("Stop-Process") &&
    freshConfigText.includes("globalTeardown");
  return audit(
    "fresh-teardown-lock",
    "Fresh 3015 teardown policy",
    ready,
    ready ? "fresh 3015 teardown preserved" : "fresh 3015 teardown marker missing",
    "fresh 3015 teardown preserved",
    "v104 must not make port residue a normal successful state.",
  );
}

function consoleErrorLock(browserSpecText: string): AtlasBrowserAcceptanceRuntimeCostAudit {
  const ready =
    browserSpecText.includes("consoleErrors") &&
    browserSpecText.includes("pageErrors") &&
    browserSpecText.includes("expect(consoleErrors") &&
    browserSpecText.includes("expect(pageErrors") &&
    browserSpecText.includes("toEqual([])");
  return audit(
    "console-error-lock",
    "Console and page-error observability",
    ready,
    ready ? "console/page-error zero checks preserved" : "console/page-error zero check missing",
    "console/page-error zero checks preserved",
    "v104 must preserve app console error and page error checks while Watchpack Windows file warnings remain known non-failure dev-server noise.",
  );
}

function budgetThresholdLock(
  browserSpecText: string,
  text: string,
): AtlasBrowserAcceptanceRuntimeCostAudit {
  const ready =
    browserSpecText.includes("captureV50ReviewScreenshot") &&
    browserSpecText.includes("assertCanvasBackdropPixelBudget") &&
    browserSpecText.includes("assertCloseupMaterialPixelBudget") &&
    browserSpecText.includes("sampleScreenshotPixelMetrics") &&
    browserSpecText.includes("attempt < 3") &&
    text.includes("browser pixel thresholds") &&
    text.includes("v97 Gaia budgets") &&
    text.includes("v99 opacity caps");
  return audit(
    "budget-threshold-lock",
    "Browser pixel threshold and frozen visual budget preservation",
    ready,
    ready ? "pixel thresholds, retry/settle and v97/v99 budgets preserved" : "pixel threshold preservation marker missing",
    "pixel thresholds, retry/settle and v97/v99 budgets preserved",
    "v104 must not loosen screenshot retry, settle policy, pixel thresholds, Gaia budgets or opacity caps.",
  );
}

function docsSurfaceLock(
  docsText: string,
  surfaceText: string,
  scripts: Readonly<Record<string, string>>,
): AtlasBrowserAcceptanceRuntimeCostAudit {
  const ready =
    scripts["test:atlas:browser-acceptance-runtime-cost"] ===
      "vitest run app/lib/atlasBrowserAcceptanceRuntimeCostLock.horizons.test.ts" &&
    scripts["verify:atlas:browser-acceptance-runtime"] ===
      "npm run test:atlas:browser-acceptance-runtime-cost && npm run test:atlas:browser:fresh" &&
    docsText.includes("v104 Browser Acceptance Runtime Cost Lock") &&
    docsText.includes("test-results/v104-browser-acceptance-runtime-cost-lock/") &&
    surfaceText.includes("data-atlas-browser-acceptance-runtime-cost-version") &&
    surfaceText.includes("data-atlas-browser-acceptance-runtime-cost-strip") &&
    surfaceText.includes("data-atlas-browser-acceptance-runtime-cost-table") &&
    surfaceText.includes("browser-acceptance-runtime-cost-lock") &&
    surfaceText.includes("v104-browser-acceptance-runtime-cost-lock");
  return audit(
    "docs-surface-lock",
    "v104 docs, root DOM, Observable, Evidence, Validation and browser surface",
    ready,
    ready ? "v104 docs and surface markers present" : "v104 docs or surface marker missing",
    "v104 docs and surface markers present",
    "v104 surfaces must present browser screenshot cost splitting without scientific, fixture, physics, sky, visual budget or release packaging claims.",
  );
}

function protectedMutationLock(surfaceText: string): AtlasBrowserAcceptanceRuntimeCostAudit {
  const required = [
    "runtimePerformanceMutation: \"not-applied\"",
    "livePhysicsMutation: \"not-applied\"",
    "workerPhysicsMutation: \"not-applied\"",
    "rk4DefaultMutation: \"not-applied\"",
    "eihOnePnMutation: \"not-applied\"",
    "kerrKernelMutation: \"not-applied\"",
    "skyAssetMutation: \"not-applied\"",
    "backgroundMutation: \"not-applied\"",
    "v9SkyDirectionMutation: \"not-applied\"",
    "materialMutation: \"not-applied\"",
    "fixtureDataMutation: \"not-applied\"",
    "budgetMutation: \"not-applied\"",
    "defaultGateConfigMutation: \"not-applied\"",
    "releasePackagingMutation: \"not-applied\"",
    "certificationClaimMutation: \"not-applied\"",
    "browserAcceptanceRuntimeCost: \"applied-browser-screenshot-manifest-split\"",
  ];
  const ready = required.every((token) => surfaceText.includes(token));
  return audit(
    "protected-mutation-lock",
    "Protected mutation flags and browser-cost-only scope",
    ready,
    ready
      ? "protected mutation flags not-applied; browser screenshot manifest split applied"
      : "protected mutation flag or browser screenshot manifest marker missing",
    "protected mutation flags not-applied; browser screenshot manifest split applied",
    ATLAS_BROWSER_ACCEPTANCE_RUNTIME_COST_BOUNDARY,
  );
}

function browserAcceptanceRuntimeCostRow(
  audits: readonly AtlasBrowserAcceptanceRuntimeCostAudit[],
): AtlasBrowserAcceptanceRuntimeCostRow {
  const statusFor = (ids: readonly AtlasBrowserAcceptanceRuntimeCostAudit["id"][]) =>
    audits.filter((auditItem) => ids.includes(auditItem.id)).every((auditItem) => auditItem.status === "ready")
      ? "pass"
      : "fail";
  const ready = audits.every((auditItem) => auditItem.status === "ready");
  return {
    ...V104_BROWSER_ACCEPTANCE_RUNTIME_COST_ROW,
    status: ready ? "complete" : "blocked",
    v103Status: statusFor(["v103-presentation-runtime-performance"]),
    screenshotWorkloadStatus: statusFor(["screenshot-workload-lock"]),
    markerCoverageStatus: statusFor(["marker-coverage-lock"]),
    freshTeardownStatus: statusFor(["fresh-teardown-lock"]),
    consoleErrorStatus: statusFor(["console-error-lock"]),
    budgetThresholdStatus: statusFor(["budget-threshold-lock"]),
    docsSurfaceStatus: statusFor(["docs-surface-lock"]),
    protectedMutationStatus: statusFor(["protected-mutation-lock"]),
    browserAcceptanceRuntimeCost: "applied-browser-screenshot-manifest-split",
  };
}

function audit(
  id: AtlasBrowserAcceptanceRuntimeCostAudit["id"],
  label: string,
  ready: boolean,
  measured: string,
  expected: string,
  trustedBoundary: string,
): AtlasBrowserAcceptanceRuntimeCostAudit {
  return {
    id,
    label,
    status: ready ? "ready" : "regressed",
    measured,
    expected,
    trustedBoundary,
  };
}

export function v104BrowserAcceptanceRuntimeCostCommandContract(): Readonly<{
  focusedCommand: "npm run test:atlas:browser-acceptance-runtime-cost";
  browserAcceptanceRuntimeVerifyCommand: "npm run verify:atlas:browser-acceptance-runtime";
  defaultFreshCommand: "npm run test:atlas:browser:fresh";
  fullReviewCommand: "npm run test:atlas:browser:fresh:review";
  screenshotManifestPolicy: "default-current-plus-core-full-review-history";
  markerCoveragePolicy: "root-observable-evidence-validation-preserved";
  consoleErrorPolicy: "console-page-error-zero-preserved";
  freshTeardownPolicy: "fresh-3015-teardown-preserved";
}> {
  return {
    focusedCommand: "npm run test:atlas:browser-acceptance-runtime-cost",
    browserAcceptanceRuntimeVerifyCommand: "npm run verify:atlas:browser-acceptance-runtime",
    defaultFreshCommand: "npm run test:atlas:browser:fresh",
    fullReviewCommand: "npm run test:atlas:browser:fresh:review",
    screenshotManifestPolicy: "default-current-plus-core-full-review-history",
    markerCoveragePolicy: "root-observable-evidence-validation-preserved",
    consoleErrorPolicy: "console-page-error-zero-preserved",
    freshTeardownPolicy: "fresh-3015-teardown-preserved",
  };
}

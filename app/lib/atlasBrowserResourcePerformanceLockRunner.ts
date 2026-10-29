import {
  createAtlasPostEnhancementMaintenanceBaselineSummary,
} from "./atlasPostEnhancementMaintenanceBaseline";
import { runAtlasPostEnhancementMaintenanceBaselineAudit } from "./atlasPostEnhancementMaintenanceBaselineRunner";
import {
  ATLAS_BROWSER_RESOURCE_PERFORMANCE_BOUNDARY,
  V101_BROWSER_RESOURCE_PERFORMANCE_ROW,
} from "./atlasBrowserResourcePerformanceLock";
import type {
  AtlasBrowserResourcePerformanceAudit,
  AtlasBrowserResourcePerformanceRow,
  HorizonsValidationDataset,
} from "./simulationDiagnosticsTypes";

type FixtureEvidenceAudit = {
  path: string;
  sha256: string;
  sizeBytes: number;
};

export async function runAtlasBrowserResourcePerformanceAudit(args: {
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
}): Promise<{
  audits: readonly AtlasBrowserResourcePerformanceAudit[];
  rows: readonly AtlasBrowserResourcePerformanceRow[];
}> {
  const docsText = args.docsText ?? "";
  const surfaceText = args.surfaceText ?? "";
  const browserSpecText = args.browserSpecText ?? "";
  const freshConfigText = args.freshConfigText ?? "";
  const freshTeardownText = args.freshTeardownText ?? "";
  const combinedSurface = `${surfaceText}\n${browserSpecText}`;

  const v100Audit = await runAtlasPostEnhancementMaintenanceBaselineAudit({
    baselineDataset: args.baselineDataset,
    v82HierarchyDataset: args.v82HierarchyDataset,
    v84OuterSystemDataset: args.v84OuterSystemDataset,
    packageScripts: args.packageScripts,
    migratedFixtureAudit: args.migratedFixtureAudit,
    legacyFixtureAudit: args.legacyFixtureAudit,
    docsText,
    surfaceText,
    browserSpecText,
    freshConfigText,
    gaiaBrightRowCount: args.gaiaBrightRowCount,
    gaiaKinematicsRowCount: args.gaiaKinematicsRowCount,
    constellationRenderGroupCount: args.constellationRenderGroupCount,
    normalizedIauConstellationCount: args.normalizedIauConstellationCount,
    nebulaMarkerCount: args.nebulaMarkerCount,
  });
  const v100Summary = createAtlasPostEnhancementMaintenanceBaselineSummary(v100Audit);

  const audits = [
    priorV100Lock(v100Summary.status, v100Summary.classification),
    screenshotResourceHelperLock(browserSpecText),
    pixelSamplerHelperLock(browserSpecText),
    freshTeardownLock(freshConfigText, freshTeardownText),
    consoleErrorObservabilityLock(browserSpecText),
    docsSurfaceLock(docsText, combinedSurface),
    protectedMutationLock(surfaceText),
  ] as const satisfies readonly AtlasBrowserResourcePerformanceAudit[];

  return {
    audits,
    rows: [browserResourcePerformanceRow(audits)],
  };
}

function priorV100Lock(
  status: string,
  classification: string,
): AtlasBrowserResourcePerformanceAudit {
  const ready =
    status === "ready-post-enhancement-baseline-locked" &&
    classification === "post-enhancement-baseline-pass";
  return audit(
    "v100-post-enhancement-baseline-lock",
    "v100 post-enhancement maintenance baseline",
    ready,
    `${status}; ${classification}`,
    "ready-post-enhancement-baseline-locked; post-enhancement-baseline-pass",
    "v101 reuses v100 heavy audit output instead of copying its internal judgment logic.",
  );
}

function screenshotResourceHelperLock(browserSpecText: string): AtlasBrowserResourcePerformanceAudit {
  const measured = [
    browserSpecText.includes("async function captureV50ReviewScreenshot")
      ? "screenshot helper"
      : "screenshot helper missing",
    browserSpecText.includes("for (let attempt = 0; attempt < 3; attempt += 1)")
      ? "retry count preserved"
      : "retry count missing",
    browserSpecText.includes("await page.screenshot({ path, fullPage: false })")
      ? "path screenshot preserved"
      : "path screenshot missing",
    browserSpecText.includes("requestAnimationFrame(() => resolve())")
      ? "retry settle preserved"
      : "retry settle missing",
  ].join("; ");
  const expected = "screenshot helper; retry count preserved; path screenshot preserved; retry settle preserved";
  return audit(
    "screenshot-resource-helper-lock",
    "Screenshot helper finite retry and settle policy",
    measured === expected,
    measured,
    expected,
    "v101 keeps the existing screenshot retry contract and does not loosen browser acceptance thresholds.",
  );
}

function pixelSamplerHelperLock(browserSpecText: string): AtlasBrowserResourcePerformanceAudit {
  const createImageBitmapCount = (browserSpecText.match(/createImageBitmap/g) ?? []).length;
  const measured = [
    browserSpecText.includes("async function sampleScreenshotPixelMetrics")
      ? "shared sampler"
      : "shared sampler missing",
    createImageBitmapCount === 1 ? "single ImageBitmap allocation path" : `ImageBitmap paths ${createImageBitmapCount}`,
    browserSpecText.includes("image.close()") ? "explicit close" : "explicit close missing",
    browserSpecText.includes("canvas.width = 0") && browserSpecText.includes("canvas.height = 0")
      ? "canvas zero"
      : "canvas zero missing",
    browserSpecText.includes("for (let attempt = 0; attempt < 4; attempt += 1)")
      ? "pixel settle attempts preserved"
      : "pixel settle attempts missing",
    browserSpecText.includes("backdropPixelMetricsPass(metrics, mode)") &&
      browserSpecText.includes("closeupMaterialMetricsPass(metrics, target)")
      ? "threshold functions preserved"
      : "threshold function missing",
  ].join("; ");
  const expected =
    "shared sampler; single ImageBitmap allocation path; explicit close; canvas zero; pixel settle attempts preserved; threshold functions preserved";
  return audit(
    "pixel-sampler-helper-lock",
    "Shared screenshot pixel sampler resource lifecycle",
    measured === expected,
    measured,
    expected,
    "v101 centralizes browser acceptance bitmap/canvas sampling while preserving existing pixel budgets and wait strategy.",
  );
}

function freshTeardownLock(
  freshConfigText: string,
  freshTeardownText: string,
): AtlasBrowserResourcePerformanceAudit {
  const measured = [
    freshConfigText.includes('const baseUrl = "http://127.0.0.1:3015"') ? "3015" : "3015 missing",
    freshConfigText.includes('globalTeardown: "./tests/atlas-browser/atlas-browser-fresh-teardown.ts"')
      ? "global teardown"
      : "global teardown missing",
    freshConfigText.includes("reuseExistingServer: false") ? "no reuse" : "reuse policy missing",
    freshTeardownText.includes("netstat") && freshTeardownText.includes("Stop-Process")
      ? "teardown kills listener"
      : "teardown kill missing",
  ].join("; ");
  const expected = "3015; global teardown; no reuse; teardown kills listener";
  return audit(
    "fresh-teardown-lock",
    "Fresh browser 3015 teardown policy",
    measured === expected,
    measured,
    expected,
    "v101 preserves the fresh 3015 browser server semantics and requires teardown rather than treating port residue as normal.",
  );
}

function consoleErrorObservabilityLock(browserSpecText: string): AtlasBrowserResourcePerformanceAudit {
  const measured = [
    browserSpecText.includes("const consoleErrors: string[] = []") ? "console array" : "console array missing",
    browserSpecText.includes("const pageErrors: string[] = []") ? "page array" : "page array missing",
    browserSpecText.includes('message.type() === "error"') ? "console error filter" : "console filter missing",
    browserSpecText.includes("pageErrors.push(error.message)") ? "page error capture" : "page error capture missing",
    browserSpecText.includes('expect(consoleErrors, "console errors").toEqual([])') &&
      browserSpecText.includes('expect(pageErrors, "page errors").toEqual([])')
      ? "empty assertions"
      : "empty assertions missing",
  ].join("; ");
  const expected = "console array; page array; console error filter; page error capture; empty assertions";
  return audit(
    "console-error-observability-lock",
    "Console and page-error observability",
    measured === expected,
    measured,
    expected,
    "v101 requires page console and page-error observability without mutating runtime behavior.",
  );
}

function docsSurfaceLock(
  docsText: string,
  surfaceText: string,
): AtlasBrowserResourcePerformanceAudit {
  const ready =
    docsText.includes("v101 Browser Resource Performance Lock") &&
    docsText.includes("browser acceptance helper resource optimization") &&
    docsText.includes("does not change scientific gates") &&
    surfaceText.includes("data-atlas-browser-resource-performance-version") &&
    surfaceText.includes("data-atlas-browser-resource-performance-strip") &&
    surfaceText.includes("data-atlas-browser-resource-performance-table") &&
    surfaceText.includes("browser-resource-performance-lock") &&
    surfaceText.includes("v101-browser-resource-performance-lock");
  return audit(
    "docs-surface-lock",
    "v101 docs, root DOM, Observable, Evidence, Validation and browser surface",
    ready,
    ready ? "v101 docs and surface markers present" : "v101 docs or surface marker missing",
    "v101 docs and surface markers present",
    "v101 surfaces must present a browser resource stability lock, not a scientific, fixture, visual or release packaging upgrade.",
  );
}

function protectedMutationLock(surfaceText: string): AtlasBrowserResourcePerformanceAudit {
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
    "browserResourcePerformance: \"applied-browser-acceptance-helper-resource-optimization\"",
  ];
  const ready = required.every((token) => surfaceText.includes(token));
  return audit(
    "protected-mutation-lock",
    "Protected mutation flags and allowed browser helper optimization",
    ready,
    ready
      ? "protected mutation flags not-applied; browser acceptance helper optimization applied"
      : "protected mutation flag or helper optimization marker missing",
    "protected mutation flags not-applied; browser acceptance helper optimization applied",
    ATLAS_BROWSER_RESOURCE_PERFORMANCE_BOUNDARY,
  );
}

function browserResourcePerformanceRow(
  audits: readonly AtlasBrowserResourcePerformanceAudit[],
): AtlasBrowserResourcePerformanceRow {
  const statusFor = (ids: readonly AtlasBrowserResourcePerformanceAudit["id"][]) =>
    audits.filter((auditItem) => ids.includes(auditItem.id)).every((auditItem) => auditItem.status === "ready")
      ? "pass"
      : "fail";
  const ready = audits.every((auditItem) => auditItem.status === "ready");
  return {
    ...V101_BROWSER_RESOURCE_PERFORMANCE_ROW,
    status: ready ? "complete" : "blocked",
    v100BaselineStatus: statusFor(["v100-post-enhancement-baseline-lock"]),
    screenshotResourceStatus: statusFor(["screenshot-resource-helper-lock"]),
    pixelSamplerStatus: statusFor(["pixel-sampler-helper-lock"]),
    freshTeardownStatus: statusFor(["fresh-teardown-lock"]),
    consoleErrorStatus: statusFor(["console-error-observability-lock"]),
    docsSurfaceStatus: statusFor(["docs-surface-lock"]),
    protectedMutationStatus: statusFor(["protected-mutation-lock"]),
    browserResourcePerformance: "applied-browser-acceptance-helper-resource-optimization",
  };
}

function audit(
  id: AtlasBrowserResourcePerformanceAudit["id"],
  label: string,
  ready: boolean,
  measured: string,
  expected: string,
  trustedBoundary: string,
): AtlasBrowserResourcePerformanceAudit {
  return {
    id,
    label,
    status: ready ? "ready" : "regressed",
    measured,
    expected,
    trustedBoundary,
  };
}

export function v101BrowserResourcePerformanceCommandContract(): Readonly<{
  focusedCommand: "npm run test:atlas:browser-resource-performance";
  browserResourceVerifyCommand: "npm run verify:atlas:browser-resource";
  browserFreshCommand: "npm run test:atlas:browser:fresh";
  postEnhancementBaselineCommand: "npm run test:atlas:post-enhancement-baseline";
  scientificVerifyCommand: "npm run verify:atlas:scientific";
  screenshotRetryAttempts: 3;
  pixelSettleAttempts: 4;
  freshBrowserPort: 3015;
  optimizationPolicy: "browser-acceptance-helper-resource-optimization-only";
}> {
  return {
    focusedCommand: "npm run test:atlas:browser-resource-performance",
    browserResourceVerifyCommand: "npm run verify:atlas:browser-resource",
    browserFreshCommand: "npm run test:atlas:browser:fresh",
    postEnhancementBaselineCommand: "npm run test:atlas:post-enhancement-baseline",
    scientificVerifyCommand: "npm run verify:atlas:scientific",
    screenshotRetryAttempts: 3,
    pixelSettleAttempts: 4,
    freshBrowserPort: 3015,
    optimizationPolicy: "browser-acceptance-helper-resource-optimization-only",
  };
}

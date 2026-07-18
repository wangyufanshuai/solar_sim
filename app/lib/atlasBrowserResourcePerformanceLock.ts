import {
  ATLAS_POST_ENHANCEMENT_BASELINE_VERSION,
} from "./atlasPostEnhancementMaintenanceBaseline";
import type {
  AtlasBrowserResourcePerformanceAudit,
  AtlasBrowserResourcePerformanceClassification,
  AtlasBrowserResourcePerformanceRow,
  AtlasBrowserResourcePerformanceSummary,
} from "./simulationDiagnosticsTypes";

export const ATLAS_BROWSER_RESOURCE_PERFORMANCE_VERSION =
  "v101-browser-resource-performance-lock" as const;

export const ATLAS_BROWSER_RESOURCE_PERFORMANCE_PROFILE =
  "v101-fresh-browser-resource-performance" as const;

export const ATLAS_BROWSER_RESOURCE_PERFORMANCE_BOUNDARY =
  "Local v101 browser resource performance stability lock over v100. It applies only a browser acceptance helper resource optimization for shared ImageBitmap/canvas screenshot pixel sampling, explicit bitmap close, canvas zeroing, fresh 3015 teardown and console/page-error observability. It does not change scientific gates, fixtures, live runtime physics, worker physics, RK4/DP, EIH 1PN, Kerr kernel id, V9 sky/background, v97 Gaia budgets, v99 opacity caps, screenshot thresholds, screenshot retry count, pixel settle attempts, release packaging or official certification claims.";

export const V101_BROWSER_RESOURCE_PERFORMANCE_ROW: AtlasBrowserResourcePerformanceRow = {
  id: "v101-lock-browser-resource-performance",
  label: "Lock browser resource performance helpers and fresh teardown policy",
  status: "not-run",
  v100BaselineStatus: "not-run",
  screenshotResourceStatus: "not-run",
  pixelSamplerStatus: "not-run",
  freshTeardownStatus: "not-run",
  consoleErrorStatus: "not-run",
  docsSurfaceStatus: "not-run",
  protectedMutationStatus: "not-run",
  browserResourcePerformance: "applied-browser-acceptance-helper-resource-optimization",
} as const;

export function createAtlasBrowserResourcePerformanceSummary(
  args: {
    audits?: readonly AtlasBrowserResourcePerformanceAudit[];
    rows?: readonly AtlasBrowserResourcePerformanceRow[];
  } = {},
): AtlasBrowserResourcePerformanceSummary {
  const audits = args.audits ?? [];
  const rows = [
    args.rows?.find((row) => row.id === V101_BROWSER_RESOURCE_PERFORMANCE_ROW.id) ??
      V101_BROWSER_RESOURCE_PERFORMANCE_ROW,
  ];
  const completed = rows.filter((row) => row.status === "complete");
  const ready =
    completed.find(
      (row) =>
        row.v100BaselineStatus === "pass" &&
        row.screenshotResourceStatus === "pass" &&
        row.pixelSamplerStatus === "pass" &&
        row.freshTeardownStatus === "pass" &&
        row.consoleErrorStatus === "pass" &&
        row.docsSurfaceStatus === "pass" &&
        row.protectedMutationStatus === "pass",
    ) ?? null;
  const hasAuditRegression = audits.some((audit) => audit.status !== "ready");
  const hasRowRegression = completed.some(
    (row) =>
      row.v100BaselineStatus !== "pass" ||
      row.screenshotResourceStatus !== "pass" ||
      row.pixelSamplerStatus !== "pass" ||
      row.freshTeardownStatus !== "pass" ||
      row.consoleErrorStatus !== "pass" ||
      row.docsSurfaceStatus !== "pass" ||
      row.protectedMutationStatus !== "pass",
  );
  const status =
    completed.length === 0 && audits.length === 0
      ? "pending-runtime-run"
      : hasAuditRegression || hasRowRegression
        ? "ready-browser-resource-performance-blocked"
        : ready
          ? "ready-browser-resource-performance-locked"
          : "ready-browser-resource-optimized";

  return {
    version: ATLAS_BROWSER_RESOURCE_PERFORMANCE_VERSION,
    browserResourcePerformanceProfile: ATLAS_BROWSER_RESOURCE_PERFORMANCE_PROFILE,
    status,
    classification: classifyBrowserResourcePerformance({ status, audits, ready }),
    postEnhancementBaselineVersion: ATLAS_POST_ENHANCEMENT_BASELINE_VERSION,
    rowCount: rows.length,
    completedRowCount: completed.length,
    audits,
    rows,
    readyRowId: ready?.id ?? "",
    focusedCommand: "npm run test:atlas:browser-resource-performance",
    browserResourceVerifyCommand: "npm run verify:atlas:browser-resource",
    browserFreshCommand: "npm run test:atlas:browser:fresh",
    postEnhancementBaselineCommand: "npm run test:atlas:post-enhancement-baseline",
    scientificVerifyCommand: "npm run verify:atlas:scientific",
    screenshotRetryPolicy: "three-attempt-page-screenshot-retry-preserved",
    pixelSamplerPolicy: "shared-imagebitmap-canvas-sampler-explicit-close-and-zero",
    pixelSettlePolicy: "four-attempt-pixel-settle-thresholds-preserved",
    freshTeardownPolicy: "fresh-3015-global-teardown-no-reuse-existing-server",
    consoleErrorPolicy: "console-and-page-errors-observed-as-empty-arrays",
    browserResourcePerformance: "applied-browser-acceptance-helper-resource-optimization",
    runtimePerformanceMutation: "not-applied",
    livePhysicsMutation: "not-applied",
    workerPhysicsMutation: "not-applied",
    rk4DefaultMutation: "not-applied",
    eihOnePnMutation: "not-applied",
    kerrKernelMutation: "not-applied",
    skyAssetMutation: "not-applied",
    backgroundMutation: "not-applied",
    v9SkyDirectionMutation: "not-applied",
    materialMutation: "not-applied",
    fixtureDataMutation: "not-applied",
    budgetMutation: "not-applied",
    defaultGateConfigMutation: "not-applied",
    releasePackagingMutation: "not-applied",
    certificationClaimMutation: "not-applied",
    trustedBoundary: ATLAS_BROWSER_RESOURCE_PERFORMANCE_BOUNDARY,
  };
}

function classifyBrowserResourcePerformance(args: {
  status: AtlasBrowserResourcePerformanceSummary["status"];
  audits: readonly AtlasBrowserResourcePerformanceAudit[];
  ready: AtlasBrowserResourcePerformanceRow | null;
}): AtlasBrowserResourcePerformanceClassification {
  if (args.status === "pending-runtime-run") return "mixed";
  if (args.audits.some((audit) => audit.id === "v100-post-enhancement-baseline-lock" && audit.status !== "ready")) {
    return "v100-baseline-regression";
  }
  if (args.audits.some((audit) => audit.id === "screenshot-resource-helper-lock" && audit.status !== "ready")) {
    return "screenshot-resource-regression";
  }
  if (args.audits.some((audit) => audit.id === "pixel-sampler-helper-lock" && audit.status !== "ready")) {
    return "pixel-sampler-regression";
  }
  if (args.audits.some((audit) => audit.id === "fresh-teardown-lock" && audit.status !== "ready")) {
    return "fresh-teardown-regression";
  }
  if (args.audits.some((audit) => audit.id === "console-error-observability-lock" && audit.status !== "ready")) {
    return "console-error-regression";
  }
  if (args.audits.some((audit) => audit.id === "docs-surface-lock" && audit.status !== "ready")) {
    return "docs-surface-regression";
  }
  if (args.audits.some((audit) => audit.id === "protected-mutation-lock" && audit.status !== "ready")) {
    return "protected-mutation-regression";
  }
  if (args.ready) return "browser-resource-performance-pass";
  return "mixed";
}

import { ATLAS_PRESENTATION_RUNTIME_PERFORMANCE_VERSION } from "./atlasPresentationRuntimePerformanceLock";
import type {
  AtlasBrowserAcceptanceRuntimeCostAudit,
  AtlasBrowserAcceptanceRuntimeCostClassification,
  AtlasBrowserAcceptanceRuntimeCostRow,
  AtlasBrowserAcceptanceRuntimeCostSummary,
} from "./simulationDiagnosticsTypes";

export const ATLAS_BROWSER_ACCEPTANCE_RUNTIME_COST_VERSION =
  "v104-browser-acceptance-runtime-cost-lock" as const;

export const ATLAS_BROWSER_ACCEPTANCE_RUNTIME_COST_PROFILE =
  "v104-fresh-browser-acceptance-cost-review" as const;

export const ATLAS_BROWSER_ACCEPTANCE_RUNTIME_COST_BOUNDARY =
  "Local v104 browser acceptance runtime cost lock over v103. It only splits browser acceptance screenshot capture into a default current/core manifest and an opt-in full historical review manifest while preserving desktop/mobile fresh acceptance, root/Observable/Evidence/Validation marker coverage, console/page-error checks, 3015 teardown, screenshot retry, pixel settle, browser pixel thresholds, scientific gates, fixtures, live runtime physics, worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background direction, v97 Gaia budgets, v99 opacity caps, release packaging and certification boundaries.";

export const V104_BROWSER_ACCEPTANCE_RUNTIME_COST_ROW: AtlasBrowserAcceptanceRuntimeCostRow = {
  id: "v104-lock-browser-acceptance-runtime-cost",
  label: "Lock browser acceptance screenshot workload split",
  status: "not-run",
  v103Status: "not-run",
  screenshotWorkloadStatus: "not-run",
  markerCoverageStatus: "not-run",
  freshTeardownStatus: "not-run",
  consoleErrorStatus: "not-run",
  budgetThresholdStatus: "not-run",
  docsSurfaceStatus: "not-run",
  protectedMutationStatus: "not-run",
  browserAcceptanceRuntimeCost: "applied-browser-screenshot-manifest-split",
} as const;

export function createAtlasBrowserAcceptanceRuntimeCostSummary(
  args: {
    audits?: readonly AtlasBrowserAcceptanceRuntimeCostAudit[];
    rows?: readonly AtlasBrowserAcceptanceRuntimeCostRow[];
  } = {},
): AtlasBrowserAcceptanceRuntimeCostSummary {
  const audits = args.audits ?? [];
  const rows = [
    args.rows?.find((row) => row.id === V104_BROWSER_ACCEPTANCE_RUNTIME_COST_ROW.id) ??
      V104_BROWSER_ACCEPTANCE_RUNTIME_COST_ROW,
  ];
  const completed = rows.filter((row) => row.status === "complete");
  const ready =
    completed.find(
      (row) =>
        row.v103Status === "pass" &&
        row.screenshotWorkloadStatus === "pass" &&
        row.markerCoverageStatus === "pass" &&
        row.freshTeardownStatus === "pass" &&
        row.consoleErrorStatus === "pass" &&
        row.budgetThresholdStatus === "pass" &&
        row.docsSurfaceStatus === "pass" &&
        row.protectedMutationStatus === "pass",
    ) ?? null;
  const hasAuditRegression = audits.some((audit) => audit.status !== "ready");
  const hasRowRegression = completed.some(
    (row) =>
      row.v103Status !== "pass" ||
      row.screenshotWorkloadStatus !== "pass" ||
      row.markerCoverageStatus !== "pass" ||
      row.freshTeardownStatus !== "pass" ||
      row.consoleErrorStatus !== "pass" ||
      row.budgetThresholdStatus !== "pass" ||
      row.docsSurfaceStatus !== "pass" ||
      row.protectedMutationStatus !== "pass",
  );
  const status =
    completed.length === 0 && audits.length === 0
      ? "pending-runtime-run"
      : hasAuditRegression || hasRowRegression
        ? "ready-browser-acceptance-runtime-cost-blocked"
        : ready
          ? "ready-browser-acceptance-runtime-cost-locked"
          : "ready-browser-acceptance-runtime-cost-reduced";

  return {
    version: ATLAS_BROWSER_ACCEPTANCE_RUNTIME_COST_VERSION,
    browserAcceptanceRuntimeCostProfile: ATLAS_BROWSER_ACCEPTANCE_RUNTIME_COST_PROFILE,
    status,
    classification: classifyBrowserAcceptanceRuntimeCost({ status, audits, ready }),
    presentationRuntimePerformanceVersion: ATLAS_PRESENTATION_RUNTIME_PERFORMANCE_VERSION,
    rowCount: rows.length,
    completedRowCount: completed.length,
    audits,
    rows,
    readyRowId: ready?.id ?? "",
    focusedCommand: "npm run test:atlas:browser-acceptance-runtime-cost",
    browserAcceptanceRuntimeVerifyCommand: "npm run verify:atlas:browser-acceptance-runtime",
    defaultFreshCommand: "npm run test:atlas:browser:fresh",
    fullReviewCommand: "npm run test:atlas:browser:fresh:review",
    screenshotManifestPolicy: "default-current-plus-core-full-review-history",
    markerCoveragePolicy: "root-observable-evidence-validation-preserved",
    consoleErrorPolicy: "console-page-error-zero-preserved",
    freshTeardownPolicy: "fresh-3015-teardown-preserved",
    budgetThresholdPolicy: "browser-pixel-thresholds-retry-settle-preserved",
    watchpackNoisePolicy: "DumpStack.log.tmp-pagefile.sys-known-non-failure-noise",
    browserAcceptanceRuntimeCost: "applied-browser-screenshot-manifest-split",
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
    trustedBoundary: ATLAS_BROWSER_ACCEPTANCE_RUNTIME_COST_BOUNDARY,
  };
}

function classifyBrowserAcceptanceRuntimeCost(args: {
  status: AtlasBrowserAcceptanceRuntimeCostSummary["status"];
  audits: readonly AtlasBrowserAcceptanceRuntimeCostAudit[];
  ready: AtlasBrowserAcceptanceRuntimeCostRow | null;
}): AtlasBrowserAcceptanceRuntimeCostClassification {
  if (args.status === "pending-runtime-run") return "mixed";
  if (args.audits.some((audit) => audit.id === "v103-presentation-runtime-performance" && audit.status !== "ready")) {
    return "v103-regression";
  }
  if (args.audits.some((audit) => audit.id === "screenshot-workload-lock" && audit.status !== "ready")) {
    return "screenshot-workload-regression";
  }
  if (args.audits.some((audit) => audit.id === "marker-coverage-lock" && audit.status !== "ready")) {
    return "marker-coverage-regression";
  }
  if (args.audits.some((audit) => audit.id === "fresh-teardown-lock" && audit.status !== "ready")) {
    return "fresh-teardown-regression";
  }
  if (args.audits.some((audit) => audit.id === "console-error-lock" && audit.status !== "ready")) {
    return "console-error-regression";
  }
  if (args.audits.some((audit) => audit.id === "budget-threshold-lock" && audit.status !== "ready")) {
    return "budget-threshold-regression";
  }
  if (args.audits.some((audit) => audit.id === "docs-surface-lock" && audit.status !== "ready")) {
    return "docs-surface-regression";
  }
  if (args.audits.some((audit) => audit.id === "protected-mutation-lock" && audit.status !== "ready")) {
    return "protected-mutation-regression";
  }
  if (args.ready) return "browser-acceptance-runtime-cost-pass";
  return "mixed";
}

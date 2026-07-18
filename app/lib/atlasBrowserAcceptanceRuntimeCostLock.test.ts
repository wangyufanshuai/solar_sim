import { describe, expect, it } from "vitest";
import {
  ATLAS_BROWSER_ACCEPTANCE_RUNTIME_COST_PROFILE,
  ATLAS_BROWSER_ACCEPTANCE_RUNTIME_COST_VERSION,
  V104_BROWSER_ACCEPTANCE_RUNTIME_COST_ROW,
  createAtlasBrowserAcceptanceRuntimeCostSummary,
} from "./atlasBrowserAcceptanceRuntimeCostLock";
import type {
  AtlasBrowserAcceptanceRuntimeCostAudit,
  AtlasBrowserAcceptanceRuntimeCostRow,
} from "./simulationDiagnosticsTypes";

describe("v104 browser acceptance runtime cost lock", () => {
  it("returns deterministic pending metadata for browser acceptance runtime cost", () => {
    const summary = createAtlasBrowserAcceptanceRuntimeCostSummary();

    expect(summary).toMatchObject({
      version: ATLAS_BROWSER_ACCEPTANCE_RUNTIME_COST_VERSION,
      browserAcceptanceRuntimeCostProfile: ATLAS_BROWSER_ACCEPTANCE_RUNTIME_COST_PROFILE,
      status: "pending-runtime-run",
      classification: "mixed",
      presentationRuntimePerformanceVersion: "v103-presentation-runtime-performance-lock",
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
    });
    expect(summary.rows).toEqual([V104_BROWSER_ACCEPTANCE_RUNTIME_COST_ROW]);
    expect(summary.trustedBoundary).toContain("screenshot capture");
    expect(summary.trustedBoundary).toContain("browser pixel thresholds");
  });

  it("reports ready only when every browser runtime cost lock passes", () => {
    const summary = createAtlasBrowserAcceptanceRuntimeCostSummary({
      audits: readyAudits(),
      rows: [completedRow()],
    });

    expect(summary.status).toBe("ready-browser-acceptance-runtime-cost-locked");
    expect(summary.classification).toBe("browser-acceptance-runtime-cost-pass");
    expect(summary.completedRowCount).toBe(1);
    expect(summary.readyRowId).toBe("v104-lock-browser-acceptance-runtime-cost");
  });

  it("classifies v103, screenshot, marker, teardown, console, budget, docs and mutation regressions", () => {
    expect(createAtlasBrowserAcceptanceRuntimeCostSummary({ audits: [audit("v103-presentation-runtime-performance", "regressed")] }).classification).toBe("v103-regression");
    expect(createAtlasBrowserAcceptanceRuntimeCostSummary({ audits: [audit("screenshot-workload-lock", "regressed")] }).classification).toBe("screenshot-workload-regression");
    expect(createAtlasBrowserAcceptanceRuntimeCostSummary({ audits: [audit("marker-coverage-lock", "regressed")] }).classification).toBe("marker-coverage-regression");
    expect(createAtlasBrowserAcceptanceRuntimeCostSummary({ audits: [audit("fresh-teardown-lock", "regressed")] }).classification).toBe("fresh-teardown-regression");
    expect(createAtlasBrowserAcceptanceRuntimeCostSummary({ audits: [audit("console-error-lock", "regressed")] }).classification).toBe("console-error-regression");
    expect(createAtlasBrowserAcceptanceRuntimeCostSummary({ audits: [audit("budget-threshold-lock", "regressed")] }).classification).toBe("budget-threshold-regression");
    expect(createAtlasBrowserAcceptanceRuntimeCostSummary({ audits: [audit("docs-surface-lock", "regressed")] }).classification).toBe("docs-surface-regression");
    expect(createAtlasBrowserAcceptanceRuntimeCostSummary({ audits: [audit("protected-mutation-lock", "regressed")] }).classification).toBe("protected-mutation-regression");
  });
});

function readyAudits(): readonly AtlasBrowserAcceptanceRuntimeCostAudit[] {
  return [
    audit("v103-presentation-runtime-performance", "ready"),
    audit("screenshot-workload-lock", "ready"),
    audit("marker-coverage-lock", "ready"),
    audit("fresh-teardown-lock", "ready"),
    audit("console-error-lock", "ready"),
    audit("budget-threshold-lock", "ready"),
    audit("docs-surface-lock", "ready"),
    audit("protected-mutation-lock", "ready"),
  ];
}

function audit(
  id: AtlasBrowserAcceptanceRuntimeCostAudit["id"],
  status: AtlasBrowserAcceptanceRuntimeCostAudit["status"],
): AtlasBrowserAcceptanceRuntimeCostAudit {
  return {
    id,
    label: id,
    status,
    measured: status,
    expected: "ready",
    trustedBoundary: "v104 test browser acceptance runtime cost",
  };
}

function completedRow(): AtlasBrowserAcceptanceRuntimeCostRow {
  return {
    ...V104_BROWSER_ACCEPTANCE_RUNTIME_COST_ROW,
    status: "complete",
    v103Status: "pass",
    screenshotWorkloadStatus: "pass",
    markerCoverageStatus: "pass",
    freshTeardownStatus: "pass",
    consoleErrorStatus: "pass",
    budgetThresholdStatus: "pass",
    docsSurfaceStatus: "pass",
    protectedMutationStatus: "pass",
    browserAcceptanceRuntimeCost: "applied-browser-screenshot-manifest-split",
  };
}

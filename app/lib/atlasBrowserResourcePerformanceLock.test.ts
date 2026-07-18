import { describe, expect, it } from "vitest";
import {
  ATLAS_BROWSER_RESOURCE_PERFORMANCE_PROFILE,
  ATLAS_BROWSER_RESOURCE_PERFORMANCE_VERSION,
  V101_BROWSER_RESOURCE_PERFORMANCE_ROW,
  createAtlasBrowserResourcePerformanceSummary,
} from "./atlasBrowserResourcePerformanceLock";
import type {
  AtlasBrowserResourcePerformanceAudit,
  AtlasBrowserResourcePerformanceRow,
} from "./simulationDiagnosticsTypes";

describe("v101 browser resource performance lock", () => {
  it("returns deterministic pending metadata for browser resource stability", () => {
    const summary = createAtlasBrowserResourcePerformanceSummary();

    expect(summary).toMatchObject({
      version: ATLAS_BROWSER_RESOURCE_PERFORMANCE_VERSION,
      browserResourcePerformanceProfile: ATLAS_BROWSER_RESOURCE_PERFORMANCE_PROFILE,
      status: "pending-runtime-run",
      classification: "mixed",
      postEnhancementBaselineVersion: "v100-post-enhancement-maintenance-baseline",
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
    });
    expect(summary.rows).toEqual([V101_BROWSER_RESOURCE_PERFORMANCE_ROW]);
    expect(summary.trustedBoundary).toContain("browser acceptance helper resource optimization");
  });

  it("reports ready only when every browser resource lock passes", () => {
    const summary = createAtlasBrowserResourcePerformanceSummary({
      audits: readyAudits(),
      rows: [completedRow()],
    });

    expect(summary.status).toBe("ready-browser-resource-performance-locked");
    expect(summary.classification).toBe("browser-resource-performance-pass");
    expect(summary.completedRowCount).toBe(1);
    expect(summary.readyRowId).toBe("v101-lock-browser-resource-performance");
  });

  it("classifies v100, screenshot, sampler, teardown, console, docs and mutation regressions", () => {
    expect(createAtlasBrowserResourcePerformanceSummary({ audits: [audit("v100-post-enhancement-baseline-lock", "regressed")] }).classification).toBe("v100-baseline-regression");
    expect(createAtlasBrowserResourcePerformanceSummary({ audits: [audit("screenshot-resource-helper-lock", "regressed")] }).classification).toBe("screenshot-resource-regression");
    expect(createAtlasBrowserResourcePerformanceSummary({ audits: [audit("pixel-sampler-helper-lock", "regressed")] }).classification).toBe("pixel-sampler-regression");
    expect(createAtlasBrowserResourcePerformanceSummary({ audits: [audit("fresh-teardown-lock", "regressed")] }).classification).toBe("fresh-teardown-regression");
    expect(createAtlasBrowserResourcePerformanceSummary({ audits: [audit("console-error-observability-lock", "regressed")] }).classification).toBe("console-error-regression");
    expect(createAtlasBrowserResourcePerformanceSummary({ audits: [audit("docs-surface-lock", "regressed")] }).classification).toBe("docs-surface-regression");
    expect(createAtlasBrowserResourcePerformanceSummary({ audits: [audit("protected-mutation-lock", "regressed")] }).classification).toBe("protected-mutation-regression");
  });
});

function readyAudits(): readonly AtlasBrowserResourcePerformanceAudit[] {
  return [
    audit("v100-post-enhancement-baseline-lock", "ready"),
    audit("screenshot-resource-helper-lock", "ready"),
    audit("pixel-sampler-helper-lock", "ready"),
    audit("fresh-teardown-lock", "ready"),
    audit("console-error-observability-lock", "ready"),
    audit("docs-surface-lock", "ready"),
    audit("protected-mutation-lock", "ready"),
  ];
}

function audit(
  id: AtlasBrowserResourcePerformanceAudit["id"],
  status: AtlasBrowserResourcePerformanceAudit["status"],
): AtlasBrowserResourcePerformanceAudit {
  return {
    id,
    label: id,
    status,
    measured: status,
    expected: "ready",
    trustedBoundary: "v101 test browser resource performance lock",
  };
}

function completedRow(): AtlasBrowserResourcePerformanceRow {
  return {
    ...V101_BROWSER_RESOURCE_PERFORMANCE_ROW,
    status: "complete",
    v100BaselineStatus: "pass",
    screenshotResourceStatus: "pass",
    pixelSamplerStatus: "pass",
    freshTeardownStatus: "pass",
    consoleErrorStatus: "pass",
    docsSurfaceStatus: "pass",
    protectedMutationStatus: "pass",
    browserResourcePerformance: "applied-browser-acceptance-helper-resource-optimization",
  };
}

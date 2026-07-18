import { describe, expect, it } from "vitest";
import {
  ATLAS_PRESENTATION_RUNTIME_PERFORMANCE_PROFILE,
  ATLAS_PRESENTATION_RUNTIME_PERFORMANCE_VERSION,
  V103_PRESENTATION_RUNTIME_PERFORMANCE_ROW,
  createAtlasPresentationRuntimePerformanceSummary,
} from "./atlasPresentationRuntimePerformanceLock";
import type {
  AtlasPresentationRuntimePerformanceAudit,
  AtlasPresentationRuntimePerformanceRow,
} from "./simulationDiagnosticsTypes";

describe("v103 presentation runtime performance lock", () => {
  it("returns deterministic pending metadata for presentation runtime performance", () => {
    const summary = createAtlasPresentationRuntimePerformanceSummary();

    expect(summary).toMatchObject({
      version: ATLAS_PRESENTATION_RUNTIME_PERFORMANCE_VERSION,
      presentationRuntimePerformanceProfile: ATLAS_PRESENTATION_RUNTIME_PERFORMANCE_PROFILE,
      status: "pending-runtime-run",
      classification: "mixed",
      maintenanceEvidenceIndexVersion: "v102-maintenance-evidence-index",
      focusedCommand: "npm run test:atlas:presentation-runtime-performance",
      presentationRuntimeVerifyCommand: "npm run verify:atlas:presentation-runtime",
      maintenanceEvidenceVerifyCommand: "npm run verify:atlas:maintenance-evidence",
      gaiaRuntimePolicy: "gaia-uniform-write-dedupe-static-instance-attributes",
      constellationRuntimePolicy: "constellation-frame-signature-material-write-dedupe",
      labelRuntimePolicy: "label-dom-visible-style-write-dedupe",
      budgetThresholdPolicy: "v97-v99-v75-browser-thresholds-preserved",
      presentationRuntimePerformance: "applied-presentation-runtime-cost-only",
      browserAcceptanceCostMutation: "not-applied",
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
    expect(summary.rows).toEqual([V103_PRESENTATION_RUNTIME_PERFORMANCE_ROW]);
    expect(summary.trustedBoundary).toContain("presentation-layer write pressure");
    expect(summary.trustedBoundary).toContain("browser screenshot thresholds");
  });

  it("reports ready only when every presentation runtime lock passes", () => {
    const summary = createAtlasPresentationRuntimePerformanceSummary({
      audits: readyAudits(),
      rows: [completedRow()],
    });

    expect(summary.status).toBe("ready-presentation-runtime-performance-locked");
    expect(summary.classification).toBe("presentation-runtime-performance-pass");
    expect(summary.completedRowCount).toBe(1);
    expect(summary.readyRowId).toBe("v103-lock-presentation-runtime-performance");
  });

  it("classifies v102, Gaia, constellation, label, budget, docs and mutation regressions", () => {
    expect(createAtlasPresentationRuntimePerformanceSummary({ audits: [audit("v102-maintenance-evidence-index", "regressed")] }).classification).toBe("v102-regression");
    expect(createAtlasPresentationRuntimePerformanceSummary({ audits: [audit("gaia-runtime-lock", "regressed")] }).classification).toBe("gaia-runtime-regression");
    expect(createAtlasPresentationRuntimePerformanceSummary({ audits: [audit("constellation-runtime-lock", "regressed")] }).classification).toBe("constellation-runtime-regression");
    expect(createAtlasPresentationRuntimePerformanceSummary({ audits: [audit("label-runtime-lock", "regressed")] }).classification).toBe("label-runtime-regression");
    expect(createAtlasPresentationRuntimePerformanceSummary({ audits: [audit("budget-threshold-lock", "regressed")] }).classification).toBe("budget-threshold-regression");
    expect(createAtlasPresentationRuntimePerformanceSummary({ audits: [audit("docs-surface-lock", "regressed")] }).classification).toBe("docs-surface-regression");
    expect(createAtlasPresentationRuntimePerformanceSummary({ audits: [audit("protected-mutation-lock", "regressed")] }).classification).toBe("protected-mutation-regression");
  });
});

function readyAudits(): readonly AtlasPresentationRuntimePerformanceAudit[] {
  return [
    audit("v102-maintenance-evidence-index", "ready"),
    audit("gaia-runtime-lock", "ready"),
    audit("constellation-runtime-lock", "ready"),
    audit("label-runtime-lock", "ready"),
    audit("budget-threshold-lock", "ready"),
    audit("docs-surface-lock", "ready"),
    audit("protected-mutation-lock", "ready"),
  ];
}

function audit(
  id: AtlasPresentationRuntimePerformanceAudit["id"],
  status: AtlasPresentationRuntimePerformanceAudit["status"],
): AtlasPresentationRuntimePerformanceAudit {
  return {
    id,
    label: id,
    status,
    measured: status,
    expected: "ready",
    trustedBoundary: "v103 test presentation runtime performance",
  };
}

function completedRow(): AtlasPresentationRuntimePerformanceRow {
  return {
    ...V103_PRESENTATION_RUNTIME_PERFORMANCE_ROW,
    status: "complete",
    v102Status: "pass",
    gaiaRuntimeStatus: "pass",
    constellationRuntimeStatus: "pass",
    labelRuntimeStatus: "pass",
    budgetThresholdStatus: "pass",
    docsSurfaceStatus: "pass",
    protectedMutationStatus: "pass",
    presentationRuntimePerformance: "applied-presentation-runtime-cost-only",
  };
}

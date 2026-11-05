import { describe, expect, it } from "vitest";
import {
  ATLAS_RELATIVITY_SIMULATION_OPTIMIZATION_PROFILE,
  ATLAS_RELATIVITY_SIMULATION_OPTIMIZATION_VERSION,
  V98_RELATIVITY_SIMULATION_OPTIMIZATION_ROW,
  createAtlasRelativitySimulationOptimizationSummary,
  v98RelativitySimulationOptimizationVersionContract,
} from "./atlasRelativitySimulationOptimization";
import type {
  AtlasRelativitySimulationOptimizationAudit,
  AtlasRelativitySimulationOptimizationRow,
} from "./simulationDiagnosticsTypes";

describe("v98 relativity simulation optimization", () => {
  it("returns deterministic pending metadata for the teaching observability layer", () => {
    const summary = createAtlasRelativitySimulationOptimizationSummary();

    expect(summary).toMatchObject({
      version: ATLAS_RELATIVITY_SIMULATION_OPTIMIZATION_VERSION,
      optimizationProfile: ATLAS_RELATIVITY_SIMULATION_OPTIMIZATION_PROFILE,
      status: "pending-runtime-run",
      classification: "mixed",
      observableAtlasVersion: "v37-relativity-observable-atlas",
      explainerVersion: "v39-relativity-observable-explainer",
      guidedTourVersion: "v40-relativity-guided-tour",
      verificationVersion: "v73-relativity-verification-readability",
      chartVersion: "v74-relativity-verification-charts",
      kerrStudioVersion: "v35-kerr-relativity-studio",
      kerrKernelId: "eih-1pn+kerr-geodesic-v17",
      weakFieldObservableCount: 4,
      strongFieldReadoutCount: 2,
      numericalHealthMetricCount: 1,
      readoutCount: 7,
      teachingOverlayPolicy: "observable-atlas-and-kerr-studio-default",
      performanceHudPolicy: "optional-collapsed-read-only-main-canvas",
      scientificModelUpgradePolicy: "not-scientific-model-upgrade",
      relativitySimulationOptimization: "applied-teaching-observability-only",
      livePhysicsMutation: "not-applied",
      workerPhysicsMutation: "not-applied",
      rk4DefaultMutation: "not-applied",
      eihOnePnMutation: "not-applied",
      kerrKernelMutation: "not-applied",
      skyAssetMutation: "not-applied",
      backgroundMutation: "not-applied",
      fixtureDataMutation: "not-applied",
      budgetMutation: "not-applied",
      defaultGateConfigMutation: "not-applied",
      certificationClaimMutation: "not-applied",
    });
    expect(summary.rows).toEqual([V98_RELATIVITY_SIMULATION_OPTIMIZATION_ROW]);
    expect(summary.trustedBoundary).toContain("not a scientific model upgrade");
  });

  it("locks the existing relativity version chain and Kerr kernel id", () => {
    expect(v98RelativitySimulationOptimizationVersionContract()).toEqual({
      observableAtlasVersion: "v37-relativity-observable-atlas",
      explainerVersion: "v39-relativity-observable-explainer",
      guidedTourVersion: "v40-relativity-guided-tour",
      verificationVersion: "v73-relativity-verification-readability",
      chartVersion: "v74-relativity-verification-charts",
      kerrStudioVersion: "v35-kerr-relativity-studio",
      kerrKernelId: "eih-1pn+kerr-geodesic-v17",
    });
  });

  it("reports ready only when every relativity optimization lock passes", () => {
    const summary = createAtlasRelativitySimulationOptimizationSummary({
      audits: readyAudits(),
      rows: [completedRow()],
    });

    expect(summary.status).toBe("ready-relativity-optimization-locked");
    expect(summary.classification).toBe("relativity-optimization-pass");
    expect(summary.completedRowCount).toBe(1);
    expect(summary.readyRowId).toBe("v98-lock-relativity-simulation-optimization");
  });

  it("classifies Observable, Kerr, weak-field, HUD, physics and docs regressions", () => {
    expect(
      createAtlasRelativitySimulationOptimizationSummary({
        audits: [audit("observable-atlas-lock", "regressed")],
      }).classification,
    ).toBe("observable-atlas-regression");
    expect(
      createAtlasRelativitySimulationOptimizationSummary({
        audits: [audit("kerr-studio-lock", "regressed")],
      }).classification,
    ).toBe("kerr-studio-regression");
    expect(
      createAtlasRelativitySimulationOptimizationSummary({
        audits: [audit("weak-field-readout-lock", "regressed")],
      }).classification,
    ).toBe("weak-field-readout-regression");
    expect(
      createAtlasRelativitySimulationOptimizationSummary({
        audits: [audit("performance-hud-lock", "regressed")],
      }).classification,
    ).toBe("performance-hud-regression");
    expect(
      createAtlasRelativitySimulationOptimizationSummary({
        audits: [audit("protected-physics-lock", "regressed")],
      }).classification,
    ).toBe("protected-physics-regression");
    expect(
      createAtlasRelativitySimulationOptimizationSummary({
        audits: [audit("docs-surface-lock", "regressed")],
      }).classification,
    ).toBe("docs-surface-regression");
  });
});

function readyAudits(): readonly AtlasRelativitySimulationOptimizationAudit[] {
  return [
    audit("observable-atlas-lock", "ready"),
    audit("kerr-studio-lock", "ready"),
    audit("weak-field-readout-lock", "ready"),
    audit("performance-hud-lock", "ready"),
    audit("docs-surface-lock", "ready"),
    audit("protected-physics-lock", "ready"),
  ];
}

function audit(
  id: AtlasRelativitySimulationOptimizationAudit["id"],
  status: AtlasRelativitySimulationOptimizationAudit["status"],
): AtlasRelativitySimulationOptimizationAudit {
  return {
    id,
    label: id,
    status,
    measured: status,
    expected: "ready",
    trustedBoundary: "v98 test relativity optimization audit",
  };
}

function completedRow(): AtlasRelativitySimulationOptimizationRow {
  return {
    ...V98_RELATIVITY_SIMULATION_OPTIMIZATION_ROW,
    status: "complete",
    observableAtlasStatus: "pass",
    kerrStudioStatus: "pass",
    weakFieldReadoutStatus: "pass",
    performanceHudStatus: "pass",
    docsSurfaceStatus: "pass",
    protectedPhysicsStatus: "pass",
    relativitySimulationOptimization: "applied-teaching-observability-only",
  };
}

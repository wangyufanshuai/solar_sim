import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ORBIT_ATLAS_SKY, ORBIT_ATLAS_V9_SKY } from "./orbitAtlasPresentation";
import {
  ATLAS_PHYSICS_BENCHMARK_BUDGETS,
} from "./atlasPhysicsBenchmarkGate";
import {
  ATLAS_CLOSEUP_VISUAL_FIDELITY_VERSION,
  createAtlasCloseupVisualFidelitySummary,
} from "./atlasCloseupVisualFidelity";
import {
  ATLAS_HORIZONS_GATE_AUDIT_PROFILE,
  ATLAS_HORIZONS_GATE_AUDIT_VERSION,
  V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
  createAtlasHorizonsGateAuditSummary,
} from "./atlasHorizonsGateAudit";
import {
  HORIZONS_VALIDATION_DT_DAYS,
  runHorizonsValidationDataset,
} from "./horizonsValidationRunner";
import { loadHorizonsValidationDatasetFromJson } from "./relativityValidation";

describe("v77 Horizons gate closure audit", () => {
  it("returns deterministic metadata and preserves mutation boundaries", () => {
    const summary = createAtlasHorizonsGateAuditSummary();

    expect(summary).toMatchObject({
      version: ATLAS_HORIZONS_GATE_AUDIT_VERSION,
      status: "pending-runtime-run",
      auditProfile: ATLAS_HORIZONS_GATE_AUDIT_PROFILE,
      physicsBenchmarkGateVersion: "v75-physics-benchmark-release-gate",
      physicsBenchmarkBudgetProfile: "v75-weak-field-horizons-kerr-error-budget",
      failureClassification: "pending",
      currentFailureMeasured: V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
      currentThreshold: "RMS < 1,000,000 km / 10 m/s; Mercury +10y ratio < 1.02",
      modeCount: 0,
      checkpointCount: 0,
      budgetMutation: "not-applied",
      physicsMutation: "not-applied",
      skyAssetMutation: "not-applied",
      materialMutation: "not-applied",
      runtimeCertificationStatus: "not-claimed-in-app",
      scientificCertificationStatus: "not-claimed",
      fullReleaseGateStatus: "blocked-by-v75-horizons-until-fixed",
    });
    expect(summary.trustedBoundary).toContain("not a threshold relaxation");
    expect(summary.dataLineageChecks).toContain("origin=sun");
    expect(summary.runnerLineageChecks).toContain("HORIZONS_VALIDATION_DT_DAYS=0.25");
  });

  it("locks v75 budgets, v69/v71 sky and v76 visual contract", () => {
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm).toBe(1_000_000);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs).toBe(10);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsMercuryOnePnToNewtonRatio).toBe(1.02);
    expect(ORBIT_ATLAS_SKY).toBe(ORBIT_ATLAS_V9_SKY);
    expect(ORBIT_ATLAS_V9_SKY.rotation).toEqual([-0.34, 4.24, -0.86]);
    expect(createAtlasCloseupVisualFidelitySummary().version).toBe(ATLAS_CLOSEUP_VISUAL_FIDELITY_VERSION);
  });

  it("classifies the current ten-year Horizons failure with row-level diagnostics", async () => {
    const dataset = loadHorizonsValidationDatasetFromJson(
      readFileSync(resolve(process.cwd(), "dist/content-packs/files/science-fixtures/data/horizons-validation-j2000.json"), "utf8"),
    );
    const run = await runHorizonsValidationDataset(dataset);
    const summary = createAtlasHorizonsGateAuditSummary(run);

    expect(HORIZONS_VALIDATION_DT_DAYS).toBe(0.25);
    expect(summary.status).toBe("blocked-model-limit");
    expect(summary.failureClassification).toBe("model-limit");
    expect(summary.currentFailureMeasured).toBe(V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED);
    expect(summary.modeCount).toBe(2);
    expect(summary.checkpointCount).toBe(6);
    expect(summary.auditRows.map((row) => `${row.mode}:${row.checkpointLabel}`)).toEqual([
      "newton:+30d",
      "newton:+365d",
      "newton:+10y",
      "1pn:+30d",
      "1pn:+365d",
      "1pn:+10y",
    ]);
    for (const row of summary.auditRows) {
      expect(Number.isFinite(row.offsetDays)).toBe(true);
      expect(Number.isFinite(row.rmsPositionKm)).toBe(true);
      expect(Number.isFinite(row.rmsVelocityMs)).toBe(true);
      expect(Number.isFinite(row.mercuryDeltaRKm)).toBe(true);
      expect(Number.isFinite(row.mercuryDeltaVMs)).toBe(true);
      expect(row.maxErrorBodyId).toBeTruthy();
      expect(Number.isFinite(row.maxErrorDeltaRKm)).toBe(true);
      expect(Number.isFinite(row.maxErrorDeltaVMs)).toBe(true);
    }
    expect(summary.auditRows.find((row) => row.mode === "1pn" && row.checkpointLabel === "+10y")).toEqual(
      expect.objectContaining({
        maxErrorBodyId: "pluto",
      }),
    );
  }, 120_000);
});

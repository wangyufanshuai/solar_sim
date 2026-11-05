import { describe, expect, it } from "vitest";
import { ATLAS_PHYSICS_BENCHMARK_BUDGETS } from "./atlasPhysicsBenchmarkGate";
import { V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED } from "./atlasHorizonsGateAudit";
import {
  V87_CANDIDATE_FIXTURE_PATH,
  V87_CURRENT_STRICT_FIXTURE_PATH,
  V87_STRICT_SCIENTIFIC_GATE_COMMAND,
} from "./atlasStrictHorizonsMigrationDryRun";
import { V88_STRICT_HORIZONS_SHADOW_GATE_ROW } from "./atlasStrictHorizonsShadowMigrationGate";
import {
  ATLAS_DEFAULT_STRICT_HORIZONS_MIGRATION_PROFILE,
  ATLAS_DEFAULT_STRICT_HORIZONS_MIGRATION_VERSION,
  V89_DEFAULT_STRICT_HORIZONS_MIGRATION_ROW,
  V89_LEGACY_V75_STRICT_HORIZONS_COMMAND,
  createAtlasDefaultStrictHorizonsMigrationSummary,
} from "./atlasDefaultStrictHorizonsMigration";
import { ORBIT_ATLAS_SKY, ORBIT_ATLAS_V9_SKY } from "./orbitAtlasPresentation";
import type {
  AtlasDefaultStrictHorizonsMigrationLockAudit,
  AtlasDefaultStrictHorizonsMigrationRow,
} from "./simulationDiagnosticsTypes";

describe("v89 default strict Horizons scientific gate migration", () => {
  it("returns deterministic pending metadata for the applied offline gate migration", () => {
    const summary = createAtlasDefaultStrictHorizonsMigrationSummary();

    expect(summary).toMatchObject({
      version: ATLAS_DEFAULT_STRICT_HORIZONS_MIGRATION_VERSION,
      migrationProfile: ATLAS_DEFAULT_STRICT_HORIZONS_MIGRATION_PROFILE,
      status: "pending-runtime-run",
      classification: "mixed",
      legacyStrictBlocker: V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
      migrationRowCount: 1,
      completedMigrationRowCount: 0,
      readyMigrationRowId: "",
      defaultScientificGateMigration: "applied-offline-gate-only",
      legacyV75AuditMutation: "not-applied",
      budgetMutation: "not-applied",
      physicsMutation: "not-applied",
      workerPhysicsMutation: "not-applied",
      rk4DefaultMutation: "not-applied",
      eihOnePnMutation: "not-applied",
      skyAssetMutation: "not-applied",
      backgroundMutation: "not-applied",
      materialMutation: "not-applied",
      kerrKernelMutation: "not-applied",
      runtimeCertificationStatus: "not-claimed-in-app",
      scientificCertificationStatus: "offline-gate-migrated-not-nasa-jpl-certified",
    });
    expect(summary.migrationRows).toEqual([V89_DEFAULT_STRICT_HORIZONS_MIGRATION_ROW]);
    expect(summary.trustedBoundary).toContain("offline strict Horizons scientific gate");
  });

  it("locks budgets, fixture paths, commands, shadow source and V9 sky", () => {
    const row = V89_DEFAULT_STRICT_HORIZONS_MIGRATION_ROW;
    const summary = createAtlasDefaultStrictHorizonsMigrationSummary();

    expect(summary.strictBudgetPositionRmsKm).toBe(1_000_000);
    expect(summary.strictBudgetVelocityRmsMs).toBe(10);
    expect(summary.strictBudgetMercuryRatio).toBe(1.02);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm).toBe(1_000_000);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs).toBe(10);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsMercuryOnePnToNewtonRatio).toBe(1.02);
    expect(row.sourceShadowGateId).toBe(V88_STRICT_HORIZONS_SHADOW_GATE_ROW.id);
    expect(row.defaultScientificCommand).toBe(V87_STRICT_SCIENTIFIC_GATE_COMMAND);
    expect(row.legacyV75Command).toBe(V89_LEGACY_V75_STRICT_HORIZONS_COMMAND);
    expect(row.previousDefaultFixturePath).toBe(V87_CURRENT_STRICT_FIXTURE_PATH);
    expect(row.migratedDefaultFixturePath).toBe(V87_CANDIDATE_FIXTURE_PATH);
    expect(row.migratedMassProfile).toBe("de440-system-gm");
    expect(row.migratedDtDays).toBe(0.125);
    expect(row.migratedSofteningAu).toBe(0);
    expect(row.status).toBe("not-run");
    expect(row.migratedBudgetStatus).toBe("not-run");
    expect(ORBIT_ATLAS_SKY).toBe(ORBIT_ATLAS_V9_SKY);
  });

  it("reports a ready migrated default gate when all locks and rows pass", () => {
    const summary = createAtlasDefaultStrictHorizonsMigrationSummary({
      lockAudits: [
        lock("v88-shadow-gate-lock", "ready"),
        lock("default-scientific-command-lock", "ready"),
        lock("legacy-v75-command-lock", "ready"),
        lock("v75-budget-lock", "ready"),
        lock("v84-reference-fixture-provenance", "ready"),
        lock("legacy-v75-blocker-lock", "ready"),
      ],
      rows: [completedRow("pass", "expected-blocker-preserved")],
    });

    expect(summary.status).toBe("ready-default-gate-migrated");
    expect(summary.classification).toBe("default-gate-migrated-shadow-provenance");
    expect(summary.completedMigrationRowCount).toBe(1);
    expect(summary.readyMigrationRowId).toBe("v89-apply-v88-shadow-to-default-strict-gate");
  });

  it("classifies shadow, command, legacy, budget and fixture regressions", () => {
    expect(
      createAtlasDefaultStrictHorizonsMigrationSummary({
        lockAudits: [lock("v88-shadow-gate-lock", "blocked")],
      }).classification,
    ).toBe("shadow-gate-regression");
    expect(
      createAtlasDefaultStrictHorizonsMigrationSummary({
        lockAudits: [lock("default-scientific-command-lock", "regressed")],
      }).classification,
    ).toBe("default-command-not-migrated");
    expect(
      createAtlasDefaultStrictHorizonsMigrationSummary({
        lockAudits: [lock("legacy-v75-blocker-lock", "regressed")],
      }).classification,
    ).toBe("legacy-audit-regression");
    expect(
      createAtlasDefaultStrictHorizonsMigrationSummary({
        lockAudits: [lock("v75-budget-lock", "regressed")],
      }).classification,
    ).toBe("budget-regression");
    expect(
      createAtlasDefaultStrictHorizonsMigrationSummary({
        lockAudits: [lock("v84-reference-fixture-provenance", "regressed")],
      }).classification,
    ).toBe("fixture-regression");
  });
});

function lock(
  id: AtlasDefaultStrictHorizonsMigrationLockAudit["id"],
  status: AtlasDefaultStrictHorizonsMigrationLockAudit["status"],
): AtlasDefaultStrictHorizonsMigrationLockAudit {
  return {
    id,
    label: id,
    status,
    measured: status,
    expected: "ready",
    trustedBoundary: "v89 test lock audit",
  };
}

function completedRow(
  migratedBudgetStatus: AtlasDefaultStrictHorizonsMigrationRow["migratedBudgetStatus"],
  legacyV75Status: AtlasDefaultStrictHorizonsMigrationRow["legacyV75Status"],
): AtlasDefaultStrictHorizonsMigrationRow {
  return {
    ...V89_DEFAULT_STRICT_HORIZONS_MIGRATION_ROW,
    status: "complete",
    migratedOnePnRmsPositionKm: 198_442,
    migratedOnePnRmsVelocityMs: 3.42,
    migratedMercuryOnePnToNewtonRatio: 0.997,
    migratedBudgetStatus,
    legacyV75Status,
    defaultScientificGateMigration: "applied-offline-gate-only",
  };
}

import { describe, expect, it } from "vitest";
import { ORBIT_ATLAS_SKY, ORBIT_ATLAS_V9_SKY } from "./orbitAtlasPresentation";
import { ATLAS_PHYSICS_BENCHMARK_BUDGETS } from "./atlasPhysicsBenchmarkGate";
import { V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED } from "./atlasHorizonsGateAudit";
import {
  ATLAS_STRICT_HORIZONS_MIGRATION_DRY_RUN_PROFILE,
  ATLAS_STRICT_HORIZONS_MIGRATION_DRY_RUN_VERSION,
  V87_CANDIDATE_FIXTURE_PATH,
  V87_CURRENT_STRICT_FIXTURE_PATH,
  V87_STRICT_HORIZONS_MIGRATION_DIFF_ROW,
  V87_STRICT_SCIENTIFIC_GATE_COMMAND,
  createAtlasStrictHorizonsMigrationDryRunSummary,
} from "./atlasStrictHorizonsMigrationDryRun";
import type {
  AtlasStrictHorizonsMigrationDryRunLockAudit,
  AtlasStrictHorizonsMigrationDryRunRow,
} from "./simulationDiagnosticsTypes";

describe("v87 strict Horizons migration dry-run audit", () => {
  it("returns deterministic pending metadata without applying a migration", () => {
    const summary = createAtlasStrictHorizonsMigrationDryRunSummary();

    expect(summary).toMatchObject({
      version: ATLAS_STRICT_HORIZONS_MIGRATION_DRY_RUN_VERSION,
      migrationProfile: ATLAS_STRICT_HORIZONS_MIGRATION_DRY_RUN_PROFILE,
      status: "pending-runtime-run",
      classification: "mixed",
      strictBlocker: V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
      migrationDiffCount: 1,
      completedMigrationDiffCount: 0,
      readyMigrationDiffId: "",
      defaultStrictFixtureMutation: "not-applied",
      defaultStrictCommandMutation: "not-applied",
      defaultScientificGateMutation: "not-applied",
      referenceFixtureAdoptionMutation: "not-applied",
      migrationDocsMutation: "not-applied",
      migrationScreenshotsMutation: "not-applied",
      budgetMutation: "not-applied",
      physicsMutation: "not-applied",
      workerPhysicsMutation: "not-applied",
      rk4DefaultMutation: "not-applied",
      eihOnePnMutation: "not-applied",
      skyAssetMutation: "not-applied",
      materialMutation: "not-applied",
      kerrKernelMutation: "not-applied",
      runtimeCertificationStatus: "not-claimed-in-app",
      scientificCertificationStatus: "dry-run-only-default-gate-blocked",
    });
    expect(summary.migrationDiffRows).toEqual([V87_STRICT_HORIZONS_MIGRATION_DIFF_ROW]);
    expect(summary.trustedBoundary).toContain("does not migrate the default strict gate");
  });

  it("keeps v75 budgets, default strict command, fixture paths and V9 sky locked", () => {
    const row = V87_STRICT_HORIZONS_MIGRATION_DIFF_ROW;
    const summary = createAtlasStrictHorizonsMigrationDryRunSummary();

    expect(summary.strictBudgetPositionRmsKm).toBe(1_000_000);
    expect(summary.strictBudgetVelocityRmsMs).toBe(10);
    expect(summary.strictBudgetMercuryRatio).toBe(1.02);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm).toBe(1_000_000);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs).toBe(10);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsMercuryOnePnToNewtonRatio).toBe(1.02);
    expect(row.currentDefaultFixturePath).toBe(V87_CURRENT_STRICT_FIXTURE_PATH);
    expect(row.candidateFixturePath).toBe(V87_CANDIDATE_FIXTURE_PATH);
    expect(row.currentStrictCommand).toBe(V87_STRICT_SCIENTIFIC_GATE_COMMAND);
    expect(row.futureMigrationCommandTarget).toBe(V87_STRICT_SCIENTIFIC_GATE_COMMAND);
    expect(row.candidateMassProfile).toBe("de440-system-gm");
    expect(row.candidateDtDays).toBe(0.125);
    expect(row.candidateSofteningAu).toBe(0);
    expect(row.status).toBe("not-run");
    expect(row.diffStatus).toBe("not-run");
    expect(row.migrationMutationStatus).toBe("not-applied");
    expect(ORBIT_ATLAS_SKY).toBe(ORBIT_ATLAS_V9_SKY);
  });

  it("reports a complete migration diff when all locks and candidate evidence are ready", () => {
    const summary = createAtlasStrictHorizonsMigrationDryRunSummary({
      lockAudits: [
        lock("v75-strict-fixture-lock", "ready"),
        lock("v84-reference-fixture-provenance", "ready"),
        lock("v86-candidate-gate-lock", "ready"),
        lock("v75-budget-lock", "ready"),
        lock("default-strict-command-lock", "ready"),
        lock("migration-contract-lock", "ready"),
      ],
      rows: [completedRow("pass", "complete")],
    });

    expect(summary.status).toBe("ready-migration-diff-complete");
    expect(summary.classification).toBe("default-gate-diff-ready");
    expect(summary.completedMigrationDiffCount).toBe(1);
    expect(summary.readyMigrationDiffId).toBe(
      "v87-v86-candidate-default-gate-migration-diff",
    );
    expect(summary.defaultStrictCommandMutation).toBe("not-applied");
    expect(summary.defaultScientificGateMutation).toBe("not-applied");
  });

  it("classifies fixture, budget, candidate and migration contract failures", () => {
    expect(
      createAtlasStrictHorizonsMigrationDryRunSummary({
        lockAudits: [lock("v84-reference-fixture-provenance", "regressed")],
      }).classification,
    ).toBe("fixture-regression");
    expect(
      createAtlasStrictHorizonsMigrationDryRunSummary({
        lockAudits: [lock("v75-budget-lock", "regressed")],
      }).classification,
    ).toBe("budget-regression");
    expect(
      createAtlasStrictHorizonsMigrationDryRunSummary({
        lockAudits: [lock("v86-candidate-gate-lock", "blocked")],
      }).classification,
    ).toBe("candidate-regression");
    expect(
      createAtlasStrictHorizonsMigrationDryRunSummary({
        lockAudits: [lock("migration-contract-lock", "regressed")],
      }).classification,
    ).toBe("migration-contract-incomplete");
  });
});

function lock(
  id: AtlasStrictHorizonsMigrationDryRunLockAudit["id"],
  status: AtlasStrictHorizonsMigrationDryRunLockAudit["status"],
): AtlasStrictHorizonsMigrationDryRunLockAudit {
  return {
    id,
    label: id,
    status,
    measured: status,
    expected: "ready",
    trustedBoundary: "v87 test lock audit",
  };
}

function completedRow(
  candidateBudgetStatus: AtlasStrictHorizonsMigrationDryRunRow["candidateBudgetStatus"],
  diffStatus: AtlasStrictHorizonsMigrationDryRunRow["diffStatus"],
): AtlasStrictHorizonsMigrationDryRunRow {
  return {
    ...V87_STRICT_HORIZONS_MIGRATION_DIFF_ROW,
    status: "complete",
    diffStatus,
    candidateBudgetStatus,
    defaultStrictGateStatus: "expected-fail-unchanged",
    migrationMutationStatus: "not-applied",
  };
}

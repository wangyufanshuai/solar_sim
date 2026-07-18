import { describe, expect, it } from "vitest";
import { ORBIT_ATLAS_SKY, ORBIT_ATLAS_V9_SKY } from "./orbitAtlasPresentation";
import { ATLAS_PHYSICS_BENCHMARK_BUDGETS } from "./atlasPhysicsBenchmarkGate";
import { V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED } from "./atlasHorizonsGateAudit";
import {
  ATLAS_STRICT_HORIZONS_SHADOW_MIGRATION_PROFILE,
  ATLAS_STRICT_HORIZONS_SHADOW_MIGRATION_VERSION,
  V88_STRICT_HORIZONS_SHADOW_GATE_ROW,
  V88_STRICT_HORIZONS_SHADOW_MIGRATION_COMMAND,
  createAtlasStrictHorizonsShadowMigrationGateSummary,
} from "./atlasStrictHorizonsShadowMigrationGate";
import {
  V87_CANDIDATE_FIXTURE_PATH,
  V87_CURRENT_STRICT_FIXTURE_PATH,
  V87_STRICT_HORIZONS_MIGRATION_DIFF_ROW,
  V87_STRICT_SCIENTIFIC_GATE_COMMAND,
} from "./atlasStrictHorizonsMigrationDryRun";
import type {
  AtlasStrictHorizonsShadowMigrationGateLockAudit,
  AtlasStrictHorizonsShadowMigrationGateRow,
} from "./simulationDiagnosticsTypes";

describe("v88 strict Horizons shadow migration gate", () => {
  it("returns deterministic pending metadata without applying a migration", () => {
    const summary = createAtlasStrictHorizonsShadowMigrationGateSummary();

    expect(summary).toMatchObject({
      version: ATLAS_STRICT_HORIZONS_SHADOW_MIGRATION_VERSION,
      shadowGateProfile: ATLAS_STRICT_HORIZONS_SHADOW_MIGRATION_PROFILE,
      status: "pending-runtime-run",
      classification: "mixed",
      strictBlocker: V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
      shadowGateCount: 1,
      completedShadowGateCount: 0,
      readyShadowGateId: "",
      defaultStrictFixtureMutation: "not-applied",
      defaultStrictCommandMutation: "not-applied",
      shadowGateCommandMutation: "not-applied",
      defaultScientificGateMutation: "not-applied",
      referenceFixtureAdoptionMutation: "not-applied",
      budgetMutation: "not-applied",
      physicsMutation: "not-applied",
      workerPhysicsMutation: "not-applied",
      rk4DefaultMutation: "not-applied",
      eihOnePnMutation: "not-applied",
      skyAssetMutation: "not-applied",
      materialMutation: "not-applied",
      kerrKernelMutation: "not-applied",
      runtimeCertificationStatus: "not-claimed-in-app",
      scientificCertificationStatus: "shadow-only-default-gate-blocked",
    });
    expect(summary.shadowGateRows).toEqual([V88_STRICT_HORIZONS_SHADOW_GATE_ROW]);
    expect(summary.trustedBoundary).toContain("does not replace the default strict scientific gate");
  });

  it("keeps v75 budgets, default strict command, shadow command, fixture paths and V9 sky locked", () => {
    const row = V88_STRICT_HORIZONS_SHADOW_GATE_ROW;
    const summary = createAtlasStrictHorizonsShadowMigrationGateSummary();

    expect(summary.strictBudgetPositionRmsKm).toBe(1_000_000);
    expect(summary.strictBudgetVelocityRmsMs).toBe(10);
    expect(summary.strictBudgetMercuryRatio).toBe(1.02);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm).toBe(1_000_000);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs).toBe(10);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsMercuryOnePnToNewtonRatio).toBe(1.02);
    expect(row.sourceMigrationDiffId).toBe(V87_STRICT_HORIZONS_MIGRATION_DIFF_ROW.id);
    expect(row.currentDefaultFixturePath).toBe(V87_CURRENT_STRICT_FIXTURE_PATH);
    expect(row.shadowFixturePath).toBe(V87_CANDIDATE_FIXTURE_PATH);
    expect(row.currentDefaultCommand).toBe(V87_STRICT_SCIENTIFIC_GATE_COMMAND);
    expect(row.shadowCommand).toBe(V88_STRICT_HORIZONS_SHADOW_MIGRATION_COMMAND);
    expect(row.shadowMassProfile).toBe("de440-system-gm");
    expect(row.shadowDtDays).toBe(0.125);
    expect(row.shadowSofteningAu).toBe(0);
    expect(row.status).toBe("not-run");
    expect(row.shadowBudgetStatus).toBe("not-run");
    expect(row.shadowGateMutationStatus).toBe("not-applied");
    expect(ORBIT_ATLAS_SKY).toBe(ORBIT_ATLAS_V9_SKY);
  });

  it("reports a passing shadow gate when all locks and shadow budget evidence are ready", () => {
    const summary = createAtlasStrictHorizonsShadowMigrationGateSummary({
      lockAudits: [
        lock("v75-strict-fixture-lock", "ready"),
        lock("v84-reference-fixture-provenance", "ready"),
        lock("v75-budget-lock", "ready"),
        lock("v87-migration-diff-lock", "ready"),
        lock("default-strict-command-lock", "ready"),
        lock("shadow-gate-contract-lock", "ready"),
      ],
      rows: [completedRow("pass")],
    });

    expect(summary.status).toBe("ready-shadow-gate-pass");
    expect(summary.classification).toBe("shadow-gate-pass-default-not-migrated");
    expect(summary.completedShadowGateCount).toBe(1);
    expect(summary.readyShadowGateId).toBe("v88-parallel-strict-horizons-shadow-gate");
    expect(summary.defaultStrictCommandMutation).toBe("not-applied");
    expect(summary.defaultScientificGateMutation).toBe("not-applied");
  });

  it("classifies migration diff, budget, strict command and fixture failures", () => {
    expect(
      createAtlasStrictHorizonsShadowMigrationGateSummary({
        lockAudits: [lock("v87-migration-diff-lock", "blocked")],
      }).classification,
    ).toBe("migration-diff-regression");
    expect(
      createAtlasStrictHorizonsShadowMigrationGateSummary({
        lockAudits: [lock("v75-budget-lock", "regressed")],
      }).classification,
    ).toBe("shadow-budget-regression");
    expect(
      createAtlasStrictHorizonsShadowMigrationGateSummary({
        lockAudits: [lock("default-strict-command-lock", "regressed")],
      }).classification,
    ).toBe("strict-command-regression");
    expect(
      createAtlasStrictHorizonsShadowMigrationGateSummary({
        lockAudits: [lock("v84-reference-fixture-provenance", "regressed")],
      }).classification,
    ).toBe("fixture-regression");
  });
});

function lock(
  id: AtlasStrictHorizonsShadowMigrationGateLockAudit["id"],
  status: AtlasStrictHorizonsShadowMigrationGateLockAudit["status"],
): AtlasStrictHorizonsShadowMigrationGateLockAudit {
  return {
    id,
    label: id,
    status,
    measured: status,
    expected: "ready",
    trustedBoundary: "v88 test lock audit",
  };
}

function completedRow(
  shadowBudgetStatus: AtlasStrictHorizonsShadowMigrationGateRow["shadowBudgetStatus"],
): AtlasStrictHorizonsShadowMigrationGateRow {
  return {
    ...V88_STRICT_HORIZONS_SHADOW_GATE_ROW,
    status: "complete",
    onePnRmsPositionKm: 198_442,
    onePnRmsVelocityMs: 3.42,
    mercuryOnePnToNewtonRatio: 0.997,
    shadowBudgetStatus,
    defaultStrictGateStatus: "expected-fail-unchanged",
    shadowGateMutationStatus: "not-applied",
  };
}

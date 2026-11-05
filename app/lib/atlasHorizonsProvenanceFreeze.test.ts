import { describe, expect, it } from "vitest";
import { ATLAS_PHYSICS_BENCHMARK_BUDGETS } from "./atlasPhysicsBenchmarkGate";
import {
  ATLAS_HORIZONS_PROVENANCE_FREEZE_PROFILE,
  ATLAS_HORIZONS_PROVENANCE_FREEZE_VERSION,
  V90_HORIZONS_PROVENANCE_FREEZE_ROW,
  V90_LEGACY_V75_FIXTURE_SHA256,
  V90_MIGRATED_FIXTURE_SHA256,
  createAtlasHorizonsProvenanceFreezeSummary,
} from "./atlasHorizonsProvenanceFreeze";
import { ORBIT_ATLAS_SKY, ORBIT_ATLAS_V9_SKY } from "./orbitAtlasPresentation";
import type {
  AtlasHorizonsProvenanceFreezeLockAudit,
  AtlasHorizonsProvenanceFreezeRow,
} from "./simulationDiagnosticsTypes";

describe("v90 Horizons provenance freeze", () => {
  it("returns deterministic pending metadata for the offline freeze contract", () => {
    const summary = createAtlasHorizonsProvenanceFreezeSummary();

    expect(summary).toMatchObject({
      version: ATLAS_HORIZONS_PROVENANCE_FREEZE_VERSION,
      freezeProfile: ATLAS_HORIZONS_PROVENANCE_FREEZE_PROFILE,
      status: "pending-runtime-run",
      classification: "mixed",
      freezeRowCount: 1,
      completedFreezeRowCount: 0,
      readyFreezeRowId: "",
      provenanceFreeze: "applied-offline-contract-only",
      defaultGateConfigMutation: "not-applied",
      legacyAuditMutation: "not-applied",
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
      scientificCertificationStatus: "offline-gate-frozen-not-nasa-jpl-certified",
    });
    expect(summary.freezeRows).toEqual([V90_HORIZONS_PROVENANCE_FREEZE_ROW]);
    expect(summary.trustedBoundary).toContain("offline strict Horizons scientific gate contract");
  });

  it("locks fixture hashes, commands, budgets and V9 sky identity", () => {
    const row = V90_HORIZONS_PROVENANCE_FREEZE_ROW;
    const summary = createAtlasHorizonsProvenanceFreezeSummary();

    expect(row.migratedFixturePath).toBe(
      "public/data/horizons-validation-j2000-outer-system-barycenter-v84.json",
    );
    expect(row.migratedFixtureSha256).toBe(V90_MIGRATED_FIXTURE_SHA256);
    expect(row.migratedFixtureSizeBytes).toBe(21863);
    expect(row.migratedFixtureVariant).toBe("v84-outer-system-barycenter-reference");
    expect(row.migratedTargetProvenanceRows).toBe(12);
    expect(row.legacyFixturePath).toBe("public/data/horizons-validation-j2000.json");
    expect(row.legacyFixtureSha256).toBe(V90_LEGACY_V75_FIXTURE_SHA256);
    expect(row.legacyFixtureSizeBytes).toBe(14678);
    expect(row.defaultScientificCommand).toBe("npm run test:atlas:horizons-scientific-gate");
    expect(row.legacyV75Command).toBe("npm run test:atlas:horizons-scientific-gate:legacy-v75");
    expect(row.status).toBe("not-run");
    expect(row.fixtureHashStatus).toBe("not-run");
    expect(summary.strictBudgetPositionRmsKm).toBe(1_000_000);
    expect(summary.strictBudgetVelocityRmsMs).toBe(10);
    expect(summary.strictBudgetMercuryRatio).toBe(1.02);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm).toBe(1_000_000);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs).toBe(10);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsMercuryOnePnToNewtonRatio).toBe(1.02);
    expect(ORBIT_ATLAS_SKY).toBe(ORBIT_ATLAS_V9_SKY);
  });

  it("reports a ready freeze only when all locks and row statuses pass", () => {
    const summary = createAtlasHorizonsProvenanceFreezeSummary({
      lockAudits: readyLocks(),
      rows: [completedRow()],
    });

    expect(summary.status).toBe("ready-freeze-locked");
    expect(summary.classification).toBe("freeze-lock-pass");
    expect(summary.completedFreezeRowCount).toBe(1);
    expect(summary.readyFreezeRowId).toBe("v90-freeze-v89-default-strict-gate-contract");
  });

  it("classifies command, fixture, budget, legacy and docs regressions", () => {
    expect(
      createAtlasHorizonsProvenanceFreezeSummary({
        lockAudits: [lock("default-scientific-command-lock", "regressed")],
      }).classification,
    ).toBe("command-ownership-regression");
    expect(
      createAtlasHorizonsProvenanceFreezeSummary({
        lockAudits: [lock("migrated-fixture-hash-lock", "regressed")],
      }).classification,
    ).toBe("fixture-hash-regression");
    expect(
      createAtlasHorizonsProvenanceFreezeSummary({
        lockAudits: [lock("migrated-fixture-provenance-lock", "regressed")],
      }).classification,
    ).toBe("fixture-provenance-regression");
    expect(
      createAtlasHorizonsProvenanceFreezeSummary({
        lockAudits: [lock("v75-budget-lock", "regressed")],
      }).classification,
    ).toBe("budget-regression");
    expect(
      createAtlasHorizonsProvenanceFreezeSummary({
        lockAudits: [lock("legacy-v75-blocker-lock", "regressed")],
      }).classification,
    ).toBe("legacy-audit-regression");
    expect(
      createAtlasHorizonsProvenanceFreezeSummary({
        lockAudits: [lock("docs-boundary-lock", "regressed")],
      }).classification,
    ).toBe("docs-boundary-regression");
  });
});

function readyLocks(): readonly AtlasHorizonsProvenanceFreezeLockAudit[] {
  return [
    lock("default-scientific-command-lock", "ready"),
    lock("legacy-v75-command-lock", "ready"),
    lock("verify-scientific-command-lock", "ready"),
    lock("migrated-fixture-hash-lock", "ready"),
    lock("legacy-fixture-hash-lock", "ready"),
    lock("migrated-fixture-provenance-lock", "ready"),
    lock("v75-budget-lock", "ready"),
    lock("v89-default-migration-lock", "ready"),
    lock("legacy-v75-blocker-lock", "ready"),
    lock("docs-boundary-lock", "ready"),
  ];
}

function lock(
  id: AtlasHorizonsProvenanceFreezeLockAudit["id"],
  status: AtlasHorizonsProvenanceFreezeLockAudit["status"],
): AtlasHorizonsProvenanceFreezeLockAudit {
  return {
    id,
    label: id,
    status,
    measured: status,
    expected: "ready",
    trustedBoundary: "v90 test lock audit",
  };
}

function completedRow(): AtlasHorizonsProvenanceFreezeRow {
  return {
    ...V90_HORIZONS_PROVENANCE_FREEZE_ROW,
    status: "complete",
    fixtureHashStatus: "pass",
    commandOwnershipStatus: "pass",
    budgetLockStatus: "pass",
    legacyAuditStatus: "expected-blocker-preserved",
    docsBoundaryStatus: "pass",
    provenanceFreeze: "applied-offline-contract-only",
  };
}

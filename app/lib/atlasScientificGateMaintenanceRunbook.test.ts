import { describe, expect, it } from "vitest";
import { ATLAS_PHYSICS_BENCHMARK_BUDGETS } from "./atlasPhysicsBenchmarkGate";
import {
  ATLAS_SCIENTIFIC_GATE_MAINTENANCE_RUNBOOK_PROFILE,
  ATLAS_SCIENTIFIC_GATE_MAINTENANCE_RUNBOOK_VERSION,
  V92_SCIENTIFIC_GATE_MAINTENANCE_RUNBOOK_ROW,
  createAtlasScientificGateMaintenanceRunbookSummary,
} from "./atlasScientificGateMaintenanceRunbook";
import { ORBIT_ATLAS_SKY, ORBIT_ATLAS_V9_SKY } from "./orbitAtlasPresentation";
import type {
  AtlasScientificGateMaintenanceRunbookAudit,
  AtlasScientificGateMaintenanceRunbookRow,
} from "./simulationDiagnosticsTypes";

describe("v92 scientific gate maintenance runbook", () => {
  it("returns deterministic pending metadata for the maintenance runbook", () => {
    const summary = createAtlasScientificGateMaintenanceRunbookSummary();

    expect(summary).toMatchObject({
      version: ATLAS_SCIENTIFIC_GATE_MAINTENANCE_RUNBOOK_VERSION,
      runbookProfile: ATLAS_SCIENTIFIC_GATE_MAINTENANCE_RUNBOOK_PROFILE,
      status: "pending-runtime-run",
      classification: "mixed",
      runbookRowCount: 1,
      completedRunbookRowCount: 0,
      readyRunbookRowId: "",
      migratedDefaultFixturePath:
        "public/data/horizons-validation-j2000-outer-system-barycenter-v84.json",
      legacyV75FixturePath: "public/data/horizons-validation-j2000.json",
      scientificGateMaintenanceRunbook: "applied-contract-only",
      defaultGateConfigMutation: "not-applied",
      livePhysicsMutation: "not-applied",
      workerPhysicsMutation: "not-applied",
      rk4DefaultMutation: "not-applied",
      eihOnePnMutation: "not-applied",
      kerrKernelMutation: "not-applied",
      skyAssetMutation: "not-applied",
      backgroundMutation: "not-applied",
      materialMutation: "not-applied",
      fixtureDataMutation: "not-applied",
      budgetMutation: "not-applied",
      certificationClaimMutation: "not-applied",
      runtimeCertificationStatus: "not-claimed-in-app",
      scientificCertificationStatus:
        "offline-gate-maintenance-runbook-not-nasa-jpl-certified",
    });
    expect(summary.runbookRows).toEqual([V92_SCIENTIFIC_GATE_MAINTENANCE_RUNBOOK_ROW]);
    expect(summary.trustedBoundary).toContain("maintenance runbook");
  });

  it("locks commands, fixtures, budgets and protected sky identity", () => {
    const row = V92_SCIENTIFIC_GATE_MAINTENANCE_RUNBOOK_ROW;
    const summary = createAtlasScientificGateMaintenanceRunbookSummary();

    expect(row.productFullCommand).toBe("npm run verify:atlas:full");
    expect(row.currentScientificCommand).toBe("npm run verify:atlas:scientific");
    expect(row.migratedStrictGateCommand).toBe("npm run test:atlas:horizons-scientific-gate");
    expect(row.legacyV75AuditCommand).toBe(
      "npm run test:atlas:horizons-scientific-gate:legacy-v75",
    );
    expect(row.provenanceFreezeCommand).toBe("npm run test:atlas:horizons-provenance-freeze");
    expect(row.offlineRuntimeBoundaryCommand).toBe(
      "npm run test:atlas:offline-runtime-boundary",
    );
    expect(row.expectedInterpretation).toBe(
      "migrated-scientific-gate-passes-legacy-v75-is-rollback-audit-only",
    );
    expect(row.status).toBe("not-run");
    expect(summary.strictBudgetPositionRmsKm).toBe(1_000_000);
    expect(summary.strictBudgetVelocityRmsMs).toBe(10);
    expect(summary.strictBudgetMercuryRatio).toBe(1.02);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm).toBe(1_000_000);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs).toBe(10);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsMercuryOnePnToNewtonRatio).toBe(1.02);
    expect(ORBIT_ATLAS_SKY).toBe(ORBIT_ATLAS_V9_SKY);
  });

  it("reports ready only when all runbook locks and row statuses pass", () => {
    const summary = createAtlasScientificGateMaintenanceRunbookSummary({
      audits: readyAudits(),
      rows: [completedRow()],
    });

    expect(summary.status).toBe("ready-runbook-locked");
    expect(summary.classification).toBe("maintenance-runbook-pass");
    expect(summary.completedRunbookRowCount).toBe(1);
    expect(summary.readyRunbookRowId).toBe(
      "v92-lock-offline-scientific-gate-maintenance-runbook",
    );
  });

  it("classifies command, freeze, boundary, rollback, docs and surface regressions", () => {
    expect(
      createAtlasScientificGateMaintenanceRunbookSummary({
        audits: [audit("command-ownership-lock", "regressed")],
      }).classification,
    ).toBe("command-ownership-regression");
    expect(
      createAtlasScientificGateMaintenanceRunbookSummary({
        audits: [audit("v90-provenance-freeze-lock", "regressed")],
      }).classification,
    ).toBe("provenance-freeze-regression");
    expect(
      createAtlasScientificGateMaintenanceRunbookSummary({
        audits: [audit("v91-offline-runtime-boundary-lock", "regressed")],
      }).classification,
    ).toBe("offline-runtime-boundary-regression");
    expect(
      createAtlasScientificGateMaintenanceRunbookSummary({
        audits: [audit("rollback-contract-lock", "regressed")],
      }).classification,
    ).toBe("rollback-contract-regression");
    expect(
      createAtlasScientificGateMaintenanceRunbookSummary({
        audits: [audit("docs-runbook-lock", "regressed")],
      }).classification,
    ).toBe("docs-runbook-regression");
    expect(
      createAtlasScientificGateMaintenanceRunbookSummary({
        audits: [audit("browser-surface-lock", "regressed")],
      }).classification,
    ).toBe("browser-surface-regression");
  });
});

function readyAudits(): readonly AtlasScientificGateMaintenanceRunbookAudit[] {
  return [
    audit("v91-offline-runtime-boundary-lock", "ready"),
    audit("v90-provenance-freeze-lock", "ready"),
    audit("command-ownership-lock", "ready"),
    audit("rollback-contract-lock", "ready"),
    audit("docs-runbook-lock", "ready"),
    audit("browser-surface-lock", "ready"),
    audit("protected-mutation-lock", "ready"),
  ];
}

function audit(
  id: AtlasScientificGateMaintenanceRunbookAudit["id"],
  status: AtlasScientificGateMaintenanceRunbookAudit["status"],
): AtlasScientificGateMaintenanceRunbookAudit {
  return {
    id,
    label: id,
    status,
    measured: status,
    expected: "ready",
    trustedBoundary: "v92 test runbook audit",
  };
}

function completedRow(): AtlasScientificGateMaintenanceRunbookRow {
  return {
    ...V92_SCIENTIFIC_GATE_MAINTENANCE_RUNBOOK_ROW,
    status: "complete",
    commandOwnershipStatus: "pass",
    provenanceFreezeStatus: "pass",
    offlineRuntimeBoundaryStatus: "pass",
    rollbackContractStatus: "pass",
    docsRunbookStatus: "pass",
    browserSurfaceStatus: "pass",
    protectedMutationStatus: "pass",
    scientificGateMaintenanceRunbook: "applied-contract-only",
  };
}

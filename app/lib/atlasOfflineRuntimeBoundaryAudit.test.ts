import { describe, expect, it } from "vitest";
import { ATLAS_PHYSICS_BENCHMARK_BUDGETS } from "./atlasPhysicsBenchmarkGate";
import {
  ATLAS_OFFLINE_RUNTIME_BOUNDARY_AUDIT_PROFILE,
  ATLAS_OFFLINE_RUNTIME_BOUNDARY_AUDIT_VERSION,
  V91_OFFLINE_RUNTIME_BOUNDARY_AUDIT_ROW,
  createAtlasOfflineRuntimeBoundaryAuditSummary,
} from "./atlasOfflineRuntimeBoundaryAudit";
import { ORBIT_ATLAS_SKY, ORBIT_ATLAS_V9_SKY } from "./orbitAtlasPresentation";
import type {
  AtlasOfflineRuntimeBoundaryAuditLockAudit,
  AtlasOfflineRuntimeBoundaryAuditRow,
} from "./simulationDiagnosticsTypes";

describe("v91 offline/runtime boundary audit", () => {
  it("returns deterministic pending metadata for the offline/runtime boundary", () => {
    const summary = createAtlasOfflineRuntimeBoundaryAuditSummary();

    expect(summary).toMatchObject({
      version: ATLAS_OFFLINE_RUNTIME_BOUNDARY_AUDIT_VERSION,
      boundaryProfile: ATLAS_OFFLINE_RUNTIME_BOUNDARY_AUDIT_PROFILE,
      status: "pending-runtime-run",
      classification: "mixed",
      boundaryRowCount: 1,
      completedBoundaryRowCount: 0,
      readyBoundaryRowId: "",
      offlineRuntimeBoundaryAudit: "applied-contract-only",
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
      scientificCertificationStatus: "offline-gate-frozen-not-nasa-jpl-certified",
    });
    expect(summary.boundaryRows).toEqual([V91_OFFLINE_RUNTIME_BOUNDARY_AUDIT_ROW]);
    expect(summary.trustedBoundary).toContain("live runtime physics");
  });

  it("locks commands, budgets and protected sky identity without runtime mutation", () => {
    const row = V91_OFFLINE_RUNTIME_BOUNDARY_AUDIT_ROW;
    const summary = createAtlasOfflineRuntimeBoundaryAuditSummary();

    expect(row.defaultScientificCommand).toBe("npm run test:atlas:horizons-scientific-gate");
    expect(row.legacyV75Command).toBe("npm run test:atlas:horizons-scientific-gate:legacy-v75");
    expect(row.provenanceFreezeCommand).toBe("npm run test:atlas:horizons-provenance-freeze");
    expect(row.status).toBe("not-run");
    expect(row.commandBoundaryStatus).toBe("not-run");
    expect(summary.strictBudgetPositionRmsKm).toBe(1_000_000);
    expect(summary.strictBudgetVelocityRmsMs).toBe(10);
    expect(summary.strictBudgetMercuryRatio).toBe(1.02);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm).toBe(1_000_000);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs).toBe(10);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsMercuryOnePnToNewtonRatio).toBe(1.02);
    expect(ORBIT_ATLAS_SKY).toBe(ORBIT_ATLAS_V9_SKY);
  });

  it("reports ready only when all boundary locks and row statuses pass", () => {
    const summary = createAtlasOfflineRuntimeBoundaryAuditSummary({
      lockAudits: readyLocks(),
      rows: [completedRow()],
    });

    expect(summary.status).toBe("ready-boundary-locked");
    expect(summary.classification).toBe("offline-runtime-boundary-pass");
    expect(summary.completedBoundaryRowCount).toBe(1);
    expect(summary.readyBoundaryRowId).toBe("v91-lock-offline-scientific-gate-runtime-boundary");
  });

  it("classifies runtime, mutation, certification, surface and docs regressions", () => {
    expect(
      createAtlasOfflineRuntimeBoundaryAuditSummary({
        lockAudits: [lock("runtime-claim-lock", "regressed")],
      }).classification,
    ).toBe("runtime-claim-regression");
    expect(
      createAtlasOfflineRuntimeBoundaryAuditSummary({
        lockAudits: [lock("protected-mutation-lock", "regressed")],
      }).classification,
    ).toBe("live-physics-mutation-regression");
    expect(
      createAtlasOfflineRuntimeBoundaryAuditSummary({
        lockAudits: [lock("scientific-certification-claim-lock", "regressed")],
      }).classification,
    ).toBe("scientific-certification-claim-regression");
    expect(
      createAtlasOfflineRuntimeBoundaryAuditSummary({
        lockAudits: [lock("browser-surface-lock", "regressed")],
      }).classification,
    ).toBe("browser-surface-regression");
    expect(
      createAtlasOfflineRuntimeBoundaryAuditSummary({
        lockAudits: [lock("docs-boundary-lock", "regressed")],
      }).classification,
    ).toBe("docs-boundary-regression");
  });
});

function readyLocks(): readonly AtlasOfflineRuntimeBoundaryAuditLockAudit[] {
  return [
    lock("v90-provenance-freeze-lock", "ready"),
    lock("command-ownership-lock", "ready"),
    lock("docs-boundary-lock", "ready"),
    lock("browser-surface-lock", "ready"),
    lock("runtime-claim-lock", "ready"),
    lock("scientific-certification-claim-lock", "ready"),
    lock("protected-mutation-lock", "ready"),
  ];
}

function lock(
  id: AtlasOfflineRuntimeBoundaryAuditLockAudit["id"],
  status: AtlasOfflineRuntimeBoundaryAuditLockAudit["status"],
): AtlasOfflineRuntimeBoundaryAuditLockAudit {
  return {
    id,
    label: id,
    status,
    measured: status,
    expected: "ready",
    trustedBoundary: "v91 test lock audit",
  };
}

function completedRow(): AtlasOfflineRuntimeBoundaryAuditRow {
  return {
    ...V91_OFFLINE_RUNTIME_BOUNDARY_AUDIT_ROW,
    status: "complete",
    commandBoundaryStatus: "pass",
    docsBoundaryStatus: "pass",
    browserSurfaceStatus: "pass",
    runtimeClaimStatus: "pass",
    scientificCertificationClaimStatus: "pass",
    protectedMutationStatus: "pass",
    offlineRuntimeBoundaryAudit: "applied-contract-only",
  };
}

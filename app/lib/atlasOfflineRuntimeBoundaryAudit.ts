import { ATLAS_PHYSICS_BENCHMARK_BUDGETS } from "./atlasPhysicsBenchmarkGate";
import { V89_LEGACY_V75_STRICT_HORIZONS_COMMAND } from "./atlasDefaultStrictHorizonsMigration";
import { V87_STRICT_SCIENTIFIC_GATE_COMMAND } from "./atlasStrictHorizonsMigrationDryRun";
import type {
  AtlasOfflineRuntimeBoundaryAuditClassification,
  AtlasOfflineRuntimeBoundaryAuditLockAudit,
  AtlasOfflineRuntimeBoundaryAuditRow,
  AtlasOfflineRuntimeBoundaryAuditSummary,
} from "./simulationDiagnosticsTypes";

export const ATLAS_OFFLINE_RUNTIME_BOUNDARY_AUDIT_VERSION =
  "v91-offline-runtime-boundary-audit" as const;

export const ATLAS_OFFLINE_RUNTIME_BOUNDARY_AUDIT_PROFILE =
  "v91-scientific-gate-runtime-boundary-lock" as const;

export const V91_OFFLINE_RUNTIME_BOUNDARY_AUDIT_BOUNDARY =
  "Local v91 audit that keeps the v89/v90 migrated and frozen offline strict Horizons scientific gate separate from live runtime physics. It does not mutate SolarSystemIntegrator, physicsEngine defaults, worker physics, RK4 runtime defaults, EIH 1PN, Kerr, materials, backgrounds, sky assets, fixture data, v75 budgets, or claim NASA/JPL certification.";

export const V91_OFFLINE_RUNTIME_BOUNDARY_AUDIT_ROW: AtlasOfflineRuntimeBoundaryAuditRow = {
  id: "v91-lock-offline-scientific-gate-runtime-boundary",
  label: "Lock offline strict gate versus live runtime physics boundary",
  defaultScientificCommand: V87_STRICT_SCIENTIFIC_GATE_COMMAND,
  legacyV75Command: V89_LEGACY_V75_STRICT_HORIZONS_COMMAND,
  provenanceFreezeCommand: "npm run test:atlas:horizons-provenance-freeze",
  verifyScientificCommand:
    "npm run verify:atlas && npm run test:atlas:horizons-scientific-gate && npm run test:atlas:browser:fresh",
  status: "not-run",
  commandBoundaryStatus: "not-run",
  docsBoundaryStatus: "not-run",
  browserSurfaceStatus: "not-run",
  runtimeClaimStatus: "not-run",
  scientificCertificationClaimStatus: "not-run",
  protectedMutationStatus: "not-run",
  offlineRuntimeBoundaryAudit: "applied-contract-only",
} as const;

export function createAtlasOfflineRuntimeBoundaryAuditSummary(
  args: {
    lockAudits?: readonly AtlasOfflineRuntimeBoundaryAuditLockAudit[];
    rows?: readonly AtlasOfflineRuntimeBoundaryAuditRow[];
  } = {},
): AtlasOfflineRuntimeBoundaryAuditSummary {
  const lockAudits = args.lockAudits ?? [];
  const boundaryRows = [
    args.rows?.find((row) => row.id === V91_OFFLINE_RUNTIME_BOUNDARY_AUDIT_ROW.id) ??
      V91_OFFLINE_RUNTIME_BOUNDARY_AUDIT_ROW,
  ];
  const completed = boundaryRows.filter((row) => row.status === "complete");
  const ready =
    completed.find(
      (row) =>
        row.commandBoundaryStatus === "pass" &&
        row.docsBoundaryStatus === "pass" &&
        row.browserSurfaceStatus === "pass" &&
        row.runtimeClaimStatus === "pass" &&
        row.scientificCertificationClaimStatus === "pass" &&
        row.protectedMutationStatus === "pass",
    ) ?? null;
  const hasLockRegression = lockAudits.some((audit) => audit.status !== "ready");
  const hasRowRegression = completed.some(
    (row) =>
      row.commandBoundaryStatus !== "pass" ||
      row.docsBoundaryStatus !== "pass" ||
      row.browserSurfaceStatus !== "pass" ||
      row.runtimeClaimStatus !== "pass" ||
      row.scientificCertificationClaimStatus !== "pass" ||
      row.protectedMutationStatus !== "pass",
  );
  const status =
    completed.length === 0 && lockAudits.length === 0
      ? "pending-runtime-run"
      : hasLockRegression || hasRowRegression
        ? "ready-boundary-blocked"
        : ready
          ? "ready-boundary-locked"
          : "ready-runtime-claims-clean";

  return {
    version: ATLAS_OFFLINE_RUNTIME_BOUNDARY_AUDIT_VERSION,
    boundaryProfile: ATLAS_OFFLINE_RUNTIME_BOUNDARY_AUDIT_PROFILE,
    status,
    classification: classifyOfflineRuntimeBoundaryAudit({ status, lockAudits, ready }),
    boundaryRowCount: boundaryRows.length,
    completedBoundaryRowCount: completed.length,
    lockAudits,
    boundaryRows,
    readyBoundaryRowId: ready?.id ?? "",
    strictBudgetPositionRmsKm: ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm,
    strictBudgetVelocityRmsMs: ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs,
    strictBudgetMercuryRatio:
      ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsMercuryOnePnToNewtonRatio,
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
    trustedBoundary: V91_OFFLINE_RUNTIME_BOUNDARY_AUDIT_BOUNDARY,
  };
}

function classifyOfflineRuntimeBoundaryAudit(args: {
  status: AtlasOfflineRuntimeBoundaryAuditSummary["status"];
  lockAudits: readonly AtlasOfflineRuntimeBoundaryAuditLockAudit[];
  ready: AtlasOfflineRuntimeBoundaryAuditRow | null;
}): AtlasOfflineRuntimeBoundaryAuditClassification {
  if (args.status === "pending-runtime-run") return "mixed";
  if (
    args.lockAudits.some(
      (audit) => audit.id === "runtime-claim-lock" && audit.status !== "ready",
    )
  ) {
    return "runtime-claim-regression";
  }
  if (
    args.lockAudits.some(
      (audit) => audit.id === "protected-mutation-lock" && audit.status !== "ready",
    )
  ) {
    return "live-physics-mutation-regression";
  }
  if (
    args.lockAudits.some(
      (audit) =>
        audit.id === "scientific-certification-claim-lock" && audit.status !== "ready",
    )
  ) {
    return "scientific-certification-claim-regression";
  }
  if (
    args.lockAudits.some(
      (audit) => audit.id === "browser-surface-lock" && audit.status !== "ready",
    )
  ) {
    return "browser-surface-regression";
  }
  if (
    args.lockAudits.some(
      (audit) => audit.id === "docs-boundary-lock" && audit.status !== "ready",
    )
  ) {
    return "docs-boundary-regression";
  }
  if (args.ready) return "offline-runtime-boundary-pass";
  return "mixed";
}

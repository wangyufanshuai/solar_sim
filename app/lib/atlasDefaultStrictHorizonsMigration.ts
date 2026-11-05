import { ATLAS_PHYSICS_BENCHMARK_BUDGETS } from "./atlasPhysicsBenchmarkGate";
import { V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED } from "./atlasHorizonsGateAudit";
import {
  V87_CANDIDATE_FIXTURE_PATH,
  V87_CURRENT_STRICT_FIXTURE_PATH,
  V87_STRICT_SCIENTIFIC_GATE_COMMAND,
} from "./atlasStrictHorizonsMigrationDryRun";
import { V88_STRICT_HORIZONS_SHADOW_GATE_ROW } from "./atlasStrictHorizonsShadowMigrationGate";
import type {
  AtlasDefaultStrictHorizonsMigrationClassification,
  AtlasDefaultStrictHorizonsMigrationLockAudit,
  AtlasDefaultStrictHorizonsMigrationRow,
  AtlasDefaultStrictHorizonsMigrationSummary,
} from "./simulationDiagnosticsTypes";

export const ATLAS_DEFAULT_STRICT_HORIZONS_MIGRATION_VERSION =
  "v89-default-strict-horizons-scientific-gate-migration" as const;

export const ATLAS_DEFAULT_STRICT_HORIZONS_MIGRATION_PROFILE =
  "v89-apply-barycentric-reference-default-gate" as const;

export const V89_LEGACY_V75_STRICT_HORIZONS_COMMAND =
  "npm run test:atlas:horizons-scientific-gate:legacy-v75" as const;

export const V89_DEFAULT_STRICT_HORIZONS_MIGRATION_BOUNDARY =
  "Local v89 migration of the offline strict Horizons scientific gate from the legacy v75 center-reference fixture to the v88 shadow-proven barycentric reference fixture. This applies only to the default offline scientific gate command; it does not mutate live runtime physics, SolarSystemIntegrator, physicsEngine defaults, worker physics, RK4 runtime defaults, EIH 1PN, Kerr, materials, backgrounds, sky assets, v75 budgets, or claim NASA/JPL certification.";

export const V89_DEFAULT_STRICT_HORIZONS_MIGRATION_ROW: AtlasDefaultStrictHorizonsMigrationRow = {
  id: "v89-apply-v88-shadow-to-default-strict-gate",
  label: "Apply v88 shadow strict gate config to default scientific gate",
  sourceShadowGateId: V88_STRICT_HORIZONS_SHADOW_GATE_ROW.id,
  defaultScientificCommand: V87_STRICT_SCIENTIFIC_GATE_COMMAND,
  legacyV75Command: V89_LEGACY_V75_STRICT_HORIZONS_COMMAND,
  previousDefaultFixturePath: V87_CURRENT_STRICT_FIXTURE_PATH,
  migratedDefaultFixturePath: V87_CANDIDATE_FIXTURE_PATH,
  migratedMassProfile: "de440-system-gm",
  migratedDtDays: 0.125,
  migratedSofteningAu: 0,
  status: "not-run",
  migratedOnePnRmsPositionKm: null,
  migratedOnePnRmsVelocityMs: null,
  migratedMercuryOnePnToNewtonRatio: null,
  migratedBudgetStatus: "not-run",
  legacyV75Status: "not-run",
  defaultScientificGateMigration: "applied-offline-gate-only",
} as const;

export function createAtlasDefaultStrictHorizonsMigrationSummary(
  args: {
    lockAudits?: readonly AtlasDefaultStrictHorizonsMigrationLockAudit[];
    rows?: readonly AtlasDefaultStrictHorizonsMigrationRow[];
  } = {},
): AtlasDefaultStrictHorizonsMigrationSummary {
  const lockAudits = args.lockAudits ?? [];
  const migrationRows = [
    args.rows?.find((row) => row.id === V89_DEFAULT_STRICT_HORIZONS_MIGRATION_ROW.id) ??
      V89_DEFAULT_STRICT_HORIZONS_MIGRATION_ROW,
  ];
  const completed = migrationRows.filter((row) => row.status === "complete");
  const ready =
    completed.find(
      (row) =>
        row.migratedBudgetStatus === "pass" &&
        row.legacyV75Status === "expected-blocker-preserved",
    ) ?? null;
  const hasLockRegression = lockAudits.some((audit) => audit.status !== "ready");
  const hasBudgetRegression = completed.some((row) => row.migratedBudgetStatus !== "pass");
  const hasLegacyRegression = completed.some(
    (row) => row.legacyV75Status !== "expected-blocker-preserved",
  );
  const status =
    completed.length === 0 && lockAudits.length === 0
      ? "pending-runtime-run"
      : hasLockRegression || hasBudgetRegression || hasLegacyRegression
        ? "ready-migration-blocked"
        : ready
          ? "ready-default-gate-migrated"
          : "ready-legacy-v75-blocker-preserved";

  return {
    version: ATLAS_DEFAULT_STRICT_HORIZONS_MIGRATION_VERSION,
    migrationProfile: ATLAS_DEFAULT_STRICT_HORIZONS_MIGRATION_PROFILE,
    status,
    classification: classifyDefaultStrictHorizonsMigration({
      status,
      lockAudits,
      hasBudgetRegression,
      hasLegacyRegression,
      ready,
    }),
    legacyStrictBlocker: V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
    migrationRowCount: migrationRows.length,
    completedMigrationRowCount: completed.length,
    lockAudits,
    migrationRows,
    readyMigrationRowId: ready?.id ?? "",
    strictBudgetPositionRmsKm: ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm,
    strictBudgetVelocityRmsMs: ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs,
    strictBudgetMercuryRatio: ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsMercuryOnePnToNewtonRatio,
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
    trustedBoundary: V89_DEFAULT_STRICT_HORIZONS_MIGRATION_BOUNDARY,
  };
}

function classifyDefaultStrictHorizonsMigration(args: {
  status: AtlasDefaultStrictHorizonsMigrationSummary["status"];
  lockAudits: readonly AtlasDefaultStrictHorizonsMigrationLockAudit[];
  hasBudgetRegression: boolean;
  hasLegacyRegression: boolean;
  ready: AtlasDefaultStrictHorizonsMigrationRow | null;
}): AtlasDefaultStrictHorizonsMigrationClassification {
  if (args.status === "pending-runtime-run") return "mixed";
  if (
    args.lockAudits.some(
      (audit) => audit.id === "v88-shadow-gate-lock" && audit.status !== "ready",
    )
  ) {
    return "shadow-gate-regression";
  }
  if (
    args.lockAudits.some(
      (audit) => audit.id === "default-scientific-command-lock" && audit.status !== "ready",
    )
  ) {
    return "default-command-not-migrated";
  }
  if (
    args.hasLegacyRegression ||
    args.lockAudits.some(
      (audit) =>
        (audit.id === "legacy-v75-command-lock" ||
          audit.id === "legacy-v75-blocker-lock") &&
        audit.status !== "ready",
    )
  ) {
    return "legacy-audit-regression";
  }
  if (
    args.hasBudgetRegression ||
    args.lockAudits.some(
      (audit) => audit.id === "v75-budget-lock" && audit.status !== "ready",
    )
  ) {
    return "budget-regression";
  }
  if (
    args.lockAudits.some(
      (audit) => audit.id === "v84-reference-fixture-provenance" && audit.status !== "ready",
    )
  ) {
    return "fixture-regression";
  }
  if (args.ready) return "default-gate-migrated-shadow-provenance";
  return "mixed";
}

import { ATLAS_PHYSICS_BENCHMARK_BUDGETS } from "./atlasPhysicsBenchmarkGate";
import { V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED } from "./atlasHorizonsGateAudit";
import {
  ATLAS_STRICT_HORIZONS_MIGRATION_DRY_RUN_PROFILE,
  ATLAS_STRICT_HORIZONS_MIGRATION_DRY_RUN_VERSION,
  V87_CANDIDATE_FIXTURE_PATH,
  V87_CURRENT_STRICT_FIXTURE_PATH,
  V87_STRICT_HORIZONS_MIGRATION_DIFF_ROW,
  V87_STRICT_SCIENTIFIC_GATE_COMMAND,
} from "./atlasStrictHorizonsMigrationDryRun";
import type {
  AtlasStrictHorizonsShadowMigrationGateClassification,
  AtlasStrictHorizonsShadowMigrationGateLockAudit,
  AtlasStrictHorizonsShadowMigrationGateRow,
  AtlasStrictHorizonsShadowMigrationGateSummary,
} from "./simulationDiagnosticsTypes";

export const ATLAS_STRICT_HORIZONS_SHADOW_MIGRATION_VERSION =
  "v88-strict-horizons-shadow-migration-gate" as const;

export const ATLAS_STRICT_HORIZONS_SHADOW_MIGRATION_PROFILE =
  "v88-parallel-default-gate-rehearsal" as const;

export const V88_STRICT_HORIZONS_SHADOW_MIGRATION_COMMAND =
  "npm run test:atlas:horizons-shadow-migration-gate" as const;

export const V88_STRICT_HORIZONS_SHADOW_MIGRATION_BOUNDARY =
  "Local v88 shadow strict Horizons gate rehearsal. It runs the future migrated strict-gate configuration as a separate non-applied command over the v87 migration dry-run manifest, but it does not replace the default strict scientific gate, relax v75 budgets, claim NASA/JPL certification, mutate SolarSystemIntegrator, physicsEngine defaults, worker physics, RK4, EIH 1PN, Kerr, materials, backgrounds, sky assets or product/scientific gate semantics.";

export const V88_STRICT_HORIZONS_SHADOW_GATE_ROW: AtlasStrictHorizonsShadowMigrationGateRow = {
  id: "v88-parallel-strict-horizons-shadow-gate",
  label: "Parallel strict Horizons shadow migration gate",
  sourceDryRunVersion: ATLAS_STRICT_HORIZONS_MIGRATION_DRY_RUN_VERSION,
  sourceDryRunProfile: ATLAS_STRICT_HORIZONS_MIGRATION_DRY_RUN_PROFILE,
  sourceMigrationDiffId: V87_STRICT_HORIZONS_MIGRATION_DIFF_ROW.id,
  currentDefaultCommand: V87_STRICT_SCIENTIFIC_GATE_COMMAND,
  shadowCommand: V88_STRICT_HORIZONS_SHADOW_MIGRATION_COMMAND,
  currentDefaultFixturePath: V87_CURRENT_STRICT_FIXTURE_PATH,
  shadowFixturePath: V87_CANDIDATE_FIXTURE_PATH,
  shadowDatasetVariant: "v84-outer-system-barycenter-reference",
  shadowMassProfile: "de440-system-gm",
  shadowDtDays: 0.125,
  shadowSofteningAu: 0,
  status: "not-run",
  onePnRmsPositionKm: null,
  onePnRmsVelocityMs: null,
  mercuryOnePnToNewtonRatio: null,
  shadowBudgetStatus: "not-run",
  defaultStrictGateStatus: "expected-fail-unchanged",
  shadowGateMutationStatus: "not-applied",
} as const;

export function createAtlasStrictHorizonsShadowMigrationGateSummary(
  args: {
    lockAudits?: readonly AtlasStrictHorizonsShadowMigrationGateLockAudit[];
    rows?: readonly AtlasStrictHorizonsShadowMigrationGateRow[];
  } = {},
): AtlasStrictHorizonsShadowMigrationGateSummary {
  const lockAudits = args.lockAudits ?? [];
  const shadowGateRows = [
    args.rows?.find((row) => row.id === V88_STRICT_HORIZONS_SHADOW_GATE_ROW.id) ??
      V88_STRICT_HORIZONS_SHADOW_GATE_ROW,
  ];
  const completed = shadowGateRows.filter((row) => row.status === "complete");
  const ready = completed.find((row) => row.shadowBudgetStatus === "pass") ?? null;
  const hasLockRegression = lockAudits.some((audit) => audit.status !== "ready");
  const hasShadowBudgetRegression = completed.some((row) => row.shadowBudgetStatus !== "pass");
  const status =
    completed.length === 0 && lockAudits.length === 0
      ? "pending-runtime-run"
      : hasLockRegression || hasShadowBudgetRegression
        ? "ready-shadow-gate-blocked"
        : ready
          ? "ready-shadow-gate-pass"
          : "ready-default-gate-still-blocked";

  return {
    version: ATLAS_STRICT_HORIZONS_SHADOW_MIGRATION_VERSION,
    shadowGateProfile: ATLAS_STRICT_HORIZONS_SHADOW_MIGRATION_PROFILE,
    status,
    classification: classifyShadowMigrationGate({
      status,
      lockAudits,
      hasShadowBudgetRegression,
      ready,
    }),
    strictBlocker: V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
    shadowGateCount: shadowGateRows.length,
    completedShadowGateCount: completed.length,
    lockAudits,
    shadowGateRows,
    readyShadowGateId: ready?.id ?? "",
    strictBudgetPositionRmsKm: ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm,
    strictBudgetVelocityRmsMs: ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs,
    strictBudgetMercuryRatio: ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsMercuryOnePnToNewtonRatio,
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
    trustedBoundary: V88_STRICT_HORIZONS_SHADOW_MIGRATION_BOUNDARY,
  };
}

function classifyShadowMigrationGate(args: {
  status: AtlasStrictHorizonsShadowMigrationGateSummary["status"];
  lockAudits: readonly AtlasStrictHorizonsShadowMigrationGateLockAudit[];
  hasShadowBudgetRegression: boolean;
  ready: AtlasStrictHorizonsShadowMigrationGateRow | null;
}): AtlasStrictHorizonsShadowMigrationGateClassification {
  if (args.status === "pending-runtime-run") return "mixed";
  if (
    args.lockAudits.some(
      (audit) => audit.id === "v87-migration-diff-lock" && audit.status !== "ready",
    )
  ) {
    return "migration-diff-regression";
  }
  if (
    args.hasShadowBudgetRegression ||
    args.lockAudits.some(
      (audit) => audit.id === "v75-budget-lock" && audit.status !== "ready",
    )
  ) {
    return "shadow-budget-regression";
  }
  if (
    args.lockAudits.some(
      (audit) =>
        (audit.id === "default-strict-command-lock" ||
          audit.id === "shadow-gate-contract-lock") &&
        audit.status !== "ready",
    )
  ) {
    return "strict-command-regression";
  }
  if (
    args.lockAudits.some(
      (audit) =>
        (audit.id === "v75-strict-fixture-lock" ||
          audit.id === "v84-reference-fixture-provenance") &&
        audit.status !== "ready",
    )
  ) {
    return "fixture-regression";
  }
  if (args.ready) return "shadow-gate-pass-default-not-migrated";
  return "mixed";
}

import { ATLAS_PHYSICS_BENCHMARK_BUDGETS } from "./atlasPhysicsBenchmarkGate";
import { V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED } from "./atlasHorizonsGateAudit";
import { V86_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_ROW } from "./atlasHorizonsCandidateScientificGate";
import type {
  AtlasStrictHorizonsMigrationDryRunClassification,
  AtlasStrictHorizonsMigrationDryRunLockAudit,
  AtlasStrictHorizonsMigrationDryRunRow,
  AtlasStrictHorizonsMigrationDryRunSummary,
} from "./simulationDiagnosticsTypes";

export const ATLAS_STRICT_HORIZONS_MIGRATION_DRY_RUN_VERSION =
  "v87-strict-horizons-migration-dry-run" as const;

export const ATLAS_STRICT_HORIZONS_MIGRATION_DRY_RUN_PROFILE =
  "v87-default-gate-migration-diff-audit" as const;

export const V87_CURRENT_STRICT_FIXTURE_PATH =
  "public/data/horizons-validation-j2000.json" as const;

export const V87_CANDIDATE_FIXTURE_PATH =
  "public/data/horizons-validation-j2000-outer-system-barycenter-v84.json" as const;

export const V87_STRICT_SCIENTIFIC_GATE_COMMAND =
  "npm run test:atlas:horizons-scientific-gate" as const;

export const V87_STRICT_HORIZONS_MIGRATION_DRY_RUN_BOUNDARY =
  "Local v87 dry-run audit for a future strict Horizons migration. It records the exact non-applied diff from the current v75 strict fixture and command to the v86 passing candidate path, but it does not migrate the default strict gate, replace fixtures, relax budgets, claim NASA/JPL certification, mutate SolarSystemIntegrator, physicsEngine defaults, worker physics, RK4, EIH 1PN, Kerr, materials, backgrounds, sky assets, screenshots or product/scientific gate semantics.";

export const V87_STRICT_HORIZONS_MIGRATION_DIFF_ROW: AtlasStrictHorizonsMigrationDryRunRow = {
  id: "v87-v86-candidate-default-gate-migration-diff",
  label: "v86 candidate path to future strict Horizons default migration diff",
  sourceCandidateGateId: V86_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_ROW.id,
  currentDefaultFixturePath: V87_CURRENT_STRICT_FIXTURE_PATH,
  candidateFixturePath: V87_CANDIDATE_FIXTURE_PATH,
  candidateDatasetVariant: "v84-outer-system-barycenter-reference",
  candidateMassProfile: "de440-system-gm",
  candidateDtDays: 0.125,
  candidateSofteningAu: 0,
  currentStrictCommand: V87_STRICT_SCIENTIFIC_GATE_COMMAND,
  futureMigrationCommandTarget: V87_STRICT_SCIENTIFIC_GATE_COMMAND,
  rollbackCriteria:
    "Rollback if the future applied strict gate exceeds v75 budgets, regresses v84 fixture provenance, changes the strict fixture without review, or mutates runtime physics/background contracts.",
  status: "not-run",
  onePnRmsPositionKm: null,
  onePnRmsVelocityMs: null,
  mercuryOnePnToNewtonRatio: null,
  diffStatus: "not-run",
  candidateBudgetStatus: "not-run",
  defaultStrictGateStatus: "expected-fail-unchanged",
  migrationMutationStatus: "not-applied",
} as const;

export function createAtlasStrictHorizonsMigrationDryRunSummary(
  args: {
    lockAudits?: readonly AtlasStrictHorizonsMigrationDryRunLockAudit[];
    rows?: readonly AtlasStrictHorizonsMigrationDryRunRow[];
  } = {},
): AtlasStrictHorizonsMigrationDryRunSummary {
  const lockAudits = args.lockAudits ?? [];
  const migrationDiffRows = [
    args.rows?.find((row) => row.id === V87_STRICT_HORIZONS_MIGRATION_DIFF_ROW.id) ??
      V87_STRICT_HORIZONS_MIGRATION_DIFF_ROW,
  ];
  const completed = migrationDiffRows.filter((row) => row.status === "complete");
  const ready = completed.find(
    (row) => row.diffStatus === "complete" && row.candidateBudgetStatus === "pass",
  ) ?? null;
  const hasLockRegression = lockAudits.some((audit) => audit.status !== "ready");
  const hasIncompleteDiff = completed.some((row) => row.diffStatus !== "complete");
  const hasCandidateRegression = completed.some((row) => row.candidateBudgetStatus !== "pass");
  const status =
    completed.length === 0 && lockAudits.length === 0
      ? "pending-runtime-run"
      : hasLockRegression || hasIncompleteDiff || hasCandidateRegression
        ? "ready-migration-blocked"
        : ready
          ? "ready-migration-diff-complete"
          : "ready-default-gate-still-blocked";

  return {
    version: ATLAS_STRICT_HORIZONS_MIGRATION_DRY_RUN_VERSION,
    migrationProfile: ATLAS_STRICT_HORIZONS_MIGRATION_DRY_RUN_PROFILE,
    status,
    classification: classifyMigrationDryRun({
      status,
      lockAudits,
      hasIncompleteDiff,
      hasCandidateRegression,
      ready,
    }),
    strictBlocker: V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
    migrationDiffCount: migrationDiffRows.length,
    completedMigrationDiffCount: completed.length,
    lockAudits,
    migrationDiffRows,
    readyMigrationDiffId: ready?.id ?? "",
    strictBudgetPositionRmsKm: ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm,
    strictBudgetVelocityRmsMs: ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs,
    strictBudgetMercuryRatio: ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsMercuryOnePnToNewtonRatio,
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
    trustedBoundary: V87_STRICT_HORIZONS_MIGRATION_DRY_RUN_BOUNDARY,
  };
}

function classifyMigrationDryRun(args: {
  status: AtlasStrictHorizonsMigrationDryRunSummary["status"];
  lockAudits: readonly AtlasStrictHorizonsMigrationDryRunLockAudit[];
  hasIncompleteDiff: boolean;
  hasCandidateRegression: boolean;
  ready: AtlasStrictHorizonsMigrationDryRunRow | null;
}): AtlasStrictHorizonsMigrationDryRunClassification {
  if (args.status === "pending-runtime-run") return "mixed";
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
  if (
    args.lockAudits.some(
      (audit) => audit.id === "v75-budget-lock" && audit.status !== "ready",
    )
  ) {
    return "budget-regression";
  }
  if (
    args.hasCandidateRegression ||
    args.lockAudits.some(
      (audit) => audit.id === "v86-candidate-gate-lock" && audit.status !== "ready",
    )
  ) {
    return "candidate-regression";
  }
  if (
    args.hasIncompleteDiff ||
    args.lockAudits.some(
      (audit) =>
        (audit.id === "default-strict-command-lock" ||
          audit.id === "migration-contract-lock") &&
        audit.status !== "ready",
    )
  ) {
    return "migration-contract-incomplete";
  }
  if (args.ready) return "default-gate-diff-ready";
  return "candidate-ready-default-not-migrated";
}

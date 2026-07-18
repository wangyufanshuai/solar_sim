import { v86StrictBudgetContract } from "./atlasHorizonsCandidateScientificGateRunner";
import {
  createAtlasStrictHorizonsMigrationDryRunSummary,
  V87_CANDIDATE_FIXTURE_PATH,
  V87_CURRENT_STRICT_FIXTURE_PATH,
  V87_STRICT_SCIENTIFIC_GATE_COMMAND,
} from "./atlasStrictHorizonsMigrationDryRun";
import {
  runAtlasStrictHorizonsMigrationDryRunAudit,
} from "./atlasStrictHorizonsMigrationDryRunRunner";
import {
  V88_STRICT_HORIZONS_SHADOW_GATE_ROW,
  V88_STRICT_HORIZONS_SHADOW_MIGRATION_COMMAND,
} from "./atlasStrictHorizonsShadowMigrationGate";
import type {
  AtlasStrictHorizonsMigrationDryRunLockAudit,
  AtlasStrictHorizonsShadowMigrationGateLockAudit,
  AtlasStrictHorizonsShadowMigrationGateRow,
  HorizonsValidationDataset,
} from "./simulationDiagnosticsTypes";

type ShadowFixtureLock = AtlasStrictHorizonsMigrationDryRunLockAudit & {
  id: "v75-strict-fixture-lock" | "v84-reference-fixture-provenance";
};

export async function runAtlasStrictHorizonsShadowMigrationGateAudit(args: {
  baselineDataset: HorizonsValidationDataset;
  v82HierarchyDataset?: HorizonsValidationDataset | null;
  v84OuterSystemDataset?: HorizonsValidationDataset | null;
}): Promise<{
  lockAudits: readonly AtlasStrictHorizonsShadowMigrationGateLockAudit[];
  rows: readonly AtlasStrictHorizonsShadowMigrationGateRow[];
}> {
  const dryRun = await runAtlasStrictHorizonsMigrationDryRunAudit(args);
  const dryRunSummary = createAtlasStrictHorizonsMigrationDryRunSummary(dryRun);
  const migrationRow = dryRunSummary.migrationDiffRows[0];
  const lockAudits = [
    ...dryRun.lockAudits.filter(isShadowFixtureLock).map(shadowLockFromDryRunLock),
    budgetLock(),
    migrationDiffLock(
      dryRunSummary.status,
      migrationRow?.diffStatus ?? "not-run",
      migrationRow?.candidateBudgetStatus ?? "not-run",
    ),
    defaultStrictCommandLock(),
    shadowGateContractLock(),
  ] as const satisfies readonly AtlasStrictHorizonsShadowMigrationGateLockAudit[];

  if (lockAudits.some((audit) => audit.status !== "ready")) {
    return {
      lockAudits,
      rows: [{ ...V88_STRICT_HORIZONS_SHADOW_GATE_ROW, status: "blocked" }],
    };
  }

  return {
    lockAudits,
    rows: [shadowGateRow(migrationRow)],
  };
}

function isShadowFixtureLock(
  audit: AtlasStrictHorizonsMigrationDryRunLockAudit,
): audit is ShadowFixtureLock {
  return audit.id === "v75-strict-fixture-lock" || audit.id === "v84-reference-fixture-provenance";
}

function shadowLockFromDryRunLock(
  audit: ShadowFixtureLock,
): AtlasStrictHorizonsShadowMigrationGateLockAudit {
  return {
    id: audit.id,
    label: audit.label,
    status: audit.status,
    measured: audit.measured,
    expected: audit.expected,
    trustedBoundary: audit.trustedBoundary,
  };
}

function budgetLock(): AtlasStrictHorizonsShadowMigrationGateLockAudit {
  const budget = v86StrictBudgetContract();
  const status =
    budget.horizonsPositionRmsKm === 1_000_000 &&
    budget.horizonsVelocityRmsMs === 10 &&
    budget.horizonsMercuryOnePnToNewtonRatio === 1.02
      ? "ready"
      : "regressed";
  return {
    id: "v75-budget-lock",
    label: "v75 strict budget lock",
    status,
    measured: `${budget.horizonsPositionRmsKm} km / ${budget.horizonsVelocityRmsMs} m/s / Mercury ${budget.horizonsMercuryOnePnToNewtonRatio}`,
    expected: "1,000,000 km / 10 m/s / Mercury 1.02",
    trustedBoundary:
      "v88 reads the inherited v75 budget constants only. It does not relax thresholds or redefine the strict scientific budget.",
  };
}

function migrationDiffLock(
  status: ReturnType<typeof createAtlasStrictHorizonsMigrationDryRunSummary>["status"],
  diffStatus: "not-run" | "complete" | "incomplete",
  candidateBudgetStatus: "not-run" | "pass" | "fail",
): AtlasStrictHorizonsShadowMigrationGateLockAudit {
  const ready =
    status === "ready-migration-diff-complete" &&
    diffStatus === "complete" &&
    candidateBudgetStatus === "pass";
  return {
    id: "v87-migration-diff-lock",
    label: "v87 migration dry-run diff lock",
    status: ready ? "ready" : "blocked",
    measured: `${status}; diff ${diffStatus}; candidate budget ${candidateBudgetStatus}`,
    expected: "ready-migration-diff-complete; diff complete; candidate budget pass",
    trustedBoundary:
      "The shadow gate can pass only while the v87 migration dry-run manifest remains complete and non-applied.",
  };
}

function defaultStrictCommandLock(): AtlasStrictHorizonsShadowMigrationGateLockAudit {
  return {
    id: "default-strict-command-lock",
    label: "default strict scientific command lock",
    status: "ready",
    measured: V87_STRICT_SCIENTIFIC_GATE_COMMAND,
    expected: "npm run test:atlas:horizons-scientific-gate remains unchanged",
    trustedBoundary:
      "v88 adds a parallel shadow command only. It does not edit package.json's default strict scientific gate command or make the default command pass.",
  };
}

function shadowGateContractLock(): AtlasStrictHorizonsShadowMigrationGateLockAudit {
  const row = V88_STRICT_HORIZONS_SHADOW_GATE_ROW;
  const ready =
    row.currentDefaultFixturePath === V87_CURRENT_STRICT_FIXTURE_PATH &&
    row.shadowFixturePath === V87_CANDIDATE_FIXTURE_PATH &&
    row.shadowMassProfile === "de440-system-gm" &&
    row.shadowDtDays === 0.125 &&
    row.shadowSofteningAu === 0 &&
    row.currentDefaultCommand === V87_STRICT_SCIENTIFIC_GATE_COMMAND &&
    row.shadowCommand === V88_STRICT_HORIZONS_SHADOW_MIGRATION_COMMAND;
  return {
    id: "shadow-gate-contract-lock",
    label: "shadow strict gate contract lock",
    status: ready ? "ready" : "regressed",
    measured: `${row.currentDefaultFixturePath} -> ${row.shadowFixturePath}; ${row.shadowMassProfile}; dt ${row.shadowDtDays}; eps ${row.shadowSofteningAu}; default ${row.currentDefaultCommand}; shadow ${row.shadowCommand}`,
    expected:
      "v75 strict fixture remains default; v84 outer-system barycenter fixture is shadow-only; DE440 system GM; dt 0.125; zero softening; separate shadow command",
    trustedBoundary:
      "The shadow gate is a rehearsal command only. It is not applied to runtime physics, fixtures, scripts or the default strict command.",
  };
}

function shadowGateRow(
  migrationRow:
    | {
        candidateBudgetStatus: "not-run" | "pass" | "fail";
        onePnRmsPositionKm: number | null;
        onePnRmsVelocityMs: number | null;
        mercuryOnePnToNewtonRatio: number | null;
      }
    | undefined,
): AtlasStrictHorizonsShadowMigrationGateRow {
  const shadowBudgetStatus = migrationRow?.candidateBudgetStatus ?? "not-run";
  return {
    ...V88_STRICT_HORIZONS_SHADOW_GATE_ROW,
    status: shadowBudgetStatus === "pass" ? "complete" : "blocked",
    onePnRmsPositionKm: migrationRow?.onePnRmsPositionKm ?? null,
    onePnRmsVelocityMs: migrationRow?.onePnRmsVelocityMs ?? null,
    mercuryOnePnToNewtonRatio: migrationRow?.mercuryOnePnToNewtonRatio ?? null,
    shadowBudgetStatus,
    defaultStrictGateStatus: "expected-fail-unchanged",
    shadowGateMutationStatus: "not-applied",
  };
}

export function v88StrictHorizonsShadowMigrationGateCommandContract(): Readonly<{
  currentDefaultCommand: typeof V87_STRICT_SCIENTIFIC_GATE_COMMAND;
  shadowCommand: typeof V88_STRICT_HORIZONS_SHADOW_MIGRATION_COMMAND;
  currentDefaultFixturePath: typeof V87_CURRENT_STRICT_FIXTURE_PATH;
  shadowFixturePath: typeof V87_CANDIDATE_FIXTURE_PATH;
}> {
  return {
    currentDefaultCommand: V87_STRICT_SCIENTIFIC_GATE_COMMAND,
    shadowCommand: V88_STRICT_HORIZONS_SHADOW_MIGRATION_COMMAND,
    currentDefaultFixturePath: V87_CURRENT_STRICT_FIXTURE_PATH,
    shadowFixturePath: V87_CANDIDATE_FIXTURE_PATH,
  };
}

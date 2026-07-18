import {
  createAtlasHorizonsCandidateScientificGateSummary,
} from "./atlasHorizonsCandidateScientificGate";
import {
  runAtlasHorizonsCandidateScientificGatePreflight,
  v86StrictBudgetContract,
} from "./atlasHorizonsCandidateScientificGateRunner";
import {
  V87_CANDIDATE_FIXTURE_PATH,
  V87_CURRENT_STRICT_FIXTURE_PATH,
  V87_STRICT_HORIZONS_MIGRATION_DIFF_ROW,
  V87_STRICT_SCIENTIFIC_GATE_COMMAND,
} from "./atlasStrictHorizonsMigrationDryRun";
import type {
  AtlasHorizonsCandidateScientificGateLockAudit,
  AtlasStrictHorizonsMigrationDryRunLockAudit,
  AtlasStrictHorizonsMigrationDryRunRow,
  HorizonsValidationDataset,
} from "./simulationDiagnosticsTypes";

type CandidateFixtureLock = AtlasHorizonsCandidateScientificGateLockAudit & {
  id: "v75-strict-fixture-lock" | "v84-reference-fixture-provenance";
};

export async function runAtlasStrictHorizonsMigrationDryRunAudit(args: {
  baselineDataset: HorizonsValidationDataset;
  v82HierarchyDataset?: HorizonsValidationDataset | null;
  v84OuterSystemDataset?: HorizonsValidationDataset | null;
}): Promise<{
  lockAudits: readonly AtlasStrictHorizonsMigrationDryRunLockAudit[];
  rows: readonly AtlasStrictHorizonsMigrationDryRunRow[];
}> {
  const candidateGate = await runAtlasHorizonsCandidateScientificGatePreflight(args);
  const candidateSummary = createAtlasHorizonsCandidateScientificGateSummary(candidateGate);
  const candidateRow = candidateSummary.candidateRows[0];
  const lockAudits = [
    ...candidateGate.lockAudits
      .filter(isCandidateFixtureLock)
      .map(migrationLockFromCandidateLock),
    budgetLock(),
    candidateGateLock(candidateSummary.status, candidateRow?.candidateBudgetStatus ?? "not-run"),
    defaultStrictCommandLock(),
    migrationContractLock(candidateRow?.candidateBudgetStatus ?? "not-run"),
  ] as const satisfies readonly AtlasStrictHorizonsMigrationDryRunLockAudit[];

  if (lockAudits.some((audit) => audit.status !== "ready")) {
    return {
      lockAudits,
      rows: [{ ...V87_STRICT_HORIZONS_MIGRATION_DIFF_ROW, status: "blocked", diffStatus: "incomplete" }],
    };
  }

  return {
    lockAudits,
    rows: [migrationDiffRow(candidateRow)],
  };
}

function migrationLockFromCandidateLock(
  audit: CandidateFixtureLock,
): AtlasStrictHorizonsMigrationDryRunLockAudit {
  return {
    id: audit.id,
    label: audit.label,
    status: audit.status,
    measured: audit.measured,
    expected: audit.expected,
    trustedBoundary: audit.trustedBoundary,
  };
}

function isCandidateFixtureLock(
  audit: AtlasHorizonsCandidateScientificGateLockAudit,
): audit is CandidateFixtureLock {
  return audit.id === "v75-strict-fixture-lock" || audit.id === "v84-reference-fixture-provenance";
}

function budgetLock(): AtlasStrictHorizonsMigrationDryRunLockAudit {
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
      "v87 reads the inherited v75 budget constants only. It does not relax thresholds or redefine the strict scientific budget.",
  };
}

function candidateGateLock(
  status: ReturnType<typeof createAtlasHorizonsCandidateScientificGateSummary>["status"],
  candidateBudgetStatus: AtlasStrictHorizonsMigrationDryRunRow["candidateBudgetStatus"],
): AtlasStrictHorizonsMigrationDryRunLockAudit {
  const ready = status === "candidate-gate-pass-unapplied" && candidateBudgetStatus === "pass";
  return {
    id: "v86-candidate-gate-lock",
    label: "v86 candidate scientific gate lock",
    status: ready ? "ready" : "blocked",
    measured: `${status}; candidate budget ${candidateBudgetStatus}`,
    expected: "candidate-gate-pass-unapplied; candidate budget pass",
    trustedBoundary:
      "The migration diff can be complete only while the v86 candidate gate remains a passing, non-applied candidate.",
  };
}

function defaultStrictCommandLock(): AtlasStrictHorizonsMigrationDryRunLockAudit {
  return {
    id: "default-strict-command-lock",
    label: "default strict scientific command lock",
    status: "ready",
    measured: V87_STRICT_SCIENTIFIC_GATE_COMMAND,
    expected: "npm run test:atlas:horizons-scientific-gate remains unchanged",
    trustedBoundary:
      "v87 documents command ownership only. It does not edit package.json's strict scientific gate command or make the default command pass.",
  };
}

function migrationContractLock(
  candidateBudgetStatus: AtlasStrictHorizonsMigrationDryRunRow["candidateBudgetStatus"],
): AtlasStrictHorizonsMigrationDryRunLockAudit {
  const row = migrationDiffRow({ candidateBudgetStatus });
  const ready =
    row.currentDefaultFixturePath === V87_CURRENT_STRICT_FIXTURE_PATH &&
    row.candidateFixturePath === V87_CANDIDATE_FIXTURE_PATH &&
    row.candidateMassProfile === "de440-system-gm" &&
    row.candidateDtDays === 0.125 &&
    row.candidateSofteningAu === 0 &&
    row.currentStrictCommand === V87_STRICT_SCIENTIFIC_GATE_COMMAND &&
    row.futureMigrationCommandTarget === V87_STRICT_SCIENTIFIC_GATE_COMMAND;
  return {
    id: "migration-contract-lock",
    label: "migration diff contract lock",
    status: ready ? "ready" : "regressed",
    measured: `${row.currentDefaultFixturePath} -> ${row.candidateFixturePath}; ${row.candidateMassProfile}; dt ${row.candidateDtDays}; eps ${row.candidateSofteningAu}; command ${row.currentStrictCommand}`,
    expected:
      "v75 strict fixture -> v84 outer-system barycenter fixture; DE440 system GM; dt 0.125; zero softening; same strict command target",
    trustedBoundary:
      "The migration contract is a dry-run manifest only. It is not applied to runtime physics, fixtures, scripts or commands.",
  };
}

function migrationDiffRow(
  candidateRow:
    | (Pick<AtlasStrictHorizonsMigrationDryRunRow, "candidateBudgetStatus"> &
        Partial<
          Pick<
            AtlasStrictHorizonsMigrationDryRunRow,
            "onePnRmsPositionKm" | "onePnRmsVelocityMs" | "mercuryOnePnToNewtonRatio"
          >
        >)
    | undefined,
): AtlasStrictHorizonsMigrationDryRunRow {
  const candidateBudgetStatus = candidateRow?.candidateBudgetStatus ?? "not-run";
  return {
    ...V87_STRICT_HORIZONS_MIGRATION_DIFF_ROW,
    status: candidateBudgetStatus === "pass" ? "complete" : "blocked",
    onePnRmsPositionKm: candidateRow?.onePnRmsPositionKm ?? null,
    onePnRmsVelocityMs: candidateRow?.onePnRmsVelocityMs ?? null,
    mercuryOnePnToNewtonRatio: candidateRow?.mercuryOnePnToNewtonRatio ?? null,
    diffStatus: candidateBudgetStatus === "pass" ? "complete" : "incomplete",
    candidateBudgetStatus,
    defaultStrictGateStatus: "expected-fail-unchanged",
    migrationMutationStatus: "not-applied",
  };
}

export function v87StrictMigrationDryRunCommandContract(): Readonly<{
  currentStrictCommand: typeof V87_STRICT_SCIENTIFIC_GATE_COMMAND;
  currentDefaultFixturePath: typeof V87_CURRENT_STRICT_FIXTURE_PATH;
  candidateFixturePath: typeof V87_CANDIDATE_FIXTURE_PATH;
}> {
  return {
    currentStrictCommand: V87_STRICT_SCIENTIFIC_GATE_COMMAND,
    currentDefaultFixturePath: V87_CURRENT_STRICT_FIXTURE_PATH,
    candidateFixturePath: V87_CANDIDATE_FIXTURE_PATH,
  };
}

import { V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED } from "./atlasHorizonsGateAudit";
import {
  createAtlasOuterSystemReferenceAdoptionSummary,
} from "./atlasOuterSystemReferenceAdoption";
import {
  runAtlasOuterSystemReferenceAdoptionPreflight,
  v85StrictBudgetContract,
} from "./atlasOuterSystemReferenceAdoptionRunner";
import { V86_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_ROW } from "./atlasHorizonsCandidateScientificGate";
import type {
  AtlasHorizonsCandidateScientificGateLockAudit,
  AtlasHorizonsCandidateScientificGateRow,
  AtlasOuterSystemReferenceAdoptionLockAudit,
  AtlasOuterSystemReferenceAdoptionRow,
  HorizonsValidationDataset,
} from "./simulationDiagnosticsTypes";

type CandidateGateAdoptionLock = AtlasOuterSystemReferenceAdoptionLockAudit & {
  id: "v75-strict-fixture-lock" | "v84-reference-fixture-provenance";
};

export async function runAtlasHorizonsCandidateScientificGatePreflight(args: {
  baselineDataset: HorizonsValidationDataset;
  v82HierarchyDataset?: HorizonsValidationDataset | null;
  v84OuterSystemDataset?: HorizonsValidationDataset | null;
}): Promise<{
  lockAudits: readonly AtlasHorizonsCandidateScientificGateLockAudit[];
  rows: readonly AtlasHorizonsCandidateScientificGateRow[];
}> {
  const adoption = await runAtlasOuterSystemReferenceAdoptionPreflight(args);
  const adoptionSummary = createAtlasOuterSystemReferenceAdoptionSummary(adoption);
  const lockAudits = [
    ...adoption.lockAudits
      .filter(isCandidateGateAdoptionLock)
      .map(candidateGateLockFromAdoptionLock),
    adoptionCandidateBudgetLock(adoptionSummary.candidateRows[0]),
    defaultStrictScientificGateLock(),
  ] as const satisfies readonly AtlasHorizonsCandidateScientificGateLockAudit[];

  if (lockAudits.some((audit) => audit.status !== "ready")) {
    return {
      lockAudits,
      rows: [{ ...V86_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_ROW, status: "blocked" }],
    };
  }

  return {
    lockAudits,
    rows: [candidateGateRowFromAdoptionRow(adoptionSummary.candidateRows[0])],
  };
}

function candidateGateLockFromAdoptionLock(
  audit: CandidateGateAdoptionLock,
): AtlasHorizonsCandidateScientificGateLockAudit {
  return {
    id: audit.id,
    label: audit.label,
    status: audit.status,
    measured: audit.measured,
    expected: audit.expected,
    trustedBoundary: audit.trustedBoundary,
  };
}

function isCandidateGateAdoptionLock(
  audit: AtlasOuterSystemReferenceAdoptionLockAudit,
): audit is CandidateGateAdoptionLock {
  return audit.id === "v75-strict-fixture-lock" || audit.id === "v84-reference-fixture-provenance";
}

function adoptionCandidateBudgetLock(
  row: AtlasOuterSystemReferenceAdoptionRow | undefined,
): AtlasHorizonsCandidateScientificGateLockAudit {
  const status = row?.status === "complete" && row.candidateBudgetStatus === "pass" ? "ready" : "blocked";
  return {
    id: "v85-adoption-candidate-budget",
    label: "v85 adoption candidate budget",
    status,
    measured: row
      ? `${row.status}; ${row.candidateBudgetStatus}; ${row.onePnRmsPositionKm ?? "pending"} km; ${row.onePnRmsVelocityMs ?? "pending"} m/s; Mercury ${row.mercuryOnePnToNewtonRatio ?? "pending"}`
      : "missing v85 adoption candidate row",
    expected:
      "complete; pass; below 1,000,000 km; below 10 m/s; Mercury 1PN/Newton ratio below 1.02",
    trustedBoundary:
      "v86 reuses the v85 adoption runner result as candidate-gate evidence. The row is not applied to the default strict scientific gate.",
  };
}

function defaultStrictScientificGateLock(): AtlasHorizonsCandidateScientificGateLockAudit {
  return {
    id: "default-strict-scientific-gate-lock",
    label: "default strict scientific gate remains blocked",
    status: "ready",
    measured: V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
    expected:
      "Known strict-gate blocker remains disclosed until a later explicit migration changes the default fixture/config.",
    trustedBoundary:
      "The default test:atlas:horizons-scientific-gate command remains the v75 strict scientific gate and is expected to fail until the default path is intentionally migrated.",
  };
}

function candidateGateRowFromAdoptionRow(
  row: AtlasOuterSystemReferenceAdoptionRow | undefined,
): AtlasHorizonsCandidateScientificGateRow {
  if (!row || row.status !== "complete") {
    return { ...V86_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_ROW, status: "blocked" };
  }
  return {
    ...V86_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_ROW,
    status: "complete",
    onePnRmsPositionKm: row.onePnRmsPositionKm,
    onePnRmsVelocityMs: row.onePnRmsVelocityMs,
    mercuryOnePnToNewtonRatio: row.mercuryOnePnToNewtonRatio,
    plutoPositionKm: row.plutoPositionKm,
    plutoVelocityMs: row.plutoVelocityMs,
    candidateBudgetStatus: row.candidateBudgetStatus,
    defaultScientificGateStatus: "expected-fail-unchanged",
    mutationStatus: "not-applied",
  };
}

export function v86StrictBudgetContract(): ReturnType<typeof v85StrictBudgetContract> {
  return v85StrictBudgetContract();
}

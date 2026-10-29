import { ATLAS_PHYSICS_BENCHMARK_BUDGETS } from "./atlasPhysicsBenchmarkGate";
import { V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED } from "./atlasHorizonsGateAudit";
import { V85_OUTER_SYSTEM_REFERENCE_ADOPTION_ROW } from "./atlasOuterSystemReferenceAdoption";
import type {
  AtlasHorizonsCandidateScientificGateClassification,
  AtlasHorizonsCandidateScientificGateLockAudit,
  AtlasHorizonsCandidateScientificGateRow,
  AtlasHorizonsCandidateScientificGateSummary,
} from "./simulationDiagnosticsTypes";

export const ATLAS_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_VERSION =
  "v86-horizons-candidate-scientific-gate" as const;

export const ATLAS_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_PROFILE =
  "v86-barycentric-reference-candidate-gate" as const;

export const ATLAS_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_BOUNDARY =
  "Local v86 candidate scientific gate over the v85 adoption path. This proves only that the v84 outer-system barycenter fixture plus DE440 system GM candidate can satisfy the v75 numerical budget as an unapplied candidate; it does not migrate the default strict Horizons gate, replace the v75 fixture, relax budgets, claim NASA/JPL certification, mutate SolarSystemIntegrator, physicsEngine defaults, worker physics, RK4, EIH 1PN, Kerr, materials, backgrounds, sky assets or product/scientific gate semantics.";

export const V86_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_ROW: AtlasHorizonsCandidateScientificGateRow = {
  id: "v86-barycentric-reference-candidate-scientific-gate",
  label: "v85 barycentric reference candidate scientific gate",
  sourceAdoptionCandidateId: V85_OUTER_SYSTEM_REFERENCE_ADOPTION_ROW.id,
  datasetVariant: "v84-outer-system-barycenter-reference",
  massProfile: "de440-system-gm",
  dtDays: 0.125,
  softeningAu: 0,
  status: "not-run",
  onePnRmsPositionKm: null,
  onePnRmsVelocityMs: null,
  mercuryOnePnToNewtonRatio: null,
  plutoPositionKm: null,
  plutoVelocityMs: null,
  candidateBudgetStatus: "not-run",
  defaultScientificGateStatus: "expected-fail-unchanged",
  mutationStatus: "not-applied",
} as const;

export function createAtlasHorizonsCandidateScientificGateSummary(
  args: {
    lockAudits?: readonly AtlasHorizonsCandidateScientificGateLockAudit[];
    rows?: readonly AtlasHorizonsCandidateScientificGateRow[];
  } = {},
): AtlasHorizonsCandidateScientificGateSummary {
  const lockAudits = args.lockAudits ?? [];
  const candidateRows = [
    args.rows?.find((row) => row.id === V86_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_ROW.id) ??
      V86_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_ROW,
  ];
  const completed = candidateRows.filter((row) => row.status === "complete");
  const best = completed.find((row) => row.candidateBudgetStatus === "pass") ?? null;
  const hasLockRegression = lockAudits.some((audit) => audit.status !== "ready");
  const hasCandidateRegression = completed.some((row) => row.candidateBudgetStatus !== "pass");
  const status =
    completed.length === 0 && lockAudits.length === 0
      ? "pending-runtime-run"
      : hasLockRegression
        ? "candidate-gate-blocked"
        : hasCandidateRegression
          ? "candidate-gate-fail"
          : best
            ? "candidate-gate-pass-unapplied"
            : "candidate-gate-blocked";

  return {
    version: ATLAS_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_VERSION,
    candidateGateProfile: ATLAS_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_PROFILE,
    status,
    classification: classifyCandidateGate({
      status,
      lockAudits,
      best,
      hasCandidateRegression,
    }),
    strictBlocker: V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
    candidateCount: candidateRows.length,
    completedCandidateCount: completed.length,
    lockAudits,
    candidateRows,
    bestCandidateId: best?.id ?? "",
    strictBudgetPositionRmsKm: ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm,
    strictBudgetVelocityRmsMs: ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs,
    strictBudgetMercuryRatio: ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsMercuryOnePnToNewtonRatio,
    defaultStrictFixtureMutation: "not-applied",
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
    scientificCertificationStatus: "candidate-only-default-gate-blocked",
    trustedBoundary: ATLAS_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_BOUNDARY,
  };
}

function classifyCandidateGate(args: {
  status: AtlasHorizonsCandidateScientificGateSummary["status"];
  lockAudits: readonly AtlasHorizonsCandidateScientificGateLockAudit[];
  best: AtlasHorizonsCandidateScientificGateRow | null;
  hasCandidateRegression: boolean;
}): AtlasHorizonsCandidateScientificGateClassification {
  if (args.status === "pending-runtime-run") return "mixed";
  if (
    args.lockAudits.some(
      (audit) =>
        audit.id === "v84-reference-fixture-provenance" && audit.status !== "ready",
    )
  ) {
    return "fixture-provenance-regression";
  }
  if (
    args.lockAudits.some(
      (audit) =>
        audit.id === "v75-strict-fixture-lock" && audit.status !== "ready",
    )
  ) {
    return "budget-regression";
  }
  if (args.hasCandidateRegression) return "candidate-numerical-regression";
  if (args.best) return "candidate-budget-pass";
  return "default-strict-gate-still-blocked";
}

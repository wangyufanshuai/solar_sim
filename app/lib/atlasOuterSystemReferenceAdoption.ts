import { ATLAS_PHYSICS_BENCHMARK_BUDGETS } from "./atlasPhysicsBenchmarkGate";
import { V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED } from "./atlasHorizonsGateAudit";
import type {
  AtlasOuterSystemReferenceAdoptionClassification,
  AtlasOuterSystemReferenceAdoptionLockAudit,
  AtlasOuterSystemReferenceAdoptionRow,
  AtlasOuterSystemReferenceAdoptionSummary,
} from "./simulationDiagnosticsTypes";

export const ATLAS_OUTER_SYSTEM_REFERENCE_ADOPTION_VERSION =
  "v85-outer-system-reference-adoption-preflight" as const;

export const ATLAS_OUTER_SYSTEM_REFERENCE_ADOPTION_PROFILE =
  "v85-barycentric-fixture-adoption-readiness" as const;

export const ATLAS_OUTER_SYSTEM_REFERENCE_ADOPTION_BOUNDARY =
  "Local v85 reference-adoption preflight over the existing v84 outer-system barycenter fixture and DE440 system GM candidate path. This proves migration readiness only: it does not replace the v75 strict fixture, relax budgets, close the strict Horizons scientific gate, claim NASA/JPL certification, mutate SolarSystemIntegrator, physicsEngine defaults, worker physics, RK4, EIH 1PN, Kerr, materials, backgrounds, sky assets or product/scientific gate semantics.";

export const V85_OUTER_SYSTEM_REFERENCE_ADOPTION_ROW: AtlasOuterSystemReferenceAdoptionRow = {
  id: "v85-outer-system-barycenter-system-gm-adoption",
  label: "v84 outer-system barycenter fixture / DE440 system GM adoption candidate",
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
  mutationStatus: "not-applied",
} as const;

export function createAtlasOuterSystemReferenceAdoptionSummary(
  args: {
    lockAudits?: readonly AtlasOuterSystemReferenceAdoptionLockAudit[];
    rows?: readonly AtlasOuterSystemReferenceAdoptionRow[];
  } = {},
): AtlasOuterSystemReferenceAdoptionSummary {
  const lockAudits = args.lockAudits ?? [];
  const candidateRows = [
    args.rows?.find((row) => row.id === V85_OUTER_SYSTEM_REFERENCE_ADOPTION_ROW.id) ??
      V85_OUTER_SYSTEM_REFERENCE_ADOPTION_ROW,
  ];
  const completed = candidateRows.filter((row) => row.status === "complete");
  const best = completed.find((row) => row.candidateBudgetStatus === "pass") ?? null;
  const hasLockRegression = lockAudits.some((audit) => audit.status !== "ready");
  const hasCandidateRegression = completed.some((row) => row.candidateBudgetStatus !== "pass");
  const status =
    completed.length === 0 && lockAudits.length === 0
      ? "pending-runtime-run"
      : hasLockRegression || hasCandidateRegression
        ? "ready-adoption-blocked"
        : best
          ? "ready-adoption-candidate"
          : "ready-default-gate-blocked";

  return {
    version: ATLAS_OUTER_SYSTEM_REFERENCE_ADOPTION_VERSION,
    adoptionProfile: ATLAS_OUTER_SYSTEM_REFERENCE_ADOPTION_PROFILE,
    status,
    classification: classifyAdoption({
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
    skyAssetMutation: "not-applied",
    materialMutation: "not-applied",
    kerrKernelMutation: "not-applied",
    runtimeCertificationStatus: "not-claimed-in-app",
    scientificCertificationStatus: "candidate-only-default-gate-blocked",
    trustedBoundary: ATLAS_OUTER_SYSTEM_REFERENCE_ADOPTION_BOUNDARY,
  };
}

function classifyAdoption(args: {
  status: AtlasOuterSystemReferenceAdoptionSummary["status"];
  lockAudits: readonly AtlasOuterSystemReferenceAdoptionLockAudit[];
  best: AtlasOuterSystemReferenceAdoptionRow | null;
  hasCandidateRegression: boolean;
}): AtlasOuterSystemReferenceAdoptionClassification {
  if (args.status === "pending-runtime-run") return "mixed";
  if (
    args.lockAudits.some(
      (audit) =>
        audit.id === "v84-reference-fixture-provenance" ||
        audit.id === "v82-legacy-candidate-provenance",
    )
  ) {
    const provenanceRegression = args.lockAudits.some(
      (audit) =>
        (audit.id === "v84-reference-fixture-provenance" ||
          audit.id === "v82-legacy-candidate-provenance") &&
        audit.status !== "ready",
    );
    if (provenanceRegression) return "provenance-regression";
  }
  if (
    args.lockAudits.some(
      (audit) => audit.id === "v75-strict-fixture-lock" && audit.status !== "ready",
    )
  ) {
    return "budget-regression";
  }
  if (args.hasCandidateRegression) return "candidate-regression";
  if (args.best) return "default-gate-not-migrated";
  return args.status === "ready-default-gate-blocked" ? "default-gate-not-migrated" : "reference-fixture-ready";
}

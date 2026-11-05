import {
  ATLAS_PHYSICS_BENCHMARK_BUDGETS,
} from "./atlasPhysicsBenchmarkGate";
import {
  V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
} from "./atlasHorizonsGateAudit";
import type {
  AtlasHorizonsResidualComponent,
  AtlasPlutoResidualIsolationAggregate,
  AtlasPlutoResidualIsolationCandidateId,
  AtlasPlutoResidualIsolationClassification,
  AtlasPlutoResidualIsolationMetric,
  AtlasPlutoResidualIsolationRow,
  AtlasPlutoResidualIsolationSummary,
} from "./simulationDiagnosticsTypes";

export const ATLAS_PLUTO_RESIDUAL_ISOLATION_VERSION =
  "v83-pluto-residual-cause-isolation" as const;

export const ATLAS_PLUTO_RESIDUAL_ISOLATION_PROFILE =
  "v83-outer-system-phase-force-model-matrix" as const;

export const ATLAS_PLUTO_RESIDUAL_ISOLATION_BOUNDARY =
  "Local v83 Pluto and outer-solar-system residual isolation over offline Horizons candidate runs. This is diagnostic attribution only: it does not relax v75 budgets, claim NASA/JPL scientific certification, close the strict Horizons gate, mutate SolarSystemIntegrator, physicsEngine defaults, worker physics, RK4, EIH 1PN, Kerr, materials, backgrounds, sky assets or product/scientific gate semantics.";

type IsolationProfile = Pick<
  AtlasPlutoResidualIsolationRow,
  "id" | "label" | "datasetRole" | "massProfile" | "dtDays" | "softeningAu"
>;

export const V83_PLUTO_RESIDUAL_ISOLATION_PROFILES: readonly IsolationProfile[] = [
  {
    id: "v82-solar-gm-zero-softening-half-step",
    label: "v82 DE440 solar GM / zero softening / half step",
    datasetRole: "v75-center-reference",
    massProfile: "de440-solar-gm-only",
    dtDays: 0.125,
    softeningAu: 0,
  },
  {
    id: "v83-solar-gm-zero-softening-quarter-step",
    label: "DE440 solar GM / zero softening / quarter step",
    datasetRole: "v75-center-reference",
    massProfile: "de440-solar-gm-only",
    dtDays: 0.0625,
    softeningAu: 0,
  },
  {
    id: "v83-system-gm-zero-softening-half-step-center",
    label: "DE440 system GM / center reference / half step",
    datasetRole: "v75-center-reference",
    massProfile: "de440-system-gm",
    dtDays: 0.125,
    softeningAu: 0,
  },
  {
    id: "v83-system-gm-zero-softening-quarter-step-center",
    label: "DE440 system GM / center reference / quarter step",
    datasetRole: "v75-center-reference",
    massProfile: "de440-system-gm",
    dtDays: 0.0625,
    softeningAu: 0,
  },
  {
    id: "v83-system-gm-zero-softening-half-step-hierarchy",
    label: "DE440 system GM / hierarchy reference / half step",
    datasetRole: "v82-hierarchy-reference",
    massProfile: "de440-system-gm",
    dtDays: 0.125,
    softeningAu: 0,
  },
  {
    id: "v83-system-gm-zero-softening-quarter-step-hierarchy",
    label: "DE440 system GM / hierarchy reference / quarter step",
    datasetRole: "v82-hierarchy-reference",
    massProfile: "de440-system-gm",
    dtDays: 0.0625,
    softeningAu: 0,
  },
] as const;

export const V83_PLUTO_ISOLATION_BASELINE_ID =
  "v82-solar-gm-zero-softening-half-step" as const;

export function createAtlasPlutoResidualIsolationSummary(
  rows: readonly AtlasPlutoResidualIsolationRow[] = [],
): AtlasPlutoResidualIsolationSummary {
  const candidateRows = V83_PLUTO_RESIDUAL_ISOLATION_PROFILES.map(
    (profile) => rows.find((row) => row.id === profile.id) ?? emptyRow(profile),
  );
  const completed = candidateRows.filter((row) => row.status === "complete");
  const baseline =
    completed.find((row) => row.id === V83_PLUTO_ISOLATION_BASELINE_ID) ?? null;
  const best = minCompletedRow(completed, (row) => row.plutoPositionKm);
  const bestAggregate = best?.plutoExcludedAggregate ?? emptyAggregate("");
  const classification = classifyIsolation(candidateRows, baseline, best);
  const status =
    completed.length === 0
      ? "pending-runtime-run"
      : candidatePassesStrictAggregate(best)
        ? "ready-candidate-actionable"
        : "ready-candidate-limited";

  return {
    version: ATLAS_PLUTO_RESIDUAL_ISOLATION_VERSION,
    isolationProfile: ATLAS_PLUTO_RESIDUAL_ISOLATION_PROFILE,
    status,
    classification,
    strictBlocker: V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
    candidateCount: candidateRows.length,
    completedCandidateCount: completed.length,
    baselinePlutoPlus10y: metricFromRow(baseline),
    bestCandidatePlutoPlus10y: metricFromRow(best),
    plutoExcludedAggregate: bestAggregate,
    dominantRtnComponent: best?.plutoRtn.dominantPositionComponent ?? "unavailable",
    candidateRows,
    budgetMutation: "not-applied",
    physicsMutation: "not-applied",
    skyAssetMutation: "not-applied",
    materialMutation: "not-applied",
    kerrKernelMutation: "not-applied",
    runtimeCertificationStatus: "not-claimed-in-app",
    scientificCertificationStatus: "blocked-by-strict-horizons-gate",
    trustedBoundary: ATLAS_PLUTO_RESIDUAL_ISOLATION_BOUNDARY,
  };
}

function classifyIsolation(
  rows: readonly AtlasPlutoResidualIsolationRow[],
  baseline: AtlasPlutoResidualIsolationRow | null,
  best: AtlasPlutoResidualIsolationRow | null,
): AtlasPlutoResidualIsolationClassification {
  if (!baseline || !best) return "not-isolated";
  if (candidatePassesStrictAggregate(best)) return "likely-reference-model-limit";

  const halfStep = baseline.plutoPositionKm;
  const quarterStep = findPosition(
    rows,
    "v83-solar-gm-zero-softening-quarter-step",
  );
  const hierarchyQuarter = findPosition(
    rows,
    "v83-system-gm-zero-softening-quarter-step-hierarchy",
  );
  const hierarchyImprovement = ratio(halfStep, hierarchyQuarter);
  const stepImprovement = ratio(halfStep, quarterStep);
  const excludedPosition = best.plutoExcludedAggregate.onePnRmsPositionKm;

  if (stepImprovement != null && stepImprovement > 1.5) {
    return "likely-integrator-limit";
  }
  if (hierarchyImprovement != null && hierarchyImprovement > 1.5) {
    return "likely-reference-model-limit";
  }
  if (
    excludedPosition != null &&
    excludedPosition < ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm
  ) {
    return "likely-force-model-limit";
  }
  return "mixed";
}

function metricFromRow(
  row: AtlasPlutoResidualIsolationRow | null,
): AtlasPlutoResidualIsolationMetric {
  return {
    candidateId: row?.id ?? "",
    positionKm: row?.plutoPositionKm ?? null,
    velocityMs: row?.plutoVelocityMs ?? null,
    onePnRmsPositionKm: row?.onePnRmsPositionKm ?? null,
    onePnRmsVelocityMs: row?.onePnRmsVelocityMs ?? null,
    improvementVsBaseline: row?.plutoPositionImprovementVsBaseline ?? null,
  };
}

function emptyRow(
  profile: IsolationProfile,
): AtlasPlutoResidualIsolationRow {
  return {
    ...profile,
    status: "not-run",
    onePnRmsPositionKm: null,
    onePnRmsVelocityMs: null,
    plutoPositionKm: null,
    plutoVelocityMs: null,
    plutoPositionImprovementVsBaseline: null,
    plutoExcludedAggregate: emptyAggregate(profile.id),
    plutoRtn: {
      candidateId: profile.id,
      basisStatus: "unavailable",
      radialPositionKm: null,
      transversePositionKm: null,
      normalPositionKm: null,
      radialVelocityMs: null,
      transverseVelocityMs: null,
      normalVelocityMs: null,
      positionNormKm: null,
      velocityNormMs: null,
      dominantPositionComponent: "unavailable",
      dominantVelocityComponent: "unavailable",
    },
    mutationStatus: "not-applied",
  };
}

function emptyAggregate(
  candidateId: AtlasPlutoResidualIsolationCandidateId | "",
): AtlasPlutoResidualIsolationAggregate {
  return {
    candidateId,
    excludedBodyId: "pluto",
    bodyCount: 0,
    onePnRmsPositionKm: null,
    onePnRmsVelocityMs: null,
  };
}

function candidatePassesStrictAggregate(
  row: AtlasPlutoResidualIsolationRow | null,
): boolean {
  return (
    row?.onePnRmsPositionKm != null &&
    row.onePnRmsPositionKm < ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm &&
    row.onePnRmsVelocityMs != null &&
    row.onePnRmsVelocityMs < ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs
  );
}

function minCompletedRow(
  rows: readonly AtlasPlutoResidualIsolationRow[],
  select: (row: AtlasPlutoResidualIsolationRow) => number | null,
): AtlasPlutoResidualIsolationRow | null {
  return rows.reduce<AtlasPlutoResidualIsolationRow | null>((best, row) => {
    const value = select(row);
    if (value == null || !Number.isFinite(value)) return best;
    if (!best) return row;
    const bestValue = select(best);
    return bestValue == null || value < bestValue ? row : best;
  }, null);
}

function findPosition(
  rows: readonly AtlasPlutoResidualIsolationRow[],
  id: AtlasPlutoResidualIsolationCandidateId,
): number | null {
  return rows.find((row) => row.id === id)?.plutoPositionKm ?? null;
}

function ratio(
  baseline: number | null,
  candidate: number | null,
): number | null {
  if (
    baseline == null ||
    candidate == null ||
    !Number.isFinite(baseline) ||
    !Number.isFinite(candidate) ||
    candidate <= 0
  ) {
    return null;
  }
  return baseline / candidate;
}

export function dominantComponent(
  radial: number | null,
  transverse: number | null,
  normal: number | null,
): AtlasHorizonsResidualComponent {
  if (radial == null || transverse == null || normal == null) {
    return "unavailable";
  }
  const components = [
    ["radial", Math.abs(radial)],
    ["transverse", Math.abs(transverse)],
    ["normal", Math.abs(normal)],
  ] as const;
  return components.reduce((best, current) =>
    current[1] > best[1] ? current : best,
  )[0];
}

import {
  ATLAS_PHYSICS_BENCHMARK_BUDGETS,
} from "./atlasPhysicsBenchmarkGate";
import {
  V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
} from "./atlasHorizonsGateAudit";
import type {
  AtlasOuterSystemForceModelPreflightClassification,
  AtlasOuterSystemForceModelPreflightFixtureAudit,
  AtlasOuterSystemForceModelPreflightRow,
  AtlasOuterSystemForceModelPreflightSummary,
  AtlasPlutoResidualIsolationAggregate,
} from "./simulationDiagnosticsTypes";

export const ATLAS_OUTER_SYSTEM_FORCE_MODEL_PREFLIGHT_VERSION =
  "v84-outer-system-force-model-preflight" as const;

export const ATLAS_OUTER_SYSTEM_FORCE_MODEL_PREFLIGHT_PROFILE =
  "v84-pluto-barycenter-tno-force-model-upgrade-path" as const;

export const ATLAS_OUTER_SYSTEM_FORCE_MODEL_PREFLIGHT_BOUNDARY =
  "Local v84 outer-system force-model preflight over offline Horizons fixtures and non-applied candidate rows. This audits fixture provenance before interpreting Pluto or outer-solar-system residuals. It does not relax v75 budgets, claim NASA/JPL scientific certification, close the strict Horizons gate, mutate SolarSystemIntegrator, physicsEngine defaults, worker physics, RK4, EIH 1PN, Kerr, materials, backgrounds, sky assets or product/scientific gate semantics.";

type PreflightProfile = Pick<
  AtlasOuterSystemForceModelPreflightRow,
  | "id"
  | "label"
  | "targetRole"
  | "datasetVariant"
  | "massProfile"
  | "dtDays"
  | "softeningAu"
  | "fixtureAuditId"
>;

export const V84_OUTER_SYSTEM_FORCE_MODEL_PREFLIGHT_PROFILES: readonly PreflightProfile[] = [
  {
    id: "v83-best-baseline",
    label: "v83 best baseline: DE440 solar GM / zero softening / half step",
    targetRole: "center-reference",
    datasetVariant: "v75-center-reference",
    massProfile: "de440-solar-gm-only",
    dtDays: 0.125,
    softeningAu: 0,
    fixtureAuditId: "",
  },
  {
    id: "v84-pluto-system-barycenter",
    label: "Corrected Pluto system barycenter fixture / solar GM / half step",
    targetRole: "system-barycenter-reference",
    datasetVariant: "v84-outer-system-barycenter-reference",
    massProfile: "de440-solar-gm-only",
    dtDays: 0.125,
    softeningAu: 0,
    fixtureAuditId: "v84-outer-system-barycenter",
  },
  {
    id: "v84-outer-system-barycenter",
    label: "Corrected outer-system barycenter fixture / system GM / half step",
    targetRole: "system-barycenter-reference",
    datasetVariant: "v84-outer-system-barycenter-reference",
    massProfile: "de440-system-gm",
    dtDays: 0.125,
    softeningAu: 0,
    fixtureAuditId: "v84-outer-system-barycenter",
  },
  {
    id: "v84-de440-system-gm-parity",
    label: "Center reference / DE440 system GM parity / half step",
    targetRole: "center-reference",
    datasetVariant: "v75-center-reference",
    massProfile: "de440-system-gm",
    dtDays: 0.125,
    softeningAu: 0,
    fixtureAuditId: "",
  },
  {
    id: "v84-tno-kuiper-metadata-only",
    label: "TNO / Kuiper belt perturbation path metadata",
    targetRole: "metadata-only",
    datasetVariant: "metadata-only",
    massProfile: "metadata-only",
    dtDays: null,
    softeningAu: null,
    fixtureAuditId: "",
  },
] as const;

export function createAtlasOuterSystemForceModelPreflightSummary(
  args: {
    fixtureAudits?: readonly AtlasOuterSystemForceModelPreflightFixtureAudit[];
    rows?: readonly AtlasOuterSystemForceModelPreflightRow[];
  } = {},
): AtlasOuterSystemForceModelPreflightSummary {
  const fixtureAudits = args.fixtureAudits ?? [];
  const candidateRows = V84_OUTER_SYSTEM_FORCE_MODEL_PREFLIGHT_PROFILES.map(
    (profile) => args.rows?.find((row) => row.id === profile.id) ?? emptyRow(profile),
  );
  const completed = candidateRows.filter((row) => row.status === "complete");
  const best = minCompletedRow(completed, (row) => row.plutoPositionKm);
  const oldAudit = fixtureAudits.find((audit) => audit.id === "v82-hierarchy-candidate");
  const v84Audit = fixtureAudits.find((audit) => audit.id === "v84-outer-system-barycenter");
  const status =
    completed.length > 0
      ? candidatePassesStrictAggregate(best)
        ? "ready-upgrade-path-actionable"
        : "ready-upgrade-path-limited"
      : oldAudit?.status === "provenance-insufficient" && v84Audit?.status !== "ready"
        ? "ready-fixture-provenance-blocked"
        : "pending-runtime-run";

  return {
    version: ATLAS_OUTER_SYSTEM_FORCE_MODEL_PREFLIGHT_VERSION,
    preflightProfile: ATLAS_OUTER_SYSTEM_FORCE_MODEL_PREFLIGHT_PROFILE,
    status,
    classification: classifyPreflight({ status, oldAudit, v84Audit, best }),
    strictBlocker: V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
    candidateCount: candidateRows.length,
    completedCandidateCount: completed.length,
    fixtureAudits,
    candidateRows,
    bestCandidateId: best?.id ?? "",
    fixtureProvenanceMutation: "not-applied",
    budgetMutation: "not-applied",
    physicsMutation: "not-applied",
    skyAssetMutation: "not-applied",
    materialMutation: "not-applied",
    kerrKernelMutation: "not-applied",
    runtimeCertificationStatus: "not-claimed-in-app",
    scientificCertificationStatus: "blocked-by-strict-horizons-gate",
    trustedBoundary: ATLAS_OUTER_SYSTEM_FORCE_MODEL_PREFLIGHT_BOUNDARY,
  };
}

function classifyPreflight(args: {
  status: AtlasOuterSystemForceModelPreflightSummary["status"];
  oldAudit: AtlasOuterSystemForceModelPreflightFixtureAudit | undefined;
  v84Audit: AtlasOuterSystemForceModelPreflightFixtureAudit | undefined;
  best: AtlasOuterSystemForceModelPreflightRow | null;
}): AtlasOuterSystemForceModelPreflightClassification {
  if (args.status === "pending-runtime-run") return "not-enough-evidence";
  if (args.status === "ready-fixture-provenance-blocked") {
    return "fixture-provenance-limit";
  }
  if (args.best?.id === "v84-de440-system-gm-parity") return "gm-parity-limit";
  if (args.best?.id === "v84-pluto-system-barycenter" || args.best?.id === "v84-outer-system-barycenter") {
    return candidatePassesStrictAggregate(args.best) ? "barycenter-reference-limit" : "missing-perturber-limit";
  }
  if (
    args.v84Audit?.status === "ready" &&
    args.oldAudit?.status === "provenance-insufficient"
  ) {
    return "missing-perturber-limit";
  }
  return "mixed";
}

function emptyRow(
  profile: PreflightProfile,
): AtlasOuterSystemForceModelPreflightRow {
  return {
    ...profile,
    status: profile.id === "v84-tno-kuiper-metadata-only" ? "metadata-only" : "not-run",
    onePnRmsPositionKm: null,
    onePnRmsVelocityMs: null,
    plutoPositionKm: null,
    plutoVelocityMs: null,
    plutoPositionImprovementVsBaseline: null,
    plutoExcludedAggregate: emptyAggregate(),
    mutationStatus: "not-applied",
  };
}

function emptyAggregate(): AtlasPlutoResidualIsolationAggregate {
  return {
    candidateId: "",
    excludedBodyId: "pluto",
    bodyCount: 0,
    onePnRmsPositionKm: null,
    onePnRmsVelocityMs: null,
  };
}

function candidatePassesStrictAggregate(
  row: AtlasOuterSystemForceModelPreflightRow | null,
): boolean {
  return (
    row?.onePnRmsPositionKm != null &&
    row.onePnRmsPositionKm < ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm &&
    row.onePnRmsVelocityMs != null &&
    row.onePnRmsVelocityMs < ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs
  );
}

function minCompletedRow(
  rows: readonly AtlasOuterSystemForceModelPreflightRow[],
  select: (row: AtlasOuterSystemForceModelPreflightRow) => number | null,
): AtlasOuterSystemForceModelPreflightRow | null {
  return rows.reduce<AtlasOuterSystemForceModelPreflightRow | null>((best, row) => {
    const value = select(row);
    if (value == null || !Number.isFinite(value)) return best;
    if (!best) return row;
    const bestValue = select(best);
    return bestValue == null || value < bestValue ? row : best;
  }, null);
}

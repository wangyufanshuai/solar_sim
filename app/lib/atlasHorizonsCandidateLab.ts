import {
  V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
} from "./atlasHorizonsGateAudit";
import { G_SI } from "./physicalConstants";
import type {
  AtlasHorizonsCandidateLabSummary,
  AtlasHorizonsCandidateProfileId,
  AtlasHorizonsCandidateRow,
} from "./simulationDiagnosticsTypes";

export const ATLAS_HORIZONS_CANDIDATE_LAB_VERSION =
  "v82-horizons-dynamical-parameter-candidate-lab" as const;

export const ATLAS_HORIZONS_CANDIDATE_LAB_PROFILE =
  "v82-de440-gm-softening-step-hierarchy-matrix" as const;

export const ATLAS_HORIZONS_CANDIDATE_LAB_BOUNDARY =
  "Local v82 candidate lab over offline Horizons fixtures, DE440 gravitational parameters, softening and fixed-step variants. Candidate rows are diagnostics only: they do not relax v75 budgets, do not close the strict scientific gate, do not mutate SolarSystemIntegrator, physicsEngine defaults, worker physics, RK4, EIH 1PN, Kerr, materials, backgrounds, sky assets or runtime product/scientific gate semantics.";

const JPL_DE440_GM_M3_S2_BY_ID: Readonly<Record<string, number>> = {
  sun: 1.3271244004127942e20,
  mercury: 2.2031868551400003e13,
  venus: 3.24858592079e14,
  earth: 3.98600435436e14,
  moon: 4.902800066e12,
  mars: 4.2828375214e13,
  jupiter: 1.267127648e17,
  saturn: 3.79405852e16,
  uranus: 5.7945486e15,
  neptune: 6.836527100580397e15,
  pluto: 8.696138177608748e11,
} as const;

export const V82_DE440_SYSTEM_MASS_KG_BY_ID = Object.fromEntries(
  Object.entries(JPL_DE440_GM_M3_S2_BY_ID).map(([id, gm]) => [id, gm / G_SI]),
) as Readonly<Record<string, number>>;

export const V82_DE440_SOLAR_MASS_KG_BY_ID = {
  sun: JPL_DE440_GM_M3_S2_BY_ID.sun / G_SI,
} as const;

type CandidateProfile = {
  id: AtlasHorizonsCandidateProfileId;
  label: string;
  datasetRole: AtlasHorizonsCandidateRow["datasetRole"];
  massProfile: AtlasHorizonsCandidateRow["massProfile"];
  dtDays: number;
  softeningAu: number;
};

export const V82_HORIZONS_CANDIDATE_PROFILES: readonly CandidateProfile[] = [
  {
    id: "baseline-v75-strict",
    label: "v75 strict baseline",
    datasetRole: "v75-center-reference",
    massProfile: "current-nasa-mass-kg",
    dtDays: 0.25,
    softeningAu: 1e-4,
  },
  {
    id: "de440-solar-gm",
    label: "DE440 solar GM",
    datasetRole: "v75-center-reference",
    massProfile: "de440-solar-gm-only",
    dtDays: 0.25,
    softeningAu: 1e-4,
  },
  {
    id: "de440-solar-gm-zero-softening",
    label: "DE440 solar GM / zero softening",
    datasetRole: "v75-center-reference",
    massProfile: "de440-solar-gm-only",
    dtDays: 0.25,
    softeningAu: 0,
  },
  {
    id: "de440-solar-gm-zero-softening-half-step",
    label: "DE440 solar GM / zero softening / half step",
    datasetRole: "v75-center-reference",
    massProfile: "de440-solar-gm-only",
    dtDays: 0.125,
    softeningAu: 0,
  },
  {
    id: "de440-system-gm-zero-softening-half-step-hierarchy",
    label: "DE440 system GM / hierarchy reference / half step",
    datasetRole: "v82-hierarchy-reference",
    massProfile: "de440-system-gm",
    dtDays: 0.125,
    softeningAu: 0,
  },
] as const;

export function createAtlasHorizonsCandidateLabSummary(
  rows: readonly AtlasHorizonsCandidateRow[] = [],
): AtlasHorizonsCandidateLabSummary {
  const candidateRows = V82_HORIZONS_CANDIDATE_PROFILES.map(
    (profile) => rows.find((row) => row.id === profile.id) ?? emptyRow(profile),
  );
  const completed = candidateRows.filter((row) => row.status === "complete");
  const passCount = completed.filter(
    (row) => row.scientificGateCandidateStatus === "pass",
  ).length;
  const bestPosition = minCompletedRow(
    completed,
    (row) => row.onePnRmsPositionKm,
  );
  const bestVelocity = minCompletedRow(
    completed,
    (row) => row.onePnRmsVelocityMs,
  );

  return {
    version: ATLAS_HORIZONS_CANDIDATE_LAB_VERSION,
    candidateProfile: ATLAS_HORIZONS_CANDIDATE_LAB_PROFILE,
    status:
      completed.length === 0
        ? "pending-offline-run"
        : passCount > 0
          ? "candidate-pass-unapplied"
          : "candidate-partial-unapplied",
    strictGateBaselineMeasured: V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
    candidateCount: candidateRows.length,
    completedCandidateCount: completed.length,
    bestPositionCandidateId: bestPosition?.id ?? "",
    bestVelocityCandidateId: bestVelocity?.id ?? "",
    de440Source: "JPL SSD Astrodynamic Parameters DE440",
    hierarchySource: "JPL Horizons system barycenter candidate fixture",
    candidateRows,
    strictGateDefaultMutation: "not-applied",
    candidateMutation: "not-applied",
    budgetMutation: "not-applied",
    physicsMutation: "not-applied",
    skyAssetMutation: "not-applied",
    materialMutation: "not-applied",
    kerrKernelMutation: "not-applied",
    runtimeCertificationStatus: "not-claimed-in-app",
    scientificCertificationStatus:
      completed.length > 0 ? "candidate-unapplied" : "blocked-by-strict-horizons-gate",
    trustedBoundary: ATLAS_HORIZONS_CANDIDATE_LAB_BOUNDARY,
  };
}

function emptyRow(profile: CandidateProfile): AtlasHorizonsCandidateRow {
  return {
    ...rowIdentity(profile),
    status: "not-run",
    onePnRmsPositionKm: null,
    onePnRmsVelocityMs: null,
    mercuryPositionKm: null,
    mercuryVelocityMs: null,
    plutoPositionKm: null,
    plutoVelocityMs: null,
    mercuryVelocityImprovementVsBaseline: null,
    plutoPositionImprovementVsBaseline: null,
    scientificGateCandidateStatus: "not-run",
    mutationStatus: "not-applied",
  };
}

function rowIdentity(profile: CandidateProfile): Pick<
  AtlasHorizonsCandidateRow,
  "id" | "label" | "datasetRole" | "massProfile" | "dtDays" | "softeningAu"
> {
  return {
    id: profile.id,
    label: profile.label,
    datasetRole: profile.datasetRole,
    massProfile: profile.massProfile,
    dtDays: profile.dtDays,
    softeningAu: profile.softeningAu,
  };
}

function minCompletedRow(
  rows: readonly AtlasHorizonsCandidateRow[],
  select: (row: AtlasHorizonsCandidateRow) => number | null,
): AtlasHorizonsCandidateRow | null {
  return rows.reduce<AtlasHorizonsCandidateRow | null>((best, row) => {
    const value = select(row);
    if (value == null || !Number.isFinite(value)) return best;
    if (!best) return row;
    const bestValue = select(best);
    return bestValue == null || value < bestValue ? row : best;
  }, null);
}

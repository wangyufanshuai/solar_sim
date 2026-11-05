import { describe, expect, it } from "vitest";
import { ORBIT_ATLAS_SKY, ORBIT_ATLAS_V9_SKY } from "./orbitAtlasPresentation";
import {
  ATLAS_PHYSICS_BENCHMARK_BUDGETS,
} from "./atlasPhysicsBenchmarkGate";
import {
  V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
} from "./atlasHorizonsGateAudit";
import {
  ATLAS_HORIZONS_CANDIDATE_LAB_PROFILE,
  ATLAS_HORIZONS_CANDIDATE_LAB_VERSION,
  V82_DE440_SYSTEM_MASS_KG_BY_ID,
  V82_HORIZONS_CANDIDATE_PROFILES,
  createAtlasHorizonsCandidateLabSummary,
} from "./atlasHorizonsCandidateLab";
import { G_SI } from "./physicalConstants";
import type { AtlasHorizonsCandidateRow } from "./simulationDiagnosticsTypes";

describe("v82 Horizons dynamical parameter candidate lab", () => {
  it("returns deterministic pending metadata without applying candidates", () => {
    const summary = createAtlasHorizonsCandidateLabSummary();

    expect(summary).toMatchObject({
      version: ATLAS_HORIZONS_CANDIDATE_LAB_VERSION,
      candidateProfile: ATLAS_HORIZONS_CANDIDATE_LAB_PROFILE,
      status: "pending-offline-run",
      strictGateBaselineMeasured: V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
      candidateCount: 5,
      completedCandidateCount: 0,
      bestPositionCandidateId: "",
      bestVelocityCandidateId: "",
      strictGateDefaultMutation: "not-applied",
      candidateMutation: "not-applied",
      budgetMutation: "not-applied",
      physicsMutation: "not-applied",
      skyAssetMutation: "not-applied",
      materialMutation: "not-applied",
      kerrKernelMutation: "not-applied",
      runtimeCertificationStatus: "not-claimed-in-app",
      scientificCertificationStatus: "blocked-by-strict-horizons-gate",
    });
    expect(summary.candidateRows.map((row) => row.id)).toEqual(
      V82_HORIZONS_CANDIDATE_PROFILES.map((profile) => profile.id),
    );
    expect(summary.trustedBoundary).toContain("Candidate rows are diagnostics only");
  });

  it("locks DE440 source constants, v75 budgets, and the legacy V9 sky", () => {
    expect(relativeDelta(V82_DE440_SYSTEM_MASS_KG_BY_ID.sun * G_SI, 1.3271244004127942e20)).toBeLessThan(1e-15);
    expect(relativeDelta(V82_DE440_SYSTEM_MASS_KG_BY_ID.pluto * G_SI, 8.696138177608748e11)).toBeLessThan(1e-15);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm).toBe(
      1_000_000,
    );
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs).toBe(10);
    expect(
      ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsMercuryOnePnToNewtonRatio,
    ).toBe(1.02);
    expect(ORBIT_ATLAS_SKY).toBe(ORBIT_ATLAS_V9_SKY);
    expect(ORBIT_ATLAS_V9_SKY.rotation).toEqual([-0.34, 4.24, -0.86]);
  });

  it("summarizes completed candidate rows without treating them as applied physics", () => {
    const rows: AtlasHorizonsCandidateRow[] = [
      candidateRow("baseline-v75-strict", 1_300_000, 380, "partial"),
      candidateRow(
        "de440-system-gm-zero-softening-half-step-hierarchy",
        500_000,
        8,
        "pass",
      ),
    ];
    const summary = createAtlasHorizonsCandidateLabSummary(rows);

    expect(summary.status).toBe("candidate-pass-unapplied");
    expect(summary.completedCandidateCount).toBe(2);
    expect(summary.bestPositionCandidateId).toBe(
      "de440-system-gm-zero-softening-half-step-hierarchy",
    );
    expect(summary.bestVelocityCandidateId).toBe(
      "de440-system-gm-zero-softening-half-step-hierarchy",
    );
    expect(summary.scientificCertificationStatus).toBe("candidate-unapplied");
    expect(summary.candidateMutation).toBe("not-applied");
    expect(summary.physicsMutation).toBe("not-applied");
  });
});

function candidateRow(
  id: AtlasHorizonsCandidateRow["id"],
  onePnRmsPositionKm: number,
  onePnRmsVelocityMs: number,
  scientificGateCandidateStatus: AtlasHorizonsCandidateRow["scientificGateCandidateStatus"],
): AtlasHorizonsCandidateRow {
  const profile = V82_HORIZONS_CANDIDATE_PROFILES.find((item) => item.id === id);
  if (!profile) throw new Error(`Unknown test profile ${id}`);
  return {
    id,
    label: profile.label,
    datasetRole: profile.datasetRole,
    massProfile: profile.massProfile,
    dtDays: profile.dtDays,
    softeningAu: profile.softeningAu,
    status: "complete",
    onePnRmsPositionKm,
    onePnRmsVelocityMs,
    mercuryPositionKm: 10,
    mercuryVelocityMs: 1,
    plutoPositionKm: 10,
    plutoVelocityMs: 1,
    mercuryVelocityImprovementVsBaseline: null,
    plutoPositionImprovementVsBaseline: null,
    scientificGateCandidateStatus,
    mutationStatus: "not-applied",
  };
}

function relativeDelta(value: number, target: number): number {
  return Math.abs(value - target) / Math.abs(target);
}

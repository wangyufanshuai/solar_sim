import { describe, expect, it } from "vitest";
import { ORBIT_ATLAS_SKY, ORBIT_ATLAS_V9_SKY } from "./orbitAtlasPresentation";
import {
  ATLAS_PHYSICS_BENCHMARK_BUDGETS,
} from "./atlasPhysicsBenchmarkGate";
import {
  V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
} from "./atlasHorizonsGateAudit";
import {
  ATLAS_HORIZONS_CANDIDATE_LAB_VERSION,
  createAtlasHorizonsCandidateLabSummary,
} from "./atlasHorizonsCandidateLab";
import {
  ATLAS_PLUTO_RESIDUAL_ISOLATION_PROFILE,
  ATLAS_PLUTO_RESIDUAL_ISOLATION_VERSION,
  V83_PLUTO_RESIDUAL_ISOLATION_PROFILES,
  createAtlasPlutoResidualIsolationSummary,
} from "./atlasPlutoResidualIsolation";
import type { AtlasPlutoResidualIsolationRow } from "./simulationDiagnosticsTypes";

describe("v83 Pluto residual cause isolation", () => {
  it("returns deterministic pending metadata without applying any candidate", () => {
    const summary = createAtlasPlutoResidualIsolationSummary();

    expect(summary).toMatchObject({
      version: ATLAS_PLUTO_RESIDUAL_ISOLATION_VERSION,
      isolationProfile: ATLAS_PLUTO_RESIDUAL_ISOLATION_PROFILE,
      status: "pending-runtime-run",
      classification: "not-isolated",
      strictBlocker: V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
      candidateCount: 6,
      completedCandidateCount: 0,
      budgetMutation: "not-applied",
      physicsMutation: "not-applied",
      skyAssetMutation: "not-applied",
      materialMutation: "not-applied",
      kerrKernelMutation: "not-applied",
      runtimeCertificationStatus: "not-claimed-in-app",
      scientificCertificationStatus: "blocked-by-strict-horizons-gate",
    });
    expect(summary.candidateRows.map((row) => row.id)).toEqual(
      V83_PLUTO_RESIDUAL_ISOLATION_PROFILES.map((profile) => profile.id),
    );
    expect(summary.baselinePlutoPlus10y.candidateId).toBe("");
    expect(summary.bestCandidatePlutoPlus10y.candidateId).toBe("");
    expect(summary.dominantRtnComponent).toBe("unavailable");
    expect(summary.trustedBoundary).toContain("diagnostic attribution only");
  });

  it("keeps v75 budgets, v82 candidate lab, and legacy V9 sky locked", () => {
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm).toBe(
      1_000_000,
    );
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs).toBe(10);
    expect(
      ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsMercuryOnePnToNewtonRatio,
    ).toBe(1.02);
    expect(createAtlasHorizonsCandidateLabSummary().version).toBe(
      ATLAS_HORIZONS_CANDIDATE_LAB_VERSION,
    );
    expect(createAtlasHorizonsCandidateLabSummary().status).toBe(
      "pending-offline-run",
    );
    expect(ORBIT_ATLAS_SKY).toBe(ORBIT_ATLAS_V9_SKY);
    expect(ORBIT_ATLAS_V9_SKY.rotation).toEqual([-0.34, 4.24, -0.86]);
  });

  it("classifies completed rows without closing the strict scientific gate", () => {
    const rows: AtlasPlutoResidualIsolationRow[] = [
      completedRow("v82-solar-gm-zero-softening-half-step", 1_800_000, 8, 1_800_000),
      completedRow(
        "v83-solar-gm-zero-softening-quarter-step",
        1_200_000,
        7,
        1_200_000,
        800_000,
      ),
      completedRow(
        "v83-system-gm-zero-softening-quarter-step-hierarchy",
        1_700_000,
        7,
        1_700_000,
      ),
    ];
    const summary = createAtlasPlutoResidualIsolationSummary(rows);

    expect(summary.status).toBe("ready-candidate-limited");
    expect(summary.classification).toBe("likely-force-model-limit");
    expect(summary.completedCandidateCount).toBe(3);
    expect(summary.baselinePlutoPlus10y.candidateId).toBe(
      "v82-solar-gm-zero-softening-half-step",
    );
    expect(summary.bestCandidatePlutoPlus10y.candidateId).toBe(
      "v83-solar-gm-zero-softening-quarter-step",
    );
    expect(summary.bestCandidatePlutoPlus10y.improvementVsBaseline).toBeCloseTo(1.5);
    expect(summary.plutoExcludedAggregate.onePnRmsPositionKm).toBe(800_000);
    expect(summary.physicsMutation).toBe("not-applied");
    expect(summary.scientificCertificationStatus).toBe(
      "blocked-by-strict-horizons-gate",
    );
  });
});

function completedRow(
  id: AtlasPlutoResidualIsolationRow["id"],
  plutoPositionKm: number,
  plutoVelocityMs: number,
  onePnRmsPositionKm: number,
  plutoExcludedPositionKm = 1_500_000,
): AtlasPlutoResidualIsolationRow {
  const profile = V83_PLUTO_RESIDUAL_ISOLATION_PROFILES.find((item) => item.id === id);
  if (!profile) throw new Error(`Unknown v83 profile ${id}`);
  return {
    ...profile,
    status: "complete",
    onePnRmsPositionKm,
    onePnRmsVelocityMs: 7,
    plutoPositionKm,
    plutoVelocityMs,
    plutoPositionImprovementVsBaseline:
      id === "v82-solar-gm-zero-softening-half-step"
        ? 1
        : 1_800_000 / plutoPositionKm,
    plutoExcludedAggregate: {
      candidateId: id,
      excludedBodyId: "pluto",
      bodyCount: 10,
      onePnRmsPositionKm: plutoExcludedPositionKm,
      onePnRmsVelocityMs: 4,
    },
    plutoRtn: {
      candidateId: id,
      basisStatus: "ready",
      radialPositionKm: 100,
      transversePositionKm: plutoPositionKm,
      normalPositionKm: 25,
      radialVelocityMs: 0.1,
      transverseVelocityMs: plutoVelocityMs,
      normalVelocityMs: 0.01,
      positionNormKm: plutoPositionKm,
      velocityNormMs: plutoVelocityMs,
      dominantPositionComponent: "transverse",
      dominantVelocityComponent: "transverse",
    },
    mutationStatus: "not-applied",
  };
}

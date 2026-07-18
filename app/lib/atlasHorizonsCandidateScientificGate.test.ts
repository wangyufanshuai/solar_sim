import { describe, expect, it } from "vitest";
import { ORBIT_ATLAS_SKY, ORBIT_ATLAS_V9_SKY } from "./orbitAtlasPresentation";
import { ATLAS_PHYSICS_BENCHMARK_BUDGETS } from "./atlasPhysicsBenchmarkGate";
import { V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED } from "./atlasHorizonsGateAudit";
import {
  ATLAS_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_PROFILE,
  ATLAS_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_VERSION,
  V86_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_ROW,
  createAtlasHorizonsCandidateScientificGateSummary,
} from "./atlasHorizonsCandidateScientificGate";
import type {
  AtlasHorizonsCandidateScientificGateLockAudit,
  AtlasHorizonsCandidateScientificGateRow,
} from "./simulationDiagnosticsTypes";

describe("v86 Horizons candidate scientific gate", () => {
  it("returns deterministic pending metadata without applying the candidate gate", () => {
    const summary = createAtlasHorizonsCandidateScientificGateSummary();

    expect(summary).toMatchObject({
      version: ATLAS_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_VERSION,
      candidateGateProfile: ATLAS_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_PROFILE,
      status: "pending-runtime-run",
      classification: "mixed",
      strictBlocker: V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
      candidateCount: 1,
      completedCandidateCount: 0,
      bestCandidateId: "",
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
    });
    expect(summary.candidateRows).toEqual([V86_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_ROW]);
    expect(summary.trustedBoundary).toContain("unapplied candidate");
  });

  it("keeps v75 budgets, default strict gate policy and legacy V9 sky locked", () => {
    const summary = createAtlasHorizonsCandidateScientificGateSummary();

    expect(summary.strictBudgetPositionRmsKm).toBe(1_000_000);
    expect(summary.strictBudgetVelocityRmsMs).toBe(10);
    expect(summary.strictBudgetMercuryRatio).toBe(1.02);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm).toBe(1_000_000);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs).toBe(10);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsMercuryOnePnToNewtonRatio).toBe(1.02);
    expect(V86_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_ROW.datasetVariant).toBe(
      "v84-outer-system-barycenter-reference",
    );
    expect(V86_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_ROW.massProfile).toBe("de440-system-gm");
    expect(V86_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_ROW.dtDays).toBe(0.125);
    expect(V86_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_ROW.softeningAu).toBe(0);
    expect(V86_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_ROW.defaultScientificGateStatus).toBe(
      "expected-fail-unchanged",
    );
    expect(ORBIT_ATLAS_SKY).toBe(ORBIT_ATLAS_V9_SKY);
  });

  it("reports a passing candidate gate as unapplied candidate evidence", () => {
    const summary = createAtlasHorizonsCandidateScientificGateSummary({
      lockAudits: [
        lock("v75-strict-fixture-lock", "ready"),
        lock("v84-reference-fixture-provenance", "ready"),
        lock("v85-adoption-candidate-budget", "ready"),
        lock("default-strict-scientific-gate-lock", "ready"),
      ],
      rows: [completedRow("pass")],
    });

    expect(summary.status).toBe("candidate-gate-pass-unapplied");
    expect(summary.classification).toBe("candidate-budget-pass");
    expect(summary.completedCandidateCount).toBe(1);
    expect(summary.bestCandidateId).toBe(
      "v86-barycentric-reference-candidate-scientific-gate",
    );
    expect(summary.defaultScientificGateMutation).toBe("not-applied");
    expect(summary.referenceFixtureAdoptionMutation).toBe("not-applied");
    expect(summary.physicsMutation).toBe("not-applied");
    expect(summary.kerrKernelMutation).toBe("not-applied");
  });

  it("blocks the candidate gate on provenance, budget or numerical regressions", () => {
    expect(
      createAtlasHorizonsCandidateScientificGateSummary({
        lockAudits: [lock("v84-reference-fixture-provenance", "regressed")],
      }).classification,
    ).toBe("fixture-provenance-regression");
    expect(
      createAtlasHorizonsCandidateScientificGateSummary({
        lockAudits: [lock("v75-strict-fixture-lock", "regressed")],
      }).classification,
    ).toBe("budget-regression");
    expect(
      createAtlasHorizonsCandidateScientificGateSummary({
        lockAudits: [
          lock("v75-strict-fixture-lock", "ready"),
          lock("v84-reference-fixture-provenance", "ready"),
          lock("v85-adoption-candidate-budget", "ready"),
          lock("default-strict-scientific-gate-lock", "ready"),
        ],
        rows: [completedRow("fail")],
      }).classification,
    ).toBe("candidate-numerical-regression");
  });
});

function lock(
  id: AtlasHorizonsCandidateScientificGateLockAudit["id"],
  status: AtlasHorizonsCandidateScientificGateLockAudit["status"],
): AtlasHorizonsCandidateScientificGateLockAudit {
  return {
    id,
    label: id,
    status,
    measured: status,
    expected: "ready",
    trustedBoundary: "v86 test lock audit",
  };
}

function completedRow(
  candidateBudgetStatus: AtlasHorizonsCandidateScientificGateRow["candidateBudgetStatus"],
): AtlasHorizonsCandidateScientificGateRow {
  return {
    ...V86_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_ROW,
    status: "complete",
    onePnRmsPositionKm: candidateBudgetStatus === "pass" ? 12.43 : 1_500_000,
    onePnRmsVelocityMs: candidateBudgetStatus === "pass" ? 0.0302 : 12,
    mercuryOnePnToNewtonRatio: 0.997826,
    plutoPositionKm: 6.89,
    plutoVelocityMs: 0.0000494,
    candidateBudgetStatus,
    defaultScientificGateStatus: "expected-fail-unchanged",
    mutationStatus: "not-applied",
  };
}

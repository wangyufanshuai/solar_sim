import { describe, expect, it } from "vitest";
import { ORBIT_ATLAS_SKY, ORBIT_ATLAS_V9_SKY } from "./orbitAtlasPresentation";
import { ATLAS_PHYSICS_BENCHMARK_BUDGETS } from "./atlasPhysicsBenchmarkGate";
import { V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED } from "./atlasHorizonsGateAudit";
import {
  ATLAS_OUTER_SYSTEM_REFERENCE_ADOPTION_PROFILE,
  ATLAS_OUTER_SYSTEM_REFERENCE_ADOPTION_VERSION,
  V85_OUTER_SYSTEM_REFERENCE_ADOPTION_ROW,
  createAtlasOuterSystemReferenceAdoptionSummary,
} from "./atlasOuterSystemReferenceAdoption";
import type {
  AtlasOuterSystemReferenceAdoptionLockAudit,
  AtlasOuterSystemReferenceAdoptionRow,
} from "./simulationDiagnosticsTypes";

describe("v85 outer-system reference adoption preflight", () => {
  it("returns deterministic pending metadata without mutating default gates", () => {
    const summary = createAtlasOuterSystemReferenceAdoptionSummary();

    expect(summary).toMatchObject({
      version: ATLAS_OUTER_SYSTEM_REFERENCE_ADOPTION_VERSION,
      adoptionProfile: ATLAS_OUTER_SYSTEM_REFERENCE_ADOPTION_PROFILE,
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
      skyAssetMutation: "not-applied",
      materialMutation: "not-applied",
      kerrKernelMutation: "not-applied",
      runtimeCertificationStatus: "not-claimed-in-app",
      scientificCertificationStatus: "candidate-only-default-gate-blocked",
    });
    expect(summary.candidateRows).toEqual([V85_OUTER_SYSTEM_REFERENCE_ADOPTION_ROW]);
    expect(summary.trustedBoundary).toContain("migration readiness only");
  });

  it("keeps v75 strict budgets, default strict fixture policy and legacy V9 sky locked", () => {
    const summary = createAtlasOuterSystemReferenceAdoptionSummary();

    expect(summary.strictBudgetPositionRmsKm).toBe(1_000_000);
    expect(summary.strictBudgetVelocityRmsMs).toBe(10);
    expect(summary.strictBudgetMercuryRatio).toBe(1.02);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm).toBe(1_000_000);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs).toBe(10);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsMercuryOnePnToNewtonRatio).toBe(1.02);
    expect(V85_OUTER_SYSTEM_REFERENCE_ADOPTION_ROW.datasetVariant).toBe(
      "v84-outer-system-barycenter-reference",
    );
    expect(V85_OUTER_SYSTEM_REFERENCE_ADOPTION_ROW.massProfile).toBe("de440-system-gm");
    expect(V85_OUTER_SYSTEM_REFERENCE_ADOPTION_ROW.dtDays).toBe(0.125);
    expect(V85_OUTER_SYSTEM_REFERENCE_ADOPTION_ROW.softeningAu).toBe(0);
    expect(ORBIT_ATLAS_SKY).toBe(ORBIT_ATLAS_V9_SKY);
  });

  it("classifies a passing candidate as an unapplied adoption candidate", () => {
    const summary = createAtlasOuterSystemReferenceAdoptionSummary({
      lockAudits: [
        lock("v75-strict-fixture-lock", "ready"),
        lock("v84-reference-fixture-provenance", "ready"),
        lock("v82-legacy-candidate-provenance", "ready"),
      ],
      rows: [completedRow("pass")],
    });

    expect(summary.status).toBe("ready-adoption-candidate");
    expect(summary.classification).toBe("default-gate-not-migrated");
    expect(summary.completedCandidateCount).toBe(1);
    expect(summary.bestCandidateId).toBe(
      "v85-outer-system-barycenter-system-gm-adoption",
    );
    expect(summary.defaultScientificGateMutation).toBe("not-applied");
    expect(summary.physicsMutation).toBe("not-applied");
  });

  it("blocks adoption on provenance, budget or candidate regressions", () => {
    expect(
      createAtlasOuterSystemReferenceAdoptionSummary({
        lockAudits: [lock("v84-reference-fixture-provenance", "regressed")],
      }).classification,
    ).toBe("provenance-regression");
    expect(
      createAtlasOuterSystemReferenceAdoptionSummary({
        lockAudits: [lock("v75-strict-fixture-lock", "regressed")],
      }).classification,
    ).toBe("budget-regression");
    expect(
      createAtlasOuterSystemReferenceAdoptionSummary({
        lockAudits: [
          lock("v75-strict-fixture-lock", "ready"),
          lock("v84-reference-fixture-provenance", "ready"),
        ],
        rows: [completedRow("fail")],
      }).classification,
    ).toBe("candidate-regression");
  });
});

function lock(
  id: AtlasOuterSystemReferenceAdoptionLockAudit["id"],
  status: AtlasOuterSystemReferenceAdoptionLockAudit["status"],
): AtlasOuterSystemReferenceAdoptionLockAudit {
  return {
    id,
    label: id,
    status,
    measured: status,
    expected: "ready",
    trustedBoundary: "v85 test lock audit",
  };
}

function completedRow(
  candidateBudgetStatus: AtlasOuterSystemReferenceAdoptionRow["candidateBudgetStatus"],
): AtlasOuterSystemReferenceAdoptionRow {
  return {
    ...V85_OUTER_SYSTEM_REFERENCE_ADOPTION_ROW,
    status: "complete",
    onePnRmsPositionKm: candidateBudgetStatus === "pass" ? 12.43 : 1_500_000,
    onePnRmsVelocityMs: candidateBudgetStatus === "pass" ? 0.0302 : 12,
    mercuryOnePnToNewtonRatio: 0.997826,
    plutoPositionKm: 6.89,
    plutoVelocityMs: 0.0000494,
    candidateBudgetStatus,
    mutationStatus: "not-applied",
  };
}

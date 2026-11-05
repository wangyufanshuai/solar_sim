import { describe, expect, it } from "vitest";
import { ORBIT_ATLAS_SKY, ORBIT_ATLAS_V9_SKY } from "./orbitAtlasPresentation";
import {
  ATLAS_PHYSICS_BENCHMARK_BUDGETS,
} from "./atlasPhysicsBenchmarkGate";
import {
  V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
} from "./atlasHorizonsGateAudit";
import {
  ATLAS_OUTER_SYSTEM_FORCE_MODEL_PREFLIGHT_PROFILE,
  ATLAS_OUTER_SYSTEM_FORCE_MODEL_PREFLIGHT_VERSION,
  V84_OUTER_SYSTEM_FORCE_MODEL_PREFLIGHT_PROFILES,
  createAtlasOuterSystemForceModelPreflightSummary,
} from "./atlasOuterSystemForceModelPreflight";
import type {
  AtlasOuterSystemForceModelPreflightFixtureAudit,
  AtlasOuterSystemForceModelPreflightRow,
} from "./simulationDiagnosticsTypes";

describe("v84 outer-system force-model preflight", () => {
  it("returns deterministic pending metadata without mutating budgets or physics", () => {
    const summary = createAtlasOuterSystemForceModelPreflightSummary();

    expect(summary).toMatchObject({
      version: ATLAS_OUTER_SYSTEM_FORCE_MODEL_PREFLIGHT_VERSION,
      preflightProfile: ATLAS_OUTER_SYSTEM_FORCE_MODEL_PREFLIGHT_PROFILE,
      status: "pending-runtime-run",
      classification: "not-enough-evidence",
      strictBlocker: V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
      candidateCount: 5,
      completedCandidateCount: 0,
      fixtureProvenanceMutation: "not-applied",
      budgetMutation: "not-applied",
      physicsMutation: "not-applied",
      skyAssetMutation: "not-applied",
      materialMutation: "not-applied",
      kerrKernelMutation: "not-applied",
      runtimeCertificationStatus: "not-claimed-in-app",
      scientificCertificationStatus: "blocked-by-strict-horizons-gate",
    });
    expect(summary.candidateRows.map((row) => row.id)).toEqual(
      V84_OUTER_SYSTEM_FORCE_MODEL_PREFLIGHT_PROFILES.map((profile) => profile.id),
    );
    expect(summary.trustedBoundary).toContain("audits fixture provenance");
  });

  it("keeps v75 strict budgets and legacy V9 sky locked", () => {
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm).toBe(
      1_000_000,
    );
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs).toBe(10);
    expect(
      ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsMercuryOnePnToNewtonRatio,
    ).toBe(1.02);
    expect(ORBIT_ATLAS_SKY).toBe(ORBIT_ATLAS_V9_SKY);
  });

  it("blocks on fixture provenance when only the old v82 candidate is insufficient", () => {
    const summary = createAtlasOuterSystemForceModelPreflightSummary({
      fixtureAudits: [
        audit("v82-hierarchy-candidate", "provenance-insufficient", 0),
      ],
    });

    expect(summary.status).toBe("ready-fixture-provenance-blocked");
    expect(summary.classification).toBe("fixture-provenance-limit");
    expect(summary.completedCandidateCount).toBe(0);
    expect(summary.fixtureAudits[0]?.trustedBoundary).toContain(
      "target provenance",
    );
  });

  it("classifies completed non-applied rows as an upgrade path without passing certification", () => {
    const rows: AtlasOuterSystemForceModelPreflightRow[] = [
      completedRow("v83-best-baseline", 7_600_000, 1_300_000),
      completedRow("v84-outer-system-barycenter", 6_800_000, 1_200_000),
    ];
    const summary = createAtlasOuterSystemForceModelPreflightSummary({
      fixtureAudits: [
        audit("v82-hierarchy-candidate", "provenance-insufficient", 0),
        audit("v84-outer-system-barycenter", "ready", 1e-5),
      ],
      rows,
    });

    expect(summary.status).toBe("ready-upgrade-path-limited");
    expect(summary.classification).toMatch(
      /barycenter-reference-limit|missing-perturber-limit/,
    );
    expect(summary.bestCandidateId).toBe("v84-outer-system-barycenter");
    expect(summary.scientificCertificationStatus).toBe(
      "blocked-by-strict-horizons-gate",
    );
    expect(summary.physicsMutation).toBe("not-applied");
  });
});

function audit(
  id: AtlasOuterSystemForceModelPreflightFixtureAudit["id"],
  status: AtlasOuterSystemForceModelPreflightFixtureAudit["status"],
  delta: number,
): AtlasOuterSystemForceModelPreflightFixtureAudit {
  return {
    id,
    label: id,
    status,
    variant:
      id === "v84-outer-system-barycenter"
        ? "v84-outer-system-barycenter-reference"
        : "v82-hierarchy-barycenter-candidate",
    expectedVariant:
      id === "v84-outer-system-barycenter"
        ? "v84-outer-system-barycenter-reference"
        : "v82-hierarchy-barycenter-candidate",
    outerSystemJ2000DeltaAu: delta,
    targetProvenanceBodyCount: status === "ready" ? 12 : 0,
    barycenterTargetCount: status === "ready" ? 6 : 0,
    trustedBoundary:
      status === "ready"
        ? "target provenance ready"
        : "target provenance insufficient",
  };
}

function completedRow(
  id: AtlasOuterSystemForceModelPreflightRow["id"],
  plutoPositionKm: number,
  onePnRmsPositionKm: number,
): AtlasOuterSystemForceModelPreflightRow {
  const profile = V84_OUTER_SYSTEM_FORCE_MODEL_PREFLIGHT_PROFILES.find(
    (item) => item.id === id,
  );
  if (!profile) throw new Error(`Unknown v84 profile ${id}`);
  return {
    ...profile,
    status: "complete",
    onePnRmsPositionKm,
    onePnRmsVelocityMs: 8,
    plutoPositionKm,
    plutoVelocityMs: 20,
    plutoPositionImprovementVsBaseline:
      id === "v83-best-baseline" ? 1 : 7_600_000 / plutoPositionKm,
    plutoExcludedAggregate: {
      candidateId: "",
      excludedBodyId: "pluto",
      bodyCount: 10,
      onePnRmsPositionKm: 200_000,
      onePnRmsVelocityMs: 5,
    },
    mutationStatus: "not-applied",
  };
}

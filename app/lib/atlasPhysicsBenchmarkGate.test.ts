import { describe, expect, it } from "vitest";
import { ORBIT_ATLAS_SKY, ORBIT_ATLAS_V9_SKY } from "./orbitAtlasPresentation";
import {
  ATLAS_PHYSICS_BENCHMARK_BUDGET_PROFILE,
  ATLAS_PHYSICS_BENCHMARK_GATE_VERSION,
  classifyStrictUpperBound,
  createAtlasPhysicsBenchmarkGateSummary,
} from "./atlasPhysicsBenchmarkGate";
import type { HorizonsValidationRun } from "./simulationDiagnosticsTypes";

describe("v75 physics benchmark release gate", () => {
  it("is deterministic and keeps the runtime CI boundary explicit", () => {
    const first = createAtlasPhysicsBenchmarkGateSummary();
    const second = createAtlasPhysicsBenchmarkGateSummary();
    expect(first).toEqual(second);
    expect(first).toEqual(
      expect.objectContaining({
        version: ATLAS_PHYSICS_BENCHMARK_GATE_VERSION,
        budgetProfile: ATLAS_PHYSICS_BENCHMARK_BUDGET_PROFILE,
        runtimeStatus: "pending",
        resultCount: 9,
        passCount: 8,
        pendingCount: 1,
        failCount: 0,
        blockingCount: 0,
        ciCertificationStatus: "not-claimed-in-app",
        physicsMutation: "not-applied",
        skyAssetMutation: "not-applied",
        kerrKernelMutation: "not-applied",
      }),
    );
  });

  it("locks all fast benchmark ids, classifications, and blocking semantics", () => {
    const summary = createAtlasPhysicsBenchmarkGateSummary();
    expect(summary.results.map((result) => result.id)).toEqual([
      "mercury-perihelion-anchor",
      "solar-limb-deflection-anchor",
      "shapiro-fixed-state-regression",
      "weak-field-clock-rate",
      "rk4-timestep-convergence",
      "rk4-time-reversal",
      "schwarzschild-kerr-analytic-anchors",
      "kerr-hamiltonian-drift",
      "horizons-ten-year-eih-1pn",
    ]);
    expect(summary.results.every((result) => result.blocking)).toBe(true);
    expect(
      summary.results.find((result) => result.id === "shapiro-fixed-state-regression")
        ?.classification,
    ).toBe("formula-regression");
    expect(
      summary.results.find((result) => result.id === "kerr-hamiltonian-drift")
        ?.classification,
    ).toBe("numerical-health");
  });

  it("uses strict upper bounds and rejects invalid values", () => {
    expect(classifyStrictUpperBound(0.99, 1)).toBe("pass");
    expect(classifyStrictUpperBound(1, 1)).toBe("fail");
    expect(classifyStrictUpperBound(Number.NaN, 1)).toBe("fail");
    expect(classifyStrictUpperBound(null, 1)).toBe("fail");
  });

  it("turns failed or malformed Horizons runs into blocking failures", () => {
    const failed = createAtlasPhysicsBenchmarkGateSummary({
      status: "failed",
      progress: 1,
      source: "JPL Horizons API",
      modes: [],
      error: "fixture failure",
    });
    expect(failed.runtimeStatus).toBe("fail");
    expect(failed.blockingCount).toBe(1);

    const malformed = createAtlasPhysicsBenchmarkGateSummary({
      status: "complete",
      progress: 1,
      source: "JPL Horizons API",
      modes: [],
    } as HorizonsValidationRun);
    expect(malformed.runtimeStatus).toBe("fail");
    expect(malformed.results.at(-1)?.status).toBe("fail");
  });

  it("preserves the legacy v9 sky lock", () => {
    expect(ORBIT_ATLAS_SKY).toBe(ORBIT_ATLAS_V9_SKY);
    expect(ORBIT_ATLAS_V9_SKY.rotation).toEqual([-0.34, 4.24, -0.86]);
  });
});

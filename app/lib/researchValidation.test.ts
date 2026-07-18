import { describe, expect, it } from "vitest";
import {
  MERCURY_PRECESSION_TARGET_ARCSEC_PER_CENTURY,
  createHorizonsComparisonCheckpoints,
  createMercuryPrecessionBenchmark,
  createResearchValidationSummary,
  mercuryPrecessionErrorPercent,
  researchConfidenceForDiagnostics,
} from "./researchValidation";

describe("research validation diagnostics", () => {
  it("reports the Mercury 1PN perihelion target and error percent", () => {
    expect(MERCURY_PRECESSION_TARGET_ARCSEC_PER_CENTURY).toBe(43);
    expect(mercuryPrecessionErrorPercent(43)).toBe(0);
    expect(mercuryPrecessionErrorPercent(40.85)).toBeCloseTo(5, 6);
    expect(createMercuryPrecessionBenchmark(43, "ok")).toEqual({
      initialState: "shared-newton-1pn",
      measuredArcsecPerCentury: 43,
      targetArcsecPerCentury: 43,
      errorPercent: 0,
      status: "ok",
    });
  });

  it("generates fixed Horizons comparison checkpoints", () => {
    const checkpoints = createHorizonsComparisonCheckpoints();
    expect(checkpoints.map((checkpoint) => checkpoint.label)).toEqual([
      "+30d",
      "+365d",
      "+10y",
    ]);
    expect(checkpoints.map((checkpoint) => checkpoint.offsetDays)).toEqual([
      30,
      365,
      3652.5,
    ]);
    for (const checkpoint of checkpoints) {
      expect(checkpoint.referenceSource).toBe("JPL Horizons");
      expect(checkpoint.available).toBe(false);
    }
  });

  it("classifies research confidence from conservation, Horizons RMS, and Mercury 1PN error", () => {
    expect(
      researchConfidenceForDiagnostics({
        mercuryPrecessionErrorPercent: null,
        horizonsRmsPositionKm: null,
        horizonsRmsVelocityMs: null,
        relEnergyDrift: 0,
        relAngMomDrift: 0,
      }),
    ).toBe("visual");
    expect(
      researchConfidenceForDiagnostics({
        mercuryPrecessionErrorPercent: 80,
        horizonsRmsPositionKm: 5e7,
        horizonsRmsVelocityMs: 20,
        relEnergyDrift: 1e-4,
        relAngMomDrift: 1e-4,
      }),
    ).toBe("diagnostic");
    expect(
      researchConfidenceForDiagnostics({
        mercuryPrecessionErrorPercent: 3,
        horizonsRmsPositionKm: 2e5,
        horizonsRmsVelocityMs: 2,
        relEnergyDrift: 1e-5,
        relAngMomDrift: 1e-5,
      }),
    ).toBe("validated");
  });

  it("keeps Orbit Atlas source semantics explicit in the validation summary", () => {
    const summary = createResearchValidationSummary({
      mercuryArcsecPerCentury: 42,
      mercuryStatus: "sampled",
      relEnergyDrift: 1e-6,
      relAngMomDrift: 2e-6,
      pnAccelFraction: 3e-8,
    });
    expect(summary.sourceSemantics).toEqual({
      atlasOrbits: "presentation-layer",
      referenceOrbit: "static-j2000-visual-guide",
      liveValues: "n-body-state-diagnostics",
    });
    expect(summary.conservation.pnAccelFraction).toBe(3e-8);
    expect(summary.mercuryPrecession.errorPercent).toBeGreaterThan(0);
  });
});

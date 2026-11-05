import { describe, expect, it } from "vitest";
import {
  createGaiaCovarianceDiagnosticsV271,
  deriveGaiaResearchAnalysisFlagsV271,
  isFullGaiaResearchFilterV271,
  parseGaiaResearchQueryV271,
  propagateGaiaProperMotionEpochV271,
} from "./gaiaResearchWorkbenchV271";
import type { GaiaScienceRecordV8 } from "./gaiaScienceV8";

function record(overrides: Partial<GaiaScienceRecordV8> = {}): GaiaScienceRecordV8 {
  return {
    sourceId: "4267180339403392768",
    raDeg: 286.7169,
    decDeg: 0.2762,
    raErrorMas: 0.0279,
    decErrorMas: 0.0265,
    parallaxMas: 1.0849,
    parallaxErrorMas: 0.0334,
    pmRaMasYr: 2.549,
    pmRaErrorMasYr: 0.0304,
    pmDecMasYr: -4.0755,
    pmDecErrorMasYr: 0.0262,
    correlations: [0.19, -0.28, -0.19, -0.04, -0.43, 0.03, -0.21, -0.13, 0.07, 0.01],
    radialVelocityKmS: 12,
    radialVelocityErrorKmS: 0.4,
    photGMeanFlux: 15_041,
    photGMeanFluxError: 5.69,
    photBpMeanFlux: 5_735,
    photBpMeanFluxError: 15.4,
    photRpMeanFlux: 13_526,
    photRpMeanFluxError: 14.3,
    photGMeanMag: 15.244,
    bpRp: 1.522,
    ruwe: 1.03,
    visibilityPeriodsUsed: 15,
    astrometricParamsSolved: 31,
    duplicatedSource: false,
    photBpRpExcessFactor: 1.28,
    healpixOrder5: 42,
    qualityTier: "gold",
    solutionType: "five-parameter",
    ...overrides,
  };
}

describe("v271 Gaia Research Workbench 2.0", () => {
  it("canonicalizes quality order and defaults selection to the Gaia-id mother population", () => {
    const query = parseGaiaResearchQueryV271({
      kind: "selection",
      order: 5,
      filters: { qualityTiers: ["silver", "gold"] },
    });
    expect(query).toMatchObject({ kind: "selection", order: 5, population: "v7-gaia-id" });
    expect(query.filters.qualityTiers).toEqual(["gold", "silver"]);
    expect(() => parseGaiaResearchQueryV271({ kind: "overview", population: "v7-presentation" })).toThrow();
    expect(() => parseGaiaResearchQueryV271({ kind: "selection", order: 3, population: "survey-completeness" })).toThrow();
  });

  it("distinguishes the complete frozen density filter from filtered selection-domain queries", () => {
    const full = parseGaiaResearchQueryV271({ kind: "healpix-density", order: 3 });
    expect(isFullGaiaResearchFilterV271(full.filters)).toBe(true);
    const filtered = parseGaiaResearchQueryV271({ kind: "healpix-density", order: 3, filters: { ruweMax: 1.4 } });
    expect(isFullGaiaResearchFilterV271(filtered.filters)).toBe(false);
  });

  it("adds derived flags without reclassifying the frozen quality tier", () => {
    const flags = deriveGaiaResearchAnalysisFlagsV271(record());
    expect(flags).toMatchObject({ positiveParallax: true, distanceUsable: true, nonDuplicated: true, radialVelocityWithError: true });
    expect(flags.boundary).toContain("do-not-reclassify");
    expect(deriveGaiaResearchAnalysisFlagsV271(record({ parallaxMas: -1 })).distanceUsable).toBe(false);
  });

  it("reports symmetric covariance eigen diagnostics and deterministic tangent-plane epoch propagation", () => {
    const diagnostics = createGaiaCovarianceDiagnosticsV271(record());
    expect(diagnostics.correlation).toHaveLength(5);
    expect(diagnostics.eigenvalues).toHaveLength(5);
    expect(diagnostics.eigenvalues.every(Number.isFinite)).toBe(true);
    expect(diagnostics.positiveSemidefinite).toBe(true);
    const propagated = propagateGaiaProperMotionEpochV271(record(), 2026, 2016);
    expect(propagated.raDeg).not.toBe(record().raDeg);
    expect(propagated.decDeg).not.toBe(record().decDeg);
    expect(propagated.boundary).toContain("not-orbit-physics");
  });
});

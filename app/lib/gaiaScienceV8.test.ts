import { describe, expect, it } from "vitest";
import {
  analyzeGaiaScienceRecordV8,
  atlasSubsetInclusionFractionV1,
  evaluateGaiaSurveyCompletenessV1,
  reconstructGaiaAstrometricCovarianceV1,
  type GaiaScienceRecordV8,
} from "./gaiaScienceV8";

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
    radialVelocityKmS: null,
    radialVelocityErrorKmS: null,
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

describe("v259 Gaia science analysis", () => {
  it("reconstructs a symmetric positive-semidefinite 5x5 covariance", () => {
    const covariance = reconstructGaiaAstrometricCovarianceV1(record());
    expect(covariance.matrix).toHaveLength(5);
    expect(covariance.positiveSemidefinite).toBe(true);
    expect(covariance.matrix[0]![2]).toBe(covariance.matrix[2]![0]);
  });

  it("repeats fixed-seed 4096-sample Monte Carlo exactly and stays 5D without RV", () => {
    const first = analyzeGaiaScienceRecordV8(record());
    expect(analyzeGaiaScienceRecordV8(record())).toEqual(first);
    expect(first.monteCarlo.samples).toBe(4_096);
    expect(first.dimension).toBe(5);
    expect(first.radialVelocity).toBeNull();
    expect(first.distanceReliable).toBe(true);
    expect(first.monteCarlo.distancePc).not.toBeNull();
  });

  it("refuses reliable distance inversion for low-SNR or negative parallax", () => {
    const result = analyzeGaiaScienceRecordV8(record({ parallaxMas: -0.1, parallaxErrorMas: 0.2, qualityTier: "silver" }));
    expect(result.distanceReliable).toBe(false);
    expect(result.firstOrder.distancePc).toBeNull();
    expect(result.monteCarlo.distancePc).toBeNull();
  });

  it("keeps Atlas selection and Gaia survey completeness as separate functions", () => {
    expect(atlasSubsetInclusionFractionV1(2, 10)).toBe(0.2);
    const summary = {
      version: "v259-gaiaunlimited-dr3-selection-tcg-v1" as const,
      model: "GaiaUnlimited.DR3SelectionFunctionTCG" as const,
      modelVersion: "0.3.2",
      validMagnitudeRange: [5, 20] as const,
      valuesByHealpixAndMagnitude: { "42:15.0": 0.91 },
      canonical: true as const,
      boundary: "empirical-gaia-survey-model-valid-only-in-published-domain" as const,
    };
    expect(evaluateGaiaSurveyCompletenessV1(summary, 42, 15)).toEqual({ status: "available", value: 0.91 });
    expect(evaluateGaiaSurveyCompletenessV1(summary, 42, 22)).toEqual({ status: "unavailable", reason: "outside-model-magnitude-domain" });
  });
});

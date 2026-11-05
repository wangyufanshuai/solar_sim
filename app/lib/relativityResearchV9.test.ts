import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  RELATIVITY_SCIENCE_ASSETS_V9,
  classifyRelativityRegressionV9,
  computeJointUncertaintyV9,
  createRelativityObservableReportV9,
  eclipticToIcrfJ2000V9,
  horizonsSunCenteredEclipticToBarycentricIcrfV9,
  icrfJ2000ToEclipticV9,
} from "./relativityResearchV9";

describe("relativity research contract v9", () => {
  it("round-trips the frozen J2000 ecliptic frame", () => {
    const vector = [1.25, -2.5, 4.75] as const;
    const equatorial = eclipticToIcrfJ2000V9(vector);
    const roundTrip = icrfJ2000ToEclipticV9(equatorial);
    expect(roundTrip[0]).toBeCloseTo(vector[0], 12);
    expect(roundTrip[1]).toBeCloseTo(vector[1], 12);
    expect(roundTrip[2]).toBeCloseTo(vector[2], 12);
  });

  it("translates a geometric sun-centered state without losing the explicit frame", () => {
    const result = horizonsSunCenteredEclipticToBarycentricIcrfV9(
      {
        positionKm: [0, 1, 0],
        velocityKmPerDay: [0, 0, 1],
        frame: "J2000-ecliptic-sun-centered",
        timeScale: "TDB",
      },
      { positionKm: [10, 20, 30], velocityKmPerDay: [1, 2, 3] },
    );
    expect(result.frame).toBe("ICRF-J2000-barycentric");
    expect(result.timeScale).toBe("TDB");
    expect(result.positionKm[0]).toBeCloseTo(10, 12);
    expect(result.positionKm[1]).toBeGreaterThan(20);
    expect(result.positionKm[2]).toBeGreaterThan(30);
  });

  it("uses a conservative additive joint uncertainty", () => {
    expect(computeJointUncertaintyV9(0.1, 0.2, 0.3)).toBeCloseTo(0.6, 12);
    expect(() => computeJointUncertaintyV9(-1, 0, 0)).toThrow(RangeError);
  });

  it("fails closed for provenance, and otherwise reports a resolved cause", () => {
    expect(classifyRelativityRegressionV9({
      delta: 1,
      uncertainty: 0.01,
      jointUncertainty: 0.02,
      solverAgreement: true,
      provenanceReady: false,
      candidateEffectEvidence: true,
    })).toEqual({ attribution: "unresolved", resolved: false });
    expect(classifyRelativityRegressionV9({
      delta: 1,
      uncertainty: 0.01,
      jointUncertainty: 0.02,
      solverAgreement: false,
      provenanceReady: true,
      candidateEffectEvidence: true,
    })).toEqual({ attribution: "solver-implementation", resolved: true });
    expect(classifyRelativityRegressionV9({
      delta: 0.001,
      uncertainty: 0.01,
      jointUncertainty: 0.02,
      solverAgreement: true,
      provenanceReady: true,
      candidateEffectEvidence: true,
    })).toEqual({ attribution: "unresolved", resolved: false });
    expect(classifyRelativityRegressionV9({
      delta: 1,
      uncertainty: 0.01,
      jointUncertainty: 0.02,
      solverAgreement: true,
      provenanceReady: true,
      candidateEffectEvidence: true,
      referenceDegradationConfirmed: true,
    })).toEqual({ attribution: "cross-solver-regression-confirmed", resolved: true });
  });

  it("creates observable-only evidence without runtime mutation", () => {
    const report = createRelativityObservableReportV9({
      solarGmKm3PerS2: 1.3271244004127942e11,
      impactParameterKm: 1.5e8,
      emitterDistanceKm: 1.5e8,
      receiverDistanceKm: 2.2e8,
      linkSeparationKm: 3.7e8,
      radiusKm: 7e5,
      semiMajorAxisKm: 5.79e7,
      eccentricity: 0.2056,
      solarSpinAngularMomentumKgM2PerSecond: 1.92e41,
    });
    expect(report.boundary).toBe("observable-only-no-nbody-state-mutation");
    expect(report.shapiroDelaySeconds).toBeGreaterThan(0);
    expect(report.perihelionAdvanceRadPerOrbit).toBeGreaterThan(0);
  });

  it("matches the checksummed local NAIF cache", () => {
    for (const asset of RELATIVITY_SCIENCE_ASSETS_V9) {
      const bytes = readFileSync(asset.relativePath);
      const digest = createHash("sha256").update(bytes).digest("hex");
      expect(digest, asset.id).toBe(asset.sha256);
    }
  });
});

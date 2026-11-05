import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { KERR_POLARIMETER_INVERSION_FIXTURE_V412, canonicalShaV412, createKerrPolarimeterInversionSummaryV412, parseKerrPolarimeterInversionArtifactV412, solveKerrPolarimeterInversionV412 } from "./kerrPolarimeterInversionV412";

describe("v412 generalized Mueller inversion", () => {
  it("recovers full Stokes and propagates measurement and calibration covariance separately", () => {
    const result = solveKerrPolarimeterInversionV412(KERR_POLARIMETER_INVERSION_FIXTURE_V412);
    expect(result.reconstructedStokes).toEqual(expect.arrayContaining([expect.closeTo(1, 12), expect.closeTo(0.08, 12), expect.closeTo(-0.05, 12), expect.closeTo(0.01, 12)]));
    expect(result).toMatchObject({ status: "qualified-test-fixture-only", measuredAuthorityGranted: false, publishable: false, conditionNumberDefinition: "matrix-one-norm-times-inverse-one-norm", uncertaintyCombination: "measurement-and-calibration-covariances-kept-separate-no-independence-claim" });
    expect(result.metrics).toMatchObject({ responseInverseResidualMaximum: expect.any(Number), weightedDirectDifferenceMaximum: expect.any(Number), calibrationJacobianFiniteDifferenceMaximum: expect.any(Number) });
    expect(result.metrics.responseInverseResidualMaximum).toBeLessThan(1e-12);
    expect(result.metrics.calibrationJacobianFiniteDifferenceMaximum).toBeLessThan(1e-8);
  });
  it("rejects singular response and non-positive observation covariance", () => {
    expect(() => solveKerrPolarimeterInversionV412({ ...KERR_POLARIMETER_INVERSION_FIXTURE_V412, responseMatrix: Array.from({ length: 4 }, () => [1, 0, 0, 0]) })).toThrow();
    expect(() => solveKerrPolarimeterInversionV412({ ...KERR_POLARIMETER_INVERSION_FIXTURE_V412, observationCovariance: Array.from({ length: 4 }, (_, row) => Array.from({ length: 4 }, (_, column) => row === column ? -1 : 0)) })).toThrow("v412-input-covariance");
  });
  it("parses the independent-oracle artifact and keeps matrices out of the summary", () => {
    const artifact = JSON.parse(readFileSync("dist/science/kerr-polarimeter-inversion-v412/generalized-inversion.json", "utf8"));
    expect(parseKerrPolarimeterInversionArtifactV412(artifact)).toBe(artifact);
    expect(canonicalShaV412(artifact)).toBe(artifact.artifactSha256);
    const summary = createKerrPolarimeterInversionSummaryV412(artifact);
    expect(summary).toMatchObject({ fixtureQualification: "qualified-test-fixture-only", measuredCalibrationPackPresent: false, measuredAuthorityGranted: false });
    expect(summary).not.toHaveProperty("result");
    expect(summary).not.toHaveProperty("reconstructedStokes");
  });
});

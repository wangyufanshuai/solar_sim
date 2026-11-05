import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canonicalShaV430,
  computeKerrHighEnergyCountLikelihoodV430,
  createKerrHighEnergyCountLikelihoodSummaryV430,
  createKerrHighEnergyCountLikelihoodViewV430,
  parseKerrHighEnergyCountLikelihoodArtifactV430,
  parseKerrHighEnergyCountLikelihoodOracleV430,
  type KerrHighEnergyCountLikelihoodContractV430,
} from "./kerrHighEnergyCountLikelihoodV430";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));

describe("v430 high-energy count likelihood", () => {
  it("cross-validates Poisson, residual, whitening and closure mathematics", () => {
    const oracle = parseKerrHighEnergyCountLikelihoodOracleV430(read("dist/science/kerr-high-energy-count-likelihood-v430/count-likelihood-oracle.json"));
    const result = computeKerrHighEnergyCountLikelihoodV430(oracle);
    expect(result.rawResidual).toHaveLength(24);
    expect(result.whitenedResidual).toHaveLength(24);
    expect(result.angleClosureZ).toHaveLength(4);
    expect(result.channelClosureZ).toHaveLength(6);
    expect(result.metrics.maximumMahalanobisIdentityDifference).toBeLessThan(1e-8);
    expect(result.metrics.minimumPredictiveCovarianceEigenvalue).toBeGreaterThan(0);
    expect(result.metrics.effectiveCovarianceRank).toBe(24);
    expect(result.maximumPythonRelativeDifference).toBeLessThan(1e-8);
    const contract = read("dist/science/kerr-high-energy-count-likelihood-v430/likelihood-contract.json") as KerrHighEnergyCountLikelihoodContractV430;
    expect(createKerrHighEnergyCountLikelihoodViewV430(oracle, contract).counts).toMatchObject({ measuredObservedCountCount: 0, measuredHoldoutDatasetCount: 0, measuredResidualMetricCount: 0, measuredValidationRunCount: 0, measuredResponseAuthorityCount: 0, scienceResponseApplicationCount: 0 });
  });

  it("publishes math authority without fixture goodness-of-fit or detector authority", () => {
    const artifact = parseKerrHighEnergyCountLikelihoodArtifactV430(read("dist/science/kerr-high-energy-count-likelihood-v430/count-likelihood.json"));
    expect(canonicalShaV430(artifact)).toBe(artifact.artifactSha256);
    expect(artifact.view.authorityBoundary).toMatchObject({ likelihoodMathAuthorityGranted: true, residualMathAuthorityGranted: true, whiteningMathAuthorityGranted: true, fixtureGoodnessOfFitAuthorityGranted: false, measuredLikelihoodAuthorityGranted: false, measuredResidualClosureAuthorityGranted: false, measuredResponseAuthorityGranted: false, scienceProjectionAuthorityGranted: false, detectorAuthorityGranted: false, denseAuthorityGranted: false });
    const summary = createKerrHighEnergyCountLikelihoodSummaryV430(artifact);
    expect(summary).not.toHaveProperty("simulatedCounts");
    expect(summary).not.toHaveProperty("whitenedResidual");
  });
});

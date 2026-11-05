import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { canonicalShaV429, computeKerrHighEnergyResponseUncertaintyV429, createKerrHighEnergyResponseUncertaintySummaryV429, createKerrHighEnergyResponseUncertaintyViewV429, parseKerrHighEnergyResponseUncertaintyArtifactV429, parseKerrHighEnergyResponseUncertaintyOracleV429, type KerrHighEnergyResponseValidationProtocolV429 } from "./kerrHighEnergyResponseUncertaintyV429";
const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
describe("v429 high-energy response uncertainty", () => {
  it("cross-validates analytic Jacobians and full covariance without observed counts", () => {
    const oracle = parseKerrHighEnergyResponseUncertaintyOracleV429(read("dist/science/kerr-high-energy-response-uncertainty-v429/uncertainty-oracle.json"));
    const computation = computeKerrHighEnergyResponseUncertaintyV429(oracle.fixture, oracle.expected);
    expect(computation.predictedCounts).toHaveLength(24);
    expect(computation.parameterJacobian).toHaveLength(24);
    expect(computation.redistributionJacobians).toHaveLength(6);
    expect(computation.totalCovariance).toHaveLength(24);
    expect(computation.metrics.maximumPythonRelativeDifference).toBeLessThan(1e-12);
    const protocol = read("dist/science/kerr-high-energy-response-uncertainty-v429/independent-validation-protocol.json") as KerrHighEnergyResponseValidationProtocolV429;
    expect(createKerrHighEnergyResponseUncertaintyViewV429(oracle, protocol).counts).toMatchObject({ fixturePredictionCount: 24, observedCountCount: 0, measuredHoldoutDatasetCount: 0, measuredValidationRunCount: 0, residualMetricCount: 0, measuredResponseAuthorityCount: 0, scienceResponseApplicationCount: 0 });
  });
  it("publishes mathematical authority without measured response or residual authority", () => {
    const artifact = parseKerrHighEnergyResponseUncertaintyArtifactV429(read("dist/science/kerr-high-energy-response-uncertainty-v429/response-uncertainty.json"));
    expect(canonicalShaV429(artifact)).toBe(artifact.artifactSha256);
    expect(artifact.view.authorityBoundary).toMatchObject({ forwardOperatorAuthorityGranted: true, analyticJacobianAuthorityGranted: true, covariancePropagationAuthorityGranted: true, fixturePerformanceAuthorityGranted: false, measuredResponseValidationGranted: false, measuredResponseAuthorityGranted: false, residualClosureAuthorityGranted: false });
    const summary = createKerrHighEnergyResponseUncertaintySummaryV429(artifact);
    expect(summary).not.toHaveProperty("parameterJacobian");
    expect(summary).not.toHaveProperty("totalCovariance");
  });
});

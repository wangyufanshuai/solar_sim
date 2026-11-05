import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { canonicalShaV431, computeKerrLikelihoodStressMetricsV431, createKerrHighEnergyLikelihoodStressSummaryV431, createKerrHighEnergyLikelihoodStressViewV431, parseKerrHighEnergyLikelihoodStressArtifactV431, parseKerrHighEnergyLikelihoodStressOracleV431, type KerrHighEnergyLikelihoodStressContractV431 } from "./kerrHighEnergyLikelihoodStressV431";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));

describe("v431 likelihood stress campaign", () => {
  it("cross-validates six fixed-seed synthetic holdouts and provenance-first routing", () => {
    const oracle = parseKerrHighEnergyLikelihoodStressOracleV431(read("dist/science/kerr-high-energy-likelihood-stress-v431/likelihood-stress-oracle.json"));
    const contract = read("dist/science/kerr-high-energy-likelihood-stress-v431/likelihood-stress-contract.json") as KerrHighEnergyLikelihoodStressContractV431;
    const view = createKerrHighEnergyLikelihoodStressViewV431(oracle, contract);
    expect(view.scenarios).toHaveLength(6);
    expect(view.scenarios.filter((scenario) => scenario.expectedPoissonDisposition === "retain")).toHaveLength(1);
    expect(view.scenarios.filter((scenario) => scenario.expectedPoissonDisposition === "reject-before-fit")).toHaveLength(5);
    expect(Math.max(...view.scenarios.map((scenario) => scenario.maximumPythonRelativeDifference))).toBeLessThan(1e-8);
    expect(view.selection).toMatchObject({ postHocLikelihoodSwitchForbidden: true, residualDiagnosticsMayAuditButNeverSelectFamily: true, alternativeLikelihoodImplementationsQualified: 0 });
    const nominal = oracle.campaign.results[0];
    expect(computeKerrLikelihoodStressMetricsV431(nominal.holdoutCounts, oracle.prediction.predictedCounts, oracle.prediction.totalPredictiveCovariance, oracle.prediction.poissonPredictiveLower90, oracle.prediction.poissonPredictiveUpper90).poissonPredictiveCoverage90).toBeGreaterThan(0.88);
  });

  it("publishes discriminator authority without alternative-likelihood or instrument authority", () => {
    const artifact = parseKerrHighEnergyLikelihoodStressArtifactV431(read("dist/science/kerr-high-energy-likelihood-stress-v431/likelihood-stress.json"));
    expect(canonicalShaV431(artifact)).toBe(artifact.artifactSha256);
    expect(artifact.view.authorityBoundary).toMatchObject({ stressGenerationMathAuthorityGranted: true, discriminatorMathAuthorityGranted: true, preregisteredRoutingFirewallAuthorityGranted: true, nominalPoissonRecoveryAuthorityGranted: true, alternativeLikelihoodImplementationAuthorityGranted: false, fixturePerformanceAuthorityGranted: false, measuredLikelihoodAuthorityGranted: false, measuredInstrumentPerformanceAuthorityGranted: false, measuredResponseAuthorityGranted: false, scienceProjectionAuthorityGranted: false, denseAuthorityGranted: false });
    const summary = createKerrHighEnergyLikelihoodStressSummaryV431(artifact);
    expect(summary).not.toHaveProperty("holdoutCounts");
    expect(summary).not.toHaveProperty("totalPredictiveCovariance");
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { canonicalShaV432, createKerrHighEnergyLikelihoodAuthoritySummaryV432, createKerrHighEnergyLikelihoodAuthorityViewV432, parseKerrHighEnergyLikelihoodAuthorityArtifactV432, parseKerrHighEnergyLikelihoodAuthorityOracleV432, type KerrHighEnergyLikelihoodAuthorityContractV432 } from "./kerrHighEnergyLikelihoodAuthorityV432";
const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
describe("v432 alternative likelihood authority", () => {
  it("recovers NB and shared-latent PLN parameters and selects on independent holdout", () => {
    const oracle = parseKerrHighEnergyLikelihoodAuthorityOracleV432(read("dist/science/kerr-high-energy-likelihood-authority-v432/likelihood-authority-oracle.json"));
    const contract = read("dist/science/kerr-high-energy-likelihood-authority-v432/likelihood-authority-contract.json") as KerrHighEnergyLikelihoodAuthorityContractV432;
    const view = createKerrHighEnergyLikelihoodAuthorityViewV432(oracle, contract);
    expect(view.families).toHaveLength(2);
    expect(view.families.every((family) => family.correctCandidate.relativeParameterError < 0.15 && family.correctCandidate.coverage90 >= 0.87 && family.correctCandidate.coverage90 <= 0.93)).toBe(true);
    expect(view.families.every((family) => family.selectionDeltaLogLikelihood > 20)).toBe(true);
    expect(view.selection).toMatchObject({ selectionBeforeScienceUse: true, postHocLikelihoodSwitchForbidden: true, negativeBinomialQualified: true, poissonLognormalQualified: true, measuredAuthority: false });
  });
  it("publishes alternative math authority without measured instrument authority", () => {
    const artifact = parseKerrHighEnergyLikelihoodAuthorityArtifactV432(read("dist/science/kerr-high-energy-likelihood-authority-v432/likelihood-authority.json"));
    expect(canonicalShaV432(artifact)).toBe(artifact.artifactSha256);
    expect(artifact.view.authorityBoundary).toMatchObject({ negativeBinomialMathAuthorityGranted: true, poissonLognormalMathAuthorityGranted: true, parameterRecoveryAuthorityGranted: true, coverageAuthorityGranted: true, holdoutSelectionAuthorityGranted: true, alternativeLikelihoodImplementationAuthorityGranted: true, fixturePerformanceAuthorityGranted: false, measuredLikelihoodAuthorityGranted: false, measuredInstrumentPerformanceAuthorityGranted: false, measuredResponseAuthorityGranted: false, scienceProjectionAuthorityGranted: false, denseAuthorityGranted: false });
    expect(createKerrHighEnergyLikelihoodAuthoritySummaryV432(artifact)).not.toHaveProperty("holdoutCounts");
  });
});

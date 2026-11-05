import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canonicalShaV433,
  createKerrHighEnergyJointNuisanceSummaryV433,
  createKerrHighEnergyJointNuisanceViewV433,
  parseKerrHighEnergyJointNuisanceArtifactV433,
  parseKerrHighEnergyJointNuisanceOracleV433,
  type KerrHighEnergyJointNuisanceContractV433,
  type KerrJointNuisanceResponseSourceV433,
} from "./kerrHighEnergyJointNuisanceV433";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));

describe("v433 joint response and likelihood nuisance authority", () => {
  it("reconstructs two positive-definite joint covariance families", () => {
    const oracle = parseKerrHighEnergyJointNuisanceOracleV433(read("dist/science/kerr-high-energy-joint-nuisance-v433/joint-nuisance-oracle.json"));
    const contract = read("dist/science/kerr-high-energy-joint-nuisance-v433/joint-nuisance-contract.json") as KerrHighEnergyJointNuisanceContractV433;
    const response = read("dist/science/kerr-high-energy-response-uncertainty-v429/uncertainty-oracle.json").expected as KerrJointNuisanceResponseSourceV433;
    const view = createKerrHighEnergyJointNuisanceViewV433(oracle, contract, response);
    expect(view.families).toHaveLength(2);
    expect(view.families.every((family) => family.metrics.jointMinimumEigenvalue > 0 && family.metrics.jointEffectiveRank === 24)).toBe(true);
    expect(view.families.every((family) => family.monteCarlo.metrics.relativeFrobeniusCovarianceDifference < 0.08)).toBe(true);
    expect(view.model).toMatchObject({ responseLikelihoodIndependentBySyntheticConstruction: true, measuredCrossBlockIndependenceAvailable: false, scienceAdmission: "not-admitted-no-measured-response-or-likelihood-authority" });
  });

  it("publishes an immutable boundary without admitting Science use", () => {
    const artifact = parseKerrHighEnergyJointNuisanceArtifactV433(read("dist/science/kerr-high-energy-joint-nuisance-v433/joint-nuisance.json"));
    expect(canonicalShaV433(artifact)).toBe(artifact.artifactSha256);
    expect(artifact.scienceBoundary).toMatchObject({ status: "implemented-not-admitted", admitted: false, scienceResponseApplicationCount: 0 });
    expect(artifact.view.authorityBoundary).toMatchObject({ jointNuisanceAnalyticMathAuthorityGranted: true, monteCarloCrossValidationAuthorityGranted: true, measuredCrossBlockIndependenceAuthorityGranted: false, measuredResponseAuthorityGranted: false, measuredLikelihoodAuthorityGranted: false, scienceAdmissionGranted: false, scienceResponseApplicationCount: 0, denseAuthorityGranted: false });
    const summary = createKerrHighEnergyJointNuisanceSummaryV433(artifact);
    expect(summary).not.toHaveProperty("jointCovariance");
    expect(JSON.stringify(summary)).not.toContain("empiricalJointCovariance");
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canonicalShaV434,
  createKerrMeasuredAdmissionSummaryV434,
  createKerrMeasuredAdmissionViewV434,
  parseKerrMeasuredAdmissionArtifactV434,
  parseKerrMeasuredAdmissionOracleV434,
  validateKerrHighEnergyMeasuredAuthorityPackV434,
  type KerrMeasuredAdmissionContractV434,
  type KerrMeasuredAdmissionPackV434,
} from "./kerrHighEnergyMeasuredAdmissionV434";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));

describe("v434 measured authority admission firewall", () => {
  it("cross-validates the fixture and rejects all twelve mutations", () => {
    const oracle = parseKerrMeasuredAdmissionOracleV434(read("dist/science/kerr-high-energy-measured-admission-v434/measured-admission-oracle.json"));
    const contract = read("dist/science/kerr-high-energy-measured-admission-v434/measured-admission-contract.json") as KerrMeasuredAdmissionContractV434;
    const view = createKerrMeasuredAdmissionViewV434(oracle, contract);
    expect(validateKerrHighEnergyMeasuredAuthorityPackV434(oracle.fixture)).toMatchObject({ valid: true, measuredEligible: false, scienceAdmissionGranted: false });
    expect(view.fixture).toMatchObject({ structurallyValid: true, measuredEligible: false, mutationCount: 12, rejectedMutationCount: 12, maximumPythonTypeScriptDifference: 0 });
    expect(oracle.mutationResults.every((mutation) => mutation.rejected && mutation.errors.length > 0)).toBe(true);
  });

  it("treats a structurally eligible measured candidate as pending, never admitted", () => {
    const fixture = read("dist/science/kerr-high-energy-measured-admission-v434/measured-admission-fixture.json") as KerrMeasuredAdmissionPackV434;
    const candidate = { ...fixture, sourceKind: "measured-authority-candidate" as const, measuredAttestation: "real-measured-response-likelihood-and-independent-holdout-not-synthetic-or-example" };
    expect(validateKerrHighEnergyMeasuredAuthorityPackV434(candidate)).toMatchObject({ valid: true, measuredEligible: true, scienceAdmissionGranted: false, errors: [] });
    const overlap = { ...candidate, independentHoldout: { ...candidate.independentHoldout, sourceIds: [...candidate.likelihoodFit.sourceIds] } };
    expect(validateKerrHighEnergyMeasuredAuthorityPackV434(overlap)).toMatchObject({ valid: false, measuredEligible: false, scienceAdmissionGranted: false });
  });

  it("publishes a blocked admission boundary with zero Science applications", () => {
    const artifact = parseKerrMeasuredAdmissionArtifactV434(read("dist/science/kerr-high-energy-measured-admission-v434/measured-admission.json"));
    expect(canonicalShaV434(artifact)).toBe(artifact.artifactSha256);
    expect(artifact.view.authorityBoundary).toMatchObject({ packSchemaAuthorityGranted: true, provenanceFirewallAuthorityGranted: true, disjointnessValidatorAuthorityGranted: true, preregistrationValidatorAuthorityGranted: true, crossBlockIndependenceValidatorAuthorityGranted: true, measuredPackPresent: false, measuredResponseAuthorityGranted: false, measuredLikelihoodAuthorityGranted: false, independentMeasuredHoldoutQualified: false, independentReviewQualified: false, scienceAdmissionGranted: false, scienceResponseApplicationCount: 0 });
    expect(artifact.view.scienceBoundary).toMatchObject({ status: "blocked-no-measured-authority-pack", admitted: false, scienceResponseApplicationCount: 0 });
    const summary = createKerrMeasuredAdmissionSummaryV434(artifact);
    expect(summary).not.toHaveProperty("identity");
    expect(JSON.stringify(summary)).not.toContain("rawEventFileSha256");
  });
});

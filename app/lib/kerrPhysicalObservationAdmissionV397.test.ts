import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createKerrPhysicalObservationAdversarialFixturesV397,
  createKerrPhysicalObservationControlFixtureV397,
  parseKerrPhysicalObservationAdmissionArtifactV397,
  validateKerrPhysicalObservationPackV397,
} from "./kerrPhysicalObservationAdmissionV397";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const transfer = () => read("dist/science/kerr-temperature-systematics-transfer-v390/transfer-operator.json");
const sourceAdmission = () => read("dist/science/kerr-covariance-source-admission-v393/source-admission.json");
const constraint = () => read("dist/science/kerr-auxiliary-constraint-design-v396/constraint-design.json");

describe("v397 physical observation admission", () => {
  it("admits the synthetic control for validation only", () => {
    const fixture = createKerrPhysicalObservationControlFixtureV397(
      transfer(),
      sourceAdmission(),
      constraint().artifactSha256,
    );
    const result = validateKerrPhysicalObservationPackV397(
      fixture,
      transfer(),
      sourceAdmission(),
      constraint().artifactSha256,
    );
    expect(result).toMatchObject({
      status: "admitted-validation-only",
      publicationAllowed: false,
      sourceCount: 3,
      crossLinkCount: 3,
      checkedRowCount: 36,
    });
  });

  it("rejects all pre-registered provenance and covariance attacks", () => {
    const fixtures = createKerrPhysicalObservationAdversarialFixturesV397(
      transfer(),
      sourceAdmission(),
      constraint().artifactSha256,
    );
    expect(fixtures).toHaveLength(9);
    for (const fixture of fixtures) {
      const result = validateKerrPhysicalObservationPackV397(
        fixture.value,
        transfer(),
        sourceAdmission(),
        constraint().artifactSha256,
      );
      expect(result.status, fixture.id).toBe("rejected");
      expect(result.rejectionReasons, fixture.id).toContain(fixture.expectedReason);
    }
  });

  it("keeps the production observation pack unavailable", () => {
    const artifact = read("dist/science/kerr-physical-observation-admission-v397/observation-admission.json");
    expect(parseKerrPhysicalObservationAdmissionArtifactV397(artifact)).toBe(artifact);
    expect(artifact.selfTest.maximumPythonOracleRelativeDifference).toBe(0);
    expect(artifact.productionAdmission).toMatchObject({
      physicalObservationPackAvailable: false,
      availableSources: 0,
      availableCrossLinks: 0,
      sourceLicenseVerified: false,
      covariancePackBuilt: false,
      physicalConstraintSelectionExecuted: false,
      instrumentResponseAvailable: false,
    });
  });
});

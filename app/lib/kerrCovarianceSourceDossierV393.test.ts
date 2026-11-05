import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  assembleKerrCovariancePackFromDossierV393,
  createKerrCovarianceDossierAdversarialFixturesV393,
  createKerrCovarianceDossierControlFixtureV393,
  parseKerrCovarianceSourceAdmissionArtifactV393,
  validateKerrCovarianceSourceDossierV393,
  V393_ORACLE_RELATIVE_LIMIT,
} from "./kerrCovarianceSourceDossierV393";
import { validateKerrPhysicalCovariancePackV392 } from "./kerrPhysicalCovarianceAdmissionV392";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const transfer = () =>
  read(
    "dist/science/kerr-temperature-systematics-transfer-v390/transfer-operator.json",
  );
const admission = () =>
  read(
    "dist/science/kerr-physical-covariance-admission-v392/covariance-admission.json",
  );

describe("v393 covariance source dossier", () => {
  it("assembles three components and three correlations into an admitted validation pack", () => {
    const transferArtifact = transfer();
    const admissionArtifact = admission();
    const dossier = createKerrCovarianceDossierControlFixtureV393(
      transferArtifact,
      admissionArtifact,
    );
    expect(
      validateKerrCovarianceSourceDossierV393(
        dossier,
        transferArtifact,
        admissionArtifact,
      ),
    ).toMatchObject({
      status: "admitted-validation-only",
      packAssemblyAllowed: true,
      publicationAllowed: false,
      componentSourceCount: 3,
      crossSourceCount: 3,
      checkedComponentRowCount: 36,
      checkedCrossRowCount: 36,
      rejectionReasons: [],
    });
    const pack = assembleKerrCovariancePackFromDossierV393(
      dossier,
      transferArtifact,
      admissionArtifact,
    );
    expect(pack.rows).toHaveLength(12);
    expect(pack.crossCovariancePolicy.mode).toBe("explicit-values");
    expect(
      validateKerrPhysicalCovariancePackV392(pack, transferArtifact),
    ).toMatchObject({
      status: "admitted-validation-only",
      projectionAllowed: true,
      publishablePhysicalCovariance: false,
    });
  });

  it("rejects all pre-registered dossier attacks before pack assembly", () => {
    const transferArtifact = transfer();
    const admissionArtifact = admission();
    const fixtures = createKerrCovarianceDossierAdversarialFixturesV393(
      transferArtifact,
      admissionArtifact,
    );
    expect(fixtures).toHaveLength(9);
    for (const fixture of fixtures) {
      const result = validateKerrCovarianceSourceDossierV393(
        fixture.value,
        transferArtifact,
        admissionArtifact,
      );
      expect(result.status, fixture.id).toBe("rejected");
      expect(result.rejectionReasons, fixture.id).toContain(
        fixture.expectedReason,
      );
      expect(() =>
        assembleKerrCovariancePackFromDossierV393(
          fixture.value,
          transferArtifact,
          admissionArtifact,
        ),
      ).toThrow("v393-dossier-rejected");
    }
  });

  it("parses only the generated production-incomplete artifact", () => {
    const artifact = read(
      "dist/science/kerr-covariance-source-admission-v393/source-admission.json",
    );
    expect(parseKerrCovarianceSourceAdmissionArtifactV393(artifact)).toBe(
      artifact,
    );
    expect(artifact.selfTest.maximumPythonOracleRelativeDifference).toBeLessThan(
      V393_ORACLE_RELATIVE_LIMIT,
    );
    expect(artifact.productionAdmission).toMatchObject({
      dossierAvailable: false,
      componentSourcesAvailable: 0,
      crossSourcesAvailable: 0,
      covariancePackBuilt: false,
      covarianceProjectionExecuted: false,
      unknownSystematicsTreatedAsZero: false,
      missingCorrelationTreatedAsIndependent: false,
      probabilityContentAssigned: false,
    });
  });

  it("rejects a fabricated physical dossier promotion", () => {
    const artifact = read(
      "dist/science/kerr-covariance-source-admission-v393/source-admission.json",
    );
    artifact.productionAdmission.dossierAvailable = true;
    expect(() =>
      parseKerrCovarianceSourceAdmissionArtifactV393(artifact),
    ).toThrow("v393-covariance-source-admission-artifact-identity");
  });
});

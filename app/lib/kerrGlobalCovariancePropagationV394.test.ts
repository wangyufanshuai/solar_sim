import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createKerrGlobalCovarianceAdversarialFixturesV394,
  createKerrGlobalCovarianceControlFixtureV394,
  parseKerrGlobalCovariancePropagationArtifactV394,
  propagateKerrGlobalCovarianceV394,
  validateKerrGlobalCovarianceModelV394,
  V394_ORACLE_RELATIVE_LIMIT,
} from "./kerrGlobalCovariancePropagationV394";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const transfer = () =>
  read(
    "dist/science/kerr-temperature-systematics-transfer-v390/transfer-operator.json",
  );
const admission = () =>
  read(
    "dist/science/kerr-physical-covariance-admission-v392/covariance-admission.json",
  );
const dossier = () =>
  read(
    "dist/science/kerr-covariance-source-admission-v393/source-admission.json",
  );

describe("v394 global covariance propagation", () => {
  it("propagates a 36-dimensional correlated control into 24 outputs", () => {
    const transferArtifact = transfer();
    const admissionArtifact = admission();
    const dossierArtifact = dossier();
    const model = createKerrGlobalCovarianceControlFixtureV394(
      transferArtifact,
      admissionArtifact,
      dossierArtifact,
    );
    expect(
      validateKerrGlobalCovarianceModelV394(
        model,
        transferArtifact,
        admissionArtifact,
        dossierArtifact,
      ),
    ).toMatchObject({
      status: "admitted-validation-only",
      propagationAllowed: true,
      publicationAllowed: false,
      baseBlockCount: 12,
      nuisanceModeCount: 3,
      checkedLoadingCount: 108,
      rejectionReasons: [],
    });
    const projection = propagateKerrGlobalCovarianceV394(
      model,
      transferArtifact,
      admissionArtifact,
      dossierArtifact,
    );
    expect(projection.inputCovariance).toHaveLength(36);
    expect(projection.inputCovariance.every((row) => row.length === 36)).toBe(
      true,
    );
    expect(projection.outputCovariance).toHaveLength(24);
    expect(projection.outputCovariance.every((row) => row.length === 24)).toBe(
      true,
    );
    expect(projection.metrics).toMatchObject({
      inputCoefficientCount: 1296,
      outputCoefficientCount: 576,
      maximumInputSymmetryAbsoluteError: 0,
    });
    expect(
      projection.metrics.maximumOutputSymmetryAbsoluteError,
    ).toBeLessThan(1e-20);
    expect(projection.metrics.maximumCrossRowAbsoluteCovariance).toBeGreaterThan(
      0,
    );
    expect(projection.publicationAllowed).toBe(false);
  });

  it("rejects all pre-registered global covariance attacks", () => {
    const transferArtifact = transfer();
    const admissionArtifact = admission();
    const dossierArtifact = dossier();
    const fixtures = createKerrGlobalCovarianceAdversarialFixturesV394(
      transferArtifact,
      admissionArtifact,
      dossierArtifact,
    );
    expect(fixtures).toHaveLength(9);
    for (const fixture of fixtures) {
      const result = validateKerrGlobalCovarianceModelV394(
        fixture.value,
        transferArtifact,
        admissionArtifact,
        dossierArtifact,
      );
      expect(result.status, fixture.id).toBe("rejected");
      expect(result.rejectionReasons, fixture.id).toContain(
        fixture.expectedReason,
      );
      expect(() =>
        propagateKerrGlobalCovarianceV394(
          fixture.value,
          transferArtifact,
          admissionArtifact,
          dossierArtifact,
        ),
      ).toThrow("v394-global-model-rejected");
    }
  });

  it("parses only the generated physical-global-unavailable artifact", () => {
    const artifact = read(
      "dist/science/kerr-global-covariance-propagation-v394/global-propagation.json",
    );
    expect(parseKerrGlobalCovariancePropagationArtifactV394(artifact)).toBe(
      artifact,
    );
    expect(artifact.selfTest.maximumPythonOracleRelativeDifference).toBeLessThan(
      V394_ORACLE_RELATIVE_LIMIT,
    );
    expect(artifact.productionAdmission).toMatchObject({
      globalCovarianceModelAvailable: false,
      crossRowEvidenceAvailable: false,
      nuisanceModesAvailable: 0,
      covariancePropagationExecuted: false,
      blockIndependenceAssumed: false,
      missingCrossRowTermsTreatedAsZero: false,
      probabilityContentAssigned: false,
      outputCovariance: null,
    });
  });

  it("rejects a production propagation promotion", () => {
    const artifact = read(
      "dist/science/kerr-global-covariance-propagation-v394/global-propagation.json",
    );
    artifact.productionAdmission.covariancePropagationExecuted = true;
    expect(() =>
      parseKerrGlobalCovariancePropagationArtifactV394(artifact),
    ).toThrow("v394-global-covariance-artifact-identity");
  });
});

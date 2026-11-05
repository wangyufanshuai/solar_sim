import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createKerrCovarianceAdversarialFixturesV392,
  createKerrCovarianceControlFixtureV392,
  parseKerrPhysicalCovarianceAdmissionArtifactV392,
  projectKerrPhysicalCovarianceV392,
  validateKerrPhysicalCovariancePackV392,
  V392_ORACLE_RELATIVE_LIMIT,
} from "./kerrPhysicalCovarianceAdmissionV392";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const transfer = () =>
  read(
    "dist/science/kerr-temperature-systematics-transfer-v390/transfer-operator.json",
  );

describe("v392 physical covariance admission", () => {
  it("admits a deterministic validation-only control and projects J C J-transpose", () => {
    const source = transfer();
    const fixture = createKerrCovarianceControlFixtureV392(source);
    const admission = validateKerrPhysicalCovariancePackV392(fixture, source);
    expect(admission).toMatchObject({
      status: "admitted-validation-only",
      projectionAllowed: true,
      publishablePhysicalCovariance: false,
      checkedRowCount: 12,
      rejectionReasons: [],
    });
    expect(admission.minimumEigenvalue).toBeGreaterThanOrEqual(0);
    const projection = projectKerrPhysicalCovarianceV392(fixture, source);
    expect(projection.rows).toHaveLength(12);
    expect(projection.publicationAllowed).toBe(false);
    expect(
      projection.rows.every(
        (row) =>
          row.conditionedTemperatureLogStandardDeviation > 0 &&
          row.sourceModelTemperatureLogStandardDeviation > 0 &&
          row.projectedCovariance.flat().every(Number.isFinite),
      ),
    ).toBe(true);
  });

  it("rejects every pre-registered adversarial covariance pack", () => {
    const source = transfer();
    const fixtures = createKerrCovarianceAdversarialFixturesV392(source);
    expect(fixtures).toHaveLength(6);
    for (const fixture of fixtures) {
      const admission = validateKerrPhysicalCovariancePackV392(
        fixture.value,
        source,
      );
      expect(admission.status, fixture.id).toBe("rejected");
      expect(admission.projectionAllowed, fixture.id).toBe(false);
      expect(admission.rejectionReasons, fixture.id).toContain(
        fixture.expectedReason,
      );
      expect(() =>
        projectKerrPhysicalCovarianceV392(fixture.value, source),
      ).toThrow("v392-covariance-pack-rejected");
    }
  });

  it("does not infer independence from a zero cross block", () => {
    const source = transfer();
    const fixture = JSON.parse(
      JSON.stringify(createKerrCovarianceControlFixtureV392(source)),
    ) as {
      rows: Array<{
        covariance: number[][];
        crossCovariance: {
          photonRadianceRedshift: number;
          photonRadiancePageThorneFlux: number;
          redshiftPageThorneFlux: number;
        };
      }>;
      crossCovariancePolicy: {
        mode: string;
        independenceStatement: string | null;
      };
    };
    for (const row of fixture.rows) {
      row.covariance[0][1] = row.covariance[1][0] = 0;
      row.covariance[0][2] = row.covariance[2][0] = 0;
      row.covariance[1][2] = row.covariance[2][1] = 0;
      row.crossCovariance.photonRadianceRedshift = 0;
      row.crossCovariance.photonRadiancePageThorneFlux = 0;
      row.crossCovariance.redshiftPageThorneFlux = 0;
    }
    fixture.crossCovariancePolicy.mode =
      "zero-under-independence-evidence";
    fixture.crossCovariancePolicy.independenceStatement = null;
    const admission = validateKerrPhysicalCovariancePackV392(fixture, source);
    expect(admission.status).toBe("rejected");
    expect(admission.rejectionReasons).toContain(
      "missing-independence-evidence",
    );
  });

  it("parses only the generated fail-closed production artifact", () => {
    const artifact = read(
      "dist/science/kerr-physical-covariance-admission-v392/covariance-admission.json",
    );
    expect(parseKerrPhysicalCovarianceAdmissionArtifactV392(artifact)).toBe(
      artifact,
    );
    expect(artifact.selfTest.maximumPythonOracleRelativeDifference).toBeLessThan(
      V392_ORACLE_RELATIVE_LIMIT,
    );
    expect(artifact.productionAdmission).toMatchObject({
      physicalCovariancePackAvailable: false,
      physicalCovariancePackAdmitted: false,
      covarianceProjectionExecuted: false,
      unknownSystematicsTreatedAsZero: false,
      missingCrossCovarianceImputedAsIndependent: false,
      probabilityContentAssigned: false,
      absoluteScientificInterval: null,
    });
  });

  it("rejects a production projection promotion without a physical pack", () => {
    const artifact = read(
      "dist/science/kerr-physical-covariance-admission-v392/covariance-admission.json",
    );
    artifact.productionAdmission.covarianceProjectionExecuted = true;
    expect(() =>
      parseKerrPhysicalCovarianceAdmissionArtifactV392(artifact),
    ).toThrow("v392-covariance-admission-artifact-identity");
  });

  it("rejects an artifact with a missing source identity", () => {
    const artifact = read(
      "dist/science/kerr-physical-covariance-admission-v392/covariance-admission.json",
    );
    delete artifact.source.v391TrustRegionArtifactSha256;
    expect(() =>
      parseKerrPhysicalCovarianceAdmissionArtifactV392(artifact),
    ).toThrow("v392-covariance-admission-artifact-identity");
  });
});

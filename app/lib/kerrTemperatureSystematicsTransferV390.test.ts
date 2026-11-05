import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createKerrTemperatureSystematicsTransferV390,
  parseKerrTemperatureSystematicsTransferArtifactV390,
  V390_FINITE_DIFFERENCE_RELATIVE_LIMIT,
  V390_OPERATOR_CONDITION_LIMIT,
  V390_ORACLE_RELATIVE_LIMIT,
} from "./kerrTemperatureSystematicsTransferV390";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));

describe("v390 Kerr temperature systematics transfer", () => {
  it("builds twelve rank-2 log-space operators without inventing covariance", () => {
    const computation = createKerrTemperatureSystematicsTransferV390(
      read(
        "dist/science/kerr-conditional-temperature-interval-v389/temperature-interval.json",
      ),
      read(
        "dist/science/kerr-photon-source-identifiability-v387/identifiability.json",
      ),
    );
    expect(computation.rows).toHaveLength(12);
    expect(computation.rows.every((row) => row.rank === 2)).toBe(true);
    expect(computation.rows.every((row) => row.transferMatrix[0][1] === -1)).toBe(
      true,
    );
    expect(computation.rows.every((row) => row.transferMatrix[1][2] === 0.25)).toBe(
      true,
    );
    expect(computation.maxima.finiteDifferenceRelativeDifference).toBeLessThan(
      V390_FINITE_DIFFERENCE_RELATIVE_LIMIT,
    );
    expect(computation.maxima.conditionNumber).toBeLessThan(
      V390_OPERATOR_CONDITION_LIMIT,
    );
    expect(
      computation.rows.every(
        (row) =>
          row.projectedPhysicalCovariance === null &&
          row.absoluteScientificInterval === null,
      ),
    ).toBe(true);
  });

  it("parses only the generated fail-closed transfer artifact", () => {
    const artifact = read(
      "dist/science/kerr-temperature-systematics-transfer-v390/transfer-operator.json",
    );
    expect(parseKerrTemperatureSystematicsTransferArtifactV390(artifact)).toBe(
      artifact,
    );
    expect(artifact.maxima.pythonOracleRelativeDifference).toBeLessThan(
      V390_ORACLE_RELATIVE_LIMIT,
    );
    expect(artifact.admission).toMatchObject({
      physicalSystematicVectorAdmitted: false,
      covarianceProjectionExecuted: false,
      unknownSystematicsTreatedAsZero: false,
      rssApplied: false,
      confidenceInterval: false,
      probabilityContentAssigned: false,
    });
  });

  it("rejects a synthetic covariance promotion", () => {
    const artifact = read(
      "dist/science/kerr-temperature-systematics-transfer-v390/transfer-operator.json",
    );
    artifact.admission.physicalSystematicVectorAdmitted = true;
    expect(() =>
      parseKerrTemperatureSystematicsTransferArtifactV390(artifact),
    ).toThrow("v390-systematics-transfer-artifact-identity");
  });
});

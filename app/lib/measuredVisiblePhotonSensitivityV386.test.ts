import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createMeasuredVisiblePhotonSensitivityV386,
  parseMeasuredVisiblePhotonSensitivityArtifactV386,
  V386_CROSS_IMPLEMENTATION_RELATIVE_LIMIT,
  V386_FINITE_DIFFERENCE_RELATIVE_LIMIT,
  V386_SOURCE_DEGENERACY_ABSOLUTE_LIMIT,
  V386_WEIGHT_SUM_RESIDUAL_LIMIT,
} from "./measuredVisiblePhotonSensitivityV386";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));

describe("v386 visible photon sensitivity", () => {
  it("resolves a normalized throughput Jacobian and exposes the gT degeneracy", () => {
    const result = createMeasuredVisiblePhotonSensitivityV386(
      read("dist/science/measured-visible-photon-error-budget-v385/error-budget.json"),
      read("dist/science/measured-visible-photon-observable-v384/observable.json"),
      read("dist/science/measured-visible-throughput-v383/manifest.json"),
      readFileSync(
        "dist/science/measured-visible-throughput-v383/profile.csv",
        "utf8",
      ),
    );
    expect(result.rows).toHaveLength(4);
    expect(result.rows.every((row) => row.bins.length === 12)).toBe(true);
    expect(result.maxima.throughputWeightSumAbsoluteResidual).toBeLessThan(
      V386_WEIGHT_SUM_RESIDUAL_LIMIT,
    );
    expect(result.maxima.finiteDifferenceRelativeDifference).toBeLessThan(
      V386_FINITE_DIFFERENCE_RELATIVE_LIMIT,
    );
    expect(
      result.maxima.sourceSensitivityDegeneracyAbsoluteDifference,
    ).toBeLessThan(V386_SOURCE_DEGENERACY_ABSOLUTE_LIMIT);
    expect(
      result.rows.every(
        (row) => row.projectedScientificUncertaintyRelative === "unavailable",
      ),
    ).toBe(true);
  });

  it("parses the generated fail-closed artifact", () => {
    const artifact = read(
      "dist/science/measured-visible-photon-sensitivity-v386/sensitivity.json",
    );
    expect(parseMeasuredVisiblePhotonSensitivityArtifactV386(artifact)).toBe(
      artifact,
    );
    expect(artifact.maxima.pythonOracleRelativeDifference).toBeLessThan(
      V386_CROSS_IMPLEMENTATION_RELATIVE_LIMIT,
    );
    expect(artifact.calibrationContract).toMatchObject({
      suppliedCovarianceAvailable: false,
      numericalPlaceholderUsed: false,
      rssApplied: false,
      uncertaintyProjectionAvailable: false,
    });
  });
});

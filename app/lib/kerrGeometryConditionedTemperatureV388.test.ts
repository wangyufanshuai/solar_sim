import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createKerrGeometryConditionedTemperatureV388,
  parseKerrGeometryConditionedTemperatureArtifactV388,
  V388_KNOWN_NUMERICAL_UPPER_BOUND_LIMIT,
  V388_ORACLE_RELATIVE_LIMIT,
  V388_REPLAY_RELATIVE_LIMIT,
} from "./kerrGeometryConditionedTemperatureV388";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));

describe("v388 geometry-conditioned temperature", () => {
  it("raises the source system from rank 1 to rank 2 with the independent Kerr redshift prior", () => {
    const result = createKerrGeometryConditionedTemperatureV388(
      read("dist/science/kerr-reference-v296/geometry-redshift-short-gate.json"),
      read("dist/science/kerr-thin-disk-v320/fixed-band-imaging.json").view,
      read("dist/science/kerr-science-photon-bands-v328/photon-radiance.json").view,
      read("dist/science/kerr-photon-source-identifiability-v387/identifiability.json"),
    );
    expect(result.rows).toHaveLength(12);
    expect(result.rayAudits.every((entry) => entry.augmentedRank === 2)).toBe(
      true,
    );
    expect(result.maxima.temperatureReplayRelativeDifference).toBeLessThan(
      V388_REPLAY_RELATIVE_LIMIT,
    );
    expect(result.maxima.knownNumericalUpperBoundRelative).toBeLessThan(
      V388_KNOWN_NUMERICAL_UPPER_BOUND_LIMIT,
    );
    expect(
      result.rows.every(
        (row) => row.absoluteTemperatureUncertaintyRelative === "unavailable",
      ),
    ).toBe(true);
  });

  it("parses the generated conditional replay artifact", () => {
    const artifact = read(
      "dist/science/kerr-geometry-conditioned-temperature-v388/temperature-replay.json",
    );
    expect(parseKerrGeometryConditionedTemperatureArtifactV388(artifact)).toBe(
      artifact,
    );
    expect(artifact.maxima.pythonOracleRelativeDifference).toBeLessThan(
      V388_ORACLE_RELATIVE_LIMIT,
    );
    expect(artifact.uncertainty).toMatchObject({
      knownNumericalBudgetQualified: true,
      absoluteTemperatureUncertaintyQualified: false,
      numericalPlaceholderUsed: false,
    });
  });
});

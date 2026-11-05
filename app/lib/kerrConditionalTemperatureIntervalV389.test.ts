import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createKerrConditionalTemperatureIntervalV389,
  parseKerrConditionalTemperatureIntervalArtifactV389,
  V389_INTERVAL_RELATIVE_RADIUS_LIMIT,
  V389_ORACLE_RELATIVE_LIMIT,
} from "./kerrConditionalTemperatureIntervalV389";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));

describe("v389 exact conditional temperature interval", () => {
  it("propagates photon and redshift endpoints without RSS or confidence semantics", () => {
    const result = createKerrConditionalTemperatureIntervalV389(
      read("dist/science/kerr-geometry-conditioned-temperature-v388/temperature-replay.json"),
      read("dist/science/kerr-science-photon-bands-v328/photon-radiance.json").view,
      read("dist/science/kerr-thin-disk-v320/fixed-band-imaging.json").view,
    );
    expect(result.rows).toHaveLength(12);
    expect(
      result.maxima.conditionedTemperatureNumericalRelativeRadius,
    ).toBeLessThan(V389_INTERVAL_RELATIVE_RADIUS_LIMIT);
    expect(result.maxima.sourceModelTemperatureRelativeRadius).toBeLessThan(
      V389_INTERVAL_RELATIVE_RADIUS_LIMIT,
    );
    expect(result.rows.every((row) => row.absoluteTemperatureInterval === null)).toBe(
      true,
    );
  });

  it("parses the generated fail-closed interval artifact", () => {
    const artifact = read(
      "dist/science/kerr-conditional-temperature-interval-v389/temperature-interval.json",
    );
    expect(parseKerrConditionalTemperatureIntervalArtifactV389(artifact)).toBe(
      artifact,
    );
    expect(artifact.maxima.pythonOracleRelativeDifference).toBeLessThan(
      V389_ORACLE_RELATIVE_LIMIT,
    );
    expect(artifact.intervalSemantics).toMatchObject({
      confidenceInterval: false,
      probabilityContentAssigned: false,
      absoluteScientificIntervalQualified: false,
      numericalPlaceholderUsed: false,
    });
  });

  it("rejects a non-positive geometry interval even when other fields survive", () => {
    const artifact = read(
      "dist/science/kerr-conditional-temperature-interval-v389/temperature-interval.json",
    );
    artifact.rows[0].geometryRedshiftInterval.lower = -1;
    expect(() =>
      parseKerrConditionalTemperatureIntervalArtifactV389(artifact),
    ).toThrow("v389-interval-artifact-identity");
  });
});

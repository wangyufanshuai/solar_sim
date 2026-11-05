import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createKerrTemperatureTrustRegionV391,
  parseKerrTemperatureTrustRegionArtifactV391,
  V391_MINIMUM_LINEAR_TRUST_RADIUS,
  V391_MINIMUM_QUADRATIC_TRUST_RADIUS,
  V391_ORACLE_RELATIVE_LIMIT,
} from "./kerrTemperatureTrustRegionV391";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));

describe("v391 nonlinear curvature trust region", () => {
  it("qualifies linear and quadratic trust radii on a nonphysical stress grid", () => {
    const result = createKerrTemperatureTrustRegionV391(
      read(
        "dist/science/kerr-temperature-systematics-transfer-v390/transfer-operator.json",
      ),
      read(
        "dist/science/kerr-conditional-temperature-interval-v389/temperature-interval.json",
      ),
      read(
        "dist/science/kerr-photon-source-identifiability-v387/identifiability.json",
      ),
    );
    expect(result.rows).toHaveLength(12);
    expect(result.minima.linearTrustRadius).toBeGreaterThanOrEqual(
      V391_MINIMUM_LINEAR_TRUST_RADIUS,
    );
    expect(result.minima.quadraticTrustRadius).toBeGreaterThanOrEqual(
      V391_MINIMUM_QUADRATIC_TRUST_RADIUS,
    );
    expect(result.maxima.quadraticAbsoluteLogResidual).toBeLessThan(
      result.maxima.linearAbsoluteLogResidual,
    );
    expect(
      result.rows.every(
        (row) =>
          row.stressGridIsPhysicalUncertainty === false &&
          row.physicalSystematicVectorAdmitted === false &&
          row.absoluteScientificInterval === null,
      ),
    ).toBe(true);
  });

  it("parses only the generated nonphysical-grid artifact", () => {
    const artifact = read(
      "dist/science/kerr-temperature-trust-region-v391/trust-region.json",
    );
    expect(parseKerrTemperatureTrustRegionArtifactV391(artifact)).toBe(artifact);
    expect(artifact.maxima.pythonOracleRelativeDifference).toBeLessThan(
      V391_ORACLE_RELATIVE_LIMIT,
    );
    expect(artifact.method).toMatchObject({
      stressGridIsPhysicalUncertainty: false,
      stressGridProbabilityContent: false,
      derivativeFixturePublishableAsMeasurement: false,
    });
  });

  it("rejects promotion of the stress grid into physical uncertainty", () => {
    const artifact = read(
      "dist/science/kerr-temperature-trust-region-v391/trust-region.json",
    );
    artifact.method.stressGridIsPhysicalUncertainty = true;
    expect(() => parseKerrTemperatureTrustRegionArtifactV391(artifact)).toThrow(
      "v391-trust-region-artifact-identity",
    );
  });
});

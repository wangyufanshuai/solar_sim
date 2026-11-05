import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createKerrPhotonSourceIdentifiabilityV387,
  parseKerrPhotonSourceIdentifiabilityArtifactV387,
  validatePhotonCovariancePackV387,
  V387_COVARIANCE_PARAMETER_ORDER,
  V387_FINITE_DIFFERENCE_RELATIVE_LIMIT,
  V387_ORACLE_RELATIVE_LIMIT,
} from "./kerrPhotonSourceIdentifiabilityV387";

const SHA = "a".repeat(64);
const photon = JSON.parse(
  readFileSync(
    "dist/science/kerr-science-photon-bands-v328/photon-radiance.json",
    "utf8",
  ),
);

describe("v387 photon source identifiability", () => {
  it("proves that visible, EUV and soft X-ray continuum bands retain the gT null direction", () => {
    const result = createKerrPhotonSourceIdentifiabilityV387(photon.view);
    expect(result.rows).toHaveLength(12);
    expect(result.rayAudits.every((entry) => entry.rank === 1)).toBe(true);
    expect(result.global.rank).toBe(1);
    expect(result.global.singularValues[1]).toBe(0);
    expect(result.maxima.finiteDifferenceRelativeDifference).toBeLessThan(
      V387_FINITE_DIFFERENCE_RELATIVE_LIMIT,
    );
  });

  it("admits a finite symmetric PSD fixture but never publishes the fixture", () => {
    const diagonal = Array.from({ length: 12 }, (_, row) =>
      Array.from({ length: 12 }, (_, column) =>
        row === column ? 1e-6 * (row + 1) : 0,
      ),
    );
    const result = validatePhotonCovariancePackV387(
      {
        version: "v387-photon-covariance-pack-v1",
        identity: {
          v386SensitivityArtifactSha256: SHA,
          parameterOrder: V387_COVARIANCE_PARAMETER_ORDER,
        },
        throughputFractionalCovariance: diagonal,
        sourceLogCovariance: [
          [2e-6, 5e-7],
          [5e-7, 3e-6],
        ],
        throughputSourceCrossCovariance: null,
        crossCovarianceIndependenceEvidence: {
          documented: true,
          evidenceSha256: SHA,
        },
        fixtureOnly: true,
      },
      SHA,
    );
    expect(result.jointDimension).toBe(14);
    expect(result.minimumEigenvalue).toBeGreaterThanOrEqual(0);
    expect(result.publishableAsMeasuredCovariance).toBe(false);
  });

  it("rejects missing cross-block evidence and an indefinite covariance", () => {
    const base = {
      version: "v387-photon-covariance-pack-v1" as const,
      identity: {
        v386SensitivityArtifactSha256: SHA,
        parameterOrder: V387_COVARIANCE_PARAMETER_ORDER,
      },
      throughputFractionalCovariance: Array.from({ length: 12 }, (_, row) =>
        Array.from({ length: 12 }, (_, column) =>
          row === column ? 1e-6 : 0,
        ),
      ),
      sourceLogCovariance: [
        [1, 2],
        [2, 1],
      ],
      throughputSourceCrossCovariance: null,
      crossCovarianceIndependenceEvidence: null,
      fixtureOnly: true,
    };
    expect(() => validatePhotonCovariancePackV387(base, SHA)).toThrow(
      "v387-covariance-cross-block",
    );
    expect(() =>
      validatePhotonCovariancePackV387(
        {
          ...base,
          crossCovarianceIndependenceEvidence: {
            documented: true,
            evidenceSha256: SHA,
          },
        },
        SHA,
      ),
    ).toThrow("v387-covariance-psd");
  });

  it("parses the generated artifact", () => {
    const artifact = JSON.parse(
      readFileSync(
        "dist/science/kerr-photon-source-identifiability-v387/identifiability.json",
        "utf8",
      ),
    );
    expect(parseKerrPhotonSourceIdentifiabilityArtifactV387(artifact)).toBe(
      artifact,
    );
    expect(artifact.maxima.pythonOracleRelativeDifference).toBeLessThan(
      V387_ORACLE_RELATIVE_LIMIT,
    );
    expect(artifact.covarianceAdmission.covariancePackAvailable).toBe(false);
  });
});

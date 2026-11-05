import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  canonicalKerrPhotonRadiometryTransferV477,
  createKerrPhotonRadiometryTransferSummaryV477,
  evaluateKerrPhotonTransferCoefficientsV477,
  parseKerrPhotonRadiometryTransferArtifactV477,
  propagateKerrPhotonTransferUncertaintyV477,
} from "./kerrPhotonRadiometryTransferV477";

const input = JSON.parse(
  readFileSync("dist/science/kerr-photon-radiometry-transfer-v477/transfer-payload.json", "utf8"),
);
const sha = (value: unknown) =>
  createHash("sha256").update(canonicalKerrPhotonRadiometryTransferV477(value)).digest("hex");

describe("v477 photon radiometry transfer", () => {
  it("verifies artifact, payload and four row SHAs", () => {
    const artifact = parseKerrPhotonRadiometryTransferArtifactV477(input);

    expect(sha(artifact)).toBe(artifact.artifactSha256);
    expect(sha(artifact.rows)).toBe(artifact.payloadSha256);
    expect(artifact.rows.map((row) => sha(row))).toEqual(
      artifact.rows.map((row) => row.rowSha256),
    );
    expect(Object.isFrozen(artifact.rows)).toBe(true);
  });

  it("matches g, g cubed and g fourth against a log-exp oracle", () => {
    const summary = createKerrPhotonRadiometryTransferSummaryV477(input);

    for (const row of summary.rows) {
      const coefficients = evaluateKerrPhotonTransferCoefficientsV477(row.redshiftFactor);
      expect(coefficients.frequencyRatio).toBe(row.redshiftFactor);
      expect(coefficients.spectralG3).toBe(row.spectralRadianceTransferG3);
      expect(coefficients.bolometricG4).toBe(row.bolometricRadianceTransferG4);
      expect(row.oracle.spectralRelativeDifference).toBeLessThan(1e-12);
      expect(row.oracle.bolometricRelativeDifference).toBeLessThan(1e-12);
    }
  });

  it("matches analytic uncertainty propagation to central finite differences", () => {
    const summary = createKerrPhotonRadiometryTransferSummaryV477(input);
    const step = 1e-6;

    for (const row of summary.rows) {
      const upper = propagateKerrPhotonTransferUncertaintyV477(
        row.redshiftFactor,
        row.uncertainty.redshiftAbsoluteUpperBound,
      );
      const plus = evaluateKerrPhotonTransferCoefficientsV477(row.redshiftFactor + step);
      const minus = evaluateKerrPhotonTransferCoefficientsV477(row.redshiftFactor - step);
      const numericalD3 = (plus.spectralG3 - minus.spectralG3) / (2 * step);
      const numericalD4 = (plus.bolometricG4 - minus.bolometricG4) / (2 * step);

      expect(upper.spectralTransferAbsoluteUpperBound).toBeCloseTo(
        Math.abs(numericalD3) * row.uncertainty.redshiftAbsoluteUpperBound,
        9,
      );
      expect(upper.bolometricTransferAbsoluteUpperBound).toBeCloseTo(
        Math.abs(numericalD4) * row.uncertainty.redshiftAbsoluteUpperBound,
        9,
      );
    }
  });

  it("keeps transfer coefficients distinct from unavailable measurements", () => {
    const artifact = parseKerrPhotonRadiometryTransferArtifactV477(input);

    for (const row of artifact.rows) {
      expect(row.measurements.emittedSpectralRadiance).toBeNull();
      expect(row.measurements.observedSpectralRadiance).toBeNull();
      expect(row.measurements.detectorProjectedValue).toBeNull();
      expect(row.measurements.stokesI).toBeNull();
      expect(row.uncertainty.combinationPolicy).toBe("shared-redshift-channel-not-combined");
      expect(row.uncertainty.productionBudgetClosed).toBe(false);
    }
    expect(artifact.applicability.productionRadiometryQualified).toBe(false);
    expect(artifact.boundary.sciencePixelRows).toBe(0);
  });
});

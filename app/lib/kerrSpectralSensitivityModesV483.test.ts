import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  canonicalKerrSpectralSensitivityModesV483,
  createKerrSpectralSensitivitySummaryV483,
  parseKerrSpectralSensitivityArtifactV483,
} from "./kerrSpectralSensitivityModesV483";

const input = JSON.parse(
  readFileSync("dist/science/kerr-spectral-sensitivity-modes-v483/sensitivity-modes.json", "utf8"),
);
const canonicalSha = (value: unknown) =>
  createHash("sha256").update(canonicalKerrSpectralSensitivityModesV483(value)).digest("hex");

describe("v483 spectral sensitivity modes", () => {
  it("verifies the artifact, payload and exact five-mode basis", () => {
    const artifact = parseKerrSpectralSensitivityArtifactV483(input);
    expect(canonicalSha(artifact)).toBe(artifact.artifactSha256);
    expect(canonicalSha({ basis: artifact.basis, rows: artifact.rows })).toBe(artifact.payloadSha256);
    expect(artifact.basis.modes.map((mode) => mode.id)).toEqual([
      "common-scale",
      "nullspace-0",
      "nullspace-1",
      "nullspace-2",
      "nullspace-3",
    ]);
    expect(artifact.rows.flatMap((row) => row.projections)).toHaveLength(20);
  });

  it("proves orthonormality, completeness and the four-dimensional nullspace", () => {
    const artifact = parseKerrSpectralSensitivityArtifactV483(input);
    expect(artifact.basis.audit.maximumOrthonormalityAbsoluteResidual).toBeLessThanOrEqual(1e-14);
    expect(artifact.basis.audit.maximumCompletenessAbsoluteResidual).toBeLessThanOrEqual(1e-14);
    expect(artifact.basis.audit.maximumNullspaceEmitterDotAbsoluteResidual).toBeLessThanOrEqual(1e-14);
    expect(artifact.audit.commonScaleProjectionCount).toBe(4);
    expect(artifact.audit.nullspaceProjectionCount).toBe(16);
  });

  it("matches direct matrix projection to the outer-product oracle", () => {
    const summary = createKerrSpectralSensitivitySummaryV483(input);
    expect(summary.audit.maximumProjectionAbsoluteResidual).toBeLessThanOrEqual(1e-14);
    expect(summary.audit.maximumVarianceOracleRelativeResidual).toBeLessThanOrEqual(1e-14);
    expect(summary.audit.maximumNullspaceCoordinateAbsoluteResidual).toBeLessThanOrEqual(1e-14);
    expect(summary.audit.maximumNegativeRoundoffAbsoluteValue).toBeLessThanOrEqual(1e-40);
    expect(summary.rows.every((row) => row.audit.nullspaceZeroDoesNotMeanMeasurementExact)).toBe(true);
  });

  it("keeps detector observables and likelihood unavailable", () => {
    const artifact = parseKerrSpectralSensitivityArtifactV483(input);
    expect(artifact.boundary.dimensionlessSensitivityModeAuthorityGranted).toBe(true);
    expect(artifact.boundary.physicalDetectorObservableAuthorityGranted).toBe(false);
    expect(artifact.boundary.statisticalLikelihoodAuthorityGranted).toBe(false);
    expect(artifact.boundary.independentNoiseAuthorityGranted).toBe(false);
    expect(artifact.audit.detectorObservableRows).toBe(0);
    expect(artifact.audit.sciencePixelRows).toBe(0);
  });
});

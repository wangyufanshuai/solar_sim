import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  canonicalKerrSpectralLandmarkCovarianceV482,
  createKerrSpectralLandmarkCovarianceSummaryV482,
  parseKerrSpectralLandmarkCovarianceArtifactV482,
} from "./kerrSpectralLandmarkCovarianceV482";

const input = JSON.parse(
  readFileSync("dist/science/kerr-spectral-landmark-covariance-v482/covariance.json", "utf8"),
);
const canonicalSha = (value: unknown) =>
  createHash("sha256").update(canonicalKerrSpectralLandmarkCovarianceV482(value)).digest("hex");

describe("v482 correlated spectral landmark uncertainty", () => {
  it("verifies four rank-one five-dimensional matrices", () => {
    const artifact = parseKerrSpectralLandmarkCovarianceArtifactV482(input);
    expect(canonicalSha(artifact)).toBe(artifact.artifactSha256);
    expect(canonicalSha(artifact.rows)).toBe(artifact.payloadSha256);
    expect(artifact.rows).toHaveLength(4);
    expect(artifact.rows.every((row) => row.covarianceUpperBound.length === 5)).toBe(true);
    expect(artifact.rows.every((row) => row.covarianceUpperBound.every((line) => line.length === 5))).toBe(true);
  });

  it("keeps the common-scale covariance correlated and non-statistical", () => {
    const artifact = parseKerrSpectralLandmarkCovarianceArtifactV482(input);
    expect(artifact.audit.rankOneMatrixCount).toBe(4);
    expect(artifact.audit.zeroEigenvalueCount).toBe(16);
    expect(artifact.audit.symmetricMatrixCount).toBe(4);
    expect(artifact.audit.positiveSemidefiniteMatrixCount).toBe(4);
    expect(artifact.audit.maximumScaleConsistencyRelativeResidual).toBe(0);
    expect(artifact.audit.maximumPrincipalEigenvalueTraceRelativeResidual).toBe(0);
    expect(artifact.contract.independentNoiseAssumed).toBe(false);
    expect(artifact.contract.statisticalOneSigmaAuthorityGranted).toBe(false);
  });

  it("matches each diagonal projection to the v481 coordinate uncertainty upper bound", () => {
    const summary = createKerrSpectralLandmarkCovarianceSummaryV482(input);
    expect(summary.rows.every((row) => row.audit.maximumDiagonalProjectionRelativeResidual <= 2e-15)).toBe(true);
    expect(summary.boundary.correlatedUncertaintyUpperBoundAuthorityGranted).toBe(true);
    expect(summary.boundary.statisticalCovarianceAuthorityGranted).toBe(false);
    expect(summary.audit.sciencePixelRows).toBe(0);
    expect(summary.audit.scienceWritebackCount).toBe(0);
  });

  it("keeps physical line, detector and observed-spectrum claims unavailable", () => {
    const artifact = parseKerrSpectralLandmarkCovarianceArtifactV482(input);
    expect(artifact.boundary.physicalLineIdentityAuthorityGranted).toBe(false);
    expect(artifact.boundary.physicalBandpassAuthorityGranted).toBe(false);
    expect(artifact.boundary.observedSpectrumAuthorityGranted).toBe(false);
    expect(artifact.boundary.scienceRasterAuthorityGranted).toBe(false);
    expect(artifact.boundary.denseCampaignStatus).toBe("incomplete-0-of-49");
  });
});

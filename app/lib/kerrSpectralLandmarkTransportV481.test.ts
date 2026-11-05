import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  canonicalKerrSpectralLandmarkTransportV481,
  createKerrSpectralLandmarkSummaryV481,
  parseKerrSpectralLandmarkArtifactV481,
} from "./kerrSpectralLandmarkTransportV481";

const input = JSON.parse(
  readFileSync("dist/science/kerr-spectral-landmark-transport-v481/landmarks.json", "utf8"),
);
const canonicalSha = (value: unknown) =>
  createHash("sha256").update(canonicalKerrSpectralLandmarkTransportV481(value)).digest("hex");

describe("v481 spectral landmark coordinate transport", () => {
  it("verifies the artifact, payload and four provenance-linked rays", () => {
    const artifact = parseKerrSpectralLandmarkArtifactV481(input);
    expect(canonicalSha(artifact)).toBe(artifact.artifactSha256);
    expect(canonicalSha(artifact.rows)).toBe(artifact.payloadSha256);
    expect(artifact.rows).toHaveLength(4);
    expect(artifact.rows.flatMap((row) => row.features)).toHaveLength(20);
    expect(artifact.rows.every((row) => row.sourceNormalizedFrequencyRowSha256 === row.sourceProvenanceRowSha256)).toBe(
      true,
    );
  });

  it("preserves inverse, pairwise-ratio and adjacent-spacing invariants", () => {
    const artifact = parseKerrSpectralLandmarkArtifactV481(input);
    expect(artifact.audit.maximumDirectOracleRelativeResidual).toBeLessThanOrEqual(2e-15);
    expect(artifact.audit.maximumInverseRoundTripRelativeResidual).toBeLessThanOrEqual(2e-15);
    expect(artifact.audit.maximumPairwiseRatioRelativeResidual).toBeLessThanOrEqual(2e-15);
    expect(artifact.audit.maximumAdjacentSpacingRelativeResidual).toBeLessThanOrEqual(2e-15);
    expect(artifact.audit.pairwiseRatioAuditCount).toBe(40);
    expect(artifact.audit.adjacentSpacingAuditCount).toBe(16);
  });

  it("publishes finite uncertainty intervals containing every landmark", () => {
    const summary = createKerrSpectralLandmarkSummaryV481(input);
    for (const feature of summary.rows.flatMap((row) => row.features)) {
      expect(feature.observerCoordinateInterval.lower).toBeLessThanOrEqual(feature.observerCoordinate);
      expect(feature.observerCoordinateInterval.upper).toBeGreaterThanOrEqual(feature.observerCoordinate);
      expect(Number.isFinite(feature.relativeCoordinateUncertaintyUpperBound)).toBe(true);
    }
    expect(summary.audit.intervalContainmentCount).toBe(20);
  });

  it("does not promote coordinate landmarks into physical spectral products", () => {
    const artifact = parseKerrSpectralLandmarkArtifactV481(input);
    expect(artifact.boundary.dimensionlessLandmarkPositionAuthorityGranted).toBe(true);
    expect(artifact.boundary.physicalLineIdentityAuthorityGranted).toBe(false);
    expect(artifact.boundary.lineWidthAuthorityGranted).toBe(false);
    expect(artifact.boundary.lineAmplitudeAuthorityGranted).toBe(false);
    expect(artifact.boundary.equivalentWidthAuthorityGranted).toBe(false);
    expect(artifact.boundary.observedSpectrumAuthorityGranted).toBe(false);
    expect(artifact.audit.sciencePixelRows).toBe(0);
  });
});

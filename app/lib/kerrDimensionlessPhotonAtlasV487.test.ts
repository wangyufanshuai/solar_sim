import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  canonicalKerrDimensionlessPhotonAtlasV487,
  createKerrDimensionlessPhotonAtlasSummaryV487,
  parseKerrDimensionlessPhotonAtlasArtifactV487,
} from "./kerrDimensionlessPhotonAtlasV487";

const input = JSON.parse(
  readFileSync("dist/science/kerr-dimensionless-photon-atlas-v487/atlas.json", "utf8"),
);
const sha = (value: unknown) =>
  createHash("sha256").update(canonicalKerrDimensionlessPhotonAtlasV487(value)).digest("hex");

describe("v487 dimensionless photon atlas", () => {
  it("locks a four-ray, twenty-landmark dimensionless payload", () => {
    const artifact = parseKerrDimensionlessPhotonAtlasArtifactV487(input);
    expect(sha(artifact)).toBe(artifact.artifactSha256);
    expect(sha(artifact.rays)).toBe(artifact.payloadSha256);
    expect(artifact.rays).toHaveLength(4);
    expect(artifact.rays.flatMap((ray) => ray.landmarks)).toHaveLength(20);
    expect(artifact.rays.every((ray) => ray.identifiability.identifiableDimension === 1)).toBe(true);
    expect(artifact.rays.every((ray) => ray.identifiability.unidentifiableDimension === 4)).toBe(true);
  });

  it("keeps physical observables, statistical claims and science pixels unavailable", () => {
    const artifact = parseKerrDimensionlessPhotonAtlasArtifactV487(input);
    expect(artifact.boundary.absoluteFrequencyAuthorityGranted).toBe(false);
    expect(artifact.boundary.physicalBandpassAuthorityGranted).toBe(false);
    expect(artifact.boundary.observedIntensityAuthorityGranted).toBe(false);
    expect(artifact.boundary.statisticalLikelihoodAuthorityGranted).toBe(false);
    expect(artifact.boundary.scienceRasterAuthorityGranted).toBe(false);
    expect(artifact.audit.sciencePixelRows).toBe(0);
    expect(artifact.audit.matrixElementCountCopied).toBe(0);
    expect(artifact.audit.projectionRecordCountCopied).toBe(0);
  });

  it("creates a bounded summary containing only sparse coordinates and scalar status", () => {
    const summary = createKerrDimensionlessPhotonAtlasSummaryV487(input);
    expect(summary.rays.flatMap((ray) => ray.landmarks)).toHaveLength(20);
    expect(JSON.stringify(summary)).not.toContain("covarianceUpperBound");
    expect(JSON.stringify(summary)).not.toContain("moorePenrosePseudoInverse");
    expect(JSON.stringify(summary)).not.toContain('"projections"');
  });
});

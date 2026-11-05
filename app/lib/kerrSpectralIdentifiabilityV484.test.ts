import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  canonicalKerrSpectralIdentifiabilityV484,
  createKerrSpectralIdentifiabilitySummaryV484,
  parseKerrSpectralIdentifiabilityArtifactV484,
} from "./kerrSpectralIdentifiabilityV484";

const input = JSON.parse(
  readFileSync("dist/science/kerr-spectral-identifiability-v484/identifiability.json", "utf8"),
);
const canonicalSha = (value: unknown) =>
  createHash("sha256").update(canonicalKerrSpectralIdentifiabilityV484(value)).digest("hex");

describe("v484 spectral identifiability", () => {
  it("verifies four rank-one pseudoinverse ledgers", () => {
    const artifact = parseKerrSpectralIdentifiabilityArtifactV484(input);
    expect(canonicalSha(artifact)).toBe(artifact.artifactSha256);
    expect(canonicalSha(artifact.rows)).toBe(artifact.payloadSha256);
    expect(artifact.rows).toHaveLength(4);
    expect(artifact.rows.every((row) => row.identifiableDimension === 1)).toBe(true);
    expect(artifact.rows.every((row) => row.unidentifiableDimension === 4)).toBe(true);
  });

  it("passes all four Moore-Penrose conditions and projector identities", () => {
    const summary = createKerrSpectralIdentifiabilitySummaryV484(input);
    expect(summary.audit.penroseConditionAuditCount).toBe(16);
    expect(summary.audit.maximumPenroseRelativeResidual).toBeLessThanOrEqual(1e-12);
    expect(summary.audit.maximumPenroseSymmetryAbsoluteResidual).toBeLessThanOrEqual(1e-12);
    expect(summary.audit.maximumProjectorIdempotenceRelativeResidual).toBeLessThanOrEqual(1e-12);
    expect(summary.audit.maximumProjectorComplementAbsoluteResidual).toBeLessThanOrEqual(1e-12);
    expect(summary.audit.maximumProjectorOrthogonalityAbsoluteResidual).toBeLessThanOrEqual(1e-12);
    expect(summary.audit.maximumProjectorTraceResidual).toBeLessThanOrEqual(1e-12);
  });

  it("keeps the full condition number singular while the nonzero spectrum is conditioned", () => {
    const artifact = parseKerrSpectralIdentifiabilityArtifactV484(input);
    expect(artifact.rows.every((row) => row.determinant === 0)).toBe(true);
    expect(artifact.rows.every((row) => row.fullConditionNumber === "infinite-singular")).toBe(true);
    expect(artifact.rows.every((row) => row.nonzeroSpectrumConditionNumber === 1)).toBe(true);
    expect(artifact.audit.singularMatrixCount).toBe(4);
  });

  it("does not reinterpret the algebraic pseudoinverse as statistical authority", () => {
    const artifact = parseKerrSpectralIdentifiabilityArtifactV484(input);
    expect(artifact.boundary.algebraicPseudoInverseAuthorityGranted).toBe(true);
    expect(artifact.boundary.inverseNoiseCovarianceAuthorityGranted).toBe(false);
    expect(artifact.boundary.fisherInformationAuthorityGranted).toBe(false);
    expect(artifact.boundary.statisticalLikelihoodAuthorityGranted).toBe(false);
    expect(artifact.boundary.parameterPosteriorAuthorityGranted).toBe(false);
    expect(artifact.audit.sciencePixelRows).toBe(0);
  });
});

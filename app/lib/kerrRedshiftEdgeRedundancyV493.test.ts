import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { canonicalKerrRedshiftEdgeRedundancyV493, createKerrRedshiftEdgeRedundancySummaryV493, parseKerrRedshiftEdgeRedundancyArtifactV493 } from "./kerrRedshiftEdgeRedundancyV493";

const input = JSON.parse(readFileSync("dist/science/kerr-redshift-edge-redundancy-v493/edge-redundancy.json", "utf8"));
const sha = (value: unknown) => createHash("sha256").update(canonicalKerrRedshiftEdgeRedundancyV493(value)).digest("hex");

describe("v493 redshift edge redundancy", () => {
  it("locks six K4 edge deletions and canonical payload", () => {
    const artifact = parseKerrRedshiftEdgeRedundancyArtifactV493(input);
    expect(sha(artifact)).toBe(artifact.artifactSha256);
    expect(sha({ edgeLeverages: artifact.edgeLeverages, deletionCases: artifact.deletionCases })).toBe(artifact.payloadSha256);
    expect(artifact.edgeLeverages.map((edge) => edge.leverageScore)).toEqual(Array(6).fill(0.5));
    expect(artifact.audit.leverageSum).toBe(3);
    expect(artifact.deletionCases).toHaveLength(6);
  });

  it("separates analytic spectra from numerical eigensolver residuals", () => {
    const artifact = parseKerrRedshiftEdgeRedundancyArtifactV493(input);
    for (const entry of artifact.deletionCases) {
      expect(entry.eigenvalues).toEqual([0, 2, 4, 4]);
      expect(entry.numericalEigenvalues).toHaveLength(4);
      expect(entry.eigenvalueResidual).toBeLessThanOrEqual(5e-15);
      expect(Math.abs(entry.nonzeroConditionNumber - 2)).toBeLessThanOrEqual(1e-15);
    }
    expect(artifact.audit.maximumDeletionEigenvalueResidual).toBeLessThanOrEqual(5e-15);
  });

  it("retains rank and predicts every held edge within strict algebraic gates", () => {
    const artifact = parseKerrRedshiftEdgeRedundancyArtifactV493(input);
    for (const entry of artifact.deletionCases) {
      expect(entry.connected).toBe(true);
      expect(entry.laplacianRank).toBe(3);
      expect(entry.gaugeNullity).toBe(1);
      expect(entry.nodeResidual).toBeLessThanOrEqual(1e-15);
      expect(entry.retainedEdgeResidual).toBeLessThanOrEqual(1e-15);
      expect(entry.removedEdgePredictionResidual).toBeLessThanOrEqual(1e-15);
      expect(entry.penroseResidual).toBeLessThanOrEqual(1e-15);
    }
  });

  it("does not relabel deterministic deletion consistency as a statistical jackknife", () => {
    const artifact = parseKerrRedshiftEdgeRedundancyArtifactV493(input);
    expect(artifact.contract.deterministicDeletionConsistencyOnly).toBe(true);
    expect(artifact.contract.statisticalJackknifeAuthorityGranted).toBe(false);
    expect(artifact.contract.noiseRobustnessAuthorityGranted).toBe(false);
    expect(artifact.contract.rssAllowed).toBe(false);
    expect(artifact.boundary.crossEdgeStatisticalCovarianceAuthorityGranted).toBe(false);
    expect(artifact.boundary.scienceRasterAuthorityGranted).toBe(false);
  });

  it("keeps detailed matrices outside the bounded summary", () => {
    const summary = createKerrRedshiftEdgeRedundancySummaryV493(input);
    const serialized = JSON.stringify(summary);
    expect(summary.deletionCases).toHaveLength(6);
    expect(summary.audit.summaryMatrixElementCount).toBe(0);
    expect(serialized).not.toContain("pseudoinverse");
    expect(serialized).not.toContain("uncertaintyOperator");
    expect(serialized).not.toContain('"incidence"');
    expect(serialized).not.toContain('"laplacian"');
  });
});

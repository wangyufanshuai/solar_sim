import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseKerrSpectralEigenmodeAuditArtifactV355 } from "./kerrSpectralEigenmodeAuditV355";

describe("v355 spectral eigenmode audit", () => {
  it("reconstructs the synthetic covariance and exposes bounded uncertainty ellipses", () => {
    const artifact = parseKerrSpectralEigenmodeAuditArtifactV355(
      JSON.parse(
        readFileSync(
          resolve(process.cwd(), "dist/science/kerr-spectral-eigenmode-audit-v355/audit.json"),
          "utf8",
        ),
      ),
    );
    expect(artifact).toMatchObject({
      status: "qualified-synthetic-response-eigenmode-and-ellipse-audit",
      counts: { rayCount: 4, eigenmodeCount: 12, ellipseCount: 12 },
      fullMeasuredEigenmodeAuthority: "unavailable-input-covariance-is-synthetic-not-measured",
      denseCampaignStatus: "incomplete-0-of-49",
    });
    expect(artifact.maxima.orthonormalityDeviation).toBeLessThan(1e-12);
    expect(artifact.maxima.reconstructionRelativeDifference).toBeLessThan(1e-12);
    expect(artifact.maxima.eigenResidualRelativeDifference).toBeLessThan(1e-12);
    expect(artifact.maxima.ellipseAreaOneSigma).toBeGreaterThan(0);
  });
});

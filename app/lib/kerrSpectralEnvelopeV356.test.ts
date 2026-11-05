import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseKerrSpectralEnvelopeArtifactV356 } from "./kerrSpectralEnvelopeV356";

describe("v356 spectral provenance envelope", () => {
  it("reconstructs bounded 2D/3D envelopes and excludes machine metadata", () => {
    const artifact = parseKerrSpectralEnvelopeArtifactV356(JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-spectral-envelope-v356/audit.json"), "utf8")));
    expect(artifact).toMatchObject({ status: "qualified-synthetic-provenance-and-reconstructable-envelope-audit", counts: { envelope2DCount: 12, envelope3DPointCount: 168 }, fullMeasuredEnvelopeAuthority: "unavailable-input-covariance-is-synthetic-not-measured", denseCampaignStatus: "incomplete-0-of-49" });
    expect(artifact.maxima.reconstructionRelativeDifference).toBeLessThan(1e-12);
    expect(artifact.maxima.maximumMahalanobisRadiusDifference).toBeLessThan(1e-12);
    expect(artifact.exports.absolutePathsExcluded).toBe(true);
    expect(artifact.exports.pidExcluded).toBe(true);
  });
});

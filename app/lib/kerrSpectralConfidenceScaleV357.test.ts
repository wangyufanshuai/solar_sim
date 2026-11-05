import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseKerrSpectralConfidenceScaleArtifactV357 } from "./kerrSpectralConfidenceScaleV357";

describe("v357 confidence scale audit", () => {
  it("verifies explicit 1/2/3 sigma scaling without a measured coverage claim", () => {
    const artifact = parseKerrSpectralConfidenceScaleArtifactV357(JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-spectral-confidence-scale-v357/audit.json"), "utf8")));
    expect(artifact).toMatchObject({ status: "qualified-synthetic-multiscale-envelope-audit", counts: { rayCount: 4, levelCount: 3, ellipseLevelCount: 36, ellipsoidLevelCount: 12 }, measuredConfidenceAuthority: "unavailable-synthetic-scale-not-measured-probability-coverage", denseCampaignStatus: "incomplete-0-of-49" });
    expect(artifact.maxima.ellipseRadiusMaximumDifference).toBeLessThan(1e-12);
    expect(artifact.maxima.ellipsoidRadiusMaximumDifference).toBeLessThan(1e-12);
    expect(artifact.maxima.ellipseAreaScaleRelativeDifference).toBeLessThan(1e-15);
  });
});

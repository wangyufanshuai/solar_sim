import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  canonicalShaV415,
  createKerrPolarimeterDetectorLikelihoodSummaryV415,
  createKerrPolarimeterDetectorLikelihoodViewV415,
  parseKerrPolarimeterDetectorLikelihoodArtifactV415,
} from "./kerrPolarimeterDetectorLikelihoodV415";

const detector = JSON.parse(
  readFileSync("dist/science/kerr-polarimeter-detector-count-v414/detector-count.json", "utf8"),
);

describe("v415 deterministic detector noise likelihood", () => {
  it("separates the high-count, small-Poisson, read, and calibration fixtures", () => {
    const first = createKerrPolarimeterDetectorLikelihoodViewV415(detector);
    const second = createKerrPolarimeterDetectorLikelihoodViewV415(detector);
    expect(canonicalShaV415(first)).toBe(canonicalShaV415(second));
    expect(first).toMatchObject({
      counts: { rayCount: 4, analyzerChannelCount: 4, likelihoodRowCount: 16 },
      observedCounts: "unavailable-synthetic-fixture-is-not-observed-detector-data",
      measuredDetectorAuthority: "unavailable-v368-authority-artifacts-missing",
      syntheticFixtureAvailable: true,
      exactSourcePoissonIntegerAvailable: false,
    });
    expect(first.rays.flatMap((ray) => ray.rows)).toHaveLength(16);
    expect(first.maxima.sourceHighCountApproximationIndicator).toBeLessThan(2e-9);
    expect(first.maxima.countingComponentClosureRelative).toBeLessThanOrEqual(1e-15);
    expect(first.maxima.absoluteAdditionLossRelativeToResidual).toBeLessThan(1e-6);
    expect(first.maxima.calibrationCholeskyReconstructionRelative).toBeLessThan(1e-12);
    expect(
      first.rays.every((ray) =>
        ray.rows.every(
          (row) =>
            Number.isInteger(row.darkPoissonDraw) &&
            Number.isInteger(row.backgroundPoissonDraw) &&
            row.observedCountApplicable === false &&
            row.exactSourcePoissonIntegerApplicable === false,
        ),
      ),
    ).toBe(true);
  });

  it("rejects a detector artifact outside the locked v414 authority", () => {
    expect(() =>
      createKerrPolarimeterDetectorLikelihoodViewV415({ ...detector, artifactSha256: "0".repeat(64) }),
    ).toThrow("v415-v414-authority-lock");
  });

  it("parses the oracle-backed artifact and keeps rows out of the summary", () => {
    const artifact = JSON.parse(
      readFileSync("dist/science/kerr-polarimeter-detector-likelihood-v415/noise-likelihood.json", "utf8"),
    );
    expect(parseKerrPolarimeterDetectorLikelihoodArtifactV415(artifact)).toBe(artifact);
    expect(canonicalShaV415(artifact)).toBe(artifact.artifactSha256);
    const summary = createKerrPolarimeterDetectorLikelihoodSummaryV415(artifact);
    expect(summary).toMatchObject({
      likelihoodRowCount: 16,
      exactSourcePoissonIntegerAvailable: false,
      measuredDetectorAuthority: "unavailable-v368-authority-artifacts-missing",
    });
    expect(summary).not.toHaveProperty("rays");
    expect(summary).not.toHaveProperty("view");
  });
});

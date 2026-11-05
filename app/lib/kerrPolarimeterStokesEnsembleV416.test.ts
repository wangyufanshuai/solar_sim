import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  canonicalShaV416,
  createKerrPolarimeterStokesEnsembleSummaryV416,
  createKerrPolarimeterStokesEnsembleViewV416,
  parseKerrPolarimeterStokesEnsembleArtifactV416,
} from "./kerrPolarimeterStokesEnsembleV416";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const photon = read("dist/science/kerr-science-photon-bands-v328/photon-radiance.json");
const profile = readFileSync("dist/science/measured-visible-throughput-v383/profile.csv", "utf8");
const spectral = read("dist/science/kerr-polarimeter-spectral-response-v413/spectral-response.json");
const detector = read("dist/science/kerr-polarimeter-detector-count-v414/detector-count.json");
const likelihood = read("dist/science/kerr-polarimeter-detector-likelihood-v415/noise-likelihood.json");

describe("v416 streaming Stokes ensemble", () => {
  it("recovers noiseless Stokes and qualifies separate counting/calibration pull coverage", () => {
    const first = createKerrPolarimeterStokesEnsembleViewV416(photon.view, profile, spectral, detector, likelihood);
    const second = createKerrPolarimeterStokesEnsembleViewV416(photon.view, profile, spectral, detector, likelihood);
    expect(canonicalShaV416(first)).toBe(canonicalShaV416(second));
    expect(first).toMatchObject({
      trialCountPerRay: 4096,
      totalTrialCount: 16384,
      retainedTrialCount: 4,
      ensembleMethod: "streaming-welford-no-trial-array-retention",
      covarianceCombinationPolicy: "counting-and-calibration-ensembles-independent-and-never-combined",
      observedCounts: "unavailable-synthetic-ensemble-is-not-observed-detector-data",
      publishableMeasurement: false,
    });
    expect(first.rays).toHaveLength(4);
    expect(first.rays.every((ray) => ray.countingPullStatistics.every((entry) => entry.count === 4096))).toBe(true);
    expect(first.metrics.maximumSourceExpectationClosureRelative).toBeLessThan(1e-12);
    expect(first.metrics.maximumNoiselessStokesRecoveryAbsolute).toBeLessThan(1e-12);
    expect(first.metrics.maximumCountingPullMeanAbsolute).toBeLessThan(0.06);
    expect(first.metrics.maximumCalibrationPullMeanAbsolute).toBeLessThan(0.06);
  }, 30_000);

  it("rejects a likelihood artifact outside the locked v415 authority", () => {
    expect(() =>
      createKerrPolarimeterStokesEnsembleViewV416(photon.view, profile, spectral, detector, {
        ...likelihood,
        artifactSha256: "0".repeat(64),
      }),
    ).toThrow("v416-authority-lock");
  });

  it("parses the oracle-backed artifact without exposing matrices in the summary", () => {
    const artifact = read("dist/science/kerr-polarimeter-stokes-ensemble-v416/stokes-ensemble.json");
    expect(parseKerrPolarimeterStokesEnsembleArtifactV416(artifact)).toBe(artifact);
    expect(canonicalShaV416(artifact)).toBe(artifact.artifactSha256);
    const summary = createKerrPolarimeterStokesEnsembleSummaryV416(artifact);
    expect(summary).toMatchObject({ totalTrialCount: 16384, retainedTrialCount: 4 });
    expect(summary).not.toHaveProperty("rays");
    expect(summary).not.toHaveProperty("view");
  });
});

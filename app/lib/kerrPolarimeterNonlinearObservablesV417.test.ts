import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  canonicalShaV417,
  createKerrPolarimeterNonlinearObservablesSummaryV417,
  createKerrPolarimeterNonlinearObservablesViewV417,
  parseKerrPolarimeterNonlinearObservablesArtifactV417,
} from "./kerrPolarimeterNonlinearObservablesV417";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const detector = read("dist/science/kerr-polarimeter-detector-count-v414/detector-count.json");
const ensemble = read("dist/science/kerr-polarimeter-stokes-ensemble-v416/stokes-ensemble.json");

describe("v417 nonlinear polarization observables", () => {
  it("qualifies pL, pC, and axial EVPA coverage without merging noise families", () => {
    const first = createKerrPolarimeterNonlinearObservablesViewV417(detector, ensemble);
    const second = createKerrPolarimeterNonlinearObservablesViewV417(detector, ensemble);
    expect(canonicalShaV417(first)).toBe(canonicalShaV417(second));
    expect(first).toMatchObject({
      trialCountPerRay: 8192,
      totalTrialCount: 32768,
      retainedTrialCount: 4,
      evpaResidual: "axial-wrap-minus-pi-over-two-inclusive-plus-pi-over-two-exclusive",
      covarianceCombinationPolicy: "counting-and-calibration-observable-ensembles-never-combined",
      observedPolarization: "unavailable-synthetic-nonlinear-ensemble-is-not-observed-polarization",
      publishableMeasurement: false,
    });
    expect(first.rays).toHaveLength(4);
    expect(first.metrics.maximumStandardizedBiasAbsolute).toBeLessThan(0.05);
    expect(first.metrics.maximumCoverageOneSigmaError).toBeLessThan(0.02);
    expect(first.metrics.minimumEvpaAxialResultantLength).toBeGreaterThan(0.999);
    expect(first.metrics.physicalConeViolationCount).toBe(0);
  }, 45_000);

  it("rejects an ensemble artifact outside the locked v416 authority", () => {
    expect(() =>
      createKerrPolarimeterNonlinearObservablesViewV417(detector, {
        ...ensemble,
        artifactSha256: "0".repeat(64),
      }),
    ).toThrow("v417-authority-lock");
  });

  it("parses the oracle-backed artifact without exposing ray covariance in the summary", () => {
    const artifact = read("dist/science/kerr-polarimeter-nonlinear-observables-v417/nonlinear-observables.json");
    expect(parseKerrPolarimeterNonlinearObservablesArtifactV417(artifact)).toBe(artifact);
    expect(canonicalShaV417(artifact)).toBe(artifact.artifactSha256);
    const summary = createKerrPolarimeterNonlinearObservablesSummaryV417(artifact);
    expect(summary).toMatchObject({ totalTrialCount: 32768, retainedTrialCount: 4 });
    expect(summary).not.toHaveProperty("rays");
    expect(summary).not.toHaveProperty("view");
  });
});

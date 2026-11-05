import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canonicalKerrBandpassRedshiftCommutatorV534,
  compareKerrBandpassRedshiftHudEncodingsV534,
  createKerrBandpassRedshiftCommutatorSummaryV534,
  createKerrBandpassRedshiftHudEncodingV534,
  parseKerrBandpassRedshiftCommutatorArtifactV534,
} from "./kerrBandpassRedshiftCommutatorV534";

const artifact = parseKerrBandpassRedshiftCommutatorArtifactV534(
  JSON.parse(readFileSync("dist/science/kerr-bandpass-redshift-commutator-v534/atlas.json", "utf8")),
);

describe("v534 bandpass-redshift commutator", () => {
  it("is canonical and locks the real physical operator", () => {
    expect(createHash("sha256").update(canonicalKerrBandpassRedshiftCommutatorV534(artifact)).digest("hex"))
      .toBe(artifact.artifactSha256);
    expect(artifact.operator).toMatchObject({
      observerResponse: "eta(lambda_observer)",
      frozenEmitterApproximation: "eta(g-times-lambda-observer)",
      responseAppliedExactlyOnce: true,
    });
    expect(artifact.rows).toHaveLength(4);
    expect(artifact.rows.every((row) => row.redshiftBandpassCommutatorRelative > 0)).toBe(true);
  });

  it("keeps independent formulations under frozen thresholds", () => {
    expect(artifact.maxima.v384ObserverBandpassRelativeDifference).toBeLessThan(1e-7);
    expect(artifact.maxima.pythonFrequencyDomainRelativeDifference).toBeLessThan(1e-7);
    expect(artifact.maxima.pythonCommutatorAbsoluteDifference).toBeLessThan(1e-7);
    expect(artifact.maxima.unitRedshiftIdentityResidual).toBeLessThan(1e-12);
  });

  it("keeps Science and Cinematic rows identical", () => {
    const summary = createKerrBandpassRedshiftCommutatorSummaryV534(artifact);
    expect(compareKerrBandpassRedshiftHudEncodingsV534(
      createKerrBandpassRedshiftHudEncodingV534(summary, "science"),
      createKerrBandpassRedshiftHudEncodingV534(summary, "cinematic"),
    )).toMatchObject({
      scientificGeometryInputCount: 4,
      numericScientificStyleInputCount: 0,
      scientificFieldMutation: false,
    });
  });

  it("does not fabricate detector or image authority", () => {
    expect(artifact.boundary).toMatchObject({
      sourceDossierStatus: "incomplete-1-of-7",
      measuredCalibrationFiles: 0,
      electronExpectationAvailable: false,
      observedCountsAvailable: false,
      scienceRasterAvailable: false,
    });
  });
});

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  createMeasuredVisiblePhotonObservableV384,
  parseMeasuredVisiblePhotonObservableArtifactV384,
} from "./measuredVisiblePhotonObservableV384";

describe("v384 visible throughput-weighted photon observable", () => {
  it("reconstructs the v328 visible integral before applying throughput", () => {
    const photon = JSON.parse(
      readFileSync(
        "dist/science/kerr-science-photon-bands-v328/photon-radiance.json",
        "utf8",
      ),
    );
    const profile = readFileSync(
      "dist/science/measured-visible-throughput-v383/profile.csv",
      "utf8",
    );
    const result = createMeasuredVisiblePhotonObservableV384(
      photon.view,
      profile,
    );
    expect(result.rows).toHaveLength(4);
    expect(result.maxima.unweightedReconstructionRelativeDifference).toBeLessThan(
      1e-7,
    );
    expect(
      result.rows.every(
        (row) =>
          row.throughputWeightedPhotonRadiancePerSM2Sr <
            row.reconstructedUnweightedPhotonRadiancePerSM2Sr &&
          row.electronExpectationApplicable === false,
      ),
    ).toBe(true);
  });

  it("parses only the dual-domain photon observable with electron authority withheld", () => {
    const artifact = parseMeasuredVisiblePhotonObservableArtifactV384(
      JSON.parse(
        readFileSync(
          "dist/science/measured-visible-photon-observable-v384/observable.json",
          "utf8",
        ),
      ),
    );
    expect(artifact.algorithms.integrationDomainIndependent).toBe(true);
    expect(artifact.authorityBoundary.photonObservableQualified).toBe(true);
    expect(artifact.authorityBoundary.detectorElectronExpectationAvailable).toBe(
      false,
    );
  });
});

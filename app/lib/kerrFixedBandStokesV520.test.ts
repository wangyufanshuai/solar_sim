import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canonicalKerrFixedBandStokesV520,
  parseKerrFixedBandStokesArtifactV520,
} from "./kerrFixedBandStokesV520";

const artifact = parseKerrFixedBandStokesArtifactV520(
  JSON.parse(
    readFileSync(
      "dist/science/kerr-fixed-band-stokes-v520/stokes-payload.json",
      "utf8",
    ),
  ),
);

describe("v520 fixed-band Stokes authority", () => {
  it("has one cross-language identity and complete 4 x 3 x 2 coverage", () => {
    expect(
      createHash("sha256")
        .update(canonicalKerrFixedBandStokesV520(artifact))
        .digest("hex"),
    ).toBe(artifact.artifactSha256);
    expect(artifact.rows).toHaveLength(24);
    expect(new Set(artifact.rows.map((row) => row.rayIndex))).toEqual(
      new Set([12, 13, 14, 15]),
    );
    expect(new Set(artifact.rows.map((row) => row.bandId))).toEqual(
      new Set(["visible", "euv", "soft-x-ray"]),
    );
    expect(new Set(artifact.rows.map((row) => row.transportMethod))).toEqual(
      new Set(["walker-penrose", "independent-ks-parallel-transport"]),
    );
  });

  it("keeps both transport paths separate and below frozen limits", () => {
    expect(artifact.oracle.methodValuesAveraged).toBe(false);
    expect(artifact.oracle.independentTransportPathsPreserved).toBe(true);
    expect(Number(artifact.maxima.linearFractionResidual)).toBeLessThan(
      Number(artifact.limits.linearFractionResidual),
    );
    expect(Number(artifact.maxima.evpaReconstructionDeg)).toBeLessThan(
      Number(artifact.limits.evpaReconstructionDeg),
    );
    expect(Number(artifact.maxima.wpKsEvpaDifferenceDeg)).toBeLessThan(
      Number(artifact.limits.wpKsEvpaDifferenceDeg),
    );
    expect(Number(artifact.maxima.physicalConeViolation)).toBe(0);
  });

  it("does not promote predicted linear Stokes to measured authority", () => {
    expect(artifact.counts).toMatchObject({
      measuredStokesRowCount: 0,
      circularStokesRowCount: 0,
      detectorProjectedRowCount: 0,
      sciencePixelRowCount: 0,
    });
    expect(artifact.boundary).toMatchObject({
      modelPredictionOnly: true,
      measuredPolarimeterAvailable: false,
      measuredMuellerCalibrationAvailable: false,
      circularPolarizationAvailable: false,
      faradayRotationAvailable: false,
      denseCampaignStatus: "incomplete-0-of-49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    });
  });
});

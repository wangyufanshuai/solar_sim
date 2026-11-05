import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canonicalKerrFixedBandRadiometryOracleV519,
  parseKerrFixedBandRadiometryOracleArtifactV519,
} from "./kerrFixedBandRadiometryOracleV519";

const artifact = parseKerrFixedBandRadiometryOracleArtifactV519(
  JSON.parse(
    readFileSync(
      "dist/science/kerr-fixed-band-radiometry-oracle-v519/oracle.json",
      "utf8",
    ),
  ),
);

describe("v519 fixed-band multiprecision radiometry oracle", () => {
  it("has cross-language canonical identity and complete 4×3 coverage", () => {
    expect(
      createHash("sha256")
        .update(canonicalKerrFixedBandRadiometryOracleV519(artifact))
        .digest("hex"),
    ).toBe(artifact.artifactSha256);
    expect(artifact.rows).toHaveLength(12);
    expect(new Set(artifact.rows.map((row) => row.rayIndex))).toEqual(
      new Set([12, 13, 14, 15]),
    );
    expect(new Set(artifact.rows.map((row) => row.bandId))).toEqual(
      new Set(["visible", "euv", "soft-x-ray"]),
    );
  });

  it("keeps all independent differences below frozen limits", () => {
    expect(Number(artifact.maxima.energyRadianceRelativeDifference)).toBeLessThan(
      Number(artifact.limits.energyRadianceRelativeDifference),
    );
    expect(Number(artifact.maxima.photonRadianceRelativeDifference)).toBeLessThan(
      Number(artifact.limits.photonRadianceRelativeDifference),
    );
    expect(Number(artifact.maxima.meanFrequencyRelativeDifference)).toBeLessThan(
      Number(artifact.limits.meanFrequencyRelativeDifference),
    );
    expect(Number(artifact.maxima.g3TransferRelativeDifference)).toBeLessThan(
      Number(artifact.limits.transferCoefficientRelativeDifference),
    );
    expect(Number(artifact.maxima.g4TransferRelativeDifference)).toBeLessThan(
      Number(artifact.limits.transferCoefficientRelativeDifference),
    );
  });

  it("does not promote model radiometry to measured detector authority", () => {
    expect(artifact.counts.measuredRadianceRowCount).toBe(0);
    expect(artifact.qualification.productionMeasuredRadiometryQualified).toBe(false);
    expect(artifact.boundary).toMatchObject({
      modelPredictionOnly: true,
      measuredEmitterSpectrumAvailable: false,
      detectorThroughputAvailable: false,
      observedDetectorCountsAvailable: false,
      scienceRasterAuthorityAvailable: false,
      denseCampaignStatus: "incomplete-0-of-49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    });
  });
});

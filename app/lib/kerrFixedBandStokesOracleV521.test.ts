import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canonicalKerrFixedBandStokesOracleV521,
  parseKerrFixedBandStokesOracleArtifactV521,
} from "./kerrFixedBandStokesOracleV521";

const artifact = parseKerrFixedBandStokesOracleArtifactV521(
  JSON.parse(
    readFileSync(
      "dist/science/kerr-fixed-band-stokes-oracle-v521/oracle.json",
      "utf8",
    ),
  ),
);

describe("v521 direct fixed-band Stokes oracle", () => {
  it("has cross-language identity and 144 direct adaptive integrals", () => {
    expect(
      createHash("sha256")
        .update(canonicalKerrFixedBandStokesOracleV521(artifact))
        .digest("hex"),
    ).toBe(artifact.artifactSha256);
    expect(artifact.rows).toHaveLength(24);
    expect(artifact.counts.directAdaptiveIntegralCount).toBe(144);
    expect(artifact.oracle.v520IntegratedValuesConsumedAsInputs).toBe(false);
    expect(artifact.oracle.v520ValuesUsedForComparisonOnly).toBe(true);
  });

  it("keeps all six direct component comparisons below the frozen limit", () => {
    const limit = Number(artifact.limits.directVsV520ComponentRelative);
    for (const value of [
      artifact.maxima.directVsV520EnergyIRelative,
      artifact.maxima.directVsV520EnergyQRelative,
      artifact.maxima.directVsV520EnergyURelative,
      artifact.maxima.directVsV520PhotonIRelative,
      artifact.maxima.directVsV520PhotonQRelative,
      artifact.maxima.directVsV520PhotonURelative,
    ]) {
      expect(Number(value)).toBeLessThan(limit);
    }
  });

  it("uses componentwise uncertainty without RSS or scalar totals", () => {
    expect(artifact.uncertaintyPolicy).toMatchObject({
      componentwiseOnly: true,
      crossChannelIndependenceProven: false,
      rssApplied: false,
      scalarTotalAvailable: false,
      correlationModelAvailable: false,
    });
    expect(artifact.rows.every((row) => !row.uncertaintyEnvelope.rssApplied)).toBe(true);
  });

  it("keeps measurements, dense images and product promotion unavailable", () => {
    expect(artifact.counts.measuredStokesRowCount).toBe(0);
    expect(artifact.counts.circularStokesRowCount).toBe(0);
    expect(artifact.boundary).toMatchObject({
      measuredPolarimeterAvailable: false,
      measuredMuellerCalibrationAvailable: false,
      scienceRasterAuthorityAvailable: false,
      denseCampaignStatus: "incomplete-0-of-49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    });
  });
});

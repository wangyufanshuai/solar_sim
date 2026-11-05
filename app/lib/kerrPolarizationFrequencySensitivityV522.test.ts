import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canonicalKerrPolarizationFrequencySensitivityV522,
  parseKerrPolarizationFrequencySensitivityArtifactV522,
} from "./kerrPolarizationFrequencySensitivityV522";

const artifact = parseKerrPolarizationFrequencySensitivityArtifactV522(
  JSON.parse(
    readFileSync(
      "dist/science/kerr-polarization-frequency-sensitivity-v522/envelope.json",
      "utf8",
    ),
  ),
);

describe("v522 frequency-dependent polarization sensitivity", () => {
  it("has canonical 3 x 3 scenario coverage and 888 direct integrals", () => {
    expect(
      createHash("sha256")
        .update(canonicalKerrPolarizationFrequencySensitivityV522(artifact))
        .digest("hex"),
    ).toBe(artifact.artifactSha256);
    expect(artifact.scenarioPlan).toHaveLength(9);
    expect(artifact.scenarioRows).toHaveLength(216);
    expect(artifact.envelopes).toHaveLength(24);
    expect(artifact.counts.directAdaptiveIntegralCount).toBe(888);
  });

  it("reconstructs v521 baseline below the frozen limit", () => {
    const limit = Number(artifact.limits.baselineVsV521ComponentRelative);
    for (const value of [
      artifact.maxima.baselineVsV521EnergyIRelative,
      artifact.maxima.baselineVsV521EnergyQRelative,
      artifact.maxima.baselineVsV521EnergyURelative,
      artifact.maxima.baselineVsV521PhotonIRelative,
      artifact.maxima.baselineVsV521PhotonQRelative,
      artifact.maxima.baselineVsV521PhotonURelative,
    ]) {
      expect(Number(value)).toBeLessThan(limit);
    }
  });

  it("labels the envelope as an uncalibrated non-probabilistic stress test", () => {
    expect(artifact.model).toMatchObject({
      perturbationCalibration: "unavailable",
      physicalPrior: "unavailable",
      stressTestOnly: true,
    });
    expect(artifact.uncertaintyPolicy).toMatchObject({
      probabilityDistributionAvailable: false,
      crossScenarioIndependenceProven: false,
      rssApplied: false,
      scalarTotalAvailable: false,
      combinationWithNumericalUncertaintyAllowed: false,
    });
    expect(artifact.qualification.scienceAuthorityPromotionAllowed).toBe(false);
  });

  it("keeps measurement, dense and formal product boundaries closed", () => {
    expect(artifact.counts.measuredStokesRowCount).toBe(0);
    expect(artifact.boundary).toMatchObject({
      measuredPolarimeterAvailable: false,
      scienceRasterAuthorityAvailable: false,
      denseCampaignStatus: "incomplete-0-of-49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    });
  });
});

import { describe, expect, it } from "vitest";
import {
  evaluateMeasuredAuthorityBandSetV381,
  evaluateMeasuredAuthorityBandV381,
  type MeasuredAuthorityBandInputV381,
} from "./measuredAuthorityBandIdentityV381";

const SHA = "a".repeat(64);
const ranges = {
  visible: [4.2827494e14, 7.49481145e14],
  euv: [2.4776236e15, 2.41798924e16],
  "soft-x-ray": [2.41798924e16, 4.83597848e17],
} as const;

function lane(
  bandId: keyof typeof ranges,
  instrument: string,
): MeasuredAuthorityBandInputV381 {
  const [requiredLowerFrequencyHz, requiredUpperFrequencyHz] = ranges[bandId];
  return {
    bandId,
    requiredLowerFrequencyHz,
    requiredUpperFrequencyHz,
    detector: {
      instrumentSerialOrCampaignId: instrument,
      authorityPointerSha256: SHA,
      artifactCanonicalSha256: SHA,
      qualified: true,
      lowerFrequencyHz: requiredLowerFrequencyHz,
      upperFrequencyHz: requiredUpperFrequencyHz,
    },
    geometry: {
      instrumentSerialOrCampaignId: instrument,
      authorityPointerSha256: SHA,
      artifactCanonicalSha256: SHA,
      qualified: true,
    },
  };
}

describe("v381 measured authority per-band identity", () => {
  it("qualifies three independent real-instrument lanes without forcing cross-band identity", () => {
    const result = evaluateMeasuredAuthorityBandSetV381([
      lane("visible", "visible-instrument-001"),
      lane("euv", "euv-instrument-002"),
      lane("soft-x-ray", "xray-instrument-003"),
    ]);
    expect(result.status).toBe("qualified-three-band-authority-set");
    expect(result.qualifiedBandCount).toBe(3);
    expect(result.uniqueInstrumentCount).toBe(3);
    expect(result.crossBandInstrumentIdentityRequired).toBe(false);
    expect(result.observedCountsAvailable).toBe(false);
  });

  it("fails closed when detector and geometry identities differ within a band", () => {
    const input = lane("visible", "visible-instrument-001");
    const result = evaluateMeasuredAuthorityBandV381({
      ...input,
      geometry: {
        ...input.geometry,
        instrumentSerialOrCampaignId: "other-instrument-999",
      },
    });
    expect(result.authorityQualified).toBe(false);
    expect(result.reasons).toEqual(["instrument-identity-mismatch"]);
  });

  it("rejects incomplete detector frequency coverage", () => {
    const input = lane("soft-x-ray", "xray-instrument-003");
    const result = evaluateMeasuredAuthorityBandV381({
      ...input,
      detector: {
        ...input.detector,
        upperFrequencyHz: input.requiredUpperFrequencyHz * 0.5,
      },
    });
    expect(result.reasons).toContain("detector-band-coverage-incomplete");
  });

  it("requires all three unique band lanes for a three-band science image", () => {
    expect(() =>
      evaluateMeasuredAuthorityBandSetV381([
        lane("visible", "visible-instrument-001"),
        lane("euv", "euv-instrument-002"),
      ]),
    ).toThrow("v381-band-set-coverage");
  });
});

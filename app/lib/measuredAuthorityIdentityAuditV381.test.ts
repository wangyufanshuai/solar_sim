import { describe, expect, it } from "vitest";
import {
  createMeasuredAuthorityIdentityLanesV381,
  parseMeasuredAuthorityIdentityAuditV381,
} from "./measuredAuthorityIdentityAuditV381";

const SHA = "a".repeat(64);

describe("v381 measured authority identity audit", () => {
  it("derives finite ordered frequency and wavelength ranges from v320", () => {
    const lanes = createMeasuredAuthorityIdentityLanesV381();
    expect(lanes.map((lane) => lane.bandId)).toEqual([
      "visible",
      "euv",
      "soft-x-ray",
    ]);
    expect(
      lanes.every(
        (lane) =>
          lane.upperFrequencyHz > lane.lowerFrequencyHz &&
          lane.upperWavelengthM > lane.lowerWavelengthM,
      ),
    ).toBe(true);
  });

  it("accepts only the fail-closed zero-input corrected audit boundary", () => {
    const audit = {
      version: "v381-measured-authority-identity-audit-v1",
      generatedAt: "2026-07-29T00:00:00.000Z",
      status: "identity-model-corrected-three-band-lanes-ready-inputs-0-of-3",
      legacyModel: {
        readinessArtifactSha256: SHA,
        readinessStructuralContractsQualified: "7/7",
        measuredInputsPresent: "0/7",
        singleManifestBandCount: 3,
        singleGeometryIdentityCount: 1,
        scientificFusionEligibility:
          "withdrawn-single-instrument-three-band-identity-not-demonstrated",
        historicalArtifactsMutated: false,
      },
      correctedModel: {
        authorityUnit: "detector-response-plus-geometry-per-band",
        bandLaneCount: 3,
        qualifiedBandLaneCount: 0,
        sameBandInstrumentIdentityRequired: true,
        crossBandInstrumentIdentityRequired: false,
        allBandsRequiredForThreeBandImage: true,
        partialBandScienceAllowed: false,
        observedCountsAvailable: false,
      },
      lanes: createMeasuredAuthorityIdentityLanesV381(),
      sourceSha256: {
        v320BandDefinitions: SHA,
        v361DetectorManifestContract: SHA,
        v369MeasuredExpectationOperator: SHA,
        v375DualAuthorityContract: SHA,
      },
      findings: [
        "v361-binds-visible-euv-soft-x-ray-to-one-instrument-manifest",
        "v369-v375-bind-all-three-bands-to-one-observation-geometry-identity",
        "real-authority-requires-per-band-detector-and-matching-geometry",
      ],
      nextRequiredInput:
        "one-traceable-measured-detector-and-geometry-pair-for-one-band",
      authorityPromotionAllowed: false,
      syntheticFallbackUsed: false,
      sciencePayloadMutationAllowed: false,
      cinematicConsumerAllowed: false,
      attemptConsumed: false,
      networkAttempted: false,
      formalProductPointer: "v263",
      denseCampaignStatus: "incomplete-0-of-49",
      browserQualification: "not-run",
      artifactSha256: SHA,
    } as const;
    expect(parseMeasuredAuthorityIdentityAuditV381(audit)).toBe(audit);
  });
});

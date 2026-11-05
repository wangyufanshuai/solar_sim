import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { MeasuredExpectationAuthorityEnvelopeV375 } from "./measuredExpectationAuthorityV375";
import {
  createExpectedElectronScienceImageV376,
  EXPECTED_ELECTRON_SCIENCE_IMAGE_CONSERVATION_LIMIT_V376,
} from "./expectedElectronScienceImageV376";

const SHA = "a".repeat(64);
const bands = ["visible", "euv", "soft-x-ray"] as const;

function envelope(): MeasuredExpectationAuthorityEnvelopeV375 {
  const rows = [12, 13, 14, 15].flatMap((rayIndex, rayOffset) =>
    bands.map((bandId, bandOffset) => {
      const source = 10 + rayOffset * 3 + bandOffset;
      const dark = 2;
      const background = 3;
      const readNoiseVariance = 4;
      const total = source + dark + background;
      const variance = total + readNoiseVariance;
      return {
        rayIndex,
        bandId,
        throughputWeightedPhotonRadiancePerSM2Sr: 1e20,
        effectiveBandThroughput: 0.5,
        sourceElectronExpectation: source,
        darkElectronExpectation: dark,
        backgroundElectronExpectation: background,
        readNoiseVarianceElectronSquared: readNoiseVariance,
        totalElectronExpectation: total,
        expectedAdu: total / 2,
        varianceElectronSquared: variance,
        standardDeviationElectron: Math.sqrt(variance),
        quadratureRelativeDifference: 1e-8,
        componentSumRelativeDifference: 0,
      };
    }),
  );
  return {
    version: "v375-dual-authority-measured-expectation-envelope-v1",
    status: "qualified-dual-authority-measured-expectation",
    detectorAuthorityQualified: true,
    geometryAuthorityQualified: true,
    measuredExpectationAvailable: true,
    instrumentIdentityMatched: true,
    expectation: {
      version: "v369-authority-gated-measured-photon-expectation-v1",
      status: "qualified-measured-expectation-operator",
      authorityGranted: true,
      observationGeometryQualified: true,
      measuredExpectationAvailable: true,
      unavailableReasons: [],
      rows,
      counts: { rayCount: 4, bandCount: 3, expectationRowCount: 12 },
      maxima: {
        quadratureRelativeDifference: 1e-8,
        totalElectronExpectation: 26,
        standardDeviationElectron: Math.sqrt(30),
      },
      provenance: {
        fullShortAuthoritySha256: SHA,
        authorityPointerSha256: SHA,
        admissionArtifactSha256: SHA,
        manifestFileSha256: SHA,
        manifestCanonicalSha256: SHA,
        observationGeometryArtifactSha256: SHA,
      },
      operator:
        "expected-electrons = throughput-weighted-photon-radiance × collecting-area × pixel-solid-angle × exposure-time",
      varianceModel:
        "independent-poisson-source-dark-background-plus-read-noise-variance-explicit-assumption",
      summation: "neumaier-float64-componentwise-budget-preserved",
      observedCounts: "unavailable-expectation-is-not-observed-detector-counts",
      interbandCovariance: "unavailable-no-measured-cross-band-count-covariance",
      syntheticFallbackUsed: false,
      sciencePayloadMutationAllowed: false,
      cinematicConsumerAllowed: false,
      denseCampaignStatus: "incomplete-0-of-49",
      browserQualification: "not-run",
      boundary:
        "measured-expectation-only-no-random-sampling-no-observed-count-or-cinematic-claim",
    },
    counts: { rayCount: 4, bandCount: 3, expectationRowCount: 12 },
    provenance: {
      detectorAuthorityPointerSha256: SHA,
      detectorAdmissionArtifactSha256: SHA,
      geometryAuthorityPointerSha256: SHA,
      geometryAdmissionArtifactSha256: SHA,
      geometryPublicationReceiptSha256: SHA,
      geometryArtifactSha256: SHA,
      photonArtifactSha256: SHA,
    },
    observedCounts: "unavailable-expectation-is-not-observed-detector-counts",
    syntheticFallbackUsed: false,
    sciencePayloadMutationAllowed: false,
    cinematicConsumerAllowed: false,
    formalProductPointer: "v263",
    denseCampaignStatus: "incomplete-0-of-49",
    browserQualification: "not-run",
    boundary:
      "dual-authority-envelope-never-converts-expectation-into-observed-counts-or-cinematic-input",
  };
}

describe("v376 expected electron science image", () => {
  it("returns unavailable without creating zero-valued image layers", () => {
    expect(createExpectedElectronScienceImageV376(null, null)).toMatchObject({
      status: "unavailable-dual-authority-envelope",
      imageAvailable: false,
      product: null,
      provenance: null,
      observedCounts: "unavailable-expectation-is-not-observed-detector-counts",
      syntheticFallbackUsed: false,
      cinematicConsumerAllowed: false,
    });
  });

  it("maps 12 expectations into deterministic 4 by 3 float64 layers", () => {
    const image = createExpectedElectronScienceImageV376(envelope(), SHA);
    expect(image).toMatchObject({
      status: "qualified-expected-electron-science-image",
      imageAvailable: true,
      product: {
        counts: { rowCount: 4, columnCount: 3, cellCount: 12 },
        bandOrder: bands,
        rayOrder: [12, 13, 14, 15],
        display: {
          transform: "identity-linear-float64-no-normalization",
          exposure: 1,
          bloom: 0,
          noise: 0,
          colorGrade: "none",
        },
        cinematicCopy: null,
      },
      provenance: { envelopeArtifactSha256: SHA },
    });
    expect(image.product?.cells).toHaveLength(12);
    expect(image.product?.layers.totalElectronExpectation).toHaveLength(12);
    expect(image.product?.layers.varianceElectronSquared).toHaveLength(12);
    expect(image.product?.maximumComponentSumRelativeDifference).toBeLessThanOrEqual(
      EXPECTED_ELECTRON_SCIENCE_IMAGE_CONSERVATION_LIMIT_V376,
    );
    expect(
      image.product?.maximumVarianceReconstructionRelativeDifference,
    ).toBeLessThanOrEqual(EXPECTED_ELECTRON_SCIENCE_IMAGE_CONSERVATION_LIMIT_V376);
    expect(image.product?.inferredGainElectronPerAdu).toBe(2);
  });

  it("rejects missing cells and nonconservative values", () => {
    const missing = envelope();
    expect(() =>
      createExpectedElectronScienceImageV376(
        {
          ...missing,
          expectation: {
            ...missing.expectation,
            rows: missing.expectation.rows.slice(0, 11),
          },
        },
        SHA,
      ),
    ).toThrow("v376-envelope-boundary");
    const drifted = envelope();
    expect(() =>
      createExpectedElectronScienceImageV376(
        {
          ...drifted,
          expectation: {
            ...drifted.expectation,
            rows: drifted.expectation.rows.map((row, index) =>
              index === 0
                ? { ...row, totalElectronExpectation: row.totalElectronExpectation * 1.01 }
                : row,
            ),
          },
        },
        SHA,
      ),
    ).toThrow("v376-conservation");
  });

  it("keeps the product builder JSON/CSV-only and non-cinematic", () => {
    const source = readFileSync("scripts/build-expected-electron-image-v376.ts", "utf8");
    expect(source).toContain("createExpectedElectronScienceImageV376");
    expect(source).toContain("expected-electron-image-v376/image.json");
    expect(source).toContain("expected-electron-image-v376/image.csv");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("bloom");
    expect(source).not.toContain("fetch(");
  });
});

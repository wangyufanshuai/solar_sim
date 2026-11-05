import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { DetectorCalibrationManifestV361 } from "./detectorCalibrationAdmissionV361";
import type { DetectorCalibrationAuthorityDecisionV367 } from "./detectorCalibrationAuthorityAdmissionV367";
import type { DetectorCalibrationAuthorityEnvelopeV367, DetectorCalibrationAuthorityPointerV367 } from "./detectorResponseAuthorityGateV368";
import { parseKerrSciencePhotonBandViewV328, type KerrSciencePhotonBandViewV328 } from "./kerrSciencePhotonBandsV328";
import { createMeasuredPhotonExpectationV369, parseMeasuredObservationGeometryV369 } from "./measuredPhotonExpectationV369";

const SPEED_OF_LIGHT_M_S = 299_792_458;
const canonicalSha = "a".repeat(64); const manifestFileSha = "b".repeat(64);
const photonView = parseKerrSciencePhotonBandViewV328((JSON.parse(readFileSync("dist/science/kerr-science-photon-bands-v328/photon-radiance.json", "utf8")) as { view: unknown }).view);
function buildManifest(view: KerrSciencePhotonBandViewV328): DetectorCalibrationManifestV361 {
  const measurements = view.rays[0].measurements;
  return {
    version: "v361-measured-detector-calibration-manifest-v1", measuredCalibration: true,
    instrument: { manufacturer: "Observatory", model: "Detector", serialOrCampaignId: "campaign-001" },
    calibration: { performedAtUtc: "2026-07-29T00:00:00Z", laboratoryOrArchive: "Observatory Lab", detectorTemperatureK: 170, exposureTimeS: 120 },
    response: { bands: measurements.map((measurement) => {
      const lower = SPEED_OF_LIGHT_M_S / measurement.bandUpperFrequencyHz * (1 - 1e-12); const upper = SPEED_OF_LIGHT_M_S / measurement.bandLowerFrequencyHz * (1 + 1e-12); const width = upper - lower;
      return { bandId: measurement.bandId, wavelengthUnit: "m" as const, throughputUnit: "dimensionless" as const, points: [0, 0.25, 0.5, 0.75, 1].map((fraction, index) => ({ wavelengthM: lower + fraction * width, throughput: [0.2, 0.55, 0.8, 0.55, 0.2][index] })) };
    }) },
    noise: { readNoiseRmsUnit: "electron/pixel/read", readNoiseRms: 2, darkCurrentUnit: "electron/pixel/s", darkCurrent: 0.01, gainUnit: "electron/adu", gain: 1.5, backgroundUnit: "electron/pixel/exposure", background: 3 },
    provenance: { sourceUrl: "https://observatory.example/calibration", licenseOrTerms: "measured terms", rawArtifactSha256: "c".repeat(64), normalizedArtifactSha256: "d".repeat(64), processingParametersSha256: "e".repeat(64) },
  };
}
const manifest = buildManifest(photonView);
const decision = { version: "v367-detector-calibration-authority-admission-v1", status: "qualified-measured-authority-local-shadow-only", authorityGranted: true, authorityScope: "local-shadow-measured-detector-response-only", identities: { compilerManifestCanonicalSha256: canonicalSha, validationManifestCanonicalSha256: canonicalSha, conditioningManifestCanonicalSha256: canonicalSha, compiledArtifactSha256: "f".repeat(64), validationArtifactSha256: "1".repeat(64), measuredManifestFileSha256: manifestFileSha, conditioningFileSha256: "2".repeat(64) }, sciencePayloadMutationAllowed: false, cinematicMutationAllowed: false, productPromotionAllowed: false, formalProductPointer: "v263", denseCampaignStatus: "incomplete-0-of-49" } as DetectorCalibrationAuthorityDecisionV367;
const admission = { version: "v367-detector-calibration-authority-envelope-v1", generatedAt: "2026-07-29T00:00:00Z", status: decision.status, decision, validationArtifactSha256: "1".repeat(64), attemptConsumed: true, networkAttempted: false, automaticPromotionApplied: false, formalProductPointer: "v263", denseCampaignStatus: "incomplete-0-of-49", browserQualification: "not-run", artifactSha256: "3".repeat(64) } as DetectorCalibrationAuthorityEnvelopeV367;
const authorityPointer = { version: "v367-detector-calibration-authority-pointer-v1", status: "qualified-measured-authority-local-shadow-only", authorityGranted: true, admissionArtifactSha256: admission.artifactSha256, validationArtifactSha256: admission.validationArtifactSha256, manifestFileSha256: manifestFileSha, manifestCanonicalSha256: canonicalSha, instrumentSerialOrCampaignId: "campaign-001", localShadowOnly: true, productPromotionAllowed: false, formalProductPointer: "v263", denseCampaignStatus: "incomplete-0-of-49", pointerSha256: "4".repeat(64) } as DetectorCalibrationAuthorityPointerV367;
const geometry = parseMeasuredObservationGeometryV369({ version: "v369-measured-observation-geometry-v1", sourceKind: "measured-instrument-geometry", instrumentSerialOrCampaignId: "campaign-001", collectingAreaM2: 0.75, pixelSolidAngleSr: (Math.PI / (180 * 3600)) ** 2, provenance: { sourceUrl: "https://observatory.example/geometry", licenseOrTerms: "instrument geometry terms", artifactSha256: "5".repeat(64) } });
const complete = { photonView, admission, authorityPointer, manifest, verifiedManifestFileSha256: manifestFileSha, verifiedManifestCanonicalSha256: canonicalSha, observationGeometry: geometry } as const;

describe("v369 authority-gated measured photon expectation", () => {
  it("returns unavailable without authority and geometry and never substitutes v332", () => {
    expect(createMeasuredPhotonExpectationV369({ ...complete, admission: null, authorityPointer: null, manifest: null, verifiedManifestFileSha256: null, verifiedManifestCanonicalSha256: null, observationGeometry: null })).toMatchObject({ status: "unavailable-authority-or-observation-geometry", authorityGranted: false, observationGeometryQualified: false, measuredExpectationAvailable: false, rows: [], counts: { expectationRowCount: 0 }, syntheticFallbackUsed: false, observedCounts: "unavailable-expectation-is-not-observed-detector-counts" });
  });

  it("performs full-band measured throughput convolution and an explicit electron variance budget", () => {
    const beforePhoton = JSON.stringify(photonView); const beforeManifest = JSON.stringify(manifest);
    const result = createMeasuredPhotonExpectationV369(complete);
    expect(result).toMatchObject({ status: "qualified-measured-expectation-operator", authorityGranted: true, observationGeometryQualified: true, measuredExpectationAvailable: true, counts: { rayCount: 4, bandCount: 3, expectationRowCount: 12 }, observedCounts: "unavailable-expectation-is-not-observed-detector-counts", interbandCovariance: "unavailable-no-measured-cross-band-count-covariance", syntheticFallbackUsed: false, sciencePayloadMutationAllowed: false, cinematicConsumerAllowed: false });
    expect(result.maxima?.quadratureRelativeDifference).toBeLessThan(5e-6);
    expect(result.rows.every((row) => row.darkElectronExpectation > 0 && row.backgroundElectronExpectation > 0 && row.readNoiseVarianceElectronSquared > 0 && row.expectedAdu > 0 && row.componentSumRelativeDifference <= 1e-15)).toBe(true);
    expect(JSON.stringify(photonView)).toBe(beforePhoton); expect(JSON.stringify(manifest)).toBe(beforeManifest);
  });

  it("fails closed on observation identity or incomplete wavelength coverage", () => {
    expect(() => createMeasuredPhotonExpectationV369({ ...complete, observationGeometry: { ...geometry, instrumentSerialOrCampaignId: "other-campaign" } })).toThrow("v369-geometry-instrument-identity");
    const narrow = { ...manifest, response: { bands: manifest.response.bands.map((band) => ({ ...band, points: band.points.slice(1, -1) })) } };
    expect(() => createMeasuredPhotonExpectationV369({ ...complete, manifest: narrow })).toThrow("v369-throughput-coverage");
  });
});

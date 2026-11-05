import { describe, expect, it } from "vitest";
import type { DetectorCalibrationManifestV361 } from "./detectorCalibrationAdmissionV361";
import type { DetectorCalibrationAuthorityDecisionV367 } from "./detectorCalibrationAuthorityAdmissionV367";
import { resolveMeasuredDetectorResponseV368, type DetectorCalibrationAuthorityEnvelopeV367, type DetectorCalibrationAuthorityPointerV367 } from "./detectorResponseAuthorityGateV368";

const canonicalSha = "a".repeat(64);
const manifestFileSha = "b".repeat(64);
const manifest: DetectorCalibrationManifestV361 = {
  version: "v361-measured-detector-calibration-manifest-v1",
  measuredCalibration: true,
  instrument: { manufacturer: "Observatory", model: "Detector", serialOrCampaignId: "campaign-001" },
  calibration: { performedAtUtc: "2026-07-29T00:00:00Z", laboratoryOrArchive: "Observatory Lab", detectorTemperatureK: 170, exposureTimeS: 120 },
  response: { bands: (["visible", "euv", "soft-x-ray"] as const).map((bandId) => ({ bandId, wavelengthUnit: "m", throughputUnit: "dimensionless", points: [{ wavelengthM: 1e-9, throughput: 0.1 }, { wavelengthM: 2e-9, throughput: 0.5 }, { wavelengthM: 3e-9, throughput: 0.3 }] })) },
  noise: { readNoiseRmsUnit: "electron/pixel/read", readNoiseRms: 2, darkCurrentUnit: "electron/pixel/s", darkCurrent: 0.01, gainUnit: "electron/adu", gain: 1.5, backgroundUnit: "electron/pixel/exposure", background: 3 },
  provenance: { sourceUrl: "https://observatory.example/calibration", licenseOrTerms: "measured terms", rawArtifactSha256: "c".repeat(64), normalizedArtifactSha256: "d".repeat(64), processingParametersSha256: "e".repeat(64) },
};
const decision = {
  version: "v367-detector-calibration-authority-admission-v1",
  status: "qualified-measured-authority-local-shadow-only",
  authorityGranted: true,
  authorityScope: "local-shadow-measured-detector-response-only",
  identities: { compilerManifestCanonicalSha256: canonicalSha, validationManifestCanonicalSha256: canonicalSha, conditioningManifestCanonicalSha256: canonicalSha, compiledArtifactSha256: "f".repeat(64), validationArtifactSha256: "1".repeat(64), measuredManifestFileSha256: manifestFileSha, conditioningFileSha256: "2".repeat(64) },
  sciencePayloadMutationAllowed: false,
  cinematicMutationAllowed: false,
  productPromotionAllowed: false,
  formalProductPointer: "v263",
  denseCampaignStatus: "incomplete-0-of-49",
} as DetectorCalibrationAuthorityDecisionV367;
const admission = { version: "v367-detector-calibration-authority-envelope-v1", generatedAt: "2026-07-29T00:00:00Z", status: decision.status, decision, validationArtifactSha256: "1".repeat(64), attemptConsumed: true, networkAttempted: false, automaticPromotionApplied: false, formalProductPointer: "v263", denseCampaignStatus: "incomplete-0-of-49", browserQualification: "not-run", artifactSha256: "3".repeat(64) } as DetectorCalibrationAuthorityEnvelopeV367;
const authorityPointer = { version: "v367-detector-calibration-authority-pointer-v1", status: "qualified-measured-authority-local-shadow-only", authorityGranted: true, admissionArtifactSha256: admission.artifactSha256, validationArtifactSha256: admission.validationArtifactSha256, manifestFileSha256: manifestFileSha, manifestCanonicalSha256: canonicalSha, instrumentSerialOrCampaignId: manifest.instrument.serialOrCampaignId, localShadowOnly: true, productPromotionAllowed: false, formalProductPointer: "v263", denseCampaignStatus: "incomplete-0-of-49", pointerSha256: "5".repeat(64) } as DetectorCalibrationAuthorityPointerV367;

describe("v368 measured detector response authority gate", () => {
  it("returns no measured values and never uses v332 when authority artifacts are absent", () => {
    expect(resolveMeasuredDetectorResponseV368({ admission: null, authorityPointer: null, manifest: null, verifiedManifestFileSha256: null, verifiedManifestCanonicalSha256: null, query: { bandId: "visible", wavelengthM: 2e-9 } })).toMatchObject({ status: "unavailable-authority-not-granted", authorityGranted: false, responseAvailable: false, response: null, syntheticFallbackUsed: false, v332AdmissibleAsMeasured: false });
  });

  it("interpolates only after every admission and manifest identity is locked", () => {
    const beforeManifest = JSON.stringify(manifest); const beforeAdmission = JSON.stringify(admission);
    const result = resolveMeasuredDetectorResponseV368({ admission, authorityPointer, manifest, verifiedManifestFileSha256: manifestFileSha, verifiedManifestCanonicalSha256: canonicalSha, query: { bandId: "visible", wavelengthM: 1.5e-9 } });
    expect(result).toMatchObject({ status: "qualified-measured-detector-response", authorityGranted: true, responseAvailable: true, response: { gain: 1.5, readNoiseRms: 2, darkCurrent: 0.01, background: 3 }, sciencePayloadMutationAllowed: false, cinematicConsumerAllowed: false });
    expect(result.response?.throughput).toBeCloseTo(0.3, 15);
    expect(JSON.stringify(manifest)).toBe(beforeManifest); expect(JSON.stringify(admission)).toBe(beforeAdmission);
  });

  it("rejects SHA drift and refuses extrapolation", () => {
    expect(() => resolveMeasuredDetectorResponseV368({ admission, authorityPointer, manifest, verifiedManifestFileSha256: "4".repeat(64), verifiedManifestCanonicalSha256: canonicalSha, query: { bandId: "visible", wavelengthM: 2e-9 } })).toThrow("v368-authority-manifest-identity");
    expect(resolveMeasuredDetectorResponseV368({ admission, authorityPointer, manifest, verifiedManifestFileSha256: manifestFileSha, verifiedManifestCanonicalSha256: canonicalSha, query: { bandId: "visible", wavelengthM: 4e-9 } })).toMatchObject({ status: "unavailable-wavelength-outside-calibration", authorityGranted: true, responseAvailable: false, response: null });
  });

  it("rejects a nonqualified decision even when a manifest is present", () => {
    const rejected = { ...admission, status: "rejected-test-fixture-nonpublishable", decision: { ...decision, status: "rejected-test-fixture-nonpublishable", authorityGranted: false } } as DetectorCalibrationAuthorityEnvelopeV367;
    expect(() => resolveMeasuredDetectorResponseV368({ admission: rejected, authorityPointer, manifest, verifiedManifestFileSha256: manifestFileSha, verifiedManifestCanonicalSha256: canonicalSha, query: { bandId: "euv", wavelengthM: 2e-9 } })).toThrow("v368-authority-manifest-identity");
  });

  it("refuses a self-consistent admission when the independent authority pointer is missing or drifted", () => {
    expect(resolveMeasuredDetectorResponseV368({ admission, authorityPointer: null, manifest, verifiedManifestFileSha256: manifestFileSha, verifiedManifestCanonicalSha256: canonicalSha, query: { bandId: "visible", wavelengthM: 2e-9 } })).toMatchObject({ authorityGranted: false, responseAvailable: false, response: null });
    expect(() => resolveMeasuredDetectorResponseV368({ admission, authorityPointer: { ...authorityPointer, admissionArtifactSha256: "6".repeat(64) }, manifest, verifiedManifestFileSha256: manifestFileSha, verifiedManifestCanonicalSha256: canonicalSha, query: { bandId: "visible", wavelengthM: 2e-9 } })).toThrow("v368-authority-manifest-identity");
  });
});

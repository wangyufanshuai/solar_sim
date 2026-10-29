import { parseDetectorCalibrationManifestV361 } from "./detectorCalibrationAdmissionV361";
import { evaluateDetectorCalibrationAuthorityV367 } from "./detectorCalibrationAuthorityAdmissionV367";
import {
  parseDetectorCalibrationAuthorityPointerV367,
  resolveMeasuredDetectorResponseV368,
} from "./detectorResponseAuthorityGateV368";
import { parseKerrSciencePhotonBandViewV328 } from "./kerrSciencePhotonBandsV328";
import { assertMeasuredAuthorityInputSizeV380 } from "./measuredAuthorityInputGuardV380";
import {
  createMeasuredPhotonExpectationV369,
  parseMeasuredObservationGeometryV369,
  parseMeasuredPhotonExpectationV369,
} from "./measuredPhotonExpectationV369";
import {
  parseObservationGeometryIdentityV371,
  parseObservationGeometryProvenanceV371,
} from "./observationGeometryCompilerV371";

export const MEASURED_AUTHORITY_ADVERSARIAL_VERSION_V380 =
  "v380-measured-authority-adversarial-campaign-v1" as const;
export const MEASURED_AUTHORITY_ADVERSARIAL_CASE_IDS_V380 = [
  "oversized-detector-admission",
  "oversized-geometry-admission",
  "path-traversal-input",
  "detector-manifest-invalid-provenance-sha",
  "detector-pointer-invalid-canonical-sha",
  "detector-authority-missing-no-synthetic-fallback",
  "detector-test-fixture-nonpublishable",
  "geometry-synthetic-identity-attestation",
  "geometry-provenance-invalid-file-sha",
  "runtime-geometry-nonphysical-area",
  "dual-authority-missing-expectation-unavailable",
  "forged-observed-counts-field",
] as const;
export type MeasuredAuthorityAdversarialCaseIdV380 =
  (typeof MEASURED_AUTHORITY_ADVERSARIAL_CASE_IDS_V380)[number];

export type MeasuredAuthorityAdversarialCaseV380 = Readonly<{
  id: MeasuredAuthorityAdversarialCaseIdV380;
  lane: "ingress" | "detector" | "geometry" | "fusion";
  attack: string;
  expectedDisposition: "rejected" | "unavailable";
  actualDisposition: "rejected" | "unavailable";
  reason: string;
  passed: true;
  authorityGranted: false;
  promotionApplied: false;
  observedCountsAvailable: false;
  syntheticFallbackUsed: false;
  sciencePayloadMutationAllowed: false;
  cinematicConsumerAllowed: false;
}>;

export type MeasuredAuthorityAdversarialCampaignV380 = Readonly<{
  version: typeof MEASURED_AUTHORITY_ADVERSARIAL_VERSION_V380;
  generatedAt: string;
  status: "adversarial-campaign-qualified-12-of-12-fail-closed";
  caseCount: 12;
  passedCaseCount: 12;
  rejectedCaseCount: 10;
  unavailableCaseCount: 2;
  deterministicReplay: true;
  fixtureOnly: true;
  publishableAsMeasuredAuthority: false;
  cases: readonly MeasuredAuthorityAdversarialCaseV380[];
  sourcePhotonArtifactSha256: string;
  attemptConsumed: false;
  networkAttempted: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  artifactSha256: string;
}>;

const SHA256 = /^[a-f0-9]{64}$/;
const SHA = "a".repeat(64);
const baseBoundary = Object.freeze({
  authorityGranted: false as const,
  promotionApplied: false as const,
  observedCountsAvailable: false as const,
  syntheticFallbackUsed: false as const,
  sciencePayloadMutationAllowed: false as const,
  cinematicConsumerAllowed: false as const,
});

function rejected(
  id: MeasuredAuthorityAdversarialCaseIdV380,
  lane: MeasuredAuthorityAdversarialCaseV380["lane"],
  attack: string,
  expectedReason: string,
  execute: () => unknown,
): MeasuredAuthorityAdversarialCaseV380 {
  let actualReason = "no-rejection";
  try {
    execute();
  } catch (error) {
    actualReason = error instanceof Error ? error.message : "unknown-rejection";
  }
  if (actualReason !== expectedReason) {
    throw new Error(`v380-adversarial-reason:${id}:${actualReason}`);
  }
  return Object.freeze({
    id,
    lane,
    attack,
    expectedDisposition: "rejected",
    actualDisposition: "rejected",
    reason: actualReason,
    passed: true,
    ...baseBoundary,
  });
}

function unavailable(
  id: MeasuredAuthorityAdversarialCaseIdV380,
  lane: MeasuredAuthorityAdversarialCaseV380["lane"],
  attack: string,
  reason: string,
): MeasuredAuthorityAdversarialCaseV380 {
  return Object.freeze({
    id,
    lane,
    attack,
    expectedDisposition: "unavailable",
    actualDisposition: "unavailable",
    reason,
    passed: true,
    ...baseBoundary,
  });
}

function invalidDetectorManifest() {
  const bands = [
    { bandId: "visible", points: [[4e-7, 0.2], [5e-7, 0.4], [6e-7, 0.3]] },
    { bandId: "euv", points: [[1e-8, 0.1], [2e-8, 0.2], [3e-8, 0.1]] },
    { bandId: "soft-x-ray", points: [[1e-10, 0.1], [2e-10, 0.2], [3e-10, 0.1]] },
  ].map((band) => ({
    bandId: band.bandId,
    wavelengthUnit: "m",
    throughputUnit: "dimensionless",
    points: band.points.map(([wavelengthM, throughput]) => ({ wavelengthM, throughput })),
  }));
  return {
    version: "v361-measured-detector-calibration-manifest-v1",
    measuredCalibration: true,
    instrument: { manufacturer: "Measured Lab", model: "Detector 1", serialOrCampaignId: "campaign-380" },
    calibration: { performedAtUtc: "2026-01-01T00:00:00Z", laboratoryOrArchive: "Measured Archive", detectorTemperatureK: 90, exposureTimeS: 1 },
    response: { bands },
    noise: { readNoiseRmsUnit: "electron/pixel/read", readNoiseRms: 1, darkCurrentUnit: "electron/pixel/s", darkCurrent: 0.1, gainUnit: "electron/adu", gain: 1, backgroundUnit: "electron/pixel/exposure", background: 0.1 },
    provenance: { sourceUrl: "https://example.invalid/measured", licenseOrTerms: "measured calibration terms", rawArtifactSha256: "invalid", normalizedArtifactSha256: SHA, processingParametersSha256: SHA },
  };
}

export function executeMeasuredAuthorityAdversarialCampaignV380(
  photonViewValue: unknown,
): readonly MeasuredAuthorityAdversarialCaseV380[] {
  const photonView = parseKerrSciencePhotonBandViewV328(photonViewValue);
  const safeUnavailable = createMeasuredPhotonExpectationV369({
    photonView,
    admission: null,
    authorityPointer: null,
    manifest: null,
    verifiedManifestFileSha256: null,
    verifiedManifestCanonicalSha256: null,
    observationGeometry: null,
  });
  if (
    safeUnavailable.status !== "unavailable-authority-or-observation-geometry" ||
    safeUnavailable.rows.length !== 0 ||
    safeUnavailable.syntheticFallbackUsed !== false
  ) {
    throw new Error("v380-safe-unavailable-boundary");
  }
  const detectorUnavailable = resolveMeasuredDetectorResponseV368({
    admission: null,
    authorityPointer: null,
    manifest: null,
    verifiedManifestFileSha256: null,
    verifiedManifestCanonicalSha256: null,
    query: { bandId: "visible", wavelengthM: 5e-7 },
  });
  if (
    detectorUnavailable.status !== "unavailable-authority-not-granted" ||
    detectorUnavailable.syntheticFallbackUsed !== false
  ) {
    throw new Error("v380-detector-unavailable-boundary");
  }
  const fixtureDecision = evaluateDetectorCalibrationAuthorityV367({
    compilation: {
      status: "compiled-test-fixture-nonpublishable",
      sourceKind: "test-fixture",
      manifestPublishable: false,
      measuredAuthorityGranted: false,
      independentScientificValidation: "pending",
      manifestCanonicalSha256: SHA,
      manifest: { instrument: { serialOrCampaignId: "campaign-380" } },
    },
    validation: {
      status: "qualified-test-fixture-only",
      sourceKind: "test-fixture",
      passed: true,
      measuredValidationQualified: false,
      measuredAuthorityGranted: false,
      independentFromCompilerDerivations: true,
    },
    validationManifestCanonicalSha256: SHA,
    conditioning: {
      instrumentSerialOrCampaignId: "campaign-380",
      manifestCanonicalSha256: SHA,
    },
    compiledArtifactSha256: SHA,
    validationArtifactSha256: SHA,
    measuredManifestFileSha256: SHA,
    conditioningFileSha256: SHA,
    declaredTestFixture: true,
  } as unknown as Parameters<typeof evaluateDetectorCalibrationAuthorityV367>[0]);
  if (fixtureDecision.status !== "rejected-test-fixture-nonpublishable") {
    throw new Error("v380-fixture-promotion-boundary");
  }

  return Object.freeze([
    rejected("oversized-detector-admission", "ingress", "one byte above detector admission limit", "v380-input-size:dist/science/detector-calibration-v367/admission.json", () => assertMeasuredAuthorityInputSizeV380({ path: "dist/science/detector-calibration-v367/admission.json", size: 512 * 1024 + 1, maximumBytes: 512 * 1024 })),
    rejected("oversized-geometry-admission", "ingress", "one byte above geometry admission limit", "v380-input-size:dist/science/observation-geometry-v373/admission.json", () => assertMeasuredAuthorityInputSizeV380({ path: "dist/science/observation-geometry-v373/admission.json", size: 256 * 1024 + 1, maximumBytes: 256 * 1024 })),
    rejected("path-traversal-input", "ingress", "relative traversal outside registered dist path", "v380-input-size:dist/../escape.json", () => assertMeasuredAuthorityInputSizeV380({ path: "dist/../escape.json", size: 1, maximumBytes: 64 * 1024 })),
    rejected("detector-manifest-invalid-provenance-sha", "detector", "invalid raw detector provenance SHA", "v361-provenance", () => parseDetectorCalibrationManifestV361(invalidDetectorManifest())),
    rejected("detector-pointer-invalid-canonical-sha", "detector", "invalid detector authority pointer SHA", "v368-v367-authority-pointer-identity", () => parseDetectorCalibrationAuthorityPointerV367({ version: "v367-detector-calibration-authority-pointer-v1", status: "qualified-measured-authority-local-shadow-only", authorityGranted: true, admissionArtifactSha256: SHA, validationArtifactSha256: SHA, manifestFileSha256: SHA, manifestCanonicalSha256: SHA, instrumentSerialOrCampaignId: "campaign-380", localShadowOnly: true, productPromotionAllowed: false, formalProductPointer: "v263", denseCampaignStatus: "incomplete-0-of-49", pointerSha256: "invalid" })),
    unavailable("detector-authority-missing-no-synthetic-fallback", "detector", "all detector authority artifacts absent", detectorUnavailable.reason),
    rejected("detector-test-fixture-nonpublishable", "detector", "test fixture presented to measured authority admission", "rejected-test-fixture-nonpublishable", () => { throw new Error(fixtureDecision.status); }),
    rejected("geometry-synthetic-identity-attestation", "geometry", "synthetic attestation presented as measured geometry", "v371-identity-boundary", () => parseObservationGeometryIdentityV371({ version: "v371-observation-geometry-identity-v1", measuredAcquisition: true, instrumentSerialOrCampaignId: "campaign-380", observatoryOrLaboratory: "Measured Archive", measuredAtUtc: "2026-01-01T00:00:00Z", attestation: { statement: "synthetic-example", operatorOrArchive: "Archive", signedAtUtc: "2026-01-01T00:00:00Z" } })),
    rejected("geometry-provenance-invalid-file-sha", "geometry", "geometry provenance contains malformed file SHA", "v371-provenance", () => parseObservationGeometryProvenanceV371({ version: "v371-observation-geometry-provenance-v1", sourceUrl: "https://example.invalid/geometry", licenseOrTerms: "measured geometry terms", identityFileSha256: "invalid", collectingAreaFileSha256: SHA, plateScaleFileSha256: SHA, processingParametersSha256: SHA })),
    rejected("runtime-geometry-nonphysical-area", "geometry", "zero collecting area in runtime geometry", "v369-observation-geometry-identity", () => parseMeasuredObservationGeometryV369({ version: "v369-measured-observation-geometry-v1", sourceKind: "measured-instrument-geometry", instrumentSerialOrCampaignId: "campaign-380", collectingAreaM2: 0, pixelSolidAngleSr: 1e-12, provenance: { sourceUrl: "https://example.invalid/geometry", licenseOrTerms: "measured geometry terms", artifactSha256: SHA } })),
    unavailable("dual-authority-missing-expectation-unavailable", "fusion", "photon authority present but detector and geometry authority absent", safeUnavailable.unavailableReasons.join("+")),
    rejected("forged-observed-counts-field", "fusion", "unavailable expectation relabeled as observed counts", "v369-expectation-identity", () => parseMeasuredPhotonExpectationV369({ ...safeUnavailable, observedCounts: "forged-observed-counts" })),
  ]);
}

export function parseMeasuredAuthorityAdversarialCampaignV380(
  value: unknown,
): MeasuredAuthorityAdversarialCampaignV380 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<MeasuredAuthorityAdversarialCampaignV380>
    : null;
  const cases = source?.cases ?? [];
  if (!source || source.version !== MEASURED_AUTHORITY_ADVERSARIAL_VERSION_V380 || source.status !== "adversarial-campaign-qualified-12-of-12-fail-closed" || source.caseCount !== 12 || source.passedCaseCount !== 12 || source.rejectedCaseCount !== 10 || source.unavailableCaseCount !== 2 || source.deterministicReplay !== true || source.fixtureOnly !== true || source.publishableAsMeasuredAuthority !== false || cases.length !== 12 || JSON.stringify(cases.map((entry) => entry.id)) !== JSON.stringify(MEASURED_AUTHORITY_ADVERSARIAL_CASE_IDS_V380) || cases.some((entry) => entry.passed !== true || entry.actualDisposition !== entry.expectedDisposition || entry.authorityGranted !== false || entry.promotionApplied !== false || entry.observedCountsAvailable !== false || entry.syntheticFallbackUsed !== false || entry.sciencePayloadMutationAllowed !== false || entry.cinematicConsumerAllowed !== false) || !SHA256.test(source.sourcePhotonArtifactSha256 ?? "") || source.attemptConsumed !== false || source.networkAttempted !== false || source.formalProductPointer !== "v263" || source.denseCampaignStatus !== "incomplete-0-of-49" || source.browserQualification !== "not-run" || !SHA256.test(source.artifactSha256 ?? "")) {
    throw new Error("v380-adversarial-campaign-identity");
  }
  return value as MeasuredAuthorityAdversarialCampaignV380;
}

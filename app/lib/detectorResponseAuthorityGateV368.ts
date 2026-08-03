import { parseDetectorCalibrationManifestV361, type DetectorCalibrationManifestV361 } from "./detectorCalibrationAdmissionV361";
import type { DetectorCalibrationAuthorityDecisionV367 } from "./detectorCalibrationAuthorityAdmissionV367";

export const DETECTOR_RESPONSE_AUTHORITY_GATE_VERSION_V368 = "v368-authority-gated-measured-detector-response-v1" as const;
const SHA256 = /^[a-f0-9]{64}$/;

export type DetectorCalibrationAuthorityEnvelopeV367 = Readonly<{
  version: "v367-detector-calibration-authority-envelope-v1";
  generatedAt: string;
  status: DetectorCalibrationAuthorityDecisionV367["status"];
  decision: DetectorCalibrationAuthorityDecisionV367;
  validationArtifactSha256: string;
  attemptConsumed: true;
  networkAttempted: false;
  automaticPromotionApplied: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  artifactSha256: string;
}>;

export type DetectorCalibrationAuthorityPointerV367 = Readonly<{
  version: "v367-detector-calibration-authority-pointer-v1";
  status: "qualified-measured-authority-local-shadow-only";
  authorityGranted: true;
  admissionArtifactSha256: string;
  validationArtifactSha256: string;
  manifestFileSha256: string;
  manifestCanonicalSha256: string;
  instrumentSerialOrCampaignId: string;
  localShadowOnly: true;
  productPromotionAllowed: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  pointerSha256: string;
}>;

export type DetectorResponseAuthorityResultV368 = Readonly<{
  version: typeof DETECTOR_RESPONSE_AUTHORITY_GATE_VERSION_V368;
  status: "qualified-measured-detector-response" | "unavailable-authority-not-granted" | "unavailable-wavelength-outside-calibration";
  authorityGranted: boolean;
  responseAvailable: boolean;
  reason: "qualified" | "v367-authority-artifact-unavailable" | "v367-authority-not-qualified" | "wavelength-outside-calibrated-band";
  query: Readonly<{ bandId: "visible" | "euv" | "soft-x-ray"; wavelengthM: number }>;
  response: Readonly<{
    throughput: number;
    throughputUnit: "dimensionless";
    gain: number;
    gainUnit: "electron/adu";
    readNoiseRms: number;
    readNoiseRmsUnit: "electron/pixel/read";
    darkCurrent: number;
    darkCurrentUnit: "electron/pixel/s";
    background: number;
    backgroundUnit: "electron/pixel/exposure";
    detectorTemperatureK: number;
    exposureTimeS: number;
  }> | null;
  provenance: Readonly<{
    admissionArtifactSha256: string | null;
    authorityPointerSha256: string | null;
    manifestFileSha256: string | null;
    manifestCanonicalSha256: string | null;
    instrumentSerialOrCampaignId: string | null;
  }>;
  syntheticFallbackUsed: false;
  v332AdmissibleAsMeasured: false;
  sciencePayloadMutationAllowed: false;
  cinematicConsumerAllowed: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  boundary: "measured-response-adapter-never-mutates-science-or-cinematic-buffers-and-never-falls-back-to-synthetic-as-measured";
}>;

export type MeasuredDetectorResponseAuthorityContextV368 = Readonly<{
  admission: DetectorCalibrationAuthorityEnvelopeV367;
  authorityPointer: DetectorCalibrationAuthorityPointerV367;
  manifest: DetectorCalibrationManifestV361;
  verifiedManifestFileSha256: string;
  verifiedManifestCanonicalSha256: string;
}>;

export function parseDetectorCalibrationAuthorityEnvelopeV367(value: unknown): DetectorCalibrationAuthorityEnvelopeV367 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<DetectorCalibrationAuthorityEnvelopeV367> : null;
  const decision = source?.decision;
  if (!source
    || !decision
    || source.version !== "v367-detector-calibration-authority-envelope-v1"
    || source.status !== decision.status
    || decision.version !== "v367-detector-calibration-authority-admission-v1"
    || decision.formalProductPointer !== "v263"
    || decision.denseCampaignStatus !== "incomplete-0-of-49"
    || decision.sciencePayloadMutationAllowed !== false
    || decision.cinematicMutationAllowed !== false
    || decision.productPromotionAllowed !== false
    || source.attemptConsumed !== true
    || source.networkAttempted !== false
    || source.automaticPromotionApplied !== false
    || source.formalProductPointer !== "v263"
    || source.denseCampaignStatus !== "incomplete-0-of-49"
    || source.browserQualification !== "not-run"
    || !SHA256.test(source.validationArtifactSha256 ?? "")
    || !SHA256.test(source.artifactSha256 ?? "")) throw new Error("v368-v367-envelope-identity");
  return value as DetectorCalibrationAuthorityEnvelopeV367;
}

export function parseDetectorCalibrationAuthorityPointerV367(value: unknown): DetectorCalibrationAuthorityPointerV367 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<DetectorCalibrationAuthorityPointerV367> : null;
  if (!source
    || source.version !== "v367-detector-calibration-authority-pointer-v1"
    || source.status !== "qualified-measured-authority-local-shadow-only"
    || source.authorityGranted !== true
    || !SHA256.test(source.admissionArtifactSha256 ?? "")
    || !SHA256.test(source.validationArtifactSha256 ?? "")
    || !SHA256.test(source.manifestFileSha256 ?? "")
    || !SHA256.test(source.manifestCanonicalSha256 ?? "")
    || typeof source.instrumentSerialOrCampaignId !== "string"
    || source.instrumentSerialOrCampaignId.trim().length < 3
    || source.localShadowOnly !== true
    || source.productPromotionAllowed !== false
    || source.formalProductPointer !== "v263"
    || source.denseCampaignStatus !== "incomplete-0-of-49"
    || !SHA256.test(source.pointerSha256 ?? "")) throw new Error("v368-v367-authority-pointer-identity");
  return value as DetectorCalibrationAuthorityPointerV367;
}

function interpolate(points: readonly Readonly<{ wavelengthM: number; throughput: number }>[], wavelengthM: number): number | null {
  if (wavelengthM < points[0].wavelengthM || wavelengthM > points.at(-1)!.wavelengthM) return null;
  if (wavelengthM === points[0].wavelengthM) return points[0].throughput;
  for (let index = 1; index < points.length; index += 1) {
    const right = points[index];
    const left = points[index - 1];
    if (wavelengthM > right.wavelengthM) continue;
    const fraction = (wavelengthM - left.wavelengthM) / (right.wavelengthM - left.wavelengthM);
    return left.throughput + fraction * (right.throughput - left.throughput);
  }
  return null;
}

export function validateMeasuredDetectorAuthorityChainV368(args: Readonly<{
  admission: DetectorCalibrationAuthorityEnvelopeV367 | null;
  authorityPointer: DetectorCalibrationAuthorityPointerV367 | null;
  manifest: DetectorCalibrationManifestV361 | null;
  verifiedManifestFileSha256: string | null;
  verifiedManifestCanonicalSha256: string | null;
}>): MeasuredDetectorResponseAuthorityContextV368 | null {
  if (!args.admission || !args.authorityPointer || !args.manifest || !args.verifiedManifestFileSha256 || !args.verifiedManifestCanonicalSha256) return null;
  const admission = parseDetectorCalibrationAuthorityEnvelopeV367(args.admission);
  const authorityPointer = parseDetectorCalibrationAuthorityPointerV367(args.authorityPointer);
  const manifest = parseDetectorCalibrationManifestV361(args.manifest);
  const identities = admission.decision.identities;
  if (!SHA256.test(args.verifiedManifestFileSha256) || !SHA256.test(args.verifiedManifestCanonicalSha256)) throw new Error("v368-manifest-sha-format");
  if (identities.measuredManifestFileSha256 !== args.verifiedManifestFileSha256
    || identities.compilerManifestCanonicalSha256 !== args.verifiedManifestCanonicalSha256
    || identities.validationManifestCanonicalSha256 !== args.verifiedManifestCanonicalSha256
    || identities.conditioningManifestCanonicalSha256 !== args.verifiedManifestCanonicalSha256
    || admission.decision.authorityGranted !== true
    || admission.status !== "qualified-measured-authority-local-shadow-only"
    || admission.decision.authorityScope !== "local-shadow-measured-detector-response-only"
    || authorityPointer.admissionArtifactSha256 !== admission.artifactSha256
    || authorityPointer.validationArtifactSha256 !== admission.validationArtifactSha256
    || authorityPointer.manifestFileSha256 !== args.verifiedManifestFileSha256
    || authorityPointer.manifestCanonicalSha256 !== args.verifiedManifestCanonicalSha256
    || authorityPointer.instrumentSerialOrCampaignId !== manifest.instrument.serialOrCampaignId) throw new Error("v368-authority-manifest-identity");
  return Object.freeze({ admission, authorityPointer, manifest, verifiedManifestFileSha256: args.verifiedManifestFileSha256, verifiedManifestCanonicalSha256: args.verifiedManifestCanonicalSha256 });
}

export function resolveMeasuredDetectorResponseV368(args: Readonly<{
  admission: DetectorCalibrationAuthorityEnvelopeV367 | null;
  authorityPointer: DetectorCalibrationAuthorityPointerV367 | null;
  manifest: DetectorCalibrationManifestV361 | null;
  verifiedManifestFileSha256: string | null;
  verifiedManifestCanonicalSha256: string | null;
  query: Readonly<{ bandId: "visible" | "euv" | "soft-x-ray"; wavelengthM: number }>;
}>): DetectorResponseAuthorityResultV368 {
  if (!Number.isFinite(args.query.wavelengthM) || args.query.wavelengthM <= 0) throw new Error("v368-query-wavelength");
  const base = {
    version: DETECTOR_RESPONSE_AUTHORITY_GATE_VERSION_V368,
    query: Object.freeze({ ...args.query }),
    syntheticFallbackUsed: false as const,
    v332AdmissibleAsMeasured: false as const,
    sciencePayloadMutationAllowed: false as const,
    cinematicConsumerAllowed: false as const,
    formalProductPointer: "v263" as const,
    denseCampaignStatus: "incomplete-0-of-49" as const,
    boundary: "measured-response-adapter-never-mutates-science-or-cinematic-buffers-and-never-falls-back-to-synthetic-as-measured" as const,
  };
  const authority = validateMeasuredDetectorAuthorityChainV368(args);
  if (!authority) return Object.freeze({
    ...base,
    status: "unavailable-authority-not-granted",
    authorityGranted: false,
    responseAvailable: false,
    reason: "v367-authority-artifact-unavailable",
    response: null,
    provenance: Object.freeze({ admissionArtifactSha256: null, authorityPointerSha256: null, manifestFileSha256: null, manifestCanonicalSha256: null, instrumentSerialOrCampaignId: null }),
  });
  const { admission, authorityPointer, manifest } = authority;
  const provenance = Object.freeze({ admissionArtifactSha256: admission.artifactSha256, authorityPointerSha256: authorityPointer.pointerSha256, manifestFileSha256: authority.verifiedManifestFileSha256, manifestCanonicalSha256: authority.verifiedManifestCanonicalSha256, instrumentSerialOrCampaignId: manifest.instrument.serialOrCampaignId });
  const band = manifest.response.bands.find((entry) => entry.bandId === args.query.bandId);
  if (!band) throw new Error("v368-band-identity");
  const throughput = interpolate(band.points, args.query.wavelengthM);
  if (throughput == null) return Object.freeze({ ...base, status: "unavailable-wavelength-outside-calibration", authorityGranted: true, responseAvailable: false, reason: "wavelength-outside-calibrated-band", response: null, provenance });
  return Object.freeze({
    ...base,
    status: "qualified-measured-detector-response",
    authorityGranted: true,
    responseAvailable: true,
    reason: "qualified",
    response: Object.freeze({
      throughput,
      throughputUnit: "dimensionless",
      gain: manifest.noise.gain,
      gainUnit: manifest.noise.gainUnit,
      readNoiseRms: manifest.noise.readNoiseRms,
      readNoiseRmsUnit: manifest.noise.readNoiseRmsUnit,
      darkCurrent: manifest.noise.darkCurrent,
      darkCurrentUnit: manifest.noise.darkCurrentUnit,
      background: manifest.noise.background,
      backgroundUnit: manifest.noise.backgroundUnit,
      detectorTemperatureK: manifest.calibration.detectorTemperatureK,
      exposureTimeS: manifest.calibration.exposureTimeS,
    }),
    provenance,
  });
}

export const DETECTOR_CALIBRATION_ADMISSION_VERSION_V361 = "v361-detector-calibration-admission-v1" as const;

export type DetectorCalibrationBandV361 = Readonly<{
  bandId: "visible" | "euv" | "soft-x-ray";
  wavelengthUnit: "m";
  throughputUnit: "dimensionless";
  points: readonly Readonly<{ wavelengthM: number; throughput: number }>[];
}>;

export type DetectorCalibrationManifestV361 = Readonly<{
  version: "v361-measured-detector-calibration-manifest-v1";
  measuredCalibration: true;
  instrument: Readonly<{ manufacturer: string; model: string; serialOrCampaignId: string }>;
  calibration: Readonly<{ performedAtUtc: string; laboratoryOrArchive: string; detectorTemperatureK: number; exposureTimeS: number }>;
  response: Readonly<{ bands: readonly DetectorCalibrationBandV361[] }>;
  noise: Readonly<{
    readNoiseRmsUnit: "electron/pixel/read";
    readNoiseRms: number;
    darkCurrentUnit: "electron/pixel/s";
    darkCurrent: number;
    gainUnit: "electron/adu";
    gain: number;
    backgroundUnit: "electron/pixel/exposure";
    background: number;
  }>;
  provenance: Readonly<{ sourceUrl: string; licenseOrTerms: string; rawArtifactSha256: string; normalizedArtifactSha256: string; processingParametersSha256: string }>;
}>;

export type DetectorCalibrationInspectArtifactV361 = Readonly<{
  version: typeof DETECTOR_CALIBRATION_ADMISSION_VERSION_V361;
  generatedAt: string;
  status: "blocked-measured-calibration-input-unavailable" | "blocked-calibration-manifest-invalid" | "manifest-accepted-awaiting-scientific-validation";
  manifestPath: "dist/staging/detector-calibration-v361/manifest.json";
  manifestPresent: boolean;
  manifestFileSha256: string | null;
  admissionQualified: boolean;
  attemptConsumed: false;
  networkAttempted: false;
  syntheticV332AdmissibleAsMeasured: false;
  missingRequirements: readonly string[];
  invalidReason: string | null;
  measuredCalibrationAuthority: "unavailable-inspect-only-no-calibration-validation";
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  artifactSha256: string;
}>;

const SHA = /^[a-f0-9]{64}$/;
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const BANDS = ["visible", "euv", "soft-x-ray"] as const;

function plainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function parseDetectorCalibrationManifestV361(value: unknown): DetectorCalibrationManifestV361 {
  if (!plainObject(value)) throw new Error("v361-manifest-object");
  const source = value as Partial<DetectorCalibrationManifestV361>;
  if (source.version !== "v361-measured-detector-calibration-manifest-v1" || source.measuredCalibration !== true) throw new Error("v361-manifest-identity");
  if (!nonEmpty(source.instrument?.manufacturer) || !nonEmpty(source.instrument?.model) || !nonEmpty(source.instrument?.serialOrCampaignId)) throw new Error("v361-instrument-identity");
  if (!ISO_UTC.test(source.calibration?.performedAtUtc ?? "") || !nonEmpty(source.calibration?.laboratoryOrArchive) || !(Number(source.calibration?.detectorTemperatureK) > 0) || !(Number(source.calibration?.exposureTimeS) > 0)) throw new Error("v361-calibration-environment");
  const bands = source.response?.bands ?? [];
  if (bands.length !== 3 || BANDS.some((band) => !bands.some((entry) => entry.bandId === band))) throw new Error("v361-response-band-coverage");
  for (const band of bands) {
    if (!BANDS.includes(band.bandId) || band.wavelengthUnit !== "m" || band.throughputUnit !== "dimensionless" || band.points.length < 3) throw new Error("v361-response-schema");
    let previous = 0;
    for (const point of band.points) {
      if (!(point.wavelengthM > previous) || !Number.isFinite(point.throughput) || point.throughput < 0 || point.throughput > 1) throw new Error("v361-response-values");
      previous = point.wavelengthM;
    }
  }
  const noise = source.noise;
  if (!noise || noise.readNoiseRmsUnit !== "electron/pixel/read" || noise.darkCurrentUnit !== "electron/pixel/s" || noise.gainUnit !== "electron/adu" || noise.backgroundUnit !== "electron/pixel/exposure" || ![noise.readNoiseRms, noise.darkCurrent, noise.gain, noise.background].every((entry) => Number.isFinite(entry) && entry >= 0) || !(noise.gain > 0)) throw new Error("v361-noise-schema");
  const provenance = source.provenance;
  if (!provenance || !/^https:\/\//.test(provenance.sourceUrl) || !nonEmpty(provenance.licenseOrTerms) || !SHA.test(provenance.rawArtifactSha256) || !SHA.test(provenance.normalizedArtifactSha256) || !SHA.test(provenance.processingParametersSha256)) throw new Error("v361-provenance");
  return value as DetectorCalibrationManifestV361;
}

export function parseDetectorCalibrationInspectArtifactV361(value: unknown): DetectorCalibrationInspectArtifactV361 {
  if (!plainObject(value)) throw new Error("v361-inspect-object");
  const source = value as Partial<DetectorCalibrationInspectArtifactV361>;
  if (source.version !== DETECTOR_CALIBRATION_ADMISSION_VERSION_V361 || !["blocked-measured-calibration-input-unavailable", "blocked-calibration-manifest-invalid", "manifest-accepted-awaiting-scientific-validation"].includes(source.status ?? "") || source.manifestPath !== "dist/staging/detector-calibration-v361/manifest.json" || source.attemptConsumed !== false || source.networkAttempted !== false || source.syntheticV332AdmissibleAsMeasured !== false || source.measuredCalibrationAuthority !== "unavailable-inspect-only-no-calibration-validation" || source.formalProductPointer !== "v263" || source.denseCampaignStatus !== "incomplete-0-of-49" || source.browserQualification !== "not-run" || !SHA.test(source.artifactSha256 ?? "")) throw new Error("v361-inspect-identity");
  if (source.status === "blocked-measured-calibration-input-unavailable" && (source.manifestPresent !== false || source.admissionQualified !== false || source.missingRequirements?.length !== 11)) throw new Error("v361-inspect-missing-boundary");
  return value as DetectorCalibrationInspectArtifactV361;
}

export const DETECTOR_CALIBRATION_MISSING_REQUIREMENTS_V361 = Object.freeze([
  "manufacturer", "model", "serial-or-campaign-id", "calibration-time-and-lab", "detector-temperature", "three-band-throughput-curves", "read-noise", "dark-current", "gain", "background", "source-license-and-sha",
]);

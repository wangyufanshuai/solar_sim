export const DETECTOR_CALIBRATION_AUTHORITY_INSPECT_VERSION_V367 = "v367-detector-calibration-authority-inspect-v1" as const;
export const DETECTOR_CALIBRATION_AUTHORITY_INPUTS_V367 = [
  "v365-identity",
  "v365-throughput",
  "v365-noise",
  "v365-provenance",
  "v365-compiled-artifact",
  "v361-measured-manifest",
  "measured-jacobian-covariance",
] as const;

export type DetectorCalibrationAuthorityInspectV367 = Readonly<{
  version: typeof DETECTOR_CALIBRATION_AUTHORITY_INSPECT_VERSION_V367;
  generatedAt: string;
  status: "blocked-admission-inputs-unavailable" | "blocked-admission-inputs-invalid" | "ready-for-explicit-authority-admission";
  expectedInputs: typeof DETECTOR_CALIBRATION_AUTHORITY_INPUTS_V367;
  presentInputCount: number;
  missingInputs: readonly string[];
  invalidReason: string | null;
  admissionControllerImplemented: true;
  admissionCommand: "npm run atlas -- relativity detector-calibration-v367-admit";
  admissionExecuted: false;
  measuredAuthorityGranted: false;
  attemptConsumed: false;
  networkAttempted: false;
  automaticPromotionAllowed: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  artifactSha256: string;
}>;

export function parseDetectorCalibrationAuthorityInspectV367(value: unknown): DetectorCalibrationAuthorityInspectV367 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<DetectorCalibrationAuthorityInspectV367>
    : null;
  if (!source
    || source.version !== DETECTOR_CALIBRATION_AUTHORITY_INSPECT_VERSION_V367
    || !["blocked-admission-inputs-unavailable", "blocked-admission-inputs-invalid", "ready-for-explicit-authority-admission"].includes(source.status ?? "")
    || source.expectedInputs?.join("|") !== DETECTOR_CALIBRATION_AUTHORITY_INPUTS_V367.join("|")
    || !Number.isInteger(source.presentInputCount)
    || Number(source.presentInputCount) < 0
    || Number(source.presentInputCount) + Number(source.missingInputs?.length ?? 0) !== DETECTOR_CALIBRATION_AUTHORITY_INPUTS_V367.length
    || source.admissionControllerImplemented !== true
    || source.admissionCommand !== "npm run atlas -- relativity detector-calibration-v367-admit"
    || source.admissionExecuted !== false
    || source.measuredAuthorityGranted !== false
    || source.attemptConsumed !== false
    || source.networkAttempted !== false
    || source.automaticPromotionAllowed !== false
    || source.formalProductPointer !== "v263"
    || source.denseCampaignStatus !== "incomplete-0-of-49"
    || source.browserQualification !== "not-run"
    || !/^[a-f0-9]{64}$/.test(source.artifactSha256 ?? "")) throw new Error("v367-authority-inspect-identity");
  if (source.status === "blocked-admission-inputs-unavailable" && (source.missingInputs?.length ?? 0) < 1) throw new Error("v367-authority-inspect-missing");
  if (source.status === "ready-for-explicit-authority-admission" && (source.missingInputs?.length !== 0 || source.invalidReason !== null)) throw new Error("v367-authority-inspect-ready");
  return value as DetectorCalibrationAuthorityInspectV367;
}

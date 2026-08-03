export const DETECTOR_CALIBRATION_IMPORT_VERSION_V365 = "v365-detector-calibration-import-inspect-v1" as const;
export type DetectorCalibrationImportInspectV365 = Readonly<{
  version: typeof DETECTOR_CALIBRATION_IMPORT_VERSION_V365;
  generatedAt: string;
  status: "blocked-measured-acquisition-files-unavailable" | "blocked-measured-acquisition-files-invalid" | "ready-for-explicit-measured-compile";
  expectedFiles: readonly ["identity.json", "throughput.csv", "noise.csv", "provenance.json"];
  presentFileCount: number;
  missingFiles: readonly string[];
  invalidReason: string | null;
  compilerImplemented: true;
  compileCommand: "npm run atlas -- relativity detector-calibration-v365-compile";
  compileExecuted: false;
  manifestPublished: false;
  measuredDataRowCount: number;
  attemptConsumed: false;
  networkAttempted: false;
  measuredCalibrationAuthority: "unavailable-inspect-only-explicit-compile-and-independent-validation-required";
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  artifactSha256: string;
}>;

export function parseDetectorCalibrationImportInspectV365(value: unknown): DetectorCalibrationImportInspectV365 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<DetectorCalibrationImportInspectV365> : null;
  if (!source || source.version !== DETECTOR_CALIBRATION_IMPORT_VERSION_V365 || !["blocked-measured-acquisition-files-unavailable", "blocked-measured-acquisition-files-invalid", "ready-for-explicit-measured-compile"].includes(source.status ?? "") || source.expectedFiles?.length !== 4 || source.compilerImplemented !== true || source.compileCommand !== "npm run atlas -- relativity detector-calibration-v365-compile" || source.compileExecuted !== false || source.manifestPublished !== false || !(Number(source.measuredDataRowCount) >= 0) || source.attemptConsumed !== false || source.networkAttempted !== false || source.measuredCalibrationAuthority !== "unavailable-inspect-only-explicit-compile-and-independent-validation-required" || source.formalProductPointer !== "v263" || source.denseCampaignStatus !== "incomplete-0-of-49" || source.browserQualification !== "not-run" || !/^[a-f0-9]{64}$/.test(source.artifactSha256 ?? "")) throw new Error("v365-import-inspect-identity");
  if (source.status === "blocked-measured-acquisition-files-unavailable" && (!(Number(source.presentFileCount) >= 0) || Number(source.presentFileCount) + Number(source.missingFiles?.length ?? 0) !== 4 || (source.missingFiles?.length ?? 0) < 1 || source.measuredDataRowCount !== 0)) throw new Error("v365-import-inspect-missing");
  return value as DetectorCalibrationImportInspectV365;
}

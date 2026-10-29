import {
  existsSync,
  lstatSync,
  readFileSync,
  realpathSync,
} from "node:fs";
import { relative, resolve } from "node:path";
import {
  KERR_MEASURED_DETECTOR_FILE_IDS_V458,
  type KerrMeasuredDetectorFileIdV458,
} from "./kerrMeasuredDetectorIntakeEnvelopeV458";
import {
  KERR_MEASURED_DETECTOR_SCHEMA_PACK_V458,
  V458_MAX_FILE_BYTES,
  V458_MAX_TOTAL_BYTES,
  validateKerrMeasuredDetectorCandidateV458,
} from "./kerrMeasuredDetectorIntakeValidatorV458";
import type {
  KerrMeasuredCalibrationPreflightFileV504,
  KerrMeasuredCalibrationPreflightStatusV504,
} from "./kerrMeasuredCalibrationPreflightV504";

const normalizePath = (value: string): string =>
  process.platform === "win32" ? value.toLowerCase() : value;

export type KerrMeasuredCalibrationPreflightObservationV504 = Readonly<{
  status: KerrMeasuredCalibrationPreflightStatusV504;
  stagingRootPresent: boolean;
  stagingRootSafe: boolean;
  files: readonly KerrMeasuredCalibrationPreflightFileV504[];
  readyFileCount: number;
  missingFileIds: readonly string[];
  invalidFileIds: readonly string[];
  pathSafetyViolationIds: readonly string[];
  bytesRead: number;
  contentClass: "measured-detector-calibration" | "synthetic-validation-fixture" | "unavailable";
  crossFileIdentityQualified: boolean;
  provenanceShaLinkageQualified: boolean;
  licenseBoundaryQualified: boolean;
  candidateReadyForIndependentValidation: boolean;
}>;

export function inspectKerrMeasuredCalibrationCandidateV504(
  stagingRoot: string,
): KerrMeasuredCalibrationPreflightObservationV504 {
  const expectedRoot = resolve(stagingRoot);
  const candidate: Partial<Record<KerrMeasuredDetectorFileIdV458, Uint8Array>> = {};
  const fileIssues = new Map<KerrMeasuredDetectorFileIdV458, string[]>();
  const observedBytes = new Map<KerrMeasuredDetectorFileIdV458, number>();
  let stagingRootPresent = false;
  let stagingRootSafe = true;
  let bytesRead = 0;

  if (existsSync(expectedRoot)) {
    stagingRootPresent = true;
    const rootInfo = lstatSync(expectedRoot);
    const realRoot = rootInfo.isDirectory() && !rootInfo.isSymbolicLink()
      ? realpathSync.native(expectedRoot)
      : null;
    stagingRootSafe = Boolean(
      realRoot && normalizePath(realRoot) === normalizePath(expectedRoot),
    );
    if (stagingRootSafe) {
      for (const schema of KERR_MEASURED_DETECTOR_SCHEMA_PACK_V458.schemas) {
        const id = schema.id;
        const path = resolve(expectedRoot, schema.fileName);
        const inside = relative(expectedRoot, path);
        if (inside.startsWith("..") || resolve(path) !== path || !existsSync(path)) continue;
        const metadata = lstatSync(path);
        observedBytes.set(id, metadata.size);
        if (metadata.isSymbolicLink() || !metadata.isFile()) {
          fileIssues.set(id, ["path-not-regular-file"]);
          continue;
        }
        if (metadata.size <= 0 || metadata.size > V458_MAX_FILE_BYTES) {
          fileIssues.set(id, ["file-size-boundary-invalid"]);
          continue;
        }
        if (bytesRead + metadata.size > V458_MAX_TOTAL_BYTES) {
          fileIssues.set(id, ["total-size-boundary-invalid"]);
          continue;
        }
        candidate[id] = new Uint8Array(readFileSync(path));
        bytesRead += metadata.size;
      }
    }
  }

  const validation = validateKerrMeasuredDetectorCandidateV458(candidate);
  const pathSafetyViolationIds = stagingRootSafe
    ? [...fileIssues.entries()]
        .filter(([, reasons]) => reasons.includes("path-not-regular-file"))
        .map(([id]) => id)
    : [...KERR_MEASURED_DETECTOR_FILE_IDS_V458];
  const files = validation.files.map((file) => {
    const issues = fileIssues.get(file.id);
    if (!issues) return file;
    return Object.freeze({
      ...file,
      status: "invalid" as const,
      bytes: observedBytes.get(file.id) ?? 0,
      sha256: null,
      reasons: Object.freeze(issues),
    });
  });
  const missingFileIds = files
    .filter((file) => file.status === "missing")
    .map((file) => file.id);
  const invalidFileIds = files
    .filter((file) => file.status === "invalid")
    .map((file) => file.id);
  const status: KerrMeasuredCalibrationPreflightStatusV504 = !stagingRootSafe ||
    pathSafetyViolationIds.length > 0
    ? "blocked-path-safety"
    : missingFileIds.length > 0
      ? "blocked-inputs-missing"
      : invalidFileIds.length > 0
        ? "blocked-inputs-invalid"
        : validation.status;
  const clean = invalidFileIds.length === 0 && pathSafetyViolationIds.length === 0;
  return Object.freeze({
    status,
    stagingRootPresent,
    stagingRootSafe,
    files: Object.freeze(files),
    readyFileCount: files.filter((file) => file.status === "ready").length,
    missingFileIds: Object.freeze(missingFileIds),
    invalidFileIds: Object.freeze(invalidFileIds),
    pathSafetyViolationIds: Object.freeze(pathSafetyViolationIds),
    bytesRead,
    contentClass: validation.contentClass,
    crossFileIdentityQualified: clean && validation.crossFileIdentityQualified,
    provenanceShaLinkageQualified: clean && validation.provenanceShaLinkageQualified,
    licenseBoundaryQualified: clean && validation.licenseBoundaryQualified,
    candidateReadyForIndependentValidation:
      clean && validation.candidateReadyForIndependentValidation,
  });
}

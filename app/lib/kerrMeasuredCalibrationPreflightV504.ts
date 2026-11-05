export const KERR_MEASURED_CALIBRATION_PREFLIGHT_VERSION_V504 =
  "v504-kerr-measured-calibration-preflight-v1" as const;
export const KERR_MEASURED_CALIBRATION_PREFLIGHT_API_VERSION_V504 =
  "v504-kerr-measured-calibration-preflight-api-v1" as const;

export type KerrMeasuredCalibrationPreflightStatusV504 =
  | "blocked-inputs-missing"
  | "blocked-inputs-invalid"
  | "blocked-path-safety"
  | "validation-only"
  | "candidate-ready-for-independent-validation";

export type KerrMeasuredCalibrationPreflightFileV504 = Readonly<{
  id: "identity" | "plate-scale" | "distortion" | "psf" | "pixel-response" | "provenance";
  fileName: string;
  format: "json" | "csv";
  status: "missing" | "invalid" | "ready";
  bytes: number;
  sha256: string | null;
  reasons: readonly string[];
}>;

export type KerrMeasuredCalibrationPreflightArtifactV504 = Readonly<{
  version: typeof KERR_MEASURED_CALIBRATION_PREFLIGHT_VERSION_V504;
  generatedAt: string;
  status: KerrMeasuredCalibrationPreflightStatusV504;
  source: Readonly<{
    v458ArtifactSha256: string;
    v503ReadinessArtifactSha256: string;
    validatorFileSha256: string;
  }>;
  contract: Readonly<{
    stagingRoot: "dist/staging/kerr-measured-detector-intake-v458";
    whitelistFileCount: 6;
    maximumFileBytes: number;
    maximumTotalBytes: number;
    explicitCliIntentRequired: true;
    readOnlyStagingAccess: true;
    regularFilesOnly: true;
    symlinkTraversalAllowed: false;
    networkAllowed: false;
    automaticRetryAllowed: false;
    authorityGrantAllowed: false;
  }>;
  observation: Readonly<{
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
  decision: Readonly<{
    preflightQualified: boolean;
    canProceedToIndependentValidation: boolean;
    measuredDetectorAuthorityGranted: false;
    runtimeProjectionAllowed: false;
    scienceRasterAllowed: false;
    nextAction:
      | "provide-missing-files"
      | "repair-invalid-files"
      | "replace-synthetic-fixture"
      | "resolve-path-safety-violation"
      | "run-independent-validation";
  }>;
  boundary: Readonly<{
    attemptConsumed: false;
    fileContentsPersistedInArtifact: false;
    stagingWritePerformed: false;
    networkAttempted: false;
    automaticRetryApplied: false;
    detectorResponseAvailable: false;
    observedIntensityAvailable: false;
    scienceRasterAvailable: false;
    fitsProducts: 0;
    pngProducts: 0;
    denseCampaignStatus: "incomplete-0-of-49";
    browserQualification: "not-run";
  }>;
  sourceManifest: readonly Readonly<{ path: string; sha256: string }>[];
  sourceSha256: string;
  artifactSha256: string;
  formalProductPointer: "v263";
  formalDefaultKernel: "legacy-eih-1pn";
}>;

export type KerrMeasuredCalibrationPreflightSummaryV504 = Pick<
  KerrMeasuredCalibrationPreflightArtifactV504,
  "version" | "status" | "source" | "contract" | "observation" | "decision" | "boundary" | "artifactSha256"
>;

export type KerrMeasuredCalibrationPreflightApiV504 = Readonly<{
  version: typeof KERR_MEASURED_CALIBRATION_PREFLIGHT_API_VERSION_V504;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt";
  summary: KerrMeasuredCalibrationPreflightSummaryV504 | null;
}>;

const SHA256 = /^[a-f0-9]{64}$/;
const TRANSIENT = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !TRANSIENT.has(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
}

export const canonicalKerrMeasuredCalibrationPreflightV504 = (value: unknown): string =>
  JSON.stringify(canonicalize(value));

function validateSummaryShape(
  value: unknown,
): asserts value is KerrMeasuredCalibrationPreflightSummaryV504 {
  if (!isRecord(value)) throw new Error("v504-summary-shape");
  const summary = value as Partial<KerrMeasuredCalibrationPreflightSummaryV504>;
  if (
    summary.version !== KERR_MEASURED_CALIBRATION_PREFLIGHT_VERSION_V504 ||
    ![
      "blocked-inputs-missing",
      "blocked-inputs-invalid",
      "blocked-path-safety",
      "validation-only",
      "candidate-ready-for-independent-validation",
    ].includes(String(summary.status)) ||
    !isRecord(summary.source) ||
    Object.values(summary.source).some((entry) => !SHA256.test(String(entry))) ||
    summary.contract?.whitelistFileCount !== 6 ||
    summary.contract.explicitCliIntentRequired !== true ||
    summary.contract.readOnlyStagingAccess !== true ||
    summary.contract.symlinkTraversalAllowed !== false ||
    summary.contract.networkAllowed !== false ||
    summary.observation?.files.length !== 6 ||
    summary.observation.files.some(
      (file) =>
        !["missing", "invalid", "ready"].includes(file.status) ||
        file.bytes < 0 ||
        (file.sha256 !== null && !SHA256.test(file.sha256)),
    ) ||
    summary.decision?.measuredDetectorAuthorityGranted !== false ||
    summary.decision.runtimeProjectionAllowed !== false ||
    summary.decision.scienceRasterAllowed !== false ||
    summary.boundary?.attemptConsumed !== false ||
    summary.boundary.fileContentsPersistedInArtifact !== false ||
    summary.boundary.stagingWritePerformed !== false ||
    summary.boundary.networkAttempted !== false ||
    summary.boundary.detectorResponseAvailable !== false ||
    summary.boundary.scienceRasterAvailable !== false ||
    summary.boundary.denseCampaignStatus !== "incomplete-0-of-49" ||
    !SHA256.test(summary.artifactSha256 ?? "")
  ) {
    throw new Error("v504-preflight-boundary");
  }
}

export function parseKerrMeasuredCalibrationPreflightArtifactV504(
  value: unknown,
): KerrMeasuredCalibrationPreflightArtifactV504 {
  validateSummaryShape(value);
  const artifact = value as KerrMeasuredCalibrationPreflightArtifactV504;
  if (
    !Array.isArray(artifact.sourceManifest) ||
    !SHA256.test(artifact.sourceSha256) ||
    artifact.formalProductPointer !== "v263" ||
    artifact.formalDefaultKernel !== "legacy-eih-1pn"
  ) {
    throw new Error("v504-artifact-boundary");
  }
  return artifact;
}

export function createKerrMeasuredCalibrationPreflightSummaryV504(
  value: unknown,
): KerrMeasuredCalibrationPreflightSummaryV504 {
  const artifact = parseKerrMeasuredCalibrationPreflightArtifactV504(value);
  return Object.freeze({
    version: artifact.version,
    status: artifact.status,
    source: artifact.source,
    contract: artifact.contract,
    observation: artifact.observation,
    decision: artifact.decision,
    boundary: artifact.boundary,
    artifactSha256: artifact.artifactSha256,
  });
}

export function parseKerrMeasuredCalibrationPreflightApiV504(
  value: unknown,
): KerrMeasuredCalibrationPreflightApiV504 {
  if (!isRecord(value)) throw new Error("v504-api-shape");
  if (
    value.version !== KERR_MEASURED_CALIBRATION_PREFLIGHT_API_VERSION_V504 ||
    typeof value.available !== "boolean" ||
    !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt"].includes(
      String(value.reason),
    )
  ) {
    throw new Error("v504-api-boundary");
  }
  if (value.available) validateSummaryShape(value.summary);
  else if (value.summary !== null) throw new Error("v504-api-unavailable-summary");
  return value as unknown as KerrMeasuredCalibrationPreflightApiV504;
}

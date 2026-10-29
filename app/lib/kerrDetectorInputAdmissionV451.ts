export const KERR_DETECTOR_INPUT_ADMISSION_VERSION_V451 =
  "v451-kerr-detector-input-admission-v1" as const;
export const KERR_DETECTOR_INPUT_ADMISSION_ARTIFACT_VERSION_V451 =
  "v451-kerr-detector-input-admission-artifact-v1" as const;
export const KERR_DETECTOR_INPUT_ADMISSION_SUMMARY_VERSION_V451 =
  "v451-kerr-detector-input-admission-summary-v1" as const;
export const KERR_DETECTOR_INPUT_ADMISSION_API_VERSION_V451 =
  "v451-kerr-detector-input-admission-api-v1" as const;

const SHA256 = /^[a-f0-9]{64}$/;
const FILE_IDS = [
  "identity",
  "plate-scale",
  "distortion",
  "psf",
  "pixel-response",
  "provenance",
] as const;
type DetectorInputIdV451 = (typeof FILE_IDS)[number];
const freeze = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      freeze(child);
    }
  }
  return value;
};

export type KerrDetectorInputFileV451 = Readonly<{
  id: DetectorInputIdV451;
  fileName: string;
  format: "json" | "csv";
  status: "missing" | "invalid" | "ready";
  bytes: number;
  sha256: string | null;
  reasons: readonly string[];
}>;

export type KerrDetectorInputAdmissionArtifactV451 = Readonly<{
  version: typeof KERR_DETECTOR_INPUT_ADMISSION_ARTIFACT_VERSION_V451;
  generatedAt: string;
  status:
    | "blocked-v443-detector-inputs-missing"
    | "blocked-v443-detector-inputs-invalid"
    | "blocked-independent-validation-not-run"
    | "blocked-measured-authority-not-granted"
    | "candidate-ready-for-independent-validation";
  source: Readonly<{
    v443ArtifactSha256: string;
    v450ArtifactSha256: string;
    v447ArtifactSha256: string;
    v449ArtifactSha256: string;
  }>;
  detector: Readonly<{
    stagingPath: "dist/staging/kerr-detector-projection-v443";
    requiredFileCount: 6;
    readyFileCount: number;
    missingFileIds: readonly DetectorInputIdV451[];
    invalidFileIds: readonly DetectorInputIdV451[];
    files: readonly KerrDetectorInputFileV451[];
  }>;
  semanticContract: Readonly<{
    collectingAreaMeansGeometricAreaWithoutThroughput: true;
    throughputNotMultipliedTwice: true;
    photonToElectronSemanticsExplicit: true;
    v447ElectronExpectationFixtureOnly: true;
    v449ExactLikelihoodReferenceFixtureOnly: true;
    observedCountsAvailable: false;
    scienceRasterAllowed: false;
  }>;
  gateDependencies: Readonly<{
    v441WcsCoordinateAuthority: "qualified";
    v443StructuralInspection: "blocked" | "ready-for-independent-validation";
    independentV372ToV374Validation: "required-not-run" | "provided";
    explicitMeasuredAuthorityAdmission: "required-not-granted" | "granted";
  }>;
  qualification: Readonly<{
    inputInventoryQualified: boolean;
    provenanceShaLinkageQualified: boolean;
    unitSemanticBoundaryQualified: true;
    independentValidationQualified: false;
    measuredDetectorAuthorityGranted: false;
    runtimeProjectionAllowed: false;
    psfAuthority: false;
    pixelResponseAuthority: false;
    scienceRasterAuthority: false;
    observedImageAvailable: false;
    browserQualification: "not-run";
  }>;
  boundary: Readonly<{
    currentInputRowsAreMeasured: false;
    fixtureExpectedElectronsMayBeJoined: true;
    detectorProjectionMayRun: false;
    scienceImageMayBeMaterialized: false;
    cinematicMayClaimDetectorImage: false;
    networkAttempted: false;
    automaticRetryApplied: false;
  }>;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  artifactSha256: string;
}>;

export type KerrDetectorInputAdmissionSummaryV451 = Readonly<{
  version: typeof KERR_DETECTOR_INPUT_ADMISSION_SUMMARY_VERSION_V451;
  status: KerrDetectorInputAdmissionArtifactV451["status"];
  artifactSha256: string;
  detector: KerrDetectorInputAdmissionArtifactV451["detector"];
  semanticContract: KerrDetectorInputAdmissionArtifactV451["semanticContract"];
  gateDependencies: KerrDetectorInputAdmissionArtifactV451["gateDependencies"];
  qualification: KerrDetectorInputAdmissionArtifactV451["qualification"];
  boundary: KerrDetectorInputAdmissionArtifactV451["boundary"];
  source: KerrDetectorInputAdmissionArtifactV451["source"];
}>;

export type KerrDetectorInputAdmissionApiV451 = Readonly<{
  version: typeof KERR_DETECTOR_INPUT_ADMISSION_API_VERSION_V451;
  available: boolean;
  reason:
    | "ready"
    | "lite-boundary"
    | "local-shadow-only"
    | "evidence-corrupt"
    | "request-failed";
  summary: KerrDetectorInputAdmissionSummaryV451 | null;
}>;

function isSha(value: unknown): value is string {
  return typeof value === "string" && SHA256.test(value);
}

function validFile(value: unknown): value is KerrDetectorInputFileV451 {
  const file = value as Partial<KerrDetectorInputFileV451> | null;
  return Boolean(
    file &&
      FILE_IDS.includes(file.id as DetectorInputIdV451) &&
      typeof file.fileName === "string" &&
      ["json", "csv"].includes(file.format ?? "") &&
      ["missing", "invalid", "ready"].includes(file.status ?? "") &&
      typeof file.bytes === "number" &&
      Number.isInteger(file.bytes) &&
      file.bytes >= 0 &&
      (file.sha256 === null || isSha(file.sha256)) &&
      Array.isArray(file.reasons) &&
      file.reasons.every((reason) => typeof reason === "string"),
  );
}

export function parseKerrDetectorInputAdmissionArtifactV451(
  value: unknown,
): KerrDetectorInputAdmissionArtifactV451 {
  const artifact =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrDetectorInputAdmissionArtifactV451>)
      : null;
  const qualification = artifact?.qualification;
  const boundary = artifact?.boundary;
  if (
    !artifact ||
    artifact.version !== KERR_DETECTOR_INPUT_ADMISSION_ARTIFACT_VERSION_V451 ||
    ![
      "blocked-v443-detector-inputs-missing",
      "blocked-v443-detector-inputs-invalid",
      "blocked-independent-validation-not-run",
      "blocked-measured-authority-not-granted",
      "candidate-ready-for-independent-validation",
    ].includes(artifact.status ?? "") ||
    !artifact.source ||
    Object.values(artifact.source).some((entry) => !isSha(entry)) ||
    artifact.detector?.stagingPath !==
      "dist/staging/kerr-detector-projection-v443" ||
    artifact.detector.requiredFileCount !== 6 ||
    !Number.isInteger(artifact.detector.readyFileCount) ||
    !Array.isArray(artifact.detector.missingFileIds) ||
    !Array.isArray(artifact.detector.invalidFileIds) ||
    !Array.isArray(artifact.detector.files) ||
    artifact.detector.files.length !== 6 ||
    artifact.detector.files.some((file) => !validFile(file)) ||
    artifact.semanticContract?.collectingAreaMeansGeometricAreaWithoutThroughput !==
      true ||
    artifact.semanticContract.throughputNotMultipliedTwice !== true ||
    artifact.semanticContract.photonToElectronSemanticsExplicit !== true ||
    artifact.semanticContract.v447ElectronExpectationFixtureOnly !== true ||
    artifact.semanticContract.v449ExactLikelihoodReferenceFixtureOnly !== true ||
    artifact.semanticContract.observedCountsAvailable !== false ||
    artifact.semanticContract.scienceRasterAllowed !== false ||
    artifact.gateDependencies?.v441WcsCoordinateAuthority !== "qualified" ||
    !["blocked", "ready-for-independent-validation"].includes(
      artifact.gateDependencies.v443StructuralInspection,
    ) ||
    artifact.gateDependencies.independentV372ToV374Validation !==
      "required-not-run" ||
    artifact.gateDependencies.explicitMeasuredAuthorityAdmission !==
      "required-not-granted" ||
    qualification?.unitSemanticBoundaryQualified !== true ||
    qualification.independentValidationQualified !== false ||
    qualification.measuredDetectorAuthorityGranted !== false ||
    qualification.runtimeProjectionAllowed !== false ||
    qualification.psfAuthority !== false ||
    qualification.pixelResponseAuthority !== false ||
    qualification.scienceRasterAuthority !== false ||
    qualification.observedImageAvailable !== false ||
    qualification.browserQualification !== "not-run" ||
    boundary?.currentInputRowsAreMeasured !== false ||
    boundary.fixtureExpectedElectronsMayBeJoined !== true ||
    boundary.detectorProjectionMayRun !== false ||
    boundary.scienceImageMayBeMaterialized !== false ||
    boundary.cinematicMayClaimDetectorImage !== false ||
    boundary.networkAttempted !== false ||
    boundary.automaticRetryApplied !== false ||
    artifact.formalProductPointer !== "v263" ||
    artifact.denseCampaignStatus !== "incomplete-0-of-49"
  ) {
    throw new Error("v451-detector-admission-artifact-identity");
  }
  return freeze(value as KerrDetectorInputAdmissionArtifactV451);
}

export function createKerrDetectorInputAdmissionSummaryV451(
  value: unknown,
): KerrDetectorInputAdmissionSummaryV451 {
  const artifact = parseKerrDetectorInputAdmissionArtifactV451(value);
  return freeze({
    version: KERR_DETECTOR_INPUT_ADMISSION_SUMMARY_VERSION_V451,
    status: artifact.status,
    artifactSha256: artifact.artifactSha256,
    detector: artifact.detector,
    semanticContract: artifact.semanticContract,
    gateDependencies: artifact.gateDependencies,
    qualification: artifact.qualification,
    boundary: artifact.boundary,
    source: artifact.source,
  });
}

export function parseKerrDetectorInputAdmissionApiV451(
  value: unknown,
): KerrDetectorInputAdmissionApiV451 {
  const api =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrDetectorInputAdmissionApiV451>)
      : null;
  if (
    !api ||
    api.version !== KERR_DETECTOR_INPUT_ADMISSION_API_VERSION_V451 ||
    typeof api.available !== "boolean" ||
    ![
      "ready",
      "lite-boundary",
      "local-shadow-only",
      "evidence-corrupt",
      "request-failed",
    ].includes(api.reason ?? "") ||
    (api.available && !api.summary) ||
    (!api.available && api.summary !== null)
  ) {
    throw new Error("v451-detector-admission-api-identity");
  }
  return freeze(value as KerrDetectorInputAdmissionApiV451);
}

export const DETECTOR_INPUT_IDS_V451 = FILE_IDS;

export const KERR_DETECTOR_PROJECTION_ADMISSION_VERSION_V442 =
  "v442-kerr-detector-projection-admission-v1" as const;
export const KERR_DETECTOR_PROJECTION_ADMISSION_API_VERSION_V442 =
  "v442-kerr-detector-projection-admission-api-v1" as const;
export const KERR_DETECTOR_PROJECTION_ADMISSION_CONTRACT_VERSION_V442 =
  "v442-kerr-detector-projection-admission-contract-v1" as const;

const SHA256 = /^[a-f0-9]{64}$/;
const GATE_IDS = [
  "wcs-coordinate-authority",
  "instrument-identity",
  "collecting-area",
  "plate-scale",
  "distortion-calibration",
  "psf-calibration",
  "pixel-response-calibration",
  "source-provenance",
  "independent-validation",
  "authority-admission",
  "runtime-publication",
] as const;

export type KerrDetectorProjectionGateIdV442 = (typeof GATE_IDS)[number];
export type KerrDetectorProjectionGateStatusV442 =
  | "qualified"
  | "partial"
  | "missing"
  | "blocked";
export type KerrDetectorProjectionGateV442 = Readonly<{
  id: KerrDetectorProjectionGateIdV442;
  status: KerrDetectorProjectionGateStatusV442;
  sourceVersion: string;
  sourceArtifactSha256: string | null;
  reason: string;
  requiredForProjection: true;
}>;
export type KerrDetectorProjectionSourceV442 = Readonly<{
  id: string;
  path: string;
  sha256: string;
  artifactSha256: string | null;
  status: "present" | "missing";
}>;
export type KerrDetectorProjectionAdmissionContractV442 = Readonly<{
  version: typeof KERR_DETECTOR_PROJECTION_ADMISSION_CONTRACT_VERSION_V442;
  status: "detector-projection-admission-fail-closed";
  requiredGateCount: 10;
  gateIds: readonly KerrDetectorProjectionGateIdV442[];
  wcsCoordinateAuthority: true;
  measuredDetectorGeometryRequired: true;
  distortionCalibrationRequired: true;
  psfCalibrationRequired: true;
  pixelResponseCalibrationRequired: true;
  independentValidationRequired: true;
  authorityAdmissionRequired: true;
  runtimeProjectionAllowed: false;
  scienceRasterAllowed: false;
  cinematicScienceWritebackAllowed: false;
  automaticPromotionAllowed: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
}>;
export type KerrDetectorProjectionAdmissionArtifactV442 = Readonly<{
  version: typeof KERR_DETECTOR_PROJECTION_ADMISSION_VERSION_V442;
  generatedAt: string;
  status: "blocked-detector-projection-inputs-unavailable";
  sourceManifest: readonly KerrDetectorProjectionSourceV442[];
  sourceSha256: string;
  gates: readonly KerrDetectorProjectionGateV442[];
  counts: Readonly<{
    gateCount: 11;
    qualified: 1;
    partial: 1;
    missing: 6;
    blocked: 3;
  }>;
  inputs: Readonly<{
    missingFiles: readonly string[];
    partialSources: readonly string[];
    explicitCompileCommand: "npm run atlas -- relativity observation-geometry-v371-compile";
    explicitValidateCommand: "npm run atlas -- relativity observation-geometry-v372-validate";
    explicitAdmissionCommand: "npm run atlas -- relativity observation-geometry-v373-admit";
    explicitPublicationCommand: "npm run atlas -- relativity observation-geometry-v374-publish";
  }>;
  wcs: Readonly<{
    authority: "qualified-linear-wcs";
    sourceArtifactSha256: string;
    coordinateRows: 24;
    detectorProjectionAllowed: false;
  }>;
  projection: Readonly<{
    measuredGeometryAuthority: false;
    distortionCalibrationAuthority: false;
    psfAuthority: false;
    pixelResponseAuthority: false;
    detectorProjectionAvailable: false;
    rasterProductAvailable: false;
    sciencePayloadMutationAllowed: false;
  }>;
  qualification: Readonly<{
    admission: "blocked";
    sourcePackComplete: false;
    measuredAuthorityGranted: false;
    runtimeGeometryPublished: false;
    browserQualification: "not-run";
    denseAuthority: false;
  }>;
  networkAttempted: false;
  attemptConsumed: false;
  automaticRetryApplied: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  contract: KerrDetectorProjectionAdmissionContractV442;
  boundary: string;
  artifactSha256: string;
}>;
export type KerrDetectorProjectionAdmissionSummaryV442 = Readonly<{
  version: typeof KERR_DETECTOR_PROJECTION_ADMISSION_VERSION_V442;
  status: KerrDetectorProjectionAdmissionArtifactV442["status"];
  artifactSha256: string;
  counts: KerrDetectorProjectionAdmissionArtifactV442["counts"];
  gates: readonly KerrDetectorProjectionGateV442[];
  inputs: KerrDetectorProjectionAdmissionArtifactV442["inputs"];
  wcs: KerrDetectorProjectionAdmissionArtifactV442["wcs"];
  projection: KerrDetectorProjectionAdmissionArtifactV442["projection"];
  qualification: KerrDetectorProjectionAdmissionArtifactV442["qualification"];
  boundary: string;
}>;
export type KerrDetectorProjectionAdmissionApiV442 = Readonly<{
  version: typeof KERR_DETECTOR_PROJECTION_ADMISSION_API_VERSION_V442;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed";
  summary: KerrDetectorProjectionAdmissionSummaryV442 | null;
}>;

const freeze = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const entry of Object.values(value as Record<string, unknown>)) freeze(entry);
  }
  return value;
};

function validGate(value: unknown): value is KerrDetectorProjectionGateV442 {
  const gate = value as Partial<KerrDetectorProjectionGateV442> | null;
  return Boolean(
    gate &&
      GATE_IDS.includes(gate.id as KerrDetectorProjectionGateIdV442) &&
      ["qualified", "partial", "missing", "blocked"].includes(gate.status ?? "") &&
      typeof gate.sourceVersion === "string" &&
      (gate.sourceArtifactSha256 === null || (typeof gate.sourceArtifactSha256 === "string" && SHA256.test(gate.sourceArtifactSha256))) &&
      typeof gate.reason === "string" &&
      gate.reason.length > 0 &&
      gate.requiredForProjection === true,
  );
}

export function parseKerrDetectorProjectionAdmissionContractV442(
  value: unknown,
): KerrDetectorProjectionAdmissionContractV442 {
  const contract = value as Partial<KerrDetectorProjectionAdmissionContractV442> | null;
  if (
    !contract ||
    contract.version !== KERR_DETECTOR_PROJECTION_ADMISSION_CONTRACT_VERSION_V442 ||
    contract.status !== "detector-projection-admission-fail-closed" ||
    contract.requiredGateCount !== 10 ||
    contract.gateIds?.join("|") !== GATE_IDS.slice(1).join("|") ||
    contract.wcsCoordinateAuthority !== true ||
    contract.measuredDetectorGeometryRequired !== true ||
    contract.distortionCalibrationRequired !== true ||
    contract.psfCalibrationRequired !== true ||
    contract.pixelResponseCalibrationRequired !== true ||
    contract.independentValidationRequired !== true ||
    contract.authorityAdmissionRequired !== true ||
    contract.runtimeProjectionAllowed !== false ||
    contract.scienceRasterAllowed !== false ||
    contract.cinematicScienceWritebackAllowed !== false ||
    contract.automaticPromotionAllowed !== false ||
    contract.formalProductPointer !== "v263" ||
    contract.denseCampaignStatus !== "incomplete-0-of-49"
  ) {
    throw new Error("v442-contract-identity");
  }
  return freeze(value as KerrDetectorProjectionAdmissionContractV442);
}

export function parseKerrDetectorProjectionAdmissionV442(
  value: unknown,
): KerrDetectorProjectionAdmissionArtifactV442 {
  const artifact = value as Partial<KerrDetectorProjectionAdmissionArtifactV442> | null;
  if (
    !artifact ||
    artifact.version !== KERR_DETECTOR_PROJECTION_ADMISSION_VERSION_V442 ||
    artifact.status !== "blocked-detector-projection-inputs-unavailable" ||
    !SHA256.test(artifact.artifactSha256 ?? "") ||
    !SHA256.test(artifact.sourceSha256 ?? "") ||
    artifact.sourceManifest?.length !== 7 ||
    artifact.sourceManifest.some(
      (source) =>
        !source.id ||
        !source.path.startsWith("dist/") ||
        !SHA256.test(source.sha256) ||
        (source.artifactSha256 !== null && !SHA256.test(source.artifactSha256)) ||
        !["present", "missing"].includes(source.status),
    ) ||
    artifact.gates?.length !== 11 ||
    artifact.gates.some((gate) => !validGate(gate)) ||
    new Set(artifact.gates.map((gate) => gate.id)).size !== 11 ||
    artifact.counts?.gateCount !== 11 ||
    artifact.counts.qualified !== 1 ||
    artifact.counts.partial !== 1 ||
    artifact.counts.missing !== 6 ||
    artifact.counts.blocked !== 3 ||
    artifact.inputs?.missingFiles.length !== 7 ||
    artifact.inputs.partialSources.length !== 1 ||
    artifact.wcs?.authority !== "qualified-linear-wcs" ||
    artifact.wcs.coordinateRows !== 24 ||
    artifact.wcs.detectorProjectionAllowed !== false ||
    artifact.projection?.measuredGeometryAuthority !== false ||
    artifact.projection.distortionCalibrationAuthority !== false ||
    artifact.projection.psfAuthority !== false ||
    artifact.projection.pixelResponseAuthority !== false ||
    artifact.projection.detectorProjectionAvailable !== false ||
    artifact.projection.rasterProductAvailable !== false ||
    artifact.projection.sciencePayloadMutationAllowed !== false ||
    artifact.qualification?.admission !== "blocked" ||
    artifact.qualification.sourcePackComplete !== false ||
    artifact.qualification.measuredAuthorityGranted !== false ||
    artifact.qualification.runtimeGeometryPublished !== false ||
    artifact.qualification.browserQualification !== "not-run" ||
    artifact.qualification.denseAuthority !== false ||
    artifact.networkAttempted !== false ||
    artifact.attemptConsumed !== false ||
    artifact.automaticRetryApplied !== false ||
    artifact.formalProductPointer !== "v263" ||
    artifact.denseCampaignStatus !== "incomplete-0-of-49"
  ) {
    throw new Error("v442-artifact-identity");
  }
  parseKerrDetectorProjectionAdmissionContractV442(artifact.contract);
  return freeze(value as KerrDetectorProjectionAdmissionArtifactV442);
}

export function createKerrDetectorProjectionAdmissionSummaryV442(
  value: unknown,
): KerrDetectorProjectionAdmissionSummaryV442 {
  const artifact = parseKerrDetectorProjectionAdmissionV442(value);
  return freeze({
    version: KERR_DETECTOR_PROJECTION_ADMISSION_VERSION_V442,
    status: artifact.status,
    artifactSha256: artifact.artifactSha256,
    counts: artifact.counts,
    gates: artifact.gates,
    inputs: artifact.inputs,
    wcs: artifact.wcs,
    projection: artifact.projection,
    qualification: artifact.qualification,
    boundary: artifact.boundary,
  });
}

export function parseKerrDetectorProjectionAdmissionApiV442(
  value: unknown,
): KerrDetectorProjectionAdmissionApiV442 {
  const api = value as Partial<KerrDetectorProjectionAdmissionApiV442> | null;
  if (
    !api ||
    api.version !== KERR_DETECTOR_PROJECTION_ADMISSION_API_VERSION_V442 ||
    typeof api.available !== "boolean" ||
    !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(api.reason ?? "") ||
    (api.available && !api.summary) ||
    (!api.available && api.summary !== null)
  ) {
    throw new Error("v442-api-identity");
  }
  return api as KerrDetectorProjectionAdmissionApiV442;
}

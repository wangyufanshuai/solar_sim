export const KERR_MEASURED_CALIBRATION_READINESS_VERSION_V503 =
  "v503-kerr-measured-calibration-readiness-artifact-v1" as const;
export const KERR_MEASURED_CALIBRATION_READINESS_API_VERSION_V503 =
  "v503-kerr-measured-calibration-readiness-api-v1" as const;

export const KERR_MEASURED_CALIBRATION_FILE_IDS_V503 = Object.freeze([
  "identity",
  "plate-scale",
  "distortion",
  "psf",
  "pixel-response",
  "provenance",
] as const);

export type KerrMeasuredCalibrationFileIdV503 =
  (typeof KERR_MEASURED_CALIBRATION_FILE_IDS_V503)[number];

export type KerrMeasuredCalibrationReadinessFileV503 = Readonly<{
  id: KerrMeasuredCalibrationFileIdV503;
  fileName: string;
  format: "json" | "csv";
  schemaVersion: string;
  requiredFields: readonly string[];
  unitContract: readonly string[];
  status: "missing";
  bytes: 0;
  sha256: null;
  provenanceLink:
    | "self-provenance-record"
    | `provenance.fileSha256.${Exclude<KerrMeasuredCalibrationFileIdV503, "provenance">}`;
}>;

export type KerrMeasuredCalibrationReadinessGateV503 = Readonly<{
  id: string;
  passed: boolean;
  evidence: string;
  requiredForAuthority: true;
}>;

export type KerrMeasuredCalibrationReadinessArtifactV503 = Readonly<{
  version: typeof KERR_MEASURED_CALIBRATION_READINESS_VERSION_V503;
  generatedAt: string;
  status: "readiness-protocol-qualified-measured-calibration-pack-missing";
  source: Readonly<{
    v458ArtifactSha256: string;
    v464ArtifactSha256: string;
    v465ArtifactSha256: string;
    v501ArtifactSha256: string;
  }>;
  contract: Readonly<{
    stagingRoot: "dist/staging/kerr-measured-detector-intake-v458";
    requiredFileCount: 6;
    readyFileCount: 0;
    maximumFileBytes: number;
    maximumTotalBytes: number;
    crossFileIdentityRequired: true;
    provenanceShaForFiveInputsRequired: true;
    licenseSnapshotRequired: true;
    independentValidationRequired: true;
    explicitAuthorityGrantRequired: true;
    blindValidationRequired: true;
    productionResponseRequired: true;
  }>;
  files: readonly KerrMeasuredCalibrationReadinessFileV503[];
  checklist: readonly KerrMeasuredCalibrationReadinessGateV503[];
  decision: Readonly<{
    admitted: false;
    reason: "measured-files-missing";
    readyFileCount: 0;
    missingFileCount: 6;
    passedGateCount: number;
    blockingGateCount: number;
    nextAction: "provide-six-measured-files-with-provenance";
  }>;
  outputs: Readonly<{
    detectorResponse: "unavailable";
    observedCounts: "unavailable";
    observedIntensity: "unavailable";
    scienceRaster: "unavailable";
    fitsProducts: 0;
    pngProducts: 0;
  }>;
  boundary: Readonly<{
    stagingInspectedByV503: false;
    networkAttempted: false;
    missingFilesGenerated: false;
    syntheticAuthorityAllowed: false;
    runtimePackagingAllowed: false;
    sciencePayloadMutationAllowed: false;
    denseCampaignStatus: "incomplete-0-of-49";
    browserQualification: "not-run";
  }>;
  sourceManifest: readonly Readonly<{ path: string; sha256: string }>[];
  sourceSha256: string;
  artifactSha256: string;
  formalProductPointer: "v263";
  formalDefaultKernel: "legacy-eih-1pn";
}>;

export type KerrMeasuredCalibrationReadinessSummaryV503 = Readonly<{
  version: typeof KERR_MEASURED_CALIBRATION_READINESS_VERSION_V503;
  status: KerrMeasuredCalibrationReadinessArtifactV503["status"];
  artifactSha256: string;
  source: KerrMeasuredCalibrationReadinessArtifactV503["source"];
  contract: KerrMeasuredCalibrationReadinessArtifactV503["contract"];
  files: KerrMeasuredCalibrationReadinessArtifactV503["files"];
  checklist: KerrMeasuredCalibrationReadinessArtifactV503["checklist"];
  decision: KerrMeasuredCalibrationReadinessArtifactV503["decision"];
  outputs: KerrMeasuredCalibrationReadinessArtifactV503["outputs"];
  boundary: KerrMeasuredCalibrationReadinessArtifactV503["boundary"];
}>;

export type KerrMeasuredCalibrationReadinessApiV503 = Readonly<{
  version: typeof KERR_MEASURED_CALIBRATION_READINESS_API_VERSION_V503;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt";
  summary: KerrMeasuredCalibrationReadinessSummaryV503 | null;
}>;

const SHA256 = /^[a-f0-9]{64}$/;
const TRANSIENT = new Set([
  "generatedAt",
  "artifactSha256",
  "evidenceSha256",
  "pointerSha256",
]);

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

export const canonicalKerrMeasuredCalibrationReadinessV503 = (
  value: unknown,
): string => JSON.stringify(canonicalize(value));

export function parseKerrMeasuredCalibrationReadinessArtifactV503(
  value: unknown,
): KerrMeasuredCalibrationReadinessArtifactV503 {
  if (!isRecord(value)) throw new Error("v503-artifact-shape");
  const artifact = value as Partial<KerrMeasuredCalibrationReadinessArtifactV503>;
  if (
    artifact.version !== KERR_MEASURED_CALIBRATION_READINESS_VERSION_V503 ||
    artifact.status !== "readiness-protocol-qualified-measured-calibration-pack-missing" ||
    !isRecord(artifact.source) ||
    Object.values(artifact.source).some((entry) => !SHA256.test(String(entry))) ||
    artifact.contract?.requiredFileCount !== 6 ||
    artifact.contract.readyFileCount !== 0 ||
    artifact.contract.stagingRoot !==
      "dist/staging/kerr-measured-detector-intake-v458" ||
    artifact.files?.length !== 6 ||
    artifact.files.some(
      (file) =>
        !KERR_MEASURED_CALIBRATION_FILE_IDS_V503.includes(file.id) ||
        file.status !== "missing" ||
        file.bytes !== 0 ||
        file.sha256 !== null ||
        file.requiredFields.length === 0 ||
        file.unitContract.length === 0,
    ) ||
    !Array.isArray(artifact.checklist) ||
    artifact.checklist.length < 8 ||
    artifact.decision?.admitted !== false ||
    artifact.decision.reason !== "measured-files-missing" ||
    artifact.decision.readyFileCount !== 0 ||
    artifact.decision.missingFileCount !== 6 ||
    artifact.outputs?.detectorResponse !== "unavailable" ||
    artifact.outputs.observedIntensity !== "unavailable" ||
    artifact.outputs.scienceRaster !== "unavailable" ||
    artifact.outputs.fitsProducts !== 0 ||
    artifact.outputs.pngProducts !== 0 ||
    artifact.boundary?.stagingInspectedByV503 !== false ||
    artifact.boundary.networkAttempted !== false ||
    artifact.boundary.missingFilesGenerated !== false ||
    artifact.boundary.syntheticAuthorityAllowed !== false ||
    artifact.boundary.denseCampaignStatus !== "incomplete-0-of-49" ||
    artifact.boundary.browserQualification !== "not-run" ||
    !SHA256.test(artifact.sourceSha256 ?? "") ||
    !SHA256.test(artifact.artifactSha256 ?? "") ||
    artifact.formalProductPointer !== "v263" ||
    artifact.formalDefaultKernel !== "legacy-eih-1pn"
  ) {
    throw new Error("v503-readiness-boundary");
  }
  return artifact as KerrMeasuredCalibrationReadinessArtifactV503;
}

export function createKerrMeasuredCalibrationReadinessSummaryV503(
  value: unknown,
): KerrMeasuredCalibrationReadinessSummaryV503 {
  const artifact = parseKerrMeasuredCalibrationReadinessArtifactV503(value);
  return Object.freeze({
    version: artifact.version,
    status: artifact.status,
    artifactSha256: artifact.artifactSha256,
    source: artifact.source,
    contract: artifact.contract,
    files: artifact.files,
    checklist: artifact.checklist,
    decision: artifact.decision,
    outputs: artifact.outputs,
    boundary: artifact.boundary,
  });
}

export function parseKerrMeasuredCalibrationReadinessSummaryV503(
  value: unknown,
): KerrMeasuredCalibrationReadinessSummaryV503 {
  if (!isRecord(value)) throw new Error("v503-summary-shape");
  const summary = value as Partial<KerrMeasuredCalibrationReadinessSummaryV503>;
  if (
    summary.version !== KERR_MEASURED_CALIBRATION_READINESS_VERSION_V503 ||
    summary.status !== "readiness-protocol-qualified-measured-calibration-pack-missing" ||
    !SHA256.test(summary.artifactSha256 ?? "") ||
    !isRecord(summary.source) ||
    Object.values(summary.source).some((entry) => !SHA256.test(String(entry))) ||
    summary.contract?.requiredFileCount !== 6 ||
    summary.contract.readyFileCount !== 0 ||
    summary.files?.length !== 6 ||
    summary.files.some(
      (file) =>
        !KERR_MEASURED_CALIBRATION_FILE_IDS_V503.includes(file.id) ||
        file.status !== "missing" ||
        file.bytes !== 0 ||
        file.sha256 !== null,
    ) ||
    !Array.isArray(summary.checklist) ||
    summary.checklist.length < 8 ||
    summary.decision?.admitted !== false ||
    summary.decision.readyFileCount !== 0 ||
    summary.decision.missingFileCount !== 6 ||
    summary.outputs?.scienceRaster !== "unavailable" ||
    summary.outputs.fitsProducts !== 0 ||
    summary.outputs.pngProducts !== 0 ||
    summary.boundary?.stagingInspectedByV503 !== false ||
    summary.boundary.networkAttempted !== false ||
    summary.boundary.missingFilesGenerated !== false
  ) {
    throw new Error("v503-summary-boundary");
  }
  return summary as KerrMeasuredCalibrationReadinessSummaryV503;
}

export function parseKerrMeasuredCalibrationReadinessApiV503(
  value: unknown,
): KerrMeasuredCalibrationReadinessApiV503 {
  if (!isRecord(value)) throw new Error("v503-api-shape");
  if (
    value.version !== KERR_MEASURED_CALIBRATION_READINESS_API_VERSION_V503 ||
    typeof value.available !== "boolean" ||
    !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt"].includes(
      String(value.reason),
    )
  ) {
    throw new Error("v503-api-boundary");
  }
  if (value.available) {
    parseKerrMeasuredCalibrationReadinessSummaryV503(value.summary);
  } else if (value.summary !== null) {
    throw new Error("v503-api-unavailable-summary");
  }
  return value as unknown as KerrMeasuredCalibrationReadinessApiV503;
}

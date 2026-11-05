export const KERR_MEASURED_DETECTOR_INTAKE_ARTIFACT_VERSION_V458 =
  "v458-kerr-measured-detector-intake-artifact-v1" as const;
export const KERR_MEASURED_DETECTOR_INTAKE_SUMMARY_VERSION_V458 =
  "v458-kerr-measured-detector-intake-summary-v1" as const;
export const KERR_MEASURED_DETECTOR_INTAKE_API_VERSION_V458 =
  "v458-kerr-measured-detector-intake-api-v1" as const;
export const KERR_MEASURED_DETECTOR_STAGING_ROOT_V458 =
  "dist/staging/kerr-measured-detector-intake-v458" as const;

export const KERR_MEASURED_DETECTOR_FILE_IDS_V458 = Object.freeze([
  "identity",
  "plate-scale",
  "distortion",
  "psf",
  "pixel-response",
  "provenance",
] as const);

export type KerrMeasuredDetectorFileIdV458 =
  (typeof KERR_MEASURED_DETECTOR_FILE_IDS_V458)[number];
export type KerrMeasuredDetectorFileStatusV458 = "missing" | "invalid" | "ready";
export type KerrMeasuredDetectorObservedFileV458 = Readonly<{
  id: KerrMeasuredDetectorFileIdV458;
  fileName: string;
  format: "json" | "csv";
  status: KerrMeasuredDetectorFileStatusV458;
  bytes: number;
  sha256: string | null;
  reasons: readonly string[];
}>;

export type KerrMeasuredDetectorIntakeArtifactV458 = Readonly<{
  version: typeof KERR_MEASURED_DETECTOR_INTAKE_ARTIFACT_VERSION_V458;
  generatedAt: string;
  status: "intake-protocol-qualified-staging-missing-measured-authority-blocked";
  source: Readonly<{
    v451ArtifactSha256: string;
    v457GateArtifactSha256: string;
    v314StateSha256: string;
  }>;
  contract: Readonly<{
    stagingRoot: typeof KERR_MEASURED_DETECTOR_STAGING_ROOT_V458;
    requiredFileCount: 6;
    maximumFileBytes: number;
    maximumTotalBytes: number;
    contentClasses: readonly [
      "measured-detector-calibration",
      "synthetic-validation-fixture",
    ];
    crossFileIdentityRequired: true;
    provenanceShaForFiveInputsRequired: true;
    licenseSnapshotRequired: true;
    independentValidationRequired: true;
    explicitAuthorityGrantRequired: true;
    atomicPublicationRequired: true;
  }>;
  schemaPack: Readonly<{
    version: "v458-kerr-measured-detector-schema-pack-v1";
    schemaCount: 6;
    schemas: readonly Readonly<{
      id: KerrMeasuredDetectorFileIdV458;
      fileName: string;
      format: "json" | "csv";
      schemaVersion: string;
      requiredFields: readonly string[];
      unitContract: readonly string[];
    }>[];
    schemaPackSha256: string;
  }>;
  validator: Readonly<{
    qualified: true;
    acceptedSyntheticControlCount: 1;
    syntheticControlAuthorityGranted: false;
    rejectedAdversarialFixtureCount: 11;
    adversarialFixtures: readonly Readonly<{
      id: string;
      expectedReason: string;
      observedReason: string;
      rejected: true;
    }>[];
  }>;
  inspect: Readonly<{
    stagingRootPresent: false;
    files: readonly KerrMeasuredDetectorObservedFileV458[];
    readyFileCount: 0;
    missingFileIds: readonly KerrMeasuredDetectorFileIdV458[];
    invalidFileIds: readonly KerrMeasuredDetectorFileIdV458[];
    candidateReadyForIndependentValidation: false;
    attemptConsumed: false;
  }>;
  productionAdmission: Readonly<{
    contentClass: "unavailable";
    measuredInputInventoryQualified: false;
    crossFileIdentityQualified: false;
    provenanceShaLinkageQualified: false;
    licenseBoundaryQualified: false;
    independentValidationQualified: false;
    explicitAuthorityGrant: false;
    measuredDetectorAuthorityGranted: false;
    runtimeProjectionAllowed: false;
    scienceRasterAllowed: false;
  }>;
  qualification: Readonly<{
    schemaPackQualified: true;
    boundedValidatorQualified: true;
    syntheticProductionFirewallQualified: true;
    measuredDetectorIntakeQualified: false;
    browserQualification: "not-run";
  }>;
  boundary: Readonly<{
    templatesPersistedAsMeasuredData: false;
    syntheticFixtureMayGrantAuthority: false;
    stagingDataPackagedAtRuntime: false;
    fitsWriteAllowed: false;
    pngWriteAllowed: false;
    sciencePayloadMutationAllowed: false;
    networkAttempted: false;
    automaticRetryApplied: false;
  }>;
  formalProductPointer: "v263";
  formalDefaultKernel: "legacy-eih-1pn";
  denseCampaignStatus: "incomplete-0-of-49";
  artifactSha256: string;
}>;

export type KerrMeasuredDetectorIntakeSummaryV458 = Readonly<{
  version: typeof KERR_MEASURED_DETECTOR_INTAKE_SUMMARY_VERSION_V458;
  status: KerrMeasuredDetectorIntakeArtifactV458["status"];
  artifactSha256: string;
  contract: KerrMeasuredDetectorIntakeArtifactV458["contract"];
  schemaPack: KerrMeasuredDetectorIntakeArtifactV458["schemaPack"];
  validator: KerrMeasuredDetectorIntakeArtifactV458["validator"];
  inspect: KerrMeasuredDetectorIntakeArtifactV458["inspect"];
  productionAdmission: KerrMeasuredDetectorIntakeArtifactV458["productionAdmission"];
  qualification: KerrMeasuredDetectorIntakeArtifactV458["qualification"];
  boundary: KerrMeasuredDetectorIntakeArtifactV458["boundary"];
}>;

export type KerrMeasuredDetectorIntakeApiV458 = Readonly<{
  version: typeof KERR_MEASURED_DETECTOR_INTAKE_API_VERSION_V458;
  available: boolean;
  reason:
    | "ready"
    | "lite-boundary"
    | "local-shadow-only"
    | "evidence-corrupt"
    | "request-failed";
  summary: KerrMeasuredDetectorIntakeSummaryV458 | null;
}>;

const SHA256 = /^[a-f0-9]{64}$/;
const transientKeys = new Set([
  "generatedAt",
  "artifactSha256",
  "evidenceSha256",
  "pointerSha256",
]);

function freezeDeep<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      freezeDeep(child);
    }
  }
  return value;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !transientKeys.has(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
}

export const canonicalKerrMeasuredDetectorIntakePayloadV458 = (
  value: unknown,
): string => JSON.stringify(canonicalize(value));

function validObservedFile(value: unknown): value is KerrMeasuredDetectorObservedFileV458 {
  const file = value as Partial<KerrMeasuredDetectorObservedFileV458> | null;
  return Boolean(
    file &&
      KERR_MEASURED_DETECTOR_FILE_IDS_V458.includes(
        file.id as KerrMeasuredDetectorFileIdV458,
      ) &&
      typeof file.fileName === "string" &&
      ["json", "csv"].includes(file.format ?? "") &&
      ["missing", "invalid", "ready"].includes(file.status ?? "") &&
      Number.isInteger(file.bytes) &&
      Number(file.bytes) >= 0 &&
      (file.sha256 === null ||
        (typeof file.sha256 === "string" && SHA256.test(file.sha256))) &&
      Array.isArray(file.reasons) &&
      file.reasons.every((reason) => typeof reason === "string"),
  );
}

export function parseKerrMeasuredDetectorIntakeArtifactV458(
  value: unknown,
): KerrMeasuredDetectorIntakeArtifactV458 {
  const artifact =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrMeasuredDetectorIntakeArtifactV458>)
      : null;
  if (
    !artifact ||
    artifact.version !== KERR_MEASURED_DETECTOR_INTAKE_ARTIFACT_VERSION_V458 ||
    artifact.status !==
      "intake-protocol-qualified-staging-missing-measured-authority-blocked" ||
    !SHA256.test(artifact.artifactSha256 ?? "") ||
    !artifact.source ||
    Object.values(artifact.source).some((entry) => !SHA256.test(entry)) ||
    artifact.contract?.stagingRoot !== KERR_MEASURED_DETECTOR_STAGING_ROOT_V458 ||
    artifact.contract.requiredFileCount !== 6 ||
    artifact.contract.crossFileIdentityRequired !== true ||
    artifact.contract.provenanceShaForFiveInputsRequired !== true ||
    artifact.contract.licenseSnapshotRequired !== true ||
    artifact.contract.independentValidationRequired !== true ||
    artifact.contract.explicitAuthorityGrantRequired !== true ||
    artifact.contract.atomicPublicationRequired !== true ||
    artifact.schemaPack?.version !== "v458-kerr-measured-detector-schema-pack-v1" ||
    artifact.schemaPack.schemaCount !== 6 ||
    artifact.schemaPack.schemas.length !== 6 ||
    !SHA256.test(artifact.schemaPack.schemaPackSha256) ||
    artifact.validator?.qualified !== true ||
    artifact.validator.acceptedSyntheticControlCount !== 1 ||
    artifact.validator.syntheticControlAuthorityGranted !== false ||
    artifact.validator.rejectedAdversarialFixtureCount !== 11 ||
    artifact.validator.adversarialFixtures.length !== 11 ||
    artifact.validator.adversarialFixtures.some(
      (fixture) =>
        fixture.rejected !== true || fixture.expectedReason !== fixture.observedReason,
    ) ||
    artifact.inspect?.stagingRootPresent !== false ||
    artifact.inspect.files.length !== 6 ||
    artifact.inspect.files.some((file) => !validObservedFile(file)) ||
    artifact.inspect.files.some((file) => file.status !== "missing") ||
    artifact.inspect.readyFileCount !== 0 ||
    artifact.inspect.missingFileIds.length !== 6 ||
    artifact.inspect.invalidFileIds.length !== 0 ||
    artifact.inspect.candidateReadyForIndependentValidation !== false ||
    artifact.inspect.attemptConsumed !== false ||
    artifact.productionAdmission?.contentClass !== "unavailable" ||
    Object.entries(artifact.productionAdmission)
      .filter(([key]) => key !== "contentClass")
      .some(([, entry]) => entry !== false) ||
    artifact.qualification?.schemaPackQualified !== true ||
    artifact.qualification.boundedValidatorQualified !== true ||
    artifact.qualification.syntheticProductionFirewallQualified !== true ||
    artifact.qualification.measuredDetectorIntakeQualified !== false ||
    artifact.qualification.browserQualification !== "not-run" ||
    artifact.boundary?.templatesPersistedAsMeasuredData !== false ||
    artifact.boundary.syntheticFixtureMayGrantAuthority !== false ||
    artifact.boundary.stagingDataPackagedAtRuntime !== false ||
    artifact.boundary.fitsWriteAllowed !== false ||
    artifact.boundary.pngWriteAllowed !== false ||
    artifact.boundary.sciencePayloadMutationAllowed !== false ||
    artifact.boundary.networkAttempted !== false ||
    artifact.boundary.automaticRetryApplied !== false ||
    artifact.formalProductPointer !== "v263" ||
    artifact.formalDefaultKernel !== "legacy-eih-1pn" ||
    artifact.denseCampaignStatus !== "incomplete-0-of-49"
  ) {
    throw new Error("v458-measured-detector-intake-artifact-identity");
  }
  return freezeDeep(value as KerrMeasuredDetectorIntakeArtifactV458);
}

export function createKerrMeasuredDetectorIntakeSummaryV458(
  value: unknown,
): KerrMeasuredDetectorIntakeSummaryV458 {
  const artifact = parseKerrMeasuredDetectorIntakeArtifactV458(value);
  return freezeDeep({
    version: KERR_MEASURED_DETECTOR_INTAKE_SUMMARY_VERSION_V458,
    status: artifact.status,
    artifactSha256: artifact.artifactSha256,
    contract: artifact.contract,
    schemaPack: artifact.schemaPack,
    validator: artifact.validator,
    inspect: artifact.inspect,
    productionAdmission: artifact.productionAdmission,
    qualification: artifact.qualification,
    boundary: artifact.boundary,
  });
}

export function parseKerrMeasuredDetectorIntakeApiV458(
  value: unknown,
): KerrMeasuredDetectorIntakeApiV458 {
  const api =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrMeasuredDetectorIntakeApiV458>)
      : null;
  if (
    !api ||
    api.version !== KERR_MEASURED_DETECTOR_INTAKE_API_VERSION_V458 ||
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
    throw new Error("v458-measured-detector-intake-api-identity");
  }
  return freezeDeep(value as KerrMeasuredDetectorIntakeApiV458);
}

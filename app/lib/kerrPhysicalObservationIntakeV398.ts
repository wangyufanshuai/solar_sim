import { sha256Utf8HexV566 } from "./sha256BrowserV566";
import {
  createKerrPhysicalObservationControlFixtureV397,
  validateKerrPhysicalObservationPackV397,
  type KerrPhysicalObservationPackV397,
} from "./kerrPhysicalObservationAdmissionV397";
import type { KerrCovarianceSourceAdmissionArtifactV393 } from "./kerrCovarianceSourceDossierV393";
import type { KerrTemperatureSystematicsTransferArtifactV390 } from "./kerrTemperatureSystematicsTransferV390";

export const KERR_PHYSICAL_OBSERVATION_INTAKE_MANIFEST_VERSION_V398 =
  "v398-kerr-physical-observation-intake-manifest-v1" as const;
export const KERR_PHYSICAL_OBSERVATION_INTAKE_ARTIFACT_VERSION_V398 =
  "v398-kerr-physical-observation-intake-v1" as const;
export const V398_STAGING_ROOT =
  "dist/staging/kerr-physical-observation-v398" as const;
export const V398_MAX_TOTAL_BYTES = 64 * 1024 * 1024;
export const V398_MAX_FILE_BYTES = 16 * 1024 * 1024;
export const V398_MAX_PACK_BYTES = 512 * 1024;

const SHA256 = /^[a-f0-9]{64}$/;
const PARAMETERS = Object.freeze([
  "ln-photon-radiance",
  "ln-redshift-factor",
  "ln-page-thorne-flux",
] as const);
const CROSS_PAIRS = Object.freeze([
  "photon-radiance--redshift",
  "photon-radiance--page-thorne-flux",
  "redshift--page-thorne-flux",
] as const);
const EXPECTED_FILE_KEYS = Object.freeze([
  "pack:observation-pack",
  ...PARAMETERS.flatMap((parameter) => [
    `source-data:${parameter}`,
    `source-provenance:${parameter}`,
    `license-terms:${parameter}`,
  ]),
  ...CROSS_PAIRS.map((pair) => `cross-evidence:${pair}`),
]);

type FileRoleV398 =
  | "pack"
  | "source-data"
  | "source-provenance"
  | "license-terms"
  | "cross-evidence";

export type KerrPhysicalObservationIntakeFileV398 = Readonly<{
  role: FileRoleV398;
  ownerId: string;
  relativePath: string;
  sha256: string;
  bytes: number;
}>;

export type KerrPhysicalObservationIntakeManifestV398 = Readonly<{
  version: typeof KERR_PHYSICAL_OBSERVATION_INTAKE_MANIFEST_VERSION_V398;
  manifestId: string;
  contentClass: "physical-observation-intake" | "synthetic-validation-fixture";
  publicationIntent: "publishable" | "validation-only";
  stagingRoot: typeof V398_STAGING_ROOT;
  source: Readonly<{
    v397AdmissionArtifactSha256: string;
    manifestArtifactSha256: string;
    packCanonicalSha256: string;
  }>;
  files: readonly KerrPhysicalObservationIntakeFileV398[];
}>;

export type KerrPhysicalObservationIntakeObservedFileV398 = Readonly<{
  relativePath: string;
  sha256: string;
  bytes: number;
}>;

export type KerrPhysicalObservationIntakeRejectionV398 =
  | "manifest-not-object"
  | "manifest-version"
  | "manifest-identity"
  | "admission-source-sha"
  | "manifest-sha"
  | "unsafe-relative-path"
  | "duplicate-path"
  | "file-set"
  | "file-sha"
  | "file-size"
  | "total-size"
  | "pack-canonical-sha"
  | "pack-admission"
  | "synthetic-fixture-marked-publishable";

export type KerrPhysicalObservationIntakeValidationV398 = Readonly<{
  status: "admitted-physical" | "admitted-validation-only" | "rejected";
  compileAllowed: boolean;
  publicationAllowed: boolean;
  rejectionReasons: readonly KerrPhysicalObservationIntakeRejectionV398[];
  checkedFileCount: number;
  totalBytes: number;
}>;

export type KerrPhysicalObservationIntakeArtifactV398 = Readonly<{
  version: typeof KERR_PHYSICAL_OBSERVATION_INTAKE_ARTIFACT_VERSION_V398;
  generatedAt: string;
  status: "local-intake-compiler-qualified-physical-staging-unavailable-compile-not-run";
  source: Readonly<{
    v397AdmissionArtifactSha256: string;
    v397EvidenceSha256: string;
    fullShortAuthoritySha256: string;
  }>;
  schema: Readonly<{
    stagingRoot: typeof V398_STAGING_ROOT;
    expectedFileCount: 13;
    requiredPackCount: 1;
    requiredSourceDataCount: 3;
    requiredSourceProvenanceCount: 3;
    requiredLicenseSnapshotCount: 3;
    requiredCrossEvidenceCount: 3;
    maximumPackBytes: number;
    maximumFileBytes: number;
    maximumTotalBytes: number;
    pathTraversalForbidden: true;
    absolutePathForbidden: true;
    atomicPublicationRequired: true;
  }>;
  validator: Readonly<{
    qualified: true;
    acceptedControlFixtureCount: 1;
    rejectedAdversarialFixtureCount: 10;
    adversarialFixtures: readonly Readonly<{
      id: string;
      expectedReason: KerrPhysicalObservationIntakeRejectionV398;
      observedReason: KerrPhysicalObservationIntakeRejectionV398;
      rejected: true;
    }>[];
  }>;
  inspect: Readonly<{
    stagingManifestPresent: false;
    presentFileCount: 0;
    expectedFileCount: 13;
    compileExecuted: false;
    candidatePublished: false;
    attemptConsumed: false;
  }>;
  productionAdmission: Readonly<{
    physicalIntakeManifestAvailable: false;
    physicalObservationPackAvailable: false;
    allSourceFilesVerified: false;
    allLicenseSnapshotsVerified: false;
    allCrossEvidenceVerified: false;
    physicalPackCompiled: false;
    physicalPackPublished: false;
    measuredAuthorityGranted: false;
  }>;
  qualification: Readonly<{
    intakeManifestContractQualified: true;
    boundedFileVerifierQualified: true;
    atomicCompilerImplemented: true;
    physicalObservationIntakeQualified: false;
    measuredAuthorityGranted: false;
  }>;
  compileCommand: "npm run atlas -- relativity measurement-authority-v398-compile";
  networkAttempted: false;
  sciencePayloadMutationAllowed: false;
  cinematicConsumerAllowed: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  artifactSha256: string;
}>;

type MutableRecord = Record<string, unknown>;
const isObject = (value: unknown): value is MutableRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
const addReason = (
  target: KerrPhysicalObservationIntakeRejectionV398[],
  reason: KerrPhysicalObservationIntakeRejectionV398,
) => { if (!target.includes(reason)) target.push(reason); };
const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !["generatedAt", "artifactSha256", "packArtifactSha256"].includes(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]));
export const canonicalKerrPhysicalObservationPackShaV398 = (value: unknown) =>
  sha256Utf8HexV566(JSON.stringify(canonicalize(value)));
const safeRelativePath = (value: string) =>
  value.length > 0 && value.length <= 180 && !value.includes("\\") &&
  !value.startsWith("/") && !/^[A-Za-z]:/.test(value) &&
  value.split("/").every((segment) => segment.length > 0 && segment !== "." && segment !== "..") &&
  /^[A-Za-z0-9._/-]+$/.test(value);
const fileKey = (file: { role?: unknown; ownerId?: unknown }) =>
  `${file.role}:${file.ownerId}`;

export function validateKerrPhysicalObservationIntakeV398(
  manifestValue: unknown,
  observedFiles: readonly KerrPhysicalObservationIntakeObservedFileV398[],
  packValue: unknown,
  transferValue: KerrTemperatureSystematicsTransferArtifactV390,
  sourceAdmissionValue: KerrCovarianceSourceAdmissionArtifactV393,
  v397AdmissionArtifactSha256: string,
  v396ConstraintDesignArtifactSha256: string,
): KerrPhysicalObservationIntakeValidationV398 {
  if (!isObject(manifestValue)) return Object.freeze({ status: "rejected", compileAllowed: false, publicationAllowed: false, rejectionReasons: Object.freeze(["manifest-not-object" as const]), checkedFileCount: 0, totalBytes: 0 });
  const manifest = manifestValue;
  const reasons: KerrPhysicalObservationIntakeRejectionV398[] = [];
  if (manifest.version !== KERR_PHYSICAL_OBSERVATION_INTAKE_MANIFEST_VERSION_V398) addReason(reasons, "manifest-version");
  if (typeof manifest.manifestId !== "string" || manifest.manifestId.length < 3 || manifest.stagingRoot !== V398_STAGING_ROOT || (manifest.contentClass !== "physical-observation-intake" && manifest.contentClass !== "synthetic-validation-fixture")) addReason(reasons, "manifest-identity");
  if (manifest.contentClass === "synthetic-validation-fixture" && manifest.publicationIntent === "publishable") addReason(reasons, "synthetic-fixture-marked-publishable");
  const source = isObject(manifest.source) ? manifest.source : null;
  if (source?.v397AdmissionArtifactSha256 !== v397AdmissionArtifactSha256) addReason(reasons, "admission-source-sha");
  if (!SHA256.test(String(source?.manifestArtifactSha256 ?? ""))) addReason(reasons, "manifest-sha");
  if (!SHA256.test(String(source?.packCanonicalSha256 ?? "")) || source?.packCanonicalSha256 !== canonicalKerrPhysicalObservationPackShaV398(packValue)) addReason(reasons, "pack-canonical-sha");
  const files = Array.isArray(manifest.files) ? manifest.files : [];
  const keySet = new Set<string>();
  const pathSet = new Set<string>();
  let totalBytes = 0;
  for (const fileValue of files) {
    if (!isObject(fileValue)) { addReason(reasons, "file-set"); continue; }
    keySet.add(fileKey(fileValue));
    const relativePath = String(fileValue.relativePath ?? "");
    if (!safeRelativePath(relativePath)) addReason(reasons, "unsafe-relative-path");
    if (pathSet.has(relativePath)) addReason(reasons, "duplicate-path");
    pathSet.add(relativePath);
    if (!SHA256.test(String(fileValue.sha256 ?? ""))) addReason(reasons, "file-sha");
    if (!Number.isInteger(fileValue.bytes) || Number(fileValue.bytes) <= 0 || Number(fileValue.bytes) > V398_MAX_FILE_BYTES || (fileValue.role === "pack" && Number(fileValue.bytes) > V398_MAX_PACK_BYTES)) addReason(reasons, "file-size");
    totalBytes += Number(fileValue.bytes) || 0;
    const observed = observedFiles.find((entry) => entry.relativePath === relativePath);
    if (!observed || observed.sha256 !== fileValue.sha256) addReason(reasons, "file-sha");
    if (!observed || observed.bytes !== fileValue.bytes) addReason(reasons, "file-size");
  }
  if (files.length !== 13 || keySet.size !== 13 || EXPECTED_FILE_KEYS.some((key) => !keySet.has(key))) addReason(reasons, "file-set");
  if (totalBytes > V398_MAX_TOTAL_BYTES) addReason(reasons, "total-size");
  const packAdmission = validateKerrPhysicalObservationPackV397(packValue, transferValue, sourceAdmissionValue, v396ConstraintDesignArtifactSha256);
  if (packAdmission.status === "rejected") addReason(reasons, "pack-admission");
  const rejected = reasons.length > 0;
  const validationOnly = !rejected && manifest.contentClass === "synthetic-validation-fixture";
  return Object.freeze({
    status: rejected ? "rejected" : validationOnly ? "admitted-validation-only" : "admitted-physical",
    compileAllowed: !rejected && !validationOnly && packAdmission.status === "admitted-physical",
    publicationAllowed: !rejected && !validationOnly && manifest.publicationIntent === "publishable" && packAdmission.publicationAllowed,
    rejectionReasons: Object.freeze(reasons),
    checkedFileCount: files.length,
    totalBytes,
  });
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const hashLetter = (index: number) => "abcdef0123456789"[index].repeat(64);
export function createKerrPhysicalObservationIntakeControlV398(
  transferValue: KerrTemperatureSystematicsTransferArtifactV390,
  sourceAdmissionValue: KerrCovarianceSourceAdmissionArtifactV393,
  v397AdmissionArtifactSha256: string,
  v396ConstraintDesignArtifactSha256: string,
) {
  const pack = clone(createKerrPhysicalObservationControlFixtureV397(transferValue, sourceAdmissionValue, v396ConstraintDesignArtifactSha256)) as KerrPhysicalObservationPackV397 & { source: { packArtifactSha256: string } };
  pack.source.packArtifactSha256 = canonicalKerrPhysicalObservationPackShaV398(pack);
  const entries: Array<{ role: FileRoleV398; ownerId: string; relativePath: string }> = [
    { role: "pack", ownerId: "observation-pack", relativePath: "physical-observation-pack.json" },
    ...PARAMETERS.flatMap((parameter) => [
      { role: "source-data" as const, ownerId: parameter, relativePath: `sources/${parameter}.json` },
      { role: "source-provenance" as const, ownerId: parameter, relativePath: `provenance/${parameter}.json` },
      { role: "license-terms" as const, ownerId: parameter, relativePath: `terms/${parameter}.txt` },
    ]),
    ...CROSS_PAIRS.map((pair) => ({ role: "cross-evidence" as const, ownerId: pair, relativePath: `cross/${pair}.json` })),
  ];
  const files = entries.map((entry, index) => Object.freeze({ ...entry, sha256: hashLetter(index), bytes: 1024 + index }));
  const manifest = Object.freeze({
    version: KERR_PHYSICAL_OBSERVATION_INTAKE_MANIFEST_VERSION_V398,
    manifestId: "v398-intake-control-fixture",
    contentClass: "synthetic-validation-fixture" as const,
    publicationIntent: "validation-only" as const,
    stagingRoot: V398_STAGING_ROOT,
    source: Object.freeze({ v397AdmissionArtifactSha256, manifestArtifactSha256: "f".repeat(64), packCanonicalSha256: canonicalKerrPhysicalObservationPackShaV398(pack) }),
    files: Object.freeze(files),
  });
  const observedFiles = Object.freeze(files.map(({ relativePath, sha256, bytes }) => Object.freeze({ relativePath, sha256, bytes })));
  return Object.freeze({ manifest, observedFiles, pack });
}

export function createKerrPhysicalObservationIntakeAdversarialFixturesV398(
  transferValue: KerrTemperatureSystematicsTransferArtifactV390,
  sourceAdmissionValue: KerrCovarianceSourceAdmissionArtifactV393,
  v397AdmissionArtifactSha256: string,
  v396ConstraintDesignArtifactSha256: string,
) {
  const control = createKerrPhysicalObservationIntakeControlV398(transferValue, sourceAdmissionValue, v397AdmissionArtifactSha256, v396ConstraintDesignArtifactSha256);
  const fixture = (id: string, expectedReason: KerrPhysicalObservationIntakeRejectionV398, mutate: (manifest: MutableRecord, observed: MutableRecord[], pack: MutableRecord) => void) => {
    const manifest = clone(control.manifest) as unknown as MutableRecord;
    const observed = clone(control.observedFiles) as unknown as MutableRecord[];
    const pack = clone(control.pack) as unknown as MutableRecord;
    mutate(manifest, observed, pack);
    return Object.freeze({ id, expectedReason, manifest, observedFiles: observed as unknown as readonly KerrPhysicalObservationIntakeObservedFileV398[], pack });
  };
  return Object.freeze([
    fixture("wrong-v397-sha", "admission-source-sha", (manifest) => { (manifest.source as MutableRecord).v397AdmissionArtifactSha256 = "0".repeat(64); }),
    fixture("path-traversal", "unsafe-relative-path", (manifest) => { ((manifest.files as MutableRecord[])[1]).relativePath = "../escape.json"; }),
    fixture("absolute-path", "unsafe-relative-path", (manifest) => { ((manifest.files as MutableRecord[])[2]).relativePath = "C:/escape.json"; }),
    fixture("duplicate-path", "duplicate-path", (manifest) => { ((manifest.files as MutableRecord[])[2]).relativePath = (manifest.files as MutableRecord[])[1].relativePath; }),
    fixture("missing-license-snapshot", "file-set", (manifest) => { (manifest.files as MutableRecord[]).splice(3, 1); }),
    fixture("file-sha-mismatch", "file-sha", (_manifest, observed) => { observed[4].sha256 = "0".repeat(64); }),
    fixture("file-size-mismatch", "file-size", (_manifest, observed) => { observed[5].bytes = 1; }),
    fixture("total-size-overflow", "total-size", (manifest, observed) => { for (const file of manifest.files as MutableRecord[]) file.bytes = V398_MAX_FILE_BYTES; for (const file of observed) file.bytes = V398_MAX_FILE_BYTES; }),
    fixture("pack-canonical-mismatch", "pack-canonical-sha", (manifest) => { (manifest.source as MutableRecord).packCanonicalSha256 = "0".repeat(64); }),
    fixture("synthetic-marked-publishable", "synthetic-fixture-marked-publishable", (manifest) => { manifest.publicationIntent = "publishable"; }),
  ]);
}

export function parseKerrPhysicalObservationIntakeArtifactV398(value: unknown): KerrPhysicalObservationIntakeArtifactV398 {
  const source = isObject(value) ? value as Partial<KerrPhysicalObservationIntakeArtifactV398> : null;
  const fixtures = Array.isArray(source?.validator?.adversarialFixtures) ? source.validator.adversarialFixtures : [];
  if (!source || source.version !== KERR_PHYSICAL_OBSERVATION_INTAKE_ARTIFACT_VERSION_V398 || source.status !== "local-intake-compiler-qualified-physical-staging-unavailable-compile-not-run" || !source.source || !Object.values(source.source).every((entry) => SHA256.test(entry)) || source.schema?.stagingRoot !== V398_STAGING_ROOT || source.schema.expectedFileCount !== 13 || source.schema.requiredPackCount !== 1 || source.schema.requiredSourceDataCount !== 3 || source.schema.requiredSourceProvenanceCount !== 3 || source.schema.requiredLicenseSnapshotCount !== 3 || source.schema.requiredCrossEvidenceCount !== 3 || source.schema.maximumPackBytes !== V398_MAX_PACK_BYTES || source.schema.maximumFileBytes !== V398_MAX_FILE_BYTES || source.schema.maximumTotalBytes !== V398_MAX_TOTAL_BYTES || source.schema.pathTraversalForbidden !== true || source.schema.absolutePathForbidden !== true || source.schema.atomicPublicationRequired !== true || source.validator?.qualified !== true || source.validator.acceptedControlFixtureCount !== 1 || source.validator.rejectedAdversarialFixtureCount !== 10 || fixtures.length !== 10 || fixtures.some((entry) => entry.rejected !== true || entry.expectedReason !== entry.observedReason) || source.inspect?.stagingManifestPresent !== false || source.inspect.presentFileCount !== 0 || source.inspect.expectedFileCount !== 13 || source.inspect.compileExecuted !== false || source.inspect.candidatePublished !== false || source.inspect.attemptConsumed !== false || source.productionAdmission?.physicalIntakeManifestAvailable !== false || source.productionAdmission.physicalObservationPackAvailable !== false || source.productionAdmission.allSourceFilesVerified !== false || source.productionAdmission.allLicenseSnapshotsVerified !== false || source.productionAdmission.allCrossEvidenceVerified !== false || source.productionAdmission.physicalPackCompiled !== false || source.productionAdmission.physicalPackPublished !== false || source.productionAdmission.measuredAuthorityGranted !== false || source.qualification?.intakeManifestContractQualified !== true || source.qualification.boundedFileVerifierQualified !== true || source.qualification.atomicCompilerImplemented !== true || source.qualification.physicalObservationIntakeQualified !== false || source.qualification.measuredAuthorityGranted !== false || source.compileCommand !== "npm run atlas -- relativity measurement-authority-v398-compile" || source.networkAttempted !== false || source.sciencePayloadMutationAllowed !== false || source.cinematicConsumerAllowed !== false || source.formalProductPointer !== "v263" || source.denseCampaignStatus !== "incomplete-0-of-49" || source.browserQualification !== "not-run" || !SHA256.test(source.artifactSha256 ?? "")) throw new Error("v398-physical-observation-intake-artifact-identity");
  return value as KerrPhysicalObservationIntakeArtifactV398;
}

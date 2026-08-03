import { createHash } from "node:crypto";
import {
  validateKerrHighEnergyResponseSubmissionV427,
  type KerrHighEnergyResponseAcquisitionSubmissionV427,
  type KerrHighEnergyResponseValidatorMetricsV427,
} from "./kerrHighEnergyResponseAcquisitionPackV427";

export const KERR_HIGH_ENERGY_RESPONSE_INTAKE_VERSION_V428 = "v428-kerr-high-energy-response-intake-firewall-v1" as const;
export const KERR_HIGH_ENERGY_RESPONSE_INTAKE_ARTIFACT_VERSION_V428 = "v428-kerr-high-energy-response-intake-firewall-artifact-v1" as const;
export const KERR_HIGH_ENERGY_RESPONSE_INTAKE_SUMMARY_VERSION_V428 = "v428-kerr-high-energy-response-intake-firewall-summary-v1" as const;
export const KERR_HIGH_ENERGY_RESPONSE_INTAKE_API_VERSION_V428 = "v428-kerr-high-energy-response-intake-firewall-api-v1" as const;
export const KERR_V427_ARTIFACT_SHA256_V428 = "e1a81b23a4c43700706fbeea25db8c0610879508259228c71a9cf200e9de3a52" as const;
export const KERR_V427_ARTIFACT_FILE_SHA256_V428 = "0320a996601ce721cc2eacc18204168ba57706f7d8a45081f273e00cf7e62c60" as const;
export const KERR_V427_EVIDENCE_SHA256_V428 = "2df5fb6d4a46422cc2204eedd0b183b6ea54c32fa276dfd322a6b550aff00000" as const;
export const KERR_V427_EVIDENCE_FILE_SHA256_V428 = "2ac50f9db5b65007c3a3e901eb1343d3f5173aceaece165668fb16dc8272fdb8" as const;
export const KERR_V427_POINTER_SHA256_V428 = "04f0de8726748db8de80161908e2baf7a3e33ca64a9294f682376bc0be609d1a" as const;
export const KERR_V427_POINTER_FILE_SHA256_V428 = "7531e706091aee71d99a8a6e40b4241387c82ee95162a90f6f2caaea83e6a48b" as const;

const SHA = /^[a-f0-9]{64}$/;
const TRANSIENT = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);

export type KerrHighEnergyResponseIntakePythonReportV428 = Readonly<{
  version: "v428-kerr-high-energy-response-intake-fixture-report-v1";
  generatedAt: string;
  status: "qualified-intake-firewall-fixture-rejected-no-measured-submission";
  sourceV427ArtifactSha256: typeof KERR_V427_ARTIFACT_SHA256_V428;
  sourceV427ArtifactFileSha256: typeof KERR_V427_ARTIFACT_FILE_SHA256_V428;
  fixtureArchiveSha256: string;
  fixtureArchiveBytes: number;
  fixtureReport: Readonly<{
    version: "v428-kerr-high-energy-response-intake-report-v1";
    status: "validated-test-fixture-intake-nonpublishable";
    sourceKind: "test-fixture";
    archiveSha256: string;
    valid: true;
    containerQualified: true;
    csvBridgeQualified: true;
    unitContractQualified: true;
    fileShaQualified: true;
    provenanceQualified: true;
    measuredAuthorityGranted: false;
    scienceResponseApplicationAllowed: false;
    errors: readonly [];
    metrics: KerrHighEnergyResponseValidatorMetricsV427;
    normalizedSubmissionSha256: string;
    normalizedSubmissionIncluded: true;
    boundary: string;
  }>;
  mutationResults: readonly Readonly<{ id: string; status: "rejected-invalid-intake"; rejected: true; errors: readonly string[] }>[];
  mutationCount: 12;
  rejectedMutationCount: 12;
  measuredSubmissionPresent: false;
  measuredImportAttempted: false;
  measuredAuthorityGranted: false;
  scienceResponseApplicationCount: 0;
  networkAttempted: false;
  boundary: string;
  artifactSha256: string;
}>;

export type KerrHighEnergyResponseSubmissionSchemaV428 = Readonly<{
  $schema: "https://json-schema.org/draft/2020-12/schema";
  $id: "orbit-atlas://kerr/high-energy-response-submission/v428";
  title: string;
  version: "v428-kerr-high-energy-response-submission-schema-v1";
  archive: Readonly<{
    format: "zip";
    maximumBytes: number;
    maximumTotalUncompressedBytes: number;
    maximumMemberBytes: number;
    maximumCompressionRatio: number;
    expectedFiles: readonly string[];
    directoriesAllowed: false;
    symlinksAllowed: false;
    encryptedMembersAllowed: false;
  }>;
  csvHeaders: Readonly<Record<string, readonly string[]>>;
  rowCaps: Readonly<Record<string, number>>;
  units: Readonly<Record<string, string>>;
  requiredRepeatCountMinimum: 2;
  measuredAttestation: "real-measured-high-energy-response-not-synthetic-or-example";
  admissionBoundary: string;
}>;

export type KerrHighEnergyResponseIntakeViewV428 = Readonly<{
  version: typeof KERR_HIGH_ENERGY_RESPONSE_INTAKE_VERSION_V428;
  status: "qualified-response-intake-firewall-fixture-rejected-measured-submission-unavailable";
  source: Readonly<{
    v427ArtifactSha256: typeof KERR_V427_ARTIFACT_SHA256_V428;
    v427EvidenceSha256: typeof KERR_V427_EVIDENCE_SHA256_V428;
    v427PointerSha256: typeof KERR_V427_POINTER_SHA256_V428;
  }>;
  limits: Readonly<{
    archiveMaximumBytes: number;
    totalUncompressedMaximumBytes: number;
    memberMaximumBytes: number;
    compressionRatioMaximum: number;
    expectedFileCount: 7;
    measurementCsvCount: 6;
    manifestMaximumBytes: 131072;
  }>;
  gates: Readonly<{
    pathTraversalRejected: true;
    absolutePathRejected: true;
    backslashPathRejected: true;
    duplicateMemberRejected: true;
    unexpectedMemberRejected: true;
    missingMemberRejected: true;
    symlinkRejected: true;
    fileShaMismatchRejected: true;
    csvHeaderMismatchRejected: true;
    invalidUtf8Rejected: true;
    measuredAttestationMismatchRejected: true;
    unitContractMismatchRejected: true;
    normalizedSubmissionCrossValidated: true;
  }>;
  fixture: Readonly<{
    status: "validated-test-fixture-intake-nonpublishable";
    archiveSha256: string;
    archiveBytes: number;
    normalizedSubmissionSha256: string;
    metrics: KerrHighEnergyResponseValidatorMetricsV427;
    pythonTypeScriptMaximumDifference: number;
    mutationCount: 12;
    rejectedMutationCount: 12;
    performanceAuthorityGranted: false;
  }>;
  counts: Readonly<{
    expectedArchiveFileCount: 7;
    measurementCsvCount: 6;
    fixtureDataRowCount: number;
    measuredSubmissionCount: 0;
    measuredDataRowCount: 0;
    measuredImportAttemptCount: 0;
    scienceResponseApplicationCount: 0;
  }>;
  products: Readonly<{
    submissionSchema: "available";
    fixtureIntakeReport: "available-nonpublishable";
    normalizedFixtureSubmission: "available-validator-test-only";
    fixtureArchive: "available-nonpublishable-not-a-measured-pack";
    architecturePng: "available-intake-firewall-diagram-not-detector-image";
    measuredIntakeReport: "unavailable-no-submission";
  }>;
  authorityBoundary: Readonly<{
    intakeSchemaAuthorityGranted: true;
    containerValidatorAuthorityGranted: true;
    csvBridgeAuthorityGranted: true;
    fixturePerformanceAuthorityGranted: false;
    measuredResponseAuthorityGranted: false;
    independentScientificValidationGranted: false;
    scienceProjectionAuthorityGranted: false;
    detectorAuthorityGranted: false;
    pixelRasterAuthorityGranted: false;
    denseAuthorityGranted: false;
    unavailableIsNotZero: true;
  }>;
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  boundary: "secure-intake-and-cross-language-normalization-only-no-measured-response-independent-validation-science-projection-detector-counts-pixel-raster-or-dense-authority";
}>;

export type KerrHighEnergyResponseIntakeArtifactV428 = Readonly<{
  version: typeof KERR_HIGH_ENERGY_RESPONSE_INTAKE_ARTIFACT_VERSION_V428;
  generatedAt: string;
  status: KerrHighEnergyResponseIntakeViewV428["status"];
  sourceFiles: Readonly<{
    v427ArtifactFileSha256: typeof KERR_V427_ARTIFACT_FILE_SHA256_V428;
    v427EvidenceFileSha256: typeof KERR_V427_EVIDENCE_FILE_SHA256_V428;
    v427PointerFileSha256: typeof KERR_V427_POINTER_FILE_SHA256_V428;
    pythonFixtureReportFileSha256: string;
    normalizedFixtureFileSha256: string;
    submissionSchemaFileSha256: string;
  }>;
  view: KerrHighEnergyResponseIntakeViewV428;
  deterministicReplay: true;
  networkAttempted: false;
  denseShardExecuted: false;
  measuredSubmissionPresent: false;
  measuredImportAttempted: false;
  measuredDataRowCount: 0;
  scienceResponseApplicationCount: 0;
  artifactSha256: string;
}>;

export type KerrHighEnergyResponseIntakeSummaryV428 = Readonly<{
  version: typeof KERR_HIGH_ENERGY_RESPONSE_INTAKE_SUMMARY_VERSION_V428;
  status: KerrHighEnergyResponseIntakeViewV428["status"];
  artifactSha256: string;
  limits: KerrHighEnergyResponseIntakeViewV428["limits"];
  gates: KerrHighEnergyResponseIntakeViewV428["gates"];
  fixture: KerrHighEnergyResponseIntakeViewV428["fixture"];
  counts: KerrHighEnergyResponseIntakeViewV428["counts"];
  products: KerrHighEnergyResponseIntakeViewV428["products"];
  authorityBoundary: KerrHighEnergyResponseIntakeViewV428["authorityBoundary"];
  denseCampaignStatus: "incomplete-0-of-49";
  fullArtifactAvailable: true;
  boundary: "bounded-intake-gates-limits-and-authority-summary-no-csv-rows-archive-members-or-normalized-submission-in-react-state";
}>;

export type KerrHighEnergyResponseIntakeApiV428 = Readonly<{
  version: typeof KERR_HIGH_ENERGY_RESPONSE_INTAKE_API_VERSION_V428;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed";
  summary: KerrHighEnergyResponseIntakeSummaryV428 | null;
}>;

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !TRANSIENT.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
}
export const canonicalShaV428 = (value: unknown): string => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

function maximumDifference(left: unknown, right: unknown): number {
  if (typeof left === "number" && typeof right === "number") return Math.abs(left - right);
  if (Array.isArray(left) && Array.isArray(right) && left.length === right.length) return Math.max(0, ...left.map((entry, index) => maximumDifference(entry, right[index])));
  if (left && right && typeof left === "object" && typeof right === "object") {
    const leftRecord = left as Record<string, unknown>;
    const rightRecord = right as Record<string, unknown>;
    const keys = Object.keys(leftRecord);
    if (keys.length !== Object.keys(rightRecord).length || keys.some((key) => !Object.hasOwn(rightRecord, key))) return Number.POSITIVE_INFINITY;
    return Math.max(0, ...keys.map((key) => maximumDifference(leftRecord[key], rightRecord[key])));
  }
  return left === right ? 0 : Number.POSITIVE_INFINITY;
}

export function parseKerrHighEnergyResponseIntakePythonReportV428(value: unknown): KerrHighEnergyResponseIntakePythonReportV428 {
  const source = value as Partial<KerrHighEnergyResponseIntakePythonReportV428> | null;
  if (!source || source.version !== "v428-kerr-high-energy-response-intake-fixture-report-v1" || source.status !== "qualified-intake-firewall-fixture-rejected-no-measured-submission" || source.sourceV427ArtifactSha256 !== KERR_V427_ARTIFACT_SHA256_V428 || source.sourceV427ArtifactFileSha256 !== KERR_V427_ARTIFACT_FILE_SHA256_V428 || !SHA.test(source.fixtureArchiveSha256 ?? "") || !(source.fixtureArchiveBytes! > 0) || source.fixtureReport?.status !== "validated-test-fixture-intake-nonpublishable" || source.fixtureReport.valid !== true || source.fixtureReport.sourceKind !== "test-fixture" || source.fixtureReport.measuredAuthorityGranted !== false || source.fixtureReport.scienceResponseApplicationAllowed !== false || source.fixtureReport.errors?.length !== 0 || !SHA.test(source.fixtureReport.normalizedSubmissionSha256 ?? "") || source.mutationCount !== 12 || source.rejectedMutationCount !== 12 || source.mutationResults?.length !== 12 || source.mutationResults.some((entry) => entry.status !== "rejected-invalid-intake" || entry.rejected !== true || entry.errors.length === 0) || source.measuredSubmissionPresent !== false || source.measuredImportAttempted !== false || source.measuredAuthorityGranted !== false || source.scienceResponseApplicationCount !== 0 || source.networkAttempted !== false || !SHA.test(source.artifactSha256 ?? "")) throw new Error("v428-python-report-identity");
  return value as KerrHighEnergyResponseIntakePythonReportV428;
}

export function compileKerrHighEnergyResponseIntakeV428(
  pythonReportValue: unknown,
  normalizedSubmission: KerrHighEnergyResponseAcquisitionSubmissionV427,
  schema: KerrHighEnergyResponseSubmissionSchemaV428,
  normalizedSubmissionFileSha256: string,
): KerrHighEnergyResponseIntakeViewV428 {
  const pythonReport = parseKerrHighEnergyResponseIntakePythonReportV428(pythonReportValue);
  if (schema.version !== "v428-kerr-high-energy-response-submission-schema-v1" || schema.archive.format !== "zip" || schema.archive.expectedFiles.length !== 7 || schema.archive.directoriesAllowed !== false || schema.archive.symlinksAllowed !== false || schema.archive.encryptedMembersAllowed !== false || Object.keys(schema.csvHeaders).length !== 6 || Object.keys(schema.units).length !== 9 || schema.requiredRepeatCountMinimum !== 2) throw new Error("v428-schema-contract");
  const validation = validateKerrHighEnergyResponseSubmissionV427(normalizedSubmission);
  const difference = maximumDifference(validation.metrics, pythonReport.fixtureReport.metrics);
  if (validation.status !== "validated-test-fixture-nonpublishable" || !validation.valid || validation.measuredAuthorityGranted || validation.scienceResponseApplicationAllowed || !SHA.test(normalizedSubmissionFileSha256) || normalizedSubmissionFileSha256 !== pythonReport.fixtureReport.normalizedSubmissionSha256 || difference >= 1e-12) throw new Error(`v428-cross-language-validation:${difference}`);
  const mutationIds = new Set(pythonReport.mutationResults.map((entry) => entry.id));
  const requiredMutations = ["path-traversal", "absolute-path", "backslash-path", "duplicate-member", "unexpected-member", "missing-member", "symlink-member", "file-sha-mismatch", "csv-header-mismatch", "invalid-utf8", "measured-attestation-mismatch", "unit-contract-mismatch"];
  if (requiredMutations.some((id) => !mutationIds.has(id))) throw new Error("v428-mutation-coverage");
  const metrics = validation.metrics;
  const fixtureDataRowCount = metrics.effectiveAreaRowCount + metrics.modulationRowCount + metrics.redistributionRowCount + metrics.backgroundRowCount + metrics.responseCovarianceRowCount + metrics.redistributionCovarianceRowCount;
  return Object.freeze({
    version: KERR_HIGH_ENERGY_RESPONSE_INTAKE_VERSION_V428,
    status: "qualified-response-intake-firewall-fixture-rejected-measured-submission-unavailable",
    source: Object.freeze({ v427ArtifactSha256: KERR_V427_ARTIFACT_SHA256_V428, v427EvidenceSha256: KERR_V427_EVIDENCE_SHA256_V428, v427PointerSha256: KERR_V427_POINTER_SHA256_V428 }),
    limits: Object.freeze({ archiveMaximumBytes: schema.archive.maximumBytes, totalUncompressedMaximumBytes: schema.archive.maximumTotalUncompressedBytes, memberMaximumBytes: schema.archive.maximumMemberBytes, compressionRatioMaximum: schema.archive.maximumCompressionRatio, expectedFileCount: 7 as const, measurementCsvCount: 6 as const, manifestMaximumBytes: 131072 as const }),
    gates: Object.freeze({ pathTraversalRejected: true as const, absolutePathRejected: true as const, backslashPathRejected: true as const, duplicateMemberRejected: true as const, unexpectedMemberRejected: true as const, missingMemberRejected: true as const, symlinkRejected: true as const, fileShaMismatchRejected: true as const, csvHeaderMismatchRejected: true as const, invalidUtf8Rejected: true as const, measuredAttestationMismatchRejected: true as const, unitContractMismatchRejected: true as const, normalizedSubmissionCrossValidated: true as const }),
    fixture: Object.freeze({ status: "validated-test-fixture-intake-nonpublishable" as const, archiveSha256: pythonReport.fixtureArchiveSha256, archiveBytes: pythonReport.fixtureArchiveBytes, normalizedSubmissionSha256: pythonReport.fixtureReport.normalizedSubmissionSha256, metrics, pythonTypeScriptMaximumDifference: difference, mutationCount: 12 as const, rejectedMutationCount: 12 as const, performanceAuthorityGranted: false as const }),
    counts: Object.freeze({ expectedArchiveFileCount: 7 as const, measurementCsvCount: 6 as const, fixtureDataRowCount, measuredSubmissionCount: 0 as const, measuredDataRowCount: 0 as const, measuredImportAttemptCount: 0 as const, scienceResponseApplicationCount: 0 as const }),
    products: Object.freeze({ submissionSchema: "available" as const, fixtureIntakeReport: "available-nonpublishable" as const, normalizedFixtureSubmission: "available-validator-test-only" as const, fixtureArchive: "available-nonpublishable-not-a-measured-pack" as const, architecturePng: "available-intake-firewall-diagram-not-detector-image" as const, measuredIntakeReport: "unavailable-no-submission" as const }),
    authorityBoundary: Object.freeze({ intakeSchemaAuthorityGranted: true as const, containerValidatorAuthorityGranted: true as const, csvBridgeAuthorityGranted: true as const, fixturePerformanceAuthorityGranted: false as const, measuredResponseAuthorityGranted: false as const, independentScientificValidationGranted: false as const, scienceProjectionAuthorityGranted: false as const, detectorAuthorityGranted: false as const, pixelRasterAuthorityGranted: false as const, denseAuthorityGranted: false as const, unavailableIsNotZero: true as const }),
    denseCampaignStatus: "incomplete-0-of-49",
    browserQualification: "not-run",
    boundary: "secure-intake-and-cross-language-normalization-only-no-measured-response-independent-validation-science-projection-detector-counts-pixel-raster-or-dense-authority",
  });
}

export function parseKerrHighEnergyResponseIntakeArtifactV428(value: unknown): KerrHighEnergyResponseIntakeArtifactV428 {
  const source = value as Partial<KerrHighEnergyResponseIntakeArtifactV428> | null;
  const view = source?.view;
  if (!source || source.version !== KERR_HIGH_ENERGY_RESPONSE_INTAKE_ARTIFACT_VERSION_V428 || source.status !== "qualified-response-intake-firewall-fixture-rejected-measured-submission-unavailable" || source.sourceFiles?.v427ArtifactFileSha256 !== KERR_V427_ARTIFACT_FILE_SHA256_V428 || source.sourceFiles.v427EvidenceFileSha256 !== KERR_V427_EVIDENCE_FILE_SHA256_V428 || source.sourceFiles.v427PointerFileSha256 !== KERR_V427_POINTER_FILE_SHA256_V428 || ![source.sourceFiles.pythonFixtureReportFileSha256, source.sourceFiles.normalizedFixtureFileSha256, source.sourceFiles.submissionSchemaFileSha256].every((entry) => SHA.test(entry ?? "")) || view?.counts.expectedArchiveFileCount !== 7 || view.counts.measurementCsvCount !== 6 || view.counts.measuredSubmissionCount !== 0 || view.counts.measuredDataRowCount !== 0 || view.counts.measuredImportAttemptCount !== 0 || view.counts.scienceResponseApplicationCount !== 0 || view.fixture.rejectedMutationCount !== 12 || view.authorityBoundary.measuredResponseAuthorityGranted !== false || source.deterministicReplay !== true || source.networkAttempted !== false || source.denseShardExecuted !== false || source.measuredSubmissionPresent !== false || source.measuredImportAttempted !== false || source.measuredDataRowCount !== 0 || source.scienceResponseApplicationCount !== 0 || !SHA.test(source.artifactSha256 ?? "")) throw new Error("v428-artifact-identity");
  return value as KerrHighEnergyResponseIntakeArtifactV428;
}

export function createKerrHighEnergyResponseIntakeSummaryV428(value: unknown): KerrHighEnergyResponseIntakeSummaryV428 {
  const artifact = parseKerrHighEnergyResponseIntakeArtifactV428(value);
  const view = artifact.view;
  return Object.freeze({ version: KERR_HIGH_ENERGY_RESPONSE_INTAKE_SUMMARY_VERSION_V428, status: view.status, artifactSha256: artifact.artifactSha256, limits: view.limits, gates: view.gates, fixture: view.fixture, counts: view.counts, products: view.products, authorityBoundary: view.authorityBoundary, denseCampaignStatus: view.denseCampaignStatus, fullArtifactAvailable: true, boundary: "bounded-intake-gates-limits-and-authority-summary-no-csv-rows-archive-members-or-normalized-submission-in-react-state" });
}

export function parseKerrHighEnergyResponseIntakeApiV428(value: unknown): KerrHighEnergyResponseIntakeApiV428 {
  const source = value as Partial<KerrHighEnergyResponseIntakeApiV428> | null;
  if (!source || source.version !== KERR_HIGH_ENERGY_RESPONSE_INTAKE_API_VERSION_V428) throw new Error("v428-api-version");
  if (source.available === true && source.reason === "ready" && source.summary) {
    const summary = source.summary;
    if (summary.version !== KERR_HIGH_ENERGY_RESPONSE_INTAKE_SUMMARY_VERSION_V428 || !SHA.test(summary.artifactSha256) || summary.counts.measuredSubmissionCount !== 0 || summary.counts.measuredDataRowCount !== 0 || summary.authorityBoundary.measuredResponseAuthorityGranted !== false || Object.hasOwn(summary, "normalizedSubmission") || Object.hasOwn(summary, "mutationResults")) throw new Error("v428-api-summary");
    return source as KerrHighEnergyResponseIntakeApiV428;
  }
  if (source.available === false && source.summary === null && ["lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(source.reason ?? "")) return source as KerrHighEnergyResponseIntakeApiV428;
  throw new Error("v428-api-identity");
}

import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

export const KERR_DETECTOR_OBSERVATION_INPUTS_VERSION_V446 = "v446-kerr-detector-observation-inputs-staging-v1" as const;
export const KERR_DETECTOR_OBSERVATION_INPUTS_ARTIFACT_VERSION_V446 = "v446-kerr-detector-observation-inputs-inspect-v1" as const;
export const KERR_DETECTOR_OBSERVATION_INPUTS_API_VERSION_V446 = "v446-kerr-detector-observation-inputs-api-v1" as const;
export const KERR_DETECTOR_OBSERVATION_STAGING_PATH_V446 = "dist/staging/kerr-detector-observation-v446" as const;

const SHA256 = /^[a-f0-9]{64}$/;
const SAFE_ID = /^[A-Za-z0-9._-]{1,96}$/;
const FILE_IDS = ["observation", "collecting-area", "background", "provenance"] as const;
type FileIdV446 = (typeof FILE_IDS)[number];
type FileFormatV446 = "json" | "csv";
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const record = (value: unknown): Record<string, unknown> | null => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
const validSha = (value: unknown): value is string => typeof value === "string" && SHA256.test(value);
const sha = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");
const json = (bytes: Uint8Array): Record<string, unknown> | null => { try { return record(JSON.parse(new TextDecoder().decode(bytes))); } catch { return null; } };
const csvRows = (bytes: Uint8Array): string[][] => new TextDecoder().decode(bytes).trim().split(/\r?\n/).filter(Boolean).map((line) => line.split(",").map((cell) => cell.trim()));
const freeze = <T>(value: T): T => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value as Record<string, unknown>)) freeze(child); } return value; };

export type KerrDetectorObservationInputFileV446 = Readonly<{ id: FileIdV446; fileName: string; format: FileFormatV446; status: "missing" | "invalid" | "ready"; bytes: number; sha256: string | null; reasons: readonly string[] }>;
export type KerrDetectorObservationInputScanV446 = Readonly<{
  version: typeof KERR_DETECTOR_OBSERVATION_INPUTS_VERSION_V446;
  stagingPath: typeof KERR_DETECTOR_OBSERVATION_STAGING_PATH_V446;
  status: "blocked-staging-directory-missing" | "blocked-inputs-missing" | "blocked-inputs-invalid" | "ready-for-authority-join";
  files: readonly KerrDetectorObservationInputFileV446[];
  requiredFileCount: 4;
  readyFileCount: number;
  missingFileIds: readonly FileIdV446[];
  invalidFileIds: readonly FileIdV446[];
  structuralChecksPassed: boolean;
  hashLinkagePassed: boolean;
  throughputDoubleCountingRejected: true;
  readyForAuthorityJoin: boolean;
  measuredAuthorityGranted: false;
  computationalElectronExpectationAvailable: false;
  scienceRasterAllowed: false;
  networkAttempted: false;
  attemptConsumed: false;
  automaticRetryApplied: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
}>;
export type KerrDetectorObservationInputInspectV446 = Readonly<Omit<KerrDetectorObservationInputScanV446, "version"> & { version: typeof KERR_DETECTOR_OBSERVATION_INPUTS_ARTIFACT_VERSION_V446; generatedAt: string; sourceV445ArtifactSha256: string; sourceV443ArtifactSha256: string; sourceV367ArtifactSha256: string; geometryAuthorityAvailable: false; calibrationAuthorityAvailable: false; authorityJoinReady: false; artifactSha256: string }>;
export type KerrDetectorObservationInputSummaryV446 = Readonly<{ version: typeof KERR_DETECTOR_OBSERVATION_INPUTS_VERSION_V446; status: KerrDetectorObservationInputScanV446["status"]; artifactSha256: string; files: readonly KerrDetectorObservationInputFileV446[]; requiredFileCount: 4; readyFileCount: number; missingFileIds: readonly FileIdV446[]; invalidFileIds: readonly FileIdV446[]; structuralChecksPassed: boolean; hashLinkagePassed: boolean; throughputDoubleCountingRejected: true; readyForAuthorityJoin: boolean; geometryAuthorityAvailable: false; calibrationAuthorityAvailable: false; authorityJoinReady: false; computationalElectronExpectationAvailable: false; measuredAuthorityGranted: false; scienceRasterAllowed: false }>;
export type KerrDetectorObservationInputApiV446 = Readonly<{ version: typeof KERR_DETECTOR_OBSERVATION_INPUTS_API_VERSION_V446; available: boolean; reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed"; summary: KerrDetectorObservationInputSummaryV446 | null }>;

const FILES: Readonly<Record<FileIdV446, Readonly<{ fileName: string; format: FileFormatV446 }>>> = Object.freeze({ observation: Object.freeze({ fileName: "observation.json", format: "json" }), "collecting-area": Object.freeze({ fileName: "collecting-area.csv", format: "csv" }), background: Object.freeze({ fileName: "background.csv", format: "csv" }), provenance: Object.freeze({ fileName: "provenance.json", format: "json" }) });

function checkObservation(value: Record<string, unknown> | null): string[] {
  if (!value || value.version !== "v446-detector-observation-v1" || !SAFE_ID.test(String(value.observationId)) || !SAFE_ID.test(String(value.instrumentId)) || !SAFE_ID.test(String(value.detectorId)) || !SAFE_ID.test(String(value.bandId)) || value.timeScale !== "TDB" || !finite(value.epochTdbJd) || Number(value.epochTdbJd) < 2_000_000 || Number(value.epochTdbJd) > 3_000_000 || !finite(value.exposureSeconds) || Number(value.exposureSeconds) <= 0 || Number(value.exposureSeconds) > 86_400 || !Number.isInteger(value.frameCount) || Number(value.frameCount) < 1 || Number(value.frameCount) > 100_000 || value.photonResponseUnit !== "throughput-weighted-photon-radiance-per-square-metre-per-steradian" || !["throughput-includes-detector-qe", "separate-detector-qe-required"].includes(String(value.photonToElectronSemantics)) || !validSha(value.photonResponseArtifactSha256) || !validSha(value.geometryArtifactSha256) || !validSha(value.calibrationArtifactSha256) || !validSha(value.detectorConversionArtifactSha256)) return ["observation-schema-unit-or-authority-lock-invalid"];
  return [];
}

function checkRepeatedCsv(rows: string[][], kind: "collecting-area" | "background"): string[] {
  const collectingHeader = "repeatId,bandId,geometricAreaM2,uncertaintyM2,throughputIncluded";
  const backgroundHeader = "repeatId,bandId,backgroundElectronPerSecondPerPixel,uncertaintyElectronPerSecondPerPixel";
  if (rows.length < 4 || rows[0]?.join(",") !== (kind === "collecting-area" ? collectingHeader : backgroundHeader)) return [`${kind}-header-or-row-count-invalid`];
  const values: number[] = []; const bandIds = new Set<string>(); const repeatIds = new Set<number>(); const reasons: string[] = [];
  for (const row of rows.slice(1)) { const repeatId = Number(row[0]), bandId = row[1], value = Number(row[2]), uncertainty = Number(row[3]); if (!Number.isInteger(repeatId) || repeatId < 1 || !SAFE_ID.test(bandId) || !finite(value) || (kind === "collecting-area" ? value <= 0 : value < 0) || !finite(uncertainty) || uncertainty < 0 || (kind === "collecting-area" && row[4] !== "false")) { reasons.push(kind === "collecting-area" && row[4] !== "false" ? "throughput-double-counting-forbidden" : `${kind}-row-invalid`); continue; } repeatIds.add(repeatId); bandIds.add(bandId); values.push(value); }
  if (repeatIds.size < 3 || values.length < 3) reasons.push(`${kind}-needs-three-repeats`); if (bandIds.size !== 1) reasons.push(`${kind}-band-mismatch`);
  if (values.length >= 3) { const mean = values.reduce((sum, value) => sum + value, 0) / values.length; const spread = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length); const cv = mean === 0 ? (spread === 0 ? 0 : Number.POSITIVE_INFINITY) : spread / mean; const limit = kind === "collecting-area" ? 0.005 : 0.1; if (!finite(cv) || cv > limit) reasons.push(`${kind}-repeat-cv-over-${limit}`); }
  return reasons;
}

function checkProvenance(value: Record<string, unknown> | null, fileShaById: Partial<Record<FileIdV446, string>>): string[] {
  const sources = Array.isArray(value?.sources) ? value.sources : [], fileSha256 = record(value?.fileSha256); const reasons: string[] = [];
  if (!value || value.version !== "v446-detector-observation-provenance-v1" || value.stagingOnly !== true || value.runtimePackagingAllowed !== false || !validSha(value.processingSha256) || sources.length < 1) reasons.push("provenance-schema-or-runtime-boundary-invalid");
  for (const source of sources) { const entry = record(source); if (!entry || typeof entry.url !== "string" || !entry.url.startsWith("https://") || typeof entry.license !== "string" || entry.license.trim().length < 2 || typeof entry.termsUrl !== "string" || !entry.termsUrl.startsWith("https://") || !validSha(entry.sha256)) reasons.push("provenance-source-invalid"); }
  for (const id of FILE_IDS.filter((entry) => entry !== "provenance")) if (!validSha(fileSha256?.[id]) || fileSha256?.[id] !== fileShaById[id]) reasons.push(`provenance-file-sha-mismatch-${id}`);
  return reasons;
}

export function inspectKerrDetectorObservationInputsAtPathV446(stagingPath: string): KerrDetectorObservationInputScanV446 {
  const base = { version: KERR_DETECTOR_OBSERVATION_INPUTS_VERSION_V446, stagingPath: KERR_DETECTOR_OBSERVATION_STAGING_PATH_V446, requiredFileCount: 4 as const, throughputDoubleCountingRejected: true as const, measuredAuthorityGranted: false as const, computationalElectronExpectationAvailable: false as const, scienceRasterAllowed: false as const, networkAttempted: false as const, attemptConsumed: false as const, automaticRetryApplied: false as const, formalProductPointer: "v263" as const, denseCampaignStatus: "incomplete-0-of-49" as const, browserQualification: "not-run" as const };
  if (!existsSync(stagingPath) || !statSync(stagingPath).isDirectory()) return freeze({ ...base, status: "blocked-staging-directory-missing", files: FILE_IDS.map((id) => ({ id, fileName: FILES[id].fileName, format: FILES[id].format, status: "missing" as const, bytes: 0, sha256: null, reasons: ["staging-directory-missing"] })), readyFileCount: 0, missingFileIds: [...FILE_IDS], invalidFileIds: [], structuralChecksPassed: false, hashLinkagePassed: false, readyForAuthorityJoin: false });
  const raw = new Map<FileIdV446, Uint8Array>(); const initial = FILE_IDS.map((id) => { const spec = FILES[id], path = resolve(stagingPath, spec.fileName); if (!existsSync(path) || !statSync(path).isFile()) return { id, fileName: spec.fileName, format: spec.format, status: "missing" as const, bytes: 0, sha256: null, reasons: ["required-file-missing"] }; const bytes = readFileSync(path); raw.set(id, bytes); const reasons = bytes.length === 0 || bytes.length > 4 * 1024 * 1024 ? ["file-size-boundary-invalid"] : []; return { id, fileName: spec.fileName, format: spec.format, status: reasons.length ? "invalid" as const : "ready" as const, bytes: bytes.length, sha256: sha(bytes), reasons }; });
  const fileShaById = Object.fromEntries([...raw.entries()].map(([id, bytes]) => [id, sha(bytes)])) as Partial<Record<FileIdV446, string>>; const checks = new Map<FileIdV446, string[]>();
  for (const file of initial) { if (file.status !== "ready") continue; const bytes = raw.get(file.id)!; const reasons = file.id === "observation" ? checkObservation(json(bytes)) : file.id === "collecting-area" ? checkRepeatedCsv(csvRows(bytes), "collecting-area") : file.id === "background" ? checkRepeatedCsv(csvRows(bytes), "background") : checkProvenance(json(bytes), fileShaById); if (reasons.length) checks.set(file.id, reasons); }
  const files = initial.map((file) => { const reasons = checks.get(file.id) ?? []; return freeze({ ...file, status: file.status === "missing" ? "missing" as const : reasons.length ? "invalid" as const : file.status, reasons: [...file.reasons, ...reasons] }); });
  const missingFileIds = files.filter((file) => file.status === "missing").map((file) => file.id), invalidFileIds = files.filter((file) => file.status === "invalid").map((file) => file.id), readyFileCount = files.filter((file) => file.status === "ready").length, structuralChecksPassed = missingFileIds.length === 0 && invalidFileIds.length === 0, hashLinkagePassed = structuralChecksPassed && files.some((file) => file.id === "provenance" && file.status === "ready"), status = missingFileIds.length ? "blocked-inputs-missing" : invalidFileIds.length ? "blocked-inputs-invalid" : "ready-for-authority-join";
  return freeze({ ...base, status, files, readyFileCount, missingFileIds, invalidFileIds, structuralChecksPassed, hashLinkagePassed, readyForAuthorityJoin: structuralChecksPassed && hashLinkagePassed });
}

export function parseKerrDetectorObservationInputInspectV446(value: unknown): KerrDetectorObservationInputInspectV446 { const artifact = record(value), files = Array.isArray(artifact?.files) ? artifact.files : []; if (!artifact || artifact.version !== KERR_DETECTOR_OBSERVATION_INPUTS_ARTIFACT_VERSION_V446 || !["blocked-staging-directory-missing", "blocked-inputs-missing", "blocked-inputs-invalid", "ready-for-authority-join"].includes(String(artifact.status)) || !validSha(artifact.artifactSha256) || !validSha(artifact.sourceV445ArtifactSha256) || !validSha(artifact.sourceV443ArtifactSha256) || !validSha(artifact.sourceV367ArtifactSha256) || artifact.requiredFileCount !== 4 || files.length !== 4 || artifact.throughputDoubleCountingRejected !== true || artifact.geometryAuthorityAvailable !== false || artifact.calibrationAuthorityAvailable !== false || artifact.authorityJoinReady !== false || artifact.measuredAuthorityGranted !== false || artifact.computationalElectronExpectationAvailable !== false || artifact.scienceRasterAllowed !== false || artifact.networkAttempted !== false || artifact.attemptConsumed !== false || artifact.automaticRetryApplied !== false || artifact.formalProductPointer !== "v263" || artifact.denseCampaignStatus !== "incomplete-0-of-49" || artifact.browserQualification !== "not-run") throw new Error("v446-inspect-identity"); return freeze(value as KerrDetectorObservationInputInspectV446); }
export function createKerrDetectorObservationInputSummaryV446(value: unknown): KerrDetectorObservationInputSummaryV446 { const artifact = parseKerrDetectorObservationInputInspectV446(value); return freeze({ version: KERR_DETECTOR_OBSERVATION_INPUTS_VERSION_V446, status: artifact.status, artifactSha256: artifact.artifactSha256, files: artifact.files, requiredFileCount: 4, readyFileCount: artifact.readyFileCount, missingFileIds: artifact.missingFileIds, invalidFileIds: artifact.invalidFileIds, structuralChecksPassed: artifact.structuralChecksPassed, hashLinkagePassed: artifact.hashLinkagePassed, throughputDoubleCountingRejected: true, readyForAuthorityJoin: artifact.readyForAuthorityJoin, geometryAuthorityAvailable: false, calibrationAuthorityAvailable: false, authorityJoinReady: false, computationalElectronExpectationAvailable: false, measuredAuthorityGranted: false, scienceRasterAllowed: false }); }
export function parseKerrDetectorObservationInputApiV446(value: unknown): KerrDetectorObservationInputApiV446 { const api = record(value); if (!api || api.version !== KERR_DETECTOR_OBSERVATION_INPUTS_API_VERSION_V446 || typeof api.available !== "boolean" || !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(String(api.reason)) || (api.available && !api.summary) || (!api.available && api.summary !== null)) throw new Error("v446-api-identity"); return freeze(value as KerrDetectorObservationInputApiV446); }

import { createHash } from "node:crypto";

export type NebulaArtifactStateV623 = "pending" | "captured" | "blocked" | "rights-pending";
export type NebulaArtifactLicenseV623 = "CC BY 4.0" | "NASA public domain" | "unknown";
export type NebulaArtifactSourceV623 = Readonly<{ url: string; title: string; license: NebulaArtifactLicenseV623; licenseUrl: string; credit: string }>;
export type NebulaArtifactPayloadV623 = Readonly<{ path: string | null; sha256: string | null; bytes: number | null; width: number | null; height: number | null; mime: string | null; synthetic: boolean; fixture: boolean }>;
export type NebulaArtifactRecordV623 = Readonly<{ id: string; state: NebulaArtifactStateV623; source: NebulaArtifactSourceV623; payload: NebulaArtifactPayloadV623; rightsStatus: "pending" | "cleared" | "rejected"; candidateOnly: true; runtimeAdmission: "candidate-only"; scientificPayloadWriteback: false }>;
export type NebulaArtifactIssueV623 = Readonly<{ code: string; id: string; detail?: string }>;
export type NebulaArtifactAssessmentV623 = Readonly<{ id: string; valid: boolean; blockers: readonly string[]; sourceClosed: boolean; payloadVerified: boolean; rightsPending: boolean; fingerprint: string }>;

const SHA = /^[a-f0-9]{64}$/i;
const HTTPS_SIMBAD = "https://simbad.cds.unistra.fr/";
const HTTPS = /^https:\/\//i;
const MIME = /^(image\/(?:png|jpeg|jpg|webp)|application\/octet-stream)$/i;
const LICENSE_URL = "https://creativecommons.org/licenses/by/4.0/";

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value as Record<string, unknown>).sort().map((key) => [key, canonical((value as Record<string, unknown>)[key])]));
}

export function nebulaArtifactFingerprintV623(value: unknown): string { return createHash("sha256").update(JSON.stringify(canonical(value)), "utf8").digest("hex"); }
export function nebulaArtifactSafeUrlV623(value: string): boolean { try { const url = new URL(value); return url.protocol === "https:" && url.hostname !== ""; } catch { return false; } }
export function nebulaArtifactDimensionsValidV623(payload: NebulaArtifactPayloadV623): boolean { return Number.isInteger(payload.width) && Number.isInteger(payload.height) && (payload.width ?? 0) > 0 && (payload.height ?? 0) > 0; }
export function nebulaArtifactPayloadHashValidV623(payload: NebulaArtifactPayloadV623): boolean { return SHA.test(payload.sha256 ?? "") && Number.isInteger(payload.bytes) && (payload.bytes ?? 0) > 0; }
export function nebulaArtifactLicenseValidV623(source: NebulaArtifactSourceV623): boolean { return source.license === "CC BY 4.0" && source.licenseUrl.replace(/\/$/, "") === LICENSE_URL.replace(/\/$/, ""); }
export function nebulaArtifactCreditValidV623(source: NebulaArtifactSourceV623): boolean { return source.credit.trim().length >= 4; }

export function nebulaArtifactSourceIssuesV623(record: NebulaArtifactRecordV623): readonly string[] {
  const issues: string[] = [];
  if (!nebulaArtifactSafeUrlV623(record.source.url)) issues.push("source-url-invalid");
  if (!record.source.url.startsWith(HTTPS_SIMBAD) && !HTTPS.test(record.source.url)) issues.push("source-url-not-https");
  if (!record.source.title.trim()) issues.push("source-title-missing");
  if (!nebulaArtifactLicenseValidV623(record.source)) issues.push("license-not-cleared");
  if (!nebulaArtifactCreditValidV623(record.source)) issues.push("credit-missing");
  return Object.freeze(issues);
}

export function nebulaArtifactPayloadIssuesV623(record: NebulaArtifactRecordV623): readonly string[] {
  const payload = record.payload;
  const issues: string[] = [];
  if (!payload.path || payload.path.includes("..") || /^[A-Za-z]:/.test(payload.path) || payload.path.startsWith("/")) issues.push("path-containment-invalid");
  if (!nebulaArtifactPayloadHashValidV623(payload)) issues.push("sha-bytes-invalid");
  if (!nebulaArtifactDimensionsValidV623(payload)) issues.push("dimensions-invalid");
  if (!payload.mime || !MIME.test(payload.mime)) issues.push("mime-invalid");
  if (payload.synthetic) issues.push("synthetic-payload");
  if (payload.fixture) issues.push("fixture-payload");
  return Object.freeze(issues);
}

export function nebulaArtifactRightsIssuesV623(record: NebulaArtifactRecordV623): readonly string[] {
  const issues: string[] = [];
  if (record.rightsStatus !== "cleared") issues.push("rights-pending");
  if (record.rightsStatus === "rejected") issues.push("rights-rejected");
  return Object.freeze(issues);
}

export function assessNebulaArtifactV623(record: NebulaArtifactRecordV623): NebulaArtifactAssessmentV623 {
  const blockers = [...nebulaArtifactSourceIssuesV623(record), ...nebulaArtifactPayloadIssuesV623(record), ...nebulaArtifactRightsIssuesV623(record)];
  if (!record.candidateOnly || record.runtimeAdmission !== "candidate-only" || record.scientificPayloadWriteback !== false) blockers.push("admission-boundary-open");
  if (record.state === "captured" && blockers.length) blockers.push("captured-state-inconsistent");
  if (record.payload.path && record.payload.path.toLocaleLowerCase().includes("synthetic")) blockers.push("synthetic-path");
  const unique = [...new Set(blockers)];
  return Object.freeze({ id: record.id, valid: unique.length === 0, blockers: Object.freeze(unique), sourceClosed: nebulaArtifactSourceIssuesV623(record).length === 0, payloadVerified: nebulaArtifactPayloadIssuesV623(record).length === 0, rightsPending: record.rightsStatus !== "cleared", fingerprint: nebulaArtifactFingerprintV623(record) });
}

export function verifyNebulaArtifactBytesV623(record: NebulaArtifactRecordV623, bytes: Uint8Array): readonly string[] {
  const issues: string[] = [];
  if (bytes.byteLength !== record.payload.bytes) issues.push("byte-count-mismatch");
  const hash = createHash("sha256").update(bytes).digest("hex");
  if (hash !== record.payload.sha256) issues.push("sha256-mismatch");
  return Object.freeze(issues);
}

export function nebulaArtifactPathWithinRootV623(pathValue: string, root: string): boolean {
  if (!pathValue || pathValue.includes("..") || /^[A-Za-z]:/.test(pathValue) || pathValue.startsWith("/")) return false;
  const normalizedRoot = root.replace(/[\\/]$/, "");
  return `${normalizedRoot}/${pathValue}`.startsWith(`${normalizedRoot}/`);
}

export function classifyNebulaArtifactStateV623(record: NebulaArtifactRecordV623): "ready" | "rights-pending" | "payload-pending" | "blocked" {
  const assessment = assessNebulaArtifactV623(record);
  if (assessment.blockers.includes("admission-boundary-open")) return "blocked";
  if (assessment.blockers.some((code) => code.includes("path") || code.includes("sha") || code.includes("dimensions") || code.includes("mime"))) return "payload-pending";
  if (assessment.rightsPending) return "rights-pending";
  return assessment.valid ? "ready" : "blocked";
}

export function filterNebulaArtifactsV623(records: readonly NebulaArtifactRecordV623[], query = ""): readonly NebulaArtifactRecordV623[] {
  const needle = query.trim().toLocaleLowerCase();
  return Object.freeze(records.filter((record) => !needle || [record.id, record.source.title, record.source.license, classifyNebulaArtifactStateV623(record), ...assessNebulaArtifactV623(record).blockers].join(" ").toLocaleLowerCase().includes(needle)));
}

export function summarizeNebulaArtifactsV623(records: readonly NebulaArtifactRecordV623[]) {
  const assessments = records.map(assessNebulaArtifactV623);
  return Object.freeze({ total: records.length, ready: assessments.filter((entry) => entry.valid).length, rightsPending: assessments.filter((entry) => entry.rightsPending).length, payloadVerified: assessments.filter((entry) => entry.payloadVerified).length, sourceClosed: assessments.filter((entry) => entry.sourceClosed).length, blocked: assessments.filter((entry) => entry.blockers.length > 0).length, runtimeAdmitted: 0, scientificPayloadWriteback: false as const });
}

export function aggregateNebulaArtifactSourcesV623(records: readonly NebulaArtifactRecordV623[]) {
  const sources = records.map((record) => record.source);
  return Object.freeze({ total: sources.length, uniqueUrls: new Set(sources.map((source) => source.url)).size, https: sources.filter((source) => HTTPS.test(source.url)).length, licenses: Object.fromEntries(["CC BY 4.0", "NASA public domain", "unknown"].map((license) => [license, sources.filter((source) => source.license === license).length])) });
}

export function aggregateNebulaArtifactPayloadsV623(records: readonly NebulaArtifactRecordV623[]) {
  return Object.freeze({ total: records.length, bytes: records.reduce((sum, record) => sum + (record.payload.bytes ?? 0), 0), dimensionsValid: records.filter((record) => nebulaArtifactDimensionsValidV623(record.payload)).length, hashesValid: records.filter((record) => nebulaArtifactPayloadHashValidV623(record.payload)).length, synthetic: records.filter((record) => record.payload.synthetic).length, fixtures: records.filter((record) => record.payload.fixture).length });
}

export function nebulaArtifactManifestDiffV623(previous: readonly NebulaArtifactRecordV623[], current: readonly NebulaArtifactRecordV623[]) {
  const left = new Map(previous.map((record) => [record.id, nebulaArtifactFingerprintV623(record)]));
  const right = new Map(current.map((record) => [record.id, nebulaArtifactFingerprintV623(record)]));
  return Object.freeze({ added: Object.freeze([...right.keys()].filter((id) => !left.has(id)).sort()), removed: Object.freeze([...left.keys()].filter((id) => !right.has(id)).sort()), changed: Object.freeze([...right.keys()].filter((id) => left.has(id) && left.get(id) !== right.get(id)).sort()) });
}

export function nebulaArtifactManifestStableV623(previous: readonly NebulaArtifactRecordV623[], current: readonly NebulaArtifactRecordV623[]): boolean { const diff = nebulaArtifactManifestDiffV623(previous, current); return diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0; }
export function nebulaArtifactFingerprintListV623(records: readonly NebulaArtifactRecordV623[]): readonly string[] { return Object.freeze(records.map((record) => assessNebulaArtifactV623(record).fingerprint).sort()); }
export function nebulaArtifactBlockerCountsV623(records: readonly NebulaArtifactRecordV623[]): Readonly<Record<string, number>> { const counts: Record<string, number> = {}; for (const record of records) for (const blocker of assessNebulaArtifactV623(record).blockers) counts[blocker] = (counts[blocker] ?? 0) + 1; return Object.freeze(counts); }
export function nebulaArtifactCsvV623(records: readonly NebulaArtifactRecordV623[]): string { const rows = ["id,state,rightsStatus,bytes,width,height,sha256,sourceUrl,license,blockers"]; for (const record of records) { const assessment = assessNebulaArtifactV623(record); rows.push([record.id, record.state, record.rightsStatus, String(record.payload.bytes ?? ""), String(record.payload.width ?? ""), String(record.payload.height ?? ""), record.payload.sha256 ?? "", record.source.url, record.source.license, assessment.blockers.join("|")].map((value) => `"${value.replaceAll('"', '""')}"`).join(",")); } return `${rows.join("\n")}\n`; }
export function nebulaArtifactJsonlV623(records: readonly NebulaArtifactRecordV623[]): string { return records.map((record) => JSON.stringify({ record, assessment: assessNebulaArtifactV623(record) })).join("\n") + "\n"; }
export function nebulaArtifactAdmissionLabelV623(record: NebulaArtifactRecordV623): string { const assessment = assessNebulaArtifactV623(record); return assessment.valid ? "rights pending review · candidate-only" : `blocked · ${assessment.blockers.join("、")}`; }
export function nebulaArtifactNoRuntimeAdmissionV623(records: readonly NebulaArtifactRecordV623[]): boolean { return records.every((record) => record.runtimeAdmission === "candidate-only" && record.candidateOnly && record.scientificPayloadWriteback === false); }


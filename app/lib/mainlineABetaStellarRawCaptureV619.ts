export type StellarRawCaptureStateV619 = "pending" | "captured" | "raw-only" | "structured" | "blocked";
export type StellarRawCaptureTransportV619 = "https-html" | "astroquery-sim-script" | "fixture-replay";
export type StellarRawCaptureParseStatusV619 = "pending" | "raw-only" | "structured" | "blocked";

export type StellarRawCapturePlanV619 = Readonly<{
  planId: string;
  requestId: string;
  id: string;
  queryIdentifier: string;
  sourceUrl: string;
  requestUrl: string;
  serviceEndpoint: string;
  method: "GET";
  timeoutMs: number;
  maxAttempts: number;
  retryBackoffMs: readonly number[];
  allowedTransports: readonly StellarRawCaptureTransportV619[];
  rawResponseRequired: true;
  structuredEvidenceRequired: true;
  expectedSnapshotRecordDigest: string;
  expectedProjectionRecordDigest: string;
  scientificPayloadWriteback: false;
}>;

export type StellarRawCaptureRecordV619 = Readonly<{
  plan: StellarRawCapturePlanV619;
  state: StellarRawCaptureStateV619;
  transport: StellarRawCaptureTransportV619 | null;
  parseStatus: StellarRawCaptureParseStatusV619;
  capturedAt: string | null;
  httpStatus: number | null;
  contentType: string | null;
  responseBytes: number | null;
  finalUrl: string | null;
  rawPageSha256: string | null;
  rawResponse: string | null;
  attempts: number;
  errors: readonly string[];
  retryAfter: string | null;
  reviewer: string | null;
  decision: "hold" | "rejected";
  runtimeAdmission: "candidate-only";
  measurementAdmission: "not-admitted";
  scientificPayloadWriteback: false;
}>;

export type StellarRawCapturePackV619 = Readonly<{
  schema: "mainline-a-beta-stellar-raw-capture-v619";
  generatedAt: string;
  input: Readonly<{ path: string; sourceSchema: string; sourceSnapshotSha256: string }>;
  service: Readonly<{ endpoint: string; transports: readonly StellarRawCaptureTransportV619[]; rawOnlyAllowed: boolean; structuredReviewRequired: boolean }>;
  counts: Readonly<{ total: number; pending: number; captured: number; rawOnly: number; structured: number; blocked: number; runtimeAdmitted: number; measurementAdmitted: number }>;
  boundary: Readonly<{ rawCaptureOnly: boolean; fixtureReplayAllowed: boolean; structuredAutoAdmission: boolean; runtimeWrites: boolean; measurementWrites: boolean; scientificPayloadWriteback: boolean; legalDecision: string }>;
  records: readonly StellarRawCaptureRecordV619[];
}>;

const ALLOWLIST = new Set(["acrux", "spica", "regulus", "polaris"]);
const SHA256 = /^[a-f0-9]{64}$/i;
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

export function rawCaptureStateLabelV619(state: StellarRawCaptureStateV619): string {
  return ({ pending: "等待原始捕获", captured: "响应已捕获", "raw-only": "仅原始页面", structured: "结构化待复核", blocked: "捕获阻塞" } satisfies Record<StellarRawCaptureStateV619, string>)[state];
}

export function rawCaptureStateToneV619(state: StellarRawCaptureStateV619): "warning" | "neutral" | "positive" | "danger" {
  if (state === "structured") return "neutral";
  if (state === "captured" || state === "raw-only") return "positive";
  if (state === "blocked") return "danger";
  return "warning";
}

export function rawCaptureRowsV619(pack: StellarRawCapturePackV619): readonly StellarRawCaptureRecordV619[] { return Object.freeze([...pack.records]); }

export function rawCaptureSummaryV619(pack: StellarRawCapturePackV619) {
  return Object.freeze({ total: pack.counts.total, pending: pack.counts.pending, captured: pack.counts.captured, rawOnly: pack.counts.rawOnly, structured: pack.counts.structured, blocked: pack.counts.blocked, runtimeAdmitted: pack.counts.runtimeAdmitted, measurementAdmitted: pack.counts.measurementAdmitted });
}

export function filterRawCaptureRowsV619(pack: StellarRawCapturePackV619, query = ""): readonly StellarRawCaptureRecordV619[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return pack.records;
  return pack.records.filter((record) => [record.plan.id, record.plan.queryIdentifier, record.plan.planId, record.plan.sourceUrl].join(" ").toLocaleLowerCase().includes(needle));
}

export function rawCaptureOpenGateV619(pack: StellarRawCapturePackV619): boolean {
  return pack.schema === "mainline-a-beta-stellar-raw-capture-v619" && pack.counts.total === 4 && pack.counts.pending === 4 && pack.counts.captured === 0 && pack.counts.runtimeAdmitted === 0 && pack.counts.measurementAdmitted === 0 && pack.boundary.rawCaptureOnly && pack.boundary.fixtureReplayAllowed && !pack.boundary.structuredAutoAdmission && !pack.boundary.runtimeWrites && !pack.boundary.measurementWrites && !pack.boundary.scientificPayloadWriteback;
}

export function rawCaptureCompletionPercentV619(pack: StellarRawCapturePackV619): number { return pack.counts.total === 0 ? 0 : Math.round((pack.counts.captured / pack.counts.total) * 100); }

export function rawCaptureBoundaryLabelV619(pack: StellarRawCapturePackV619): string { return rawCaptureOpenGateV619(pack) ? "4 条原始捕获计划已封存；0/4 响应，结构化准入关闭" : "raw capture 边界校验未通过"; }

export function rawCaptureNextActionV619(record: StellarRawCaptureRecordV619): string {
  if (record.state === "pending") return "按限时/重试策略捕获 HTTPS 原始响应并保存 hash";
  if (record.state === "raw-only") return "保留 raw-only，等待结构化解析和人工证据复核";
  if (record.state === "structured") return "复核身份、解析类别、组件来源和 V616 digest";
  if (record.state === "blocked") return "检查网络、状态码、内容类型和重试错误";
  return "保持候选边界，等待独立准入审查";
}

export function rawCaptureRecordSummaryV619(record: StellarRawCaptureRecordV619): string { return `${record.plan.id} · ${rawCaptureStateLabelV619(record.state)} · ${rawCaptureNextActionV619(record)}`; }

export function rawCaptureTransportLabelV619(record: StellarRawCaptureRecordV619): string { return record.transport ? `${record.transport} · ${record.plan.method} · ${record.plan.timeoutMs}ms` : `待选择 transport · ${record.plan.method} · ${record.plan.timeoutMs}ms`; }

export function rawCaptureHasRawResponseV619(record: StellarRawCaptureRecordV619): boolean { return typeof record.rawResponse === "string" && record.rawResponse.length > 0 && typeof record.rawPageSha256 === "string" && SHA256.test(record.rawPageSha256); }

export function rawCaptureSourceIsSafeV619(record: StellarRawCaptureRecordV619): boolean { return record.plan.sourceUrl.startsWith("https://simbad.cds.unistra.fr/") && record.plan.serviceEndpoint === "https://simbad.cds.unistra.fr/simbad/sim-tap/sync"; }

export function rawCaptureAllCandidateOnlyV619(pack: StellarRawCapturePackV619): boolean { return pack.records.every((record) => record.runtimeAdmission === "candidate-only" && record.measurementAdmission === "not-admitted" && record.scientificPayloadWriteback === false); }

export function rawCaptureNeedsHumanReviewV619(record: StellarRawCaptureRecordV619): boolean { return record.state === "raw-only" || record.state === "structured" || record.decision === "hold"; }

export function rawCaptureImmutableDigestLabelV619(record: StellarRawCaptureRecordV619): string { return `snapshot ${record.plan.expectedSnapshotRecordDigest.slice(0, 12)} · projection ${record.plan.expectedProjectionRecordDigest.slice(0, 12)}`; }

export function validateRawCapturePackV619(pack: StellarRawCapturePackV619): boolean {
  if (pack.schema !== "mainline-a-beta-stellar-raw-capture-v619" || pack.counts.total !== 4 || pack.records.length !== 4) return false;
  if (pack.counts.pending !== 4 || pack.counts.captured !== 0 || pack.counts.rawOnly !== 0 || pack.counts.structured !== 0 || pack.counts.blocked !== 0) return false;
  if (!pack.boundary.rawCaptureOnly || !pack.boundary.fixtureReplayAllowed || pack.boundary.structuredAutoAdmission || pack.boundary.runtimeWrites || pack.boundary.measurementWrites || pack.boundary.scientificPayloadWriteback) return false;
  return pack.records.every((record) => ALLOWLIST.has(record.plan.id) && record.state === "pending" && record.transport === null && record.rawResponse === null && record.rawPageSha256 === null && rawCaptureSourceIsSafeV619(record) && record.runtimeAdmission === "candidate-only" && record.measurementAdmission === "not-admitted");
}

export function validateRawCaptureMetadataV619(record: StellarRawCaptureRecordV619): readonly string[] {
  const errors: string[] = [];
  if (!ALLOWLIST.has(record.plan.id)) errors.push("id-not-allowlisted");
  if (!rawCaptureSourceIsSafeV619(record)) errors.push("source-not-simbad");
  if (record.state !== "pending" && record.transport === null) errors.push("transport-missing");
  if (record.capturedAt !== null && (!ISO_UTC.test(record.capturedAt) || Date.parse(record.capturedAt) > Date.now())) errors.push("captured-at-invalid");
  if (record.rawPageSha256 !== null && !SHA256.test(record.rawPageSha256)) errors.push("raw-hash-invalid");
  if (record.responseBytes !== null && (!Number.isInteger(record.responseBytes) || record.responseBytes < 0)) errors.push("response-bytes-invalid");
  if (record.runtimeAdmission !== "candidate-only" || record.measurementAdmission !== "not-admitted" || record.scientificPayloadWriteback) errors.push("admission-boundary-opened");
  return Object.freeze(errors);
}

export function rawCaptureAllowedContentTypeV619(contentType: string | null): boolean {
  const normalized = contentType?.toLocaleLowerCase() ?? "";
  return normalized.startsWith("text/html") || normalized.startsWith("text/plain") || normalized.startsWith("text/tab-separated-values") || normalized.startsWith("application/json");
}

export function rawCaptureRetryScheduleV619(record: StellarRawCaptureRecordV619): readonly number[] {
  if (record.state !== "pending") return Object.freeze([]);
  return Object.freeze([...record.plan.retryBackoffMs]);
}

export function rawCaptureAttemptLabelV619(record: StellarRawCaptureRecordV619): string {
  return `${record.attempts}/${record.plan.maxAttempts} attempts · timeout ${record.plan.timeoutMs}ms`;
}

export function rawCaptureFailureLabelV619(record: StellarRawCaptureRecordV619): string {
  if (record.errors.length === 0) return "暂无传输错误";
  return record.errors.join("、");
}

export function rawCaptureRequiresStructuredReviewV619(record: StellarRawCaptureRecordV619): boolean {
  return record.state === "raw-only" || record.state === "structured" || record.parseStatus === "raw-only" || record.parseStatus === "structured";
}

export function rawCapturePlanFingerprintV619(record: StellarRawCaptureRecordV619): string {
  return [record.plan.planId, record.plan.id, record.plan.queryIdentifier, record.plan.sourceUrl, record.plan.expectedSnapshotRecordDigest, record.plan.expectedProjectionRecordDigest].join("|");
}

export function rawCaptureResponseIntegrityLabelV619(record: StellarRawCaptureRecordV619): string {
  if (!rawCaptureHasRawResponseV619(record)) return "raw body not captured";
  if (record.responseBytes === null) return "raw hash present; byte count missing";
  return `${record.responseBytes} bytes · ${record.rawPageSha256?.slice(0, 12)}…`;
}

export function rawCaptureServiceLabelV619(pack: StellarRawCapturePackV619): string {
  return `${pack.service.endpoint} · ${pack.service.transports.join(" / ")} · structured review required`;
}

export function rawCaptureFailureCountV619(pack: StellarRawCapturePackV619): number {
  return pack.records.reduce((total, record) => total + record.errors.length, 0);
}

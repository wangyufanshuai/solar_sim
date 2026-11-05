export type StellarFreshCaptureStateV618 = "required" | "captured" | "review-pending" | "accepted" | "rejected";

export type StellarFreshCaptureRequestV618 = Readonly<{
  requestId: string;
  id: string;
  queryIdentifier: string;
  sourceUrl: string;
  serviceEndpoint: string;
  method: "GET";
  requestedAt: string | null;
  expectedSnapshotRecordDigest: string;
  expectedProjectionRecordDigest: string;
  expectedResolutionClass: string;
  responseRequired: boolean;
  scientificPayloadWriteback: false;
}>;

export type StellarFreshCapturePatchV618 = Readonly<{
  id: string;
  requestId: string;
  sourcePageUrl: string;
  capturedAt: string;
  captureSha256: string;
  reviewer: string | null;
  decision: "hold" | "cleared" | "rejected";
  resolutionClass: string;
  sourceRecordDigest: string;
  parallaxMas: number | null;
  errorMas: number | null;
  bibcode: string | null;
  componentIdentityDecision: "confirmed" | "ambiguous" | "rejected";
  componentSourceReference: string | null;
  expectedSnapshotRecordDigest: string;
  expectedProjectionRecordDigest: string;
  serviceLicense: string;
  citation: string;
  runtimeAdmission: "candidate-only";
  measurementAdmission: "not-admitted";
  scientificPayloadWriteback: false;
}>;

export type StellarFreshCaptureRecordV618 = Readonly<{
  request: StellarFreshCaptureRequestV618;
  state: StellarFreshCaptureStateV618;
  response: Readonly<Record<string, unknown>> | null;
  patch: StellarFreshCapturePatchV618 | null;
  reviewDecision: "hold" | "cleared" | "rejected";
  runtimeAdmission: "candidate-only";
  measurementAdmission: "not-admitted";
  scientificPayloadWriteback: false;
}>;

export type StellarFreshCapturePackV618 = Readonly<{
  schema: "mainline-a-beta-stellar-fresh-capture-v618";
  generatedAt: string;
  input: Readonly<{ path: string; sourceSchema: string; sourceSnapshotSha256: string }>;
  service: Readonly<{ endpoint: string; license: string; citation: string; responseSchema: string }>;
  counts: Readonly<{ total: number; requestRequired: number; responseCaptured: number; reviewPending: number; cleared: number; runtimeAdmitted: number; measurementAdmitted: number }>;
  boundary: Readonly<{ freshCaptureOnly: boolean; runtimeWrites: boolean; measurementWrites: boolean; scientificPayloadWriteback: boolean; legalDecision: string }>;
  records: readonly StellarFreshCaptureRecordV618[];
}>;

export type StellarFreshCaptureFilterV618 = Readonly<{ state?: StellarFreshCaptureStateV618; query?: string }>;

const SHA256_PATTERN = /^[a-f0-9]{64}$/i;
const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const SIMBAD_URL = "https://simbad.cds.unistra.fr/";
const ALLOWLIST = new Set(["acrux", "spica", "regulus", "polaris"]);

export function freshCaptureStateLabelV618(state: StellarFreshCaptureStateV618): string {
  return ({ required: "等待采集", captured: "响应已封存", "review-pending": "采集待审核", accepted: "审核通过（仍不准入）", rejected: "采集被拒" } satisfies Record<StellarFreshCaptureStateV618, string>)[state];
}

export function freshCaptureStateToneV618(state: StellarFreshCaptureStateV618): "warning" | "neutral" | "positive" | "danger" {
  if (state === "accepted") return "positive";
  if (state === "captured" || state === "review-pending") return "neutral";
  if (state === "rejected") return "danger";
  return "warning";
}

export function freshCaptureRowsV618(pack: StellarFreshCapturePackV618): readonly StellarFreshCaptureRecordV618[] { return Object.freeze([...pack.records]); }

export function freshCaptureSummaryV618(pack: StellarFreshCapturePackV618) {
  return Object.freeze({ total: pack.counts.total, required: pack.counts.requestRequired, captured: pack.counts.responseCaptured, reviewPending: pack.counts.reviewPending, cleared: pack.counts.cleared, runtimeAdmitted: pack.counts.runtimeAdmitted, measurementAdmitted: pack.counts.measurementAdmitted });
}

export function filterFreshCaptureRowsV618(pack: StellarFreshCapturePackV618, filter: StellarFreshCaptureFilterV618 = {}): readonly StellarFreshCaptureRecordV618[] {
  const needle = filter.query?.trim().toLocaleLowerCase() ?? "";
  return pack.records.filter((record) => {
    if (filter.state && record.state !== filter.state) return false;
    if (!needle) return true;
    return [record.request.id, record.request.queryIdentifier, record.request.requestId, record.request.sourceUrl].join(" ").toLocaleLowerCase().includes(needle);
  });
}

export function freshCaptureOpenGateV618(pack: StellarFreshCapturePackV618): boolean {
  return pack.schema === "mainline-a-beta-stellar-fresh-capture-v618" && pack.counts.total === 4 && pack.counts.responseCaptured === 0 && pack.counts.runtimeAdmitted === 0 && pack.counts.measurementAdmitted === 0 && pack.boundary.freshCaptureOnly && !pack.boundary.runtimeWrites && !pack.boundary.measurementWrites && !pack.boundary.scientificPayloadWriteback;
}

export function freshCaptureCompletionPercentV618(pack: StellarFreshCapturePackV618): number { return pack.counts.total === 0 ? 0 : Math.round((pack.counts.responseCaptured / pack.counts.total) * 100); }

export function freshCaptureBoundaryLabelV618(pack: StellarFreshCapturePackV618): string { return freshCaptureOpenGateV618(pack) ? "4 条请求已封存；0/4 响应，运行时与测量仍关闭" : "fresh capture 边界校验未通过"; }

export function freshCaptureNextActionV618(record: StellarFreshCaptureRecordV618): string {
  if (record.state === "required") return "通过 HTTPS 采集响应并封存原始哈希";
  if (record.state === "captured" || record.state === "review-pending") return "复核身份、视差、引用和组件来源";
  if (record.state === "accepted") return "保持 candidate-only，等待独立运行时门禁";
  return "修复响应身份或证据缺口后重新采集";
}

export function freshCaptureRecordSummaryV618(record: StellarFreshCaptureRecordV618): string { return `${record.request.id} · ${freshCaptureStateLabelV618(record.state)} · ${freshCaptureNextActionV618(record)}`; }

export function freshCaptureRequestLabelV618(record: StellarFreshCaptureRecordV618): string { return `${record.request.requestId} · ${record.request.queryIdentifier}`; }

export function freshCaptureHasResponseV618(record: StellarFreshCaptureRecordV618): boolean { return record.response !== null && record.patch !== null && record.state !== "required"; }

export function freshCaptureCanBeReviewedV618(record: StellarFreshCaptureRecordV618): boolean { return freshCaptureHasResponseV618(record) && record.patch?.decision === "hold" && record.runtimeAdmission === "candidate-only" && record.measurementAdmission === "not-admitted"; }

export function validateFreshCapturePackV618(pack: StellarFreshCapturePackV618): boolean {
  if (pack.schema !== "mainline-a-beta-stellar-fresh-capture-v618" || pack.counts.total !== 4 || pack.records.length !== 4) return false;
  if (pack.counts.responseCaptured !== 0 || pack.counts.cleared !== 0 || pack.counts.runtimeAdmitted !== 0 || pack.counts.measurementAdmitted !== 0) return false;
  if (!pack.boundary.freshCaptureOnly || pack.boundary.runtimeWrites || pack.boundary.measurementWrites || pack.boundary.scientificPayloadWriteback) return false;
  return pack.records.every((record) => ALLOWLIST.has(record.request.id) && record.state === "required" && record.response === null && record.patch === null && record.runtimeAdmission === "candidate-only" && record.measurementAdmission === "not-admitted" && record.request.sourceUrl.startsWith("https://") && record.request.serviceEndpoint.startsWith("https://"));
}

export function validateFreshCapturePatchV618(patch: StellarFreshCapturePatchV618): readonly string[] {
  const errors: string[] = [];
  if (!ALLOWLIST.has(patch.id)) errors.push("id-not-allowlisted");
  if (!patch.sourcePageUrl.startsWith("https://")) errors.push("source-url-invalid");
  if (!ISO_PATTERN.test(patch.capturedAt)) errors.push("captured-at-invalid");
  const capturedTime = Date.parse(patch.capturedAt);
  if (!Number.isFinite(capturedTime) || new Date(capturedTime).toISOString() !== patch.capturedAt || capturedTime > Date.now()) errors.push("captured-at-not-past-utc");
  if (!SHA256_PATTERN.test(patch.captureSha256)) errors.push("capture-sha-invalid");
  if (!SHA256_PATTERN.test(patch.sourceRecordDigest)) errors.push("source-record-digest-invalid");
  if (!SHA256_PATTERN.test(patch.expectedSnapshotRecordDigest) || !SHA256_PATTERN.test(patch.expectedProjectionRecordDigest)) errors.push("immutable-input-digest-invalid");
  if (patch.decision === "cleared" && patch.componentIdentityDecision !== "confirmed") errors.push("cleared-identity-unconfirmed");
  if (patch.parallaxMas !== null && (!Number.isFinite(patch.parallaxMas) || patch.parallaxMas <= 0)) errors.push("parallax-invalid");
  if (patch.errorMas !== null && (!Number.isFinite(patch.errorMas) || patch.errorMas <= 0)) errors.push("parallax-error-invalid");
  if (!patch.bibcode?.trim() && patch.id === "acrux") errors.push("upstream-reference-missing");
  if (patch.id !== "acrux" && patch.componentIdentityDecision !== "confirmed") errors.push("component-identity-unconfirmed");
  if (patch.id !== "acrux" && (!patch.componentSourceReference || !patch.componentSourceReference.startsWith(SIMBAD_URL))) errors.push("component-source-reference-missing");
  if (patch.componentSourceReference != null && !patch.componentSourceReference.startsWith(SIMBAD_URL)) errors.push("component-source-reference-invalid");
  if (patch.runtimeAdmission !== "candidate-only" || patch.measurementAdmission !== "not-admitted" || patch.scientificPayloadWriteback) errors.push("admission-boundary-opened");
  if (patch.serviceLicense !== "ODbL-1.0" || !patch.citation.includes("Wenger")) errors.push("service-attribution-invalid");
  return Object.freeze(errors);
}

export function freshCapturePatchFingerprintV618(patch: StellarFreshCapturePatchV618): string { return [patch.id, patch.requestId, patch.capturedAt, patch.captureSha256, patch.sourceRecordDigest, patch.componentIdentityDecision, patch.decision].join("|"); }

export function freshCaptureCandidateIdsV618(pack: StellarFreshCapturePackV618): readonly string[] { return Object.freeze(pack.records.map((record) => record.request.id)); }

export function freshCaptureAllCandidateOnlyV618(pack: StellarFreshCapturePackV618): boolean { return pack.records.every((record) => record.runtimeAdmission === "candidate-only" && record.measurementAdmission === "not-admitted"); }

export function freshCaptureNeedsHumanReviewV618(record: StellarFreshCaptureRecordV618): boolean { return record.state === "captured" || record.state === "review-pending" || record.reviewDecision === "hold"; }

export function freshCaptureServiceLabelV618(pack: StellarFreshCapturePackV618): string { return `${pack.service.license} · ${pack.service.citation}`; }

export function freshCaptureSourceIsSafeV618(record: StellarFreshCaptureRecordV618): boolean { return record.request.sourceUrl.startsWith("https://simbad.cds.unistra.fr/") && record.request.serviceEndpoint.startsWith("https://simbad.cds.unistra.fr/"); }

export function freshCaptureImmutableDigestLabelV618(record: StellarFreshCaptureRecordV618): string {
  const snapshot = record.request.expectedSnapshotRecordDigest.slice(0, 12);
  const projection = record.request.expectedProjectionRecordDigest.slice(0, 12);
  return `snapshot ${snapshot} · projection ${projection}`;
}

export function freshCaptureRequestTransportLabelV618(record: StellarFreshCaptureRecordV618): string {
  return `${record.request.method} · HTTPS · ${record.request.responseRequired ? "response required" : "response optional"}`;
}

export type StellarSourceClosureStatusV616 = "fresh-capture-required" | "capture-review" | "closed";
export type StellarSourceClosureRecordV616 = Readonly<{
  id: string;
  queryIdentifier: string;
  sourcePageUrl: string;
  snapshotSha256: string;
  snapshotRecordDigest: string;
  projectionRecordDigest: string;
  resolutionClass: string;
  completeness: Readonly<Record<string, boolean>>;
  requiredEvidence: readonly string[];
  missingEvidence: readonly string[];
  status: StellarSourceClosureStatusV616;
  reviewDecision: "hold" | "cleared" | "rejected";
  runtimeAdmission: "candidate-only" | "admitted";
  measurementAdmission: "not-admitted";
  scientificPayloadWriteback: false;
  freshCapture: Readonly<{ sourceUrl: string; capturedAt: string | null; captureSha256: string | null; reviewer: string | null }>;
}>;

export type StellarSourceClosurePackV616 = Readonly<{
  schema: string;
  generatedAt: string;
  source: Readonly<{ snapshotPath: string; projectionPath: string; snapshotSha256: string; snapshotContentSha256: string; projectionContentSha256: string; serviceLicense: string; citation: string }>;
  counts: Readonly<{ total: number; freshCaptureRequired: number; missingEvidence: number; candidateOnly: number }>;
  boundary: Readonly<{ legalDecision: string; runtimeWrites: boolean; measurementWrites: boolean; scientificPayloadWriteback: boolean }>;
  records: readonly StellarSourceClosureRecordV616[];
}>;

export type StellarSourceClosureFilterV616 = Readonly<{ query?: string; status?: StellarSourceClosureStatusV616; missingEvidence?: string }>;
export type StellarSourceClosurePatchV616 = Readonly<{
  id: string;
  sourcePageUrl: string;
  capturedAt: string;
  captureSha256: string;
  reviewer: string;
  decision: "hold" | "cleared" | "rejected";
  resolutionClass: string;
  sourceRecordDigest: string;
  parallaxMas: number | null;
  errorMas: number | null;
  bibcode: string | null;
  componentIdentityDecision: "confirmed" | "ambiguous" | "rejected";
}>;
export const STELLAR_SOURCE_CLOSURE_STATUSES_V616: readonly StellarSourceClosureStatusV616[] = ["fresh-capture-required", "capture-review", "closed"];

export function stellarSourceClosureStatusLabelV616(status: StellarSourceClosureStatusV616): string {
  return ({ "fresh-capture-required": "待重新采集来源", "capture-review": "来源采集待审核", closed: "来源闭环" } satisfies Record<StellarSourceClosureStatusV616, string>)[status];
}

export function stellarSourceClosureStatusToneV616(status: StellarSourceClosureStatusV616): "warning" | "neutral" | "positive" {
  if (status === "closed") return "positive";
  if (status === "capture-review") return "neutral";
  return "warning";
}

export function stellarSourceClosureHasOpenGateV616(record: StellarSourceClosureRecordV616): boolean {
  return record.status !== "closed" || record.reviewDecision !== "cleared" || record.runtimeAdmission !== "admitted";
}

export function filterStellarSourceClosureV616(records: readonly StellarSourceClosureRecordV616[], filter: StellarSourceClosureFilterV616 = {}): readonly StellarSourceClosureRecordV616[] {
  const needle = filter.query?.trim().toLocaleLowerCase() ?? "";
  return records.filter((record) => {
    if (filter.status && record.status !== filter.status) return false;
    if (filter.missingEvidence && !record.missingEvidence.includes(filter.missingEvidence)) return false;
    return !needle || [record.id, record.queryIdentifier, record.resolutionClass, record.sourcePageUrl, ...record.missingEvidence].join(" ").toLocaleLowerCase().includes(needle);
  });
}

export function summarizeStellarSourceClosureV616(pack: StellarSourceClosurePackV616): Readonly<{ total: number; freshCaptureRequired: number; missingEvidence: number; candidateOnly: number; openGates: number; completeRecords: number }> {
  return Object.freeze({ ...pack.counts, openGates: pack.records.filter(stellarSourceClosureHasOpenGateV616).length, completeRecords: pack.records.filter((record) => record.missingEvidence.length === 0).length });
}

export function stellarSourceClosureMissingLabelsV616(record: StellarSourceClosureRecordV616): readonly string[] {
  const labels: Record<string, string> = { "positive-parallax": "正视差", "parallax-error": "视差误差", "upstream-reference": "上游引用", "component-identity": "组件身份", "component-source-reference": "组件来源引用" };
  return Object.freeze(record.missingEvidence.map((key) => labels[key] ?? key));
}

export function stellarSourceClosureNextActionV616(record: StellarSourceClosureRecordV616): string {
  if (record.missingEvidence.includes("component-identity") || record.missingEvidence.includes("component-source-reference")) return "确认组件身份与引用";
  if (record.missingEvidence.length > 0) return "补采视差与上游引用";
  if (record.status === "fresh-capture-required") return "提交新来源快照";
  if (record.status === "capture-review") return "审核新来源快照";
  return "保持运行时门禁";
}

export function validateStellarSourceClosurePackV616(pack: StellarSourceClosurePackV616): StellarSourceClosurePackV616 {
  if (pack.schema !== "mainline-a-beta-stellar-source-closure-v616" || pack.counts.total !== pack.records.length) throw new Error("stellar source closure shape invalid");
  if (pack.boundary.legalDecision !== "not-granted" || pack.boundary.runtimeWrites || pack.boundary.measurementWrites || pack.boundary.scientificPayloadWriteback) throw new Error("stellar source closure boundary invalid");
  for (const record of pack.records) {
    if (!record.id || !record.queryIdentifier || !STELLAR_SOURCE_CLOSURE_STATUSES_V616.includes(record.status)) throw new Error(`stellar source closure record invalid: ${record.id}`);
    if (record.reviewDecision !== "hold" || record.runtimeAdmission !== "candidate-only" || record.measurementAdmission !== "not-admitted") throw new Error(`stellar source closure admission invalid: ${record.id}`);
  }
  return pack;
}

export function sourceClosureIdentityEqualV616(left: StellarSourceClosureRecordV616, right: StellarSourceClosureRecordV616): boolean {
  return left.id === right.id && left.queryIdentifier === right.queryIdentifier && left.snapshotRecordDigest === right.snapshotRecordDigest && left.projectionRecordDigest === right.projectionRecordDigest;
}

export function sourceClosureFingerprintV616(record: StellarSourceClosureRecordV616): string {
  return [record.id, record.queryIdentifier, record.snapshotSha256, record.snapshotRecordDigest, record.projectionRecordDigest, record.status, record.reviewDecision, [...record.missingEvidence].sort().join(",")].join("|");
}

export function sourceClosureCompletionPercentV616(pack: StellarSourceClosurePackV616): number {
  return pack.records.length === 0 ? 0 : Math.round((pack.records.filter((record) => record.missingEvidence.length === 0).length / pack.records.length) * 100);
}

export function sourceClosureRequiredEvidenceLabelsV616(record: StellarSourceClosureRecordV616): readonly string[] {
  const labels: Record<string, string> = { "positive-parallax": "正视差", "parallax-error": "视差误差", "upstream-reference": "上游文献", "component-identity": "组件身份", "component-source-reference": "组件引用" };
  return Object.freeze(record.requiredEvidence.map((key) => labels[key] ?? key));
}

export function sourceClosureCompletenessPercentV616(record: StellarSourceClosureRecordV616): number {
  const values = Object.values(record.completeness);
  return values.length === 0 ? 0 : Math.round((values.filter(Boolean).length / values.length) * 100);
}

export function validateStellarSourceClosurePatchV616(patch: StellarSourceClosurePatchV616): readonly string[] {
  const errors: string[] = [];
  if (!patch.id) errors.push("id-missing");
  if (!/^https:\/\//i.test(patch.sourcePageUrl)) errors.push("source-url-invalid");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(patch.capturedAt)) errors.push("captured-at-invalid");
  if (!/^[a-f0-9]{64}$/i.test(patch.captureSha256)) errors.push("capture-sha-invalid");
  if (!patch.reviewer.trim()) errors.push("reviewer-missing");
  if (!patch.resolutionClass.trim()) errors.push("resolution-class-missing");
  if (!/^[a-f0-9]{64}$/i.test(patch.sourceRecordDigest)) errors.push("source-digest-invalid");
  if (patch.parallaxMas !== null && (!Number.isFinite(patch.parallaxMas) || patch.parallaxMas <= 0)) errors.push("parallax-invalid");
  if (patch.errorMas !== null && (!Number.isFinite(patch.errorMas) || patch.errorMas < 0)) errors.push("parallax-error-invalid");
  if (patch.decision === "cleared" && patch.componentIdentityDecision !== "confirmed") errors.push("cleared-identity-unconfirmed");
  return Object.freeze(errors);
}

export function applyStellarSourceClosurePatchV616(record: StellarSourceClosureRecordV616, patch: StellarSourceClosurePatchV616): StellarSourceClosureRecordV616 {
  if (record.id !== patch.id) throw new Error("source closure patch identity mismatch");
  const errors = validateStellarSourceClosurePatchV616(patch);
  if (errors.length > 0) throw new Error(`source closure patch rejected: ${errors.join(",")}`);
  return Object.freeze({
    ...record,
    sourcePageUrl: patch.sourcePageUrl,
    resolutionClass: patch.resolutionClass,
    projectionRecordDigest: patch.sourceRecordDigest,
    status: "capture-review",
    reviewDecision: patch.decision === "cleared" ? "hold" : patch.decision,
    runtimeAdmission: "candidate-only",
    freshCapture: { sourceUrl: patch.sourcePageUrl, capturedAt: patch.capturedAt, captureSha256: patch.captureSha256, reviewer: patch.reviewer },
  });
}

export function sourceClosurePatchCanBeReviewedV616(record: StellarSourceClosureRecordV616, patch: StellarSourceClosurePatchV616): boolean {
  return record.id === patch.id && validateStellarSourceClosurePatchV616(patch).length === 0 && record.runtimeAdmission === "candidate-only" && record.measurementAdmission === "not-admitted";
}

export function sourceClosureDecisionLabelV616(decision: StellarSourceClosureRecordV616["reviewDecision"]): string {
  return ({ hold: "暂缓", cleared: "证据完整", rejected: "证据拒绝" } as Record<StellarSourceClosureRecordV616["reviewDecision"], string>)[decision];
}

export function sourceClosureFreshCaptureLabelV616(record: StellarSourceClosureRecordV616): string {
  if (!record.freshCapture.capturedAt) return "尚未采集新快照";
  return `${record.freshCapture.capturedAt} · ${record.freshCapture.reviewer ?? "审核人缺失"}`;
}

export function sourceClosureRecordIsSealedV616(record: StellarSourceClosureRecordV616): boolean {
  return /^[a-f0-9]{64}$/i.test(record.snapshotSha256)
    && /^[a-f0-9]{64}$/i.test(record.snapshotRecordDigest)
    && /^[a-f0-9]{64}$/i.test(record.projectionRecordDigest)
    && /^https:\/\//.test(record.sourcePageUrl);
}

export function sourceClosureMissingEvidenceCountV616(pack: StellarSourceClosurePackV616): number {
  return pack.records.reduce((total, record) => total + record.missingEvidence.length, 0);
}

export function sourceClosureAllCandidateOnlyV616(pack: StellarSourceClosurePackV616): boolean {
  return pack.records.length > 0 && pack.records.every((record) => record.runtimeAdmission === "candidate-only" && record.measurementAdmission === "not-admitted");
}

export function sourceClosureOpenGateLabelsV616(record: StellarSourceClosureRecordV616): readonly string[] {
  const labels: string[] = [];
  if (record.missingEvidence.length > 0) labels.push("source-evidence");
  if (record.freshCapture.capturedAt === null) labels.push("fresh-capture");
  if (record.reviewDecision !== "cleared") labels.push("review-decision");
  if (record.runtimeAdmission !== "admitted") labels.push("runtime-admission");
  if (record.measurementAdmission !== "not-admitted") labels.push("measurement-boundary");
  return Object.freeze(labels);
}

export function sourceClosureRecordSummaryV616(record: StellarSourceClosureRecordV616): string {
  return `${record.id} · ${stellarSourceClosureStatusLabelV616(record.status)} · ${sourceClosureCompletenessPercentV616(record)}% complete · ${stellarSourceClosureNextActionV616(record)}`;
}

export function sourceClosurePatchFingerprintV616(patch: StellarSourceClosurePatchV616): string {
  return [patch.id, patch.sourcePageUrl, patch.capturedAt, patch.captureSha256, patch.reviewer, patch.decision, patch.resolutionClass, patch.sourceRecordDigest, patch.componentIdentityDecision].join("|");
}

export function sourceClosurePackSummaryLabelV616(pack: StellarSourceClosurePackV616): string {
  return `${pack.counts.total} candidates · ${pack.counts.missingEvidence} evidence gaps · ${sourceClosureCompletionPercentV616(pack)}% complete`;
}

export function sourceClosureBoundaryIsImmutableV616(pack: StellarSourceClosurePackV616): boolean {
  return pack.boundary.legalDecision === "not-granted"
    && pack.boundary.runtimeWrites === false
    && pack.boundary.measurementWrites === false
    && pack.boundary.scientificPayloadWriteback === false
    && sourceClosureAllCandidateOnlyV616(pack);
}

export function sourceClosureCandidateCountV616(pack: StellarSourceClosurePackV616): number {
  return pack.records.filter((record) => record.runtimeAdmission === "candidate-only").length;
}

export function sourceClosureHasPendingCaptureV616(record: StellarSourceClosureRecordV616): boolean {
  return record.status === "fresh-capture-required" && record.freshCapture.capturedAt === null;
}

export function sourceClosureNeedsHumanReviewV616(record: StellarSourceClosureRecordV616): boolean {
  return record.status !== "closed" || record.reviewDecision === "hold";
}

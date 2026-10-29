import { createHash } from "node:crypto";

export type StructuredReviewDecisionV621 = "hold" | "rejected";
export type StructuredCandidateStateV621 = "pending" | "raw-only" | "structured" | "blocked";
export type StructuredBlockerV621 = "raw-response-missing" | "fixture-response" | "hash-mismatch" | "identity-missing" | "fields-incomplete" | "source-closure-missing" | "component-closure-missing" | "digest-mismatch" | "admission-boundary";

export type StructuredRawEvidenceV621 = Readonly<{
  captured: 0 | 1;
  transport: "https-html" | "astroquery-sim-script" | "fixture-replay";
  sha256: string | null;
  responseBytes: number | null;
  contentType: string | null;
  sourceUrl: string;
}>;

export type StructuredSourceRefV621 = Readonly<{ id: string; url: string; role: "object" | "catalog" | "component" | "upstream"; label: string; sha256: string | null }>;

export type StructuredCandidateV621 = Readonly<{
  id: "acrux" | "spica" | "regulus" | "polaris";
  queryIdentifier: string;
  state: StructuredCandidateStateV621;
  raw: StructuredRawEvidenceV621;
  expectedSnapshotRecordDigest: string;
  expectedProjectionRecordDigest: string;
  snapshotRecordDigest: string | null;
  projectionRecordDigest: string | null;
  identity: Readonly<{ canonicalName: string | null; component: string | null }>;
  fields: Readonly<Record<string, string | number | null>>;
  sourceRefs: readonly StructuredSourceRefV621[];
  componentRefs: readonly StructuredSourceRefV621[];
  reviewDecision: StructuredReviewDecisionV621;
  runtimeAdmission: "candidate-only";
  measurementAdmission: "not-admitted";
  scientificPayloadWriteback: false;
}>;

export type StructuredQualityV621 = Readonly<{
  score: number;
  dimensions: Readonly<{ response: number; identity: number; fields: number; sourceClosure: number; componentClosure: number; digest: number }>;
  blockers: readonly StructuredBlockerV621[];
  eligibleForStructuredReview: boolean;
}>;

export type StructuredLedgerEntryV621 = Readonly<{ id: string; fingerprint: string; quality: StructuredQualityV621; candidate: StructuredCandidateV621 }>;

const IDS = new Set(["acrux", "spica", "regulus", "polaris"]);
const SHA256 = /^[a-f0-9]{64}$/i;
const CONTENT = /^(text\/html|text\/plain|text\/tab-separated-values|application\/json)(?:;|$)/i;
const SIMBAD = "https://simbad.cds.unistra.fr/";
const REQUIRED_FIELDS = ["canonicalName", "spectralType", "parallaxMas"] as const;

function safeUrl(value: string): boolean {
  try { const parsed = new URL(value); return parsed.protocol === "https:" && parsed.hostname === "simbad.cds.unistra.fr"; } catch { return false; }
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value as Record<string, unknown>).sort().map((key) => [key, canonical((value as Record<string, unknown>)[key])]));
}

export function structuredEvidenceFingerprintV621(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonical(value)), "utf8").digest("hex");
}

export function normalizeStructuredFieldKeyV621(key: string): string {
  return key.trim().replace(/[\s_-]+/g, "").toLocaleLowerCase();
}

export function normalizeStructuredFieldsV621(fields: Readonly<Record<string, unknown>>): Readonly<Record<string, string | number | null>> {
  const normalized: Record<string, string | number | null> = {};
  for (const [rawKey, rawValue] of Object.entries(fields)) {
    const key = normalizeStructuredFieldKeyV621(rawKey);
    if (!key) continue;
    if (rawValue === null || rawValue === undefined || rawValue === "") normalized[key] = null;
    else if (typeof rawValue === "number" && Number.isFinite(rawValue)) normalized[key] = rawValue;
    else if (typeof rawValue === "string") {
      const trimmed = rawValue.trim();
      const numeric = Number(trimmed);
      normalized[key] = trimmed !== "" && Number.isFinite(numeric) && /^[-+]?\d+(?:\.\d+)?$/.test(trimmed) ? numeric : trimmed;
    }
  }
  return Object.freeze(Object.fromEntries(Object.keys(normalized).sort().map((key) => [key, normalized[key]])));
}

export function structuredFieldCompletenessV621(candidate: StructuredCandidateV621): number {
  const normalized = normalizeStructuredFieldsV621(candidate.fields);
  const present = REQUIRED_FIELDS.filter((field) => normalized[normalizeStructuredFieldKeyV621(field)] !== null && normalized[normalizeStructuredFieldKeyV621(field)] !== undefined && normalized[normalizeStructuredFieldKeyV621(field)] !== "").length;
  return Math.round((present / REQUIRED_FIELDS.length) * 100);
}

export function structuredSourceClosureScoreV621(candidate: StructuredCandidateV621): number {
  if (candidate.sourceRefs.length === 0) return 0;
  const valid = candidate.sourceRefs.filter((source) => safeUrl(source.url) && source.label.trim().length > 0 && SHA256.test(source.sha256 ?? "")).length;
  return Math.round((valid / candidate.sourceRefs.length) * 100);
}

export function structuredComponentClosureScoreV621(candidate: StructuredCandidateV621): number {
  if (candidate.identity.component === null) return 0;
  if (candidate.componentRefs.length === 0) return 0;
  const valid = candidate.componentRefs.filter((source) => source.role === "component" && safeUrl(source.url) && SHA256.test(source.sha256 ?? "")).length;
  return Math.round((valid / candidate.componentRefs.length) * 100);
}

export function classifyStructuredBlockersV621(candidate: StructuredCandidateV621): readonly StructuredBlockerV621[] {
  const blockers: StructuredBlockerV621[] = [];
  if (candidate.raw.captured !== 1 || !candidate.raw.sha256 || !Number.isInteger(candidate.raw.responseBytes) || (candidate.raw.responseBytes ?? 0) <= 0) blockers.push("raw-response-missing");
  if (candidate.raw.transport === "fixture-replay") blockers.push("fixture-response");
  if (!safeUrl(candidate.raw.sourceUrl) || !CONTENT.test(candidate.raw.contentType ?? "")) blockers.push("hash-mismatch");
  if (!candidate.identity.canonicalName || candidate.identity.canonicalName.trim().length === 0) blockers.push("identity-missing");
  if (structuredFieldCompletenessV621(candidate) < 100) blockers.push("fields-incomplete");
  if (structuredSourceClosureScoreV621(candidate) < 100) blockers.push("source-closure-missing");
  if (structuredComponentClosureScoreV621(candidate) < 100) blockers.push("component-closure-missing");
  if (candidate.snapshotRecordDigest !== candidate.expectedSnapshotRecordDigest || candidate.projectionRecordDigest !== candidate.expectedProjectionRecordDigest) blockers.push("digest-mismatch");
  if (candidate.reviewDecision !== "hold" || candidate.runtimeAdmission !== "candidate-only" || candidate.measurementAdmission !== "not-admitted" || candidate.scientificPayloadWriteback !== false) blockers.push("admission-boundary");
  return Object.freeze([...new Set(blockers)]);
}

export function scoreStructuredCandidateV621(candidate: StructuredCandidateV621): StructuredQualityV621 {
  const dimensions = { response: candidate.raw.captured === 1 && SHA256.test(candidate.raw.sha256 ?? "") && Number(candidate.raw.responseBytes) > 0 ? 100 : 0, identity: candidate.identity.canonicalName ? 100 : 0, fields: structuredFieldCompletenessV621(candidate), sourceClosure: structuredSourceClosureScoreV621(candidate), componentClosure: structuredComponentClosureScoreV621(candidate), digest: candidate.snapshotRecordDigest === candidate.expectedSnapshotRecordDigest && candidate.projectionRecordDigest === candidate.expectedProjectionRecordDigest ? 100 : 0 };
  const score = Math.round((dimensions.response * 25 + dimensions.identity * 15 + dimensions.fields * 20 + dimensions.sourceClosure * 15 + dimensions.componentClosure * 15 + dimensions.digest * 10) / 100);
  const blockers = classifyStructuredBlockersV621(candidate);
  return Object.freeze({ score, dimensions: Object.freeze(dimensions), blockers, eligibleForStructuredReview: blockers.length === 0 });
}

export function buildStructuredLedgerEntryV621(candidate: StructuredCandidateV621): StructuredLedgerEntryV621 {
  const quality = scoreStructuredCandidateV621(candidate);
  return Object.freeze({ id: candidate.id, fingerprint: structuredEvidenceFingerprintV621({ candidate, quality }), quality, candidate });
}

export function aggregateStructuredSourceLedgerV621(candidates: readonly StructuredCandidateV621[]): Readonly<{ total: number; sourceRefs: number; validSourceRefs: number; componentRefs: number; validComponentRefs: number; closedSources: number }> {
  const sourceRefs = candidates.flatMap((candidate) => candidate.sourceRefs);
  const componentRefs = candidates.flatMap((candidate) => candidate.componentRefs);
  const validSourceRefs = sourceRefs.filter((source) => safeUrl(source.url) && SHA256.test(source.sha256 ?? "")).length;
  const validComponentRefs = componentRefs.filter((source) => source.role === "component" && safeUrl(source.url) && SHA256.test(source.sha256 ?? "")).length;
  return Object.freeze({ total: candidates.length, sourceRefs: sourceRefs.length, validSourceRefs, componentRefs: componentRefs.length, validComponentRefs, closedSources: candidates.filter((candidate) => structuredSourceClosureScoreV621(candidate) === 100 && structuredComponentClosureScoreV621(candidate) === 100).length });
}

export function filterStructuredCandidatesV621(candidates: readonly StructuredCandidateV621[], query = ""): readonly StructuredCandidateV621[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return Object.freeze([...candidates]);
  return Object.freeze(candidates.filter((candidate) => [candidate.id, candidate.queryIdentifier, candidate.identity.canonicalName ?? "", ...classifyStructuredBlockersV621(candidate)].join(" ").toLocaleLowerCase().includes(needle)));
}

export function summarizeStructuredCandidatesV621(candidates: readonly StructuredCandidateV621[]) {
  const entries = candidates.map(buildStructuredLedgerEntryV621);
  return Object.freeze({ total: candidates.length, pending: candidates.filter((candidate) => candidate.state === "pending").length, rawOnly: candidates.filter((candidate) => candidate.state === "raw-only").length, structured: candidates.filter((candidate) => candidate.state === "structured").length, blocked: candidates.filter((candidate) => candidate.state === "blocked" || classifyStructuredBlockersV621(candidate).length > 0).length, averageScore: candidates.length ? Math.round(entries.reduce((sum, entry) => sum + entry.quality.score, 0) / candidates.length) : 0, sourceLedger: aggregateStructuredSourceLedgerV621(candidates), scientificPayloadWriteback: false as const });
}

export function validateStructuredCandidateBoundaryV621(candidate: StructuredCandidateV621): readonly string[] {
  const errors: string[] = [];
  if (!IDS.has(candidate.id)) errors.push("id-not-allowlisted");
  if (!candidate.queryIdentifier.trim()) errors.push("query-missing");
  if (candidate.reviewDecision !== "hold") errors.push("decision-opened");
  if (candidate.runtimeAdmission !== "candidate-only") errors.push("runtime-admission-opened");
  if (candidate.measurementAdmission !== "not-admitted") errors.push("measurement-admission-opened");
  if (candidate.scientificPayloadWriteback !== false) errors.push("scientific-writeback-opened");
  if (!safeUrl(candidate.raw.sourceUrl) || !candidate.raw.sourceUrl.startsWith(SIMBAD)) errors.push("source-origin-invalid");
  return Object.freeze(errors);
}

export function transitionStructuredCandidateToHoldV621(candidate: StructuredCandidateV621, state: StructuredCandidateStateV621 = "structured"): StructuredCandidateV621 {
  const next = { ...candidate, state, reviewDecision: "hold" as const, runtimeAdmission: "candidate-only" as const, measurementAdmission: "not-admitted" as const, scientificPayloadWriteback: false as const };
  const errors = validateStructuredCandidateBoundaryV621(next);
  if (errors.length) throw new Error(`structured transition rejected: ${errors.join(",")}`);
  return Object.freeze(next);
}

export function structuredAdmissionLabelV621(candidate: StructuredCandidateV621): string {
  const blockers = classifyStructuredBlockersV621(candidate);
  return blockers.length ? `hold · ${blockers.join("、")}` : "hold · candidate-only · not-admitted";
}

export function structuredRequiredFieldNamesV621(): readonly string[] {
  return Object.freeze([...REQUIRED_FIELDS]);
}

export function structuredMissingFieldsV621(candidate: StructuredCandidateV621): readonly string[] {
  const normalized = normalizeStructuredFieldsV621(candidate.fields);
  return Object.freeze(REQUIRED_FIELDS.filter((field) => {
    const value = normalized[normalizeStructuredFieldKeyV621(field)];
    return value === null || value === undefined || value === "";
  }));
}

export function structuredIdentityQualityV621(candidate: StructuredCandidateV621): Readonly<{ canonicalName: boolean; component: boolean; score: number }> {
  const canonicalName = typeof candidate.identity.canonicalName === "string" && candidate.identity.canonicalName.trim().length > 0;
  const component = typeof candidate.identity.component === "string" && candidate.identity.component.trim().length > 0;
  return Object.freeze({ canonicalName, component, score: (canonicalName ? 70 : 0) + (component ? 30 : 0) });
}

export function structuredRawEvidenceQualityV621(candidate: StructuredCandidateV621): Readonly<{ captured: boolean; hash: boolean; bytes: boolean; contentType: boolean; sourceUrl: boolean; score: number }> {
  const captured = candidate.raw.captured === 1;
  const hash = SHA256.test(candidate.raw.sha256 ?? "");
  const bytes = Number.isInteger(candidate.raw.responseBytes) && (candidate.raw.responseBytes ?? 0) > 0;
  const contentType = CONTENT.test(candidate.raw.contentType ?? "");
  const sourceUrl = safeUrl(candidate.raw.sourceUrl);
  const score = [captured, hash, bytes, contentType, sourceUrl].filter(Boolean).length * 20;
  return Object.freeze({ captured, hash, bytes, contentType, sourceUrl, score });
}

export function structuredSourceRefQualityV621(source: StructuredSourceRefV621): Readonly<{ url: boolean; label: boolean; hash: boolean; role: boolean; score: number }> {
  const url = safeUrl(source.url);
  const label = source.label.trim().length > 0;
  const hash = SHA256.test(source.sha256 ?? "");
  const role = ["object", "catalog", "component", "upstream"].includes(source.role);
  const score = [url, label, hash, role].filter(Boolean).length * 25;
  return Object.freeze({ url, label, hash, role, score });
}

export function structuredSourceRefQualityListV621(candidate: StructuredCandidateV621): readonly Readonly<{ id: string; score: number; valid: boolean }>[] {
  return Object.freeze(candidate.sourceRefs.map((source) => {
    const quality = structuredSourceRefQualityV621(source);
    return Object.freeze({ id: source.id, score: quality.score, valid: quality.score === 100 });
  }));
}

export function structuredComponentRefQualityListV621(candidate: StructuredCandidateV621): readonly Readonly<{ id: string; score: number; valid: boolean }>[] {
  return Object.freeze(candidate.componentRefs.map((source) => {
    const quality = structuredSourceRefQualityV621(source);
    const score = source.role === "component" ? quality.score : Math.max(0, quality.score - 25);
    return Object.freeze({ id: source.id, score, valid: score === 100 });
  }));
}

export function structuredDigestQualityV621(candidate: StructuredCandidateV621): Readonly<{ snapshot: boolean; projection: boolean; score: number }> {
  const snapshot = SHA256.test(candidate.snapshotRecordDigest ?? "") && candidate.snapshotRecordDigest === candidate.expectedSnapshotRecordDigest;
  const projection = SHA256.test(candidate.projectionRecordDigest ?? "") && candidate.projectionRecordDigest === candidate.expectedProjectionRecordDigest;
  return Object.freeze({ snapshot, projection, score: (snapshot ? 50 : 0) + (projection ? 50 : 0) });
}

export function structuredBlockerLabelV621(blocker: StructuredBlockerV621): string {
  const labels: Record<StructuredBlockerV621, string> = {
    "raw-response-missing": "原始响应缺失",
    "fixture-response": "fixture 响应不可晋级",
    "hash-mismatch": "来源或内容类型校验失败",
    "identity-missing": "对象身份缺失",
    "fields-incomplete": "必需字段不完整",
    "source-closure-missing": "来源引用未闭合",
    "component-closure-missing": "组件身份来源未闭合",
    "digest-mismatch": "V616 digest 不一致",
    "admission-boundary": "准入边界被打开",
  };
  return labels[blocker];
}

export function structuredBlockerLabelsV621(candidate: StructuredCandidateV621): readonly string[] {
  return Object.freeze(classifyStructuredBlockersV621(candidate).map(structuredBlockerLabelV621));
}

export function structuredCandidateSortKeyV621(candidate: StructuredCandidateV621): string {
  return `${candidate.id}|${candidate.queryIdentifier}|${candidate.state}|${structuredEvidenceFingerprintV621(candidate)}`;
}

export function sortStructuredCandidatesV621(candidates: readonly StructuredCandidateV621[]): readonly StructuredCandidateV621[] {
  return Object.freeze([...candidates].sort((left, right) => structuredCandidateSortKeyV621(left).localeCompare(structuredCandidateSortKeyV621(right))));
}

export function structuredLedgerFingerprintV621(candidates: readonly StructuredCandidateV621[]): string {
  return structuredEvidenceFingerprintV621(sortStructuredCandidatesV621(candidates).map((candidate) => ({
    id: candidate.id,
    state: candidate.state,
    rawSha256: candidate.raw.sha256,
    fields: normalizeStructuredFieldsV621(candidate.fields),
    sourceRefs: candidate.sourceRefs,
    componentRefs: candidate.componentRefs,
    blockers: classifyStructuredBlockersV621(candidate),
  })));
}

export function validateStructuredLedgerV621(candidates: readonly StructuredCandidateV621[]): Readonly<{ valid: boolean; errors: readonly string[]; fingerprint: string }> {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    if (seen.has(candidate.id)) errors.push(`${candidate.id}:duplicate-id`);
    seen.add(candidate.id);
    errors.push(...validateStructuredCandidateBoundaryV621(candidate).map((error) => `${candidate.id}:${error}`));
    // A parsed record may remain structured-but-blocked while component and
    // source review are open; this is the intended R61 hold state.
  }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), fingerprint: structuredLedgerFingerprintV621(candidates) });
}

export function structuredCandidateNextActionV621(candidate: StructuredCandidateV621): string {
  const blockers = classifyStructuredBlockersV621(candidate);
  if (blockers.includes("raw-response-missing")) return "补齐真实 raw response";
  if (blockers.includes("component-closure-missing")) return "确认组件身份与来源引用";
  if (blockers.includes("source-closure-missing")) return "补齐来源 URL、摘要与 hash";
  if (blockers.includes("fields-incomplete")) return "补齐结构化字段并复核单位";
  if (blockers.includes("digest-mismatch")) return "重新绑定 V616 snapshot/projection digest";
  return "保持 hold，等待人工审核";
}

export function structuredCandidateReportRowV621(candidate: StructuredCandidateV621): Readonly<Record<string, string | number | boolean>> {
  const quality = scoreStructuredCandidateV621(candidate);
  return Object.freeze({ id: candidate.id, state: candidate.state, score: quality.score, parseReady: quality.eligibleForStructuredReview, blockers: quality.blockers.length, sourceRefs: candidate.sourceRefs.length, componentRefs: candidate.componentRefs.length, nextAction: structuredCandidateNextActionV621(candidate), writeback: candidate.scientificPayloadWriteback });
}

export function structuredCandidateReportRowsV621(candidates: readonly StructuredCandidateV621[]): readonly Readonly<Record<string, string | number | boolean>>[] {
  return Object.freeze(sortStructuredCandidatesV621(candidates).map(structuredCandidateReportRowV621));
}

export function structuredCandidateJsonlV621(candidates: readonly StructuredCandidateV621[]): string {
  return `${structuredCandidateReportRowsV621(candidates).map((row) => JSON.stringify(row)).join("\n")}\n`;
}

export function structuredPackBoundaryV621(candidates: readonly StructuredCandidateV621[]): Readonly<{ candidateOnly: boolean; hold: boolean; notAdmitted: boolean; scientificPayloadWriteback: false }> {
  return Object.freeze({ candidateOnly: candidates.every((candidate) => candidate.runtimeAdmission === "candidate-only"), hold: candidates.every((candidate) => candidate.reviewDecision === "hold"), notAdmitted: candidates.every((candidate) => candidate.measurementAdmission === "not-admitted"), scientificPayloadWriteback: false as const });
}

export function structuredQualityBandV621(score: number): "blocked" | "review" | "strong" {
  if (!Number.isFinite(score) || score < 60) return "blocked";
  if (score < 90) return "review";
  return "strong";
}

export function structuredQualityDimensionLabelsV621(quality: StructuredQualityV621): readonly string[] {
  const labels: string[] = [];
  if (quality.dimensions.response < 100) labels.push("raw response");
  if (quality.dimensions.identity < 100) labels.push("identity");
  if (quality.dimensions.fields < 100) labels.push("fields");
  if (quality.dimensions.sourceClosure < 100) labels.push("source closure");
  if (quality.dimensions.componentClosure < 100) labels.push("component closure");
  if (quality.dimensions.digest < 100) labels.push("V616 digest");
  return Object.freeze(labels);
}

export function structuredBlockerCountsV621(candidates: readonly StructuredCandidateV621[]): Readonly<Record<StructuredBlockerV621, number>> {
  const counts = Object.fromEntries(["raw-response-missing", "fixture-response", "hash-mismatch", "identity-missing", "fields-incomplete", "source-closure-missing", "component-closure-missing", "digest-mismatch", "admission-boundary"].map((key) => [key, 0])) as Record<StructuredBlockerV621, number>;
  for (const candidate of candidates) for (const blocker of classifyStructuredBlockersV621(candidate)) counts[blocker] += 1;
  return Object.freeze(counts);
}

export function structuredCandidateIdentityV621(candidate: StructuredCandidateV621): string {
  return `${candidate.id}|${candidate.queryIdentifier}|${candidate.identity.canonicalName ?? ""}|${candidate.identity.component ?? ""}`;
}

export function structuredCandidatesDeterministicOrderV621(candidates: readonly StructuredCandidateV621[]): readonly StructuredCandidateV621[] {
  return Object.freeze([...candidates].sort((left, right) => structuredCandidateIdentityV621(left).localeCompare(structuredCandidateIdentityV621(right))));
}

export function structuredAdmissionIsClosedV621(candidate: StructuredCandidateV621): boolean {
  return candidate.reviewDecision === "hold" && candidate.runtimeAdmission === "candidate-only" && candidate.measurementAdmission === "not-admitted" && candidate.scientificPayloadWriteback === false;
}

export function structuredReviewStatusV621(candidate: StructuredCandidateV621): "blocked" | "ready-for-review" | "hold" {
  const quality = scoreStructuredCandidateV621(candidate);
  if (!structuredAdmissionIsClosedV621(candidate) || quality.blockers.includes("admission-boundary")) return "blocked";
  return quality.eligibleForStructuredReview ? "ready-for-review" : "hold";
}

export function mergeStructuredSourceRefsV621(candidates: readonly StructuredCandidateV621[]): readonly StructuredSourceRefV621[] {
  const merged = new Map<string, StructuredSourceRefV621>();
  for (const source of candidates.flatMap((candidate) => [...candidate.sourceRefs, ...candidate.componentRefs])) {
    const key = `${source.id}|${source.url}|${source.role}`;
    if (!merged.has(key)) merged.set(key, source);
  }
  return Object.freeze([...merged.values()].sort((left, right) => `${left.id}|${left.url}`.localeCompare(`${right.id}|${right.url}`)));
}

export function structuredLedgerFingerprintEqualV621(left: StructuredLedgerEntryV621, right: StructuredLedgerEntryV621): boolean {
  return left.fingerprint === right.fingerprint && structuredEvidenceFingerprintV621(left.candidate) === structuredEvidenceFingerprintV621(right.candidate);
}

export function structuredCandidateHasLiveRawV621(candidate: StructuredCandidateV621): boolean {
  return candidate.raw.captured === 1
    && candidate.raw.transport !== "fixture-replay"
    && typeof candidate.raw.sha256 === "string"
    && SHA256.test(candidate.raw.sha256)
    && Number.isInteger(candidate.raw.responseBytes)
    && (candidate.raw.responseBytes ?? 0) > 0;
}

export function structuredCandidateSourceUrlsV621(candidate: StructuredCandidateV621): readonly string[] {
  return Object.freeze(
    [...candidate.sourceRefs, ...candidate.componentRefs]
      .map((source) => source.url)
      .filter((url, index, urls) => urls.indexOf(url) === index)
      .sort(),
  );
}

export function structuredCandidateBlockerLabelV621(blocker: StructuredBlockerV621): string {
  const labels: Record<StructuredBlockerV621, string> = {
    "raw-response-missing": "原始响应缺失",
    "fixture-response": "fixture 不得晋级",
    "hash-mismatch": "响应完整性或来源错误",
    "identity-missing": "对象身份缺失",
    "fields-incomplete": "结构化字段不完整",
    "source-closure-missing": "来源闭包缺失",
    "component-closure-missing": "组件来源闭包缺失",
    "digest-mismatch": "V616 摘要不一致",
    "admission-boundary": "准入边界已打开",
  };
  return labels[blocker];
}

export function structuredCandidateBlockerLabelsV621(candidate: StructuredCandidateV621): readonly string[] {
  return Object.freeze(classifyStructuredBlockersV621(candidate).map(structuredCandidateBlockerLabelV621));
}

export function structuredQualitySummaryV621(candidate: StructuredCandidateV621): string {
  const quality = scoreStructuredCandidateV621(candidate);
  const band = structuredQualityBandV621(quality.score);
  const labels = structuredQualityDimensionLabelsV621(quality);
  return labels.length === 0 ? `${candidate.id} · ${band} · ${quality.score}/100` : `${candidate.id} · ${band} · ${quality.score}/100 · ${labels.join("、")}`;
}

export function structuredLedgerSummaryTextV621(candidates: readonly StructuredCandidateV621[]): string {
  const summary = summarizeStructuredCandidatesV621(candidates);
  return `${summary.total} candidates · ${summary.structured} structured · ${summary.rawOnly} raw-only · ${summary.blocked} blocked · average ${summary.averageScore}/100`;
}

export function structuredCandidateFieldDigestV621(candidate: StructuredCandidateV621): string {
  return structuredEvidenceFingerprintV621(normalizeStructuredFieldsV621(candidate.fields));
}

export function structuredCandidateReadOnlyCloneV621(candidate: StructuredCandidateV621): StructuredCandidateV621 {
  return Object.freeze({
    ...candidate,
    raw: Object.freeze({ ...candidate.raw }),
    identity: Object.freeze({ ...candidate.identity }),
    fields: Object.freeze({ ...candidate.fields }),
    sourceRefs: Object.freeze(candidate.sourceRefs.map((source) => Object.freeze({ ...source }))),
    componentRefs: Object.freeze(candidate.componentRefs.map((source) => Object.freeze({ ...source }))),
  });
}

export function structuredCandidateCanTransitionV621(candidate: StructuredCandidateV621): boolean {
  return structuredAdmissionIsClosedV621(candidate)
    && classifyStructuredBlockersV621(candidate).every((blocker) => blocker !== "admission-boundary");
}

export function structuredSourceLedgerFingerprintV621(candidates: readonly StructuredCandidateV621[]): string {
  return structuredEvidenceFingerprintV621(
    mergeStructuredSourceRefsV621(candidates),
  );
}

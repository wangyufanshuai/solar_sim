import type { NebulaReviewRow } from "./mainlineANebulaReviewV610";

export const RIGHTS_EVIDENCE_SCHEMA = "mainline-a-nebula-rights-evidence-v613" as const;
export const RIGHTS_DECISIONS = ["unreviewed", "cleared", "rejected"] as const;
export type RightsDecision = (typeof RIGHTS_DECISIONS)[number];

export const RIGHTS_EVIDENCE_STATUSES = ["pending", "verified", "rejected"] as const;
export type RightsEvidenceStatus = (typeof RIGHTS_EVIDENCE_STATUSES)[number];

export const RIGHTS_EVIDENCE_RISKS = [
  "evidence-pending",
  "decision-missing",
  "rights-page-missing",
  "rights-page-not-https",
  "policy-page-missing",
  "policy-page-not-https",
  "license-mismatch",
  "license-url-mismatch",
  "evidence-path-missing",
  "evidence-digest-invalid",
  "reviewer-missing",
  "reviewed-at-missing",
  "credit-confirmation-missing",
  "source-identity-mismatch",
  "decision-rejected",
  "runtime-admission-closed",
] as const;
export type RightsEvidenceRisk = (typeof RIGHTS_EVIDENCE_RISKS)[number];

export type NebulaRightsEvidence = Readonly<{
  schema: typeof RIGHTS_EVIDENCE_SCHEMA;
  candidateId: string;
  sourceSha256: string;
  sourceUrl: string;
  sourceLicense: string;
  sourceLicenseUrl: string;
  decision: RightsDecision;
  status: RightsEvidenceStatus;
  rightsPage: string | null;
  policyPage: string | null;
  evidencePath: string | null;
  evidenceSha256: string | null;
  reviewer: string | null;
  reviewedAt: string | null;
  creditConfirmed: boolean;
  notes: string | null;
}>;

export type RightsEvidenceAssessment = Readonly<{
  candidateId: string;
  valid: boolean;
  clearable: boolean;
  risks: readonly RightsEvidenceRisk[];
  expected: Readonly<{ sourceSha256: string; sourceUrl: string; sourceLicense: string; sourceLicenseUrl: string }>;
}>;

export type RightsEvidenceSummary = Readonly<{
  total: number;
  pending: number;
  verified: number;
  rejected: number;
  clearable: number;
  withRisks: number;
  runtimeAdmissionClosed: number;
}>;

const SHA256_PATTERN = /^[a-f0-9]{64}$/i;
const CANONICAL_POLICY_URL = "https://www.nasa.gov/nasa-brand-center/images-and-media/";
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

const unique = <T,>(values: readonly T[]): T[] => values.filter((value, index, list) => list.indexOf(value) === index);
const hasText = (value: string | null | undefined): value is string => typeof value === "string" && value.trim().length > 0;
const isHttps = (value: string | null): value is string => hasText(value) && /^https:\/\//i.test(value);

function expectedFor(row: NebulaReviewRow): RightsEvidenceAssessment["expected"] {
  return Object.freeze({
    sourceSha256: row.sourceSha256 ?? "",
    sourceUrl: row.sourcePage ?? "",
    sourceLicense: row.sourceLicense ?? "",
    sourceLicenseUrl: CANONICAL_POLICY_URL,
  });
}

export function createPendingNebulaRightsEvidence(row: NebulaReviewRow): NebulaRightsEvidence {
  const expected = expectedFor(row);
  return Object.freeze({
    schema: RIGHTS_EVIDENCE_SCHEMA,
    candidateId: row.id,
    sourceSha256: expected.sourceSha256,
    sourceUrl: expected.sourceUrl,
    sourceLicense: expected.sourceLicense,
    sourceLicenseUrl: expected.sourceLicenseUrl,
    decision: "unreviewed",
    status: "pending",
    rightsPage: null,
    policyPage: null,
    evidencePath: null,
    evidenceSha256: null,
    reviewer: null,
    reviewedAt: null,
    creditConfirmed: false,
    notes: null,
  });
}

export function assessNebulaRightsEvidence(row: NebulaReviewRow, evidence: NebulaRightsEvidence): RightsEvidenceAssessment {
  const expected = expectedFor(row);
  const risks: RightsEvidenceRisk[] = [];
  if (evidence.schema !== RIGHTS_EVIDENCE_SCHEMA || evidence.candidateId !== row.id) risks.push("source-identity-mismatch");
  if (evidence.sourceSha256 !== expected.sourceSha256 || evidence.sourceUrl !== expected.sourceUrl || evidence.sourceLicense !== expected.sourceLicense) risks.push("source-identity-mismatch");
  if (evidence.sourceLicense !== expected.sourceLicense) risks.push("license-mismatch");
  if (evidence.sourceLicenseUrl.replace(/\/$/, "") !== expected.sourceLicenseUrl.replace(/\/$/, "")) risks.push("license-url-mismatch");
  if (evidence.decision === "unreviewed" || evidence.status === "pending") risks.push("evidence-pending", "decision-missing");
  if (evidence.decision === "rejected" || evidence.status === "rejected") risks.push("decision-rejected");
  if (!isHttps(evidence.rightsPage)) risks.push("rights-page-missing", "rights-page-not-https");
  if (!isHttps(evidence.policyPage)) risks.push("policy-page-missing", "policy-page-not-https");
  if (!hasText(evidence.evidencePath)) risks.push("evidence-path-missing");
  if (!evidence.evidenceSha256 || !SHA256_PATTERN.test(evidence.evidenceSha256)) risks.push("evidence-digest-invalid");
  if (!hasText(evidence.reviewer)) risks.push("reviewer-missing");
  if (!evidence.reviewedAt || !ISO_DATE_PATTERN.test(evidence.reviewedAt)) risks.push("reviewed-at-missing");
  if (evidence.creditConfirmed !== true) risks.push("credit-confirmation-missing");
  const normalizedRisks = unique(risks);
  const clearable = normalizedRisks.length === 0 && evidence.decision === "cleared" && evidence.status === "verified";
  return Object.freeze({ candidateId: row.id, valid: normalizedRisks.length === 0, clearable, risks: Object.freeze(normalizedRisks), expected });
}

export function canClearNebulaRights(row: NebulaReviewRow, evidence: NebulaRightsEvidence): boolean {
  return assessNebulaRightsEvidence(row, evidence).clearable && row.runtimeAdmission === "candidate-only" && row.candidateOnly;
}

export function recordNebulaRightsDecision(
  row: NebulaReviewRow,
  evidence: NebulaRightsEvidence,
  decision: Extract<RightsDecision, "cleared" | "rejected">,
): NebulaRightsEvidence {
  const next = Object.freeze({ ...evidence, decision, status: decision === "cleared" ? "verified" : "rejected" } satisfies NebulaRightsEvidence);
  if (decision === "cleared" && !canClearNebulaRights(row, next)) throw new Error(`Nebula rights decision rejected: ${row.id}`);
  return next;
}

export function rightsEvidenceRiskLabel(risk: RightsEvidenceRisk): string {
  const labels: Record<RightsEvidenceRisk, string> = {
    "evidence-pending": "权利证据待提供",
    "decision-missing": "逐图决定缺失",
    "rights-page-missing": "图片来源页缺失",
    "rights-page-not-https": "来源页必须使用 HTTPS",
    "policy-page-missing": "政策页缺失",
    "policy-page-not-https": "政策页必须使用 HTTPS",
    "license-mismatch": "许可文本不匹配",
    "license-url-mismatch": "许可 URL 非规范地址",
    "evidence-path-missing": "本地政策证据缺失",
    "evidence-digest-invalid": "政策证据 SHA-256 无效",
    "reviewer-missing": "审核人缺失",
    "reviewed-at-missing": "审核时间缺失",
    "credit-confirmation-missing": "署名确认缺失",
    "source-identity-mismatch": "来源身份与封存记录不一致",
    "decision-rejected": "逐图权利决定为拒绝",
    "runtime-admission-closed": "运行时准入仍关闭",
  };
  return labels[risk];
}

export function assessNebulaRightsQueue(rows: readonly NebulaReviewRow[], evidence: readonly NebulaRightsEvidence[]): readonly RightsEvidenceAssessment[] {
  const byId = new Map(evidence.map((item) => [item.candidateId, item]));
  return Object.freeze(rows.map((row) => assessNebulaRightsEvidence(row, byId.get(row.id) ?? createPendingNebulaRightsEvidence(row))));
}

export function summarizeNebulaRightsEvidence(assessments: readonly RightsEvidenceAssessment[]): RightsEvidenceSummary {
  let pending = 0;
  let verified = 0;
  let rejected = 0;
  for (const assessment of assessments) {
    if (assessment.risks.includes("evidence-pending")) pending += 1;
    else if (assessment.risks.includes("decision-rejected")) rejected += 1;
    else if (assessment.clearable) verified += 1;
  }
  return Object.freeze({
    total: assessments.length,
    pending,
    verified,
    rejected,
    clearable: assessments.filter((assessment) => assessment.clearable).length,
    withRisks: assessments.filter((assessment) => assessment.risks.length > 0).length,
    runtimeAdmissionClosed: assessments.length,
  });
}

export function mergeNebulaRightsEvidence(
  rows: readonly NebulaReviewRow[],
  incoming: readonly NebulaRightsEvidence[],
): readonly NebulaRightsEvidence[] {
  const rowById = new Map(rows.map((row) => [row.id, row]));
  const seen = new Set<string>();
  const merged = incoming.map((evidence) => {
    if (seen.has(evidence.candidateId)) throw new Error(`Duplicate rights evidence: ${evidence.candidateId}`);
    seen.add(evidence.candidateId);
    const row = rowById.get(evidence.candidateId);
    if (!row) throw new Error(`Unknown rights evidence: ${evidence.candidateId}`);
    const assessment = assessNebulaRightsEvidence(row, evidence);
    if (assessment.risks.includes("source-identity-mismatch")) throw new Error(`Rights evidence source mismatch: ${evidence.candidateId}`);
    return Object.freeze({ ...evidence });
  });
  if (merged.length !== rows.length) throw new Error(`Rights evidence count mismatch: ${merged.length}/${rows.length}`);
  return Object.freeze(rows.map((row) => merged.find((evidence) => evidence.candidateId === row.id)!));
}

export function rightsEvidenceFingerprint(evidence: NebulaRightsEvidence): string {
  return [evidence.candidateId, evidence.sourceSha256, evidence.rightsPage ?? "", evidence.policyPage ?? "", evidence.evidenceSha256 ?? "", evidence.decision, evidence.status].join("|");
}

export function rightsEvidenceDecisionLabel(decision: RightsDecision): string {
  return ({ unreviewed: "未作逐图决定", cleared: "逐图权利已清", rejected: "逐图权利拒绝" } satisfies Record<RightsDecision, string>)[decision];
}

export function rightsEvidenceStatusLabel(status: RightsEvidenceStatus): string {
  return ({ pending: "证据待补", verified: "证据已验证", rejected: "证据被拒" } satisfies Record<RightsEvidenceStatus, string>)[status];
}

export function rightsEvidenceCompletionPercent(summary: RightsEvidenceSummary): number {
  if (summary.total === 0) return 0;
  return Math.round((summary.verified / summary.total) * 100);
}

export function isNebulaRightsEvidence(value: unknown): value is NebulaRightsEvidence {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<NebulaRightsEvidence>;
  return candidate.schema === RIGHTS_EVIDENCE_SCHEMA
    && hasText(candidate.candidateId)
    && hasText(candidate.sourceSha256)
    && hasText(candidate.sourceUrl)
    && hasText(candidate.sourceLicense)
    && hasText(candidate.sourceLicenseUrl)
    && RIGHTS_DECISIONS.includes(candidate.decision as RightsDecision)
    && RIGHTS_EVIDENCE_STATUSES.includes(candidate.status as RightsEvidenceStatus)
    && typeof candidate.creditConfirmed === "boolean";
}

export function serializeNebulaRightsEvidence(evidence: NebulaRightsEvidence): string {
  if (!isNebulaRightsEvidence(evidence)) throw new Error(`Invalid rights evidence: ${String(evidence)}`);
  return JSON.stringify(evidence);
}

export function parseNebulaRightsEvidence(serialized: string): NebulaRightsEvidence {
  let value: unknown;
  try { value = JSON.parse(serialized); }
  catch (error) { throw new Error(`Rights evidence JSON invalid: ${error instanceof Error ? error.message : String(error)}`); }
  if (!isNebulaRightsEvidence(value)) throw new Error("Rights evidence schema invalid");
  return Object.freeze(value);
}

export function rightsEvidenceQueueFingerprint(evidence: readonly NebulaRightsEvidence[]): string {
  return evidence.map(rightsEvidenceFingerprint).join(";");
}

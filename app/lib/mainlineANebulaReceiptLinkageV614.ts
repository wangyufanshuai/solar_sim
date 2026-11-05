export type ReceiptLinkageStatus = "payload-linked" | "identity-linked" | "reference-only" | "missing-reference";

export type ReceiptCandidateLink = Readonly<{
  path: string;
  parseable: boolean;
  sealValid: boolean;
  receiptSha256: string | null;
  identityMatch: boolean;
  exactRowMatch?: boolean;
  alias?: boolean;
  sourceMatch: boolean;
  pathMatch?: boolean;
  bytesMatch: boolean;
  digestMatch: boolean;
  payloadMatch: boolean;
  fileSha256: string | null;
}>;

export type ReceiptReferenceLink = Readonly<{
  key: string;
  declaredSha256: string;
  requiredLevel: "identity" | "payload";
  status: ReceiptLinkageStatus;
  identityLinked: boolean;
  payloadLinked: boolean;
  candidates: readonly ReceiptCandidateLink[];
}>;

export type NebulaReceiptLinkage = Readonly<{
  candidateId: string;
  links: readonly ReceiptReferenceLink[];
  valid: boolean;
  payloadLinked: number;
  identityLinked: number;
  missing: number;
}>;

export type ReceiptLinkageSummary = Readonly<{
  candidates: number;
  validCandidates: number;
  receiptReferences: number;
  payloadLinked: number;
  identityLinked: number;
  referenceOnly: number;
  missing: number;
  completionPercent: number;
}>;

export const RECEIPT_LINKAGE_STATUSES: readonly ReceiptLinkageStatus[] = ["payload-linked", "identity-linked", "reference-only", "missing-reference"];
const SHA256 = /^[a-f0-9]{64}$/i;
const RECEIPT_STATUS_ORDER: Readonly<Record<ReceiptLinkageStatus, number>> = {
  "missing-reference": 0,
  "reference-only": 1,
  "identity-linked": 2,
  "payload-linked": 3,
};

export function receiptLinkageStatusLabel(status: ReceiptLinkageStatus | string): string {
  const labels = ({
    "payload-linked": "载荷字段已逐项关联",
    "identity-linked": "身份字段已关联",
    "reference-only": "仅有声明引用",
    "missing-reference": "引用缺失",
  } satisfies Record<ReceiptLinkageStatus, string>);
  return RECEIPT_LINKAGE_STATUSES.includes(status as ReceiptLinkageStatus) ? labels[status as ReceiptLinkageStatus] : labels["missing-reference"];
}

export function receiptLinkageStatusTone(status: ReceiptLinkageStatus): "positive" | "neutral" | "warning" | "danger" {
  if (status === "payload-linked") return "positive";
  if (status === "identity-linked") return "neutral";
  if (status === "reference-only") return "warning";
  return "danger";
}

export function receiptLinkageIsValid(linkage: NebulaReceiptLinkage): boolean {
  return linkage.valid
    && linkage.missing === 0
    && linkage.links.every((link) => link.identityLinked && (link.requiredLevel !== "payload" || link.payloadLinked))
    && linkage.links.every((link) => link.candidates.every((candidate) => candidate.sealValid));
}

export function receiptLinkageRiskReasons(linkage: NebulaReceiptLinkage): string[] {
  const risks: string[] = [];
  for (const link of linkage.links) {
    if (link.status === "missing-reference") risks.push(`${link.key}:missing-reference`);
    if (!link.identityLinked) risks.push(`${link.key}:identity-unlinked`);
    if (link.requiredLevel === "payload" && !link.payloadLinked) risks.push(`${link.key}:payload-unlinked`);
    if (link.candidates.some((candidate) => !candidate.sealValid)) risks.push(`${link.key}:receipt-seal-invalid`);
  }
  return risks.filter((risk, index, list) => list.indexOf(risk) === index);
}

export function summarizeNebulaReceiptLinkages(linkages: readonly NebulaReceiptLinkage[]): ReceiptLinkageSummary {
  const links = linkages.flatMap((linkage) => linkage.links);
  const validCandidates = linkages.filter(receiptLinkageIsValid).length;
  return Object.freeze({
    candidates: linkages.length,
    validCandidates,
    receiptReferences: links.length,
    payloadLinked: links.filter((link) => link.payloadLinked).length,
    identityLinked: links.filter((link) => link.identityLinked).length,
    referenceOnly: links.filter((link) => link.status === "reference-only").length,
    missing: links.filter((link) => link.status === "missing-reference").length,
    completionPercent: linkages.length === 0 ? 0 : Math.round((validCandidates / linkages.length) * 100),
  });
}

export function selectReceiptLinks(linkage: NebulaReceiptLinkage, status?: ReceiptLinkageStatus): readonly ReceiptReferenceLink[] {
  return Object.freeze(status ? linkage.links.filter((link) => link.status === status) : [...linkage.links]);
}

export function receiptEvidencePaths(linkage: NebulaReceiptLinkage): readonly string[] {
  return Object.freeze(linkage.links.flatMap((link) => link.candidates.map((candidate) => candidate.path)).filter((path, index, list) => list.indexOf(path) === index));
}

export function receiptAliasPaths(linkage: NebulaReceiptLinkage): readonly string[] {
  return Object.freeze(linkage.links.flatMap((link) => link.candidates.filter((candidate) => candidate.alias).map((candidate) => candidate.path)));
}

export function formatReceiptLinkage(linkage: NebulaReceiptLinkage): string {
  const summary = `${linkage.identityLinked}/${linkage.links.length} identity · ${linkage.payloadLinked}/${linkage.links.length} payload`;
  return `${receiptLinkageIsValid(linkage) ? "已校验" : "需复核"} · ${summary}`;
}

export function assertReceiptLinkageShape(linkage: NebulaReceiptLinkage): NebulaReceiptLinkage {
  if (!linkage.candidateId || !Array.isArray(linkage.links)) throw new Error("receipt linkage shape invalid");
  for (const link of linkage.links) {
    if (!SHA256.test(link.declaredSha256) || !RECEIPT_LINKAGE_STATUSES.includes(link.status)) throw new Error(`receipt linkage hash/status invalid: ${link.key}`);
    if (!Array.isArray(link.candidates)) throw new Error(`receipt linkage candidates missing: ${link.key}`);
  }
  if (linkage.missing < 0 || linkage.payloadLinked < 0 || linkage.identityLinked < 0) throw new Error(`receipt linkage counters invalid: ${linkage.candidateId}`);
  return linkage;
}

export function compareReceiptLinkageIdentity(left: NebulaReceiptLinkage, right: NebulaReceiptLinkage): boolean {
  if (left.candidateId !== right.candidateId || left.links.length !== right.links.length) return false;
  return left.links.every((link, index) => link.key === right.links[index]?.key && link.declaredSha256 === right.links[index]?.declaredSha256);
}

export function sortReceiptLinkagesByRisk(linkages: readonly NebulaReceiptLinkage[]): readonly NebulaReceiptLinkage[] {
  return Object.freeze([...linkages].sort((left, right) => {
    const leftRisk = left.links.reduce((score, link) => Math.min(score, RECEIPT_STATUS_ORDER[link.status]), 99);
    const rightRisk = right.links.reduce((score, link) => Math.min(score, RECEIPT_STATUS_ORDER[link.status]), 99);
    return leftRisk - rightRisk || left.candidateId.localeCompare(right.candidateId);
  }));
}

export function receiptLinkageCompletionLabel(summary: ReceiptLinkageSummary): string {
  if (summary.candidates === 0) return "暂无回执候选";
  if (summary.validCandidates === summary.candidates) return `${summary.candidates}/${summary.candidates} candidates valid`;
  return `${summary.validCandidates}/${summary.candidates} candidates valid · ${summary.completionPercent}%`;
}

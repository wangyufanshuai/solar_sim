export type BetaNebulaExpansionStatusV617 = "payload-present-rights-pending" | "metadata-only-acquisition-blocked";

export type BetaNebulaExpansionSourceV617 = Readonly<{
  nasaId: string;
  sourceUrl: string;
  previewUrl: string;
  metadataPath: string;
  metadataSha256: string;
  creator: string | null;
  secondaryCreator: string;
  credit: string;
  licenseUrl: string;
  declaredLicenseState: string;
}>;

export type BetaNebulaExpansionRecordV617 = Readonly<{
  candidateId: string;
  expansionRank: number;
  status: BetaNebulaExpansionStatusV617;
  acquisitionDecision: string;
  source: BetaNebulaExpansionSourceV617;
  metadata: Readonly<{ state: string; receiptSha256: string; candidate: Readonly<Record<string, unknown>> | null }>;
  payload: Readonly<{ state: "local-payload-present" | "payload-acquisition-pending"; localPath: string | null; bytes: number | null; sha256: string | null; width: number | null; height: number | null; format: string | null }>;
  receipts: Readonly<{ licenseReviewSha256: string; metadataAdmissionSha256: string; metadataAcquisitionSha256: string; visualAcquisitionSha256: string }>;
  blockers: readonly string[];
  runtime: Readonly<{ candidateOnly: boolean; visualAssetAdmitted: boolean; scienceImagePayloadAllowed: boolean }>;
  nextAction: string;
}>;

export type BetaNebulaExpansionPackV617 = Readonly<{
  schema: "mainline-a-beta-nebula-expansion-v617";
  generatedAt: string;
  base: Readonly<{ path: string; sha256: string; candidateCount: number }>;
  sourceBoundary: Readonly<{ licenseReviewPath: string; metadataAdmissionPath: string; policyUrl: string; legalDecision: string; visualAssetAdmission: boolean; scienceImagePayloadWriteback: boolean }>;
  counts: Readonly<{ baseCandidates: number; expansionCandidates: number; candidateTotal: number; localPayloadPresent: number; payloadAcquisitionPending: number; blocked: number; runtimeAdmitted: number }>;
  records: readonly BetaNebulaExpansionRecordV617[];
}>;

export type BetaNebulaExpansionFilterV617 = Readonly<{ status?: BetaNebulaExpansionStatusV617; payloadState?: BetaNebulaExpansionRecordV617["payload"]["state"]; blocker?: string; query?: string }>;

const SHA256_PATTERN = /^[a-f0-9]{64}$/i;
const BLOCKER_LABELS: Readonly<Record<string, string>> = Object.freeze({
  "license-review-blocked": "来源许可审核阻塞",
  "metadata-acquisition-state-blocked": "元数据采集状态阻塞",
  "payload-acquisition-pending": "图像 payload 尚未采集",
  "rights-review-pending": "逐图权利证据待审核",
  "visual-signoff-pending": "视觉 signoff 待完成",
  "runtime-candidate-only": "运行时保持 candidate-only",
  "license:restricted-partner-or-copyright-flag": "存在受限合作方或版权标记",
  "license:source-resolution": "来源分辨率不足",
  "license:source-format": "来源格式待确认",
  "license:target-identity": "目标身份待确认",
});

export function betaNebulaExpansionStatusLabelV617(status: BetaNebulaExpansionStatusV617): string {
  return status === "payload-present-rights-pending" ? "已有本地 payload · 权利待审核" : "仅元数据 · payload 采集阻塞";
}

export function betaNebulaExpansionPayloadLabelV617(state: BetaNebulaExpansionRecordV617["payload"]["state"]): string {
  return state === "local-payload-present" ? "本地 payload 已存在" : "尚未采集 payload";
}

export function betaNebulaExpansionBlockerLabelV617(blocker: string): string { return BLOCKER_LABELS[blocker] ?? blocker; }

export function betaNebulaExpansionRowsV617(pack: BetaNebulaExpansionPackV617): readonly BetaNebulaExpansionRecordV617[] { return Object.freeze([...pack.records]); }

export function betaNebulaExpansionSummaryV617(pack: BetaNebulaExpansionPackV617) {
  return Object.freeze({
    baseCandidates: pack.counts.baseCandidates,
    expansionCandidates: pack.counts.expansionCandidates,
    candidateTotal: pack.counts.candidateTotal,
    localPayloadPresent: pack.counts.localPayloadPresent,
    payloadAcquisitionPending: pack.counts.payloadAcquisitionPending,
    blocked: pack.counts.blocked,
    runtimeAdmitted: pack.counts.runtimeAdmitted,
  });
}

export function filterBetaNebulaExpansionV617(pack: BetaNebulaExpansionPackV617, filter: BetaNebulaExpansionFilterV617 = {}): readonly BetaNebulaExpansionRecordV617[] {
  const needle = filter.query?.trim().toLocaleLowerCase() ?? "";
  return pack.records.filter((record) => {
    if (filter.status && record.status !== filter.status) return false;
    if (filter.payloadState && record.payload.state !== filter.payloadState) return false;
    if (filter.blocker && !record.blockers.includes(filter.blocker)) return false;
    if (!needle) return true;
    return [record.candidateId, record.source.nasaId, record.source.credit, record.source.secondaryCreator].join(" ").toLocaleLowerCase().includes(needle);
  });
}

export function betaNebulaExpansionCompletionV617(pack: BetaNebulaExpansionPackV617): number {
  if (pack.counts.expansionCandidates === 0) return 0;
  const ready = pack.records.filter((record) => record.payload.state === "local-payload-present" && record.blockers.length === 0).length;
  return Math.round((ready / pack.counts.expansionCandidates) * 100);
}

export function betaNebulaExpansionOpenGateV617(pack: BetaNebulaExpansionPackV617): boolean {
  return pack.counts.baseCandidates === 18 && pack.counts.candidateTotal === 24 && pack.counts.expansionCandidates === 6 && pack.counts.runtimeAdmitted === 0 && pack.records.every((record) => record.runtime.candidateOnly && !record.runtime.visualAssetAdmitted && !record.runtime.scienceImagePayloadAllowed);
}

export function betaNebulaExpansionBoundaryLabelV617(pack: BetaNebulaExpansionPackV617): string {
  return betaNebulaExpansionOpenGateV617(pack) ? "24 条候选已登记；运行时和科学图像载荷仍关闭" : "扩展包边界校验未通过";
}

export function betaNebulaExpansionNextActionV617(record: BetaNebulaExpansionRecordV617): string {
  if (record.payload.state === "payload-acquisition-pending") return "先完成许可确认后的单次 HTTPS 图像采集";
  if (record.blockers.includes("rights-review-pending")) return "补齐逐图权利页、政策页、审核人和时间";
  if (record.blockers.includes("visual-signoff-pending")) return "进行视觉 signoff";
  return record.nextAction;
}

export function betaNebulaExpansionRecordSummaryV617(record: BetaNebulaExpansionRecordV617): string {
  return `${record.expansionRank}. ${record.candidateId} · ${betaNebulaExpansionStatusLabelV617(record.status)} · ${record.blockers.length} 个阻塞`;
}

export function betaNebulaExpansionSourceSummaryV617(record: BetaNebulaExpansionRecordV617): string {
  return `${record.source.nasaId} · ${record.source.credit} · ${betaNebulaExpansionPayloadLabelV617(record.payload.state)}`;
}

export function validateBetaNebulaExpansionPackV617(pack: BetaNebulaExpansionPackV617): boolean {
  if (pack.schema !== "mainline-a-beta-nebula-expansion-v617") return false;
  if (pack.counts.baseCandidates !== 18 || pack.counts.expansionCandidates !== 6 || pack.counts.candidateTotal !== 24) return false;
  if (pack.counts.localPayloadPresent + pack.counts.payloadAcquisitionPending !== 6) return false;
  if (pack.counts.runtimeAdmitted !== 0 || pack.sourceBoundary.visualAssetAdmission || pack.sourceBoundary.scienceImagePayloadWriteback) return false;
  return pack.records.length === 6 && pack.records.every((record) => Boolean(record.candidateId) && record.source.sourceUrl.startsWith("https://") && record.source.previewUrl.startsWith("https://") && SHA256_PATTERN.test(record.source.metadataSha256) && record.runtime.candidateOnly && !record.runtime.visualAssetAdmitted && !record.runtime.scienceImagePayloadAllowed && (record.payload.state === "local-payload-present" ? Boolean(record.payload.localPath && record.payload.bytes && record.payload.sha256) : record.payload.localPath === null && record.payload.sha256 === null));
}

export function betaNebulaExpansionHasPayloadV617(record: BetaNebulaExpansionRecordV617): boolean { return record.payload.state === "local-payload-present" && Boolean(record.payload.localPath && record.payload.sha256); }

export function betaNebulaExpansionNeedsAcquisitionV617(record: BetaNebulaExpansionRecordV617): boolean { return record.payload.state === "payload-acquisition-pending"; }

export function betaNebulaExpansionNeedsRightsV617(record: BetaNebulaExpansionRecordV617): boolean { return record.blockers.includes("rights-review-pending"); }

export function betaNebulaExpansionCanAdmitV617(_record: BetaNebulaExpansionRecordV617): boolean { void _record; return false; }

export function betaNebulaExpansionCandidateIdsV617(pack: BetaNebulaExpansionPackV617): readonly string[] { return Object.freeze(pack.records.map((record) => record.candidateId)); }

export function betaNebulaExpansionPayloadCountLabelV617(pack: BetaNebulaExpansionPackV617): string { return `${pack.counts.localPayloadPresent}/6 payload 已落盘 · ${pack.counts.payloadAcquisitionPending}/6 待采集`; }

export function betaNebulaExpansionRightsLabelV617(record: BetaNebulaExpansionRecordV617): string { return record.blockers.includes("rights-review-pending") ? "权利待审核" : "权利证据已具备"; }

export function betaNebulaExpansionIsMetadataOnlyV617(record: BetaNebulaExpansionRecordV617): boolean { return record.payload.state === "payload-acquisition-pending" && record.payload.localPath === null; }

export function betaNebulaExpansionRecordIsSafeV617(record: BetaNebulaExpansionRecordV617): boolean { return record.runtime.candidateOnly && !record.runtime.visualAssetAdmitted && !record.runtime.scienceImagePayloadAllowed; }

export function betaNebulaExpansionAcquisitionLabelV617(record: BetaNebulaExpansionRecordV617): string {
  if (record.acquisitionDecision === "eligible-for-explicit-single-request-visual-source-acquisition") return "许可审核通过采集资格，仍需单次请求";
  return "许可身份或图像适用性阻塞";
}

export function betaNebulaExpansionReceiptLabelV617(record: BetaNebulaExpansionRecordV617): string {
  return `${record.receipts.licenseReviewSha256.slice(0, 12)}… · metadata ${record.receipts.metadataAcquisitionSha256.slice(0, 12)}…`;
}

export function betaNebulaExpansionMetadataStateLabelV617(record: BetaNebulaExpansionRecordV617): string {
  if (record.metadata.state === "candidate-explicit-https-acquisition-required") return "元数据允许进入显式 HTTPS 采集队列";
  return "元数据采集状态阻塞";
}

export function betaNebulaExpansionBlockerCountV617(pack: BetaNebulaExpansionPackV617): number {
  return pack.records.reduce((total, record) => total + record.blockers.length, 0);
}

export function betaNebulaExpansionBlockedIdsV617(pack: BetaNebulaExpansionPackV617): readonly string[] {
  return Object.freeze(pack.records.filter((record) => record.blockers.length > 0).map((record) => record.candidateId));
}

export function betaNebulaExpansionPayloadPathsV617(pack: BetaNebulaExpansionPackV617): readonly string[] {
  return Object.freeze(pack.records.flatMap((record) => record.payload.localPath ? [record.payload.localPath] : []));
}

export function betaNebulaExpansionSourceUrlsV617(pack: BetaNebulaExpansionPackV617): readonly string[] {
  return Object.freeze(pack.records.map((record) => record.source.sourceUrl));
}

export function betaNebulaExpansionHasUniqueSourcesV617(pack: BetaNebulaExpansionPackV617): boolean {
  const urls = betaNebulaExpansionSourceUrlsV617(pack);
  return new Set(urls).size === urls.length && new Set(pack.records.map((record) => record.source.nasaId)).size === pack.records.length;
}

export function betaNebulaExpansionRightsReviewCountV617(pack: BetaNebulaExpansionPackV617): number {
  return pack.records.filter((record) => betaNebulaExpansionNeedsRightsV617(record)).length;
}

export function betaNebulaExpansionAdmissionStatementV617(pack: BetaNebulaExpansionPackV617): string {
  return `${pack.counts.candidateTotal} 条候选已登记；${pack.counts.localPayloadPresent} 条有本地 payload、${pack.counts.payloadAcquisitionPending} 条仍待采集，0 条运行时准入。`;
}

export function betaNebulaExpansionMetadataOnlyIdsV617(pack: BetaNebulaExpansionPackV617): readonly string[] {
  return Object.freeze(pack.records.filter(betaNebulaExpansionIsMetadataOnlyV617).map((record) => record.candidateId));
}

export function betaNebulaExpansionLocalPayloadBytesV617(pack: BetaNebulaExpansionPackV617): number {
  return pack.records.reduce((total, record) => total + (record.payload.bytes ?? 0), 0);
}

export function betaNebulaExpansionAllCreditsPresentV617(pack: BetaNebulaExpansionPackV617): boolean {
  return pack.records.every((record) => record.source.credit.trim().length > 0);
}

export function betaNebulaExpansionAllPolicyUrlsV617(pack: BetaNebulaExpansionPackV617): boolean {
  return pack.records.every((record) => record.source.licenseUrl === "https://www.nasa.gov/nasa-brand-center/images-and-media/");
}

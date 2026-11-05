export type NebulaBatchFilterV624 = "all" | "captured" | "failed" | "historical" | "rights";
export type NebulaBatchAttemptV624 = Readonly<{ attempt: number; startedAt: string; endedAt: string | null; requestExecuted?: boolean; timeout: boolean; timeoutMs: number; retryCount: number; httpStatus: number | null; contentType: string | null; requestUrl: string; finalUrl: string | null; redirectChain: readonly string[]; errorClass: string | null; errorMessage?: string | null; requestFingerprint: string; responseCaptured: 0 | 1; responseBytes: number | null; width?: number | null; height?: number | null; format?: string | null; rawArtifactPath: string | null; rawPageSha256: string | null }>;
export type NebulaBatchRowV624 = Readonly<{ id: string; title: string; source: Readonly<{ url: string; credit: string; licenseUrl: string; declaredLicense: string }>; historical: Readonly<{ status: string; path: string | null; sha256: string | null; bytes: number | null; width: number | null; height: number | null; issues: readonly string[] }>; network: Readonly<{ status: string; responseCaptured: 0 | 1; attempts: readonly NebulaBatchAttemptV624[]; artifact: Readonly<{ path: string; sha256: string; bytes: number; width: number; height: number; format: string }> | null }>; rights: Readonly<{ status: string; blockers: readonly string[] }>; blockers: readonly string[]; runtimeAdmission: "candidate-only"; measurementAdmission: "not-admitted"; scientificPayloadWriteback: false }>;
export type NebulaBatchPackV624 = Readonly<{ schema: string; batchId: string; createdAt: string; rows: readonly NebulaBatchRowV624[]; counts: Readonly<Record<string, number>>; boundary: Readonly<{ candidateOnly: boolean; hold: boolean; notAdmitted: boolean; scientificPayloadWriteback: boolean }> }>;

const FILTER_LABELS: Readonly<Record<NebulaBatchFilterV624, string>> = Object.freeze({ all: "全部", captured: "本轮已捕获", failed: "网络失败", historical: "历史已验证", rights: "版权待签署" });

export function nebulaBatchFilterLabelV624(filter: NebulaBatchFilterV624): string {
  return FILTER_LABELS[filter];
}

export function nebulaBatchDurationV624(attempt: NebulaBatchAttemptV624): number | null {
  if (!attempt.endedAt) return null;
  const start = Date.parse(attempt.startedAt);
  const end = Date.parse(attempt.endedAt);
  return Number.isFinite(start) && Number.isFinite(end) && end >= start ? end - start : null;
}

export function nebulaBatchLatestAttemptV624(row: NebulaBatchRowV624): NebulaBatchAttemptV624 | null {
  return row.network.attempts.at(-1) ?? null;
}

export function nebulaBatchSuccessfulAttemptV624(row: NebulaBatchRowV624): NebulaBatchAttemptV624 | null {
  return row.network.attempts.find((attempt) => attempt.responseCaptured === 1 && attempt.httpStatus === 200) ?? null;
}

export function nebulaBatchHasCaptureV624(row: NebulaBatchRowV624): boolean {
  return row.network.responseCaptured === 1 && row.network.artifact !== null && nebulaBatchSuccessfulAttemptV624(row) !== null;
}

export function nebulaBatchHasHistoricalV624(row: NebulaBatchRowV624): boolean {
  return row.historical.status === "verified";
}

export function nebulaBatchRightsPendingV624(row: NebulaBatchRowV624): boolean {
  return row.rights.status !== "cleared";
}

export function nebulaBatchFilterMatchV624(row: NebulaBatchRowV624, filter: NebulaBatchFilterV624): boolean {
  if (filter === "all") return true;
  if (filter === "captured") return nebulaBatchHasCaptureV624(row);
  if (filter === "failed") return row.network.status === "failed";
  if (filter === "historical") return nebulaBatchHasHistoricalV624(row);
  return nebulaBatchRightsPendingV624(row);
}

export function nebulaBatchQueryMatchV624(row: NebulaBatchRowV624, query: string): boolean {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return true;
  return [row.id, row.title, row.source.credit, row.source.declaredLicense, row.source.url, row.network.status, ...row.blockers].join(" ").toLocaleLowerCase().includes(needle);
}

export function nebulaBatchVisibleRowsV624(pack: NebulaBatchPackV624, filter: NebulaBatchFilterV624, query: string): readonly NebulaBatchRowV624[] {
  return Object.freeze(pack.rows.filter((row) => nebulaBatchFilterMatchV624(row, filter) && nebulaBatchQueryMatchV624(row, query)));
}

export function nebulaBatchSelectionV624(rows: readonly NebulaBatchRowV624[], selectedId: string): NebulaBatchRowV624 | null {
  return rows.find((row) => row.id === selectedId) ?? rows[0] ?? null;
}

export function nebulaBatchAttemptSummaryV624(row: NebulaBatchRowV624) {
  const durations = row.network.attempts.map(nebulaBatchDurationV624).filter((value): value is number => value !== null);
  const latest = nebulaBatchLatestAttemptV624(row);
  return Object.freeze({ count: row.network.attempts.length, retries: Math.max(0, row.network.attempts.length - 1), executed: row.network.attempts.filter((attempt) => attempt.requestExecuted).length, durationMs: durations.reduce((sum, value) => sum + value, 0), latestStatus: latest?.httpStatus ?? null, latestError: latest?.errorClass ?? null, latestTimeout: latest?.timeout ?? false, latestFingerprint: latest?.requestFingerprint ?? null });
}

export function nebulaBatchArtifactLabelV624(row: NebulaBatchRowV624): string {
  if (!row.network.artifact) return row.network.responseCaptured ? "捕获但未落盘" : "未捕获";
  return `${row.network.artifact.format} · ${row.network.artifact.bytes.toLocaleString("zh-CN")} bytes · ${row.network.artifact.width}×${row.network.artifact.height}`;
}

export function nebulaBatchNetworkLabelV624(row: NebulaBatchRowV624): string {
  if (nebulaBatchHasCaptureV624(row)) return "raw HTTPS 已捕获";
  if (row.network.status === "failed") return "HTTPS 失败，保留 ledger";
  if (row.network.status === "not-run") return "未执行网络请求";
  return "采集待处理";
}

export function nebulaBatchHistoricalLabelV624(row: NebulaBatchRowV624): string {
  if (nebulaBatchHasHistoricalV624(row)) return "历史缓存 SHA/尺寸已核对";
  if (row.historical.status === "mismatch") return "历史文件不一致";
  return "没有历史 payload";
}

export function nebulaBatchRightsLabelV624(row: NebulaBatchRowV624): string {
  return nebulaBatchRightsPendingV624(row) ? "版权逐图签署待完成" : "版权已清权";
}

export function nebulaBatchBlockerLabelsV624(row: NebulaBatchRowV624): readonly string[] {
  return Object.freeze(row.blockers.map((blocker) => {
    if (blocker === "network-payload-pending") return "本轮 raw payload 尚未取得";
    if (blocker === "rights-signoff-pending") return "逐图版权证据待签署";
    if (blocker === "visual-signoff-pending") return "视觉 signoff 待完成";
    if (blocker === "runtime-candidate-only") return "运行时保持 candidate-only";
    if (blocker === "item-rights-review-pending") return "item-level 权利复核待完成";
    return blocker;
  }));
}

export function nebulaBatchSummaryV624(pack: NebulaBatchPackV624) {
  const rows = pack.rows;
  return Object.freeze({ total: rows.length, captured: rows.filter(nebulaBatchHasCaptureV624).length, failed: rows.filter((row) => row.network.status === "failed").length, historical: rows.filter(nebulaBatchHasHistoricalV624).length, rightsPending: rows.filter(nebulaBatchRightsPendingV624).length, attempts: rows.reduce((sum, row) => sum + row.network.attempts.length, 0), executed: rows.reduce((sum, row) => sum + row.network.attempts.filter((attempt) => attempt.requestExecuted).length, 0), artifactBytes: rows.reduce((sum, row) => sum + (row.network.artifact?.bytes ?? 0), 0), runtimeAdmitted: 0, measurementAdmitted: 0, scienceWriteback: false as const });
}

export function nebulaBatchStatusToneV624(row: NebulaBatchRowV624): "captured" | "failed" | "pending" {
  if (nebulaBatchHasCaptureV624(row)) return "captured";
  if (row.network.status === "failed") return "failed";
  return "pending";
}

export function nebulaBatchStatusLabelV624(row: NebulaBatchRowV624): string {
  const tone = nebulaBatchStatusToneV624(row);
  if (tone === "captured") return "已捕获 · 待清权";
  if (tone === "failed") return "失败 · 保留 ledger";
  return "待采集 · hold";
}

export function nebulaBatchSourceLinkV624(row: NebulaBatchRowV624): string {
  try { return new URL(row.source.url).hostname; } catch { return "来源 URL 无效"; }
}

export function nebulaBatchAttemptRowsV624(row: NebulaBatchRowV624): readonly Readonly<{ key: string; label: string; value: string }>[] {
  return Object.freeze(row.network.attempts.map((attempt) => Object.freeze({ key: `${row.id}-${attempt.attempt}`, label: `attempt ${attempt.attempt}`, value: `${attempt.httpStatus ?? "—"} · ${attempt.errorClass ?? "success/pending"} · ${nebulaBatchDurationV624(attempt) ?? "—"}ms · retry ${attempt.retryCount}` })));
}

export function nebulaBatchAdmissionNoteV624(row: NebulaBatchRowV624): string {
  if (row.scientificPayloadWriteback !== false) return "边界错误：scientificPayloadWriteback 必须为 false";
  if (row.runtimeAdmission !== "candidate-only") return "边界错误：运行时必须保持 candidate-only";
  if (row.measurementAdmission !== "not-admitted") return "边界错误：性能测量不得准入";
  return "candidate-only · hold · not-admitted · science payload off";
}

export function nebulaBatchBoundaryValidV624(pack: NebulaBatchPackV624): boolean {
  return pack.boundary.candidateOnly && pack.boundary.hold && pack.boundary.notAdmitted && !pack.boundary.scientificPayloadWriteback && pack.rows.every((row) => row.runtimeAdmission === "candidate-only" && row.measurementAdmission === "not-admitted" && row.scientificPayloadWriteback === false);
}

export function nebulaBatchSortRowsV624(rows: readonly NebulaBatchRowV624[], sort: "roster" | "status" | "bytes" = "roster"): readonly NebulaBatchRowV624[] {
  const result = [...rows];
  if (sort === "status") result.sort((left, right) => nebulaBatchStatusLabelV624(left).localeCompare(nebulaBatchStatusLabelV624(right)) || left.id.localeCompare(right.id));
  if (sort === "bytes") result.sort((left, right) => (right.network.artifact?.bytes ?? 0) - (left.network.artifact?.bytes ?? 0));
  return Object.freeze(result);
}

export function nebulaBatchCsvV624(rows: readonly NebulaBatchRowV624[]): string {
  const lines = ["id,networkStatus,captured,attempts,executed,artifactBytes,historicalStatus,rightsStatus,blockers"];
  rows.forEach((row) => { const summary = nebulaBatchAttemptSummaryV624(row); lines.push([row.id, row.network.status, row.network.responseCaptured, summary.count, summary.executed, row.network.artifact?.bytes ?? "", row.historical.status, row.rights.status, row.blockers.join("|")].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")); });
  return `${lines.join("\n")}\n`;
}

export function nebulaBatchJsonlV624(rows: readonly NebulaBatchRowV624[]): string {
  return `${rows.map((row) => JSON.stringify({ id: row.id, status: nebulaBatchStatusToneV624(row), network: row.network.status, attempts: nebulaBatchAttemptSummaryV624(row), artifact: row.network.artifact, historical: row.historical, rights: row.rights, blockers: row.blockers, admission: nebulaBatchAdmissionNoteV624(row) })).join("\n")}\n`;
}

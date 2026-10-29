export type NebulaBatchFilterV628 = "all" | "captured" | "failed" | "not-run" | "rights" | "historical";

export type NebulaBatchAttemptV628 = Readonly<{
  attempt: number;
  runAttempt?: number;
  retryCount: number;
  retryScope?: string;
  startedAt: string;
  endedAt: string | null;
  requestExecuted?: boolean;
  timeout: boolean;
  timeoutMs: number;
  httpStatus: number | null;
  contentType: string | null;
  requestUrl: string;
  finalUrl: string | null;
  redirectChain: readonly string[];
  errorClass: string | null;
  errorMessage?: string | null;
  requestFingerprint: string;
  responseCaptured: 0 | 1;
  responseBytes: number | null;
  width?: number | null;
  height?: number | null;
  format?: string | null;
  rawArtifactPath: string | null;
  rawPageSha256: string | null;
}>;

export type NebulaBatchArtifactV628 = Readonly<{
  path: string;
  sha256: string;
  bytes: number;
  width: number;
  height: number;
  format: string;
}>;

export type NebulaBatchRowV628 = Readonly<{
  id: string;
  title: string;
  source: Readonly<{
    url: string;
    nasaId: string | null;
    credit: string | null;
    licenseUrl: string | null;
    declaredLicense: string | null;
    sourcePageStatus: string;
  }>;
  historical: Readonly<{
    status: string;
    path: string | null;
    sha256: string | null;
    bytes: number | null;
    width: number | null;
    height: number | null;
    issues: readonly string[];
  }>;
  network: Readonly<{
    status: string;
    responseCaptured: 0 | 1;
    attempts: readonly NebulaBatchAttemptV628[];
    artifact: NebulaBatchArtifactV628 | null;
  }>;
  rights: Readonly<{
    status: string;
    sourcePageStatus: string;
    signoffStatus: string;
    blockers: readonly string[];
  }>;
  blockers: readonly string[];
  runtimeAdmission: "candidate-only";
  measurementAdmission: "not-admitted";
  scientificPayloadWriteback: false;
}>;

export type NebulaBatchPackV628 = Readonly<{
  schema: string;
  batchId: string;
  createdAt: string;
  rows: readonly NebulaBatchRowV628[];
  counts: Readonly<Record<string, number>>;
  boundary: Readonly<{
    candidateOnly: boolean;
    hold: boolean;
    notAdmitted: boolean;
    scientificPayloadWriteback: boolean;
    runtimeWrites?: boolean;
    measurementWrites?: boolean;
  }>;
  evidence?: Readonly<Record<string, unknown>>;
}>;

export type NebulaBatchToneV628 = "captured" | "failed" | "not-run" | "pending";

const FILTER_LABELS: Readonly<Record<NebulaBatchFilterV628, string>> = Object.freeze({
  all: "全部",
  captured: "已捕获",
  failed: "失败 ledger",
  "not-run": "未执行",
  rights: "版权待审",
  historical: "历史已核验",
});

const ERROR_LABELS: Readonly<Record<string, string>> = Object.freeze({
  "network-not-run": "离线 ledger，未发请求",
  timeout: "请求超时",
  dns: "DNS 失败",
  tls: "TLS 失败",
  network: "网络错误",
  "http-4xx": "HTTP 4xx",
  "http-5xx": "HTTP 5xx",
  "content-type": "Content-Type 不可接受",
  "payload-too-large": "响应超过大小上限",
  redirect: "重定向被拒绝",
  "unsafe-url": "来源 URL 不在白名单",
});

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function nullableText(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function bool(value: unknown): boolean {
  return value === true;
}

function rowFromUnknown(value: unknown): NebulaBatchRowV628 {
  const source = record(record(value).source);
  const historical = record(record(value).historical);
  const network = record(record(value).network);
  const rights = record(record(value).rights);
  const rowBlockersValue = record(value).blockers;
  const attempts = Array.isArray(network.attempts) ? network.attempts.map((item) => {
    const attempt = record(item);
    return {
      attempt: Number(attempt.attempt) || 0,
      runAttempt: numberOrNull(attempt.runAttempt) ?? undefined,
      retryCount: Number(attempt.retryCount) || 0,
      retryScope: nullableText(attempt.retryScope) ?? undefined,
      startedAt: text(attempt.startedAt),
      endedAt: nullableText(attempt.endedAt),
      requestExecuted: bool(attempt.requestExecuted),
      timeout: bool(attempt.timeout),
      timeoutMs: Number(attempt.timeoutMs) || 0,
      httpStatus: numberOrNull(attempt.httpStatus),
      contentType: nullableText(attempt.contentType),
      requestUrl: text(attempt.requestUrl),
      finalUrl: nullableText(attempt.finalUrl),
      redirectChain: Array.isArray(attempt.redirectChain) ? attempt.redirectChain.filter((item): item is string => typeof item === "string") : [],
      errorClass: nullableText(attempt.errorClass),
      errorMessage: nullableText(attempt.errorMessage),
      requestFingerprint: text(attempt.requestFingerprint),
      responseCaptured: attempt.responseCaptured === 1 ? 1 as const : 0 as const,
      responseBytes: numberOrNull(attempt.responseBytes),
      width: numberOrNull(attempt.width),
      height: numberOrNull(attempt.height),
      format: nullableText(attempt.format),
      rawArtifactPath: nullableText(attempt.rawArtifactPath),
      rawPageSha256: nullableText(attempt.rawPageSha256),
    } satisfies NebulaBatchAttemptV628;
  }) : [];
  const artifactValue = record(network.artifact);
  const artifact = typeof network.artifact === "object" && network.artifact !== null ? {
    path: text(artifactValue.path),
    sha256: text(artifactValue.sha256),
    bytes: Number(artifactValue.bytes) || 0,
    width: Number(artifactValue.width) || 0,
    height: Number(artifactValue.height) || 0,
    format: text(artifactValue.format),
  } satisfies NebulaBatchArtifactV628 : null;
  return {
    id: text(record(value).id),
    title: text(record(value).title, text(record(value).id)),
    source: {
      url: text(source.url),
      nasaId: nullableText(source.nasaId),
      credit: nullableText(source.credit),
      licenseUrl: nullableText(source.licenseUrl),
      declaredLicense: nullableText(source.declaredLicense),
      sourcePageStatus: text(source.sourcePageStatus, "pending"),
    },
    historical: {
      status: text(historical.status, "missing"),
      path: nullableText(historical.path),
      sha256: nullableText(historical.sha256),
      bytes: numberOrNull(historical.bytes),
      width: numberOrNull(historical.width),
      height: numberOrNull(historical.height),
      issues: Array.isArray(historical.issues) ? historical.issues.filter((item): item is string => typeof item === "string") : [],
    },
    network: {
      status: text(network.status, "not-run"),
      responseCaptured: network.responseCaptured === 1 ? 1 : 0,
      attempts,
      artifact,
    },
    rights: {
      status: text(rights.status, "pending"),
      sourcePageStatus: text(rights.sourcePageStatus, "pending"),
      signoffStatus: text(rights.signoffStatus, "pending"),
      blockers: Array.isArray(rights.blockers) ? rights.blockers.filter((item): item is string => typeof item === "string") : [],
    },
    blockers: Array.isArray(rowBlockersValue) ? rowBlockersValue.filter((item: unknown): item is string => typeof item === "string") : [],
    runtimeAdmission: "candidate-only",
    measurementAdmission: "not-admitted",
    scientificPayloadWriteback: false,
  };
}

export function normalizeNebulaBatchV628(value: unknown): NebulaBatchPackV628 {
  const input = record(value);
  const boundary = record(input.boundary);
  const rows = Array.isArray(input.rows) ? input.rows.map(rowFromUnknown) : [];
  return Object.freeze({
    schema: text(input.schema, "mainline-a-nebula-batch-v628"),
    batchId: text(input.batchId, "r66-beta-next-six"),
    createdAt: text(input.createdAt),
    rows: Object.freeze(rows),
    counts: Object.freeze(Object.fromEntries(Object.entries(record(input.counts)).map(([key, value]) => [key, Number(value) || 0]))),
    boundary: Object.freeze({
      candidateOnly: bool(boundary.candidateOnly),
      hold: bool(boundary.hold),
      notAdmitted: bool(boundary.notAdmitted),
      scientificPayloadWriteback: bool(boundary.scientificPayloadWriteback),
      runtimeWrites: bool(boundary.runtimeWrites),
      measurementWrites: bool(boundary.measurementWrites),
    }),
    evidence: record(input.evidence),
  });
}

export function nebulaBatchFilterLabelV628(filter: NebulaBatchFilterV628): string {
  return FILTER_LABELS[filter];
}

export function nebulaBatchErrorLabelV628(errorClass: string | null | undefined): string {
  if (!errorClass) return "成功或尚未返回错误";
  return ERROR_LABELS[errorClass] ?? errorClass;
}

export function nebulaBatchAttemptDurationV628(attempt: NebulaBatchAttemptV628): number | null {
  if (!attempt.endedAt) return null;
  const start = Date.parse(attempt.startedAt);
  const end = Date.parse(attempt.endedAt);
  return Number.isFinite(start) && Number.isFinite(end) && end >= start ? end - start : null;
}

export function nebulaBatchLatestAttemptV628(row: NebulaBatchRowV628): NebulaBatchAttemptV628 | null {
  return row.network.attempts.at(-1) ?? null;
}

export function nebulaBatchCapturedAttemptV628(row: NebulaBatchRowV628): NebulaBatchAttemptV628 | null {
  return row.network.attempts.find((attempt) => attempt.responseCaptured === 1 && attempt.httpStatus === 200) ?? null;
}

export function nebulaBatchHasCaptureV628(row: NebulaBatchRowV628): boolean {
  return row.network.responseCaptured === 1 && row.network.artifact !== null && nebulaBatchCapturedAttemptV628(row) !== null;
}

export function nebulaBatchHasHistoricalV628(row: NebulaBatchRowV628): boolean {
  return row.historical.status === "verified";
}

export function nebulaBatchIsFailedV628(row: NebulaBatchRowV628): boolean {
  return row.network.status === "failed" || row.network.attempts.some((attempt) => Boolean(attempt.errorClass && attempt.errorClass !== "network-not-run"));
}

export function nebulaBatchIsNotRunV628(row: NebulaBatchRowV628): boolean {
  return row.network.status === "not-run" || row.network.attempts.every((attempt) => attempt.errorClass === "network-not-run");
}

export function nebulaBatchFilterMatchV628(row: NebulaBatchRowV628, filter: NebulaBatchFilterV628): boolean {
  if (filter === "all") return true;
  if (filter === "captured") return nebulaBatchHasCaptureV628(row);
  if (filter === "failed") return nebulaBatchIsFailedV628(row);
  if (filter === "not-run") return nebulaBatchIsNotRunV628(row);
  if (filter === "rights") return row.rights.status !== "cleared" || row.rights.signoffStatus !== "cleared";
  return nebulaBatchHasHistoricalV628(row);
}

export function nebulaBatchQueryMatchV628(row: NebulaBatchRowV628, query: string): boolean {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return true;
  const latest = nebulaBatchLatestAttemptV628(row);
  return [row.id, row.title, row.source.nasaId, row.source.credit, row.source.url, row.network.status, latest?.httpStatus, latest?.errorClass, ...row.blockers].join(" ").toLocaleLowerCase().includes(needle);
}

export function nebulaBatchVisibleRowsV628(pack: NebulaBatchPackV628, filter: NebulaBatchFilterV628, query: string): readonly NebulaBatchRowV628[] {
  return Object.freeze(pack.rows.filter((row) => nebulaBatchFilterMatchV628(row, filter) && nebulaBatchQueryMatchV628(row, query)));
}

export function nebulaBatchSelectionV628(rows: readonly NebulaBatchRowV628[], selectedId: string): NebulaBatchRowV628 | null {
  return rows.find((row) => row.id === selectedId) ?? rows[0] ?? null;
}

export function nebulaBatchAttemptSummaryV628(row: NebulaBatchRowV628) {
  const durations = row.network.attempts.map(nebulaBatchAttemptDurationV628).filter((value): value is number => value !== null);
  const latest = nebulaBatchLatestAttemptV628(row);
  return Object.freeze({
    total: row.network.attempts.length,
    executed: row.network.attempts.filter((attempt) => attempt.requestExecuted).length,
    retries: row.network.attempts.reduce((max, attempt) => Math.max(max, attempt.retryCount), 0),
    durationMs: durations.reduce((sum, value) => sum + value, 0),
    latestStatus: latest?.httpStatus ?? null,
    latestContentType: latest?.contentType ?? null,
    latestError: latest?.errorClass ?? null,
    latestTimeout: latest?.timeout ?? false,
    redirects: latest?.redirectChain.length ? latest.redirectChain.length - 1 : 0,
    fingerprint: latest?.requestFingerprint ?? null,
  });
}

export function nebulaBatchToneV628(row: NebulaBatchRowV628): NebulaBatchToneV628 {
  if (nebulaBatchHasCaptureV628(row)) return "captured";
  if (nebulaBatchIsFailedV628(row)) return "failed";
  if (nebulaBatchIsNotRunV628(row)) return "not-run";
  return "pending";
}

export function nebulaBatchStatusLabelV628(row: NebulaBatchRowV628): string {
  const tone = nebulaBatchToneV628(row);
  if (tone === "captured") return "raw 已捕获 · 权利待审";
  if (tone === "failed") return "HTTPS 失败 · ledger 保留";
  if (tone === "not-run") return "未执行 · offline ledger";
  return "采集待处理 · hold";
}

export function nebulaBatchNetworkLabelV628(row: NebulaBatchRowV628): string {
  if (nebulaBatchHasCaptureV628(row)) return "真实 HTTPS 响应已落盘并重算 SHA-256";
  if (nebulaBatchIsFailedV628(row)) return "真实请求失败，responseCaptured=0";
  if (nebulaBatchIsNotRunV628(row)) return "离线回放，未发起外部请求";
  return "等待采集结果";
}

export function nebulaBatchHistoricalLabelV628(row: NebulaBatchRowV628): string {
  if (nebulaBatchHasHistoricalV628(row)) return "历史缓存 SHA/尺寸已核验";
  if (row.historical.status === "mismatch") return "历史文件与 manifest 不一致";
  return "没有可复核的历史 payload";
}

export function nebulaBatchArtifactLabelV628(row: NebulaBatchRowV628): string {
  const artifact = row.network.artifact;
  if (!artifact) return row.network.responseCaptured === 1 ? "响应已捕获但 artifact 缺失" : "没有 raw artifact";
  return `${artifact.format} · ${artifact.bytes.toLocaleString("zh-CN")} bytes · ${artifact.width}×${artifact.height} · SHA ${artifact.sha256.slice(0, 12)}…`;
}

export function nebulaBatchSourceHostV628(row: NebulaBatchRowV628): string {
  try { return new URL(row.source.url).hostname; } catch { return "来源 URL 无效"; }
}

export function nebulaBatchRightsLabelV628(row: NebulaBatchRowV628): string {
  if (row.rights.status === "cleared" && row.rights.signoffStatus === "cleared") return "逐图权利已签署";
  return "来源页、license、item signoff pending";
}

export function nebulaBatchAdmissionLabelV628(row: NebulaBatchRowV628): string {
  if (row.scientificPayloadWriteback !== false) return "边界错误：scientificPayloadWriteback=true";
  if (row.runtimeAdmission !== "candidate-only") return "边界错误：运行时准入已打开";
  if (row.measurementAdmission !== "not-admitted") return "边界错误：测量准入已打开";
  return "candidate-only · hold · not-admitted · science payload off";
}

export function nebulaBatchBlockerLabelsV628(row: NebulaBatchRowV628): readonly string[] {
  return Object.freeze([...row.blockers, ...row.rights.blockers].map((blocker) => {
    if (blocker === "network-payload-pending") return "网络 raw payload pending";
    if (blocker === "source-page-pending" || blocker === "official-source-page-pending") return "官方来源页证据 pending";
    if (blocker === "rights-signoff-pending" || blocker === "item-rights-review-pending") return "逐图版权 signoff pending";
    if (blocker === "visual-signoff-pending") return "视觉 signoff pending";
    if (blocker === "runtime-candidate-only") return "运行时保持 candidate-only";
    return blocker;
  }));
}

export function nebulaBatchBoundaryValidV628(pack: NebulaBatchPackV628): boolean {
  return pack.boundary.candidateOnly === true && pack.boundary.hold === true && pack.boundary.notAdmitted === true && pack.boundary.scientificPayloadWriteback === false && pack.boundary.runtimeWrites !== true && pack.boundary.measurementWrites !== true && pack.rows.every((row) => row.runtimeAdmission === "candidate-only" && row.measurementAdmission === "not-admitted" && row.scientificPayloadWriteback === false);
}

export function nebulaBatchSummaryV628(pack: NebulaBatchPackV628) {
  const rows = pack.rows;
  return Object.freeze({
    total: rows.length,
    captured: rows.filter(nebulaBatchHasCaptureV628).length,
    failed: rows.filter(nebulaBatchIsFailedV628).length,
    notRun: rows.filter(nebulaBatchIsNotRunV628).length,
    historical: rows.filter(nebulaBatchHasHistoricalV628).length,
    rightsPending: rows.filter((row) => row.rights.status !== "cleared" || row.rights.signoffStatus !== "cleared").length,
    attempts: rows.reduce((sum, row) => sum + row.network.attempts.length, 0),
    executed: rows.reduce((sum, row) => sum + row.network.attempts.filter((attempt) => attempt.requestExecuted).length, 0),
    timedOut: rows.reduce((sum, row) => sum + row.network.attempts.filter((attempt) => attempt.timeout).length, 0),
    artifactBytes: rows.reduce((sum, row) => sum + (row.network.artifact?.bytes ?? 0), 0),
    runtimeAdmitted: 0,
    scienceWriteback: false as const,
  });
}

export function nebulaBatchGateSummaryV628(pack: NebulaBatchPackV628) {
  const summary = nebulaBatchSummaryV628(pack);
  return Object.freeze([
    { id: "roster", label: "六颗候选完整", observed: summary.total, required: 6, status: summary.total === 6 ? "pass" : "hold" },
    { id: "attempt-ledger", label: "attempt ledger", observed: rowsWithAttempts(pack), required: summary.total, status: rowsWithAttempts(pack) === summary.total ? "pass" : "hold" },
    { id: "raw-artifact", label: "raw artifact SHA", observed: summary.captured, required: summary.total, status: summary.captured === summary.total ? "pass" : "hold" },
    { id: "historical", label: "历史缓存核验", observed: summary.historical, required: summary.total, status: summary.historical === summary.total ? "pass" : "hold" },
    { id: "source-page", label: "来源页证据", observed: pack.rows.filter((row) => row.source.sourcePageStatus === "verified").length, required: summary.total, status: "hold" },
    { id: "rights", label: "逐图版权签署", observed: pack.rows.filter((row) => row.rights.status === "cleared" && row.rights.signoffStatus === "cleared").length, required: summary.total, status: "hold" },
    { id: "boundary", label: "候选边界", observed: nebulaBatchBoundaryValidV628(pack) ? 1 : 0, required: 1, status: nebulaBatchBoundaryValidV628(pack) ? "pass" : "hold" },
  ] as const);
}

function rowsWithAttempts(pack: NebulaBatchPackV628): number {
  return pack.rows.filter((row) => row.network.attempts.length > 0).length;
}

export function nebulaBatchAttemptRowsV628(row: NebulaBatchRowV628): readonly Readonly<{ key: string; label: string; value: string }>[] {
  return Object.freeze(row.network.attempts.map((attempt) => Object.freeze({
    key: `${row.id}-${attempt.attempt}-${attempt.requestFingerprint.slice(0, 8)}`,
    label: `attempt ${attempt.attempt}`,
    value: `${attempt.httpStatus ?? "—"} · ${nebulaBatchErrorLabelV628(attempt.errorClass)} · ${nebulaBatchAttemptDurationV628(attempt) ?? "—"}ms · retry ${attempt.retryCount} · ${attempt.contentType ?? "content-type —"}`,
  })));
}

export function nebulaBatchRedirectLabelV628(attempt: NebulaBatchAttemptV628 | null): string {
  if (!attempt || attempt.redirectChain.length < 2) return "无重定向";
  return `${attempt.redirectChain.length - 1} hop · ${attempt.finalUrl ?? "终点未知"}`;
}

export function nebulaBatchFingerprintLabelV628(attempt: NebulaBatchAttemptV628 | null): string {
  return attempt?.requestFingerprint ? `SHA-256 ${attempt.requestFingerprint}` : "request fingerprint 缺失";
}

export function nebulaBatchIntegrityFindingsV628(pack: NebulaBatchPackV628): readonly string[] {
  const findings: string[] = [];
  if (!nebulaBatchBoundaryValidV628(pack)) findings.push("batch boundary is open");
  pack.rows.forEach((row) => {
    if (!row.network.attempts.length) findings.push(`${row.id}: attempt ledger missing`);
    if (row.network.responseCaptured === 0 && row.network.artifact !== null) findings.push(`${row.id}: artifact exists without responseCaptured`);
    if (row.network.responseCaptured === 1 && row.network.artifact === null) findings.push(`${row.id}: response captured without artifact`);
    row.network.attempts.forEach((attempt) => {
      if (!attempt.startedAt || !attempt.endedAt) findings.push(`${row.id}: attempt ${attempt.attempt} lacks timestamps`);
      if (attempt.responseCaptured === 0 && !attempt.errorClass && !attempt.timeout) findings.push(`${row.id}: failed attempt lacks error classification`);
      if (attempt.responseCaptured === 1 && (!attempt.httpStatus || !attempt.contentType || !attempt.finalUrl || !attempt.rawPageSha256)) findings.push(`${row.id}: captured telemetry incomplete`);
    });
  });
  return Object.freeze(findings);
}

export function nebulaBatchJsonlV628(rows: readonly NebulaBatchRowV628[]): string {
  return `${rows.map((row) => JSON.stringify({ id: row.id, tone: nebulaBatchToneV628(row), network: row.network.status, attempts: nebulaBatchAttemptSummaryV628(row), artifact: row.network.artifact, rights: row.rights, blockers: nebulaBatchBlockerLabelsV628(row), admission: nebulaBatchAdmissionLabelV628(row) })).join("\n")}\n`;
}

import { createHash } from "node:crypto";
import type { NebulaAttemptErrorClassV623, NebulaAttemptV623, NebulaLedgerRecordV623 } from "./mainlineANebulaAcquisitionLedgerV623";

export type NebulaAcquisitionDecisionV623 = "allow" | "hold" | "retry" | "reject";
export type NebulaAcquisitionGateV623 = Readonly<{ source: boolean; transport: boolean; payload: boolean; rights: boolean; runtime: false; scienceWriteback: false }>;
export type NebulaAcquisitionPolicyV623 = Readonly<{ allowedHosts: readonly string[]; allowedFormats: readonly string[]; timeoutMs: number; maxAttempts: number; maxBytes: number; requireHttps: true; rejectCredentials: true; rejectPorts: true }>;

export const MAINLINE_A_NEBULA_POLICY_V623: NebulaAcquisitionPolicyV623 = Object.freeze({ allowedHosts: ["images-assets.nasa.gov"], allowedFormats: ["png", "jpg", "jpeg", "webp"], timeoutMs: 20_000, maxAttempts: 4, maxBytes: 50_000_000, requireHttps: true, rejectCredentials: true, rejectPorts: true });

const SHA256 = /^[a-f0-9]{64}$/i;

export function policyFingerprintV623(policy: NebulaAcquisitionPolicyV623 = MAINLINE_A_NEBULA_POLICY_V623): string {
  return createHash("sha256").update(JSON.stringify(policy), "utf8").digest("hex");
}

export function parseUrlV623(value: string): URL | null {
  try { return new URL(value); } catch { return null; }
}

export function hostAllowedV623(value: string, policy = MAINLINE_A_NEBULA_POLICY_V623): boolean {
  const parsed = parseUrlV623(value);
  return Boolean(parsed && policy.allowedHosts.includes(parsed.hostname.toLocaleLowerCase()));
}

export function credentialsAbsentV623(value: string): boolean {
  const parsed = parseUrlV623(value);
  return Boolean(parsed && !parsed.username && !parsed.password);
}

export function portAbsentV623(value: string): boolean {
  const parsed = parseUrlV623(value);
  return Boolean(parsed && !parsed.port);
}

export function protocolAllowedV623(value: string, policy = MAINLINE_A_NEBULA_POLICY_V623): boolean {
  const parsed = parseUrlV623(value);
  return Boolean(parsed && (!policy.requireHttps || parsed.protocol === "https:"));
}

export function policyUrlAllowedV623(value: string, policy = MAINLINE_A_NEBULA_POLICY_V623): boolean {
  return protocolAllowedV623(value, policy) && credentialsAbsentV623(value) && portAbsentV623(value) && hostAllowedV623(value, policy);
}

export function extensionFromUrlV623(value: string): string | null {
  const parsed = parseUrlV623(value);
  const match = parsed?.pathname.toLocaleLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? null;
}

export function formatAllowedV623(value: string | null | undefined, policy = MAINLINE_A_NEBULA_POLICY_V623): boolean {
  return Boolean(value && policy.allowedFormats.includes(value.toLocaleLowerCase()));
}

export function sourcePolicyIssuesV623(url: string, policy = MAINLINE_A_NEBULA_POLICY_V623): readonly string[] {
  const issues: string[] = [];
  if (!protocolAllowedV623(url, policy)) issues.push("https-required");
  if (!credentialsAbsentV623(url)) issues.push("credentials-forbidden");
  if (!portAbsentV623(url)) issues.push("port-forbidden");
  if (!hostAllowedV623(url, policy)) issues.push("host-not-allowlisted");
  if (!formatAllowedV623(extensionFromUrlV623(url), policy)) issues.push("format-not-allowlisted");
  return Object.freeze(issues);
}

export function mimeToFormatV623(mime: string | null | undefined): string | null {
  const normalized = mime?.split(";")[0].trim().toLocaleLowerCase();
  if (normalized === "image/jpeg" || normalized === "image/jpg") return "jpg";
  if (normalized === "image/png") return "png";
  if (normalized === "image/webp") return "webp";
  return null;
}

export function contentTypeAllowedV623(mime: string | null | undefined, policy = MAINLINE_A_NEBULA_POLICY_V623): boolean {
  return formatAllowedV623(mimeToFormatV623(mime), policy);
}

export function responseStatusAllowedV623(status: number | null | undefined): boolean {
  return Number.isInteger(status) && (status ?? 0) >= 200 && (status ?? 0) < 300;
}

export function responseStatusRetryableV623(status: number | null | undefined): boolean {
  return status !== null && status !== undefined && status >= 500 && status <= 599;
}

export function responseStatusClassV623(status: number | null | undefined): "success" | "redirect" | "client-error" | "server-error" | "missing" {
  if (status === null || status === undefined) return "missing";
  if (status >= 200 && status < 300) return "success";
  if (status >= 300 && status < 400) return "redirect";
  if (status >= 400 && status < 500) return "client-error";
  return "server-error";
}

export function payloadSizeAllowedV623(bytes: number | null | undefined, policy = MAINLINE_A_NEBULA_POLICY_V623): boolean {
  return Number.isInteger(bytes) && (bytes ?? 0) > 0 && (bytes ?? 0) <= policy.maxBytes;
}

export function dimensionsAllowedV623(width: number | null | undefined, height: number | null | undefined): boolean {
  return Number.isInteger(width) && Number.isInteger(height) && (width ?? 0) > 0 && (height ?? 0) > 0 && (width ?? 0) <= 16_384 && (height ?? 0) <= 16_384;
}

export function aspectRatioAllowedV623(width: number | null | undefined, height: number | null | undefined): boolean {
  if (!dimensionsAllowedV623(width, height)) return false;
  const ratio = (width ?? 0) / (height ?? 1);
  return ratio >= 0.05 && ratio <= 20;
}

export function sha256AllowedV623(value: string | null | undefined): boolean {
  return SHA256.test(value ?? "");
}

export function artifactPathV623(id: string, nasaId: string, format: string): string {
  const safeId = id.replace(/[^a-z0-9-]/gi, "-").toLocaleLowerCase();
  const safeNasaId = nasaId.replace(/[^a-z0-9_-]/gi, "-");
  const safeFormat = format.replace(/[^a-z0-9]/gi, "").toLocaleLowerCase();
  return `source-cache/v623/nebulae/raw/${safeId}-${safeNasaId}.${safeFormat}`;
}

export function artifactPathSafeV623(value: string): boolean {
  return Boolean(value) && !value.includes("..") && !value.startsWith("/") && !/^[A-Za-z]:/.test(value) && value.startsWith("source-cache/v623/nebulae/raw/");
}

export function redirectChainSafeV623(chain: readonly string[], policy = MAINLINE_A_NEBULA_POLICY_V623): boolean {
  return chain.length <= 8 && chain.every((url) => policyUrlAllowedV623(url, policy));
}

export function attemptPolicyIssuesV623(attempt: NebulaAttemptV623, policy = MAINLINE_A_NEBULA_POLICY_V623): readonly string[] {
  const issues: string[] = [];
  issues.push(...sourcePolicyIssuesV623(attempt.requestUrl, policy).map((issue) => `request-${issue}`));
  if (attempt.finalUrl && !policyUrlAllowedV623(attempt.finalUrl, policy)) issues.push("final-url-policy");
  if (!redirectChainSafeV623(attempt.redirectChain, policy)) issues.push("redirect-chain-policy");
  if (attempt.timeoutMs !== policy.timeoutMs) issues.push("timeout-policy");
  if (attempt.retryCount < 0 || attempt.retryCount > policy.maxAttempts - 1) issues.push("retry-count-policy");
  if (attempt.responseBytes !== null && !payloadSizeAllowedV623(attempt.responseBytes, policy)) issues.push("response-size-policy");
  if (attempt.contentType && !contentTypeAllowedV623(attempt.contentType, policy)) issues.push("content-type-policy");
  return Object.freeze([...new Set(issues)]);
}

export function recordPolicyIssuesV623(record: NebulaLedgerRecordV623, policy = MAINLINE_A_NEBULA_POLICY_V623): readonly string[] {
  const issues: string[] = [...sourcePolicyIssuesV623(record.sourceUrl, policy).map((issue) => `source-${issue}`)];
  if (record.runtimeAdmission !== "candidate-only") issues.push("runtime-admission-open");
  if (record.measurementAdmission !== "not-admitted") issues.push("measurement-admission-open");
  if (record.scientificPayloadWriteback !== false) issues.push("science-writeback-open");
  for (const attempt of record.attempts) issues.push(...attemptPolicyIssuesV623(attempt, policy).map((issue) => `${record.id}:${issue}`));
  if (record.payload.bytes !== null && !payloadSizeAllowedV623(record.payload.bytes, policy)) issues.push("payload-size-policy");
  if (record.payload.format && !formatAllowedV623(record.payload.format, policy)) issues.push("payload-format-policy");
  if (record.payload.width !== null && !dimensionsAllowedV623(record.payload.width, record.payload.height)) issues.push("payload-dimensions-policy");
  return Object.freeze([...new Set(issues)]);
}

export function backoffMsV623(retryCount: number, baseMs = 1_000, capMs = 60_000): number {
  const exponent = Math.max(0, Math.min(8, Math.floor(retryCount)));
  return Math.min(capMs, baseMs * 2 ** exponent);
}

export function retryAllowedByErrorV623(errorClass: NebulaAttemptErrorClassV623 | null): boolean {
  return errorClass === "timeout" || errorClass === "dns" || errorClass === "tls" || errorClass === "unknown";
}

export function retryDecisionV623(attempt: NebulaAttemptV623, policy = MAINLINE_A_NEBULA_POLICY_V623): NebulaAcquisitionDecisionV623 {
  if (attemptPolicyIssuesV623(attempt, policy).length) return "reject";
  if (attempt.responseCaptured === 1 && responseStatusAllowedV623(attempt.httpStatus)) return "allow";
  if (retryAllowedByErrorV623(attempt.errorClass) || responseStatusRetryableV623(attempt.httpStatus)) return attempt.retryCount + 1 < policy.maxAttempts ? "retry" : "hold";
  if (attempt.errorClass === "network-not-run") return "hold";
  return "reject";
}

export function recordDecisionV623(record: NebulaLedgerRecordV623, policy = MAINLINE_A_NEBULA_POLICY_V623): NebulaAcquisitionDecisionV623 {
  if (recordPolicyIssuesV623(record, policy).length) return "reject";
  if (record.responseCaptured === 1 && record.payload.bytes !== null && record.payload.sha256 !== null) return "allow";
  const latest = record.attempts.at(-1);
  if (!latest) return "hold";
  const decision = retryDecisionV623(latest, policy);
  return decision === "allow" ? "hold" : decision;
}

export function gateForRecordV623(record: NebulaLedgerRecordV623, policy = MAINLINE_A_NEBULA_POLICY_V623): NebulaAcquisitionGateV623 {
  return Object.freeze({ source: sourcePolicyIssuesV623(record.sourceUrl, policy).length === 0, transport: record.attempts.length > 0 && record.attempts.every((attempt) => attemptPolicyIssuesV623(attempt, policy).length === 0), payload: record.responseCaptured === 1 && payloadSizeAllowedV623(record.payload.bytes, policy) && sha256AllowedV623(record.payload.sha256) && dimensionsAllowedV623(record.payload.width, record.payload.height), rights: record.rightsStatus === "cleared", runtime: false, scienceWriteback: false });
}

export function policySummaryV623(records: readonly NebulaLedgerRecordV623[], policy = MAINLINE_A_NEBULA_POLICY_V623) {
  const gates = records.map((record) => gateForRecordV623(record, policy));
  return Object.freeze({ policyFingerprint: policyFingerprintV623(policy), records: records.length, sourceReady: gates.filter((gate) => gate.source).length, transportReady: gates.filter((gate) => gate.transport).length, payloadReady: gates.filter((gate) => gate.payload).length, rightsReady: gates.filter((gate) => gate.rights).length, runtimeAdmitted: 0, scienceWriteback: false as const, allBoundariesClosed: gates.every((gate) => !gate.runtime && !gate.scienceWriteback) });
}

export function policyCsvV623(records: readonly NebulaLedgerRecordV623[], policy = MAINLINE_A_NEBULA_POLICY_V623): string {
  const rows = ["id,decision,source,transport,payload,rights,blockers"];
  for (const record of records) {
    const gate = gateForRecordV623(record, policy);
    rows.push([record.id, recordDecisionV623(record, policy), gate.source, gate.transport, gate.payload, gate.rights, recordPolicyIssuesV623(record, policy).join("|")].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","));
  }
  return `${rows.join("\n")}\n`;
}

export function policyJsonlV623(records: readonly NebulaLedgerRecordV623[], policy = MAINLINE_A_NEBULA_POLICY_V623): string {
  return `${records.map((record) => JSON.stringify({ id: record.id, decision: recordDecisionV623(record, policy), gate: gateForRecordV623(record, policy), issues: recordPolicyIssuesV623(record, policy) })).join("\n")}\n`;
}

export function sourceIdentityKeyV623(url: string): string {
  const parsed = parseUrlV623(url);
  if (!parsed) return "invalid";
  return `${parsed.hostname.toLocaleLowerCase()}${parsed.pathname}`;
}

export function sourceIdentityStableV623(previous: string, current: string): boolean {
  return sourceIdentityKeyV623(previous) === sourceIdentityKeyV623(current);
}

export function responseHeadersCanonicalV623(headers: Record<string, string | undefined>): Readonly<Record<string, string>> {
  const entries = Object.entries(headers).filter(([, value]) => value !== undefined).map(([key, value]) => [key.toLocaleLowerCase(), String(value).trim()] as const).sort(([left], [right]) => left.localeCompare(right));
  return Object.freeze(Object.fromEntries(entries));
}

export function responseHeaderFingerprintV623(headers: Record<string, string | undefined>): string {
  return createHash("sha256").update(JSON.stringify(responseHeadersCanonicalV623(headers)), "utf8").digest("hex");
}

export function requestFingerprintFromHeadersV623(url: string, headers: Record<string, string | undefined>): string {
  return createHash("sha256").update(JSON.stringify({ url, headers: responseHeadersCanonicalV623(headers) }), "utf8").digest("hex");
}

export function redirectChainLengthAllowedV623(chain: readonly string[]): boolean {
  return chain.length <= 8;
}

export function redirectChainUniqueV623(chain: readonly string[]): boolean {
  return new Set(chain.map(sourceIdentityKeyV623)).size === chain.length;
}

export function redirectChainTerminatesV623(chain: readonly string[], finalUrl: string | null): boolean {
  if (!finalUrl) return chain.length === 0;
  return !chain.includes(finalUrl) && redirectChainUniqueV623(chain);
}

export function redirectChainIssuesV623(chain: readonly string[], finalUrl: string | null, policy = MAINLINE_A_NEBULA_POLICY_V623): readonly string[] {
  const issues: string[] = [];
  if (!redirectChainLengthAllowedV623(chain)) issues.push("redirect-limit");
  if (!redirectChainUniqueV623(chain)) issues.push("redirect-loop");
  if (!redirectChainTerminatesV623(chain, finalUrl)) issues.push("redirect-not-terminated");
  if (!chain.every((url) => policyUrlAllowedV623(url, policy))) issues.push("redirect-policy");
  return Object.freeze(issues);
}

export function timeoutBudgetRemainingV623(startedAt: string, now = new Date(), policy = MAINLINE_A_NEBULA_POLICY_V623): number {
  const started = Date.parse(startedAt);
  if (!Number.isFinite(started)) return 0;
  return Math.max(0, policy.timeoutMs - (now.getTime() - started));
}

export function attemptWithinTimeoutV623(attempt: NebulaAttemptV623, policy = MAINLINE_A_NEBULA_POLICY_V623): boolean {
  const duration = Date.parse(attempt.endedAt) - Date.parse(attempt.startedAt);
  return Number.isFinite(duration) && duration >= 0 && duration <= policy.timeoutMs;
}

export function attemptTelemetryV623(attempt: NebulaAttemptV623, policy = MAINLINE_A_NEBULA_POLICY_V623) {
  return Object.freeze({ attempt: attempt.attempt, retryCount: attempt.retryCount, durationMs: Date.parse(attempt.endedAt) - Date.parse(attempt.startedAt), timeout: attempt.timeout, withinTimeout: attemptWithinTimeoutV623(attempt, policy), statusClass: responseStatusClassV623(attempt.httpStatus), response: responseStatusAllowedV623(attempt.httpStatus), contentType: attempt.contentType, contentTypeAllowed: contentTypeAllowedV623(attempt.contentType, policy), redirectCount: attempt.redirectChain.length, redirectIssues: redirectChainIssuesV623(attempt.redirectChain, attempt.finalUrl, policy), errorClass: attempt.errorClass });
}

export function recordTelemetryV623(record: NebulaLedgerRecordV623, policy = MAINLINE_A_NEBULA_POLICY_V623) {
  return Object.freeze({ id: record.id, sourceHost: parseUrlV623(record.sourceUrl)?.hostname ?? null, sourceIdentity: sourceIdentityKeyV623(record.sourceUrl), attempts: record.attempts.map((attempt) => attemptTelemetryV623(attempt, policy)), decision: recordDecisionV623(record, policy), gate: gateForRecordV623(record, policy), policyIssues: recordPolicyIssuesV623(record, policy) });
}

export function ledgerTelemetryV623(records: readonly NebulaLedgerRecordV623[], policy = MAINLINE_A_NEBULA_POLICY_V623) {
  return Object.freeze({ policyFingerprint: policyFingerprintV623(policy), records: records.map((record) => recordTelemetryV623(record, policy)), totals: policySummaryV623(records, policy) });
}

export function acquisitionReceiptV623(records: readonly NebulaLedgerRecordV623[], policy = MAINLINE_A_NEBULA_POLICY_V623) {
  const telemetry = ledgerTelemetryV623(records, policy);
  return Object.freeze({ schema: "mainline-a-nebula-acquisition-receipt-v623", generatedAt: new Date().toISOString(), fingerprint: createHash("sha256").update(JSON.stringify(telemetry), "utf8").digest("hex"), policyFingerprint: telemetry.policyFingerprint, records: records.length, responseCaptured: records.filter((record) => record.responseCaptured === 1).length, payloadPresent: records.filter((record) => record.payload.bytes !== null).length, rightsCleared: records.filter((record) => record.rightsStatus === "cleared").length, runtimeAdmitted: 0, scientificPayloadWriteback: false as const, evidenceBoundary: "candidate-only-hold-not-admitted" });
}

export function admissionReasonV623(record: NebulaLedgerRecordV623, policy = MAINLINE_A_NEBULA_POLICY_V623): string {
  const gate = gateForRecordV623(record, policy);
  if (!gate.source) return "source-policy-pending";
  if (!gate.transport) return "transport-attempt-pending";
  if (!gate.payload) return "raw-payload-pending";
  if (!gate.rights) return "rights-review-pending";
  return "eligible-for-independent-review";
}

export function nextActionV623(record: NebulaLedgerRecordV623, policy = MAINLINE_A_NEBULA_POLICY_V623): string {
  const decision = recordDecisionV623(record, policy);
  if (decision === "retry") return "等待退避后重试 HTTPS 请求";
  if (decision === "reject") return "修复来源或 payload 契约后重新审计";
  if (record.responseCaptured === 0) return "执行一次真实 HTTPS 采集并记录 raw artifact";
  if (record.rightsStatus !== "cleared") return "补齐逐图版权证据与人工 signoff";
  return "提交独立发布门禁审查";
}

export function acquisitionPanelStateV623(record: NebulaLedgerRecordV623, policy = MAINLINE_A_NEBULA_POLICY_V623) {
  const gate = gateForRecordV623(record, policy);
  return Object.freeze({ id: record.id, badge: record.responseCaptured === 1 ? "raw captured" : "raw pending", source: gate.source ? "source closed" : "source blocked", payload: gate.payload ? "payload verified" : "payload pending", rights: gate.rights ? "rights cleared" : "rights pending", runtime: "candidate-only", measurement: "not-admitted", science: "writeback false", nextAction: nextActionV623(record, policy) });
}

export function acquisitionPanelStatesV623(records: readonly NebulaLedgerRecordV623[], policy = MAINLINE_A_NEBULA_POLICY_V623) {
  return Object.freeze(records.map((record) => acquisitionPanelStateV623(record, policy)));
}

export function releaseGateV623(records: readonly NebulaLedgerRecordV623[], policy = MAINLINE_A_NEBULA_POLICY_V623) {
  const summary = policySummaryV623(records, policy);
  return Object.freeze({ passed: summary.records > 0 && summary.payloadReady === summary.records && summary.rightsReady === summary.records && summary.allBoundariesClosed, reason: summary.payloadReady === summary.records ? (summary.rightsReady === summary.records ? "ready-for-independent-signoff" : "rights-pending") : "payload-pending", summary });
}

export function policyIssueCountsV623(records: readonly NebulaLedgerRecordV623[], policy = MAINLINE_A_NEBULA_POLICY_V623): Readonly<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const record of records) {
    for (const issue of recordPolicyIssuesV623(record, policy)) counts[issue] = (counts[issue] ?? 0) + 1;
  }
  return Object.freeze(counts);
}

export function sourceHostInventoryV623(records: readonly NebulaLedgerRecordV623[]): readonly { host: string; ids: readonly string[] }[] {
  const map = new Map<string, string[]>();
  for (const record of records) {
    const host = parseUrlV623(record.sourceUrl)?.hostname.toLocaleLowerCase() ?? "invalid";
    const ids = map.get(host) ?? [];
    ids.push(record.id);
    map.set(host, ids);
  }
  return Object.freeze([...map.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([host, ids]) => Object.freeze({ host, ids: Object.freeze(ids.sort()) })));
}

export function sourceIdentityInventoryV623(records: readonly NebulaLedgerRecordV623[]): readonly { identity: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const record of records) {
    const identity = sourceIdentityKeyV623(record.sourceUrl);
    counts.set(identity, (counts.get(identity) ?? 0) + 1);
  }
  return Object.freeze([...counts.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([identity, count]) => Object.freeze({ identity, count })));
}

export function policyAuditReportV623(records: readonly NebulaLedgerRecordV623[], policy = MAINLINE_A_NEBULA_POLICY_V623) {
  const summary = policySummaryV623(records, policy);
  const gate = releaseGateV623(records, policy);
  return Object.freeze({ schema: "mainline-a-nebula-policy-audit-v623", policyFingerprint: policyFingerprintV623(policy), summary, releaseGate: gate, issueCounts: policyIssueCountsV623(records, policy), hosts: sourceHostInventoryV623(records), identities: sourceIdentityInventoryV623(records), panels: acquisitionPanelStatesV623(records, policy), boundary: { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false } as const });
}

export function policyAuditMarkdownV623(records: readonly NebulaLedgerRecordV623[], policy = MAINLINE_A_NEBULA_POLICY_V623): string {
  const report = policyAuditReportV623(records, policy);
  const lines = ["# Nebula V623 Acquisition Policy Audit", "", `- policy fingerprint: ${report.policyFingerprint}`, `- records: ${report.summary.records}`, `- source ready: ${report.summary.sourceReady}`, `- payload ready: ${report.summary.payloadReady}`, `- rights ready: ${report.summary.rightsReady}`, `- release gate: ${report.releaseGate.passed ? "passed" : "held"}`, "", "| id | decision | source | payload | rights | next action |", "| --- | --- | --- | --- | --- | --- |"];
  for (const panel of report.panels) lines.push(`| ${panel.id} | ${panel.badge} | ${panel.source} | ${panel.payload} | ${panel.rights} | ${panel.nextAction} |`);
  return `${lines.join("\n")}\n`;
}

export function policyDecisionLabelV623(decision: NebulaAcquisitionDecisionV623): string {
  if (decision === "allow") return "允许进入后续独立审查";
  if (decision === "retry") return "可按退避窗口重试";
  if (decision === "reject") return "拒绝并保留阻塞记录";
  return "保持 hold，等待外部证据";
}

export function policyBoundaryLabelsV623(): Readonly<{ runtime: string; measurement: string; science: string }> {
  return Object.freeze({ runtime: "candidate-only", measurement: "not-admitted", science: "scientificPayloadWriteback=false" });
}

export function policyRequiresExternalEvidenceV623(record: NebulaLedgerRecordV623, policy = MAINLINE_A_NEBULA_POLICY_V623): boolean {
  const gate = gateForRecordV623(record, policy);
  return !gate.source || !gate.payload || !gate.rights;
}

export function policyEvidenceClassV623(record: NebulaLedgerRecordV623, policy = MAINLINE_A_NEBULA_POLICY_V623): "static-ledger" | "external-raw" | "rights-review" | "release-ready" {
  const gate = gateForRecordV623(record, policy);
  if (!gate.source || !gate.transport) return "static-ledger";
  if (!gate.payload) return "external-raw";
  if (!gate.rights) return "rights-review";
  return "release-ready";
}

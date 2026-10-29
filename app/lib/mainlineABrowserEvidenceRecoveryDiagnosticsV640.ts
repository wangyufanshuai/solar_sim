import { sha256Utf8HexV566 } from "./sha256BrowserV566";
import {
  BROWSER_EVIDENCE_RECOVERY_SCHEMA_V640,
  BROWSER_EVIDENCE_RECOVERY_MAX_OUTPUT_BYTES_V640,
  recoveryCandidateDigestV640,
  type BrowserEvidenceRecoveryCandidateV640,
  type BrowserEvidenceRecoveryConflictV640,
  type BrowserEvidenceRecoveryPlanV640,
  type BrowserEvidenceRecoveryReportV640,
} from "./mainlineABrowserEvidenceRecoveryV640";
import {
  compareBrowserEvidenceBuildV639,
  validateBrowserEvidenceSessionV639,
  type BrowserEvidenceEventV639,
  type BrowserEvidenceRecordV639,
  type BrowserEvidenceSessionV639,
} from "./mainlineABrowserEvidenceSessionV639";

export const BROWSER_EVIDENCE_RECOVERY_DIAGNOSTICS_SCHEMA_V640 = "mainline-a-browser-evidence-recovery-diagnostics-v640" as const;
export const BROWSER_EVIDENCE_RECOVERY_INDEX_MAX_ROWS_V640 = 64;
export const BROWSER_EVIDENCE_RECOVERY_INDEX_MAX_BYTES_V640 = BROWSER_EVIDENCE_RECOVERY_MAX_OUTPUT_BYTES_V640;

type Row = Record<string, unknown>;
const isRow = (value: unknown): value is Row => Boolean(value && typeof value === "object" && !Array.isArray(value));
const json = (value: unknown): string => JSON.stringify(value);
const pretty = (value: unknown): string => JSON.stringify(value, null, 2);
const bytes = (value: string): number => new TextEncoder().encode(value).byteLength;
const digest = (value: string): string => sha256Utf8HexV566(value);
const unique = (values: readonly string[]): string[] => [...new Set(values)];

export type BrowserEvidenceRecoveryDiffV640 = Readonly<{
  equal: boolean;
  build: { equal: boolean; left: string; right: string };
  manifest: { equal: boolean; left: string; right: string };
  boundary: { equal: boolean; issues: readonly string[] };
  records: { left: number; right: number; added: readonly string[]; removed: readonly string[]; changed: readonly string[] };
  events: { left: number; right: number; added: readonly string[]; removed: readonly string[] };
  issues: readonly string[];
}>;

export type BrowserEvidenceRecoveryIndexRowV640 = Readonly<{
  source: string;
  candidateStatus: string;
  candidateDigest: string;
  rawSha256: string | null;
  bytes: number;
  sessionId: string | null;
  buildId: string | null;
  updatedAt: string | null;
  recordCount: number;
  eventCount: number;
  measuredRecords: number;
  blockedRecords: number;
  targetKeys: readonly string[];
  issues: readonly string[];
}>;

export type BrowserEvidenceRecoveryIndexV640 = Readonly<{
  schema: typeof BROWSER_EVIDENCE_RECOVERY_DIAGNOSTICS_SCHEMA_V640;
  generatedAt: string;
  recoverySchema: typeof BROWSER_EVIDENCE_RECOVERY_SCHEMA_V640;
  expectedBuild: { buildId: string; branch: string; head: string };
  planAction: BrowserEvidenceRecoveryPlanV640["action"];
  rows: readonly BrowserEvidenceRecoveryIndexRowV640[];
  conflicts: readonly BrowserEvidenceRecoveryConflictV640[];
  boundary: { candidateOnly: true; hold: true; notAdmitted: true; scientificPayloadWriteback: false; rightsApproval: false; sourceAuthenticityProven: false };
  evidenceClass: "offline-recovery-index";
}>;

export type BrowserEvidenceRecoveryDiagnosticsV640 = Readonly<{
  schema: typeof BROWSER_EVIDENCE_RECOVERY_DIAGNOSTICS_SCHEMA_V640;
  status: "pass" | "partial" | "blocked";
  issues: readonly string[];
  planAction: BrowserEvidenceRecoveryPlanV640["action"];
  candidateCounts: Record<string, number>;
  latestKeys: readonly string[];
  mergeable: boolean;
  indexDigest: string;
  boundary: BrowserEvidenceRecoveryIndexV640["boundary"];
}>;

function recordMap(session: BrowserEvidenceSessionV639 | null): Map<string, BrowserEvidenceRecordV639> {
  const map = new Map<string, BrowserEvidenceRecordV639>();
  session?.records.forEach((record) => map.set(record.runId, record));
  return map;
}

function eventMap(session: BrowserEvidenceSessionV639 | null): Map<string, BrowserEvidenceEventV639> {
  const map = new Map<string, BrowserEvidenceEventV639>();
  session?.events.forEach((event) => map.set(`${event.at}|${event.type}|${event.runId ?? "none"}|${event.targetKey ?? "none"}`, event));
  return map;
}

export function diffBrowserEvidenceSessionsV640(
  left: BrowserEvidenceSessionV639 | null,
  right: BrowserEvidenceSessionV639 | null,
): BrowserEvidenceRecoveryDiffV640 {
  const issues: string[] = [];
  if (left && !validateBrowserEvidenceSessionV639(left).valid) issues.push("diagnostics:left-invalid");
  if (right && !validateBrowserEvidenceSessionV639(right).valid) issues.push("diagnostics:right-invalid");
  const leftBuild = left ? `${left.build.buildId}|${left.build.head}` : "missing";
  const rightBuild = right ? `${right.build.buildId}|${right.build.head}` : "missing";
  const buildEqual = Boolean(left && right && compareBrowserEvidenceBuildV639(left.build, right.build));
  if (!buildEqual) issues.push("diagnostics:build");
  const leftManifest = left?.manifestDigest ?? "missing";
  const rightManifest = right?.manifestDigest ?? "missing";
  const manifestEqual = leftManifest === rightManifest;
  if (!manifestEqual) issues.push("diagnostics:manifest");
  const boundaryIssues: string[] = [];
  if (left && right && json(left.boundary) !== json(right.boundary)) boundaryIssues.push("boundary-different");
  if (left?.sourceAuthenticityProven !== false || right?.sourceAuthenticityProven !== false) boundaryIssues.push("authenticity-marker");
  if (left?.boundary.scientificPayloadWriteback !== false || right?.boundary.scientificPayloadWriteback !== false) boundaryIssues.push("payload-writeback-marker");
  const leftRecords = recordMap(left);
  const rightRecords = recordMap(right);
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];
  for (const [key, record] of rightRecords) {
    const previous = leftRecords.get(key);
    if (!previous) added.push(key);
    else if (previous.rawSha256 !== record.rawSha256 || previous.status !== record.status || json(previous.issues) !== json(record.issues)) changed.push(key);
  }
  for (const key of leftRecords.keys()) if (!rightRecords.has(key)) removed.push(key);
  if (changed.length) issues.push("diagnostics:record-change");
  const leftEvents = eventMap(left);
  const rightEvents = eventMap(right);
  const addedEvents = [...rightEvents.keys()].filter((key) => !leftEvents.has(key));
  const removedEvents = [...leftEvents.keys()].filter((key) => !rightEvents.has(key));
  const recordsEqual = !added.length && !removed.length && !changed.length;
  const eventsEqual = !addedEvents.length && !removedEvents.length;
  const boundaryEqual = !boundaryIssues.length;
  if (!boundaryEqual) issues.push("diagnostics:boundary");
  return Object.freeze({
    equal: Boolean(left && right && buildEqual && manifestEqual && boundaryEqual && recordsEqual && eventsEqual),
    build: { equal: buildEqual, left: leftBuild, right: rightBuild },
    manifest: { equal: manifestEqual, left: leftManifest, right: rightManifest },
    boundary: { equal: boundaryEqual, issues: Object.freeze(boundaryIssues) },
    records: { left: leftRecords.size, right: rightRecords.size, added: Object.freeze(added.sort()), removed: Object.freeze(removed.sort()), changed: Object.freeze(changed.sort()) },
    events: { left: leftEvents.size, right: rightEvents.size, added: Object.freeze(addedEvents.sort()), removed: Object.freeze(removedEvents.sort()) },
    issues: Object.freeze(unique(issues)),
  });
}

function indexRow(candidate: BrowserEvidenceRecoveryCandidateV640): BrowserEvidenceRecoveryIndexRowV640 {
  const records = candidate.session?.records ?? [];
  const latest = new Map<string, BrowserEvidenceRecordV639>();
  records.forEach((record) => { if (record.targetKey) latest.set(record.targetKey, record); });
  return Object.freeze({
    source: candidate.source,
    candidateStatus: candidate.status,
    candidateDigest: recoveryCandidateDigestV640(candidate),
    rawSha256: candidate.sha256,
    bytes: candidate.bytes,
    sessionId: candidate.sessionId,
    buildId: candidate.build?.buildId ?? null,
    updatedAt: candidate.updatedAt,
    recordCount: records.length,
    eventCount: candidate.session?.events.length ?? 0,
    measuredRecords: records.filter((record) => record.status === "measured-local").length,
    blockedRecords: records.filter((record) => record.status === "blocked").length,
    targetKeys: Object.freeze([...latest.keys()].sort()),
    issues: Object.freeze([...candidate.validationIssues]),
  });
}

export function buildBrowserEvidenceRecoveryIndexV640(
  plan: BrowserEvidenceRecoveryPlanV640,
  generatedAt = plan.generatedAt,
): BrowserEvidenceRecoveryIndexV640 {
  if (plan.candidates.length > BROWSER_EVIDENCE_RECOVERY_INDEX_MAX_ROWS_V640) throw new Error("diagnostics:index-limit");
  const rows = plan.candidates.map(indexRow);
  return Object.freeze({
    schema: BROWSER_EVIDENCE_RECOVERY_DIAGNOSTICS_SCHEMA_V640,
    generatedAt,
    recoverySchema: BROWSER_EVIDENCE_RECOVERY_SCHEMA_V640,
    expectedBuild: { ...plan.expectedBuild },
    planAction: plan.action,
    rows: Object.freeze(rows),
    conflicts: Object.freeze([...plan.conflicts]),
    boundary: recoveryDiagnosticsBoundaryV640(),
    evidenceClass: "offline-recovery-index",
  });
}

export function encodeBrowserEvidenceRecoveryIndexV640(index: BrowserEvidenceRecoveryIndexV640): string {
  const encoded = pretty(index);
  if (bytes(encoded) > BROWSER_EVIDENCE_RECOVERY_INDEX_MAX_BYTES_V640) throw new Error("diagnostics:index-size");
  return encoded;
}

export function verifyBrowserEvidenceRecoveryIndexV640(index: unknown): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const row = isRow(index) ? index : null;
  const itemBoundary = isRow(row?.boundary) ? row.boundary : null;
  const itemRows = row?.rows;
  if (row?.schema !== BROWSER_EVIDENCE_RECOVERY_DIAGNOSTICS_SCHEMA_V640) issues.push("index:schema");
  if (row?.recoverySchema !== BROWSER_EVIDENCE_RECOVERY_SCHEMA_V640) issues.push("index:recovery-schema");
  if (!itemBoundary || itemBoundary.candidateOnly !== true || itemBoundary.hold !== true || itemBoundary.notAdmitted !== true || itemBoundary.scientificPayloadWriteback !== false || itemBoundary.rightsApproval !== false || itemBoundary.sourceAuthenticityProven !== false) issues.push("index:boundary");
  if (!Array.isArray(itemRows) || itemRows.length > BROWSER_EVIDENCE_RECOVERY_INDEX_MAX_ROWS_V640) issues.push("index:rows");
  if (Array.isArray(itemRows)) {
    const sources = new Set<string>();
    for (const [position, item] of itemRows.entries()) {
      if (!isRow(item)) { issues.push(`index:row:${position}`); continue; }
      if (typeof item.source !== "string" || !item.source || sources.has(item.source)) issues.push(`index:source:${position}`);
      sources.add(String(item.source));
      if (typeof item.candidateDigest !== "string" || !/^[a-f0-9]{64}$/u.test(item.candidateDigest)) issues.push(`index:digest:${position}`);
      if (typeof item.bytes !== "number" || !Number.isSafeInteger(item.bytes) || item.bytes < 0) issues.push(`index:bytes:${position}`);
      if (!Array.isArray(item.targetKeys) || item.targetKeys.some((key) => typeof key !== "string")) issues.push(`index:targets:${position}`);
    }
  }
  return { valid: issues.length === 0, issues: unique(issues) };
}

export function diagnoseBrowserEvidenceRecoveryV640(
  plan: BrowserEvidenceRecoveryPlanV640,
  report: BrowserEvidenceRecoveryReportV640 | null,
): BrowserEvidenceRecoveryDiagnosticsV640 {
  const issues: string[] = [];
  const candidateCounts: Record<string, number> = {};
  for (const candidate of plan.candidates) candidateCounts[candidate.status] = (candidateCounts[candidate.status] ?? 0) + 1;
  const index = buildBrowserEvidenceRecoveryIndexV640(plan);
  const encodedIndex = encodeBrowserEvidenceRecoveryIndexV640(index);
  const indexDigest = digest(encodedIndex);
  const latestKeys = report?.merged.latestKeys ?? [];
  if (report && report.action === "blocked" && !plan.conflicts.length && !report.conflicts.length) issues.push("diagnostics:blocked-without-conflict");
  if (report && report.merged.status === "created" && !report.verification.valid) issues.push("diagnostics:merged-unverified");
  if (plan.action === "merge" && plan.usable.length < 2) issues.push("diagnostics:merge-without-two");
  if (plan.action === "restore" && plan.usable.length !== 1) issues.push("diagnostics:restore-cardinality");
  if (plan.boundary.scientificPayloadWriteback || plan.boundary.rightsApproval) issues.push("diagnostics:plan-boundary");
  const mergeable = !plan.conflicts.length && (plan.action === "restore" || plan.action === "merge");
  if (!mergeable && plan.action !== "blocked" && plan.action !== "none") issues.push("diagnostics:action");
  const status = issues.length ? "blocked" : report?.merged.status === "created" ? "pass" : "partial";
  return Object.freeze({ schema: BROWSER_EVIDENCE_RECOVERY_DIAGNOSTICS_SCHEMA_V640, status, issues: Object.freeze(unique(issues)), planAction: plan.action, candidateCounts, latestKeys: Object.freeze([...latestKeys]), mergeable, indexDigest, boundary: index.boundary });
}

export function recoveryIndexMarkdownV640(index: BrowserEvidenceRecoveryIndexV640): string {
  const lines = [
    `# Mainline A V640 recovery index`,
    `- action: ${index.planAction}`,
    `- build: ${index.expectedBuild.buildId}`,
    `- evidence: offline-recovery-index`,
    `- boundary: candidate-only / hold / not-admitted / scientificPayloadWriteback=false`,
    "",
    "| source | status | bytes | records | events | measured | blocked | targets | sha256 |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---|",
  ];
  for (const row of index.rows) lines.push(`| ${row.source.replaceAll("|", "\\|")} | ${row.candidateStatus} | ${row.bytes} | ${row.recordCount} | ${row.eventCount} | ${row.measuredRecords} | ${row.blockedRecords} | ${row.targetKeys.length} | ${row.rawSha256 ?? "—"} |`);
  if (index.conflicts.length) {
    lines.push("", "## conflicts");
    for (const conflict of index.conflicts) lines.push(`- ${conflict.kind}: ${conflict.key} · ${conflict.detail}`);
  }
  return `${lines.join("\n")}\n`;
}

export function recoveryDiffSummaryV640(diff: BrowserEvidenceRecoveryDiffV640): string {
  return `${diff.equal ? "equal" : "different"} · records ${diff.records.left}/${diff.records.right} · +${diff.records.added.length}/-${diff.records.removed.length}/~${diff.records.changed.length} · events ${diff.events.left}/${diff.events.right} · ${diff.issues.length} issues`;
}

export function recoveryDiagnosticsBoundaryV640(): BrowserEvidenceRecoveryIndexV640["boundary"] {
  return { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false, rightsApproval: false, sourceAuthenticityProven: false };
}

export function recoveryIndexCsvV640(index: BrowserEvidenceRecoveryIndexV640): string {
  const quote = (value: string | number | null): string => {
    const textValue = value === null ? "" : String(value);
    return /[",\n]/u.test(textValue) ? `"${textValue.replaceAll('"', '""')}"` : textValue;
  };
  const header = ["source", "status", "bytes", "sha256", "sessionId", "buildId", "updatedAt", "records", "events", "measured", "blocked", "targetKeys", "issues"];
  const rows = index.rows.map((row) => [row.source, row.candidateStatus, row.bytes, row.rawSha256, row.sessionId, row.buildId, row.updatedAt, row.recordCount, row.eventCount, row.measuredRecords, row.blockedRecords, row.targetKeys.join(";"), row.issues.join(";")]);
  return [header, ...rows].map((row) => row.map((value) => quote(value as string | number | null)).join(",")).join("\n") + "\n";
}

export function recoveryIndexDigestV640(index: BrowserEvidenceRecoveryIndexV640): string {
  return digest(encodeBrowserEvidenceRecoveryIndexV640(index));
}

export function recoveryPlanCandidateStatusCountsV640(plan: BrowserEvidenceRecoveryPlanV640): Record<string, number> {
  const counts: Record<string, number> = {};
  plan.candidates.forEach((candidate) => { counts[candidate.status] = (counts[candidate.status] ?? 0) + 1; });
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

export function recoveryPlanHasOnlyExpectedBuildV640(plan: BrowserEvidenceRecoveryPlanV640): boolean {
  return plan.candidates.every((candidate) => candidate.build === null || compareBrowserEvidenceBuildV639(candidate.build, plan.expectedBuild));
}

export function recoveryReportTargetCoverageV640(report: BrowserEvidenceRecoveryReportV640 | null): {
  observed: number;
  expected: 36;
  missing: number;
  blockedLatest: number;
} {
  const observed = report?.merged.latestKeys.length ?? 0;
  return { observed, expected: 36, missing: Math.max(0, 36 - observed), blockedLatest: report?.merged.blockedLatest ?? 0 };
}

export function recoveryReportClaimsV640(report: BrowserEvidenceRecoveryReportV640 | null): {
  browserAuthenticity: false;
  productionPerformance: false;
  scientificValidity: false;
  rightsApproval: false;
  payloadWriteback: false;
} {
  void report;
  return { browserAuthenticity: false, productionPerformance: false, scientificValidity: false, rightsApproval: false, payloadWriteback: false };
}

export function recoveryCandidateTableV640(candidates: readonly BrowserEvidenceRecoveryCandidateV640[]): readonly {
  source: string;
  status: string;
  bytes: number;
  sha256: string | null;
  runCount: number;
  blocked: number;
  keyCount: number;
}[] {
  return Object.freeze(candidates.map((candidate) => {
    const records = candidate.session?.records ?? [];
    return Object.freeze({ source: candidate.source, status: candidate.status, bytes: candidate.bytes, sha256: candidate.sha256, runCount: records.length, blocked: records.filter((record) => record.status === "blocked").length, keyCount: new Set(records.flatMap((record) => record.targetKey ? [record.targetKey] : [])).size });
  }));
}

export function recoveryConflictKeysV640(conflicts: readonly BrowserEvidenceRecoveryConflictV640[]): readonly string[] {
  return Object.freeze(unique(conflicts.map((conflict) => `${conflict.kind}:${conflict.key}`).sort()));
}

export function recoverySessionRawDigestsV640(session: BrowserEvidenceSessionV639 | null): readonly string[] {
  if (!session) return Object.freeze([]);
  return Object.freeze(unique(session.records.map((record) => record.rawSha256)).sort());
}

export function recoveryIndexRowsForStatusV640(index: BrowserEvidenceRecoveryIndexV640, status: string): readonly BrowserEvidenceRecoveryIndexRowV640[] {
  return Object.freeze(index.rows.filter((row) => row.candidateStatus === status));
}

export function recoveryReportStableFingerprintV640(report: BrowserEvidenceRecoveryReportV640): string {
  return digest(`${report.schema}|${report.action}|${report.planDigest}|${report.expectedBuild.buildId}|${report.expectedBuild.head}|${report.merged.records}|${report.merged.events}|${report.merged.blockedLatest}`);
}

export function recoveryIndexStatusSummaryV640(index: BrowserEvidenceRecoveryIndexV640): string {
  const counts = new Map<string, number>();
  index.rows.forEach((row) => counts.set(row.candidateStatus, (counts.get(row.candidateStatus) ?? 0) + 1));
  return [...counts.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([status, count]) => `${status}:${count}`).join(" · ");
}

export function recoveryIndexHasRawBytesV640(index: BrowserEvidenceRecoveryIndexV640): boolean {
  return index.rows.some((row) => row.bytes > 0 && typeof row.rawSha256 === "string");
}

export function recoveryDiagnosticsEvidenceClassV640(): "offline-recovery-index" { return "offline-recovery-index"; }

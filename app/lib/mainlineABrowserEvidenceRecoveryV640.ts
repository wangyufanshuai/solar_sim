import { sha256Utf8HexV566 } from "./sha256BrowserV566";
import {
  BROWSER_EVIDENCE_SESSION_MAX_BYTES_V639,
  browserEvidenceSessionBatchV639,
  browserEvidenceSessionStorageKeyV639,
  compareBrowserEvidenceBuildV639,
  decodeBrowserEvidenceSessionV639,
  encodeBrowserEvidenceSessionV639,
  validateBrowserEvidenceSessionV639,
  type BrowserEvidenceBuildV639,
  type BrowserEvidenceEventV639,
  type BrowserEvidenceRecordV639,
  type BrowserEvidenceSessionV639,
} from "./mainlineABrowserEvidenceSessionV639";

/**
 * V640 is the offline recovery layer for the V639 browser ledger.
 *
 * Browser storage is useful for continuing an observation, but it is not an
 * authority. A browser can close while a write is in flight, two tabs can
 * observe the same build, and a later build must never inherit an earlier
 * observation. V640 therefore treats every input as an untrusted byte string,
 * validates it against the build identity, and reports a merge plan before it
 * creates a new ledger. It keeps failed attempts and never writes science or
 * runtime admission fields.
 */
export const BROWSER_EVIDENCE_RECOVERY_SCHEMA_V640 = "mainline-a-browser-evidence-recovery-v640" as const;
export const BROWSER_EVIDENCE_RECOVERY_MAX_CANDIDATES_V640 = 32;
export const BROWSER_EVIDENCE_RECOVERY_MAX_INPUT_BYTES_V640 = BROWSER_EVIDENCE_SESSION_MAX_BYTES_V639;
export const BROWSER_EVIDENCE_RECOVERY_MAX_OUTPUT_BYTES_V640 = 20 * 1024 * 1024;
export const BROWSER_EVIDENCE_RECOVERY_MAX_EVENTS_V640 = 512;

type Row = Record<string, unknown>;
type RecoveryStatusV640 = "valid" | "missing" | "empty" | "invalid" | "wrong-build" | "oversize" | "conflict";

export type BrowserEvidenceRecoveryInputV640 = Readonly<{
  source: string;
  raw: string | null;
}>;

export type BrowserEvidenceRecoveryCandidateV640 = Readonly<{
  source: string;
  status: RecoveryStatusV640;
  bytes: number;
  sha256: string | null;
  sessionId: string | null;
  build: BrowserEvidenceBuildV639 | null;
  updatedAt: string | null;
  validationIssues: readonly string[];
  session: BrowserEvidenceSessionV639 | null;
}>;

export type BrowserEvidenceRecoveryConflictV640 = Readonly<{
  kind: "run-bytes" | "event-order" | "session-identity" | "build" | "manifest" | "boundary";
  key: string;
  sources: readonly string[];
  detail: string;
}>;

export type BrowserEvidenceRecoveryPlanV640 = Readonly<{
  schema: typeof BROWSER_EVIDENCE_RECOVERY_SCHEMA_V640;
  generatedAt: string;
  expectedBuild: BrowserEvidenceBuildV639;
  expectedStorageKey: string;
  candidates: readonly BrowserEvidenceRecoveryCandidateV640[];
  usable: readonly string[];
  ignored: readonly string[];
  conflicts: readonly BrowserEvidenceRecoveryConflictV640[];
  recommendedSource: string | null;
  action: "restore" | "merge" | "export-only" | "blocked" | "none";
  reasons: readonly string[];
  boundary: BrowserEvidenceRecoveryBoundaryV640;
}>;

export type BrowserEvidenceRecoveryBoundaryV640 = Readonly<{
  candidateOnly: true;
  hold: true;
  notAdmitted: true;
  scientificPayloadWriteback: false;
  rightsApproval: false;
  sourceAuthenticityProven: false;
}>;

export type BrowserEvidenceRecoveryReportV640 = Readonly<{
  schema: typeof BROWSER_EVIDENCE_RECOVERY_SCHEMA_V640;
  generatedAt: string;
  action: BrowserEvidenceRecoveryPlanV640["action"];
  planDigest: string;
  expectedBuild: BrowserEvidenceBuildV639;
  sources: readonly {
    source: string;
    status: RecoveryStatusV640;
    bytes: number;
    sha256: string | null;
    sessionId: string | null;
    records: number;
    events: number;
    issues: readonly string[];
  }[];
  merged: {
    status: "not-created" | "created" | "blocked";
    session: BrowserEvidenceSessionV639 | null;
    records: number;
    events: number;
    latestKeys: readonly string[];
    blockedLatest: number;
  };
  conflicts: readonly BrowserEvidenceRecoveryConflictV640[];
  verification: {
    encodedBytes: number | null;
    encodedSha256: string | null;
    valid: boolean;
    issues: readonly string[];
  };
  boundary: BrowserEvidenceRecoveryBoundaryV640;
  limits: {
    browserAuthenticity: false;
    productionPerformance: false;
    physicalMobile: "not-run";
    scientificValidity: false;
    rightsApproval: false;
  };
}>;

const boundary = (): BrowserEvidenceRecoveryBoundaryV640 => ({
  candidateOnly: true,
  hold: true,
  notAdmitted: true,
  scientificPayloadWriteback: false,
  rightsApproval: false,
  sourceAuthenticityProven: false,
});

const isRow = (value: unknown): value is Row => Boolean(value && typeof value === "object" && !Array.isArray(value));
const utf8Bytes = (value: string): number => new TextEncoder().encode(value).byteLength;
const digest = (value: string): string => sha256Utf8HexV566(value);
const text = (value: unknown): value is string => typeof value === "string" && value.length > 0 && !/\u0000/u.test(value);
const timestamp = (value: unknown): value is string => typeof value === "string"
  && /^\d{4}-\d{2}-\d{2}T/u.test(value) && Number.isFinite(Date.parse(value));
const unique = (values: readonly string[]): string[] => [...new Set(values)];
const safeJson = (value: unknown): string => JSON.stringify(value);
const stableSort = <T>(values: readonly T[], compare: (left: T, right: T) => number): T[] => [...values].sort(compare);

function buildFromUnknown(value: unknown): BrowserEvidenceBuildV639 | null {
  if (!isRow(value) || typeof value.buildId !== "string" || typeof value.branch !== "string" || typeof value.head !== "string") return null;
  return { buildId: value.buildId, branch: value.branch, head: value.head };
}

function emptyCandidate(source: string, status: RecoveryStatusV640, issue: string, bytes = 0): BrowserEvidenceRecoveryCandidateV640 {
  return Object.freeze({ source, status, bytes, sha256: null, sessionId: null, build: null, updatedAt: null, validationIssues: [issue], session: null });
}

function validateInputName(source: string): void {
  if (!text(source) || source.length > 1024 || /[\u0000\r\n]/u.test(source)) throw new Error("recovery:source-name");
}

export function inspectBrowserEvidenceRecoveryCandidateV640(
  input: BrowserEvidenceRecoveryInputV640,
  expectedBuild: BrowserEvidenceBuildV639,
): BrowserEvidenceRecoveryCandidateV640 {
  validateInputName(input.source);
  if (!compareBrowserEvidenceBuildV639(expectedBuild, expectedBuild)) return emptyCandidate(input.source, "wrong-build", "recovery:expected-build");
  if (input.raw === null) return emptyCandidate(input.source, "missing", "recovery:missing");
  if (!text(input.raw)) return emptyCandidate(input.source, "empty", "recovery:empty");
  const bytes = utf8Bytes(input.raw);
  const sha256 = digest(input.raw);
  if (bytes > BROWSER_EVIDENCE_RECOVERY_MAX_INPUT_BYTES_V640) return Object.freeze({ ...emptyCandidate(input.source, "oversize", "recovery:oversize", bytes), sha256 });
  let parsed: unknown;
  try { parsed = JSON.parse(input.raw); } catch { return Object.freeze({ ...emptyCandidate(input.source, "invalid", "recovery:json", bytes), sha256 }); }
  const validation = validateBrowserEvidenceSessionV639(parsed);
  const sessionRow = isRow(parsed) ? parsed : null;
  const sessionBuild = buildFromUnknown(sessionRow?.build);
  const sessionId = sessionRow && typeof sessionRow.sessionId === "string" ? sessionRow.sessionId : null;
  const updatedAt = sessionRow && timestamp(sessionRow.updatedAt) ? sessionRow.updatedAt : null;
  const issues = validation.issues.map((issue) => `${issue.code}${issue.recordIndex === undefined ? "" : `:${issue.recordIndex}`}${issue.eventIndex === undefined ? "" : `:${issue.eventIndex}`}`);
  if (!validation.valid) return Object.freeze({ source: input.source, status: "invalid", bytes, sha256, sessionId, build: sessionBuild, updatedAt, validationIssues: issues, session: null });
  if (!sessionBuild || !compareBrowserEvidenceBuildV639(sessionBuild, expectedBuild)) return Object.freeze({ source: input.source, status: "wrong-build", bytes, sha256, sessionId, build: sessionBuild, updatedAt, validationIssues: ["recovery:build-mismatch"], session: null });
  try {
    const session = decodeBrowserEvidenceSessionV639(input.raw, expectedBuild);
    return Object.freeze({ source: input.source, status: "valid", bytes, sha256, sessionId: session.sessionId, build: session.build, updatedAt: session.updatedAt, validationIssues: [], session });
  } catch (error) {
    return Object.freeze({ source: input.source, status: "invalid", bytes, sha256, sessionId, build: sessionBuild, updatedAt, validationIssues: [error instanceof Error ? error.message : String(error)], session: null });
  }
}

function candidateIdentity(candidate: BrowserEvidenceRecoveryCandidateV640): string {
  return candidate.sessionId && candidate.build ? `${candidate.sessionId}|${candidate.build.buildId}|${candidate.build.head}` : candidate.source;
}

function compareCandidates(left: BrowserEvidenceRecoveryCandidateV640, right: BrowserEvidenceRecoveryCandidateV640): number {
  const leftTime = left.updatedAt ? Date.parse(left.updatedAt) : -1;
  const rightTime = right.updatedAt ? Date.parse(right.updatedAt) : -1;
  if (leftTime !== rightTime) return rightTime - leftTime;
  if (left.bytes !== right.bytes) return right.bytes - left.bytes;
  return left.source.localeCompare(right.source);
}

export function collectBrowserEvidenceRecoveryCandidatesV640(
  inputs: readonly BrowserEvidenceRecoveryInputV640[],
  expectedBuild: BrowserEvidenceBuildV639,
): BrowserEvidenceRecoveryCandidateV640[] {
  if (inputs.length > BROWSER_EVIDENCE_RECOVERY_MAX_CANDIDATES_V640) throw new Error("recovery:candidate-limit");
  const seen = new Set<string>();
  return inputs.map((input) => {
    validateInputName(input.source);
    if (seen.has(input.source)) return emptyCandidate(input.source, "conflict", "recovery:duplicate-source");
    seen.add(input.source);
    return inspectBrowserEvidenceRecoveryCandidateV640(input, expectedBuild);
  });
}

function usableCandidates(candidates: readonly BrowserEvidenceRecoveryCandidateV640[]): BrowserEvidenceRecoveryCandidateV640[] {
  return stableSort(candidates.filter((candidate) => candidate.status === "valid" && candidate.session !== null), compareCandidates);
}

function sameSessionIdentity(left: BrowserEvidenceSessionV639, right: BrowserEvidenceSessionV639): boolean {
  return left.sessionId === right.sessionId && compareBrowserEvidenceBuildV639(left.build, right.build)
    && left.manifestDigest === right.manifestDigest;
}

function recordKey(record: BrowserEvidenceRecordV639): string {
  return `${record.runId}|${record.targetKey ?? "none"}`;
}

function eventKey(event: BrowserEvidenceEventV639): string {
  return `${event.at}|${event.type}|${event.runId ?? "none"}|${event.targetKey ?? "none"}|${event.detail ?? "none"}`;
}

function mergeRecordSets(
  candidates: readonly BrowserEvidenceRecoveryCandidateV640[],
): { records: BrowserEvidenceRecordV639[]; conflicts: BrowserEvidenceRecoveryConflictV640[] } {
  const records = new Map<string, { record: BrowserEvidenceRecordV639; source: string }>();
  const conflicts: BrowserEvidenceRecoveryConflictV640[] = [];
  for (const candidate of candidates) {
    if (!candidate.session) continue;
    for (const record of candidate.session.records) {
      const key = recordKey(record);
      const previous = records.get(key);
      if (!previous) { records.set(key, { record, source: candidate.source }); continue; }
      if (previous.record.rawSha256 !== record.rawSha256 || previous.record.rawJson !== record.rawJson) {
        conflicts.push({ kind: "run-bytes", key, sources: [previous.source, candidate.source], detail: "same run key has different retained raw bytes" });
        continue;
      }
      if (record.endedAt && (!previous.record.endedAt || Date.parse(record.endedAt) > Date.parse(previous.record.endedAt))) records.set(key, { record, source: candidate.source });
    }
  }
  const ordered = stableSort([...records.values()].map((entry) => entry.record), (left, right) => {
    const leftTime = left.endedAt ? Date.parse(left.endedAt) : -1;
    const rightTime = right.endedAt ? Date.parse(right.endedAt) : -1;
    if (leftTime !== rightTime) return leftTime - rightTime;
    return left.runId.localeCompare(right.runId);
  });
  return { records: ordered, conflicts };
}

function mergeEventSets(
  candidates: readonly BrowserEvidenceRecoveryCandidateV640[],
): { events: BrowserEvidenceEventV639[]; conflicts: BrowserEvidenceRecoveryConflictV640[] } {
  const events = new Map<string, { event: BrowserEvidenceEventV639; source: string }>();
  const conflicts: BrowserEvidenceRecoveryConflictV640[] = [];
  for (const candidate of candidates) {
    if (!candidate.session) continue;
    for (const event of candidate.session.events) {
      const key = eventKey(event);
      if (!events.has(key)) events.set(key, { event, source: candidate.source });
    }
  }
  const ordered = stableSort([...events.values()].map((entry) => entry.event), (left, right) => {
    const time = Date.parse(left.at) - Date.parse(right.at);
    if (time !== 0) return time;
    return eventKey(left).localeCompare(eventKey(right));
  });
  if (ordered.length > BROWSER_EVIDENCE_RECOVERY_MAX_EVENTS_V640) conflicts.push({ kind: "event-order", key: "events", sources: candidates.map((candidate) => candidate.source), detail: "merged event count exceeds recovery limit" });
  return { events: ordered.slice(-BROWSER_EVIDENCE_RECOVERY_MAX_EVENTS_V640), conflicts };
}

function statusForMergedRecords(records: readonly BrowserEvidenceRecordV639[]): BrowserEvidenceSessionV639["status"] {
  if (!records.length) return "open";
  const latest = new Map<string, BrowserEvidenceRecordV639>();
  records.forEach((record) => { if (record.targetKey) latest.set(record.targetKey, record); });
  if ([...latest.values()].some((record) => record.status === "blocked")) return "blocked";
  if (latest.size === 36 && [...latest.values()].every((record) => record.status === "measured-local")) return "complete-local";
  return "partial";
}

function mergeSessions(
  candidates: readonly BrowserEvidenceRecoveryCandidateV640[],
): { session: BrowserEvidenceSessionV639 | null; conflicts: BrowserEvidenceRecoveryConflictV640[] } {
  const valid = usableCandidates(candidates);
  if (!valid.length) return { session: null, conflicts: [] };
  const base = valid[0]!.session!;
  const conflicts: BrowserEvidenceRecoveryConflictV640[] = [];
  for (const candidate of valid.slice(1)) {
    const session = candidate.session!;
    if (!sameSessionIdentity(base, session)) conflicts.push({ kind: "session-identity", key: candidateIdentity(candidate), sources: [valid[0]!.source, candidate.source], detail: "sessionId, build or manifest differs" });
    if (!compareBrowserEvidenceBuildV639(base.build, session.build)) conflicts.push({ kind: "build", key: candidate.source, sources: [valid[0]!.source, candidate.source], detail: "build identity differs" });
    if (base.manifestDigest !== session.manifestDigest) conflicts.push({ kind: "manifest", key: candidate.source, sources: [valid[0]!.source, candidate.source], detail: "canonical manifest digest differs" });
    if (safeJson(base.boundary) !== safeJson(session.boundary)) conflicts.push({ kind: "boundary", key: candidate.source, sources: [valid[0]!.source, candidate.source], detail: "candidate boundary differs" });
  }
  const recordsResult = mergeRecordSets(valid.filter((candidate) => sameSessionIdentity(base, candidate.session!)));
  const eventsResult = mergeEventSets(valid.filter((candidate) => sameSessionIdentity(base, candidate.session!)));
  conflicts.push(...recordsResult.conflicts, ...eventsResult.conflicts);
  if (conflicts.length) return { session: null, conflicts };
  const latestTime = stableSort(valid.map((candidate) => candidate.session!.updatedAt), (left, right) => Date.parse(right) - Date.parse(left))[0] ?? base.updatedAt;
  const merged: BrowserEvidenceSessionV639 = Object.freeze({
    ...base,
    updatedAt: latestTime,
    status: statusForMergedRecords(recordsResult.records),
    records: Object.freeze(recordsResult.records),
    events: Object.freeze(eventsResult.events),
    boundary: boundary(),
    sourceAuthenticityProven: false,
  });
  const validation = validateBrowserEvidenceSessionV639(merged);
  if (!validation.valid) return { session: null, conflicts: [{ kind: "event-order", key: "merged", sources: valid.map((candidate) => candidate.source), detail: validation.issues.map((issue) => issue.code).join(",") }] };
  return { session: merged, conflicts: [] };
}

export function planBrowserEvidenceRecoveryV640(
  inputs: readonly BrowserEvidenceRecoveryInputV640[],
  expectedBuild: BrowserEvidenceBuildV639,
  generatedAt = new Date().toISOString(),
): BrowserEvidenceRecoveryPlanV640 {
  if (!timestamp(generatedAt)) throw new Error("recovery:time");
  const candidates = collectBrowserEvidenceRecoveryCandidatesV640(inputs, expectedBuild);
  const usable = usableCandidates(candidates);
  const conflicts: BrowserEvidenceRecoveryConflictV640[] = [];
  const identityGroups = new Map<string, BrowserEvidenceRecoveryCandidateV640[]>();
  for (const candidate of usable) {
    const key = candidateIdentity(candidate);
    identityGroups.set(key, [...(identityGroups.get(key) ?? []), candidate]);
  }
  if (identityGroups.size > 1) {
    const groups = [...identityGroups.values()];
    for (const group of groups.slice(1)) conflicts.push({ kind: "session-identity", key: candidateIdentity(group[0]!), sources: groups[0]!.map((candidate) => candidate.source).concat(group.map((candidate) => candidate.source)), detail: "usable snapshots do not share one session identity" });
  }
  const ignored = candidates.filter((candidate) => candidate.status !== "valid").map((candidate) => candidate.source);
  const reasons: string[] = [];
  let action: BrowserEvidenceRecoveryPlanV640["action"] = "none";
  let recommendedSource: string | null = null;
  if (!usable.length) { action = candidates.length ? "blocked" : "none"; reasons.push(candidates.length ? "no-valid-session" : "no-input"); }
  else if (conflicts.length) { action = "blocked"; reasons.push("session-identity-conflict"); }
  else if (usable.length === 1) { action = "restore"; recommendedSource = usable[0]!.source; reasons.push("one-build-matched-session"); }
  else { action = "merge"; recommendedSource = usable[0]!.source; reasons.push("multiple-compatible-snapshots"); }
  if (ignored.length) reasons.push(`ignored:${ignored.length}`);
  return Object.freeze({
    schema: BROWSER_EVIDENCE_RECOVERY_SCHEMA_V640,
    generatedAt,
    expectedBuild: { ...expectedBuild },
    expectedStorageKey: browserEvidenceSessionStorageKeyV639(expectedBuild),
    candidates: Object.freeze(candidates),
    usable: Object.freeze(usable.map((candidate) => candidate.source)),
    ignored: Object.freeze(ignored),
    conflicts: Object.freeze(conflicts),
    recommendedSource,
    action,
    reasons: Object.freeze(reasons),
    boundary: boundary(),
  });
}

export function recoverBrowserEvidenceSessionV640(
  plan: BrowserEvidenceRecoveryPlanV640,
): { session: BrowserEvidenceSessionV639 | null; conflicts: readonly BrowserEvidenceRecoveryConflictV640[] } {
  if (plan.action === "none" || plan.action === "blocked") return { session: null, conflicts: plan.conflicts };
  const candidates = plan.candidates.filter((candidate) => plan.usable.includes(candidate.source));
  return mergeSessions(candidates);
}

function latestKeys(session: BrowserEvidenceSessionV639 | null): string[] {
  if (!session) return [];
  const latest = new Map<string, BrowserEvidenceRecordV639>();
  session.records.forEach((record) => { if (record.targetKey) latest.set(record.targetKey, record); });
  return [...latest.keys()].sort();
}

function blockedLatest(session: BrowserEvidenceSessionV639 | null): number {
  if (!session) return 0;
  const latest = new Map<string, BrowserEvidenceRecordV639>();
  session.records.forEach((record) => { if (record.targetKey) latest.set(record.targetKey, record); });
  return [...latest.values()].filter((record) => record.status === "blocked").length;
}

export function createBrowserEvidenceRecoveryReportV640(
  plan: BrowserEvidenceRecoveryPlanV640,
  recovered: { session: BrowserEvidenceSessionV639 | null; conflicts: readonly BrowserEvidenceRecoveryConflictV640[] },
  generatedAt = plan.generatedAt,
): BrowserEvidenceRecoveryReportV640 {
  const sources = plan.candidates.map((candidate) => ({
    source: candidate.source,
    status: candidate.status,
    bytes: candidate.bytes,
    sha256: candidate.sha256,
    sessionId: candidate.sessionId,
    records: candidate.session?.records.length ?? 0,
    events: candidate.session?.events.length ?? 0,
    issues: candidate.validationIssues,
  }));
  let encodedBytes: number | null = null;
  let encodedSha256: string | null = null;
  let valid = false;
  let verificationIssues: string[] = [];
  if (recovered.session) {
    try {
      const encoded = encodeBrowserEvidenceSessionV639(recovered.session);
      encodedBytes = utf8Bytes(encoded);
      encodedSha256 = digest(encoded);
      valid = true;
      const batch = browserEvidenceSessionBatchV639(recovered.session);
      if (batch.evaluation?.scientificPayloadWriteback !== false) verificationIssues.push("report:payload-boundary");
    } catch (error) { verificationIssues = [error instanceof Error ? error.message : String(error)]; }
  }
  const action = recovered.conflicts.length ? "blocked" : recovered.session ? plan.action : "blocked";
  const report: BrowserEvidenceRecoveryReportV640 = {
    schema: BROWSER_EVIDENCE_RECOVERY_SCHEMA_V640,
    generatedAt,
    action,
    planDigest: digest(safeJson(plan)),
    expectedBuild: { ...plan.expectedBuild },
    sources: Object.freeze(sources),
    merged: {
      status: recovered.session ? "created" : recovered.conflicts.length ? "blocked" : "not-created",
      session: recovered.session,
      records: recovered.session?.records.length ?? 0,
      events: recovered.session?.events.length ?? 0,
      latestKeys: Object.freeze(latestKeys(recovered.session)),
      blockedLatest: blockedLatest(recovered.session),
    },
    conflicts: Object.freeze([...recovered.conflicts]),
    verification: { encodedBytes, encodedSha256, valid, issues: Object.freeze(verificationIssues) },
    boundary: boundary(),
    limits: { browserAuthenticity: false, productionPerformance: false, physicalMobile: "not-run", scientificValidity: false, rightsApproval: false },
  };
  return Object.freeze(report);
}

export function encodeBrowserEvidenceRecoveryReportV640(report: BrowserEvidenceRecoveryReportV640): string {
  const encoded = JSON.stringify(report, null, 2);
  if (utf8Bytes(encoded) > BROWSER_EVIDENCE_RECOVERY_MAX_OUTPUT_BYTES_V640) throw new Error("recovery:report-size");
  return encoded;
}

export function recoverySummaryV640(report: BrowserEvidenceRecoveryReportV640): string {
  return `${report.action} · ${report.merged.latestKeys.length}/36 latest keys · ${report.merged.blockedLatest} blocked latest · ${report.conflicts.length} conflicts · raw browser evidence only`;
}

export function recoveryCandidateDigestV640(candidate: BrowserEvidenceRecoveryCandidateV640): string {
  return digest(`${candidate.source}|${candidate.sha256 ?? "none"}|${candidate.status}|${candidate.sessionId ?? "none"}`);
}

export function verifyBrowserEvidenceRecoveryReportV640(report: BrowserEvidenceRecoveryReportV640): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (report.schema !== BROWSER_EVIDENCE_RECOVERY_SCHEMA_V640) issues.push("report:schema");
  if (!timestamp(report.generatedAt)) issues.push("report:time");
  if (!compareBrowserEvidenceBuildV639(report.expectedBuild, report.expectedBuild)) issues.push("report:build");
  if (!report.boundary.candidateOnly || !report.boundary.hold || !report.boundary.notAdmitted || report.boundary.scientificPayloadWriteback || report.boundary.rightsApproval || report.boundary.sourceAuthenticityProven) issues.push("report:boundary");
  if (report.merged.status === "created" && !report.merged.session) issues.push("report:merged-missing");
  if (report.merged.session) {
    const validation = validateBrowserEvidenceSessionV639(report.merged.session);
    if (!validation.valid) issues.push(...validation.issues.map((issue) => `report:session:${issue.code}`));
    if (!compareBrowserEvidenceBuildV639(report.merged.session.build, report.expectedBuild)) issues.push("report:session-build");
    if (report.merged.session.records.length !== report.merged.records) issues.push("report:record-count");
    if (report.merged.session.events.length !== report.merged.events) issues.push("report:event-count");
  }
  if (report.verification.valid !== Boolean(report.merged.session)) issues.push("report:verification-state");
  if (report.limits.browserAuthenticity || report.limits.productionPerformance || report.limits.scientificValidity || report.limits.rightsApproval || report.limits.physicalMobile !== "not-run") issues.push("report:limits");
  return { valid: issues.length === 0, issues: unique(issues) };
}

export function recoveryPlanBoundaryV640(): BrowserEvidenceRecoveryBoundaryV640 { return boundary(); }

import { sha256Utf8HexV566 } from "./sha256BrowserV566";
import {
  CANONICAL_COVERAGE_SHA256_V635,
  canonicalTargetKeyV635,
  type CanonicalRuntimeTargetV635,
} from "./mainlineACanonicalRuntimeV635";
import {
  evaluateMainlineAResourceObservationV633,
  type MainlineAResourceObservationV633,
} from "./mainlineAResourceObservationV633";
import { evaluateCanonicalBrowserBatchV638 } from "./mainlineACanonicalBatchV638";
import canonicalCoverage from "../data/mainlineACanonicalCoverageV622.generated.json";

/**
 * A browser observation session is intentionally separate from the canonical
 * batch export.  The batch is the portable evidence artifact; this session is
 * a small, resumable work ledger that makes it possible to close and reopen
 * the performance panel or a same-origin tab without losing raw observations.
 * It never asserts browser authenticity or admission.
 */
export const BROWSER_EVIDENCE_SESSION_SCHEMA_V639 = "mainline-a-browser-evidence-session-v639" as const;
export const BROWSER_EVIDENCE_SESSION_STORAGE_V639 = "mainline-a-browser-evidence-session-v639" as const;
export const BROWSER_EVIDENCE_SESSION_INDEX_STORAGE_V639 = `${BROWSER_EVIDENCE_SESSION_STORAGE_V639}:index` as const;
export const BROWSER_EVIDENCE_SESSION_MAX_RECORDS_V639 = 48;
export const BROWSER_EVIDENCE_SESSION_MAX_EVENTS_V639 = 256;
export const BROWSER_EVIDENCE_SESSION_MAX_BYTES_V639 = 16 * 1024 * 1024;
export const BROWSER_EVIDENCE_SESSION_PERSIST_MAX_BYTES_V639 = 4 * 1024 * 1024;
export const BROWSER_EVIDENCE_RAW_RECORD_MAX_BYTES_V639 = 2 * 1024 * 1024;

export type BrowserEvidenceBuildV639 = Readonly<{
  buildId: string;
  branch: string;
  head: string;
}>;

export type BrowserEvidenceViewportV639 = Readonly<{
  width: number;
  height: number;
  devicePixelRatio: number;
  device: "desktop" | "mobile-simulated" | "physical-mobile";
}>;

export type BrowserEvidenceBoundaryV639 = Readonly<{
  candidateOnly: true;
  hold: true;
  notAdmitted: true;
  scientificPayloadWriteback: false;
  rightsApproval: false;
}>;

export type BrowserEvidenceEventTypeV639 =
  | "session-created"
  | "session-restored"
  | "session-persist-failed"
  | "panel-opened"
  | "panel-closed"
  | "observation-started"
  | "target-selected"
  | "active-checkpoint-recorded"
  | "observation-finished"
  | "observation-aborted"
  | "observation-rejected"
  | "batch-exported"
  | "controlled-fault-recorded"
  | "viewport-observed";

export type BrowserEvidenceEventV639 = Readonly<{
  at: string;
  type: BrowserEvidenceEventTypeV639;
  runId: string | null;
  targetKey: string | null;
  detail: string | null;
}>;

export type BrowserEvidenceRecordV639 = Readonly<{
  runId: string;
  rawJson: string;
  rawSha256: string;
  bytes: number;
  targetKey: string | null;
  endedAt: string | null;
  status: "measured-local" | "blocked";
  issues: readonly string[];
  source: "browser-ui";
}>;

export type BrowserEvidenceSessionStatusV639 = "open" | "partial" | "complete-local" | "blocked";

export type BrowserEvidenceSessionV639 = Readonly<{
  schema: typeof BROWSER_EVIDENCE_SESSION_SCHEMA_V639;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  build: BrowserEvidenceBuildV639;
  manifestDigest: typeof CANONICAL_COVERAGE_SHA256_V635;
  viewport: BrowserEvidenceViewportV639;
  status: BrowserEvidenceSessionStatusV639;
  records: readonly BrowserEvidenceRecordV639[];
  events: readonly BrowserEvidenceEventV639[];
  boundary: BrowserEvidenceBoundaryV639;
  sourceAuthenticityProven: false;
}>;

export type BrowserEvidenceSessionIssueV639 = Readonly<{
  code: string;
  recordIndex?: number;
  eventIndex?: number;
}>;

export type BrowserEvidenceSessionValidationV639 = Readonly<{
  valid: boolean;
  issues: readonly BrowserEvidenceSessionIssueV639[];
  bytes: number;
  recordCount: number;
  eventCount: number;
}>;

export type BrowserEvidenceSessionSummaryV639 = Readonly<{
  status: BrowserEvidenceSessionStatusV639;
  expected: 36;
  observed: number;
  verified: number;
  blockedRecords: number;
  stars: number;
  nebulae: number;
  constellations: number;
  missing: readonly string[];
  duplicates: readonly string[];
  currentBuild: BrowserEvidenceBuildV639;
  currentViewport: BrowserEvidenceViewportV639;
  persistence: "available" | "unavailable" | "not-requested";
  scientificPayloadWriteback: false;
  sourceAuthenticityProven: false;
}>;

type Row = Record<string, unknown>;

const SHA256 = /^[a-f0-9]{64}$/u;
const BUILD_ID = /^mainline-a-[a-f0-9]{16}$/u;
const HEAD = /^[a-f0-9]{40}$/u;
const SAFE_TEXT = /^[^\u0000-\u001f]{1,2048}$/u;
const SESSION_ID = /^r65-session-[a-f0-9-]{8,96}$/u;
const TARGET_ID = /^(star|nebula|constellation):[A-Za-z0-9][A-Za-z0-9-]*$/u;
const KINDS = new Set(["star", "nebula", "constellation"]);

const boundary = (): BrowserEvidenceBoundaryV639 => ({
  candidateOnly: true,
  hold: true,
  notAdmitted: true,
  scientificPayloadWriteback: false,
  rightsApproval: false,
});

const row = (value: unknown): value is Row => Boolean(value && typeof value === "object" && !Array.isArray(value));
const stringValue = (value: unknown, maximum = 2048): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= maximum && !/\u0000/u.test(value);
const timestamp = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/u.test(value) && Number.isFinite(Date.parse(value));
const nonNegativeInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const finiteNonNegative = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;
const bytes = (value: string): number => new TextEncoder().encode(value).byteLength;
const unique = (values: readonly string[]): string[] => [...new Set(values)];
const safeJson = (value: unknown): string => JSON.stringify(value);

function validBuild(value: unknown): value is BrowserEvidenceBuildV639 {
  return row(value)
    && typeof value.buildId === "string" && BUILD_ID.test(value.buildId)
    && typeof value.branch === "string" && value.branch.startsWith("codex/") && SAFE_TEXT.test(value.branch)
    && typeof value.head === "string" && HEAD.test(value.head);
}

function validViewport(value: unknown): value is BrowserEvidenceViewportV639 {
  return row(value)
    && nonNegativeInteger(value.width) && value.width >= 240 && value.width <= 10_000
    && nonNegativeInteger(value.height) && value.height >= 180 && value.height <= 10_000
    && finiteNonNegative(value.devicePixelRatio) && value.devicePixelRatio > 0 && value.devicePixelRatio <= 8
    && (value.device === "desktop" || value.device === "mobile-simulated" || value.device === "physical-mobile");
}

function validBoundary(value: unknown): value is BrowserEvidenceBoundaryV639 {
  return row(value) && value.candidateOnly === true && value.hold === true
    && value.notAdmitted === true && value.scientificPayloadWriteback === false && value.rightsApproval === false;
}

function validTargetKey(value: unknown): value is string {
  if (typeof value !== "string" || !TARGET_ID.test(value)) return false;
  const [kind, id] = value.split(":");
  return KINDS.has(kind) && Boolean(id);
}

function targetKeyFromObservation(value: MainlineAResourceObservationV633): string | null {
  const target = value.objectCycle?.target;
  return target && KINDS.has(target.kind) && typeof target.id === "string"
    ? canonicalTargetKeyV635(target as CanonicalRuntimeTargetV635) : null;
}

function recordFromObservation(
  observation: MainlineAResourceObservationV633,
  rawJson: string,
): BrowserEvidenceRecordV639 {
  if (!stringValue(rawJson, BROWSER_EVIDENCE_RAW_RECORD_MAX_BYTES_V639)) throw new Error("session:raw-json-required");
  const rawBytes = bytes(rawJson);
  if (rawBytes > BROWSER_EVIDENCE_RAW_RECORD_MAX_BYTES_V639) throw new Error("session:raw-json-too-large");
  const evaluation = evaluateMainlineAResourceObservationV633(observation);
  const fixture = /fixture|synthetic/iu.test(observation.runId);
  const issues = unique([...evaluation.issues, ...(fixture ? ["session:fixture-not-browser-evidence"] : [])]);
  return {
    runId: observation.runId,
    rawJson,
    rawSha256: sha256Utf8HexV566(rawJson),
    bytes: rawBytes,
    targetKey: targetKeyFromObservation(observation),
    endedAt: timestamp(observation.endedAt) ? observation.endedAt : null,
    status: issues.length ? "blocked" : evaluation.status,
    issues: Object.freeze(issues),
    source: "browser-ui",
  };
}

function event(
  type: BrowserEvidenceEventTypeV639,
  runId: string | null,
  targetKey: string | null,
  detail: string | null,
  at: string,
): BrowserEvidenceEventV639 {
  if (!timestamp(at)) throw new Error("session:event-time-invalid");
  if (runId !== null && !stringValue(runId, 160)) throw new Error("session:event-run-invalid");
  if (targetKey !== null && !validTargetKey(targetKey)) throw new Error("session:event-target-invalid");
  if (detail !== null && !stringValue(detail, 2048)) throw new Error("session:event-detail-invalid");
  return Object.freeze({ at, type, runId, targetKey, detail });
}

function sessionWith(
  current: BrowserEvidenceSessionV639,
  changes: Partial<Pick<BrowserEvidenceSessionV639, "records" | "events" | "status" | "updatedAt" | "viewport">>,
): BrowserEvidenceSessionV639 {
  return Object.freeze({
    ...current,
    ...changes,
    records: Object.freeze([...(changes.records ?? current.records)]),
    events: Object.freeze([...(changes.events ?? current.events)]),
    boundary: boundary(),
    sourceAuthenticityProven: false,
  });
}

function statusForRecords(records: readonly BrowserEvidenceRecordV639[]): BrowserEvidenceSessionStatusV639 {
  if (!records.length) return "open";
  const latest = new Map<string, BrowserEvidenceRecordV639>();
  records.forEach((record) => { if (record.targetKey) latest.set(record.targetKey, record); });
  const blocked = records.some((record) => record.status === "blocked");
  const canonicalKeys = new Set(canonicalCoverage.records.map((record) => `${record.kind}:${record.id}`));
  if (latest.size === 36 && [...latest.entries()].every(([key, record]) => canonicalKeys.has(key) && record.status === "measured-local")) return "complete-local";
  return blocked ? "blocked" : "partial";
}

export function createBrowserEvidenceSessionV639(args: {
  sessionId?: string;
  build: BrowserEvidenceBuildV639;
  viewport: BrowserEvidenceViewportV639;
  manifestDigest?: string;
  at?: string;
}): BrowserEvidenceSessionV639 {
  const at = args.at ?? new Date().toISOString();
  if (!validBuild(args.build)) throw new Error("session:build-invalid");
  if (!validViewport(args.viewport)) throw new Error("session:viewport-invalid");
  if (args.manifestDigest !== undefined && args.manifestDigest !== CANONICAL_COVERAGE_SHA256_V635) throw new Error("session:manifest-invalid");
  if (!timestamp(at)) throw new Error("session:time-invalid");
  const sessionId = args.sessionId ?? `r65-session-${sha256Utf8HexV566(`${at}|${safeJson(args.build)}`).slice(0, 24)}`;
  if (!SESSION_ID.test(sessionId)) throw new Error("session:id-invalid");
  const created: BrowserEvidenceSessionV639 = {
    schema: BROWSER_EVIDENCE_SESSION_SCHEMA_V639,
    sessionId,
    createdAt: at,
    updatedAt: at,
    build: { ...args.build },
    manifestDigest: CANONICAL_COVERAGE_SHA256_V635,
    viewport: { ...args.viewport },
    status: "open" as const,
    records: [] as readonly BrowserEvidenceRecordV639[],
    events: [event("session-created", null, null, "browser-ui-session", at)] as readonly BrowserEvidenceEventV639[],
    boundary: boundary(),
    sourceAuthenticityProven: false as const,
  };
  return Object.freeze(created);
}

export function appendBrowserEvidenceEventV639(
  current: BrowserEvidenceSessionV639,
  args: { type: BrowserEvidenceEventTypeV639; runId?: string | null; targetKey?: string | null; detail?: string | null; at?: string },
): BrowserEvidenceSessionV639 {
  const at = args.at ?? new Date().toISOString();
  const nextEvent = event(args.type, args.runId ?? null, args.targetKey ?? null, args.detail ?? null, at);
  const events = [...current.events, nextEvent];
  if (events.length > BROWSER_EVIDENCE_SESSION_MAX_EVENTS_V639) throw new Error("session:event-limit");
  return sessionWith(current, { events, updatedAt: at });
}

export function appendBrowserEvidenceObservationV639(
  current: BrowserEvidenceSessionV639,
  observation: MainlineAResourceObservationV633,
  rawJson = JSON.stringify(observation, null, 2),
  at = new Date().toISOString(),
): BrowserEvidenceSessionV639 {
  if (!validBuild(observation.build) || safeJson(observation.build) !== safeJson(current.build)) throw new Error("session:observation-build-mismatch");
  if (!timestamp(at)) throw new Error("session:observation-time-invalid");
  const next = recordFromObservation(observation, rawJson);
  const records = [...current.records, next];
  if (records.length > BROWSER_EVIDENCE_SESSION_MAX_RECORDS_V639) throw new Error("session:record-limit");
  const eventType = next.status === "measured-local" ? "observation-finished" : "observation-rejected";
  const withRecord = sessionWith(current, { records, status: statusForRecords(records), updatedAt: at });
  return appendBrowserEvidenceEventV639(withRecord, {
    type: eventType,
    runId: next.runId,
    targetKey: next.targetKey,
    detail: next.status === "measured-local" ? "raw-observation-retained" : next.issues.join(","),
    at,
  });
}

export function restoreBrowserEvidenceSessionV639(
  current: BrowserEvidenceSessionV639,
  records: readonly { observation: MainlineAResourceObservationV633; rawJson?: string }[],
  at = new Date().toISOString(),
): BrowserEvidenceSessionV639 {
  let next = current;
  for (const item of records) {
    next = appendBrowserEvidenceObservationV639(next, item.observation, item.rawJson ?? JSON.stringify(item.observation, null, 2), at);
  }
  return appendBrowserEvidenceEventV639(next, { type: "session-restored", detail: `records:${records.length}`, at });
}

export function updateBrowserEvidenceViewportV639(
  current: BrowserEvidenceSessionV639,
  viewport: BrowserEvidenceViewportV639,
  at = new Date().toISOString(),
): BrowserEvidenceSessionV639 {
  if (!validViewport(viewport)) throw new Error("session:viewport-invalid");
  const next = sessionWith(current, { viewport: { ...viewport }, updatedAt: at });
  return appendBrowserEvidenceEventV639(next, { type: "viewport-observed", detail: `${viewport.width}x${viewport.height}`, at });
}

export function browserEvidenceSessionRecordsV639(
  session: BrowserEvidenceSessionV639,
): MainlineAResourceObservationV633[] {
  return session.records.flatMap((record) => {
    try {
      const parsed = JSON.parse(record.rawJson) as unknown;
      return row(parsed) ? [parsed as unknown as MainlineAResourceObservationV633] : [];
    } catch { return []; }
  });
}

export function summarizeBrowserEvidenceSessionV639(
  session: BrowserEvidenceSessionV639,
  persistence: BrowserEvidenceSessionSummaryV639["persistence"] = "not-requested",
): BrowserEvidenceSessionSummaryV639 {
  const latest = new Map<string, BrowserEvidenceRecordV639>();
  const duplicates: string[] = [];
  for (const record of session.records) {
    if (!record.targetKey) continue;
    if (latest.has(record.targetKey)) duplicates.push(record.targetKey);
    latest.set(record.targetKey, record);
  }
  const verified = [...latest.values()].filter((record) => record.status === "measured-local");
  const counts = { stars: 0, nebulae: 0, constellations: 0 };
  verified.forEach((record) => {
    if (record.targetKey?.startsWith("star:")) counts.stars += 1;
    else if (record.targetKey?.startsWith("nebula:")) counts.nebulae += 1;
    else if (record.targetKey?.startsWith("constellation:")) counts.constellations += 1;
  });
  const expected = new Set(canonicalCoverage.records.map((record) => `${record.kind}:${record.id}`));
  const observed = new Set([...latest.keys()]);
  const missing = [...expected].filter((key) => !observed.has(key));
  return {
    status: session.status,
    expected: 36,
    observed: latest.size,
    verified: verified.length,
    blockedRecords: session.records.filter((record) => record.status === "blocked").length,
    stars: counts.stars,
    nebulae: counts.nebulae,
    constellations: counts.constellations,
    missing: Object.freeze(missing),
    duplicates: Object.freeze(unique(duplicates)),
    currentBuild: { ...session.build },
    currentViewport: { ...session.viewport },
    persistence,
    scientificPayloadWriteback: false,
    sourceAuthenticityProven: false,
  };
}

function validateRecord(value: unknown, index: number): BrowserEvidenceSessionIssueV639[] {
  if (!row(value)) return [{ code: "record:shape", recordIndex: index }];
  const issues: BrowserEvidenceSessionIssueV639[] = [];
  if (!stringValue(value.runId, 160)) issues.push({ code: "record:run-id", recordIndex: index });
  if (!stringValue(value.rawJson, BROWSER_EVIDENCE_RAW_RECORD_MAX_BYTES_V639)) issues.push({ code: "record:raw-json", recordIndex: index });
  if (!nonNegativeInteger(value.bytes) || typeof value.rawJson === "string" && value.bytes !== bytes(value.rawJson)) issues.push({ code: "record:bytes", recordIndex: index });
  if (typeof value.rawSha256 !== "string" || !SHA256.test(value.rawSha256)
    || typeof value.rawJson === "string" && sha256Utf8HexV566(value.rawJson) !== value.rawSha256) issues.push({ code: "record:sha256", recordIndex: index });
  if (value.targetKey !== null && !validTargetKey(value.targetKey)) issues.push({ code: "record:target", recordIndex: index });
  if (value.endedAt !== null && !timestamp(value.endedAt)) issues.push({ code: "record:ended-at", recordIndex: index });
  if (value.status !== "measured-local" && value.status !== "blocked") issues.push({ code: "record:status", recordIndex: index });
  if (!Array.isArray(value.issues) || value.issues.some((issue) => !stringValue(issue, 1024))) issues.push({ code: "record:issues", recordIndex: index });
  if (value.source !== "browser-ui") issues.push({ code: "record:source", recordIndex: index });
  try {
    const parsed = JSON.parse(value.rawJson as string) as unknown;
    const evaluation = evaluateMainlineAResourceObservationV633(parsed);
    const runId = row(parsed) && typeof parsed.runId === "string" ? parsed.runId : "";
    const expectedIssues = unique([...evaluation.issues, ...(/fixture|synthetic/iu.test(runId) ? ["session:fixture-not-browser-evidence"] : [])]);
    const expectedStatus = expectedIssues.length ? "blocked" : evaluation.status;
    if (expectedStatus !== value.status || safeJson(expectedIssues) !== safeJson(value.issues)) issues.push({ code: "record:evaluation-drift", recordIndex: index });
    if (row(parsed) && parsed.runId !== value.runId) issues.push({ code: "record:run-drift", recordIndex: index });
    if (row(parsed) && targetKeyFromObservation(parsed as MainlineAResourceObservationV633) !== value.targetKey) issues.push({ code: "record:target-drift", recordIndex: index });
    if (row(parsed) && parsed.endedAt !== value.endedAt) issues.push({ code: "record:ended-at-drift", recordIndex: index });
  } catch { issues.push({ code: "record:json", recordIndex: index }); }
  return issues;
}

function validateEvent(value: unknown, index: number): BrowserEvidenceSessionIssueV639[] {
  if (!row(value)) return [{ code: "event:shape", eventIndex: index }];
  const issues: BrowserEvidenceSessionIssueV639[] = [];
  if (!timestamp(value.at)) issues.push({ code: "event:time", eventIndex: index });
  if (typeof value.type !== "string" || ![
    "session-created", "session-restored", "session-persist-failed", "panel-opened", "panel-closed",
    "observation-started", "target-selected", "active-checkpoint-recorded", "observation-finished",
    "observation-aborted", "observation-rejected", "batch-exported", "controlled-fault-recorded", "viewport-observed",
  ].includes(value.type)) issues.push({ code: "event:type", eventIndex: index });
  if (value.runId !== null && !stringValue(value.runId, 160)) issues.push({ code: "event:run-id", eventIndex: index });
  if (value.targetKey !== null && !validTargetKey(value.targetKey)) issues.push({ code: "event:target", eventIndex: index });
  if (value.detail !== null && !stringValue(value.detail, 2048)) issues.push({ code: "event:detail", eventIndex: index });
  if (["observation-started", "active-checkpoint-recorded", "observation-finished", "observation-aborted", "observation-rejected"].includes(String(value.type))
    && !stringValue(value.runId, 160)) issues.push({ code: "event:run-required", eventIndex: index });
  return issues;
}

export function validateBrowserEvidenceSessionV639(value: unknown): BrowserEvidenceSessionValidationV639 {
  const raw = typeof value === "string" ? value : safeJson(value);
  const result = { valid: true, issues: [] as BrowserEvidenceSessionIssueV639[], bytes: bytes(raw), recordCount: 0, eventCount: 0 };
  if (result.bytes > BROWSER_EVIDENCE_SESSION_MAX_BYTES_V639) result.issues.push({ code: "session:bytes" });
  if (!row(value) || value.schema !== BROWSER_EVIDENCE_SESSION_SCHEMA_V639) result.issues.push({ code: "session:schema" });
  if (!row(value)) { result.valid = false; return result; }
  if (!SESSION_ID.test(String(value.sessionId)) || !timestamp(value.createdAt) || !timestamp(value.updatedAt)) result.issues.push({ code: "session:identity" });
  if (!validBuild(value.build)) result.issues.push({ code: "session:build" });
  if (value.manifestDigest !== CANONICAL_COVERAGE_SHA256_V635) result.issues.push({ code: "session:manifest" });
  if (!validViewport(value.viewport)) result.issues.push({ code: "session:viewport" });
  if (!["open", "partial", "complete-local", "blocked"].includes(String(value.status))) result.issues.push({ code: "session:status" });
  if (!validBoundary(value.boundary) || value.sourceAuthenticityProven !== false) result.issues.push({ code: "session:boundary" });
  if (!Array.isArray(value.records) || value.records.length > BROWSER_EVIDENCE_SESSION_MAX_RECORDS_V639) result.issues.push({ code: "session:records" });
  else {
    result.recordCount = value.records.length;
    value.records.forEach((record, index) => result.issues.push(...validateRecord(record, index)));
  }
  if (!Array.isArray(value.events) || value.events.length > BROWSER_EVIDENCE_SESSION_MAX_EVENTS_V639) result.issues.push({ code: "session:events" });
  else {
    result.eventCount = value.events.length;
    value.events.forEach((entry, index) => result.issues.push(...validateEvent(entry, index)));
  }
  if (Array.isArray(value.records)) {
    const expectedStatus = statusForRecords(value.records as BrowserEvidenceRecordV639[]);
    if (value.status !== expectedStatus) result.issues.push({ code: "session:status-drift" });
    const runIds = new Set<string>();
    for (const [index, candidate] of value.records.entries()) {
      if (!row(candidate) || typeof candidate.runId !== "string") continue;
      if (runIds.has(candidate.runId)) result.issues.push({ code: "session:duplicate-run", recordIndex: index });
      runIds.add(candidate.runId);
      if (row(candidate) && typeof candidate.rawJson === "string") {
        try {
          const parsed: unknown = JSON.parse(candidate.rawJson);
          if (!row(parsed) || !validBuild(parsed.build) || safeJson(parsed.build) !== safeJson(value.build)) result.issues.push({ code: "session:record-build", recordIndex: index });
          if (row(parsed) && row(parsed.objectCycle) && parsed.objectCycle.manifestDigest !== CANONICAL_COVERAGE_SHA256_V635) result.issues.push({ code: "session:record-manifest", recordIndex: index });
          if (row(parsed) && (parsed.fixture === true || parsed.synthetic === true)) result.issues.push({ code: "session:fixture-record", recordIndex: index });
        } catch { /* validateRecord reports JSON parsing failures. */ }
      }
    }
  }
  if (Array.isArray(value.records) && Array.isArray(value.events)) {
    const recordsByRun = new Map(value.records.flatMap((candidate) =>
      row(candidate) && typeof candidate.runId === "string" ? [[candidate.runId, candidate] as const] : []));
    for (const [index, entry] of value.events.entries()) {
      if (!row(entry) || (entry.type !== "observation-finished" && entry.type !== "observation-rejected")) continue;
      const matching = recordsByRun.get(String(entry.runId));
      if (!matching) { result.issues.push({ code: "event:record-missing", eventIndex: index }); continue; }
      const expected = matching.status === "measured-local" ? "observation-finished" : "observation-rejected";
      if (entry.type !== expected) result.issues.push({ code: "event:record-status", eventIndex: index });
      if (entry.targetKey !== matching.targetKey) result.issues.push({ code: "event:record-target", eventIndex: index });
    }
  }
  result.valid = result.issues.length === 0;
  return result;
}

export function encodeBrowserEvidenceSessionV639(session: BrowserEvidenceSessionV639): string {
  const validation = validateBrowserEvidenceSessionV639(session);
  if (!validation.valid) throw new Error(`session:encode-invalid:${validation.issues.map((issue) => issue.code).join(",")}`);
  const encoded = JSON.stringify(session, null, 2);
  if (bytes(encoded) > BROWSER_EVIDENCE_SESSION_MAX_BYTES_V639) throw new Error("session:encode-too-large");
  return encoded;
}

export function decodeBrowserEvidenceSessionV639(raw: string, expectedBuild?: BrowserEvidenceBuildV639): BrowserEvidenceSessionV639 {
  if (!stringValue(raw, BROWSER_EVIDENCE_SESSION_MAX_BYTES_V639)) throw new Error("session:decode-input");
  const parsed: unknown = JSON.parse(raw);
  const validation = validateBrowserEvidenceSessionV639(parsed);
  if (!validation.valid) throw new Error(`session:decode-invalid:${validation.issues.map((issue) => issue.code).join(",")}`);
  const session = parsed as BrowserEvidenceSessionV639;
  if (expectedBuild && safeJson(session.build) !== safeJson(expectedBuild)) throw new Error("session:decode-build-mismatch");
  return Object.freeze({ ...session, records: Object.freeze([...session.records]), events: Object.freeze([...session.events]), boundary: boundary(), sourceAuthenticityProven: false });
}

export type BrowserEvidenceStorageV639 = Readonly<{
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}>;

export function browserEvidenceSessionStorageKeyV639(build: BrowserEvidenceBuildV639): string {
  if (!validBuild(build)) throw new Error("session:storage-build-invalid");
  const fingerprint = sha256Utf8HexV566(`${build.buildId}|${build.branch}|${build.head}`).slice(0, 32);
  return `${BROWSER_EVIDENCE_SESSION_STORAGE_V639}:${fingerprint}`;
}

function storedPrefixV639<T>(stored: readonly T[], next: readonly T[]): boolean {
  return stored.length <= next.length && stored.every((entry, index) => safeJson(entry) === safeJson(next[index]));
}

export function persistBrowserEvidenceSessionV639(storage: BrowserEvidenceStorageV639, session: BrowserEvidenceSessionV639):
  | { ok: true; bytes: number; key: string; sha256: string }
  | { ok: false; error: string } {
  try {
    const encoded = encodeBrowserEvidenceSessionV639(session);
    const size = bytes(encoded);
    if (size > BROWSER_EVIDENCE_SESSION_PERSIST_MAX_BYTES_V639) throw new Error("session:storage-size-limit");
    const key = browserEvidenceSessionStorageKeyV639(session.build);
    const before = storage.getItem(key);
    if (before !== null) {
      const previous = decodeBrowserEvidenceSessionV639(before, session.build);
      if (previous.sessionId !== session.sessionId) throw new Error("session:storage-session-conflict");
      if (!storedPrefixV639(previous.records, session.records) || !storedPrefixV639(previous.events, session.events)) {
        throw new Error("session:storage-concurrent-write");
      }
    }
    storage.setItem(key, encoded);
    if (storage.getItem(key) !== encoded) throw new Error("session:storage-readback-mismatch");
    storage.setItem(BROWSER_EVIDENCE_SESSION_INDEX_STORAGE_V639, key);
    if (storage.getItem(BROWSER_EVIDENCE_SESSION_INDEX_STORAGE_V639) !== key) throw new Error("session:storage-index-mismatch");
    return { ok: true, bytes: size, key, sha256: sha256Utf8HexV566(encoded) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export function restoreBrowserEvidenceFromStorageV639(
  storage: BrowserEvidenceStorageV639,
  expectedBuild: BrowserEvidenceBuildV639,
): { status: "missing" | "restored" | "invalid" | "wrong-build"; session: BrowserEvidenceSessionV639 | null; error: string | null } {
  let raw: string | null;
  try { raw = storage.getItem(browserEvidenceSessionStorageKeyV639(expectedBuild)); }
  catch (error) { return { status: "invalid", session: null, error: error instanceof Error ? error.message : String(error) }; }
  if (raw === null) {
    let indexed: string | null = null;
    try { indexed = storage.getItem(BROWSER_EVIDENCE_SESSION_INDEX_STORAGE_V639); } catch { /* Treat unreadable storage as missing. */ }
    return indexed && indexed !== browserEvidenceSessionStorageKeyV639(expectedBuild)
      ? { status: "wrong-build", session: null, error: "session:decode-build-mismatch" }
      : { status: "missing", session: null, error: null };
  }
  try { return { status: "restored", session: decodeBrowserEvidenceSessionV639(raw, expectedBuild), error: null }; }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: message === "session:decode-build-mismatch" ? "wrong-build" : "invalid", session: null, error: message };
  }
}

export function reconcileBrowserEvidenceSessionsV639(
  current: BrowserEvidenceSessionV639,
  incoming: BrowserEvidenceSessionV639,
): "unchanged" | "advanced" | "stale" | "conflict" | "wrong-build" {
  if (!compareBrowserEvidenceBuildV639(current.build, incoming.build)
    || current.manifestDigest !== incoming.manifestDigest) return "wrong-build";
  if (current.sessionId !== incoming.sessionId) return "conflict";
  const currentPrefix = storedPrefixV639(current.records, incoming.records) && storedPrefixV639(current.events, incoming.events);
  const incomingPrefix = storedPrefixV639(incoming.records, current.records) && storedPrefixV639(incoming.events, current.events);
  if (currentPrefix && incomingPrefix) return "unchanged";
  if (currentPrefix) return "advanced";
  if (incomingPrefix) return "stale";
  return "conflict";
}

export function createBrowserEvidenceStorageV639(): BrowserEvidenceStorageV639 | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    const storage = window.localStorage;
    const probe = `${BROWSER_EVIDENCE_SESSION_STORAGE_V639}:probe`;
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return { getItem: (key) => storage.getItem(key), setItem: (key, value) => storage.setItem(key, value) };
  } catch { return null; }
}

export function browserEvidenceSessionBatchV639(session: BrowserEvidenceSessionV639) {
  const records = browserEvidenceSessionRecordsV639(session);
  const build = session.build;
  if (!session.records.length) return { batch: null, evaluation: null, observations: records };
  const canonicalKeys = new Set(canonicalCoverage.records.map((record) => `${record.kind}:${record.id}`));
  const latestCanonical = new Map<string, BrowserEvidenceRecordV639>();
  const outOfScope: BrowserEvidenceRecordV639[] = [];
  for (const record of session.records) {
    if (record.targetKey && canonicalKeys.has(record.targetKey)) latestCanonical.set(record.targetKey, record);
    else outOfScope.push(record);
  }
  const selected = [...latestCanonical.values(), ...outOfScope];
  const batch = {
    schema: "mainline-a-canonical-browser-batch-v638" as const,
    exportedAt: session.updatedAt,
    manifestDigest: session.manifestDigest,
    build,
    evidenceClass: "browser-export" as const,
    boundary: { candidateOnly: true as const, hold: true as const, notAdmitted: true as const, scientificPayloadWriteback: false as const },
    records: selected.map((record) => ({ runId: record.runId, rawJson: record.rawJson })),
  };
  const evaluation = evaluateCanonicalBrowserBatchV638(batch, build);
  return { batch, evaluation, observations: records };
}

export function recordBrowserEvidenceTargetSelectionV639(
  session: BrowserEvidenceSessionV639,
  target: CanonicalRuntimeTargetV635,
  at = new Date().toISOString(),
): BrowserEvidenceSessionV639 {
  if (!target || !KINDS.has(target.kind) || !stringValue(target.id, 128)) throw new Error("session:target-invalid");
  return appendBrowserEvidenceEventV639(session, { type: "target-selected", targetKey: canonicalTargetKeyV635(target), at });
}

export function markBrowserEvidencePanelLifecycleV639(
  session: BrowserEvidenceSessionV639,
  state: "opened" | "closed",
  at = new Date().toISOString(),
): BrowserEvidenceSessionV639 {
  return appendBrowserEvidenceEventV639(session, { type: state === "opened" ? "panel-opened" : "panel-closed", at });
}

export function markBrowserEvidenceControlledFaultV639(
  session: BrowserEvidenceSessionV639,
  detail: string,
  at = new Date().toISOString(),
): BrowserEvidenceSessionV639 {
  if (!stringValue(detail)) throw new Error("session:fault-detail-invalid");
  return appendBrowserEvidenceEventV639(session, { type: "controlled-fault-recorded", detail, at });
}

export function sessionRawRecordDigestV639(rawJson: string): string {
  if (!stringValue(rawJson, BROWSER_EVIDENCE_RAW_RECORD_MAX_BYTES_V639)) throw new Error("session:raw-json-invalid");
  return sha256Utf8HexV566(rawJson);
}

export function sessionRecordTargetV639(record: BrowserEvidenceRecordV639): string | null {
  return record.targetKey && validTargetKey(record.targetKey) ? record.targetKey : null;
}

export function browserEvidenceSessionIdentityV639(session: BrowserEvidenceSessionV639): string {
  return sha256Utf8HexV566(`${session.sessionId}|${session.build.buildId}|${session.manifestDigest}`);
}

export function compareBrowserEvidenceBuildV639(left: BrowserEvidenceBuildV639, right: BrowserEvidenceBuildV639): boolean {
  return validBuild(left) && validBuild(right) && left.buildId === right.buildId && left.branch === right.branch && left.head === right.head;
}

export function sessionCanExportBrowserBatchV639(session: BrowserEvidenceSessionV639): boolean {
  const result = browserEvidenceSessionBatchV639(session).evaluation;
  return result !== null && result.issues.length === 0 && result.verified > 0;
}

export function sessionCoverageKeysV639(session: BrowserEvidenceSessionV639): string[] {
  return unique(session.records.flatMap((record) => record.targetKey ? [record.targetKey] : []));
}

export function sessionLatestRecordsV639(session: BrowserEvidenceSessionV639): BrowserEvidenceRecordV639[] {
  const latest = new Map<string, BrowserEvidenceRecordV639>();
  session.records.forEach((record) => { if (record.targetKey) latest.set(record.targetKey, record); });
  return [...latest.values()];
}

export function sessionHasBlockedLatestV639(session: BrowserEvidenceSessionV639): boolean {
  return sessionLatestRecordsV639(session).some((record) => record.status === "blocked");
}

export function sessionOpenIssuesV639(session: BrowserEvidenceSessionV639): string[] {
  const issues = session.records.flatMap((record) => record.issues.map((issue) => `${record.runId}:${issue}`));
  return unique(issues);
}

export function sessionEventCountV639(session: BrowserEvidenceSessionV639, type: BrowserEvidenceEventTypeV639): number {
  return session.events.filter((entry) => entry.type === type).length;
}

export function sessionIsResumableV639(session: BrowserEvidenceSessionV639): boolean {
  return session.status !== "complete-local" && session.records.length < BROWSER_EVIDENCE_SESSION_MAX_RECORDS_V639;
}

export function sessionWithPersistFailureV639(session: BrowserEvidenceSessionV639, message: string, at = new Date().toISOString()): BrowserEvidenceSessionV639 {
  if (!stringValue(message)) throw new Error("session:persist-error-invalid");
  return appendBrowserEvidenceEventV639(session, { type: "session-persist-failed", detail: message, at });
}

export function sessionWithBatchExportedV639(session: BrowserEvidenceSessionV639, at = new Date().toISOString()): BrowserEvidenceSessionV639 {
  return appendBrowserEvidenceEventV639(session, { type: "batch-exported", detail: `records:${session.records.length}`, at });
}

export function sessionWithActiveCheckpointV639(session: BrowserEvidenceSessionV639, runId: string, at = new Date().toISOString()): BrowserEvidenceSessionV639 {
  return appendBrowserEvidenceEventV639(session, { type: "active-checkpoint-recorded", runId, at });
}

export function sessionWithObservationStartedV639(session: BrowserEvidenceSessionV639, runId: string, targetKey: string | null, at = new Date().toISOString()): BrowserEvidenceSessionV639 {
  return appendBrowserEvidenceEventV639(session, { type: "observation-started", runId, targetKey, at });
}

export function sessionWithObservationAbortedV639(session: BrowserEvidenceSessionV639, runId: string, detail: string, at = new Date().toISOString()): BrowserEvidenceSessionV639 {
  return appendBrowserEvidenceEventV639(session, { type: "observation-aborted", runId, detail, at });
}

export function sessionSummaryTextV639(summary: BrowserEvidenceSessionSummaryV639): string {
  return `${summary.verified}/36 verified · ${summary.blockedRecords} blocked · ${summary.stars}/${12} stars · ${summary.nebulae}/${12} nebulae · ${summary.constellations}/${12} constellations · persistence ${summary.persistence}`;
}

export function browserEvidenceSessionBoundaryV639(): BrowserEvidenceBoundaryV639 {
  return boundary();
}

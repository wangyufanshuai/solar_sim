import coverage from "../data/mainlineACanonicalCoverageV622.generated.json";
import { CANONICAL_COVERAGE_SHA256_V635, canonicalTargetKeyV635 } from "./mainlineACanonicalRuntimeV635";
import { evaluateMainlineAResourceObservationV633, type MainlineAResourceObservationV633 } from "./mainlineAResourceObservationV633";

export const CANONICAL_BATCH_SCHEMA_V638 = "mainline-a-canonical-browser-batch-v638";
export const CANONICAL_BATCH_MAX_BYTES_V638 = 16 * 1024 * 1024;
export const CANONICAL_BATCH_MAX_RUNS_V638 = 48;
type Build = MainlineAResourceObservationV633["build"];
type Row = Record<string, unknown>;
export type CanonicalBrowserBatchV638 = {
  schema: typeof CANONICAL_BATCH_SCHEMA_V638;
  exportedAt: string;
  manifestDigest: string;
  build: Build;
  evidenceClass: "browser-export";
  boundary: { candidateOnly: true; hold: true; notAdmitted: true; scientificPayloadWriteback: false };
  records: { runId: string; rawJson: string }[];
};
export type CanonicalBatchRowV638 = {
  key: string | null;
  runId: string;
  index: number;
  endedAt: string | null;
  status: "measured-local" | "blocked";
  issues: string[];
};
export type CanonicalBatchEvaluationV638 = {
  status: "complete-local" | "partial-local" | "blocked";
  issues: string[];
  rows: CanonicalBatchRowV638[];
  latest: { key: string; runId: string; index: number; status: "measured-local" | "blocked" }[];
  missing: string[];
  verified: number;
  rejectedRuns: number;
  build: Build;
  scientificPayloadWriteback: false;
  sourceAuthenticityProven: false;
};

const isRow = (value: unknown): value is Row => Boolean(value && typeof value === "object" && !Array.isArray(value));
const timestamp = (value: unknown): value is string => typeof value === "string"
  && /^\d{4}-\d{2}-\d{2}T/u.test(value) && Number.isFinite(Date.parse(value));
const bytes = (value: string) => new TextEncoder().encode(value).length;
const targetRows = new Map(coverage.records.map((row) => [`${row.kind}:${row.id}`, row]));
function sameBuild(value: unknown, expected: Build): boolean {
  return isRow(value) && value.buildId === expected.buildId && value.branch === expected.branch && value.head === expected.head;
}
function validBuild(build: Build): boolean {
  return typeof build.buildId === "string" && /^mainline-a-[a-f0-9]{16}$/u.test(build.buildId)
    && typeof build.branch === "string" && build.branch.startsWith("codex/") && /^[a-f0-9]{40}$/u.test(build.head);
}
function safeOrigin(value: Row): boolean {
  return value.fixture !== true && value.synthetic !== true
    && ![value.origin, value.evidenceClass].some((marker) => typeof marker === "string" && /fixture|synthetic/iu.test(marker));
}

export function createCanonicalBrowserBatchV638(
  history: readonly MainlineAResourceObservationV633[], build: Build, exportedAt = new Date().toISOString(),
): CanonicalBrowserBatchV638 {
  if (!validBuild(build) || !timestamp(exportedAt)) throw new Error("batch:export-identity");
  if (!history.length || history.length > CANONICAL_BATCH_MAX_RUNS_V638) throw new Error("batch:export-count");
  const batch: CanonicalBrowserBatchV638 = {
    schema: CANONICAL_BATCH_SCHEMA_V638, exportedAt, build: { ...build },
    manifestDigest: CANONICAL_COVERAGE_SHA256_V635, evidenceClass: "browser-export",
    boundary: { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false },
    records: history.map((observation) => ({ runId: observation.runId, rawJson: JSON.stringify(observation, null, 2) })),
  };
  if (bytes(JSON.stringify(batch)) > CANONICAL_BATCH_MAX_BYTES_V638) throw new Error("batch:export-bytes");
  return batch;
}

export function evaluateCanonicalBrowserBatchV638(value: unknown, expectedBuild: Build): CanonicalBatchEvaluationV638 {
  const result: CanonicalBatchEvaluationV638 = {
    status: "blocked", issues: [], rows: [], latest: [], missing: [...targetRows.keys()],
    verified: 0, rejectedRuns: 0, build: { ...expectedBuild },
    scientificPayloadWriteback: false, sourceAuthenticityProven: false,
  };
  if (!validBuild(expectedBuild)) result.issues.push("batch:expected-build-invalid");
  if (!isRow(value) || value.schema !== CANONICAL_BATCH_SCHEMA_V638) {
    result.issues.push("batch:schema"); return result;
  }
  if (!safeOrigin(value) || value.evidenceClass !== "browser-export") result.issues.push("batch:origin");
  if (!timestamp(value.exportedAt)) result.issues.push("batch:export-time");
  if (!sameBuild(value.build, expectedBuild)) result.issues.push("batch:build-mismatch");
  if (value.manifestDigest !== CANONICAL_COVERAGE_SHA256_V635) result.issues.push("batch:manifest-mismatch");
  const boundary = value.boundary;
  if (!isRow(boundary) || boundary.candidateOnly !== true || boundary.hold !== true
    || boundary.notAdmitted !== true || boundary.scientificPayloadWriteback !== false) result.issues.push("batch:boundary");
  if (!Array.isArray(value.records) || !value.records.length || value.records.length > CANONICAL_BATCH_MAX_RUNS_V638) {
    result.issues.push("batch:record-count"); return result;
  }
  const seen = new Set<string>();
  const latest = new Map<string, CanonicalBatchRowV638>();
  let totalBytes = 0;
  value.records.forEach((record: unknown, index: number) => {
    const row: CanonicalBatchRowV638 = { key: null, runId: "invalid", index, endedAt: null, status: "blocked", issues: [] };
    result.rows.push(row);
    if (!isRow(record) || typeof record.runId !== "string" || !record.runId.trim() || record.runId.length > 160
      || typeof record.rawJson !== "string" || !record.rawJson || bytes(record.rawJson) > 2 * 1024 * 1024) {
      row.issues.push("batch:record-shape"); result.issues.push(`batch:record-invalid:${index}`); return;
    }
    row.runId = record.runId;
    if (!safeOrigin(record)) { row.issues.push("batch:fixture-not-admitted"); result.issues.push("batch:fixture-not-admitted"); }
    totalBytes += bytes(record.rawJson);
    if (seen.has(row.runId)) { row.issues.push("batch:duplicate-run"); result.issues.push("batch:duplicate-run"); }
    seen.add(row.runId);
    let raw: unknown;
    try { raw = JSON.parse(record.rawJson); }
    catch { row.issues.push("batch:raw-json"); result.issues.push(`batch:record-invalid:${index}`); return; }
    if (!isRow(raw)) { row.issues.push("batch:raw-object"); result.issues.push(`batch:record-invalid:${index}`); return; }
    if (!safeOrigin(raw) || /fixture|synthetic/iu.test(row.runId)) { row.issues.push("batch:fixture-not-admitted"); result.issues.push("batch:fixture-not-admitted"); }
    if (raw.runId !== row.runId) { row.issues.push("batch:run-id-mismatch"); result.issues.push("batch:run-id-mismatch"); }
    if (!sameBuild(raw.build, expectedBuild)) { row.issues.push("batch:raw-build-mismatch"); result.issues.push("batch:raw-build-mismatch"); }
    if (!timestamp(raw.endedAt) || !timestamp(value.exportedAt) || Date.parse(raw.endedAt) > Date.parse(value.exportedAt)) row.issues.push("batch:record-after-export");
    else row.endedAt = raw.endedAt;
    try { row.issues.push(...evaluateMainlineAResourceObservationV633(raw).issues); }
    catch { row.issues.push("batch:raw-evaluation-error"); }
    const cycle = raw.objectCycle;
    if (!isRow(cycle) || !isRow(cycle.target)) { row.issues.push("batch:canonical-cycle-required"); return; }
    const target = cycle.target;
    const key = `${target.kind}:${target.id}`;
    const expected = targetRows.get(key);
    if (!expected || target.route !== expected.route.route || target.assetHash !== expected.route.assetHash
      || cycle.manifestDigest !== CANONICAL_COVERAGE_SHA256_V635) {
      row.issues.push("batch:canonical-target-mismatch"); result.issues.push("batch:canonical-target-mismatch"); return;
    }
    row.key = canonicalTargetKeyV635({ kind: expected.kind as "star" | "nebula" | "constellation", id: expected.id });
    row.issues = [...new Set(row.issues)];
    if (!row.issues.length) row.status = "measured-local";
    const previous = latest.get(key);
    if (previous && row.endedAt && previous.endedAt && Date.parse(row.endedAt) <= Date.parse(previous.endedAt)) {
      row.issues.push("batch:retry-order"); row.status = "blocked"; result.issues.push("batch:retry-order");
    }
    latest.set(key, row);
  });
  if (totalBytes > CANONICAL_BATCH_MAX_BYTES_V638) result.issues.push("batch:byte-limit");
  result.latest = [...latest.values()].map((row) => ({ key: row.key!, runId: row.runId, index: row.index, status: row.status }));
  result.verified = result.latest.filter((row) => row.status === "measured-local").length;
  result.missing = [...targetRows.keys()].filter((key) => latest.get(key)?.status !== "measured-local");
  result.rejectedRuns = result.rows.filter((row) => row.status === "blocked").length;
  result.issues = [...new Set(result.issues)];
  if (!result.issues.length) result.status = result.verified === 36 ? "complete-local" : "partial-local";
  return result;
}

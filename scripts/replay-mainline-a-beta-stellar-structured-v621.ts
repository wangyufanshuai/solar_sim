/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  structuredCandidateJsonlV621,
  structuredPackBoundaryV621,
  structuredCandidateReportRowsV621,
  summarizeStructuredCandidatesV621,
  validateStructuredLedgerV621,
  type StructuredCandidateV621,
} from "../app/lib/mainlineABetaStellarStructuredEvidenceV621";

export const PACK_PATH = "app/data/mainlineABetaStellarStructuredCandidateV621.generated.json";
export const LEDGER_PATH = "app/data/mainlineABetaStellarRawAttemptLedgerV620.generated.json";
export const REPORT_PATH = "docs/release/v607/mainline-a-r61-structured-evidence-report.json";
export const JSONL_PATH = "docs/release/v607/mainline-a-r61-structured-evidence-report.jsonl";

function readJson(root: string, relative: string): any {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) throw new Error(`missing ${relative}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function sourceRef(candidate: any, index: number) {
  const source = candidate.sourceLedger;
  return { id: `${candidate.id}-source-${index}`, url: source.sourceUrl, role: "object", label: index === 0 ? "SIMBAD object page" : "raw artifact", sha256: index === 0 ? source.rawPageSha256 : source.rawPageSha256 } as const;
}

function componentRefs(candidate: any) {
  return (candidate.componentHints ?? []).map((hint: any, index: number) => ({
    id: `${candidate.id}-component-hint-${index}`,
    url: hint.sourceUrl,
    role: "component",
    label: `${hint.identifier} · identity hint only`,
    sha256: null,
  } as const));
}

function toEvidenceCandidate(candidate: any, ledgerRecord: any): StructuredCandidateV621 {
  const attempt = (ledgerRecord.attemptLedger ?? ledgerRecord.attempts ?? []).find((row: any) => row.responseCaptured === 1) ?? null;
  const captured = attempt?.responseCaptured === 1 ? 1 as const : 0 as const;
  const sourceRefs = [sourceRef(candidate, 0), sourceRef(candidate, 1)];
  const fields = {
    canonicalName: candidate.queryTitle,
    objectType: candidate.objectType,
    spectralType: candidate.spectralType,
    raDeg: candidate.raDeg,
    decDeg: candidate.decDeg,
    properMotionRaMasYr: candidate.properMotionRaMasYr,
    properMotionDecMasYr: candidate.properMotionDecMasYr,
    parallaxMas: candidate.parallaxMas ?? null,
    parallaxErrorMas: candidate.parallaxErrorMas ?? null,
    spectralQuality: candidate.spectralQuality ?? null,
    identifiers: candidate.identifiers.join(";"),
  };
  return Object.freeze({
    id: candidate.id,
    queryIdentifier: candidate.queryTitle ?? candidate.id,
    state: candidate.parseStatus === "parsed-candidate" ? "structured" : "blocked",
    raw: { captured, transport: attempt?.transport ?? "fixture-replay", sha256: attempt?.rawPageSha256 ?? null, responseBytes: attempt?.responseBytes ?? null, contentType: attempt?.contentType ?? null, sourceUrl: candidate.sourceLedger.sourceUrl },
    expectedSnapshotRecordDigest: ledgerRecord.expectedSnapshotRecordDigest,
    expectedProjectionRecordDigest: ledgerRecord.expectedProjectionRecordDigest,
    snapshotRecordDigest: ledgerRecord.expectedSnapshotRecordDigest,
    projectionRecordDigest: ledgerRecord.expectedProjectionRecordDigest,
    identity: { canonicalName: candidate.queryTitle, component: candidate.componentIdentityStatus === "confirmed" ? candidate.componentSourceReference : null },
    fields,
    sourceRefs,
    componentRefs: candidate.componentSourceReference
      ? [{ id: `${candidate.id}-component`, url: candidate.componentSourceReference, role: "component", label: "component identity", sha256: null }]
      : componentRefs(candidate),
    reviewDecision: "hold",
    runtimeAdmission: "candidate-only",
    measurementAdmission: "not-admitted",
    scientificPayloadWriteback: false,
  });
}

export function buildReport(root = process.cwd()) {
  const pack = readJson(root, PACK_PATH);
  const ledger = readJson(root, LEDGER_PATH);
  const byId = new Map(ledger.records.map((record: any) => [record.id, record]));
  const candidates = pack.records.map((candidate: any) => toEvidenceCandidate(candidate, byId.get(candidate.id)));
  const validation = validateStructuredLedgerV621(candidates);
  const summary = summarizeStructuredCandidatesV621(candidates);
  return {
    schema: "mainline-a-r61-structured-evidence-report-v621",
    generatedAt: new Date().toISOString(),
    source: { pack: PACK_PATH, ledger: LEDGER_PATH, packSchema: pack.schema, ledgerSchema: ledger.schema },
    summary,
    boundary: structuredPackBoundaryV621(candidates),
    validation,
    rows: structuredCandidateReportRowsV621(candidates),
    candidates,
  };
}

export function writeReport(root = process.cwd(), report = buildReport(root)) {
  fs.mkdirSync(path.dirname(path.join(root, REPORT_PATH)), { recursive: true });
  fs.writeFileSync(path.join(root, REPORT_PATH), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(root, JSONL_PATH), structuredCandidateJsonlV621(report.candidates) , "utf8");
  return { status: "generated", report: REPORT_PATH, jsonl: JSONL_PATH, total: report.candidates.length, valid: report.validation.valid };
}

export function verifyReport(root = process.cwd()) {
  const report = buildReport(root);
  const existing = readJson(root, REPORT_PATH);
  if (JSON.stringify(existing.candidates) !== JSON.stringify(report.candidates)) throw new Error("structured evidence candidates changed");
  if (!report.validation.valid) throw new Error(`structured evidence invalid: ${report.validation.errors.join(",")}`);
  return { status: "verified", report: REPORT_PATH, total: report.candidates.length, summary: report.summary, boundary: report.boundary };
}

export function verifyBoundary(report: ReturnType<typeof buildReport>) {
  const boundary = report.boundary;
  if (!boundary.candidateOnly || !boundary.hold || !boundary.notAdmitted || boundary.scientificPayloadWriteback !== false) {
    throw new Error("structured evidence boundary opened");
  }
  return Object.freeze({ candidateOnly: boundary.candidateOnly, hold: boundary.hold, notAdmitted: boundary.notAdmitted, scientificPayloadWriteback: boundary.scientificPayloadWriteback });
}

export function reportDigest(report: ReturnType<typeof buildReport>): string {
  const canonical = report.rows.map((row) => ({ id: row.id, state: row.state, score: row.score, blockers: row.blockers, sourceRefs: row.sourceRefs, componentRefs: row.componentRefs, writeback: row.writeback }));
  return createHash("sha256").update(JSON.stringify(canonical), "utf8").digest("hex");
}

export function stableReportSections(report: ReturnType<typeof buildReport>): readonly string[] {
  return Object.freeze([
    `schema=${report.schema}`,
    `total=${report.summary.total}`,
    `parsed=${report.candidates.filter((candidate) => candidate.state === "structured").length}`,
    `blocked=${report.summary.blocked}`,
    `averageScore=${report.summary.averageScore}`,
    `boundary=candidate-only,hold,not-admitted,writeback-false`,
    `digest=${reportDigest(report)}`,
  ]);
}

export function compareJsonl(root: string, report: ReturnType<typeof buildReport>): boolean {
  const file = path.join(root, JSONL_PATH);
  if (!fs.existsSync(file)) return false;
  const expected = structuredCandidateJsonlV621(report.candidates);
  return fs.readFileSync(file, "utf8") === expected;
}

export function replaySummary(root = process.cwd()) {
  const report = buildReport(root);
  verifyBoundary(report);
  const jsonlStable = compareJsonl(root, report);
  return Object.freeze({ digest: reportDigest(report), sections: stableReportSections(report), jsonlStable, validation: report.validation, summary: report.summary, boundary: report.boundary });
}

export function reportRowsById(report: ReturnType<typeof buildReport>): ReadonlyMap<string, any> {
  return new Map(report.rows.map((row) => [String(row.id), row]));
}

export function compareReports(previous: ReturnType<typeof buildReport>, current: ReturnType<typeof buildReport>) {
  const before = reportRowsById(previous);
  const after = reportRowsById(current);
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];
  for (const id of before.keys()) if (!after.has(id)) removed.push(id);
  for (const [id, row] of after) {
    const old = before.get(id);
    if (!old) added.push(id);
    else if (JSON.stringify(old) !== JSON.stringify(row)) changed.push(id);
  }
  return Object.freeze({ added: Object.freeze(added.sort()), removed: Object.freeze(removed.sort()), changed: Object.freeze(changed.sort()), identical: added.length === 0 && removed.length === 0 && changed.length === 0 });
}

export function enforceNoPromotion(report: ReturnType<typeof buildReport>) {
  const violations = report.candidates.flatMap((candidate) => {
    const errors: string[] = [];
    if (candidate.identity.component !== null) errors.push(`${candidate.id}:component-confirmed`);
    if (candidate.decision !== "hold") errors.push(`${candidate.id}:decision-opened`);
    if (candidate.runtimeAdmission !== "candidate-only") errors.push(`${candidate.id}:runtime-opened`);
    if (candidate.measurementAdmission !== "not-admitted") errors.push(`${candidate.id}:measurement-opened`);
    if (candidate.scientificPayloadWriteback !== false) errors.push(`${candidate.id}:writeback-opened`);
    return errors;
  });
  if (violations.length) throw new Error(`structured promotion boundary violated: ${violations.join(",")}`);
  return Object.freeze({ violations: 0, state: "candidate-only" as const });
}

export function sourceClosureMatrix(report: ReturnType<typeof buildReport>) {
  return Object.freeze(report.candidates.map((candidate) => Object.freeze({
    id: candidate.id,
    objectSources: candidate.sourceLedger.sourceUrl ? 1 : 0,
    rawHash: candidate.raw.sha256,
    citation: "pending",
    rights: "odbl-attribution-required",
    component: candidate.identity.component ? "confirmed" : "unresolved",
    closed: candidate.identity.component !== null && candidate.componentRefs.length > 0,
  })));
}

export function telemetryMatrix(root: string) {
  const ledger = readJson(root, LEDGER_PATH);
  return Object.freeze(ledger.records.map((record: any) => {
    const attempts = record.attemptLedger ?? record.attempts ?? [];
    const captured = attempts.filter((attempt: any) => attempt.responseCaptured === 1);
    return Object.freeze({ id: record.id, attempts: attempts.length, retries: attempts.reduce((sum: number, attempt: any) => sum + Number(attempt.retryCount ?? 0), 0), captured: captured.length, statuses: attempts.map((attempt: any) => attempt.httpStatus ?? null), timeouts: attempts.filter((attempt: any) => attempt.timeout === true).length, redirects: attempts.reduce((sum: number, attempt: any) => sum + (attempt.redirectChain?.length ?? 0), 0) });
  }));
}

export function reportManifest(root = process.cwd()) {
  const report = buildReport(root);
  enforceNoPromotion(report);
  verifyBoundary(report);
  return Object.freeze({ schema: report.schema, generatedAt: report.generatedAt, digest: reportDigest(report), sections: stableReportSections(report), sourceClosure: sourceClosureMatrix(report), telemetry: telemetryMatrix(root), rows: report.rows });
}

export function run(root = process.cwd(), check = false) {
  if (check) {
    const verified = verifyReport(root);
    const replay = replaySummary(root);
    if (!replay.jsonlStable) throw new Error("structured evidence JSONL changed");
    return { ...verified, digest: replay.digest, sections: replay.sections };
  }
  const written = writeReport(root);
  const replay = replaySummary(root);
  return { ...written, digest: replay.digest, sections: replay.sections };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(run(process.cwd(), process.argv.includes("--check")), null, 2)); }
  catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { buildPack } from "./build-mainline-a-canonical-coverage-v622";
import { coverageFreezeCandidateV622, coverageManifestSummaryV622, coverageReportJsonlV622, coveragePackValidationErrorsV622, coverageManifestDeltaV622 } from "../app/lib/mainlineACanonicalCoverageV622";
import { runFreezePreflightV622, freezeReportJsonV622, type FreezePreflightInputV622 } from "../app/lib/mainlineAFreezePreflightV622";

export const REPORT_PATH = "docs/release/v607/mainline-a-r62-freeze-replay.json";
export const JSONL_PATH = "docs/release/v607/mainline-a-r62-freeze-replay.jsonl";
export const COVERAGE_PATH = "app/data/mainlineACanonicalCoverageV622.generated.json";

const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex");

function readCoverage(root: string) {
  return JSON.parse(fs.readFileSync(path.join(root, COVERAGE_PATH), "utf8"));
}

function toFreezeInput(pack: any): FreezePreflightInputV622 {
  const rosters = ["star", "nebula", "constellation"].map((kind) => ({ kind: kind === "star" ? "stellar" : kind, ids: pack.records.filter((row: any) => row.kind === kind).map((row: any) => row.id) }));
  return { rosters, routes: [], lifecycle: [], candidateOnly: true, scientificPayloadWriteback: false } as FreezePreflightInputV622;
}

export function buildReplay(root = process.cwd()) {
  const pack = readCoverage(root);
  const rebuilt = buildPack();
  const errors = coveragePackValidationErrorsV622(pack as never);
  const freeze = runFreezePreflightV622(toFreezeInput(pack));
  const candidate = coverageFreezeCandidateV622(pack as never);
  const summary = coverageManifestSummaryV622(pack as never);
  const delta = coverageManifestDeltaV622(rebuilt as never, pack as never);
  return {
    schema: "mainline-a-r62-freeze-replay-v622",
    generatedAt: new Date().toISOString(),
    evidenceClass: "static" as const,
    evidenceScope: "static-only" as const,
    runtimeObserved: false as const,
    observedEvidence: { routes: 0, lifecycle: 0, source: "not-run" as const },
    source: { coverage: COVERAGE_PATH, coverageSchema: pack.schema },
    coverage: summary,
    candidate,
    freeze,
    validation: { errors, rebuiltDigest: digest(rebuilt.records), storedDigest: digest(pack.records), manifestEqual: delta.added.length === 0 && delta.removed.length === 0 && delta.changed.length === 0 },
    boundary: { candidateOnly: pack.boundary.candidateOnly, hold: pack.boundary.hold, notAdmitted: pack.boundary.notAdmitted, scientificPayloadWriteback: false, runtimeWrites: false, measurementWrites: false },
    jsonl: coverageReportJsonlV622(pack as never),
    freezeJson: freezeReportJsonV622(freeze),
  };
}

function replayPaths(root: string, reportPath: string) {
  const releaseRoot = path.resolve(root, "docs/release/v607");
  const report = path.resolve(root, reportPath);
  if (!report.startsWith(`${releaseRoot}${path.sep}`) || !report.endsWith(".json")) throw new Error("replay output must be a JSON file within docs/release/v607");
  return { report, jsonl: report.slice(0, -5) + ".jsonl" };
}

export function writeReplay(root = process.cwd(), report = buildReplay(root), reportPath = REPORT_PATH) {
  const outputs = replayPaths(root, reportPath);
  if (fs.existsSync(outputs.report) || fs.existsSync(outputs.jsonl)) throw new Error("replay output already exists; use --output with a new receipt path to preserve history");
  fs.mkdirSync(path.dirname(outputs.report), { recursive: true });
  fs.writeFileSync(outputs.report, `${JSON.stringify(report, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  fs.writeFileSync(outputs.jsonl, report.jsonl, { encoding: "utf8", flag: "wx" });
  return { status: "generated", report: path.relative(root, outputs.report).replaceAll("\\", "/"), jsonl: path.relative(root, outputs.jsonl).replaceAll("\\", "/"), coverage: report.coverage.counts, freezePassed: report.freeze.passed, candidateEligible: report.candidate.eligible, evidenceScope: report.evidenceScope, runtimeObserved: report.runtimeObserved };
}

export function verifyReplay(root = process.cwd(), reportPath = REPORT_PATH) {
  const report = buildReplay(root);
  if (report.validation.errors.length > 0) throw new Error(`coverage validation failed: ${report.validation.errors.join(",")}`);
  if (!report.validation.manifestEqual) throw new Error("coverage manifest is not deterministic");
  const existing = JSON.parse(fs.readFileSync(replayPaths(root, reportPath).report, "utf8"));
  if (existing.evidenceScope !== "static-only" || existing.runtimeObserved !== false || existing.freeze?.runtimeObserved !== false) throw new Error("legacy or unsupported replay evidence classification; historical receipt cannot establish runtime observation");
  if (JSON.stringify(existing.freeze) !== JSON.stringify(report.freeze)) throw new Error("freeze replay changed");
  if (existing.boundary.scientificPayloadWriteback !== false) throw new Error("writeback boundary opened");
  return { status: "verified", report: reportPath, coverage: report.coverage.counts, freezePassed: report.freeze.passed, issues: report.freeze.issues.length, candidateEligible: report.candidate.eligible, evidenceScope: report.evidenceScope, runtimeObserved: report.runtimeObserved };
}

export function freezeIssueMatrix(report: ReturnType<typeof buildReplay>) {
  const matrix: Record<string, number> = {};
  for (const issue of report.freeze.issues) matrix[issue.code] = (matrix[issue.code] ?? 0) + 1;
  return Object.freeze(Object.fromEntries(Object.entries(matrix).sort(([a], [b]) => a.localeCompare(b))));
}

export function canonicalKindRows(report: ReturnType<typeof buildReplay>, kind: string) {
  void kind;
  return Object.freeze(report.coverage.counts && report.coverage.status ? report.coverage.status : {});
}

export function routeHealth(report: ReturnType<typeof buildReplay>) {
  const rows = report.coverage;
  const errors = Array.isArray(rows.errors) ? rows.errors : [];
  const routeIssues = report.freeze.issues.filter((issue) => issue.code.startsWith("route-"));
  return Object.freeze({ valid: errors.length === 0 && routeIssues.length === 0 && report.runtimeObserved, staticCoverageValid: errors.length === 0, errors, routeIssues, routes: rows.routes ?? {}, lifecycle: rows.lifecycle ?? {}, evidenceScope: "static-only", runtimeObserved: false, observedRoutes: report.observedEvidence.routes });
}

export function lifecycleHealth(report: ReturnType<typeof buildReplay>) {
  const lifecycle = report.coverage.lifecycle ?? {};
  const released = Number(lifecycle["runtime-cleared"] ?? 0) + Number(lifecycle["asset-delivered"] ?? 0);
  return Object.freeze({ catalogMapped: Number(lifecycle["catalog-mapped"] ?? 0), delivered: released, leakCount: null, releaseRequired: true, status: "not-run", evidenceScope: "static-only", runtimeObserved: false, observedLifecycleEntries: report.observedEvidence.lifecycle });
}

export function freezeGateNarrative(report: ReturnType<typeof buildReplay>): readonly string[] {
  const lines: string[] = [];
  lines.push(`canonical coverage ${report.coverage.counts.stars}/${report.coverage.counts.nebulae}/${report.coverage.counts.constellations}`);
  lines.push(`freeze preflight ${report.freeze.passed ? "passed" : "blocked"}`);
  lines.push("static-only; runtimeObserved=false; routes and resource release require independent runtime evidence");
  lines.push(`candidate eligibility ${report.candidate.eligible ? "ready" : "hold"}`);
  lines.push(`open reasons ${report.candidate.reasons.join("; ") || "none"}`);
  lines.push("scientificPayloadWriteback=false");
  return Object.freeze(lines);
}

export function reportIntegrity(report: ReturnType<typeof buildReplay>) {
  const errors: string[] = [];
  if (report.validation.errors.length) errors.push(...report.validation.errors);
  if (report.boundary.scientificPayloadWriteback !== false) errors.push("writeback-boundary");
  if (report.boundary.candidateOnly !== true) errors.push("candidate-boundary");
  if (report.boundary.notAdmitted !== true) errors.push("measurement-boundary");
  if (report.coverage.counts.total !== 36) errors.push("total-count");
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), digest: digest({ validation: report.validation, boundary: report.boundary, counts: report.coverage.counts }) });
}

export function buildFreezeReceipt(root = process.cwd()) {
  const report = buildReplay(root);
  const integrity = reportIntegrity(report);
  return Object.freeze({ schema: report.schema, generatedAt: report.generatedAt, evidenceScope: report.evidenceScope, runtimeObserved: report.runtimeObserved, manifestDigest: report.validation.storedDigest, coverage: report.coverage.counts, gate: { passed: report.freeze.passed, candidateEligible: report.candidate.eligible, issues: report.freeze.issues.length }, issueMatrix: freezeIssueMatrix(report), routeHealth: routeHealth(report), lifecycleHealth: lifecycleHealth(report), narrative: freezeGateNarrative(report), integrity });
}

export function freezeReceiptJson(root = process.cwd()): string {
  return `${JSON.stringify(buildFreezeReceipt(root), null, 2)}\n`;
}

export function freezeReceiptJsonl(root = process.cwd()): string {
  const receipt = buildFreezeReceipt(root);
  return `${[JSON.stringify({ section: "meta", schema: receipt.schema, generatedAt: receipt.generatedAt, manifestDigest: receipt.manifestDigest }), JSON.stringify({ section: "coverage", ...receipt.coverage }), JSON.stringify({ section: "gate", ...receipt.gate }), JSON.stringify({ section: "integrity", ...receipt.integrity })].join("\n")}\n`;
}

export function coverageStatusByKind(report: ReturnType<typeof buildReplay>) {
  const result: Record<string, Record<string, number>> = {};
  for (const kind of ["star", "nebula", "constellation"]) result[kind] = {};
  if (report.coverage.status) Object.keys(result).forEach((key) => { result[key] = { ...result[key] }; });
  return Object.freeze(result);
}

export function pendingReasonCounts(report: ReturnType<typeof buildReplay>) {
  const counts: Record<string, number> = {};
  for (const reason of report.candidate.reasons) counts[reason] = (counts[reason] ?? 0) + 1;
  return Object.freeze(counts);
}

export function freezeReplayFingerprint(report: ReturnType<typeof buildReplay>): string {
  return digest({ manifest: report.validation.storedDigest, freeze: report.freeze.fingerprint, boundary: report.boundary, candidate: report.candidate });
}

export function freezeReplayStable(root = process.cwd()): boolean {
  const first = buildReplay(root);
  const second = buildReplay(root);
  return freezeReplayFingerprint(first) === freezeReplayFingerprint(second);
}

export function assertFreezeReplayStable(root = process.cwd()): void {
  if (!freezeReplayStable(root)) throw new Error("freeze replay fingerprint is not deterministic");
}

export function openGateCount(report: ReturnType<typeof buildReplay>): number {
  return report.candidate.reasons.length + report.coverage.pending;
}

export function freezeDecision(report: ReturnType<typeof buildReplay>): "hold" | "ready" {
  return report.runtimeObserved && report.freeze.runtimeObserved && report.freeze.passed && report.candidate.eligible && report.validation.errors.length === 0 ? "ready" : "hold";
}

export function freezeDecisionReason(report: ReturnType<typeof buildReplay>): string {
  if (freezeDecision(report) === "ready") return "all canonical freeze gates closed";
  if (!report.runtimeObserved) return "runtime route and resource lifecycle observations missing; static coverage cannot establish freeze readiness";
  return report.candidate.reasons.join("; ") || "pending human signoff or rights evidence";
}

export function emitFreezeConsoleSummary(report: ReturnType<typeof buildReplay>): string {
  const lines = [...freezeGateNarrative(report)];
  lines.push(`openGateCount=${openGateCount(report)}`);
  lines.push(`decision=${freezeDecision(report)}`);
  lines.push(`reason=${freezeDecisionReason(report)}`);
  return lines.join("\n");
}

export function run(root = process.cwd(), check = false, reportPath = REPORT_PATH) { return check ? verifyReplay(root, reportPath) : writeReplay(root, buildReplay(root), reportPath); }

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const outputFlag = process.argv.indexOf("--output");
    const outputPath = outputFlag < 0 ? REPORT_PATH : process.argv[outputFlag + 1];
    if (!outputPath || outputPath.startsWith("--")) throw new Error("--output requires a receipt path");
    console.log(JSON.stringify(run(process.cwd(), process.argv.includes("--check"), outputPath), null, 2));
  }
  catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }
}

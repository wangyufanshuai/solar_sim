import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import {
  BROWSER_EVIDENCE_SESSION_MAX_BYTES_V639,
  browserEvidenceSessionBatchV639,
  decodeBrowserEvidenceSessionV639,
  encodeBrowserEvidenceSessionV639,
  sessionHasBlockedLatestV639,
  summarizeBrowserEvidenceSessionV639,
  validateBrowserEvidenceSessionV639,
  type BrowserEvidenceBuildV639,
  type BrowserEvidenceSessionV639,
} from "../app/lib/mainlineABrowserEvidenceSessionV639";

export const BROWSER_EVIDENCE_SESSION_AUDIT_SCHEMA_V639 = "mainline-a-browser-evidence-session-audit-v639" as const;
export const BROWSER_EVIDENCE_SESSION_AUDIT_MAX_INPUT_BYTES_V639 = BROWSER_EVIDENCE_SESSION_MAX_BYTES_V639;
export const BROWSER_EVIDENCE_SESSION_AUDIT_MAX_OUTPUT_BYTES_V639 = 2 * 1024 * 1024;

type Row = Record<string, unknown>;
type AuditOptionsV639 = Readonly<{
  root: string;
  input: string;
  buildReceipt: string;
  output: string;
  expectedSha256?: string;
  requireComplete?: boolean;
}>;

type FileReferenceV639 = Readonly<{
  path: string;
  bytes: number;
  sha256: string;
}>;

type AuditResultV639 = Readonly<{
  schema: typeof BROWSER_EVIDENCE_SESSION_AUDIT_SCHEMA_V639;
  auditedAt: string;
  status: "measured-local" | "partial-local" | "blocked";
  evidenceClass: "offline-replay-of-browser-session-ledger";
  input: FileReferenceV639;
  buildReceipt: FileReferenceV639;
  build: BrowserEvidenceBuildV639;
  validation: ReturnType<typeof validateBrowserEvidenceSessionV639>;
  summary: ReturnType<typeof summarizeBrowserEvidenceSessionV639>;
  batch: NonNullable<ReturnType<typeof browserEvidenceSessionBatchV639>["evaluation"]> | null;
  rawRecords: { runId: string; targetKey: string | null; bytes: number; sha256: string; status: string; issues: readonly string[] }[];
  eventCounts: Record<string, number>;
  negativeChecks: { name: string; status: "passed" | "failed"; detail: string }[];
  limits: {
    browserAuthenticity: false;
    rightsApproval: false;
    scientificValidity: false;
    productionPerformance: false;
    physicalMobile: "not-run";
    payloadWriteback: false;
  };
  boundary: { candidateOnly: true; hold: true; notAdmitted: true; scientificPayloadWriteback: false; rightsApproval: false };
}>;

const SHA256 = /^[a-f0-9]{64}$/u;
const safeRow = (value: unknown): value is Row => Boolean(value && typeof value === "object" && !Array.isArray(value));
const hashBytes = (value: Uint8Array): string => createHash("sha256").update(value).digest("hex");

function normalizeRelative(value: string): string {
  const normalized = value.replaceAll("\\", "/").replace(/^\/+/, "");
  if (!normalized || normalized.split("/").some((segment) => !segment || segment === "." || segment === "..")) throw new Error("session-audit:path");
  return normalized;
}

async function boundedFile(root: string, requested: string, maximum: number): Promise<{ absolute: string; reference: FileReferenceV639; raw: Uint8Array }> {
  const relative = normalizeRelative(requested);
  const absolute = path.resolve(root, relative);
  const rootAbsolute = path.resolve(root) + path.sep;
  if (!absolute.startsWith(rootAbsolute)) throw new Error("session-audit:path-boundary");
  const metadata = await stat(absolute);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > maximum) throw new Error("session-audit:file-size");
  const raw = new Uint8Array(await readFile(absolute));
  if (raw.byteLength > maximum) throw new Error("session-audit:file-size");
  return { absolute, raw, reference: { path: relative, bytes: raw.byteLength, sha256: hashBytes(raw) } };
}

async function writeAudit(root: string, requested: string, value: unknown): Promise<FileReferenceV639> {
  const relative = normalizeRelative(requested);
  const absolute = path.resolve(root, relative);
  const rootAbsolute = path.resolve(root) + path.sep;
  if (!absolute.startsWith(rootAbsolute)) throw new Error("session-audit:output-boundary");
  const raw = Buffer.from(JSON.stringify(value, null, 2) + "\n", "utf8");
  if (raw.byteLength > BROWSER_EVIDENCE_SESSION_AUDIT_MAX_OUTPUT_BYTES_V639) throw new Error("session-audit:output-size");
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, raw, { flag: "wx" });
  return { path: relative, bytes: raw.byteLength, sha256: hashBytes(raw) };
}

async function readBuild(root: string, requested: string): Promise<{ value: Row; reference: FileReferenceV639 }> {
  const file = await boundedFile(root, requested, 8 * 1024 * 1024);
  const parsed: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(file.raw));
  if (!safeRow(parsed)) throw new Error("session-audit:build-shape");
  if (parsed.status !== "passed" || parsed.exitCode !== 0 || parsed.sourceStable !== true) throw new Error("session-audit:build-not-passed");
  if (typeof parsed.runtimeBuildId !== "string" || typeof parsed.branch !== "string" || typeof parsed.head !== "string") throw new Error("session-audit:build-identity");
  return { value: parsed, reference: file.reference };
}

function expectedBuild(value: Row): BrowserEvidenceBuildV639 {
  return { buildId: String(value.runtimeBuildId), branch: String(value.branch), head: String(value.head) };
}

function negativeCheck(name: string, operation: () => void): { name: string; status: "passed" | "failed"; detail: string } {
  try {
    operation();
    return { name, status: "failed", detail: "tampered input was accepted" };
  } catch (error) {
    return { name, status: "passed", detail: error instanceof Error ? error.message : String(error) };
  }
}

function runNegativeChecks(session: BrowserEvidenceSessionV639, build: BrowserEvidenceBuildV639) {
  const encoded = encodeBrowserEvidenceSessionV639(session);
  const checks = [
    ...(session.records.length ? [
    negativeCheck("raw-json-byte-tamper", () => {
      const altered = JSON.parse(encoded) as Row;
      const records = altered.records as Row[];
      records[0]!.rawJson = `${String(records[0]!.rawJson)} `;
      decodeBrowserEvidenceSessionV639(JSON.stringify(altered), build);
    }),
    negativeCheck("raw-sha-tamper", () => {
      const altered = JSON.parse(encoded) as Row;
      const records = altered.records as Row[];
      records[0]!.rawSha256 = "0".repeat(64);
      decodeBrowserEvidenceSessionV639(JSON.stringify(altered), build);
    }),
    ] : []),
    negativeCheck("boundary-tamper", () => {
      const altered = JSON.parse(encoded) as Row;
      altered.boundary = { candidateOnly: true, hold: false, notAdmitted: true, scientificPayloadWriteback: false, rightsApproval: false };
      decodeBrowserEvidenceSessionV639(JSON.stringify(altered), build);
    }),
    negativeCheck("build-mismatch", () => decodeBrowserEvidenceSessionV639(encoded, { ...build, head: "0".repeat(40) })),
    negativeCheck("manifest-tamper", () => {
      const altered = JSON.parse(encoded) as Row;
      altered.manifestDigest = "0".repeat(64);
      decodeBrowserEvidenceSessionV639(JSON.stringify(altered), build);
    }),
  ];
  return checks;
}

function eventCounts(session: BrowserEvidenceSessionV639): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of session.events) counts[entry.type] = (counts[entry.type] ?? 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

export async function auditBrowserEvidenceSessionV639(options: AuditOptionsV639): Promise<{ report: AuditResultV639; receipt: FileReferenceV639 }> {
  const root = path.resolve(options.root);
  const input = await boundedFile(root, options.input, BROWSER_EVIDENCE_SESSION_AUDIT_MAX_INPUT_BYTES_V639);
  if (options.expectedSha256 && (!SHA256.test(options.expectedSha256) || input.reference.sha256 !== options.expectedSha256)) throw new Error("session-audit:input-sha-mismatch");
  const raw = new TextDecoder("utf-8", { fatal: true }).decode(input.raw);
  const parsed: unknown = JSON.parse(raw);
  const validation = validateBrowserEvidenceSessionV639(parsed);
  if (!validation.valid) throw new Error(`session-audit:input-invalid:${validation.issues.map((issue) => issue.code).join(",")}`);
  const buildReceipt = await readBuild(root, options.buildReceipt);
  const build = expectedBuild(buildReceipt.value);
  const session = decodeBrowserEvidenceSessionV639(raw, build);
  const summary = summarizeBrowserEvidenceSessionV639(session, "available");
  const batch = browserEvidenceSessionBatchV639(session).evaluation;
  const rawRecords = session.records.map((record) => ({ runId: record.runId, targetKey: record.targetKey, bytes: record.bytes, sha256: record.rawSha256, status: record.status, issues: record.issues }));
  const negativeChecks = runNegativeChecks(session, build);
  const negativePass = negativeChecks.every((check) => check.status === "passed");
  const status = validation.valid && negativePass && !sessionHasBlockedLatestV639(session)
    ? batch?.verified === 36 && batch.status === "complete-local" ? "measured-local" : "partial-local"
    : "blocked";
  const report: AuditResultV639 = {
    schema: BROWSER_EVIDENCE_SESSION_AUDIT_SCHEMA_V639,
    auditedAt: new Date().toISOString(),
    status,
    evidenceClass: "offline-replay-of-browser-session-ledger",
    input: input.reference,
    buildReceipt: buildReceipt.reference,
    build,
    validation,
    summary,
    batch,
    rawRecords,
    eventCounts: eventCounts(session),
    negativeChecks,
    limits: { browserAuthenticity: false, rightsApproval: false, scientificValidity: false, productionPerformance: false, physicalMobile: "not-run", payloadWriteback: false },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false, rightsApproval: false },
  };
  if (options.requireComplete && report.status !== "measured-local") throw new Error(`session-audit:complete-required:${report.status}`);
  const receipt = await writeAudit(root, options.output, report);
  return { report, receipt };
}

export function parseBrowserEvidenceSessionAuditArgumentsV639(argv: readonly string[], root: string): AuditOptionsV639 {
  const flags = new Map<string, string>();
  let requireComplete = false;
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === "--require-complete") { if (requireComplete) throw new Error("session-audit:duplicate-flag"); requireComplete = true; continue; }
    if (!["--input", "--build-receipt", "--output", "--expected-sha256"].includes(flag ?? "")) throw new Error(`session-audit:argument:${flag}`);
    const value = argv[++index];
    if (!value || value.startsWith("--") || flags.has(flag!)) throw new Error(`session-audit:argument:${flag}`);
    flags.set(flag!, value);
  }
  for (const flag of ["--input", "--build-receipt", "--output"]) if (!flags.has(flag)) throw new Error(`session-audit:required:${flag}`);
  return { root, input: flags.get("--input")!, buildReceipt: flags.get("--build-receipt")!, output: flags.get("--output")!, expectedSha256: flags.get("--expected-sha256"), requireComplete };
}

export function auditSummaryV639(report: AuditResultV639): string {
  const keys = new Set(report.rawRecords.flatMap((record) => record.targetKey ? [record.targetKey] : []));
  return `${report.status} · ${report.summary.verified}/36 verified · ${report.summary.blockedRecords} blocked · ${keys.size} keys`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  auditBrowserEvidenceSessionV639(parseBrowserEvidenceSessionAuditArgumentsV639(process.argv.slice(2), process.cwd()))
    .then(({ report, receipt }) => {
      process.stdout.write(`${JSON.stringify({ status: report.status, verified: report.summary.verified, receipt }, null, 2)}\n`);
      process.exitCode = report.status === "blocked" ? 1 : 0;
    })
    .catch((error: unknown) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 2;
    });
}

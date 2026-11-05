import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BROWSER_EVIDENCE_RECOVERY_MAX_INPUT_BYTES_V640,
  BROWSER_EVIDENCE_RECOVERY_MAX_OUTPUT_BYTES_V640,
  createBrowserEvidenceRecoveryReportV640,
  encodeBrowserEvidenceRecoveryReportV640,
  planBrowserEvidenceRecoveryV640,
  recoverBrowserEvidenceSessionV640,
  recoverySummaryV640,
  verifyBrowserEvidenceRecoveryReportV640,
  type BrowserEvidenceBuildV639,
  type BrowserEvidenceRecoveryInputV640,
  type BrowserEvidenceRecoveryReportV640,
} from "../app/lib/mainlineABrowserEvidenceRecoveryV640";

export const BROWSER_EVIDENCE_RECOVERY_CLI_SCHEMA_V640 = "mainline-a-browser-evidence-recovery-cli-v640" as const;
export const BROWSER_EVIDENCE_RECOVERY_CLI_MAX_PATHS_V640 = 32;
export const BROWSER_EVIDENCE_RECOVERY_CLI_MAX_BUILD_BYTES_V640 = 8 * 1024 * 1024;

type Row = Record<string, unknown>;
type Options = Readonly<{
  root: string;
  inputs: readonly string[];
  buildReceipt: string;
  output: string;
  check: boolean;
  requireMerge: boolean;
  expectedSha256: string | undefined;
}>;

const sha256 = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");
const SHA256 = /^[a-f0-9]{64}$/u;
const isRow = (value: unknown): value is Row => Boolean(value && typeof value === "object" && !Array.isArray(value));

function usage(): string {
  return [
    "Usage: tsx scripts/recover-mainline-a-browser-evidence-session-v640.ts",
    "  --input <session-json> [--input <session-json> ...]",
    "  --build-receipt <passed-build-json> --output <recovery-report-json>",
    "  [--check] [--require-merge] [--expected-sha256 <hex>]",
    "",
    "The command only reads session inputs and a passed build receipt. Normal mode",
    "creates a new report with exclusive write; --check verifies an existing report.",
  ].join("\n");
}

function normalizeRelative(value: string): string {
  const normalized = value.replaceAll("\\", "/").replace(/^\/+/, "");
  if (!normalized || normalized.split("/").some((part) => !part || part === "." || part === "..")) throw new Error("recovery-cli:path");
  return normalized;
}

function absoluteWithin(root: string, requested: string): { relative: string; absolute: string } {
  const relative = normalizeRelative(requested);
  const absolute = path.resolve(root, relative);
  const prefix = path.resolve(root) + path.sep;
  if (!absolute.startsWith(prefix)) throw new Error("recovery-cli:path-boundary");
  return { relative, absolute };
}

async function readBounded(root: string, requested: string, maximum: number): Promise<{ relative: string; raw: Uint8Array; sha256: string }> {
  const location = absoluteWithin(root, requested);
  const metadata = await stat(location.absolute);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > maximum) throw new Error(`recovery-cli:file-size:${location.relative}`);
  const raw = new Uint8Array(await readFile(location.absolute));
  if (raw.byteLength > maximum) throw new Error(`recovery-cli:file-size:${location.relative}`);
  return { relative: location.relative, raw, sha256: sha256(raw) };
}

async function readBuild(root: string, requested: string): Promise<{ build: BrowserEvidenceBuildV639; reference: { path: string; bytes: number; sha256: string } }> {
  const file = await readBounded(root, requested, BROWSER_EVIDENCE_RECOVERY_CLI_MAX_BUILD_BYTES_V640);
  let value: unknown;
  try { value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(file.raw)); } catch { throw new Error("recovery-cli:build-json"); }
  if (!isRow(value) || value.status !== "passed" || value.exitCode !== 0 || value.sourceStable !== true) throw new Error("recovery-cli:build-not-passed");
  if (typeof value.runtimeBuildId !== "string" || typeof value.branch !== "string" || typeof value.head !== "string") throw new Error("recovery-cli:build-identity");
  return { build: { buildId: value.runtimeBuildId, branch: value.branch, head: value.head }, reference: { path: file.relative, bytes: file.raw.byteLength, sha256: file.sha256 } };
}

async function readInput(root: string, requested: string): Promise<BrowserEvidenceRecoveryInputV640> {
  const location = absoluteWithin(root, requested);
  let metadata;
  try {
    metadata = await stat(location.absolute);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { source: location.relative, raw: null };
    throw error;
  }
  if (!metadata.isFile()) throw new Error(`recovery-cli:input-not-file:${location.relative}`);
  if (metadata.size > BROWSER_EVIDENCE_RECOVERY_MAX_INPUT_BYTES_V640) throw new Error(`recovery-cli:input-oversize:${location.relative}`);
  const raw = new Uint8Array(await readFile(location.absolute));
  if (raw.byteLength > BROWSER_EVIDENCE_RECOVERY_MAX_INPUT_BYTES_V640) throw new Error(`recovery-cli:input-oversize:${location.relative}`);
  return { source: location.relative, raw: new TextDecoder("utf-8", { fatal: true }).decode(raw) };
}

function parseArguments(argv: readonly string[], root: string): Options {
  const inputs: string[] = [];
  let buildReceipt: string | undefined;
  let output: string | undefined;
  let check = false;
  let requireMerge = false;
  let expectedSha256: string | undefined;
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === "--check") { if (check) throw new Error("recovery-cli:duplicate-check"); check = true; continue; }
    if (flag === "--require-merge") { if (requireMerge) throw new Error("recovery-cli:duplicate-require-merge"); requireMerge = true; continue; }
    if (!["--input", "--build-receipt", "--output", "--expected-sha256"].includes(flag ?? "")) throw new Error(`recovery-cli:argument:${flag}`);
    const value = argv[++index];
    if (!value || value.startsWith("--")) throw new Error(`recovery-cli:value:${flag}`);
    if (flag === "--input") inputs.push(value);
    else if (flag === "--build-receipt") { if (buildReceipt) throw new Error("recovery-cli:duplicate-build"); buildReceipt = value; }
    else if (flag === "--output") { if (output) throw new Error("recovery-cli:duplicate-output"); output = value; }
    else { if (expectedSha256) throw new Error("recovery-cli:duplicate-sha"); expectedSha256 = value; }
  }
  if (inputs.length > BROWSER_EVIDENCE_RECOVERY_CLI_MAX_PATHS_V640) throw new Error("recovery-cli:input-limit");
  if (!inputs.length && !check) throw new Error("recovery-cli:required-input");
  if (!buildReceipt) throw new Error("recovery-cli:required-build");
  if (!output) throw new Error("recovery-cli:required-output");
  if (expectedSha256 && !SHA256.test(expectedSha256)) throw new Error("recovery-cli:sha");
  return { root, inputs, buildReceipt, output, check, requireMerge, expectedSha256 };
}

async function writeExclusive(root: string, requested: string, value: string): Promise<{ path: string; bytes: number; sha256: string }> {
  const location = absoluteWithin(root, requested);
  const raw = Buffer.from(value, "utf8");
  if (raw.byteLength > BROWSER_EVIDENCE_RECOVERY_MAX_OUTPUT_BYTES_V640) throw new Error("recovery-cli:output-size");
  await mkdir(path.dirname(location.absolute), { recursive: true });
  await writeFile(location.absolute, raw, { flag: "wx" });
  return { path: location.relative, bytes: raw.byteLength, sha256: sha256(raw) };
}

async function readExistingReport(root: string, requested: string): Promise<{ report: BrowserEvidenceRecoveryReportV640; raw: string; sha256: string }> {
  const file = await readBounded(root, requested, BROWSER_EVIDENCE_RECOVERY_MAX_OUTPUT_BYTES_V640);
  let value: unknown;
  try { value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(file.raw)); } catch { throw new Error("recovery-cli:report-json"); }
  if (!isRow(value) || value.schema !== "mainline-a-browser-evidence-recovery-v640") throw new Error("recovery-cli:report-schema");
  return { report: value as unknown as BrowserEvidenceRecoveryReportV640, raw: new TextDecoder().decode(file.raw), sha256: file.sha256 };
}

function printReport(report: BrowserEvidenceRecoveryReportV640, output: { path: string; bytes: number; sha256: string } | null): void {
  process.stdout.write(`${JSON.stringify({ schema: BROWSER_EVIDENCE_RECOVERY_CLI_SCHEMA_V640, status: report.action, summary: recoverySummaryV640(report), output }, null, 2)}\n`);
}

export async function runBrowserEvidenceRecoveryV640(options: Options): Promise<BrowserEvidenceRecoveryReportV640> {
  const buildResult = await readBuild(options.root, options.buildReceipt);
  const inputs = await Promise.all(options.inputs.map((input) => readInput(options.root, input)));
  const plan = planBrowserEvidenceRecoveryV640(inputs, buildResult.build);
  if (options.requireMerge && plan.action !== "merge") throw new Error(`recovery-cli:merge-required:${plan.action}`);
  const recovered = recoverBrowserEvidenceSessionV640(plan);
  const report = createBrowserEvidenceRecoveryReportV640(plan, recovered);
  const verification = verifyBrowserEvidenceRecoveryReportV640(report);
  if (!verification.valid) throw new Error(`recovery-cli:report-invalid:${verification.issues.join(",")}`);
  if (options.check) return report;
  const encoded = `${encodeBrowserEvidenceRecoveryReportV640(report)}\n`;
  const output = await writeExclusive(options.root, options.output, encoded);
  printReport(report, output);
  return report;
}

export async function checkBrowserEvidenceRecoveryV640(options: Options): Promise<BrowserEvidenceRecoveryReportV640> {
  const buildResult = await readBuild(options.root, options.buildReceipt);
  const existing = await readExistingReport(options.root, options.output);
  if (options.expectedSha256 && existing.sha256 !== options.expectedSha256) throw new Error("recovery-cli:report-sha-mismatch");
  if (!Array.isArray(existing.report.sources) || existing.report.sources.length > BROWSER_EVIDENCE_RECOVERY_CLI_MAX_PATHS_V640) throw new Error("recovery-cli:report-sources");
  const verification = verifyBrowserEvidenceRecoveryReportV640(existing.report);
  if (!verification.valid) throw new Error(`recovery-cli:report-invalid:${verification.issues.join(",")}`);
  if (existing.report.expectedBuild.buildId !== buildResult.build.buildId
    || existing.report.expectedBuild.branch !== buildResult.build.branch
    || existing.report.expectedBuild.head !== buildResult.build.head) throw new Error("recovery-cli:report-build-mismatch");
  const reportedInputs = existing.report.sources.map((source) => normalizeRelative(source.source));
  const providedInputs = options.inputs.map(normalizeRelative);
  if (providedInputs.length && (providedInputs.length !== reportedInputs.length
    || providedInputs.some((source, index) => source !== reportedInputs[index]))) throw new Error("recovery-cli:input-list-mismatch");
  const inputs = await Promise.all(reportedInputs.map((source) => readInput(options.root, source)));
  const plan = planBrowserEvidenceRecoveryV640(inputs, buildResult.build, existing.report.generatedAt);
  const replayed = createBrowserEvidenceRecoveryReportV640(plan, recoverBrowserEvidenceSessionV640(plan), existing.report.generatedAt);
  const replayVerification = verifyBrowserEvidenceRecoveryReportV640(replayed);
  if (!replayVerification.valid) throw new Error(`recovery-cli:replay-invalid:${replayVerification.issues.join(",")}`);
  if (JSON.stringify(replayed) !== JSON.stringify(existing.report)) throw new Error("recovery-cli:report-replay-mismatch");
  if (options.requireMerge && existing.report.action !== "merge") throw new Error(`recovery-cli:merge-required:${existing.report.action}`);
  process.stdout.write(`${JSON.stringify({ schema: BROWSER_EVIDENCE_RECOVERY_CLI_SCHEMA_V640, status: "checked", summary: recoverySummaryV640(existing.report), report: existing.sha256 }, null, 2)}\n`);
  return existing.report;
}

export async function main(argv = process.argv.slice(2)): Promise<number> {
  try {
    const options = parseArguments(argv, process.cwd());
    if (options.check) { await checkBrowserEvidenceRecoveryV640(options); return 0; }
    await runBrowserEvidenceRecoveryV640(options);
    return 0;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n${usage()}\n`);
    return 2;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then((code) => { process.exitCode = code; });
}

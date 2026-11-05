import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { relativePath, safeFile, writeExclusiveJson } from "./mainline-a-release-evidence.mjs";
import {
  classifyMainlineAR65LongRunEvidenceV643,
  createMainlineAR65LongRunBuildIdentityV643,
  createPendingMainlineAR65LongRunReceiptV643,
  finalizeMainlineAR65LongRunReceiptV643,
  replayMainlineAR65LongRunReceiptV643,
  verifyMainlineAR65LongRunReceiptV643,
  MAINLINE_A_R65_LONGRUN_SCHEMA_V643,
  type MainlineAR65LongRunReceiptV643,
} from "../app/lib/mainlineAR65LongRunV643";

export const MAINLINE_A_R65_LONGRUN_DEFAULT_INPUT_V643 =
  "app/data/mainlineAR65LongRunV643.pending.generated.json";
export const MAINLINE_A_R65_LONGRUN_DEFAULT_OUTPUT_V643 =
  "docs/release/v607/mainline-a-r65-longrun-v643.json";
export const MAINLINE_A_R65_LONGRUN_DEFAULT_REPLAY_V643 =
  "docs/release/v607/mainline-a-r65-longrun-replay-v643.json";
export const MAINLINE_A_R65_LONGRUN_TOOL_SCHEMA_V643 =
  "mainline-a-r65-longrun-builder-v643" as const;

type CliOptions = Readonly<{
  input: string;
  output: string;
  replay: string;
  check: boolean;
  init: boolean;
  noWrite: boolean;
  json: boolean;
  requireQualified: boolean;
}>;

type ToolReport = Readonly<{
  schema: typeof MAINLINE_A_R65_LONGRUN_TOOL_SCHEMA_V643;
  generatedAt: string;
  input: string;
  output: string;
  replay: string;
  sourceSha256: string;
  receiptSchema: string | null;
  receiptVersion: string | null;
  inputVerification: ReturnType<typeof verifyMainlineAR65LongRunReceiptV643>;
  verification: ReturnType<typeof verifyMainlineAR65LongRunReceiptV643>;
  classification: ReturnType<typeof classifyMainlineAR65LongRunEvidenceV643>;
  replaySummary: ReturnType<typeof replayMainlineAR65LongRunReceiptV643>;
  boundary: Readonly<{
    candidateOnly: true;
    hold: true;
    notAdmitted: true;
    scientificPayloadWriteback: false;
  }>;
  claims: Readonly<{
    qualified: false | true;
    productionPerformance: false;
    realUserValidation: false;
    physicalMobile: false;
  }>;
}>;

function argumentValue(argv: readonly string[], name: string, fallback: string): string {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] ?? fallback : fallback;
}

function parseOptions(argv: readonly string[] = process.argv.slice(2)): CliOptions {
  return Object.freeze({
    input: argumentValue(argv, "--input", MAINLINE_A_R65_LONGRUN_DEFAULT_INPUT_V643),
    output: argumentValue(argv, "--output", MAINLINE_A_R65_LONGRUN_DEFAULT_OUTPUT_V643),
    replay: argumentValue(argv, "--replay", MAINLINE_A_R65_LONGRUN_DEFAULT_REPLAY_V643),
    check: argv.includes("--check"),
    init: argv.includes("--init"),
    noWrite: argv.includes("--no-write"),
    json: argv.includes("--json"),
    requireQualified: argv.includes("--require-qualified"),
  });
}

function workspaceRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function parseJson(text: string, file: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new Error(`invalid-json:${file}:${error instanceof Error ? error.message : String(error)}`);
  }
}

function gitValue(root: string, args: readonly string[], fallback: string): string {
  try {
    return execFileSync("git", [...args], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || fallback;
  } catch {
    return fallback;
  }
}

export function createMainlineAR65LongRunPendingV643(root = workspaceRoot()): MainlineAR65LongRunReceiptV643 {
  const head = gitValue(root, ["rev-parse", "HEAD"], "unknown-head");
  const branch = gitValue(root, ["branch", "--show-current"], "unknown-branch");
  const buildId = process.env.MAINLINE_BUILD_ID?.trim() || "pending-r65-v643";
  const runtimeBuildId = process.env.MAINLINE_RUNTIME_BUILD_ID?.trim() || "pending-runtime-r65-v643";
  return createPendingMainlineAR65LongRunReceiptV643(createMainlineAR65LongRunBuildIdentityV643({
    buildId,
    runtimeBuildId,
    branch,
    head,
    route: "/",
    source: "release-receipt",
  }));
}

function isReceipt(value: unknown): value is MainlineAR65LongRunReceiptV643 {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
    && (value as { schema?: unknown }).schema === MAINLINE_A_R65_LONGRUN_SCHEMA_V643;
}

function hardFailures(report: ToolReport): string[] {
  return [...report.inputVerification.issues, ...report.verification.issues].filter((issue) => {
    if (issue === "receipt:no-observations") return false;
    if (issue.includes("two-long-runs-required") || issue.includes("desktop-required") || issue.includes("mobile-viewport-required")) return false;
    if (issue.includes("receipt:static-digest")) return true;
    if (issue.includes("boundary") || issue.includes("schema") || issue.includes("version")) return true;
    if (issue.includes("observation:") && !issue.includes("duration-not-satisfied")) return true;
    return false;
  });
}

export function buildMainlineAR65LongRunReportV643(
  receipt: MainlineAR65LongRunReceiptV643,
  root = workspaceRoot(),
  inputPath = MAINLINE_A_R65_LONGRUN_DEFAULT_INPUT_V643,
  outputPath = MAINLINE_A_R65_LONGRUN_DEFAULT_OUTPUT_V643,
  replayPath = MAINLINE_A_R65_LONGRUN_DEFAULT_REPLAY_V643,
  sourceBytes: Uint8Array = new TextEncoder().encode(JSON.stringify(receipt)),
): ToolReport {
  const inputVerification = verifyMainlineAR65LongRunReceiptV643(receipt);
  const finalized = finalizeMainlineAR65LongRunReceiptV643(receipt);
  const verification = verifyMainlineAR65LongRunReceiptV643(finalized);
  const replaySummary = replayMainlineAR65LongRunReceiptV643(finalized);
  const classification = classifyMainlineAR65LongRunEvidenceV643(finalized);
  return Object.freeze({
    schema: MAINLINE_A_R65_LONGRUN_TOOL_SCHEMA_V643,
    generatedAt: new Date().toISOString(),
    input: relativePath(root, inputPath),
    output: relativePath(root, outputPath),
    replay: relativePath(root, replayPath),
    sourceSha256: sha256Hex(sourceBytes),
    receiptSchema: finalized.schema,
    receiptVersion: finalized.version,
    inputVerification,
    verification,
    classification,
    replaySummary,
    boundary: Object.freeze({
      candidateOnly: true,
      hold: true,
      notAdmitted: true,
      scientificPayloadWriteback: false,
    }),
    claims: Object.freeze({
      qualified: inputVerification.ok && verification.ok,
      productionPerformance: false,
      realUserValidation: false,
      physicalMobile: false,
    }),
  });
}

async function readReceipt(root: string, input: string): Promise<{ receipt: MainlineAR65LongRunReceiptV643; bytes: Uint8Array; path: string }> {
  const file = await safeFile(root, input);
  if (file.stat.size > 256 * 1024 * 1024) throw new Error(`receipt-size-limit:${file.relative}`);
  const bytes = await readFile(file.absolute);
  const parsed = parseJson(Buffer.from(bytes).toString("utf8"), file.relative);
  if (!isReceipt(parsed)) throw new Error(`receipt-schema-mismatch:${file.relative}`);
  return { receipt: parsed, bytes, path: file.absolute };
}

async function writeJson(root: string, file: string, value: unknown): Promise<void> {
  await writeExclusiveJson(root, file, value);
}

export async function runMainlineAR65LongRunBuilderV643(
  argv: readonly string[] = process.argv.slice(2),
): Promise<ToolReport> {
  const options = parseOptions(argv);
  const root = workspaceRoot();
  let receipt: MainlineAR65LongRunReceiptV643;
  let sourceBytes: Uint8Array;
  if (options.init) {
    receipt = createMainlineAR65LongRunPendingV643(root);
    sourceBytes = new TextEncoder().encode(JSON.stringify(receipt));
    if (!options.noWrite && !options.check) await writeJson(root, options.input, receipt);
  } else {
    const loaded = await readReceipt(root, options.input);
    receipt = loaded.receipt;
    sourceBytes = loaded.bytes;
  }
  const report = buildMainlineAR65LongRunReportV643(receipt, root, options.input, options.output, options.replay, sourceBytes);
  const finalized = finalizeMainlineAR65LongRunReceiptV643(receipt);
  const replay = replayMainlineAR65LongRunReceiptV643(finalized);
  if (!options.noWrite && !options.check) {
    await writeJson(root, options.output, finalized);
    await writeJson(root, options.replay, replay);
  }
  const shouldFail = options.requireQualified
    ? !report.claims.qualified
    : hardFailures(report).length > 0;
  if (options.json) console.log(JSON.stringify(report, null, 2));
  else {
    console.log(`R65 V643: ${report.verification.status} observations=${report.verification.observationChecks.length} complete=${report.verification.completeLongRuns} issues=${report.verification.issues.length}`);
    console.log(`static=${report.classification.static} browser=${report.classification.browser} performance=${report.classification.performance} physical-mobile=${report.classification.physicalMobile}`);
    console.log(`boundary=candidate-only/hold/not-admitted scientificPayloadWriteback=false`);
    console.log(`receipt=${report.output}`);
    console.log(`replay=${report.replay}`);
  }
  if (shouldFail) process.exitCode = 1;
  return report;
}

const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedFile && invokedFile === path.resolve(fileURLToPath(import.meta.url))) {
  runMainlineAR65LongRunBuilderV643().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

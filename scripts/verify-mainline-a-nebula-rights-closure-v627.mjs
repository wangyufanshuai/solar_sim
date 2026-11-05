import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  BATCH_PATH,
  LEDGER_PATH,
  BOUNDARY,
  DEFAULT_OUTPUT,
  DEFAULT_JSONL,
  DEFAULT_CSV,
  DEFAULT_MARKDOWN,
  ROOT,
  ROSTER,
  SHA256,
  canonicalize,
  sha256Bytes,
  readJsonAsync,
  safeWorkspacePath,
  containedPath,
  verifyReceiptShape,
  makeJsonl,
  makeCsv,
  makeMarkdown,
  buildClosure,
  scanTokens,
} from "./build-mainline-a-nebula-rights-closure-v627.mjs";

export const VERIFY_SCHEMA = "mainline-a-nebula-rights-closure-verifier-v627";
const pathFromModule = (relative) => path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", relative);

export function pathList(receipt) {
  const output = receipt?.output ?? DEFAULT_OUTPUT;
  return [output, receipt?.replay?.jsonl ?? DEFAULT_JSONL, receipt?.replay?.csv ?? DEFAULT_CSV, receipt?.replay?.markdown ?? DEFAULT_MARKDOWN];
}

export function checkRelativePath(root, relative, label) {
  const issues = [];
  if (typeof relative !== "string" || !relative) return [{ code: `${label}-missing`, detail: `${label} path is missing` }];
  if (!containedPath(root, relative, ["docs/release/v607"])) issues.push({ code: `${label}-outside-release-root`, detail: `${label} is outside docs/release/v607` });
  if (relative.includes("\\") || relative.includes("..")) issues.push({ code: `${label}-unsafe`, detail: `${label} contains unsafe path segments` });
  return issues;
}

export function verifySourcePointer(root, receipt, pointer, label) {
  const issues = [];
  if (typeof pointer?.path !== "string" || !pointer.path) issues.push({ code: `${label}-path-missing`, detail: `${label} source path is missing` });
  else if (!containedPath(root, pointer.path, ["app/data", "docs/release/v607"])) issues.push({ code: `${label}-path-outside-workspace`, detail: `${label} source path is outside approved read-only roots` });
  if (pointer?.path?.includes("\\") || pointer?.path?.includes("..")) issues.push({ code: `${label}-path-unsafe`, detail: `${label} source path contains unsafe segments` });
  if (!SHA256.test(String(pointer?.sha256 ?? ""))) issues.push({ code: `${label}-sha-invalid`, detail: `${label} source SHA-256 is invalid` });
  if (!Number.isInteger(pointer?.rows ?? pointer?.records) || (pointer.rows ?? pointer.records) < 0) issues.push({ code: `${label}-count-invalid`, detail: `${label} source count is invalid` });
  if (!pointer?.schema) issues.push({ code: `${label}-schema-missing`, detail: `${label} source schema missing` });
  if (issues.length) return issues;
  try {
    const bytes = fs.readFileSync(safeWorkspacePath(root, pointer.path, { allowMissing: false }));
    if (sha256Bytes(bytes) !== String(pointer.sha256).toLowerCase()) issues.push({ code: `${label}-sha-mismatch`, detail: `${label} bytes differ from receipt` });
    const parsed = JSON.parse(bytes.toString("utf8"));
    if (parsed.schema !== pointer.schema) issues.push({ code: `${label}-schema-drift`, detail: `${label} schema differs from receipt` });
    if (Number(pointer.rows ?? pointer.records) !== Number(parsed.rows?.length ?? parsed.records?.length ?? -1)) issues.push({ code: `${label}-count-drift`, detail: `${label} count differs from receipt` });
  } catch (error) {
    issues.push({ code: `${label}-read-error`, detail: `${label} cannot be read: ${error.code ?? error.message}` });
  }
  return issues;
}

export function verifyBoundary(receipt) {
  const issues = [];
  for (const [key, expected] of Object.entries(BOUNDARY)) {
    if (receipt?.boundary?.[key] !== expected) issues.push({ code: `boundary-${key}-invalid`, detail: `receipt boundary ${key} must equal ${String(expected)}` });
  }
  if (receipt?.claims?.copyrightApproval !== false) issues.push({ code: "copyright-approval-open", detail: "receipt cannot claim copyright approval" });
  if (receipt?.claims?.scientificValidity !== false) issues.push({ code: "scientific-validity-open", detail: "receipt cannot claim scientific validity" });
  if (receipt?.claims?.runtimePayloadWriteback !== false) issues.push({ code: "runtime-writeback-open", detail: "receipt cannot write scientific payload" });
  if (receipt?.claims?.productionPerformance !== false) issues.push({ code: "performance-claim-open", detail: "receipt cannot claim production performance" });
  return issues;
}

export function verifyRows(receipt) {
  const issues = [];
  const ids = receipt?.rows?.map((row) => row.id) ?? [];
  if (ids.length !== ROSTER.length) issues.push({ code: "row-count-invalid", detail: "receipt does not contain twelve closure rows" });
  if (new Set(ids).size !== ids.length) issues.push({ code: "row-duplicate-id", detail: "receipt contains duplicate row ids" });
  for (const id of ROSTER) if (!ids.includes(id)) issues.push({ code: "row-missing-id", detail: `${id} missing from receipt` });
  for (const row of receipt?.rows ?? []) {
    if (!["batch", "ledger"].includes(row.source)) issues.push({ code: "row-source-invalid", detail: `${row.id} source must be batch or ledger` });
    if (!["ready", "pending", "blocked"].includes(row.status)) issues.push({ code: "row-status-invalid", detail: `${row.id} status invalid` });
    if (!Array.isArray(row.issues)) issues.push({ code: "row-issues-invalid", detail: `${row.id} issues must be an array` });
    if (!SHA256.test(String(row.fingerprint ?? ""))) issues.push({ code: "row-fingerprint-invalid", detail: `${row.id} fingerprint invalid` });
    if (row.rightsCleared === true && row.rightsStatus !== "cleared") issues.push({ code: "row-rights-contradiction", detail: `${row.id} claims rights cleared with non-cleared status` });
    if (row.status === "ready" && row.issues.length !== 0) issues.push({ code: "ready-row-has-issues", detail: `${row.id} ready row still has issues` });
    if (scanTokens(row).length > 0) issues.push({ code: "receipt-synthetic-marker", detail: `${row.id} contains synthetic/fixture marker` });
  }
  return issues;
}

export async function verifySidecars(root, receipt) {
  const issues = [];
  const paths = pathList(receipt);
  for (const [index, relative] of paths.entries()) issues.push(...checkRelativePath(root, relative, ["json", "jsonl", "csv", "markdown"][index]));
  if (issues.length) return issues;
  try {
    const expected = [makeJsonl(receipt.rows), makeCsv(receipt.rows), makeMarkdown(receipt)];
    const actual = await Promise.all(paths.slice(1).map((relative) => fsp.readFile(safeWorkspacePath(root, relative), "utf8")));
    expected.forEach((value, index) => { if (actual[index] !== value) issues.push({ code: "sidecar-stale", detail: `${paths[index + 1]} does not match receipt rows` }); });
  } catch (error) {
    issues.push({ code: "sidecar-read-error", detail: error.code ?? error.message });
  }
  return issues;
}

export async function verifyRecomputedClosure(root, receipt) {
  const issues = [];
  const built = await buildClosure({ root, batchPath: BATCH_PATH, ledgerPath: LEDGER_PATH, runId: receipt.runId });
  if (built.receipt.source.batch.sha256 !== receipt.source?.batch?.sha256) issues.push({ code: "batch-input-drift", detail: "batch source SHA differs from receipt" });
  if (built.receipt.source.ledger.sha256 !== receipt.source?.ledger?.sha256) issues.push({ code: "ledger-input-drift", detail: "ledger source SHA differs from receipt" });
  if (built.receipt.replay.deterministicInputDigest !== receipt.replay?.deterministicInputDigest) issues.push({ code: "input-digest-drift", detail: "deterministic input digest differs" });
  const projection = (value) => JSON.stringify(canonicalize({ status: value.status, counts: value.counts, gates: value.gates, blockers: value.blockers, rows: value.rows, boundary: value.boundary, evidenceClass: value.evidenceClass, claims: value.claims }));
  if (projection(built.receipt) !== projection(receipt)) issues.push({ code: "receipt-projection-drift", detail: "recomputed closure differs from stored projection" });
  return issues;
}

export async function verifyClosure({ root = ROOT, output = DEFAULT_OUTPUT, jsonl = DEFAULT_JSONL, csv = DEFAULT_CSV, markdown = DEFAULT_MARKDOWN, recompute = true } = {}) {
  const issues = [];
  let receipt;
  try {
    receipt = await readJsonAsync(root, output);
  } catch (error) {
    return { schema: VERIFY_SCHEMA, valid: false, status: "invalid", output, issues: [{ code: "receipt-read-error", detail: error.code ?? error.message }] };
  }
  issues.push(...verifyReceiptShape(receipt));
  issues.push(...verifyBoundary(receipt));
  issues.push(...verifyRows(receipt));
  if (receipt.source?.batch) issues.push(...verifySourcePointer(root, receipt, receipt.source.batch, "batch"));
  else issues.push({ code: "batch-pointer-missing", detail: "receipt batch source pointer missing" });
  if (receipt.source?.ledger) issues.push(...verifySourcePointer(root, receipt, receipt.source.ledger, "ledger"));
  else issues.push({ code: "ledger-pointer-missing", detail: "receipt ledger source pointer missing" });
  issues.push(...await verifySidecars(root, { ...receipt, replay: { ...(receipt.replay ?? {}), jsonl, csv, markdown } }));
  if (recompute && issues.length === 0) issues.push(...await verifyRecomputedClosure(root, receipt));
  const uniqueIssues = Object.values(Object.fromEntries(issues.map((issue) => [issue.code, issue])));
  const status = uniqueIssues.length ? "invalid" : receipt.status;
  return {
    schema: VERIFY_SCHEMA,
    valid: uniqueIssues.length === 0,
    status,
    output,
    receiptStatus: receipt.status,
    issueCount: uniqueIssues.length,
    issues: uniqueIssues,
    counts: receipt.counts,
    gates: receipt.gates,
    blockers: receipt.blockers,
    boundary: receipt.boundary,
    sourceDigests: { batch: receipt.source?.batch?.sha256 ?? null, ledger: receipt.source?.ledger?.sha256 ?? null },
    evidenceClass: "static-receipt-verification",
  };
}

export function parseVerifyArgs(argv = process.argv.slice(2)) {
  const args = { root: ROOT, output: DEFAULT_OUTPUT, jsonl: DEFAULT_JSONL, csv: DEFAULT_CSV, markdown: DEFAULT_MARKDOWN, noRecompute: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--no-recompute") args.noRecompute = true;
    else if (arg === "--json") args.json = true;
    else if (["--root", "--output", "--jsonl", "--csv", "--markdown"].includes(arg)) {
      const value = argv[index + 1];
      if (!value) throw new Error(`${arg} requires a value`);
      index += 1;
      if (arg === "--root") args.root = path.resolve(value);
      if (arg === "--output") args.output = value;
      if (arg === "--jsonl") args.jsonl = value;
      if (arg === "--csv") args.csv = value;
      if (arg === "--markdown") args.markdown = value;
    } else throw new Error(`unknown argument: ${arg}`);
  }
  return args;
}

export async function run(args = parseVerifyArgs()) {
  return verifyClosure({ ...args, recompute: !args.noRecompute });
}

if (process.argv[1] && path.resolve(process.argv[1]) === pathFromModule("scripts/verify-mainline-a-nebula-rights-closure-v627.mjs")) {
  run()
    .then((result) => { console.log(JSON.stringify(result, null, 2)); if (!result.valid) process.exitCode = 1; })
    .catch((error) => { console.error(error.stack ?? error.message); process.exitCode = 1; });
}

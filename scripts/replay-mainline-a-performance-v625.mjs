import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const cliArg = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
};
const receiptPath = path.resolve(root, cliArg("--receipt", "docs/release/v607/mainline-a-r65-performance-v625.json"));
const replayPath = path.resolve(root, cliArg("--output", "docs/release/v607/mainline-a-r65-performance-replay-v625.json"));
const checkOnly = process.argv.includes("--check");
const csv = process.argv.includes("--csv");

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, stable(entry)]));
  return value;
}

function digest(value) {
  const text = JSON.stringify(stable(value));
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function canonicalReceipt(value) {
  const copy = JSON.parse(JSON.stringify(value));
  delete copy.generatedAt;
  delete copy.staticEvidence;
  return copy;
}

function number(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function runKey(run) {
  return [run.device, run.scenario, run.viewport?.width, run.viewport?.height, run.viewport?.devicePixelRatio].join(":");
}

function toCsv(receipt) {
  const header = "runId,device,scenario,width,height,dpr,durationMs,frameSamples,p50Ms,p95Ms,medianFps,longTaskMaxMs,heapUsedBytes,resourceStatus,status";
  const rows = (receipt.runs ?? []).map((run) => [run.runId, run.device, run.scenario, run.viewport?.width, run.viewport?.height, run.viewport?.devicePixelRatio, run.durationMs, run.frame?.sampleCount, run.frame?.p50Ms, run.frame?.p95Ms, run.frame?.medianFps, run.frame?.longTaskMaxMs, run.memory?.jsHeapUsedBytes, run.resources?.status, run.status].map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","));
  return [header, ...rows].join("\n");
}

const receipt = JSON.parse(await readFile(receiptPath, "utf8"));
const failures = [];
if (receipt.schema !== "mainline-a-performance-evidence-v625") failures.push("schema");
if (receipt.version !== "v625-mainline-a-multi-device-lifecycle-evidence") failures.push("version");
if (receipt.boundary?.candidateOnly !== true || receipt.boundary?.hold !== true || receipt.boundary?.notAdmitted !== true) failures.push("boundary");
if (receipt.boundary?.scientificPayloadWriteback !== false) failures.push("writeback");
if (receipt.boundary?.runtimePromotion !== "closed") failures.push("runtime-promotion");
if (receipt.status === "pending" || (receipt.runs ?? []).length === 0) failures.push("runtime-runs-missing");
if (!(receipt.runs ?? []).some((run) => run.device === "desktop")) failures.push("desktop-run-missing");
if (!(receipt.runs ?? []).some((run) => run.device === "mobile")) failures.push("mobile-run-missing");
if (!receipt.build || [receipt.build.buildId, receipt.build.branch, receipt.build.head].some((value) => !value || String(value).startsWith("unknown"))) failures.push("build-identity-missing");
if ((receipt.blockers ?? []).some((blocker) => blocker === "long-run-observation-required" || blocker === "physical-device-not-run")) failures.push("required-long-run-or-physical-device-missing");
const runIds = new Set();
for (const run of receipt.runs ?? []) {
  if (runIds.has(run.runId)) failures.push(`duplicate-run-id:${run.runId}`);
  runIds.add(run.runId);
  if (!run.resources?.before?.identityDigest || !run.resources?.after?.identityDigest) failures.push(`${run.runId}:resource-digest`);
  if (run.resources?.status === "drift") failures.push(`${run.runId}:resource-drift`);
  if (run.resources?.status !== "baseline") failures.push(`${run.runId}:resource-lifecycle`);
  if (run.frame?.sampleCount < 1) failures.push(`${run.runId}:no-frame-sample`);
  if (run.status !== "complete") failures.push(`${run.runId}:status`);
  if (run.visibility?.documentVisibility !== "visible" || run.visibility?.rootVisible !== true) failures.push(`${run.runId}:visibility`);
  if (run.consoleErrors !== 0 || run.pageErrors !== 0) failures.push(`${run.runId}:errors`);
  if (run.build?.buildId !== receipt.build?.buildId || run.build?.branch !== receipt.build?.branch || run.build?.head !== receipt.build?.head) failures.push(`${run.runId}:build-identity`);
}
if (receipt.staticEvidence?.digest !== digest(canonicalReceipt(receipt))) failures.push("receipt-digest");
const replay = {
  schema: "mainline-a-performance-replay-v625",
  generatedAt: new Date().toISOString(),
  sourceReceipt: path.relative(root, receiptPath).replaceAll("\\", "/"),
  sourceReceiptDigest: digest(canonicalReceipt(receipt)),
  replayMode: "deterministic-ledger-replay",
  evidenceClass: "static-replay",
  runs: (receipt.runs ?? []).map((run) => ({
    runId: run.runId,
    key: runKey(run),
    device: run.device,
    scenario: run.scenario,
    frameSamples: run.frame?.sampleCount ?? 0,
    p95Ms: number(run.frame?.p95Ms),
    medianFps: number(run.frame?.medianFps),
    resourceBefore: run.resources?.before?.identityDigest ?? null,
    resourceAfter: run.resources?.after?.identityDigest ?? null,
    lifecycle: run.resources?.status ?? "not-run",
    status: run.status,
  })),
  boundary: receipt.boundary,
  failures: [...new Set(failures)].sort(),
  status: failures.length === 0 ? "verified" : "blocked",
  notes: ["Replay validates ledger shape and resource identity only.", "It does not create frames, memory samples, screenshots, device results, or scientific evidence."],
};
if (!checkOnly) await writeFile(replayPath, `${JSON.stringify(replay, null, 2)}\n`, "utf8");
if (csv) console.log(toCsv(receipt));
else console.log(`R65 replay: ${replay.status} runs=${replay.runs.length} failures=${replay.failures.length}`);
console.log(`static replay evidence=${path.relative(root, replayPath).replaceAll("\\", "/")}`);
if (checkOnly && replay.status !== "verified") process.exitCode = 1;

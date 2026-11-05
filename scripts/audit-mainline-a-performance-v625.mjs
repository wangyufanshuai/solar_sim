import { readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const cliArg = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
};
const receiptPath = path.resolve(root, cliArg("--receipt", "docs/release/v607/mainline-a-r65-performance-v625.json"));
const panelPath = path.join(root, "app/components/MainlineAPerformancePanelV625.tsx");
const evidencePath = path.join(root, "app/lib/mainlineAPerformanceEvidenceV625.ts");
const sessionPath = path.join(root, "app/lib/mainlineAPerformanceSessionV625.ts");
const buildReportPath = path.resolve(root, cliArg("--build", "docs/release/v607/mainline-a-r65-build-20260920-004.json"));
const checkOnly = process.argv.includes("--check");
const jsonOnly = process.argv.includes("--json");
const init = process.argv.includes("--init");

const schema = "mainline-a-performance-evidence-v625";
const version = "v625-mainline-a-multi-device-lifecycle-evidence";
const boundary = "R65 measures browser runtime presentation and resource lifecycle only; it does not promote candidate art, write scientific payloads, or alter EIH, Newton N-body, 2PN/Lense–Thirring, or Kerr kernels.";

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

function receiptDigest(receipt) {
  const withoutStaticEvidence = { ...receipt };
  delete withoutStaticEvidence.staticEvidence;
  return digest(withoutStaticEvidence);
}

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

async function readReceipt() {
  if (!(await exists(receiptPath))) return null;
  try { return JSON.parse(await readFile(receiptPath, "utf8")); } catch { return null; }
}

function issue(code, detail, severity = "error") {
  return { code, detail, severity };
}

function auditReceipt(receipt, buildReport) {
  const issues = [];
  if (!receipt) return [issue("receipt-missing", receiptPath)];
  if (receipt.schema !== schema) issues.push(issue("schema", `expected ${schema}`));
  if (receipt.version !== version) issues.push(issue("version", `expected ${version}`));
  if (!receipt.boundary?.candidateOnly || !receipt.boundary?.hold || !receipt.boundary?.notAdmitted) issues.push(issue("candidate-boundary", "candidateOnly/hold/notAdmitted must all be true"));
  if (receipt.boundary?.scientificPayloadWriteback !== false) issues.push(issue("scientific-writeback", "scientificPayloadWriteback must be false"));
  if (receipt.boundary?.runtimePromotion !== "closed") issues.push(issue("runtime-promotion", "runtime promotion must remain closed"));
  if (receipt.evidenceClass !== "browser-runtime-observation") issues.push(issue("evidence-class", "performance samples must remain browser-runtime-observation"));
  if (!receipt.build || [receipt.build.buildId, receipt.build.branch, receipt.build.head].some((value) => !value || String(value).startsWith("unknown"))) issues.push(issue("build-identity-missing", "receipt build identity must be bound to a real build"));
  if (!buildReport || buildReport.status !== "passed") issues.push(issue("build-report-missing", "a passed preserved R65 build receipt is required"));
  if (buildReport && (receipt.build?.buildId !== buildReport.runtimeBuildId || receipt.build?.branch !== buildReport.branch || receipt.build?.head !== buildReport.head)) issues.push(issue("build-identity-mismatch", "receipt build identity does not match the preserved build receipt"));
  if (!Array.isArray(receipt.requestedDevices) || !receipt.requestedDevices.includes("desktop") || !receipt.requestedDevices.includes("mobile")) issues.push(issue("device-contract", "desktop and mobile viewport requests are required"));
  if (!Array.isArray(receipt.runs)) issues.push(issue("runs", "runs must be an array"));
  if (receipt.status !== "measured") issues.push(issue("receipt-not-measured", `receipt status is ${receipt.status}`));
  if ((receipt.blockers ?? []).some((blocker) => blocker === "long-run-observation-required" || blocker === "physical-device-not-run")) issues.push(issue("required-long-run-or-physical-device-missing", "long-run and physical-device gates remain open"));
  if ((receipt.runs ?? []).length === 0) issues.push(issue("runtime-runs-missing", "desktop and mobile browser runtime runs are required"));
  if (!(receipt.runs ?? []).some((run) => run.device === "desktop")) issues.push(issue("desktop-run-missing", "desktop viewport run is required"));
  if (!(receipt.runs ?? []).some((run) => run.device === "mobile")) issues.push(issue("mobile-run-missing", "mobile viewport run is required"));
  for (const run of receipt.runs ?? []) {
    if (!run.runId || !run.device || !run.scenario) issues.push(issue(`${run.runId ?? "run"}:identity`, "run identity is incomplete"));
    if (run.evidenceClass !== "browser-runtime-observation") issues.push(issue(`${run.runId ?? "run"}:class`, "run evidence class mismatch"));
    if (!run.viewport || !Number.isInteger(run.viewport.width) || !Number.isInteger(run.viewport.height)) issues.push(issue(`${run.runId ?? "run"}:viewport`, "viewport dimensions must be integer"));
    if (run.resources?.status === "drift") issues.push(issue(`${run.runId ?? "run"}:resource-drift`, "resource identity did not return to baseline"));
    if (run.status !== "complete") issues.push(issue(`${run.runId ?? "run"}:status`, "run is not complete"));
    if (run.visibility?.documentVisibility !== "visible" || run.visibility?.rootVisible !== true) issues.push(issue(`${run.runId ?? "run"}:visibility`, "run was not observed while visible"));
    if (run.consoleErrors !== 0 || run.pageErrors !== 0) issues.push(issue(`${run.runId ?? "run"}:errors`, "browser errors were observed"));
    if (run.build?.buildId !== receipt.build?.buildId || run.build?.branch !== receipt.build?.branch || run.build?.head !== receipt.build?.head) issues.push(issue(`${run.runId ?? "run"}:build`, "run build identity differs from receipt"));
  }
  const staticEvidence = receipt.staticEvidence;
  if (!staticEvidence?.schemaValid) issues.push(issue("static-schema", "static schema validation was not recorded"));
  if (staticEvidence?.digest !== receiptDigest(receipt)) issues.push(issue("receipt-digest", "saved static digest does not match receipt contents"));
  if (receipt.notes?.join(" ").includes("synthetic")) issues.push(issue("synthetic-claim", "synthetic evidence is forbidden"));
  return issues;
}

async function staticAudit() {
  const issues = [];
  const [panel, evidence, session] = await Promise.all([readFile(panelPath, "utf8"), readFile(evidencePath, "utf8"), readFile(sessionPath, "utf8")]);
  const checks = [
    ["panel-marker", panel.includes('data-mainline-a-performance="v625"')],
    ["panel-boundary", panel.includes('data-mainline-a-performance-scientific-payload-writeback="false"')],
    ["panel-device-control", panel.includes("mobile-viewport") || panel.includes("value=\"mobile\"" )],
    ["evidence-schema", evidence.includes("mainline-a-performance-evidence-v625")],
    ["evidence-boundary", evidence.includes("scientificPayloadWriteback: false")],
    ["evidence-resource-diff", evidence.includes("diffAtlasResourceSnapshotsV300")],
    ["session-raf", session.includes("requestAnimationFrame")],
    ["session-longtask", session.includes("PerformanceObserver")],
    ["session-release", session.includes("getAtlasResourceSnapshot")],
  ];
  for (const [code, passed] of checks) if (!passed) issues.push(issue(code, "required R65 production hook missing"));
  return { checks: checks.map(([code, passed]) => ({ code, passed })), issues };
}

function report(receipt, staticResult, buildReport) {
  const receiptIssues = auditReceipt(receipt, buildReport);
  const allIssues = [...staticResult.issues, ...receiptIssues];
  return {
    schema,
    version,
    generatedAt: new Date().toISOString(),
    evidenceClass: "static+browser-runtime-observation",
    boundary,
    receiptPath: path.relative(root, receiptPath).replaceAll("\\", "/"),
    receiptStatus: receipt?.status ?? "missing",
    runCount: receipt?.runs?.length ?? 0,
    devicesObserved: [...new Set((receipt?.runs ?? []).map((run) => run.device))].sort(),
    static: { checks: staticResult.checks, passed: staticResult.issues.length === 0 },
    issues: allIssues,
    status: allIssues.length === 0 ? "verified" : "blocked",
  };
}

async function initialize() {
  if (await exists(receiptPath)) return JSON.parse(await readFile(receiptPath, "utf8"));
  const base = {
    schema,
    version,
    generatedAt: new Date().toISOString(),
    build: { buildId: "unknown-build", branch: "codex/solar-sim-mainline-a", head: "156ec77", route: "/", source: "runtime-marker" },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false, runtimePromotion: "closed" },
    requestedDevices: ["desktop", "mobile"],
    runs: [],
    repeatRuns: 0,
    longRunRequestedMs: 1_800_000,
    longRunObservedMs: 0,
    status: "pending",
    evidenceClass: "browser-runtime-observation",
    blockers: ["desktop-browser-run-required", "mobile-viewport-run-required", "physical-device-not-run", "long-run-observation-required"],
    notes: [boundary, "No fixture, timeout, screenshot, or generated manifest is treated as browser or production proof."],
  };
  const receipt = { ...base, staticEvidence: { schemaValid: true, digest: digest(base), verifiedAt: base.generatedAt } };
  await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  return receipt;
}

const receipt = init ? await initialize() : await readReceipt();
const staticResult = await staticAudit();
const buildReport = await (async () => { try { return JSON.parse(await readFile(buildReportPath, "utf8")); } catch { return null; } })();
const output = report(receipt, staticResult, buildReport);
if (jsonOnly) console.log(JSON.stringify(output, null, 2));
else {
  console.log(`R65 performance audit: ${output.status}`);
  console.log(`receipt=${output.receiptStatus} runs=${output.runCount} devices=${output.devicesObserved.join(",") || "none"}`);
  console.log(`static=${output.static.passed ? "passed" : "failed"} issues=${output.issues.length}`);
  for (const entry of output.issues) console.log(`${entry.severity.toUpperCase()} ${entry.code}: ${entry.detail}`);
  console.log("Evidence classes: static and browser-runtime-observation; production performance and real-user validation remain unclaimed.");
}
if (checkOnly && output.status !== "verified") process.exitCode = 1;

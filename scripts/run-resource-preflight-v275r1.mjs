import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, statfsSync } from "node:fs";
import { freemem } from "node:os";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  ATLAS_RESOURCE_PREFLIGHT_AUDIT_PORTS_V275R1,
  ATLAS_RESOURCE_PREFLIGHT_MIN_DISK_BYTES_V275R1,
  ATLAS_RESOURCE_PREFLIGHT_MIN_MEMORY_BYTES_V275R1,
  ATLAS_RESOURCE_PREFLIGHT_REQUIRED_FREE_PORTS_V275R1,
  ATLAS_RESOURCE_PREFLIGHT_SAMPLE_COUNT_V275R1,
  ATLAS_RESOURCE_PREFLIGHT_SAMPLE_INTERVAL_MS_V275R1,
  ATLAS_RESOURCE_PREFLIGHT_VERSION_V275R1,
  atlasProcessIdentityMatchesV275R1,
  classifyAtlasProjectProcessV275R1,
  evaluateAtlasResourcePreflightV275R1,
  orderAtlasProjectProcessesForTerminationV275R1,
} from "../app/lib/atlasResourcePreflightV275R1.ts";

const ROOT = resolve(".");
const argumentValue = (name, fallback = "") => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
};
const ATTEMPT_PROFILE = argumentValue("--attempt", "v275r1");
if (!new Set(["v275r1", "v275r2", "v300-heavy"]).has(ATTEMPT_PROFILE)) throw new Error(`Unsupported resource preflight attempt: ${ATTEMPT_PROFILE}`);
const USER_OVERRIDE_R2 = ATTEMPT_PROFILE === "v275r2";
const V300_HEAVY = ATTEMPT_PROFILE === "v300-heavy";
const ATTEMPT_NUMBER = USER_OVERRIDE_R2 ? 2 : 1;
const EVIDENCE_VERSION = V300_HEAVY
  ? "v300-heavy-resource-stability-v1"
  : USER_OVERRIDE_R2
    ? "v275r2-resource-stability-preflight-user-override-v1"
    : ATLAS_RESOURCE_PREFLIGHT_VERSION_V275R1;
const EVIDENCE_PATH = `dist/science/resource-preflight-${ATTEMPT_PROFILE}-evidence.json`;
const POINTER_PATH = `dist/release/orbit-atlas-current-local-resource-preflight-${ATTEMPT_PROFILE}.json`;
const MINIMUM_MEMORY_BYTES = USER_OVERRIDE_R2 ? 6 * 1024 ** 3 : ATLAS_RESOURCE_PREFLIGHT_MIN_MEMORY_BYTES_V275R1;
const PASS_STATUS = USER_OVERRIDE_R2
  ? "resource-preflight-passed-heavy-work-authorized-v271-only"
  : "resource-preflight-passed-heavy-work-authorized";
const FORMAL_PRODUCT_POINTER = "dist/release/orbit-atlas-current-product-evidence-v263.json";
const V263_EVIDENCE = "dist/release/orbit-atlas-v263-local-validation-evidence.json";
const PROGRESS_PATH = "dist/science/kerr-dense-campaign-progress-v8.json";
const V300_CAMPAIGN_STATE_PATH = "dist/science/kerr-campaign-v298r1/campaign-state.json";
const V300_DENSE_AGGREGATE_PATH = "dist/science/kerr-campaign-v298r1/dense-aggregate.json";
const FREEZE_COMMIT = "8315160a6f7afd4763e3840c7b6d5bb4da0ca663";
const FREEZE_BRANCH = "codex/orbit-atlas-v241-science-freeze";
const EXPECTED_CODE_SHA = "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8";
const EXPECTED_SCREEN_SHA = "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037";
const PROTECTED_SCIENCE_SOURCES = [
  "scripts/run-kerr-dense-shards-v8.py",
  "scripts/run-kerr-dense-shards-v6.py",
  "scripts/kerr_finite_observer_separatrix_v8.py",
  "scripts/build-kerr-finite-observer-screen-v8.py",
  "scripts/run-kerr-schild-reference-v5.py",
  "scripts/run-kerr-carter-mino-reference-v6.py",
  "scripts/kerr_observer_frame_v5.py",
];
const REQUIRED_PORTS = new Set(ATLAS_RESOURCE_PREFLIGHT_REQUIRED_FREE_PORTS_V275R1);
const AUDIT_PORTS = new Set(ATLAS_RESOURCE_PREFLIGHT_AUDIT_PORTS_V275R1);
const formal = process.argv.includes("--formal");
const inspectOnly = process.argv.includes("--inspect") || !formal;

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]))
    : value;
const canonicalJson = (value) => JSON.stringify(canonicalize(value));
const readJson = async (path) => JSON.parse(await readFile(resolve(ROOT, path), "utf8"));
const fileSha256 = async (path) => sha256(await readFile(resolve(ROOT, path)));
const delay = (milliseconds) => new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));

async function inspectV300CampaignReadiness() {
  if (!V300_HEAVY) return null;
  const blockers = [];
  if (!existsSync(resolve(ROOT, V300_CAMPAIGN_STATE_PATH))) {
    return { ready: false, attemptConsumed: false, blockers: ["dense-campaign-state-missing"], statePath: V300_CAMPAIGN_STATE_PATH, aggregatePath: V300_DENSE_AGGREGATE_PATH };
  }
  const state = await readJson(V300_CAMPAIGN_STATE_PATH);
  if (state.status !== "complete" || state.completedShardCount !== 49 || state.plannedShardCount !== 49) blockers.push("dense-campaign-not-49-of-49");
  if (state.aggregateAvailable !== true) blockers.push("dense-aggregate-unavailable");
  if (!existsSync(resolve(ROOT, V300_DENSE_AGGREGATE_PATH))) blockers.push("dense-aggregate-file-missing");
  let aggregateIdentityMatches = false;
  if (existsSync(resolve(ROOT, V300_DENSE_AGGREGATE_PATH)) && state.aggregate?.fileSha256) {
    aggregateIdentityMatches = await fileSha256(V300_DENSE_AGGREGATE_PATH) === state.aggregate.fileSha256;
    if (!aggregateIdentityMatches) blockers.push("dense-aggregate-file-sha-mismatch");
  } else if (state.aggregateAvailable === true) {
    blockers.push("dense-aggregate-state-identity-missing");
  }
  return {
    ready: blockers.length === 0,
    attemptConsumed: false,
    blockers,
    statePath: V300_CAMPAIGN_STATE_PATH,
    stateStatus: state.status ?? "unavailable",
    completedShardCount: Number(state.completedShardCount ?? 0),
    plannedShardCount: Number(state.plannedShardCount ?? 49),
    stateSha256: typeof state.stateSha256 === "string" ? state.stateSha256 : null,
    aggregatePath: V300_DENSE_AGGREGATE_PATH,
    aggregateAvailable: state.aggregateAvailable === true,
    aggregateIdentityMatches,
  };
}

function runPowerShell(script) {
  const result = spawnSync("powershell.exe", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    script,
  ], { cwd: ROOT, encoding: "utf8", shell: false, maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`PowerShell resource inspection failed (${result.status}): ${(result.stderr ?? "").trim()}`);
  return (result.stdout ?? "").trim();
}

function parseJsonArray(text) {
  if (!text) return [];
  const value = JSON.parse(text);
  return Array.isArray(value) ? value : [value];
}

function collectProcesses() {
  const raw = parseJsonArray(runPowerShell(`
$items = Get-CimInstance Win32_Process | ForEach-Object {
  $runtime = Get-Process -Id $_.ProcessId -ErrorAction SilentlyContinue
  [pscustomobject]@{
    ProcessId = [int]$_.ProcessId
    ParentProcessId = [int]$_.ParentProcessId
    Name = [string]$_.Name
    CommandLine = [string]$_.CommandLine
    CreationDate = if ($_.CreationDate) { $_.CreationDate.ToString("o") } else { "" }
    WorkingSetBytes = if ($runtime) { [int64]$runtime.WorkingSet64 } else { 0 }
  }
}
ConvertTo-Json -InputObject @($items) -Depth 3 -Compress
`));
  return raw.map((entry) => ({
    pid: Number(entry.ProcessId ?? 0),
    parentPid: Number(entry.ParentProcessId ?? 0),
    name: String(entry.Name ?? ""),
    commandLine: String(entry.CommandLine ?? ""),
    creationDate: String(entry.CreationDate ?? ""),
    workingSetBytes: Number(entry.WorkingSetBytes ?? 0),
  }));
}

function ancestorPids(processes) {
  const parents = new Map(processes.map((entry) => [entry.pid, entry.parentPid]));
  const result = new Set();
  let cursor = process.ppid;
  while (Number.isSafeInteger(cursor) && cursor > 0 && !result.has(cursor)) {
    result.add(cursor);
    cursor = parents.get(cursor) ?? 0;
  }
  return result;
}

function classifyProcesses(processes) {
  const ancestors = ancestorPids(processes);
  return processes.map((entry) => classifyAtlasProjectProcessV275R1(entry, {
    workspaceRoot: ROOT,
    currentPid: process.pid,
    ancestorPids: ancestors,
  }));
}

function collectPorts(classifiedProcesses) {
  const raw = parseJsonArray(runPowerShell(`
$items = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $_.LocalPort -ge 3000 -and $_.LocalPort -le 3020 } |
  ForEach-Object { [pscustomobject]@{ Port = [int]$_.LocalPort; Address = [string]$_.LocalAddress; ProcessId = [int]$_.OwningProcess } }
ConvertTo-Json -InputObject @($items) -Depth 2 -Compress
`));
  const byPid = new Map(classifiedProcesses.map((entry) => [entry.pid, entry]));
  return raw.map((entry) => {
    const pid = Number(entry.ProcessId ?? 0);
    const owner = byPid.get(pid);
    const ownerClassification = owner && owner.classification !== "ignored" ? owner.classification : "unknown";
    return {
      port: Number(entry.Port ?? 0),
      address: String(entry.Address ?? ""),
      pid,
      ownerClassification,
      ownerReason: owner?.reason ?? "listener-owner-not-in-runtime-candidate-set",
    };
  }).filter((entry) => AUDIT_PORTS.has(entry.port));
}

function readCurrentProcess(pid) {
  const raw = parseJsonArray(runPowerShell(`
$item = Get-CimInstance Win32_Process -Filter "ProcessId=${pid}" -ErrorAction SilentlyContinue
if ($item) {
  $runtime = Get-Process -Id ${pid} -ErrorAction SilentlyContinue
  ConvertTo-Json -InputObject @([pscustomobject]@{
    ProcessId = [int]$item.ProcessId
    ParentProcessId = [int]$item.ParentProcessId
    Name = [string]$item.Name
    CommandLine = [string]$item.CommandLine
    CreationDate = if ($item.CreationDate) { $item.CreationDate.ToString("o") } else { "" }
    WorkingSetBytes = if ($runtime) { [int64]$runtime.WorkingSet64 } else { 0 }
  }) -Depth 2 -Compress
} else { "[]" }
`));
  const entry = raw[0];
  return entry ? {
    pid: Number(entry.ProcessId ?? 0),
    parentPid: Number(entry.ParentProcessId ?? 0),
    name: String(entry.Name ?? ""),
    commandLine: String(entry.CommandLine ?? ""),
    creationDate: String(entry.CreationDate ?? ""),
    workingSetBytes: Number(entry.WorkingSetBytes ?? 0),
  } : null;
}

function summarizeCandidate(candidate) {
  return {
    pid: candidate.pid,
    parentPid: candidate.parentPid,
    name: candidate.name,
    workingSetBytes: candidate.workingSetBytes,
    classification: candidate.classification,
    eligibleForTermination: candidate.eligibleForTermination,
    reason: candidate.reason,
    commandSha256: sha256(candidate.commandLine),
    creationIdentitySha256: sha256(`${candidate.pid}:${candidate.creationDate}:${candidate.name}`),
  };
}

async function terminateProjectProcesses(candidates) {
  const ordered = orderAtlasProjectProcessesForTerminationV275R1(candidates);
  const outcomes = [];
  for (const candidate of ordered) {
    const current = readCurrentProcess(candidate.pid);
    if (!current) {
      outcomes.push({ pid: candidate.pid, name: candidate.name, outcome: "already-exited" });
      continue;
    }
    if (!atlasProcessIdentityMatchesV275R1(candidate, current)) {
      outcomes.push({ pid: candidate.pid, name: candidate.name, outcome: "identity-changed-not-terminated" });
      continue;
    }
    const result = spawnSync("powershell.exe", [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      `Stop-Process -Id ${candidate.pid} -Force -ErrorAction Stop`,
    ], { cwd: ROOT, encoding: "utf8", shell: false });
    outcomes.push({
      pid: candidate.pid,
      name: candidate.name,
      outcome: result.status === 0 ? "terminated-project-process" : "termination-failed",
    });
  }
  if (ordered.length) {
    const deadline = Date.now() + 5_000;
    while (Date.now() < deadline) {
      const remaining = classifyProcesses(collectProcesses()).filter((entry) => entry.eligibleForTermination);
      if (!remaining.length) break;
      await delay(250);
    }
  }
  return outcomes;
}

function currentResourceSample(index) {
  const disk = statfsSync("E:\\");
  const freeDiskBytes = Number(disk.bavail) * Number(disk.bsize);
  const freeMemoryBytes = freemem();
  return {
    index,
    sampledAt: new Date().toISOString(),
    freePhysicalMemoryBytes: freeMemoryBytes,
    eDriveFreeBytes: freeDiskBytes,
    valid: Number.isFinite(freeMemoryBytes) && freeMemoryBytes >= 0 && Number.isFinite(freeDiskBytes) && freeDiskBytes >= 0,
  };
}

async function validateFreeze() {
  const [progress, productPointer, v263] = await Promise.all([
    readJson(PROGRESS_PATH),
    readJson(FORMAL_PRODUCT_POINTER),
    readJson(V263_EVIDENCE),
  ]);
  if (progress.codeSha256 !== EXPECTED_CODE_SHA || progress.finiteObserverScreenManifestSha256 !== EXPECTED_SCREEN_SHA) throw new Error("Protected science SHA changed");
  if (productPointer.version !== "v263-current-product-evidence-pointer") throw new Error("Formal product pointer moved away from v263");
  if (v263.contracts?.legacyRootAttributes !== 603 || v263.contracts?.evidenceLedgerClaims !== 84) throw new Error("Legacy contracts changed");
  const branch = execFileSync("git", ["branch", "--show-current"], { cwd: ROOT, encoding: "utf8" }).trim();
  if (branch !== FREEZE_BRANCH) throw new Error(`Science freeze branch changed: ${branch}`);
  const protectedDiff = execFileSync("git", ["diff", "--name-only", FREEZE_COMMIT, "--", ...PROTECTED_SCIENCE_SOURCES], { cwd: ROOT, encoding: "utf8" }).trim();
  if (protectedDiff) throw new Error(`Protected science source changed: ${protectedDiff}`);
  return {
    science: {
      status: "science-failed-shadow-retained",
      defaultKernel: "legacy-eih-1pn",
      codeSha256: progress.codeSha256,
      screenSha256: progress.finiteObserverScreenManifestSha256,
      workerPhysicsMutation: "not-applied",
      eihOnePnMutation: "not-applied",
      kerrMutation: "not-applied",
    },
    contracts: {
      legacyRootAttributes: v263.contracts.legacyRootAttributes,
      legacyRootKeySha256: v263.contracts.legacyRootKeySha256,
      evidenceLedgerClaims: v263.contracts.evidenceLedgerClaims,
      evidenceLedgerCanonicalSha256: v263.contracts.evidenceLedgerCanonicalSha256,
      singleCanvas: true,
      sceneRevisionSemanticsChanged: false,
    },
    formalProductPointerSha256: await fileSha256(FORMAL_PRODUCT_POINTER),
    freezeBranch: branch,
    protectedScienceSourceDiff: "none",
  };
}

const initialProcesses = classifyProcesses(collectProcesses());
const initialPorts = collectPorts(initialProcesses);
const v300CampaignReadiness = await inspectV300CampaignReadiness();
const baseline = {
  version: EVIDENCE_VERSION,
  attemptProfile: ATTEMPT_PROFILE,
  mode: inspectOnly ? "inspect" : "formal",
  freePhysicalMemoryGiB: Number((freemem() / 2 ** 30).toFixed(2)),
  eDriveFreeGiB: Number((currentResourceSample(0).eDriveFreeBytes / 2 ** 30).toFixed(2)),
  projectProcessCount: initialProcesses.filter((entry) => entry.classification === "project-owned").length,
  protectedRuntimeCount: initialProcesses.filter((entry) => entry.classification === "protected").length,
  unknownRuntimeCount: initialProcesses.filter((entry) => entry.classification === "unknown").length,
  auditPorts: initialPorts,
  operationalMinimumMemoryGiB: Number((MINIMUM_MEMORY_BYTES / 2 ** 30).toFixed(2)),
  userAuthorizedThresholdOverride: USER_OVERRIDE_R2,
  ...(V300_HEAVY ? { v300CampaignReadiness } : {}),
};
if (inspectOnly) {
  console.log(JSON.stringify(baseline, null, 2));
  process.exit(0);
}

if (process.platform !== "win32") throw new Error("v275.1 formal resource cleanup currently requires Windows");
if (V300_HEAVY && !v300CampaignReadiness?.ready) {
  throw new Error(`v300 heavy resource attempt not consumed: ${v300CampaignReadiness?.blockers.join(",") || "campaign-not-ready"}`);
}
if (existsSync(resolve(ROOT, EVIDENCE_PATH)) || existsSync(resolve(ROOT, POINTER_PATH))) {
  throw new Error(`${ATTEMPT_PROFILE} formal resource preflight evidence already exists; automatic retry and overwrite are forbidden`);
}
const freeze = await validateFreeze();
const startedAt = new Date().toISOString();
const initialUnknownTargetListener = initialPorts.some((entry) => REQUIRED_PORTS.has(entry.port) && entry.ownerClassification !== "project-owned");
const terminationOutcomes = await terminateProjectProcesses(initialProcesses);
const protectedPids = new Set(initialProcesses.filter((entry) => entry.classification === "protected").map((entry) => entry.pid));
const protectedTerminationCount = terminationOutcomes.filter((entry) => protectedPids.has(entry.pid) && entry.outcome === "terminated-project-process").length;
const samples = [];
for (let index = 1; index <= ATLAS_RESOURCE_PREFLIGHT_SAMPLE_COUNT_V275R1; index += 1) {
  await delay(ATLAS_RESOURCE_PREFLIGHT_SAMPLE_INTERVAL_MS_V275R1);
  const sample = currentResourceSample(index);
  samples.push(sample);
  console.log(JSON.stringify({
    phase: "resource-stability-sample",
    index,
    total: ATLAS_RESOURCE_PREFLIGHT_SAMPLE_COUNT_V275R1,
    freePhysicalMemoryGiB: Number((sample.freePhysicalMemoryBytes / 2 ** 30).toFixed(2)),
    eDriveFreeGiB: Number((sample.eDriveFreeBytes / 2 ** 30).toFixed(2)),
  }));
}
const finalProcesses = classifyProcesses(collectProcesses());
const finalPorts = collectPorts(finalProcesses);
const residualProjectProcesses = finalProcesses.filter((entry) => entry.classification === "project-owned" && entry.eligibleForTermination);
const unknownTargetListenerObserved = initialUnknownTargetListener
  || finalPorts.some((entry) => REQUIRED_PORTS.has(entry.port) && entry.ownerClassification !== "project-owned");
const evaluation = evaluateAtlasResourcePreflightV275R1({
  samples,
  finalPorts,
  unknownTargetListenerObserved,
  residualProjectProcessCount: residualProjectProcesses.length,
  protectedTerminationCount,
  minimumMemoryBytes: MINIMUM_MEMORY_BYTES,
  minimumDiskBytes: ATLAS_RESOURCE_PREFLIGHT_MIN_DISK_BYTES_V275R1,
});
const evidenceStatus = evaluation.heavyWorkAuthorized ? PASS_STATUS : evaluation.status;
const evidence = {
  version: EVIDENCE_VERSION,
  attempt: ATTEMPT_NUMBER,
  startedAt,
  endedAt: new Date().toISOString(),
  status: evidenceStatus,
  heavyWorkAuthorized: evaluation.heavyWorkAuthorized,
  thresholds: {
    sampleCount: ATLAS_RESOURCE_PREFLIGHT_SAMPLE_COUNT_V275R1,
    sampleIntervalMs: ATLAS_RESOURCE_PREFLIGHT_SAMPLE_INTERVAL_MS_V275R1,
    minimumMemoryBytes: MINIMUM_MEMORY_BYTES,
    minimumDiskBytes: ATLAS_RESOURCE_PREFLIGHT_MIN_DISK_BYTES_V275R1,
    auditPorts: ATLAS_RESOURCE_PREFLIGHT_AUDIT_PORTS_V275R1,
    requiredFreePorts: ATLAS_RESOURCE_PREFLIGHT_REQUIRED_FREE_PORTS_V275R1,
    historicalCanonicalThresholdsChanged: false,
  },
  cleanup: {
    initialProjectProcessCount: initialProcesses.filter((entry) => entry.classification === "project-owned").length,
    initialProtectedRuntimeCount: initialProcesses.filter((entry) => entry.classification === "protected").length,
    initialUnknownRuntimeCount: initialProcesses.filter((entry) => entry.classification === "unknown").length,
    projectCandidates: initialProcesses.filter((entry) => entry.classification === "project-owned").map(summarizeCandidate),
    protectedRuntimeSummary: initialProcesses.filter((entry) => entry.classification === "protected").map(summarizeCandidate),
    terminationOutcomes,
    protectedTerminationCount,
    residualProjectProcessCount: residualProjectProcesses.length,
  },
  ports: { initial: initialPorts, final: finalPorts, unknownTargetListenerObserved },
  samples,
  evaluation,
  ...(V300_HEAVY ? { v300CampaignReadiness } : {}),
  ...(USER_OVERRIDE_R2 ? { userAuthorizedThresholdOverride: {
    requestedExecutionMemoryGiB: 6.48,
    appliedMinimumMemoryBytes: MINIMUM_MEMORY_BYTES,
    historicalV275R1EvidenceChanged: false,
  } } : {}),
  science: freeze.science,
  contracts: freeze.contracts,
  formalProductPointer: FORMAL_PRODUCT_POINTER,
  formalProductPointerSha256: freeze.formalProductPointerSha256,
  formalProductPointerAdvanced: false,
  nextAuthorizedStage: evaluation.heavyWorkAuthorized
    ? V300_HEAVY ? "local-shadow-heavy-qualification-suite" : "v271-aggregate-only"
    : "none",
  automaticRetryApplied: false,
  vercelApplied: false,
  gitMutationApplied: false,
  freezeBranch: freeze.freezeBranch,
  protectedScienceSourceDiff: freeze.protectedScienceSourceDiff,
  boundary: "operational-resource-authorization-only-not-product-or-science-qualification",
};
evidence.evidenceSha256 = sha256(canonicalJson(evidence));
await mkdir(resolve(ROOT, "dist/science"), { recursive: true });
await mkdir(resolve(ROOT, "dist/release"), { recursive: true });
await writeFile(resolve(ROOT, EVIDENCE_PATH), `${JSON.stringify(evidence, null, 2)}\n`);
const pointer = {
  version: `orbit-atlas-current-local-resource-preflight-${ATTEMPT_PROFILE}`,
  generatedAt: evidence.endedAt,
  status: evidence.status,
  heavyWorkAuthorized: evidence.heavyWorkAuthorized,
  nextAuthorizedStage: evidence.nextAuthorizedStage,
  source: { path: EVIDENCE_PATH, sha256: await fileSha256(EVIDENCE_PATH) },
  formalProductPointer: FORMAL_PRODUCT_POINTER,
  formalProductPointerSha256: freeze.formalProductPointerSha256,
  formalProductPointerAdvanced: false,
  science: freeze.science,
  contracts: freeze.contracts,
};
pointer.pointerSha256 = sha256(canonicalJson(pointer));
await writeFile(resolve(ROOT, POINTER_PATH), `${JSON.stringify(pointer, null, 2)}\n`);
console.log(JSON.stringify({
  evidence: EVIDENCE_PATH,
  pointer: POINTER_PATH,
  status: evidence.status,
  heavyWorkAuthorized: evidence.heavyWorkAuthorized,
  nextAuthorizedStage: evidence.nextAuthorizedStage,
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  blockers: evaluation.blockers,
}, null, 2));
if (!evaluation.heavyWorkAuthorized) process.exitCode = 2;

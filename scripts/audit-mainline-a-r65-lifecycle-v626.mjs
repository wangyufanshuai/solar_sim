import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const DEFAULT_RECEIPT = "docs/release/v607/mainline-a-r65-performance-v625-20260922-048.json";
const DEFAULT_OUTPUT = "docs/release/v607/mainline-a-r65-lifecycle-v626.json";
const SCHEMA = "mainline-a-r65-lifecycle-audit-v626";
const VERSION = "v626-mainline-a-r65-lifecycle-audit";
const EVIDENCE_CLASS = "static-lifecycle-verifier";
const LONG_RUN_DEFAULT_MS = 30 * 60 * 1000;
const ALLOWED_DEVICES = new Set(["desktop", "mobile"]);
const ALLOWED_SCENARIOS = new Set(["atlas", "stellar-review", "nebula-review", "repeat-cycle"]);
const REGISTRY_FIELDS = [
  "total", "workers", "gpuRenderTargets", "gpuBuffers", "gpuComputePipelines",
  "gpuQueries", "textures", "models", "subscriptions", "objectUrls",
  "typedArrayCaches", "cameraLocks", "estimatedBytes", "estimatedGpuBytes",
];
const DIGEST_FIELDS = ["identityDigest", "revision"];

const arg = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
};

const receiptPath = path.resolve(root, arg("--receipt", DEFAULT_RECEIPT));
const outputPath = path.resolve(root, arg("--output", DEFAULT_OUTPUT));
const checkOnly = process.argv.includes("--check");
const jsonOnly = process.argv.includes("--json");

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function finite(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function positive(value) {
  return finite(value) && value > 0;
}

function integer(value) {
  return Number.isSafeInteger(value);
}

function relative(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (isRecord(value)) {
    return Object.fromEntries(Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, stable(entry)]));
  }
  return value;
}

function digest(value) {
  return sha256(Buffer.from(JSON.stringify(stable(value)), "utf8"));
}

function canonicalAudit(value) {
  const copy = JSON.parse(JSON.stringify(value));
  delete copy.generatedAt;
  delete copy.auditDigest;
  return copy;
}

function issue(code, detail, location = null) {
  return { code, detail, ...(location ? { location } : {}), severity: "error" };
}

function parseTime(value) {
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function safeString(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function observedBoolean(value) {
  return typeof value === "boolean" ? value : null;
}

function expectedDevice(viewport) {
  if (!isRecord(viewport) || !positive(viewport.width)) return null;
  return viewport.width < 700 ? "mobile" : "desktop";
}

function inspectSnapshot(snapshot, location, issues) {
  if (!isRecord(snapshot)) {
    issues.push(issue("resource-snapshot-missing", "resource snapshot is absent", location));
    return { kind: "missing", digest: null, registry: false, digestOnly: false };
  }
  const identityDigest = safeString(snapshot.identityDigest);
  const revision = snapshot.revision;
  const hasDigest = Boolean(identityDigest);
  const hasRevision = integer(revision) && revision >= 0;
  const available = Array.isArray(snapshot.fieldsAvailable) ? snapshot.fieldsAvailable : [];
  const registryFields = REGISTRY_FIELDS.filter((field) => Object.hasOwn(snapshot, field) || available.includes(field));
  const hasRegistry = registryFields.length >= 4 || available.some((field) => REGISTRY_FIELDS.includes(field));
  const hasRegistryMaps = ["byOwner", "byKind", "byIdentity"].some((field) => Object.hasOwn(snapshot, field));
  const explicitlyUnavailable = snapshot.registryContents === "unavailable" || available.length > 0 && available.every((field) => DIGEST_FIELDS.includes(field));
  if (!hasDigest) issues.push(issue("resource-digest-missing", "identityDigest is required for lifecycle evidence", `${location}.identityDigest`));
  if (!hasRevision) issues.push(issue("resource-revision-missing", "a non-negative resource revision is required", `${location}.revision`));
  if (explicitlyUnavailable && (hasRegistry || hasRegistryMaps)) {
    issues.push(issue("digest-only-registry-claim", "digest-only snapshot contains registry fields despite declaring registryContents unavailable", location));
  }
  const kind = hasRegistry && hasRegistryMaps && !explicitlyUnavailable ? "full-registry" : hasDigest && hasRevision ? "digest-only" : "missing";
  return { kind, digest: identityDigest, registry: kind === "full-registry", digestOnly: kind === "digest-only" };
}

function inspectDiff(diff, location, issues, before, after) {
  if (!isRecord(diff)) {
    issues.push(issue("resource-diff-missing", "resource diff is absent", location));
    return { evidenceAvailable: false, status: "not-run", equal: false };
  }
  const evidenceAvailable = diff.evidenceAvailable === true;
  const status = safeString(diff.status) ?? "unknown";
  const equal = before.digest !== null && before.digest === after.digest;
  if (evidenceAvailable && (before.kind !== "full-registry" || after.kind !== "full-registry")) {
    issues.push(issue("resource-diff-overclaim", "evidenceAvailable=true requires full registry snapshots on both sides", location));
  }
  if (status === "baseline" && !equal) issues.push(issue("baseline-digest-mismatch", "baseline lifecycle status has different before/after identity digests", location));
  if (status === "drift" && equal && evidenceAvailable) issues.push(issue("drift-digest-contradiction", "registry drift is claimed while identity digests are equal", location));
  return { evidenceAvailable, status, equal };
}

function classifyResourceEvidence(run, issues) {
  const resources = isRecord(run?.resources) ? run.resources : null;
  if (!resources) {
    issues.push(issue("resources-missing", "run has no resource lifecycle evidence", "resources"));
    return { kind: "missing", status: "not-run", before: null, after: null, diff: null, claim: "none" };
  }
  const before = inspectSnapshot(resources.before, "resources.before", issues);
  const after = inspectSnapshot(resources.after, "resources.after", issues);
  const diff = inspectDiff(resources.diff, "resources.diff", issues, before, after);
  const status = safeString(resources.status) ?? "not-run";
  const kind = before.kind === "full-registry" && after.kind === "full-registry" && diff.evidenceAvailable
    ? "full-registry"
    : before.kind === "digest-only" && after.kind === "digest-only" && !diff.evidenceAvailable
      ? "digest-only"
      : "missing";
  if (status === "baseline" && kind === "digest-only") {
    issues.push(issue("digest-only-baseline", "digest equality is insufficient to certify lifecycle release", "resources.status"));
  }
  if (status === "baseline" && !diff.equal) issues.push(issue("baseline-not-equal", "baseline lifecycle requires equal resource identities", "resources"));
  if (status === "drift" && kind === "full-registry" && diff.equal) issues.push(issue("full-registry-drift-contradiction", "full registry reports drift despite equal identities", "resources"));
  return { kind, status, before, after, diff, claim: kind === "full-registry" ? "registry" : kind === "digest-only" ? "digest-only" : "none" };
}

function validateRun(run, index, receiptBuild) {
  const issues = [];
  const location = `runs[${index}]`;
  if (!isRecord(run)) return { issues: [issue("run-object", "run must be an object", location)], resource: null, complete: false };
  const runId = safeString(run.runId);
  if (!runId) issues.push(issue("run-id-missing", "runId is required", `${location}.runId`));
  if (!ALLOWED_DEVICES.has(run.device)) issues.push(issue("device-invalid", "device must be desktop or mobile", `${location}.device`));
  if (!ALLOWED_SCENARIOS.has(run.scenario)) issues.push(issue("scenario-invalid", "scenario is not a supported R65 scenario", `${location}.scenario`));
  const viewport = run.viewport;
  const expected = expectedDevice(viewport);
  if (expected && run.device !== expected) issues.push(issue("device-viewport-mismatch", `device ${run.device} does not match ${expectedDevice(viewport)} viewport`, `${location}.device`));
  if (!isRecord(viewport) || !positive(viewport.width) || !positive(viewport.height) || !positive(viewport.devicePixelRatio)) issues.push(issue("viewport-invalid", "viewport dimensions and DPR must be positive", `${location}.viewport`));
  const started = parseTime(run.startedAt);
  const ended = parseTime(run.endedAt);
  if (started === null) issues.push(issue("started-at-invalid", "startedAt must be an ISO timestamp", `${location}.startedAt`));
  if (ended === null) issues.push(issue("ended-at-invalid", "endedAt must be an ISO timestamp", `${location}.endedAt`));
  if (started !== null && ended !== null && ended < started) issues.push(issue("time-order", "endedAt precedes startedAt", location));
  if (!positive(run.durationMs)) issues.push(issue("duration-invalid", "durationMs must be positive", `${location}.durationMs`));
  const frame = run.frame;
  if (!isRecord(frame) || !integer(frame.sampleCount) || frame.sampleCount < 1) issues.push(issue("frame-samples-missing", "at least one frame sample is required", `${location}.frame.sampleCount`));
  if (!isRecord(run.visibility) || run.visibility.documentVisibility !== "visible" || run.visibility.rootVisible !== true || run.visibility.panelVisible !== true || !integer(run.visibility.canvasCount) || run.visibility.canvasCount < 1) issues.push(issue("visibility-incomplete", "visible root, panel, and canvas are required", `${location}.visibility`));
  if (!integer(run.consoleErrors) || run.consoleErrors !== 0) issues.push(issue("console-errors", "consoleErrors must be exactly zero", `${location}.consoleErrors`));
  if (!integer(run.pageErrors) || run.pageErrors !== 0) issues.push(issue("page-errors", "pageErrors must be exactly zero", `${location}.pageErrors`));
  if (!isRecord(run.build)) issues.push(issue("run-build-missing", "per-run build identity is required", `${location}.build`));
  else {
    for (const field of ["buildId", "branch", "head"]) {
      if (!safeString(run.build[field])) issues.push(issue("run-build-field-missing", `${field} is required`, `${location}.build.${field}`));
      else if (receiptBuild && run.build[field] !== receiptBuild[field]) issues.push(issue("run-build-mismatch", `${field} differs from receipt build identity`, `${location}.build.${field}`));
    }
  }
  const resource = classifyResourceEvidence(run, issues);
  if (run.status !== "complete") issues.push(issue("run-status-not-complete", "only complete rows can be measured", `${location}.status`));
  const complete = issues.length === 0 && resource.kind === "full-registry" && resource.status === "baseline";
  return { issues, resource, complete, runId, device: run.device, scenario: run.scenario, started, ended };
}

function evaluatePhysicalMobile(receipt) {
  const declaration = receipt?.observationSource?.physicalMobileDevice ?? receipt?.physicalMobileDevice;
  if (!isRecord(declaration)) return { status: "not-run", reason: "no explicit physical-device observation" };
  const kind = declaration.kind ?? declaration.type;
  const status = declaration.status;
  const identity = safeString(declaration.deviceId ?? declaration.serialHash ?? declaration.model);
  const signed = declaration.signedEvidence === true || declaration.verifier === "device-operator";
  if (kind !== "physical-device" || status !== "passed" || !identity || !signed) {
    return { status: "blocked", reason: "physical-device declaration is incomplete or unsigned", kind: kind ?? null, declaredStatus: status ?? null };
  }
  return { status: "observed", reason: "explicit physical-device declaration", kind, deviceId: identity };
}

function evaluateLongRun(receipt, runs) {
  const requested = positive(receipt?.longRunRequestedMs) ? receipt.longRunRequestedMs : LONG_RUN_DEFAULT_MS;
  const observed = positive(receipt?.longRunObservedMs) ? receipt.longRunObservedMs : 0;
  const longRunRecord = receipt?.longRunObservation;
  const explicit = isRecord(longRunRecord) && longRunRecord.status === "passed" && positive(longRunRecord.observedMs) && longRunRecord.observedMs >= requested && longRunRecord.signedEvidence === true;
  const runDuration = runs.reduce((max, run) => Math.max(max, positive(run?.durationMs) ? run.durationMs : 0), 0);
  if (explicit && observed >= requested) return { status: "observed", requestedMs: requested, observedMs: observed, maxRunMs: runDuration, reason: "explicit signed long-run observation" };
  return { status: "not-run", requestedMs: requested, observedMs: observed, maxRunMs: runDuration, reason: "no signed long-run observation; receipt metadata cannot promote itself" };
}

function evaluateRepeatCoverage(runs) {
  const repeats = runs.filter((run) => run?.scenario === "repeat-cycle");
  const complete = repeats.filter((run) => run?.status === "complete");
  const lifecycleKinds = new Set(complete.map((run) => classifyResourceEvidence(run, []).kind));
  const baseline = complete.filter((run) => run?.resources?.status === "baseline").length;
  return {
    requested: 3,
    observed: repeats.length,
    complete: complete.length,
    baseline,
    registryBacked: lifecycleKinds.has("full-registry"),
    status: complete.length >= 3 && baseline === complete.length && lifecycleKinds.has("full-registry") ? "qualified" : "blocked",
    reason: complete.length < 3 ? "fewer than three complete repeat-cycle runs" : lifecycleKinds.has("full-registry") ? "repeat-cycle registry evidence available" : "repeat-cycle resource evidence is digest-only or missing",
  };
}

function evaluateBuildIdentity(receipt, runs) {
  const build = isRecord(receipt?.build) ? receipt.build : null;
  const required = ["buildId", "branch", "head"];
  const missing = required.filter((field) => !safeString(build?.[field]));
  const runtimeMismatch = build && safeString(build.runtimeBuildId) && safeString(build.buildId)
    ? build.runtimeBuildId !== build.buildId
    : false;
  const runMismatches = runs.filter((run) => {
    if (!isRecord(run?.build) || !build) return true;
    return required.some((field) => run.build[field] !== build[field]);
  }).length;
  const status = missing.length === 0 && !runtimeMismatch && runMismatches === 0 ? "bound" : "blocked";
  return {
    status,
    buildId: safeString(build?.buildId),
    runtimeBuildId: safeString(build?.runtimeBuildId),
    branch: safeString(build?.branch),
    head: safeString(build?.head),
    missing,
    runtimeMismatch,
    runMismatches,
    reason: status === "bound" ? "receipt and every run share one build identity" : "build identity is incomplete or differs across observations",
  };
}

function validateBoundary(receipt) {
  const failures = [];
  const boundary = receipt?.boundary;
  if (!isRecord(boundary)) return ["boundary-missing"];
  if (boundary.candidateOnly !== true) failures.push("candidate-only-boundary");
  if (boundary.hold !== true) failures.push("hold-boundary");
  if (boundary.notAdmitted !== true) failures.push("not-admitted-boundary");
  if (boundary.scientificPayloadWriteback !== false) failures.push("scientific-payload-writeback");
  if (boundary.runtimePromotion !== "closed") failures.push("runtime-promotion");
  return failures;
}

function assess(receipt, receiptBytes) {
  const failures = validateBoundary(receipt);
  if (receipt?.schema !== "mainline-a-performance-evidence-v625") failures.push("source-schema");
  if (receipt?.version !== "v625-mainline-a-multi-device-lifecycle-evidence") failures.push("source-version");
  const runs = Array.isArray(receipt?.runs) ? receipt.runs : [];
  if (runs.length === 0) failures.push("no-runs");
  const runIds = new Set();
  const runAudits = runs.map((run, index) => {
    const result = validateRun(run, index, receipt?.build);
    if (result.runId && runIds.has(result.runId)) result.issues.push(issue("duplicate-run-id", "runId appears more than once", `runs[${index}].runId`));
    if (result.runId) runIds.add(result.runId);
    for (const item of result.issues) failures.push(`${item.code}:${item.location ?? `runs[${index}`}`);
    return {
      index,
      runId: result.runId ?? null,
      device: result.device ?? null,
      scenario: result.scenario ?? null,
      status: result.complete ? "complete" : "blocked",
      resourceEvidence: result.resource?.kind ?? "missing",
      resourceStatus: result.resource?.status ?? "not-run",
      issues: result.issues,
    };
  });
  const physicalMobile = evaluatePhysicalMobile(receipt);
  const longRun = evaluateLongRun(receipt, runs);
  const repeat = evaluateRepeatCoverage(runs);
  const buildIdentity = evaluateBuildIdentity(receipt, runs);
  if (buildIdentity.status !== "bound") failures.push("build-identity-unbound");
  if (physicalMobile.status !== "observed") failures.push("physical-device-not-run");
  if (longRun.status !== "observed") failures.push("long-run-observation-required");
  if (repeat.status !== "qualified") failures.push("repeat-cycle-lifecycle-unqualified");
  const digestOnlyRuns = runAudits.filter((run) => run.resourceEvidence === "digest-only").length;
  const fullRegistryRuns = runAudits.filter((run) => run.resourceEvidence === "full-registry").length;
  if (digestOnlyRuns > 0) failures.push("resource-lifecycle-digest-only");
  if (fullRegistryRuns === 0) failures.push("resource-registry-not-captured");
  const desktopRuns = runs.filter((run) => run?.device === "desktop").length;
  const mobileRuns = runs.filter((run) => run?.device === "mobile").length;
  const status = failures.length === 0 ? "qualified" : "blocked";
  return {
    schema: SCHEMA,
    version: VERSION,
    generatedAt: new Date().toISOString(),
    evidenceClass: EVIDENCE_CLASS,
    status,
    source: {
      receipt: relative(receiptPath),
      receiptSha256: sha256(receiptBytes),
      sourceSchema: receipt?.schema ?? null,
      sourceVersion: receipt?.version ?? null,
    },
    boundary: {
      candidateOnly: observedBoolean(receipt?.boundary?.candidateOnly),
      hold: observedBoolean(receipt?.boundary?.hold),
      notAdmitted: observedBoolean(receipt?.boundary?.notAdmitted),
      scientificPayloadWriteback: observedBoolean(receipt?.boundary?.scientificPayloadWriteback),
      runtimePromotion: receipt?.boundary?.runtimePromotion ?? null,
    },
    coverage: {
      runCount: runs.length,
      desktopRuns,
      mobileRuns,
      completeRuns: runAudits.filter((run) => run.status === "complete").length,
      blockedRuns: runAudits.filter((run) => run.status !== "complete").length,
      digestOnlyRuns,
      fullRegistryRuns,
      repeat: repeat,
    },
    physicalMobile,
    longRun,
    buildIdentity,
    runAudits,
    blockers: [...new Set(failures)].sort(),
    claims: {
      physicalMobilePerformance: physicalMobile.status === "observed",
      longRunPerformance: longRun.status === "observed",
      resourceRelease: fullRegistryRuns > 0 && digestOnlyRuns === 0 && failures.length === 0,
      realUserValidation: false,
      productionPerformance: false,
      scientificValidity: false,
      copyrightApproval: false,
    },
    notes: [
      "This verifier accepts only explicit source receipt fields and never promotes a mobile viewport to a physical device.",
      "Digest equality cannot prove texture, GPU, worker, owner, or memory release; full registry snapshots are required for lifecycle qualification.",
      "A long-run duration field is metadata until signed observation evidence is present.",
      "The audit is static evidence and cannot establish real-user validation, production performance, scientific validity, or copyright approval.",
      "Required boundary: candidate-only / hold / not-admitted with scientificPayloadWriteback=false; observed values are retained in boundary and violations block qualification.",
    ],
  };
}

async function readJsonWithBytes(file) {
  const bytes = await readFile(file);
  return { bytes, value: JSON.parse(bytes.toString("utf8")) };
}

async function main() {
  let source;
  try {
    source = await readJsonWithBytes(receiptPath);
  } catch (error) {
    console.log(JSON.stringify({ schema: SCHEMA, status: "blocked", blockers: ["receipt-read", error.message] }, null, 2));
    process.exitCode = 1;
    return;
  }
  const candidate = assess(source.value, source.bytes);
  const report = { ...candidate, auditDigest: digest(canonicalAudit(candidate)) };
  if (checkOnly) {
    try {
      const saved = await readJsonWithBytes(outputPath);
      const savedDigest = saved.value?.auditDigest;
      const expected = digest(canonicalAudit(saved.value));
      const issues = [];
      if (savedDigest !== expected) issues.push("saved-audit-digest");
      if (saved.value?.source?.receiptSha256 !== report.source.receiptSha256) issues.push("source-receipt-sha256");
      if (digest(canonicalAudit(saved.value)) !== digest(canonicalAudit(report))) issues.push("saved-audit-content");
      if (issues.length > 0) {
        console.log(JSON.stringify({ schema: SCHEMA, status: "blocked", output: relative(outputPath), blockers: issues }, null, 2));
        process.exitCode = 1;
        return;
      }
    } catch (error) {
      console.log(JSON.stringify({ schema: SCHEMA, status: "blocked", output: relative(outputPath), blockers: ["saved-audit-read", error.message] }, null, 2));
      process.exitCode = 1;
      return;
    }
  } else {
    await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  const result = {
    schema: SCHEMA,
    status: report.status,
    output: relative(outputPath),
    runCount: report.coverage.runCount,
    digestOnlyRuns: report.coverage.digestOnlyRuns,
    fullRegistryRuns: report.coverage.fullRegistryRuns,
    physicalMobile: report.physicalMobile.status,
    longRun: report.longRun.status,
    blockers: report.blockers,
    auditDigest: report.auditDigest,
    checkOnly,
  };
  console.log(jsonOnly ? JSON.stringify(result, null, 2) : `R65 lifecycle audit: ${result.status} runs=${result.runCount} digestOnly=${result.digestOnlyRuns} fullRegistry=${result.fullRegistryRuns}`);
}

main().catch((error) => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});

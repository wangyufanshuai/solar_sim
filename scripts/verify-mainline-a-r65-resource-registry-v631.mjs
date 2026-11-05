import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const DEFAULT_RECEIPT = "docs/release/v607/mainline-a-r65-performance-v625-20260922-050.json";
const DEFAULT_OUTPUT = "docs/release/v607/mainline-a-r65-resource-registry-v631.json";
const SCHEMA = "mainline-a-r65-resource-registry-v631";
const VERSION = "v631-mainline-a-r65-resource-registry-verifier";
const RESOURCE_SCHEMA = "mainline-a-resource-registry-snapshot-v631";
const PERFORMANCE_SCHEMA = "mainline-a-performance-evidence-v625";
const REQUIRED_STATES = ["acquired", "active", "release-requested", "released"];
const RESOURCE_KINDS = new Set(["texture", "gpu-buffer", "render-target", "compute-pipeline", "worker", "object-url", "subscription", "model", "typed-array-cache", "camera-lock"]);
const COUNT_FIELDS = ["total", "textures", "gpuBuffers", "gpuRenderTargets", "gpuComputePipelines", "gpuQueries", "workers", "models", "subscriptions", "objectUrls", "typedArrayCaches", "cameraLocks"];
const BYTE_FIELDS = ["estimatedBytes", "estimatedGpuBytes", "jsHeapUsedBytes", "jsHeapTotalBytes"];
const PHYSICAL_CLASSES = new Set(["physical-device", "real-device"]);

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

function integer(value) {
  return Number.isSafeInteger(value);
}

function nonNegative(value) {
  return finite(value) && value >= 0;
}

function positive(value) {
  return finite(value) && value > 0;
}

function safeString(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function relative(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function parseTime(value) {
  if (!safeString(value)) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sha256(value) {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(String(value), "utf8");
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

function issue(code, detail, location = null) {
  return { code, detail, severity: "error", ...(location ? { location } : {}) };
}

function digest(value) {
  return sha256(JSON.stringify(stable(value)));
}

function without(value, keys) {
  const copy = JSON.parse(JSON.stringify(value));
  for (const key of keys) delete copy[key];
  return copy;
}

function snapshotDigest(snapshot) {
  return digest(without(snapshot, ["identityDigest", "capturedAt", "recomputedSha256"]));
}

function validTimestamp(value) {
  return parseTime(value) !== null;
}

function countObjectValues(value) {
  if (!isRecord(value)) return null;
  const entries = Object.values(value);
  if (entries.some((entry) => !integer(entry) || entry < 0)) return null;
  return entries.reduce((sum, entry) => sum + entry, 0);
}

function mapCounts(entries, field) {
  const counts = {};
  for (const entry of entries) {
    const key = safeString(entry?.[field]);
    if (key) counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function mapsEqual(left, right) {
  return JSON.stringify(stable(left)) === JSON.stringify(stable(right));
}

function addIssue(issues, code, detail, location) {
  issues.push(issue(code, detail, location));
}

function validateEntry(entry, index, location, issues, expectedState) {
  if (!isRecord(entry)) {
    addIssue(issues, "registry-entry-object", "resource registry entries must be objects", `${location}[${index}]`);
    return null;
  }
  const resourceId = safeString(entry.resourceId ?? entry.id);
  const owner = safeString(entry.owner);
  const kind = safeString(entry.kind);
  const state = safeString(entry.state);
  if (!resourceId) addIssue(issues, "registry-entry-id", "resourceId is required", `${location}[${index}].resourceId`);
  if (!owner) addIssue(issues, "registry-entry-owner", "owner is required", `${location}[${index}].owner`);
  if (!kind || !RESOURCE_KINDS.has(kind)) addIssue(issues, "registry-entry-kind", "resource kind is not in the controlled registry vocabulary", `${location}[${index}].kind`);
  if (!state || !["active", "released"].includes(state)) addIssue(issues, "registry-entry-state", "entry state must be active or released", `${location}[${index}].state`);
  if (expectedState === "active" && state !== "active") addIssue(issues, "active-entry-state", "active snapshot cannot contain released entries", `${location}[${index}].state`);
  if (expectedState === "released" && state !== "released") addIssue(issues, "released-entry-state", "released snapshot cannot contain active entries", `${location}[${index}].state`);
  if (!nonNegative(entry.estimatedBytes)) addIssue(issues, "registry-entry-bytes", "estimatedBytes must be a non-negative number", `${location}[${index}].estimatedBytes`);
  if (!nonNegative(entry.estimatedGpuBytes)) addIssue(issues, "registry-entry-gpu-bytes", "estimatedGpuBytes must be a non-negative number", `${location}[${index}].estimatedGpuBytes`);
  return { resourceId, owner, kind, state, estimatedBytes: entry.estimatedBytes, estimatedGpuBytes: entry.estimatedGpuBytes };
}

function validateMap(name, map, entries, field, issues, location) {
  if (!isRecord(map)) {
    addIssue(issues, "registry-map-missing", `${name} must be an object`, `${location}.${name}`);
    return;
  }
  const expected = mapCounts(entries, field);
  const values = Object.fromEntries(Object.entries(map).map(([key, value]) => [key, value]));
  if (countObjectValues(values) === null) addIssue(issues, "registry-map-value", `${name} values must be non-negative integers`, `${location}.${name}`);
  if (!mapsEqual(values, expected)) addIssue(issues, "registry-map-mismatch", `${name} does not match the registry entries`, `${location}.${name}`);
}

function validateMetricFields(snapshot, issues, location) {
  for (const field of COUNT_FIELDS) {
    if (!integer(snapshot[field]) || snapshot[field] < 0) addIssue(issues, "registry-count-invalid", `${field} must be a non-negative integer`, `${location}.${field}`);
  }
  for (const field of BYTE_FIELDS) {
    if (!nonNegative(snapshot[field])) addIssue(issues, "registry-byte-invalid", `${field} must be a non-negative number`, `${location}.${field}`);
  }
  if (snapshot.total !== snapshot.entries.length) addIssue(issues, "registry-total-mismatch", "total must equal entries.length", `${location}.total`);
  if (snapshot.total !== snapshot.textures + snapshot.gpuBuffers + snapshot.gpuRenderTargets + snapshot.gpuComputePipelines + snapshot.workers + snapshot.models + snapshot.subscriptions + snapshot.objectUrls + snapshot.typedArrayCaches + snapshot.cameraLocks + snapshot.gpuQueries) {
    addIssue(issues, "registry-kind-total-mismatch", "resource totals must equal the controlled kind counters", `${location}.total`);
  }
  if (snapshot.jsHeapUsedBytes > snapshot.jsHeapTotalBytes) addIssue(issues, "registry-memory-order", "jsHeapUsedBytes cannot exceed jsHeapTotalBytes", `${location}.jsHeapUsedBytes`);
}

function validateSnapshot(raw, location, issues, expectedPhase) {
  if (!isRecord(raw)) {
    addIssue(issues, "registry-snapshot-missing", "full resource registry snapshot is required", location);
    return { kind: "missing", entries: [], digest: null, revision: null, phase: null, counts: null };
  }
  const unavailable = raw.registryContents === "unavailable" || raw.evidenceLimit === "digest-equality-only" || raw.source === "raw-dom-dataset";
  if (unavailable) addIssue(issues, "digest-only-not-registry", "digest-only or raw DOM resource observations cannot be promoted to a registry", location);
  if (raw.schema !== RESOURCE_SCHEMA) addIssue(issues, "registry-schema", `snapshot schema must be ${RESOURCE_SCHEMA}`, `${location}.schema`);
  if (raw.registryContents !== "captured") addIssue(issues, "registry-capture-state", "registryContents must be captured", `${location}.registryContents`);
  if (raw.evidenceClass !== "resource-registry-runtime-observation") addIssue(issues, "registry-evidence-class", "registry snapshot must identify a runtime registry observation", `${location}.evidenceClass`);
  if (raw.phase !== expectedPhase) addIssue(issues, "registry-phase", `snapshot phase must be ${expectedPhase}`, `${location}.phase`);
  if (!safeString(raw.identityDigest)) addIssue(issues, "registry-identity-digest", "identityDigest is required", `${location}.identityDigest`);
  if (!integer(raw.revision) || raw.revision < 0) addIssue(issues, "registry-revision", "revision must be a non-negative integer", `${location}.revision`);
  if (!validTimestamp(raw.capturedAt)) addIssue(issues, "registry-captured-at", "capturedAt must be an ISO timestamp", `${location}.capturedAt`);
  if (!Array.isArray(raw.entries)) addIssue(issues, "registry-entries", "entries must be an array", `${location}.entries`);
  const entries = Array.isArray(raw.entries) ? raw.entries.map((entry, index) => validateEntry(entry, index, `${location}.entries`, issues, raw.lifecycleState)) : [];
  const ids = new Set();
  for (const entry of entries.filter(Boolean)) {
    if (ids.has(entry.resourceId)) addIssue(issues, "registry-duplicate-id", `duplicate resource id ${entry.resourceId}`, location);
    ids.add(entry.resourceId);
  }
  if (!safeString(raw.lifecycleState) || !["active", "released"].includes(raw.lifecycleState)) addIssue(issues, "registry-lifecycle-state", "lifecycleState must be active or released", `${location}.lifecycleState`);
  validateMetricFields({ ...raw, entries }, issues, location);
  validateMap("byOwner", raw.byOwner, entries.filter(Boolean), "owner", issues, location);
  validateMap("byKind", raw.byKind, entries.filter(Boolean), "kind", issues, location);
  if (!safeString(raw.runtimeBuildId)) addIssue(issues, "registry-runtime-build", "runtimeBuildId is required", `${location}.runtimeBuildId`);
  const recomputed = snapshotDigest(raw);
  if (raw.recomputedSha256 !== recomputed) addIssue(issues, "registry-sha256", "recomputedSha256 does not match the canonical snapshot bytes", `${location}.recomputedSha256`);
  if (raw.identityDigest !== recomputed.slice(0, 16)) addIssue(issues, "registry-identity-mismatch", "identityDigest must be the first 16 hex characters of the recomputed SHA-256", `${location}.identityDigest`);
  const kind = unavailable ? "digest-only" : issues.some((entry) => entry.location?.startsWith(location)) ? "invalid" : "full-registry";
  return { kind, entries: entries.filter(Boolean), digest: safeString(raw.identityDigest), revision: integer(raw.revision) ? raw.revision : null, phase: raw.phase, counts: { total: raw.total, estimatedBytes: raw.estimatedBytes, estimatedGpuBytes: raw.estimatedGpuBytes, jsHeapUsedBytes: raw.jsHeapUsedBytes } };
}

function expectedDevice(viewport) {
  if (!isRecord(viewport) || !positive(viewport.width)) return null;
  return viewport.width < 700 ? "mobile" : "desktop";
}

function validateTransition(resources, location, before, after, issues) {
  const transition = resources?.transition;
  if (!Array.isArray(transition) || transition.length < REQUIRED_STATES.length) {
    addIssue(issues, "transition-missing", "a complete acquired-active-release-requested-released transition ledger is required", `${location}.transition`);
    return { status: "missing", states: [], releaseQualified: false, repeated: false };
  }
  const states = transition.map((entry) => safeString(entry?.state));
  if (REQUIRED_STATES.some((state, index) => states[index] !== state)) addIssue(issues, "transition-order", "transition states must be acquired, active, release-requested, released", `${location}.transition`);
  const times = transition.map((entry) => parseTime(entry?.at));
  if (times.some((time) => time === null)) addIssue(issues, "transition-time", "every transition event must have an ISO at timestamp", `${location}.transition`);
  if (times.some((time, index) => index > 0 && time !== null && times[index - 1] !== null && time < times[index - 1])) addIssue(issues, "transition-time-order", "transition event timestamps must be monotonic", `${location}.transition`);
  for (const [index, event] of transition.entries()) {
    if (!integer(event?.resourceCount) || event.resourceCount < 0) addIssue(issues, "transition-resource-count", "resourceCount must be a non-negative integer", `${location}.transition[${index}].resourceCount`);
    if (!nonNegative(event?.estimatedBytes) || !nonNegative(event?.estimatedGpuBytes)) addIssue(issues, "transition-byte-count", "transition byte counters must be non-negative", `${location}.transition[${index}]`);
    if (!nonNegative(event?.jsHeapUsedBytes)) addIssue(issues, "transition-memory-count", "jsHeapUsedBytes must be non-negative", `${location}.transition[${index}].jsHeapUsedBytes`);
  }
  const released = transition.at(-1);
  if (released?.resourceCount !== 0 || released?.estimatedBytes !== 0 || released?.estimatedGpuBytes !== 0) addIssue(issues, "release-not-zero", "released transition must prove zero retained resources and bytes", `${location}.transition`);
  if (before.kind !== "full-registry" || after.kind !== "full-registry") addIssue(issues, "transition-overclaim", "transition release cannot be qualified without full registry snapshots", location);
  if (before.revision !== null && after.revision !== null && after.revision <= before.revision) addIssue(issues, "registry-revision-order", "after registry revision must be greater than before revision", location);
  if (before.digest && after.digest && before.digest === after.digest) addIssue(issues, "registry-digest-unchanged", "before and after registry identities must differ after release", location);
  if (before.counts && after.counts && after.counts.total !== 0) addIssue(issues, "registry-retained-count", "after snapshot retains resources", `${location}.after.total`);
  const ownerRetention = Array.isArray(resources.unreleasedOwners) && resources.unreleasedOwners.length > 0;
  if (ownerRetention) addIssue(issues, "unreleased-owner", "release ledger contains unreleased owners", `${location}.unreleasedOwners`);
  const statesComplete = REQUIRED_STATES.every((state, index) => states[index] === state);
  return { status: statesComplete && released?.resourceCount === 0 ? "qualified" : "blocked", states, releaseQualified: statesComplete && released?.resourceCount === 0, repeated: transition.length > REQUIRED_STATES.length };
}

function validateMemory(resources, location, issues) {
  const metrics = resources?.memory;
  if (!isRecord(metrics)) {
    addIssue(issues, "memory-ledger-missing", "before and after memory measurements are required", `${location}.memory`);
    return { status: "missing", deltaBytes: null };
  }
  const before = metrics.before;
  const after = metrics.after;
  if (!isRecord(before) || !isRecord(after)) {
    addIssue(issues, "memory-ledger-shape", "memory.before and memory.after are required", `${location}.memory`);
    return { status: "invalid", deltaBytes: null };
  }
  for (const [side, sample] of [["before", before], ["after", after]]) {
    for (const field of ["jsHeapUsedBytes", "jsHeapTotalBytes", "gpuBytes"]) {
      if (!nonNegative(sample[field])) addIssue(issues, "memory-field-invalid", `${field} must be non-negative`, `${location}.memory.${side}.${field}`);
    }
    if (nonNegative(sample.jsHeapUsedBytes) && nonNegative(sample.jsHeapTotalBytes) && sample.jsHeapUsedBytes > sample.jsHeapTotalBytes) addIssue(issues, "memory-order", "heap used bytes cannot exceed heap total bytes", `${location}.memory.${side}`);
  }
  const deltaBytes = nonNegative(before.jsHeapUsedBytes) && nonNegative(after.jsHeapUsedBytes) ? after.jsHeapUsedBytes - before.jsHeapUsedBytes : null;
  const gpuDeltaBytes = nonNegative(before.gpuBytes) && nonNegative(after.gpuBytes) ? after.gpuBytes - before.gpuBytes : null;
  if (gpuDeltaBytes !== null && gpuDeltaBytes > 0) addIssue(issues, "gpu-memory-retained", "GPU bytes increased after release", `${location}.memory.after.gpuBytes`);
  return { status: issues.some((entry) => entry.location?.startsWith(`${location}.memory`)) ? "invalid" : "observed", deltaBytes, gpuDeltaBytes };
}

function validateRun(run, index, build, issues) {
  const location = `runs[${index}]`;
  if (!isRecord(run)) {
    addIssue(issues, "run-object", "run must be an object", location);
    return { valid: false, fullRegistry: false, transition: "missing", device: null, scenario: null, runId: null };
  }
  const runId = safeString(run.runId);
  if (!runId) addIssue(issues, "run-id", "runId is required", `${location}.runId`);
  if (!["desktop", "mobile"].includes(run.device)) addIssue(issues, "run-device", "device must be desktop or mobile", `${location}.device`);
  if (expectedDevice(run.viewport) && expectedDevice(run.viewport) !== run.device) addIssue(issues, "viewport-device-mismatch", "viewport class does not match declared device", `${location}.device`);
  if (run.device === "mobile" && run.viewport?.userAgentClass === "mobile-viewport") addIssue(issues, "viewport-is-not-physical-device", "a simulated mobile viewport cannot certify physical-device lifecycle behavior", `${location}.viewport.userAgentClass`);
  if (!isRecord(run.viewport) || !positive(run.viewport.width) || !positive(run.viewport.height) || !positive(run.viewport.devicePixelRatio)) addIssue(issues, "viewport", "viewport width, height, and DPR must be positive", `${location}.viewport`);
  const started = parseTime(run.startedAt);
  const ended = parseTime(run.endedAt);
  if (started === null || ended === null) addIssue(issues, "run-time", "startedAt and endedAt must be ISO timestamps", location);
  if (started !== null && ended !== null && ended < started) addIssue(issues, "run-time-order", "endedAt precedes startedAt", location);
  if (!positive(run.durationMs)) addIssue(issues, "run-duration", "durationMs must be positive", `${location}.durationMs`);
  if (run.status !== "complete") addIssue(issues, "run-status", "only complete runs are eligible for lifecycle qualification", `${location}.status`);
  if (run.consoleErrors !== 0 || run.pageErrors !== 0) addIssue(issues, "run-errors", "consoleErrors and pageErrors must both be zero", location);
  for (const field of ["buildId", "branch", "head"]) {
    if (!safeString(run.build?.[field])) addIssue(issues, "run-build", `${field} is required`, `${location}.build.${field}`);
    if (safeString(build?.[field]) && run.build?.[field] !== build[field]) addIssue(issues, "run-build-mismatch", `${field} differs from receipt build`, `${location}.build.${field}`);
  }
  const resources = isRecord(run.resources) ? run.resources : null;
  if (!resources) {
    addIssue(issues, "resources", "resources object is required", `${location}.resources`);
    return { valid: false, fullRegistry: false, transition: "missing", device: run.device, scenario: run.scenario, runId };
  }
  const beforeIssues = [];
  const before = validateSnapshot(resources.before, `${location}.resources.before`, beforeIssues, "before");
  const after = validateSnapshot(resources.after, `${location}.resources.after`, beforeIssues, "after");
  issues.push(...beforeIssues);
  const transition = validateTransition(resources, `${location}.resources`, before, after, issues);
  const memory = validateMemory(resources, `${location}.resources`, issues);
  if (resources.status !== "baseline") addIssue(issues, "resource-status", "resource status must be baseline for release evidence", `${location}.resources.status`);
  const fullRegistry = before.kind === "full-registry" && after.kind === "full-registry" && transition.releaseQualified && memory.status === "observed";
  return { valid: fullRegistry && issues.filter((entry) => entry.location?.startsWith(location)).length === 0, fullRegistry, transition: transition.status, memory: memory.status, device: run.device, scenario: run.scenario, runId, before, after };
}

function evaluatePhysicalDevice(receipt, runs, issues) {
  const declaration = receipt?.observationSource?.physicalMobileDevice;
  if (!isRecord(declaration)) {
    addIssue(issues, "physical-mobile-not-run", "no signed physical mobile device declaration is present", "observationSource.physicalMobileDevice");
    return { status: "not-run", kind: null, deviceId: null, signed: false };
  }
  const kind = safeString(declaration.kind ?? declaration.type);
  const deviceId = safeString(declaration.deviceId ?? declaration.serialHash ?? declaration.model);
  const signed = declaration.signedEvidence === true || declaration.verifier === "device-operator";
  if (!PHYSICAL_CLASSES.has(kind) || declaration.status !== "passed" || !deviceId || !signed) {
    addIssue(issues, "physical-mobile-incomplete", "physical mobile evidence must identify a device and be signed", "observationSource.physicalMobileDevice");
    return { status: "blocked", kind, deviceId, signed };
  }
  return { status: "observed", kind, deviceId, signed, mobileRuns: runs.filter((run) => run.device === "mobile").length };
}

function evaluateLongRun(receipt, issues) {
  const requestedMs = positive(receipt?.longRunRequestedMs) ? receipt.longRunRequestedMs : 30 * 60 * 1000;
  const observation = receipt?.longRunObservation;
  const valid = isRecord(observation) && observation.status === "passed" && positive(observation.observedMs) && observation.observedMs >= requestedMs && observation.signedEvidence === true;
  if (!valid) addIssue(issues, "long-run-not-run", "a signed observation at or above the requested duration is required", "longRunObservation");
  return { status: valid ? "observed" : "not-run", requestedMs, observedMs: valid ? observation.observedMs : 0, signed: valid };
}

function validateBoundary(receipt, issues) {
  const boundary = receipt?.boundary ?? {};
  if (boundary.candidateOnly !== true) addIssue(issues, "boundary-candidate-only", "candidateOnly must remain true", "boundary.candidateOnly");
  if (boundary.hold !== true) addIssue(issues, "boundary-hold", "hold must remain true", "boundary.hold");
  if (boundary.notAdmitted !== true) addIssue(issues, "boundary-not-admitted", "notAdmitted must remain true", "boundary.notAdmitted");
  if (boundary.scientificPayloadWriteback !== false) addIssue(issues, "boundary-writeback", "scientificPayloadWriteback must remain false", "boundary.scientificPayloadWriteback");
  if (boundary.runtimePromotion !== "closed") addIssue(issues, "boundary-runtime-promotion", "runtimePromotion must remain closed", "boundary.runtimePromotion");
  return { candidateOnly: boundary.candidateOnly === true, hold: boundary.hold === true, notAdmitted: boundary.notAdmitted === true, scientificPayloadWriteback: boundary.scientificPayloadWriteback === false, runtimePromotion: boundary.runtimePromotion ?? null };
}

function validateClaims(receipt, issues) {
  const claims = receipt?.claims ?? {};
  for (const field of ["realUserValidation", "productionPerformance", "scientificValidity"]) if (claims[field] === true) addIssue(issues, "claim-overreach", `${field} must remain false`, `claims.${field}`);
  return { realUserValidation: claims.realUserValidation === true, productionPerformance: claims.productionPerformance === true, scientificValidity: claims.scientificValidity === true };
}

function summarizeRun(runAudit) {
  return { runId: runAudit.runId, device: runAudit.device, scenario: runAudit.scenario, fullRegistry: runAudit.fullRegistry, transition: runAudit.transition, memory: runAudit.memory ?? "missing", beforeDigest: runAudit.before?.digest ?? null, afterDigest: runAudit.after?.digest ?? null };
}

function buildReport(receipt, sourceBytes) {
  const issues = [];
  if (receipt.schema !== PERFORMANCE_SCHEMA) addIssue(issues, "performance-schema", `source receipt schema must be ${PERFORMANCE_SCHEMA}`, "schema");
  if (!Array.isArray(receipt.runs) || receipt.runs.length === 0) addIssue(issues, "runs-missing", "at least one performance run is required", "runs");
  const build = isRecord(receipt.build) ? receipt.build : {};
  for (const field of ["buildId", "branch", "head"]) if (!safeString(build[field])) addIssue(issues, "build-identity", `${field} is required`, `build.${field}`);
  const boundary = validateBoundary(receipt, issues);
  const runAudits = (Array.isArray(receipt.runs) ? receipt.runs : []).map((run, index) => validateRun(run, index, build, issues));
  const ids = runAudits.map((run) => run.runId).filter(Boolean);
  if (new Set(ids).size !== ids.length) addIssue(issues, "duplicate-run-ids", "run identifiers must be unique", "runs");
  const repeats = runAudits.filter((run) => run.scenario === "repeat-cycle");
  const desktopRepeats = repeats.filter((run) => run.device === "desktop" && run.fullRegistry);
  const mobileRepeats = repeats.filter((run) => run.device === "mobile" && run.fullRegistry);
  if (desktopRepeats.length < 3) addIssue(issues, "repeat-desktop-insufficient", "at least three full-registry desktop repeat cycles are required", "runs");
  if (mobileRepeats.length < 3) addIssue(issues, "repeat-mobile-insufficient", "at least three full-registry mobile repeat cycles are required", "runs");
  const physicalDevice = evaluatePhysicalDevice(receipt, runAudits, issues);
  const longRun = evaluateLongRun(receipt, issues);
  const claims = validateClaims(receipt, issues);
  const blockers = [...new Set(issues.map((entry) => entry.code))].sort();
  const coverage = {
    runCount: runAudits.length,
    fullRegistryRuns: runAudits.filter((run) => run.fullRegistry).length,
    digestOnlyRuns: runAudits.filter((run) => !run.fullRegistry).length,
    desktopRepeatRuns: desktopRepeats.length,
    mobileRepeatRuns: mobileRepeats.length,
    transitionQualifiedRuns: runAudits.filter((run) => run.transition === "qualified").length,
    memoryObservedRuns: runAudits.filter((run) => run.memory === "observed").length,
  };
  const status = blockers.length === 0 ? "verified" : "blocked";
  const report = {
    schema: SCHEMA,
    version: VERSION,
    generatedAt: new Date().toISOString(),
    sourceReceipt: relative(receiptPath),
    sourceReceiptSha256: sha256(sourceBytes),
    evidenceClass: "static-resource-registry-verifier",
    status,
    boundary,
    build: { buildId: safeString(build.buildId), runtimeBuildId: safeString(build.runtimeBuildId), branch: safeString(build.branch), head: safeString(build.head) },
    coverage,
    physicalDevice,
    longRun,
    claims,
    runAudits: runAudits.map(summarizeRun),
    blockers,
    issues,
    replay: { mode: "deterministic-registry-transition-replay", sourceRuns: runAudits.length, transitionStates: REQUIRED_STATES, digestOnlyRejected: true, viewportIsPhysicalRejected: true },
    notes: [
      "Full registry qualification requires recomputable SHA-256 snapshots, per-owner and per-kind maps, transitions, memory samples, and zero retained resources after release.",
      "Digest-only raw DOM observations are fail-closed and cannot be promoted to registry evidence.",
      "A mobile viewport is not a physical device and cannot close the physical-device gate.",
      "No screenshot, fixture, timeout artifact, generated manifest, or simulated viewport is treated as production, scientific, legal, or real-user evidence.",
      "candidate-only / hold / not-admitted; scientificPayloadWriteback=false.",
    ],
  };
  report.auditDigest = digest(without(report, ["generatedAt", "auditDigest"]));
  return report;
}

const sourceBytes = await readFile(receiptPath);
const receipt = JSON.parse(sourceBytes.toString("utf8"));
const report = buildReport(receipt, sourceBytes);
if (!checkOnly) await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
if (jsonOnly) console.log(JSON.stringify(report, null, 2));
else console.log(`R65 resource registry: ${report.status} runs=${report.coverage.runCount} fullRegistry=${report.coverage.fullRegistryRuns} blockers=${report.blockers.length}`);
console.log(`static registry evidence=${relative(outputPath)}`);
if (checkOnly && report.status !== "verified") process.exitCode = 1;

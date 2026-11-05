import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createHash } from "node:crypto";

/**
 * Convert an unmodified in-app-browser DOM capture into the R65 ledger.
 *
 * Input contract:
 * {
 *   schema: "mainline-a-browser-performance-raw-dom-v625",
 *   capturedAt, url, surface: "Codex in-app browser",
 *   buildObservation: unmodified root DOM dataset,
 *   consoleObservation: unmodified dev.logs output,
 *   rows: [ exact element.dataset maps, without normalization ]
 * }
 *
 * `buildId` on a row is the runtime marker emitted by the performance panel.
 * It is copied to `runtimeBuildId` in the normalized receipt only after it is
 * compared with buildObservation.runtimeBuildId and the passed build report.
 * There is no fallback to a base receipt, no fabricated resource snapshot,
 * and no default for a missing numeric field.
 */

const root = process.cwd();
const RAW_SCHEMA = "mainline-a-browser-performance-raw-dom-v625";
const OUTPUT_SCHEMA = "mainline-a-performance-evidence-v625";
const VERSION = "v625-mainline-a-multi-device-lifecycle-evidence";
const EVIDENCE_CLASS = "browser-runtime-observation";
const SURFACE = "Codex in-app browser";
const PHYSICAL_MOBILE_NOT_RUN = "not-run";

const boundary = Object.freeze({
  candidateOnly: true,
  hold: true,
  notAdmitted: true,
  scientificPayloadWriteback: false,
  runtimePromotion: "closed",
});

const arg = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
};

const inputPath = path.resolve(root, arg("--input", "docs/release/v607/mainline-a-r65-browser-raw-dom-v625.json"));
const buildPath = path.resolve(root, arg("--build", "docs/release/v607/mainline-a-r65-build-20260922-041.json"));
const outputPath = path.resolve(root, arg("--output", "docs/release/v607/mainline-a-r65-performance-v625.json"));
// Kept as a compatibility flag for callers of the previous converter. It is
// intentionally never opened: a prior receipt cannot supply evidence.
const ignoredBasePath = arg("--base", null);
const checkOnly = process.argv.includes("--check");
const jsonOnly = process.argv.includes("--json");

const topLevelKeys = new Set([
  "schema", "capturedAt", "url", "surface", "buildObservation",
  "consoleObservation", "rows", "physicalMobileDevice", "notes",
  "realUserValidation", "productionPerformanceClaim",
]);
const buildObservationKeys = new Set([
  "buildId", "runtimeBuildId", "artifactBuildId", "branch", "head",
  "route", "source", "buildArtifactId",
]);
const observedBuildStateKeys = new Set([
  "mainline_a_constellation_asterism_opacity", "mainline_a_constellation_asterism_ready",
  "mainline_a_constellation_asterism_segment_count", "mainline_a_constellation_asterism_source",
  "mainline_a_constellation_asterism_visible", "mainline_a_constellation_boundary_opacity",
  "mainline_a_constellation_boundary_segment_count", "mainline_a_constellation_boundary_visible",
  "mainline_a_constellation_enabled", "mainline_a_constellation_figure_segment_count",
  "mainline_a_constellation_focus_pulse", "mainline_a_constellation_layer",
  "mainline_a_constellation_lod_tier", "mainline_a_constellation_presentation_lod_tier",
  "mainline_a_constellation_quality_tier", "mainline_a_constellation_scale_band",
  "mainline_a_next_web_runtime_name", "mainline_a_release_boundary",
  "mainline_a_release_identity", "mainline_a_root_runtime_name",
  "mainline_a_runtime_name_relation", "mainline_a_scientific_payload_writeback",
  "mainline_branch", "mainline_build_id", "mainline_head", "mainline_route",
  "build_artifact_id",
]);
const consoleObservationKeys = new Set([
  "consoleErrors", "pageErrors", "logs", "consoleErrorMessages",
  "pageErrorMessages", "errors", "entries", "page_error_count",
]);
// These are the camelCase and snake_case keys produced by DOMStringMap.
// Do not add receipt-only keys here: accepting them would turn a normalized
// receipt into an accidental input fixture.
const rowAliases = Object.freeze({
  runId: ["runId", "run_id", "mainline_a_performance_run", "mainlineAPerformanceRun"],
  device: ["device"],
  scenario: ["scenario"],
  width: ["viewportWidth", "viewport_width"],
  height: ["viewportHeight", "viewport_height"],
  dpr: ["viewportDpr", "viewport_dpr"],
  orientation: ["viewportOrientation", "viewport_orientation"],
  durationMs: ["durationMs", "duration_ms"],
  startedAt: ["startedAt", "started_at"],
  endedAt: ["endedAt", "ended_at"],
  frameSamples: ["frameSamples", "frame_samples"],
  frameDurationMs: ["frameDurationMs", "frame_duration_ms"],
  p50Ms: ["frameP50Ms", "frame_p50_ms"],
  p95Ms: ["frameP95Ms", "frame_p95_ms"],
  maxMs: ["frameMaxMs", "frame_max_ms"],
  medianFps: ["medianFps", "median_fps"],
  // Browser DOMStringMap preserves the hyphen after `under` for
  // data-under-50-ms-ratio, producing `under-50MsRatio`; keep that exact
  // spelling as a raw alias instead of rewriting the captured dataset.
  under50MsRatio: ["under50MsRatio", "under_50_ms_ratio", "under-50MsRatio"],
  longTaskCount: ["longTaskCount", "long_task_count"],
  longTaskMaxMs: ["longTaskMaxMs", "long_task_max_ms"],
  heapUsedBytes: ["heapUsedBytes", "heap_used_bytes"],
  heapTotalBytes: ["heapTotalBytes", "heap_total_bytes"],
  heapLimitBytes: ["heapLimitBytes", "heap_limit_bytes"],
  memorySource: ["memorySource", "memory_source"],
  resourceStatus: ["resourceStatus", "resource_status"],
  resourceBefore: ["resourceBefore", "resource_before"],
  resourceAfter: ["resourceAfter", "resource_after"],
  resourceBeforeRevision: ["resourceBeforeRevision", "resource_before_revision"],
  resourceAfterRevision: ["resourceAfterRevision", "resource_after_revision"],
  resourceRepeatedIndex: ["resourceRepeatedIndex", "resource_repeated_index"],
  resourceDiffTotal: ["resourceDiffTotal", "resource_diff_total"],
  resourceDiffEstimatedBytes: ["resourceDiffEstimatedBytes", "resource_diff_estimated_bytes"],
  runStatus: ["runStatus", "run_status"],
  consoleErrors: ["consoleErrors", "console_errors"],
  pageErrors: ["pageErrors", "page_errors"],
  buildId: ["buildId", "build_id"],
  buildBranch: ["buildBranch", "build_branch"],
  buildHead: ["buildHead", "build_head"],
  buildRoute: ["buildRoute", "build_route"],
  documentVisibility: ["documentVisibility", "document_visibility"],
  rootVisible: ["rootVisible", "root_visible"],
  canvasCount: ["canvasCount", "canvas_count"],
  panelVisible: ["panelVisible", "panel_visible"],
});
const rawRowKeys = new Set(Object.values(rowAliases).flat());
const requiredRowKeys = [
  "runId", "device", "scenario", "width", "height", "dpr", "orientation",
  "durationMs", "startedAt", "endedAt", "frameSamples", "frameDurationMs",
  "p50Ms", "p95Ms", "maxMs", "medianFps", "under50MsRatio", "longTaskCount",
  "longTaskMaxMs", "heapUsedBytes", "heapTotalBytes", "heapLimitBytes",
  "memorySource", "resourceStatus", "resourceBefore", "resourceAfter",
  "resourceBeforeRevision", "resourceAfterRevision", "resourceRepeatedIndex",
  "runStatus", "consoleErrors", "pageErrors", "buildId", "buildBranch",
  "buildHead", "documentVisibility", "rootVisible", "canvasCount", "panelVisible",
];

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, stable(entry)]));
  }
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

function relative(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function readJsonWithHash(file) {
  const bytes = await readFile(file);
  return { value: JSON.parse(bytes.toString("utf8")), sha256: sha256(bytes) };
}

function comparableReceipt(receipt) {
  const copy = JSON.parse(JSON.stringify(receipt));
  delete copy.generatedAt;
  delete copy.staticEvidence;
  return copy;
}

function canonicalDigest(receipt) {
  return digest(comparableReceipt(receipt));
}

function issue(code, detail, pathName = null) {
  return { code, detail, ...(pathName ? { path: pathName } : {}), severity: "error" };
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function unknownKeys(value, allowed, prefix) {
  if (!isRecord(value)) return [];
  return Object.keys(value)
    .filter((key) => !allowed.has(key))
    .map((key) => issue("unknown-field", `unknown field ${key}`, `${prefix}.${key}`));
}

function nonEmptyString(value, field, issues) {
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push(issue("string-required", `${field} must be a non-empty string`, field));
    return null;
  }
  return value.trim();
}

function numeric(value, field, issues, { integer = false, nullable = false, positive = false } = {}) {
  if (nullable && (value === null || value === "")) return null;
  if (!["number", "string"].includes(typeof value) || String(value).trim() === "") {
    issues.push(issue("number-required", `${field} must be a finite numeric value`, field));
    return null;
  }
  if (typeof value === "string" && !/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:e[+-]?\d+)?$/iu.test(value)) {
    issues.push(issue("number-invalid", `${field} must be a decimal numeric string without coercion`, field));
    return null;
  }
  const parsed = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(parsed) || (integer && !Number.isSafeInteger(parsed)) || (integer && !Number.isInteger(parsed))) {
    issues.push(issue("number-invalid", `${field} is not a finite ${integer ? "integer" : "number"}`, field));
    return null;
  }
  if (positive && parsed <= 0) {
    issues.push(issue("number-range", `${field} must be greater than zero`, field));
    return null;
  }
  return integer ? Math.trunc(parsed) : parsed;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function aliasValue(record, aliases, field, issues) {
  const keys = aliases.filter((key) => Object.hasOwn(record, key));
  if (keys.some((key) => record[key] !== record[keys[0]])) {
    issues.push(issue("alias-conflict", `conflicting aliases for ${field}`, field));
  }
  return keys.length ? record[keys[0]] : undefined;
}

function booleanValue(value, field, issues) {
  if (value === true || value === false) return value;
  if (value === "true") return true;
  if (value === "false") return false;
  issues.push(issue("boolean-invalid", `${field} must be true or false`, field));
  return null;
}

function iso(value, field, issues) {
  const text = nonEmptyString(value, field, issues);
  if (!text) return null;
  const time = Date.parse(text);
  if (!Number.isFinite(time)) {
    issues.push(issue("timestamp-invalid", `${field} must be an ISO-compatible timestamp`, field));
    return null;
  }
  return new Date(time).toISOString();
}

function checkObject(value, field, issues) {
  if (!isRecord(value)) issues.push(issue("object-required", `${field} must be an object`, field));
  return isRecord(value);
}

function validateBuildObservation(input, build, issues) {
  const observation = input.buildObservation;
  if (!checkObject(observation, "buildObservation", issues)) return null;
  if (!build || build.status !== "passed") {
    issues.push(issue("build-report-status", "passed build report is required for browser receipt conversion", "build"));
  }
  // The root dataset also contains visual/runtime state fields. Keep those
  // keys as observed metadata, while rejecting an unrelated forged key.
  const allowedBuildKey = (key) => buildObservationKeys.has(key) || observedBuildStateKeys.has(key);
  issues.push(...Object.keys(observation)
    .filter((key) => !allowedBuildKey(key))
    .map((key) => issue("unknown-field", `unknown build observation field ${key}`, `buildObservation.${key}`)));
  const pick = (keys) => keys.map((key) => observation[key]).find((value) => value !== undefined);
  const buildId = nonEmptyString(pick(["buildId", "mainline_build_id"]), "buildObservation.buildId", issues);
  const runtimeBuildId = nonEmptyString(pick(["runtimeBuildId", "mainline_build_id"]), "buildObservation.runtimeBuildId", issues);
  const branch = nonEmptyString(pick(["branch", "mainline_branch"]), "buildObservation.branch", issues);
  const head = nonEmptyString(pick(["head", "mainline_head"]), "buildObservation.head", issues);
  const route = nonEmptyString(pick(["route", "mainline_route"]) ?? "/", "buildObservation.route", issues);
  if (buildId && runtimeBuildId && buildId !== runtimeBuildId) {
    issues.push(issue("build-observation-identity", "DOM buildId and runtimeBuildId differ", "buildObservation"));
  }
  if (build && runtimeBuildId && runtimeBuildId !== build.runtimeBuildId) {
    issues.push(issue("build-report-runtime-mismatch", "DOM runtimeBuildId does not match passed build report", "buildObservation.runtimeBuildId"));
  }
  if (build && branch && branch !== build.branch) {
    issues.push(issue("build-report-branch-mismatch", "DOM branch does not match passed build report", "buildObservation.branch"));
  }
  if (build && head && head !== build.head) {
    issues.push(issue("build-report-head-mismatch", "DOM head does not match passed build report", "buildObservation.head"));
  }
  const rawArtifactBuildId = aliasValue(
    observation,
    ["artifactBuildId", "buildArtifactId", "build_artifact_id"],
    "buildObservation.build_artifact_id",
    issues,
  );
  if (rawArtifactBuildId !== undefined) {
    nonEmptyString(rawArtifactBuildId, "buildObservation.build_artifact_id", issues);
    if (rawArtifactBuildId !== build?.buildId) {
      issues.push(issue(
        "build-report-artifact-mismatch",
        "raw capture artifact build ID does not match the passed build report; the capture cannot be rebound to another artifact",
        "buildObservation.build_artifact_id",
      ));
    }
  }
  return {
    buildId,
    runtimeBuildId,
    branch,
    head,
    route,
    // A copied artifact label is not independent browser proof. When present
    // it still constrains the capture to that exact artifact; never replace
    // a conflicting label with the expected value from another build.
    artifactBuildId: rawArtifactBuildId === undefined ? build?.buildId ?? null : rawArtifactBuildId,
    artifactBuildIdSource: "passed-build-report",
  };
}

function validateConsoleObservation(input, issues) {
  const observation = input.consoleObservation;
  if (!checkObject(observation, "consoleObservation", issues)) return { consoleErrors: null, pageErrors: null, logs: [] };
  issues.push(...unknownKeys(observation, consoleObservationKeys, "consoleObservation"));
  const consoleErrors = numeric(observation.consoleErrors ?? observation.errors, "consoleObservation.consoleErrors", issues, { integer: true });
  const pageErrors = numeric(observation.pageErrors ?? observation.page_error_count ?? 0, "consoleObservation.pageErrors", issues, { integer: true });
  const logsValue = observation.logs ?? observation.entries;
  if (!Array.isArray(logsValue)) issues.push(issue("logs-required", "consoleObservation.logs must be an array", "consoleObservation.logs"));
  const logs = Array.isArray(logsValue) ? logsValue : [];
  if (logs.some((entry) => typeof entry !== "string" && !isRecord(entry))) {
    issues.push(issue("logs-invalid", "consoleObservation.logs entries must be strings or records", "consoleObservation.logs"));
  }
  return { consoleErrors, pageErrors, logs };
}

function validateRawEnvelope(input, build) {
  const issues = [];
  if (!isRecord(input)) return { issues: [issue("input-object", "raw capture must be an object")], buildObservation: null, consoleObservation: null };
  issues.push(...unknownKeys(input, topLevelKeys, "input"));
  if (input.schema !== RAW_SCHEMA) issues.push(issue("input-schema", `expected ${RAW_SCHEMA}`, "schema"));
  if (input.surface !== SURFACE) issues.push(issue("surface", `surface must be ${SURFACE}`, "surface"));
  iso(input.capturedAt, "capturedAt", issues);
  nonEmptyString(input.url, "url", issues);
  const buildObservation = validateBuildObservation(input, build, issues);
  const consoleObservation = validateConsoleObservation(input, issues);
  if (!Array.isArray(input.rows) || input.rows.length < 6) issues.push(issue("row-count", "at least three desktop and three mobile rows are required", "rows"));
  return { issues, buildObservation, consoleObservation };
}

function normalizeRow(raw, index, expectedBuild, issues) {
  const prefix = `rows[${index}]`;
  if (!isRecord(raw)) {
    issues.push(issue("row-object", "row must be a dataset object", prefix));
    return null;
  }
  const sourceRaw = raw;
  issues.push(...unknownKeys(sourceRaw, rawRowKeys, prefix));
  // Keep the source map untouched; this local view only gives the parser one
  // canonical spelling for camelCase and raw DOM snake_case exports.
  raw = Object.fromEntries(Object.entries(rowAliases).map(([canonical, aliases]) => [
    canonical,
    aliasValue(sourceRaw, aliases, `${prefix}.${canonical}`, issues),
  ]));
  for (const key of requiredRowKeys) {
    if (!(key in raw) || raw[key] === undefined) issues.push(issue("row-field-missing", `${key} is required in the unmodified dataset map`, `${prefix}.${key}`));
  }
  const rowIssues = [];
  const text = (key) => nonEmptyString(raw[key], `${prefix}.${key}`, rowIssues);
  const number = (key, options = {}) => numeric(raw[key], `${prefix}.${key}`, rowIssues, options);
  const runId = text("runId");
  const device = text("device");
  const scenario = text("scenario");
  const width = number("width", { integer: true, positive: true });
  const height = number("height", { integer: true, positive: true });
  const dpr = number("dpr", { positive: true });
  const orientation = text("orientation");
  const startedAt = iso(raw.startedAt, `${prefix}.startedAt`, rowIssues);
  const endedAt = iso(raw.endedAt, `${prefix}.endedAt`, rowIssues);
  const durationMs = number("durationMs", { positive: true });
  const frameDurationMs = number("frameDurationMs", { positive: true });
  const frameSamples = number("frameSamples", { integer: true, positive: true });
  const p50Ms = number("p50Ms");
  const p95Ms = number("p95Ms");
  const maxMs = number("maxMs");
  const medianFps = number("medianFps");
  const under50MsRatio = number("under50MsRatio");
  const longTaskCount = number("longTaskCount", { integer: true });
  const longTaskMaxMs = numeric(raw.longTaskMaxMs, `${prefix}.longTaskMaxMs`, rowIssues, { nullable: true });
  const heapUsedBytes = number("heapUsedBytes", { integer: true });
  const heapTotalBytes = number("heapTotalBytes", { integer: true });
  const heapLimitBytes = number("heapLimitBytes", { integer: true });
  const memorySource = text("memorySource");
  const resourceStatus = text("resourceStatus");
  const resourceBefore = text("resourceBefore");
  const resourceAfter = text("resourceAfter");
  const resourceBeforeRevision = number("resourceBeforeRevision", { integer: true });
  const resourceAfterRevision = number("resourceAfterRevision", { integer: true });
  const repeatedKey = raw.resourceRepeatedIndex !== undefined ? "resourceRepeatedIndex" : "repeatedRunIndex";
  const resourceRepeatedIndex = number(repeatedKey, { integer: true });
  const runStatus = text("runStatus");
  const consoleErrors = number("consoleErrors", { integer: true });
  const pageErrors = number("pageErrors", { integer: true });
  const buildId = text("buildId");
  const buildBranch = text("buildBranch");
  const buildHead = text("buildHead");
  const documentVisibility = text("documentVisibility");
  const rootVisible = booleanValue(raw.rootVisible, `${prefix}.rootVisible`, rowIssues);
  const canvasCount = number("canvasCount", { integer: true });
  const panelVisible = booleanValue(raw.panelVisible, `${prefix}.panelVisible`, rowIssues);
  issues.push(...rowIssues);

  if (device !== "desktop" && device !== "mobile") issues.push(issue("device-invalid", "device must be desktop or mobile", `${prefix}.device`));
  if (!["atlas", "stellar-review", "nebula-review", "repeat-cycle"].includes(scenario)) issues.push(issue("scenario-invalid", "scenario is not a recognized R65 performance surface", `${prefix}.scenario`));
  if (width && height) {
    const expectedDevice = width < 700 ? "mobile" : "desktop";
    if (device && expectedDevice !== device) issues.push(issue("device-viewport-mismatch", `device ${device} does not match ${width}px viewport`, `${prefix}.device`));
    const expectedOrientation = width === height ? "square" : width < height ? "portrait" : "landscape";
    if (orientation && orientation !== expectedOrientation) issues.push(issue("orientation-viewport-mismatch", "orientation does not match viewport dimensions", `${prefix}.orientation`));
  }
  if (startedAt && endedAt && Date.parse(endedAt) < Date.parse(startedAt)) issues.push(issue("timing-order", "endedAt precedes startedAt", prefix));
  if (buildId && expectedBuild && buildId !== expectedBuild.runtimeBuildId) issues.push(issue("row-runtime-mismatch", "row buildId does not match DOM runtimeBuildId", `${prefix}.buildId`));
  if (buildBranch && expectedBuild && buildBranch !== expectedBuild.branch) issues.push(issue("row-branch-mismatch", "row buildBranch does not match DOM branch", `${prefix}.buildBranch`));
  if (buildHead && expectedBuild && buildHead !== expectedBuild.head) issues.push(issue("row-head-mismatch", "row buildHead does not match DOM head", `${prefix}.buildHead`));
  if (consoleErrors !== null && consoleErrors < 0) issues.push(issue("console-errors-range", "consoleErrors cannot be negative", `${prefix}.consoleErrors`));
  if (pageErrors !== null && pageErrors < 0) issues.push(issue("page-errors-range", "pageErrors cannot be negative", `${prefix}.pageErrors`));
  if (frameSamples !== null && frameSamples < 1) issues.push(issue("frame-samples-range", "frameSamples must be positive", `${prefix}.frameSamples`));
  if (resourceBefore && resourceAfter && resourceStatus === "baseline" && resourceBefore !== resourceAfter) issues.push(issue("resource-digest-mismatch", "baseline row has different before/after digests", `${prefix}.resourceStatus`));

  return {
    raw,
    runId, device, scenario, width, height, dpr, orientation, startedAt, endedAt,
    durationMs, frameDurationMs, frameSamples, p50Ms, p95Ms, maxMs, medianFps,
    under50MsRatio, longTaskCount, longTaskMaxMs, heapUsedBytes, heapTotalBytes,
    heapLimitBytes, memorySource, resourceStatus, resourceBefore, resourceAfter,
    resourceBeforeRevision, resourceAfterRevision, resourceRepeatedIndex, runStatus,
    consoleErrors, pageErrors, buildId, buildBranch, buildHead, documentVisibility,
    rootVisible, canvasCount, panelVisible,
  };
}

function digestOnlySnapshot(identityDigest, revision, side) {
  // This is intentionally not an AtlasRuntimeResourceSnapshot. The DOM only
  // exposes two identity markers; copying a previous receipt here used to
  // manufacture byOwner/byKind/byIdentity/count fields.
  return {
    identityDigest,
    revision,
    source: "raw-dom-dataset",
    side,
    fieldsAvailable: ["identityDigest", "revision"],
    registryContents: "unavailable",
  };
}

function digestOnlyLifecycle(row) {
  const same = row.resourceBefore === row.resourceAfter;
  return {
    before: digestOnlySnapshot(row.resourceBefore, row.resourceBeforeRevision, "before"),
    after: digestOnlySnapshot(row.resourceAfter, row.resourceAfterRevision, "after"),
    diff: {
      status: row.resourceStatus,
      evidenceAvailable: false,
      observedDigestEqual: same,
      unavailableFields: ["total", "workers", "gpuRenderTargets", "gpuBuffers", "gpuComputePipelines", "gpuQueries", "textures", "models", "subscriptions", "objectUrls", "typedArrayCaches", "cameraLocks", "estimatedBytes", "estimatedGpuBytes", "identityChanged", "ownerChanged"],
      reason: "raw DOM contains resource identity digests only; registry snapshots were not captured",
    },
    status: row.resourceStatus,
    releasedOwners: [],
    unreleasedOwners: [],
    repeatedRunIndex: row.resourceRepeatedIndex,
    evidenceLimit: "digest-equality-only",
  };
}

function toRun(row, build) {
  const blockers = [];
  if (row.runStatus !== "complete") blockers.push("run-status-not-complete");
  if (row.documentVisibility !== "visible") blockers.push("document-not-visible");
  if (row.rootVisible !== true) blockers.push("root-not-visible");
  if (row.panelVisible !== true) blockers.push("panel-not-visible");
  if (row.canvasCount < 1) blockers.push("canvas-missing");
  if (row.resourceStatus !== "baseline") blockers.push("resource-drift");
  if (row.consoleErrors !== 0) blockers.push("console-errors");
  if (row.pageErrors !== 0) blockers.push("page-errors");
  const status = blockers.length === 0 ? "complete" : "blocked";
  return {
    runId: row.runId,
    device: row.device,
    scenario: row.scenario,
    viewport: {
      width: row.width,
      height: row.height,
      devicePixelRatio: row.dpr,
      orientation: row.orientation,
      userAgentClass: row.device === "mobile" ? "mobile-viewport" : "desktop-browser",
    },
    build: {
      buildId: row.buildId,
      runtimeBuildId: row.buildId,
      artifactBuildId: build.artifactBuildId ?? build.buildId,
      branch: row.buildBranch,
      head: row.buildHead,
      route: "/",
      source: "runtime-marker",
    },
    visibility: {
      documentVisibility: row.documentVisibility,
      rootVisible: row.rootVisible,
      canvasCount: row.canvasCount,
      panelVisible: row.panelVisible,
    },
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    durationMs: row.durationMs,
    frame: {
      sampleCount: row.frameSamples,
      durationMs: row.frameDurationMs,
      p50Ms: row.p50Ms,
      p95Ms: row.p95Ms,
      maxMs: row.maxMs,
      medianFps: row.medianFps,
      longTaskCount: row.longTaskCount,
      longTaskMaxMs: row.longTaskMaxMs,
      under50MsRatio: row.under50MsRatio,
    },
    memory: {
      jsHeapUsedBytes: row.heapUsedBytes,
      jsHeapTotalBytes: row.heapTotalBytes,
      jsHeapLimitBytes: row.heapLimitBytes,
      deviceMemoryGb: null,
      source: row.memorySource,
    },
    resources: digestOnlyLifecycle(row),
    consoleErrors: row.consoleErrors,
    pageErrors: row.pageErrors,
    status,
    evidenceClass: EVIDENCE_CLASS,
    notes: [
      "rows-copied-from-unmodified-element-dataset-map",
      `observed-scenario:${row.scenario}`,
      "resource-digest-only-no-registry-snapshot",
      "DOM digest equality is not proof of resource release or memory stability",
      ...blockers.map((blocker) => `blocker:${blocker}`),
    ],
  };
}

function validateRows(input, expectedBuild) {
  const issues = [];
  const rows = [];
  const seen = new Set();
  for (const [index, raw] of (input.rows ?? []).entries()) {
    const row = normalizeRow(raw, index, expectedBuild, issues);
    if (!row) continue;
    if (row.runId && seen.has(row.runId)) issues.push(issue("duplicate-run-id", `duplicate runId ${row.runId}`, `rows[${index}].runId`));
    if (row.runId) seen.add(row.runId);
    rows.push(row);
  }
  const desktop = rows.filter((row) => row.device === "desktop").length;
  const mobile = rows.filter((row) => row.device === "mobile").length;
  if (desktop < 3) issues.push(issue("desktop-coverage", "at least three desktop rows are required", "rows"));
  if (mobile < 3) issues.push(issue("mobile-coverage", "at least three mobile rows are required", "rows"));
  return { issues, rows };
}

function buildReceipt(input, build, envelope, normalizedRows, sourceSha256, buildSha256) {
  const runs = normalizedRows.map((row) => toRun(row, envelope.buildObservation));
  const blockers = ["physical-device-not-run", "long-run-observation-required"];
  if (runs.some((run) => run.status !== "complete")) blockers.push("row-observation-blocked");
  const next = {
    schema: OUTPUT_SCHEMA,
    version: VERSION,
    generatedAt: new Date().toISOString(),
    build: {
      buildId: envelope.buildObservation.runtimeBuildId,
      runtimeBuildId: envelope.buildObservation.runtimeBuildId,
      artifactBuildId: envelope.buildObservation.artifactBuildId,
      artifactBuildIdSource: envelope.buildObservation.artifactBuildIdSource,
      branch: envelope.buildObservation.branch,
      head: envelope.buildObservation.head,
      route: envelope.buildObservation.route,
      source: "runtime-marker",
    },
    boundary,
    requestedDevices: ["desktop", "mobile"],
    runs,
    repeatRuns: runs.filter((run) => run.scenario === "repeat-cycle").length,
    longRunRequestedMs: 1_800_000,
    longRunObservedMs: 0,
    status: "blocked",
    evidenceClass: EVIDENCE_CLASS,
    blockers: [...new Set(blockers)],
    notes: [
      "Generated only from raw DOM dataset maps; no prior receipt was read as evidence.",
      "Desktop and mobile rows are simulated browser observations and do not establish physical-device, production, or real-user performance.",
      "Resource fields are digest-only observations; raw DOM does not contain registry contents or a recomputable resource diff.",
      "DOM digest equality alone cannot prove texture, GPU, worker, owner, or memory release.",
      "No screenshot, fixture, timeout artifact, or generated manifest is treated as performance proof.",
      "scientificPayloadWriteback=false; candidate-only / hold / not-admitted.",
    ],
    observationSource: {
      input: relative(inputPath),
      inputSha256: sourceSha256,
      buildReport: relative(buildPath),
      buildReportSha256: buildSha256,
      schema: input.schema,
      capturedAt: input.capturedAt,
      surface: input.surface,
      url: input.url,
      physicalMobileDevice: input.physicalMobileDevice ?? PHYSICAL_MOBILE_NOT_RUN,
      consoleObservation: envelope.consoleObservation,
      realUserValidation: false,
      productionPerformanceClaim: false,
      resourceSnapshot: "not-provided-by-raw-dom",
      ignoredBase: ignoredBasePath ? relative(path.resolve(root, ignoredBasePath)) : null,
    },
  };
  return { ...next, staticEvidence: { schemaValid: true, digest: canonicalDigest(next), verifiedAt: new Date().toISOString() } };
}

function failureResult(issues) {
  return {
    schema: OUTPUT_SCHEMA,
    status: "blocked",
    input: relative(inputPath),
    issues,
    contract: {
      rawSchema: RAW_SCHEMA,
      requirement: "unmodified dataset maps with per-row buildId/branch/head matching buildObservation",
      resourceEvidence: "identity digests only; no registry or diff fields are manufactured",
    },
  };
}

async function main() {
  let input;
  let build;
  let inputSha256;
  let buildSha256;
  try {
    const [inputData, buildData] = await Promise.all([readJsonWithHash(inputPath), readJsonWithHash(buildPath)]);
    input = inputData.value;
    build = buildData.value;
    inputSha256 = inputData.sha256;
    buildSha256 = buildData.sha256;
  } catch (error) {
    const result = failureResult([issue("input-read", error.message)]);
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = 1;
    return;
  }
  const envelope = validateRawEnvelope(input, build);
  const rowResult = validateRows(input, envelope.buildObservation);
  const issues = [...envelope.issues, ...rowResult.issues];
  if (issues.length > 0 || !envelope.buildObservation) {
    const result = failureResult(issues.length > 0 ? issues : [issue("build-observation", "build observation is unavailable")]);
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = 1;
    return;
  }
  const receipt = buildReceipt(input, build, envelope, rowResult.rows, inputSha256, buildSha256);
  if (checkOnly) {
    try {
      const saved = await readJson(outputPath);
      const checkIssues = [];
      if (saved.staticEvidence?.digest !== canonicalDigest(saved)) checkIssues.push(issue("saved-digest", "saved receipt static digest does not match its canonical contents"));
      if (saved.observationSource?.inputSha256 !== inputSha256) checkIssues.push(issue("raw-hash", "saved receipt input SHA-256 does not match the current raw capture"));
      if (saved.observationSource?.buildReportSha256 !== buildSha256) checkIssues.push(issue("build-hash", "saved receipt build SHA-256 does not match the passed build report"));
      if (canonicalDigest(saved) !== canonicalDigest(receipt)) checkIssues.push(issue("saved-content", "saved receipt normalized contents do not match the current raw/build inputs"));
      if (checkIssues.length) {
        console.log(JSON.stringify({ ...failureResult(checkIssues), output: relative(outputPath) }, null, 2));
        process.exitCode = 1;
        return;
      }
    } catch (error) {
      console.log(JSON.stringify({ ...failureResult([issue("saved-receipt-read", error.message)]), output: relative(outputPath) }, null, 2));
      process.exitCode = 1;
      return;
    }
  } else {
    await writeFile(outputPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  }
  const result = {
    schema: OUTPUT_SCHEMA,
    status: receipt.status,
    output: relative(outputPath),
    buildId: receipt.build.buildId,
    runtimeBuildId: receipt.build.runtimeBuildId,
    runs: receipt.runs.length,
    desktopRuns: receipt.runs.filter((run) => run.device === "desktop").length,
    mobileRuns: receipt.runs.filter((run) => run.device === "mobile").length,
    repeatRuns: receipt.repeatRuns,
    longRunObservedMs: receipt.longRunObservedMs,
    resourceEvidence: "digest-only",
    blockers: receipt.blockers,
    digest: receipt.staticEvidence.digest,
    checkOnly,
  };
  console.log(jsonOnly ? JSON.stringify(result, null, 2) : `R65 browser receipt: ${result.status} runs=${result.runs} desktop=${result.desktopRuns} mobile=${result.mobileRuns} blockers=${result.blockers.join(",")}`);
}

main().catch((error) => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});

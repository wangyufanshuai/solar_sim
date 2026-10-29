import type { AtlasRuntimeResourceKind, AtlasRuntimeResourceSnapshot } from "./atlasResourceLifecycle";
import { validateMainlineAFrameClockV638, type MainlineAFrameClockV638 } from "./mainlineAFrameClockV638";
import { evaluateCanonicalObjectCycleV635, type CanonicalObjectCycleV635, type CanonicalRuntimeSnapshotV635 } from "./mainlineACanonicalRuntimeV635";

export type MainlineAResourceCheckpointV633 = {
  phase: "baseline" | "active" | "returned";
  capturedAt: string;
  elapsedMs: number;
  scene: string;
  snapshot: AtlasRuntimeResourceSnapshot;
  canonical?: CanonicalRuntimeSnapshotV635;
};

export type MainlineAResourceObservationV633 = {
  schema: "mainline-a-resource-observation-v633";
  runId: string;
  build: { buildId: string; branch: string; head: string };
  viewport: { width: number; height: number; devicePixelRatio: number; device: "desktop" | "mobile-simulated" | "physical-mobile" };
  startedAt: string;
  endedAt: string;
  checkpoints: MainlineAResourceCheckpointV633[];
  frameSummary: { sampleCount: number; totalMs: number; minMs: number; p50Ms: number; p95Ms: number; maxMs: number };
  memory: { source: "performance.memory" | "unavailable"; beforeBytes: number | null; afterBytes: number | null };
  visibility: { startedVisible: boolean; endedVisible: boolean; interruptions: number };
  session: {
    state: "finished" | "aborted";
    requestedDurationMs: number;
    durationSatisfied: boolean;
    issues: string[];
    physicalMobile: "not-run" | "observed-local";
    frameSummarySource: "requestAnimationFrame";
    frameSummaryMethod: "fixed-histogram-upper-bound" | "exact-samples";
    histogramBinWidthMs?: number;
    /** Older exports remain readable, but missing diagnostics cannot pass the current gate. */
    frameClock?: MainlineAFrameClockV638;
    timeline?: { elapsedMs: number; event: string; scene: string }[];
  };
  boundary: { candidateOnly: true; hold: true; notAdmitted: true; scientificPayloadWriteback: false };
  objectCycle?: CanonicalObjectCycleV635;
};

export type MainlineAResourceEvaluationV633 = {
  status: "blocked" | "measured-local";
  issues: string[];
  acquiredCount: number;
  releasedCount: number;
  retainedCount: number;
  baselineRestored: boolean;
  resourceBehavior: "unverified" | "acquire-release" | "reuse-without-allocation";
  resourceReleaseObserved: boolean;
  registryEstimatedBytesDelta: number;
  physicalGpuMemoryClaim: false;
  scientificPayloadWriteback: false;
};

const kinds = {
  worker: "workers",
  "gpu-render-target": "gpuRenderTargets",
  "gpu-buffer": "gpuBuffers",
  "gpu-compute-pipeline": "gpuComputePipelines",
  "gpu-query": "gpuQueries",
  texture: "textures",
  model: "models",
  subscription: "subscriptions",
  "object-url": "objectUrls",
  "typed-array-cache": "typedArrayCaches",
  "camera-lock": "cameraLocks",
} as const;
type Row = Record<string, unknown>;
type Aggregate = { count: number; estimatedBytes: number };
const gpuKinds = new Set(["gpu-buffer", "gpu-render-target", "texture"]);
const sceneModes = new Set(["atlas", "inspect", "launch", "kerr", "exoplanet-system", "relativity-lab", "scene-lab"]);
const shaPattern = /^[a-f0-9]{64}$/u;

function record(value: unknown): value is Row {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function integer(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function label(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 2048 && !/[\u0000-\u001f]/u.test(value);
}

function exactKeys(value: Row, expected: string[]): boolean {
  const keys = Object.keys(value).sort();
  return JSON.stringify(keys) === JSON.stringify([...expected].sort());
}

function validTime(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/u.test(value) && Number.isFinite(Date.parse(value));
}

function addAggregate(target: Map<string, Aggregate>, key: string, count: number, bytes: number): void {
  const previous = target.get(key) ?? { count: 0, estimatedBytes: 0 };
  target.set(key, { count: previous.count + count, estimatedBytes: previous.estimatedBytes + bytes });
}

export function recomputeMainlineAResourceDigestV633(identities: AtlasRuntimeResourceSnapshot["byIdentity"]): string {
  const sorted = Object.fromEntries(Object.entries(identities).sort(([left], [right]) => left.localeCompare(right)));
  const text = JSON.stringify(sorted);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function compareAggregates(value: unknown, expected: Map<string, Aggregate>, path: string, issues: string[]): void {
  if (!record(value)) {
    issues.push(`${path}:missing-map`);
    return;
  }
  if (!exactKeys(value, [...expected.keys()])) issues.push(`${path}:keys`);
  expected.forEach((entry, key) => {
    const actual = value[key];
    if (!record(actual) || !exactKeys(actual, ["count", "estimatedBytes"])) {
      issues.push(`${path}:${key}:shape`);
    } else if (entry.count !== actual.count || entry.estimatedBytes !== actual.estimatedBytes) {
      issues.push(`${path}:${key}:aggregate`);
    }
  });
}

export function validateMainlineAResourceSnapshotV633(value: unknown): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!record(value)) return { valid: false, issues: ["snapshot:not-object"] };
  const numberKeys = ["total", ...Object.values(kinds), "estimatedBytes", "estimatedGpuBytes", "revision"];
  if (!exactKeys(value, [...numberKeys, "byOwner", "byKind", "byIdentity", "identityDigest"])) issues.push("snapshot:keys");
  numberKeys.forEach((key) => { if (!integer(value[key])) issues.push(`snapshot:${key}:integer`); });
  if (!record(value.byIdentity)) return { valid: false, issues: [...issues, "snapshot:identities-missing"] };
  if (Object.keys(value.byIdentity).length > 10000) return { valid: false, issues: [...issues, "snapshot:identity-limit"] };
  const owners = new Map<string, Aggregate>();
  const kindTotals = new Map<string, Aggregate>(Object.keys(kinds).map((kind) => [kind, { count: 0, estimatedBytes: 0 }]));
  let total = 0;
  let bytes = 0;
  let gpuBytes = 0;
  const normalized: Record<string, AtlasRuntimeResourceSnapshot["byIdentity"][string]> = {};
  for (const [key, entry] of Object.entries(value.byIdentity)) {
    if (!record(entry) || !exactKeys(entry, ["kind", "sceneMode", "owner", "label", "count", "estimatedBytes", "contentSha256", "manifestSha256"])) {
      issues.push("snapshot:identity-shape");
      continue;
    }
    const { kind, sceneMode, owner, count, estimatedBytes, contentSha256, manifestSha256 } = entry;
    if (!label(kind) || !Object.hasOwn(kinds, kind) || !label(sceneMode) || !sceneModes.has(sceneMode) || !label(owner) || !label(entry.label)
      || !integer(count) || count === 0 || !integer(estimatedBytes)
      || !(contentSha256 === null || typeof contentSha256 === "string" && shaPattern.test(contentSha256))
      || !(manifestSha256 === null || typeof manifestSha256 === "string" && shaPattern.test(manifestSha256))) {
      issues.push("snapshot:identity-fields");
      continue;
    }
    if (key !== JSON.stringify([kind, sceneMode, owner, entry.label, contentSha256, manifestSha256])) issues.push("snapshot:identity-key");
    total += count;
    bytes += estimatedBytes;
    if (gpuKinds.has(kind)) gpuBytes += estimatedBytes;
    addAggregate(owners, owner, count, estimatedBytes);
    addAggregate(kindTotals, kind, count, estimatedBytes);
    normalized[key] = {
      kind: kind as AtlasRuntimeResourceKind,
      sceneMode: sceneMode as AtlasRuntimeResourceSnapshot["byIdentity"][string]["sceneMode"],
      owner, label: entry.label, count, estimatedBytes, contentSha256, manifestSha256,
    };
  }
  if (!integer(total) || !integer(bytes) || !integer(gpuBytes)) issues.push("snapshot:aggregate-overflow");
  if (value.total !== total || value.estimatedBytes !== bytes || value.estimatedGpuBytes !== gpuBytes) issues.push("snapshot:totals");
  Object.entries(kinds).forEach(([kind, field]) => {
    if (value[field] !== kindTotals.get(kind)?.count) issues.push(`snapshot:${field}:count`);
  });
  compareAggregates(value.byOwner, owners, "snapshot:owners", issues);
  compareAggregates(value.byKind, kindTotals, "snapshot:kinds", issues);
  if (value.identityDigest !== recomputeMainlineAResourceDigestV633(normalized)) issues.push("snapshot:identity-digest");
  return { valid: issues.length === 0, issues };
}

export function copyMainlineAResourceSnapshotV633(snapshot: AtlasRuntimeResourceSnapshot): AtlasRuntimeResourceSnapshot {
  const validation = validateMainlineAResourceSnapshotV633(snapshot);
  if (!validation.valid) throw new Error(validation.issues.join(","));
  return JSON.parse(JSON.stringify(snapshot)) as AtlasRuntimeResourceSnapshot;
}

function validateEnvironment(value: Row, issues: string[]): void {
  const boundary = value.boundary;
  if (!record(boundary) || !exactKeys(boundary, ["candidateOnly", "hold", "notAdmitted", "scientificPayloadWriteback"])
    || boundary.candidateOnly !== true || boundary.hold !== true || boundary.notAdmitted !== true || boundary.scientificPayloadWriteback !== false) issues.push("boundary:closed-required");
  const build = value.build;
  if (!record(build) || !label(build.buildId) || !label(build.branch) || !label(build.head)
    || /^unknown/iu.test(build.buildId) || !/^[a-f0-9]{40}$/u.test(build.head)) issues.push("build:identity");
  const viewport = value.viewport;
  if (!record(viewport) || !integer(viewport.width) || viewport.width < 1 || !integer(viewport.height) || viewport.height < 1
    || !finite(viewport.devicePixelRatio) || viewport.devicePixelRatio <= 0
    || typeof viewport.device !== "string" || !["desktop", "mobile-simulated", "physical-mobile"].includes(viewport.device)) issues.push("viewport:invalid");
  const visibility = value.visibility;
  if (!record(visibility) || visibility.startedVisible !== true || visibility.endedVisible !== true
    || visibility.interruptions !== 0) issues.push("visibility:interrupted-or-unobserved");
  const memory = value.memory;
  if (!record(memory) || typeof memory.source !== "string" || !["performance.memory", "unavailable"].includes(memory.source)) {
    issues.push("memory:source");
  } else if (memory.source === "unavailable") {
    if (memory.beforeBytes !== null || memory.afterBytes !== null) issues.push("memory:unavailable-must-be-null");
  } else if (!integer(memory.beforeBytes) || !integer(memory.afterBytes)) issues.push("memory:heap-bytes");
}

function validateFrames(value: unknown, durationMs: number, issues: string[]): void {
  if (!record(value) || !exactKeys(value, ["sampleCount", "totalMs", "minMs", "p50Ms", "p95Ms", "maxMs"])) {
    issues.push("frames:shape");
    return;
  }
  const { sampleCount, totalMs, minMs, p50Ms, p95Ms, maxMs } = value;
  if (!integer(sampleCount) || sampleCount < 2 || !finite(totalMs) || totalMs === 0 || !finite(minMs) || minMs === 0
    || !finite(p50Ms) || !finite(p95Ms) || !finite(maxMs)) {
    issues.push("frames:missing-samples");
    return;
  }
  if (minMs > p50Ms || p50Ms > p95Ms || p95Ms > maxMs) issues.push("frames:quantile-order");
  if (totalMs < sampleCount * minMs - 0.01 || totalMs > sampleCount * maxMs + 0.01) issues.push("frames:total-inconsistent");
  if (totalMs > durationMs + 250 || totalMs < durationMs * 0.5) issues.push("frames:duration-coverage");
}

function sameRegistry(left: AtlasRuntimeResourceSnapshot, right: AtlasRuntimeResourceSnapshot): boolean {
  const ordered = (value: AtlasRuntimeResourceSnapshot["byIdentity"]) => JSON.stringify(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
  return ordered(left.byIdentity) === ordered(right.byIdentity);
}

export function evaluateMainlineAResourceObservationV633(value: unknown): MainlineAResourceEvaluationV633 {
  const result: MainlineAResourceEvaluationV633 = {
    status: "blocked", issues: [], acquiredCount: 0, releasedCount: 0, retainedCount: 0,
    baselineRestored: false, resourceBehavior: "unverified", resourceReleaseObserved: false,
    registryEstimatedBytesDelta: 0, physicalGpuMemoryClaim: false, scientificPayloadWriteback: false,
  };
  const issues = result.issues;
  if (!record(value)) { issues.push("observation:not-object"); return result; }
  const expectedKeys = ["schema", "runId", "build", "viewport", "startedAt", "endedAt", "checkpoints", "frameSummary", "memory", "visibility", "session", "boundary"];
  if (Object.hasOwn(value, "objectCycle")) expectedKeys.push("objectCycle");
  if (!exactKeys(value, expectedKeys)) issues.push("observation:keys");
  if (value.schema !== "mainline-a-resource-observation-v633" || !label(value.runId)) issues.push("observation:identity");
  validateEnvironment(value, issues);
  const timeValid = validTime(value.startedAt) && validTime(value.endedAt);
  const start = timeValid ? Date.parse(value.startedAt as string) : 0;
  const end = timeValid ? Date.parse(value.endedAt as string) : 0;
  if (!timeValid || end <= start) issues.push("observation:time-range");
  const session = value.session;
  if (!record(session) || session.frameSummarySource !== "requestAnimationFrame") issues.push("session:frame-summary-source");
  if (!record(session) || session.state !== "finished" || session.durationSatisfied !== true
    || !finite(session.requestedDurationMs) || session.requestedDurationMs <= 0 || end - start < session.requestedDurationMs
    || !Array.isArray(session.issues) || session.issues.length !== 0
    || typeof session.physicalMobile !== "string" || !["not-run", "observed-local"].includes(session.physicalMobile)
    || typeof session.frameSummaryMethod !== "string" || !["fixed-histogram-upper-bound", "exact-samples"].includes(session.frameSummaryMethod)) issues.push("session:incomplete-or-interrupted");
  if (record(session) && session.frameSummaryMethod === "fixed-histogram-upper-bound"
    && (!finite(session.histogramBinWidthMs) || session.histogramBinWidthMs <= 0)) issues.push("session:histogram-resolution");
  if (record(value.viewport) && value.viewport.device === "physical-mobile") issues.push("viewport:physical-device-attestation-not-supported");
  if (record(session) && session.timeline !== undefined) {
    if (!Array.isArray(session.timeline) || session.timeline.length > 64) issues.push("session:timeline-shape");
    else {
      let priorEventMs = -1;
      for (const event of session.timeline) {
        if (!record(event) || !finite(event.elapsedMs) || event.elapsedMs < priorEventMs || event.elapsedMs > end - start + 250
          || !label(event.event) || !label(event.scene)) issues.push("session:timeline-event");
        if (record(event) && finite(event.elapsedMs)) priorEventMs = event.elapsedMs;
      }
    }
  }
  validateFrames(value.frameSummary, end - start, issues);
  if (!record(session) || !Object.hasOwn(session, "frameClock") || session.frameClock === undefined) {
    issues.push("frame-clock:legacy-unverified");
  } else issues.push(...validateMainlineAFrameClockV638(session.frameClock, value.frameSummary, timeValid ? end - start : NaN));
  if (!Array.isArray(value.checkpoints) || value.checkpoints.length !== 3) { issues.push("checkpoints:three-required"); return result; }
  const phases = ["baseline", "active", "returned"];
  let previous = -1;
  let snapshotValid = true;
  value.checkpoints.forEach((checkpoint: unknown, index: number) => {
    if (!record(checkpoint)) { issues.push(`checkpoint:${index}:shape`); snapshotValid = false; return; }
    if (checkpoint.phase !== phases[index] || !label(checkpoint.scene)) issues.push(`checkpoint:${index}:phase-or-scene`);
    const at = validTime(checkpoint.capturedAt) ? Date.parse(checkpoint.capturedAt) : NaN;
    if (!finite(checkpoint.elapsedMs) || checkpoint.elapsedMs <= previous || at < start || at > end
      || !Number.isFinite(at) || Math.abs(at - start - checkpoint.elapsedMs) > 250) issues.push(`checkpoint:${index}:time`);
    if (finite(checkpoint.elapsedMs)) previous = checkpoint.elapsedMs;
    const checked = validateMainlineAResourceSnapshotV633(checkpoint.snapshot);
    if (!checked.valid) snapshotValid = false;
    issues.push(...checked.issues.map((issue) => `checkpoint:${index}:${issue}`));
  });
  if (!snapshotValid) return result;
  const [baseline, active, returned] = value.checkpoints as MainlineAResourceCheckpointV633[];
  if (value.objectCycle !== undefined) {
    issues.push(...evaluateCanonicalObjectCycleV635(value.objectCycle, value.checkpoints));
    if (baseline.scene !== active.scene || active.scene !== returned.scene) issues.push("canonical:scene-changed-during-object-cycle");
  } else {
    if (baseline.scene !== returned.scene || baseline.scene === active.scene) issues.push("lifecycle:scene-roundtrip-required");
    if (value.checkpoints.some((checkpoint) => objectHasCanonical(checkpoint))) issues.push("canonical:explicit-mode-required");
  }
  if (baseline.elapsedMs !== 0 || Math.abs(returned.elapsedMs - (end - start)) > 250) issues.push("lifecycle:checkpoint-span");
  if (active.snapshot.total === 0) issues.push("lifecycle:empty-active-registry");
  const unchangedRegistry = value.objectCycle !== undefined
    && baseline.snapshot.revision === active.snapshot.revision && active.snapshot.revision === returned.snapshot.revision
    && sameRegistry(baseline.snapshot, active.snapshot) && sameRegistry(active.snapshot, returned.snapshot);
  if (!unchangedRegistry && (active.snapshot.revision <= baseline.snapshot.revision || returned.snapshot.revision <= active.snapshot.revision)) issues.push("lifecycle:no-registry-revisions");
  const keys = new Set([...Object.keys(baseline.snapshot.byIdentity), ...Object.keys(active.snapshot.byIdentity), ...Object.keys(returned.snapshot.byIdentity)]);
  keys.forEach((key) => {
    const before = baseline.snapshot.byIdentity[key]?.count ?? 0;
    const during = active.snapshot.byIdentity[key]?.count ?? 0;
    const after = returned.snapshot.byIdentity[key]?.count ?? 0;
    const acquired = Math.max(0, during - before);
    const retained = Math.min(acquired, Math.max(0, after - before));
    result.acquiredCount += acquired;
    result.retainedCount += retained;
    result.releasedCount += Math.min(acquired, Math.max(0, during - after));
  });
  result.baselineRestored = sameRegistry(baseline.snapshot, returned.snapshot);
  result.registryEstimatedBytesDelta = returned.snapshot.estimatedBytes - baseline.snapshot.estimatedBytes;
  if (!unchangedRegistry && (result.acquiredCount === 0 || sameRegistry(baseline.snapshot, active.snapshot))) issues.push("lifecycle:no-observed-acquisition");
  if (!unchangedRegistry && result.releasedCount === 0) issues.push("lifecycle:no-observed-release");
  if (result.retainedCount > 0) issues.push("lifecycle:acquired-resources-retained");
  if (!result.baselineRestored) issues.push("lifecycle:baseline-not-restored");
  if (issues.length === 0) {
    result.status = "measured-local";
    result.resourceBehavior = unchangedRegistry ? "reuse-without-allocation" : "acquire-release";
    result.resourceReleaseObserved = !unchangedRegistry;
  }
  return result;
}

function objectHasCanonical(checkpoint: unknown): boolean {
  return record(checkpoint) && Object.hasOwn(checkpoint, "canonical");
}

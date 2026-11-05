import { diffAtlasResourceSnapshotsV300, type AtlasRuntimeResourceSnapshot } from "./atlasResourceLifecycle";
import { validateMainlineAResourceSnapshotV633 } from "./mainlineAResourceObservationV633";
import { evaluateMainlineAR65SceneActivityV645 } from "./mainlineAR65SceneActivityV645";

export const MAINLINE_A_R65_LONGRUN_VERSION_V643 =
  "v643-mainline-a-r65-independent-long-run-lifecycle" as const;
export const MAINLINE_A_R65_LONGRUN_SCHEMA_V643 =
  "mainline-a-r65-long-run-v643" as const;
export const MAINLINE_A_R65_LONGRUN_EVIDENCE_CLASS_V643 =
  "browser-runtime-long-run-observation" as const;
export const MAINLINE_A_R65_LONGRUN_MIN_DURATION_MS_V643 = 30 * 60 * 1000;
export const MAINLINE_A_R65_LONGRUN_REQUIRED_OBSERVATIONS_V643 = 2;
export const MAINLINE_A_R65_LONGRUN_DEVICES_V643 = Object.freeze([
  "desktop",
  "mobile",
] as const);
export const MAINLINE_A_R65_LONGRUN_SCENARIOS_V643 = Object.freeze([
  "atlas",
  "stellar-review",
  "nebula-review",
  "repeat-cycle",
] as const);

export type MainlineAR65LongRunDeviceV643 =
  (typeof MAINLINE_A_R65_LONGRUN_DEVICES_V643)[number];
export type MainlineAR65LongRunScenarioV643 =
  (typeof MAINLINE_A_R65_LONGRUN_SCENARIOS_V643)[number];
export type MainlineAR65LongRunStatusV643 =
  | "pending"
  | "running"
  | "complete"
  | "aborted"
  | "blocked";
export type MainlineAR65LongRunPhaseV643 =
  | "baseline"
  | "active"
  | "final";
export type MainlineAR65LongRunViewportClassV643 =
  | "desktop-browser"
  | "mobile-viewport"
  | "physical-mobile"
  | "unknown";
export type MainlineAR65LongRunMemorySourceV643 =
  | "performance-memory"
  | "navigator-device-memory"
  | "unavailable";

export type MainlineAR65LongRunBoundaryV643 = Readonly<{
  candidateOnly: true;
  hold: true;
  notAdmitted: true;
  scientificPayloadWriteback: false;
  runtimePromotion: "closed";
  physicalDevicePromotion: "closed";
}>;

export type MainlineAR65LongRunBuildIdentityV643 = Readonly<{
  buildId: string;
  runtimeBuildId: string;
  branch: string;
  head: string;
  route: string;
  source: "runtime-marker" | "release-receipt" | "unknown";
}>;

export type MainlineAR65LongRunViewportV643 = Readonly<{
  width: number;
  height: number;
  devicePixelRatio: number;
  device: MainlineAR65LongRunDeviceV643;
  class: MainlineAR65LongRunViewportClassV643;
  orientation: "portrait" | "landscape" | "square";
}>;

export type MainlineAR65LongRunFrameSampleV643 = Readonly<{
  atMs: number;
  deltaMs: number;
  longTaskMs: number;
}>;

export type MainlineAR65LongRunMemorySampleV643 = Readonly<{
  atMs: number;
  usedBytes: number | null;
  totalBytes: number | null;
  limitBytes: number | null;
  source: MainlineAR65LongRunMemorySourceV643;
}>;

export type MainlineAR65LongRunResourceCheckpointV643 = Readonly<{
  phase: MainlineAR65LongRunPhaseV643;
  atMs: number;
  capturedAt: string;
  identityDigest: string;
  revision: number;
  total: number;
  estimatedBytes: number;
  estimatedGpuBytes: number;
  ownerDigest: string;
  snapshot: AtlasRuntimeResourceSnapshot;
}>;

export type MainlineAR65LongRunVisibilityV643 = Readonly<{
  startedVisible: boolean;
  endedVisible: boolean;
  interruptions: number;
  canvasCount: number;
  rootVisible: boolean;
  documentVisibility: "visible" | "hidden" | "prerender" | "unknown";
}>;

export type MainlineAR65LongRunFrameSummaryV643 = Readonly<{
  sampleCount: number;
  durationMs: number;
  minMs: number | null;
  p50Ms: number | null;
  p95Ms: number | null;
  maxMs: number | null;
  medianFps: number | null;
  longTaskCount: number;
  longTaskMaxMs: number | null;
  under50MsRatio: number | null;
}>;

export type MainlineAR65LongRunMemorySummaryV643 = Readonly<{
  sampleCount: number;
  source: MainlineAR65LongRunMemorySourceV643;
  firstUsedBytes: number | null;
  lastUsedBytes: number | null;
  minUsedBytes: number | null;
  maxUsedBytes: number | null;
  deltaBytes: number | null;
}>;

export type MainlineAR65LongRunObservationV643 = Readonly<{
  schema: typeof MAINLINE_A_R65_LONGRUN_SCHEMA_V643;
  sessionId: string;
  independenceKey: string;
  device: MainlineAR65LongRunDeviceV643;
  scenario: MainlineAR65LongRunScenarioV643;
  viewport: MainlineAR65LongRunViewportV643;
  endedViewport: MainlineAR65LongRunViewportV643;
  build: MainlineAR65LongRunBuildIdentityV643;
  endedBuild: MainlineAR65LongRunBuildIdentityV643;
  startedAt: string;
  endedAt: string | null;
  requestedDurationMs: number;
  observedDurationMs: number;
  status: MainlineAR65LongRunStatusV643;
  frameSummary: MainlineAR65LongRunFrameSummaryV643;
  frameSamples: readonly MainlineAR65LongRunFrameSampleV643[];
  memorySummary: MainlineAR65LongRunMemorySummaryV643;
  memorySamples: readonly MainlineAR65LongRunMemorySampleV643[];
  resources: Readonly<{
    baseline: MainlineAR65LongRunResourceCheckpointV643;
    active: MainlineAR65LongRunResourceCheckpointV643;
    final: MainlineAR65LongRunResourceCheckpointV643;
  }>;
  visibility: MainlineAR65LongRunVisibilityV643;
  consoleErrors: number;
  pageErrors: number;
  physicalDevice: boolean;
  evidenceClass: typeof MAINLINE_A_R65_LONGRUN_EVIDENCE_CLASS_V643;
  source: "browser-runtime" | "fixture" | "synthetic" | "unknown";
  notes: readonly string[];
  digest: string;
}>;

export type MainlineAR65LongRunReceiptV643 = Readonly<{
  schema: typeof MAINLINE_A_R65_LONGRUN_SCHEMA_V643;
  version: typeof MAINLINE_A_R65_LONGRUN_VERSION_V643;
  generatedAt: string;
  build: MainlineAR65LongRunBuildIdentityV643;
  requestedDevices: readonly MainlineAR65LongRunDeviceV643[];
  requestedObservations: number;
  minDurationMs: number;
  observations: readonly MainlineAR65LongRunObservationV643[];
  boundary: MainlineAR65LongRunBoundaryV643;
  status: "pending" | "partial" | "qualified" | "blocked";
  evidenceClass: typeof MAINLINE_A_R65_LONGRUN_EVIDENCE_CLASS_V643;
  staticEvidence: Readonly<{
    schemaValid: boolean;
    digest: string;
    verifiedAt: string;
  }>;
  blockers: readonly string[];
  claims: Readonly<{
    desktopViewport: boolean;
    mobileViewport: boolean;
    twoIndependentLongRuns: boolean;
    resourceLifecycle: boolean;
    physicalMobile: boolean;
    productionPerformance: false;
    realUserValidation: false;
    scientificValidity: false;
    copyrightApproval: false;
  }>;
  notes: readonly string[];
}>;

export type MainlineAR65LongRunVerificationV643 = Readonly<{
  ok: boolean;
  status: MainlineAR65LongRunReceiptV643["status"];
  issues: readonly string[];
  attemptIssues: readonly string[];
  observationChecks: readonly Readonly<{
    sessionId: string | null;
    status: "valid" | "invalid";
    issues: readonly string[];
  }>[];
  completeLongRuns: number;
  devices: readonly MainlineAR65LongRunDeviceV643[];
  independentKeys: readonly string[];
  recomputedDigest: string;
}>;

type RecordLike = Record<string, unknown>;
type ResourceSnapshotInput = AtlasRuntimeResourceSnapshot;

const HEAD_PATTERN_V643 = /^[0-9a-f]{40}$/iu;
const NON_EMPTY_V643 = /\S/u;

function record(value: unknown): value is RecordLike {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function nonNegative(value: unknown, fallback = 0): number {
  return finite(value) && value >= 0 ? value : fallback;
}

function integer(value: unknown, fallback = 0): number {
  const candidate = Math.trunc(nonNegative(value, fallback));
  return Number.isSafeInteger(candidate) ? candidate : fallback;
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && NON_EMPTY_V643.test(value) ? value.trim() : fallback;
}

function iso(value: unknown, fallback: string | null): string | null {
  if (typeof value !== "string") return fallback;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : fallback;
}

function dateMs(value: string | null): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (record(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, sortKeys(entry)]),
    );
  }
  return value;
}

export function stableMainlineAR65LongRunJsonV643(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

export function digestMainlineAR65LongRunValueV643(value: unknown): string {
  const input = stableMainlineAR65LongRunJsonV643(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter((value) => NON_EMPTY_V643.test(value)))].sort();
}

function percentile(values: readonly number[], fraction: number): number | null {
  const finiteValues = values.filter((value) => finite(value) && value >= 0).sort((left, right) => left - right);
  if (finiteValues.length === 0) return null;
  const position = Math.max(0, Math.min(1, fraction)) * (finiteValues.length - 1);
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const lowerValue = finiteValues[lower] ?? 0;
  const upperValue = finiteValues[upper] ?? lowerValue;
  return lower === upper ? lowerValue : lowerValue + (upperValue - lowerValue) * (position - lower);
}

function normalizeDevice(value: unknown): MainlineAR65LongRunDeviceV643 {
  return value === "mobile" ? "mobile" : "desktop";
}

function normalizeScenario(value: unknown): MainlineAR65LongRunScenarioV643 {
  return MAINLINE_A_R65_LONGRUN_SCENARIOS_V643.includes(value as MainlineAR65LongRunScenarioV643)
    ? value as MainlineAR65LongRunScenarioV643
    : "atlas";
}

function normalizeViewportClass(value: unknown): MainlineAR65LongRunViewportClassV643 {
  return value === "desktop-browser" || value === "mobile-viewport" || value === "physical-mobile"
    ? value
    : "unknown";
}

function normalizeMemorySource(value: unknown): MainlineAR65LongRunMemorySourceV643 {
  return value === "performance-memory" || value === "navigator-device-memory" ? value : "unavailable";
}

export function createMainlineAR65LongRunBoundaryV643(): MainlineAR65LongRunBoundaryV643 {
  return Object.freeze({
    candidateOnly: true,
    hold: true,
    notAdmitted: true,
    scientificPayloadWriteback: false,
    runtimePromotion: "closed",
    physicalDevicePromotion: "closed",
  });
}

export function createMainlineAR65LongRunBuildIdentityV643(args: {
  buildId?: string | null;
  runtimeBuildId?: string | null;
  branch?: string | null;
  head?: string | null;
  route?: string | null;
  source?: MainlineAR65LongRunBuildIdentityV643["source"];
} = {}): MainlineAR65LongRunBuildIdentityV643 {
  const known = Boolean(args.buildId || args.runtimeBuildId || args.branch || args.head);
  return Object.freeze({
    buildId: text(args.buildId, "unknown-build"),
    runtimeBuildId: text(args.runtimeBuildId, text(args.buildId, "unknown-runtime-build")),
    branch: text(args.branch, "unknown-branch"),
    head: text(args.head, "unknown-head"),
    route: text(args.route, "/"),
    source: args.source ?? (known ? "runtime-marker" : "unknown"),
  });
}

export function createMainlineAR65LongRunViewportV643(args: {
  width: number;
  height: number;
  devicePixelRatio?: number;
  device: MainlineAR65LongRunDeviceV643;
  class?: MainlineAR65LongRunViewportClassV643;
}): MainlineAR65LongRunViewportV643 {
  const width = Math.max(1, integer(args.width, 1));
  const height = Math.max(1, integer(args.height, 1));
  const device = normalizeDevice(args.device);
  const viewportClass = normalizeViewportClass(args.class ?? (device === "mobile" ? "mobile-viewport" : "desktop-browser"));
  return Object.freeze({
    width,
    height,
    devicePixelRatio: Math.max(0.1, Math.min(8, nonNegative(args.devicePixelRatio, 1))),
    device,
    class: viewportClass,
    orientation: width === height ? "square" : width > height ? "landscape" : "portrait",
  });
}

export function createMainlineAR65LongRunResourceCheckpointV643(
  snapshot: ResourceSnapshotInput,
  phase: MainlineAR65LongRunPhaseV643,
  atMs: number,
  capturedAt = new Date().toISOString(),
): MainlineAR65LongRunResourceCheckpointV643 {
  const owners = record(snapshot.byOwner) ? Object.keys(snapshot.byOwner).sort() : [];
  return Object.freeze({
    phase,
    atMs: nonNegative(atMs),
    capturedAt: iso(capturedAt, new Date(0).toISOString()) ?? new Date(0).toISOString(),
    identityDigest: text(snapshot.identityDigest, "missing-resource-digest"),
    revision: integer(snapshot.revision),
    total: integer(snapshot.total),
    estimatedBytes: integer(snapshot.estimatedBytes),
    estimatedGpuBytes: integer(snapshot.estimatedGpuBytes),
    ownerDigest: digestMainlineAR65LongRunValueV643(owners),
    snapshot: clone(snapshot),
  });
}

export function summarizeMainlineAR65LongRunFramesV643(
  samples: readonly MainlineAR65LongRunFrameSampleV643[],
  durationMs: number,
): MainlineAR65LongRunFrameSummaryV643 {
  const deltas = samples.map((sample) => nonNegative(sample.deltaMs)).filter((value) => value >= 0);
  const longTasks = samples.map((sample) => nonNegative(sample.longTaskMs)).filter((value) => value > 0);
  const p50Ms = percentile(deltas, 0.5);
  const p95Ms = percentile(deltas, 0.95);
  return Object.freeze({
    sampleCount: deltas.length,
    durationMs: nonNegative(durationMs),
    minMs: deltas.length > 0 ? deltas.reduce((minimum, value) => Math.min(minimum, value), Number.POSITIVE_INFINITY) : null,
    p50Ms,
    p95Ms,
    maxMs: deltas.length > 0 ? deltas.reduce((maximum, value) => Math.max(maximum, value), 0) : null,
    medianFps: p50Ms && p50Ms > 0 ? Math.min(240, 1000 / p50Ms) : null,
    longTaskCount: longTasks.length,
    longTaskMaxMs: longTasks.length > 0 ? longTasks.reduce((maximum, value) => Math.max(maximum, value), 0) : null,
    under50MsRatio: deltas.length > 0 ? deltas.filter((value) => value < 50).length / deltas.length : null,
  });
}

export function summarizeMainlineAR65LongRunMemoryV643(
  samples: readonly MainlineAR65LongRunMemorySampleV643[],
): MainlineAR65LongRunMemorySummaryV643 {
  const used = samples.map((sample) => sample.usedBytes).filter((value): value is number => finite(value) && value >= 0);
  const source = samples.find((sample) => sample.source !== "unavailable")?.source ?? "unavailable";
  const firstUsedBytes = used[0] ?? null;
  const lastUsedBytes = used.length > 0 ? used[used.length - 1] ?? null : null;
  return Object.freeze({
    sampleCount: samples.length,
    source,
    firstUsedBytes,
    lastUsedBytes,
    minUsedBytes: used.length > 0 ? Math.min(...used) : null,
    maxUsedBytes: used.length > 0 ? Math.max(...used) : null,
    deltaBytes: firstUsedBytes !== null && lastUsedBytes !== null ? lastUsedBytes - firstUsedBytes : null,
  });
}

function normalizeFrameSamples(value: unknown): MainlineAR65LongRunFrameSampleV643[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => {
    const item = record(entry) ? entry : {};
    return Object.freeze({
      atMs: nonNegative(item.atMs),
      deltaMs: nonNegative(item.deltaMs),
      longTaskMs: nonNegative(item.longTaskMs),
    });
  });
}

function normalizeMemorySamples(value: unknown): MainlineAR65LongRunMemorySampleV643[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => {
    const item = record(entry) ? entry : {};
    const optionalBytes = (candidate: unknown): number | null => finite(candidate) && candidate >= 0 ? Math.trunc(candidate) : null;
    return Object.freeze({
      atMs: nonNegative(item.atMs),
      usedBytes: optionalBytes(item.usedBytes),
      totalBytes: optionalBytes(item.totalBytes),
      limitBytes: optionalBytes(item.limitBytes),
      source: normalizeMemorySource(item.source),
    });
  });
}

function withoutDigest(value: RecordLike): RecordLike {
  const copy = clone(value);
  delete copy.digest;
  return copy;
}

function observationDigest(value: MainlineAR65LongRunObservationV643 | RecordLike): string {
  return digestMainlineAR65LongRunValueV643(withoutDigest(value as RecordLike));
}

export function createMainlineAR65LongRunObservationV643(args: {
  sessionId: string;
  independenceKey: string;
  device: MainlineAR65LongRunDeviceV643;
  scenario?: MainlineAR65LongRunScenarioV643;
  viewport: MainlineAR65LongRunViewportV643;
  endedViewport?: MainlineAR65LongRunViewportV643;
  build: MainlineAR65LongRunBuildIdentityV643;
  endedBuild?: MainlineAR65LongRunBuildIdentityV643;
  startedAt: string;
  endedAt?: string | null;
  requestedDurationMs?: number;
  observedDurationMs?: number;
  frameSamples?: readonly MainlineAR65LongRunFrameSampleV643[];
  memorySamples?: readonly MainlineAR65LongRunMemorySampleV643[];
  resources: Readonly<{
    baseline: MainlineAR65LongRunResourceCheckpointV643;
    active: MainlineAR65LongRunResourceCheckpointV643;
    final: MainlineAR65LongRunResourceCheckpointV643;
  }>;
  visibility: MainlineAR65LongRunVisibilityV643;
  consoleErrors?: number;
  pageErrors?: number;
  physicalDevice?: boolean;
  source?: MainlineAR65LongRunObservationV643["source"];
  notes?: readonly string[];
}): MainlineAR65LongRunObservationV643 {
  const endedAt = iso(args.endedAt, null);
  const startedAt = iso(args.startedAt, new Date(0).toISOString()) ?? new Date(0).toISOString();
  const frameSamples = normalizeFrameSamples(args.frameSamples ?? []);
  const memorySamples = normalizeMemorySamples(args.memorySamples ?? []);
  const inferredDuration = endedAt && dateMs(startedAt) !== null && dateMs(endedAt) !== null
    ? Math.max(0, (dateMs(endedAt) ?? 0) - (dateMs(startedAt) ?? 0))
    : 0;
  const observedDurationMs = nonNegative(args.observedDurationMs, inferredDuration);
  const requestedDurationMs = Math.max(MAINLINE_A_R65_LONGRUN_MIN_DURATION_MS_V643, nonNegative(args.requestedDurationMs, MAINLINE_A_R65_LONGRUN_MIN_DURATION_MS_V643));
  const frameSummary = summarizeMainlineAR65LongRunFramesV643(frameSamples, observedDurationMs);
  const memorySummary = summarizeMainlineAR65LongRunMemoryV643(memorySamples);
  const base = {
    schema: MAINLINE_A_R65_LONGRUN_SCHEMA_V643,
    sessionId: text(args.sessionId, "missing-session"),
    independenceKey: text(args.independenceKey, "missing-independence-key"),
    device: normalizeDevice(args.device),
    scenario: normalizeScenario(args.scenario),
    viewport: args.viewport,
    endedViewport: args.endedViewport ?? args.viewport,
    build: args.build,
    endedBuild: args.endedBuild ?? args.build,
    startedAt,
    endedAt,
    requestedDurationMs,
    observedDurationMs,
    status: endedAt && observedDurationMs >= requestedDurationMs ? "complete" as const : "blocked" as const,
    frameSummary,
    frameSamples: Object.freeze(frameSamples),
    memorySummary,
    memorySamples: Object.freeze(memorySamples),
    resources: args.resources,
    visibility: args.visibility,
    consoleErrors: integer(args.consoleErrors),
    pageErrors: integer(args.pageErrors),
    physicalDevice: args.physicalDevice === true,
    evidenceClass: MAINLINE_A_R65_LONGRUN_EVIDENCE_CLASS_V643,
    source: args.source ?? "browser-runtime" as const,
    notes: Object.freeze(unique(args.notes ?? [])),
  };
  return Object.freeze({ ...base, digest: observationDigest(base) });
}

function observationIssues(value: unknown, minimumDurationMs = MAINLINE_A_R65_LONGRUN_MIN_DURATION_MS_V643): string[] {
  const issues: string[] = [];
  if (!record(value)) return ["observation:not-object"];
  if (value.schema !== MAINLINE_A_R65_LONGRUN_SCHEMA_V643) issues.push("observation:schema");
  if (!text(value.sessionId)) issues.push("observation:session-id");
  if (!text(value.independenceKey)) issues.push("observation:independence-key");
  if (!MAINLINE_A_R65_LONGRUN_DEVICES_V643.includes(value.device as MainlineAR65LongRunDeviceV643)) issues.push("observation:device");
  if (!MAINLINE_A_R65_LONGRUN_SCENARIOS_V643.includes(value.scenario as MainlineAR65LongRunScenarioV643)) issues.push("observation:scenario");
  const started = iso(value.startedAt, null);
  const ended = iso(value.endedAt, null);
  if (!started) issues.push("observation:started-at");
  if (!ended) issues.push("observation:ended-at");
  if (started && ended && (dateMs(ended) ?? 0) < (dateMs(started) ?? 0)) issues.push("observation:time-order");
  const wallDurationMs = started && ended ? (dateMs(ended) ?? 0) - (dateMs(started) ?? 0) : -1;
  if (!finite(value.requestedDurationMs) || value.requestedDurationMs < minimumDurationMs) issues.push("observation:requested-duration");
  if (!finite(value.observedDurationMs) || value.observedDurationMs < 0) issues.push("observation:observed-duration");
  if (value.status !== "complete" && value.status !== "blocked" && value.status !== "aborted" && value.status !== "running" && value.status !== "pending") issues.push("observation:status");
  if (value.evidenceClass !== MAINLINE_A_R65_LONGRUN_EVIDENCE_CLASS_V643) issues.push("observation:evidence-class");
  if (value.source !== "browser-runtime") issues.push("observation:source-not-browser");
  if (value.physicalDevice === true) issues.push("observation:physical-device-unattested");
  const build = record(value.build) ? value.build : {};
  if (!text(build.buildId) || text(build.buildId).startsWith("unknown-") || !text(build.runtimeBuildId) || text(build.runtimeBuildId).startsWith("unknown-") || !text(build.branch) || text(build.branch).startsWith("unknown-") || !HEAD_PATTERN_V643.test(text(build.head)) || build.source !== "runtime-marker") issues.push("observation:build-identity");
  const endedBuild = record(value.endedBuild) ? value.endedBuild : {};
  if (stableMainlineAR65LongRunJsonV643(build) !== stableMainlineAR65LongRunJsonV643(endedBuild)) issues.push("observation:build-changed");
  const viewport = record(value.viewport) ? value.viewport : {};
  if (!finite(viewport.width) || viewport.width < 1 || !finite(viewport.height) || viewport.height < 1 || !finite(viewport.devicePixelRatio) || viewport.devicePixelRatio <= 0) issues.push("observation:viewport");
  if (value.device === "desktop" && viewport.class !== "desktop-browser") issues.push("observation:desktop-class");
  if (value.device === "mobile" && viewport.class !== "mobile-viewport") issues.push("observation:mobile-class");
  const endedViewport = record(value.endedViewport) ? value.endedViewport : {};
  if (stableMainlineAR65LongRunJsonV643(viewport) !== stableMainlineAR65LongRunJsonV643(endedViewport)) issues.push("observation:viewport-changed");
  const frames = Array.isArray(value.frameSamples) ? value.frameSamples : [];
  if (frames.length < 2) issues.push("observation:frame-samples");
  let previousFrame = -1;
  for (const [index, sample] of frames.entries()) {
    if (!record(sample) || !finite(sample.atMs) || sample.atMs < previousFrame || !finite(sample.deltaMs) || sample.deltaMs < 0 || !finite(sample.longTaskMs) || sample.longTaskMs < 0) issues.push(`observation:frame-${index}`);
    if (record(sample) && finite(sample.atMs) && previousFrame >= 0 && sample.atMs - previousFrame > 5_000) issues.push(`observation:frame-gap-${index}`);
    if (record(sample) && finite(sample.atMs)) previousFrame = sample.atMs;
  }
  const memory = Array.isArray(value.memorySamples) ? value.memorySamples : [];
  let previousMemory = -1;
  for (const [index, sample] of memory.entries()) {
    if (!record(sample) || !finite(sample.atMs) || sample.atMs < previousMemory || !["performance-memory", "navigator-device-memory", "unavailable"].includes(sample.source as string)) issues.push(`observation:memory-${index}`);
    if (record(sample) && finite(sample.atMs) && previousMemory >= 0 && sample.atMs - previousMemory > 15_000) issues.push(`observation:memory-gap-${index}`);
    if (record(sample) && finite(sample.atMs)) previousMemory = sample.atMs;
  }
  if (!record(value.frameSummary) || value.frameSummary.sampleCount !== frames.length) issues.push("observation:frame-summary");
  if (!record(value.memorySummary) || value.memorySummary.sampleCount !== memory.length) issues.push("observation:memory-summary");
  if (record(value.frameSummary) && stableMainlineAR65LongRunJsonV643(value.frameSummary) !== stableMainlineAR65LongRunJsonV643(summarizeMainlineAR65LongRunFramesV643(frames as MainlineAR65LongRunFrameSampleV643[], nonNegative(value.observedDurationMs)))) issues.push("observation:frame-summary-mismatch");
  if (record(value.memorySummary) && stableMainlineAR65LongRunJsonV643(value.memorySummary) !== stableMainlineAR65LongRunJsonV643(summarizeMainlineAR65LongRunMemoryV643(memory as MainlineAR65LongRunMemorySampleV643[]))) issues.push("observation:memory-summary-mismatch");
  const resources = record(value.resources) ? value.resources : {};
  const checkpoints = [resources.baseline, resources.active, resources.final];
  if (checkpoints.some((checkpoint, index) => !record(checkpoint) || checkpoint.phase !== ["baseline", "active", "final"][index])) issues.push("observation:resource-phases");
  const baseline = record(resources.baseline) ? resources.baseline : {};
  const active = record(resources.active) ? resources.active : {};
  const final = record(resources.final) ? resources.final : {};
  if (!text(baseline.identityDigest) || !text(final.identityDigest)) issues.push("observation:resource-digest");
  if (text(baseline.identityDigest) !== text(final.identityDigest)) issues.push("observation:resource-baseline-not-restored");
  const snapshots = checkpoints.map((checkpoint) => record(checkpoint) ? checkpoint.snapshot : null);
  snapshots.forEach((snapshot, index) => {
    if (!snapshot || !validateMainlineAResourceSnapshotV633(snapshot).valid) issues.push(`observation:resource-snapshot-${index}`);
    const checkpoint = record(checkpoints[index]) ? checkpoints[index] as RecordLike : {};
    if (record(snapshot) && (checkpoint.identityDigest !== snapshot.identityDigest || checkpoint.revision !== snapshot.revision || checkpoint.total !== snapshot.total || checkpoint.estimatedBytes !== snapshot.estimatedBytes || checkpoint.estimatedGpuBytes !== snapshot.estimatedGpuBytes || checkpoint.ownerDigest !== digestMainlineAR65LongRunValueV643(Object.keys(record(snapshot.byOwner) ? snapshot.byOwner : {}).sort()))) issues.push(`observation:resource-checkpoint-${index}`);
    const captured = iso(checkpoint.capturedAt, null);
    const capturedOffset = captured && started ? (dateMs(captured) ?? 0) - (dateMs(started) ?? 0) : -1;
    if (!finite(checkpoint.atMs) || checkpoint.atMs < 0 || !captured || capturedOffset < -1_000 || Math.abs(capturedOffset - (finite(checkpoint.atMs) ? checkpoint.atMs : 0)) > 1_500) issues.push(`observation:resource-time-${index}`);
  });
  if (snapshots[0] && snapshots[1] && validateMainlineAResourceSnapshotV633(snapshots[0]).valid && validateMainlineAResourceSnapshotV633(snapshots[1]).valid) {
    const activeDiff = diffAtlasResourceSnapshotsV300(snapshots[0] as AtlasRuntimeResourceSnapshot, snapshots[1] as AtlasRuntimeResourceSnapshot);
    if (activeDiff.status !== "drift" || !finite(active.atMs) || active.atMs <= 0 || active.atMs >= nonNegative(value.observedDurationMs) || !finite(active.revision) || !finite(baseline.revision) || active.revision <= baseline.revision) issues.push("observation:resource-activity-missing");
    if (evaluateMainlineAR65SceneActivityV645(snapshots[0] as AtlasRuntimeResourceSnapshot, snapshots[1] as AtlasRuntimeResourceSnapshot).status !== "ready") issues.push("observation:renderable-resource-activity-missing");
  }
  if (snapshots[0] && snapshots[2] && validateMainlineAResourceSnapshotV633(snapshots[0]).valid && validateMainlineAResourceSnapshotV633(snapshots[2]).valid) {
    const baselineDiff = diffAtlasResourceSnapshotsV300(snapshots[0] as AtlasRuntimeResourceSnapshot, snapshots[2] as AtlasRuntimeResourceSnapshot);
    if (baselineDiff.status !== "baseline") issues.push("observation:resource-registry-drift");
  }
  const visibility = record(value.visibility) ? value.visibility : {};
  if (visibility.startedVisible !== true || visibility.endedVisible !== true || visibility.rootVisible !== true || visibility.documentVisibility !== "visible" || !finite(visibility.canvasCount) || visibility.canvasCount < 1 || visibility.interruptions !== 0) issues.push("observation:visibility");
  if (value.consoleErrors !== 0) issues.push("observation:console-errors");
  if (value.pageErrors !== 0) issues.push("observation:page-errors");
  const observedDurationMs = finite(value.observedDurationMs) ? value.observedDurationMs : -1;
  const requestedDurationMs = finite(value.requestedDurationMs) ? value.requestedDurationMs : -1;
  const firstFrameAt = record(frames[0]) && finite(frames[0].atMs) ? frames[0].atMs : -1;
  const lastFrameAt = record(frames[frames.length - 1]) && finite(frames[frames.length - 1].atMs) ? frames[frames.length - 1].atMs : -1;
  const firstMemoryAt = record(memory[0]) && finite(memory[0].atMs) ? memory[0].atMs : -1;
  const lastMemoryAt = record(memory[memory.length - 1]) && finite(memory[memory.length - 1].atMs) ? memory[memory.length - 1].atMs : -1;
  if (wallDurationMs >= 0 && observedDurationMs >= 0 && Math.abs(wallDurationMs - observedDurationMs) > 1_500) issues.push("observation:clock-disagreement");
  if (value.status === "complete" && (observedDurationMs < requestedDurationMs || wallDurationMs < requestedDurationMs)) issues.push("observation:duration-not-satisfied");
  if (value.status === "complete" && (frames.length < 2 || firstFrameAt < 0 || firstFrameAt > 5_000 || lastFrameAt < 0 || observedDurationMs - lastFrameAt > 5_000)) issues.push("observation:frame-coverage");
  if (value.status === "complete" && (memory.length < 2 || firstMemoryAt < 0 || firstMemoryAt > 5_000 || lastMemoryAt < 0 || observedDurationMs - lastMemoryAt > 15_000)) issues.push("observation:memory-coverage");
  if (text(value.digest) !== observationDigest(value)) issues.push("observation:digest");
  if (value.notes && (!Array.isArray(value.notes) || value.notes.some((note) => typeof note !== "string"))) issues.push("observation:notes");
  return unique(issues);
}

export function verifyMainlineAR65LongRunObservationV643(
  value: unknown,
  minimumDurationMs = MAINLINE_A_R65_LONGRUN_MIN_DURATION_MS_V643,
): Readonly<{ ok: boolean; issues: readonly string[] }> {
  const issues = observationIssues(value, minimumDurationMs);
  return Object.freeze({ ok: issues.length === 0, issues: Object.freeze(issues) });
}

function canonicalReceipt(value: RecordLike): RecordLike {
  const copy = clone(value);
  delete copy.generatedAt;
  if (record(copy.staticEvidence)) {
    delete copy.staticEvidence.digest;
    delete copy.staticEvidence.verifiedAt;
  }
  return copy;
}

function receiptDigest(value: RecordLike): string {
  return digestMainlineAR65LongRunValueV643(canonicalReceipt(value));
}

export function createMainlineAR65LongRunReceiptV643(args: {
  build: MainlineAR65LongRunBuildIdentityV643;
  observations?: readonly MainlineAR65LongRunObservationV643[];
  generatedAt?: string;
}): MainlineAR65LongRunReceiptV643 {
  const observations = [...(args.observations ?? [])];
  const base = {
    schema: MAINLINE_A_R65_LONGRUN_SCHEMA_V643,
    version: MAINLINE_A_R65_LONGRUN_VERSION_V643,
    generatedAt: iso(args.generatedAt, new Date().toISOString()) ?? new Date().toISOString(),
    build: args.build,
    requestedDevices: [...MAINLINE_A_R65_LONGRUN_DEVICES_V643],
    requestedObservations: MAINLINE_A_R65_LONGRUN_REQUIRED_OBSERVATIONS_V643,
    minDurationMs: MAINLINE_A_R65_LONGRUN_MIN_DURATION_MS_V643,
    observations: Object.freeze(observations),
    boundary: createMainlineAR65LongRunBoundaryV643(),
    status: "pending" as const,
    evidenceClass: MAINLINE_A_R65_LONGRUN_EVIDENCE_CLASS_V643,
    staticEvidence: { schemaValid: true, digest: "", verifiedAt: new Date(0).toISOString() },
    blockers: Object.freeze([] as string[]),
    claims: {
      desktopViewport: false,
      mobileViewport: false,
      twoIndependentLongRuns: false,
      resourceLifecycle: false,
      physicalMobile: false,
      productionPerformance: false as const,
      realUserValidation: false as const,
      scientificValidity: false as const,
      copyrightApproval: false as const,
    },
    notes: Object.freeze([
      "R65 requires two independent browser-runtime observations of at least thirty minutes.",
      "A mobile viewport remains simulated viewport evidence; physical mobile is a separate gate.",
      "This receipt never promotes candidate art or writes scientific payloads.",
    ]),
  };
  const digest = receiptDigest(base);
  return Object.freeze({
    ...base,
    staticEvidence: Object.freeze({ schemaValid: true, digest, verifiedAt: base.generatedAt }),
  });
}

export function createPendingMainlineAR65LongRunReceiptV643(
  build: MainlineAR65LongRunBuildIdentityV643,
  generatedAt = new Date().toISOString(),
): MainlineAR65LongRunReceiptV643 {
  return createMainlineAR65LongRunReceiptV643({ build, generatedAt });
}

export function appendMainlineAR65LongRunObservationV643(
  receipt: MainlineAR65LongRunReceiptV643,
  observation: MainlineAR65LongRunObservationV643,
): MainlineAR65LongRunReceiptV643 {
  const existing = receipt.observations.filter((entry) => entry.sessionId !== observation.sessionId);
  return createMainlineAR65LongRunReceiptV643({
    build: receipt.build,
    observations: [...existing, observation],
    generatedAt: new Date().toISOString(),
  });
}

function receiptBoundaryIssues(value: RecordLike): string[] {
  const boundary = record(value.boundary) ? value.boundary : {};
  const expected: Record<string, unknown> = {
    candidateOnly: true,
    hold: true,
    notAdmitted: true,
    scientificPayloadWriteback: false,
    runtimePromotion: "closed",
    physicalDevicePromotion: "closed",
  };
  return Object.entries(expected).filter(([key, expectedValue]) => boundary[key] !== expectedValue).map(([key]) => `receipt:boundary-${key}`);
}

export function verifyMainlineAR65LongRunReceiptV643(
  value: unknown,
): MainlineAR65LongRunVerificationV643 {
  const issues: string[] = [];
  if (!record(value)) {
    return Object.freeze({ ok: false, status: "blocked", issues: ["receipt:not-object"], attemptIssues: [], observationChecks: [], completeLongRuns: 0, devices: [], independentKeys: [], recomputedDigest: "" });
  }
  if (value.schema !== MAINLINE_A_R65_LONGRUN_SCHEMA_V643) issues.push("receipt:schema");
  if (value.version !== MAINLINE_A_R65_LONGRUN_VERSION_V643) issues.push("receipt:version");
  issues.push(...receiptBoundaryIssues(value));
  if (value.evidenceClass !== MAINLINE_A_R65_LONGRUN_EVIDENCE_CLASS_V643) issues.push("receipt:evidence-class");
  if (!record(value.build)) issues.push("receipt:build");
  const build = record(value.build) ? value.build : {};
  if (!text(build.buildId) || !text(build.runtimeBuildId) || !text(build.branch) || !HEAD_PATTERN_V643.test(text(build.head))) issues.push("receipt:build-identity");
  const requested = finite(value.minDurationMs) ? value.minDurationMs : MAINLINE_A_R65_LONGRUN_MIN_DURATION_MS_V643;
  if (requested < MAINLINE_A_R65_LONGRUN_MIN_DURATION_MS_V643) issues.push("receipt:min-duration");
  const observations = Array.isArray(value.observations) ? value.observations : [];
  const attemptIssues: string[] = [];
  const observationChecks = observations.map((observation, index) => {
    const checked = verifyMainlineAR65LongRunObservationV643(observation, requested);
    const sessionId = record(observation) && typeof observation.sessionId === "string" ? observation.sessionId : null;
    if (!checked.ok) attemptIssues.push(...checked.issues.map((issue) => `observation-${index}:${issue}`));
    const observationBuild = record(observation) && record(observation.build) ? observation.build : {};
    if (["buildId", "runtimeBuildId", "branch", "head", "route"].some((field) => observationBuild[field] !== build[field])) issues.push(`observation-${index}:build-receipt-mismatch`);
    return Object.freeze({ sessionId, status: checked.ok ? "valid" as const : "invalid" as const, issues: checked.issues });
  });
  const sessionIds = observations.map((entry) => record(entry) ? text(entry.sessionId) : "");
  const independentKeys = observations.map((entry) => record(entry) ? text(entry.independenceKey) : "");
  if (new Set(sessionIds.filter(Boolean)).size !== sessionIds.filter(Boolean).length) issues.push("receipt:duplicate-session");
  if (new Set(independentKeys.filter(Boolean)).size !== independentKeys.filter(Boolean).length) issues.push("receipt:duplicate-independence-key");
  const complete = observations.filter((entry) => record(entry) && entry.status === "complete" && verifyMainlineAR65LongRunObservationV643(entry, requested).ok);
  const devices = unique(complete.map((entry) => record(entry) ? text(entry.device) : "").filter((entry): entry is MainlineAR65LongRunDeviceV643 => entry === "desktop" || entry === "mobile")) as MainlineAR65LongRunDeviceV643[];
  const desktopViewport = complete.some((entry) => record(entry) && entry.device === "desktop");
  const mobileViewport = complete.some((entry) => record(entry) && entry.device === "mobile");
  if (complete.length < MAINLINE_A_R65_LONGRUN_REQUIRED_OBSERVATIONS_V643) issues.push("receipt:two-long-runs-required");
  if (!finite(value.requestedObservations) || value.requestedObservations < MAINLINE_A_R65_LONGRUN_REQUIRED_OBSERVATIONS_V643) issues.push("receipt:requested-observations");
  if (!desktopViewport) issues.push("receipt:desktop-required");
  if (!mobileViewport) issues.push("receipt:mobile-viewport-required");
  if (observations.length === 0) issues.push("receipt:no-observations");
  const staticEvidence = record(value.staticEvidence) ? value.staticEvidence : {};
  const recomputedDigest = receiptDigest(value);
  if (staticEvidence.digest !== recomputedDigest) issues.push("receipt:static-digest");
  if (staticEvidence.schemaValid !== true) issues.push("receipt:static-schema-invalid");
  const uniqueIssues = unique(issues);
  const status = uniqueIssues.length === 0 && complete.length >= MAINLINE_A_R65_LONGRUN_REQUIRED_OBSERVATIONS_V643
    ? "qualified"
    : complete.length === 0 && observations.length === 0
      ? "pending"
      : "blocked";
  return Object.freeze({
    ok: status === "qualified",
    status,
    issues: Object.freeze(uniqueIssues),
    attemptIssues: Object.freeze(unique(attemptIssues)),
    observationChecks: Object.freeze(observationChecks),
    completeLongRuns: complete.length,
    devices: Object.freeze(devices),
    independentKeys: Object.freeze(independentKeys.filter(Boolean)),
    recomputedDigest,
  });
}

export function finalizeMainlineAR65LongRunReceiptV643(
  receipt: MainlineAR65LongRunReceiptV643,
): MainlineAR65LongRunReceiptV643 {
  const verification = verifyMainlineAR65LongRunReceiptV643(receipt);
  const observations = receipt.observations;
  const accepted = observations.filter((entry) => entry.status === "complete" && verifyMainlineAR65LongRunObservationV643(entry, receipt.minDurationMs).ok);
  const desktopViewport = accepted.some((entry) => entry.device === "desktop");
  const mobileViewport = accepted.some((entry) => entry.device === "mobile");
  const lifecycle = accepted.length > 0 && accepted.every((entry) => diffAtlasResourceSnapshotsV300(entry.resources.baseline.snapshot, entry.resources.active.snapshot).status === "drift" && diffAtlasResourceSnapshotsV300(entry.resources.baseline.snapshot, entry.resources.final.snapshot).status === "baseline");
  const claims = {
    desktopViewport,
    mobileViewport,
    twoIndependentLongRuns: verification.completeLongRuns >= MAINLINE_A_R65_LONGRUN_REQUIRED_OBSERVATIONS_V643 && new Set(verification.independentKeys).size >= MAINLINE_A_R65_LONGRUN_REQUIRED_OBSERVATIONS_V643,
    resourceLifecycle: lifecycle && verification.completeLongRuns > 0,
    physicalMobile: false,
    productionPerformance: false as const,
    realUserValidation: false as const,
    scientificValidity: false as const,
    copyrightApproval: false as const,
  };
  const base = {
    ...receipt,
    status: verification.status,
    staticEvidence: { schemaValid: verification.issues.every((issue) => !issue.includes("schema")), digest: "", verifiedAt: new Date().toISOString() },
    blockers: Object.freeze(verification.issues),
    claims: Object.freeze(claims),
  };
  return Object.freeze({
    ...base,
    staticEvidence: Object.freeze({ ...base.staticEvidence, digest: receiptDigest(base) }),
  });
}

export function replayMainlineAR65LongRunReceiptV643(value: unknown): Readonly<{
  schema: "mainline-a-r65-long-run-replay-v643";
  sourceDigest: string;
  status: "verified" | "blocked";
  observations: readonly Readonly<{ sessionId: string; device: string; durationMs: number; lifecycle: string; status: string; digest: string }>[];
  failures: readonly string[];
  boundary: MainlineAR65LongRunBoundaryV643 | null;
}> {
  const verification = verifyMainlineAR65LongRunReceiptV643(value);
  const observations = record(value) && Array.isArray(value.observations) ? value.observations : [];
  return Object.freeze({
    schema: "mainline-a-r65-long-run-replay-v643" as const,
    sourceDigest: record(value) ? receiptDigest(value) : "",
    status: verification.ok ? "verified" as const : "blocked" as const,
    observations: Object.freeze(observations.filter(record).map((entry) => Object.freeze({
      sessionId: text(entry.sessionId),
      device: text(entry.device),
      durationMs: nonNegative(entry.observedDurationMs),
      lifecycle: record(entry.resources) && record(entry.resources.baseline) && record(entry.resources.final)
        && entry.resources.baseline.identityDigest === entry.resources.final.identityDigest ? "baseline-restored" : "drift-or-missing",
      status: text(entry.status),
      digest: text(entry.digest),
    }))),
    failures: Object.freeze(verification.issues),
    boundary: record(value) && record(value.boundary) ? value.boundary as MainlineAR65LongRunBoundaryV643 : null,
  });
}

export function classifyMainlineAR65LongRunEvidenceV643(value: unknown): Readonly<{
  static: "verified" | "pending" | "blocked";
  browser: "observed" | "not-run";
  performance: "qualified" | "pending";
  physicalMobile: "observed" | "not-run";
  externalSource: "separate-gate";
}> {
  const verification = verifyMainlineAR65LongRunReceiptV643(value);
  const observations = record(value) && Array.isArray(value.observations) ? value.observations : [];
  return Object.freeze({
    static: verification.issues.length === 0 ? "verified" : verification.status === "pending" ? "pending" : "blocked",
    browser: observations.length > 0 ? "observed" : "not-run",
    performance: verification.ok ? "qualified" : "pending",
    physicalMobile: observations.some((entry) => record(entry) && entry.physicalDevice === true) ? "observed" : "not-run",
    externalSource: "separate-gate",
  });
}

export function runMainlineAR65LongRunBoundarySelfCheckV643(): Readonly<{ ok: boolean; receipt: MainlineAR65LongRunReceiptV643 }> {
  const receipt = createPendingMainlineAR65LongRunReceiptV643(createMainlineAR65LongRunBuildIdentityV643(), new Date(0).toISOString());
  return Object.freeze({
    ok: receipt.boundary.candidateOnly && receipt.boundary.hold && receipt.boundary.notAdmitted && receipt.boundary.scientificPayloadWriteback === false,
    receipt,
  });
}

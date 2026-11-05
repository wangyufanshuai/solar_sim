import type {
  AtlasRuntimeResourceSnapshot,
  AtlasResourceBaselineDiffV300,
} from "./atlasResourceLifecycle";
import { diffAtlasResourceSnapshotsV300 } from "./atlasResourceLifecycle";

export const MAINLINE_A_PERFORMANCE_EVIDENCE_VERSION_V625 =
  "v625-mainline-a-multi-device-lifecycle-evidence" as const;
export const MAINLINE_A_PERFORMANCE_EVIDENCE_SCHEMA_V625 =
  "mainline-a-performance-evidence-v625" as const;
export const MAINLINE_A_PERFORMANCE_BOUNDARY_V625 =
  "R65 measures browser runtime presentation and resource lifecycle only; it does not promote candidate art, write scientific payloads, or alter EIH, Newton N-body, 2PN/Lense–Thirring, or Kerr kernels." as const;

export const MAINLINE_A_PERFORMANCE_DEVICES_V625 = Object.freeze([
  "desktop",
  "mobile",
] as const);
export const MAINLINE_A_PERFORMANCE_SCENARIOS_V625 = Object.freeze([
  "atlas",
  "stellar-review",
  "nebula-review",
  "repeat-cycle",
] as const);
export type MainlineAPerformanceDeviceV625 =
  (typeof MAINLINE_A_PERFORMANCE_DEVICES_V625)[number];
export type MainlineAPerformanceScenarioV625 =
  (typeof MAINLINE_A_PERFORMANCE_SCENARIOS_V625)[number];
export type MainlineAPerformanceLifecycleStatusV625 =
  | "baseline"
  | "drift"
  | "not-run"
  | "blocked";

export type MainlineAPerformanceViewportV625 = Readonly<{
  width: number;
  height: number;
  devicePixelRatio: number;
  orientation: "portrait" | "landscape" | "square";
  userAgentClass: "desktop-browser" | "mobile-viewport" | "unknown";
}>;

export type MainlineAPerformanceBuildIdentityV625 = Readonly<{
  buildId: string;
  branch: string;
  head: string;
  route: string;
  source: "root-marker" | "runtime-marker" | "unknown";
}>;

export type MainlineAPerformanceVisibilityV625 = Readonly<{
  documentVisibility: "visible" | "hidden" | "prerender" | "unloaded" | "unknown";
  rootVisible: boolean;
  canvasCount: number;
  panelVisible: boolean;
}>;

export type MainlineAPerformanceFrameSampleV625 = Readonly<{
  atMs: number;
  deltaMs: number;
  longTaskMs: number;
}>;

export type MainlineAPerformanceFrameSummaryV625 = Readonly<{
  sampleCount: number;
  durationMs: number;
  p50Ms: number | null;
  p95Ms: number | null;
  maxMs: number | null;
  medianFps: number | null;
  longTaskCount: number;
  longTaskMaxMs: number | null;
  under50MsRatio: number | null;
}>;

export type MainlineAResourceLifecycleEvidenceV625 = Readonly<{
  before: AtlasRuntimeResourceSnapshot;
  after: AtlasRuntimeResourceSnapshot;
  diff: AtlasResourceBaselineDiffV300;
  status: MainlineAPerformanceLifecycleStatusV625;
  releasedOwners: readonly string[];
  unreleasedOwners: readonly string[];
  repeatedRunIndex: number;
}>;

export type MainlineAPerformanceMemoryV625 = Readonly<{
  jsHeapUsedBytes: number | null;
  jsHeapTotalBytes: number | null;
  jsHeapLimitBytes: number | null;
  deviceMemoryGb: number | null;
  source: "performance-memory" | "navigator-device-memory" | "unavailable";
}>;

export type MainlineAPerformanceRunV625 = Readonly<{
  runId: string;
  device: MainlineAPerformanceDeviceV625;
  scenario: MainlineAPerformanceScenarioV625;
  viewport: MainlineAPerformanceViewportV625;
  build: MainlineAPerformanceBuildIdentityV625;
  visibility: MainlineAPerformanceVisibilityV625;
  startedAt: string;
  endedAt: string | null;
  durationMs: number;
  frame: MainlineAPerformanceFrameSummaryV625;
  memory: MainlineAPerformanceMemoryV625;
  resources: MainlineAResourceLifecycleEvidenceV625;
  consoleErrors: number;
  pageErrors: number;
  status: "complete" | "incomplete" | "blocked";
  evidenceClass: "browser-runtime-observation";
  notes: readonly string[];
}>;

export type MainlineAPerformanceReceiptV625 = Readonly<{
  schema: typeof MAINLINE_A_PERFORMANCE_EVIDENCE_SCHEMA_V625;
  version: typeof MAINLINE_A_PERFORMANCE_EVIDENCE_VERSION_V625;
  generatedAt: string;
  build: MainlineAPerformanceBuildIdentityV625;
  boundary: Readonly<{
    candidateOnly: true;
    hold: true;
    notAdmitted: true;
    scientificPayloadWriteback: false;
    runtimePromotion: "closed";
  }>;
  requestedDevices: readonly MainlineAPerformanceDeviceV625[];
  runs: readonly MainlineAPerformanceRunV625[];
  repeatRuns: number;
  longRunRequestedMs: number;
  longRunObservedMs: number;
  status: "pending" | "partial" | "measured" | "blocked";
  evidenceClass: "browser-runtime-observation";
  staticEvidence: Readonly<{
    schemaValid: boolean;
    digest: string;
    verifiedAt: string;
  }>;
  blockers: readonly string[];
  notes: readonly string[];
}>;

export type MainlineAPerformanceRootMarkersV625 = Readonly<{
  buildId?: string | null;
  branch?: string | null;
  head?: string | null;
  route?: string | null;
}>;

const EMPTY_SHA = "00000000";

function finitePositive(value: unknown, fallback = 0): number {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : fallback;
}

function integerNonNegative(value: unknown, fallback = 0): number {
  const numeric = Math.trunc(finitePositive(value, fallback));
  return Number.isSafeInteger(numeric) ? numeric : fallback;
}

function isoOrFallback(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : fallback;
}

export function normalizeMainlineAPerformanceDeviceV625(
  value: unknown,
): MainlineAPerformanceDeviceV625 {
  return value === "mobile" ? "mobile" : "desktop";
}

export function normalizeMainlineAPerformanceScenarioV625(
  value: unknown,
): MainlineAPerformanceScenarioV625 {
  return MAINLINE_A_PERFORMANCE_SCENARIOS_V625.includes(
    value as MainlineAPerformanceScenarioV625,
  )
    ? (value as MainlineAPerformanceScenarioV625)
    : "atlas";
}

export function createMainlineAPerformanceViewportV625(
  width: number,
  height: number,
  devicePixelRatio = 1,
  userAgentClass: MainlineAPerformanceViewportV625["userAgentClass"] = "unknown",
): MainlineAPerformanceViewportV625 {
  const safeWidth = Math.max(1, integerNonNegative(width, 1));
  const safeHeight = Math.max(1, integerNonNegative(height, 1));
  const orientation = safeWidth === safeHeight
    ? "square"
    : safeWidth > safeHeight
      ? "landscape"
      : "portrait";
  return Object.freeze({
    width: safeWidth,
    height: safeHeight,
    devicePixelRatio: Math.max(0.1, Math.min(8, finitePositive(devicePixelRatio, 1))),
    orientation,
    userAgentClass,
  });
}

export function readMainlineAPerformanceViewportV625(
  win: Pick<Window, "innerWidth" | "innerHeight" | "devicePixelRatio"> & {
    navigator?: Pick<Navigator, "userAgent">;
  } = window,
): MainlineAPerformanceViewportV625 {
  const userAgent = win.navigator?.userAgent ?? "";
  const isMobile = /Android|iPhone|iPad|Mobile/i.test(userAgent);
  return createMainlineAPerformanceViewportV625(
    win.innerWidth,
    win.innerHeight,
    win.devicePixelRatio,
    isMobile ? "mobile-viewport" : win.innerWidth > 0 ? "desktop-browser" : "unknown",
  );
}

export function createMainlineAPerformanceBuildIdentityV625(
  markers: MainlineAPerformanceRootMarkersV625 = {},
): MainlineAPerformanceBuildIdentityV625 {
  const marker = (value: string | null | undefined, fallback: string): string =>
    value?.trim() || fallback;
  const source = markers.buildId || markers.branch || markers.head
    ? "runtime-marker"
    : "unknown";
  return Object.freeze({
    buildId: marker(markers.buildId, "unknown-build"),
    branch: marker(markers.branch, "unknown-branch"),
    head: marker(markers.head, "unknown-head"),
    route: marker(markers.route, "/"),
    source,
  });
}

export function readMainlineAPerformanceBuildIdentityV625(
  root: Pick<HTMLElement, "dataset"> | null,
): MainlineAPerformanceBuildIdentityV625 {
  const dataset = root?.dataset ?? {};
  return createMainlineAPerformanceBuildIdentityV625({
    buildId: dataset.mainlineBuildId ?? dataset.buildId ?? dataset.atlasMainlineBuildId ?? dataset.atlasV595BuildId,
    branch: dataset.mainlineBranch ?? dataset.branch ?? dataset.atlasMainlineBranch,
    head: dataset.mainlineHead ?? dataset.head ?? dataset.atlasMainlineHead,
    route: dataset.mainlineRoute ?? dataset.route,
  });
}

export function createMainlineAPerformanceVisibilityV625(args: {
  documentVisibility?: string | null;
  rootVisible?: boolean;
  canvasCount?: number;
  panelVisible?: boolean;
} = {}): MainlineAPerformanceVisibilityV625 {
  const visibility = args.documentVisibility;
  const documentVisibility = visibility === "visible" || visibility === "hidden" || visibility === "prerender" || visibility === "unloaded"
    ? visibility
    : "unknown";
  return Object.freeze({
    documentVisibility,
    rootVisible: args.rootVisible ?? false,
    canvasCount: integerNonNegative(args.canvasCount, 0),
    panelVisible: args.panelVisible ?? false,
  });
}

export function readMainlineAPerformanceVisibilityV625(
  doc: Pick<Document, "visibilityState" | "querySelectorAll">,
  root: Element | null,
): MainlineAPerformanceVisibilityV625 {
  const rootElement = root instanceof HTMLElement ? root : null;
  const rootVisible = Boolean(rootElement && rootElement.getClientRects().length > 0);
  const panelVisible = Boolean(rootElement?.getAttribute("data-mainline-a-performance-visible") === "true");
  return createMainlineAPerformanceVisibilityV625({
    documentVisibility: doc.visibilityState,
    rootVisible,
    canvasCount: doc.querySelectorAll("canvas").length,
    panelVisible,
  });
}

export function percentileMainlineAPerformanceV625(
  values: readonly number[],
  fraction: number,
): number | null {
  const finite = values.filter((value) => Number.isFinite(value) && value >= 0).sort((a, b) => a - b);
  if (finite.length === 0) return null;
  const clamped = Math.max(0, Math.min(1, fraction));
  const index = (finite.length - 1) * clamped;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return finite[lower] ?? null;
  const lowerValue = finite[lower] ?? 0;
  const upperValue = finite[upper] ?? lowerValue;
  return lowerValue + (upperValue - lowerValue) * (index - lower);
}

export function summarizeMainlineAPerformanceFramesV625(
  samples: readonly MainlineAPerformanceFrameSampleV625[],
  durationMs: number,
): MainlineAPerformanceFrameSummaryV625 {
  const deltas = samples.map((sample) => sample.deltaMs).filter((value) => Number.isFinite(value) && value >= 0);
  const longTasks = samples.map((sample) => sample.longTaskMs).filter((value) => Number.isFinite(value) && value > 0);
  const p50Ms = percentileMainlineAPerformanceV625(deltas, 0.5);
  const p95Ms = percentileMainlineAPerformanceV625(deltas, 0.95);
  const maxMs = deltas.length > 0 ? Math.max(...deltas) : null;
  const medianFps = p50Ms && p50Ms > 0 ? Math.min(240, 1000 / p50Ms) : null;
  return Object.freeze({
    sampleCount: deltas.length,
    durationMs: Math.max(0, finitePositive(durationMs)),
    p50Ms,
    p95Ms,
    maxMs,
    medianFps,
    longTaskCount: longTasks.length,
    longTaskMaxMs: longTasks.length > 0 ? Math.max(...longTasks) : null,
    under50MsRatio: deltas.length > 0 ? deltas.filter((value) => value < 50).length / deltas.length : null,
  });
}

export function readMainlineAPerformanceMemoryV625(
  scope: Pick<Window, "performance" | "navigator"> = window,
): MainlineAPerformanceMemoryV625 {
  const performanceMemory = (scope.performance as Performance & {
    memory?: { usedJSHeapSize?: number; totalJSHeapSize?: number; jsHeapSizeLimit?: number };
  }).memory;
  const used = performanceMemory?.usedJSHeapSize;
  const total = performanceMemory?.totalJSHeapSize;
  const limit = performanceMemory?.jsHeapSizeLimit;
  const deviceMemory = (scope.navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof used === "number" && Number.isFinite(used)) {
    return Object.freeze({
      jsHeapUsedBytes: Math.max(0, Math.trunc(used)),
      jsHeapTotalBytes: typeof total === "number" && Number.isFinite(total) ? Math.max(0, Math.trunc(total)) : null,
      jsHeapLimitBytes: typeof limit === "number" && Number.isFinite(limit) ? Math.max(0, Math.trunc(limit)) : null,
      deviceMemoryGb: typeof deviceMemory === "number" && Number.isFinite(deviceMemory) ? Math.max(0, deviceMemory) : null,
      source: "performance-memory",
    });
  }
  if (typeof deviceMemory === "number" && Number.isFinite(deviceMemory)) {
    return Object.freeze({
      jsHeapUsedBytes: null,
      jsHeapTotalBytes: null,
      jsHeapLimitBytes: null,
      deviceMemoryGb: Math.max(0, deviceMemory),
      source: "navigator-device-memory",
    });
  }
  return Object.freeze({
    jsHeapUsedBytes: null,
    jsHeapTotalBytes: null,
    jsHeapLimitBytes: null,
    deviceMemoryGb: null,
    source: "unavailable",
  });
}

function cloneResourceSnapshot(snapshot: AtlasRuntimeResourceSnapshot): AtlasRuntimeResourceSnapshot {
  return Object.freeze({
    ...snapshot,
    byOwner: Object.freeze(Object.fromEntries(Object.entries(snapshot.byOwner).map(([key, value]) => [key, Object.freeze({ ...value })]))),
    byKind: Object.freeze(Object.fromEntries(Object.entries(snapshot.byKind).map(([key, value]) => [key, Object.freeze({ ...value })]))),
    byIdentity: Object.freeze(Object.fromEntries(Object.entries(snapshot.byIdentity).map(([key, value]) => [key, Object.freeze({ ...value })]))),
  }) as AtlasRuntimeResourceSnapshot;
}

export function createMainlineAResourceLifecycleEvidenceV625(args: {
  before: AtlasRuntimeResourceSnapshot;
  after: AtlasRuntimeResourceSnapshot;
  repeatedRunIndex?: number;
  releasedOwners?: readonly string[];
}): MainlineAResourceLifecycleEvidenceV625 {
  const before = cloneResourceSnapshot(args.before);
  const after = cloneResourceSnapshot(args.after);
  const diff = diffAtlasResourceSnapshotsV300(before, after);
  const releasedOwners = [...new Set(args.releasedOwners ?? [])].sort();
  const beforeOwners = new Set(Object.keys(before.byOwner));
  const afterOwners = new Set(Object.keys(after.byOwner));
  const unreleasedOwners = diff.status === "baseline"
    ? []
    : [...new Set([...beforeOwners, ...afterOwners])].filter((owner) => {
      const prior = before.byOwner[owner];
      const current = after.byOwner[owner];
      return prior?.count !== current?.count || prior?.estimatedBytes !== current?.estimatedBytes;
    }).sort();
  const status: MainlineAPerformanceLifecycleStatusV625 = diff.status === "baseline" && unreleasedOwners.length === 0
    ? "baseline"
    : diff.status === "drift"
      ? "drift"
      : "blocked";
  return Object.freeze({
    before,
    after,
    diff,
    status,
    releasedOwners: Object.freeze(releasedOwners),
    unreleasedOwners: Object.freeze(unreleasedOwners),
    repeatedRunIndex: integerNonNegative(args.repeatedRunIndex, 0),
  });
}

export function createMainlineAPerformanceRunV625(args: {
  runId: string;
  device: MainlineAPerformanceDeviceV625;
  scenario: MainlineAPerformanceScenarioV625;
  viewport: MainlineAPerformanceViewportV625;
  build: MainlineAPerformanceBuildIdentityV625;
  visibility: MainlineAPerformanceVisibilityV625;
  startedAt: string;
  endedAt?: string | null;
  frameSamples: readonly MainlineAPerformanceFrameSampleV625[];
  durationMs: number;
  memory: MainlineAPerformanceMemoryV625;
  resources: MainlineAResourceLifecycleEvidenceV625;
  consoleErrors?: number;
  pageErrors?: number;
  notes?: readonly string[];
}): MainlineAPerformanceRunV625 {
  const endedAt = args.endedAt ? isoOrFallback(args.endedAt, args.startedAt) : null;
  const frame = summarizeMainlineAPerformanceFramesV625(args.frameSamples, args.durationMs);
  const blockers: string[] = [];
  if (!endedAt) blockers.push("ended-at-missing");
  if (frame.sampleCount === 0) blockers.push("frame-samples-missing");
  if (args.visibility.documentVisibility !== "visible") blockers.push("document-not-visible");
  if (!args.visibility.rootVisible) blockers.push("root-not-visible");
  if (args.resources.status === "drift") blockers.push("resource-drift");
  if (args.resources.status === "blocked") blockers.push("resource-lifecycle-blocked");
  if (args.viewport.userAgentClass !== "unknown" && chooseMainlineAPerformanceDeviceV625(args.viewport) !== args.device) blockers.push("requested-device-mismatch");
  if (args.build.buildId === "unknown-build" || args.build.branch === "unknown-branch" || args.build.head === "unknown-head") blockers.push("build-identity-missing");
  const consoleErrors = integerNonNegative(args.consoleErrors, 0);
  const pageErrors = integerNonNegative(args.pageErrors, 0);
  if (consoleErrors > 0) blockers.push("console-errors");
  if (pageErrors > 0) blockers.push("page-errors");
  const status: MainlineAPerformanceRunV625["status"] = blockers.length === 0
    ? "complete"
    : blockers.some((blocker) => blocker.includes("missing") || blocker.includes("blocked"))
      ? "blocked"
      : "incomplete";
  return Object.freeze({
    runId: args.runId,
    device: normalizeMainlineAPerformanceDeviceV625(args.device),
    scenario: normalizeMainlineAPerformanceScenarioV625(args.scenario),
    viewport: args.viewport,
    build: args.build,
    visibility: args.visibility,
    startedAt: isoOrFallback(args.startedAt, new Date(0).toISOString()),
    endedAt,
    durationMs: Math.max(0, finitePositive(args.durationMs)),
    frame,
    memory: args.memory,
    resources: args.resources,
    consoleErrors,
    pageErrors,
    status,
    evidenceClass: "browser-runtime-observation",
    notes: Object.freeze([...new Set([...(args.notes ?? []), ...blockers.map((value) => `blocker:${value}`)])]),
  });
}

export function createMainlineAPerformanceBoundaryV625(): MainlineAPerformanceReceiptV625["boundary"] {
  return Object.freeze({
    candidateOnly: true,
    hold: true,
    notAdmitted: true,
    scientificPayloadWriteback: false,
    runtimePromotion: "closed",
  });
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, stableValue(entry)]));
  }
  return value;
}

export function stableMainlineAPerformanceJsonV625(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

export function digestMainlineAPerformanceTextV625(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export function digestMainlineAPerformanceValueV625(value: unknown): string {
  return digestMainlineAPerformanceTextV625(stableMainlineAPerformanceJsonV625(value));
}

export function createPendingMainlineAPerformanceReceiptV625(
  build: MainlineAPerformanceBuildIdentityV625,
  generatedAt = new Date().toISOString(),
): MainlineAPerformanceReceiptV625 {
  const base = {
    schema: MAINLINE_A_PERFORMANCE_EVIDENCE_SCHEMA_V625,
    version: MAINLINE_A_PERFORMANCE_EVIDENCE_VERSION_V625,
    generatedAt,
    build,
    boundary: createMainlineAPerformanceBoundaryV625(),
    requestedDevices: [...MAINLINE_A_PERFORMANCE_DEVICES_V625],
    runs: [],
    repeatRuns: 0,
    longRunRequestedMs: 30 * 60 * 1000,
    longRunObservedMs: 0,
    status: "pending" as const,
    evidenceClass: "browser-runtime-observation" as const,
    blockers: ["desktop-browser-run-required", "mobile-viewport-run-required", "physical-device-not-run", "long-run-observation-required"],
    notes: [MAINLINE_A_PERFORMANCE_BOUNDARY_V625],
  };
  const digest = digestMainlineAPerformanceValueV625(base);
  return Object.freeze({
    ...base,
    staticEvidence: Object.freeze({ schemaValid: true, digest, verifiedAt: generatedAt }),
  });
}

export function appendMainlineAPerformanceRunV625(
  receipt: MainlineAPerformanceReceiptV625,
  run: MainlineAPerformanceRunV625,
): MainlineAPerformanceReceiptV625 {
  const runs = [...receipt.runs.filter((entry) => entry.runId !== run.runId), run].sort((a, b) => a.runId.localeCompare(b.runId));
  const devices = new Set(runs.map((entry) => entry.device));
  const blockers = new Set(receipt.blockers);
  if (devices.has("desktop")) blockers.delete("desktop-browser-run-required");
  if (devices.has("mobile")) blockers.delete("mobile-viewport-run-required");
  if (runs.some((entry) => entry.resources.status === "drift")) blockers.add("resource-drift-observed");
  if (runs.some((entry) => entry.status !== "complete")) blockers.add("incomplete-run-observed");
  if (runs.some((entry) => entry.build.buildId !== receipt.build.buildId || entry.build.branch !== receipt.build.branch || entry.build.head !== receipt.build.head)) blockers.add("build-identity-mismatch");
  const completeDevices = devices.has("desktop") && devices.has("mobile");
  const status: MainlineAPerformanceReceiptV625["status"] = !completeDevices
    ? "partial"
    : [...blockers].some((blocker) => blocker.includes("drift") || blocker.includes("incomplete") || blocker.includes("long-run") || blocker.includes("physical") || blocker.includes("identity") || blocker.includes("device"))
      ? "blocked"
      : "measured";
  const nextBase = {
    ...receipt,
    runs: Object.freeze(runs),
    repeatRuns: Math.max(receipt.repeatRuns, runs.filter((entry) => entry.scenario === "repeat-cycle").length),
    status,
    blockers: Object.freeze([...blockers].sort()),
    staticEvidence: receipt.staticEvidence,
  };
  const digest = digestMainlineAPerformanceValueV625({
    ...nextBase,
    staticEvidence: undefined,
  });
  return Object.freeze({
    ...nextBase,
    staticEvidence: Object.freeze({ schemaValid: true, digest, verifiedAt: new Date().toISOString() }),
  });
}

export function markMainlineAPerformanceLongRunV625(
  receipt: MainlineAPerformanceReceiptV625,
  observedMs: number,
): MainlineAPerformanceReceiptV625 {
  const safeObserved = Math.max(0, finitePositive(observedMs));
  const blockers = new Set(receipt.blockers);
  if (safeObserved >= receipt.longRunRequestedMs) blockers.delete("long-run-observation-required");
  else blockers.add("long-run-observation-required");
  const nextBase = {
    ...receipt,
    longRunObservedMs: safeObserved,
    blockers: Object.freeze([...blockers].sort()),
    status: receipt.status === "measured" && safeObserved >= receipt.longRunRequestedMs ? "measured" : "blocked",
  } as const;
  const digest = digestMainlineAPerformanceValueV625({ ...nextBase, staticEvidence: undefined });
  return Object.freeze({ ...nextBase, staticEvidence: Object.freeze({ schemaValid: true, digest, verifiedAt: new Date().toISOString() }) });
}

export function verifyMainlineAPerformanceReceiptV625(
  receipt: MainlineAPerformanceReceiptV625,
): Readonly<{ ok: boolean; failures: readonly string[]; digest: string }> {
  const failures: string[] = [];
  if (receipt.schema !== MAINLINE_A_PERFORMANCE_EVIDENCE_SCHEMA_V625) failures.push("schema");
  if (receipt.version !== MAINLINE_A_PERFORMANCE_EVIDENCE_VERSION_V625) failures.push("version");
  if (receipt.boundary.candidateOnly !== true || receipt.boundary.hold !== true || receipt.boundary.notAdmitted !== true) failures.push("boundary");
  if (receipt.boundary.scientificPayloadWriteback !== false || receipt.boundary.runtimePromotion !== "closed") failures.push("writeback");
  if (receipt.evidenceClass !== "browser-runtime-observation") failures.push("evidence-class");
  if (!Array.isArray(receipt.runs)) failures.push("runs-array");
  for (const run of receipt.runs) {
    if (!run.runId || !run.startedAt) failures.push(`${run.runId || "run"}:identity`);
    if (run.evidenceClass !== "browser-runtime-observation") failures.push(`${run.runId}:evidence-class`);
    if (run.resources.status === "drift") failures.push(`${run.runId}:resource-drift`);
  }
  const digest = digestMainlineAPerformanceValueV625({ ...receipt, staticEvidence: undefined });
  if (receipt.staticEvidence.digest !== digest) failures.push("digest");
  return Object.freeze({ ok: failures.length === 0, failures: Object.freeze([...new Set(failures)]), digest });
}

export function performanceRunKeyV625(
  run: Pick<MainlineAPerformanceRunV625, "device" | "scenario" | "viewport">,
): string {
  return [run.device, run.scenario, run.viewport.width, run.viewport.height, run.viewport.devicePixelRatio].join(":");
}

export function summarizeMainlineAPerformanceReceiptV625(
  receipt: MainlineAPerformanceReceiptV625,
): Readonly<{ runCount: number; desktopRuns: number; mobileRuns: number; completeRuns: number; driftRuns: number; meanP95Ms: number | null; meanMedianFps: number | null; lifecycle: "baseline" | "drift" | "not-run" }> {
  const p95 = receipt.runs.map((run) => run.frame.p95Ms).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const fps = receipt.runs.map((run) => run.frame.medianFps).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const mean = (values: readonly number[]): number | null => values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;
  const driftRuns = receipt.runs.filter((run) => run.resources.status === "drift").length;
  return Object.freeze({
    runCount: receipt.runs.length,
    desktopRuns: receipt.runs.filter((run) => run.device === "desktop").length,
    mobileRuns: receipt.runs.filter((run) => run.device === "mobile").length,
    completeRuns: receipt.runs.filter((run) => run.status === "complete").length,
    driftRuns,
    meanP95Ms: mean(p95),
    meanMedianFps: mean(fps),
    lifecycle: receipt.runs.length === 0 ? "not-run" : driftRuns > 0 ? "drift" : "baseline",
  });
}

export function formatMainlineAPerformanceNumberV625(
  value: number | null,
  fractionDigits = 1,
  empty = "—",
): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(fractionDigits) : empty;
}

export function assertMainlineAPerformanceBoundaryV625(
  receipt: Pick<MainlineAPerformanceReceiptV625, "boundary">,
): void {
  if (!receipt.boundary.candidateOnly || !receipt.boundary.hold || !receipt.boundary.notAdmitted || receipt.boundary.scientificPayloadWriteback || receipt.boundary.runtimePromotion !== "closed") {
    throw new Error("Mainline A R65 performance evidence crossed the candidate-only boundary");
  }
}

export function isMainlineAPerformanceRunCompleteV625(run: MainlineAPerformanceRunV625): boolean {
  return run.status === "complete" && run.frame.sampleCount > 0 && run.endedAt !== null && run.resources.status === "baseline";
}

export function chooseMainlineAPerformanceDeviceV625(viewport: MainlineAPerformanceViewportV625): MainlineAPerformanceDeviceV625 {
  return viewport.userAgentClass === "mobile-viewport" || viewport.width < 700 ? "mobile" : "desktop";
}

export function createMainlineAPerformanceRunIdV625(device: MainlineAPerformanceDeviceV625, sequence: number): string {
  const nonce = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID().slice(0, 8)
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  return `r65-${device}-${Math.max(0, Math.trunc(sequence)).toString().padStart(3, "0")}-${nonce}`;
}

export function createMainlineAPerformanceCsvV625(receipt: MainlineAPerformanceReceiptV625): string {
  const header = "runId,device,scenario,width,height,dpr,durationMs,frameSamples,p50Ms,p95Ms,medianFps,longTaskMaxMs,heapUsedBytes,resourceStatus,resourceDigestBefore,resourceDigestAfter,status";
  const rows = receipt.runs.map((run) => [
    run.runId,
    run.device,
    run.scenario,
    run.viewport.width,
    run.viewport.height,
    run.viewport.devicePixelRatio,
    run.durationMs,
    run.frame.sampleCount,
    run.frame.p50Ms ?? "",
    run.frame.p95Ms ?? "",
    run.frame.medianFps ?? "",
    run.frame.longTaskMaxMs ?? "",
    run.memory.jsHeapUsedBytes ?? "",
    run.resources.status,
    run.resources.before.identityDigest,
    run.resources.after.identityDigest,
    run.status,
  ].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","));
  return [header, ...rows].join("\n");
}

export const MAINLINE_A_PERFORMANCE_EMPTY_DIGEST_V625 = EMPTY_SHA;

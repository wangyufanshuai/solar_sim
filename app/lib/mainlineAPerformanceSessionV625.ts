"use client";

import {
  appendMainlineAPerformanceRunV625,
  createMainlineAPerformanceRunIdV625,
  createMainlineAPerformanceRunV625,
  createMainlineAPerformanceViewportV625,
  readMainlineAPerformanceBuildIdentityV625,
  readMainlineAPerformanceMemoryV625,
  readMainlineAPerformanceViewportV625,
  readMainlineAPerformanceVisibilityV625,
  type MainlineAPerformanceBuildIdentityV625,
  type MainlineAPerformanceDeviceV625,
  type MainlineAPerformanceFrameSampleV625,
  type MainlineAPerformanceMemoryV625,
  type MainlineAPerformanceReceiptV625,
  type MainlineAPerformanceRunV625,
  type MainlineAPerformanceScenarioV625,
  type MainlineAPerformanceViewportV625,
  createMainlineAResourceLifecycleEvidenceV625,
  createPendingMainlineAPerformanceReceiptV625,
  normalizeMainlineAPerformanceScenarioV625,
} from "./mainlineAPerformanceEvidenceV625";
import {
  getAtlasResourceSnapshot,
  type AtlasRuntimeResourceSnapshot,
} from "./atlasResourceLifecycle";

export type MainlineAPerformanceSessionStateV625 =
  | "idle"
  | "running"
  | "finished"
  | "aborted";

export type MainlineAPerformanceSessionControllerV625 = Readonly<{
  runId: string;
  device: MainlineAPerformanceDeviceV625;
  scenario: MainlineAPerformanceScenarioV625;
  viewport: MainlineAPerformanceViewportV625;
  state: () => MainlineAPerformanceSessionStateV625;
  pushFrame: (atMs: number, deltaMs: number) => void;
  pushLongTask: (durationMs: number) => void;
  finish: (args?: { endedAt?: string; notes?: readonly string[]; releasedOwners?: readonly string[] }) => MainlineAPerformanceRunV625 | null;
  abort: (reason?: string) => MainlineAPerformanceRunV625 | null;
  snapshot: () => Readonly<{ frameSamples: number; longTasks: number; elapsedMs: number; state: MainlineAPerformanceSessionStateV625 }>;
}>;

type PerformanceMemoryScope = Pick<Window, "performance" | "navigator">;

function nowMs(): number {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

function isoNow(): string {
  return new Date().toISOString();
}

export function selectMainlineAPerformanceRootV625(
  querySelector: (selector: string) => HTMLElement | null,
): HTMLElement | null {
  // Prefer the performance surface itself when it is mounted.  The app shell
  // remains visible while the modal/panel is closed, which used to make a
  // valid performance-panel run record panelVisible=false.
  return querySelector("[data-mainline-a-performance]")
    ?? querySelector("[data-atlas-app-shell]")
    ?? querySelector("[data-atlas-browser-acceptance-version]")
    ?? null;
}

/**
 * Resolve the build identity from the app shell, independently of the
 * performance surface used for visibility. The panel is mounted below the
 * shell and intentionally carries a receipt identity of its own; using it as
 * the identity source can therefore report the pending identity instead of
 * the production build that actually rendered the page.
 */
export function selectMainlineAPerformanceIdentityRootV625(
  querySelector: (selector: string) => HTMLElement | null,
  fallback: HTMLElement | null = null,
): HTMLElement | null {
  return querySelector("[data-atlas-app-shell]")
    ?? querySelector("[data-atlas-browser-acceptance-version]")
    ?? fallback
    ?? querySelector("[data-mainline-a-performance]")
    ?? null;
}

function readRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return selectMainlineAPerformanceRootV625((selector) => document.querySelector<HTMLElement>(selector));
}

function readIdentityRoot(visibilityRoot: HTMLElement | null): HTMLElement | null {
  if (typeof document === "undefined") return visibilityRoot;
  return selectMainlineAPerformanceIdentityRootV625(
    (selector) => document.querySelector<HTMLElement>(selector),
    visibilityRoot,
  );
}

function createViewportForDevice(device: MainlineAPerformanceDeviceV625): MainlineAPerformanceViewportV625 {
  if (typeof window === "undefined") return createMainlineAPerformanceViewportV625(device === "mobile" ? 390 : 1280, device === "mobile" ? 844 : 720, device === "mobile" ? 2 : 1, device === "mobile" ? "mobile-viewport" : "desktop-browser");
  // The selected device is a requested evidence class. Never rewrite the
  // browser's dimensions: a mobile run is only mobile evidence when the
  // browser itself is actually using a mobile viewport.
  return readMainlineAPerformanceViewportV625(window);
}

function memorySnapshot(scope: PerformanceMemoryScope | undefined): MainlineAPerformanceMemoryV625 {
  if (!scope) return { jsHeapUsedBytes: null, jsHeapTotalBytes: null, jsHeapLimitBytes: null, deviceMemoryGb: null, source: "unavailable" };
  return readMainlineAPerformanceMemoryV625(scope);
}

export function createMainlineAPerformanceSessionV625(args: {
  device: MainlineAPerformanceDeviceV625;
  scenario?: MainlineAPerformanceScenarioV625;
  sequence?: number;
  viewport?: MainlineAPerformanceViewportV625;
  build?: MainlineAPerformanceBuildIdentityV625;
  root?: HTMLElement | null;
  memoryScope?: PerformanceMemoryScope;
  repeatedRunIndex?: number;
}): MainlineAPerformanceSessionControllerV625 {
  const device = args.device;
  const scenario = normalizeMainlineAPerformanceScenarioV625(args.scenario);
  const root = args.root ?? readRoot();
  const viewport = args.viewport ?? createViewportForDevice(device);
  const build = args.build ?? readMainlineAPerformanceBuildIdentityV625(readIdentityRoot(root));
  const runId = createMainlineAPerformanceRunIdV625(device, args.sequence ?? 0);
  const startedAt = isoNow();
  const startedAtMs = nowMs();
  const baseline = getAtlasResourceSnapshot();
  const frameSamples: MainlineAPerformanceFrameSampleV625[] = [];
  let state: MainlineAPerformanceSessionStateV625 = "running";
  let lastFrameAt = startedAtMs;
  let lastLongTask = 0;
  let endedAt: string | null = null;
  const unavailableBrowser = typeof window === "undefined";

  const pushFrame = (atMs: number, deltaMs: number): void => {
    if (state !== "running") return;
    const safeAt = Number.isFinite(atMs) ? atMs : nowMs();
    const safeDelta = Number.isFinite(deltaMs) && deltaMs >= 0 ? Math.min(deltaMs, 60_000) : Math.max(0, safeAt - lastFrameAt);
    frameSamples.push({ atMs: safeAt, deltaMs: safeDelta, longTaskMs: lastLongTask });
    lastFrameAt = safeAt;
    lastLongTask = 0;
  };
  const pushLongTask = (durationMs: number): void => {
    if (state !== "running" || !Number.isFinite(durationMs) || durationMs <= 0) return;
    lastLongTask = Math.max(lastLongTask, Math.min(60_000, durationMs));
  };
  const finish = (finishArgs: { endedAt?: string; notes?: readonly string[]; releasedOwners?: readonly string[] } = {}): MainlineAPerformanceRunV625 | null => {
    if (state !== "running") return null;
    state = "finished";
    endedAt = finishArgs.endedAt ?? isoNow();
    const after = getAtlasResourceSnapshot();
    const lifecycle = createMainlineAResourceLifecycleEvidenceV625({
      before: baseline,
      after,
      repeatedRunIndex: args.repeatedRunIndex,
      releasedOwners: finishArgs.releasedOwners,
    });
    const visibility = typeof document === "undefined"
      ? { documentVisibility: "unknown" as const, rootVisible: false, canvasCount: 0, panelVisible: false }
      : readMainlineAPerformanceVisibilityV625(document, root);
    return createMainlineAPerformanceRunV625({
      runId,
      device,
      scenario,
      viewport,
      build,
      visibility,
      startedAt,
      endedAt,
      frameSamples,
      durationMs: Math.max(0, nowMs() - startedAtMs),
      memory: memorySnapshot(args.memoryScope ?? (typeof window === "undefined" ? undefined : window)),
      resources: lifecycle,
      notes: [...(finishArgs.notes ?? []), ...(unavailableBrowser ? ["browser-runtime-unavailable"] : [])],
    });
  };
  const abort = (reason = "aborted-by-runner"): MainlineAPerformanceRunV625 | null => {
    if (state !== "running") return null;
    const run = finish({ notes: [reason] });
    state = "aborted";
    return run ? { ...run, status: "blocked", notes: Object.freeze([...run.notes, `blocker:${reason}`]) } : null;
  };
  return Object.freeze({
    runId,
    device,
    scenario,
    viewport,
    state: () => state,
    pushFrame,
    pushLongTask,
    finish,
    abort,
    snapshot: () => Object.freeze({
      frameSamples: frameSamples.length,
      longTasks: frameSamples.filter((sample) => sample.longTaskMs > 0).length + (lastLongTask > 0 ? 1 : 0),
      elapsedMs: Math.max(0, nowMs() - startedAtMs),
      state,
    }),
  });
}

export type MainlineAPerformanceObserverHandleV625 = Readonly<{
  stop: () => void;
}>;

export function attachMainlineAPerformanceObserversV625(
  controller: MainlineAPerformanceSessionControllerV625,
): MainlineAPerformanceObserverHandleV625 {
  if (typeof window === "undefined") return Object.freeze({ stop: () => undefined });
  let frameId = 0;
  let previous = nowMs();
  const tick = (atMs: number): void => {
    if (controller.state() !== "running") return;
    controller.pushFrame(atMs, atMs - previous);
    previous = atMs;
    frameId = window.requestAnimationFrame(tick);
  };
  frameId = window.requestAnimationFrame(tick);
  let observer: PerformanceObserver | null = null;
  const observerStartedAt = nowMs();
  if (typeof PerformanceObserver !== "undefined") {
    observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.startTime >= observerStartedAt) controller.pushLongTask(entry.duration);
      }
    });
    try {
      observer.observe({ type: "longtask", buffered: true });
    } catch {
      observer.disconnect();
      observer = null;
    }
  }
  return Object.freeze({
    stop: () => {
      window.cancelAnimationFrame(frameId);
      observer?.disconnect();
      observer = null;
    },
  });
}

export function collectMainlineAPerformanceRunV625(args: {
  device: MainlineAPerformanceDeviceV625;
  scenario?: MainlineAPerformanceScenarioV625;
  sequence?: number;
  durationMs?: number;
  root?: HTMLElement | null;
  onProgress?: (snapshot: ReturnType<MainlineAPerformanceSessionControllerV625["snapshot"]>) => void;
}): Promise<MainlineAPerformanceRunV625 | null> {
  const controller = createMainlineAPerformanceSessionV625(args);
  const observer = attachMainlineAPerformanceObserversV625(controller);
  const duration = Math.max(50, args.durationMs ?? 4_000);
  return new Promise((resolve) => {
    const started = nowMs();
    const timer = window.setInterval(() => {
      args.onProgress?.(controller.snapshot());
      if (nowMs() - started < duration) return;
      window.clearInterval(timer);
      observer.stop();
      resolve(controller.finish({ notes: [`requested-duration-ms:${duration}`] }));
    }, 100);
  });
}

export function appendRunToReceiptV625(
  receipt: MainlineAPerformanceReceiptV625,
  run: MainlineAPerformanceRunV625 | null,
): MainlineAPerformanceReceiptV625 {
  return run ? appendMainlineAPerformanceRunV625(receipt, run) : receipt;
}

export type MainlineARepeatedLifecycleCycleV625 = Readonly<{
  cycle: number;
  before: AtlasRuntimeResourceSnapshot;
  after: AtlasRuntimeResourceSnapshot;
  released: boolean;
  status: "baseline" | "drift";
}>;

export function createMainlineARepeatedLifecycleCycleV625(args: {
  cycle: number;
  before: AtlasRuntimeResourceSnapshot;
  after: AtlasRuntimeResourceSnapshot;
}): MainlineARepeatedLifecycleCycleV625 {
  const released = args.before.identityDigest === args.after.identityDigest
    && args.before.total === args.after.total
    && args.before.estimatedBytes === args.after.estimatedBytes;
  return Object.freeze({
    cycle: Math.max(0, Math.trunc(args.cycle)),
    before: args.before,
    after: args.after,
    released,
    status: released ? "baseline" : "drift",
  });
}

export function runMainlineAPerformanceBoundarySelfCheckV625(): Readonly<{ ok: boolean; receipt: MainlineAPerformanceReceiptV625 }> {
  const build = readMainlineAPerformanceBuildIdentityV625(null);
  const receipt = createPendingMainlineAPerformanceReceiptV625(build, new Date(0).toISOString());
  return Object.freeze({
    ok: receipt.boundary.candidateOnly && receipt.boundary.hold && receipt.boundary.notAdmitted && !receipt.boundary.scientificPayloadWriteback,
    receipt,
  });
}

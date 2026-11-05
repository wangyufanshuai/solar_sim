"use client";

import { getAtlasResourceSnapshot, type AtlasRuntimeResourceSnapshot } from "./atlasResourceLifecycle";
import { createMainlineAFrameClockV638, type MainlineAFrameClockV638 } from "./mainlineAFrameClockV638";
import {
  copyMainlineAResourceSnapshotV633,
  type MainlineAResourceCheckpointV633,
  type MainlineAResourceObservationV633,
} from "./mainlineAResourceObservationV633";
import {
  canonicalSelectionReadyV635, readCanonicalRuntimeSelectionV635, sameCanonicalTargetV635,
  validateCanonicalSnapshotV635, validateCanonicalTargetV635,
  type CanonicalRuntimeSnapshotV635, type CanonicalRuntimeTargetV635,
} from "./mainlineACanonicalRuntimeV635";

export const MAINLINE_A_LIFECYCLE_DURATIONS_V633 = [30_000, 1_800_000] as const;
export type MainlineALifecycleDurationV633 = (typeof MAINLINE_A_LIFECYCLE_DURATIONS_V633)[number];
export type MainlineALifecycleStateV633 = "running" | "finished" | "aborted";
type Build = MainlineAResourceObservationV633["build"];
type Viewport = MainlineAResourceObservationV633["viewport"];
type FrameSummary = MainlineAResourceObservationV633["frameSummary"];
export type MainlineALifecycleTimelineV633 = { elapsedMs: number; event: string; scene: string };
export type MainlineALifecycleObservationV633 = MainlineAResourceObservationV633 & {
  session: {
    state: "finished" | "aborted";
    requestedDurationMs: MainlineALifecycleDurationV633;
    durationSatisfied: boolean;
    issues: string[];
    physicalMobile: "not-run";
    frameSummarySource: "requestAnimationFrame";
    frameSummaryMethod: "fixed-histogram-upper-bound";
    histogramBinWidthMs: number;
    frameClock: MainlineAFrameClockV638;
    timeline: MainlineALifecycleTimelineV633[];
  };
};
export type MainlineALifecycleDependenciesV633 = {
  clock: () => number;
  isoNow: () => string;
  resources: () => AtlasRuntimeResourceSnapshot;
  scene: () => string;
  visible: () => boolean;
  heap: () => number | null;
  viewport: () => Viewport;
  build: () => Build;
  canonical: () => CanonicalRuntimeSnapshotV635;
};
export type MainlineALifecycleSnapshotV633 = {
  state: MainlineALifecycleStateV633;
  elapsedMs: number;
  remainingMs: number;
  frameCount: number;
  currentScene: string;
  baselineScene: string;
  activeCaptured: boolean;
  checkpointCount: number;
  issues: string[];
  timeline: MainlineALifecycleTimelineV633[];
  currentCanonical?: CanonicalRuntimeSnapshotV635;
};
export type MainlineALifecycleControllerV633 = {
  state: () => MainlineALifecycleStateV633;
  snapshot: () => MainlineALifecycleSnapshotV633;
  markActive: () => boolean;
  pushFrame: (atMs: number) => boolean;
  observeVisibility: () => void;
  observeBinding: () => void;
  finish: () => MainlineALifecycleObservationV633;
  abort: (reason?: string) => MainlineALifecycleObservationV633;
  observation: () => MainlineALifecycleObservationV633 | null;
};

const BIN_WIDTH_MS = 0.25;
const BIN_COUNT = 2048;
const MAX_TIMELINE = 64;
const MAX_RESOURCE_IDENTITIES = 4096;

export function createMainlineAFrameAccumulatorV633() {
  const histogram = new Float64Array(BIN_COUNT);
  let count = 0;
  let sum = 0;
  let minimum = Infinity;
  let maximum = 0;
  const percentile = (fraction: number): number => {
    if (count === 0) return 0;
    let seen = 0;
    const rank = Math.ceil(count * fraction);
    for (let index = 0; index < BIN_COUNT; index += 1) {
      seen += histogram[index];
      if (seen >= rank) return Math.min(maximum, index === BIN_COUNT - 1 ? maximum : (index + 1) * BIN_WIDTH_MS);
    }
    return maximum;
  };
  return {
    push(deltaMs: number): boolean {
      if (!Number.isFinite(deltaMs) || deltaMs <= 0 || count >= Number.MAX_SAFE_INTEGER) return false;
      histogram[Math.min(BIN_COUNT - 1, Math.floor(deltaMs / BIN_WIDTH_MS))] += 1;
      count += 1;
      sum += deltaMs;
      minimum = Math.min(minimum, deltaMs);
      maximum = Math.max(maximum, deltaMs);
      return true;
    },
    snapshot(): FrameSummary {
      return { sampleCount: count, totalMs: sum, minMs: count ? minimum : 0, p50Ms: percentile(0.5), p95Ms: percentile(0.95), maxMs: maximum };
    },
    capacity: BIN_COUNT,
  };
}

export function readMainlineALifecycleViewportV633(): Viewport {
  if (typeof window === "undefined") return { width: 0, height: 0, devicePixelRatio: 0, device: "desktop" };
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
    device: window.innerWidth < 768 ? "mobile-simulated" : "desktop",
  };
}

function browserBuild(): Build {
  const node = typeof document === "undefined" ? null : document.querySelector<HTMLElement>("[data-atlas-app-shell]");
  return {
    buildId: node?.dataset.mainlineBuildId ?? "unknown",
    branch: node?.dataset.mainlineBranch ?? "unknown",
    head: node?.dataset.mainlineHead ?? "unknown",
  };
}

function browserHeap(): number | null {
  if (typeof performance === "undefined") return null;
  const memory = (performance as Performance & { memory?: { usedJSHeapSize?: number } }).memory;
  const value = memory?.usedJSHeapSize;
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

export function createMainlineALifecycleSessionV633(args: {
  runId: string;
  build: Build;
  viewport: Viewport;
  durationMs: MainlineALifecycleDurationV633;
  mode?: "scene" | "canonical-object";
  canonicalTarget?: CanonicalRuntimeTargetV635;
  canonicalManifestDigest?: string;
  dependencies?: Partial<MainlineALifecycleDependenciesV633>;
}): MainlineALifecycleControllerV633 {
  if (!MAINLINE_A_LIFECYCLE_DURATIONS_V633.includes(args.durationMs)) throw new Error("unsupported-observation-duration");
  if (!args.runId.trim() || args.runId.length > 160) throw new Error("invalid-observation-run-id");
  const canonicalMode = args.mode === "canonical-object";
  if (args.mode !== undefined && args.mode !== "scene" && !canonicalMode) throw new Error("invalid-observation-mode");
  if (canonicalMode && (!validateCanonicalTargetV635(args.canonicalTarget) || !/^[a-f0-9]{64}$/.test(args.canonicalManifestDigest ?? ""))) throw new Error("canonical-observation-binding-required");
  const objectCycle = canonicalMode ? {
    mode: "canonical-object" as const, target: structuredClone(args.canonicalTarget!), manifestDigest: args.canonicalManifestDigest!,
  } : null;
  const dependencies: MainlineALifecycleDependenciesV633 = {
    clock: () => performance.now(),
    isoNow: () => new Date().toISOString(),
    resources: getAtlasResourceSnapshot,
    scene: () => typeof document === "undefined" ? "unknown" : document.querySelector<HTMLElement>("[data-atlas-app-shell]")?.dataset.atlasSceneModeV2 ?? "unknown",
    visible: () => typeof document !== "undefined" && document.visibilityState === "visible",
    heap: browserHeap,
    viewport: readMainlineALifecycleViewportV633,
    build: browserBuild,
    canonical: readCanonicalRuntimeSelectionV635,
    ...args.dependencies,
  };
  const build = { ...args.build };
  const viewport = { ...args.viewport };
  const startedAt = dependencies.isoNow();
  const startedMs = dependencies.clock();
  if (!Number.isFinite(startedMs)) throw new Error("invalid-observation-clock");
  const startedVisible = dependencies.visible();
  const beforeBytes = dependencies.heap();
  const frames = createMainlineAFrameAccumulatorV633();
  const frameClock = createMainlineAFrameClockV638(startedMs);
  const checkpoints: MainlineAResourceCheckpointV633[] = [];
  const issues = new Set<string>();
  const timeline: MainlineALifecycleTimelineV633[] = [];
  let state: MainlineALifecycleStateV633 = "running";
  let finalObservation: MainlineALifecycleObservationV633 | null = null;
  let lastClock = startedMs;
  let lastFrame: number | null = null;
  let interruptions = 0;
  let wasVisible = startedVisible;
  let endedElapsedMs: number | null = null;
  const elapsed = (receivedMs?: number): number => {
    if (endedElapsedMs !== null) return endedElapsedMs;
    const current = receivedMs ?? dependencies.clock();
    if (!Number.isFinite(current) || current < lastClock) issues.add("observation-clock-invalid");
    else lastClock = current;
    return Math.max(0, lastClock - startedMs);
  };
  const addEvent = (event: string): void => {
    if (timeline.length >= MAX_TIMELINE) {
      issues.add("timeline-capacity-exceeded");
      return;
    }
    timeline.push({ elapsedMs: elapsed(), event: event.slice(0, 160), scene: dependencies.scene().slice(0, 160) });
  };
  const checkBinding = (): void => {
    const nowBuild = dependencies.build();
    const nowViewport = dependencies.viewport();
    if (nowBuild.buildId !== build.buildId || nowBuild.branch !== build.branch || nowBuild.head !== build.head) issues.add("build-changed-during-observation");
    if (nowViewport.width !== viewport.width || nowViewport.height !== viewport.height || nowViewport.devicePixelRatio !== viewport.devicePixelRatio || nowViewport.device !== viewport.device) issues.add("viewport-changed-during-observation");
    if (canonicalMode) {
      const current = dependencies.canonical();
      if (current.cleanupErrors.length) issues.add("canonical-cleanup-failed");
      if (current.selection?.loading === "failed" || current.selection?.error) issues.add("canonical-runtime-load-failed");
    }
  };
  const checkpoint = (phase: MainlineAResourceCheckpointV633["phase"]): void => {
    checkBinding();
    const resources = dependencies.resources();
    if (Object.keys(resources.byIdentity).length > MAX_RESOURCE_IDENTITIES) throw new Error("resource-snapshot-capacity-exceeded");
    const capturedAt = dependencies.isoNow();
    const canonical = canonicalMode ? structuredClone(dependencies.canonical()) : undefined;
    if (canonical) for (const issue of validateCanonicalSnapshotV635(canonical, capturedAt)) issues.add(`${phase}:${issue}`);
    checkpoints.push({ phase, capturedAt, elapsedMs: phase === "baseline" ? 0 : elapsed(), scene: dependencies.scene(), snapshot: copyMainlineAResourceSnapshotV633(resources), ...(canonical ? { canonical } : {}) });
    addEvent(phase);
  };
  const observeVisibility = (): void => {
    if (state !== "running") return;
    const visible = dependencies.visible();
    if (wasVisible && !visible) interruptions += 1;
    if (!visible) issues.add("document-visibility-interrupted");
    if (wasVisible !== visible) addEvent(visible ? "visible" : "hidden");
    wasVisible = visible;
  };
  if (!startedVisible) issues.add("document-not-visible-at-start");
  if (viewport.device === "physical-mobile") issues.add("physical-mobile-not-attested");
  checkpoint("baseline");
  const finalize = (requestedState: "finished" | "aborted", reason?: string): MainlineALifecycleObservationV633 => {
    if (finalObservation) return structuredClone(finalObservation);
    observeVisibility();
    if (reason) issues.add(reason.slice(0, 160));
    if (requestedState === "aborted") issues.add("observation-aborted");
    if (!checkpoints.some((row) => row.phase === "active")) issues.add("active-checkpoint-missing");
    try { checkpoint("returned"); } catch (error) {
      issues.add(error instanceof Error ? error.message : "returned-checkpoint-failed");
    }
    const durationSatisfied = elapsed() >= args.durationMs;
    if (!durationSatisfied) issues.add("requested-duration-not-reached");
    if (!frames.snapshot().sampleCount) issues.add("frame-observation-empty");
    state = requestedState;
    endedElapsedMs = elapsed();
    addEvent(state);
    const afterBytes = dependencies.heap();
    const heapAvailable = beforeBytes !== null && afterBytes !== null;
    finalObservation = {
      schema: "mainline-a-resource-observation-v633",
      runId: args.runId,
      build,
      viewport,
      startedAt,
      endedAt: dependencies.isoNow(),
      checkpoints,
      frameSummary: frames.snapshot(),
      memory: { source: heapAvailable ? "performance.memory" : "unavailable", beforeBytes: heapAvailable ? beforeBytes : null, afterBytes: heapAvailable ? afterBytes : null },
      visibility: { startedVisible, endedVisible: dependencies.visible(), interruptions },
      boundary: { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false },
      ...(objectCycle ? { objectCycle } : {}),
      session: {
        state,
        requestedDurationMs: args.durationMs,
        durationSatisfied,
        issues: [...issues],
        physicalMobile: "not-run",
        frameSummarySource: "requestAnimationFrame",
        frameSummaryMethod: "fixed-histogram-upper-bound",
        histogramBinWidthMs: BIN_WIDTH_MS,
        frameClock: frameClock.snapshot(),
        timeline,
      },
    };
    return structuredClone(finalObservation);
  };
  return {
    state: () => state,
    snapshot: () => ({
      state,
      elapsedMs: elapsed(),
      remainingMs: Math.max(0, args.durationMs - elapsed()),
      frameCount: frames.snapshot().sampleCount,
      currentScene: dependencies.scene(),
      baselineScene: checkpoints[0]?.scene ?? "unknown",
      activeCaptured: checkpoints.some((row) => row.phase === "active"),
      checkpointCount: checkpoints.length,
      issues: [...issues],
      timeline: structuredClone(timeline),
      ...(canonicalMode ? { currentCanonical: structuredClone(dependencies.canonical()) } : {}),
    }),
    markActive: () => {
      if (state !== "running" || checkpoints.some((row) => row.phase === "active")) return false;
      observeVisibility();
      if (canonicalMode) {
        const current = dependencies.canonical();
        if (dependencies.scene() !== checkpoints[0].scene || !canonicalSelectionReadyV635(current.selection)
          || !sameCanonicalTargetV635(current.selection, objectCycle!.target)
          || sameCanonicalTargetV635(current.selection, checkpoints[0].canonical?.selection ?? null)
          || current.revision <= (checkpoints[0].canonical?.revision ?? 0)
          || Date.parse(current.publishedAt) <= Date.parse(checkpoints[0].capturedAt)
          || current.cleanupErrors.length > 0) return false;
      } else if (dependencies.scene() === checkpoints[0].scene) return false;
      try { checkpoint("active"); } catch (error) {
        issues.add(error instanceof Error ? error.message : "active-checkpoint-failed");
        return false;
      }
      return true;
    },
    pushFrame: (atMs) => {
      if (state !== "running") return false;
      const receivedMs = dependencies.clock();
      elapsed(receivedMs);
      observeVisibility();
      checkBinding();
      const accepted = frameClock.accept(atMs, receivedMs);
      if (accepted === "rejected") {
        issues.add("frame-timestamp-invalid");
        return false;
      }
      if (accepted === "before-window") return false;
      if (lastFrame !== null) frames.push(atMs - lastFrame);
      lastFrame = atMs;
      return true;
    },
    observeVisibility,
    observeBinding: () => { if (state === "running") checkBinding(); },
    finish: () => finalize("finished"),
    abort: (reason = "user-aborted") => finalize("aborted", reason),
    observation: () => finalObservation ? structuredClone(finalObservation) : null,
  };
}

export type MainlineALifecycleBrowserHostV633 = {
  requestAnimationFrame: (callback: FrameRequestCallback) => number;
  cancelAnimationFrame: (id: number) => void;
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
  document: {
    visibilityState: string;
    addEventListener: (type: string, listener: EventListener) => void;
    removeEventListener: (type: string, listener: EventListener) => void;
  };
};
const attachedObservers = new WeakMap<MainlineALifecycleControllerV633, () => void>();

export function attachMainlineALifecycleBrowserV633(
  controller: MainlineALifecycleControllerV633,
  options: {
    host?: MainlineALifecycleBrowserHostV633;
    onUpdate?: (snapshot: MainlineALifecycleSnapshotV633) => void;
    onFinished?: (observation: MainlineALifecycleObservationV633) => void;
  } = {},
): () => void {
  const previous = attachedObservers.get(controller);
  if (previous) return previous;
  if (controller.state() !== "running") return () => undefined;
  const host = options.host ?? (typeof window === "undefined" ? null : window);
  if (!host) {
    const observation = controller.abort("browser-host-unavailable");
    options.onFinished?.(observation);
    return () => undefined;
  }
  let frameId: number | null = null;
  let disposed = false;
  let lastPublished = -Infinity;
  const cleanup = (): void => {
    if (disposed) return;
    disposed = true;
    if (frameId !== null) host.cancelAnimationFrame(frameId);
    frameId = null;
    host.document.removeEventListener("visibilitychange", visibilityChanged);
    host.removeEventListener("pagehide", pageHidden);
    host.removeEventListener("resize", viewportChanged);
    attachedObservers.delete(controller);
    if (controller.state() === "running") {
      const observation = controller.abort("observer-detached");
      options.onFinished?.(observation);
    }
  };
  const stop = (reason: string): void => {
    const observation = controller.abort(reason);
    cleanup();
    options.onFinished?.(observation);
  };
  const visibilityChanged: EventListener = () => {
    controller.observeVisibility();
    if (host.document.visibilityState !== "visible") stop("document-hidden");
  };
  const pageHidden: EventListener = () => stop("page-hidden");
  const viewportChanged: EventListener = () => controller.observeBinding();
  const tick: FrameRequestCallback = (atMs) => {
    if (disposed) return;
    if (controller.state() !== "running") { cleanup(); return; }
    try {
      const accepted = controller.pushFrame(atMs);
      if (accepted && atMs - lastPublished >= 250) {
        lastPublished = atMs;
        options.onUpdate?.(controller.snapshot());
      }
      frameId = host.requestAnimationFrame(tick);
    } catch {
      stop("browser-observer-failed");
    }
  };
  attachedObservers.set(controller, cleanup);
  host.document.addEventListener("visibilitychange", visibilityChanged);
  host.addEventListener("pagehide", pageHidden);
  host.addEventListener("resize", viewportChanged);
  if (host.document.visibilityState !== "visible") stop("document-hidden-at-attach");
  else frameId = host.requestAnimationFrame(tick);
  return cleanup;
}

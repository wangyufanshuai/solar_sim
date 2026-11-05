"use client";

import {
  getAtlasResourceSnapshot,
  type AtlasRuntimeResourceSnapshot,
} from "./atlasResourceLifecycle";
import {
  ATLAS_V594_BUILD_IDENTITY,
  ATLAS_V594_FORMAL_PRODUCT_POINTER,
} from "./atlasV594BuildIdentity";

export const POST_V594_SAME_REALM_LIFECYCLE_QUERY = "v594-same-realm-v2" as const;
export const POST_V594_SAME_REALM_LIFECYCLE_VERSION = "v594-same-realm-scene-exit-v3" as const;
export const POST_V594_SAME_REALM_LIFECYCLE_LEDGER_KEY = "__atlasV594SameRealmSceneExitV3" as const;
export const POST_V594_SCENE_EXIT_RELEASE_CONTRACT_VERSION =
  "v594-observed-scene-exit-release-contract-v4" as const;
export const POST_V594_FORMAL_PRODUCT_POINTER = ATLAS_V594_FORMAL_PRODUCT_POINTER;
export const POST_V594_LIFECYCLE_SAMPLE_INTERVAL_MILLISECONDS = 100;
export const POST_V594_LIFECYCLE_STABLE_MILLISECONDS = 750;
/**
 * The observer ledger is an audit window, not an unbounded event log.  Keep
 * the most recently completed assignment and (while mounted) the current
 * active assignment; per-cycle samples already seal the older observations.
 */
export const POST_V594_SAME_REALM_LIFECYCLE_HISTORY_LIMIT = 2 as const;

const SHA256_PATTERN = /^[0-9a-f]{64}$/;

export const POST_V594_BUILD_IDENTITY = ATLAS_V594_BUILD_IDENTITY;

export type PostV594SameRealmLifecyclePhase =
  | "baseline-pending"
  | "baseline"
  | "mounting"
  | "mounted"
  | "profile-stable"
  | "replacing"
  | "replaced"
  | "detaching"
  | "detached-stable"
  | "resetting"
  | "exiting";

export type PostV594LifecycleSnapshot = Readonly<{
  capturedAt: string;
  captureKind: "no-canvas-baseline" | "mounted-renderer" | "unmounted-renderer";
  canvas: Readonly<{
    count: number | null;
    connected: number | null;
  }>;
  renderer: Readonly<{
    active: number | null;
    textures: number | null;
    geometries: number | null;
    programs: number | null;
    resourceCountsSource:
      | "three.webglrenderer.info"
      | "unavailable-no-renderer"
      | "unavailable-context-lost-stale-info"
      | null;
    renderTargets: number | null;
    renderTargetsSource: "atlas-resource-registry.gpuRenderTargets" | "unavailable";
  }>;
  registry: Readonly<{
    total: number | null;
    workers: number | null;
    renderTargets: number | null;
    textures: number | null;
    subscriptions: number | null;
    typedArrays: number | null;
    estimatedBytes: number | null;
  }>;
  scene: Readonly<{
    active: number | null;
    objects: number | null;
    candidateNodes: number | null;
    stellarHeroIds: readonly string[] | null;
    stellarArchetypes: readonly string[] | null;
    stellarContractSha256s: readonly string[] | null;
  }>;
}>;

export type PostV594LifecycleExitObservation = Readonly<{
  observerAssignment: number;
  renderListsDisposed?: true;
  forceContextLossCalled?: true;
  contextLost?: true;
  contextLossSource?: "webglcontextlost-event" | "isContextLost";
  canvasDetached?: true;
  resourceReferencesReleased?: true;
  routeAfter?: string;
  observerReleased?: true;
}>;

export type PostV594LifecycleTeardownObservation = Readonly<{
  renderListsDisposed: true | null;
  forceContextLossCalled: true | null;
  contextLost: true | null;
  contextLossSource: "webglcontextlost-event" | "isContextLost" | null;
  canvasDetached: true | null;
  resourceReferencesReleased: true | null;
  routeAfter: string | null;
  observerReleased: true | null;
}>;

export type PostV594LifecycleObserverHistoryEntry = Readonly<{
  assignment: number;
  teardown: PostV594LifecycleTeardownObservation;
}>;

/**
 * A renderer teardown has two observable edges: the detached-stable sample
 * proves the renderer references were cut, and a later controller callback
 * proves that the observer itself was released.  Keep those edges separate
 * so a serialized detached sample can never be overwritten by the later
 * release completion.
 */
export type PostV594LifecycleReleaseCompletion = Readonly<{
  transition: "same-realm-repeat" | "next-link-route-exit";
  observedAfterPhase: "baseline" | "exited";
  teardown: PostV594LifecycleTeardownObservation;
}>;

export type PostV594SameRealmLifecycleLedger = Readonly<{
  version: typeof POST_V594_SAME_REALM_LIFECYCLE_VERSION;
  realmToken: string;
  timeOrigin: number;
  phase: PostV594SameRealmLifecyclePhase;
  identity: typeof POST_V594_BUILD_IDENTITY;
  snapshots: Readonly<{
    baseline: PostV594LifecycleSnapshot | null;
    mounted: PostV594LifecycleSnapshot | null;
    detached: PostV594LifecycleSnapshot | null;
    exited: PostV594LifecycleSnapshot | null;
  }>;
  observer: Readonly<{
    nextAssignment: number;
    activeAssignment: number | null;
    history: readonly PostV594LifecycleObserverHistoryEntry[];
  }>;
  exit: PostV594LifecycleTeardownObservation;
  releaseCompletion: PostV594LifecycleReleaseCompletion | null;
}>;

declare global {
  interface Window {
    __atlasV594SameRealmSceneExitV3?: PostV594SameRealmLifecycleLedger;
  }
}

export type PostV594RendererSnapshotInput = Readonly<{
  capturedAt?: string;
  captureKind: PostV594LifecycleSnapshot["captureKind"];
  canvasCount: unknown;
  connectedCanvasCount: unknown;
  rendererActive: unknown;
  rendererTextures: unknown;
  rendererGeometries: unknown;
  rendererPrograms: unknown;
  rendererResourceCountsSource: unknown;
  registry: AtlasRuntimeResourceSnapshot | null;
  sceneActive: unknown;
  sceneObjects: unknown;
  candidateNodes: unknown;
  stellarHeroIds?: unknown;
  stellarArchetypes?: unknown;
  stellarContractSha256s?: unknown;
}>;

export function finitePostV594Measurement(value: unknown): number | null {
  return typeof value === "number"
    && Number.isFinite(value)
    && Number.isInteger(value)
    && value >= 0
    ? value
    : null;
}

function observedPostV594Strings(value: unknown): readonly string[] | null {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string" || !entry.trim())) {
    return null;
  }
  return Object.freeze([...new Set(value.map((entry) => entry.trim()))].sort());
}

function observedPostV594RendererResourceCountsSource(
  value: unknown,
): PostV594LifecycleSnapshot["renderer"]["resourceCountsSource"] {
  return new Set([
    "three.webglrenderer.info",
    "unavailable-no-renderer",
    "unavailable-context-lost-stale-info",
  ]).has(String(value))
    ? value as Exclude<
        PostV594LifecycleSnapshot["renderer"]["resourceCountsSource"],
        null
      >
    : null;
}

export function readPostV594ResourceSnapshot(): AtlasRuntimeResourceSnapshot | null {
  try {
    return getAtlasResourceSnapshot();
  } catch {
    return null;
  }
}

export function createPostV594RendererSnapshot(
  input: PostV594RendererSnapshotInput,
): PostV594LifecycleSnapshot {
  const renderTargets = finitePostV594Measurement(input.registry?.gpuRenderTargets);
  return Object.freeze({
    capturedAt: input.capturedAt ?? new Date().toISOString(),
    captureKind: input.captureKind,
    canvas: Object.freeze({
      count: finitePostV594Measurement(input.canvasCount),
      connected: finitePostV594Measurement(input.connectedCanvasCount),
    }),
    renderer: Object.freeze({
      active: finitePostV594Measurement(input.rendererActive),
      textures: finitePostV594Measurement(input.rendererTextures),
      geometries: finitePostV594Measurement(input.rendererGeometries),
      programs: finitePostV594Measurement(input.rendererPrograms),
      resourceCountsSource: observedPostV594RendererResourceCountsSource(
        input.rendererResourceCountsSource,
      ),
      renderTargets,
      renderTargetsSource: renderTargets === null
        ? "unavailable"
        : "atlas-resource-registry.gpuRenderTargets",
    }),
    registry: Object.freeze({
      total: finitePostV594Measurement(input.registry?.total),
      workers: finitePostV594Measurement(input.registry?.workers),
      renderTargets,
      textures: finitePostV594Measurement(input.registry?.textures),
      subscriptions: finitePostV594Measurement(input.registry?.subscriptions),
      typedArrays: finitePostV594Measurement(input.registry?.typedArrayCaches),
      estimatedBytes: finitePostV594Measurement(input.registry?.estimatedBytes),
    }),
    scene: Object.freeze({
      active: finitePostV594Measurement(input.sceneActive),
      objects: finitePostV594Measurement(input.sceneObjects),
      candidateNodes: finitePostV594Measurement(input.candidateNodes),
      stellarHeroIds: observedPostV594Strings(input.stellarHeroIds),
      stellarArchetypes: observedPostV594Strings(input.stellarArchetypes),
      stellarContractSha256s: observedPostV594Strings(input.stellarContractSha256s),
    }),
  });
}

export function createPostV594NoCanvasSnapshot({
  canvasCount,
  connectedCanvasCount,
  registry = readPostV594ResourceSnapshot(),
  capturedAt,
}: Readonly<{
  canvasCount: unknown;
  connectedCanvasCount: unknown;
  registry?: AtlasRuntimeResourceSnapshot | null;
  capturedAt?: string;
}>): PostV594LifecycleSnapshot {
  return createPostV594RendererSnapshot({
    capturedAt,
    captureKind: "no-canvas-baseline",
    canvasCount,
    connectedCanvasCount,
    // A missing DOM canvas does not observe a renderer or scene. Those
    // measurements remain unknown instead of being synthesized as zero.
    rendererActive: null,
    rendererTextures: null,
    rendererGeometries: null,
    rendererPrograms: null,
    rendererResourceCountsSource: "unavailable-no-renderer",
    registry,
    sceneActive: null,
    sceneObjects: null,
    candidateNodes: null,
    stellarHeroIds: null,
    stellarArchetypes: null,
    stellarContractSha256s: null,
  });
}

const POST_V594_REGISTRY_MEASUREMENTS = (
  snapshot: PostV594LifecycleSnapshot,
): readonly (number | null)[] => Object.freeze([
  snapshot.registry.total,
  snapshot.registry.workers,
  snapshot.registry.renderTargets,
  snapshot.registry.textures,
  snapshot.registry.subscriptions,
  snapshot.registry.typedArrays,
  snapshot.registry.estimatedBytes,
]);

export function postV594BaselineSnapshotIsObserved(
  snapshot: PostV594LifecycleSnapshot,
): boolean {
  return snapshot.captureKind === "no-canvas-baseline"
    && snapshot.canvas.count === 0
    && snapshot.canvas.connected === 0
    && snapshot.renderer.active === null
    && snapshot.renderer.textures === null
    && snapshot.renderer.geometries === null
    && snapshot.renderer.programs === null
    && snapshot.renderer.resourceCountsSource === "unavailable-no-renderer"
    && snapshot.scene.active === null
    && snapshot.scene.objects === null
    && snapshot.scene.candidateNodes === null
    && snapshot.scene.stellarHeroIds === null
    && snapshot.scene.stellarArchetypes === null
    && snapshot.scene.stellarContractSha256s === null
    && POST_V594_REGISTRY_MEASUREMENTS(snapshot).every(
      (value) => value !== null && value === 0,
    );
}

export function postV594SnapshotMeasurements(
  snapshot: PostV594LifecycleSnapshot,
): readonly (number | null)[] {
  return Object.freeze([
    snapshot.canvas.count,
    snapshot.canvas.connected,
    snapshot.renderer.active,
    snapshot.renderer.textures,
    snapshot.renderer.geometries,
    snapshot.renderer.programs,
    snapshot.renderer.renderTargets,
    snapshot.registry.total,
    snapshot.registry.workers,
    snapshot.registry.renderTargets,
    snapshot.registry.textures,
    snapshot.registry.subscriptions,
    snapshot.registry.typedArrays,
    snapshot.registry.estimatedBytes,
    snapshot.scene.active,
    snapshot.scene.objects,
    snapshot.scene.candidateNodes,
  ]);
}

export function postV594SnapshotSatisfiesReleaseContract(
  snapshot: PostV594LifecycleSnapshot,
): boolean {
  return snapshot.captureKind === "unmounted-renderer"
    && snapshot.renderer.textures === null
    && snapshot.renderer.geometries === null
    && snapshot.renderer.programs === null
    && snapshot.renderer.resourceCountsSource === "unavailable-context-lost-stale-info"
    && [
      snapshot.canvas.count,
      snapshot.canvas.connected,
      snapshot.renderer.active,
      snapshot.renderer.renderTargets,
      snapshot.registry.total,
      snapshot.registry.workers,
      snapshot.registry.renderTargets,
      snapshot.registry.textures,
      snapshot.registry.subscriptions,
      snapshot.registry.typedArrays,
      snapshot.registry.estimatedBytes,
      snapshot.scene.active,
      snapshot.scene.objects,
      snapshot.scene.candidateNodes,
    ].every(
    (value) => value !== null && Number.isFinite(value) && value === 0,
    )
    && snapshot.scene.stellarHeroIds?.length === 0
    && snapshot.scene.stellarArchetypes?.length === 0
    && snapshot.scene.stellarContractSha256s?.length === 0;
}

export function postV594MountedSnapshotIsActive(
  snapshot: PostV594LifecycleSnapshot,
): boolean {
  const measurementsKnown = postV594SnapshotMeasurements(snapshot).every(
    (value) => value !== null && Number.isFinite(value),
  );
  const rendererHasResources = [
    snapshot.renderer.textures,
    snapshot.renderer.geometries,
    snapshot.renderer.programs,
  ].some((value) => value !== null && value > 0);
  return measurementsKnown
    && snapshot.captureKind === "mounted-renderer"
    && snapshot.renderer.resourceCountsSource === "three.webglrenderer.info"
    && snapshot.canvas.count === 1
    && snapshot.canvas.connected === 1
    && snapshot.renderer.active === 1
    && rendererHasResources
    && snapshot.registry.total !== null
    && snapshot.registry.total > 0
    && snapshot.scene.active === 1
    && snapshot.scene.objects !== null
    && snapshot.scene.objects > 0
    && snapshot.scene.candidateNodes !== null
    && snapshot.scene.candidateNodes > 0
    && snapshot.scene.stellarHeroIds?.length === 1
    && snapshot.scene.stellarArchetypes?.length === 1
    && snapshot.scene.stellarContractSha256s?.length === 1
    && SHA256_PATTERN.test(snapshot.scene.stellarContractSha256s[0] ?? "");
}

export function postV594ExitObservationIsComplete(
  exit: PostV594SameRealmLifecycleLedger["exit"],
  expectedRoute = "/downloads",
): boolean {
  return postV594TeardownObservationIsComplete(exit)
    && exit.routeAfter === expectedRoute;
}

export function postV594TeardownObservationIsComplete(
  teardown: PostV594LifecycleTeardownObservation,
): boolean {
  return teardown.renderListsDisposed === true
    && teardown.forceContextLossCalled === true
    && teardown.contextLost === true
    && (teardown.contextLossSource === "webglcontextlost-event"
      || teardown.contextLossSource === "isContextLost")
    && teardown.canvasDetached === true
    && teardown.resourceReferencesReleased === true
    && typeof teardown.routeAfter === "string"
    && teardown.observerReleased === true;
}

export function postV594ReleaseCompletionIsComplete(
  completion: PostV594LifecycleReleaseCompletion | null | undefined,
  transition?: PostV594LifecycleReleaseCompletion["transition"],
  observedAfterPhase?: PostV594LifecycleReleaseCompletion["observedAfterPhase"],
  expectedRoute?: string,
): completion is PostV594LifecycleReleaseCompletion {
  return !!completion
    && (transition === undefined || completion.transition === transition)
    && (observedAfterPhase === undefined || completion.observedAfterPhase === observedAfterPhase)
    && postV594TeardownObservationIsComplete(completion.teardown)
    && (expectedRoute === undefined || completion.teardown.routeAfter === expectedRoute);
}

export function postV594LifecycleSnapshotStabilityKey(
  snapshot: PostV594LifecycleSnapshot,
): string {
  return JSON.stringify({
    captureKind: snapshot.captureKind,
    canvas: snapshot.canvas,
    renderer: snapshot.renderer,
    registry: snapshot.registry,
    scene: snapshot.scene,
  });
}

export function isPostV594SameRealmLifecycleAuditSearch(search: string): boolean {
  const values = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
    .getAll("lifecycleAudit");
  return values.length === 1 && values[0] === POST_V594_SAME_REALM_LIFECYCLE_QUERY;
}

export function resolvePostV594SameRealmLifecycleAudit(): boolean {
  return typeof window !== "undefined"
    && isPostV594SameRealmLifecycleAuditSearch(window.location.search);
}

function replacePostV594Ledger(
  update: (current: PostV594SameRealmLifecycleLedger) => PostV594SameRealmLifecycleLedger,
): PostV594SameRealmLifecycleLedger | null {
  if (typeof window === "undefined") return null;
  const current = window[POST_V594_SAME_REALM_LIFECYCLE_LEDGER_KEY];
  if (!current) return null;
  const next = update(current);
  window[POST_V594_SAME_REALM_LIFECYCLE_LEDGER_KEY] = next;
  return next;
}

function emptyPostV594TeardownObservation(): PostV594LifecycleTeardownObservation {
  return Object.freeze({
    renderListsDisposed: null,
    forceContextLossCalled: null,
    contextLost: null,
    contextLossSource: null,
    canvasDetached: null,
    resourceReferencesReleased: null,
    routeAfter: null,
    observerReleased: null,
  });
}

function createPostV594ReleaseCompletion(
  current: PostV594SameRealmLifecycleLedger,
  teardown: PostV594LifecycleTeardownObservation,
): PostV594LifecycleReleaseCompletion {
  if (current.phase === "resetting") {
    if (teardown.routeAfter !== "/") {
      throw new Error("v594-lifecycle-repeat-release-route");
    }
    return Object.freeze({
      transition: "same-realm-repeat",
      observedAfterPhase: "baseline",
      teardown,
    });
  }
  if (current.phase === "exiting") {
    if (teardown.routeAfter !== "/downloads") {
      throw new Error("v594-lifecycle-route-exit-release-route");
    }
    return Object.freeze({
      transition: "next-link-route-exit",
      observedAfterPhase: "exited",
      teardown,
    });
  }
  throw new Error("v594-lifecycle-release-completion-phase");
}

function carryPostV594ReleaseCompletionIntoBaseline(
  previous: PostV594SameRealmLifecycleLedger | null,
): PostV594LifecycleReleaseCompletion | null {
  if (!previous || previous.phase !== "resetting") return null;
  if (previous.exit.observerReleased !== true) {
    throw new Error("v594-lifecycle-baseline-before-release-completion");
  }
  return createPostV594ReleaseCompletion(previous, previous.exit);
}

/**
 * Retain only the audit window that can still be consumed by the live
 * same-realm runner.  A baseline (or a released ledger) has no active
 * observer, so it retains the last completed entry.  While a renderer is
 * active, retain that entry plus the current assignment.
 *
 * This is deliberately a suffix operation: assignment numbers are never
 * renumbered or reset, and the sealed per-cycle samples remain the source of
 * older history.
 */
function assertPostV594ObserverHistoryState(
  history: readonly PostV594LifecycleObserverHistoryEntry[],
  nextAssignment: number,
  activeAssignment: number | null,
): void {
  if (!Number.isInteger(nextAssignment) || nextAssignment <= 0) {
    throw new Error("v594-lifecycle-observer-next-assignment-invalid");
  }
  if (history.length === 0) {
    if (nextAssignment !== 1 || activeAssignment !== null) {
      throw new Error("v594-lifecycle-observer-history-next-assignment-drift");
    }
    return;
  }
  if (history.some((entry) => !Number.isInteger(entry.assignment) || entry.assignment <= 0)) {
    throw new Error("v594-lifecycle-observer-history-assignment-invalid");
  }
  for (let index = 1; index < history.length; index += 1) {
    if (history[index].assignment !== history[index - 1].assignment + 1) {
      throw new Error("v594-lifecycle-observer-history-sequence-invalid");
    }
  }
  const latestAssignment = history.at(-1)?.assignment;
  if (latestAssignment !== nextAssignment - 1) {
    throw new Error("v594-lifecycle-observer-history-next-assignment-drift");
  }
  if (activeAssignment === null) {
    if (history.some((entry) => !postV594TeardownObservationIsComplete(entry.teardown))) {
      throw new Error("v594-lifecycle-observer-released-history-incomplete");
    }
    return;
  }
  if (!Number.isInteger(activeAssignment)
    || activeAssignment <= 0
    || activeAssignment !== latestAssignment
    || history.filter((entry) => entry.assignment === activeAssignment).length !== 1) {
    throw new Error("v594-lifecycle-observer-history-active-not-last");
  }
  if (history.slice(0, -1).some(
    (entry) => !postV594TeardownObservationIsComplete(entry.teardown),
  )) {
    throw new Error("v594-lifecycle-observer-prior-history-incomplete");
  }
}

function prunePostV594ObserverHistory(
  history: readonly PostV594LifecycleObserverHistoryEntry[],
  nextAssignment: number,
  activeAssignment: number | null,
): readonly PostV594LifecycleObserverHistoryEntry[] {
  assertPostV594ObserverHistoryState(history, nextAssignment, activeAssignment);
  const limit = activeAssignment === null
    ? 1
    : POST_V594_SAME_REALM_LIFECYCLE_HISTORY_LIMIT;
  const retained = history.slice(-limit);
  assertPostV594ObserverHistoryState(retained, nextAssignment, activeAssignment);
  return Object.freeze(retained);
}

function postV594ObserverHistoryWithCompletedSuffix(
  history: readonly PostV594LifecycleObserverHistoryEntry[],
  nextAssignment: number,
): readonly PostV594LifecycleObserverHistoryEntry[] {
  return prunePostV594ObserverHistory(history, nextAssignment, null);
}

export function beginPostV594SameRealmLifecycleLedger(): PostV594SameRealmLifecycleLedger {
  if (typeof window === "undefined") throw new Error("v594-same-realm-ledger-browser-only");
  const previous = window[POST_V594_SAME_REALM_LIFECYCLE_LEDGER_KEY];
  const timeOrigin = performance.timeOrigin;
  const realmToken = previous?.version === POST_V594_SAME_REALM_LIFECYCLE_VERSION
    && previous.timeOrigin === timeOrigin
    ? previous.realmToken
    : globalThis.crypto?.randomUUID?.()
      ?? `realm-${timeOrigin}-${performance.now()}`;
  const sameRealmPrevious = previous?.version === POST_V594_SAME_REALM_LIFECYCLE_VERSION
    && previous.timeOrigin === timeOrigin
    ? previous
    : null;
  const nextAssignment = sameRealmPrevious?.observer.nextAssignment ?? 1;
  const previousHistory = sameRealmPrevious?.observer.history ?? [];
  const previousActiveAssignment = sameRealmPrevious?.observer.activeAssignment ?? null;
  assertPostV594ObserverHistoryState(
    previousHistory,
    nextAssignment,
    previousActiveAssignment,
  );
  if (sameRealmPrevious && sameRealmPrevious.observer.activeAssignment !== null) {
    const active = sameRealmPrevious.observer.history.find(
      (entry) => entry.assignment === sameRealmPrevious.observer.activeAssignment,
    );
    if (!active
      || active !== sameRealmPrevious.observer.history.at(-1)
      || active.assignment !== sameRealmPrevious.observer.nextAssignment - 1
      || !postV594TeardownObservationIsComplete(active.teardown)) {
      throw new Error("v594-lifecycle-observer-reset-before-complete-teardown");
    }
  }
  const history = postV594ObserverHistoryWithCompletedSuffix(
    previousHistory,
    nextAssignment,
  );
  const ledger: PostV594SameRealmLifecycleLedger = Object.freeze({
    version: POST_V594_SAME_REALM_LIFECYCLE_VERSION,
    realmToken,
    timeOrigin,
    phase: "baseline-pending",
    identity: POST_V594_BUILD_IDENTITY,
    snapshots: Object.freeze({
      baseline: null,
      mounted: null,
      detached: null,
      exited: null,
    }),
    observer: Object.freeze({
      nextAssignment,
      activeAssignment: null,
      history,
    }),
    exit: emptyPostV594TeardownObservation(),
    releaseCompletion: carryPostV594ReleaseCompletionIntoBaseline(sameRealmPrevious),
  });
  window[POST_V594_SAME_REALM_LIFECYCLE_LEDGER_KEY] = ledger;
  return ledger;
}

export function assignPostV594LifecycleObserver(): number {
  let assignment: number | null = null;
  const ledger = replacePostV594Ledger((current) => {
    if (current.observer.activeAssignment !== null) {
      throw new Error("v594-lifecycle-observer-already-active");
    }
    assignment = current.observer.nextAssignment;
    if (!Number.isInteger(assignment) || assignment <= 0) {
      throw new Error("v594-lifecycle-observer-next-assignment-invalid");
    }
    const completedHistory = postV594ObserverHistoryWithCompletedSuffix(
      current.observer.history,
      assignment,
    );
    if ((assignment === 1 && completedHistory.length !== 0)
      || (assignment > 1 && completedHistory.at(-1)?.assignment !== assignment - 1)) {
      throw new Error("v594-lifecycle-observer-history-next-assignment-drift");
    }
    const entry: PostV594LifecycleObserverHistoryEntry = Object.freeze({
      assignment,
      teardown: emptyPostV594TeardownObservation(),
    });
    const history = prunePostV594ObserverHistory(
      [...completedHistory, entry],
      assignment + 1,
      assignment,
    );
    return Object.freeze({
      ...current,
      observer: Object.freeze({
        nextAssignment: assignment + 1,
        activeAssignment: assignment,
        history,
      }),
      exit: entry.teardown,
    });
  });
  if (!ledger || assignment === null) {
    throw new Error("v594-lifecycle-observer-assignment-unavailable");
  }
  return assignment;
}

export function recordPostV594LifecyclePhase(
  phase: PostV594SameRealmLifecyclePhase,
): PostV594SameRealmLifecycleLedger | null {
  return replacePostV594Ledger((current) => Object.freeze({ ...current, phase }));
}

export function recordPostV594LifecycleSnapshot(
  phase: "baseline" | "mounted" | "detached-stable" | "exited",
  snapshot: PostV594LifecycleSnapshot,
): PostV594SameRealmLifecycleLedger | null {
  const key = phase === "detached-stable" ? "detached" : phase;
  return replacePostV594Ledger((current) => {
    if (phase === "exited") {
      if (current.snapshots.detached === null) {
        throw new Error("v594-lifecycle-exited-snapshot-before-detached");
      }
      if (snapshot !== current.snapshots.detached) {
        throw new Error("v594-lifecycle-exited-snapshot-must-reuse-detached-reference");
      }
    }
    return Object.freeze({
      ...current,
      phase: phase === "exited" ? current.phase : phase,
      snapshots: Object.freeze({ ...current.snapshots, [key]: snapshot }),
    });
  });
}

export function recordPostV594LifecycleExitObservation(
  observation: PostV594LifecycleExitObservation,
): PostV594SameRealmLifecycleLedger | null {
  return replacePostV594Ledger((current) => {
    const { observerAssignment, ...patch } = observation;
    if (!Number.isInteger(observerAssignment) || observerAssignment <= 0) {
      throw new Error("v594-lifecycle-observer-assignment-invalid");
    }
    assertPostV594ObserverHistoryState(
      current.observer.history,
      current.observer.nextAssignment,
      current.observer.activeAssignment,
    );
    if (current.observer.activeAssignment !== observerAssignment) {
      throw new Error("v594-lifecycle-observer-assignment-not-active");
    }
    const entryIndex = current.observer.history.findIndex(
      (entry) => entry.assignment === observerAssignment,
    );
    if (entryIndex < 0) {
      throw new Error("v594-lifecycle-observer-assignment-unknown");
    }
    const entry = current.observer.history[entryIndex];
    const teardown = Object.freeze({ ...entry.teardown, ...patch });
    const history = [...current.observer.history];
    history[entryIndex] = Object.freeze({ ...entry, teardown });
    if (patch.observerReleased === true
      && !postV594TeardownObservationIsComplete(teardown)) {
      throw new Error("v594-lifecycle-observer-release-before-complete-teardown");
    }
    const activeAssignment = patch.observerReleased === true
      ? null
      : current.observer.activeAssignment;
    const releaseCompletion = patch.observerReleased === true
      ? createPostV594ReleaseCompletion(current, teardown)
      : current.releaseCompletion;
    return Object.freeze({
      ...current,
      observer: Object.freeze({
        ...current.observer,
        activeAssignment,
        history: prunePostV594ObserverHistory(
          history,
          current.observer.nextAssignment,
          activeAssignment,
        ),
      }),
      exit: teardown,
      releaseCompletion,
    });
  });
}

export function getPostV594SameRealmLifecycleLedger(): PostV594SameRealmLifecycleLedger | null {
  return typeof window === "undefined"
    ? null
    : window[POST_V594_SAME_REALM_LIFECYCLE_LEDGER_KEY] ?? null;
}

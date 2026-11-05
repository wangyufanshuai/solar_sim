import { afterEach, describe, expect, it, vi } from "vitest";
import { acquireAtlasResource, getAtlasResourceSnapshot } from "./atlasResourceLifecycle";
import { evaluateMainlineAResourceObservationV633 } from "./mainlineAResourceObservationV633";
import {
  CANONICAL_COVERAGE_SHA256_V635, createCanonicalRuntimeRegistryV635,
  type CanonicalRuntimeSelectionV635,
} from "./mainlineACanonicalRuntimeV635";
import {
  attachMainlineALifecycleBrowserV633,
  createMainlineAFrameAccumulatorV633,
  createMainlineALifecycleSessionV633,
  type MainlineALifecycleBrowserHostV633,
  type MainlineALifecycleDurationV633,
} from "./mainlineALifecycleSessionV633";

const cleanup: (() => void)[] = [];
afterEach(() => { cleanup.splice(0).reverse().forEach((release) => release()); });
function fixture(durationMs: MainlineALifecycleDurationV633 = 30_000, startMs = 0) {
  let now = startMs;
  let scene = "atlas";
  let visible = true;
  let heap = 200;
  const build = { buildId: "mainline-a-test-runtime", branch: "codex/solar-sim-mainline-a", head: "a".repeat(40) };
  const viewport = { width: 1280, height: 720, devicePixelRatio: 1, device: "desktop" as const };
  const baselineRelease = acquireAtlasResource("subscription", "atlas", "session-test-baseline", { owner: "session-test", estimatedBytes: 32 });
  cleanup.push(baselineRelease);
  const session = createMainlineALifecycleSessionV633({
    runId: "session-fixture-for-testing-only",
    build,
    viewport,
    durationMs,
    dependencies: {
      clock: () => now,
      isoNow: () => new Date(Date.UTC(2026, 8, 27) + now).toISOString(),
      resources: getAtlasResourceSnapshot,
      scene: () => scene,
      visible: () => visible,
      heap: () => heap,
      build: () => build,
      viewport: () => viewport,
    },
  });
  const frame = (time: number): void => { now = time; session.pushFrame(time); };
  const activate = (): (() => void) => {
    now = startMs + 1000;
    scene = "inspect";
    const release = acquireAtlasResource("texture", "inspect", "test-texture", { owner: "session-test", estimatedBytes: 1024 });
    cleanup.push(release);
    expect(session.markActive()).toBe(true);
    return release;
  };
  const finish = () => {
    scene = "atlas";
    now = startMs + durationMs;
    heap = 208;
    return session.finish();
  };
  return { session, frame, activate, finish, build, viewport,
    time: (value: number) => { now = value; },
    scene: (value: string) => { scene = value; },
    visible: (value: boolean) => { visible = value; },
  };
}

describe("bounded frame accumulator", () => {
  it("keeps constant storage through a thirty minute sample stream", () => {
    const frames = createMainlineAFrameAccumulatorV633();
    for (let index = 0; index < 108_000; index += 1) frames.push(1000 / 60);
    expect(frames.capacity).toBe(2048);
    const result = frames.snapshot();
    expect(result.sampleCount).toBe(108_000);
    expect(result.totalMs).toBeCloseTo(1_800_000, 4);
    expect(result.p95Ms).toBeGreaterThanOrEqual(result.minMs);
    expect(result.p95Ms).toBeLessThanOrEqual(result.maxMs);
  });
  it("keeps tail stalls and labels quantiles as bounded estimates", () => {
    const frames = createMainlineAFrameAccumulatorV633();
    for (let index = 0; index < 95; index += 1) frames.push(16.1);
    for (let index = 0; index < 5; index += 1) frames.push(5000);
    expect(frames.snapshot()).toMatchObject({ sampleCount: 100, p50Ms: 16.25, p95Ms: 16.25, maxMs: 5000 });
    expect(frames.push(NaN)).toBe(false);
    expect(frames.push(-1)).toBe(false);
    expect(frames.push(0)).toBe(false);
  });
});

describe("real resource observation session", () => {
  it("observes acquisition then release while preserving nonempty baseline", () => {
    const run = fixture();
    run.frame(0);
    run.frame(16);
    const release = run.activate();
    release();
    run.frame(30_000);
    const observation = run.finish();
    expect(observation.checkpoints).toHaveLength(3);
    expect(observation.checkpoints[0].snapshot.total).toBeGreaterThan(0);
    expect(observation.session).toMatchObject({ state: "finished", durationSatisfied: true, issues: [], physicalMobile: "not-run", frameSummarySource: "requestAnimationFrame" });
    expect(evaluateMainlineAResourceObservationV633(observation)).toMatchObject({ status: "measured-local", acquiredCount: 1, releasedCount: 1, baselineRestored: true, scientificPayloadWriteback: false });
    expect(observation.boundary.scientificPayloadWriteback).toBe(false);
  });
  it("does not let unchanged scene supply an active checkpoint", () => {
    const run = fixture();
    expect(run.session.markActive()).toBe(false);
    expect(run.session.snapshot().checkpointCount).toBe(1);
    const result = run.finish();
    expect(result.session.issues).toContain("active-checkpoint-missing");
    expect(evaluateMainlineAResourceObservationV633(result).status).toBe("blocked");
  });
  it("does not turn identical resource snapshots into a release claim", () => {
    const run = fixture();
    run.time(1000);
    run.scene("inspect");
    expect(run.session.markActive()).toBe(true);
    run.frame(1000);
    run.frame(30_000);
    expect(evaluateMainlineAResourceObservationV633(run.finish()).status).toBe("blocked");
  });
  it("preserves retained resources as a blocked return", () => {
    const run = fixture();
    run.frame(0);
    run.activate();
    run.frame(30_000);
    const result = evaluateMainlineAResourceObservationV633(run.finish());
    expect(result.status).toBe("blocked");
    expect(result.baselineRestored).toBe(false);
  });
  it("cannot qualify a thirty minute session using a thirty second finish", () => {
    const run = fixture(1_800_000);
    run.frame(0);
    run.activate()();
    run.scene("atlas");
    run.frame(30_000);
    const result = run.session.finish();
    expect(result.session.durationSatisfied).toBe(false);
    expect(result.session.issues).toContain("requested-duration-not-reached");
    expect(evaluateMainlineAResourceObservationV633(result).status).toBe("blocked");
  });
  it("captures visibility interruptions even after foreground return", () => {
    const run = fixture();
    run.visible(false);
    run.session.observeVisibility();
    run.visible(true);
    run.session.observeVisibility();
    run.activate()();
    const result = run.finish();
    expect(result.visibility.interruptions).toBe(1);
    expect(result.session.issues).toContain("document-visibility-interrupted");
    expect(evaluateMainlineAResourceObservationV633(result).status).toBe("blocked");
  });
  it("copies captured resources and output objects so callers cannot rewrite history", () => {
    const run = fixture();
    run.frame(0);
    run.activate()();
    run.frame(30_000);
    const result = run.finish();
    result.checkpoints[0].snapshot.total = 9999;
    result.session.issues.push("changed-by-caller");
    const stored = run.session.observation();
    expect(stored?.checkpoints[0].snapshot.total).not.toBe(9999);
    expect(stored?.session.issues).not.toContain("changed-by-caller");
    expect(run.session.finish()).toEqual(stored);
    run.time(60_000);
    expect(run.session.snapshot().elapsedMs).toBe(30_000);
  });
  it("locks active checkpoint and terminal state against repeated UI actions", () => {
    const run = fixture();
    run.activate()();
    expect(run.session.markActive()).toBe(false);
    const aborted = run.session.abort("manual-stop");
    expect(aborted.session.state).toBe("aborted");
    expect(aborted.session.frameSummarySource).toBe("requestAnimationFrame");
    expect(run.session.markActive()).toBe(false);
    run.frame(30_000);
    expect(run.session.finish()).toEqual(aborted);
  });
  it("blocks changed build and viewport even if resized back later", () => {
    const run = fixture();
    run.viewport.width = 900;
    run.session.observeBinding();
    run.viewport.width = 1280;
    run.build.buildId = "other-build";
    run.activate()();
    expect(run.finish().session.issues).toEqual(expect.arrayContaining(["viewport-changed-during-observation", "build-changed-during-observation"]));
  });
  it("bounds timeline and records overflow rather than discarding it silently", () => {
    const run = fixture();
    for (let index = 0; index < 80; index += 1) {
      run.visible(index % 2 === 0);
      run.session.observeVisibility();
    }
    expect(run.session.snapshot().timeline).toHaveLength(64);
    expect(run.session.snapshot().issues).toContain("timeline-capacity-exceeded");
  });
  it("rejects nonmonotonic frames and clock regression", () => {
    const run = fixture();
    run.frame(100);
    run.frame(110);
    run.frame(110);
    run.frame(80);
    expect(run.session.snapshot().issues).toEqual(expect.arrayContaining(["frame-timestamp-invalid", "observation-clock-invalid"]));
    expect(run.session.snapshot().frameCount).toBe(1);
  });
});

function browserHost() {
  let nextId = 1;
  const frames = new Map<number, FrameRequestCallback>();
  const events = new Map<string, Set<EventListener>>();
  const addEventListener = (type: string, listener: EventListener) => {
    const listeners = events.get(type) ?? new Set<EventListener>();
    listeners.add(listener);
    events.set(type, listeners);
  };
  const removeEventListener = (type: string, listener: EventListener) => { events.get(type)?.delete(listener); };
  const host: MainlineALifecycleBrowserHostV633 = {
    requestAnimationFrame: (callback) => { const id = nextId++; frames.set(id, callback); return id; },
    cancelAnimationFrame: (id) => { frames.delete(id); },
    addEventListener,
    removeEventListener,
    document: { visibilityState: "visible", addEventListener, removeEventListener },
  };
  return {
    host,
    frames,
    events,
    dispatch: (type: string) => { [...(events.get(type) ?? [])].forEach((listener) => listener(new Event(type))); },
    tick: (atMs: number) => { const pending = [...frames.values()]; frames.clear(); pending.forEach((callback) => callback(atMs)); },
  };
}

describe("browser observer cleanup", () => {
  it("excludes a first callback from before the start action without inventing a frame interval", () => {
    const run = fixture(30_000, 1000);
    const browser = browserHost();
    const stop = attachMainlineALifecycleBrowserV633(run.session, { host: browser.host });
    run.time(1002);
    browser.tick(999.75);
    expect(run.session.snapshot().frameCount).toBe(0);
    expect(run.session.snapshot().issues).toEqual([]);
    run.time(1010);
    browser.tick(1008);
    run.time(1026);
    browser.tick(1024);
    run.activate()();
    run.time(31_000);
    browser.tick(30_992);
    const observation = run.finish();
    expect(observation.frameSummary).toMatchObject({ sampleCount: 2, totalMs: 29_984 });
    expect(observation.session.frameClock).toMatchObject({
      callbackCount: 4, acceptedCount: 3, skippedBeforeStartCount: 1, rejectedCount: 0,
      firstCallbackMs: 999.75, firstAcceptedMs: 1008, lastAcceptedMs: 30_992,
    });
    expect(evaluateMainlineAResourceObservationV633(observation).status).toBe("measured-local");
    const forged = structuredClone(observation);
    forged.session.frameClock.acceptedCount += 1;
    expect(evaluateMainlineAResourceObservationV633(forged).issues).toContain("frame-clock:sample-accounting");
    stop();
  });

  it("keeps repeated pre-start timestamps and later duplicate timestamps as failures with bounded details", () => {
    const run = fixture(30_000, 1000);
    const browser = browserHost();
    const stop = attachMainlineALifecycleBrowserV633(run.session, { host: browser.host });
    run.time(1002);
    browser.tick(999);
    browser.tick(999.5);
    browser.tick(1000);
    for (let index = 0; index < 12; index += 1) browser.tick(1000);
    const observation = run.session.abort();
    expect(observation.session.issues).toContain("frame-timestamp-invalid");
    expect(observation.session.frameClock.rejectedCount).toBe(13);
    expect(observation.session.frameClock.rejections).toHaveLength(8);
    expect(observation.session.frameClock.rejections[0].reason).toBe("before-start");
    expect(observation.frameSummary.sampleCount).toBe(0);
    observation.session.issues = [];
    expect(evaluateMainlineAResourceObservationV633(observation).issues).toContain("frame-clock:rejected-callbacks");
    stop();
  });

  it.each([NaN, Infinity, -1])("rejects a malformed initial callback %s instead of treating it as warmup", (timestamp) => {
    const run = fixture(30_000, 1000);
    run.time(1002);
    run.session.pushFrame(timestamp);
    expect(run.session.snapshot().issues).toContain("frame-timestamp-invalid");
    const diagnostics = run.session.abort().session.frameClock;
    expect(diagnostics.skippedBeforeStartCount).toBe(0);
    expect(diagnostics.rejectedCount).toBe(1);
    expect(JSON.parse(JSON.stringify(diagnostics))).toEqual(diagnostics);
  });

  it.each([0.01, 60_000])("rejects an actual host callback %sms ahead of receipt and keeps it out of intervals", (leadMs) => {
    const run = fixture(30_000, 1000);
    const browser = browserHost();
    const stop = attachMainlineALifecycleBrowserV633(run.session, { host: browser.host });
    run.time(1002);
    browser.tick(999.75);
    run.time(1010);
    browser.tick(1008);
    run.time(1026);
    browser.tick(1026 + leadMs);
    run.time(1042);
    browser.tick(1040);
    run.activate()();
    run.time(31_000);
    browser.tick(30_992);
    const observation = run.finish();
    expect(observation.frameSummary).toMatchObject({ sampleCount: 2, totalMs: 29_984 });
    expect(observation.session.frameClock).toMatchObject({ callbackCount: 5, acceptedCount: 3, rejectedCount: 1 });
    expect(observation.session.frameClock.rejections[0]).toEqual({
      timestampMs: 1026 + leadMs, receivedMs: 1026, previousAcceptedMs: 1008, reason: "future",
    });
    expect(observation.session.issues).toContain("frame-timestamp-invalid");
    observation.session.issues = [];
    const evaluation = evaluateMainlineAResourceObservationV633(observation);
    expect(evaluation.status).toBe("blocked");
    expect(evaluation.issues).toContain("frame-clock:rejected-callbacks");
    stop();
  });

  it("captures receipt time before visibility or binding work can make a future callback appear valid", () => {
    let now = 1000;
    let slowVisibility = false;
    const build = { buildId: "clock-receipt-test", branch: "codex/test", head: "a".repeat(40) };
    const viewport = { width: 1280, height: 720, devicePixelRatio: 1, device: "desktop" as const };
    const session = createMainlineALifecycleSessionV633({
      runId: "receipt-before-work", durationMs: 30_000, build, viewport,
      dependencies: {
        clock: () => now, isoNow: () => new Date(Date.UTC(2026, 8, 27) + now).toISOString(),
        visible: () => { if (slowVisibility) now += 20; return true; },
        build: () => build, viewport: () => viewport, scene: () => "atlas", heap: () => null,
      },
    });
    slowVisibility = true;
    expect(session.pushFrame(1005)).toBe(false);
    expect(now).toBe(1020);
    expect(session.abort().session.frameClock.rejections[0]).toMatchObject({
      timestampMs: 1005, receivedMs: 1000, reason: "future",
    });
  });

  it("does not let a rejected future host timestamp suppress subsequent progress updates", () => {
    const run = fixture(30_000, 1000);
    const browser = browserHost();
    const onUpdate = vi.fn();
    const stop = attachMainlineALifecycleBrowserV633(run.session, { host: browser.host, onUpdate });
    browser.tick(1000);
    run.time(1002);
    browser.tick(1_000_000_000);
    run.time(1300);
    browser.tick(1299);
    expect(onUpdate).toHaveBeenCalledTimes(2);
    expect(onUpdate.mock.lastCall?.[0]).toMatchObject({ frameCount: 1, issues: ["frame-timestamp-invalid"] });
    stop();
  });

  it("schedules one frame chain, reports progress, and cleans up idempotently", () => {
    const run = fixture();
    const browser = browserHost();
    const onUpdate = vi.fn();
    const onFinished = vi.fn();
    const stop = attachMainlineALifecycleBrowserV633(run.session, { host: browser.host, onUpdate, onFinished });
    expect(attachMainlineALifecycleBrowserV633(run.session, { host: browser.host })).toBe(stop);
    browser.tick(0);
    run.time(300);
    browser.tick(300);
    expect(onUpdate).toHaveBeenCalledTimes(2);
    expect(browser.frames.size).toBe(1);
    stop();
    stop();
    expect(browser.frames.size).toBe(0);
    expect([...browser.events.values()].every((set) => set.size === 0)).toBe(true);
    expect(onFinished).toHaveBeenCalledTimes(1);
    expect(run.session.observation()?.session.issues).toContain("observer-detached");
  });
  it.each(["visibilitychange", "pagehide"])("aborts and removes listeners on %s", (type) => {
    const run = fixture();
    const browser = browserHost();
    const onFinished = vi.fn();
    attachMainlineALifecycleBrowserV633(run.session, { host: browser.host, onFinished });
    run.visible(false);
    browser.host.document.visibilityState = "hidden";
    browser.dispatch(type);
    expect(run.session.state()).toBe("aborted");
    expect(onFinished).toHaveBeenCalledTimes(1);
    expect(browser.frames.size).toBe(0);
  });
  it("does not abort a finished run when the next animation callback disposes", () => {
    const run = fixture();
    const browser = browserHost();
    attachMainlineALifecycleBrowserV633(run.session, { host: browser.host });
    const result = run.finish();
    browser.tick(30_000);
    expect(run.session.observation()).toEqual(result);
    expect(browser.frames.size).toBe(0);
  });
  it("records resize binding violations without changing dimensions", () => {
    const run = fixture();
    const browser = browserHost();
    const stop = attachMainlineALifecycleBrowserV633(run.session, { host: browser.host });
    run.viewport.height = 900;
    browser.dispatch("resize");
    expect(run.session.snapshot().issues).toContain("viewport-changed-during-observation");
    expect(run.viewport.height).toBe(900);
    stop();
    expect(run.session.state()).toBe("aborted");
  });
  it("aborts when there is no browser host even without a completion callback", () => {
    const run = fixture();
    const stop = attachMainlineALifecycleBrowserV633(run.session);
    expect(run.session.state()).toBe("aborted");
    expect(run.session.observation()?.session.issues).toContain("browser-host-unavailable");
    stop();
  });
});

function canonicalFixture() {
  let now = 0;
  let scene = "atlas";
  const time = () => new Date(Date.UTC(2026, 8, 27) + now).toISOString();
  const registry = createCanonicalRuntimeRegistryV635(time);
  registry.publish(null);
  const target = { kind: "constellation" as const, id: "Ori", route: "mainline-a-constellation-engraving", assetHash: null };
  const build = { buildId: "canonical-unit-fixture", branch: "codex/test", head: "a".repeat(40) };
  const viewport = { width: 1280, height: 720, devicePixelRatio: 1, device: "desktop" as const };
  cleanup.push(acquireAtlasResource("subscription", "atlas", "canonical-session-baseline", { owner: "canonical-session-test", estimatedBytes: 64 }));
  const session = createMainlineALifecycleSessionV633({
    runId: "canonical-session-unit-fixture", build, viewport, durationMs: 30_000,
    mode: "canonical-object", canonicalTarget: target, canonicalManifestDigest: CANONICAL_COVERAGE_SHA256_V635,
    dependencies: {
      clock: () => now, isoNow: time, resources: getAtlasResourceSnapshot, scene: () => scene,
      visible: () => true, heap: () => null, viewport: () => viewport, build: () => build, canonical: registry.read,
    },
  });
  const ready = (changes: Partial<CanonicalRuntimeSelectionV635> = {}) => registry.publish({ ...target, loading: "ready", error: null, ...changes });
  return {
    session, registry, ready,
    time: (value: number) => { now = value; },
    scene: (value: string) => { scene = value; },
    frame: (value: number) => { now = value; session.pushFrame(value); },
    finish: () => { now = 30_000; registry.publish(null); session.pushFrame(now); return session.finish(); },
  };
}

describe("canonical object lifecycle session", () => {
  it("captures a real same-scene publication roundtrip with unchanged allocated resources", () => {
    const run = canonicalFixture();
    run.frame(0);
    run.time(1000);
    run.ready();
    expect(run.session.markActive()).toBe(true);
    run.frame(1000);
    const observation = run.finish();
    expect(observation.checkpoints.map((checkpoint) => checkpoint.scene)).toEqual(["atlas", "atlas", "atlas"]);
    expect(observation.checkpoints.map((checkpoint) => checkpoint.canonical!.selection?.id ?? null)).toEqual([null, "Ori", null]);
    expect(observation.session.issues).toEqual([]);
    expect(evaluateMainlineAResourceObservationV633(observation)).toMatchObject({ status: "measured-local", resourceBehavior: "reuse-without-allocation", resourceReleaseObserved: false });
    observation.checkpoints[1].canonical!.selection!.id = "tampered";
    expect(run.session.observation()!.checkpoints[1].canonical!.selection!.id).toBe("Ori");
  });
  it("records resource release only after actual acquisition and disposal in the same scene", () => {
    const run = canonicalFixture();
    run.frame(0);
    run.time(1000);
    const release = acquireAtlasResource("model", "atlas", "canonical-new-model", { owner: "canonical-session-test", estimatedBytes: 2048 });
    cleanup.push(release);
    run.ready();
    expect(run.session.markActive()).toBe(true);
    run.frame(1000);
    release();
    expect(evaluateMainlineAResourceObservationV633(run.finish())).toMatchObject({ status: "measured-local", acquiredCount: 1, releasedCount: 1, resourceBehavior: "acquire-release", resourceReleaseObserved: true });
  });
  it.each(["loading", "failed", "unobserved"] as const)("does not capture %s as the ready active object", (loading) => {
    const run = canonicalFixture();
    run.time(1000);
    run.ready({ loading });
    expect(run.session.markActive()).toBe(false);
    expect(run.session.snapshot().checkpointCount).toBe(1);
  });
  it("requires exact target case and route instead of accepting another selected object", () => {
    const run = canonicalFixture();
    run.time(1000);
    run.ready({ id: "ori" });
    expect(run.session.markActive()).toBe(false);
    run.ready({ route: "wrong-route" });
    expect(run.session.markActive()).toBe(false);
    run.ready({ assetHash: "f".repeat(64) });
    expect(run.session.markActive()).toBe(false);
  });
  it("refuses a target publication made before the baseline capture", () => {
    const run = canonicalFixture();
    run.ready();
    run.time(1000);
    expect(run.session.markActive()).toBe(false);
  });
  it("keeps transient load and cleanup failures in the session after a ready retry", () => {
    const run = canonicalFixture();
    run.time(1000);
    run.ready({ loading: "failed", error: "texture-load-failed" });
    run.session.observeBinding();
    run.ready();
    expect(run.session.markActive()).toBe(true);
    run.registry.reportCleanupFailure("resource-disposal-failed");
    const observation = run.finish();
    expect(observation.session.issues).toEqual(expect.arrayContaining(["canonical-runtime-load-failed", "canonical-cleanup-failed"]));
    expect(evaluateMainlineAResourceObservationV633(observation).status).toBe("blocked");
  });
  it("keeps canonical observations within their original scene", () => {
    const run = canonicalFixture();
    run.time(1000);
    run.ready();
    run.scene("inspect");
    expect(run.session.markActive()).toBe(false);
    run.scene("atlas");
    expect(run.session.markActive()).toBe(true);
    run.scene("inspect");
    expect(evaluateMainlineAResourceObservationV633(run.finish()).issues).toContain("canonical:scene-changed-during-object-cycle");
  });
  it("does not count a selected object as a completed return", () => {
    const run = canonicalFixture();
    run.frame(0);
    run.time(1000);
    run.ready();
    expect(run.session.markActive()).toBe(true);
    run.frame(1000);
    run.frame(30_000);
    const result = evaluateMainlineAResourceObservationV633(run.session.finish());
    expect(result.status).toBe("blocked");
    expect(result.issues).toContain("canonical:baseline-object-not-restored");
  });
});

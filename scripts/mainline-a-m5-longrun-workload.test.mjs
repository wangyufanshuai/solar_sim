import assert from "node:assert/strict";
import test from "node:test";
import resourceModule from "../app/lib/atlasResourceLifecycle.ts";
import launchDirectorModule from "../app/lib/launchSequenceDirector.ts";
import { M5_WORKLOAD_POLICY, m5ResourceFootprint, m5ResourcesMatch, inspectM5Advisories, inspectM5Workload,
  inspectM5DOMCounterTrend, readM5DOMCounters, M5_QUALITY_POLICY, m5QualityRecord, inspectM5Quality, waitForM5QualityState }
  from "./mainline-a-m5-longrun-workload.mjs";

const { acquireAtlasResource, getAtlasResourceSnapshot } = resourceModule.default ?? resourceModule;
const { selectAtlasRuntimeQualityTier } = launchDirectorModule.default ?? launchDirectorModule;
const clone = (value) => JSON.parse(JSON.stringify(value));
const startMs = Date.UTC(2026, 9, 23, 0, 10);
const iso = (offset) => new Date(startMs + offset).toISOString();
const runtimeBuildId = "mainline-a-1111111111111111";
function quality(sceneMode = "atlas", device = "desktop") {
  const viewport = clone(M5_QUALITY_POLICY.viewports[device]);
  return { sceneMode, probeSceneMode: sceneMode, qualityTier: M5_QUALITY_POLICY.sceneTiers[device]?.[sceneMode] ?? "mobile-safe",
    visualProfile: "science-cinematic-v4", userAgent: "fixture-chrome-user-agent", browserVersion: "fixture-chrome-version",
    renderBudget: "balanced", presentation: { queryBudget: null, storedRenderBudget: null, storageReadable: true, url: "http://127.0.0.1:3134/" },
    viewport, devicePixelRatio: 1, canvasDPR: { width: viewport.width, height: viewport.height, cssWidth: viewport.width, cssHeight: viewport.height, x: 1, y: 1 } };
}
const profile = { ...quality(), renderBudgetPreflight: { value: "balanced", source: "normal-HUD-layer-menu-props-backed-orbit-density-control" } };
const camera = (selectedId) => ({ selectedId, focusState: "locked", position: [1, 2, 3], target: [0, 0, 0], direction: [0, 0, -1],
  up: [0, 1, 0], quaternion: [0, 0, 0, 1], fov: 45, zoom: 1, targetDistance: 10 });
const domCounters = (offset) => ({ source: "CDP-Memory.getDOMCounters", status: "observed", at: iso(offset), sessionDetached: true,
  documents: 3, nodes: 2000, jsEventListeners: 45 });
let baseline, retained, active;
{
  const releaseBase = acquireAtlasResource("model", "atlas", "workload-fixture-base", { owner: "workload-fixture", estimatedBytes: 100 });
  baseline = clone(getAtlasResourceSnapshot());
  const releaseCache = acquireAtlasResource("texture", "atlas", "workload-fixture-warm-cache", { owner: "workload-fixture-cache", estimatedBytes: 1024 });
  retained = clone(getAtlasResourceSnapshot());
  const releaseActive = acquireAtlasResource("model", "atlas", "workload-fixture-active", { owner: "workload-fixture-active", estimatedBytes: 2048 });
  active = clone(getAtlasResourceSnapshot());
  releaseActive(); releaseCache(); releaseBase();
}
function probe(id, offset, snapshot) {
  return { source: "normal-product-four-second-performance-control", runId: id, device: "desktop", startedAt: iso(offset - 4_100), endedAt: iso(offset),
    durationMs: 4_100, status: "complete", build: { buildId: runtimeBuildId }, before: clone(snapshot), after: clone(snapshot) };
}
function stage(name, index, offset, warmup = false) {
  const station = /^station-(\d)$/.exec(name)?.[1];
  const selectedId = name === "returned-baseline" ? null : name === "returned-orion" ? "constellation:Ori"
    : ["viewer-open", "viewer-closed"].includes(name) ? "nebula:m42" : M5_WORKLOAD_POLICY.stops[Number(station)];
  const id = name === "station-2" ? "b33" : ["station-1", "viewer-open", "viewer-closed"].includes(name) ? "m42" : null;
  const resourceCapture = name === "viewer-open" ? null : probe(`${warmup ? "warmup" : index}-${name}`, offset, name === "returned-baseline" ? retained : active);
  return { name, at: iso(offset), browserMs: 100_000 + offset, selectedId, visibility: "visible", runtimeBuildId,
    releaseBoundary: "candidate-only-hold-not-admitted", scientificPayloadWriteback: "false", ...quality(selectedId ? "inspect" : "atlas"), canvasCount: 1,
    journey: name === "returned-baseline" ? null : { status: name === "returned-orion" ? "returned" : "ready",
      index: name === "returned-orion" ? 4 : station === undefined ? 1 : Number(station), target: selectedId },
    image: id ? { id, status: "ready", sha256: M5_WORKLOAD_POLICY.imageHashes[id] } : null,
    viewer: name === "viewer-open" ? { id: "m42", open: true, zoom: 2, borrowedCount: 1 } : null,
    borrowedCount: name === "viewer-open" ? 1 : 0,
    longrun: { attached: true, running: !warmup, observationCount: 0 },
    renderer: { contextStatus: "ready", drawCalls: 10, triangles: 300, textures: 5, programs: 6, r3fSamples: 720,
      r3fP50Ms: 16, r3fP95Ms: 20, gpuSamples: 0, gpuP50Ms: null, gpuP95Ms: null, gpuTimer: "unavailable" },
    camera: camera(selectedId), resourceCapture,
    ...(["returned-orion", "returned-baseline"].includes(name) ? { domCounters: domCounters(offset) } : {}) };
}
function fixture() {
  const cycle = (index, warmup = false) => {
    const offset = warmup ? -120_000 : index * 300_000 + 60_000;
    const stages = M5_WORKLOAD_POLICY.stages.map((name, position) => stage(name, index, offset + (position + 1) * 5_000, warmup));
    return { phase: warmup ? "warmup" : "observation", index, startedAt: iso(offset), endedAt: stages.at(-1).at,
      stages, departureCamera: camera("constellation:Ori"), poseRestored: true, viewerRestoredFocus: true, warmedBaselineRestored: true };
  };
  const confirmation = { ...stage("returned-baseline", -1, -60_000, true), name: "warmup-stable-confirmation", resourceCapture: probe("warmup-confirmation", -60_000, retained) };
  const warmCycle = cycle(-1, true);
  return { policy: clone(M5_WORKLOAD_POLICY), device: "desktop", warmup: { policy: clone(M5_WORKLOAD_POLICY),
    frozen: { device: "desktop", runtimeBuildId, preflightQuality: m5QualityRecord(profile), renderBudgetPreflight: clone(profile.renderBudgetPreflight),
      devicePixelRatio: 1, baseline: clone(retained), stageQuality: Object.fromEntries(warmCycle.stages.map((stage) => [stage.name, m5QualityRecord(stage)])) },
    cycle: warmCycle, confirmation, completedAt: confirmation.at },
  cycles: Array.from({ length: 6 }, (_, index) => cycle(index)) };
}
const observation = { device: "desktop", build: { buildId: runtimeBuildId }, startedAt: iso(0), endedAt: iso(1_802_000) };

test("policy pre-registers the existing five-stop journey and all six five-minute windows", () => {
  assert.deepEqual(M5_WORKLOAD_POLICY.stops, ["constellation:Ori", "nebula:m42", "nebula:b33", "nearby-star:betelgeuse", "nearby-star:rigel"]);
  assert.equal(M5_WORKLOAD_POLICY.windows * M5_WORKLOAD_POLICY.windowMs, 1_800_000);
  assert.equal(M5_WORKLOAD_POLICY.scheduledOffsetsMs.length, 6);
  assert.throws(() => M5_WORKLOAD_POLICY.scheduledOffsetsMs.push(20), TypeError);
  assert.throws(() => { M5_WORKLOAD_POLICY.stops[0] = "smaller-route"; }, TypeError);
});

test("registered scene tiers agree with the actual product selector and permit designed atlas-to-inspect transitions", () => {
  for (const device of ["desktop", "mobile"]) for (const sceneMode of ["atlas", "inspect"]) {
    const actual = selectAtlasRuntimeQualityTier({ mobile: device === "mobile", launchActive: false, closeupActive: sceneMode === "inspect" });
    assert.equal(M5_QUALITY_POLICY.sceneTiers[device][sceneMode], actual);
    const result = inspectM5Quality(quality(sceneMode, device), { device, preflightQuality: quality("atlas", device) });
    assert.equal(result.ok, true, result.issues.join("\n"));
  }
  assert.equal(inspectM5Quality(quality("inspect"), { device: "desktop", preflightQuality: quality() }, { stageName: "station-0" }).ok, true);
});

test("wrong formula tier, stale probe pairs, unregistered launch, and wrong stage scenes fail independently", () => {
  for (const [sample, device, stageName, issue] of [
    [{ ...quality("inspect"), qualityTier: "balanced" }, "desktop", "station-0", "scene-tier-formula-mismatch"],
    [{ ...quality("atlas"), qualityTier: "closeup-inspect" }, "desktop", "returned-baseline", "scene-tier-formula-mismatch"],
    [{ ...quality("inspect"), probeSceneMode: "atlas" }, "desktop", "station-0", "scene-probe-pair-not-converged"],
    [{ ...quality("launch", "mobile"), qualityTier: "mobile-safe" }, "mobile", null, "unregistered-scene-or-device"],
    [quality("atlas"), "desktop", "station-0", "stage-scene-mismatch"],
  ]) assert.ok(inspectM5Quality(sample, { device, preflightQuality: quality("atlas", device) }, { stageName }).issues.includes(issue));
});

test("visual profile, budget evidence, viewport, browser identity, and both actual DPRs remain fixed", () => {
  for (const mutation of [
    (sample) => { sample.visualProfile = "legacy-v9"; },
    (sample) => { sample.renderBudget = "dense"; sample.presentation.queryBudget = "dense"; },
    (sample) => { sample.presentation.storageReadable = false; },
    (sample) => { sample.presentation.storedRenderBudget = "dense"; },
    (sample) => { sample.presentation.url += "?budget=dense"; },
    (sample) => { sample.viewport.width--; },
    (sample) => { sample.devicePixelRatio = 2; },
    (sample) => { sample.canvasDPR.width /= 2; sample.canvasDPR.x = .5; },
    (sample) => { sample.userAgent += "-changed"; },
    (sample) => { sample.browserVersion += "-changed"; },
  ]) {
    const sample = quality("inspect"); mutation(sample);
    assert.equal(inspectM5Quality(sample, { device: "desktop", preflightQuality: quality() }).ok, false);
  }
});

test("warm stage quality is mandatory even when the generic formula is valid", () => {
  const current = fixture();
  assert.equal(inspectM5Quality(current.cycles[0].stages[0], current.warmup.frozen, { stageName: "station-0", requireWarmStage: true }).ok, true);
  delete current.warmup.frozen.stageQuality["station-0"];
  assert.equal(inspectM5Quality(current.cycles[0].stages[0], current.warmup.frozen, { stageName: "station-0", requireWarmStage: true }).ok, false);
  assert.ok(inspectM5Workload(current, observation, profile).issues.includes("warmed-stage-quality-reference-invalid"));
  const wrong = fixture(); wrong.warmup.frozen.stageQuality["station-0"].qualityTier = "balanced";
  assert.equal(inspectM5Workload(wrong, observation, profile).ok, false);
});

function qualityPage(states) {
  let reads = 0, stateReads = 0;
  const waits = [];
  return { waits, context: () => ({ browser: () => ({ version: () => "fixture-chrome-version" }) }),
    evaluate: async () => ++reads % 2 ? clone(states[Math.min(stateReads++, states.length - 1)]) : camera("constellation:Ori"),
    waitForTimeout: async (duration) => { waits.push(duration); } };
}

test("the shared stage and monitor reader waits for the exact scene/tier pair rather than accepting a tier set", async () => {
  const stale = { ...quality("inspect"), probeSceneMode: "atlas", qualityTier: "balanced" };
  const page = qualityPage([stale, quality("inspect")]);
  const observed = await waitForM5QualityState(page, { device: "desktop", preflightQuality: quality() }, { stageName: "station-0" });
  assert.equal(observed.sceneMode, "inspect"); assert.equal(observed.qualityTier, "closeup-inspect");
  assert.deepEqual(page.waits, [150]);
  const bad = qualityPage([{ ...quality("inspect"), qualityTier: "balanced" }]);
  await assert.rejects(waitForM5QualityState(bad, { device: "desktop", preflightQuality: quality() }, { timeoutMs: 5 }), (error) => {
    assert.ok(error.qualityEvidence.issues.includes("scene-tier-formula-mismatch"));
    assert.equal(error.qualitySample.qualityTier, "balanced"); return true;
  });
  const launch = qualityPage([quality("launch", "mobile")]);
  await assert.rejects(waitForM5QualityState(launch, { device: "mobile", preflightQuality: quality("atlas", "mobile") }), /unregistered-scene-or-device/);
  assert.equal(launch.waits.length, 0);
});

test("resource equality permits registered warm caches and revision changes while rejecting identity replacement or unbounded growth", () => {
  assert.notEqual(m5ResourceFootprint(baseline), m5ResourceFootprint(retained));
  assert.equal(m5ResourcesMatch(retained, { ...clone(retained), revision: retained.revision + 30 }), true);
  assert.equal(m5ResourcesMatch(retained, active), false);
  assert.equal(m5ResourcesMatch(null, null), false);
  const forged = clone(retained); forged.total++;
  assert.equal(m5ResourceFootprint(forged), null);
});

test("a full synthetic workload proves its own route coverage but does not replace the official longrun verifier", () => {
  const report = inspectM5Workload(fixture(), observation, profile);
  assert.equal(report.ok, true, report.issues.join("\n"));
  assert.equal(report.completeWindows, 6);
  assert.equal(report.domCounterReview.ok, true);
  assert.match(report.geometryMaterialLimit, /no-independent-full-three-object-enumeration/);
});

test("missing baseline-only route and missing first or tail cycles fail workload qualification", () => {
  assert.equal(inspectM5Workload(undefined, observation, profile).ok, false);
  for (const remove of [0, 5]) {
    const current = fixture(); current.cycles.splice(remove, 1);
    assert.ok(inspectM5Workload(current, observation, profile).issues.includes("six-complete-window-cycles-required"));
  }
  const baselineOnly = fixture(); baselineOnly.cycles[0].stages = [baselineOnly.cycles[0].stages.at(-1)];
  assert.ok(inspectM5Workload(baselineOnly, observation, profile).issues.includes("cycle-0:route-stage-coverage"));
});

test("late window work cannot be moved to an early window or completed after observation", () => {
  const shifted = fixture(); shifted.cycles[5].startedAt = iso(60_000);
  assert.ok(inspectM5Workload(shifted, observation, profile).issues.includes("cycle-5:outside-registered-window"));
  const late = fixture(); late.cycles[5].endedAt = iso(1_805_000);
  assert.ok(inspectM5Workload(late, observation, profile).issues.includes("cycle-5:outside-registered-window"));
});

test("warmup must complete the full route and establish stable resource probes before timing begins", () => {
  for (const mutation of [
    (current) => { delete current.warmup.cycle; },
    (current) => { current.warmup.completedAt = iso(1); },
    (current) => { current.warmup.confirmation.resourceCapture.after = active; },
    (current) => { current.warmup.cycle.stages.splice(3, 1); },
  ]) {
    const current = fixture(); mutation(current);
    assert.equal(inspectM5Workload(current, observation, profile).ok, false);
  }
});

test("image readiness, actual viewer borrowing, close, focus, pose, and actual selected stop are mandatory", () => {
  for (const mutation of [
    (current) => { current.cycles[0].stages[1].image.status = "loading"; },
    (current) => { current.cycles[0].stages[1].image.sha256 = "a".repeat(64); },
    (current) => { current.cycles[0].stages[2].viewer.borrowedCount = 0; },
    (current) => { current.cycles[0].stages[3].borrowedCount = 1; },
    (current) => { current.cycles[0].viewerRestoredFocus = false; },
    (current) => { current.cycles[0].stages[7].camera.position[0] += 1; },
    (current) => { current.cycles[0].stages[5].selectedId = "nearby-star:wrong"; },
  ]) {
    const current = fixture(); mutation(current);
    assert.equal(inspectM5Workload(current, observation, profile).ok, false);
  }
});

test("each stage requires frozen quality, live renderer, a continuing R65 session, and unique full resource probes", () => {
  for (const mutation of [
    (current) => { current.cycles[4].stages[1].qualityTier = "mobile-safe"; },
    (current) => { current.cycles[0].stages[0].devicePixelRatio = 2; },
    (current) => { current.cycles[0].stages[0].renderer.contextStatus = "context-lost"; },
    (current) => { current.cycles[0].stages[0].longrun.running = false; },
    (current) => { current.cycles[0].stages[0].longrun.observationCount = 1; },
    (current) => { current.cycles[0].stages[0].resourceCapture = null; },
    (current) => { current.cycles[1].stages[0].resourceCapture.runId = current.cycles[0].stages[0].resourceCapture.runId; },
    (current) => { current.cycles[0].stages[0].resourceCapture.durationMs = 100; },
    (current) => { current.cycles[0].stages[0].resourceCapture.after.total++; },
  ]) {
    const current = fixture(); mutation(current);
    assert.equal(inspectM5Workload(current, observation, profile).ok, false);
  }
});

test("every cycle must leave the viewer, selection, and the registered warm resource set", () => {
  for (const mutation of [
    (current) => { current.cycles[2].stages.at(-1).selectedId = "nebula:m42"; },
    (current) => { current.cycles[2].stages.at(-1).resourceCapture.after = active; },
    (current) => { current.cycles[2].stages.at(-1).resourceCapture.before = baseline; },
    (current) => { current.cycles[2].stages.at(-1).journey = { status: "returned" }; },
  ]) {
    const current = fixture(); mutation(current);
    assert.equal(inspectM5Workload(current, observation, profile).ok, false);
  }
});

test("existing v665 late-tail and heap-growth review signals prevent freezing without inventing thresholds", () => {
  const healthy = { device: "desktop", frames: { tailTrend: { advisory: "no-late-window-tail-signal", ratio: 1 } },
    memory: { trend: { advisory: "no-sustained-growth-signal", netBytes: 1 } } };
  assert.equal(inspectM5Advisories([healthy]).ok, true);
  for (const [kind, advisory] of [["frames", "late-window-frame-tail-review"], ["memory", "sustained-reported-heap-growth-review"]]) {
    const changed = clone(healthy);
    changed[kind][kind === "frames" ? "tailTrend" : "trend"].advisory = advisory;
    const result = inspectM5Advisories([changed]);
    assert.equal(result.ok, false); assert.equal(result.status, "review-required");
    assert.equal(result.reviews[0].advisory, advisory);
  }
  const unavailable = clone(healthy); unavailable.memory.trend.advisory = "unavailable";
  assert.equal(inspectM5Advisories([unavailable]).status, "review-required");
});

test("CDP DOM counters use one read-only command and detach on both success and command failure", async () => {
  for (const failure of [false, true]) {
    const calls = [];
    const session = { send: async (method) => { calls.push(method); if (failure) throw new Error("counter-unavailable");
      return { documents: 3, nodes: 2000, jsEventListeners: 45 }; }, detach: async () => { calls.push("detach"); } };
    const page = { context: () => ({ newCDPSession: async (target) => { assert.equal(target, page); return session; } }) };
    const result = await readM5DOMCounters(page);
    assert.deepEqual(calls, ["Memory.getDOMCounters", "detach"]);
    assert.equal(result.sessionDetached, true);
    assert.equal(result.status, failure ? "unavailable" : "observed");
    if (failure) assert.match(result.error, /counter-unavailable/);
    else assert.equal(result.jsEventListeners, 45);
  }
});

test("CDP malformed counts, unavailable sessions, and detach failures remain unavailable evidence", async () => {
  for (const variant of ["malformed", "session-unavailable", "detach-failed"]) {
    let detached = 0;
    const page = { context: () => ({ newCDPSession: async () => {
      if (variant === "session-unavailable") throw new Error(variant);
      return { send: async () => ({ documents: 3, nodes: variant === "malformed" ? -1 : 2000, jsEventListeners: 45 }),
        detach: async () => { detached++; if (variant === "detach-failed") throw new Error(variant); } };
    } }) };
    const result = await readM5DOMCounters(page);
    assert.equal(result.status, "unavailable");
    assert.equal(detached, variant === "session-unavailable" ? 0 : 1);
  }
});

test("all returned DOM counts and deltas remain in the curve while any observed growth requires review", () => {
  const current = fixture();
  const healthy = inspectM5DOMCounterTrend(current);
  assert.equal(healthy.ok, true);
  assert.equal(healthy.curves.length, 12);
  for (const key of ["documents", "nodes", "jsEventListeners"]) {
    const changed = fixture(); changed.cycles[5].stages.at(-1).domCounters[key]++;
    const review = inspectM5DOMCounterTrend(changed);
    assert.equal(review.ok, false);
    assert.equal(review.status, "review-required");
    assert.equal(review.reviews[0].kind, "returned-DOM-counter-growth-review");
    assert.equal(review.curves.at(-1).deltaFromRunningReference[key], 1);
  }
  const decreased = fixture(); decreased.cycles[3].stages.at(-1).domCounters.nodes--;
  assert.equal(inspectM5DOMCounterTrend(decreased).ok, true);
});

test("idle warmup observers differ from R65-running references without an invented listener allowance", () => {
  const current = fixture();
  for (const cycle of current.cycles) for (const checkpoint of cycle.stages.filter((entry) => entry.domCounters)) {
    checkpoint.domCounters.jsEventListeners += 3;
  }
  const result = inspectM5DOMCounterTrend(current);
  assert.equal(result.ok, true);
  assert.equal(result.references["returned-baseline"].deltaFromIdleWarmedBound.jsEventListeners, 3);
  assert.equal(result.curves.at(-1).deltaFromRunningReference.jsEventListeners, 0);
  assert.equal(result.curves[0].role, "running-reference-only-not-a-growth-comparison");
  current.cycles[1].stages.at(-1).domCounters.jsEventListeners++;
  assert.equal(inspectM5DOMCounterTrend(current).status, "review-required");
});

test("missing, undetached, or invalid DOM evidence requires review without rewriting route qualification", () => {
  for (const mutation of [
    (current) => { delete current.warmup.confirmation.domCounters; },
    (current) => { delete current.cycles[3].stages.at(-1).domCounters; },
    (current) => { current.cycles[1].stages.at(-1).domCounters.sessionDetached = false; },
    (current) => { current.cycles[4].stages.at(-1).domCounters.jsEventListeners = null; },
  ]) {
    const current = fixture(); mutation(current);
    const result = inspectM5Workload(current, observation, profile);
    assert.equal(result.ok, true, result.issues.join("\n"));
    assert.equal(result.domCounterReview.ok, false);
    assert.equal(result.domCounterReview.status, "review-required");
  }
});

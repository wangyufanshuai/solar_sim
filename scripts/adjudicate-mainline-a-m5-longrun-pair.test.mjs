import assert from "node:assert/strict";
import test from "node:test";
import { inspectM5PairMachineGate, inspectM5PairGuardChain, inspectM5MobileNaturalSettle,
  inspectM5DesktopAdjudication, parseM5PairOptions } from "./adjudicate-mainline-a-m5-longrun-pair.mjs";
import { M5_LONGRUN_POLICY, M5_NATURAL_DOM_SETTLE_POLICY } from "./capture-mainline-a-m5-longrun.mjs";
import { m5QualityRecord } from "./mainline-a-m5-longrun-workload.mjs";

// Tiny synthetic component fixtures. These contain no browser raw, no official
// frame/memory series and cannot qualify a pair or a thirty-minute observation.
const base = Date.parse("2026-01-01T00:00:00.000Z"), iso = (ms) => new Date(base + ms).toISOString();
const clone = (v) => structuredClone(v);
function fixture() {
  const camera = { source: "read-only-actual-camera-dom-markers", focusState: "idle", selectedId: "",
    position: [1, 2, 3], target: [0, 0, 0], direction: [0, 0, -1], up: [0, 1, 0], quaternion: [0, 0, 0, 1],
    fov: 52, zoom: 1, targetDistance: 10 };
  const resources = { "data-atlas-resource-total": "27", "data-atlas-resource-identity-digest": "synthetic-not-browser-evidence" };
  const quality = { sceneMode: "atlas", probeSceneMode: "atlas", qualityTier: "mobile-safe", visualProfile: "synthetic-only",
    renderBudget: "balanced", presentation: { queryBudget: null, storedRenderBudget: null, storageReadable: true, url: "http://127.0.0.1:1/" },
    userAgent: "synthetic-unit-test", browserVersion: "synthetic", viewport: { width: 390, height: 844 }, devicePixelRatio: 1,
    canvasDPR: { width: 390, height: 844, cssWidth: 390, cssHeight: 844, x: 1, y: 1 } };
  const counters = (ms) => ({ source: "CDP-Memory.getDOMCounters", status: "observed", sessionDetached: true,
    at: iso(ms), documents: 1, nodes: 100, jsEventListeners: 30 });
  const state = (ms) => ({ ...clone(quality), at: iso(ms), browserMs: ms + 1_000, runtimeBuildId: "synthetic-build",
    releaseBoundary: "candidate-only-hold-not-admitted", scientificPayloadWriteback: "false", visibility: "visible", canvasCount: 1,
    longrun: { attached: true, running: true, observationCount: 0 }, selectedId: null, image: null, viewer: null, journey: null,
    borrowedCount: 0, camera: clone(camera), resources: clone(resources) });
  const first = { name: "returned-baseline", at: iso(120_000), longrun: state(120_000).longrun,
    domCounters: counters(120_000), resources: clone(resources), camera: clone(camera) };
  const last = { ...clone(first), at: iso(1_620_000) };
  const workload = { anchor: { at: iso(0), browserMs: 1_000 }, warmup: { frozen: { device: "mobile",
    preflightQuality: m5QualityRecord(quality), stageQuality: { "returned-baseline": m5QualityRecord(quality) } } },
    cycles: [{ stages: [first] }, { endedAt: iso(1_620_000), stages: [last] }] };
  const settle = { policy: M5_NATURAL_DOM_SETTLE_POLICY, startedAt: iso(1_620_000), endedAt: iso(1_740_000),
    qualifiedLongrun: false, candidateFreezeAllowed: false, garbageCollectionRequested: false,
    status: "observed-additional-review-evidence", samples: M5_NATURAL_DOM_SETTLE_POLICY.elapsedTargetsMs.map((elapsed) => ({
      elapsedTargetMs: elapsed, actualElapsedMs: elapsed, at: iso(1_620_000 + elapsed),
      domCounters: counters(1_620_000 + elapsed), state: state(1_620_000 + elapsed) })) };
  return { settle, workload, observation: { device: "mobile", startedAt: iso(0), endedAt: iso(1_800_000) },
    session: { device: "mobile", runtimeBuildId: "synthetic-build" } };
}
const inspect = ({ settle, workload, observation, session }) => inspectM5MobileNaturalSettle(settle, workload, observation, session);

test("explicit separate workspace input/output paths are mandatory and no gate override exists", () => {
  const args = ["--build", "docs/example.json", "--desktop-dir", "output/desktop", "--mobile-dir", "output/mobile",
    "--desktop-review", "output/review.json", "--out", "output/pair"];
  assert.ok(parseM5PairOptions(args).out.endsWith("pair"));
  for (const extra of [["--duration", "1"], ["--ignore-dom", "true"], ["--out", "output/repeat"]]) {
    assert.throws(() => parseM5PairOptions([...args, ...extra]), /unknown-or-duplicate/);
  }
  assert.throws(() => parseM5PairOptions(args.map((v) => v === "output/mobile" ? "output/desktop" : v)), /independent/);
  assert.throws(() => parseM5PairOptions(args.map((v) => v === "output/pair" ? "output/mobile/pair" : v)), /separate/);
  assert.throws(() => parseM5PairOptions(args.map((v) => v === "output/pair" ? "../outside" : v)), /outside/);
});

test("matched running natural-settle validator preserves all original inputs and never qualifies a run", () => {
  const value = fixture(), before = JSON.stringify(value), result = inspect(value);
  assert.equal(result.ok, true);
  assert.equal(result.originalMachineDOMResultUnchanged, true);
  assert.equal("qualifiedLongrun" in result, false);
  assert.equal(JSON.stringify(value), before);
});

test("one extra unforced document, node or listener at 60s or 120s still requires review", () => {
  for (const index of [3, 4]) for (const key of ["documents", "nodes", "jsEventListeners"]) {
    const value = fixture(); value.settle.samples[index].domCounters[key]++;
    assert.equal(inspect(value).ok, false, `${index}:${key}`);
  }
});

test("ended observation, borrowed viewer, wrong selection, resource or camera state cannot discharge DOM review", () => {
  const changes = [
    (v) => { v.settle.samples[4].state.longrun.running = false; },
    (v) => { v.settle.samples[4].state.longrun.observationCount = 1; },
    (v) => { v.settle.samples[4].state.selectedId = "nebula:m42"; },
    (v) => { v.settle.samples[4].state.viewer = { open: true }; },
    (v) => { v.settle.samples[4].state.borrowedCount = 1; },
    (v) => { v.settle.samples[4].state.resources["data-atlas-resource-total"] = "28"; },
    (v) => { v.settle.samples[4].state.camera.position[0] += 1; },
    (v) => { v.settle.samples[4].state.runtimeBuildId = "other"; },
    (v) => { v.settle.samples[4].state.qualityTier = "balanced"; },
    (v) => { v.settle.samples[4].state.canvasDPR.x = 2; },
  ];
  for (const change of changes) { const value = fixture(); change(value); assert.equal(inspect(value).ok, false); }
});

test("missing, reordered, premature, post-observation, forced-GC and unavailable samples are rejected", () => {
  const changes = [
    (v) => { v.settle.samples.pop(); },
    (v) => { v.settle.samples.reverse(); },
    (v) => { v.settle.samples[4].actualElapsedMs = 119_999; },
    (v) => { v.settle.samples[4].state.at = iso(1_800_001); },
    (v) => { v.settle.samples[4].state.browserMs += 1_201; },
    (v) => { v.settle.startedAt = iso(1_600_000); },
    (v) => { v.settle.garbageCollectionRequested = true; },
    (v) => { v.settle.samples[4].domCounters.sessionDetached = false; },
    (v) => { v.workload.cycles[0].stages[0].domCounters.nodes = NaN; },
    (v) => { v.session.device = "desktop"; },
  ];
  for (const change of changes) { const value = fixture(); change(value); assert.equal(inspect(value).ok, false); }
});

function machineFixture() {
  const two = (extra = {}) => Array.from({ length: 2 }, () => ({ ok: true, ...extra }));
  return { ok: false, issues: ["DOM-counter-trend-review-required"], domCounterReview: { ok: false },
    legacy: { status: "verified-current-source-local-longrun" }, officialChecksCoveredByLegacy: { passed: true },
    rawChecks: two(), singleBoundaryChecks: two(), combinedRaw: { ok: true }, clock: { ok: true }, series: two(),
    targets: two(), workloadChecks: two({ cycles: 6, completeWindows: 6 }), advisoryReview: { ok: true } };
}
test("only the exact DOM advisory may be separately adjudicated while the machine remains false", () => {
  const original = machineFixture(), before = JSON.stringify(original);
  assert.equal(inspectM5PairMachineGate(original).ok, true);
  assert.equal(original.ok, false); assert.equal(original.domCounterReview.ok, false);
  assert.equal(JSON.stringify(original), before);
  for (const key of ["clock", "combinedRaw", "advisoryReview"]) {
    const changed = machineFixture(); changed[key].ok = false;
    assert.equal(inspectM5PairMachineGate(changed).ok, false);
  }
  for (const issue of ["raw-or-clock-invalid", "registered-frame-target-missed", "registered-repeat-workload-not-proven",
    "fresh-sequential-browser-evidence-invalid", "existing-series-advisory-review-required"]) {
    const changed = machineFixture(); changed.issues.push(issue); assert.equal(inspectM5PairMachineGate(changed).ok, false);
  }
  const forged = machineFixture(); forged.ok = true; assert.equal(inspectM5PairMachineGate(forged).ok, false);
});

function guardsFixture() {
  const sample = (ms, device = "mobile") => ({ at: iso(ms), device, freePhysicalBytes: 3 * 1024 ** 3,
    commitLimitBytes: 20 * 1024 ** 3, committedBytes: 15 * 1024 ** 3, ok: true, issues: [] });
  const profile = fixture().workload.warmup.frozen.preflightQuality;
  const selected = [sample(-1), sample(15_000), sample(30_000)];
  for (const row of selected.slice(1)) row.runtimeProfile = clone(profile);
  const samples = [sample(-2, "preflight"), ...selected, sample(31_000, "final")];
  return { log: { policy: M5_LONGRUN_POLICY.resourceGuard, samples },
    progress: samples.map((record) => ({ kind: "resource-guard", record })), session: { device: "mobile", launchedAt: iso(0), closedAt: iso(30_001), profile },
    observation: { startedAt: iso(1), endedAt: iso(30_000) }, plan: { policy: M5_LONGRUN_POLICY } };
}
const inspectGuards = (v) => inspectM5PairGuardChain(v.log, v.progress, v.session, v.observation, v.plan);
test("strict guard verification recomputes bytes and requires the retained selected-device journal", () => {
  assert.equal(inspectGuards(guardsFixture()).ok, true);
  const delayedProfile = guardsFixture();
  delayedProfile.progress = delayedProfile.progress.map((row) => {
    const { runtimeProfile: ignoredProfile, ...record } = row.record; void ignoredProfile;
    return { ...row, record };
  });
  assert.equal(inspectGuards(delayedProfile).ok, true); // The monitor appends quality after journaling capacity.
  delayedProfile.log.samples[2].runtimeProfile.qualityTier = "balanced";
  assert.equal(inspectGuards(delayedProfile).ok, false); // Projecting the journal must not hide quality drift.
  const low = guardsFixture(); low.log.samples[2].freePhysicalBytes = 1024 ** 3;
  assert.equal(inspectGuards(low).ok, false); // recorded ok=true cannot hide actual low capacity.
  const missing = guardsFixture(); missing.progress.pop(); assert.equal(inspectGuards(missing).ok, false);
  const weak = guardsFixture(); weak.log.policy = { ...weak.log.policy, freePhysicalBytesMin: 1 };
  assert.equal(inspectGuards(weak).ok, false);
  const other = guardsFixture(), unrelated = { ...other.log.samples[1], device: "desktop", freePhysicalBytes: 1, ok: false };
  other.log.samples.push(unrelated); other.progress.push({ kind: "resource-guard", record: unrelated });
  assert.equal(inspectGuards(other).ok, true); // A failed non-selected historical session is not a candidate input.
});

test("a desktop review boolean alone cannot replace its bound evidence inventory", () => {
  assert.equal(inspectM5DesktopAdjudication({ decision: { desktopBuildLifecycleReviewResolved: true } }, {}, []).ok, false);
  assert.equal(inspectM5DesktopAdjudication(undefined, {}, []).ok, false);
});

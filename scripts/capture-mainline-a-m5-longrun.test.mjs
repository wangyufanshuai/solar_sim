import assert from "node:assert/strict";
import { EventEmitter, getEventListeners } from "node:events";
import { mkdtemp, readFile, rm, access } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { runInNewContext } from "node:vm";
import longRunModule from "../app/lib/mainlineAR65LongRunV643.ts";
import resourceModule from "../app/lib/atlasResourceLifecycle.ts";
import { M5_LONGRUN_POLICY, M5_LONGRUN_DRIVER_PATHS, parseM5LongRunOptions, inspectM5ResourceGuard, inspectM5FrameTarget,
  combineM5LongRunReceipts, inspectM5LongRuns, inspectM5SingleCapture, inspectM5SessionEvidence, withM5FreshBrowser,
  M5_NATURAL_DOM_SETTLE_POLICY, captureM5NaturalDOMSettle,
  createM5SignalAbort, raceM5Abort, createM5ProgressJournal, preserveM5InterruptedCapture } from "./capture-mainline-a-m5-longrun.mjs";

const { createMainlineAR65LongRunReceiptV643, finalizeMainlineAR65LongRunReceiptV643,
  createMainlineAR65LongRunObservationV643, createMainlineAR65LongRunViewportV643,
  createMainlineAR65LongRunResourceCheckpointV643 } =
  longRunModule.default ?? longRunModule;
const { acquireAtlasResource, getAtlasResourceSnapshot } = resourceModule.default ?? resourceModule;
// Deliberately sparse synthetic fixtures: tiny enough for failure-path tests and
// explicitly insufficient for v650/v665. No historical or current browser capture is loaded.
const source = "1".repeat(64);
const build = { status: "passed", sourceStable: true, exitCode: 0, buildId: "test-build",
  runtimeBuildId: `mainline-a-${source.slice(0, 16)}`, branch: "codex/test", head: "a".repeat(40),
  inputBefore: { sha256: source }, inputAfterSha256: source };
const identity = { buildId: build.runtimeBuildId, runtimeBuildId: build.runtimeBuildId,
  branch: build.branch, head: build.head, route: "/", source: "runtime-marker" };
function sparseFixture(device, index) {
  const start = index * 1_900_000;
  const iso = (at) => new Date(start + at).toISOString();
  const releaseBaseline = acquireAtlasResource("model", "atlas", "m5-fixture-base", { owner: "m5-fixture", estimatedBytes: 32 });
  const baseline = getAtlasResourceSnapshot();
  const releaseActive = acquireAtlasResource("texture", "atlas", "m5-fixture-active", { owner: "m5-fixture", estimatedBytes: 1024 });
  const active = getAtlasResourceSnapshot();
  releaseActive();
  const final = getAtlasResourceSnapshot();
  releaseBaseline();
  const viewport = createMainlineAR65LongRunViewportV643({ device, devicePixelRatio: 1,
    width: device === "desktop" ? 1280 : 390, height: device === "desktop" ? 720 : 844 });
  const checkpoint = (snapshot, phase, at) => createMainlineAR65LongRunResourceCheckpointV643(snapshot, phase, at, iso(at));
  return createMainlineAR65LongRunObservationV643({ device, sessionId: `fixture-${device}`, independenceKey: `independent-${device}`,
    viewport, build: identity, startedAt: iso(0), endedAt: iso(1_800_000), observedDurationMs: 1_800_000,
    frameSamples: Array.from({ length: 451 }, (_, i) => ({ atMs: i * 4_000, deltaMs: 16, longTaskMs: 0 })),
    memorySamples: Array.from({ length: 181 }, (_, i) => ({ atMs: i * 10_000, usedBytes: 100_000, totalBytes: 200_000, limitBytes: 1_000_000, source: "performance-memory" })),
    resources: { baseline: checkpoint(baseline, "baseline", 0), active: checkpoint(active, "active", 5_000), final: checkpoint(final, "final", 1_800_000) },
    visibility: { startedVisible: true, endedVisible: true, interruptions: 0, canvasCount: 1, rootVisible: true, documentVisibility: "visible" },
    notes: ["resource-switch-captured", "synthetic-unit-test-not-browser-evidence"] });
}
const observations = ["desktop", "mobile"].map(sparseFixture);
const singles = observations.map((observation) => finalizeMainlineAR65LongRunReceiptV643(
  createMainlineAR65LongRunReceiptV643({ build: identity, observations: [observation] })));
const sessions = observations.map((row, index) => ({ device: row.device,
  browserClosed: true, freshContext: true, priorObservationCount: 0,
  browserLaunchId: `test-browser-${index}`, contextId: `test-context-${index}`,
  launchedAt: row.startedAt, closedAt: row.endedAt, sourceSha256: source,
  runtimeBuildId: build.runtimeBuildId, consoleErrors: [], pageErrors: [] }));
const args = ["--build", "docs/release/test.json", "--origin", "http://127.0.0.1:3150", "--run-id", "20261015-m5long01"];

test("driver pins cover every statically loaded local script dependency", async () => {
  const pinned = new Set(M5_LONGRUN_DRIVER_PATHS);
  assert.equal(pinned.size, M5_LONGRUN_DRIVER_PATHS.length);
  assert.ok(pinned.has("mainline-a-browser-camera-observation.mjs"));
  assert.ok(pinned.has("mainline-a-m5-longrun-workload.mjs"));
  for (const name of pinned) {
    const sourceText = await readFile(new URL(name, import.meta.url), "utf8");
    for (const [, dependency] of sourceText.matchAll(/\bfrom\s+["'](\.\/[^"']+\.mjs)["']/g)) {
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(name), dependency));
      assert.ok(pinned.has(resolved), `${name} loads unpinned local dependency ${resolved}`);
    }
  }
  assert.throws(() => M5_LONGRUN_DRIVER_PATHS.push("mutable.mjs"), TypeError);
});

test("explicit local build, origin and unique run ID are required; duration and thresholds cannot be reduced", () => {
  const config = parseM5LongRunOptions(args);
  assert.equal(config.origin, "http://127.0.0.1:3150");
  assert.equal(config.runId, "20261015-m5long01");
  assert.throws(() => parseM5LongRunOptions(args.slice(2)), /required/);
  assert.throws(() => parseM5LongRunOptions([...args, "--duration", "60000"]), /unknown/);
  assert.throws(() => parseM5LongRunOptions([...args, "--p95", "100"]), /unknown/);
  assert.throws(() => parseM5LongRunOptions([...args, "--run-id", "duplicate"]), /duplicate/);
  for (const origin of ["https://example.org", "http://127.0.0.1:3150/path", "http://user:secret@127.0.0.1:3150"])
    assert.throws(() => parseM5LongRunOptions(args.map((value) => value.startsWith("http:") ? origin : value)), /local-origin/);
  assert.throws(() => parseM5LongRunOptions(args.map((value) => value === "20261015-m5long01" ? "../outside" : value)), /invalid-run-id/);
  assert.equal(M5_LONGRUN_POLICY.minDurationMs, 30 * 60 * 1000);
  assert.throws(() => { M5_LONGRUN_POLICY.targets.mobile.p95MsMax = 100; }, TypeError);
});

test("device selection is optional and cannot reduce the registered two-run qualification policy", () => {
  assert.equal(parseM5LongRunOptions(args).device, null);
  for (const device of ["desktop", "mobile"]) {
    assert.equal(parseM5LongRunOptions([...args, "--device", device]).device, device);
    assert.equal(M5_LONGRUN_POLICY.runs, 2);
    assert.equal(M5_LONGRUN_POLICY.minDurationMs, 1_800_000);
    assert.equal(M5_LONGRUN_POLICY.workload.windows, 6);
    assert.deepEqual(M5_LONGRUN_POLICY.resourceGuard, { intervalMs: 15_000,
      freePhysicalBytesMin: 2 * 1024 ** 3, commitHeadroomBytesMin: 2 * 1024 ** 3, commitHeadroomRatioMin: 0.1 });
  }
  for (const device of ["both", "phone", "Desktop", "", "desktop,mobile"])
    assert.throws(() => parseM5LongRunOptions([...args, "--device", device]), /invalid-device|unknown-or-duplicate/);
  assert.throws(() => parseM5LongRunOptions([...args, "--device", "mobile", "--device", "desktop"]), /duplicate/);
  assert.throws(() => parseM5LongRunOptions([...args, "--devices", "mobile"]), /unknown/);
});

const healthyMemory = { freePhysicalBytes: 3 * 1024 ** 3,
  commitLimitBytes: 32 * 1024 ** 3, committedBytes: 24 * 1024 ** 3 };
test("resource guard retains fixed physical and absolute/proportional commit reserves", () => {
  assert.equal(inspectM5ResourceGuard(healthyMemory).ok, true);
  assert.deepEqual(inspectM5ResourceGuard({ ...healthyMemory, freePhysicalBytes: 1024 ** 3 }).issues,
    ["physical-memory-below-reserve"]);
  assert.deepEqual(inspectM5ResourceGuard({ ...healthyMemory, committedBytes: 31 * 1024 ** 3 }).issues,
    ["commit-headroom-below-reserve"]);
  assert.deepEqual(inspectM5ResourceGuard({ ...healthyMemory, commitLimitBytes: 64 * 1024 ** 3,
    committedBytes: 59 * 1024 ** 3 }).issues, ["commit-headroom-below-reserve"]);
  for (const sample of [null, {}, { ...healthyMemory, committedBytes: NaN },
    { ...healthyMemory, committedBytes: 33 * 1024 ** 3 }])
    assert.equal(inspectM5ResourceGuard(sample).ok, false);
});

function series(fps, p95) { return { frames: { frameBudget: { medianDerivedFps: fps }, quantiles: { p95 } } }; }
test("registered desktop and narrow viewport targets fail independently and never claim renderer FPS", () => {
  assert.equal(inspectM5FrameTarget("desktop", series(55, 33.3)).ok, true);
  assert.equal(inspectM5FrameTarget("desktop", series(54.9, 20)).ok, false);
  assert.equal(inspectM5FrameTarget("desktop", series(60, 33.31)).ok, false);
  assert.equal(inspectM5FrameTarget("mobile", series(30, 50)).ok, true);
  assert.equal(inspectM5FrameTarget("mobile", series(29.9, 40)).ok, false);
  assert.equal(inspectM5FrameTarget("mobile", series(60, 50.1)).ok, false);
  assert.equal(inspectM5FrameTarget("mobile", {}).ok, false);
  const measured = inspectM5FrameTarget("desktop", series(60, 20));
  assert.equal(measured.rendererFpsMeasured, false);
  assert.equal(measured.metric, "browser-animation-frame-interval-not-renderer-fps");
});

test("offline combination preserves original objects while sparse fixtures cannot satisfy the stricter existing gates", () => {
  const before = singles.map((raw) => JSON.stringify(raw));
  const combined = combineM5LongRunReceipts(singles);
  assert.equal(combined.observations[0], singles[0].observations[0]);
  assert.equal(combined.observations[1], singles[1].observations[0]);
  assert.deepEqual(singles.map((raw) => JSON.stringify(raw)), before);
  const report = inspectM5LongRuns(singles, build, source, sessions);
  assert.equal(report.ok, false);
  assert.ok(report.issues.includes("series-undercovered-or-invalid"));
  assert.equal(report.legacy.currentSourceLongRuns, 0);
  assert.equal(report.officialChecksCoveredByLegacy.passed, false);
  assert.equal(report.series.every((entry) => entry.frames.windows.length === 6), true);
  assert.equal(report.series.every((entry) => entry.memory.windows.length === 6), true);
  assert.equal(report.singleBoundaryChecks.every((entry) => entry.ok), true);
  assert.equal(report.rawChecks.every((entry) => entry.issues.includes("samples-incomplete")), true);
  assert.equal(report.boundary.physicalMobile, false);
  assert.equal(report.boundary.productionPerformance, false);
  assert.ok(report.issues.includes("registered-repeat-workload-not-proven"));
  assert.equal(report.workloadChecks.every((entry) => !entry.ok), true);
  assert.equal(report.domCounterReview.ok, false);
  assert.ok(report.issues.includes("DOM-counter-trend-review-required"));
});

test("single-device inspection cannot promote a sparse, short, or source-drifted input or erase its DOM review", () => {
  for (const [index, device] of ["desktop", "mobile"].entries()) {
    const before = JSON.stringify(singles[index]);
    const report = inspectM5SingleCapture(singles[index], device, build, source, sessions[index]);
    assert.equal(report.captureValid, false);
    assert.equal(report.qualifiedLongrun, false);
    assert.equal(report.candidateFreezeAllowed, false);
    assert.equal(report.candidateFreeze, "not-qualified-single-device-capture");
    assert.deepEqual(report.requiredDevices, ["desktop", "mobile"]);
    assert.ok(report.rawCheck.issues.includes("samples-incomplete"));
    assert.equal(report.checks.workload, false);
    assert.equal(report.domCounterReview.ok, false);
    assert.ok(report.reviewIssues.includes("DOM-counter-trend-review-required"));
    assert.equal(report.combined, undefined);
    assert.equal(JSON.stringify(singles[index]), before);
  }
  const short = { ...singles[1], observations: [{ ...singles[1].observations[0], observedDurationMs: 29 * 60 * 1000 }] };
  const changed = inspectM5SingleCapture(short, "mobile", build, "0".repeat(64), sessions[1]);
  assert.ok(changed.rawCheck.issues.includes("observation-invalid"));
  assert.equal(changed.clock.ok, false);
  assert.equal(changed.checks.source, false);
  assert.equal(changed.checks.session, false);
  assert.equal(changed.captureValid, false);
});

test("single capture rejects missing rows, mismatched devices, and forged promotion claims", () => {
  for (const [raw, device] of [[null, "mobile"], [{ ...singles[0], observations: [] }, "desktop"],
    [{ ...singles[0], observations }, "desktop"], [singles[0], "phone"]]) {
    const result = inspectM5SingleCapture(raw, device, build, source, sessions[0]);
    assert.equal(result.captureValid, false);
    assert.equal(result.qualifiedLongrun, false);
    assert.equal(result.candidateFreezeAllowed, false);
  }
  const wrong = inspectM5SingleCapture(singles[0], "mobile", build, source, sessions[0]);
  assert.equal(wrong.rawCheck.ok, false);
  assert.equal(wrong.checks.session, false);
  const forged = { ...singles[1], claims: { ...singles[1].claims, physicalMobile: true } };
  assert.equal(inspectM5SingleCapture(forged, "mobile", build, source, sessions[1]).singleBoundaryCheck.ok, false);
});

function settleRuntime(stateAt = () => ({ longrun: { attached: true, running: true, observationCount: 0 } })) {
  let clock = 0;
  const events = [];
  return { events, runtime: {
    now: () => clock,
    wait: async (ms) => { assert.ok(ms <= 1_000); clock += ms; },
    counters: async () => { events.push("light-counter"); return { status: "observed", sessionDetached: true, documents: 1, nodes: 100, jsEventListeners: 50 }; },
    state: async () => { events.push("read-state"); return stateAt(clock); },
  } };
}

test("natural settle uses five same-session lightweight samples at the registered elapsed times without UI or GC", async () => {
  const { events, runtime } = settleRuntime();
  const saved = [];
  const result = await captureM5NaturalDOMSettle({}, {
    assertRunning() { events.push("guard"); },
    async assertPanelMounted() { events.push("same-panel"); },
    async onSample(sample, index) { saved.push({ sample, index }); events.push("persist"); },
  }, runtime);
  assert.deepEqual(result.samples.map((sample) => sample.actualElapsedMs), [0, 15_000, 30_000, 60_000, 120_000]);
  assert.deepEqual(result.samples.map((sample) => sample.elapsedTargetMs), M5_NATURAL_DOM_SETTLE_POLICY.elapsedTargetsMs);
  assert.equal(result.status, "observed-additional-review-evidence");
  assert.equal(saved.length, 5);
  assert.deepEqual(saved.map((entry) => entry.index), [0, 1, 2, 3, 4]);
  assert.equal(events.filter((event) => event === "same-panel").length, 5);
  assert.equal(events.filter((event) => event === "light-counter").length, 5);
  assert.equal(result.garbageCollectionRequested, false);
  assert.equal(result.qualifiedLongrun, false);
  assert.equal(result.candidateFreezeAllowed, false);
});

test("natural settle retains an observation that ends during waiting and marks the added evidence for review", async () => {
  const { runtime } = settleRuntime((clock) => ({ selectedId: null, longrun: {
    attached: true, running: clock < 60_000, observationCount: clock < 60_000 ? 0 : 1 } }));
  const result = await captureM5NaturalDOMSettle({}, { assertRunning() {}, async assertPanelMounted() {}, async onSample() {} }, runtime);
  assert.equal(result.samples.length, 5);
  assert.equal(result.samples[2].state.longrun.running, true);
  assert.equal(result.samples[3].state.longrun.running, false);
  assert.equal(result.samples[4].state.longrun.observationCount, 1);
  assert.equal(result.status, "review-required");
  assert.equal(result.candidateFreezeAllowed, false);
});

test("natural settle persists completed samples before a guard stop and cannot continue sampling afterward", async () => {
  const { events, runtime } = settleRuntime();
  const saved = [];
  const stop = new Error("resource-protection-stop");
  await assert.rejects(captureM5NaturalDOMSettle({}, {
    assertRunning() { if (saved.length) throw stop; }, async assertPanelMounted() {},
    async onSample(sample) { saved.push(sample); },
  }, runtime), (error) => error === stop);
  assert.equal(saved.length, 1);
  assert.deepEqual(events, ["light-counter", "read-state"]);
});

test("existing late-window review advisories propagate to the M5 freeze decision even when global frame targets pass", () => {
  const changed = observations.map((observation) => createMainlineAR65LongRunObservationV643({ ...observation,
    frameSamples: observation.frameSamples.map((sample) => ({ ...sample, deltaMs: sample.atMs >= 1_200_000 ? 32 : 16 })) }));
  const raw = changed.map((observation) => finalizeMainlineAR65LongRunReceiptV643(
    createMainlineAR65LongRunReceiptV643({ build: identity, observations: [observation] })));
  const report = inspectM5LongRuns(raw, build, source, sessions);
  assert.equal(report.targets.every((row) => row.ok), true);
  assert.equal(report.advisoryReview.ok, false);
  assert.equal(report.candidateFreeze, "review-required");
  assert.ok(report.issues.includes("existing-series-advisory-review-required"));
  assert.equal(report.ok, false);
});

test("raw files with different build identities or missing independent inputs cannot be combined", () => {
  assert.throws(() => combineM5LongRunReceipts([singles[0]]), /two-single-run/);
  assert.throws(() => combineM5LongRunReceipts([singles[0], { ...singles[1], build: { ...singles[1].build, head: "0".repeat(40) } }]), /raw-builds-differ/);
});

test("current source drift remains visible independently of sample coverage", () => {
  const report = inspectM5LongRuns(singles, build, "0".repeat(64), sessions);
  assert.equal(report.ok, false);
  assert.ok(report.legacy.issues.includes("build-source-drift"));
});

test("a forged original raw receipt cannot be laundered through a valid derived receipt", () => {
  const forged = { ...singles[0], claims: { ...singles[0].claims, physicalMobile: true } };
  const report = inspectM5LongRuns([forged, singles[1]], build, source, sessions);
  assert.equal(report.ok, false);
  assert.ok(report.issues.includes("raw-or-clock-invalid"));
  assert.equal(report.singleBoundaryChecks[0].ok, false);
});

test("short observations and clock disagreement remain rejected even when frame targets pass", () => {
  const original = singles[1].observations[0];
  const changed = { ...singles[1], observations: [{ ...original, observedDurationMs: 29 * 60 * 1000 }] };
  const report = inspectM5LongRuns([singles[0], changed], build, source, sessions);
  assert.equal(report.ok, false);
  assert.ok(report.rawChecks[1].issues.includes("observation-invalid"));
  assert.ok(report.clock.issues.includes("observation-1:clock-disagreement"));
  assert.equal(report.targets.every((entry) => entry.ok), true);
});

test("a same-browser viewport resize, unclosed browser, or old archive is not independent capture evidence", () => {
  for (const mutation of [{ browserLaunchId: sessions[0].browserLaunchId },
    { contextId: sessions[0].contextId }, { browserClosed: false }, { priorObservationCount: 1 },
    { launchedAt: sessions[0].launchedAt }, { consoleErrors: ["GPU error"] }]) {
    assert.equal(inspectM5SessionEvidence([sessions[0], { ...sessions[1], ...mutation }], build, source), false);
  }
  assert.equal(inspectM5SessionEvidence(sessions, build, source), true);
});

function fakeLauncher(events, failContext = false, page = {}) {
  return async () => {
    events.push("launch");
    return { async newContext(options) {
      events.push(`context:${options.viewport.width}`);
      if (failContext) throw new Error("context-failed");
      return { async newPage() { return { setDefaultTimeout() {}, on() {}, ...page }; },
        async close() { events.push("context-close"); } };
    }, async close() { events.push("browser-close"); } };
  };
}
test("two sequential captures launch two browsers and contexts and close each before the next launch", async () => {
  const events = [];
  const results = [];
  for (const device of ["desktop", "mobile"]) results.push(await withM5FreshBrowser(
    { chrome: "test-browser" }, device, async () => { events.push("task"); return device; }, fakeLauncher(events)));
  assert.deepEqual(events, ["launch", "context:1280", "task", "context-close", "browser-close",
    "launch", "context:390", "task", "context-close", "browser-close"]);
  assert.equal(results.every((entry) => entry.session.browserClosed), true);
  assert.notEqual(results[0].session.browserLaunchId, results[1].session.browserLaunchId);
  assert.notEqual(results[0].session.contextId, results[1].session.contextId);
  assert.equal(results[1].session.context.isMobile, true);
  assert.equal(results[1].session.context.hasTouch, true);
  assert.equal(results[1].session.launch.handleSIGINT, false);
  assert.equal(results[1].session.launch.handleSIGTERM, false);
});
test("resource or capture failures close only the owned browser and context", async () => {
  const events = [];
  await assert.rejects(() => withM5FreshBrowser({ chrome: "test-browser" }, "desktop",
    async () => { throw new Error("resource-protection-stop"); }, fakeLauncher(events)), /resource-protection-stop/);
  assert.deepEqual(events, ["launch", "context:1280", "context-close", "browser-close"]);
  const failedContext = [];
  await assert.rejects(() => withM5FreshBrowser({ chrome: "test-browser" }, "desktop",
    async () => {}, fakeLauncher(failedContext, true)), /context-failed/);
  assert.deepEqual(failedContext, ["launch", "context:1280", "browser-close"]);
});

async function tempDirectory(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "mainline-a-m5-unit-"));
  t.after(async () => {
    // Remove only the exact test-owned directory returned by mkdtemp.
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith("mainline-a-m5-unit-"));
    await rm(directory, { recursive: true });
  });
  return directory;
}

test("signal ownership aborts once, preserves exit semantics, and unregisters listeners", async () => {
  for (const [name, exitCode] of [["SIGINT", 130], ["SIGTERM", 143]]) {
    const target = new EventEmitter();
    const unrelated = () => {};
    target.on(name, unrelated);
    const owner = createM5SignalAbort(target);
    const pending = raceM5Abort(new Promise(() => {}), owner.signal);
    target.emit(name);
    const reason = owner.signal.reason;
    target.emit(name === "SIGINT" ? "SIGTERM" : "SIGINT");
    await assert.rejects(pending, (error) => error === reason && error.signal === name && error.exitCode === exitCode);
    assert.equal(getEventListeners(owner.signal, "abort").length, 0);
    owner.dispose(); owner.dispose();
    assert.equal(target.listenerCount(name), 1);
    assert.equal(target.listenerCount(name === "SIGINT" ? "SIGTERM" : "SIGINT"), 0);
    assert.equal(await raceM5Abort(Promise.resolve("done"), new AbortController().signal), "done");
  }
});

test("progress remains readable before finalization and serializes simultaneous bounded checkpoints", async (t) => {
  const directory = await tempDirectory(t);
  const journal = await createM5ProgressJournal(directory);
  await Promise.all([journal.append({ kind: "resource-guard", freePhysicalBytes: 3 * 1024 ** 3 }),
    journal.append({ kind: "raw-saved", rawPin: { path: "desktop-browser-raw.json", sha256: "a".repeat(64) } }),
    journal.append({ kind: "offline-verification-started" })]);
  const rows = (await readFile(path.join(directory, "progress.jsonl"), "utf8")).trim().split("\n").map(JSON.parse);
  assert.deepEqual(rows.map((row) => row.sequence), [1, 2, 3]);
  assert.equal(rows.at(-1).kind, "offline-verification-started");
  assert.equal(rows.some((row) => "frameSamples" in row), false);
  await assert.rejects(() => createM5ProgressJournal(directory), { code: "EEXIST" });
  await journal.flush();
});

// Synthetic normal-UI state machine: a receipt does not gain a row until the
// asynchronous abort publication is awaited. These fixtures are never long-run evidence.
function interruptedPage(events, { modalOpen = false, docked = false, active = true,
  initialRaw = { observations: [], fixtureOnly: true }, waitError = null,
  pageInvalid = false, finalReadError = null } = {}) {
  const state = { modalOpen, docked, active, raw: structuredClone(initialRaw),
    pendingAbort: false, reads: 0 };
  const assertLive = () => { if (pageInvalid) throw new Error("fixture-page-closed"); };
  const assertEnter = (key, options) => { assert.equal(key, "Enter"); assert.equal(options?.timeout, 3_000); };
  const control = (name) => ({
    async isVisible() {
      assertLive();
      if (name === "关闭观测图放大") return state.modalOpen;
      if (name === "中止并留账") return state.active && !state.modalOpen && !state.docked;
      if (name === "展开性能观察面板") return state.docked && !state.modalOpen;
      throw new Error(`unexpected fixture control ${name}`);
    },
    async press(key, options) {
      assertLive(); assertEnter(key, options);
      if (name === "关闭观测图放大") {
        assert.equal(state.modalOpen, true); events.push("viewer-close"); state.modalOpen = false;
      } else if (name === "展开性能观察面板") {
        assert.equal(state.modalOpen, false); assert.equal(state.docked, true);
        events.push("panel-expand"); state.docked = false;
      } else if (name === "中止并留账") {
        assert.equal(state.modalOpen, false); assert.equal(state.docked, false); assert.equal(state.active, true);
        events.push("ui-abort"); state.active = false; state.pendingAbort = true;
      } else throw new Error(`unexpected fixture control ${name}`);
    },
  });
  const page = {
    locator(selector) {
      assert.ok(["dialog[data-mainline-a-nebula-viewer]", '[data-mainline-a-performance="v625"]',
        "[data-mainline-a-r65-longrun]"].includes(selector), `unexpected fixture selector ${selector}`);
      return {
        getByRole(role, options) { assert.equal(role, "button"); assert.equal(options.exact, true); return control(options.name); },
        async getAttribute(name) {
          assertLive();
          if (name === "data-mainline-a-performance-docked") return String(state.docked);
          if (name === "data-mainline-a-r65-longrun-status") return state.active ? "running" : "blocked";
          throw new Error(`unexpected fixture attribute ${name}`);
        },
      };
    },
    getByRole(role, options) { assert.equal(role, "button"); assert.equal(options.exact, true); return control(options.name); },
    async evaluate(callback) {
      assertLive(); state.reads += 1;
      if (finalReadError && state.reads > 1) throw finalReadError;
      const value = runInNewContext(`(${callback.toString()})()`,
        { window: { __mainlineAR65LongRunReceiptV643: state.raw } });
      events.push(`read-raw:${value?.observations?.length ?? "null"}`);
      return structuredClone(value);
    },
    async waitForFunction(predicate, count, options) {
      assertLive(); assert.equal(options?.timeout, 10_000); assert.equal(state.pendingAbort, true);
      assert.equal(count, state.raw.observations.length, "wait must start after the existing observation count");
      const invoke = () => runInNewContext(`(${predicate.toString()})(count)`,
        { count, window: { __mainlineAR65LongRunReceiptV643: state.raw } });
      assert.equal(invoke(), false, "the old receipt is not the newly aborted observation");
      events.push("wait-for-observation");
      if (waitError) throw waitError;
      await Promise.resolve(); // Simulate the UI publishing in a later asynchronous turn.
      state.raw.observations.push({ status: "blocked", observedDurationMs: 12_000,
        notes: ["user-aborted-observation"], fixtureOnly: true });
      state.pendingAbort = false; events.push("published-observation");
      assert.equal(invoke(), true);
    },
  };
  return { page, state };
}

test("SIGINT closes the modal, expands docked controls, and awaits UI-aborted raw before closing its owned browser", async (t) => {
  const directory = await tempDirectory(t);
  const target = new EventEmitter();
  const owner = createM5SignalAbort(target);
  t.after(owner.dispose);
  const events = [];
  const { page, state } = interruptedPage(events, { modalOpen: true, docked: true });
  let originalError;
  await assert.rejects(() => withM5FreshBrowser({ chrome: "fixture" }, "desktop", async (ownedPage, session) => {
    const pending = raceM5Abort(new Promise(() => {}), owner.signal);
    target.emit("SIGINT");
    try { await pending; } catch (error) {
      originalError = error;
      await preserveM5InterruptedCapture(ownedPage, directory, "desktop", session, error);
      assert.deepEqual(JSON.parse(await readFile(path.join(directory, "desktop-interrupted-browser-raw.json"), "utf8")), state.raw);
      await access(path.join(directory, "desktop-interrupted-session.json"));
      events.push("raw-persisted");
      throw error;
    }
  }, fakeLauncher(events, false, page)), (error) => error === originalError && error.signal === "SIGINT");
  assert.deepEqual(events, ["launch", "context:1280", "viewer-close", "panel-expand", "read-raw:0", "ui-abort",
    "wait-for-observation", "published-observation", "read-raw:1", "raw-persisted", "context-close", "browser-close"]);
  assert.equal(state.raw.observations[0].status, "blocked");
  const session = JSON.parse(await readFile(path.join(directory, "desktop-interrupted-session.json"), "utf8"));
  assert.equal(session.signal, "SIGINT");
  assert.equal(session.rawAlreadySaved, false);
  assert.equal(session.sessionSnapshotScope, "before-owned-browser-close");
  assert.equal(session.browserClosed, false);
  assert.equal(session.rawCapture.abortAttempted, true);
  assert.equal(session.rawCapture.preObservationCount, 0);
  assert.equal(session.rawCapture.postObservationCount, 1);
  assert.equal(session.rawCapture.settled, true);
  assert.equal(session.rawCapture.status, "aborted-observation-published");
  assert.deepEqual(session.rawCapture.errors, []);
});

test("interruption awaits a new aborted row even when an older observation already exists", async (t) => {
  const directory = await tempDirectory(t);
  const initialRaw = { observations: [{ status: "blocked", fixtureOnly: true, sessionId: "older-fixture" }], fixtureOnly: true };
  const events = [];
  const { page, state } = interruptedPage(events, { initialRaw });
  await preserveM5InterruptedCapture(page, directory, "desktop", {}, new Error("resource-protection-stop"));
  assert.deepEqual(state.raw.observations[0], initialRaw.observations[0]);
  assert.equal(state.raw.observations.length, 2);
  assert.deepEqual(events, ["read-raw:1", "ui-abort", "wait-for-observation", "published-observation", "read-raw:2"]);
  const session = JSON.parse(await readFile(path.join(directory, "desktop-interrupted-session.json"), "utf8"));
  assert.equal(session.rawCapture.preObservationCount, 1);
  assert.equal(session.rawCapture.postObservationCount, 2);
  assert.equal(session.rawCapture.settled, true);
});

test("an idle panel retains its existing receipt without manufacturing an aborted observation", async (t) => {
  const directory = await tempDirectory(t);
  const events = [];
  const initialRaw = { observations: [], fixtureOnly: true };
  const { page, state } = interruptedPage(events, { active: false, initialRaw });
  await preserveM5InterruptedCapture(page, directory, "mobile", {}, new Error("pre-warmup-stop"));
  assert.deepEqual(state.raw, initialRaw);
  assert.deepEqual(events, ["read-raw:0", "read-raw:0"]);
  assert.deepEqual(JSON.parse(await readFile(path.join(directory, "mobile-interrupted-browser-raw.json"), "utf8")), initialRaw);
  const session = JSON.parse(await readFile(path.join(directory, "mobile-interrupted-session.json"), "utf8"));
  assert.equal(session.rawCapture.abortAttempted, false);
  assert.equal(session.rawCapture.preObservationCount, 0);
  assert.equal(session.rawCapture.postObservationCount, 0);
  assert.equal(session.rawCapture.settled, false);
  assert.equal(session.rawCapture.status, "no-visible-running-observation");
  assert.deepEqual(session.rawCapture.errors, []);
});

test("abort publication timeout preserves the surviving raw and original resource failure with cleanup diagnostics", async (t) => {
  const directory = await tempDirectory(t);
  const events = [];
  const { page, state } = interruptedPage(events, { docked: true, waitError: new Error("fixture-wait-timeout") });
  const originalError = new Error("resource-protection-stop:physical-memory-below-reserve");
  await assert.rejects(() => withM5FreshBrowser({ chrome: "fixture" }, "mobile", async (ownedPage, session) => {
    await preserveM5InterruptedCapture(ownedPage, directory, "mobile", session, originalError);
    assert.deepEqual(JSON.parse(await readFile(path.join(directory, "mobile-interrupted-browser-raw.json"), "utf8")), state.raw);
    events.push("raw-persisted");
    throw originalError;
  }, fakeLauncher(events, false, page)), (error) => error === originalError);
  assert.deepEqual(events, ["launch", "context:390", "panel-expand", "read-raw:0", "ui-abort", "wait-for-observation",
    "read-raw:0", "raw-persisted", "context-close", "browser-close"]);
  const session = JSON.parse(await readFile(path.join(directory, "mobile-interrupted-session.json"), "utf8"));
  assert.equal(session.error, originalError.message);
  assert.equal(session.sessionSnapshotScope, "before-owned-browser-close");
  assert.equal(session.browserClosed, false);
  assert.equal(session.rawCapture.abortAttempted, true);
  assert.equal(session.rawCapture.settled, false);
  assert.equal(session.rawCapture.status, "cleanup-incomplete-surviving-receipt-only");
  assert.equal(session.rawCapture.preObservationCount, 0);
  assert.equal(session.rawCapture.postObservationCount, 0);
  assert.ok(session.rawCapture.errors.some((message) => message.includes("fixture-wait-timeout")));
});

test("an invalidated page still saves a null surviving receipt and cleanup diagnostics without replacing the original error", async (t) => {
  const directory = await tempDirectory(t);
  const { page } = interruptedPage([], { pageInvalid: true });
  const originalError = Object.assign(new Error("interrupted:SIGTERM"), { signal: "SIGTERM" });
  const pin = await preserveM5InterruptedCapture(page, directory, "desktop", {}, originalError);
  assert.equal(JSON.parse(await readFile(path.join(directory, "desktop-interrupted-browser-raw.json"), "utf8")), null);
  const session = JSON.parse(await readFile(path.join(directory, "desktop-interrupted-session.json"), "utf8"));
  assert.deepEqual(session.rawPin, pin);
  assert.equal(session.error, originalError.message);
  assert.equal(session.signal, "SIGTERM");
  assert.equal(session.rawCapture.abortAttempted, false);
  assert.equal(session.rawCapture.settled, false);
  assert.equal(session.rawCapture.status, "cleanup-incomplete-surviving-receipt-only");
  assert.equal(session.rawCapture.postObservationCount, null);
  assert.ok(session.rawCapture.errors.some((message) => message.includes("fixture-page-closed")));
});

test("final receipt read failure after abort settlement is recorded instead of claiming an intact published raw", async (t) => {
  const directory = await tempDirectory(t);
  const { page } = interruptedPage([], { finalReadError: new Error("fixture-final-receipt-unavailable") });
  await preserveM5InterruptedCapture(page, directory, "desktop", {}, new Error("resource-protection-stop"));
  assert.equal(JSON.parse(await readFile(path.join(directory, "desktop-interrupted-browser-raw.json"), "utf8")), null);
  const session = JSON.parse(await readFile(path.join(directory, "desktop-interrupted-session.json"), "utf8"));
  assert.equal(session.rawCapture.abortAttempted, true);
  assert.equal(session.rawCapture.postObservationCount, null);
  assert.equal(session.rawCapture.status, "cleanup-incomplete-surviving-receipt-only");
  assert.ok(session.rawCapture.errors.some((message) => message.includes("fixture-final-receipt-unavailable")));
});

test("an already persisted completed raw is referenced without recapture or replacement on interruption", async (t) => {
  const directory = await tempDirectory(t);
  const completedRawPin = { path: "desktop-browser-raw.json", sha256: "b".repeat(64), bytes: 20 };
  const page = new Proxy({}, { get(_target, key) { throw new Error(`completed raw must bypass all UI reads: ${String(key)}`); } });
  const error = Object.assign(new Error("interrupted"), { signal: "SIGTERM" });
  assert.equal(await preserveM5InterruptedCapture(page, directory, "desktop", {}, error, completedRawPin), completedRawPin);
  await assert.rejects(() => access(path.join(directory, "desktop-interrupted-browser-raw.json")), { code: "ENOENT" });
  const session = JSON.parse(await readFile(path.join(directory, "desktop-interrupted-session.json"), "utf8"));
  assert.equal(session.rawAlreadySaved, true);
  assert.deepEqual(session.rawPin, completedRawPin);
  assert.equal(session.rawCapture.status, "already-persisted");
  assert.equal(session.rawCapture.abortAttempted, false);
  assert.equal(session.rawCapture.preObservationCount, null);
  assert.equal(session.rawCapture.postObservationCount, null);
  assert.deepEqual(session.rawCapture.errors, []);
});

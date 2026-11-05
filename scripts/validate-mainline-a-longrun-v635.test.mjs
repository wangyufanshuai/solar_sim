import test from "node:test";
import assert from "node:assert/strict";
import { evaluateMainlineALongRunV635 } from "./validate-mainline-a-longrun-v635.mjs";

// Deliberate unit inputs exercise validation; none is an observed browser run.
const expectedBuild = { runtimeBuildId: "mainline-a-unit", branch: "codex/test", head: "a".repeat(40), receiptSha256: "b".repeat(64) };
function replay(index = 0) {
  const started = Date.parse("2026-09-27T00:00:00.000Z") + index * 3_600_000;
  return {
    schema: "mainline-a-resource-observation-replay-v633", status: "measured-local", issues: [],
    runId: `unit-not-browser-${index}`, rawSha256: String(index + 1).repeat(64), expectedSha256: String(index + 1).repeat(64),
    buildReceiptSha256: expectedBuild.receiptSha256,
    build: { buildId: expectedBuild.runtimeBuildId, branch: expectedBuild.branch, head: expectedBuild.head },
    baselineRestored: true, resourceReleaseObserved: true, acquiredCount: 8, releasedCount: 8, retainedCount: 0,
    registryEstimatedBytesDelta: 0, physicalGpuMemoryClaim: false, scientificPayloadWriteback: false,
    observationSummary: {
      validated: true, startedAt: new Date(started).toISOString(), endedAt: new Date(started + 1_800_000).toISOString(),
      durationMs: 1_800_000, requestedDurationMs: 1_800_000, device: "desktop",
      viewport: { width: 1280, height: 720, devicePixelRatio: 1, device: "desktop" },
      visibility: { startedVisible: true, endedVisible: true, interruptions: 0 },
      sessionState: "finished", durationSatisfied: true, sessionIssues: [],
      frameSummarySource: "requestAnimationFrame", frameSummaryMethod: "exact-samples",
      frameSummary: { sampleCount: 108000, totalMs: 1_800_000, minMs: 10, p50Ms: 16, p95Ms: 20, maxMs: 30 },
      timeline: [
        { elapsedMs: 0, event: "baseline", scene: "atlas" },
        { elapsedMs: 900_000, event: "active", scene: "inspect" },
        { elapsedMs: 1_800_000, event: "returned", scene: "atlas" },
        { elapsedMs: 1_800_000, event: "finished", scene: "atlas" },
      ],
      checkpoints: ["baseline", "active", "returned"].map((phase, i) => ({
        phase, capturedAt: new Date(started + i * 900_000).toISOString(), elapsedMs: i * 900_000, scene: i === 1 ? "inspect" : "atlas",
      })),
    },
  };
}
function evaluate(replays = [replay(0), replay(1)], extra = {}) {
  return evaluateMainlineALongRunV635({ replays, expectedBuild, browserDevices: { desktop: true }, ...extra });
}

test("valid independent local replays meet the contract without approval claims", () => {
  const value = evaluate();
  assert.equal(value.status, "measured-local");
  assert.equal(value.runCount, 2);
  assert.equal(value.totalDurationMs, 3_600_000);
  assert.equal(value.boundary.scientificPayloadWriteback, false);
  assert.match(value.limits.scope, /not production performance/u);
  assert.deepEqual(value.issues, []);
});

test("no evidence is not-run and one run is insufficient", () => {
  assert.equal(evaluate([]).status, "not-run");
  assert.ok(evaluate([replay()]).issues.includes("long-run:two-independent-runs-required"));
  assert.equal(evaluate([replay()]).status, "blocked");
});

for (const [name, mutate, issue] of [
  ["aborted run", (r) => { r.observationSummary.sessionState = "aborted"; }, "session-incomplete"],
  ["unfulfilled duration", (r) => { r.observationSummary.durationSatisfied = false; }, "session-incomplete"],
  ["session issues", (r) => { r.observationSummary.sessionIssues.push("binding-changed"); }, "session-incomplete"],
  ["hidden interruption", (r) => { r.observationSummary.visibility.interruptions = 1; }, "visibility-not-continuous"],
  ["invisible endpoint", (r) => { r.observationSummary.visibility.endedVisible = false; }, "visibility-not-continuous"],
  ["invented renderer timing", (r) => { r.observationSummary.frameSummarySource = "renderer"; }, "raf-provenance-invalid"],
  ["insufficient RAF coverage", (r) => { r.observationSummary.frameSummary.totalMs = 1_200_000; }, "raf-coverage-insufficient"],
  ["false summary validation", (r) => { r.observationSummary.validated = false; }, "validated-summary-missing"],
  ["forged raw digest", (r) => { r.rawSha256 = "invalid"; }, "raw-or-build-digest-invalid"],
  ["unmatched raw digest", (r) => { r.rawSha256 = "c".repeat(64); }, "raw-or-build-digest-invalid"],
  ["another receipt", (r) => { r.buildReceiptSha256 = "c".repeat(64); }, "raw-or-build-digest-invalid"],
  ["another runtime", (r) => { r.build.buildId = "other-runtime"; }, "build-mismatch"],
  ["another head", (r) => { r.build.head = "c".repeat(40); }, "build-mismatch"],
  ["retained resource", (r) => { r.retainedCount = 1; }, "resource-baseline-not-restored"],
  ["baseline drift", (r) => { r.baselineRestored = false; }, "resource-baseline-not-restored"],
  ["resource reuse without observed release", (r) => { r.resourceReleaseObserved = false; }, "resource-baseline-not-restored"],
  ["no acquired resource", (r) => { r.acquiredCount = 0; }, "resource-baseline-not-restored"],
  ["no released resource", (r) => { r.releasedCount = 0; }, "resource-baseline-not-restored"],
  ["physical GPU claim", (r) => { r.physicalGpuMemoryClaim = true; }, "resource-baseline-not-restored"],
  ["forged physical device", (r) => { r.observationSummary.device = "physical-mobile"; }, "device-unverified"],
  ["missing timeline", (r) => { r.observationSummary.timeline = null; }, "continuous-timeline-missing"],
  ["hidden timeline event", (r) => { r.observationSummary.timeline[1].event = "hidden"; }, "continuous-timeline-invalid"],
  ["partial timeline span", (r) => { r.observationSummary.timeline.at(-1).elapsedMs -= 1000; }, "timeline-span-invalid"],
  ["missing replayed checkpoints", (r) => { r.observationSummary.checkpoints = []; }, "timeline-checkpoints-missing"],
  ["different active timeline scene", (r) => { r.observationSummary.timeline[1].scene = "scene-lab"; }, "timeline-checkpoint-mismatch"],
  ["different active timeline time", (r) => { r.observationSummary.timeline[1].elapsedMs -= 1000; }, "timeline-checkpoint-mismatch"],
  ["different checkpoint wall time", (r) => { r.observationSummary.checkpoints[1].capturedAt = "2026-09-27T00:15:00.000Z"; }, "timeline-checkpoint-mismatch"],
  ["fixture replay", (r) => { r.fixture = true; }, "fixture-not-admitted"],
]) {
  test(`rejects ${name}`, () => {
    const second = replay(1);
    mutate(second);
    const result = evaluate([replay(), second]);
    assert.equal(result.status, "blocked");
    assert.ok(result.issues.some((value) => value.endsWith(issue)), JSON.stringify(result.issues));
  });
}

test("short observed or requested durations cannot be labeled a long run", () => {
  for (const requestedOnly of [true, false]) {
    const second = replay(1);
    second.observationSummary.requestedDurationMs = 30_000;
    if (!requestedOnly) {
      second.observationSummary.durationMs = 30_000;
      second.observationSummary.endedAt = new Date(Date.parse(second.observationSummary.startedAt) + 30_000).toISOString();
    }
    assert.ok(evaluate([replay(), second]).issues.includes("run:1:duration-under-thirty-minutes-or-inconsistent"));
  }
});

test("duplicate raw references and reused run IDs cannot count as repeated runs", () => {
  const repeated = evaluate([replay(), replay()]);
  assert.ok(repeated.issues.includes("long-run:duplicate-run-id"));
  assert.ok(repeated.issues.includes("long-run:duplicate-raw-sha256"));
  const renamed = replay(1);
  renamed.rawSha256 = renamed.expectedSha256 = replay().rawSha256;
  assert.ok(evaluate([replay(), renamed]).issues.includes("long-run:duplicate-raw-sha256"));
});

test("independent chronology is checked after sorting, with overlap rejected", () => {
  assert.equal(evaluate([replay(1), replay()]).status, "measured-local");
  const second = replay(1);
  second.observationSummary.startedAt = "2026-09-27T00:20:00.000Z";
  second.observationSummary.endedAt = "2026-09-27T00:50:00.000Z";
  assert.ok(evaluate([replay(), second]).issues.includes("long-run:overlapping-runs"));
});

test("different viewport or simulated-device runs cannot be mixed into repetition", () => {
  const second = replay(1);
  second.observationSummary.viewport.width = 1440;
  assert.ok(evaluate([replay(), second]).issues.includes("long-run:device-or-viewport-changed"));
});

test("repetition preserves the scene cycle and any verified canonical target", () => {
  const second = replay(1);
  second.observationSummary.timeline[1].scene = "scene-lab";
  assert.ok(evaluate([replay(), second]).issues.includes("long-run:repeated-scenario-mismatch"));
  const one = replay();
  const two = replay(1);
  one.observationSummary.objectCycle = { mode: "canonical-object", target: { kind: "star", id: "sirius" } };
  two.observationSummary.objectCycle = { mode: "canonical-object", target: { kind: "star", id: "vega" } };
  assert.ok(evaluate([one, two]).issues.includes("long-run:repeated-scenario-mismatch"));
});

test("a matching browser device and nonfixture origin remain required", () => {
  assert.equal(evaluate(undefined, { browserDevices: { desktop: false } }).status, "blocked");
  assert.equal(evaluate(undefined, { fixture: true }).status, "blocked");
  const mobile = [replay(), replay(1)].map((r) => {
    r.observationSummary.device = r.observationSummary.viewport.device = "mobile-simulated";
    return r;
  });
  assert.equal(evaluate(mobile).status, "blocked");
  assert.equal(evaluate(mobile, { browserDevices: { mobileViewport: true } }).status, "measured-local");
});

test("oversized, absent and malformed replay collections fail closed", () => {
  assert.ok(evaluate(Array.from({ length: 33 }, () => replay())).issues.includes("long-run:too-many-runs"));
  assert.ok(evaluateMainlineALongRunV635({ expectedBuild }).issues.includes("long-run:replay-list-invalid"));
  assert.equal(evaluate([null, { status: "measured-local" }]).status, "blocked");
});
